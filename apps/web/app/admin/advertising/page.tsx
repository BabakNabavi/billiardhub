'use client'

/* پنلِ تبلیغات (فاز ۲) — شش جایگاهِ مستقل، کمپین‌ها، پلن‌های قیمت،
   و درخواست‌های تبلیغ.

   عمداً هیچ کلیدِ سراسری‌ای وجود ندارد: هر جایگاه Active/Inactive و
   Mode (رایگان/دستی/پولی) خودش را دارد — طبق تصمیم D1. */

import { useCallback, useEffect, useState } from 'react'
import {
  Megaphone, Save, Power, Loader2, AlertCircle, Plus, Trash2, Inbox, Phone, Package, LayoutGrid,
} from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { toFaDigits, faDateTime, faDate } from '../../../lib/jalali'
import Select from '../../../components/ui/Select'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const CARD: React.CSSProperties = {
  background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18,
  padding: 'clamp(18px,2.4vw,26px)', marginBottom: 18,
}
const INPUT: React.CSSProperties = {
  width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '9px 13px',
  fontSize: 13, fontFamily: 'inherit', color: INK, background: '#FAFAF7', outline: 'none',
}
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 800, color: SEC, marginBottom: 6 }
const BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 10, cursor: 'pointer',
  border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)', color: GOLD_D,
  fontSize: 13, fontWeight: 800, fontFamily: 'inherit', padding: '9px 15px',
}

type Mode = 'free' | 'manual' | 'paid'
const MODE_FA: Record<Mode, string> = { free: 'رایگان', manual: 'دستی', paid: 'پولی' }
const MODE_OPTS = (['free', 'manual', 'paid'] as Mode[]).map(m => ({ value: m, label: MODE_FA[m] }))

const STATUS_FA: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:           { label: 'پیش‌نویس',        color: MUT,     bg: 'rgba(0,0,0,0.05)' },
  PENDING_PAYMENT: { label: 'در انتظار پرداخت', color: '#B7791F', bg: 'rgba(183,121,31,0.10)' },
  PENDING_REVIEW:  { label: 'در انتظار بررسی',  color: GOLD_D,  bg: 'rgba(199,166,106,0.13)' },
  SCHEDULED:       { label: 'زمان‌بندی‌شده',    color: '#1D4ED8', bg: 'rgba(29,78,216,0.08)' },
  ACTIVE:          { label: 'فعال',            color: FELT,    bg: 'rgba(14,122,56,0.09)' },
  EXPIRED:         { label: 'منقضی',           color: MUT,     bg: 'rgba(0,0,0,0.05)' },
  REJECTED:        { label: 'رد شده',          color: RED,     bg: 'rgba(178,59,46,0.08)' },
  CANCELLED:       { label: 'لغو شده',         color: RED,     bg: 'rgba(178,59,46,0.08)' },
}
const STATUS_OPTS = Object.entries(STATUS_FA).map(([v, m]) => ({ value: v, label: m.label }))

interface Placement {
  key: string; title: string; description: string | null; section: string
  isActive: boolean; mode: Mode; contentKind: 'banner' | 'entity'
  entityType: string | null; capacity: number; price: number; durationDays: number
}
interface Campaign {
  id: string; placementKey: string; advertiser: string; title: string
  content: Record<string, unknown>; status: string
  startsAt: string; endsAt: string; impressions: number; clicks: number
}
interface Plan {
  id: string; name: string; description: string | null; placementKey: string | null
  price: number; durationDays: number; adQuantity: number; isActive: boolean; badge: string | null
}
interface AdRequest {
  id: string; name: string; phone: string; email: string | null; company: string | null
  slot_key: string | null; message: string; status: string; created_at: string
}

const fa = (n: number | string) => toFaDigits(typeof n === 'number' ? n.toLocaleString('en-US') : String(n))
const digits = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '')

