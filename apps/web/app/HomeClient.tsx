'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

/* ── شکستنِ صفحه‌ی اصلی به چانک‌های جدا ──

   این فایل کلِ صفحه‌ی اصلی بود: یک باندلِ واحد که مرورگر باید تمامش
   را می‌خواند و hydrate می‌کرد پیش از آنکه صفحه به کلیک جواب بدهد.
   اندازه‌گیری نشان داد گلوگاه همین است، نه حجمِ دارایی‌ها — LCP روی
   سرورِ محلی ۲۵۴۴ms بود و روی سایتِ زنده ۵۹۷۲ms، با همان بیلد.

   سکشن‌هایی که زیرِ خطِ اول‌اند چانکِ خودشان را می‌گیرند. `ssr` روشن
   می‌ماند تا محتوا در HTML اولیه باشد (هم برای خزنده، هم تا صفحه
   هنگام اسکرول نپرد)؛ چیزی که جدا می‌شود بارِ *اجرای* جاوااسکریپت
   است، نه خودِ محتوا. */
/* `ssr: false` روی این یکی عمدی است.

   با SSR روشن، چانکِ جدا باز هم در همان پاسِ اولِ hydration خوانده و
   اجرا می‌شود؛ فقط فایلش جداست، نه کارش. اندازه‌گیری همین را نشان
   داد: TBT از ۲۰۹۳ به ۱۹۸۸ رفت — تغییری در حدِ نوسان.

   این نوار تزئینی است (پوسترِ ویدیوی مدیا)، نه محتوایی که خزنده باید
   ببیند یا کاربر بلافاصله لازم دارد. پس کلاً از پاسِ اول بیرون
   می‌رود و بعد از آرام‌شدنِ مرورگر سوار می‌شود. */
const HomeMediaBand = dynamic(() => import('../components/home/HomeMediaBand'), { ssr: false });
const BannerSlider = dynamic(() => import('../components/home/BannerSlider'), { ssr: false });
const BANNER_SLIDER_HEIGHT = 320;
import {
  Search, ChevronDown, ArrowLeft, ArrowRight,
  MapPin, Star, Heart, Trophy, Users,
  ShoppingBag, Building2, Wrench, GraduationCap,
  Clock, Eye, CheckCircle, X, Calendar,
  Hammer, Scissors, Settings, Truck, Radio, Scale, Play, Clapperboard,
} from 'lucide-react';
import AdSlot, { usePlacementState, type EntitySnapshot, type PlacementKey, type PlacementState } from '../components/ads/AdSlot';
import { useHorizontalScroll, scrollSign, getPos, setPos } from '../lib/useHorizontalScroll';
import { MEDIA_VIDEOS, compactViews } from '../lib/media-data';
import { getHiddenVideoIds, getFeaturedOverride } from '../lib/media-admin-store';
import { sharedJson } from '../lib/shared-fetch';
import { useDeferredStart } from '../lib/useDeferredStart';
import { modernizeType } from '../lib/market/title';
import ProductTitle from '../components/market/ProductTitle';
import { CardMeta, CardPrice } from '../components/market/CardFacts';
import { thumbUrl } from '../lib/media/thumb';

/* ── عرضِ واقعیِ کادرها ──
   عددها از اندازه‌ی نمایشِ همین کارت‌ها می‌آیند و دو برابر شده‌اند
   برای صفحه‌های با چگالیِ بالا. پیش از این، تصویرِ خامِ آپلودشده
   (تا ۲٫۳ مگابایت) در کادرِ ۳۲۰ پیکسلی نمایش داده می‌شد. */
const CLUB_W = 640;   // کارتِ باشگاه ~۳۲۰px
const PROD_W = 420;   // کارتِ محصول ~۲۱۰px
const LOGO_W = 160;   // لوگوی فروشگاه ~۸۰px

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════════════════ */
/* `useLayoutEffect` روی سرور هشدار می‌دهد و آن‌جا هم بی‌معنی است،
   چون چیدمانی برای اندازه‌گیری وجود ندارد. این نسخه‌ی امنِ رایج است. */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function SR({
  children, delay = 0, direction = 'up',
}: {
  children: React.ReactNode; delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
}) {
  const ref = useRef<HTMLDivElement>(null);

  /* ⚠️ مقدار اولیه **مرئی** است، نه نامرئی.
     ─────────────────────────────────────────────────────────────
     پیش‌تر این‌جا `useState(false)` بود، یعنی هر بخشِ صفحه با
     `opacity: 0` روی سرور رندر می‌شد و فقط بعد از اجرای جاوااسکریپت
     و فعال‌شدنِ IntersectionObserver دیده می‌شد.

     اندازه‌گیری (scripts/perf-audit.mjs، موبایل + 4G کند):
       زمان      ۲۰۰   ۶۰۰  ۱۰۰۰  ۱۵۰۰  ۲۰۰۰  ۳۰۰۰
       دیده‌شده   ۱۱    ۱۱    ۱۱    ۱۱    ۱۱    ۲۷
       کدورتِ ۰   ۱۹    ۱۹    ۱۹    ۱۹    ۱۹     ۳

     یعنی ۱۹ عنصرِ داخلِ قابِ دید — دانلودشده و آماده — نزدیک به سه
     ثانیه نامرئی می‌ماندند و بعد یک‌باره ظاهر می‌شدند. همان چیزی که
     کاربر «سکته» و «محتوا می‌آید و می‌رود» می‌نامید. LCP هم عملاً
     منتظرِ hydration می‌ماند.

     حالا برعکس شد: همه مرئی رندر می‌شوند و فقط آن‌هایی که **پایینِ
     قابِ دید** هستند، پیش از نخستین رنگ‌آمیزی پنهان می‌شوند تا موقعِ
     اسکرول انیمیشن بخورند. انیمیشن حذف نشده — فقط دیگر روی محتوایی
     که کاربر همان لحظه می‌بیند اعمال نمی‌شود.

     `useLayoutEffect` لازم است نه `useEffect`: تصمیم باید *پیش از*
     رنگ‌آمیزی گرفته شود، وگرنه بخش‌های پایینی یک فریم دیده می‌شوند و
     بعد پنهان — یعنی همان پرش، این‌بار برعکس. */
  const [v, setV] = useState(true);
  const armed = useRef(false);

  useIsoLayoutEffect(() => {
    const el = ref.current; if (!el || armed.current) return;
    armed.current = true;

    /* کاربری که حرکت را کم کرده، هیچ‌وقت پنهان نمی‌بیند */
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const r = el.getBoundingClientRect();
    /* داخلِ قابِ دید یا بالاترش ⇒ دست‌نخورده و مرئی می‌ماند */
    if (r.top < window.innerHeight * 0.92) return;

    setV(false);
    const ob = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) { setV(true); ob.disconnect(); } },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const from = {
    up: 'translateY(26px)', left: 'translateX(-26px)',
    right: 'translateX(26px)', none: 'none',
  }[direction];
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0, transform: v ? 'none' : from,
      transition: `opacity 0.85s ${delay}ms cubic-bezier(0.22,1,0.36,1), transform 0.85s ${delay}ms cubic-bezier(0.22,1,0.36,1)`,
      /* فقط وقتی قرار است حرکت کند به مرورگر لایه بدهیم؛ `will-change`
         دائمی متن را روی همه‌ی بخش‌ها کدر می‌کند و حافظه‌ی GPU می‌گیرد */
      willChange: v ? undefined : 'opacity, transform',
    }}>{children}</div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOKENS
═══════════════════════════════════════════════════════════════ */
const GOLD     = '#C7A66A';
const GOLD_D   = '#A07840';
/* رنگ متن دکمه‌های طلایی. GOLD_D روی پس‌زمینه‌ی rgba(199,166,106,0.12)
   فقط ۳٫۵۵:۱ می‌داد که زیر حد ۴٫۵:۱ است؛ این یکی ۴٫۹۵:۱ می‌دهد.
   حدس زدن جواب نداد — محاسبه شد. */
const CTA_INK  = '#8A6020';
const GOLD_DIM = 'rgba(199,166,106,0.60)';
const GOLD_BOR = 'rgba(199,166,106,0.22)';

/* لرزش کوتاه هنگام تعویض کارت.

   مرورگر `navigator.vibrate` را پیش از اولین لمس کاربر مسدود می‌کند و
   هر بار یک خطا در کنسول می‌گذارد — همان چیزی که نمره‌ی Best Practices
   را پایین نگه داشته بود. این کمکی تا وقتی کاربر واقعاً چیزی لمس نکرده
   اصلاً صدایش نمی‌زند. */
let userTapped = false;
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => { userTapped = true; }, { once: true, passive: true });
}
function vibrate(ms = 8) {
  if (!userTapped) return;
  try { navigator.vibrate?.(ms); } catch { /* دستگاهی که پشتیبانی نمی‌کند */ }
}
const TEXT     = '#1A1917';
const TEXT_M   = 'rgba(26,25,23,0.28)';
const BORDER   = 'rgba(26,25,23,0.07)';
const GRN = '#1E6641';
const BRN = '#6B3A1F';
const BLU = '#1A4A7A';
const PRP = '#4A2D8A';

/* ═══════════════════════════════════════════════════════════════
   IMAGES
═══════════════════════════════════════════════════════════════ */
const IMG = {
  // Hero wallpapers — now in /images/clubs/
  wall1: '/images/clubs/wallpaper1.webp',
  wall2: '/images/clubs/wallpaper2.jpeg',
  wall3: '/images/clubs/wallpaper3.webp',
  wall4:  '/images/clubs/wallpaper4.webp',
  wall5:  '/images/clubs/wallpaper5.webp',
  wall12: '/images/clubs/wallpaper12.webp',
  wall6: '/images/clubs/wallpaper12.webp',
  wall7: '/images/clubs/wallpaper21.jpg',

  // Real club photos — filenames match current /public/images/clubs/
  club1: '/images/clubs/club6.jpeg',
  club2: '/images/clubs/club7.jpeg',
  club3: '/images/clubs/club8.jpg',
  club4: '/images/clubs/club9.jpeg',
  club5: '/images/clubs/club5.jpeg',
  club6: '/images/clubs/club4.png',
  clubA: '/images/clubs/club1.png',
  clubB: '/images/clubs/club2.jpg',
  clubC: '/images/clubs/billiadr-club-3.jpg',

  // Equipment / shop
  table:    '/images/shop/Home_table.webp',
  proTable: '/images/shop/Pro_table.webp',
  snooker:  '/images/shop/snooker-table.webp',
  snooker2: '/images/shop/snooker-table-2.webp',
  cue:      '/images/shop/cue_billiard.webp',
  cue2:     '/images/shop/cue_billiard_2.webp',
  ball:     '/images/shop/Ball-1.webp',
  chalk:    '/images/shop/pool_chalk_1.jpg',
  rest:     '/images/shop/rest-pool-2.webp',

  // Education / learn
  learn1: '/images/learn/learn1.webp',
  learn2: '/images/learn/learn.png',

  // Background
  bg1: '/images/background/8_Ball_Pool.jpg',
  bg2: '/images/background/billiadr-club-5.jpg',

  // Services
  svc3: '/images/services/IMG_0963.png',

  // Stores
  store1: '/images/stores/IMG_0974.png',
  store2: '/images/stores/IMG_0975.png',

  // Manufactures
  mfr2: '/images/manufactures/IMG_0966.png',
};

/* ═══════════════════════════════════════════════════════════════
   HERO SLIDES — all 5 wallpapers, each with an accent colour
═══════════════════════════════════════════════════════════════ */
const HERO_SLIDES = [
  { bg: '/images/hero/1.webp',   accent: GRN,  label: 'باشگاه‌ها' },
  /* اسلاید دوم عوض شد و پسوندش هم از png به jpg تغییر کرد؛ مسیر قبلی
     دیگر وجود نداشت و ۴۰۴ می‌داد. */
  /* ?v=2 — تصویر با همان نام عوض شد. چون تصاویر یک هفته کش می‌شوند،
     بدون این پارامتر مرورگر بازدیدکننده‌های قبلی تا هفته‌ی بعد نسخه‌ی
     قدیمی را نشان می‌داد. هر بار که این فایل عوض شد، عدد را جلو ببرید. */
  { bg: '/images/hero/2.webp?v=2', accent: GOLD, label: 'تجهیزات'   },
  { bg: '/images/hero/3.webp',   accent: BLU,  label: 'مربیان'    },
  /* ?v=2 — فایل هم‌نام عوض شده؛ بدون ورژن، کش CDN/مرورگر عکس قبلی را می‌داد */
  { bg: '/images/hero/4.webp', accent: BRN, label: 'رقابت' },
];

const FEATURE_CARDS = [
  { Icon: Calendar,    title: 'رزرو میز',          caption: 'جستجو و رزرو آنلاین میز در بهترین باشگاهها',          href: '/clubs',         clr: '#4A9EFF', rgb: '74,158,255'   },
  { Icon: Trophy,      title: 'مسابقات',            caption: 'شرکت در مسابقات و مشاهده نتایج زنده',                 href: '/tournaments',   clr: '#30C55A', rgb: '48,197,90'    },
  { Icon: ShoppingBag, title: 'خرید و فروش',        caption: 'خرید و فروش انواع تجهیزات بیلیارد',                   href: '/shop',          clr: '#B97BFF', rgb: '185,123,255'  },
  { Icon: Users,       title: 'جامعه بیلیارد',      caption: 'ارتباط با همه‌ی صنوف بیلیاردی و اشتراک تجربه‌ها',   href: '/players',       clr: '#FF6B9D', rgb: '255,107,157'  },
  { Icon: Building2,   title: 'تولیدکنندگان',       caption: 'معرفی بهترین تولیدکنندگان تجهیزات',                   href: '/manufacturers', clr: '#06b6d4', rgb: '6,182,212'    },
  { Icon: Wrench,         title: 'خدمات فنی',    caption: 'خدمات نصب و تعمیر تجهیزات بیلیارد',                      href: '/services', clr: '#C7A66A', rgb: '199,166,106' },
  { Icon: GraduationCap, title: 'آموزش',         caption: 'آموزش آکادمیک با برترین مربیان و بالاترین سطح',            href: '/coaches',  clr: '#F472B6', rgb: '244,114,182' },
];

const TRUST_ITEMS = [
  { Icon: Users,       label: 'جامعه فعال',       sub: 'در حال رشد',          clr: '#B97BFF', rgb: '185,123,255' },
  { Icon: CheckCircle, label: 'پرداخت امن',        sub: 'سریع و مطمئن',        clr: '#4A9EFF', rgb: '74,158,255'  },
  { Icon: Clock,       label: 'پشتیبانی ۲۴/۷',   sub: 'همیشه در کنار شما',   clr: '#30C55A', rgb: '48,197,90'   },
  { Icon: Star,        label: 'تجربه‌ای متفاوت',  sub: 'برای عاشقان بیلیارد', clr: '#C7A66A', rgb: '199,166,106' },
];

/* ═══════════════════════════════════════════════════════════════
   DISCOVER TABS + FILTER DATA
═══════════════════════════════════════════════════════════════ */
const DISCOVER_TABS = [
  { id: 'clubs',  fa: 'باشگاه',   ph: 'شهر، محله یا نام باشگاه...', href: '/clubs'   },
  { id: 'coach',  fa: 'مربی',     ph: 'نام مربی یا تخصص بازی...',   href: '/coaches' },
  { id: 'equip',  fa: 'تجهیزات',  ph: 'چوب، توپ، میز یا برند...',   href: '/shop'    },
  { id: 'player', fa: 'بازیکنان', ph: 'نام یا شهر بازیکن...',        href: '/players' },
];

