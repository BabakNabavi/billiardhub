'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Circle, Trophy, Zap, Maximize2, Minimize2, ExternalLink, RotateCcw, X, Star } from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, SAMPLE_LIVE_BRACKET,
  toFa, GAME_TYPE_LABELS,
  type TournamentMatch,
} from '../../../../lib/mock-tournaments';

const FORMAT_TO_BEST: Record<string, number> = { bo3:3, bo5:5, bo7:7, bo9:9, bo11:11 };

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
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

/* ── Frame-by-frame scoring modal ── */
function FrameScoringModal({ match, bestOf, onClose, onAddFrame, onUndoFrame, onEndMatch }: {
  match: TournamentMatch;
  bestOf: number;
  onClose: () => void;
  onAddFrame: (w: 1 | 2) => void;
  onUndoFrame: () => void;
  onEndMatch: () => void;
}) {
  const frames = match.frames ?? [];
  const s1 = frames.filter(f => f === 1).length;
  const s2 = frames.filter(f => f === 2).length;
  const winsNeeded = Math.ceil(bestOf / 2);
  const canEnd = frames.length > 0 && s1 !== s2;
  const potWinner = canEnd ? (s1 > s2 ? match.player1 : match.player2) : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '28px 24px',
        width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: '#111', margin: 0 }}>ثبت نتیجه فریم به فریم</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: '#ccc', padding: 4, display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 22,
          fontFamily: 'system-ui,-apple-system,sans-serif' }}>
          Best of {bestOf} • {toFa(winsNeeded)} فریم برای برد
        </div>

        {/* Score display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          {/* P1 */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 10,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {match.player1?.name ?? 'بازیکن ۱'}
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              {Array.from({ length: bestOf }, (_, i) => (
                <div key={i} style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: i < s1 ? '#30C55A' : 'rgba(0,0,0,0.07)',
                  border: `1.5px solid ${i < s1 ? '#26a249' : 'rgba(0,0,0,0.12)'}`,
                }} />
              ))}
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#111', lineHeight: 1 }}>{toFa(s1)}</div>
          </div>

          <div style={{ fontSize: 20, fontWeight: 900, color: '#ddd', flexShrink: 0 }}>:</div>

          {/* P2 */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 10,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {match.player2?.name ?? 'بازیکن ۲'}
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              {Array.from({ length: bestOf }, (_, i) => (
                <div key={i} style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: i < s2 ? '#ef4444' : 'rgba(0,0,0,0.07)',
                  border: `1.5px solid ${i < s2 ? '#dc2626' : 'rgba(0,0,0,0.12)'}`,
                }} />
              ))}
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#111', lineHeight: 1 }}>{toFa(s2)}</div>
          </div>
        </div>

        {/* Frame winner buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <button onClick={() => onAddFrame(1)} style={{
            flex: 1, padding: '14px 8px', borderRadius: 14, border: 'none',
            background: 'rgba(48,197,90,0.12)', color: '#26a249',
            fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.5,
          }}>
            فریم برنده<br />
            <span style={{ fontSize: 11, fontWeight: 600 }}>
              {match.player1?.name?.split(' ')[0] ?? 'بازیکن ۱'}
            </span>
          </button>
          <button onClick={() => onAddFrame(2)} style={{
            flex: 1, padding: '14px 8px', borderRadius: 14, border: 'none',
            background: 'rgba(239,68,68,0.09)', color: '#dc2626',
            fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.5,
          }}>
            فریم برنده<br />
            <span style={{ fontSize: 11, fontWeight: 600 }}>
              {match.player2?.name?.split(' ')[0] ?? 'بازیکن ۲'}
            </span>
          </button>
        </div>

        {/* Undo last frame */}
        {frames.length > 0 && (
          <button onClick={onUndoFrame} style={{
            width: '100%', padding: '9px', borderRadius: 10,
            border: '1.5px solid rgba(0,0,0,0.08)', background: '#fafafa',
            color: '#999', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 5, marginBottom: 12,
          }}>
            <RotateCcw size={12} /> بازگشت آخرین فریم
          </button>
        )}

        {/* End match */}
        <button
          onClick={() => canEnd && onEndMatch()}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: canEnd ? 'linear-gradient(135deg,#1a1a1a,#333)' : 'rgba(0,0,0,0.06)',
            color: canEnd ? '#fff' : '#bbb',
            fontSize: 14, fontWeight: 800,
            cursor: canEnd ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
          }}
        >
          {canEnd ? `پایان مسابقه — برنده: ${potWinner?.name ?? ''}` : 'پایان مسابقه'}
        </button>
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
  const [scoreModal, setScoreModal] = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<'bracket' | 'matches'>('bracket');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControl, setIsControl]       = useState(false);
  const [matchFormat, setMatchFormat]   = useState('bo5');
  const [highestBreak, setHighestBreak] = useState<{ playerName: string; value: number } | null>(null);
  const [hbName, setHbName]   = useState('');
  const [hbValue, setHbValue] = useState('');
  const bracketRef = useRef<HTMLDivElement>(null);

  const bestOf = FORMAT_TO_BEST[matchFormat] ?? 5;

  useEffect(() => {
    setIsControl(new URLSearchParams(window.location.search).get('control') === '1');
  }, []);

  useEffect(() => {
    const fmt = localStorage.getItem(`matchFormat_${id}`);
    if (fmt) setMatchFormat(fmt);
    try {
      const saved = localStorage.getItem(`bracket-${id}`);
      if (saved) setMatches(JSON.parse(saved));
    } catch {}
    try {
      const hb = localStorage.getItem(`highestBreak-${id}`);
      if (hb) {
        const parsed = JSON.parse(hb);
        setHighestBreak(parsed);
        setHbName(parsed.playerName ?? '');
        setHbValue(String(parsed.value ?? ''));
      }
    } catch {}
  }, [id]);

  /* Cross-window sync */
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === `bracket-${id}` && e.newValue) {
        try { setMatches(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === `highestBreak-${id}` && e.newValue) {
        try { setHighestBreak(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [id]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) bracketRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const innerRounds  = Array.from({ length: totalRounds - 1 }, (_, i) => i + 1);
  const bracketFinal = matches.find(m => m.round === totalRounds);
  const lhalf = (r: number) => { const all = matches.filter(m => m.round === r); return all.filter(m => m.matchIndex < all.length / 2); };
  const rhalf = (r: number) => { const all = matches.filter(m => m.round === r); return all.filter(m => m.matchIndex >= all.length / 2); };

  const liveNow  = matches.filter(m => m.status === 'in_progress');
  const upcoming = matches.filter(m => m.status === 'waiting' && m.player1 && m.player2);
  const done     = matches.filter(m => m.status === 'completed');

  /* ── Frame handlers ── */
  const handleAddFrame = (matchId: string, winner: 1 | 2) => {
    setMatches(prev => {
      const next = prev.map(m => {
        if (m.id !== matchId) return m;
        const frames: Array<1 | 2> = [...(m.frames ?? []), winner];
        return {
          ...m,
          frames,
          score1: frames.filter(f => f === 1).length,
          score2: frames.filter(f => f === 2).length,
          status: 'in_progress' as const,
        };
      });
      try { localStorage.setItem(`bracket-${id}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleUndoFrame = (matchId: string) => {
    setMatches(prev => {
      const next = prev.map(m => {
        if (m.id !== matchId) return m;
        const frames = (m.frames ?? []).slice(0, -1) as Array<1 | 2>;
        const s1 = frames.filter(f => f === 1).length;
        const s2 = frames.filter(f => f === 2).length;
        return {
          ...m, frames,
          score1: frames.length > 0 ? s1 : undefined,
          score2: frames.length > 0 ? s2 : undefined,
          status: (frames.length > 0 ? 'in_progress' : 'waiting') as TournamentMatch['status'],
        };
      });
      try { localStorage.setItem(`bracket-${id}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleEndMatch = (matchId: string) => {
    setMatches(prev => {
      const current = prev.find(m => m.id === matchId);
      if (!current) return prev;
      const frames = current.frames ?? [];
      const s1 = frames.filter(f => f === 1).length;
      const s2 = frames.filter(f => f === 2).length;
      if (s1 === s2) return prev;
      const winner = s1 > s2 ? current.player1 : current.player2;
      const next = prev.map(m => m.id === matchId
        ? { ...m, score1: s1, score2: s2, status: 'completed' as const, winner }
        : m
      );
      /* Advance winner to next round */
      const thisMatch = next.find(m => m.id === matchId)!;
      const nextRound    = thisMatch.round + 1;
      const nextMatchIdx = Math.floor(thisMatch.matchIndex / 2);
      const nextSlot     = thisMatch.matchIndex % 2 === 0 ? 1 : 2;
      const nm = next.find(m => m.round === nextRound && m.matchIndex === nextMatchIdx);
      if (nm) {
        if (nextSlot === 1) nm.player1 = winner;
        else nm.player2 = winner;
        if (nm.player1 && nm.player2) nm.status = 'in_progress';
      }
      try { localStorage.setItem(`bracket-${id}`, JSON.stringify(next)); } catch {}
      return next;
    });
    setScoreModal(null);
  };

  const handleSaveHighestBreak = () => {
    const val = parseInt(hbValue, 10);
    if (!hbName.trim() || isNaN(val) || val <= 0) return;
    const hb = { playerName: hbName.trim(), value: val };
    setHighestBreak(hb);
    try { localStorage.setItem(`highestBreak-${id}`, JSON.stringify(hb)); } catch {}
  };

  const activeMatch = scoreModal ? matches.find(m => m.id === scoreModal) ?? null : null;

  /* ── LiveCard — bracket card with red glow for in-progress ── */
  const LiveCard = ({ m }: { m: TournamentMatch }) => {
    const isLive = m.status === 'in_progress';
    const isDone = m.status === 'completed';
    const clickable = !isDone && !!m.player1 && !!m.player2;
    const fs = isFullscreen;
    return (
      <div onClick={() => clickable && setScoreModal(m.id)} style={{
        width: fs ? '100%' : 158,
        borderRadius: fs ? 'clamp(10px,0.8vw,20px)' : 9,
        overflow: 'hidden',
        border: `${fs ? 3 : 2}px solid ${isLive ? '#ef4444' : isDone ? 'rgba(48,197,90,0.28)' : 'rgba(0,0,0,0.08)'}`,
        background: isLive ? 'rgba(254,242,242,1)' : '#fff',
        cursor: clickable ? 'pointer' : 'default',
        boxShadow: isLive
          ? '0 0 0 3px rgba(239,68,68,0.16), 0 8px 24px rgba(239,68,68,0.22)'
          : '0 1px 6px rgba(0,0,0,0.05)',
        transition: 'all 0.18s',
      }}>
        {isLive && (
          <div style={{
            padding: fs ? 'clamp(4px,0.35vw,10px) clamp(10px,0.8vw,20px)' : '4px 9px',
            background: '#ef4444',
            fontSize: fs ? 'clamp(10px,0.75vw,18px)' : 9,
            fontWeight: 800, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Circle size={fs ? 8 : 5} fill="#fff" /> زنده
          </div>
        )}
        {([m.player1, m.player2] as (TournamentMatch['player1'])[]).map((p, si) => {
          const score = si === 0 ? m.score1 : m.score2;
          const isWinner = isDone && m.winner?.id === p?.id;
          return (
            <div key={si} style={{
              padding: fs ? 'clamp(10px,0.7vw,20px) clamp(12px,0.9vw,22px)' : '7px 9px',
              display: 'flex', alignItems: 'center',
              gap: fs ? 'clamp(6px,0.5vw,14px)' : 6,
              borderBottom: si === 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              background: isWinner ? 'rgba(48,197,90,0.05)' : 'transparent',
            }}>
              <span style={{
                flex: 1,
                fontSize: fs ? 'clamp(14px,1.15vw,26px)' : 11,
                fontWeight: isWinner ? 800 : 600,
                color: p ? (isWinner ? '#30C55A' : '#111') : '#ccc',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {p?.name ?? '—'}
              </span>
              {score != null && (
                <span style={{
                  fontSize: fs ? 'clamp(20px,1.8vw,42px)' : 15,
                  fontWeight: 900, color: isWinner ? '#30C55A' : '#bbb',
                }}>
                  {toFa(score)}
                </span>
              )}
              {isWinner && <Trophy size={fs ? 18 : 10} color="#30C55A" style={{ flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Highest Break Panel ── */
  const HighestBreakPanel = ({ small }: { small?: boolean }) => (
    <div style={{
      background: 'linear-gradient(135deg,rgba(199,166,106,0.13),rgba(199,166,106,0.06))',
      border: '1.5px solid rgba(199,166,106,0.32)',
      borderRadius: small ? 14 : 18,
      padding: small ? '12px 18px' : '16px 22px',
      display: 'inline-flex', flexDirection: 'column', gap: 3,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 16px rgba(199,166,106,0.14)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5,
        fontSize: small ? 10 : 11, fontWeight: 800, color: '#A07840', letterSpacing: '0.06em' }}>
        <Star size={small ? 9 : 10} fill="#C7A66A" color="#C7A66A" />
        بالاترین برک
      </div>
      <div style={{ fontSize: small ? 12 : 14, fontWeight: 700, color: '#444' }}>
        {highestBreak?.playerName}
      </div>
      <div style={{
        fontSize: small ? 28 : 36, fontWeight: 900, color: '#C7A66A',
        fontFamily: 'system-ui,-apple-system,sans-serif', lineHeight: 1,
      }}>
        {highestBreak?.value}
      </div>
    </div>
  );

  /* ── Double-sided bracket view ── */
  const BracketView = () => {
    const fs = isFullscreen;
    const colBase: React.CSSProperties = { display: 'flex', flexDirection: 'column',
      ...(fs ? { flex: '1 1 0px', minWidth: 0 } : {}) };
    const vpad = (exp: number) => fs
      ? `${Math.pow(2, exp)}vh clamp(4px,0.4vw,10px)`
      : `${Math.pow(2, exp) * 20}px 8px`;
    const mb   = (exp: number) => fs ? 0 : Math.pow(2, exp) * 12;
    const lbl  : React.CSSProperties = {
      textAlign: 'center', fontWeight: 800, color: '#ccc', letterSpacing: '0.08em',
      marginBottom: fs ? 'clamp(8px,0.8vh,20px)' : 10, padding: '0 8px',
      fontSize: fs ? 'clamp(11px,0.85vw,20px)' : 9,
    };

    return (
      <div style={{ position: 'relative' }}>
        <div style={fs
          ? { width: '100%', padding: 'clamp(12px,1.5vh,32px) 0' }
          : { overflowX: 'auto', padding: '20px 0',
              WebkitOverflowScrolling: 'touch' as unknown as undefined, textAlign: 'center' }}>
          <div style={fs
            ? { display: 'flex', direction: 'ltr', alignItems: 'stretch',
                width: '100%', padding: '0 clamp(12px,1.5vw,40px)' }
            : { display: 'inline-flex', direction: 'ltr', alignItems: 'stretch',
                padding: '0 16px' }}>

            {/* LEFT HALF: R1 → SF */}
            {innerRounds.map((round, ri) => {
              const ms = lhalf(round);
              return (
                <div key={`L${round}`} style={colBase}>
                  <div style={lbl}>{roundLabel(round, totalRounds)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column',
                    justifyContent: fs ? 'space-evenly' : 'space-around',
                    flex: 1, padding: vpad(ri) }}>
                    {ms.map(m => (
                      <div key={m.id} style={{ marginBottom: mb(ri) }}>
                        <LiveCard m={m} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* FINAL in center */}
            {bracketFinal && (
              <div style={{ ...colBase, alignItems: 'center' }}>
                <div style={{ ...lbl,
                  fontSize: fs ? 'clamp(12px,1vw,24px)' : 10,
                  color: '#C7A66A', padding: '0 10px' }}>
                  🏆 فینال
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  flex: 1, padding: vpad(innerRounds.length), width: '100%' }}>
                  <LiveCard m={bracketFinal} />
                </div>
              </div>
            )}

            {/* RIGHT HALF: SF → R1 (reversed) */}
            {[...innerRounds].reverse().map((round, ri) => {
              const ms = rhalf(round);
              const mri = innerRounds.length - 1 - ri;
              return (
                <div key={`R${round}`} style={colBase}>
                  <div style={lbl}>{roundLabel(round, totalRounds)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column',
                    justifyContent: fs ? 'space-evenly' : 'space-around',
                    flex: 1, padding: vpad(mri) }}>
                    {ms.map(m => (
                      <div key={m.id} style={{ marginBottom: mb(mri) }}>
                        <LiveCard m={m} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highest break overlay in fullscreen */}
        {highestBreak && fs && (
          <div style={{ position: 'absolute', bottom: 20, left: 20 }}>
            <HighestBreakPanel />
          </div>
        )}
      </div>
    );
  };

  /* ── Match row (shared between list and control panel) ── */
  const MatchRow = ({ m, onScore, showScore }: { m: TournamentMatch; onScore: () => void; showScore?: boolean }) => {
    const isLive = m.status === 'in_progress';
    const isDone = m.status === 'completed';
    const canScore = (isLive || showScore) && !!m.player1 && !!m.player2 && !isDone;
    return (
      <div style={{
        background: isLive ? 'rgba(254,242,242,1)' : '#fff',
        borderRadius: 16, padding: '16px',
        border: `1.5px solid ${isLive ? '#ef4444' : 'rgba(0,0,0,0.08)'}`,
        marginBottom: 10,
        boxShadow: isLive
          ? '0 0 0 2px rgba(239,68,68,0.12), 0 4px 20px rgba(239,68,68,0.14)'
          : '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusBadge status={m.status} />
            <span style={{ fontSize: 12, color: '#bbb', fontWeight: 600 }}>
              {roundLabel(m.round, totalRounds)} — بازی {toFa(m.matchIndex + 1)}
            </span>
          </div>
          {canScore && (
            <button onClick={onScore} style={{
              padding: '7px 14px', borderRadius: 10, border: 'none',
              background: isLive ? 'rgba(239,68,68,0.10)' : 'rgba(199,166,106,0.12)',
              color: isLive ? '#ef4444' : '#A07840',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
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
                  <div style={{ fontSize: 15, fontWeight: win ? 900 : 700, color: win ? '#30C55A' : '#111' }}>
                    {p?.name ?? (i === 0 ? 'بازیکن ۱' : 'بازیکن ۲')}
                    {win && <Trophy size={12} color="#30C55A" style={{ verticalAlign: 'middle', marginRight: 4 }} />}
                  </div>
                  {p?.rank && <div style={{ fontSize: 12, color: '#C7A66A' }}>رتبه #{toFa(p.rank)}</div>}
                </div>
                {s != null && (
                  <div style={{ fontSize: 28, fontWeight: 900, color: win ? '#30C55A' : '#ccc' }}>
                    {toFa(s)}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ fontSize: 15, fontWeight: 900, color: '#ddd', padding: '0 8px' }}>:</div>
        </div>
      </div>
    );
  };

  /* ── Matches list tab ── */
  const MatchesView = () => (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {liveNow.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#ef4444',
            letterSpacing: '0.08em', marginBottom: 14 }}>● در حال بازی</div>
          {liveNow.map(m => <MatchRow key={m.id} m={m} onScore={() => setScoreModal(m.id)} />)}
        </section>
      )}
      {upcoming.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#aaa',
            letterSpacing: '0.08em', marginBottom: 14 }}>به زودی</div>
          {upcoming.map(m => <MatchRow key={m.id} m={m} onScore={() => setScoreModal(m.id)} />)}
        </section>
      )}
      {done.length > 0 && (
        <section>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#aaa',
            letterSpacing: '0.08em', marginBottom: 14 }}>
            پایان یافته ({toFa(done.length)})
          </div>
          {done.map(m => <MatchRow key={m.id} m={m} onScore={() => {}} />)}
        </section>
      )}
    </div>
  );

  /* ── Control panel popup (opened via window.open) ── */
  if (isControl) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif' }}>
      <div style={{ background: '#111', color: '#fff',
        marginTop: -72, padding: '88px 20px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
          letterSpacing: '0.12em', marginBottom: 4 }}>پنل مدیریت نتایج</div>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>{t.name}</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Circle size={6} fill="#ef4444" /> {toFa(liveNow.length)} زنده
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
            {toFa(upcoming.length)} در انتظار
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#30C55A' }}>
            {toFa(done.length)} پایان
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* Highest break editor */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', marginBottom: 24,
          border: '1.5px solid rgba(199,166,106,0.28)',
          boxShadow: '0 2px 10px rgba(199,166,106,0.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
            fontSize: 13, fontWeight: 800, color: '#A07840' }}>
            <Star size={11} fill="#C7A66A" color="#C7A66A" />
            بالاترین برک
          </div>
          {highestBreak && (
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10,
              background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.20)',
              fontSize: 13, color: '#A07840', fontWeight: 700 }}>
              ثبت شده: {highestBreak.playerName} — {highestBreak.value}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={hbName}
              onChange={e => setHbName(e.target.value)}
              placeholder="نام بازیکن"
              style={{ flex: 1, padding: '9px 12px', borderRadius: 10,
                border: '1.5px solid rgba(0,0,0,0.10)', background: '#fafafa',
                fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
            <input
              value={hbValue}
              onChange={e => setHbValue(e.target.value)}
              placeholder="امتیاز"
              type="number"
              style={{ width: 80, padding: '9px 10px', borderRadius: 10,
                border: '1.5px solid rgba(0,0,0,0.10)', background: '#fafafa',
                fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <button onClick={handleSaveHighestBreak} style={{
            width: '100%', padding: '10px', borderRadius: 10, border: 'none',
            background: 'rgba(199,166,106,0.15)', color: '#A07840',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            ثبت بالاترین برک
          </button>
        </div>

        {liveNow.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#ef4444',
              letterSpacing: '0.08em', marginBottom: 12 }}>● در حال بازی</div>
            {liveNow.map(m => <MatchRow key={m.id} m={m} onScore={() => setScoreModal(m.id)} showScore />)}
          </section>
        )}
        {upcoming.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b',
              letterSpacing: '0.08em', marginBottom: 12 }}>در انتظار</div>
            {upcoming.map(m => <MatchRow key={m.id} m={m} onScore={() => setScoreModal(m.id)} showScore />)}
          </section>
        )}
        {done.length > 0 && (
          <section>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#bbb',
              letterSpacing: '0.08em', marginBottom: 12 }}>
              پایان یافته ({toFa(done.length)})
            </div>
            {done.map(m => <MatchRow key={m.id} m={m} onScore={() => {}} />)}
          </section>
        )}
      </div>

      {activeMatch && (
        <FrameScoringModal
          match={activeMatch}
          bestOf={bestOf}
          onClose={() => setScoreModal(null)}
          onAddFrame={w => handleAddFrame(activeMatch.id, w)}
          onUndoFrame={() => handleUndoFrame(activeMatch.id)}
          onEndMatch={() => handleEndMatch(activeMatch.id)}
        />
      )}
    </div>
  );

  /* ── Main bracket display page ── */
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
              cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.55)', fontFamily: 'inherit',
            }}>
              <ChevronRight size={15} /> {t.name}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ padding: '5px 12px', borderRadius: 20,
              background: 'rgba(239,68,68,0.20)', border: '1px solid rgba(239,68,68,0.35)',
              fontSize: 13, fontWeight: 700, color: '#ef4444',
              display: 'flex', alignItems: 'center', gap: 5 }}>
              <Circle size={6} fill="#ef4444" /> زنده
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>
              <Zap size={11} style={{ verticalAlign: 'middle' }} /> {GAME_TYPE_LABELS[t.gameType]}
            </div>
            <button onClick={() => window.open(
              `/tournaments/${t.id}/live?control=1`,
              'scoreControl',
              'width=520,height=800,resizable=yes,scrollbars=yes'
            )} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.75)',
              fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
            }}>
              <ExternalLink size={11} /> پنل مدیریت
            </button>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>{t.name}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 20px' }}>
          {toFa(done.length)} بازی پایان یافته • {toFa(liveNow.length)} در حال بازی • {toFa(upcoming.length)} در انتظار
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 24, overflowX: 'auto' }}>
          {[
            { label: 'بازی‌های پایان یافته', val: toFa(done.length), color: '#30C55A' },
            { label: 'در حال بازی',           val: toFa(liveNow.length), color: '#ef4444' },
            { label: 'بازیکنان باقی‌مانده',   val: toFa(matches.filter(m => !m.winner).length * 2), color: '#C7A66A' },
          ].map(s => (
            <div key={s.label} style={{ flexShrink: 0, paddingBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {(['bracket', 'matches'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
              color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.40)',
              borderBottom: `2px solid ${activeTab === tab ? '#C7A66A' : 'transparent'}`,
              transition: 'all 0.2s',
            }}>
              {tab === 'bracket' ? 'نمای براکت' : 'لیست بازی‌ها'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'bracket' ? (
        <div ref={bracketRef} style={{
          background: '#F7F7F5', position: 'relative',
          ...(isFullscreen ? {
            overflow: 'auto', direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif',
            display: 'flex', flexDirection: 'column',
          } : {}),
        }}>
          {/* Fullscreen button */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', padding: '10px 16px 0',
            ...(isFullscreen ? { position: 'sticky', top: 0, zIndex: 10,
              background: 'rgba(247,247,245,0.92)', backdropFilter: 'blur(6px)' } : {}),
          }}>
            <button onClick={toggleFullscreen} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 20,
              border: '1.5px solid rgba(0,0,0,0.12)',
              background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700, color: '#555',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isFullscreen ? 'خروج از تمام صفحه' : 'تمام صفحه'}
            </button>
          </div>

          <div style={isFullscreen ? { flex: 1, display: 'flex', alignItems: 'center' } : {}}>
            <div style={isFullscreen ? { width: '100%' } : {}}>
              <BracketView />
            </div>
          </div>

          {/* Highest break below bracket in normal view */}
          {highestBreak && !isFullscreen && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 20px 28px' }}>
              <HighestBreakPanel small />
            </div>
          )}
        </div>
      ) : <MatchesView />}

      {activeMatch && (
        <FrameScoringModal
          match={activeMatch}
          bestOf={bestOf}
          onClose={() => setScoreModal(null)}
          onAddFrame={w => handleAddFrame(activeMatch.id, w)}
          onUndoFrame={() => handleUndoFrame(activeMatch.id)}
          onEndMatch={() => handleEndMatch(activeMatch.id)}
        />
      )}
    </div>
  );
}
