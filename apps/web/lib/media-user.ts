'use client'
import { apiFetch } from './http'
import type { MediaVideo, MediaCategoryKey } from './media-data'

/* ویدیوهای آپلودی کاربران — رپرهای کلاینت + تبدیل به MediaVideo برای نمایش
   کنار محتوای دستی بیلیارد مدیا. */
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

/* ── شکلِ تازه‌ی پاسخِ سرور ──
   `/api/media` حالا از جدولِ `videos` می‌خواند و
   `{ items, nextCursor }` می‌دهد، نه آرایه‌ی خام. */
export interface PublicVideo {
  slug: string; title: string; description: string
  category: string; tags: string[]
  creatorName: string; creatorHandle: string; clubId: string | null
  src: string; thumb: string
  durationSec: number | null; width: number | null; height: number | null
  views: number; publishedAt: string | null; featured: boolean
}

/** `mm:ss` با رقمِ فارسی — چیزی که کارت نشان می‌دهد. */
export const faDuration = (sec: number | null): string => {
  if (!sec || sec <= 0) return ''
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60)
  const t = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!)
}

export const publicToMedia = (v: PublicVideo): MediaVideo => ({
  /* `id` حالا همان نشانیِ عمومی است — مسیرِ صفحه از همین ساخته می‌شود */
  id: v.slug,
  title: v.title,
  category: v.category as MediaCategoryKey,
  creator: { id: v.creatorHandle, name: v.creatorName, handle: v.creatorHandle },
  duration: faDuration(v.durationSec),
  views: v.views, likes: 0,
  date: v.publishedAt ?? '',
  ts: v.publishedAt ? Date.parse(v.publishedAt) : 0,
  thumb: v.thumb, src: v.src,
  description: v.description ? v.description.split('\n').filter(Boolean) : [],
  tags: v.tags ?? [],
  featured: v.featured,
})

export interface VideoPage { items: MediaVideo[]; nextCursor: string | null }

export async function fetchVideos(params: {
  category?: string; q?: string; handle?: string; club?: string
  sort?: 'recent' | 'popular'; limit?: number; before?: string; featured?: boolean
} = {}): Promise<VideoPage> {
  try {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === '' || v === false) continue
      qs.set(k, v === true ? '1' : String(v))
    }
    const r = await apiFetch('/api/media?' + qs.toString(), { cache: 'no-store' })
    if (!r.ok) return { items: [], nextCursor: null }
    const j = await r.json() as { items?: PublicVideo[]; nextCursor?: string | null }
    return { items: (j.items ?? []).map(publicToMedia), nextCursor: j.nextCursor ?? null }
  } catch { return { items: [], nextCursor: null } }
}

/** سازگاری با فراخوان‌های قدیمی که فقط یک آرایه می‌خواستند. */
export async function fetchUserVideos(): Promise<MediaVideo[]> {
  return (await fetchVideos({ limit: 48 })).items
}

/* ورودیِ ثبتِ ویدیو. `durationSec`/`width`/`height` عمداً اختیاری‌اند
   و اگر مرورگر نتوانست بخواند فرستاده نمی‌شوند — سرور آن‌ها را NULL
   نگه می‌دارد، نه صفر. صفر در داده‌ی ساختاریافته یعنی «طولش صفر
   است» که دروغ است. */
export interface NewVideoInput {
  title: string; description?: string; category?: string; tags?: string[]
  creatorName?: string; creatorHandle?: string; clubId?: string
  src: string; thumb?: string
  durationSec?: number; width?: number; height?: number
  mime?: string; sizeBytes?: number
}

export async function postUserVideo(video: NewVideoInput): Promise<{ ok?: boolean; video?: PublicVideo; message?: string }> {
  try {
    const r = await apiFetch('/api/media', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video }),
    })
    return await r.json()
  } catch { return { ok: false } }
}

/* مالکیت از نشست می‌آید؛ پارامترِ `user` فقط برای سازگاریِ امضا مانده
   و سرور به آن نگاه نمی‌کند. */
export async function deleteUserVideo(slugOrId: string, _user?: string): Promise<boolean> {
  try {
    const r = await apiFetch(`/api/media?slug=${encodeURIComponent(slugOrId)}`, { method: 'DELETE' })
    return r.ok
  } catch { return false }
}

/* ── کانال کاربر (برای انتشار ویدیو لازم است، مثل یوتیوب) ── */
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
