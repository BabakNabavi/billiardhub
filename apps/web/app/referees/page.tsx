'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── Tokens (light glassmorphism) ──────────────────────────────
const GOLD    = '#C7A66A'
const GOLD_D  = '#A07840'
const TEXT    = '#1C1C1A'
const TEXT_S  = 'rgba(28,28,26,0.52)'
const TEXT_M  = 'rgba(28,28,26,0.32)'
const LQ_BG   = 'rgba(255,255,255,0.82)'
const LQ_BOR  = '1px solid rgba(255,255,255,0.85)'
const LQ_SHAD = 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)'

const SPECS: Record<string,{label:string;color:string;bg:string}> = {
  snooker:  {label:'اسنوکر',       color:'#7C3AED',bg:'rgba(124,58,237,0.10)'},
  pocket:   {label:'پاکت بیلیارد', color:GOLD,     bg:'rgba(199,166,106,0.12)'},
  highball: {label:'هی‌بال',        color:'#F59E0B', bg:'rgba(245,158,11,0.10)'},
  carom:    {label:'کارامبول',      color:'#16A34A', bg:'rgba(22,163,74,0.10)'},
}

const LEVELS: Record<string,{label:string;color:string;bg:string}> = {
  international: {label:'داور بین‌المللی',color:'#7C3AED',bg:'rgba(124,58,237,0.10)'},
  national:      {label:'داور ملی',       color:GOLD,     bg:'rgba(199,166,106,0.12)'},
  grade1:        {label:'داور درجه یک',   color:'#2563EB', bg:'rgba(37,99,235,0.10)'},
}

const AVATAR_GRAD: [string,string][] = [
  [GOLD,'#A07840'],['#7C3AED','#5B21B6'],['#2563EB','#1D4ED8'],
  ['#B8936B','#8B6B3D'],['#16A34A','#15803D'],['#DC2626','#B91C1C'],
]
const getGrad = (id:string):[string,string] =>
  AVATAR_GRAD[parseInt(id,10)%AVATAR_GRAD.length] ?? [GOLD,GOLD_D]

const fmt = (n:number) => n.toLocaleString('fa-IR')

// ── Types ──────────────────────────────────────────────────────
interface Referee {
  id:string; name:string; specialty:string; level:string; city:string
  experience:number; rating:number; reviewCount:number
  matchesRefereed:number; internationalMatches:number
  badge:string; badgeColor:string; verified:boolean
  hasStory:boolean; storyImage:string; bio:string
}

