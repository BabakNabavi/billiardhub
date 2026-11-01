'use client'

/* ─────────────────────────────────────────────────────────────
   فهرستِ کانال‌های زنده (سرویسِ پخش) — صفحه‌ی «پخش زنده»، صفحه‌ی
   باشگاه و صفحه‌ی مسابقه از همین استفاده می‌کنند.

   هیچ‌چیز زنده نیست ⟵ هیچ‌چیز رندر نمی‌شود (`hideEmpty`) یا یک خطِ
   آرام؛ این بخش نباید صفحه‌ی میزبان را شلوغ کند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, RadioTower } from 'lucide-react'
import { faNum } from '@/lib/jalali'
import { KIND_LABEL } from '@/lib/streaming/policy'
import type { PublicChannel } from '@/lib/streaming/public-types'

const REFRESH_MS = 30_000

export function LiveChannelsGrid({ clubId, tournamentId, hideEmpty = false, heading, onCount }: {
  clubId?: string; tournamentId?: string; hideEmpty?: boolean; heading?: string
  /** شمارِ کانال‌های زنده — تا صفحه‌ی میزبان «پخشی نیست» را به‌اشتباه نگوید */
  onCount?: (n: number) => void
}) {
  const [rows, setRows] = useState<PublicChannel[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    const q = new URLSearchParams()
    if (clubId) q.set('clubId', clubId)
    if (tournamentId) q.set('tournamentId', tournamentId)
    const load = async () => {
      try {
        const r = await fetch(`/api/streams?${q}`, { cache: 'no-store' })
        if (!r.ok) throw new Error(String(r.status))
        const j = await r.json() as { channels?: PublicChannel[] }
        if (alive) { setRows(j.channels ?? []); setFailed(false); onCount?.((j.channels ?? []).length) }
      } catch { if (alive) setFailed(true) }
    }
    void load()
    const iv = window.setInterval(() => { if (document.visibilityState === 'visible') void load() }, REFRESH_MS)
    return () => { alive = false; window.clearInterval(iv) }
  }, [clubId, tournamentId, onCount])

  if (rows === null && !failed) {
    return hideEmpty ? null : <div className="h-24 animate-pulse rounded-card bg-ink/[.05]" aria-label="در حال بارگذاری" />
  }
  if (failed && !rows) return hideEmpty ? null : <p className="text-sub text-ink-3">فهرست پخش‌ها فعلا در دسترس نیست</p>
  if (!rows || rows.length === 0) return hideEmpty ? null : <p className="text-sub text-ink-3">الان هیچ کانالی پخش زنده ندارد</p>

  return (
    <section className="flex flex-col gap-3" aria-label={heading ?? 'کانال‌های زنده'}>
      {heading && <h2 className="text-section text-ink">{heading}</h2>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(c => (
          <li key={c.id}>
            <Link
              href={`/live/c/${c.id}`}
              className="flex min-h-11 flex-col gap-2 rounded-card border border-line/10 bg-surface p-4 shadow-e0 transition-[border-color,transform] hover:-translate-y-px hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep motion-reduce:hover:translate-y-0"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-chip bg-danger/10 px-2 py-1 text-meta font-bold text-danger">
                  <RadioTower className="h-3 w-3" aria-hidden /> زنده
                </span>
                <span className="inline-flex items-center gap-1 text-meta text-ink-3">
                  <Eye className="h-3 w-3" aria-hidden /> {faNum(c.viewers)}
                </span>
              </span>
              <span className="truncate text-sub font-bold text-ink">{c.title}</span>
              <span className="truncate text-meta text-ink-3">
                {c.club.name} · {KIND_LABEL[c.kind]}{c.tableLabel ? ` — ${c.tableLabel}` : ''}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
