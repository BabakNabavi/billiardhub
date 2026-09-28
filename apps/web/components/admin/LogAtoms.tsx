'use client'

/* اجزای مشترکِ هر دو جدولِ ژورنال.
   جدا شد چون هم `LogTable` و هم `SessionTable` به همه‌شان نیاز دارند و
   قاعده‌ی پروژه کامپوننتِ بالای ~۱۵۰ خط را نمی‌پذیرد. */

import { ShieldAlert } from 'lucide-react'

export interface AuditRow {
  id: string
  actor_id: string | null
  actor_role: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  ip: string | null
  user_agent: string | null
  created_at: string
}

export interface SessionRow {
  id: string
  user_id: string | null
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
  revoked_reason: string | null
  user_agent: string | null
  ip: string | null
  origin: string | null
}

export type FilterKey = 'actor' | 'ip' | 'action'
export type OnFilter = (k: FilterKey, v: string) => void

export const RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7A66A]'

/* ⚠️ `bh-latin` تزئین نیست و حذفش باگ برمی‌گرداند. `layout.tsx` یک
   قاعده‌ی `* { font-family: var(--font-base) !important }` دارد که حتی
   استایلِ اینلاین را هم می‌بلعد، و گلیفِ ارقامِ IRANSansX فارسی است.
   بدونِ این کلاس، IP به شکلِ «۵.۳۴.۲۰۱.۷۷» درمی‌آید — که برای
   کپی‌کردن و جست‌وجو بی‌فایده است. `bh-latin` استثنای رسمیِ همان
   قاعده است و از قبل در پروژه وجود داشت. */
export const LATIN = 'bh-latin'

/** آیا این رشته حرفِ فارسی/عربی دارد؟ */
export const hasPersian = (s: string) => /[؀-ۿ]/.test(s)

/* ⚠️ رنگ این‌جا تزئین نیست: در فهرستی با صدها ردیفِ عادی، چیزی که
   چشم باید فورا پیدا کند رویدادِ امنیتی است. */
const DANGER = /^(LOGIN_FAILED|LOGIN_LOCKED|PAYMENT_AUTHORITY_MISMATCH|PAYMENT_AMOUNT_MISMATCH)$/
export const isDanger = (a: string) => DANGER.test(a)

/** عاملِ کاربر بلند است؛ فقط بخشِ گویا نشان داده می‌شود. */
export function shortUA(ua: string | null): string {
  if (!ua) return '—'
  const os = ua.match(/(iPhone|iPad|Android|Windows|Macintosh|Linux)/i)
  const br = ua.match(/(Chrome|Safari|Firefox|Edg|OPR)\/[\d.]+/i)
  return [os?.[1], br?.[0]].filter(Boolean).join(' · ') || ua.slice(0, 28)
}

export function ActionBadge({ action, onFilter }: { action: string; onFilter: OnFilter }) {
  return (
    <button type="button" onClick={() => onFilter('action', action)}
      className={`${LATIN} inline-flex items-center rounded-[8px] px-2 py-1 text-[11.5px] font-bold transition ${RING} ${
        isDanger(action)
          ? 'bg-[rgba(220,38,38,0.10)] text-[#B91C1C] hover:bg-[rgba(220,38,38,0.18)]'
          : 'bg-[rgba(199,166,106,0.12)] text-[#8F6531] hover:bg-[rgba(199,166,106,0.2)]'
      }`}>
      {isDanger(action) && <ShieldAlert size={12} className="me-1" aria-hidden />}
      {action}
    </button>
  )
}

export function ActorLink({ id, role, names, onFilter }: {
  id: string | null; role?: string | null
  names: Record<string, string>; onFilter: OnFilter
}) {
  if (!id) return <span className="text-[#9A968B]">سیستم</span>
  /* ⚠️ برچسب همیشه نامِ فارسی نیست: `namesFor` وقتی کاربر نام ندارد
     شماره‌اش را برمی‌گرداند و وقتی هیچ‌کدام نباشد تکه‌ی UUID را. آن دو
     باید لاتین بمانند وگرنه `۰۹۱۲…` می‌شوند — غیرقابلِ کپی و جست‌وجو،
     دقیقا همان باگی که `LATIN` برای جلوگیری از آن هست. */
  const label = names[id] ?? id.slice(0, 8)
  const latin = !hasPersian(label)
  return (
    <>
      <button type="button" onClick={() => onFilter('actor', id)}
        className={`font-semibold text-[#1C1B17] underline decoration-dotted underline-offset-4 ${RING} ${latin ? LATIN : ''}`}
        {...(latin ? { dir: 'ltr' as const } : {})}>
        {label}
      </button>
      {role && <span className={`${LATIN} ms-1 text-[11px] text-[#9A968B]`}>({role})</span>}
    </>
  )
}

export function IpLink({ ip, onFilter }: { ip: string | null; onFilter: OnFilter }) {
  if (!ip) return <span className="text-[#9A968B]">—</span>
  return (
    <button type="button" dir="ltr" onClick={() => onFilter('ip', ip)}
      className={`${LATIN} text-[11.5px] text-[#5B564B] underline decoration-dotted underline-offset-4 ${RING}`}>
      {ip}
    </button>
  )
}

/** «phone · 0912****789» — نه دو رشته‌ی چسبیده. */
export function Entity({ type, id }: { type: string | null; id: string | null }) {
  if (!type && !id) return <span className="text-[#9A968B]">—</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      {type && <span className={`${LATIN} text-[11.5px] text-[#5B564B]`}>{type}</span>}
      {type && id && <span className="text-[#D6D0C2]" aria-hidden>·</span>}
      {id && <span dir="ltr" className={`${LATIN} text-[11px] text-[#9A968B]`}>{id.slice(0, 16)}</span>}
    </span>
  )
}

export function Device({ ua }: { ua: string | null }) {
  return <span className={LATIN} title={ua ?? ''}>{shortUA(ua)}</span>
}

export const Cell = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-3 py-2.5 align-top text-[12.5px] ${className}`}>{children}</td>
)

export const Th = ({ children, srLabel, className = '' }: {
  children?: React.ReactNode; srLabel?: string; className?: string
}) => (
  <th scope="col" className={`px-3 py-2 text-start text-[11.5px] font-semibold text-[#6F6A5C] ${className}`}>
    {children}
    {/* ستونِ بی‌عنوان برای صفحه‌خوان یعنی ستونی بی‌نام؛ یک برچسبِ
        پنهان همان را می‌گوید بی‌آنکه چیزی دیده شود. */}
    {srLabel && <span className="sr-only">{srLabel}</span>}
  </th>
)
