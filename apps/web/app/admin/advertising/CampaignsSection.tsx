'use client'

import { useState } from 'react'
import { ask, askText } from '../../../lib/ui/dialogs'
import { Loader2, Plus, Trash2, Wallet } from 'lucide-react'
import { faDate } from '../../../lib/jalali'
import Select from '../../../components/ui/Select'
import { INK, MUT, LINE, GOLD_D, RED, CARD, INPUT, LABEL, BTN, STATUS_FA, STATUS_OPTS, Placement, Campaign, AdOrder, fa, digits } from './shared'

/* ── کمپین‌ها: فهرست + ساخت ─────────────────────────────────── */
export function CampaignsSection({ placements, campaigns, orders, onChanged, flash, call }: {
  placements: Placement[]; campaigns: Campaign[]; orders: AdOrder[]
  onChanged: () => Promise<void>; flash: (m: string) => void
  call: (method: string, body?: Record<string, unknown>, query?: string) => Promise<Record<string, unknown> | null>
}) {
  const [busy, setBusy] = useState('')
  /* سفارش هر کمپین — برای نشان‌دادن مبلغ و امکان بازگرداندنش */
  const orderOf = new Map(orders.filter(o => o.campaign_id).map(o => [String(o.campaign_id), o]))

  const refund = async (order: AdOrder) => {
    /* بازپرداخت پول را برمی‌گرداند و کمپین را می‌خواباند — برگشت‌ناپذیر
       است، پس تأیید صریح می‌گیریم. */
    const reason = await askText(
      `بازگرداندن ${fa(order.amount)} تومان و لغو کمپین`,
      {
        body: 'دلیل بازپرداخت در گزارش مالی ثبت می‌شود و برگشت‌پذیر نیست',
        placeholder: 'مثال: کمپین به‌درخواست خود تبلیغ‌دهنده لغو شد',
        confirmLabel: 'بازپرداخت',
      },
    )
    if (reason === null) return
    setBusy(order.id)
    try {
      const r = await call('PATCH', { type: 'refund', orderId: order.id, reason })
      if (r) { await onChanged(); flash(r.already ? 'این سفارش قبلا بازپرداخت شده بود' : 'بازپرداخت ثبت شد') }
    } finally { setBusy('') }
  }

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
    if (!(await ask('این کمپین حذف شود؟'))) return
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
        <p style={{ fontSize: 13, color: MUT, margin: 0, textAlign: 'center', padding: 14 }}>هنوز کمپینی ساخته نشده است</p>
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
                  {/* شمارنده‌های پیش‌پخش — فقط وقتی واقعا عددی هست.
                      نرخ رد کردن از مجموع پایان‌یافته‌ها حساب می‌شود، نه
                      از کل نمایش‌ها؛ نمایشی که هنوز تمام نشده نه کامل
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
                {/* بازپرداخت فقط برای سفارش واقعا پرداخت‌شده معنا دارد.
                    کمپین ادمین‌ساخته سفارشی ندارد و دکمه‌ای هم نمی‌گیرد. */}
                {(() => {
                  const o = orderOf.get(c.id)
                  if (!o) return null
                  if (o.status === 'REFUNDED') {
                    return (
                      <span title={o.refund_reason ?? ''} style={{
                        fontSize: 11, fontWeight: 800, color: MUT, background: 'rgba(0,0,0,0.05)',
                        borderRadius: 20, padding: '4px 11px', whiteSpace: 'nowrap',
                      }}>
                        بازپرداخت {fa(o.refund_amount ?? o.amount)}
                      </span>
                    )
                  }
                  if (o.status !== 'PAID') return null
                  return (
                    <button onClick={() => void refund(o)} disabled={busy === o.id} title="بازگرداندن وجه و لغو کمپین"
                      style={{ ...BTN, padding: '7px 11px', fontSize: 11.5 }}>
                      {busy === o.id ? <Loader2 size={13} className="animate-spin" /> : <Wallet size={13} />}
                      بازپرداخت {fa(o.amount)}
                    </button>
                  )
                })()}
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
