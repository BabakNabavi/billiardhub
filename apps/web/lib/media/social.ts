import 'server-only'
import { getSupabaseServer } from '../supabase-server'

/* ─────────────────────────────────────────────────────────────
   لایه‌ی اجتماعیِ بیلیارد مدیا — اشتراک، پسند، دیدگاه.

   ⚠️ همه‌ی توابع «جدول نیست» را از «خطا» جدا می‌کنند. مهاجرتِ ۰۹۲
   دستی روی سرور اجرا می‌شود و ممکن است کد پیش از آن دیپلوی شود؛
   در آن پنجره صفحه نباید بشکند، فقط باید این بخش‌ها را نشان ندهد.
   همان الگوی `lib/profiles/server`.

   ⚠️ هیچ عددی این‌جا ساخته نمی‌شود. اگر جدول نباشد، پاسخ
   `available: false` است و رابط دکمه را اصلاً رندر نمی‌کند — نه
   اینکه صفرِ ساختگی نشان بدهد.
   ───────────────────────────────────────────────────────────── */

const sb = () => getSupabaseServer()
const missing = (msg?: string) => /does not exist|schema cache/i.test(msg ?? '')

export interface Availability { available: boolean }

/* ═══════════════ اشتراکِ کانال ═══════════════ */

export interface SubState extends Availability {
  subscribers: number
  subscribed: boolean
}

