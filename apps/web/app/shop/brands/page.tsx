'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search, Shield, Award, ChevronRight, Star,
  MapPin, Check, Zap, Users, Package, X,
  SlidersHorizontal, Globe, TrendingUp,
} from 'lucide-react';

/* ══ types ══ */
interface Brand {
  id: string; name: string; nameEn: string; country: string; flag: string;
  category: string[]; founded: number; description: string;
  logo: string; coverImg: string; accentColor: string;
  rating: number; reviewCount: number; products: number;
  dealers: number; tournaments: number;
  isOfficial: boolean; isFeatured: boolean; isVerified: boolean;
  tier: 'platinum' | 'gold' | 'silver';
  tags: string[];
}

/* ══ data ══ */
const BRANDS: Brand[] = [
  {
    id:'predator', name:'پردیتور', nameEn:'PREDATOR', country:'ایالات متحده', flag:'🇺🇸',
    category:['cue','shaft','tip'], founded:1994,
    description:'پیشگام فناوری Low Deflection در صنعت چوب بیلیارد. محصولات پردیتور استاندارد طلایی بازیکنان حرفه‌ای در سراسر جهان هستند.',
    logo:'P', coverImg:'/images/billiadr-club-1.jpg', accentColor:'#C7A66A',
    rating:4.9, reviewCount:1240, products:47, dealers:12, tournaments:38,
    isOfficial:true, isFeatured:true, isVerified:true, tier:'platinum',
    tags:['Low Deflection','Carbon Fiber','Professional','WPBSA'],
  },
  {
    id:'aramith', name:'آرامیت', nameEn:'ARAMITH', country:'بلژیک', flag:'🇧🇪',
    category:['ball','set'], founded:1923,
    description:'قدیمی‌ترین و معتبرترین برند توپ‌های بیلیارد جهان. توپ‌های آرامیت استاندارد رسمی مسابقات بین‌المللی اسنوکر و پاکت بیلیارد هستند.',
    logo:'A', coverImg:'/images/billiadr-club-3.jpg', accentColor:'#06b6d4',
    rating:4.8, reviewCount:890, products:23, dealers:8, tournaments:52,
    isOfficial:true, isFeatured:true, isVerified:true, tier:'platinum',
    tags:['Phenolic Resin','WPA/WPBSA','Belgium','Tournament Standard'],
  },
  {
    id:'riley', name:'رایلی', nameEn:'RILEY', country:'انگلستان', flag:'🇬🇧',
    category:['cue','table','accessory'], founded:1897,
    description:'میراث ۱۲۷ ساله در ساخت تجهیزات اسنوکر. رایلی میزهای رسمی قهرمانی جهان اسنوکر را برای دهه‌ها تأمین کرده است.',
    logo:'R', coverImg:'/images/billiadr-club-1.jpg', accentColor:'#a78bfa',
    rating:4.7, reviewCount:654, products:31, dealers:9, tournaments:28,
    isOfficial:true, isFeatured:true, isVerified:true, tier:'platinum',
    tags:['Heritage','World Championship','Snooker','England'],
  },
  {
    id:'viraka', name:'ویراکا', nameEn:'VIRAKA', country:'ایران', flag:'🇮🇷',
    category:['table','cue'], founded:1388,
    description:'پیشرو در ساخت میزهای بیلیارد استاندارد در ایران. ویراکا تنها برند ایرانی دارای گواهی استاندارد بین‌المللی است.',
    logo:'و', coverImg:'/images/billiadr-club-3.jpg', accentColor:'#f59e0b',
    rating:4.5, reviewCount:342, products:19, dealers:24, tournaments:15,
    isOfficial:true, isFeatured:true, isVerified:true, tier:'gold',
    tags:['ایرانی','استاندارد ملی','صادراتی','ISO'],
  },
  {
    id:'mezz', name:'مز', nameEn:'MEZZ', country:'ژاپن', flag:'🇯🇵',
    category:['cue','shaft','joint'], founded:1990,
    description:'هنر ساخت چوب بیلیارد به شیوه ژاپنی. دقت بی‌نظیر در ساخت و مواد باکیفیت، مز را به انتخاب بازیکنان حرفه‌ای آسیا تبدیل کرده.',
    logo:'M', coverImg:'/images/billiadr-club-1.jpg', accentColor:'#ef4444',
    rating:4.8, reviewCount:478, products:38, dealers:6, tournaments:22,
    isOfficial:true, isFeatured:false, isVerified:true, tier:'gold',
    tags:['Japan','Craftsmanship','Asian Tour','Carbon'],
  },
  {
    id:'brunswick', name:'برانزویک', nameEn:'BRUNSWICK', country:'ایالات متحده', flag:'🇺🇸',
    category:['table','ball','accessory'], founded:1845,
    description:'با ۱۸۰ سال تجربه، برانزویک قدیمی‌ترین برند فعال در صنعت بیلیارد جهان است. میزهای برانزویک در بهترین باشگاه‌های جهان یافت می‌شوند.',
    logo:'B', coverImg:'/images/billiadr-club-3.jpg', accentColor:'#06b6d4',
    rating:4.6, reviewCount:521, products:29, dealers:7, tournaments:19,
    isOfficial:true, isFeatured:false, isVerified:true, tier:'platinum',
    tags:['Legacy','American Made','Pool Tables','1845'],
  },
  {
    id:'tiger', name:'تایگر', nameEn:'TIGER', country:'کانادا', flag:'🇨🇦',
    category:['tip','accessory','chalk'], founded:1987,
    description:'متخصص نوک چوب و لوازم جانبی حرفه‌ای. نوک‌های تایگر انتخاب اول بازیکنان جهانی برای دقت و کنترل بی‌نظیر هستند.',
    logo:'T', coverImg:'/images/billiadr-club-1.jpg', accentColor:'#f59e0b',
    rating:4.7, reviewCount:289, products:54, dealers:5, tournaments:0,
    isOfficial:false, isFeatured:false, isVerified:true, tier:'silver',
    tags:['Tips','Canada','Accessories','Professional'],
  },
  {
    id:'master', name:'مستر', nameEn:'MASTER', country:'ایالات متحده', flag:'🇺🇸',
    category:['chalk','accessory'], founded:1867,
    description:'گچ مستر بیش از ۱۵۰ سال است که انتخاب اول بازیکنان در سراسر جهان است. ساده، مطمئن، و بی‌نظیر در کیفیت.',
    logo:'M', coverImg:'/images/billiadr-club-3.jpg', accentColor:'#C7A66A',
    rating:4.5, reviewCount:1840, products:8, dealers:18, tournaments:0,
    isOfficial:false, isFeatured:false, isVerified:true, tier:'silver',
    tags:['Chalk','Classic','150+ Years','Economy'],
  },
];

