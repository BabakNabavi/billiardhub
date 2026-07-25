'use client'

/* ─────────────────────────────────────────────────────────────
   دایرکت — گفتگوی دوطرفه‌ی واقعیِ سمت‌سرور (Supabase).
   پاسخِ استوری‌ها اینجا می‌آید و صاحب‌استوری می‌تواند جواب بدهد.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/auth.store'
import { fetchConversations, fetchThread, sendDM, type ConvIndexItem, type DMsg } from '../../lib/social'
import { subscribeDM } from '../../lib/realtime'
import { ArrowRight, Inbox, Send, Check, CheckCheck } from 'lucide-react'

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
const preview = (kind: string, text: string) =>
  kind === 'reaction' ? `استیکر ${text}` : kind === 'like' ? '❤️ لایک استوری' : text

export default function DirectPage() {
  const router = useRouter()
  const { user, _hydrated } = useAuthStore()
  const [convs, setConvs] = useState<ConvIndexItem[]>([])
  const [active, setActive] = useState<ConvIndexItem | null>(null)
  const [msgs, setMsgs] = useState<DMsg[]>([])
  const [otherPoll, setOtherPoll] = useState(0)   // آخرین آنلاین‌بودنِ طرف ⇒ «رسیده»
  const [otherRead, setOtherRead] = useState(0)   // کرسرِ خواندنِ طرف ⇒ «خوانده‌شد»
  const [draft, setDraft] = useState('')
  const [ready, setReady] = useState(false)
  const [sending, setSending] = useState(false)
  const [kb, setKb] = useState(0)   // ارتفاعِ همپوشانیِ کیبورد
  const scrollRef = useRef<HTMLDivElement>(null)
  const baseVV = useRef(0)          // ارتفاعِ ویوپورت وقتی کیبورد بسته است
  const headerRef = useRef<HTMLElement>(null)
  const [headerH, setHeaderH] = useState(84)   // ارتفاعِ واقعیِ هدرِ fixed (پویا)
  const activeRef = useRef<ConvIndexItem | null>(null)   // برای هندلرهای Realtime
  const lastAtRef = useRef(0)                            // آخرین زمانِ پیامِ واقعی (خواندنِ افزایشی)

  useEffect(() => {
    const measure = () => { if (headerRef.current) setHeaderH(headerRef.current.offsetHeight) }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [active])

  /* اسکرول داخلِ کانتینرِ پیام‌ها (نه window) ⇒ بدون لرزش، پیام‌ها هرگز زیرِ هدر نمی‌روند */
  const scrollBottom = () => requestAnimationFrame(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight })

  /* نوارِ پاسخ باید دقیقاً بالای کیبوردِ موبایل بماند — از baselineِ VisualViewport
     (نه innerHeight که روی iOS بزرگ‌تر است و فاصله می‌انداخت) */
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!vv) return
    baseVV.current = vv.height
    const onResize = () => {
      if (vv.height > baseVV.current) baseVV.current = vv.height   // نوارِ ابزار جمع شد ⇒ baseline بزرگ‌تر
      const overlap = Math.max(0, Math.round(baseVV.current - vv.height))
      setKb(overlap)
      if (overlap > 0) scrollBottom()
    }
    vv.addEventListener('resize', onResize); vv.addEventListener('scroll', onResize)
    return () => { vv.removeEventListener('resize', onResize); vv.removeEventListener('scroll', onResize) }
  }, [])

  /* هر بار پیام‌ها عوض شدند ⇒ به آخرین پیام اسکرول کن (مثل اینستاگرام) */
  useEffect(() => { if (active) scrollBottom() }, [msgs.length, active]) // eslint-disable-line
  /* activeRef را همگام نگه دار (هندلرهای Realtime از آن می‌خوانند) */
  useEffect(() => { activeRef.current = active }, [active])

  const meKey = user ? (user.phone || user.id || (user.firstName ?? 'user')) : ''
  const meName = user ? (`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'کاربر') : ''

  useEffect(() => { if (_hydrated && !user) router.replace('/login') }, [_hydrated, user, router])

  const loadConvs = async () => { if (meKey) { setConvs(await fetchConversations(meKey)); setReady(true) } }
  useEffect(() => { if (user) loadConvs() }, [user]) // eslint-disable-line

  /* ادغامِ پیام‌ها بدونِ تکرار؛ tmpِ خوش‌بینانه را با نسخه‌ی واقعیِ هم‌متن جایگزین کن */
  const mergeMsgs = (prev: DMsg[], incoming: DMsg[]): DMsg[] => {
    const byId = new Map<string, DMsg>()
    for (const m of prev) byId.set(m.id, m)
    for (const m of incoming) byId.set(m.id, m)
    let arr = [...byId.values()]
    const realMine = new Set(arr.filter(m => !m.id.startsWith('tmp-') && m.fromKey === meKey).map(m => m.text))
    arr = arr.filter(m => !(m.id.startsWith('tmp-') && realMine.has(m.text)))
    arr.sort((a, b) => a.at - b.at)
    const maxReal = arr.filter(m => !m.id.startsWith('tmp-')).reduce((mx, m) => Math.max(mx, m.at), 0)
    if (maxReal > lastAtRef.current) lastAtRef.current = maxReal
    return arr
  }

  /* Realtime: کانالِ دایرکتِ خودم — پیام و رسیدِ خواندن آنی می‌آیند (بدونِ انتظارِ پول) */
  useEffect(() => {
    if (!meKey) return
    const stop = subscribeDM(meKey, {
      onMsg: (p) => {
        loadConvs()
        const cur = activeRef.current
        if (cur && p.convId === cur.convId) {
          setMsgs(prev => mergeMsgs(prev, [p.message]))
          scrollBottom()
          /* پیامِ ورودی را «خوانده» علامت بزن (چون ترد باز است) */
          if (p.message.fromKey !== meKey) fetchThread(cur.convId, meKey, lastAtRef.current)
        }
      },
      onRead: (p) => {
        const cur = activeRef.current
        if (cur && p.convId === cur.convId) setOtherRead(r => Math.max(r, p.at || 0))
      },
    })
    return stop
  }, [meKey]) // eslint-disable-line

  /* تورِ ایمنی: پولِ افزایشیِ آرام (Realtime اصل است) */
  useEffect(() => {
    if (!user) return
    const t = setInterval(() => { const c = activeRef.current; if (c) refreshThread(c) }, 5000)
    const l = setInterval(loadConvs, 12000)
    return () => { clearInterval(t); clearInterval(l) }
  }, [user]) // eslint-disable-line

  /* خواندنِ افزایشی: فقط پیام‌های تازه‌تر از آخرین‌چه‌داریم را می‌گیرد و ادغام می‌کند */
  const refreshThread = async (c: ConvIndexItem) => {
    const t = await fetchThread(c.convId, meKey, lastAtRef.current)
    if (t.messages.length) { setMsgs(prev => mergeMsgs(prev, t.messages)); scrollBottom() }
    setOtherPoll(t.otherPoll || 0); setOtherRead(t.otherRead || 0)
  }
  /* وضعیتِ تیک برای پیام‌های خودم: sent / delivered / read */
  const msgStatus = (m: DMsg): 'sent' | 'delivered' | 'read' => {
    if (otherRead >= m.at) return 'read'
    if (otherPoll >= m.at) return 'delivered'
    return 'sent'
  }
  const openConv = async (c: ConvIndexItem) => {
    setActive(c); activeRef.current = c; lastAtRef.current = 0
    setMsgs([]); setOtherPoll(0); setOtherRead(0)
    const t = await fetchThread(c.convId, meKey, 0)
    setMsgs(mergeMsgs([], t.messages)); setOtherPoll(t.otherPoll || 0); setOtherRead(t.otherRead || 0)
    scrollBottom()
    loadConvs()   // unread صفر شد
  }

  const send = async () => {
    if (!draft.trim() || !active || sending) return
    setSending(true)
    const text = draft.trim(); setDraft('')
    /* نمایشِ خوش‌بینانه — پیام فوری دیده می‌شود */
    const tmpId = `tmp-${Date.now()}`
    const optimistic: DMsg = { id: tmpId, fromKey: meKey, text, kind: 'text', at: Date.now() }
    setMsgs(m => [...m, optimistic]); scrollBottom()
    const res = await sendDM({
      from: { key: meKey, name: meName, role: undefined },
      to: { key: active.otherKey, name: active.otherName, role: active.otherRole },
      text, kind: 'text',
    })
    /* tmp را با پیامِ واقعیِ سرور جایگزین کن (چون برادکستِ خودم به خودم نمی‌آید) */
    const real = (res as { message?: DMsg }).message
    if (real) setMsgs(prev => mergeMsgs(prev.filter(m => m.id !== tmpId), [real]))
    loadConvs()
    setSending(false)
  }

  const totalUnread = useMemo(() => convs.reduce((n, c) => n + (c.unread || 0), 0), [convs])

  if (!_hydrated || !user) return null

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F7F5F0', color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      {/* هدر fixed (sticky روی iOS گلیچ می‌کرد و ردیف زیرش می‌رفت) */}
      <header ref={headerRef} style={{ background: '#fff', borderBottom: `1px solid ${LINE}`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '13px clamp(14px,3vw,22px)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => (active ? setActive(null) : router.back())} aria-label="بازگشت"
            style={{ display: 'flex', background: '#F4F3F1', border: `1px solid ${LINE}`, borderRadius: 10, padding: 8, cursor: 'pointer', color: SEC }}>
            <ArrowRight size={17} />
          </button>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.24em', color: MUT }}>STORY DIRECT</span>
            <h1 style={{ fontSize: 17.5, fontWeight: 900, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {active ? active.otherName : 'دایرکت'}
            </h1>
          </div>
          {!active && totalUnread > 0 && (
            <span style={{ marginInlineStart: 'auto', fontSize: 11, fontWeight: 800, color: '#fff', background: '#ef4444', borderRadius: 999, padding: '3px 9px' }}>
              {totalUnread.toLocaleString('fa-IR')} جدید
            </span>
          )}
        </div>
      </header>

      {/* padding-top = ارتفاعِ واقعیِ هدرِ fixed تا محتوا زیرش نرود */}
      <main style={{ maxWidth: 760, margin: '0 auto', paddingTop: headerH, paddingInline: active ? 0 : 'clamp(14px,3vw,22px)', paddingBottom: active ? 0 : 80 }}>
        {/* ── لیست گفتگوها ── */}
        {!active && (
          ready && convs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '70px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18 }}>
              <span style={{ display: 'inline-flex', width: 62, height: 62, borderRadius: 18, background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.3)', alignItems: 'center', justifyContent: 'center', color: GOLD_D, marginBottom: 16 }}>
                <Inbox size={26} />
              </span>
              <p style={{ fontSize: 15.5, fontWeight: 800, margin: '0 0 6px' }}>هنوز گفتگویی ندارید</p>
              <p style={{ fontSize: 13, color: MUT, lineHeight: 2, margin: 0 }}>
                وقتی کسی به استوریِ شما پاسخ بدهد، گفتگو اینجا ساخته می‌شود و می‌توانید جواب بدهید.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {convs.map(c => (
                <button key={c.convId} onClick={() => openConv(c)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '12px 14px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', width: '100%' }}>
                  <span style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, color: '#241B08', background: 'linear-gradient(135deg,#E8CE96,#8A6020)' }}>
                    {c.otherName.charAt(0)}
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.otherName}</span>
                      {c.otherRole && <span style={{ fontSize: 10, color: MUT }}>{c.otherRole}</span>}
                      <span style={{ marginInlineStart: 'auto', fontSize: 10.5, color: MUT, flexShrink: 0 }}>{timeAgo(c.lastAt)}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 12.5, color: c.unread ? TEXT : MUT, fontWeight: c.unread ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {preview(c.lastKind, c.lastText)}
                      </span>
                      {c.unread > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: '#ef4444', borderRadius: 999, minWidth: 18, height: 18, padding: '0 5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {c.unread.toLocaleString('fa-IR')}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )
        )}

        {/* ── ترد گفتگو — ستونِ ثابت: هدر ثابت / پیام‌ها اسکرولِ داخلی / نوار پاسخ بالای کیبورد ── */}
        {active && (
          <div style={{ position: 'fixed', top: headerH, left: 0, right: 0, bottom: kb, zIndex: 20, display: 'flex', flexDirection: 'column', background: '#F7F5F0', transition: 'bottom .12s ease' }}>
            {/* پیام‌ها — کانتینرِ اسکرول‌شونده‌ی داخلی */}
            <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', width: '100%', maxWidth: 760, margin: '0 auto', padding: '18px clamp(14px,3vw,22px) 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {msgs.length === 0 && <p style={{ textAlign: 'center', fontSize: 12.5, color: MUT, marginTop: 30 }}>هنوز پیامی نیست</p>}
              {msgs.map(m => {
                const mine = m.fromKey === meKey
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-start' : 'flex-end' }}>
                    <div style={{ maxWidth: '78%', padding: m.kind === 'reaction' ? '6px 12px' : '9px 13px', borderRadius: mine ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                      background: mine ? 'linear-gradient(135deg,rgba(199,166,106,0.2),rgba(199,166,106,0.12))' : '#fff',
                      border: `1px solid ${mine ? 'rgba(199,166,106,0.3)' : LINE}` }}>
                      <div style={{ fontSize: m.kind === 'reaction' ? 22 : 13.5, lineHeight: 1.9, color: TEXT, wordBreak: 'break-word' }}>
                        {m.kind === 'like' ? '❤️' : m.text}
                      </div>
                      <div style={{ fontSize: 9.5, color: MUT, marginTop: 3, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-start', flexDirection: 'row-reverse' }}>
                        <span>{timeAgo(m.at)}</span>
                        {mine && (() => {
                          const st = msgStatus(m)
                          return st === 'read'
                            ? <CheckCheck size={13} style={{ color: '#3B82F6' }} />
                            : st === 'delivered'
                              ? <CheckCheck size={13} style={{ color: MUT }} />
                              : <Check size={13} style={{ color: MUT }} />
                        })()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* نوارِ پاسخ — کفِ ستون؛ چون ستون با bottom=kb بالای کیبورد است، همیشه دیده می‌شود */}
            <div style={{ flexShrink: 0, borderTop: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
              <div style={{ maxWidth: 760, margin: '0 auto', padding: kb > 0 ? '10px clamp(14px,3vw,22px)' : '10px clamp(14px,3vw,22px) calc(12px + env(safe-area-inset-bottom))', display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="پیام خود را بنویسید…"
                  style={{ flex: 1, minWidth: 0, padding: '11px 15px', borderRadius: 100, border: `1px solid ${LINE}`, background: '#FAFAF7', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: TEXT }} />
                {/* دکمه‌ی ارسال — بزرگ‌تر، طرح LQ (تینت طلایی + بوردر) */}
                <button onClick={send} disabled={!draft.trim() || sending} aria-label="ارسال"
                  style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, cursor: draft.trim() ? 'pointer' : 'not-allowed',
                    background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD_D, opacity: draft.trim() ? 1 : 0.55,
                    transition: 'transform .2s, background .2s, box-shadow .2s', boxShadow: draft.trim() ? '0 6px 18px rgba(199,166,106,0.22)' : 'none' }}
                  onMouseEnter={e => { if (draft.trim()) { (e.currentTarget as HTMLElement).style.background = 'rgba(199,166,106,0.24)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(199,166,106,0.14)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                  <Send size={22} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
