'use client'

/* ─────────────────────────────────────────────────────────────
   فرمِ درخواستِ کلاس یا مشاوره از مربی — سمتِ شاگرد (آذرِ ۱۴۰۵).

   شاگرد زمان تعیین نمی‌کند: نوع، رشته، سطح، زمان‌های مناسبِ کلی و پیامی
   کوتاه. مربی پیامکی با نام و شماره‌ی شاگرد می‌گیرد و خودش تماس می‌گیرد.
   گزینه‌ها از lib/coach/request-options (همان کلیدهای API و مهاجرت).

   ── چرا وضعیت در مرورگر خوانده می‌شود ──
   «وارد شده‌ای؟ درخواستِ بازی داری؟» به نشستِ همین بازدیدکننده بسته است و
   apiFetch روی ۴۰۱ نشست را یک‌بار تازه می‌کند؛ رندرِ سرور نمی‌تواند کوکیِ
   تازه بنویسد و کاربرِ واردشده با توکنِ کهنه را «مهمان» می‌دید.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { ChoiceChips } from '../ui/ChoiceChips'
import { apiFetch } from '../../lib/http'
import { toFaDigits } from '../../lib/jalali'
import { REQUEST_KINDS, REQUEST_LEVELS, REQUEST_TIMES, REQUEST_MESSAGE_MAX } from '../../lib/coach/request-options'
import { RequestSkeleton, GuestState, SelfState, ErrorState, UnavailableState, OpenState, SentState } from './CoachRequestStates'

type View =
  | { v: 'loading' } | { v: 'guest' } | { v: 'self' } | { v: 'error' } | { v: 'unavailable' } | { v: 'sent' }
  | { v: 'open'; id: string; title: string; status: string; createdAt: string }
  | { v: 'form'; phone: string }

interface StatusReply { self?: boolean; phone?: string; open?: { id: string; title: string; status: string; createdAt: string } | null }

export function CoachRequestForm({ coachSlug, coachName, disciplines }: {
  coachSlug: string
  coachName: string
  /** رشته‌های خودِ مربی با برچسب — از سرور، تا فرم فهرستِ رشته‌ها را در باندل نکشد */
  disciplines: { key: string; label: string }[]
}) {
  const [view, setView] = useState<View>({ v: 'loading' })
  const [kind, setKind] = useState<string[]>([])
  const [discipline, setDiscipline] = useState<string[]>([])
  const [level, setLevel] = useState<string[]>([])
  const [times, setTimes] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const self = `/coaches/${coachSlug}/request`

  const load = useCallback(async () => {
    try {
      const r = await apiFetch(`/api/coach/requests?coach=${encodeURIComponent(coachSlug)}`, { cache: 'no-store' })
      if (r.status === 401) { setView({ v: 'guest' }); return }
      /* ۴۰۴ خطای شبکه نیست: مربی نمایشی است، یا پس از رندرِ صفحه از تأیید افتاده یا
         مسدود شده — «تلاش دوباره» هیچ‌وقت درست نمی‌شد */
      if (r.status === 404) { setView({ v: 'unavailable' }); return }
      if (!r.ok) { setView({ v: 'error' }); return }
      const j = await r.json() as StatusReply
      if (j.self) setView({ v: 'self' })
      else if (j.open) setView({ v: 'open', ...j.open })
      else setView({ v: 'form', phone: j.phone ?? '' })
    } catch (e) {
      console.error('[coach-request] status', e)
      setView({ v: 'error' })
    }
  }, [coachSlug])

  useEffect(() => { void load() }, [load])

  const send = async (method: 'POST' | 'PATCH', body: object): Promise<{ ok: boolean; status: number; message?: string }> => {
    setBusy(true); setErr('')
    try {
      const r = await apiFetch('/api/coach/requests', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => ({})) as { message?: string }
      return { ok: r.ok, status: r.status, message: j.message }
    } catch {
      return { ok: false, status: 0, message: 'ارتباط با سرور برقرار نشد' }
    } finally { setBusy(false) }
  }

  const submit = async () => {
    const r = await send('POST', {
      coachSlug, kind: kind[0], discipline: discipline[0] ?? null, level: level[0], availability: times, message,
    })
    if (r.ok) setView({ v: 'sent' })
    else if (r.status === 401) setView({ v: 'guest' })
    else if (r.status === 404) setView({ v: 'unavailable' })
    else setErr(r.message ?? 'ارسال درخواست انجام نشد')
  }

  const cancel = async (id: string) => {
    const r = await send('PATCH', { id, action: 'cancelled' })
    if (r.ok) { setView({ v: 'loading' }); void load() }
    else setErr(r.message ?? 'لغو درخواست انجام نشد')
  }

  if (view.v === 'loading') return <RequestSkeleton />
  if (view.v === 'guest') return <GuestState next={self} />
  if (view.v === 'self') return <SelfState />
  if (view.v === 'error') return <ErrorState onRetry={() => { setView({ v: 'loading' }); void load() }} />
  if (view.v === 'unavailable') return <UnavailableState back={`/coaches/${coachSlug}`} />
  if (view.v === 'sent') return <SentState coachName={coachName} back={`/coaches/${coachSlug}`} />
  if (view.v === 'open') {
    return <OpenState title={view.title} status={view.status} createdAt={view.createdAt} coachName={coachName}
      busy={busy} err={err} onCancel={() => void cancel(view.id)} />
  }

  const needDiscipline = disciplines.length > 1
  const ready = kind.length > 0 && level.length > 0 && (!needDiscipline || discipline.length > 0)

  return (
    <form className="mt-2" onSubmit={e => { e.preventDefault(); if (ready) void submit() }}>
      <ChoiceChips legend="نوع درخواست" name="kind" options={REQUEST_KINDS} value={kind} onChange={setKind} disabled={busy} />
      {needDiscipline && (
        <ChoiceChips legend="رشته" name="discipline" options={disciplines} value={discipline} onChange={setDiscipline} disabled={busy} />
      )}
      {disciplines.length === 1 && (
        <p className="mt-6 text-sm text-ink-2">رشته: <b className="font-semibold text-ink">{disciplines[0]!.label}</b></p>
      )}
      <ChoiceChips legend="سطح شما" name="level" options={REQUEST_LEVELS} value={level} onChange={setLevel} disabled={busy} />
      <ChoiceChips legend="زمان‌های مناسب" hint="اختیاری" name="times" multiple
        options={REQUEST_TIMES} value={times} onChange={setTimes} disabled={busy} />

      <label htmlFor="cr-msg" className="mt-6 block text-sm font-semibold text-ink">
        پیام کوتاه<span className="ms-2 text-xs font-normal text-ink-3">اختیاری</span>
      </label>
      <textarea
        id="cr-msg" rows={3} value={message} disabled={busy} maxLength={REQUEST_MESSAGE_MAX}
        onChange={e => setMessage(e.target.value.slice(0, REQUEST_MESSAGE_MAX))}
        aria-describedby="cr-msg-count"
        placeholder="مثلا هدفتان از کلاس، سابقه بازی یا محدوده‌ای که برایتان راحت‌تر است"
        className="mt-3 block min-h-24 w-full resize-y rounded-field border border-line/10 bg-surface p-3 text-sm text-ink placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep disabled:opacity-55"
      />
      <p id="cr-msg-count" className="mt-1 text-end text-xs text-ink-3">
        {toFaDigits(message.length)} از {toFaDigits(REQUEST_MESSAGE_MAX)}
      </p>

      <p className="mt-4 text-xs text-ink-3">
        {view.phone
          ? <>با ارسال درخواست، شماره موبایل شما <span dir="ltr">{toFaDigits(view.phone)}</span> برای هماهنگی به {coachName} داده می‌شود</>
          : 'برای ارسال درخواست باید شماره موبایل حسابتان ثبت شده باشد'}
      </p>
      {err && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{err}</p>}

      <Button type="submit" size="lg" block className="mt-6" loading={busy} loadingText="در حال ارسال" disabled={!ready || !view.phone}>
        ارسال درخواست
      </Button>
      {!ready && <p className="mt-2 text-center text-xs text-ink-3">نوع درخواست{needDiscipline ? '، رشته' : ''} و سطح را انتخاب کنید</p>}
    </form>
  )
}
