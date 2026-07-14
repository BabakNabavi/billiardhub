'use client'
import { useState } from 'react'
import Link from 'next/link'
import ClubStoryModal from '@/components/ClubStoryModal'

/* ─── Tokens ─── */
const GOLD    = '#C7A66A'
const GOLD_D  = '#9A6E38'
const GOLD_G  = 'linear-gradient(135deg,#7A4F10 0%,#C7A66A 50%,#8A6020 100%)'  // dark gold for light bg

/* page colors (light theme) */
const BG      = '#F6F4F0'
const TEXT    = '#111110'
const TEXT_S  = 'rgba(17,17,16,0.52)'
const TEXT_M  = 'rgba(17,17,16,0.28)'

const SPECS: Record<string, { label: string; color: string; glow: string }> = {
  snooker:  { label: 'اسنوکر',       color: '#7C3AED', glow: 'rgba(124,58,237,0.30)' },
  pocket:   { label: 'پاکت بیلیارد', color: GOLD_D,    glow: 'rgba(154,110,56,0.30)' },
  highball: { label: 'هی‌بال',       color: '#C2410C', glow: 'rgba(194,65,12,0.30)'  },
  carom:    { label: 'کارامبول',     color: '#15803D', glow: 'rgba(21,128,61,0.30)'  },
}

const IMGS: string[] = [
  '/images/shop/snooker-table.jpg',
  '/images/shop/cue_billiard_2.jpg',
  '/images/shop/Ball-1.jpg',
  '/images/shop/pool_chalk_1.jpg',
]
const img = (i: number) => IMGS[i % IMGS.length] ?? IMGS[0]!

interface Coach {
  id: string; name: string; specialty: string; city: string
  experience: number; rating: number; students: number; medals: number
  sessionPrice: number; hasStory: boolean; storyImage: string; bio: string; photo: string
}

const COACHES: Coach[] = [
  { id:'1',  name:'احمد رضایی',    specialty:'snooker',  city:'تهران',  experience:15, rating:4.9, students:240, medals:8,  sessionPrice:500000, hasStory:true,  storyImage:img(0), bio:'مربی ملی‌پوش با ۱۵ سال سابقه — پرورش‌دهنده ۳ قهرمان ملی',      photo:'' },
  { id:'2',  name:'حسین نوری',     specialty:'snooker',  city:'مشهد',   experience:12, rating:4.7, students:180, medals:5,  sessionPrice:350000, hasStory:true,  storyImage:img(1), bio:'قهرمان آسیا ۱۳۹۸ — تکنیک‌های پیشرفته اسنوکر',               photo:'' },
  { id:'3',  name:'مریم کاظمی',    specialty:'pocket',   city:'اصفهان', experience:8,  rating:4.8, students:95,  medals:4,  sessionPrice:280000, hasStory:false, storyImage:'',     bio:'قهرمان کشوری بانوان ۱۴۰۱ — متخصص پاکت بیلیارد',            photo:'' },
  { id:'4',  name:'سینا محمدی',    specialty:'pocket',   city:'شیراز',  experience:5,  rating:4.5, students:52,  medals:2,  sessionPrice:200000, hasStory:true,  storyImage:img(3), bio:'قهرمان لیگ برتر جوانان — آموزش با آنالیز ویدیویی',           photo:'' },
  { id:'5',  name:'علی حسینی',     specialty:'highball', city:'تهران',  experience:10, rating:4.6, students:120, medals:3,  sessionPrice:320000, hasStory:false, storyImage:'',     bio:'مربی تیم ملی جوانان هی‌بال — متخصص تکنیک ضربات',            photo:'' },
  { id:'6',  name:'رضا ابراهیمی',  specialty:'carom',    city:'تبریز',  experience:18, rating:4.9, students:310, medals:12, sessionPrice:450000, hasStory:true,  storyImage:img(1), bio:'پیشکسوت کارامبول — استاد اول ایران با ۱۸ سال تجربه',         photo:'' },
  { id:'7',  name:'نیلوفر صادقی',  specialty:'snooker',  city:'تهران',  experience:7,  rating:4.6, students:74,  medals:3,  sessionPrice:260000, hasStory:true,  storyImage:img(2), bio:'مربی تیم بانوان فدراسیون اسنوکر — قهرمان کشوری ۱۴۰۲',       photo:'' },
  { id:'8',  name:'کامران یوسفی',  specialty:'carom',    city:'تهران',  experience:14, rating:4.8, students:195, medals:7,  sessionPrice:400000, hasStory:true,  storyImage:img(3), bio:'نائب‌قهرمان آسیا کارامبول — مدرس سیستم‌های ضربه‌ای',        photo:'' },
  { id:'9',  name:'زهرا شریفی',    specialty:'pocket',   city:'کرج',    experience:6,  rating:4.5, students:63,  medals:2,  sessionPrice:220000, hasStory:false, storyImage:'',     bio:'متخصص پاکت بیلیارد بانوان — سیستم آموزشی گام به گام',        photo:'' },
  { id:'10', name:'محسن طاهری',    specialty:'highball', city:'تهران',  experience:9,  rating:4.7, students:108, medals:4,  sessionPrice:290000, hasStory:true,  storyImage:img(1), bio:'مربی تیم ملی هی‌بال ۱۴۰۳ — متخصص آنالیز بازی',             photo:'' },
]

