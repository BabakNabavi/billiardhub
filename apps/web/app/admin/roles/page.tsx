'use client'

import { useState, useEffect, useMemo } from 'react'
import { ROLE_MAP, RoleValue, RoleStatus, toFarsiDigits, hexToRgba, STATUS_COLOR, STATUS_LABEL } from '@/lib/roles'
import { csrfToken, apiFetch } from '../../../lib/http'
import TabStrip from '../../../components/ui/TabStrip'
import Ti from '../../../components/ui/Ti'
import { Button } from '../../../components/ui/Button'
import { AdminHeader } from '../../../components/admin/AdminHeader'
import { REJECT_REASONS, rejectLabel } from '../../../lib/moderation/reasons'
import ReviewDetails from '../../../components/admin/ReviewDetails'

function authHeader(): Record<string,string> {
  /* نشست روی کوکی httpOnly است؛ فقط توکن CSRF لازم است */
  const t = csrfToken()
  return t ? { 'x-csrf-token': t } : {}
}

interface RoleRequest {
  id: string
  user_id: string
  role: RoleValue
  status: RoleStatus
  doc_url?: string
  rejection_note?: string
  requested_at: string
  reviewed_at?: string
  users?: { mobile: string; name?: string }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'همین الان'
  if (h < 24) return `${toFarsiDigits(h)} ساعت پیش`
  return `${toFarsiDigits(Math.floor(h / 24))} روز پیش`
}

/* ── ردیف فشرده ──
   جایگزین کارت بزرگ. با شصت درخواست، کارت ۱۶۰پیکسلی یعنی ادمین
   باید ده صفحه اسکرول کند تا یک تصمیم بگیرد. این ردیف همه‌ی چیزهای
   لازم — نقش، مدرک، زمان، دکمه‌ها — را فشرده جا می‌دهد: روی موبایل
   مشخصات یک خط و دکمه‌ها خطِ بعد؛ کادر دلیل رد فقط وقتی لازم است باز می‌شود. */
