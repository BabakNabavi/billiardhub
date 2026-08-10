import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL_RAW } from './supabase-url';

/* نشانی از منبعِ واحد می‌آید؛ پیش‌تر این‌جا `!` بود که فقط تایپ‌چک را
   ساکت می‌کرد و در نبودِ مقدار خطای مبهمِ createClient می‌داد. */
const supabaseUrl = SUPABASE_URL_RAW;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
async function uploadDirect(file: File, path: string): Promise<string | null> {
  const { apiFetch } = await import('./http');

  const s = await apiFetch('/api/upload/sign', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, contentType: file.type, size: file.size }),
  });
  const sign = await s.json().catch(() => ({} as Record<string, string>));
  if (!s.ok || !sign.token || !sign.path) {
    console.error('Upload sign rejected:', sign.message ?? s.status);
    return null;
  }

  const { error } = await supabase.storage
    .from(String(sign.bucket))
    .uploadToSignedUrl(String(sign.path), String(sign.token), file);
  if (error) {
    console.error('Direct upload failed:', error.message);
    return null;
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
    return null;
  }
  return done.url ?? null;
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
    if (file.size > DIRECT_THRESHOLD) {
      const viaDirect = await uploadDirect(file, path);
      if (viaDirect) return viaDirect;
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
