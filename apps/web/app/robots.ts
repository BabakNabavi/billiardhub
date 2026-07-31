import type { MetadataRoute } from 'next'

/* تا پیش از این هیچ robots.txt وجود نداشت؛ یعنی خزنده‌ها آزاد بودند
   پنلِ مدیریت، داشبورد، سبد خرید و صفحه‌های خصوصی را هم بخزند. این‌جا
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
    sitemap: `${base()}/sitemap.xml`,
    host: base(),
  }
}

export function base(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    'https://billiardhub.vercel.app'
  return raw.replace(/\/+$/, '')
}
