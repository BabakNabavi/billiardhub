'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ClubStoryModal from '@/components/ClubStoryModal'

/* ─── Tokens ─── */
const GOLD    = '#C7A66A'
const GOLD_D  = '#9A6E38'

/* page colors (light theme) */
const BG      = '#F6F4F0'
const TEXT    = '#111110'
const TEXT_S  = 'rgba(17,17,16,0.52)'
const TEXT_M  = 'rgba(17,17,16,0.28)'

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

/* ════════ HERO POSTERS — dark, billiard themed (slider) ════════ */
const REFEREE_POSTERS = [
  { bg:'linear-gradient(125deg,#0b1322 0%,#17253f 55%,#1e2f4d 100%)', glow:'rgba(199,166,106,0.30)', accent:'rgba(199,166,106,0.55)', motif:'aim'    },
  { bg:'linear-gradient(130deg,#141414 0%,#272524 55%,#1a1a19 100%)', glow:'rgba(199,166,106,0.30)', accent:'rgba(199,166,106,0.55)', motif:'trophy' },
  { bg:'linear-gradient(130deg,#07231a 0%,#0e3a2a 55%,#0a2f22 100%)', glow:'rgba(199,166,106,0.26)', accent:'rgba(199,166,106,0.50)', motif:'cues'   },
  { bg:'linear-gradient(125deg,#1c0e13 0%,#341826 55%,#230f1a 100%)', glow:'rgba(199,166,106,0.26)', accent:'rgba(199,166,106,0.50)', motif:'rack'   },
  { bg:'linear-gradient(130deg,#08201f 0%,#0d3835 55%,#0a2a28 100%)', glow:'rgba(199,166,106,0.26)', accent:'rgba(199,166,106,0.50)', motif:'eight'  },
]

const REFEREE_SLIDES = [
  { title:'داوران رسمی',             sub:'قضاوت دقیق و بی‌طرف' },
  { title:'از ملی تا بین‌المللی',    sub:'داوران دارای مدرک فدراسیون' },
  { title:'مسابقه‌ات را حرفه‌ای کن',  sub:'با داوران مجرب' },
  { title:'داوری تخصصی',             sub:'اسنوکر · پاکت · هی‌بال' },
  { title:'جامعه‌ی داوران',          sub:'بیلیارد هاب، کنارِ تو' },
]

