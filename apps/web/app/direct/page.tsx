'use client'

/* ─────────────────────────────────────────────────────────────
   دایرکت — گفتگوی دوطرفه‌ی واقعیِ سمت‌سرور (Supabase).
   پاسخِ استوری‌ها اینجا می‌آید و صاحب‌استوری می‌تواند جواب بدهد.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/auth.store'
import { fetchConversations, fetchThread, sendDM, deleteConversation, type ConvIndexItem, type DMsg } from '../../lib/social'
import { subscribeDM } from '../../lib/realtime'
import { useVisualViewport } from '../../lib/useVisualViewport'
import { enablePush, pushPermission } from '../../lib/push-client'
import { toast } from '../../components/ui/Toast'
import { ArrowRight, Inbox, Send, Check, CheckCheck, Bell, Trash2 } from 'lucide-react'

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<ConvIndexItem | null>(null)   // برای هندلرهای Realtime
  const lastAtRef = useRef(0)                            // آخرین زمانِ پیامِ واقعی (خواندنِ افزایشی)
  const convSeq = useRef(0)                              // فقط آخرین loadConvs اعمال شود (رفعِ برگشتِ چتِ پاک‌شده)
  const [pushState, setPushState] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('unsupported')
  const [confirmDel, setConfirmDel] = useState(false)

  /* منبعِ واحدِ ویوپورت: کلِ صفحه دقیقاً روی ناحیه‌ی دیدنی می‌نشیند (height + translateY)
     ⇒ نوارِ پاسخ همیشه بالای کیبورد، پیام‌ها هرگز زیرِ هدر، بدونِ جابجاییِ iOS */
  const vp = useVisualViewport()

  /* اسکرول داخلِ کانتینرِ پیام‌ها (نه window) ⇒ بدون لرزش، پیام‌ها هرگز زیرِ هدر نمی‌روند */
  const scrollBottom = () => requestAnimationFrame(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight })

  /* پیام‌ها عوض شد یا کیبورد باز/بسته شد ⇒ به آخرین پیام اسکرول کن */
  useEffect(() => { if (active) scrollBottom() }, [msgs.length, active, vp.height, vp.kb]) // eslint-disable-line
  /* activeRef را همگام نگه دار (هندلرهای Realtime از آن می‌خوانند) */
  useEffect(() => { activeRef.current = active }, [active])

  const meKey = user ? (user.phone || user.id || (user.firstName ?? 'user')) : ''
  const meName = user ? (`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'کاربر') : ''

  useEffect(() => { if (_hydrated && !user) router.replace('/login') }, [_hydrated, user, router])

  /* فقط نتیجه‌ی آخرین درخواست اعمال می‌شود؛ یک loadConvsِ کهنه‌ی در راه نمی‌تواند
     چتِ تازه‌پاک‌شده را دوباره برگرداند */
  const loadConvs = async () => {
    if (!meKey) return
    const seq = ++convSeq.current
    const list = await fetchConversations(meKey)
    if (seq === convSeq.current) { setConvs(list); setReady(true) }
  }
  useEffect(() => { if (user) loadConvs() }, [user]) // eslint-disable-line

  /* Web Push: وضعیتِ مجوز؛ اگر قبلاً granted بوده، اشتراک را بی‌صدا تازه کن */
  useEffect(() => {
    if (!meKey) return
    const p = pushPermission(); setPushState(p)
    if (p === 'granted') enablePush(meKey, true)
  }, [meKey])
  const askPush = async () => {
    const r = await enablePush(meKey)
    setPushState(r === 'ok' ? 'granted' : r === 'denied' ? 'denied' : pushPermission())
    if (r === 'ok') toast('اعلانِ پیام‌ها روشن شد ✓', 'success')
    else if (r === 'denied') toast('اجازه‌ی اعلان داده نشد؛ از تنظیماتِ اپ/مرورگر اجازه دهید', 'warning')
    else if (r === 'unsupported') toast('روی آیفون اول اپ را به هوم‌اسکرین اضافه کنید و از همان‌جا باز کنید', 'warning')
    else toast('روشن‌کردنِ اعلان ناموفق بود؛ دوباره تلاش کنید', 'error')
  }

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
      onPoll: (p) => {
        /* طرفِ مقابل الان آنلاین است ⇒ تیکِ «رسیده» بدونِ انتظارِ پول */
        const cur = activeRef.current
        if (cur && p.convId === cur.convId) setOtherPoll(x => Math.max(x, p.at || 0))
      },
      onStatus: (s) => {
        /* اشتراک تازه برقرار/دوباره‌وصل شد ⇒ هرچه در فاصله‌ی اتصال از دست رفته را فوری بگیر */
        if (s === 'SUBSCRIBED') { loadConvs(); const c = activeRef.current; if (c) refreshThread(c) }
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

  /* برگشت به اپ / آنلاین‌شدن ⇒ همگام‌سازیِ فوری. iOS وب‌سوکت را در پس‌زمینه می‌بندد؛
     این تضمین می‌کند پیام‌هایِ ازدست‌رفته هنگام بستنِ اپ، موقعِ برگشت بیایند. */
  useEffect(() => {
    if (!user) return
    const resync = () => {
      if (document.visibilityState !== 'visible') return
      loadConvs()
      const c = activeRef.current; if (c) refreshThread(c)
    }
    document.addEventListener('visibilitychange', resync)
    window.addEventListener('online', resync)
    window.addEventListener('focus', resync)
    return () => {
      document.removeEventListener('visibilitychange', resync)
      window.removeEventListener('online', resync)
      window.removeEventListener('focus', resync)
    }
  }, [user]) // eslint-disable-line

  /* خواندنِ افزایشی: فقط پیام‌های تازه‌تر از آخرین‌چه‌داریم را می‌گیرد و ادغام می‌کند.
     کرسرهای رسید فقط جلو می‌روند (Math.max) — قبلاً پاسخِ کهنه‌ی storage مقدارِ
     realtime را بازنویسی می‌کرد و تیکِ آبی برمی‌گشت به یک تیک. */
  const refreshThread = async (c: ConvIndexItem) => {
    const t = await fetchThread(c.convId, meKey, lastAtRef.current)
    if (t.messages.length) { setMsgs(prev => mergeMsgs(prev, t.messages)); scrollBottom() }
    setOtherPoll(x => Math.max(x, t.otherPoll || 0))
    setOtherRead(x => Math.max(x, t.otherRead || 0))
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
    setMsgs(mergeMsgs([], t.messages))
    setOtherPoll(x => Math.max(x, t.otherPoll || 0))
    setOtherRead(x => Math.max(x, t.otherRead || 0))
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
    /* پاسخِ ارسال، حضورِ گیرنده را هم می‌گوید ⇒ تیکِ «رسیده» همان لحظه */
    const op = (res as { otherPoll?: number }).otherPoll
    if (op) setOtherPoll(x => Math.max(x, op))
    loadConvs()
    setSending(false)
    /* تیک‌ها سریع‌تر: کمی بعد از ارسال، وضعیتِ «رسیده/خوانده‌شد» را فوری بگیر */
    setTimeout(() => { const c = activeRef.current; if (c) refreshThread(c) }, 1200)
    setTimeout(() => { const c = activeRef.current; if (c) refreshThread(c) }, 3500)
  }

  /* پاک‌کردنِ گفتگو — فقط از سمتِ خودِ کاربر (مثل اینستاگرام) */
  const doDelConv = async () => {
    if (!active) return
    const cid = active.convId
    setConfirmDel(false)
    convSeq.current++   // هر loadConvsِ در راه را باطل کن تا چت برنگردد
    setConvs(cs => cs.filter(c => c.convId !== cid))
    setActive(null); activeRef.current = null; setMsgs([]); lastAtRef.current = 0
    await deleteConversation(cid, meKey)
    loadConvs()
    toast('گفتگو پاک شد', 'success')
  }

  const totalUnread = useMemo(() => convs.reduce((n, c) => n + (c.unread || 0), 0), [convs])

  if (!_hydrated || !user) return null

  return (
    /* ستونِ ثابت که دقیقاً روی ناحیه‌ی دیدنی می‌نشیند (height=vp.height، translateY=offsetTop).
       هدر بالا / محتوا وسط با اسکرولِ داخلی / نوارِ پاسخ پایین ⇒ همیشه بالای کیبورد،
       پیام‌ها هرگز زیرِ هدر، و روی iOS با کیبورد جابجا/نصفه نمی‌شود. */
    <div dir="rtl" style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: vp.height || '100dvh',
      transform: vp.offsetTop ? `translateY(${vp.offsetTop}px)` : undefined,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: '#F7F5F0', color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif',
    }}>
      {/* هدر — آیتمِ اولِ ستون (نه fixed) */}
      <header style={{ flexShrink: 0, background: '#fff', borderBottom: `1px solid ${LINE}`, paddingTop: 'env(safe-area-inset-top)' }}>
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
          {active && (
            <button onClick={() => setConfirmDel(true)} aria-label="حذف گفتگو"
              style={{ marginInlineStart: 'auto', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: MUT, padding: 8, borderRadius: 10, flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = MUT }}>
              <Trash2 size={19} />
            </button>
          )}
        </div>
      </header>

      {/* ── لیست گفتگوها — کانتینرِ اسکرولِ داخلی (ردیف هرگز زیرِ هدر نمی‌رود) ── */}
      {!active && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '14px clamp(14px,3vw,22px) calc(24px + env(safe-area-inset-bottom))' }}>
            {/* بنرِ فعال‌سازیِ اعلانِ Web Push */}
            {pushState === 'default' && (
              <button onClick={askPush}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'right', marginBottom: 12, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', borderRadius: 12, padding: '11px 14px', cursor: 'pointer', fontFamily: 'inherit', color: GOLD_D }}>
                <span style={{ display: 'inline-flex', width: 34, height: 34, borderRadius: 9, background: 'rgba(199,166,106,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Bell size={17} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: TEXT }}>اعلانِ پیام‌ها را روشن کنید</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: MUT, marginTop: 1 }}>تا وقتی اپ بسته است هم از پیام‌های جدید باخبر شوید</span>
                </span>
              </button>
            )}
            {ready && convs.length === 0 ? (
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
            )}
          </div>
        </div>
      )}

      {/* ── ترد گفتگو ── */}
      {active && (
        <>
          <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px clamp(14px,3vw,22px) 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          </div>
          {/* نوارِ پاسخ — آیتمِ آخرِ ستون؛ چون ستون هم‌اندازه‌ی ناحیه‌ی دیدنی است، همیشه بالای کیبورد دیده می‌شود */}
          <div style={{ flexShrink: 0, borderTop: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', padding: vp.kb > 0 ? '10px clamp(14px,3vw,22px)' : '10px clamp(14px,3vw,22px) calc(12px + env(safe-area-inset-bottom))', display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="پیام خود را بنویسید…"
                style={{ flex: 1, minWidth: 0, padding: '11px 15px', borderRadius: 100, border: `1px solid ${LINE}`, background: '#FAFAF7', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: TEXT }} />
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
        </>
      )}

      {/* دیالوگِ تأییدِ حذف — مدرن، وسطِ صفحه */}
      {confirmDel && (
        <div onClick={() => setConfirmDel(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(20,18,14,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 340, background: '#fff', borderRadius: 20, border: `1px solid ${LINE}`, boxShadow: '0 30px 70px rgba(20,18,14,0.28)', padding: '24px 22px 18px', textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', width: 54, height: 54, borderRadius: 16, background: 'rgba(239,68,68,0.1)', color: '#ef4444', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Trash2 size={24} />
            </span>
            <h3 style={{ fontSize: 16.5, fontWeight: 900, margin: '0 0 7px', color: TEXT }}>حذفِ گفتگو</h3>
            <p style={{ fontSize: 13, color: MUT, lineHeight: 2, margin: '0 0 20px' }}>
              این گفتگو فقط برای شما پاک می‌شود؛ برای طرفِ مقابل باقی می‌ماند.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDel(false)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${LINE}`, background: '#F4F3F1', color: SEC, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                انصراف
              </button>
              <button onClick={doDelConv}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.9)', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
