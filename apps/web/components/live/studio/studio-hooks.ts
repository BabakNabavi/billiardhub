'use client'

/* هوک‌های کوچکِ استودیوی پخش: ساعتِ پخش، شمارِ بیننده، جهتِ صفحه، قفلِ افقی. */

import { useEffect, useRef, useState, type RefObject } from 'react'

/** زمانِ پخش از لحظه‌ی «زنده»شدن (از استور، نه از بازشدنِ استودیو) — «۰۲:۱۳» یا «۱:۰۲:۱۳» */
export function useStudioClock(since: number | null): string {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (since === null) return
    setNow(Date.now())
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [since])
  const s = since ? Math.max(0, Math.floor((now - since) / 1000)) : 0
  const p = (n: number) => String(n).padStart(2, '0')
  return s >= 3600 ? `${Math.floor(s / 3600)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}` : `${p(Math.floor(s / 60))}:${p(s % 60)}`
}

/** شمارِ بیننده از فهرستِ عمومی — هر ۱۵ ثانیه، فقط وقتی زنده است */
export function useStudioViewers(clubId: string, channelId: string, live: boolean): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!live) { setN(0); return }
    let alive = true
    const load = async () => {
      try {
        const r = await fetch(`/api/streams?clubId=${clubId}`, { cache: 'no-store' })
        const j = await r.json() as { channels?: { id: string; viewers: number }[] }
        if (alive) setN(j.channels?.find(c => c.id === channelId)?.viewers ?? 0)
      } catch { /* بی‌صدا — عددِ قبلی می‌ماند */ }
    }
    void load()
    const t = window.setInterval(() => void load(), 15_000)
    return () => { alive = false; window.clearInterval(t) }
  }, [clubId, channelId, live])
  return n
}

export function usePortrait(): boolean {
  const [p, setP] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)')
    const on = () => setP(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return p
}

/** خروج از تمام‌صفحه و رها کردنِ قفلِ جهت */
export function releaseScreen() {
  try { (screen.orientation as ScreenOrientation & { unlock?: () => void })?.unlock?.() } catch { /* پشتیبانی نمی‌شود */ }
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
}

/* ── فوکوسِ پنجره ──
   فوکوس به دکمه‌ی اصلی می‌رود، Tab از استودیو بیرون نمی‌رود (بقیه‌ی صفحه inert)،
   Escape می‌بندد، و پس از بسته‌شدن فوکوس به دکمه‌ای برمی‌گردد که بازش کرد. */
export function useDialogFocus(root: RefObject<HTMLElement | null>, onEscape: () => void) {
  const esc = useRef(onEscape)
  esc.current = onEscape
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const el = root.current
    const others = Array.from(document.body.children).filter(c => c !== el && !c.hasAttribute('inert'))
    others.forEach(c => c.setAttribute('inert', ''))
    el?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') esc.current() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      others.forEach(c => c.removeAttribute('inert'))
      opener?.focus?.()
    }
  }, [root])
}

/** اندروید: تمام‌صفحه + قفلِ افقی. آیفون اجازه نمی‌دهد ⟵ false (کاربر خودش می‌چرخاند) */
export async function lockLandscape(): Promise<boolean> {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.()
    const o = screen.orientation as ScreenOrientation & { lock?: (o: 'landscape') => Promise<void> }
    if (!o?.lock) return false
    await o.lock('landscape')
    return true
  } catch { return false }
}
