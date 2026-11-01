'use client'

/* فرمِ اقدامِ مالک. هر اقدام فقط فیلدهای خودش را نشان می‌دهد؛ اقدام‌های
   سنگین (مسدودِ دائم، حذف، غیرفعال) تأییدِ صریح می‌خواهند. اعتبارسنجیِ
   واقعی در سرور است (Zod + applyAction). */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/http'
import { buttonClasses } from '@/components/ui/button-classes'
import { ACTIONS, ACTION_KEYS, FEATURES, FEATURE_KEYS, REASONS, REASON_KEYS, type ActionKey } from '@/lib/enforcement/policy'

const HEAVY: ReadonlySet<ActionKey> = new Set(['ban', 'delete', 'deactivate'])
const DURATIONS = [
  { d: 1, label: '۱ روز' }, { d: 3, label: '۳ روز' }, { d: 7, label: '۷ روز' },
  { d: 14, label: '۱۴ روز' }, { d: 30, label: '۳۰ روز' }, { d: 90, label: '۹۰ روز' },
]
export interface Asset { id: string; title?: string | null; status?: string }

const field = 'h-11 w-full rounded-field border border-line/15 bg-surface px-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep'

export function ActionForm({ userId, products, videos, onDone }: {
  userId: string; products: Asset[]; videos: Asset[]; onDone: (msg: string) => void
}) {
  const [action, setAction] = useState<ActionKey>('suspend')
  const [reason, setReason] = useState<string>('other')
  const [note, setNote] = useState('')
  const [evidence, setEvidence] = useState('')
  const [days, setDays] = useState(0)
  const [features, setFeatures] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [also, setAlso] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const to = ACTIONS[action].to
  const timed = to === 'suspended' || to === 'restricted' || to === 'limited'
  const needsConfirm = HEAVY.has(action)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    if (needsConfirm && !confirm) { setErr('برای این اقدام تیک تأیید را بزنید'); return }
    const [ctype, cid] = content.split(':')
    setBusy(true)
    try {
      const r = await apiFetch('/api/owner/enforcement', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, action, reason, note: note || null, evidence: evidence || null,
          expiresAt: timed && days ? new Date(Date.now() + days * 864e5).toISOString() : null,
          restrictions: action === 'limit' ? features : undefined,
          content: action === 'remove_content' && cid ? { type: ctype, id: cid } : null,
          alsoListings: also, alsoBusiness: also,
        }),
      })
      const j = await r.json().catch(() => ({})) as { message?: string; details?: { partial?: boolean } }
      if (!r.ok) { setErr(j.message ?? 'اقدام انجام نشد'); return }
      setNote(''); setEvidence(''); setConfirm(false); setContent('')
      onDone(j.details?.partial
        ? `«${ACTIONS[action].label}» ثبت شد، ولی بخشی از اثرها (آگهی/کسب‌وکار) اعمال نشد — جزئیات در تاریخچه`
        : `«${ACTIONS[action].label}» ثبت شد`)
    } catch { setErr('خطا در ارتباط با سرور') }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" aria-label="اقدام تازه">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-ink-2">اقدام
          <select className={field} value={action} onChange={e => { setAction(e.target.value as ActionKey); setConfirm(false) }}>
            {ACTION_KEYS.map(k => <option key={k} value={k}>{ACTIONS[k].label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-2">دلیل
          <select className={field} value={reason} onChange={e => setReason(e.target.value)}>
            {REASON_KEYS.map(k => <option key={k} value={k}>{REASONS[k]}</option>)}
          </select>
        </label>
      </div>

      {timed && (
        <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
          <legend className="mb-2 text-xs text-ink-2">مدت {to === 'suspended' ? '(الزامی)' : '(خالی = تا بازگرداندن دستی)'}</legend>
          {to !== 'suspended' && <Chip on={days === 0} onClick={() => setDays(0)}>بی‌پایان</Chip>}
          {DURATIONS.map(x => <Chip key={x.d} on={days === x.d} onClick={() => setDays(x.d)}>{x.label}</Chip>)}
        </fieldset>
      )}

      {action === 'limit' && (
        <fieldset className="m-0 grid gap-2 border-0 p-0 sm:grid-cols-2">
          <legend className="mb-2 text-xs text-ink-2">قابلیت‌های بسته‌شده</legend>
          {FEATURE_KEYS.map(k => (
            <label key={k} className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" className="size-4 accent-gold-deep" checked={features.includes(k)}
                onChange={e => setFeatures(f => e.target.checked ? [...f, k] : f.filter(x => x !== k))} />
              {FEATURES[k].label}
            </label>
          ))}
        </fieldset>
      )}

      {action === 'remove_content' && (
        <label className="flex flex-col gap-1 text-xs text-ink-2">محتوا
          <select className={field} value={content} onChange={e => setContent(e.target.value)} required>
            <option value="">انتخاب کنید…</option>
            {products.filter(p => p.status !== 'deleted').map(p => <option key={p.id} value={`listing:${p.id}`}>آگهی — {p.title || p.id}</option>)}
            {videos.filter(v => v.status !== 'hidden').map(v => <option key={v.id} value={`video:${v.id}`}>ویدیو — {v.title || v.id}</option>)}
          </select>
        </label>
      )}

      {to && (
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="size-4 accent-gold-deep" checked={also} onChange={e => setAlso(e.target.checked)} />
          {to === 'active' ? 'آگهی‌ها و کسب‌وکارهای بسته‌شده هم برگردند' : 'آگهی‌ها و باشگاه/فروشگاه/پروفایل‌ها هم بسته شوند'}
        </label>
      )}

      <label className="flex flex-col gap-1 text-xs text-ink-2">یادداشت داخلی (کاربر نمی‌بیند)
        <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={2000} rows={3}
          className="w-full rounded-field border border-line/15 bg-surface p-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-2">مدرک یا ارجاع (پیوند، شماره‌ی گزارش، …)
        <input value={evidence} onChange={e => setEvidence(e.target.value)} maxLength={1000} className={field} />
      </label>

      {needsConfirm && (
        <label className="flex min-h-11 items-center gap-2 text-sm font-bold text-danger-ink">
          <input type="checkbox" className="size-4 accent-danger" checked={confirm} onChange={e => setConfirm(e.target.checked)} />
          مطمئنم؛ همه‌ی نشست‌های این کاربر باطل می‌شود
        </label>
      )}
      {err && <p role="alert" className="m-0 text-sm text-danger-ink">{err}</p>}
      <button type="submit" disabled={busy || (to === 'suspended' && !days)}
        className={buttonClasses({ size: 'lg', variant: needsConfirm ? 'danger' : 'primary', className: 'self-start' })}>
        {busy && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden />}
        ثبت اقدام
      </button>
    </form>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`min-h-11 rounded-chip border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep ${on ? 'border-gold-deep bg-gold/[.12] font-bold text-gold-text' : 'border-line/15 bg-surface text-ink-2 hover:bg-paper'}`}>
      {children}
    </button>
  )
}
