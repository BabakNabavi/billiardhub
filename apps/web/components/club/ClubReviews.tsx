'use client'

/* امتیاز و نظرهای باشگاه.

   قاعده‌ی صریح: فقط کسی که در همین باشگاه رزروِ قطعی داشته می‌تواند
   نظر بدهد. سرور این را اجبار می‌کند؛ این‌جا هم علتش نوشته می‌شود تا
   کاربر دکمه‌ی غیرفعال ببیند و ندانَد چرا.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { Star, Loader2, Trash2, Pencil } from 'lucide-react'
import { apiFetch } from '../../lib/http'

const GOLD = '#C7A66A', GOLD_D = '#9A6E38', INK = '#1C1B17'
const MUT = '#8A8474', LINE = '#EAE5DA', RED = '#B23B2E'

const fa = (v: string | number) => String(v ?? '').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)

interface Review {
  id: string; author: string; isMine: boolean
  rating: number; comment: string | null; createdAt: string; edited: boolean
}
interface Payload {
  reviews: Review[]
  summary: { avg: number; count: number; breakdown: Record<string, number> }
  canReview: boolean
  myReview: { id: string; rating: number; comment: string | null } | null
}

export default function ClubReviews({ clubId }: { clubId: string }) {
  const [d, setD] = useState<Payload | null>(null)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(`/api/clubs/${clubId}/reviews`, { cache: 'no-store' })
      if (!r.ok) return
      const j = await r.json() as Payload
      setD(j)
      if (j.myReview) { setRating(j.myReview.rating); setComment(j.myReview.comment ?? '') }
    } catch { /* بی‌صدا */ }
  }, [clubId])

  useEffect(() => { void load() }, [load])

  const submit = async () => {
    setBusy(true); setErr('')
    try {
      const r = await apiFetch(`/api/clubs/${clubId}/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      })
      const j = await r.json().catch(() => ({})) as { message?: string }
      if (!r.ok) { setErr(j.message ?? 'ثبتِ نظر انجام نشد'); return }
      setOpen(false); await load()
    } catch { setErr('خطا در ارتباط با سرور') } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!window.confirm('نظرِ شما حذف شود؟')) return
    setBusy(true)
    try {
      await apiFetch(`/api/clubs/${clubId}/reviews`, { method: 'DELETE' })
      setComment(''); setRating(5); await load()
    } finally { setBusy(false) }
  }

  if (!d) return null

  const { summary } = d
  const canWrite = d.canReview || !!d.myReview

  return (
    <section style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ width: 3, height: 17, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
        <h3 style={{ fontSize: 17, fontWeight: 800, color: INK, margin: 0 }}>امتیاز و نظرها</h3>
        {summary.count > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: MUT }}>
            <Star size={13} style={{ color: '#F5A623', fill: '#F5A623' }} />
            <b style={{ color: INK }}>{fa(summary.avg.toFixed(1))}</b>
            <span>از {fa(summary.count)} نظر</span>
          </span>
        )}
      </div>

      {/* توزیعِ ستاره‌ها — «۴٫۲ از ۵» بدونِ توزیع گمراه‌کننده است */}
      {summary.count > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 14, marginBottom: 14 }}>
          {[5, 4, 3, 2, 1].map(s => {
            const n = summary.breakdown[String(s)] ?? 0
            const pct = summary.count ? (n / summary.count) * 100 : 0
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                <span style={{ fontSize: 11.5, color: MUT, width: 26 }}>{fa(s)} ★</span>
                <span style={{ flex: 1, height: 6, borderRadius: 3, background: '#F1EEE7', overflow: 'hidden' }}>
                  <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: GOLD }} />
                </span>
                <span style={{ fontSize: 11.5, color: MUT, width: 26, textAlign: 'left' }}>{fa(n)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ثبت / ویرایشِ نظرِ من */}
      {canWrite ? (
        !open ? (
          <button onClick={() => setOpen(true)} style={btn}>
            {d.myReview ? <><Pencil size={13} /> ویرایشِ نظرِ من</> : <><Star size={13} /> ثبتِ نظر</>}
          </button>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 12, direction: 'ltr', justifyContent: 'flex-end' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} aria-label={`${s} ستاره`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <Star size={26} style={{ color: '#F5A623' }} fill={s <= rating ? '#F5A623' : 'none'} />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value.slice(0, 1000))}
              placeholder="تجربه‌تان از این باشگاه (اختیاری)"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 11,
                border: `1px solid ${LINE}`, background: '#FAF8F3', fontSize: 13.5,
                fontFamily: 'inherit', color: INK, outline: 'none', resize: 'vertical',
              }} />
            {err && <p style={{ fontSize: 12.5, color: RED, fontWeight: 700, margin: '8px 0 0' }}>{err}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={submit} disabled={busy} style={{ ...btn, background: GOLD, color: '#241B08', border: 'none' }}>
                {busy ? <Loader2 size={13} /> : <Star size={13} />} ثبت
              </button>
              <button onClick={() => { setOpen(false); setErr('') }} style={btn}>انصراف</button>
              {d.myReview && (
                <button onClick={remove} disabled={busy}
                  style={{ ...btn, color: RED, borderColor: 'rgba(178,59,46,0.3)' }}>
                  <Trash2 size={13} /> حذف
                </button>
              )}
            </div>
          </div>
        )
      ) : (
        <p style={{ fontSize: 12.5, color: MUT, lineHeight: 2, margin: '0 0 14px' }}>
          برای ثبتِ نظر باید حداقل یک رزروِ قطعی در این باشگاه داشته باشید.
        </p>
      )}

      {/* فهرستِ نظرها */}
      {d.reviews.length === 0 ? (
        <p style={{ fontSize: 13, color: MUT, margin: 0 }}>هنوز نظری ثبت نشده است.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {d.reviews.map(r => (
            <div key={r.id} style={{
              background: '#fff', border: `1px solid ${r.isMine ? 'rgba(199,166,106,0.4)' : LINE}`,
              borderRadius: 14, padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <b style={{ fontSize: 13.5, color: INK }}>{r.author}</b>
                {r.isMine && <span style={{ fontSize: 10.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.13)', borderRadius: 999, padding: '2px 8px' }}>نظرِ شما</span>}
                <span style={{ marginInlineStart: 'auto', display: 'inline-flex', gap: 1, direction: 'ltr' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={12} style={{ color: '#F5A623' }} fill={s <= r.rating ? '#F5A623' : 'none'} />
                  ))}
                </span>
              </div>
              {r.comment && <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.62)', margin: 0, lineHeight: 1.9 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 11,
  border: `1px solid ${LINE}`, background: '#fff', color: GOLD_D,
  fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14,
}
