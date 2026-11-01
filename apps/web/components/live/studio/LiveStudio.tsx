'use client'

/* ─────────────────────────────────────────────────────────────
   استودیوی پخش — تمام‌صفحه، مثلِ اپ‌های پخشِ حرفه‌ای (Larix).

   دوربین کلِ صفحه را می‌گیرد (عمودی یا افقی). بالا وسط: وضعیت (زنده،
   زمان، بیننده). پایین وسط: یک دکمه‌ی بزرگِ شروع/پایان. کنارش: چرخاندنِ
   دوربین (جلو/پشت)، بی‌صدا، و «افقی» (روی اندروید صفحه را افقی قفل می‌کند).
   دوربینِ پیش‌فرض همیشه دوربینِ اصلیِ پشت است — باشگاه‌دار بینِ «واید» و
   «اولترا واید» انتخاب نمی‌کند.

   ⚠️ هرگز کاربر را گیر نیندازد: «پایان» در حالِ اتصال هم کار می‌کند، اتصال
   سقفِ زمان دارد (browser-publish)، و بسته‌شدنِ استودیو از هر راهی (دکمه،
   Escape، برگشتِ اندروید، عوض‌شدنِ صفحه) دوربین و تمام‌صفحه را آزاد می‌کند —
   مگر پخش زنده باشد، که عمداً ادامه می‌یابد.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { z } from 'zod'
import { Eye, Loader2, Mic, MicOff, RefreshCcw, RotateCw, X } from 'lucide-react'
import { apiFetch } from '@/lib/http'
import { faNum, toFaDigits } from '@/lib/jalali'
import {
  getServerSnapshot, getSnapshot, isPublishing, openCamera, startPublish, stopPublish, subscribe,
} from '@/lib/live/browser-publish'
import { StudioButton } from './StudioButton'
import { useStudioClock, useStudioViewers, usePortrait, lockLandscape, releaseScreen, useDialogFocus } from './studio-hooks'

const Session = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('whip'), url: z.string().url(), token: z.string().nullable() }),
  z.object({ mode: z.literal('relay'), url: z.string().url(), token: z.string().min(1) }),
])

export function LiveStudio({ clubId, channelId, onClose }: { clubId: string; channelId: string; onClose: () => void }) {
  const st = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const root = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const startP = useRef<Promise<unknown> | null>(null)
  const hintTimer = useRef(0)
  /* بازکردنِ دوباره‌ی استودیو وسطِ پخش: وضعیتِ بی‌صدا همان بماند */
  const [muted, setMuted] = useState(() => getSnapshot().stream?.getAudioTracks().some(t => !t.enabled) ?? false)
  const [hint, setHint] = useState('')
  const [stopping, setStopping] = useState(false)
  const mine = st.channelId === channelId
  const live = st.phase === 'live' && mine
  const connecting = st.phase === 'connecting' && mine
  const starting = st.phase === 'starting'
  const portrait = usePortrait()
  const clock = useStudioClock(live ? st.liveSince : null)
  const viewers = useStudioViewers(clubId, channelId, live)

  const say = (msg: string, ms = 3500) => {
    window.clearTimeout(hintTimer.current)
    setHint(msg)
    hintTimer.current = window.setTimeout(() => setHint(''), ms)
  }

  const call = async (action: 'browser-session' | 'start' | 'stop') => {
    const r = await apiFetch('/api/streams/manage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      ...(action === 'stop' ? { keepalive: true } : {}),
      body: JSON.stringify({ action, channelId, clubId }),
    })
    const j = await r.json().catch(() => ({})) as Record<string, unknown> & { message?: string }
    if (!r.ok) throw new Error(j.message ?? 'انجام نشد')
    return j
  }

  /* باز شدن = روشن شدنِ دوربین و قفلِ اسکرول. بسته شدن از هر راهی = آزادکردنِ
     دوربین و تمام‌صفحه، مگر پخش زنده باشد */
  useEffect(() => {
    if (!getSnapshot().stream) void openCamera('environment')
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      window.clearTimeout(hintTimer.current)
      if (!isPublishing()) { stopPublish(); releaseScreen() }
    }
  }, [])

  useEffect(() => {
    const v = video.current
    if (v && v.srcObject !== st.stream) v.srcObject = st.stream
    st.stream?.getAudioTracks().forEach(t => { t.enabled = !muted })
  }, [st.stream, muted])

  const start = () => startPublish(channelId,
    async () => {
      const parsed = Session.safeParse(await call('browser-session'))
      if (!parsed.success) throw new Error('پاسخِ سرور برای اتصالِ پخش نامعتبر بود.')
      return parsed.data
    },
    async () => { startP.current = call('start'); await startP.current },
    () => { void call('stop').catch(e => console.error('[studio] auto-stop', e)) })

  const stop = async () => {
    if (stopping) return
    setStopping(true)
    stopPublish()
    /* «شروع» هنوز در راه است؟ اول برسد، وگرنه «پایان» پیش از آن می‌رسد و کانال باز می‌ماند */
    await startP.current?.catch(() => undefined)
    startP.current = null
    try {
      await call('stop')
      releaseScreen()
      onClose()
    } catch (e) {
      console.error('[studio] stop', e)
      say('پایانِ پخش روی سایت ثبت نشد؛ دوباره «پایان» را بزنید.', 6000)
      setStopping(false)
    }
  }

  const close = () => {
    if (live) return
    stopPublish(); releaseScreen(); onClose()
  }

  useDialogFocus(root, close)

  const busy = starting || stopping
  return createPortal(
    <div ref={root} role="dialog" aria-modal="true" aria-label="استودیوی پخش زنده" className="fixed inset-0 z-[1000] bg-black text-white">
      <video ref={video} autoPlay muted playsInline aria-hidden
        className={`absolute inset-0 h-full w-full object-cover ${st.facing === 'user' ? '-scale-x-100' : ''}`} />
      {!st.stream && st.phase !== 'error' && (
        <div className="absolute inset-0 flex items-center justify-center" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" aria-hidden /><span className="sr-only">روشن‌شدنِ دوربین</span>
        </div>
      )}

      {/* بالا */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent px-4 pb-8"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <StudioButton label="بستن" onClick={close} disabled={live}><X className="h-5 w-5" /></StudioButton>
        <div className="flex items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-sub font-bold backdrop-blur" role="status" aria-live="polite">
          {live ? (<>
            <span className="h-2 w-2 animate-pulse rounded-full bg-danger" aria-hidden />
            زنده <span dir="ltr" className="tabular-nums">{toFaDigits(clock)}</span>
            <span className="inline-flex items-center gap-1 text-white/80"><Eye className="h-4 w-4" aria-hidden />{faNum(viewers)}</span>
          </>) : connecting || starting ? (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> در حالِ اتصال…</>) : 'آماده‌ی پخش'}
        </div>
        <StudioButton label="بی‌صدا" pressed={muted} onClick={() => setMuted(m => !m)}>
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </StudioButton>
      </div>

      {/* پیام‌ها وسطِ صفحه */}
      {(st.phase === 'error' || hint || (portrait && !live)) && (
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-center">
          <p role={st.phase === 'error' ? 'alert' : 'status'} className="max-w-sm rounded-card bg-black/70 px-4 py-3 text-center text-sub backdrop-blur">
            {hint || (st.phase === 'error' ? st.error : 'برای تصویرِ بهتر، گوشی را افقی بگیرید')}
          </p>
        </div>
      )}

      {/* پایین */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-8 bg-gradient-to-t from-black/60 to-transparent px-4 pt-12"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
        <StudioButton label="چرخاندنِ دوربین (جلو/پشت)" disabled={live || connecting || busy}
          onClick={() => void openCamera(st.facing === 'user' ? 'environment' : 'user')}><RefreshCcw className="h-5 w-5" /></StudioButton>
        {/* در «اتصال» هم پایان‌پذیر — هرگز گیر نمی‌کند */}
        <button type="button" data-autofocus onClick={() => void (live || connecting ? stop() : start())}
          disabled={busy || (!live && !connecting && !st.stream)}
          aria-label={live || connecting ? 'پایانِ پخش' : 'شروعِ پخش'}
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/90 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 disabled:opacity-50">
          {busy ? <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            : live || connecting ? <span className="h-8 w-8 rounded-field bg-danger" aria-hidden />
            : <span className="h-14 w-14 rounded-full bg-danger" aria-hidden />}
        </button>
        <StudioButton label="حالتِ افقی" onClick={async () => { if (!(await lockLandscape())) say('گوشی را بچرخانید تا افقی شود') }}>
          <RotateCw className="h-5 w-5" />
        </StudioButton>
      </div>
    </div>,
    document.body,
  )
}
