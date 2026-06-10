'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Player {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  phone?: string
  city?: string
  age?: number
  bio?: string
  level?: string
  rankingPoints?: number
  nationalRank?: number
  specialties?: string[]
  achievements?: string[]
  avatar?: string
  winRate?: number
  matchesPlayed?: number
  instagram?: string
}

const MOCK: Player[] = [
  { id: '1', name: 'علی محمدی', city: 'تهران', age: 28, bio: 'بازیکن حرفه‌ای اسنوکر با ۸ سال سابقه رقابت در لیگ‌های داخلی. عضو تیم ملی جوانان ایران در سال ۱۴۰۰.', level: 'حرفه‌ای', rankingPoints: 1850, nationalRank: 12, specialties: ['اسنوکر', 'بریک بلد'], achievements: ['قهرمان لیگ تهران ۱۴۰۱', 'نایب‌قهرمان کشوری ۱۴۰۲'], winRate: 72, matchesPlayed: 145 },
  { id: '2', name: 'رضا کریمی', city: 'اصفهان', age: 32, bio: 'بازیکن ارشد پول آمریکایی، مربی سطح اول فدراسیون', level: 'ماهر', rankingPoints: 1420, nationalRank: 28, specialties: ['پول', '8-ball'], achievements: ['قهرمان منطقه ۱۴۰۳'], winRate: 65, matchesPlayed: 210 },
  { id: '3', name: 'سارا احمدی', city: 'مشهد', age: 24, bio: 'قهرمان ملی بانوان در رشته اسنوکر', level: 'حرفه‌ای', rankingPoints: 1680, nationalRank: 5, specialties: ['اسنوکر', '9-ball'], achievements: ['قهرمان بانوان کشوری ۱۴۰۲', 'قهرمان بانوان کشوری ۱۴۰۳'], winRate: 78, matchesPlayed: 98 },
  { id: '4', name: 'محمد حسینی', city: 'تهران', age: 35, bio: 'باتجربه‌ترین بازیکن لیگ تهران با سابقه ۱۵ ساله', level: 'حرفه‌ای', rankingPoints: 2100, nationalRank: 7, specialties: ['اسنوکر', 'کارامبول'], achievements: ['قهرمان لیگ برتر ۱۳۹۹', 'قهرمان لیگ برتر ۱۴۰۰', 'نایب‌قهرمان کشوری ۱۴۰۱'], winRate: 81, matchesPlayed: 312 },
]

const LEVEL_COLORS: Record<string, string> = {
  'حرفه‌ای': '#10b981',
  'ماهر': '#06b6d4',
  'نیمه‌حرفه‌ای': '#a78bfa',
  'مبتدی': '#f59e0b',
}

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/users/${id}`)
        if (res.data) setPlayer(res.data)
        else setPlayer(MOCK.find(p => p.id === id) || null)
      } catch {
        setPlayer(MOCK.find(p => p.id === id) || null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#010604', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#10b981', fontSize: '1.2rem' }}>در حال بارگذاری...</div>
    </div>
  )

  if (!player) return (
    <div style={{ minHeight: '100vh', background: '#010604', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div style={{ color: '#f0faf5', fontSize: '1.5rem' }}>بازیکن یافت نشد</div>
      <Link href="/players" style={{ color: '#10b981', textDecoration: 'none' }}>← بازگشت به بازیکنان</Link>
    </div>
  )

  const displayName = player.name || `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim()
  const levelColor = LEVEL_COLORS[player.level ?? ''] ?? '#10b981'

  return (
    <div style={{ minHeight: '100vh', background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>
      {/* Hero — mobile first */}
      <div style={{ background: 'linear-gradient(160deg, #050c08 0%, #0a1f14 60%, #010604 100%)', borderBottom: '1px solid rgba(16,185,129,0.2)', padding: 'clamp(1.2rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link href="/players" style={{ color: '#10b981', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.5rem' }}>
            ← بازگشت به بازیکنان
          </Link>

          {/* Profile card — stacks on mobile, row on wider screens */}
          <div style={{ display: 'flex', gap: 'clamp(1rem, 3vw, 2rem)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 'clamp(80px, 20vw, 120px)',
              height: 'clamp(80px, 20vw, 120px)',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              flexShrink: 0,
              border: '3px solid rgba(16,185,129,0.5)',
              boxShadow: '0 0 30px rgba(16,185,129,0.2)',
            }}>
              {player.avatar ? (
                <img src={player.avatar} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : '🎱'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 5vw, 2rem)' }}>{displayName}</h1>
                {player.level && (
                  <span style={{ background: `${levelColor}22`, border: `1px solid ${levelColor}66`, color: levelColor, borderRadius: '20px', padding: '0.2rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {player.level}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#6ee7b7', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                {player.city && <span>📍 {player.city}</span>}
                {player.age && <span>🎂 {player.age} ساله</span>}
                {player.nationalRank && <span style={{ color: '#f59e0b' }}>🏆 رنک ملی #{player.nationalRank}</span>}
              </div>
              {/* Stats row — scrollable on tiny screens */}
              {(player.rankingPoints || player.winRate || player.matchesPlayed) && (
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                  {player.rankingPoints && (
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '0.5rem 1rem', textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: '700' }}>{player.rankingPoints}</div>
                      <div style={{ color: '#6ee7b7', fontSize: '0.75rem' }}>امتیاز رنکینگ</div>
                    </div>
                  )}
                  {player.winRate && (
                    <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '10px', padding: '0.5rem 1rem', textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ color: '#06b6d4', fontSize: '1.2rem', fontWeight: '700' }}>{player.winRate}%</div>
                      <div style={{ color: '#67e8f9', fontSize: '0.75rem' }}>نرخ برد</div>
                    </div>
                  )}
                  {player.matchesPlayed && (
                    <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '10px', padding: '0.5rem 1rem', textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ color: '#a78bfa', fontSize: '1.2rem', fontWeight: '700' }}>{player.matchesPlayed}</div>
                      <div style={{ color: '#c4b5fd', fontSize: '0.75rem' }}>مسابقات</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem)', display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' }}>

        {player.bio && (
          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#10b981' }}>بیوگرافی</h2>
            <div style={{ color: '#d1fae5', lineHeight: '1.8', fontSize: '0.95rem' }}>{player.bio}</div>
          </div>
        )}

        {player.specialties && player.specialties.length > 0 && (
          <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#06b6d4' }}>تخصص‌ها</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {player.specialties.map((s, i) => (
                <span key={i} style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '20px', padding: '0.3rem 0.9rem', fontSize: '0.85rem', color: '#67e8f9' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {player.achievements && player.achievements.length > 0 && (
          <div style={{ gridColumn: '1 / -1', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#f59e0b' }}>افتخارات</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: '0.6rem' }}>
              {player.achievements.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', color: '#fde68a', fontSize: '0.9rem' }}>
                  <span style={{ flexShrink: 0 }}>🏆</span><span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {player.phone && (
            <a href={`tel:${player.phone}`} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', textDecoration: 'none', padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: '600', flex: '1', minWidth: '150px', textAlign: 'center' }}>
              📞 تماس
            </a>
          )}
          <button onClick={() => router.back()} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '0.85rem 2rem', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', flex: '1', minWidth: '150px' }}>
            بازگشت
          </button>
        </div>
      </div>
    </div>
  )
}
