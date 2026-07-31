import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
export const uploadFile = async (
  _bucket: string,
  file: File,
  path: string
): Promise<string | null> => {
  try {
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
