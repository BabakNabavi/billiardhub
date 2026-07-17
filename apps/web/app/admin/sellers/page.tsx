'use client'
/* ─────────────────────────────────────────────────────────────
   تایید فروشگاه‌ها — /admin/sellers
   مثل /admin/coaches: فروشگاه‌های ثبت‌شده در /dashboard/seller را بررسی و
   تایید/رد می‌کند. فقط فروشگاه‌های approved در /sellers دیده می‌شوند.
   ───────────────────────────────────────────────────────────── */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../../../store/auth.store'
import { listSellerProfiles, updateSellerProfile, type SellerProfile } from '../../../lib/seller-store'

const ADMIN_PHONE = '09121327283'

const GOLD_D = '#9A6E38'
const BG     = '#F6F4F0'
const TEXT   = '#111110'
const TEXT_S = 'rgba(17,17,16,0.52)'
const TEXT_M = 'rgba(17,17,16,0.30)'
const CBOR   = '1px solid rgba(17,17,16,0.10)'
const card: React.CSSProperties = { background: '#fff', border: CBOR, borderRadius: 16, boxShadow: '0 2px 16px rgba(17,17,16,0.05)' }

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'در انتظار بررسی', color: '#B45309', bg: 'rgba(245,158,11,0.12)' },
  approved: { label: 'تایید شده',        color: '#057642', bg: 'rgba(5,118,66,0.10)' },
  rejected: { label: 'رد شده',           color: '#b91c1c', bg: 'rgba(239,68,68,0.10)' },
}

const btn = (bg: string, color: string, border: string): React.CSSProperties => ({
  padding: '8px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'inherit', border, background: bg, color, display: 'inline-flex', alignItems: 'center', gap: 6,
})

