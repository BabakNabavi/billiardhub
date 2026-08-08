'use client'

/* ─────────────────────────────────────────────────────────────
   ثبت‌نام‌کنندگانِ یک مسابقه — دیدن، افزودنِ حضوری، حذف.

   ── چرا ساخته شد ──
   دو چیزی که برگزارکننده لازم داشت و هیچ‌کدام نبود:

     ۱) **نمی‌دید چه کسی ثبت‌نام کرده.** پنل فقط عددِ «۳ از ۱۶» را
        نشان می‌داد. API از قبل این داده را می‌داد؛ فقط هیچ صفحه‌ای
        نمی‌خواندش.

     ۲) **ثبت‌نامِ حضوری راه نداشت.** هر کس تلفنی یا دمِ در اسم
        می‌داد بیرونِ سیستم می‌ماند، پس عددِ ظرفیتِ سایت با واقعیتِ
        سالن نمی‌خواند.

   ── چرا حذفِ ثبت‌نامِ آنلاین این‌جا نیست ──
   پشتِ ثبت‌نامِ آنلاین پولِ واقعی است. حذفش یعنی گم‌شدنِ ردِ تراکنش.
   مسیرِ درستش بازپرداخت است که جای خودش را دارد.

   ── چیدمان ──
   ردیف‌ها گرید هستند نه فلکس. با فلکس، ستونِ وضعیت و مبلغ به نامِ
   هر بازیکن می‌چسبید و چون نام‌ها هم‌اندازه نیستند، هیچ‌کدام زیرِ هم
   نمی‌افتادند — فهرست خوانده نمی‌شد. گرید ستون‌ها را قفل می‌کند.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { UserPlus, Trash2, Phone, RefreshCw, Users, Loader2, AlertTriangle, Check, X } from 'lucide-react'
import { apiFetch } from '../../../lib/http'

const GOLD = '#C7A66A'
const DARK = '#1A1A18'

interface Reg {
  id: string
  playerName: string | null
  phone: string | null
  status: string
  paymentStatus: string
  amount: number
  refId: string | null
  source: 'online' | 'offline'
  note: string | null
  createdAt: string
}

interface Payload {
  tournament: { id: string; title: string; maxPlayers: number; entryFee: number; status: string }
  seatsLeft: number
  counts: { total: number; confirmed: number; pending: number; refunded: number }
  totals: { gross: number; refunded: number }
  registrations: Reg[]
}

const fa = (n: number | string) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)
const money = (n: number) => fa(n.toLocaleString('en-US').replace(/,/g, '٬')) + ' تومان'

function statusOf(r: Reg): { label: string; color: string; bg: string } {
  if (r.status === 'CONFIRMED') return { label: 'قطعی', color: '#15803D', bg: 'rgba(48,197,90,0.10)' }
  if (r.status === 'REFUNDED') return { label: 'بازپرداخت‌شده', color: '#6B7280', bg: 'rgba(0,0,0,0.05)' }
  if (r.status === 'CANCELLED') return { label: 'لغوشده', color: '#B91C1C', bg: 'rgba(239,68,68,0.08)' }
  if (r.status === 'EXPIRED') return { label: 'منقضی', color: '#6B7280', bg: 'rgba(0,0,0,0.05)' }
  return { label: 'در انتظار پرداخت', color: '#B45309', bg: 'rgba(245,158,11,0.10)' }
}

export default function TournamentRegistrations({ tournamentId, onChanged }: {
  tournamentId: string
  /* کارتِ بالای همین مسابقه عددِ «۳ از ۱۶» را از فهرستِ والد می‌خواند.
     بدونِ این کال‌بک، افزودنِ بازیکن فهرست را عوض می‌کرد ولی آن عدد
     دست‌نخورده می‌ماند و به‌نظر می‌رسید هیچ اتفاقی نیفتاده. */
  onChanged?: () => void | Promise<void>
}) {
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncedAt, setSyncedAt] = useState('')
  const [err, setErr] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ playerName: '', phone: '', amount: '', note: '' })
  const [busy, setBusy] = useState(false)
  /* ── چرا confirm() مرورگر برداشته شد ──
     پنجره‌ی بومی انگلیسیِ چپ‌به‌راست است، نشانیِ سایت را بالای خودش
     می‌نویسد، و ظاهرش هیچ ربطی به بقیه‌ی پنل ندارد. برای کاری که
     برگشت‌ناپذیر است، لحظه‌ی تصمیم باید خوانا و آرام باشد. */
  const [pendingDelete, setPendingDelete] = useState<Reg | null>(null)
  /* پیامِ موفقیت — بعد از حذف، وگرنه ردیف بی‌صدا ناپدید می‌شود و
     کاربر مطمئن نیست کارِ او بود یا اشتباهی رخ داد. */
  const [toast, setToast] = useState('')

  const load = useCallback(async (spin = false) => {
    if (spin) setRefreshing(true)
    setErr('')
    try {
      const r = await apiFetch(`/api/tournaments/${tournamentId}/registrations`, { cache: 'no-store' })
      if (!r.ok) {
        setErr(r.status === 403 ? 'دسترسی به این مسابقه ندارید' : 'فهرست ثبت‌نام‌ها خوانده نشد')
        return
      }
      setData(await r.json() as Payload)
      /* نشانه‌ی دیدنی که «تازه‌سازی» واقعاً کاری کرد. بدونِ آن، وقتی
         چیزی عوض نشده باشد دکمه خراب به‌نظر می‌رسد. */
      setSyncedAt(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch {
      setErr('ارتباط با سرور برقرار نشد')
    } finally { setLoading(false); setRefreshing(false) }
  }, [tournamentId])

  useEffect(() => { void load() }, [load])

  /* هر تغییری که ظرفیت را جابه‌جا می‌کند، هم این فهرست و هم کارتِ
     والد را تازه می‌کند. */
  const reloadAll = async () => { await load(); await onChanged?.() }

  const addOffline = async () => {
    if (form.playerName.trim().length < 2) { setErr('نام بازیکن را وارد کنید'); return }
    setBusy(true); setErr('')
    try {
      const r = await apiFetch(`/api/tournaments/${tournamentId}/registrations`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: form.playerName.trim(),
          phone: form.phone.trim(),
          amount: form.amount.trim() === '' ? undefined : Number(form.amount.replace(/\D/g, '')),
          note: form.note.trim(),
        }),
      })
      const j = await r.json().catch(() => ({})) as { message?: string }
      if (!r.ok) { setErr(j.message ?? 'ثبت‌نام حضوری انجام نشد'); return }
      setForm({ playerName: '', phone: '', amount: '', note: '' })
      setShowAdd(false)
      await reloadAll()
    } catch { setErr('ارتباط با سرور برقرار نشد') } finally { setBusy(false) }
  }

  const confirmDelete = async () => {
    const target = pendingDelete
    if (!target) return
    const name = target.playerName || 'بی‌نام'
    setBusy(true); setErr('')
    try {
      const r = await apiFetch(
        `/api/tournaments/${tournamentId}/registrations?registrationId=${encodeURIComponent(target.id)}`,
        { method: 'DELETE' })
      const j = await r.json().catch(() => ({})) as { message?: string }
      if (!r.ok) { setErr(j.message ?? 'حذف انجام نشد'); return }
      setPendingDelete(null)
      await reloadAll()
      setToast(`${name} از فهرست ثبت‌نام‌کنندگان مسابقه حذف شد`)
      window.setTimeout(() => setToast(''), 5000)
    } catch { setErr('ارتباط با سرور برقرار نشد') } finally { setBusy(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 22 }}>
      <Loader2 size={18} color={GOLD} style={{ animation: 'treg-spin 0.9s linear infinite' }} />
      <style>{`@keyframes treg-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const regs = data?.registrations ?? []
  const active = regs.filter(r => r.status === 'CONFIRMED' || r.status === 'PENDING_PAYMENT')
  const others = regs.filter(r => !(r.status === 'CONFIRMED' || r.status === 'PENDING_PAYMENT'))
  const taken = active.length
  const max = data?.tournament.maxPlayers ?? 0
  const pending = active.filter(r => r.status === 'PENDING_PAYMENT').length

  return (
    <div style={{ marginTop: 14, borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 14 }}>
      <style>{`
        @keyframes treg-spin{to{transform:rotate(360deg)}}
        .treg-row{
          display:grid; align-items:center; gap:10px;
          grid-template-columns: 26px minmax(0,1fr) auto auto;
          padding:9px 12px; border-radius:12px; border:1px solid rgba(0,0,0,0.06);
        }
        /* ── چرا برچسب‌ها و مبلغ یک ستون شدند ──
           پیش‌تر هرکدام ستونِ خودش را داشت و در گوشی زیرِ هم می‌رفتند،
           یعنی هر ردیف سه سطر ارتفاع می‌گرفت و فهرستِ ده‌نفره کارت را
           بی‌دلیل بلند می‌کرد. حالا «حضوری/قطعی» و مبلغ در یک ستونِ
           راست‌چین کنارِ هم می‌نشینند — یک سطر، و چشم هم همه‌ی
           اطلاعاتِ مالیِ ردیف را یک‌جا می‌بیند. */
        .treg-meta{
          display:flex; align-items:center; justify-content:flex-end;
          gap:8px; flex-shrink:0;
        }
        /* ── موبایل ──
           ستونِ شماره ۲۶ پیکسل بود و با گپِ ۱۰ یعنی ۳۶ پیکسل فاصله تا
           نام — روی صفحه‌ی باریک این یک‌ششمِ عرض است و نام را هل
           می‌داد. حالا شماره ۱۶ و گپ ۶. */
        /* ── موبایل ──
           ستونِ شماره ۲۶ پیکسل بود و با گپِ ۱۰ یعنی ۳۶ پیکسل فاصله تا
           نام؛ روی صفحه‌ی باریک یک‌ششمِ عرض. حالا ۱۶ و ۶.

           دکمه‌ی حذف کنارِ ردیف می‌ماند و کوچک: یک‌بار تمام‌عرضش
           کردم و بیش از حد به چشم می‌آمد — عملی که به‌ندرت لازم
           می‌شود نباید پررنگ‌ترین چیزِ ردیف باشد. */
        @media (max-width: 640px){
          .treg-row{ grid-template-columns: 16px minmax(0,1fr) auto; gap:6px 8px; padding:8px 10px }
          .treg-meta{ grid-column: 2 / 3; justify-content:flex-start; flex-wrap:wrap; gap:6px }
          .treg-del{ grid-column: 3; grid-row: 1 / span 2 }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Users size={14} color={GOLD} />
        <span style={{ fontSize: 13, fontWeight: 800, color: DARK }}>ثبت‌نام‌کنندگان</span>
        <span style={{
          fontSize: 12, fontWeight: 800, borderRadius: 20, padding: '3px 10px',
          background: taken >= max ? 'rgba(239,68,68,0.09)' : 'rgba(199,166,106,0.12)',
          color: taken >= max ? '#B91C1C' : '#A07840',
        }}>{fa(taken)} از {fa(max)} نفر</span>

        {syncedAt && !refreshing && (
          <span style={{ fontSize: 10.5, color: '#9CA3AF' }}>آخرین به‌روزرسانی {syncedAt}</span>
        )}

        {/* ── چرا این دو کنارِ هم و سمتِ چپ‌اند ──
            «تازه‌سازی» وسطِ ردیف بود و «ثبت‌نام حضوری» ته‌ی آن، با
            ارتفاع و حاشیه‌ی متفاوت. هر دو دکمه‌ی عمل‌اند و باید یک
            گروه دیده شوند؛ عنوان و شمارنده سمتِ راست می‌مانند. */}
        <span style={{
          marginInlineStart: 'auto', display: 'inline-flex',
          alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <button type="button" onClick={() => void load(true)} disabled={refreshing || busy}
            style={{ ...actionBtn, opacity: refreshing ? 0.6 : 1 }}>
            <RefreshCw size={13} style={refreshing ? { animation: 'treg-spin 0.9s linear infinite' } : undefined} />
            {refreshing ? 'در حال خواندن…' : 'تازه‌سازی'}
          </button>

          <button type="button" onClick={() => setShowAdd(v => !v)} disabled={busy}
            style={{ ...actionBtn, border: `1px solid ${GOLD}`, background: '#FFFBF0', color: '#A07840' }}>
            <UserPlus size={13} /> ثبت‌نام حضوری
          </button>
        </span>
      </div>

      {err && (
        <div style={{
          fontSize: 12, color: '#B91C1C', background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
          padding: '9px 12px', marginBottom: 10,
        }}>{err}</div>
      )}

      {pending > 0 && (
        <div style={{
          fontSize: 11.5, color: '#92400E', background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.22)', borderRadius: 10,
          padding: '8px 12px', marginBottom: 10, lineHeight: 1.9,
        }}>
          {fa(pending)} ثبت‌نام در انتظار پرداخت است. اگر تا ۱۵ دقیقه پرداخت نشود،
          خودکار منقضی می‌شود و صندلی‌اش آزاد می‌گردد.
        </div>
      )}

      {showAdd && (
        <div style={{
          background: '#FAFAF8', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 14, padding: 14, marginBottom: 12,
        }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, lineHeight: 1.9 }}>
            برای کسی که تلفنی یا حضوری ثبت‌نام کرده. این نفر یک صندلی می‌گیرد و
            در شمارشِ ظرفیت و قرعه‌کشی حساب می‌شود.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
            {([
              { k: 'playerName', ph: 'نام و نام خانوادگی', label: 'نام بازیکن' },
              { k: 'phone', ph: '۰۹۱۲…', label: 'شماره تماس (اختیاری)' },
              { k: 'amount', ph: 'خالی = ورودیِ مسابقه', label: 'مبلغ دریافتی (اختیاری)' },
              { k: 'note', ph: 'تلفنی / حضوری / مهمان', label: 'توضیح (اختیاری)' },
            ] as const).map(f => (
              <div key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11.5, color: '#6B7280' }}>{f.label}</label>
                <input
                  value={form[f.k]} placeholder={f.ph}
                  onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                  style={{
                    padding: '9px 11px', borderRadius: 10, fontSize: 13,
                    border: '1px solid #E5E7EB', fontFamily: 'var(--font-base)',
                    background: '#fff', width: '100%', boxSizing: 'border-box',
                  }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => void addOffline()} disabled={busy}
              style={{
                padding: '8px 16px', borderRadius: 10, cursor: busy ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-base)',
                border: `1px solid ${GOLD}`, background: '#FFFBF0', color: '#A07840',
                opacity: busy ? 0.6 : 1,
              }}>{busy ? 'در حال ثبت…' : 'افزودن'}</button>
            <button type="button" onClick={() => { setShowAdd(false); setErr('') }}
              style={ghostBtn}>انصراف</button>
          </div>
        </div>
      )}

      {regs.length === 0 ? (
        <div style={{ fontSize: 12.5, color: '#9CA3AF', padding: '14px 2px' }}>
          هنوز کسی ثبت‌نام نکرده است.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[...active, ...others].map((r, i) => {
            const st = statusOf(r)
            const dim = !(r.status === 'CONFIRMED' || r.status === 'PENDING_PAYMENT')
            return (
              <div key={r.id} className="treg-row" style={{
                background: dim ? 'rgba(0,0,0,0.02)' : '#fff',
                opacity: dim ? 0.65 : 1,
              }}>
                <span style={{
                  fontSize: 11.5, fontWeight: 800, color: '#9CA3AF',
                  textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                }}>{dim ? '—' : fa(i + 1)}</span>

                <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{
                    fontSize: 13.5, fontWeight: 700, color: DARK,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{r.playerName || 'بی‌نام'}</span>
                  {r.phone && (
                    <a href={`tel:${r.phone}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11.5, color: '#6B7280', textDecoration: 'none',
                    }}><Phone size={10} /> {fa(r.phone)}</a>
                  )}
                </span>

                <span className="treg-meta">
                  {/* ── چرا هر دو برچسب دارند ──
                      پیش‌تر فقط «حضوری» برچسب داشت و آنلاین‌ها خالی
                      می‌ماندند. نبودِ برچسب دو معنی داشت — «اینترنتی»
                      یا «هنوز مشخص نیست» — و برگزارکننده مجبور بود از
                      روی نبودِ چیزی نتیجه بگیرد. حالا هر ردیف صریحاً
                      می‌گوید پول از کدام راه آمده. */}
                  <span style={{
                    fontSize: 10.5, fontWeight: 800, borderRadius: 20, padding: '2px 8px',
                    whiteSpace: 'nowrap',
                    background: r.source === 'offline'
                      ? 'rgba(139,92,246,0.10)' : 'rgba(14,165,233,0.10)',
                    color: r.source === 'offline' ? '#6D28D9' : '#0369A1',
                  }}>{r.source === 'offline' ? 'حضوری' : 'اینترنتی'}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '3px 9px',
                    background: st.bg, color: st.color, whiteSpace: 'nowrap',
                  }}>{st.label}</span>
                  <span style={{
                    fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{money(r.amount)}</span>
                </span>

                <span className="treg-del">
                  {r.source === 'offline' ? (
                    <button type="button" onClick={() => setPendingDelete(r)} disabled={busy}
                      aria-label={`حذف ${r.playerName || 'بی‌نام'}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '6px 10px', borderRadius: 9, fontSize: 11.5, fontWeight: 700,
                        border: '1px solid rgba(239,68,68,0.26)', background: 'rgba(239,68,68,0.06)',
                        color: '#dc2626', cursor: busy ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-base)', whiteSpace: 'nowrap',
                      }}><Trash2 size={11} /> حذف</button>
                  ) : <span />}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {data && (
        <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 10, lineHeight: 1.9 }}>
          جمعِ دریافتی از ثبت‌نام‌های قطعی: {money(data.totals.gross)}
          {data.totals.refunded > 0 && <> · بازپرداخت‌شده: {money(data.totals.refunded)}</>}
        </div>
      )}

      {/* ── پنجره‌ی تأییدِ حذف ──
          نامِ بازیکن داخلِ متن است، نه فقط «مطمئنید؟»: کاربر باید
          ببیند دقیقاً کدام ردیف قرار است برود. دکمه‌ی خطرناک عمداً
          سمتِ چپ و دومی است تا با یک کلیکِ عادتی زده نشود. */}
      {pendingDelete && (
        <div role="dialog" aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget && !busy) setPendingDelete(null) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(12,10,8,0.55)', backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 18, animation: 'treg-fade .16s ease both',
          }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 380,
            padding: '26px 24px 20px', textAlign: 'center',
            boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
            border: '1px solid rgba(0,0,0,0.06)',
            animation: 'treg-pop .2s cubic-bezier(.22,1,.36,1) both',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(239,68,68,0.09)', border: '1.5px solid rgba(239,68,68,0.26)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={24} color="#dc2626" />
            </div>

            <div style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 8 }}>
              حذف ثبت‌نام
            </div>
            <div style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 2.05, marginBottom: 20 }}>
              ثبت‌نام <b style={{ color: DARK }}>{pendingDelete.playerName || 'بی‌نام'}</b> از
              این مسابقه حذف شود؟ صندلی‌اش آزاد می‌شود و این کار برگشت‌پذیر نیست.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              <button type="button" disabled={busy} onClick={() => setPendingDelete(null)}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '11px 14px', borderRadius: 12, fontSize: 13.5, fontWeight: 700,
                  border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.03)',
                  color: '#6B7280', cursor: busy ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-base)',
                }}><X size={14} /> انصراف</button>

              <button type="button" disabled={busy} onClick={() => void confirmDelete()}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '11px 14px', borderRadius: 12, fontSize: 13.5, fontWeight: 800,
                  border: '1px solid #dc2626', background: '#dc2626', color: '#fff',
                  cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-base)',
                  opacity: busy ? 0.65 : 1,
                }}>
                {busy
                  ? <><Loader2 size={14} style={{ animation: 'treg-spin .9s linear infinite' }} /> در حال حذف…</>
                  : <><Trash2 size={14} /> حذف کن</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* پیامِ موفقیت */}
      {toast && (
        <div role="status" style={{
          position: 'fixed', insetInlineStart: '50%', bottom: 22, zIndex: 10000,
          transform: 'translateX(50%)', maxWidth: 'min(92vw,420px)',
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '12px 16px', borderRadius: 14,
          background: '#14311F', color: '#EAF6EE',
          fontSize: 13, fontWeight: 700, lineHeight: 1.8,
          boxShadow: '0 14px 40px rgba(0,0,0,0.30)',
          animation: 'treg-toast .24s cubic-bezier(.22,1,.36,1) both',
        }}>
          <Check size={16} color="#4ADE80" style={{ flexShrink: 0 }} />
          <span>{toast}</span>
        </div>
      )}

      <style>{`
        @keyframes treg-fade{ from{opacity:0} to{opacity:1} }
        @keyframes treg-pop{ from{opacity:0;transform:translateY(10px) scale(.98)} to{opacity:1;transform:none} }
        @keyframes treg-toast{ from{opacity:0;transform:translateX(50%) translateY(12px)} to{opacity:1;transform:translateX(50%)} }
      `}</style>
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '5px 11px', borderRadius: 9, fontSize: 11.5, fontWeight: 700,
  border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.03)',
  color: '#6B7280', cursor: 'pointer', fontFamily: 'var(--font-base)',
}

/* دکمه‌های عملِ سرستون — هم‌ارتفاع و هم‌شکل، تا یک گروه دیده شوند */
const actionBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
  border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.03)',
  color: '#6B7280', cursor: 'pointer', fontFamily: 'var(--font-base)',
  lineHeight: 1.2,
}
