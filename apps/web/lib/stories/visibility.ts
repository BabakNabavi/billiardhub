/* ─────────────────────────────────────────────────────────────
   کدام استوریِ زنده دیگر نشان داده نشود — منطقِ خالص، بی‌دیتابیس.

   پیش از آبانِ ۱۴۰۵ کاربرِ عادی هم استوری می‌گذاشت (حقِ نقش با سقفِ تعداد
   برداشته شده بود). استوری‌هایی که آن موقع رفتند `via` ندارند؛ از آن به
   بعد هر استوری می‌گوید از چه راهی حق داشت.

     plan / free ⟵ هرگز پنهان نمی‌شود: پولش داده شده یا ادمین داده، و تا
                   پایانِ ۲۴ ساعت حقِ دیده‌شدن دارد حتی اگر بسته تمام شود
     role        ⟵ اگر نقش پس گرفته شد، پنهان
     بی‌via      ⟵ مثلِ قاعده‌ی امروزِ انتشار: نقش، یا بسته، یا سهمیه‌ی
                   رایگانِ کاربرِ عادی
   ───────────────────────────────────────────────────────────── */

import type { StoryVia } from './quota'

export interface OwnerStanding {
  /** نقشِ واجدِ استوری دارد؟ (`canPostStory`) */
  hasStoryRole: boolean
  /** بسته‌ی فعال دارد؟ null یعنی خوانده نشد */
  hasPlan: boolean | null
}

export function hideLiveStory(via: StoryVia | undefined, owner: OwnerStanding, plainUsersMayPost: boolean): boolean {
  if (via === 'plan' || via === 'free') return false
  if (owner.hasStoryRole) return false
  if (via === 'role') return true
  /* استوریِ پیش از این قاعده: خواندنِ بسته شکست خورد ⟵ پنهان نکن */
  if (owner.hasPlan !== false) return false
  return !plainUsersMayPost
}
