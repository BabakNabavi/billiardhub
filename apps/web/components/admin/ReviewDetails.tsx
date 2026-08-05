'use client'

/* ─────────────────────────────────────────────────────────────
   جزئیاتِ یک مورد برای تصمیمِ تأیید/رد.

   تصمیم‌گرفتن درباره‌ی چیزی که دیده نمی‌شود تأیید نیست. این کامپوننت
   هر چیزی را که کاربر ثبت کرده نشان می‌دهد، به‌علاوه‌ی هویتِ حسابش —
   تا بشود دید آنچه ادعا شده با آنچه ثبت شده می‌خواند یا نه.

   برچسبِ فارسی برای کلیدهای شناخته‌شده هست؛ کلیدِ ناشناخته هم نمایش
   داده می‌شود، فقط با نامِ خودش. عمداً: پنهان‌کردنِ فیلدی که برچسب
   ندارد یعنی روزی فیلدِ تازه‌ای اضافه می‌شود و ادمین هرگز نمی‌بیندش.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, FileText, ExternalLink, ShieldCheck, ShieldAlert, Search } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { toFaDigits, faBirthDate } from '../../lib/jalali'
import { rejectLabel } from '../../lib/moderation/reasons'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

export type ReviewType = 'profile' | 'club' | 'role'

/* برچسب‌ها — از فرم‌های موجود درآمده‌اند */
const LABEL: Record<string, string> = {
  firstNameFa: 'نام', lastNameFa: 'نام خانوادگی',
  firstNameEn: 'نام (انگلیسی)', lastNameEn: 'نام خانوادگی (انگلیسی)',
  name: 'نام', title: 'عنوان', brand: 'برند', slug: 'نشانی پروفایل',
  bio: 'معرفی کوتاه', fullBio: 'معرفی', description: 'توضیحات',
  province: 'استان', city: 'شهر', address: 'نشانی', postalCode: 'کد پستی',
  phone: 'تلفن', mobile: 'موبایل', whatsapp: 'واتساپ', workPhone: 'تلفن محل کار',
  instagram: 'اینستاگرام', telegram: 'تلگرام', website: 'وب‌سایت',
  email: 'ایمیل', birthDate: 'تاریخ تولد', gender: 'جنسیت',
  disciplines: 'رشته‌ها', grades: 'درجات', certificate: 'مدرک',
  experience: 'سابقه', sinceYear: 'سال تأسیس', specialties: 'تخصص‌ها',
  coverage: 'شهرهای تحت پوشش', services: 'خدمات', products: 'محصولات',
  club: 'باشگاه', licenseNumber: 'شماره جواز', gallery: 'تصاویر', videos: 'ویدیوها',
  ranking: 'رتبه', achievements: 'افتخارات', team: 'تیم',
  /* باشگاه */
  snookerTables: 'میز اسنوکر', pocketTables: 'میز پاکت',
  highballTables: 'میز هی‌بال', vipSnookerTables: 'میز اسنوکر VIP',
  hasCafe: 'کافه', hasParking: 'پارکینگ', hasWifi: 'اینترنت بی‌سیم',
  hasProfessionalCoach: 'مربی', latitude: 'عرض جغرافیایی', longitude: 'طول جغرافیایی',
  verificationStatus: 'وضعیت تأیید', isActive: 'فعال', country: 'کشور',
  openTime: 'ساعت بازگشایی', closeTime: 'ساعت بستن', rating: 'امتیاز',
  reviewCount: 'تعداد نظرها', memberCount: 'تعداد اعضا', totalTables: 'مجموع میزها',
  licenseVerified: 'جواز تأییدشده', licenseCheckedAt: 'تاریخ استعلام جواز',
  licenseDocumentUrl: 'فایل جواز', rejectionReason: 'علت رد',
  bankCard: 'شماره کارت', bankCardOwner: 'صاحب کارت', bankName: 'بانک', iban: 'شبا',
  isDemo: 'نمایشی', isVerified: 'تأییدشده', isOpen: 'باز است',
  hoursNote: 'توضیح ساعات کاری', closedDays: 'روزهای تعطیل',
  /* پروفایل‌ها */
  photo: 'عکس', avatar: 'عکس', logo: 'نشان', cover: 'تصویر جلد',
  freeCoach: 'مربی آزاد', verified: 'تیک تأیید', status: 'وضعیت',
  price: 'قیمت', priceFrom: 'شروع قیمت', unit: 'واحد',
  years: 'سال‌های فعالیت', level: 'سطح', rank: 'رتبه',
  shopName: 'نام فروشگاه', storeName: 'نام فروشگاه', factoryName: 'نام کارخانه',
  workHours: 'ساعات کاری', workDays: 'روزهای کاری',
}

