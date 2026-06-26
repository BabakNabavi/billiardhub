'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronRight, Shuffle, Save, FolderOpen, Check, X,
  Trophy, AlertCircle, RotateCcw, Play,
} from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, SAMPLE_REGISTRATIONS, SAMPLE_PLAYERS,
  BRACKET_TEMPLATES, toFa,
  type TournamentPlayer, type TournamentMatch,
} from '../../../../lib/mock-tournaments';

type BracketMethod = 'manual' | 'random';

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

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i]!, a[j]!] = [a[j]!, a[i]!];
  }
  return a;
}

const ROUND_LABELS: Record<number, string> = {
  1: 'مرحله اول', 2: 'یک‌چهارم', 3: 'نیمه‌نهایی', 4: 'فینال',
  5: 'فینال', 6: 'فینال',
};
function roundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round + 1;
  if (fromEnd === 1) return 'فینال';
  if (fromEnd === 2) return 'نیمه‌نهایی';
  if (fromEnd === 3) return 'یک‌چهارم';
  return `مرحله ${toFa(round)}`;
}

/* ── Match card ── */
function MatchCard({
  match, isDraggingOver, onDrop, onDragOver, onDragLeave,
  slotDrag, onSlotDragStart,
}: {
  match: TournamentMatch;
  isDraggingOver: string | null;
  onDrop: (e: React.DragEvent, matchId: string, slot: 1 | 2) => void;
  onDragOver: (e: React.DragEvent, matchId: string, slot: 1 | 2) => void;
  onDragLeave: () => void;
  slotDrag: { matchId: string; slot: 1 | 2 } | null;
  onSlotDragStart: (e: React.DragEvent, matchId: string, slot: 1 | 2, player: TournamentPlayer) => void;
}) {
  const renderSlot = (player: TournamentPlayer | undefined, slot: 1 | 2) => {
    const slotId = `${match.id}-${slot}`;
    const isOver = isDraggingOver === slotId;
    const isDragging = slotDrag?.matchId === match.id && slotDrag.slot === slot;

    return (
      <div
        draggable={!!player}
        onDragStart={player ? e => onSlotDragStart(e, match.id, slot, player) : undefined}
        onDragOver={e => onDragOver(e, match.id, slot)}
        onDragLeave={onDragLeave}
        onDrop={e => onDrop(e, match.id, slot)}
        style={{
          padding: '10px 14px', minHeight: 44,
          background: isOver ? 'rgba(199,166,106,0.12)' : player ? '#fff' : 'rgba(0,0,0,0.02)',
          border: `1.5px ${isOver ? 'solid' : player ? 'solid' : 'dashed'} ${
            isOver ? '#C7A66A' : player ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.12)'}`,
          borderRadius: 10, cursor: player ? 'grab' : 'default',
          transition: 'all 0.15s',
          opacity: isDragging ? 0.4 : 1,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        {player ? (
          <>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: `hsl(${player.name.charCodeAt(0) * 15},50%,85%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
              color: `hsl(${player.name.charCodeAt(0) * 15},50%,35%)`,
            }}>
              {player.name[0]}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111', flex: 1 }}>
              {player.name}
            </span>
            {player.rank && (
              <span style={{ fontSize: 11, color: '#C7A66A', fontWeight: 700 }}>
                #{toFa(player.rank)}
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#bbb' }}>بازیکن را اینجا بکشید</span>
        )}
      </div>
    );
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      width: 210,
    }}>
      <div style={{ padding: '6px 14px', background: 'rgba(0,0,0,0.02)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        fontSize: 11, fontWeight: 700, color: '#aaa' }}>
        بازی {toFa(match.matchIndex + 1)}
      </div>
      <div style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {renderSlot(match.player1, 1)}
        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#ddd' }}>VS</div>
        {renderSlot(match.player2, 2)}
      </div>
    </div>
  );
}

export default function BracketPage() {
  const { id }  = useParams() as { id: string };
  const router  = useRouter();
  const t       = SAMPLE_TOURNAMENTS.find(x => x.id === id) ?? SAMPLE_TOURNAMENTS[0]!;

  const approvedPlayers = SAMPLE_PLAYERS.slice(0, t.registeredCount > 8 ? 8 : t.registeredCount);
  const totalSlots = t.maxPlayers <= 16 ? t.maxPlayers : 16;
  const totalRounds = Math.log2(totalSlots);

  const [method, setMethod]         = useState<BracketMethod | null>(null);
  const [showRandom, setShowRandom] = useState(false);
  const [showTemplates, setTemplates] = useState(false);
  const [saved, setSaved]           = useState(false);
  const [confirmed, setConfirmed]   = useState(false);

  const [matches, setMatches]     = useState<TournamentMatch[]>(generateEmptyBracket(totalSlots));
  const [pool, setPool]           = useState<TournamentPlayer[]>(approvedPlayers);
  const [dragFromPool, setDFP]    = useState<TournamentPlayer | null>(null);
  const [dragFromSlot, setDFS]    = useState<{ matchId: string; slot: 1 | 2; player: TournamentPlayer } | null>(null);
  const [draggingOver, setDO]     = useState<string | null>(null);

  /* Drag from pool */
  const handlePoolDragStart = (e: React.DragEvent, player: TournamentPlayer) => {
    setDFP(player);
    setDFS(null);
    e.dataTransfer.effectAllowed = 'move';
  };

  /* Drag from slot */
  const handleSlotDragStart = (e: React.DragEvent, matchId: string, slot: 1 | 2, player: TournamentPlayer) => {
    setDFS({ matchId, slot, player });
    setDFP(null);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, matchId: string, slot: 1 | 2) => {
    e.preventDefault();
    setDO(`${matchId}-${slot}`);
  };
  const handleDragLeave = () => setDO(null);

  const handleDrop = (e: React.DragEvent, targetMatchId: string, targetSlot: 1 | 2) => {
    e.preventDefault();
    setDO(null);

    setMatches(prev => {
      const next = prev.map(m => ({ ...m }));
      const targetMatch = next.find(m => m.id === targetMatchId)!;
      const currentOccupant = targetSlot === 1 ? targetMatch.player1 : targetMatch.player2;

      if (dragFromPool) {
        // From pool → slot
        if (currentOccupant) {
          setPool(p => [...p.filter(x => x.id !== dragFromPool.id), currentOccupant]);
        } else {
          setPool(p => p.filter(x => x.id !== dragFromPool.id));
        }
        if (targetSlot === 1) targetMatch.player1 = dragFromPool;
        else targetMatch.player2 = dragFromPool;
      } else if (dragFromSlot) {
        // From slot → slot
        const sourceMatch = next.find(m => m.id === dragFromSlot.matchId)!;
        if (dragFromSlot.slot === 1) sourceMatch.player1 = currentOccupant;
        else sourceMatch.player2 = currentOccupant;
        if (targetSlot === 1) targetMatch.player1 = dragFromSlot.player;
        else targetMatch.player2 = dragFromSlot.player;
        if (!currentOccupant) {
          if (dragFromSlot.slot === 1) sourceMatch.player1 = undefined;
          else sourceMatch.player2 = undefined;
        }
      }
      return next;
    });
    setDFP(null); setDFS(null);
  };

  /* Pool drag-back */
  const handlePoolDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragFromSlot) {
      setMatches(prev => prev.map(m => {
        if (m.id !== dragFromSlot.matchId) return m;
        const copy = { ...m };
        if (dragFromSlot.slot === 1) copy.player1 = undefined;
        else copy.player2 = undefined;
        return copy;
      }));
      setPool(prev => [...prev, dragFromSlot.player]);
    }
    setDFP(null); setDFS(null); setDO(null);
  };

  const randomize = () => {
    const shuffled = shuffleArray(approvedPlayers);
    setMatches(prev => {
      const next = [...prev];
      const r1 = next.filter(m => m.round === 1);
      r1.forEach((m, i) => {
        m.player1 = shuffled[i * 2];
        m.player2 = shuffled[i * 2 + 1];
      });
      return next;
    });
    setPool([]);
    setShowRandom(false);
    setMethod('random');
  };

  const reset = () => {
    setMatches(generateEmptyBracket(totalSlots));
    setPool(approvedPlayers);
    setMethod(null);
    setSaved(false);
    setConfirmed(false);
  };

  const roundGroups = Array.from({ length: totalRounds }, (_, i) => i + 1)
    .map(r => ({ round: r, matches: matches.filter(m => m.round === r) }));

  /* ── Method selection ── */
  if (!method && !showRandom) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingTop: 88, display: 'flex',
      flexDirection: 'column' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '20px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push(`/tournaments/${t.id}/admin`)} style={{
            display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 14, color: '#777', fontFamily: 'inherit',
          }}>
            <ChevronRight size={15} /> مدیریت
          </button>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>ایجاد براکت</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px' }}>
        <div style={{ maxWidth: 640, width: '100%' }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', margin: '0 0 8px',
            textAlign: 'center' }}>روش چیدمان براکت</h1>
          <p style={{ fontSize: 14, color: '#777', textAlign: 'center', margin: '0 0 36px', lineHeight: 1.7 }}>
            در اکثر باشگاه‌ها مدیر براکت را بر اساس سطح بازیکنان می‌چیند تا بازی‌های جذاب‌تری داشته باشیم
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Manual */}
            <button onClick={() => setMethod('manual')} style={{
              background: '#fff', borderRadius: 24, padding: '32px 28px',
              border: '2px solid rgba(199,166,106,0.25)',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
              transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, marginBottom: 16,
                background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={24} color="#C7A66A" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#111', marginBottom: 8 }}>
                چیدمان دستی
              </div>
              <div style={{ fontSize: 13, color: '#777', lineHeight: 1.7 }}>
                شما بازیکنان را با کشیدن و رها کردن در جدول قرار می‌دهید. کنترل کامل دارید.
              </div>
              <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(199,166,106,0.10)', borderRadius: 20,
                padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#C7A66A' }}>
                ✓ پیشنهاد ما
              </div>
            </button>

            {/* Random */}
            <button onClick={() => setShowRandom(true)} style={{
              background: '#fff', borderRadius: 24, padding: '32px 28px',
              border: '2px solid rgba(0,0,0,0.08)',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
              transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, marginBottom: 16,
                background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shuffle size={24} color="#8b5cf6" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#111', marginBottom: 8 }}>
                چیدمان تصادفی
              </div>
              <div style={{ fontSize: 13, color: '#777', lineHeight: 1.7 }}>
                سیستم به‌صورت خودکار بازیکنان را به‌صورت تصادفی در جدول قرار می‌دهد.
              </div>
            </button>
          </div>

          {/* Load template */}
          <button onClick={() => setTemplates(v => !v)} style={{
            width: '100%', padding: '14px', borderRadius: 16, border: 'none',
            background: 'rgba(0,0,0,0.04)', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 14, fontWeight: 700, color: '#666',
          }}>
            <FolderOpen size={16} />
            بارگذاری قالب قبلی
          </button>

          {showTemplates && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px',
              border: '1px solid rgba(0,0,0,0.08)', marginTop: 12 }}>
              {BRACKET_TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => { setMethod('manual'); setTemplates(false); }} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none',
                  background: 'rgba(0,0,0,0.02)', cursor: 'pointer', fontFamily: 'inherit',
                  marginBottom: 8, transition: 'background 0.15s',
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{tpl.name}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                      {tpl.date} • {toFa(tpl.players)} نفر
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#C7A66A', fontWeight: 700 }}>بارگذاری</div>
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
    <div style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.40)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '40px 36px',
        maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px' }}>
          <Shuffle size={28} color="#8b5cf6" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: '0 0 12px' }}>
          چیدمان تصادفی
        </h2>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.7, margin: '0 0 28px' }}>
          سیستم {toFa(approvedPlayers.length)} بازیکن را به‌صورت کاملاً تصادفی در جدول قرار می‌دهد. آیا مطمئن هستید؟
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setShowRandom(false)} style={{
            flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.10)',
            background: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            color: '#555', fontFamily: 'inherit',
          }}>
            انصراف
          </button>
          <button onClick={randomize} style={{
            flex: 1, padding: '13px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Shuffle size={14} style={{ verticalAlign: 'middle', marginLeft: 6 }} />
            تصادفی کن
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Main bracket builder ── */
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingTop: 88 }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '16px clamp(16px,4vw,40px)', position: 'sticky', top: 72, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={reset} style={{
              display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13, color: '#888', fontFamily: 'inherit',
            }}>
              <ChevronRight size={15} /> براکت
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
              چیدمان {method === 'manual' ? 'دستی' : 'تصادفی'}
            </span>
            <span style={{ fontSize: 12, color: '#aaa' }}>
              {toFa(pool.length)} بازیکن تخصیص نیافته
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={reset} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.10)',
              background: '#fff', fontSize: 13, fontWeight: 700, color: '#666',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <RotateCcw size={13} /> بازنشانی
            </button>
            <button onClick={() => setSaved(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 10, border: 'none',
              background: saved ? 'rgba(48,197,90,0.10)' : 'rgba(199,166,106,0.12)',
              color: saved ? '#30C55A' : '#A07840',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {saved ? <><Check size={13} /> ذخیره شد</> : <><Save size={13} /> ذخیره قالب</>}
            </button>
            <button onClick={() => setConfirmed(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
              borderRadius: 10, border: 'none',
              background: confirmed ? '#30C55A' : 'linear-gradient(135deg,#C7A66A,#A07840)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {confirmed ? <><Check size={13} /> تایید شد — </> : <><Play size={13} />  شروع مسابقه</>}
              {confirmed && <span onClick={() => router.push(`/tournaments/${t.id}/live`)}
                style={{ textDecoration: 'underline', cursor: 'pointer' }}>نمای زنده</span>}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 180px)', overflow: 'hidden' }}>

        {/* ── Player Pool ── */}
        <div style={{
          width: 240, flexShrink: 0, background: '#fff',
          borderLeft: '1px solid rgba(0,0,0,0.06)', overflowY: 'auto',
          padding: '16px',
        }}
          onDragOver={e => e.preventDefault()}
          onDrop={handlePoolDrop}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: '#aaa',
            letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 14 }}>
            بازیکنان
          </div>

          {pool.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#ccc' }}>
              <Check size={24} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 12, margin: 0 }}>همه تخصیص یافتند</p>
            </div>
          ) : (
            pool.map(p => (
              <div
                key={p.id}
                draggable
                onDragStart={e => handlePoolDragStart(e, p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 12, marginBottom: 8,
                  background: 'rgba(0,0,0,0.02)', border: '1.5px solid rgba(0,0,0,0.07)',
                  cursor: 'grab', transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `hsl(${p.name.charCodeAt(0) * 15},50%,85%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                  color: `hsl(${p.name.charCodeAt(0) * 15},50%,35%)` }}>
                  {p.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  {p.rank && <div style={{ fontSize: 11, color: '#C7A66A' }}>رتبه #{toFa(p.rank)}</div>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Bracket canvas ── */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '24px 32px' }}>
          <div style={{ display: 'flex', gap: 0, direction: 'ltr', alignItems: 'stretch',
            minWidth: 'max-content' }}>
            {roundGroups.map(({ round, matches: rMatches }, roundIdx) => (
              <div key={round} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Round label */}
                <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#aaa',
                  letterSpacing: '0.08em', padding: '0 16px', marginBottom: 16 }}>
                  {roundLabel(round, totalRounds)}
                </div>

                {/* Matches */}
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-around', flex: 1,
                  gap: 0,
                  padding: `${Math.pow(2, roundIdx) * 30}px 16px`,
                }}>
                  {rMatches.map(m => (
                    <div key={m.id} style={{ marginBottom: Math.pow(2, roundIdx) * 18 }}>
                      <MatchCard
                        match={m}
                        isDraggingOver={draggingOver}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        slotDrag={dragFromSlot ? { matchId: dragFromSlot.matchId, slot: dragFromSlot.slot } : null}
                        onSlotDragStart={handleSlotDragStart}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
