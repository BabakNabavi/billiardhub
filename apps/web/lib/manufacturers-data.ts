/* ─────────────────────────────────────────────────────────────
   تولیدکنندگان — منبعِ واحد (مثل lib/sellers-data برای فروشگاه‌ها).
   هم صفحه‌ی لیست (/manufacturers) و هم صفحه‌ی تولیدکننده (/manufacturers/[id])
   از همین می‌خوانند تا کلیک روی هر کارت همان تولیدکننده را باز کند.
   ───────────────────────────────────────────────────────────── */

export interface MfrProduct {
  id: string
  name: string
  category: string          // برچسبِ آزادِ دسته (میز اسنوکر، چوب، پارچه، …)
  description: string
  specs: string[]
  image: string
  badge?: string
}

export interface MockManufacturer {
  id: string
  name: string
  city: string
  verified: boolean
  elite: boolean            // «تولیدکننده‌ی رسمی» (نشانِ طلایی روی کارت)
  since: string
  sinceYear: number
  productCount: number
  specialties: string[]     // روی کارت زیرِ لوکیشن با برچسبِ «تخصص:»
  responseTime: string
  phone: string
  bannerImage: string
  description: string        // کوتاه — کارت + باکسِ «درباره ما»

  /* ── فقط صفحه‌ی تولیدکننده ── */
  tagline: string
  about: string
  employees: string
  exportCountries: string
  totalProduced: string
  productionCapability: string
  whatsapp: string
  instagram: string
  address: string
  hours: string
  website: string
  products: MfrProduct[]
  certificates: { title: string; issuer: string; year: string }[]
}

