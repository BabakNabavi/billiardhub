'use client'

/* پیامِ وضعیتِ حساب برای خودِ کاربر — بی‌هیچ جزئیاتِ داخلی (دلیل، یادداشت
   و مدرکِ مالک را API اصلاً نمی‌فرستد). */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/http'
import { faDateTime } from '@/lib/jalali'
import { buttonClasses } from '@/components/ui/button-classes'
import { useAuthStore } from '@/store/auth.store'

interface StatusRes {
  signedIn: boolean; status?: string; label?: string; message?: string
  until?: string | null; restrictions?: string[]
}

export function AccountStatusView() {
  const [s, setS] = useState<StatusRes | null>(null)
  const [failed, setFailed] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const logout = useAuthStore(st => st.logout)

  useEffect(() => {
    void (async () => {
      try {
        const r = await apiFetch('/api/account/status', { cache: 'no-store' })
        setS(await r.json() as StatusRes)
      } catch { setFailed(true) }
    })()
  }, [])

  const signOut = async () => {
    setLeaving(true)
    try { await apiFetch('/api/auth/logout', { method: 'POST' }) } catch { /* کوکی سمتِ سرور هم منقضی می‌شود */ }
    logout()
    window.location.assign('/')
  }

  if (failed) return <p className="mt-6 text-sm text-danger-ink" role="alert">وضعیت خوانده نشد، صفحه را تازه کنید</p>
  if (!s) return (
    <p className="mt-6 flex items-center gap-2 text-sm text-ink-2" role="status">
      <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden /> در حال بررسی…
    </p>
  )

  /* ⚠️ «وارد نشده» سبز نیست: کاربرِ مسدودی که توکنش منقضی شده هم همین را
     می‌گیرد، و پیامِ «فعال» برایش دروغ بود. */
  if (!s.signedIn) return (
    <section className="lq-pcard mt-6 flex flex-col gap-4 p-6">
      <p className="m-0 text-sm text-ink">برای دیدن وضعیت حساب وارد شوید، اگر حسابتان محدود شده باشد، پیامش پس از ورود نشان داده می‌شود</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/login" className={buttonClasses({ size: 'md' })}>ورود</Link>
        <Link href="/contact" className={buttonClasses({ size: 'md', variant: 'secondary' })}>تماس با پشتیبانی</Link>
      </div>
    </section>
  )

  const active = s.status === 'active'
  return (
    <section className="lq-pcard mt-6 flex flex-col gap-4 p-6" aria-live="polite">
      <div className="flex items-center gap-3">
        {active
          ? <ShieldCheck size={28} className="text-success" aria-hidden />
          : <ShieldAlert size={28} className="text-danger-ink" aria-hidden />}
        <p className="m-0 text-xl font-semibold text-ink">
          {active ? 'حساب شما فعال است' : s.label}
        </p>
      </div>
      {!active && s.message && <p className="m-0 text-sm text-ink">{s.message}</p>}
      {!active && s.until && (
        <p className="m-0 text-sm text-ink-2">پایان محدودیت: {faDateTime(s.until)}</p>
      )}
      {!!s.restrictions?.length && (
        <ul className="m-0 flex list-disc flex-col gap-1 ps-6 text-sm text-ink-2">
          {s.restrictions.map(r => <li key={r}>{r}</li>)}
        </ul>
      )}
      {!active && (
        <p className="m-0 text-xs text-ink-2">اگر فکر می‌کنید اشتباهی رخ داده، از راه پشتیبانی اعتراض ثبت کنید</p>
      )}
      <div className="flex flex-wrap gap-2">
        {active
          ? <Link href="/" className={buttonClasses({ size: 'md' })}>بازگشت به سایت</Link>
          : <Link href="/contact" className={buttonClasses({ size: 'md', variant: 'secondary' })}>تماس با پشتیبانی</Link>}
        {s.signedIn && !active && (
          <button type="button" onClick={signOut} disabled={leaving}
            className={buttonClasses({ size: 'md', variant: 'ghost' })}>
            {leaving && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden />}
            خروج از حساب
          </button>
        )}
      </div>
    </section>
  )
}
