/* اسکلتِ صفحه‌ی جست‌وجو هنگامِ آمدن از صفحه‌ی دیگر (Enter در نوارِ بالا).
   بدونِ این، تا آمدنِ کلِ نتیجه هیچ بازخوردی نبود؛ روی شبکه‌ی کند یعنی چند
   ثانیه سکوت. جست‌وجوی دوباره روی خودِ صفحه را مرزِ Suspenseِ صفحه می‌پوشاند. */

import { SearchSkeleton } from '@/components/search/SearchSkeleton'

export default function SearchLoading() {
  return (
    <div className="lq-stage min-h-screen pb-16">
      <div className="mx-auto max-w-screen-xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <div aria-hidden className="h-8 w-64 max-w-full rounded-chip bg-line/[.06] motion-safe:animate-pulse" />
        <div aria-hidden className="mt-4 h-12 max-w-2xl rounded-field bg-line/[.05] motion-safe:animate-pulse" />
        <SearchSkeleton />
      </div>
    </div>
  )
}
