'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Manufacturer {
  id: string
  name: string
  city?: string
  address?: string
  description?: string
  products?: string[]
  founded?: string
  phone?: string
  website?: string
  rating?: number
  reviewCount?: number
  certifications?: string[]
}

const MOCK: Manufacturer[] = [
  { id: '1', name: 'صنایع بیلیارد ایران', city: 'تهران', address: 'تهران، شهرک صنعتی شمس‌آباد', description: 'تولیدکننده پیشرو میز بیلیارد حرفه‌ای در ایران با ۲۰ سال تجربه. محصولات ما در بیش از ۵۰۰ باشگاه سراسر کشور مورد استفاده قرار می‌گیرند.', products: ['میز اسنوکر ۱۲ فوت', 'میز پول آمریکایی', 'میز کارامبول', 'رویه مخمل'], founded: '۱۳۸۳', phone: '02144556677', website: 'billiard-iran.com', rating: 4.8, reviewCount: 96, certifications: ['استاندارد ملی ایران', 'IBSF Approved'] },
  { id: '2', name: 'کارخانه میز سبز', city: 'اصفهان', address: 'اصفهان، شهرک صنعتی دولت‌آباد', description: 'تولید میزهای استاندارد بیلیارد برای باشگاه‌ها و منازل با قیمت مناسب', products: ['میز پول', 'میز بیلیارد خانگی', 'میز مینی'], founded: '۱۳۹۰', phone: '03112233445', rating: 4.5, reviewCount: 61, certifications: ['استاندارد ملی ایران'] },
  { id: '3', name: 'نوین کیو فکتوری', city: 'مشهد', address: 'مشهد، شهرک صنعتی توس', description: 'تخصص در تولید چوب و نوک بیلیارد با کیفیت حرفه‌ای. چوب‌های ما در مسابقات ملی استفاده می‌شوند.', products: ['چوب اسنوکر حرفه‌ای', 'نوک چوب', 'چوب پول'], founded: '۱۳۹۵', phone: '05112233445', rating: 4.6, reviewCount: 48 },
  { id: '4', name: 'پارس بیلیارد تبریز', city: 'تبریز', address: 'تبریز، شهرک صنعتی باسمنج', description: 'تولید و صادرات تجهیزات بیلیارد به کشورهای همسایه. صادرکننده برتر تجهیزات ورزشی ۱۴۰۱', products: ['میز اسنوکر', 'گوی بیلیارد', 'رویه مخمل'], founded: '۱۳۸۷', phone: '04133221144', rating: 4.4, reviewCount: 73, certifications: ['گواهی صادرات', 'استاندارد ملی ایران'] },
]

export default function ManufacturerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [mfr, setMfr] = useState<Manufacturer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/manufacturers/${id}`)
        if (res.data) setMfr(res.data)
        else setMfr(MOCK.find(m => m.id === id) || null)
      } catch {
        setMfr(MOCK.find(m => m.id === id) || null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#010604', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#a78bfa', fontSize: '1.2rem' }}>در حال بارگذاری...</div>
    </div>
  )

  if (!mfr) return (
    <div style={{ minHeight: '100vh', background: '#010604', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div style={{ color: '#f0faf5', fontSize: '1.5rem' }}>تولیدکننده یافت نشد</div>
      <Link href="/manufacturers" style={{ color: '#a78bfa', textDecoration: 'none' }}>← بازگشت</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>
      <div style={{ background: 'linear-gradient(135deg, #050c08, #0f0a1f)', borderBottom: '1px solid rgba(167,139,250,0.2)', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link href="/manufacturers" style={{ color: '#a78bfa', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1.5rem' }}>
            ← بازگشت به تولیدکنندگان
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: 'clamp(70px,15vw,100px)', height: 'clamp(70px,15vw,100px)', borderRadius: '16px', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(2rem,4vw,2.5rem)', flexShrink: 0 }}>🏭</div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.3rem, 4vw, 2rem)' }}>{mfr.name}</h1>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#c4b5fd', fontSize: '0.9rem' }}>
                {mfr.city && <span>📍 {mfr.city}</span>}
                {mfr.founded && <span>🏗️ تأسیس {mfr.founded}</span>}
                {mfr.rating && <span style={{ color: '#f59e0b' }}>⭐ {mfr.rating} ({mfr.reviewCount} نظر)</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1rem,3vw,2rem) clamp(1rem,4vw,2rem)', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' }}>
        <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#a78bfa' }}>اطلاعات تماس</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            {mfr.phone && <div style={{ display: 'flex', gap: '0.75rem' }}><span>📞</span><a href={`tel:${mfr.phone}`} style={{ color: '#c4b5fd', textDecoration: 'none' }}>{mfr.phone}</a></div>}
            {mfr.address && <div style={{ display: 'flex', gap: '0.75rem' }}><span>📍</span><span style={{ color: '#ddd6fe' }}>{mfr.address}</span></div>}
            {mfr.website && <div style={{ display: 'flex', gap: '0.75rem' }}><span>🌐</span><span style={{ color: '#c4b5fd' }}>{mfr.website}</span></div>}
          </div>
        </div>

        {mfr.description && (
          <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#06b6d4' }}>درباره کارخانه</h2>
            <div style={{ color: '#cffafe', lineHeight: '1.8', fontSize: '0.95rem' }}>{mfr.description}</div>
          </div>
        )}

        {mfr.products && mfr.products.length > 0 && (
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#10b981' }}>محصولات تولیدی</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {mfr.products.map((p, i) => (
                <span key={i} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '0.3rem 0.9rem', fontSize: '0.85rem', color: '#6ee7b7' }}>{p}</span>
              ))}
            </div>
          </div>
        )}

        {mfr.certifications && mfr.certifications.length > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#f59e0b' }}>گواهینامه‌ها</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {mfr.certifications.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#fde68a', fontSize: '0.9rem' }}>
                  <span>✅</span><span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {mfr.phone && (
            <a href={`tel:${mfr.phone}`} style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', textDecoration: 'none', padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: '600', flex: '1', minWidth: '150px', textAlign: 'center' }}>
              📞 تماس با کارخانه
            </a>
          )}
          <button onClick={() => router.back()} style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', padding: '0.85rem 2rem', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', flex: '1', minWidth: '150px' }}>
            بازگشت
          </button>
        </div>
      </div>
    </div>
  )
}
