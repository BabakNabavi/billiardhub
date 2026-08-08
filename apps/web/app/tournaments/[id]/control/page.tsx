'use client';

/* ─────────────────────────────────────────────────────────────
   مدیریتِ زنده — پنجره‌ی جدا.

   ── چرا صفحه‌ی جدا و نه کشویی روی خودِ مانیتور ──
   نسخه‌ی اول یک کشوی کناری روی صفحه‌ی نمایشِ بزرگ بود. یعنی همان
   لحظه‌ای که اپراتور می‌خواست نتیجه را ثبت کند، جدول را از دیدِ
   تماشاگر می‌پوشاند — دقیقاً برعکسِ کاری که آن مانیتور برای آن
   هست.

   حالا دو نشانیِ جداست: مانیتور روی پروژکتور می‌ماند و این صفحه
   روی گوشی یا لپ‌تاپِ اپراتور باز می‌شود. هیچ‌کدام مزاحمِ دیگری
   نیست، و چون هر دو از یک منبع می‌خوانند، هر تغییری در بازخوانیِ
   بعدیِ مانیتور دیده می‌شود.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Radio, ChevronRight, Table2, Check } from 'lucide-react';
import {
  fetchBracket, reportResult, liveScore, patchMatch, setHighBreak,
  formatTarget, frameCap, tournamentHighBreak, faDigits,
  type Bracket, type Match,
} from '../../../../lib/tournaments/bracket-client';

/* پهنای ثابتِ ستونِ برک: سرستون و خودِ فیلد هر دو از همین می‌گیرند،
   وگرنه عنوان دقیقاً بالای کادر نمی‌نشیند. */
const BRK_W = 66;
const GOLD_D = '#9A6E38', INK = '#1C1B17';
const MUT = '#8A8474', LINE = '#EAE5DA', BG = '#F7F6F2';

