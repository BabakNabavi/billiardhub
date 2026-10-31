'use client'

/* ─────────────────────────────────────────────────────────────
   پخش‌کننده‌ی HLS — پخش زنده و ضبط‌های آرشیو.

   سافاری/آیفون HLS را خودشان پخش می‌کنند؛ فقط بقیه (کروم، اندروید)
   hls.js را **پویا** بار می‌کنند — باندلِ بقیه‌ی سایت سبک می‌ماند و
   کاربرِ آیفون هرگز آن را دانلود نمی‌کند.

   فایلِ ضبطِ غیرِ HLS (مثلاً mp4) مستقیم به <video> داده می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import { Loader2, WifiOff } from 'lucide-react'

type State = 'loading' | 'playing' | 'error'
const isHls = (u: string) => /\.m3u8(\?|$)/i.test(u)

export function HlsPlayer({ src, live = true, title }: { src: string; live?: boolean; title: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<State>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const v = video.current
    if (!v) return
    setState('loading')
    let destroy: (() => void) | null = null
    let cancelled = false

    const native = !isHls(src) || v.canPlayType('application/vnd.apple.mpegurl') !== ''
    if (native) {
      v.src = src
      destroy = () => { v.removeAttribute('src'); v.load() }
    } else {
      void (async () => {
        const { default: Hls } = await import('hls.js')
        if (cancelled) return
        if (!Hls.isSupported()) { setState('error'); return }
        const hls = new Hls({ lowLatencyMode: live, backBufferLength: live ? 30 : 90 })
        let retries = 0
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return
          /* شبکه: دو تلاشِ دوباره از خودِ hls.js، بعد پرده‌ی خطا با دکمه‌ی «تلاشِ دوباره» —
             بی‌سقف، مانیفستِ مرده تا ابد می‌چرخید */
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) { if (retries++ < 2) hls.startLoad(); else setState('error') }
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
          else setState('error')
        })
        hls.loadSource(src)
        hls.attachMedia(v)
        destroy = () => hls.destroy()
      })().catch(() => setState('error'))
    }
    return () => { cancelled = true; destroy?.() }
  }, [src, live, attempt])

  /* پخشِ زنده: باشگاه «شروع» را زده ولی دوربین هنوز وصل نشده (یا لحظه‌ای قطع شد) —
     به‌جای خطا، هر ۱۰ ثانیه خودش دوباره امتحان می‌کند */
  useEffect(() => {
    if (!live || state !== 'error') return
    const t = window.setTimeout(() => setAttempt(a => a + 1), 10_000)
    return () => window.clearTimeout(t)
  }, [live, state])

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-panel bg-black">
      <video
        ref={video}
        className="h-full w-full"
        controls
        playsInline
        autoPlay
        muted={live}
        aria-label={title}
        onPlaying={() => setState('playing')}
        onWaiting={() => setState(s => (s === 'error' ? s : 'loading'))}
        onError={() => setState('error')}
      />
      {state === 'loading' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/70" aria-hidden />
          <span className="sr-only">در حالِ بارگذاریِ تصویر</span>
        </div>
      )}
      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center text-white">
          <WifiOff className="h-8 w-8 text-white/70" aria-hidden />
          <p className="text-sub">{live ? 'در انتظارِ تصویر از باشگاه… خودکار دوباره وصل می‌شود.' : 'این ضبط فعلاً پخش نمی‌شود.'}</p>
          <button
            type="button"
            onClick={() => setAttempt(a => a + 1)}
            className="min-h-11 rounded-field border border-white/30 px-6 text-sub font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            تلاشِ دوباره
          </button>
        </div>
      )}
    </div>
  )
}
