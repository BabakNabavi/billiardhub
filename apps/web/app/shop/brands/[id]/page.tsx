'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star, Check, Globe, MapPin, Calendar, Trophy,
  ChevronRight, Package, Users, Award, Shield,
  Share2, Heart, TrendingUp, Play, ChevronLeft,
  Target, Zap, ExternalLink,
} from 'lucide-react';

/* ══ data ══ */
const BRANDS: Record<string, any> = {
  predator: {
    id:'predator', name:'پردیتور', nameEn:'PREDATOR',
    country:'ایالات متحده', flag:'🇺🇸', founded:1994,
    website:'www.predatorcues.com', city:'نیواورلئان',
    logo:'P', accentColor:'#C7A66A',
    coverImg:'/images/billiadr-club-1.jpg',
    tier:'platinum', isVerified:true, isOfficial:true,
    tagline:'از مرز ممکن فراتر برو',
    taglineEn:'Beyond The Limits',
    description:'پردیتور در سال ۱۹۹۴ با هدف انقلاب در فناوری چوب بیلیارد تأسیس شد. اولین محصول آن‌ها — شفت ۳۱۴ — با معرفی تکنولوژی Low Deflection، صنعت را متحول کرد. امروز پردیتور معتبرترین برند چوب بیلیارد حرفه‌ای در جهان است و شاهد کاپیون‌های جهانی در سراسر دنیا هستیم که با این برند بازی می‌کنند.',
    stats:{ products:47, dealers:180, tournaments:38, players:1200, countries:45, yearsActive:31 },
    certifications:['WPBSA Official Supplier','BCA Certified','WPA Tour Partner','EPA Approved'],
    collections:[
      { name:'314 Series',      desc:'تکنولوژی Low Deflection نسل جدید',  color:'#C7A66A', items:8  },
      { name:'Revo Carbon',     desc:'شفت کربنی انقلابی',               color:'#06b6d4', items:5  },
      { name:'Z-3 Series',      desc:'مقرون‌به‌صرفه با کیفیت حرفه‌ای',   color:'#a78bfa', items:6  },
      { name:'SP Series',       desc:'چوب‌های سری ویژه بازیکنان',        color:'#f59e0b', items:12 },
    ],
    products:[
      { id:'1', name:'314-3 Shaft',      price:9600000,  img:'/images/billiadr-club-1.jpg', rating:4.9, tag:'پرفروش' },
      { id:'2', name:'Revo 12.4 Carbon', price:14500000, img:'/images/billiadr-club-3.jpg', rating:4.8, tag:'جدید'   },
      { id:'3', name:'Z-3 Complete Cue', price:8200000,  img:'/images/billiadr-club-1.jpg', rating:4.7, tag:''       },
      { id:'4', name:'SP Natural',       price:7600000,  img:'/images/billiadr-club-3.jpg', rating:4.8, tag:'ویژه'   },
    ],
    ambassadors:[
      { name:'Shane Van Boening',  title:'قهرمان جهان پاکت',  country:'🇺🇸' },
      { name:'Shaun Murphy',       title:'قهرمان جهان اسنوکر', country:'🇬🇧' },
      { name:'امیرحسین رضایی',    title:'قهرمان ملی ایران',   country:'🇮🇷' },
    ],
    dealers:[
      { name:'بیلیارد پلاس تهران',   city:'تهران',   type:'نماینده رسمی',  verified:true  },
      { name:'سنچوری استور',         city:'تهران',   type:'خرده‌فروش',      verified:true  },
      { name:'بیلیارد شاپ مشهد',     city:'مشهد',    type:'نماینده رسمی',  verified:true  },
      { name:'تجهیزات بیلیارد اصفهان',city:'اصفهان', type:'خرده‌فروش',     verified:false },
    ],
    milestones:[
      { year:'۱۹۹۴', title:'تأسیس پردیتور',         desc:'انقلاب در Low Deflection' },
      { year:'۲۰۰۲', title:'شفت ۳۱۴',              desc:'پرفروش‌ترین شفت تاریخ' },
      { year:'۲۰۱۰', title:'تکنولوژی Revo',         desc:'معرفی شفت کربنی' },
      { year:'۲۰۲۰', title:'۱۰۰۰+ قهرمان جهانی',  desc:'کاربران تیتل‌گیر' },
    ],
    gallery:['/images/billiadr-club-1.jpg','/images/billiadr-club-3.jpg','/images/billiadr-club-1.jpg','/images/billiadr-club-3.jpg'],
  },
};

