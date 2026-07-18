/* منبع واحد محصولات بیلیارد بازار — مشترک بین کاتالوگ (/shop)، جزئیات محصول (/shop/[id]) و صفحه‌ی فروشگاه (/sellers/[id]) */

export interface ShopProduct {
  id: number
  cat: string
  img: string
  name: string
  desc: string
  brand: string
  price: number
  old: number
  disc: number
  rating: number
  reviews: number
  sales: number
  sellerId: string      // → /sellers/{sellerId}
  sellerName: string
  sellerPhone: string
  sellerWhatsapp: string
}

/* دو فروشنده‌ی اصلی — هم‌راستا با صفحات /sellers/1 و /sellers/2 */
const S1 = { sellerId: '1', sellerName: 'پروکیو',        sellerPhone: '021-88221100', sellerWhatsapp: '989121234567' }
const S2 = { sellerId: '2', sellerName: 'بیلیارد سنتر', sellerPhone: '021-88997766', sellerWhatsapp: '989361234567' }

export const SHOP_PRODUCTS: ShopProduct[] = [
  { id: 1,  cat: 'cue',      img: '/images/shop/cue_billiard_2.jpg',  name: 'چوب حرفه‌ای Predator 314³',            brand: 'Predator', desc: 'شفت سه‌تکه‌ی افرای کانادایی با فناوری کاهش انحراف Predator. مناسب بازیکنان جدی پاکت بیلیارد که کنترل اسپین برایشان اولویت است. همراه کاور و گارانتی اصالت.', price: 2800000,  old: 3300000,  disc: 15, rating: 4.8, reviews: 124, sales: 480,  ...S1 },
  { id: 2,  cat: 'table',    img: '/images/shop/snooker-table.jpg',   name: 'میز اسنوکر Dynamo Tournament',          brand: 'Rasson',   desc: 'میز مسابقات ۱۲ فوت با سنگ اسلیت سه‌تکه و کوشن استاندارد مسابقات. نصب و تراز تخصصی در محل توسط تیم فنی فروشنده انجام می‌شود.', price: 45000000, old: 50000000, disc: 10, rating: 5.0, reviews: 38,  sales: 65,   ...S1 },
  { id: 3,  cat: 'ball',     img: '/images/shop/Ball-1.jpg',          name: 'توپ Aramith Pro Cup استاندارد WPBSA',   brand: 'Aramith',  desc: 'ست توپ رزین فنولیک بلژیکی با سریال اصالت کارخانه. استاندارد رسمی مسابقات WPBSA با دوام تا ۸ برابر توپ‌های معمولی.', price: 1200000,  old: 1500000,  disc: 20, rating: 4.7, reviews: 66,  sales: 210,  ...S1 },
  { id: 4,  cat: 'chalk',    img: '/images/shop/pool_chalk_1.jpg',    name: 'گچ Master Blue Square — ۱۴۴ عددی',     brand: 'Master',   desc: 'کارتن کامل گچ مسترز آبی، انتخاب اول باشگاه‌ها. پوشش یکنواخت و ماندگاری بالا روی تیپ، مناسب مصرف حرفه‌ای و باشگاهی.', price: 180000,   old: 260000,   disc: 31, rating: 4.6, reviews: 210, sales: 1250, ...S1 },
  { id: 5,  cat: 'rest',     img: '/images/shop/rest-pool.webp',      name: 'رست اسنوکر حرفه‌ای پیچ استنلس',        brand: 'Peradon',  desc: 'رست سر استیل ضدزنگ با اتصال پیچی استاندارد. سازگار با اکثر دسته‌رست‌های موجود در باشگاه‌ها.', price: 450000,   old: 480000,   disc: 6,  rating: 4.5, reviews: 44,  sales: 290,  ...S1 },
  { id: 6,  cat: 'case-bag', img: '/images/shop/accessori.png',       name: 'کیف چوب بیلیارد دو قسمتی چرم',         brand: 'Predator', desc: 'کیف چرم طبیعی با دو محفظه‌ی مجزا برای شفت و بات، آستر مخملی ضدخش و بند دوشی قابل تنظیم.', price: 850000,   old: 970000,   disc: 12, rating: 4.5, reviews: 33,  sales: 520,  ...S1 },
  { id: 7,  cat: 'cue',      img: '/images/shop/cue_billiard.jpg',    name: 'چوب کربن فایبر Mezz EC7-CF',           brand: 'Mezz',     desc: 'شفت تمام‌کربن با تیپ کامویی اورجینال. سختی و دقت ضربه در کنار وزن ایده‌آل ۱۹ اونس، انتخاب بازیکنان حرفه‌ای.', price: 6500000,  old: 7100000,  disc: 8,  rating: 4.6, reviews: 71,  sales: 260,  ...S1 },
  { id: 8,  cat: 'ball',     img: '/images/shop/Ball.jpg',            name: 'توپ Cyclop Omega Pool Set',             brand: 'Aramith',  desc: 'ست کامل توپ پاکت بیلیارد Cyclop با رنگ‌بندی شفاف و مقاوم در برابر زردشدگی. مناسب باشگاه و منزل.', price: 950000,   old: 1120000,  disc: 15, rating: 4.4, reviews: 58,  sales: 190,  ...S1 },
  { id: 9,  cat: 'table',    img: '/images/shop/Home_table.jpg',      name: 'میز بیلیارد خانگی — پایه چوب ماسیو',  brand: 'Rasson',   desc: 'میز ۸ فوت خانگی با بدنه‌ی چوب راش و ماهوت ضدآب. طراحی کلاسیک مناسب فضای منزل و دفتر کار، همراه ست کامل بازی.', price: 18000000, old: 19000000, disc: 5,  rating: 4.9, reviews: 27,  sales: 42,   ...S1 },
  { id: 10, cat: 'chalk',    img: '/images/shop/pool_chalk_2.jpg',    name: 'گچ Predator 1080 Pure — ۵ عددی',       brand: 'Predator', desc: 'گچ سیلیکونی خالص ۱۰۸۰ با چسبندگی فوق‌العاده به تیپ و کمترین پخش گرد. بسته‌ی ۵ عددی اورجینال.', price: 220000,   old: 245000,   disc: 10, rating: 4.5, reviews: 39,  sales: 610,  ...S1 },
  { id: 11, cat: 'table',    img: '/images/shop/snooker-table-2.jpg', name: 'میز اسنوکر Pro-Line ۱۲ فوتی',          brand: 'Rasson',   desc: 'میز اسنوکر سایز کامل مسابقات با فریم فولادی و اسلیت ۴۵ میلی‌متری. مناسب باشگاه‌های حرفه‌ای، با خدمات نصب سراسری.', price: 68000000, old: 75000000, disc: 9,  rating: 4.8, reviews: 46,  sales: 175,  ...S1 },
  { id: 12, cat: 'table',    img: '/images/shop/Pro_table.jpg',       name: 'میز بیلیارد حرفه‌ای پارچه ایتالیایی', brand: 'BCE',      desc: 'میز ۹ فوت پاکت با ماهوت ایتالیایی سرعت‌بالا و جیب‌های چرمی دست‌دوز. تعادل بی‌نقص برای بازی حرفه‌ای و نمایشی.', price: 32000000, old: 36000000, disc: 11, rating: 4.7, reviews: 52,  sales: 88,   ...S1 },
]

export const CAT_LABELS: Record<string, string> = {
  cue: 'چوب', table: 'میز', ball: 'توپ', tip: 'تیپ', chalk: 'گچ', extension: 'اکستنشن',
  'case-bag': 'کیس و کیف', rest: 'رست', cloth: 'پارچه', oil: 'روغن', towel: 'حوله',
  clothing: 'پوشاک', accessory: 'اکسسوری', other: 'سایر',
}

export const productsBySeller = (sellerId: string) => SHOP_PRODUCTS.filter(p => p.sellerId === sellerId)
