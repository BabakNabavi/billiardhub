'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/auth.store';
import {
  Star, Check, MapPin, Clock, Shield, Award, Wrench,
  ChevronRight, MessageCircle, Share2, UserPlus,
  Calendar, CheckCircle, AlertCircle, Camera,
  ChevronLeft, Play, Target, Zap, ThumbsUp,
} from 'lucide-react';

/* ══ data ══ */
const PROVIDERS: Record<string,any> = {
  s1: {
    id:'s1', name:'مهدی کرمی', title:'متخصص ارشد نصب و کلاث‌کشی',
    city:'تهران', address:'تهران، مناطق ۱ تا ۱۵',
    experience:14, rating:4.9, reviewCount:183, jobs:420,
    avatar:'م', avatarColor:'#C7A66A', coverImg:'/images/billiadr-club-1.jpg',
    isVerified:true, isCertified:true, isOnline:true,
    bio:'با ۱۴ سال تجربه در نصب و کلاث‌کشی میزهای اسنوکر و پاکت، من یکی از معتبرترین متخصصان این حوزه در تهران هستم. تخصص اصلی من کلاث Strachan و Hainsworth با ضمانت ۲ ساله کامل بر روی تمامی پروژه‌هاست. هر پروژه را با دقت اجرا می‌کنم تا میز شما به استانداردهای بین‌المللی برسد.',
    responseTime:'زیر ۲ ساعت', warranty:'۲۴ ماه',
    priceFrom:850000,
    certifications:['Riley Certified Installer','Strachan Approved Fitter','نصاب رسمی ویراکا','Hainsworth Partner'],
    serviceTypes:['install','cloth','maintenance'],
    brands:['Riley','Viraka','Aramith','Strachan','Hainsworth','BCE'],
    speciality:['کلاث‌کشی اسنوکر','نصب و تراز','لاستیک‌کشی','تعمیر سازه'],
    services:[
      { title:'کلاث‌کشی اسنوکر ۱۲ فوت',    duration:'۴-۶ ساعت', price:2800000, popular:true  },
      { title:'کلاث‌کشی پاکت ۷ فوت',        duration:'۳-۴ ساعت', price:1800000, popular:false },
      { title:'نصب کامل میز اسنوکر',        duration:'۶-۸ ساعت', price:4500000, popular:false },
      { title:'تراز لیزری + تنظیم',         duration:'۲-۳ ساعت', price:850000,  popular:false },
      { title:'تعویض لاستیک‌های کوشن',     duration:'۳-۵ ساعت', price:2200000, popular:false },
      { title:'بازسازی کامل میز',           duration:'۱-۲ روز',  price:8500000, popular:false },
    ],
    gallery:['/images/billiadr-club-1.jpg','/images/billiadr-club-3.jpg','/images/billiadr-club-1.jpg','/images/billiadr-club-3.jpg'],
    beforeAfter:[
      { before:'/images/billiadr-club-3.jpg', after:'/images/billiadr-club-1.jpg', title:'کلاث‌کشی اسنوکر VIP — باشگاه سنچوری' },
      { before:'/images/billiadr-club-1.jpg', after:'/images/billiadr-club-3.jpg', title:'نصب میز پاکت — باشگاه المپیک' },
    ],
  },
};

const REVIEWS = [
  { name:'مدیر باشگاه سنچوری', rating:5, text:'مهدی واقعاً حرفه‌ایه. کلاث‌کشی میز VIP ما رو در ۵ ساعت انجام داد و نتیجه فوق‌العاده‌ست.', date:'۱۴۰۴/۰۲/۱۵', project:'کلاث‌کشی اسنوکر', verified:true },
  { name:'محمد احمدی',         rating:5, text:'نصب میز جدید رو بهش سپردم. دقیق، سریع، و ضمانت کاملش خیالم رو راحت کرد.',              date:'۱۴۰۴/۰۱/۲۸', project:'نصب میز پاکت', verified:true },
  { name:'نیلوفر کریمی',       rating:5, text:'تراز لیزری خیلی دقیق. حالا بازی روی میزم کاملاً متفاوته.',                              date:'۱۴۰۴/۰۱/۱۰', project:'تراز لیزری',   verified:false},
];

