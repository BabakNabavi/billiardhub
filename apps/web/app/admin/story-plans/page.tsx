'use client'

/* بسته‌های استوری — آینه‌ی دقیق بسته‌های استوری، روی جدول‌های story_*.

   شما بسته می‌سازید (تعداد استوری، بازه، مدت اعتبار،
   قیمت)، و همان‌ها در صفحه‌ی /story-plans به کاربر نشان داده می‌شوند.

   سهمیه‌ی رایگان به‌ازای هر نقش جداست: فروشگاه‌دار طبیعتاً بیشتر از
   کاربر عادی استوری می‌گذارد. کاربری که چند نقش دارد، سخاوتمندانه‌ترین
   سهمیه را می‌گیرد.

   نکته‌ی متفاوت با آگهی: سقف استوری از اول وجود داشته، پس کلید زیر
   فقط تعیین می‌کند «خرید بسته معنا دارد یا نه»؛ سهمیه‌ی رایگان نقش
   همیشه اعمال می‌شود. */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Plus, Save, Power, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Users } from 'lucide-react'
import { apiFetch } from '../../../lib/http'
import { toFaDigits } from '../../../lib/jalali'
import Select from '../../../components/ui/Select'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const CARD: React.CSSProperties = {
  background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18,
  padding: 'clamp(18px,2.4vw,26px)', marginBottom: 18,
}
const INPUT: React.CSSProperties = {
  width: '100%', border: `1px solid ${LINE}`, borderRadius: 11, padding: '10px 13px',
  fontSize: 13.5, fontFamily: 'inherit', color: INK, background: '#FAFAF7', outline: 'none',
}
const LABEL: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 800, color: SEC, marginBottom: 7 }
const BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 10, cursor: 'pointer',
  border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)', color: GOLD_D,
  fontSize: 13, fontWeight: 800, fontFamily: 'inherit', padding: '10px 16px', transition: 'transform .2s',
}

type Period = 'day' | 'week' | 'month'
const PERIOD_FA: Record<Period, string> = { day: 'روز', week: 'هفته', month: 'ماه' }
const PERIOD_OPTS = (['day', 'week', 'month'] as Period[]).map(p => ({ value: p, label: PERIOD_FA[p] }))

/* همان نقش‌های lib/roles — سهمیه‌ی هرکدام جداست */
const ROLES: { key: string; fa: string }[] = [
  { key: 'user', fa: 'کاربر عادی' },
  { key: 'player', fa: 'بازیکن' },
  { key: 'coach', fa: 'مربی' },
  { key: 'referee', fa: 'داور' },
  { key: 'technician', fa: 'خدمات فنی' },
  { key: 'seller', fa: 'فروشنده' },
  { key: 'manufacturer', fa: 'تولیدکننده' },
  { key: 'club_owner', fa: 'باشگاه‌دار' },
]

interface Plan {
  id: string; name: string; description: string | null
  quota: number; period: Period; durationDays: number
  price: number; isActive: boolean; sortOrder: number; badge: string | null
}
interface RoleQuota { quota: string; period: Period }

const emptyDraft = () => ({
  name: '', description: '', quota: '3', period: 'week' as Period,
  durationDays: '30', price: '', badge: '', sortOrder: '0',
})

/* هر عددی که روی این صفحه دیده می‌شود فارسی است */
const fa = (n: number | string) => toFaDigits(typeof n === 'number' ? n.toLocaleString('en-US') : n)
const money = (v: string) => (v ? toFaDigits(Number(v).toLocaleString('en-US')) : '')
const digits = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '')

