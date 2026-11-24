'use client'

import { useSyncExternalStore } from 'react'
import { clubOpenStatus, type ClubOpenStatus } from '@/lib/clubs/open-status'

const UNKNOWN: ClubOpenStatus = { isOpen: null, closeTime: null, allDay: false, todayKey: '' }
const currentMinute = () => Math.floor(Date.now() / 60_000)
const serverMinute = () => null

/* ── یک ساعت برای همه‌ی کارت‌ها ──
   صفحه‌ی اصلی کارت‌های باشگاه را دوبار رندر می‌کند (نوارِ دسکتاپ و اسلایدرِ موبایل)؛
   با اشتراکِ جدا برای هر کارت ده‌ها تایمر و شنونده روی گوشیِ ضعیف می‌ماند. یک تایمرِ
   سرِ دقیقه و یک جفت شنونده، تا وقتی دست‌کم یک کارت هست (بازبینی، آذرِ ۱۴۰۵). */
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | null = null
const notify = () => { for (const l of listeners) l() }
function arm() {
  timer = setTimeout(() => { notify(); arm() }, 60_000 - (Date.now() % 60_000) + 10)
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  if (listeners.size === 1) {
    arm()
    // بازگشت از پس‌زمینه نباید وضعیت ساعت قبلی را نگه دارد
    window.addEventListener('focus', notify)
    document.addEventListener('visibilitychange', notify)
  }
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) {
      if (timer) clearTimeout(timer)
      timer = null
      window.removeEventListener('focus', notify)
      document.removeEventListener('visibilitychange', notify)
    }
  }
}

export function useClubOpenStatus(workingHours: unknown): ClubOpenStatus {
  const minute = useSyncExternalStore<number | null>(subscribe, currentMinute, serverMinute)
  return minute === null ? UNKNOWN : clubOpenStatus(workingHours, new Date(minute * 60_000))
}
