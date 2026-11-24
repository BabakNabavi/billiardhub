import { CoachesClient } from './CoachesClient'
import { loadPublicProfiles } from '@/lib/profiles/public-list'
import type { CoachProfile } from '@/lib/coach-store'

/* رندرِ سرورِ فهرستِ مربیان (آذرِ ۱۴۰۵): کارت‌ها همراهِ HTML، نه پس از دانلودِ JS
   و یک درخواستِ جدا. ISRِ ۶۰ ثانیه: فهرست برای همه یکی است؛ مرورگر پس از
   سوارشدن تازه‌اش می‌کند. */
export const revalidate = 60

export default async function CoachesPage() {
  const profiles = await loadPublicProfiles<CoachProfile>('coach')
  return <CoachesClient initialProfiles={profiles} />
}
