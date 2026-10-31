/* ─────────────────────────────────────────────────────────────
   فیلترِ کادرِ جست‌وجوی هر بخش — همان موتورِ جست‌وجوی سراسری.

   تا آبانِ ۱۴۰۵ هر بخش (تولیدکنندگان، فروشگاه‌ها، بازیکنان، مسابقات…)
   با `name.includes(q)` فیلتر می‌کرد: «صنايع» با یِ عربی یا «آرتا صنایع»
   به ترتیبِ دیگر چیزی پیدا نمی‌کرد، در حالی که کادرِ نوارِ بالا پیدا
   می‌کرد. حالا هر دو یک قاعده دارند (`lib/search/match`): تای ی/ي و ک/ك،
   همه‌ی واژه‌ها به هر ترتیبی، در هر فیلدی.

   یک حرف (زیرِ حدِ جست‌وجوی سراسری) هم فیلتر می‌کند — همان رفتارِ قبلیِ
   کادرهای بخش‌ها، فقط تاشده.
   ───────────────────────────────────────────────────────────── */

import { haystackOf, matchesAll, tokensOf } from './match'
import { foldCase } from '../media/search-term'

/** تابعی که می‌گوید یک رکورد (با فیلدهایش) با عبارت جور است یا نه */
export function makeMatcher(q: string): (...fields: unknown[]) => boolean {
  const raw = q.trim()
  if (!raw) return () => true
  const tokens = tokensOf(raw)
  if (tokens.length) return (...fields) => matchesAll(haystackOf(...fields), tokens)
  const one = foldCase(raw)
  return (...fields) => haystackOf(...fields).includes(one)
}
