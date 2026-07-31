/* ─────────────────────────────────────────────────────────────
   رشته و دسته‌بندی بازیکن — منبع واحد.

   دسته‌بندی‌ها عمداً همان‌هایی هستند که در بخش رنکینگ سایت
   (lib/rankings-store) استفاده می‌شوند، تا بازیکن دقیقاً در همان
   جدولی قرار بگیرد که در /ranking دیده می‌شود.

   محور رنکینگ، «دسته» و «رده‌ی سنی» را در یک لیست ادغام کرده
   (دسته برتر / دسته یک / زیر ۲۱ سال / پیشکسوتان). این‌جا از کاربر
   دو چیز جدا می‌پرسیم — رده‌ی سنی و دسته — و خودمان به همان
   برچسب رنکینگ ترجمه می‌کنیم؛ وگرنه «بزرگسالان» جایی برای انتخاب
   نداشت.
   ───────────────────────────────────────────────────────────── */

export type Discipline = 'snooker' | 'pool' | 'highball'
export type AgeGroup = 'adult' | 'u21' | 'senior'
export type Division = 'premier' | 'first'
export type Gender = 'm' | 'f'

export const DISCIPLINES: { key: Discipline; fa: string; en: string; ranked: boolean }[] = [
  { key: 'snooker',  fa: 'اسنوکر',        en: 'SNOOKER',  ranked: true  },
  { key: 'pool',     fa: 'پاکت بیلیارد',  en: 'POOL',     ranked: true  },
  /* های‌بال هنوز جدول رنکینگ ندارد؛ انتخابش آزاد است ولی به رنکینگ وصل نمی‌شود */
  { key: 'highball', fa: 'های‌بال',       en: 'HIGHBALL', ranked: false },
]

export const AGE_GROUPS: { key: AgeGroup; fa: string }[] = [
  { key: 'adult',  fa: 'بزرگسالان'   },
  { key: 'u21',    fa: 'زیر ۲۱ سال'  },
  { key: 'senior', fa: 'پیشکسوتان'   },
]

export const DIVISIONS: { key: Division; fa: string }[] = [
  { key: 'premier', fa: 'دسته برتر' },
  { key: 'first',   fa: 'دسته یک'   },
]

export interface DisciplineEntry {
  discipline: Discipline
  ageGroup: AgeGroup
  /** فقط برای بزرگسالان معنا دارد */
  division: Division | ''
}

export const disciplineFa = (d: Discipline | string): string =>
  DISCIPLINES.find(x => x.key === d)?.fa ?? String(d)
export const disciplineEn = (d: Discipline | string): string =>
  DISCIPLINES.find(x => x.key === d)?.en ?? String(d).toUpperCase()
export const ageGroupFa = (a: AgeGroup | string): string =>
  AGE_GROUPS.find(x => x.key === a)?.fa ?? ''
export const divisionFa = (d: Division | string): string =>
  DIVISIONS.find(x => x.key === d)?.fa ?? ''

export const isRanked = (d: Discipline | string): boolean =>
  !!DISCIPLINES.find(x => x.key === d)?.ranked

/** بانوان در جدول رنکینگ «دسته یک» ندارند */
export function divisionsFor(gender: Gender): typeof DIVISIONS {
  return gender === 'f' ? DIVISIONS.filter(d => d.key === 'premier') : DIVISIONS
}

/** کلید رشته در lib/rankings-store (آن‌جا پاکت `pocket` نام دارد) */
export function rankingSport(d: Discipline | string): 'snooker' | 'pocket' | null {
  if (d === 'snooker') return 'snooker'
  if (d === 'pool') return 'pocket'
  return null
}

/** برچسب دقیق دسته در جدول رنکینگ — null یعنی این رشته جدول ندارد */
export function rankingCategory(e: DisciplineEntry, gender: Gender): string | null {
  if (!isRanked(e.discipline)) return null
  if (e.ageGroup !== 'adult') return ageGroupFa(e.ageGroup)
  const div = e.division || (gender === 'f' ? 'premier' : '')
  return div ? divisionFa(div) : null
}

/** خلاصه‌ی یک‌خطی برای نمایش: «اسنوکر — دسته برتر» */
export function entryLabel(e: DisciplineEntry, gender: Gender): string {
  const cat = rankingCategory(e, gender)
  const age = e.ageGroup === 'adult' ? '' : ageGroupFa(e.ageGroup)
  const tail = cat ?? age
  return tail ? `${disciplineFa(e.discipline)} — ${tail}` : disciplineFa(e.discipline)
}

export const emptyEntry = (discipline: Discipline): DisciplineEntry =>
  ({ discipline, ageGroup: 'adult', division: 'premier' })

/** ورودی ناهمگون (پروفایل‌های قدیمی) → لیست استاندارد */
export function normalizeEntries(raw: unknown, legacy?: string): DisciplineEntry[] {
  const ok = (d: unknown): d is Discipline => DISCIPLINES.some(x => x.key === d)
  if (Array.isArray(raw)) {
    const out: DisciplineEntry[] = []
    for (const item of raw) {
      if (typeof item === 'string' && ok(item)) { out.push(emptyEntry(item)); continue }
      const o = item as Partial<DisciplineEntry>
      if (o && ok(o.discipline)) {
        out.push({
          discipline: o.discipline,
          ageGroup: AGE_GROUPS.some(a => a.key === o.ageGroup) ? o.ageGroup! : 'adult',
          division: DIVISIONS.some(d => d.key === o.division) ? o.division! : '',
        })
      }
    }
    if (out.length) return out
  }
  return ok(legacy) ? [emptyEntry(legacy)] : []
}
