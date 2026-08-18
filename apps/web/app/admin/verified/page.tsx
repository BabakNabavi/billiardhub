'use client'

/* ─────────────────────────────────────────────────────────────
   تیکِ آبی — یک میز برای هر هفت نقش.

   ── مشکلی که این صفحه را ساخت ──
   اعطای تیک در شش جای جدا پخش بود: `/admin/coaches`،
   `/admin/referees`، `/admin/sellers` هرکدام دکمه‌ی خودشان را
   داشتند، `/admin/clubs` هم مالِ باشگاه بود، و بازیکن، متخصص و
   تولیدکننده اصلاً هیچ دکمه‌ای نداشتند — API از قبل `verified` را
   می‌پذیرفت ولی هیچ رابطی صدایش نمی‌زد. یعنی تیکِ آن سه نقش عملاً
   غیرقابل‌دادن بود.

   بدتر از پخش‌بودن، دیده‌نشدن بود: کسی که مدرک آپلود می‌کرد در هیچ
   فهرستی ظاهر نمی‌شد. تنها راهِ خبردار شدن این بود که ادمین شانسی
   صفحه‌ی همان نقش را باز کند.

   این‌جا هر هفت نقش در یک فهرست‌اند، تبِ «در انتظار» پیش‌فرض است، و
   صفحه‌ی اولِ پنل عددش را نشان می‌دهد.

   صفحه‌های تک‌نقشی سرِ جایشان می‌مانند (مدرک، رد کردن، جزئیات)؛ این
   صفحه فقط کارِ تیک را انجام می‌دهد.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Inbox } from 'lucide-react'
import { useAuthStore } from '../../../store/auth.store'
import { apiFetch } from '../../../lib/http'
import { notify } from '../../../lib/ui/dialogs'
import TabStrip from '../../../components/ui/TabStrip'
import ScrollList from '../../../components/ui/ScrollList'
import VerifiedBadge from '../../../components/VerifiedBadge'
import VerifiedRow from '../../../components/admin/VerifiedRow'

const GOLD_D = '#8F6531'
const TEXT = '#1C1B17'
const MUT = '#6F6A5C'
const LINE = '#E7E2D6'
const BLUE = '#0095F6'

type Kind = 'club' | 'coach' | 'referee' | 'player' | 'technician' | 'seller' | 'manufacturer'

/* هفت نقش — «کاربر عادی» عمداً نیست: تیک مالِ هویتِ حرفه‌ای است. */
const KINDS: { key: Kind; label: string; href: (slug: string) => string }[] = [
  { key: 'club', label: 'باشگاه', href: s => `/clubs/${s}` },
  { key: 'coach', label: 'مربی', href: s => `/coaches/${s}` },
  { key: 'referee', label: 'داور', href: s => `/referees/${s}` },
  { key: 'player', label: 'بازیکن', href: s => `/players/${s}` },
  { key: 'technician', label: 'متخصص فنی', href: s => `/services/${s}` },
  { key: 'seller', label: 'فروشگاه', href: s => `/sellers/${s}` },
  { key: 'manufacturer', label: 'تولیدکننده', href: s => `/manufacturers/${s}` },
]
const LABEL_OF = Object.fromEntries(KINDS.map(k => [k.key, k.label])) as Record<Kind, string>
const PROFILE_KINDS = KINDS.filter(k => k.key !== 'club').map(k => k.key)

