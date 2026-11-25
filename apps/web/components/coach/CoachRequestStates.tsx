/* ─────────────────────────────────────────────────────────────
   حالت‌های فرمِ درخواست از مربی (جز خودِ فرم): بارگذاری، مهمان، صاحبِ
   پروفایل، خطا، درخواستِ باز و ارسال‌شده. جدا از فرم تا هر دو کوتاه بمانند.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import type { ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { buttonClasses } from '../ui/button-classes'
import { faDateTime } from '../../lib/jalali'

function StateCard({ title, children, action, tone = 'neutral' }: {
  title: string; children?: ReactNode; action?: ReactNode; tone?: 'neutral' | 'success'
}) {
  return (
    <div role={tone === 'success' ? 'status' : undefined}
      className="mt-6 rounded-card border border-line/10 bg-surface p-6 shadow-e0">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        {tone === 'success' && <CheckCircle2 size={18} className="shrink-0 text-success" aria-hidden />}
        {title}
      </p>
      {children && <div className="mt-2 text-sm text-ink-2">{children}</div>}
      {action && <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}

export function RequestSkeleton() {
  return (
    <div className="mt-6 animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="در حال بارگذاری">
      {[0, 1, 2].map(i => (
        <div key={i} className="mt-6">
          <div className="h-4 w-24 rounded-chip bg-line/[.08]" />
          <div className="mt-3 flex gap-2">
            <div className="h-11 w-24 rounded-field bg-line/[.06]" />
            <div className="h-11 w-24 rounded-field bg-line/[.06]" />
          </div>
        </div>
      ))}
      <div className="mt-8 h-12 rounded-field bg-line/[.06]" />
    </div>
  )
}

export function GuestState({ next }: { next: string }) {
  return (
    <StateCard title="برای ارسال درخواست وارد حساب خود شوید"
      action={<Link href={`/login?next=${encodeURIComponent(next)}`} className={buttonClasses()}>ورود یا ثبت‌نام</Link>}>
      درخواست با شماره موبایل حساب شما برای مربی فرستاده می‌شود تا برای هماهنگی تماس بگیرد
    </StateCard>
  )
}

export function SelfState() {
  return (
    <StateCard title="این صفحه درخواست برای پروفایل خودتان است"
      action={<Link href="/dashboard/coach" className={buttonClasses({ variant: 'secondary' })}>پنل مربی</Link>}>
      شاگردها از این‌جا برایتان درخواست کلاس یا مشاوره می‌فرستند، پیامکش برای شما می‌آید و جزئیاتش در پنل مربی است
    </StateCard>
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <StateCard title="بارگذاری انجام نشد"
      action={<Button variant="secondary" onClick={onRetry}>تلاش دوباره</Button>}>
      اتصال اینترنت را بررسی کنید و دوباره امتحان کنید
    </StateCard>
  )
}

export function UnavailableState({ back }: { back: string }) {
  return (
    <StateCard title="این مربی فعلا درخواست نمی‌پذیرد"
      action={<Link href={back} className={buttonClasses({ variant: 'secondary' })}>بازگشت به پروفایل مربی</Link>}>
      می‌توانید از راه‌های تماس صفحه مربی با او در ارتباط باشید
    </StateCard>
  )
}

/* درخواستِ باز: تازه، یا مربی ثبت کرده که تماس گرفته. لغو در هر دو حالت شماره‌ی
   شاگرد را از صندوقِ مربی بیرون می‌برد */
export function OpenState({ title, status, createdAt, coachName, busy, err, onCancel }: {
  title: string; status: string; createdAt: string; coachName: string; busy: boolean; err: string; onCancel: () => void
}) {
  const contacted = status === 'contacted'
  return (
    <StateCard title={contacted ? 'مربی درخواست شما را پاسخ داده است' : 'یک درخواست بی‌پاسخ برای این مربی دارید'}
      action={<Button variant="danger-ghost" loading={busy} onClick={onCancel}>لغو درخواست</Button>}>
      <p>
        درخواست {title} شما در {faDateTime(createdAt)} برای {coachName} فرستاده شد
        {contacted ? '، مربی ثبت کرده که برای هماهنگی با شما تماس گرفته است' : ' و مربی برای هماهنگی با شما تماس می‌گیرد'}
      </p>
      {err && <p role="alert" className="mt-2 font-semibold text-danger">{err}</p>}
    </StateCard>
  )
}

export function SentState({ coachName, back }: { coachName: string; back: string }) {
  return (
    <StateCard tone="success" title="درخواست شما فرستاده شد"
      action={<Link href={back} className={buttonClasses({ variant: 'secondary' })}>بازگشت به پروفایل مربی</Link>}>
      درخواست و شماره شما برای {coachName} فرستاده شد، مربی برای هماهنگی روز، ساعت و محل کلاس با شما تماس می‌گیرد
    </StateCard>
  )
}
