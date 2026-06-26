'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search, Star, MapPin, Check, Shield,
  X, Clock, Award, Users, Camera, ChevronRight,
  Zap, Wrench, Settings,
} from 'lucide-react';

/* ══ types ══ */
interface Provider {
  id: string; name: string; title: string; city: string;
  speciality: string[]; experience: number;
  rating: number; reviewCount: number; jobs: number;
  avatar: string; avatarColor: string; coverImg: string;
  isVerified: boolean; isCertified: boolean; isOnline: boolean;
  bio: string; responseTime: string; warranty: string;
  priceFrom: number; certifications: string[];
  serviceTypes: string[]; brands: string[];
  beforeAfter: { before: string; after: string; title: string }[];
}

/* ══ data ══ */
const SERVICE_TYPES = [
  { key:'all',         label:'همه خدمات',       icon:'🛠️', color:'#C7A66A', count:48  },
  { key:'install',     label:'نصب میز',          icon:'🔧', color:'#06b6d4', count:18  },
  { key:'cloth',       label:'تعویض کلاث',       icon:'🟢', color:'#C7A66A', count:24  },
  { key:'maintenance', label:'تعمیر و نگهداری',  icon:'⚙️', color:'#f59e0b', count:31  },
  { key:'lighting',    label:'نورپردازی',        icon:'💡', color:'#fbbf24', count:12  },
  { key:'consulting',  label:'مشاوره تجهیز',     icon:'📋', color:'#a78bfa', count:9   },
];

