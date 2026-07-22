/* ─────────────────────────────────────────────────────────────
   Player profile store — پروتوتایپِ کلاینتی (localStorage).
   مشترک بین /dashboard/player (پنل بازیکن) و /players (لیست+پروفایل).
   مالکیت با user.id — همان الگوی seller/coach/referee/technician.
   ذخیره = انتشار. تک‌تکِ فیلدهای صفحه‌ی نمایشِ پروفایل این‌جا
   گرفته می‌شوند.
   ───────────────────────────────────────────────────────────── */
import type {
  Player, Discipline, PlayerHighlight, PlayerTournament, PlayerAlbum,
} from './players-data'

export interface PlayerProfile {
  slug: string
  ownerId: string
  ownerPhone: string

  name: string
  nameEn: string
  discipline: Discipline
  city: string
  country: string
  ranking: string            // خالی ⇒ بدون رنکینگ (در فرم متن است)
  national: boolean
  gender: 'm' | 'f'
  youth: boolean
  clubName: string
  tone: Player['tone']
  scene: string              // تصویرِ پس‌زمینه‌ی دوتون (آپلودی)
  intro: string
  bio: string[]
  careerStart: string
  highlights: PlayerHighlight[]
  tournaments: PlayerTournament[]
  albums: PlayerAlbum[]
  tags: string[]

  status: 'approved' | 'rejected'
  updatedAt: string
}

const KEY = 'bh_player_profiles'

export function emptyPlayerProfile(slug: string, ownerId = '', ownerPhone = ''): PlayerProfile {
  return {
    slug, ownerId, ownerPhone,
    name: '', nameEn: '', discipline: 'snooker', city: '', country: 'ایران',
    ranking: '', national: false, gender: 'm', youth: false, clubName: '',
    tone: 'felt', scene: '', intro: '', bio: [], careerStart: '',
    highlights: [], tournaments: [], albums: [], tags: [],
    status: 'approved', updatedAt: '',
  }
}

function normalize(raw: Partial<PlayerProfile> & { slug: string }): PlayerProfile {
  const p = { ...emptyPlayerProfile(raw.slug), ...raw }
  if (p.ownerId == null) p.ownerId = ''
  return p
}

export function getPlayerProfiles(): Record<string, PlayerProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, PlayerProfile>
    const out: Record<string, PlayerProfile> = {}
    for (const [k, v] of Object.entries(raw)) out[k] = normalize({ ...v, slug: v.slug ?? k })
    return out
  } catch { return {} }
}

export function getPlayerProfile(slug: string): PlayerProfile | null {
  return getPlayerProfiles()[slug] ?? null
}

export function listApprovedPlayers(): PlayerProfile[] {
  return Object.values(getPlayerProfiles()).filter(p => p.status === 'approved')
}

export function findPlayerByOwner(
  owner: string | { id?: string; phone?: string } | null | undefined,
): PlayerProfile | null {
  if (!owner) return null
  const keys = (typeof owner === 'string' ? [owner] : [owner.id, owner.phone]).filter(Boolean) as string[]
  if (!keys.length) return null
  return Object.values(getPlayerProfiles()).find(p =>
    (p.ownerId && keys.includes(p.ownerId)) || (p.ownerPhone && keys.includes(p.ownerPhone)),
  ) ?? null
}

export function savePlayerProfile(p: PlayerProfile) {
  if (typeof window === 'undefined') return
  const all = getPlayerProfiles()
  for (const k of Object.keys(all)) {
    if (k === p.slug) continue
    const o = all[k]
    if (!o) continue
    if ((p.ownerId && o.ownerId === p.ownerId) || (p.ownerPhone && o.ownerPhone === p.ownerPhone)) delete all[k]
  }
  all[p.slug] = { ...p, updatedAt: new Date().toISOString() }
  try { localStorage.setItem(KEY, JSON.stringify(all)) }
  catch { throw new Error('quota') }
}

export function newPlayerSlug(): string {
  return `p-${Date.now().toString(36)}`
}

/* پروفایلِ ذخیره‌شده → شکلِ Player تا صفحات /players مستقیم رندرش کنند */
export function profileToPlayer(p: PlayerProfile): Player {
  const rank = parseInt(p.ranking.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))), 10)
  return {
    id: p.slug,
    name: p.name || 'بازیکن',
    nameEn: p.nameEn || 'PLAYER',
    discipline: p.discipline,
    city: p.city || '—',
    country: p.country || 'ایران',
    ranking: Number.isNaN(rank) || rank <= 0 ? undefined : rank,
    national: p.national,
    gender: p.gender,
    youth: p.youth,
    club: p.clubName ? { name: p.clubName } : undefined,
    tone: p.tone,
    scene: p.scene || '/images/shop/snooker-table.jpg',
    intro: p.intro,
    bio: p.bio.length ? p.bio : [p.intro].filter(Boolean),
    careerStart: p.careerStart || '—',
    highlights: p.highlights,
    tournaments: p.tournaments,
    albums: p.albums,
    tags: p.tags,
  }
}
