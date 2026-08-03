'use client'

/* پنجره‌ی مشخصاتِ کاملِ یک کاربر — دکمه‌ی چشمِ فهرستِ کاربران.

   پیش‌تر آن دکمه به پروفایلِ عمومی می‌رفت و آن‌جا جز نام چیزی نبود،
   یعنی ادمین هیچ راهی برای دیدنِ مشخصاتِ یک نفر نداشت.

   داده از `/api/admin/users?id=…` می‌آید و همان‌جا محدود شده: رمز و
   کدهای یک‌بارمصرف هرگز فرستاده نمی‌شوند. هر بار بازکردنِ این پنجره
   در گزارشِ ممیزی ثبت می‌شود — دیدنِ اطلاعاتِ هویتیِ یک نفر خودش یک
   رویداد است، نه یک نگاهِ بی‌رد. */

import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/http'
import { faDate } from '../../lib/jalali'
import { X, Loader2, BadgeCheck, ShieldAlert, Copy, Check, Pencil } from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

type Row = Record<string, unknown>

const ROLE_FA: Record<string, string> = {
  admin: 'ادمین', club_owner: 'مالک باشگاه', player: 'بازیکن', coach: 'مربی',
  referee: 'داور', seller: 'فروشنده', manufacturer: 'تولیدکننده',
  technician: 'متخصص فنی', installer: 'متخصص نصب', user: 'کاربر عادی',
}
const STATUS_FA: Record<string, string> = {
  verified: 'تأییدشده', pending: 'در انتظار', rejected: 'ردشده', unverified: 'تأییدنشده',
}
const GENDER_FA: Record<string, string> = { male: 'مرد', female: 'زن' }

const fa = (s: unknown) => String(s ?? '').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!)
const date = (v: unknown) => {
  if (!v) return null
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fa-IR') + ' · ' + d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
}

/* تاریخِ تولد همیشه شمسی و با رقمِ فارسی نشان داده می‌شود.

   ستونِ `birth_date` متنی است و ثبت‌نام همان چیزی را می‌نویسد که کاربر
   در تقویمِ شمسی انتخاب کرده — «1363/06/02». پس در حالتِ عادی فقط
   رقم‌ها باید فارسی شوند و بس؛ تبدیلِ تقویم لازم نیست و اگر انجام شود
   ۱۳۶۳ را سالِ میلادی می‌گیرد و تاریخِ بی‌معنی می‌سازد.

   ولی چند ردیف میلادی («1984-08-24») در همین ستون نشسته‌اند، از
   واردکردنِ دستی. آن‌ها تبدیل می‌شوند تا ادمین همه‌جا یک قالب ببیند.

   تشخیص از روی جداکننده و سال است، نه حدس: شمسی با «/» و سالِ ۱۳/۱۴،
   میلادی با «-» و سالِ ۱۹/۲۰. */
const birthFa = (v: unknown) => {
  const s = String(v ?? '').trim()
  if (!s) return null
  if (/^1[234]\d{2}[/-]\d{1,2}[/-]\d{1,2}$/.test(s)) return fa(s.replace(/-/g, '/'))
  if (/^(19|20)\d{2}-\d{1,2}-\d{1,2}/.test(s)) return faDate(s.slice(0, 10))
  return fa(s)
}

/* یک خانه‌ی «برچسب / مقدار». مقدارِ تهی اصلاً رندر نمی‌شود تا پنجره
   پر از خطِ «—» نشود. */
