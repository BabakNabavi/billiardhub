'use client'

/* ─────────────────────────────────────────────────────────────
   «شما» — صفحه‌ی شخصیِ بیلیارد مدیا، مثلِ زبانه‌ی You در یوتیوب.

   پیش‌تر دکمه‌ی «پروفایل»ِ ناوبریِ مدیا مستقیم به /dashboard می‌رفت و
   برای بعضی حساب‌ها صفحه‌ی سفید می‌دید. کاربرِ پلتفرمِ ویدیو این‌جا
   تاریخچه و کانال‌های دنبال‌شده‌اش را می‌خواهد؛ داشبورد یک لینک است.

   داده‌ها واقعی‌اند: تاریخچه از همین دستگاه (lib/media/history)،
   اشتراک‌ها از جدولِ channel_subscriptions.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { History, Users2, LayoutDashboard, Trash2, LogIn } from 'lucide-react'
import type { MediaVideo } from '../../../lib/media-data'
import { fetchVideos } from '../../../lib/media-user'
import { channelsFrom } from '../../../lib/media/shelf'
import { clearHistory } from '../../../lib/media/history'
import { useTaste } from '../../../lib/media/useTaste'
import { useAuthStore } from '../../../store/auth.store'
import { NavOffset, TopBar, Rail, BottomNav, useRailState } from '../../../components/media/shell'
import { VideoCard, ChannelCard, GridSkeleton } from '../../../components/media/cards'
import '../media.css'

export default function YouClient() {
  const { user } = useAuthStore()
  const { mini, toggle } = useRailState()
  const { history, subscribed, subsLoading } = useTaste(user?.id)
  const [pool, setPool] = useState<MediaVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true); setFailed(false)
    void (async () => {
      const r = await fetchVideos({ limit: 100 })
      if (alive) { setPool(r.items); setFailed(!r.ok); setLoading(false) }
    })()
    return () => { alive = false }
  }, [attempt])

  const watched = useMemo(() => {
    if (cleared) return []
    const byId = new Map(pool.map(v => [v.id, v]))
    return history.map(h => byId.get(h.slug)).filter((v): v is MediaVideo => !!v)
  }, [history, pool, cleared])

  /* از خودِ فهرستِ اشتراک ساخته می‌شود و با استخرِ ویدیو فقط تکمیل؛ کانالی که در
     ۱۰۰ ویدیوی اخیر نیست نباید از «دنبال‌شده‌ها» بیفتد */
  const subChannels = useMemo(() => {
    const known = new Map(channelsFrom(pool).map(c => [c.handle.toLowerCase(), c]))
    return subscribed.map(h => known.get(h.toLowerCase()) ?? { handle: h, name: h, videoCount: 0, views: 0, poster: '' })
  }, [pool, subscribed])

  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'حساب شما' : ''

  return (
    <div className="mx" dir="rtl">
      <NavOffset />
      <TopBar q="" onQ={() => {}} onSubmit={() => {}} onToggleRail={toggle} railMini={mini} />
      <div className="mx-frame" data-rail={mini ? 'mini' : 'full'}>
        <Rail tab="you" />
        <main className="mx-main">
          <div className="mx-wrap">
            <h1 className="mx-you-h">{user ? name : 'شما'}</h1>

            {!user && (
              <div className="mx-empty">
                <h2>برای دیدن کانال‌های دنبال‌شده وارد شوید</h2>
                <p>تاریخچه‌ی تماشای همین دستگاه پایین‌تر هست؛ با ورود، کانال‌هایی که دنبال می‌کنید هم این‌جا می‌آیند</p>
                <div className="mx-empty-act">
                  <Link className="mx-iconbtn" href="/login?next=%2Fmedia%2Fyou"><LogIn size={15} /><span>ورود یا ثبت‌نام</span></Link>
                </div>
              </div>
            )}

            {user && (
              <div className="mx-you-links">
                <Link className="mx-iconbtn" href="/dashboard"><LayoutDashboard size={15} /><span>داشبورد و پروفایل</span></Link>
              </div>
            )}

            <section className="mx-sec" aria-labelledby="you-history">
              <div className="mx-sec-hd">
                <h2 id="you-history"><History size={18} aria-hidden /> تاریخچه تماشا</h2>
                {watched.length > 0 && (
                  <button type="button" className="mx-all" onClick={() => { clearHistory(); setCleared(true) }}>
                    <Trash2 size={13} aria-hidden /> پاک کردن تاریخچه
                  </button>
                )}
              </div>
              {loading ? <GridSkeleton n={4} /> : failed ? (
                <div className="mx-empty">
                  <p>دریافت ویدیوها از سرور ناموفق بود، این یک خطای موقت است</p>
                  <div className="mx-empty-act"><button type="button" className="mx-iconbtn" onClick={() => setAttempt(a => a + 1)}><span>تلاش دوباره</span></button></div>
                </div>
              ) : watched.length > 0 ? (
                <div className="mx-grid">{watched.map(v => <VideoCard key={v.id} v={v} />)}</div>
              ) : (
                <p className="mx-by">هنوز ویدیویی روی این دستگاه تماشا نکرده‌اید</p>
              )}
            </section>

            {user && (
              <section className="mx-sec" aria-labelledby="you-subs">
                <div className="mx-sec-hd"><h2 id="you-subs"><Users2 size={18} aria-hidden /> کانال‌های دنبال‌شده</h2></div>
                {loading || subsLoading ? <GridSkeleton n={4} /> : subChannels.length > 0 ? (
                  <div className="mx-shelf mx-shelf--h">{subChannels.map(c => <ChannelCard key={c.handle} c={c} />)}</div>
                ) : (
                  <p className="mx-by">هنوز کانالی را دنبال نکرده‌اید؛ از صفحه‌ی هر ویدیو دکمه‌ی «دنبال کردن» را بزنید</p>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
      <BottomNav tab="you" />
    </div>
  )
}
