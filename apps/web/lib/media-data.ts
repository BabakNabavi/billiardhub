/* ─────────────────────────────────────────────────────────────
   بیلیارد مدیا — منبعِ واحدِ ویدیوها (جایگزینِ بخشِ «آموزش»).
   ساختار آینده‌پذیر: creator جدا از ویدیو تعریف شده تا بعداً به
   Channel/Playlist/Follow واقعی گسترش یابد.
   ───────────────────────────────────────────────────────────── */

export const MEDIA_CATEGORIES = [
  { key: 'snooker-training', label: 'آموزش اسنوکر',        dot: '#14532D' },
  { key: 'pool-training',    label: 'آموزش پاکت بیلیارد',  dot: '#7C3AED' },
  { key: 'techniques',       label: 'تکنیک‌ها و ترفندها',   dot: '#C7A66A' },
  { key: 'highlights',       label: 'مسابقات و هایلایت',    dot: '#B23B2E' },
  { key: 'backstage',        label: 'پشت صحنه',             dot: '#0891B2' },
  { key: 'interviews',       label: 'مصاحبه با بازیکنان',   dot: '#1D4ED8' },
  { key: 'gear',             label: 'معرفی تجهیزات',        dot: '#A07840' },
  { key: 'clubs-events',     label: 'باشگاه‌ها و رویدادها', dot: '#0E7A38' },
] as const

export type MediaCategoryKey = typeof MEDIA_CATEGORIES[number]['key']

export interface MediaCreator {
  id: string
  name: string
  handle: string          // برای صفحه‌ی کانال در آینده
}

export interface MediaVideo {
  id: string
  title: string
  category: MediaCategoryKey
  creator: MediaCreator
  /** mm:ss با ارقام فارسی */
  duration: string
  views: number
  likes: number
  date: string
  /** برای مرتب‌سازی «جدیدترین» (بزرگ‌تر = تازه‌تر) */
  ts: number
  thumb: string
  /** فایلِ ویدیو — فعلاً دموی مشترک؛ ساختار per-video است */
  src: string
  description: string[]
  tags: string[]
  featured?: boolean
}

const CREATORS: Record<string, MediaCreator> = {
  hub:     { id: 'hub',     name: 'بیلیارد هاب',        handle: 'billiardhub' },
  academy: { id: 'academy', name: 'آکادمی بیلیارد هاب', handle: 'bh.academy' },
  masters: { id: 'masters', name: 'مسترز مدیا',          handle: 'masters.media' },
  gearlab: { id: 'gearlab', name: 'گیرلب',               handle: 'gearlab' },
  proplay: { id: 'proplay', name: 'پروپلی',              handle: 'proplay' },
}

const DEMO_SRC = '/images/video/hero.mp4'

