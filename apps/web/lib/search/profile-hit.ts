/* ─────────────────────────────────────────────────────────────
   ردیفِ پروفایل ⟵ نتیجه‌ی جست‌وجو.

   نام و نشانیِ هر نقش در فیلدِ دیگری است (خوانده‌شده از دادهٔ زنده):
     مربی و داور     ← firstNameFa + lastNameFa (و نسخه‌ی لاتین)
     بازیکن          ← name (و nameEn)
     فروشگاه         ← title، و brand
     تولیدکننده      ← name
     متخصصِ فنی      ← name، و title
   تصویر: photo برای افراد، logo برای فروشگاه و تولیدکننده.
   ───────────────────────────────────────────────────────────── */

import { haystackOf } from './match'
import type { SearchHit } from './types'

export interface ProfileSearchRow {
  slug: string
  kind: 'coach' | 'referee' | 'player' | 'seller' | 'manufacturer' | 'technician'
  verified: boolean | null
  fn: string | null; ln: string | null; fnEn: string | null; lnEn: string | null
  name: string | null; nameEn: string | null; title: string | null; brand: string | null
  city: string | null; photo: string | null; logo: string | null
}

/** مسیرِ صفحه‌ی عمومیِ هر نقش و برچسبِ فارسی‌اش */
const ROLE: Record<ProfileSearchRow['kind'], { path: string; label: string }> = {
  coach: { path: '/coaches', label: 'مربی' },
  referee: { path: '/referees', label: 'داور' },
  player: { path: '/players', label: 'بازیکن' },
  seller: { path: '/sellers', label: 'فروشگاه' },
  manufacturer: { path: '/manufacturers', label: 'تولیدکننده' },
  technician: { path: '/services', label: 'خدمات فنی' },
}

const join = (...p: (string | null)[]) => p.filter(Boolean).join(' ').trim()

export function profileHit(r: ProfileSearchRow): { hit: SearchHit; hay: string } | null {
  const role = ROLE[r.kind]
  if (!role || !r.slug) return null
  const title =
    r.kind === 'coach' || r.kind === 'referee' ? join(r.fn, r.ln) || join(r.fnEn, r.lnEn)
    : r.kind === 'seller' ? (r.title || r.brand || '')
    : r.kind === 'technician' ? (r.brand || r.name || '')
    : (r.name || r.title || r.nameEn || '')
  if (!title) return null
  return {
    hit: {
      href: `${role.path}/${encodeURIComponent(r.slug)}`,
      title,
      sub: [role.label, r.city].filter(Boolean).join(' · '),
      image: r.photo || r.logo || null,
      verified: !!r.verified,
    },
    /* نقش هم جست‌وجوپذیر است: «مربی تهران» */
    hay: haystackOf(title, r.name, r.fnEn, r.lnEn, r.nameEn, r.brand, r.title, r.city, role.label),
  }
}