interface Row {
  /** کلیدِ یکتا در کلِ فهرست — شناسه‌ها بین جدول‌ها یکتا نیستند */
  key: string
  kind: Kind
  /** شناسه‌ای که برای نوشتن لازم است: `profiles.id` یا `clubs.id` */
  id: string
  name: string
  sub: string
  href: string
  verified: boolean
  /** مدرکی آپلود شده که پشتوانه‌ی تیک باشد */
  hasDoc: boolean
  /** در سایت منتشر است — تیک دادن به پروفایلِ معلق بی‌معناست */
  published: boolean
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/* ── خواندن ─────────────────────────────────────────────────── */

interface ApiProfile {
  id: string; slug: string; kind: Kind
  status: 'approved' | 'pending' | 'rejected'
  verified: boolean
  licenseUrl: string | null
  data: Record<string, unknown> | null
}

interface ApiClub {
  id: string; slug?: string; name: string; city?: string; province?: string
  verificationStatus: string
  licenseDocumentUrl?: string
  isActive?: boolean
}

function profileRow(p: ApiProfile): Row {
  const d = p.data ?? {}
  const meta = KINDS.find(k => k.key === p.kind)
  const cert = d.certificate as { url?: string } | null | undefined
  return {
    key: `${p.kind}:${p.id}`,
    kind: p.kind,
    id: p.id,
    name: str(d.name) || str(d.title) || str(d.brand) || str(d.fullName) || p.slug || 'بدون نام',
    sub: [str(d.specialty) || str(d.discipline), str(d.city)].filter(Boolean).join(' · ') || '—',
    href: meta ? meta.href(p.slug) : '#',
    verified: p.verified === true,
    /* دو جای ممکنِ مدرک: ستونِ جواز، یا فایلِ مدرکِ داخلِ فرم
       (مربی و داور گواهی‌شان را آن‌جا می‌گذارند). */
    hasDoc: !!str(p.licenseUrl) || !!str(cert?.url),
    published: p.status === 'approved',
  }
}

function clubRow(c: ApiClub): Row {
  return {
    key: `club:${c.id}`,
    kind: 'club',
    id: c.id,
    name: c.name || 'باشگاه',
    sub: [c.province, c.city].filter(Boolean).join('، ') || '—',
    href: `/clubs/${c.slug || c.id}`,
    verified: c.verificationStatus === 'verified',
    hasDoc: !!str(c.licenseDocumentUrl),
    /* باشگاه با هر دو وضعیتِ «تأیید» در فهرستِ عمومی دیده می‌شود */
    published: c.verificationStatus === 'verified' || c.verificationStatus === 'approved',
  }
}

/* ── چرا نتیجه‌ی «نیمه» ──
   اگر یکی از دو منبع بیفتد، فهرستِ دیگری همچنان ارزش دارد؛ ولی
   ادمین باید بداند که چیزی جا افتاده. `catch` خالی یعنی صفِ خرابْ
   «صفِ خالی» دیده می‌شود و ادمین نتیجه می‌گیرد کاری روی میز نیست. */
async function loadRows(): Promise<{ rows: Row[]; partial: boolean }> {
  const [profiles, clubs] = await Promise.all([
    apiFetch('/api/admin/profiles', { cache: 'no-store' })
      .then(async r => (r.ok
        ? { ok: true, list: await r.json() as { profiles?: Record<string, ApiProfile[]> } }
        : { ok: false, list: null }))
      .catch(() => ({ ok: false, list: null })),
    fetch('/api/clubs?all=true', { cache: 'no-store' })
      .then(async r => (r.ok
        ? { ok: true, list: await r.json() as unknown }
        : { ok: false, list: null }))
      .catch(() => ({ ok: false, list: null })),
  ])

  const pRows = PROFILE_KINDS.flatMap(k => profiles.list?.profiles?.[k] ?? [])
  const cRows = Array.isArray(clubs.list) ? (clubs.list as ApiClub[]) : []
  return {
    rows: [...cRows.map(clubRow), ...pRows.map(profileRow)],
    partial: !profiles.ok || !clubs.ok,
  }
}

/* ── نوشتن ──────────────────────────────────────────────────── */

async function setVerified(row: Row, next: boolean): Promise<void> {
  if (row.kind === 'club') {
    /* برداشتنِ تیک باشگاه یعنی برگشت به «منتشر بدونِ تیک» — نه «رد».
       رد کردن باشگاه را از سایت برمی‌دارد و این‌جا مقصود نیست. */
    const r = await apiFetch(`/api/clubs/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationStatus: next ? 'verified' : 'approved' }),
    })
    if (!r.ok) {
      const j = await r.json().catch(() => ({})) as { message?: string }
      throw new Error(j.message ?? 'تغییر وضعیت انجام نشد')
    }
    return
  }

  const r = await apiFetch('/api/admin/profiles', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: row.id, verified: next }),
  })
  if (!r.ok) {
    const j = await r.json().catch(() => ({})) as { message?: string }
    throw new Error(j.message ?? 'تغییر وضعیت انجام نشد')
  }
}

/* ── صفحه ───────────────────────────────────────────────────── */

export default function AdminVerifiedPage() {
  const router = useRouter()
  const { user, _hydrated, authChecked } = useAuthStore()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<'waiting' | 'verified' | 'all'>('waiting')
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [busy, setBusy] = useState<string | null>(null)

  /* سرور نقشِ ثانویه را هم ادمین می‌شمارد (`isAdmin` در lib/finance/db).
     گاردِ فقط-`primaryRole` چنین ادمینی را بیرون می‌انداخت، در حالی که
     همه‌ی درخواست‌هایش موفق می‌شد. */
  const isAdminUser = !!user
    && (user.primaryRole === 'admin' || (user.secondaryRoles ?? []).includes('admin'))

  const refresh = useCallback(async () => {
    try {
      const { rows: r, partial } = await loadRows()
      setRows(r)
      setErr(partial ? 'بخشی از فهرست خوانده نشد — ممکن است مواردی این‌جا نباشند.' : '')
    } catch { setRows([]); setErr('خواندن فهرست انجام نشد') }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    if (_hydrated && authChecked && !isAdminUser) router.push('/')
  }, [_hydrated, authChecked, isAdminUser, router])

  /* «در انتظار» یعنی کاری روی میز هست: منتشر شده، تیک ندارد، و
     مدرکی هم آپلود کرده که بشود درباره‌اش تصمیم گرفت. بدونِ شرطِ
     مدرک، این تب پر می‌شد از پروفایل‌هایی که اصلاً چیزی نفرستاده‌اند
     و صف بی‌معنا می‌شد. */
  const waiting = useMemo(
    () => (rows ?? []).filter(r => r.published && !r.verified && r.hasDoc),
    [rows])

  const shown = useMemo(() => {
    const base = tab === 'waiting' ? waiting
      : tab === 'verified' ? (rows ?? []).filter(r => r.verified)
      : (rows ?? [])
    return kind === 'all' ? base : base.filter(r => r.kind === kind)
  }, [rows, waiting, tab, kind])

  const act = async (row: Row, next: boolean) => {
    setBusy(row.key)
    try {
      await setVerified(row, next)
      setRows(rs => (rs ?? []).map(r => (r.key === row.key ? { ...r, verified: next } : r)))
    } catch (e) {
      notify(e instanceof Error ? e.message : 'تغییر وضعیت انجام نشد')
    } finally { setBusy(null) }
  }

  if (!_hydrated) return null
  if (!isAdminUser) return null

  return (
    <div dir="rtl" style={{ minHeight: '70vh', background: '#F7F5F0', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT, paddingBottom: 64 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px clamp(16px,3vw,28px) 0' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.24em', color: MUT }}>VERIFIED BADGE</span>
            <h1 style={{ fontSize: 'clamp(18px,2.4vw,22px)', fontWeight: 900, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              تیک آبی <VerifiedBadge title="" style={{ marginInlineStart: 0 }} />
            </h1>
            <p style={{ fontSize: 12.5, color: MUT, margin: '6px 0 0', lineHeight: 1.9, maxWidth: 560 }}>
              اعطا و پس‌گرفتنِ تیک برای هر هفت نقش. تیک یعنی «مدرکش دیده و تأیید شده»؛
              برداشتنش پروفایل را از سایت حذف نمی‌کند.
            </p>
          </div>
          <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, textDecoration: 'none', fontSize: 12.5, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
            <ArrowLeft size={13} /> پنل ادمین
          </Link>
        </div>

        <TabStrip
          value={tab}
          onChange={k => setTab(k as typeof tab)}
          tabs={[
            { key: 'waiting', label: 'در انتظار', count: waiting.length, fg: '#92600A', bg: 'rgba(245,158,11,0.12)' },
            { key: 'verified', label: 'تیک‌دار', count: (rows ?? []).filter(r => r.verified).length, fg: BLUE, bg: 'rgba(0,149,246,0.10)' },
            { key: 'all', label: 'همه', count: rows?.length ?? 0 },
          ]}
        />

        {/* فیلترِ نقش — همان کنترلِ مشترکِ سایت، نه یک ردیفِ دستیِ
            تازه. hover و focus-visible و حالتِ انتخاب داخلِ .lq-seg است. */}
        <div className="lq-seg" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
          {([{ key: 'all' as const, label: 'همه‌ی نقش‌ها' }, ...KINDS]).map(k => (
            <button key={k.key} type="button" aria-pressed={kind === k.key}
              onClick={() => setKind(k.key as Kind | 'all')}
              style={{ minWidth: 0 }}>
              {k.label}
            </button>
          ))}
        </div>

        {err && (
          <div style={{ marginBottom: 12, background: 'rgba(178,59,46,0.06)', border: '1px solid rgba(178,59,46,0.24)', color: '#B23B2E', borderRadius: 12, padding: '10px 14px', fontSize: 12.5, fontWeight: 700 }}>
            {err}
          </div>
        )}

        {rows === null ? (
          /* اسکلتِ لودینگ — صفحه نباید یک‌باره از هیچ به فهرست بپرد */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ height: 66, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, opacity: 0.6 }} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18 }}>
            <Inbox size={34} style={{ color: MUT, opacity: 0.5, marginBottom: 10 }} />
            <p style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 6px' }}>
              {tab === 'waiting' ? 'چیزی در انتظار نیست' : 'موردی نیست'}
            </p>
            <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 1.9 }}>
              {tab === 'waiting'
                ? 'وقتی کسی مدرکش را آپلود کند، همین‌جا ظاهر می‌شود.'
                : 'با تبِ دیگری یا نقشِ دیگری امتحان کنید.'}
            </p>
          </div>
        ) : (
          <ScrollList count={shown.length} min={7} gap={10}>
            {shown.map(r => (
              <VerifiedRow key={r.key} busy={busy === r.key}
                onToggle={next => void act(r, next)}
                row={{
                  key: r.key, kindLabel: LABEL_OF[r.kind], name: r.name, sub: r.sub,
                  href: r.href, verified: r.verified, hasDoc: r.hasDoc, published: r.published,
                }} />
            ))}
          </ScrollList>
        )}
      </div>
    </div>
  )
}