function refereeMotif(motif: string) {
  const s = 168
  if (motif === 'trophy') return (
    <svg width={s} viewBox="0 0 100 104" fill="none" aria-hidden>
      <path d="M32 20 H68 V34 C68 48 60 56 50 56 C40 56 32 48 32 34 Z" stroke={GOLD} strokeWidth="1.8" opacity="0.85"/>
      <path d="M32 24 H22 A9 9 0 0 0 33 41" stroke={GOLD} strokeWidth="1.6" opacity="0.7"/>
      <path d="M68 24 H78 A9 9 0 0 1 67 41" stroke={GOLD} strokeWidth="1.6" opacity="0.7"/>
      <rect x="46" y="56" width="8" height="12" stroke={GOLD} strokeWidth="1.4" opacity="0.7"/>
      <path d="M36 68 H64 L60 80 H40 Z" stroke={GOLD} strokeWidth="1.6" opacity="0.8"/>
      <path d="M50 27 l2.6 5.3 5.8 0.8 -4.2 4.1 1 5.8 -5.2 -2.7 -5.2 2.7 1 -5.8 -4.2 -4.1 5.8 -0.8 Z" fill={GOLD} opacity="0.6"/>
    </svg>
  )
  if (motif === 'aim') return (
    <svg width={s} viewBox="0 0 100 100" fill="none" aria-hidden>
      <circle cx="50" cy="50" r="40" stroke={GOLD} strokeWidth="0.8" opacity="0.22"/>
      <circle cx="50" cy="50" r="28" stroke={GOLD} strokeWidth="1" opacity="0.38"/>
      <circle cx="50" cy="50" r="16" stroke={GOLD} strokeWidth="1.6" opacity="0.9" fill="rgba(0,0,0,0.18)"/>
      {[[50,6],[50,94],[6,50],[94,50]].map((pt,i)=>(<rect key={i} x={pt[0]!-3} y={pt[1]!-3} width="6" height="6" fill={GOLD} opacity="0.58" transform={`rotate(45 ${pt[0]} ${pt[1]})`}/>))}
      <circle cx="44" cy="44" r="3" fill={GOLD} opacity="0.4"/>
    </svg>
  )
  if (motif === 'cues') return (
    <svg width={s} viewBox="0 0 100 100" fill="none" aria-hidden>
      <g stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" opacity="0.78"><line x1="12" y1="86" x2="88" y2="16"/><line x1="12" y1="16" x2="88" y2="86"/></g>
      {[[12,86],[88,16],[12,16],[88,86]].map((pt,i)=>(<circle key={i} cx={pt[0]} cy={pt[1]} r="2.4" fill={GOLD} opacity="0.72"/>))}
      <circle cx="50" cy="51" r="13" fill="rgba(0,0,0,0.35)" stroke={GOLD} strokeWidth="1.6" opacity="0.95"/>
      <circle cx="45" cy="46" r="3" fill={GOLD} opacity="0.5"/>
    </svg>
  )
  if (motif === 'rack') {
    const rows = [[[50,11]],[[41,27],[59,27]],[[32,43],[50,43],[68,43]],[[23,59],[41,59],[59,59],[77,59]],[[14,75],[32,75],[50,75],[68,75],[86,75]]]
    return (
      <svg width={s} viewBox="0 0 100 86" fill="none" aria-hidden>
        {rows.flat().map((pt,i)=>(<circle key={i} cx={pt![0]} cy={pt![1]} r="7.4" stroke={GOLD} strokeWidth="1.3" opacity="0.82"/>))}
        <circle cx="50" cy="11" r="3" fill={GOLD} opacity="0.6"/>
      </svg>
    )
  }
  return (
    <svg width={s} viewBox="0 0 100 100" fill="none" aria-hidden>
      <circle cx="50" cy="50" r="38" stroke={GOLD} strokeWidth="1.8" opacity="0.85" fill="rgba(0,0,0,0.18)"/>
      <circle cx="50" cy="50" r="16" fill={GOLD} opacity="0.9"/>
      <text x="50" y="51" textAnchor="middle" dominantBaseline="central" fontSize="19" fontWeight="800" fill="#1c0e13">8</text>
      <ellipse cx="38" cy="36" rx="7" ry="4" fill={GOLD} opacity="0.22" transform="rotate(-30 38 36)"/>
    </svg>
  )
}

function RefereePoster({ variant }: { variant: number }) {
  const p = REFEREE_POSTERS[variant % REFEREE_POSTERS.length]!
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', background:p.bg }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize:'18px 18px', opacity:0.6 }}/>
      <div style={{ position:'absolute', inset:'-20%', background:`radial-gradient(circle at 30% 40%, ${p.glow}, transparent 55%)` }}/>
      <div style={{ position:'absolute', top:'-25%', bottom:'-25%', left:'52%', width:2, background:`linear-gradient(180deg, transparent, ${p.accent}, transparent)`, transform:'rotate(19deg)', opacity:0.4 }}/>
      <div style={{ position:'absolute', top:'-25%', bottom:'-25%', left:'58%', width:1, background:`linear-gradient(180deg, transparent, ${p.accent}, transparent)`, transform:'rotate(19deg)', opacity:0.2 }}/>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', transform:'translateX(-15%)', opacity:0.6 }}>
        <div style={{ display:'flex', filter:'drop-shadow(0 5px 18px rgba(0,0,0,0.45))' }}>{refereeMotif(p.motif)}</div>
      </div>
    </div>
  )
}

