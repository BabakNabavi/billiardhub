'use client'

/* ─────────────────────────────────────────────────────────────
   یک ردیف صف تیک آبی — نام، نوع نقش، وضعیت مدرک و دکمه‌ی
   اعطا/برداشتن.

   از `app/admin/verified/page.tsx` جدا شد: آن فایل با فهرست و
   فیلترها از ۱۵۰ خط رد شده بود.

   چیدمان: موبایل سه ردیف (نشان‌ها، نام، دکمه‌ها)؛ از md یک خط.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { ExternalLink, FileText, Loader2, ShieldOff } from 'lucide-react'
import VerifiedBadge from '../VerifiedBadge'

export interface VerifiedRowData {
  key: string
  kindLabel: string
  name: string
  sub: string
  href: string
  verified: boolean
  hasDoc: boolean
  published: boolean
}

const PILL = 'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold'

export default function VerifiedRow({ row, busy, onToggle }: {
  row: VerifiedRowData
  busy: boolean
  onToggle: (next: boolean) => void
}) {
  const locked = busy || !row.published

  return (
    <div className="adm-card flex flex-wrap items-center gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className={`${PILL} border-line/15 bg-line/[.05] text-ink-2`}>{row.kindLabel}</span>
        <span className={`${PILL} ${row.hasDoc
          ? 'border-success/25 bg-success/10 text-success'
          : 'border-line/15 bg-line/[.05] text-ink-2'}`}>
          <FileText size={12} aria-hidden />{row.hasDoc ? 'مدرک دارد' : 'بدون مدرک'}
        </span>
        {!row.published && (
          <span className={`${PILL} border-danger/25 bg-danger/5 text-danger-ink`}>منتشر نشده</span>
        )}
      </div>

      <div className="min-w-0 basis-full md:basis-0 md:flex-1">
        <div className="adm-title text-sm font-semibold text-ink" title={row.name}>
          {row.name}{row.verified && <VerifiedBadge title="تیک آبی دارد" />}
        </div>
        <div className="adm-title mt-1 text-xs text-ink-2" title={row.sub}>{row.sub}</div>
      </div>

      <div className="adm-actions">
        <Link href={row.href} target="_blank" rel="noopener noreferrer"
          className="lq-icon-btn inline-flex size-11 items-center justify-center"
          title="دیدن صفحه‌ی عمومی" aria-label={`دیدن صفحه‌ی عمومی ${row.name}`}>
          <ExternalLink size={15} aria-hidden />
        </Link>

        {row.verified ? (
          <button type="button" className="lq-act h-11 border border-danger/25 bg-danger/5 px-4 text-sm text-danger-ink disabled:opacity-60"
            onClick={() => onToggle(false)} disabled={busy}
            aria-label={`برداشتن تیک آبی از ${row.name}`}
            title="پروفایل در سایت می‌ماند، فقط تیک برداشته می‌شود">
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <ShieldOff size={14} aria-hidden />}
            برداشتن تیک
          </button>
        ) : (
          /* بدون مدرک هم اعطا ممکن است — گاهی ادمین مدرک را بیرون از
             سایت دیده — ولی رنگ کم‌رنگ‌تر یادآوری‌اش می‌کند. */
          <button type="button"
            className={`lq-act h-11 border px-4 text-sm text-[#0095F6] disabled:opacity-45 ${row.hasDoc
              ? 'border-[#0095F6]/30 bg-[#0095F6]/10'
              : 'border-[#0095F6]/15 bg-[#0095F6]/5'}`}
            onClick={() => onToggle(true)} disabled={locked}
            aria-label={`اعطای تیک آبی به ${row.name}`}
            title={row.published
              ? (row.hasDoc ? 'اعطای تیک آبی' : 'مدرکی آپلود نشده — با احتیاط')
              : 'اول باید پروفایل منتشر شود'}>
            {busy
              ? <Loader2 size={14} className="animate-spin" aria-hidden />
              : <VerifiedBadge title="" style={{ marginInlineStart: 0 }} />}
            اعطای تیک
          </button>
        )}
      </div>
    </div>
  )
}
