'use client'

import { apiFetch } from '../http'
import type { LiveAngle } from './angles'

export interface LiveSession {
  id: string; clubId: string; clubName: string; title: string
  ownerKey: string
  /** سرور همچنان مقدارِ پیش‌فرض می‌گذارد؛ از باشگاه‌دار پرسیده نمی‌شود
   *  و هیچ‌جا نمایش داده نمی‌شود، پس نمایشش یعنی نشان‌دادنِ چیزی که
   *  کسی انتخابش نکرده. */
  discipline?: string
  startedAt: number; lastBeat: number; viewers: number; ended?: boolean
  /** فقط وقتی یک جلسه‌ی مشخص خوانده شود پر است؛ فهرست آن را نمی‌آورد. */
  angles?: LiveAngle[]
}

const j = async <T>(p: Promise<Response>, fb: T): Promise<T> => {
  try { const r = await p; if (!r.ok) return fb; return (await r.json()) as T } catch { return fb }
}

const post = <T>(body: unknown, fb: T) =>
  j<T>(apiFetch('/api/live', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), fb)

/* ⚠️ مثل fetchLiveSession، «نتوانستم بپرسم» باید از «چیزی نیست» جدا
   بماند. با آرایه‌ی خالی برای هر دو، یک قطعیِ کوتاهِ اینترنت از نگاهِ
   دوربینِ مهمان شبیهِ «پخش تمام شد» می‌شد و دوربینش را می‌بست. */
export const fetchLiveSessions = async (): Promise<LiveSession[] | undefined> => {
  try {
    const r = await apiFetch('/api/live', { cache: 'no-store' })
    if (!r.ok) return undefined
    const d = await r.json()
    return Array.isArray(d) ? (d as LiveSession[]) : []
  } catch { return undefined }
}
/* ⚠️ سه حالتِ جدا، نه دو تا:
     • جلسه   ⇒ خودِ شیء
     • null   ⇒ سرور گفت این پخش تمام شده
     • undefined ⇒ نتوانستیم بپرسیم (شبکه/۵xx)

   اگر «نتوانستیم بپرسیم» هم null می‌شد، یک قطعیِ لحظه‌ای روی صفحه‌ی
   تماشا پرده‌ی «پخش پایان یافته است» را می‌انداخت و همه‌ی کنترل‌ها را
   غیرفعال می‌کرد — در حالی که WebRTC دستِ‌نخورده داشت پخش می‌کرد. */
export const fetchLiveSession = async (id: string): Promise<LiveSession | null | undefined> => {
  try {
    const r = await apiFetch(`/api/live?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
    if (!r.ok) return undefined
    return (await r.json()) as LiveSession | null
  } catch { return undefined }
}

/* «رشته» دیگر از باشگاه‌دار پرسیده نمی‌شود — عنوانِ پخش همان را
   می‌گوید. سرور مقدارِ پیش‌فرض خودش را می‌گذارد. */
export const startLive = (body: { clubId: string; clubName: string; ownerKey: string; title: string; angleLabel?: string }) =>
  post<{ ok?: boolean; session?: LiveSession; message?: string }>({ action: 'start', ...body }, {})

/** `angleId` مشخص می‌کند کدام دوربین دارد تپش می‌فرستد. بدونِ آن،
 *  دوربینِ دوم به‌جای زنده‌نگه‌داشتنِ خودش، جلسه را به‌نامِ دوربینِ
 *  اصلی تپش می‌داد. */
export const beatLive = (id: string, ownerKey: string, viewers: number, angleId?: string, label?: string) =>
  post({ action: 'beat', id, ownerKey, viewers, angleId, label }, {})

export const stopLive = (id: string, ownerKey: string) =>
  post({ action: 'stop', id, ownerKey }, {})

export const addAngle = (id: string, label: string) =>
  post<{ ok?: boolean; angle?: LiveAngle; message?: string }>({ action: 'add-angle', id, label }, {})
