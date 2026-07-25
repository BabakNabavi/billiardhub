'use client'

/* ─────────────────────────────────────────────────────────────
   دایرکتِ استوری — پاسخ‌ها و استیکرهایی که مخاطبان به استوریِ
   شما فرستاده‌اند (مثلِ دایرکتِ اینستاگرام برای پاسخِ استوری).
   فقط نقش‌های واجدِ استوری محتوا دارند؛ کاربر عادی اینباکس خالی می‌بیند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/auth.store'
import { getInbox, markInboxRead, removeReply, type StoryReply } from '../../lib/story-inbox'
import { storyLimitFor } from '../../lib/story-store'
import { ArrowRight, Inbox, Heart, MessageCircle, Trash2, Send } from 'lucide-react'

const GOLD = '#C7A66A'
const GOLD_D = '#9A6E38'
const TEXT = '#1C1B17'
const SEC = '#5B564B'
const MUT = '#8A8474'
const LINE = '#E7E2D6'

function timeAgo(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 1000)
  if (d < 60) return 'همین حالا'
  if (d < 3600) return `${Math.floor(d / 60).toLocaleString('fa-IR')} دقیقه پیش`
  if (d < 86400) return `${Math.floor(d / 3600).toLocaleString('fa-IR')} ساعت پیش`
  return `${Math.floor(d / 86400).toLocaleString('fa-IR')} روز پیش`
}

export default function DirectPage() {
  const router = useRouter()
  const { user, _hydrated } = useAuthStore()
  const [items, setItems] = useState<StoryReply[]>([])
  const [ready, setReady] = useState(false)

  const ownerKey = user ? (user.phone || user.id || (user.firstName ?? 'user')) : ''
  const eligible = user ? storyLimitFor([user.primaryRole, ...(user.secondaryRoles ?? [])]) > 0 : false

  useEffect(() => {
    if (_hydrated && !user) router.replace('/login')
  }, [_hydrated, user, router])

  const reload = () => setItems(getInbox(ownerKey))
  useEffect(() => {
    if (!user) return
    reload()
    markInboxRead(ownerKey)   // بازدید ⇒ همه خوانده‌شده
    setReady(true)
  }, [user]) // eslint-disable-line

  const grouped = useMemo(() => {
    const m = new Map<string, StoryReply[]>()
    for (const r of items) {
      const arr = m.get(r.fromName) ?? []
      arr.push(r); m.set(r.fromName, arr)
    }
    return Array.from(m.entries())
  }, [items])

  if (!_hydrated || !user) return null

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F7F5F0', color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      {/* هدر */}
      <header style={{ background: '#fff', borderBottom: `1px solid ${LINE}`, position: 'sticky', top: 0, zIndex: 20, paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px clamp(16px,3vw,24px)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} aria-label="بازگشت"
            style={{ display: 'flex', background: '#F4F3F1', border: `1px solid ${LINE}`, borderRadius: 10, padding: 8, cursor: 'pointer', color: SEC }}>
            <ArrowRight size={17} />
          </button>
          <div>
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.24em', color: MUT }}>STORY DIRECT</span>
            <h1 style={{ fontSize: 18, fontWeight: 900, margin: '2px 0 0' }}>دایرکت</h1>
          </div>
          <span style={{ marginInlineStart: 'auto', fontSize: 12, color: MUT }}>
            {items.length > 0 ? `${items.length.toLocaleString('fa-IR')} پاسخ` : ''}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '18px clamp(16px,3vw,24px) 80px' }}>
        {ready && items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18 }}>
            <span style={{ display: 'inline-flex', width: 62, height: 62, borderRadius: 18, background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.3)', alignItems: 'center', justifyContent: 'center', color: GOLD_D, marginBottom: 16 }}>
              <Inbox size={26} />
            </span>
            <p style={{ fontSize: 15.5, fontWeight: 800, margin: '0 0 6px' }}>هنوز پاسخی نرسیده</p>
            <p style={{ fontSize: 13, color: MUT, lineHeight: 2, margin: 0 }}>
              {eligible
                ? 'وقتی کسی به استوریِ شما پاسخ یا استیکر بفرستد، اینجا نمایش داده می‌شود.'
                : 'حساب شما امکان انتشار استوری ندارد؛ پس پاسخی هم دریافت نمی‌کند.'}
            </p>
            {eligible && (
              <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18, padding: '10px 20px', borderRadius: 11, textDecoration: 'none', fontSize: 13, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)' }}>
                رفتن به استوری‌ها <Send size={13} />
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {grouped.map(([name, list]) => (
              <div key={name}>
                {/* سربرگِ فرستنده */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '0 2px' }}>
                  <span style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#241B08', background: 'linear-gradient(135deg,#E8CE96,#8A6020)' }}>
                    {name.charAt(0)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{name}</div>
                    {list[0]?.fromRole && <div style={{ fontSize: 10.5, color: MUT }}>{list[0].fromRole}</div>}
                  </div>
                  <span style={{ marginInlineStart: 'auto', fontSize: 11, color: MUT }}>{list.length.toLocaleString('fa-IR')} پیام</span>
                </div>

                {/* پیام‌ها */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {list.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '12px 14px' }}>
                      <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: r.kind === 'reaction' ? 'rgba(239,68,68,0.08)' : 'rgba(199,166,106,0.1)',
                        border: `1px solid ${r.kind === 'reaction' ? 'rgba(239,68,68,0.22)' : 'rgba(199,166,106,0.28)'}` }}>
                        {r.kind === 'reaction'
                          ? <span style={{ fontSize: 17 }}>{r.text}</span>
                          : <MessageCircle size={15} style={{ color: GOLD_D }} />}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {r.kind === 'reaction'
                          ? <div style={{ fontSize: 13, color: SEC }}>با استیکر <span style={{ fontSize: 16 }}>{r.text}</span> به استوری شما واکنش نشان داد</div>
                          : <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.9, wordBreak: 'break-word' }}>{r.text}</div>}
                        {r.caption && (
                          <div style={{ fontSize: 11, color: MUT, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Heart size={10} style={{ color: GOLD }} /> پاسخ به: «{r.caption}»
                          </div>
                        )}
                        <div style={{ fontSize: 10.5, color: MUT, marginTop: 5 }}>{timeAgo(r.at)}</div>
                      </div>
                      <button onClick={() => { removeReply(r.id); reload() }} aria-label="حذف"
                        style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: MUT, padding: 4, flexShrink: 0 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