const faLabel = (k: string) => LABEL[k] ?? k

/* مقدارها شکل‌های گوناگونی دارند — آرایه، شیء، بولی، تاریخ */
function show(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'بله' : 'خیر'
  if (typeof v === 'number') return toFaDigits(v.toLocaleString('en-US'))
  if (Array.isArray(v)) {
    if (!v.length) return '—'
    return v.map(x => (x && typeof x === 'object'
      ? Object.values(x as Record<string, unknown>).filter(y => typeof y !== 'object').join(' — ')
      : String(x))).join('، ')
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    return Object.values(o).filter(x => x && typeof x !== 'object').map(String).join(' — ') || '—'
  }
  const s = String(v)
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? faDateTime(s) : toFaDigits(s)
}

function faDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch { return iso }
}

interface Payload {
  type: string
  owner: Record<string, unknown> | null
  fields?: Record<string, unknown>
  license?: { number?: string | null; url?: string | null; verified?: boolean; note?: string | null }
  profile?: { slug?: string; status?: string; licenseUrl?: string | null; fields?: Record<string, unknown> } | null
  counts?: { tables?: number; members?: number }
  images?: string[]
  logo?: string | null
  [k: string]: unknown
}

export default function ReviewDetails({ type, id }: { type: ReviewType; id: string }) {
  const [data, setData] = useState<Payload | null>(null)
  const [err, setErr] = useState('')

  const [code, setCode] = useState('')
  const [licBusy, setLicBusy] = useState(false)
  const [licMsg, setLicMsg] = useState<{ ok: boolean; text: string; rows: [string, string][] } | null>(null)
  const [docBusy, setDocBusy] = useState(false)
  const [docErr, setDocErr] = useState('')

  /* ── بازکردنِ مدرک ──
     مدرکِ باشگاه در باکتِ خصوصی است و لینکِ مستقیم ندارد؛ باید از
     مسیرِ مجوزدار یک لینکِ امضاشده‌ی کوتاه‌عمر گرفت. پنجره **پیش از**
     await باز می‌شود، وگرنه مرورگر آن را pop-up ناخواسته می‌شمارد و
     می‌بندد. */
  const openDoc = async () => {
    setDocErr('')
    const url = (data?.docUrl as string) || data?.license?.url || data?.profile?.licenseUrl || ''
    if (type !== 'club') { if (url) window.open(String(url), '_blank', 'noopener'); return }

    const w = window.open('', '_blank')
    setDocBusy(true)
    try {
      const r = await apiFetch(`/api/clubs/${id}/license-doc`, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.url) { w?.close(); setDocErr(j?.message || 'مدرک باز نشد'); return }
      if (w) w.location.href = j.url; else window.open(j.url, '_blank', 'noopener')
    } catch { w?.close(); setDocErr('خطا در ارتباط با سرور') } finally { setDocBusy(false) }
  }

  const checkLicense = async () => {
    setLicBusy(true); setLicMsg(null)
    try {
      const r = await apiFetch('/api/admin/license-check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, trackingCode: code.trim() }),
      })
      const j = await r.json().catch(() => ({}))
      const d = (j?.data ?? {}) as Record<string, unknown>
      /* آنچه استعلام برمی‌گرداند باید دیده شود، نه فقط «تأیید شد» —
         ادمین باید بتواند با تصویرِ جواز بسنجدش. */
      const rows: [string, string][] = []
      for (const [k, label] of [
        ['name', 'نام دارنده'], ['nationalCode', 'کد ملی'], ['jobTitle', 'صنف'],
        ['address', 'نشانی'], ['issueDate', 'تاریخ صدور'], ['expireDate', 'تاریخ انقضا'],
      ] as [string, string][]) {
        if (d[k]) rows.push([label, toFaDigits(String(d[k]))])
      }
      setLicMsg({
        ok: r.ok && j?.match === true && !j?.expired,
        text: j?.message || (r.ok ? 'استعلام انجام شد' : 'استعلام ناموفق بود'),
        rows,
      })
      if (r.ok && j?.match === true) {
        /* شماره‌ی ثبت‌شده عوض شده — تازه‌اش را نشان بده */
        setData(p => (p ? { ...p, license: { ...(p.license ?? {}), number: code.trim(), verified: !j?.expired } } : p))
      }
    } catch {
      setLicMsg({ ok: false, text: 'خطا در ارتباط با سرور', rows: [] })
    } finally { setLicBusy(false) }
  }

  useEffect(() => {
    let alive = true
    setData(null); setErr('')
    void apiFetch(`/api/admin/review?type=${type}&id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then(async r => {
        const j = await r.json().catch(() => ({}))
        if (!alive) return
        if (!r.ok) { setErr(j?.message || 'دریافت اطلاعات انجام نشد'); return }
        setData(j)
      })
      .catch(() => { if (alive) setErr('خطا در ارتباط با سرور') })
    return () => { alive = false }
  }, [type, id])

  if (err) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: RED, fontSize: 12.5, padding: '14px 2px' }}>
        <AlertCircle size={15} /> {err}
      </div>
    )
  }
  if (!data) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: 26 }}>
        <Loader2 size={18} className="animate-spin" style={{ color: MUT }} />
      </div>
    )
  }

  const o = data.owner
  const fields = data.fields ?? data.profile?.fields ?? {}
  const lic = data.license ?? (data.profile ? { url: data.profile.licenseUrl } : undefined)
  const docUrl = (data.docUrl as string) || lic?.url || null
  const hasDoc = !!docUrl

  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'var(--font-base)' }}>

      {/* ── هویتِ صاحبِ حساب ──
          مهم‌ترین بخش: تصمیم درباره‌ی یک پروفایل بدونِ دانستنِ اینکه
          پشتش چه کسی است، بی‌معنی است. */}
      {o ? (
        <Box title="صاحب حساب">
          <Grid>
            <F k="نام و نام خانوادگی" v={String(o.name ?? '—')} strong />
            <F k="موبایل" v={toFaDigits(String(o.phone ?? '—'))} ltr />
            <F k="کد ملی" v={toFaDigits(String(o.nationalId ?? '—'))} ltr />
            {/* دو قالب در دیتابیس هست — شمسی و میلادی. `faBirthDate`
                هر دو را شمسی نشان می‌دهد. */}
            <F k="تاریخ تولد" v={faBirthDate(o.birthDate as string)} />
            <F k="استان / شهر" v={[o.province, o.city].filter(Boolean).join('، ') || '—'} />
            <F k="عضویت در باشگاه" v={String(o.clubName ?? '—')} />
            <F k="نقش اصلی" v={String(o.primaryRole ?? '—')} />
            <F k="تاریخ ثبت‌نام" v={o.createdAt ? faDateTime(String(o.createdAt)) : '—'} />
          </Grid>

          {/* احرازها — چیزی که تشخیصِ حسابِ واقعی از الکی را ممکن می‌کند */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 11 }}>
            <Pill ok={o.phoneVerified === true} on="موبایل تأییدشده" off="موبایل تأیید نشده" />
            <Pill ok={o.nationalIdVerified === true} on="کد ملی تأییدشده" off="کد ملی تأیید نشده" />
          </div>
        </Box>
      ) : (
        <Box title="صاحب حساب">
          <p style={{ fontSize: 12.5, color: RED, margin: 0, lineHeight: 1.9 }}>
            حسابِ صاحبِ این مورد پیدا نشد — ممکن است کاربر حذف شده باشد.
          </p>
        </Box>
      )}

      {/* ── مدرک و استعلام ── */}
      <Box title="جواز کسب / مدرک">
        {hasDoc ? (
          <button type="button" onClick={() => void openDoc()} disabled={docBusy}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, cursor: docBusy ? 'wait' : 'pointer',
              border: '1px solid rgba(37,99,235,0.22)', background: 'rgba(37,99,235,0.07)',
              color: '#2563EB', borderRadius: 10, padding: '9px 14px', fontSize: 12.5, fontWeight: 800,
              fontFamily: 'inherit',
            }}>
            {docBusy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            مشاهده مدرک <ExternalLink size={12} />
          </button>
        ) : (
          <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 1.9 }}>
            مدرکی بارگذاری نشده. <span style={{ color: SEC }}>تأیید همچنان ممکن است — فقط نشانِ تأیید داده نمی‌شود.</span>
          </p>
        )}
        {docErr ? (
          <p style={{ fontSize: 11.5, color: RED, margin: '8px 0 0', lineHeight: 1.9 }}>{docErr}</p>
        ) : null}

        {/* ── استعلام ──
            پیش‌تر خودِ صاحبِ کسب‌وکار شماره را وارد می‌کرد و استعلام
            می‌گرفت، و نتیجه‌اش تیکِ تأیید می‌داد — یعنی تأییدِ یک
            کسب‌وکار به ورودیِ خودش وابسته بود. حالا ادمین شماره را از
            روی تصویرِ جواز می‌خواند و خودش استعلام می‌گیرد. */}
        {type !== 'role' ? (
          <div style={{ marginTop: 13, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: SEC, marginBottom: 7 }}>
              استعلام شماره جواز
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={code} onChange={e => { setCode(e.target.value); setLicMsg(null) }}
                placeholder="شماره جواز را از روی مدرک وارد کنید"
                dir="ltr" inputMode="numeric"
                style={{
                  flex: '1 1 200px', minWidth: 0, border: `1px solid ${LINE}`, borderRadius: 10,
                  padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', color: INK,
                  outline: 'none', background: '#FCFBF8', textAlign: 'center', letterSpacing: 1,
                }} />
              <button type="button" onClick={() => void checkLicense()}
                disabled={!code.trim() || licBusy}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 10,
                  padding: '9px 16px', fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit',
                  cursor: !code.trim() || licBusy ? 'not-allowed' : 'pointer',
                  border: `1px solid ${code.trim() ? 'rgba(199,166,106,0.34)' : LINE}`,
                  background: code.trim() ? 'rgba(199,166,106,0.12)' : '#F7F6F2',
                  color: code.trim() ? GOLD_D : MUT,
                }}>
                {licBusy ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                استعلام
              </button>
            </div>

            {licMsg ? (
              <div style={{
                marginTop: 10, borderRadius: 11, padding: '10px 13px', fontSize: 12, lineHeight: 1.95,
                color: licMsg.ok ? FELT : RED,
                background: licMsg.ok ? 'rgba(14,122,56,0.06)' : 'rgba(178,59,46,0.06)',
                border: `1px solid ${licMsg.ok ? 'rgba(14,122,56,0.22)' : 'rgba(178,59,46,0.22)'}`,
              }}>
                <div style={{ fontWeight: 800 }}>{licMsg.text}</div>
                {licMsg.rows.length ? (
                  <div style={{ marginTop: 8, display: 'grid', gap: '6px 16px', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
                    {licMsg.rows.map(([k, v]) => <F key={k} k={k} v={v} />)}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {lic?.number ? (
          <div style={{ marginTop: 11 }}>
            <F k="شماره جواز ثبت‌شده" v={toFaDigits(String(lic.number))} ltr />
          </div>
        ) : null}
        {lic?.note ? (
          <p style={{ fontSize: 12, color: SEC, margin: '9px 0 0', lineHeight: 1.9 }}>یادداشت: {String(lic.note)}</p>
        ) : null}
      </Box>

      {/* ── آمارِ باشگاه ── */}
      {data.counts ? (
        <Box title="وضعیت باشگاه">
          <Grid>
            <F k="تعداد میزها" v={toFaDigits(String(data.counts.tables ?? 0))} />
            <F k="تعداد اعضا" v={toFaDigits(String(data.counts.members ?? 0))} />
          </Grid>
          {(data.counts.tables ?? 0) === 0 ? (
            <p style={{ fontSize: 11.5, color: '#B7791F', margin: '9px 0 0', lineHeight: 1.9 }}>
              هنوز میزی ثبت نشده — باشگاهِ بدون میز قابل رزرو نیست.
            </p>
          ) : null}
        </Box>
      ) : null}

      {/* ── آنچه کاربر ثبت کرده ── */}
      <Box title="اطلاعات ثبت‌شده">
        {Object.keys(fields).length === 0 ? (
          <p style={{ fontSize: 12.5, color: '#B7791F', margin: 0, lineHeight: 1.9 }}>
            هیچ اطلاعاتی ثبت نشده — این درخواست خالی است.
          </p>
        ) : (
          <Grid>
            {Object.entries(fields)
              .filter(([, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length))
              .map(([k, v]) => (
                <F key={k} k={faLabel(k)} v={
                  /* این دو کدِ انگلیسی ذخیره می‌شوند، نه متن — بدونِ
                     ترجمه، «info_incomplete» روی صفحه می‌نشست. */
                  k === 'rejectionReason' ? rejectLabel(v)
                    : k === 'birthDate' || k === 'birth_date' ? faBirthDate(v as string)
                      : show(v)
                } />
              ))}
          </Grid>
        )}
      </Box>

      {/* ── تصاویر ── */}
      {Array.isArray(data.images) && data.images.length ? (
        <Box title="تصاویر">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.images.slice(0, 8).map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" style={{
                  width: 84, height: 84, objectFit: 'cover', borderRadius: 10, border: `1px solid ${LINE}`,
                }} />
              </a>
            ))}
          </div>
        </Box>
      ) : null}
    </div>
  )
}

/* ── تکه‌های نمایشی ── */

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: '13px 15px', background: '#fff' }}>
      <h4 style={{
        fontSize: 11.5, fontWeight: 900, color: MUT, margin: '0 0 10px',
        letterSpacing: '.02em',
      }}>{title}</h4>
      {children}
    </section>
  )
}

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: '9px 18px', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
    {children}
  </div>
)

function F({ k, v, ltr, strong }: { k: string; v: string; ltr?: boolean; strong?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: MUT, marginBottom: 2 }}>{k}</div>
      <div style={{
        fontSize: strong ? 13.5 : 12.5, fontWeight: strong ? 900 : 700, color: INK,
        lineHeight: 1.8, wordBreak: 'break-word',
        ...(ltr ? { direction: 'ltr' as const, textAlign: 'right' as const } : {}),
      }}>{v}</div>
    </div>
  )
}

function Pill({ ok, on, off }: { ok: boolean; on: string; off: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '4px 11px',
      color: ok ? FELT : '#B7791F',
      background: ok ? 'rgba(14,122,56,0.08)' : 'rgba(183,121,31,0.09)',
      border: `1px solid ${ok ? 'rgba(14,122,56,0.22)' : 'rgba(183,121,31,0.24)'}`,
    }}>
      {ok ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}{ok ? on : off}
    </span>
  )
}
