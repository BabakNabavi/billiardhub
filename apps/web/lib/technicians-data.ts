/* ─────────────────────────────────────────────────────────────
   متخصصان خدمات فنی — منبعِ واحد (الگوی sellers/manufacturers/news).
   بدون آمار و امتیاز: تمرکز روی شخص، تخصص و هویتِ حرفه‌ای.
   ساختار آینده‌پذیر: Service / Project / Album جدا تعریف شده‌اند تا
   بعداً از پنلِ خودِ متخصص پر شوند.
   ───────────────────────────────────────────────────────────── */

export const TECH_SERVICES = [
  'تعمیر میز',
  'رگلاژ و تراز میز',
  'تعویض پارچه',
  'تعویض لاستیک باند',
  'نصب میز',
  'جابه‌جایی میز',
  'بازسازی میز',
  'ساخت و تعمیر قطعات',
  'خدمات چوب و تجهیزات',
] as const

export type TechService = typeof TECH_SERVICES[number]

export interface TechProject {
  id: string
  title: string
  desc: string
  city: string
  club?: string
  service: TechService
  image: string
}

export interface TechAlbum {
  id: string
  title: string
  desc: string
  photos: string[]
}

export interface Technician {
  id: string
  name: string
  /** عکسِ پروفایل (اختیاری) — نبودش ⇒ مونوگرامِ لوکس */
  photo?: string
  /** عنوانِ تخصصی — زیرِ نام */
  title: string
  city: string
  /** باشگاه/مجموعه‌ی همکار (اختیاری) */
  club?: string
  /** شهرهای تحتِ پوشش */
  coverage: string[]
  /** معرفیِ یک‌خطیِ کارت/هیرو */
  intro: string
  /** پاراگراف‌های «درباره من» */
  about: string[]
  services: TechService[]
  projects: TechProject[]
  albums: TechAlbum[]
  phone: string
  whatsapp: string
}

