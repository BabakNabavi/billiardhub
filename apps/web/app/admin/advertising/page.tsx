'use client'

/* پنل تبلیغات (فاز ۲) — شش جایگاه مستقل، کمپین‌ها، پلن‌های قیمت،
   و درخواست‌های تبلیغ.

   عمداً هیچ کلید سراسری‌ای وجود ندارد: هر جایگاه Active/Inactive و
   Mode (رایگان/دستی/پولی) خودش را دارد — طبق تصمیم D1. */

import { useCallback, useEffect, useState } from 'react'
import {
  Megaphone, Save, Power, Loader2, AlertCircle, Plus, Trash2, Inbox, Phone, Package, LayoutGrid,
  BarChart3, Eye, MousePointerClick, Wallet, RotateCw, Check,
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

type Rotation = 'fixed' | 'weighted' | 'fair' | 'random'
const ROTATION_FA: Record<Rotation, string> = {
  fair: 'عادلانه', weighted: 'وزنی', random: 'تصادفی', fixed: 'ثابت',
}
const ROTATION_HINT: Record<Rotation, string> = {
  fair: 'کم‌نمایش‌ترین اول', weighted: 'به‌نسبت وزن', random: 'بُرخورده', fixed: 'ترتیب ثابت',
}
const ROTATION_OPTS = (['fair', 'weighted', 'random', 'fixed'] as Rotation[])
  .map(r => ({ value: r, label: ROTATION_FA[r], hint: ROTATION_HINT[r] }))

interface Placement {
  key: string; title: string; description: string | null; section: string
  isActive: boolean; mode: Mode; contentKind: 'banner' | 'entity' | 'video'
  entityType: string | null; capacity: number; price: number; durationDays: number
  displayCount: number; rotationMode: Rotation; priority: number
  /* فقط جایگاهِ ویدیویی (پیش‌پخش) — مهاجرتِ ۰۵۱ */
  skipAfterSec: number | null; maxDurationSec: number | null
}
interface Campaign {
  id: string; placementKey: string; advertiser: string; title: string
  content: Record<string, unknown>; status: string
  startsAt: string; endsAt: string; impressions: number; clicks: number
  /* تبلیغِ ویدیویی — برای بنر همیشه صفر */
  completedViews?: number; skippedViews?: number
}
interface Plan {
  id: string; name: string; description: string | null; placementKey: string | null
  price: number; durationDays: number; adQuantity: number; creditAmount: number
  isActive: boolean; badge: string | null; sortOrder?: number
}
interface Stats {
  campaigns: { total: number; active: number; pending: number; expired: number; scheduled: number; draft: number; rejected: number; cancelled: number }
  impressions: number; clicks: number; ctr: number
  revenue: { total: number; orders: number; pendingOrders: number }
  byPlacement: { key: string; title: string; active: number; impressions: number; clicks: number; ctr: number }[]
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
  const [stats, setStats] = useState<Stats | null>(null)
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
      setStats(j.stats ?? null)
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
            {toFaDigits(openRequests.length)} درخواست باز
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.95 }}>
        شش جایگاه مستقل. هر جایگاه فعال/غیرفعال و حالت خودش (رایگان، دستی، پولی) را جدا دارد —
        هیچ کلید سراسری‌ای وجود ندارد.
      </p>

      {err && (
        <div style={{ ...CARD, borderColor: 'rgba(178,59,46,0.3)', display: 'flex', gap: 9, alignItems: 'center' }}>
          <AlertCircle size={17} style={{ color: RED }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>{err}</span>
        </div>
      )}

      {/* ── آمار ── */}
      {stats && <StatsSection s={stats} />}

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
          <NewPlacement onDone={load} flash={flash} call={call} />
        </section>
      )}

      {/* ── کمپین‌ها ── */}
      <CampaignsSection
        placements={placements ?? []} campaigns={campaigns}
        onChanged={load} flash={flash} call={call}
      />

      {/* ── پلن‌های قیمت‌گذاری ── */}
      <PlansSection plans={plans} placements={placements ?? []} onChanged={load} flash={flash} call={call} />

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
                    بستن درخواست
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

