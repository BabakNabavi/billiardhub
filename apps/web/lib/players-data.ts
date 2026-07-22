/* ─────────────────────────────────────────────────────────────
   بازیکنان شاخص — منبعِ واحدِ بخشِ «ستارگان بیلیارد».
   این بخش با دایرکتوری‌های دیگر فرق دارد: فقط چهره‌های شاخص،
   ملی‌پوش و رنکینگ‌دار. ساختار برای گالری/آلبوم، تایم‌لاینِ
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
  city: string
  country: string
  /** رتبه‌ی رنکینگ ملی — undefined یعنی بدون رنکینگ */
  ranking?: number
  national: boolean          // ملی‌پوش
  gender: 'm' | 'f'
  youth: boolean             // رده‌ی جوانان
  featured?: boolean         // ستاره‌ی ویژه (Elite)
  club?: { name: string; href?: string }
  /** رنگِ دوتونِ کارت — از پالتِ محدودِ برند */
  tone: 'felt' | 'night' | 'bronze'
  /** تصویرِ بافت/صحنه برای پس‌زمینه‌ی دوتون (نه پرتره) */
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

export const PLAYERS: Player[] = [
  {
    id: 'arman-tavakoli',
    name: 'آرمان توکلی',
    nameEn: 'ARMAN TAVAKOLI',
    discipline: 'snooker',
    city: 'تهران',
    country: 'ایران',
    ranking: 1,
    national: true,
    gender: 'm',
    youth: false,
    featured: true,
    club: { name: 'باشگاه پلاتینیوم', href: '/clubs' },
    tone: 'felt',
    scene: '/images/shop/snooker-table.jpg',
    intro: 'مردِ شماره‌ی یکِ اسنوکر ایران؛ سه فصلِ پیاپی صدرنشینِ رنکینگ ملی.',
    bio: [
      'آرمان توکلی بازی را از چهارده‌سالگی در سالنِ کوچکی در جنوب تهران شروع کرد؛ جایی که به گفته‌ی خودش «فقط یک میزِ سالم داشت و همان کافی بود.» ده سال بعد، او پرافتخارترین بازیکنِ نسلِ خودش است.',
      'سبکِ بازی‌اش را با برک‌سازیِ صبور و سِیفتی‌های دقیق می‌شناسند؛ ترکیبی که در فینال قهرمانی کشور با برکِ ۱۳۲ به کامل‌ترین شکل دیده شد.',
      'او حالا در کنارِ حضور در اردوهای تیم ملی، روی نخستین حضورِ ایران در جدول اصلیِ یک رویدادِ رنکینگ جهانی تمرکز کرده است.',
    ],
    careerStart: '۱۳۹۴',
    highlights: [
      { year: '۱۴۰۵', title: 'قهرمان مسابقات قهرمانی کشور — اسنوکر' },
      { year: '۱۴۰۴', title: 'صدرنشین رنکینگ ملی برای سومین فصل پیاپی' },
      { year: '۱۴۰۳', title: 'نایب‌قهرمان تیمی آسیا — عضو تیم ملی' },
      { year: '۱۴۰۱', title: 'برکِ ۱۴۷ رسمی در لیگ برتر' },
    ],
    tournaments: [
      { name: 'قهرمانی کشور', year: '۱۴۰۵', result: 'قهرمان' },
      { name: 'تهران مسترز', year: '۱۴۰۴', result: 'فینالیست' },
      { name: 'قهرمانی آسیا (تیمی)', year: '۱۴۰۳', result: 'نایب‌قهرمان' },
    ],
    albums: [
      { id: 'a1', title: 'آلبوم مسابقات', photos: ['/images/shop/snooker-table.jpg', '/images/HS/1.jfif', '/images/shop/snooker-table-2.jpg', '/images/HS/4.jfif'] },
      { id: 'a2', title: 'آلبوم تیم ملی', photos: ['/images/HS/5.jfif', '/images/shop/Pro_table.jpg', '/images/hero/hero-lounge.jpg'] },
    ],
    tags: ['تیم ملی', 'اسنوکر', 'قهرمانی آسیا'],
  },
  {
    id: 'niloufar-azimi',
    name: 'نیلوفر عظیمی',
    nameEn: 'NILOUFAR AZIMI',
    discipline: 'snooker',
    city: 'مشهد',
    country: 'ایران',
    ranking: 2,
    national: true,
    gender: 'f',
    youth: false,
    featured: true,
    club: { name: 'مجموعه آفتاب', href: '/clubs' },
    tone: 'night',
    scene: '/images/HS/2.jfif',
    intro: 'پرافتخارترین بانوی اسنوکر ایران و نخستین بانوی صاحبِ برکِ بالای ۱۰۰ در مسابقات رسمی.',
    bio: [
      'نیلوفر عظیمی با قهرمانیِ چهار دوره‌ی لیگ بانوان، مرزهای اسنوکر بانوان ایران را جابه‌جا کرده است. برکِ ۱۰۴ او در فینال ۱۴۰۳، نخستین سنچریِ ثبت‌شده‌ی بانوان در مسابقات رسمی کشور بود.',
      'او هم‌زمان با بازی، مسیرِ نسل بعد را هم می‌سازد؛ کلاس‌های هفتگی‌اش برای دخترانِ نوجوانِ مشهد همیشه تکمیل است.',
    ],
    careerStart: '۱۳۹۶',
    highlights: [
      { year: '۱۴۰۵', title: 'قهرمان لیگ برتر بانوان — چهارمین عنوان' },
      { year: '۱۴۰۳', title: 'نخستین سنچریِ بانوان در مسابقات رسمی (برک ۱۰۴)' },
      { year: '۱۴۰۲', title: 'عضو ثابت تیم ملی بانوان' },
    ],
    tournaments: [
      { name: 'لیگ برتر بانوان', year: '۱۴۰۵', result: 'قهرمان' },
      { name: 'قهرمانی کشور بانوان', year: '۱۴۰۴', result: 'قهرمان' },
    ],
    albums: [
      { id: 'a1', title: 'آلبوم مسابقات', photos: ['/images/HS/2.jfif', '/images/shop/Ball-1.jpg', '/images/HS/6.jfif'] },
    ],
    tags: ['لیگ بانوان', 'اسنوکر', 'برک'],
  },
  {
    id: 'kaveh-shirazi',
    name: 'کاوه شیرازی',
    nameEn: 'KAVEH SHIRAZI',
    discipline: 'pool',
    city: 'تهران',
    country: 'ایران',
    ranking: 1,
    national: true,
    gender: 'm',
    youth: false,
    featured: true,
    club: { name: 'باشگاه پرشین', href: '/clubs' },
    tone: 'bronze',
    scene: '/images/shop/Ball.jpg',
    intro: 'شماره‌ی یکِ پاکت بیلیارد ایران؛ قهرمانِ بی‌رقیبِ ناین‌بال در دو فصل اخیر.',
    bio: [
      'کاوه شیرازی سریع بازی می‌کند، بی‌پروا حمله می‌کند و به‌ندرت میز را ترک می‌کند؛ سبکی که او را به تماشایی‌ترین بازیکنِ پاکت بیلیارد ایران تبدیل کرده است.',
      'او در دو فصلِ گذشته هر دو تورِ ملی ناین‌بال را برده و حالا نگاهش به مسابقاتِ قهرمانی آسیاست.',
    ],
    careerStart: '۱۳۹۲',
    highlights: [
      { year: '۱۴۰۵', title: 'قهرمان تور ملی ناین‌بال — دومین فصل پیاپی' },
      { year: '۱۴۰۳', title: 'قهرمان تِن‌بال کشور' },
      { year: '۱۴۰۲', title: 'دعوت به اردوی تیم ملی پاکت بیلیارد' },
    ],
    tournaments: [
      { name: 'تور ملی ناین‌بال', year: '۱۴۰۵', result: 'قهرمان' },
      { name: 'مسترز پایان فصل', year: '۱۴۰۴', result: 'قهرمان' },
    ],
    albums: [
      { id: 'a1', title: 'آلبوم مسابقات', photos: ['/images/shop/Ball.jpg', '/images/shop/Home_table.jpg', '/images/shop/pool_chalk_1.jpg'] },
      { id: 'a2', title: 'آلبوم تمرینات', photos: ['/images/shop/cue_billiard_2.jpg', '/images/shop/Pro_table.jpg'] },
    ],
    tags: ['ناین‌بال', 'پاکت بیلیارد', 'تور ملی'],
  },
  {
    id: 'sina-rostami',
    name: 'سینا رستمی',
    nameEn: 'SINA ROSTAMI',
    discipline: 'snooker',
    city: 'اصفهان',
    country: 'ایران',
    ranking: 3,
    national: false,
    gender: 'm',
    youth: false,
    club: { name: 'باشگاه زاینده‌رود' },
    tone: 'felt',
    scene: '/images/shop/snooker-table-2.jpg',
    intro: 'تاکتیکی‌ترین بازیکنِ رنکینگ؛ استادِ فریم‌های طولانی و جنگ‌های سِیفتی.',
    bio: [
      'سینا رستمی را «شطرنج‌بازِ میز» صدا می‌زنند؛ بازیکنی که با صبر و سِیفتی‌های چندلایه حریف را وادار به اشتباه می‌کند و در سه فصل گذشته همیشه بین سه نفرِ اول رنکینگ بوده است.',
    ],
    careerStart: '۱۳۹۵',
    highlights: [
      { year: '۱۴۰۴', title: 'نایب‌قهرمان قهرمانی کشور' },
      { year: '۱۴۰۳', title: 'قهرمان مسابقات آزاد اصفهان' },
    ],
    tournaments: [
      { name: 'قهرمانی کشور', year: '۱۴۰۴', result: 'نایب‌قهرمان' },
      { name: 'تهران مسترز', year: '۱۴۰۴', result: 'نیمه‌نهایی' },
    ],
    albums: [
      { id: 'a1', title: 'آلبوم مسابقات', photos: ['/images/shop/snooker-table-2.jpg', '/images/HS/1.jfif'] },
    ],
    tags: ['اسنوکر', 'رنکینگ'],
  },
  {
    id: 'shirin-kamali',
    name: 'شیرین کمالی',
    nameEn: 'SHIRIN KAMALI',
    discipline: 'pool',
    city: 'شیراز',
    country: 'ایران',
    ranking: 2,
    national: true,
    gender: 'f',
    youth: false,
    club: { name: 'باشگاه پرستیژ' },
    tone: 'night',
    scene: '/images/shop/Ball-1.jpg',
    intro: 'چهره‌ی اولِ پاکت بیلیاردِ بانوان و نماینده‌ی ایران در رقابت‌های غرب آسیا.',
    bio: [
      'شیرین کمالی با بردِ تاریخی‌اش برابر قهرمانِ سابقِ غرب آسیا، پاکت بیلیاردِ بانوان ایران را به نقشه‌ی منطقه برگرداند. ضربه‌ی برکِ او یکی از قدرتمندترین‌های لیگ است — فارغ از جنسیت.',
    ],
    careerStart: '۱۳۹۷',
    highlights: [
      { year: '۱۴۰۵', title: 'قهرمان لیگ بانوان — پاکت بیلیارد' },
      { year: '۱۴۰۳', title: 'نماینده‌ی ایران در قهرمانی غرب آسیا' },
    ],
    tournaments: [
      { name: 'لیگ بانوان', year: '۱۴۰۵', result: 'قهرمان' },
    ],
    albums: [
      { id: 'a1', title: 'آلبوم مسابقات', photos: ['/images/shop/Ball-1.jpg', '/images/HS/2.jfif'] },
    ],
    tags: ['پاکت بیلیارد', 'لیگ بانوان'],
  },
  {
    id: 'amirali-nejat',
    name: 'امیرعلی نجات',
    nameEn: 'AMIRALI NEJAT',
    discipline: 'snooker',
    city: 'تبریز',
    country: 'ایران',
    ranking: 7,
    national: false,
    gender: 'm',
    youth: true,
    club: { name: 'آکادمی بیلیارد هاب' },
    tone: 'bronze',
    scene: '/images/HS/6.jfif',
    intro: 'پدیده‌ی هفده‌ساله‌ی اسنوکر؛ جوان‌ترین بازیکنِ تاریخِ جمعِ ده نفرِ اول رنکینگ.',
    bio: [
      'امیرعلی نجات در شانزده‌سالگی واردِ جدولِ اصلی قهرمانی کشور شد و یک سال بعد، با ورود به جمعِ ده نفر اول رنکینگ، رکوردِ کم‌سن‌ترین بازیکنِ تاریخِ این جمع را شکست.',
      'او محصولِ نسلِ اولِ آکادمی ملی استعدادیابی است و کارشناسان او را آینده‌ی اسنوکر ایران می‌دانند.',
    ],
    careerStart: '۱۴۰۲',
    highlights: [
      { year: '۱۴۰۵', title: 'ورود به جمع ۱۰ بازیکن برتر رنکینگ — رکورد سنی' },
      { year: '۱۴۰۴', title: 'قهرمان مسابقات جوانان کشور' },
    ],
    tournaments: [
      { name: 'قهرمانی جوانان کشور', year: '۱۴۰۴', result: 'قهرمان' },
    ],
    albums: [
      { id: 'a1', title: 'آلبوم مسابقات', photos: ['/images/HS/6.jfif', '/images/shop/snooker-table.jpg'] },
    ],
    tags: ['جوانان', 'اسنوکر', 'استعدادیابی'],
  },
  {
    id: 'behrad-mohseni',
    name: 'بهراد محسنی',
    nameEn: 'BEHRAD MOHSENI',
    discipline: 'pool',
    city: 'مشهد',
    country: 'ایران',
    ranking: 4,
    national: false,
    gender: 'm',
    youth: false,
    tone: 'felt',
    scene: '/images/shop/Home_table.jpg',
    intro: 'متخصصِ برک‌های سنگین؛ صاحبِ رکوردِ بیشترین بردِ متوالی در لیگ شهری.',
    bio: [
      'بهراد محسنی با چهارده بردِ متوالی در لیگ شهری مشهد، رکوردی ثبت کرد که هنوز پابرجاست. بازیکنی که بهترین بازی‌اش را در شب‌های حذفی نشان می‌دهد.',
    ],
    careerStart: '۱۳۹۶',
    highlights: [
      { year: '۱۴۰۴', title: 'رکورد ۱۴ برد متوالی — لیگ شهری مشهد' },
    ],
    tournaments: [
      { name: 'لیگ شهری مشهد', year: '۱۴۰۴', result: 'قهرمان' },
    ],
    albums: [
      { id: 'a1', title: 'آلبوم مسابقات', photos: ['/images/shop/Home_table.jpg'] },
    ],
    tags: ['پاکت بیلیارد'],
  },
  {
    id: 'yasna-parsa',
    name: 'یسنا پارسا',
    nameEn: 'YASNA PARSA',
    discipline: 'snooker',
    city: 'تهران',
    country: 'ایران',
    national: false,
    gender: 'f',
    youth: true,
    club: { name: 'آکادمی بیلیارد هاب' },
    tone: 'night',
    scene: '/images/HS/3.jfif',
    intro: 'ستاره‌ی نوجوانِ اسنوکر بانوان؛ قهرمانِ بلامنازعِ رده‌ی جوانان.',
    bio: [
      'یسنا پارسا پانزده سال دارد و همین حالا هم در تمرین‌های مشترک، بازیکنانِ رنکینگ را به چالش می‌کشد. دو قهرمانیِ پیاپیِ جوانان، او را به امیدِ اولِ اسنوکر بانوان تبدیل کرده است.',
    ],
    careerStart: '۱۴۰۳',
    highlights: [
      { year: '۱۴۰۵', title: 'قهرمان جوانان کشور — دومین سال پیاپی' },
    ],
    tournaments: [
      { name: 'قهرمانی جوانان بانوان', year: '۱۴۰۵', result: 'قهرمان' },
    ],
    albums: [
      { id: 'a1', title: 'آلبوم مسابقات', photos: ['/images/HS/3.jfif'] },
    ],
    tags: ['جوانان', 'اسنوکر'],
  },
]

export function getPlayer(id: string): Player | null {
  return PLAYERS.find(p => p.id === id) ?? null
}

export const DISCIPLINE_LABEL: Record<Discipline, { fa: string; en: string }> = {
  snooker: { fa: 'اسنوکر', en: 'SNOOKER' },
  pool:    { fa: 'پاکت بیلیارد', en: 'POOL' },
}

/* پالتِ دوتونِ کارت‌ها — محدود و در خانواده‌ی برند */
export const TONES: Record<Player['tone'], { from: string; to: string; glow: string }> = {
  felt:   { from: '#07231A', to: '#0E3A2A', glow: 'rgba(48,197,90,0.25)'   },
  night:  { from: '#0C1424', to: '#17253F', glow: 'rgba(74,158,255,0.22)'  },
  bronze: { from: '#171310', to: '#2A2118', glow: 'rgba(199,166,106,0.30)' },
}

export const faDigits = (v: string | number) =>
  String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
