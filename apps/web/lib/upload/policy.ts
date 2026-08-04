import type { NextRequest } from 'next/server'
import { getSupabaseServer } from '../supabase-server'
import { isAdmin as isAdminUser } from '../finance/db'
import { bucketFor } from '../social-server'

/* ─────────────────────────────────────────────────────────────
   قواعدِ مشترکِ آپلود.

   دو مسیر فایل می‌پذیرند:
     · `/api/upload`      — بایت‌ها از خودِ سرور می‌گذرند (فایلِ کوچک)
     · `/api/upload/sign` — فقط مجوز می‌دهد، بایت‌ها مستقیم می‌روند

   اگر هرکدام نسخه‌ی خودش از این بررسی‌ها را داشته باشد، روزی یکی‌شان
   عقب می‌ماند و همان می‌شود درِ باز. پس هر دو از این‌جا می‌خوانند.
   ───────────────────────────────────────────────────────────── */

export const MAX_IMAGE = 8 * 1024 * 1024

/* سقفِ ویدیو با سقفِ خودِ باکت (۲۵ مگابایت) یکی است.

   عددِ قبلی ۲۰۰ مگابایت بود ولی هیچ‌وقت شدنی نبود: فایل از یک تابعِ
   serverless می‌گذشت و آن‌جا حدودِ ۴ مگابایت سقف داشت. یعنی این عدد
   فقط روی کاغذ بود و کاربر خطای بی‌ربط می‌گرفت.

   ۲۵ مگابایت برای استوریِ ۱۵ تا ۲۵ ثانیه‌ایِ گوشی کافی است. بالاتر
   رفتن یعنی هزینه‌ی پهنای‌باندِ تحویل هم بالا می‌رود — که گران‌تر از
   خودِ نگهداری است. */
export const MAX_VIDEO = 25 * 1024 * 1024

export const ALLOWED_PREFIXES = [
  'clubs/', 'products/', 'social/stories/', 'social/media/', 'sellers/', 'profiles/',
  /* ویدیو و بنرِ تبلیغات. مسیر باید زیرِ شناسه‌ی خودِ آگهی‌دهنده باشد
     (پایین بررسی می‌شود) تا کسی نتواند فایلِ تبلیغِ دیگری را بازنویسی
     کند — تبلیغی که پول برایش داده شده. */
  'ads/',
  /* مدارک — جواز کسب و مانند آن. برخلاف بقیه به باکتِ **خصوصی** می‌رود
     و لینک عمومی ندارد: جواز کسب نام، کد ملی و نشانیِ صاحب باشگاه را
     روی خود دارد و نباید با داشتنِ آدرس برای همه باز شود. */
  'documents/',
]

/* نوع‌های مجاز. کلید = mime، مقدار = پسوند. SVG عمداً نیست: می‌تواند
   اسکریپت داشته باشد و پروژه هیچ‌جا به آن نیاز ندارد. */
export const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
  'image/webp': 'webp', 'image/avif': 'avif',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
  'application/pdf': 'pdf',
}

/** امضای بایتیِ قالب‌های مجاز — برچسبِ مرورگر قابلِ جعل است */
export function sniff(b: Buffer): { mime: string; ext: string } | null {
  if (b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' }
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' }
  if (b.subarray(0, 3).toString('latin1') === 'GIF') return { mime: 'image/gif', ext: 'gif' }
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return { mime: 'image/webp', ext: 'webp' }

  const ftyp = b.subarray(4, 8).toString('latin1')
  if (ftyp === 'ftyp') {
    const brand = b.subarray(8, 12).toString('latin1')
    if (brand.startsWith('avi')) return { mime: 'image/avif', ext: 'avif' }
    if (brand.startsWith('qt')) return { mime: 'video/quicktime', ext: 'mov' }
    return { mime: 'video/mp4', ext: 'mp4' }
  }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { mime: 'video/webm', ext: 'webm' }
  /* PDF — جواز کسب اغلب اسکنِ PDF است، نه عکس */
  if (b.subarray(0, 5).toString('latin1') === '%PDF-') return { mime: 'application/pdf', ext: 'pdf' }
  return null
}

/* نامِ فایل از کاربر می‌آید؛ هر چیزی جز حروف/عدد/خط‌تیره حذف می‌شود.
   این هم پیمایشِ مسیر (`../`) را می‌بندد و هم نامِ فایل را از افشای
   اطلاعاتِ شخصی پاک می‌کند. */
export const safeSeg = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 60)

