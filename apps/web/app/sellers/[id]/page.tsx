'use client'
import { useState, useEffect } from 'react'
import { useParams }            from 'next/navigation'
import Link                     from 'next/link'

/* ─── Design Tokens ─── */
const BG    = '#07070A'
const CARD  = 'rgba(255,255,255,0.04)'
const CBOR  = 'rgba(255,255,255,0.07)'
const CBORH = 'rgba(199,166,106,0.38)'
const GOLD  = '#C7A66A'
const GOLDB = '#E4C688'
const GOLDD = '#9A6E38'
const TEXT  = '#F2EFE9'
const TEXTD = 'rgba(242,239,233,0.50)'
const TEXTM = 'rgba(242,239,233,0.24)'
const GREEN = '#25D366'

function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}
function fmtN(n: number) { return toFa(n.toLocaleString('en-US')) }

/* ─── Types ─── */
interface SP {
  id: string; img: string; name: string; category: string
  price: number; old: number; disc: number
}
interface Review {
  id: string; author: string; rating: number; date: string
  text: string; product: string
}
interface SellerData {
  id: string; name: string; verified: boolean; elite: boolean
  bannerImage: string; tagline: string; about: string
  since: string; sinceYear: number; city: string
  rating: number; reviewCount: number; productCount: number; totalSales: number
  responseTime: string; brands: string[]; specialties: string[]
  phone: string; whatsapp: string; instagram: string
  address: string; workHours: string
  g1: string; g2: string
  products: SP[]; reviews: Review[]
}

