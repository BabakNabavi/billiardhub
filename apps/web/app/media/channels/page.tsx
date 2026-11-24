import { ChannelsClient } from './ChannelsClient'
import { loadMediaHomeSeed } from '@/lib/media/home-feed'
import { channelsFrom } from '@/lib/media/shelf'

/* پوسته‌ی سرور: همان استخرِ کش‌شده‌ی خانه‌ی /media (۴۸ ویدیوی تازه = همان چیزی که
   fetchVideos({ limit: 48 }) می‌گرفت). کانال‌ها همین‌جا ساخته می‌شوند تا فقط کارت‌ها
   به HTML بروند، نه ۴۸ رکوردِ کاملِ ویدیو. null ⟵ رفتارِ قبلی (مرورگر خودش می‌گیرد).
   نگاشت همان publicToMedia است برای همین چهار فیلد (creator.handle/name، views، thumb). */
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
