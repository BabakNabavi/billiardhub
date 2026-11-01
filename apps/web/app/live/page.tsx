import type { Metadata } from 'next'
import LivePage from './LiveHome'

/* متادیتای «پخش زنده» — فقط برای خودِ فهرست (/live).
   ⚠️ در page است نه layout: layout به /live/[id] و /live/c/[id] هم ارث
   می‌رسید و هر صفحه‌ی تماشا canonicalِ /live می‌گرفت (همان تله‌ی «canonicalِ
   ارثیِ فهرست» در یادداشت‌های سئو). تا آبانِ ۱۴۰۵ این صفحه هیچ متادیتای
   خودش را نداشت و کپیِ صفحه‌ی اصلی بود. */
const title = 'پخش زنده بیلیارد و اسنوکر | بیلیارد هاب'
const description = 'تماشای زنده‌ی مسابقات و بازی‌های بیلیارد و اسنوکر از باشگاه‌های سراسر ایران، رایگان و بدونِ ثبت‌نام.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/live' },
  openGraph: { title, description, url: '/live', siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function Page() {
  return <LivePage />
}