export async function channelSubState(handle: string, userId?: string): Promise<SubState> {
  const h = handle.trim().toLowerCase()
  if (!h) return { available: true, subscribers: 0, subscribed: false }
  try {
    const { count, error } = await sb()
      .from('channel_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('channel_handle', h)
    if (error) {
      if (missing(error.message)) return { available: false, subscribers: 0, subscribed: false }
      throw new Error(error.message)
    }
    /* ⚠️ نبودِ جدول همیشه `error` نمی‌دهد: در آزمونِ واقعی روی سروری
       که مهاجرتِ ۰۹۲ اجرا نشده بود، پاسخ بدونِ خطا ولی با `count`ِ
       null برگشت — و رابط دکمه‌ای نشان می‌داد که نوشتنش ۵۰۳ می‌گرفت،
       دقیقاً همان دکمه‌ی بی‌کارکردی که این کار آمده حذفش کند.
       پس «عددِ واقعی نگرفتم» یعنی «در دسترس نیست». */
    if (typeof count !== 'number') return { available: false, subscribers: 0, subscribed: false }
    let subscribed = false
    if (userId) {
      const { data } = await sb().from('channel_subscriptions')
        .select('id').eq('channel_handle', h).eq('user_id', userId).maybeSingle()
      subscribed = Boolean(data)
    }
    return { available: true, subscribers: count ?? 0, subscribed }
  } catch (e) {
    console.error('[media/social] subState:', (e as Error).message)
    return { available: false, subscribers: 0, subscribed: false }
  }
}

/* ⚠️ «جدول نیست» و «خطا خورد» دو چیزند و رابط باید تفکیکشان کند:
   نسخه‌ی اول هر دو را `null` می‌کرد و مسیر ۵۰۳ «این قابلیت هنوز
   فعال نیست» می‌داد — یعنی یک خطای گذرای شبکه به کاربر می‌گفت
   قابلیت وجود ندارد. */
export type ToggleResult<T> =
  | { kind: 'ok'; state: T }
  | { kind: 'unavailable' }
  | { kind: 'error' }

export async function toggleSubscription(
  handle: string, userId: string,
): Promise<ToggleResult<SubState>> {
  const h = handle.trim().toLowerCase()
  if (!h || !userId) return { kind: 'error' }
  try {
    const { data } = await sb().from('channel_subscriptions')
      .select('id').eq('channel_handle', h).eq('user_id', userId).maybeSingle()
    if (data) {
      const { error } = await sb().from('channel_subscriptions')
        .delete().eq('id', (data as { id: string }).id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await sb().from('channel_subscriptions')
        .insert({ channel_handle: h, user_id: userId })
      /* ⚠️ برخوردِ کلیدِ یکتا یعنی دو تبِ هم‌زمان؛ خطا نیست. */
      if (error && !/duplicate key/i.test(error.message)) throw new Error(error.message)
    }
    const st = await channelSubState(h, userId)
    return st.available ? { kind: 'ok', state: st } : { kind: 'unavailable' }
  } catch (e) {
    const msg = (e as Error).message
    console.error('[media/social] toggleSub:', msg)
    return missing(msg) ? { kind: 'unavailable' } : { kind: 'error' }
  }
}


/* ═══════════════ پسند ═══════════════ */

export interface LikeState extends Availability {
  likes: number
  liked: boolean
}

export async function likeState(videoId: string, userId?: string): Promise<LikeState> {
  try {
    const { count, error } = await sb().from('video_likes')
      .select('id', { count: 'exact', head: true }).eq('video_id', videoId)
    if (error) {
      if (missing(error.message)) return { available: false, likes: 0, liked: false }
      throw new Error(error.message)
    }
    /* همان دلیلِ بالا */
    if (typeof count !== 'number') return { available: false, likes: 0, liked: false }
    let liked = false
    if (userId) {
      const { data } = await sb().from('video_likes')
        .select('id').eq('video_id', videoId).eq('user_id', userId).maybeSingle()
      liked = Boolean(data)
    }
    return { available: true, likes: count ?? 0, liked }
  } catch (e) {
    console.error('[media/social] likeState:', (e as Error).message)
    return { available: false, likes: 0, liked: false }
  }
}

export async function toggleLike(
  videoId: string, userId: string,
): Promise<ToggleResult<LikeState>> {
  if (!videoId || !userId) return { kind: 'error' }
  try {
    const { data } = await sb().from('video_likes')
      .select('id').eq('video_id', videoId).eq('user_id', userId).maybeSingle()
    if (data) {
      const { error } = await sb().from('video_likes').delete().eq('id', (data as { id: string }).id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await sb().from('video_likes').insert({ video_id: videoId, user_id: userId })
      if (error && !/duplicate key/i.test(error.message)) throw new Error(error.message)
    }
    const st = await likeState(videoId, userId)
    return st.available ? { kind: 'ok', state: st } : { kind: 'unavailable' }
  } catch (e) {
    const msg = (e as Error).message
    console.error('[media/social] toggleLike:', msg)
    return missing(msg) ? { kind: 'unavailable' } : { kind: 'error' }
  }
}

/* ═══════════════ دیدگاه ═══════════════ */

export interface CommentRow {
  id: string
  body: string
  authorName: string
  authorId: string
  parentId: string | null
  pinned: boolean
  createdAt: string
  /** پاسخ‌ها — یک سطح عمق */
  replies?: CommentRow[]
}

export interface CommentPage extends Availability {
  items: CommentRow[]
  total: number
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/* نامِ نویسنده‌ها با یک پرس‌وجو، نه یکی به‌ازای هر دیدگاه */
async function names(ids: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(ids.filter(Boolean))]
  if (uniq.length === 0) return new Map()
  try {
    const { data } = await sb().from('users').select('id,"firstName","lastName"').in('id', uniq)
    const m = new Map<string, string>()
    for (const u of (data ?? []) as Record<string, unknown>[]) {
      const n = [str(u.firstName), str(u.lastName)].filter(Boolean).join(' ')
      m.set(str(u.id), n || 'کاربر بیلیارد هاب')
    }
    return m
  } catch { return new Map() }
}

export async function listComments(videoId: string, limit = 50): Promise<CommentPage> {
  try {
    const { data, error, count } = await sb().from('video_comments')
      .select('id,user_id,parent_id,body,is_pinned,created_at', { count: 'exact' })
      .eq('video_id', videoId).eq('is_hidden', false)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) {
      if (missing(error.message)) return { available: false, items: [], total: 0 }
      throw new Error(error.message)
    }
    /* همان دلیلِ بالا */
    if (!data || typeof count !== 'number') return { available: false, items: [], total: 0 }
    const rows = (data ?? []) as Record<string, unknown>[]
    const who = await names(rows.map(r => str(r.user_id)))
    const all: CommentRow[] = rows.map(r => ({
      id: str(r.id),
      body: str(r.body),
      authorId: str(r.user_id),
      authorName: who.get(str(r.user_id)) ?? 'کاربر بیلیارد هاب',
      parentId: str(r.parent_id) || null,
      pinned: r.is_pinned === true,
      createdAt: str(r.created_at),
    }))
    /* یک سطح تودرتو — پاسخ زیرِ دیدگاهِ خودش */
    const top = all.filter(c => !c.parentId)
    const byParent = new Map<string, CommentRow[]>()
    for (const c of all) {
      if (!c.parentId) continue
      const arr = byParent.get(c.parentId) ?? []
      arr.push(c); byParent.set(c.parentId, arr)
    }
    for (const c of top) {
      const kids = byParent.get(c.id)
      /* پاسخ‌ها از قدیم به جدید خوانده می‌شوند، برعکسِ فهرستِ اصلی */
      if (kids) c.replies = kids.reverse()
    }
    return { available: true, items: top, total: count ?? all.length }
  } catch (e) {
    console.error('[media/social] comments:', (e as Error).message)
    return { available: false, items: [], total: 0 }
  }
}

export async function addComment(
  videoId: string, userId: string, body: string, parentId?: string,
): Promise<CommentRow | null> {
  const text = body.trim().slice(0, 2000)
  if (!videoId || !userId || !text) return null
  try {
    /* ⚠️ کلیدِ خارجی فقط ثابت می‌کند والد *وجود دارد*، نه اینکه
       والدِ درستی است. بدونِ این بررسی می‌شد پاسخی به دیدگاهِ
       ویدیوی دیگر یا پاسخ‌به‌پاسخ ثبت کرد؛ هر دو ذخیره می‌شدند،
       در شمارش می‌آمدند، و هیچ‌جا رندر نمی‌شدند چون نمایش فقط یک
       سطح تودرتو دارد. */
    if (parentId) {
      const { data: p } = await sb().from('video_comments')
        .select('video_id,parent_id').eq('id', parentId).maybeSingle()
      const par = p as { video_id?: string; parent_id?: string | null } | null
      if (!par || par.video_id !== videoId || par.parent_id) return null
    }
    const { data, error } = await sb().from('video_comments')
      .insert({ video_id: videoId, user_id: userId, body: text, parent_id: parentId || null })
      .select('id,user_id,parent_id,body,is_pinned,created_at').single()
    if (error || !data) return null
    const r = data as Record<string, unknown>
    const who = await names([userId])
    return {
      id: str(r.id), body: str(r.body), authorId: userId,
      authorName: who.get(userId) ?? 'کاربر بیلیارد هاب',
      parentId: str(r.parent_id) || null,
      pinned: false, createdAt: str(r.created_at),
    }
  } catch (e) {
    console.error('[media/social] addComment:', (e as Error).message)
    return null
  }
}

/** یک دیدگاه با شناسه — برای بررسیِ اجازه، بدونِ خواندنِ کلِ رشته.
 *
 *  ⚠️ نسخه‌ی اول برای تصمیمِ حذف، ۲۰۰ دیدگاهِ اول را می‌خواند و
 *  بینشان می‌گشت. روی ویدیویی با بیش از ۲۰۰ دیدگاه، نویسنده‌ی
 *  واقعی ۴۰۴ می‌گرفت و هرگز نمی‌توانست دیدگاهِ خودش را پاک کند. */
export async function commentOwner(
  id: string,
): Promise<{ userId: string; videoId: string } | null> {
  try {
    const { data } = await sb().from('video_comments')
      .select('user_id,video_id').eq('id', id).maybeSingle()
    if (!data) return null
    const r = data as { user_id?: string; video_id?: string }
    return { userId: str(r.user_id), videoId: str(r.video_id) }
  } catch { return null }
}

/** حذف — فقط نویسنده‌ی دیدگاه یا صاحبِ ویدیو. تصمیمِ مجوز بیرون گرفته می‌شود. */
export async function deleteComment(id: string): Promise<boolean> {
  try {
    const { error } = await sb().from('video_comments').delete().eq('id', id)
    return !error
  } catch { return false }
}

/** صاحبِ ویدیو کیست؟ — برای اجازه‌ی حذف و سنجاق */
export async function videoOwner(videoId: string): Promise<{ ownerId: string | null; handle: string } | null> {
  try {
    const { data } = await sb().from('videos')
      .select('owner_id,creator_handle').eq('id', videoId).maybeSingle()
    if (!data) return null
    const r = data as Record<string, unknown>
    return { ownerId: str(r.owner_id) || null, handle: str(r.creator_handle) }
  } catch { return null }
}

/** شناسه‌ی ویدیو از روی نامک — مسیرهای عمومی با نامک کار می‌کنند.
 *
 *  ⚠️ `visibility` هم باید بررسی شود، نه فقط `status`. صفحه‌ی
 *  ویدیوی خصوصی ۴۰۴ می‌دهد (`getPublicBySlug`) ولی این تابع آن را
 *  پیدا می‌کرد — یعنی هرکس نامک را داشت می‌توانست دیدگاه‌هایش را
 *  بخواند و رویش پسند و دیدگاه ثبت کند. */
export async function videoIdBySlug(slug: string): Promise<string | null> {
  try {
    const { data } = await sb().from('videos')
      .select('id').eq('slug', slug)
      .eq('status', 'published').neq('visibility', 'private')
      .maybeSingle()
    return (data as { id?: string } | null)?.id ?? null
  } catch { return null }
}