function RequestRow({ req, onAction }: {
  req: RoleRequest
  onAction: (id: string, action: 'approve' | 'reject', note?: string, verified?: boolean) => Promise<void>
}) {
  const meta = ROLE_MAP[req.role] ?? { label: req.role, color: '#64748b', icon: 'user', requiresDoc: false }
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  /* بدون جزئیات، تأیید یعنی امضای نادیده: معلوم نیست طرف کیست، چه
     ثبت کرده، و اطلاعاتش با هویت حسابش می‌خواند یا نه. */
  const [showDetails, setShowDetails] = useState(false)

  const act = async (action: 'approve' | 'reject', verified = false) => {
    setBusy(true)
    await onAction(req.id, action, action === 'reject' ? note : undefined, verified)
    setBusy(false)
    setRejecting(false)
  }

  /* «مدرک ندارد» یعنی تیک آبی نمی‌گیرد، نه اینکه تأیید نمی‌شود.
     فروشگاه، تولیدکننده، خدمات فنی و بازیکن بدون هیچ مدرکی تأیید
     می‌شوند — فقط نشان تأیید نمی‌گیرند. */
  const missingDoc = meta.requiresDoc && !req.doc_url

  return (
    <div className="border-t border-line/10 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* رنگِ نقش و وضعیت از داده می‌آید، پس تنها استایل‌های اینلاینِ مجاز این‌جا هستند */}
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: meta.color }}>
          <Ti name={meta.icon} size={16} color={meta.color} />
          {meta.label}
        </span>

        {req.doc_url ? (
          <a href={req.doc_url} target="_blank" rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1 text-xs text-gold-text no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
            <Ti name="file" size={13} /> مدرک
          </a>
        ) : missingDoc ? (
          <span className="inline-flex items-center gap-1 text-xs text-yellow-700">
            <Ti name="alert-triangle" size={12} /> بدون مدرک
          </span>
        ) : (
          <span className="text-xs text-ink-3">مدرک لازم ندارد</span>
        )}

        <span className="rounded-full px-2 py-1 text-xs ms-auto"
          style={{ color: STATUS_COLOR[req.status], background: hexToRgba(STATUS_COLOR[req.status], 0.1) }}>
          {STATUS_LABEL[req.status]}
        </span>
      </div>

      {req.status === 'pending' && !rejecting && (
        <div className="adm-actions mt-3">
          <Button size="sm" variant="secondary" disabled={busy} aria-pressed={showDetails}
            title="دیدن اطلاعات کامل پیش از تصمیم"
            onClick={() => setShowDetails(v => !v)}>
            {showDetails ? 'بستن' : 'جزئیات'}
          </Button>
          {/* تأیید همیشه ممکن است — مدرک اجباری نیست. نبودنش فقط
              یعنی تیک آبی داده نمی‌شود. */}
          <Button size="sm" variant="primary" loading={busy} title="تأیید بدون تیک آبی"
            onClick={() => void act('approve')}>
            تأیید
          </Button>
          {/* تیک آبی فقط با مدرک. بدون مدرک دکمه خاموش است تا ادمین
              چیزی را که ندیده تأیید نکند — سرور هم همین را رد می‌کند. */}
          <Button size="sm" variant="secondary" disabled={busy || missingDoc}
            icon={<Ti name="rosette-discount-check" size={13} />}
            className="text-[#1D4ED8]"
            title={missingDoc ? `برای تیک آبی، ${meta.docHint || 'مدرک'} لازم است` : 'تأیید همراه با تیک آبی'}
            onClick={() => void act('approve', true)}>
            تیک آبی
          </Button>
          <Button size="sm" variant="danger-ghost" disabled={busy} onClick={() => setRejecting(true)}>
            رد
          </Button>
        </div>
      )}

      {showDetails && (
        <div className="mt-3 pt-3">
          <ReviewDetails type="role" id={req.id} />
        </div>
      )}

      {rejecting && (
        <div className="adm-toolbar mt-3">
          {/* فهرست بسته، نه متن آزاد: این متن داخل پیامک می‌رود و
              سرویس پیامک مقدارهای ممکن آن را از قبل می‌خواهد. */}
          <label className="flex-1 basis-48">
            <span className="sr-only">دلیل رد</span>
            <select value={note} onChange={e => setNote(e.target.value)} className="h-11 w-full">
              <option value="">دلیل رد را انتخاب کنید…</option>
              {REJECT_REASONS.map(r => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </label>
          <Button size="sm" variant="danger" loading={busy} disabled={!note} onClick={() => void act('reject')}>
            تأیید رد
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setRejecting(false)}>
            انصراف
          </Button>
        </div>
      )}

      {/* در ردیف‌های تازه کد دلیل ذخیره می‌شود، در ردیف‌های قدیمی
          متن آزاد. `rejectLabel` هر دو را می‌فهمد. */}
      {req.status === 'rejected' && req.rejection_note && (
        <p className="m-0 mt-2 text-xs text-danger-ink">
          دلیل: {rejectLabel(req.rejection_note)}
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function AdminRolesPage() {
  const [requests, setRequests] = useState<RoleRequest[]>([])

  /* درخواست‌های یک کاربر کنار هم — بیست نفر با سه نقش یعنی شصت
     ردیف پراکنده که ادمین نمی‌فهمد کدامشان مال یک نفرند. */
  const grouped = useMemo(() => {
    const by = new Map<string, { key: string; name: string; items: RoleRequest[] }>()
    for (const r of requests) {
      const key = r.user_id
      const name = r.users?.name || r.users?.mobile || key.slice(0, 8)
      if (!by.has(key)) by.set(key, { key, name, items: [] })
      by.get(key)!.items.push(r)
    }
    /* تازه‌ترین درخواست بالا — همان ترتیبی که سرور می‌دهد */
    return [...by.values()]
  }, [requests])
  const [filter, setFilter]     = useState<RoleStatus>('pending')
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState<string | null>(null)

  const [svcDown, setSvcDown] = useState(false)

  /* اگر سرویس در دسترس نبود، به‌جای برگرداندن کاربر، صفحه با پیام خالی می‌ماند */
  const load = async (status: RoleStatus) => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/admin/roles?status=${status}`, {
        headers: authHeader() as Record<string, string>,
      })
      if (!res.ok) { setSvcDown(true); setRequests([]); setLoading(false); return }
      const j = await res.json()
      setSvcDown(false)
      setRequests(j.requests ?? [])
      setLoading(false)
    } catch {
      setSvcDown(true); setRequests([]); setLoading(false)
    }
  }

  useEffect(() => { load(filter) }, [filter])

  /* ⚠️ تا آبان ۱۴۰۵ پاسخ سرور خوانده نمی‌شد و «نقش تأیید شد» همیشه نشان داده
     می‌شد، حتی وقتی سرور با ۴۰۳ (نبود کلید «نقش‌ها» یا «تیک آبی») یا ۵۰۰ رد
     کرده بود. حالا پیام موفقیت فقط بعد از پاسخ موفق است. */
  const handleAction = async (id: string, action: 'approve' | 'reject', note?: string, verified?: boolean) => {
    let msg: string
    try {
      const r = await apiFetch('/api/admin/roles', {
        method: 'PATCH',
        headers: {
          ...(authHeader() as Record<string, string>),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action, note, verified }),
      })
      if (r.ok) {
        msg = action === 'reject' ? 'نقش رد شد' : verified ? 'تأیید شد و تیک آبی گرفت' : 'نقش تأیید شد'
      } else {
        const j = await r.json().catch(() => null) as { message?: string } | null
        msg = j?.message || 'انجام نشد'
      }
    } catch {
      msg = 'خطا در ارتباط با سرور'
    }
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
    load(filter)
  }

  const tabs: { status: RoleStatus; label: string }[] = [
    { status: 'pending',  label: 'در انتظار' },
    { status: 'approved', label: 'تأیید‌شده' },
    { status: 'rejected', label: 'رد‌شده' },
  ]

  return (
    <main className="adm-page">
      <AdminHeader title="مدیریت درخواست نقش" />

      <TabStrip value={filter} onChange={(v: string) => setFilter(v as RoleStatus)} style={{ marginBottom: 0 }}
        tabs={tabs.map(t => ({
          key: t.status, label: t.label,
          fg: STATUS_COLOR[t.status], bg: hexToRgba(STATUS_COLOR[t.status], 0.1),
        }))} />

      {/* سرویس در دسترس نیست */}
      {svcDown && !loading && (
        <div role="alert" className="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm leading-loose text-danger-ink">
          سرویس درخواست‌های نقش فعلا در دسترس نیست — بعدا دوباره تلاش کنید، (تأیید/لغو نقش‌ها به بک‌اند متصل است)
        </div>
      )}

      {/* List */}
      {loading ? (
        <ul aria-busy="true" aria-label="در حال بارگذاری" className="m-0 grid list-none gap-3 p-0">
          {[0, 1, 2].map(i => (
            <li key={i} className="h-24 rounded-card border border-line/10 bg-surface motion-safe:animate-pulse" />
          ))}
        </ul>
      ) : requests.length === 0 ? (
        <div className="adm-card py-12 text-center">
          <Ti name="inbox" size={40} color="#1e293b" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p className="m-0 text-sm text-ink-2">درخواستی وجود ندارد</p>
        </div>
      ) : (
        <>
          {/* ── گروه‌بندی بر اساس کاربر ──
              با کارت‌های بزرگ، بیست نفر که هرکدام سه نقش خواسته‌اند
              یعنی شصت کارت هم‌شکل پشت هم — ادمین نمی‌فهمد کدام
              درخواست‌ها مال یک نفرند و باید با هم بررسی شوند.

              حالا هر کاربر یک بلوک است و نقش‌هایش زیرش، فشرده. */}
          <p className="m-0 text-xs text-ink-2">
            {toFarsiDigits(requests.length)} درخواست از {toFarsiDigits(grouped.length)} کاربر
          </p>
          <div className="grid gap-3">
            {grouped.map(g => (
              <section key={g.key} aria-label={g.name} className="overflow-hidden rounded-card border border-line/10 bg-surface">
                <div className="flex flex-wrap items-center gap-2 bg-paper px-4 py-3">
                  <Ti name="user" size={15} color="rgba(0,0,0,0.45)" />
                  <h2 className="adm-break m-0 text-sm font-semibold text-ink">{g.name}</h2>
                  <span className="text-xs text-ink-2">
                    {toFarsiDigits(g.items.length)} نقش · {timeAgo(g.items[0]!.requested_at)}
                  </span>
                </div>
                <div>
                  {g.items.map(r => (
                    <RequestRow key={r.id} req={r} onAction={handleAction} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {toast && (
        <div role="status"
          className="fixed inset-x-0 bottom-[calc(32px+env(safe-area-inset-bottom))] z-[100] mx-auto w-fit max-w-[calc(100%-32px)] rounded-full bg-gold-deep px-6 py-3 text-sm font-semibold text-white">
          ✓ {toast}
        </div>
      )}
    </main>
  )
}
