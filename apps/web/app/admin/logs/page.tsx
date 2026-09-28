'use client'

/* ژورنالِ رویدادها.
   ⚠️ `audit_logs` از مهاجرتِ ۰۰۱ هست و امروز ۱۲۷ نوع رویداد در ۱۳۶
   نقطه در آن نوشته می‌شود — ولی تا پیش از این صفحه **هیچ‌کس
   نمی‌خواندش**. برای «کی ماه پیش کمیسیونِ این باشگاه را عوض کرد؟»
   باید psql می‌زدی. ردِ ممیزی که خوانده نشود ابزار نیست.

   کارتِ فیلتر در `components/admin/LogFilters` است تا این فایل از
   ~۱۵۰ خطِ قاعده‌ی پروژه رد نشود. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, Loader2, AlertCircle, ScrollText } from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { toFaDigits, tehranInstant } from '../../../lib/jalali'
import { AuditTable, type AuditRow, type SessionRow } from '../../../components/admin/LogTable'
import { SessionTable } from '../../../components/admin/SessionTable'
import {
  LogFilters, EMPTY_FILTERS, hasActiveFilter,
  type Filters, type Tab,
} from '../../../components/admin/LogFilters'

const CARD = 'rounded-2xl border border-[#E7E2D6] bg-white shadow-[0_2px_10px_rgba(28,27,23,0.05)]'
const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7A66A]'

const TABS = [['audit', 'رویدادها'], ['sessions', 'نشست‌ها']] as const

export default function AdminLogsPage() {
  const [tab, setTab] = useState<Tab>('audit')
  const [f, setF] = useState<Filters>(EMPTY_FILTERS)
  const [rows, setRows] = useState<(AuditRow | SessionRow)[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [actions, setActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [pendingTable, setPendingTable] = useState(false)
  const [pendingUA, setPendingUA] = useState(false)

  /* ⚠️ کنترلرِ درخواستِ دستی (دکمه‌ی تازه‌سازی و «دوباره»). بدونِ این،
     آن دو مسیر لغوناپذیر بودند: کلیک روی تازه‌سازی و بعد تعویضِ تب،
     پاسخِ قدیمی را وسطِ تبِ جدید می‌نشاند و `SessionTable` آرایه‌ی
     `AuditRow` می‌گرفت — همان باگی که برای مسیرِ دیباونس بسته شده بود. */
  const manualCtrl = useRef<AbortController | null>(null)

  /* فهرستِ کنش‌ها یک‌بار گرفته می‌شود، نه با هر فیلتر. اگر مهاجرتِ ۱۰۶
     اجرا نشده باشد خالی برمی‌گردد و از خودِ ردیف‌ها ساخته می‌شود. */
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const r = await apiFetch('/api/admin/logs?actions=1', { cache: 'no-store' })
        if (!r.ok || !alive) return
        const j = await r.json()
        if (alive) setActions(Array.isArray(j.actions) ? j.actions : [])
      } catch { /* بی‌اهمیت؛ از ردیف‌ها ساخته می‌شود */ }
    })()
    return () => { alive = false }
  }, [])

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setErr('')
    const qs = new URLSearchParams({ tab })
    /* فیلترِ خالی در کوئری نمی‌آید — وگرنه `eq('ip','')` هیچ ردیفی
       برنمی‌گرداند و صفحه بی‌دلیل خالی به‌نظر می‌رسد. */
    if (f.action) qs.set('action', f.action)
    if (f.actor) qs.set(tab === 'sessions' ? 'user' : 'actor', f.actor)
    if (f.ip) qs.set('ip', f.ip)
    if (tab === 'sessions' && f.live) qs.set('live', '1')
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
      setRows(j.rows ?? [])
      /* ⚠️ ادغام، نه جایگزینی. اگر فیلتری صفر ردیف بدهد، پاسخ
         `names: {}` دارد و برچسبِ تراشه از «بازیگر: علی رضایی» به
         UUIDِ خام پس‌رفت می‌کرد. */
      setNames(p => ({ ...p, ...(j.names ?? {}) }))
      setPendingTable(!!j.pendingTable); setPendingUA(!!j.pendingUA)
    } catch (e) {
      /* لغوِ عمدی خطا نیست — درخواستِ بعدی جایش را گرفته است. */
      if ((e as { name?: string })?.name === 'AbortError') return
      setErr('ارتباط با سرور برقرار نشد')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [tab, f])

  /* ⚠️ هم تأخیر هم لغو. بدونِ تأخیر، هر تغییرِ فیلتر یک درخواستِ
     ۱۵۰ردیفی می‌فرستاد؛ بدونِ لغو، پاسخِ کندِ قبلی می‌توانست بعد از
     پاسخِ سریعِ بعدی بنشیند و جدول داده‌ای را نشان بدهد که با کادرِ
     فیلتر نمی‌خواند — در یک ابزارِ امنیتی بدترین نوعِ خطا. */
  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => { void load(ctrl.signal) }, 350)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [load])

  const reload = () => {
    manualCtrl.current?.abort()
    const c = new AbortController()
    manualCtrl.current = c
    void load(c.signal)
  }

  /* ⚠️ تعویضِ تب باید ردیف‌ها را هم پاک کند و درخواستِ دستیِ در پرواز
     را لغو. `tab` فوری عوض می‌شود ولی `rows` تا پایانِ fetch همان قبلی
     می‌ماند — یعنی `SessionTable` آرایه‌ی `AuditRow` می‌گرفت. */
  const switchTab = (k: Tab) => {
    if (k === tab) return
    manualCtrl.current?.abort()
    setTab(k); setF(EMPTY_FILTERS); setRows([]); setLoading(true)
  }

  const onFilter = (k: 'actor' | 'ip' | 'action', v: string) => setF(p => ({ ...p, [k]: v }))

  /* دراپ‌داون: فهرستِ سرور، به‌اضافه‌ی هر کنشی که در ردیف‌های همین
     صفحه هست (برای وقتی مهاجرتِ ۱۰۶ هنوز اجرا نشده). */
  const actionOptions = useMemo(() => {
    const seen = new Set(actions)
    for (const r of rows) {
      const a = (r as AuditRow).action
      if (a) seen.add(a)
    }
    /* مقدارِ انتخاب‌شده همیشه باید گزینه داشته باشد، وگرنه `select`ِ
       کنترل‌شده بی‌صدا خالی می‌شود. */
    if (f.action) seen.add(f.action)
    return [...seen].sort()
  }, [actions, rows, f.action])

  const dirty = hasActiveFilter(f)

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
          <button type="button" onClick={reload} disabled={loading} aria-label="تازه‌سازی"
            className={`rounded-[10px] border border-[rgba(199,166,106,0.34)] bg-[rgba(199,166,106,0.12)] p-3 text-[#8F6531] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${RING}`}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>

        {/* ⚠️ بدونِ `tabIndex`ِ چرخشی. نسخه‌ی قبلی تبِ غیرفعال را
            `tabIndex={-1}` می‌کرد بی‌آنکه کلیدِ جهت‌دار را هندل کند —
            یعنی کاربرِ کیبورد اصلا نمی‌توانست به آن برسد. دو دکمه‌ی
            عادیِ tab-pذیر درست‌تر است. */}
        <div className="mb-4 flex gap-2" role="tablist">
          {TABS.map(([k, label]) => (
            <button key={k} type="button" role="tab" id={`logtab-${k}`}
              aria-selected={tab === k} aria-controls="logpanel"
              onClick={() => switchTab(k)}
              className={`rounded-[10px] px-4 py-2.5 text-[13px] font-bold transition ${RING} ${
                tab === k ? 'bg-[#1C1B17] text-white' : 'border border-[#E7E2D6] bg-white text-[#5B564B] hover:border-[#C7A66A]'
              }`}>{label}</button>
          ))}
        </div>

        <div className={`${CARD} mb-4 p-4`}>
          <LogFilters tab={tab} f={f} setF={setF} actionOptions={actionOptions} names={names} />
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
              <button type="button" onClick={reload}
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
