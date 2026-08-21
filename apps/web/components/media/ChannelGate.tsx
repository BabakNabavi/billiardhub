'use client'

/* ─────────────────────────────────────────────────────────────
   دروازه‌ی کانال — پیش از انتشارِ ویدیو از گالریِ هر نقش.

   ── چرا وجود دارد ──
   ویدیویی که در گالریِ پروفایل بالا می‌رود تا امروز فقط همان‌جا
   می‌ماند و در بیلیارد مدیا دیده نمی‌شد. مدیا کانال می‌خواهد، و
   کانال یک تصمیمِ صریحِ کاربر است نه چیزی که پنهانی ساخته شود.

   ── سه حالت ──
   ۱) هیچ کانالی ندارد        ⇒ فرمِ ساختِ کانال، همین‌جا
   ۲) کانالِ همین نقش را دارد ⇒ اصلاً باز نمی‌شود؛ مسیر عادی
   ۳) کانال دارد ولی با نقشِ دیگر ⇒ انتخاب: در کدام منتشر شود، یا
      کانالِ تازه بساز

   ⚠️ «انتشار در مدیا» اختیاری است. اگر کاربر ببندد، ویدیو در گالریِ
   پروفایل می‌ماند — بستنِ پنجره نباید آپلود را باطل کند.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Radio, Plus, Check, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/http'

export type ChannelRole =
  'club' | 'coach' | 'referee' | 'player' | 'technician' | 'seller' | 'manufacturer'

export interface UserChannel {
  ownerKey: string
  name: string
  handle: string
  bio: string
  avatar: string
  createdAt: number
  /** نقش‌هایی که این کانال خانه‌شان است */
  roles?: ChannelRole[]
  /** میدانِ قدیمی — ردیف‌های پیش از چندنقشی‌شدن */
  role?: ChannelRole
}

export const ROLE_FA: Record<ChannelRole, string> = {
  club: 'باشگاه', coach: 'مربی', referee: 'داور', player: 'بازیکن',
  technician: 'متخصص فنی', seller: 'فروشگاه', manufacturer: 'تولیدکننده',
}

