/* ─────────────────────────────────────────────────────────────
   بازیکنان شاخص — منبع واحد بخش «ستارگان بیلیارد».
   این بخش با دایرکتوری‌های دیگر فرق دارد: فقط چهره‌های شاخص،
   ملی‌پوش و رنکینگ‌دار. ساختار برای گالری/آلبوم، تایم‌لاین
   افتخارات و اتصال به باشگاه/اخبار/مدیا آماده است.
   ───────────────────────────────────────────────────────────── */

export type Discipline = 'snooker' | 'pool'

export interface PlayerHighlight {
  year: string        // سال شمسی نمایشی
  title: string
}

export interface PlayerTournament {
  name: string
  year: string
  result: string
}

/* ── رسانه: همان مدلِ مربی، داور و خدماتِ فنی ──
   ⚠️ آلبومِ بازیکن هم شیء بود و عکس‌ها داخلش. یعنی چهارمین مدلِ
   متفاوت برای یک مفهوم. حالا نامِ آلبوم روی خودِ رسانه است و فهرستِ
   نام‌ها در `albums`. */
export interface PlayerMedia { id: string; url: string; caption: string; album?: string }
export interface PlayerVideo { id: string; url?: string; thumbnail: string; title: string; duration: string; album?: string }

/** شکلِ قدیمی — فقط برای خواندنِ ردیف‌های پیش از مهاجرت */
export interface PlayerAlbumLegacy {
  id: string
  title: string
  photos: string[]
}

export interface Player {
  id: string
  name: string
  nameEn: string
  discipline: Discipline
  /** رشته‌ها با رده‌ی سنی و دسته — پروفایل‌های ساخته‌شده توسط کاربر */
  disciplines?: import('./player-categories').DisciplineEntry[]
  city: string
  /** استان — از فرمِ ثبت‌نام می‌آید؛ زیرِ شهر در کارتِ مشخصات */
  province?: string
  country: string
  /** رتبه‌ی رنکینگ ملی — undefined یعنی بدون رنکینگ */
  ranking?: number
  national: boolean          // ملی‌پوش
  gender: 'm' | 'f'
  youth: boolean             // رده‌ی جوانان
  featured?: boolean         // ستاره‌ی ویژه (Elite)
  club?: { name: string; href?: string }
  /** رنگ دوتون کارت — از پالت محدود برند */
  /** تیکِ آبی — ستونِ `profiles.verified`، فقط ادمین می‌دهد */
  verified?: boolean
  tone: 'felt' | 'night' | 'bronze'
  /** تصویر بافت/صحنه برای پس‌زمینه‌ی دوتون (نه پرتره) */
  scene: string
  intro: string
  bio: string[]
  careerStart: string
  highlights: PlayerHighlight[]
  tournaments: PlayerTournament[]
  /** نامِ آلبوم‌ها — عضویت روی خودِ رسانه است */
  albums: string[]
  gallery: PlayerMedia[]
  videos: PlayerVideo[]
  /** برچسب‌هایی که اخبار/ویدیوهای مرتبط با آن‌ها پیدا می‌شوند */
  tags: string[]
}

/* ⚠️ عمداً خالی — پیش از رونمایی پاک شد.

   این آرایه 49 موجودیتِ ساختگی داشت که روی سایتِ زنده مثل داده‌ی
   واقعی دیده می‌شدند: نام، شهر، امتیاز و مشخصاتی که هیچ‌کدام وجودِ
   خارجی نداشتند و کلیکشان به هیچ‌جا نمی‌رسید.

   جای این‌ها با موجودیت‌های واقعیِ سایت پر می‌شود. اگر چیزی نباشد،
   بخش خالی می‌ماند — که درست است. آرایه نگه داشته شد (نه حذف) تا
   امضای ماژول و مصرف‌کننده‌هایش دست‌نخورده بمانند. */
export const PLAYERS: Player[] = []

export function getPlayer(id: string): Player | null {
  return PLAYERS.find(p => p.id === id) ?? null
}

export const DISCIPLINE_LABEL: Record<Discipline, { fa: string; en: string }> = {
  snooker: { fa: 'اسنوکر', en: 'SNOOKER' },
  pool:    { fa: 'پاکت بیلیارد', en: 'POOL' },
}

/* پالت دوتون کارت‌ها — محدود و در خانواده‌ی برند */
export const TONES: Record<Player['tone'], { from: string; to: string; glow: string }> = {
  felt:   { from: '#07231A', to: '#0E3A2A', glow: 'rgba(48,197,90,0.25)'   },
  night:  { from: '#0C1424', to: '#17253F', glow: 'rgba(74,158,255,0.22)'  },
  bronze: { from: '#171310', to: '#2A2118', glow: 'rgba(199,166,106,0.30)' },
}

export const faDigits = (v: string | number) =>
  String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)

/* ── ردیفِ قدیمی به مدلِ تازه ──
   عینِ همان مبدلِ خدماتِ فنی: روی *خواندن* تبدیل می‌شود تا هیچ عکسی
   با اولین ذخیره گم نشود و مهاجرتِ دیتابیس لازم نباشد. */
export function normalizePlayerMedia(d: {
  albums?: unknown; gallery?: unknown; videos?: unknown
}): { albums: string[]; gallery: PlayerMedia[]; videos: PlayerVideo[] } {
  const gallery: PlayerMedia[] = Array.isArray(d.gallery)
    ? (d.gallery as unknown[]).filter((g): g is PlayerMedia => !!g && typeof g === 'object' && typeof (g as PlayerMedia).url === 'string')
    : []
  const videos: PlayerVideo[] = Array.isArray(d.videos)
    ? (d.videos as unknown[]).filter((v): v is PlayerVideo => !!v && typeof v === 'object')
    : []
  const names: string[] = []
  const seenUrl = new Set(gallery.map(g => g.url))

  for (const a of (Array.isArray(d.albums) ? d.albums : [])) {
    if (typeof a === 'string') { const n = a.trim(); if (n && !names.includes(n)) names.push(n); continue }
    if (!a || typeof a !== 'object') continue
    const old = a as PlayerAlbumLegacy
    const n = (old.title ?? '').trim() || 'آلبوم'
    if (!names.includes(n)) names.push(n)
    for (const url of Array.isArray(old.photos) ? old.photos : []) {
      if (typeof url !== 'string' || !url || seenUrl.has(url)) continue
      seenUrl.add(url)
      gallery.push({ id: 'm' + gallery.length + '-' + url.slice(-12), url, caption: '', album: n })
    }
  }
  for (const g of gallery) { const n = (g.album ?? '').trim(); if (n && !names.includes(n)) names.push(n) }
  return { albums: names, gallery, videos }
}
