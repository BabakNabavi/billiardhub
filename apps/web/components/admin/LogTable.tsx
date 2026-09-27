'use client'

/* تبِ «رویدادها» — جدول روی دسکتاپ، کارت روی موبایل.
   ⚠️ دو نسخه‌ی markup عمدی است. نسخه‌ی اول فقط یک جدولِ هفت‌ستونه با
   `overflow-x-auto` بود و روی ۳۷۵ پیکسل فاجعه شد: ارتفاعِ هر ردیف را
   ستون‌های *بیرونِ کادر* تعیین می‌کردند، پس ردیف‌ها بی‌دلیل بلند
   می‌شدند و نشانِ رویداد از لبه بیرون می‌زد. */

import { Fragment, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { faDateTime } from '../../lib/jalali'
import { apiFetch } from '../../lib/http'
import {
  ActionBadge, ActorLink, IpLink, Entity, Device, Cell, Th, RING, LATIN,
  type AuditRow, type OnFilter,
} from './LogAtoms'

export type { AuditRow, SessionRow } from './LogAtoms'

/* ⚠️ بیرونِ کامپوننتِ والد تعریف شده‌اند، نه داخلش. تعریفِ داخلی در هر
   رندر یک تابعِ *تازه* می‌سازد و React نوعِ المان را با هویت مقایسه
   می‌کند — یعنی با هر باز/بسته‌شدن، دکمه unmount و دوباره mount
   می‌شد و **فوکوسِ کیبورد می‌پرید**. */
function Detail({ text }: { text: string | undefined }) {
  return (
    <pre dir="ltr" className={`${LATIN} max-h-64 overflow-auto rounded-[10px] bg-[#1C1B17] p-3 text-[11px] leading-5 text-[#E7E2D6]`}>
      {text ?? '…'}
    </pre>
  )
}

function Toggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      aria-label={open ? 'بستن جزئیات' : 'نمایش جزئیات'} aria-expanded={open}
      className={`rounded-[8px] p-1 text-[#6F6A5C] transition hover:bg-[#F0ECE2] ${RING}`}>
      <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
    </button>
  )
}

export function AuditTable({ rows, names, onFilter }: {
  rows: AuditRow[]
  names: Record<string, string>
  onFilter: OnFilter
}) {
  const [open, setOpen] = useState<string | null>(null)
  const [detail, setDetail] = useState<Record<string, string>>({})

  /* مقدارِ قبل/بعد در فهرست نمی‌آید (jsonbِ آزاد، گاهی ده‌ها کیلوبایت)،
     پس فقط برای ردیفی که باز می‌شود گرفته می‌شود. */
  const toggle = async (id: string) => {
    if (open === id) { setOpen(null); return }
    setOpen(id)
    if (detail[id] !== undefined) return
    try {
      const r = await apiFetch(`/api/admin/logs?detail=${encodeURIComponent(id)}`, { cache: 'no-store' })
      if (!r.ok) return
      const j = await r.json()
      setDetail(d => ({ ...d, [id]: JSON.stringify(j.detail ?? {}, null, 2) }))
    } catch { /* جزئیات نیامد؛ خودِ ردیف همچنان هست */ }
  }

  return (
    <>
      {/* ── موبایل ── */}
      <ul className="divide-y divide-[#F0ECE2] sm:hidden">
        {rows.map(r => (
          <li key={r.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <ActionBadge action={r.action} onFilter={onFilter} />
              <Toggle open={open === r.id} onClick={() => void toggle(r.id)} />
            </div>
            <p className="mt-2 text-[12px] text-[#6F6A5C]">{faDateTime(r.created_at)}</p>
            <p className="mt-1 text-[12.5px]">
              <ActorLink id={r.actor_id} role={r.actor_role} names={names} onFilter={onFilter} />
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#6F6A5C]">
              <Entity type={r.entity_type} id={r.entity_id} />
              <IpLink ip={r.ip} onFilter={onFilter} />
              <Device ua={r.user_agent} />
            </div>
            {open === r.id && <div className="mt-2"><Detail text={detail[r.id]} /></div>}
          </li>
        ))}
      </ul>

      {/* ── دسکتاپ ──
          ⚠️ `hidden sm:block` روی این *div* است، نه روی `<table>`.
          `admin/layout.tsx` قاعده‌ی `.admin-scope table{display:block}`
          را در دو مدیاکوئری دارد و specificityِ آن (۰,۱,۱) از `.hidden`
          تیلویند (۰,۱,۰) بیشتر است — پس جدول زیرِ ۷۰۰px پنهان
          **نمی‌شد** و هر ردیف کنارِ کارتِ موبایل دوبار رندر می‌شد. */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#E7E2D6]">
              <Th>زمان</Th><Th>رویداد</Th><Th>بازیگر</Th>
              <Th>موجودیت</Th><Th>IP</Th><Th>دستگاه</Th>
              <Th className="w-10" srLabel="جزئیات" />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <Fragment key={r.id}>
                <tr className="border-b border-[#F0ECE2] hover:bg-[#FBFAF7]">
                  <Cell className="whitespace-nowrap text-[#6F6A5C]">{faDateTime(r.created_at)}</Cell>
                  <Cell><ActionBadge action={r.action} onFilter={onFilter} /></Cell>
                  <Cell><ActorLink id={r.actor_id} role={r.actor_role} names={names} onFilter={onFilter} /></Cell>
                  <Cell><Entity type={r.entity_type} id={r.entity_id} /></Cell>
                  <Cell><IpLink ip={r.ip} onFilter={onFilter} /></Cell>
                  <Cell className="text-[11.5px] text-[#6F6A5C]"><Device ua={r.user_agent} /></Cell>
                  <Cell><Toggle open={open === r.id} onClick={() => void toggle(r.id)} /></Cell>
                </tr>
                {open === r.id && (
                  <tr className="border-b border-[#F0ECE2] bg-[#FBFAF7]">
                    <td colSpan={7} className="px-3 pb-3"><Detail text={detail[r.id]} /></td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
