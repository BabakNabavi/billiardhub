'use client'

/* ─────────────────────────────────────────────────────────────
   پوسترِ مسابقه — پیش‌نمایش و آپلود.

   ── چرا پیش‌فرض داریم ──
   مسابقه‌ی بی‌پوستر تا امروز عکسِ `club1.png` می‌گرفت — تصویرِ یک
   باشگاهِ نمونه که ربطی به هیچ مسابقه‌ای نداشت. یعنی همه‌ی کارت‌ها
   یک‌شکل بودند و از روی تصویر نمی‌شد فهمید اسنوکر است یا ناین‌بال.

   حالا هر نوعِ بازی پوسترِ خودش را دارد و باشگاه‌دار فقط اگر
   بخواهد جایش را می‌گیرد. نتیجه‌اش این است که «هیچ‌کاری‌نکردن» هم
   خروجیِ آبرومند دارد.

   ── چرا پیش‌نمایش با همان نسبتِ کارت ──
   کارتِ فهرست و بیلبوردِ صفحه‌ی مسابقات تصویر را `cover` می‌کنند.
   بدونِ پیش‌نمایشِ هم‌نسبت، باشگاه‌دار پوستری می‌گذارد که در فرم
   کامل دیده می‌شود ولی روی کارت سرِ بازیکن‌ها بریده می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useRef, useState } from 'react'
import { ImageIcon, Upload, X, Loader2 } from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { posterFor, type Discipline } from '../../../lib/tournaments/formats'

const GOLD = '#C7A66A'

export default function TournamentPoster({ clubId, discipline, value, onChange }: {
  clubId: string
  discipline: Discipline
  /** نشانیِ پوستر، یا خالی برای پیش‌فرض */
  value: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const shown = value || posterFor(discipline)
  const isDefault = !value

  const pick = async (file: File | undefined) => {
    if (!file) return
    setErr('')
    /* سقفِ سرور ۵ مگابایت است؛ گرفتنش این‌جا یعنی کاربر بعد از
       ثانیه‌ها انتظار پیام خطا نمی‌گیرد. */
    if (file.size > 5 * 1024 * 1024) { setErr('حجم پوستر باید کمتر از ۵ مگابایت باشد'); return }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      /* زیرِ شناسه‌ی همین باشگاه — سرور مالکیتش را می‌سنجد */
      fd.append('path', `clubs/${clubId}/tournaments/poster-${Date.now()}`)
      const r = await apiFetch('/api/upload', { method: 'POST', body: fd })
      const j = await r.json().catch(() => ({})) as { url?: string; message?: string }
      if (!r.ok || !j.url) { setErr(j.message ?? 'آپلود پوستر انجام نشد'); return }
      onChange(j.url)
    } catch {
      setErr('ارتباط با سرور برقرار نشد')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ minWidth: 0 }}>
      <label style={{
        display: 'block', fontSize: 12.5, fontWeight: 700,
        color: '#8A8474', marginBottom: 6,
      }}>پوستر مسابقه</label>

      <div style={{
        position: 'relative', width: '100%', aspectRatio: '16 / 9',
        borderRadius: 14, overflow: 'hidden',
        border: `1px solid ${isDefault ? 'rgba(0,0,0,0.10)' : 'rgba(199,166,106,0.45)'}`,
        background: '#0D1512',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shown} alt="پوستر مسابقه"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

        {isDefault && (
          <span style={{
            position: 'absolute', top: 8, insetInlineStart: 8,
            fontSize: 10.5, fontWeight: 800, borderRadius: 20, padding: '3px 9px',
            background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(6px)',
          }}>پوستر پیش‌فرض</span>
        )}

        {busy && (
          <span style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
          }}>
            <Loader2 size={22} color="#fff" style={{ animation: 'tp-spin 0.9s linear infinite' }} />
          </span>
        )}
        <style>{`@keyframes tp-spin{to{transform:rotate(360deg)}}`}</style>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, flex: '1 1 auto',
            justifyContent: 'center',
            padding: '9px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
            border: `1px solid ${GOLD}`, background: '#FFFBF0', color: '#A07840',
            cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-base)',
            opacity: busy ? 0.6 : 1,
          }}>
          {isDefault ? <><Upload size={13} /> آپلود پوستر</> : <><ImageIcon size={13} /> تعویض پوستر</>}
        </button>

        {!isDefault && (
          <button type="button" disabled={busy} onClick={() => onChange('')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '9px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.03)',
              color: '#6B7280', cursor: 'pointer', fontFamily: 'var(--font-base)',
            }}><X size={13} /> پیش‌فرض</button>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, lineHeight: 1.8 }}>
        نسبت ۱۶:۹ · حداکثر ۵ مگابایت · JPG یا PNG
      </div>

      {err && (
        <div style={{
          fontSize: 11.5, color: '#B91C1C', marginTop: 6,
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 9, padding: '7px 10px',
        }}>{err}</div>
      )}

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp"
        onChange={e => void pick(e.target.files?.[0])} style={{ display: 'none' }} />
    </div>
  )
}
