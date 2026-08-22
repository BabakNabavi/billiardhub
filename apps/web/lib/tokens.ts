/* ─────────────────────────────────────────────────────────────
   ⚠️ منسوخ — از این فایل چیزی *تازه* نخوان.

   این فایل خودش را «single source of truth» می‌نامید ولی سه چیز در
   آن دروغ بود:

     ۱) زمینه‌هایش **تیره** بودند (`#020806`, `#060d0a`) — بازمانده‌ی
        یک طرحِ رهاشده، روی سایتی که تمش روشن است. هر کامپوننتی که
        از آن‌ها استفاده می‌کرد عملاً نامرئی می‌شد.
     ۲) `accent.green` در واقع **طلایی** بود (`#C7A66A`). نام دروغ
        می‌گفت، و بعد `Button` واریانتِ «اصلی»اش را واقعاً سبز کرد.
     ۳) `cyan`/`violet` هیچ‌جای این برند معنا ندارند.

   منبعِ واقعیِ توکن‌ها `app/globals.css` است (سه‌تاییِ کانال) و
   دسترسیِ برنامه‌ای به آن از راهِ کلاس‌های Tailwind است:
   `bg-gold`, `text-ink-2`, `rounded-md`, `shadow-sm`, `duration-base`…

   مقادیرِ زیر فقط برای اینکه چیزی نشکند نگه داشته شده‌اند و حالا به
   پالتِ واقعی اشاره می‌کنند، نه به طرحِ تیره. هر مصرف‌کننده‌ای که
   پیدا شد باید به Tailwind منتقل شود و بعد این فایل حذف شود.
   ───────────────────────────────────────────────────────────── */

/** @deprecated کلاس‌های Tailwind را استفاده کن (`bg-gold`, `text-ink`…) */
export const colors = {
  bg: {
    base: 'var(--bg-primary)',
    surface: 'var(--bg-surface)',
    elevated: 'var(--bg-secondary)',
    card: 'var(--bg-surface)',
    cardHover: 'var(--bg-secondary)',
  },
  accent: {
    /* نامِ تاریخی؛ مقدارش همیشه طلایی بوده است */
    green: 'var(--gold)',
    dark: 'var(--gold-dark)',
    deep: 'var(--gold-deep)',
    /* ⚠️ این سه رنگ در برند وجود ندارند و عمداً به طلایی می‌افتند تا
       اگر جایی مانده باشد، پالت را نشکند. */
    cyan: 'var(--gold)',
    violet: 'var(--gold)',
    amber: '#F59E0B',
    red: '#B23B2E',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-tertiary)',
    dark: 'var(--text-tertiary)',
  },
  border: {
    base: 'var(--border)',
    accent: 'var(--gold-border)',
    strong: 'var(--border-strong)',
  },
} as const

/** @deprecated `rounded-xs|sm|md|lg|xl|2xl` */
export const radius = {
  sm: 'var(--r2)',
  md: 'var(--r3)',
  lg: 'var(--r4)',
  xl: 'var(--r5)',
  full: '100px',
} as const

/** @deprecated `shadow-xs|sm|md|lg|xl` */
export const shadow = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
} as const

/** @deprecated `duration-fast|base|slow` + `ease-out|spring` */
export const transition = {
  fast: 'all 150ms cubic-bezier(.22,.61,.36,1)',
  base: 'all 220ms cubic-bezier(.22,.61,.36,1)',
  slow: 'all 340ms cubic-bezier(.22,.61,.36,1)',
  /** @deprecated فراجهش برداشته شد؛ همان `slow` را استفاده کن */
  spring: 'all 340ms cubic-bezier(.22,.61,.36,1)',
} as const