/* billiard rack: 15 balls */
const RACK: [number, number][] = [
  [490,50],[442,133],[538,133],[394,216],[490,216],[586,216],
  [346,299],[442,299],[538,299],[634,299],
  [298,382],[394,382],[490,382],[586,382],[682,382],
]
const RACK_C = [
  '#C7A66A','#DC2626','#7C3AED',
  '#DC2626','#C7A66A','#DC2626',
  '#C7A66A','#DC2626','#C7A66A','#DC2626',
  '#7C3AED','#DC2626','#C7A66A','#DC2626','#C7A66A',
]

/* ── Avatar with story ring (Instagram gradient, like home) ── */
function CoachAvatar({ coach, onStory, size }: { coach: Coach; onStory: () => void; size: string }) {
  return (
    <button type="button" aria-label="مشاهده استوری"
      onClick={e => { e.preventDefault(); e.stopPropagation(); onStory() }}
      className="cavatar"
      style={{ width:size, aspectRatio:'1 / 1', borderRadius:'50%', padding:'3px', cursor:'pointer', border:'none', flexShrink:0,
        background:'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)',
        boxShadow:'0 4px 16px rgba(0,0,0,0.18), 0 0 14px rgba(214,41,118,0.32)', display:'flex' }}>
      <div style={{ width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden',
        border:'2.5px solid #FFFFFF', background:'#E7ECF1',
        display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
        {coach.photo ? (
          <img src={coach.photo} alt={coach.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        ) : (
          <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display:'block' }} aria-hidden="true">
            <circle cx="50" cy="37" r="19" fill="#93A3B8"/>
            <path d="M15 100 C15 74 31 65 50 65 C69 65 85 74 85 100 Z" fill="#A9B8CC"/>
          </svg>
        )}
      </div>
    </button>
  )
}

/* ── Coach card — grid + list ── */
function CoachCard({ coach, view, idx, onStory }: { coach: Coach; view: 'grid' | 'list'; idx: number; onStory: () => void }) {
  const sp = SPECS[coach.specialty]

  if (view === 'list') {
    return (
      <article className="ccard-list" style={{
        display:'flex', alignItems:'center', gap:14, padding:'11px 13px',
        borderRadius:12, background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.08)',
        boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
        animation:`fadeUp .34s ${(idx * 0.04).toFixed(2)}s ease both`,
      }}>
        <div style={{ position:'relative', zIndex:2 }}>
          <CoachAvatar coach={coach} onStory={onStory} size="58px"/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:TEXT, lineHeight:1.2, letterSpacing:'-0.02em', marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{coach.name}</h3>
          <p style={{ fontSize:12, color:TEXT_S, marginBottom:5 }}>مربی {sp?.label ?? 'بیلیارد'}</p>
          <div style={{ display:'flex', alignItems:'center', gap:5, color:TEXT_M }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize:11.5, color:TEXT_S }}>{coach.city}</span>
          </div>
        </div>
        <Link href={`/coaches/${coach.id}`} className="btnConnect" aria-label="مشاهده پروفایل" style={{
          flexShrink:0, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center',
          width:40, height:40, border:'1px solid rgba(199,166,106,0.34)', borderRadius:10, color:'#9A6E38', background:'rgba(199,166,106,0.12)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
      </article>
    )
  }

  return (
    <article className="ccard" style={{
      borderRadius:12, overflow:'hidden', background:'#FFFFFF',
      border:'1px solid rgba(0,0,0,0.08)',
      boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 8px 22px rgba(0,0,0,0.04)',
      animation:`fadeUp .38s ${(idx * 0.05).toFixed(2)}s ease both`,
      display:'flex', flexDirection:'column',
    }}>
      {/* cover — default coach poster */}
      <div style={{ position:'relative', paddingTop:'46%', flexShrink:0, overflow:'hidden', background:'linear-gradient(115deg,#0c1424 0%,#17253f 55%,#1e2f4d 100%)' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize:'14px 14px' }}/>
        <div style={{ position:'absolute', left:'-12%', top:'-40%', width:'52%', height:'180%', background:'radial-gradient(ellipse, rgba(199,166,106,0.20) 0%, transparent 64%)', filter:'blur(14px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'-20%', bottom:'-20%', left:'56%', width:'1px', background:'linear-gradient(180deg,transparent,rgba(199,166,106,0.5),transparent)', transform:'rotate(-12deg)', pointerEvents:'none' }}/>
        <img src="/images/Logo/BH.png" alt="" style={{ position:'absolute', top:'9px', insetInlineEnd:'10px', height:'22%', width:'auto', opacity:0.9 }}/>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,transparent,${GOLD},transparent)`, opacity:0.55 }}/>
      </div>
      {/* avatar */}
      <div style={{ display:'flex', justifyContent:'center', marginTop:'-31%', position:'relative', zIndex:2 }}>
        <CoachAvatar coach={coach} onStory={onStory} size="58%"/>
      </div>
      {/* body */}
      <div style={{ padding:'12px 14px 18px', flex:1, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
        <h3 style={{ fontSize:16, fontWeight:800, color:TEXT, lineHeight:1.2, letterSpacing:'-0.02em', marginBottom:4 }}>{coach.name}</h3>
        <p style={{ fontSize:12.5, color:TEXT_S, lineHeight:1.35, marginBottom:9, minHeight:'2.7em', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>مربی {sp?.label ?? 'بیلیارد'}</p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:13, color:TEXT_M }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize:11.5, color:TEXT_S }}>{coach.city}</span>
        </div>
        <div style={{ flex:1 }}/>
        <Link href={`/coaches/${coach.id}`} className="btnConnect" style={{ alignSelf:'stretch', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 12px', border:'1px solid rgba(199,166,106,0.34)', borderRadius:10, fontSize:13, fontWeight:700, color:'#9A6E38', background:'rgba(199,166,106,0.12)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          مشاهده پروفایل
        </Link>
      </div>
    </article>
  )
}

/* ════════════════ PAGE ════════════════ */
export default function CoachesPage() {
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [view,      setView]      = useState<'grid' | 'list'>('grid')
  const [openStory, setOpenStory] = useState<Coach | null>(null)
  const q = search.trim()
  const coaches = COACHES.filter(c =>
    (filter === 'all' || c.specialty === filter) &&
    (q === '' || c.name.includes(q) || c.city.includes(q))
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}

        /* aurora blobs */
        @keyframes blob1{
          0%,100%{transform:translate(0,0) scale(1);}
          25%{transform:translate(-28px,-20px) scale(1.05);}
          55%{transform:translate(-10px,26px) scale(0.96);}
          80%{transform:translate(20px,-12px) scale(1.02);}
        }
        @keyframes blob2{
          0%,100%{transform:translate(0,0) scale(1);}
          20%{transform:translate(32px,20px) scale(1.04);}
          55%{transform:translate(44px,-26px) scale(0.92);}
          75%{transform:translate(10px,30px) scale(1.06);}
        }
        @keyframes blob3{
          0%,100%{transform:translate(0,0);}
          50%{transform:translate(-26px,-36px) scale(1.10);}
        }

        /* rack — fade in, stay, fade out, reappear elsewhere */
        @keyframes rackCycle{
          0%  {opacity:0;}
          6%  {opacity:.46;}
          32% {opacity:.46;}
          40% {opacity:0;}
          100%{opacity:0;}
        }

        /* light streaks — visible on light bg */
        @keyframes streakA{
          0%{opacity:0;transform:translateX(-130%) skewX(-18deg);}
          15%{opacity:1;}85%{opacity:1;}
          100%{opacity:0;transform:translateX(230%) skewX(-18deg);}
        }
        @keyframes streakB{
          0%{opacity:0;transform:translateX(-120%) skewX(-14deg);}
          15%{opacity:.5;}85%{opacity:.5;}
          100%{opacity:0;transform:translateX(250%) skewX(-14deg);}
        }

        /* text reveal */
        @keyframes lineReveal{
          from{clip-path:inset(0 0 105% 0);transform:translateY(14px);opacity:0;}
          to{clip-path:inset(0 0 -25% 0);transform:none;opacity:1;}
        }
        @keyframes scaleInX{from{opacity:0;transform:scaleX(0)}to{opacity:1;transform:scaleX(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes softBlink{0%,100%{opacity:1}50%{opacity:0.5}}

        /* filter pills */
        .fpill{transition:all .2s cubic-bezier(.4,0,.2,1);}

        /* cards — LinkedIn style */
        .ccard{transition:transform .28s cubic-bezier(.4,0,.2,1),box-shadow .28s,border-color .28s;position:relative;}
        .ccard:hover{
          transform:translateY(-5px);
          border-color:rgba(199,166,106,0.38)!important;
          box-shadow:
            0 0 0 3px rgba(199,166,106,0.08),
            0 16px 40px rgba(28,28,26,0.12),
            0 6px 16px rgba(0,0,0,0.06) !important;
        }
        .cavatar{transition:transform .35s cubic-bezier(.4,0,.2,1);}
        .ccard:hover .cavatar{transform:scale(1.04);}
        .ccard-list{transition:transform .2s,box-shadow .2s,border-color .2s;}
        .ccard-list:hover{border-color:rgba(199,166,106,0.38)!important;box-shadow:0 6px 20px rgba(28,28,26,0.10)!important;}
        .btnConnect{transition:all .3s cubic-bezier(0.22,1,0.36,1);}
        .btnConnect:hover{transform:translateY(-2px);background:rgba(199,166,106,0.20)!important;box-shadow:0 6px 16px rgba(199,166,106,0.24)!important;}

        /* buttons */
        .btnG{transition:background .18s,transform .14s,box-shadow .18s;}
        .btnG:hover{background:${GOLD_D}!important;transform:translateY(-1px);box-shadow:0 8px 20px rgba(199,166,106,0.28)!important;}
        .btnO{transition:background .18s,color .18s,border-color .18s;}
        .btnO:hover{background:${TEXT}!important;color:#fff!important;border-color:${TEXT}!important;}
        .btnGO{transition:background .18s,box-shadow .18s;}
        .btnGO:hover{background:rgba(199,166,106,0.14)!important;box-shadow:inset 0 0 0 1px rgba(199,166,106,0.60)!important;}
        .btnBanner{transition:background .18s,transform .14s,box-shadow .18s;}
        .btnBanner:hover{background:${GOLD_D}!important;transform:translateY(-2px);box-shadow:0 10px 28px rgba(199,166,106,0.32)!important;}

        /* responsive */
        @media(max-width:1100px){.g5{grid-template-columns:repeat(3,1fr)!important;}}
        @media(max-width:700px) {.g5{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:480px) {.g5{grid-template-columns:repeat(2,1fr)!important;}}
        /* mobile: search + toggles drop to their own row under the pills */
        @media(max-width:640px){.coach-search-group{flex-basis:100%;margin-inline-start:0!important;}}
        /* list view: 2 cards per row on desktop, 1 on mobile */
        .coach-list-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        @media(max-width:700px){.coach-list-grid{grid-template-columns:1fr;}}

      `}</style>

      <div style={{ direction:'rtl', fontFamily:"'Vazirmatn',Tahoma,sans-serif", background:BG, minHeight:'100vh', color:TEXT }}>

        {/* ══════════════ HERO — compact banner ══════════════ */}
        <section style={{ position:'relative', height:'clamp(145px,16.5vh,300px)', overflow:'hidden', display:'flex', alignItems:'center', paddingTop:'clamp(8px,2.2vh,24px)' }}>

          {/* Aurora blobs — pastel tints on light bg */}
          <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
            <div style={{
              position:'absolute', right:'-8%', top:'8%',
              width:280, height:280, borderRadius:'50%',
              background:'radial-gradient(circle, rgba(199,166,106,0.38) 0%, rgba(199,166,106,0.12) 45%, transparent 70%)',
              filter:'blur(55px)', animation:'blob1 15s ease-in-out infinite',
            }}/>
            <div style={{
              position:'absolute', left:'-6%', top:'20%',
              width:240, height:240, borderRadius:'50%',
              background:'radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0.07) 50%, transparent 72%)',
              filter:'blur(52px)', animation:'blob2 19s ease-in-out infinite',
            }}/>
            <div style={{
              position:'absolute', left:'36%', top:'50%',
              width:140, height:140, borderRadius:'50%',
              background:'radial-gradient(circle, rgba(199,166,106,0.22) 0%, transparent 68%)',
              filter:'blur(40px)', animation:'blob3 12s ease-in-out infinite',
            }}/>
            <div style={{
              position:'absolute', left:'3%', bottom:'-4%',
              width:150, height:110, borderRadius:'50%',
              background:'radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)',
              filter:'blur(44px)',
            }}/>
          </div>

          {/* Rack instance 1 — left area, vertically centered, delay 0s */}
          <svg style={{ position:'absolute', left:'4%', top:'50%', width:220, height:205,
            transform:'translateY(-50%)',
            pointerEvents:'none', animation:'rackCycle 18s 0s ease-in-out infinite', transformOrigin:'center' }}
            viewBox="0 0 760 560">
            {RACK.map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={44} fill="none" stroke={RACK_C[i]} strokeWidth="1.5"/>)}
            <line x1="0" y1="480" x2="700" y2="10" stroke={GOLD} strokeWidth="1" strokeDasharray="14 7" opacity="0.6"/>
          </svg>
          {/* Rack instance 2 — center-left, rotated 140deg, delay 6s */}
          <svg style={{ position:'absolute', left:'26%', top:'50%', width:196, height:186,
            transform:'translateY(-50%) rotate(140deg)',
            pointerEvents:'none', animation:'rackCycle 18s 6s ease-in-out infinite', transformOrigin:'center' }}
            viewBox="0 0 760 560">
            {RACK.map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={44} fill="none" stroke={RACK_C[i]} strokeWidth="1.5"/>)}
            <line x1="0" y1="480" x2="700" y2="10" stroke={GOLD} strokeWidth="1" strokeDasharray="14 7" opacity="0.6"/>
          </svg>
          {/* Rack instance 3 — center, rotated 55deg, delay 12s */}
          <svg style={{ position:'absolute', left:'46%', top:'50%', width:166, height:158,
            transform:'translateY(-50%) rotate(55deg)',
            pointerEvents:'none', animation:'rackCycle 18s 12s ease-in-out infinite', transformOrigin:'center' }}
            viewBox="0 0 760 560">
            {RACK.map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={44} fill="none" stroke={RACK_C[i]} strokeWidth="1.5"/>)}
            <line x1="0" y1="480" x2="700" y2="10" stroke={GOLD} strokeWidth="1" strokeDasharray="14 7" opacity="0.6"/>
          </svg>

          {/* Light streaks — gold on light bg */}
          <div style={{
            position:'absolute', top:'33%', left:0, width:'50%', height:'1.5px',
            background:'linear-gradient(to right,transparent,rgba(154,110,56,0.45),transparent)',
            transform:'rotate(-5deg)', pointerEvents:'none',
            animation:'streakA 12s 1s ease-in-out infinite',
          }}/>
          <div style={{
            position:'absolute', top:'53%', left:0, width:'40%', height:'1px',
            background:'linear-gradient(to right,transparent,rgba(154,110,56,0.28),transparent)',
            transform:'rotate(-3deg)', pointerEvents:'none',
            animation:'streakB 16s 5s ease-in-out infinite',
          }}/>

          {/* Subtle bottom fade — transition to page bg */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:50,
            background:`linear-gradient(to top, ${BG}, transparent)`, pointerEvents:'none' }}/>

          {/* Content */}
          <div style={{ position:'relative', zIndex:5, maxWidth:1280, width:'100%',
            margin:'0 auto', padding:'0 clamp(24px,6vw,80px)' }}>

            <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(199,166,106,0.12)', border:'1px solid rgba(199,166,106,0.34)', color:GOLD_D, fontSize:10.5, fontWeight:800, borderRadius:24, padding:'5px 13px', marginBottom:11, letterSpacing:'0.12em', animation:'fadeUp .5s .05s ease both, softBlink 2.6s .7s ease-in-out infinite' }}>
              FIND YOUR COACH . BILLIARD HUB
            </div>

            <div style={{ overflow:'hidden', paddingBottom:'0.18em' }}>
              <h1 style={{
                fontSize:'clamp(32px,4.5vw,56px)', fontWeight:900, lineHeight:1.0,
                letterSpacing:'-0.05em',
                background:GOLD_G,
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                animation:'lineReveal .72s .10s cubic-bezier(.4,0,.2,1) both',
              }}>
                مربیان
              </h1>
            </div>

            {/* Accent line */}
            <div style={{ transformOrigin:'right', animation:'scaleInX .5s .34s ease both' }}>
              <div style={{
                width:60, height:2, marginTop:8,
                background:GOLD_G,
                boxShadow:'0 0 10px rgba(154,110,56,0.35)',
              }}/>
            </div>

            <p style={{
              fontSize:'clamp(11px,1.2vw,13px)', color:TEXT_S, marginTop:8, maxWidth:360,
              animation:'lineReveal .5s .44s ease both',
            }}>
              آموزش با بهترین‌ها · از مبتدی تا حرفه‌ای
            </p>
          </div>

        </section>

        {/* ══════════════ FILTER ══════════════ */}
        <div id="coaches" style={{
          position:'sticky', top:0, zIndex:50,
          background:'rgba(246,244,240,0.90)',
          backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          borderBottom:'1px solid rgba(17,17,16,0.08)',
          boxShadow:'0 1px 8px rgba(17,17,16,0.05)',
        }}>
          <div style={{ maxWidth:1280, margin:'0 auto', padding:'10px clamp(24px,6vw,80px)',
            display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {/* category pills — first */}
            {([
              { k:'all',      l:'همه مربیان' },
              { k:'snooker',  l:'اسنوکر' },
              { k:'pocket',   l:'پاکت بیلیارد' },
              { k:'highball', l:'هی‌بال' },
            ] as { k:string; l:string }[]).map(({ k, l }) => {
              const active = filter === k
              return (
                <button key={k} className="fpill" onClick={() => setFilter(k)} style={{
                  padding:'8px 16px', borderRadius:11, cursor:'pointer',
                  fontFamily:"'Vazirmatn',Tahoma,sans-serif", fontSize:13,
                  fontWeight: active ? 800 : 600,
                  border: active ? '1px solid rgba(199,166,106,0.40)' : '1px solid rgba(17,17,16,0.10)',
                  background: active ? 'rgba(199,166,106,0.12)' : 'rgba(255,255,255,0.78)',
                  color: active ? '#9A6E38' : TEXT_S,
                  boxShadow: active ? '0 4px 12px rgba(199,166,106,0.16)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
                  backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                }}
                onMouseEnter={e => { if (!active) { const el = e.currentTarget; el.style.background = 'rgba(199,166,106,0.12)'; el.style.borderColor = 'rgba(199,166,106,0.38)'; el.style.color = GOLD_D; el.style.boxShadow = '0 4px 14px rgba(199,166,106,0.18)'; } }}
                onMouseLeave={e => { if (!active) { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.78)'; el.style.borderColor = 'rgba(17,17,16,0.10)'; el.style.color = TEXT_S; el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.9)'; } }}>
                  {l}
                </button>
              )
            })}

            {/* search + toggles — own row under the pills on mobile, right-aligned */}
            <div className="coach-search-group" style={{ marginInlineStart:'auto', display:'flex', alignItems:'center', gap:8 }}>
              {/* search — right */}
              <div style={{ display:'flex', alignItems:'center', gap:8,
                background:'rgba(255,255,255,0.82)', border:'1px solid rgba(17,17,16,0.10)',
                borderRadius:11, padding:'8px 14px', flex:'0 1 280px', minWidth:140,
                boxShadow:'inset 0 1px 0 rgba(255,255,255,0.9)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GOLD_D} strokeWidth="2.2" style={{ flexShrink:0 }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="جستجوی نام مربی یا شهر..."
                  style={{ flex:1, minWidth:0, background:'none', border:'none', outline:'none',
                    fontSize:13, color:TEXT, fontFamily:"'Vazirmatn',Tahoma,sans-serif" }}/>
                {search && (
                  <button onClick={() => setSearch('')} aria-label="پاک کردن جستجو"
                    style={{ background:'none', border:'none', cursor:'pointer', color:TEXT_M, padding:0, display:'flex', flexShrink:0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>

              {/* view toggles — beside search */}
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {([['grid', <svg key="g" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>], ['list', <svg key="l" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>]] as const).map(([v, icon]) => {
                  const on = view === v
                  return (
                    <button key={v} onClick={() => setView(v)} aria-label={v === 'grid' ? 'نمای عادی' : 'نمای لیست'} style={{
                      width:38, height:38, borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      border: on ? '1px solid rgba(199,166,106,0.40)' : '1px solid rgba(17,17,16,0.10)',
                      background: on ? 'rgba(199,166,106,0.12)' : 'rgba(255,255,255,0.78)',
                      color: on ? '#9A6E38' : TEXT_S,
                      boxShadow: on ? '0 4px 12px rgba(199,166,106,0.16)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
                    }}>{icon}</button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ maxWidth:1280, margin:'22px auto 20px', padding:'0 clamp(24px,6vw,80px)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to left,transparent,rgba(154,110,56,0.28))' }}/>
            <span style={{ fontSize:11, fontWeight:800, color:'rgba(154,110,56,0.72)', whiteSpace:'nowrap' }}>
              مربیان فعال
            </span>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(154,110,56,0.28))' }}/>
          </div>
        </div>

        {/* ══════════════ GRID ══════════════ */}
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 clamp(24px,6vw,80px) 64px' }}>
          {coaches.length > 0 ? (
            view === 'list' ? (
              <div className="coach-list-grid">
                {coaches.map((coach, idx) => (
                  <CoachCard key={coach.id} coach={coach} view="list" idx={idx} onStory={() => setOpenStory(coach)} />
                ))}
              </div>
            ) : (
              <div className="g5" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
                {coaches.map((coach, idx) => (
                  <CoachCard key={coach.id} coach={coach} view="grid" idx={idx} onStory={() => setOpenStory(coach)} />
                ))}
              </div>
            )
          ) : (
            <div style={{ textAlign:'center', padding:'60px 0', color:TEXT_M, fontSize:14 }}>
              هیچ مربی با این فیلتر پیدا نشد
            </div>
          )}
        </div>

        {/* ══════════════ BANNER — dark accent section ══════════════ */}
        <div style={{ position:'relative', overflow:'hidden', borderTop:`1px solid rgba(17,17,16,0.06)` }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#111110 0%,#0A0908 100%)' }}/>
          <div style={{ position:'absolute', left:'10%', top:'50%', transform:'translateY(-50%)',
            width:480, height:240, borderRadius:'50%',
            background:'radial-gradient(ellipse, rgba(199,166,106,0.07) 0%, transparent 70%)',
            filter:'blur(40px)', pointerEvents:'none' }}/>
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04, pointerEvents:'none' }}>
            <defs>
              <pattern id="bd" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="1.2" fill={GOLD}/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bd)"/>
          </svg>

          <div style={{ position:'relative', zIndex:5, maxWidth:1280, margin:'0 auto',
            padding:'48px clamp(24px,6vw,80px)',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:24 }}>
            <div>
              <p style={{ fontSize:10.5, fontWeight:700, color:GOLD, letterSpacing:'0.25em', marginBottom:10, textTransform:'uppercase' }}>
                Free Consultation
              </p>
              <h3 style={{ fontSize:'clamp(18px,2.8vw,28px)', fontWeight:800, color:'#F2EDE4',
                letterSpacing:'-0.03em', lineHeight:1.2 }}>
                هنوز مربی مناسب پیدا نکردی؟
              </h3>
              <p style={{ fontSize:13.5, color:'rgba(242,237,228,0.50)', marginTop:8, maxWidth:360 }}>
                متخصصان ما بر اساس سطح و هدفت بهترین مربی را انتخاب می‌کنند
              </p>
            </div>
            <Link href="/contact" className="btnBanner" style={{
              textDecoration:'none', display:'inline-flex', alignItems:'center', gap:10,
              padding:'14px 28px', background:GOLD, color:'#ffffff',
              borderRadius:9, fontSize:14, fontWeight:800, whiteSpace:'nowrap', flexShrink:0,
              boxShadow:'0 4px 18px rgba(199,166,106,0.22)',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .64 2.57 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.57.64A2 2 0 0 1 22 16.92z"/>
              </svg>
              مشاوره رایگان
            </Link>
          </div>
        </div>

      </div>

      {openStory && (
        <ClubStoryModal
          club={{ name:openStory.name, logo:openStory.photo, storyMediaUrl:openStory.storyImage || img(parseInt(openStory.id, 10) || 0), storyText:openStory.bio, badge:'مربی' }}
          onClose={() => setOpenStory(null)}
        />
      )}
    </>
  )
}
