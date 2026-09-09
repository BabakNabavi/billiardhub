'use client'

/* ─────────────────────────────────────────────────────────────
   یک ردیف صف تیک آبی — نام، نوع نقش، وضعیت مدرک و دکمه‌ی
   اعطا/برداشتن.

   از `app/admin/verified/page.tsx` جدا شد: آن فایل با فهرست و
   فیلترها از ۱۵۰ خط رد شده بود.
   ───────────────────────────────────────────────────────────── */

import Link from 'next/link'
import { ExternalLink, FileText, Loader2, ShieldOff } from 'lucide-react'
import VerifiedBadge from '../VerifiedBadge'

const SEC = '#5B564B'
const MUT = '#6F6A5C'
const LINE = '#E7E2D6'
const BLUE = '#0095F6'

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

export default function VerifiedRow({ row, busy, onToggle }: {
  row: VerifiedRowData
  busy: boolean
  onToggle: (next: boolean) => void
}) {
  const locked = busy || !row.published

  return (
    <div style={{
      background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14,
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <span style={{
        fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: '3px 10px', flexShrink: 0,
        color: SEC, background: 'rgba(17,17,16,0.04)', border: `1px solid ${LINE}`,
      }}>{row.kindLabel}</span>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.name}{row.verified && <VerifiedBadge title="تیک آبی دارد" />}
        </div>
        <div style={{ fontSize: 11.5, color: MUT, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.sub}
        </div>
      </div>

      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
        fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '3px 10px',
        color: row.hasDoc ? '#0E7A38' : MUT,
        background: row.hasDoc ? 'rgba(14,122,56,0.08)' : 'rgba(17,17,16,0.04)',
        border: `1px solid ${row.hasDoc ? 'rgba(14,122,56,0.22)' : LINE}`,
      }}>
        <FileText size={11} />{row.hasDoc ? 'مدرک دارد' : 'بدون مدرک'}
      </span>

      {!row.published && (
        <span style={{
          fontSize: 11, fontWeight: 800, color: '#B23B2E', flexShrink: 0,
          background: 'rgba(178,59,46,0.07)', border: '1px solid rgba(178,59,46,0.22)',
          borderRadius: 999, padding: '3px 10px',
        }}>منتشر نشده</span>
      )}

      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        <Link href={row.href} target="_blank" rel="noopener noreferrer"
          className="lq-icon-btn"
          title="دیدن صفحه‌ی عمومی" aria-label={`دیدن صفحه‌ی عمومی ${row.name}`}>
          <ExternalLink size={15} />
        </Link>

        {row.verified ? (
          <button type="button" className="lq-act"
            onClick={() => onToggle(false)} disabled={busy}
            aria-label={`برداشتن تیک آبی از ${row.name}`}
            title="پروفایل در سایت می‌ماند، فقط تیک برداشته می‌شود"
            style={{
              height: 34, padding: '0 14px', fontSize: 12.5,
              border: '1px solid rgba(178,59,46,0.24)', background: 'rgba(178,59,46,0.06)',
              color: '#B23B2E', opacity: busy ? 0.6 : 1,
            }}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <ShieldOff size={14} />}
            برداشتن تیک
          </button>
        ) : (
          /* بدون مدرک هم اعطا ممکن است — گاهی ادمین مدرک را بیرون از
             سایت دیده — ولی رنگ کم‌رنگ‌تر یادآوری‌اش می‌کند. */
          <button type="button" className="lq-act"
            onClick={() => onToggle(true)} disabled={locked}
            aria-label={`اعطای تیک آبی به ${row.name}`}
            title={row.published
              ? (row.hasDoc ? 'اعطای تیک آبی' : 'مدرکی آپلود نشده — با احتیاط')
              : 'اول باید پروفایل منتشر شود'}
            style={{
              height: 34, padding: '0 14px', fontSize: 12.5,
              border: `1px solid rgba(0,149,246,${row.hasDoc ? '0.30' : '0.16'})`,
              background: `rgba(0,149,246,${row.hasDoc ? '0.10' : '0.05'})`,
              color: BLUE, opacity: locked ? 0.45 : 1,
            }}>
            {busy
              ? <Loader2 size={13} className="animate-spin" />
              : <VerifiedBadge title="" style={{ marginInlineStart: 0 }} />}
            اعطای تیک
          </button>
        )}
      </div>
    </div>
  )
}
