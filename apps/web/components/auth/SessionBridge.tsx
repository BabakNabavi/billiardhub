'use client'

/* پل نشست — دو کار می‌کند:

   ۱) مهاجرت بی‌صدا: کاربرانی که توکنشان در localStorage است، بدون
      اینکه چیزی ببینند به نشست کوکی‌محور منتقل می‌شوند.

   ۲) تازه‌سازی توکن دسترسی: کوکی access فقط ۱۵ دقیقه عمر دارد، پس
      باید پیش از انقضا تمدید شود؛ وگرنه کاربری که نیم‌ساعت روی سایت
      بماند ناگهان ۴۰۱ می‌گیرد. چون بیشتر فراخوان‌ها fetch ساده‌اند و
      اینترسپتور ندارند، تمدید را «پیش‌دستانه» انجام می‌دهیم نه واکنشی.

   این کامپوننت پس از پایان دوره‌ی گذار ساده‌تر می‌شود (بخش adopt حذف). */

import { useEffect } from 'react'
import { useAuthStore } from '../../store/auth.store'

const DONE_KEY = 'bh_session_migrated'
const REFRESH_EVERY_MS = 12 * 60 * 1000   // کوکی ۱۵ دقیقه‌ای، با حاشیه‌ی امن
const MIN_GAP_MS = 4 * 60 * 1000          // برای جلوگیری از تمدید پشت‌هم

const readRaw = () => { try { return localStorage.getItem('auth-storage') } catch { return null } }
const legacyToken = (): string | null => {
  try { return JSON.parse(readRaw() || '{}')?.state?.token || null } catch { return null }
}

export default function SessionBridge() {
  const user = useAuthStore(s => s.user)
  const hydrated = useAuthStore(s => s._hydrated)
  const logout = useAuthStore(s => s.logout)

  useEffect(() => {
    if (!hydrated) return
    let stopped = false
    let last = 0

    /* ── مهاجرت ── */
    const adopt = async () => {
      try {
        if (localStorage.getItem(DONE_KEY)) return
        const token = legacyToken()
        if (!token) return

        const r = await fetch('/api/auth/adopt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        })
        if (stopped) return

        if (r.ok) {
          localStorage.setItem(DONE_KEY, String(Date.now()))
          /* توکن از localStorage برداشته می‌شود؛ خود کاربر (نام/نقش)
             برای نمایش می‌ماند. از این پس کوکی منبع حقیقت است. */
          try {
            const parsed = JSON.parse(readRaw() || '{}')
            if (parsed?.state) {
              delete parsed.state.token
              localStorage.setItem('auth-storage', JSON.stringify(parsed))
            }
          } catch { /* ignore */ }
        } else if (r.status === 401) {
          localStorage.setItem(DONE_KEY, 'invalid')
        }
      } catch { /* شبکه قطع بود؛ دفعه‌ی بعد */ }
    }

    /* ── تمدید ── */
    const refresh = async () => {
      if (stopped || !user) return
      if (Date.now() - last < MIN_GAP_MS) return
      last = Date.now()
      try {
        const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
        if (stopped || r.ok || r.status === 503) return
        if (r.status === 401) {
          /* اگر هنوز توکن قدیمی داریم، هدر کار می‌کند و نباید کاربر را
             بیرون بیندازیم. در غیر این صورت نشست واقعاً تمام شده است. */
          if (legacyToken()) return
          logout()
          try { localStorage.removeItem(DONE_KEY) } catch { /* ignore */ }
        }
      } catch { /* بی‌صدا */ }
    }

    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }

    ;(async () => { await adopt(); await refresh() })()
    const timer = setInterval(refresh, REFRESH_EVERY_MS)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [hydrated, user, logout])

  return null
}