export default function AdminAdvertising() {
  const [placements, setPlacements] = useState<Placement[] | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [requests, setRequests] = useState<AdRequest[]>([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState('')

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2600) }

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/admin/advertising', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message || 'دسترسی مجاز نیست'); setPlacements([]); return }
      setPlacements(j.placements ?? [])
      setCampaigns(j.campaigns ?? [])
      setPlans(j.plans ?? [])
      setRequests(j.requests ?? [])
      setErr('')
    } catch { setErr('خطا در ارتباط با سرور'); setPlacements([]) }
  }, [])
  useEffect(() => { void load() }, [load])

  const call = async (method: string, body?: Record<string, unknown>, query = '') => {
    const r = await apiFetch(`/api/admin/advertising${query}`, {
      method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { flash(j?.message || 'انجام نشد'); return null }
    return j
  }

  const patchPlacement = async (key: string, body: Record<string, unknown>) => {
    setBusy(key)
    try { if (await call('PATCH', { placementKey: key, ...body })) { await load(); flash('ذخیره شد') } }
    finally { setBusy('') }
  }

  const openRequests = requests.filter(r => r.status !== 'CLOSED')

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)', padding: 'clamp(14px,2.5vw,28px)', maxWidth: 1160, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <Megaphone size={21} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>سیستم تبلیغات</h1>
        {openRequests.length > 0 && (
          <span style={{ fontSize: 11.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.13)', borderRadius: 20, padding: '4px 11px' }}>
            {toFaDigits(openRequests.length)} درخواستِ باز
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.95 }}>
        شش جایگاهِ مستقل. هر جایگاه فعال/غیرفعال و حالتِ خودش (رایگان، دستی، پولی) را جدا دارد —
        هیچ کلیدِ سراسری‌ای وجود ندارد.
      </p>

      {err && (
        <div style={{ ...CARD, borderColor: 'rgba(178,59,46,0.3)', display: 'flex', gap: 9, alignItems: 'center' }}>
          <AlertCircle size={17} style={{ color: RED }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>{err}</span>
        </div>
      )}

      {/* ── جایگاه‌ها ── */}
      {placements === null ? (
        <div style={{ ...CARD, display: 'flex', gap: 9, alignItems: 'center', color: MUT }}>
          <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>در حال بارگذاری…</span>
        </div>
      ) : (
        <section style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <LayoutGrid size={17} style={{ color: GOLD_D }} />
            <h2 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: 0 }}>جایگاه‌ها</h2>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {placements.map(p => (
              <PlacementRow key={p.key} p={p} busy={busy === p.key} onPatch={patchPlacement}
                campaignCount={campaigns.filter(c => c.placementKey === p.key && c.status === 'ACTIVE').length} />
            ))}
          </div>
        </section>
      )}

      {/* ── کمپین‌ها ── */}
      <CampaignsSection
        placements={placements ?? []} campaigns={campaigns}
        onChanged={load} flash={flash} call={call}
      />

      {/* ── پلن‌های قیمت‌گذاری ── */}
      <section style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <Package size={17} style={{ color: GOLD_D }} />
          <h2 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: 0 }}>پلن‌های قیمت‌گذاری</h2>
        </div>
        <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 14px', lineHeight: 1.95 }}>
          قیمت‌ها از دیتابیس خوانده می‌شوند، نه از کد — همین‌جا تغییرشان بدهید.
          پلنِ حذف‌شده فقط غیرفعال می‌شود چون سفارش‌های آینده به آن ارجاع خواهند داشت.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {plans.map(p => (
            <PlanRow key={p.id} p={p} onChanged={load} flash={flash} call={call} />
          ))}
        </div>
      </section>

      {/* ── درخواست‌های تبلیغ ── */}
      <section style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Inbox size={17} style={{ color: GOLD_D }} />
          <h2 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: 0 }}>درخواست‌های تبلیغ</h2>
        </div>
        {requests.length === 0 ? (
          <p style={{ fontSize: 13, color: MUT, margin: 0, textAlign: 'center', padding: 20 }}>هنوز درخواستی ثبت نشده است.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {requests.map(r => (
              <div key={r.id} style={{ border: `1px solid ${LINE}`, borderRadius: 13, padding: '13px 15px', opacity: r.status === 'CLOSED' ? 0.55 : 1 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>{r.name}</span>
                  {r.company && <span style={{ fontSize: 12, color: MUT }}>· {r.company}</span>}
                  <a href={`tel:${r.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: GOLD_D, textDecoration: 'none', direction: 'ltr' }}>
                    <Phone size={13} />{toFaDigits(r.phone)}
                  </a>
                  <span style={{ marginInlineStart: 'auto', fontSize: 11.5, color: MUT }}>{faDateTime(r.created_at)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: SEC, lineHeight: 1.9 }}>
                  {r.slot_key && <>جایگاه: {(placements ?? []).find(p => p.key === r.slot_key)?.title ?? r.slot_key} · </>}
                  {r.email && <span style={{ direction: 'ltr', display: 'inline-block' }}>{r.email}</span>}
                </div>
                {r.message && <p style={{ fontSize: 12.5, color: SEC, margin: '8px 0 0', lineHeight: 1.95 }}>{r.message}</p>}
                {r.status !== 'CLOSED' && (
                  <button onClick={async () => { setBusy(r.id); try { if (await call('DELETE', undefined, `?request=${r.id}`)) await load() } finally { setBusy('') } }}
                    disabled={busy === r.id} style={{ ...BTN, marginTop: 10, padding: '7px 13px', fontSize: 12 }}>
                    بستنِ درخواست
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 26, insetInline: 0, margin: '0 auto', width: 'fit-content', zIndex: 60,
          background: INK, color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 20px', borderRadius: 22,
        }}>{toast}</div>
      )}
    </div>
  )
}

/* ── ردیفِ جایگاه — Active و Mode مستقل ─────────────────────── */
function PlacementRow({ p, busy, campaignCount, onPatch }: {
  p: Placement; busy: boolean; campaignCount: number
  onPatch: (key: string, body: Record<string, unknown>) => Promise<void>
}) {
  const [cap, setCap] = useState(String(p.capacity))
  const [price, setPrice] = useState(String(p.price))
  const [days, setDays] = useState(String(p.durationDays))
  useEffect(() => { setCap(String(p.capacity)); setPrice(String(p.price)); setDays(String(p.durationDays)) }, [p.capacity, p.price, p.durationDays])

  const changed = Number(cap) !== p.capacity || Number(price) !== p.price || Number(days) !== p.durationDays

  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: 15, opacity: p.isActive ? 1 : 0.72, background: '#FAFAF7' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>{p.title}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: MUT, background: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '2px 8px', direction: 'ltr' }}>{p.key}</span>
            {campaignCount > 0 && (
              <span style={{ fontSize: 10.5, fontWeight: 800, color: FELT, background: 'rgba(14,122,56,0.09)', borderRadius: 20, padding: '2px 8px' }}>
                {fa(campaignCount)} کمپین فعال
              </span>
            )}
          </div>
          {p.description && <div style={{ fontSize: 11.5, color: MUT, marginTop: 4, lineHeight: 1.85 }}>{p.description}</div>}
        </div>

        {/* دو کنترلِ مستقل: وضعیت و حالت */}
        <button onClick={() => onPatch(p.key, { isActive: !p.isActive })} disabled={busy} style={{
          ...BTN,
          background: p.isActive ? 'rgba(14,122,56,0.10)' : 'rgba(0,0,0,0.04)',
          borderColor: p.isActive ? 'rgba(14,122,56,0.32)' : LINE,
          color: p.isActive ? FELT : SEC,
        }}>
          <Power size={14} /> {p.isActive ? 'فعال' : 'غیرفعال'}
        </button>
        <div style={{ width: 118 }}>
          <Select<Mode> compact value={p.mode} options={MODE_OPTS} ariaLabel={`حالتِ ${p.title}`}
            onChange={m => void onPatch(p.key, { mode: m })} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: 92 }}>
          <label style={LABEL}>ظرفیت</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(cap)}
            onChange={e => setCap(digits(e.target.value))} />
        </div>
        <div style={{ width: 150 }}>
          <label style={LABEL}>قیمت (تومان)</label>
          <input style={{ ...INPUT, background: '#fff' }} inputMode="numeric"
            value={price ? toFaDigits(Number(price).toLocaleString('en-US')) : ''}
            onChange={e => setPrice(digits(e.target.value))} />
        </div>
        <div style={{ width: 92 }}>
          <label style={LABEL}>مدت (روز)</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(days)}
            onChange={e => setDays(digits(e.target.value))} />
        </div>
        <button onClick={() => onPatch(p.key, { capacity: Number(cap) || 0, price: Number(price) || 0, durationDays: Number(days) || 30 })}
          disabled={busy || !changed}
          style={{ ...BTN, opacity: changed ? 1 : 0.45, cursor: changed ? 'pointer' : 'default' }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} ذخیره
        </button>
      </div>
    </div>
  )
}

/* ── کمپین‌ها: فهرست + ساخت ─────────────────────────────────── */
function CampaignsSection({ placements, campaigns, onChanged, flash, call }: {
  placements: Placement[]; campaigns: Campaign[]
  onChanged: () => Promise<void>; flash: (m: string) => void
  call: (method: string, body?: Record<string, unknown>, query?: string) => Promise<Record<string, unknown> | null>
}) {
  const [busy, setBusy] = useState('')
  const [draft, setDraft] = useState({
    placementKey: '', advertiser: '', title: '', imageUrl: '', linkUrl: '', ref: '', durationDays: '30', status: 'ACTIVE',
  })
  const selected = placements.find(p => p.key === draft.placementKey)

  const create = async () => {
    if (!draft.placementKey) { flash('جایگاه را انتخاب کنید'); return }
    setBusy('new')
    try {
      const ok = await call('POST', {
        placementKey: draft.placementKey, advertiser: draft.advertiser, title: draft.title,
        imageUrl: draft.imageUrl, linkUrl: draft.linkUrl, ref: draft.ref,
        durationDays: Number(draft.durationDays) || 30, status: draft.status,
      })
      if (ok) {
        setDraft({ placementKey: '', advertiser: '', title: '', imageUrl: '', linkUrl: '', ref: '', durationDays: '30', status: 'ACTIVE' })
        await onChanged(); flash('کمپین ساخته شد')
      }
    } finally { setBusy('') }
  }

  const setStatus = async (id: string, status: string) => {
    setBusy(id)
    try { if (await call('PATCH', { campaignId: id, status })) { await onChanged(); flash('وضعیت تغییر کرد') } }
    finally { setBusy('') }
  }

  const remove = async (id: string) => {
    if (!confirm('این کمپین حذف شود؟')) return
    setBusy(id)
    try { if (await call('DELETE', undefined, `?campaign=${id}`)) { await onChanged(); flash('کمپین حذف شد') } }
    finally { setBusy('') }
  }

  return (
    <section style={CARD}>
      <h2 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: '0 0 14px' }}>کمپین‌ها</h2>

      {/* ساخت */}
      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: 15, marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={LABEL}>جایگاه *</label>
            <Select value={draft.placementKey} ariaLabel="جایگاه"
              options={placements.map(p => ({ value: p.key, label: p.title, hint: p.contentKind === 'banner' ? 'بنر' : 'موجودیت' }))}
              onChange={v => setDraft(d => ({ ...d, placementKey: v }))} />
          </div>

          {selected?.contentKind === 'banner' && (
            <>
              <div style={{ gridColumn: '1 / -1' }}><label style={LABEL}>نشانی تصویر بنر *</label>
                <input style={{ ...INPUT, direction: 'ltr', textAlign: 'right' }} value={draft.imageUrl}
                  onChange={e => setDraft(d => ({ ...d, imageUrl: e.target.value }))} placeholder="https://…" /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={LABEL}>لینک مقصد</label>
                <input style={{ ...INPUT, direction: 'ltr', textAlign: 'right' }} value={draft.linkUrl}
                  onChange={e => setDraft(d => ({ ...d, linkUrl: e.target.value }))} placeholder="https://…" /></div>
            </>
          )}
          {selected?.contentKind === 'entity' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>
                شناسه‌ی {selected.entityType === 'product' ? 'محصول (uuid آگهی)' : selected.entityType === 'club' ? 'باشگاه (uuid)' : 'فروشگاه (نامک)'} *
              </label>
              <input style={{ ...INPUT, direction: 'ltr', textAlign: 'right' }} value={draft.ref}
                onChange={e => setDraft(d => ({ ...d, ref: e.target.value }))} />
            </div>
          )}

          <div><label style={LABEL}>تبلیغ‌دهنده</label>
            <input style={INPUT} value={draft.advertiser} onChange={e => setDraft(d => ({ ...d, advertiser: e.target.value }))} /></div>
          <div><label style={LABEL}>عنوان</label>
            <input style={INPUT} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} /></div>
          <div><label style={LABEL}>مدت (روز)</label>
            <input style={INPUT} inputMode="numeric" value={fa(draft.durationDays)}
              onChange={e => setDraft(d => ({ ...d, durationDays: digits(e.target.value) }))} /></div>
          <div><label style={LABEL}>وضعیتِ شروع</label>
            <Select value={draft.status} options={STATUS_OPTS} ariaLabel="وضعیت"
              onChange={v => setDraft(d => ({ ...d, status: v }))} /></div>
        </div>
        <button onClick={create} disabled={busy === 'new'} style={{ ...BTN, marginTop: 14 }}>
          {busy === 'new' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} ساختِ کمپین
        </button>
      </div>

      {/* فهرست */}
      {campaigns.length === 0 ? (
        <p style={{ fontSize: 13, color: MUT, margin: 0, textAlign: 'center', padding: 14 }}>هنوز کمپینی ساخته نشده است.</p>
      ) : (
        <div style={{ display: 'grid', gap: 9 }}>
          {campaigns.map(c => {
            const st = STATUS_FA[c.status] ?? STATUS_FA.DRAFT!
            const p = placements.find(x => x.key === c.placementKey)
            const banner = c.content?.image_url ? String(c.content.image_url) : ''
            return (
              <div key={c.id} style={{ display: 'flex', gap: 11, alignItems: 'center', flexWrap: 'wrap', border: `1px solid ${LINE}`, borderRadius: 13, padding: '11px 13px' }}>
                {banner
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={banner} alt="" style={{ width: 68, height: 40, objectFit: 'cover', borderRadius: 8, border: `1px solid ${LINE}`, flexShrink: 0 }} />
                  : <span style={{ width: 68, height: 40, borderRadius: 8, background: 'rgba(199,166,106,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: GOLD_D, flexShrink: 0 }}>
                      {String(c.content?.ref ?? '').slice(0, 8) || '—'}
                    </span>}
                <div style={{ flex: 1, minWidth: 170 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: INK }}>
                    {c.title || c.advertiser || 'کمپین'} <span style={{ fontWeight: 600, color: MUT }}>· {p?.title ?? c.placementKey}</span>
                  </div>
                  <div style={{ fontSize: 11, color: MUT, marginTop: 3 }}>
                    {faDate(c.startsAt)} تا {faDate(c.endsAt)} · {fa(c.impressions)} نمایش · {fa(c.clicks)} کلیک
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: st.color, background: st.bg, borderRadius: 20, padding: '4px 11px' }}>{st.label}</span>
                <div style={{ width: 150 }}>
                  <Select compact value={c.status} options={STATUS_OPTS} ariaLabel="تغییر وضعیت"
                    onChange={v => void setStatus(c.id, v)} />
                </div>
                <button onClick={() => void remove(c.id)} disabled={busy === c.id} title="حذف"
                  style={{ ...BTN, padding: '7px 11px', background: 'rgba(178,59,46,0.08)', borderColor: 'rgba(178,59,46,0.28)', color: RED }}>
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* ── ردیفِ پلنِ قیمت ─────────────────────────────────────────── */
function PlanRow({ p, onChanged, flash, call }: {
  p: Plan; onChanged: () => Promise<void>; flash: (m: string) => void
  call: (method: string, body?: Record<string, unknown>, query?: string) => Promise<Record<string, unknown> | null>
}) {
  const [busy, setBusy] = useState(false)
  const [price, setPrice] = useState(String(p.price))
  const [qty, setQty] = useState(String(p.adQuantity))
  const [days, setDays] = useState(String(p.durationDays))
  useEffect(() => { setPrice(String(p.price)); setQty(String(p.adQuantity)); setDays(String(p.durationDays)) }, [p.price, p.adQuantity, p.durationDays])

  const changed = Number(price) !== p.price || Number(qty) !== p.adQuantity || Number(days) !== p.durationDays

  const save = async (body: Record<string, unknown>) => {
    setBusy(true)
    try { if (await call('PATCH', { planId: p.id, ...body })) { await onChanged(); flash('ذخیره شد') } }
    finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-end', flexWrap: 'wrap', border: `1px solid ${LINE}`, borderRadius: 13, padding: '12px 14px', opacity: p.isActive ? 1 : 0.6 }}>
      <div style={{ minWidth: 150, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>{p.name}</span>
          {p.badge && <span style={{ fontSize: 10.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.13)', borderRadius: 20, padding: '2px 8px' }}>{p.badge}</span>}
          {!p.isActive && <span style={{ fontSize: 10.5, fontWeight: 800, color: MUT, background: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '2px 8px' }}>غیرفعال</span>}
        </div>
        <div style={{ fontSize: 11.5, color: MUT, marginTop: 4, lineHeight: 1.85 }}>
          {p.adQuantity === 0 ? 'طبق سهمیه‌ی نقش' : `${fa(p.adQuantity)} آگهی`} · اعتبار {fa(p.durationDays)} روز
          {p.description ? ` · ${p.description}` : ''}
        </div>
      </div>
      <div style={{ width: 88 }}>
        <label style={LABEL}>تعداد</label>
        <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(qty)} onChange={e => setQty(digits(e.target.value))} />
      </div>
      <div style={{ width: 88 }}>
        <label style={LABEL}>مدت</label>
        <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(days)} onChange={e => setDays(digits(e.target.value))} />
      </div>
      <div style={{ width: 140 }}>
        <label style={LABEL}>قیمت (تومان)</label>
        <input style={INPUT} inputMode="numeric" value={price ? toFaDigits(Number(price).toLocaleString('en-US')) : '۰'}
          onChange={e => setPrice(digits(e.target.value))} />
      </div>
      <button onClick={() => void save({ price: Number(price) || 0, adQuantity: Number(qty) || 0, durationDays: Number(days) || 30 })}
        disabled={busy || !changed}
        style={{ ...BTN, opacity: changed ? 1 : 0.45, cursor: changed ? 'pointer' : 'default' }}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} ذخیره
      </button>
      <button onClick={() => void save({ isActive: !p.isActive })} disabled={busy} style={{
        ...BTN,
        background: p.isActive ? 'rgba(0,0,0,0.04)' : 'rgba(14,122,56,0.10)',
        borderColor: p.isActive ? LINE : 'rgba(14,122,56,0.32)',
        color: p.isActive ? SEC : FELT,
      }}>
        <Power size={14} /> {p.isActive ? 'غیرفعال کن' : 'فعال کن'}
      </button>
    </div>
  )
}
