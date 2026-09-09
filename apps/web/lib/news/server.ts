/* ─────────────────────────────────────────────────────────────
   تحریریه روی سرور — خواندن اخبار و ساختن چیدمان صفحه‌ی اول.

   ⚠️ همه‌چیز این فایل از ردیف‌های واقعی جدول `news` می‌آید. هیچ
   خبر، نویسنده، تاریخ، بازدید یا نشان تحریریه‌ای ساخته نمی‌شود.
   جایی که داده نیست، فیلد اصلا برنمی‌گردد و رابط آن را نمی‌کشد.

   ⚠️ چیدمان صفحه‌ی اول *مشتق* است، نه دستی: خبر صدر، خبرهای دوم،
   جریان آخرین اخبار و بلوک‌های بخش همه از روی همین ردیف‌ها حساب
   می‌شوند. تا وقتی ویراستار چیزی منتشر نکرده، صفحه صادقانه خالی
   می‌ماند.
   ───────────────────────────────────────────────────────────── */

/* ⚠️ این ماژول کلاینت service-role می‌سازد. بدون این گارد، یک
   `import type { Article }` از یک فایل 'use client' کل ماژول را
   به گراف مرورگر می‌کشد. همان الگوی lib/features و lib/home-featured. */
import 'server-only'
import { getSupabaseServer } from '../supabase-server'
import {
  normalizeSection, hasTag, sectionQueryValues,
  TAG_BREAKING, TAG_FEATURE, TAG_EXCLUSIVE,
  NEWS_SECTIONS, type NewsSectionKey,
} from './sections'

export interface Article {
  /** نشانی خبر — نامک اگر باشد، وگرنه شناسه */
  id: string
  title: string
  excerpt: string
  /** پاراگراف‌های متن؛ خالی یعنی متنی ذخیره نشده */
  body: string[]
  section: NewsSectionKey | null
  cover: string
  tags: string[]
  /** لحظه‌ی انتشار (میلی‌ثانیه). صفر یعنی تاریخ معتبری ثبت نشده. */
  ts: number
  /** لحظه‌ی آخرین ویرایش، فقط اگر واقعا بعد از انتشار بوده */
  updatedTs: number | null
  /** شمارش واقعی بازدید؛ صفر یعنی هنوز خوانده نشده */
  views: number
  /** دقیقه — از تعداد واژه‌های همین متن حساب می‌شود */
  readMinutes: number
  /** نام نویسنده اگر در دیتابیس به کاربری وصل شده باشد */
  author: string | null
  breaking: boolean
  feature: boolean
  exclusive: boolean
}

/* ستون‌هایی که واقعا وجود دارند (مهاجرت ۰۲۵). */
const COLS = 'id,slug,title,excerpt,body,cover_url,category,tags,status,'
  + 'author_id,published_at,updated_at,created_at,views'

