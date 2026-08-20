'use client'

/* دعوت‌های باشگاه — سمتِ مربی.

   ⚠️ چرا این صفحه لازم شد: فهرستِ مربیانِ باشگاه را فقط باشگاه‌دار
   می‌نوشت و مربی هیچ‌جا خبردار نمی‌شد. حالا افزودن یک دعوت است و تا
   مربی نپذیرد، نه در صفحه‌ی عمومیِ باشگاه دیده می‌شود و نه کسی از آن
   راه به او امتیاز می‌دهد.

   ── چرا وقتی دعوتی نیست هیچ‌چیز رندر نمی‌شود ──
   پنلِ مربی از قبل شش بخش دارد؛ یک کارتِ همیشگیِ «دعوتی ندارید» فقط
   طول می‌دهد. کارت وقتی می‌آید که واقعاً چیزی برای تصمیم‌گرفتن باشد.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { Building2, Check, X, Loader2 } from 'lucide-react'
import { apiFetch } from '../../lib/http'

const GOLD_D = '#8F6531', TEXT = '#1C1B17', MUT = '#6F6A5C'
const LINE = '1px solid #EFEBE1', GREEN = '#0E7A38', RED = '#B23B2E'

interface Invite {
  clubId: string
  clubName: string
  clubSlug: string | null
  logo: string | null
  status: 'pending' | 'accepted' | 'rejected'
}

export default function ClubInvites() {
  const [list, setList] = useState<Invite[] | null>(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/coach/club-invites', { cache: 'no-store' })
      if (!r.ok) { setList([]); return }
      const j = await r.json() as { invites?: Invite[] }
      setList(j.invites ?? [])
    } catch { setList([]) }
  }, [])

  useEffect(() => { void load() }, [load])

  const answer = async (clubId: string, action: 'accept' | 'reject') => {
    setBusy(clubId); setErr('')
    try {
      const r = await apiFetch('/api/coach/club-invites', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId, action }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({})) as { message?: string }
        setErr(j.message ?? 'ثبت پاسخ انجام نشد'); return
      }
      await load()
    } catch { setErr('ارتباط با سرور برقرار نشد') } finally { setBusy('') }
  }

  /* کارت وقتی می‌آید که واقعاً باشگاهی نامِ این مربی را گذاشته باشد */
  const shown = list ?? []
  if (shown.length === 0) return null

  return (
    <div style={{
      background: '#fff', border: LINE, borderRadius: 16,
      padding: '22px 24px', boxShadow: '0 2px 16px rgba(17,17,16,0.05)',
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(199,166,106,0.14)', color: GOLD_D, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={13} />
        </span>
        باشگاه‌ها
      </h2>
      <p style={{ fontSize: 12.5, color: MUT, lineHeight: 1.9, margin: '0 0 14px' }}>
        این باشگاه‌ها شما را در فهرستِ مربیانشان گذاشته‌اند. تا وقتی نپذیرید،
        نامتان در صفحه‌ی آن باشگاه دیده نمی‌شود.
      </p>

      {err && <p role="alert" style={{ fontSize: 12.5, color: RED, fontWeight: 700, margin: '0 0 10px' }}>{err}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map(i => (
          <div key={i.clubId} style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            border: LINE, borderRadius: 12, padding: '11px 13px', background: '#FAFAF7',
          }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: TEXT }}>{i.clubName}</span>

            {i.status === 'accepted' && (
              <span style={{ fontSize: 11.5, fontWeight: 800, color: GREEN, background: 'rgba(14,122,56,0.10)', borderRadius: 999, padding: '3px 10px' }}>پذیرفته‌اید</span>
            )}
            {i.status === 'rejected' && (
              <span style={{ fontSize: 11.5, fontWeight: 800, color: RED, background: 'rgba(178,59,46,0.09)', borderRadius: 999, padding: '3px 10px' }}>رد کرده‌اید</span>
            )}
            {i.status === 'pending' && (
              <span style={{ fontSize: 11.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.13)', borderRadius: 999, padding: '3px 10px' }}>در انتظار پاسخ شما</span>
            )}

            <span style={{ marginInlineStart: 'auto', display: 'inline-flex', gap: 7 }}>
              {/* پاسخِ داده‌شده هم قابلِ عوض‌کردن است: مربی ممکن است
                  باشگاهش را عوض کند و نباید در تصمیمِ قبلی گیر کند. */}
              {i.status !== 'accepted' && (
                <button type="button" onClick={() => void answer(i.clubId, 'accept')} disabled={busy === i.clubId}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid rgba(14,122,56,0.3)', background: 'rgba(14,122,56,0.08)', color: GREEN, borderRadius: 9, padding: '7px 13px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {busy === i.clubId ? <Loader2 size={13} /> : <Check size={13} />} می‌پذیرم
                </button>
              )}
              {i.status !== 'rejected' && (
                <button type="button" onClick={() => void answer(i.clubId, 'reject')} disabled={busy === i.clubId}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid rgba(178,59,46,0.28)', background: '#fff', color: RED, borderRadius: 9, padding: '7px 13px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {busy === i.clubId ? <Loader2 size={13} /> : <X size={13} />} رد می‌کنم
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
