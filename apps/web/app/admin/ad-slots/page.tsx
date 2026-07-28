'use client'

/* جایگاه‌های تبلیغاتی — ظرفیت، قیمت و مدتِ هر جایگاه، بنرهای فعال،
   و درخواست‌های تبلیغی که کاربران فرستاده‌اند.

   کلیدِ «نمایش جایگاه‌ها روی سایت» بالای صفحه است: تا روشنش نکنید،
   هیچ بنری برای بازدیدکننده‌ها ظاهر نمی‌شود — حتی اگر ثبت شده باشد. */

import { useCallback, useEffect, useState } from 'react'
import {
  Megaphone, Save, Power, Loader2, AlertCircle, Plus, Trash2, Pause, Play, Inbox, Phone,
} from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { toFaDigits, faDateTime } from '../../../lib/jalali'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const CARD: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 18 }
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

interface Slot { key: string; title: string; description: string | null; capacity: number; price: number; durationDays: number; isActive: boolean }
interface Placement {
  id: string; slotKey: string; advertiser: string; title: string; imageUrl: string; linkUrl: string
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED'; endsAt: string; impressions: number; clicks: number
}
interface AdRequest {
  id: string; name: string; phone: string; email: string | null; company: string | null
  slot_key: string | null; budget: string | null; message: string; status: string; created_at: string
}

const fa = (n: number) => toFaDigits(n.toLocaleString('en-US'))
const digits = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '')