/* ─── Mock Data ─── */
const SELLERS: Record<string, SellerData> = {
  '1': {
    id: '1', name: 'آریا بیلیارد', verified: true, elite: true,
    bannerImage: '/images/shop/snooker-table.jpg',
    tagline: 'نماینده رسمی Predator و McDermott — بزرگ‌ترین مجموعه تجهیزات بیلیارد ایران',
    about: 'فروشگاه آریا با بیش از ۱۸ سال سابقه، نماینده رسمی برندهای Predator، Mezz و McDermott در ایران است. تیم متخصص ما با واردات مستقیم از تولیدکنندگان اصلی، اصالت کالا را تضمین می‌کند. خدمات مشاوره حرفه‌ای، ارسال سراسری با بیمه کالا، و خدمات پس از فروش ۲ ساله از ویژگی‌های ممتاز این فروشگاه است.',
    since: '۱۳۸۵', sinceYear: 1385, city: 'تهران',
    rating: 4.8, reviewCount: 247, productCount: 312, totalSales: 1850,
    responseTime: '۲ ساعت',
    brands: ['Predator', 'Mezz', 'McDermott', 'Riley', 'Fury', 'Lucasi'],
    specialties: ['چوب حرفه‌ای', 'میز اسنوکر', 'کیف و کِیس', 'توپ اصل', 'لوازم جانبی'],
    phone: '02188456789', whatsapp: '989121234567', instagram: 'arya.billiard',
    address: 'تهران، خیابان ولیعصر، بالاتر از پارک ملت، پلاک ۱۲۴',
    workHours: 'شنبه تا چهارشنبه ۹–۲۰ | پنج‌شنبه ۹–۱۵ | جمعه تعطیل',
    g1: '#C7A66A', g2: '#7A4F1E',
    products: [
      { id: 'p1', img: '/images/shop/cue_billiard_2.jpg',   name: 'چوب Predator REVO 12.4',          category: 'چوب بیلیارد',  price: 18500000, old: 21000000, disc: 12 },
      { id: 'p2', img: '/images/shop/cue_billiard.jpg',     name: 'چوب Mezz EC7-WH کربن فایبر',      category: 'چوب بیلیارد',  price: 8200000,  old: 9000000,  disc: 9  },
      { id: 'p3', img: '/images/shop/snooker-table.jpg',    name: 'میز Riley Tournament Pro اسنوکر', category: 'میز',          price: 124000000,old: 138000000,disc: 10 },
      { id: 'p4', img: '/images/shop/Ball-1.jpg',           name: 'ست توپ Aramith Premier اصل',      category: 'توپ',          price: 4800000,  old: 5500000,  disc: 13 },
      { id: 'p5', img: '/images/shop/accessori.png',        name: 'کیف چوب McDermott Deluxe چرم',    category: 'کیف و کِیس',   price: 2100000,  old: 2100000,  disc: 0  },
      { id: 'p6', img: '/images/shop/pool_chalk_1.jpg',     name: 'گچ Master Diamond — ۱۴۴ عددی',   category: 'لوازم جانبی', price: 180000,   old: 220000,   disc: 18 },
    ],
    reviews: [
      { id: 'r1', author: 'علی محمدی',   rating: 5, date: '۱۴ خرداد ۱۴۰۴', text: 'چوب Predator واقعاً فوق‌العاده است. ارسال سریع و بسته‌بندی عالی. کالا کاملاً اصل بود. قطعاً دوباره خرید می‌کنم.', product: 'چوب Predator REVO 12.4' },
      { id: 'r2', author: 'سارا حسینی',  rating: 5, date: '۲ خرداد ۱۴۰۴',  text: 'خدمات پس از فروش عالی. وقتی یه مشکل کوچیک داشتم، سریع راهنمایی کردن و پیگیری کردن تا مشکل حل بشه.', product: 'میز Riley Tournament Pro' },
      { id: 'r3', author: 'رضا کریمی',   rating: 4, date: '۲۸ اردیبهشت ۱۴۰۴', text: 'محصول اصل و قیمت مناسب نسبت به بازار. تنها ایراد تأخیر ۲ روزه در ارسال بود که به خاطر مشکلات پستی بود.', product: 'ست توپ Aramith Premier' },
      { id: 'r4', author: 'مریم تهرانی', rating: 5, date: '۱۵ اردیبهشت ۱۴۰۴', text: 'بهترین فروشگاه بیلیارد تهران. با تیم مشاوره‌شون صحبت کردم و راهنمایی عالی دادن. کاملاً حرفه‌ای.', product: 'چوب Mezz EC7-WH' },
    ],
  },
  '2': {
    id: '2', name: 'بیلیارد سنتر تهران', verified: true, elite: false,
    bannerImage: '/images/shop/cue_billiard_2.jpg',
    tagline: 'بزرگ‌ترین مرکز تخصصی بیلیارد در پایتخت با قیمت مناسب',
    about: 'بیلیارد سنتر با هدف ارائه تجهیزات باکیفیت به قیمت مناسب تأسیس شده است. ما با انتخاب دقیق محصولات از برندهای معتبر، بهترین تجربه خرید را برای بازیکنان در تمام سطوح فراهم می‌کنیم.',
    since: '۱۳۹۲', sinceYear: 1392, city: 'تهران',
    rating: 4.5, reviewCount: 124, productCount: 189, totalSales: 940,
    responseTime: '۴ ساعت',
    brands: ['Riley', 'Fury', 'BCE', 'Cuetec'],
    specialties: ['چوب آموزشی', 'توپ', 'مجموعه مبتدی', 'لوازم جانبی'],
    phone: '02177890123', whatsapp: '989351110002', instagram: 'billiardcenter.tehran',
    address: 'تهران، خیابان انقلاب، نزدیک میدان فردوسی، پلاک ۸۸',
    workHours: 'شنبه تا پنج‌شنبه ۱۰–۲۰ | جمعه ۱۲–۱۸',
    g1: '#2563EB', g2: '#1E3A8A',
    products: [
      { id: 'p1', img: '/images/shop/cue_billiard.jpg',   name: 'چوب Riley Club Pro',         category: 'چوب بیلیارد',  price: 3200000, old: 3800000, disc: 16 },
      { id: 'p2', img: '/images/shop/Ball.jpg',           name: 'ست توپ BCE Premier',         category: 'توپ',          price: 2800000, old: 3200000, disc: 13 },
      { id: 'p3', img: '/images/shop/pool_chalk_2.jpg',   name: 'گچ Master Blue — ۱۲ عددی',   category: 'لوازم جانبی', price: 150000,  old: 180000,  disc: 17 },
      { id: 'p4', img: '/images/shop/accessori.png',      name: 'نگهدارنده چوب دیواری ۶ عدد', category: 'لوازم جانبی', price: 450000,  old: 500000,  disc: 10 },
    ],
    reviews: [
      { id: 'r1', author: 'کامران نوری',  rating: 4, date: '۱۰ خرداد ۱۴۰۴',   text: 'قیمت‌ها مناسبه و سرویس خوبیه. فروشنده‌ها حرفه‌ای و دانا هستن.', product: 'چوب Riley Club Pro' },
      { id: 'r2', author: 'فریبا صادقی',  rating: 5, date: '۳ خرداد ۱۴۰۴',    text: 'برای اولین بار بود داشتم چوب بیلیارد می‌خریدم، خیلی خوب راهنمایی کردن.', product: 'ست توپ BCE Premier' },
      { id: 'r3', author: 'پدرام قاسمی',  rating: 4, date: '۲۵ اردیبهشت ۱۴۰۴', text: 'محصولات اصل و قیمت منصفانه. ارسالشون هم سریع بود.', product: 'گچ Master Blue' },
    ],
  },
  '3': {
    id: '3', name: 'بیلیارد اکبری اصفهان', verified: false, elite: false,
    bannerImage: '/images/shop/Ball-1.jpg',
    tagline: 'تجهیزات بیلیارد برای همه سطوح — از مبتدی تا حرفه‌ای',
    about: 'فروشگاه اکبری از سال ۱۳۹۸ در اصفهان فعالیت می‌کند و خدمات تجهیزات بیلیارد را به استان‌های مرکزی کشور ارائه می‌دهد. با تنوع بالا و قیمت‌های رقابتی، بهترین انتخاب برای بازیکنان اصفهان و اطراف هستیم.',
    since: '۱۳۹۸', sinceYear: 1398, city: 'اصفهان',
    rating: 4.2, reviewCount: 56, productCount: 78, totalSales: 320,
    responseTime: '۸ ساعت',
    brands: ['Fury', 'Viper', 'Cuetec'],
    specialties: ['چوب ورزشی', 'لوازم جانبی', 'توپ'],
    phone: '03136543210', whatsapp: '989011110003', instagram: 'akbari.billiard',
    address: 'اصفهان، خیابان چهارباغ عباسی، کوچه ماهان، پلاک ۱۲',
    workHours: 'شنبه تا چهارشنبه ۱۰–۱۹ | پنج‌شنبه ۱۰–۱۶ | جمعه تعطیل',
    g1: '#7C3AED', g2: '#4C1D95',
    products: [
      { id: 'p1', img: '/images/shop/cue_billiard.jpg', name: 'چوب Viper Desperado Pro',   category: 'چوب بیلیارد',  price: 1800000, old: 2100000, disc: 14 },
      { id: 'p2', img: '/images/shop/Ball.jpg',         name: 'ست توپ Fury Tournament',    category: 'توپ',          price: 1200000, old: 1400000, disc: 14 },
      { id: 'p3', img: '/images/shop/pool_chalk_1.jpg', name: 'گچ Predator 1080 — ۵ عدد', category: 'لوازم جانبی', price: 220000,  old: 245000,  disc: 10 },
    ],
    reviews: [
      { id: 'r1', author: 'حسن رضایی',   rating: 4, date: '۵ خرداد ۱۴۰۴',      text: 'قیمت‌ها خوب بود. خرید آنلاینم بدون مشکل انجام شد.', product: 'چوب Viper Desperado Pro' },
      { id: 'r2', author: 'زینب موسوی',  rating: 4, date: '۱۸ اردیبهشت ۱۴۰۴', text: 'محصول درستی بود ولی بسته‌بندی یکم ضعیف بود. کلاً راضی‌ام.', product: 'ست توپ Fury Tournament' },
    ],
  },
  '4': {
    id: '4', name: 'آنلاین بیلیارد شاپ', verified: true, elite: false,
    bannerImage: '/images/shop/Home_table.jpg',
    tagline: 'اولین فروشگاه اختصاصی آنلاین بیلیارد — ارسال سراسری با ضمانت ۷ روزه',
    about: 'آنلاین بیلیارد شاپ با تمرکز بر خرید آنلاین آسان و ضمانت اصالت کالا، از سال ۱۴۰۰ فعالیت می‌کند. با سیستم ردیابی سفارش آنلاین، بیمه کالا در ارسال، و پشتیبانی ۲۴/۷، تجربه‌ای متفاوت از خرید تجهیزات بیلیارد ارائه می‌دهیم.',
    since: '۱۴۰۰', sinceYear: 1400, city: 'مشهد',
    rating: 4.6, reviewCount: 89, productCount: 145, totalSales: 680,
    responseTime: '۱ ساعت',
    brands: ['McDermott', 'Lucasi', 'Predator', 'Players'],
    specialties: ['خرید آنلاین', 'چوب', 'کیف چوب', 'ارسال سراسری'],
    phone: '05135678901', whatsapp: '989351110009', instagram: 'online.billiard.shop',
    address: 'مشهد، خیابان امام رضا، نزدیک حرم، پاساژ رضوی، واحد ۱۴',
    workHours: 'آنلاین: ۲۴ ساعته | پشتیبانی تلفنی: ۸–۲۲ همه روزه',
    g1: '#16A34A', g2: '#14532D',
    products: [
      { id: 'p1', img: '/images/shop/cue_billiard_2.jpg', name: 'چوب Lucasi Custom LHC97MB',    category: 'چوب بیلیارد', price: 6400000, old: 7200000, disc: 11 },
      { id: 'p2', img: '/images/shop/accessori.png',      name: 'کیف چوب Predator Sport 2×4',  category: 'کیف و کِیس',  price: 1600000, old: 1800000, disc: 11 },
      { id: 'p3', img: '/images/shop/pool_chalk_2.jpg',   name: 'گچ Predator 1080 Pure ۱۰تایی', category: 'لوازم جانبی', price: 420000, old: 490000, disc: 14 },
    ],
    reviews: [
      { id: 'r1', author: 'ناهید صادقی',  rating: 5, date: '۸ خرداد ۱۴۰۴',    text: 'ارسال خیلی سریع بود — کمتر از ۴۸ ساعت رسید. محصول کاملاً اصل و بسته‌بندی عالی.', product: 'چوب Lucasi Custom' },
      { id: 'r2', author: 'محمود علوی',   rating: 5, date: '۲۲ اردیبهشت ۱۴۰۴', text: 'پشتیبانی فوق‌العاده دارن. ساعت ۱۱ شب سؤال پرسیدم، جواب دادن.', product: 'کیف چوب Predator Sport' },
    ],
  },
  '5': {
    id: '5', name: 'پرستیژ بیلیارد شیراز', verified: true, elite: true,
    bannerImage: '/images/shop/Pro_table.jpg',
    tagline: 'نماینده رسمی Predator در جنوب کشور — تخصصی در میزهای اسنوکر حرفه‌ای',
    about: 'پرستیژ بیلیارد با بیش از ۱۴ سال سابقه در شیراز، نماینده انحصاری برند Predator در استان‌های فارس، کرمان و هرمزگان است. تیم ما شامل متخصصان نصب و تنظیم میز بیلیارد، مشاوران حرفه‌ای، و تکنسین‌های مجرب است.',
    since: '۱۳۸۹', sinceYear: 1389, city: 'شیراز',
    rating: 4.7, reviewCount: 183, productCount: 228, totalSales: 1240,
    responseTime: '۳ ساعت',
    brands: ['Predator', 'Viking', 'Scorpion', 'Aramith'],
    specialties: ['میز اسنوکر', 'میز پول', 'پارچه میز', 'چوب حرفه‌ای'],
    phone: '07132001234', whatsapp: '989121110005', instagram: 'prestige.billiard.shiraz',
    address: 'شیراز، بلوار زند، مجتمع تجاری آرسن، طبقه اول، واحد ۲۲',
    workHours: 'شنبه تا چهارشنبه ۹–۲۰ | پنج‌شنبه ۹–۱۵ | جمعه تعطیل',
    g1: '#DC2626', g2: '#7F1D1D',
    products: [
      { id: 'p1', img: '/images/shop/Pro_table.jpg',      name: 'میز بیلیارد حرفه‌ای پارچه ایتالیایی', category: 'میز', price: 32000000, old: 36000000, disc: 11 },
      { id: 'p2', img: '/images/shop/snooker-table.jpg',  name: 'میز اسنوکر Pro-Line ۱۲ فوتی',         category: 'میز', price: 68000000, old: 75000000, disc: 9  },
      { id: 'p3', img: '/images/shop/cue_billiard_2.jpg', name: 'چوب Predator P3 REVO شفت',            category: 'چوب بیلیارد', price: 14500000, old: 16000000, disc: 9 },
    ],
    reviews: [
      { id: 'r1', author: 'داود منصوری',  rating: 5, date: '۱۲ خرداد ۱۴۰۴',   text: 'برای سالن بیلیاردمون از پرستیژ میز خریدیم. نصب و راه‌اندازی هم عالی بود.', product: 'میز اسنوکر Pro-Line' },
      { id: 'r2', author: 'لیلا احمدی',  rating: 5, date: '۴ خرداد ۱۴۰۴',    text: 'بهترین انتخاب برای خرید میز حرفه‌ای. قیمت مناسب‌تر از تهران پیدا کردم.', product: 'میز بیلیارد حرفه‌ای' },
    ],
  },
  '6': {
    id: '6', name: 'گلدن کیو تهران', verified: true, elite: false,
    bannerImage: '/images/shop/pool_chalk_1.jpg',
    tagline: 'متخصص لوازم جانبی و قطعات حرفه‌ای — واردکننده مستقیم',
    about: 'گلدن کیو با تمرکز بر لوازم جانبی و قطعات تخصصی بیلیارد، بهترین گزینه برای بازیکنان حرفه‌ای است که به جزئیات اهمیت می‌دهند. از تیپ‌های Kamui و Predator تا گچ‌های خاص و رست‌های حرفه‌ای، همه را از ما بخواهید.',
    since: '۱۳۹۶', sinceYear: 1396, city: 'تهران',
    rating: 4.4, reviewCount: 71, productCount: 95, totalSales: 520,
    responseTime: '۶ ساعت',
    brands: ['Mezz', 'Tiger', 'Pechauer', 'Kamui'],
    specialties: ['تیپ حرفه‌ای', 'گچ تخصصی', 'لوازم جانبی', 'قطعات'],
    phone: '02177001234', whatsapp: '989191110006', instagram: 'golden.cue.tehran',
    address: 'تهران، خیابان شریعتی، نرسیده به پل صدر، پلاک ۳۲۱',
    workHours: 'شنبه تا چهارشنبه ۱۰–۱۹ | پنج‌شنبه ۱۰–۱۵ | جمعه تعطیل',
    g1: '#B45309', g2: '#78350F',
    products: [
      { id: 'p1', img: '/images/shop/pool_chalk_1.jpg',  name: 'گچ Kamui Chalk 0.98 — ۱۲ عدد',  category: 'لوازم جانبی', price: 580000,   old: 650000,  disc: 11 },
      { id: 'p2', img: '/images/shop/pool_chalk_2.jpg',  name: 'گچ Tiger Ultramarine — ۱۲ عدد', category: 'لوازم جانبی', price: 320000,   old: 380000,  disc: 16 },
      { id: 'p3', img: '/images/shop/cue_billiard.jpg',  name: 'چوب Pechauer Pro P10-G',         category: 'چوب بیلیارد', price: 11200000, old: 12500000, disc: 10 },
    ],
    reviews: [
      { id: 'r1', author: 'امیر توکلی',   rating: 5, date: '۹ خرداد ۱۴۰۴',    text: 'تنها جایی که گچ Kamui اصل دارن! قیمتشم معقوله.', product: 'گچ Kamui Chalk' },
      { id: 'r2', author: 'نرگس میرزایی', rating: 4, date: '۲۰ اردیبهشت ۱۴۰۴', text: 'تخصصی‌ترین فروشگاه لوازم جانبی بیلیارد تهران. همه چیز دارن.', product: 'تیپ Kamui Black' },
    ],
  },
}

