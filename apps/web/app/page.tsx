'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Star, Building2, ShoppingBag, Clock, Eye, ArrowLeft,
  Trophy, MapPin, CheckCircle, Users, Award,
  Search, Heart, ChevronDown, Play, Pause,
} from 'lucide-react';

// ── Scroll-reveal ──────────────────────────────────────────────────────────
function SR({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setV(true); ob.disconnect(); } }, { threshold: 0.08 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(24px)', transition: `opacity 0.8s ${delay}ms cubic-bezier(0.22,1,0.36,1), transform 0.8s ${delay}ms cubic-bezier(0.22,1,0.36,1)` }}>{children}</div>;
}

// ── Images ─────────────────────────────────────────────────────────────────
const IMG = {
  club1: '/images/billiadr-club-1.jpg', club2: '/images/billiadr-club-2.jpg',
  club3: '/images/billiadr-club-3.jpg', club5: '/images/billiadr-club-5.jpg',
  club6: '/images/billiadr-club-6.jpg', table: '/images/Home_table.jpg',
  proTable: '/images/Pro_table.jpg',     snooker: '/images/snooker-table.jpg',
  snooker2: '/images/snooker-table-2.jpg', cue: '/images/cue_billiard.jpg',
  cue2: '/images/cue_billiard_2.jpg',   ball: '/images/Ball-1.jpg',
  chalk: '/images/pool_chalk_1.jpg',    rest: '/images/rest-pool-2.jpg',
};

// ── Tokens ─────────────────────────────────────────────────────────────────
const GOLD = '#C7A66A', GOLD_D = '#A07840';
const GOLD_DIM = 'rgba(199,166,106,0.65)', GOLD_BOR = 'rgba(199,166,106,0.22)';
const TEXT = '#1C1C1A', TEXT_S = 'rgba(28,28,26,0.52)', TEXT_M = 'rgba(28,28,26,0.28)';
const BORDER = 'rgba(28,28,26,0.07)';
const GRN = '#2A7A4A', BRN = '#7A4A2A', BLU = '#1E5A8C', PRP = '#6B4DB3';
// Liquid Glass
const LG  = 'rgba(255,255,255,0.62)';
const LGB = '1px solid rgba(255,255,255,0.84)';
const LGF = 'blur(44px) saturate(210%)';
const LGS = 'inset 0 1px 1px rgba(255,255,255,0.94), 0 4px 22px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)';

// ── Data ───────────────────────────────────────────────────────────────────
const heroImages = [IMG.club2, IMG.snooker, IMG.club6, IMG.cue];

const discoverTabs = [
  { id: 'clubs',   label: 'باشگاه',  icon: Building2,  placeholder: 'شهر، محله یا نام باشگاه...',    href: '/clubs'   },
  { id: 'coaches', label: 'مربی',    icon: Award,       placeholder: 'نام مربی یا تخصص بازی...',      href: '/coaches' },
  { id: 'shop',    label: 'تجهیزات', icon: ShoppingBag, placeholder: 'چوب، توپ، میز یا برند...',      href: '/shop'    },
  { id: 'players', label: 'بازیکنان', icon: Users,      placeholder: 'نام بازیکن یا شهر...',           href: '/players' },
];

const clubs = [
  { id:'1', name:'باشگاه ستاره تهران',   city:'تهران',  dist:'ونک',          tables:12, rating:4.9, reviews:284, type:'اسنوکر', img:IMG.club2, price:80000  },
  { id:'2', name:'باشگاه المپیک مشهد',   city:'مشهد',   dist:'احمدآباد',     tables:8,  rating:4.7, reviews:156, type:'پاکت',   img:IMG.club5, price:65000  },
  { id:'3', name:'باشگاه پیروزی اصفهان', city:'اصفهان', dist:'چهارباغ',      tables:10, rating:4.8, reviews:198, type:'هی‌بال', img:IMG.club6, price:75000  },
  { id:'4', name:'باشگاه حافظ شیراز',    city:'شیراز',  dist:'لطفعلی‌خان',   tables:6,  rating:4.6, reviews:89,  type:'اسنوکر', img:IMG.club1, price:55000  },
];

const products = [
  { id:'1', title:'چوب Predator 314-3',     price:12000000, sale:9600000,  pct:20, img:IMG.cue,   brand:'PREDATOR', featured:true  },
  { id:'2', title:'ست توپ Aramith Pro Cup', price:4500000,  sale:3825000,  pct:15, img:IMG.ball,  brand:'ARAMITH',  featured:false },
  { id:'3', title:'گچ Master Blue Diamond', price:850000,   sale:680000,   pct:20, img:IMG.chalk, brand:'MASTER',   featured:false },
  { id:'4', title:'نگهدارنده Longoni Elite', price:2200000, sale:1980000,  pct:10, img:IMG.rest,  brand:'LONGONI',  featured:false },
];

const courses = [
  { title:'مبانی بیلیارد برای مبتدیان', level:'مقدماتی', hrs:'۱۸', students:'۲,۴۰۰', color:'#30C55A' },
  { title:'تکنیک‌های پیشرفته اسنوکر',  level:'پیشرفته',  hrs:'۲۴', students:'۸۶۰',   color:'#007AFF' },
  { title:'استراتژی و روان‌شناسی بازی', level:'حرفه‌ای',  hrs:'۱۲', students:'۴۵۰',   color:GOLD      },
];

const news = [
  { id:'1', title:'برگزاری اولین دوره مسابقات بین‌المللی بیلیارد در تهران', date:'۵ خرداد', views:2341, cat:'مسابقات', catClr:'#1A7A5E', img:IMG.snooker2, featured:true  },
  { id:'2', title:'معرفی جدیدترین میزهای اسنوکر وارداتی به بازار ایران',    date:'۳ خرداد', views:1876, cat:'تجهیزات', catClr:BLU,       img:IMG.cue2,    featured:false },
  { id:'3', title:'آکادمی بیلیارد پلاس؛ آموزش آنلاین برای مبتدیان',         date:'۱ خرداد', views:3102, cat:'آموزش',   catClr:PRP,       img:IMG.proTable,featured:false },
];