interface Row {
  id?: unknown; slug?: unknown; title?: unknown; excerpt?: unknown; body?: unknown
  cover_url?: unknown; category?: unknown; tags?: unknown; status?: unknown
  author_id?: unknown; published_at?: unknown; updated_at?: unknown
  created_at?: unknown; views?: unknown
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const ms = (v: unknown) => (str(v) ? Date.parse(str(v)) || 0 : 0)

/* ⚠️ «۲۰۰ واژه در دقیقه» برای فارسی خوش‌بینانه است؛ اندازه‌گیری‌های
   خواندن فارسی نزدیک‌تر به ۱۵۰–۱۸۰ است. ۱۷۰ گرفته شده تا عدد
   نمایش‌داده‌شده کمتر از واقعیت نباشد. */
const WPM = 170

function toArticle(r: Row, authors: Map<string, string>): Article {
  const raw = str(r.body)
  const body = raw ? raw.split(/\n{2,}/).map(s => s.trim()).filter(Boolean) : []
  const words = raw ? raw.split(/\s+/).filter(Boolean).length : 0
  const tags = Array.isArray(r.tags) ? (r.tags as unknown[]).map(t => String(t).trim()).filter(Boolean) : []

  const ts = ms(r.published_at) || ms(r.created_at)
  const up = ms(r.updated_at)
  const aid = str(r.author_id)

  return {
    id: str(r.slug) || str(r.id),
    title: str(r.title),
    excerpt: str(r.excerpt),
    body,
    section: normalizeSection(r.category),
    cover: str(r.cover_url),
    tags,
    ts,
    /* ⚠️ `updated_at` روی *هر* ذخیره‌ای عوض می‌شود، حتی اصلاح یک
       غلط املایی چند ثانیه بعد از انتشار. «به‌روزرسانی شد» فقط وقتی
       معنا دارد که فاصله‌ی معناداری باشد — وگرنه روی هر خبر می‌نشیند
       و بی‌ارزش می‌شود. یک ساعت مرز محافظه‌کارانه‌ای است. */
    updatedTs: up && ts && up - ts > 3_600_000 ? up : null,
    views: Math.max(0, Math.trunc(Number(r.views) || 0)),
    readMinutes: words ? Math.max(1, Math.round(words / WPM)) : 0,
    author: (aid && authors.get(aid)) || null,
    breaking: hasTag(tags, TAG_BREAKING),
    feature: hasTag(tags, TAG_FEATURE),
    exclusive: hasTag(tags, TAG_EXCLUSIVE),
  }
}

/* ── نام نویسنده‌ها ──
   ⚠️ یک پرس‌وجو برای همه، نه یکی به‌ازای هر خبر. اگر `author_id` روی
   هیچ ردیفی ست نشده باشد (که تا امروز همین‌طور است، چون پنل ادمین
   آن را نمی‌نوشت) اصلا پرس‌وجویی نمی‌رود. */
async function authorNames(ids: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(ids.filter(Boolean))]
  if (uniq.length === 0) return new Map()
  try {
    const { data, error } = await getSupabaseServer()
      .from('users').select('id,"firstName","lastName"').in('id', uniq)
    if (error || !data) return new Map()
    const m = new Map<string, string>()
    for (const u of data as Record<string, unknown>[]) {
      const name = [str(u.firstName), str(u.lastName)].filter(Boolean).join(' ')
      if (name) m.set(str(u.id), name)
    }
    return m
  } catch { return new Map() }
}

/* ⚠️ «خالی» و «خطا» یکی نیستند و رابط باید بتواند تفکیکشان کند:
   فهرست خالی برگشتی از یک خطای دیتابیس، روی صفحه به‌شکل «هنوز
   خبری منتشر نشده» دیده می‌شد — یعنی به کاربر دروغ گفته می‌شد. */
export interface NewsResult { ok: boolean; rows: Article[] }

/** اخبار منتشرشده، تازه‌ترین اول. */
export async function listNews(
  { limit = 120, section }: { limit?: number; section?: string | null } = {},
): Promise<NewsResult> {
  try {
    let q = getSupabaseServer()
      .from('news').select(COLS)
      .eq('status', 'published')
    /* ⚠️ فیلتر بخش در خود پرس‌وجو، نه در حافظه: فیلتر حافظه‌ای فقط
       ۱۲۰ ردیف تازه را می‌دید، پس با آرشیو بزرگ‌تر یک بخش کم‌خبر
       (کاروم، گفت‌وگو) «هنوز خبری منتشر نشده» نشان می‌داد در حالی
       که خبرش در دیتابیس بود. نام‌های قدیمی هم باید بیایند. */
    if (section) q = q.in('category', sectionQueryValues(section))
    const { data, error } = await q
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit)
    if (error || !data) {
      if (error) console.error('[news] list:', error.message)
      return { ok: false, rows: [] }
    }
    const rows = data as Row[]
    const authors = await authorNames(rows.map(r => str(r.author_id)))
    return {
      ok: true,
      rows: rows
        .map(r => toArticle(r, authors))
        /* بدون عنوان یا بدون نشانی، کارت فقط یک مستطیل خالی است */
        .filter(a => a.id && a.title)
        .sort((a, b) => b.ts - a.ts),
    }
  } catch (e) {
    console.error('[news] list:', (e as Error).message)
    return { ok: false, rows: [] }
  }
}

