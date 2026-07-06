'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const GOLD     = '#C7A66A'
const TEXT     = '#1C1C1A'
const TEXT_SEC = 'rgba(28,28,26,0.52)'
const TEXT_MUT = 'rgba(28,28,26,0.30)'
const LQ_BG    = 'rgba(255,255,255,0.78)'
const LQ_BOR   = '1px solid rgba(255,255,255,0.85)'
const LQ_SHAD  = 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)'

function toFa(v: string | number) { return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d) }
function fmtN(n: number) { return n.toLocaleString('fa-IR') }

// ── Types ─────────────────────────────────────────────────────
interface MockProduct {
  id: number; name: string; category: string; description: string
  price: number; old: number; disc: number
  images: string[]
  sellerName: string; sellerPhone: string; sellerWhatsapp: string
  sellerCity: string; sellerRating: number; sellerVerified: boolean
  specs: Record<string, string>
}

// ── Mock Products (IDs 1-12 match shop/page.tsx PRODUCTS) ─────
const MOCK: Record<number, MockProduct> = {
  1: {
    id: 1, name: 'چوب حرفه‌ای Predator 314³', category: 'چوب بیلیارد',
    description: 'چوب Predator 314³ یکی از بهترین شفت‌های دنیا برای بازیکنان حرفه‌ای پول و اسنوکر است. ساخته‌شده از ۳ لایه چوب ماپل با تکنولوژی ۳۱۴ core، این شفت کمترین میزان spin را در هنگام ضربه دارد و دقت بی‌نظیری ارائه می‌دهد.\n\nقطر نوک: ۱۲.۹mm | جوینت: Uni-Loc Quick Release | طول شفت: ۷۱cm',
    price: 2800000, old: 3300000, disc: 15,
    images: ['/images/shop/cue_billiard_2.jpg', '/images/shop/cue_billiard.jpg', '/images/shop/accessori.png'],
    sellerName: 'فروشگاه چوب طلایی', sellerPhone: '09121110001', sellerWhatsapp: '989121110001',
    sellerCity: 'تهران', sellerRating: 4.8, sellerVerified: true,
    specs: { برند: 'Predator', سری: '314³ Shaft', قطر: '۱۲.۹ میلی‌متر', جنس: 'ماپل سه‌لایه', 'جوینت': 'Uni-Loc Quick Release', طول: '۷۱ سانتی‌متر', وزن: '۱۱۵ گرم', رنگ: 'طبیعی چوب' },
  },
  2: {
    id: 2, name: 'میز اسنوکر Dynamo Tournament', category: 'میز',
    description: 'میز حرفه‌ای Dynamo Tournament ۱۲ فوتی با سطح بازی از سنگ سلیت اصل و پارچه Simonis 760 آبی. این میز در مسابقات رسمی اسنوکر استفاده می‌شود و استاندارد WPBSA را دارد.\n\nابعاد بازی: ۳۵۶×۱۷۸cm | پارچه: Simonis 760 | پاکت: چرم طبیعی',
    price: 45000000, old: 50000000, disc: 10,
    images: ['/images/shop/snooker-table.jpg', '/images/shop/snooker-table-2.jpg', '/images/shop/Pro_table.jpg'],
    sellerName: 'بیلیارد حرفه‌ای ایران', sellerPhone: '09351110002', sellerWhatsapp: '989351110002',
    sellerCity: 'تهران', sellerRating: 4.6, sellerVerified: true,
    specs: { برند: 'Dynamo', مدل: 'Tournament ۱۲ فوت', سطح: 'سنگ سلیت اصل', پارچه: 'Simonis 760', پاکت: 'چرم طبیعی', ابعاد: '۳۵۶×۱۷۸ سانتی‌متر', وزن: '۸۵۰ کیلوگرم', استاندارد: 'WPBSA' },
  },
  3: {
    id: 3, name: 'توپ Aramith Pro Cup استاندارد WPBSA', category: 'توپ',
    description: 'ست کامل توپ‌های Aramith Pro Cup ساخته‌شده از رزین فنولیک اختصاصی Aramith. این توپ‌ها ۵ برابر دوام بیشتری نسبت به توپ‌های معمولی دارند و در مسابقات رسمی WPBSA استفاده می‌شوند.\n\nقطر: ۵۲.۵mm | وزن: ۱۴۲.۵g | جنس: رزین فنولیک اختصاصی',
    price: 1200000, old: 1500000, disc: 20,
    images: ['/images/shop/Ball-1.jpg', '/images/shop/Ball.jpg'],
    sellerName: 'فروشگاه توپ اصل', sellerPhone: '09011110003', sellerWhatsapp: '989011110003',
    sellerCity: 'مشهد', sellerRating: 4.7, sellerVerified: true,
    specs: { برند: 'Aramith', مدل: 'Pro Cup', قطر: '۵۲.۵ میلی‌متر', وزن: '۱۴۲.۵ گرم', جنس: 'رزین فنولیک', تعداد: '۲۲ توپ کامل', استاندارد: 'WPBSA', رنگبندی: 'استاندارد اسنوکر' },
  },
  4: {
    id: 4, name: 'گچ Master Blue Square — ۱۴۴ عددی', category: 'گچ',
    description: 'گچ Master Blue Square یکی از پراستفاده‌ترین گچ‌های بیلیارد در سطح جهان است. این گچ با فرمول مخصوص برای حداکثر چسبندگی به تیپ طراحی شده و اثر slide بسیار کمی ایجاد می‌کند.\n\nبسته ۱۴۴ عددی | رنگ: آبی | ساخت: آمریکا',
    price: 180000, old: 260000, disc: 31,
    images: ['/images/shop/pool_chalk_1.jpg', '/images/shop/pool_chalk_2.jpg'],
    sellerName: 'لوازم جانبی بیلیارد', sellerPhone: '09121110004', sellerWhatsapp: '989121110004',
    sellerCity: 'تهران', sellerRating: 4.5, sellerVerified: false,
    specs: { برند: 'Master', نوع: 'Blue Square', تعداد: '۱۴۴ عدد', رنگ: 'آبی', ساخت: 'آمریکا', 'مناسب برای': 'تیپ‌های نرم و متوسط', ابعاد: '۲.۵×۲.۵ سانتی‌متر' },
  },
  5: {
    id: 5, name: 'رست اسنوکر حرفه‌ای پیچ استنلس', category: 'رست',
    description: 'رست حرفه‌ای با پایه چوب راش و سر استنلس‌استیل ضدزنگ. طراحی ارگونومیک و پایه پیچ برای تنظیم دقیق ارتفاع. مناسب بازیکنان اسنوکر حرفه‌ای.\n\nطول: ۱۵۰ سانتی‌متر | سر: استنلس استیل | پایه: چوب راش',
    price: 450000, old: 480000, disc: 6,
    images: ['/images/shop/rest-pool.webp', '/images/shop/accessori.png'],
    sellerName: 'فروشگاه اکسسوری پلاس', sellerPhone: '09361110005', sellerWhatsapp: '989361110005',
    sellerCity: 'اصفهان', sellerRating: 4.3, sellerVerified: true,
    specs: { برند: 'Pro-Line', نوع: 'رست اسنوکر', طول: '۱۵۰ سانتی‌متر', پایه: 'چوب راش', سر: 'استنلس استیل', تنظیم: 'پیچ ارتفاع', وزن: '۴۵۰ گرم' },
  },
  6: {
    id: 6, name: 'کیف چوب بیلیارد دو قسمتی چرم', category: 'کیف و کِیس',
    description: 'کیف مدل دو قسمتی با رویه چرم طبیعی برای نگهداری ایمن چوب بیلیارد. دارای پدهای محافظ داخلی، زیپ برنجی ضدزنگ، و حلقه‌های فلزی تقویت‌شده.\n\nظرفیت: ۲ قسمت | رویه: چرم طبیعی | لایه داخلی: مخمل',
    price: 850000, old: 970000, disc: 12,
    images: ['/images/shop/accessori.png', '/images/shop/cue_billiard.jpg'],
    sellerName: 'کیف و کیس بیلیارد', sellerPhone: '09191110006', sellerWhatsapp: '989191110006',
    sellerCity: 'تهران', sellerRating: 4.4, sellerVerified: false,
    specs: { برند: 'ProCase', نوع: 'کیف دو قسمتی', رویه: 'چرم طبیعی', داخل: 'مخمل محافظ', زیپ: 'برنجی ضدزنگ', ظرفیت: '۲ قسمت چوب', طول: '۱۵۵ سانتی‌متر', رنگ: 'مشکی' },
  },
  7: {
    id: 7, name: 'چوب کربن فایبر Mezz EC7-CF', category: 'چوب بیلیارد',
    description: 'چوب کربن فایبر Mezz EC7-CF با بدنه کربن فایبر تمام، سبک‌ترین و مقاوم‌ترین چوب بیلیارد موجود در بازار. محبوب‌ترین انتخاب بازیکنان حرفه‌ای آسیا.\n\nقطر نوک: ۱۲.۸mm | جنس: کربن فایبر | وزن: ۱۰۸ گرم',
    price: 6500000, old: 7100000, disc: 8,
    images: ['/images/shop/cue_billiard.jpg', '/images/shop/cue_billiard_2.jpg'],
    sellerName: 'فروشگاه چوب طلایی', sellerPhone: '09121110001', sellerWhatsapp: '989121110001',
    sellerCity: 'تهران', sellerRating: 4.8, sellerVerified: true,
    specs: { برند: 'Mezz', سری: 'EC7-CF', قطر: '۱۲.۸ میلی‌متر', جنس: 'کربن فایبر', جوینت: 'Mezz WX700', طول: '۷۱.۲ سانتی‌متر', وزن: '۱۰۸ گرم', تیپ: 'Kamui Black Soft' },
  },
  8: {
    id: 8, name: 'توپ Cyclop Omega Pool Set', category: 'توپ',
    description: 'ست توپ پول Cyclop Omega با کیفیت اروپایی و ساخت رزین پلی‌استر پرچگالی. این توپ‌ها برای استفاده در میزهای pool 8-ball و 9-ball طراحی شده‌اند.\n\nقطر: ۵۷.۱۵mm | وزن: ۱۵۶g | تعداد: ۱۶ توپ',
    price: 950000, old: 1120000, disc: 15,
    images: ['/images/shop/Ball.jpg', '/images/shop/Ball-1.jpg'],
    sellerName: 'فروشگاه توپ اصل', sellerPhone: '09011110003', sellerWhatsapp: '989011110003',
    sellerCity: 'مشهد', sellerRating: 4.7, sellerVerified: true,
    specs: { برند: 'Cyclop', مدل: 'Omega', قطر: '۵۷.۱۵ میلی‌متر', وزن: '۱۵۶ گرم', جنس: 'رزین پلی‌استر', تعداد: '۱۶ توپ', نوع: 'Pool Set', ساخت: 'اروپا' },
  },
  9: {
    id: 9, name: 'میز بیلیارد خانگی — پایه چوب ماسیو', category: 'میز',
    description: 'میز بیلیارد خانگی با پایه‌های چوب ماسیو گردو و سطح بازی MDF با پارچه سبز. طراحی اسکاندیناوی مناسب برای خانه و اداره. ارسال و نصب رایگان در تهران.\n\nابعاد: ۲۱۰×۱۰۵cm | پارچه: سبز | پاکت: پلاستیک',
    price: 18000000, old: 19000000, disc: 5,
    images: ['/images/shop/Home_table.jpg', '/images/shop/Pro_table.jpg'],
    sellerName: 'میز ایران', sellerPhone: '09351110009', sellerWhatsapp: '989351110009',
    sellerCity: 'تهران', sellerRating: 4.5, sellerVerified: true,
    specs: { برند: 'میز ایران', نوع: 'میز خانگی', سطح: 'MDF با روکش پارچه', پایه: 'چوب ماسیو گردو', ابعاد: '۲۱۰×۱۰۵ سانتی‌متر', ارتفاع: '۸۰ سانتی‌متر', پارچه: 'سبز استاندارد', پاکت: 'پلاستیک با روکش چرم' },
  },
  10: {
    id: 10, name: 'گچ Predator 1080 Pure — ۵ عددی', category: 'گچ',
    description: 'گچ Predator 1080 Pure با تکنولوژی Micro-Abrasion برای چسبندگی بهتر به انواع تیپ. این گچ برای استفاده با چوب‌های کربن فایبر و تیپ‌های سخت طراحی شده است.\n\nبسته ۵ عددی | رنگ: آبی روشن | ساخت: آمریکا',
    price: 220000, old: 245000, disc: 10,
    images: ['/images/shop/pool_chalk_2.jpg', '/images/shop/pool_chalk_1.jpg'],
    sellerName: 'لوازم جانبی بیلیارد', sellerPhone: '09121110004', sellerWhatsapp: '989121110004',
    sellerCity: 'تهران', sellerRating: 4.5, sellerVerified: false,
    specs: { برند: 'Predator', مدل: '1080 Pure', تعداد: '۵ عدد', رنگ: 'آبی روشن', تکنولوژی: 'Micro-Abrasion', ساخت: 'آمریکا', 'مناسب برای': 'تیپ‌های سخت و کربن فایبر' },
  },
  11: {
    id: 11, name: 'میز اسنوکر Pro-Line ۱۲ فوتی', category: 'میز',
    description: 'میز اسنوکر Pro-Line با استانداردهای مسابقاتی جهانی. سطح سنگ سلیت ۳ تکه، پارچه Strachan 6811 مشکی، و پاکت چرم دست‌دوز. مناسب برای باشگاه‌ها و مسابقات.\n\nابعاد: ۳۶۶×۱۸۳cm | سلیت: ۳ تکه | پارچه: Strachan 6811',
    price: 68000000, old: 75000000, disc: 9,
    images: ['/images/shop/snooker-table-2.jpg', '/images/shop/snooker-table.jpg'],
    sellerName: 'بیلیارد حرفه‌ای ایران', sellerPhone: '09351110002', sellerWhatsapp: '989351110002',
    sellerCity: 'تهران', sellerRating: 4.6, sellerVerified: true,
    specs: { برند: 'Pro-Line', مدل: '۱۲ فوتی مسابقاتی', سلیت: '۳ تکه ایتالیایی', پارچه: 'Strachan 6811', پاکت: 'چرم دست‌دوز', ابعاد: '۳۶۶×۱۸۳ سانتی‌متر', ارتفاع: '۸۶ سانتی‌متر', وزن: '۱۲۰۰ کیلوگرم' },
  },
  12: {
    id: 12, name: 'میز بیلیارد حرفه‌ای پارچه ایتالیایی', category: 'میز',
    description: 'میز بیلیارد حرفه‌ای با پارچه Simonis 860HR ایتالیایی و بدنه MDF با روکش ونگه. پاکت‌های چرمی دست‌دوز و رویه سنگ سلیت ۲۵mm. گارانتی ۲ ساله.\n\nابعاد: ۲۸۰×۱۴۰cm | پارچه: Simonis 860HR | سلیت: ۲۵mm',
    price: 32000000, old: 36000000, disc: 11,
    images: ['/images/shop/Pro_table.jpg', '/images/shop/Home_table.jpg', '/images/shop/snooker-table.jpg'],
    sellerName: 'میز ایران', sellerPhone: '09351110009', sellerWhatsapp: '989351110009',
    sellerCity: 'تهران', sellerRating: 4.5, sellerVerified: true,
    specs: { برند: 'Pro Billiard', پارچه: 'Simonis 860HR ایتالیایی', سلیت: '۲۵ میلی‌متر', بدنه: 'MDF روکش ونگه', پاکت: 'چرم دست‌دوز', ابعاد: '۲۸۰×۱۴۰ سانتی‌متر', گارانتی: '۲ ساله', نصب: 'رایگان در تهران' },
  },
}