// ── Mock data ──────────────────────────────────────────────────
const REFEREES: Referee[] = [
  {
    id:'1', name:'کاوه طالبی', specialty:'snooker', level:'international', city:'تهران',
    experience:20, rating:4.9, reviewCount:284, matchesRefereed:180, internationalMatches:45,
    badge:'داور بین‌المللی', badgeColor:'#7C3AED', verified:true,
    hasStory:true, storyImage:'/images/shop/snooker-table.jpg',
    bio:'داور بین‌المللی WPBSA با ۲۰ سال سابقه در رویدادهای جهانی اسنوکر — داوری ۴۵ مسابقه بین‌المللی',
  },
  {
    id:'2', name:'نیلوفر حسینی', specialty:'pocket', level:'national', city:'مشهد',
    experience:12, rating:4.7, reviewCount:156, matchesRefereed:95, internationalMatches:0,
    badge:'داور ملی', badgeColor:GOLD, verified:true,
    hasStory:true, storyImage:'/images/shop/cue_billiard_2.jpg',
    bio:'اولین داور زن ملی پاکت بیلیارد ایران — مدرس کمیته داوری فدراسیون',
  },
  {
    id:'3', name:'حسن جعفری', specialty:'carom', level:'international', city:'اصفهان',
    experience:15, rating:4.8, reviewCount:198, matchesRefereed:130, internationalMatches:28,
    badge:'داور بین‌المللی', badgeColor:'#7C3AED', verified:true,
    hasStory:false, storyImage:'',
    bio:'داور بین‌المللی کارامبول UMB با حضور در رویدادهای قاره‌ای آسیا و اروپا',
  },
  {
    id:'4', name:'سارا رضوی', specialty:'snooker', level:'grade1', city:'تهران',
    experience:6, rating:4.5, reviewCount:62, matchesRefereed:42, internationalMatches:0,
    badge:'داور درجه یک', badgeColor:'#2563EB', verified:true,
    hasStory:true, storyImage:'/images/shop/Ball-1.jpg',
    bio:'داور جوان درجه‌یک اسنوکر — قهرمان داوری لیگ برتر ۱۴۰۲',
  },
  {
    id:'5', name:'امیر کریمی', specialty:'highball', level:'national', city:'تبریز',
    experience:10, rating:4.6, reviewCount:88, matchesRefereed:75, internationalMatches:8,
    badge:'داور ملی', badgeColor:GOLD, verified:true,
    hasStory:false, storyImage:'',
    bio:'داور ملی هی‌بال — مسئول تکنیکی داوری استان آذربایجان‌شرقی',
  },
  {
    id:'6', name:'مهرداد جوادی', specialty:'pocket', level:'grade1', city:'شیراز',
    experience:5, rating:4.4, reviewCount:43, matchesRefereed:35, internationalMatches:0,
    badge:'داور درجه یک', badgeColor:'#2563EB', verified:false,
    hasStory:true, storyImage:'/images/shop/pool_chalk_1.jpg',
    bio:'داور جوان و مستعد پاکت بیلیارد — دانش‌آموخته کمیته داوری استان فارس',
  },
]

const CITIES = ['همه', ...Array.from(new Set(REFEREES.map(r => r.city)))]

// ── Sub-components ─────────────────────────────────────────────
function Avatar({ id, name, size, ring, onClick }: {
  id:string; name:string; size:number; ring?:boolean; onClick?:()=>void
}) {
  const [c1,c2] = getGrad(id)
  const circle = (
    <div style={{ width:size,height:size,borderRadius:'50%',background:`linear-gradient(135deg,${c1},${c2})`,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:size*0.38,fontWeight:900,color:'#fff',flexShrink:0,userSelect:'none' }}>
      {name.charAt(0)}
    </div>
  )
  if (!ring) return <div onClick={onClick} style={{ cursor:onClick?'pointer':'default',flexShrink:0 }}>{circle}</div>
  return (
    <div onClick={onClick} style={{ cursor:onClick?'pointer':'default',flexShrink:0,
      width:size+8,height:size+8,borderRadius:'50%',
      background:`linear-gradient(135deg,${GOLD},#FFE88A,${GOLD_D})`,
      padding:4,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ width:size,height:size,borderRadius:'50%',background:'rgba(4,4,3,0.35)',
        padding:2,display:'flex',alignItems:'center',justifyContent:'center' }}>
        {circle}
      </div>
    </div>
  )
}