function Field({ label, value, mono, copy }: { label: string; value: unknown; mono?: boolean; copy?: boolean }) {
  const [done, setDone] = useState(false)
  const s = value === null || value === undefined || value === '' ? null : String(value)
  if (!s) return null
  return (
    <div style={{ padding: '8px 0', borderBottom: `1px solid ${LINE}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 11.5, color: MUT, fontWeight: 700, width: 108, flexShrink: 0, lineHeight: 1.9 }}>{label}</span>
      <span className={mono ? 'bh-latin' : undefined}
        style={{ fontSize: 12.5, color: INK, fontWeight: 600, lineHeight: 1.9, minWidth: 0, flex: 1, wordBreak: 'break-word' }}>
        {s}
      </span>
      {copy && (
        <button onClick={() => { void navigator.clipboard.writeText(s); setDone(true); setTimeout(() => setDone(false), 1400) }}
          title="کپی" style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: 7, cursor: 'pointer',
            border: `1px solid ${LINE}`, background: '#FAFAF7', color: done ? FELT : MUT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{done ? <Check size={12} /> : <Copy size={12} />}</button>
      )}
    </div>
  )
}

/* ── فرمِ ویرایش ──
   همان فیلدهایی که سرور هم می‌پذیرد. اگر این‌جا و آن‌جا از هم جدا
   بیفتند، کاربر فیلدی را پر می‌کند که خاموش دور ریخته می‌شود. */
const EDIT_FIELDS: { key: string; label: string; ltr?: boolean; hint?: string; area?: boolean }[] = [
  { key: 'firstName', label: 'نام' },
  { key: 'lastName', label: 'نام خانوادگی' },
  { key: 'national_id', label: 'کد ملی', ltr: true, hint: 'ده رقم — تغییرش تأیید شاهکار را باطل می‌کند' },
  { key: 'birth_date', label: 'تاریخ تولد', ltr: true, hint: 'شمسی، مثل ۱۳۶۳/۰۶/۰۲' },
  { key: 'email', label: 'ایمیل', ltr: true },
  { key: 'work_phone', label: 'تلفن کاری', ltr: true },
  { key: 'province', label: 'استان' },
  { key: 'city', label: 'شهر' },
  { key: 'address', label: 'نشانی' },
  { key: 'instagram', label: 'اینستاگرام', ltr: true },
  { key: 'telegram', label: 'تلگرام', ltr: true },
  { key: 'club_name_manual', label: 'باشگاه' },
  { key: 'bio', label: 'درباره', area: true },
]

function EditRow({ f, value, onChange }: {
  f: (typeof EDIT_FIELDS)[number]; value: string; onChange: (v: string) => void
}) {
  const box: React.CSSProperties = {
    width: '100%', border: `1px solid ${LINE}`, borderRadius: 9, padding: '7px 10px',
    fontSize: 12.5, color: INK, fontWeight: 600, fontFamily: 'inherit', background: '#FEFEFC',
    direction: f.ltr ? 'ltr' : 'rtl', textAlign: f.ltr ? 'left' : 'right',
  }
  return (
    <div style={{ padding: '7px 0', borderBottom: `1px solid ${LINE}` }}>
      <label style={{ fontSize: 11.5, color: MUT, fontWeight: 700, display: 'block', marginBottom: 4 }}>{f.label}</label>
      {f.area
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ ...box, resize: 'vertical' }} />
        : <input value={value} onChange={e => onChange(e.target.value)} style={box} />}
      {f.hint && <div style={{ fontSize: 10.5, color: MUT, marginTop: 3 }}>{f.hint}</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  /* بخشی که همه‌ی خانه‌هایش تهی بوده‌اند عنوانِ بی‌محتوا می‌شد */
  const any = Array.isArray(children) ? children.some(Boolean) : Boolean(children)
  if (!any) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: GOLD_D, marginBottom: 2 }}>{title}</div>
      {children}
    </div>
  )
}

export default function UserDetailDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [u, setU] = useState<Row | null>(null)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  useEffect(() => {
    void (async () => {
      try {
        const r = await apiFetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        if (!r.ok) { setErr(j?.message ?? 'خواندن اطلاعات انجام نشد'); return }
        setU(j.user ?? null)
      } catch { setErr('خطا در ارتباط با سرور') }
    })()
  }, [userId])

  const g = (k: string) => u?.[k]
  const name = `${g('firstName') ?? ''} ${g('lastName') ?? ''}`.trim() || 'بدون نام'

  /* ورود به ویرایش: فرم از مقدارهای فعلی پر می‌شود، وگرنه ذخیره‌کردنِ
     یک فیلدِ دست‌نخورده آن را خالی می‌کند. */
  const startEdit = () => {
    if (!u) return
    const f: Record<string, string> = {}
    for (const x of EDIT_FIELDS) f[x.key] = String(u[x.key] ?? '')
    setForm(f); setSaveErr(''); setEditing(true)
  }

  const save = async () => {
    if (saving) return
    setSaving(true); setSaveErr('')
    try {
      /* فقط تغییرها فرستاده می‌شوند — نه کلِ فرم. این‌طور یک فیلدِ
         دست‌نخورده هیچ‌وقت به‌طور تصادفی بازنویسی نمی‌شود. */
      const fields: Record<string, string> = {}
      for (const x of EDIT_FIELDS) {
        const now = form[x.key] ?? ''
        const was = String(u?.[x.key] ?? '')
        if (now.trim() !== was.trim()) fields[x.key] = now.trim()
      }
      if (!Object.keys(fields).length) { setEditing(false); setSaving(false); return }

      const r = await apiFetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, fields }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setSaveErr(j?.message ?? 'ذخیره انجام نشد'); return }
      if (j.user) setU(j.user as Row)
      setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2200)
    } catch { setSaveErr('خطا در ارتباط با سرور') } finally { setSaving(false) }
  }

  const roles = [String(g('primaryRole') ?? ''), ...((g('secondaryRoles') as string[]) ?? [])]
    .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)
  const status = String(g('verificationStatus') ?? '')

  /* پروفایل‌های نقشی — هرکدام یک شیء JSON است. فقط آن‌هایی که
     واقعاً محتوا دارند نشان داده می‌شوند. */
  const roleProfiles = ([
    ['playerProfile', 'پروفایل بازیکن'], ['coachProfile', 'پروفایل مربی'],
    ['refereeProfile', 'پروفایل داور'], ['sellerProfile', 'پروفایل فروشنده'],
    ['manufacturerProfile', 'پروفایل تولیدکننده'], ['installerProfile', 'پروفایل متخصص'],
  ] as const).map(([k, label]) => {
    const v = g(k)
    if (!v || typeof v !== 'object' || !Object.keys(v as object).length) return null
    return { label, entries: Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== null && x !== '' && x !== undefined) }
  }).filter(Boolean) as { label: string; entries: [string, unknown][] }[]

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(20,18,14,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} dir="rtl" style={{
        background: '#fff', borderRadius: 18, width: 'min(600px,100%)', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-base)',
        boxShadow: '0 24px 70px rgba(28,27,23,0.22)',
      }}>
        {/* سربرگ */}
        <div style={{ padding: '15px 18px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#241B08',
            background: 'linear-gradient(135deg,#C7A66A,#8A6020)',
          }}>
            {g('avatar')
              ? <img src={String(g('avatar'))} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : name.slice(0, 1)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: INK }}>{name}</span>
              {status === 'verified'
                ? <BadgeCheck size={15} style={{ color: FELT }} />
                : status === 'rejected' ? <ShieldAlert size={15} style={{ color: RED }} /> : null}
            </div>
            <div style={{ fontSize: 11.5, color: MUT, marginTop: 2 }}>
              {roles.map(r => ROLE_FA[r] ?? r).join(' · ') || '—'}
            </div>
          </div>
          {u && !editing && (
            <button onClick={startEdit} title="ویرایش مشخصات" style={{
              background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
              borderRadius: 10, height: 32, padding: '0 11px', display: 'flex', alignItems: 'center',
              gap: 5, cursor: 'pointer', color: GOLD_D, fontSize: 12, fontWeight: 800,
              fontFamily: 'inherit', flexShrink: 0,
            }}><Pencil size={13} /> ویرایش</button>
          )}
          {saved && <span style={{ fontSize: 11.5, fontWeight: 800, color: FELT, flexShrink: 0 }}>ذخیره شد</span>}
          <button onClick={onClose} aria-label="بستن" style={{
            background: 'rgba(28,28,26,0.05)', border: `1px solid ${LINE}`, borderRadius: 10,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: SEC, flexShrink: 0,
          }}><X size={16} /></button>
        </div>

        {/* بدنه */}
        <div style={{ overflowY: 'auto', padding: '12px 18px 16px' }}>
          {err && <div style={{ padding: '12px 0', color: RED, fontSize: 12.5, fontWeight: 700 }}>{err}</div>}
          {!u && !err && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: SEC, fontSize: 13, padding: 20 }}>
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> در حال بارگذاری…
            </div>
          )}

          {u && editing && (
            <>
              <div style={{ fontSize: 11.5, color: SEC, lineHeight: 1.9, padding: '4px 0 8px' }}>
                شماره‌ی موبایل، نقش‌ها و وضعیتِ احراز از این‌جا عوض نمی‌شوند.
                هر تغییری در گزارشِ ممیزی ثبت می‌شود.
              </div>
              {EDIT_FIELDS.map(f => (
                <EditRow key={f.key} f={f} value={form[f.key] ?? ''}
                  onChange={v => setForm(s => ({ ...s, [f.key]: v }))} />
              ))}
              {saveErr && <div style={{ color: RED, fontSize: 12, fontWeight: 700, padding: '10px 0' }}>{saveErr}</div>}
              <div style={{ display: 'flex', gap: 8, paddingTop: 14 }}>
                <button onClick={() => void save()} disabled={saving} style={{
                  flex: 1, height: 38, borderRadius: 10, cursor: saving ? 'default' : 'pointer',
                  background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
                  color: GOLD_D, fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: saving ? 0.6 : 1,
                }}>
                  {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {saving ? 'در حال ذخیره…' : 'ذخیره‌ی تغییرات'}
                </button>
                <button onClick={() => { setEditing(false); setSaveErr('') }} style={{
                  height: 38, padding: '0 16px', borderRadius: 10, cursor: 'pointer',
                  background: '#FAFAF7', border: `1px solid ${LINE}`, color: SEC,
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                }}>انصراف</button>
              </div>
            </>
          )}

          {u && !editing && (
            <>
              <Section title="تماس">
                <Field label="موبایل" value={fa(g('phone'))} mono copy />
                <Field label="تلفن کاری" value={g('work_phone') ? fa(g('work_phone')) : null} mono copy />
                <Field label="ایمیل" value={g('email')} mono copy />
                <Field label="اینستاگرام" value={g('instagram')} mono />
                <Field label="تلگرام" value={g('telegram')} mono />
              </Section>

              <Section title="هویت">
                <Field label="کد ملی" value={g('national_id') ? fa(g('national_id')) : null} mono copy />
                <Field label="تأیید کد ملی" value={g('national_id') ? (g('national_id_verified') ? 'تأییدشده' : 'تأییدنشده') : null} />
                <Field label="تأیید موبایل" value={g('phone_verified') ? 'تأییدشده' : 'تأییدنشده'} />
                <Field label="تأیید ایمیل" value={g('email') ? (g('email_verified') ? 'تأییدشده' : 'تأییدنشده') : null} />
                <Field label="وضعیت احراز" value={STATUS_FA[status] ?? status} />
                <Field label="جنسیت" value={GENDER_FA[String(g('gender') ?? '')] ?? g('gender')} />
                <Field label="تاریخ تولد" value={birthFa(g('birth_date'))} />
              </Section>

              <Section title="نشانی">
                <Field label="استان" value={g('province')} />
                <Field label="شهر" value={g('city')} />
                <Field label="نشانی" value={g('address')} />
              </Section>

              <Section title="اطلاعات بانکی">
                <Field label="شماره کارت" value={g('bank_card') ? fa(g('bank_card')) : null} mono copy />
                <Field label="به نام" value={g('bank_card_owner')} />
                <Field label="شبا" value={g('bank_iban') ? fa(g('bank_iban')) : null} mono copy />
                <Field label="تأیید کارت" value={g('bank_card') ? (g('bank_card_verified') ? 'تأییدشده' : 'تأییدنشده') : null} />
              </Section>

              <Section title="حساب">
                <Field label="شناسه" value={g('id')} mono copy />
                <Field label="وضعیت" value={g('isActive') === false ? 'غیرفعال' : 'فعال'} />
                <Field label="پروفایل کامل" value={g('isProfileComplete') ? 'بله' : 'خیر'} />
                <Field label="باشگاه" value={g('club_name_manual')} />
                <Field label="عضویت" value={date(g('createdAt'))} />
                <Field label="آخرین تغییر" value={date(g('updatedAt'))} />
              </Section>

              {g('bio') ? (
                <Section title="درباره">
                  <div style={{ fontSize: 12.5, color: SEC, lineHeight: 2, padding: '8px 0' }}>{String(g('bio'))}</div>
                </Section>
              ) : null}

              {roleProfiles.map(p => (
                <Section key={p.label} title={p.label}>
                  {p.entries.map(([k, v]) => (
                    <Field key={k} label={k} value={typeof v === 'object' ? JSON.stringify(v) : String(v)} />
                  ))}
                </Section>
              ))}

              {Array.isArray(g('documents')) && (g('documents') as unknown[]).length > 0 && (
                <Section title="مدارک">
                  {(g('documents') as unknown[]).map((d, i) => {
                    const url = typeof d === 'string' ? d : (d as Record<string, unknown>)?.url
                    if (!url) return null
                    return (
                      <div key={i} style={{ padding: '7px 0', borderBottom: `1px solid ${LINE}` }}>
                        <a href={String(url)} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12.5, fontWeight: 700, color: GOLD_D, textDecoration: 'none' }}>
                          مدرک {fa(i + 1)} — باز کردن
                        </a>
                      </div>
                    )
                  })}
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
