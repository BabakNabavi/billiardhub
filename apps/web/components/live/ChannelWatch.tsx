'use client'

/* ─────────────────────────────────────────────────────────────
   تماشای یک کانال: اجازه‌ی تماشا + نشانیِ پخش + تپشِ بیننده.

   هر ۳۰ ثانیه یک تپش (فقط وقتی تب دیده می‌شود) — شمارِ بیننده‌ی
   هم‌زمان از همین است. تپش درخواستِ کوچکِ JSON است؛ تصویر مستقیم از
   CDNِ سرویسِ پخش می‌آید و به سرورِ سایت فشاری نمی‌آورد.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Eye, Lock, RadioTower } from 'lucide-react'
import { apiFetch } from '@/lib/http'
import { faNum } from '@/lib/jalali'
import { HlsPlayer } from './HlsPlayer'

const BEAT_MS = 30_000
/* کانالِ خاموش: آرام‌تر می‌پرسد تا اگر پخش شروع شد، صفحه‌ی باز خودش زنده شود */
const IDLE_MS = 60_000

function viewerId(): string {
  const make = () => `v${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`.slice(0, 32)
  if (typeof window === 'undefined') return make()
  try {
    const k = 'bh-viewer-id'
    const old = window.sessionStorage.getItem(k)
    if (old && /^[A-Za-z0-9_-]{8,40}$/.test(old)) return old
    const v = make()
    window.sessionStorage.setItem(k, v)
    return v
  } catch { return make() }
}

type Phase = 'connecting' | 'live' | 'ended' | 'login' | 'error'

export function ChannelWatch({ channelId, title, initialLive }: { channelId: string; title: string; initialLive: boolean }) {
  const [phase, setPhase] = useState<Phase>(initialLive ? 'connecting' : 'ended')
  const [url, setUrl] = useState<string | null>(null)
  const [viewers, setViewers] = useState(0)
  const [msg, setMsg] = useState('')
  const id = useRef<string>('')
  const gotUrl = useRef(false)

  const beat = useCallback(async () => {
    if (!id.current) id.current = viewerId()
    try {
      const r = await apiFetch(`/api/streams/${channelId}/play`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewerId: id.current, url: !gotUrl.current }),
      })
      const j = await r.json().catch(() => ({})) as { live?: boolean; viewers?: number; url?: string | null; message?: string; needLogin?: boolean }
      if (r.status === 401 && j.needLogin) { setPhase('login'); return }
      if (!r.ok) { setMsg(j.message ?? 'اتصال به پخش ممکن نشد'); setPhase('error'); return }
      if (!j.live) { setPhase('ended'); return }
      setViewers(j.viewers ?? 0)
      /* نشانیِ تهی (تصویر هنوز به سرویس نرسیده) دوباره پرسیده می‌شود */
      if (!gotUrl.current && j.url) { gotUrl.current = true; setUrl(j.url) }
      setPhase('live')
    } catch {
      /* قطعیِ لحظه‌ای: وضعیتِ قبلی می‌ماند، تپشِ بعدی دوباره می‌پرسد */
    }
  }, [channelId])

  const idle = phase === 'ended'
  useEffect(() => {
    if (!idle) void beat()
    const iv = window.setInterval(() => { if (document.visibilityState === 'visible') void beat() }, idle ? IDLE_MS : BEAT_MS)
    return () => window.clearInterval(iv)
  }, [beat, idle])

  if (phase === 'login') return (
    <Notice icon={<Lock className="h-7 w-7" aria-hidden />} text="تماشای این پخش فقط برای کاربرانِ عضوِ بیلیارد هاب است.">
      <Link href={`/login?next=/live/c/${channelId}`} className="lq-cta">ورود و تماشا</Link>
    </Notice>
  )
  if (phase === 'ended') return <Notice icon={<RadioTower className="h-7 w-7" aria-hidden />} text="این کانال الان پخش زنده ندارد. ضبط‌های قبلی (اگر باشد) پایینِ صفحه است." />
  if (phase === 'error') return <Notice icon={<RadioTower className="h-7 w-7" aria-hidden />} text={msg} />
  if (phase === 'connecting') return <div className="aspect-video w-full animate-pulse rounded-panel bg-ink/10" aria-label="در حالِ اتصال" />

  return (
    <div className="flex flex-col gap-3">
      {url
        ? <HlsPlayer src={url} title={title} />
        : <Notice icon={<RadioTower className="h-7 w-7" aria-hidden />} text="پخش شروع شده ولی تصویر هنوز از باشگاه به سرویسِ پخش نرسیده است. چند لحظه بعد صفحه را تازه کنید." />}
      <p className="flex items-center gap-2 text-meta text-ink-3">
        <span className="inline-flex items-center gap-1 rounded-chip bg-danger/10 px-2 py-1 font-bold text-danger">● زنده</span>
        <Eye className="h-4 w-4" aria-hidden /> {faNum(viewers)} بیننده
      </p>
    </div>
  )
}

function Notice({ icon, text, children }: { icon: React.ReactNode; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-panel bg-ink/[.04] px-6 text-center text-ink-2">
      <span className="text-ink-3">{icon}</span>
      <p className="max-w-md text-sub">{text}</p>
      {children}
    </div>
  )
}
