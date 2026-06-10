'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Installer {
  id: string
  name: string
  city?: string
  address?: string
  description?: string
  services?: string[]
  rating?: number
  reviewCount?: number
  phone?: string
  experience?: string
  serviceArea?: string[]
}

const MOCK: Installer[] = [
  { id: '1', name: 'تیم نصب و تعمیر ایران بیلیارد', city: 'تهران', address: 'تهران — خدمات در کل تهران', description: 'نصب حرفه‌ای میز بیلیارد و سرویس دوره‌ای با بیش از ۱۰ سال تجربه. تیم متخصص ما آماده نصب انواع میز اسنوکر، پول و کارامبول هستند.', services: ['نصب میز اسنوکر', 'تعویض رویه مخمل', 'تنظیم کوسن', 'تعمیر چوب', 'سرویس سالانه', 'تراز کردن میز'], rating: 4.9, reviewCount: 112, phone: '09121234567', experience: '۱۰+ سال', serviceArea: ['تهران', 'کرج', 'شمال تهران'] },
  { id: '2', name: 'سرویس بیلیارد شمال تهران', city: 'تهران', address: 'تهران، شمیران', description: 'تخصص در نصب و نگهداری میز بیلیارد در شمال تهران و شمیران', services: ['نصب میز پول', 'تعویض رویه مخمل', 'تراز کردن', 'سرویس دوره‌ای'], rating: 4.6, reviewCount: 78, phone: '09187654321', experience: '۷ سال', serviceArea: ['شمال تهران', 'شمیران'] },
  { id: '3', name: 'متخصص بیلیارد اصفهان', city: 'اصفهان', address: 'اصفهان، خیابان چهارباغ', description: 'ارائه خدمات نصب و تعمیر تجهیزات بیلیارد در سراسر استان اصفهان', services: ['نصب کامل میز', 'تعمیر', 'سرویس سالانه', 'رنگ‌آمیزی فریم'], rating: 4.7, reviewCount: 65, phone: '09356789012', experience: '۸ سال', serviceArea: ['اصفهان', 'شاهین‌شهر', 'خمینی‌شهر'] },
  { id: '4', name: 'کارگاه بیلیارد مشهد', city: 'مشهد', address: 'مشهد، بلوار وکیل‌آباد', description: 'خدمات نصب و تعمیر تخصصی برای باشگاه‌ها و منازل در مشهد', services: ['نصب', 'تعمیر', 'رنگ‌آمیزی فریم', 'تعویض کوسن'], rating: 4.5, reviewCount: 44, phone: '09151234567', experience: '۵ سال', serviceArea: ['مشهد'] },
]

export default function InstallerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [installer, setInstaller] = useState<Installer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/installers/${id}`)
        if (res.data) setInstaller(res.data)
        else setInstaller(MOCK.find(m => m.id === id) || null)
      } catch {
        setInstaller(MOCK.find(m => m.id === id) || null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#010604', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#06b6d4', fontSize: '1.2rem' }}>در حال بارگذاری...</div>
    </div>
  )

  if (!installer) return (
    <div style={{ minHeight: '100vh', background: '#010604', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div style={{ color: '#f0faf5', fontSize: '1.5rem' }}>متخصص یافت نشد</div>
      <Link href="/installers" style={{ color: '#06b6d4', textDecoration: 'none' }}>← بازگشت</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>
      <div style={{ background: 'linear-gradient(135deg, #050c08, #061418)', borderBottom: '1px solid rgba(6,182,212,0.2)', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link href="/installers" style={{ color: '#06b6d4', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1.5rem' }}>
            ← بازگشت به متخصصین
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: 'clamp(70px,15vw,100px)', height: 'clamp(70px,15vw,100px)', borderRadius: '16px', background: 'linear-gradient(135deg, #06b6d4, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(2rem,4vw,2.5rem)', flexShrink: 0 }}>🔧</div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.3rem, 4vw, 2rem)' }}>{installer.name}</h1>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#67e8f9', fontSize: '0.9rem' }}>
                {installer.city && <span>📍 {installer.city}</span>}
                {installer.experience && <span>⏱️ تجربه: {installer.experience}</span>}
                {installer.rating && <span style={{ color: '#f59e0b' }}>⭐ {installer.rating} ({installer.reviewCount} نظر)</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1rem,3vw,2rem) clamp(1rem,4vw,2rem)', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' }}>
        <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#06b6d4' }}>اطلاعات تماس</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            {installer.phone && <div style={{ display: 'flex', gap: '0.75rem' }}><span>📞</span><a href={`tel:${installer.phone}`} style={{ color: '#67e8f9', textDecoration: 'none' }}>{installer.phone}</a></div>}
            {installer.address && <div style={{ display: 'flex', gap: '0.75rem' }}><span>📍</span><span style={{ color: '#cffafe' }}>{installer.address}</span></div>}
          </div>
        </div>

        {installer.description && (
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#10b981' }}>درباره متخصص</h2>
            <div style={{ color: '#d1fae5', lineHeight: '1.8', fontSize: '0.95rem' }}>{installer.description}</div>
          </div>
        )}

        {installer.services && installer.services.length > 0 && (
          <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#06b6d4' }}>خدمات</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
              {installer.services.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#cffafe', fontSize: '0.9rem' }}>
                  <span style={{ color: '#06b6d4' }}>✓</span><span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {installer.serviceArea && installer.serviceArea.length > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#f59e0b' }}>منطقه خدمات‌دهی</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {installer.serviceArea.map((a, i) => (
                <span key={i} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '0.3rem 0.9rem', fontSize: '0.85rem', color: '#fde68a' }}>{a}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {installer.phone && (
            <a href={`tel:${installer.phone}`} style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: '#fff', textDecoration: 'none', padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: '600', flex: '1', minWidth: '150px', textAlign: 'center' }}>
              📞 تماس با متخصص
            </a>
          )}
          <button onClick={() => router.back()} style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', padding: '0.85rem 2rem', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', flex: '1', minWidth: '150px' }}>
            بازگشت
          </button>
        </div>
      </div>
    </div>
  )
}
