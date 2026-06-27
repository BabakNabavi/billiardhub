'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Trophy, Medal, Share2, Star, Target } from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, SAMPLE_LIVE_BRACKET, SAMPLE_PLAYERS,
  toFa, GAME_TYPE_LABELS,
} from '../../../../lib/mock-tournaments';

const PODIUM_CONFIG = [
  { place: 1, label: 'قهرمان', icon: '🏆', bg: 'linear-gradient(135deg,#C7A66A,#A07840)',
    color: '#fff', size: 130, borderColor: '#C7A66A', glow: 'rgba(199,166,106,0.35)' },
  { place: 2, label: 'نایب قهرمان', icon: '🥈', bg: 'linear-gradient(135deg,#94a3b8,#64748b)',
    color: '#fff', size: 108, borderColor: '#94a3b8', glow: 'rgba(148,163,184,0.25)' },
  { place: 3, label: 'مقام سوم', icon: '🥉', bg: 'linear-gradient(135deg,#cd7f32,#b5651d)',
    color: '#fff', size: 96, borderColor: '#cd7f32', glow: 'rgba(205,127,50,0.20)' },
] as const;

function toFaDigits(n: number) { return toFa(n); }

export default function ResultsPage() {
  const { id }  = useParams() as { id: string };
  const router  = useRouter();
  const t       = SAMPLE_TOURNAMENTS.find(x => x.id === id)
               ?? SAMPLE_TOURNAMENTS.find(x => x.status === 'finished')
               ?? SAMPLE_TOURNAMENTS[2]!;

  /* Build podium from sample bracket's completed matches */
  const matches = SAMPLE_LIVE_BRACKET;
  const totalRounds = Math.log2(t.maxPlayers <= 16 ? t.maxPlayers : 16);

  const finalMatch = matches.find(m => m.round === totalRounds);
  const sfMatches  = matches.filter(m => m.round === totalRounds - 1);

  const champion = finalMatch?.winner ?? SAMPLE_PLAYERS[0]!;
  const runner   = finalMatch
    ? (finalMatch.winner?.id === finalMatch.player1?.id ? finalMatch.player2 : finalMatch.player1)
    : SAMPLE_PLAYERS[1]!;
  const thirds   = sfMatches.flatMap(m =>
    m.player1 && m.player2 ? [m.player1, m.player2].filter(p => p?.id !== m.winner?.id) : []
  );
  const third = thirds[0] ?? SAMPLE_PLAYERS[2]!;

  const podiumPlayers = [
    { ...PODIUM_CONFIG[0], player: champion },
    { ...PODIUM_CONFIG[1], player: runner },
    { ...PODIUM_CONFIG[2], player: third },
  ];

  /* All-results table (round by round) */
  const roundGroups = Array.from({ length: totalRounds }, (_, i) => i + 1)
    .map(r => ({
      round: r,
      label: (() => {
        const fe = totalRounds - r + 1;
        if (fe === 1) return 'فینال';
        if (fe === 2) return 'نیمه‌نهایی';
        if (fe === 3) return 'یک‌چهارم';
        return `مرحله ${toFa(r)}`;
      })(),
      ms: matches.filter(m => m.round === r),
    }));

  /* Stats */
  const completedMatches = matches.filter(m => m.status === 'completed');
  const highestBreak = 147; // mock
  const avgScore = completedMatches.length
    ? Math.round(completedMatches.reduce((s, m) => s + (m.score1 ?? 0) + (m.score2 ?? 0), 0) / completedMatches.length)
    : 0;

  const [showShare, setShowShare] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg,#0a0a0a 0%,#1a1209 60%,#2a1800 100%)',
        position: 'relative', marginTop: -72, paddingTop: 72, overflow: 'hidden', paddingBottom: 48 }}>
        {/* glow orbs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320,
          borderRadius: '50%', background: 'rgba(199,166,106,0.07)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: 60, width: 240, height: 240,
          borderRadius: '50%', background: 'rgba(199,166,106,0.05)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '0 clamp(16px,4vw,48px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 32 }}>
            <button onClick={() => router.push(`/tournaments/${t.id}`)} style={{
              display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.50)',
              fontFamily: 'inherit',
            }}>
              <ChevronRight size={15} /> بازگشت
            </button>
            <button onClick={() => setShowShare(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Share2 size={14} /> اشتراک‌گذاری
            </button>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#C7A66A',
              letterSpacing: '0.16em', marginBottom: 8 }}>
              نتایج نهایی
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
              {t.name}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
              {t.date} • {GAME_TYPE_LABELS[t.gameType]} • {toFa(t.registeredCount)} شرکت‌کننده
            </p>
          </div>

          {/* Podium */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            gap: 12, maxWidth: 600, margin: '0 auto', flexWrap: 'wrap' }}>
            {/* Reorder: 2nd, 1st, 3rd */}
            {[podiumPlayers[1]!, podiumPlayers[0]!, podiumPlayers[2]!].map((entry) => {
              const isChamp = entry.place === 1;
              return (
                <div key={entry.place} style={{ display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 12 }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative' }}>
                    {isChamp && (
                      <div style={{ position: 'absolute', top: -28, left: '50%',
                        transform: 'translateX(-50%)', fontSize: 24 }}>👑</div>
                    )}
                    <div style={{
                      width: entry.size, height: entry.size, borderRadius: '50%',
                      background: entry.bg,
                      border: `4px solid ${entry.borderColor}`,
                      boxShadow: `0 0 40px ${entry.glow}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: entry.size * 0.36, fontWeight: 900, color: '#fff',
                    }}>
                      {entry.player?.name[0] ?? '?'}
                    </div>
                    <div style={{ position: 'absolute', bottom: 4, right: 4,
                      width: 26, height: 26, borderRadius: '50%',
                      background: '#111', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 14 }}>
                      {entry.icon}
                    </div>
                  </div>

                  {/* Name */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: isChamp ? 17 : 14, fontWeight: 900,
                      color: '#fff', marginBottom: 3 }}>
                      {entry.player?.name ?? '—'}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: entry.borderColor }}>
                      {entry.label}
                    </div>
                  </div>

                  {/* Podium bar */}
                  <div style={{
                    width: entry.size, borderRadius: '8px 8px 0 0',
                    height: isChamp ? 72 : entry.place === 2 ? 52 : 36,
                    background: `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
                    border: `1px solid ${entry.borderColor}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 900, color: entry.borderColor,
                  }}>
                    {toFa(entry.place)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '20px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1,
          background: 'rgba(0,0,0,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { label: 'کل بازی‌ها', val: toFa(completedMatches.length), icon: <Target size={16} color="#3b82f6" /> },
            { label: 'شرکت‌کنندگان', val: toFa(t.registeredCount), icon: <Star size={16} color="#C7A66A" /> },
            { label: 'بالاترین بریک', val: toFa(highestBreak), icon: <Trophy size={16} color="#C7A66A" /> },
          ].map(s => (
            <div key={s.label} style={{ padding: '16px 20px', background: '#fff',
              display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              {s.icon}
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Full results */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px clamp(16px,4vw,48px)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: '0 0 24px' }}>
          نتایج کامل
        </h2>

        {[...roundGroups].reverse().map(({ round, label, ms }) => (
          <div key={round} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#C7A66A',
              letterSpacing: '0.08em', marginBottom: 14 }}>
              {label}
            </div>
            {ms.map(m => {
              const isDone = m.status === 'completed';
              return (
                <div key={m.id} style={{ background: '#fff', borderRadius: 16,
                  padding: '16px', marginBottom: 10,
                  border: '1px solid rgba(0,0,0,0.07)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {[m.player1, m.player2].map((p, i) => {
                      const s  = i === 0 ? m.score1 : m.score2;
                      const win = isDone && m.winner?.id === p?.id;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center',
                          gap: 10, flexDirection: i === 1 ? 'row-reverse' : 'row' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: win ? 900 : 700,
                              color: win ? '#111' : '#666' }}>
                              {p?.name ?? '—'}
                              {win && <Trophy size={12} color="#C7A66A" style={{
                                verticalAlign: 'middle', marginRight: 5 }} />}
                            </div>
                          </div>
                          {s != null && (
                            <div style={{ fontSize: 24, fontWeight: 900,
                              color: win ? '#111' : '#ccc' }}>
                              {toFa(s)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#e5e7eb',
                      padding: '0 8px' }}>:</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Champion highlight card */}
        <div style={{ background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 24,
          padding: '28px', color: '#fff', textAlign: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.15em', opacity: 0.75,
            marginBottom: 6 }}>قهرمان مسابقه</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
            {champion?.name}
          </div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            {t.name} — {t.date}
          </div>
        </div>
      </div>
    </div>
  );
}
