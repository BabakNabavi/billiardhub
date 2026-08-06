'use client'

/* ─────────────────────────────────────────────────────────────
   «دستور پرداخت» — الان چقدر، به چه کسی، به کدام شبا.

   ── چرا ساخته شد ──
   همه‌ی این داده‌ها از قبل در پنل بود، ولی در چهار تبِ جدا. برای یک
   واریزِ ساده باید بین «موجودی باشگاه‌ها» (مبلغ دارد، شبا ندارد)،
   «تسویه‌ها» (شبا دارد ولی فقط بعد از ساختنِ تسویه) و «بازپرداخت‌ها»
   (مبلغ دارد، مقصد ندارد) رفت‌وبرگشت می‌شد.

   این‌جا یک فهرستِ کارِ اجرایی است: هر ردیف همه‌ی چیزی را دارد که برای
   نشستن پشتِ بانک لازم است، و بعد از واریز همان‌جا ثبت می‌شود.

   ردیفِ مسدود (بدونِ شبا یا استعلام‌نشده) پنهان نمی‌شود؛ با علتش
   می‌ماند — بدهیِ نامرئی همان چیزی است که ماه‌ها بعد می‌ترکد.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/http'
import { Landmark, RotateCcw, Copy, Check, Loader2, AlertCircle, CircleDollarSign } from 'lucide-react'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#EAE5DA'
const GOLD = '#C7A66A', GOLD_D = '#9A6E38', FELT = '#0E7A38', RED = '#B23B2E'

const fa = (n: unknown) => Math.round(Number(n) || 0).toLocaleString('fa-IR')
const faDate = (iso?: string) => {
  if (!iso) return '—'
  try { return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }).format(new Date(iso)) } catch { return '—' }
}
/* شبا در گروه‌های چهارتایی خواناتر است — موقعِ تایپ در بانک کمتر اشتباه می‌شود */
const prettyIban = (v: string) => {
  const s = String(v || '').replace(/\s/g, '').toUpperCase()
  return s ? (s.startsWith('IR') ? s : `IR${s}`).replace(/(.{4})/g, '$1 ').trim() : ''
}
const prettyCard = (v: string) => String(v || '').replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()

interface ClubRow {
  kind: 'settlement' | 'unordered'
  id: string; clubId: string; clubName: string; amount: number
  iban: string; holder: string; bankName: string; verified: boolean
  status: string; requestedAt: string; blocked: string | null
}
interface UserRow {
  id: string; bookingId: string; clubName: string; userName: string; holder: string; phone: string
  amount: number
  /* شبا اگر باشد، وگرنه شماره کارت — بازپرداخت به شبا می‌رود */
  dest: string; destKind: 'iban' | 'card'
  verified: boolean; reason: string
  status: string; createdAt: string; blocked: string | null; warn: string | null
}
interface Payload {
  toClubs: ClubRow[]; toUsers: UserRow[]
  totals: {
    clubs: number; users: number; all: number
    ready: number; blocked: number; readyCount: number; blockedCount: number
  }
}

