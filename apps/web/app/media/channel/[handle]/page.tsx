'use client'

/* ─────────────────────────────────────────────────────────────
   صفحه‌ی کانال — بیلیارد مدیا.

   ⚠️ همان قاب صفحه‌ی اول. پیش از این ظاهر جداگانه‌ای داشت و کاربر
   با رفتن به کانال از پلتفرم بیرون می‌افتاد.

   ⚠️ دکمه‌ی «دنبال کردن» حالا واقعی است (`SubscribeButton`) و فقط
   وقتی رندر می‌شود که جدول اشتراک روی سرور ساخته شده باشد. نسخه‌ی
   قبلی یک `useState` خالی بود که با رفرش می‌پرید.

   ⚠️ تب Shorts از `width`/`height` واقعی فایل مشتق می‌شود، نه از
   ستونی که وجود ندارد.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { fetchVideos } from '../../../../lib/media-user'
import type { MediaVideo } from '../../../../lib/media-data'
import { splitShorts } from '../../../../lib/media/shelf'
import { NavOffset, TopBar, Rail, BottomNav, useRailState } from '../../../../components/media/shell'
import { VideoCard, ShortCard, Avatar } from '../../../../components/media/cards'
import { SubscribeButton } from '../../../../components/media/social'
import ShortsViewer from '../../../../components/media/ShortsViewer'
import ChannelPlaylists from '../../../../components/media/ChannelPlaylists'
import { toFaDigits } from '../../../../lib/jalali'
import '../../media.css'

type Tab = 'videos' | 'shorts' | 'lists'

export default function ChannelPage() {
  const params = useParams()
  const router = useRouter()
  const handle = (Array.isArray(params?.handle) ? params.handle[0] : params?.handle) ?? ''
  const { mini, toggle } = useRailState()

  const [rows, setRows] = useState<MediaVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [tab, setTab] = useState<Tab>('videos')
  const [svAt, setSvAt] = useState<number | null>(null)
  /* ⚠️ تب «لیست‌های پخش» فقط وقتی می‌آید که جدولش روی سرور باشد؛
     خود کامپوننت خبر می‌دهد. */
  const [hasLists, setHasLists] = useState(false)

  /* فقط ویدیوهای همین کانال از سرور خواسته می‌شود — ستون
     `creator_handle` ایندکس دارد. */
  useEffect(() => {
    if (!handle) { setLoading(false); return }
    let alive = true
    void fetchVideos({ handle, limit: 48 }).then(r => {
      if (!alive) return
      setRows(r.items.slice().sort((a, b) => b.ts - a.ts))
      /* ⚠️ شکست درخواست نباید «این کانال ویدیویی ندارد» شود */
      setFailed(!r.ok)
      setLoading(false)
    })
    return () => { alive = false }
  }, [handle])

  const split = useMemo(() => splitShorts(rows), [rows])
  const name = rows[0]?.creator.name || handle

  return (
    <div className="mx" dir="rtl">
      <NavOffset />
      <TopBar q="" onQ={() => { /* جست‌وجو در صفحه‌ی اصلی */ }}
        onSubmit={() => router.push('/media')} onToggleRail={toggle} railMini={mini} />

      <div className="mx-frame" data-rail={mini ? 'mini' : 'full'}>
        <Rail />
        <main className="mx-main">
          <div className="mx-wrap">
            {loading ? (
              <div className="mx-center mx-pad"><Loader2 size={26} className="mx-spin" aria-hidden /></div>
            ) : failed ? (
              <div className="mx-empty">
                <h1>ویدیوهای این کانال بارگذاری نشد</h1>
                <p>این یک خطای موقت است، نه نبود ویدیو.</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="mx-empty">
                <h1>این کانال ویدیویی ندارد</h1>
                <p>ممکن است هندل اشتباه باشد یا هنوز چیزی منتشر نشده باشد.</p>
                <div className="mx-empty-act">
                  <Link className="mx-iconbtn" href="/media/channels"><span>همه‌ی کانال‌ها</span></Link>
                </div>
              </div>
            ) : (
              <>
                <header className="mx-chead">
                  <Avatar name={name} src={rows[0]?.thumb || undefined} />
                  <div>
                    <h1>{name}</h1>
                    <p dir="ltr">@{handle}</p>
                    <p>{toFaDigits(rows.length)} ویدیو</p>
                  </div>
                  <div className="mx-chead-act">
                    <SubscribeButton handle={handle} />
                  </div>
                </header>

                {/* تب Shorts فقط وقتی می‌آید که این کانال واقعا ویدیوی
                    عمودی کوتاه داشته باشد. */}
                {(split.shorts.length > 0 || hasLists) && (
                  <div className="mx-tabs" role="group" aria-label="محتوای کانال">
                    <button type="button" aria-pressed={tab === 'videos'} onClick={() => setTab('videos')}>ویدئوها</button>
                    {split.shorts.length > 0 && (
                      <button type="button" aria-pressed={tab === 'shorts'} onClick={() => setTab('shorts')}>Shorts</button>
                    )}
                    {hasLists && (
                      <button type="button" aria-pressed={tab === 'lists'} onClick={() => setTab('lists')}>لیست‌های پخش</button>
                    )}
                  </div>
                )}

                {/* ⚠️ *یک* نمونه که همیشه mount می‌ماند و فقط پنهان
                    می‌شود. دو نمونه‌ی شرطی، با هر بار عوض‌کردن تب
                    یکی را unmount و دیگری را mount می‌کرد: یک
                    درخواست تازه و از دست رفتن عنوان نیمه‌تایپ‌شده. */}
                <div hidden={tab !== 'lists'}>
                  <ChannelPlaylists handle={handle} onAvailable={setHasLists} />
                </div>

                <section className="mx-sec" hidden={tab === 'lists'}>
                  {tab === 'shorts' ? (
                    <div className="mx-grid">
                      {split.shorts.map((v, i) => <ShortCard key={v.id} v={v} onOpen={() => setSvAt(i)} />)}
                    </div>
                  ) : (
                    <div className="mx-grid">
                      {(split.shorts.length > 0 ? split.videos : rows).map((v, i) => (
                        <VideoCard key={v.id} v={v} priority={i < 4} flat />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      <BottomNav />

      {svAt !== null && (
        <ShortsViewer items={split.shorts} start={svAt} onClose={() => setSvAt(null)} />
      )}
    </div>
  )
}
