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
import { Loader2, AlertCircle, FileText, ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react'
import { apiFetch } from '../../lib/http'
import { toFaDigits } from '../../lib/jalali'

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
  hasProfessionalCoach: 'مربی حرفه‌ای', latitude: 'عرض جغرافیایی', longitude: 'طول جغرافیایی',
  verificationStatus: 'وضعیت تأیید', isActive: 'فعال', country: 'کشور',
  openTime: 'ساعت بازگشایی', closeTime: 'ساعت بستن', rating: 'امتیاز',
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
            <F k="تاریخ تولد" v={toFaDigits(String(o.birthDate ?? '—'))} />
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

      {/* ── مدرک ── */}
      <Box title="مدرک">
        {docUrl ? (
          <a href={String(docUrl)} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none',
              border: '1px solid rgba(37,99,235,0.22)', background: 'rgba(37,99,235,0.07)',
              color: '#2563EB', borderRadius: 10, padding: '9px 14px', fontSize: 12.5, fontWeight: 800,
            }}>
            <FileText size={14} /> مشاهده مدرک <ExternalLink size={12} />
          </a>
        ) : (
          <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 1.9 }}>
            مدرکی بارگذاری نشده. <span style={{ color: SEC }}>تأیید همچنان ممکن است — فقط نشانِ تأیید داده نمی‌شود.</span>
          </p>
        )}
        {lic?.number ? (
          <div style={{ marginTop: 9 }}><F k="شماره جواز" v={toFaDigits(String(lic.number))} ltr /></div>
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
              .map(([k, v]) => <F key={k} k={faLabel(k)} v={show(v)} />)}
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
