'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Seller {
  id: string
  name: string
  phone?: string
  city?: string
  address?: string
  description?: string
  specialties?: string[]
  workingHours?: string
  instagram?: string
  avatar?: string
  rating?: number
  reviewCount?: number
  products?: { id: string; name: string; price: number; image?: string }[]
}

const MOCK_SELLERS: Seller[] = [
  {
    id: '1',
    name: 'فروشگاه بیلیارد ستاره',
    phone: '02112345678',
    city: 'تهران',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۲',
    description: 'فروش تخصصی انواع میز بیلیارد، چوب، گوی و لوازم جانبی. بیش از ۱۵ سال سابقه.',
    specialties: ['میز اسنوکر', 'چوب حرفه‌ای', 'گوی بیلیارد', 'لوازم جانبی'],
    workingHours: 'شنبه تا پنجشنبه ۱۰–۲۰',
    instagram: 'billiard_star',
    rating: 4.7,
    reviewCount: 84,
    products: [
      { id: 'p1', name: 'میز اسنوکر ۱۲ فوت', price: 45000000 },
      { id: 'p2', name: 'چوب حرفه‌ای ۱۴۸cm', price: 3500000 },
      { id: 'p3', name: 'ست گوی ۱۵ عددی', price: 1800000 },
    ],
  },
  {
    id: '2',
    name: 'فروشگاه تهران بیلیارد',
    phone: '02187654321',
    city: 'تهران',
    address: 'تهران، نارمک',
    description: 'تامین کننده تجهیزات بیلیارد برای باشگاه‌ها و افراد حرفه‌ای',
    specialties: ['میز پول', 'تخته کارامبول', 'نور LED'],
    workingHours: 'شنبه تا جمعه ۹–۲۱',
    rating: 4.4,
    reviewCount: 52,
    products: [
      { id: 'p4', name: 'میز پول آمریکایی', price: 28000000 },
      { id: 'p5', name: 'سیستم نور LED', price: 4200000 },
    ],
  },
  {
    id: '3',
    name: 'آرسام اسپورت اصفهان',
    phone: '03145678901',
    city: 'اصفهان',
    address: 'اصفهان، خیابان چهارباغ',
    description: 'بزرگترین مرکز تخصصی بیلیارد در اصفهان',
    specialties: ['میز اسنوکر', 'میز پول', 'لوازم یدکی'],
    workingHours: 'شنبه تا پنجشنبه ۱۰–۱۹',
    rating: 4.6,
    reviewCount: 63,
    products: [
      { id: 'p6', name: 'میز اسنوکر نیمه‌حرفه‌ای', price: 32000000 },
      { id: 'p7', name: 'کیف چوب بیلیارد', price: 650000 },
    ],
  },
]

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [seller, setSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const res = await api.get(`/sellers/${id}`)
        if (res.data) {
          setSeller(res.data)
        } else {
          setSeller(MOCK_SELLERS.find(s => s.id === id) || null)
        }
      } catch {
        setSeller(MOCK_SELLERS.find(s => s.id === id) || null)
      } finally {
        setLoading(false)
      }
    }
    fetchSeller()
  }, [id])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#010604', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#10b981', fontSize: '1.2rem' }}>در حال بارگذاری...</div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div style={{ minHeight: '100vh', background: '#010604', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <div style={{ color: '#f0faf5', fontSize: '1.5rem' }}>فروشنده یافت نشد</div>
        <Link href="/sellers" style={{ color: '#10b981', textDecoration: 'none' }}>← بازگشت به فروشندگان</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #050c08 0%, #0a1f14 100%)', borderBottom: '1px solid rgba(16,185,129,0.2)', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link href="/sellers" style={{ color: '#10b981', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1.5rem' }}>
            ← بازگشت به فروشندگان
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 'clamp(70px, 15vw, 100px)',
              height: 'clamp(70px, 15vw, 100px)',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              flexShrink: 0,
              border: '2px solid rgba(16,185,129,0.4)',
            }}>🏪</div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.3rem, 4vw, 2rem)', color: '#f0faf5' }}>{seller.name}</h1>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#6ee7b7', fontSize: '0.9rem' }}>
                {seller.city && <span>📍 {seller.city}</span>}
                {seller.rating && (
                  <span style={{ color: '#f59e0b' }}>⭐ {seller.rating} ({seller.reviewCount} نظر)</span>
                )}
              </div>
              {seller.workingHours && (
                <div style={{ marginTop: '0.5rem', color: '#a7f3d0', fontSize: '0.85rem' }}>🕐 {seller.workingHours}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem)', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' }}>

        {/* Info Card */}
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#10b981' }}>اطلاعات تماس</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            {seller.phone && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span>📞</span>
                <a href={`tel:${seller.phone}`} style={{ color: '#a7f3d0', textDecoration: 'none' }}>{seller.phone}</a>
              </div>
            )}
            {seller.address && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span>📍</span>
                <span style={{ color: '#d1fae5' }}>{seller.address}</span>
              </div>
            )}
            {seller.instagram && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span>📷</span>
                <span style={{ color: '#a7f3d0' }}>@{seller.instagram}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {seller.description && (
          <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#06b6d4' }}>درباره فروشگاه</h2>
            <div style={{ color: '#d1fae5', lineHeight: '1.8', fontSize: '0.95rem' }}>{seller.description}</div>
          </div>
        )}

        {/* Specialties */}
        {seller.specialties && seller.specialties.length > 0 && (
          <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#a78bfa' }}>تخصص‌ها</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {seller.specialties.map((s, i) => (
                <span key={i} style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '20px', padding: '0.3rem 0.9rem', fontSize: '0.85rem', color: '#c4b5fd' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {seller.products && seller.products.length > 0 && (
          <div style={{ gridColumn: '1 / -1', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#f59e0b' }}>محصولات</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
              {seller.products.map(p => (
                <div key={p.id} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.95rem', color: '#f0faf5', marginBottom: '0.5rem' }}>{p.name}</div>
                  <div style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.9rem' }}>{p.price.toLocaleString('fa-IR')} تومان</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {seller.phone && (
            <a href={`tel:${seller.phone}`} style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', textDecoration: 'none',
              padding: '0.85rem 2rem', borderRadius: '12px',
              fontWeight: '600', fontSize: '1rem',
              flex: '1', minWidth: '150px', textAlign: 'center',
            }}>
              📞 تماس
            </a>
          )}
          <button onClick={() => router.back()} style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#10b981', padding: '0.85rem 2rem', borderRadius: '12px',
            cursor: 'pointer', fontSize: '1rem', flex: '1', minWidth: '150px',
          }}>
            بازگشت
          </button>
        </div>
      </div>
    </div>
  )
}