function toFa(v: string|number){ return String(v).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d))); }

export default function ServiceProviderPage() {
  const params   = useParams();
  const id       = String(params.id ?? 's1');
  const provider = PROVIDERS[id] ?? PROVIDERS['s1'];
  const { user } = useAuthStore();

  const [tab,       setTab]      = useState<'overview'|'services'|'portfolio'|'reviews'>('overview');
  const [selSvc,    setSelSvc]   = useState<number|null>(null);
  const [followed,  setFollowed] = useState(false);
  const [baIdx,     setBaIdx]    = useState(0);
  const [requested, setReq]      = useState(false);
  const [scrollY,   setScrollY]  = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const fn = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(()=>setScrollY(window.scrollY)); };
    window.addEventListener('scroll', fn, { passive:true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  const heroOp = Math.max(0, 1-scrollY/600);
  const p = provider;

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;} }
        @keyframes pulse   { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes ambient { 0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-14px);} }
        .tab-b { padding:10px 20px; border-radius:10px; font-size:13px; font-weight:600; border:1px solid transparent; cursor:pointer; font-family:inherit; transition:all 0.3s; white-space:nowrap; }
        .tab-b.active { background:rgba(199,166,106,0.1); border-color:rgba(199,166,106,0.3); color:#C7A66A; }
        .tab-b:not(.active) { background:rgba(0,0,0,0.03); color:rgba(0,0,0,0.42); }
        .tab-b:not(.active):hover { background:rgba(0,0,0,0.05); color:rgba(0,0,0,0.48); }
        .svc-row { display:flex; align-items:center; gap:16px; padding:16px 18px; background:#FFFFFF; border:1px solid rgba(0,0,0,0.07); border-radius:16px; cursor:pointer; transition:all 0.3s; }
        .svc-row:hover { background:rgba(255,255,255,0.045); border-color:rgba(199,166,106,0.2); }
        @media(max-width:900px) { .prov-g{grid-template-columns:1fr !important;} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#F7F7F5', paddingBottom:'80px' }}>

        {/* ══ HERO ══ */}
        <div style={{ position:'relative', height:'clamp(420px,55vh,580px)', overflow:'hidden' }}>
          <img src={p.coverImg} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.15) saturate(0.4)' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 55% 65% at 20% 70%,${p.avatarColor}10,transparent 100%)` }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(2,8,6,0.5) 0%,transparent 30%,rgba(2,8,6,0.97) 100%)' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to left,rgba(2,8,6,0.6) 0%,transparent 55%)' }}/>
          <div style={{ position:'absolute', top:'-15%', left:'-5%', width:'50vw', height:'50vw', maxWidth:'500px', borderRadius:'50%', background:`radial-gradient(${p.avatarColor}06,transparent 65%)`, filter:'blur(40px)', animation:'ambient 14s ease-in-out infinite', pointerEvents:'none' }}/>

          {/* Nav */}
          <div style={{ position:'absolute', top:'24px', left:0, right:0, padding:'0 clamp(16px,4vw,48px)', display:'flex', justifyContent:'space-between', zIndex:10 }}>
            <Link href="/services" style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.5)', fontSize:'12px', textDecoration:'none', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(16px)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:'10px', padding:'7px 14px' }}>
              <ChevronRight size={13}/> خدمات فنی
            </Link>
            <button style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.5)', fontSize:'12px', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(16px)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:'10px', padding:'7px 14px', cursor:'pointer', fontFamily:'inherit' }}>
              <Share2 size={12}/> اشتراک
            </button>
          </div>

          {/* Content */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'clamp(24px,4vw,52px)', zIndex:10, opacity:heroOp }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:'24px', flexWrap:'wrap' }}>
              {/* Avatar */}
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:'clamp(72px,12vw,108px)', height:'clamp(72px,12vw,108px)', borderRadius:'22px', background:`linear-gradient(135deg,${p.avatarColor},${p.avatarColor}80)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(28px,6vw,44px)', fontWeight:900, color:'#fff', border:'3px solid rgba(199,166,106,0.4)', boxShadow:`0 0 40px ${p.avatarColor}30,0 20px 60px rgba(0,0,0,0.5)` }}>
                  {p.avatar}
                </div>
                {p.isOnline && <div style={{ position:'absolute', bottom:'4px', right:'4px', width:'14px', height:'14px', borderRadius:'50%', background:'#C7A66A', border:'2px solid rgba(2,8,6,0.98)', boxShadow:'0 0 10px #C7A66A' }}/>}
              </div>

              <div style={{ flex:1, minWidth:'200px' }}>
                {/* Badges */}
                <div style={{ display:'flex', gap:'8px', marginBottom:'10px', flexWrap:'wrap' }}>
                  {p.isCertified && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'20px', padding:'4px 13px', backdropFilter:'blur(16px)' }}>
                      <Award size={10} style={{ color:'#f59e0b' }}/><span style={{ fontSize:'9px', color:'#f59e0b', fontWeight:700, letterSpacing:'0.12em' }}>متخصص تأیید شده</span>
                    </div>
                  )}
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:`${p.avatarColor}12`, border:`1px solid ${p.avatarColor}28`, borderRadius:'20px', padding:'4px 13px', backdropFilter:'blur(16px)' }}>
                    <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:p.avatarColor, animation:'pulse 2s infinite', display:'inline-block' }}/>
                    <span style={{ fontSize:'9px', color:p.avatarColor, fontWeight:700, letterSpacing:'0.12em' }}>VERIFIED TECH</span>
                  </div>
                </div>

                <h1 style={{ fontSize:'clamp(24px,5vw,48px)', fontWeight:900, color:'#fff', margin:'0 0 6px', letterSpacing:'-0.035em', lineHeight:1.0, textShadow:`0 0 60px ${p.avatarColor}20` }}>
                  {p.name}
                </h1>
                <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.5)', marginBottom:'10px' }}>{p.title}</div>

                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(0,0,0,0.06)', backdropFilter:'blur(12px)', borderRadius:'20px', padding:'5px 13px', fontSize:'12px', color:'rgba(255,255,255,0.8)' }}>
                    <MapPin size={10} style={{ color:p.avatarColor }}/>{p.city}
                  </div>
                  <div style={{ display:'flex', gap:'3px', alignItems:'center', background:'rgba(0,0,0,0.06)', backdropFilter:'blur(12px)', borderRadius:'20px', padding:'5px 13px' }}>
                    {[1,2,3,4,5].map(s=><Star key={s} size={11} style={{ color:'#f59e0b', fill: s<=Math.floor(p.rating)?'#f59e0b':'transparent' }}/>)}
                    <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', marginRight:'5px' }}>{p.rating}</span>
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', marginRight:'3px' }}>({toFa(p.reviewCount)})</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(0,0,0,0.06)', backdropFilter:'blur(12px)', borderRadius:'20px', padding:'5px 13px', fontSize:'12px', color:'rgba(255,255,255,0.8)' }}>
                    <Clock size={10} style={{ color:'#C7A66A' }}/>{p.responseTime}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:'10px', flexShrink:0, flexWrap:'wrap' }}>
                <button onClick={()=>setReq(true)} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'12px 24px', borderRadius:'12px', border:'none', background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', fontSize:'13px', fontWeight:800, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 8px 24px rgba(245,158,11,0.35)', transition:'all 0.3s' }}>
                  <Wrench size={15}/>{requested?'درخواست ارسال شد':'درخواست خدمت'}
                </button>
                <button style={{ display:'flex', alignItems:'center', gap:'7px', padding:'12px 18px', borderRadius:'12px', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', color:'rgba(255,255,255,0.7)', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  <MessageCircle size={14}/>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ STATS BAR ══ */}
        <div style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(0,0,0,0.04)', padding:'0 clamp(16px,4vw,48px)' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
            {[
              { v:toFa(p.experience)+'سال', l:'تجربه',       c:p.avatarColor },
              { v:toFa(p.jobs),              l:'پروژه',       c:'#a78bfa'     },
              { v:toFa(p.reviewCount),       l:'نظر مشتری',   c:'#f59e0b'     },
              { v:p.warranty,                l:'ضمانت',       c:'#C7A66A'     },
            ].map((s,i) => (
              <div key={i} style={{ padding:'18px 10px', textAlign:'center', borderLeft: i>0?'1px solid rgba(0,0,0,0.04)':'none' }}>
                <div style={{ fontSize:'clamp(16px,2.5vw,22px)', fontWeight:900, color: '#111111', letterSpacing:'-0.02em', textShadow:`0 0 14px ${s.c}25` }}>{s.v}</div>
                <div style={{ fontSize:'10px', color:'rgba(0,0,0,0.35)', marginTop:'3px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ MAIN ══ */}
        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'32px', overflowX:'auto', padding:'2px' }}>
            {[{k:'overview',l:'خلاصه'},{k:'services',l:`خدمات (${p.services.length})`},{k:'portfolio',l:'نمونه کارها'},{k:'reviews',l:`نظرات (${p.reviewCount})`}].map(t => (
              <button key={t.k} className={`tab-b ${tab===t.k?'active':''}`} onClick={()=>setTab(t.k as any)}>{t.l}</button>
            ))}
          </div>

          <div className="prov-g" style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'28px', alignItems:'start' }}>

            {/* ── LEFT ── */}
            <div>

              {/* ════ OVERVIEW ════ */}
              {tab==='overview' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:'20px' }}>

                  {/* Bio */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px' }}>
                    <h3 style={{ fontSize:'15px', fontWeight:800, color: '#111111', margin:'0 0 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:`linear-gradient(180deg,${p.avatarColor},#06b6d4)`, borderRadius:'2px', display:'inline-block' }}/>
                      درباره متخصص
                    </h3>
                    <p style={{ fontSize:'14px', color:'rgba(0,0,0,0.50)', lineHeight:1.9, margin:'0 0 20px' }}>{p.bio}</p>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
                      {[
                        { l:'شهر پوشش',    v:p.address,         icon:<MapPin size={13} style={{ color:p.avatarColor }}/> },
                        { l:'زمان پاسخ',   v:p.responseTime,    icon:<Clock size={13} style={{ color:'#06b6d4' }}/> },
                        { l:'ضمانت کار',   v:p.warranty,        icon:<Shield size={13} style={{ color:'#C7A66A' }}/> },
                        { l:'شروع قیمت',   v:`${toFa(p.priceFrom.toLocaleString())} تومان`, icon:<Zap size={13} style={{ color:'#f59e0b' }}/> },
                      ].map((r,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(0,0,0,0.04)', borderRadius:'12px' }}>
                          <span style={{ flexShrink:0 }}>{r.icon}</span>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontSize:'10px', color:'rgba(0,0,0,0.35)', marginBottom:'2px' }}>{r.l}</div>
                            <div style={{ fontSize:'13px', fontWeight:600, color: '#111111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.v}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px' }}>
                    <h3 style={{ fontSize:'15px', fontWeight:800, color: '#111111', margin:'0 0 18px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#f59e0b,#a78bfa)', borderRadius:'2px', display:'inline-block' }}/>
                      گواهینامه‌ها
                    </h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
                      {p.certifications.map((cert: string, i: number) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.12)', borderRadius:'13px' }}>
                          <Award size={13} style={{ color:'#f59e0b', flexShrink:0 }}/>
                          <span style={{ fontSize:'12px', color:'rgba(0,0,0,0.48)', fontWeight:500 }}>{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brands */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'26px' }}>
                    <h3 style={{ fontSize:'15px', fontWeight:800, color: '#111111', margin:'0 0 16px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ width:'3px', height:'16px', background:'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius:'2px', display:'inline-block' }}/>
                      برندهای تخصصی
                    </h3>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                      {p.brands.map((b: string) => (
                        <span key={b} style={{ fontSize:'12px', fontWeight:700, color:p.avatarColor, background:`${p.avatarColor}10`, border:`1px solid ${p.avatarColor}22`, borderRadius:'20px', padding:'6px 14px' }}>{b}</span>
                      ))}
                    </div>
                  </div>

                  {/* Before/After */}
                  {p.beforeAfter.length > 0 && (
                    <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', overflow:'hidden' }}>
                      <div style={{ padding:'22px 24px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <h3 style={{ fontSize:'15px', fontWeight:800, color: '#111111', margin:0, display:'flex', alignItems:'center', gap:'10px' }}>
                          <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#ef4444,#f59e0b)', borderRadius:'2px', display:'inline-block' }}/>
                          قبل و بعد
                        </h3>
                        <div style={{ display:'flex', gap:'6px' }}>
                          <button onClick={()=>setBaIdx(i=>Math.max(0,i-1))} style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.06)', cursor:'pointer', color:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronRight size={14}/></button>
                          <button onClick={()=>setBaIdx(i=>Math.min(p.beforeAfter.length-1,i+1))} style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.06)', cursor:'pointer', color:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronLeft size={14}/></button>
                        </div>
                      </div>

                      {p.beforeAfter[baIdx] && (
                        <div style={{ padding:'0 24px 20px' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                            {[{img: p.beforeAfter[baIdx].before, label:'قبل'},{img: p.beforeAfter[baIdx].after, label:'بعد'}].map((side,i) => (
                              <div key={i} style={{ position:'relative', borderRadius:'14px', overflow:'hidden', aspectRatio:'16/9' }}>
                                <img src={side.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:`brightness(${i===0?0.3:0.55})` }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
                                <div style={{ position:'absolute', bottom:'8px', right:'8px', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', borderRadius:'20px', padding:'3px 10px', fontSize:'10px', color:'rgba(255,255,255,0.8)', fontWeight:700 }}>{side.label}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize:'13px', color:'rgba(0,0,0,0.45)', textAlign:'center' }}>{p.beforeAfter[baIdx].title}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ════ SERVICES ════ */}
              {tab==='services' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:'10px' }}>
                  {p.services.map((svc: any, i: number) => (
                    <div key={i} className="svc-row" onClick={()=>setSelSvc(selSvc===i?null:i)}
                      style={{ borderColor: selSvc===i?`${p.avatarColor}40`:'rgba(0,0,0,0.07)', background: selSvc===i?`${p.avatarColor}08`:'#FFFFFF' }}>
                      <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:`${p.avatarColor}12`, border:`1px solid ${p.avatarColor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>🔧</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                          <span style={{ fontSize:'14px', fontWeight:700, color: '#111111' }}>{svc.title}</span>
                          {svc.popular && <span style={{ fontSize:'9px', color:'#ef4444', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'20px', padding:'2px 8px', fontWeight:700 }}>پرطرفدار</span>}
                        </div>
                        <div style={{ display:'flex', gap:'10px', fontSize:'11px', color:'rgba(0,0,0,0.42)' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Clock size={10} style={{ color:'rgba(0,0,0,0.30)' }}/>{svc.duration}</span>
                          <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Shield size={10} style={{ color:'rgba(0,0,0,0.30)' }}/>{p.warranty} ضمانت</span>
                        </div>
                      </div>
                      <div style={{ textAlign:'left', flexShrink:0 }}>
                        <div style={{ fontSize:'16px', fontWeight:900, color:p.avatarColor, letterSpacing:'-0.02em', textShadow: selSvc===i?`0 0 14px ${p.avatarColor}50`:'none' }}>
                          {toFa(svc.price.toLocaleString())}
                        </div>
                        <div style={{ fontSize:'10px', color:'rgba(0,0,0,0.35)' }}>تومان</div>
                      </div>
                      {selSvc===i && <Check size={16} style={{ color:p.avatarColor, flexShrink:0 }}/>}
                    </div>
                  ))}

                  {selSvc !== null && (
                    <div style={{ padding:'16px 18px', background:`${p.avatarColor}08`, border:`1px solid ${p.avatarColor}22`, borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', animation:'fadeUp 0.3s ease both' }}>
                      <div>
                        <div style={{ fontSize:'14px', fontWeight:800, color: '#111111', marginBottom:'3px' }}>{p.services[selSvc]?.title}</div>
                        <div style={{ fontSize:'12px', color:'rgba(0,0,0,0.42)' }}>هزینه: {toFa(p.services[selSvc]?.price.toLocaleString())} تومان</div>
                      </div>
                      <button onClick={()=>setReq(true)} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 24px', background:`linear-gradient(135deg,${p.avatarColor},${p.avatarColor}cc)`, border:'none', borderRadius:'12px', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 6px 18px ${p.avatarColor}30` }}>
                        <Calendar size={14}/> درخواست خدمت →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ════ PORTFOLIO ════ */}
              {tab==='portfolio' && (
                <div style={{ animation:'fadeUp 0.4s ease both' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'14px', marginBottom:'20px' }}>
                    {p.gallery.map((img: string, i: number) => (
                      <div key={i} style={{ borderRadius:'16px', overflow:'hidden', aspectRatio:'16/9', position:'relative', cursor:'pointer' }}>
                        <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.45)', transition:'all 0.5s' }}
                          onMouseEnter={e=>{(e.target as HTMLImageElement).style.filter='brightness(0.65)';(e.target as HTMLImageElement).style.transform='scale(1.04)';}}
                          onMouseLeave={e=>{(e.target as HTMLImageElement).style.filter='brightness(0.45)';(e.target as HTMLImageElement).style.transform='none';}}
                          onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
                        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                          <Camera size={20} style={{ color:'rgba(255,255,255,0.3)' }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ════ REVIEWS ════ */}
              {tab==='reviews' && (
                <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:'12px' }}>
                  {/* Summary */}
                  <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'24px', display:'flex', gap:'24px', alignItems:'center', flexWrap:'wrap' }}>
                    <div style={{ textAlign:'center', flexShrink:0 }}>
                      <div style={{ fontSize:'52px', fontWeight:900, color: '#111111', lineHeight:1 }}>{p.rating}</div>
                      <div style={{ display:'flex', gap:'3px', justifyContent:'center', margin:'7px 0 4px' }}>
                        {[1,2,3,4,5].map(s=><Star key={s} size={14} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>)}
                      </div>
                      <div style={{ fontSize:'11px', color:'rgba(0,0,0,0.40)' }}>{toFa(p.reviewCount)} نظر</div>
                    </div>
                    <div style={{ flex:1, minWidth:'160px', display:'flex', flexDirection:'column', gap:'6px' }}>
                      {[{s:5,pct:88},{s:4,pct:9},{s:3,pct:2},{s:2,pct:1},{s:1,pct:0}].map(r => (
                        <div key={r.s} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <span style={{ fontSize:'10px', color:'rgba(0,0,0,0.40)', width:'12px' }}>{toFa(r.s)}</span>
                          <Star size={9} style={{ color:'#f59e0b', fill:'#f59e0b', flexShrink:0 }}/>
                          <div style={{ flex:1, height:'5px', background:'rgba(0,0,0,0.05)', borderRadius:'3px', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${r.pct}%`, background:'linear-gradient(90deg,#f59e0b,#f59e0b70)', borderRadius:'3px' }}/>
                          </div>
                          <span style={{ fontSize:'10px', color:'rgba(0,0,0,0.30)', width:'26px', textAlign:'left' }}>{toFa(r.pct)}٪</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {REVIEWS.map((r,i) => (
                    <div key={i} style={{ padding:'20px', background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.05)', borderRadius:'18px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:`linear-gradient(135deg,${p.avatarColor},${p.avatarColor}80)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:900, color:'#fff', flexShrink:0 }}>
                            {r.name[0]}
                          </div>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'3px' }}>
                              <span style={{ fontSize:'14px', fontWeight:700, color: '#111111' }}>{r.name}</span>
                              {r.verified && <span style={{ fontSize:'9px', color:'#C7A66A', background:'rgba(199,166,106,0.1)', border:'1px solid rgba(199,166,106,0.2)', borderRadius:'20px', padding:'1px 7px', fontWeight:700, display:'flex', alignItems:'center', gap:'2px' }}><Check size={8}/>تأیید</span>}
                              <span style={{ fontSize:'9px', color:p.avatarColor, background:`${p.avatarColor}10`, border:`1px solid ${p.avatarColor}20`, borderRadius:'20px', padding:'1px 7px', fontWeight:700 }}>{r.project}</span>
                            </div>
                            <div style={{ fontSize:'10px', color:'rgba(0,0,0,0.35)' }}>{r.date}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:'2px', flexShrink:0 }}>
                          {[1,2,3,4,5].map(s=><Star key={s} size={12} style={{ color: s<=r.rating?'#f59e0b':'rgba(0,0,0,0.08)', fill: s<=r.rating?'#f59e0b':'transparent' }}/>)}
                        </div>
                      </div>
                      <p style={{ fontSize:'13px', color:'rgba(0,0,0,0.50)', margin:'0 0 12px', lineHeight:1.75 }}>{r.text}</p>
                      <button style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 12px', borderRadius:'20px', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.07)', fontSize:'11px', color:'rgba(0,0,0,0.45)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                        <ThumbsUp size={10}/> مفید بود
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <div style={{ position:'sticky', top:'80px', display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* Book CTA */}
              <div style={{ background:'#FFFFFF', border:`1px solid ${p.avatarColor}22`, borderRadius:'22px', padding:'22px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'120px', height:'1px', background:`linear-gradient(90deg,transparent,${p.avatarColor}55,transparent)`, boxShadow:`0 0 14px ${p.avatarColor}35` }}/>
                <div style={{ fontSize:'10px', color:`${p.avatarColor}70`, letterSpacing:'0.2em', fontWeight:700, marginBottom:'14px', textAlign:'center' }}>درخواست خدمت</div>
                <div style={{ fontSize:'13px', color:'rgba(0,0,0,0.45)', marginBottom:'16px', textAlign:'center', lineHeight:1.6 }}>
                  از {toFa(p.priceFrom.toLocaleString())} تومان
                </div>

                {/* Quick info */}
                {[
                  { icon:<Clock size={13}/>,  label:'پاسخ',  v:p.responseTime, c:'#C7A66A' },
                  { icon:<Shield size={13}/>, label:'ضمانت', v:p.warranty,     c:'#06b6d4' },
                ].map((x,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(0,0,0,0.04)', borderRadius:'11px', marginBottom:'8px' }}>
                    <span style={{ color:x.c, flexShrink:0 }}>{x.icon}</span>
                    <span style={{ fontSize:'12px', color:'rgba(0,0,0,0.42)' }}>{x.label}:</span>
                    <span style={{ fontSize:'12px', fontWeight:600, color: '#111111', marginRight:'auto' }}>{x.v}</span>
                  </div>
                ))}

                <button onClick={()=>setReq(true)} style={{ width:'100%', padding:'14px', marginTop:'8px', borderRadius:'13px', border:'none', background: requested?'rgba(199,166,106,0.2)':`linear-gradient(135deg,${p.avatarColor},${p.avatarColor}cc)`, color: requested?'#C7A66A':'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'all 0.3s', boxShadow: requested?'none':`0 8px 24px ${p.avatarColor}30`, display:'flex', alignItems:'center', justifyContent:'center', gap:'9px' }}>
                  {requested ? <><Check size={16}/>درخواست ارسال شد</> : <><Wrench size={16}/>درخواست خدمت</>}
                </button>
              </div>

              {/* Specialities */}
              <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'20px' }}>
                <div style={{ fontSize:'11px', color:'rgba(0,0,0,0.35)', letterSpacing:'0.15em', fontWeight:700, marginBottom:'12px', textTransform:'uppercase' }}>تخصص‌ها</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
                  {p.speciality.map((s: string) => (
                    <span key={s} style={{ fontSize:'11px', color:p.avatarColor, background:`${p.avatarColor}10`, border:`1px solid ${p.avatarColor}22`, borderRadius:'20px', padding:'5px 12px', fontWeight:600 }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'20px', padding:'20px' }}>
                <div style={{ fontSize:'11px', color:'rgba(0,0,0,0.35)', letterSpacing:'0.15em', fontWeight:700, marginBottom:'14px', textTransform:'uppercase' }}>آمار کاری</div>
                {[
                  { l:'پروژه تکمیل‌شده', v:toFa(p.jobs),          c:p.avatarColor },
                  { l:'سال‌های تجربه',   v:toFa(p.experience),    c:'#a78bfa'     },
                  { l:'امتیاز کلی',      v:`${p.rating}/5`,       c:'#f59e0b'     },
                  { l:'گواهینامه',        v:toFa(p.certifications.length), c:'#C7A66A' },
                ].map((s,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom: i<3?'1px solid rgba(0,0,0,0.04)':'none' }}>
                    <span style={{ fontSize:'12px', color:'rgba(0,0,0,0.42)' }}>{s.l}</span>
                    <span style={{ fontSize:'13px', fontWeight:800, color:s.c }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}