'use client'
import { apiFetch } from './http'
import type { MediaVideo, MediaCategoryKey } from './media-data'

/* ویدیوهای آپلودیِ کاربران — رپرهای کلاینت + تبدیل به MediaVideo برای نمایش
   کنارِ محتوای دستیِ بیلیارد مدیا. */
export interface RawUserVideo {
  id: string; title: string; category: string; ownerKey: string
  creatorName: string; creatorHandle: string
  duration: string; views: number; likes: number; date: string; ts: number
  thumb: string; src: string; description: string[]; tags: string[]
}

export const toMedia = (v: RawUserVideo): MediaVideo => ({
  id: v.id, title: v.title, category: v.category as MediaCategoryKey,
  creator: { id: v.ownerKey, name: v.creatorName, handle: v.creatorHandle },
  duration: v.duration, views: v.views, likes: v.likes, date: v.date, ts: v.ts,
  thumb: v.thumb, src: v.src, description: v.description || [], tags: v.tags || [],
})

export async function fetchUserVideos(): Promise<MediaVideo[]> {
  try {
    const r = await apiFetch('/api/media', { cache: 'no-store' })
    if (!r.ok) return []
    const list = await r.json()
    return (Array.isArray(list) ? list : []).map(toMedia)
  } catch { return [] }
}

export async function postUserVideo(video: Partial<RawUserVideo>): Promise<{ ok?: boolean; video?: RawUserVideo; message?: string }> {
  try {
    const r = await apiFetch('/api/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video }) })
    return await r.json()
  } catch { return { ok: false } }
}

export async function deleteUserVideo(id: string, user: string): Promise<boolean> {
  try { await apiFetch(`/api/media?id=${encodeURIComponent(id)}&user=${encodeURIComponent(user)}`, { method: 'DELETE' }); return true } catch { return false }
}

/* ── کانالِ کاربر (برای انتشارِ ویدیو لازم است، مثل یوتیوب) ── */
export interface UserChannel { ownerKey: string; name: string; handle: string; bio: string; avatar: string; createdAt: number }

export async function fetchMyChannel(ownerKey: string): Promise<UserChannel | null> {
  try {
    const r = await apiFetch(`/api/media/channel?owner=${encodeURIComponent(ownerKey)}`, { cache: 'no-store' })
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

export async function checkHandle(handle: string, ownerKey: string): Promise<boolean> {
  try {
    const r = await apiFetch(`/api/media/channel?handle=${encodeURIComponent(handle)}&owner=${encodeURIComponent(ownerKey)}`, { cache: 'no-store' })
    if (!r.ok) return false
    return (await r.json())?.available === true
  } catch { return false }
}

export async function saveChannel(c: { ownerKey: string; name: string; handle: string; bio?: string; avatar?: string }): Promise<{ ok?: boolean; channel?: UserChannel; message?: string }> {
  try {
    const r = await apiFetch('/api/media/channel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) })
    return await r.json()
  } catch { return { ok: false, message: 'خطا در ارتباط با سرور' } }
}
