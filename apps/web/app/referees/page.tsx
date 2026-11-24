import { RefereesClient } from './RefereesClient'
import { loadPublicProfiles } from '@/lib/profiles/public-list'
import type { RefereeProfile } from '@/lib/referee-store'

/* رندرِ سرورِ فهرستِ داوران (آذرِ ۱۴۰۵): کارت‌ها همراهِ HTML، نه پس از دانلودِ JS
   و یک درخواستِ جدا. ISRِ ۶۰ ثانیه: فهرست برای همه یکی است؛ مرورگر پس از
   سوارشدن تازه‌اش می‌کند. */
export const revalidate = 60

export default async function RefereesPage() {
  const profiles = await loadPublicProfiles<RefereeProfile>('referee')
  return <RefereesClient initialProfiles={profiles} />
}
