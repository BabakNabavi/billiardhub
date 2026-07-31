'use client';

/* ─────────────────────────────────────────────────────────────
   پنل برگزارکننده‌ی مسابقه.

   تا پیش از این روی داده‌ی ساختگی داخل کد کار می‌کرد. حالا از
   /api/tournaments/:id/matches می‌خواند و می‌نویسد:
     • فهرست ثبت‌نام‌های تأییدشده
     • قرعه‌کشی (یک‌بار، اتمیک)
     • ثبت نتیجه‌ی هر بازی و صعود خودکار برنده

   دسترسی سمت سرور با `ownsClub` سنجیده می‌شود؛ این صفحه فقط UI است.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Trophy, ChevronRight, GitBranch, Shuffle, AlertCircle,
  Loader2, CheckCircle2, RotateCcw, Radio, Save, Table2,
} from 'lucide-react';
import {
  fetchBracket, drawBracket, resetBracket, reportResult, patchMatch,
  faDigits, slotLabel, isBye,
  type Bracket, type Match,
} from '../../../../lib/tournaments/bracket-client';
import { apiFetch } from '../../../../lib/http';

const GOLD = '#C7A66A', GOLD_D = '#9A6E38', INK = '#1C1B17';
const MUT = '#8A8474', LINE = '#EAE5DA', FELT = '#0E7A38', RED = '#B23B2E';
const GROUND = '#FAF8F3';

type AdminTab = 'overview' | 'draw' | 'matches';

interface Registration {
  id: string; player_name: string | null; status: string;
  payment_status: string; amount: number; created_at: string;
}

export default function TournamentAdminPage() {
  const params = useParams();
  const id = String(params?.id ?? '');

  const [b, setB] = useState<Bracket | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const [bracket, regRes] = await Promise.all([
      fetchBracket(id),
      apiFetch(`/api/tournaments/${id}/registrations`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    setB(bracket);
    setRegs((regRes?.registrations ?? []) as Registration[]);
    if (!bracket) setErr('اطلاعات این مسابقه در دسترس نیست');
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const confirmed = regs.filter(r => r.status === 'CONFIRMED');
  const pending = regs.filter(r => r.status === 'PENDING_PAYMENT');
  const hasBracket = (b?.matches.length ?? 0) > 0;

  const flash = (t: string) => { setNote(t); setTimeout(() => setNote(''), 3500); };

  const doDraw = async () => {
    setBusy(true); setErr('');
    const { ok, body } = await drawBracket(id, true);
    setBusy(false);
    if (!ok) { setErr(body.message ?? 'قرعه‌کشی انجام نشد'); return; }
    flash(`براکت ساخته شد — ${faDigits(body.matches ?? 0)} بازی`);
    setTab('matches');
    await load();
  };

  const doReset = async () => {
    if (!window.confirm('کل براکت و همه‌ی نتایج ثبت‌شده پاک می‌شود. مطمئنید؟')) return;
    setBusy(true); setErr('');
    const { ok, body } = await resetBracket(id);
    setBusy(false);
    if (!ok) { setErr(body.message ?? 'حذف براکت انجام نشد'); return; }
    flash('براکت حذف شد');
    await load();
  };

  if (loading) return (
    <div style={{ padding: 80, textAlign: 'center', color: MUT }}>
      <Loader2 size={28} style={{ animation: 'taspin 1s linear infinite' }} />
      <style>{`@keyframes taspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div dir="rtl" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px 70px', fontFamily: 'inherit' }}>

      {/* ── سربرگ ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 14px', flexWrap: 'wrap' }}>
        <Link href="/dashboard/club" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: MUT, textDecoration: 'none' }}>
          <ChevronRight size={14} /> داشبورد باشگاه
        </Link>
        <span style={{ color: LINE }}>/</span>
        <h1 style={{ fontSize: 17, fontWeight: 900, color: INK, margin: 0 }}>
          {b?.tournament.title ?? 'مسابقه'}
        </h1>
      </div>

      {note && (
        <div style={{ ...banner, background: 'rgba(14,122,56,0.07)', borderColor: 'rgba(14,122,56,0.25)', color: FELT }}>
          <CheckCircle2 size={15} /> {note}
        </div>
      )}
      {err && (
        <div style={{ ...banner, background: 'rgba(178,59,46,0.06)', borderColor: 'rgba(178,59,46,0.25)', color: RED }}>
          <AlertCircle size={15} /> {err}
        </div>
      )}

      {/* ── تب‌ها ── */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
        {([
          { k: 'overview', label: 'خلاصه', Icon: Trophy },
          { k: 'draw', label: 'قرعه‌کشی', Icon: Shuffle },
          { k: 'matches', label: `بازی‌ها${hasBracket ? ` (${faDigits(b!.matches.length)})` : ''}`, Icon: GitBranch },
        ] as const).map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={chip(tab === t.k)}>
            <t.Icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ══ خلاصه ══ */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Stat label="ثبت‌نام تأییدشده" value={confirmed.length} unit="نفر" tone="felt" />
          <Stat label="در انتظار پرداخت" value={pending.length} unit="نفر" />
          <Stat label="ظرفیت" value={b?.tournament.max_players ?? 0} unit="نفر" />
          <Stat label="بازی‌های براکت" value={b?.matches.length ?? 0} unit="بازی" tone={hasBracket ? 'gold' : undefined} />
          {hasBracket && (
            <>
              <Stat label="انجام‌شده" value={b!.matches.filter(m => m.winner).length} unit="بازی" />
              <Stat label="در حال اجرا" value={b!.matches.filter(m => m.status === 'in_progress').length} unit="بازی" tone="red" />
            </>
          )}
          {b?.champion && (
            <div style={{ ...card, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap', borderColor: 'rgba(199,166,106,0.45)', background: 'rgba(199,166,106,0.07)' }}>
              <Trophy size={20} style={{ color: GOLD_D }} />
              <span style={{ fontSize: 14.5, fontWeight: 900, color: INK }}>قهرمان: {b.champion.name}</span>
              {b.runnerUp && <span style={{ fontSize: 12.5, color: MUT }}>نایب‌قهرمان: {b.runnerUp.name}</span>}
            </div>
          )}
        </div>
      )}

      {/* ══ قرعه‌کشی ══ */}
      {tab === 'draw' && (
        <div style={card}>
          {!hasBracket ? (
            <>
              <h3 style={h3}>قرعه‌کشی براکت</h3>
              <p style={pStyle}>
                {faDigits(confirmed.length)} بازیکن تأییدشده وارد براکت می‌شوند.
                {confirmed.length >= 2 && (() => {
                  let size = 2; while (size < confirmed.length) size *= 2;
                  const byes = size - confirmed.length;
                  return ` براکت ${faDigits(size)} تایی ساخته می‌شود${byes ? ` و ${faDigits(byes)} بازیکن در دور اول بای می‌گیرند` : ''}.`;
                })()}
              </p>
              <p style={{ ...pStyle, color: RED }}>
                قرعه‌کشی یک‌بار انجام می‌شود. برای تکرارش باید کل براکت و نتایج پاک شود.
              </p>
              {pending.length > 0 && (
                <p style={{ ...pStyle, color: GOLD_D }}>
                  {faDigits(pending.length)} ثبت‌نام هنوز پرداخت نشده و وارد براکت نمی‌شود.
                </p>
              )}
              <button onClick={doDraw} disabled={busy || confirmed.length < 2} style={btnGold(busy || confirmed.length < 2)}>
                {busy ? <Loader2 size={15} style={{ animation: 'taspin 1s linear infinite' }} /> : <Shuffle size={15} />}
                قرعه‌کشی و ساخت براکت
              </button>
              {confirmed.length < 2 && (
                <p style={{ ...pStyle, marginTop: 10 }}>حداقل دو ثبت‌نام تأییدشده لازم است.</p>
              )}
            </>
          ) : (
            <>
              <h3 style={h3}>براکت ساخته شده است</h3>
              <p style={pStyle}>
                {faDigits(b!.totalRounds)} دور، {faDigits(b!.matches.length)} بازی.
                نتایج را از تب «بازی‌ها» ثبت کنید.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <Link href={`/tournaments/${id}/bracket`} style={btnGhostLink}>
                  <GitBranch size={14} /> دیدن براکت
                </Link>
                <button onClick={doReset} disabled={busy} style={btnDanger(busy)}>
                  <RotateCcw size={14} /> حذف براکت و قرعه‌کشی دوباره
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ بازی‌ها ══ */}
      {tab === 'matches' && (
        !hasBracket ? (
          <div style={{ ...card, textAlign: 'center', padding: '50px 20px' }}>
            <GitBranch size={30} style={{ color: MUT, opacity: 0.4, marginBottom: 10 }} />
            <p style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 6px', color: INK }}>هنوز براکتی ساخته نشده</p>
            <p style={{ ...pStyle, margin: 0 }}>از تب «قرعه‌کشی» شروع کنید.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {b!.rounds.map(r => (
              <section key={r.round}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 3, height: 16, borderRadius: 2, background: GOLD }} />
                  <h3 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: 0 }}>{r.label}</h3>
                  <span style={{ fontSize: 11.5, color: MUT }}>
                    {faDigits(r.matches.filter(m => m.winner).length)} از {faDigits(r.matches.length)} انجام‌شده
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {r.matches.map(m => (
                    <MatchEditor key={m.id} tournamentId={id} match={m}
                      onDone={async (msg) => { flash(msg); await load(); }}
                      onError={setErr} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      )}

      <style>{`@keyframes taspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── ویرایشگر یک بازی ──
   بای و بازی نامشخص ورودی امتیاز نمی‌گیرند: اولی حریف ندارد و دومی
   هنوز بازیکنش معلوم نیست. */
function MatchEditor({
  tournamentId, match, onDone, onError,
}: {
  tournamentId: string; match: Match;
  onDone: (msg: string) => Promise<void>; onError: (m: string) => void;
}) {
  const [s1, setS1] = useState(String(match.score1));
  const [s2, setS2] = useState(String(match.score2));
  const [busy, setBusy] = useState(false);

  useEffect(() => { setS1(String(match.score1)); setS2(String(match.score2)); },
    [match.score1, match.score2]);

  const ready = !!match.p1_name && !!match.p2_name;
  const bye = isBye(match);

  const save = async () => {
    const a = parseInt(s1, 10), c = parseInt(s2, 10);
    if (!Number.isFinite(a) || !Number.isFinite(c)) { onError('امتیاز را وارد کنید'); return; }
    setBusy(true); onError('');
    const { ok, body } = await reportResult(tournamentId, match.id, a, c);
    setBusy(false);
    if (!ok) { onError(body.message ?? 'ثبت نتیجه انجام نشد'); return; }
    await onDone('نتیجه ثبت شد');
  };

  const toggleLive = async () => {
    setBusy(true); onError('');
    const wasLive = match.status === 'in_progress';
    const { ok, body } = await patchMatch(tournamentId, match.id, {
      status: wasLive ? 'waiting' : 'in_progress',
    });
    setBusy(false);
    if (!ok) { onError(body.message ?? 'تغییر وضعیت انجام نشد'); return; }
    await onDone(wasLive ? 'بازی متوقف شد' : 'بازی روی آنتن رفت');
  };

  return (
    <div style={{
      ...card, padding: '12px 14px',
      borderColor: match.status === 'in_progress' ? 'rgba(178,59,46,0.4)'
        : match.winner ? 'rgba(14,122,56,0.28)' : LINE,
      background: match.status === 'in_progress' ? 'rgba(178,59,46,0.03)' : '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: MUT, minWidth: 30 }}>#{faDigits(match.match_index + 1)}</span>

        <div style={{ flex: '1 1 190px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <PlayerLine name={slotLabel(match, 1)} win={match.winner === 1} dim={!match.p1_name} />
          <PlayerLine name={slotLabel(match, 2)} win={match.winner === 2} dim={!match.p2_name} />
        </div>

        {bye ? (
          <span style={{ fontSize: 11.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.13)', borderRadius: 999, padding: '4px 11px' }}>
            بای — صعود خودکار
          </span>
        ) : !ready ? (
          <span style={{ fontSize: 11.5, color: MUT }}>در انتظار دور قبل</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <ScoreBox value={s1} onChange={setS1} label="امتیاز بازیکن اول" />
            <span style={{ color: MUT, fontWeight: 800 }}>–</span>
            <ScoreBox value={s2} onChange={setS2} label="امتیاز بازیکن دوم" />
            <button onClick={save} disabled={busy} style={btnSmall(busy, GOLD_D)}>
              {busy ? <Loader2 size={12} style={{ animation: 'taspin 1s linear infinite' }} /> : <Save size={12} />}
              {match.winner ? 'اصلاح' : 'ثبت'}
            </button>
            {!match.winner && (
              <button onClick={toggleLive} disabled={busy}
                style={btnSmall(busy, match.status === 'in_progress' ? RED : MUT)}>
                <Radio size={12} /> {match.status === 'in_progress' ? 'پایان پخش' : 'شروع زنده'}
              </button>
            )}
          </div>
        )}

        {match.table_number != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: MUT }}>
            <Table2 size={11} /> میز {faDigits(match.table_number)}
          </span>
        )}
      </div>
    </div>
  );
}

function PlayerLine({ name, win, dim }: { name: string; win: boolean; dim: boolean }) {
  return (
    <span style={{
      fontSize: 13.5, fontWeight: win ? 900 : 700,
      color: dim ? MUT : win ? FELT : INK,
      display: 'flex', alignItems: 'center', gap: 5,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {win && <Trophy size={12} style={{ flexShrink: 0 }} />}{name}
    </span>
  );
}

/* ورودی امتیاز: نمایش فارسی، مقدار لاتین */
function ScoreBox({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const fa = (v: string) => v.replace(/[0-9]/g, d => FA[+d]!);
  const latin = (v: string) => v.replace(/[۰-۹]/g, ch => String(FA.indexOf(ch))).replace(/[^0-9]/g, '');
  return (
    <input aria-label={label} type="text" inputMode="numeric" value={fa(value)}
      onChange={e => onChange(latin(e.target.value).slice(0, 2))}
      style={{
        width: 44, textAlign: 'center', padding: '7px 4px', borderRadius: 9,
        border: `1px solid ${LINE}`, background: GROUND, fontFamily: 'inherit',
        fontSize: 14, fontWeight: 800, color: INK, outline: 'none',
      }} />
  );
}

function Stat({ label, value, unit, tone }: { label: string; value: number; unit: string; tone?: 'gold' | 'felt' | 'red' }) {
  const color = tone === 'gold' ? GOLD_D : tone === 'felt' ? FELT : tone === 'red' ? RED : INK;
  return (
    <div style={{ ...card, padding: '13px 15px' }}>
      <div style={{ fontSize: 11.5, color: MUT, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>
        {faDigits(value)}<span style={{ fontSize: 10.5, fontWeight: 700, color: MUT, marginInlineStart: 4 }}>{unit}</span>
      </div>
    </div>
  );
}

/* ── استایل‌ها ── */
const card: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 16 };
const h3: React.CSSProperties = { fontSize: 15, fontWeight: 900, color: INK, margin: '0 0 8px' };
const pStyle: React.CSSProperties = { fontSize: 12.5, color: MUT, margin: '0 0 6px', lineHeight: 2 };
const banner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px',
  border: '1px solid', borderRadius: 12, fontSize: 12.5, fontWeight: 700, marginBottom: 14,
};
const chip = (on: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 15px', borderRadius: 999,
  border: `1px solid ${on ? 'rgba(199,166,106,0.5)' : LINE}`,
  background: on ? 'rgba(199,166,106,0.12)' : '#fff',
  color: on ? GOLD_D : MUT, fontSize: 12.5, fontWeight: 800,
  cursor: 'pointer', fontFamily: 'inherit',
});
const btnGold = (dis: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  marginTop: 12, padding: '11px 20px', borderRadius: 11, border: 'none',
  background: dis ? '#DDD8CC' : GOLD, color: dis ? MUT : '#241B08',
  fontSize: 13.5, fontWeight: 800, cursor: dis ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
});
const btnDanger = (dis: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10,
  border: '1px solid rgba(178,59,46,0.3)', background: 'rgba(178,59,46,0.06)', color: RED,
  fontSize: 12.5, fontWeight: 800, cursor: dis ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
});
const btnGhostLink: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10,
  border: `1px solid ${LINE}`, background: '#fff', color: GOLD_D,
  fontSize: 12.5, fontWeight: 800, textDecoration: 'none',
};
const btnSmall = (dis: boolean, color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 11px', borderRadius: 9,
  border: `1px solid ${color}44`, background: `${color}0F`, color,
  fontSize: 11.5, fontWeight: 800, cursor: dis ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
});
