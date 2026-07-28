'use client'

/* بسته‌های آگهی — شما پلن می‌سازید (تعداد آگهی، بازه، مدت اعتبار،
   قیمت)، و همان‌ها در صفحه‌ی /plans به کاربر نشان داده می‌شوند.

   کلیدِ «اعمالِ محدودیت» جداست: تا وقتی خاموش است هیچ کاربری محدود
   نمی‌شود، ولی پلن‌ها ساخته و حتی فروخته می‌شوند. */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Plus, Save, Power, Loader2, AlertCircle, CheckCircle2, Wallet, ArrowLeft } from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { toFaDigits } from '../../../lib/jalali'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const CARD = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 18 } as const
const INPUT: React.CSSProperties = {
  width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '9px 13px',
  fontSize: 13, fontFamily: 'inherit', color: INK, background: '#FAFAF7', outline: 'none',
}
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 800, color: SEC, marginBottom: 6 }
const BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 10, cursor: 'pointer',
  border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)', color: GOLD_D,
  fontSize: 13, fontWeight: 800, fontFamily: 'inherit', padding: '9px 15px', transition: 'transform .2s',
}

type Period = 'day' | 'week' | 'month'
const PERIOD_FA: Record<Period, string> = { day: 'روز', week: 'هفته', month: 'ماه' }

interface Plan {
  id: string; name: string; description: string | null
  quota: number; period: Period; durationDays: number
  price: number; isActive: boolean; sortOrder: number; badge: string | null
}

const emptyDraft = () => ({
  name: '', description: '', quota: '3', period: 'week' as Period,
  durationDays: '30', price: '', badge: '', sortOrder: '0',
})

const fa = (n: number) => toFaDigits(n.toLocaleString('en-US'))
const digits = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '')

