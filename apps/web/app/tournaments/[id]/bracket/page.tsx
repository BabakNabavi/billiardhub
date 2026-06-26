'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronRight, Shuffle, Save, FolderOpen, Check,
  Trophy, RotateCcw, Play, Info, X,
} from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, SAMPLE_PLAYERS, BRACKET_TEMPLATES, toFa,
  type TournamentPlayer, type TournamentMatch,
} from '../../../../lib/mock-tournaments';

const BYE_PLAYER: TournamentPlayer = { id: 'bye', name: 'استراحت', phone: '' };

function generateEmptyBracket(totalSlots: number): TournamentMatch[] {
  const rounds = Math.log2(totalSlots);
  const matches: TournamentMatch[] = [];
  let id = 1;
  for (let r = 1; r <= rounds; r++) {
    const count = totalSlots / Math.pow(2, r);
    for (let i = 0; i < count; i++) {
      matches.push({ id: `m${id++}`, round: r, matchIndex: i, status: 'waiting' });
    }
  }
  return matches;
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i]!, a[j]!] = [a[j]!, a[i]!];
  }
  return a;
}

function roundLabel(round: number, totalRounds: number): string {
  const fe = totalRounds - round + 1;
  if (fe === 1) return 'فینال';
  if (fe === 2) return 'نیمه نهایی';
  if (fe === 3) return 'یک چهارم';
  return `مرحله ${toFa(round)}`;
}

function lqBtn(active: boolean, rgb = '199,166,106', color = '#C7A66A'): React.CSSProperties {
  return {
    padding: '8px 18px', borderRadius: 20,
    border: `1px solid rgba(${rgb},${active ? '0.30' : '0.10'})`,
    background: `rgba(${rgb},${active ? '0.12' : '0.04'})`,
    color: active ? color : 'rgba(0,0,0,0.22)',
    fontSize: 12, fontWeight: 800, cursor: active ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit', transition: 'all 0.18s', display: 'inline-flex',
    alignItems: 'center', gap: 5,
  };
}

