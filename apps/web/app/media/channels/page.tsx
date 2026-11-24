import type { Metadata } from 'next'
import { ChannelsClient } from './ChannelsClient'
import { loadMediaHomeSeed } from '@/lib/media/home-feed'
import { channelsFrom } from '@/lib/media/shelf'

/* پوسته‌ی سرور: همان استخرِ کش‌شده‌ی خانه‌ی /media (۴۸ ویدیوی تازه = همان چیزی که
   fetchVideos({ limit: 48 }) می‌گرفت). کانال‌ها همین‌جا ساخته می‌شوند تا فقط کارت‌ها
   به HTML بروند، نه ۴۸ رکوردِ کاملِ ویدیو. null ⟵ رفتارِ قبلی (مرورگر خودش می‌گیرد).
   نگاشت همان publicToMedia است برای همین چهار فیلد (creator.handle/name، views، thumb). */
/* ⚠️ canonicalِ خودش: بی این، canonicalِ '/media'ِ لایه‌ی والد (media/layout) ارث می‌رسید و
   به گوگل می‌گفت این صفحه کپیِ خانه‌ی مدیاست (همان تله‌ی «canonicalِ ارثیِ فهرست») */
const title = 'کانال‌های بیلیارد مدیا | بیلیارد هاب'
const description = 'سازندگانی که در بیلیارد مدیا ویدیوی بیلیارد و اسنوکر منتشر کرده‌اند'
export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/media/channels' },
  openGraph: { title, description, url: '/media/channels', siteName: 'بیلیارد هاب', locale: 'fa_IR', type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
}

export default async function ChannelsPage() {
  const seed = await loadMediaHomeSeed()
  const initial = seed
    ? channelsFrom(seed.latest.items.map(v => ({
        views: v.views, thumb: v.thumb,
        creator: { handle: v.creatorHandle, name: v.creatorName },
      })))
    : null
  return <ChannelsClient initial={initial} />
}