const FILTER_DATA: Record<string, { label: string; opts: string[] }[]> = {
  clubs: [
    { label: 'نوع',    opts: ['اسنوکر', 'پاکت', 'هی‌بال', 'کوشن', 'کارامبول'] },
    { label: 'شهر',    opts: ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز', 'کرج', 'اهواز'] },
    { label: 'امتیاز', opts: ['۴★ به بالا', '۴.۵★ به بالا', '۵★'] },
  ],
  coach: [
    { label: 'تخصص', opts: ['اسنوکر', 'پاکت', 'هی‌بال', 'همه رشته‌ها'] },
    { label: 'شهر',  opts: ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز', 'کرج'] },
  ],
  equip: [
    { label: 'نوع',  opts: ['چوب', 'توپ', 'میز', 'گچ', 'کیف', 'سایر'] },
    { label: 'برند', opts: ['Predator', 'Aramith', 'Longoni', 'Master', 'Riley'] },
  ],
  player: [
    { label: 'رشته', opts: ['اسنوکر', 'پاکت', 'هی‌بال', 'کارامبول'] },
    { label: 'شهر',  opts: ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز'] },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   CONTENT DATA
═══════════════════════════════════════════════════════════════ */
/* باشگاه‌های پیشنهادی صفحه‌ی اصلی */
const FEATURED_COUNT = 8

/* شکل داده‌ای که کارت‌های صفحه‌ی اصلی انتظار دارند. سه آرایه‌ی
   هاردکد (باشگاه‌ها، محصولات، فروشگاه‌ها) که این‌جا بودند حذف شدند:
   هیچ‌کدام وجود خارجی نداشتند و کلیکشان به هیچ‌جا نمی‌رسید. حالا از
   /api/clubs، /api/products و /api/sellers پر می‌شوند. */
/* تایپ‌ها در `lib/home-types.ts` زندگی می‌کنند تا `lib/home-featured.ts`
   (که روی سرور اجرا می‌شود) بتواند بدون کشیدن این فایل 'use client'
   به گراف سرور از آن‌ها استفاده کند. */
export type { RealClub, RealProduct, RealStore } from '../lib/home-types';
import type { RealClub, RealProduct, RealStore } from '../lib/home-types';

/* پاسخ خام APIها */
interface ApiClub {
  id: string; name: string; city?: string; images?: string[]; hasActiveStory?: boolean
  snookerTables?: number; pocketTables?: number; highballTables?: number
  vipSnookerTables?: number; vipPocketTables?: number
}
interface ApiProduct {
  id: string; title: string; brand?: string | null; category?: string | null
  images?: string[]; price?: number; negotiable?: boolean
  discountPrice?: number | null; discountPercent?: number | null
  city?: string | null; condition?: string | null
}
interface ApiStore {
  id: string; firstName?: string; lastName?: string; avatar?: string
  sellerProfile?: { storeName?: string; city?: string; logo?: string; specialty?: string } | null
}

/* وقتی باشگاه واقعی عکس ندارد — تصویر عمومی بیلیارد، نه عکس باشگاه
   دیگری که القا کند مال همین باشگاه است */
const CLUB_IMG_FALLBACK = [IMG.club1, IMG.club2, IMG.club3, IMG.club4, IMG.club5, IMG.club6];

/* SERVICES_LIST به components/home/ServicesSection.tsx منتقل شد */

const BANNER_SLIDES = [
  { img:IMG.wall1,  title:'بزرگترین پلتفرم بیلیارد ایران', sub:'بهترین باشگاه‌ها را کشف و رزرو کن',  link:'/clubs',       cta:'رزرو میز',       accent:GRN  },
  { img:IMG.wall3,  title:'مسابقات سراسری بیلیارد ۱۴۰۴',  sub:'ثبت‌نام و شرکت در رقابت‌های ملی',   link:'/tournaments', cta:'ثبت‌نام',        accent:BLU  },
  { img:IMG.wall4,  title:'آکادمی آموزش بیلیارد هاب',     sub:'با بهترین مربیان یاد بگیر',           link:'/coaches',     cta:'شروع یادگیری',  accent:PRP  },
  { img:IMG.wall5,  title:'تخفیف ویژه تجهیزات تابستان',   sub:'تا ۳۰٪ تخفیف روی محصولات برند اصل', link:'/shop',        cta:'خرید کن',        accent:GOLD },
  { img:IMG.wall12, title:'خدمات فنی تخصصی در محل',       sub:'نصب، تعمیر و سرویس حرفه‌ای میزها',   link:'/services',    cta:'درخواست خدمت',  accent:BRN  },
];


const NEWS = [
  { id:'1', title:'برگزاری اولین مسابقات بین‌المللی بیلیارد در تهران', date:'۵ خرداد', views:2341, cat:'مسابقات', clr:'#1A6641', img:IMG.snooker2 },
  { id:'2', title:'معرفی جدیدترین میزهای اسنوکر وارداتی',              date:'۳ خرداد', views:1876, cat:'تجهیزات', clr:BLU,       img:IMG.cue2    },
  { id:'3', title:'آکادمی بیلیارد هاب؛ آموزش آنلاین',                   date:'۱ خرداد', views:3102, cat:'آموزش',   clr:PRP,       img:IMG.proTable },
];

/* ═══════════════════════════════════════════════════════════════
   CLUB CARD
═══════════════════════════════════════════════════════════════ */
function ClubCard({ club, h = '360px', featured = false }: { club: RealClub; h?: string; featured?: boolean }) {
  const [hov, setHov]       = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  /* تفکیک میزها فقط از عدد اعلام‌شده‌ی خود باشگاه.

     پیش‌تر اگر تفکیک نبود، از روی جمع کل یک تقسیم تقریبی می‌ساخت
     (۵۰٪ اسنوکر، ۳۰٪ پاکت، بقیه هی‌بال). برای کارت‌های نمونه بی‌ضرر
     بود، ولی حالا که همه‌ی باشگاه‌ها واقعی‌اند یعنی به بازدیدکننده
     عددی گفته می‌شود که باشگاه هیچ‌وقت اعلامش نکرده. */
  const brk = club.breakdown;
  const snookerTables = brk?.snooker ?? 0;
  const pocketTables  = brk?.pocket  ?? 0;
  const hiballTables  = brk?.highball ?? 0;
  const rad = featured ? '16px' : '12px';

  return (
    <div style={{ position: 'relative' }}>
      <Link href={`/clubs/${club.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          className="club-card-x"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            borderRadius: rad,
            overflow: 'hidden',
            height: h,
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column',
            position: 'relative',
            border: '1px solid rgba(0,0,0,0.22)',
            transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), box-shadow 0.5s ease',
            transform: hov ? 'translateY(-8px) scale(1.015)' : 'none',
            boxShadow: hov
              ? '0 10px 22px rgba(0,0,0,0.11), 0 3px 8px rgba(0,0,0,0.06)'
              : '0 4px 16px rgba(0,0,0,0.09)',
            willChange: 'transform',
          }}
        >
          {/* ── Image: top 60% ── */}
          <div className="club-img-x" style={{ flex: '0 0 60%', position: 'relative', overflow: 'hidden', borderRadius: `${rad} ${rad} 0 0` }}>
            <img loading="lazy" decoding="async" src={club.img} alt={club.name}
              onError={e => { const el = e.target as HTMLImageElement; el.onerror = null; el.src = '/images/clubs/club3.jpg'; }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                filter: hov ? 'brightness(0.65) saturate(0.82)' : 'brightness(0.82) saturate(0.88)',
                transition: 'filter 0.7s ease, transform 0.8s cubic-bezier(0.4,0,0.2,1)',
                transform: hov ? 'scale(1.07)' : 'scale(1.01)' }} />
            <img loading="lazy" decoding="async" src={club.img2} alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                opacity: hov ? 1 : 0, filter: 'brightness(0.65) saturate(0.82)',
                transition: 'opacity 0.85s ease, transform 0.8s cubic-bezier(0.4,0,0.2,1)',
                transform: hov ? 'scale(1.07)' : 'scale(1.01)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
              background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.28))',
              pointerEvents: 'none', zIndex: 1 }} />
            {/* باز/بسته badge */}
            <button className="club-open-btn"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setIsOpen(s => !s); }}
              style={{ position: 'absolute', top: '8px', left: '8px', height: '24px', borderRadius: '20px',
                background: isOpen ? 'rgba(48,197,90,0.08)' : 'rgba(239,68,68,0.08)',
                backdropFilter: 'blur(16px) saturate(200%)',
                WebkitBackdropFilter: 'blur(16px) saturate(200%)',
                border: isOpen ? '1px solid rgba(48,197,90,0.32)' : '1px solid rgba(239,68,68,0.32)',
                boxShadow: isOpen
                  ? 'inset 0 1px 0 rgba(48,197,90,0.28), 0 3px 10px rgba(0,0,0,0.22)'
                  : 'inset 0 1px 0 rgba(239,68,68,0.28), 0 3px 10px rgba(0,0,0,0.22)',
                alignItems: 'center', justifyContent: 'center', gap: '5px',
                cursor: 'pointer', zIndex: 3, padding: '0 9px 0 7px' }}>
              <span className="open-dot" style={{
                width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: isOpen ? '#30C55A' : '#ef4444',
                boxShadow: isOpen ? '0 0 5px rgba(48,197,90,0.8)' : '0 0 5px rgba(239,68,68,0.8)',
              }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: isOpen ? '#30C55A' : '#ef4444', letterSpacing: '0.01em' }}>
                {isOpen ? 'باز' : 'بسته'}
              </span>
            </button>
          </div>

          {/* ── Desktop info panel ── */}
          <div className="club-desk-panel" style={{
            flex: '0 0 40%', background: '#fff',
            borderRadius: `0 0 ${rad} ${rad}`,
            padding: '14px 15px 13px',
            flexDirection: 'column', justifyContent: 'flex-start',
            overflow: 'hidden', gap: '3px',
          }}>
            <div style={{ fontSize: featured ? '17px' : '14px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{club.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(0,0,0,0.40)', fontSize: '12px' }}>
                <MapPin size={10} style={{ color: GOLD }} />{club.city}{club.dist ? `، ${club.dist}` : ''}
              </span>
              {/* امتیاز فقط وقتی واقعاً داریمش — صفر یعنی «هنوز نظری نیست» */}
              {club.rating > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Star size={10} style={{ color: '#F5A623', fill: '#F5A623' }} />
                  <span style={{ color: '#1a1a1a', fontSize: '13px', fontWeight: 500 }}>{club.rating}</span>
                  <span style={{ color: 'rgba(0,0,0,0.26)', fontSize: '11px' }}>({club.reviews})</span>
                </span>
              )}
            </div>
            {club.tables > 0 && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
              {[
                { label: 'اسنوکر', n: snookerTables, clr: '#1B7A38' },
                { label: 'پاکت',   n: pocketTables,  clr: '#1D4ED8' },
                { label: 'هی‌بال', n: hiballTables,  clr: '#6D28D9' },
              ].map(t => (
                <span key={t.label} style={{ fontSize: '11px', fontWeight: 600, color: t.clr,
                  background: `${t.clr}14`, border: `1px solid ${t.clr}28`,
                  borderRadius: '20px', padding: '2px 8px' }}>{t.n} {t.label}</span>
              ))}
            </div>
            )}
            <div style={{ flex: 1 }} />
            <div style={{ height: '1px', background: 'linear-gradient(to left, transparent, rgba(199,166,106,0.35), transparent)', margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {/* هاور با CSS انجام می‌شود، نه با state `hov`.
                  دو سود: استایل تکراری از HTML بیرون می‌رود، و هر
                  ورود/خروج ماوس دیگر یک رندر React راه نمی‌اندازد. */}
              <div className="cta-lq" style={{ borderRadius: rad }}>
                مشاهده و رزرو
              </div>
            </div>
          </div>

          {/* ── Mobile info panel ── */}
          <div className="club-mob-panel" style={{
            flex: '0 0 40%', background: '#fff',
            borderRadius: `0 0 ${rad} ${rad}`,
            /* پدینگ پایین ۲۰px.
               کامنت قبلی اینجا وارونه بود: چون spacer `flex:1` دکمه را
               به کف پنل می‌چسباند، *کم‌کردن* پدینگ دکمه را پایین‌تر
               می‌برد نه بالاتر. پدینگ ۲۴→۱۶→۱۰ کم شده بود و دکمه هر بار
               به کف نزدیک‌تر می‌شد. حالا زیادش می‌کنیم تا واقعاً بالا
               بیاید و کف کارت نفس بکشد. */
            padding: '19px 7px 12px',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            /* gap ۹ → ۶: اندازه‌گیری نشان داد مجموع محتوا دقیقاً ۱۲px از
               پنل بلندتر بود، پس spacer `flex:1` صفر می‌شد و پدینگ
               پایین بلعیده می‌شد — دکمه فقط ۴px از کف فاصله داشت.
               چهار gap × ۳px همان ۱۲px را آزاد می‌کند. */
            overflow: 'hidden', gap: '6px',
          }}>
            {/* ۱۳ → ۱۴٫۳ → ۱۵ → ۱۶٫۵ (۱۰٪ دیگر) */}
            <div style={{ fontSize: '16.5px', fontWeight: 800, color: '#1a1a1a',
              letterSpacing: '-0.02em', textAlign: 'center', lineHeight: 1.2 }}>
              {club.name.replace(/^باشگاه\s+/, '')}
            </div>
            {/* تعداد میزها به‌جای امتیاز — فقط وقتی باشگاه اعلامش کرده */}
            {club.tables > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', flexWrap: 'wrap', marginTop: '5px' }}>
              {[
                { label: 'اسنوکر', n: snookerTables, clr: '#1B7A38' },
                { label: 'پاکت',   n: pocketTables,  clr: '#1D4ED8' },
                { label: 'هی‌بال', n: hiballTables,  clr: '#6D28D9' },
              ].map(t => (
                <span key={t.label} style={{ fontSize: '10px', fontWeight: 700, color: t.clr,
                  background: `${t.clr}12`, border: `1px solid ${t.clr}26`,
                  borderRadius: '20px', padding: '1px 6px', whiteSpace: 'nowrap' }}>
                  {t.label} {t.n.toLocaleString('fa-IR')}
                </span>
              ))}
            </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'rgba(0,0,0,0.40)', fontSize: '11px' }}>
              <MapPin size={9} style={{ color: GOLD, flexShrink: 0 }} />{club.city}
            </div>
            <div style={{ flex: 1 }} />
            <div className="cta-lq cta-lq-sm" style={{ borderRadius: rad }}>
              مشاهده و رزرو
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BAZAAR CARD — دقیقاً فرمت کارت صفحه‌ی بیلیارد بازار (/shop)؛
   یک کارت برای دسکتاپ و موبایل (کارت سفید، حاشیه‌ی نازک،
   پیل ٪ بنفش، قیمت خط‌خورده).
═══════════════════════════════════════════════════════════════ */
/* استایل‌های ثابت این کارت به کلاس رفتند، نه `style` اینلاین.

   چرا: این کارت ۲۴ بار روی صفحه رندر می‌شود (محصولات × دو کپی مارکی).
   هر بار همان رشته‌ی استایل عیناً در HTML تکرار می‌شد. اندازه‌گیری روی
   HTML واقعی سایت: ۸۴۰ ویژگی style اینلاین، ۱۰۱KB، که ۶۲KBاش
   صرفاً تکرار بود — همین کارت بزرگ‌ترین سهم را داشت.

   کلاس یک‌بار در CSS می‌آید و بی‌نهایت بار استفاده می‌شود؛ مرورگر هم
   می‌تواند کشش کند. فقط چیزی که واقعاً از داده می‌آید اینلاین ماند. */
const BAZAAR_CSS = `
  .bz-card { text-decoration:none; background:#fff; border-radius:10px;
    border:1.5px solid rgba(28,28,26,0.18); overflow:hidden;
    display:flex; flex-direction:column; flex-shrink:0; }
  .bz-img { width:100%; flex:0 0 60%; position:relative; background:#F4F3F1;
    overflow:hidden; border-bottom:1.5px solid rgba(28,28,26,0.18); }
  .bz-img img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .bz-body { padding:9px 8px 8px; flex:1; display:flex; flex-direction:column;
    gap:4px; overflow:hidden; }
  /* ── تیترِ دوتکه، هم‌شکلِ کارتِ «بیلیارد بازار» ──
     تا امروز کلِ تیتر یک رشته بود («چوب اسنوکر — Predator») با وزنِ
     معمولی، پس دسته‌بندی و نوع هیچ برجستگی‌ای نداشتند و چشم مجبور بود
     کلِ خط را بخواند. حالا سرِ تیتر بولد است و برند/مدل زیرش با وزنِ
     عادی — دقیقاً همان چیزی که در فهرستِ بازار هست. */
  .bz-name { font-size:12.5px; color:#1C1B17; line-height:1.5; display:block; overflow:hidden; }
  .bz-h { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
    overflow:hidden; font-weight:800; }
  .bz-t { display:block; font-size:11px; font-weight:400; color:#6E695C;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .bz-row { margin-top:auto; display:flex; align-items:center; gap:5px; }
  .bz-pct { background:#b400ae; color:#fff; font-size:12px; font-weight:800;
    border-radius:999px; padding:3px 8px 1px; line-height:1;
    display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
  .bz-prices { margin-inline-start:auto; text-align:right; }
  .bz-old { font-size:10px; color:#6E695C; text-decoration:line-through;
    line-height:1.1; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .bz-new { font-size:12.5px; font-weight:700; color:#1C1B17;
    font-variant-numeric:tabular-nums; white-space:nowrap; }
  .bz-unit { font-size:9px; font-weight:500; }
`;

function BazaarCard({ p, className, style }: { p: RealProduct; className?: string; style?: React.CSSProperties }) {
  return (
    <Link href={`/shop/${p.id}`} className={`prod-hover bz-card${className ? ` ${className}` : ''}`} style={style}>
      <div className="bz-img">
        <img loading="lazy" decoding="async" src={p.img} alt={p.name}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
      <div className="bz-body">
        {/* همان کامپوننتی که کارتِ فروشگاه و فهرستِ بازار هم از آن
            استفاده می‌کنند — تا یک محصول در سه صفحه یک‌شکل باشد. */}
        <ProductTitle p={{ name: p.name, brand: p.sub }}
          className="bz-name" headClassName="bz-h" tailClassName="bz-t" />
        {/* شهر و وضعیت — این نوار فقط در فهرستِ بازار بود و همان آگهی
            روی صفحه‌ی اصلی بدونِ آن نشان داده می‌شد */}
        <CardMeta p={p} style={{ marginTop: 2 }} />
        <div className="bz-row">
          {/* قیمت از منبعِ واحد — منطقِ «توافقی» و تخفیف یک‌جا نوشته شده */}
          <CardPrice
            p={{ negotiable: p.negotiable, price: p.sale, old: p.price, disc: p.pct }}
            cls={{ pct: 'bz-pct', box: 'bz-prices', old: 'bz-old', now: 'bz-new', unit: 'bz-unit' }}
          />
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SELLER CARD
═══════════════════════════════════════════════════════════════ */
function SellerCard({ s }: { s: RealStore }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', width: '100%', background: '#fff',
        borderRadius: '16px', overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.10)',
        boxShadow: hov ? '0 24px 60px rgba(0,0,0,0.18)' : '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'transform 0.4s ease, box-shadow 0.4s ease',
        transform: hov ? 'translateY(-6px)' : 'none',
        cursor: 'pointer',
      }}
    >
      {/* ── قوسِ پایینِ ملایم‌تر ──
          قوسِ قبلی (۶۰٪ / ۴۲px) با عکسِ واقعی زیبا بود، ولی روی
          پوسترِ تخت گوشه‌های سفیدِ درشتی می‌ساخت که مثل هاله‌ی سفیدِ
          دورِ کارت دیده می‌شد. کارت سفید می‌ماند — فقط برش کم‌عمق‌تر
          شد تا آن دو لکه از بین برود. */}
      <div style={{ position: 'relative', height: '150px', overflow: 'hidden', borderRadius: 0 }}>
        {/* ── فروشگاهِ بی‌لوگو ⇒ پوسترِ پیش‌فرض، نه عکسِ عمومی ──
            تا امروز یک عکسِ ثابتِ فروشگاه نشان داده می‌شد که ربطی به
            این فروشگاه نداشت (و پیش‌تر حتی نشانی‌اش ۴۰۴ می‌داد و کارت
            کاملاً بی‌عکس می‌ماند). حالا همان پوسترِ لایه‌ایِ صفحه‌ی
            فروشگاه این‌جا هم ساخته می‌شود: گرادیانِ نمدِ سبز، بافتِ
            نقطه‌ای، هالهٔ طلایی، و حرفِ اولِ نامِ فروشگاه. */}
        {s.img ? (
          <img loading="lazy" decoding="async" src={s.img} alt={s.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', transform: hov ? 'scale(1.07)' : 'scale(1)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          /* پوسترِ ساده و بی‌افکت: یک زمینه‌ی نمدیِ یکدست و حرفِ اولِ
             نام. بافتِ نقطه‌ای، هالهٔ بلور و زیرنویسِ لاتین برداشته
             شدند — روی کارتی به این کوچکی شلوغی می‌ساختند. */
          <div style={{ position: 'absolute', inset: 0, background: '#0d3a29', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: 'rgba(199,166,106,0.85)' }}>
              {s.name.trim().charAt(0) || 'ف'}
            </span>
          </div>
        )}
        {/* gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.28) 100%)' }} />
        {s.badge && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: GOLD, color: '#1a1a1a', fontSize: '9px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.05em' }}>
            {s.badge}
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '14px 14px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: TEXT, lineHeight: 1.3 }}>{s.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', marginTop: '3px', fontSize: '11px', color: TEXT_M }}>
          <MapPin size={9} style={{ color: GOLD }} />{s.city}
        </div>
        <div style={{ fontSize: '11px', color: TEXT_M, marginTop: '1px' }}>{s.specialty}</div>
        {/* امتیاز فقط وقتی واقعی باشد — برای فروشگاه تازه چیزی جعل نمی‌شود */}
        {s.rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '6px' }}>
            <Star size={10} style={{ color: '#F5A623', fill: '#F5A623' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: TEXT }}>{s.rating}</span>
            <span style={{ fontSize: '10px', color: TEXT_M }}>({s.reviews})</span>
          </div>
        )}
        <div style={{ marginTop: '12px', padding: '8px 0', borderRadius: '10px', background: 'rgba(199,166,106,0.08)', border: `1px solid ${GOLD_BOR}`, color: CTA_INK, fontSize: '12px', fontWeight: 700 }}>
          مشاهده فروشگاه
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MKT BANNER  — mini 3-image auto-slider
═══════════════════════════════════════════════════════════════ */
function MktBanner({ slides, label, body, cta, accent, href, initialIdx = 0, lqCta = false }: {
  slides: string[]; label: string; body: string; cta: string; accent: string; href: string; initialIdx?: number; lqCta?: boolean;
}) {
  const [idx, setIdx] = useState(initialIdx);
  /* شروع پس از آرام‌شدنِ مرورگر — نه وسطِ hydration */
  const ready = useDeferredStart();
  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => setIdx(p => (p + 1) % slides.length), 3200);
    return () => clearInterval(t);
  }, [ready, slides.length]);
  const isDark = accent === GOLD;
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', position: 'relative', borderRadius: '14px', overflow: 'hidden', height: 'clamp(120px,11vw,160px)', cursor: 'pointer' }}>
      {slides.map((img, i) => (
        <img loading="lazy" decoding="async" key={i} src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === idx ? 1 : 0, transition: 'opacity 0.85s ease' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 20px' }}>
        <div>
          <div style={{ fontSize: '9px', color: accent, fontWeight: 700, letterSpacing: '0.24em', marginBottom: '5px', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>{label}</div>
          <div style={{ fontSize: 'clamp(13px,1.3vw,18px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.85)' }} dangerouslySetInnerHTML={{ __html: body }} />
          <div style={lqCta
            ? { display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#F6F1E8', border: '1px solid rgba(199,166,106,0.45)', color: CTA_INK, padding: '5px 13px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }
            : { display: 'inline-flex', alignItems: 'center', gap: '5px', background: accent, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: isDark ? '#1a1a1a' : '#fff' }
          }>{cta} <ArrowLeft size={9} /></div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '9px', left: '12px', display: 'flex', gap: '4px' }}>
        {slides.map((_, i) => (
          <div key={i} style={{ width: i === idx ? '14px' : '5px', height: '5px', borderRadius: '3px', background: i === idx ? '#fff' : 'rgba(255,255,255,0.38)', transition: 'all 0.3s ease' }} />
        ))}
      </div>
    </Link>
  );
}

/* ── `DiscoveryPanel` حذف شد ──

   ۱۳۵ خط کامپوننتِ کامل (تب‌ها، دراپ‌داون‌های فیلتر، جست‌وجو) که در
   هیچ‌جای پروژه رندر نمی‌شد — جست‌وجو در کلِ `apps/web` فقط به همین
   تعریف می‌رسید.

   چون در همان ماژولِ صفحه‌ی اصلی بود، بسته‌بند نمی‌توانست حذفش کند و
   کدش در باندلی می‌نشست که مرورگر باید پیش از پاسخ‌گو شدنِ صفحه
   می‌خواند و اجرا می‌کرد.

   اگر روزی چنین پنلی خواستیم، از تاریخچه‌ی گیت برمی‌گردد. */

/* ═══════════════════════════════════════════════════════════════
   HOME MEDIA BAND — پوستر سینمایی «بیلیارد مدیا» بین بازار و
   فروشندگان. بریک تیره بین دو سکشن روشن، به هویت «سالن نمایش»
   (/media): شارکُل-برنزی، پرفراژ فیلم، پلی طلایی، دیوار پوستر.
═══════════════════════════════════════════════════════════════ */
/* فهرستِ محتوای دستی می‌تواند خالی باشد (و امروز هست). پیش‌تر این‌جا
   `MEDIA_VIDEOS[0]!` نوشته شده بود که با فهرستِ خالی `undefined`
   می‌شود و اولین `feat.id` کلِ صفحه‌ی اول را می‌شکند. */
const MEDIA_FEAT  = MEDIA_VIDEOS.find(v => v.featured) ?? MEDIA_VIDEOS[0] ?? null;
const MEDIA_MINIS = MEDIA_FEAT
  ? [...MEDIA_VIDEOS].sort((a, b) => b.views - a.views).filter(v => v.id !== MEDIA_FEAT.id).slice(0, 3)
  : [];

/* `HomeMediaBand` به `components/home/HomeMediaBand.tsx` منتقل شد و
   با `next/dynamic` بارگذاری می‌شود — بالای همین فایل. */

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */

export default function HomeClient({ initialPlacements, initialFeatured, servicesSlot, exploreSlot }: {
  initialPlacements?: Partial<Record<PlacementKey, PlacementState>>
  /* باشگاه/محصول/فروشگاه واقعی، خوانده‌شده روی سرور — تا کارت‌ها در
     HTML اولیه باشند و صفحه هنگام لود نپرد. */
  initialFeatured?: { clubs: RealClub[]; products: RealProduct[]; stores: RealStore[] }
  /* Server Component که این‌جا فقط رندر می‌شود — هیچ JSای همراهش نیست */
  servicesSlot?: React.ReactNode
  exploreSlot?: React.ReactNode
}) {
  const [slide, setSlide]     = useState(0);
  /* `scrollY` دیگر state نیست — دیدنِ آن در state یعنی هر فریمِ
     اسکرول یک رندرِ کامل. جزئیات کنارِ همان useEffect. */
  const [playing, setPlaying] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  /* ── چرخش‌های خودکار ──
     هیرو، بنرها و دو نوارِ کشویی همگی در لحظه‌ی mount شروع می‌شدند —
     یعنی دقیقاً وسطِ hydration. هر تیک یک رندرِ کاملِ React است و
     جمعشان در بدترین لحظه روی رشته‌ی اصلی می‌نشست.

     این پرچم تا آرام‌شدنِ مرورگر `false` است. اسلایدِ اولِ هر بخش از
     همان ابتدا دیده می‌شود؛ فقط *رفتن به بعدی* عقب می‌افتد، که چشم
     نمی‌بیند. بالای همه‌ی افکت‌ها اعلام می‌شود چون چند تای آن‌ها
     پیش از این نقطه در بدنه‌ی کامپوننت‌اند. */
  const spin = useDeferredStart();
  const rafRef   = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* منبعِ ویدیو بعد از آرام‌شدنِ مرورگر به DOM اضافه می‌شود، ولی
     افزودنِ `<source>` به یک `<video>` که یک‌بار رندر شده هیچ
     بارگذاری‌ای شروع نمی‌کند — مرورگر فقط موقعِ ساختِ عنصر منبع‌ها را
     می‌خواند. بدونِ این فراخوانی، ویدیو هیچ‌وقت پخش نمی‌شد. */
  useEffect(() => {
    if (!spin) return;
    const v = videoRef.current;
    if (!v || v.currentSrc) return;
    v.load();
    /* بعضی مرورگرها پس از load دوباره خودکار پخش نمی‌کنند */
    void v.play().catch(() => { /* سیاستِ پخشِ خودکار — پوستر می‌ماند */ });
  }, [spin]);

  const next = useCallback(() => setSlide(s => (s + 1) % HERO_SLIDES.length), []);
  const prev = useCallback(() => setSlide(s => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);

  const sliderRef      = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(0);
  const activeCardRef  = useRef(0);

  const clubsSliderRef = useRef<HTMLDivElement>(null);
  const clubsDeskRef = useRef<HTMLDivElement>(null);
  /* چرخ ماوس و درگ روی نوار باشگاه‌ها */
  useHorizontalScroll(clubsDeskRef);

  /* ── سکشن‌های ویژه (فاز ۲): placement-driven با fallback ──
     اگر ادمین برای جایگاه موجودیتی کمپین فعال ساخته باشد، همان‌ها
     نمایش داده می‌شوند؛ وگرنه داده‌ی نمونه‌ی فعلی — تا وقتی جایگاه‌ها
     پر نشده‌اند ظاهر سایت ذره‌ای عوض نشود. */
  const prodSlot = usePlacementState('market_featured_products_homepage', initialPlacements?.market_featured_products_homepage);
  const clubSlot = usePlacementState('featured_clubs_homepage', initialPlacements?.featured_clubs_homepage);
  const storeSlot = usePlacementState('featured_equipment_stores_homepage', initialPlacements?.featured_equipment_stores_homepage);
  const featProducts = prodSlot.items;
  const featClubs = clubSlot.items;
  const featStores = storeSlot.items;

  /* «غیرفعال ⇒ اصلاً نمایش داده نشود» (قانون فاز ۵).
     حالت loading عمداً سکشن را نگه می‌دارد تا صفحه هنگام بارگذاری نپرد.
     در حالت «دستی/پولی» اگر ادمین هنوز چیزی انتخاب نکرده، سکشن حذف
     می‌شود و به داده‌ی نمونه برنمی‌گردد — وگرنه ادمین فکر می‌کند
     جایگاه خالی است ولی کاربر یک فهرست نمونه‌ی پر می‌بیند. */
  const sectionVisible = (p: { status: string; mode: string | null; items: unknown[] | null }) => {
    if (p.status === 'loading') return true;
    if (p.status === 'off') return false;
    if (p.mode === 'free') return true;
    return (p.items?.length ?? 0) > 0;
  };
  const showProducts = sectionVisible(prodSlot);
  const showClubs = sectionVisible(clubSlot);
  const showStores = sectionVisible(storeSlot);

  /* دو بنر کناری در همان سکشن فروشندگان‌اند ولی جایگاه مستقل‌اند:
     خاموش‌کردن فهرست فروشگاه‌ها نباید تبلیغ فروخته‌شده را حذف کند و
     برعکس. پس سکشن تا وقتی یکی از این سه چیزی برای نشان‌دادن دارد
     می‌ماند. */
  const rightAd = usePlacementState('equipment_ads_right');
  const leftAd = usePlacementState('equipment_ads_left');
  const hasAd = (p: { status: string; items: unknown[] | null }) =>
    p.status === 'on' && (p.items?.length ?? 0) > 0;
  const showSellersSection = showStores || hasAd(rightAd) || hasAd(leftAd);

  /* دو کمپین با ارجاع به یک موجودیت ⇒ کلید تکراری React و کارت دوباره؛
     تکراری‌ها همین‌جا حذف می‌شوند */
  const uniqByRef = (snaps: EntitySnapshot[]) => {
    const seen = new Set<string>();
    return snaps.filter(e => !seen.has(e.ref) && (seen.add(e.ref), true));
  };

  /* ── پشتوانه‌ی سه سکشن وقتی جایگاه تبلیغاتی خالی است ──

     پیش‌تر این نقش را سه آرایه‌ی هاردکد بازی می‌کردند (هشت باشگاه،
     چهارده محصول، دوازده فروشگاه) که هیچ‌کدام وجود نداشتند. یعنی
     تا وقتی کسی جایگاه را نخریده بود، صفحه‌ی اصلی پر بود از
     «باشگاه ستاره تهران» و «فروشگاه چمپیون تبریز»ی که کلیک‌شان
     به هیچ‌جا نمی‌رسید.

     حالا همان جای خالی با موجودیت‌های واقعی سایت پر می‌شود. اگر
     چیزی هم نباشد، سکشن خالی می‌ماند — که درست است. */
  const [realClubs, setRealClubs] = useState<RealClub[]>(initialFeatured?.clubs ?? []);
  const [realProducts, setRealProducts] = useState<RealProduct[]>(initialFeatured?.products ?? []);
  const [realStores, setRealStores] = useState<RealStore[]>(initialFeatured?.stores ?? []);

  /* اگر سرور داده را رسانده، دوباره از مرورگر نمی‌پرسیم — همان مقدار
     اولیه کافی است و یک رفت‌وبرگشت اضافه صرفه ندارد. */
  const needClientFetch = !initialFeatured || (
    initialFeatured.clubs.length === 0 &&
    initialFeatured.products.length === 0 &&
    initialFeatured.stores.length === 0
  );

  useEffect(() => {
    if (!needClientFetch) return;
    /* `sharedJson` نه `fetch` خام: نوارِ استوری هم همین دو مسیر را
       می‌گیرد و اندازه‌گیری هرکدام را دو بار نشان داده بود. */
    const grab = async <T,>(url: string, pick: (j: unknown) => T[]): Promise<T[]> => {
      try { return pick(await sharedJson<unknown>(url)) ?? []; }
      catch { return []; }
    };

    void (async () => {
      const [cl, pr, st] = await Promise.all([
        grab<ApiClub>('/api/clubs', j => (Array.isArray(j) ? j : [])),
        grab<ApiProduct>('/api/products', j => ((j as { products?: ApiProduct[] })?.products ?? [])),
        grab<ApiStore>('/api/sellers', j => (Array.isArray(j) ? j : [])),
      ]);

      /* امتیاز و تعداد نظر صفر می‌ماند تا سیستم نظر واقعاً وجود داشته
         باشد — کارت خودش صفر را نمایش نمی‌دهد. */
      setRealClubs(cl.slice(0, FEATURED_COUNT).map((c, i) => ({
        id: c.id, name: c.name, city: c.city ?? '', dist: '',
        tables: (c.snookerTables ?? 0) + (c.pocketTables ?? 0) + (c.highballTables ?? 0)
              + (c.vipSnookerTables ?? 0) + (c.vipPocketTables ?? 0),
        breakdown: {
          snooker: (c.snookerTables ?? 0) + (c.vipSnookerTables ?? 0),
          pocket: (c.pocketTables ?? 0) + (c.vipPocketTables ?? 0),
          highball: c.highballTables ?? 0,
        },
        rating: 0, reviews: 0, type: 'اسنوکر',
        img: thumbUrl(c.images?.[0], CLUB_W) || CLUB_IMG_FALLBACK[i % CLUB_IMG_FALLBACK.length]!,
        img2: thumbUrl(c.images?.[1], CLUB_W) || CLUB_IMG_FALLBACK[(i + 1) % CLUB_IMG_FALLBACK.length]!,
        price: 0, badge: null as string | null, tags: [] as string[],
        hasStory: !!c.hasActiveStory,
      })));

      setRealProducts(pr.slice(0, 14).map(p => ({
        id: p.id, name: modernizeType(p.title), sub: p.brand || p.category || 'بیلیارد بازار',
        img: thumbUrl(p.images?.[0], PROD_W) || IMG.cue,
        brand: (p.brand || 'BILLIARD').toUpperCase(),
        price: p.price ?? 0, sale: p.discountPrice ?? p.price ?? 0,
        pct: p.discountPercent ?? 0, negotiable: p.negotiable === true,
        city: p.city ?? '', condition: p.condition ?? 'new',
      })));

      /* `/api/sellers` از جدولِ `profiles` می‌خواند (kind=seller،
         تأییدشده) و شکلِ قدیمیِ پاسخ را نگه می‌دارد. `id` همان
         **نامک** است، پس `/sellers/<id>` درست باز می‌شود — پیش‌تر
         شناسه‌ی کاربر بود و کارت به فروشگاهِ پیدانشده می‌رسید. */
      setRealStores(st.slice(0, 12).map(s => {
        const sp = s.sellerProfile ?? {};
        const person = [s.firstName, s.lastName].filter(Boolean).join(' ').trim();
        return {
          id: s.id,
          name: sp.storeName || person || 'فروشگاه',
          city: sp.city ?? '',
          specialty: sp.specialty || 'تجهیزات بیلیارد',
          rating: 0, reviews: 0,
          /* خالی یعنی «لوگو ندارد» ⇒ کارت پوسترِ پیش‌فرض می‌سازد */
          img: thumbUrl(sp.logo || s.avatar, LOGO_W),
          badge: null as string | null,
        };
      }));
    })();
  }, [needClientFetch]);

  /* بازگشت به داده‌ی نمونه فقط وقتی جایگاه «رایگان» است (یا هنوز
     بارگذاری نشده): جایگاه دستی/پولی خالی باید واقعاً خالی بماند.
     ظرفیت صفر هم یعنی «عمداً هیچ» — پس آن‌جا هم نمونه نمی‌آید،
     وگرنه صفرکردن ظرفیت بیشتر محتوا نشان می‌داد نه کمتر. */
  const demoOk = (p: { mode: string | null; status: string; displayCount?: number }) =>
    p.status === 'loading' || (p.mode === 'free' && (p.displayCount ?? 1) > 0);

  const HOME_PRODUCTS = useMemo(() => {
    const snaps = uniqByRef((featProducts ?? []).map(c => c.entity).filter((e): e is EntitySnapshot => !!e));
    if (!snaps.length) return demoOk(prodSlot) ? realProducts : [];
    return snaps.map(e => ({
      id: e.ref, name: modernizeType(e.title), sub: e.subtitle || 'بیلیارد بازار', img: thumbUrl(e.image, PROD_W),
      brand: (e.subtitle || 'BILLIARD').toUpperCase(),
      price: e.oldPrice ?? e.price ?? 0, sale: e.price ?? 0, pct: e.discountPercent ?? 0,
      /* ── چرا این خط سه بار اشتباه بود ──
         کارت‌های سکشنِ «بیلیارد بازار» از اسنپ‌شاتِ جایگاه می‌آیند، نه
         از ردیفِ خامِ محصول. دو بارِ قبل فقط مسیرِ `realProducts`
         درست شد و این مسیر — که در عمل همانی است که رندر می‌شود —
         دست‌نخورده ماند. حالا خودِ اسنپ‌شات پرچم را حمل می‌کند. */
      negotiable: e.negotiable === true,
      city: e.city ?? '', condition: e.condition ?? 'new',
    }));
  }, [featProducts, prodSlot.mode, prodSlot.status, realProducts]);

  const HOME_CLUBS = useMemo(() => {
    const snaps = uniqByRef((featClubs ?? []).map(c => c.entity).filter((e): e is EntitySnapshot => !!e));
    if (!snaps.length) return demoOk(clubSlot) ? realClubs : [];
    /* اعداد ساختگی (امتیاز ۵، ۱۰ میز) برای باشگاه واقعی جعل اطلاعات
       است: تعداد میز از ستون‌های واقعی می‌آید و امتیاز/نظر تا وقتی
       سیستم نظر نداریم صفر می‌ماند و روی کارت نمایش داده نمی‌شود. */
    return snaps.map(e => ({
      id: e.ref, name: e.title, city: e.city || e.subtitle || '', dist: '',
      tables: e.stats?.tables ?? 0,
      /* تفکیک واقعی نوع میز — کارت دیگر خودش عدد نمی‌سازد */
      ...(e.stats?.tables
        ? { breakdown: { snooker: e.stats.snooker ?? 0, pocket: e.stats.pocket ?? 0, highball: e.stats.highball ?? 0 } }
        : {}),
      rating: 0, reviews: 0, type: 'اسنوکر', img: thumbUrl(e.image, CLUB_W), img2: thumbUrl(e.image, CLUB_W),
      price: 0, badge: e.badge ?? null as string | null, tags: [] as string[], hasStory: false,
    }));
  }, [featClubs, clubSlot.mode, clubSlot.status, realClubs]);

  const HOME_SELLERS = useMemo(() => {
    const snaps = uniqByRef((featStores ?? []).map(c => c.entity).filter((e): e is EntitySnapshot => !!e));
    if (!snaps.length) return demoOk(storeSlot) ? realStores : [];
    /* امتیاز ۵ برای فروشگاه واقعی جعل اطلاعات بود — تا نداشتن سیستم
       نظر، امتیاز صفر می‌ماند و کارت اصلاً نشانش نمی‌دهد */
    return snaps.map(e => ({
      id: e.ref, name: e.title, city: e.city || '',
      specialty: 'تجهیزات بیلیارد', rating: 0, reviews: 0, img: thumbUrl(e.image, LOGO_W), badge: e.badge ?? null,
    }));
  }, [featStores, storeSlot.mode, storeSlot.status, realStores]);

  /* دوبل‌سازی فقط برای حلقه‌ی مارکی و فقط وقتی آیتم کافی هست — با فهرست
     کوتاه کمپینی، همان کارت دو بار پشت هم زشت می‌شد */
  const MKT_LOOP = HOME_PRODUCTS.length >= 6 ? [...HOME_PRODUCTS, ...HOME_PRODUCTS] : HOME_PRODUCTS;
  const SELLERS_LOOP = HOME_SELLERS.length >= 6 ? [...HOME_SELLERS, ...HOME_SELLERS] : HOME_SELLERS;
  const [activeClub, setActiveClub] = useState(0);
  const activeClubRef  = useRef(0);

  const mktSliderRef  = useRef<HTMLDivElement>(null);
  const [activeMkt, setActiveMkt] = useState(0);
  const activeMktRef  = useRef(0);

  const mktDeskRef   = useRef<HTMLDivElement>(null);
  const mktPausedRef = useRef(false);
  /* چرخ ماوس و درگ — حرکت خودکار حین دخالت کاربر می‌ایستد */
  useHorizontalScroll(mktDeskRef, busy => { mktPausedRef.current = busy });
  const mktTickerRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!spin) return;
    const el = mktDeskRef.current;
    if (!el) return;
    const SPEED = 50;
    /* در RTL موقعیت اسکرول منفی است؛ مقدار مثبت به ۰ گیر می‌کرد و
       حرکت خودکار اصلاً شروع نمی‌شد. */
    const sign = scrollSign(el);
    setPos(el, sign, el.scrollWidth / 2);
    let last = 0;
    const tick = (t: number) => {
      if (last && !mktPausedRef.current) {
        const half = el.scrollWidth / 2;
        let p = getPos(el, sign) - (SPEED * (t - last)) / 1000;
        if (p <= 0) p += half;
        setPos(el, sign, p);
      }
      last = t;
      mktTickerRef.current = requestAnimationFrame(tick);
    };
    mktTickerRef.current = requestAnimationFrame(tick);
    return () => { if (mktTickerRef.current) cancelAnimationFrame(mktTickerRef.current); };
  }, [spin]);


  // ── Sellers auto-scroll ──
  const sellersRef      = useRef<HTMLDivElement>(null);
  const sellersPaused   = useRef(false);
  useHorizontalScroll(sellersRef, busy => { sellersPaused.current = busy });
  const sellersTickerR  = useRef<number | null>(null);

  useEffect(() => {
    if (!spin) return;
    const el = sellersRef.current;
    if (!el) return;
    const SPEED = 45;
    /* در RTL موقعیت اسکرول منفی است؛ مقدار مثبت به ۰ گیر می‌کرد و
       حرکت خودکار اصلاً شروع نمی‌شد. */
    const sign = scrollSign(el);
    setPos(el, sign, el.scrollWidth / 2);
    let last = 0;
    const tick = (t: number) => {
      if (last && !sellersPaused.current) {
        const half = el.scrollWidth / 2;
        let p = getPos(el, sign) - (SPEED * (t - last)) / 1000;
        if (p <= 0) p += half;
        setPos(el, sign, p);
      }
      last = t;
      sellersTickerR.current = requestAnimationFrame(tick);
    };
    sellersTickerR.current = requestAnimationFrame(tick);
    return () => { if (sellersTickerR.current) cancelAnimationFrame(sellersTickerR.current); };
  }, [spin]);


  /* حالت و تایمرِ اسلایدرِ بنر با خودِ کامپوننت به
     `components/home/BannerSlider.tsx` رفت — تا وقتی سوار نشده،
     نه تایمری هست نه رندری. */


  /* تشخیص کارت وسط با rAF (به‌جای رویداد اسکرول) — چون در دسکتاپ ترک با
     انیمیشن CSS می‌چرخد و اسکرول رخ نمی‌دهد. کارت نزدیک به مرکز نرم بزرگ می‌شود
     و activeCard همیشه اندیس منطقی ۰..۶ است (محتوا برای حلقه ×۲ رندر می‌شود). */
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    /* این حلقه بزرگ‌ترین هزینه‌ی نخ اصلی صفحه بود.

       نسخه‌ی قبلی بی‌قیدوشرط هر فریم اجرا می‌شد و برای هر کارت
       `getBoundingClientRect()` می‌خواند — یعنی Forced Reflow در هر
       فریم، برای همیشه، حتی وقتی سکشن اصلاً روی صفحه نبود یا کاربر
       تب دیگری باز کرده بود. در Lighthouse این می‌شد
       Style & Layout ≈ ۱۰ ثانیه.

       سه شرط اضافه شد:
         • فقط وقتی سکشن در دید است (IntersectionObserver)
         • فقط وقتی تب فعال است (visibilitychange)
         • اگر کاربر «کاهش حرکت» خواسته، اصلاً اجرا نمی‌شود

       نوشتن transform هم فقط وقتی مقدار واقعاً عوض شده انجام می‌شود؛
       نوشتن تکراری همان مقدار، لایه را بی‌دلیل باطل می‌کرد. */
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let raf = 0;
    let visible = false;
    const lastScale = new WeakMap<HTMLElement, string>();

    const loop = () => {
      if (!visible || document.hidden) { raf = 0; return; }   // حلقه می‌ایستد، نه اینکه بی‌کار بچرخد
      const rect = slider.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const cards = slider.querySelectorAll<HTMLElement>('.feat-card');
      let minDist = Infinity, newActive = 0;
      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        if (r.width === 0) return;                       // کپی مخفی موبایل
        const dist = Math.abs(r.left + r.width / 2 - centerX);
        const t = Math.max(0, 1 - dist / (rect.width * 0.55));
        const next = `scale(${(1 + t * 0.15).toFixed(3)})`;
        if (lastScale.get(card) !== next) { card.style.transform = next; lastScale.set(card, next); }
        if (dist < minDist) { minDist = dist; newActive = i; }
      });
      const feat = newActive % FEATURE_CARDS.length;
      if (feat !== activeCardRef.current) { activeCardRef.current = feat; setActiveCard(feat); }
      raf = requestAnimationFrame(loop);
    };

    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = !!e?.isIntersecting;
        /* همین کلاس، انیمیشن CSS مارکی و `will-change` را هم
           روشن/خاموش می‌کند (پایین‌تر در استایل). */
        slider.classList.toggle('in-view', visible);
        visible ? start() : stop();
      },
      { threshold: 0 },
    );
    io.observe(slider);

    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);

    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis); stop(); };
  }, []);

  const clubsRafRef = useRef<number>(0);
  const handleClubsScroll = useCallback(() => {
    cancelAnimationFrame(clubsRafRef.current);
    clubsRafRef.current = requestAnimationFrame(() => {
      const slider = clubsSliderRef.current;
      if (!slider) return;
      const sliderCenter = slider.scrollLeft + slider.offsetWidth / 2;
      const cards = Array.from(slider.querySelectorAll<HTMLElement>('.club-mob-card'));
      let minDist = Infinity, newActive = 0;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - sliderCenter);
        const t = Math.max(0, 1 - dist / (slider.offsetWidth * 0.50));
        const sx = (1 - t * 0.05).toFixed(3);
        card.style.transform = `scaleX(${sx})`;
        card.style.filter = t > 0.3
          ? `drop-shadow(0 ${(t * 5).toFixed(1)}px ${(t * 12).toFixed(1)}px rgba(0,0,0,${(t * 0.13).toFixed(2)}))`
          : 'none';
        if (dist < minDist) { minDist = dist; newActive = i; }
      });
      if (newActive !== activeClubRef.current) {
        activeClubRef.current = newActive;
        setActiveClub(newActive);
        vibrate();
      }
    });
  }, []);

  useEffect(() => {
    const slider = clubsSliderRef.current;
    if (!slider) return;
    slider.addEventListener('scroll', handleClubsScroll, { passive: true });
    handleClubsScroll();
    return () => slider.removeEventListener('scroll', handleClubsScroll);
  }, [handleClubsScroll]);

  const mktRafRef = useRef<number>(0);
  const handleMktScroll = useCallback(() => {
    cancelAnimationFrame(mktRafRef.current);
    mktRafRef.current = requestAnimationFrame(() => {
      const slider = mktSliderRef.current;
      if (!slider) return;
      const sliderCenter = slider.scrollLeft + slider.offsetWidth / 2;
      const cards = Array.from(slider.querySelectorAll<HTMLElement>('.mkt-mob-card'));
      let minDist = Infinity, newActive = 0;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - sliderCenter);
        const t = Math.max(0, 1 - dist / (slider.offsetWidth * 0.50));
        const sx = (1 - t * 0.05).toFixed(3);
        card.style.transform = `scaleX(${sx})`;
        card.style.filter = t > 0.3
          ? `drop-shadow(0 ${(t * 5).toFixed(1)}px ${(t * 12).toFixed(1)}px rgba(0,0,0,${(t * 0.13).toFixed(2)}))`
          : 'none';
        if (dist < minDist) { minDist = dist; newActive = i; }
      });
      if (newActive !== activeMktRef.current) {
        activeMktRef.current = newActive;
        setActiveMkt(newActive);
        vibrate();
      }
    });
  }, []);

  useEffect(() => {
    const slider = mktSliderRef.current;
    if (!slider) return;
    slider.addEventListener('scroll', handleMktScroll, { passive: true });
    handleMktScroll();
    return () => slider.removeEventListener('scroll', handleMktScroll);
  }, [handleMktScroll]);

  /* ── چرا اسکرول از React رد نمی‌شود ──
     پیش‌تر این‌جا `setScrollY(window.scrollY)` بود. یعنی هر فریمِ
     اسکرول یک state تازه می‌شد و **کلِ این کامپوننتِ دوهزارخطی** از
     نو رندر می‌گرفت. rAF جلوی تعدادِ فراخوانی را می‌گرفت ولی نه
     هزینه‌ی هر فراخوانی را — و همان هزینه از بودجه‌ی ۱۶ میلی‌ثانیه‌ای
     هر فریم بیشتر می‌شد. نتیجه‌اش همان لرزشِ اسکرول بود.

     مقدارهایی که به اسکرول وابسته‌اند همه استایلِ محض‌اند (شفافیت و
     جابه‌جایی). این‌ها را می‌شود مستقیم روی گره نوشت؛ آن‌وقت هزینه‌ی
     هر فریم دو نوشتنِ استایل است، نه یک آشتی‌دهیِ کاملِ درخت. */
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const heroContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const apply = () => {
      const y = window.scrollY;
      const v = heroVideoRef.current;
      const c = heroContentRef.current;
      if (v) {
        v.style.transform = `scale(${1 + y * 0.00013})`;
        /* `will-change` فقط در همان بازه‌ای که واقعاً حرکت هست روشن
           می‌ماند؛ دائمی‌بودنش یک لایه‌ی کامپوزیتِ همیشگی می‌سازد. */
        v.style.willChange = y > 0 && y < 700 ? 'transform' : 'auto';
      }
      const fade = String(Math.max(0, 1 - y / 700));
      if (c) {
        c.style.opacity = fade;
        c.style.transform = `translateY(${y * 0.055}px)`;
      }
      /* تصویرهای پس‌زمینه و فلش‌ها هم به همان اسکرول وابسته‌اند.
         با کوئری‌سلکتور نوشته می‌شوند نه با ref، چون چندتایند و
         تعدادشان با اسلایدها عوض می‌شود. */
      const root = c?.parentElement ?? document;
      root.querySelectorAll<HTMLElement>('.hero-parallax')
        .forEach(el => { el.style.transform = `scale(${(1 + y * 0.00013) * 1.02})` });
    };

    const fn = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);


/* چرخشِ هیرو هم منتظرِ آرام‌شدنِ مرورگر می‌ماند. اسلایدِ اول همان
   لحظه دیده می‌شود؛ فقط *رفتن به بعدی* عقب می‌افتد. */
useEffect(() => {
    if (!spin) return;
    if (!playing) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(next, 7000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [spin, playing, next]);

  /* heroO و heroS حذف شدند — مقدارهایشان مستقیم در rAF روی گره‌ها
     نوشته می‌شوند تا اسکرول رندرِ دوباره‌ی React نخواهد. */
  const sl    = HERO_SLIDES[slide]!;

  return (
    <>
      {/* فونت Cormorant Garamond و دو preconnectش حذف شدند.

          سه دلیل، هر سه با اندازه‌گیری:
            • CSP خود ما بارگذاری‌اش را مسدود می‌کرد ⇒ هیچ‌وقت لود
              نمی‌شد و فقط یک خطای امنیتی در کنسول می‌ساخت (که نمره‌ی
              Best Practices را پایین می‌آورد)
            • هیچ‌جای پروژه به این فونت ارجاع نمی‌داد
            • دو `preconnect` به دامنه‌ای که هرگز استفاده نمی‌شد، فقط
              اتصال بی‌مصرف باز می‌کرد */}
      <style>{`
        :root { --hero-bottom-gap: 5px; }
        /* ── چرا blur از این کی‌فریم برداشته شد ──
           حالتِ شروع filter:blur(5px) داشت. یعنی در تمام مدتِ ورود،
           تیتر و زیرنویس مه‌آلود بودند — و چون تایم‌لاین کند بود، کاربر
           یک ثانیه‌ی کامل متنِ ناخوانا می‌دید و فکر می‌کرد صفحه گیر
           کرده. روی متنِ فارسی بدتر هم هست: حروفِ چسبان در بلور به هم
           می‌ریزند.

           جابه‌جایی هم از ۳۰ به ۱۴ پیکسل و مقیاس از ۰٫۹۷ به ۰٫۹۹ آمد.
           حسِ ورود می‌ماند، ولی به‌جای «چیزی دارد می‌آید» می‌شود «چیزی
           همین‌جا بود». */
        @keyframes fadeUp      { from{opacity:0;transform:translateY(14px) scale(0.99);}to{opacity:1;transform:none;} }
        @keyframes fadeTagIn   { from{opacity:0;transform:translateY(-5px);}to{opacity:1;transform:none;} }
        @keyframes pulse2      { 0%,100%{opacity:1;}50%{opacity:0.20;} }
        @keyframes slideBar    { from{width:0;}to{width:100%;} }
        @keyframes floatOrb    { 0%,100%{transform:translate(0,0);}38%{transform:translate(22px,-16px);}70%{transform:translate(-16px,12px);} }
        @keyframes dropUp      { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;} }
        @keyframes gentlePulse { 0%,100%{opacity:1;}50%{opacity:0.25;} }

        /* Hero entrance — runs ONCE on mount. No key prop = no replay on slide change.

           ── چرا تایم‌لاین کوتاه شد ──
           نسخه‌ی قبلی تا ۱٫۷ ثانیه طول می‌کشید (hf. = ۰٫۹۰ تأخیر +
           ۰٫۸ اجرا). واژه‌ی both یعنی هر عنصر در طولِ تأخیرش کاملاً نامرئی
           است، پس کاربر روی اتصالِ سریع هم صفحه‌ای می‌دید که تکه‌تکه و
           کند جا می‌افتاد — شبیهِ کندیِ سایت، در حالی که سرور در ۰٫۲
           ثانیه جواب داده بود.

           انیمیشنی که بیش از نیم‌ثانیه طول بکشد دیگر «ورود» خوانده
           نمی‌شود؛ «تأخیر» خوانده می‌شود. حالا کلِ زنجیره زیرِ
           ۰٫۷ ثانیه تمام می‌شود و پلکانِ بینشان هم تنگ‌تر شده تا
           به‌جای شش موجِ جدا، یک موج دیده شود. */
        .ha { animation:fadeUp 0.52s cubic-bezier(0.22,1,0.36,1) 0.00s both; }
        .hb { animation:fadeUp 0.52s cubic-bezier(0.22,1,0.36,1) 0.04s both; }
        .hc { animation:fadeUp 0.48s cubic-bezier(0.22,1,0.36,1) 0.10s both; }
        .hd { animation:fadeUp 0.46s cubic-bezier(0.22,1,0.36,1) 0.16s both; }
        .he { animation:fadeUp 0.44s cubic-bezier(0.22,1,0.36,1) 0.22s both; }
        .hf { animation:fadeUp 0.42s cubic-bezier(0.22,1,0.36,1) 0.28s both; }

        /* ══ LQ (Liquid Quality) Buttons — pill style ══ */
        .btn-primary,.btn-green,.btn-outline,.btn-ghost-dark {
          display:inline-flex; align-items:center; gap:8px;
          border-radius:20px; cursor:pointer; font-family:inherit;
          transition:background .2s ease;
        }

        /* ─── GOLD / Primary ─── */
        .btn-primary {
          background:rgba(199,166,106,0.10);
          color:${GOLD};
          border:1px solid rgba(199,166,106,0.22);
          padding:14px 32px; font-size:14px; font-weight:700;
        }
        .btn-primary:hover { background:rgba(199,166,106,0.18); }

        /* ─── GREEN ─── */
        .btn-green {
          background:rgba(48,197,90,0.10);
          color:#30C55A;
          border:1px solid rgba(48,197,90,0.22);
          padding:14px 30px; font-size:14px; font-weight:700;
        }
        .btn-green:hover { background:rgba(48,197,90,0.18); }

        /* ─── OUTLINE (light backgrounds) ─── */
        .btn-outline {
          background:rgba(26,25,23,0.06);
          color:${TEXT};
          border:1px solid rgba(26,25,23,0.22);
          padding:13px 28px; font-size:14px; font-weight:600;
        }
        .btn-outline:hover { background:rgba(26,25,23,0.12); }

        /* ─── GHOST DARK (dark sections) ─── */
        .btn-ghost-dark {
          background:rgba(255,255,255,0.06);
          color:rgba(255,255,255,0.88);
          border:1px solid rgba(255,255,255,0.22);
          padding:14px 28px; font-size:14px; font-weight:600;
        }
        .btn-ghost-dark:hover { background:rgba(255,255,255,0.12); }

        /* «مشاهده همه» — دکمه به طرح LQ (تینت طلایی برند) */
        .see-all-lq {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(199,166,106,0.12); color:#9A6E38;
          border:1px solid rgba(199,166,106,0.34); border-radius:10px;
          padding:9px 16px; font-size:13px; font-weight:700; text-decoration:none;
          transition:background .2s ease, transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s;
        }
        .see-all-lq:hover { background:rgba(199,166,106,0.18); transform:translateY(-2px); box-shadow:0 8px 20px rgba(199,166,106,0.20); }
        @media(max-width:640px){ .see-all-lq { padding:6px 12px; font-size:11.5px; gap:4px; border-radius:8px; } }
        /* روی سکشن‌های تیره متن طلایی روشن‌تر تا خوانا بماند */
        .see-all-lq.on-dark { color:${GOLD}; border-color:rgba(199,166,106,0.42); }

        /* ظرفِ محتوای هیرو کلیک را رد می‌کند (توضیحش کنارِ خودش)، ولی
           هرچه داخلش است باید کلیک‌پذیر بماند. */
        .hero-content > * { pointer-events: auto; }

        .sec-label{display:inline-flex;align-items:center;gap:7px;font-size:9.5px;font-weight:800;letter-spacing:0.26em;text-transform:uppercase;margin-bottom:14px;padding:5px 13px;border-radius:999px;border:1px solid currentColor;}
        .sec-label::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;}
        /* نشانِ سکشنِ بازار کمی بالاتر می‌نشیند؛ در موبایل ۱۰٪ کوچک‌تر */
        .mkt-label{margin-top:-10px;}
        @media(max-width:768px){.mkt-label{font-size:8.55px;letter-spacing:0.22em;padding:4px 11px;margin-top:-12px;}}
        /* ── چرا content-visibility برداشته شد ──
           هدفش درست بود: مرورگر محتوای بیرونِ دید را چیدمان نکند.
           ولی هزینه‌اش در عمل بیشتر از سودش درآمد.

           contain-intrinsic-size یعنی «فعلاً فرض کن ۷۰۰ پیکسل
           است». وقتی بخش وارد کادرِ دید می‌شود، مرورگر
           واقعاً چیدمانش می‌کند و ارتفاعِ واقعی معمولاً ۷۰۰ نیست —
           پس ارتفاعِ کلِ صفحه همان لحظه عوض می‌شود و موقعیتِ اسکرول
           می‌پرد. در اسکرولِ تند، چند بخش پشتِ‌سرِ هم این کار را
           می‌کنند و اسکرول عملاً قفل می‌شود؛ و لحظه‌ای که بخش هنوز
           چیده نشده، جای خالی‌اش تیره دیده می‌شود — همان «صفحه‌ی
           سیاهی که چند صدم ثانیه می‌آید و می‌رود».

           این هزینه برای صفحه‌ای با چند بخشِ متوسط نمی‌ارزد. اگر روزی
           لازم شد، باید با ارتفاعِ واقعیِ هر بخش برگردد، نه یک عددِ
           حدسیِ مشترک. */

        /* احترام به «کاهش حرکت» — تنظیم سیستمی کاربر، نه سلیقه‌ی ما.
           همه‌ی حلقه‌های بی‌پایان خاموش می‌شوند. */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
            scroll-behavior: auto !important;
          }
        }

        ${BAZAAR_CSS}
        /* دکمه‌ی «مشاهده و رزرو» — هشت بار روی صفحه تکرار می‌شد و هر بار
           رشته‌ی کامل استایل در HTML می‌آمد. هاورش از کارت والد می‌آید. */
        .cta-lq {
          width:90%; text-align:center; padding:9px 0;
          background:rgba(199,166,106,0.12);
          border:1px solid ${GOLD_BOR};
          color:${CTA_INK}; font-size:13px; font-weight:700;
          font-family:var(--font-base);
          transition:box-shadow .3s ease, background .3s ease, transform .3s ease;
          box-shadow:0 0 0 rgba(199,166,106,0);
        }
        .cta-lq-sm { padding:6px 0; font-size:12px; }
        @media (hover:hover) {
          .club-card-x:hover .cta-lq {
            background:rgba(199,166,106,0.20);
            transform:translateY(-1px);
            box-shadow:0 8px 20px rgba(199,166,106,0.34);
          }
          .club-card-x:hover .cta-lq-sm { box-shadow:0 6px 16px rgba(199,166,106,0.32); }
        }
        .sec-title{font-size:clamp(28px,4vw,52px);font-weight:900;letter-spacing:-0.048em;line-height:0.96;margin:0 0 6px;}
        .sec-rule {height:3px;width:64px;border-radius:2px;margin-top:14px;background:linear-gradient(90deg,currentColor,transparent);}
        /* وردمارک outline پس‌زمینه‌ی هر سکشن — امضای هویت جدید */
        .sec-word{position:absolute;top:2px;inset-inline-end:-6px;font-weight:900;font-size:clamp(56px,9vw,120px);line-height:1;letter-spacing:0.03em;color:transparent;-webkit-text-stroke:1px var(--wc,rgba(28,27,23,0.06));user-select:none;pointer-events:none;direction:ltr;}
        /* خط مویی اریب — امضای برند */
        .sec-hair{position:absolute;top:-25%;bottom:-25%;width:1px;transform:rotate(14deg);pointer-events:none;}
        /* لبه‌های محو مارکی فروشندگان */
        .sellers-desk{-webkit-mask-image:linear-gradient(to right,transparent 0,black 4%,black 96%,transparent 100%);mask-image:linear-gradient(to right,transparent 0,black 4%,black 96%,transparent 100%);}

        .prod-hover{transition:transform .4s cubic-bezier(.4,0,.2,1),box-shadow .4s ease;}
        .prod-hover:hover{transform:translateY(-6px);box-shadow:0 20px 52px rgba(26,25,23,0.12)!important;}
        .news-img img{transition:transform .65s cubic-bezier(.4,0,.2,1);}
        .news-img:hover img{transform:scale(1.06);}

        .dp-tabs { grid-template-columns:repeat(4,1fr)!important; }
        .trust-strip { display:flex;gap:10px;flex-wrap:wrap;justify-content:center; }
        .hero-arrows { position:absolute;bottom:36px;right:28px;display:flex;gap:6px;z-index:10; }

        /* ══ TABLET ≤1100px ══ */
        @media(max-width:1100px){
          .clubs-grid  { grid-template-columns:1fr 1fr !important; }
          .mkt-split   { padding-bottom:8px !important; }
          .mkt-banners { grid-template-columns:1fr !important; }
          .news-grid   { grid-template-columns:1fr !important; }
        }

        /* ══ TABLET ≤900px ══ */
        @media(max-width:900px){
          .comm-grid   { grid-template-columns:repeat(2,1fr) !important; }
          .edu-split   { grid-template-columns:1fr !important; }
        }

        /* ══ MOBILE ≤720px ══ */
        @media(max-width:720px){
          .clubs-grid  { grid-template-columns:1fr !important; }
          .dp-tabs     { grid-template-columns:repeat(2,1fr) !important; }
        }

        /* ══ MOBILE ≤600px ══ */
        @media(max-width:600px){
          /* horizontal padding removed from hero-content; applied per-element below */
          /* env(safe-area-inset-top): در PWA اپل نوبار/استوری پایین می‌آیند، محتوا هم باید بیاید */
          .hero-content  { padding-top:calc(220px + env(safe-area-inset-top)) !important; padding-left:0 !important; padding-right:0 !important; padding-bottom:var(--hero-bottom-gap) !important; }
          .hero-h1       { font-size:clamp(23px,7.2vw,34px) !important; margin-bottom:12px !important; padding:0 16px !important; width:100% !important; box-sizing:border-box !important; }
          .hero-subtitle { padding:0 16px !important; width:100% !important; box-sizing:border-box !important; }
          .hero-ctas     { flex-direction:row !important; flex-wrap:nowrap !important; justify-content:center !important; padding:0 16px !important; width:100% !important; box-sizing:border-box !important; }
          .hero-cta-link { width:auto !important; }
          .hero-desc    { display:none !important; }
          .hero-sub     { display:none !important; }
          .hero-eyebrow { display:none !important; }
          .hero-actions { display:none !important; }
          .hero-arrows  { display:none !important; }
          .trust-strip  { display:flex !important; flex-wrap:nowrap !important; gap:6px !important; }
          .trust-box    { margin-top:43px !important; width:100% !important; box-sizing:border-box !important; padding:0 16px !important; display:flex !important; justify-content:center !important; overflow:visible !important; }
          .trust-grid   { zoom:0.43 !important; }
          .trust-label  { font-size:9.9px !important; }
          .trust-sub    { font-size:8.1px !important; }
          .feat-slider  { justify-content:flex-start !important; }
          .dp-tabs      { grid-template-columns:repeat(2,1fr) !important; }
          .dp-cta       { width:100% !important; }
          .comm-grid    { grid-template-columns:1fr 1fr !important; gap:12px !important; }
          .mkt-sub      { grid-template-columns:1fr !important; }
        }

        /* ══ 14-15 INCH / SHORT VIEWPORT (height ≤900px, wider than mobile) ══
           سقف از ۸۰۰ به ۹۰۰ رفت تا لپ‌تاپ‌های ۱۵ اینچ (ویوپورت ~۸۶۴) هم بگیرند */
        @media(max-height:900px) and (min-width:601px){
          .hero-stories-bar { zoom:0.90; }
          /* کل بلوک کمی پایین‌تر (+۱۲px) */
          .hero-content { padding-top:calc(clamp(177px,24.5vh,217px) + 60px + env(safe-area-inset-top)) !important; zoom:0.90; }
          .hero-h1      { zoom:0.95; margin-bottom:16px !important; }
          .hero-desc    { display:none !important; }
        }
        @media(max-height:680px) and (min-width:601px){
          .hero-content { padding-top:calc(clamp(157px,26vh,188px) + 54px + env(safe-area-inset-top)) !important; zoom:0.90; }
          .hero-sub     { display:none !important; }
        }

        /* ══ MOBILE — keep content just below stories bar ══ */
        @media(max-width:600px){
          /* گوشی‌های معمولی جا دارند ⇒ محتوا کمی پایین‌تر */
          .hero-content { padding-top:calc(252px + env(safe-area-inset-top)) !important; }
          .trust-strip  { margin-top:16px !important; }
        }
        /* گوشی‌های کوتاه (iPhone SE): جمع‌تر تا باکس اعتماد کامل در صفحه‌ی اول دیده شود */
        @media(max-width:600px) and (max-height:700px){
          .hero-content { padding-top:calc(196px + env(safe-area-inset-top)) !important; }
          .trust-box    { margin-top:16px !important; }
        }

        /* ══ MOBILE XS ≤400px ══ */
        @media(max-width:400px){
          .comm-grid { grid-template-columns:1fr !important; }
        }
        .feat-slider::-webkit-scrollbar { display: none; }
        .feat-card { transition: transform 0.22s ease; transform-origin: center; position: relative; }
        /* ── چرخش بی‌نهایت نرم کارت‌ها (فقط دسکتاپ) ──
           مارکی transform: محتوا دوبار رندر می‌شود و ترک ۵۰٪ جابه‌جا می‌شود ⇒ حلقه‌ی بی‌درز.
           gap صفر است و فاصله با margin-left هر کارت ساخته می‌شود تا نقطه‌ی ۵۰٪ دقیقاً
           هم‌ارز یک کپی کامل باشد (وگرنه هر دور یک پرش نیم‌gap دیده می‌شد). */
        @keyframes heroLoop { from { transform: translateX(0); } to { transform: translateX(50%); } }
        /* «باکس» کارت‌ها: ۷ کارت دائم داخل یک پنجره‌ی محدود می‌چرخند (دسکتاپ ~۶ کارت پیدا)
           ⇒ چون پنجره از تعداد کارت‌ها کوچک‌تر است، هیچ کارت تکراری هم‌زمان دیده نمی‌شود.
           لبه‌های باکس با ماسک محو می‌شوند تا ورود/خروج کارت‌ها نرم و شیک باشد. */
        .feat-slider {
          overflow:hidden !important; scroll-snap-type:none !important; justify-content:flex-start !important;
          -webkit-mask-image: linear-gradient(to right, transparent 0, black 7%, black 93%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, black 7%, black 93%, transparent 100%);
        }
        /* «will-change: transform» دائمی نیست: یک لایه‌ی کامپوزیت را
           برای همیشه زنده نگه می‌داشت حتی وقتی سکشن دیده نمی‌شد.
           حالا فقط وقتی انیمیشن واقعاً در جریان است اعمال می‌شود. */
        .feat-track { display:flex; gap:0; width:max-content; align-items:stretch; animation: heroLoop 44s linear infinite; }
        .feat-slider.in-view .feat-track { will-change: transform; }
        /* خارج از دید، انیمیشن متوقف می‌شود — مرورگر برای اسلایدری که
           کسی نمی‌بیند هر فریم کامپوزیت نمی‌کند. */
        .feat-slider:not(.in-view) .feat-track { animation-play-state: paused; }
        .feat-track .feat-card { margin-left:18px; }
        .feat-slider:hover .feat-track, .feat-slider:active .feat-track { animation-play-state: paused; }
        @media(min-width:901px){
          .feat-slider { max-width:860px; margin:0 auto; }   /* ≈ ۶ کارت */
        }
        @media(max-width:900px){
          .feat-track { animation-duration: 30s; }           /* موبایل هم همان چرخش نرم */
        }
        @media (prefers-reduced-motion: reduce){ .feat-track { animation:none !important; } }
        .clubs-mobile-slider { display:none; gap:10px; overflow-x:auto; scrollbar-width:none; padding:2px 18px 16px; scroll-snap-type:x proximity; }
        .clubs-mobile-slider::-webkit-scrollbar { display:none; }
        .club-mob-card { transform-origin:center; position:relative; }
        /* نوار اسکرولی دسکتاپ باشگاه‌ها — مثل بازار/فروشندگان */
        /* بدون scroll-snap: با چرخ ماوس، اسنپ حرکت را تکه‌تکه می‌کرد */
        .clubs-strip { display:flex; gap:14px; overflow-x:auto; scrollbar-width:none;
          padding:2px 2px 10px; overscroll-behavior-x:contain; cursor:grab; }
        .clubs-strip:active { cursor:grabbing; }
        .clubs-strip::-webkit-scrollbar { display:none; }
        .club-desk-card { flex:0 0 261px; }
        .clubs-dots { display:none !important; }
        .clubs-nav { position:absolute; top:44%; transform:translateY(-50%); z-index:3;
          width:36px; height:36px; border-radius:50%; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          background:rgba(255,255,255,0.92); border:1px solid rgba(28,27,23,0.10);
          color:#5B564B; box-shadow:0 4px 16px rgba(28,27,23,0.12);
          transition:transform .2s, color .2s; }
        .clubs-nav:hover { transform:translateY(-50%) scale(1.06); color:#9A6E38; }
        .mkt-mobile-slider { display:none; gap:10px; overflow-x:auto; scrollbar-width:none; padding:2px 18px 16px; scroll-snap-type:x proximity; }
        .mkt-mobile-slider::-webkit-scrollbar { display:none; }
        .mkt-split::-webkit-scrollbar { display:none; }
        .mkt-banners { margin-bottom:8px; }
        .mkt-mob-card { transform-origin:center; position:relative; }
        .mkt-dots { display:none !important; }
        .club-desk-panel { display:flex; }
        .club-mob-panel  { display:none; }
        /* لمس (بدون هاور واقعی): سایه‌ی هاور اینلاین خنثی — سایه‌ی سبک ثابت */
        @media (hover: none) {
          .club-card-x { box-shadow: 0 4px 14px rgba(0,0,0,0.08) !important; transform: none !important; }
        }
        .club-open-btn   { display:flex; }
        @keyframes open-dot-blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.25;transform:scale(0.55)} }
        .open-dot { animation:open-dot-blink 3.5s ease-in-out infinite; }
        @media(max-width:600px){
          .club-desk-panel { display:none !important; }
          .club-mob-panel  { display:flex !important; }
          /* پنل جا کم داشت و دکمه به کف می‌چسبید ⇒ عکس ۵۲٪، پنل ۴۸٪.
             اندازه‌گیری شد: با ۴۴٪ ارتفاع پنل ۱۲۹px بود و مجموع محتوا
             (تیتر + چیپ‌های میز + شهر + دکمه) با پدینگ کافی در آن جا
             نمی‌شد؛ دکمه ۸px از کف پنل بیرون می‌زد و overflow:hidden
             پایینش را می‌برید. حالا پنل بلندتر است تا پدینگ ۲۰px واقعاً
             دکمه را بالا بیاورد، نه اینکه از کادر بیرونش کند. */
          .club-img-x      { flex:0 0 48% !important; }
          .club-mob-panel  { flex:0 0 52% !important; }
          .club-open-btn   { display:flex !important; }
          .clubs-desk      { display:none !important; }
          .clubs-nav       { display:none !important; }
          .clubs-mobile-slider { display:flex !important; }
          /* padding-bottom در موبایل از clamp دسکتاپ ۵۶px می‌گرفت و با ۱۶px پدینگ خود اسلایدر
             ⇒ ۷۲px فضای خالی ته سکشن. حالا ۱۶+۲۴ = ۴۰px. */
          .clubs-section { padding-top:36px !important; padding-bottom:24px !important; padding-left:0 !important; padding-right:0 !important; }
          .clubs-hd { padding-left:14px !important; padding-right:14px !important; flex-wrap:nowrap !important; align-items:flex-end !important; margin-bottom:22px !important; }
          .marketplace-section { padding-left:0 !important; padding-right:0 !important; }
          .marketplace-hd { padding-left:14px !important; padding-right:14px !important; margin-bottom:22px !important; }
          .mkt-split { display:none !important; }
          .mkt-banners { grid-template-columns:1fr !important; margin:12px 14px 0 !important; }
          .mkt-desk-btns { display:none !important; }
          .mkt-mobile-slider { display:flex !important; }
        }

        /* ── Sellers ── */
        /* D1: راست / محتوای اصلی / چپ.
           gap عمداً صفر است و فاصله روی ستون «پر» می‌نشیند — وگرنه دو گپ
           ۱۴px حتی با ستون‌های خالی می‌ماند و چیدمان امروز جابه‌جا می‌شد.
           فقط :empty (بدون :has): سلکتور ناشناخته در لیست، کل قاعده را
           در مرورگرهای قدیمی باطل می‌کرد. AdSlot در حالت خالی null
           برمی‌گرداند پس div واقعاً :empty است. */
        .equip-grid { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:0; align-items:start; }
        .equip-side { width:0; }
        .equip-side:not(:empty) { width:clamp(150px,12.5vw,190px); }
        .equip-side:first-child:not(:empty) { margin-inline-end:14px; }
        .equip-side:last-child:not(:empty) { margin-inline-start:14px; }
        @media (max-width: 900px) {
          .equip-grid { grid-template-columns:1fr; }
          .equip-side:not(:empty) { width:100%; max-width:420px; }
          .equip-side:first-child:not(:empty) { margin:0 auto 14px; }
          .equip-side:last-child:not(:empty) { margin:14px auto 0; }
        }
        .sellers-desk { display:flex; flex-wrap:nowrap; gap:14px; overflow-x:auto; scrollbar-width:none; padding:4px 2px 16px; cursor:grab; user-select:none; }
        .sellers-desk::-webkit-scrollbar { display:none; }
        .sellers-mob  { display:none; gap:18px; overflow-x:auto; scrollbar-width:none; padding:2px 18px 16px; scroll-snap-type:x proximity; }
        .sellers-mob::-webkit-scrollbar  { display:none; }
        /* ── Services ── */
        .services-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        /* ── Responsive ── */
        @media(max-width:900px){
          .services-grid { grid-template-columns:repeat(2,1fr) !important; }
        }
        @media(max-width:600px){
          .sellers-desk { display:none !important; }
          .sellers-mob  { display:flex !important; }
          .services-grid { grid-template-columns:repeat(3,1fr) !important; gap:10px !important; }
          .sellers-section { padding-left:0 !important; padding-right:0 !important; }
          .sellers-hd { padding-left:14px !important; padding-right:14px !important; margin-bottom:22px !important; }
          .svc-section { padding-left:14px !important; padding-right:14px !important; }
          .banner-slider { height:200px !important; margin-top:0 !important; margin-bottom:0 !important; }
          .banner-cta-btn { font-size:11px !important; padding:7px 16px !important; gap:4px !important; }
          .stats-grid { grid-template-columns:repeat(3,1fr) !important; gap:8px !important; }
        }
        @media(max-width:900px){
          .stats-grid { grid-template-columns:repeat(4,1fr) !important; gap:10px !important; }
        }
      `}</style>

      {/* ╔══════════════════════════════════════════════════════╗
          ║  HERO — cinematic  video + wallpaper crossfade      ║
          ╚══════════════════════════════════════════════════════╝ */}
      {/* تصویرِ اسلایدِ اول روی خودِ ظرف می‌نشیند، نه فقط به‌عنوان
          `poster` ویدیو. دلیلش پایین‌تر، کنارِ محوشدنِ ویدیو. */}
      <div style={{
        /* ── چرا svh و نه dvh ──
           `dvh` یعنی «ارتفاعِ *پویا*ی کادرِ دید». در مرورگرِ موبایل
           نوارِ نشانی هنگام اسکرول جمع و باز می‌شود و همان لحظه مقدارِ
           dvh هم عوض می‌شود — یعنی **قدِ هیرو حین اسکرول تغییر
           می‌کند**، و چون همه‌ی بخش‌های بعدی زیرِ آن‌اند، کلِ صفحه بالا
           و پایین می‌پرد. همان لرزشی که دیده می‌شد.

           `svh` ارتفاعِ کادرِ دید را در حالتِ *کوچک* می‌گیرد و ثابت
           می‌ماند؛ نوار باز باشد یا بسته، عدد عوض نمی‌شود. */
        position: 'relative', height: isMobile ? 'auto' : '100svh',
        minHeight: isMobile ? '100svh' : '640px', overflow: 'hidden',
        background: '#04020A',
        backgroundImage: 'url(/images/hero/1.webp)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>

        {/* ── Layer 1: video (continuous motion background) ──

            سه هزینه‌ی این ویدیو اندازه‌گیری و کم شد:

            ۱) `preload="auto"` کل ۱٫۴ مگابایت را پیش از هر چیز دیگری
               دانلود می‌کرد و با تصویر هیرو (که LCP است) رقابت می‌کرد.
               حالا `metadata` است: مرورگر خودش هنگام پخش می‌گیردش.
            ۲) `poster` گذاشته شد تا تا آمدن ویدیو، همان تصویر سبک
               WebP دیده شود — نه پس‌زمینه‌ی مشکی.
            ۳) `willChange:'transform'` دائمی یک لایه‌ی کامپوزیت
               تمام‌صفحه را همیشه زنده نگه می‌داشت. حالا فقط وقتی
               اسکرول واقعاً هیرو را تغییر می‌دهد اعمال می‌شود. */}
        {/* ── چرا ویدیو محو می‌شود، نه اینکه یک‌باره بیاید ──
            پوستر و اسلایدِ اول یک تصویرند، ولی فریمِ اولِ ویدیو صحنه‌ی
            دیگری است. تا امروز لحظه‌ی آماده‌شدنِ ویدیو، آن تصویرِ ثابت
            **یک‌باره** جایش را به ویدیو می‌داد — و همان پرشی بود که
            دیده می‌شد.

            حالا تصویر روی خودِ ظرف است و ویدیو از شفافیتِ صفر روی آن
            محو می‌شود. عوض‌شدن همچنان همان لحظه است، ولی به‌جای پرش،
            یک گذارِ نرم دیده می‌شود.

            `poster` برداشته شد چون کارش را پس‌زمینه‌ی ظرف می‌کند؛
            نگه‌داشتنش یعنی همان تصویر دو بار کشیده شود. */}
        <video ref={el => { videoRef.current = el; heroVideoRef.current = el }}
          autoPlay muted loop playsInline preload="metadata"
          aria-hidden="true"
          onPlaying={e => { e.currentTarget.style.opacity = '1' }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 1,
            /* فیلتر برداشته شد و جایش یک پرده‌ی تیره‌ی ثابت آمد
               (لایه‌ی ۲٫۵). دو دلیل:

               ۱) `filter` روی ویدیوی تمام‌صفحه یعنی مرورگر **هر فریمِ
                  ویدیو** را دوباره فیلتر می‌کند. یک پرده‌ی رنگیِ ثابت
                  فقط یک‌بار کامپوزیت می‌شود.

               ۲) مهم‌تر: تا وقتی ویدیو یا پوستر نیامده بود، هیچ
                  تیرگی‌ای وجود نداشت و متنِ سفید روی صحنه‌ی روشن
                  ناخوانا می‌ماند — همان حالتِ یک‌ونیم ثانیه‌ای. پرده از
                  فریمِ اول آن‌جاست، پس آن پنجره اصلاً پیش نمی‌آید. */
            opacity: 0, transition: 'opacity 0.9s ease',
            /* مقدارِ اولیه؛ از این به بعد مستقیم روی گره نوشته می‌شود
               تا اسکرول رندرِ دوباره‌ی React نخواهد. */
            transform: 'scale(1)', transformOrigin: 'center',
            willChange: 'auto',
          }}>
          {/* منبعِ ویدیو تا آرام‌شدنِ مرورگر گذاشته نمی‌شود.

              `preload="metadata"` این‌جا کاری نمی‌کرد: `autoPlay` به
              مرورگر می‌گوید پخش کن، و برای پخش باید همه‌اش را بگیرد.
              اندازه‌گیری نشان داد کلِ فایل در همان پنجره‌ای می‌آمد که
              مرورگر باید متن و تصویرِ LCP را می‌کشید.

              پوستر همان تصویرِ اسلایدِ اول است و از قبل روی صفحه
              نشسته، پس این یک ثانیه تأخیر چیزی را خالی نمی‌گذارد —
              فقط ویدیو کمی دیرتر جانِ می‌گیرد. */}
          {spin && <source src="/images/video/hero.mp4" type="video/mp4" />}
        </video>

        {/* ── Layer 2: wallpaper slides crossfading over video ── */}
        {HERO_SLIDES.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0, zIndex: 2,
            opacity: i === slide ? 0.56 : 0,
            transition: 'opacity 3.6s cubic-bezier(0.33,0,0.15,1)',
            pointerEvents: 'none',
          }}>
            {/* اسلاید اول LCP است ⇒ اولویت صریح.

                بقیه تا آرام‌شدنِ مرورگر اصلاً در DOM نمی‌آیند.

                تا امروز این‌جا `loading="lazy"` بود با این توضیح که
                «تا نوبتشان نرسد درخواست نمی‌شوند» — ولی این‌طور نبود.
                هر چهار قاب `position:absolute; inset:0` هستند، یعنی از
                نظرِ مرورگر داخلِ کادرِ دید. `opacity:0` عنصر را از کادرِ
                دید بیرون نمی‌برد، پس lazy هیچ چیزی را عقب نمی‌انداخت و
                هر چهار عکس در همان بارگذاریِ اول می‌آمدند — اندازه‌گیریِ
                وزنِ صفحه دقیقاً همین را نشان داد.

                تنها چیزی که واقعاً درخواست را عقب می‌اندازد، نبودنِ
                خودِ عنصر است. سه اسلایدِ بعدی بعد از بی‌کارشدنِ مرورگر
                سوار می‌شوند — خیلی زودتر از نخستین چرخشِ کاروسل، پس
                محوشدنِ تصویرها هیچ فرقی نمی‌کند. */}
            {(i === 0 || spin || i === slide) && (
              <img src={s.bg} alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'low'}
                decoding="async"
                className="hero-parallax"
                /* روشنایی/اشباع/کنتراست برداشته شدند — کارشان را
                   پرده‌ی لایه‌ی ۲٫۵ می‌کند. `blur` مانده چون بخشی از
                   ظاهر است و روی یک تصویرِ ثابت فقط یک‌بار محاسبه
                   می‌شود، برخلافِ ویدیو که هر فریم بود. */
                style={{ width: '100%', height: '100%', objectFit: 'cover',
                  filter: 'blur(1.5px)',
                  transform: 'scale(1.02)', transformOrigin: 'center' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
          </div>
        ))}

        {/* ── Layer 2.5: پرده‌ی تیره ──
            جانشینِ `filter: brightness(...)` که روی ویدیو و تصویرها
            بود. یک رنگِ ثابت روی همه‌ی لایه‌های پس‌زمینه.

            چرا این‌جا و نه در همان گرادیان‌های لایه‌ی ۳: آن‌ها عمداً
            وسطِ کادر را شفاف می‌گذارند (بین ۲۶٪ و ۴۴٪ ارتفاع، و مرکزِ
            بیضی) تا تصویر دیده شود. ولی تیترِ هیرو دقیقاً همان‌جاست —
            یعنی خواناییِ متن هیچ پشتوانه‌ای جز فیلترِ ویدیو نداشت، و
            تا آمدنِ ویدیو اصلاً پشتوانه‌ای نبود.

            رنگ نزدیک به همان `brightness(0.52)` قبلی است. اشباع و
            کنتراست دقیقاً بازسازی نمی‌شوند — ولی نتیجه یکدست‌تر است،
            چون پیش‌تر ویدیو (۰٫۵۲) و تصویرها (۰٫۷۸) دو تیرگیِ متفاوت
            داشتند و روی هم می‌افتادند. */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'rgba(4,2,10,0.5)',
        }} />

        {/* ── Layer 3: cinematic gradients ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
          background: 'linear-gradient(to bottom,rgba(4,2,10,0.78) 0%,rgba(4,2,10,0) 26%,rgba(4,2,10,0) 44%,rgba(4,2,10,0.97) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 90% 82% at 50% 40%,transparent 22%,rgba(4,2,10,0.62) 100%)' }} />

        {/* ── Ambient accent orb — colour shifts with slide ── */}
        <div style={{
          position: 'absolute', top: '42%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'min(920px,130vw)', height: 'min(720px,90vh)',
          background: `radial-gradient(ellipse,${sl.accent}0A 0%,transparent 65%)`,
          filter: 'blur(90px)', zIndex: 3, pointerEvents: 'none',
          transition: 'background 3.2s ease',
          animation: 'floatOrb 28s ease-in-out infinite',
        }} />

        {/* Story bar is handled by Navbar → Stories.tsx */}

        {/* ── CONTENT — no key prop → animates exactly ONCE on page load ── */}
        <div className="hero-content" ref={heroContentRef} style={{
          position: isMobile ? 'relative' : 'absolute',
          inset: isMobile ? undefined : 0,
          minHeight: isMobile ? '100svh' : undefined,
          zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
          /* +60px جای eyebrow حذف‌شده — وگرنه تیتر می‌رفت زیر نوار استوری */
          padding: 'calc(clamp(189px,25vh,236px) + 60px + env(safe-area-inset-top)) clamp(16px,5%,80px) 0',
          /* ── چرا pointerEvents اینجاست ──
             در دسکتاپ این لایه `position:absolute; inset:0` است و
             کلِ هیرو را می‌پوشاند، با zIndex ۱۰. یعنی هر چیزی زیرش
             کلیک‌ناپذیر می‌شود، حتی جایی که هیچ متنی نیست.

             ظرف کلیک نمی‌خواهد؛ فقط فرزندانش (دکمه‌ها و لینک‌ها)
             می‌خواهند. پس ظرف شفافِ کلیک می‌شود و بچه‌ها دوباره
             فعال. */
          pointerEvents: 'none',
          /* مقدارِ اولیه؛ اسکرول مستقیم روی گره می‌نویسد */
          opacity: 1, transform: 'translateY(0)',
        }}>
          {/* Headline — رنگی با spans */}
          <h1 className="hb hero-h1" style={{
            fontSize: 'clamp(29px, 4.6vw, 66px)', fontWeight: 900, lineHeight: 1.08,
            margin: '0 0 22px', letterSpacing: '-0.03em', textAlign: 'center', whiteSpace: 'nowrap',
          }}>
            <span style={{ color: '#ffffff', textShadow: '0 2px 28px rgba(0,0,0,0.55)' }}>پلتفرم جامع و تخصصی </span>
            <span style={{ color: '#D4A843', textShadow: '0 2px 10px rgba(212,168,67,0.40), 0 2px 28px rgba(0,0,0,0.55)' }}>بیلیارد</span>
          </h1>

          {/* Subtitle — نقطه‌ی اتصال؛ عمداً کم‌وزن‌تر از تیتر */}
          {/* letter-spacing حذف شد: روی متن فارسی اتصال حروف چسبان (مثل «اتصال») را باز می‌کرد */}
          <p className="hc hero-subtitle" style={{
            fontSize: 'clamp(14px, 1.9vw, 21px)', fontWeight: 500,
            margin: '0 0 24px', textAlign: 'center', lineHeight: 1.7,
            color: 'rgba(255,255,255,0.66)', letterSpacing: 'normal',
            textShadow: '0 1px 16px rgba(0,0,0,0.45)',
          }}>
            اتصال بی‌واسطه؛ خانه‌ی دیجیتال جامعه‌ی بیلیارد{' '}
            {/* «ایران» با گرادیان عمودی پرچم: سبز → سفید → قرمز */}
            <span style={{
              fontWeight: 800,
              background: 'linear-gradient(180deg, #2EAD4F 0%, #2EAD4F 34%, #FFFFFF 44%, #FFFFFF 56%, #E03C31 66%, #E03C31 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
            }}>ایران</span>
          </p>

          {/* Feature card slider — 7 cards */}
          <div className="hd" style={{ width: '100%', marginTop: '16px', flexGrow: isMobile ? 1 : 0 }}>
            <div ref={sliderRef} className="feat-slider" style={{
              display: 'flex', overflowX: 'auto',
              scrollbarWidth: 'none', padding: '20px 22px 38px',
              justifyContent: 'center', alignItems: 'stretch',
              scrollSnapType: 'x mandatory',
            }}>
              {/* ترک حلقه — دسکتاپ: محتوا ×۲ + مارکی CSS؛ موبایل: کپی دوم مخفی و سوایپ عادی */}
              <div className="feat-track">
                {[...FEATURE_CARDS, ...FEATURE_CARDS].map((card, i) => {
                  const isDup  = i >= FEATURE_CARDS.length;
                  const active = i % FEATURE_CARDS.length === activeCard;
                  return (
                    <Link key={i} href={card.href} className={`feat-card${isDup ? ' feat-dup' : ''}`} style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', scrollSnapAlign: 'center' }}>
                      <div style={{
                        width: '118px', padding: '18px 10px 16px',
                        background: `linear-gradient(180deg, rgba(${card.rgb},0.11) 0%, rgba(10,9,14,0.34) 40%, rgba(10,9,14,0.42) 100%)`,
                        backdropFilter: 'blur(26px) saturate(160%)',
                        WebkitBackdropFilter: 'blur(26px) saturate(160%)',
                        border: `1px solid ${active ? 'rgba(199,166,106,0.52)' : 'rgba(255,255,255,0.13)'}`,
                        borderRadius: '20px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        textAlign: 'center', flex: 1,
                        boxShadow: active
                          ? 'inset 0 1px 0 rgba(255,255,255,0.14), 0 12px 32px rgba(0,0,0,0.42), 0 0 24px rgba(199,166,106,0.14)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 22px rgba(0,0,0,0.30)',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.35s ease, border-color 0.35s ease',
                      }}>
                        <div style={{
                          width: '46px', height: '46px', borderRadius: '14px',
                          background: `rgba(${card.rgb},0.12)`,
                          border: `1px solid rgba(${card.rgb},0.24)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          boxShadow: `0 0 14px rgba(${card.rgb},0.18), inset 0 1px 0 rgba(255,255,255,0.10)`,
                          marginBottom: '32px',
                        }}>
                          <card.Icon size={22} color={card.clr}
                            style={{ filter: `drop-shadow(0 0 5px rgba(${card.rgb},0.40))` }} />
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                          {card.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, flex: 1 }}>
                          {card.caption}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* نقطه‌های کاروسل — همیشه دقیقاً ۷ تا، یکنواخت (بدون محو فاصله‌ای که «سوراخ» می‌ساخت) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '18px' }}>
              {FEATURE_CARDS.map((_, i) => (
                <div key={i} style={{
                  height: '5px',
                  width: i === activeCard ? '20px' : '5px',
                  borderRadius: '3px', flexShrink: 0,
                  background: i === activeCard ? GOLD : 'rgba(255,255,255,0.25)',
                  boxShadow: i === activeCard ? '0 0 8px rgba(199,166,106,0.5)' : 'none',
                  transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
                }} />
              ))}
            </div>
          </div>

          {/* Trust items — unified box with 4 cells divided by thin lines */}
          <div className="he trust-box" style={{ marginTop: '44px' }}>
            <div className="trust-grid" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
              zoom: 0.8,
              background: 'rgba(10,9,14,0.30)',
              backdropFilter: 'blur(40px) saturate(170%)',
              WebkitBackdropFilter: 'blur(40px) saturate(170%)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 10px 36px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.14)',
              overflow: 'hidden',
            }}>
              {TRUST_ITEMS.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'row', alignItems: 'center',
                  gap: '9px', padding: '10px 14px',
                  borderLeft: i < 3 ? '1px solid rgba(255,255,255,0.09)' : 'none',
                }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: `rgba(${item.rgb},0.13)`,
                    border: `1px solid rgba(${item.rgb},0.22)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: `0 0 8px rgba(${item.rgb},0.14)`,
                  }}>
                    <item.Icon size={14} color={item.clr}
                      style={{ filter: `drop-shadow(0 0 3px rgba(${item.rgb},0.35))` }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="trust-label" style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap' }}>{item.label}</span>
                    <span className="trust-sub" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>


        {/* ── Prev/next arrows — hidden on mobile ── */}
        {/* فلش‌های چپ/راستِ گوشه‌ی هیرو برداشته شدند. کاروسل خودش
            هر هفت ثانیه می‌چرخد و آن دو دکمه فقط گوشه‌ی تصویر را
            شلوغ می‌کردند. */}

      </div>

      {/* §2 CLUB DISCOVERY ══════════════════════════════════════
          جایگاه featured_clubs_homepage غیرفعال ⇒ کل سکشن حذف */}
      {showClubs && (
      <section className="clubs-section" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#F3F1ED 0%,#EEECE6 100%)', padding: 'clamp(36px,3.5vw,52px) clamp(16px,5%,80px) clamp(56px,5.5vw,80px)' }}>
        <div aria-hidden style={{ position: 'absolute', top: '-18%', right: '-6%', width: 'min(520px,50vw)', height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,83,45,0.10) 0%, transparent 62%)', filter: 'blur(52px)', pointerEvents: 'none' }} />
        <div aria-hidden className="sec-hair" style={{ left: '28%', background: 'linear-gradient(180deg,transparent,rgba(20,83,45,0.28),transparent)' }} />
        <div aria-hidden className="sec-word" style={{ ['--wc' as never]: 'rgba(20,83,45,0.07)' }}>CLUBS</div>
        <div style={{ maxWidth: '1340px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <SR>
            <div className="clubs-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '44px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="sec-label" style={{ color: `${GRN}CC` }}>CLUB DISCOVERY</span>
                <h2 className="sec-title" style={{ color: TEXT, fontSize: 'clamp(20px,2.84vw,37px)' }}>باشگاه‌های پیشنهادی</h2>
                <div className="sec-rule" style={{ color: GRN }} />
              </div>
              <Link href="/clubs" className="see-all-lq">
                مشاهده همه <ArrowLeft size={12} />
              </Link>
            </div>
          </SR>
          {/* دسکتاپ — نوار اسکرولی مثل بازار/فروشندگان؛ کارت ۱۰٪ کوچک‌تر، ۸ باشگاه با اسکرول */}
          <div ref={clubsDeskRef} className="clubs-desk clubs-strip">
            {HOME_CLUBS.map((c, i) => (
              <div key={c.id} className="club-desk-card">
                <SR delay={Math.min(i, 4) * 60}><ClubCard club={c} h="clamp(303px,29.16vw,401px)" /></SR>
              </div>
            ))}
          </div>
          {/* موبایل — ۱۰٪ بزرگ‌تر (۴۳.۰۵ ⇒ ۴۷.۳۶vw) و فاصله‌ی کمتر بین کارت‌ها */}
          <div ref={clubsSliderRef} className="clubs-mobile-slider">
            {HOME_CLUBS.map((c) => (
              <div key={c.id} className="club-mob-card" style={{ width: '47.36vw', minWidth: '174px', flexShrink: 0, scrollSnapAlign: 'center' }}>
                <ClubCard club={c} h="clamp(261px,75.77vw,352px)" />
              </div>
            ))}
          </div>
          <div className="clubs-dots">
            {HOME_CLUBS.map((_, i) => (
              <div key={i} style={{
                height: '5px',
                width: i === activeClub ? '18px' : '5px',
                borderRadius: '3px',
                background: i === activeClub ? GOLD : 'rgba(26,25,23,0.22)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>
      </section>
      )}

      {/* §3 MARKETPLACE ═════════════════════════════════════════
          جایگاه market_featured_products_homepage غیرفعال ⇒ حذف سکشن */}
      {showProducts && (
      <section className="marketplace-section" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#FFFFFF 0%,#FBF9F5 100%)', padding: 'clamp(36px,3.5vw,52px) clamp(16px,5%,80px) clamp(20px,2vw,32px)' }}>
        <div aria-hidden style={{ position: 'absolute', top: '-16%', left: '-5%', width: 'min(480px,46vw)', height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,120,64,0.09) 0%, transparent 62%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(28,27,23,0.035) 1px, transparent 1px)', backgroundSize: '20px 20px', WebkitMaskImage: 'linear-gradient(100deg, transparent 55%, black 90%)', maskImage: 'linear-gradient(100deg, transparent 55%, black 90%)', pointerEvents: 'none' }} />
        <div aria-hidden className="sec-word" style={{ ['--wc' as never]: 'rgba(160,120,64,0.09)' }}>BAZAAR</div>
        <div style={{ maxWidth: '1340px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <SR>
            <div className="marketplace-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '44px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="sec-label mkt-label" style={{ color: `${BRN}CC` }}>BILLIARD BAZAAR</span>
                <h2 className="sec-title" style={{ color: TEXT, fontSize: 'clamp(20px,2.84vw,37px)' }}>بیلیارد بازار</h2>
                <div className="sec-rule" style={{ color: BRN }} />
              </div>
              <Link href="/shop" className="see-all-lq">
                مشاهده همه <ArrowLeft size={12} />
              </Link>
            </div>
          </SR>
          <div
            ref={mktDeskRef}
            className="mkt-split"
            style={{ display: 'flex', flexWrap: 'nowrap', gap: '14px', overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 2px 16px', cursor: 'grab', userSelect: 'none' }}
            onMouseEnter={() => { mktPausedRef.current = true; }}
            onMouseLeave={() => { mktPausedRef.current = false; }}
          >
            {MKT_LOOP.map((p, i) => (
              <BazaarCard key={`${p.id}-${i}`} p={p} style={{ width: 143, height: 274 }} />
            ))}
          </div>
          {/* موبایل — همان BazaarCard (فرمت یکسان با دسکتاپ) */}
          <div ref={mktSliderRef} className="mkt-mobile-slider">
            {HOME_PRODUCTS.map((p) => (
              <BazaarCard key={p.id} p={p} className="mkt-mob-card" style={{ width: '37.8vw', minWidth: 139, scrollSnapAlign: 'center', height: 'clamp(219px,64vw,296px)' }} />
            ))}
          </div>
          {/* ── Ad banners ── */}
          <div className="mkt-banners" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '4px' }}>
            <MktBanner
              slides={[IMG.snooker, IMG.cue, IMG.ball]}
              label="ویژه تابستان ۱۴۰۴"
              body="تا ۳۰٪ تخفیف روی<br/>میزهای حرفه‌ای"
              cta="خرید کن"
              accent={GOLD}
              href="/shop"
            />
            <MktBanner
              slides={[IMG.proTable, IMG.table, IMG.rest]}
              label="ارسال رایگان"
              body="چوب و لوازم<br/>اسنوکر حرفه‌ای"
              cta="مشاهده"
              accent={GRN}
              href="/shop"
              initialIdx={1}
            />
          </div>
          <div className="mkt-dots">
            {HOME_PRODUCTS.map((_, i) => (
              <div key={i} style={{ height: '5px', width: i === activeMkt ? '18px' : '5px', borderRadius: '3px', background: i === activeMkt ? GOLD : 'rgba(26,25,23,0.22)', transition: 'all 0.3s ease' }} />
            ))}
          </div>

          {/* ── دو جایگاهِ تبلیغِ زیرِ بیلیارد بازار ──

              قرینه‌ی همان دو تای سکشنِ تجهیزات. جایگاهِ خالی هیچ‌چیزی
              رندر نمی‌کند، پس تا وقتی تبلیغی خریده نشده این ردیف اصلاً
              دیده نمی‌شود و فاصله‌ی اضافه نمی‌سازد.

              در RTL ستونِ اول سمتِ راست است — همان ترتیبی که در فرمِ
              خرید هم نوشته شده. */}
          <div className="mkt-banners" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 20 }}>
            <div style={{ minWidth: 0 }}><AdSlot slot="market_ads_right" /></div>
            <div style={{ minWidth: 0 }}><AdSlot slot="market_ads_left" /></div>
          </div>
        </div>
      </section>
      )}

      {/* §3.5 MEDIA BAND — پوستر سینمایی بیلیارد مدیا ═══════
          تا آرام‌شدنِ مرورگر اصلاً سوار نمی‌شود؛ زیرِ خطِ اول است و
          کاربر پیش از اسکرول نمی‌بیندش. */}
      {spin && <HomeMediaBand />}

      {/* §4 SELLERS ═════════════════════════════════════════════
          سکشن تا وقتی «فهرست فروشگاه‌ها» یا یکی از دو بنر کناری
          محتوایی دارد رندر می‌شود — هر سه جایگاه مستقل‌اند. */}
      {showSellersSection && (
      <section className="sellers-section" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#F3F1ED 0%,#F0EDE7 100%)', padding: 'clamp(36px,3.5vw,52px) clamp(16px,5%,80px) clamp(20px,2vw,32px)' }}>
        <div aria-hidden style={{ position: 'absolute', top: '-20%', right: '10%', width: 'min(500px,48vw)', height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,166,106,0.13) 0%, transparent 62%)', filter: 'blur(52px)', pointerEvents: 'none' }} />
        <div aria-hidden className="sec-hair" style={{ left: '34%', background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.35),transparent)' }} />
        <div aria-hidden className="sec-word" style={{ ['--wc' as never]: 'rgba(154,110,56,0.08)' }}>SELLERS</div>
        <div style={{ maxWidth: '1340px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* عنوان فقط وقتی فهرستی زیرش هست — اگر جایگاه فروشگاه‌ها
              خاموش باشد و فقط بنر کناری بماند، تیتر بی‌محتوا نمی‌آید */}
          {showStores && (
          <SR>
            <div className="sellers-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '44px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="sec-label" style={{ color: `${GOLD}CC` }}>EQUIPMENT SELLERS</span>
                <h2 className="sec-title" style={{ color: TEXT, fontSize: 'clamp(20px,2.84vw,37px)' }}>فروشندگان تجهیزات</h2>
                <div className="sec-rule" style={{ color: GOLD }} />
              </div>
              <Link href="/sellers" className="see-all-lq">
                مشاهده همه <ArrowLeft size={12} />
              </Link>
            </div>
          </SR>
          )}

          {/* تصمیم D1 — چیدمان سه‌ستونه: تبلیغ راست / فروشگاه‌ها / تبلیغ چپ.
              جایگاه خالی هیچ‌چیزی رندر نمی‌کند و ستونش (auto) صفر می‌شود؛
              در موبایل ستون‌ها زیر هم می‌آیند تا هیچ Overflow ای پیش نیاید. */}
          <div className="equip-grid">
            <div className="equip-side">
              <AdSlot slot="equipment_ads_right" />
            </div>

            <div style={{ minWidth: 0 }}>
              {/* فهرست فروشگاه‌ها جدا از دو بنر کناری خاموش/روشن می‌شود */}
              {showStores && <>
                {/* Desktop auto-scroll row */}
                <div
                  ref={sellersRef}
                  className="sellers-desk"
                  onMouseEnter={() => { sellersPaused.current = true; }}
                  onMouseLeave={() => { sellersPaused.current = false; }}
                >
                  {SELLERS_LOOP.map((s, i) => (
                    <Link key={`${s.id}-${i}`} href={`/sellers/${s.id}`} style={{ width: '220px', flexShrink: 0, textDecoration: 'none', display: 'block' }}>
                      <SellerCard s={s} />
                    </Link>
                  ))}
                </div>

                {/* Mobile slider */}
                <div className="sellers-mob">
                  {HOME_SELLERS.map((s) => (
                    <Link key={s.id} href={`/sellers/${s.id}`} style={{ width: '53vw', minWidth: '176px', flexShrink: 0, scrollSnapAlign: 'center', textDecoration: 'none', display: 'block' }}>
                      <SellerCard s={s} />
                    </Link>
                  ))}
                </div>
              </>}
            </div>

            <div className="equip-side">
              <AdSlot slot="equipment_ads_left" />
            </div>
          </div>

          {/* ── Ad banners (LQ CTA) ── */}
          <div className="mkt-banners" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '20px' }}>
            <MktBanner
              slides={[IMG.cue, IMG.table, IMG.ball]}
              label="فروشندگان معتبر"
              body="بهترین فروشگاه‌های<br/>تجهیزات بیلیارد"
              cta="فروشگاه‌ها"
              accent={GOLD}
              href="/sellers"
              lqCta
            />
            <MktBanner
              slides={[IMG.snooker, IMG.proTable, IMG.rest]}
              label="خرید مطمئن"
              body="از فروشندگان<br/>تأییدشده"
              cta="مشاهده"
              accent={GOLD}
              href="/sellers"
              initialIdx={1}
              lqCta
            />
          </div>
        </div>
      </section>
      )}

      {/* §4 SERVICES — Server Component، از page.tsx به‌عنوان prop می‌آید.
          هیچ حالت و رویدادی ندارد، پس نباید جاوااسکریپت به مرورگر بفرستد.
          هاورش با CSS خالص بازسازی شد. */}
      {servicesSlot}

      {/* §5 EXPLORE STRIP — Server Component (هشت لینک ثابت، هاور با CSS) */}
      {exploreSlot}

      {/* §5 BANNER SLIDER ═══════════════════════════════════════ */}
      {/* جای اسلایدر رزرو می‌شود تا وقتی سوار شد صفحه تکان نخورد */}
      {spin
        ? <BannerSlider slides={BANNER_SLIDES} />
        : <div style={{ width: '100%', height: BANNER_SLIDER_HEIGHT, background: '#111' }} />}

      {/* §6 بنر بزرگ پایین صفحه — بالای فوتر، فقط همین صفحه.
          جایگاه مستقل: خالی/غیرفعال باشد هیچ فضایی اشغال نمی‌کند
          (فاصله روی خود AdSlot است، نه این قاب — قاب خالی نباید
          بین اسلایدر تیره و فوتر شکاف بیندازد). */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 clamp(16px,3vw,28px)' }}>
        <AdSlot slot="homepage_bottom_banner" style={{ margin: 'clamp(20px,3vw,32px) 0' }} />
      </div>

    </>
  );
}
