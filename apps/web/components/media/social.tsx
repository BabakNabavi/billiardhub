'use client'

/* ─────────────────────────────────────────────────────────────
   دنبال‌کردن کانال و پسند ویدیو.

   ⚠️ هر دو اگر سرور بگوید `available: false` **هیچ چیزی رندر
   نمی‌کنند**. مهاجرت ۰۹۲ دستی روی سرور اجرا می‌شود و ممکن است کد
   پیش از آن دیپلوی شود؛ در آن پنجره نباید دکمه‌ی بی‌کارکرد دیده
   شود — همان چیزی که این‌ها آمده‌اند جایگزینش کنند.

   ⚠️ هیچ عددی خوش‌بینانه نوشته نمی‌شود: شمارش همان است که سرور
   برگردانده. تغییر خوش‌بینانه‌ی رابط بود که کاربر را مطمئن می‌کرد
   کاری انجام شده در حالی که نشده بود.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { ThumbsUp, BellPlus, BellRing, Loader2 } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { compactViews } from '../../lib/media-data'
import { toFaDigits } from '../../lib/jalali'
import { useAuthStore } from '../../store/auth.store'

export interface SubState { available: boolean; subscribers: number; subscribed: boolean }
export interface LikeState { available: boolean; likes: number; liked: boolean }

export async function socialPost(body: Record<string, unknown>) {
  const r = await apiFetch('/api/media/social', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const j = await r.json().catch(() => ({})) as Record<string, unknown>
  return { ok: r.ok, status: r.status, j }
}

/* ═══════════════ دنبال کردن کانال ═══════════════ */
export function SubscribeButton({ handle }: { handle: string }) {
  const { user } = useAuthStore()
  const [st, setSt] = useState<SubState | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!handle) return
    let alive = true
    const run = async () => {
      try {
        const r = await apiFetch(`/api/media/social?channel=${encodeURIComponent(handle)}`, { cache: 'no-store' })
        const j = await r.json() as SubState
        if (alive) setSt(j)
      } catch { /* بی‌پاسخ ⇒ چیزی نشان نده */ }
    }
    void run()
    return () => { alive = false }
  }, [handle, user?.id])

  if (!st?.available) return null

  const click = async () => {
    if (busy) return
    if (!user) { setErr('برای دنبال کردن وارد شوید'); return }
    setBusy(true); setErr('')
    const { ok, j } = await socialPost({ action: 'subscribe', channel: handle })
    if (ok) setSt(j as unknown as SubState)
    else setErr(String(j.message ?? 'انجام نشد'))
    setBusy(false)
  }

  return (
    <span className="mx-subwrap">
      <button
        className={`mx-sub-btn${st.subscribed ? ' on' : ''}`}
        type="button" onClick={click} disabled={busy}
        aria-pressed={st.subscribed}
      >
        {busy ? <Loader2 size={15} className="mx-spin" aria-hidden />
          : st.subscribed ? <BellRing size={15} aria-hidden /> : <BellPlus size={15} aria-hidden />}
        {st.subscribed ? 'دنبال می‌کنید' : 'دنبال کردن'}
        {/* ⚠️ عدد فقط وقتی می‌آید که واقعا کسی دنبال کرده باشد */}
        {st.subscribers > 0 && <b>{toFaDigits(st.subscribers)}</b>}
      </button>
      {err && <span className="mx-err" role="alert">{err}</span>}
    </span>
  )
}

/* ═══════════════ پسند ═══════════════ */
export function LikeButton({ slug }: { slug: string }) {
  const { user } = useAuthStore()
  const [st, setSt] = useState<LikeState | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const r = await apiFetch(`/api/media/social?video=${encodeURIComponent(slug)}`, { cache: 'no-store' })
        const j = await r.json() as { likes?: LikeState }
        if (alive) setSt(j.likes ?? null)
      } catch { /* بی‌پاسخ */ }
    }
    void run()
    return () => { alive = false }
  }, [slug, user?.id])

  if (!st?.available) return null

  const click = async () => {
    if (busy) return
    if (!user) { setErr('برای پسندیدن وارد شوید'); return }
    setBusy(true); setErr('')
    const { ok, j } = await socialPost({ action: 'like', video: slug })
    if (ok) setSt(j as unknown as LikeState)
    else setErr(String(j.message ?? 'انجام نشد'))
    setBusy(false)
  }

  return (
    <>
      <button
        className={`mx-act${st.liked ? ' on' : ''}`}
        type="button" onClick={click} disabled={busy} aria-pressed={st.liked}
      >
        <ThumbsUp size={15} aria-hidden />
        {st.likes > 0 ? compactViews(st.likes) : 'پسندیدن'}
      </button>
      {err && <span className="mx-err" role="alert">{err}</span>}
    </>
  )
}
