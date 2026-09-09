'use client'

/* ─────────────────────────────────────────────────────────────
   نمایشِ لیستِ پخش — همان قابِ بیلیارد مدیا.

   ⚠️ ترتیبِ ویدیوها همان ترتیبی است که سرور داده (position، بعد
   زمانِ افزودن). این‌جا دوباره مرتب نمی‌شود.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Play, ListVideo } from 'lucide-react'
import type { PublicVideo } from '../../../../lib/media/server'
import { publicToMedia } from '../../../../lib/media-user'
import { toFaDigits } from '../../../../lib/jalali'
import { NavOffset, TopBar, Rail, BottomNav, useRailState } from '../../../../components/media/shell'
import { MiniCard } from '../../../../components/media/cards'

export interface PlaylistView {
  slug: string; title: string; description: string
  handle: string; count: number; posters: string[]
  items: PublicVideo[]
}

export default function PlaylistClient({ playlist }: { playlist: PlaylistView }) {
  const router = useRouter()
  const { mini, toggle } = useRailState()
  const items = playlist.items.map(publicToMedia)
  const first = items[0]

  return (
    <div className="mx" dir="rtl">
      <NavOffset />
      <TopBar q="" onQ={() => { /* جست‌وجو در صفحه‌ی اصلی */ }}
        onSubmit={() => router.push('/media')} onToggleRail={toggle} railMini={mini} />

      <div className="mx-frame" data-rail={mini ? 'mini' : 'full'}>
        <Rail />
        <main className="mx-main">
          <div className="mx-wrap">
            <nav className="mx-crumbs" aria-label="مسیر">
              <Link href="/media">بیلیارد مدیا</Link>
              <span>·</span>
              <Link href={`/media/channel/${encodeURIComponent(playlist.handle)}`} dir="ltr">@{playlist.handle}</Link>
            </nav>

            <header className="mx-plhead">
              <div className="mx-pl-stack mx-pl-stack--lg">
                {playlist.posters.length > 0
                  ? playlist.posters.map((src, i) => (
                    <span key={i} className="mx-pl-poster"><img src={src} alt="" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" /></span>
                  ))
                  : <span className="mx-pl-poster mx-pl-poster--none"><ListVideo size={26} aria-hidden /></span>}
              </div>
              <div>
                <h1>{playlist.title}</h1>
                {playlist.description && <p>{playlist.description}</p>}
                <p className="mx-sub"><span>{toFaDigits(playlist.count)} ویدیو</span></p>
                {first && (
                  <Link className="mx-watch" href={`/media/${encodeURIComponent(first.id)}`}>
                    <Play size={16} aria-hidden /> پخش از ابتدا
                  </Link>
                )}
              </div>
            </header>

            <section className="mx-sec">
              {items.length === 0 ? (
                <p className="mx-by">این لیست هنوز ویدیویی ندارد.</p>
              ) : (
                <ol className="mx-plitems">
                  {items.map((v, i) => (
                    <li key={v.id}>
                      <span className="mx-plnum" aria-hidden>{toFaDigits(i + 1)}</span>
                      <MiniCard v={v} />
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
