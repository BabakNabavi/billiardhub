'use client'

/* «نقش‌های من» در /profile/role — دیدن، رفتن به پنل و حذفِ هر نقش.

   پیش‌تر فقط یک «×» کوچک کنارِ نقش‌های فرعی بود، بی پنجره‌ی تأیید، و نقشِ
   اصلی اصلا حذف‌شدنی نبود؛ مالک هم آن را پیدا نکرد. حذف سمتِ سرور در
   lib/roles/revoke است: پروفایلِ عمومی هم برداشته می‌شود. */

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/http'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { buttonClasses } from '@/components/ui/button-classes'
import { ROLE_MAP, rolePanelPath, type RoleValue } from '@/lib/roles'
import { requestStatusLabel, revokeConsequences } from '@/lib/roles/revoke-logic'

export interface MyRoleRequest { role: string; status: string; rejection_note?: string | null }
export interface LockedRole { role: string; reason: string }
type Roles = { primaryRole: string; secondaryRoles: string[] }

const label = (r: string) => ROLE_MAP[r as RoleValue]?.label ?? r

export function MyRolesManager({ roles, primaryRole, requests, locked, onChanged, notify }: {
  roles: string[]
  primaryRole?: string
  requests: MyRoleRequest[]
  locked: LockedRole[]
  onChanged: (r: Roles) => void
  notify: (msg: string) => void
}) {
  const [target, setTarget] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    if (!target) return
    setBusy(true)
    try {
      const res = await apiFetch('/api/roles/my?role=' + encodeURIComponent(target), { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { notify(j?.message ?? 'حذف نقش انجام نشد'); return }
      onChanged({ primaryRole: j.primaryRole, secondaryRoles: j.secondaryRoles })
      notify(`نقش «${label(target)}» حذف شد`)
      setTarget(null)
    } catch { notify('خطا در ارتباط با سرور') } finally { setBusy(false) }
  }

  const visible = roles.filter(r => r !== 'admin')
  if (visible.length === 0 && locked.length === 0) return null

  return (
    <section aria-labelledby="my-roles-title" className="mb-4 rounded-panel border border-line/10 bg-surface p-4 shadow-e0">
      <h2 id="my-roles-title" className="mb-1 text-sm font-bold text-ink">نقش‌های فعال شما</h2>
      <p className="mb-3 text-xs text-ink-2">هر نقشی را که دیگر نمی‌خواهید از همین‌جا حذف کنید</p>

      <ul className="flex flex-col">
        {visible.map(r => {
          const req = requests.find(x => x.role === r)
          return (
            <li key={r} className="flex flex-wrap items-center gap-2 border-b border-line/10 py-2 last:border-0">
              <span className="text-sm font-bold text-ink">{label(r)}</span>
              {r === primaryRole && <span className="rounded-full bg-gold/[.14] px-2 text-xs font-bold text-gold-text">اصلی</span>}
              {req && req.status !== 'rejected' && (
                <span className="text-xs text-ink-2">{requestStatusLabel(req.status, req.rejection_note)}</span>
              )}
              <span className="ms-auto flex items-center gap-1">
                <Link href={rolePanelPath(r as RoleValue)} aria-label={`پنل ${label(r)}`}
                  className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                  پنل <ArrowLeft size={14} aria-hidden />
                </Link>
                <button type="button" onClick={() => setTarget(r)} aria-label={`حذف نقش ${label(r)}`}
                  className={buttonClasses({ variant: 'danger-ghost', size: 'sm' })}>
                  <Trash2 size={14} aria-hidden /> حذف نقش
                </button>
              </span>
            </li>
          )
        })}
      </ul>

      {locked.length > 0 && (
        <div className="mt-3 rounded-card bg-danger/[.06] p-3">
          <div className="mb-1 text-xs font-bold text-danger">برداشته‌شده توسط مدیریت سایت</div>
          <ul className="flex flex-col gap-1">
            {locked.map(l => (
              <li key={l.role} className="text-xs leading-loose text-ink-2">
                <span className="font-bold text-ink">{label(l.role)}</span>
                {l.reason ? ` — ${l.reason}` : ''}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-ink-2">برای بررسی دوباره از بخش پشتیبانی پیگیری کنید</p>
        </div>
      )}

      <ConfirmDialog open={!!target} busy={busy} title={target ? `حذف نقش «${label(target)}»` : ''}
        confirmLabel="حذف نقش" onCancel={() => setTarget(null)} onConfirm={() => void remove()}
        body={target ? (
          <ul className="flex list-disc flex-col gap-1 ps-4 text-start text-xs leading-loose">
            {revokeConsequences(target, 'self').map(t => <li key={t}>{t}</li>)}
          </ul>
        ) : null} />
    </section>
  )
}
