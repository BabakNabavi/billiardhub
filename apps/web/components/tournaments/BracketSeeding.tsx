'use client'

/* ─────────────────────────────────────────────────────────────
   چیدنِ دستیِ براکت.

   ── چرا لازم است ──
   قرعه‌کشیِ تصادفی برای برگزارکننده‌ی واقعی کافی نیست: بازیکنانِ
   هم‌باشگاه نباید دورِ اول به هم بخورند، نفراتِ سیدشده باید در دو
   نیمه‌ی متفاوت بیفتند، و کسی که دیر می‌رسد باید بازیِ دیرتری
   بگیرد. همه‌ی این‌ها یعنی جابه‌جاییِ دستی.

   نسخه‌ی قبلیِ سایت این را داشت ولی فقط در حافظه‌ی مرورگر می‌ماند و
   با رفرش می‌رفت. حالا هر جابه‌جایی همان لحظه در دیتابیس ثبت
   می‌شود.

   ── چرا فقط دورِ اول ──
   جایگاه‌های دورهای بعد را نتیجه‌ی بازی پر می‌کند، نه دستِ
   برگزارکننده. سرور هم مستقل همین را بررسی می‌کند.

   ── دو شیوه‌ی تعامل ──
   دسکتاپ درگ‌اند‌دراپ دارد. موبایل ندارد (لمس، درگِ HTML5 را
   شلیک نمی‌کند)، پس همان‌جا «انتخاب کن، بعد مقصد را بزن» کار
   می‌کند. هر دو به یک API می‌رسند.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react'
import { Shuffle, Eraser, Users, Loader2, Info, CheckCircle2 } from 'lucide-react'
import {
  fetchBracket, fetchSeedingPool, swapSlots, placeSlot, clearSlots, finalizeSeeding,
  faDigits, type Bracket, type Match, type PoolPlayer,
} from '../../lib/tournaments/bracket-client'

const GOLD = '#C7A66A', GOLD_D = '#9A6E38', INK = '#1C1B17'
const MUT = '#8A8474', LINE = '#EAE5DA'

/** یک جایگاه: کدام بازی، کدام طرف */
interface SlotRef { matchId: string; slot: 1 | 2 }
/** آنچه در دست است — از استخر، از یک جایگاه، یا یک «بای» */
type Held =
  | { from: 'pool'; player: PoolPlayer }
  | { from: 'slot'; ref: SlotRef; name: string }
  | { from: 'bye' }

