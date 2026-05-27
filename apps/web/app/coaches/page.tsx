'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search, Star, MapPin, Trophy, Users, Check,
  Filter, X, ChevronDown, Award, Target,
  Zap, Shield, Clock, SlidersHorizontal,
} from 'lucide-react';

/* ══ types ══ */
interface Coach {
  id: string; name: string; title: string; speciality: string[];
  city: string; experience: number; rating: number; reviewCount: number;
  students: number; sessions: number; hourlyRate: number;
  avatar: string; avatarColor: string; coverImg: string;
  certifications: string[]; languages: string[];
  isVerified: boolean; isFederation: boolean; isOnline: boolean;
  bio: string; achievements: string[];
  lessonTypes: ('private'|'group'|'online')[];
}

/* ══ data ══ */
const COACHES: Coach[] = [
  {
    id:'c1', name:'کاوه نوری', title:'مربی ارشد اسنوکر', speciality:['اسنوکر','پوزیشن‌بازی','بریک‌بیلدینگ'],
    city:'تهران', experience:15, rating:5.0, reviewCount:87, students:340, sessions:1240, hourlyRate:800000,
    avatar:'ک', avatarColor:'#10b981', coverImg:'/images/billiadr-club-1.jpg',
    certifications:['مربی درجه یک فدراسیون','WPBSA Coach Level 3','مربی ملی'],
    languages:['فارسی','انگلیسی'], isVerified:true, isFederation:true, isOnline:true,
    bio:'با ۱۵ سال سابقه تدریس در بالاترین سطح بیلیارد ایران، تخصص اصلی من اسنوکر حرفه‌ای و آماده‌سازی بازیکنان برای مسابقات ملی و بین‌المللی است.',
    achievements:['مربی سال ۱۴۰۲','پرورش ۳ قهرمان ملی','مربی تیم ملی ایران'],
    lessonTypes:['private','group','online'],
  },
  {
    id:'c2', name:'سارا محمدی', title:'مربی پاکت بیلیارد', speciality:['پاکت بیلیارد','بازی دفاعی','تکنیک ضربه'],
    city:'تهران', experience:8, rating:4.7, reviewCount:52, students:210, sessions:680, hourlyRate:600000,
    avatar:'س', avatarColor:'#a78bfa', coverImg:'/images/billiadr-club-3.jpg',
    certifications:['مربی درجه دو فدراسیون','BCA Certified Coach'],
    languages:['فارسی'], isVerified:true, isFederation:true, isOnline:false,
    bio:'متخصص پاکت بیلیارد با رویکرد علمی و تحلیلی. برنامه‌های تمرینی شخصی‌سازی‌شده برای بازیکنان از مبتدی تا حرفه‌ای.',
    achievements:['قهرمان لیگ خانم‌ها ۱۴۰۱','مربی انتخابی فدراسیون'],
    lessonTypes:['private','group'],
  },
  {
    id:'c3', name:'امیر رضایی', title:'مربی هی‌بال و سه‌کوشن', speciality:['هی‌بال','سه‌کوشن','محاسبات زاویه'],
    city:'مشهد', experience:12, rating:4.9, reviewCount:64, students:280, sessions:950, hourlyRate:700000,
    avatar:'ا', avatarColor:'#06b6d4', coverImg:'/images/billiadr-club-1.jpg',
    certifications:['مربی درجه یک فدراسیون','UMB Coach','مربی بین‌المللی'],
    languages:['فارسی','عربی'], isVerified:true, isFederation:true, isOnline:true,
    bio:'تخصص در هی‌بال و سه‌کوشن با بیش از ۱۲ سال تجربه. رویکرد ریاضی و تحلیلی در آموزش که نتایج چشمگیری برای شاگردانم داشته.',
    achievements:['۵ قهرمان ملی هی‌بال','مربی سال ۱۴۰۱','نویسنده کتاب آموزش سه‌کوشن'],
    lessonTypes:['private','online'],
  },
  {
    id:'c4', name:'نیلوفر کریمی', title:'مربی اسنوکر بانوان', speciality:['اسنوکر','روانشناسی ورزشی','بازی تحت فشار'],
    city:'اصفهان', experience:7, rating:4.8, reviewCount:41, students:160, sessions:520, hourlyRate:550000,
    avatar:'ن', avatarColor:'#f59e0b', coverImg:'/images/billiadr-club-3.jpg',
    certifications:['مربی درجه دو فدراسیون','WPBSA Junior Coach'],
    languages:['فارسی','انگلیسی'], isVerified:true, isFederation:false, isOnline:true,
    bio:'تمرکز ویژه روی بازیکنان نوجوان و بانوان. متدولوژی منحصربه‌فرد در ترکیب روانشناسی ورزشی با تکنیک‌های فنی.',
    achievements:['قهرمان کشوری بانوان ۱۴۰۰','مربی نمونه استان اصفهان'],
    lessonTypes:['private','group','online'],
  },
  {
    id:'c5', name:'حسین فتحی', title:'مربی ارشد VIP', speciality:['اسنوکر','پاکت','آمادگی مسابقات'],
    city:'شیراز', experience:20, rating:4.9, reviewCount:103, students:420, sessions:1800, hourlyRate:1200000,
    avatar:'ح', avatarColor:'#ef4444', coverImg:'/images/billiadr-club-1.jpg',
    certifications:['مربی درجه یک فدراسیون','WPBSA Coach Level 4','مربی اسبق تیم ملی'],
    languages:['فارسی','انگلیسی','ترکی'], isVerified:true, isFederation:true, isOnline:false,
    bio:'با ۲۰ سال سابقه در بالاترین سطح بیلیارد جهان، تخصص اصلی آماده‌سازی بازیکنان حرفه‌ای برای تورنومنت‌های بین‌المللی است.',
    achievements:['مربی اسبق تیم ملی','۸ قهرمان بین‌المللی','نویسنده ۳ کتاب تخصصی'],
    lessonTypes:['private'],
  },
  {
    id:'c6', name:'رضا موسوی', title:'مربی آنلاین اسنوکر', speciality:['اسنوکر','تدریس آنلاین','تحلیل ویدیویی'],
    city:'تهران', experience:6, rating:4.6, reviewCount:38, students:190, sessions:410, hourlyRate:400000,
    avatar:'ر', avatarColor:'#10b981', coverImg:'/images/billiadr-club-3.jpg',
    certifications:['مربی درجه دو فدراسیون','Online Coach Certificate'],
    languages:['فارسی'], isVerified:true, isFederation:false, isOnline:true,
    bio:'متخصص آموزش آنلاین بیلیارد با استفاده از تحلیل ویدیویی و ابزارهای دیجیتال. مناسب برای کسانی که امکان حضور فیزیکی ندارند.',
    achievements:['بیش از ۱۹۰ شاگرد آنلاین','بهترین مربی آنلاین پلتفرم'],
    lessonTypes:['online'],
  },
];

