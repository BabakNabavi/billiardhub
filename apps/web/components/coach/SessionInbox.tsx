'use client'

/* جلسه‌های مربی — سمتِ خودش.

   درخواست‌های شاگردان می‌آید و مربی تأیید یا رد می‌کند. همین تأیید
   است که بعداً به شاگرد اجازه‌ی امتیازدادن می‌دهد (بعد از گذشتنِ
   زمانِ جلسه)، پس عمداً ساده و صریح نگه داشته شده.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, Check, X, Loader2 } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { faDateTime } from '../../lib/jalali'

const GOLD_D = '#8F6531', TEXT = '#1C1B17', MUT = '#6F6A5C'
const LINE = '1px solid #EFEBE1', GREEN = '#0E7A38', RED = '#B23B2E'

const fa = (v: string | number) => String(v ?? '').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)

interface Session {
  id: string; who: string; startsAt: string; durationMin: number
  price: number; note: string | null; status: string; past: boolean
}

const LABEL: Record<string, { t: string; c: string; bg: string }> = {
  requested: { t: 'در انتظار پاسخ شما', c: GOLD_D, bg: 'rgba(199,166,106,0.13)' },
  confirmed: { t: 'تأییدشده', c: GREEN, bg: 'rgba(14,122,56,0.10)' },
  rejected: { t: 'ردشده', c: RED, bg: 'rgba(178,59,46,0.09)' },
  cancelled: { t: 'لغوشده', c: MUT, bg: 'rgba(0,0,0,0.05)' },
}

export default function SessionInbox() {
  const [list, setList] = useState<Session[] | null>(null)
  /* خطا نباید به «جلسه‌ای ندارید» ترجمه شود — همان تله‌ای که در
     کامپوننتِ نظرها هم بود. */
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/coach/sessions?role=coach', { cache: 'no-store' })
      if (!r.ok) { setFailed(true); setList([]); return }
      const j = await r.json() as { sessions?: Session[] }
      setFailed(false); setList(j.sessions ?? [])
    } catch { setFailed(true); setList([]) }
  }, [])

  useEffect(() => { void load() }, [load])

  const answer = async (id: string, status: 'confirmed' | 'rejected') => {
    setBusy(id); setErr('')
    try {
      const r = await apiFetch('/api/coach/sessions', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({})) as { message?: string }
        setErr(j.message ?? 'ثبت پاسخ انجام نشد'); return
      }
      await load()
    } catch { setErr('ارتباط با سرور برقرار نشد') } finally { setBusy('') }
  }

  /* بدونِ جلسه، کارت نمی‌آید — پنل از قبل بلند است. ولی «نشد بخوانم»
     با «چیزی نیست» یکی نیست. */
  if (failed) {
    return (
      <p style={{ fontSize: 13, color: MUT, margin: 0 }}>
        جلسه‌ها بارگذاری نشد.{' '}
        <button onClick={() => { setFailed(false); void load() }}
          style={{ background: 'none', border: 'none', padding: 0, color: GOLD_D, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
          تلاش دوباره
        </button>
      </p>
    )
  }
  if (!list || list.length === 0) return null

  return (
    <div style={{ background: '#fff', border: LINE, borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 16px rgba(17,17,16,0.05)' }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(199,166,106,0.14)', color: GOLD_D, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CalendarClock size={13} />
        </span>
        جلسه‌ها
      </h2>
      <p style={{ fontSize: 12.5, color: MUT, lineHeight: 1.9, margin: '0 0 14px' }}>
        جلسه‌ای که تأیید کنید، پس از گذشتنِ زمانش به شاگرد اجازه‌ی ثبت نظر می‌دهد.
        پرداخت حضوری است.
      </p>

      {err && <p role="alert" style={{ fontSize: 12.5, color: RED, fontWeight: 700, margin: '0 0 10px' }}>{err}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map(s => {
          const l = LABEL[s.status] ?? LABEL.requested!
          return (
            <div key={s.id} style={{ border: LINE, borderRadius: 12, padding: '11px 13px', background: '#FAFAF7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <b style={{ fontSize: 13.5, color: TEXT }}>{s.who}</b>
                <span style={{ fontSize: 12.5, color: MUT }}>{faDateTime(s.startsAt)}</span>
                <span style={{ fontSize: 11.5, color: MUT }}>{fa(s.durationMin)} دقیقه</span>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: l.c, background: l.bg, borderRadius: 999, padding: '3px 10px' }}>{l.t}</span>

                {s.status === 'requested' && !s.past && (
                  <span style={{ marginInlineStart: 'auto', display: 'inline-flex', gap: 7 }}>
                    <button type="button" onClick={() => void answer(s.id, 'confirmed')} disabled={busy === s.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid rgba(14,122,56,0.3)', background: 'rgba(14,122,56,0.08)', color: GREEN, borderRadius: 9, padding: '7px 13px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {busy === s.id ? <Loader2 size={13} className="ch-spin" /> : <Check size={13} />} تأیید
                    </button>
                    <button type="button" onClick={() => void answer(s.id, 'rejected')} disabled={busy === s.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid rgba(178,59,46,0.28)', background: '#fff', color: RED, borderRadius: 9, padding: '7px 13px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {busy === s.id ? <Loader2 size={13} className="ch-spin" /> : <X size={13} />} رد
                    </button>
                  </span>
                )}
                {/* درخواستی که زمانش گذشته دیگر قابلِ تأیید نیست:
                    تأییدِ گذشته یعنی ساختنِ اجازه‌ی امتیاز از هوا. */}
                {s.status === 'requested' && s.past && (
                  <span style={{ marginInlineStart: 'auto', fontSize: 11.5, color: MUT }}>زمانش گذشت</span>
                )}
              </div>
              {s.note && <p style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.62)', margin: '8px 0 0', lineHeight: 1.9 }}>{s.note}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
