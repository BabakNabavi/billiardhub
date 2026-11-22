'use client'

/* بخشِ «نقش‌ها» در پنجره‌ی جزئیاتِ کاربر — برداشتن و بازگرداندنِ نقش.
   سرور: /api/admin/users/[id]/roles (پیامدها در lib/roles/revoke).
   دیدن با «مدیریت کاربران»، تغییر فقط با «مدیریت نقش‌ها» (`canManage`). */

import { useCallback, useEffect, useState } from 'react'
import { RotateCcw, ShieldOff } from 'lucide-react'
import { apiFetch } from '@/lib/http'
import { faDate } from '@/lib/jalali'
import { ROLE_MAP, type RoleValue } from '@/lib/roles'
import { isRevocable, ownedRoles } from '@/lib/roles/revoke-logic'
import { buttonClasses } from '@/components/ui/button-classes'
import { RevokeRoleDialog, RestoreRoleDialog } from './RoleActionDialogs'

interface RolesState {
  primaryRole: string
  secondaryRoles: string[]
  locked: { role: string; reason: string; at: string | null }[]
  profiles: { kind: string; status: string }[]
  clubs: { id: string; name: string; isActive: boolean; verificationStatus: string }[]
  canManage: boolean
}

const label = (r: string) => (r === 'admin' ? 'ادمین' : ROLE_MAP[r as RoleValue]?.label ?? r)
const PROFILE_STATUS: Record<string, string> = { approved: 'منتشرشده', pending: 'در انتظار بررسی', rejected: 'پنهان' }

export function UserRolesSection({ userId, onChanged }: {
  userId: string
  onChanged: (roles: { primaryRole: string; secondaryRoles: string[] }) => void
}) {
  const [st, setSt] = useState<RolesState | null>(null)
  const [err, setErr] = useState('')
  const [revoking, setRevoking] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [done, setDone] = useState('')

  const load = useCallback(async () => {
    setErr('')
    try {
      const r = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}/roles`, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message ?? 'خواندن نقش‌ها انجام نشد'); return }
      setSt(j as RolesState)
    } catch { setErr('خطا در ارتباط با سرور') }
  }, [userId])

  useEffect(() => { void load() }, [load])

  const applied = (j: { primaryRole: string; secondaryRoles: string[]; effects?: string[] }, msg: string) => {
    setRevoking(null); setRestoring(null)
    setDone([msg, ...(j.effects ?? [])].join('، '))
    onChanged({ primaryRole: j.primaryRole, secondaryRoles: j.secondaryRoles })
    void load()
  }

  const roles = st ? ownedRoles(st) : []
  /* نقشی که هم قفل است و هم هنوز در ستون (برداشتنِ نیمه‌کاره) بالاتر با دکمه‌ی برداشتن می‌آید */
  const lockedOnly = st?.locked.filter(l => !roles.includes(l.role)) ?? []

  return (
    <section className="mb-4" aria-labelledby="ud-roles-title">
      <h3 id="ud-roles-title" className="mb-1 text-xs font-black text-gold-text">نقش‌ها</h3>

      {err && (
        <div role="alert" className="flex items-center gap-2 py-2 text-xs font-bold text-danger">
          {err}
          <button type="button" onClick={() => void load()} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>تلاش دوباره</button>
        </div>
      )}
      {!st && !err && (
        <div className="flex flex-col gap-2 py-2" aria-busy="true">
          <div className="h-4 w-1/2 animate-pulse rounded-chip bg-line/10" />
          <div className="h-4 w-1/3 animate-pulse rounded-chip bg-line/10" />
        </div>
      )}

      {st && (
        <>
          {roles.length === 0 && <p className="py-2 text-xs text-ink-2">نقش تخصصی ندارد</p>}
          <ul className="flex flex-col">
            {roles.map(r => {
              const prof = st.profiles.find(p => p.kind === r)
              /* همان قاعده‌ی مانعِ سرور: هر باشگاهِ تأییدشده، فعال یا غیرفعال (lib/roles/revoke) */
              const liveClubs = r === 'club_owner'
                ? st.clubs.filter(c => c.verificationStatus === 'verified' || c.verificationStatus === 'approved').length : 0
              return (
                <li key={r} className="flex flex-wrap items-center gap-2 border-b border-line/10 py-2">
                  <span className="text-xs font-bold text-ink">{label(r)}</span>
                  {r === st.primaryRole && <span className="rounded-full bg-gold/[.14] px-2 text-xs font-bold text-gold-text">اصلی</span>}
                  {prof && <span className="text-xs text-ink-2">پروفایل {PROFILE_STATUS[prof.status] ?? prof.status}</span>}
                  {liveClubs > 0 && (
                    <span className="text-xs text-ink-2">
                      {liveClubs.toLocaleString('fa-IR')} باشگاه تأییدشده — برای برداشتن، اول باشگاه را رد کنید
                    </span>
                  )}
                  {st.canManage && isRevocable(r) && (
                    <button type="button" onClick={() => { setDone(''); setRevoking(r) }}
                      aria-label={`برداشتن نقش ${label(r)}`}
                      className={`${buttonClasses({ variant: 'danger-ghost', size: 'sm' })} ms-auto`}>
                      <ShieldOff size={14} aria-hidden /> برداشتن نقش
                    </button>
                  )}
                </li>
              )
            })}
          </ul>

          {lockedOnly.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-xs font-bold text-ink-2">برداشته‌شده توسط مدیریت</div>
              <ul className="flex flex-col">
                {lockedOnly.map(l => (
                  <li key={l.role} className="flex flex-wrap items-center gap-2 border-b border-line/10 py-2">
                    <span className="text-xs font-bold text-ink">{label(l.role)}</span>
                    {l.at && <span className="text-xs text-ink-2">{faDate(l.at)}</span>}
                    {l.reason && <span className="basis-full text-xs text-ink-2">دلیل: {l.reason}</span>}
                    {st.canManage && (
                      <button type="button" onClick={() => { setDone(''); setRestoring(l.role) }}
                        aria-label={`بازگرداندن نقش ${label(l.role)}`}
                        className={`${buttonClasses({ variant: 'secondary', size: 'sm' })} ms-auto`}>
                        <RotateCcw size={14} aria-hidden /> بازگرداندن
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!st.canManage && (roles.some(isRevocable) || lockedOnly.length > 0) && (
            <p className="pt-2 text-xs text-ink-2">برای برداشتن یا بازگرداندن نقش، دسترسی «مدیریت نقش‌ها» لازم است</p>
          )}
          {done && <p role="status" className="pt-2 text-xs font-bold text-success">{done}</p>}
        </>
      )}

      {revoking && (
        <RevokeRoleDialog userId={userId} role={revoking} roleLabel={label(revoking)}
          onCancel={() => setRevoking(null)} onDone={j => applied(j, `نقش «${label(revoking)}» برداشته شد`)} />
      )}
      {restoring && (
        <RestoreRoleDialog userId={userId} role={restoring} roleLabel={label(restoring)}
          onCancel={() => setRestoring(null)} onDone={j => applied(j, `نقش «${label(restoring)}» بازگردانده شد`)} />
      )}
    </section>
  )
}
