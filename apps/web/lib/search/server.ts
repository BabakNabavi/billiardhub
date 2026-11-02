import 'server-only'

/* ─────────────────────────────────────────────────────────────
   جست‌وجوی سراسریِ سایت — یک تابع برای صفحه‌ی `/search`.

   ⚠️ هر گروه دقیقاً همان شرطِ «عمومی بودن»ِ فهرستِ خودش را دارد، نه
   شرطِ تازه‌ای که این‌جا ساخته شود — جست‌وجو نباید چیزی را نشان دهد که
   فهرستِ همان بخش پنهان کرده:
     · باشگاه: `isActive` و تأییدشده (مثلِ `/api/clubs`)
     · پروفایل‌ها: `status = approved` (مثلِ `listProfiles`)
     · مسابقه: `PUBLIC_STATUSES` (پیش‌نویس و لغوشده نه)
     · آگهی: فعال و منقضی‌نشده (`notExpiredOr` — `lib/market/live`)
     · خبر: `searchPublished`ِ خودِ بخشِ اخبار
     · ویدیو: `listPublic`ِ خودِ بیلیارد مدیا

   ⚠️ مسابقه‌ها مستقیم خوانده می‌شوند نه با `listPublicTournaments`: آن
   تابع پیش از خواندن ثبت‌نام‌ها را خودکار باز و بسته می‌کند (نوشتن).

   ── هزینه روی VPS ──
   باشگاه‌ها، پروفایل‌ها و مسابقه‌ها به عبارت بستگی ندارند: یک‌بار در
   دقیقه خوانده و کش می‌شوند (فقط ستون‌های لازم)، و فیلتر روی همان. پس هر
   جست‌وجو فقط سه پرس‌وجوی کوچک می‌زند (آگهی، خبر، ویدیو).

   خطای یک گروه کلِ نتیجه را نمی‌شکند: آن گروه `failed` می‌شود و صفحه
   می‌گوید کدام بخش جواب نداد.
   ───────────────────────────────────────────────────────────── */

import { unstable_cache } from 'next/cache'
import { getSupabaseServer } from '../supabase-server'
import { notExpiredOr } from '../market/live'
import { faIlikeOr } from '../media/search-term'
import { searchPublished } from '../news/server'
import { listPublic } from '../media/server'
import { PUBLIC_STATUSES } from '../tournaments/server'
import { haystackOf, longestToken, matchesAll, scoreOf, tokensOf } from './match'
import { profileHit, type ProfileSearchRow } from './profile-hit'
import { categoryPlayersOf, mergeIntoEmpty, type RankingsStructure } from '../rankings-store'
import { faNum } from '../jalali'
import type { GroupKey, SearchGroup, SearchHit, SuggestHit } from './types'

const PER_GROUP = 12
const sb = () => getSupabaseServer()

type Scored = SearchHit & { s: number }
/** `limit`: سقفِ واکشیِ پیش‌فیلتر — اگر پر شد، شمارش «+» می‌گیرد */
/* `capped` صریح وقتی منبع خودش دقیق می‌داند (ویدیو: `nextCursor`) */
type Found = { rows: Scored[]; limit?: number; fetched?: number; capped?: boolean }

/* ── منابعِ ثابت (کش‌شده) ── */

const loadClubs = unstable_cache(async () => {
  const { data, error } = await sb().from('clubs')
    .select('id,slug,name,city,province,address,logo,images,verificationStatus')
    .eq('isActive', true).or('verificationStatus.in.(verified,approved),is_demo.eq.true')
    .order('createdAt', { ascending: false }).limit(500)
  if (error) throw new Error(error.message)
  return (data ?? []).map(c => ({
    hay: haystackOf(c.name, c.city, c.province, c.address),
    hit: {
      href: `/clubs/${c.slug || c.id}`, title: String(c.name ?? ''),
      sub: [c.city, c.address].filter(Boolean).join('، '),
      image: c.logo || (Array.isArray(c.images) ? c.images[0] : null) || null,
      verified: c.verificationStatus === 'verified',
    } satisfies SearchHit,
  }))
}, ['search:clubs'], { revalidate: 60 })

const loadPeople = unstable_cache(async () => {
  /* فقط فیلدهای نام و شهر و تصویر — نه کلِ `data` با گالری و آلبوم */
  const { data, error } = await sb().from('profiles').select([
    'slug', 'kind', 'verified',
    'fn:data->>firstNameFa', 'ln:data->>lastNameFa', 'fnEn:data->>firstNameEn', 'lnEn:data->>lastNameEn',
    'name:data->>name', 'nameEn:data->>nameEn', 'title:data->>title', 'brand:data->>brand',
    'city:data->>city', 'photo:data->>photo', 'logo:data->>logo',
  ].join(',')).eq('status', 'approved').order('updated_at', { ascending: false }).limit(1000)
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as ProfileSearchRow[])
    .map(profileHit)
    .filter((h): h is NonNullable<typeof h> => h !== null)
}, ['search:people'], { revalidate: 60 })

