import axios from 'axios';
import { CSRF_COOKIE, CSRF_HEADER } from './auth/constants';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  /* نشست روی کوکیِ httpOnly است و باید با هر درخواست برود */
  withCredentials: true,
  /* بدونِ تایم‌اوت، درخواستی که به سرور نمی‌رسد تا مهلتِ پیش‌فرضِ مرورگر
     (گاهی دقایق) معلق می‌ماند و کاربر فقط اسپینر می‌بیند — و در نهایت
     خطایی می‌گیرد که تا امروز «رمز اشتباه» ترجمه می‌شد.
     سی ثانیه برای هر عملیاتِ این سایت بیش از کافی است. */
  timeout: 30_000,
});

const readCookie = (name: string): string | null => {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]!) : null;
};

/* توکنِ CSRF از کوکیِ خواندنی برداشته و در هدر گذاشته می‌شود.
   هدرِ Authorization ساخته نمی‌شود — توکن اصلاً در دسترسِ
   جاوااسکریپت نیست و این همان هدفِ مهاجرت بود. */
api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  const method = (config.method || 'get').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) config.headers[CSRF_HEADER] = csrf;
  }
  return config;
});

export default api;
