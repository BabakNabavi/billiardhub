'use client'

/* پنجره‌ی دسترسی‌های یک ادمین.

   هر تیک دقیقاً یک صفحه‌ی پنل است — نه یک دسته‌بندیِ انتزاعی که
   بعداً باید حدس زد کدام صفحه را می‌گیرد. گروه‌ها فقط برای پیداکردنِ
   سریع‌اند و هرکدام یک کلیدِ «همه» دارند.

   ⚠️ «دسترسی ادمین» عمداً در فهرست نیست: دادنِ دسترسی به دیگران کارِ
   سوپرادمین است. اگر تیک‌کردنی بود، اولین ادمینی که آن را می‌گرفت
   می‌توانست خودش را سوپر کند یا مالک را بیرون بیندازد. */

import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/http'
import { X, Loader2, ShieldCheck, Check } from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38'

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

  /* Esc می‌بندد و بدنه قفل می‌شود — وگرنه پشتِ پنجره اسکرول می‌خورد */
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
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(20,18,14,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} dir="rtl" style={{
        background: '#fff', borderRadius: 18, width: 'min(560px,100%)', maxHeight: '86vh',
        display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-base)',
        boxShadow: '0 24px 70px rgba(28,27,23,0.22)',
      }}>
        {/* سربرگ */}
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <ShieldCheck size={18} style={{ color: GOLD_D, flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: INK }}>دسترسی‌های {user.name}</div>
            <div style={{ fontSize: 11.5, color: MUT, marginTop: 3 }} className="bh-latin">{user.phone}</div>
          </div>
          <button onClick={onClose} aria-label="بستن" style={{
            background: 'rgba(28,28,26,0.05)', border: `1px solid ${LINE}`, borderRadius: 10,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: SEC, flexShrink: 0,
          }}><X size={16} /></button>
        </div>

        {/* بدنه */}
        <div style={{ overflowY: 'auto', padding: '4px 18px 14px' }}>
          <p style={{ fontSize: 12, color: SEC, lineHeight: 2, margin: '12px 0 14px' }}>
            فقط بخش‌هایی که تیک بخورند برای این ادمین باز می‌شوند. بقیه‌ی صفحه‌ها نه در پنل
            دیده می‌شوند و نه از راهِ آدرسِ مستقیم باز می‌شوند.
            <br />
            <b style={{ color: INK }}>«دسترسی ادمین» در این فهرست نیست</b> — دادنِ دسترسی به دیگران
            فقط کارِ شماست و قابلِ واگذاری نیست.
          </p>

          {groups.map(g => {
            const on = g.items.filter(i => sel.has(i.key)).length
            const allOn = on === g.items.length
            return (
              <div key={g.key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 900, color: INK }}>{g.label}</span>
                  <span style={{ fontSize: 11, color: MUT }}>{on}/{g.items.length}</span>
                  <button onClick={() => groupAll(g, !allOn)} style={{
                    marginInlineStart: 'auto', fontSize: 11, fontWeight: 800, fontFamily: 'inherit',
                    padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${LINE}`, background: '#FAFAF7', color: SEC,
                  }}>{allOn ? 'برداشتنِ همه' : 'انتخابِ همه'}</button>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {g.items.map(i => {
                    const checked = sel.has(i.key)
                    return (
                      <label key={i.key} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer',
                        padding: '9px 11px', borderRadius: 11, minHeight: 40,
                        border: `1px solid ${checked ? 'rgba(199,166,106,0.42)' : LINE}`,
                        background: checked ? 'rgba(199,166,106,0.09)' : '#fff',
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => flip(i.key)}
                          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                        <span aria-hidden style={{
                          width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          border: `1.5px solid ${checked ? GOLD_D : '#CFC9BA'}`,
                          background: checked ? GOLD_D : '#fff', color: '#fff',
                        }}>{checked && <Check size={12} strokeWidth={3} />}</span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: INK }}>{i.label}</span>
                          {i.hint && <span style={{ display: 'block', fontSize: 11, color: MUT, marginTop: 2, lineHeight: 1.7 }}>{i.hint}</span>}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* پانویس */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: SEC, fontWeight: 700 }}>{sel.size} از {total} بخش</span>
          {err && <span style={{ fontSize: 12, color: '#B23B2E', fontWeight: 700 }}>{err}</span>}
          <button onClick={onClose} style={{
            marginInlineStart: 'auto', padding: '9px 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${LINE}`, background: '#FAFAF7', color: SEC,
          }}>انصراف</button>
          <button onClick={() => void save()} disabled={busy} style={{
            padding: '9px 20px', borderRadius: 10, fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit',
            cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
            border: '1px solid rgba(14,122,56,0.34)', background: 'rgba(14,122,56,0.12)', color: FELT,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>{busy && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}ذخیره</button>
        </div>
      </div>
    </div>
  )
}
