import { getSupabaseServer } from '../supabase-server'

/* ─────────────────────────────────────────────────────────────
   بیلیارد مدیا — لایه‌ی داده.

   متادیتا در جدولِ `videos` است (مهاجرتِ ۰۴۸)؛ خودِ فایل در Storage.
   پیش‌تر همه‌چیز در یک فایلِ JSON بود که هر خواندن کلش را می‌آورد و
   هر نوشتن کلش را بازمی‌نوشت — یعنی دو آپلودِ هم‌زمان یکی را گم
   می‌کرد و صفحه‌بندی/جست‌وجو در حافظه انجام می‌شد.
   ───────────────────────────────────────────────────────────── */

export type VideoStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'hidden'
export type VideoVisibility = 'public' | 'unlisted' | 'private'

export interface VideoRow {
  id: string
  slug: string
  title: string
  description: string
  category: string
  tags: string[]
  owner_id: string | null
  creator_name: string
  creator_handle: string
  club_id: string | null
  src: string
  thumb: string
  duration_sec: number | null
  width: number | null
  height: number | null
  mime: string | null
  size_bytes: number | null
  status: VideoStatus
  visibility: VideoVisibility
  featured: boolean
  reject_note: string | null
  views: number
  created_at: string
  updated_at: string
  published_at: string | null
}

/** شکلی که به مرورگر می‌رود — بدونِ شناسه‌ی مالک و یادداشتِ داخلی. */
export interface PublicVideo {
  slug: string
  title: string
  description: string
  category: string
  tags: string[]
  creatorName: string
  creatorHandle: string
  clubId: string | null
  src: string
  thumb: string
  durationSec: number | null
  width: number | null
  height: number | null
  views: number
  publishedAt: string | null
  featured: boolean
}

export function toPublic(r: VideoRow): PublicVideo {
  return {
    slug: r.slug, title: r.title, description: r.description,
    category: r.category, tags: r.tags ?? [],
    creatorName: r.creator_name, creatorHandle: r.creator_handle,
    clubId: r.club_id, src: r.src, thumb: r.thumb,
    durationSec: r.duration_sec, width: r.width, height: r.height,
    views: r.views, publishedAt: r.published_at, featured: r.featured,
  }
}

/* ── نشانیِ عمومی ─────────────────────────────────────────────

   از عنوان ساخته می‌شود تا هم برای آدم خوانا باشد هم برای موتورِ
   جست‌وجو معنا داشته باشد. حروفِ فارسی در URL مجازند و مرورگر
   خودش نمایششان می‌دهد؛ فقط نویسه‌هایی که در مسیر معنا دارند
   (`/`, `?`, `#`, فاصله) حذف می‌شوند.

   دنباله‌ی کوتاهِ تصادفی همیشه اضافه می‌شود، نه فقط هنگامِ برخورد:
   بدونِ آن، دو ویدیو با عنوانِ یکسان به یک slug می‌رسند و دومی باید
   در یک حلقه‌ی تلاش‌ودوباره ساخته شود — که زیرِ بار مسابقه می‌دهد. */
export function makeSlug(title: string): string {
  const base = String(title ?? '')
    .trim()
    .toLowerCase()
    .replace(/[‌‏‎]/g, '')          // نویسه‌های نامرئیِ فارسی
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/, '')
  const rand = Math.random().toString(36).slice(2, 7)
  return base ? `${base}-${rand}` : `video-${rand}`
}

const sb = () => getSupabaseServer()

/* ستون‌هایی که فهرستِ عمومی لازم دارد. `description` عمداً نیست:
   در کارت نمایش داده نمی‌شود و آوردنش یعنی کشیدنِ متنِ بلند برای
   بیست کارت. صفحه‌ی تماشا خودش کاملش را می‌گیرد. */
const LIST_COLS =
  'slug,title,category,tags,creator_name,creator_handle,club_id,thumb,src,' +
  'duration_sec,width,height,views,published_at,featured'

export interface ListOpts {
  category?: string
  q?: string
  handle?: string
  clubId?: string
  sort?: 'recent' | 'popular'
  limit?: number
  /** مکان‌نمای صفحه‌بندی — `published_at` آخرین ردیفِ صفحه‌ی قبل */
  before?: string
  featuredOnly?: boolean
}

