'use client'

/* پنجره‌های تأییدِ برداشتن و بازگرداندنِ نقش از سوی ادمین.
   دلیلِ برداشتن اجباری است: در تاریخچه‌ی نقشِ کاربر می‌نشیند و به خودش نشان داده می‌شود. */

import { useState } from 'react'
import { apiFetch } from '@/lib/http'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { revokeConsequences } from '@/lib/roles/revoke-logic'

type Done = { primaryRole: string; secondaryRoles: string[]; effects?: string[] }

async function post(userId: string, body: Record<string, string>): Promise<{ ok: true; j: Done } | { ok: false; message: string }> {
  try {
    const r = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}/roles`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    })
    const j = await r.json().catch(() => ({}))
    return r.ok ? { ok: true, j: j as Done } : { ok: false, message: j?.message ?? 'انجام نشد' }
  } catch { return { ok: false, message: 'خطا در ارتباط با سرور' } }
}

export function RevokeRoleDialog({ userId, role, roleLabel, onCancel, onDone }: {
  userId: string; role: string; roleLabel: string; onCancel: () => void; onDone: (j: Done) => void
}) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const confirm = async () => {
    if (reason.trim().length < 5) { setErr('دلیل را دست‌کم در چند کلمه بنویسید'); return }
    setBusy(true); setErr('')
    const res = await post(userId, { action: 'revoke', role, reason: reason.trim() })
    setBusy(false)
    if (res.ok) onDone(res.j); else setErr(res.message)
  }

  return (
    <ConfirmDialog open busy={busy} title={`برداشتن نقش «${roleLabel}»`} confirmLabel="برداشتن نقش"
      onCancel={onCancel} onConfirm={() => void confirm()}
      body={
        <div className="flex flex-col gap-3 text-start">
          <ul className="flex list-disc flex-col gap-1 ps-4 text-xs leading-loose text-ink-2">
            {revokeConsequences(role, 'admin').map(t => <li key={t}>{t}</li>)}
          </ul>
          <label className="flex flex-col gap-1 text-xs font-bold text-ink">
            دلیل برداشتن — به کاربر نشان داده می‌شود
            <textarea value={reason} onChange={e => { setReason(e.target.value); if (err) setErr('') }} rows={3} maxLength={400}
              disabled={busy}
              className="w-full resize-y rounded-field border border-line/20 bg-surface p-2 text-sm font-normal text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep disabled:opacity-60" />
          </label>
          {err && <p role="alert" className="text-xs font-bold text-danger">{err}</p>}
        </div>
      } />
  )
}

export function RestoreRoleDialog({ userId, role, roleLabel, onCancel, onDone }: {
  userId: string; role: string; roleLabel: string; onCancel: () => void; onDone: (j: Done) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const confirm = async () => {
    setBusy(true); setErr('')
    const res = await post(userId, { action: 'restore', role })
    setBusy(false)
    if (res.ok) onDone(res.j); else setErr(res.message)
  }

  return (
    <ConfirmDialog open busy={busy} tone="gold" title={`بازگرداندن نقش «${roleLabel}»`} confirmLabel="بازگرداندن"
      onCancel={onCancel} onConfirm={() => void confirm()}
      body={
        <div className="flex flex-col gap-2 text-start text-xs leading-loose text-ink-2">
          <p>نقش به کاربر برمی‌گردد و اگر پروفایلی داشت، برای انتشار دوباره به صف بررسی می‌رود</p>
          <p>باشگاه ردشده و نشان فروشگاه آگهی‌ها خودکار برنمی‌گردند و هرکدام از بخش خودش تأیید می‌شود</p>
          {err && <p role="alert" className="font-bold text-danger">{err}</p>}
        </div>
      } />
  )
}
