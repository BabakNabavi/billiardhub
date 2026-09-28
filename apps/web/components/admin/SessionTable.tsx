'use client'

/* تبِ «نشست‌ها» — یعنی تاریخچه‌ی ورودِ موفق و خروج.
   این جدول چیزی را نشان می‌دهد که `audit_logs` ندارد: `sessions` از
   مهاجرتِ ۰۰۵ هر ورود را با ip/user_agent/origin ثبت می‌کند و
   `revokeSession` به‌جای حذف، `revoked_at`/`revoked_reason` می‌گذارد.
   پس خروج هم این‌جاست — و تا پیش از این صفحه هیچ‌کس نمی‌دیدش. */

import { Globe, Monitor } from 'lucide-react'
import { faDateTime } from '../../lib/jalali'
import {
  ActorLink, IpLink, Device, Cell, Th,
  type SessionRow, type OnFilter,
} from './LogAtoms'

function Status({ row }: { row: SessionRow }) {
  return row.revoked_at
    ? (
      <span className="rounded-[8px] bg-[#F0ECE2] px-2 py-1 text-[11.5px] text-[#6F6A5C]"
        title={row.revoked_reason ?? ''}>پایان‌یافته</span>
    )
    : (
      <span className="rounded-[8px] bg-[rgba(19,138,75,0.12)] px-2 py-1 text-[11.5px] font-bold text-[#128A4B]">فعال</span>
    )
}

/* ⚠️ «فعال» به‌تنهایی گمراه‌کننده است: نشستی که سه هفته دست‌نخورده
   مانده هم تا انقضا «فعال» است. آخرین استفاده همان چیزی است که
   «فعال» را از «فعال و همین حالا در حالِ استفاده» جدا می‌کند. */
function LastUsed({ at }: { at: string | null }) {
  if (!at) return <span className="text-[#9A968B]">—</span>
  return <span className="text-[#6F6A5C]">{faDateTime(at)}</span>
}

export function SessionTable({ rows, names, onFilter }: {
  rows: SessionRow[]
  names: Record<string, string>
  onFilter: OnFilter
}) {
  return (
    <>
      {/* ── موبایل ── */}
      <ul className="divide-y divide-[#F0ECE2] sm:hidden">
        {rows.map(r => (
          <li key={r.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12.5px] font-semibold">
                <ActorLink id={r.user_id} names={names} onFilter={onFilter} />
              </span>
              <Status row={r} />
            </div>
            <p className="mt-2 text-[12px] text-[#6F6A5C]">{faDateTime(r.created_at)}</p>
            <p className="mt-1 text-[11.5px] text-[#9A968B]">
              آخرین استفاده: <LastUsed at={r.last_used_at} />
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#6F6A5C]">
              <span className="inline-flex items-center gap-1">
                <Globe size={12} className="text-[#9A968B]" aria-hidden />{r.origin ?? '—'}
              </span>
              <IpLink ip={r.ip} onFilter={onFilter} />
              <span className="inline-flex items-center gap-1">
                <Monitor size={12} className="text-[#9A968B]" aria-hidden /><Device ua={r.user_agent} />
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* ── دسکتاپ ── همان دلیلِ `LogTable`: کلاس روی div است نه table */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#E7E2D6]">
              <Th>ورود</Th><Th>کاربر</Th><Th>آخرین استفاده</Th>
              <Th>از کجا</Th><Th>IP</Th><Th>دستگاه</Th><Th>وضعیت</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-[#F0ECE2] hover:bg-[#FBFAF7]">
                <Cell className="whitespace-nowrap text-[#6F6A5C]">{faDateTime(r.created_at)}</Cell>
                <Cell><ActorLink id={r.user_id} names={names} onFilter={onFilter} /></Cell>
                <Cell className="whitespace-nowrap"><LastUsed at={r.last_used_at} /></Cell>
                <Cell className="text-[#5B564B]">
                  <Globe size={12} className="me-1 inline text-[#9A968B]" aria-hidden />{r.origin ?? '—'}
                </Cell>
                <Cell><IpLink ip={r.ip} onFilter={onFilter} /></Cell>
                <Cell className="text-[11.5px] text-[#6F6A5C]">
                  <Monitor size={12} className="me-1 inline text-[#9A968B]" aria-hidden /><Device ua={r.user_agent} />
                </Cell>
                <Cell><Status row={r} /></Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
