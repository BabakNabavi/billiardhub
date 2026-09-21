'use client'

/* ژورنالِ خطا — تا امروز اگر صفحه‌ای برای کاربری می‌شکست، تنها
   کسی که می‌فهمید خودِ کاربر بود.

   ردیف‌ها بر پایه‌ی اثرانگشت تجمیع شده‌اند: هر خطای یکتا یک ردیف با
   شمارنده. پس «۲۰۰ ردیف» یعنی ۲۰۰ باگِ متمایز، نه ۲۰۰ رخداد. */

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, Loader2, RefreshCw, Server, Monitor } from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { toFaDigits } from '../../../lib/jalali'

interface Row {
  id: number
  source: 'client' | 'server'
  message: string
  stack?: string | null
  url: string | null
  release: string | null
  hits: number
  first_seen: string
  last_seen: string
  resolved: boolean
}

const CARD = 'rounded-2xl border border-[#E7E2D6] bg-white shadow-[0_2px_10px_rgba(28,27,23,0.05)]'
/* حلقه‌ی فوکوس یک‌جا — قاعده‌ی پروژه می‌گوید روی *همه‌ی* المان‌های
   تعاملی، و سه جا تکرار شده بود. */
const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7A66A]'

/* «۳ دقیقه پیش» — عددِ خام تاریخ برای تشخیصِ «الان دارد می‌افتد یا
   هفته‌ی پیش بود» بی‌فایده است. */
function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'همین الان'
  const m = s / 60
  if (m < 60) return `${toFaDigits(String(Math.floor(m)))} دقیقه پیش`
  const h = m / 60
  if (h < 24) return `${toFaDigits(String(Math.floor(h)))} ساعت پیش`
  return `${toFaDigits(String(Math.floor(h / 24)))} روز پیش`
}