function Stars({ rating, size=12 }:{ rating:number; size?:number }) {
  return (
    <div style={{ display:'flex',gap:2 }}>
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i<=Math.floor(rating)?'#F59E0B':'none'}
          stroke={i<=Math.floor(rating)?'none':'rgba(245,158,11,0.35)'} strokeWidth={1.5}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

function StoryModal({ referee, onClose }:{ referee:Referee; onClose:()=>void }) {
  const [progress, setProgress] = useState(0)
  const [c1,c2] = getGrad(referee.id)
  const sp = SPECS[referee.specialty]
  useEffect(()=>{
    let p=0; const id=setInterval(()=>{ p+=2; setProgress(p); if(p>=100){clearInterval(id);setTimeout(onClose,200)} },100)
    return ()=>clearInterval(id)
  },[referee.id,onClose])
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',fn); return ()=>window.removeEventListener('keydown',fn)
  },[onClose])
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.93)',backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn 0.2s ease both' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'min(420px,92vw)',height:'min(745px,90vh)',borderRadius:24,overflow:'hidden',position:'relative',background:referee.storyImage?'transparent':`linear-gradient(160deg,${c1},${c2})`,boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
        {referee.storyImage&&<div style={{ position:'absolute',inset:0,backgroundImage:`url(${referee.storyImage})`,backgroundSize:'cover',backgroundPosition:'center' }}><div style={{ position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,0.52) 0%,rgba(0,0,0,0.08) 40%,rgba(0,0,0,0.62) 100%)' }}/></div>}
        <div style={{ position:'absolute',top:16,left:16,right:16,height:3,background:'rgba(255,255,255,0.22)',borderRadius:4,overflow:'hidden',zIndex:10 }}>
          <div style={{ height:'100%',width:`${progress}%`,background:'#fff',borderRadius:4,transition:'width 0.08s linear' }}/>
        </div>
        <div style={{ position:'absolute',top:30,left:0,right:0,padding:'0 16px',display:'flex',alignItems:'center',gap:10,zIndex:10 }}>
          <Avatar id={referee.id} name={referee.name} size={40} ring/>
          <div>
            <div style={{ fontSize:14,fontWeight:800,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,0.5)' }}>{referee.name}</div>
            {sp&&<div style={{ fontSize:11,color:'rgba(255,255,255,0.70)',fontWeight:600 }}>{sp.label}</div>}
          </div>
          <button onClick={onClose} style={{ marginRight:'auto',width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,0.38)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.18)',color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
        </div>
        <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'40px 20px 28px',background:'linear-gradient(to top,rgba(0,0,0,0.65),transparent)',zIndex:10 }}>
          <p style={{ fontSize:15,color:'#fff',margin:0,lineHeight:1.75,fontWeight:500 }}>{referee.bio}</p>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  Main Page
