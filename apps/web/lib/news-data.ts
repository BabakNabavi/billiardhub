/* ─────────────────────────────────────────────────────────────
   اخبار بیلیارد هاب — منبع واحد (مثل sellers-data / manufacturers-data).
   هم صفحه‌ی لیست (/news) و هم جزئیات (/news/[id]) از همین می‌خوانند؛
   داده‌ی نمونه ولی با ساختار واقعی: دسته، تصویر واقعی، نویسنده،
   زمان مطالعه، بازدید، برچسب‌ها و متن چندپاراگرافی.
   ───────────────────────────────────────────────────────────── */

export const NEWS_CATEGORIES = [
  { key: 'snooker',   label: 'اخبار اسنوکر',        dot: '#14532D' },
  { key: 'pool',      label: 'اخبار پاکت بیلیارد',  dot: '#7C3AED' },
  { key: 'players',   label: 'اخبار بازیکنان',      dot: '#0891B2' },
  { key: 'tournms',   label: 'مسابقات',             dot: '#B23B2E' },
  { key: 'clubs',     label: 'باشگاه‌ها',            dot: '#C7A66A' },
  { key: 'gear',      label: 'تجهیزات و محصولات',   dot: '#A07840' },
  { key: 'world',     label: 'اخبار بین‌المللی',     dot: '#1D4ED8' },
  { key: 'iran',      label: 'اخبار ایران',          dot: '#0E7A38' },
] as const

export type NewsCategoryKey = typeof NEWS_CATEGORIES[number]['key']

export interface NewsArticle {
  id: string
  category: NewsCategoryKey
  title: string
  excerpt: string
  /** پاراگراف‌های متن کامل */
  body: string[]
  author: string
  /** تاریخ شمسی نمایشی */
  date: string
  /** برای مرتب‌سازی «جدیدترین» (بزرگ‌تر = تازه‌تر) */
  ts: number
  readTime: string
  views: number
  image: string
  featured?: boolean
  breaking?: boolean
  tags: string[]
}

/* ── فهرستِ محتوای دستی — عمداً خالی ─────────────────────────────
   تا امروز این‌جا ۲۱ خبرِ ساختگی بود: «تیم ملی اسنوکر ایران فینالیستِ
   قهرمانیِ آسیا شد»، «قرعه‌کشیِ تهران مسترز»… با نویسنده، تاریخ و
   تعدادِ بازدیدِ جعلی. این‌ها روی سایتِ عمومی به‌عنوانِ خبرِ واقعی
   نمایش داده می‌شدند.

   بدتر اینکه صفحه‌ی «اخبار» در پنلِ ادمین از روزِ اول در جدولِ `news`
   می‌نوشت و این صفحه هرگز آن جدول را نمی‌خواند — پس خبرِ واقعیِ ادمین
   هیچ‌جا دیده نمی‌شد و خبرِ ساختگی هم پاک نمی‌شد. همان الگوی رنکینگ.

   حالا داده از `/api/news` می‌آید. نسخه‌ی قدیمی در تاریخچه‌ی گیت هست. */
export const NEWS_ARTICLES: NewsArticle[] = []

/* ── خواندنِ اخبارِ واقعی از سرور ──
   ردیفِ دیتابیس به همان شکلی ترجمه می‌شود که رابط انتظار دارد، تا
   هیچ‌کدام از کامپوننت‌های موجود لازم نباشد عوض شوند. */
export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  try {
    const r = await fetch('/api/news', { cache: 'no-store' })
    if (!r.ok) return []
    const j = await r.json() as { articles?: Record<string, unknown>[] }
    return (j.articles ?? []).map(toArticle)
  } catch { return [] }
}

const KNOWN = new Set(NEWS_CATEGORIES.map(c => c.key as string))

function toArticle(r: Record<string, unknown>): NewsArticle {
  const when = String(r.published_at ?? r.created_at ?? '')
  const ts = Date.parse(when) || 0
  /* متن در دیتابیس یک رشته است؛ رابط آرایه‌ی پاراگراف می‌خواهد */
  const raw = String(r.body ?? '')
  const body = raw ? raw.split(/\n{2,}/).map(s => s.trim()).filter(Boolean) : []
  const words = raw.trim() ? raw.trim().split(/\s+/).length : 0
  const cat = String(r.category ?? '')
  return {
    id: String(r.slug ?? r.id ?? ''),
    /* دسته‌ی ناشناخته نباید کارت را بشکند */
    category: (KNOWN.has(cat) ? cat : NEWS_CATEGORIES[0]!.key) as NewsCategoryKey,
    title: String(r.title ?? ''),
    excerpt: String(r.excerpt ?? ''),
    body,
    author: 'بیلیارد هاب',
    date: ts ? new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ts)) : '',
    ts,
    /* حدودِ ۲۰۰ واژه در دقیقه */
    readTime: `${Math.max(1, Math.round(words / 200))} دقیقه`,
    /* شمارنده‌ی بازدید نداریم؛ عددِ ساختگی نمی‌سازیم */
    views: 0,
    image: String(r.cover_url ?? ''),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
  }
}

export function getArticle(id: string): NewsArticle | null {
  return NEWS_ARTICLES.find(a => a.id === id) ?? null
}

export function relatedArticles(a: NewsArticle, count = 4): NewsArticle[] {
  const same = NEWS_ARTICLES.filter(x => x.id !== a.id && x.category === a.category)
  const rest = NEWS_ARTICLES.filter(x => x.id !== a.id && x.category !== a.category)
  return [...same, ...rest].slice(0, count)
}

export function categoryOf(key: NewsCategoryKey) {
  return NEWS_CATEGORIES.find(c => c.key === key)!
}

/* ارقام فارسی */
export const faDigits = (v: string | number) =>
  String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
export const faNum = (n: number) => n.toLocaleString('fa-IR')