export default function LiveControlPage() {
  const params = useParams();
  const id = String(params?.id ?? '');

  const [b, setB] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, [number, number]>>({});
  const [tables, setTables] = useState<Record<string, string>>({});
  /* برک برای هر بازیکن جدا — کلید: `{matchId}:{1|2}` */
  const [breaks, setBreaks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    setB(await fetchBracket(id));
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  /* اپراتور ممکن است از دستگاهِ دیگری هم چیزی ثبت کند */
  useEffect(() => {
    const t = setInterval(() => void load(), 12000);
    return () => clearInterval(t);
  }, [load]);

  const flash = (m: string) => { setOk(m); setTimeout(() => setOk(''), 2500); };

  if (loading) return (
    <Shell><Loader2 size={30} color={GOLD_D} style={{ animation: 'lc 1s linear infinite' }} /></Shell>
  );
  if (!b || !b.matches.length) return (
    <Shell><span style={{ color: MUT, fontSize: 16 }}>هنوز قرعه‌کشی نشده</span></Shell>
  );

  const playable = b.matches.filter(m => m.winner === null && m.p1_name && m.p2_name);
  const target = formatTarget(b.tournament.match_format);
  const best = tournamentHighBreak(b);

  const get = (m: Match): [number, number] => scores[m.id] ?? [m.score1 ?? 0, m.score2 ?? 0];
  /* ── سقف به حریف هم بستگی دارد ──
     در Best of 5 هدف ۳ است، ولی ۳–۳ وجود ندارد: تا یکی به ۳ برسد
     بازی تمام است و بازنده حداکثر ۲ می‌گیرد. سقف هر طرف پس از
     امتیازِ طرفِ مقابل حساب می‌شود. */
  const bump = (m: Match, side: 0 | 1, d: number) => {
    const cur = get(m);
    const next: [number, number] = [...cur] as [number, number];
    next[side] = Math.max(0, Math.min(frameCap(target, cur[side === 0 ? 1 : 0]), next[side] + d));
    setScores(s => ({ ...s, [m.id]: next }));
  };

  const saveBreak = async (m: Match, player: 1 | 2) => {
    const key = `${m.id}:${player}`;
    const raw = (breaks[key] ?? '').trim();
    const v = raw === '' ? null : Number(raw);
    if (v !== null && (!Number.isFinite(v) || v < 0 || v > 200)) {
      setErr('مقدار برک معتبر نیست'); return;
    }
    setBusy(m.id); setErr('');
    const r = await setHighBreak(id, m.id, player, v);
    setBusy('');
    if (!r.ok) { setErr(r.body.message ?? 'ثبت برک انجام نشد'); return; }
    /* اگر از همه بالاتر بود، همان‌جا گفته می‌شود — وگرنه اپراتور
       نمی‌فهمد چیزی که ثبت کرد روی مانیتور می‌رود یا نه. */
    flash(v === null ? 'برک پاک شد'
      : (!best || v > best.value) ? `بالاترین برکِ مسابقه شد — ${faDigits(v)}`
      : `برک ${faDigits(v)} ثبت شد (بالاترین: ${faDigits(best.value)})`);
    await load();
  };

  const push = async (m: Match) => {
    const [a, c] = get(m);
    setBusy(m.id); setErr('');
    const r = await liveScore(id, m.id, a, c);
    setBusy('');
    if (!r.ok) { setErr(r.body.message ?? 'ثبت امتیاز انجام نشد'); return; }
    flash('امتیاز روی مانیتور به‌روز شد');
    await load();
  };

  const finish = async (m: Match) => {
    const [a, c] = get(m);
    if (a === c) { setErr('مساوی پذیرفته نمی‌شود — یک برنده لازم است'); return; }
    if (target !== null && a >= target && c >= target) {
      setErr(`فقط یکی می‌تواند به ${faDigits(target)} فریم برسد`); return;
    }
    if (target !== null && Math.max(a, c) < target) {
      setErr(`برای پایانِ بازی یکی باید به ${faDigits(target)} فریم برسد`); return;
    }
    setBusy(m.id); setErr('');
    const r = await reportResult(id, m.id, a, c);
    setBusy('');
    if (!r.ok) { setErr(r.body.message ?? 'ثبت نتیجه انجام نشد'); return; }
    flash('بازی تمام شد — برنده به دور بعد رفت');
    await load();
  };

  const toggleLive = async (m: Match) => {
    setBusy(m.id); setErr('');
    await patchMatch(id, m.id, { status: m.status === 'in_progress' ? 'waiting' : 'in_progress' });
    setBusy('');
    await load();
  };

  /* ── شماره‌ی میز ──
     تماشاگر باید بتواند از روی مانیتور بفهمد روی میزِ ۱ چه کسانی
     بازی می‌کنند. تا امروز ستونش بود ولی هیچ ورودی‌ای نداشت. */
  const saveTable = async (m: Match) => {
    const raw = (tables[m.id] ?? '').trim();
    const n = raw === '' ? null : Number(raw);
    if (n !== null && (!Number.isFinite(n) || n <= 0 || n > 999)) {
      setErr('شماره‌ی میز معتبر نیست'); return;
    }
    setBusy(m.id); setErr('');
    const r = await patchMatch(id, m.id, { tableNumber: n });
    setBusy('');
    if (!r.ok) { setErr(r.body.message ?? 'ثبت میز انجام نشد'); return; }
    flash(n === null ? 'میز برداشته شد' : `میز ${faDigits(n)} ثبت شد`);
    await load();
  };

  return (
    <div dir="rtl" style={{
      minHeight: '100vh', background: BG, color: INK,
      fontFamily: 'Vazirmatn, Tahoma, sans-serif',
      padding: '16px clamp(12px,3vw,24px) 60px',
    }}>
      <div style={{ maxWidth: 620, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <header style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <Link href={`/tournaments/${id}/admin`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 12, color: MUT, textDecoration: 'none',
          }}><ChevronRight size={14} /> پنل مسابقه</Link>
          <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>مدیریت زنده</h1>
          <span style={{ fontSize: 11.5, color: MUT }}>
            {faDigits(playable.length)} بازیِ قابلِ ثبت
          </span>
          {target !== null && (
            <span style={{
              marginInlineStart: 'auto', fontSize: 11, fontWeight: 800, color: GOLD_D,
              background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
              borderRadius: 8, padding: '3px 9px',
            }}>تا {faDigits(target)} فریم</span>
          )}
        </header>

        {err && (
          <div style={{
            fontSize: 12, fontWeight: 700, color: '#8A2A20', background: 'rgba(178,59,46,0.07)',
            border: '1px solid rgba(178,59,46,0.28)', borderRadius: 10, padding: '9px 12px',
          }}>{err}</div>
        )}
        {ok && (
          <div style={{
            fontSize: 12, fontWeight: 700, color: '#0E7A38', background: 'rgba(14,122,56,0.07)',
            border: '1px solid rgba(14,122,56,0.28)', borderRadius: 10, padding: '9px 12px',
          }}>{ok}</div>
        )}

        {playable.length === 0 ? (
          <div style={{ fontSize: 12.5, color: MUT, lineHeight: 2, padding: '10px 2px' }}>
            بازیِ آماده‌ای نیست. تا نتیجه‌ی دورِ قبل ثبت نشود، حریفِ دورِ بعد
            مشخص نمی‌شود.
          </div>
        ) : playable.map(m => {
          const [a, c] = get(m);
          const live = m.status === 'in_progress';
          const canFinish = a !== c && (target === null || Math.max(a, c) >= target);
          return (
            <div key={m.id} style={{
              background: '#fff',
              border: `1px solid ${live ? 'rgba(178,59,46,0.4)' : LINE}`,
              borderRadius: 14, padding: 13,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
                {/* شماره‌ی بازی (#۱، #۲ …) برداشته شد — هیچ‌کس با آن
                    کاری ندارد و فقط سطر را شلوغ می‌کرد. */}
                <span style={{ fontSize: 10.5, color: MUT }}>
                  دور {faDigits(m.round)}
                </span>

                {/* شماره‌ی میز */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Table2 size={12} color={MUT} />
                  <input aria-label="شماره میز" inputMode="numeric"
                    value={tables[m.id] ?? (m.table_number != null ? String(m.table_number) : '')}
                    onChange={e => setTables(s => ({
                      ...s, [m.id]: e.target.value.replace(/[^0-9]/g, '').slice(0, 3),
                    }))}
                    placeholder="میز"
                    style={{
                      width: 52, padding: '4px 6px', borderRadius: 8, textAlign: 'center',
                      border: `1px solid ${LINE}`, background: '#fff',
                      color: INK, fontFamily: 'inherit', fontSize: 12, fontWeight: 800, outline: 'none',
                    }} />
                  <button type="button" onClick={() => void saveTable(m)} disabled={busy === m.id}
                    aria-label="ثبت میز"
                    style={{
                      width: 26, height: 26, borderRadius: 8, display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center', padding: 0,
                      border: `1px solid ${LINE}`, background: '#FAF8F3',
                      color: GOLD_D, cursor: 'pointer',
                    }}><Check size={13} /></button>
                </span>

                {/* «روی آنتن» یعنی چیزی که این‌جا نمی‌افتد — پخشِ
                    تصویری در کار نیست. این کلید فقط می‌گوید بازی
                    همین حالا در جریان است. */}
                <button type="button" onClick={() => void toggleLive(m)} disabled={!!busy}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                    border: `1px solid ${live ? 'rgba(178,59,46,0.4)' : LINE}`,
                    background: live ? 'rgba(178,59,46,0.08)' : '#fff',
                    color: live ? '#B23B2E' : MUT,
                  }}><Radio size={10} /> {live ? 'در حال انجام بازی' : 'شروع بازی'}</button>

                {/* سرستونِ فیلدهای برک — دقیقاً بالای همان‌ها، چون هر
                    دو آخرین عنصرِ سطرِ خودشان‌اند و در RTL یعنی لبه‌ی
                    چپ. بدونِ این عنوان، یک کادرِ عددیِ بی‌برچسب کنارِ
                    امتیاز می‌نشست و معلوم نبود چیست. */}
                <span style={{
                  marginInlineStart: 'auto', width: BRK_W, textAlign: 'center',
                  fontSize: 10, fontWeight: 800, color: '#6D28D9',
                }}>بالاترین برک</span>
              </div>

              {([[m.p1_name, a, 0], [m.p2_name, c, 1]] as const).map(([name, val, side]) => {
                const player = (side + 1) as 1 | 2;
                const key = `${m.id}:${player}`;
                const saved = player === 1 ? m.high_break_p1 : m.high_break_p2;
                const isBest = !!saved && !!best && saved >= best.value;
                return (
                  <div key={side} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: side === 0 ? 8 : 0, flexWrap: 'wrap',
                  }}>
                    <span style={{
                      flex: 1, minWidth: 90, fontSize: 13.5, fontWeight: 700, color: INK,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{name}</span>

                    <button type="button" onClick={() => bump(m, side, -1)} style={stepBtn}>−</button>
                    <span style={{
                      minWidth: 30, textAlign: 'center', fontSize: 20, fontWeight: 900,
                      color: INK, fontVariantNumeric: 'tabular-nums',
                    }}>{faDigits(val)}</span>
                    <button type="button" onClick={() => bump(m, side, +1)} style={stepBtn}>+</button>

                    {/* ── بالاترین برکِ همین بازیکن ──
                        برک مالِ بازیکن است نه بازی: در یک بازی هر دو
                        نفر ممکن است برکِ قابل‌ثبت بزنند.

                        دکمه‌ی تیک برداشته شد: یک کادرِ عددیِ کوچک با
                        یک دکمه‌ی کنارش، سه عنصر برای یک عدد بود. حالا
                        با بیرون‌رفتنِ فوکوس یا زدنِ Enter ذخیره
                        می‌شود — همان‌طور که از یک فیلد انتظار می‌رود. */}
                    <input aria-label={`بالاترین برک ${name ?? ''}`} inputMode="numeric"
                      value={breaks[key] ?? (saved != null ? String(saved) : '')}
                      onChange={e => setBreaks(st => ({
                        ...st, [key]: e.target.value.replace(/[^0-9]/g, '').slice(0, 3),
                      }))}
                      onBlur={() => void saveBreak(m, player)}
                      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      placeholder="—"
                      style={{
                        marginInlineStart: 'auto', width: BRK_W,
                        padding: '6px 5px', borderRadius: 9, textAlign: 'center',
                        border: `1px solid ${isBest ? 'rgba(139,92,246,0.55)' : LINE}`,
                        background: isBest ? 'rgba(139,92,246,0.10)' : '#fff',
                        color: isBest ? '#6D28D9' : INK,
                        fontFamily: 'inherit', fontSize: 13, fontWeight: 800, outline: 'none',
                      }} />
                  </div>
                );
              })}

              <div style={{ display: 'flex', gap: 7, marginTop: 11 }}>
                <button type="button" onClick={() => void push(m)} disabled={busy === m.id}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    border: `1px solid ${LINE}`, background: '#FAF8F3',
                    color: INK, fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                    fontFamily: 'inherit', opacity: busy === m.id ? 0.6 : 1,
                  }}>تأیید روی مانیتور</button>
                <button type="button" onClick={() => void finish(m)}
                  disabled={busy === m.id || !canFinish}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    border: 'none', background: '#C7A66A', color: '#241B08',
                    fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit',
                    cursor: canFinish ? 'pointer' : 'not-allowed',
                    opacity: busy === m.id || !canFinish ? 0.45 : 1,
                  }}>{busy === m.id ? 'در حال ثبت…' : 'پایان بازی'}</button>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes lc{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const stepBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
  border: '1px solid rgba(199,166,106,0.4)', background: 'rgba(199,166,106,0.10)',
  color: GOLD_D, fontSize: 19, fontWeight: 800, cursor: 'pointer',
  fontFamily: 'inherit', lineHeight: 1,
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" style={{
      minHeight: '100vh', background: BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Vazirmatn, Tahoma, sans-serif',
    }}>
      {children}
      <style>{`@keyframes lc{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
