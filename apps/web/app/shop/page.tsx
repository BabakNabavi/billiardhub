'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search, ShoppingBag, CheckCircle, MapPin, Package,
  ChevronLeft, ChevronRight, Zap, Timer, Filter, ShoppingCart, X
} from 'lucide-react';

interface Product {
  id: string; title: string; price: number;
  discountPrice?: number; discountPercent?: number;
  category: string; condition: string; city: string;
  images: string[]; isVerified: boolean; isOfficialStore: boolean;
  isDailyDeal: boolean; isSpecialSale: boolean;
  seller: { firstName: string; lastName: string; primaryRole: string };
}

function toFa(n: number) { return n.toLocaleString('fa-IR'); }
function pad(n: number) {
  return String(n).padStart(2, '0').replace(/\d/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)] ?? d)
}

function Countdown({ target, dark = false, small = false }: { target: Date; dark?: boolean; small?: boolean }) {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const ms = target.getTime() - Date.now();
      if (ms > 0) setT({ h: Math.floor((ms % 86400000) / 3600000), m: Math.floor((ms % 3600000) / 60000), s: Math.floor((ms % 60000) / 1000) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [target]);

  const fs = small ? '12px' : '16px';
  const pw = small ? '28px' : '40px';
  const pp = small ? '3px 5px' : '5px 8px';

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2px', direction: 'ltr', flexWrap: 'nowrap' }}>
      {[{ v: t.h, l: 'ساعت' }, { v: t.m, l: 'دقیقه' }, { v: t.s, l: 'ثانیه' }].map((x, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '2px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: dark ? 'rgba(0,0,0,0.35)' : '#ef4444', borderRadius: '6px', padding: pp, minWidth: pw, boxShadow: dark ? 'none' : '0 3px 10px rgba(239,68,68,0.3)' }}>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: fs, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pad(x.v)}</div>
            </div>
            <div style={{ color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(239,68,68,0.6)', fontSize: '8px', marginTop: '2px', fontWeight: 600 }}>{x.l}</div>
          </div>
          {i < 2 && <div style={{ color: dark ? 'rgba(255,255,255,0.4)' : '#ef4444', fontWeight: 900, fontSize: fs, paddingTop: '2px' }}>:</div>}
        </div>
      ))}
    </div>
  );
}

function HScrollRow({ children, itemWidth = 175, gap = 12 }: { children: React.ReactNode; itemWidth?: number; gap?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'prev' | 'next') => {
    if (!ref.current) return;
    const amount = (itemWidth + gap) * 3;
    ref.current.scrollBy({ left: dir === 'next' ? -amount : amount, behavior: 'smooth' });
  };
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => scroll('prev')} style={{ position: 'absolute', right: '-14px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', color: '#059669' }}>
        <ChevronRight size={16} />
      </button>
      <button onClick={() => scroll('next')} style={{ position: 'absolute', left: '-14px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', color: '#059669' }}>
        <ChevronLeft size={16} />
      </button>
      <div ref={ref} style={{ display: 'flex', gap: `${gap}px`, overflowX: 'auto', scrollBehavior: 'smooth', padding: '8px 4px', direction: 'rtl' }}>
        {children}
      </div>
    </div>
  );
}