const PROVIDERS: Provider[] = [
  {
    id:'s1', name:'مهدی کرمی', title:'متخصص ارشد نصب و کلاث‌کشی',
    city:'تهران', speciality:['کلاث‌کشی','نصب میز','تراز'],
    experience:14, rating:4.9, reviewCount:183, jobs:420,
    avatar:'م', avatarColor:'#C7A66A', coverImg:'/images/billiadr-club-1.jpg',
    isVerified:true, isCertified:true, isOnline:true,
    bio:'با ۱۴ سال تجربه در نصب و کلاث‌کشی میزهای اسنوکر و پاکت. تخصص اصلی: کلاث Strachan و Hainsworth با ضمانت ۲ ساله.',
    responseTime:'زیر ۲ ساعت', warranty:'۲۴ ماه',
    priceFrom:850000, certifications:['Riley Certified Installer','Strachan Approved','نصاب رسمی ویراکا'],
    serviceTypes:['install','cloth','maintenance'],
    brands:['Riley','Viraka','Aramith','Strachan'],
    beforeAfter:[
      { before:'/images/billiadr-club-3.jpg', after:'/images/billiadr-club-1.jpg', title:'کلاث‌کشی اسنوکر VIP' },
    ],
  },
  {
    id:'s2', name:'حسن میرزایی', title:'متخصص تعمیر و نگهداری',
    city:'مشهد', speciality:['تعمیر ساختار','تراز دقیق','لاستیک‌کشی'],
    experience:9, rating:4.7, reviewCount:94, jobs:280,
    avatar:'ح', avatarColor:'#f59e0b', coverImg:'/images/billiadr-club-3.jpg',
    isVerified:true, isCertified:true, isOnline:false,
    bio:'متخصص تعمیر سازه میزهای قدیمی و نوسازی تجهیزات باشگاه. بازسازی کامل میز در ۲۴ ساعت.',
    responseTime:'زیر ۴ ساعت', warranty:'۱۲ ماه',
    priceFrom:600000, certifications:['Brunswick Certified Tech','Certified Cushion Specialist'],
    serviceTypes:['maintenance','cloth','install'],
    brands:['Brunswick','Riley','BCE'],
    beforeAfter:[],
  },
  {
    id:'s3', name:'علیرضا صادقی', title:'طراح و مجری نورپردازی باشگاه',
    city:'تهران', speciality:['نورپردازی LED','طراحی باشگاه','مشاوره تجهیز'],
    experience:11, rating:4.8, reviewCount:67, jobs:145,
    avatar:'ع', avatarColor:'#a78bfa', coverImg:'/images/billiadr-club-1.jpg',
    isVerified:true, isCertified:false, isOnline:true,
    bio:'طراحی و اجرای سیستم‌های نورپردازی حرفه‌ای برای باشگاه‌های بیلیارد با استانداردهای بین‌المللی.',
    responseTime:'زیر ۶ ساعت', warranty:'۱۸ ماه',
    priceFrom:1200000, certifications:['Lighting Design Certificate','WPBSA Lighting Standard'],
    serviceTypes:['lighting','consulting'],
    brands:['Osram','Philips Pro','Viraka'],
    beforeAfter:[],
  },
  {
    id:'s4', name:'رضا فرهانی', title:'نصاب تخصصی پاکت بیلیارد',
    city:'اصفهان', speciality:['پاکت بیلیارد','تعویض جیب','تنظیم'],
    experience:7, rating:4.6, reviewCount:52, jobs:190,
    avatar:'ر', avatarColor:'#06b6d4', coverImg:'/images/billiadr-club-3.jpg',
    isVerified:true, isCertified:true, isOnline:true,
    bio:'متخصص نصب و تنظیم میزهای پاکت بیلیارد. خدمات در محل باشگاه با کمترین توقف عملیاتی.',
    responseTime:'زیر ۳ ساعت', warranty:'۱۵ ماه',
    priceFrom:500000, certifications:['BCA Certified Technician','Pool Table Pro'],
    serviceTypes:['install','cloth','maintenance'],
    brands:['Diamond','Brunswick','Predator'],
    beforeAfter:[],
  },
  {
    id:'s5', name:'نادر قاسمی', title:'مشاور تجهیز و راه‌اندازی باشگاه',
    city:'شیراز', speciality:['مشاوره','طراحی فضا','تهیه تجهیزات'],
    experience:16, rating:5.0, reviewCount:38, jobs:62,
    avatar:'ن', avatarColor:'#ef4444', coverImg:'/images/billiadr-club-1.jpg',
    isVerified:true, isCertified:true, isOnline:false,
    bio:'مشاوره کامل راه‌اندازی باشگاه‌های بیلیارد از صفر تا صد. طراحی فضا، انتخاب تجهیزات، و آموزش پرسنل.',
    responseTime:'زیر ۱ روز', warranty:'مشاوره دائم',
    priceFrom:2500000, certifications:['Club Setup Consultant','WPBSA Associate'],
    serviceTypes:['consulting'],
    brands:['Viraka','Riley','Aramith'],
    beforeAfter:[],
  },
  {
    id:'s6', name:'امیر حیدری', title:'متخصص کلاث و تراز اسنوکر',
    city:'تبریز', speciality:['کلاث Hainsworth','تراز لیزری','اسنوکر'],
    experience:10, rating:4.8, reviewCount:71, jobs:310,
    avatar:'ا', avatarColor:'#C7A66A', coverImg:'/images/billiadr-club-3.jpg',
    isVerified:true, isCertified:true, isOnline:true,
    bio:'تخصص در کلاث‌کشی میزهای اسنوکر با پارچه Hainsworth 777 و تراز لیزری دقیق.',
    responseTime:'زیر ۳ ساعت', warranty:'۲۰ ماه',
    priceFrom:750000, certifications:['Hainsworth Approved Fitter','Riley Snooker Specialist'],
    serviceTypes:['cloth','install'],
    brands:['Hainsworth','Riley','BCE'],
    beforeAfter:[],
  },
];

function toFa(v: string|number){ return String(v).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d))); }