export default function AdminErrorsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [pending, setPending] = useState(false)
  const [openOnly, setOpenOnly] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [stacks, setStacks] = useState<Record<number, string>>({})

  /* ⚠️ پشته در فهرست نمی‌آید (حجمش)، پس همین‌جا و فقط برای همان
     ردیف گرفته می‌شود. */
  const toggleStack = async (id: number) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (stacks[id] !== undefined) return
    try {
      const r = await apiFetch(`/api/admin/errors?open=${openOnly ? '1' : '0'}&stack=${id}`, { cache: 'no-store' })
      if (!r.ok) return
      const j = await r.json()
      setStacks(s => ({ ...s, [id]: String(j.stack ?? '') }))
    } catch { /* پشته نیامد؛ خودِ پیام همچنان هست */ }
  }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const r = await apiFetch(`/api/admin/errors?open=${openOnly ? '1' : '0'}`, { cache: 'no-store' })
      if (!r.ok) { setErr(r.status === 403 ? 'دسترسی مجاز نیست' : 'خواندن ژورنال انجام نشد'); return }
      const j = await r.json()
      setRows(j.rows ?? []); setPending(!!j.pending)
    } catch {
      setErr('ارتباط با سرور برقرار نشد')
    } finally {
      setLoading(false)
    }
  }, [openOnly])

  useEffect(() => { void load() }, [load])

  const resolve = async (id: number, resolved: boolean) => {
    setBusyId(id)
    try {
      const r = await apiFetch('/api/admin/errors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolved }),
      })
      if (!r.ok) return
      /* ⚠️ نسخه‌ی اول `filter(x => x.id !== id || !openOnly)` بود:
         در نمای «همه» شرط برای هر ردیف درست می‌شد، پس هیچ‌چیز عوض
         نمی‌شد و برچسبِ دکمه روی مقدارِ قبلی می‌ماند. */
      setRows(v => openOnly
        ? v.filter(x => x.id !== id)
        : v.map(x => (x.id === id ? { ...x, resolved } : x)))
    } finally { setBusyId(null) }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F7F5F0] pb-24 text-[#1C1B17]">
      <div className="mx-auto max-w-[1100px] px-4 pt-6 sm:px-6">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-bold">ژورنال خطا</h1>
            <p className="mt-1 text-[12.5px] text-[#6F6A5C]">
              خطاهای سرور و مرورگر، تجمیع‌شده بر اساس نوع. هر ردیف یک باگ است، نه یک رخداد.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOpenOnly(v => !v)}
              className={`rounded-[10px] border border-[#E7E2D6] bg-white px-4 py-3 text-[13px] font-bold text-[#5B564B] transition hover:border-[#C7A66A] ${RING}`}>
              {openOnly ? 'فقط رسیدگی‌نشده‌ها' : 'همه'}
            </button>
            <button type="button" onClick={() => void load()} disabled={loading}
              aria-label="تازه‌سازی"
              className={`rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] p-3 text-[#8F6531] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${RING}`}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {pending && (
          <div className={`${CARD} mb-4 p-4 text-[13px] text-[#8F6531]`}>
            جدول ژورنال هنوز ساخته نشده — مهاجرت ۰۹۸ اجرا نشده است.
          </div>
        )}

        {/* سه حالتِ لازم برای هر فهرست: لودینگ، خطا، خالی */}
        {loading && (
          <div className={`${CARD} space-y-3 p-5`}>
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[#F2EFE7]" />
            ))}
          </div>
        )}

        {!loading && err && (
          <div className={`${CARD} p-6 text-center`}>
            <p className="text-[13.5px] font-bold text-[#B23B2E]">{err}</p>
            <button type="button" onClick={() => void load()}
              className={`mt-3 rounded-[10px] border border-[#E7E2D6] bg-white px-4 py-2 text-[12.5px] font-bold text-[#5B564B] transition hover:border-[#C7A66A] ${RING}`}>
              تلاش دوباره
            </button>
          </div>
        )}

        {!loading && !err && rows.length === 0 && (
          <div className={`${CARD} p-10 text-center`}>
            <Check size={26} className="mx-auto mb-3 text-[#0E7A38]" aria-hidden />
            <p className="text-[13.5px] font-bold">هیچ خطای رسیدگی‌نشده‌ای نیست.</p>
            <p className="mt-1 text-[12px] text-[#6F6A5C]">اگر تازه راه افتاده، چند ساعت طول می‌کشد تا چیزی جمع شود.</p>
          </div>
        )}

        {!loading && !err && rows.length > 0 && (
          <ul className="space-y-3">
            {rows.map(r => (
              <li key={r.id} className={`${CARD} p-4`}>
                <div className="flex flex-wrap items-start gap-3">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    r.source === 'server'
                      ? 'bg-[rgba(178,59,46,0.08)] text-[#B23B2E]'
                      : 'bg-[rgba(199,166,106,0.14)] text-[#8F6531]'}`}>
                    {r.source === 'server' ? <Server size={15} /> : <Monitor size={15} />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[13.5px] font-bold leading-relaxed">{r.message}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#6F6A5C]">
                      <span className="font-bold text-[#B23B2E]">
                        {toFaDigits(String(r.hits))} بار
                      </span>
                      <span>آخرین: {ago(r.last_seen)}</span>
                      <span>اولین: {ago(r.first_seen)}</span>
                      {r.release && <span dir="ltr" className="font-mono">{r.release.slice(0, 8)}</span>}
                    </p>
                    {r.url && (
                      <p dir="ltr" className="mt-1 truncate text-start text-[11px] text-[#A69F8E]">{r.url}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {(
                      <button type="button" onClick={() => void toggleStack(r.id)}
                        aria-expanded={expanded === r.id}
                        className={`rounded-lg border border-[#E7E2D6] px-3 py-2 text-[11.5px] font-bold text-[#5B564B] transition hover:border-[#C7A66A] ${RING}`}>
                        {expanded === r.id ? 'بستن' : 'پشته'}
                      </button>
                    )}
                    <button type="button" onClick={() => void resolve(r.id, !r.resolved)} disabled={busyId === r.id}
                      className={`rounded-lg border border-[rgba(14,122,56,0.22)] bg-[rgba(14,122,56,0.08)] px-3 py-2 text-[11.5px] font-bold text-[#0E7A38] transition hover:bg-[rgba(14,122,56,0.14)] disabled:cursor-not-allowed disabled:opacity-50 ${RING}`}>
                      {busyId === r.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : r.resolved ? 'بازکردن' : 'رسیدگی شد'}
                    </button>
                  </div>
                </div>

                {expanded === r.id && (
                  <pre dir="ltr" className="mt-3 max-h-64 overflow-auto rounded-xl bg-[#1A1A18] p-3 text-start text-[11px] leading-relaxed text-[#D6D2C8]">
                    {stacks[r.id] ?? 'در حال دریافت…'}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}

        {!loading && !err && rows.length > 0 && (
          <p className="mt-4 flex items-center justify-center gap-2 text-[11.5px] text-[#6F6A5C]">
            <AlertTriangle size={13} aria-hidden />
            پرتکرارترین‌ها را اول ببین؛ عددِ «بار» یعنی چند کاربر به آن خورده‌اند.
          </p>
        )}
      </div>
    </div>
  )
}
