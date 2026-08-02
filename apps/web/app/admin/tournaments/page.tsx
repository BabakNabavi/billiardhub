'use client'

/* مسابقاتِ باشگاه‌ها در پنلِ ادمین.

   این صفحه نبود و نبودنش یک شکافِ نظارتی بود: منوی «مسابقات و
   رویدادها» جدولِ `events` را نشان می‌داد (رویدادهای محتوایی که خودِ
   ادمین می‌سازد)، در حالی که مسابقاتِ واقعیِ باشگاه‌ها — همان‌هایی که
   ثبت‌نام و پول دارند — در جدولِ `tournaments` بودند و هیچ‌جا دیده
   نمی‌شدند. */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '../../../lib/http'
import { Trophy, Loader2, AlertCircle, Users, Wallet, ExternalLink, Plus, Trash2 } from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD_D = '#9A6E38', FELT = '#0E7A38'
const fa = (n: unknown) => Math.round(Number(n) || 0).toLocaleString('fa-IR')
const faDate = (iso?: unknown) => {
  try { return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(String(iso))) }
  catch { return '—' }
}

interface T {
  id: string; title: string; status: string; club_id: string; clubName: string
  entry_fee: number; max_players: number; starts_at: string | null; created_at: string
  registrations: number; paidRegistrations: number
  grossRevenue: number; platformCommission: number; clubShare: number
}

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  draft:               { label: 'پیش‌نویس',        bg: 'rgba(0,0,0,0.05)',        fg: '#6B7280' },
  published:           { label: 'منتشرشده',        bg: 'rgba(29,78,216,0.10)',    fg: '#1D4ED8' },
  registration_open:   { label: 'ثبت‌نام باز',      bg: 'rgba(48,197,90,0.12)',    fg: FELT },
  registration_closed: { label: 'ثبت‌نام بسته',     bg: 'rgba(199,166,106,0.16)',  fg: GOLD_D },
  ongoing:             { label: 'در حال برگزاری',  bg: 'rgba(239,68,68,0.10)',    fg: '#dc2626' },
  completed:           { label: 'تمام‌شده',         bg: 'rgba(0,0,0,0.06)',        fg: '#374151' },
  cancelled:           { label: 'لغوشده',          bg: 'rgba(239,68,68,0.08)',    fg: '#991B1B' },
}

