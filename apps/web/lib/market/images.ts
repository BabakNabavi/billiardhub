import { getSupabaseServer } from '@/lib/supabase-server'
import { sniff, capFor } from '@/lib/upload/policy'

/* ═══════════════════════════════════════════════════════════════
   تصویرهای آگهی — چه چیزی اجازه دارد در `products.images` بنشیند.
   ───────────────────────────────────────────────────────────────
   فرمِ ثبتِ آگهی عکس را با `FileReader` به رشته‌ی base64 تبدیل
   می‌کرد و همان رشته در ستونِ `images` ذخیره می‌شد. یعنی تصویرِ
   دومگابایتی، بعد از base64 حدودِ ۲٫۷ مگابایت **متن**، داخلِ خودِ
   ردیفِ دیتابیس.

   هزینه‌اش سه‌جا پیدا بود:

     · `/api/market/ads` در هر بارگذاریِ بازار همه‌ی همان متن‌ها را
       برمی‌گرداند — با صد آگهیِ پنج‌عکسه، چند صد مگابایت در یک
       درخواست. (یک آگهیِ واقعی در همین بازار ۲۰ کیلوبایت متنِ
       base64 فقط برای عکسِ اولش داشت.)
     · مرورگر نمی‌تواند data URI را کش کند؛ هر بازدید از نو.
     · پشتیبانِ دیتابیس هم همان حجم را هر شب می‌برد.

   Storage برای همین است: فایل یک‌بار بالا می‌رود، نشانی‌اش ذخیره
   می‌شود، و مرورگر با کشِ یک‌ساله می‌گیردش.

   ── چرا سرور هم base64 را قبول می‌کند ──
   کلاینتِ تازه پیش از ثبت، فایل را به Storage می‌فرستد و نشانی را
   می‌گذارد. ولی تبِ کهنه‌ای که ساعت‌ها باز مانده هنوز base64
   می‌فرستد. اگر این‌جا ردش کنیم، آگهیِ آن کاربر بی‌عکس ثبت می‌شود
   یا خطا می‌خورد. پس همان بایت‌ها همین‌جا در سرور به Storage
   می‌روند و نشانی ذخیره می‌شود — **در هیچ حالتی base64 وارد
   دیتابیس نمی‌شود.**

   ── و چرا هر نشانی‌ای پذیرفته نمی‌شود ──
   همان دلیلِ `safeCover` در مسابقات: اگر نشانیِ دلخواه بپذیریم،
   آگهی‌دهنده می‌تواند تصویری از دامنه‌ی خودش بگذارد و صفحه‌ی عمومیِ
   ما آن را سرو کند — هم ردیابیِ بازدیدکننده، هم محتوایی که هر لحظه
   می‌تواند به چیزِ دیگری عوض شود.
   ═══════════════════════════════════════════════════════════════ */

export const MAX_AD_IMAGES = 8

/** پیشوندِ نشانیِ عمومیِ Storage — تهی اگر env تنظیم نشده باشد */
export const storagePublicPrefix = (): string => {
  const base = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')
  return base ? `${base}/storage/v1/object/public/` : ''
}

/** نشانی‌ای که همین حالا می‌شود ذخیره‌اش کرد */
const alreadySafe = (s: string): boolean => {
  if (s.startsWith('/images/')) return true
  const pre = storagePublicPrefix()
  return !!pre && s.startsWith(pre)
}

const DATA_URI = /^data:([a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]{0,60}\/[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]{0,60});base64,([\s\S]+)$/

/** یک data URI را به Storage می‌برد و نشانیِ عمومی‌اش را می‌دهد */
export async function storeDataUri(
  uri: string, ownerId: string, seq: number, stamp: number,
): Promise<string | null> {
  const m = DATA_URI.exec(uri.trim())
  if (!m) return null

  let bytes: Buffer
  try { bytes = Buffer.from(m[2]!.replace(/\s/g, ''), 'base64') } catch { return null }

  /* نوع از خودِ بایت‌ها خوانده می‌شود نه از برچسبِ data URI — همان
     قاعده‌ی `/api/upload`. SVG هم همان‌جا رد می‌شود چون می‌تواند
     اسکریپت داشته باشد. */
  const kind = sniff(bytes)
  if (!kind || !kind.mime.startsWith('image/')) return null
  if (bytes.byteLength > capFor(kind.mime)) return null

  const safeOwner = String(ownerId).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'anon'
  const path = `products/${safeOwner}-${stamp}-${seq}.${kind.ext}`

  const sb = getSupabaseServer()
  const { error } = await sb.storage.from('club-media').upload(path, bytes, {
    contentType: kind.mime,
    upsert: false,
    /* نامِ فایل یکتاست و هرگز با همان نام عوض نمی‌شود، پس کشِ
       یک‌ساله امن است — همان تنظیمِ `/api/upload`. */
    cacheControl: '31536000',
  })
  if (error) {
    console.error('[market/images] upload failed:', error.message)
    return null
  }
  return sb.storage.from('club-media').getPublicUrl(path).data.publicUrl
}

/**
 * فهرستِ تصویرهای ورودی را به فهرستی از نشانی‌های قابلِ ذخیره تبدیل
 * می‌کند. base64 بالا می‌رود، نشانیِ خودی می‌ماند، بقیه حذف می‌شوند.
 */
export async function normalizeAdImages(raw: unknown, ownerId: string): Promise<string[]> {
  if (!Array.isArray(raw)) return []

  const items = raw
    .map(v => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .slice(0, MAX_AD_IMAGES)

  /* یک مهرِ زمانی برای همه‌ی عکس‌های یک آگهی، تا نامِ فایل‌ها
     کنارِ هم بمانند و ترتیبشان از خودِ نام خوانده شود. */
  const stamp = Date.now()
  const out: string[] = []

  for (let i = 0; i < items.length; i++) {
    const s = items[i]!
    if (alreadySafe(s)) { out.push(s); continue }
    if (s.startsWith('data:')) {
      const url = await storeDataUri(s, ownerId, i, stamp)
      if (url) out.push(url)
      continue
    }
    /* نشانیِ بیگانه — بی‌صدا کنار گذاشته می‌شود */
  }

  return out
}
