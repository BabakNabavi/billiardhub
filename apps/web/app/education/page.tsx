'use client'

import { useState } from 'react'
import Link from 'next/link'

const GOLD = '#C7A66A';
const GOLD_DARK = '#A07840';

interface Course {
  id: string
  title: string
  instructor: string
  level: 'مبتدی' | 'متوسط' | 'پیشرفته' | 'حرفه‌ای'
  duration: string
  lessons: number
  category: string
  thumbnail: string
  rating: number
  students: number
  isFree: boolean
  tags?: string[]
  description: string
}

const COURSES: Course[] = [
  { id: '1', title: 'اسنوکر از صفر تا صد', instructor: 'استاد محمدی', level: 'مبتدی', duration: '۱۲ ساعت', lessons: 24, category: 'اسنوکر', thumbnail: '🎱', rating: 4.9, students: 1240, isFree: false, tags: ['وضعیت', 'ضربه اولیه', 'قوانین'], description: 'یاد بگیرید از پایه‌ای‌ترین مفاهیم تا اجرای ضربات پیشرفته. مناسب کسانی که هیچ سابقه‌ای ندارند.' },
  { id: '2', title: 'تکنیک‌های پیشرفته پول', instructor: 'استاد رضایی', level: 'پیشرفته', duration: '۸ ساعت', lessons: 16, category: 'پول', thumbnail: '🔵', rating: 4.8, students: 867, isFree: false, tags: ['انگلیسی', 'پوزیشن', 'برک'], description: 'کنترل توپ، انگلیسی پیشرفته و تاکتیک‌های رقابتی برای بازیکنان نیمه‌حرفه‌ای.' },
  { id: '3', title: 'آموزش رایگان کارامبول', instructor: 'استاد کریمی', level: 'متوسط', duration: '۵ ساعت', lessons: 10, category: 'کارامبول', thumbnail: '🟠', rating: 4.7, students: 543, isFree: true, tags: ['سه‌کوشه', 'تکنیک'], description: 'مبانی کارامبول و شروع بازی سه‌کوشه برای تازه‌کارها. این دوره کاملاً رایگان است.' },
  { id: '4', title: 'روانشناسی بازی و تمرکز', instructor: 'دکتر احمدی', level: 'حرفه‌ای', duration: '۴ ساعت', lessons: 8, category: 'ذهنی', thumbnail: '🧠', rating: 4.6, students: 412, isFree: false, tags: ['تمرکز', 'فشار', 'رقابت'], description: 'کنترل ذهن در لحظات حساس مسابقه. برای بازیکنانی که می‌خواهند عملکرد خود را در رقابت بهبود دهند.' },
  { id: '5', title: 'انتخاب و نگهداری تجهیزات', instructor: 'استاد حیدری', level: 'مبتدی', duration: '۳ ساعت', lessons: 6, category: 'تجهیزات', thumbnail: '🪄', rating: 4.5, students: 789, isFree: true, tags: ['چوب', 'میز', 'نگهداری'], description: 'راهنمای جامع خرید، مراقبت و نگهداری تجهیزات بیلیارد. رایگان.' },
  { id: '6', title: 'قوانین رسمی فدراسیون', instructor: 'داور محمدی', level: 'متوسط', duration: '۲ ساعت', lessons: 5, category: 'قوانین', thumbnail: '📋', rating: 4.4, students: 623, isFree: true, tags: ['فاول', 'قوانین', 'رسمی'], description: 'آشنایی کامل با قوانین رسمی IBSF برای بازیکنان و داوران.' },
]

const CATEGORIES = ['همه', 'اسنوکر', 'پول', 'کارامبول', 'ذهنی', 'تجهیزات', 'قوانین']
const LEVELS = ['همه', 'مبتدی', 'متوسط', 'پیشرفته', 'حرفه‌ای']

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  'مبتدی':   { bg: 'rgba(34,197,94,0.10)',   color: '#16a34a' },
  'متوسط':   { bg: 'rgba(59,130,246,0.10)',   color: '#2563eb' },
  'پیشرفته': { bg: 'rgba(139,92,246,0.10)',   color: '#7c3aed' },
  'حرفه‌ای': { bg: 'rgba(199,166,106,0.12)',  color: '#A07840' },
}