function RefereeHeroSlider() {
  const [active, setActive]   = useState(0)
  const [prevIdx, setPrevIdx] = useState<number | null>(null)
  const activeRef = useRef(0)
  const fadingRef = useRef(false)

  const advance = (idx: number) => {
    if (idx === activeRef.current || fadingRef.current) return
    setPrevIdx(activeRef.current)
    activeRef.current = idx
    fadingRef.current = true
    setActive(idx)
    setTimeout(() => { setPrevIdx(null); fadingRef.current = false }, 850)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeRef.current + 1) % REFEREE_SLIDES.length
      setPrevIdx(activeRef.current)
      activeRef.current = next
      fadingRef.current = true
      setActive(next)
      setTimeout(() => { setPrevIdx(null); fadingRef.current = false }, 850)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <style>{`@keyframes kenBurnsR{0%{transform:scale(1.00) translate(0%,0%)}100%{transform:scale(1.14) translate(-2%,1.5%)}}`}</style>
      <section style={{ position:'relative', height:'clamp(150px,16vw,205px)', overflow:'hidden', background:'#0a0a0a', direction:'rtl' }}>
        {REFEREE_SLIDES.map((_, i) => (
          <div key={i} style={{ position:'absolute', inset:0, opacity: i===active?1:0, transition:'opacity 0.90s ease', zIndex: i===active?2:i===prevIdx?1:0, animation:'kenBurnsR 9s ease-in-out infinite alternate', willChange:'transform' }}>
            <RefereePoster variant={i}/>
          </div>
        ))}
        <div style={{ position:'absolute', inset:0, zIndex:3, background:'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 55%, transparent 100%)' }}/>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'55%', zIndex:3, background:'linear-gradient(to top, rgba(0,0,0,0.80), transparent)' }}/>

        <div style={{ position:'absolute', inset:0, zIndex:4, display:'flex', flexDirection:'column', justifyContent:'center', padding:'clamp(12px,2.4vw,32px) clamp(24px,6vw,80px)' }}>
          <div style={{ maxWidth:1280, width:'100%', margin:'0 auto' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(199,166,106,0.14)', border:'1px solid rgba(199,166,106,0.34)', color:'#D4A843', fontSize:8.9, fontWeight:800, borderRadius:24, padding:'4px 11px', marginBottom:11, letterSpacing:'0.12em', transform:'translateY(-13px)', animation:'softBlink 2.6s .7s ease-in-out infinite' }}>
              KNOW THE REFEREES . BILLIARD HUB
            </div>
            <h1 style={{ fontSize:'clamp(25px,4vw,50px)', fontWeight:900, color:'#fff', margin:'0 0 12px', letterSpacing:'-0.03em', lineHeight:1.08 }}>
              معرفی داوران
            </h1>
            <p style={{ fontSize:'clamp(12px,1.35vw,17px)', color:'#D4A843', margin:'6px 0 0', fontWeight:600, textShadow:'0 0 22px rgba(212,168,67,0.55)' }}>
              معرفی و آشنایی با داوران بیلیارد کشور
            </p>
          </div>
        </div>

        <div style={{ position:'absolute', bottom:14, left:'clamp(24px,6vw,80px)', zIndex:6, display:'flex', gap:7 }}>
          {REFEREE_SLIDES.map((_, i) => (
            <button key={i} onClick={() => advance(i)} aria-label={`اسلاید ${i+1}`} style={{ width: i===active?24:7, height:7, borderRadius:4, border:'none', cursor:'pointer', padding:0, background: i===active?'#C7A66A':'rgba(255,255,255,0.32)', transition:'all 0.4s cubic-bezier(0.22,1,0.36,1)' }}/>
          ))}
        </div>
      </section>
    </>
  )
}

