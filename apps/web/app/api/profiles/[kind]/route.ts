export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';
import { checkProfileData } from '@/lib/profiles/validate';
import {
  PROFILE_KINDS, getProfileByOwner, getProfileBySlug, listProfiles, saveProfile,
  type ProfileKind,
} from '@/lib/profiles/server';

/* پروفایل‌های نقش‌ها — فروشگاه، تولیدکننده و بقیه.
   GET  ?slug=  یک پروفایل | ?mine=1 پروفایل خودم | بدون هیچ‌کدام: فهرست
   POST ذخیره‌ی پروفایل خودم (ساخت یا به‌روزرسانی) */

const kindOf = (v: string): ProfileKind | null =>
  (PROFILE_KINDS as string[]).includes(v) ? (v as ProfileKind) : null;

const str = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);

export async function GET(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const kind = kindOf((await ctx.params).kind);
  if (!kind) return NextResponse.json({ message: 'نوع پروفایل نامعتبر است' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const mine = searchParams.get('mine') === '1';

  if (mine) {
    const actor = actorFromRequest(req);
    if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
    const p = await getProfileByOwner(kind, actor.id);
    return NextResponse.json({ profile: p }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (slug) {
    const p = await getProfileBySlug(kind, slug);
    if (!p) return NextResponse.json({ message: 'پیدا نشد' }, { status: 404 });
    const actor = actorFromRequest(req);
    /* پروفایل تأییدنشده را فقط صاحبش و ادمین می‌بینند */
    if (p.status !== 'approved') {
      const allowed = !!actor && (actor.id === p.ownerId || (await isAdmin(actor.id)));
      if (!allowed) return NextResponse.json({ message: 'پیدا نشد' }, { status: 404 });
    }
    /* ── چرا سرور «مالک بودن» را می‌گوید ──
       صفحه‌ی عمومی دکمه‌های ویرایش را بر اساسِ مقایسه‌ی
       `user.id === ownerId` در مرورگر نشان می‌داد. آن مقایسه به
       هیدریتِ استورِ لاگین و شکلِ کاربرِ ذخیره‌شده بند است و بی‌صدا
       شکست می‌خورد — کاربر لاگین بود و دکمه‌ها را نمی‌دید.
       این پرچم از خودِ کوکیِ نشست می‌آید: یک منبع، همان منبعی که
       مسیرِ ذخیره هم با آن تصمیم می‌گیرد. */
    const isMine = !!actor && actor.id === p.ownerId;
    return NextResponse.json({ profile: p, isMine }, { headers: { 'Cache-Control': 'no-store' } });
  }

  /* ── فهرستِ کامل برای پنل‌ها ──
     پنلِ باشگاه می‌خواهد هر مربی‌ای که ثبت‌نام کرده را ببیند، نه فقط
     تأییدشده‌ها: تا امروز فهرستِ «افزودن مربی» خالی بود و باشگاه‌دار
     فکر می‌کرد وصل نیست، در حالی که فقط هیچ پروفایلی هنوز تأیید نشده
     بود. تأییدنشده‌ها فقط برای کاربرِ واردشده برگردانده می‌شوند و با
     `status` می‌آیند تا رابط بتواند نشانشان کند. */
  if (searchParams.get('all') === '1') {
    const actor = actorFromRequest(req);
    if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
    try {
      const all = await listProfiles(kind, {});
      return NextResponse.json(
        { profiles: all.filter(p => p.status !== 'rejected') },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    } catch {
      return NextResponse.json({ message: 'خطا در دریافت پروفایل‌ها' }, { status: 500 });
    }
  }

  try {
    const all = await listProfiles(kind, { status: 'approved' });
    return NextResponse.json({ profiles: all }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'خطا در دریافت پروفایل‌ها' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const kind = kindOf((await ctx.params).kind);
  if (!kind) return NextResponse.json({ message: 'نوع پروفایل نامعتبر است' }, { status: 400 });

  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const data = b?.data && typeof b.data === 'object' && !Array.isArray(b.data)
    ? b.data as Record<string, unknown> : null;
  if (!data) return NextResponse.json({ message: 'بدنه‌ی پروفایل خالی است' }, { status: 400 });

  /* ── مرزِ اندازه ──
     `data` یک jsonbِ آزاد است و تا امروز هرچه می‌رسید می‌نشست. شکلش
     برای هر نقش فرق دارد، پس این‌جا شکل سنجیده نمی‌شود؛ چیزی سنجیده
     می‌شود که هر شکلی باید رعایتش کند: اندازه، عمق و تعداد.
     پاک‌سازیِ محتوایی (نامِ آلبوم، رسانه‌ی خراب) سرِ جای خودش در
     `saveProfile` است. */
  const bad = checkProfileData(data);
  if (bad) return NextResponse.json({ message: bad }, { status: 400 });

  const slug = str(b?.slug, 80);
  if (!slug) return NextResponse.json({ message: 'نامک پروفایل لازم است' }, { status: 400 });

  /* جواز کسب — عوض‌شدنش تأیید قبلی را باطل می‌کند (در PATCH ادمین دوباره بررسی می‌شود) */
  const licenseNumber = b?.licenseNumber !== undefined ? str(b.licenseNumber, 60) : undefined;
  const licenseUrl = b?.licenseUrl !== undefined ? str(b.licenseUrl, 600) : undefined;

  try {
    /* ⚠️ فقط برای مربی، و فقط وقتی واقعاً عدد آمده باشد.
       `Number(null)` صفر است و `Number(true)` یک — یعنی یک کلاینتِ
       شلخته می‌توانست مبلغِ ذخیره‌شده‌ی مربی را با `null` صفر کند، و
       نقش‌های دیگر هم ستونی را می‌نوشتند که به آن‌ها ربطی ندارد. */
    const numOr = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
    const sp = kind === 'coach' ? numOr(b?.sessionPrice) : undefined;
    const sm = kind === 'coach' ? numOr(b?.sessionMin) : undefined;
    const saved = await saveProfile({
      kind, ownerId: actor.id, slug, data,
      ...(sp !== undefined ? { sessionPrice: sp } : {}),
      ...(sm !== undefined ? { sessionMin: sm } : {}),
      ...(licenseNumber !== undefined ? { licenseNumber } : {}),
      ...(licenseUrl !== undefined ? { licenseUrl } : {}),
    });
    /* ── ساختنِ پروفایل یعنی داشتنِ آن نقش ──
       تا امروز این مسیر فقط پروفایل را ذخیره می‌کرد و به نقشِ کاربر
       دست نمی‌زد. نتیجه‌اش باگی بود که کاربر این‌طور دیدش: فروشگاه
       را ساخت، پنلش کار کرد، **بعد از خروج و ورودِ دوباره نقش و
       پنل ناپدید شدند** — در حالی که فروشگاه در صفحه‌ی فروشگاه‌ها و
       صفحه‌ی اصلی دیده می‌شد.

       دلیلش این بود که پنل به حالتِ کلاینت تکیه داشت، ولی ورودِ
       دوباره نقش‌ها را از دیتابیس می‌خواند و آن‌جا خبری از `seller`
       نبود. در دیتابیس هم دیده شد: `role_requests` ردیفِ `pending`
       داشت ولی `secondaryRoles` کاربر خالیِ آن نقش بود.

       این‌جا همان قاعده‌ی `/api/roles/request` تکرار می‌شود: نقش
       داده می‌شود تا کاربر بتواند کارش را شروع کند. امن است چون هر
       چیزی که می‌سازد صفِ تأییدِ خودش را دارد و تا تأیید، روی سایت
       نشانِ تأییدشده نمی‌گیرد.

       `primaryRole` فقط وقتی جابه‌جا می‌شود که کاربر هنوز نقشِ
       معناداری ندارد — وگرنه ساختنِ فروشگاه، باشگاه‌داری‌اش را از
       دستش درمی‌آورد. */
    try {
      const { data: u } = await sb().from('users')
        .select('"primaryRole","secondaryRoles"').eq('id', actor.id).maybeSingle();
      const cur = (u ?? {}) as { primaryRole?: string; secondaryRoles?: string[] };
      const owned = [cur.primaryRole, ...(cur.secondaryRoles ?? [])].filter(Boolean);
      if (!owned.includes(kind)) {
        const roles = [...new Set([...(cur.secondaryRoles ?? []), kind])].filter(Boolean);
        const promote = !cur.primaryRole || cur.primaryRole === 'user';
        await sb().from('users').update({
          secondaryRoles: roles,
          ...(promote ? { primaryRole: kind } : {}),
          updatedAt: new Date().toISOString(),
        }).eq('id', actor.id);
      }
    } catch (roleErr) {
      /* نقش ندادن نباید ذخیره‌ی پروفایل را بشکند؛ لاگ می‌شود و
         کاربر می‌تواند از مسیرِ «نقش‌ها» هم بگیردش. */
      console.error('[profiles] grant role failed:', roleErr);
    }

    return NextResponse.json({ profile: saved }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (/does not exist|schema cache/i.test(msg)) {
      return NextResponse.json({ message: 'جدول پروفایل‌ها هنوز ساخته نشده (مایگریشن ۰۰۸ اجرا نشده)' }, { status: 503 });
    }
    if (/duplicate key/i.test(msg)) {
      return NextResponse.json({ message: 'این نامک قبلاً استفاده شده است' }, { status: 409 });
    }
    console.error('save profile failed:', msg);
    return NextResponse.json({ message: 'ذخیره‌ی پروفایل انجام نشد' }, { status: 500 });
  }
}
