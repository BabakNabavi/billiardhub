'use client'

import { useState } from 'react'
import Link from 'next/link'

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
  'مبتدی':      { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
  'متوسط':      { bg: 'rgba(6,182,212,0.15)',    color: '#06b6d4' },
  'پیشرفته':    { bg: 'rgba(167,139,250,0.15)',  color: '#a78bfa' },
  'حرفه‌ای':    { bg: 'rgba(245,158,11,0.15)',   color: '#f59e0b' },
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
    <div style={{ minHeight: '100vh', background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>

      {/* ====== HERO ====== */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #050c08 0%, #0a1a10 50%, #010604 100%)', padding: 'clamp(2rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem) clamp(1.5rem, 4vw, 3rem)' }}>
        {/* decorative orbs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
          {/* eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '0.3rem 1rem', fontSize: '0.8rem', color: '#6ee7b7', marginBottom: '1.25rem' }}>
            <span>🎱</span> آکادمی آموزشی بیلیارد پلاس
          </div>

          <h1 style={{ margin: '0 0 0.75rem', fontSize: 'clamp(1.7rem, 5.5vw, 3rem)', lineHeight: '1.3', fontWeight: '800' }}>
            از مبتدی تا{' '}
            <span style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>حرفه‌ای</span>
          </h1>
          <div style={{ color: '#6ee7b7', fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', maxWidth: '560px', lineHeight: '1.7', marginBottom: '2rem' }}>
            دوره‌های تخصصی بیلیارد با مدرسان مجرب — از قوانین پایه تا تکنیک‌های رقابتی
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '460px' }}>
            <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6ee7b7', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجوی دوره یا مدرس..."
              style={{ width: '100%', padding: '0.85rem 3rem 0.85rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '14px', color: '#f0faf5', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.5rem 1rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#10b981' }}>{s.value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== FILTERS ====== */}
      <div style={{ borderBottom: '1px solid rgba(16,185,129,0.1)', background: 'rgba(5,12,8,0.9)', padding: 'clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 4vw, 2rem)', position: 'sticky', top: '64px', zIndex: 10, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flex: 1, minWidth: '200px' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '0.35rem 0.9rem', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer', border: 'none',
                background: activeCategory === cat ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.04)',
                color: activeCategory === cat ? '#10b981' : '#6ee7b7',
                outline: activeCategory === cat ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.15s',
              }}>
                {cat}
              </button>
            ))}
          </div>
          {/* Level select */}
          <select
            value={activeLevel}
            onChange={e => setActiveLevel(e.target.value)}
            style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', color: '#6ee7b7', fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}
          >
            {LEVELS.map(l => <option key={l} value={l} style={{ background: '#050c08' }}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* ====== COURSES GRID ====== */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(1.25rem, 3vw, 2.5rem) clamp(1rem, 4vw, 2rem)' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <div style={{ color: '#6ee7b7', fontSize: '1.1rem' }}>دوره‌ای یافت نشد</div>
            <button onClick={() => { setSearch(''); setActiveCategory('همه'); setActiveLevel('همه') }} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', padding: '0.5rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
              پاک کردن فیلترها
            </button>
          </div>
        ) : (
          <>
            <div style={{ color: '#6ee7b7', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{filtered.length} دوره یافت شد</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1.25rem' }}>
              {filtered.map(course => {
                const lvStyle = LEVEL_STYLE[course.level] ?? { bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
                return (
                  <div key={course.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s, transform 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16,185,129,0.4)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
                  >
                    {/* Thumbnail area */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.08))', padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)' }}>{course.thumbnail}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <span style={{ background: lvStyle.bg, color: lvStyle.color, borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.78rem', border: `1px solid ${lvStyle.color}44` }}>{course.level}</span>
                        {course.isFree
                          ? <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.78rem', border: '1px solid rgba(16,185,129,0.4)' }}>رایگان 🎁</span>
                          : <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: '20px', padding: '0.2rem 0.75rem', fontSize: '0.78rem', border: '1px solid rgba(245,158,11,0.3)' }}>پولی</span>
                        }
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '1.25rem 1.25rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)', fontWeight: '700', lineHeight: '1.4' }}>{course.title}</div>
                      <div style={{ color: '#6ee7b7', fontSize: '0.82rem' }}>👤 {course.instructor}</div>
                      <div style={{ color: '#a7f3d0', fontSize: '0.85rem', lineHeight: '1.6', flex: 1 }}>{course.description}</div>

                      {/* Tags */}
                      {course.tags && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {course.tags.map((t, i) => (
                            <span key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '0.15rem 0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.8rem' }}>
                        <span>⏱ {course.duration}</span>
                        <span>📹 {course.lessons} جلسه</span>
                        <span style={{ color: '#f59e0b' }}>⭐ {course.rating}</span>
                      </div>
                      <button style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.5rem 1.2rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>
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
      <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.08))', borderTop: '1px solid rgba(16,185,129,0.15)', borderBottom: '1px solid rgba(16,185,129,0.15)', padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 2rem)', margin: 'clamp(1.5rem, 4vw, 3rem) 0 0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', marginBottom: '0.75rem' }}>
            می‌خواهی مربی بیلیارد باشی؟
          </div>
          <div style={{ color: '#6ee7b7', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
            اگر تجربه تدریس داری، دوره خودت را در بیلیارد پلاس منتشر کن و به هزاران نفر آموزش بده
          </div>
          <button style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.9rem 2.5rem', fontSize: '1rem', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>
            همکاری با ما ←
          </button>
        </div>
      </div>
    </div>
  )
}
