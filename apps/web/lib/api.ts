import axios from 'axios';
import { CSRF_COOKIE, CSRF_HEADER } from './auth/constants';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  /* کوکیِ نشست باید با هر درخواست برود. منبعِ اصلیِ احراز هویت همین است؛
     هدرِ Authorization پایین فقط تا پایانِ دوره‌ی گذار می‌ماند. */
  withCredentials: true,
});

const readCookie = (name: string): string | null => {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]!) : null;
};

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;

  /* توکنِ CSRF از کوکیِ خواندنی برداشته و در هدر گذاشته می‌شود
     (الگوی double-submit). سرور در مرحله‌ی «د» تطابقشان را اجباری می‌کند؛
     فعلاً محافظتِ اصلی، بررسیِ Origin در middleware است. */
  const method = (config.method || 'get').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) config.headers[CSRF_HEADER] = csrf;
  }

  /* سازگاریِ عقب‌رو: کاربرانی که هنوز مهاجرت نکرده‌اند توکن در
     localStorage دارند. پس از مهاجرت این کلید حذف می‌شود و کوکی
     جایش را می‌گیرد. */
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const token = JSON.parse(raw)?.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { /* ignore */ }
  }
  return config;
});

export default api;