/* ── Avatar with story ring (Instagram gradient, like home) ── */
function RefereeAvatar({ referee, onStory, size }: { referee: Referee; onStory: () => void; size: string }) {
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
        {referee.photo ? (
          <img src={referee.photo} alt={referee.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
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

/* ── Referee card — grid + list ── */
function RefereeCard({ referee, view, idx, onStory }: { referee: Referee; view: 'grid' | 'list'; idx: number; onStory: () => void }) {
  const sp = SPECS[referee.specialty]

  if (view === 'list') {
    return (
      <article className="ccard-list" style={{
        display:'flex', alignItems:'center', gap:14, padding:'11px 13px',
        borderRadius:12, background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.08)',
        boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
        animation:`fadeUp .34s ${(idx * 0.04).toFixed(2)}s ease both`,
      }}>
        <div style={{ position:'relative', zIndex:2 }}>
          <RefereeAvatar referee={referee} onStory={onStory} size="58px"/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:TEXT, lineHeight:1.2, letterSpacing:'-0.02em', marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{referee.name}</h3>
          <p style={{ fontSize:12, color:TEXT_S, marginBottom:5 }}>داور {sp?.label ?? 'بیلیارد'}</p>
          <div style={{ display:'flex', alignItems:'center', gap:5, color:TEXT_M }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize:11.5, color:TEXT_S }}>{referee.city}</span>
          </div>
        </div>
        <Link href={`/referees/${referee.id}`} className="btnConnect" aria-label="مشاهده پروفایل" style={{
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
      {/* cover — default referee poster */}
      <div style={{ position:'relative', paddingTop:'46%', flexShrink:0, overflow:'hidden', background:'linear-gradient(115deg,#0c1424 0%,#17253f 55%,#1e2f4d 100%)' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize:'14px 14px' }}/>
        <div style={{ position:'absolute', left:'-12%', top:'-40%', width:'52%', height:'180%', background:'radial-gradient(ellipse, rgba(199,166,106,0.20) 0%, transparent 64%)', filter:'blur(14px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'-20%', bottom:'-20%', left:'56%', width:'1px', background:'linear-gradient(180deg,transparent,rgba(199,166,106,0.5),transparent)', transform:'rotate(-12deg)', pointerEvents:'none' }}/>
        <img src="/images/Logo/BH.png" alt="" style={{ position:'absolute', top:'9px', insetInlineEnd:'10px', height:'22%', width:'auto', opacity:0.9 }}/>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,transparent,${GOLD},transparent)`, opacity:0.55 }}/>
      </div>
      {/* avatar */}
      <div style={{ display:'flex', justifyContent:'center', marginTop:'-31%', position:'relative', zIndex:2 }}>
        <RefereeAvatar referee={referee} onStory={onStory} size="58%"/>
      </div>
      {/* body */}
      <div style={{ padding:'12px 14px 18px', flex:1, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
        <h3 style={{ fontSize:16, fontWeight:800, color:TEXT, lineHeight:1.2, letterSpacing:'-0.02em', marginBottom:4 }}>{referee.name}</h3>
        <p style={{ fontSize:12.5, color:TEXT_S, lineHeight:1.35, marginBottom:9, minHeight:'2.7em', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>داور {sp?.label ?? 'بیلیارد'}</p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:13, color:TEXT_M }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize:11.5, color:TEXT_S }}>{referee.city}</span>
        </div>
        <div style={{ flex:1 }}/>
        <Link href={`/referees/${referee.id}`} className="btnConnect" style={{ alignSelf:'stretch', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 12px', border:'1px solid rgba(199,166,106,0.34)', borderRadius:10, fontSize:13, fontWeight:700, color:'#9A6E38', background:'rgba(199,166,106,0.12)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          مشاهده پروفایل
        </Link>
      </div>
    </article>
  )
}

/* ════════════════ PAGE ════════════════ */
export default function RefereesPage() {
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [view,      setView]      = useState<'grid' | 'list'>('grid')
  const [openStory, setOpenStory] = useState<Referee | null>(null)
  const q = search.trim()
  const referees = REFEREES.filter(r =>
    (filter === 'all' || r.specialty === filter) &&
    (q === '' || r.name.includes(q) || r.city.includes(q))
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
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

        {/* ══════════════ HERO — poster slider ══════════════ */}
        <RefereeHeroSlider />

        {/* ══════════════ FILTER ══════════════ */}
        <div id="referees" style={{
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
              { k:'all',      l:'همه داوران' },
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
                  placeholder="جستجوی نام داور یا شهر..."
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
              داوران فعال
            </span>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(154,110,56,0.28))' }}/>
          </div>
        </div>

        {/* ══════════════ GRID ══════════════ */}
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 clamp(24px,6vw,80px) 64px' }}>
          {referees.length > 0 ? (
            view === 'list' ? (
              <div className="coach-list-grid">
                {referees.map((referee, idx) => (
                  <RefereeCard key={referee.id} referee={referee} view="list" idx={idx} onStory={() => setOpenStory(referee)} />
                ))}
              </div>
            ) : (
              <div className="g5" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
                {referees.map((referee, idx) => (
                  <RefereeCard key={referee.id} referee={referee} view="grid" idx={idx} onStory={() => setOpenStory(referee)} />
                ))}
              </div>
            )
          ) : (
            <div style={{ textAlign:'center', padding:'60px 0', color:TEXT_M, fontSize:14 }}>
              هیچ داوری با این فیلتر پیدا نشد
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

      {openStory && (
        <ClubStoryModal
          club={{ name:openStory.name, logo:openStory.photo, storyMediaUrl:openStory.storyImage || img(parseInt(openStory.id, 10) || 0), storyText:openStory.bio, badge:'داور' }}
          onClose={() => setOpenStory(null)}
        />
      )}
    </>
  )
}