const loadTournaments = unstable_cache(async () => {
  const { data, error } = await sb().from('tournaments')
    .select('id,title,description,venue,city,cover_url')
    /* تازه‌ترین اول: با سقفِ ۳۰۰، اگر روزی بیشتر شد، کهنه‌ها کنار بروند نه پیشِ‌رو */
    .in('status', PUBLIC_STATUSES).order('starts_at', { ascending: false, nullsFirst: false }).limit(300)
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => ({
    hay: haystackOf(r.title, r.venue, r.city, r.description),
    hit: { href: `/tournaments/${r.id}`, title: String(r.title ?? ''), sub: [r.venue, r.city].filter(Boolean).join('، '), image: r.cover_url } satisfies SearchHit,
  }))
}, ['search:tournaments'], { revalidate: 60 })

/* رنکینگ: بازیکن‌ها در جدولِ `rankings_board`اند نه در `profiles` — ۴۵۱ نفرِ
   دسته‌یک هیچ پروفایلی ندارند. از همان `mergeIntoEmpty`ِ صفحه رد می‌شود تا
   ردیفی که صفحه نشان نمی‌دهد (بیرون از ظرفیت) این‌جا هم نیاید. */
const SPORT_FA: Record<string, string> = { snooker: 'اسنوکر', pocket: 'پاکت بیلیارد' }
const loadRankings = unstable_cache(async () => {
  const { data, error } = await sb().from('app_settings').select('value').eq('key', 'rankings_board').maybeSingle()
  if (error) throw new Error(error.message)
  const board = mergeIntoEmpty((data?.value ?? null) as RankingsStructure | null)
  const out: { hay: string; hit: SearchHit }[] = []
  for (const [sport, genders] of Object.entries(board)) {
    for (const [gender, cats] of Object.entries(genders)) {
      for (const cat of Object.keys(cats)) {
        for (const p of categoryPlayersOf(board, sport, gender, cat)) {
          /* نام هم می‌رود: صفحه با نام پیدا می‌کند — رتبه‌ی این کش ممکن است کهنه باشد */
          const q = new URLSearchParams({ sport, gender, cat, name: p.name.trim(), rank: String(p.rank) })
          out.push({
            hay: haystackOf(p.name, p.city),
            hit: {
              href: `/ranking?${q}`, title: p.name.trim(), rank: p.rank,
              sub: [`${SPORT_FA[sport] ?? sport} ${gender} · ${cat}`, `رتبه ${faNum(p.rank)}`, `${faNum(p.points)} امتیاز`, p.city].filter(Boolean).join(' · '),
            },
          })
        }
      }
    }
  }
  return out
}, ['search:rankings'], { revalidate: 60 })

const fromCorpus = (rows: { hay: string; hit: SearchHit }[], t: string[]): Found => ({
  rows: rows.filter(r => matchesAll(r.hay, t)).map(r => ({ ...r.hit, s: scoreOf(r.hit.title, t) })),
})

/* ── منابعِ وابسته به عبارت ── */

const MARKET_LIMIT = 60
async function market(t: string[]): Promise<Found> {
  /* ⚠️ دو شرطِ «یا» در یک `and(...)` صریح، نه دو `.or()`ِ پشتِ‌هم — رفتارِ
     دو پارامترِ هم‌نامِ `or=` در PostgREST مستند نیست. */
  const { data, error } = await sb().from('products')
    .select('id,title,brand,model,category,city,images')
    .eq('status', 'active')
    .or(`and(or(${notExpiredOr()}),or(${faIlikeOr(['title', 'brand', 'model', 'category'], longestToken(t))}))`)
    .order('createdAt', { ascending: false }).limit(MARKET_LIMIT)
  if (error) throw new Error(error.message)
  const rows = (data ?? [])
    .filter(p => matchesAll(haystackOf(p.title, p.brand, p.model, p.category, p.city), t))
    .map(p => ({ href: `/shop/${p.id}`, title: p.title, sub: [p.brand, p.city].filter(Boolean).join('، '), image: Array.isArray(p.images) ? p.images[0] : null, s: scoreOf(p.title, t) }))
  return { rows, limit: MARKET_LIMIT, fetched: (data ?? []).length }
}

