/* ─────────────────────────────────────────────────────────────
   الگوریتمِ پیشنهادِ بیلیارد مدیا — نسخه‌ی اول، به سبکِ یوتیوب.

   یوتیوب برای هر ویدیو یک «احتمالِ تماشای رضایت‌بخش» تخمین می‌زند و
   خانه را با آن مرتب می‌کند. نسخه‌ی ما همان منطق را با داده‌ای که
   واقعاً داریم می‌سازد — بی هیچ عددِ ساختگی:

     امتیاز = محبوبیت + تازگی + همخوانی با سلیقه‌ی بیننده − تکرار

   ── محبوبیت ──  لگاریتمِ بازدید، لایک و دیدگاه. لگاریتم تا ویدیوی
   پربازدید بقیه را نبلعد. لایک و دیدگاه وزنِ بیشتری از بازدید دارند،
   چون نشانه‌ی رضایت‌اند نه فقط کلیک.
   ── تازگی ──     افتِ نمایی با نیمه‌عمرِ ۱۰ روز.
   ── سلیقه ──      از تاریخچه‌ی تماشای همین دستگاه (lib/media/history)
   و کانال‌های دنبال‌شده: کانالی که زیاد دیده‌ای، دسته و برچسب‌هایی که
   تکرار شده‌اند. سهمِ هر بازدید با گذرِ زمان کم می‌شود (نیمه‌عمر ۲۱ روز).
   ── تکرار ──      ویدیویی که همین تازگی دیده شده پایین می‌رود (نه حذف:
   یوتیوب هم گاهی دوباره پیشنهاد می‌کند).
   ── تنوع ──       پس از امتیازدهی، بیش از دو ویدیوی پشتِ‌سرِ‌همِ یک
   کانال نمی‌آید.

   همه‌چیز در مرورگر حساب می‌شود (داده‌ی سلیقه روی دستگاه است) و برای
   بیننده‌ی تازه — بی تاریخچه — همان محبوبیت + تازگی کار می‌کند.
   ───────────────────────────────────────────────────────────── */

import type { MediaVideo } from '../media-data'
import type { HistoryEntry } from './history'

const DAY = 86_400_000
const FRESH_HALF_LIFE = 10 * DAY
const TASTE_HALF_LIFE = 21 * DAY

export interface Taste {
  channel: Map<string, number>
  category: Map<string, number>
  tag: Map<string, number>
  /** زمانِ آخرین پخشِ هر ویدیو */
  seen: Map<string, number>
  subscribed: Set<string>
  /** جمعِ وزن‌ها — برای نرمال‌کردنِ سهمِ دسته */
  total: number
}

const decay = (age: number, half: number) => Math.pow(0.5, Math.max(0, age) / half)
const bump = (m: Map<string, number>, k: string, w: number) => { if (k) m.set(k, (m.get(k) ?? 0) + w) }

export function buildTaste(history: HistoryEntry[], subscribed: string[] = [], now = Date.now()): Taste {
  const t: Taste = {
    channel: new Map(), category: new Map(), tag: new Map(), seen: new Map(),
    subscribed: new Set(subscribed.map(h => h.toLowerCase())), total: 0,
  }
  for (const e of history) {
    const w = decay(now - e.at, TASTE_HALF_LIFE) * Math.min(3, e.plays || 1)
    bump(t.channel, e.handle.toLowerCase(), w)
    bump(t.category, e.category, w)
    for (const tag of e.tags) bump(t.tag, tag, w * 0.5)
    t.seen.set(e.slug, e.at)
    t.total += w
  }
  return t
}

const popularity = (v: MediaVideo) =>
  Math.log10(1 + v.views) + 1.6 * Math.log10(1 + v.likes) + 1.3 * Math.log10(1 + v.comments)

const freshness = (v: MediaVideo, now: number) => (v.ts > 0 ? 2.2 * decay(now - v.ts, FRESH_HALF_LIFE) : 0)

function affinity(v: MediaVideo, t: Taste): number {
  if (t.total <= 0 && t.subscribed.size === 0) return 0
  const h = v.creator.handle.toLowerCase()
  let s = 0
  if (t.subscribed.has(h)) s += 2.5
  s += Math.min(3, 1.2 * (t.channel.get(h) ?? 0))
  if (t.total > 0) s += 2.5 * ((t.category.get(v.category) ?? 0) / t.total)
  let tagHits = 0
  for (const tag of v.tags) tagHits += t.tag.get(tag) ?? 0
  s += Math.min(1.5, 0.4 * tagHits)
  return s
}

function repeatPenalty(v: MediaVideo, t: Taste, now: number): number {
  const at = t.seen.get(v.id)
  if (!at) return 0
  /* همین امروز دیده شده ⟵ بیشترین افت؛ هر چه دورتر، کمتر */
  return -3.5 * decay(now - at, 3 * DAY)
}

export function scoreVideo(v: MediaVideo, t: Taste, now = Date.now()): number {
  return popularity(v) + freshness(v, now) + affinity(v, t) + repeatPenalty(v, t, now) + (v.featured ? 0.6 : 0)
}

/* حداکثر دو ویدیوی پشتِ‌سرِ‌همِ یک کانال — بقیه کمی عقب می‌روند، حذف نمی‌شوند */
function diversify(sorted: MediaVideo[], maxRun = 2): MediaVideo[] {
  const out: MediaVideo[] = []
  const queue = [...sorted]
  while (queue.length) {
    const lastTwo = out.slice(-maxRun).map(v => v.creator.handle)
    const blocked = lastTwo.length === maxRun && lastTwo.every(h => h === lastTwo[0])
    const i = blocked ? queue.findIndex(v => v.creator.handle !== lastTwo[0]) : 0
    out.push(queue.splice(i < 0 ? 0 : i, 1)[0]!)
  }
  return out
}

/** خانه: کلِ استخر مرتب‌شده با امتیاز و تنوع */
export function rankFeed(pool: MediaVideo[], t: Taste, now = Date.now()): MediaVideo[] {
  const scored = pool.map(v => ({ v, s: scoreVideo(v, t, now) }))
  scored.sort((a, b) => b.s - a.s || b.v.ts - a.v.ts)
  return diversify(scored.map(x => x.v))
}

/** «بعدی برای تماشا»: ربط به ویدیوی جاری وزنِ اصلی است، سلیقه و محبوبیت تساوی‌شکن */
export function rankUpNext(current: MediaVideo, pool: MediaVideo[], t: Taste, count = 12, now = Date.now()): MediaVideo[] {
  const tags = new Set(current.tags)
  const related = (v: MediaVideo) => {
    let s = 0
    if (v.creator.handle && v.creator.handle === current.creator.handle) s += 4
    if (v.category === current.category) s += 2.5
    s += Math.min(3, v.tags.filter(x => tags.has(x)).length * 1)
    return s
  }
  return pool
    .filter(v => v.id !== current.id)
    .map(v => ({ v, s: related(v) + 0.5 * scoreVideo(v, t, now) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map(x => x.v)
}
