'use client';

/* ─────────────────────────────────────────────────────────────
   براکت مسابقه — نمایش عمومی.

   پیش‌تر این صفحه براکت را خودش در حافظه‌ی مرورگر می‌ساخت و با
   بازیکنان نمونه پر می‌کرد؛ چیزی ذخیره نمی‌شد و هر بار عوض می‌شد.
   حالا فقط همان براکتی را نشان می‌دهد که برگزارکننده در
   /tournaments/:id/admin قرعه‌کشی کرده است.

   چیدمان: هر دور یک ستون. ستون‌ها اسکرول افقی خودشان را دارند تا
   براکت ۳۲ نفره عرض صفحه را نشکند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Trophy, Loader2, GitBranch, Radio, RefreshCw } from 'lucide-react';
import {
  fetchBracket, faDigits, slotLabel, isBye,
  type Bracket, type Match,
} from '../../../../lib/tournaments/bracket-client';

const GOLD = '#C7A66A', GOLD_D = '#9A6E38', INK = '#1C1B17';
const MUT = '#8A8474', LINE = '#EAE5DA', FELT = '#0E7A38', RED = '#B23B2E';

export default function BracketPage() {
  const params = useParams();
  const id = String(params?.id ?? '');

  const [b, setB] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    setB(await fetchBracket(id));
    setLoading(false); setRefreshing(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  /* وقتی بازی زنده‌ای در جریان است براکت خودش تازه می‌شود — تماشاگر
     نباید برای دیدن نتیجه‌ی دور بعد صفحه را رفرش کند. */
  const hasLive = !!b?.matches.some(m => m.status === 'in_progress');
  useEffect(() => {
    if (!hasLive) return;
    const t = setInterval(() => void load(true), 20000);
    return () => clearInterval(t);
  }, [hasLive, load]);

  if (loading) return <Center><Loader2 size={28} style={{ animation: 'bkspin 1s linear infinite' }} /></Center>;
  if (!b) return <Center><p style={{ fontWeight: 800, color: INK }}>این مسابقه پیدا نشد</p></Center>;

  const empty = b.matches.length === 0;

  return (
    <div dir="rtl" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 70px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 6px', flexWrap: 'wrap' }}>
        <Link href={`/tournaments/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: MUT, textDecoration: 'none' }}>
          <ChevronRight size={14} /> صفحه‌ی مسابقه
        </Link>
        <span style={{ color: LINE }}>/</span>
        <h1 style={{ fontSize: 17, fontWeight: 900, color: INK, margin: 0 }}>براکت</h1>
        {hasLive && (
          <span style={liveDot}>
            <Radio size={11} /> در حال پخش
            {refreshing && <RefreshCw size={10} style={{ animation: 'bkspin 1s linear infinite' }} />}
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: MUT, margin: '0 0 18px' }}>{b.tournament.title}</p>

      {empty ? (
        <div style={{ ...card, textAlign: 'center', padding: '60px 20px' }}>
          <GitBranch size={34} style={{ color: MUT, opacity: 0.4, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 6px' }}>هنوز قرعه‌کشی نشده</p>
          <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 2 }}>
            براکت پس از بسته‌شدن ثبت‌نام و قرعه‌کشی برگزارکننده اینجا نمایش داده می‌شود.
          </p>
        </div>
      ) : (
        <>
          {b.champion && (
            <div style={{
              ...card, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap',
              borderColor: 'rgba(199,166,106,0.45)',
              background: 'linear-gradient(135deg, rgba(199,166,106,0.10), rgba(199,166,106,0.03))',
            }}>
              <Trophy size={24} style={{ color: GOLD_D }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: GOLD_D, fontWeight: 800, letterSpacing: '0.1em' }}>قهرمان</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: INK }}>{b.champion.name}</div>
              </div>
              {b.runnerUp && (
                <div style={{ marginInlineStart: 'auto' }}>
                  <div style={{ fontSize: 11, color: MUT, fontWeight: 700 }}>نایب‌قهرمان</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>{b.runnerUp.name}</div>
                </div>
              )}
            </div>
          )}

          <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
            <div style={{ display: 'flex', gap: 16, minWidth: 'min-content', alignItems: 'stretch' }}>
              {b.rounds.map(r => (
                <div key={r.round} style={{ minWidth: 230, flex: '0 0 auto', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <span style={{ width: 3, height: 15, borderRadius: 2, background: GOLD }} />
                    <h2 style={{ fontSize: 13.5, fontWeight: 900, color: INK, margin: 0 }}>{r.label}</h2>
                  </div>
                  {/* بازی‌های دورهای بعد بین دو بازی قبلی پخش می‌شوند تا
                      شکل درختی براکت خوانده شود */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'space-around', flex: 1 }}>
                    {r.matches.map(m => <MatchCard key={m.id} m={m} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes bkspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function MatchCard({ m }: { m: Match }) {
  const live = m.status === 'in_progress';
  const done = m.winner !== null;
  const bye = isBye(m);

  return (
    <div style={{
      ...card, padding: '9px 11px',
      borderColor: live ? 'rgba(178,59,46,0.45)' : done ? 'rgba(14,122,56,0.25)' : LINE,
      background: live ? 'rgba(178,59,46,0.03)' : '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: MUT }}>#{faDigits(m.match_index + 1)}</span>
        {live && <span style={{ ...liveDot, fontSize: 9.5, padding: '2px 7px' }}><Radio size={9} /> زنده</span>}
        {bye && <span style={{ fontSize: 9.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.13)', borderRadius: 999, padding: '2px 7px' }}>بای</span>}
        {m.table_number != null && <span style={{ marginInlineStart: 'auto', fontSize: 10, color: MUT }}>میز {faDigits(m.table_number)}</span>}
      </div>

      <Slot name={slotLabel(m, 1)} score={m.score1} win={m.winner === 1} known={!!m.p1_name} show={done} />
      <div style={{ height: 1, background: LINE, margin: '5px 0' }} />
      <Slot name={slotLabel(m, 2)} score={m.score2} win={m.winner === 2} known={!!m.p2_name} show={done} />
    </div>
  );
}

function Slot({ name, score, win, known, show }: {
  name: string; score: number; win: boolean; known: boolean; show: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{
        flex: 1, minWidth: 0, fontSize: 12.5,
        fontWeight: win ? 900 : 700,
        color: !known ? MUT : win ? FELT : INK,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{name}</span>
      {show && known && (
        <span style={{
          fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
          color: win ? FELT : MUT, minWidth: 16, textAlign: 'center',
        }}>{faDigits(score)}</span>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 80, textAlign: 'center', color: MUT }}>
      {children}
      <style>{`@keyframes bkspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: 14 };
const liveDot: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  fontSize: 11, fontWeight: 800, color: RED,
  background: 'rgba(178,59,46,0.09)', border: '1px solid rgba(178,59,46,0.28)',
  borderRadius: 999, padding: '3px 9px',
};