export default function PayoutOrders({ onChanged }: { onChanged?: () => void }) {
  const [d, setD] = useState<Payload | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const [modal, setModal] = useState<{ id: string; amount: number; to: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/admin/finance/payouts', { cache: 'no-store' })
      if (!r.ok) { setErr((await r.json().catch(() => ({})))?.message || 'دسترسی مجاز نیست'); return }
      setD(await r.json()); setErr('')
    } catch { setErr('خطا در ارتباط با سرور') }
  }, [])
  useEffect(() => { void load() }, [load])

  const act = async (body: Record<string, unknown>, key: string) => {
    setBusy(key)
    try {
      const r = await apiFetch('/api/admin/settlements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { alert(j?.message || 'عملیات ناموفق بود'); return }
      await load(); onChanged?.()
    } finally { setBusy('') }
  }

  if (err) return <Note tone="bad">{err}</Note>
  if (!d) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={22} style={{ color: MUT, animation: 'poSpin 1s linear infinite' }} /><style>{`@keyframes poSpin{to{transform:rotate(360deg)}}`}</style></div>

  const t = d.totals
  const nothing = d.toClubs.length === 0 && d.toUsers.length === 0

  return (
    <div>
      {/* ── جمعِ کل ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 18,
      }}>
        <Total label="مجموع پرداختنی" value={t.all} tone="ink" big />
        <Total label="آماده‌ی واریز" value={t.ready} hint={`${fa(t.readyCount)} مورد`} tone="felt" />
        <Total label="مسدود (مقصد ندارد)" value={t.blocked} hint={`${fa(t.blockedCount)} مورد`} tone={t.blockedCount ? 'bad' : 'mut'} />
      </div>

      {nothing && (
        <Note tone="ok">همه‌چیز تسویه است — هیچ پرداختِ باز‌ی وجود ندارد.</Note>
      )}

      {/* ── به باشگاه‌ها ── */}
      {d.toClubs.length > 0 && (
        <Section icon={<Landmark size={15} />} title="واریز به باشگاه‌ها" sum={t.clubs}>
          {d.toClubs.map(c => (
            <Card key={`${c.kind}-${c.id}`} blocked={!!c.blocked}>
              <Head
                name={c.clubName}
                amount={c.amount}
                badge={c.kind === 'unordered' ? { text: 'تسویه ساخته نشده', tone: 'warn' }
                  : c.status === 'PROCESSING' ? { text: 'در جریان', tone: 'info' }
                    : { text: 'در انتظار واریز', tone: 'gold' }}
              />

              {c.blocked ? (
                <Blocked text={c.blocked} />
              ) : (
                <Dest
                  rows={[
                    ['به نام', c.holder || '—'],
                    ['بانک', c.bankName || '—'],
                  ]}
                  copyLabel="شبا"
                  copyValue={prettyIban(c.iban)}
                  raw={prettyIban(c.iban).replace(/\s/g, '')}
                />
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
                {c.kind === 'unordered' ? (
                  <>
                    <button disabled={!!c.blocked || busy === c.id}
                      onClick={() => act({ action: 'create', clubId: c.clubId }, c.id)}
                      style={btn(!c.blocked && busy !== c.id, true)}>
                      {busy === c.id ? '…' : 'ایجاد دستور تسویه'}
                    </button>
                    <span style={{ fontSize: 11.5, color: MUT, lineHeight: 1.8 }}>
                      پیش از واریز باید تسویه ثبت شود تا مبلغ در دفتر قفل شود.
                    </span>
                  </>
                ) : (
                  <>
                    {c.status === 'PENDING' && (
                      <button disabled={busy === c.id} onClick={() => act({ action: 'process', id: c.id }, c.id)}
                        style={btn(busy !== c.id)}>شروع پردازش</button>
                    )}
                    <button disabled={!!c.blocked}
                      onClick={() => setModal({ id: c.id, amount: c.amount, to: c.clubName })}
                      style={btn(!c.blocked, true)}>ثبت واریز</button>
                    <span style={{ fontSize: 11.5, color: MUT }}>ثبت‌شده در {faDate(c.requestedAt)}</span>
                  </>
                )}
              </div>
            </Card>
          ))}
        </Section>
      )}

      {/* ── به کاربران ── */}
      {d.toUsers.length > 0 && (
        <Section icon={<RotateCcw size={15} />} title="بازپرداخت به کاربران" sum={t.users}>
          {d.toUsers.map(u => (
            <Card key={u.id} blocked={!!u.blocked}>
              <Head
                name={u.userName}
                sub={`${u.clubName}${u.reason ? ` — ${u.reason}` : ' — لغو رزرو'}`}
                amount={u.amount}
                badge={{ text: u.status === 'PROCESSING' ? 'در جریان' : 'در انتظار', tone: 'gold' }}
              />
              {u.blocked ? (
                <Blocked text={u.blocked} />
              ) : (
                <>
                  <Dest
                    rows={[
                      ['به نام', u.holder || u.userName],
                      ['موبایل', u.phone || '—'],
                      ['رزرو', u.bookingId.slice(0, 8) || '—'],
                    ]}
                    copyLabel={u.destKind === 'iban' ? 'شبا' : 'شماره کارت'}
                    copyValue={u.destKind === 'iban' ? prettyIban(u.dest) : prettyCard(u.dest)}
                    raw={u.destKind === 'iban' ? prettyIban(u.dest).replace(/\s/g, '') : u.dest.replace(/\D/g, '')}
                  />
                  {u.warn && <Warn text={u.warn} />}
                </>
              )}
              <div style={{ fontSize: 11.5, color: MUT, marginTop: 10 }}>
                ثبت‌شده در {faDate(u.createdAt)} — پس از واریز، از تب «بازپرداخت‌ها» وضعیتش را ببندید.
              </div>
            </Card>
          ))}
        </Section>
      )}

      {modal && (
        <RefModal amount={modal.amount} to={modal.to} onClose={() => setModal(null)}
          onSubmit={async ref => { await act({ action: 'complete', id: modal.id, reference: ref }, modal.id); setModal(null) }} />
      )}
    </div>
  )
}

/* ══ اجزا ══ */

function Total({ label, value, hint, tone, big }: {
  label: string; value: number; hint?: string; tone: 'ink' | 'felt' | 'bad' | 'mut'; big?: boolean
}) {
  const color = tone === 'felt' ? FELT : tone === 'bad' ? RED : tone === 'mut' ? MUT : INK
  return (
    <div style={{
      background: '#fff', border: `1px solid ${tone === 'bad' ? 'rgba(178,59,46,0.3)' : LINE}`,
      borderRadius: 14, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 11.5, color: SEC, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: big ? 22 : 18, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>{fa(value)}</span>
        <span style={{ fontSize: 11, color: MUT }}>تومان</span>
        {hint && <span style={{ fontSize: 11, color: MUT, marginRight: 'auto' }}>{hint}</span>}
      </div>
    </div>
  )
}

function Section({ icon, title, sum, children }: {
  icon: React.ReactNode; title: string; sum: number; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ color: GOLD_D, display: 'flex' }}>{icon}</span>
        <h3 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 12, fontWeight: 800, color: GOLD_D, marginRight: 'auto', fontVariantNumeric: 'tabular-nums' }}>
          {fa(sum)} تومان
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function Card({ blocked, children }: { blocked: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: 16,
      border: `1px solid ${blocked ? 'rgba(178,59,46,0.28)' : LINE}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>{children}</div>
  )
}

function Head({ name, sub, amount, badge }: {
  name: string; sub?: string; amount: number
  badge: { text: string; tone: 'gold' | 'warn' | 'info' }
}) {
  const c = badge.tone === 'warn' ? { bg: 'rgba(245,158,11,0.10)', fg: '#B45309', bd: 'rgba(245,158,11,0.26)' }
    : badge.tone === 'info' ? { bg: 'rgba(29,78,216,0.08)', fg: '#1D4ED8', bd: 'rgba(29,78,216,0.22)' }
      : { bg: 'rgba(199,166,106,0.12)', fg: GOLD_D, bd: 'rgba(199,166,106,0.30)' }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: INK }}>{name}</div>
        {sub && <div style={{ fontSize: 12, color: SEC, marginTop: 3, lineHeight: 1.8 }}>{sub}</div>}
      </div>
      <span style={{
        fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
        background: c.bg, color: c.fg, border: `1px solid ${c.bd}`, whiteSpace: 'nowrap',
      }}>{badge.text}</span>
      <div style={{ textAlign: 'left', direction: 'ltr' }}>
        <span style={{ fontSize: 19, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums' }}>{fa(amount)}</span>
        <span style={{ fontSize: 11, color: MUT, marginInlineStart: 4 }}>تومان</span>
      </div>
    </div>
  )
}

/* مقصدِ واریز — شبا/کارت با دکمه‌ی کپی، چون تایپِ دستی‌اش خطاخیز است */
function Dest({ rows, copyLabel, copyValue, raw }: {
  rows: [string, string][]; copyLabel: string; copyValue: string; raw: string
}) {
  const [done, setDone] = useState(false)
  /* بدونِ فاصله کپی می‌شود: فرمِ بانک فاصله را نمی‌پذیرد. نمایشِ
     گروه‌بندی‌شده فقط برای خواندنِ آدم است. */
  const copy = async () => {
    if (!raw) return
    try {
      await navigator.clipboard.writeText(raw)
      setDone(true); setTimeout(() => setDone(false), 1600)
    } catch { /* دسترسی کلیپ‌بورد نبود — مقدار روی صفحه هست */ }
  }
  return (
    <div style={{ background: '#FAF8F3', border: `1px solid ${LINE}`, borderRadius: 11, padding: '11px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, color: SEC, fontWeight: 700, flexShrink: 0 }}>{copyLabel}</span>
        <code style={{
          fontFamily: '"Courier New", monospace', fontSize: 14, fontWeight: 700, color: INK,
          direction: 'ltr', letterSpacing: '0.04em', wordBreak: 'break-all', flex: 1, minWidth: 0,
        }}>{copyValue || '—'}</code>
        <button type="button" onClick={copy} title="کپی"
          style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 11.5, fontWeight: 700,
            background: done ? 'rgba(14,122,56,0.10)' : 'rgba(199,166,106,0.12)',
            border: `1px solid ${done ? 'rgba(14,122,56,0.32)' : 'rgba(199,166,106,0.32)'}`,
            color: done ? FELT : GOLD_D,
          }}>
          {done ? <><Check size={12} /> کپی شد</> : <><Copy size={12} /> کپی</>}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {rows.map(([k, v]) => (
          <span key={k} style={{ fontSize: 12, color: SEC }}>
            {k}: <b style={{ color: INK, fontWeight: 700 }}>{v}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

function Blocked({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 7,
      background: 'rgba(178,59,46,0.06)', border: '1px solid rgba(178,59,46,0.26)',
      borderRadius: 11, padding: '10px 12px', fontSize: 12.5, fontWeight: 700,
      color: RED, lineHeight: 1.9,
    }}>
      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>{text}</span>
    </div>
  )
}

/* هشدار — برخلافِ `Blocked` جلوی پرداخت را نمی‌گیرد، فقط می‌گوید
   پیش از واریز یک نگاه بیندازید. */
function Warn({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 8,
      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.28)',
      borderRadius: 11, padding: '9px 12px', fontSize: 12, fontWeight: 700,
      color: '#B45309', lineHeight: 1.9,
    }}>
      <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>{text}</span>
    </div>
  )
}

function Note({ tone, children }: { tone: 'ok' | 'bad'; children: React.ReactNode }) {
  const ok = tone === 'ok'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderRadius: 13,
      background: ok ? 'rgba(14,122,56,0.06)' : 'rgba(178,59,46,0.06)',
      border: `1px solid ${ok ? 'rgba(14,122,56,0.26)' : 'rgba(178,59,46,0.26)'}`,
      fontSize: 13, fontWeight: 700, color: ok ? FELT : RED, lineHeight: 1.9,
    }}>
      {ok ? <CircleDollarSign size={16} /> : <AlertCircle size={16} />}
      {children}
    </div>
  )
}

function btn(enabled: boolean, primary = false): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 800,
    fontFamily: 'inherit', cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.45,
    background: primary ? 'rgba(199,166,106,0.16)' : '#fff',
    border: `1px solid ${primary ? 'rgba(199,166,106,0.45)' : LINE}`,
    color: primary ? GOLD_D : SEC,
  }
}

/* شماره‌ی پیگیریِ بانک اجباری است: بدونش، «واریز شد» فقط یک ادعاست و
   موقعِ اختلاف هیچ ردی برای دنبال‌کردن نمی‌ماند. */
function RefModal({ amount, to, onClose, onSubmit }: {
  amount: number; to: string; onClose: () => void; onSubmit: (ref: string) => void | Promise<void>
}) {
  const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(20,18,16,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 380, background: '#fff', borderRadius: 18, padding: 22,
        border: `1px solid ${LINE}`, boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 900, color: INK, margin: '0 0 4px' }}>ثبت واریز</h3>
        <p style={{ fontSize: 12.5, color: SEC, margin: '0 0 16px', lineHeight: 1.9 }}>
          <b style={{ color: INK }}>{fa(amount)}</b> تومان به <b style={{ color: INK }}>{to}</b>
        </p>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: SEC, marginBottom: 6 }}>
          شماره پیگیری بانک
        </label>
        <input value={ref} onChange={e => setRef(e.target.value)} autoFocus
          placeholder="مثلاً ۱۲۳۴۵۶۷۸"
          style={{
            width: '100%', boxSizing: 'border-box', border: `1px solid ${LINE}`, borderRadius: 10,
            padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', color: INK,
            background: '#FAFAF7', outline: 'none', direction: 'ltr', textAlign: 'left',
          }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button disabled={!ref.trim() || busy}
            onClick={async () => { setBusy(true); try { await onSubmit(ref.trim()) } finally { setBusy(false) } }}
            style={{ ...btn(!!ref.trim() && !busy, true), flex: 1, justifyContent: 'center' }}>
            {busy ? <Loader2 size={13} style={{ animation: 'poSpin 1s linear infinite' }} /> : null} تأیید واریز
          </button>
          <button onClick={onClose} style={{ ...btn(true), justifyContent: 'center' }}>انصراف</button>
        </div>
      </div>
    </div>
  )
}
