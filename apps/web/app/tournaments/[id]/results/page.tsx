'use client';

/* ─────────────────────────────────────────────────────────────
   نتایجِ پایانیِ مسابقه.

   قهرمان و نایب‌قهرمان از خودِ فینال خوانده می‌شوند.

   نفرِ سوم عمداً «حدس» زده نمی‌شود: در حذفیِ یک‌طرفه دو بازنده‌ی
   نیمه‌نهایی هر دو در یک رده‌اند و تا وقتی بازیِ رده‌بندی برگزار نشود
   هیچ‌کدام سومِ رسمی نیست. پس هر دو با عنوانِ «سومِ مشترک» می‌آیند —
   نه اینکه یکی را دلبخواهی بالاتر بگذاریم.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Trophy, Medal, Loader2, GitBranch } from 'lucide-react';
import {
  fetchBracket, faDigits, slotLabel,
  type Bracket, type Match,
} from '../../../../lib/tournaments/bracket-client';

const GOLD_D = '#9A6E38', INK = '#1C1B17';
const MUT = '#8A8474', LINE = '#EAE5DA', FELT = '#0E7A38';

export default function ResultsPage() {
  const params = useParams();
  const id = String(params?.id ?? '');

  const [b, setB] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => { setB(await fetchBracket(id)); setLoading(false); })();
  }, [id]);

  if (loading) return <Center><Loader2 size={28} style={{ animation: 'rsspin 1s linear infinite' }} /></Center>;
  if (!b) return <Center><p style={{ fontWeight: 800, color: INK }}>این مسابقه پیدا نشد</p></Center>;

  const played = b.matches.filter(m => m.winner !== null && m.p1_name && m.p2_name);
  const finished = !!b.champion;

  /* بازنده‌های نیمه‌نهایی — رده‌ی سومِ مشترک */
  const semiLosers = b.totalRounds >= 2
    ? b.matches
        .filter(m => m.round === b.totalRounds - 1 && m.winner !== null)
        .map(m => (m.winner === 1 ? m.p2_name : m.p1_name))
        .filter((n): n is string => !!n)
    : [];

  return (
    <div dir="rtl" style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px 70px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 6px', flexWrap: 'wrap' }}>
        <Link href={`/tournaments/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: MUT, textDecoration: 'none' }}>
          <ChevronRight size={14} /> صفحه‌ی مسابقه
        </Link>
        <span style={{ color: LINE }}>/</span>
        <h1 style={{ fontSize: 17, fontWeight: 900, color: INK, margin: 0 }}>نتایج</h1>
      </div>
      <p style={{ fontSize: 13, color: MUT, margin: '0 0 18px' }}>{b.tournament.title}</p>

      {!finished ? (
        <div style={{ ...card, textAlign: 'center', padding: '55px 20px' }}>
          <Trophy size={34} style={{ color: MUT, opacity: 0.4, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 6px' }}>
            {b.matches.length === 0 ? 'هنوز قرعه‌کشی نشده' : 'مسابقه هنوز تمام نشده'}
          </p>
          <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 16px', lineHeight: 2 }}>
            {b.matches.length === 0
              ? 'نتایج پس از برگزاریِ بازی‌ها اینجا اعلام می‌شود.'
              : `${faDigits(played.length)} از ${faDigits(b.matches.length)} بازی انجام شده است.`}
          </p>
          {b.matches.length > 0 && (
            <Link href={`/tournaments/${id}/bracket`} style={btnGhost}><GitBranch size={14} /> دیدنِ براکت</Link>
          )}
        </div>
      ) : (
        <>
          {/* ── سکو ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
            <PodiumRow place={1} label="قهرمان" name={b.champion!.name} />
            {b.runnerUp && <PodiumRow place={2} label="نایب‌قهرمان" name={b.runnerUp.name} />}
            {semiLosers.map((n, i) => (
              <PodiumRow key={n + i} place={3} label="سومِ مشترک" name={n} />
            ))}
          </div>

          {semiLosers.length === 2 && (
            <p style={{ fontSize: 11.5, color: MUT, margin: '-10px 0 22px', lineHeight: 2 }}>
              در جدولِ حذفیِ یک‌طرفه، هر دو بازنده‌ی نیمه‌نهایی هم‌رده‌اند. تعیینِ نفرِ سوم
              نیازمندِ بازیِ رده‌بندی است که در این مسابقه برگزار نشده.
            </p>
          )}

          {/* ── همه‌ی نتایج به تفکیکِ دور ── */}
          <h2 style={{ fontSize: 15, fontWeight: 900, color: INK, margin: '0 0 12px' }}>همه‌ی بازی‌ها</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...b.rounds].reverse().map(r => {
              const done = r.matches.filter(m => m.winner !== null && m.p1_name && m.p2_name);
              if (done.length === 0) return null;
              return (
                <section key={r.round}>
                  <h3 style={{ fontSize: 13, fontWeight: 900, color: GOLD_D, margin: '0 0 8px' }}>{r.label}</h3>
                  <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                    {done.map((m, i) => <ResultRow key={m.id} m={m} first={i === 0} />)}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      <style>{`@keyframes rsspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PodiumRow({ place, label, name }: { place: 1 | 2 | 3; label: string; name: string }) {
  const style = place === 1
    ? { border: 'rgba(199,166,106,0.5)', bg: 'linear-gradient(135deg,rgba(199,166,106,0.13),rgba(199,166,106,0.03))', color: GOLD_D }
    : place === 2
      ? { border: 'rgba(148,163,184,0.5)', bg: 'rgba(148,163,184,0.08)', color: '#64748B' }
      : { border: 'rgba(205,127,50,0.45)', bg: 'rgba(205,127,50,0.07)', color: '#B5651D' };

  return (
    <div style={{
      ...card, display: 'flex', alignItems: 'center', gap: 12,
      borderColor: style.border, background: style.bg,
      padding: place === 1 ? '18px 18px' : '13px 16px',
    }}>
      {place === 1 ? <Trophy size={24} style={{ color: style.color }} /> : <Medal size={19} style={{ color: style.color }} />}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: style.color, letterSpacing: '0.1em' }}>{label}</div>
        <div style={{ fontSize: place === 1 ? 19 : 15, fontWeight: 900, color: INK, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
      </div>
    </div>
  );
}

function ResultRow({ m, first }: { m: Match; first: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
      borderTop: first ? 'none' : `1px solid ${LINE}`, flexWrap: 'wrap',
    }}>
      <span style={{
        flex: '1 1 90px', minWidth: 0, textAlign: 'start', fontSize: 13,
        fontWeight: m.winner === 1 ? 900 : 700, color: m.winner === 1 ? FELT : INK,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{slotLabel(m, 1)}</span>

      <span style={{ fontSize: 14, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
        {faDigits(m.score1)} – {faDigits(m.score2)}
      </span>

      <span style={{
        flex: '1 1 90px', minWidth: 0, textAlign: 'end', fontSize: 13,
        fontWeight: m.winner === 2 ? 900 : 700, color: m.winner === 2 ? FELT : INK,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{slotLabel(m, 2)}</span>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 80, textAlign: 'center', color: MUT }}>
      {children}
      <style>{`@keyframes rsspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 15 };
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10,
  border: `1px solid ${LINE}`, background: '#fff', color: GOLD_D,
  fontSize: 12.5, fontWeight: 800, textDecoration: 'none',
};
