'use client'

/* پنل تبلیغات (فاز ۲) — شش جایگاه مستقل، کمپین‌ها، پلن‌های قیمت،
   و درخواست‌های تبلیغ.

   عمدا هیچ کلید سراسری‌ای وجود ندارد: هر جایگاه Active/Inactive و
   Mode (رایگان/دستی/پولی) خودش را دارد — طبق تصمیم D1. */

import { AdminHeader } from '../../../components/admin/AdminHeader';
import { useCallback, useEffect, useState } from 'react'
import { Megaphone, Loader2, AlertCircle, Inbox, Phone, LayoutGrid } from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { toFaDigits, faDateTime } from '../../../lib/jalali'
import { INK, SEC, MUT, LINE, GOLD_D, RED, CARD, BTN, Placement, Campaign, Plan, Stats, AdRequest, AdOrder } from './shared'
import { StatsSection } from './StatsSection'
import { NewPlacement, PlacementRow } from './PlacementsSection'
import { CampaignsSection } from './CampaignsSection'
import { PlansSection } from './PlansSection'

export default function AdminAdvertising() {
  const [placements, setPlacements] = useState<Placement[] | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [requests, setRequests] = useState<AdRequest[]>([])
  const [orders, setOrders] = useState<AdOrder[]>([])
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
      setOrders(j.orders ?? [])
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
    <main className="adm-page">
      <AdminHeader
        icon={<Megaphone size={26} className="text-gold-text" aria-hidden />}
        title="سیستم تبلیغات"
        description="شش جایگاه مستقل، هر جایگاه فعال/غیرفعال و حالت خودش (رایگان، دستی، پولی) را جدا دارد — هیچ کلید سراسری‌ای وجود ندارد"
        actions={openRequests.length > 0 && (
          <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-text">
            {toFaDigits(openRequests.length)} درخواست باز
          </span>
        )} />

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
        placements={placements ?? []} campaigns={campaigns} orders={orders}
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
          <p style={{ fontSize: 13, color: MUT, margin: 0, textAlign: 'center', padding: 20 }}>هنوز درخواستی ثبت نشده است</p>
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
          position: 'fixed', bottom: `calc(26px + env(safe-area-inset-bottom))`, insetInline: 0, margin: '0 auto', width: 'fit-content', zIndex: 60,
          background: INK, color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 20px', borderRadius: 22,
        }}>{toast}</div>
      )}
    </main>
  )
}
