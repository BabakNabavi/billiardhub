'use client'

/* دکمه‌ی علاقه‌مندی — مشترکِ باشگاه، مربی، فروشگاه و محصول.

   وضعیتِ اولیه از فهرستِ علاقه‌مندی‌های کاربر می‌آید که یک‌بار برای کلِ
   صفحه خوانده می‌شود (`useFavorites`)، نه یک درخواست به‌ازای هر کارت.

   کلیک خوش‌بینانه عمل می‌کند: قلب همان لحظه پر می‌شود و اگر سرور رد
   کرد برمی‌گردد. انتظارِ رفت‌وبرگشت برای یک قلب، کند به‌نظر می‌رسد.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { apiFetch } from '../lib/http'

export type FavoriteType = 'club' | 'coach' | 'referee' | 'seller' | 'product'

/* کشِ سبکِ درون‌صفحه‌ای: چند کارت روی یک صفحه نباید هرکدام
   `/api/favorites` را جدا صدا بزنند. */
let cache: { at: number; keys: Set<string> } | null = null
const CACHE_MS = 30_000
const listeners = new Set<() => void>()

async function loadFavorites(): Promise<Set<string>> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.keys
  try {
    const r = await apiFetch('/api/favorites', { cache: 'no-store' })
    if (!r.ok) { cache = { at: Date.now(), keys: new Set() }; return cache.keys }
    const j = await r.json() as { favorites?: { entity_type: string; entity_id: string }[] }
    const keys = new Set((j.favorites ?? []).map(f => `${f.entity_type}:${f.entity_id}`))
    cache = { at: Date.now(), keys }
    return keys
  } catch {
    cache = { at: Date.now(), keys: new Set() }
    return cache.keys
  }
}

function setLocal(key: string, on: boolean) {
  if (!cache) cache = { at: Date.now(), keys: new Set() }
  if (on) cache.keys.add(key); else cache.keys.delete(key)
  listeners.forEach(fn => fn())
}

export default function FavoriteButton({
  type, id, size = 18, className, style, showLabel = false,
}: {
  type: FavoriteType
  id: string
  size?: number
  className?: string
  style?: React.CSSProperties
  showLabel?: boolean
}) {
  const key = `${type}:${id}`
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  const sync = useCallback(() => setOn(!!cache?.keys.has(key)), [key])

  useEffect(() => {
    let alive = true
    void loadFavorites().then(keys => {
      if (!alive) return
      setOn(keys.has(key)); setReady(true)
    })
    listeners.add(sync)
    return () => { alive = false; listeners.delete(sync) }
  }, [key, sync])

  const toggle = async (e: React.MouseEvent) => {
    /* کارتِ باشگاه خودش یک لینک است — کلیکِ قلب نباید صفحه را عوض کند */
    e.preventDefault(); e.stopPropagation()
    if (busy) return

    const next = !on
    setOn(next); setLocal(key, next); setBusy(true)
    try {
      const r = next
        ? await apiFetch('/api/favorites', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entityType: type, entityId: id }),
          })
        : await apiFetch(`/api/favorites?entityType=${type}&entityId=${id}`, { method: 'DELETE' })

      if (!r.ok) {
        /* ۴۰۱ ⇒ کاربر وارد نشده؛ بقیه ⇒ خطای واقعی. هر دو یعنی برگشت. */
        setOn(!next); setLocal(key, !next)
        if (r.status === 401) window.location.href = '/login'
      }
    } catch {
      setOn(!next); setLocal(key, !next)
    } finally { setBusy(false) }
  }

  return (
    <button
      onClick={toggle}
      aria-label={on ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
      aria-pressed={on}
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 999, padding: showLabel ? '7px 13px' : 7,
        cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
        fontSize: 12.5, fontWeight: 700,
        color: on ? '#E0245E' : 'rgba(0,0,0,0.42)',
        opacity: ready ? 1 : 0.55,
        transition: 'color .2s, transform .15s',
        ...style,
      }}
    >
      <Heart size={size} fill={on ? '#E0245E' : 'none'} strokeWidth={on ? 0 : 2} />
      {showLabel && (on ? 'در علاقه‌مندی‌ها' : 'علاقه‌مندی')}
    </button>
  )
}
