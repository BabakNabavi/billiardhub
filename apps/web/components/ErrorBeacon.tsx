'use client'

/* ─────────────────────────────────────────────────────────────
   گزارشِ خطای مرورگر — تا امروز هیچ خطایی که سرِ کاربر می‌افتاد به
   ما نمی‌رسید مگر خودش بگوید.

   دو منبع پوشش داده می‌شود:
   ۱) `error` — خطای هم‌زمانِ رهاشده
   ۲) `unhandledrejection` — Promiseِ ردشده‌ی بی‌catch، که در این
      پروژه با این‌همه `async` منبعِ رایج‌تری است

   ⚠️ خودِ این کامپوننت نباید منبعِ خطا شود: هر کاری داخلِ try است و
   شکستِ ارسال بی‌صداست.
   ───────────────────────────────────────────────────────────── */

import { useEffect } from 'react'

/* ── ضدِ سیل، سمتِ مرورگر ──
   یک حلقه‌ی خراب می‌تواند در چند ثانیه هزاران خطا بدهد. سرور هم
   سقفِ نرخ دارد، ولی بهتر است اصلا فرستاده نشود: هم باتریِ موبایل،
   هم شبکه‌ی کندِ کاربر. */
const MAX_PER_SESSION = 8
const seen = new Set<string>()
let sent = 0

/* ── نوفه‌ی بعد از هر دیپلوی ──
   ⚠️ تبِ بازمانده با چانکِ کهنه بعد از دیپلوی خطا می‌دهد و
   `AppBoot` خودش صفحه را تازه می‌کند — یعنی از قبل درمان شده است.
   ثبتشان فقط ژورنال را پر می‌کند، و چون نامِ چانک هگز است، حذفِ
   عددها هم جمعشان نمی‌کند: به ازای هر تبِ کهنه یک ردیفِ تازه. */
const STALE = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported|Importing a module script failed/i

function report(message: string, stack?: string) {
  if (typeof window === 'undefined') return
  if (sent >= MAX_PER_SESSION) return
  if (STALE.test(message)) return
  /* همان خطا در یک نشست فقط یک بار */
  const key = `${message}|${(stack ?? '').slice(0, 120)}`
  if (seen.has(key)) return
  seen.add(key)
  sent++

  const body = JSON.stringify({
    message: message.slice(0, 2000),
    stack: stack?.slice(0, 8000),
    url: location.href.slice(0, 500),
    release: process.env.NEXT_PUBLIC_BUILD_SHA || 'dev',
  })

  try {
    /* ⚠️ `sendBeacon` چون خطا اغلب هم‌زمانِ ترکِ صفحه رخ می‌دهد و
       یک `fetch` معمولی همان‌جا لغو می‌شود. اگر نبود یا رد کرد،
       `fetch` با `keepalive` جایش را می‌گیرد. */
    const blob = new Blob([body], { type: 'application/json' })
    if (navigator.sendBeacon?.('/api/telemetry/error', blob)) return
  } catch { /* می‌رویم سراغ fetch */ }

  try {
    void fetch('/api/telemetry/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch { /* بی‌صدا */ }
}

export default function ErrorBeacon() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      /* خطای بارگذاریِ منبع (عکسِ ۴۰۴) هم `error` می‌دهد ولی
         `message` ندارد؛ آن نوفه است نه باگ. */
      if (!e.message) return
      report(e.message, e.error instanceof Error ? e.error.stack : undefined)
    }
    const onReject = (e: PromiseRejectionEvent) => {
      const r = e.reason
      const msg = r instanceof Error ? r.message : String(r ?? 'unhandled rejection')
      report(`Unhandled rejection: ${msg}`, r instanceof Error ? r.stack : undefined)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onReject)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onReject)
    }
  }, [])

  return null
}

/** گزارشِ دستی — از داخلِ `error.tsx` یا هر catchِ معنادار */
export function reportClientError(err: unknown, note?: string) {
  const e = err instanceof Error ? err : new Error(String(err))
  report(note ? `${note}: ${e.message}` : e.message, e.stack)
}
