/* ─────────────────────────────────────────────────────────────
   Referee profile store (client-side prototype — localStorage).
   Shared by: /referees/dashboard (form), /admin/referees (review),
   and /referees/[id] (public profile, by slug).
   Mirrors coach-store, but the referee certificate is MANDATORY
   (a referee can't submit without it) — so there is no «free» state.
   ───────────────────────────────────────────────────────────── */

export interface RefereeGrade  { key: string; label: string; year: string }
export interface RefereeMedia  { id: string; url: string; caption: string }
export interface RefereeVideo  { id: string; thumbnail: string; title: string; duration: string }

export interface RefereeProfile {
  slug: string
  firstNameFa: string; lastNameFa: string
  firstNameEn: string; lastNameEn: string
  city: string
  disciplines: string[]                 // officiating disciplines (snooker/pocket/highball)
  shortBio: string
  fullBio: string
  grades: RefereeGrade[]                 // selected refereeing grades + year received
  gallery: RefereeMedia[]
  videos: RefereeVideo[]
  phone: string; whatsapp: string; instagram: string; telegram: string
  photo: string                          // profile photo (data URL) — shown as the avatar
  coverImage: string                     // background / cover photo (data URL)
  certificate: { name: string; url: string } | null   // MANDATORY at submit time
  status: 'pending' | 'approved' | 'rejected'
  verified: boolean                      // blue check (admin grants)
  submittedAt: string
  ownerPhone: string
}

/* Refereeing grades — ordered from the first (entry) certificate upward.
   Latin-labelled grades (ACBS / International) render via the .bh-latin class. */
export const GRADES: { key: string; label: string; dots: number; color: string; latin?: boolean }[] = [
  { key: 'orientation',   label: 'توجیهی',                             dots: 1, color: '#64748b' },
  { key: 'd3',            label: 'درجه ۳',                             dots: 1, color: '#16A34A' },
  { key: 'd2',            label: 'درجه ۲',                             dots: 2, color: '#16A34A' },
  { key: 'd1',            label: 'درجه ۱',                             dots: 3, color: '#C2410C' },
  { key: 'national',      label: 'داور ملی',                           dots: 3, color: '#9A6E38' },
  { key: 'acbsSilver',    label: 'ACBS Silver Referee',                dots: 4, color: '#94A3B8', latin: true },
  { key: 'acbsGold',      label: 'ACBS Gold Referee',                  dots: 4, color: '#C7A66A', latin: true },
  { key: 'international', label: 'International Referee (WPBSA/IBSF)',  dots: 5, color: '#7C3AED', latin: true },
]

export const DISCIPLINES: { key: string; label: string; color: string }[] = [
  { key: 'snooker',  label: 'اسنوکر',       color: '#7C3AED' },
  { key: 'pocket',   label: 'پاکت بیلیارد', color: '#9A6E38' },
  { key: 'highball', label: 'هی‌بال',       color: '#C2410C' },
]

const KEY = 'bh_referee_profiles'

export function getRefereeProfiles(): Record<string, RefereeProfile> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function getRefereeProfile(slug: string): RefereeProfile | null {
  return getRefereeProfiles()[slug] ?? null
}

export function listRefereeProfiles(): RefereeProfile[] {
  return Object.values(getRefereeProfiles()).sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
}

export function saveRefereeProfile(p: RefereeProfile) {
  const all = getRefereeProfiles()
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

export function updateRefereeProfile(slug: string, patch: Partial<RefereeProfile>) {
  const all = getRefereeProfiles()
  const cur = all[slug]
  if (!cur) return
  all[slug] = { ...cur, ...patch }
  localStorage.setItem(KEY, JSON.stringify(all))
}

/* Highest selected grade → the badge shown on the profile («درجه داوری»). */
export function badgeFromGrades(grades: RefereeGrade[]): { label: string; dots: number; color: string } | null {
  let bestIdx = -1
  let best: RefereeGrade | null = null
  for (const g of grades) {
    const idx = GRADES.findIndex(x => x.key === g.key)
    if (idx > bestIdx) { bestIdx = idx; best = g }
  }
  const meta = GRADES[bestIdx]
  return best && meta ? { label: best.label, dots: meta.dots, color: meta.color } : null
}

/* Certifications list for the profile: «داور ملی — ۱۳۹۸» style, highest first. */
export function certificationLines(grades: RefereeGrade[]): string[] {
  return [...grades]
    .sort((a, b) => GRADES.findIndex(x => x.key === b.key) - GRADES.findIndex(x => x.key === a.key))
    .map(g => (g.year ? `${g.label} — ${g.year}` : g.label))
}

export function disciplineLabel(key: string): string {
  return DISCIPLINES.find(d => d.key === key)?.label ?? key
}

export function isLatinGrade(key: string): boolean {
  return !!GRADES.find(g => g.key === key)?.latin
}