// ── Stars ─────────────────────────────────────────────────────
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} stroke="#f59e0b"
          strokeWidth={i <= Math.round(rating) ? 0 : 1.5}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

// ── Seller Card ───────────────────────────────────────────────
function SellerCard({ p }: { p: MockProduct }) {
  const waLink = `https://wa.me/${p.sellerWhatsapp}?text=${encodeURIComponent(`سلام، در مورد محصول «${p.name}» در بیلیارد هاب سوال داشتم`)}`
  return (
    <div style={{ background: LQ_BG, backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)', border: '1px solid rgba(199,166,106,0.28)', borderRadius: 20, padding: '20px', boxShadow: LQ_SHAD, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${GOLD},#A07840)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', boxShadow: '0 4px 14px rgba(199,166,106,0.38)', flexShrink: 0 }}>
          {p.sellerName.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{p.sellerName}</span>
            {p.sellerVerified && (
              <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.32)', color: GOLD, borderRadius: 20, padding: '1px 7px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                تأیید شده
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Stars rating={p.sellerRating} size={12} />
            <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{p.sellerRating}</span>
            <span style={{ fontSize: 12, color: TEXT_MUT }}>·</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUT} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize: 12, color: TEXT_MUT }}>{p.sellerCity}</span>
          </div>
        </div>
      </div>

      {/* phone row */}
      <a href={`tel:${p.sellerPhone}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', marginBottom: 12, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(199,166,106,0.32)', borderRadius: 12, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 3px 12px rgba(199,166,106,0.10)', textDecoration: 'none', position: 'relative', zIndex: 1, transition: 'background 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.92)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.75)')}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(199,166,106,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: TEXT_MUT, marginBottom: 1 }}>شماره تماس فروشنده</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, direction: 'ltr', letterSpacing: '0.04em' }}>{p.sellerPhone}</div>
        </div>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </a>

      {/* buttons */}
      <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
        <a href={`tel:${p.sellerPhone}`} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, background: `linear-gradient(135deg,${GOLD},#A07840)`, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.30), 0 4px 16px rgba(199,166,106,0.40)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          تماس با فروشنده
        </a>
        <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '12px 8px', borderRadius: 12, background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.28), 0 4px 16px rgba(37,211,102,0.32)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          ارسال پیام واتساپ
        </a>
      </div>
    </div>
  )
}