/* ══ Provider Card ══ */
function ProviderCard({ p }: { p: Provider }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/services/${p.id}`} style={{ textDecoration:'none', display:'block', height:'100%' }}>
      <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{ background: hov?'rgba(255,255,255,0.055)':'rgba(255,255,255,0.028)', border:`1px solid ${hov?`${p.avatarColor}28`:'rgba(0,0,0,0.07)'}`, borderRadius:'22px', overflow:'hidden', transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)', transform: hov?'translateY(-7px)':'none', boxShadow: hov?`0 24px 60px rgba(0,0,0,0.5),0 0 0 1px ${p.avatarColor}08`:'0 4px 20px rgba(0,0,0,0.25)', height:'100%', display:'flex', flexDirection:'column' }}>

        {/* Cover */}
        <div style={{ height:'160px', position:'relative', overflow:'hidden', flexShrink:0 }}>
          <img src={p.coverImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.2) saturate(0.5)', transition:'transform 0.6s', transform: hov?'scale(1.07)':'scale(1)' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${p.avatarColor}15,transparent 60%)` }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 35%,rgba(6,13,10,0.88) 100%)' }}/>

          {/* Badges */}
          <div style={{ position:'absolute', top:'12px', right:'12px', display:'flex', flexDirection:'column', gap:'5px' }}>
            {p.isCertified && <div style={{ display:'flex', alignItems:'center', gap:'3px', background:'rgba(245,158,11,0.85)', backdropFilter:'blur(6px)', borderRadius:'20px', padding:'3px 9px', fontSize: '10px', color:'#fff', fontWeight:700 }}><Award size={8}/>تأییدشده</div>}
            {p.isOnline && <div style={{ display:'flex', alignItems:'center', gap:'3px', background:'rgba(199,166,106,0.15)', backdropFilter:'blur(6px)', border:'1px solid rgba(199,166,106,0.3)', borderRadius:'20px', padding:'3px 9px', fontSize: '10px', color:'#C7A66A', fontWeight:700 }}><span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#C7A66A', display:'inline-block', animation:'pulse 2s infinite' }}/>آنلاین</div>}
          </div>

          {/* City */}
          <div style={{ position:'absolute', bottom:'12px', right:'12px', display:'flex', alignItems:'center', gap:'4px', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', borderRadius:'20px', padding:'4px 11px', fontSize: '12px', color:'rgba(255,255,255,0.8)' }}>
            <MapPin size={9} style={{ color:p.avatarColor }}/>{p.city}
          </div>
        </div>

        {/* Avatar strip */}
        <div style={{ padding:'0 18px', marginTop:'-22px', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div style={{ width:'50px', height:'50px', borderRadius:'14px', background:`linear-gradient(135deg,${p.avatarColor},${p.avatarColor}80)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: '22px', fontWeight:900, color:'#fff', border:'3px solid rgba(6,13,10,0.98)', boxShadow:`0 6px 18px ${p.avatarColor}40` }}>
            {p.avatar}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'20px', padding:'4px 10px', marginBottom:'4px' }}>
            <Star size={11} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>
            <span style={{ fontSize: '14px', fontWeight:800, color:'#f59e0b' }}>{p.rating}</span>
            <span style={{ fontSize: '11px', color:'rgba(0,0,0,0.35)' }}>({toFa(p.reviewCount)})</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:'10px 18px 0', flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'3px' }}>
            <h3 style={{ fontSize: '17px', fontWeight:900, color: '#111111', margin:0, letterSpacing:'-0.015em' }}>{p.name}</h3>
            {p.isVerified && <Check size={12} style={{ color:p.avatarColor, flexShrink:0 }}/>}
          </div>
          <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.45)', marginBottom:'10px' }}>{p.title}</div>

          {/* Speciality */}
          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'12px' }}>
            {p.speciality.slice(0,3).map(s => (
              <span key={s} style={{ fontSize: '10px', color:p.avatarColor, background:`${p.avatarColor}10`, border:`1px solid ${p.avatarColor}20`, borderRadius:'20px', padding:'2px 8px', fontWeight:700 }}>{s}</span>
            ))}
          </div>

          {/* Quick info */}
          <div style={{ display:'flex', gap:'12px', marginBottom:'12px', fontSize: '12px', color:'rgba(0,0,0,0.42)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Clock size={10} style={{ color:'#C7A66A' }}/>{p.responseTime}</span>
            <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Shield size={10} style={{ color:'#06b6d4' }}/>{p.warranty}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 18px 16px', marginTop:'auto', borderTop:'1px solid rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize: '10px', color:'rgba(0,0,0,0.35)', marginBottom:'2px' }}>از</div>
              <div style={{ fontSize: '17px', fontWeight:900, color:p.avatarColor, letterSpacing:'-0.02em' }}>
                {toFa(p.priceFrom.toLocaleString())} <span style={{ fontSize: '10px', opacity:0.7 }}>تومان</span>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize: '12px', color:'rgba(0,0,0,0.40)' }}>
              <Wrench size={11} style={{ color:'rgba(0,0,0,0.30)' }}/>{toFa(p.jobs)} پروژه
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ══ MAIN ══ */
export default function ServicesPage() {
  const [search,    setSearch]    = useState('');
  const [service,   setService]   = useState('all');
  const [city,      setCity]      = useState('همه شهرها');
  const [sortBy,    setSortBy]    = useState('rating');
  const [sfocus,    setSfocus]    = useState(false);

  const cities = ['همه شهرها','تهران','مشهد','اصفهان','شیراز','تبریز'];

  const filtered = PROVIDERS.filter(p => {
    if (search && !p.name.includes(search) && !p.city.includes(search) && !p.speciality.some(s=>s.includes(search))) return false;
    if (city !== 'همه شهرها' && p.city !== city) return false;
    if (service !== 'all' && !p.serviceTypes.includes(service)) return false;
    return true;
  }).sort((a,b) => {
    if (sortBy==='rating')     return b.rating-a.rating;
    if (sortBy==='experience') return b.experience-a.experience;
    if (sortBy==='jobs')       return b.jobs-a.jobs;
    if (sortBy==='price')      return a.priceFrom-b.priceFrom;
    return 0;
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;} }
        @keyframes pulse   { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes ambient { 0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-14px);} }
        .s-bar { display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.04); border:1.5px solid rgba(0,0,0,0.06); border-radius:14px; padding:0 16px; height:50px; transition:all 0.3s; }
        .s-bar.focus { border-color:rgba(199,166,106,0.4); box-shadow:0 0 0 3px rgba(199,166,106,0.08); }
        .s-inp { flex:1; background:transparent; border:none; outline:none; color:#f0faf5; font-size:14px; font-family:inherit; }
        .s-inp::placeholder { color:rgba(0,0,0,0.32); }
        .pill { padding:7px 16px; border-radius:20px; font-size:12px; font-weight:600; border:1px solid; cursor:pointer; font-family:inherit; white-space:nowrap; transition:all 0.2s; }
        .pill.active { background:rgba(199,166,106,0.12); border-color:rgba(199,166,106,0.35); color:#C7A66A; }
        .pill:not(.active) { background:rgba(0,0,0,0.03); border-color:rgba(0,0,0,0.07); color:rgba(0,0,0,0.45); }
        .sort-sel { background:rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.06); border-radius:10px; padding:9px 14px; color:rgba(0,0,0,0.48); font-size:12px; font-family:inherit; outline:none; cursor:pointer; }
        @media(max-width:900px) { .svc-grid{grid-template-columns:repeat(2,1fr)!important;} }
        @media(max-width:560px) { .svc-grid{grid-template-columns:1fr!important;} .svc-types{grid-template-columns:repeat(3,1fr)!important;} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#F7F7F5', paddingBottom:'80px' }}>

        {/* ══ HERO ══ */}
        <div style={{ position:'relative', background:'rgba(2,8,6,0.98)', borderBottom:'1px solid rgba(0,0,0,0.04)', padding:'clamp(32px,5vw,56px) clamp(16px,4vw,48px) 0', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-20%', right:'-5%', width:'45vw', height:'45vw', maxWidth:'500px', borderRadius:'50%', background:'radial-gradient(rgba(245,158,11,0.06),transparent 65%)', filter:'blur(40px)', animation:'ambient 14s ease-in-out infinite', pointerEvents:'none' }}/>

          <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(245,158,11,0.35)', fontSize: '22px' }}>
                🔧
              </div>
              <div>
                <div style={{ fontSize: '10px', color:'rgba(245,158,11,0.65)', letterSpacing:'0.25em', fontWeight:700 }}>TECHNICAL SERVICES</div>
                <h1 style={{ fontSize: 'clamp(26px, 5vw, 48px)', fontWeight:900, color: '#111111', margin:0, letterSpacing:'-0.03em', lineHeight:1.1 }}>خدمات فنی تخصصی</h1>
              </div>
            </div>
            <p style={{ fontSize: '17px', color:'rgba(0,0,0,0.42)', margin:'0 0 28px', maxWidth:'460px' }}>
              نصب، تعمیر، کلاث‌کشی و نگهداری حرفه‌ای تجهیزات بیلیارد
            </p>

            {/* Service type cards */}
            <div className="svc-types" style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'10px', paddingBottom:'24px' }}>
              {SERVICE_TYPES.map(s => (
                <button key={s.key} onClick={()=>setService(s.key)}
                  style={{ padding:'14px 10px', borderRadius:'16px', background: service===s.key?`${s.color}10`:'#FFFFFF', border:`1px solid ${service===s.key?`${s.color}35`:'rgba(0,0,0,0.07)'}`, cursor:'pointer', fontFamily:'inherit', textAlign:'center', transition:'all 0.3s', boxShadow: service===s.key?`0 4px 16px ${s.color}15`:'none' }}>
                  <div style={{ fontSize: '24px', marginBottom:'6px' }}>{s.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight:700, color: service===s.key?s.color:'rgba(0,0,0,0.45)', lineHeight:1.3 }}>{s.label}</div>
                  <div style={{ fontSize: '10px', color:'rgba(0,0,0,0.30)', marginTop:'3px' }}>{toFa(s.count)} متخصص</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ TOOLBAR ══ */}
        <div style={{ background:'rgba(2,8,6,0.97)', borderBottom:'1px solid rgba(0,0,0,0.04)', padding:'12px clamp(16px,4vw,48px)', position:'sticky', top:'62px', zIndex:90, backdropFilter:'blur(24px)' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
            <div className={`s-bar ${sfocus?'focus':''}`} style={{ flex:1, minWidth:'200px', maxWidth:'360px' }}>
              <Search size={15} style={{ color:'rgba(0,0,0,0.30)', flexShrink:0 }}/>
              <input className="s-inp" value={search} onChange={e=>setSearch(e.target.value)}
                onFocus={()=>setSfocus(true)} onBlur={()=>setSfocus(false)}
                placeholder="جستجو متخصص، تخصص، شهر..."/>
              {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(0,0,0,0.35)', padding:0, display:'flex' }}><X size={13}/></button>}
            </div>
            <div style={{ display:'flex', gap:'7px', overflowX:'auto' }}>
              {cities.map(c => (
                <button key={c} className={`pill ${city===c?'active':''}`} onClick={()=>setCity(c)}>{c}</button>
              ))}
            </div>
            <select className="sort-sel" value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ marginRight:'auto' }}>
              <option value="rating">بهترین امتیاز</option>
              <option value="experience">بیشترین تجربه</option>
              <option value="jobs">بیشترین پروژه</option>
              <option value="price">ارزان‌ترین</option>
            </select>
            <div style={{ fontSize: '13px', color:'rgba(0,0,0,0.40)', whiteSpace:'nowrap' }}>{toFa(filtered.length)} متخصص</div>
          </div>
        </div>

        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* Stats bar */}
          <div style={{ display:'flex', gap:'32px', marginBottom:'36px', flexWrap:'wrap' }}>
            {[
              { v:toFa(PROVIDERS.length),                               l:'متخصص فعال',   c:'#f59e0b' },
              { v:toFa(PROVIDERS.filter(p=>p.isCertified).length),     l:'دارای گواهی',  c:'#C7A66A' },
              { v:toFa(PROVIDERS.reduce((a,p)=>a+p.jobs,0)),           l:'پروژه انجام',  c:'#a78bfa' },
              { v:toFa(PROVIDERS.reduce((a,p)=>a+p.reviewCount,0)),    l:'نظر مشتری',    c:'#06b6d4' },
            ].map((s,i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize: 'clamp(22px, 3.3vw, 31px)', fontWeight:900, color:s.c, letterSpacing:'-0.03em', textShadow:`0 0 20px ${s.c}30` }}>{s.v}</div>
                <div style={{ fontSize: '11px', color:'rgba(0,0,0,0.35)', marginTop:'2px' }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(0,0,0,0.05)', borderRadius:'22px', padding:'clamp(20px,3vw,30px)', marginBottom:'36px', overflow:'hidden', position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'200px', height:'1px', background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.4),transparent)' }}/>
            <div style={{ fontSize: '10px', color:'rgba(245,158,11,0.5)', letterSpacing:'0.22em', fontWeight:700, marginBottom:'16px', textAlign:'center' }}>HOW IT WORKS</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'20px' }}>
              {[
                { n:'۱', icon:'🔍', title:'انتخاب متخصص',    desc:'متخصص مناسب با توجه به شهر و نوع خدمت انتخاب کنید' },
                { n:'۲', icon:'📅', title:'درخواست خدمت',    desc:'زمان مناسب را انتخاب کنید و درخواست ارسال کنید' },
                { n:'۳', icon:'🔧', title:'اجرای پروژه',     desc:'متخصص در محل شما حاضر شده کار را انجام می‌دهد' },
                { n:'۴', icon:'✅', title:'تأیید و ضمانت',   desc:'پس از تأیید شما، پرداخت انجام و ضمانت فعال می‌شود' },
              ].map((s,i) => (
                <div key={i} style={{ textAlign:'center' }}>
                  <div style={{ fontSize: '31px', marginBottom:'8px' }}>{s.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight:700, color: '#111111', marginBottom:'5px' }}>{s.title}</div>
                  <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.42)', lineHeight:1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid */}
          {filtered.length===0 ? (
            <div style={{ textAlign:'center', padding:'80px 24px' }}>
              <div style={{ fontSize: '53px', opacity:0.12, marginBottom:'14px' }}>🔧</div>
              <h3 style={{ fontSize: '20px', fontWeight:800, color: '#111111', margin:'0 0 8px' }}>متخصصی یافت نشد</h3>
              <button onClick={()=>{setSearch('');setService('all');setCity('همه شهرها');}} style={{ padding:'11px 24px', background:'linear-gradient(135deg,#f59e0b,#d97706)', border:'none', borderRadius:'12px', color:'#fff', fontSize: '14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginTop:'14px' }}>
                پاک کردن فیلترها
              </button>
            </div>
          ) : (
            <div className="svc-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
              {filtered.map((p,i) => (
                <div key={p.id} style={{ animation:`fadeUp 0.5s ease ${i*0.07}s both` }}>
                  <ProviderCard p={p}/>
                </div>
              ))}
            </div>
          )}

          {/* Register CTA */}
          <div style={{ marginTop:'56px', padding:'40px 36px', background:'rgba(245,158,11,0.03)', border:'1px dashed rgba(245,158,11,0.18)', borderRadius:'24px', textAlign:'center' }}>
            <div style={{ fontSize: '11px', color:'rgba(245,158,11,0.5)', letterSpacing:'0.22em', fontWeight:700, marginBottom:'12px' }}>JOIN AS TECHNICIAN</div>
            <h3 style={{ fontSize: 'clamp(20px, 3.3vw, 29px)', fontWeight:900, color: '#111111', margin:'0 0 10px', letterSpacing:'-0.025em' }}>متخصص شوید</h3>
            <p style={{ fontSize: '15px', color:'rgba(0,0,0,0.40)', margin:'0 0 22px', maxWidth:'380px', marginLeft:'auto', marginRight:'auto' }}>
              تخصص فنی خود را به درآمد تبدیل کنید. به صدها باشگاه در سراسر ایران خدمات ارائه دهید
            </p>
            <Link href="/services/register" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'12px 28px', background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:'13px', color:'#fff', fontSize: '15px', fontWeight:700, textDecoration:'none', boxShadow:'0 8px 22px rgba(245,158,11,0.28)' }}>
              ثبت‌نام متخصص ←
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}