const CATEGORIES = [
  { key:'all',       label:'همه', count:8   },
  { key:'cue',       label:'چوب', count:4   },
  { key:'table',     label:'میز', count:4   },
  { key:'ball',      label:'توپ', count:2   },
  { key:'accessory', label:'لوازم', count:5 },
];

const TIERS = [
  { key:'platinum', label:'پلاتینیوم', color: '#111111', bg:'rgba(226,232,240,0.1)', border:'rgba(226,232,240,0.25)' },
  { key:'gold',     label:'طلایی',     color:'#f59e0b', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.25)'  },
  { key:'silver',   label:'نقره‌ای',   color: 'rgba(0,0,0,0.50)', bg:'rgba(148,163,184,0.1)', border:'rgba(148,163,184,0.2)'  },
];

function toFa(v: string|number){ return String(v).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d))); }

/* ══ Brand Card ══ */
function BrandCard({ brand, featured=false }: { brand: Brand; featured?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const tier = TIERS.find(t => t.key === brand.tier)!;

  if (featured) return (
    <Link href={`/brands/${brand.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
        style={{ position:'relative', borderRadius:'24px', overflow:'hidden', background: hovered?'rgba(0,0,0,0.04)':'#FFFFFF', border:`1px solid ${hovered?`${brand.accentColor}35`:'rgba(0,0,0,0.07)'}`, transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)', transform: hovered?'translateY(-7px)':'none', boxShadow: hovered?`0 28px 64px rgba(0,0,0,0.5),0 0 0 1px ${brand.accentColor}12`:'0 4px 20px rgba(0,0,0,0.25)', height:'100%', display:'flex', flexDirection:'column' }}>

        {/* Cover */}
        <div style={{ height:'180px', position:'relative', overflow:'hidden', flexShrink:0 }}>
          <img src={brand.coverImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.18) saturate(0.4)', transition:'transform 0.7s ease', transform: hovered?'scale(1.06)':'scale(1)' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${brand.accentColor}20,transparent 60%)` }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 40%,rgba(6,13,10,0.9) 100%)' }}/>

          {/* Logo */}
          <div style={{ position:'absolute', bottom:'-24px', right:'20px', width:'60px', height:'60px', borderRadius:'16px', background:`linear-gradient(135deg,${brand.accentColor},${brand.accentColor}80)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:900, color:'#fff', border:'3px solid rgba(6,13,10,0.98)', boxShadow:`0 8px 24px ${brand.accentColor}40` }}>
            {brand.logo}
          </div>

          {/* Tier badge */}
          <div style={{ position:'absolute', top:'12px', right:'12px', display:'flex', alignItems:'center', gap:'5px', background:tier.bg, border:`1px solid ${tier.border}`, backdropFilter:'blur(8px)', borderRadius:'20px', padding:'4px 10px', fontSize:'9px', color:tier.color, fontWeight:700 }}>
            <Award size={9}/> {tier.label}
          </div>

          {/* Country */}
          <div style={{ position:'absolute', top:'12px', left:'12px', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)', borderRadius:'20px', padding:'4px 10px', fontSize:'11px' }}>
            {brand.flag}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:'32px 20px 18px', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
            <span style={{ fontSize:'10px', color:brand.accentColor, letterSpacing:'0.15em', fontWeight:700 }}>{brand.nameEn}</span>
            {brand.isVerified && <Check size={11} style={{ color:brand.accentColor }}/>}
          </div>
          <h3 style={{ fontSize:'18px', fontWeight:900, color: '#111111', margin:'0 0 8px', letterSpacing:'-0.02em' }}>{brand.name}</h3>
          <p style={{ fontSize:'12px', color:'rgba(0,0,0,0.45)', lineHeight:1.7, margin:'0 0 14px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{brand.description}</p>

          {/* Tags */}
          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'14px' }}>
            {brand.tags.slice(0,3).map(t => (
              <span key={t} style={{ fontSize:'9px', color:brand.accentColor, background:`${brand.accentColor}10`, border:`1px solid ${brand.accentColor}20`, borderRadius:'20px', padding:'2px 8px', fontWeight:600 }}>{t}</span>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0', borderTop:'1px solid rgba(0,0,0,0.04)', paddingTop:'14px', marginTop:'auto' }}>
            {[
              { v:toFa(brand.products),    l:'محصول'     },
              { v:toFa(brand.dealers),     l:'نمایندگی'  },
              { v:toFa(brand.tournaments), l:'مسابقه'    },
            ].map((s,i) => (
              <div key={i} style={{ textAlign:'center', borderLeft: i>0?'1px solid rgba(0,0,0,0.04)':'none' }}>
                <div style={{ fontSize:'16px', fontWeight:900, color: '#111111', letterSpacing:'-0.02em' }}>{s.v}</div>
                <div style={{ fontSize:'9px', color:'rgba(0,0,0,0.35)', marginTop:'2px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );

  /* List card */
  return (
    <Link href={`/brands/${brand.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
        style={{ display:'flex', alignItems:'center', gap:'16px', padding:'18px 20px', background: hovered?'rgba(0,0,0,0.04)':'#FFFFFF', border:`1px solid ${hovered?`${brand.accentColor}28`:'rgba(0,0,0,0.07)'}`, borderRadius:'18px', transition:'all 0.35s cubic-bezier(0.4,0,0.2,1)', transform: hovered?'translateX(-4px)':'none', boxShadow: hovered?`0 16px 40px rgba(0,0,0,0.4),0 0 0 1px ${brand.accentColor}08`:'none' }}>

        {/* Logo */}
        <div style={{ width:'52px', height:'52px', borderRadius:'15px', background:`linear-gradient(135deg,${brand.accentColor},${brand.accentColor}80)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:900, color:'#fff', flexShrink:0, boxShadow: hovered?`0 8px 20px ${brand.accentColor}35`:'none', transition:'box-shadow 0.3s' }}>
          {brand.logo}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
            <span style={{ fontSize:'15px', fontWeight:800, color: '#111111', letterSpacing:'-0.01em' }}>{brand.name}</span>
            <span style={{ fontSize:'9px', color:brand.accentColor, letterSpacing:'0.12em', fontWeight:700 }}>{brand.nameEn}</span>
            {brand.isVerified && <Check size={11} style={{ color:brand.accentColor }}/>}
            <span style={{ fontSize:'9px', padding:'2px 8px', borderRadius:'20px', background:tier.bg, border:`1px solid ${tier.border}`, color:tier.color, fontWeight:700 }}>{tier.label}</span>
          </div>
          <div style={{ fontSize:'12px', color:'rgba(0,0,0,0.42)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{brand.description}</div>
        </div>

        {/* Country */}
        <div style={{ fontSize:'20px', flexShrink:0 }}>{brand.flag}</div>

        {/* Stats */}
        <div style={{ display:'flex', gap:'20px', flexShrink:0 }}>
          {[{v:toFa(brand.products),l:'محصول'},{v:toFa(brand.dealers),l:'نماینده'}].map((s,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'16px', fontWeight:900, color: '#111111', letterSpacing:'-0.02em' }}>{s.v}</div>
              <div style={{ fontSize:'9px', color:'rgba(0,0,0,0.35)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Rating */}
        <div style={{ display:'flex', alignItems:'center', gap:'4px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'20px', padding:'5px 10px', flexShrink:0 }}>
          <Star size={11} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>
          <span style={{ fontSize:'12px', fontWeight:800, color:'#f59e0b' }}>{brand.rating}</span>
        </div>
      </div>
    </Link>
  );
}

/* ══ MAIN ══ */
export default function BrandsPage() {
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('all');
  const [tier,       setTier]       = useState<string>('all');
  const [sortBy,     setSortBy]     = useState('featured');
  const [view,       setView]       = useState<'grid'|'list'>('grid');
  const [sfocus,     setSfocus]     = useState(false);

  const filtered = BRANDS.filter(b => {
    if (search && !b.name.includes(search) && !b.nameEn.toLowerCase().includes(search.toLowerCase()) && !b.country.includes(search)) return false;
    if (category !== 'all' && !b.category.includes(category)) return false;
    if (tier !== 'all' && b.tier !== tier) return false;
    return true;
  }).sort((a,b) => {
    if (sortBy==='featured') return (b.isFeatured?1:0)-(a.isFeatured?1:0);
    if (sortBy==='rating')   return b.rating-a.rating;
    if (sortBy==='products') return b.products-a.products;
    if (sortBy==='oldest')   return a.founded-b.founded;
    return 0;
  });

  const featured = BRANDS.filter(b=>b.isFeatured);

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;} }
        @keyframes ambient { 0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-14px);} }
        @keyframes shimmer { from{background-position:-200% center;}to{background-position:200% center;} }

        .s-bar  { display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.04); border:1.5px solid rgba(0,0,0,0.06); border-radius:14px; padding:0 16px; height:50px; transition:all 0.3s; }
        .s-bar.focus { border-color:rgba(199,166,106,0.4); background:rgba(0,0,0,0.05); box-shadow:0 0 0 3px rgba(199,166,106,0.08); }
        .s-inp  { flex:1; background:transparent; border:none; outline:none; color:#f0faf5; font-size:14px; font-family:inherit; }
        .s-inp::placeholder { color:rgba(0,0,0,0.32); }
        .cat-btn { padding:7px 16px; border-radius:20px; font-size:12px; font-weight:600; border:1px solid; cursor:pointer; font-family:inherit; white-space:nowrap; transition:all 0.2s; }
        .cat-btn.active { background:rgba(199,166,106,0.12); border-color:rgba(199,166,106,0.35); color:#C7A66A; }
        .cat-btn:not(.active) { background:rgba(0,0,0,0.03); border-color:rgba(0,0,0,0.07); color:rgba(0,0,0,0.45); }
        .sort-sel { background:rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.06); border-radius:10px; padding:9px 14px; color:rgba(0,0,0,0.48); font-size:12px; font-family:inherit; outline:none; cursor:pointer; }
        .view-btn { width:36px; height:36px; border-radius:9px; border:1px solid; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
        .view-btn.active { background:rgba(199,166,106,0.1); border-color:rgba(199,166,106,0.3); color:#C7A66A; }
        .view-btn:not(.active) { background:rgba(0,0,0,0.03); border-color:rgba(0,0,0,0.06); color:rgba(0,0,0,0.42); }
        @media(max-width:900px) { .brand-grid{grid-template-columns:repeat(2,1fr)!important;} .feat-grid{grid-template-columns:repeat(2,1fr)!important;} }
        @media(max-width:560px) { .brand-grid{grid-template-columns:1fr!important;} .feat-grid{grid-template-columns:1fr!important;} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#F7F7F5', paddingBottom:'80px' }}>

        {/* ══ HERO ══ */}
        <div style={{ position:'relative', background:'rgba(2,8,6,0.98)', borderBottom:'1px solid rgba(0,0,0,0.04)', padding:'clamp(32px,5vw,60px) clamp(16px,4vw,48px) 0', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-20%', right:'-5%', width:'50vw', height:'50vw', maxWidth:'560px', borderRadius:'50%', background:'radial-gradient(rgba(6,182,212,0.06),transparent 65%)', filter:'blur(40px)', animation:'ambient 16s ease-in-out infinite', pointerEvents:'none' }}/>

          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ fontSize:'10px', color:'rgba(6,182,212,0.65)', letterSpacing:'0.25em', fontWeight:700, marginBottom:'10px' }}>BRAND ECOSYSTEM</div>
            <h1 style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:900, color: '#111111', margin:'0 0 10px', letterSpacing:'-0.035em', lineHeight:1.05 }}>
              برندهای صنعت بیلیارد
            </h1>
            <p style={{ fontSize:'15px', color:'rgba(0,0,0,0.42)', margin:'0 0 28px', maxWidth:'480px' }}>
              از معتبرترین برندهای جهانی و داخلی تجهیزات بیلیارد کشف کنید
            </p>

            {/* Tier pills */}
            <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'20px' }}>
              {[{k:'all',l:'همه برندها'},{k:'platinum',l:'پلاتینیوم'},{k:'gold',l:'طلایی'},{k:'silver',l:'نقره‌ای'}].map(t => (
                <button key={t.k} className={`cat-btn ${tier===t.k?'active':''}`} onClick={()=>setTier(t.k)}>{t.l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ TOOLBAR ══ */}
        <div style={{ background:'rgba(2,8,6,0.97)', borderBottom:'1px solid rgba(0,0,0,0.04)', padding:'12px clamp(16px,4vw,48px)', position:'sticky', top:'62px', zIndex:90, backdropFilter:'blur(24px)' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
            <div className={`s-bar ${sfocus?'focus':''}`} style={{ flex:1, minWidth:'200px', maxWidth:'340px' }}>
              <Search size={15} style={{ color:'rgba(0,0,0,0.30)', flexShrink:0 }}/>
              <input className="s-inp" value={search} onChange={e=>setSearch(e.target.value)}
                onFocus={()=>setSfocus(true)} onBlur={()=>setSfocus(false)}
                placeholder="جستجو برند، کشور..."/>
              {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(0,0,0,0.35)', padding:0, display:'flex' }}><X size={13}/></button>}
            </div>

            <div style={{ display:'flex', gap:'7px', overflowX:'auto' }}>
              {CATEGORIES.map(c => (
                <button key={c.key} className={`cat-btn ${category===c.key?'active':''}`} onClick={()=>setCategory(c.key)}>
                  {c.label} <span style={{ fontSize:'9px', opacity:0.5 }}>({toFa(c.count)})</span>
                </button>
              ))}
            </div>

            <select className="sort-sel" value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ marginRight:'auto' }}>
              <option value="featured">پیشنهادی</option>
              <option value="rating">بهترین امتیاز</option>
              <option value="products">بیشترین محصول</option>
              <option value="oldest">قدیمی‌ترین</option>
            </select>

            <div style={{ display:'flex', gap:'4px' }}>
              {[{k:'grid',icon:'⊞'},{k:'list',icon:'☰'}].map(v => (
                <button key={v.k} className={`view-btn ${view===v.k?'active':''}`} onClick={()=>setView(v.k as any)} style={{ fontSize:'14px' }}>
                  {v.icon}
                </button>
              ))}
            </div>

            <div style={{ fontSize:'12px', color:'rgba(0,0,0,0.35)', whiteSpace:'nowrap' }}>{toFa(filtered.length)} برند</div>
          </div>
        </div>

        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* Global stats */}
          <div style={{ display:'flex', gap:'clamp(20px,4vw,48px)', marginBottom:'40px', flexWrap:'wrap' }}>
            {[
              { v:toFa(BRANDS.length),                              l:'برند ثبت‌شده',    c:'#06b6d4' },
              { v:toFa(BRANDS.filter(b=>b.isVerified).length),     l:'برند تأیید شده',  c:'#C7A66A' },
              { v:toFa(BRANDS.reduce((a,b)=>a+b.products,0)),      l:'محصول کل',        c:'#a78bfa' },
              { v:toFa(BRANDS.reduce((a,b)=>a+b.dealers,0)),       l:'نمایندگی فعال',   c:'#f59e0b' },
              { v:toFa(BRANDS.reduce((a,b)=>a+b.tournaments,0)),   l:'مسابقه حمایت‌شده',c:'#ef4444' },
            ].map((s,i) => (
              <div key={i} style={{ textAlign:'center', animation:`fadeUp 0.5s ease ${i*0.08}s both` }}>
                <div style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:900, color:s.c, letterSpacing:'-0.03em', textShadow:`0 0 20px ${s.c}30` }}>{s.v}</div>
                <div style={{ fontSize:'10px', color:'rgba(0,0,0,0.35)', marginTop:'3px' }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Featured brands */}
          {category==='all' && tier==='all' && !search && (
            <section style={{ marginBottom:'48px' }}>
              <div style={{ marginBottom:'20px' }}>
                <div style={{ fontSize:'9px', color:'rgba(6,182,212,0.6)', letterSpacing:'0.25em', fontWeight:700, marginBottom:'7px' }}>FEATURED BRANDS</div>
                <h2 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color: '#111111', margin:'0', letterSpacing:'-0.025em' }}>برندهای ویژه</h2>
                <div style={{ height:'1px', width:'52px', marginTop:'10px', background:'linear-gradient(90deg,#06b6d4,transparent)', boxShadow:'0 0 10px rgba(6,182,212,0.4)' }}/>
              </div>
              <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'18px' }}>
                {featured.map((b,i) => (
                  <div key={b.id} style={{ animation:`fadeUp 0.5s ease ${i*0.07}s both` }}>
                    <BrandCard brand={b} featured/>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All brands */}
          <section>
            <div style={{ marginBottom:'20px' }}>
              <div style={{ fontSize:'9px', color:'rgba(167,139,250,0.6)', letterSpacing:'0.25em', fontWeight:700, marginBottom:'7px' }}>ALL BRANDS</div>
              <h2 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color: '#111111', margin:0, letterSpacing:'-0.025em' }}>
                {category==='all'&&tier==='all'&&!search ? 'همه برندها' : `نتایج (${toFa(filtered.length)})`}
              </h2>
              <div style={{ height:'1px', width:'52px', marginTop:'10px', background:'linear-gradient(90deg,#a78bfa,transparent)', boxShadow:'0 0 10px rgba(167,139,250,0.4)' }}/>
            </div>

            {filtered.length===0 ? (
              <div style={{ textAlign:'center', padding:'80px 24px' }}>
                <div style={{ fontSize:'48px', opacity:0.1, marginBottom:'14px' }}>🏭</div>
                <h3 style={{ fontSize:'18px', fontWeight:800, color: '#111111', margin:'0 0 8px' }}>برندی یافت نشد</h3>
                <button onClick={()=>{setSearch('');setCategory('all');setTier('all');}} style={{ padding:'11px 24px', background:'linear-gradient(135deg,#C7A66A,#A07840)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginTop:'14px' }}>
                  پاک کردن فیلترها
                </button>
              </div>
            ) : view==='grid' ? (
              <div className="brand-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'18px' }}>
                {filtered.map((b,i) => (
                  <div key={b.id} style={{ animation:`fadeUp 0.5s ease ${i*0.06}s both` }}>
                    <BrandCard brand={b} featured/>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {filtered.map((b,i) => (
                  <div key={b.id} style={{ animation:`fadeUp 0.4s ease ${i*0.05}s both` }}>
                    <BrandCard brand={b}/>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Register brand CTA */}
          <div style={{ marginTop:'60px', padding:'44px 40px', background:'rgba(6,182,212,0.03)', border:'1px dashed rgba(6,182,212,0.2)', borderRadius:'28px', textAlign:'center' }}>
            <div style={{ fontSize:'10px', color:'rgba(6,182,212,0.5)', letterSpacing:'0.22em', fontWeight:700, marginBottom:'12px' }}>FOR MANUFACTURERS</div>
            <h3 style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:900, color: '#111111', margin:'0 0 10px', letterSpacing:'-0.025em' }}>برند خود را ثبت کنید</h3>
            <p style={{ fontSize:'14px', color:'rgba(0,0,0,0.40)', margin:'0 0 24px', maxWidth:'420px', marginLeft:'auto', marginRight:'auto' }}>
              به اکوسیستم صنعت بیلیارد ایران بپیوندید و با هزاران باشگاه، مربی و بازیکن در ارتباط باشید
            </p>
            <Link href="/brands/register" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'13px 30px', background:'linear-gradient(135deg,#06b6d4,#0891b2)', borderRadius:'13px', color:'#fff', fontSize:'14px', fontWeight:700, textDecoration:'none', boxShadow:'0 8px 24px rgba(6,182,212,0.25)' }}>
              ثبت برند ←
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}