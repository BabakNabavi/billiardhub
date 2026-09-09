import 'server-only'
import { getSupabaseServer } from '../supabase-server'
import { toPublic, makeSlug, type VideoRow, type PublicVideo } from './server'
import { resolveUrl, type StorageProvider } from './storage'

/* ─────────────────────────────────────────────────────────────
   لیست‌های پخش — لایه‌ی سرور.

   ⚠️ مثل بقیه‌ی لایه‌ی اجتماعی، «جدول نیست» از «خطا» جدا است:
   مهاجرت ۰۹۳ دستی اجرا می‌شود و کد ممکن است زودتر دیپلوی شود. در
   آن پنجره تب «لیست‌های پخش» اصلا نباید دیده شود.

   ⚠️ مالکیت با هندل کانال بررسی می‌شود، نه با `owner_id`: کاربر
   می‌تواند چند کانال داشته باشد و `myChannelHandles` منبع واحد
   همان بررسی است که مسیر انتشار ویدیو هم از آن استفاده می‌کند.
   ───────────────────────────────────────────────────────────── */

const sb = () => getSupabaseServer()
const missing = (msg?: string) => /does not exist|schema cache/i.test(msg ?? '')
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/* ⚠️ برای بندانگشتی کل `VideoRow` لازم نیست و وانمود‌کردن به آن
   (`as unknown as VideoRow`) همان در پشتی `any` است: ستون‌های
   انتخاب‌شده ناقص‌اند و `toPublic` روی آن‌ها `description: undefined`
   می‌سازد در حالی که تایپ می‌گوید `string`. */
interface ThumbRow {
  id: string
  thumb: string
  thumb_key: string | null
  src: string
  storage_key: string | null
  storage_provider?: StorageProvider
}
const thumbOf = (v: ThumbRow) =>
  resolveUrl(v.thumb_key, v.thumb, v.storage_provider ?? 'supabase')

export interface Playlist {
  slug: string
  title: string
  description: string
  handle: string
  count: number
  /** بندانگشتی چند ویدیوی اول — کارت لیست چند تصویر نشان می‌دهد */
  posters: string[]
}

export interface PlaylistDetail extends Playlist {
  items: PublicVideo[]
}

export interface PlaylistResult<T> { available: boolean; data: T }

const LIST_COLS =
  'slug,title,category,tags,creator_name,creator_handle,club_id,thumb,src,' +
  'storage_provider,storage_key,thumb_key,' +
  'duration_sec,width,height,views,published_at,featured'

/** لیست‌های عمومی یک کانال. */
export async function channelPlaylists(handle: string): Promise<PlaylistResult<Playlist[]>> {
  const h = handle.trim().toLowerCase()
  if (!h) return { available: true, data: [] }
  try {
    const { data, error } = await sb().from('playlists')
      .select('id,slug,title,description,channel_handle')
      .eq('channel_handle', h).eq('visibility', 'public')
      .order('created_at', { ascending: false }).limit(50)
    if (error) {
      if (missing(error.message)) return { available: false, data: [] }
      throw new Error(error.message)
    }
    if (!data) return { available: false, data: [] }
    const rows = data as Record<string, unknown>[]
    if (rows.length === 0) return { available: true, data: [] }

    /* شمارش و بندانگشتی برای همه‌ی لیست‌ها با دو پرس‌وجو، نه دو
       پرس‌وجو به‌ازای هر لیست. */
    const ids = rows.map(r => str(r.id))
    const { data: items } = await sb().from('playlist_items')
      .select('playlist_id,video_id,position,created_at')
      .in('playlist_id', ids)
      .order('position', { ascending: true }).order('created_at', { ascending: true })
      .limit(2000)
    const byList = new Map<string, string[]>()
    for (const it of (items ?? []) as Record<string, unknown>[]) {
      const k = str(it.playlist_id)
      const arr = byList.get(k) ?? []
      arr.push(str(it.video_id)); byList.set(k, arr)
    }

    /* ⚠️ ویدیوی لیست باید *همچنان* عمومی و منتشرشده باشد. بدون
       این فیلتر، ویدیویی که بعد از افزودن به لیست خصوصی یا
       پیش‌نویس شده، بندانگشتی‌اش روی کارت عمومی کانال می‌ماند و
       در شمارش هم می‌آید — کارت می‌گفت «۵ ویدیو» و صفحه‌ی لیست
       سه‌تا نشان می‌داد. */
    const allVideoIds = [...new Set([...byList.values()].flat())]
    const live = new Set<string>()
    const thumbs = new Map<string, string>()
    if (allVideoIds.length > 0) {
      const { data: vids } = await sb().from('videos')
        .select('id,thumb,thumb_key,storage_provider,src,storage_key')
        .in('id', allVideoIds)
        .eq('status', 'published').neq('visibility', 'private')
      for (const v of (vids ?? []) as ThumbRow[]) {
        live.add(v.id)
        thumbs.set(v.id, thumbOf(v))
      }
    }
    return {
      available: true,
      data: rows.map(r => {
        const vids = (byList.get(str(r.id)) ?? []).filter(id => live.has(id))
        return {
          slug: str(r.slug), title: str(r.title), description: str(r.description),
          handle: str(r.channel_handle), count: vids.length,
          posters: vids.map(id => thumbs.get(id) ?? '').filter(Boolean).slice(0, 3),
        }
      }),
    }
  } catch (e) {
    console.error('[media/playlists] list:', (e as Error).message)
    return { available: false, data: [] }
  }
}