/** فقط ردیف‌ها — برای جاهایی که تفاوت خطا و خالی مهم نیست (نقشه‌ی سایت). */
export const listPublished = async (limit = 120): Promise<Article[]> =>
  (await listNews({ limit })).rows

/* ── جست‌وجو ──
   ⚠️ در دیتابیس انجام می‌شود نه روی فهرست صفحه‌ی اول: آن فهرست
   سقف ۱۲۰ ردیف دارد و جست‌وجویی که فقط تازه‌ترین‌ها را ببیند
   جست‌وجو نیست. `%` و `_` و `,` کاربر خنثی می‌شوند وگرنه الگوی
   PostgREST را می‌شکنند. */
export async function searchPublished(q: string, limit = 60): Promise<Article[]> {
  const term = q.trim()
  if (term.length < 2) return []
  const safe = term.replace(/[%_\\]/g, ch => `\\${ch}`).replace(/[(),]/g, ' ')
  const like = `*${safe}*`
  try {
    const { data, error } = await getSupabaseServer()
      .from('news').select(COLS)
      .eq('status', 'published')
      .or(`title.ilike.${like},excerpt.ilike.${like},body.ilike.${like}`)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit)
    if (error || !data) {
      if (error) console.error('[news] search:', error.message)
      return []
    }
    const rows = data as Row[]
    const authors = await authorNames(rows.map(r => str(r.author_id)))
    return rows.map(r => toArticle(r, authors)).filter(a => a.id && a.title)
  } catch { return [] }
}

/** یک خبر با نامک یا شناسه. */
export async function getArticle(idOrSlug: string): Promise<Article | null> {
  const key = idOrSlug.trim()
  if (!key) return null
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)
  try {
    const q = getSupabaseServer().from('news').select(COLS).eq('status', 'published')
    /* ⚠️ فیلتر `id` با مقدار غیرUUID خطای نوع Postgres می‌دهد و کل
       پرس‌وجو را می‌شکند، پس نامک و شناسه دو مسیر جدا دارند. */
    const { data, error } = await (isUuid ? q.eq('id', key) : q.eq('slug', key)).maybeSingle()
    if (error || !data) return null
    const row = data as Row
    const authors = await authorNames([str(row.author_id)])
    const a = toArticle(row, authors)
    return a.title ? a : null
  } catch { return null }
}

/* ═══════════════════ چیدمان تحریریه ═══════════════════ */

export interface SectionBlock {
  key: NewsSectionKey
  label: string
  lead: Article
  rest: Article[]
}

export interface Front {
  /** خبرهای فوری *تازه* — نوار بالای صفحه */
  breaking: Article[]
  /** خبر صدر؛ `null` یعنی هنوز چیزی منتشر نشده */
  lead: Article | null
  /** دو تا سه خبر کنار صدر */
  secondary: Article[]
  /** مهم‌ترین خبرها — انتخاب تحریریه، نه تکرار جریان زمانی */
  top: Article[]
  /** جریان زمانی */
  latest: Article[]
  /** پربازدیدترین‌ها — فقط وقتی شمارش واقعی وجود دارد */
  mostRead: Article[]
  /** گزارش ویژه */
  feature: Article | null
  /** گفت‌وگوها */
  interviews: Article[]
  /** بلوک‌های بخش */
  sections: SectionBlock[]
  total: number
}

/* ⚠️ برچسب «فوری» تاریخ انقضا ندارد و ویراستار معمولا برنمی‌گردد
   برش دارد. نوار فوری که سه هفته یک خبر را «فوری» نشان بدهد اعتبار
   بقیه‌ی صفحه را هم می‌برد. ۴۸ ساعت. */
const BREAKING_WINDOW_MS = 48 * 3_600_000