export const MANUFACTURERS: MockManufacturer[] = [
  {
    id: '1',
    name: 'کارخانه بیلیارد سازان ایران',
    city: 'تهران',
    verified: true,
    elite: true,
    since: '۱۳۷۸',
    sinceYear: 1378,
    productCount: 24,
    specialties: ['میز اسنوکر', 'میز آمریکایی', 'میز کارامبول', 'پارچه میز'],
    responseTime: '۲ ساعت',
    phone: '02166345678',
    bannerImage: '/images/shop/snooker-table.jpg',
    description: 'بزرگ‌ترین تولیدکننده‌ی میزهای حرفه‌ای بیلیارد در خاورمیانه — با استانداردِ WPBSA و بیش از ۲۵ سال تجربه.',
    tagline: 'تولیدکننده‌ی رسمی میزهای حرفه‌ای بیلیارد — استاندارد WPBSA',
    about: 'کارخانه بیلیارد سازان ایران با بیش از ۲۵ سال تجربه، پیشرو در تولید تجهیزات حرفه‌ای بیلیارد در خاورمیانه است. محصولات این کارخانه در بیش از ۶ کشور عرضه می‌شود و در مسابقات رسمی ایران استفاده می‌گردد.',
    employees: '۸۵',
    exportCountries: '۶',
    totalProduced: '۴٬۲۰۰',
    productionCapability: 'ماهانه ۱۲۰ میز | سالانه ۵۰۰ چوب سفارشی',
    whatsapp: '989121110011',
    instagram: 'billiardsazan.ir',
    address: 'تهران، شهرک صنعتی شمس‌آباد، بلوار صنعت ۴',
    hours: 'شنبه تا پنج‌شنبه، ۸ تا ۱۷',
    website: 'www.billiardiran.ir',
    products: [
      { id: 'p1', name: 'میز اسنوکر حرفه‌ای BS-Tournament', category: 'میز اسنوکر', description: 'میز ۱۲ فوتی با تخته اسلیت ۴۵ میلی‌متری ایتالیایی و پارچه Strachan 6811', specs: ['ابعاد: ۳۶۵×۱۸۳ سانتی‌متر', 'تخته: اسلیت ۴۵mm ایتالیا', 'پارچه: Strachan 6811', 'کوسن: Super Pro', 'وزن: ۹۵۰ کیلوگرم'], image: '/images/shop/snooker-table.jpg', badge: 'پرفروش' },
      { id: 'p2', name: 'میز آمریکایی BS-Pro 9ft', category: 'میز آمریکایی', description: 'میز ۹ فوتی مناسب باشگاه‌ها، با چوب بلوط جامد', specs: ['ابعاد: ۲۵۴×۱۲۷ سانتی‌متر', 'تخته: اسلیت ۲۵mm', 'پارچه: Simonis 860', 'کوسن: K-66 Profile'], image: '/images/shop/Pro_table.jpg' },
      { id: 'p3', name: 'میز اسنوکر خانگی BS-Home 10ft', category: 'میز اسنوکر', description: 'نسخه‌ی خانگی میز اسنوکر با کیفیت بالا و قیمت مناسب', specs: ['ابعاد: ۳۰۵×۱۵۳ سانتی‌متر', 'تخته: MDF بالاکیفیت', 'پارچه: Hainsworth Elite Pro'], image: '/images/shop/Home_table.jpg', badge: 'جدید' },
      { id: 'p4', name: 'پارچه‌ی میز اسنوکر Sovereign', category: 'پارچه میز', description: 'پارچه‌ی استاندارد مسابقاتی تولید داخل با کیفیت بین‌المللی', specs: ['جنس: ۷۰٪ پشم ۳۰٪ نایلون', 'رنگ: سبز / آبی', 'عرض: ۱۹۵ سانتی‌متر'], image: '/images/shop/Ball-1.jpg' },
    ],
    certificates: [
      { title: 'استاندارد WPBSA', issuer: 'World Professional Billiards & Snooker Association', year: '۱۳۹۵' },
      { title: 'ایزو ۹۰۰۱', issuer: 'سازمان استاندارد ایران', year: '۱۳۹۸' },
      { title: 'نشان ملی کیفیت', issuer: 'وزارت صمت', year: '۱۴۰۱' },
      { title: 'تأیید فدراسیون بیلیارد ایران', issuer: 'فدراسیون بیلیارد و اسنوکر', year: '۱۳۸۵' },
    ],
  },
  {
    id: '2',
    name: 'صنایع چوب بیلیارد پارسه',
    city: 'اصفهان',
    verified: true,
    elite: false,
    since: '۱۳۸۸',
    sinceYear: 1388,
    productCount: 12,
    specialties: ['چوب سفارشی', 'تعمیر چوب', 'گریپ چوب'],
    responseTime: '۴ ساعت',
    phone: '03136543210',
    bannerImage: '/images/shop/cue_billiard_2.jpg',
    description: 'سازنده‌ی چوب‌های سفارشیِ حرفه‌ای با چوب‌های نادرِ جهان — تأییدشده‌ی فدراسیون بیلیارد.',
    tagline: 'سازنده‌ی چوب‌های سفارشیِ حرفه‌ای',
    about: 'پارسه متخصص ساخت چوب‌های سفارشی بیلیارد با چوب‌های نادر جهان است و چوب تیم ملی را تأمین می‌کند.',
    employees: '۳۰',
    exportCountries: '۲',
    totalProduced: '۱۵٬۰۰۰',
    productionCapability: 'ماهانه ۲۰۰ چوب سفارشی',
    whatsapp: '989131230022',
    instagram: 'parsecue.ir',
    address: 'اصفهان، شهرک صنعتی جی، خیابان صنعت',
    hours: 'شنبه تا چهارشنبه، ۹ تا ۱۸',
    website: 'www.parsecue.ir',
    products: [
      { id: 'p1', name: 'چوب سفارشی Parsé Master', category: 'چوب', description: 'ساخته‌شده با چوب افرا کانادایی و نوکِ چرمِ آبگینه', specs: ['وزن: ۵۴۰ گرم', 'طول: ۱۴۷ سانتی‌متر', 'نوک: چرم آبگینه'], image: '/images/shop/cue_billiard_2.jpg', badge: 'انحصاری' },
      { id: 'p2', name: 'چوب حرفه‌ای Parsé Sport', category: 'چوب', description: 'چوب دو تکه‌ی مناسبِ بازیکنانِ باشگاهی', specs: ['وزن: ۵۲۰ گرم', 'اتصال: پین فولادی', 'روکش: لاکِ مات'], image: '/images/shop/cue_billiard_2.jpg' },
    ],
    certificates: [
      { title: 'تأیید فدراسیون', issuer: 'فدراسیون بیلیارد و اسنوکر', year: '۱۳۹۵' },
    ],
  },
  {
    id: '3',
    name: 'کارگاه پارچه بیلیارد رویال',
    city: 'یزد',
    verified: false,
    elite: false,
    since: '۱۳۹۰',
    sinceYear: 1390,
    productCount: 8,
    specialties: ['پارچه اسنوکر', 'پارچه آمریکایی', 'پارچه کارامبول'],
    responseTime: '۸ ساعت',
    phone: '03538245678',
    bannerImage: '/images/shop/Home_table.jpg',
    description: 'تنها تولیدکننده‌ی تخصصیِ پارچه‌ی میزِ بیلیارد در ایران، با استانداردِ ملی.',
    tagline: 'تولیدِ پارچه‌ی تخصصیِ میزهای بیلیارد',
    about: 'رویال تنها تولیدکننده‌ی تخصصیِ پارچه‌ی میزِ بیلیارد در ایران است و پارچه‌ی بسیاری از باشگاه‌های کشور را تأمین می‌کند.',
    employees: '۱۸',
    exportCountries: '۱',
    totalProduced: '۸٬۵۰۰',
    productionCapability: 'ماهانه ۵۰۰ متر پارچه',
    whatsapp: '989351240033',
    instagram: 'royal.cloth',
    address: 'یزد، شهرک صنعتی، خیابان تولید',
    hours: 'شنبه تا پنج‌شنبه، ۸ تا ۱۶',
    website: '',
    products: [
      { id: 'p1', name: 'پارچه‌ی Premium Green', category: 'پارچه', description: 'پارچه‌ی سبزِ استانداردِ مسابقات', specs: ['ترکیب: ۸۰٪ پشم', 'ضخامت: ۳٫۵mm', 'عرض: ۱۹۰ سانتی‌متر'], image: '/images/shop/Home_table.jpg' },
      { id: 'p2', name: 'پارچه‌ی Royal Blue', category: 'پارچه', description: 'پارچه‌ی آبیِ ویژه‌ی میزهای آمریکایی', specs: ['ترکیب: ۷۵٪ پشم', 'ضخامت: ۳٫۸mm'], image: '/images/shop/Home_table.jpg', badge: 'جدید' },
    ],
    certificates: [
      { title: 'استاندارد ملی', issuer: 'سازمان استاندارد ایران', year: '۱۳۹۸' },
    ],
  },
  {
    id: '4',
    name: 'فناوری بیلیارد نوین',
    city: 'مشهد',
    verified: true,
    elite: false,
    since: '۱۴۰۰',
    sinceYear: 1400,
    productCount: 6,
    specialties: ['میز هوشمند', 'نمایشگر دیجیتال', 'میز با LED'],
    responseTime: '۱ ساعت',
    phone: '05135678901',
    bannerImage: '/images/shop/Pro_table.jpg',
    description: 'نخستین تولیدکننده‌ی سیستم‌های دیجیتال و هوشمندِ تجهیزات بیلیارد در ایران.',
    tagline: 'تولیدِ تجهیزاتِ هوشمندِ بیلیارد',
    about: 'شرکت نوین اولین تولیدکننده‌ی سیستم‌های دیجیتال و هوشمندِ تجهیزات بیلیارد در ایران است و روی نورپردازی و امتیازشماریِ خودکار تمرکز دارد.',
    employees: '۲۵',
    exportCountries: '۳',
    totalProduced: '۲٬۱۰۰',
    productionCapability: 'ماهانه ۵۰ سیستم هوشمند',
    whatsapp: '989151240044',
    instagram: 'novintech.billiard',
    address: 'مشهد، پارک علم و فناوری خراسان',
    hours: 'شنبه تا چهارشنبه، ۹ تا ۱۷',
    website: 'www.novintechbilliard.ir',
    products: [
      { id: 'p1', name: 'میز اسنوکر LED Pro', category: 'میز هوشمند', description: 'میز اسنوکر با نورپردازیِ LED هوشمند و تایمر دیجیتال', specs: ['LED Edge Lighting', 'تایمر دیجیتال', 'کنترل از موبایل'], image: '/images/shop/Pro_table.jpg', badge: 'نوآورانه' },
      { id: 'p2', name: 'نمایشگر امتیاز دیجیتال', category: 'نمایشگر دیجیتال', description: 'اسکوربوردِ لمسیِ حرفه‌ای برای باشگاه‌ها', specs: ['نمایشگر ۲۱ اینچ', 'اتصال بی‌سیم', 'اپلیکیشن اختصاصی'], image: '/images/shop/pool_chalk_1.jpg' },
    ],
    certificates: [
      { title: 'ایزو ۹۰۰۱', issuer: 'سازمان استاندارد ایران', year: '۱۴۰۲' },
    ],
  },
]

export function getManufacturer(id: string): MockManufacturer | null {
  return MANUFACTURERS.find(m => m.id === id) ?? null
}
