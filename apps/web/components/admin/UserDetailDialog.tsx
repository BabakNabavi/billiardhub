'use client'

/* پنجره‌ی مشخصات کامل یک کاربر — دکمه‌ی چشم فهرست کاربران.

   پیش‌تر آن دکمه به پروفایل عمومی می‌رفت و آن‌جا جز نام چیزی نبود،
   یعنی ادمین هیچ راهی برای دیدن مشخصات یک نفر نداشت.

   داده از `/api/admin/users?id=…` می‌آید و همان‌جا محدود شده: رمز و
   کدهای یک‌بارمصرف هرگز فرستاده نمی‌شوند. هر بار بازکردن این پنجره
   در گزارش ممیزی ثبت می‌شود — دیدن اطلاعات هویتی یک نفر خودش یک
   رویداد است، نه یک نگاه بی‌رد. */

import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/http'
import { faDate } from '../../lib/jalali'
import { X, Loader2, BadgeCheck, ShieldAlert, Copy, Check, Pencil } from 'lucide-react'
import { UserRolesSection } from './UserRolesSection'
import { Button } from '../ui/Button'


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

/* تاریخ تولد همیشه شمسی و با رقم فارسی نشان داده می‌شود.

   ستون `birth_date` متنی است و ثبت‌نام همان چیزی را می‌نویسد که کاربر
   در تقویم شمسی انتخاب کرده — «1363/06/02». پس در حالت عادی فقط
   رقم‌ها باید فارسی شوند و بس؛ تبدیل تقویم لازم نیست و اگر انجام شود
   ۱۳۶۳ را سال میلادی می‌گیرد و تاریخ بی‌معنی می‌سازد.

   ولی چند ردیف میلادی («1984-08-24») در همین ستون نشسته‌اند، از
   واردکردن دستی. آن‌ها تبدیل می‌شوند تا ادمین همه‌جا یک قالب ببیند.

   تشخیص از روی جداکننده و سال است، نه حدس: شمسی با «/» و سال ۱۳/۱۴،
   میلادی با «-» و سال ۱۹/۲۰. */
const birthFa = (v: unknown) => {
  const s = String(v ?? '').trim()
  if (!s) return null
  if (/^1[234]\d{2}[/-]\d{1,2}[/-]\d{1,2}$/.test(s)) return fa(s.replace(/-/g, '/'))
  if (/^(19|20)\d{2}-\d{1,2}-\d{1,2}/.test(s)) return faDate(s.slice(0, 10))
  return fa(s)
}

/* یک خانه‌ی «برچسب / مقدار». مقدار تهی اصلا رندر نمی‌شود تا پنجره
   پر از خط «—» نشود. */
