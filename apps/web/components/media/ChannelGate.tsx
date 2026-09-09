'use client'

/* ─────────────────────────────────────────────────────────────
   دروازه‌ی کانال — پیش از انتشار ویدیو از گالری هر نقش.

   ── چرا وجود دارد ──
   ویدیویی که در گالری پروفایل بالا می‌رود تا امروز فقط همان‌جا
   می‌ماند و در بیلیارد مدیا دیده نمی‌شد. مدیا کانال می‌خواهد، و
   کانال یک تصمیم صریح کاربر است نه چیزی که پنهانی ساخته شود.

   ── سه حالت ──
   ۱) هیچ کانالی ندارد        ⇒ فرم ساخت کانال، همین‌جا
   ۲) کانال همین نقش را دارد ⇒ اصلا باز نمی‌شود؛ مسیر عادی
   ۳) کانال دارد ولی با نقش دیگر ⇒ انتخاب: در کدام منتشر شود، یا
      کانال تازه بساز

   ⚠️ «انتشار در مدیا» اختیاری است. اگر کاربر ببندد، ویدیو در گالری
   پروفایل می‌ماند — بستن پنجره نباید آپلود را باطل کند.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, Radio, Plus, Check, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/http'

/* تایپ، اتحاد نقش‌ها، برچسب فارسی و قاعده‌ی هندل — همه از منبع واحد.
   ⚠️ `norm` اینجا کپی دستی قاعده‌ی سرور بود؛ اگر یکی عوض می‌شد،
   کاربر هندلی می‌دید که سرور چیز دیگری از آن می‌ساخت. */
import { ROLE_FA, normHandle as norm, servesRole, roleLabels, type ChannelRole, type UserChannel } from '@/lib/media/channel'

/* خواندن کانال‌ها یک نسخه بیشتر ندارد؛ این‌جا فقط نام آشنا را
   نگه می‌داریم تا مصرف‌کننده‌ها دست نخورند. */
export { fetchMyChannels as loadMyChannels } from '@/lib/media-user'

