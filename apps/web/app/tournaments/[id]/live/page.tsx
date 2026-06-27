'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Clock, Circle, CheckCircle, Trophy, Zap } from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, SAMPLE_LIVE_BRACKET, SAMPLE_PLAYERS,
  toFa, GAME_TYPE_LABELS,
  type TournamentMatch,
} from '../../../../lib/mock-tournaments';

const ROUND_LABELS: Record<number, string> = {
  1: 'مرحله اول', 2: 'یک‌چهارم', 3: 'نیمه‌نهایی', 4: 'فینال',
};
function roundLabel(r: number, total: number) {
  const fe = total - r + 1;
  if (fe === 1) return 'فینال';
  if (fe === 2) return 'نیمه‌نهایی';
  if (fe === 3) return 'یک‌چهارم';
  return `مرحله ${toFa(r)}`;
}

function StatusBadge({ status }: { status: TournamentMatch['status'] }) {
  const cfg = {
    waiting:     { label: 'در انتظار', bg: 'rgba(0,0,0,0.05)', color: '#999' },
    in_progress: { label: '● زنده',    bg: 'rgba(239,68,68,0.10)', color: '#ef4444' },
    completed:   { label: 'پایان یافت', bg: 'rgba(48,197,90,0.10)', color: '#30C55A' },
  };
  const c = cfg[status];
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

/* Score entry dialog */
function ScoreModal({ match, onClose, onSave }: {
  match: TournamentMatch;
  onClose: () => void;
  onSave: (s1: number, s2: number) => void;
}) {
  const [s1, setS1] = useState(match.score1 ?? 0);
  const [s2, setS2] = useState(match.score2 ?? 0);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.50)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '32px 28px',
        width: '100%', maxWidth: 400, boxShadow: '0 24px 80px rgba(0,0,0,0.20)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: '0 0 24px' }}>ثبت نتیجه</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          {/* P1 */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 10 }}>
              {match.player1?.name ?? '—'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setS1(s => Math.max(0, s - 1))} style={{
                width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.12)',
                background: '#fff', fontSize: 20, cursor: 'pointer', fontFamily: 'inherit',
              }}>−</button>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#111', minWidth: 48,
                textAlign: 'center' }}>{toFa(s1)}</span>
              <button onClick={() => setS1(s => s + 1)} style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: 'rgba(199,166,106,0.15)', fontSize: 20, cursor: 'pointer',
                color: '#A07840', fontFamily: 'inherit', fontWeight: 700,
              }}>+</button>
            </div>
          </div>

          <div style={{ fontSize: 18, fontWeight: 900, color: '#ddd' }}>:</div>

          {/* P2 */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 10 }}>
              {match.player2?.name ?? '—'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setS2(s => Math.max(0, s - 1))} style={{
                width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.12)',
                background: '#fff', fontSize: 20, cursor: 'pointer', fontFamily: 'inherit',
              }}>−</button>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#111', minWidth: 48,
                textAlign: 'center' }}>{toFa(s2)}</span>
              <button onClick={() => setS2(s => s + 1)} style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: 'rgba(199,166,106,0.15)', fontSize: 20, cursor: 'pointer',
                color: '#A07840', fontFamily: 'inherit', fontWeight: 700,
              }}>+</button>
            </div>
          </div>
        </div>

        {s1 === s2 && s1 > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f59e0b',
            fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
            تساوی مجاز نیست — یک برنده باید داشته باشیم
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.10)',
            background: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            color: '#555', fontFamily: 'inherit',
          }}>انصراف</button>
          <button onClick={() => s1 !== s2 && onSave(s1, s2)} style={{
            flex: 1, padding: '13px', borderRadius: 14, border: 'none',
            background: s1 === s2 ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg,#30C55A,#26a249)',
            color: s1 === s2 ? '#999' : '#fff',
            fontSize: 14, fontWeight: 700, cursor: s1 === s2 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}>
            <CheckCircle size={14} style={{ verticalAlign: 'middle', marginLeft: 6 }} />
            ثبت نتیجه
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  const { id }  = useParams() as { id: string };
  const router  = useRouter();
  const t       = SAMPLE_TOURNAMENTS.find(x => x.id === id) ?? SAMPLE_TOURNAMENTS[1]!;
  const totalRounds = Math.log2(t.maxPlayers <= 16 ? t.maxPlayers : 16);

  const [matches, setMatches] = useState<TournamentMatch[]>(
    SAMPLE_LIVE_BRACKET.map(m => ({ ...m }))
  );
  const [scoreModal, setScoreModal] = useState<TournamentMatch | null>(null);
  const [activeTab, setActiveTab] = useState<'bracket' | 'matches'>('bracket');
  const [tick, setTick]     = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`bracket-${id}`);
      if (saved) setMatches(JSON.parse(saved));
    } catch {}
  }, [id]);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  const roundGroups = Array.from({ length: totalRounds }, (_, i) => i + 1)
    .map(r => ({ round: r, ms: matches.filter(m => m.round === r) }));

  /* Double-sided bracket helpers */
  const innerRounds = Array.from({ length: totalRounds - 1 }, (_, i) => i + 1);
  const bracketFinal = matches.find(m => m.round === totalRounds);
  const lhalf = (r: number) => { const all = matches.filter(m => m.round === r); return all.filter(m => m.matchIndex < all.length / 2); };
  const rhalf = (r: number) => { const all = matches.filter(m => m.round === r); return all.filter(m => m.matchIndex >= all.length / 2); };

  const liveNow  = matches.filter(m => m.status === 'in_progress');
  const upcoming = matches.filter(m => m.status === 'waiting' && m.player1 && m.player2);
  const done     = matches.filter(m => m.status === 'completed');

  const handleSaveScore = (s1: number, s2: number) => {
    if (!scoreModal) return;
    const winner = s1 > s2 ? scoreModal.player1 : scoreModal.player2;
    setMatches(prev => {
      const next = prev.map(m => m.id === scoreModal.id
        ? { ...m, score1: s1, score2: s2, status: 'completed' as const, winner }
        : m);
      /* Advance winner to next round */
      const thisMatch = next.find(m => m.id === scoreModal.id)!;
      const nextRound = thisMatch.round + 1;
      const nextMatchIdx = Math.floor(thisMatch.matchIndex / 2);
      const nextSlot = thisMatch.matchIndex % 2 === 0 ? 1 : 2;
      const nm = next.find(m => m.round === nextRound && m.matchIndex === nextMatchIdx);
      if (nm) {
        if (nextSlot === 1) nm.player1 = winner;
        else nm.player2 = winner;
        /* Auto start if both players set */
        if (nm.player1 && nm.player2) nm.status = 'in_progress';
      }
      return next;
    });
    setScoreModal(null);
  };

  /* ── Single match card for live bracket ── */
  const LiveCard = ({ m }: { m: TournamentMatch }) => {
    const isLive = m.status === 'in_progress';
    const isDone = m.status === 'completed';
    const clickable = !isDone && !!m.player1 && !!m.player2;
    return (
      <div onClick={() => clickable && setScoreModal(m)} style={{
        width: 158, borderRadius: 9, overflow: 'hidden',
        border: `2px solid ${isLive ? '#ef4444' : isDone ? 'rgba(48,197,90,0.28)' : 'rgba(0,0,0,0.08)'}`,
        background: '#fff', cursor: clickable ? 'pointer' : 'default',
        boxShadow: isLive ? '0 4px 16px rgba(239,68,68,0.14)' : '0 1px 6px rgba(0,0,0,0.05)',
        transition: 'all 0.18s',
      }}>
        {isLive && (
          <div style={{ padding: '3px 9px', background: '#ef4444',
            fontSize: 9, fontWeight: 800, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 4 }}>
            <Circle size={5} fill="#fff" /> زنده
          </div>
        )}
        {([m.player1, m.player2] as (TournamentMatch['player1'])[]).map((p, si) => {
          const score = si === 0 ? m.score1 : m.score2;
          const isWinner = isDone && m.winner?.id === p?.id;
          return (
            <div key={si} style={{
              padding: '7px 9px', display: 'flex', alignItems: 'center', gap: 6,
              borderBottom: si === 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              background: isWinner ? 'rgba(48,197,90,0.05)' : 'transparent',
            }}>
              <span style={{ flex: 1, fontSize: 11, fontWeight: isWinner ? 800 : 600,
                color: p ? (isWinner ? '#30C55A' : '#111') : '#ccc',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p?.name ?? '—'}
              </span>
              {score != null && (
                <span style={{ fontSize: 15, fontWeight: 900, color: isWinner ? '#30C55A' : '#bbb' }}>
                  {toFa(score)}
                </span>
              )}
              {isWinner && <Trophy size={10} color="#30C55A" style={{ flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Double-sided bracket view ── */
  const BracketView = () => (
    <div style={{ overflowX: 'auto', padding: '20px 0', WebkitOverflowScrolling: 'touch' as unknown as undefined }}>
      <div style={{ display: 'flex', direction: 'ltr', alignItems: 'stretch',
        minWidth: 'max-content', padding: '0 16px', gap: 0 }}>

        {/* LEFT HALF: R1 → SF */}
        {innerRounds.map((round, ri) => {
          const ms = lhalf(round);
          const pad = Math.pow(2, ri) * 20;
          return (
            <div key={`L${round}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 800, color: '#ccc',
                letterSpacing: '0.08em', marginBottom: 10, padding: '0 8px' }}>
                {roundLabel(round, totalRounds)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column',
                justifyContent: 'space-around', flex: 1, padding: `${pad}px 8px` }}>
                {ms.map(m => (
                  <div key={m.id} style={{ marginBottom: Math.pow(2, ri) * 12 }}>
                    <LiveCard m={m} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* FINAL in center */}
        {bracketFinal && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#C7A66A',
              textAlign: 'center', padding: '0 10px', marginBottom: 10 }}>
              🏆 فینال
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center',
              flex: 1, padding: `${Math.pow(2, innerRounds.length) * 20}px 10px` }}>
              <LiveCard m={bracketFinal} />
            </div>
          </div>
        )}

        {/* RIGHT HALF: SF → R1 (reversed) */}
        {[...innerRounds].reverse().map((round, ri) => {
          const ms = rhalf(round);
          const mirrorRi = innerRounds.length - 1 - ri;
          const pad = Math.pow(2, mirrorRi) * 20;
          return (
            <div key={`R${round}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 800, color: '#ccc',
                letterSpacing: '0.08em', marginBottom: 10, padding: '0 8px' }}>
                {roundLabel(round, totalRounds)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column',
                justifyContent: 'space-around', flex: 1, padding: `${pad}px 8px` }}>
                {ms.map(m => (
                  <div key={m.id} style={{ marginBottom: Math.pow(2, mirrorRi) * 12 }}>
                    <LiveCard m={m} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── Matches list ── */
  const MatchesView = () => (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {liveNow.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#ef4444',
            letterSpacing: '0.08em', marginBottom: 14 }}>
            ● در حال بازی
          </div>
          {liveNow.map(m => <MatchRow key={m.id} m={m} onScore={() => setScoreModal(m)} />)}
        </section>
      )}
      {upcoming.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#aaa',
            letterSpacing: '0.08em', marginBottom: 14 }}>
            به زودی
          </div>
          {upcoming.map(m => <MatchRow key={m.id} m={m} onScore={() => setScoreModal(m)} />)}
        </section>
      )}
      {done.length > 0 && (
        <section>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#aaa',
            letterSpacing: '0.08em', marginBottom: 14 }}>
            پایان یافته ({toFa(done.length)})
          </div>
          {done.map(m => <MatchRow key={m.id} m={m} onScore={() => {}} />)}
        </section>
      )}
    </div>
  );

  const MatchRow = ({ m, onScore }: { m: TournamentMatch; onScore: () => void }) => {
    const isLive = m.status === 'in_progress';
    const isDone = m.status === 'completed';
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px',
        border: `1.5px solid ${isLive ? '#ef4444' : 'rgba(0,0,0,0.08)'}`,
        marginBottom: 10, boxShadow: isLive ? '0 4px 20px rgba(239,68,68,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusBadge status={m.status} />
            <span style={{ fontSize: 11, color: '#bbb', fontWeight: 600 }}>
              {roundLabel(m.round, totalRounds)} — بازی {toFa(m.matchIndex + 1)}
            </span>
          </div>
          {isLive && (
            <button onClick={onScore} style={{
              padding: '7px 14px', borderRadius: 10, border: 'none',
              background: 'rgba(239,68,68,0.10)', color: '#ef4444',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ثبت نتیجه
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {[m.player1, m.player2].map((p, i) => {
            const s = i === 0 ? m.score1 : m.score2;
            const win = isDone && m.winner?.id === p?.id;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                flexDirection: i === 1 ? 'row-reverse' : 'row' }}>
                <div style={{ textAlign: i === 1 ? 'right' : 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: win ? 900 : 700,
                    color: win ? '#30C55A' : '#111' }}>
                    {p?.name ?? (i === 0 ? 'بازیکن ۱' : 'بازیکن ۲')}
                    {win && <Trophy size={12} color="#30C55A" style={{ verticalAlign: 'middle', marginRight: 4 }} />}
                  </div>
                  {p?.rank && <div style={{ fontSize: 11, color: '#C7A66A' }}>رتبه #{toFa(p.rank)}</div>}
                </div>
                {s != null && (
                  <div style={{ fontSize: 28, fontWeight: 900, color: win ? '#30C55A' : '#ccc' }}>
                    {toFa(s)}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ fontSize: 14, fontWeight: 900, color: '#ddd', padding: '0 8px' }}>:</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#111', color: '#fff',
        marginTop: -72, padding: '88px clamp(16px,4vw,48px) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => router.push(`/tournaments/${t.id}`)} style={{
              display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.55)',
              fontFamily: 'inherit',
            }}>
              <ChevronRight size={15} /> {t.name}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ padding: '5px 12px', borderRadius: 20,
              background: 'rgba(239,68,68,0.20)', border: '1px solid rgba(239,68,68,0.35)',
              fontSize: 12, fontWeight: 700, color: '#ef4444',
              display: 'flex', alignItems: 'center', gap: 5 }}>
              <Circle size={6} fill="#ef4444" /> زنده
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>
              <Zap size={11} style={{ verticalAlign: 'middle' }} /> {GAME_TYPE_LABELS[t.gameType]}
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>{t.name}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 20px' }}>
          {toFa(done.length)} بازی پایان یافته • {toFa(liveNow.length)} در حال بازی • {toFa(upcoming.length)} در انتظار
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 24, paddingBottom: 0, overflowX: 'auto' }}>
          {[
            { label: 'بازی‌های پایان یافته', val: toFa(done.length), color: '#30C55A' },
            { label: 'در حال بازی', val: toFa(liveNow.length), color: '#ef4444' },
            { label: 'بازیکنان باقی‌مانده', val: toFa(matches.filter(m => !m.winner).length * 2), color: '#C7A66A' },
          ].map(s => (
            <div key={s.label} style={{ flexShrink: 0, paddingBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {(['bracket', 'matches'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.40)',
              borderBottom: `2px solid ${activeTab === tab ? '#C7A66A' : 'transparent'}`,
              transition: 'all 0.2s',
            }}>
              {tab === 'bracket' ? 'نمای براکت' : 'لیست بازی‌ها'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'bracket' ? <BracketView /> : <MatchesView />}

      {scoreModal && (
        <ScoreModal
          match={scoreModal}
          onClose={() => setScoreModal(null)}
          onSave={handleSaveScore}
        />
      )}
    </div>
  );
}
