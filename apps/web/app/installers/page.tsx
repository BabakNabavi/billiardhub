'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

interface Installer {
  id: string
  name: string
  city?: string
  description?: string
  services?: string[]
  rating?: number
  reviewCount?: number
  phone?: string
  experience?: string
}

const MOCK_INSTALLERS: Installer[] = [
  { id: '1', name: 'تیم نصب و تعمیر ایران بیلیارد', city: 'تهران', description: 'نصب حرفه‌ای میز بیلیارد و سرویس دوره‌ای با بیش از ۱۰ سال تجربه در تهران', services: ['نصب میز اسنوکر', 'تعویض رویه', 'تنظیم کوسن', 'تعمیر چوب'], rating: 4.9, reviewCount: 112, experience: '۱۰+ سال' },
  { id: '2', name: 'سرویس بیلیارد شمال تهران', city: 'تهران', description: 'تخصص در نصب و نگهداری میز بیلیارد در شمال تهران', services: ['نصب میز پول', 'تعویض رویه مخمل', 'تراز کردن'], rating: 4.6, reviewCount: 78, experience: '۷ سال' },
  { id: '3', name: 'متخصص بیلیارد اصفهان', city: 'اصفهان', description: 'ارائه خدمات نصب و تعمیر تجهیزات بیلیارد در سراسر استان اصفهان', services: ['نصب کامل میز', 'تعمیر', 'سرویس سالانه'], rating: 4.7, reviewCount: 65, experience: '۸ سال' },
  { id: '4', name: 'کارگاه بیلیارد مشهد', city: 'مشهد', description: 'خدمات نصب و تعمیر تخصصی برای باشگاه‌ها و منازل در مشهد', services: ['نصب', 'تعمیر', 'رنگ‌آمیزی فریم'], rating: 4.5, reviewCount: 44, experience: '۵ سال' },
]

export default function InstallersPage() {
  const [installers, setInstallers] = useState<Installer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/installers')
        setInstallers(res.data?.length > 1 ? res.data : MOCK_INSTALLERS)
      } catch {
        setInstallers(MOCK_INSTALLERS)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const filtered = installers.filter(i =>
    i.name.includes(search) || i.city?.includes(search) || i.description?.includes(search)
  )

  return (
    <div style={{ minHeight: '100vh', background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>
      <div style={{ background: 'linear-gradient(135deg, #050c08, #0c1a14)', borderBottom: '1px solid rgba(6,182,212,0.2)', padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', background: 'linear-gradient(90deg, #06b6d4, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            متخصصین نصب و تعمیر
          </h1>
          <div style={{ color: '#67e8f9', fontSize: '0.95rem', marginBottom: '1.5rem' }}>متخصصین نصب، تعمیر و نگهداری میز بیلیارد</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجوی متخصص..."
            style={{ width: '100%', maxWidth: '400px', padding: '0.75rem 1rem', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '12px', color: '#f0faf5', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#06b6d4', padding: '3rem' }}>در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#67e8f9', padding: '3rem' }}>متخصصی یافت نشد</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
            {filtered.map(item => (
              <Link key={item.id} href={`/installers/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer', height: '100%', transition: 'border-color 0.2s, background 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(6,182,212,0.5)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(6,182,212,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(6,182,212,0.2)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(6,182,212,0.05)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #06b6d4, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🔧</div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.2rem' }}>{item.name}</div>
                      <div style={{ color: '#67e8f9', fontSize: '0.85rem' }}>
                        {item.city && `📍 ${item.city}`}{item.experience && ` · ${item.experience}`}
                      </div>
                    </div>
                  </div>
                  {item.description && <div style={{ color: '#cffafe', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1rem' }}>{item.description}</div>}
                  {item.services && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                      {item.services.slice(0, 3).map((s, i) => (
                        <span key={i} style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.78rem', color: '#67e8f9' }}>{s}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {item.rating && <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>⭐ {item.rating} ({item.reviewCount})</span>}
                    <span style={{ color: '#06b6d4', fontSize: '0.85rem' }}>مشاهده ←</span>
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