const norm = (h: string) =>
  String(h || '').trim().replace(/^@+/, '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 30).toLowerCase()

/** کانال‌های کاربر. `null` یعنی نتوانستیم بخوانیم (نه «ندارد»). */
export async function loadMyChannels(ownerKey: string): Promise<UserChannel[] | null> {
  try {
    const r = await apiFetch(`/api/media/channel?all=1&owner=${encodeURIComponent(ownerKey)}`, { cache: 'no-store' })
    if (!r.ok) return null
    const j = await r.json() as { channels?: UserChannel[] }
    return Array.isArray(j?.channels) ? j.channels : []
  } catch { return null }
}

export default function ChannelGate({ role, suggestName, channels, onPick, onClose }: {
  role: ChannelRole
  /** نامِ پیشنهادیِ کانال — نامِ پروفایلِ همان نقش */
  suggestName: string
  /** کانال‌های موجودِ کاربر (می‌تواند خالی باشد) */
  channels: UserChannel[]
  /** کاربر کانالی را انتخاب کرد یا تازه ساخت */
  onPick: (c: UserChannel) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<'pick' | 'new'>(channels.length ? 'pick' : 'new')
  const [name, setName] = useState(suggestName.slice(0, 60))
  const [handle, setHandle] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLButtonElement | HTMLInputElement>(null)

  /* ⚠️ بستنِ پنجره با Escape و کلیکِ بیرون، و برگرداندنِ فوکوس — بدونِ
     این‌ها کاربرِ کیبورد داخلِ پنجره گیر می‌کند. */
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab' || !boxRef.current) return
      const f = boxRef.current.querySelectorAll<HTMLElement>('button,input,textarea,[href]')
      if (!f.length) return
      const first = f[0]!, last = f[f.length - 1]!
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    const lock = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstRef.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = lock; prev?.focus() }
  }, [onClose])

  const create = useCallback(async () => {
    setBusy(true); setErr('')
    try {
      const r = await apiFetch('/api/media/channel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), handle: norm(handle), bio: '', role }),
      })
      const j = await r.json().catch(() => ({})) as { ok?: boolean; channel?: UserChannel; message?: string }
      if (!r.ok || !j?.channel) { setErr(j?.message ?? 'ساخت کانال انجام نشد'); return }
      onPick(j.channel)
    } catch { setErr('ارتباط با سرور برقرار نشد') } finally { setBusy(false) }
  }, [name, handle, role, onPick])

  const sameRole = channels.filter(c => c.role === role)
  const otherRole = channels.filter(c => c.role !== role)

  return (
    <div className="cg-back" role="presentation" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={boxRef} className="cg-box" role="dialog" aria-modal="true" aria-labelledby="cg-title">
        <button type="button" className="cg-x" onClick={onClose} aria-label="بستن">
          <X size={17} />
        </button>

        <span className="cg-icon" aria-hidden><Radio size={20} /></span>
        <h2 id="cg-title" className="cg-title">
          {channels.length === 0 ? 'برای انتشار ویدیو، کانال بسازید' : 'این ویدیو در کدام کانال منتشر شود؟'}
        </h2>
        <p className="cg-sub">
          {channels.length === 0
            ? 'ویدیوی شما در گالریِ پروفایل می‌ماند؛ با ساختن کانال، در بیلیارد مدیا هم دیده می‌شود.'
            : `شما با نقش‌های دیگری کانال ساخته‌اید. می‌توانید در یکی از آن‌ها منتشر کنید یا کانالی برای «${ROLE_FA[role]}» بسازید.`}
        </p>

        {mode === 'pick' && (
          <>
            <ul className="cg-list">
              {[...sameRole, ...otherRole].map((c, i) => (
                <li key={c.handle}>
                  <button type="button" className="cg-item" onClick={() => onPick(c)}
                    ref={i === 0 ? (firstRef as React.RefObject<HTMLButtonElement>) : undefined}>
                    <span className="cg-item-n">{c.name}</span>
                    <span className="cg-item-h" dir="ltr">@{c.handle}</span>
                    <span className="cg-item-r">
                      {(c.roles?.length ? c.roles : c.role ? [c.role] : []).map(r => ROLE_FA[r]).join(' · ') || 'بدون نقش'}
                    </span>
                    <Check size={16} className="cg-item-i" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="cg-alt" onClick={() => setMode('new')}>
              <Plus size={15} aria-hidden /> ساخت کانال تازه برای «{ROLE_FA[role]}»
            </button>
          </>
        )}

        {mode === 'new' && (
          <div className="cg-form">
            <label className="cg-lab" htmlFor="cg-name">نام کانال</label>
            <input id="cg-name" className="cg-in" value={name} maxLength={60}
              ref={channels.length === 0 ? (firstRef as React.RefObject<HTMLInputElement>) : undefined}
              onChange={e => { setName(e.target.value); setErr('') }} />

            <label className="cg-lab" htmlFor="cg-handle">نشانی کانال</label>
            <div className="cg-handle">
              <span aria-hidden>@</span>
              <input id="cg-handle" className="cg-in cg-in--h" value={handle} dir="ltr" maxLength={30}
                placeholder="mychannel"
                onChange={e => { setHandle(norm(e.target.value)); setErr('') }} />
            </div>
            <p className="cg-hint">حروف و عدد انگلیسی، دست‌کم ۳ نویسه.</p>

            {err && <p role="alert" className="cg-err">{err}</p>}

            <div className="cg-actions">
              <button type="button" className="cg-go" disabled={busy || name.trim().length < 2 || norm(handle).length < 3}
                onClick={() => void create()}>
                {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Radio size={15} aria-hidden />}
                ساخت کانال و انتشار
              </button>
              {channels.length > 0 && (
                <button type="button" className="cg-back-btn" onClick={() => { setMode('pick'); setErr('') }}>
                  بازگشت به فهرست
                </button>
              )}
            </div>
          </div>
        )}

        <button type="button" className="cg-skip" onClick={onClose}>
          فعلاً نه — فقط در گالری بماند
        </button>
      </div>
    </div>
  )
}