export default function AdminStoryPlans() {
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const [draft, setDraft] = useState(emptyDraft())
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState('')

  const [quotaOn, setQuotaOn] = useState(false)
  const [roleQuota, setRoleQuota] = useState<Record<string, RoleQuota>>({})

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2600) }

  const load = useCallback(async () => {
    try {
      const [pr, sr] = await Promise.all([
        apiFetch('/api/admin/story-plans', { cache: 'no-store' }),
        apiFetch('/api/admin/settings', { cache: 'no-store' }),
      ])
      const pj = await pr.json().catch(() => ({}))
      if (!pr.ok) { setErr(pj?.message || 'دسترسی مجاز نیست'); setPlans([]); return }
      setPlans(pj.plans ?? []); setErr('')

      const sj = await sr.json().catch(() => ({}))
      const s = sj?.settings ?? {}
      setQuotaOn(!!s.stories_quota_enabled)

      /* شکل ذخیره‌شده ممکن است قدیمی باشد ({quota,period} برای همه) */
      const raw = s.stories_free_quota ?? {}
      const legacy = typeof raw.quota === 'number' ? { quota: raw.quota, period: raw.period ?? 'week' } : null
      const def = raw.default ?? legacy ?? { quota: 2, period: 'day' }
      const next: Record<string, RoleQuota> = {}
      for (const r of ROLES) {
        const v = raw.roles?.[r.key] ?? legacy ?? def
        next[r.key] = { quota: String(v.quota ?? 0), period: (v.period ?? 'day') as Period }
      }
      setRoleQuota(next)

    } catch { setErr('خطا در ارتباط با سرور'); setPlans([]) }
  }, [])
  useEffect(() => { void load() }, [load])

  const create = async () => {
    if (!draft.name.trim()) { flash('نام بسته لازم است'); return }
    if (!draft.price.trim()) { flash('قیمت بسته لازم است'); return }
    setCreating(true)
    try {
      const r = await apiFetch('/api/admin/story-plans', {
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
      if (!r.ok) { flash(j?.message || 'ساخت بسته انجام نشد'); return }
      setDraft(emptyDraft()); await load(); flash('بسته ساخته شد')
    } finally { setCreating(false) }
  }

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(id)
    try {
      const r = await apiFetch('/api/admin/story-plans', {
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

  const saveRoleQuota = () => {
    const roles: Record<string, { quota: number; period: Period }> = {}
    for (const r of ROLES) {
      const v = roleQuota[r.key]
      if (v) roles[r.key] = { quota: Number(v.quota) || 0, period: v.period }
    }
    void saveSettings(
      { stories_free_quota: { default: roles.user ?? { quota: 0, period: 'day' }, roles } },
      'سهمیه‌ی نقش‌ها ذخیره شد',
    )
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)', padding: 'clamp(14px,2.5vw,28px)', maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <Package size={21} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>بسته‌های استوری</h1>
        <Link href="/story-plans" style={{ ...BTN, marginInlineStart: 'auto', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> دیدن صفحه‌ی کاربران
        </Link>
      </div>
      <p style={{ fontSize: 13, color: MUT, margin: '0 0 20px', lineHeight: 1.95 }}>
        هر بسته را خودتان می‌سازید: چند استوری، در چه بازه‌ای، چند روز اعتبار و چه قیمتی.
        قیمت و تعداد را هر وقت بخواهید عوض کنید — سفارش‌های قبلی دست‌نخورده می‌مانند.
      </p>

      {err && (
        <div style={{ ...CARD, borderColor: 'rgba(178,59,46,0.3)', display: 'flex', gap: 9, alignItems: 'center' }}>
          <AlertCircle size={17} style={{ color: RED }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>{err}</span>
        </div>
      )}

      {/* ── کلید اصلی + سهمیه‌ی هر نقش ── */}
      <section style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 250, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 5 }}>فروش بسته‌ی استوری</div>
            <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 1.95 }}>
              سهمیه‌ی رایگان هر نقش همیشه اعمال می‌شود. این کلید تعیین می‌کند که وقتی
              سهمیه تمام شد، به کاربر پیشنهاد خرید بسته داده شود یا فقط پیام «سقف پر شد».
            </p>
          </div>
          <button
            onClick={() => saveSettings({ stories_quota_enabled: !quotaOn }, quotaOn ? 'فروش بسته خاموش شد' : 'فروش بسته روشن شد')}
            disabled={busy === 'settings'}
            style={{
              ...BTN,
              background: quotaOn ? 'rgba(14,122,56,0.10)' : 'rgba(0,0,0,0.04)',
              borderColor: quotaOn ? 'rgba(14,122,56,0.32)' : LINE,
              color: quotaOn ? FELT : SEC,
            }}>
            <Power size={15} /> {quotaOn ? 'روشن — بسته‌ها قابل فروش‌اند' : 'خاموش'}
          </button>
        </div>

        <div style={{ borderTop: `1px dashed ${LINE}`, marginTop: 20, paddingTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <Users size={16} style={{ color: GOLD_D }} />
            <h2 style={{ fontSize: 14, fontWeight: 900, color: INK, margin: 0 }}>سهمیه‌ی رایگان، به تفکیک نقش</h2>
          </div>
          <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 16px', lineHeight: 1.95 }}>
            عدد صفر یعنی آن نقش اصلاً حق استوری ندارد. کاربری که چند نقش دارد، سخاوتمندانه‌ترین سهمیه را می‌گیرد —
            گرفتن نقش تازه نباید کسی را محدودتر کند.
          </p>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(258px,1fr))' }}>
            {ROLES.map(r => {
              const v = roleQuota[r.key] ?? { quota: '0', period: 'week' as Period }
              return (
                <div key={r.key} style={{
                  border: `1px solid ${LINE}`, borderRadius: 13, padding: '13px 14px', background: '#FAFAF7',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: INK, marginBottom: 10 }}>{r.fa}</div>
                  <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end' }}>
                    <div style={{ width: 92 }}>
                      <label style={LABEL}>تعداد</label>
                      <input style={{ ...INPUT, background: '#fff', textAlign: 'center' }} inputMode="numeric"
                        value={fa(v.quota)}
                        onChange={e => setRoleQuota(q => ({ ...q, [r.key]: { ...v, quota: digits(e.target.value) } }))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={LABEL}>در هر</label>
                      <Select<Period>
                        value={v.period} options={PERIOD_OPTS} ariaLabel={`بازه‌ی ${r.fa}`}
                        onChange={p => setRoleQuota(q => ({ ...q, [r.key]: { ...v, period: p } }))} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, color: MUT, marginTop: 9, lineHeight: 1.8 }}>
                    {Number(v.quota) === 0
                      ? 'استوری نامحدود'
                      : `${fa(Number(v.quota))} استوری در هر ${PERIOD_FA[v.period]}`}
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={saveRoleQuota} disabled={busy === 'settings'} style={{ ...BTN, marginTop: 16 }}>
            {busy === 'settings' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} ذخیره‌ی سهمیه‌ی نقش‌ها
          </button>
        </div>
      </section>

      {/* ── ساخت بسته‌ی تازه ── */}
      <section style={CARD}>
        <h2 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: '0 0 16px' }}>ساخت بسته‌ی تازه</h2>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
          <div><label style={LABEL}>نام بسته *</label>
            <input style={INPUT} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="مثال: بسته‌ی نقره‌ای" /></div>
          <div><label style={LABEL}>تعداد استوری <span style={{ fontWeight: 500, color: MUT }}>(۰ = نامحدود)</span></label>
            <input style={INPUT} inputMode="numeric" value={fa(draft.quota)} onChange={e => setDraft(d => ({ ...d, quota: digits(e.target.value) }))} /></div>
          <div><label style={LABEL}>در هر</label>
            <Select<Period> value={draft.period} options={PERIOD_OPTS} ariaLabel="بازه"
              onChange={p => setDraft(d => ({ ...d, period: p }))} /></div>
          <div><label style={LABEL}>مدت اعتبار (روز)</label>
            <input style={INPUT} inputMode="numeric" value={fa(draft.durationDays)} onChange={e => setDraft(d => ({ ...d, durationDays: digits(e.target.value) }))} /></div>
          <div><label style={LABEL}>قیمت (تومان) *</label>
            <input style={INPUT} inputMode="numeric" value={money(draft.price)}
              onChange={e => setDraft(d => ({ ...d, price: digits(e.target.value) }))} placeholder="۲۰۰٬۰۰۰" /></div>
          <div><label style={LABEL}>برچسب <span style={{ fontWeight: 500, color: MUT }}>(اختیاری)</span></label>
            <input style={INPUT} value={draft.badge} onChange={e => setDraft(d => ({ ...d, badge: e.target.value }))} placeholder="پیشنهاد ما" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={LABEL}>توضیح</label>
            <input style={INPUT} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="مناسب باشگاه‌های فعال" /></div>
        </div>
        <button onClick={create} disabled={creating} style={{ ...BTN, marginTop: 16 }}>
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} ساخت بسته
        </button>
      </section>

      {/* ── بسته‌های موجود ── */}
      {plans === null ? (
        <div style={{ ...CARD, display: 'flex', gap: 9, alignItems: 'center', color: MUT }}>
          <Loader2 size={16} className="animate-spin" /><span style={{ fontSize: 13 }}>در حال بارگذاری…</span>
        </div>
      ) : plans.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', color: MUT, fontSize: 13, padding: 34 }}>
          هنوز بسته‌ای نساخته‌اید. اولین بسته را از فرم بالا بسازید.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
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
      background: '#fff', border: `1px solid ${p.isActive ? LINE : 'rgba(0,0,0,0.07)'}`,
      borderRadius: 16, padding: 18, opacity: p.isActive ? 1 : 0.62,
      display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end',
    }}>
      <div style={{ minWidth: 190, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: INK }}>{p.name}</span>
          {p.badge && (
            <span style={{ fontSize: 10.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.13)', borderRadius: 20, padding: '3px 9px' }}>{p.badge}</span>
          )}
          {!p.isActive && (
            <span style={{ fontSize: 10.5, fontWeight: 800, color: MUT, background: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '3px 9px' }}>غیرفعال</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: MUT, marginTop: 6, lineHeight: 1.95 }}>
          {p.quota === 0 ? 'استوری نامحدود' : `${fa(p.quota)} استوری در هر ${PERIOD_FA[p.period]}`}
          {' · '}اعتبار {fa(p.durationDays)} روز
          {p.description ? ` · ${p.description}` : ''}
        </div>
      </div>

      <div style={{ width: 112 }}>
        <label style={LABEL}>تعداد</label>
        <input style={{ ...INPUT, textAlign: 'center' }} inputMode="numeric" value={fa(quota)}
          onChange={e => setQuota(digits(e.target.value))} />
      </div>
      <div style={{ width: 156 }}>
        <label style={LABEL}>قیمت (تومان)</label>
        <input style={INPUT} inputMode="numeric" value={money(price)}
          onChange={e => setPrice(digits(e.target.value))} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
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