// ════════════════════════════════════════════════════════════
export default function RefereesPage() {
  const [filterSpec,  setFilterSpec]  = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterCity,  setFilterCity]  = useState('همه')
  const [sortBy,      setSortBy]      = useState('experience')
  const [activeStory, setActiveStory] = useState<Referee|null>(null)
  const [hoveredId,   setHoveredId]   = useState<string|null>(null)
  const [scrollY,     setScrollY]     = useState(0)
  const [typeText,    setTypeText]    = useState('')
  const [cursorOn,    setCursorOn]    = useState(true)

  const FULL = 'داوران بین‌المللی بیلیارد ایران'

  useEffect(()=>{
    const fn=()=>setScrollY(window.scrollY)
    window.addEventListener('scroll',fn,{passive:true})
    return ()=>window.removeEventListener('scroll',fn)
  },[])

  useEffect(()=>{
    let i=0
    const tid=setInterval(()=>{ i++; setTypeText(FULL.slice(0,i)); if(i>=FULL.length) clearInterval(tid) },75)
    return ()=>clearInterval(tid)
  },[])

  useEffect(()=>{
    const bid=setInterval(()=>setCursorOn(c=>!c),530)
    return ()=>clearInterval(bid)
  },[])

  const filtered = REFEREES
    .filter(r => filterSpec==='all' || r.specialty===filterSpec)
    .filter(r => filterLevel==='all' || r.level===filterLevel)
    .filter(r => filterCity==='همه' || r.city===filterCity)
    .sort((a,b) => {
      if(sortBy==='matches')       return b.matchesRefereed - a.matchesRefereed
      if(sortBy==='international') return b.internationalMatches - a.internationalMatches
      return b.experience - a.experience
    })

  const featured = filtered[0]
  const rest     = filtered.slice(1)

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        * { box-sizing:border-box; }
        .ref-card { transition:transform 0.28s cubic-bezier(0.22,1,0.36,1),box-shadow 0.28s ease; }
        .ref-card:hover { transform:translateY(-5px); box-shadow:0 22px 52px rgba(0,0,0,0.11)!important; }
        @media(max-width:900px) { .ref-grid{grid-template-columns:repeat(2,1fr)!important;} .feat-flex{flex-direction:column!important;} .feat-side{width:100%!important;min-height:200px;} }
        @media(max-width:560px) { .ref-grid{grid-template-columns:1fr!important;} }
      `}</style>

      {/* ═══ HERO ══════════════════════════════════════════════ */}
      <section style={{ minHeight:'100vh',position:'relative',overflow:'hidden',display:'flex',alignItems:'center',direction:'rtl',fontFamily:'Vazirmatn,Tahoma,sans-serif' }}>
        <div style={{ position:'absolute',inset:'-10% 0',backgroundImage:"url('/images/shop/snooker-table.jpg')",backgroundSize:'cover',backgroundPosition:'center',transform:`translateY(${scrollY*0.32}px)` }}>
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(4,4,3,0.72) 0%,rgba(4,4,3,0.36) 45%,rgba(4,4,3,0.92) 100%)' }}/>
          <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse 65% 60% at 75% 45%,rgba(199,166,106,0.07) 0%,transparent 70%)' }}/>
        </div>
        <div style={{ position:'absolute',top:'18%',left:'8%',width:260,height:260,borderRadius:'50%',border:'1px solid rgba(199,166,106,0.12)',pointerEvents:'none',zIndex:1 }}/>
        <div style={{ position:'absolute',top:'22%',left:'11%',width:190,height:190,borderRadius:'50%',border:'1px solid rgba(199,166,106,0.07)',pointerEvents:'none',zIndex:1 }}/>

        <div style={{ position:'relative',zIndex:5,maxWidth:1100,margin:'0 auto',padding:'0 clamp(16px,4vw,48px)',width:'100%' }}>
          {/* eyebrow */}
          <div style={{ display:'inline-flex',alignItems:'center',gap:8,marginBottom:20,background:'rgba(199,166,106,0.10)',border:'1px solid rgba(199,166,106,0.22)',borderRadius:20,padding:'5px 14px',backdropFilter:'blur(12px)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill={GOLD}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span style={{ fontSize:11,fontWeight:700,color:GOLD,letterSpacing:'0.18em' }}>BILLIARD IRAN</span>
          </div>
          {/* typewriter */}
          <h1 style={{ fontSize:'clamp(26px,5vw,58px)',fontWeight:900,color:'#fff',margin:'0 0 16px',letterSpacing:'-0.025em',lineHeight:1.2,maxWidth:700,textShadow:'0 2px 16px rgba(0,0,0,0.4)' }}>
            {typeText}
            <span style={{ opacity:typeText.length>=FULL.length&&cursorOn?1:0,color:GOLD,transition:'opacity 0.1s' }}>|</span>
          </h1>
          {/* tagline */}
          <p style={{ fontSize:'clamp(13px,1.7vw,17px)',color:'rgba(255,255,255,0.55)',margin:'0 0 38px',fontWeight:500,maxWidth:460 }}>
            داوران رسمی و تأیید‌شده فدراسیون بیلیارد ایران
          </p>
          {/* stats strip */}
          <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
            {[
              {val:'۶',   label:'داور برتر',      icon:'🎱'},
              {val:'۲',   label:'بین‌المللی',      icon:'🌍'},
              {val:'۵۵۷', label:'مسابقه کل',       icon:'🏆'},
              {val:'۸۱',  label:'مسابقه خارجی',   icon:'✈️'},
            ].map((s,i)=>(
              <div key={i} style={{ background:'rgba(255,255,255,0.07)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,0.10)',borderRadius:14,padding:'12px 18px',animation:`fadeUp 0.5s ${i*0.08}s ease both`,minWidth:90 }}>
                <div style={{ fontSize:'clamp(20px,2.5vw,28px)',fontWeight:900,color:GOLD,lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:11.5,fontWeight:700,color:'rgba(255,255,255,0.65)',marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STORY STRIP ══════════════════════════════════════ */}
      {REFEREES.some(r=>r.hasStory) && (
        <div style={{ position:'sticky',top:0,zIndex:50,background:'rgba(247,247,245,0.93)',backdropFilter:'blur(28px)',WebkitBackdropFilter:'blur(28px)',borderBottom:'1px solid rgba(28,28,26,0.08)',boxShadow:'0 2px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ maxWidth:1100,margin:'0 auto',padding:'11px clamp(16px,4vw,48px)',overflowX:'auto',direction:'rtl',fontFamily:'Vazirmatn,Tahoma,sans-serif' }}>
            <div style={{ display:'flex',gap:18,width:'max-content' }}>
              {REFEREES.filter(r=>r.hasStory).map(r=>(
                <button key={r.id} onClick={()=>setActiveStory(r)}
                  style={{ background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:0 }}>
                  <Avatar id={r.id} name={r.name} size={48} ring/>
                  <span style={{ fontSize:10,fontWeight:700,color:TEXT_M,whiteSpace:'nowrap' }}>{r.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ FILTER BAR ═══════════════════════════════════════ */}
      <div style={{ background:'#F0EDE7',direction:'rtl',fontFamily:'Vazirmatn,Tahoma,sans-serif' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:'16px clamp(16px,4vw,48px)' }}>
          <div style={{ background:LQ_BG,backdropFilter:'blur(40px) saturate(200%)',WebkitBackdropFilter:'blur(40px) saturate(200%)',border:LQ_BOR,borderRadius:16,boxShadow:LQ_SHAD,padding:'12px 16px',display:'flex',gap:7,flexWrap:'wrap',alignItems:'center' }}>
            {/* specialty */}
            {[{k:'all',l:'همه'},{k:'snooker',l:'اسنوکر'},{k:'pocket',l:'پاکت'},{k:'highball',l:'هی‌بال'},{k:'carom',l:'کارامبول'}].map(({k,l})=>(
              <button key={k} onClick={()=>setFilterSpec(k)} style={{ padding:'6px 14px',borderRadius:20,border:'none',cursor:'pointer',fontFamily:'Vazirmatn,Tahoma,sans-serif',fontSize:12.5,fontWeight:700,transition:'all 0.18s',
                background: filterSpec===k ? `linear-gradient(135deg,${GOLD},${GOLD_D})` : 'rgba(255,255,255,0.78)',
                color:      filterSpec===k ? '#2a1e00' : TEXT_S,
                boxShadow:  filterSpec===k ? `inset 0 1.5px 0 rgba(255,255,255,0.30), 0 4px 14px rgba(199,166,106,0.28)` : LQ_SHAD }}>
                {l}
              </button>
            ))}
            <div style={{ width:1,height:16,background:'rgba(28,28,26,0.12)',margin:'0 1px' }}/>
            {/* level */}
            {[{k:'all',l:'همه سطوح'},{k:'international',l:'بین‌المللی'},{k:'national',l:'ملی'},{k:'grade1',l:'درجه یک'}].map(({k,l})=>(
              <button key={k} onClick={()=>setFilterLevel(k)} style={{ padding:'5px 12px',borderRadius:20,cursor:'pointer',fontFamily:'Vazirmatn,Tahoma,sans-serif',fontSize:12,fontWeight:700,transition:'all 0.18s',
                background:  filterLevel===k ? 'rgba(199,166,106,0.12)' : 'transparent',
                color:       filterLevel===k ? GOLD_D : TEXT_M,
                border:      filterLevel===k ? `1px solid rgba(199,166,106,0.35)` : '1px solid rgba(28,28,26,0.10)' }}>
                {l}
              </button>
            ))}
            <div style={{ width:1,height:16,background:'rgba(28,28,26,0.10)',margin:'0 1px' }}/>
            {/* city */}
            {CITIES.map(city=>(
              <button key={city} onClick={()=>setFilterCity(city)} style={{ padding:'5px 11px',borderRadius:20,cursor:'pointer',fontFamily:'Vazirmatn,Tahoma,sans-serif',fontSize:11.5,fontWeight:700,transition:'all 0.18s',
                background:  filterCity===city ? 'rgba(37,99,235,0.08)' : 'transparent',
                color:       filterCity===city ? '#2563EB' : TEXT_M,
                border:      filterCity===city ? `1px solid rgba(37,99,235,0.28)` : '1px solid rgba(28,28,26,0.08)' }}>
                {city}
              </button>
            ))}
            <div style={{ marginRight:'auto',display:'flex',gap:5 }}>
              {[{k:'experience',l:'بیشترین سابقه'},{k:'matches',l:'بیشترین مسابقه'},{k:'international',l:'بین‌المللی'}].map(({k,l})=>(
                <button key={k} onClick={()=>setSortBy(k)} style={{ padding:'5px 10px',borderRadius:14,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Vazirmatn,Tahoma,sans-serif',transition:'all 0.18s',
                  background: sortBy===k ? 'rgba(199,166,106,0.10)' : 'transparent',
                  color:      sortBy===k ? GOLD_D : TEXT_M,
                  border:     sortBy===k ? `1px solid rgba(199,166,106,0.32)` : '1px solid rgba(28,28,26,0.08)' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ══════════════════════════════════════════ */}
      <div style={{ background:'#F7F7F5',direction:'rtl',fontFamily:'Vazirmatn,Tahoma,sans-serif',paddingBottom:80 }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:'22px clamp(16px,4vw,48px)' }}>

          {/* FEATURED CARD */}
          {featured && (()=>{
            const sp  = SPECS[featured.specialty]
            const lv  = LEVELS[featured.level]
            const [c1,c2] = getGrad(featured.id)
            return (
              <div className="feat-flex" style={{ marginBottom:22,borderRadius:22,overflow:'hidden',background:LQ_BG,backdropFilter:'blur(40px) saturate(200%)',WebkitBackdropFilter:'blur(40px) saturate(200%)',border:LQ_BOR,boxShadow:`${LQ_SHAD}, 0 20px 60px rgba(0,0,0,0.07)`,animation:'fadeUp 0.4s ease both',display:'flex',minHeight:240,position:'relative' }}>
                <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(to left,${GOLD},${GOLD_D},transparent)` }}/>
                {/* info */}
                <div style={{ flex:1,padding:'32px 28px 28px',display:'flex',flexDirection:'column',justifyContent:'space-between' }}>
                  <div>
                    <div style={{ display:'inline-flex',alignItems:'center',gap:5,fontSize:10,fontWeight:700,color:GOLD,letterSpacing:'0.22em',marginBottom:14,background:'rgba(199,166,106,0.08)',border:'1px solid rgba(199,166,106,0.22)',borderRadius:20,padding:'3px 11px' }}>✦ برترین داور</div>
                    <h2 style={{ fontSize:'clamp(22px,3vw,34px)',fontWeight:900,color:TEXT,margin:'0 0 10px',letterSpacing:'-0.03em',lineHeight:1.1 }}>{featured.name}</h2>
                    <div style={{ display:'flex',alignItems:'center',gap:7,flexWrap:'wrap',marginBottom:14 }}>
                      {lv&&<span style={{ fontSize:12,fontWeight:700,color:lv.color,background:lv.bg,border:`1px solid ${lv.color}28`,borderRadius:20,padding:'3px 10px' }}>{lv.label}</span>}
                      {sp&&<span style={{ fontSize:12,fontWeight:700,color:sp.color,background:sp.bg,border:`1px solid ${sp.color}28`,borderRadius:20,padding:'3px 10px' }}>{sp.label}</span>}
                      {featured.verified&&<span style={{ display:'flex',alignItems:'center',gap:4,fontSize:11.5,fontWeight:700,color:GOLD,background:'rgba(199,166,106,0.08)',border:'1px solid rgba(199,166,106,0.22)',borderRadius:20,padding:'3px 10px' }}><svg width="10" height="10" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={GOLD}/><polyline points="7 12 10.5 15.5 17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>تأیید شده</span>}
                      <span style={{ fontSize:12,color:TEXT_S,display:'flex',alignItems:'center',gap:3 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{featured.city}</span>
                    </div>
                    <div style={{ display:'flex',gap:12,marginBottom:12,flexWrap:'wrap' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:5 }}><Stars rating={featured.rating}/><span style={{ fontSize:14,fontWeight:900,color:GOLD }}>{featured.rating}</span><span style={{ fontSize:11,color:TEXT_M }}>({fmt(featured.reviewCount)})</span></div>
                      <span style={{ fontSize:12,color:TEXT_S }}>{featured.experience} سال سابقه</span>
                      <span style={{ fontSize:12,color:TEXT_S }}>{fmt(featured.matchesRefereed)} مسابقه</span>
                      {featured.internationalMatches>0&&<span style={{ fontSize:12,color:'#7C3AED',fontWeight:700 }}>{fmt(featured.internationalMatches)} بین‌المللی</span>}
                    </div>
                    <p style={{ fontSize:13.5,color:TEXT_S,margin:0,lineHeight:1.8 }}>{featured.bio}</p>
                  </div>
                  <div style={{ marginTop:20 }}>
                    <Link href={`/referees/${featured.id}`} style={{ textDecoration:'none',display:'inline-flex',alignItems:'center',gap:6,background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,color:'#2a1e00',fontSize:12.5,fontWeight:800,padding:'10px 20px',borderRadius:11,boxShadow:`inset 0 1.5px 0 rgba(255,255,255,0.30), 0 5px 18px rgba(199,166,106,0.30)` }}>
                      مشاهده پروفایل
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </div>
                </div>
                {/* image side */}
                <div className="feat-side" style={{ width:'clamp(150px,32%,280px)',flexShrink:0,background:`linear-gradient(150deg,${c1}18,${c2}06)`,position:'relative',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <div style={{ position:'absolute',inset:0,background:`radial-gradient(ellipse at 55% 50%,${c1}1E 0%,transparent 65%)` }}/>
                  <div style={{ position:'absolute',bottom:-24,right:-24,width:88,height:88,borderRadius:'50%',border:`1.5px solid ${c1}16` }}/>
                  <div style={{ position:'absolute',top:-16,left:-16,width:68,height:68,borderRadius:'50%',border:`1.5px solid ${c1}10` }}/>
                  {/* referee icon */}
                  <div style={{ position:'absolute',top:16,left:16,width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 12px rgba(199,166,106,0.32)` }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  </div>
                  <div style={{ position:'relative',zIndex:2 }}>
                    <Avatar id={featured.id} name={featured.name} size={90} ring={featured.hasStory} onClick={featured.hasStory?()=>setActiveStory(featured):undefined}/>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* GRID */}
          {rest.length > 0 && (
            <div className="ref-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14 }}>
              {rest.map((ref, idx) => {
                const sp  = SPECS[ref.specialty]
                const lv  = LEVELS[ref.level]
                const [c1,c2] = getGrad(ref.id)
                const hovered = hoveredId===ref.id
                return (
                  <Link key={ref.id} href={`/referees/${ref.id}`} style={{ textDecoration:'none' }}>
                    <div className="ref-card"
                      onMouseEnter={()=>setHoveredId(ref.id)}
                      onMouseLeave={()=>setHoveredId(null)}
                      style={{ borderRadius:18,overflow:'hidden',background:LQ_BG,backdropFilter:'blur(40px) saturate(200%)',WebkitBackdropFilter:'blur(40px) saturate(200%)',border:LQ_BOR,boxShadow:LQ_SHAD,animation:`fadeUp 0.4s ${idx*0.07}s ease both` }}>

                      {/* image zone */}
                      <div style={{ position:'relative',aspectRatio:'4/3',background:`linear-gradient(155deg,${c1}16,${c2}06)`,overflow:'hidden' }}>
                        <div style={{ position:'absolute',inset:0,background:`radial-gradient(ellipse at 55% 55%,${c1}18 0%,transparent 65%)` }}/>
                        <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                          <div style={{ transition:'transform 0.35s ease',transform:hovered?'scale(1.08)':'scale(1)' }}>
                            <Avatar id={ref.id} name={ref.name} size={70}/>
                          </div>
                        </div>
                        <div style={{ position:'absolute',inset:0,background:'rgba(255,255,255,0.62)',backdropFilter:'blur(3px)',display:'flex',alignItems:'center',justifyContent:'center',opacity:hovered?1:0,transition:'opacity 0.22s ease' }}>
                          <div style={{ background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,color:'#2a1e00',fontSize:12.5,fontWeight:800,padding:'9px 18px',borderRadius:10,boxShadow:`inset 0 1.5px 0 rgba(255,255,255,0.30), 0 4px 14px rgba(199,166,106,0.36)` }}>
                            مشاهده پروفایل
                          </div>
                        </div>
                        {ref.hasStory && (
                          <div style={{ position:'absolute',top:10,right:10,zIndex:10 }}>
                            <button onClick={e=>{e.preventDefault();e.stopPropagation();setActiveStory(ref)}} style={{ background:'none',border:'none',cursor:'pointer',padding:0 }}>
                              <Avatar id={ref.id} name={ref.name} size={34} ring/>
                            </button>
                          </div>
                        )}
                        {lv&&<div style={{ position:'absolute',bottom:10,right:10 }}><span style={{ fontSize:10,fontWeight:700,color:lv.color,background:'rgba(255,255,255,0.90)',backdropFilter:'blur(8px)',border:`1px solid ${lv.color}28`,borderRadius:20,padding:'3px 9px' }}>{lv.label}</span></div>}
                        {ref.verified&&<div style={{ position:'absolute',top:10,left:10 }}><div style={{ width:26,height:26,borderRadius:'50%',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center' }}><svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={GOLD}/><polyline points="7 12 10.5 15.5 17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div></div>}
                      </div>

                      {/* info */}
                      <div style={{ padding:'13px 15px 15px' }}>
                        <h3 style={{ fontSize:15,fontWeight:800,color:TEXT,margin:'0 0 6px',letterSpacing:'-0.015em' }}>{ref.name}</h3>
                        <div style={{ display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:8 }}>
                          {sp&&<span style={{ fontSize:10.5,fontWeight:700,color:sp.color,background:sp.bg,borderRadius:20,padding:'2px 8px' }}>{sp.label}</span>}
                          <span style={{ fontSize:11,color:TEXT_M,display:'flex',alignItems:'center',gap:3 }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{ref.city}</span>
                        </div>
                        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom: ref.internationalMatches>0 ? 7 : 0 }}>
                          <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                            <Stars rating={ref.rating} size={11}/>
                            <span style={{ fontSize:12.5,fontWeight:800,color:GOLD }}>{ref.rating}</span>
                            <span style={{ fontSize:11,color:TEXT_M,marginRight:2 }}>{ref.experience} سال</span>
                          </div>
                          <div style={{ fontSize:11.5,fontWeight:700,color:TEXT_S,display:'flex',alignItems:'center',gap:3 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            {fmt(ref.matchesRefereed)}
                          </div>
                        </div>
                        {ref.internationalMatches > 0 && (
                          <div style={{ paddingTop:7,borderTop:'1px solid rgba(28,28,26,0.06)',display:'flex',alignItems:'center',gap:4 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            <span style={{ fontSize:11,fontWeight:700,color:'#7C3AED' }}>{fmt(ref.internationalMatches)} بین‌المللی</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {filtered.length===0 && (
            <div style={{ textAlign:'center',padding:'80px 0',color:TEXT_M,fontSize:14 }}>هیچ داوری با این فیلترها پیدا نشد</div>
          )}
        </div>
      </div>

      {activeStory && <StoryModal referee={activeStory} onClose={()=>setActiveStory(null)}/>}
    </>
  )
}
