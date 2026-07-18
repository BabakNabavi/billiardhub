/* ─────────────────────────────────────────────────────────────
   فروشگاه‌های نمونه (دموی لیست /sellers) — منبعِ واحد.
   هم صفحه‌ی لیست (/sellers) و هم صفحه‌ی storefront (/sellers/[id] → FlatShop)
   از همین می‌خوانند، تا کلیک روی هر کارت، همان فروشگاه را باز کند
   (نه پیش‌فرض). فروشگاه‌های واقعیِ ساخته‌شده در پنل روی این‌ها سوار می‌شوند.
   ───────────────────────────────────────────────────────────── */

export interface MockSeller {
  id: string
  name: string
  city: string
  verified: boolean
  elite: boolean
  rating: number
  reviewCount: number
  productCount: number
  since: string
  sinceYear: number
  brands: string[]
  specialties: string[]
  responseTime: string
  phone: string
  bannerImage: string
  description: string
}

export const MOCK_SELLERS: MockSeller[] = [
  {
    id: '1',
    name: 'آریا بیلیارد',
    city: 'تهران',
    verified: true,
    elite: true,
    rating: 4.8,
    reviewCount: 247,
    productCount: 312,
    since: '۱۳۸۵',
    sinceYear: 1385,
    brands: ['Predator', 'Mezz', 'McDermott'],
    specialties: ['چوب حرفه‌ای', 'میز', 'لوازم جانبی'],
    responseTime: '۲ ساعت',
    phone: '02188001234',
    bannerImage: '/images/shop/snooker-table.jpg',
    description: 'بزرگ‌ترین مجموعه تجهیزات بیلیارد در ایران با بیش از ۳۰۰ محصول اصل از برترین برندهای جهانی',
  },
  {
    id: '2',
    name: 'بیلیارد سنتر تهران',
    city: 'تهران',
    verified: true,
    elite: false,
    rating: 4.5,
    reviewCount: 124,
    productCount: 189,
    since: '۱۳۹۲',
    sinceYear: 1392,
    brands: ['Riley', 'Fury', 'BCE'],
    specialties: ['چوب', 'توپ'],
    responseTime: '۴ ساعت',
    phone: '02155009876',
    bannerImage: '/images/shop/cue_billiard_2.jpg',
    description: 'فروش تخصصی چوب و توپ بیلیارد با ضمانت اصالت کالا و خدمات پس از فروش',
  },
  {
    id: '3',
    name: 'بیلیارد اکبری اصفهان',
    city: 'اصفهان',
    verified: false,
    elite: false,
    rating: 4.2,
    reviewCount: 56,
    productCount: 78,
    since: '۱۳۹۸',
    sinceYear: 1398,
    brands: ['Fury', 'Viper', 'Cuetec'],
    specialties: ['چوب', 'لوازم جانبی'],
    responseTime: '۸ ساعت',
    phone: '03136001234',
    bannerImage: '/images/shop/Ball-1.jpg',
    description: 'فروشگاه تخصصی بیلیارد در اصفهان با قیمت‌های رقابتی و تنوع بالا',
  },
  {
    id: '4',
    name: 'آنلاین بیلیارد شاپ',
    city: 'مشهد',
    verified: true,
    elite: false,
    rating: 4.6,
    reviewCount: 89,
    productCount: 145,
    since: '۱۴۰۰',
    sinceYear: 1400,
    brands: ['McDermott', 'Lucasi', 'Players'],
    specialties: ['چوب', 'کیف چوب'],
    responseTime: '۱ ساعت',
    phone: '05138001234',
    bannerImage: '/images/shop/Home_table.jpg',
    description: 'ارسال سراسری — تخصصی در فروش آنلاین چوب و لوازم بیلیارد با بهترین قیمت',
  },
  {
    id: '5',
    name: 'پرستیژ بیلیارد شیراز',
    city: 'شیراز',
    verified: true,
    elite: true,
    rating: 4.7,
    reviewCount: 183,
    productCount: 228,
    since: '۱۳۸۹',
    sinceYear: 1389,
    brands: ['Predator', 'Viking', 'Scorpion'],
    specialties: ['میز اسنوکر', 'چوب', 'پارچه میز'],
    responseTime: '۳ ساعت',
    phone: '07132001234',
    bannerImage: '/images/shop/Pro_table.jpg',
    description: 'نماینده رسمی برند Predator در جنوب کشور — تخصصی در میزهای اسنوکر حرفه‌ای',
  },
  {
    id: '6',
    name: 'گلدن کیو تهران',
    city: 'تهران',
    verified: true,
    elite: false,
    rating: 4.4,
    reviewCount: 71,
    productCount: 95,
    since: '۱۳۹۶',
    sinceYear: 1396,
    brands: ['Mezz', 'Tiger', 'Pechauer'],
    specialties: ['تیپ', 'گچ', 'لوازم جانبی'],
    responseTime: '۶ ساعت',
    phone: '02177001234',
    bannerImage: '/images/shop/pool_chalk_1.jpg',
    description: 'متخصص فروش لوازم جانبی و قطعات حرفه‌ای بیلیارد — واردکننده مستقیم',
  },
]

export function getMockSeller(id: string): MockSeller | null {
  return MOCK_SELLERS.find(s => s.id === id) ?? null
}