export const MEDIA_VIDEOS: MediaVideo[] = [
  {
    id: 'break-building-masterclass',
    title: 'مسترکلاس برک‌سازی؛ از ۳۰ به ۷۰ در چهار قدم',
    category: 'snooker-training',
    creator: CREATORS.academy!,
    duration: '۱۸:۲۴',
    views: 48200, likes: 2210,
    date: '۳۰ تیر ۱۴۰۵', ts: 1000,
    thumb: '/images/shop/snooker-table.jpg',
    src: DEMO_SRC,
    description: [
      'در این مسترکلاس، مسیر رسیدن از برک‌های ۳۰تایی به برک‌های بالای ۷۰ را قدم‌به‌قدم می‌سازیم: انتخاب توپِ درست، زاویه‌ی ورود به رنگی‌ها، مدیریت کوشن و برنامه‌ریزی سه‌ضربه‌ای.',
      'تمرین‌های هر بخش را می‌توانید با هر میزی تکرار کنید؛ نسخه‌ی PDF برنامه‌ی تمرین در کانال آکادمی منتشر شده است.',
    ],
    tags: ['برک‌سازی', 'اسنوکر', 'آموزش پیشرفته'],
    featured: true,
  },
  {
    id: 'tehran-masters-final-highlights',
    title: 'هایلایت فینال تهران مسترز؛ فریم آخری که همه را بلند کرد',
    category: 'highlights',
    creator: CREATORS.masters!,
    duration: '۱۲:۰۷',
    views: 61800, likes: 3140,
    date: '۲۹ تیر ۱۴۰۵', ts: 990,
    thumb: '/images/shop/Pro_table.jpg',
    src: DEMO_SRC,
    description: [
      'خلاصه‌ی کاملِ فینال تهران مسترز با گزارشِ اختصاصی؛ از سیفتی‌های نفس‌گیرِ فریم ششم تا کلیرنسِ تاریخیِ فریم آخر.',
    ],
    tags: ['تهران مسترز', 'فینال', 'هایلایت'],
    featured: true,
  },
  {
    id: 'cue-ball-control-basics',
    title: 'کنترل توپِ سفید برای شروع‌کننده‌ها؛ سه تمرین طلایی',
    category: 'pool-training',
    creator: CREATORS.academy!,
    duration: '۰۹:۴۵',
    views: 35400, likes: 1780,
    date: '۲۸ تیر ۱۴۰۵', ts: 980,
    thumb: '/images/shop/Ball-1.jpg',
    src: DEMO_SRC,
    description: [
      'استاپ‌شات، فالو و درا — سه ضربه‌ای که پایه‌ی هر پوزیشن‌پلی هستند. با سه تمرینِ ساده که فقط به یک توپ نیاز دارند.',
    ],
    tags: ['پاکت بیلیارد', 'کنترل توپ', 'مبتدی'],
    featured: true,
  },
  {
    id: 'world-champ-interview',
    title: 'گفت‌وگوی اختصاصی با قهرمان جهان؛ «برک ۱۴۷ برنامه‌ریزی نبود»',
    category: 'interviews',
    creator: CREATORS.hub!,
    duration: '۲۴:۱۶',
    views: 52900, likes: 2860,
    date: '۲۷ تیر ۱۴۰۵', ts: 970,
    thumb: '/images/shop/snooker-table-2.jpg',
    src: DEMO_SRC,
    description: [
      'قهرمان تازه‌ی جهان از شبِ فینال می‌گوید؛ از استرسِ فریمِ آخر تا لحظه‌ای که تصمیم گرفت به‌جای سیفتی، سراغِ قرمزِ آخر برود.',
    ],
    tags: ['مصاحبه', 'قهرمان جهان', 'اسنوکر'],
  },
  {
    id: 'carbon-shaft-lab-test',
    title: 'تست آزمایشگاهی شفت کربنی؛ دیفلکشن واقعاً چقدر کم می‌شود؟',
    category: 'gear',
    creator: CREATORS.gearlab!,
    duration: '۱۵:۳۲',
    views: 28700, likes: 1490,
    date: '۲۵ تیر ۱۴۰۵', ts: 950,
    thumb: '/images/shop/cue_billiard_2.jpg',
    src: DEMO_SRC,
    description: [
      'با ریگِ تستِ ثابت، دیفلکشنِ سه شفتِ کربنی و دو شفتِ افرا را اندازه گرفتیم؛ اعداد، جدول مقایسه و جمع‌بندیِ خرید.',
    ],
    tags: ['شفت کربنی', 'تست', 'تجهیزات'],
  },
  {
    id: 'behind-scenes-masters',
    title: 'پشت صحنه‌ی تهران مسترز؛ ۴۸ ساعت قبل از فینال',
    category: 'backstage',
    creator: CREATORS.masters!,
    duration: '۱۰:۵۸',
    views: 19300, likes: 940,
    date: '۲۳ تیر ۱۴۰۵', ts: 930,
    thumb: '/images/hero/hero-lounge.jpg',
    src: DEMO_SRC,
    description: [
      'از نصب پارچه‌ی میزِ فینال تا تمرینِ بسته‌ی فینالیست‌ها — دوربینِ ما ۴۸ ساعت در سالن ماند.',
    ],
    tags: ['پشت صحنه', 'تهران مسترز'],
  },
  {
    id: 'safety-play-deep-dive',
    title: 'هنر سیفتی؛ چطور حریف را به اشتباه وادار کنیم',
    category: 'techniques',
    creator: CREATORS.academy!,
    duration: '۱۴:۱۱',
    views: 22600, likes: 1210,
    date: '۲۱ تیر ۱۴۰۵', ts: 910,
    thumb: '/images/HS/1.jfif',
    src: DEMO_SRC,
    description: [
      'سیفتی فقط فرار نیست؛ ساختنِ تله است. الگوهای رایجِ سیفتی در اسنوکر و پاسخِ درست به هرکدام.',
    ],
    tags: ['سیفتی', 'تاکتیک', 'تکنیک'],
  },
  {
    id: 'club-tour-platinum',
    title: 'گشتی در باشگاه پلاتینیوم؛ میزبان فینال‌های فصل',
    category: 'clubs-events',
    creator: CREATORS.hub!,
    duration: '۰۸:۴۰',
    views: 15800, likes: 720,
    date: '۱۹ تیر ۱۴۰۵', ts: 890,
    thumb: '/images/HS/4.jfif',
    src: DEMO_SRC,
    description: [
      'از سالنِ اصلی با ۱۲ میزِ مسابقه‌ای تا اتاقِ VIP و سیستمِ نورِ استاندارد — تورِ کاملِ باشگاهی که فینال‌های فصل را میزبانی می‌کند.',
    ],
    tags: ['باشگاه', 'تور', 'پلاتینیوم'],
  },
  {
    id: 'spin-english-explained',
    title: 'انگلیسی (اسپین) به زبان ساده؛ کجا بزنیم و چرا',
    category: 'techniques',
    creator: CREATORS.proplay!,
    duration: '۱۱:۲۶',
    views: 31200, likes: 1650,
    date: '۱۷ تیر ۱۴۰۵', ts: 870,
    thumb: '/images/shop/Ball.jpg',
    src: DEMO_SRC,
    description: [
      'ساید، تاپ و باتم — با نمای آهسته می‌بینیم هر تماس دقیقاً چه بلایی سر مسیرِ توپ می‌آورد و کی باید سراغش برویم.',
    ],
    tags: ['اسپین', 'انگلیسی', 'آموزش'],
  },
  {
    id: 'womens-league-week1-recap',
    title: 'مرور هفته‌ی اول لیگ بانوان در ۱۰ دقیقه',
    category: 'highlights',
    creator: CREATORS.masters!,
    duration: '۱۰:۰۳',
    views: 17900, likes: 860,
    date: '۱۵ تیر ۱۴۰۵', ts: 850,
    thumb: '/images/HS/2.jfif',
    src: DEMO_SRC,
    description: [
      'سه برکِ بالای ۵۰، یک شگفتیِ بزرگ و بهترین ضربه‌های هفته‌ی افتتاحیه‌ی لیگ بانوان.',
    ],
    tags: ['لیگ بانوان', 'هایلایت'],
  },
  {
    id: 'stance-and-bridge-fix',
    title: 'اصلاح استنس و بریج در ۷ دقیقه؛ پیش از هر چیز این را ببینید',
    category: 'snooker-training',
    creator: CREATORS.academy!,
    duration: '۰۷:۱۲',
    views: 40100, likes: 2050,
    date: '۱۳ تیر ۱۴۰۵', ts: 830,
    thumb: '/images/HS/6.jfif',
    src: DEMO_SRC,
    description: [
      'بیشترِ خطاهای ضربه از استنسِ غلط شروع می‌شود. چک‌لیستِ هفت‌مرحله‌ای برای قرارگیریِ درست پشت میز.',
    ],
    tags: ['استنس', 'بریج', 'مبتدی'],
  },
  {
    id: 'nineball-pattern-play',
    title: 'الگوخوانی در ناین‌بال؛ سه راه برای دیدن کل میز',
    category: 'pool-training',
    creator: CREATORS.proplay!,
    duration: '۱۳:۴۸',
    views: 20400, likes: 1030,
    date: '۱۱ تیر ۱۴۰۵', ts: 810,
    thumb: '/images/shop/Home_table.jpg',
    src: DEMO_SRC,
    description: [
      'قبل از ضربه‌ی اول، مسیرِ ۱ تا ۹ را در ذهن بچینید. سه الگوی تمرینی برای تقویتِ نگاهِ کلی به میز.',
    ],
    tags: ['ناین‌بال', 'الگوخوانی'],
  },
  {
    id: 'chalk-comparison-2026',
    title: 'مقایسه‌ی بزرگ گچ‌ها؛ از کلاسیک تا نسل جدید',
    category: 'gear',
    creator: CREATORS.gearlab!,
    duration: '۰۹:۱۹',
    views: 12600, likes: 610,
    date: '۹ تیر ۱۴۰۵', ts: 790,
    thumb: '/images/shop/pool_chalk_1.jpg',
    src: DEMO_SRC,
    description: [
      'شش گچِ پرمصرفِ بازار را با معیارِ چسبندگی، پخش‌شدگی و دوام مقایسه کردیم؛ برنده‌ی هر رده مشخص شد.',
    ],
    tags: ['گچ', 'مقایسه', 'تجهیزات'],
  },
  {
    id: 'referee-behind-scenes',
    title: 'یک روز با داور بین‌المللی؛ پشت صحنه‌ی قضاوت',
    category: 'backstage',
    creator: CREATORS.hub!,
    duration: '۱۶:۰۵',
    views: 14100, likes: 780,
    date: '۷ تیر ۱۴۰۵', ts: 770,
    thumb: '/images/HS/5.jfif',
    src: DEMO_SRC,
    description: [
      'از چکِ تجهیزات تا مدیریتِ لحظه‌های جنجالی — همراهِ داورِ بین‌المللیِ ایرانی در یک روزِ مسابقه.',
    ],
    tags: ['داوری', 'پشت صحنه'],
  },
  {
    id: 'player-of-month-sitdown',
    title: 'نشست صمیمی با بازیکن ماه؛ مسیر، عادت‌ها و روتین تمرین',
    category: 'interviews',
    creator: CREATORS.hub!,
    duration: '۲۱:۳۳',
    views: 23800, likes: 1240,
    date: '۵ تیر ۱۴۰۵', ts: 750,
    thumb: '/images/HS/3.jfif',
    src: DEMO_SRC,
    description: [
      'از شیفتِ شب تا صدرِ جدول — بازیکنِ ماه از روتینِ شش‌صبحِ خودش می‌گوید و سه تمرینی که هرگز حذف نمی‌کند.',
    ],
    tags: ['مصاحبه', 'بازیکن ماه'],
  },
  {
    id: 'event-recap-clubs-night',
    title: 'شب باشگاه‌ها؛ گزارش رویداد سالانه‌ی بیلیارد هاب',
    category: 'clubs-events',
    creator: CREATORS.hub!,
    duration: '۰۶:۵۴',
    views: 9800, likes: 430,
    date: '۳ تیر ۱۴۰۵', ts: 730,
    thumb: '/images/shop/rest-pool-2.jpg',
    src: DEMO_SRC,
    description: [
      'مراسمِ سالانه‌ی معرفیِ برترین باشگاه‌های شبکه‌ی بیلیارد هاب؛ برندگان، لحظه‌ها و حاشیه‌های شبِ باشگاه‌ها.',
    ],
    tags: ['رویداد', 'باشگاه‌ها'],
  },
]

export function getVideo(id: string): MediaVideo | null {
  return MEDIA_VIDEOS.find(v => v.id === id) ?? null
}

export function relatedVideos(v: MediaVideo, count = 6): MediaVideo[] {
  const same = MEDIA_VIDEOS.filter(x => x.id !== v.id && x.category === v.category)
  const rest = MEDIA_VIDEOS.filter(x => x.id !== v.id && x.category !== v.category)
  return [...same, ...rest].slice(0, count)
}

export function mediaCategoryOf(key: MediaCategoryKey) {
  return MEDIA_CATEGORIES.find(c => c.key === key)!
}

export const faNum = (n: number) => n.toLocaleString('fa-IR')
export const faDigits = (v: string | number) =>
  String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)

/* «۴۸٬۲۰۰» ⇒ «۴۸ هزار» برای شمارنده‌ی بازدید به سبکِ پلتفرم‌های ویدیویی */
export function compactViews(n: number): string {
  if (n >= 1_000_000) return `${faNum(Math.round(n / 100_000) / 10)} میلیون`
  if (n >= 1_000) return `${faNum(Math.round(n / 100) / 10)} هزار`
  return faNum(n)
}
