'use client'

/* ژورنالِ رویدادها.
   ⚠️ `audit_logs` از مهاجرتِ ۰۰۱ هست و امروز ۱۲۷ نوع رویداد در ۱۳۶
   نقطه در آن نوشته می‌شود — ولی تا پیش از این صفحه **هیچ‌کس
   نمی‌خواندش**. برای «کی ماه پیش کمیسیونِ این باشگاه را عوض کرد؟»
   باید psql می‌زدی. ردِ ممیزی که خوانده نشود ابزار نیست، یک تیکِ
   تشریفاتی است. */

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Loader2, AlertCircle, ScrollText, X } from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { toFaDigits, tehranInstant } from '../../../lib/jalali'
import { AuditTable, type AuditRow, type SessionRow } from '../../../components/admin/LogTable'
import { SessionTable } from '../../../components/admin/SessionTable'

const CARD = 'rounded-2xl border border-[#E7E2D6] bg-white shadow-[0_2px_10px_rgba(28,27,23,0.05)]'
const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7A66A]'
const INPUT = `w-full rounded-[10px] border border-[#E7E2D6] bg-white px-3 py-2.5 text-[12.5px] text-[#1C1B17] placeholder:text-[#9A968B] focus:border-[#C7A66A] ${RING}`
const LATIN_INPUT = `${INPUT} bh-latin`

type Tab = 'audit' | 'sessions'
interface Filters { action: string; actor: string; ip: string; from: string; to: string }
const EMPTY: Filters = { action: '', actor: '', ip: '', from: '', to: '' }

const TABS = [['audit', 'رویدادها'], ['sessions', 'نشست‌ها']] as const

