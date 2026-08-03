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

export interface PlayerAlbum {
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
  country: string
  /** رتبه‌ی رنکینگ ملی — undefined یعنی بدون رنکینگ */
  ranking?: number
  national: boolean          // ملی‌پوش
  gender: 'm' | 'f'
  youth: boolean             // رده‌ی جوانان
  featured?: boolean         // ستاره‌ی ویژه (Elite)
  club?: { name: string; href?: string }
  /** رنگ دوتون کارت — از پالت محدود برند */
  tone: 'felt' | 'night' | 'bronze'
  /** تصویر بافت/صحنه برای پس‌زمینه‌ی دوتون (نه پرتره) */
  scene: string
  intro: string
  bio: string[]
  careerStart: string
  highlights: PlayerHighlight[]
  tournaments: PlayerTournament[]
  albums: PlayerAlbum[]
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
