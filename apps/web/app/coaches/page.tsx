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

const GRADS: [string, string][] = [
  ['#C7A66A','#7A4F1E'],['#7C3AED','#4C1D95'],['#2563EB','#1E3A8A'],
  ['#16A34A','#14532D'],['#DC2626','#7F1D1D'],['#B45309','#78350F'],
  ['#6D28D9','#3B0764'],['#0891B2','#164E63'],['#BE185D','#831843'],
  ['#D97706','#78350F'],['#15803D','#14532D'],
]
const getGrad = (id: string): [string, string] =>
  GRADS[parseInt(id, 10) % GRADS.length] ?? ['#C7A66A', '#7A4F1E']

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

/* ════════════════ PAGE ════════════════ */
export default function CoachesPage() {
  const [filter,    setFilter]    = useState('all')
  const [openStory, setOpenStory] = useState<Coach | null>(null)
  const coaches = COACHES.filter(c => filter === 'all' || c.specialty === filter)

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

        /* filter pills */
        .fpill{transition:all .18s cubic-bezier(.4,0,.2,1);}
        .fpill:hover{background:rgba(0,0,0,0.06)!important;}

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
        .btnConnect{transition:background .18s,box-shadow .18s,border-color .18s;}
        .btnConnect:hover{background:rgba(199,166,106,0.10)!important;box-shadow:0 4px 14px rgba(199,166,106,0.22)!important;}

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

      `}</style>

      <div style={{ direction:'rtl', fontFamily:"'Vazirmatn',Tahoma,sans-serif", background:BG, minHeight:'100vh', color:TEXT }}>

        {/* ══════════════ HERO — compact banner ══════════════ */}
        <section style={{ position:'relative', height:'clamp(220px,30vh,340px)', overflow:'hidden', display:'flex', alignItems:'center' }}>

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

            <div style={{ marginTop:16, display:'flex', gap:10, animation:'fadeUp .5s .56s ease both' }}>
              <a href="#coaches" className="btnG" style={{
                textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6,
                padding:'8px 18px', background:GOLD, color:'#ffffff',
                borderRadius:6, fontSize:13, fontWeight:800,
              }}>
                مشاهده مربیان
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                </svg>
              </a>
              <button className="btnO" style={{
                padding:'8px 16px', border:`1px solid rgba(17,17,16,0.18)`,
                borderRadius:6, fontSize:13, fontWeight:600, color:TEXT_S,
                background:'transparent', cursor:'pointer',
                fontFamily:"'Vazirmatn',Tahoma,sans-serif",
              }}>
                مشاوره رایگان
              </button>
            </div>
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
            display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            {([
              { k:'all',      l:'همه مربیان' },
              { k:'pocket',   l:'پاکت بیلیارد' },
              { k:'snooker',  l:'اسنوکر' },
              { k:'highball', l:'هی‌بال' },
            ] as { k:string; l:string }[]).map(({ k, l }) => {
              const active = filter === k
              return (
                <button key={k} className="fpill" onClick={() => setFilter(k)} style={{
                  padding:'7px 16px', borderRadius:100,
                  border:`1px solid ${active ? 'transparent' : 'rgba(17,17,16,0.13)'}`,
                  background: active ? TEXT : 'transparent',
                  color: active ? '#ffffff' : TEXT_S,
                  fontSize:13, fontWeight: active ? 700 : 400,
                  cursor:'pointer', fontFamily:"'Vazirmatn',Tahoma,sans-serif",
                }}>
                  {l}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ maxWidth:1280, margin:'38px auto 24px', padding:'0 clamp(24px,6vw,80px)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to left,transparent,rgba(154,110,56,0.28))' }}/>
            <span style={{ fontSize:10, fontWeight:700, color:'rgba(154,110,56,0.60)', letterSpacing:'0.30em', whiteSpace:'nowrap' }}>
              مربیان فعال
            </span>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(154,110,56,0.28))' }}/>
          </div>
        </div>

        {/* ══════════════ GRID ══════════════ */}
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 clamp(24px,6vw,80px) 64px' }}>
          {coaches.length > 0 ? (
            <div className="g5" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
              {coaches.map((coach, idx) => {
                const sp = SPECS[coach.specialty]
                const [g1, g2] = getGrad(coach.id)
                return (
                  <article key={coach.id} className="ccard" style={{
                    borderRadius:12, overflow:'hidden',
                    background:'#FFFFFF',
                    border:'1px solid rgba(0,0,0,0.08)',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 8px 22px rgba(0,0,0,0.04)',
                    animation:`fadeUp .38s ${(idx * 0.05).toFixed(2)}s ease both`,
                    display:'flex', flexDirection:'column',
                  }}>

                    {/* ── Cover banner (LinkedIn-style dark) ── */}
                    <div style={{ position:'relative', paddingTop:'42%', flexShrink:0,
                      background:'linear-gradient(135deg,#1b2a44 0%,#0e1728 100%)' }}>
                      <div style={{ position:'absolute', inset:0,
                        backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize:'16px 16px' }}/>
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px',
                        background:`linear-gradient(90deg,transparent,${GOLD},transparent)`, opacity:0.55 }}/>
                    </div>

                    {/* ── Avatar (large, centered, overlapping) ── */}
                    <div style={{ display:'flex', justifyContent:'center', marginTop:'-31%' }}>
                      {coach.hasStory && coach.storyImage ? (
                        <button type="button" aria-label="مشاهده استوری"
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setOpenStory(coach) }}
                          className="cavatar"
                          style={{ width:'58%', aspectRatio:'1 / 1', borderRadius:'50%', padding:0, cursor:'pointer',
                            border:`3px solid ${GOLD}`, background:`linear-gradient(135deg,${g1},${g2})`,
                            boxShadow:'0 4px 16px rgba(0,0,0,0.18)', overflow:'hidden',
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ color:'#fff', fontWeight:900, fontSize:'clamp(26px,5vw,40px)', lineHeight:1 }}>{coach.name[0]}</span>
                        </button>
                      ) : (
                        <div className="cavatar"
                          style={{ width:'58%', aspectRatio:'1 / 1', borderRadius:'50%',
                            border:'3px solid #FFFFFF', background:`linear-gradient(135deg,${g1},${g2})`,
                            boxShadow:'0 4px 16px rgba(0,0,0,0.18)', overflow:'hidden',
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ color:'#fff', fontWeight:900, fontSize:'clamp(26px,5vw,40px)', lineHeight:1 }}>{coach.name[0]}</span>
                        </div>
                      )}
                    </div>

                    {/* ── Body ── */}
                    <div style={{ padding:'10px 14px 14px', flex:1, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
                      <h3 style={{ fontSize:16, fontWeight:800, color:TEXT, lineHeight:1.2,
                        letterSpacing:'-0.02em', marginBottom:4 }}>
                        {coach.name}
                      </h3>
                      <p style={{ fontSize:12.5, color:TEXT_S, lineHeight:1.35, marginBottom:9, minHeight:'2.7em',
                        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        مربی {sp?.label ?? 'بیلیارد'}
                      </p>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:13, color:TEXT_M }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span style={{ fontSize:11.5, color:TEXT_S }}>{coach.city}</span>
                      </div>

                      <div style={{ flex:1 }}/>

                      <Link href={`/coaches/${coach.id}`} className="btnConnect" style={{
                        alignSelf:'stretch', textDecoration:'none',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                        padding:'9px 12px', border:`1.5px solid ${GOLD_D}`,
                        borderRadius:24, fontSize:13, fontWeight:800, color:GOLD_D, background:'transparent',
                      }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        مشاهده پروفایل
                      </Link>
                    </div>

                  </article>
                )
              })}
            </div>
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

      {openStory && openStory.storyImage && (
        <ClubStoryModal
          club={{ name:openStory.name, logo:openStory.photo, storyMediaUrl:openStory.storyImage, storyText:openStory.bio, badge:'مربی' }}
          onClose={() => setOpenStory(null)}
        />
      )}
    </>
  )
}