export default function ChannelGate({ role, suggestName, channels, onPick, onSkip, onClose, when = 'after' }: {
  role: ChannelRole
  /** ── کی پرسیده شده ──
   *  `before` یعنی هنوز فایلی انتخاب نشده (پیش از انتخابگر فایل)،
   *  `after` یعنی ویدیو در گالری نشسته و فقط انتشار مانده.
   *
   *  ⚠️ متن باید فرق کند: «این ویدیو…» و «…و انتشار» در حالت
   *  `before` دروغ است — هنوز هیچ ویدیویی وجود ندارد. */
  when?: 'before' | 'after'
  /** نام پیشنهادی کانال — نام پروفایل همان نقش */
  suggestName: string
  /** کانال‌های موجود کاربر (می‌تواند خالی باشد) */
  channels: UserChannel[]
  /** کاربر کانالی را انتخاب کرد یا تازه ساخت.
   *  ⚠️ باید **همگام** مصرف شود — کلیک کاربر تنها اجازه‌ای است که
   *  انتخابگر فایل را باز می‌کند و با یک `await` از دست می‌رود. */
  onPick: (c: UserChannel) => void
  /** «فعلا نه» — تصمیم صریح: تا پایان نشست دیگر نپرس */
  onSkip: () => void
  /** X / Escape / کلیک بیرون — «الان نه»، نه «هیچ‌وقت» */
  onClose: () => void
}) {
  const [mode, setMode] = useState<'pick' | 'new'>(channels.length ? 'pick' : 'new')
  const [name, setName] = useState(suggestName.slice(0, 60))
  const [handle, setHandle] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  /* ⚠️ ساخت کانال یک رفت‌وبرگشت شبکه است. اگر بلافاصله بعدش
     `onPick` را صدا بزنیم، «حرکت کاربر» مصرف شده و روی سافاری
     انتخابگر فایل باز نمی‌شود. پس یک گام کوتاه می‌ماند و کلیک
     خود کاربر روی آن، اجازه‌ی تازه است. */
  const [made, setMade] = useState<UserChannel | null>(null)
  /* ⚠️ با نشستن `made` کل فرم — و دکمه‌ی فوکوس‌دار — از درخت
     می‌رود و فوکوس به `<body>` می‌افتد: کاربر کیبورد نه پیام را
     می‌شنود نه روی تنها کار باقی‌مانده می‌ایستد. */
  const doneRef = useRef<HTMLButtonElement>(null)
  /* لمس دوم نباید دو بار `onPick` بزند (دو POST، دو انتخابگر) */
  const [going, setGoing] = useState(false)
  useEffect(() => { if (made) doneRef.current?.focus() }, [made])
  const boxRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLButtonElement | HTMLInputElement>(null)

  /* ⚠️ بستن پنجره با Escape و کلیک بیرون، و برگرداندن فوکوس — بدون
     این‌ها کاربر کیبورد داخل پنجره گیر می‌کند. */
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
      /* در حالت «بعد از آپلود» ویدیو آماده است و معطلی بی‌معناست */
      if (when === 'after') { onPick(j.channel); return }
      setMade(j.channel)
    } catch { setErr('ارتباط با سرور برقرار نشد') } finally { setBusy(false) }
  }, [name, handle, role, when, onPick])

  /* ⚠️ فقط `role` را می‌دید؛ کانال چندنقشی که این نقش را در
     `roles` داشت، «نقش دیگر» شمرده می‌شد. */
  const sameRole = channels.filter(c => servesRole(c, role))
  const otherRole = channels.filter(c => !servesRole(c, role))

  return (
    <div className="cg-back" role="presentation" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={boxRef} className="cg-box" role="dialog" aria-modal="true" aria-labelledby="cg-title">
        <button type="button" className="cg-x" onClick={onClose} aria-label="بستن">
          <X size={17} />
        </button>

        <span className="cg-icon" aria-hidden><Radio size={20} /></span>
        <h2 id="cg-title" className="cg-title">
          {made ? 'کانال ساخته شد'
            : channels.length === 0 ? 'برای انتشار ویدیو، کانال بسازید'
            : when === 'before' ? 'ویدیو در کدام کانال منتشر شود؟' : 'این ویدیو در کدام کانال منتشر شود؟'}
        </h2>
        {!made && <p className="cg-sub">
          {channels.length === 0
            ? 'ویدیوی شما در گالری پروفایل می‌ماند؛ با ساختن کانال، در بیلیارد مدیا هم دیده می‌شود.'
            : `شما با نقش‌های دیگری کانال ساخته‌اید. می‌توانید در یکی از آن‌ها منتشر کنید یا کانالی برای «${ROLE_FA[role]}» بسازید.`}
        </p>}

        {made ? (
          /* گام پایانی ساخت — یک کلیک تازه برای بازکردن انتخابگر فایل */
          <div className="cg-form">
            <p className="cg-done" role="status">
              کانال «{made.name}» ساخته شد. حالا ویدیو را انتخاب کنید تا هم در
              گالری بماند و هم در بیلیارد مدیا منتشر شود.
            </p>
            <div className="cg-actions">
              <button type="button" className="cg-go" ref={doneRef} disabled={going}
                onClick={() => { if (going) return; setGoing(true); onPick(made) }}>
                <Check size={15} aria-hidden /> انتخاب ویدیو
              </button>
            </div>
          </div>
        ) : mode === 'pick' && (
          <>
            <ul className="cg-list">
              {[...sameRole, ...otherRole].map((c, i) => (
                <li key={c.id ?? c.handle}>
                  <button type="button" className="cg-item" onClick={() => onPick(c)}
                    ref={i === 0 ? (firstRef as React.RefObject<HTMLButtonElement>) : undefined}>
                    <span className="cg-item-n">{c.name}</span>
                    <span className="cg-item-h bh-latin" dir="ltr">@{c.handle}</span>
                    <span className="cg-item-r">
                      {roleLabels(c) || 'بدون نقش'}
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

        {!made && mode === 'new' && (
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
                {when === 'before' ? 'ساخت کانال و ادامه' : 'ساخت کانال و انتشار'}
              </button>
              {channels.length > 0 && (
                <button type="button" className="cg-back-btn" onClick={() => { setMode('pick'); setErr('') }}>
                  بازگشت به فهرست
                </button>
              )}
            </div>
          </div>
        )}

        {!made && (
          <button type="button" className="cg-skip" onClick={onSkip}>
            فعلا نه — فقط در گالری بماند
          </button>
        )}
      </div>
    </div>
  )
}