const FALLBACK = BRANDS['predator'];

function toFa(v: string|number){ return String(v).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d))); }

export default function BrandProfilePage() {
  const params = useParams();
  const id     = String(params.id ?? 'predator');
  const brand  = BRANDS[id] ?? FALLBACK;

  const [tab,      setTab]      = useState<'overview'|'products'|'dealers'|'story'>('overview');
  const [followed, setFollowed] = useState(false);
  const [scrollY,  setScrollY]  = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const fn = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(()=>setScrollY(window.scrollY)); };
    window.addEventListener('scroll', fn, { passive:true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  const heroOp = Math.max(0, 1 - scrollY/600);

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;} }
        @keyframes ambient { 0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-14px);} }
        @keyframes pulse   { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes shimmer { 0%{background-position:-200% center;}100%{background-position:200% center;} }

        .tab-b { padding:10px 20px; border-radius:10px; font-size:13px; font-weight:600; border:1px solid transparent; cursor:pointer; font-family:inherit; transition:all 0.3s; white-space:nowrap; }
        .tab-b.active { background:rgba(199,166,106,0.1); border-color:rgba(199,166,106,0.3); color:#C7A66A; }
        .tab-b:not(.active) { background:rgba(0,0,0,0.03); color:rgba(0,0,0,0.42); }
        .tab-b:not(.active):hover { background:rgba(0,0,0,0.05); color:rgba(0,0,0,0.48); }

        .prod-card { background:rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.07); border-radius:16px; overflow:hidden; transition:all 0.35s; cursor:pointer; }
        .prod-card:hover { background:rgba(255,255,255,0.055); border-color:rgba(199,166,106,0.25); transform:translateY(-5px); box-shadow:0 16px 40px rgba(0,0,0,0.4); }

        .dealer-row { display:flex; align-items:center; gap:14px; padding:14px 18px; background:#FFFFFF; border:1px solid rgba(0,0,0,0.05); border-radius:14px; transition:all 0.25s; }
        .dealer-row:hover { background:rgba(0,0,0,0.04); border-color:rgba(199,166,106,0.2); }

        .milestone-dot::before { content:''; position:absolute; top:'50%'; right:'-25px'; transform:'translateY(-50%)'; width:'10px'; height:'10px'; borderRadius:'50%'; }

        @media(max-width:900px) { .brand-g{grid-template-columns:1fr!important;} }
        @media(max-width:640px) { .coll-g{grid-template-columns:repeat(2,1fr)!important;} .prod-g{grid-template-columns:repeat(2,1fr)!important;} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#F7F7F5', paddingBottom:'80px' }}>

        {/* ══ HERO ══ */}
        <div style={{ position:'relative', height:'clamp(440px,58vh,620px)', overflow:'hidden' }}>
          <img src={brand.coverImg} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.14) saturate(0.4) contrast(1.2)' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 60% 60% at 20% 70%,${brand.accentColor}12,transparent 100%)` }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(2,8,6,0.5) 0%,transparent 30%,rgba(2,8,6,0.97) 100%)' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to left,rgba(2,8,6,0.6) 0%,transparent 55%)' }}/>
          <div style={{ position:'absolute', top:'-15%', left:'-5%', width:'55vw', height:'55vw', maxWidth:'600px', borderRadius:'50%', background:`radial-gradient(${brand.accentColor}06,transparent 65%)`, filter:'blur(40px)', animation:'ambient 16s ease-in-out infinite', pointerEvents:'none' }}/>

          {/* Nav */}
          <div style={{ position:'absolute', top:'24px', left:0, right:0, padding:'0 clamp(16px,4vw,48px)', display:'flex', justifyContent:'space-between', zIndex:10 }}>
            <Link href="/brands" style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration:'none', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(16px)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:'10px', padding:'7px 14px' }}>
              <ChevronRight size={13}/> برندها
            </Link>
            <button style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.5)', fontSize: '13px', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(16px)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:'10px', padding:'7px 14px', cursor:'pointer', fontFamily:'inherit' }}>
              <Share2 size={12}/> اشتراک
            </button>
          </div>

          {/* Content */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'clamp(24px,4vw,52px)', zIndex:10, opacity:heroOp }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:'28px', flexWrap:'wrap' }}>

              {/* Logo */}
              <div style={{ width:'clamp(72px,12vw,110px)', height:'clamp(72px,12vw,110px)', borderRadius:'24px', background:`linear-gradient(135deg,${brand.accentColor},${brand.accentColor}80)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 'clamp(31px, 6.6vw, 48px)', fontWeight:900, color:'#fff', border:'3px solid rgba(199,166,106,0.4)', boxShadow:`0 0 40px ${brand.accentColor}30,0 20px 60px rgba(0,0,0,0.5)`, flexShrink:0 }}>
                {brand.logo}
              </div>

              <div style={{ flex:1, minWidth:'200px' }}>
                {/* Tags */}
                <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(226,232,240,0.1)', border:'1px solid rgba(226,232,240,0.2)', borderRadius:'20px', padding:'4px 13px', backdropFilter:'blur(16px)' }}>
                    <Award size={10} style={{ color: '#111111' }}/><span style={{ fontSize: '10px', color: '#111111', fontWeight:700, letterSpacing:'0.12em' }}>PLATINUM BRAND</span>
                  </div>
                  {brand.isVerified && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:`${brand.accentColor}12`, border:`1px solid ${brand.accentColor}28`, borderRadius:'20px', padding:'4px 13px', backdropFilter:'blur(16px)' }}>
                      <Check size={10} style={{ color:brand.accentColor }}/><span style={{ fontSize: '10px', color:brand.accentColor, fontWeight:700 }}>تأیید شده</span>
                    </div>
                  )}
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'rgba(0,0,0,0.05)', borderRadius:'20px', padding:'4px 12px' }}>
                    <span style={{ fontSize: '15px' }}>{brand.flag}</span><span style={{ fontSize: '10px', color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{brand.country}</span>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color:`${brand.accentColor}80`, letterSpacing:'0.2em', fontWeight:700, marginBottom:'6px' }}>{brand.taglineEn}</div>
                <h1 style={{ fontSize: 'clamp(31px, 6.6vw, 64px)', fontWeight:900, color:'#fff', margin:'0 0 6px', letterSpacing:'-0.04em', lineHeight:1.0, textShadow:`0 0 60px ${brand.accentColor}20` }}>
                  {brand.name} <span style={{ color:`${brand.accentColor}` }}>·</span> {brand.nameEn}
                </h1>
                <div style={{ fontSize: '15px', color:'rgba(255,255,255,0.45)' }}>{brand.tagline} · از {toFa(brand.founded)}</div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:'10px', flexShrink:0, flexWrap:'wrap' }}>
                <button onClick={()=>setFollowed(f=>!f)} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'11px 22px', borderRadius:'12px', border:'none', background: followed?'rgba(199,166,106,0.15)':'linear-gradient(135deg,#C7A66A,#A07840)', color: followed?'#C7A66A':'#fff', fontSize: '14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.3s', boxShadow: followed?'none':'0 8px 24px rgba(199,166,106,0.3)', ...(followed?{border:'1px solid rgba(199,166,106,0.3)'}:{}) }}>
                  {followed?<><Check size={14}/>دنبال می‌کنید</>:<><Heart size={14}/>دنبال کردن</>}
                </button>
                <a href={`https://${brand.website}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:'7px', padding:'11px 18px', borderRadius:'12px', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', color:'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight:600, textDecoration:'none', transition:'all 0.3s' }}>
                  <ExternalLink size={14}/>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ══ STATS BAR ══ */}
        <div style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(0,0,0,0.04)', padding:'0 clamp(16px,4vw,48px)' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(6,1fr)' }}>
            {[
              { v:toFa(brand.stats.products),   l:'محصول',          c:brand.accentColor },
              { v:toFa(brand.stats.dealers),    l:'نماینده جهانی',  c:'#a78bfa' },
              { v:toFa(brand.stats.tournaments),l:'مسابقه',         c:'#f59e0b' },
              { v:toFa(brand.stats.players),    l:'بازیکن حرفه‌ای', c:'#06b6d4' },
              { v:toFa(brand.stats.countries),  l:'کشور',           c:'#C7A66A' },
              { v:toFa(brand.stats.yearsActive),l:'سال فعالیت',     c:'#ef4444' },
            ].map((s,i) => (
              <div key={i} style={{ padding:'18px 10px', textAlign:'center', borderLeft: i>0?'1px solid rgba(0,0,0,0.04)':'none' }}>
                <div style={{ fontSize: 'clamp(18px, 2.8vw, 24px)', fontWeight:900, color: '#111111', letterSpacing:'-0.02em', textShadow:`0 0 14px ${s.c}25` }}>{s.v}</div>
                <div style={{ fontSize: '10px', color:'rgba(0,0,0,0.35)', marginTop:'3px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ MAIN ══ */}
        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'32px', overflowX:'auto', padding:'2px' }}>
            {[{k:'overview',l:'خلاصه'},{k:'products',l:`محصولات (${brand.stats.products})`},{k:'dealers',l:'نمایندگان'},{k:'story',l:'تاریخچه'}].map(t => (
              <button key={t.k} className={`tab-b ${tab===t.k?'active':''}`} onClick={()=>setTab(t.k as any)}>{t.l}</button>
            ))}
          </div>

          <div className="brand-g" style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'28px', alignItems:'start' }}>

            {/* ── LEFT ── */}
            <div>

              {/* ════ OVERVIEW ════ */}
              {tab==='overview' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:'20px' }}>

                  {/* About */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight:800, color: '#111111', margin:'0 0 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:`linear-gradient(180deg,${brand.accentColor},#06b6d4)`, borderRadius:'2px', display:'inline-block' }}/>
                      درباره {brand.name}
                    </h3>
                    <p style={{ fontSize: '15px', color:'rgba(0,0,0,0.50)', lineHeight:1.9, margin:0 }}>{brand.description}</p>
                  </div>

                  {/* Collections */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight:800, color: '#111111', margin:'0 0 20px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#a78bfa,#f59e0b)', borderRadius:'2px', display:'inline-block' }}/>
                      کلکسیون‌ها
                    </h3>
                    <div className="coll-g" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
                      {brand.collections.map((c: any, i: number) => (
                        <div key={i} style={{ padding:'16px 14px', background:`${c.color}07`, border:`1px solid ${c.color}18`, borderRadius:'16px', cursor:'pointer', transition:'all 0.3s' }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.background=`${c.color}12`;}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.background=`${c.color}07`;}}>
                          <div style={{ fontSize: '14px', fontWeight:800, color: '#111111', marginBottom:'6px', letterSpacing:'-0.01em', lineHeight:1.3 }}>{c.name}</div>
                          <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.42)', marginBottom:'10px', lineHeight:1.5 }}>{c.desc}</div>
                          <div style={{ fontSize: '11px', color:c.color, fontWeight:700 }}>{toFa(c.items)} محصول</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brand Ambassadors */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight:800, color: '#111111', margin:'0 0 18px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#f59e0b,#ef4444)', borderRadius:'2px', display:'inline-block' }}/>
                      سفرای برند
                    </h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                      {brand.ambassadors.map((a: any, i: number) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(0,0,0,0.04)', borderRadius:'14px', transition:'all 0.2s' }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.04)';}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.02)';}}>
                          <div style={{ width:'44px', height:'44px', borderRadius:'13px', background:`linear-gradient(135deg,${brand.accentColor},${brand.accentColor}80)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: '20px', fontWeight:900, color:'#fff', flexShrink:0 }}>
                            {a.name[0]}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize: '15px', fontWeight:700, color: '#111111', marginBottom:'3px' }}>{a.name}</div>
                            <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.42)' }}>{a.title}</div>
                          </div>
                          <div style={{ fontSize: '22px', flexShrink:0 }}>{a.country}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight:800, color: '#111111', margin:'0 0 18px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#C7A66A,#a78bfa)', borderRadius:'2px', display:'inline-block' }}/>
                      گواهینامه‌ها
                    </h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
                      {brand.certifications.map((cert: string, i: number) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', background:'rgba(199,166,106,0.04)', border:'1px solid rgba(199,166,106,0.12)', borderRadius:'13px' }}>
                          <Shield size={13} style={{ color:'#C7A66A', flexShrink:0 }}/>
                          <span style={{ fontSize: '13px', color:'rgba(0,0,0,0.48)', fontWeight:500 }}>{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gallery */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', overflow:'hidden' }}>
                    <div style={{ padding:'22px 24px 16px', fontSize: '17px', fontWeight:800, color: '#111111', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#06b6d4,#a78bfa)', borderRadius:'2px', display:'inline-block' }}/>
                      گالری
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'4px', padding:'0 4px 4px' }}>
                      {brand.gallery.map((img: string, i: number) => (
                        <div key={i} style={{ aspectRatio:'16/9', overflow:'hidden', borderRadius:'10px', position:'relative', cursor:'pointer' }}>
                          <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.4)', transition:'transform 0.4s ease, filter 0.4s' }}
                            onMouseEnter={e=>{(e.target as HTMLImageElement).style.filter='brightness(0.65)';(e.target as HTMLImageElement).style.transform='scale(1.07)';}}
                            onMouseLeave={e=>{(e.target as HTMLImageElement).style.filter='brightness(0.4)';(e.target as HTMLImageElement).style.transform='none';}}
                            onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
                          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                            <Play size={14} style={{ color:'rgba(255,255,255,0.4)' }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ════ PRODUCTS ════ */}
              {tab==='products' && (
                <div style={{ animation:'fadeUp 0.4s ease both' }}>
                  <div className="prod-g" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px' }}>
                    {brand.products.map((p: any) => (
                      <Link key={p.id} href={`/shop/${p.id}`} style={{ textDecoration:'none' }}>
                        <div className="prod-card">
                          <div style={{ height:'120px', position:'relative', overflow:'hidden' }}>
                            <img src={p.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.35)', transition:'transform 0.5s' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
                            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 30%,rgba(6,13,10,0.9) 100%)' }}/>
                            {p.tag && <div style={{ position:'absolute', top:'8px', right:'8px', background:`${brand.accentColor}85`, backdropFilter:'blur(6px)', color:'#fff', fontSize: '10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px' }}>{p.tag}</div>}
                          </div>
                          <div style={{ padding:'12px' }}>
                            <div style={{ fontSize: '13px', fontWeight:700, color: '#111111', marginBottom:'6px', lineHeight:1.4 }}>{p.name}</div>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <div style={{ fontSize: '15px', fontWeight:900, color:brand.accentColor }}>{toFa((p.price/1000000).toFixed(1))}م</div>
                              <div style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                                <Star size={10} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>
                                <span style={{ fontSize: '12px', fontWeight:700, color:'#f59e0b' }}>{p.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ════ DEALERS ════ */}
              {tab==='dealers' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:'10px' }}>
                  {brand.dealers.map((d: any, i: number) => (
                    <div key={i} className="dealer-row">
                      <div style={{ width:'44px', height:'44px', borderRadius:'13px', background:`${brand.accentColor}10`, border:`1px solid ${brand.accentColor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: '22px', flexShrink:0 }}>🏪</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                          <span style={{ fontSize: '15px', fontWeight:700, color: '#111111' }}>{d.name}</span>
                          {d.verified && <Check size={12} style={{ color:brand.accentColor }}/>}
                        </div>
                        <div style={{ display:'flex', gap:'10px', fontSize: '12px', color:'rgba(0,0,0,0.42)' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><MapPin size={9} style={{ color:brand.accentColor }}/>{d.city}</span>
                          <span>·</span>
                          <span>{d.type}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', padding:'4px 12px', borderRadius:'20px', background: d.verified?`${brand.accentColor}10`:'rgba(0,0,0,0.04)', color: d.verified?brand.accentColor:'rgba(0,0,0,0.35)', border:`1px solid ${d.verified?`${brand.accentColor}25`:'rgba(0,0,0,0.07)'}`, fontWeight:700, flexShrink:0 }}>
                        {d.verified?'تأیید شده':'ثبت‌نشده'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ════ STORY ════ */}
              {tab==='story' && (
                <div style={{ animation:'fadeUp 0.4s ease both' }}>
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'28px', position:'relative' }}>
                    <h3 style={{ fontSize: '17px', fontWeight:800, color: '#111111', margin:'0 0 28px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:`linear-gradient(180deg,${brand.accentColor},#a78bfa)`, borderRadius:'2px', display:'inline-block' }}/>
                      تاریخچه و میلستون‌ها
                    </h3>

                    {/* Timeline */}
                    <div style={{ position:'relative', paddingRight:'32px' }}>
                      {/* Line */}
                      <div style={{ position:'absolute', right:'6px', top:0, bottom:0, width:'2px', background:'linear-gradient(to bottom,rgba(0,0,0,0.06),transparent)' }}/>

                      {brand.milestones.map((m: any, i: number) => (
                        <div key={i} style={{ position:'relative', marginBottom: i<brand.milestones.length-1?'28px':'0' }}>
                          {/* Dot */}
                          <div style={{ position:'absolute', right:'-26px', top:'4px', width:'10px', height:'10px', borderRadius:'50%', background:brand.accentColor, boxShadow:`0 0 10px ${brand.accentColor}60`, border:'2px solid rgba(6,13,10,0.98)' }}/>

                          <div style={{ padding:'16px 18px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(0,0,0,0.04)', borderRadius:'14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
                              <span style={{ fontSize: '11px', color:brand.accentColor, background:`${brand.accentColor}12`, border:`1px solid ${brand.accentColor}22`, borderRadius:'20px', padding:'2px 10px', fontWeight:700 }}>{m.year}</span>
                              <span style={{ fontSize: '15px', fontWeight:800, color: '#111111', letterSpacing:'-0.01em' }}>{m.title}</span>
                            </div>
                            <p style={{ fontSize: '14px', color:'rgba(0,0,0,0.45)', margin:0, lineHeight:1.6 }}>{m.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <div style={{ position:'sticky', top:'80px', display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* Brand info card */}
              <div style={{ background:'#FFFFFF', border:`1px solid ${brand.accentColor}22`, borderRadius:'22px', padding:'22px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'120px', height:'1px', background:`linear-gradient(90deg,transparent,${brand.accentColor}55,transparent)`, boxShadow:`0 0 14px ${brand.accentColor}35` }}/>
                <div style={{ fontSize: '11px', color:`${brand.accentColor}70`, letterSpacing:'0.2em', fontWeight:700, marginBottom:'16px', textAlign:'center' }}>BRAND INFO</div>

                {[
                  { l:'کشور مبدأ', v:`${brand.flag} ${brand.country}`  },
                  { l:'سال تأسیس', v:toFa(brand.founded)               },
                  { l:'وب‌سایت',   v:brand.website                      },
                  { l:'شهر',       v:brand.city                         },
                ].map((r,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom: i<3?'1px solid rgba(0,0,0,0.04)':'none' }}>
                    <span style={{ fontSize: '13px', color:'rgba(0,0,0,0.42)' }}>{r.l}</span>
                    <span style={{ fontSize: '13px', fontWeight:600, color: '#111111' }}>{r.v}</span>
                  </div>
                ))}

                <Link href={`/shop?brand=${brand.nameEn}`} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'16px', padding:'12px', background:`linear-gradient(135deg,${brand.accentColor},${brand.accentColor}cc)`, borderRadius:'12px', color:'#fff', fontSize: '14px', fontWeight:700, textDecoration:'none', boxShadow:`0 6px 18px ${brand.accentColor}30` }}>
                  <Package size={14}/> مشاهده محصولات
                </Link>
              </div>

              {/* Quick stats */}
              <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'20px' }}>
                <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.35)', fontWeight:700, marginBottom:'14px' }}>آمار سریع</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {[
                    { l:'محصولات فعال',   v:toFa(brand.stats.products),   c:brand.accentColor },
                    { l:'نمایندگان',     v:toFa(brand.stats.dealers),     c:'#a78bfa'         },
                    { l:'مسابقات حامی',  v:toFa(brand.stats.tournaments), c:'#f59e0b'         },
                    { l:'بازیکن حرفه‌ای',v:toFa(brand.stats.players),    c:'#06b6d4'         },
                  ].map((s,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize: '13px', color:'rgba(0,0,0,0.42)' }}>{s.l}</span>
                      <span style={{ fontSize: '15px', fontWeight:800, color:s.c }}>{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related brands */}
              <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'20px' }}>
                <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.35)', fontWeight:700, marginBottom:'14px' }}>برندهای مشابه</div>
                {[{n:'RILEY',c:'#a78bfa',id:'riley'},{n:'MEZZ',c:'#ef4444',id:'mezz'}].map((b,i) => (
                  <Link key={i} href={`/brands/${b.id}`} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'10px', padding:'10px', borderRadius:'12px', transition:'background 0.2s', marginBottom: i<1?'6px':'0' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.04)';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';}}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${b.c}12`, border:`1px solid ${b.c}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: '15px', fontWeight:900, color:b.c, flexShrink:0 }}>{b.n[0]}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight:700, color: '#111111' }}>{b.n}</div>
                      <div style={{ fontSize: '11px', color:'rgba(0,0,0,0.40)' }}>مشاهده برند ←</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}