export default function AdminAdPlans() {
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const [draft, setDraft] = useState(emptyDraft())
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState('')

  /* تنظیماتِ کلیدی: روشن/خاموشِ محدودیت، سهمیه‌ی رایگان، حسابِ واریز */
  const [quotaOn, setQuotaOn] = useState(false)
  const [free, setFree] = useState({ quota: '3', period: 'week' as Period })
  const [bank, setBank] = useState({ ownerName: '', bankName: '', cardNumber: '', iban: '' })

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2600) }

  const load = useCallback(async () => {
    try {
      const [pr, sr] = await Promise.all([
        apiFetch('/api/admin/ad-plans', { cache: 'no-store' }),
        apiFetch('/api/admin/settings', { cache: 'no-store' }),
      ])
      const pj = await pr.json().catch(() => ({}))
      if (!pr.ok) { setErr(pj?.message || 'دسترسی مجاز نیست'); setPlans([]); return }
      setPlans(pj.plans ?? []); setErr('')

      const sj = await sr.json().catch(() => ({}))
      const s = sj?.settings ?? {}
      setQuotaOn(!!s.ads_quota_enabled)
      if (s.ads_free_quota) setFree({ quota: String(s.ads_free_quota.quota ?? 3), period: (s.ads_free_quota.period ?? 'week') as Period })
      if (s.platform_bank) setBank({
        ownerName: s.platform_bank.ownerName ?? '', bankName: s.platform_bank.bankName ?? '',
        cardNumber: s.platform_bank.cardNumber ?? '', iban: s.platform_bank.iban ?? '',
      })
    } catch { setErr('خطا در ارتباط با سرور'); setPlans([]) }
  }, [])
  useEffect(() => { void load() }, [load])

  const create = async () => {
    if (!draft.name.trim()) { flash('نامِ بسته لازم است'); return }
    if (!draft.price.trim()) { flash('قیمتِ بسته لازم است'); return }
    setCreating(true)
    try {
      const r = await apiFetch('/api/admin/ad-plans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name.trim(), description: draft.description.trim(),
          quota: Number(draft.quota) || 0, period: draft.period,
          durationDays: Number(draft.durationDays) || 30,
          price: Number(draft.price) || 0,
          badge: draft.badge.trim(), sortOrder: Number(draft.sortOrder) || 0,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { flash(j?.message || 'ساختِ بسته انجام نشد'); return }
      setDraft(emptyDraft()); await load(); flash('بسته ساخته شد')
    } finally { setCreating(false) }
  }

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(id)
    try {
      const r = await apiFetch('/api/admin/ad-plans', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { flash(j?.message || 'ویرایش انجام نشد'); return }
      await load(); flash('ذخیره شد')
    } finally { setBusy('') }
  }

  const saveSettings = async (body: Record<string, unknown>, msg: string) => {
    setBusy('settings')
    try {
      const r = await apiFetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { flash(j?.message || 'ذخیره انجام نشد'); return }
      await load(); flash(msg)
    } finally { setBusy('') }
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <Package size={21} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>بسته‌های آگهی</h1>
        <Link href="/plans" style={{ ...BTN, marginInlineStart: 'auto', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> دیدنِ صفحه‌ی کاربران
        </Link>
      </div>
      <p style={{ fontSize: 13, color: MUT, margin: '0 0 18px', lineHeight: 1.9 }}>
        هر بسته را خودتان می‌سازید: چند آگهی، در چه بازه‌ای، چند روز اعتبار و چه قیمتی.
        قیمت و تعداد را هر وقت بخواهید عوض کنید — سفارش‌های قبلی دست‌نخورده می‌مانند.
      </p>

      {err && (
        <div style={{ ...CARD, borderColor: 'rgba(178,59,46,0.3)', display: 'flex', gap: 9, alignItems: 'center', marginBottom: 16 }}>
          <AlertCircle size={17} style={{ color: RED }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>{err}</span>
        </div>
      )}

      {/* ── کلیدِ اصلی ── */}
      <section style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 240, flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 900, color: INK, marginBottom: 4 }}>اعمالِ محدودیتِ تعداد آگهی</div>
            <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 1.9 }}>
              تا وقتی خاموش است، هیچ کاربری محدود نمی‌شود و همه آزادانه آگهی می‌گذارند.
              با روشن‌کردنش، هرکس سهمیه‌ی رایگانش تمام شود باید بسته بخرد.
            </p>
          </div>
          <button
            onClick={() => saveSettings({ ads_quota_enabled: !quotaOn }, quotaOn ? 'محدودیت خاموش شد' : 'محدودیت روشن شد')}
            disabled={busy === 'settings'}
            style={{
              ...BTN,
              background: quotaOn ? 'rgba(14,122,56,0.10)' : 'rgba(0,0,0,0.04)',
              borderColor: quotaOn ? 'rgba(14,122,56,0.32)' : LINE,
              color: quotaOn ? FELT : SEC,
            }}>
            <Power size={15} /> {quotaOn ? 'روشن — در حال اعمال' : 'خاموش'}
          </button>
        </div>

        <div style={{ borderTop: `1px dashed ${LINE}`, marginTop: 16, paddingTop: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
          <div>
            <label style={LABEL}>سهمیه‌ی رایگانِ هر کاربر</label>
            <input style={INPUT} inputMode="numeric" value={free.quota}
              onChange={e => setFree(f => ({ ...f, quota: digits(e.target.value) }))} placeholder="۳" />
          </div>
          <div>
            <label style={LABEL}>در هر</label>
            <select value={free.period} onChange={e => setFree(f => ({ ...f, period: e.target.value as Period }))} style={{ width: '100%' }}>
              <option value="day">روز</option><option value="week">هفته</option><option value="month">ماه</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => saveSettings({ ads_free_quota: { quota: Number(free.quota) || 0, period: free.period } }, 'سهمیه‌ی رایگان ذخیره شد')}
              disabled={busy === 'settings'} style={BTN}>
              <Save size={14} /> ذخیره
            </button>
          </div>
        </div>
      </section>

      {/* ── حسابِ واریز ── */}
      <section style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Wallet size={17} style={{ color: GOLD_D }} />
          <h2 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: 0 }}>حسابِ واریزِ فروشِ بسته‌ها</h2>
        </div>
        <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 14px', lineHeight: 1.9 }}>
          پولِ خریدِ بسته‌ها به این حساب می‌نشیند. تا پر نشود، در صورتحسابِ ادمین «تعیین‌نشده» نمایش داده می‌شود.
        </p>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          <div><label style={LABEL}>نامِ صاحبِ حساب</label>
            <input style={INPUT} value={bank.ownerName} onChange={e => setBank(b => ({ ...b, ownerName: e.target.value }))} /></div>
          <div><label style={LABEL}>بانک</label>
            <input style={INPUT} value={bank.bankName} onChange={e => setBank(b => ({ ...b, bankName: e.target.value }))} /></div>
          <div><label style={LABEL}>شماره کارت</label>
            <input style={{ ...INPUT, direction: 'ltr', textAlign: 'right' }} inputMode="numeric" value={bank.cardNumber}
              onChange={e => setBank(b => ({ ...b, cardNumber: digits(e.target.value).slice(0, 16) }))} placeholder="6037••••••••••••" /></div>
          <div><label style={LABEL}>شبا</label>
            <input style={{ ...INPUT, direction: 'ltr', textAlign: 'right' }} value={bank.iban}
              onChange={e => setBank(b => ({ ...b, iban: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 26) }))} placeholder="IR..." /></div>
        </div>
        <button onClick={() => saveSettings({ platform_bank: bank }, 'حسابِ واریز ذخیره شد')}
          disabled={busy === 'settings'} style={{ ...BTN, marginTop: 14 }}>
          <Save size={14} /> ذخیره‌ی حساب
        </button>
      </section>

      {/* ── ساختِ بسته‌ی تازه ── */}
      <section style={{ ...CARD, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: '0 0 14px' }}>ساختِ بسته‌ی تازه</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
          <div><label style={LABEL}>نامِ بسته *</label>
            <input style={INPUT} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="مثال: بسته‌ی برنزی" /></div>
          <div><label style={LABEL}>تعداد آگهی <span style={{ fontWeight: 500, color: MUT }}>(۰ = نامحدود)</span></label>
            <input style={INPUT} inputMode="numeric" value={draft.quota} onChange={e => setDraft(d => ({ ...d, quota: digits(e.target.value) }))} /></div>
          <div><label style={LABEL}>در هر</label>
            <select value={draft.period} onChange={e => setDraft(d => ({ ...d, period: e.target.value as Period }))} style={{ width: '100%' }}>
              <option value="day">روز</option><option value="week">هفته</option><option value="month">ماه</option>
            </select></div>
          <div><label style={LABEL}>مدتِ اعتبار (روز)</label>
            <input style={INPUT} inputMode="numeric" value={draft.durationDays} onChange={e => setDraft(d => ({ ...d, durationDays: digits(e.target.value) }))} /></div>
          <div><label style={LABEL}>قیمت (تومان) *</label>
            <input style={INPUT} inputMode="numeric" value={draft.price ? Number(draft.price).toLocaleString('en-US') : ''}
              onChange={e => setDraft(d => ({ ...d, price: digits(e.target.value) }))} placeholder="۲۰۰٬۰۰۰" /></div>
          <div><label style={LABEL}>برچسب <span style={{ fontWeight: 500, color: MUT }}>(اختیاری)</span></label>
            <input style={INPUT} value={draft.badge} onChange={e => setDraft(d => ({ ...d, badge: e.target.value }))} placeholder="پیشنهاد ما" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={LABEL}>توضیح</label>
            <input style={INPUT} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="مناسبِ فروشگاه‌های کوچک" /></div>
        </div>
        <button onClick={create} disabled={creating} style={{ ...BTN, marginTop: 14 }}>
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} ساختِ بسته
        </button>
      </section>

      {/* ── بسته‌های موجود ── */}
      {plans === null ? (
        <div style={{ ...CARD, display: 'flex', gap: 9, alignItems: 'center', color: MUT }}>
          <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>در حال بارگذاری…</span>
        </div>
      ) : plans.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', color: MUT, fontSize: 13, padding: 30 }}>
          هنوز بسته‌ای نساخته‌اید. اولین بسته را از فرمِ بالا بسازید.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {plans.map(p => (
            <PlanRow key={p.id} p={p} busy={busy === p.id} onPatch={patch} />
          ))}
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 26, insetInline: 0, margin: '0 auto', width: 'fit-content', zIndex: 60,
          background: INK, color: '#fff', fontSize: 13, fontWeight: 800, padding: '10px 20px', borderRadius: 22,
        }}>{toast}</div>
      )}
    </div>
  )
}