const CITIES       = ['همه شهرها','تهران','مشهد','اصفهان','شیراز','تبریز'];
const SPECIALITIES = ['اسنوکر','پاکت بیلیارد','هی‌بال','سه‌کوشن'];
const LESSON_TYPES = [{k:'private',l:'خصوصی'},{k:'group',l:'گروهی'},{k:'online',l:'آنلاین'}];

function toFa(v: string|number){ return String(v).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d))); }

/* ══ Coach Card ══ */
function CoachCard({ coach }: { coach: Coach }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/coaches/${coach.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
        style={{ background: hovered?'rgba(255,255,255,0.055)':'rgba(255,255,255,0.028)', border:`1px solid ${hovered?'rgba(16,185,129,0.28)':'rgba(255,255,255,0.07)'}`, borderRadius:'22px', overflow:'hidden', transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)', transform: hovered?'translateY(-7px)':'none', boxShadow: hovered?'0 24px 60px rgba(0,0,0,0.5),0 0 0 1px rgba(16,185,129,0.08)':'0 4px 20px rgba(0,0,0,0.25)' }}>

        {/* Cover */}
        <div style={{ height:'120px', position:'relative', overflow:'hidden' }}>
          <img src={coach.coverImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.2) saturate(0.5)', transition:'transform 0.6s', transform: hovered?'scale(1.07)':'scale(1)' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${coach.avatarColor}20,transparent)` }}/>

          {/* Online badge */}
          {coach.isOnline && (
            <div style={{ position:'absolute', top:'12px', left:'12px', display:'flex', alignItems:'center', gap:'5px', background:'rgba(16,185,129,0.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'20px', padding:'4px 10px', fontSize:'9px', color:'#10b981', fontWeight:700 }}>
              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'pulse 2s infinite' }}/>آنلاین
            </div>
          )}

          {/* Federation badge */}
          {coach.isFederation && (
            <div style={{ position:'absolute', top:'12px', right:'12px', background:'rgba(245,158,11,0.85)', backdropFilter:'blur(8px)', borderRadius:'20px', padding:'4px 10px', fontSize:'9px', color:'#fff', fontWeight:700, display:'flex', alignItems:'center', gap:'3px' }}>
              <Shield size={9}/> فدراسیون
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={{ padding:'0 20px', marginTop:'-28px', marginBottom:'12px', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:`linear-gradient(135deg,${coach.avatarColor},${coach.avatarColor}80)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:900, color:'#fff', border:'3px solid rgba(6,13,10,0.98)', boxShadow:`0 8px 24px ${coach.avatarColor}40`, flexShrink:0 }}>
            {coach.avatar}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'20px', padding:'5px 10px' }}>
            <Star size={11} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>
            <span style={{ fontSize:'13px', fontWeight:800, color:'#f59e0b' }}>{coach.rating}</span>
            <span style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)' }}>({toFa(coach.reviewCount)})</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:'0 20px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
            <h3 style={{ fontSize:'16px', fontWeight:900, color:'#f0faf5', margin:0, letterSpacing:'-0.015em' }}>{coach.name}</h3>
            {coach.isVerified && <Check size={13} style={{ color:'#10b981', flexShrink:0 }}/>}
          </div>
          <div style={{ fontSize:'12px', color:'rgba(240,250,245,0.45)', marginBottom:'12px' }}>{coach.title}</div>

          {/* Specialities */}
          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'12px' }}>
            {coach.speciality.slice(0,3).map(s => (
              <span key={s} style={{ fontSize:'9px', color:coach.avatarColor, background:`${coach.avatarColor}10`, border:`1px solid ${coach.avatarColor}22`, borderRadius:'20px', padding:'2px 8px', fontWeight:700 }}>{s}</span>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:'0', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'12px' }}>
            {[
              { v:toFa(coach.experience), l:'سال تجربه' },
              { v:toFa(coach.students),   l:'شاگرد' },
              { v:toFa(coach.sessions),   l:'جلسه' },
            ].map((s,i) => (
              <div key={i} style={{ flex:1, textAlign:'center', borderLeft: i>0?'1px solid rgba(255,255,255,0.05)':'none' }}>
                <div style={{ fontSize:'16px', fontWeight:900, color:'#f0faf5', letterSpacing:'-0.02em' }}>{s.v}</div>
                <div style={{ fontSize:'9px', color:'rgba(240,250,245,0.3)', marginTop:'2px' }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'14px', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div style={{ fontSize:'15px', fontWeight:900, color:'#10b981', letterSpacing:'-0.02em' }}>{toFa(coach.hourlyRate.toLocaleString())}</div>
              <div style={{ fontSize:'9px', color:'rgba(240,250,245,0.3)' }}>تومان / ساعت</div>
            </div>
            <div style={{ display:'flex', gap:'5px' }}>
              {coach.lessonTypes.map(t => (
                <span key={t} style={{ fontSize:'9px', padding:'3px 8px', borderRadius:'20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(240,250,245,0.45)', fontWeight:600 }}>
                  {t==='private'?'خصوصی':t==='group'?'گروهی':'آنلاین'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ══ MAIN ══ */
export default function CoachesPage() {
  const [search,     setSearch]     = useState('');
  const [city,       setCity]       = useState('همه شهرها');
  const [specs,      setSpecs]      = useState<string[]>([]);
  const [types,      setTypes]      = useState<string[]>([]);
  const [sortBy,     setSortBy]     = useState('rating');
  const [filterOpen, setFilterOpen] = useState(false);
  const [onlyFed,    setOnlyFed]    = useState(false);
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [sfocus,     setSfocus]     = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const toggleSpec = (s: string) => setSpecs(p => p.includes(s)?p.filter(x=>x!==s):[...p,s]);
  const toggleType = (t: string) => setTypes(p => p.includes(t)?p.filter(x=>x!==t):[...p,t]);
  const activeFilters = specs.length + types.length + (onlyFed?1:0) + (onlyOnline?1:0);

  const filtered = COACHES.filter(c => {
    if (search && !c.name.includes(search) && !c.title.includes(search) && !c.city.includes(search)) return false;
    if (city !== 'همه شهرها' && c.city !== city) return false;
    if (onlyFed    && !c.isFederation) return false;
    if (onlyOnline && !c.isOnline)     return false;
    if (specs.length > 0 && !specs.some(s => c.speciality.includes(s))) return false;
    if (types.length > 0 && !types.some(t => c.lessonTypes.includes(t as any))) return false;
    return true;
  }).sort((a,b) => {
    if (sortBy==='rating')     return b.rating - a.rating;
    if (sortBy==='experience') return b.experience - a.experience;
    if (sortBy==='students')   return b.students - a.students;
    if (sortBy==='price_asc')  return a.hourlyRate - b.hourlyRate;
    if (sortBy==='price_desc') return b.hourlyRate - a.hourlyRate;
    return 0;
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;} }
        @keyframes pulse  { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes ambient{ 0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-16px);} }

        .s-bar { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.08); border-radius:14px; padding:0 16px; height:50px; transition:all 0.3s; }
        .s-bar.focus { border-color:rgba(16,185,129,0.4); background:rgba(255,255,255,0.06); box-shadow:0 0 0 3px rgba(16,185,129,0.08); }
        .s-input { flex:1; background:transparent; border:none; outline:none; color:#f0faf5; font-size:14px; font-family:inherit; }
        .s-input::placeholder { color:rgba(240,250,245,0.22); }
        .city-btn { padding:7px 16px; border-radius:20px; font-size:12px; font-weight:600; border:1px solid; cursor:pointer; font-family:inherit; white-space:nowrap; transition:all 0.2s; }
        .city-btn.active { background:rgba(16,185,129,0.12); border-color:rgba(16,185,129,0.35); color:#10b981; }
        .city-btn:not(.active) { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.07); color:rgba(240,250,245,0.45); }
        .sort-sel { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:9px 14px; color:rgba(240,250,245,0.7); font-size:12px; font-family:inherit; outline:none; cursor:pointer; }
        .chip-btn { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:10px; font-size:12px; font-weight:600; border:1px solid; cursor:pointer; font-family:inherit; transition:all 0.2s; white-space:nowrap; }
        .chip-btn.active { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3); color:#10b981; }
        .chip-btn:not(.active) { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.07); color:rgba(240,250,245,0.45); }
        .chip-btn:not(.active):hover { background:rgba(255,255,255,0.06); color:rgba(240,250,245,0.7); }
        @media(max-width:900px){ .coaches-grid{grid-template-columns:repeat(2,1fr)!important;} }
        @media(max-width:560px){ .coaches-grid{grid-template-columns:1fr!important;} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#020806,#060d0a)', paddingBottom:'80px' }}>

        {/* ══ HERO ══ */}
        <div style={{ position:'relative', background:'rgba(2,8,6,0.98)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'clamp(32px,5vw,56px) clamp(16px,4vw,48px) 0', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-20%', right:'-5%', width:'40vw', height:'40vw', maxWidth:'480px', borderRadius:'50%', background:'radial-gradient(rgba(167,139,250,0.07),transparent 65%)', filter:'blur(40px)', animation:'ambient 14s ease-in-out infinite', pointerEvents:'none' }}/>

          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ fontSize:'10px', color:'rgba(167,139,250,0.65)', letterSpacing:'0.25em', fontWeight:700, marginBottom:'10px' }}>COACH DISCOVERY</div>
            <h1 style={{ fontSize:'clamp(28px,5vw,48px)', fontWeight:900, color:'#f0faf5', margin:'0 0 10px', letterSpacing:'-0.035em', lineHeight:1.05 }}>
              مربیان برتر بیلیارد
            </h1>
            <p style={{ fontSize:'15px', color:'rgba(240,250,245,0.4)', margin:'0 0 28px' }}>
              از {toFa(COACHES.length)} مربی تأیید‌شده فدراسیون انتخاب کنید
            </p>

            {/* City pills */}
            <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'20px' }}>
              {CITIES.map(c => (
                <button key={c} className={`city-btn ${city===c?'active':''}`} onClick={()=>setCity(c)}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ TOOLBAR ══ */}
        <div style={{ background:'rgba(2,8,6,0.97)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'12px clamp(16px,4vw,48px)', position:'sticky', top:'62px', zIndex:90, backdropFilter:'blur(24px)' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
            <div className={`s-bar ${sfocus?'focus':''}`} style={{ flex:1, minWidth:'200px', maxWidth:'360px' }}>
              <Search size={15} style={{ color:'rgba(240,250,245,0.25)', flexShrink:0 }}/>
              <input className="s-input" value={search} onChange={e=>setSearch(e.target.value)}
                onFocus={()=>setSfocus(true)} onBlur={()=>setSfocus(false)}
                placeholder="جستجو مربی، تخصص، شهر..."/>
              {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(240,250,245,0.3)', padding:0, display:'flex' }}><X size={13}/></button>}
            </div>

            <div ref={filterRef} style={{ position:'relative' }}>
              <button className={`chip-btn ${filterOpen||activeFilters>0?'active':''}`} onClick={()=>setFilterOpen(p=>!p)}>
                <SlidersHorizontal size={13}/> فیلتر
                {activeFilters>0 && <span style={{ width:'18px', height:'18px', borderRadius:'50%', background:'#10b981', color:'#fff', fontSize:'9px', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>{toFa(activeFilters)}</span>}
              </button>

              {filterOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, width:'min(320px,90vw)', background:'rgba(6,13,10,0.98)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'18px', padding:'20px', zIndex:200, boxShadow:'0 24px 60px rgba(0,0,0,0.6)', backdropFilter:'blur(24px)', animation:'fadeUp 0.22s ease both' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                    <span style={{ fontSize:'14px', fontWeight:800, color:'#f0faf5' }}>فیلترها</span>
                    {activeFilters>0 && <button onClick={()=>{setSpecs([]);setTypes([]);setOnlyFed(false);setOnlyOnline(false);}} style={{ fontSize:'11px', color:'#ef4444', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:'20px', padding:'3px 10px', cursor:'pointer', fontFamily:'inherit' }}>پاک کردن</button>}
                  </div>

                  <div style={{ marginBottom:'16px' }}>
                    <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)', fontWeight:700, marginBottom:'8px', letterSpacing:'0.12em' }}>تخصص</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
                      {SPECIALITIES.map(s => (
                        <button key={s} onClick={()=>toggleSpec(s)} style={{ padding:'5px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:600, border:`1px solid ${specs.includes(s)?'rgba(16,185,129,0.35)':'rgba(255,255,255,0.07)'}`, background: specs.includes(s)?'rgba(16,185,129,0.1)':'transparent', color: specs.includes(s)?'#10b981':'rgba(240,250,245,0.5)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom:'16px' }}>
                    <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)', fontWeight:700, marginBottom:'8px', letterSpacing:'0.12em' }}>نوع جلسه</div>
                    <div style={{ display:'flex', gap:'7px' }}>
                      {LESSON_TYPES.map(t => (
                        <button key={t.k} onClick={()=>toggleType(t.k)} style={{ padding:'5px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:600, border:`1px solid ${types.includes(t.k)?'rgba(16,185,129,0.35)':'rgba(255,255,255,0.07)'}`, background: types.includes(t.k)?'rgba(16,185,129,0.1)':'transparent', color: types.includes(t.k)?'#10b981':'rgba(240,250,245,0.5)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                          {t.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'10px', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                    {[{l:'فقط مربیان فدراسیون',v:onlyFed,s:setOnlyFed},{l:'فقط مربیان آنلاین',v:onlyOnline,s:setOnlyOnline}].map((t,i) => (
                      <div key={i} onClick={()=>t.s(p=>!p)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'6px 0' }}>
                        <span style={{ fontSize:'13px', color:'rgba(240,250,245,0.6)' }}>{t.l}</span>
                        <div style={{ width:'36px', height:'20px', borderRadius:'10px', background:t.v?'#10b981':'rgba(255,255,255,0.1)', position:'relative', transition:'all 0.3s', boxShadow:t.v?'0 0 8px rgba(16,185,129,0.3)':'none' }}>
                          <div style={{ position:'absolute', top:'2px', width:'14px', height:'14px', borderRadius:'50%', background:'#fff', transition:'all 0.3s', left:t.v?'18px':'2px', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <select className="sort-sel" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="rating">بهترین امتیاز</option>
              <option value="experience">بیشترین تجربه</option>
              <option value="students">بیشترین شاگرد</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
            </select>

            <div style={{ marginRight:'auto', fontSize:'12px', color:'rgba(240,250,245,0.35)' }}>{toFa(filtered.length)} مربی</div>
          </div>
        </div>

        {/* ══ CONTENT ══ */}
        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* Stats bar */}
          <div style={{ display:'flex', gap:'24px', marginBottom:'32px', flexWrap:'wrap' }}>
            {[
              { v:toFa(COACHES.filter(c=>c.isFederation).length), l:'مربی فدراسیون', c:'#f59e0b' },
              { v:toFa(COACHES.filter(c=>c.isOnline).length),     l:'آموزش آنلاین',  c:'#10b981' },
              { v:toFa(COACHES.reduce((a,c)=>a+c.students,0)),    l:'شاگرد کل',      c:'#a78bfa' },
              { v:toFa(COACHES.reduce((a,c)=>a+c.sessions,0)),    l:'جلسه برگزار شده',c:'#06b6d4' },
            ].map((s,i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:s.c, letterSpacing:'-0.03em', textShadow:`0 0 16px ${s.c}30` }}>{s.v}</div>
                <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)', marginTop:'2px' }}>{s.l}</div>
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px 24px' }}>
              <div style={{ fontSize:'48px', opacity:0.15, marginBottom:'14px' }}>🎱</div>
              <h3 style={{ fontSize:'18px', fontWeight:800, color:'#f0faf5', margin:'0 0 8px' }}>مربیی یافت نشد</h3>
              <button onClick={()=>{setSearch('');setCity('همه شهرها');setSpecs([]);setTypes([]);setOnlyFed(false);setOnlyOnline(false);}} style={{ padding:'11px 24px', background:'linear-gradient(135deg,#10b981,#059669)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginTop:'16px' }}>
                پاک کردن فیلترها
              </button>
            </div>
          ) : (
            <div className="coaches-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
              {filtered.map((c,i) => (
                <div key={c.id} style={{ animation:`fadeUp 0.5s ease ${i*0.07}s both` }}>
                  <CoachCard coach={c}/>
                </div>
              ))}
            </div>
          )}

          {/* Become a coach CTA */}
          <div style={{ marginTop:'56px', padding:'40px 36px', background:'rgba(167,139,250,0.03)', border:'1px dashed rgba(167,139,250,0.2)', borderRadius:'24px', textAlign:'center' }}>
            <div style={{ fontSize:'10px', color:'rgba(167,139,250,0.5)', letterSpacing:'0.22em', fontWeight:700, marginBottom:'12px' }}>BECOME A COACH</div>
            <h3 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#f0faf5', margin:'0 0 10px', letterSpacing:'-0.025em' }}>مربی شوید</h3>
            <p style={{ fontSize:'14px', color:'rgba(240,250,245,0.35)', margin:'0 0 24px', maxWidth:'400px', marginLeft:'auto', marginRight:'auto' }}>
              دانش و تجربه خود را با هزاران بازیکن در سراسر ایران به اشتراک بگذارید
            </p>
            <Link href="/coaches/register" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'13px 28px', background:'linear-gradient(135deg,#a78bfa,#7c3aed)', borderRadius:'13px', color:'#fff', fontSize:'14px', fontWeight:700, textDecoration:'none', boxShadow:'0 8px 24px rgba(167,139,250,0.25)' }}>
              ثبت‌نام به عنوان مربی ←
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}