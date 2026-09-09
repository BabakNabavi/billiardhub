'use client'

/* ─────────────────────────────────────────────────────────────
   مرحله‌ی کانال پنجره‌ی آپلود — انتخاب یا ساخت.

   ── چرا جدا شد ──
   تا دیروز کاربر فقط یک کانال داشت، پس این «مرحله» یک فرم ساده بود
   که یک‌بار در عمر دیده می‌شد. حالا هر نقش کاربر می‌تواند کانال
   خودش را داشته باشد و مرحله سه حالت دارد (انتخاب، ساخت، خطای
   خواندن) با حالت خودش — چیزی که دیگر جای بودن در دل فرم ویدیو
   را نداشت.

   ⚠️ «انتخابگر» عمدا رادیوگروپ واقعی است، نه چند دکمه‌ی کنار هم:
   انتخاب *یکی از چند تا* است، باید یک ایستگاه Tab باشد و با فلش
   عوض شود. دکمه‌ی «کانال تازه» بیرون گروه است چون رادیو نیست.
   ───────────────────────────────────────────────────────────── */

import { useRef } from 'react'
import { Tv, Plus, Loader2 } from 'lucide-react'
import type { UserChannel } from '@/lib/media/channel'
import { INK, SEC, MUT, LINE, GOLD, Field, inp } from './upload-ui'

const key = (c: UserChannel | null | undefined) => c?.id ?? c?.handle ?? ''

const chip = (on: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 44, padding: '8px 12px',
  borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800,
  color: on ? '#241B08' : SEC,
  background: on ? 'rgba(199,166,106,0.20)' : '#F4F3F1',
  border: `1px solid ${on ? 'rgba(199,166,106,0.55)' : LINE}`,
})

/** نوار انتخاب کانال مقصد — بالای فرم ویدیو. */
export function ChannelPicker({ channels, channel, onPick, onNew }: {
  channels: UserChannel[]
  channel: UserChannel | null
  onPick: (c: UserChannel) => void
  onNew: () => void
}) {
  const groupRef = useRef<HTMLDivElement>(null)

  /* ── جابه‌جایی با فلش ──
     بدون این، کاربر کیبورد باید از تک‌تک چیپ‌ها Tab بزند و
     رادیوگروپ فقط ظاهرش رادیوگروپ است. */
  const onKey = (e: React.KeyboardEvent) => {
    const KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End']
    if (!KEYS.includes(e.key) || channels.length < 2) return
    e.preventDefault()
    const n = channels.length
    /* اگر انتخاب فعلی در فهرست نبود، `-1` جهت فلش را وارونه می‌کرد */
    const cur = Math.max(0, channels.findIndex(c => key(c) === key(channel)))
    /* راست‌به‌چپ: فلش راست یعنی «قبلی» */
    const step = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? -1 : 0
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (cur + step + n) % n
    onPick(channels[next]!)
    groupRef.current?.querySelector<HTMLElement>(`[data-chip="${next}"]`)?.focus()
  }

  return (
    <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* ⚠️ بدون این نوار، انتشار همیشه در کانال اول فهرست بود و
          کاربر چندنقشی هیچ راهی برای اصلاحش نداشت. */}
      <span style={{ fontSize: 11.5, fontWeight: 800, color: MUT }}>انتشار در کانال</span>
      <div role="radiogroup" aria-label="انتشار در کانال" ref={groupRef} onKeyDown={onKey}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {channels.map((c, i) => {
          const on = key(c) === key(channel)
          return (
            <button key={key(c)} type="button" role="radio" aria-checked={on}
              tabIndex={on ? 0 : -1} data-chip={i} onClick={() => onPick(c)} style={chip(on)}>
              <Tv size={14} aria-hidden />
              <span>{c.name}</span>
              <span dir="ltr" className="bh-latin" style={{ fontSize: 11, color: MUT, fontWeight: 600 }}>@{c.handle}</span>
            </button>
          )
        })}
      </div>
      <button type="button" onClick={onNew}
        style={{ ...chip(false), alignSelf: 'flex-start', background: 'transparent', border: `1px dashed ${LINE}` }}>
        <Plus size={14} aria-hidden /> کانال تازه
      </button>
    </div>
  )
}