function PlanRow({ p, busy, onPatch }: {
  p: Plan; busy: boolean; onPatch: (id: string, body: Record<string, unknown>) => Promise<void>
}) {
  const [price, setPrice] = useState(String(p.price))
  const [quota, setQuota] = useState(String(p.quota))
  useEffect(() => { setPrice(String(p.price)); setQuota(String(p.quota)) }, [p.price, p.quota])

  const changed = Number(price) !== p.price || Number(quota) !== p.quota

  return (
    <div style={{
      ...CARD, opacity: p.isActive ? 1 : 0.62,
      borderColor: p.isActive ? LINE : 'rgba(0,0,0,0.07)',
      display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center',
    }}>
      <div style={{ minWidth: 180, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: INK }}>{p.name}</span>
          {p.badge && (
            <span style={{ fontSize: 10.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.13)', borderRadius: 20, padding: '3px 9px' }}>{p.badge}</span>
          )}
          {!p.isActive && (
            <span style={{ fontSize: 10.5, fontWeight: 800, color: MUT, background: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '3px 9px' }}>غیرفعال</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: MUT, marginTop: 5, lineHeight: 1.9 }}>
          {p.quota === 0 ? 'آگهیِ نامحدود' : `${fa(p.quota)} آگهی در هر ${PERIOD_FA[p.period]}`}
          {' · '}اعتبار {fa(p.durationDays)} روز
          {p.description ? ` · ${p.description}` : ''}
        </div>
      </div>

      <div style={{ width: 118 }}>
        <label style={LABEL}>تعداد</label>
        <input style={INPUT} inputMode="numeric" value={quota}
          onChange={e => setQuota(digits(e.target.value))} />
      </div>
      <div style={{ width: 148 }}>
        <label style={LABEL}>قیمت (تومان)</label>
        <input style={INPUT} inputMode="numeric" value={price ? Number(price).toLocaleString('en-US') : ''}
          onChange={e => setPrice(digits(e.target.value))} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 1 }}>
        <button
          onClick={() => onPatch(p.id, { price: Number(price) || 0, quota: Number(quota) || 0 })}
          disabled={busy || !changed}
          style={{ ...BTN, opacity: changed ? 1 : 0.45, cursor: changed ? 'pointer' : 'default' }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} ذخیره
        </button>
        <button
          onClick={() => onPatch(p.id, { isActive: !p.isActive })}
          disabled={busy}
          style={{
            ...BTN,
            background: p.isActive ? 'rgba(0,0,0,0.04)' : 'rgba(14,122,56,0.10)',
            borderColor: p.isActive ? LINE : 'rgba(14,122,56,0.32)',
            color: p.isActive ? SEC : FELT,
          }}>
          {p.isActive ? <><Power size={14} /> غیرفعال کن</> : <><CheckCircle2 size={14} /> فعال کن</>}
        </button>
      </div>
    </div>
  )
}