export default function EducationPage() {
  const [activeCategory, setActiveCategory] = useState('همه')
  const [activeLevel, setActiveLevel] = useState('همه')
  const [search, setSearch] = useState('')

  const filtered = COURSES.filter(c => {
    const catMatch = activeCategory === 'همه' || c.category === activeCategory
    const levelMatch = activeLevel === 'همه' || c.level === activeLevel
    const searchMatch = !search || c.title.includes(search) || c.instructor.includes(search) || c.description.includes(search)
    return catMatch && levelMatch && searchMatch
  })

  const stats = [
    { label: 'دوره فعال', value: COURSES.length, icon: '📚' },
    { label: 'دانشجو', value: '۴۸۰۰+', icon: '👥' },
    { label: 'دوره رایگان', value: COURSES.filter(c => c.isFree).length, icon: '🎁' },
    { label: 'مدرس متخصص', value: '۶', icon: '🎓' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', color: '#111111', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>

      {/* ====== HERO ====== */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#111111 0%,#1a1a1a 100%)', padding: 'clamp(40px,5vw,72px) clamp(16px,4vw,40px) clamp(32px,4vw,56px)' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,166,106,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
            <span style={{ fontSize: 12 }}>🎱</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', letterSpacing: '0.06em' }}>BILLIARDHUB ACADEMY</span>
          </div>

          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(28px,5vw,48px)', lineHeight: 1.15, fontWeight: 900, letterSpacing: '-0.03em', color: '#FFFFFF' }}>
            از مبتدی تا{' '}
            <span style={{ backgroundImage: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>حرفه‌ای</span>
          </h1>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(14px,2vw,16px)', maxWidth: 520, lineHeight: 1.7, marginBottom: 28 }}>
            دوره‌های تخصصی بیلیارد با مدرسان مجرب — از قوانین پایه تا تکنیک‌های رقابتی
          </div>

          {/* Search in hero */}
          <div style={{ position: 'relative', maxWidth: 420 }}>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجوی دوره یا مدرس..."
              style={{ width: '100%', padding: '12px 44px 12px 16px', background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 14, color: '#FFFFFF', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '8px 14px' }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== FILTERS ====== */}
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'rgba(247,247,245,0.95)', padding: 'clamp(12px,2vw,16px) clamp(16px,4vw,40px)', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1, minWidth: 200 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                background: activeCategory === cat ? 'rgba(139,92,246,0.12)' : 'rgba(0,0,0,0.03)',
                color: activeCategory === cat ? '#7c3aed' : 'rgba(0,0,0,0.45)',
                border: activeCategory === cat ? '1px solid rgba(139,92,246,0.40)' : '1px solid rgba(0,0,0,0.08)',
                fontWeight: activeCategory === cat ? 700 : 500,
              }}>
                {cat}
              </button>
            ))}
          </div>
          <select
            value={activeLevel}
            onChange={e => setActiveLevel(e.target.value)}
            style={{ padding: '7px 12px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 10, color: '#111111', fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
          >
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* ====== COURSES GRID ====== */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,4vw,40px)' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.15 }}>🔍</div>
            <div style={{ color: '#111111', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>دوره‌ای یافت نشد</div>
            <button onClick={() => { setSearch(''); setActiveCategory('همه'); setActiveLevel('همه') }} style={{ marginTop: 12, background: 'transparent', border: '1px solid rgba(139,92,246,0.40)', color: '#7c3aed', padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              پاک کردن فیلترها
            </button>
          </div>
        ) : (
          <>
            <div style={{ color: 'rgba(0,0,0,0.38)', fontSize: 13, marginBottom: 16 }}>{filtered.length} دوره یافت شد</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,300px),1fr))', gap: 16 }}>
              {filtered.map(course => {
                const lvStyle = LEVEL_STYLE[course.level] ?? { bg: 'rgba(199,166,106,0.12)', color: GOLD_DARK }
                return (
                  <div key={course.id}
                    style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.25)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.07)' }}
                  >
                    {/* Thumbnail */}
                    <div style={{ background: 'rgba(139,92,246,0.05)', padding: '28px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ fontSize: 'clamp(40px,6vw,56px)' }}>{course.thumbnail}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ background: lvStyle.bg, color: lvStyle.color, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600, border: `1px solid ${lvStyle.color}33` }}>{course.level}</span>
                        {course.isFree
                          ? <span style={{ background: 'rgba(34,197,94,0.10)', color: '#16a34a', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600, border: '1px solid rgba(34,197,94,0.25)' }}>رایگان 🎁</span>
                          : <span style={{ background: 'rgba(199,166,106,0.10)', color: GOLD_DARK, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600, border: `1px solid rgba(199,166,106,0.25)` }}>پولی</span>
                        }
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '18px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.4, color: '#111111' }}>{course.title}</div>
                      <div style={{ color: GOLD_DARK, fontSize: 12, fontWeight: 600 }}>👤 {course.instructor}</div>
                      <div style={{ color: 'rgba(0,0,0,0.50)', fontSize: 13, lineHeight: 1.65, flex: 1 }}>{course.description}</div>
                      {course.tags && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {course.tags.map((t, i) => (
                            <span key={i} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: 'rgba(0,0,0,0.40)' }}>#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 12, color: 'rgba(0,0,0,0.40)', fontSize: 12 }}>
                        <span>⏱ {course.duration}</span>
                        <span>📹 {course.lessons} جلسه</span>
                        <span style={{ color: '#f59e0b' }}>⭐ {course.rating}</span>
                      </div>
                      <button style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', boxShadow: `0 4px 12px rgba(199,166,106,0.28)` }}>
                        {course.isFree ? 'شروع رایگان' : 'مشاهده دوره'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ====== CTA BANNER ====== */}
      <div style={{ background: '#111111', padding: 'clamp(40px,5vw,64px) clamp(16px,4vw,40px)', margin: 'clamp(24px,4vw,48px) 0 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 'clamp(20px,4vw,28px)', fontWeight: 900, marginBottom: 12, color: '#FFFFFF' }}>
            می‌خواهی مربی بیلیارد باشی؟
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            اگر تجربه تدریس داری، دوره خودت را در بیلیارد هاب منتشر کن و به هزاران نفر آموزش بده
          </div>
          <button style={{ background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 36px', fontSize: 15, cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit', boxShadow: `0 8px 24px rgba(199,166,106,0.30)` }}>
            همکاری با ما ←
          </button>
        </div>
      </div>
    </div>
  )
}
