'use client'

/* ─────────────────────────────────────────────────────────────
   کانال‌ها — بیلیارد مدیا.

   ⚠️ همان قاب صفحه‌ی اول (ریل، نوار بالا، ناوبری پایین). پیش از
   این، کلیک روی «کانال‌ها» کاربر را از پلتفرم بیرون می‌انداخت: قاب
   ناپدید می‌شد و صفحه ظاهر دیگری داشت.

   ⚠️ فهرست کانال‌ها از سازنده‌های ویدیوهای *واقعی منتشرشده* ساخته
   می‌شود، نه از فایل کانال‌ها: کانالی که هیچ ویدیویی ندارد در یک
   صفحه‌ی کشف چیزی به کسی نمی‌دهد. «تعداد دنبال‌کننده» هم این‌جا
   نیست — روی کارت فهرست به‌ازای هر کانال یک پرس‌وجو می‌خواهد.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchVideos } from '../../../lib/media-user'
import { channelsFrom, type ShelfChannel } from '../../../lib/media/shelf'
import { NavOffset, TopBar, Rail, BottomNav, useRailState } from '../../../components/media/shell'
import { ChannelCard } from '../../../components/media/cards'
import '../media.css'
import { makeMatcher } from '@/lib/search/filter'

export function ChannelsClient({ initial }: { initial: ShelfChannel[] | null }) {
  const router = useRouter()
  const { mini, toggle } = useRailState()

  /* جست‌وجوی کانال برداشته شد (خواستِ مالک، ۱۰ آبانِ ۱۴۰۵) */
  const q = ''
  /* کانال‌ها از همان ۴۸ ویدیوی تازه‌ای که fetchVideos({ limit: 48 }) می‌گیرد، روی سرور ساخته
     و همراهِ HTML می‌آیند (page.tsx) ⟵ بی‌اسکلت (آذرِ ۱۴۰۵). صفحه ISR است، پس درخواستِ پایین
     همچنان می‌رود و نسخه‌ی تازه را می‌آورد. */
  const [all, setAll] = useState<ShelfChannel[]>(initial ?? [])
  const [loading, setLoading] = useState(initial == null)
  const hadInitial = useRef(initial != null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    void fetchVideos({ limit: 48 }).then(r => {
      if (!alive) return
      /* ⚠️ شکستِ این درخواست فهرستِ سالمِ سرور را به «در دسترس نیست» تبدیل نکند */
      if (!r.ok && hadInitial.current) { setLoading(false); return }
      setAll(channelsFrom(r.items))
      setFailed(!r.ok)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const rows = useMemo(() => {
    if (!q.trim()) return all
    const hit = makeMatcher(q)
    return all.filter(c => hit(c.name, c.handle))
  }, [all, q])

  return (
    <div className="mx" dir="rtl">
      <NavOffset />
      {/* جست‌وجوی نوار بالا کاربر را به جست‌وجوی ویدیو می‌برد؛ فیلتر
          کانال‌ها همین پایین و محلی است. */}
      <TopBar
        q="" onQ={() => { /* نوار فقط برای رفتن به جست‌وجوی ویدیو */ }}
        onSubmit={() => router.push('/media')}
        onToggleRail={toggle} railMini={mini}
      />

      <div className="mx-frame" data-rail={mini ? 'mini' : 'full'}>
        <Rail />
        <main className="mx-main">
          <div className="mx-wrap">
            <div className="mx-sec-hd mx-pad-t">
              <h1>کانال‌ها</h1>
              <p>سازندگانی که در بیلیارد مدیا ویدیو منتشر کرده‌اند</p>
            </div>


            {loading ? (
              <div className="mx-grid">
                {Array.from({ length: 8 }, (_, i) => <div key={i} className="mx-sk mx-sk-chan" aria-hidden />)}
              </div>
            ) : failed ? (
              <div className="mx-empty">
                <h2>کانال‌ها در دسترس نیستند</h2>
                <p>دریافت فهرست از سرور ناموفق بود، این یک خطای موقت است</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="mx-empty">
                <h2>{q ? 'کانالی با این نام پیدا نشد' : 'هنوز کانالی ویدیو منتشر نکرده است'}</h2>
                <p>
                  {q
                    ? 'نام یا هندل دیگری را امتحان کنید'
                    : 'به‌محض انتشار اولین ویدیو، کانال سازنده‌اش همین‌جا دیده می‌شود'}
                </p>
              </div>
            ) : (
              <div className="mx-grid">
                {rows.map(c => <ChannelCard key={c.handle} c={c} />)}
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
