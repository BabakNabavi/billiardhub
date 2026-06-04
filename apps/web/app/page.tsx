'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Trophy, Star, TrendingUp,
  MapPin, Clock, Shield, ChevronRight,
  Play, Zap, Users, Calendar, Activity,
} from 'lucide-react';

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

const LIVE_MATCHES = [
  { p1:'امیرحسین رضایی', p2:'سعید موسوی',  s1:4, s2:3, round:'نیمه‌نهایی', event:'لیگ برتر ۱۴۰۴', p1r:3, p2r:1 },
  { p1:'محمد حسینی',     p2:'رضا کریمی',   s1:2, s2:2, round:'نیمه‌نهایی', event:'لیگ برتر ۱۴۰۴', p1r:2, p2r:4 },
  { p1:'نیما نوری',      p2:'کاوه رستمی',  s1:1, s2:0, round:'ربع‌نهایی',  event:'جام تهران',       p1r:5, p2r:6 },
];

const CLUBS = [
  { name:'باشگاه سنچوری تهران', city:'تهران', rating:4.8, tables:13, open:true, price:'۱۸۰,۰۰۰', id:'1' },
  { name:'باشگاه المپیک مشهد',  city:'مشهد',  rating:4.6, tables:11, open:true, price:'۱۵۰,۰۰۰', id:'2' },
  { name:'باشگاه شاهین شیراز',  city:'شیراز', rating:4.9, tables:9,  open:true, price:'۲۰۰,۰۰۰', id:'4' },
];

const FEATURES = [
  { icon:'🎱', label:'رزرو میز',      desc:'تقویم جلالی، پرداخت آنلاین',     href:'/clubs',    color:'#16a34a' },
  { icon:'🏆', label:'مسابقات',       desc:'لیگ‌ها، تورنومنت‌های فدراسیون',  href:'/events',   color:'#f59e0b' },
  { icon:'⭐', label:'مربیان',        desc:'گواهی رسمی، جلسات خصوصی',        href:'/coaches',  color:'#a78bfa' },
  { icon:'📊', label:'رنکینگ ملی',   desc:'جدول زنده، تاریخچه کامل',        href:'/rankings', color:'#0891b2' },
  { icon:'🛒', label:'فروشگاه',       desc:'PREDATOR · ARAMITH · RILEY',      href:'/shop',     color:'#ef4444' },
  { icon:'🔧', label:'خدمات فنی',    desc:'نصب، کلاث‌کشی، تعمیر',          href:'/services', color:'#059669' },
  { icon:'📰', label:'اخبار',         desc:'جدیدترین رویدادهای صنعت',       href:'/news',     color:'#0d9488' },
  { icon:'🏛️', label:'نمایشگاه‌ها',  desc:'اکسپو، همایش، کارگاه',          href:'/expo',     color:'#7c3aed' },
];

