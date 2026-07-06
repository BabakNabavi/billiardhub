'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── Dark theme tokens ────────────────────────────────────────
const GOLD    = '#C7A66A'
const GOLD_D  = '#A07840'
const BG      = '#0C0C0A'
const CARD    = '#161613'
const TEXT    = '#F5F4F0'
const TEXT_S  = 'rgba(245,244,240,0.52)'
const TEXT_M  = 'rgba(245,244,240,0.26)'
const BORDER  = 'rgba(255,255,255,0.07)'

const SPECS: Record<string,{label:string;color:string;bg:string}> = {
  snooker:  {label:'اسنوکر',       color:'#A78BFA',bg:'rgba(167,139,250,0.13)'},
  pocket:   {label:'پاکت بیلیارد', color:GOLD,     bg:'rgba(199,166,106,0.12)'},
  highball: {label:'هی‌بال',        color:'#FCD34D', bg:'rgba(252,211,77,0.11)'},
  carom:    {label:'کارامبول',      color:'#6EE7B7', bg:'rgba(110,231,183,0.11)'},
}

const AVATAR_GRAD: [string,string][] = [
  [GOLD,'#A07840'],['#A78BFA','#7C3AED'],['#60A5FA','#2563EB'],
  ['#C7956B','#8B6B3D'],['#6EE7B7','#16A34A'],['#F87171','#DC2626'],
]
const getGrad = (id:string):[string,string] =>
  AVATAR_GRAD[parseInt(id,10)%AVATAR_GRAD.length] ?? [GOLD,GOLD_D]

const fmt = (n:number) => n.toLocaleString('fa-IR')

// ── Types ────────────────────────────────────────────────────
interface Coach {
  id:string; name:string; specialty:string; city:string
  experience:number; rating:number; reviewCount:number
  sessionPrice:number; badge:string; badgeColor:string
  students:number; hasStory:boolean; storyImage:string; bio:string
}

// ── Mock data ────────────────────────────────────────────────
const COACHES: Coach[] = [
  {id:'1',name:'احمد رضایی',specialty:'snooker',city:'تهران',experience:15,rating:4.9,reviewCount:312,sessionPrice:500000,badge:'مربی بین‌المللی',badgeColor:'#A78BFA',students:240,hasStory:true,storyImage:'/images/shop/snooker-table.jpg',bio:'مربی ملی‌پوش با ۱۵ سال سابقه در فدراسیون جهانی — پرورش‌دهنده ۳ قهرمان ملی اسنوکر'},
  {id:'2',name:'حسین نوری',specialty:'snooker',city:'مشهد',experience:12,rating:4.7,reviewCount:187,sessionPrice:350000,badge:'مربی ملی',badgeColor:GOLD,students:180,hasStory:true,storyImage:'/images/shop/cue_billiard_2.jpg',bio:'قهرمان آسیا ۱۳۹۸ و مربی دسته برتر با رویکرد علمی'},
  {id:'3',name:'مریم کاظمی',specialty:'pocket',city:'اصفهان',experience:8,rating:4.8,reviewCount:143,sessionPrice:280000,badge:'مربی ملی',badgeColor:GOLD,students:95,hasStory:false,storyImage:'',bio:'قهرمان کشوری بانوان ۱۴۰۱ — متخصص پاکت بیلیارد با سبک تدریس حرفه‌ای'},
  {id:'4',name:'سینا محمدی',specialty:'pocket',city:'شیراز',experience:5,rating:4.5,reviewCount:76,sessionPrice:200000,badge:'مربی جوان',badgeColor:'#6EE7B7',students:52,hasStory:true,storyImage:'/images/shop/Ball-1.jpg',bio:'مربی جوان و قهرمان لیگ برتر — روش‌های نوین با آنالیز ویدیویی'},
  {id:'5',name:'علی حسینی',specialty:'highball',city:'تهران',experience:10,rating:4.6,reviewCount:98,sessionPrice:320000,badge:'مربی ملی',badgeColor:GOLD,students:120,hasStory:false,storyImage:'',bio:'متخصص هی‌بال و مربی تیم ملی جوانان ۱۴۰۰–۱۴۰۲'},
  {id:'6',name:'رضا ابراهیمی',specialty:'carom',city:'تبریز',experience:18,rating:4.9,reviewCount:256,sessionPrice:450000,badge:'مربی بین‌المللی',badgeColor:'#A78BFA',students:310,hasStory:true,storyImage:'/images/shop/pool_chalk_1.jpg',bio:'پیشکسوت کارامبول با ۱۸ سال تجربه در ایران و خاورمیانه'},
]

