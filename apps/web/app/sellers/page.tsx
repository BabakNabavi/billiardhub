import { SellersClient } from './SellersClient'
import { loadPublicProfiles } from '@/lib/profiles/public-list'
import type { SellerProfile } from '@/lib/seller-store'

/* رندرِ سرورِ فهرستِ فروشگاه‌ها (آذرِ ۱۴۰۵): کارت‌ها و عکسِ اول همراهِ HTML —
   Lighthouse روی گوشی ۲٫۹ ثانیه «تأخیرِ شروع» برای عکسِ اولین کارت داد.
   ISRِ ۶۰ ثانیه: فهرست برای همه یکی است؛ مرورگر پس از سوارشدن تازه‌اش می‌کند. */
export const revalidate = 60

export default async function SellersPage() {
  const profiles = await loadPublicProfiles<SellerProfile>('seller')
  return <SellersClient initialProfiles={profiles} />
}