export default function AdminSellersPage() {
  const { user, _hydrated } = useAuthStore()
  const [list, setList]         = useState<SellerProfile[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tick, setTick]         = useState(0)

  useEffect(() => { setList(listSellerProfiles()) }, [tick])

  const isAdmin = !!user && (user.phone === ADMIN_PHONE || user.primaryRole === 'admin')
  const act = (slug: string, patch: Partial<SellerProfile>) => { updateSellerProfile(slug, patch); setTick(t => t + 1) }

  if (!_hydrated) {
    return <div style={{ direction: 'rtl', fontFamily: "'Vazirmatn',Tahoma,sans-serif", background: BG, minHeight: '100vh' }} />
  }

  if (!isAdmin) {
    return (
      <div style={{ direction: 'rtl', fontFamily: "'Vazirmatn',Tahoma,sans-serif", background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, color: TEXT }}>
        <div style={{ ...card, padding: '32px 28px', textAlign: 'center', maxWidth: 380 }}>
          <p style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>دسترسی محدود</p>
          <p style={{ fontSize: 13.5, color: TEXT_S, lineHeight: 1.9, marginBottom: 18 }}>این صفحه فقط برای ادمین سیستم قابل دسترسی است.</p>
          <Link href="/" style={{ color: GOLD_D, fontWeight: 700, fontSize: 14 }}>بازگشت به خانه ←</Link>
        </div>
      </div>
    )
  }

  const pending = list.filter(s => s.status === 'pending')

  return (
    <div style={{ direction: 'rtl', fontFamily: "'Vazirmatn',Tahoma,sans-serif", background: BG, minHeight: '100vh', color: TEXT }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '28px clamp(16px,4vw,32px) 80px' }}>

        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.30)', color: GOLD_D, fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '4px 12px', letterSpacing: '0.08em', marginBottom: 10 }}>ADMIN · SELLERS</div>
          <h1 style={{ fontSize: 'clamp(21px,3vw,27px)', fontWeight: 900, letterSpacing: '-0.02em' }}>تایید فروشگاه‌ها</h1>
          <p style={{ fontSize: 13.5, color: TEXT_S, marginTop: 6 }}>
            فروشگاه‌های ثبت‌شده را بررسی کنید. فقط فروشگاه‌های تاییدشده در صفحه‌ی فروشگاه‌ها دیده می‌شوند. با آپلود جواز کسب می‌توانید تیک آبی هم بدهید.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ ...btn('rgba(245,158,11,0.10)', '#B45309', '1px solid rgba(245,158,11,0.22)'), cursor: 'default' }}>در انتظار: {pending.length}</span>
            <span style={{ ...btn('rgba(5,118,66,0.08)', '#057642', '1px solid rgba(5,118,66,0.20)'), cursor: 'default' }}>کل: {list.length}</span>
          </div>
        </div>

        {list.length === 0 ? (
          <div style={{ ...card, padding: '48px 24px', textAlign: 'center', color: TEXT_M, fontSize: 14 }}>هنوز فروشگاهی ثبت نشده است.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.map(s => {
              const st = STATUS[s.status] ?? STATUS.pending!
              const isOpen = expanded === s.slug
              const hasCert = !!s.certificate
              const phones = s.phones.filter(p => p.trim())
              return (
                <div key={s.slug} style={card}>
                  {/* Row header */}
                  <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'rgba(17,17,16,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: CBOR }}>
                      {s.logo ? <img src={s.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 800, color: TEXT_M }}>{s.title[0] ?? '؟'}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15.5, fontWeight: 800 }}>{s.title || '(بدون نام)'}</span>
                        {s.verified && (
                          <svg width="16" height="16" viewBox="0 0 40 40" aria-label="تیک آبی"><path fill="#0095F6" d="M19.998 3.094L14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094z" /><path fill="#fff" d="M18.09 24.79l-4.28-4.28 1.53-1.53 2.75 2.75 6.57-6.57 1.53 1.53z" /></svg>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: TEXT_S, marginTop: 3 }}>
                        {s.ownerName || '—'} · /sellers/{s.slug}
                      </div>
                      <div style={{ fontSize: 12, color: TEXT_M, marginTop: 3 }}>
                        {s.city || '—'}{s.contactPhone ? ` · ${s.contactPhone}` : ''}
                      </div>
                    </div>
                    <span style={{ ...btn(st.bg, st.color, `1px solid ${st.color}30`), cursor: 'default' }}>{st.label}</span>
                    <span style={{ ...btn(hasCert ? 'rgba(5,118,66,0.08)' : 'rgba(239,68,68,0.08)', hasCert ? '#057642' : '#b91c1c', hasCert ? '1px solid rgba(5,118,66,0.20)' : '1px solid rgba(239,68,68,0.20)'), cursor: 'default' }}>
                      {hasCert ? 'جواز کسب آپلود شده' : 'بدون جواز کسب'}
                    </span>
                    <button onClick={() => setExpanded(isOpen ? null : s.slug)} style={btn('transparent', TEXT_S, CBOR)}>
                      {isOpen ? 'بستن' : 'جزئیات'}
                    </button>
                  </div>

                  {/* Details */}
                  {isOpen && (
                    <div style={{ borderTop: CBOR, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {s.desc && <p style={{ fontSize: 13, color: TEXT_S, lineHeight: 1.9 }}>{s.desc}</p>}
                      {s.address && <p style={{ fontSize: 12.5, color: TEXT_S }}>آدرس: {s.address}</p>}
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5, color: TEXT_S }}>
                        {phones.length > 0 && <span>تلفن: <span style={{ direction: 'ltr', display: 'inline-block' }}>{phones.join('، ')}</span></span>}
                        {s.whatsapp  && <span>واتساپ: <span style={{ direction: 'ltr', display: 'inline-block' }}>{s.whatsapp}</span></span>}
                        {s.instagram && <span>اینستاگرام: <span style={{ direction: 'ltr', display: 'inline-block' }}>@{s.instagram}</span></span>}
                        {s.hours && <span>ساعت کاری: {s.hours}</span>}
                        {s.gallery.length > 0 && <span>تصاویر: {s.gallery.length}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {s.certificate && (
                          <a href={s.certificate.url} target="_blank" rel="noopener noreferrer" style={btn('rgba(37,99,235,0.08)', '#2563EB', '1px solid rgba(37,99,235,0.22)')}>
                            مشاهده جواز کسب ({s.certificate.name.length > 22 ? s.certificate.name.slice(0, 22) + '…' : s.certificate.name})
                          </a>
                        )}
                        <Link href={`/sellers/${s.slug}`} style={btn('transparent', GOLD_D, '1px solid rgba(199,166,106,0.34)')}>مشاهده فروشگاه</Link>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ borderTop: CBOR, padding: '13px 18px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => act(s.slug, { status: 'approved' })} style={btn('rgba(5,118,66,0.10)', '#057642', '1px solid rgba(5,118,66,0.24)')}>
                      تایید و انتشار فروشگاه
                    </button>
                    <button
                      onClick={() => hasCert && act(s.slug, { status: 'approved', verified: true })}
                      disabled={!hasCert}
                      title={hasCert ? '' : 'ابتدا فروشنده باید جواز کسب آپلود کند'}
                      style={{ ...btn('rgba(0,149,246,0.10)', '#0095F6', '1px solid rgba(0,149,246,0.28)'), opacity: hasCert ? 1 : 0.45, cursor: hasCert ? 'pointer' : 'not-allowed' }}>
                      <svg width="14" height="14" viewBox="0 0 40 40"><path fill="#0095F6" d="M19.998 3.094L14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094z" /><path fill="#fff" d="M18.09 24.79l-4.28-4.28 1.53-1.53 2.75 2.75 6.57-6.57 1.53 1.53z" /></svg>
                      اعطای تیک آبی تایید
                    </button>
                    <button onClick={() => act(s.slug, { status: 'rejected' })} style={{ ...btn('transparent', '#b91c1c', '1px solid rgba(239,68,68,0.24)'), marginInlineStart: 'auto' }}>
                      رد درخواست
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
