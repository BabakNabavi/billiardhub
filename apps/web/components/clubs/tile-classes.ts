/* سطحِ کارتِ باشگاه — جدا از `ClubCard.tsx` چون آن فایل `'use client'` است و
   اسکلتِ بارگذاری (`ClubsStates`) نباید سطح را از نو بنویسد. همان دلیلِ
   `components/ui/button-classes.ts`. */

/** سطحِ مشترکِ کارت، ردیف و اسکلت — بدونِ حرکت */
export const TILE_SURFACE = 'overflow-hidden rounded-panel bg-surface shadow-tile'

/* ⚠️ هاور فقط روی دستگاهی که واقعاً هاور دارد. روی لمس، `:hover` بعد از تپ
   می‌چسبد: کارت بالا می‌ماند، و تپ روی قلب هم کلِ کارت را بالا می‌برد.
   `.lq-pcard` پیشین همین را با `@media (hover: none)` بسته بود. فشردن
   (`active`) روی هر دو می‌ماند. */
export const TILE = [
  'lq-rise group relative', TILE_SURFACE,
  'transition-[box-shadow,transform] duration-slow ease-smooth active:scale-[.99]',
  '[@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-tile-hover',
  'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100',
].join(' ')

/** لینکِ کشیده‌ی روی نام — حلقه‌ی فوکوس داخلِ کارت، چون کارت `overflow-hidden` است */
export const STRETCHED = [
  "text-inherit no-underline after:absolute after:inset-0 after:rounded-panel after:content-['']",
  'focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-gold-deep',
].join(' ')

/** تینتِ دکمه‌ی قرصیِ داخلِ کارت وقتی کارت زیرِ نشانگر است — باز فقط با هاورِ واقعی */
export const PILL_ON_CARD_HOVER = '[@media(hover:hover)]:group-hover:bg-gold/20'
