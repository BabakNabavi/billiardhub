'use client'

/* اعطای دسترسیِ ادمین.
   حساس‌ترین صفحه‌ی پنل — پس عمداً ساده و صریح است: جست‌وجو، یک دکمه،
   و فهرستِ کسانی که همین حالا ادمین‌اند. */

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../../lib/http'
import PermissionsDialog, { type PermGroup } from '../../../components/admin/PermissionsDialog'
import { ShieldCheck, Loader2, Search, UserPlus, UserMinus, AlertCircle, SlidersHorizontal, Crown } from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38'
const faNum = (s: unknown) => String(s ?? '').replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!)

interface U {
  id: string; phone: string; firstName?: string; lastName?: string
  primaryRole?: string; secondaryRoles?: string[]
}

const ROLE_FA: Record<string, string> = {
  admin: 'ادمین', club_owner: 'مالک باشگاه', player: 'بازیکن', coach: 'مربی',
  referee: 'داور', seller: 'فروشنده', manufacturer: 'تولیدکننده',
  technician: 'متخصص فنی', user: 'کاربر عادی',
}

export default function AdminAccess() {
  const [admins, setAdmins] = useState<U[]>([])
  const [results, setResults] = useState<U[]>([])
  const [me, setMe] = useState('')
  /* دکمه‌ی «دسترسی» در فهرستِ کاربران با ?q=<شماره> به این‌جا
     می‌آید؛ جست‌وجو پیش‌پر و یک‌بار خودکار اجرا می‌شود.
     عمداً از `useSearchParams` استفاده نمی‌شود: آن مرزِ
     Suspense می‌خواهد و prerender این صفحه را می‌شکست. */
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  /* دسترسی‌های تفکیک‌شده — از /api/admin/permissions می‌آید و کنارِ
     فهرستِ ادمین‌ها می‌نشیند. `perm[userId]` فهرستِ کلیدهاست؛
     `['*']` یعنی سوپرادمین. */
  const [groups, setGroups] = useState<PermGroup[]>([])
  const [perm, setPerm] = useState<Record<string, string[]>>({})
  const [editing, setEditing] = useState<U | null>(null)

  const load = useCallback(async (query = '') => {
    setLoading(true)
    try {
      const r = await apiFetch(`/api/admin/grant-admin${query ? `?q=${encodeURIComponent(query)}` : ''}`, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setMsg({ ok: false, text: j?.message ?? 'دسترسی مجاز نیست' }); return }
      setAdmins(j.admins ?? []); setResults(j.results ?? []); setMe(j.me ?? '')

      /* دسترسی‌ها جدا خوانده می‌شوند تا اگر مهاجرت هنوز اجرا نشده
         باشد، فهرستِ ادمین‌ها همچنان کار کند و فقط بخشِ تیک‌ها غایب
         بماند — نه اینکه کلِ صفحه بشکند. */
      const p = await apiFetch('/api/admin/permissions?all=1', { cache: 'no-store' })
      if (p.ok) {
        const pj = await p.json().catch(() => ({}))
        setGroups(pj.groups ?? [])
        setPerm(Object.fromEntries((pj.admins ?? []).map((a: { id: string; permissions: string[] }) => [a.id, a.permissions ?? []])))
      }
    } catch { setMsg({ ok: false, text: 'خطا در ارتباط با سرور' }) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    const pre = typeof window === 'undefined' ? ''
      : (new URLSearchParams(window.location.search).get('q') ?? '')
    if (pre) setQ(pre)
    void load(pre.length >= 3 ? pre : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  const toggle = async (u: U, grant: boolean) => {
    setBusy(u.id); setMsg(null)
    try {
      const r = await apiFetch('/api/admin/grant-admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.id, grant }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setMsg({ ok: false, text: j?.message ?? 'انجام نشد' }); return }
      setMsg({
        ok: true,
        text: grant
          ? `دسترسی ادمین به ${u.firstName ?? ''} ${u.lastName ?? ''} (${faNum(u.phone)}) داده شد`
          : `دسترسی ادمین از ${faNum(u.phone)} برداشته شد`,
      })
      await load(q)
    } catch { setMsg({ ok: false, text: 'خطا در ارتباط با سرور' }) }
    finally { setBusy('') }
  }

  const card: React.CSSProperties = {
    background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 14, marginBottom: 10,
  }
  const name = (u: U) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'بدون نام'

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)', maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <ShieldCheck size={22} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>دسترسی ادمین</h1>
      </div>
      <p style={{ fontSize: 12.5, color: SEC, lineHeight: 2, margin: '0 0 16px' }}>
        ادمین به همه‌ی داده‌های مالی، تسویه‌ها و اطلاعات کاربران دسترسی دارد.
        <b style={{ color: INK }}> این دسترسی را فقط به کسی بدهید که کاملاً به او اطمینان دارید.</b>
        {' '}هر اعطا و لغو در گزارش ممیزی ثبت می‌شود.
      </p>

      {msg && (
        <div style={{
          marginBottom: 12, padding: '11px 14px', borderRadius: 11, fontSize: 12.5, fontWeight: 700,
          background: msg.ok ? 'rgba(48,197,90,0.09)' : 'rgba(239,68,68,0.07)',
          border: `1px solid ${msg.ok ? 'rgba(48,197,90,0.28)' : 'rgba(239,68,68,0.26)'}`,
          color: msg.ok ? FELT : '#991B1B', lineHeight: 1.9,
        }}>{msg.text}</div>
      )}

      {/* ── جست‌وجو ── */}
      <div style={{ ...card, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Search size={15} style={{ color: MUT }} />
        <input value={q} placeholder="شماره موبایل یا نام…"
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void load(q) }}
          style={{
            flex: 1, minWidth: 180, padding: '9px 11px', borderRadius: 9,
            border: `1px solid ${LINE}`, background: '#FAFAFA',
            fontSize: 14, fontFamily: 'inherit',
          }} />
        <button onClick={() => void load(q)} style={{
          padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 800,
          fontFamily: 'inherit', cursor: 'pointer',
          border: '1px solid rgba(199,166,106,0.42)', background: 'rgba(199,166,106,0.14)', color: GOLD_D,
        }}>جست‌وجو</button>
      </div>

      {q.length > 0 && q.length < 3 && (
        <div style={{ fontSize: 12, color: MUT, marginBottom: 12 }}>
          دست‌کم سه نویسه بنویسید.
        </div>
      )}

      {results.length > 0 && (
        <>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, margin: '14px 0 8px' }}>نتایج جست‌وجو</div>
          {results.map(u => (
            <div key={u.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>{name(u)}</div>
                <div style={{ fontSize: 12, color: SEC, marginTop: 3 }}>
                  {faNum(u.phone)} · {ROLE_FA[u.primaryRole ?? 'user'] ?? u.primaryRole}
                </div>
              </div>
              {u.primaryRole === 'admin' ? (
                <button disabled={busy === u.id || u.id === me} onClick={() => void toggle(u, false)}
                  title={u.id === me ? 'دسترسی خودتان را نمی‌توانید بردارید' : undefined}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '8px 15px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                    fontFamily: 'inherit', cursor: u.id === me ? 'not-allowed' : 'pointer',
                    opacity: u.id === me || busy === u.id ? 0.5 : 1,
                    border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#dc2626',
                  }}><UserMinus size={13} /> برداشتن دسترسی</button>
              ) : (
                <button disabled={busy === u.id} onClick={() => void toggle(u, true)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '8px 15px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                  fontFamily: 'inherit', cursor: 'pointer', opacity: busy === u.id ? 0.5 : 1,
                  border: '1px solid rgba(48,197,90,0.34)', background: 'rgba(48,197,90,0.12)', color: FELT,
                }}><UserPlus size={13} /> دادن دسترسی ادمین</button>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── ادمین‌های فعلی ── */}
      <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, margin: '18px 0 8px' }}>
        ادمین‌های فعلی {admins.length > 0 && <span style={{ color: MUT, fontWeight: 600 }}>({faNum(admins.length)})</span>}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: SEC, fontSize: 13, padding: 16 }}>
          <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> در حال بارگذاری…
        </div>
      ) : admins.map(u => {
        const p = perm[u.id] ?? []
        const isSuper = p.includes('*')
        const total = groups.reduce((n, g) => n + g.items.length, 0)
        return (
        <div key={u.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isSuper
            ? <Crown size={16} style={{ color: GOLD_D, flexShrink: 0 }} />
            : <ShieldCheck size={16} style={{ color: GOLD_D, flexShrink: 0 }} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>
              {name(u)}
              {u.id === me && <span style={{ fontSize: 11, color: MUT, fontWeight: 600 }}> — شما</span>}
            </div>
            <div style={{ fontSize: 12, color: SEC, marginTop: 3 }}>
              {faNum(u.phone)}
              {groups.length > 0 && (
                <span style={{ marginInlineStart: 8, color: isSuper ? GOLD_D : MUT, fontWeight: 700 }}>
                  · {isSuper ? 'سوپرادمین — دسترسیِ کامل' : `${faNum(p.length)} از ${faNum(total)} بخش`}
                </span>
              )}
            </div>
          </div>

          {/* تنظیمِ دسترسی — سوپرادمین از این‌جا تغییر نمی‌کند */}
          {groups.length > 0 && !isSuper && (
            <button onClick={() => setEditing(u)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 13px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer',
              border: '1px solid rgba(199,166,106,0.42)', background: 'rgba(199,166,106,0.12)', color: GOLD_D,
            }}><SlidersHorizontal size={12} /> دسترسی‌ها</button>
          )}

          {u.id !== me && admins.length > 1 && (
            <button disabled={busy === u.id} onClick={() => void toggle(u, false)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '7px 13px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer', opacity: busy === u.id ? 0.5 : 1,
              border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#dc2626',
            }}><UserMinus size={12} /> برداشتن</button>
          )}
        </div>
        )
      })}

      {editing && (
        <PermissionsDialog
          user={{ id: editing.id, name: name(editing), phone: faNum(editing.phone), permissions: perm[editing.id] ?? [] }}
          groups={groups}
          onClose={() => setEditing(null)}
          onSaved={keys => {
            setPerm(m => ({ ...m, [editing.id]: keys }))
            setMsg({ ok: true, text: `دسترسی‌های ${name(editing)} ذخیره شد — ${faNum(keys.length)} بخش` })
          }}
        />
      )}

      {!loading && admins.length === 1 && (
        <div style={{
          display: 'flex', gap: 8, padding: '11px 14px', borderRadius: 11, marginTop: 4,
          background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.32)',
          fontSize: 12.5, color: GOLD_D, fontWeight: 700, lineHeight: 1.9,
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          تنها ادمینِ سامانه شمایید. تا وقتی ادمین دومی نباشد، دسترسی شما قابل برداشتن نیست —
          این عمدی است تا سامانه بی‌ادمین نماند.
        </div>
      )}
    </div>
  )
}