// ── Liquid Glass Discovery Panel ───────────────────────────────────────────
function DiscoveryPanel() {
  const [tab, setTab]     = useState(0);
  const [query, setQuery] = useState('');
  const cur = discoverTabs[tab]!;
  return (
    <div style={{ position:'relative', background:'rgba(255,255,255,0.11)', backdropFilter:'blur(52px) saturate(240%)', WebkitBackdropFilter:'blur(52px) saturate(240%)', border:'1px solid rgba(255,255,255,0.22)', borderTop:'1px solid rgba(255,255,255,0.50)', borderRadius:'28px', overflow:'hidden', boxShadow:'inset 0 1.5px 0 rgba(255,255,255,0.48), 0 32px 80px rgba(0,0,0,0.30), 0 8px 28px rgba(0,0,0,0.18)', maxWidth:'680px', width:'100%' }}>
      {/* Top specular sheen */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'44%', background:'linear-gradient(180deg,rgba(255,255,255,0.20) 0%,rgba(255,255,255,0) 100%)', pointerEvents:'none', zIndex:0 }} />
      {/* Tab row */}
      <div style={{ display:'flex', padding:'12px 12px 0', gap:'4px', position:'relative', zIndex:1 }}>
        {discoverTabs.map((t, i) => {
          const TIcon = t.icon;
          const active = i === tab;
          return (
            <button key={t.id} onClick={() => setTab(i)} style={{ flex:1, padding:'10px 6px', borderRadius:'18px', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'12px', fontWeight:active ? 700 : 500, display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)', background:active ? 'rgba(255,255,255,0.24)' : 'transparent', color:active ? '#fff' : 'rgba(255,255,255,0.48)', boxShadow:active ? 'inset 0 1px 0 rgba(255,255,255,0.50), 0 2px 8px rgba(0,0,0,0.12)' : 'none' }}>
              <TIcon size={13} />{t.label}
            </button>
          );
        })}
      </div>
      {/* Search input */}
      <div style={{ padding:'14px 18px 12px', display:'flex', alignItems:'center', gap:'12px', borderBottom:'1px solid rgba(255,255,255,0.09)', position:'relative', zIndex:1 }}>
        <Search size={17} style={{ color:'rgba(255,255,255,0.55)', flexShrink:0 }} />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder={cur.placeholder}
          style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:'15px', color:'#fff', fontFamily:'inherit', direction:'rtl' }} />
      </div>
      {/* Filters + CTA */}
      <div style={{ padding:'12px 16px 16px', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', position:'relative', zIndex:1 }}>
        {['نوع', 'شهر', 'امتیاز'].map(f => (
          <button key={f} style={{ background:'rgba(255,255,255,0.09)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.16)', borderRadius:'24px', padding:'7px 14px', fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.68)', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'4px', transition:'all 0.25s' }}>
            {f} <ChevronDown size={9} />
          </button>
        ))}
        <div style={{ flex:1 }} />
        <Link href={cur.href}>
          <button style={{ background:`linear-gradient(135deg,${GOLD},${GOLD_D})`, color:'#fff', border:'none', borderRadius:'18px', padding:'11px 26px', fontSize:'13px', fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'7px', boxShadow:`0 4px 18px rgba(199,166,106,0.40)`, transition:'all 0.3s ease' }}>
            <Search size={13} />جستجو کن
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── Club card ──────────────────────────────────────────────────────────────
function ClubCard({ club, height = '320px' }: { club: typeof clubs[0]; height?: string }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/clubs/${club.id}`} style={{ textDecoration:'none', display:'block', height }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ position:'relative', borderRadius:'22px', overflow:'hidden', height:'100%', cursor:'pointer', transition:'transform 0.45s cubic-bezier(0.4,0,0.2,1), box-shadow 0.45s ease', transform:hov ? 'translateY(-6px) scale(1.01)' : 'none', boxShadow:hov ? '0 24px 60px rgba(0,0,0,0.22)' : '0 4px 16px rgba(0,0,0,0.09)' }}>
        <img src={club.img} alt={club.name} onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:hov ? 'brightness(0.68) saturate(0.85)' : 'brightness(0.55) saturate(0.75)', transition:'filter 0.45s ease, transform 0.7s ease', transform:hov ? 'scale(1.06)' : 'scale(1)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 25%,rgba(6,4,2,0.90) 100%)', pointerEvents:'none' }} />
        {/* Badges */}
        <div style={{ position:'absolute', top:'14px', right:'14px', display:'flex', gap:'6px' }}>
          <div style={{ background:'rgba(255,255,255,0.10)', backdropFilter:LGF, WebkitBackdropFilter:LGF, border:'1px solid rgba(255,255,255,0.20)', color:'rgba(255,255,255,0.85)', fontSize:'9px', fontWeight:700, padding:'4px 11px', borderRadius:'20px' }}>{club.type}</div>
        </div>
        <button onClick={e => e.preventDefault()} style={{ position:'absolute', top:'14px', left:'14px', width:'32px', height:'32px', borderRadius:'50%', background:'rgba(255,255,255,0.10)', backdropFilter:LGF, WebkitBackdropFilter:LGF, border:'1px solid rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:2 }}>
          <Heart size={12} style={{ color:'rgba(255,255,255,0.65)' }} />
        </button>
        {/* Glass bottom overlay */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:hov ? '20px 18px 18px' : '16px 18px 16px', background:'rgba(8,5,2,0.36)', backdropFilter:'blur(28px) saturate(180%)', WebkitBackdropFilter:'blur(28px) saturate(180%)', borderTop:'1px solid rgba(255,255,255,0.07)', transition:'padding 0.35s ease' }}>
          <div style={{ fontSize:'15px', fontWeight:800, color:'#fff', marginBottom:'6px', letterSpacing:'-0.02em', lineHeight:1.25 }}>{club.name}</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:hov ? '13px' : 0, transition:'margin 0.3s' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'5px', color:'rgba(255,255,255,0.48)', fontSize:'11px' }}><MapPin size={10} style={{ color:GOLD }} />{club.city}، {club.dist}</span>
            <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Star size={10} style={{ color:'#F5A623', fill:'#F5A623' }} /><span style={{ color:'#fff', fontSize:'12px', fontWeight:700 }}>{club.rating}</span><span style={{ color:'rgba(255,255,255,0.28)', fontSize:'10px' }}>({club.reviews})</span></span>
          </div>
          {hov && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize:'13px', fontWeight:800, color:GOLD }}>{club.price.toLocaleString('fa-IR')} <span style={{ fontSize:'10px', fontWeight:400, color:'rgba(255,255,255,0.35)' }}>ت/ساعت</span></div>
              <div style={{ background:`linear-gradient(135deg,${GRN},#1d5c35)`, color:'#fff', fontSize:'11px', fontWeight:700, padding:'8px 18px', borderRadius:'11px' }}>رزرو آنلاین</div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const rafRef    = useRef<number>(0);
  const [imgIdx, setImgIdx]   = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const fn = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY)); };
    window.addEventListener('scroll', fn, { passive:true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setImgIdx(i => (i + 1) % heroImages.length), 7000);
    return () => clearInterval(t);
  }, []);

  const heroO = Math.max(0, 1 - scrollY / 700);
  const heroS = 1 + scrollY * 0.00016;

  return (
    <>
      <style>{`
        @keyframes pulse2  { 0%,100%{opacity:1;}50%{opacity:0.3;} }
        @keyframes floatBg { 0%,100%{transform:translate(0,0);}40%{transform:translate(22px,-16px);}70%{transform:translate(-16px,10px);} }
        @keyframes slideB  { from{width:0}to{width:100%} }
        @keyframes scrollH { 0%,100%{transform:translateY(0);opacity:0.7;}50%{transform:translateY(10px);opacity:0.12;} }
        @keyframes ha      { from{opacity:0;transform:translateY(32px) scale(0.97);filter:blur(5px);}to{opacity:1;transform:none;filter:blur(0);} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;} }
        @keyframes imgIn   { from{opacity:0;transform:scale(1.04);}to{opacity:1;transform:scale(1);} }

        .ha  { animation:ha 1.3s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
        .hb  { animation:ha 1.1s cubic-bezier(0.22,1,0.36,1) 0.28s both; }
        .hc  { animation:ha 0.9s cubic-bezier(0.22,1,0.36,1) 0.50s both; }
        .hd  { animation:ha 0.9s cubic-bezier(0.22,1,0.36,1) 0.68s both; }

        /* ── Buttons ── */
        .btn-gold {
          background:linear-gradient(135deg,${GOLD},${GOLD_D});
          color:#fff;border:none;border-radius:14px;padding:14px 30px;
          font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;
          position:relative;overflow:hidden;letter-spacing:0.01em;
          transition:transform 0.3s cubic-bezier(0.4,0,0.2,1),box-shadow 0.3s ease;
          box-shadow:0 0 0 1px ${GOLD_BOR},0 6px 24px rgba(199,166,106,0.28);
        }
        .btn-gold::after{content:'';position:absolute;top:0;left:-80%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent);transform:skewX(-20deg);transition:left 0.5s;}
        .btn-gold:hover{transform:translateY(-2px);box-shadow:0 0 0 1px ${GOLD_BOR},0 12px 30px rgba(199,166,106,0.36);}
        .btn-gold:hover::after{left:140%;}
        .btn-gold:active{transform:scale(0.98);}

        .btn-grn {
          background:linear-gradient(135deg,${GRN},#1d5c35);
          color:#fff;border:none;border-radius:14px;padding:14px 28px;
          font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;
          transition:transform 0.3s ease,box-shadow 0.3s ease;
          box-shadow:0 6px 22px rgba(42,122,74,0.28);
        }
        .btn-grn:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(42,122,74,0.38);}

        .btn-ghost {
          background:rgba(255,255,255,0.07);color:#fff;
          border:1px solid rgba(255,255,255,0.16);border-radius:14px;
          padding:14px 28px;font-size:14px;font-weight:600;
          cursor:pointer;backdrop-filter:blur(16px);font-family:inherit;
          transition:all 0.3s ease;
        }
        .btn-ghost:hover{background:rgba(255,255,255,0.12);border-color:rgba(199,166,106,0.38);}

        .btn-ghost-lt {
          background:transparent;color:${TEXT};
          border:1.5px solid rgba(28,28,26,0.12);border-radius:14px;
          padding:13px 26px;font-size:13px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:all 0.3s;
        }
        .btn-ghost-lt:hover{border-color:${GRN};color:${GRN};}

        /* ── Discovery panel filter hover ── */
        .dp-filter:hover{background:rgba(255,255,255,0.16) !important;border-color:rgba(255,255,255,0.28) !important;}
        .dp-cta:hover{transform:translateY(-2px);box-shadow:0 8px 26px rgba(199,166,106,0.50) !important;}

        /* ── Liquid Glass card sheen ── */
        .lg-card{position:relative;overflow:hidden;}
        .lg-card::before{content:'';position:absolute;top:0;left:0;right:0;height:46%;background:linear-gradient(180deg,rgba(255,255,255,0.44) 0%,rgba(255,255,255,0) 100%);border-radius:inherit;pointer-events:none;z-index:1;}

        /* ── Product hover ── */
        .prod-c{transition:transform 0.35s cubic-bezier(0.4,0,0.2,1),box-shadow 0.35s ease;}
        .prod-c:hover{transform:translateY(-5px);box-shadow:0 16px 44px rgba(28,28,26,0.12) !important;}

        /* ── News img zoom ── */
        .ni img{transition:transform 0.6s cubic-bezier(0.4,0,0.2,1);}
        .ni:hover img{transform:scale(1.05);}

        /* ── Responsive ── */
        @media(max-width:1100px){
          .club-hero-row{grid-template-columns:1fr 1fr !important;}
          .mkt-split{grid-template-columns:1fr !important;}
          .edu-split{grid-template-columns:1fr !important;}
          .news-ed{grid-template-columns:1fr !important;}
          .comm-nums{grid-template-columns:repeat(3,1fr) !important;}
        }
        @media(max-width:768px){
          .club-hero-row{grid-template-columns:1fr !important;}
          .mkt-sub{grid-template-columns:1fr 1fr !important;}
          .hero-thumbs{display:none !important;}
          .disc-panel{padding:0 16px !important;}
          .comm-nums{grid-template-columns:1fr 1fr !important;}
        }
        @media(max-width:480px){
          .mkt-sub{grid-template-columns:1fr !important;}
          .comm-nums{grid-template-columns:1fr !important;}
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════
          §1  HERO — cinematic + Liquid Glass discovery
      ═══════════════════════════════════════════════════ */}
      <div style={{ position:'relative', height:'100vh', minHeight:'720px', overflow:'hidden', background:'#07060A' }}>

        {/* Background image slides */}
        {heroImages.map((src, i) => (
          <div key={i} style={{ position:'absolute', inset:0, opacity:i === imgIdx ? 1 : 0, transition:'opacity 3s cubic-bezier(0.4,0,0.2,1)', zIndex:0 }}>
            <img src={src} alt="" loading={i === 0 ? 'eager' : 'lazy'}
              style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.26) saturate(0.55) contrast(1.06)', transform:`scale(${heroS})`, transformOrigin:'center', willChange:'transform' }}
              onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
          </div>
        ))}

        <video ref={videoRef} autoPlay muted loop playsInline preload="metadata"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.05, zIndex:1 }}>
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Gradients */}
        <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', background:'linear-gradient(to bottom,rgba(4,2,8,0.75) 0%,rgba(4,2,8,0.06) 28%,rgba(4,2,8,0.06) 50%,rgba(4,2,8,0.97) 100%)' }} />
        <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', background:'radial-gradient(ellipse 80% 70% at 50% 50%,rgba(4,2,8,0) 0%,rgba(4,2,8,0.40) 100%)' }} />
        {/* Ambient gold glow */}
        <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:'70vw', height:'50vw', maxWidth:'800px', borderRadius:'50%', background:`radial-gradient(ellipse,rgba(199,166,106,0.055),transparent 65%)`, filter:'blur(60px)', zIndex:3, pointerEvents:'none', animation:'floatBg 20s ease-in-out infinite' }} />

        {/* Content */}
        <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 7%', opacity:heroO, transform:`translateY(${scrollY * 0.07}px)` }}>
          {/* Tag */}
          <div className="hb" style={{ display:'inline-flex', alignItems:'center', gap:'9px', background:'rgba(255,255,255,0.06)', border:`1px solid rgba(255,255,255,0.14)`, borderRadius:'100px', padding:'7px 20px', marginBottom:'26px', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }}>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:GOLD, boxShadow:`0 0 8px ${GOLD},0 0 18px ${GOLD}60`, display:'inline-block', animation:'pulse2 3s infinite' }} />
            <span style={{ color:GOLD_DIM, fontSize:'9px', fontWeight:700, letterSpacing:'0.22em' }}>THE DIGITAL HOME OF BILLIARDS</span>
          </div>

          {/* Main heading */}
          <h1 className="ha" style={{ fontSize:'clamp(54px,9vw,118px)', fontWeight:900, color:'#fff', lineHeight:0.94, margin:'0 0 20px', letterSpacing:'-0.055em', textAlign:'center', textShadow:'0 0 100px rgba(199,166,106,0.10), 0 2px 0 rgba(0,0,0,0.4)' }}>
            خانه بیلیارد
          </h1>
          <p className="hb" style={{ fontSize:'clamp(14px,1.7vw,19px)', color:'rgba(255,255,255,0.35)', margin:'0 0 46px', letterSpacing:'0.08em', textAlign:'center', fontWeight:400 }}>
            کشف کن · بازی کن · رشد کن
          </p>

          {/* ── Liquid Glass Discovery Panel ── */}
          <div className="hc disc-panel" style={{ width:'100%', display:'flex', justifyContent:'center' }}>
            <DiscoveryPanel />
          </div>

          {/* Quick trust signals */}
          <div className="hd" style={{ display:'flex', gap:'20px', marginTop:'36px', justifyContent:'center', flexWrap:'wrap' }}>
            {[{ v:'۵۴۸', l:'باشگاه' }, { v:'۱۲K+', l:'بازیکن' }, { v:'۱,۸۵۰', l:'محصول' }, { v:'۴.۸★', l:'امتیاز' }].map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'6px 14px', background:'rgba(255,255,255,0.055)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'24px' }}>
                <span style={{ fontSize:'13px', fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>{s.v}</span>
                <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.32)', letterSpacing:'0.06em' }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slide progress */}
        <div style={{ position:'absolute', bottom:'40px', left:'50%', transform:'translateX(-50%)', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', gap:'11px', opacity:heroO }}>
          <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
            {heroImages.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)} style={{ position:'relative', height:'2px', width:i === imgIdx ? '40px' : '12px', borderRadius:'1px', border:'none', cursor:'pointer', padding:0, background:'rgba(255,255,255,0.14)', overflow:'hidden', transition:'width 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
                {i === imgIdx && <span style={{ position:'absolute', inset:0, background:GOLD, boxShadow:`0 0 8px ${GOLD}`, animation:'slideB 7s linear forwards' }} />}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
            <span style={{ fontSize:'11px', fontWeight:800, color:'#fff' }}>{String(imgIdx + 1).padStart(2,'0')}</span>
            <span style={{ width:'16px', height:'1px', background:'rgba(255,255,255,0.18)' }} />
            <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.24)' }}>{String(heroImages.length).padStart(2,'0')}</span>
          </div>
        </div>

        {/* Video toggle */}
        <button onClick={() => { if (videoRef.current) { if (playing) { videoRef.current.pause(); setPlaying(false); } else { videoRef.current.play(); setPlaying(true); } } }}
          style={{ position:'absolute', bottom:'40px', right:'28px', zIndex:10, width:'32px', height:'32px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', cursor:'pointer', color:'rgba(255,255,255,0.34)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', opacity:heroO, transition:'all 0.3s' }}>
          {playing ? <Pause size={11} /> : <Play size={11} />}
        </button>

        {/* Scroll hint */}
        <div style={{ position:'absolute', bottom:'36px', left:'28px', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', opacity:Math.max(0, heroO - 0.3) }}>
          <span style={{ fontSize:'7px', color:'rgba(255,255,255,0.14)', letterSpacing:'0.26em', writingMode:'vertical-rl' }}>SCROLL</span>
          <div style={{ width:'1px', height:'32px', background:`linear-gradient(to bottom,${GOLD}40,transparent)`, animation:'scrollH 2.5s ease infinite' }} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          §2  CLUB DISCOVERY — Airbnb editorial
      ═══════════════════════════════════════════════════ */}
      <section style={{ background:'#F3F2EE', padding:'96px 7% 100px' }}>
        <SR>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'44px', flexWrap:'wrap', gap:'18px' }}>
              <div>
                <div style={{ fontSize:'9px', color:`${GRN}CC`, letterSpacing:'0.32em', fontWeight:700, marginBottom:'12px', textTransform:'uppercase' }}>PREMIUM VENUES</div>
                <h2 style={{ fontSize:'clamp(28px,4vw,50px)', fontWeight:900, color:TEXT, margin:0, letterSpacing:'-0.045em', lineHeight:1 }}>کشف باشگاه‌ها</h2>
                <div style={{ height:'2px', width:'48px', background:`linear-gradient(90deg,${GRN},transparent)`, marginTop:'14px', borderRadius:'1px' }} />
              </div>
              <Link href="/clubs" style={{ display:'flex', alignItems:'center', gap:'5px', textDecoration:'none', color:TEXT_M, fontSize:'13px', fontWeight:600, transition:'color 0.25s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GRN; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_M; }}>
                مشاهده ۵۴۸ باشگاه <ArrowLeft size={13} />
              </Link>
            </div>

            {/* HERO club card — full width */}
            <div style={{ marginBottom:'18px' }}>
              <ClubCard club={clubs[0]!} height="500px" />
            </div>

            {/* 3 smaller cards */}
            <div className="club-hero-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'18px' }}>
              {clubs.slice(1).map(c => <ClubCard key={c.id} club={c} height="320px" />)}
            </div>

            {/* CTA row */}
            <div style={{ marginTop:'32px', display:'flex', justifyContent:'center', gap:'12px' }}>
              <Link href="/clubs"><button className="btn-grn" style={{ display:'flex', alignItems:'center', gap:'8px' }}><MapPin size={14} /> جستجو روی نقشه</button></Link>
              <Link href="/clubs"><button className="btn-ghost-lt">همه باشگاه‌ها</button></Link>
            </div>
          </div>
        </SR>
      </section>

      {/* ═══════════════════════════════════════════════════
          §3  MARKETPLACE — Apple Store editorial
      ═══════════════════════════════════════════════════ */}
      <section style={{ background:'#FFFFFF', padding:'96px 7% 100px' }}>
        <SR>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'44px', flexWrap:'wrap', gap:'18px' }}>
              <div>
                <div style={{ fontSize:'9px', color:`${BRN}CC`, letterSpacing:'0.32em', fontWeight:700, marginBottom:'12px', textTransform:'uppercase' }}>BILLIARD BAZAAR</div>
                <h2 style={{ fontSize:'clamp(28px,4vw,50px)', fontWeight:900, color:TEXT, margin:0, letterSpacing:'-0.045em', lineHeight:1 }}>بازار تجهیزات</h2>
                <div style={{ height:'2px', width:'48px', background:`linear-gradient(90deg,${BRN},transparent)`, marginTop:'14px', borderRadius:'1px' }} />
              </div>
              <Link href="/shop" style={{ display:'flex', alignItems:'center', gap:'5px', textDecoration:'none', color:TEXT_M, fontSize:'13px', fontWeight:600, transition:'color 0.25s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = BRN; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_M; }}>
                مشاهده ۱,۸۵۰ محصول <ArrowLeft size={13} />
              </Link>
            </div>

            {/* Editorial: hero product (55%) + 3 stacked (45%) */}
            <div className="mkt-split" style={{ display:'grid', gridTemplateColumns:'55fr 45fr', gap:'18px', alignItems:'stretch' }}>
              {/* Hero product */}
              {products[0] && (
                <Link href={`/shop/${products[0].id}`} style={{ textDecoration:'none' }}>
                  <div className="prod-c" style={{ position:'relative', borderRadius:'24px', overflow:'hidden', height:'540px', cursor:'pointer', boxShadow:'0 4px 22px rgba(28,28,26,0.08)' }}>
                    <img src={products[0].img} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.45) saturate(0.62)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 18%,rgba(6,3,1,0.96) 100%)' }} />
                    {/* Discount badge */}
                    <div style={{ position:'absolute', top:'18px', right:'18px', background:'rgba(185,28,28,0.88)', color:'#fff', fontSize:'9px', fontWeight:700, padding:'4px 12px', borderRadius:'20px' }}>{products[0].pct}٪ تخفیف</div>
                    <div style={{ position:'absolute', top:'18px', left:'18px', fontSize:'9px', fontWeight:800, color:GOLD_DIM, letterSpacing:'0.20em' }}>{products[0].brand}</div>
                    {/* Glass info */}
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'24px 24px 22px', background:'rgba(8,4,1,0.38)', backdropFilter:'blur(28px) saturate(180%)', WebkitBackdropFilter:'blur(28px) saturate(180%)', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize:'clamp(16px,1.8vw,20px)', fontWeight:800, color:'#fff', marginBottom:'14px', letterSpacing:'-0.02em', lineHeight:1.3 }}>{products[0].title}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                        <div>
                          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.28)', textDecoration:'line-through', marginBottom:'3px' }}>{products[0].price.toLocaleString('fa-IR')} ت</div>
                          <div style={{ fontSize:'24px', fontWeight:900, color:GOLD, letterSpacing:'-0.03em' }}>{products[0].sale.toLocaleString('fa-IR')} <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.32)', fontWeight:400 }}>ت</span></div>
                        </div>
                        <div style={{ background:`linear-gradient(135deg,${BRN},#5a3518)`, color:'#fff', fontSize:'12px', fontWeight:700, padding:'11px 22px', borderRadius:'13px' }}>افزودن به سبد</div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* 3 stacked smaller products */}
              <div className="mkt-sub" style={{ display:'grid', gridTemplateColumns:'1fr', gap:'18px' }}>
                {products.slice(1).map(p => (
                  <Link key={p.id} href={`/shop/${p.id}`} style={{ textDecoration:'none' }}>
                    <div className="prod-c" style={{ display:'flex', gap:'0', borderRadius:'18px', overflow:'hidden', background:'#F5F4F0', border:`1px solid ${BORDER}`, boxShadow:'0 2px 10px rgba(28,28,26,0.05)' }}>
                      {/* Image */}
                      <div style={{ width:'140px', flexShrink:0, position:'relative', overflow:'hidden' }}>
                        <img src={p.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.48) saturate(0.62)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to left,rgba(6,3,1,0.85) 0%,transparent 50%)' }} />
                        {p.pct > 0 && <div style={{ position:'absolute', top:'9px', right:'9px', background:'rgba(185,28,28,0.88)', color:'#fff', fontSize:'8px', fontWeight:700, padding:'3px 8px', borderRadius:'20px' }}>{p.pct}٪</div>}
                        <div style={{ position:'absolute', bottom:'9px', right:'9px', fontSize:'8px', fontWeight:800, color:GOLD_DIM, letterSpacing:'0.18em' }}>{p.brand}</div>
                      </div>
                      {/* Info */}
                      <div style={{ flex:1, padding:'16px 18px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:TEXT, lineHeight:1.5, marginBottom:'8px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.title}</div>
                        <div style={{ fontSize:'10px', color:TEXT_M, textDecoration:'line-through', marginBottom:'2px' }}>{p.price.toLocaleString('fa-IR')}</div>
                        <div style={{ fontSize:'16px', fontWeight:900, color:BRN }}>{p.sale.toLocaleString('fa-IR')} <span style={{ fontSize:'10px', fontWeight:400, color:TEXT_M }}>ت</span></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div style={{ marginTop:'36px', display:'flex', justifyContent:'center', gap:'12px' }}>
              <Link href="/shop"><button className="btn-gold" style={{ display:'flex', alignItems:'center', gap:'8px' }}><ShoppingBag size={14} /> ورود به بازار بیلیارد</button></Link>
              <Link href="/sellers"><button className="btn-ghost-lt">فروش تجهیزات</button></Link>
            </div>
          </div>
        </SR>
      </section>

      {/* ═══════════════════════════════════════════════════
          §4  COMMUNITY — atmospheric, belonging
      ═══════════════════════════════════════════════════ */}
      <section style={{ position:'relative', background:'#0C0A08', overflow:'hidden', padding:'100px 7%' }}>
        {/* Background photography */}
        <img src={IMG.club3} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.14, filter:'saturate(0.3) contrast(1.2)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(8,6,4,0.60) 0%,rgba(8,6,4,0.20) 30%,rgba(8,6,4,0.20) 70%,rgba(8,6,4,0.70) 100%)', pointerEvents:'none' }} />
        {/* Gold ambient */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'700px', height:'500px', background:`radial-gradient(${GOLD}04,transparent 70%)`, filter:'blur(60px)', pointerEvents:'none' }} />
        <SR>
          <div style={{ maxWidth:'1100px', margin:'0 auto', position:'relative', zIndex:2, textAlign:'center' }}>
            <div style={{ fontSize:'9px', color:GOLD_DIM, letterSpacing:'0.32em', fontWeight:700, marginBottom:'20px', textTransform:'uppercase' }}>JOIN THE COMMUNITY</div>
            <h2 style={{ fontSize:'clamp(28px,4.5vw,58px)', fontWeight:900, color:'#fff', margin:'0 0 16px', letterSpacing:'-0.05em', lineHeight:1, textShadow:'0 0 80px rgba(199,166,106,0.10)' }}>
              جامعه بیلیارد ایران
            </h2>
            <p style={{ fontSize:'clamp(14px,1.7vw,18px)', color:'rgba(255,255,255,0.35)', marginBottom:'60px', lineHeight:1.8, maxWidth:'500px', margin:'0 auto 60px' }}>
              بزرگ‌ترین اکوسیستم بیلیارد خاورمیانه — از تهران تا شیراز، از مبتدی تا قهرمان ملی
            </p>
            {/* Big numbers */}
            <div className="comm-nums" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'20px', marginBottom:'56px' }}>
              {[
                { v:'۱۲,۴۰۰', l:'بازیکن ثبت‌شده', sub:'از سراسر ایران',   border:`1px solid ${GOLD}20` },
                { v:'۵۴۸',    l:'باشگاه فعال',     sub:'در ۳۱ استان',      border:`1px solid rgba(255,255,255,0.06)` },
                { v:'۲۱۸',    l:'مسابقه سال جاری', sub:'ملی و بین‌المللی', border:`1px solid rgba(255,255,255,0.06)` },
                { v:'۳۱',     l:'استان',            sub:'حضور سراسری',      border:`1px solid rgba(255,255,255,0.06)` },
              ].map((s, i) => (
                <div key={i} style={{ padding:'28px 16px', background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)', border:s.border, borderRadius:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'44%', background:'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,transparent 100%)', pointerEvents:'none' }} />
                  <div style={{ fontSize:'clamp(28px,3.5vw,44px)', fontWeight:900, color: i === 0 ? GOLD : '#fff', letterSpacing:'-0.05em', lineHeight:1, marginBottom:'8px', position:'relative' }}>{s.v}</div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.70)', marginBottom:'4px', position:'relative' }}>{s.l}</div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.28)', position:'relative' }}>{s.sub}</div>
                </div>
              ))}
            </div>
            {/* Avatar cluster */}
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', marginBottom:'32px' }}>
              <div style={{ display:'flex' }}>
                {['م', 'ر', 'ا', 'ن', 'ک'].map((c, i) => (
                  <div key={i} style={{ width:'44px', height:'44px', borderRadius:'50%', background:`linear-gradient(135deg,${['#2A7A4A','#1E5A8C',GOLD,'#6B4DB3','#7A4A2A'][i]},${['#1d5c35','#16457a',GOLD_D,'#52389a','#5a3518'][i]})`, border:'2.5px solid #0C0A08', marginLeft: i > 0 ? '-12px' : 0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:900, color:'#fff', zIndex:5 - i, position:'relative' }}>
                    {c}
                  </div>
                ))}
                <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(16px)', border:'2.5px solid #0C0A08', marginLeft:'-12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.60)', position:'relative', zIndex:0 }}>
                  ۱۲K+
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/ranking"><button className="btn-gold" style={{ display:'flex', alignItems:'center', gap:'8px' }}>رنکینگ ملی <ArrowLeft size={13} /></button></Link>
              <Link href="/register"><button className="btn-ghost">ثبت‌نام رایگان</button></Link>
            </div>
          </div>
        </SR>
      </section>

      {/* ═══════════════════════════════════════════════════
          §5  EDUCATION — aspirational
      ═══════════════════════════════════════════════════ */}
      <section style={{ position:'relative', background:'#0A1328', overflow:'hidden', padding:'96px 7% 100px' }}>
        <img src={IMG.proTable} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.09, filter:'saturate(0.3) contrast(1.1)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to left,rgba(10,19,40,0) 0%,rgba(10,19,40,0.98) 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'50%', right:'20%', transform:'translateY(-50%)', width:'450px', height:'450px', background:`radial-gradient(${PRP}06,transparent 70%)`, filter:'blur(70px)', pointerEvents:'none' }} />
        <SR>
          <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative', zIndex:2 }}>
            <div className="edu-split" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'72px', alignItems:'center' }}>
              {/* Image panel */}
              <div style={{ position:'relative', borderRadius:'24px', overflow:'hidden', height:'460px' }}>
                <img src={IMG.snooker} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.55) saturate(0.65)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(10,19,40,0.92) 0%,transparent 50%)' }} />
                {/* Glass badge */}
                <div style={{ position:'absolute', top:'18px', right:'18px', background:'rgba(255,255,255,0.09)', backdropFilter:LGF, WebkitBackdropFilter:LGF, border:'1px solid rgba(255,255,255,0.16)', borderRadius:'14px', padding:'9px 16px', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'44%', background:'linear-gradient(180deg,rgba(255,255,255,0.24) 0%,transparent 100%)', pointerEvents:'none' }} />
                  <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.78)', fontWeight:700, letterSpacing:'0.12em', position:'relative' }}>BILLIARD ACADEMY</span>
                </div>
                <div style={{ position:'absolute', bottom:'18px', right:'18px', left:'18px', display:'flex', gap:'8px' }}>
                  {['مبتدی', 'پیشرفته', 'حرفه‌ای'].map(t => (
                    <div key={t} style={{ flex:1, padding:'8px 0', background:'rgba(255,255,255,0.07)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.11)', borderRadius:'10px', textAlign:'center' }}>
                      <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.60)', fontWeight:600 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Content */}
              <div>
                <div style={{ fontSize:'9px', color:`${PRP}CC`, letterSpacing:'0.32em', fontWeight:700, marginBottom:'14px', textTransform:'uppercase' }}>EDUCATION & COACHING</div>
                <h2 style={{ fontSize:'clamp(26px,3.5vw,46px)', fontWeight:900, color:'#fff', margin:'0 0 14px', letterSpacing:'-0.045em', lineHeight:1.02 }}>بازی را حرفه‌ای یاد بگیر</h2>
                <div style={{ height:'2px', width:'46px', background:`linear-gradient(90deg,${PRP},transparent)`, marginBottom:'20px', borderRadius:'1px' }} />
                <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.38)', marginBottom:'32px', lineHeight:1.85 }}>با مربیان تأیید شده فدراسیون بیلیارد ایران — از صفر تا قهرمان</p>
                {/* Course cards */}
                <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'30px' }}>
                  {courses.map((c, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', background:'rgba(255,255,255,0.052)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'44%', background:'linear-gradient(180deg,rgba(255,255,255,0.055) 0%,transparent 100%)', pointerEvents:'none' }} />
                      <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:c.color, flexShrink:0, boxShadow:`0 0 8px ${c.color}` }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', marginBottom:'2px' }}>{c.title}</div>
                        <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.28)' }}>{c.level} · {c.hrs} ساعت · {c.students} دانشجو</div>
                      </div>
                      <ArrowLeft size={13} style={{ color:'rgba(255,255,255,0.20)', flexShrink:0 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'11px', flexWrap:'wrap' }}>
                  <Link href="/education"><button className="btn-gold">شروع یادگیری</button></Link>
                  <Link href="/coaches"><button className="btn-ghost" style={{ display:'flex', alignItems:'center', gap:'7px' }}>یافتن مربی <ArrowLeft size={13} /></button></Link>
                </div>
              </div>
            </div>
          </div>
        </SR>
      </section>

      {/* ═══════════════════════════════════════════════════
          §6  TOURNAMENTS — compact, one card
      ═══════════════════════════════════════════════════ */}
      <section style={{ background:'#FFFFFF', padding:'80px 7%' }}>
        <SR>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'32px', flexWrap:'wrap', gap:'16px' }}>
              <div>
                <div style={{ fontSize:'9px', color:GOLD_DIM, letterSpacing:'0.32em', fontWeight:700, marginBottom:'11px', textTransform:'uppercase' }}>EVENTS & TOURNAMENTS</div>
                <h2 style={{ fontSize:'clamp(22px,3vw,36px)', fontWeight:900, color:TEXT, margin:0, letterSpacing:'-0.04em' }}>مسابقات پیش رو</h2>
              </div>
              <Link href="/events" style={{ display:'flex', alignItems:'center', gap:'5px', textDecoration:'none', color:TEXT_M, fontSize:'13px', fontWeight:600, transition:'color 0.25s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GOLD_D; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_M; }}>
                همه رویدادها <ArrowLeft size={13} />
              </Link>
            </div>
            <div style={{ position:'relative', borderRadius:'22px', overflow:'hidden', height:'300px' }}>
              <img src={IMG.snooker2} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.38) saturate(0.60)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,rgba(6,3,1,0.97) 0%,rgba(6,3,1,0.55) 55%,rgba(6,3,1,0.12) 100%)' }} />
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', padding:'0 42px' }}>
                <div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(199,166,106,0.10)', border:`1px solid ${GOLD_BOR}`, borderRadius:'100px', padding:'6px 16px', marginBottom:'18px' }}>
                    <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#ef4444', display:'inline-block', animation:'pulse2 1.8s infinite' }} />
                    <Trophy size={10} style={{ color:GOLD }} />
                    <span style={{ fontSize:'8px', color:GOLD, fontWeight:700, letterSpacing:'0.22em' }}>FEATURED TOURNAMENT</span>
                  </div>
                  <h3 style={{ fontSize:'clamp(18px,2.5vw,28px)', fontWeight:900, color:'#fff', margin:'0 0 10px', letterSpacing:'-0.03em', lineHeight:1.1 }}>مسابقات سراسری اسنوکر ایران ۱۴۰۴</h3>
                  <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.36)', marginBottom:'22px' }}>۶۴ بازیکن برتر · جایزه ۵۰ میلیون تومانی · تهران · ۱۵ خرداد ۱۴۰۴</p>
                  <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                    <Link href="/events/1"><button className="btn-gold">ثبت‌نام در مسابقه</button></Link>
                    <Link href="/events"><button className="btn-ghost" style={{ display:'flex', alignItems:'center', gap:'6px' }}>همه رویدادها <ArrowLeft size={12} /></button></Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SR>
      </section>

      {/* ═══════════════════════════════════════════════════
          §7  NEWS — minimal editorial
      ═══════════════════════════════════════════════════ */}
      <section style={{ background:'#F3F2EE', padding:'80px 7%' }}>
        <SR>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'32px', flexWrap:'wrap', gap:'16px' }}>
              <div>
                <div style={{ fontSize:'9px', color:'rgba(107,30,58,0.75)', letterSpacing:'0.32em', fontWeight:700, marginBottom:'11px', textTransform:'uppercase' }}>LATEST NEWS</div>
                <h2 style={{ fontSize:'clamp(22px,3vw,36px)', fontWeight:900, color:TEXT, margin:0, letterSpacing:'-0.04em' }}>آخرین اخبار</h2>
              </div>
              <Link href="/news" style={{ display:'flex', alignItems:'center', gap:'5px', textDecoration:'none', color:TEXT_M, fontSize:'13px', fontWeight:600, transition:'color 0.25s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6B1E3A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_M; }}>
                همه اخبار <ArrowLeft size={13} />
              </Link>
            </div>
            <div className="news-ed" style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:'18px' }}>
              {news[0] && (
                <Link href={`/news/${news[0].id}`} style={{ textDecoration:'none' }}>
                  <div className="ni" style={{ position:'relative', height:'380px', borderRadius:'22px', overflow:'hidden', cursor:'pointer', boxShadow:'0 4px 18px rgba(28,28,26,0.08)' }}>
                    <img src={news[0].img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.48) saturate(0.70)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 20%,rgba(6,3,1,0.95) 100%)' }} />
                    <div style={{ position:'absolute', top:'16px', right:'16px', fontSize:'9px', fontWeight:700, padding:'4px 12px', borderRadius:'20px', color:news[0].catClr, background:`${news[0].catClr}18`, border:`1px solid ${news[0].catClr}30`, backdropFilter:'blur(16px)' }}>{news[0].cat}</div>
                    <div style={{ position:'absolute', bottom:'22px', right:'20px', left:'20px' }}>
                      <h3 style={{ fontSize:'clamp(14px,1.7vw,18px)', fontWeight:800, color:'#fff', marginBottom:'10px', lineHeight:1.45, letterSpacing:'-0.02em' }}>{news[0].title}</h3>
                      <div style={{ display:'flex', gap:'14px', fontSize:'10px', color:'rgba(255,255,255,0.34)' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><Clock size={9} />{news[0].date}</span>
                        <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><Eye size={9} />{news[0].views.toLocaleString('fa-IR')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
                {news.slice(1).map(n => (
                  <Link key={n.id} href={`/news/${n.id}`} style={{ textDecoration:'none', flex:1 }}>
                    <div className="ni" style={{ position:'relative', height:'181px', borderRadius:'18px', overflow:'hidden', boxShadow:'0 2px 10px rgba(28,28,26,0.07)' }}>
                      <img src={n.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.48) saturate(0.70)' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 20%,rgba(6,3,1,0.94) 100%)' }} />
                      <div style={{ position:'absolute', top:'11px', right:'11px', fontSize:'8px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', color:n.catClr, background:`${n.catClr}18`, border:`1px solid ${n.catClr}28`, backdropFilter:'blur(16px)' }}>{n.cat}</div>
                      <div style={{ position:'absolute', bottom:'13px', right:'13px', left:'13px' }}>
                        <div style={{ fontSize:'12px', fontWeight:700, color:'#fff', lineHeight:1.5, marginBottom:'6px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{n.title}</div>
                        <div style={{ display:'flex', gap:'11px', fontSize:'9px', color:'rgba(255,255,255,0.30)' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Clock size={8} />{n.date}</span>
                          <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Eye size={8} />{n.views.toLocaleString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SR>
      </section>

      {/* ═══════════════════════════════════════════════════
          §8  FINAL CTA — emotional dark
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding:'0 7% 80px', background:'#F3F2EE' }}>
        <SR>
          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ position:'relative', borderRadius:'30px', overflow:'hidden', padding:'88px 52px', textAlign:'center', background:'#1C1C1A' }}>
              <img src={IMG.club1} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.07 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'650px', height:'450px', background:`radial-gradient(ellipse,rgba(199,166,106,0.07),transparent 68%)`, pointerEvents:'none', filter:'blur(24px)' }} />
              <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'220px', height:'1px', background:`linear-gradient(90deg,transparent,${GOLD}55,transparent)`, boxShadow:`0 0 22px ${GOLD}35` }} />
              <div style={{ position:'relative', zIndex:2 }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(199,166,106,0.08)', border:`1px solid ${GOLD_BOR}`, borderRadius:'100px', padding:'6px 18px', marginBottom:'22px' }}>
                  <CheckCircle size={10} style={{ color:GOLD }} />
                  <span style={{ fontSize:'9px', color:GOLD, letterSpacing:'0.20em', fontWeight:700 }}>JOIN FREE TODAY</span>
                </div>
                <h2 style={{ fontSize:'clamp(30px,4.5vw,56px)', fontWeight:900, color:'#fff', marginBottom:'14px', letterSpacing:'-0.05em', lineHeight:1 }}>همین الان شروع کن</h2>
                <p style={{ color:'rgba(255,255,255,0.30)', fontSize:'15px', lineHeight:1.85, maxWidth:'360px', margin:'0 auto 42px' }}>
                  باشگاه پیدا کن، تجهیزات بخر، به جامعه بپیوند
                </p>
                <div style={{ display:'flex', justifyContent:'center', gap:'12px', flexWrap:'wrap' }}>
                  <Link href="/register"><button className="btn-gold" style={{ padding:'16px 40px', fontSize:'15px' }}>ثبت‌نام رایگان</button></Link>
                  <Link href="/clubs"><button className="btn-ghost" style={{ display:'flex', alignItems:'center', gap:'7px', padding:'16px 40px', fontSize:'15px' }}><Building2 size={15} /> یافتن باشگاه</button></Link>
                </div>
              </div>
            </div>
          </div>
        </SR>
      </section>
    </>
  );
}
