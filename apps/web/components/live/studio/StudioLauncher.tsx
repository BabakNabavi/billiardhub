'use client'

/* ─────────────────────────────────────────────────────────────
   ورود به استودیوی پخش — یک دکمه، در صفحه‌ی باشگاه و در داشبورد.

   `StudioLaunchButton`: فقط دکمه + استودیو.
   `LiveStudioLauncher`: برای تبِ «پخش زنده»ی صفحه‌ی باشگاه — اگر باشگاه
   کانالِ پخش (آروان) دارد، استودیو؛ وگرنه همان پخشِ قدیمیِ گوشی‌به‌گوشی
   (`fallback`). هرگز هر دو با هم — دو «آرتا»ی هم‌زمان در فهرست همین بود.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Radio } from 'lucide-react'
import { apiFetch } from '@/lib/http'
import { getServerSnapshot, getSnapshot, subscribe } from '@/lib/live/browser-publish'
import type { ManageState } from '@/lib/streaming/manage-types'
import { LiveStudio } from './LiveStudio'

export function StudioLaunchButton({ clubId, channelId, disabled, onClosed }: {
  clubId: string; channelId: string; disabled?: boolean; onClosed?: () => void
}) {
  const st = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [open, setOpen] = useState(false)
  const liveHere = st.channelId === channelId && (st.phase === 'live' || st.phase === 'connecting')
  return (
    <>
      <button type="button" disabled={disabled} onClick={() => setOpen(true)}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-card bg-danger px-6 text-body font-bold text-white transition-[background-color,transform] hover:bg-danger-ink active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        <Radio className="h-5 w-5" aria-hidden />
        {liveHere ? 'بازگشت به استودیو (در حال پخش)' : 'شروع پخش زنده'}
      </button>
      {open && <LiveStudio clubId={clubId} channelId={channelId} onClose={() => { setOpen(false); onClosed?.() }} />}
    </>
  )
}

export function LiveStudioLauncher({ clubId, fallback }: { clubId: string; fallback: React.ReactNode }) {
  const st = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [state, setState] = useState<ManageState | null | 'error'>(null)
  const load = useCallback(async () => {
    try {
      const r = await apiFetch(`/api/streams/manage?clubId=${clubId}`, { cache: 'no-store' })
      /* ⚠️ فقط پاسخِ موفقِ «کانال ندارد» به پخشِ قدیمی می‌رود. خطای شبکه/سرور
         نباید پخشِ گوشی‌به‌گوشی را کنارِ کانالِ آروان باز کند (دو «آرتا»ی هم‌زمان) */
      setState(r.ok ? await r.json() as ManageState : 'error')
    } catch { setState('error') }
  }, [clubId])
  useEffect(() => { void load() }, [load])

  if (state === null) return <div className="h-40 animate-pulse rounded-panel bg-ink/[.05]" role="status"><span className="sr-only">در حال بارگذاری</span></div>
  if (state === 'error') return (
    <div className="flex flex-col items-start gap-3 rounded-panel bg-danger/[.05] p-4 text-sub text-danger">
      اطلاعات پخش خوانده نشد
      <button type="button" onClick={() => { setState(null); void load() }}
        className="min-h-11 rounded-field border border-line/10 bg-surface px-4 text-ink hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">تلاش دوباره</button>
    </div>
  )
  const ch = state.channels?.find(c => c.browser && !c.adminBlocked)
  if (!ch) return <>{fallback}</>
  const publishingHere = st.channelId === ch.id && (st.phase === 'live' || st.phase === 'connecting')

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sub text-ink-2">
        با دوربین همین گوشی یا لپ‌تاپ پخش کنید، تماشاگران نامحدود پخش را در صفحه‌ی باشگاه و صفحه‌ی «پخش زنده» می‌بینند
      </p>
      {ch.isLive && !publishingHere && (
        <div className="flex flex-wrap items-center gap-2 text-sub text-ink-3">
          این کانال هم‌اکنون از دستگاه دیگری در حال پخش است
          {/* اگر آن دستگاه رفته (پخشِ جامانده)، از همین‌جا تمام شود — منتظرِ پاک‌سازیِ خودکار نماند */}
          <button type="button" className="min-h-11 rounded-field px-3 font-bold text-danger hover:bg-danger/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            onClick={async () => {
              await apiFetch('/api/streams/manage', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop', clubId, channelId: ch.id }),
              }).catch(e => console.error('[launcher] stop', e))
              void load()
            }}>پایان دادن به آن پخش</button>
        </div>
      )}
      <StudioLaunchButton clubId={clubId} channelId={ch.id} disabled={ch.isLive && !publishingHere} onClosed={() => void load()} />
    </div>
  )
}
