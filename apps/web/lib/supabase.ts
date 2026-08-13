import { SUPABASE_URL_RAW } from './supabase-url';

/* ── چرا کلاینتِ سوپابیس این‌جا ساخته نمی‌شود ──
   این ماژول `uploadFile` را می‌دهد و ده کامپوننت واردش می‌کنند —
   از جمله `Stories` که داخلِ `Navbar` است، یعنی **هر صفحه‌ی سایت**.
   با `import` ایستا، کلِ `@supabase/supabase-js` (۲۰۱ کیلوبایتِ خام)
   در باندلِ هر صفحه می‌نشست و روی موبایل باید پارس و کامپایل می‌شد.

   ولی خودِ کلاینت فقط در یک حالت لازم است: فایلِ بزرگ‌تر از سه
   مگابایت که از مسیرِ آپلودِ مستقیم می‌رود. مسیرِ معمول — که تقریباً
   همه‌ی آپلودهاست — فقط `fetch` به `/api/upload` است.

   پس کتابخانه با `import()` پویا و فقط در همان لحظه بارگذاری
   می‌شود. خروجیِ `supabase` هم که هیچ‌جا وارد نمی‌شد، برداشته شد. */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/* آپلود فایل — از مسیر سرور، نه مستقیم به Storage.

   نسخه‌ی قبلی با کلید anon مستقیم در باکت می‌نوشت. یعنی:
     • هیچ بررسی نشستی نبود — حتی کاربر واردنشده هم می‌توانست بنویسد
     • نوع و حجم فقط در جاوااسکریپت بررسی می‌شد و دورزدنش ساده بود
     • نام فایل کاربر عیناً در مسیر می‌نشست
     • `upsert: true` یعنی می‌شد فایل باشگاه دیگری را بازنویسی کرد

   حالا `/api/upload` هر چهار مورد را سرورساید بررسی می‌کند. امضای
   این تابع عمداً عوض نشده تا هر ده فراخوان موجود بدون تغییر کار کنند
   (پارامتر bucket دیگر استفاده نمی‌شود؛ مقصد را سرور تعیین می‌کند). */
/* آخرین حجمی که مسیرِ عبوری از سرور مطمئن رد می‌کند.

   اندازه‌گیریِ واقعی روی سایتِ زنده: ۳ مگابایت می‌گذرد، ۴٫۴ مگابایت
   ۴۱۳ می‌گیرد. این سقفِ خودِ پلتفرم است، نه کدِ ما — درخواست اصلاً به
   تابعِ ما نمی‌رسد و پیامِ خطای ما هم به کاربر نمی‌رسد.

   پس هرچه از این بزرگ‌تر باشد از راهِ مستقیم می‌رود. */
const DIRECT_THRESHOLD = 3 * 1024 * 1024;

/** آپلودِ مستقیم: سرور مجوز می‌دهد، بایت‌ها مستقیم به Storage می‌روند. */
/* ── چرا سه حالت و نه دو ──
   `null` یعنی «مسیرِ مستقیم نشد، مسیرِ قدیمی را امتحان کن». ولی وقتی
   **سرور** فایل را رد کرده (بزرگ‌تر از سقف، نوعِ غیرمجاز، بی‌اجازه)،
   امتحانِ دوباره از راهِ `/api/upload` یعنی همان بایت‌ها این‌بار از
   RAMِ سرورِ سایت رد شوند تا همان‌جا هم رد شوند — بدترین هر دو دنیا.
   پس ردِ سیاستی جدا برمی‌گردد و بازگشتی ندارد. */
type DirectResult =
  | { ok: true; url: string }
  | { ok: false; rejected: true; message: string }
  | { ok: false; rejected: false }