/* ─── Stars ─── */
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
          stroke="#f59e0b" strokeWidth={i <= Math.round(rating) ? 0 : 1.5}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

/* ─── Dark Product Card ─── */
function ProductCard({ p }: { p: SP }) {
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/shop/${p.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? 'rgba(255,255,255,0.065)' : CARD,
          border: `1px solid ${hov ? CBORH : CBOR}`,
          borderRadius: 18, overflow:'hidden',
          boxShadow: hov
            ? `0 24px 60px rgba(0,0,0,0.50), 0 0 0 1px ${CBORH}, 0 0 32px rgba(199,166,106,0.08)`
            : '0 4px 24px rgba(0,0,0,0.30)',
          transform: hov ? 'translateY(-6px) scale(1.012)' : 'none',
          transition:'all 0.32s cubic-bezier(0.22,1,0.36,1)',
        }}>
        <div style={{ position:'relative', paddingTop:'78%', overflow:'hidden', background:'rgba(255,255,255,0.03)' }}>
          <img src={p.img} alt={p.name}
            style={{
              position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
              transform: hov ? 'scale(1.07)' : 'scale(1)',
              transition:'transform 0.50s cubic-bezier(0.22,1,0.36,1)',
              filter: hov ? 'brightness(1.05)' : 'brightness(0.90)',
            }} />
          {p.disc > 0 && (
            <div style={{ position:'absolute', top:10, right:10,
              background:'linear-gradient(135deg,#dc2626,#ea580c)',
              color:'#fff', fontSize:11, fontWeight:900,
              borderRadius:7, padding:'2px 8px',
              boxShadow:'0 3px 10px rgba(220,38,38,0.45)' }}>
              {toFa(p.disc)}٪
            </div>
          )}
          <div style={{ position:'absolute', inset:0,
            background:'linear-gradient(to top, rgba(7,7,10,0.68) 0%, transparent 55%)',
            opacity: hov ? 1 : 0.55, transition:'opacity 0.3s' }} />
        </div>
        <div style={{ padding:'14px 16px 18px' }}>
          <span style={{ fontSize:11, fontWeight:700, color:GOLD,
            background:'rgba(199,166,106,0.10)', border:`1px solid rgba(199,166,106,0.20)`,
            borderRadius:20, padding:'2px 9px', display:'inline-block', marginBottom:7 }}>
            {p.category}
          </span>
          <h3 style={{ fontSize:13.5, fontWeight:700, color:TEXT, lineHeight:1.5, margin:'0 0 12px',
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {p.name}
          </h3>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            {p.disc > 0 && (
              <span style={{ fontSize:11.5, color:TEXTM, textDecoration:'line-through' }}>
                {fmtN(p.old)}
              </span>
            )}
            <span style={{ fontSize:17, fontWeight:900, color:GOLD }}>{fmtN(p.price)}</span>
            <span style={{ fontSize:12, color:TEXTD }}>تومان</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ─── Dark Review Card ─── */
function ReviewCard({ r }: { r: Review }) {
  return (
    <div style={{ background:CARD, border:`1px solid ${CBOR}`, borderRadius:16,
      padding:'20px 22px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, right:0, width:120, height:120,
        background:`radial-gradient(circle at top right, rgba(199,166,106,0.06), transparent 70%)`,
        pointerEvents:'none' }}/>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:'50%',
            background:`linear-gradient(135deg,${GOLD},${GOLDD})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:15, fontWeight:900, color:'#fff', flexShrink:0 }}>
            {r.author.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize:13.5, fontWeight:800, color:TEXT }}>{r.author}</div>
            <div style={{ fontSize:11.5, color:TEXTD }}>{r.date}</div>
          </div>
        </div>
        <Stars rating={r.rating} size={12} />
      </div>
      <p style={{ fontSize:13.5, color:TEXTD, lineHeight:1.8, margin:'0 0 10px' }}>{r.text}</p>
      <div style={{ fontSize:12, color:GOLD, opacity:0.75, display:'flex', alignItems:'center', gap:5 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
        {r.product}
      </div>
    </div>
  )
}

/* ─── Page ─── */
export default function SellerDetailPage() {
  const params = useParams()
  const rawId  = Array.isArray(params.id) ? params.id[0] : params.id
  const seller = rawId ? SELLERS[rawId] : null

  const [activeTab, setActiveTab] = useState<'products'|'about'|'reviews'>('products')
  const [activeCat, setActiveCat] = useState('همه')
  const [scrolled,  setScrolled]  = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive:true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!seller) return (
    <div style={{ minHeight:'100vh', background:BG, direction:'rtl',
      fontFamily:"'Vazirmatn',Tahoma,sans-serif", display:'flex',
      alignItems:'center', justifyContent:'center', color:TEXT }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:14, opacity:0.3 }}>🎱</div>
        <p style={{ fontSize:17, fontWeight:700, marginBottom:14 }}>فروشگاه پیدا نشد</p>
        <Link href="/sellers" style={{ color:GOLD, fontWeight:700, fontSize:14 }}>← بازگشت به فروشندگان</Link>
      </div>
    </div>
  )

  const yearsActive = 1403 - seller.sinceYear
  const waLink = `https://wa.me/${seller.whatsapp}?text=${encodeURIComponent(`سلام، از طریق بیلیارد هاب با فروشگاه ${seller.name} تماس می‌گیرم`)}`
  const allCats = ['همه', ...Array.from(new Set(seller.products.map(p => p.category)))]
  const filteredProds = activeCat === 'همه' ? seller.products : seller.products.filter(p => p.category === activeCat)
  const ratingDist = [
    { star:5, pct:68 }, { star:4, pct:21 }, { star:3, pct:7 }, { star:2, pct:3 }, { star:1, pct:1 },
  ]

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes heroUp{from{opacity:0;transform:translateY(44px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes floatA{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-20px) rotate(7deg)}}
        @keyframes floatB{0%,100%{transform:translateY(0)}50%{transform:translateY(-13px) rotate(-5deg)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 30px rgba(199,166,106,0.20)}50%{box-shadow:0 0 60px rgba(199,166,106,0.50)}}
        @keyframes shimmerGold{0%{background-position:-300% center}100%{background-position:300% center}}
        @keyframes scanIn{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .tab-btn{transition:all .2s;cursor:pointer;}
        .soc-btn{transition:all .18s;}
        .soc-btn:hover{transform:translateY(-2px);filter:brightness(1.14);}
        .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
        .rgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        @media(max-width:860px){.pgrid{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:480px){.pgrid{grid-template-columns:1fr!important;}.rgrid{grid-template-columns:1fr!important;}}
        .cat-scroll::-webkit-scrollbar{display:none;}
      `}</style>

      <div style={{ direction:'rtl', fontFamily:"'Vazirmatn',Tahoma,sans-serif",
        background:BG, minHeight:'100vh', color:TEXT, position:'relative' }}>

        {/* ══ Sticky Nav ══ */}
        <div style={{
          position:'fixed', top:0, left:0, right:0, zIndex:100,
          background: scrolled ? 'rgba(7,7,10,0.90)' : 'transparent',
          backdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'none',
          borderBottom: scrolled ? `1px solid ${CBOR}` : '1px solid transparent',
          transition:'all 0.35s ease',
          padding:'0 clamp(20px,5vw,64px)',
          display:'flex', alignItems:'center', justifyContent:'space-between', height:60,
        }}>
          <Link href="/sellers" style={{
            display:'flex', alignItems:'center', gap:5,
            fontSize:13, fontWeight:700, color:TEXTD, textDecoration:'none',
            transition:'color .2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={e => (e.currentTarget.style.color = TEXTD)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            فروشندگان
          </Link>
          {scrolled && (
            <span style={{ fontSize:15, fontWeight:800, color:TEXT, animation:'fadeIn .3s ease' }}>
              {seller.name}
            </span>
          )}
          <a href={`tel:${seller.phone}`} style={{
            fontSize:12.5, fontWeight:700, color:GOLD,
            background:'rgba(199,166,106,0.10)', border:`1px solid rgba(199,166,106,0.28)`,
            borderRadius:100, padding:'7px 16px', textDecoration:'none',
            transition:'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(199,166,106,0.20)' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(199,166,106,0.10)' }}>
            تماس با فروشگاه
          </a>
        </div>

        {/* ══ HERO ══ */}
        <div style={{ position:'relative', height:'100vh', minHeight:580, overflow:'hidden' }}>
          <img src={seller.bannerImage} alt="" style={{
            position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', filter:'blur(2px) saturate(0.50)', transform:'scale(1.06)',
          }}/>
          <div style={{ position:'absolute', inset:0, background:'rgba(7,7,10,0.84)' }}/>
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:'radial-gradient(circle, rgba(199,166,106,0.06) 1px, transparent 1px)',
            backgroundSize:'32px 32px', opacity:0.6,
          }}/>
          <div style={{
            position:'absolute', top:-120, right:-80, width:600, height:600,
            background:`radial-gradient(circle, ${seller.g1}22 0%, transparent 65%)`,
            filter:'blur(60px)', pointerEvents:'none',
          }}/>
          <div style={{
            position:'absolute', bottom:-80, left:-60, width:380, height:380,
            background:`radial-gradient(circle, ${seller.g2}18 0%, transparent 65%)`,
            filter:'blur(50px)', pointerEvents:'none',
          }}/>

          {/* Floating decorative balls */}
          <div style={{ position:'absolute', top:'22%', left:'8%', width:42, height:42, borderRadius:'50%',
            background:`linear-gradient(135deg,${seller.g1},${seller.g2})`,
            opacity:0.20, animation:'floatA 6s ease-in-out infinite',
            boxShadow:`0 0 22px ${seller.g1}44` }}/>
          <div style={{ position:'absolute', top:'60%', right:'7%', width:26, height:26, borderRadius:'50%',
            background:`linear-gradient(135deg,${GOLD},${GOLDD})`,
            opacity:0.16, animation:'floatB 8s ease-in-out infinite 1s' }}/>
          <div style={{ position:'absolute', top:'38%', left:'20%', width:16, height:16, borderRadius:'50%',
            background:'rgba(255,255,255,0.07)', animation:'floatA 10s ease-in-out infinite 2s' }}/>

          {/* Hero content */}
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            padding:'80px clamp(24px,5vw,80px) 60px' }}>

            {/* Elite badge */}
            {seller.elite && (
              <div style={{
                fontSize:11.5, fontWeight:800, color:GOLD,
                background:'rgba(199,166,106,0.10)', border:`1px solid rgba(199,166,106,0.28)`,
                borderRadius:100, padding:'5px 14px', letterSpacing:'0.12em',
                display:'flex', alignItems:'center', gap:5,
                animation:'heroUp .35s ease both', marginBottom:18,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill={GOLD}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                نماینده رسمی
              </div>
            )}

            {/* Avatar */}
            <div style={{
              width:94, height:94, borderRadius:'50%',
              background:`linear-gradient(135deg,${seller.g1},${seller.g2})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:36, fontWeight:900, color:'rgba(255,255,255,0.92)',
              animation:'heroUp .45s ease both, pulseGlow 3s ease-in-out 1s infinite',
              border:`2.5px solid ${seller.g1}55`, marginBottom:22,
            }}>
              {seller.name[0]}
            </div>

            {/* Name */}
            <h1 style={{
              fontSize:'clamp(26px,4vw,46px)', fontWeight:900, letterSpacing:'-0.04em',
              lineHeight:1.05, textAlign:'center', marginBottom:12,
              background:`linear-gradient(90deg,${GOLDB},${GOLD},${GOLDB})`,
              backgroundSize:'300% auto',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              animation:'heroUp .52s ease both, shimmerGold 4s linear 1.5s infinite',
            }}>
              {seller.name}
            </h1>

            {/* Verified badge */}
            {seller.verified && (
              <div style={{ display:'flex', alignItems:'center', gap:5,
                fontSize:12.5, color:'rgba(37,99,235,0.90)', fontWeight:700,
                background:'rgba(37,99,235,0.10)', border:'1px solid rgba(37,99,235,0.28)',
                borderRadius:100, padding:'4px 12px', marginBottom:14,
                animation:'heroUp .56s ease both' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#2563EB" stroke="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                </svg>
                تأیید شده
              </div>
            )}

            {/* Tagline */}
            <p style={{ fontSize:'clamp(12.5px,1.5vw,15px)', color:TEXTD, textAlign:'center',
              maxWidth:520, lineHeight:1.7, marginBottom:26,
              animation:'heroUp .60s ease both' }}>
              {seller.tagline}
            </p>

            {/* Stat chips */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center',
              marginBottom:28, animation:'heroUp .64s ease both' }}>
              {[
                { icon:'🏙', label: seller.city },
                { icon:'📅', label: `از ${seller.since}` },
                { icon:'⭐', label: `${toFa(seller.rating)}/۵` },
                { icon:'📦', label: `${toFa(seller.productCount)} محصول` },
              ].map((c, i) => (
                <div key={i} style={{
                  fontSize:12.5, fontWeight:700, color:TEXT,
                  background:'rgba(255,255,255,0.06)',
                  border:`1px solid ${CBOR}`,
                  borderRadius:100, padding:'6px 14px',
                  display:'flex', alignItems:'center', gap:5,
                }}>
                  <span>{c.icon}</span>
                  {c.label}
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center',
              animation:'heroUp .68s ease both' }}>
              <a href={`tel:${seller.phone}`} style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'13px 24px', background:`linear-gradient(135deg,${GOLD},${GOLDD})`,
                color:'#fff', borderRadius:10, fontSize:14, fontWeight:800,
                textDecoration:'none',
                boxShadow:`0 6px 24px rgba(199,166,106,0.35)`,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                تماس مستقیم
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'13px 22px', background:`rgba(37,211,102,0.14)`,
                border:`1.5px solid rgba(37,211,102,0.36)`,
                color:GREEN, borderRadius:10, fontSize:14, fontWeight:800,
                textDecoration:'none', transition:'all .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(37,211,102,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(37,211,102,0.14)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={GREEN}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                واتساپ
              </a>
            </div>
          </div>

          {/* Bottom fade to content */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:100,
            background:`linear-gradient(to top, ${BG} 0%, transparent 100%)` }}/>
        </div>

        {/* ══ Stats Bar ══ */}
        <div style={{
          borderTop:`1px solid ${CBOR}`, borderBottom:`1px solid ${CBOR}`,
          background:'rgba(255,255,255,0.02)',
        }}>
          <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 clamp(24px,5vw,64px)',
            display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
            {[
              { n:toFa(yearsActive),        label:'سال فعالیت',    accent:GOLD },
              { n:`${toFa(seller.rating)}/۵`, label:'امتیاز فروشگاه', accent:'#f59e0b' },
              { n:fmtN(seller.productCount), label:'محصول موجود',   accent:GOLDB },
              { n:fmtN(seller.totalSales),   label:'فروش موفق',     accent:'#4ADE80' },
            ].map((s, i) => (
              <div key={i} style={{
                padding:'22px 16px', textAlign:'center',
                borderLeft: i < 3 ? `1px solid ${CBOR}` : 'none',
              }}>
                <div style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, color:s.accent, lineHeight:1, marginBottom:5 }}>
                  {s.n}
                </div>
                <div style={{ fontSize:12, color:TEXTD, fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ Sticky Tabs ══ */}
        <div style={{
          position:'sticky', top:60, zIndex:90,
          background:'rgba(7,7,10,0.92)',
          backdropFilter:'blur(20px) saturate(180%)',
          borderBottom:`1px solid ${CBOR}`,
        }}>
          <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 clamp(24px,5vw,64px)',
            display:'flex', alignItems:'center', gap:4 }}>
            {([
              { k:'products', l:'محصولات' },
              { k:'about',    l:'درباره فروشگاه' },
              { k:'reviews',  l:`نظرات (${toFa(seller.reviewCount)})` },
            ] as { k:'products'|'about'|'reviews'; l:string }[]).map(({ k, l }) => {
              const active = activeTab === k
              return (
                <button key={k} className="tab-btn" onClick={() => setActiveTab(k)} style={{
                  padding:'15px 18px', border:'none', background:'transparent',
                  borderBottom: `2px solid ${active ? GOLD : 'transparent'}`,
                  color: active ? GOLD : TEXTD, fontSize:14, fontWeight: active ? 800 : 500,
                  fontFamily:"'Vazirmatn',Tahoma,sans-serif", transition:'all .2s',
                }}>
                  {l}
                </button>
              )
            })}
          </div>
        </div>

        {/* ══ Tab Content ══ */}
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'40px clamp(24px,5vw,64px) 80px' }}>

          {/* ── Products Tab ── */}
          {activeTab === 'products' && (
            <div>
              {/* Category filter */}
              <div className="cat-scroll" style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:22 }}>
                {allCats.map(cat => {
                  const active = activeCat === cat
                  return (
                    <button key={cat} onClick={() => setActiveCat(cat)} style={{
                      padding:'7px 16px', borderRadius:100, fontSize:13, fontWeight:700,
                      cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
                      border:`1px solid ${active ? GOLD : CBOR}`,
                      background: active ? `rgba(199,166,106,0.16)` : 'transparent',
                      color: active ? GOLD : TEXTD,
                      fontFamily:"'Vazirmatn',Tahoma,sans-serif",
                      transition:'all .18s',
                    }}>
                      {cat}
                    </button>
                  )
                })}
              </div>
              <div className="pgrid">
                {filteredProds.map((p, i) => (
                  <div key={p.id} style={{ animation:`fadeUp ${.2 + i*.06}s ease both` }}>
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── About Tab ── */}
          {activeTab === 'about' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24 }} className="about-grid">
              <style>{`@media(max-width:860px){.about-grid{grid-template-columns:1fr!important;}}`}</style>

              {/* Left: bio + brands + specialties */}
              <div>
                {/* Bio */}
                <div style={{ background:CARD, border:`1px solid ${CBOR}`, borderRadius:18, padding:'24px 26px', marginBottom:16 }}>
                  <h3 style={{ fontSize:15, fontWeight:800, color:GOLDB, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:3, height:16, background:`linear-gradient(to bottom,${GOLD},${GOLDD})`, borderRadius:2 }}/>
                    درباره فروشگاه
                  </h3>
                  <p style={{ fontSize:14, color:TEXTD, lineHeight:1.85 }}>{seller.about}</p>
                </div>

                {/* Brands */}
                <div style={{ background:CARD, border:`1px solid ${CBOR}`, borderRadius:18, padding:'22px 26px', marginBottom:16 }}>
                  <h3 style={{ fontSize:15, fontWeight:800, color:GOLDB, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:3, height:16, background:`linear-gradient(to bottom,${GOLD},${GOLDD})`, borderRadius:2 }}/>
                    برندهای نمایندگی
                  </h3>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {seller.brands.map(b => (
                      <span key={b} style={{
                        fontSize:13, fontWeight:700, color:GOLD,
                        background:'rgba(199,166,106,0.10)', border:`1px solid rgba(199,166,106,0.24)`,
                        borderRadius:8, padding:'6px 14px',
                      }}>{b}</span>
                    ))}
                  </div>
                </div>

                {/* Specialties */}
                <div style={{ background:CARD, border:`1px solid ${CBOR}`, borderRadius:18, padding:'22px 26px' }}>
                  <h3 style={{ fontSize:15, fontWeight:800, color:GOLDB, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:3, height:16, background:`linear-gradient(to bottom,${GOLD},${GOLDD})`, borderRadius:2 }}/>
                    تخصص‌ها
                  </h3>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {seller.specialties.map(s => (
                      <span key={s} style={{
                        fontSize:13, fontWeight:600, color:TEXTD,
                        background:`rgba(255,255,255,0.05)`, border:`1px solid ${CBOR}`,
                        borderRadius:8, padding:'6px 14px',
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: contact info */}
              <div>
                <div style={{ background:CARD, border:`1px solid ${CBOR}`, borderRadius:18, padding:'22px 24px', position:'sticky', top:140 }}>
                  <h3 style={{ fontSize:15, fontWeight:800, color:GOLDB, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:3, height:16, background:`linear-gradient(to bottom,${GOLD},${GOLDD})`, borderRadius:2 }}/>
                    اطلاعات تماس
                  </h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {[
                      { icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, text: seller.address },
                      { icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, text: seller.workHours },
                      { icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, text: seller.phone, href:`tel:${seller.phone}` },
                    ].map((item, i) => (
                      item.href ? (
                        <a key={i} href={item.href} style={{ display:'flex', alignItems:'flex-start', gap:10, textDecoration:'none', color:TEXTD, fontSize:13, lineHeight:1.6, transition:'color .2s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                          onMouseLeave={e => (e.currentTarget.style.color = TEXTD)}>
                          <span style={{ color:GOLD, marginTop:2, flexShrink:0 }}>{item.icon}</span>
                          {item.text}
                        </a>
                      ) : (
                        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color:TEXTD, lineHeight:1.6 }}>
                          <span style={{ color:GOLD, marginTop:2, flexShrink:0 }}>{item.icon}</span>
                          {item.text}
                        </div>
                      )
                    ))}
                  </div>

                  <div style={{ height:'1px', background:`linear-gradient(to right,transparent,${CBOR},transparent)`, margin:'20px 0' }}/>

                  {/* Social */}
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <a href={`tel:${seller.phone}`} className="soc-btn" style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      padding:'11px 0', borderRadius:10,
                      background:`linear-gradient(135deg,${GOLD},${GOLDD})`,
                      color:'#fff', fontSize:13.5, fontWeight:800, textDecoration:'none',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      تماس تلفنی
                    </a>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="soc-btn" style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      padding:'11px 0', borderRadius:10,
                      background:'rgba(37,211,102,0.12)',
                      border:`1.5px solid rgba(37,211,102,0.30)`,
                      color:GREEN, fontSize:13.5, fontWeight:800, textDecoration:'none',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={GREEN}>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                      </svg>
                      پیام واتساپ
                    </a>
                    {seller.instagram && (
                      <a href={`https://instagram.com/${seller.instagram}`} target="_blank" rel="noopener noreferrer" className="soc-btn" style={{
                        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                        padding:'11px 0', borderRadius:10,
                        background:'rgba(214,41,118,0.10)',
                        border:'1.5px solid rgba(214,41,118,0.28)',
                        color:'#E1306C', fontSize:13.5, fontWeight:800, textDecoration:'none',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="1.8">
                          <rect x="2" y="2" width="20" height="20" rx="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                        اینستاگرام
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Reviews Tab ── */}
          {activeTab === 'reviews' && (
            <div>
              {/* Rating summary */}
              <div style={{ background:CARD, border:`1px solid ${CBOR}`, borderRadius:18,
                padding:'24px 28px', marginBottom:24,
                display:'flex', gap:32, alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ textAlign:'center', minWidth:80 }}>
                  <div style={{ fontSize:'clamp(40px,6vw,56px)', fontWeight:900, color:'#f59e0b', lineHeight:1, marginBottom:6 }}>
                    {toFa(seller.rating)}
                  </div>
                  <Stars rating={seller.rating} size={15}/>
                  <div style={{ fontSize:13, color:TEXTD, marginTop:5 }}>{toFa(seller.reviewCount)} نظر</div>
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  {ratingDist.map(({ star, pct }) => (
                    <div key={star} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                      <span style={{ fontSize:12, color:TEXTD, width:8, textAlign:'center' }}>{toFa(star)}</span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      <div style={{ flex:1, height:6, background:`rgba(255,255,255,0.06)`, borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:3,
                          background:'linear-gradient(90deg,#f59e0b,#fbbf24)', width:`${pct}%`, transition:'width .6s ease' }}/>
                      </div>
                      <span style={{ fontSize:12, color:TEXTD, width:28, textAlign:'left' }}>{toFa(pct)}٪</span>
                    </div>
                  ))}
                </div>
              </div>

              {seller.reviews.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 0', color:TEXTD }}>
                  <div style={{ fontSize:40, marginBottom:12, opacity:0.3 }}>💬</div>
                  <p style={{ fontSize:15, fontWeight:700 }}>هنوز نظری ثبت نشده</p>
                </div>
              ) : (
                <div className="rgrid">
                  {seller.reviews.map((r, i) => (
                    <div key={r.id} style={{ animation:`fadeUp ${.2 + i*.07}s ease both` }}>
                      <ReviewCard r={r}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ Contact CTA ══ */}
        <div style={{ borderTop:`1px solid ${CBOR}`, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0,
            background:`radial-gradient(ellipse at 50% 0%, ${seller.g1}10 0%, transparent 60%)`,
            pointerEvents:'none' }}/>
          <div style={{ position:'relative', zIndex:1, maxWidth:1280, margin:'0 auto',
            padding:'52px clamp(24px,5vw,64px)',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:GOLD, letterSpacing:'0.22em', marginBottom:10 }}>
                تماس با فروشگاه
              </p>
              <h3 style={{ fontSize:'clamp(17px,2.6vw,26px)', fontWeight:900, color:TEXT,
                letterSpacing:'-0.03em', lineHeight:1.2, marginBottom:8 }}>
                {seller.name}
              </h3>
              <p style={{ fontSize:13.5, color:TEXTD, maxWidth:400 }}>
                پاسخگویی معمولاً در {seller.responseTime} · {seller.city}
              </p>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <a href={`tel:${seller.phone}`} style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'13px 24px', background:`linear-gradient(135deg,${GOLD},${GOLDD})`,
                color:'#fff', borderRadius:10, fontSize:14, fontWeight:800,
                textDecoration:'none', whiteSpace:'nowrap',
                boxShadow:`0 6px 24px rgba(199,166,106,0.30)`,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                تماس مستقیم
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'13px 22px', background:'rgba(37,211,102,0.10)',
                border:`1.5px solid rgba(37,211,102,0.32)`,
                color:GREEN, borderRadius:10, fontSize:14, fontWeight:800,
                textDecoration:'none', whiteSpace:'nowrap',
              }}>
                واتساپ
              </a>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
