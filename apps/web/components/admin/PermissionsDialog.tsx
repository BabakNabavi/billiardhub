'use client'

/* پنجره‌ی دسترسی‌های یک ادمین.

   هر تیک دقیقا یک صفحه‌ی پنل است — نه یک دسته‌بندی انتزاعی که
   بعدا باید حدس زد کدام صفحه را می‌گیرد. گروه‌ها فقط برای پیداکردن
   سریع‌اند و هرکدام یک کلید «همه» دارند.

   ⚠️ «دسترسی ادمین» عمدا در فهرست نیست: دادن دسترسی به دیگران کار
   سوپرادمین است. اگر تیک‌کردنی بود، اولین ادمینی که آن را می‌گرفت
   می‌توانست خودش را سوپر کند یا مالک را بیرون بیندازد.

   پوسته: `.adm-modal-backdrop` + `.adm-sheet` (موبایل برگه‌ی پایین). */

import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/http'
import { X, ShieldCheck, Check } from 'lucide-react'
import { Button } from '../ui/Button'

export interface PermGroup { key: string; label: string; items: { key: string; label: string; hint?: string }[] }

export default function PermissionsDialog({
  user, groups, onClose, onSaved,
}: {
  user: { id: string; name: string; phone: string; permissions: string[] }
  groups: PermGroup[]
  onClose: () => void
  onSaved: (keys: string[]) => void
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(user.permissions))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  /* Esc می‌بندد و بدنه قفل می‌شود — وگرنه پشت پنجره اسکرول می‌خورد */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const flip = (k: string) => setSel(s => {
    const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n
  })
  const groupAll = (g: PermGroup, on: boolean) => setSel(s => {
    const n = new Set(s)
    for (const i of g.items) on ? n.add(i.key) : n.delete(i.key)
    return n
  })

  const save = async () => {
    setBusy(true); setErr('')
    try {
      const r = await apiFetch('/api/admin/permissions', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, permissions: [...sel] }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message ?? 'ذخیره نشد'); return }
      onSaved([...sel]); onClose()
    } catch { setErr('خطا در ارتباط با سرور') }
    finally { setBusy(false) }
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0)

  return (
    <div onClick={onClose} className="adm-modal-backdrop">
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="perm-title"
        className="adm-sheet">
        {/* سربرگ */}
        <div className="flex items-start gap-3 border-b border-line/10 p-4">
          <ShieldCheck size={18} className="mt-1 shrink-0 text-gold-text" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 id="perm-title" className="adm-break m-0 text-base font-semibold text-ink">دسترسی‌های {user.name}</h2>
            <div className="bh-latin mt-1 text-xs text-ink-2">{user.phone}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="بستن"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-field border border-line/10 bg-line/[.05] text-ink-2 hover:bg-line/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
            <X size={16} aria-hidden />
          </button>
        </div>

        {/* بدنه */}
        <div className="overflow-y-auto overscroll-contain px-4 pb-4">
          <p className="my-4 text-sm leading-loose text-ink-2">
            فقط بخش‌هایی که تیک بخورند برای این ادمین باز می‌شوند، بقیه‌ی صفحه‌ها نه در پنل
            دیده می‌شوند و نه از راه آدرس مستقیم باز می‌شوند
            <br />
            <b className="text-ink">«دسترسی ادمین» در این فهرست نیست</b> — دادن دسترسی به دیگران
            فقط کار شماست و قابل واگذاری نیست
          </p>

          {groups.map(g => {
            const on = g.items.filter(i => sel.has(i.key)).length
            const allOn = on === g.items.length
            return (
              <fieldset key={g.key} className="m-0 mb-4 min-w-0 border-0 p-0">
                <legend className="sr-only">{g.label}</legend>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{g.label}</span>
                  <span className="text-xs text-ink-2">{on}/{g.items.length}</span>
                  <button type="button" onClick={() => groupAll(g, !allOn)}
                    className="ms-auto inline-flex h-11 items-center rounded-field border border-line/10 bg-paper px-3 text-xs font-semibold text-ink-2 hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
                    {allOn ? 'برداشتن همه' : 'انتخاب همه'}
                  </button>
                </div>
                <div className="grid gap-2">
                  {g.items.map(i => {
                    const checked = sel.has(i.key)
                    return (
                      <label key={i.key}
                        className={`relative flex min-h-11 cursor-pointer items-start gap-2 rounded-card border p-3 focus-within:ring-2 focus-within:ring-gold-deep ${checked ? 'border-gold/40 bg-gold/10' : 'border-line/10 bg-surface'}`}>
                        <input type="checkbox" checked={checked} onChange={() => flip(i.key)}
                          className="peer absolute size-0 opacity-0" />
                        <span aria-hidden
                          className={`mt-1 inline-flex size-4 shrink-0 items-center justify-center rounded-chip border text-white ${checked ? 'border-gold-deep bg-gold-deep' : 'border-line/30 bg-surface'}`}>
                          {checked && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink">{i.label}</span>
                          {i.hint && <span className="mt-1 block text-xs leading-loose text-ink-2">{i.hint}</span>}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            )
          })}
        </div>

        {/* پانویس */}
        <div className="flex flex-wrap items-center gap-3 border-t border-line/10 p-4">
          <span className="text-xs font-semibold text-ink-2">{sel.size} از {total} بخش</span>
          {err && <span role="alert" className="text-xs font-semibold text-danger-ink">{err}</span>}
          <div className="adm-actions ms-auto">
            <Button size="sm" variant="secondary" onClick={onClose}>انصراف</Button>
            <Button size="sm" variant="primary" loading={busy} onClick={() => void save()}>ذخیره</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
