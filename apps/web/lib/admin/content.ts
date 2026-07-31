/* ─────────────────────────────────────────────────────────────
   تعریف چهار نوع محتوا در یک جا — اخبار، رویدادها، رنکینگ و رسانه.

   هر چهار صفحه‌ی ادمین یک الگو دارند (فهرست، ساخت، ویرایش، حذف)، پس
   به‌جای چهار مسیر تکراری، یک مسیر عمومی با همین نقشه کار می‌کند.

   نکته‌ی امنیتی: فهرست ستون‌ها این‌جا بسته است و هرچه در بدنه‌ی
   درخواست بیاید ولی در این فهرست نباشد دور ریخته می‌شود. بدون آن،
   یک PATCH می‌توانست `views` یا `created_at` را هم دست‌کاری کند.
   ───────────────────────────────────────────────────────────── */

export type ContentKind = 'news' | 'events' | 'rankings' | 'media'

interface ContentSpec {
  table: string
  /* ستون‌هایی که ادمین می‌تواند بنویسد */
  writable: string[]
  /* ستون مرتب‌سازی پیش‌فرض و جهتش */
  orderBy: string
  ascending: boolean
  /* ستون‌های عددی — رشته‌ی ورودی باید عدد شود */
  numeric?: string[]
  /* ستون‌های آرایه‌ای */
  arrays?: string[]
}

export const CONTENT: Record<ContentKind, ContentSpec> = {
  news: {
    table: 'news',
    writable: ['slug', 'title', 'excerpt', 'body', 'cover_url', 'category', 'tags', 'status', 'published_at'],
    orderBy: 'created_at', ascending: false,
    arrays: ['tags'],
  },
  events: {
    table: 'events',
    writable: [
      'slug', 'title', 'description', 'category', 'sport', 'location', 'province', 'city',
      'start_date', 'end_date', 'max_participants', 'prize', 'organizer',
      'registration_open', 'status', 'cover_url',
    ],
    orderBy: 'start_date', ascending: false,
    numeric: ['max_participants'],
  },
  rankings: {
    table: 'rankings',
    writable: ['discipline', 'season', 'player_id', 'player_name', 'city', 'points', 'rank', 'played', 'won'],
    orderBy: 'points', ascending: false,
    numeric: ['points', 'rank', 'played', 'won'],
  },
  media: {
    table: 'media_items',
    writable: [
      'slug', 'title', 'description', 'kind', 'media_url', 'thumb_url',
      'channel', 'duration_sec', 'tags', 'status',
    ],
    orderBy: 'created_at', ascending: false,
    numeric: ['duration_sec'],
    arrays: ['tags'],
  },
}

export const isContentKind = (v: string): v is ContentKind =>
  Object.prototype.hasOwnProperty.call(CONTENT, v)

/** فقط ستون‌های مجاز، با نوع درست — ورودی ناشناخته دور ریخته می‌شود */
export function sanitize(kind: ContentKind, body: Record<string, unknown>): Record<string, unknown> {
  const spec = CONTENT[kind]
  const out: Record<string, unknown> = {}

  for (const col of spec.writable) {
    if (!Object.prototype.hasOwnProperty.call(body, col)) continue
    const v = body[col]

    if (spec.numeric?.includes(col)) {
      const n = Number(v)
      out[col] = Number.isFinite(n) ? Math.round(n) : null
      continue
    }
    if (spec.arrays?.includes(col)) {
      out[col] = Array.isArray(v) ? v.map(x => String(x).slice(0, 60)).slice(0, 30) : []
      continue
    }
    if (typeof v === 'boolean' || v === null) { out[col] = v; continue }

    /* رشته‌ی خالی روی ستون تاریخ باعث خطای Postgres می‌شود */
    const s = String(v ?? '').trim()
    out[col] = s === '' ? null : s.slice(0, 20_000)
  }

  return out
}
