'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, ShoppingCart, Heart, Star, Zap, TrendingUp,
  ChevronLeft, ChevronRight, Shield, Truck, RefreshCw,
  Award, Filter, X, Check, SlidersHorizontal, Package,
  ArrowLeft, CheckCircle, Flame, Clock,
} from 'lucide-react';

/* ══ types ══ */
interface Product {
  id: string; title: string; brand: string; category: string;
  price: number; discountPrice?: number; discountPercent?: number;
  rating: number; reviewCount: number; stock: number;
  condition: string; city: string; img: string;
  isNew?: boolean; isFeatured?: boolean; isDeal?: boolean;
  isOfficialStore?: boolean; seller: string;
  tags: string[];
}

/* ══ data ══ */
const BRANDS = [
  { name:'PREDATOR',  color:'#10b981', desc:'چوب‌های حرفه‌ای',    items:24 },
  { name:'ARAMITH',   color:'#06b6d4', desc:'توپ‌های مسابقاتی',  items:18 },
  { name:'VIRAKA',    color:'#f59e0b', desc:'میزهای ایرانی',      items:12 },
  { name:'RILEY',     color:'#a78bfa', desc:'تجهیزات انگلیسی',   items:31 },
  { name:'BRUNSWICK', color:'#ef4444', desc:'میزهای آمریکایی',    items:9  },
  { name:'MEZZ',      color:'#06b6d4', desc:'چوب‌های ژاپنی',     items:16 },
];

const CATEGORIES = [
  { key:'all',       label:'همه',            icon:'🎱', color:'#10b981', count:148 },
  { key:'cue',       label:'چوب بیلیارد',    icon:'🪄', color:'#f59e0b', count:47  },
  { key:'ball',      label:'توپ',            icon:'⚪', color:'#06b6d4', count:23  },
  { key:'table',     label:'میز بیلیارد',    icon:'🟩', color:'#10b981', count:19  },
  { key:'accessory', label:'لوازم جانبی',    icon:'🧰', color:'#a78bfa', count:38  },
  { key:'clothing',  label:'پوشاک',          icon:'👕', color:'#ef4444', count:21  },
  { key:'training',  label:'تمرین و آموزش',  icon:'📚', color:'#f59e0b', count:15  },
  { key:'lighting',  label:'نورپردازی',      icon:'💡', color:'#fbbf24', count:8   },
];

const img1 = '/images/billiadr-club-1.jpg';
const img3 = '/images/billiadr-club-3.jpg';