/* ── Match Card ── */
function MatchCard({
  match, draggingOver, onDrop, onDragOver, onDragLeave,
  dragFromSlot, onSlotDragStart, isByeMatch,
  onSlotTap, tapPlayerActive, isMobile,
}: {
  match: TournamentMatch;
  draggingOver: string | null;
  onDrop: (e: React.DragEvent, matchId: string, slot: 1 | 2) => void;
  onDragOver: (e: React.DragEvent, matchId: string, slot: 1 | 2) => void;
  onDragLeave: () => void;
  dragFromSlot: { matchId: string; slot: 1 | 2 } | null;
  onSlotDragStart: (e: React.DragEvent, matchId: string, slot: 1 | 2, player: TournamentPlayer) => void;
  isByeMatch?: boolean;
  onSlotTap?: (matchId: string, slot: 1 | 2, player?: TournamentPlayer) => void;
  tapPlayerActive?: boolean;
  isMobile?: boolean;
}) {
  const renderSlot = (player: TournamentPlayer | undefined, slot: 1 | 2) => {
    const slotId = `${match.id}-${slot}`;
    const isOver = draggingOver === slotId;
    const isDragging = dragFromSlot?.matchId === match.id && dragFromSlot.slot === slot;
    const isBye = player?.id === 'bye';
    const isR1  = match.round === 1;
    const isEmptyReady = isMobile && tapPlayerActive && !player && isR1;

    return (
      <div
        draggable={!isMobile && !!player && !isBye && isR1}
        onDragStart={!isMobile && player && !isBye && isR1 ? e => onSlotDragStart(e, match.id, slot, player) : undefined}
        onDragOver={!isMobile ? e => onDragOver(e, match.id, slot) : undefined}
        onDragLeave={!isMobile ? onDragLeave : undefined}
        onDrop={!isMobile ? e => onDrop(e, match.id, slot) : undefined}
        onClick={isMobile && isR1 ? () => onSlotTap?.(match.id, slot, player) : undefined}
        style={{
          padding: '6px 9px', minHeight: 33,
          background: isBye ? 'rgba(0,0,0,0.02)'
            : isEmptyReady ? 'rgba(199,166,106,0.06)'
            : isOver ? 'rgba(199,166,106,0.10)'
            : player ? '#fff'
            : 'rgba(0,0,0,0.015)',
          border: `1px ${isOver || isEmptyReady ? 'solid' : player && !isBye ? 'solid' : 'dashed'} ${
            isOver ? '#C7A66A'
            : isEmptyReady ? 'rgba(199,166,106,0.45)'
            : player && !isBye ? 'rgba(0,0,0,0.08)'
            : 'rgba(0,0,0,0.10)'}`,
          borderRadius: 7,
          cursor: isMobile && isR1
            ? (player && !isBye ? 'pointer' : tapPlayerActive ? 'pointer' : 'default')
            : (!isMobile && player && !isBye && isR1 ? 'grab' : 'default'),
          transition: 'all 0.12s', opacity: isDragging ? 0.3 : 1,
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {isBye ? (
          <span style={{ fontSize: 10, color: '#bbb', fontWeight: 600 }}>استراحت</span>
        ) : player ? (
          <>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#111', flex: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player.name}
            </span>
            {player.rank && (
              <span style={{ fontSize: 9, color: '#C7A66A', fontWeight: 700 }}>#{toFa(player.rank)}</span>
            )}
            {isMobile && (
              <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 900, flexShrink: 0 }}>×</span>
            )}
          </>
        ) : isEmptyReady ? (
          <span style={{ fontSize: 10, color: '#C7A66A', fontWeight: 700 }}>← بزنید</span>
        ) : (
          <span style={{ fontSize: 10, color: '#ddd' }}>
            {isMobile ? '—' : 'بکشید اینجا'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{
      background: isByeMatch ? 'rgba(48,197,90,0.03)' : '#fff',
      borderRadius: 9, overflow: 'hidden',
      border: `1px solid ${isByeMatch ? 'rgba(48,197,90,0.18)' : 'rgba(0,0,0,0.08)'}`,
      boxShadow: '0 1px 5px rgba(0,0,0,0.04)', width: 155,
    }}>
      <div style={{ padding: '3px 9px',
        background: isByeMatch ? 'rgba(48,197,90,0.07)' : 'rgba(0,0,0,0.02)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        fontSize: 9, fontWeight: 700, color: isByeMatch ? '#30C55A' : '#ccc',
        display: 'flex', alignItems: 'center', gap: 3 }}>
        {isByeMatch ? <><Check size={8} /> پیشروی خودکار</> : `بازی ${toFa(match.matchIndex + 1)}`}
      </div>
      <div style={{ padding: '6px 7px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {renderSlot(match.player1, 1)}
        <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#ececec' }}>VS</div>
        {renderSlot(match.player2, 2)}
      </div>
    </div>
  );
}

/* ── Page ── */
export default function BracketPage() {
  const { id }  = useParams() as { id: string };
  const router  = useRouter();
  const t       = SAMPLE_TOURNAMENTS.find(x => x.id === id) ?? SAMPLE_TOURNAMENTS[0]!;

  const approvedPlayers = SAMPLE_PLAYERS.slice(0, Math.min(t.registeredCount, t.maxPlayers));
  const totalSlots  = t.maxPlayers <= 16 ? t.maxPlayers : 16;
  const totalRounds = Math.log2(totalSlots);
  const needsBye    = approvedPlayers.length < totalSlots;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [method, setMethod]     = useState<'manual' | 'random' | null>(null);
  const [showRandom, setShowR]  = useState(false);
  const [showT, setShowT]       = useState(false);
  const [byeDlg, setByeDlg]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [matches, setMatches]   = useState<TournamentMatch[]>(generateEmptyBracket(totalSlots));
  const [pool, setPool]         = useState<TournamentPlayer[]>(approvedPlayers);

  /* Desktop drag state */
  const [dragFromPool, setDFP]  = useState<TournamentPlayer | null>(null);
  const [dragFromSlot, setDFS]  = useState<{ matchId: string; slot: 1 | 2; player: TournamentPlayer } | null>(null);
  const [draggingOver, setDO]   = useState<string | null>(null);

  /* Mobile tap state */
  const [tapPlayer, setTapPlayer] = useState<TournamentPlayer | null>(null);

  /* ── Desktop Drag handlers ── */
  const handlePoolDragStart = (e: React.DragEvent, player: TournamentPlayer) => {
    setDFP(player); setDFS(null); e.dataTransfer.effectAllowed = 'move';
  };
  const handleSlotDragStart = (e: React.DragEvent, matchId: string, slot: 1 | 2, player: TournamentPlayer) => {
    setDFS({ matchId, slot, player }); setDFP(null); e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, matchId: string, slot: 1 | 2) => {
    e.preventDefault(); setDO(`${matchId}-${slot}`);
  };
  const handleDragLeave = () => setDO(null);

  const handleDrop = (e: React.DragEvent, targetMatchId: string, targetSlot: 1 | 2) => {
    e.preventDefault(); setDO(null);
    setMatches(prev => {
      const next = prev.map(m => ({ ...m }));
      const tm = next.find(m => m.id === targetMatchId)!;
      if (tm.round !== 1) return prev; // only Round 1 placements allowed
      const current = targetSlot === 1 ? tm.player1 : tm.player2;
      if (dragFromPool) {
        if (current) setPool(p => [...p.filter(x => x.id !== dragFromPool.id), current]);
        else setPool(p => p.filter(x => x.id !== dragFromPool.id));
        if (targetSlot === 1) tm.player1 = dragFromPool; else tm.player2 = dragFromPool;
      } else if (dragFromSlot) {
        const sm = next.find(m => m.id === dragFromSlot.matchId)!;
        if (dragFromSlot.slot === 1) sm.player1 = current ?? undefined;
        else sm.player2 = current ?? undefined;
        if (targetSlot === 1) tm.player1 = dragFromSlot.player; else tm.player2 = dragFromSlot.player;
        if (!current) { if (dragFromSlot.slot === 1) sm.player1 = undefined; else sm.player2 = undefined; }
      }
      return next;
    });
    setDFP(null); setDFS(null);
  };

  const handlePoolDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragFromSlot) {
      setMatches(prev => prev.map(m => {
        if (m.id !== dragFromSlot.matchId) return m;
        return dragFromSlot.slot === 1 ? { ...m, player1: undefined } : { ...m, player2: undefined };
      }));
      setPool(prev => [...prev, dragFromSlot.player]);
    }
    setDFP(null); setDFS(null); setDO(null);
  };

  /* ── Mobile tap-to-assign ── */
  const handleSlotTap = (matchId: string, slot: 1 | 2, currentPlayer?: TournamentPlayer) => {
    const matchRef = matches.find(m => m.id === matchId);
    if (!matchRef || matchRef.round !== 1) return; // only Round 1
    if (currentPlayer && currentPlayer.id !== 'bye') {
      // Remove player from slot → back to pool
      setMatches(prev => prev.map(m => {
        if (m.id !== matchId) return m;
        return slot === 1 ? { ...m, player1: undefined } : { ...m, player2: undefined };
      }));
      setPool(prev => [...prev, currentPlayer]);
      if (tapPlayer?.id === currentPlayer.id) setTapPlayer(null);
    } else if (tapPlayer && !currentPlayer) {
      // Place selected player into slot
      setMatches(prev => prev.map(m => {
        if (m.id !== matchId) return m;
        return slot === 1 ? { ...m, player1: tapPlayer } : { ...m, player2: tapPlayer };
      }));
      setPool(prev => prev.filter(p => p.id !== tapPlayer.id));
      setTapPlayer(null);
    }
  };

  /* Randomize */
  const randomize = () => {
    const padded = needsBye
      ? [...shuffleArr(approvedPlayers), ...Array(totalSlots - approvedPlayers.length).fill(BYE_PLAYER)]
      : shuffleArr(approvedPlayers);
    setMatches(prev => {
      const next = [...prev];
      const r1 = next.filter(m => m.round === 1);
      r1.forEach((m, i) => { m.player1 = padded[i * 2]; m.player2 = padded[i * 2 + 1]; });
      return next;
    });
    setPool([]); setShowR(false); setMethod('random');
  };

  /* Apply BYE and start */
  const applyByes = () => {
    setMatches(prev => {
      const next = prev.map(m => ({ ...m }));
      next.filter(m => m.round === 1).forEach(m => {
        if (!m.player1 && m.player2) m.player1 = BYE_PLAYER;
        if (m.player1 && !m.player2) m.player2 = BYE_PLAYER;
        if (m.player1?.id === 'bye' || m.player2?.id === 'bye') {
          const winner = m.player1?.id === 'bye' ? m.player2 : m.player1;
          m.winner = winner; m.status = 'completed';
          const nm = next.find(x => x.round === 2 && x.matchIndex === Math.floor(m.matchIndex / 2));
          if (nm && winner) { if (m.matchIndex % 2 === 0) nm.player1 = winner; else nm.player2 = winner; }
        }
      });
      try { localStorage.setItem(`bracket-${t.id}`, JSON.stringify(next)); } catch {}
      return next;
    });
    setConfirmed(true); setByeDlg(false);
  };

  const handleStart = () => {
    const hasEmpty = matches.filter(m => m.round === 1).some(m => !m.player1 || !m.player2);
    if (hasEmpty) {
      setByeDlg(true);
    } else {
      try { localStorage.setItem(`bracket-${t.id}`, JSON.stringify(matches)); } catch {}
      setConfirmed(true);
    }
  };

  const reset = () => {
    setMatches(generateEmptyBracket(totalSlots));
    setPool(approvedPlayers); setMethod(null); setSaved(false); setConfirmed(false);
    setTapPlayer(null);
  };

  /* Bracket split helpers */
  const innerRounds = Array.from({ length: totalRounds - 1 }, (_, i) => i + 1);
  const finalMatch = matches.find(m => m.round === totalRounds);

  const leftHalf = (r: number) => {
    const all = matches.filter(m => m.round === r);
    return all.filter(m => m.matchIndex < all.length / 2);
  };
  const rightHalf = (r: number) => {
    const all = matches.filter(m => m.round === r);
    return all.filter(m => m.matchIndex >= all.length / 2);
  };

  const isByeM = (m: TournamentMatch) =>
    m.status === 'completed' && (m.player1?.id === 'bye' || m.player2?.id === 'bye');

  const slotRef = dragFromSlot ? { matchId: dragFromSlot.matchId, slot: dragFromSlot.slot } : null;

  /* ── Method selection ── */
  if (!method && !showRandom) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingTop: 88 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '16px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push(`/tournaments/${t.id}/admin`)} style={{
            display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 13, color: '#777', fontFamily: 'inherit' }}>
            <ChevronRight size={14} /> مدیریت
          </button>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>›</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>ایجاد براکت دو طرفه</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ maxWidth: 580, width: '100%' }}>
          {needsBye && (
            <div style={{ marginBottom: 20, padding: '14px 18px',
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.22)',
              borderRadius: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Info size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13, color: '#78350f', margin: 0, lineHeight: 1.6 }}>
                <strong>{toFa(approvedPlayers.length)} نفر</strong> ثبت‌نام کرده‌اند از {toFa(totalSlots)} ظرفیت.
                {' '}{toFa(totalSlots - approvedPlayers.length)} جایگاه با «استراحت» (BYE) پر می‌شود.
              </p>
            </div>
          )}

          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 6px', textAlign: 'center' }}>
            روش چیدمان براکت
          </h1>
          <p style={{ fontSize: 13, color: '#888', textAlign: 'center', margin: '0 0 28px' }}>
            جدول دو طرفه — نیمی از بازیکنان در هر طرف
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {[
              { key: 'manual' as const, label: 'دستی', icon: <Trophy size={20} color="#C7A66A" />,
                rgb: '199,166,106', color: '#C7A66A', desc: 'بازیکنان را روی جدول قرار دهید',
                badge: '✓ پیشنهاد' },
              { key: null as null, label: 'تصادفی', icon: <Shuffle size={20} color="#8b5cf6" />,
                rgb: '139,92,246', color: '#8b5cf6', desc: 'سیستم بازیکنان را تصادفی چیده‌می‌شود',
                badge: '' },
            ].map((opt, i) => (
              <button key={i} onClick={() => i === 0 ? setMethod('manual') : setShowR(true)} style={{
                background: '#fff', borderRadius: 18, padding: '22px 18px',
                border: `1px solid rgba(${opt.rgb},0.20)`,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
                boxShadow: '0 3px 12px rgba(0,0,0,0.05)',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 12,
                  background: `rgba(${opt.rgb},0.10)`, border: `1px solid rgba(${opt.rgb},0.18)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {opt.icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#111', marginBottom: 5 }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{opt.desc}</div>
                {opt.badge && (
                  <div style={{ marginTop: 12, display: 'inline-flex', background: `rgba(${opt.rgb},0.10)`,
                    border: `1px solid rgba(${opt.rgb},0.22)`, borderRadius: 20,
                    padding: '4px 12px', fontSize: 11, fontWeight: 800, color: opt.color }}>
                    {opt.badge}
                  </div>
                )}
              </button>
            ))}
          </div>

          <button onClick={() => setShowT(v => !v)} style={{
            width: '100%', padding: '11px', borderRadius: 20,
            border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.03)',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#666',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            <FolderOpen size={14} /> بارگذاری قالب
          </button>
          {showT && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '12px',
              border: '1px solid rgba(0,0,0,0.08)', marginTop: 10 }}>
              {BRACKET_TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => { setMethod('manual'); setShowT(false); }} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none',
                  background: 'rgba(0,0,0,0.02)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6,
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{tpl.name}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{tpl.date} • {toFa(tpl.players)} نفر</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#C7A66A', fontWeight: 800 }}>بارگذاری</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ── Random confirm dialog ── */
  if (showRandom) return (
    <div style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 22, padding: '32px 28px',
        maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <Shuffle size={28} color="#8b5cf6" style={{ marginBottom: 14 }} />
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: '0 0 10px' }}>چیدمان تصادفی</h2>
        <p style={{ fontSize: 13, color: '#777', lineHeight: 1.7, margin: '0 0 22px' }}>
          {toFa(approvedPlayers.length)} بازیکن تصادفی در جدول چیده می‌شوند.
          {needsBye && ` ${toFa(totalSlots - approvedPlayers.length)} جایگاه استراحت (BYE) اضافه می‌شود.`}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setShowR(false)} style={lqBtn(true, '0,0,0', '#666')}>انصراف</button>
          <button onClick={randomize} style={lqBtn(true, '139,92,246', '#8b5cf6')}>
            <Shuffle size={13} /> تصادفی کن
          </button>
        </div>
      </div>
    </div>
  );

  /* ── BYE dialog ── */
  const ByeDialog = () => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 22, padding: '30px 26px',
        maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.20)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏖️</div>
        <h3 style={{ fontSize: 17, fontWeight: 900, color: '#111', margin: '0 0 10px' }}>جایگاه‌های خالی</h3>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, margin: '0 0 22px' }}>
          برخی جایگاه‌ها بازیکن ندارند. «استراحت» (BYE) اضافه می‌شود و
          بازیکن مقابل خودکار پیشروی می‌کند.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setByeDlg(false)} style={lqBtn(true, '0,0,0', '#666')}>بازگشت</button>
          <button onClick={applyByes} style={lqBtn(true)}>
            <Check size={13} /> تایید و شروع
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Bracket canvas (shared mobile/desktop) ── */
  const BracketCanvas = () => (
    <div style={{ overflowX: 'auto', overflowY: 'auto', padding: '16px 12px',
      flex: isMobile ? undefined : 1,
      WebkitOverflowScrolling: 'touch' as unknown as undefined }}>
      <div style={{ display: 'flex', direction: 'ltr', alignItems: 'stretch',
        minWidth: 'max-content', gap: 0 }}>

        {/* LEFT HALF columns: R1 → QF → SF */}
        {innerRounds.map((round, ri) => {
          const ms = leftHalf(round);
          const pad = Math.pow(2, ri) * 18;
          return (
            <div key={`L${round}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#ccc',
                letterSpacing: '0.08em', textAlign: 'center', padding: '0 8px', marginBottom: 8 }}>
                {roundLabel(round, totalRounds)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column',
                justifyContent: 'space-around', flex: 1, padding: `${pad}px 8px` }}>
                {ms.map(m => (
                  <div key={m.id} style={{ marginBottom: Math.pow(2, ri) * 10 }}>
                    <MatchCard match={m} draggingOver={draggingOver}
                      onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                      dragFromSlot={slotRef} onSlotDragStart={handleSlotDragStart}
                      isByeMatch={isByeM(m)}
                      onSlotTap={handleSlotTap} tapPlayerActive={!!tapPlayer} isMobile={isMobile} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* CENTER — FINAL */}
        {finalMatch && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#C7A66A',
              textAlign: 'center', padding: '0 10px', marginBottom: 8 }}>
              🏆 فینال
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center',
              flex: 1, padding: `${Math.pow(2, innerRounds.length) * 18}px 10px` }}>
              <MatchCard match={finalMatch} draggingOver={draggingOver}
                onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                dragFromSlot={slotRef} onSlotDragStart={handleSlotDragStart}
                onSlotTap={handleSlotTap} tapPlayerActive={!!tapPlayer} isMobile={isMobile} />
            </div>
          </div>
        )}

        {/* RIGHT HALF columns: SF → QF → R1 */}
        {[...innerRounds].reverse().map((round, ri) => {
          const ms = rightHalf(round);
          const mirrorRi = innerRounds.length - 1 - ri;
          const pad = Math.pow(2, mirrorRi) * 18;
          return (
            <div key={`R${round}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#ccc',
                letterSpacing: '0.08em', textAlign: 'center', padding: '0 8px', marginBottom: 8 }}>
                {roundLabel(round, totalRounds)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column',
                justifyContent: 'space-around', flex: 1, padding: `${pad}px 8px` }}>
                {ms.map(m => (
                  <div key={m.id} style={{ marginBottom: Math.pow(2, mirrorRi) * 10 }}>
                    <MatchCard match={m} draggingOver={draggingOver}
                      onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                      dragFromSlot={slotRef} onSlotDragStart={handleSlotDragStart}
                      isByeMatch={isByeM(m)}
                      onSlotTap={handleSlotTap} tapPlayerActive={!!tapPlayer} isMobile={isMobile} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── Main bracket builder ── */
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingTop: 88 }}>

      {byeDlg && <ByeDialog />}

      {/* Sticky header */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '10px clamp(12px,3vw,28px)', position: 'sticky', top: 72, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#999', fontFamily: 'inherit' }}>
              <ChevronRight size={13} /> براکت
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>
              {method === 'manual' ? 'دستی' : 'تصادفی'} — دو طرفه
            </span>
            {pool.length > 0 && (
              <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.20)', borderRadius: 20,
                padding: '2px 10px', fontWeight: 700 }}>
                {toFa(pool.length)} باقی‌مانده
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button onClick={reset} style={lqBtn(true, '0,0,0', '#777')}>
              <RotateCcw size={11} /> بازنشانی
            </button>
            <button onClick={() => setSaved(true)}
              style={lqBtn(true, saved ? '48,197,90' : '199,166,106', saved ? '#30C55A' : '#C7A66A')}>
              <Save size={11} /> {saved ? 'ذخیره شد ✓' : 'ذخیره'}
            </button>
            {!confirmed ? (
              <button onClick={handleStart} style={lqBtn(true)}>
                <Play size={11} /> شروع
              </button>
            ) : (
              <button onClick={() => {
                try { localStorage.setItem(`bracket-${t.id}`, JSON.stringify(matches)); } catch {}
                router.push(`/tournaments/${t.id}/live`);
              }} style={lqBtn(true, '48,197,90', '#30C55A')}>
                <Check size={11} /> نمای زنده
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
          {/* Player chips strip */}
          <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
            flexShrink: 0 }}>
            {tapPlayer ? (
              <div style={{ padding: '8px 14px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, fontSize: 12, color: '#C7A66A', fontWeight: 700 }}>
                  «{tapPlayer.name}» انتخاب شد — روی جایگاه خالی بزنید
                </div>
                <button onClick={() => setTapPlayer(null)} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
                  borderRadius: 20, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 11, color: '#ef4444', fontWeight: 700,
                }}>
                  <X size={10} /> لغو
                </button>
              </div>
            ) : (
              <div style={{ padding: '8px 14px 4px', fontSize: 11, color: '#bbb', fontWeight: 700 }}>
                {pool.length > 0 ? 'روی بازیکن بزنید تا انتخاب شود' : '✓ همه بازیکنان تخصیص یافتند'}
              </div>
            )}
            <div style={{ overflowX: 'auto', display: 'flex', gap: 7, padding: '4px 14px 10px',
              WebkitOverflowScrolling: 'touch' as unknown as undefined }}>
              {pool.map(p => (
                <button key={p.id} onClick={() => setTapPlayer(tapPlayer?.id === p.id ? null : p)}
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 11px', borderRadius: 20,
                    background: tapPlayer?.id === p.id ? 'rgba(199,166,106,0.13)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${tapPlayer?.id === p.id ? 'rgba(199,166,106,0.55)' : 'rgba(0,0,0,0.08)'}`,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.14s',
                  }}>
                  <span style={{ fontSize: 12, fontWeight: 700,
                    color: tapPlayer?.id === p.id ? '#C7A66A' : '#333' }}>
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bracket scrollable area */}
          <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' as unknown as undefined }}>
            <BracketCanvas />
          </div>
        </div>
      ) : (
        /* ── DESKTOP LAYOUT ── */
        <div style={{ display: 'flex', height: 'calc(100vh - 165px)', overflow: 'hidden' }}>

          {/* Player pool sidebar */}
          <div style={{ width: 185, flexShrink: 0, background: '#fff',
            borderLeft: '1px solid rgba(0,0,0,0.06)', overflowY: 'auto', padding: '12px 10px' }}
            onDragOver={e => e.preventDefault()} onDrop={handlePoolDrop}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#ccc',
              letterSpacing: '0.10em', marginBottom: 10 }}>بازیکنان</div>
            {pool.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '18px 0', color: '#ddd', fontSize: 11 }}>
                <Check size={18} style={{ marginBottom: 5 }} /><br />همه تخصیص یافتند
              </div>
            ) : pool.map(p => (
              <div key={p.id} draggable onDragStart={e => handlePoolDragStart(e, p)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 8px',
                  borderRadius: 9, marginBottom: 5, background: 'rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.06)', cursor: 'grab' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#111',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  {p.rank && <div style={{ fontSize: 9, color: '#C7A66A' }}>#{toFa(p.rank)}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Bracket canvas */}
          <BracketCanvas />
        </div>
      )}
    </div>
  );
}