export default function AdminAdSlots() {
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [placements, setPlacements] = useState<Placement[]>([])
  const [requests, setRequests] = useState<AdRequest[]>([])
  const [enabled, setEnabled] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState('')
  const [draft, setDraft] = useState({ slotKey: '', advertiser: '', title: '', imageUrl: '', linkUrl: '', durationDays: '30' })

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2600) }

  const load = useCallback(async () => {
    try {
      const [ar, sr] = await Promise.all([
        apiFetch('/api/admin/ad-slots', { cache: 'no-store' }),
        apiFetch('/api/admin/settings', { cache: 'no-store' }),
      ])
      const aj = await ar.json().catch(() => ({}))
      if (!ar.ok) { setErr(aj?.message || 'دسترسی مجاز نیست'); setSlots([]); return }
      setSlots(aj.slots ?? []); setPlacements(aj.placements ?? []); setRequests(aj.requests ?? []); setErr('')

      const sj = await sr.json().catch(() => ({}))
      setEnabled(!!sj?.settings?.ad_slots_enabled)
    } catch { setErr('خطا در ارتباط با سرور'); setSlots([]) }
  }, [])
  useEffect(() => { void load() }, [load])

  const patchSlot = async (key: string, body: Record<string, unknown>) => {
    setBusy(key)
    try {
      const r = await apiFetch('/api/admin/ad-slots', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotKey: key, ...body }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { flash(j?.message || 'ذخیره انجام نشد'); return }
      await load(); flash('ذخیره شد')
    } finally { setBusy('') }
  }

  const patchPlacement = async (id: string, body: Record<string, unknown>) => {
    setBusy(id)
    try {
      const r = await apiFetch('/api/admin/ad-slots', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placementId: id, ...body }),
      })
      if (!r.ok) { flash('انجام نشد'); return }
      await load()
    } finally { setBusy('') }
  }

  const removePlacement = async (id: string) => {
    if (!confirm('این بنر حذف شود؟')) return
    setBusy(id)
    try {
      const r = await apiFetch(`/api/admin/ad-slots?placement=${id}`, { method: 'DELETE' })
      if (!r.ok) { flash('حذف انجام نشد'); return }
      await load(); flash('بنر حذف شد')
    } finally { setBusy('') }
  }

  const addPlacement = async () => {
    if (!draft.slotKey) { flash('جایگاه را انتخاب کنید'); return }
    if (!draft.imageUrl.trim()) { flash('نشانیِ تصویرِ بنر لازم است'); return }
    setBusy('new')
    try {
      const r = await apiFetch('/api/admin/ad-slots', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, durationDays: Number(draft.durationDays) || 30 }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { flash(j?.message || 'ثبتِ بنر انجام نشد'); return }
      setDraft({ slotKey: '', advertiser: '', title: '', imageUrl: '', linkUrl: '', durationDays: '30' })
      await load(); flash('بنر ثبت شد')
    } finally { setBusy('') }
  }

  const toggleGlobal = async () => {
    setBusy('global')
    try {
      const r = await apiFetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_slots_enabled: !enabled }),
      })
      if (!r.ok) { flash('انجام نشد'); return }
      await load(); flash(enabled ? 'جایگاه‌ها خاموش شد' : 'جایگاه‌ها روی سایت روشن شد')
    } finally { setBusy('') }
  }

  const openRequests = requests.filter(r => r.status !== 'CLOSED')

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <Megaphone size={21} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>جایگاه‌های تبلیغاتی</h1>
        {openRequests.length > 0 && (
          <span style={{ fontSize: 11.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.13)', borderRadius: 20, padding: '4px 11px' }}>
            {toFaDigits(openRequests.length)} درخواستِ بازِ تبلیغ
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: MUT, margin: '0 0 18px', lineHeight: 1.9 }}>
        چهار جایگاهِ ثابت روی سایت. ظرفیت، قیمت و مدتِ هرکدام را خودتان تعیین می‌کنید.
      </p>

      {err && (
        <div style={{ ...CARD, borderColor: 'rgba(178,59,46,0.3)', display: 'flex', gap: 9, alignItems: 'center', marginBottom: 16 }}>
          <AlertCircle size={17} style={{ color: RED }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>{err}</span>
        </div>
      )}

      {/* ── کلیدِ اصلی ── */}
      <section style={{ ...CARD, marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: INK, marginBottom: 4 }}>نمایشِ جایگاه‌ها روی سایت</div>
          <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 1.9 }}>
            تا وقتی خاموش است، بازدیدکننده‌ها هیچ بنری نمی‌بینند — حتی بنرهای ثبت‌شده.
            می‌توانید همه چیز را از قبل آماده کنید و روزِ شروع، فقط این کلید را بزنید.
          </p>
        </div>
        <button onClick={toggleGlobal} disabled={busy === 'global'} style={{
          ...BTN,
          background: enabled ? 'rgba(14,122,56,0.10)' : 'rgba(0,0,0,0.04)',
          borderColor: enabled ? 'rgba(14,122,56,0.32)' : LINE,
          color: enabled ? FELT : SEC,
        }}>
          <Power size={15} /> {enabled ? 'روشن — روی سایت دیده می‌شود' : 'خاموش'}
        </button>
      </section>

      {/* ── جایگاه‌ها ── */}
      {slots === null ? (
        <div style={{ ...CARD, display: 'flex', gap: 9, alignItems: 'center', color: MUT }}>
          <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>در حال بارگذاری…</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
          {slots.map(s => (
            <SlotRow key={s.key} s={s} busy={busy === s.key} onPatch={patchSlot}
              banners={placements.filter(p => p.slotKey === s.key)}
              onPatchBanner={patchPlacement} onRemoveBanner={removePlacement} />
          ))}
        </div>
      )}

      {/* ── ثبتِ بنرِ تازه ── */}
      <section style={{ ...CARD, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: '0 0 14px' }}>ثبتِ بنرِ تازه</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
          <div><label style={LABEL}>جایگاه *</label>
            <select value={draft.slotKey} onChange={e => setDraft(d => ({ ...d, slotKey: e.target.value }))} style={{ width: '100%' }}>
              <option value="">انتخاب کنید…</option>
              {(slots ?? []).map(s => <option key={s.key} value={s.key}>{s.title}</option>)}
            </select></div>
          <div><label style={LABEL}>تبلیغ‌دهنده</label>
            <input style={INPUT} value={draft.advertiser} onChange={e => setDraft(d => ({ ...d, advertiser: e.target.value }))} /></div>
          <div><label style={LABEL}>عنوان (متنِ جایگزینِ تصویر)</label>
            <input style={INPUT} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} /></div>
          <div><label style={LABEL}>مدت (روز)</label>
            <input style={INPUT} inputMode="numeric" value={draft.durationDays} onChange={e => setDraft(d => ({ ...d, durationDays: digits(e.target.value) }))} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={LABEL}>نشانیِ تصویرِ بنر *</label>
            <input style={{ ...INPUT, direction: 'ltr', textAlign: 'right' }} value={draft.imageUrl}
              onChange={e => setDraft(d => ({ ...d, imageUrl: e.target.value }))} placeholder="https://…" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={LABEL}>لینکِ مقصد</label>
            <input style={{ ...INPUT, direction: 'ltr', textAlign: 'right' }} value={draft.linkUrl}
              onChange={e => setDraft(d => ({ ...d, linkUrl: e.target.value }))} placeholder="https://…" /></div>
        </div>
        <button onClick={addPlacement} disabled={busy === 'new'} style={{ ...BTN, marginTop: 14 }}>
          {busy === 'new' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} ثبتِ بنر
        </button>
      </section>

      {/* ── درخواست‌های تبلیغ ── */}
      <section style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Inbox size={17} style={{ color: GOLD_D }} />
          <h2 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: 0 }}>درخواست‌های تبلیغ</h2>
        </div>
        {requests.length === 0 ? (
          <p style={{ fontSize: 13, color: MUT, margin: 0, textAlign: 'center', padding: 20 }}>هنوز درخواستی ثبت نشده است.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {requests.map(r => (
              <div key={r.id} style={{
                border: `1px solid ${LINE}`, borderRadius: 13, padding: '13px 15px',
                opacity: r.status === 'CLOSED' ? 0.55 : 1,
              }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 900, color: INK }}>{r.name}</span>
                  {r.company && <span style={{ fontSize: 12, color: MUT }}>· {r.company}</span>}
                  <a href={`tel:${r.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: GOLD_D, textDecoration: 'none', direction: 'ltr' }}>
                    <Phone size={13} />{toFaDigits(r.phone)}
                  </a>
                  <span style={{ marginInlineStart: 'auto', fontSize: 11.5, color: MUT }}>{faDateTime(r.created_at)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: SEC, lineHeight: 1.9 }}>
                  {r.slot_key && <>جایگاه: {(slots ?? []).find(s => s.key === r.slot_key)?.title ?? r.slot_key} · </>}
                  {r.budget && <>بودجه: {r.budget} · </>}
                  {r.email && <span style={{ direction: 'ltr', display: 'inline-block' }}>{r.email}</span>}
                </div>
                {r.message && <p style={{ fontSize: 12.5, color: SEC, margin: '8px 0 0', lineHeight: 1.95 }}>{r.message}</p>}
                {r.status !== 'CLOSED' && (
                  <button
                    onClick={async () => {
                      setBusy(r.id)
                      try {
                        await apiFetch(`/api/admin/ad-slots?request=${r.id}`, { method: 'DELETE' })
                        await load()
                      } finally { setBusy('') }
                    }}
                    disabled={busy === r.id}
                    style={{ ...BTN, marginTop: 10, padding: '7px 13px', fontSize: 12 }}>
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

function SlotRow({ s, banners, busy, onPatch, onPatchBanner, onRemoveBanner }: {
  s: Slot; banners: Placement[]; busy: boolean
  onPatch: (key: string, body: Record<string, unknown>) => Promise<void>
  onPatchBanner: (id: string, body: Record<string, unknown>) => Promise<void>
  onRemoveBanner: (id: string) => Promise<void>
}) {
  const [cap, setCap] = useState(String(s.capacity))
  const [price, setPrice] = useState(String(s.price))
  const [days, setDays] = useState(String(s.durationDays))
  useEffect(() => {
    setCap(String(s.capacity)); setPrice(String(s.price)); setDays(String(s.durationDays))
  }, [s.capacity, s.price, s.durationDays])

  const changed = Number(cap) !== s.capacity || Number(price) !== s.price || Number(days) !== s.durationDays

  return (
    <div style={{ ...CARD, opacity: s.isActive ? 1 : 0.62 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 180, flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: INK }}>{s.title}</div>
          {s.description && <div style={{ fontSize: 12, color: MUT, marginTop: 4, lineHeight: 1.85 }}>{s.description}</div>}
        </div>
        <div style={{ width: 96 }}><label style={LABEL}>ظرفیت</label>
          <input style={INPUT} inputMode="numeric" value={cap} onChange={e => setCap(digits(e.target.value))} /></div>
        <div style={{ width: 146 }}><label style={LABEL}>قیمت (تومان)</label>
          <input style={INPUT} inputMode="numeric" value={price ? Number(price).toLocaleString('en-US') : ''}
            onChange={e => setPrice(digits(e.target.value))} /></div>
        <div style={{ width: 96 }}><label style={LABEL}>مدت (روز)</label>
          <input style={INPUT} inputMode="numeric" value={days} onChange={e => setDays(digits(e.target.value))} /></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onPatch(s.key, { capacity: Number(cap) || 0, price: Number(price) || 0, durationDays: Number(days) || 30 })}
            disabled={busy || !changed} style={{ ...BTN, opacity: changed ? 1 : 0.45, cursor: changed ? 'pointer' : 'default' }}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} ذخیره
          </button>
          <button onClick={() => onPatch(s.key, { isActive: !s.isActive })} disabled={busy} style={{
            ...BTN,
            background: s.isActive ? 'rgba(0,0,0,0.04)' : 'rgba(14,122,56,0.10)',
            borderColor: s.isActive ? LINE : 'rgba(14,122,56,0.32)',
            color: s.isActive ? SEC : FELT,
          }}>
            <Power size={14} /> {s.isActive ? 'غیرفعال' : 'فعال'}
          </button>
        </div>
      </div>

      {banners.length > 0 && (
        <div style={{ borderTop: `1px dashed ${LINE}`, marginTop: 14, paddingTop: 14, display: 'grid', gap: 9 }}>
          {banners.map(b => (
            <div key={b.id} style={{ display: 'flex', gap: 11, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.imageUrl} alt="" style={{ width: 76, height: 42, objectFit: 'cover', borderRadius: 8, border: `1px solid ${LINE}`, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: INK }}>{b.title || b.advertiser || 'بنر'}</div>
                <div style={{ fontSize: 11.5, color: MUT, marginTop: 3 }}>
                  تا {faDateTime(b.endsAt)} · {fa(b.impressions)} نمایش · {fa(b.clicks)} کلیک
                </div>
              </div>
              <button onClick={() => onPatchBanner(b.id, { status: b.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })}
                disabled={busy} title={b.status === 'ACTIVE' ? 'توقف' : 'ادامه'}
                style={{ ...BTN, padding: '7px 11px' }}>
                {b.status === 'ACTIVE' ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button onClick={() => onRemoveBanner(b.id)} disabled={busy} title="حذف"
                style={{ ...BTN, padding: '7px 11px', background: 'rgba(178,59,46,0.08)', borderColor: 'rgba(178,59,46,0.28)', color: RED }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