// ── Related Card ──────────────────────────────────────────────
function RelatedCard({ p }: { p: MockProduct }) {
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/shop/${p.id}`} style={{ textDecoration: 'none' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: '#fff', borderRadius: 16, border: `1.5px solid ${hov ? 'rgba(199,166,106,0.40)' : 'rgba(28,28,26,0.10)'}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', transform: hov ? 'translateY(-5px)' : 'none', boxShadow: hov ? '0 14px 36px rgba(28,28,26,0.11)' : '0 2px 8px rgba(28,28,26,0.05)', transition: 'all 0.26s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ width: '100%', paddingTop: '86%', position: 'relative', background: '#F4F3F1', overflow: 'hidden', flexShrink: 0 }}>
          <img src={p.images[0] ?? ''} alt={p.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.45s', transform: hov ? 'scale(1.06)' : 'scale(1)' }} />
          {p.disc > 0 && <div style={{ position: 'absolute', top: 8, left: 8, background: '#E53935', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 7, padding: '2px 7px' }}>{toFa(p.disc)}٪</div>}
        </div>
        <div style={{ padding: '10px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11.5, color: TEXT_MUT, fontWeight: 600 }}>{p.category}</span>
          <span style={{ fontSize: 12.5, color: TEXT, lineHeight: 1.5, fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</span>
          <div style={{ marginTop: 'auto', paddingTop: 5 }}>
            {p.disc > 0 && <div style={{ fontSize: 11, color: TEXT_MUT, textDecoration: 'line-through' }}>{fmtN(p.old)} تومان</div>}
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1A6B3A' }}>{fmtN(p.price)} <span style={{ fontSize: 11, fontWeight: 400 }}>تومان</span></div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams()
  const id     = Number(params.id)

  // Try mock first, then API
  const mockProduct = MOCK[id]

  const [product,  setProduct]  = useState<MockProduct | null>(mockProduct ?? null)
  const [loading,  setLoading]  = useState(!mockProduct)
  const [activeImg, setActiveImg] = useState(0)
  const [fading,   setFading]   = useState(false)
  const [zoom,     setZoom]     = useState(false)

  // Fetch from API only if no mock data
  useEffect(() => {
    if (mockProduct) return
    setLoading(true)
    fetch(`/api/products/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.product) {
          const ap = data.product
          const derived: MockProduct = {
            id: Number(ap.id), name: ap.title ?? ap.name ?? '', category: ap.category ?? '',
            description: ap.description ?? '', price: ap.price ?? 0,
            old: ap.price ?? 0, disc: ap.discountPercent ?? 0,
            images: ap.images?.length ? ap.images : ['/images/shop/cue_billiard_2.jpg'],
            sellerName: ap.sellerName ?? 'بیلیارد هاب', sellerPhone: ap.sellerPhone ?? '09121234567',
            sellerWhatsapp: (ap.sellerWhatsapp ?? ap.sellerPhone ?? '989121234567').replace(/^0/, '98'),
            sellerCity: ap.city ?? 'تهران', sellerRating: 4.5, sellerVerified: ap.isOfficialStore ?? false,
            specs: { دسته‌بندی: ap.category ?? '', وضعیت: ap.condition ?? 'نو', شهر: ap.city ?? '' },
          }
          setProduct(derived)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id, mockProduct])

  const changeImg = useCallback((i: number) => {
    if (i === activeImg) return
    setFading(true)
    setTimeout(() => { setActiveImg(i); setFading(false) }, 180)
  }, [activeImg])

  // Related: same category, different id
  const related = Object.values(MOCK).filter(p => p.category === product?.category && p.id !== id).slice(0, 4)

  const CATS: Record<string, string> = { 'چوب بیلیارد': 'چوب', میز: 'میز', توپ: 'توپ', گچ: 'گچ', رست: 'رست', 'کیف و کِیس': 'کیف' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: TEXT_MUT }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p>در حال بارگذاری...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (!product) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 16, opacity: 0.4 }}>🎱</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 20 }}>محصول پیدا نشد</p>
        <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `linear-gradient(135deg,${GOLD},#A07840)`, color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.30), 0 4px 16px rgba(199,166,106,0.42)' }}>
          <ChevronLeft size={16} /> بازگشت به فروشگاه
        </Link>
      </div>
    </div>
  )

  const imgs = product.images.length > 0 ? product.images : ['/images/shop/cue_billiard_2.jpg']

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes fadeImg { from{opacity:0} to{opacity:1} }
        * { box-sizing: border-box; }
        .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(24px,4vw,56px); align-items: start; }
        .rel-grid  { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        @media(max-width:900px) { .main-grid { grid-template-columns: 1fr !important; } }
        @media(max-width:900px) { .rel-grid  { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width:500px) { .rel-grid  { grid-template-columns: repeat(2,1fr) !important; } }
        .thumb { transition: border-color 0.2s, opacity 0.2s; cursor: pointer; }
        .thumb:hover { border-color: rgba(199,166,106,0.6) !important; opacity: 0.85 !important; }
      `}</style>

      {/* ambient */}
      <div style={{ position: 'fixed', top: -100, right: -80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(199,166,106,0.06) 0%,transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn,Tahoma,sans-serif', direction: 'rtl', color: TEXT }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px) 72px' }}>

          {/* ── Breadcrumb ── */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TEXT_MUT, marginBottom: 28, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: TEXT_MUT, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.color=GOLD)} onMouseLeave={e=>(e.currentTarget.style.color=TEXT_MUT)}>خانه</Link>
            <ChevronLeft size={12} />
            <Link href="/shop" style={{ color: TEXT_MUT, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.color=GOLD)} onMouseLeave={e=>(e.currentTarget.style.color=TEXT_MUT)}>فروشگاه</Link>
            <ChevronLeft size={12} />
            <span style={{ color: TEXT_SEC }}>{product.category}</span>
            <ChevronLeft size={12} />
            <span style={{ color: TEXT, fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
          </nav>

          {/* ── Main 2-col ── */}
          <div className="main-grid" style={{ marginBottom: 56 }}>

            {/* ── GALLERY (right in RTL) ── */}
            <div style={{ position: 'sticky', top: 24, animation: 'fadeUp 0.4s ease both' }}>

              {/* Main image */}
              <div onClick={() => setZoom(true)} style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#F0EFED', border: '1.5px solid rgba(28,28,26,0.09)', cursor: 'zoom-in', marginBottom: 10, aspectRatio: '1' }}>
                <img
                  key={activeImg}
                  src={imgs[activeImg]}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', animation: 'fadeImg 0.22s ease', opacity: fading ? 0 : 1, transition: 'opacity 0.18s' }}
                />
                {/* overlay gradient */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.25) 100%)', pointerEvents: 'none' }} />

                {/* discount badge */}
                {product.disc > 0 && (
                  <div style={{ position: 'absolute', top: 14, right: 14, width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', boxShadow: '0 6px 18px rgba(220,38,38,0.45)' }}>
                    {toFa(product.disc)}٪
                  </div>
                )}

                {/* zoom hint */}
                <div style={{ position: 'absolute', bottom: 14, left: 14, padding: '5px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(10px)', color: 'rgba(255,255,255,0.85)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                  بزرگ‌تر
                </div>
              </div>

              {/* Thumbnails */}
              {imgs.length > 1 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {imgs.map((img, i) => (
                    <button key={i} className="thumb" onClick={() => changeImg(i)} style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 12, overflow: 'hidden', border: `2px solid ${i === activeImg ? GOLD : 'rgba(255,255,255,0.88)'}`, background: i === activeImg ? '#F0EFED' : 'rgba(255,255,255,0.78)', backdropFilter: i === activeImg ? 'none' : 'blur(12px)', WebkitBackdropFilter: i === activeImg ? 'none' : 'blur(12px)', boxShadow: i === activeImg ? `inset 0 1px 0 rgba(255,255,255,0.5), 0 0 0 1px ${GOLD}44` : 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.07)', padding: 0, opacity: i === activeImg ? 1 : 0.78 }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── PRODUCT INFO (left in RTL) ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.46s ease both' }}>

              {/* category + condition */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, padding: '4px 13px', borderRadius: 20, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.28)', color: GOLD }}>
                  {CATS[product.category] ?? product.category}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, padding: '4px 13px', borderRadius: 20, background: 'rgba(26,107,58,0.08)', border: '1px solid rgba(26,107,58,0.22)', color: '#1A6B3A', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  کالای اصل
                </span>
              </div>

              {/* Name */}
              <h1 style={{ fontSize: 'clamp(20px,2.6vw,28px)', fontWeight: 900, color: TEXT, margin: 0, lineHeight: 1.4, letterSpacing: '-0.02em' }}>{product.name}</h1>

              {/* Price block */}
              <div style={{ background: '#fff', border: '1.5px solid rgba(28,28,26,0.08)', borderRadius: 18, padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 180, height: 180, background: 'radial-gradient(circle,rgba(199,166,106,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />
                {product.disc > 0 ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: TEXT_MUT, textDecoration: 'line-through' }}>{fmtN(product.old)} تومان</span>
                      <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626', borderRadius: 20, padding: '2px 9px' }}>
                        {toFa(product.disc)}٪ تخفیف
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                      <span style={{ fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 900, color: GOLD, lineHeight: 1 }}>{fmtN(product.price)}</span>
                      <span style={{ fontSize: 15, color: TEXT_SEC, fontWeight: 400 }}>تومان</span>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 13, color: GOLD, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(199,166,106,0.07)', borderRadius: 8, padding: '5px 11px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                      {fmtN(product.old - product.price)} تومان صرفه‌جویی
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                    <span style={{ fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 900, color: GOLD, lineHeight: 1 }}>{fmtN(product.price)}</span>
                    <span style={{ fontSize: 15, color: TEXT_SEC }}>تومان</span>
                  </div>
                )}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(28,28,26,0.06)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, boxShadow: `0 0 8px ${GOLD}99` }} />
                  <span style={{ fontSize: 14, color: GOLD, fontWeight: 600 }}>موجود — آماده ارسال</span>
                </div>
              </div>

              {/* Description */}
              <div style={{ background: LQ_BG, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: LQ_BOR, borderRadius: 18, boxShadow: LQ_SHAD, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none' }} />
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: TEXT, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 7, position: 'relative', zIndex: 1 }}>
                  <span style={{ width: 3, height: 14, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, display: 'inline-block' }}/>
                  توضیحات محصول
                </h3>
                <p style={{ fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.85, margin: 0, whiteSpace: 'pre-line', position: 'relative', zIndex: 1 }}>{product.description}</p>
              </div>

              {/* Seller Card */}
              <SellerCard p={product} />

              {/* Specs Table */}
              <div style={{ background: LQ_BG, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: LQ_BOR, borderRadius: 18, boxShadow: LQ_SHAD, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '46%', background: 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)', pointerEvents: 'none', zIndex: 0 }} />
                <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(28,28,26,0.07)', position: 'relative', zIndex: 1 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 800, color: TEXT, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 3, height: 14, background: `linear-gradient(180deg,${GOLD},#A07840)`, borderRadius: 2, display: 'inline-block' }}/>
                    مشخصات فنی
                  </h3>
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {Object.entries(product.specs).map(([key, val], i) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', background: i % 2 === 0 ? 'rgba(199,166,106,0.03)' : 'transparent', borderBottom: i < Object.keys(product.specs).length - 1 ? '1px solid rgba(28,28,26,0.05)' : 'none' }}>
                      <span style={{ fontSize: 13, color: TEXT_MUT, fontWeight: 500 }}>{key}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Related Products ── */}
          {related.length > 0 && (
            <section style={{ animation: 'fadeUp 0.55s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 11, color: GOLD, letterSpacing: '0.2em', fontWeight: 700, margin: '0 0 4px' }}>RELATED PRODUCTS</p>
                  <h2 style={{ fontSize: 'clamp(17px,2.2vw,22px)', fontWeight: 900, color: TEXT, margin: 0 }}>محصولات مشابه</h2>
                </div>
                <Link href="/shop" style={{ fontSize: 13, color: GOLD, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  مشاهده همه
                  <ChevronLeft size={13} strokeWidth={2.5} />
                </Link>
              </div>
              <div className="rel-grid">
                {related.map(p => <RelatedCard key={p.id} p={p} />)}
              </div>
            </section>
          )}
        </div>

        {/* ── Zoom Modal ── */}
        {zoom && (
          <div onClick={() => setZoom(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(18px)' }}>
            <img src={imgs[activeImg]} alt={product.name} style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }} />
            <button onClick={() => setZoom(false)} style={{ position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            {/* nav arrows */}
            {imgs.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); changeImg((activeImg - 1 + imgs.length) % imgs.length) }} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                <button onClick={e => { e.stopPropagation(); changeImg((activeImg + 1) % imgs.length) }} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