export interface PathVerdict {
  ok: boolean
  status?: number
  message?: string
  path?: string
  bucket?: string
  /**
   * آیا مالکیتِ این مسیر واقعاً بررسی شد؟
   *
   * فقط `clubs/` و `documents/` شناسه‌ی صاحبشان را در مسیر دارند و
   * قابلِ بررسی‌اند. بقیه — `profiles/`, `products/`, `sellers/`,
   * `social/` — سه شکلِ متفاوتِ نام دارند و قاعده‌ی واحدی ندارند.
   *
   * این پرچم تصمیم می‌گیرد که آپلود اجازه‌ی **بازنویسی** دارد یا نه.
   * جایی که مالک بررسی نشده، `upsert` خاموش می‌ماند: کاربر می‌تواند
   * فایلِ تازه بسازد ولی فایلِ موجود را — مالِ هرکس که باشد — عوض
   * نکند. همه‌ی مسیرهای امروز نامِ یکتا می‌سازند (مهر زمانی یا شناسه)
   * پس این هیچ جریانی را نمی‌شکند.
   */
  ownerChecked?: boolean
}

/**
 * پاک‌سازیِ مسیر + بررسیِ پیشوندِ مجاز + بررسیِ مالکیت.
 *
 * پیشوندِ مجاز به‌تنهایی کافی نیست: هر کاربرِ واردشده می‌توانست روی
 * `clubs/<id>/…` باشگاهِ دیگری بنویسد و چون آپلود upsert است، فایلِ او
 * را بازنویسی کند. پس هرجا شناسه‌ی باشگاه در مسیر باشد، مالکیت هم
 * بررسی می‌شود.
 */
export async function resolvePath(rawPath: string, actorId: string): Promise<PathVerdict> {
  const cleaned = String(rawPath ?? '').split('/').filter(Boolean).map(safeSeg).join('/')
  if (!cleaned) return { ok: false, status: 400, message: 'مسیر آپلود مشخص نیست' }

  if (!ALLOWED_PREFIXES.some(p => (cleaned + '/').startsWith(p.replace(/\/$/, '') + '/'))) {
    return { ok: false, status: 400, message: 'مسیر آپلود مجاز نیست' }
  }

  let ownerChecked = false

  const clubInPath = cleaned.match(/(?:^|\/)clubs\/([0-9a-f_]{8}[0-9a-f_-]{20,})/i)?.[1]
  if (clubInPath) {
    /* safeSeg خط‌تیره‌های uuid را نگه می‌دارد؛ زیرخط‌ها اثرِ نویسه‌های
       حذف‌شده‌اند و چنین شناسه‌ای در دیتابیس پیدا نمی‌شود. */
    const { data: club } = await getSupabaseServer()
      .from('clubs').select('"ownerId"').eq('id', clubInPath).maybeSingle()
    const owner = (club as { ownerId?: string } | null)?.ownerId
    if (!club || (owner !== actorId && !(await isAdminUser(actorId)))) {
      return { ok: false, status: 403, message: 'دسترسی به این باشگاه مجاز نیست' }
    }
    ownerChecked = true
  } else if (cleaned.startsWith('ads/')) {
    /* `ads/<شناسه‌ی خودِ آگهی‌دهنده>/…` — نوشتن زیرِ شناسه‌ی کسِ دیگر
       مجاز نیست. بدونِ این، هر کاربرِ واردشده می‌توانست ویدیوی تبلیغِ
       یک کمپینِ فعال را عوض کند. */
    const owner = cleaned.split('/')[1] ?? ''
    if (owner !== safeSeg(actorId)) {
      return { ok: false, status: 403, message: 'مسیر فایل تبلیغ باید زیر شناسه‌ی خودتان باشد' }
    }
    ownerChecked = true
  } else if (cleaned.startsWith('documents/roles/')) {
    /* مدرکِ درخواستِ نقش. مسیر باید زیرِ شناسه‌ی خودِ کاربر باشد —
       وگرنه می‌شد مدرکِ دیگری را بازنویسی کرد. */
    const owner = cleaned.split('/')[2] ?? ''
    if (owner !== safeSeg(actorId)) {
      return { ok: false, status: 403, message: 'مسیر مدرک باید زیر شناسه‌ی خودتان باشد' }
    }
    ownerChecked = true
  } else if (cleaned.startsWith('documents/')) {
    /* مدرکِ بی‌صاحب پذیرفته نمی‌شود — وگرنه باکتِ خصوصی به یک انبارِ
       آزادِ فایل تبدیل می‌شود. */
    return { ok: false, status: 400, message: 'مسیر مدرک باید شامل شناسه‌ی باشگاه باشد' }
  }

  return { ok: true, path: cleaned, bucket: bucketFor(cleaned), ownerChecked }
}

/** سقفِ حجم بر اساسِ نوع */
export const capFor = (mime: string) => (mime.startsWith('video/') ? MAX_VIDEO : MAX_IMAGE)

/** آدرسِ IP و شناسه‌ی کاربر برای محدودیتِ نرخ — یک‌جا تا هر دو مسیر یکی باشند */
export const rateOpts = { action: 'upload' as const, max: 40, windowSec: 600 }

export type { NextRequest }