export function buildFront(all: Article[], now = Date.now()): Front {
  const breaking = all.filter(a => a.breaking && a.ts && now - a.ts < BREAKING_WINDOW_MS).slice(0, 3)

  /* ── صدر ──
     ⚠️ تازه‌ترین خبر، نه خبر برچسب‌خورده‌ی «ویژه». نسخه‌ی اول این
     تابع «ویژه» را صدر می‌کرد و نتیجه‌اش این بود که با یک خبر
     ویژه، **بلوک «گزارش ویژه» هرگز رندر نمی‌شد** — چون تنها
     نامزدش رفته بود بالای صفحه. حالا دو نقش جدا: زمان انتشار
     صدر را تعیین می‌کند و برچسب «ویژه» بلوک گزارش را. */
  const lead = all[0] ?? null

  const used = new Set<string>()
  if (lead) used.add(lead.id)

  /* ⚠️ چهار تا، نه سه. اندازه‌گیری در ۱۴۴۰: ستون ریل ۱۳۰۳ پیکسل
     می‌شد و ستون صدر ~۶۵۰، یعنی حدود ۶۰۰ پیکسل سفیدی آویزان زیر
     خبر اول. چهار خبر دوم به‌علاوه‌ی ریل کوتاه‌تر، سه ستون را
     تقریبا هم‌قد می‌کند. */
  const secondary = all.filter(a => !used.has(a.id)).slice(0, 4)
  for (const a of secondary) used.add(a.id)

  /* ── مهم‌ترین خبرها ──
     ⚠️ نباید کپی «آخرین اخبار» باشد. قاعده: از هر بخش تازه‌ترین خبر،
     تا صفحه چند رشته‌ی متفاوت را کنار هم نشان بدهد نه پنج خبر پشت
     هم از یک تورنمنت. این یک قاعده‌ی واقعی روی داده‌ی واقعی است، نه
     یک فهرست دست‌چین ساختگی. */
  const seenSection = new Set<string>()
  const top: Article[] = []
  for (const a of all) {
    if (used.has(a.id)) continue
    const k = a.section ?? '—'
    if (seenSection.has(k)) continue
    seenSection.add(k)
    top.push(a)
    if (top.length === 5) break
  }
  for (const a of top) used.add(a.id)

  /* هشت تا — همان دلیل بالا. ریل دوازده‌تایی از هر دو ستون
     دیگر بلندتر می‌شد. */
  const latest = all.slice(0, 8)

  /* ⚠️ فقط خبرهایی که واقعا خوانده شده‌اند. اگر شمارنده هنوز صفر است
     (تازه راه افتاده)، این بخش اصلا رندر نمی‌شود — «پربازدیدترین» با
     عدد صفر یعنی دروغ. */
  const mostRead = all.filter(a => a.views > 0)
    .sort((a, b) => b.views - a.views).slice(0, 5)

  /* گزارش ویژه: خبر برچسب‌خورده‌ی «ویژه» که واقعا متن بلند دارد. */
  const feature = all.find(a =>
    a.feature && a.id !== lead?.id && a.body.length >= 3 && a.cover) ?? null
  if (feature) used.add(feature.id)

  const interviews = all.filter(a => a.section === 'interview').slice(0, 4)

  /* بلوک‌های بخش — فقط بخش‌هایی که دست‌کم دو خبر دارند. یک بخش با
     یک خبر، بلوکی با یک کارت تنها می‌سازد که بدتر از نبودنش است. */
  const sections: SectionBlock[] = []
  for (const s of NEWS_SECTIONS) {
    const items = all.filter(a => a.section === s.key)
    if (items.length < 2) continue
    const [first, ...rest] = items
    if (!first) continue
    sections.push({ key: s.key, label: s.label, lead: first, rest: rest.slice(0, 4) })
  }

  return {
    breaking, lead, secondary, top, latest, mostRead,
    feature, interviews, sections, total: all.length,
  }
}

/** خبرهای مرتبط — اول هم‌بخش، بعد تازه‌ترین‌های دیگر. */
export function related(a: Article, all: Article[], count = 4): Article[] {
  const same = all.filter(x => x.id !== a.id && x.section && x.section === a.section)
  const rest = all.filter(x => x.id !== a.id && x.section !== a.section)
  return [...same, ...rest].slice(0, count)
}

export { sectionOf, sectionLabel } from './sections'