const NEWS_LIMIT = 40
async function news(t: string[]): Promise<Found> {
  const list = await searchPublished(longestToken(t), NEWS_LIMIT, { throwOnError: true })
  /* متنِ خبر هم — پیش‌فیلترِ دیتابیس بدنه را هم می‌گردد */
  const rows = list
    .filter(a => matchesAll(haystackOf(a.title, a.excerpt, a.tags.join(' '), a.body.join(' ')), t))
    .map(a => ({ href: `/news/${a.id}`, title: a.title, sub: a.excerpt, image: a.cover || null, s: scoreOf(a.title, t) }))
  return { rows, limit: NEWS_LIMIT, fetched: list.length }
}

const VIDEOS_LIMIT = 24
async function videos(t: string[]): Promise<Found> {
  const { items, nextCursor } = await listPublic({ q: longestToken(t), limit: VIDEOS_LIMIT, throwOnError: true })
  const rows = items
    .filter(v => matchesAll(haystackOf(v.title, v.description, v.tags.join(' '), v.creatorName), t))
    .map(v => ({ href: `/media/${encodeURIComponent(v.slug)}`, title: v.title, sub: v.creatorName, image: v.thumb || null, s: scoreOf(v.title, t) }))
  /* `listPublic` یکی بیشتر می‌گیرد، پس `nextCursor` دقیقاً می‌گوید بیشتر هست یا نه */
  return { rows, capped: nextCursor !== null }
}

const SOURCES: [GroupKey, (t: string[]) => Promise<Found>][] = [
  ['clubs', async t => fromCorpus(await loadClubs(), t)],
  ['people', async t => fromCorpus(await loadPeople(), t)],
  ['rankings', async t => fromCorpus(await loadRankings(), t)],
  ['tournaments', async t => fromCorpus(await loadTournaments(), t)],
  ['market', market], ['news', news], ['videos', videos],
]

/* پیشنهادِ زنده فقط از منابعِ کش‌شده: هر کلید در نوار یک درخواست است و
   آگهی/خبر/ویدیو هرکدام پرس‌وجوی دیتابیس می‌زدند. همه‌ی گروه‌ها در صفحه‌ی
   `/search` (با Enter) می‌آیند. ترتیب = اولویت هنگامِ امتیازِ برابر. */
const QUICK: [GroupKey, () => Promise<{ hay: string; hit: SearchHit }[]>][] = [
  ['rankings', loadRankings], ['people', loadPeople], ['clubs', loadClubs], ['tournaments', loadTournaments],
]
const SUGGEST_MAX = 8

/** پیشنهادهای کادرِ نوار؛ عبارتِ کوتاه‌تر از دو نویسه ⟵ `null` */
export async function quickSearch(raw: unknown): Promise<SuggestHit[] | null> {
  const t = tokensOf(raw)
  if (t.length === 0) return null
  const settled = await Promise.allSettled(QUICK.map(([, load]) => load()))
  const all: (SuggestHit & { s: number; o: number })[] = []
  settled.forEach((r, o) => {
    const key = QUICK[o]![0]
    if (r.status === 'rejected') { console.error(`[suggest] ${key} failed:`, r.reason); return }
    for (const row of r.value) {
      if (matchesAll(row.hay, t)) all.push({ ...row.hit, key, s: scoreOf(row.hit.title, t), o })
    }
  })
  return all
    .sort((a, b) => b.s - a.s || a.o - b.o || (a.rank ?? 0) - (b.rank ?? 0))
    .slice(0, SUGGEST_MAX)
    .map(h => ({ key: h.key, href: h.href, title: h.title, sub: h.sub, image: h.image, verified: h.verified, rank: h.rank }))
}

function toGroup(key: GroupKey, f: Found): SearchGroup {
  const sorted = [...f.rows].sort((a, b) => b.s - a.s)
  return {
    key, total: sorted.length,
    capped: f.capped ?? (f.limit !== undefined && f.fetched === f.limit),
    hits: sorted.slice(0, PER_GROUP).map(h => ({ href: h.href, title: h.title, sub: h.sub, image: h.image, verified: h.verified, rank: h.rank })),
  }
}

/** نتیجه‌ی جست‌وجو؛ عبارتِ کوتاه‌تر از دو نویسه ⟵ `null` (جست‌وجو نشد) */
export async function siteSearch(raw: unknown): Promise<SearchGroup[] | null> {
  const t = tokensOf(raw)
  if (t.length === 0) return null
  const settled = await Promise.allSettled(SOURCES.map(([, fn]) => fn(t)))
  return settled.map((r, i) => {
    const key = SOURCES[i]![0]
    if (r.status === 'fulfilled') return toGroup(key, r.value)
    console.error(`[search] ${key} failed:`, r.reason)
    return { key, hits: [], total: 0, failed: true }
  })
}
