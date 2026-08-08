'use client';

/* ─────────────────────────────────────────────────────────────
   بازی‌های زنده‌ی یک مسابقه.

   «زنده» یعنی برگزارکننده در پنل خودش دکمه‌ی «شروع زنده» را زده و
   وضعیت بازی روی `in_progress` است — نه اینکه ما حدس بزنیم.

   تا وقتی بازی زنده‌ای هست هر ۱۵ ثانیه تازه می‌شود. وقتی چیزی زنده
   نیست پولینگ متوقف می‌شود؛ صفحه‌ای که کسی تماشا نمی‌کند نباید
   بی‌دلیل به سرور بزند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Radio, Loader2, Trophy, Table2, Clock3, GitBranch } from 'lucide-react';
import {
  fetchBracket, faDigits, slotLabel,
  type Bracket, type Match,
} from '../../../../lib/tournaments/bracket-client';

const GOLD = '#C7A66A', GOLD_D = '#9A6E38', INK = '#1C1B17';
const MUT = '#8A8474', LINE = '#EAE5DA', FELT = '#0E7A38', RED = '#B23B2E';

const FORMAT_BEST: Record<string, number> = { bo3: 3, bo5: 5, bo7: 7, bo9: 9, bo11: 11 };

export default function LivePage() {
  const params = useParams();
  const id = String(params?.id ?? '');

  const [b, setB] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setB(await fetchBracket(id));
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const live = b?.matches.filter(m => m.status === 'in_progress') ?? [];
  const hasLive = live.length > 0;

  useEffect(() => {
    if (!hasLive) return;
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [hasLive, load]);

  if (loading) return <Center><Loader2 size={28} style={{ animation: 'lvspin 1s linear infinite' }} /></Center>;
  if (!b) return <Center><p style={{ fontWeight: 800, color: INK }}>این مسابقه پیدا نشد</p></Center>;

  /* بازی بعدی: هر دو بازیکنش معلوم است ولی هنوز شروع نشده */
  const upNext = b.matches.filter(m => m.winner === null && m.status === 'waiting' && m.p1_name && m.p2_name);
  const recent = b.matches.filter(m => m.winner !== null && m.completed_at)
    .sort((x, y) => String(y.completed_at).localeCompare(String(x.completed_at))).slice(0, 6);

  /* «تا چند برد» — از فرمت ثبت‌شده‌ی مسابقه، نه حدس */
  const best = FORMAT_BEST[String(b.tournament.match_format ?? '')] ?? 0;
  const target = best ? Math.ceil(best / 2) : 0;

  return (
    <div dir="rtl" style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 70px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 6px', flexWrap: 'wrap' }}>
        <Link href={`/tournaments/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: MUT, textDecoration: 'none' }}>
          <ChevronRight size={14} /> صفحه‌ی مسابقه
        </Link>
        <span style={{ color: LINE }}>/</span>
        <h1 style={{ fontSize: 17, fontWeight: 900, color: INK, margin: 0 }}>پخش زنده</h1>
      </div>
      <p style={{ fontSize: 13, color: MUT, margin: '0 0 18px' }}>
        {b.tournament.title}
        {target > 0 && <> — هر بازی تا {faDigits(target)} برد ({faDigits(best)} فریم حداکثر)</>}
      </p>

      {/* ── زنده ── */}
      {hasLive ? (
        <section style={{ marginBottom: 24 }}>
          <Head icon={<Radio size={16} style={{ color: RED }} />} title={`در حال اجرا (${faDigits(live.length)})`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {live.map(m => <LiveCard key={m.id} m={m} rounds={b.totalRounds} target={target} />)}
          </div>
        </section>
      ) : (
        <div style={{ ...card, textAlign: 'center', padding: '50px 20px', marginBottom: 24 }}>
          <Radio size={32} style={{ color: MUT, opacity: 0.4, marginBottom: 11 }} />
          <p style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 6px' }}>الان بازی زنده‌ای نیست</p>
          <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 2 }}>
            {b.matches.length === 0
              ? 'هنوز قرعه‌کشی نشده است.'
              : 'وقتی برگزارکننده بازی‌ای را شروع کند، همین‌جا نمایش داده می‌شود.'}
          </p>
        </div>
      )}

      {/* ── بازی بعدی ── */}
      {upNext.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <Head icon={<Clock3 size={16} style={{ color: GOLD_D }} />} title={`در نوبت (${faDigits(upNext.length)})`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upNext.slice(0, 8).map(m => (
              <div key={m.id} style={{ ...card, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: MUT }}>{roundName(m.round, b.totalRounds)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>
                  {slotLabel(m, 1)} <span style={{ color: MUT, fontWeight: 800 }}>—</span> {slotLabel(m, 2)}
                </span>
                {m.table_number != null && (
                  <span style={{ marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: MUT }}>
                    <Table2 size={11} /> میز {faDigits(m.table_number)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── آخرین نتایج ── */}
      {recent.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <Head icon={<Trophy size={16} style={{ color: FELT }} />} title="آخرین نتایج" />
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {recent.map((m, i) => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px',
                borderTop: i ? `1px solid ${LINE}` : 'none', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 10.5, color: MUT, minWidth: 72 }}>{roundName(m.round, b.totalRounds)}</span>
                <span style={{ fontSize: 13, fontWeight: m.winner === 1 ? 900 : 700, color: m.winner === 1 ? FELT : INK }}>
                  {slotLabel(m, 1)}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                  {faDigits(m.score1)} – {faDigits(m.score2)}
                </span>
                <span style={{ fontSize: 13, fontWeight: m.winner === 2 ? 900 : 700, color: m.winner === 2 ? FELT : INK }}>
                  {slotLabel(m, 2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href={`/tournaments/${id}/bracket`} style={btnGhost}><GitBranch size={14} /> براکت کامل</Link>
        <Link href={`/tournaments/${id}/results`} style={btnGhost}><Trophy size={14} /> نتایج</Link>
      </div>

      <style>{`@keyframes lvspin{to{transform:rotate(360deg)}} @keyframes lvpulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  );
}