const CatIcons: Record<string, (a: boolean, c: string) => React.ReactNode> = {
  all: (a, c) => <svg viewBox="0 0 28 28" fill="none" width="24" height="24"><rect x="2" y="2" width="10" height="10" rx="3" fill={a ? c : '#94a3b8'} /><rect x="16" y="2" width="10" height="10" rx="3" fill={a ? c : '#94a3b8'} opacity="0.6" /><rect x="2" y="16" width="10" height="10" rx="3" fill={a ? c : '#94a3b8'} opacity="0.6" /><rect x="16" y="16" width="10" height="10" rx="3" fill={a ? c : '#94a3b8'} /></svg>,
  table: (a, c) => <svg viewBox="0 0 28 28" fill="none" width="24" height="24"><rect x="2" y="8" width="24" height="14" rx="3" fill={a ? c : '#94a3b8'} /><rect x="4" y="10" width="20" height="10" rx="2" fill={a ? '#d1fae5' : '#e2e8f0'} /><circle cx="8" cy="15" r="2" fill={a ? c : '#64748b'} /><circle cx="14" cy="15" r="2" fill={a ? c : '#64748b'} /><circle cx="20" cy="15" r="2" fill={a ? c : '#64748b'} /><rect x="4" y="22" width="5" height="3" rx="1.5" fill={a ? c : '#94a3b8'} /><rect x="19" y="22" width="5" height="3" rx="1.5" fill={a ? c : '#94a3b8'} /></svg>,
  cue: (a, c) => <svg viewBox="0 0 28 28" fill="none" width="24" height="24"><line x1="4" y1="24" x2="24" y2="4" stroke={a ? c : '#94a3b8'} strokeWidth="3" strokeLinecap="round" /><circle cx="23" cy="5" r="3" fill={a ? '#f59e0b' : '#cbd5e1'} /></svg>,
  ball: (a, c) => <svg viewBox="0 0 28 28" fill="none" width="24" height="24"><circle cx="14" cy="14" r="11" fill={a ? c : '#94a3b8'} /><path d="M9 9 Q14 7 19 9 Q21 14 19 19 Q14 21 9 19 Q7 14 9 9Z" fill="white" opacity="0.2" /><circle cx="10" cy="10" r="2.5" fill="white" opacity="0.3" /></svg>,
  accessory: (a, c) => <svg viewBox="0 0 28 28" fill="none" width="24" height="24"><path d="M14 3L17 10H24L18 14.5L20.5 22L14 17.5L7.5 22L10 14.5L4 10H11L14 3Z" fill={a ? c : '#94a3b8'} /></svg>,
  clothing: (a, c) => <svg viewBox="0 0 28 28" fill="none" width="24" height="24"><path d="M14 4L9 7L2 10L5 15L9 12V25H19V12L23 15L26 10L19 7L14 4Z" fill={a ? c : '#94a3b8'} /></svg>,
  educational: (a, c) => <svg viewBox="0 0 28 28" fill="none" width="24" height="24"><rect x="4" y="4" width="14" height="20" rx="2" fill={a ? c : '#94a3b8'} /><rect x="8" y="9" width="7" height="2" rx="1" fill="white" opacity="0.8" /><rect x="8" y="13" width="7" height="2" rx="1" fill="white" opacity="0.6" /><rect x="8" y="17" width="5" height="2" rx="1" fill="white" opacity="0.4" /><rect x="16" y="7" width="8" height="17" rx="2" fill={a ? '#06b6d4' : '#cbd5e1'} /></svg>,
  other: (a, c) => <svg viewBox="0 0 28 28" fill="none" width="24" height="24"><rect x="3" y="3" width="22" height="22" rx="4" fill={a ? c : '#94a3b8'} /><circle cx="10" cy="10" r="2" fill="white" /><circle cx="18" cy="10" r="2" fill="white" /><circle cx="10" cy="18" r="2" fill="white" /><circle cx="18" cy="18" r="2" fill="white" /></svg>,
};

const categories = [
  { value: 'all', label: 'همه', color: '#10b981' },
  { value: 'table', label: 'میز بیلیارد', color: '#059669' },
  { value: 'cue', label: 'چوب', color: '#d97706' },
  { value: 'ball', label: 'توپ', color: '#dc2626' },
  { value: 'accessory', label: 'لوازم جانبی', color: '#2563eb' },
  { value: 'clothing', label: 'پوشاک', color: '#7c3aed' },
  { value: 'educational', label: 'آموزشی', color: '#0891b2' },
  { value: 'other', label: 'سایر', color: '#be185d' },
];

const conditionLabels: Record<string, string> = { new: 'نو', like_new: 'در حد نو', used: 'کارکرده' };
const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'فروشگاه رسمی', color: '#7c3aed' },
  seller: { label: 'فروشگاه', color: '#2563eb' },
  manufacturer: { label: 'تولیدکننده', color: '#059669' },
  player: { label: 'بازیکن', color: '#d97706' },
  coach: { label: 'مربی', color: '#ca8a04' },
  user: { label: 'کاربر', color: '#6b7280' },
};

const imgs = ['/images/billiadr-club-1.jpg', '/images/billiadr-club-2.jpg', '/images/billiadr-club-3.jpg'];
const [img0, img1, img2] = imgs as [string, string, string];

