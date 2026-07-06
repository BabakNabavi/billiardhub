'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'

// ── Design tokens ─────────────────────────────────────────────
const GOLD    = '#C7A66A'
const GOLD_D  = '#A07840'
const TEXT    = '#1C1C1A'
const TEXT_S  = 'rgba(28,28,26,0.52)'
const TEXT_M  = 'rgba(28,28,26,0.32)'
const LQ_BG   = 'rgba(255,255,255,0.82)'
const LQ_BOR  = '1px solid rgba(255,255,255,0.85)'
const LQ_SHAD = 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)'

// ── Specialty config ──────────────────────────────────────────
const SPECS: Record<string, { label: string; color: string; bg: string }> = {
  snooker:  { label: 'اسنوکر',        color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  pocket:   { label: 'پاکت بیلیارد',  color: GOLD,      bg: 'rgba(199,166,106,0.12)' },
  highball: { label: 'هی‌بال',         color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  carom:    { label: 'کارامبول',       color: '#16A34A', bg: 'rgba(22,163,74,0.10)'  },
  other:    { label: 'سایر',           color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
}

const FILTER_SPECS = [
  { id: 'all',      label: 'همه',           color: TEXT_M },
  { id: 'snooker',  label: 'اسنوکر',         color: '#7C3AED' },
  { id: 'pocket',   label: 'پاکت بیلیارد',   color: GOLD      },
  { id: 'highball', label: 'هی‌بال',          color: '#F59E0B' },
  { id: 'carom',    label: 'کارامبول',        color: '#16A34A' },
]

const CITIES   = ['همه', 'تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز']
const SORT_OPT = [
  { v: 'rating',     l: 'بهترین امتیاز'  },
  { v: 'experience', l: 'بیشترین سابقه'  },
  { v: 'price',      l: 'ارزان‌ترین'      },
] as const

const AVATAR_GRAD: [string, string][] = [
  ['#C7A66A','#A07840'],
  ['#7C3AED','#5B21B6'],
  ['#2563EB','#1D4ED8'],
  ['#B8936B','#8B6B3D'],
  ['#16A34A','#15803D'],
  ['#DC2626','#B91C1C'],
]

// ── Types ─────────────────────────────────────────────────────
interface Coach {
  id: string; name: string; specialty: string; city: string
  experience: number; rating: number; reviewCount: number; sessionPrice: number
  badge: string; badgeColor: string; verified: boolean
  hasStory: boolean; storyImage: string
  bio: string; certifications: string; students: number
  achievements: string[]
}

// ── Mock data ─────────────────────────────────────────────────
const COACHES: Coach[] = [
  {
    id:'1', name:'احمد رضایی', specialty:'snooker', city:'تهران',
    experience:15, rating:4.9, reviewCount:312, sessionPrice:500000,
    badge:'مربی بین‌المللی', badgeColor:'#7C3AED', verified:true,
    hasStory:true, storyImage:'/images/shop/snooker-table.jpg',
    bio:'مربی ملی‌پوش با ۱۵ سال سابقه تدریس در فدراسیون جهانی بیلیارد',
    certifications:'مدرک A فدراسیون جهانی WPBSA',
    students:240, achievements:['قهرمانی آسیا ۱۳۹۶','تیم ملی ۱۰ دوره'],
  },
  {
    id:'2', name:'حسین نوری', specialty:'snooker', city:'مشهد',
    experience:12, rating:4.7, reviewCount:187, sessionPrice:350000,
    badge:'مربی ملی', badgeColor:GOLD, verified:true,
    hasStory:true, storyImage:'/images/shop/cue_billiard_2.jpg',
    bio:'قهرمان آسیا و مربی دسته برتر با سابقه درخشان در مسابقات بین‌المللی',
    certifications:'مدرک B فدراسیون WPBSA',
    students:180, achievements:['قهرمانی آسیا ۱۳۹۸'],
  },
  {
    id:'3', name:'مریم کاظمی', specialty:'pocket', city:'اصفهان',
    experience:8, rating:4.8, reviewCount:143, sessionPrice:280000,
    badge:'مربی ملی', badgeColor:GOLD, verified:true,
    hasStory:false, storyImage:'',
    bio:'مربی بانوان و متخصص پاکت بیلیارد با سبک تدریس حرفه‌ای و صبور',
    certifications:'مدرک ملی B فدراسیون',
    students:95, achievements:['قهرمانی کشوری بانوان ۱۴۰۱'],
  },
  {
    id:'4', name:'سینا محمدی', specialty:'pocket', city:'شیراز',
    experience:5, rating:4.5, reviewCount:76, sessionPrice:200000,
    badge:'مربی جوان', badgeColor:'#16A34A', verified:true,
    hasStory:true, storyImage:'/images/shop/Ball-1.jpg',
    bio:'مربی جوان و قهرمان لیگ برتر با انرژی بالا و روش‌های نوین تدریس',
    certifications:'مدرک C فدراسیون ایران',
    students:52, achievements:['قهرمانی لیگ برتر جوانان ۱۴۰۲'],
  },
  {
    id:'5', name:'علی حسینی', specialty:'highball', city:'تهران',
    experience:10, rating:4.6, reviewCount:98, sessionPrice:320000,
    badge:'مربی ملی', badgeColor:GOLD, verified:true,
    hasStory:false, storyImage:'',
    bio:'متخصص هی‌بال و مربی تیم ملی جوانان با روش‌های تخصصی آموزش',
    certifications:'مدرک A فدراسیون ایران',
    students:120, achievements:['مربی سال ۱۴۰۰','تیم ملی جوانان'],
  },
  {
    id:'6', name:'رضا ابراهیمی', specialty:'carom', city:'تبریز',
    experience:18, rating:4.9, reviewCount:256, sessionPrice:450000,
    badge:'مربی بین‌المللی', badgeColor:'#7C3AED', verified:true,
    hasStory:true, storyImage:'/images/shop/pool_chalk_1.jpg',
    bio:'پیشکسوت کارامبول با ۱۸ سال تجربه تدریس در کشورهای خاورمیانه',
    certifications:'مدرک A فدراسیون جهانی UMB',
    students:310, achievements:['قهرمانی آسیا ۱۳۹۲','مدرب برتر آسیا ۱۳۹۸'],
  },
]

// ── Helpers ───────────────────────────────────────────────────
function getGrad(id: string): [string,string] {
  const n = parseInt(id, 10) % AVATAR_GRAD.length
  return AVATAR_GRAD[n] ?? ['#C7A66A','#A07840']
}

function fmt(n: number) {
  return n.toLocaleString('fa-IR')
}

// ── Stars ─────────────────────────────────────────────────────
function Stars({ rating, small }: { rating: number; small?: boolean }) {
  const sz = small ? 11 : 13
  return (
    <div style={{ display:'flex', gap:2, alignItems:'center' }}>
      {[1,2,3,4,5].map(i => {
        const full = i <= Math.floor(rating)
        const half = !full && i - 0.5 <= rating
        return (
          <svg key={i} width={sz} height={sz} viewBox="0 0 24 24"
            fill={full ? '#F59E0B' : half ? 'url(#h)' : 'none'}
            stroke="#F59E0B" strokeWidth={full || half ? 0 : 1.5}>
            {half && <defs><linearGradient id="h" x1="0" x2="1"><stop offset="50%" stopColor="#F59E0B"/><stop offset="50%" stopColor="transparent"/></linearGradient></defs>}
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        )
      })}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ coach, size, ring }: { coach: Coach; size: number; ring?: boolean }) {
  const [c1, c2] = getGrad(coach.id)
  const initial = coach.name.charAt(0)
  const inner = (
    <div style={{
      width: size, height: size, borderRadius:'50%',
      background: `linear-gradient(135deg,${c1},${c2})`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.38, fontWeight:900, color:'#fff',
      flexShrink:0, userSelect:'none',
    }}>
      {initial}
    </div>
  )
  if (!ring) return inner
  return (
    <div style={{
      width: size+6, height: size+6, borderRadius:'50%',
      background: `linear-gradient(135deg,${GOLD},#FFE88A,${GOLD_D})`,
      padding: 3, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
    }}>
      <div style={{ width: size, height: size, borderRadius:'50%', background:'#fff', padding:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {inner}
      </div>
    </div>
  )
}

// ── Story Modal ────────────────────────────────────────────────
function StoryModal({ coach, onClose }: { coach: Coach; onClose: () => void }) {
  const [progress, setProgress] = useState(0)
  const [c1, c2] = getGrad(coach.id)
  const sp = SPECS[coach.specialty]

  useEffect(() => {
    let p = 0
    const id = setInterval(() => {
      p += 2
      setProgress(p)
      if (p >= 100) { clearInterval(id); setTimeout(onClose, 200) }
    }, 100)
    return () => clearInterval(id)
  }, [coach.id, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(0,0,0,0.92)', backdropFilter:'blur(20px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      animation:'fadeIn 0.2s ease both',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'min(420px,92vw)', height:'min(745px,90vh)',
        borderRadius:24, overflow:'hidden', position:'relative',
        background: coach.storyImage
          ? 'transparent'
          : `linear-gradient(160deg,${c1},${c2})`,
        boxShadow:'0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* background image */}
        {coach.storyImage && (
          <div style={{
            position:'absolute', inset:0,
            backgroundImage: `url(${coach.storyImage})`,
            backgroundSize:'cover', backgroundPosition:'center',
          }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.10) 40%,rgba(0,0,0,0.55) 100%)' }} />
          </div>
        )}
        {/* progress bar */}
        <div style={{ position:'absolute', top:16, left:16, right:16, height:3, background:'rgba(255,255,255,0.25)', borderRadius:4, overflow:'hidden', zIndex:10 }}>
          <div style={{ height:'100%', width:`${progress}%`, background:'#fff', borderRadius:4, transition:'width 0.08s linear' }} />
        </div>
        {/* top info */}
        <div style={{ position:'absolute', top:30, right:0, left:0, padding:'0 16px', display:'flex', alignItems:'center', gap:10, zIndex:10 }}>
          <Avatar coach={coach} size={40} ring />
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:'#fff', textShadow:'0 1px 4px rgba(0,0,0,0.5)' }}>{coach.name}</div>
            {sp && <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)', fontWeight:600 }}>{sp.label}</div>}
          </div>
          <button onClick={onClose} style={{
            marginRight:'auto', width:32, height:32, borderRadius:'50%',
            background:'rgba(0,0,0,0.35)', backdropFilter:'blur(8px)',
            border:'1px solid rgba(255,255,255,0.20)', color:'#fff',
            fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1,
          }}>×</button>
        </div>
        {/* bottom caption */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'40px 20px 28px', background:'linear-gradient(to top,rgba(0,0,0,0.65),transparent)', zIndex:10 }}>
          <p style={{ fontSize:15, color:'#fff', margin:0, lineHeight:1.7, fontWeight:500, textShadow:'0 1px 4px rgba(0,0,0,0.4)' }}>{coach.bio}</p>
        </div>
        {/* gradient fallback content (no image) */}
        {!coach.storyImage && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, gap:16, zIndex:5 }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, fontWeight:900, color:'#fff' }}>{coach.name.charAt(0)}</div>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.9)', fontWeight:600, textAlign:'center', lineHeight:1.7 }}>{coach.bio}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Featured Coach Card ────────────────────────────────────────
function FeaturedCard({ coach, onStoryClick }: { coach: Coach; onStoryClick: (c: Coach) => void }) {
  const [hov, setHov] = useState(false)
  const sp = SPECS[coach.specialty]
  const [c1, c2] = getGrad(coach.id)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:24, overflow:'hidden',
        background: LQ_BG,
        backdropFilter:'blur(40px) saturate(200%)',
        WebkitBackdropFilter:'blur(40px) saturate(200%)',
        border: LQ_BOR,
        boxShadow: hov
          ? `0 24px 64px rgba(0,0,0,0.13), 0 0 0 2px rgba(199,166,106,0.28), ${LQ_SHAD}`
          : LQ_SHAD,
        transform: hov ? 'translateY(-3px)' : 'none',
        transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        marginBottom:20, position:'relative',
        animation:'fadeUp 0.5s ease both',
      }}
    >
      {/* featured ribbon */}
      <div style={{
        position:'absolute', top:20, right:20, zIndex:10,
        display:'flex', alignItems:'center', gap:6,
        background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,
        padding:'5px 14px', borderRadius:20,
        boxShadow:'inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 12px rgba(199,166,106,0.38)',
        fontSize:12, fontWeight:800, color:'#3a2800',
        letterSpacing:'0.04em',
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        مربی ویژه
      </div>

      <div style={{ display:'flex', flexWrap:'wrap' }}>
        {/* Left: gradient visual */}
        <div style={{ minWidth:220, flex:'0 0 260px', background:`linear-gradient(160deg,${c1},${c2})`, position:'relative', minHeight:260, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {/* geometric circles */}
          <div style={{ position:'absolute', top:-30, right:-30, width:180, height:180, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.12)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-20, left:-20, width:120, height:120, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.10)', pointerEvents:'none' }} />
          {/* avatar */}
          <div
            onClick={() => coach.hasStory && onStoryClick(coach)}
            style={{ cursor: coach.hasStory ? 'pointer' : 'default', zIndex:2, position:'relative' }}
          >
            <Avatar coach={coach} size={96} ring={coach.hasStory} />
            {coach.hasStory && (
              <div style={{
                position:'absolute', bottom:-4, left:'50%', transform:'translateX(-50%)',
                background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)',
                borderRadius:12, padding:'2px 8px',
                fontSize:10, fontWeight:700, color:'#fff', whiteSpace:'nowrap',
              }}>استوری</div>
            )}
          </div>
        </div>

        {/* Right: info */}
        <div style={{ flex:'1 1 280px', padding:'28px 28px 24px' }}>
          {/* name + badge */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:8 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                <h2 style={{ fontSize:22, fontWeight:900, color:TEXT, margin:0, lineHeight:1.2 }}>{coach.name}</h2>
                {coach.verified && (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill={GOLD}/>
                    <polyline points="7 12 10.5 15.5 17 9" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {sp && (
                  <span style={{ fontSize:12, fontWeight:700, color:sp.color, background:sp.bg, border:`1px solid ${sp.color}33`, borderRadius:20, padding:'3px 10px' }}>
                    {sp.label}
                  </span>
                )}
                <span style={{ fontSize:12, fontWeight:700, color:coach.badgeColor, background:`${coach.badgeColor}15`, border:`1px solid ${coach.badgeColor}33`, borderRadius:20, padding:'3px 10px' }}>
                  {coach.badge}
                </span>
              </div>
            </div>
          </div>

          {/* bio */}
          <p style={{ fontSize:14, color:TEXT_S, lineHeight:1.75, margin:'12px 0' }}>{coach.bio}</p>

          {/* stats row */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:16, marginBottom:16 }}>
            {([
              ['⭐', `${coach.rating}`, `(${fmt(coach.reviewCount)} نظر)`],
              ['📍', coach.city, ''],
              ['📅', `${coach.experience} سال`, 'سابقه'],
              ['🎓', `${fmt(coach.students)} شاگرد`, ''],
            ] as [string,string,string][]).map(([icon, val, sub], i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ fontSize:13 }}>{icon}</span>
                <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>{val}</span>
                {sub && <span style={{ fontSize:12, color:TEXT_M }}>{sub}</span>}
              </div>
            ))}
          </div>

          {/* achievements */}
          {coach.achievements.length > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
              {coach.achievements.map((a, i) => (
                <span key={i} style={{ fontSize:11.5, color:TEXT_S, background:'rgba(28,28,26,0.05)', border:'1px solid rgba(28,28,26,0.09)', borderRadius:8, padding:'3px 9px' }}>
                  🏅 {a}
                </span>
              ))}
            </div>
          )}

          {/* price + cta */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontSize:10.5, color:TEXT_M, fontWeight:600, letterSpacing:'0.12em', marginBottom:2 }}>قیمت هر جلسه</div>
              <div style={{ fontSize:20, fontWeight:900, color:TEXT }}>{fmt(coach.sessionPrice)} <span style={{ fontSize:13, fontWeight:600, color:TEXT_M }}>تومان</span></div>
            </div>
            <Link href={`/coaches/${coach.id}`} style={{
              textDecoration:'none',
              display:'inline-flex', alignItems:'center', gap:8,
              background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,
              color:'#3a2800', fontSize:14, fontWeight:800,
              padding:'11px 22px', borderRadius:13,
              boxShadow:'inset 0 1.5px 0 rgba(255,255,255,0.30), 0 4px 16px rgba(199,166,106,0.36)',
              transition:'all 0.2s',
            }}>
              مشاهده پروفایل
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Coach Card ─────────────────────────────────────────────────
function CoachCard({ coach, index, onStoryClick }: { coach: Coach; index: number; onStoryClick: (c: Coach) => void }) {
  const [hov, setHov] = useState(false)
  const sp = SPECS[coach.specialty]
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:20, overflow:'hidden',
        background: LQ_BG,
        backdropFilter:'blur(40px) saturate(200%)',
        WebkitBackdropFilter:'blur(40px) saturate(200%)',
        border: hov ? '1px solid rgba(199,166,106,0.38)' : LQ_BOR,
        boxShadow: hov
          ? `0 18px 48px rgba(0,0,0,0.11), 0 0 0 1px rgba(199,166,106,0.18), ${LQ_SHAD}`
          : LQ_SHAD,
        transform: hov ? 'translateY(-5px)' : 'none',
        transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        animation:`fadeUp 0.5s ${0.05 * index}s ease both`,
        display:'flex', flexDirection:'column',
        position:'relative',
      }}
    >
      {/* top accent stripe (specialty color) */}
      {sp && <div style={{ height:3, background:`linear-gradient(90deg,${sp.color}00,${sp.color},${sp.color}00)` }} />}

      <div style={{ padding:'20px 20px 0' }}>
        {/* avatar + badge */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
          <div
            onClick={() => coach.hasStory && onStoryClick(coach)}
            style={{ cursor: coach.hasStory ? 'pointer' : 'default', position:'relative' }}
            title={coach.hasStory ? 'مشاهده استوری' : ''}
          >
            <Avatar coach={coach} size={58} ring={coach.hasStory} />
            {coach.hasStory && (
              <div style={{
                position:'absolute', bottom:-3, right:-3, width:16, height:16,
                borderRadius:'50%', background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,
                border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:'#fff' }} />
              </div>
            )}
          </div>
          <div style={{ textAlign:'left', display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
            <span style={{ fontSize:11, fontWeight:700, color:coach.badgeColor, background:`${coach.badgeColor}14`, border:`1px solid ${coach.badgeColor}2e`, borderRadius:20, padding:'3px 9px', whiteSpace:'nowrap' }}>
              {coach.badge}
            </span>
            {coach.verified && (
              <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, color:GOLD, fontWeight:600 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill={GOLD}/><polyline points="7 12 10.5 15.5 17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                تأیید شده
              </div>
            )}
          </div>
        </div>

        {/* name + specialty */}
        <h3 style={{ fontSize:16.5, fontWeight:800, color:TEXT, margin:'0 0 4px', lineHeight:1.25 }}>{coach.name}</h3>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
          {sp && <span style={{ fontSize:11.5, fontWeight:700, color:sp.color, background:sp.bg, borderRadius:20, padding:'2px 8px' }}>{sp.label}</span>}
          <span style={{ fontSize:12, color:TEXT_M, display:'flex', alignItems:'center', gap:3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {coach.city}
          </span>
        </div>

        {/* bio */}
        <p style={{ fontSize:12.5, color:TEXT_S, lineHeight:1.7, margin:'0 0 12px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {coach.bio}
        </p>

        {/* rating + stats */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <Stars rating={coach.rating} small />
          <span style={{ fontSize:13, fontWeight:800, color:TEXT }}>{coach.rating}</span>
          <span style={{ fontSize:11.5, color:TEXT_M }}>({fmt(coach.reviewCount)})</span>
          <span style={{ marginRight:'auto', fontSize:12, color:TEXT_M, display:'flex', alignItems:'center', gap:3 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {fmt(coach.students)} شاگرد
          </span>
        </div>

        {/* certifications */}
        {coach.certifications && (
          <div style={{ fontSize:11.5, color:TEXT_M, display:'flex', alignItems:'center', gap:5, marginBottom:14 }}>
            <span style={{ fontSize:13 }}>🏅</span>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{coach.certifications}</span>
          </div>
        )}
      </div>

      {/* price + cta */}
      <div style={{ padding:'14px 20px 18px', marginTop:'auto', borderTop:'1px solid rgba(255,255,255,0.7)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <div>
          <div style={{ fontSize:10, color:TEXT_M, letterSpacing:'0.08em', fontWeight:600, marginBottom:1 }}>هر جلسه</div>
          <div style={{ fontSize:15.5, fontWeight:900, color:TEXT }}>{fmt(coach.sessionPrice)} <span style={{ fontSize:11, color:TEXT_M, fontWeight:500 }}>ت</span></div>
        </div>
        <Link href={`/coaches/${coach.id}`} style={{
          textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6,
          background: LQ_BG,
          backdropFilter:'blur(16px)',
          WebkitBackdropFilter:'blur(16px)',
          border:'1px solid rgba(199,166,106,0.38)',
          color: GOLD_D, fontSize:13, fontWeight:700,
          padding:'9px 16px', borderRadius:11,
          boxShadow:'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(199,166,106,0.12)',
          transition:'all 0.2s',
        }}>
          پروفایل
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  Main page
// ══════════════════════════════════════════════════════════════
export default function CoachesPage() {
  const [scrollY,    setScrollY]    = useState(0)
  const [typed,      setTyped]      = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [activeStory, setActiveStory] = useState<Coach | null>(null)
  const [spec,  setSpec]  = useState('all')
  const [city,  setCity]  = useState('همه')
  const [sort,  setSort]  = useState<'rating'|'experience'|'price'>('rating')

  const TITLE = 'مربیان حرفه‌ای بیلیارد ایران'

  // Parallax
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive:true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Typewriter
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++; setTyped(TITLE.slice(0, i))
      if (i >= TITLE.length) clearInterval(id)
    }, 75)
    return () => clearInterval(id)
  }, [])

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setShowCursor(v => !v), 530)
    return () => clearInterval(id)
  }, [])

  // Filtered + sorted coaches
  const filtered = useMemo(() => {
    let r = [...COACHES]
    if (spec !== 'all') r = r.filter(c => c.specialty === spec)
    if (city !== 'همه') r = r.filter(c => c.city === city)
    if (sort === 'rating')     r.sort((a,b) => b.rating - a.rating)
    if (sort === 'experience') r.sort((a,b) => b.experience - a.experience)
    if (sort === 'price')      r.sort((a,b) => a.sessionPrice - b.sessionPrice)
    return r
  }, [spec, city, sort])

  const featured = filtered[0]
  const rest     = filtered.slice(1)

  // Stats for hero
  const totalYears   = COACHES.reduce((s,c) => s + c.experience, 0)
  const totalStudents = COACHES.reduce((s,c) => s + c.students, 0)

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
        @keyframes scrollDown { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
        .story-item { transition:transform 0.18s; }
        .story-item:hover { transform:scale(1.06); }
        .filter-pill { transition:all 0.2s; }
        .filter-pill:hover { opacity:0.85; }
        @media(max-width:900px) { .coaches-grid { grid-template-columns:1fr 1fr !important; } }
        @media(max-width:580px) { .coaches-grid { grid-template-columns:1fr !important; } }
      `}</style>

      {/* ═══ HERO ════════════════════════════════════════════════ */}
      <section style={{
        minHeight:'100vh', position:'relative', overflow:'hidden',
        direction:'rtl', fontFamily:'Vazirmatn,Tahoma,sans-serif',
        display:'flex', flexDirection:'column', justifyContent:'flex-end',
      }}>
        {/* parallax bg */}
        <div style={{
          position:'absolute', inset:'-15% 0',
          backgroundImage:"url('/images/shop/snooker-table.jpg')",
          backgroundSize:'cover', backgroundPosition:'center 30%',
          transform:`translateY(${scrollY * 0.32}px)`,
          willChange:'transform',
        }}>
          {/* multi-layer overlay */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(5,5,4,0.72) 0%,rgba(5,5,4,0.38) 45%,rgba(5,5,4,0.85) 100%)' }} />
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 80% 60% at 50% 30%,rgba(199,166,106,0.06) 0%,transparent 70%)` }} />
        </div>

        {/* floating geometry */}
        <div style={{ position:'absolute', top:'12%', right:'8%', width:280, height:280, borderRadius:'50%', border:'1px solid rgba(199,166,106,0.08)', pointerEvents:'none', zIndex:1 }} />
        <div style={{ position:'absolute', top:'18%', right:'12%', width:160, height:160, borderRadius:'50%', border:'1px solid rgba(199,166,106,0.06)', pointerEvents:'none', zIndex:1 }} />
        <div style={{ position:'absolute', bottom:'18%', left:'6%', width:200, height:200, borderRadius:'50%', border:'1px solid rgba(199,166,106,0.07)', pointerEvents:'none', zIndex:1 }} />

        {/* nav back button */}
        <div style={{ position:'absolute', top:24, right:'clamp(16px,4vw,48px)', zIndex:10 }}>
          <Link href="/" style={{
            textDecoration:'none', display:'inline-flex', alignItems:'center', gap:7,
            background:'rgba(255,255,255,0.08)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,0.14)', borderRadius:12,
            color:'rgba(255,255,255,0.80)', fontSize:13, fontWeight:600, padding:'9px 16px',
            transition:'all 0.2s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            بیلیارد هاب
          </Link>
        </div>

        {/* hero content */}
        <div style={{ position:'relative', zIndex:5, maxWidth:1100, width:'100%', margin:'0 auto', padding:'0 clamp(16px,4vw,48px) 64px' }}>
          {/* eyebrow */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(199,166,106,0.12)', backdropFilter:'blur(12px)', border:'1px solid rgba(199,166,106,0.22)', borderRadius:20, padding:'5px 14px', marginBottom:20, animation:'fadeUp 0.4s ease both' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill={GOLD}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span style={{ fontSize:12, fontWeight:700, color:GOLD, letterSpacing:'0.18em' }}>CERTIFIED COACHES</span>
          </div>

          {/* typewriter title */}
          <h1 style={{
            fontSize:'clamp(30px,5.5vw,58px)', fontWeight:900, color:'#fff',
            margin:'0 0 14px', lineHeight:1.15, letterSpacing:'-0.025em',
            animation:'fadeUp 0.5s ease both',
          }}>
            {typed.split('').map((char, i) => {
              // highlight "حرفه‌ای" (indices 9-14 roughly)
              const isHighlight = i >= 8 && i <= 13
              return (
                <span key={i} style={isHighlight ? {
                  backgroundImage:`linear-gradient(135deg,${GOLD},#FFE08A,${GOLD_D})`,
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                } : {}}>
                  {char}
                </span>
              )
            })}
            <span style={{ opacity: showCursor ? 1 : 0, color:GOLD, fontWeight:300, WebkitTextFillColor: GOLD }}>|</span>
          </h1>

          {/* tagline */}
          <p style={{ fontSize:'clamp(14px,1.8vw,18px)', color:'rgba(255,255,255,0.55)', margin:'0 0 40px', lineHeight:1.6, animation:'fadeUp 0.6s ease both' }}>
            بهترین مربیان مجاز فدراسیون بیلیارد ایران — از مبتدی تا حرفه‌ای
          </p>

          {/* stats strip */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, animation:'fadeUp 0.7s ease both' }}>
            {([
              [`${COACHES.length}+`, 'مربی فعال'],
              [CITIES.length - 1, 'شهر'],
              [`${totalYears}`, 'سال سابقه ترکیبی'],
              [`${fmt(totalStudents)}+`, 'شاگرد تربیت‌شده'],
            ] as [string|number, string][]).map(([v, l], i) => (
              <div key={i} style={{
                padding:'10px 18px', borderRadius:14,
                background:'rgba(255,255,255,0.07)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                border:'1px solid rgba(255,255,255,0.11)',
                display:'flex', alignItems:'baseline', gap:6,
              }}>
                <span style={{ fontSize:20, fontWeight:900, color:GOLD }}>{v}</span>
                <span style={{ fontSize:12.5, color:'rgba(255,255,255,0.55)', fontWeight:500 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* scroll indicator */}
        <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', zIndex:5, display:'flex', flexDirection:'column', alignItems:'center', gap:5, animation:'scrollDown 2s infinite ease-in-out' }}>
          <div style={{ width:1, height:28, background:'linear-gradient(to bottom,transparent,rgba(255,255,255,0.35))' }} />
          <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,0.35)' }} />
        </div>
      </section>

      {/* ═══ STORY STRIP ════════════════════════════════════════ */}
      <div style={{
        background: LQ_BG,
        backdropFilter:'blur(40px) saturate(200%)',
        WebkitBackdropFilter:'blur(40px) saturate(200%)',
        borderBottom:`1px solid rgba(255,255,255,0.70)`,
        boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
        direction:'rtl', fontFamily:'Vazirmatn,Tahoma,sans-serif',
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'14px clamp(16px,4vw,48px)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, overflowX:'auto', scrollbarWidth:'none', paddingBottom:2 }}>
            {/* label */}
            <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, paddingLeft:12, borderLeft:`2px solid ${GOLD}44` }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              <span style={{ fontSize:12, fontWeight:700, color:GOLD, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>استوری</span>
            </div>
            {/* story items */}
            {COACHES.map(coach => (
              <div
                key={coach.id}
                className="story-item"
                onClick={() => coach.hasStory && setActiveStory(coach)}
                style={{ flexShrink:0, cursor: coach.hasStory ? 'pointer' : 'default', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}
              >
                <Avatar coach={coach} size={48} ring={coach.hasStory} />
                <span style={{ fontSize:11, fontWeight:600, color: coach.hasStory ? TEXT : TEXT_M, whiteSpace:'nowrap', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis' }}>
                  {coach.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ════════════════════════════════════════ */}
      <div style={{ background:'#F7F7F5', minHeight:'70vh', direction:'rtl', fontFamily:'Vazirmatn,Tahoma,sans-serif', color:TEXT }}>
        {/* ambient blobs */}
        <div style={{ position:'fixed', top:200, right:-60, width:400, height:400, background:`radial-gradient(circle,rgba(199,166,106,0.06) 0%,transparent 65%)`, filter:'blur(70px)', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'fixed', bottom:100, left:-40, width:320, height:320, background:`radial-gradient(circle,rgba(199,166,106,0.04) 0%,transparent 65%)`, filter:'blur(60px)', pointerEvents:'none', zIndex:0 }} />

        <div style={{ position:'relative', zIndex:1, maxWidth:1100, margin:'0 auto', padding:'32px clamp(16px,4vw,48px) 80px' }}>

          {/* ── Filters bar ── */}
          <div style={{
            background: LQ_BG,
            backdropFilter:'blur(40px) saturate(200%)',
            WebkitBackdropFilter:'blur(40px) saturate(200%)',
            border: LQ_BOR, borderRadius:18,
            boxShadow: LQ_SHAD,
            padding:'16px 20px', marginBottom:24,
            display:'flex', flexWrap:'wrap', gap:14, alignItems:'center',
            animation:'fadeUp 0.4s ease both',
          }}>
            {/* specialty pills */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {FILTER_SPECS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSpec(f.id)}
                  className="filter-pill"
                  style={{
                    padding:'6px 14px', borderRadius:20, cursor:'pointer',
                    border: spec === f.id
                      ? `1.5px solid ${f.color === TEXT_M ? 'rgba(199,166,106,0.45)' : f.color+'66'}`
                      : '1px solid rgba(28,28,26,0.10)',
                    background: spec === f.id
                      ? f.color === TEXT_M ? 'rgba(199,166,106,0.10)' : `${f.color}12`
                      : 'rgba(255,255,255,0.70)',
                    color: spec === f.id
                      ? f.color === TEXT_M ? GOLD_D : f.color
                      : TEXT_M,
                    fontSize:13, fontWeight: spec === f.id ? 700 : 500,
                    fontFamily:'Vazirmatn,Tahoma,sans-serif',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* divider */}
            <div style={{ width:1, height:24, background:'rgba(28,28,26,0.10)', flexShrink:0 }} />

            {/* city select */}
            <select
              value={city} onChange={e => setCity(e.target.value)}
              style={{
                padding:'6px 12px', borderRadius:12, border:'1px solid rgba(28,28,26,0.10)',
                background:'rgba(255,255,255,0.70)', fontSize:13, color: city !== 'همه' ? TEXT : TEXT_M,
                fontWeight: city !== 'همه' ? 700 : 500,
                cursor:'pointer', outline:'none', fontFamily:'Vazirmatn,Tahoma,sans-serif',
              }}
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* divider */}
            <div style={{ width:1, height:24, background:'rgba(28,28,26,0.10)', flexShrink:0 }} />

            {/* sort pills */}
            <div style={{ display:'flex', gap:5 }}>
              {SORT_OPT.map(o => (
                <button
                  key={o.v}
                  onClick={() => setSort(o.v)}
                  className="filter-pill"
                  style={{
                    padding:'6px 12px', borderRadius:20, cursor:'pointer',
                    border: sort === o.v ? `1.5px solid rgba(199,166,106,0.45)` : '1px solid rgba(28,28,26,0.10)',
                    background: sort === o.v ? 'rgba(199,166,106,0.10)' : 'rgba(255,255,255,0.70)',
                    color: sort === o.v ? GOLD_D : TEXT_M,
                    fontSize:12.5, fontWeight: sort === o.v ? 700 : 500,
                    fontFamily:'Vazirmatn,Tahoma,sans-serif', whiteSpace:'nowrap',
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>

            {/* results count */}
            <span style={{ marginRight:'auto', fontSize:13, color:TEXT_M, fontWeight:500 }}>
              <span style={{ fontWeight:800, color:TEXT }}>{filtered.length}</span> مربی
            </span>
          </div>

          {/* ── Featured ── */}
          {featured && (
            <FeaturedCard coach={featured} onStoryClick={setActiveStory} />
          )}

          {/* ── Grid ── */}
          {rest.length > 0 && (
            <div className="coaches-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
              {rest.map((c, i) => (
                <CoachCard key={c.id} coach={c} index={i} onStoryClick={setActiveStory} />
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'80px 20px', animation:'fadeIn 0.4s ease both' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(199,166,106,0.08)', border:'1px solid rgba(199,166,106,0.18)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </div>
              <p style={{ fontSize:17, fontWeight:800, color:TEXT, margin:'0 0 6px' }}>مربی‌ای یافت نشد</p>
              <p style={{ fontSize:14, color:TEXT_M, margin:0 }}>فیلترها را تغییر دهید</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Story Modal ════════════════════════════════════════ */}
      {activeStory && (
        <StoryModal coach={activeStory} onClose={() => setActiveStory(null)} />
      )}
    </>
  )
}
