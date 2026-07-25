import webpush from 'web-push'
import { readJson, writeJson, safeKey } from './social-server'
import { VAPID_PUBLIC_KEY } from './push-public'

/* Web Push سمت‌سرور — اشتراک‌ها در Storage نگهداری می‌شوند. کلیدِ خصوصی فقط از env. */
let configured = false
function ensure(): boolean {
  if (configured) return true
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!priv) return false
  webpush.setVapidDetails('mailto:nabbabak@gmail.com', VAPID_PUBLIC_KEY, priv)
  configured = true
  return true
}

type Sub = webpush.PushSubscription
const subPath = (user: string) => `social/push/${safeKey(user)}.json`

export async function saveSubscription(user: string, sub: Sub): Promise<void> {
  if (!user || !sub?.endpoint) return
  const list = await readJson<Sub[]>(subPath(user), [])
  if (!list.some(s => s.endpoint === sub.endpoint)) {
    list.push(sub)
    await writeJson(subPath(user), list.slice(-12))
  }
}

export async function removeSubscription(user: string, endpoint: string): Promise<void> {
  if (!user || !endpoint) return
  const list = await readJson<Sub[]>(subPath(user), [])
  const next = list.filter(s => s.endpoint !== endpoint)
  if (next.length !== list.length) await writeJson(subPath(user), next)
}

export async function sendPush(
  user: string,
  payload: { title: string; body: string; url?: string; tag?: string },
): Promise<void> {
  if (!ensure() || !user) return
  const list = await readJson<Sub[]>(subPath(user), [])
  if (!list.length) return
  const data = JSON.stringify(payload)
  const dead: string[] = []
  await Promise.all(list.map(async (s) => {
    try { await webpush.sendNotification(s, data) }
    catch (e) {
      const code = (e as { statusCode?: number })?.statusCode
      if (code === 404 || code === 410) dead.push(s.endpoint)   // اشتراکِ منقضی
    }
  }))
  if (dead.length) await writeJson(subPath(user), list.filter(s => !dead.includes(s.endpoint)))
}