const CITIES = ['همه', ...Array.from(new Set(COACHES.map(c => c.city)))]

// ── Sub-components ────────────────────────────────────────────
function Avatar({ id, name, size, ring, animated, onClick }: {
  id:string; name:string; size:number; ring?:boolean; animated?:boolean; onClick?:()=>void
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
      padding:4,display:'flex',alignItems:'center',justifyContent:'center',
      animation: animated ? 'ringPulse 2s ease-in-out infinite' : 'none' }}>
      <div style={{ width:size,height:size,borderRadius:'50%',background:'rgba(8,8,6,0.82)',
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
          fill={i<=Math.floor(rating)?'#FCD34D':'none'}
          stroke={i<=Math.floor(rating)?'none':'rgba(252,211,77,0.35)'} strokeWidth={1.5}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

function StoryModal({ coach, onClose }:{ coach:Coach; onClose:()=>void }) {
  const [progress, setProgress] = useState(0)
  const [c1,c2] = getGrad(coach.id)
  const sp = SPECS[coach.specialty]
  useEffect(()=>{
    let p=0; const id=setInterval(()=>{ p+=2; setProgress(p); if(p>=100){clearInterval(id);setTimeout(onClose,200)} },100)
    return ()=>clearInterval(id)
  },[coach.id,onClose])
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',fn); return ()=>window.removeEventListener('keydown',fn)
  },[onClose])
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.93)',backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn 0.2s ease both' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'min(420px,92vw)',height:'min(745px,90vh)',borderRadius:24,overflow:'hidden',position:'relative',background:coach.storyImage?'transparent':`linear-gradient(160deg,${c1},${c2})`,boxShadow:'0 24px 80px rgba(0,0,0,0.7)' }}>
        {coach.storyImage&&<div style={{ position:'absolute',inset:0,backgroundImage:`url(${coach.storyImage})`,backgroundSize:'cover',backgroundPosition:'center' }}><div style={{ position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,0.52) 0%,rgba(0,0,0,0.08) 40%,rgba(0,0,0,0.62) 100%)' }}/></div>}
        <div style={{ position:'absolute',top:16,left:16,right:16,height:3,background:'rgba(255,255,255,0.22)',borderRadius:4,overflow:'hidden',zIndex:10 }}>
          <div style={{ height:'100%',width:`${progress}%`,background:'#fff',borderRadius:4,transition:'width 0.08s linear' }}/>
        </div>
        <div style={{ position:'absolute',top:30,left:0,right:0,padding:'0 16px',display:'flex',alignItems:'center',gap:10,zIndex:10 }}>
          <Avatar id={coach.id} name={coach.name} size={40} ring/>
          <div>
            <div style={{ fontSize:14,fontWeight:800,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,0.5)' }}>{coach.name}</div>
            {sp&&<div style={{ fontSize:11,color:'rgba(255,255,255,0.70)',fontWeight:600 }}>{sp.label}</div>}
          </div>
          <button onClick={onClose} style={{ marginRight:'auto',width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,0.38)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.18)',color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
        </div>
        <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'40px 20px 28px',background:'linear-gradient(to top,rgba(0,0,0,0.65),transparent)',zIndex:10 }}>
          <p style={{ fontSize:15,color:'#fff',margin:0,lineHeight:1.75,fontWeight:500 }}>{coach.bio}</p>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  Main Page