const sampleProducts: Product[] = [
  { id: '1', title: 'میز اسنوکر ویراکا مدل M1 Gold', price: 85000000, discountPrice: 72000000, discountPercent: 15, category: 'table', condition: 'new', city: 'تهران', images: [img0], isVerified: true, isOfficialStore: false, isDailyDeal: false, isSpecialSale: true, seller: { firstName: 'علی', lastName: 'محمدی', primaryRole: 'seller' } },
  { id: '2', title: 'چوب بیلیارد Predator 314-3', price: 12000000, discountPrice: 9600000, discountPercent: 20, category: 'cue', condition: 'like_new', city: 'مشهد', images: [img1], isVerified: true, isOfficialStore: false, isDailyDeal: true, isSpecialSale: true, seller: { firstName: 'رضا', lastName: 'احمدی', primaryRole: 'player' } },
  { id: '3', title: 'ست توپ اسنوکر Aramith Tournament', price: 4500000, discountPrice: 3800000, discountPercent: 16, category: 'ball', condition: 'new', city: 'اصفهان', images: [img2], isVerified: false, isOfficialStore: true, isDailyDeal: true, isSpecialSale: true, seller: { firstName: 'بیلیارد', lastName: 'پلاس', primaryRole: 'admin' } },
  { id: '4', title: 'گچ بیلیارد Master Blue Diamond ۱۴۴ عدد', price: 850000, discountPrice: 680000, discountPercent: 20, category: 'accessory', condition: 'new', city: 'تهران', images: [img0], isVerified: false, isOfficialStore: false, isDailyDeal: true, isSpecialSale: true, seller: { firstName: 'محمد', lastName: 'حسینی', primaryRole: 'seller' } },
  { id: '5', title: 'پایه چوب بیلیارد چرمی', price: 2200000, discountPrice: 1900000, discountPercent: 14, category: 'accessory', condition: 'new', city: 'تهران', images: [img1], isVerified: false, isOfficialStore: false, isDailyDeal: false, isSpecialSale: true, seller: { firstName: 'امیر', lastName: 'کریمی', primaryRole: 'manufacturer' } },
  { id: '6', title: 'میز پاکت بیلیارد ۷ فوت', price: 35000000, discountPrice: 28000000, discountPercent: 20, category: 'table', condition: 'used', city: 'شیراز', images: [img2], isVerified: false, isOfficialStore: false, isDailyDeal: true, isSpecialSale: true, seller: { firstName: 'حسین', lastName: 'علوی', primaryRole: 'user' } },
  { id: '7', title: 'کتاب آموزش اسنوکر استیو دیویس', price: 350000, discountPrice: 280000, discountPercent: 20, category: 'educational', condition: 'new', city: 'تهران', images: [img0], isVerified: false, isOfficialStore: true, isDailyDeal: true, isSpecialSale: true, seller: { firstName: 'بیلیارد', lastName: 'پلاس', primaryRole: 'admin' } },
  { id: '8', title: 'تی‌شرت اسپرت بیلیارد XL', price: 450000, discountPrice: 360000, discountPercent: 20, category: 'clothing', condition: 'new', city: 'تهران', images: [img1], isVerified: false, isOfficialStore: false, isDailyDeal: false, isSpecialSale: true, seller: { firstName: 'مجید', lastName: 'صادقی', primaryRole: 'seller' } },
  { id: '9', title: 'میز هی‌بال Artis Vienna Pro', price: 22000000, discountPrice: 18700000, discountPercent: 15, category: 'table', condition: 'new', city: 'تهران', images: [img2], isVerified: true, isOfficialStore: false, isDailyDeal: true, isSpecialSale: true, seller: { firstName: 'کاوه', lastName: 'موسوی', primaryRole: 'seller' } },
  { id: '10', title: 'چوب Mezz EC7 Wavy Joint', price: 8500000, discountPrice: 7200000, discountPercent: 15, category: 'cue', condition: 'new', city: 'مشهد', images: [img0], isVerified: true, isOfficialStore: false, isDailyDeal: false, isSpecialSale: false, seller: { firstName: 'سعید', lastName: 'رضایی', primaryRole: 'seller' } },
  { id: '11', title: 'توپ‌های پاکت Cyclop Galaxy', price: 3200000, discountPercent: 0, category: 'ball', condition: 'new', city: 'اصفهان', images: [img1], isVerified: false, isOfficialStore: false, isDailyDeal: false, isSpecialSale: false, seller: { firstName: 'نیما', lastName: 'کریمی', primaryRole: 'user' } },
  { id: '12', title: 'دستکش بیلیارد Riley', price: 320000, discountPrice: 256000, discountPercent: 20, category: 'accessory', condition: 'new', city: 'تهران', images: [img2], isVerified: false, isOfficialStore: false, isDailyDeal: false, isSpecialSale: false, seller: { firstName: 'مریم', lastName: 'احمدی', primaryRole: 'player' } },
];