const ALL_PRODUCTS: Product[] = [
  { id:'1',  title:'چوب Predator 314-3',          brand:'PREDATOR',  category:'cue',       price:12000000, discountPrice:9600000,  discountPercent:20, rating:4.9, reviewCount:47, stock:3,  condition:'new',      city:'تهران',  img:img1, isFeatured:true, isDeal:true,  isOfficialStore:true,  seller:'بیلیارد پلاس',      tags:['حرفه‌ای','Low Deflection'] },
  { id:'2',  title:'ست توپ Aramith Tournament',   brand:'ARAMITH',   category:'ball',      price:4500000,  discountPrice:3800000,  discountPercent:16, rating:4.8, reviewCount:83, stock:8,  condition:'new',      city:'تهران',  img:img3, isFeatured:true, isNew:true,   isOfficialStore:true,  seller:'بیلیارد پلاس',      tags:['مسابقاتی','بلژیک'] },
  { id:'3',  title:'میز اسنوکر Viraka M1 Gold',   brand:'VIRAKA',    category:'table',     price:85000000, discountPrice:72000000, discountPercent:15, rating:4.7, reviewCount:31, stock:2,  condition:'new',      city:'تهران',  img:img1, isFeatured:true,             isOfficialStore:false, seller:'ویراکا',             tags:['ایرانی','طلایی'] },
  { id:'4',  title:'گچ Master Blue Diamond ۱۴۴',  brand:'MASTER',    category:'accessory', price:850000,   discountPrice:680000,   discountPercent:20, rating:4.6, reviewCount:124,stock:50, condition:'new',      city:'تهران',  img:img3, isDeal:true,                  isOfficialStore:false, seller:'محمد حسینی',         tags:['گچ','مسابقاتی'] },
  { id:'5',  title:'چوب Mezz EC7 Wavy Joint',     brand:'MEZZ',      category:'cue',       price:8500000,  discountPrice:7200000,  discountPercent:15, rating:4.8, reviewCount:29, stock:4,  condition:'new',      city:'مشهد',   img:img1,                                               isOfficialStore:false, seller:'سعید رضایی',         tags:['ژاپن','حرفه‌ای'] },
  { id:'6',  title:'میز پاکت Brunswick 7ft',      brand:'BRUNSWICK', category:'table',     price:35000000, discountPrice:28000000, discountPercent:20, rating:4.5, reviewCount:18, stock:1,  condition:'used',     city:'شیراز',  img:img3, isDeal:true,                  isOfficialStore:false, seller:'حسین علوی',          tags:['پاکت','کارکرده'] },
  { id:'7',  title:'کتاب آموزش اسنوکر پیشرفته',  brand:'SNOOKER',   category:'training',  price:350000,   discountPrice:280000,   discountPercent:20, rating:4.4, reviewCount:67, stock:30, condition:'new',      city:'تهران',  img:img1, isNew:true,                   isOfficialStore:true,  seller:'بیلیارد پلاس',      tags:['آموزش','کتاب'] },
  { id:'8',  title:'تی‌شرت اسپرت بیلیارد XL',    brand:'CUSTOM',    category:'clothing',  price:450000,   discountPrice:360000,   discountPercent:20, rating:4.2, reviewCount:34, stock:15, condition:'new',      city:'تهران',  img:img3,                                               isOfficialStore:false, seller:'مجید صادقی',         tags:['پوشاک','XL'] },
  { id:'9',  title:'دستکش بیلیارد Riley Pro',     brand:'RILEY',     category:'accessory', price:320000,   undefined,              undefined,         rating:4.7, reviewCount:52, stock:20, condition:'new',      city:'تهران',  img:img1,                                               isOfficialStore:false, seller:'مریم احمدی',         tags:['دستکش','حرفه‌ای'] },
  { id:'10', title:'توپ‌های پاکت Cyclop Galaxy',  brand:'CYCLOP',    category:'ball',      price:3200000,  undefined,              undefined,         rating:4.6, reviewCount:21, stock:6,  condition:'new',      city:'اصفهان', img:img3, isNew:true,                   isOfficialStore:false, seller:'نیما کریمی',         tags:['پاکت','کره‌ای'] },
  { id:'11', title:'چوب Riley Aristocrat 3/4',    brand:'RILEY',     category:'cue',       price:6800000,  discountPrice:5800000,  discountPercent:15, rating:4.5, reviewCount:38, stock:5,  condition:'new',      city:'تهران',  img:img1,                                               isOfficialStore:false, seller:'علی موسوی',          tags:['انگلیس','سه‌چهارم'] },
  { id:'12', title:'پایه چوب چرمی دستدوز',       brand:'CUSTOM',    category:'accessory', price:2200000,  discountPrice:1900000,  discountPercent:14, rating:4.3, reviewCount:19, stock:8,  condition:'new',      city:'تهران',  img:img3,                                               isOfficialStore:false, seller:'امیر کریمی',         tags:['چرمی','دستدوز'] },
];

const HERO_SLIDES = [
  { bg:'linear-gradient(135deg,#064e3b,#065f46)', accent:'#10b981', img:img1, badge:'تا ۲۰٪ تخفیف', title:'تجهیزات حرفه‌ای', sub:'بهترین برندهای جهانی در یک پلتفرم', cta:'مشاهده محصولات', tag:'FEATURED' },
  { bg:'linear-gradient(135deg,#1c1400,#3d2b00)', accent:'#f59e0b', img:img3, badge:'ارسال رایگان', title:'چوب‌های انتخابی',  sub:'Predator، Mezz، Riley و بیشتر',      cta:'خرید چوب',       tag:'CUES' },
  { bg:'linear-gradient(135deg,#0f0720,#2d1b69)', accent:'#a78bfa', img:img1, badge:'جدیدترین‌ها',  title:'کلکسیون جدید',    sub:'محصولات تازه‌وارد فصل ۱۴۰۴',         cta:'محصولات جدید',   tag:'NEW ARRIVALS' },
];

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

