'use client'

/* ─────────────────────────────────────────────────────────────
   «پخش با دوربینِ همین گوشی/لپ‌تاپ» — یک دکمه برای باشگاه‌دار.

   زدنِ دکمه: دوربین روشن ⟵ اتصال به سرویسِ پخش (مستقیم یا از راهِ رله) ⟵
   وقتی تصویر واقعاً رسید، کانال روی سایت «زنده» می‌شود. «پایان» همه را
   برعکس. هیچ اپ، نشانی یا کلیدی جلوی باشگاه‌دار نیست.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { Loader2, RefreshCcw, Square, Video } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/http'
import {
  getServerSnapshot, getSnapshot, openCamera, startPublish, stopPublish, subscribe,
} from '@/lib/live/browser-publish'
import type { ManageAction, OwnerChannel } from '@/lib/streaming/manage-types'

export function BrowserGoLive({ ch, clubId, run }: {
  ch: OwnerChannel; clubId: string; run: (a: ManageAction) => Promise<boolean>
}) {
  const st = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const video = useRef<HTMLVideoElement>(null)
  const mine = st.channelId === ch.id || st.channelId === null
  const busyElsewhere = !mine && (st.phase === 'connecting' || st.phase === 'live')

  useEffect(() => {
    const v = video.current
    if (v && v.srcObject !== st.stream) v.srcObject = st.stream
  }, [st.stream])

  const start = () => startPublish(ch.id,
    async () => {
      const r = await apiFetch('/api/streams/manage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'browser-session', clubId, channelId: ch.id }),
      })
      const j = await r.json().catch(() => ({})) as { message?: string; mode?: 'whip' | 'relay'; url?: string; token?: string | null }
      if (!r.ok || !j.mode || !j.url) throw new Error(j.message ?? 'اتصال به سرویسِ پخش ممکن نشد.')
      return j.mode === 'whip' ? { mode: 'whip', url: j.url, token: j.token ?? null } : { mode: 'relay', url: j.url, token: String(j.token) }
    },
    async () => {
      /* تصویر رسید ⟵ کانال روی سایت زنده */
      if (!(await run({ action: 'start', channelId: ch.id }))) throw new Error('start')
    },
    unloading => {
      /* پخشِ زنده ناخواسته قطع شد ⟵ کانال روی سایت هم خاموش؛ هنگامِ بستنِ صفحه
         keepalive تا درخواست با صفحه نمیرد */
      if (!unloading) { void run({ action: 'stop', channelId: ch.id }); return }
      void apiFetch('/api/streams/manage', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', clubId, channelId: ch.id }),
      }).catch(() => undefined)
    })

  const stop = async () => {
    stopPublish()
    if (ch.isLive) await run({ action: 'stop', channelId: ch.id })
  }

  if (busyElsewhere) return <p className="text-sub text-ink-3">این دستگاه در حالِ پخشِ کانالِ دیگری است.</p>

  const showPreview = mine && !!st.stream
  const live = mine && st.phase === 'live'
  const connecting = mine && st.phase === 'connecting'
  const starting = mine && st.phase === 'starting'
  /* کانال از OBS/دوربینِ سالن زنده است — این دکمه رقیبش نشود */
  const liveElsewhere = ch.isLive && !live && !connecting

  return (
    <div className="flex flex-col gap-3 rounded-card bg-ink/[.03] p-3">
      {showPreview && (
        <div className="relative aspect-video w-full overflow-hidden rounded-card bg-black">
          <video ref={video} autoPlay muted playsInline className={`h-full w-full object-cover ${st.facing === 'user' ? '-scale-x-100' : ''}`} aria-label="پیش‌نمایشِ دوربین" />
          {live && <span className="absolute start-2 top-2 rounded-chip bg-danger px-2 py-1 text-meta font-bold text-white">● زنده روی سایت</span>}
          {connecting && (
            <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 text-sub text-white">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> در حالِ اتصال به سرویسِ پخش…
            </span>
          )}
        </div>
      )}

      {mine && st.phase === 'error' && <p role="alert" className="text-sub text-danger">{st.error}</p>}
      {live && st.slow && <p className="text-sub text-danger">اینترنتِ آپلودِ این دستگاه کند است؛ ممکن است تصویر برای بیننده‌ها گیر کند.</p>}

      <div className="flex flex-wrap items-center gap-2">
        {live || connecting ? (
          <Button variant="danger" size="lg" block onClick={() => void stop()} icon={<Square className="h-4 w-4" aria-hidden />}>
            پایانِ پخش
          </Button>
        ) : (
          <Button size="lg" block loading={starting} loadingText="در حالِ روشن‌کردنِ دوربین…" disabled={ch.adminBlocked || liveElsewhere}
            onClick={() => void start()} icon={<Video className="h-5 w-5" aria-hidden />}>
            {liveElsewhere ? 'این کانال از دستگاهِ دیگری در حالِ پخش است' : 'پخش با دوربینِ همین دستگاه'}
          </Button>
        )}
        {showPreview && !live && !connecting && !starting && (
          <Button variant="secondary" size="sm" onClick={() => void openCamera(st.facing === 'user' ? 'environment' : 'user')}
            icon={<RefreshCcw className="h-4 w-4" aria-hidden />}>چرخاندنِ دوربین</Button>
        )}
      </div>
      {live && <p className="text-meta text-ink-3">تا پایانِ پخش این صفحه را باز نگه دارید و گوشی را به شارژ وصل کنید.</p>}
    </div>
  )
}