export default function AdminTournaments() {
  const [rows, setRows] = useState<T[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState('')
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([])
  const [showNew, setShowNew] = useState(false)
  /* فیلدها عمداً همان‌هایی است که پنلِ باشگاه دارد — دو فرم برای یک
     موجودیت نباید امکاناتِ متفاوت بدهند. */
  const [nf, setNf] = useState({
    clubId: '', title: '', entryFee: '', maxPlayers: '16', startsAt: '',
    discipline: 'snooker', matchFormat: '', registrationEndsAt: '', prize: '', description: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await apiFetch(`/api/admin/tournaments${filter ? `?status=${filter}` : ''}`, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message ?? 'دسترسی مجاز نیست'); return }
      setRows(j.tournaments ?? []); setCounts(j.counts ?? {}); setClubs(j.clubs ?? []); setErr('')
    } catch { setErr('خطا در ارتباط با سرور') }
    finally { setLoading(false) }
  }, [filter])
  useEffect(() => { void load() }, [load])

  const setStatus = async (id: string, status: string) => {
    setBusy(id); setErr('')
    try {
      const r = await apiFetch('/api/admin/tournaments', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message ?? 'تغییر وضعیت انجام نشد'); return }
      await load()
    } catch { setErr('خطا در ارتباط با سرور') }
    finally { setBusy('') }
  }

  const create = async () => {
    setBusy('new'); setErr('')
    try {
      const r = await apiFetch('/api/admin/tournaments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId: nf.clubId, title: nf.title,
          entryFee: Number(nf.entryFee) || 0, maxPlayers: Number(nf.maxPlayers) || 16,
          startsAt: nf.startsAt || undefined,
          discipline: nf.discipline, matchFormat: nf.matchFormat || undefined,
          registrationEndsAt: nf.registrationEndsAt || undefined,
          prize: nf.prize || undefined, description: nf.description || undefined,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message ?? 'ثبت مسابقه انجام نشد'); return }
      setShowNew(false)
      setNf({ clubId: '', title: '', entryFee: '', maxPlayers: '16', startsAt: '',
             discipline: 'snooker', matchFormat: '', registrationEndsAt: '', prize: '', description: '' })
      await load()
    } catch { setErr('خطا در ارتباط با سرور') }
    finally { setBusy('') }
  }

  const remove = async (id: string) => {
    setBusy(id); setErr('')
    try {
      const r = await apiFetch(`/api/admin/tournaments?id=${id}`, { method: 'DELETE' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j?.message ?? 'حذف انجام نشد'); return }
      await load()
    } catch { setErr('خطا در ارتباط با سرور') }
    finally { setBusy('') }
  }

  const card: React.CSSProperties = {
    background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 16, marginBottom: 12,
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 9, border: `1px solid ${LINE}`,
    background: '#FAFAFA', fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const chip = (on: boolean): React.CSSProperties => ({
    flexShrink: 0, padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800,
    background: on ? INK : '#fff', color: on ? '#fff' : SEC,
    border: `1px solid ${on ? INK : LINE}`,
  })

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-base)', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Trophy size={22} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 21, fontWeight: 900, color: INK, margin: 0 }}>مسابقات باشگاه‌ها</h1>
      </div>
      <p style={{ fontSize: 12.5, color: SEC, lineHeight: 2, margin: '0 0 16px' }}>
        مسابقاتی که باشگاه‌ها ساخته‌اند — با ثبت‌نام و پول واقعی.
        این با «رویدادها» فرق دارد؛ آن‌ها محتوای دستیِ خودِ شماست.
      </p>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        <button onClick={() => setShowNew(v => !v)} style={{
          flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 12.5, fontWeight: 800,
          border: '1px solid rgba(48,197,90,0.34)', background: 'rgba(48,197,90,0.12)', color: FELT,
        }}><Plus size={13} /> مسابقه‌ی جدید</button>
        <button onClick={() => setFilter('')} style={chip(filter === '')}>همه</button>
        {Object.entries(STATUS).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} style={chip(filter === k)}>
            {v.label}{(counts[k] ?? 0) > 0 && <span style={{ fontSize: 10.5, opacity: .75 }}> ({fa(counts[k])})</span>}
          </button>
        ))}
      </div>

      {err && (
        <div style={{
          marginBottom: 12, padding: '11px 14px', borderRadius: 11, display: 'flex', gap: 8,
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.26)',
          color: '#991B1B', fontSize: 12.5, fontWeight: 700, lineHeight: 1.9,
        }}><AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />{err}</div>
      )}

      {/* ── ساختِ مسابقه توسطِ ادمین ──
          باشگاه اجباری است: مسابقه بدونِ باشگاه، بدونِ حسابِ تسویه و
          بدونِ صاحب می‌ماند. */}
      {showNew && (
        <div style={{ ...card, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          <Field label="باشگاه">
            <select value={nf.clubId} onChange={e => setNf(p => ({ ...p, clubId: e.target.value }))} style={inp}>
              <option value="">انتخاب کنید…</option>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="عنوان مسابقه">
            <input value={nf.title} onChange={e => setNf(p => ({ ...p, title: e.target.value }))} style={inp} />
          </Field>
          <Field label="ورودی (تومان)">
            <input value={nf.entryFee} inputMode="numeric" style={inp}
              onChange={e => setNf(p => ({ ...p, entryFee: e.target.value.replace(/\D/g, '') }))} />
          </Field>
          <Field label="ظرفیت">
            <input value={nf.maxPlayers} inputMode="numeric" style={inp}
              onChange={e => setNf(p => ({ ...p, maxPlayers: e.target.value.replace(/\D/g, '') }))} />
          </Field>
          <Field label="رشته">
            <select value={nf.discipline} onChange={e => setNf(p => ({ ...p, discipline: e.target.value }))} style={inp}>
              <option value="snooker">اسنوکر</option>
              <option value="pool">پول ۸ و ۹</option>
              <option value="carom">کاروم</option>
              <option value="billiard">بیلیارد</option>
            </select>
          </Field>
          <Field label="فرمت مسابقه">
            <select value={nf.matchFormat} onChange={e => setNf(p => ({ ...p, matchFormat: e.target.value }))} style={inp}>
              <option value="">نامشخص</option>
              <option value="bo3">Best of ۳</option>
              <option value="bo5">Best of ۵</option>
              <option value="bo7">Best of ۷</option>
              <option value="bo9">Best of ۹</option>
              <option value="bo11">Best of ۱۱</option>
            </select>
          </Field>
          <Field label="تاریخ برگزاری (اختیاری)">
            <input type="datetime-local" value={nf.startsAt} style={inp}
              onChange={e => setNf(p => ({ ...p, startsAt: e.target.value }))} />
          </Field>
          <Field label="مهلت ثبت‌نام (اختیاری)">
            <input type="datetime-local" value={nf.registrationEndsAt} style={inp}
              onChange={e => setNf(p => ({ ...p, registrationEndsAt: e.target.value }))} />
          </Field>
          <Field label="جایزه (اختیاری)">
            <input value={nf.prize} style={inp} placeholder="مثلاً ۱۰٬۰۰۰٬۰۰۰ تومان"
              onChange={e => setNf(p => ({ ...p, prize: e.target.value }))} />
          </Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="توضیحات (اختیاری)">
              <textarea value={nf.description} rows={3}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.9 }}
                onChange={e => setNf(p => ({ ...p, description: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <Act on={!!nf.clubId && !!nf.title.trim() && busy !== 'new'} tone="go" onClick={() => void create()}>
              ثبت و انتشار
            </Act>
            <Act on={busy !== 'new'} onClick={() => setShowNew(false)}>انصراف</Act>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: SEC, fontSize: 13, padding: 24 }}>
          <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> در حال بارگذاری…
        </div>
      ) : rows.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: MUT, fontSize: 13, padding: 36 }}>
          مسابقه‌ای در این وضعیت نیست.
        </div>
      ) : rows.map(t => (
        <div key={t.id} style={card}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>{t.title}</div>
              <div style={{ fontSize: 12, color: SEC, marginTop: 4 }}>
                {t.clubName} · ورودی {fa(t.entry_fee)} تومان · ظرفیت {fa(t.max_players)}
              </div>
              <div style={{ fontSize: 11.5, color: MUT, marginTop: 3 }}>
                {t.starts_at ? `برگزاری: ${faDate(t.starts_at)}` : 'تاریخ ثبت نشده'} · ساخت: {faDate(t.created_at)}
              </div>
            </div>
            <span style={{
              padding: '4px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap',
              background: STATUS[t.status]?.bg, color: STATUS[t.status]?.fg,
            }}>{STATUS[t.status]?.label ?? t.status}</span>
          </div>

          {/* ارقام از ثبت‌نام‌های واقعی می‌آیند، نه از تخمین */}
          <div style={{
            display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 10,
            background: '#FAF8F3', fontSize: 12, color: SEC, marginBottom: 10,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Users size={13} /> ثبت‌نام: <b style={{ color: INK }}>{fa(t.paidRegistrations)}</b>
              {t.registrations > t.paidRegistrations && (
                <span style={{ color: MUT }}> (+{fa(t.registrations - t.paidRegistrations)} پرداخت‌نشده)</span>
              )}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Wallet size={13} /> ناخالص: <b style={{ color: INK }}>{fa(t.grossRevenue)}</b>
            </span>
            <span>کمیسیون ما: <b style={{ color: GOLD_D }}>{fa(t.platformCommission)}</b></span>
            <span>سهم باشگاه: <b style={{ color: FELT }}>{fa(t.clubShare)}</b></span>
          </div>

          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <Link href={`/tournaments/${t.id}`} target="_blank" style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 999,
              fontSize: 12, fontWeight: 700, textDecoration: 'none',
              border: `1px solid ${LINE}`, background: '#fff', color: SEC,
            }}><ExternalLink size={12} /> صفحه‌ی عمومی</Link>

            {t.status !== 'registration_open' && t.status !== 'cancelled' && t.status !== 'completed' && (
              <Act on={busy !== t.id} tone="go" onClick={() => void setStatus(t.id, 'registration_open')}>
                باز کردن ثبت‌نام
              </Act>
            )}
            {t.status === 'registration_open' && (
              <Act on={busy !== t.id} onClick={() => void setStatus(t.id, 'registration_closed')}>
                بستن ثبت‌نام
              </Act>
            )}
            {t.status !== 'cancelled' && t.status !== 'completed' && (
              <Act on={busy !== t.id} tone="stop" onClick={() => void setStatus(t.id, 'cancelled')}>
                لغو مسابقه
              </Act>
            )}
            {/* حذفِ فیزیکی فقط وقتی پولی جابه‌جا نشده؛ سرور هم مستقل
                همین را بررسی می‌کند و در غیرِ این صورت ۴۰۹ می‌دهد. */}
            {t.paidRegistrations === 0 && (
              <Act on={busy !== t.id} tone="stop" onClick={() => void remove(t.id)}>
                <Trash2 size={12} /> حذف
              </Act>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#5B564B' }}>{label}</span>
      {children}
    </label>
  )
}

function Act({ children, onClick, on, tone }: {
  children: React.ReactNode; onClick: () => void; on: boolean; tone?: 'go' | 'stop'
}) {
  const c = tone === 'go'
    ? { b: 'rgba(48,197,90,0.34)', g: 'rgba(48,197,90,0.12)', t: FELT }
    : tone === 'stop'
      ? { b: 'rgba(239,68,68,0.3)', g: 'rgba(239,68,68,0.07)', t: '#dc2626' }
      : { b: LINE, g: '#fff', t: SEC }
  return (
    <button disabled={!on} onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 999,
      fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
      cursor: on ? 'pointer' : 'not-allowed', opacity: on ? 1 : 0.5,
      border: `1px solid ${c.b}`, background: c.g, color: c.t,
    }}>{children}</button>
  )
}