export default function HomePage() {
  const [scrollY,  setScrollY]  = useState(0);
  const [liveIdx,  setLiveIdx]  = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const fn = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', fn, { passive:true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setLiveIdx(i => (i + 1) % LIVE_MATCHES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:none;} }
        @keyframes fadeIn   { from{opacity:0;}to{opacity:1;} }
        @keyframes liveDot  { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.5;transform:scale(0.75);} }
        @keyframes tickerSlide { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;} }
        @keyframes shimmer  { from{background-position:-200% center;}to{background-position:200% center;} }
        @keyframes floatUp  { 0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(0.95);}to{opacity:1;transform:none;} }

        .p-btn-primary {
          display:inline-flex; align-items:center; gap:9px;
          padding:14px 28px; border-radius:14px; border:none;
          background:linear-gradient(160deg,#22c55e 0%,#16a34a 100%);
          color:#fff; font-size:15px; font-weight:800;
          font-family:inherit; cursor:pointer; text-decoration:none;
          box-shadow:0 4px 20px rgba(22,163,74,0.35),0 1px 0 rgba(255,255,255,0.18) inset;
          transition:all 0.25s cubic-bezier(0.4,0,0.2,1);
          letter-spacing:-0.01em;
        }
        .p-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(22,163,74,0.45),0 1px 0 rgba(255,255,255,0.22) inset; }
        .p-btn-primary:active { transform:scale(0.97); }

        .p-btn-outline {
          display:inline-flex; align-items:center; gap:8px;
          padding:13px 24px; border-radius:14px;
          border:1.5px solid rgba(255,255,255,0.22);
          color:rgba(255,255,255,0.85); font-size:14px; font-weight:600;
          font-family:inherit; cursor:pointer; text-decoration:none;
          background:rgba(255,255,255,0.06);
          transition:all 0.25s cubic-bezier(0.4,0,0.2,1);
          letter-spacing:-0.005em;
          backdrop-filter:blur(12px);
        }
        .p-btn-outline:hover { background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.38); color:#fff; transform:translateY(-1px); }

        .club-card {
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.10);
          border-radius:18px;
          padding:20px;
          cursor:pointer;
          transition:all 0.30s cubic-bezier(0.4,0,0.2,1);
          text-decoration:none;
          display:block;
        }
        .club-card:hover {
          background:rgba(255,255,255,0.10);
          border-color:rgba(22,163,74,0.35);
          transform:translateY(-3px);
          box-shadow:0 12px 36px rgba(0,0,0,0.25);
        }

        .feat-item {
          display:flex; flex-direction:column; align-items:flex-start;
          padding:24px; border-radius:20px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          text-decoration:none;
          transition:all 0.28s cubic-bezier(0.4,0,0.2,1);
          cursor:pointer;
        }
        .feat-item:hover {
          background:rgba(255,255,255,0.08);
          border-color:rgba(255,255,255,0.16);
          transform:translateY(-4px);
          box-shadow:0 16px 40px rgba(0,0,0,0.20);
        }

        .stat-pill {
          display:flex; flex-direction:column; align-items:center;
          padding:20px 16px;
          border-left:1px solid rgba(255,255,255,0.06);
          flex:1;
        }
        .stat-pill:first-child { border-left:none; }

        .live-score-card {
          background:rgba(255,255,255,0.055);
          border:1px solid rgba(255,255,255,0.10);
          border-radius:16px;
          overflow:hidden;
          transition:all 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .live-score-card:hover {
          background:rgba(255,255,255,0.08);
          border-color:rgba(220,38,38,0.30);
          transform:translateY(-2px);
        }

        @media(max-width:900px) {
          .hero-grid { grid-template-columns:1fr !important; }
          .feat-grid { grid-template-columns:repeat(2,1fr) !important; }
          .clubs-grid { grid-template-columns:1fr !important; }
          .stats-bar { flex-wrap:wrap; }
          .stat-pill { min-width:50%; border-left:none !important; border-top:1px solid rgba(255,255,255,0.06); }
          .stat-pill:nth-child(odd) { border-left:none !important; }
          .stat-pill:nth-child(even) { border-left:1px solid rgba(255,255,255,0.06) !important; }
        }
        @media(max-width:560px) {
          .feat-grid { grid-template-columns:repeat(2,1fr) !important; }
          .live-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <section style={{
        position:'relative', minHeight:'100vh',
        display:'flex', flexDirection:'column', justifyContent:'flex-end',
        overflow:'hidden', background:'#06100a',
      }}>
        {/* BG image */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'url(/images/billiadr-club-1.jpg)',
          backgroundSize:'cover', backgroundPosition:'center 30%',
          filter:'brightness(0.28) saturate(0.60)',
          transform:`translateY(${scrollY * 0.18}px)`,
          willChange:'transform',
        }}/>

        {/* Multi-layer gradient overlay */}
        <div style={{
          position:'absolute', inset:0,
          background:`
            linear-gradient(to bottom,
              rgba(6,16,10,0.75) 0%,
              rgba(6,16,10,0.10) 25%,
              rgba(6,16,10,0.05) 50%,
              rgba(6,16,10,0.80) 75%,
              rgba(6,16,10,0.98) 100%),
            linear-gradient(to left,
              rgba(6,16,10,0.50) 0%,
              transparent 55%)
          `,
        }}/>

        {/* Green atmospheric glow */}
        <div style={{
          position:'absolute', bottom:'-10%', left:'-5%',
          width:'60vw', height:'60vw', maxWidth:'700px',
          borderRadius:'50%',
          background:'radial-gradient(ellipse, rgba(22,163,74,0.10) 0%, transparent 65%)',
          filter:'blur(60px)', pointerEvents:'none',
        }}/>
        <div style={{
          position:'absolute', top:'-5%', right:'10%',
          width:'40vw', height:'40vw', maxWidth:'480px',
          borderRadius:'50%',
          background:'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 65%)',
          filter:'blur(50px)', pointerEvents:'none',
        }}/>

        {/* Content */}
        <div style={{
          position:'relative', zIndex:10,
          maxWidth:'1280px', margin:'0 auto', width:'100%',
          padding:'0 clamp(20px,4vw,52px) clamp(60px,8vh,100px)',
        }}>

          {/* Live ticker */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'10px',
            background:'rgba(220,38,38,0.12)',
            border:'1px solid rgba(220,38,38,0.22)',
            borderRadius:'99px', padding:'7px 16px',
            marginBottom:'28px',
            animation:'fadeIn 0.8s ease both',
          }}>
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#dc2626', display:'inline-block', animation:'liveDot 1.6s ease-in-out infinite', boxShadow:'0 0 8px rgba(220,38,38,0.60)' }}/>
            <span style={{ fontSize:'11px', fontWeight:700, color:'#fca5a5', letterSpacing:'0.12em' }}>LIVE</span>
            <span style={{ width:'1px', height:'12px', background:'rgba(255,255,255,0.15)', display:'inline-block' }}/>
            <span key={liveIdx} style={{ fontSize:'12px', color:'rgba(255,255,255,0.70)', fontWeight:500, animation:'tickerSlide 0.4s ease both' }}>
              {LIVE_MATCHES[liveIdx]!.p1.split(' ').pop()} {toFa(LIVE_MATCHES[liveIdx]!.s1)}:{toFa(LIVE_MATCHES[liveIdx]!.s2)} {LIVE_MATCHES[liveIdx]!.p2.split(' ').pop()} — {LIVE_MATCHES[liveIdx]!.event}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize:'clamp(40px,7vw,84px)',
            fontWeight:900, color:'#fff',
            letterSpacing:'-0.045em', lineHeight:0.96,
            marginBottom:'22px',
            animation:'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s both',
          }}>
            پلتفرم<br/>
            <span style={{
              background:'linear-gradient(135deg,#4ade80 0%,#22c55e 40%,#16a34a 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            }}>تخصصی بیلیارد</span><br/>
            ایران
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize:'clamp(15px,2vw,19px)',
            color:'rgba(255,255,255,0.52)',
            lineHeight:1.70, marginBottom:'36px',
            maxWidth:'520px',
            animation:'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.18s both',
          }}>
            رزرو میز، مسابقات رسمی، مربیان حرفه‌ای، و فروشگاه تجهیزات —
            همه در یک اکوسیستم جامع.
          </p>

          {/* CTAs */}
          <div style={{
            display:'flex', gap:'12px', flexWrap:'wrap',
            marginBottom:'52px',
            animation:'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.26s both',
          }}>
            <Link href="/clubs" className="p-btn-primary">
              رزرو میز آنلاین <ArrowLeft size={16}/>
            </Link>
            <Link href="/register" className="p-btn-outline">
              ثبت‌نام رایگان
            </Link>
            <Link href="/live" className="p-btn-outline">
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#dc2626', display:'inline-block', animation:'liveDot 1.6s infinite', boxShadow:'0 0 6px rgba(220,38,38,0.70)' }}/>
              نتایج زنده
            </Link>
          </div>

          {/* Stats bar */}
          <div className="stats-bar" style={{
            display:'flex',
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:'20px',
            overflow:'hidden',
            maxWidth:'680px',
            animation:'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.34s both',
          }}>
            {[
              { v:'۱,۲۰۰+', l:'بازیکن فعال',  c:'#4ade80' },
              { v:'۸۵+',    l:'باشگاه',        c:'#38bdf8' },
              { v:'۴۸',     l:'تورنومنت',      c:'#c084fc' },
              { v:'۹۲٪',   l:'رضایت کاربران', c:'#fbbf24' },
            ].map((s, i) => (
              <div key={i} className="stat-pill">
                <div style={{ fontSize:'clamp(20px,2.5vw,26px)', fontWeight:900, color:s.c, letterSpacing:'-0.03em', lineHeight:1, marginBottom:'5px' }}>{s.v}</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.38)', fontWeight:500, whiteSpace:'nowrap' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position:'absolute', bottom:'28px', left:'50%', transform:'translateX(-50%)',
          zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', gap:'8px',
          opacity:Math.max(0, 1-scrollY/100), transition:'opacity 0.3s',
          pointerEvents:'none',
        }}>
          <div style={{ width:'1px', height:'40px', background:'linear-gradient(to bottom,rgba(255,255,255,0.40),transparent)', animation:'floatUp 2s ease-in-out infinite' }}/>
        </div>
      </section>

      {/* ══════════════════════════════════
          LIVE MATCHES
      ══════════════════════════════════ */}
      <section style={{
        background:'#06100a',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding:'clamp(48px,6vw,72px) clamp(20px,4vw,52px)',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(220,38,38,0.30),transparent)' }}/>

        <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'28px', flexWrap:'wrap', gap:'12px' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#dc2626', display:'inline-block', animation:'liveDot 1.6s infinite', boxShadow:'0 0 8px rgba(220,38,38,0.60)' }}/>
                <span style={{ fontSize:'10px', fontWeight:700, color:'#f87171', letterSpacing:'0.18em' }}>LIVE NOW</span>
              </div>
              <h2 style={{ fontSize:'clamp(22px,3.5vw,32px)', fontWeight:900, color:'#f0fdf4', letterSpacing:'-0.03em', margin:0 }}>
                مسابقات در حال برگزاری
              </h2>
            </div>
            <Link href="/live" style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.50)', textDecoration:'none', padding:'8px 16px', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'10px', transition:'all 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='#fff';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.22)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.50)';(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.10)';}}>
              همه مسابقات <ChevronRight size={14}/>
            </Link>
          </div>

          {/* Match cards */}
          <div className="live-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }}>
            {LIVE_MATCHES.map((m, i) => (
              <Link key={i} href="/live" style={{ textDecoration:'none' }}>
                <div className="live-score-card" style={{ animation:`fadeUp 0.6s ease ${i*0.08}s both` }}>
                  {/* Red top bar */}
                  <div style={{ height:'2px', background:'linear-gradient(90deg,transparent,#dc2626,transparent)', boxShadow:'0 0 10px rgba(220,38,38,0.50)' }}/>

                  <div style={{ padding:'18px 20px' }}>
                    {/* Meta */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#dc2626', display:'inline-block', animation:'liveDot 1.6s infinite' }}/>
                        <span style={{ fontSize:'10px', color:'rgba(240,253,244,0.45)', fontWeight:600 }}>{m.round}</span>
                      </div>
                      <span style={{ fontSize:'10px', color:'rgba(240,253,244,0.35)' }}>{m.event}</span>
                    </div>

                    {/* Players + Score */}
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      {/* P1 */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'14px', fontWeight:800, color:'rgba(240,253,244,0.90)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.p1.split(' ').pop()}</div>
                        <div style={{ fontSize:'10px', color:'rgba(240,253,244,0.35)', marginTop:'2px' }}>رنک #{toFa(m.p1r)}</div>
                      </div>

                      {/* Score */}
                      <div style={{
                        display:'flex', alignItems:'center', gap:'6px',
                        padding:'8px 14px',
                        background:'rgba(255,255,255,0.06)',
                        border:'1px solid rgba(255,255,255,0.10)',
                        borderRadius:'12px', flexShrink:0,
                      }}>
                        <span style={{ fontSize:'22px', fontWeight:900, color: m.s1>m.s2?'#4ade80':'rgba(240,253,244,0.60)', letterSpacing:'-0.03em', lineHeight:1 }}>{toFa(m.s1)}</span>
                        <span style={{ fontSize:'12px', color:'rgba(240,253,244,0.20)', fontWeight:700 }}>:</span>
                        <span style={{ fontSize:'22px', fontWeight:900, color: m.s2>m.s1?'#4ade80':'rgba(240,253,244,0.60)', letterSpacing:'-0.03em', lineHeight:1 }}>{toFa(m.s2)}</span>
                      </div>

                      {/* P2 */}
                      <div style={{ flex:1, minWidth:0, textAlign:'right' }}>
                        <div style={{ fontSize:'14px', fontWeight:800, color:'rgba(240,253,244,0.90)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.p2.split(' ').pop()}</div>
                        <div style={{ fontSize:'10px', color:'rgba(240,253,244,0.35)', marginTop:'2px' }}>رنک #{toFa(m.p2r)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FEATURES GRID
      ══════════════════════════════════ */}
      <section style={{
        background:'#07120b',
        padding:'clamp(64px,8vw,96px) clamp(20px,4vw,52px)',
      }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom:'40px', animation:'fadeUp 0.6s ease both' }}>
            <div style={{ fontSize:'10px', fontWeight:700, color:'rgba(74,222,128,0.65)', letterSpacing:'0.22em', marginBottom:'12px' }}>ECOSYSTEM</div>
            <h2 style={{ fontSize:'clamp(26px,4vw,42px)', fontWeight:900, color:'#f0fdf4', letterSpacing:'-0.035em', margin:0 }}>
              همه چیز در یک پلتفرم
            </h2>
          </div>

          {/* Grid */}
          <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
            {FEATURES.map((f, i) => (
              <Link key={i} href={f.href} className="feat-item" style={{ animation:`fadeUp 0.5s ease ${0.06*i}s both` }}>
                <div style={{
                  width:'48px', height:'48px', borderRadius:'14px',
                  background:`${f.color}14`,
                  border:`1px solid ${f.color}25`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'22px', marginBottom:'14px', flexShrink:0,
                }}>{f.icon}</div>
                <div style={{ fontSize:'15px', fontWeight:800, color:'rgba(240,253,244,0.90)', marginBottom:'6px', letterSpacing:'-0.015em' }}>{f.label}</div>
                <div style={{ fontSize:'12px', color:'rgba(240,253,244,0.38)', lineHeight:1.6 }}>{f.desc}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'14px', fontSize:'12px', fontWeight:700, color:f.color }}>
                  بیشتر <ArrowLeft size={12}/>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CLUBS DISCOVERY
      ══════════════════════════════════ */}
      <section style={{
        background:'#06100a',
        borderTop:'1px solid rgba(255,255,255,0.05)',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        padding:'clamp(64px,8vw,96px) clamp(20px,4vw,52px)',
      }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto' }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'36px', flexWrap:'wrap', gap:'14px' }}>
            <div style={{ animation:'fadeUp 0.6s ease both' }}>
              <div style={{ fontSize:'10px', fontWeight:700, color:'rgba(74,222,128,0.65)', letterSpacing:'0.22em', marginBottom:'12px' }}>DISCOVER</div>
              <h2 style={{ fontSize:'clamp(26px,4vw,42px)', fontWeight:900, color:'#f0fdf4', letterSpacing:'-0.035em', margin:0 }}>
                باشگاه‌های برتر ایران
              </h2>
            </div>
            <Link href="/clubs" style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:700, color:'#4ade80', textDecoration:'none', padding:'10px 20px', border:'1px solid rgba(74,222,128,0.22)', borderRadius:'12px', background:'rgba(22,163,74,0.08)', transition:'all 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(22,163,74,0.14)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(22,163,74,0.08)';}}>
              همه باشگاه‌ها <ChevronRight size={14}/>
            </Link>
          </div>

          <div className="clubs-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }}>
            {CLUBS.map((c, i) => (
              <Link key={i} href={`/clubs/${c.id}`} className="club-card" style={{ animation:`fadeUp 0.5s ease ${0.08*i}s both` }}>
                {/* Image */}
                <div style={{
                  height:'140px', borderRadius:'12px', overflow:'hidden',
                  marginBottom:'16px', position:'relative',
                  background:'rgba(255,255,255,0.04)',
                }}>
                  <img src="/images/billiadr-club-1.jpg" alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.40) saturate(0.60)', transition:'transform 0.5s ease' }}
                    onMouseOver={e=>{(e.target as HTMLImageElement).style.transform='scale(1.04)';}}
                    onMouseOut={e=>{(e.target as HTMLImageElement).style.transform='none';}}
                    onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 40%,rgba(6,16,10,0.85) 100%)' }}/>
                  {/* Open badge */}
                  <div style={{ position:'absolute', top:'10px', right:'10px', display:'flex', alignItems:'center', gap:'5px', background:'rgba(22,163,74,0.15)', border:'1px solid rgba(22,163,74,0.28)', borderRadius:'99px', padding:'3px 10px' }}>
                    <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#22c55e', display:'inline-block' }}/>
                    <span style={{ fontSize:'10px', color:'#4ade80', fontWeight:700 }}>باز</span>
                  </div>
                  {/* City */}
                  <div style={{ position:'absolute', bottom:'10px', right:'10px', display:'flex', alignItems:'center', gap:'4px', background:'rgba(0,0,0,0.50)', borderRadius:'99px', padding:'3px 10px' }}>
                    <MapPin size={9} style={{ color:'#4ade80' }}/>
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.80)' }}>{c.city}</span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                  <div style={{ minWidth:0, flex:1, paddingLeft:'8px' }}>
                    <div style={{ fontSize:'15px', fontWeight:800, color:'rgba(240,253,244,0.92)', marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>{c.name}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'rgba(240,253,244,0.45)' }}>
                      <Clock size={10}/>
                      <span>{c.tables} میز فعال</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'4px', background:'rgba(251,191,36,0.10)', border:'1px solid rgba(251,191,36,0.20)', borderRadius:'99px', padding:'4px 10px', flexShrink:0 }}>
                    <Star size={11} style={{ color:'#fbbf24', fill:'#fbbf24' }}/>
                    <span style={{ fontSize:'12px', fontWeight:800, color:'#fbbf24' }}>{c.rating}</span>
                  </div>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <span style={{ fontSize:'14px', fontWeight:800, color:'#4ade80' }}>{c.price}</span>
                    <span style={{ fontSize:'11px', color:'rgba(240,253,244,0.35)', marginRight:'4px' }}> تومان/ساعت</span>
                  </div>
                  <div style={{ fontSize:'12px', fontWeight:700, color:'rgba(240,253,244,0.50)', display:'flex', alignItems:'center', gap:'4px' }}>
                    رزرو <ArrowLeft size={11}/>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          PLATFORM TRUST BAR
      ══════════════════════════════════ */}
      <section style={{
        background:'#07120b',
        padding:'clamp(40px,5vw,60px) clamp(20px,4vw,52px)',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto', display:'flex', gap:'24px', flexWrap:'wrap', justifyContent:'center', alignItems:'center' }}>
          {[
            { icon:<Shield size={18}/>,      text:'تأیید فدراسیون بیلیارد',     c:'#4ade80' },
            { icon:<TrendingUp size={18}/>,   text:'رنکینگ رسمی ملی',           c:'#38bdf8' },
            { icon:<Users size={18}/>,        text:'+۱,۲۰۰ بازیکن حرفه‌ای',   c:'#c084fc' },
            { icon:<Calendar size={18}/>,     text:'مسابقات رسمی هفتگی',       c:'#fbbf24' },
            { icon:<Activity size={18}/>,     text:'نتایج لحظه‌ای زنده',       c:'#f87171' },
          ].map((t, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'9px', padding:'10px 18px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'99px', animation:`fadeUp 0.5s ease ${i*0.07}s both` }}>
              <span style={{ color:t.c, display:'flex' }}>{t.icon}</span>
              <span style={{ fontSize:'12px', fontWeight:600, color:'rgba(240,253,244,0.65)', whiteSpace:'nowrap' }}>{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA
      ══════════════════════════════════ */}
      <section style={{
        background:'#06100a',
        padding:'clamp(80px,10vw,120px) clamp(20px,4vw,52px)',
        position:'relative', overflow:'hidden',
      }}>
        {/* BG glow */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(22,163,74,0.08) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(22,163,74,0.25),transparent)' }}/>

        <div style={{ maxWidth:'680px', margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            background:'rgba(22,163,74,0.10)', border:'1px solid rgba(22,163,74,0.22)',
            borderRadius:'99px', padding:'6px 16px', marginBottom:'24px',
          }}>
            <span style={{ fontSize:'10px', fontWeight:700, color:'#4ade80', letterSpacing:'0.18em' }}>شروع رایگان</span>
          </div>

          <h2 style={{
            fontSize:'clamp(30px,5vw,56px)', fontWeight:900, color:'#f0fdf4',
            letterSpacing:'-0.04em', lineHeight:1.05, marginBottom:'16px',
          }}>
            به بهترین پلتفرم<br/>
            <span style={{ background:'linear-gradient(135deg,#4ade80,#22c55e)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>بیلیارد ایران</span>{' '}بپیوندید
          </h2>

          <p style={{ fontSize:'16px', color:'rgba(240,253,244,0.48)', lineHeight:1.75, marginBottom:'36px' }}>
            ثبت‌نام رایگان. رزرو میز، پیگیری مسابقات، و ارتباط با مربیان در کمتر از یک دقیقه.
          </p>

          <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/register" className="p-btn-primary" style={{ fontSize:'15px', padding:'15px 34px' }}>
              ثبت‌نام رایگان <ArrowLeft size={16}/>
            </Link>
            <Link href="/clubs" className="p-btn-outline" style={{ fontSize:'14px', padding:'14px 26px' }}>
              مشاهده باشگاه‌ها
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}