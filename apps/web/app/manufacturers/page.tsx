'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface Manufacturer {
  id: string
  name: string
  city?: string
  country?: string
  description?: string
  products?: string[]
  founded?: string
  rating?: number
  reviewCount?: number
}

const MOCK_MANUFACTURERS: Manufacturer[] = [
  { id: '1', name: 'صنایع بیلیارد ایران', city: 'تهران', country: 'ایران', description: 'تولیدکننده پیشرو میز بیلیارد حرفه‌ای در ایران با ۲۰ سال تجربه', products: ['میز اسنوکر', 'میز پول', 'میز کارامبول'], founded: '۱۳۸۳', rating: 4.8, reviewCount: 96 },
  { id: '2', name: 'کارخانه میز سبز', city: 'اصفهان', country: 'ایران', description: 'تولید میزهای استاندارد بیلیارد برای باشگاه‌ها و منازل', products: ['میز پول', 'میز بیلیارد خانگی'], founded: '۱۳۹۰', rating: 4.5, reviewCount: 61 },
  { id: '3', name: 'نوین کیو فکتوری', city: 'مشهد', country: 'ایران', description: 'تخصص در تولید چوب و نوک بیلیارد با کیفیت حرفه‌ای', products: ['چوب اسنوکر', 'نوک چوب', 'چوب پول'], founded: '۱۳۹۵', rating: 4.6, reviewCount: 48 },
  { id: '4', name: 'پارس بیلیارد تبریز', city: 'تبریز', country: 'ایران', description: 'تولید و صادرات تجهیزات بیلیارد به کشورهای همسایه', products: ['میز اسنوکر', 'گوی', 'رویه مخمل'], founded: '۱۳۸۷', rating: 4.4, reviewCount: 73 },
]

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/manufacturers')
        setManufacturers(res.data?.length > 1 ? res.data : MOCK_MANUFACTURERS)
      } catch {
        setManufacturers(MOCK_MANUFACTURERS)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const filtered = manufacturers.filter(m =>
    m.name.includes(search) || m.city?.includes(search) || m.description?.includes(search)
  )

  return (
    <div style={{ minHeight: '100vh', background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>
      <div style={{ background: 'linear-gradient(135deg, #050c08, #0a1f14)', borderBottom: '1px solid rgba(167,139,250,0.2)', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', background: 'linear-gradient(90deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            تولیدکنندگان
          </h1>
          <div style={{ color: '#c4b5fd', fontSize: '0.95rem', marginBottom: '1.5rem' }}>کارخانه‌ها و تولیدکنندگان تجهیزات بیلیارد</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجوی تولیدکننده..."
            style={{
              width: '100%', maxWidth: '400px', padding: '0.75rem 1rem',
              background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)',
              borderRadius: '12px', color: '#f0faf5', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#a78bfa', padding: '3rem' }}>در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#c4b5fd', padding: '3rem' }}>تولیدکننده‌ای یافت نشد</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
            {filtered.map(m => (
              <Link key={m.id} href={`/manufacturers/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)',
                  borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', height: '100%',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(167,139,250,0.5)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(167,139,250,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(167,139,250,0.2)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(167,139,250,0.05)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🏭</div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.2rem' }}>{m.name}</div>
                      <div style={{ color: '#c4b5fd', fontSize: '0.85rem' }}>
                        {m.city && `📍 ${m.city}`}{m.founded && ` · تأسیس ${m.founded}`}
                      </div>
                    </div>
                  </div>
                  {m.description && <div style={{ color: '#ddd6fe', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>{m.description}</div>}
                  {m.products && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                      {m.products.slice(0, 3).map((p, i) => (
                        <span key={i} style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.78rem', color: '#c4b5fd' }}>{p}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {m.rating && <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>⭐ {m.rating} ({m.reviewCount})</span>}
                    <span style={{ color: '#a78bfa', fontSize: '0.85rem' }}>مشاهده ←</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
