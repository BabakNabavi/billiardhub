'use client'
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../http'
import { readHistory, type HistoryEntry } from './history'
import { buildTaste, type Taste } from './recommend'

/* سلیقه‌ی بیننده برای الگوریتمِ پیشنهاد: تاریخچه‌ی همین دستگاه + کانال‌های
   دنبال‌شده (فقط با ورود). رندرِ اول همیشه بی‌سلیقه است (localStorage روی
   سرور نیست)، پس هیدریشن ناهماهنگ نمی‌شود.

   ⚠️ کش با شناسه‌ی کاربر کلید می‌خورد: روی دستگاهِ مشترک، خروجِ A و ورودِ B
   در همان تب نباید اشتراک‌های A را به B نشان دهد.
   ⚠️ apiFetch روی ۴۰۱ اول نشست را تمدید می‌کند (session-two-sources)؛ و شکست
   کش نمی‌شود — وگرنه یک خطای گذرا تا رفرش فهرست را خالی نگه می‌داشت.
   `ready`: تا اشتراک‌ها برسند (یا ۸۰۰ms بگذرد)، تا ترتیبِ خانه بعد از نمایش نپرد. */

let subsCache: { uid: string; p: Promise<string[] | null> } | null = null

async function loadSubs(): Promise<string[] | null> {
  try {
    const r = await apiFetch('/api/media/social?mine=subscriptions')
    if (!r.ok) return null
    const j: unknown = await r.json()
    const handles = (j as { handles?: unknown }).handles
    return Array.isArray(handles) ? handles.filter((h): h is string => typeof h === 'string') : []
  } catch { return null }
}

export function useTaste(userId?: string): {
  taste: Taste; subscribed: string[]; history: HistoryEntry[]; ready: boolean; subsLoading: boolean
} {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [subscribed, setSubscribed] = useState<string[]>([])
  const [subsLoading, setSubsLoading] = useState(Boolean(userId))
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => { setHistory(readHistory()) }, [])

  useEffect(() => {
    setSubscribed([])
    if (!userId) { setSubsLoading(false); return }
    let alive = true
    setSubsLoading(true)
    if (!subsCache || subsCache.uid !== userId) subsCache = { uid: userId, p: loadSubs() }
    const mine = subsCache
    void mine.p.then(h => {
      if (h === null && subsCache === mine) subsCache = null
      if (alive) { setSubscribed(h ?? []); setSubsLoading(false) }
    })
    const t = window.setTimeout(() => { if (alive) setTimedOut(true) }, 800)
    return () => { alive = false; window.clearTimeout(t) }
  }, [userId])

  const taste = useMemo(() => buildTaste(history, subscribed), [history, subscribed])
  return { taste, subscribed, history, ready: !subsLoading || timedOut, subsLoading }
}
