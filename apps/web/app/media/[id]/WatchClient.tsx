'use client'

/* ─────────────────────────────────────────────────────────────
   صفحه‌ی تماشا — بخشِ تعاملی.

   ⚠️ `page.tsx` سرور-کامپوننت است و عنوان، توضیح، canonical و
   `VideoObject` را می‌سازد. این‌جا فقط چیزهایی است که واقعاً به
   مرورگر نیاز دارند: پلیر، تبلیغِ پیش‌پخش، شمارشِ بازدید، ثبتِ
   پیشرفتِ تماشا و هم‌رسانی.

   ── چه چیزی حذف شد ──
   ⚠️ نسخه‌ی قبل سه دکمه‌ی «لایک»، «تماشای بعداً» و «دنبال کردن»
   داشت که هر سه فقط `useState` بودند: هیچ درخواستی نمی‌رفت، هیچ
   چیزی ذخیره نمی‌شد. کاربر «دنبال کردن» را می‌زد، دکمه می‌گفت
   «دنبال می‌کنید»، و با یک رفرش همه‌چیز می‌پرید. شمارنده‌ی لایک هم
   همیشه صفر بود چون `likes` در نگاشت هاردکد است.

   جدولی برای اشتراک، لایک یا فهرستِ ذخیره وجود ندارد و ساختنش
   مهاجرتِ اسکیماست. پس دکمه‌ها برداشته شدند؛ دکمه‌ای که چیزی را
   ذخیره نمی‌کند بدتر از نبودنش است. آنچه ماند واقعاً کار می‌کند:
   هم‌رسانی، کپیِ نشانی، و ازسرگیریِ تماشا.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Link2, Check, Send } from 'lucide-react'
import PrerollAd, { type PrerollAdData } from '../../../components/media/PrerollAd'
import { compactViews, type MediaVideo } from '../../../lib/media-data'
import { absoluteUrl } from '../../../lib/site-url'
import { faDate } from '../../../lib/jalali'
import { mark, resumeAt } from '../../../lib/media/watch-progress'
import { upNext } from '../../../lib/media/shelf'
import { NavOffset } from '../../../components/media/shell'
import { MiniCard, Avatar } from '../../../components/media/cards'
import '../media.css'

export default function WatchClient({ video, related }: { video: MediaVideo; related: MediaVideo[] }) {
  const mainRef = useRef<HTMLVideoElement>(null)

  /* ── تبلیغِ پیش‌پخش ──
     ترتیب عمدی است: تبلیغ پیش از اولین پخش گرفته می‌شود ولی نمایش
     داده نمی‌شود تا کاربر play بزند. بازکردنِ صفحه هیچ تبلیغی
     نمی‌شمارد، و مکث/ادامه دوباره تبلیغ نمی‌آورد. */
  const [ad, setAd] = useState<PrerollAdData | null>(null)
  const [adPlaying, setAdPlaying] = useState(false)
  const adDone = useRef(false)

  useEffect(() => {
    let alive = true
    fetch('/api/ads/preroll', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (alive && j?.ad?.videoUrl) setAd(j.ad as PrerollAdData) })
      .catch(() => { /* بی‌تبلیغ ادامه می‌دهیم */ })
    return () => { alive = false }
  }, [])

  const gateAd = () => {
    if (adDone.current || !ad) return false
    adDone.current = true
    mainRef.current?.pause()
    setAdPlaying(true)
    return true
  }
  const afterAd = () => {
    setAdPlaying(false)
    void mainRef.current?.play().catch(() => { /* دکمه‌ی پلیر هست */ })
  }

  /* ── شمارشِ بازدید ──
     هنگامِ شروعِ پخش، نه بازشدنِ صفحه. تکرار در همین صفحه با `sent`
     بسته می‌شود؛ تکرارِ بینِ نشست‌ها را خودِ سرور می‌بندد. */
  const [sent, setSent] = useState(false)
  const countView = () => {
    if (sent) return
    setSent(true)
    void fetch('/api/media/view', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: video.id }), keepalive: true,
    }).catch(() => { /* شمارش حیاتی نیست */ })
  }

  /* ── ازسرگیری و ثبتِ پیشرفت ──
     ⚠️ داده‌ی واقعیِ همین دستگاه است، نه درصدِ ساختگی. ثبت با
     فاصله انجام می‌شود، نه در هر `timeupdate` — آن رویداد چهار بار
     در ثانیه می‌آید و نوشتن در localStorage با آن نرخ، اسکرول را
     روی گوشیِ ضعیف می‌لرزاند. */
  const [resumed, setResumed] = useState(0)
  useEffect(() => {
    const at = resumeAt(video.id)
    if (at > 0) setResumed(at)
  }, [video.id])

  /* ⚠️ آخرین جای دیده‌شده در یک ref نگه داشته می‌شود، نه خوانده‌شدن
     از خودِ عنصر هنگامِ پاک‌سازی. دو دلیل، هر دو واقعی:
       · هنگامِ unmount مقدارِ `mainRef.current` از قبل `null` است،
         پس آن نسخه هرگز چیزی نمی‌نوشت.
       · با جابه‌جایی بینِ دو ویدیو در همان کامپوننت، عنصر همان
         است ولی `src` عوض شده — یعنی جای *ویدیوی جدید* زیرِ نامِ
         ویدیوی قبلی ذخیره می‌شد. */
  const lastSave = useRef(0)
  const seen = useRef<{ slug: string; at: number; total: number } | null>(null)
  const onTime = () => {
    const el = mainRef.current
    if (!el || !el.duration || Number.isNaN(el.duration)) return
    seen.current = { slug: video.id, at: el.currentTime, total: el.duration }
    const now = Date.now()
    if (now - lastSave.current < 5000) return
    lastSave.current = now
    mark(video.id, el.currentTime, el.duration)
  }

  useEffect(() => {
    const flush = () => {
      const s = seen.current
      if (s && s.total > 0) mark(s.slug, s.at, s.total)
    }
    window.addEventListener('pagehide', flush)
    return () => { window.removeEventListener('pagehide', flush); flush(); seen.current = null }
  }, [video.id])

  const applyResume = () => {
    const el = mainRef.current
    if (el && resumed > 0 && el.currentTime < 1) el.currentTime = resumed
    setResumed(0)
  }

  const [copied, setCopied] = useState(false)
  const pageUrl = absoluteUrl(`/media/${encodeURIComponent(video.id)}`)
  const shareText = encodeURIComponent(video.title)
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true); window.setTimeout(() => setCopied(false), 1800)
    } catch { /* اجازه‌ی کلیپ‌بورد نبود */ }
  }

  const queue = useMemo(() => upNext(video, related), [video, related])

  return (
    <div className="mx" dir="rtl">
      <NavOffset />
      <div className="mx-wrap">
        <nav className="mx-crumbs" aria-label="مسیر">
          <Link href="/media">بیلیارد مدیا</Link>
          <ChevronLeft size={13} aria-hidden />
          <span>{video.title}</span>
        </nav>

        <div className="mx-watchgrid">
          <div>
            <div className="mx-player">
              {/* تبلیغ روی پلیر می‌نشیند و جای آن را نمی‌گیرد: عنصرِ
                  ویدیوی اصلی در DOM می‌ماند تا حالت و بافرش نپرد. */}
              {/* ⚠️ ریشه‌ی `PrerollAd` خودش `position: relative` است.
                  بدونِ این پوششِ absolute، تبلیغ *در جریانِ* قاب
                  می‌نشیند و ویدیوی اصلی را به پایین هل می‌دهد (که
                  `overflow:hidden` بعد می‌بُرَدش) — یعنی تبلیغ روی
                  ویدیو نمی‌نشیند، جایش را می‌گیرد. */}
              {adPlaying && ad && (
                <div className="mx-adlayer">
                  <PrerollAd ad={ad} onFinish={afterAd} />
                </div>
              )}
              <video
                ref={mainRef}
                src={video.src}
                poster={video.thumb || undefined}
                controls
                playsInline
                preload="metadata"
                onPlay={e => {
                  if (gateAd()) { e.currentTarget.pause(); return }
                  applyResume()
                  countView()
                }}
                onTimeUpdate={onTime}
              />
            </div>

            <h1 className="mx-watch-h">{video.title}</h1>

            <div className="mx-owner">
              <Avatar name={video.creator.name} />
              <div>
                <Link className="mx-by" href={`/media/channel/${encodeURIComponent(video.creator.handle)}`}>
                  <strong>{video.creator.name || <span dir="ltr">@{video.creator.handle}</span>}</strong>
                </Link>
                <div className="mx-sub">
                  {video.views > 0 && <span>{compactViews(video.views)} بازدید</span>}
                  {video.ts > 0 && <span>{faDate(new Date(video.ts))}</span>}
                </div>
              </div>

              {/* ⚠️ فقط کنش‌هایی که واقعاً کاری می‌کنند. */}
              <div className="mx-acts">
                <a className="mx-act" target="_blank" rel="noopener noreferrer"
                  href={`https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${shareText}`}>
                  <Send size={15} aria-hidden /> تلگرام
                </a>
                <a className="mx-act" target="_blank" rel="noopener noreferrer"
                  href={`https://wa.me/?text=${shareText}%0A${encodeURIComponent(pageUrl)}`}>
                  واتساپ
                </a>
                <button className="mx-act" type="button" onClick={copyLink}>
                  {copied ? <Check size={15} aria-hidden /> : <Link2 size={15} aria-hidden />}
                  {copied ? 'کپی شد' : 'کپی نشانی'}
                </button>
                <span className="mx-sr-only" role="status" aria-live="polite">
                  {copied ? 'نشانی کپی شد' : ''}
                </span>
              </div>
            </div>

            {video.description.length > 0 && (
              <div className="mx-desc">
                {video.description.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}

            {video.tags.length > 0 && (
              <div className="mx-tagrow">
                {video.tags.map(t => (
                  <Link key={t} className="mx-tag" href={`/media?q=${encodeURIComponent(t)}`}>{t}</Link>
                ))}
              </div>
            )}
          </div>

          {/* ── بعدی برای تماشا ──
              ⚠️ ترتیبش معنا دارد: هم‌کانال، بعد هم‌برچسب، بعد هم‌دسته. */}
          {queue.length > 0 && (
            <aside aria-labelledby="mx-next">
              <div className="mx-sec-hd"><h2 id="mx-next">بعدی برای تماشا</h2></div>
              <div className="mx-upnext">
                {queue.map(v => <MiniCard key={v.id} v={v} />)}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
