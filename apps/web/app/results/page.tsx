
// ==============================
// FILE: apps/web/app/results/page.tsx
// ==============================
'use client';

import { useState } from 'react';

const GOLD = '#C7A66A';
const GOLD_DARK = '#A07840';

const RESULTS = [
  {
    id: '1', date: '۱۵ خرداد ۱۴۰۴', tournament: 'لیگ برتر ایران — هفته ۱۰',
    discipline: 'اسنوکر', round: 'هفته دهم',
    matches: [
      { player1: 'علیرضا حیدری', score1: 5, player2: 'محمد رضایی', score2: 3, winner: 1, frames: 8, duration: '۲:۴۵', highBreak: 112 },
      { player1: 'سینا کریمی', score1: 5, player2: 'داریوش نوری', score2: 4, winner: 1, frames: 9, duration: '۳:۱۲', highBreak: 98 },
      { player1: 'کامران صادقی', score1: 3, player2: 'پویا رستمی', score2: 5, winner: 2, frames: 8, duration: '۲:۵۸', highBreak: 87 },
    ],
  },
  {
    id: '2', date: '۱۲ خرداد ۱۴۰۴', tournament: 'لیگ برتر ایران — هفته ۹',
    discipline: 'اسنوکر', round: 'هفته نهم',
    matches: [
      { player1: 'آرش فرهانی', score1: 5, player2: 'مهدی احمدی', score2: 2, winner: 1, frames: 7, duration: '۲:۱۰', highBreak: 134 },
      { player1: 'رضا موسوی', score1: 4, player2: 'نیما حسینی', score2: 5, winner: 2, frames: 9, duration: '۳:۰۵', highBreak: 76 },
    ],
  },
  {
    id: '3', date: '۸ خرداد ۱۴۰۴', tournament: 'جام رمضان — فینال',
    discipline: 'پول آمریکایی', round: 'فینال',
    matches: [
      { player1: 'کامران صادقی', score1: 9, player2: 'سامان قادری', score2: 6, winner: 1, frames: 15, duration: '۱:۵۰', highBreak: 0 },
    ],
  },
];

const DISCIPLINES = ['همه', 'اسنوکر', 'پول آمریکایی', 'کارامبول'];

export default function ResultsPage() {
  const [disc, setDisc] = useState('همه');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ '1': true });

  const filtered = RESULTS.filter(r => disc === 'همه' || r.discipline === disc);

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', color: '#111111', fontFamily: 'Vazirmatn, sans-serif' }} dir="rtl">

      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg,#111111 0%,#1a1a1a 100%)', position: 'relative', overflow: 'hidden', padding: 'clamp(40px,5vw,64px) 16px clamp(32px,4vw,48px)', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(ellipse at 50% 0%,rgba(199,166,106,0.10),transparent 60%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, marginBottom: 16, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.20)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: GOLD }}>🏁 RESULTS</span>
          </div>
          <h1 style={{ fontSize: 'clamp(31px, 4.4vw, 46px)', fontWeight: 900, margin: '0 0 10px', backgroundImage: `linear-gradient(135deg,#FFFFFF 40%,${GOLD})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em' }}>نتایج مسابقات</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', margin: 0 }}>آخرین نتایج و گزارش‌های کامل</p>
        </div>
      </div>

      {/* Sticky Filter */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(247,247,245,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '10px 16px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {DISCIPLINES.map(d => (
            <button key={d} onClick={() => setDisc(d)}
              style={{ flexShrink: 0, padding: '6px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', border: 'none',
                ...(disc === d
                  ? { background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, color: '#FFFFFF', boxShadow: `0 4px 12px rgba(199,166,106,0.30)` }
                  : { background: 'rgba(199,166,106,0.08)', color: 'rgba(0,0,0,0.50)', border: '1px solid rgba(199,166,106,0.20)' })
              }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Results list */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(round => (
          <div key={round.id} style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

            {/* Round header */}
            <button style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => setExpanded(e => ({ ...e, [round.id]: !e[round.id] }))}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, padding: '2px 10px', borderRadius: 999, background: 'rgba(199,166,106,0.10)', color: GOLD_DARK, fontWeight: 600 }}>{round.discipline}</span>
                  <span style={{ fontSize: 13, padding: '2px 10px', borderRadius: 999, background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', fontWeight: 600 }}>{round.round}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111111' }}>{round.tournament}</div>
                <div style={{ fontSize: 14, marginTop: 2, color: 'rgba(0,0,0,0.40)' }}>📅 {round.date} · {round.matches.length} بازی</div>
              </div>
              <span style={{ fontSize: 16, color: 'rgba(0,0,0,0.35)', flexShrink: 0 }}>{expanded[round.id] ? '▲' : '▼'}</span>
            </button>

            {/* Matches */}
            {expanded[round.id] && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
                {round.matches.map((m, i) => (
                  <div key={i} style={{ borderRadius: 16, padding: 16, background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.06)' }}>

                    {/* Score row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ textAlign: 'center', opacity: m.winner === 1 ? 1 : 0.45 }}>
                        <div style={{ fontSize: 13, marginBottom: 4, color: m.winner === 1 ? '#111111' : 'rgba(0,0,0,0.40)', fontWeight: m.winner === 1 ? 700 : 400 }}>
                          {m.winner === 1 && <span style={{ marginLeft: 4 }}>🏆</span>}
                          {m.player1}
                        </div>
                        <div style={{ fontSize: 35, fontWeight: 900, color: m.winner === 1 ? GOLD_DARK : 'rgba(0,0,0,0.30)' }}>{m.score1}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', marginBottom: 4 }}>فریم</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(0,0,0,0.25)' }}>—</div>
                        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', marginTop: 4 }}>نهایی</div>
                      </div>
                      <div style={{ textAlign: 'center', opacity: m.winner === 2 ? 1 : 0.45 }}>
                        <div style={{ fontSize: 13, marginBottom: 4, color: m.winner === 2 ? '#111111' : 'rgba(0,0,0,0.40)', fontWeight: m.winner === 2 ? 700 : 400 }}>
                          {m.winner === 2 && <span style={{ marginLeft: 4 }}>🏆</span>}
                          {m.player2}
                        </div>
                        <div style={{ fontSize: 35, fontWeight: 900, color: m.winner === 2 ? GOLD_DARK : 'rgba(0,0,0,0.30)' }}>{m.score2}</div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10 }}>
                      <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.40)' }}>⏱ {m.duration}</span>
                      <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.40)' }}>🎱 {m.frames} فریم</span>
                      {m.highBreak > 0 && (
                        <span style={{ fontSize: 14, fontWeight: 700, marginRight: 'auto', color: GOLD_DARK }}>
                          ⚡ بالاترین بریک: {m.highBreak}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <div style={{ fontSize: 44, marginBottom: 12, opacity: 0.15 }}>🏁</div>
            <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.38)', margin: 0 }}>نتیجه‌ای یافت نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}
