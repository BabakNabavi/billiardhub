/* ─────────────────────────────────────────────────────────────
   Coach profile store (client-side prototype — localStorage).
   Shared by: /dashboard/coach (form), /admin/coaches (review),
   and /coaches/[id] (public profile, by slug).
   ───────────────────────────────────────────────────────────── */
import { provinceOfCity } from './iran-geo'

export interface CoachGrade  { key: string; label: string; year: string }
export interface CoachMedia  { id: string; url: string; caption: string }
export interface CoachVideo  { id: string; thumbnail: string; title: string; duration: string }

export interface CoachProfile {
  slug: string
  firstNameFa: string; lastNameFa: string
  firstNameEn: string; lastNameEn: string
  province: string
  city: string
  disciplines: string[]                 // discipline keys (snooker/pocket/highball)
  shortBio: string
  fullBio: string
  grades: CoachGrade[]                  // selected coaching grades + year received
  gallery: CoachMedia[]
  videos: CoachVideo[]
  phone: string; whatsapp: string; instagram: string; telegram: string
  photo: string                         // profile photo (data URL) — shown as the avatar
  coverImage: string                    // background / cover photo (data URL)
  certificate: { name: string; url: string } | null
  status: 'pending' | 'approved' | 'rejected'
  verified: boolean                     // blue check (admin grants — only with certificate)
  freeCoach: boolean                    // «مربی آزاد» (no certificate)
  submittedAt: string
  ownerPhone: string
}

/* Coaching grades — ordered from the first (entry) certificate upward. */
export const GRADES: { key: string; label: string; dots: number }[] = [
  { key: 'orientation', label: 'توجیهی',                            dots: 1 },
  { key: 'd3',          label: 'درجه ۳',                            dots: 1 },
  { key: 'd2',          label: 'درجه ۲',                            dots: 2 },
  { key: 'd1',          label: 'درجه ۱',                            dots: 2 },
  { key: 'asiaC',       label: 'C آسیایی',                          dots: 3 },
  { key: 'asiaB',       label: 'B آسیایی',                          dots: 3 },
  { key: 'asiaA',       label: 'A آسیایی',                          dots: 4 },
  { key: 'wpbsa1',      label: 'WPBSA Level 1',                     dots: 4 },
  { key: 'wpbsa2',      label: 'WPBSA Level 2 (1st4sport Certificate)', dots: 5 },
  { key: 'wpbsa3',      label: 'WPBSA Level 3 Advance Coach',       dots: 5 },
]

export const DISCIPLINES: { key: string; label: string; color: string }[] = [
  { key: 'snooker',  label: 'اسنوکر',       color: '#7C3AED' },
  { key: 'pocket',   label: 'پاکت بیلیارد', color: '#9A6E38' },
  { key: 'highball', label: 'هی‌بال',       color: '#C2410C' },
]

const KEY = 'bh_coach_profiles'

export function getCoachProfiles(): Record<string, CoachProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, CoachProfile>
    // پروفایل‌های قدیمی province ندارند ⇒ از روی شهر بک‌فیل می‌شود
    for (const p of Object.values(all)) if (!p.province && p.city) p.province = provinceOfCity(p.city)
    return all
  } catch { return {} }
}

export function getCoachProfile(slug: string): CoachProfile | null {
  return getCoachProfiles()[slug] ?? null
}

export function listCoachProfiles(): CoachProfile[] {
  return Object.values(getCoachProfiles()).sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
}

export function saveCoachProfile(p: CoachProfile) {
  const all = getCoachProfiles()
  // one profile per owner — drop older entries by the same owner under a different slug
  if (p.ownerPhone) {
    for (const k of Object.keys(all)) {
      if (k !== p.slug && all[k]?.ownerPhone === p.ownerPhone) delete all[k]
    }
  }
  all[p.slug] = p
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // storage quota exceeded — last resort: keep only this profile
    // (re-throws if even a single profile is too large, handled by the caller)
    localStorage.setItem(KEY, JSON.stringify({ [p.slug]: p }))
  }
}

export function updateCoachProfile(slug: string, patch: Partial<CoachProfile>) {
  const all = getCoachProfiles()
  const cur = all[slug]
  if (!cur) return
  all[slug] = { ...cur, ...patch }
  localStorage.setItem(KEY, JSON.stringify(all))
}

/* Highest selected grade → the badge shown on the profile («درجه مربیگری»). */
export function badgeFromGrades(grades: CoachGrade[]): { label: string; dots: number } | null {
  let bestIdx = -1
  let best: CoachGrade | null = null
  for (const g of grades) {
    const idx = GRADES.findIndex(x => x.key === g.key)
    if (idx > bestIdx) { bestIdx = idx; best = g }
  }
  const meta = GRADES[bestIdx]
  return best && meta ? { label: best.label, dots: meta.dots } : null
}

/* Certifications list for the profile: «درجه ۲ آسیایی — ۱۳۹۸» style, highest first. */
export function certificationLines(grades: CoachGrade[]): string[] {
  return [...grades]
    .sort((a, b) => GRADES.findIndex(x => x.key === b.key) - GRADES.findIndex(x => x.key === a.key))
    .map(g => (g.year ? `${g.label} — ${g.year}` : g.label))
}

export function disciplineLabel(key: string): string {
  return DISCIPLINES.find(d => d.key === key)?.label ?? key
}