// ════════════════════════════════════════════════════════════
export default function CoachesPage() {
  const [filterSpec,  setFilterSpec]  = useState('all')
  const [filterCity,  setFilterCity]  = useState('همه')
  const [sortBy,      setSortBy]      = useState('experience')
  const [activeStory, setActiveStory] = useState<Coach|null>(null)
  const [hoveredId,   setHoveredId]   = useState<string|null>(null)

  const filtered = COACHES
    .filter(c => filterSpec==='all' || c.specialty===filterSpec)
    .filter(c => filterCity==='همه' || c.city===filterCity)
    .sort((a,b) => {
      if(sortBy==='rating')   return b.rating - a.rating
      if(sortBy==='students') return b.students - a.students
      return b.experience - a.experience
    })

  const featured = filtered[0]
  const rest     = filtered.slice(1)

  return (
    <>
      <style>{`
        @keyframes ringPulse { 0%,100%{box-shadow:0 0 0 0 rgba(199,166,106,0.7)} 50%{box-shadow:0 0 0 7px rgba(199,166,106,0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        * { box-sizing:border-box; }
        .c-card { transition:transform 0.28s cubic-bezier(0.22,1,0.36,1),box-shadow 0.28s ease; }
        .c-card:hover { transform:translateY(-5px); box-shadow:0 28px 56px rgba(0,0,0,0.50)!important; }
        @media(max-width:900px) { .grid-3{grid-template-columns:repeat(2,1fr)!important;} }
        @media(max-width:560px) { .grid-3{grid-template-columns:1fr!important;} .feat-flex{flex-direction:column!important;} .feat-img{width:100%!important;min-height:180px;} }
      `}</style>

      {/* ═══ HERO ══════════════════════════════════════════════ */}
      <section style={{ minHeight:300,position:'relative',overflow:'hidden',display:'flex',alignItems:'flex-end',direction:'rtl',fontFamily:'Vazirmatn,Tahoma,sans-serif' }}>
        <div style={{ position:'absolute',inset:'-5% 0',backgroundImage:"url('/images/shop/snooker-table.jpg')",backgroundSize:'cover',backgroundPosition:'center top' }}>
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(6,6,4,0.65) 0%,rgba(6,6,4,0.90) 100%)' }}/>
        </div>
        <div style={{ position:'relative',zIndex:5,maxWidth:1100,margin:'0 auto',padding:'110px clamp(16px,4vw,48px) 56px',width:'100%' }}>
          <h1 style={{ fontSize:'clamp(54px,8vw,96px)',fontWeight:900,color:TEXT,margin:0,letterSpacing:'-0.04em',lineHeight:1,fontFamily:'Vazirmatn,Tahoma,sans-serif' }}>
            مربیان
          </h1>
          <div style={{ marginTop:16,width:80,height:2.5,background:`linear-gradient(to left,${GOLD},${GOLD_D})`,borderRadius:2 }}/>
        </div>
      </section>

      {/* ═══ STORY STRIP ══════════════════════════════════════ */}
      {COACHES.some(c=>c.hasStory) && (
        <div style={{ position:'sticky',top:0,zIndex:50,background:'rgba(8,8,6,0.94)',backdropFilter:'blur(28px)',WebkitBackdropFilter:'blur(28px)',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth:1100,margin:'0 auto',padding:'10px clamp(16px,4vw,48px)',overflowX:'auto',direction:'rtl',fontFamily:'Vazirmatn,Tahoma,sans-serif' }}>
            <div style={{ display:'flex',gap:18,width:'max-content' }}>
              {COACHES.filter(c=>c.hasStory).map(c=>(
                <button key={c.id} onClick={()=>setActiveStory(c)}
                  style={{ background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:0 }}>
                  <Avatar id={c.id} name={c.name} size={48} ring animated/>
                  <span style={{ fontSize:10,fontWeight:700,color:TEXT_M,whiteSpace:'nowrap' }}>{c.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ FILTER BAR ═══════════════════════════════════════ */}
      <div style={{ background:BG,direction:'rtl',fontFamily:'Vazirmatn,Tahoma,sans-serif' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:'16px clamp(16px,4vw,48px)' }}>
          <div style={{ background:'rgba(255,255,255,0.04)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',border:`1px solid ${BORDER}`,borderRadius:16,padding:'12px 16px',display:'flex',gap:7,flexWrap:'wrap',alignItems:'center' }}>
            {[{k:'all',l:'همه'},{k:'snooker',l:'اسنوکر'},{k:'pocket',l:'پاکت'},{k:'highball',l:'هی‌بال'},{k:'carom',l:'کارامبول'}].map(({k,l})=>(
              <button key={k} onClick={()=>setFilterSpec(k)} style={{ padding:'6px 14px',borderRadius:20,border:'none',cursor:'pointer',fontFamily:'Vazirmatn,Tahoma,sans-serif',fontSize:12.5,fontWeight:700,transition:'all 0.18s',
                background: filterSpec===k ? `linear-gradient(135deg,${GOLD},${GOLD_D})` : 'rgba(255,255,255,0.07)',
                color:      filterSpec===k ? '#2a1e00' : TEXT_S,
                boxShadow:  filterSpec===k ? `0 4px 14px rgba(199,166,106,0.28)` : 'none' }}>
                {l}
              </button>
            ))}
            <div style={{ width:1,height:16,background:BORDER,margin:'0 1px' }}/>
            {CITIES.map(city=>(
              <button key={city} onClick={()=>setFilterCity(city)} style={{ padding:'5px 12px',borderRadius:20,cursor:'pointer',fontFamily:'Vazirmatn,Tahoma,sans-serif',fontSize:12,fontWeight:700,transition:'all 0.18s',
                background:  filterCity===city ? 'rgba(199,166,106,0.12)' : 'transparent',
                color:       filterCity===city ? GOLD : TEXT_M,
                border:      filterCity===city ? `1px solid rgba(199,166,106,0.32)` : `1px solid ${BORDER}` }}>
                {city}
              </button>
            ))}
            <div style={{ marginRight:'auto',display:'flex',gap:5 }}>
              {[{k:'experience',l:'سابقه'},{k:'rating',l:'امتیاز'},{k:'students',l:'شاگرد'}].map(({k,l})=>(
                <button key={k} onClick={()=>setSortBy(k)} style={{ padding:'5px 11px',borderRadius:16,fontSize:11.5,fontWeight:700,cursor:'pointer',fontFamily:'Vazirmatn,Tahoma,sans-serif',transition:'all 0.18s',
                  background: sortBy===k ? 'rgba(199,166,106,0.10)' : 'transparent',
                  color:      sortBy===k ? GOLD : TEXT_M,
                  border:     sortBy===k ? `1px solid rgba(199,166,106,0.32)` : `1px solid ${BORDER}` }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ══════════════════════════════════════ */}
      <div style={{ background:BG,direction:'rtl',fontFamily:'Vazirmatn,Tahoma,sans-serif',paddingBottom:80 }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:'0 clamp(16px,4vw,48px)' }}>

          {/* FEATURED */}
          {featured && (()=>{
            const sp   = SPECS[featured.specialty]
            const [c1,c2] = getGrad(featured.id)
            return (
              <div className="feat-flex" style={{ marginBottom:22,borderRadius:20,overflow:'hidden',background:`linear-gradient(145deg,#1C1A14,#0F0E0B)`,borderRight:`4px solid ${GOLD}`,boxShadow:`0 0 60px rgba(199,166,106,0.06), inset 0 1px 0 rgba(255,255,255,0.05)`,animation:'fadeUp 0.4s ease both',display:'flex',minHeight:230 }}>
                {/* info */}
                <div style={{ flex:1,padding:'28px 26px 24px',display:'flex',flexDirection:'column',justifyContent:'space-between' }}>
                  <div>
                    <div style={{ display:'inline-flex',alignItems:'center',gap:5,fontSize:10,fontWeight:700,color:GOLD,letterSpacing:'0.22em',marginBottom:12,background:'rgba(199,166,106,0.08)',border:'1px solid rgba(199,166,106,0.18)',borderRadius:20,padding:'3px 11px' }}>
                      ✦ برترین مربی
                    </div>
                    <h2 style={{ fontSize:'clamp(22px,3vw,34px)',fontWeight:900,color:TEXT,margin:'0 0 10px',letterSpacing:'-0.03em',lineHeight:1.1 }}>{featured.name}</h2>
                    <div style={{ display:'flex',alignItems:'center',gap:7,flexWrap:'wrap',marginBottom:13 }}>
                      {sp&&<span style={{ fontSize:11.5,fontWeight:700,color:sp.color,background:sp.bg,border:`1px solid ${sp.color}28`,borderRadius:20,padding:'3px 10px' }}>{sp.label}</span>}
                      <span style={{ fontSize:11.5,fontWeight:700,color:featured.badgeColor,background:`${featured.badgeColor}12`,border:`1px solid ${featured.badgeColor}25`,borderRadius:20,padding:'3px 10px' }}>{featured.badge}</span>
                      <span style={{ fontSize:12,color:TEXT_S,display:'flex',alignItems:'center',gap:3 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {featured.city}
                      </span>
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:11 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                        <Stars rating={featured.rating}/>
                        <span style={{ fontSize:14,fontWeight:900,color:GOLD }}>{featured.rating}</span>
                        <span style={{ fontSize:11,color:TEXT_M }}>({fmt(featured.reviewCount)})</span>
                      </div>
                      <span style={{ fontSize:11.5,color:TEXT_S }}>{featured.experience} سال سابقه</span>
                      <span style={{ fontSize:11.5,color:TEXT_S }}>{fmt(featured.students)} شاگرد</span>
                    </div>
                    <p style={{ fontSize:13,color:TEXT_S,margin:0,lineHeight:1.8,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{featured.bio}</p>
                  </div>
                  <div style={{ display:'flex',gap:10,marginTop:18 }}>
                    <Link href={`/coaches/${featured.id}`} style={{ textDecoration:'none',display:'inline-flex',alignItems:'center',gap:6,background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,color:'#2a1e00',fontSize:12.5,fontWeight:800,padding:'10px 19px',borderRadius:11,boxShadow:`0 5px 18px rgba(199,166,106,0.30)` }}>
                      مشاهده پروفایل
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                    <a href={`https://wa.me/98912000000?text=سلام، می‌خوام با مربی ${featured.name} کلاس رزرو کنم`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ textDecoration:'none',display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.06)',border:`1px solid ${BORDER}`,color:TEXT_S,fontSize:12.5,fontWeight:700,padding:'10px 16px',borderRadius:11 }}>
                      رزرو کلاس
                    </a>
                  </div>
                </div>
                {/* "image" (gradient + avatar) */}
                <div className="feat-img" style={{ width:'clamp(150px,34%,300px)',flexShrink:0,position:'relative',background:`linear-gradient(150deg,${c1}1C,${c2}06)`,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <div style={{ position:'absolute',inset:0,background:`radial-gradient(ellipse at 60% 50%,${c1}20 0%,transparent 68%)` }}/>
                  <div style={{ position:'absolute',bottom:-28,right:-28,width:96,height:96,borderRadius:'50%',border:`1.5px solid ${c1}16` }}/>
                  <div style={{ position:'absolute',top:-18,left:-18,width:72,height:72,borderRadius:'50%',border:`1.5px solid ${c1}10` }}/>
                  <div style={{ position:'relative',zIndex:2 }}>
                    <Avatar id={featured.id} name={featured.name} size={96} ring={featured.hasStory} animated={featured.hasStory} onClick={featured.hasStory?()=>setActiveStory(featured):undefined}/>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* GRID */}
          {rest.length > 0 && (
            <div className="grid-3" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14 }}>
              {rest.map((coach,idx) => {
                const sp = SPECS[coach.specialty]
                const [c1,c2] = getGrad(coach.id)
                const hovered = hoveredId===coach.id
                return (
                  <Link key={coach.id} href={`/coaches/${coach.id}`} style={{ textDecoration:'none' }}>
                    <div className="c-card"
                      onMouseEnter={()=>setHoveredId(coach.id)}
                      onMouseLeave={()=>setHoveredId(null)}
                      style={{ borderRadius:16,overflow:'hidden',background:CARD,border:`1px solid ${BORDER}`,boxShadow:'0 4px 24px rgba(0,0,0,0.28)',animation:`fadeUp 0.4s ${idx*0.07}s ease both` }}>

                      {/* image zone */}
                      <div style={{ position:'relative',aspectRatio:'4/3',background:`linear-gradient(155deg,${c1}18,${c2}06)`,overflow:'hidden' }}>
                        <div style={{ position:'absolute',inset:0,background:`radial-gradient(ellipse at 55% 55%,${c1}1A 0%,transparent 65%)` }}/>
                        <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                          <div style={{ transition:'transform 0.4s ease',transform:hovered?'scale(1.12)':'scale(1)' }}>
                            <Avatar id={coach.id} name={coach.name} size={72}/>
                          </div>
                        </div>
                        <div style={{ position:'absolute',inset:0,background:'rgba(6,6,4,0.56)',display:'flex',alignItems:'center',justifyContent:'center',opacity:hovered?1:0,transition:'opacity 0.22s ease' }}>
                          <div style={{ background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,color:'#2a1e00',fontSize:12.5,fontWeight:800,padding:'8px 17px',borderRadius:9,boxShadow:`0 4px 14px rgba(199,166,106,0.36)` }}>
                            مشاهده پروفایل
                          </div>
                        </div>
                        {coach.hasStory && (
                          <div style={{ position:'absolute',top:9,right:9,zIndex:10 }}>
                            <button onClick={e=>{e.preventDefault();e.stopPropagation();setActiveStory(coach)}}
                              style={{ background:'none',border:'none',cursor:'pointer',padding:0,display:'block' }}>
                              <Avatar id={coach.id} name={coach.name} size={34} ring animated/>
                            </button>
                          </div>
                        )}
                        <div style={{ position:'absolute',bottom:9,right:9 }}>
                          <span style={{ fontSize:10,fontWeight:700,color:coach.badgeColor,background:'rgba(6,6,4,0.74)',backdropFilter:'blur(8px)',border:`1px solid ${coach.badgeColor}2E`,borderRadius:20,padding:'3px 9px' }}>{coach.badge}</span>
                        </div>
                      </div>

                      {/* info */}
                      <div style={{ padding:'13px 15px 15px' }}>
                        <h3 style={{ fontSize:15.5,fontWeight:800,color:TEXT,margin:'0 0 7px',letterSpacing:'-0.015em' }}>{coach.name}</h3>
                        <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:9 }}>
                          {sp&&<span style={{ fontSize:10.5,fontWeight:700,color:sp.color,background:sp.bg,borderRadius:20,padding:'2px 8px' }}>{sp.label}</span>}
                          <span style={{ fontSize:11,color:TEXT_M,display:'flex',alignItems:'center',gap:3 }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {coach.city}
                          </span>
                        </div>
                        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                          <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                            <Stars rating={coach.rating} size={11}/>
                            <span style={{ fontSize:13,fontWeight:800,color:GOLD }}>{coach.rating}</span>
                            <span style={{ fontSize:11,color:TEXT_M,marginRight:2 }}>{coach.experience} سال</span>
                          </div>
                          <div style={{ fontSize:11.5,fontWeight:700,color:TEXT_S }}>
                            {fmt(Math.round(coach.sessionPrice/1000))}K <span style={{ fontSize:10,color:TEXT_M }}>/ جلسه</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {filtered.length===0 && (
            <div style={{ textAlign:'center',padding:'80px 0',color:TEXT_M,fontSize:14 }}>
              هیچ مربی با این فیلتر پیدا نشد
            </div>
          )}
        </div>
      </div>

      {activeStory && <StoryModal coach={activeStory} onClose={()=>setActiveStory(null)}/>}
    </>
  )
}
