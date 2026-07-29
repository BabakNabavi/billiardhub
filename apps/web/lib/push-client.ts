'use client'
import { apiFetch } from './http'
import { VAPID_PUBLIC_KEY } from './push-public'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buf = new ArrayBuffer(raw.length)
  const arr = new Uint8Array(buf)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function pushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}
export function pushPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!pushSupported()) return 'unsupported'
  return Notification.permission
}

/* ثبت SW + گرفتنِ مجوز + اشتراک + ذخیره روی سرور. اگر silent=true، مجوز نمی‌پرسد
   (فقط وقتی قبلاً granted بوده ⇒ تازه‌سازیِ اشتراک). */
export async function enablePush(user: string, silent = false): Promise<'ok' | 'denied' | 'unsupported' | 'error'> {
  if (!pushSupported() || !user) return 'unsupported'
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    if (Notification.permission !== 'granted') {
      if (silent) return 'denied'
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return 'denied'
    }
    const existing = await reg.pushManager.getSubscription()
    const sub = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
    await apiFetch('/api/social/push', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, subscription: sub.toJSON() }),
    })
    return 'ok'
  } catch { return 'error' }
}
