'use client'
import { useState } from 'react'
import Link from 'next/link'
import ClubStoryModal from '@/components/ClubStoryModal'

/* ─── Tokens ─── */
const GOLD    = '#C7A66A'
const GOLD_D  = '#9A6E38'
const GOLD_G  = 'linear-gradient(135deg,#7A4F10 0%,#C7A66A 50%,#8A6020 100%)'

const BG      = '#F6F4F0'
const TEXT    = '#111110'
const TEXT_S  = 'rgba(17,17,16,0.52)'
const TEXT_M  = 'rgba(17,17,16,0.28)'

const CARD    = '#0E0D0B'
const CW      = '#F2EDE4'
const CW_D    = 'rgba(242,237,228,0.52)'

const SPECS: Record<string, { label: string; color: string; glow: string }> = {
  snooker:  { label: 'اسنوکر',       color: '#7C3AED', glow: 'rgba(124,58,237,0.30)' },
  pocket:   { label: 'پاکت بیلیارد', color: GOLD_D,    glow: 'rgba(154,110,56,0.30)' },
  highball: { label: 'هی‌بال',       color: '#C2410C', glow: 'rgba(194,65,12,0.30)'  },
}

const IMGS: string[] = [
  '/images/shop/snooker-table.jpg',
  '/images/shop/cue_billiard_2.jpg',
  '/images/shop/Ball-1.jpg',
  '/images/shop/pool_chalk_1.jpg',
]
const img = (i: number) => IMGS[i % IMGS.length] ?? IMGS[0]!

const GRADS: [string, string][] = [
  ['#C7A66A','#7A4F1E'],['#0891B2','#164E63'],['#7C3AED','#4C1D95'],
  ['#2563EB','#1E3A8A'],['#DC2626','#7F1D1D'],['#16A34A','#14532D'],
  ['#6D28D9','#3B0764'],['#B45309','#78350F'],['#BE185D','#831843'],
]
const getGrad = (id: string): [string, string] =>
  GRADS[parseInt(id, 10) % GRADS.length] ?? ['#C7A66A', '#7A4F1E']

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

interface Referee {
  id: string; name: string; specialty: string; city: string
  experience: number; grade: string; gradeColor: string
  hasStory: boolean; storyImage: string; bio: string; photo: string
}

const REFEREES: Referee[] = [
  { id:'1',  name:'کاوه طالبی',    specialty:'snooker',  city:'تهران',  experience:20, grade:'داور بین‌المللی', gradeColor:'#7C3AED', hasStory:true,  storyImage:img(0), bio:'داور بین‌المللی WPBSA با ۲۰ سال سابقه — قضاوت ۴۵ مسابقه بین‌المللی اسنوکر',   photo:'' },
  { id:'2',  name:'نیلوفر حسینی', specialty:'pocket',   city:'مشهد',   experience:12, grade:'داور ملی',        gradeColor:GOLD_D,    hasStory:true,  storyImage:img(1), bio:'داور ملی پاکت بیلیارد — پیشگام داوری بانوان با ۹۵ مسابقه ملی',               photo:'' },
  { id:'3',  name:'رامین فرهادی', specialty:'highball', city:'اصفهان', experience:8,  grade:'داور ملی',        gradeColor:GOLD_D,    hasStory:false, storyImage:'',     bio:'متخصص هی‌بال — عضو کمیته داوران فدراسیون بیلیارد و اسنوکر ایران',             photo:'' },
  { id:'4',  name:'سحر محمدی',    specialty:'pocket',   city:'تهران',  experience:5,  grade:'داور درجه A',     gradeColor:'#C2410C', hasStory:true,  storyImage:img(3), bio:'داور جوان پاکت بیلیارد — قضاوت ۳۰+ مسابقه استانی و کشوری',                  photo:'' },
  { id:'5',  name:'حامد موسوی',   specialty:'snooker',  city:'تبریز',  experience:15, grade:'داور بین‌المللی', gradeColor:'#7C3AED', hasStory:true,  storyImage:img(0), bio:'داور ارشد IBSF — نماینده ایران در قهرمانی آسیا ۱۴۰۲ و لیگ برتر',             photo:'' },
  { id:'6',  name:'علی رضایی',    specialty:'highball', city:'شیراز',  experience:7,  grade:'داور ملی',        gradeColor:GOLD_D,    hasStory:false, storyImage:'',     bio:'داور هی‌بال — قضاوت لیگ برتر هی‌بال و مسابقات جوانان فدراسیون',               photo:'' },
  { id:'7',  name:'مینا صالحی',   specialty:'pocket',   city:'کرج',    experience:3,  grade:'داور درجه B',     gradeColor:'#16A34A', hasStory:false, storyImage:'',     bio:'داور درجه B پاکت بیلیارد — فعال در مسابقات استانی البرز و تهران',             photo:'' },
  { id:'8',  name:'کیان نوری',    specialty:'snooker',  city:'تهران',  experience:10, grade:'داور ملی',        gradeColor:GOLD_D,    hasStory:true,  storyImage:img(3), bio:'داور ملی اسنوکر — عضو هیئت داوران کنفدراسیون ACBS با تجربه ۱۰ ساله',        photo:'' },
]

