import type { Metadata } from 'next'
import { Suspense } from 'react'
import Form from 'next/form'
import { z } from 'zod'
import { Search } from 'lucide-react'
import { siteSearch } from '@/lib/search/server'
import { MAX_QUERY } from '@/lib/search/match'
import { faNum } from '@/lib/jalali'
import { buttonClasses } from '@/components/ui/button-classes'
import { ExploreCards, EXPLORE_ITEMS } from '@/components/home/ExploreCards'
import { GROUP_META, SearchResults } from '@/components/search/SearchResults'
import { SearchSkeleton } from '@/components/search/SearchSkeleton'

/* ─────────────────────────────────────────────────────────────
   جست‌وجوی سراسریِ سایت.

   ⚠️ تا مهرِ ۱۴۰۵ کادرِ «جستجو...»ِ نوارِ بالا تایپ می‌گرفت و هیچ کاری
   نمی‌کرد — نه نتیجه، نه صفحه. حالا با Enter به این صفحه می‌آید.

   فرم `next/form` است: بی‌جاوااسکریپت مثلِ `<form method="get">` کار می‌کند،
   و با جاوااسکریپت ناوبریِ نرم می‌کند (بی‌بارگذاریِ دوباره‌ی کلِ صفحه روی
   شبکه‌ی کند) و `loading.tsx` را نشان می‌دهد. نشانیِ `/search?q=…` قابلِ
   اشتراک و بازگشت است. نتیجه روی سرور ساخته می‌شود (`lib/search/server`).
   ───────────────────────────────────────────────────────────── */

type SP = Promise<{ q?: string | string[] }>

/* ورودیِ بیرونی در مرز با Zod: رشته یا آرایه (`?q=a&q=b`)، اولی، کوتاه‌شده */
const Q = z.union([z.string(), z.array(z.string())]).optional()
  .transform(v => (Array.isArray(v) ? v[0] : v)?.slice(0, MAX_QUERY).trim() ?? '')
const qOf = (v: unknown): string => { const r = Q.safeParse(v); return r.success ? r.data : '' }

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const q = qOf((await searchParams).q)
  return {
    title: q ? `جست‌وجوی «${q}»` : 'جست‌وجو',
    /* نتیجه‌ی جست‌وجو صفحه‌ی موتورِ جست‌وجو نیست */
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const q = qOf((await searchParams).q)

  return (
    <div className="lq-stage min-h-screen pb-16">
      <div className="mx-auto max-w-screen-xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <h1 className="m-0 text-title text-ink">جست‌وجو در بیلیارد هاب</h1>

        <Form action="/search" role="search" className="mt-4 flex max-w-2xl items-center gap-2">
          <label htmlFor="sq" className="sr-only">عبارتِ جست‌وجو</label>
          <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-field border border-line/10 bg-surface px-4
                          focus-within:border-gold-deep focus-within:ring-2 focus-within:ring-gold/25">
            <Search size={18} aria-hidden className="shrink-0 text-ink-2" />
            {/* ۱۶ پیکسل: سافاریِ iOS زیرِ آن هنگامِ فوکوس صفحه را بزرگ می‌کند.
                `key={q}`: صفحه با عوض‌شدنِ فقط `?q=` دوباره سوار نمی‌شود و
                `defaultValue` روی ورودیِ موجود اثر ندارد — بدونِ این، جست‌وجوی
                تازه از نوارِ بالا نتیجه‌ی «بار» را نشان می‌داد و کادر هنوز «فو». */}
            <input key={q} id="sq" name="q" type="search" defaultValue={q} maxLength={MAX_QUERY} enterKeyHint="search"
              placeholder="باشگاه، مربی، بازیکن، فروشگاه، مسابقه، آگهی…"
              className="h-full min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-2" />
          </div>
          <button type="submit" className={buttonClasses({ size: 'lg', className: 'h-12 shrink-0' })}>جست‌وجو</button>
        </Form>

        {/* ⚠️ `key={q}`: `loading.tsx` فقط هنگامِ آمدن از صفحه‌ی دیگر دیده می‌شود.
            مسیریابِ Next کلیدِ بخش را بی‌پارامترِ جست‌وجو می‌سازد، پس جست‌وجوی دوباره
            روی همین صفحه نتیجه‌ی قبلی را تا آمدنِ تازه نگه می‌داشت — همان سکوت
            روی شبکه‌ی کند. با کلید، هر عبارت مرزِ Suspenseِ تازه‌ای است و اسکلت
            همان لحظه می‌آید؛ تیتر و فرم سرِ جایشان می‌مانند. */}
        <Suspense key={q} fallback={<SearchSkeleton />}>
          <Results q={q} />
        </Suspense>
      </div>
    </div>
  )
}

async function Results({ q }: { q: string }) {
  const groups = q ? await siteSearch(q) : null
  const total = groups?.reduce((n, g) => n + g.total, 0) ?? 0
  const failed = groups?.filter(g => g.failed) ?? []
  return (
    <>
      {q && groups === null && (
        <p className="m-0 mt-4 text-body text-ink-2">دست‌کم دو حرف بنویسید.</p>
      )}
      {groups && (
        <p aria-live="polite" className="m-0 mt-4 text-body text-ink-2">
          {total > 0 ? `${faNum(total)} نتیجه برای «${q}»` : `برای «${q}» چیزی پیدا نشد.`}
        </p>
      )}
      {failed.length > 0 && (
        <p role="status" className="m-0 mt-2 text-sub text-danger-ink">
          این بخش‌ها الان جواب ندادند و در نتیجه نیستند: {failed.map(f => GROUP_META[f.key].label).join('، ')}
        </p>
      )}

      {groups && total > 0 && <div className="mt-8"><SearchResults groups={groups} q={q} /></div>}

      {(!groups || total === 0) && (
        <div className="mt-12">
          <h2 className="m-0 mb-6 text-section text-ink">{groups ? 'شاید دنبالِ یکی از این‌ها بودید' : 'یا از بخش‌ها شروع کنید'}</h2>
          <ExploreCards items={EXPLORE_ITEMS.slice(0, 6)} className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4" />
        </div>
      )}
    </>
  )
}
