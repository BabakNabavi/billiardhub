import type { MetadataRoute } from 'next'
import { SITE_URL } from '../lib/site-url'

/* تا پیش از این هیچ robots.txt وجود نداشت؛ یعنی خزنده‌ها آزاد بودند
   پنل مدیریت، داشبورد، سبد خرید و صفحه‌های خصوصی را هم بخزند. این‌جا
   فقط بخش‌های عمومی باز می‌مانند. */

const PRIVATE = [
  '/api/',
  '/admin/',
  '/dashboard/',
  '/profile/',
  '/direct/',
  '/cart/',
  '/checkout/',
  '/payment/',
  '/login',
  '/register',
  '/forgot-password',
  '/advertise/dashboard',
  '/advertise/result',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: PRIVATE }],
    /* نقشه‌ی ویدیو جداست چون در زمانِ درخواست از دیتابیس ساخته می‌شود؛
       نقشه‌ی اصلی عمداً ثابت است تا شکستنِ دیتابیس ساختِ سایت را
       نشکند. اعلامِ هر دو در robots یعنی خزنده هر دو را می‌بیند. */
    sitemap: [`${base()}/sitemap.xml`, `${base()}/video-sitemap.xml`],
    host: base(),
  }
}

/* همان منبعِ واحدِ `lib/site-url`. پیش‌تر این تابع منطق را برای خودش
   تکرار می‌کرد و همین باعث می‌شد جابه‌جاییِ دامنه در دو جا جدا جدا
   اثر بگذارد — نقشه‌ی سایت و canonical می‌توانستند به دو آدرسِ متفاوت
   اشاره کنند. حالا هر دو یک چیز را می‌خوانند.
   نامش می‌ماند چون sitemap.ts هم از آن استفاده می‌کند. */
export function base(): string {
  return SITE_URL
}
