'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const GOLD     = '#C7A66A'
const TEXT     = '#1C1C1A'
const TEXT_SEC = 'rgba(28,28,26,0.52)'
const TEXT_MUT = 'rgba(28,28,26,0.30)'

const LQ_BG   = 'rgba(255,255,255,0.78)'
const LQ_BOR  = '1px solid rgba(255,255,255,0.85)'
const LQ_SHAD = 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)'

function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}

// ── Types ─────────────────────────────────────────────────────
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
  products: SP[]; reviews: Review[]
}

// ── Mock Data ─────────────────────────────────────────────────
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
    products: [
      { id: 'p1', img: '/images/shop/cue_billiard_2.jpg',   name: 'چوب Predator REVO 12.4',          category: 'چوب بیلیارد',  price: 18500000, old: 21000000, disc: 12 },
      { id: 'p2', img: '/images/shop/cue_billiard.jpg',     name: 'چوب Mezz EC7-WH کربن فایبر',      category: 'چوب بیلیارد',  price: 8200000,  old: 9000000,  disc: 9  },
      { id: 'p3', img: '/images/shop/snooker-table.jpg',    name: 'میز Riley Tournament Pro اسنوکر', category: 'میز',          price: 124000000,old: 138000000,disc: 10 },
      { id: 'p4', img: '/images/shop/Ball-1.jpg',           name: 'ست توپ Aramith Premier اصل',      category: 'توپ',          price: 4800000,  old: 5500000,  disc: 13 },
      { id: 'p5', img: '/images/shop/accessori.png',        name: 'کیف چوب McDermott Deluxe چرم',    category: 'کیف و کِیس',   price: 2100000,  old: 2100000,  disc: 0  },
      { id: 'p6', img: '/images/shop/pool_chalk_1.jpg',     name: 'گچ Master Diamond — ۱۴۴ عددی',   category: 'لوازم جانبی', price: 180000,   old: 220000,   disc: 18 },
      { id: 'p7', img: '/images/shop/rest-pool.webp',       name: 'رست اسنوکر استنلس استیل حرفه‌ای', category: 'لوازم جانبی', price: 480000,   old: 480000,   disc: 0  },
      { id: 'p8', img: '/images/shop/Home_table.jpg',       name: 'میز بیلیارد خانگی چوب ماسیو',    category: 'میز',          price: 19000000, old: 21000000, disc: 10 },
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
    about: 'بیلیارد سنتر با هدف ارائه تجهیزات باکیفیت به قیمت مناسب تأسیس شده است. ما با انتخاب دقیق محصولات از برندهای معتبر، بهترین تجربه خرید را برای بازیکنان در تمام سطوح فراهم می‌کنیم. مشاوره رایگان در فروشگاه و ارسال سراسری از خدمات ما است.',
    since: '۱۳۹۲', sinceYear: 1392, city: 'تهران',
    rating: 4.5, reviewCount: 124, productCount: 189, totalSales: 940,
    responseTime: '۴ ساعت',
    brands: ['Riley', 'Fury', 'BCE', 'Cuetec'],
    specialties: ['چوب آموزشی', 'توپ', 'مجموعه مبتدی', 'لوازم جانبی'],
    phone: '02177890123', whatsapp: '989351110002', instagram: 'billiardcenter.tehran',
    address: 'تهران، خیابان انقلاب، نزدیک میدان فردوسی، پلاک ۸۸',
    workHours: 'شنبه تا پنج‌شنبه ۱۰–۲۰ | جمعه ۱۲–۱۸',
    products: [
      { id: 'p1', img: '/images/shop/cue_billiard.jpg',   name: 'چوب Riley Club Pro',         category: 'چوب بیلیارد',  price: 3200000, old: 3800000, disc: 16 },
      { id: 'p2', img: '/images/shop/Ball.jpg',           name: 'ست توپ BCE Premier',         category: 'توپ',          price: 2800000, old: 3200000, disc: 13 },
      { id: 'p3', img: '/images/shop/pool_chalk_2.jpg',   name: 'گچ Master Blue — ۱۲ عددی',   category: 'لوازم جانبی', price: 150000,  old: 180000,  disc: 17 },
      { id: 'p4', img: '/images/shop/accessori.png',      name: 'نگهدارنده چوب دیواری ۶ عدد', category: 'لوازم جانبی', price: 450000,  old: 500000,  disc: 10 },
      { id: 'p5', img: '/images/shop/rest-pool.webp',     name: 'رست استاندارد چوب راش',       category: 'لوازم جانبی', price: 280000,  old: 280000,  disc: 0  },
    ],
    reviews: [
      { id: 'r1', author: 'کامران نوری', rating: 4, date: '۱۰ خرداد ۱۴۰۴', text: 'قیمت‌ها مناسبه و سرویس خوبیه. فروشنده‌ها حرفه‌ای و دانا هستن.', product: 'چوب Riley Club Pro' },
      { id: 'r2', author: 'فریبا صادقی', rating: 5, date: '۳ خرداد ۱۴۰۴',  text: 'برای اولین بار بود داشتم چوب بیلیارد می‌خریدم، خیلی خوب راهنمایی کردن.', product: 'ست توپ BCE Premier' },
      { id: 'r3', author: 'پدرام قاسمی', rating: 4, date: '۲۵ اردیبهشت ۱۴۰۴', text: 'محصولات اصل و قیمت منصفانه. ارسالشون هم سریع بود.', product: 'گچ Master Blue' },
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
    products: [
      { id: 'p1', img: '/images/shop/cue_billiard.jpg', name: 'چوب Viper Desperado Pro',   category: 'چوب بیلیارد',  price: 1800000, old: 2100000, disc: 14 },
      { id: 'p2', img: '/images/shop/Ball.jpg',         name: 'ست توپ Fury Tournament',    category: 'توپ',          price: 1200000, old: 1400000, disc: 14 },
      { id: 'p3', img: '/images/shop/pool_chalk_1.jpg', name: 'گچ Predator 1080 — ۵ عدد', category: 'لوازم جانبی', price: 220000,  old: 245000,  disc: 10 },
    ],
    reviews: [
      { id: 'r1', author: 'حسن رضایی',   rating: 4, date: '۵ خرداد ۱۴۰۴',  text: 'قیمت‌ها خوب بود. خرید آنلاینم بدون مشکل انجام شد.', product: 'چوب Viper Desperado Pro' },
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
    products: [
      { id: 'p1', img: '/images/shop/cue_billiard_2.jpg', name: 'چوب Lucasi Custom LHC97MB',   category: 'چوب بیلیارد', price: 6400000, old: 7200000, disc: 11 },
      { id: 'p2', img: '/images/shop/accessori.png',      name: 'کیف چوب Predator Sport 2×4', category: 'کیف و کِیس',  price: 1600000, old: 1800000, disc: 11 },
      { id: 'p3', img: '/images/shop/pool_chalk_2.jpg',   name: 'گچ Predator 1080 Pure ۱۰تایی', category: 'لوازم جانبی', price: 420000, old: 490000, disc: 14 },
      { id: 'p4', img: '/images/shop/Ball.jpg',           name: 'ست توپ Cyclop Omega Pool',    category: 'توپ',         price: 950000, old: 1100000, disc: 14 },
      { id: 'p5', img: '/images/shop/rest-pool.webp',     name: 'رست Predator بلند ۱۸۰cm',    category: 'لوازم جانبی', price: 560000, old: 620000, disc: 10 },
    ],
    reviews: [
      { id: 'r1', author: 'ناهید صادقی',  rating: 5, date: '۸ خرداد ۱۴۰۴',    text: 'ارسال خیلی سریع بود — کمتر از ۴۸ ساعت رسید. محصول کاملاً اصل و بسته‌بندی عالی.', product: 'چوب Lucasi Custom' },
      { id: 'r2', author: 'محمود علوی',   rating: 5, date: '۲۲ اردیبهشت ۱۴۰۴', text: 'پشتیبانی فوق‌العاده دارن. ساعت ۱۱ شب سؤال پرسیدم، جواب دادن.', product: 'کیف چوب Predator Sport' },
      { id: 'r3', author: 'شادی کریمی',   rating: 4, date: '۱۴ اردیبهشت ۱۴۰۴', text: 'تجربه خرید آنلاین خیلی راحت بود. سایتشون هم کامل و واضحه.', product: 'ست توپ Cyclop Omega' },
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
    products: [
      { id: 'p1', img: '/images/shop/Pro_table.jpg',      name: 'میز بیلیارد حرفه‌ای پارچه ایتالیایی', category: 'میز',          price: 32000000, old: 36000000, disc: 11 },
      { id: 'p2', img: '/images/shop/snooker-table.jpg',  name: 'میز اسنوکر Pro-Line ۱۲ فوتی',         category: 'میز',          price: 68000000, old: 75000000, disc: 9  },
      { id: 'p3', img: '/images/shop/cue_billiard_2.jpg', name: 'چوب Predator P3 REVO شفت',            category: 'چوب بیلیارد',  price: 14500000, old: 16000000, disc: 9  },
      { id: 'p4', img: '/images/shop/Ball-1.jpg',         name: 'توپ Aramith Pro Cup WPBSA',           category: 'توپ',          price: 3800000,  old: 4200000,  disc: 10 },
      { id: 'p5', img: '/images/shop/accessori.png',      name: 'پارچه میز Simonis 860 اصل',           category: 'لوازم جانبی', price: 2800000,  old: 3200000,  disc: 13 },
    ],
    reviews: [
      { id: 'r1', author: 'داود منصوری',  rating: 5, date: '۱۲ خرداد ۱۴۰۴', text: 'برای سالن بیلیاردمون از پرستیژ میز خریدیم. نصب و راه‌اندازی هم عالی بود.', product: 'میز اسنوکر Pro-Line' },
      { id: 'r2', author: 'لیلا احمدی',  rating: 5, date: '۴ خرداد ۱۴۰۴',  text: 'بهترین انتخاب برای خرید میز حرفه‌ای. قیمت مناسب‌تر از تهران پیدا کردم.', product: 'میز بیلیارد حرفه‌ای' },
      { id: 'r3', author: 'یاسر فرحی',   rating: 4, date: '۲۷ اردیبهشت ۱۴۰۴', text: 'چوب Predator رو از اینجا گرفتم. اصل بود. یکم دیر رسید ولی کیفیت عالی.', product: 'چوب Predator P3 REVO' },
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
    products: [
      { id: 'p1', img: '/images/shop/pool_chalk_1.jpg',  name: 'گچ Kamui Chalk 0.98 — ۱۲ عدد',  category: 'لوازم جانبی', price: 580000,  old: 650000,  disc: 11 },
      { id: 'p2', img: '/images/shop/pool_chalk_2.jpg',  name: 'گچ Tiger Ultramarine — ۱۲ عدد', category: 'لوازم جانبی', price: 320000,  old: 380000,  disc: 16 },
      { id: 'p3', img: '/images/shop/rest-pool.webp',    name: 'رست Mezz دسته کربن ۱۷۰cm',      category: 'لوازم جانبی', price: 820000,  old: 950000,  disc: 14 },
      { id: 'p4', img: '/images/shop/accessori.png',     name: 'تیپ Kamui Black Soft — ۵ عدد',  category: 'لوازم جانبی', price: 480000,  old: 540000,  disc: 11 },
      { id: 'p5', img: '/images/shop/cue_billiard.jpg',  name: 'چوب Pechauer Pro P10-G',         category: 'چوب بیلیارد', price: 11200000,old: 12500000, disc: 10 },
    ],
    reviews: [
      { id: 'r1', author: 'امیر توکلی',   rating: 5, date: '۹ خرداد ۱۴۰۴',   text: 'تنها جایی که گچ Kamui اصل دارن! قیمتشم معقوله.', product: 'گچ Kamui Chalk' },
      { id: 'r2', author: 'نرگس میرزایی', rating: 4, date: '۲۰ اردیبهشت ۱۴۰۴', text: 'تخصصی‌ترین فروشگاه لوازم جانبی بیلیارد تهران. همه چیز دارن.', product: 'تیپ Kamui Black' },
    ],
  },
}

// ── Stars ─────────────────────────────────────────────────────
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth={i <= Math.round(rating) ? 0 : 1.8}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────
function SellerAvatar({ name, size = 56 }: { name: string; size?: number }) {
  const g = [['#C7A66A','#A07840'],['#6A9EC7','#4070A0'],['#9EC76A','#70A040'],['#C76A9E','#A04070'],['#6AC79E','#40A070'],['#C79E6A','#A07040']]
  const [c1, c2] = g[name.charCodeAt(0) % g.length] ?? ['#C7A66A','#A07840']
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg,${c1},${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
      {name.charAt(0)}
    </div>
  )
}

// ── Product Card (matches shop style) ────────────────────────
function ProductCard({ p }: { p: SP }) {
  const [hov, setHov] = useState(false)
  const fmt = (n: number) => toFa(n.toLocaleString('fa-IR'))
  return (
    <Link href={`/shop/product/${p.id}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${hov ? 'rgba(199,166,106,0.38)' : 'rgba(28,28,26,0.12)'}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? '0 12px 32px rgba(28,28,26,0.10)' : '0 2px 8px rgba(28,28,26,0.05)', transition: 'all 0.24s cubic-bezier(0.22,1,0.36,1)' }}
      >
        <div style={{ width: '100%', paddingTop: '80%', position: 'relative', background: '#F4F3F1', overflow: 'hidden', borderBottom: '1.5px solid rgba(28,28,26,0.08)', flexShrink: 0 }}>
          <img src={p.img} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: hov ? 'scale(1.05)' : 'scale(1)' }} />
          {p.disc > 0 && (
            <div style={{ position: 'absolute', top: 8, left: 8, background: '#E53935', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 7, padding: '2px 7px' }}>
              {toFa(p.disc)}٪
            </div>
          )}
        </div>
        <div style={{ padding: '10px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 12, color: TEXT_SEC, fontWeight: 500 }}>{p.category}</span>
          <span style={{ fontSize: 12.5, color: TEXT, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: 600 }}>{p.name}</span>
          <div style={{ marginTop: 'auto', paddingTop: 4 }}>
            {p.disc > 0 && <div style={{ fontSize: 11, color: TEXT_MUT, textDecoration: 'line-through', marginBottom: 2 }}>{fmt(p.old)} تومان</div>}
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1A6B3A' }}>{fmt(p.price)} <span style={{ fontSize: 11, fontWeight: 400 }}>تومان</span></div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Review Card ───────────────────────────────────────────────
function ReviewCard({ r }: { r: Review }) {
  return (
    <div style={{ background: LQ_BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: LQ_BOR, borderRadius: 16, boxShadow: LQ_SHAD, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.5) 0%,transparent 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#A07840)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{r.author.charAt(0)}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{r.author}</div>
              <div style={{ fontSize: 12, color: TEXT_MUT }}>{r.date}</div>
            </div>
          </div>
          <Stars rating={r.rating} size={13} />
        </div>
        <p style={{ fontSize: 14, color: TEXT_SEC, lineHeight: 1.75, margin: '0 0 8px' }}>{r.text}</p>
        <div style={{ fontSize: 12, color: GOLD, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          {r.product}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function SellerDetailPage({ params }: { params: { id: string } }) {
  const id       = params?.id ?? '1'
  const seller   = SELLERS[id] ?? SELLERS['1']!
  const yearsActive = 1403 - seller.sinceYear

  const [activeCat, setActiveCat] = useState('همه')

  const allCats = ['همه', ...Array.from(new Set(seller.products.map(p => p.category)))]
  const filteredProds = activeCat === 'همه' ? seller.products : seller.products.filter(p => p.category === activeCat)

  const waLink = `https://wa.me/${seller.whatsapp}?text=${encodeURIComponent(`سلام، از طریق بیلیارد هاب با فروشگاه ${seller.name} تماس می‌گیرم`)}`

  const ratingDist = [5,4,3,2,1].map(star => ({
    star,
    pct: star === 5 ? 68 : star === 4 ? 21 : star === 3 ? 7 : star === 2 ? 3 : 1
  }))

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; }
        .p-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        @media(max-width:900px)  { .p-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media(max-width:600px)  { .p-grid { grid-template-columns: repeat(2,1fr) !important; } }
        .cat-scroll::-webkit-scrollbar { display: none; }
        .chip-btn { transition: all 0.18s; font-family: Vazirmatn,Tahoma,sans-serif; }
        .chip-btn:hover { opacity: 0.86; }
      `}</style>

      <div style={{ background: '#F7F7F5', minHeight: '100vh', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT }}>

        {/* ─────── HERO BANNER ─────── */}
        <div style={{ position: 'relative', height: 'clamp(240px,32vw,380px)', overflow: 'hidden' }}>
          <img src={seller.bannerImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.48) saturate(0.7)', transform: 'scale(1.04)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,8,5,0.30) 0%, rgba(5,4,2,0.82) 100%)' }} />

          {/* back button */}
          <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
            <Link href="/sellers" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.85)', textDecoration: 'none', padding: '7px 14px', borderRadius: 24, background: 'rgba(0,0,0,0.36)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.52)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.36)')}>
              <ChevronLeft size={14} />
              بازگشت به فروشندگان
            </Link>
          </div>

          {/* elite badge on banner */}
          {seller.elite && (
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(199,166,106,0.92)', backdropFilter: 'blur(8px)', color: '#3a2800', fontSize: 12, fontWeight: 800, borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              نماینده رسمی
            </div>
          )}
        </div>

        {/* ─────── PROFILE CARD ─────── */}
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)' }}>
          <div style={{ marginTop: -70, position: 'relative', zIndex: 20, background: LQ_BG, backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)', border: LQ_BOR, borderRadius: 24, boxShadow: LQ_SHAD, padding: 'clamp(18px,3vw,28px)', marginBottom: 24, animation: 'fadeUp 0.4s ease both', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.60) 0%,transparent 100%)', borderRadius: '24px 24px 0 0', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 'clamp(14px,2vw,24px)', flexWrap: 'wrap', alignItems: 'flex-start' }}>

              {/* avatar */}
              <div style={{ border: '3px solid #fff', borderRadius: '50%', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                <SellerAvatar name={seller.name} size={72} />
              </div>

              {/* info */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <h1 style={{ fontSize: 'clamp(18px,2.8vw,26px)', fontWeight: 900, color: TEXT, margin: 0 }}>{seller.name}</h1>
                  {seller.verified && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.30)', color: GOLD, fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '3px 10px' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      تأیید شده
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13.5, color: TEXT_SEC, margin: '0 0 10px', lineHeight: 1.6 }}>{seller.tagline}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13.5, color: TEXT_SEC, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {seller.city}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    از {seller.since}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stars rating={seller.rating} size={13} />
                    <b style={{ color: TEXT }}>{seller.rating}</b>
                    <span style={{ color: TEXT_MUT }}>({toFa(seller.reviewCount)} نظر)</span>
                  </span>
                </div>
              </div>

              {/* action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignSelf: 'center' }}>
                <a href={`tel:${seller.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 12, background: `linear-gradient(135deg,${GOLD},#A07840)`, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(199,166,106,0.35)', whiteSpace: 'nowrap' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  تماس مستقیم
                </a>
                <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 12, background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(37,211,102,0.28)', whiteSpace: 'nowrap' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  پیام واتساپ
                </a>
              </div>
            </div>
          </div>

          {/* ─────── QUICK STATS ─────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }} className="stats-row">
            <style>{`@media(max-width:600px){.stats-row{grid-template-columns:repeat(2,1fr)!important}}`}</style>
            {[
              { n: toFa(seller.productCount), label: 'محصول', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
              { n: toFa(seller.rating) + '/۵', label: 'امتیاز', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
              { n: toFa(seller.reviewCount), label: 'نظر مشتریان', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
              { n: toFa(yearsActive), label: 'سال فعالیت', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            ].map((s, i) => (
              <div key={i} style={{ background: LQ_BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: LQ_BOR, borderRadius: 16, boxShadow: LQ_SHAD, padding: 'clamp(14px,2vw,20px) 12px', textAlign: 'center', position: 'relative', overflow: 'hidden', animation: `fadeUp ${0.3 + i * 0.07}s ease both` }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
                <div style={{ color: GOLD, display: 'flex', justifyContent: 'center', marginBottom: 8, position: 'relative', zIndex: 1 }}>{s.icon}</div>
                <div style={{ fontSize: 'clamp(20px,2.8vw,28px)', fontWeight: 900, color: TEXT, lineHeight: 1, marginBottom: 5, position: 'relative', zIndex: 1 }}>{s.n}</div>
                <div style={{ fontSize: 12.5, color: TEXT_SEC, position: 'relative', zIndex: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ─────── ABOUT + BRANDS + CONTACT ─────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }} className="info-grid">
            <style>{`@media(max-width:860px){.info-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:560px){.info-grid{grid-template-columns:1fr!important}}`}</style>

            {/* about */}
            <div style={{ background: LQ_BG, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '22px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.45s ease both' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                <span style={{ width: 3, height: 16, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, display: 'inline-block' }}/>
                درباره فروشگاه
              </h3>
              <p style={{ fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.8, margin: 0, position: 'relative', zIndex: 1 }}>{seller.about}</p>
            </div>

            {/* brands + specialties */}
            <div style={{ background: LQ_BG, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '22px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.5s ease both' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                <span style={{ width: 3, height: 16, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, display: 'inline-block' }}/>
                برندها و تخصص‌ها
              </h3>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: 12, color: TEXT_MUT, fontWeight: 600, marginBottom: 8, marginTop: 0 }}>برندهای نمایندگی:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {seller.brands.map(b => (
                    <span key={b} style={{ fontSize: 12, fontWeight: 700, color: GOLD, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.25)', borderRadius: 20, padding: '3px 10px' }}>{b}</span>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: TEXT_MUT, fontWeight: 600, marginBottom: 8, marginTop: 0 }}>تخصص‌ها:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {seller.specialties.map(s => (
                    <span key={s} style={{ fontSize: 12, fontWeight: 600, color: TEXT_SEC, background: 'rgba(28,28,26,0.06)', border: '1px solid rgba(28,28,26,0.10)', borderRadius: 20, padding: '3px 10px' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* contact info */}
            <div style={{ background: LQ_BG, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '22px', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.55s ease both' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                <span style={{ width: 3, height: 16, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, display: 'inline-block' }}/>
                اطلاعات تماس
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
                {[
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, text: seller.address },
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, text: seller.workHours },
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, text: seller.phone, href: `tel:${seller.phone}` },
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>, text: `واتساپ: @${seller.instagram}`, href: waLink, isWa: true },
                  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round"/></svg>, text: `@${seller.instagram}`, isInsta: true },
                ].map((item, i) => (
                  item.href ? (
                    <a key={i} href={item.href} target={item.isWa ? '_blank' : undefined} rel={item.isWa ? 'noopener noreferrer' : undefined} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textDecoration: 'none', color: TEXT_SEC, fontSize: 13, lineHeight: 1.55, transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={e => (e.currentTarget.style.color = TEXT_SEC)}>
                      <span style={{ color: GOLD, marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                      {item.text}
                    </a>
                  ) : (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: TEXT_SEC, lineHeight: 1.55 }}>
                      <span style={{ color: GOLD, marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                      {item.text}
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* ─────── PRODUCTS ─────── */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: TEXT, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 3, height: 18, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, display: 'inline-block' }}/>
                محصولات فروشگاه
                <span style={{ fontSize: 13, fontWeight: 400, color: TEXT_MUT }}>({toFa(seller.products.length)} محصول)</span>
              </h2>
            </div>

            {/* category filter */}
            <div className="cat-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 18 }}>
              {allCats.map(cat => (
                <button key={cat} className="chip-btn" onClick={() => setActiveCat(cat)} style={{
                  padding: '7px 16px', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                  background: activeCat === cat ? `linear-gradient(135deg,${GOLD},#A07840)` : 'rgba(255,255,255,0.85)',
                  color: activeCat === cat ? '#fff' : TEXT_SEC,
                  boxShadow: activeCat === cat ? '0 3px 10px rgba(199,166,106,0.28)' : '0 1px 4px rgba(0,0,0,0.07)',
                  border: activeCat === cat ? 'none' : '1px solid rgba(28,28,26,0.10)',
                }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* product grid */}
            <div className="p-grid">
              {filteredProds.map((p, i) => (
                <div key={p.id} style={{ animation: `fadeUp ${0.25 + i * 0.05}s ease both` }}>
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </div>

          {/* ─────── REVIEWS ─────── */}
          <div style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: TEXT, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 3, height: 18, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, display: 'inline-block' }}/>
              نظرات مشتریان
              <span style={{ fontSize: 13, fontWeight: 400, color: TEXT_MUT }}>({toFa(seller.reviewCount)} نظر)</span>
            </h2>

            {/* rating summary */}
            <div style={{ background: LQ_BG, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: LQ_BOR, borderRadius: 20, boxShadow: LQ_SHAD, padding: '22px 24px', marginBottom: 20, display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
              <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, minWidth: 80 }}>
                <div style={{ fontSize: 'clamp(40px,6vw,56px)', fontWeight: 900, color: '#f59e0b', lineHeight: 1, marginBottom: 6 }}>{seller.rating}</div>
                <Stars rating={seller.rating} size={15} />
                <div style={{ fontSize: 13, color: TEXT_MUT, marginTop: 5 }}>{toFa(seller.reviewCount)} نظر</div>
              </div>
              <div style={{ flex: 1, minWidth: 160, position: 'relative', zIndex: 1 }}>
                {ratingDist.map(({ star, pct }) => (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 12.5, color: TEXT_MUT, width: 6, textAlign: 'center' }}>{toFa(star)}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <div style={{ flex: 1, height: 7, background: 'rgba(28,28,26,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', width: `${pct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: 12, color: TEXT_MUT, width: 26, textAlign: 'left' }}>{toFa(pct)}٪</span>
                  </div>
                ))}
              </div>
            </div>

            {/* review cards */}
            {seller.reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: TEXT_MUT }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: TEXT_SEC }}>هنوز نظری ثبت نشده</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: 14 }}>
                {seller.reviews.map((r, i) => (
                  <div key={r.id} style={{ animation: `fadeUp ${0.3 + i * 0.07}s ease both` }}>
                    <ReviewCard r={r} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
