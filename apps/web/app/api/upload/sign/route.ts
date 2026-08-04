export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { actorOf, UNAUTHENTICATED } from '@/lib/auth/ownership'
import { hitRateLimit, tooMany } from '@/lib/auth/rate-limit'
import {
  ALLOWED_TYPES, capFor, rateOpts, resolvePath, sniff,
} from '@/lib/upload/policy'

/* ─────────────────────────────────────────────────────────────
   آپلودِ مستقیم — سرور فقط مجوز می‌دهد، بایت‌ها از آن نمی‌گذرند.

   ── چرا لازم شد ──
   مسیرِ `/api/upload` کلِ فایل را از یک تابعِ serverless عبور می‌داد.
   اندازه‌گیریِ واقعی روی سایتِ زنده نشان داد سقفِ عملی آن‌جا حدودِ
   چهار مگابایت است:

       ۳ MB → 200 ·  ۴٫۴ MB → 413 ·  ۸ MB → 413 ·  ۱۲ MB → 413

   یعنی عددِ ۲۰۰ مگابایتیِ داخلِ کد هیچ‌وقت شدنی نبود و کاربر پس از
   انتظاری طولانی خطایی می‌گرفت که حتی از کدِ ما نمی‌آمد.

   ── چه چیزی عوض *نشد* ──
   همه‌ی بررسی‌ها سرِ جایشان‌اند و همه پیش از صدورِ مجوز انجام می‌شوند:
   نشست، محدودیتِ نرخ، پیشوندِ مجاز، پیمایشِ مسیر، مالکیتِ باشگاه و
   مدرک. مجوز برای یک مسیرِ مشخص صادر می‌شود، نه برای باکت.

   ── چه چیزی جابه‌جا شد ──
   تشخیصِ نوع از روی بایت‌ها. پیش‌تر سرور بایت‌ها را در دست داشت؛ حالا
   ندارد. پس همان بررسی به *بعد از* آپلود منتقل شده: مسیرِ `confirm`
   چند کیلوبایتِ اولِ فایل را می‌خواند، امضایش را می‌سنجد و اگر جعلی
   بود خودِ فایل را پاک می‌کند.

   دو محافظِ دیگر هم زیرِ این هستند و به کد وابسته نیستند:
   سقفِ حجمِ خودِ باکت (مهاجرتِ ۰۴۷) و اینکه توکن فقط برای همان یک
   مسیر معتبر است.
   ───────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 })

  const rl = await hitRateLimit(req, rateOpts, actor.id)
  if (!rl.ok) return tooMany(rl.retryAfterSec)

  const b = await req.json().catch(() => ({})) as Record<string, unknown>
  const rawPath = String(b.path ?? '')
  const contentType = String(b.contentType ?? '').toLowerCase().split(';')[0]!.trim()
  const size = Number(b.size ?? 0)

  const ext = ALLOWED_TYPES[contentType]
  if (!ext) {
    return NextResponse.json({ message: 'فرمت فایل پشتیبانی نمی‌شود' }, { status: 415 })
  }

  /* حجم پیش از آپلود بررسی می‌شود تا کاربر ۲۰ مگابایت نفرستد و بعد رد
     شود. این عدد از کلاینت می‌آید و قابلِ دروغ‌گفتن است — سقفِ واقعی
     را خودِ باکت اعمال می‌کند، این فقط ادب است. */
  const cap = capFor(contentType)
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ message: 'حجم فایل مشخص نیست' }, { status: 400 })
  }
  if (size > cap) {
    return NextResponse.json(
      { message: `حجم فایل نباید بیشتر از ${Math.round(cap / 1024 / 1024)} مگابایت باشد` },
      { status: 413 },
    )
  }

  const v = await resolvePath(rawPath, actor.id)
  if (!v.ok) return NextResponse.json({ message: v.message }, { status: v.status ?? 400 })

  /* پسوند از نوعِ اعلام‌شده ساخته می‌شود، نه از نامِ ورودی. اگر آن نوع
     دروغ باشد، `confirm` فایل را پاک می‌کند. */
  const path = `${v.path!.replace(/\.[A-Za-z0-9]{1,5}$/, '')}.${ext}`

  const { data, error } = await getSupabaseServer().storage
    .from(v.bucket!)
    /* بازنویسی فقط جایی که مالکیت بررسی شد — همان قاعده‌ی `/api/upload` */
    .createSignedUploadUrl(path, { upsert: v.ownerChecked === true })

  if (error || !data) {
    /* مسیری که از قبل فایل دارد و بازنویسی‌اش مجاز نیست، ردِ عمدی است
       نه خطای سرور. بدونِ این تفکیک، کاربر «خطای سرور» می‌دید و
       لاگ هم پر از هشدارِ بی‌مورد می‌شد. */
    if (/exist|duplicate|409/i.test(error?.message ?? '')) {
      return NextResponse.json(
        { message: 'فایلی با همین نام از قبل هست؛ نام دیگری انتخاب کنید' },
        { status: 409 },
      )
    }
    console.error('[upload/sign]', error?.message)
    return NextResponse.json({ message: 'صدور مجوز آپلود انجام نشد' }, { status: 500 })
  }

  return NextResponse.json(
    { path, token: data.token, bucket: v.bucket, maxBytes: cap },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

/* ── بررسیِ پس از آپلود ──

   کلاینت بعد از تمام‌شدنِ آپلود این را صدا می‌زند. سرور چند کیلوبایتِ
   اول را می‌خواند و امضای بایتی را می‌سنجد. اگر فایل چیزی جز آنچه
   ادعا شده باشد — یا اصلاً قالبِ مجاز نباشد — همان‌جا پاک می‌شود.

   نبودنِ این مرحله یعنی هر کاربرِ واردشده می‌تواند هر فایلی با پسوندِ
   عکس در باکت بگذارد. */
export async function PUT(req: NextRequest) {
  const actor = await actorOf(req)
  if (!actor) return NextResponse.json(UNAUTHENTICATED, { status: 401 })

  const b = await req.json().catch(() => ({})) as Record<string, unknown>
  const rawPath = String(b.path ?? '')

  /* همان بررسیِ مالکیت — وگرنه می‌شد فایلِ کسِ دیگری را با ادعای
     «نامعتبر است» پاک کرد. */
  const v = await resolvePath(rawPath.replace(/\.[A-Za-z0-9]{1,5}$/, ''), actor.id)
  if (!v.ok) return NextResponse.json({ message: v.message }, { status: v.status ?? 400 })

  const sb = getSupabaseServer()
  const path = String(rawPath).split('/').filter(Boolean).join('/')

  const { data: blob, error } = await sb.storage.from(v.bucket!).download(path)
  if (error || !blob) {
    return NextResponse.json({ message: 'فایل پیدا نشد' }, { status: 404 })
  }

  const head = Buffer.from(await blob.slice(0, 64).arrayBuffer())
  const kind = sniff(head)
  const okSize = blob.size <= capFor(kind?.mime ?? 'image/jpeg')

  if (!kind || !okSize) {
    await sb.storage.from(v.bucket!).remove([path])
    return NextResponse.json(
      { message: kind ? 'حجم فایل بیش از حد مجاز است' : 'فرمت فایل پشتیبانی نمی‌شود' },
      { status: kind ? 413 : 415 },
    )
  }

  if (v.bucket !== 'club-media') {
    return NextResponse.json({ path, mime: kind.mime, private: true })
  }
  const { data: pub } = sb.storage.from('club-media').getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl, path, mime: kind.mime })
}