export default function BracketSeeding({ tournamentId, onChanged }: {
  tournamentId: string
  onChanged?: () => void | Promise<void>
}) {
  const [b, setB] = useState<Bracket | null>(null)
  const [pool, setPool] = useState<PoolPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [held, setHeld] = useState<Held | null>(null)
  const [hover, setHover] = useState<string>('')

  const load = useCallback(async () => {
    const [br, sp] = await Promise.all([
      fetchBracket(tournamentId), fetchSeedingPool(tournamentId),
    ])
    setB(br); setPool(sp?.pool ?? [])
    setLoading(false)
  }, [tournamentId])

  useEffect(() => { void load() }, [load])

  /* هر عملی که موفق شود، هم این صفحه هم صفحه‌ی والد تازه می‌شود —
     شمارنده‌ی «چیده‌نشده» بالای همین کارت از همان می‌آید. */
  const after = async (r: { ok: boolean; body: { message?: string } }) => {
    if (!r.ok) { setErr(r.body.message ?? 'انجام نشد'); return false }
    setErr(''); await load(); await onChanged?.(); return true
  }

  const round1 = (b?.matches ?? []).filter(m => m.round === 1)
  const mid = round1.length / 2
  const rightHalf = round1.filter(m => m.match_index < mid)
  const leftHalf = round1.filter(m => m.match_index >= mid)

  /* ── مقصدِ یک رهاکردن ── */
  const dropOn = async (ref: SlotRef) => {
    if (!held || busy) return
    setBusy(true)
    try {
      if (held.from === 'bye') {
        /* بای یک واقعیتِ ذخیره‌شده است، نه «خالی». تا مهاجرتِ ۰۷۵
           همین‌جا `null` فرستاده می‌شد — یعنی «خالی کن» — و چون
           جایگاه از قبل خالی بود، هیچ‌چیز عوض نمی‌شد و تراشه سرِ
           جایش برمی‌گشت. */
        await after(await placeSlot(tournamentId, ref.matchId, ref.slot, null, true))
      } else if (held.from === 'pool') {
        await after(await placeSlot(tournamentId, ref.matchId, ref.slot, held.player.id))
      } else {
        /* جایگاه به جایگاه ⇒ تعویض. با «انتساب» ساکنِ مقصد بی‌صدا
           حذف می‌شد و چون همه‌ی جایگاه‌ها پر به‌نظر می‌رسند، تا روزِ
           مسابقه کسی نمی‌فهمید. */
        await after(await swapSlots(tournamentId, held.ref, ref))
      }
    } finally { setBusy(false); setHeld(null); setHover('') }
  }

  /* پس‌گرفتنِ یک بای — بدونِ این، جایگاهی که اشتباهی بای شده هیچ
     راهی برای برگشتن نداشت جز «خالی‌کردن همه». */
  const clearBye = async (ref: SlotRef) => {
    if (busy) return
    setBusy(true)
    try { await after(await placeSlot(tournamentId, ref.matchId, ref.slot, null, false)) }
    finally { setBusy(false); setHeld(null); setHover('') }
  }

  /* رهاکردن روی استخر = برداشتنِ بازیکن از براکت */
  const dropOnPool = async () => {
    if (!held || held.from !== 'slot' || busy) return
    setBusy(true)
    try {
      await after(await placeSlot(tournamentId, held.ref.matchId, held.ref.slot, null))
    } finally { setBusy(false); setHeld(null); setHover('') }
  }

  const doShuffle = async () => {
    setBusy(true)
    try {
      /* قرعه‌کشیِ دوباره روی براکتِ موجود رد می‌شود، پس اول خالی و بعد
         پر می‌کنیم — همان کاری که «قرعه‌کشی مجدد» باید بکند. */
      const cleared = await clearSlots(tournamentId)
      if (!cleared.ok) { setErr(cleared.body.message ?? 'انجام نشد'); return }
      /* چیدنِ تصادفیِ استخر در جایگاه‌های خالی */
      const fresh = await fetchSeedingPool(tournamentId)
      const players = shuffle(fresh?.pool ?? [])
      const slots: SlotRef[] = []
      for (const m of round1) {
        slots.push({ matchId: m.id, slot: 1 })
        slots.push({ matchId: m.id, slot: 2 })
      }
      for (let i = 0; i < players.length && i < slots.length; i++) {
        const r = await placeSlot(tournamentId, slots[i]!.matchId, slots[i]!.slot, players[i]!.id)
        if (!r.ok) { setErr(r.body.message ?? 'انجام نشد'); break }
      }
      await load(); await onChanged?.()
    } finally { setBusy(false) }
  }

  /* پیامِ موفقیت — کوتاه و خودرو. بدونِ آن، تأییدِ چیدمان هیچ
     بازخوردی نداشت جز اینکه چند برچسب عوض می‌شد. */
  const [done, setDone] = useState('')
  const doFinalize = async () => {
    setBusy(true)
    try {
      const ok = await after(await finalizeSeeding(tournamentId))
      if (ok) { setDone('چیدمان تأیید شد — جدول آماده‌ی شروع است'); window.setTimeout(() => setDone(''), 4500) }
    }
    finally { setBusy(false) }
  }

  const doClear = async () => {
    setBusy(true)
    try { await after(await clearSlots(tournamentId)) }
    finally { setBusy(false); setHeld(null) }
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: MUT }}>
      <Loader2 size={22} style={{ animation: 'bsp 1s linear infinite' }} />
      <style>{`@keyframes bsp{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!b || !round1.length) return (
    <div style={{ ...card, textAlign: 'center', padding: '40px 20px', color: MUT, fontSize: 13 }}>
      اول براکت را بسازید؛ بعد می‌توانید جایگاه‌ها را دستی بچینید.
    </div>
  )

  /* ── چرا «بای» شروعِ مسابقه نیست ──
     بازیِ تک‌نفره از همان لحظه‌ی ساخت برنده دارد. اگر آن را «نتیجه»
     بشماریم، به‌محضِ تأییدِ چیدمان همه‌چیز قفل می‌شد و پیامِ
     «نتیجه‌ای ثبت شده» می‌آمد — در حالی که هیچ بازی‌ای انجام نشده
     بود. مسابقه وقتی شروع شده که یک بازیِ **واقعی** نتیجه گرفته
     باشد. سرور هم همین تعریف را دارد (مهاجرت ۰۷۳). */
  const started = b.matches.some(m =>
    m.winner !== null && !!m.p1_registration_id && !!m.p2_registration_id)

  /* ── چیپ‌های بای ──
     جدولِ ۱۶تایی با ۱۳ بازیکن، سه جایگاهِ خالی دارد. بدونِ چیزی که
     نماینده‌ی آن خالی‌ها باشد، برگزارکننده نمی‌داند کجا را خالی
     بگذارد و «تأیید چیدمان» هم می‌گوید چیدمان ناقص است.

     گذاشتنِ بای روی جایگاه یعنی «این جایگاه بی‌حریف بماند»، و کسی
     که روبه‌رویش است خودکار صعود می‌کند.

     `placedByes` از خودِ جدول شمرده می‌شود، نه از حافظه‌ی مرورگر:
     تا مهاجرتِ ۰۷۵ بای هیچ‌جا ذخیره نمی‌شد، پس این عدد هرگز کم
     نمی‌شد و «تأیید چیدمان» — که شرطش صفرشدنِ همین است — برای
     جدولی که تعدادِ بازیکنش توانِ دو نبود هیچ‌وقت فعال نمی‌شد. */
  const totalSlots = round1.length * 2
  const filled = round1.reduce((n, m) =>
    n + (m.p1_registration_id ? 1 : 0) + (m.p2_registration_id ? 1 : 0), 0)
  const placedByes = round1.reduce((n, m) =>
    n + (m.p1_bye && !m.p1_registration_id ? 1 : 0)
      + (m.p2_bye && !m.p2_registration_id ? 1 : 0), 0)
  const byeCount = Math.max(0, totalSlots - filled - pool.length - placedByes)

  return (
    <div>
      <style>{`
        @keyframes bsp{to{transform:rotate(360deg)}}
        .bs-grid{ display:grid; grid-template-columns: 230px minmax(0,1fr); gap:14px; align-items:start }
        @media (max-width: 780px){ .bs-grid{ grid-template-columns:1fr } }
        .bs-halves{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px }
        @media (max-width: 560px){ .bs-halves{ grid-template-columns:1fr } }

        /* ── فهرستِ چیده‌نشده‌ها ──
           تک‌ستونه بود و با ۱۶ بازیکن آن‌قدر بلند می‌شد که در گوشی
           باید تا انتهایش اسکرول می‌کردی تا به خودِ جدول برسی. دو
           ستون همان فهرست را نصف می‌کند. */
        .bs-pool{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px }
        @media (min-width: 781px){ .bs-pool{ grid-template-columns:1fr } }
      `}</style>

      {started && (
        <div style={{ ...notice, borderColor: 'rgba(178,59,46,0.28)', background: 'rgba(178,59,46,0.06)', color: '#8A2A20' }}>
          <Info size={14} /> نتیجه‌ای ثبت شده — جایگاه‌ها دیگر قابل جابه‌جایی نیستند.
        </div>
      )}

      {!started && (
        <div style={notice}>
          <Info size={14} />
          <span>
            بازیکن را از فهرست بکشید روی جایگاه، یا دو جایگاه را روی هم بیندازید تا جابه‌جا شوند.
            در گوشی: یک‌بار روی بازیکن بزنید، بعد روی جایگاه.
            تراشه‌ی قرمزِ <b>Bye</b> هم مثلِ بازیکن گذاشته می‌شود؛ زدن روی جایگاهِ بای پسش می‌گیرد.
          </span>
        </div>
      )}

      {err && <div style={{ ...notice, borderColor: 'rgba(178,59,46,0.28)', background: 'rgba(178,59,46,0.06)', color: '#8A2A20' }}>{err}</div>}

      {done && (
        <div style={{
          ...notice, borderColor: 'rgba(14,122,56,0.28)',
          background: 'rgba(14,122,56,0.07)', color: '#0E7A38', fontWeight: 700,
        }}><CheckCircle2 size={14} /> {done}</div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button type="button" disabled={busy || started} onClick={() => void doShuffle()} style={btn(!busy && !started)}>
          {busy ? <Loader2 size={13} style={{ animation: 'bsp 1s linear infinite' }} /> : <Shuffle size={13} />}
          چیدنِ تصادفی
        </button>
        <button type="button" disabled={busy || started} onClick={() => void doClear()} style={btn(!busy && !started, true)}>
          <Eraser size={13} /> خالی‌کردن همه
        </button>
        {/* «تازه‌سازی» برداشته شد: هر عملِ موفق خودش `load()` را صدا
            می‌زند، پس دکمه فقط همان چیزی را دوباره می‌خواند که همین
            الان روی صفحه است. */}

        {/* ── تأییدِ چیدمان ──
            بازی‌هایی که یک طرفشان خالی مانده باید بای شوند و
            برنده‌شان به دورِ دوم برود — همان کاری که قرعه‌کشیِ
            خودکار در لحظه‌ی ساخت می‌کند. بدونِ این، جدولی که دستی
            چیده شده جایگاه‌های دورِ دوم را خالی نگه می‌دارد و
            به‌نظر می‌رسد نصفه است. */}
        <button type="button" disabled={busy || started || pool.length > 0 || byeCount > 0}
          onClick={() => void doFinalize()}
          style={{ ...btn(!busy && !started && pool.length === 0 && byeCount === 0), marginInlineStart: 'auto' }}>
          <CheckCircle2 size={13} /> تأیید چیدمان
        </button>
      </div>

      {(pool.length > 0 || byeCount > 0) && !started && (
        <div style={{ fontSize: 11.5, color: MUT, marginBottom: 12, lineHeight: 1.9 }}>
          تا وقتی چیزی در فهرستِ «چیده‌نشده» مانده — بازیکن یا بای — چیدمان تأیید نمی‌شود.
        </div>
      )}

      <div className="bs-grid">
        {/* ── استخرِ چیده‌نشده‌ها ── */}
        <div
          onDragOver={e => { if (held?.from === 'slot') { e.preventDefault(); setHover('pool') } }}
          onDragLeave={() => setHover('')}
          onDrop={e => { e.preventDefault(); void dropOnPool() }}
          onClick={() => { if (held?.from === 'slot') void dropOnPool() }}
          style={{
            ...card, padding: 12, minHeight: 120,
            borderColor: hover === 'pool' ? GOLD : LINE,
            background: hover === 'pool' ? 'rgba(199,166,106,0.06)' : '#fff',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Users size={13} color={GOLD_D} />
            <span style={{ fontSize: 12.5, fontWeight: 800, color: INK }}>چیده‌نشده</span>
            <span style={{
              marginInlineStart: 'auto', fontSize: 11, fontWeight: 800,
              color: GOLD_D, background: 'rgba(199,166,106,0.12)',
              borderRadius: 999, padding: '2px 8px',
            }}>{faDigits(pool.length)}</span>
          </div>

          {pool.length === 0 && byeCount === 0 ? (
            <div style={{ fontSize: 11.5, color: MUT, lineHeight: 1.9 }}>
              همه‌ی جایگاه‌ها پر شده‌اند.
            </div>
          ) : (
            <div className="bs-pool">
              {pool.map(p => {
                const on = held?.from === 'pool' && held.player.id === p.id
                return (
                  <div key={p.id}
                    draggable={!started}
                    onDragStart={() => setHeld({ from: 'pool', player: p })}
                    onDragEnd={() => { setHeld(null); setHover('') }}
                    onClick={e => {
                      e.stopPropagation()
                      if (started) return
                      setHeld(on ? null : { from: 'pool', player: p })
                    }}
                    style={{
                      padding: '8px 10px', borderRadius: 9, fontSize: 12.5, fontWeight: 700,
                      color: on ? '#fff' : INK,
                      background: on ? GOLD_D : '#FAF8F3',
                      border: `1px solid ${on ? GOLD_D : LINE}`,
                      cursor: started ? 'default' : 'grab',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{p.name}</div>
                )
              })}

              {/* ── بای ──
                  بعد از بازیکن‌ها، چون بازیکن است که چیده می‌شود و
                  بای چیزی است که از جدول اضافه می‌آید. قرمز هم برای
                  همین: تراشه‌ای که رنگِ بازیکن داشته باشد، ناخواسته
                  مثلِ یک نفرِ دیگر خوانده می‌شود. */}
              {Array.from({ length: byeCount }).map((_, i) => {
                const on = held?.from === 'bye'
                return (
                  <div key={`bye-${i}`}
                    draggable={!started}
                    onDragStart={() => setHeld({ from: 'bye' })}
                    onDragEnd={() => { setHeld(null); setHover('') }}
                    onClick={e => { e.stopPropagation(); if (!started) setHeld(on ? null : { from: 'bye' }) }}
                    style={{
                      padding: '8px 10px', borderRadius: 9, fontSize: 12.5, fontWeight: 800,
                      color: on ? '#fff' : '#B23B2E',
                      background: on ? '#B23B2E' : 'rgba(178,59,46,0.09)',
                      border: `1px dashed ${on ? '#B23B2E' : 'rgba(178,59,46,0.45)'}`,
                      cursor: started ? 'default' : 'grab',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 6, overflow: 'hidden',
                    }}>
                    <span>Bye</span>
                    <span style={{ fontSize: 10, opacity: 0.75, whiteSpace: 'nowrap' }}>بدون حریف</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── جایگاه‌های دورِ اول، دو نیمه ── */}
        <div className="bs-halves">
          <HalfColumn title="نیمه‌ی راست" matches={rightHalf}
            held={held} hover={hover} setHover={setHover} setHeld={setHeld}
            onDrop={dropOn} onClearBye={clearBye} started={started} />
          <HalfColumn title="نیمه‌ی چپ" matches={leftHalf}
            held={held} hover={hover} setHover={setHover} setHeld={setHeld}
            onDrop={dropOn} onClearBye={clearBye} started={started} />
        </div>
      </div>
    </div>
  )
}

/* ── یک نیمه ─────────────────────────────────────────────────── */
function HalfColumn({ title, matches, held, hover, setHover, setHeld, onDrop, onClearBye, started }: {
  title: string; matches: Match[]
  held: Held | null; hover: string
  setHover: (v: string) => void
  setHeld: (h: Held | null) => void
  onDrop: (ref: SlotRef) => void | Promise<void>
  onClearBye: (ref: SlotRef) => void | Promise<void>
  started: boolean
}) {
  return (
    <div style={{ ...card, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: MUT, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {matches.map(m => (
          <div key={m.id} style={{ border: `1px solid ${LINE}`, borderRadius: 11, padding: 8 }}>
            <div style={{ fontSize: 10, color: MUT, marginBottom: 5 }}>بازی #{faDigits(m.match_index + 1)}</div>
            {([1, 2] as const).map(slot => {
              const name = slot === 1 ? m.p1_name : m.p2_name
              const isBye = !name && (slot === 1 ? m.p1_bye : m.p2_bye) === true
              const key = `${m.id}:${slot}`
              const isHover = hover === key
              const isHeld = held?.from === 'slot'
                && held.ref.matchId === m.id && held.ref.slot === slot
              return (
                <div key={slot}
                  draggable={!started && !!name}
                  onDragStart={() => name && setHeld({ from: 'slot', ref: { matchId: m.id, slot }, name })}
                  onDragEnd={() => { setHeld(null); setHover('') }}
                  onDragOver={e => { if (held) { e.preventDefault(); setHover(key) } }}
                  onDragLeave={() => setHover('')}
                  onDrop={e => { e.preventDefault(); void onDrop({ matchId: m.id, slot }) }}
                  onClick={() => {
                    if (started) return
                    /* چیزی در دست است ⇒ همین‌جا بگذار. چیزی در دست
                       نیست ⇒ این را بردار — و اگر بای است، پسش بگیر. */
                    if (held) void onDrop({ matchId: m.id, slot })
                    else if (name) setHeld({ from: 'slot', ref: { matchId: m.id, slot }, name })
                    else if (isBye) void onClearBye({ matchId: m.id, slot })
                  }}
                  style={{
                    padding: '8px 10px', borderRadius: 8, marginBottom: slot === 1 ? 5 : 0,
                    fontSize: 12.5, fontWeight: name || isBye ? 700 : 500,
                    color: isHeld ? '#fff' : name ? INK : isBye ? '#B23B2E' : MUT,
                    background: isHeld ? GOLD_D
                      : isHover ? 'rgba(199,166,106,0.14)'
                      : isBye ? 'rgba(178,59,46,0.07)' : '#FAF8F3',
                    border: `1px dashed ${isHover ? GOLD : isBye ? 'rgba(178,59,46,0.4)' : 'transparent'}`,
                    cursor: started ? 'default' : 'pointer',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    transition: 'background .14s, border-color .14s',
                  }}>{name ?? (isBye ? 'Bye' : '— خالی —')}</div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function shuffle<T>(a: T[]): T[] {
  const x = [...a]
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[x[i], x[j]] = [x[j]!, x[i]!]
  }
  return x
}

const card: React.CSSProperties = {
  background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14,
}
const notice: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 7,
  fontSize: 12, lineHeight: 1.95, color: '#6B5B3A',
  background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.26)',
  borderRadius: 11, padding: '9px 12px', marginBottom: 12,
}
function btn(on: boolean, ghost = false): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
    fontFamily: 'var(--font-base)', cursor: on ? 'pointer' : 'not-allowed',
    opacity: on ? 1 : 0.5,
    border: `1px solid ${ghost ? 'rgba(0,0,0,0.12)' : GOLD}`,
    background: ghost ? 'rgba(0,0,0,0.03)' : '#FFFBF0',
    color: ghost ? '#6B7280' : GOLD_D,
  }
}