async function uploadDirect(file: File, path: string): Promise<DirectResult> {
  const { apiFetch } = await import('./http');

  const s = await apiFetch('/api/upload/sign', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, contentType: file.type, size: file.size }),
  });
  const sign = await s.json().catch(() => ({} as Record<string, string>));
  if (!s.ok || !sign.token || !sign.path) {
    console.error('Upload sign rejected:', sign.message ?? s.status);
    /* ۴۰۱ و ۴۲۹ گذرا هستند؛ بقیه تصمیمِ سیاستیِ سرورند */
    const policy = s.status === 413 || s.status === 415 || s.status === 403 || s.status === 400;
    return policy
      ? { ok: false, rejected: true, message: String(sign.message ?? 'فایل پذیرفته نشد') }
      : { ok: false, rejected: false };
  }

  /* کتابخانه فقط همین‌جا لازم است — بیرونِ باندلِ صفحه می‌ماند */
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(SUPABASE_URL_RAW, supabaseAnonKey);

  const { error } = await sb.storage
    .from(String(sign.bucket))
    .uploadToSignedUrl(String(sign.path), String(sign.token), file);
  if (error) {
    console.error('Direct upload failed:', error.message);
    return { ok: false, rejected: false };
  }

  /* تأییدِ سرور: امضای بایتیِ فایل سنجیده می‌شود و اگر جعلی باشد همان
     جا پاک می‌شود. بدونِ این مرحله، نوعِ فایل فقط ادعای کلاینت است. */
  const c = await apiFetch('/api/upload/sign', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path: sign.path }),
  });
  const done = await c.json().catch(() => ({} as Record<string, string>));
  if (!c.ok) {
    console.error('Upload rejected after check:', done.message ?? c.status);
    /* بایت‌ها رفته‌اند و سرور ردشان کرده — تکرار از مسیرِ دیگر بی‌فایده است */
    return { ok: false, rejected: true, message: String(done.message ?? 'فایل پذیرفته نشد') };
  }
  return done.url ? { ok: true, url: done.url } : { ok: false, rejected: false };
}

export const uploadFile = async (
  _bucket: string,
  file: File,
  path: string
): Promise<string | null> => {
  try {
    /* فایلِ بزرگ از مسیرِ مستقیم؛ کوچک از همان مسیرِ قدیمی که سال‌ها
       کار کرده. اگر مسیرِ مستقیم به هر دلیلی نشد، به مسیرِ قدیمی
       برمی‌گردیم — بدترین حالتش همان رفتارِ امروز است. */
    /* ── ویدیو همیشه مستقیم ──
       آستانه‌ی حجمی برای عکس نوشته شده. یک ویدیوی ۲ مگابایتی هم اگر
       از مسیرِ سرور برود، کلِ بایت‌هایش در RAMِ همان پروسه‌ای می‌نشیند
       که سایت را سرو می‌کند — و رسانه قرار است بزرگ‌تر هم بشود.
       نوعِ فایل این‌جا فقط یک راهنماست؛ تصمیمِ واقعی روی بایت‌ها در
       سرور گرفته می‌شود. */
    if (file.size > DIRECT_THRESHOLD || file.type.startsWith('video/')) {
      /* خطای پرتاب‌شده هم نباید مسیرِ قدیمی را بی‌صدا از دست بدهد:
         `createClient` بدونِ کلید پرتاب می‌کند و آفلاین‌بودن هم. */
      let d: DirectResult
      try {
        d = await uploadDirect(file, path)
      } catch (e) {
        console.error('Direct upload threw:', e)
        d = { ok: false, rejected: false }
      }
      if (d.ok) return d.url
      if (d.rejected) return null
    }

    const body = new FormData();
    body.append('file', file);
    body.append('path', path);

    /* کوکی نشست باید همراه برود؛ توکن CSRF را apiFetch می‌گذارد ولی
       این‌جا FormData است و نباید Content-Type دستی ست شود. */
    const { apiFetch } = await import('./http');
    const r = await apiFetch('/api/upload', { method: 'POST', body });

    const j = await r.json().catch(() => ({} as { url?: string; message?: string }));
    if (!r.ok || !j.url) {
      console.error('Upload rejected:', j.message ?? r.status);
      return null;
    }
    return j.url;
  } catch (e) {
    console.error('Upload error:', e);
    return null;
  }
};