/** فرم ساخت کانال — و حالت «فهرست خوانده نشد». */
export function ChannelCreate({
  loaded, failed, err, hasChannels, busy,
  name, handle, bio, onName, onHandle, onBio, onCreate, onRetry, onBack,
}: {
  loaded: boolean
  /** فهرست خوانده نشد — «کانال بساز» در این حالت دروغ است */
  failed: boolean
  err: string
  hasChannels: boolean
  busy: boolean
  name: string; handle: string; bio: string
  onName: (v: string) => void
  onHandle: (v: string) => void
  onBio: (v: string) => void
  onCreate: () => void
  onRetry: () => void
  onBack: () => void
}) {
  if (!loaded) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ textAlign: 'center', padding: 30, color: MUT }}><Loader2 size={22} className="bm-spin" /></div>
      </div>
    )
  }

  /* ⚠️ گارد روی یک پرچم صریح است، نه روی «خطا داریم و فهرست خالی
     است». حالت دوم با نام پیشنهادی باقی‌مانده از خواندن قبلی
     خاموش می‌شد و دوباره همان فرم دروغین را نشان می‌داد. */
  if (failed) {
    return (
      <div role="alert" style={{ padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 13, color: INK, fontWeight: 700 }}>{err || 'فهرست کانال‌ها خوانده نشد.'}</span>
        <button type="button" onClick={onRetry}
          style={{ alignSelf: 'center', minHeight: 44, padding: '0 18px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, background: GOLD, color: '#241B08', border: 'none' }}>
          تلاش دوباره
        </button>
      </div>
    )
  }

  const can = !busy && name.trim().length >= 2 && handle.length >= 3

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FAF8F3', border: `1px solid ${LINE}`, borderRadius: 16, padding: 14 }}>
        <span style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 900,
          color: name ? '#241B08' : MUT,
          background: name ? 'linear-gradient(135deg,#E8CE96,#8A6020)' : '#EDE9E1' }}>
          {name ? name.slice(0, 1) : <Tv size={20} />}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: name ? INK : MUT }}>{name || 'نام کانال'}</div>
          {handle && <div className="bh-latin" dir="ltr" style={{ fontSize: 11.5, color: MUT, textAlign: 'start' }}>@{handle}</div>}
        </div>
      </div>

      <Field label="نام کانال">
        <input value={name} onChange={e => onName(e.target.value.slice(0, 60))}
          placeholder="مثلا: آکادمی بیلیارد من" style={inp} />
      </Field>

      <Field label="هندل کانال (انگلیسی)">
        <div style={{ ...inp, display: 'flex', alignItems: 'center', gap: 6, padding: '0 13px' }}>
          <span style={{ color: MUT, fontSize: 14 }}>@</span>
          <input value={handle} dir="ltr" placeholder="my.channel"
            onChange={e => onHandle(e.target.value.replace(/[^A-Za-z0-9._-]/g, '').toLowerCase().slice(0, 30))}
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontSize: 13.5, fontFamily: 'inherit', color: INK, textAlign: 'start' }} />
        </div>
      </Field>

      <Field label="درباره‌ی کانال (اختیاری)">
        <textarea value={bio} onChange={e => onBio(e.target.value.slice(0, 200))} rows={2}
          placeholder="در چه زمینه‌ای ویدیو منتشر می‌کنید؟" style={{ ...inp, resize: 'vertical', lineHeight: 1.9 }} />
      </Field>

      {err && <div role="alert" style={{ fontSize: 12.5, fontWeight: 700, color: '#B23B2E', background: 'rgba(178,59,46,0.08)', border: '1px solid rgba(178,59,46,0.2)', borderRadius: 10, padding: '9px 12px' }}>{err}</div>}

      {/* ⚠️ دکمه باید *دیده شود* که خاموش است؛ طلایی همیشگی به کاربر
          می‌گفت بزن، و زدن هیچ کاری نمی‌کرد. */}
      <button type="button" onClick={onCreate} disabled={!can}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, padding: '13px', borderRadius: 12, border: 'none', cursor: can ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, background: can ? GOLD : '#EDE9E1', color: can ? '#241B08' : MUT, transition: 'background .2s' }}>
        {busy ? <><Loader2 size={17} className="bm-spin" /> در حال ساخت…</> : <><Tv size={17} /> ساخت کانال و ادامه</>}
      </button>

      {hasChannels && (
        <button type="button" onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: SEC, minHeight: 44 }}>
          بازگشت به کانال‌های من
        </button>
      )}

      <p style={{ fontSize: 11, color: MUT, textAlign: 'center', margin: 0, lineHeight: 1.9 }}>
        {/* ⚠️ متن قبلی می‌گفت «کانال یک‌بار ساخته می‌شود» — از وقتی هر
            نقش کانال خودش را دارد، این دیگر درست نیست. */}
        می‌توانید برای هر نقش خود کانال جدا داشته باشید؛ هنگام آپلود انتخاب می‌کنید.
      </p>
    </div>
  )
}