const slides = [
  { bg: 'linear-gradient(135deg,#064e3b,#065f46)', img: imgs[0], badge: 'تا ۲۰٪ تخفیف', title: 'میزهای حرفه‌ای اسنوکر', sub: 'بهترین برندهای ایران و جهان', accent: '#10b981' },
  { bg: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)', img: imgs[1], badge: 'ارسال رایگان', title: 'چوب‌های حرفه‌ای', sub: 'Predator، Mezz، Riley و بیشتر', accent: '#60a5fa' },
  { bg: 'linear-gradient(135deg,#3b0764,#6d28d9)', img: imgs[2], badge: 'فرصت محدود', title: 'فروش ویژه فصل', sub: 'محصولات منتخب با تخفیف استثنایی', accent: '#a78bfa' },
];

function PCard({ p }: { p: Product }) {
  const [h, setH] = useState(false);
  const role = roleLabels[p.seller?.primaryRole];
  return (
    <div style={{ background: 'rgba(255,255,255,0.85)', border: `1px solid ${h ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.1)'}`, borderRadius: '18px', overflow: 'hidden', backdropFilter: 'blur(20px)', boxShadow: h ? '0 20px 50px rgba(16,185,129,0.15)' : '0 4px 18px rgba(16,185,129,0.07)', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)', transform: h ? 'translateY(-6px)' : 'translateY(0)', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      <div style={{ height: '180px', position: 'relative', overflow: 'hidden', flexShrink: 0, background: '#f0faf5' }}>
        {p.images?.[0]
          ? <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: h ? 'scale(1.07)' : 'scale(1)' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={48} style={{ color: 'rgba(16,185,129,0.2)' }} /></div>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.2) 100%)', opacity: h ? 1 : 0, transition: 'opacity 0.3s' }} />
        {(p.discountPercent || 0) > 0 && <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', boxShadow: '0 3px 10px rgba(239,68,68,0.4)' }}>{toFa(p.discountPercent!)}٪</div>}
        {p.isVerified && <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(16,185,129,0.9)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 9px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '3px' }}><CheckCircle size={10} /> تأیید شده</div>}
        {p.isOfficialStore && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>⭐ فروشگاه رسمی</div>}
      </div>
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f2318', lineHeight: 1.65, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '42px' }}>{p.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {role && <span style={{ fontSize: '10px', color: role.color, background: `${role.color}12`, borderRadius: '20px', padding: '3px 9px', fontWeight: 600 }}>{role.label}</span>}
          <span style={{ fontSize: '10px', color: 'rgba(26,46,36,0.4)', background: 'rgba(16,185,129,0.06)', borderRadius: '20px', padding: '3px 8px', border: '1px solid rgba(16,185,129,0.1)' }}>{conditionLabels[p.condition]}</span>
          {p.city && <span style={{ fontSize: '10px', color: 'rgba(26,46,36,0.35)', display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={9} />{p.city}</span>}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(16,185,129,0.08)', marginBottom: '10px' }}>
            {p.discountPrice
              ? <><div style={{ fontSize: '11px', color: 'rgba(26,46,36,0.3)', textDecoration: 'line-through' }}>{toFa(p.price)} تومان</div><div style={{ fontSize: '15px', fontWeight: 900, color: '#059669' }}>{toFa(p.discountPrice)} تومان</div></>
              : <div style={{ fontSize: '15px', fontWeight: 900, color: '#059669' }}>{toFa(p.price)} تومان</div>}
          </div>
          <Link href={`/shop/${p.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '12px', textDecoration: 'none', transition: 'all 0.3s', background: h ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(16,185,129,0.07)', border: `1px solid ${h ? 'transparent' : 'rgba(16,185,129,0.18)'}`, color: h ? '#fff' : '#059669', fontSize: '12px', fontWeight: 700, boxShadow: h ? '0 6px 20px rgba(16,185,129,0.3)' : 'none' }}>
            <ShoppingCart size={13} /> افزودن به سبد خرید
          </Link>
        </div>
      </div>
    </div>
  );
}

function SmallCard({ p }: { p: Product }) {
  const [h, setH] = useState(false);
  return (
    <Link href={`/shop/${p.id}`} style={{ textDecoration: 'none', flexShrink: 0, width: '155px', display: 'block', direction: 'rtl' }}>
      <div style={{ background: 'rgba(255,255,255,0.9)', border: `1px solid ${h ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.1)'}`, borderRadius: '14px', overflow: 'hidden', transition: 'all 0.3s', transform: h ? 'translateY(-4px)' : 'translateY(0)', boxShadow: h ? '0 12px 30px rgba(16,185,129,0.12)' : '0 2px 10px rgba(16,185,129,0.06)' }}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
        <div style={{ height: '95px', overflow: 'hidden', background: 'rgba(16,185,129,0.04)', position: 'relative' }}>
          {p.images?.[0]
            ? <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: h ? 'scale(1.08)' : 'scale(1)' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={32} style={{ color: 'rgba(16,185,129,0.2)' }} /></div>}
          {(p.discountPercent || 0) > 0 && <div style={{ position: 'absolute', top: '6px', right: '6px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '20px' }}>{p.discountPercent}٪</div>}
        </div>
        <div style={{ padding: '10px' }}>
          <div style={{ fontSize: '11px', color: '#0f2318', lineHeight: 1.5, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</div>
          {p.discountPrice && <div style={{ fontSize: '10px', color: 'rgba(26,46,36,0.3)', textDecoration: 'line-through' }}>{toFa(p.price)}</div>}
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>{toFa(p.discountPrice || p.price)} ت</div>
        </div>
      </div>
    </Link>
  );
}

function DealCard({ p }: { p: Product }) {
  const [h, setH] = useState(false);
  return (
    <Link href={`/shop/${p.id}`} style={{ textDecoration: 'none', flexShrink: 0, width: '180px', display: 'block', direction: 'rtl' }}>
      <div style={{ background: 'rgba(255,255,255,0.9)', border: `1px solid ${h ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.12)'}`, borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s', transform: h ? 'translateY(-4px)' : 'translateY(0)', boxShadow: h ? '0 16px 40px rgba(239,68,68,0.13)' : '0 2px 10px rgba(239,68,68,0.06)' }}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
        <div style={{ height: '125px', overflow: 'hidden', position: 'relative', background: 'rgba(16,185,129,0.04)' }}>
          {p.images?.[0]
            ? <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: h ? 'scale(1.08)' : 'scale(1)' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={40} style={{ color: 'rgba(16,185,129,0.2)' }} /></div>}
          {(p.discountPercent || 0) > 0 && <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '20px' }}>{toFa(p.discountPercent!)}٪</div>}
        </div>
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f2318', lineHeight: 1.5, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</div>
          <div style={{ borderTop: '1px solid rgba(239,68,68,0.08)', paddingTop: '8px' }}>
            {p.discountPrice && <div style={{ fontSize: '10px', color: 'rgba(26,46,36,0.3)', textDecoration: 'line-through' }}>{toFa(p.price)}</div>}
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#ef4444' }}>{toFa(p.discountPrice || p.price)} تومان</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ShopPage() {
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [slide, setSlide] = useState(0);
  const [stuck, setStuck] = useState(false);

  const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
  const specialDate = new Date(); specialDate.setDate(specialDate.getDate() + 7);
  const specials = sampleProducts.filter(p => p.isSpecialSale);
  const deals = sampleProducts.filter(p => p.isDailyDeal);

  const filtered = sampleProducts.filter(p => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (condition && p.condition !== condition) return false;
    if (onlyVerified && !p.isVerified) return false;
    if (search && !p.title.includes(search)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'cheapest') return (a.discountPrice || a.price) - (b.discountPrice || b.price);
    if (sortBy === 'expensive') return (b.discountPrice || b.price) - (a.discountPrice || a.price);
    if (sortBy === 'discount') return (b.discountPercent || 0) - (a.discountPercent || 0);
    return 0;
  });

  useEffect(() => { const fn = () => setStuck(window.scrollY > 60); window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn); }, []);
  useEffect(() => { const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000); return () => clearInterval(t); }, []);

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        .sr{min-height:100vh;background:linear-gradient(160deg,#f0faf5 0%,#e8f5ef 35%,#f4faf7 100%);position:relative;}
        .sr::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 18% 22%,rgba(16,185,129,0.07) 0%,transparent 50%),radial-gradient(ellipse at 82% 78%,rgba(6,182,212,0.05) 0%,transparent 50%);}
        .w{max-width:1280px;margin:0 auto;padding:0 32px;position:relative;z-index:1;}
        .wf{position:relative;z-index:1;}
        .ss{position:sticky;top:62px;z-index:200;padding:10px 0;transition:all 0.3s;}
        .ss.on{background:rgba(240,250,245,0.96);backdrop-filter:blur(24px);box-shadow:0 4px 24px rgba(16,185,129,0.08);border-bottom:1px solid rgba(16,185,129,0.07);}
        .sbar{background:rgba(255,255,255,0.92);border:1.5px solid rgba(16,185,129,0.18);border-radius:100px;height:52px;display:flex;align-items:center;padding:0 8px 0 22px;gap:12px;box-shadow:0 4px 24px rgba(16,185,129,0.09);transition:all 0.3s;backdrop-filter:blur(20px);}
        .sbar:focus-within{border-color:rgba(16,185,129,0.45);box-shadow:0 0 0 4px rgba(16,185,129,0.07);}
        .si{flex:1;border:none;outline:none;background:transparent;font-size:14px;color:#0f2318;font-family:inherit;}
        .si::placeholder{color:rgba(26,46,36,0.28);}
        .sbtn{background:rgba(255,255,255,0.95);border:1.5px solid rgba(16,185,129,0.22);border-radius:100px;height:38px;padding:0 22px;font-size:13px;font-weight:700;cursor:pointer;color:#059669;font-family:inherit;display:flex;align-items:center;gap:6px;transition:all 0.3s;}
        .sbtn:hover{background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.4);}
        .gc{background:rgba(255,255,255,0.82);border:1px solid rgba(16,185,129,0.1);border-radius:22px;backdrop-filter:blur(20px);box-shadow:0 4px 24px rgba(16,185,129,0.06),inset 0 1px 0 rgba(255,255,255,0.9);padding:22px;margin-bottom:22px;}
        .catbtn{border:none;background:none;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:7px;transition:transform 0.25s;flex-shrink:0;}
        .catbtn:hover{transform:translateY(-3px);}
        .hsc{overflow-x:auto;display:flex;gap:8px;padding-bottom:4px;}
        .hsc::-webkit-scrollbar{display:none;}
        .sp-box{background:rgba(255,255,255,0.82);border:1px solid rgba(16,185,129,0.1);border-radius:22px;overflow:hidden;margin-bottom:22px;backdrop-filter:blur(20px);box-shadow:0 4px 24px rgba(16,185,129,0.06);}
        .dl-box{background:linear-gradient(135deg,rgba(254,242,242,0.92),rgba(255,244,244,0.8));border:1px solid rgba(239,68,68,0.18);border-radius:22px;padding:22px;margin-bottom:22px;backdrop-filter:blur(20px);}
        .fp{background:rgba(255,255,255,0.9);border:1px solid rgba(16,185,129,0.12);border-radius:20px;padding:18px;backdrop-filter:blur(20px);box-shadow:0 4px 20px rgba(16,185,129,0.07);position:sticky;top:128px;}
        .fi{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;cursor:pointer;font-size:13px;color:rgba(26,46,36,0.5);transition:all 0.2s;}
        .fi:hover{background:rgba(16,185,129,0.05);color:#059669;}
        .fi.on{background:rgba(16,185,129,0.09);color:#059669;font-weight:700;}
        .flbl{font-size:10px;font-weight:700;color:rgba(26,46,36,0.35);letter-spacing:0.12em;margin-bottom:8px;padding:0 4px;}
        .fsel{width:100%;border:1px solid rgba(16,185,129,0.15);border-radius:12px;padding:9px 13px;font-size:13px;color:#0f2318;background:rgba(255,255,255,0.8);outline:none;cursor:pointer;font-family:inherit;}
        /* scroll بدون scrollbar */
        div[style*="overflowX"]::-webkit-scrollbar{display:none;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
        .pa{animation:fadeUp 0.4s ease forwards;opacity:0;}
        @media(max-width:900px){.sgrid{grid-template-columns:1fr !important;}.pgrid{grid-template-columns:repeat(2,1fr) !important;}.bgrid{grid-template-columns:1fr !important;}}
        @media(max-width:480px){.pgrid{grid-template-columns:1fr !important;}}
      `}</style>

      {/* STICKY SEARCH */}
      <div className={`ss ${stuck ? 'on' : ''}`}>
        <div className="w">
          <div className="sbar">
            <Search size={17} style={{ color: 'rgba(26,46,36,0.28)', flexShrink: 0 }} />
            <input className="si" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو در فروشگاه بیلیارد پلاس..." />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(26,46,36,0.3)', padding: '4px', display: 'flex' }}><X size={15} /></button>}
            <button className="sbtn"><Search size={13} /> جستجو</button>
          </div>
        </div>
      </div>

      <div className="sr" style={{ paddingTop: '16px', paddingBottom: '80px' }}>

        {/* ===== اسلایدر تمام عرض ===== */}
        <div className="wf" style={{ position: 'relative', height: '300px', marginBottom: '22px', overflow: 'hidden' }}>
          {slides.map((s, i) => (
            <div key={i} style={{ position: 'absolute', inset: 0, background: s.bg, opacity: i === slide ? 1 : 0, transition: 'opacity 0.8s ease', pointerEvents: i === slide ? 'auto' : 'none' }}>
              <img src={s.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(${s.accent}30,transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', padding: '0 64px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${s.accent}22`, border: `1px solid ${s.accent}40`, borderRadius: '20px', padding: '5px 14px', marginBottom: '18px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.accent, boxShadow: `0 0 8px ${s.accent}` }} />
                    <span style={{ color: s.accent, fontSize: '12px', fontWeight: 700 }}>{s.badge}</span>
                  </div>
                  <h2 style={{ color: '#fff', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.02em', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>{s.title}</h2>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '16px', margin: '0 0 28px' }}>{s.sub}</p>
                  <button style={{ background: '#fff', color: '#0f2318', border: 'none', borderRadius: '14px', padding: '13px 32px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>مشاهده محصولات ←</button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setSlide(s => (s - 1 + slides.length) % slides.length)} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}><ChevronRight size={20} /></button>
          <button onClick={() => setSlide(s => (s + 1) % slides.length)} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}><ChevronLeft size={20} /></button>
          <div style={{ position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
            {slides.map((_, i) => <button key={i} onClick={() => setSlide(i)} style={{ height: '6px', width: i === slide ? '24px' : '6px', borderRadius: '3px', background: i === slide ? '#fff' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', transition: 'all 0.35s', padding: 0 }} />)}
          </div>
        </div>

        <div className="w">

          {/* دسته‌بندی */}
          <div className="gc">
            <div style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.18em', fontWeight: 600, marginBottom: '16px' }}>CATEGORIES</div>
            <div className="hsc">
              {categories.map(c => {
                const a = cat === c.value;
                return (
                  <button key={c.value} className="catbtn" onClick={() => setCat(c.value)}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: a ? `${c.color}12` : 'rgba(255,255,255,0.9)', border: `2px solid ${a ? c.color : 'rgba(16,185,129,0.1)'}`, boxShadow: a ? `0 0 0 3px ${c.color}15,0 8px 24px ${c.color}15` : '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.3s' }}>
                      {CatIcons[c.value]?.(a, c.color)}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: a ? 700 : 500, color: a ? c.color : 'rgba(26,46,36,0.45)', whiteSpace: 'nowrap' }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* بنرها */}
          <div className="bgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '22px' }}>
            {[
              { bg: 'linear-gradient(135deg,#92400e,#d97706)', img: imgs[0], title: 'چوب‌های حرفه‌ای', sub: 'تا ۳۰٪ تخفیف', glow: '#d97706', icon: '🪄' },
              { bg: 'linear-gradient(135deg,#1e3a5f,#2563eb)', img: imgs[1], title: 'لوازم جانبی', sub: 'قیمت مناسب', glow: '#2563eb', icon: '🔧' },
              { bg: 'linear-gradient(135deg,#3b0764,#7c3aed)', img: imgs[2], title: 'محصولات آموزشی', sub: 'ارسال رایگان', glow: '#7c3aed', icon: '📚' },
            ].map((b, i) => (
              <div key={i} style={{ background: b.bg, borderRadius: '18px', height: '110px', overflow: 'hidden', position: 'relative', cursor: 'pointer', transition: 'all 0.35s', boxShadow: `0 6px 24px ${b.glow}22` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 18px 44px ${b.glow}30`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 24px ${b.glow}22`; }}>
                <img src={b.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>{b.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px' }}>{b.sub}</div>
                  </div>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '22px' }}>{b.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ===== پیشنهاد شگفت‌انگیز ===== */}
          <div className="sp-box">
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              {/* ستون قرمز */}
              <div style={{ width: '120px', minWidth: '120px', flexShrink: 0, background: 'linear-gradient(180deg,#ef4444,#dc2626)', padding: '16px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ textAlign: 'center', color: '#fff', fontWeight: 900, fontSize: '13px', lineHeight: 1.6 }}>پیشنهاد<br />شگفت‌<br />انگیز</div>
                <Countdown target={specialDate} dark small />
                <Link href="/shop" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none', fontWeight: 600 }}>همه <ChevronLeft size={11} /></Link>
              </div>
              {/* محصولات */}
              <div style={{ flex: 1, padding: '16px 12px', overflow: 'hidden' }}>
                <HScrollRow itemWidth={155} gap={10}>
                  {specials.map(p => <SmallCard key={p.id} p={p} />)}
                </HScrollRow>
              </div>
            </div>
          </div>

          {/* ===== تخفیف امروز ===== */}
          <div className="dl-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(239,68,68,0.35)', flexShrink: 0 }}>
                  <Zap size={22} style={{ color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#0f2318', fontSize: '18px', lineHeight: 1 }}>تخفیف امروز</div>
                  <div style={{ color: 'rgba(26,46,36,0.4)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><Timer size={11} /> فقط تا پایان امروز</div>
                </div>
              </div>
              <Countdown target={endOfDay} />
            </div>
            <HScrollRow itemWidth={180} gap={12}>
              {deals.map(p => <DealCard key={p.id} p={p} />)}
            </HScrollRow>
          </div>

          {/* ===== فیلتر + محصولات ===== */}
          <div className="sgrid" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'start' }}>
            <div className="fp">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h3 style={{ fontWeight: 800, color: '#0f2318', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}><Filter size={14} style={{ color: '#10b981' }} /> فیلترها</h3>
                {(condition || onlyVerified) && <button onClick={() => { setCondition(''); setOnlyVerified(false); }} style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '20px', padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'inherit' }}><X size={10} /> پاک کن</button>}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div className="flbl">وضعیت کالا</div>
                {[{ v: '', l: 'همه' }, { v: 'new', l: 'نو' }, { v: 'like_new', l: 'در حد نو' }, { v: 'used', l: 'کارکرده' }].map(c => (
                  <div key={c.v} className={`fi ${condition === c.v ? 'on' : ''}`} onClick={() => setCondition(c.v)}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${condition === c.v ? '#10b981' : 'rgba(26,46,36,0.18)'}`, background: condition === c.v ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                      {condition === c.v && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    {c.l}
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
                <div className="flbl">سایر</div>
                <div className={`fi ${onlyVerified ? 'on' : ''}`} onClick={() => setOnlyVerified(p => !p)}>
                  <CheckCircle size={14} style={{ color: onlyVerified ? '#10b981' : 'rgba(26,46,36,0.25)', transition: 'color 0.2s' }} />
                  فقط تأیید شده
                </div>
              </div>
              <div>
                <div className="flbl">مرتب‌سازی</div>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="fsel">
                  <option value="newest">جدیدترین</option>
                  <option value="cheapest">ارزان‌ترین</option>
                  <option value="expensive">گران‌ترین</option>
                  <option value="discount">بیشترین تخفیف</option>
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '4px', height: '22px', background: 'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius: '2px' }} />
                  <h2 style={{ fontWeight: 900, color: '#0f2318', fontSize: '18px', margin: 0 }}>{cat === 'all' ? 'همه محصولات' : categories.find(c => c.value === cat)?.label}</h2>
                  <span style={{ fontSize: '12px', color: 'rgba(26,46,36,0.4)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '20px', padding: '3px 10px', fontWeight: 600 }}>{toFa(filtered.length)} محصول</span>
                </div>
                <Link href="/shop/new" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                  <ShoppingBag size={14} /> فروش محصول
                </Link>
              </div>
              {filtered.length === 0
                ? <div style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(255,255,255,0.6)', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.08)' }}>
                  <div style={{ fontSize: '50px', marginBottom: '16px', opacity: 0.2 }}>🎱</div>
                  <p style={{ color: 'rgba(26,46,36,0.35)', fontSize: '16px', marginBottom: '16px' }}>محصولی پیدا نشد</p>
                  <button onClick={() => { setSearch(''); setCondition(''); setOnlyVerified(false); setCat('all'); }} style={{ padding: '10px 24px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', color: '#059669', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>پاک کردن فیلترها</button>
                </div>
                : <div className="pgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
                  {filtered.map((p, i) => (
                    <div key={p.id} className="pa" style={{ animationDelay: `${i * 0.04}s` }}>
                      <PCard p={p} />
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}