function StoryRing({ referee, size, onOpen }: { referee: Referee; size: number; onOpen: () => void }) {
  const [g1, g2] = getGrad(referee.id)
  return (
    <button onClick={e => { e.preventDefault(); e.stopPropagation(); onOpen() }}
      style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
      <div style={{
        width:size, height:size, borderRadius:'50%',
        background:'linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)',
        padding: size > 40 ? 3 : 2,
        boxShadow:'0 0 14px rgba(214,41,118,0.50)',
      }}>
        <div style={{
          width:'100%', height:'100%', borderRadius:'50%',
          border:'2px solid rgba(7,6,4,0.60)',
          background:`linear-gradient(135deg,${g1},${g2})`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontWeight:900, fontSize: size > 40 ? 19 : 13,
          overflow:'hidden',
        }}>
          {referee.name[0]}
        </div>
      </div>
    </button>
  )
}

/* ════════════════ PAGE ════════════════ */
export default function RefereesPage() {
  const [filter,    setFilter]    = useState('all')
  const [openStory, setOpenStory] = useState<Referee | null>(null)
  const refs = REFEREES.filter(r => filter === 'all' || r.specialty === filter)

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}

        @keyframes blob1{0%,100%{transform:translate(0,0) scale(1);}25%{transform:translate(-28px,-20px) scale(1.05);}55%{transform:translate(-10px,26px) scale(0.96);}80%{transform:translate(20px,-12px) scale(1.02);}}
        @keyframes blob2{0%,100%{transform:translate(0,0) scale(1);}20%{transform:translate(32px,20px) scale(1.04);}55%{transform:translate(44px,-26px) scale(0.92);}75%{transform:translate(10px,30px) scale(1.06);}}
        @keyframes blob3{0%,100%{transform:translate(0,0);}50%{transform:translate(-26px,-36px) scale(1.10);}}
        @keyframes rackCycle{0%{opacity:0;}6%{opacity:.46;}32%{opacity:.46;}40%{opacity:0;}100%{opacity:0;}}
        @keyframes streakA{0%{opacity:0;transform:translateX(-130%) skewX(-18deg);}15%{opacity:1;}85%{opacity:1;}100%{opacity:0;transform:translateX(230%) skewX(-18deg);}}
        @keyframes streakB{0%{opacity:0;transform:translateX(-120%) skewX(-14deg);}15%{opacity:.5;}85%{opacity:.5;}100%{opacity:0;transform:translateX(250%) skewX(-14deg);}}
        @keyframes lineReveal{from{clip-path:inset(0 0 105% 0);transform:translateY(14px);opacity:0;}to{clip-path:inset(0 0 -25% 0);transform:none;opacity:1;}}
        @keyframes scaleInX{from{opacity:0;transform:scaleX(0)}to{opacity:1;transform:scaleX(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

        .fpill{transition:all .18s cubic-bezier(.4,0,.2,1);}
        .fpill:hover{background:rgba(0,0,0,0.06)!important;}

        .rcard{cursor:pointer;transition:transform .30s cubic-bezier(.4,0,.2,1),box-shadow .30s;position:relative;}
        .rcard:hover{transform:translateY(-5px);box-shadow:0 0 0 1.5px rgba(199,166,106,0.55),0 0 24px rgba(199,166,106,0.12),0 20px 48px rgba(0,0,0,0.18)!important;}
        .rphoto{transition:transform .60s cubic-bezier(.4,0,.2,1),filter .5s;}
        .rcard:hover .rphoto{transform:scale(1.09);filter:brightness(1.06) saturate(1.08);}
        .ravatar{transition:transform .40s cubic-bezier(.4,0,.2,1);}
        .rcard:hover .ravatar{transform:scale(1.04);}
        .rdrawer{max-height:0;overflow:hidden;transition:max-height .36s cubic-bezier(.4,0,.2,1);}
        .rcard:hover .rdrawer{max-height:130px;}
        .rcard::before{content:'';position:absolute;inset:0;z-index:4;border-radius:inherit;pointer-events:none;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.06) 50%,transparent 62%);opacity:0;transition:opacity .25s;}
        .rcard:hover::before{opacity:1;}

        .btnG{transition:background .18s,transform .14s,box-shadow .18s;}
        .btnG:hover{background:${GOLD_D}!important;transform:translateY(-1px);box-shadow:0 8px 20px rgba(199,166,106,0.28)!important;}
        .btnO{transition:background .18s,color .18s,border-color .18s;}
        .btnO:hover{background:${TEXT}!important;color:#fff!important;border-color:${TEXT}!important;}
        .btnGO{transition:background .18s,box-shadow .18s;}
        .btnGO:hover{background:rgba(199,166,106,0.14)!important;box-shadow:inset 0 0 0 1px rgba(199,166,106,0.60)!important;}
        .btnBanner{transition:background .18s,transform .14s,box-shadow .18s;}
        .btnBanner:hover{background:${GOLD_D}!important;transform:translateY(-2px);box-shadow:0 10px 28px rgba(199,166,106,0.32)!important;}

        @media(max-width:1100px){.g5{grid-template-columns:repeat(3,1fr)!important;}}
        @media(max-width:700px) {.g5{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:480px) {.g5{grid-template-columns:repeat(2,1fr)!important;}}

        @media(hover:none),(max-width:700px){
          .rdrawer{max-height:130px!important;}
        }
      `}</style>

      <div style={{ direction:'rtl', fontFamily:"'Vazirmatn',Tahoma,sans-serif", background:BG, minHeight:'100vh', color:TEXT }}>

        {/* ══════════════ HERO ══════════════ */}
        <section style={{ position:'relative', height:'clamp(220px,30vh,340px)', overflow:'hidden', display:'flex', alignItems:'center' }}>

          {/* Aurora blobs */}
          <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
            <div style={{ position:'absolute', right:'-8%', top:'8%', width:280, height:280, borderRadius:'50%',
              background:'radial-gradient(circle, rgba(199,166,106,0.38) 0%, rgba(199,166,106,0.12) 45%, transparent 70%)',
              filter:'blur(55px)', animation:'blob1 15s ease-in-out infinite' }}/>
            <div style={{ position:'absolute', left:'-6%', top:'20%', width:240, height:240, borderRadius:'50%',
              background:'radial-gradient(circle, rgba(8,145,178,0.22) 0%, rgba(8,145,178,0.07) 50%, transparent 72%)',
              filter:'blur(52px)', animation:'blob2 19s ease-in-out infinite' }}/>
            <div style={{ position:'absolute', left:'36%', top:'50%', width:140, height:140, borderRadius:'50%',
              background:'radial-gradient(circle, rgba(199,166,106,0.22) 0%, transparent 68%)',
              filter:'blur(40px)', animation:'blob3 12s ease-in-out infinite' }}/>
            <div style={{ position:'absolute', left:'3%', bottom:'-4%', width:150, height:110, borderRadius:'50%',
              background:'radial-gradient(circle, rgba(8,145,178,0.14) 0%, transparent 70%)',
              filter:'blur(44px)' }}/>
          </div>

          {/* Rack instance 1 */}
          <svg style={{ position:'absolute', left:'4%', top:'50%', width:220, height:205,
            transform:'translateY(-50%)', pointerEvents:'none',
            animation:'rackCycle 18s 0s ease-in-out infinite', transformOrigin:'center' }}
            viewBox="0 0 760 560">
            {RACK.map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={44} fill="none" stroke={RACK_C[i]} strokeWidth="1.5"/>)}
            <line x1="0" y1="480" x2="700" y2="10" stroke={GOLD} strokeWidth="1" strokeDasharray="14 7" opacity="0.6"/>
          </svg>
          {/* Rack instance 2 */}
          <svg style={{ position:'absolute', left:'26%', top:'50%', width:196, height:186,
            transform:'translateY(-50%) rotate(140deg)', pointerEvents:'none',
            animation:'rackCycle 18s 6s ease-in-out infinite', transformOrigin:'center' }}
            viewBox="0 0 760 560">
            {RACK.map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={44} fill="none" stroke={RACK_C[i]} strokeWidth="1.5"/>)}
            <line x1="0" y1="480" x2="700" y2="10" stroke={GOLD} strokeWidth="1" strokeDasharray="14 7" opacity="0.6"/>
          </svg>
          {/* Rack instance 3 */}
          <svg style={{ position:'absolute', left:'46%', top:'50%', width:166, height:158,
            transform:'translateY(-50%) rotate(55deg)', pointerEvents:'none',
            animation:'rackCycle 18s 12s ease-in-out infinite', transformOrigin:'center' }}
            viewBox="0 0 760 560">
            {RACK.map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={44} fill="none" stroke={RACK_C[i]} strokeWidth="1.5"/>)}
            <line x1="0" y1="480" x2="700" y2="10" stroke={GOLD} strokeWidth="1" strokeDasharray="14 7" opacity="0.6"/>
          </svg>

          {/* Light streaks */}
          <div style={{ position:'absolute', top:'33%', left:0, width:'50%', height:'1.5px',
            background:'linear-gradient(to right,transparent,rgba(154,110,56,0.45),transparent)',
            transform:'rotate(-5deg)', pointerEvents:'none',
            animation:'streakA 12s 1s ease-in-out infinite' }}/>
          <div style={{ position:'absolute', top:'53%', left:0, width:'40%', height:'1px',
            background:'linear-gradient(to right,transparent,rgba(154,110,56,0.28),transparent)',
            transform:'rotate(-3deg)', pointerEvents:'none',
            animation:'streakB 16s 5s ease-in-out infinite' }}/>

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
                داوران
              </h1>
            </div>

            <div style={{ transformOrigin:'right', animation:'scaleInX .5s .34s ease both' }}>
              <div style={{ width:60, height:2, marginTop:8, background:GOLD_G,
                boxShadow:'0 0 10px rgba(154,110,56,0.35)' }}/>
            </div>

            <p style={{ fontSize:'clamp(11px,1.2vw,13px)', color:TEXT_S, marginTop:8, maxWidth:360,
              animation:'lineReveal .5s .44s ease both' }}>
              قضاوت دقیق · از ملی تا بین‌المللی
            </p>

            <div style={{ marginTop:16, display:'flex', gap:10, animation:'fadeUp .5s .56s ease both' }}>
              <a href="#referees" className="btnG" style={{
                textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6,
                padding:'8px 18px', background:GOLD, color:'#ffffff',
                borderRadius:6, fontSize:13, fontWeight:800,
              }}>
                مشاهده داوران
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
                تماس با فدراسیون
              </button>
            </div>
          </div>

        </section>

        {/* ══════════════ FILTER ══════════════ */}
        <div id="referees" style={{
          position:'sticky', top:0, zIndex:50,
          background:'rgba(246,244,240,0.90)',
          backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          borderBottom:'1px solid rgba(17,17,16,0.08)',
          boxShadow:'0 1px 8px rgba(17,17,16,0.05)',
        }}>
          <div style={{ maxWidth:1280, margin:'0 auto', padding:'10px clamp(24px,6vw,80px)',
            display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            {([
              { k:'all',      l:'همه داوران' },
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

        {/* Divider */}
        <div style={{ maxWidth:1280, margin:'38px auto 24px', padding:'0 clamp(24px,6vw,80px)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to left,transparent,rgba(154,110,56,0.28))' }}/>
            <span style={{ fontSize:10, fontWeight:700, color:'rgba(154,110,56,0.60)', letterSpacing:'0.30em', whiteSpace:'nowrap' }}>
              داوران فعال
            </span>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(154,110,56,0.28))' }}/>
          </div>
        </div>

        {/* ══════════════ GRID ══════════════ */}
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 clamp(24px,6vw,80px) 64px' }}>
          {refs.length > 0 ? (
            <div className="g5" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
              {refs.map((referee, idx) => {
                const sp = SPECS[referee.specialty]
                const [g1, g2] = getGrad(referee.id)
                return (
                  <article key={referee.id} className="rcard" style={{
                    borderRadius:14, overflow:'hidden',
                    background:CARD,
                    boxShadow:'0 4px 24px rgba(0,0,0,0.14)',
                    animation:`fadeUp .38s ${(idx * 0.05).toFixed(2)}s ease both`,
                    display:'flex', flexDirection:'column',
                  }}>

                    {/* ── Photo zone ── */}
                    <div style={{ position:'relative', paddingTop:'115%', flexShrink:0, overflow:'hidden' }}>
                      {/* Gradient background */}
                      <div style={{ position:'absolute', inset:0,
                        background:`linear-gradient(145deg,${g1}55 0%,${g2}CC 100%)` }}/>
                      {/* Dot pattern overlay */}
                      <div style={{ position:'absolute', inset:0,
                        backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
                        backgroundSize:'22px 22px' }}/>

                      {/* Real photo */}
                      {referee.photo ? (
                        <img className="rphoto" src={referee.photo} alt={referee.name}
                          style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                            objectFit:'cover', objectPosition:'center top' }}/>
                      ) : (
                        /* Avatar placeholder */
                        <div className="ravatar" style={{ position:'absolute', inset:0,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <div style={{ position:'absolute', width:88, height:88, borderRadius:'50%',
                            border:'1px solid rgba(255,255,255,0.12)' }}/>
                          <div style={{
                            width:70, height:70, borderRadius:'50%',
                            background:'rgba(255,255,255,0.10)',
                            border:'2px solid rgba(255,255,255,0.22)',
                            backdropFilter:'blur(8px)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:26, fontWeight:900, color:'rgba(255,255,255,0.88)',
                            boxShadow:'0 8px 28px rgba(0,0,0,0.30)',
                            letterSpacing:'-0.02em', lineHeight:1,
                          }}>
                            {referee.name[0]}
                          </div>
                        </div>
                      )}

                      {/* Story ring */}
                      {referee.hasStory && referee.storyImage && (
                        <div style={{ position:'absolute', top:10, right:10, zIndex:5 }}>
                          <StoryRing referee={referee} size={34} onOpen={() => setOpenStory(referee)}/>
                        </div>
                      )}

                      {/* Bottom blend into card */}
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:52,
                        background:`linear-gradient(to bottom,transparent,${CARD})`, zIndex:2 }}/>
                    </div>

                    {/* ── Info zone ── */}
                    <div style={{ padding:'12px 14px 13px', flex:1, display:'flex', flexDirection:'column' }}>
                      {/* Grade badge */}
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4,
                        fontSize:9.5, fontWeight:700, color:referee.gradeColor, letterSpacing:'0.12em', marginBottom:5 }}>
                        <span style={{ width:4, height:4, borderRadius:'50%', background:referee.gradeColor,
                          boxShadow:`0 0 5px ${referee.gradeColor}60`, flexShrink:0 }}/>
                        {referee.grade}
                      </span>

                      <h3 style={{ fontSize:15.5, fontWeight:900, color:CW, lineHeight:1.15,
                        letterSpacing:'-0.02em', marginBottom:5 }}>
                        {referee.name}
                      </h3>

                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:11, color:CW_D }}>{referee.city}</span>
                        <span style={{ fontSize:11, color:CW_D, display:'flex', alignItems:'center', gap:3 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {referee.experience}س
                        </span>
                      </div>

                      {/* Drawer */}
                      <div className="rdrawer">
                        <div style={{ height:'1px',
                          background:'linear-gradient(to left,transparent,rgba(199,166,106,0.28),transparent)',
                          margin:'9px 0' }}/>
                        <div style={{ display:'flex', gap:8, fontSize:11, color:CW_D, marginBottom:8, alignItems:'center' }}>
                          {sp && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:3,
                              fontSize:10, color:sp.color, fontWeight:700 }}>
                              <span style={{ width:4, height:4, borderRadius:'50%', background:sp.color, flexShrink:0 }}/>
                              {sp.label}
                            </span>
                          )}
                        </div>
                        <Link href={`/referees/${referee.id}`} className="btnGO" style={{
                          textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                          padding:'8px 10px', border:'1px solid rgba(199,166,106,0.26)',
                          borderRadius:6, fontSize:11.5, fontWeight:700, color:GOLD,
                          background:'rgba(199,166,106,0.06)',
                        }}>
                          مشاهده پروفایل
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </Link>
                      </div>
                    </div>

                  </article>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'60px 0', color:TEXT_M, fontSize:14 }}>
              هیچ داوری با این فیلتر پیدا نشد
            </div>
          )}
        </div>

        {/* ══════════════ BANNER ══════════════ */}
        <div style={{ position:'relative', overflow:'hidden', borderTop:`1px solid rgba(17,17,16,0.06)` }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#111110 0%,#0A0908 100%)' }}/>
          <div style={{ position:'absolute', left:'10%', top:'50%', transform:'translateY(-50%)',
            width:480, height:240, borderRadius:'50%',
            background:'radial-gradient(ellipse, rgba(199,166,106,0.07) 0%, transparent 70%)',
            filter:'blur(40px)', pointerEvents:'none' }}/>
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04, pointerEvents:'none' }}>
            <defs>
              <pattern id="rd" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="1.2" fill={GOLD}/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rd)"/>
          </svg>

          <div style={{ position:'relative', zIndex:5, maxWidth:1280, margin:'0 auto',
            padding:'48px clamp(24px,6vw,80px)',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:24 }}>
            <div>
              <p style={{ fontSize:10.5, fontWeight:700, color:GOLD, letterSpacing:'0.25em', marginBottom:10, textTransform:'uppercase' }}>
                Certified Referees
              </p>
              <h3 style={{ fontSize:'clamp(18px,2.8vw,28px)', fontWeight:800, color:'#F2EDE4',
                letterSpacing:'-0.03em', lineHeight:1.2 }}>
                به داور رسمی نیاز دارید؟
              </h3>
              <p style={{ fontSize:13.5, color:'rgba(242,237,228,0.50)', marginTop:8, maxWidth:360 }}>
                داوران دارای مدرک فدراسیون برای مسابقات و رویدادهای شما
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
              درخواست داور
            </Link>
          </div>
        </div>

      </div>

      {openStory && openStory.storyImage && (
        <ClubStoryModal
          club={{ name:openStory.name, logo:openStory.photo, storyMediaUrl:openStory.storyImage, storyText:openStory.bio, badge:'داور' }}
          onClose={() => setOpenStory(null)}
        />
      )}
    </>
  )
}