export default function AdminLogsPage() {
  const [tab, setTab] = useState<Tab>('audit')
  const [f, setF] = useState<Filters>(EMPTY)
  const [rows, setRows] = useState<(AuditRow | SessionRow)[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [pendingTable, setPendingTable] = useState(false)
  const [pendingUA, setPendingUA] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setErr('')
    const qs = new URLSearchParams({ tab })
    /* فیلترِ خالی در کوئری نمی‌آید — وگرنه `eq('ip','')` هیچ ردیفی
       برنمی‌گرداند و صفحه بی‌دلیل خالی به‌نظر می‌رسد. */
    if (f.action) qs.set('action', f.action)
    if (f.actor) qs.set(tab === 'sessions' ? 'user' : 'actor', f.actor)
    if (f.ip) qs.set('ip', f.ip)
    /* ⚠️ `new Date('2026-09-27')` نیمه‌شبِ **UTC** است، یعنی ۳:۳۰
       بامدادِ تهران — و ستونِ زمان با ساعتِ تهران نمایش داده می‌شود.
       نسخه‌ی اول همین را می‌فرستاد و `to` هم *ابتدای* روز بود، پس
       «از امروز تا امروز» صفر ردیف می‌داد و ادمین نتیجه می‌گرفت
       «امروز اتفاقی نیفتاده» — بدترین شکستِ ممکن برای ابزارِ ممیزی. */
    if (f.from) qs.set('from', tehranInstant(`${f.from}T00:00`).toISOString())
    if (f.to) qs.set('to', tehranInstant(`${f.to}T23:59:59`).toISOString())
    try {
      const r = await apiFetch(`/api/admin/logs?${qs}`, { cache: 'no-store', signal })
      if (!r.ok) {
        setErr(r.status === 403 ? 'دسترسی مجاز نیست' : r.status === 400 ? 'فیلترِ نامعتبر' : 'خواندن ژورنال انجام نشد')
        return
      }
      const j = await r.json()
      setRows(j.rows ?? []); setNames(j.names ?? {})
      setPendingTable(!!j.pendingTable); setPendingUA(!!j.pendingUA)
    } catch (e) {
      /* لغوِ عمدی خطا نیست — درخواستِ بعدی جایش را گرفته است. */
      if ((e as { name?: string })?.name === 'AbortError') return
      setErr('ارتباط با سرور برقرار نشد')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [tab, f])

  /* ⚠️ هم تأخیر هم لغو. بدونِ تأخیر، تایپ‌کردنِ «LOGIN_FAILED» دوازده
     درخواستِ ۱۵۰ردیفی می‌فرستاد؛ بدونِ لغو، پاسخِ کندِ قبلی می‌توانست
     بعد از پاسخِ سریعِ بعدی بنشیند و جدول داده‌ای را نشان بدهد که با
     کادرِ فیلتر نمی‌خواند — در یک ابزارِ امنیتی، بدترین نوعِ خطا. */
  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => { void load(ctrl.signal) }, 350)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [load])

  const onFilter = (k: 'actor' | 'ip' | 'action', v: string) => setF(p => ({ ...p, [k]: v }))
  const dirty = Object.values(f).some(Boolean)

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-24 text-[#1C1B17]">
      <div className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-bold">ژورنال رویدادها</h1>
            <p className="mt-1 text-[12.5px] text-[#6F6A5C]">
              چه کسی، چه زمانی، از کجا، چه کرد. روی هر بازیگر یا IP بزنید تا فیلتر شود.
            </p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} aria-label="تازه‌سازی"
            className={`rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] p-3 text-[#8F6531] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${RING}`}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>

        <div className="mb-4 flex gap-2" role="tablist">
          {TABS.map(([k, label]) => (
            <button key={k} type="button" role="tab" id={`logtab-${k}`}
              aria-selected={tab === k} aria-controls="logpanel"
              tabIndex={tab === k ? 0 : -1}
              onClick={() => { setTab(k); setF(EMPTY) }}
              className={`rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition ${RING} ${
                tab === k ? 'bg-[#1C1B17] text-white' : 'border border-[#E7E2D6] bg-white text-[#5B564B] hover:border-[#C7A66A]'
              }`}>{label}</button>
          ))}
        </div>

        <div className={`${CARD} mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4`}>
          {tab === 'audit' && (
            <label className="col-span-2 sm:col-span-1">
              <span className="mb-1 block text-[11.5px] text-[#6F6A5C]">رویداد</span>
              <input className={LATIN_INPUT} dir="ltr" value={f.action} placeholder="LOGIN_FAILED"
                onChange={e => setF(p => ({ ...p, action: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))} />
            </label>
          )}
          <label>
            <span className="mb-1 block text-[11.5px] text-[#6F6A5C]">IP</span>
            <input className={LATIN_INPUT} dir="ltr" value={f.ip} placeholder="127.0.0.1"
              onChange={e => setF(p => ({ ...p, ip: e.target.value.trim() }))} />
          </label>
          <label>
            <span className="mb-1 block text-[11.5px] text-[#6F6A5C]">از تاریخ</span>
            <input type="date" dir="ltr" className={LATIN_INPUT} value={f.from}
              onChange={e => setF(p => ({ ...p, from: e.target.value }))} />
          </label>
          <label>
            <span className="mb-1 block text-[11.5px] text-[#6F6A5C]">تا تاریخ</span>
            <input type="date" dir="ltr" className={LATIN_INPUT} value={f.to}
              onChange={e => setF(p => ({ ...p, to: e.target.value }))} />
          </label>
          {dirty && (
            <button type="button" onClick={() => setF(EMPTY)}
              className={`col-span-2 self-end rounded-[10px] border border-[#E7E2D6] bg-white px-3 py-2.5 text-[12.5px] font-bold text-[#5B564B] transition hover:border-[#C7A66A] sm:col-span-4 ${RING}`}>
              <X size={13} className="me-1 inline" aria-hidden />پاک‌کردن فیلترها
            </button>
          )}
        </div>

        {pendingUA && rows.length > 0 && (
          <p className="mb-3 rounded-[10px] bg-[rgba(199,166,106,0.12)] px-3 py-2 text-[11.5px] text-[#8F6531]">
            ستون «دستگاه» خالی است چون مهاجرت ۱۰۴ هنوز اجرا نشده. بقیه‌ی ردیف‌ها درست‌اند.
          </p>
        )}

        <div id="logpanel" role="tabpanel" aria-labelledby={`logtab-${tab}`} className={`${CARD} overflow-hidden`}>
          {loading ? (
            <div className="space-y-2 p-4" aria-busy="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-[8px] bg-[#F0ECE2]" />
              ))}
            </div>
          ) : err ? (
            <div className="p-10 text-center">
              <AlertCircle size={22} className="mx-auto mb-2 text-[#B91C1C]" aria-hidden />
              <p className="text-[13px] font-semibold text-[#B91C1C]">{err}</p>
              <button type="button" onClick={() => void load()}
                className={`mt-3 rounded-[10px] border border-[#E7E2D6] bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5B564B] ${RING}`}>
                دوباره
              </button>
            </div>
          ) : !rows.length ? (
            <div className="p-10 text-center">
              <ScrollText size={22} className="mx-auto mb-2 text-[#9A968B]" aria-hidden />
              <p className="text-[13px] text-[#6F6A5C]">
                {pendingTable
                  ? 'این جدول هنوز در دیتابیس نیست.'
                  : dirty ? 'با این فیلترها چیزی پیدا نشد.' : 'هنوز رویدادی ثبت نشده.'}
              </p>
            </div>
          ) : tab === 'audit'
            ? <AuditTable rows={rows as AuditRow[]} names={names} onFilter={onFilter} />
            : <SessionTable rows={rows as SessionRow[]} names={names} onFilter={onFilter} />}
        </div>

        {!loading && !err && rows.length > 0 && (
          <p className="mt-3 text-center text-[11.5px] text-[#9A968B]">
            {toFaDigits(String(rows.length))} ردیف{rows.length >= 150 && ' — سقفِ هر صفحه؛ بازه‌ی تاریخ را تنگ‌تر کنید'}
          </p>
        )}
      </div>
    </div>
  )
}
