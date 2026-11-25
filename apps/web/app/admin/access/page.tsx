'use client'

/* اعطای دسترسی ادمین.
   حساس‌ترین صفحه‌ی پنل — پس عمدا ساده و صریح است: جست‌وجو، یک دکمه،
   و فهرست کسانی که همین حالا ادمین‌اند. */

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../../lib/http'
import PermissionsDialog, { type PermGroup } from '../../../components/admin/PermissionsDialog'
import { AdminHeader } from '../../../components/admin/AdminHeader'
import { Button } from '../../../components/ui/Button'
import { ShieldCheck, Loader2, Search, UserPlus, UserMinus, AlertCircle, SlidersHorizontal, Crown } from 'lucide-react'

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
  /* دکمه‌ی «دسترسی» در فهرست کاربران با ?q=<شماره> به این‌جا
     می‌آید؛ جست‌وجو پیش‌پر و یک‌بار خودکار اجرا می‌شود.
     عمدا از `useSearchParams` استفاده نمی‌شود: آن مرز
     Suspense می‌خواهد و prerender این صفحه را می‌شکست. */
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  /* دسترسی‌های تفکیک‌شده — از /api/admin/permissions می‌آید و کنار
     فهرست ادمین‌ها می‌نشیند. `perm[userId]` فهرست کلیدهاست؛
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
         باشد، فهرست ادمین‌ها همچنان کار کند و فقط بخش تیک‌ها غایب
         بماند — نه اینکه کل صفحه بشکند. */
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

  const name = (u: U) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'بدون نام'

  return (
    <main className="adm-page">
      <AdminHeader
        icon={<ShieldCheck size={26} className="text-gold-text" aria-hidden />}
        title="دسترسی ادمین"
        description={
          <>
            ادمین به همه‌ی داده‌های مالی، تسویه‌ها و اطلاعات کاربران دسترسی دارد
            <b className="text-ink"> این دسترسی را فقط به کسی بدهید که کاملا به او اطمینان دارید</b>
            {' '}هر اعطا و لغو در گزارش ممیزی ثبت می‌شود
          </>
        } />

      {msg && (
        <div role={msg.ok ? 'status' : 'alert'}
          className={`rounded-card border px-4 py-3 text-sm font-semibold leading-loose ${msg.ok
            ? 'border-success/30 bg-success/10 text-success'
            : 'border-danger/30 bg-danger/5 text-danger-ink'}`}>
          {msg.text}
        </div>
      )}

      {/* ── جست‌وجو ── */}
      <form role="search" className="adm-card grid gap-2"
        onSubmit={e => { e.preventDefault(); void load(q) }}>
        <div className="adm-toolbar">
          <div className="adm-grow relative">
            <label htmlFor="access-q" className="sr-only">شماره موبایل یا نام</label>
            <Search size={16} aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input id="access-q" type="search" value={q} placeholder="شماره موبایل یا نام…"
              onChange={e => setQ(e.target.value)}
              className="h-11 w-full rounded-field border border-line/20 bg-surface pe-3 ps-9 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep" />
          </div>
          <Button type="submit" size="sm" variant="primary">جست‌وجو</Button>
        </div>
        {q.length > 0 && q.length < 3 && (
          <p className="m-0 text-xs text-ink-2">دست‌کم سه نویسه بنویسید</p>
        )}
      </form>

      {results.length > 0 && (
        <section aria-labelledby="access-results" className="grid gap-3">
          <h2 id="access-results" className="m-0 text-xl font-semibold text-ink">نتایج جست‌وجو</h2>
          {results.map(u => (
            <div key={u.id} className="adm-card flex flex-wrap items-center gap-3">
              <div className="min-w-0 basis-40 flex-1">
                <div className="adm-break text-sm font-semibold text-ink">{name(u)}</div>
                <div className="mt-1 text-xs text-ink-2">
                  {faNum(u.phone)} · {ROLE_FA[u.primaryRole ?? 'user'] ?? u.primaryRole}
                </div>
              </div>
              {u.primaryRole === 'admin' ? (
                <Button size="sm" variant="danger-ghost" icon={<UserMinus size={14} aria-hidden />}
                  disabled={busy === u.id || u.id === me} onClick={() => void toggle(u, false)}
                  title={u.id === me ? 'دسترسی خودتان را نمی‌توانید بردارید' : undefined}>
                  برداشتن دسترسی
                </Button>
              ) : (
                <Button size="sm" variant="primary" icon={<UserPlus size={14} aria-hidden />}
                  disabled={busy === u.id} onClick={() => void toggle(u, true)}>
                  دادن دسترسی ادمین
                </Button>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── ادمین‌های فعلی ── */}
      <section aria-labelledby="access-admins" className="grid gap-3">
        <h2 id="access-admins" className="m-0 text-xl font-semibold text-ink">
          ادمین‌های فعلی {admins.length > 0 && <span className="text-sm font-normal text-ink-2">({faNum(admins.length)})</span>}
        </h2>

        {loading ? (
          <div role="status" className="flex items-center gap-2 p-4 text-sm text-ink-2">
            <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden /> در حال بارگذاری…
          </div>
        ) : admins.map(u => {
          const p = perm[u.id] ?? []
          const isSuper = p.includes('*')
          const total = groups.reduce((n, g) => n + g.items.length, 0)
          return (
            <div key={u.id} className="adm-card flex flex-wrap items-center gap-3">
              {isSuper
                ? <Crown size={16} className="shrink-0 text-gold-text" aria-hidden />
                : <ShieldCheck size={16} className="shrink-0 text-gold-text" aria-hidden />}
              <div className="min-w-0 basis-40 flex-1">
                <div className="adm-break text-sm font-semibold text-ink">
                  {name(u)}
                  {u.id === me && <span className="text-xs font-normal text-ink-2"> — شما</span>}
                </div>
                <div className="mt-1 text-xs text-ink-2">
                  {faNum(u.phone)}
                  {groups.length > 0 && (
                    <span className={`ms-2 font-semibold ${isSuper ? 'text-gold-text' : ''}`}>
                      · {isSuper ? 'سوپرادمین — دسترسی کامل' : `${faNum(p.length)} از ${faNum(total)} بخش`}
                    </span>
                  )}
                </div>
              </div>

              <div className="adm-actions">
                {/* تنظیم دسترسی — سوپرادمین از این‌جا تغییر نمی‌کند */}
                {groups.length > 0 && !isSuper && (
                  <Button size="sm" variant="primary" icon={<SlidersHorizontal size={14} aria-hidden />}
                    onClick={() => setEditing(u)}>
                    دسترسی‌ها
                  </Button>
                )}
                {u.id !== me && admins.length > 1 && (
                  <Button size="sm" variant="danger-ghost" icon={<UserMinus size={14} aria-hidden />}
                    disabled={busy === u.id} onClick={() => void toggle(u, false)}>
                    برداشتن
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </section>

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
        <div role="note" className="flex gap-2 rounded-card border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold leading-loose text-gold-text">
          <AlertCircle size={16} className="mt-1 shrink-0" aria-hidden />
          تنها ادمین سامانه شمایید، تا وقتی ادمین دومی نباشد، دسترسی شما قابل برداشتن نیست —
          این عمدی است تا سامانه بی‌ادمین نماند
        </div>
      )}
    </main>
  )
}
