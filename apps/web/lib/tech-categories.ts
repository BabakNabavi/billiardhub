/* ─────────────────────────────────────────────────────────────
   دسته‌بندیِ کشفِ خدمات — لایه‌ی بالای کاتالوگ.

   ── چرا این فایل ──
   کاتالوگ (`tech-services.ts`) هجده خدمتِ ریز دارد در دو دسته‌ی
   «چوب» و «میز». آن تقسیم برای *ثبتِ* خدمت درست است ولی برای
   *پیدا‌کردنِ* خدمت نه: کسی که چوبش تاب برداشته نمی‌داند باید زیرِ
   «تعمیرات چوب» بگردد یا «سرویس کامل».

   این‌جا همان هجده خدمت به هشت دسته‌ی قابلِ‌کشف گروه می‌شوند —
   چیزی اضافه نمی‌شود و چیزی جا نمی‌ماند.

   ⚠️ هیچ خدمتی از خودم ساخته نشده. هر `id` باید در
   `ALL_TECH_SERVICES` وجود داشته باشد؛ تستِ زیر همین را می‌سنجد.
   ───────────────────────────────────────────────────────────── */

import { ALL_TECH_SERVICES } from './tech-services'

/** نامِ آیکونِ lucide — رندر در کامپوننت، نه این‌جا */
export type TechCategoryIcon =
  | 'wrench' | 'circle-dot' | 'link' | 'scale'
  | 'ruler' | 'layers' | 'truck' | 'grip'

export interface TechCategory {
  id: string
  title: string
  /** شناسه‌ی خدماتِ کاتالوگ که زیرِ این دسته می‌آیند */
  serviceIds: readonly string[]
  icon: TechCategoryIcon
}

export const TECH_CATEGORIES = [
  {
    id: 'cue-repair', title: 'تعمیر و سرویس چوب', icon: 'wrench',
    serviceIds: ['straighten', 'full-service', 'butt-resize', 'extension'],
  },
  {
    id: 'tip-ferrule', title: 'نوک و فرول', icon: 'circle-dot',
    serviceIds: ['tip-replace', 'ferrule-replace', 'ferrule-resize'],
  },
  {
    id: 'joint', title: 'جوینت', icon: 'link',
    serviceIds: ['joint'],
  },
  {
    id: 'weight-balance', title: 'وزن و بالانس', icon: 'scale',
    serviceIds: ['weight', 'balance'],
  },
  {
    id: 'table-level', title: 'تراز و رگلاژ میز', icon: 'ruler',
    serviceIds: ['level', 'slate-repair'],
  },
  {
    id: 'cloth-cushion', title: 'پارچه و باند', icon: 'layers',
    serviceIds: ['cloth', 'cushion'],
  },
  {
    id: 'install', title: 'نصب و جابه‌جایی', icon: 'truck',
    serviceIds: ['install'],
  },
  {
    id: 'pocket-rail', title: 'پاکت و ریل', icon: 'grip',
    serviceIds: ['pocket-set', 'pocket-size', 'diamonds'],
  },
] as const satisfies readonly TechCategory[]

/** عنوانِ فارسیِ خدماتِ یک دسته — همان متنی که در پروفایل ذخیره شده */
export function titlesOfCategory(id: string): string[] {
  const cat = TECH_CATEGORIES.find(c => c.id === id)
  if (!cat) return []
  return cat.serviceIds
    .map(sid => ALL_TECH_SERVICES.find(s => s.id === sid)?.title)
    .filter((t): t is string => Boolean(t))
}

/* ⚠️ گاردِ توسعه: اگر شناسه‌ای در کاتالوگ نباشد یا خدمتی بی‌دسته
   بماند، همین‌جا سر و صدا می‌کند — نه شش ماه بعد وقتی فیلتر بی‌صدا
   خالی برمی‌گردد. فقط در توسعه اجرا می‌شود. */
if (process.env.NODE_ENV !== 'production') {
  const known = new Set(ALL_TECH_SERVICES.map(s => s.id))
  const used = new Set<string>()
  for (const c of TECH_CATEGORIES) {
    for (const id of c.serviceIds) {
      if (!known.has(id)) console.warn(`[tech-categories] شناسه‌ی ناشناخته: ${id}`)
      used.add(id)
    }
  }
  for (const id of known) {
    if (!used.has(id)) console.warn(`[tech-categories] خدمتِ بی‌دسته: ${id}`)
  }
}