/** یک لیست با ویدیوهایش. */
export async function playlistBySlug(slug: string): Promise<PlaylistDetail | null> {
  const s = slug.trim()
  if (!s) return null
  try {
    const { data, error } = await sb().from('playlists')
      .select('id,slug,title,description,channel_handle,visibility')
      .eq('slug', s).maybeSingle()
    if (error || !data) return null
    const p = data as Record<string, unknown>
    /* `unlisted` با داشتن نشانی باز می‌شود؛ `private` نه — همان
       قاعده‌ی خود ویدیوها. */
    if (str(p.visibility) === 'private') return null

    const { data: items } = await sb().from('playlist_items')
      .select('video_id,position,created_at').eq('playlist_id', str(p.id))
      .order('position', { ascending: true }).order('created_at', { ascending: true })
      .limit(200)
    const ids = ((items ?? []) as Record<string, unknown>[]).map(r => str(r.video_id))

    let videos: PublicVideo[] = []
    if (ids.length > 0) {
      const { data: vids } = await sb().from('videos').select(`id,${LIST_COLS}`)
        .in('id', ids).eq('status', 'published').neq('visibility', 'private')
      const rows = (vids ?? []) as unknown as (VideoRow & { id: string })[]
      const byId = new Map(rows.map(v => [v.id, toPublic(v)]))
      /* ترتیب لیست حفظ می‌شود، نه ترتیبی که دیتابیس برگردانده */
      videos = ids.map(id => byId.get(id)).filter((v): v is PublicVideo => Boolean(v))
    }

    return {
      slug: str(p.slug), title: str(p.title), description: str(p.description),
      handle: str(p.channel_handle), count: videos.length,
      posters: videos.map(v => v.thumb).filter(Boolean).slice(0, 3),
      items: videos,
    }
  } catch (e) {
    console.error('[media/playlists] detail:', (e as Error).message)
    return null
  }
}

/* ═══════════════ نوشتن ═══════════════ */

export type WriteResult =
  | { kind: 'ok'; slug: string }
  | { kind: 'unavailable' }
  | { kind: 'error'; message: string }

export async function createPlaylist(
  { handle, ownerId, title, description }:
  { handle: string; ownerId: string; title: string; description: string },
): Promise<WriteResult> {
  const t = title.trim().slice(0, 120)
  if (!t) return { kind: 'error', message: 'عنوان لازم است' }
  try {
    const slug = makeSlug(t)
    const { error } = await sb().from('playlists').insert({
      slug, title: t, description: description.trim().slice(0, 1000),
      owner_id: ownerId, channel_handle: handle.trim().toLowerCase(),
    })
    if (error) {
      if (missing(error.message)) return { kind: 'unavailable' }
      return { kind: 'error', message: 'ساخت لیست انجام نشد' }
    }
    return { kind: 'ok', slug }
  } catch (e) {
    const m = (e as Error).message
    return missing(m) ? { kind: 'unavailable' } : { kind: 'error', message: 'ساخت لیست انجام نشد' }
  }
}

/** هندل صاحب یک لیست — برای بررسی اجازه پیش از نوشتن. */
export async function playlistHandle(slug: string): Promise<{ id: string; handle: string } | null> {
  try {
    const { data } = await sb().from('playlists')
      .select('id,channel_handle').eq('slug', slug).maybeSingle()
    if (!data) return null
    const r = data as Record<string, unknown>
    return { id: str(r.id), handle: str(r.channel_handle) }
  } catch (e) {
    console.error('[media/playlists] handle:', (e as Error).message)
    return null
  }
}

export async function addToPlaylist(playlistId: string, videoId: string): Promise<WriteResult> {
  try {
    /* جای تازه = بعد از آخرین آیتم. بدون این، همه‌ی آیتم‌ها
       `position = 0` می‌گیرند و ترتیب فقط به زمان افزودن می‌افتد. */
    const { data: last } = await sb().from('playlist_items')
      .select('position').eq('playlist_id', playlistId)
      .order('position', { ascending: false }).limit(1).maybeSingle()
    const next = Number((last as { position?: number } | null)?.position ?? -1) + 1

    const { error } = await sb().from('playlist_items')
      .insert({ playlist_id: playlistId, video_id: videoId, position: next })
    if (error) {
      if (missing(error.message)) return { kind: 'unavailable' }
      /* از قبل در لیست است — خطا نیست */
      if (/duplicate key/i.test(error.message)) return { kind: 'ok', slug: '' }
      return { kind: 'error', message: 'افزودن انجام نشد' }
    }
    return { kind: 'ok', slug: '' }
  } catch (e) {
    console.error('[media/playlists] add:', (e as Error).message)
    return { kind: 'error', message: 'افزودن انجام نشد' }
  }
}

export async function removeFromPlaylist(playlistId: string, videoId: string): Promise<boolean> {
  try {
    const { error } = await sb().from('playlist_items')
      .delete().eq('playlist_id', playlistId).eq('video_id', videoId)
    if (error) console.error('[media/playlists] remove:', error.message)
    return !error
  } catch (e) {
    console.error('[media/playlists] remove:', (e as Error).message)
    return false
  }
}

export async function deletePlaylist(playlistId: string): Promise<boolean> {
  try {
    const { error } = await sb().from('playlists').delete().eq('id', playlistId)
    if (error) console.error('[media/playlists] delete:', error.message)
    return !error
  } catch (e) {
    console.error('[media/playlists] delete:', (e as Error).message)
    return false
  }
}
