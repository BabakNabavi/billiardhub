'use client'

import { useSyncExternalStore } from 'react'
import { clubOpenStatus, type ClubOpenStatus } from '@/lib/clubs/open-status'

const UNKNOWN: ClubOpenStatus = { isOpen: null, closeTime: null, todayKey: '' }
const currentMinute = () => Math.floor(Date.now() / 60_000)
const serverMinute = () => null

function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>
  const schedule = () => {
    timer = setTimeout(() => {
      onChange()
      schedule()
    }, 60_000 - Date.now() % 60_000 + 10)
  }
  schedule()
  // بازگشت از پس‌زمینه نباید وضعیت ساعت قبلی را نگه دارد
  window.addEventListener('focus', onChange)
  document.addEventListener('visibilitychange', onChange)
  return () => {
    clearTimeout(timer)
    window.removeEventListener('focus', onChange)
    document.removeEventListener('visibilitychange', onChange)
  }
}

export function useClubOpenStatus(workingHours: unknown): ClubOpenStatus {
  const minute = useSyncExternalStore<number | null>(subscribe, currentMinute, serverMinute)
  return minute === null ? UNKNOWN : clubOpenStatus(workingHours, new Date(minute * 60_000))
}
