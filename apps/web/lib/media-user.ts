'use client'
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
    const r = await fetch('/api/media', { cache: 'no-store' })
    if (!r.ok) return []
    const list = await r.json()
    return (Array.isArray(list) ? list : []).map(toMedia)
  } catch { return [] }
}

export async function postUserVideo(video: Partial<RawUserVideo>): Promise<{ ok?: boolean; video?: RawUserVideo; message?: string }> {
  try {
    const r = await fetch('/api/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video }) })
    return await r.json()
  } catch { return { ok: false } }
}

export async function deleteUserVideo(id: string, user: string): Promise<boolean> {
  try { await fetch(`/api/media?id=${encodeURIComponent(id)}&user=${encodeURIComponent(user)}`, { method: 'DELETE' }); return true } catch { return false }
}
