/* اسکلتِ نتیجه‌های جست‌وجو — همان قالب و همان کارت‌های صفحه‌ی نتیجه، تا جابه‌جاییِ
   چیدمان نباشد. هم مرزِ Suspenseِ صفحه (جست‌وجوی دوباره روی همان صفحه) و هم
   `loading.tsx` (آمدن از صفحه‌ی دیگر) از همین استفاده می‌کنند. */

export function SearchSkeleton() {
  return (
    <div role="status" aria-label="در حال جست‌وجو">
      <div aria-hidden className="mt-4 h-4 w-40 rounded-chip bg-line/[.05] motion-safe:animate-pulse" />
      <div aria-hidden className="mt-8 flex flex-col gap-8">
        {[0, 1].map(g => (
          <div key={g}>
            <div className="mb-3 h-5 w-48 rounded-chip bg-line/[.06] motion-safe:animate-pulse" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="lq-pcard flex items-center gap-3 p-3">
                  <div className="size-12 shrink-0 rounded-card bg-line/[.06] motion-safe:animate-pulse" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 w-2/3 rounded-chip bg-line/[.06] motion-safe:animate-pulse" />
                    <div className="h-3 w-1/2 rounded-chip bg-line/[.05] motion-safe:animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