export const TECHNICIANS: Technician[] = [
  {
    id: 'mehdi-karami',
    name: 'مهدی کرمی',
    title: 'متخصص ارشد پارچه و رگلاژ',
    city: 'تهران',
    club: 'باشگاه پلاتینیوم',
    coverage: ['تهران', 'کرج', 'قم'],
    intro: 'پارچه‌کشیِ مسابقه‌ای و رگلاژِ میلی‌متری برای میزهایی که باید بی‌نقص بغلتند.',
    about: [
      'از سال ۱۳۹۰ کارم را در کارگاهِ ساختِ میز شروع کردم و از همان‌جا با ظرافتِ سازه‌ی میزهای اسنوکر آشنا شدم. امروز تمرکزم روی دو چیز است: پارچه‌کشیِ رده‌ی مسابقه و رگلاژی که با ساعت‌ها بازی هم به‌هم نریزد.',
      'با پارچه‌های Strachan و Hainsworth کار می‌کنم و برای هر نصب، گزارشِ ترازِ نقطه‌به‌نقطه تحویل می‌دهم. میزهای مسابقاتِ رسمی چند باشگاهِ تهران زیرِ دستِ من سرویس می‌شوند.',
    ],
    services: ['تعویض پارچه', 'رگلاژ و تراز میز', 'نصب میز', 'تعمیر میز'],
    projects: [
      { id: 'p1', title: 'پارچه‌کشی میز فینال', desc: 'تعویض پارچه‌ی مسابقه‌ای و رگلاژ کامل پیش از فینال فصل.', city: 'تهران', club: 'باشگاه پلاتینیوم', service: 'تعویض پارچه', image: '/images/services/IMG_0961.png' },
      { id: 'p2', title: 'نصب و تراز دو میز اسنوکر', desc: 'نصب از صفر، تراز اسلیت سه‌تکه و تست غلتش.', city: 'کرج', club: 'باشگاه المپیک', service: 'نصب میز', image: '/images/shop/snooker-table.jpg' },
      { id: 'p3', title: 'بازسازی میز کلاسیک', desc: 'تعویض لاستیک باند، پارچه و احیای چوبِ بدنه.', city: 'تهران', service: 'بازسازی میز', image: '/images/services/repaire.jfif' },
    ],
    albums: [
      {
        id: 'a1',
        title: 'پروژه‌های تهران',
        desc: 'منتخبِ نصب‌ها و پارچه‌کشی‌های یک سالِ اخیر در تهران.',
        photos: ['/images/services/IMG_0961.png', '/images/shop/snooker-table.jpg', '/images/shop/snooker-table-2.jpg', '/images/hero/hero-lounge.jpg', '/images/services/IMG_0962.png'],
      },
      {
        id: 'a2',
        title: 'مراحل بازسازی',
        desc: 'از بازکردنِ باند تا نتیجه‌ی نهایی — مستندِ یک بازسازیِ کامل.',
        photos: ['/images/services/repaire.jfif', '/images/services/IMG_0963.png', '/images/shop/Pro_table.jpg', '/images/clubs/club2.jpg'],
      },
    ],
    phone: '09121112233',
    whatsapp: '989121112233',
  },
  {
    id: 'hasan-mirzaei',
    name: 'حسن میرزایی',
    title: 'متخصص تعمیر و بازسازی میز',
    city: 'مشهد',
    club: 'مجموعه آفتاب',
    coverage: ['مشهد', 'نیشابور', 'سبزوار'],
    intro: 'میزهای قدیمی را به روزهای اولشان برمی‌گردانم؛ سازه، باند و رویه.',
    about: [
      'نجّارِ خانواده بودم پیش از آن‌که بیلیاردی شوم؛ همین شد که تعمیرِ سازه‌ی میز برایم زبانِ مادری است. پانزده سال است میزهای قدیمی و آسیب‌دیده را بازسازی می‌کنم — از تعویضِ کامل لاستیکِ باند تا احیای پایه‌های منبت.',
      'باور دارم هیچ میزی «تمام‌شده» نیست؛ فقط منتظرِ دستِ درست است.',
    ],
    services: ['بازسازی میز', 'تعمیر میز', 'تعویض لاستیک باند', 'ساخت و تعمیر قطعات'],
    projects: [
      { id: 'p1', title: 'بازسازی کامل میز ۱۲ فوت', desc: 'تعویض باند، اسلیت‌بندی مجدد و رویه‌ی نو.', city: 'مشهد', club: 'مجموعه آفتاب', service: 'بازسازی میز', image: '/images/services/IMG_0963.png' },
      { id: 'p2', title: 'ساخت جیب و قطعات برنجی', desc: 'ساختِ سفارشیِ قطعاتِ ازرده‌خارج برای میز کلاسیک.', city: 'نیشابور', service: 'ساخت و تعمیر قطعات', image: '/images/shop/rest-pool-2.jpg' },
    ],
    albums: [
      {
        id: 'a1',
        title: 'بازسازی میزهای مجموعه آفتاب',
        desc: 'مستندِ نوسازیِ چهار میزِ سالنِ اصلی.',
        photos: ['/images/services/IMG_0963.png', '/images/shop/Home_table.jpg', '/images/clubs/club3.jpg', '/images/shop/Pro_table.jpg'],
      },
    ],
    phone: '09152223344',
    whatsapp: '989152223344',
  },
  {
    id: 'alireza-sadeghi',
    name: 'علیرضا صادقی',
    title: 'نصاب و مجری جابه‌جایی میز',
    city: 'اصفهان',
    coverage: ['اصفهان', 'شهرضا', 'نجف‌آباد'],
    intro: 'نصب و جابه‌جاییِ بدونِ استرس؛ میز سالم می‌رسد، تراز تحویل می‌گیرید.',
    about: [
      'جابه‌جاییِ میزِ بیلیارد کارِ ظریفی است — اسلیتِ سنگی، چوبِ حساس و ترازی که نباید قربانی شود. ده سال است با تیمِ ثابتِ سه‌نفره‌ام نصب و انتقالِ میز انجام می‌دهم؛ از طبقه‌ی منفیِ برج تا ویلای شمال.',
      'هر جابه‌جایی با بیمه‌ی سلامتِ قطعات و ترازِ نهایی در محلِ جدید تحویل داده می‌شود.',
    ],
    services: ['نصب میز', 'جابه‌جایی میز', 'رگلاژ و تراز میز'],
    projects: [
      { id: 'p1', title: 'انتقال سه میز باشگاهی', desc: 'دمونتاژ، حمل و نصب مجدد با تراز کامل در محل جدید.', city: 'اصفهان', club: 'باشگاه زاینده‌رود', service: 'جابه‌جایی میز', image: '/images/services/IMG_0962.png' },
      { id: 'p2', title: 'نصب میز خانگی ۸ فوت', desc: 'نصب در منزل با محدودیتِ فضای ورود.', city: 'اصفهان', service: 'نصب میز', image: '/images/shop/Home_table.jpg' },
    ],
    albums: [
      {
        id: 'a1',
        title: 'نصب‌های اصفهان',
        desc: 'گزیده‌ی نصب‌ها و انتقال‌های امسال.',
        photos: ['/images/services/IMG_0962.png', '/images/shop/Home_table.jpg', '/images/clubs/club5.jpg'],
      },
    ],
    phone: '09133334455',
    whatsapp: '989133334455',
  },
  {
    id: 'reza-farahani',
    name: 'رضا فراهانی',
    title: 'متخصص پارچه و باند پاکت بیلیارد',
    city: 'شیراز',
    club: 'باشگاه پرستیژ',
    coverage: ['شیراز', 'مرودشت'],
    intro: 'تخصصم میزهای پاکت است؛ پارچه‌ی تازه، باندِ استاندارد و جیب‌های سالم.',
    about: [
      'هشت سال است روی میزهای پاکت بیلیارد کار می‌کنم. تعویضِ پارچه با Simonis و تعویضِ لاستیکِ باند با پروفیلِ استاندارد K-66 کارِ هرروزِ من است.',
      'به باشگاه‌ها سرویسِ دوره‌ای هم می‌دهم تا میزها همیشه آماده‌ی مسابقه باشند.',
    ],
    services: ['تعویض پارچه', 'تعویض لاستیک باند', 'تعمیر میز', 'رگلاژ و تراز میز'],
    projects: [
      { id: 'p1', title: 'تعویض پارچه و رگلاژ ۶ میز', desc: 'سرویسِ کاملِ سالن پیش از لیگ شهری.', city: 'شیراز', club: 'باشگاه پرستیژ', service: 'تعویض پارچه', image: '/images/shop/Pro_table.jpg' },
    ],
    albums: [
      {
        id: 'a1',
        title: 'سرویس‌های باشگاه پرستیژ',
        desc: 'پارچه‌کشی و رگلاژِ فصلِ جاری.',
        photos: ['/images/shop/Pro_table.jpg', '/images/shop/pool_chalk_1.jpg', '/images/clubs/club6.jpeg'],
      },
    ],
    phone: '09174445566',
    whatsapp: '989174445566',
  },
  {
    id: 'nader-ghasemi',
    name: 'نادر قاسمی',
    title: 'متخصص چوب و تجهیزات',
    city: 'تبریز',
    coverage: ['تبریز', 'ارومیه', 'اردبیل'],
    intro: 'چوبِ شما را مثلِ روزِ اول تحویل می‌دهم؛ تیپ، فرول و صافیِ شفت.',
    about: [
      'کارم تعمیر و سرویسِ چوب و تجهیزاتِ شخصی است: تعویضِ تیپ و فرول، رفعِ تابِ شفت، تعویضِ گریپ و پرداختِ نهایی. برای بازیکنانِ حرفه‌ای، سرویسِ پیش از مسابقه هم انجام می‌دهم.',
      'اگر چوبتان «حسِ همیشگی» را ندارد، قبل از تعویض، یک سرویسِ کامل امتحان کنید.',
    ],
    services: ['خدمات چوب و تجهیزات', 'ساخت و تعمیر قطعات'],
    projects: [
      { id: 'p1', title: 'سرویس چوب‌های تیم استانی', desc: 'تعویض تیپ و بالانسِ دوازده چوب پیش از مسابقات.', city: 'تبریز', service: 'خدمات چوب و تجهیزات', image: '/images/shop/cue_billiard_2.jpg' },
    ],
    albums: [
      {
        id: 'a1',
        title: 'کارگاه چوب',
        desc: 'نمونه‌کارهای سرویس و تعمیرِ چوب.',
        photos: ['/images/shop/cue_billiard_2.jpg', '/images/shop/cue_billiard.jpg', '/images/shop/accessori.png'],
      },
    ],
    phone: '09144556677',
    whatsapp: '989144556677',
  },
  {
    id: 'saman-rahimi',
    name: 'سامان رحیمی',
    title: 'تکنسین نصب و تراز میز',
    city: 'کرمان',
    club: 'باشگاه ماهان',
    coverage: ['کرمان', 'رفسنجان', 'سیرجان'],
    intro: 'ترازِ دقیق با دوربینِ لیزری؛ چون یک میلی‌متر هم مهم است.',
    about: [
      'کارم را با تیمِ نصبِ یک واردکننده‌ی میز شروع کردم و شش سال است در استانِ کرمان به‌صورت مستقل کار می‌کنم. برای تراز از دوربینِ لیزری استفاده می‌کنم و نتیجه را با تستِ غلتشِ استاندارد تحویل می‌دهم.',
    ],
    services: ['نصب میز', 'رگلاژ و تراز میز', 'جابه‌جایی میز', 'تعمیر میز'],
    projects: [
      { id: 'p1', title: 'بازسازی میز اسنوکر', desc: 'تعویض پارچه و باند به‌همراه ترازِ کامل.', city: 'کرمان', club: 'باشگاه ماهان', service: 'بازسازی میز', image: '/images/shop/snooker-table-2.jpg' },
      { id: 'p2', title: 'نصب دو میز مسابقه‌ای', desc: 'نصب و تراز برای میزبانیِ تورِ استانی.', city: 'رفسنجان', service: 'نصب میز', image: '/images/shop/snooker-table.jpg' },
    ],
    albums: [
      {
        id: 'a1',
        title: 'پروژه‌های کرمان',
        desc: 'نصب‌ها و سرویس‌های استانِ کرمان.',
        photos: ['/images/shop/snooker-table-2.jpg', '/images/shop/snooker-table.jpg', '/images/HS/4.jfif', '/images/clubs/club7.jpeg'],
      },
    ],
    phone: '09131234567',
    whatsapp: '989131234567',
  },
]

export function getTechnician(id: string): Technician | null {
  return TECHNICIANS.find(t => t.id === id) ?? null
}

export function techCities(): string[] {
  return [...new Set(TECHNICIANS.map(t => t.city))]
}

export const faDigits = (v: string | number) =>
  String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