/**
 * فهرستِ ویدیوهای منتشرشده‌ی عمومی.
 *
 * صفحه‌بندی مکان‌نمایی است، نه offset: با `offset` هرچه جلوتر بروی
 * دیتابیس باید همان تعداد ردیف را بشمارد و دور بیندازد، و اگر بینِ
 * دو صفحه ویدیوی تازه‌ای منتشر شود ردیف‌ها جابه‌جا می‌شوند.
 */
export async function listPublic(o: ListOpts = {}): Promise<{ items: PublicVideo[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(Number(o.limit) || 24, 1), 48)

  let q = sb().from('videos').select(LIST_COLS)
    .eq('status', 'published')
    .eq('visibility', 'public')

  if (o.category && o.category !== 'all') q = q.eq('category', o.category)
  if (o.handle) q = q.eq('creator_handle', o.handle)
  if (o.clubId) q = q.eq('club_id', o.clubId)
  if (o.featuredOnly) q = q.eq('featured', true)

  if (o.q) {
    /* جست‌وجوی ساده و امن: عنوان یا توضیح. `%` و `,` در ورودی
       می‌توانند الگو را بشکنند، پس پاک می‌شوند. */
    const term = o.q.replace(/[%,()\\]/g, ' ').trim().slice(0, 80)
    if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
  }

  if (o.sort === 'popular') {
    q = q.order('views', { ascending: false }).order('published_at', { ascending: false })
  } else {
    q = q.order('published_at', { ascending: false, nullsFirst: false })
    if (o.before) q = q.lt('published_at', o.before)
  }

  /* یکی بیشتر می‌گیریم تا بدانیم صفحه‌ی بعدی هست یا نه — بدونِ
     شمردنِ کلِ جدول. */
  const { data, error } = await q.limit(limit + 1)
  if (error) { console.error('[media] list:', error.message); return { items: [], nextCursor: null } }

  const rows = (data ?? []) as unknown as VideoRow[]
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const last = page[page.length - 1]
  return {
    items: page.map(toPublic),
    nextCursor: hasMore && o.sort !== 'popular' ? (last?.published_at ?? null) : null,
  }
}

/** یک ویدیو با نشانی‌اش. `null` یعنی نیست یا عمومی نیست. */
export async function getPublicBySlug(slug: string): Promise<VideoRow | null> {
  const { data } = await sb().from('videos').select('*').eq('slug', slug).maybeSingle()
  const row = data as VideoRow | null
  if (!row) return null
  /* `unlisted` با داشتنِ نشانی باز می‌شود ولی در فهرست و sitemap نیست */
  if (row.status !== 'published' || row.visibility === 'private') return null
  return row
}

/** نشانیِ قدیمی → شناسه، برای ریدایرکت */
export async function slugRedirect(oldSlug: string): Promise<string | null> {
  const { data } = await sb().from('video_slug_history')
    .select('video_id').eq('slug', oldSlug).maybeSingle()
  const id = (data as { video_id?: string } | null)?.video_id
  if (!id) return null
  const { data: v } = await sb().from('videos').select('slug').eq('id', id).maybeSingle()
  return (v as { slug?: string } | null)?.slug ?? null
}

/** ویدیوهای مرتبط — هم‌دسته، به‌جز خودش. */
export async function relatedTo(row: VideoRow, count = 8): Promise<PublicVideo[]> {
  const { data } = await sb().from('videos').select(LIST_COLS)
    .eq('status', 'published').eq('visibility', 'public')
    .eq('category', row.category)
    .neq('slug', row.slug)
    .order('views', { ascending: false })
    .limit(count)
  return ((data ?? []) as unknown as VideoRow[]).map(toPublic)
}

/** دسته‌هایی که واقعاً ویدیوی منتشرشده دارند. */
export async function activeCategories(): Promise<Record<string, number>> {
  const { data } = await sb().from('videos').select('category')
    .eq('status', 'published').eq('visibility', 'public')
  const out: Record<string, number> = {}
  for (const r of (data ?? []) as { category: string }[]) out[r.category] = (out[r.category] ?? 0) + 1
  return out
}
