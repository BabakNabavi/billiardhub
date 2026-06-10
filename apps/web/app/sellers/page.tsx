'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface Seller {
  id: string
  name: string
  city?: string
  description?: string
  specialties?: string[]
  rating?: number
  reviewCount?: number
  phone?: string
}

const MOCK_SELLERS: Seller[] = [
  { id: '1', name: 'فروشگاه بیلیارد ستاره', city: 'تهران', description: 'فروش تخصصی انواع میز بیلیارد، چوب، گوی و لوازم جانبی', specialties: ['میز اسنوکر', 'چوب حرفه‌ای'], rating: 4.7, reviewCount: 84 },
  { id: '2', name: 'فروشگاه تهران بیلیارد', city: 'تهران', description: 'تامین تجهیزات بیلیارد برای باشگاه‌ها و افراد حرفه‌ای', specialties: ['میز پول', 'نور LED'], rating: 4.4, reviewCount: 52 },
  { id: '3', name: 'آرسام اسپورت اصفهان', city: 'اصفهان', description: 'بزرگترین مرکز تخصصی بیلیارد در اصفهان', specialties: ['میز اسنوکر', 'لوازم یدکی'], rating: 4.6, reviewCount: 63 },
  { id: '4', name: 'بیلیارد مشهد', city: 'مشهد', description: 'عرضه تجهیزات حرفه‌ای بیلیارد در خراسان رضوی', specialties: ['میز کارامبول', 'میز پول'], rating: 4.3, reviewCount: 41 },
]

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await api.get('/sellers')
        setSellers(res.data?.length > 1 ? res.data : MOCK_SELLERS)
      } catch {
        setSellers(MOCK_SELLERS)
      } finally {
        setLoading(false)
      }
    }
    fetchSellers()
  }, [])

  const filtered = sellers.filter(s =>
    s.name.includes(search) || s.city?.includes(search) || s.description?.includes(search)
  )

  return (
    <div style={{ minHeight: '100vh', background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #050c08, #0a1f14)', borderBottom: '1px solid rgba(16,185,129,0.2)', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', background: 'linear-gradient(90deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            فروشندگان تجهیزات
          </h1>
          <div style={{ color: '#6ee7b7', fontSize: '0.95rem', marginBottom: '1.5rem' }}>تامین‌کنندگان تخصصی میز، چوب و لوازم بیلیارد</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجوی فروشنده..."
            style={{
              width: '100%', maxWidth: '400px', padding: '0.75rem 1rem',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '12px', color: '#f0faf5', fontSize: '0.95rem',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#10b981', padding: '3rem' }}>در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6ee7b7', padding: '3rem' }}>فروشنده‌ای یافت نشد</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
            {filtered.map(seller => (
              <Link
                key={seller.id}
                href={`/sellers/${seller.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{
                  background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                  height: '100%',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16,185,129,0.5)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(16,185,129,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16,185,129,0.2)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(16,185,129,0.05)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🏪</div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.2rem' }}>{seller.name}</div>
                      {seller.city && <div style={{ color: '#6ee7b7', fontSize: '0.85rem' }}>📍 {seller.city}</div>}
                    </div>
                  </div>
                  {seller.description && <div style={{ color: '#a7f3d0', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>{seller.description}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {seller.rating && <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>⭐ {seller.rating} ({seller.reviewCount})</span>}
                    <span style={{ color: '#10b981', fontSize: '0.85rem' }}>مشاهده ←</span>
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