/* ── آمار تبلیغات ───────────────────────────────────────────── */
function StatsSection({ s }: { s: Stats }) {
  const KPI = ({ icon, label, value, hint, color }: {
    icon: React.ReactNode; label: string; value: string; hint?: string; color?: string
  }) => (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: '13px 15px', background: '#FAFAF7', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7, color: color ?? MUT }}>
        {icon}<span style={{ fontSize: 11.5, fontWeight: 800, color: SEC }}>{label}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 900, color: color ?? INK, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: MUT, marginTop: 3, lineHeight: 1.7 }}>{hint}</div>}
    </div>
  )

  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <BarChart3 size={17} style={{ color: GOLD_D }} />
        <h2 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: 0 }}>آمار تبلیغات</h2>
      </div>

      <div style={{ display: 'grid', gap: 11, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 14 }}>
        <KPI icon={<Power size={14} />} label="کمپین فعال" value={fa(s.campaigns.active)} color={FELT}
          hint={`از ${fa(s.campaigns.total)} کمپین`} />
        <KPI icon={<Loader2 size={14} />} label="در انتظار" value={fa(s.campaigns.pending)}
          hint={`${fa(s.campaigns.scheduled)} زمان‌بندی‌شده · ${fa(s.campaigns.draft)} پیش‌نویس`} />
        <KPI icon={<AlertCircle size={14} />} label="منقضی" value={fa(s.campaigns.expired)}
          hint={`${fa(s.campaigns.rejected + s.campaigns.cancelled)} رد/لغو`} />
        <KPI icon={<Eye size={14} />} label="نمایش" value={fa(s.impressions)} />
        <KPI icon={<MousePointerClick size={14} />} label="کلیک" value={fa(s.clicks)}
          hint={`نرخ کلیک ${toFaDigits(s.ctr.toFixed(2))}٪`} />
        <KPI icon={<Wallet size={14} />} label="درآمد (تومان)" value={fa(s.revenue.total)} color={GOLD_D}
          hint={s.revenue.orders > 0
            ? `${fa(s.revenue.orders)} سفارش پرداخت‌شده`
            : 'فروش آنلاین جایگاه در فاز بعد فعال می‌شود'} />
      </div>

      {s.byPlacement.some(b => b.impressions > 0 || b.active > 0) && (
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 13, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 460 }}>
            <thead>
              <tr style={{ background: '#FAFAF7' }}>
                {['جایگاه', 'فعال', 'نمایش', 'کلیک', 'CTR'].map(h => (
                  <th key={h} style={{ textAlign: h === 'جایگاه' ? 'right' : 'center', padding: '9px 12px', fontSize: 11.5, fontWeight: 800, color: SEC, borderBottom: `1px solid ${LINE}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.byPlacement.map(b => (
                <tr key={b.key}>
                  <td style={{ padding: '9px 12px', fontWeight: 700, color: INK, borderBottom: `1px solid ${LINE}` }}>{b.title}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: b.active > 0 ? FELT : MUT, fontWeight: 800, borderBottom: `1px solid ${LINE}` }}>{fa(b.active)}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: SEC, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${LINE}` }}>{fa(b.impressions)}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: SEC, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${LINE}` }}>{fa(b.clicks)}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: SEC, fontVariantNumeric: 'tabular-nums', borderBottom: `1px solid ${LINE}` }}>{toFaDigits(b.ctr.toFixed(2))}٪</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/* ── ردیف جایگاه — Active و Mode مستقل ─────────────────────── */
/* ── ساختِ جایگاهِ تازه ──────────────────────────────────────────
   تا مهاجرتِ ۰۵۶ کلیدِ هر جایگاه در کد هاردکد بود و هر جایگاهِ تازه یک
   دیپلوی می‌خواست. جایگاهِ ساخته‌شده عمداً خاموش و «دستی» متولد می‌شود:
   جایگاهی که همان لحظه روی سایت ظاهر شود یعنی اشتباهِ تایپی مستقیم به
   بازدیدکننده می‌رسد. */
const ROLE_OPTS = [
  { key: 'club_owner', fa: 'باشگاه‌دار' },
  { key: 'seller', fa: 'فروشنده' },
  { key: 'manufacturer', fa: 'تولیدکننده' },
  { key: 'coach', fa: 'مربی' },
  { key: 'referee', fa: 'داور' },
]
const KIND_OPTS = [
  { value: 'banner' as const, label: 'بنر تصویری' },
  { value: 'video' as const, label: 'ویدیو (پیش‌پخش)' },
  { value: 'entity' as const, label: 'موجودیت (کارت محصول/باشگاه/فروشگاه)' },
]
const ENTITY_OPTS = [
  { value: 'product' as const, label: 'محصول' },
  { value: 'club' as const, label: 'باشگاه' },
  { value: 'seller' as const, label: 'فروشگاه' },
]

function NewPlacement({ onDone, flash, call }: {
  onDone: () => Promise<void> | void
  flash: (m: string) => void
  call: (m: string, b?: Record<string, unknown>, q?: string) => Promise<Record<string, unknown> | null>
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [kind, setKind] = useState<'banner' | 'video' | 'entity'>('banner')
  const [entity, setEntity] = useState<'product' | 'club' | 'seller'>('product')
  const [cap, setCap] = useState('1')
  const [dims, setDims] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [approval, setApproval] = useState(true)
  const [err, setErr] = useState('')

  const reset = () => {
    setKey(''); setTitle(''); setDesc(''); setKind('banner'); setEntity('product')
    setCap('1'); setDims(''); setRoles([]); setApproval(true); setErr('')
  }

  const submit = async () => {
    if (!/^[a-z][a-z0-9_]{2,48}$/.test(key.trim())) {
      setErr('کلید باید با حرف کوچک انگلیسی شروع شود و فقط حرف کوچک، رقم و زیرخط داشته باشد')
      return
    }
    if (!title.trim()) { setErr('عنوان لازم است'); return }
    setBusy(true); setErr('')
    try {
      const r = await call('POST', {
        type: 'placement',
        key: key.trim(), title: title.trim(), description: desc.trim() || null,
        contentKind: kind, entityType: kind === 'entity' ? entity : null,
        capacity: Number(cap) || 1,
        dimensions: dims.trim() || null,
        advertiserRoles: roles, approvalRequired: approval,
      })
      if (r) { flash('جایگاه ساخته شد — خاموش است تا خودتان روشنش کنید'); reset(); setOpen(false); await onDone() }
    } finally { setBusy(false) }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        style={{ ...BTN, marginTop: 12, alignSelf: 'flex-start' }}>
        <Plus size={14} /> جایگاه جدید
      </button>
    )
  }

  return (
    <div style={{ marginTop: 12, border: `1px dashed ${LINE}`, borderRadius: 14, padding: 15, background: '#FAFAF7' }}>
      <div style={{ fontSize: 13.5, fontWeight: 900, color: INK, marginBottom: 12 }}>جایگاه جدید</div>

      <div style={{ display: 'grid', gap: 11, gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
        <div>
          <label style={LABEL}>کلید (لاتین، در URL می‌آید)</label>
          <input style={{ ...INPUT, background: '#fff', direction: 'ltr', textAlign: 'left' }}
            value={key} onChange={e => { setKey(e.target.value.toLowerCase()); setErr('') }}
            placeholder="sponsored_tournament" />
        </div>
        <div>
          <label style={LABEL}>عنوان</label>
          <input style={{ ...INPUT, background: '#fff' }} value={title}
            onChange={e => { setTitle(e.target.value); setErr('') }} placeholder="اسپانسر مسابقات" />
        </div>
        <div>
          <label style={LABEL}>نوع محتوا</label>
          <Select value={kind} options={KIND_OPTS} ariaLabel="نوع محتوا"
            onChange={v => setKind(v)} />
        </div>
        {kind === 'entity' && (
          <div>
            <label style={LABEL}>نوع موجودیت</label>
            <Select value={entity} options={ENTITY_OPTS} ariaLabel="نوع موجودیت"
              onChange={v => setEntity(v)} />
          </div>
        )}
        <div>
          <label style={LABEL}>ظرفیت</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric"
            value={fa(cap)} onChange={e => setCap(digits(e.target.value))} title="۰ = بی‌سقف" />
        </div>
        <div>
          <label style={LABEL}>ابعاد پیشنهادی</label>
          <input style={{ ...INPUT, background: '#fff' }} value={dims}
            onChange={e => setDims(e.target.value)} placeholder="۳۰۰×۶۰۰ پیکسل" />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={LABEL}>توضیح (به خریدار نشان داده می‌شود)</label>
        <input style={{ ...INPUT, background: '#fff' }} value={desc}
          onChange={e => setDesc(e.target.value)} placeholder="کجا دیده می‌شود و چه مخاطبی دارد" />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={LABEL}>چه نقشی می‌تواند بخرد</label>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {ROLE_OPTS.map(r => {
            const on = roles.includes(r.key)
            return (
              <button key={r.key} type="button"
                onClick={() => setRoles(s => on ? s.filter(x => x !== r.key) : [...s, r.key])}
                style={{
                  ...BTN, padding: '6px 12px', fontSize: 12,
                  background: on ? 'rgba(14,122,56,0.10)' : '#fff',
                  borderColor: on ? 'rgba(14,122,56,0.32)' : LINE,
                  color: on ? FELT : SEC,
                }}>
                {on && <Check size={12} />} {r.fa}
              </button>
            )
          })}
        </div>
        {roles.length === 0 && (
          <div style={{ fontSize: 10.5, color: '#B7791F', marginTop: 5, lineHeight: 1.7 }}>
            بدون نقش، این جایگاه برای هیچ‌کس قابل خرید نیست — فقط خودتان می‌توانید رویش کمپین بگذارید.
          </div>
        )}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={approval} onChange={e => setApproval(e.target.checked)}
          style={{ width: 15, height: 15, accentColor: GOLD_D }} />
        <span style={{ fontSize: 12, color: SEC }}>کمپین‌های این جایگاه پیش از نمایش بازبینی شوند</span>
      </label>

      {err && (
        <div style={{ fontSize: 11.5, color: RED, marginTop: 10, lineHeight: 1.8 }}>{err}</div>
      )}

      <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
        <button type="button" onClick={() => void submit()} disabled={busy} style={BTN}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} ساخت
        </button>
        <button type="button" onClick={() => { reset(); setOpen(false) }} style={{ ...BTN, background: '#fff' }}>
          انصراف
        </button>
      </div>
    </div>
  )
}

function PlacementRow({ p, busy, campaignCount, onPatch }: {
  p: Placement; busy: boolean; campaignCount: number
  onPatch: (key: string, body: Record<string, unknown>) => Promise<void>
}) {
  const [cap, setCap] = useState(String(p.capacity))
  const [price, setPrice] = useState(String(p.price))
  const [days, setDays] = useState(String(p.durationDays))
  const [shown, setShown] = useState(String(p.displayCount))
  const [prio, setPrio] = useState(String(p.priority))
  /* جایگاهِ ویدیویی: خالی یعنی `null` — «رد کردن ممکن نیست» /
     «سقفِ مدت ندارد» — که با صفر یکی نیست. */
  const isVideo = p.contentKind === 'video'
  const [skip, setSkip] = useState(p.skipAfterSec === null ? '' : String(p.skipAfterSec))
  const [maxDur, setMaxDur] = useState(p.maxDurationSec === null ? '' : String(p.maxDurationSec))
  useEffect(() => {
    setCap(String(p.capacity)); setPrice(String(p.price)); setDays(String(p.durationDays))
    setShown(String(p.displayCount)); setPrio(String(p.priority))
    setSkip(p.skipAfterSec === null ? '' : String(p.skipAfterSec))
    setMaxDur(p.maxDurationSec === null ? '' : String(p.maxDurationSec))
  }, [p.capacity, p.price, p.durationDays, p.displayCount, p.priority, p.skipAfterSec, p.maxDurationSec])

  const numOrNull = (s: string) => (s.trim() === '' ? null : Number(s) || 0)

  const changed = Number(cap) !== p.capacity || Number(price) !== p.price || Number(days) !== p.durationDays
    || Number(shown) !== p.displayCount || Number(prio) !== p.priority
    || (isVideo && (numOrNull(skip) !== p.skipAfterSec || numOrNull(maxDur) !== p.maxDurationSec))

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

        {/* دو کنترل مستقل: وضعیت و حالت */}
        <button onClick={() => onPatch(p.key, { isActive: !p.isActive })} disabled={busy} style={{
          ...BTN,
          background: p.isActive ? 'rgba(14,122,56,0.10)' : 'rgba(0,0,0,0.04)',
          borderColor: p.isActive ? 'rgba(14,122,56,0.32)' : LINE,
          color: p.isActive ? FELT : SEC,
        }}>
          <Power size={14} /> {p.isActive ? 'فعال' : 'غیرفعال'}
        </button>
        <div style={{ width: 118 }}>
          <Select<Mode> compact value={p.mode} options={MODE_OPTS} ariaLabel={`حالت ${p.title}`}
            onChange={m => void onPatch(p.key, { mode: m })} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: 92 }}>
          <label style={LABEL}>ظرفیت</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(cap)}
            onChange={e => setCap(digits(e.target.value))} />
          {Number(cap) === 0 && (
            <div style={{ fontSize: 10.5, color: RED, marginTop: 4, lineHeight: 1.6 }}>
              با ظرفیت صفر چیزی نمایش داده نمی‌شود.
            </div>
          )}
        </div>
        <div style={{ width: 100 }}>
          <label style={LABEL}>تعداد نمایش</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(shown)}
            onChange={e => setShown(digits(e.target.value))} title="۰ = به‌اندازه‌ی ظرفیت" />
          {Number(shown) > Number(cap) && Number(cap) >= 0 && (
            <div style={{ fontSize: 10.5, color: '#B7791F', marginTop: 4, lineHeight: 1.6 }}>
              بیش از ظرفیت است؛ عملاً {fa(cap)} نمایش داده می‌شود.
            </div>
          )}
        </div>
        <div style={{ width: 138 }}>
          <label style={LABEL}>چرخش</label>
          <Select<Rotation> compact value={p.rotationMode} options={ROTATION_OPTS} ariaLabel={`چرخش ${p.title}`}
            onChange={r => void onPatch(p.key, { rotationMode: r })} />
        </div>
        <div style={{ width: 88 }}>
          <label style={LABEL}>اولویت</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(prio)}
            onChange={e => setPrio(digits(e.target.value))} title="بزرگ‌تر = مهم‌تر" />
        </div>
        <div style={{ width: 150 }}>
          <label style={LABEL}>قیمت پایه (تومان)</label>
          <input style={{ ...INPUT, background: '#fff' }} inputMode="numeric"
            value={price ? toFaDigits(Number(price).toLocaleString('en-US')) : ''}
            onChange={e => setPrice(digits(e.target.value))} />
        </div>
        <div style={{ width: 92 }}>
          <label style={LABEL}>مدت (روز)</label>
          <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(days)}
            onChange={e => setDays(digits(e.target.value))} />
        </div>
        {isVideo && (
          <>
            <div style={{ width: 116 }}>
              <label style={LABEL}>رد کردن پس از (ثانیه)</label>
              <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(skip)}
                onChange={e => setSkip(digits(e.target.value))} title="خالی = بیننده اصلاً نمی‌تواند رد کند" />
              {skip.trim() !== '' && maxDur.trim() !== '' && Number(skip) >= Number(maxDur) && (
                <div style={{ fontSize: 10.5, color: '#B7791F', marginTop: 4, lineHeight: 1.6 }}>
                  از سقف مدت بیشتر است؛ دکمه‌ی رد کردن هرگز فعال نمی‌شود.
                </div>
              )}
            </div>
            <div style={{ width: 116 }}>
              <label style={LABEL}>سقف مدت (ثانیه)</label>
              <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric" value={fa(maxDur)}
                onChange={e => setMaxDur(digits(e.target.value))} title="ویدیوی بلندتر از این در فرم خرید رد می‌شود" />
            </div>
          </>
        )}
        <button onClick={() => onPatch(p.key, {
          capacity: Number(cap) || 0, price: Number(price) || 0, durationDays: Number(days) || 30,
          displayCount: Number(shown) || 0, priority: Number(prio) || 0,
          ...(isVideo ? { skipAfterSec: numOrNull(skip), maxDurationSec: numOrNull(maxDur) } : {}),
        })}
          disabled={busy || !changed}
          style={{ ...BTN, opacity: changed ? 1 : 0.45, cursor: changed ? 'pointer' : 'default' }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} ذخیره
        </button>
      </div>

      {p.mode === 'paid' && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: FELT, background: 'rgba(14,122,56,0.07)', borderRadius: 9, padding: '7px 11px', lineHeight: 1.8 }}>
          این جایگاه در صفحه‌ی «درخواست تبلیغات» قابل خرید است. پله‌های قیمتش را در بخش پلن‌ها تنظیم کنید.
        </div>
      )}
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
          <div><label style={LABEL}>وضعیت شروع</label>
            <Select value={draft.status} options={STATUS_OPTS} ariaLabel="وضعیت"
              onChange={v => setDraft(d => ({ ...d, status: v }))} /></div>
        </div>
        <button onClick={create} disabled={busy === 'new'} style={{ ...BTN, marginTop: 14 }}>
          {busy === 'new' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} ساخت کمپین
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
                    <img loading="lazy" decoding="async" src={banner} alt="" style={{ width: 68, height: 40, objectFit: 'cover', borderRadius: 8, border: `1px solid ${LINE}`, flexShrink: 0 }} />
                  : <span style={{ width: 68, height: 40, borderRadius: 8, background: 'rgba(199,166,106,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: GOLD_D, flexShrink: 0 }}>
                      {p?.contentKind === 'video'
                        ? 'ویدیو'
                        : String(c.content?.ref ?? '').slice(0, 8) || '—'}
                    </span>}
                <div style={{ flex: 1, minWidth: 170 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: INK }}>
                    {c.title || c.advertiser || 'کمپین'} <span style={{ fontWeight: 600, color: MUT }}>· {p?.title ?? c.placementKey}</span>
                  </div>
                  <div style={{ fontSize: 11, color: MUT, marginTop: 3 }}>
                    {faDate(c.startsAt)} تا {faDate(c.endsAt)} · {fa(c.impressions)} نمایش · {fa(c.clicks)} کلیک
                  </div>
                  {/* شمارنده‌های پیش‌پخش — فقط وقتی واقعاً عددی هست.
                      نرخِ رد کردن از مجموعِ پایان‌یافته‌ها حساب می‌شود، نه
                      از کلِ نمایش‌ها؛ نمایشی که هنوز تمام نشده نه کامل
                      است نه ردشده. */}
                  {p?.contentKind === 'video' && ((c.completedViews ?? 0) + (c.skippedViews ?? 0)) > 0 && (
                    <div style={{ fontSize: 11, color: MUT, marginTop: 3 }}>
                      {fa(c.completedViews ?? 0)} تماشای کامل · {fa(c.skippedViews ?? 0)} رد شده ·{' '}
                      نرخ رد کردن {fa(Math.round(
                        ((c.skippedViews ?? 0) / ((c.completedViews ?? 0) + (c.skippedViews ?? 0))) * 100,
                      ))}٪
                    </div>
                  )}
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

/* ── پلن‌های قیمت‌گذاری: ساخت، ویرایش، جابه‌جایی، حذف ────────── */
function PlansSection({ plans, placements, onChanged, flash, call }: {
  plans: Plan[]; placements: Placement[]
  onChanged: () => Promise<void>; flash: (m: string) => void
  call: (method: string, body?: Record<string, unknown>, query?: string) => Promise<Record<string, unknown> | null>
}) {
  const [busy, setBusy] = useState('')
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({
    name: '', description: '', placementKey: '', price: '', durationDays: '30', adQuantity: '1', creditAmount: '1', badge: '',
  })

  const create = async () => {
    if (!draft.name.trim()) { flash('نام پلن لازم است'); return }
    setBusy('new')
    try {
      const ok = await call('POST', {
        type: 'plan', name: draft.name, description: draft.description,
        placementKey: draft.placementKey || undefined,
        price: Number(draft.price) || 0, durationDays: Number(draft.durationDays) || 30,
        adQuantity: Number(draft.adQuantity) || 0, creditAmount: Number(draft.creditAmount) || 0,
        badge: draft.badge,
      })
      if (ok) {
        setDraft({ name: '', description: '', placementKey: '', price: '', durationDays: '30', adQuantity: '1', creditAmount: '1', badge: '' })
        setOpen(false); await onChanged(); flash('پلن ساخته شد')
      }
    } finally { setBusy('') }
  }

  /* گروه‌بندی بر اساس جایگاه تا پله‌های مدت هر جایگاه کنار هم باشند */
  const groups: { key: string; title: string; items: Plan[] }[] = []
  for (const p of placements) {
    const items = plans.filter(x => x.placementKey === p.key)
    if (items.length) groups.push({ key: p.key, title: p.title, items })
  }
  const general = plans.filter(x => !x.placementKey || !placements.some(p => p.key === x.placementKey))
  if (general.length) groups.push({ key: '', title: 'پلن‌های عمومی آگهی (بدون جایگاه)', items: general })

  return (
    <section style={CARD}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
        <Package size={17} style={{ color: GOLD_D }} />
        <h2 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: 0 }}>پلن‌های قیمت‌گذاری</h2>
        <button onClick={() => setOpen(o => !o)} style={{ ...BTN, marginInlineStart: 'auto', padding: '7px 13px', fontSize: 12 }}>
          <Plus size={13} /> پلن تازه
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 14px', lineHeight: 1.95 }}>
        قیمت‌ها از دیتابیس خوانده می‌شوند، نه از کد. هر جایگاه می‌تواند چند پله‌ی مدت داشته باشد
        (مثلاً ۷ روزه، ۳۰ روزه، ۳ ماهه). پلنی که سفارش ثبت‌شده دارد حذف نمی‌شود و فقط غیرفعال می‌گردد.
      </p>

      {open && (
        <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: 15, marginBottom: 16 }}>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>نام پلن *</label>
              <input style={INPUT} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="مثلاً بنر کناری راست — ۳۰ روزه" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>جایگاه</label>
              <Select value={draft.placementKey} ariaLabel="جایگاه پلن"
                options={[{ value: '', label: 'بدون جایگاه (پلن عمومی آگهی)' },
                  ...placements.map(p => ({ value: p.key, label: p.title, hint: MODE_FA[p.mode] }))]}
                onChange={v => setDraft(d => ({ ...d, placementKey: v }))} />
            </div>
            <div><label style={LABEL}>قیمت (تومان)</label>
              <input style={INPUT} inputMode="numeric"
                value={draft.price ? toFaDigits(Number(draft.price).toLocaleString('en-US')) : ''}
                onChange={e => setDraft(d => ({ ...d, price: digits(e.target.value) }))} /></div>
            <div><label style={LABEL}>مدت (روز)</label>
              <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(draft.durationDays)}
                onChange={e => setDraft(d => ({ ...d, durationDays: digits(e.target.value) }))} /></div>
            <div><label style={LABEL}>تعداد آگهی</label>
              <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(draft.adQuantity)}
                onChange={e => setDraft(d => ({ ...d, adQuantity: digits(e.target.value) }))} /></div>
            <div><label style={LABEL}>اعتبار</label>
              <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(draft.creditAmount)}
                onChange={e => setDraft(d => ({ ...d, creditAmount: digits(e.target.value) }))} /></div>
            <div><label style={LABEL}>برچسب</label>
              <input style={INPUT} value={draft.badge} onChange={e => setDraft(d => ({ ...d, badge: e.target.value }))}
                placeholder="مثلاً پرمیوم" /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={LABEL}>توضیح</label>
              <input style={INPUT} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /></div>
          </div>
          <button onClick={create} disabled={busy === 'new'} style={{ ...BTN, marginTop: 14 }}>
            {busy === 'new' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} ساخت پلن
          </button>
        </div>
      )}

      {groups.length === 0 ? (
        <p style={{ fontSize: 13, color: MUT, margin: 0, textAlign: 'center', padding: 14 }}>هنوز پلنی تعریف نشده است.</p>
      ) : groups.map(g => (
        <div key={g.key || 'general'} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: SEC, marginBottom: 8 }}>{g.title}</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {g.items.map(p => (
              <PlanRow key={p.id} p={p} placements={placements} onChanged={onChanged} flash={flash} call={call} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/* ── ردیف پلن قیمت ─────────────────────────────────────────── */
function PlanRow({ p, placements, onChanged, flash, call }: {
  p: Plan; placements: Placement[]
  onChanged: () => Promise<void>; flash: (m: string) => void
  call: (method: string, body?: Record<string, unknown>, query?: string) => Promise<Record<string, unknown> | null>
}) {
  const [busy, setBusy] = useState(false)
  const [price, setPrice] = useState(String(p.price))
  const [qty, setQty] = useState(String(p.adQuantity))
  const [days, setDays] = useState(String(p.durationDays))
  const [credit, setCredit] = useState(String(p.creditAmount))
  useEffect(() => {
    setPrice(String(p.price)); setQty(String(p.adQuantity))
    setDays(String(p.durationDays)); setCredit(String(p.creditAmount))
  }, [p.price, p.adQuantity, p.durationDays, p.creditAmount])

  const changed = Number(price) !== p.price || Number(qty) !== p.adQuantity
    || Number(days) !== p.durationDays || Number(credit) !== p.creditAmount

  const save = async (body: Record<string, unknown>) => {
    setBusy(true)
    try { if (await call('PATCH', { planId: p.id, ...body })) { await onChanged(); flash('ذخیره شد') } }
    finally { setBusy(false) }
  }

  const remove = async () => {
    if (!confirm(`پلن «${p.name}» حذف شود؟ اگر سفارشی داشته باشد فقط غیرفعال می‌شود.`)) return
    setBusy(true)
    try {
      const r = await call('DELETE', undefined, `?plan=${p.id}`)
      if (r) { await onChanged(); flash(r.deactivated ? 'سفارش داشت؛ غیرفعال شد' : 'پلن حذف شد') }
    } finally { setBusy(false) }
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
          {p.creditAmount > 0 ? ` · ${fa(p.creditAmount)} اعتبار` : ''}
          {p.description ? ` · ${p.description}` : ''}
        </div>
        <div style={{ marginTop: 7, maxWidth: 260 }}>
          <Select compact value={p.placementKey ?? ''} ariaLabel={`جایگاه ${p.name}`}
            options={[{ value: '', label: 'بدون جایگاه (عمومی)' },
              ...placements.map(x => ({ value: x.key, label: x.title }))]}
            onChange={v => void save({ placementKey: v })} />
        </div>
      </div>
      <div style={{ width: 84 }}>
        <label style={LABEL}>تعداد</label>
        <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(qty)} onChange={e => setQty(digits(e.target.value))} />
      </div>
      <div style={{ width: 84 }}>
        <label style={LABEL}>اعتبار</label>
        <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(credit)} onChange={e => setCredit(digits(e.target.value))} />
      </div>
      <div style={{ width: 84 }}>
        <label style={LABEL}>مدت</label>
        <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(days)} onChange={e => setDays(digits(e.target.value))} />
      </div>
      <div style={{ width: 140 }}>
        <label style={LABEL}>قیمت (تومان)</label>
        <input style={INPUT} inputMode="numeric" value={price ? toFaDigits(Number(price).toLocaleString('en-US')) : '۰'}
          onChange={e => setPrice(digits(e.target.value))} />
      </div>
      <button onClick={() => void save({ price: Number(price) || 0, adQuantity: Number(qty) || 0, durationDays: Number(days) || 30, creditAmount: Number(credit) || 0 })}
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
      <button onClick={() => void remove()} disabled={busy} title="حذف"
        style={{ ...BTN, padding: '9px 11px', background: 'rgba(178,59,46,0.08)', borderColor: 'rgba(178,59,46,0.28)', color: RED }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}