/* ══ ProductCard ══ */
function ProductCard({ p, size = 'md' }: { p: Product; size?: 'sm' | 'md' | 'lg' }) {
  const [hovered, setHovered] = useState(false);
  const [wished,  setWished]  = useState(false);
  const [added,   setAdded]   = useState(false);
  const finalPrice = p.discountPrice ?? p.price;
  const imgH = size === 'sm' ? '120px' : size === 'lg' ? '240px' : '170px';

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link href={`/shop/${p.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ background: hovered ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.028)', border: `1px solid ${hovered ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '18px', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', transform: hovered ? 'translateY(-6px)' : 'none', boxShadow: hovered ? '0 20px 52px rgba(0,0,0,0.5),0 0 0 1px rgba(16,185,129,0.08)' : '0 4px 18px rgba(0,0,0,0.25)', height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Image */}
        <div style={{ height: imgH, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <img src={p.img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.38) saturate(0.6)', transition: 'transform 0.6s ease', transform: hovered ? 'scale(1.07)' : 'scale(1)' }} onError={e => { (e.target as HTMLImageElement).src = img1; }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 35%,rgba(6,13,10,0.85) 100%)' }} />

          {/* Badges */}
          <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {(p.discountPercent ?? 0) > 0 && <div style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 9px', borderRadius: '20px', boxShadow: '0 3px 10px rgba(239,68,68,0.4)' }}>{toFa(p.discountPercent!)}٪</div>}
            {p.isNew     && <div style={{ background: 'rgba(16,185,129,0.85)',  backdropFilter: 'blur(8px)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px' }}>جدید</div>}
            {p.isDeal    && <div style={{ background: 'rgba(245,158,11,0.85)',  backdropFilter: 'blur(8px)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '2px' }}><Zap size={8} />پیشنهاد</div>}
          </div>

          {/* Wish button */}
          <button onClick={e => { e.preventDefault(); setWished(w => !w); }}
            style={{ position: 'absolute', top: '10px', left: '10px', width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', color: wished ? '#ef4444' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <Heart size={13} style={{ fill: wished ? '#ef4444' : 'transparent' }} />
          </button>

          {/* Brand */}
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '9px', fontWeight: 700, color: 'rgba(240,250,245,0.5)', letterSpacing: '0.1em' }}>{p.brand}</div>

          {/* Official badge */}
          {p.isOfficialStore && <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(167,139,250,0.85)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: '8px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '2px' }}><Shield size={7} />رسمی</div>}
        </div>

        {/* Content */}
        <div style={{ padding: '14px 14px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#f0faf5', lineHeight: 1.6, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.005em' }}>{p.title}</h3>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '1px' }}>
              {[1,2,3,4,5].map(s => <Star key={s} size={10} style={{ color: '#f59e0b', fill: s <= Math.floor(p.rating) ? '#f59e0b' : 'transparent' }} />)}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>{p.rating}</span>
            <span style={{ fontSize: '10px', color: 'rgba(240,250,245,0.25)' }}>({toFa(p.reviewCount)})</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 14px 14px', marginTop: 'auto' }}>
          <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
            {p.discountPrice && <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.25)', textDecoration: 'line-through', marginBottom: '2px' }}>{toFa(p.price.toLocaleString())} تومان</div>}
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#10b981', letterSpacing: '-0.02em', textShadow: '0 0 16px rgba(16,185,129,0.35)' }}>
              {toFa(finalPrice.toLocaleString())} <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.7 }}>تومان</span>
            </div>
          </div>

          <button onClick={handleAdd}
            style={{ width: '100%', padding: '9px', borderRadius: '11px', border: 'none', background: added ? 'rgba(16,185,129,0.15)' : hovered ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(16,185,129,0.07)', color: added ? '#10b981' : hovered ? '#fff' : '#10b981', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: hovered && !added ? '0 6px 18px rgba(16,185,129,0.3)' : 'none', border: `1px solid ${hovered && !added ? 'transparent' : 'rgba(16,185,129,0.18)'}` }}>
            {added ? <><CheckCircle size={13} />افزوده شد!</> : <><ShoppingCart size={13} />افزودن به سبد</>}
          </button>
        </div>
      </div>
    </Link>
  );
}

/* ══ MAIN PAGE ══ */
export default function ShopHomePage() {
  const [heroSlide,  setHeroSlide]  = useState(0);
  const [cat,        setCat]        = useState('all');
  const [search,     setSearch]     = useState('');
  const [sortBy,     setSortBy]     = useState('featured');
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice,   setMinPrice]   = useState('');
  const [maxPrice,   setMaxPrice]   = useState('');
  const [onlyNew,    setOnlyNew]    = useState(false);
  const [onlyDeal,   setOnlyDeal]   = useState(false);
  const [onlyStock,  setOnlyStock]  = useState(false);
  const [searchFocus,setSearchFocus]= useState(false);
  const [countdown,  setCountdown]  = useState({ h: 5, m: 47, s: 23 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  /* hero auto-advance */
  useEffect(() => {
    const t = setInterval(() => setHeroSlide(s => (s + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(t);
  }, []);

  /* countdown */
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* close filter outside */
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* filtered products */
  const filtered = ALL_PRODUCTS.filter(p => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (search && !p.title.includes(search) && !p.brand.includes(search)) return false;
    if (onlyNew  && !p.isNew)  return false;
    if (onlyDeal && !p.isDeal) return false;
    if (onlyStock && p.stock === 0) return false;
    if (minPrice && (p.discountPrice ?? p.price) < Number(minPrice)) return false;
    if (maxPrice && (p.discountPrice ?? p.price) > Number(maxPrice)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'featured')  return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    if (sortBy === 'price_asc') return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
    if (sortBy === 'price_desc')return (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price);
    if (sortBy === 'rating')    return b.rating - a.rating;
    if (sortBy === 'newest')    return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    return 0;
  });

  const deals    = ALL_PRODUCTS.filter(p => p.isDeal);
  const featured = ALL_PRODUCTS.filter(p => p.isFeatured);
  const newItems = ALL_PRODUCTS.filter(p => p.isNew);
  const hs = HERO_SLIDES[heroSlide]!;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(-12px);}to{opacity:1;transform:none;} }
        @keyframes ambient  { 0%,100%{transform:translate(0,0);}50%{transform:translate(24px,-16px);} }
        @keyframes pulse    { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes shimmer  { from{background-position:-200% center;}to{background-position:200% center;} }
        @keyframes countFlip{ from{transform:translateY(-8px);opacity:0;}to{transform:none;opacity:1;} }

        .search-bar {
          display:flex; align-items:center; gap:10px;
          background:rgba(255,255,255,0.04);
          border:1.5px solid rgba(255,255,255,0.08);
          border-radius:14px; padding:0 16px; height:50px;
          transition:all 0.3s;
        }
        .search-bar.focused {
          border-color:rgba(16,185,129,0.4);
          background:rgba(255,255,255,0.06);
          box-shadow:0 0 0 3px rgba(16,185,129,0.08);
        }
        .search-input { flex:1; background:transparent; border:none; outline:none; color:#f0faf5; font-size:14px; font-family:inherit; }
        .search-input::placeholder { color:rgba(240,250,245,0.22); }

        .cat-btn { display:flex; flex-direction:column; align-items:center; gap:8px; padding:0; cursor:pointer; border:none; background:none; transition:transform 0.25s; flex-shrink:0; }
        .cat-btn:hover { transform:translateY(-3px); }

        .brand-card { padding:18px 16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; cursor:pointer; transition:all 0.35s; text-align:center; }
        .brand-card:hover { transform:translateY(-4px); background:rgba(255,255,255,0.055); }

        .sort-select { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:9px 14px; color:rgba(240,250,245,0.7); font-size:12px; font-family:inherit; outline:none; cursor:pointer; }

        .countdown-box { min-width:44px; text-align:center; }
        .countdown-num { font-size:28px; font-weight:900; color:#ef4444; letterSpacing:'-0.03em'; lineHeight:1; animation:countFlip 0.3s ease both; textShadow:'0 0 20px rgba(239,68,68,0.5)'; }

        @media(max-width:1024px) { .products-grid{grid-template-columns:repeat(3,1fr)!important;} }
        @media(max-width:768px)  { .products-grid{grid-template-columns:repeat(2,1fr)!important;} .brands-grid{grid-template-columns:repeat(3,1fr)!important;} }
        @media(max-width:480px)  { .products-grid{grid-template-columns:repeat(2,1fr)!important;} .brands-grid{grid-template-columns:repeat(2,1fr)!important;} }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#020806,#060d0a)', paddingBottom: '80px' }}>

        {/* ══════════ CINEMATIC HERO ══════════ */}
        <div style={{ position: 'relative', height: 'clamp(340px,50vh,520px)', overflow: 'hidden' }}>
          {HERO_SLIDES.map((s, i) => (
            <div key={i} style={{ position: 'absolute', inset: 0, opacity: i === heroSlide ? 1 : 0, transition: 'opacity 1.5s ease', background: s.bg }}>
              <img src={s.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '50vw', height: '50vw', maxWidth: '500px', maxHeight: '500px', borderRadius: '50%', background: `radial-gradient(${s.accent}20,transparent 65%)`, filter: 'blur(40px)', animation: 'ambient 14s ease-in-out infinite' }} />
            </div>
          ))}

          {/* Overlays */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(2,8,6,0.5) 0%,transparent 30%,rgba(2,8,6,0.95) 100%)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left,rgba(2,8,6,0.6) 0%,transparent 55%)', zIndex: 2, pointerEvents: 'none' }} />

          {/* Content */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', padding: '0 clamp(20px,6vw,80px)' }}>
            <div style={{ maxWidth: '560px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${hs.accent}12`, border: `1px solid ${hs.accent}30`, borderRadius: '100px', padding: '5px 16px', marginBottom: '18px', backdropFilter: 'blur(16px)' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: hs.accent, boxShadow: `0 0 8px ${hs.accent}`, display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '10px', color: hs.accent, fontWeight: 700, letterSpacing: '0.15em' }}>{hs.tag}</span>
              </div>

              <h1 style={{ fontSize: 'clamp(32px,6vw,58px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.04em', lineHeight: 1.0, textShadow: `0 0 80px ${hs.accent}20` }}>{hs.title}</h1>

              <div style={{ height: '1px', width: '52px', background: `linear-gradient(90deg,${hs.accent},transparent)`, boxShadow: `0 0 14px ${hs.accent}`, marginBottom: '14px', transition: 'all 1.5s' }} />

              <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: 'rgba(255,255,255,0.45)', margin: '0 0 6px' }}>{hs.sub}</p>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${hs.accent}18`, border: `1px solid ${hs.accent}30`, borderRadius: '20px', padding: '5px 14px', marginBottom: '24px' }}>
                <Zap size={12} style={{ color: hs.accent }} />
                <span style={{ fontSize: '12px', color: hs.accent, fontWeight: 700 }}>{hs.badge}</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button style={{ padding: '12px 26px', background: hs.accent === '#10b981' ? 'linear-gradient(135deg,#10b981,#059669)' : `linear-gradient(135deg,${hs.accent},${hs.accent}cc)`, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 8px 24px ${hs.accent}35`, transition: 'all 0.3s' }}>
                  {hs.cta} →
                </button>
              </div>
            </div>
          </div>

          {/* Slide indicators */}
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '8px' }}>
            {HERO_SLIDES.map((s, i) => (
              <button key={i} onClick={() => setHeroSlide(i)} style={{ height: '2px', width: i === heroSlide ? '32px' : '10px', borderRadius: '1px', border: 'none', cursor: 'pointer', padding: 0, background: i === heroSlide ? s.accent : 'rgba(255,255,255,0.18)', transition: 'all 0.5s', boxShadow: i === heroSlide ? `0 0 12px ${s.accent}` : 'none' }} />
            ))}
          </div>
        </div>

        {/* ══════════ TRUST BAR ══════════ */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)', padding: '14px clamp(16px,4vw,40px)', overflowX: 'auto' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', gap: '40px', justifyContent: 'center', minWidth: 'max-content' }}>
            {[
              { icon: <Shield size={15} />,    label: 'پرداخت امن',    sub: 'درگاه بانکی', color: '#10b981' },
              { icon: <Truck size={15} />,     label: 'ارسال سریع',   sub: '۱-۳ روز',     color: '#06b6d4' },
              { icon: <RefreshCw size={15} />, label: 'ضمانت بازگشت', sub: '۷ روز',        color: '#a78bfa' },
              { icon: <Award size={15} />,     label: 'کالای اصل',    sub: 'تضمین اصالت',  color: '#f59e0b' },
              { icon: <Check size={15} />,     label: 'تأیید فدراسیون', sub: 'فروشگاه رسمی', color: '#10b981' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${t.color}10`, border: `1px solid ${t.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.color }}>
                  {t.icon}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0faf5' }}>{t.label}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.3)' }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* ══════════ SEARCH + FILTER BAR ══════════ */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className={`search-bar ${searchFocus ? 'focused' : ''}`} style={{ flex: 1, minWidth: '220px' }}>
              <Search size={15} style={{ color: 'rgba(240,250,245,0.25)', flexShrink: 0 }} />
              <input className="search-input" type="text" value={search} onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
                placeholder="جستجو در محصولات، برند..." />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,250,245,0.3)', padding: 0, display: 'flex' }}><X size={13} /></button>}
            </div>

            {/* Filter */}
            <div ref={filterRef} style={{ position: 'relative' }}>
              <button onClick={() => setFilterOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0 16px', height: '50px', background: filterOpen ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filterOpen ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', color: filterOpen ? '#10b981' : 'rgba(240,250,245,0.5)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                <SlidersHorizontal size={14} /> فیلتر
                {(onlyNew || onlyDeal || onlyStock || minPrice || maxPrice) && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                )}
              </button>

              {filterOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 'min(300px,90vw)', background: 'rgba(6,13,10,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '18px', zIndex: 200, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', animation: 'fadeUp 0.22s ease both' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#f0faf5', marginBottom: '16px' }}>فیلترها</div>

                  {/* Price range */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.35)', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.1em' }}>محدوده قیمت (تومان)</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="از" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 12px', color: '#f0faf5', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }} />
                      <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="تا" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 12px', color: '#f0faf5', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {[
                      { label: 'فقط محصولات جدید',      val: onlyNew,   set: setOnlyNew   },
                      { label: 'فقط پیشنهادهای ویژه',   val: onlyDeal,  set: setOnlyDeal  },
                      { label: 'فقط موجود در انبار',     val: onlyStock, set: setOnlyStock },
                    ].map((t, i) => (
                      <div key={i} onClick={() => t.set(p => !p)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '6px 0' }}>
                        <span style={{ fontSize: '13px', color: 'rgba(240,250,245,0.6)' }}>{t.label}</span>
                        <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: t.val ? '#10b981' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.3s', boxShadow: t.val ? '0 0 8px rgba(16,185,129,0.3)' : 'none' }}>
                          <div style={{ position: 'absolute', top: '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'all 0.3s', left: t.val ? '18px' : '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {(onlyNew || onlyDeal || onlyStock || minPrice || maxPrice) && (
                    <button onClick={() => { setOnlyNew(false); setOnlyDeal(false); setOnlyStock(false); setMinPrice(''); setMaxPrice(''); }}
                      style={{ width: '100%', marginTop: '14px', padding: '9px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '10px', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      پاک کردن فیلترها
                    </button>
                  )}
                </div>
              )}
            </div>

            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="featured">پیشنهادی</option>
              <option value="newest">جدیدترین</option>
              <option value="rating">بهترین امتیاز</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
            </select>

            <div style={{ fontSize: '12px', color: 'rgba(240,250,245,0.35)', whiteSpace: 'nowrap' }}>
              {toFa(filtered.length)} محصول
            </div>

            <Link href="/shop/new" style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0 18px', height: '50px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', borderRadius: '12px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 6px 18px rgba(16,185,129,0.3)', flexShrink: 0 }}>
              + فروش محصول
            </Link>
          </div>

          {/* ══════════ CATEGORIES ══════════ */}
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', gap: 'clamp(12px,2vw,24px)', overflowX: 'auto', padding: '4px 0 8px' }}>
              {CATEGORIES.map(c => (
                <button key={c.key} className="cat-btn" onClick={() => setCat(c.key)}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: cat === c.key ? `${c.color}14` : 'rgba(255,255,255,0.04)', border: `2px solid ${cat === c.key ? c.color : 'rgba(255,255,255,0.07)'}`, boxShadow: cat === c.key ? `0 0 0 3px ${c.color}18,0 8px 24px ${c.color}18` : '0 2px 8px rgba(0,0,0,0.2)', fontSize: '24px', transition: 'all 0.3s' }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: cat === c.key ? 800 : 500, color: cat === c.key ? c.color : 'rgba(240,250,245,0.45)', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>{c.label}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(240,250,245,0.2)', textAlign: 'center' }}>{toFa(c.count)}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ══════════ FLASH DEALS ══════════ */}
          {deals.length > 0 && cat === 'all' && !search && (
            <section style={{ marginBottom: '48px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.14)', borderRadius: '24px', padding: 'clamp(16px,3vw,28px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.6),transparent)', boxShadow: '0 0 12px rgba(239,68,68,0.3)' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(239,68,68,0.35)' }}>
                    <Flame size={20} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#f0faf5', letterSpacing: '-0.02em' }}>پیشنهاد شگفت‌انگیز</div>
                    <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.4)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Clock size={10} /> فقط تا پایان امروز</div>
                  </div>
                </div>

                {/* Countdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', direction: 'ltr' }}>
                  {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((v, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="countdown-box" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '6px 10px' }}>
                        <div key={v} className="countdown-num" style={{ fontSize: '22px', fontWeight: 900, color: '#ef4444', lineHeight: 1, animation: 'countFlip 0.3s ease' }}>{toFa(v)}</div>
                        <div style={{ fontSize: '9px', color: 'rgba(239,68,68,0.5)', marginTop: '2px', textAlign: 'center' }}>
                          {['ساعت','دقیقه','ثانیه'][i]}
                        </div>
                      </div>
                      {i < 2 && <span style={{ fontSize: '18px', fontWeight: 900, color: 'rgba(239,68,68,0.5)' }}>:</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '14px' }}>
                {deals.slice(0, 4).map(p => <ProductCard key={p.id} p={p} size="sm" />)}
              </div>
            </section>
          )}

          {/* ══════════ FEATURED ══════════ */}
          {featured.length > 0 && cat === 'all' && !search && (
            <section style={{ marginBottom: '48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: 'rgba(245,158,11,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '7px', textTransform: 'uppercase' }}>FEATURED PRODUCTS</div>
                  <h2 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#f0faf5', margin: 0, letterSpacing: '-0.025em' }}>محصولات ویژه</h2>
                  <div style={{ height: '1px', width: '52px', marginTop: '10px', background: 'linear-gradient(90deg,#f59e0b,transparent)', boxShadow: '0 0 10px rgba(245,158,11,0.4)' }} />
                </div>
                <Link href="/shop?filter=featured" style={{ fontSize: '12px', color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
                  همه <ArrowLeft size={12} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
                {featured.slice(0, 4).map(p => <ProductCard key={p.id} p={p} size="md" />)}
              </div>
            </section>
          )}

          {/* ══════════ BRANDS ══════════ */}
          {cat === 'all' && !search && (
            <section style={{ marginBottom: '48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: 'rgba(6,182,212,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '7px', textTransform: 'uppercase' }}>PREMIUM BRANDS</div>
                  <h2 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#f0faf5', margin: 0, letterSpacing: '-0.025em' }}>برندهای برتر</h2>
                  <div style={{ height: '1px', width: '52px', marginTop: '10px', background: 'linear-gradient(90deg,#06b6d4,transparent)', boxShadow: '0 0 10px rgba(6,182,212,0.4)' }} />
                </div>
              </div>
              <div className="brands-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '12px' }}>
                {BRANDS.map((b, i) => (
                  <div key={i} className="brand-card" style={{ animationDelay: `${i * 0.06}s` }}
                    onClick={() => setSearch(b.name)}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: b.color, letterSpacing: '0.08em', marginBottom: '6px', textShadow: `0 0 20px ${b.color}40` }}>{b.name}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.4)', marginBottom: '4px' }}>{b.desc}</div>
                    <div style={{ fontSize: '9px', color: b.color, background: `${b.color}10`, border: `1px solid ${b.color}20`, borderRadius: '20px', padding: '2px 8px', display: 'inline-block' }}>{toFa(b.items)} محصول</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ══════════ NEW ARRIVALS ══════════ */}
          {newItems.length > 0 && cat === 'all' && !search && (
            <section style={{ marginBottom: '48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: 'rgba(16,185,129,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '7px', textTransform: 'uppercase' }}>NEW ARRIVALS</div>
                  <h2 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#f0faf5', margin: 0, letterSpacing: '-0.025em' }}>تازه‌واردها</h2>
                  <div style={{ height: '1px', width: '52px', marginTop: '10px', background: 'linear-gradient(90deg,#10b981,transparent)', boxShadow: '0 0 10px rgba(16,185,129,0.4)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
                {newItems.map(p => <ProductCard key={p.id} p={p} size="md" />)}
              </div>
            </section>
          )}

          {/* ══════════ ALL PRODUCTS ══════════ */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(167,139,250,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '7px', textTransform: 'uppercase' }}>
                  {cat === 'all' ? 'ALL PRODUCTS' : CATEGORIES.find(c => c.key === cat)?.label.toUpperCase()}
                </div>
                <h2 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#f0faf5', margin: 0, letterSpacing: '-0.025em' }}>
                  {cat === 'all' ? 'همه محصولات' : CATEGORIES.find(c => c.key === cat)?.label}
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(240,250,245,0.35)', marginRight: '10px' }}>({toFa(filtered.length)})</span>
                </h2>
                <div style={{ height: '1px', width: '52px', marginTop: '10px', background: 'linear-gradient(90deg,#a78bfa,transparent)', boxShadow: '0 0 10px rgba(167,139,250,0.4)' }} />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <div style={{ fontSize: '48px', opacity: 0.15, marginBottom: '14px' }}>🎱</div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f0faf5', margin: '0 0 8px' }}>محصولی یافت نشد</h3>
                <p style={{ fontSize: '14px', color: 'rgba(240,250,245,0.35)', margin: '0 0 20px' }}>فیلترها یا جستجو را تغییر دهید</p>
                <button onClick={() => { setCat('all'); setSearch(''); setOnlyNew(false); setOnlyDeal(false); setOnlyStock(false); setMinPrice(''); setMaxPrice(''); }}
                  style={{ padding: '11px 26px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  پاک کردن فیلترها
                </button>
              </div>
            ) : (
              <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
                {filtered.map((p, i) => (
                  <div key={p.id} style={{ animation: `fadeUp 0.5s ease ${Math.min(i, 7) * 0.06}s both` }}>
                    <ProductCard p={p} size="md" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ══════════ SELLER CTA ══════════ */}
          <div style={{ marginTop: '56px', padding: '40px 36px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(16,185,129,0.18)', borderRadius: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'rgba(16,185,129,0.5)', letterSpacing: '0.22em', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>BECOME A SELLER</div>
            <h3 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: '#f0faf5', margin: '0 0 10px', letterSpacing: '-0.025em' }}>محصولتان را بفروشید</h3>
            <p style={{ fontSize: '14px', color: 'rgba(240,250,245,0.35)', margin: '0 0 24px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              به بازار بیلیارد ایران بپیوندید و به هزاران خریدار دسترسی داشته باشید
            </p>
            <Link href="/shop/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 30px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '13px', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px rgba(16,185,129,0.28)' }}>
              شروع فروش ←
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}