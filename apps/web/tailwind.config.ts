import type { Config } from 'tailwindcss';

/* ─────────────────────────────────────────────────────────────
   توکن‌های بیلیارد هاب.

   ── چرا این فایل تا امروز خالی بود و چرا مهم است ──
   `theme.extend` هیچ چیزی نداشت، در حالی که `globals.css` یک سیستم
   کامل توکن دارد (رنگ، سایه، شعاع، بلور). یعنی توکن‌ها *وجود
   داشتند ولی از Tailwind دست‌نیافتنی بودند* — نه `bg-gold` بود نه
   `shadow-md` معنای پروژه را می‌داد. نتیجه‌اش در کل مخزن دیده
   می‌شود: هگز هاردکد داخل `style={{}}` (`#C7A66A`، `#1C1B17`،
   `#EAE5DA`…) در ده‌ها فایل. این ریشه‌ی بی‌انسجامی بصری بود، نه
   سلیقه‌ی نویسنده‌ها.

   ── قاعده ──
   عدد این‌جا تکرار نمی‌شود. هر مقدار به متغیر CSS `globals.css`
   اشاره می‌کند؛ آن‌جا تنها منبع حقیقت است. رنگ‌ها سه‌تایی کانال
   می‌گیرند تا پیمانه‌ی شفافیت (`text-ink/60`) کار کند.
   ───────────────────────────────────────────────────────────── */

const ch = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* سطح‌ها */
        paper: ch('--c-paper'),
        mist: ch('--c-mist'),
        surface: ch('--c-surface'),
        /* جوهر — سه پله، نه بیشتر */
        ink: {
          DEFAULT: ch('--c-ink'),
          2: ch('--c-ink-2'),
          3: ch('--c-ink-3'),
        },
        /* تنها رنگ تأکید */
        gold: {
          DEFAULT: ch('--c-gold'),
          deep: ch('--c-gold-deep'),
          dark: ch('--c-gold-dark'),
          light: ch('--c-gold-light'),
        },
        line: ch('--c-line'),
      },

      /* ── فاصله ──
         ⚠️ فقط پله‌های مجاز `CLAUDE.md`: ۱ ۲ ۳ ۴ ۶ ۸ ۱۲ ۱۶ ۲۴.
         Tailwind پله‌های دیگری هم دارد؛ این‌ها فقط نام‌های معناداری
         هستند که در بازبینی خوانا باشند. */
      /* ⚠️ نام اختصاصی، نه بازتعریف نام Tailwind. `rounded-lg` در ۴۹
         جای دیگر، `rounded-xl` در ۱۰۳ جا و `rounded-2xl` در ۳۵ جا از
         قبل استفاده می‌شود؛ بازتعریفشان اندازه‌ی همه را بی‌صدا عوض
         می‌کرد — روی صفحه‌هایی که در پاس بصری نبودند. */
      borderRadius: {
        chip: 'var(--r1)',    /* 6  — چیپ، برچسب */
        field: 'var(--r2)',   /* 10 — ورودی، دکمه */
        card: 'var(--r3)',    /* 14 — کارت */
        panel: 'var(--r4)',   /* 18 — کارت بزرگ */
        modal: 'var(--r5)',   /* 24 — پنجره */
        hero: 'var(--r6)',    /* 32 — بلوک هیرو */
      },

      /* همان دلیل بالا: `shadow-sm` در ۳۱ جا و `shadow-md` در ۱۲ جا
         استفاده می‌شود. */
      boxShadow: {
        e0: 'var(--shadow-xs)',
        e1: 'var(--shadow-sm)',
        e2: 'var(--shadow-md)',
        e3: 'var(--shadow-lg)',
        e4: 'var(--shadow-xl)',
        /* ⚠️ نامش `gold` بود و با `colors.gold` تصادم می‌کرد: Tailwind
           هر دو را `.shadow-gold` می‌ساخت و نسخه‌ی *رنگ* بعدتر می‌آمد
           و برنده می‌شد — یعنی سایه‌ی دکمه طلایی تمام‌شفافیت می‌شد،
           نه سایه‌ی ملایم تیره. */
        cta: '0 10px 24px -8px rgb(var(--c-gold-deep) / .45)',
      },

      /* عدد این‌جا هم تکرار نمی‌شود */
      backdropBlur: {
        1: 'var(--bl1)',
        2: 'var(--bl2)',
        3: 'var(--bl3)',
        4: 'var(--bl4)',
      },

      fontFamily: {
        /* یک خانواده. فونت دوم اضافه نمی‌شود. */
        sans: ['IRANSansX', 'Tahoma', 'system-ui', 'sans-serif'],
      },

      /* ── مقیاس تایپوگرافی ──
         ⚠️ `CLAUDE.md` می‌گوید در هر صفحه حداکثر سه اندازه دیده شود.
         این‌ها نقش‌اند، نه اندازه‌های آزاد: هر کدام ارتفاع خط و
         تراکم حروف خودش را دارد، چون فارسی با line-height پیش‌فرض
         Tailwind فشرده می‌شود. */
      fontSize: {
        'display': ['clamp(1.75rem, 1.2rem + 2.4vw, 2.75rem)', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '800' }],
        'title': ['clamp(1.25rem, 1.05rem + 0.9vw, 1.6rem)', { lineHeight: '1.5', letterSpacing: '-0.005em', fontWeight: '800' }],
        'section': ['1.0625rem', { lineHeight: '1.6', fontWeight: '800' }],
        'body': ['0.9375rem', { lineHeight: '1.9' }],
        'sub': ['0.8125rem', { lineHeight: '1.85' }],
        'meta': ['0.75rem', { lineHeight: '1.7' }],
      },

      /* ⚠️ نام `out` خود `ease-out` Tailwind را بازتعریف می‌کرد و
         هشت مصرف‌کننده‌ی موجود را عوض می‌کرد. */
      transitionTimingFunction: {
        /* ⚠️ یک منحنی، نه دو. اینجا قبلا `spring` هم بود با فراجهش
           بالای ۱ — دتکتور درست گرفتش: فراجهش قدیمی به نظر می‌رسد و
           روی ورود مودال دیده می‌شود. حالا هر دو نام یک مقدار
           داشتند، یعنی نام دوم دروغ می‌گفت؛ برداشته شد. */
        smooth: 'cubic-bezier(.22,.61,.36,1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '220ms',
        slow: '340ms',
      },

      /* ⚠️ اندازه‌ی واقعی گوشی‌های مخاطب، نه پیش‌فرض Tailwind */
      screens: {
        xs: '390px',
      },

      maxWidth: {
        /* عرض خواندنی متن فارسی — نه کل صفحه */
        prose: '68ch',
      },
    },
  },
  plugins: [],
};

export default config;