function Field({ label, value, mono, copy }: { label: string; value: unknown; mono?: boolean; copy?: boolean }) {
  const [done, setDone] = useState(false)
  const s = value === null || value === undefined || value === '' ? null : String(value)
  if (!s) return null
  return (
    <div className="flex items-start gap-3 border-b border-line/10 py-2">
      <span className="w-24 shrink-0 text-xs font-semibold leading-loose text-ink-2">{label}</span>
      <span className={`adm-break min-w-0 flex-1 text-sm font-medium leading-loose text-ink ${mono ? 'bh-latin' : ''}`}>
        {s}
      </span>
      {copy && (
        <button type="button" title="کپی" aria-label={`کپی ${label}`}
          onClick={() => { void navigator.clipboard.writeText(s); setDone(true); setTimeout(() => setDone(false), 1400) }}
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-field border border-line/10 bg-paper hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep ${done ? 'text-success' : 'text-ink-2'}`}>
          {done ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        </button>
      )}
    </div>
  )
}

/* ── فرم ویرایش ──
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
  const id = `edit-${f.key}`
  const box = `w-full rounded-field border border-line/20 bg-surface px-3 py-2 text-sm font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep ${f.ltr ? 'text-start' : ''}`
  return (
    <div className="adm-field border-b border-line/10 py-2">
      <label htmlFor={id}>{f.label}</label>
      {f.area
        ? <textarea id={id} value={value} onChange={e => onChange(e.target.value)} rows={3} className={`${box} resize-y`} />
        : <input id={id} value={value} onChange={e => onChange(e.target.value)} dir={f.ltr ? 'ltr' : 'rtl'} className={box} />}
      {f.hint && <div className="text-xs text-ink-2">{f.hint}</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  /* بخشی که همه‌ی خانه‌هایش تهی بوده‌اند عنوان بی‌محتوا می‌شد */
  const any = Array.isArray(children) ? children.some(Boolean) : Boolean(children)
  if (!any) return null
  return (
    <section className="mb-4">
      <h3 className="m-0 mb-1 text-sm font-semibold text-gold-text">{title}</h3>
      {children}
    </section>
  )
}

export default function UserDetailDialog({ userId, onClose, onRolesChanged }: {
  userId: string
  onClose: () => void
  /** فهرستِ پشتِ پنجره هم نقشِ تازه را نشان دهد */
  onRolesChanged?: (roles: { primaryRole: string; secondaryRoles: string[] }) => void
}) {
  const [u, setU] = useState<Row | null>(null)
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    /* پنجره‌ی تأییدِ داخلی (برداشتن/بازگرداندنِ نقش) باز است ⟵ Escape مالِ همان است؛
       بی این، دلیلِ تایپ‌شده و نتیجه با بسته‌شدنِ پنجره‌ی مادر گم می‌شد */
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      onClose()
    }
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

  /* ورود به ویرایش: فرم از مقدارهای فعلی پر می‌شود، وگرنه ذخیره‌کردن
     یک فیلد دست‌نخورده آن را خالی می‌کند. */
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
      /* فقط تغییرها فرستاده می‌شوند — نه کل فرم. این‌طور یک فیلد
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
     واقعا محتوا دارند نشان داده می‌شوند. */
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
    <div onClick={onClose} className="adm-modal-backdrop">
      <div onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="user-detail-title"
        className="adm-sheet [--adm-sheet-w:600px]">
        {/* سربرگ */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line/10 p-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold/20 text-base font-semibold text-gold-text" aria-hidden>
            {g('avatar')
              // eslint-disable-next-line @next/next/no-img-element -- نشانیِ بیرونیِ دلخواهِ کاربر؛ بهینه‌ساز Next جا ندارد
              ? <img src={String(g('avatar'))} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
              : name.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1 basis-32">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="user-detail-title" className="adm-break m-0 text-base font-semibold text-ink">{name}</h2>
              {status === 'verified'
                ? <BadgeCheck size={16} className="text-success" aria-label="تأییدشده" />
                : status === 'rejected' ? <ShieldAlert size={16} className="text-danger" aria-label="ردشده" /> : null}
            </div>
            <div className="mt-1 text-xs text-ink-2">
              {roles.map(r => ROLE_FA[r] ?? r).join(' · ') || '—'}
            </div>
          </div>
          <div className="adm-actions ms-auto">
            {saved && <span role="status" className="text-xs font-semibold text-success">ذخیره شد</span>}
            {u && !editing && (
              <Button size="sm" variant="primary" icon={<Pencil size={13} aria-hidden />} onClick={startEdit}
                title="ویرایش مشخصات">
                ویرایش
              </Button>
            )}
            <button type="button" onClick={onClose} aria-label="بستن"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-field border border-line/10 bg-line/[.05] text-ink-2 hover:bg-line/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
              <X size={16} aria-hidden />
            </button>
          </div>
        </div>

        {/* بدنه */}
        <div className="overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
          {err && <div role="alert" className="py-3 text-sm font-semibold text-danger-ink">{err}</div>}
          {!u && !err && (
            <div role="status" className="flex items-center gap-2 p-5 text-sm text-ink-2">
              <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden /> در حال بارگذاری…
            </div>
          )}

          {u && editing && (
            <>
              <p className="m-0 pb-2 text-xs leading-loose text-ink-2">
                شماره‌ی موبایل، نقش‌ها و وضعیت احراز از این‌جا عوض نمی‌شوند
                هر تغییری در گزارش ممیزی ثبت می‌شود
              </p>
              {EDIT_FIELDS.map(f => (
                <EditRow key={f.key} f={f} value={form[f.key] ?? ''}
                  onChange={v => setForm(s => ({ ...s, [f.key]: v }))} />
              ))}
              {saveErr && <div role="alert" className="py-3 text-sm font-semibold text-danger-ink">{saveErr}</div>}
              <div className="adm-sticky-actions">
                <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setSaveErr('') }}>انصراف</Button>
                <Button size="sm" variant="primary" loading={saving} loadingText="در حال ذخیره…" onClick={() => void save()}>
                  ذخیره‌ی تغییرات
                </Button>
              </div>
            </>
          )}

          {u && !editing && (
            <>
              {/* برداشتن و بازگرداندنِ نقش — سربرگ هم با پاسخ به‌روز می‌شود */}
              <UserRolesSection userId={userId}
                onChanged={r => { setU(prev => (prev ? { ...prev, ...r } : prev)); onRolesChanged?.(r) }} />

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
                  <p className="adm-break m-0 py-2 text-sm leading-loose text-ink-2">{String(g('bio'))}</p>
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
                      <div key={i} className="border-b border-line/10">
                        <a href={String(url)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center text-sm font-semibold text-gold-text no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
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