function LiveCard({ m, rounds, target }: { m: Match; rounds: number; target: number }) {
  return (
    <div style={{
      ...card, borderColor: 'rgba(178,59,46,0.4)',
      background: 'linear-gradient(135deg, rgba(178,59,46,0.045), rgba(178,59,46,0.01))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: RED,
          background: 'rgba(178,59,46,0.10)', border: '1px solid rgba(178,59,46,0.3)',
          borderRadius: 999, padding: '3px 10px', animation: 'lvpulse 2s ease-in-out infinite',
        }}>
          <Radio size={11} /> زنده
        </span>
        <span style={{ fontSize: 11.5, color: MUT }}>{roundName(m.round, rounds)}</span>
        {m.table_number != null && (
          <span style={{ marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: MUT }}>
            <Table2 size={12} /> میز {faDigits(m.table_number)}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PlayerBig name={slotLabel(m, 1)} score={m.score1} lead={m.score1 > m.score2} target={target} />
        <span style={{ fontSize: 15, fontWeight: 900, color: MUT }}>–</span>
        <PlayerBig name={slotLabel(m, 2)} score={m.score2} lead={m.score2 > m.score1} target={target} />
      </div>
    </div>
  );
}

function PlayerBig({ name, score, lead, target }: { name: string; score: number; lead: boolean; target: number }) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
      <div style={{
        fontSize: 14, fontWeight: lead ? 900 : 700, color: lead ? FELT : INK,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4,
      }}>{name}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color: lead ? FELT : INK, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {faDigits(score)}
      </div>
      {target > 0 && (
        <div style={{ fontSize: 10, color: MUT, marginTop: 4 }}>از {faDigits(target)}</div>
      )}
    </div>
  );
}

function roundName(round: number, total: number): string {
  const d = total - round;
  return d === 0 ? 'فینال' : d === 1 ? 'نیمه‌نهایی' : d === 2 ? 'یک‌چهارم' : d === 3 ? 'یک‌هشتم' : `دور ${faDigits(round)}`;
}

function Head({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
      {icon}<h2 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: 0 }}>{title}</h2>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 80, textAlign: 'center', color: MUT }}>
      {children}
      <style>{`@keyframes lvspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 15 };
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10,
  border: `1px solid ${LINE}`, background: '#fff', color: GOLD_D,
  fontSize: 12.5, fontWeight: 800, textDecoration: 'none',
};
