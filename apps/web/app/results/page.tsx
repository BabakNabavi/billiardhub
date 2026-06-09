
// ==============================
// FILE: apps/web/app/results/page.tsx
// ==============================
'use client';

import { useState } from 'react';

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
    <div className="min-h-screen" style={{ background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif' }} dir="rtl">

      {/* Hero */}
      <div className="relative overflow-hidden px-4 pt-12 pb-8"
        style={{ background: 'linear-gradient(180deg,#050c08,#010604)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%,rgba(6,182,212,0.1),transparent 60%)' }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <span className="text-xs font-bold tracking-widest" style={{ color: '#06b6d4' }}>🏁 RESULTS</span>
          </div>
          <h1 className="text-4xl font-black mb-2" style={{
            background: 'linear-gradient(135deg,#f0faf5 40%,#06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>نتایج مسابقات</h1>
          <p className="text-sm" style={{ color: '#4b5563' }}>آخرین نتایج و گزارش‌های کامل</p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-40"
        style={{ background: 'rgba(1,6,4,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(6,182,212,0.1)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {DISCIPLINES.map(d => (
            <button key={d} onClick={() => setDisc(d)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold"
              style={disc === d
                ? { background: '#06b6d4', color: '#010604' }
                : { background: 'rgba(6,182,212,0.08)', color: '#9ca3af', border: '1px solid rgba(6,182,212,0.15)' }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {filtered.map(round => (
          <div key={round.id} className="rounded-2xl overflow-hidden"
            style={{ background: '#050c08', border: '1px solid rgba(6,182,212,0.12)' }}>

            {/* Round header */}
            <button className="w-full px-4 py-4 flex items-center gap-3 text-right"
              onClick={() => setExpanded(e => ({ ...e, [round.id]: !e[round.id] }))}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>{round.discipline}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>{round.round}</span>
                </div>
                <div className="font-bold text-sm truncate">{round.tournament}</div>
                <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>📅 {round.date} · {round.matches.length} بازی</div>
              </div>
              <span className="text-sm flex-shrink-0" style={{ color: '#4b5563' }}>
                {expanded[round.id] ? '▲' : '▼'}
              </span>
            </button>

            {/* Matches */}
            {expanded[round.id] && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(6,182,212,0.08)' }}>
                {round.matches.map((m, i) => (
                  <div key={i} className="rounded-xl p-4 mt-3"
                    style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.1)' }}>

                    {/* Score row */}
                    <div className="grid grid-cols-3 items-center gap-2 mb-3">
                      <div className={`text-center ${m.winner === 1 ? '' : 'opacity-50'}`}>
                        <div className="text-xs mb-1 truncate" style={{ color: m.winner === 1 ? '#f0faf5' : '#6b7280' }}>
                          {m.winner === 1 && <span className="text-yellow-400 ml-1">🏆</span>}
                          {m.player1}
                        </div>
                        <div className="text-3xl font-black" style={{ color: m.winner === 1 ? '#10b981' : '#6b7280' }}>
                          {m.score1}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs mb-1" style={{ color: '#4b5563' }}>فریم</div>
                        <div className="text-sm font-bold" style={{ color: '#6b7280' }}>—</div>
                        <div className="text-xs mt-1" style={{ color: '#4b5563' }}>نهایی</div>
                      </div>
                      <div className={`text-center ${m.winner === 2 ? '' : 'opacity-50'}`}>
                        <div className="text-xs mb-1 truncate" style={{ color: m.winner === 2 ? '#f0faf5' : '#6b7280' }}>
                          {m.winner === 2 && <span className="text-yellow-400 ml-1">🏆</span>}
                          {m.player2}
                        </div>
                        <div className="text-3xl font-black" style={{ color: m.winner === 2 ? '#10b981' : '#6b7280' }}>
                          {m.score2}
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 flex-wrap"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
                      <span className="text-xs" style={{ color: '#6b7280' }}>⏱ {m.duration}</span>
                      <span className="text-xs" style={{ color: '#6b7280' }}>🎱 {m.frames} فریم</span>
                      {m.highBreak > 0 && (
                        <span className="text-xs font-bold ml-auto" style={{ color: '#f59e0b' }}>
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
          <div className="text-center py-16" style={{ color: '#4b5563' }}>
            <div className="text-4xl mb-3">🏁</div>
            <p>نتیجه‌ای یافت نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}
