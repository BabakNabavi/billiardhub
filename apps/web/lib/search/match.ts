/* ─────────────────────────────────────────────────────────────
   تطبیقِ جست‌وجوی سایت — منطقِ خالص، بی‌دیتابیس.

   ── چرا «همه‌ی واژه‌ها، در هر فیلدی» ──
   نامِ مربی و داور در دو فیلدِ جدا ذخیره شده (`firstNameFa` و
   `lastNameFa`)، پس «بابک نبوی» با جست‌وجوی سرراستِ `ilike` روی هر
   فیلد به‌تنهایی پیدا نمی‌شد. این‌جا هر رکورد یک «متنِ قابلِ جست‌وجو»
   دارد (همه‌ی فیلدهای معنادارش کنارِ هم) و رکورد پیدا شده است اگر
   *همه‌ی* واژه‌های عبارت در آن باشند — به هر ترتیبی.

   تای «ی/ي» و «ک/ك» و کوچک‌کردنِ حروفِ لاتین از همان `foldCase`ِ
   بیلیارد مدیا می‌آید (`lib/media/search-term`) — یک قاعده برای کلِ سایت.
   ───────────────────────────────────────────────────────────── */

import { foldCase, sanitizeIlike } from '../media/search-term'

export const MIN_QUERY = 2
export const MAX_QUERY = 80

/* ⚠️ نشانه‌گذاری هر دو طرف (عبارت و متنِ رکورد) فاصله می‌شود: «آرتا» در گیومه
   یا «آرتا،» با ویرگول وگرنه واژه‌ی ««آرتا»» می‌ساخت که با هیچ چیز نمی‌خورد،
   و `"` یا آکولاد داخلِ برچسبِ آرایه‌ایِ PostgREST (`tags.cs.{…}`) خطا می‌داد. */
const PUNCT = /["'«»“”{}<>.:;!?؟،؛|]/g

/** واژه‌های عبارت، پاک‌سازی‌شده و تاشده. کمتر از دو نویسه ⟵ هیچ. */
export function tokensOf(raw: unknown): string[] {
  const clean = sanitizeIlike(raw, MAX_QUERY).replace(PUNCT, ' ')
  if (clean.replace(/\s/g, '').length < MIN_QUERY) return []
  /* نیم‌فاصله و فاصله‌ی معمولی یکی — «بیلیارد‌هاب» و «بیلیارد هاب» */
  return [...new Set(foldCase(clean).replace(/\u200C/g, ' ').split(/\s+/).filter(Boolean))]
}

/** متنِ قابلِ جست‌وجوی یک رکورد از چند فیلدِ اختیاری */
export function haystackOf(...parts: unknown[]): string {
  return foldCase(parts.filter(p => typeof p === 'string' && p.trim()).join(' ').replace(PUNCT, ' ')).replace(/\u200C/g, ' ')
}

/** همه‌ی واژه‌ها در متن هستند؟ */
export function matchesAll(hay: string, tokens: string[]): boolean {
  return tokens.length > 0 && tokens.every(t => hay.includes(t))
}

/** امتیازِ ساده برای ترتیب: تطبیق در عنوان بالاتر از تطبیق در توضیح، و شروعِ عنوان بالاتر از همه */
export function scoreOf(title: string, tokens: string[]): number {
  const t = haystackOf(title)
  let s = 0
  for (const tok of tokens) {
    if (t.startsWith(tok)) s += 3
    else if (t.includes(tok)) s += 2
  }
  return s
}

/** بلندترین واژه — برای پیش‌فیلترِ سمتِ دیتابیس روی جدول‌های بزرگ */
export function longestToken(tokens: string[]): string {
  return tokens.reduce((a, b) => (b.length > a.length ? b : a), '')
}
