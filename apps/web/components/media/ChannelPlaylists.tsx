'use client'

/* ─────────────────────────────────────────────────────────────
   لیست‌های پخش یک کانال.

   ⚠️ اگر جدول لیست روی سرور نباشد (مهاجرت ۰۹۳ دستی اجرا می‌شود)
   نه تب دیده می‌شود نه بخش. `onAvailable` همین را به صفحه‌ی کانال
   خبر می‌دهد تا تب خالی نسازد.

   ⚠️ فرم ساخت فقط برای مالک کانال می‌آید — و مالکیت را *سرور*
   تصمیم می‌گیرد؛ این‌جا فقط نمایش است. اگر کاربر مالک نباشد سرور
   ۴۰۳ می‌دهد و پیامش دیده می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ListVideo, Plus, Loader2 } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { toFaDigits } from '../../lib/jalali'
import { GridSkeleton } from './cards'

export interface PlaylistCardData {
  slug: string; title: string; description: string
  handle: string; count: number; posters: string[]
}

/* ⚠️ «نشانی دارد» با «بار می‌شود» یکی نیست — همان دلیلی که `Thumb`
   در `cards.tsx` برایش `onError` دارد: بندانگشتی ۴۰۴ آیکن عکس
   شکسته را روی کارت می‌گذارد. */
function Poster({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <span className="mx-pl-poster">
      <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
    </span>
  )
}

export function PlaylistCard({ p }: { p: PlaylistCardData }) {
  return (
    <Link className="mx-pl" href={`/media/playlist/${encodeURIComponent(p.slug)}`}>
      <div className="mx-pl-stack">
        {p.posters.length > 0
          ? p.posters.slice(0, 3).map((src, i) => <Poster key={i} src={src} />)
          : <span className="mx-pl-poster mx-pl-poster--none"><ListVideo size={22} aria-hidden /></span>}
        <span className="mx-pl-count">{toFaDigits(p.count)} ویدیو</span>
      </div>
      <h3>{p.title}</h3>
      {p.description && <p>{p.description}</p>}
    </Link>
  )
}

export default function ChannelPlaylists({
  handle, onAvailable,
}: { handle: string; onAvailable?: (v: boolean) => void }) {
  /* ⚠️ از پاسخ سرور می‌آید، نه از حدس کلاینت و نه از استور
     احراز هویت: `canEdit` را نشست امضاشده روی سرور تعیین کرده.
     شرط‌گذاشتن اضافه روی استور یعنی اگر hydrate نشده بود یا
     localStorage پاک شده بود، مالک بی‌صدا فرم را از دست می‌داد. */
  const [canEdit, setCanEdit] = useState(false)
  const [rows, setRows] = useState<PlaylistCardData[]>([])
  const [state, setState] = useState<'loading' | 'off' | 'error' | 'ready'>('loading')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(`/api/media/playlists?channel=${encodeURIComponent(handle)}`, { cache: 'no-store' })
      /* ⚠️ خطا هم باید تب را نگه دارد، وگرنه دکمه‌ی «تلاش دوباره»
         در تبی می‌ماند که هرگز رندر نمی‌شود. */
      if (!r.ok) { setState('error'); onAvailable?.(true); return }
      const j = await r.json() as { available: boolean; data: PlaylistCardData[]; canEdit?: boolean }
      if (!j.available) { setState('off'); onAvailable?.(false); return }
      setCanEdit(j.canEdit === true)
      setRows(j.data); setState('ready')
      /* ⚠️ تب خالی برای بازدیدکننده ساخته نمی‌شود؛ فقط مالک
         تب بی‌لیست را می‌بیند تا بتواند اولی را بسازد. */
      onAvailable?.(j.data.length > 0 || j.canEdit === true)
    } catch (e) {
      console.error('[playlists]', (e as Error).message)
      setState('error'); onAvailable?.(true)
    }
  }, [handle, onAvailable])

  useEffect(() => { void load() }, [load])

  if (state === 'off') return null

  if (state === 'loading') {
    return (
      <section className="mx-sec" aria-busy="true">
        <div className="mx-sec-hd"><h2>لیست‌های پخش</h2></div>
        <GridSkeleton n={4} />
      </section>
    )
  }

  const create = async () => {
    const t = title.trim()
    if (!t || busy) return
    setBusy(true); setErr('')
    try {
      const r = await apiFetch('/api/media/playlists', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', channel: handle, title: t }),
      })
      const j = await r.json().catch(() => ({})) as { message?: string }
      if (r.ok) { setTitle(''); await load() }
      else setErr(j.message ?? 'ساخت لیست انجام نشد')
    } catch { setErr('ارتباط با سرور برقرار نشد') }
    setBusy(false)
  }

  return (
    <section className="mx-sec" aria-labelledby="mx-pl-h">
      <div className="mx-sec-hd"><h2 id="mx-pl-h">لیست‌های پخش</h2></div>

      {canEdit && (
        <div className="mx-pl-new">
          <label className="mx-sr-only" htmlFor="mx-pl-t">عنوان لیست تازه</label>
          <input
            id="mx-pl-t" className="mx-search-in" value={title}
            onChange={e => setTitle(e.target.value)} maxLength={120}
            placeholder="عنوان لیست تازه — مثلا «آموزش مبتدی»"
          />
          <button className="mx-act" type="button" onClick={create} disabled={busy || !title.trim()}>
            {busy ? <Loader2 size={15} className="mx-spin" aria-hidden /> : <Plus size={15} aria-hidden />}
            ساخت لیست
          </button>
        </div>
      )}

      {err && <p className="mx-err" role="alert">{err}</p>}

      {state === 'error' ? (
        <div className="mx-empty">
          <h2>لیست‌ها بارگذاری نشد</h2>
          <p>این یک خطای موقت است.</p>
          <div className="mx-empty-act">
            <button className="mx-iconbtn" type="button" onClick={() => void load()}><span>تلاش دوباره</span></button>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <p className="mx-by">
          {canEdit ? 'هنوز لیستی نساخته‌اید.' : 'این کانال هنوز لیست پخشی ندارد.'}
        </p>
      ) : (
        <div className="mx-grid">
          {rows.map(p => <PlaylistCard key={p.slug} p={p} />)}
        </div>
      )}
    </section>
  )
}
