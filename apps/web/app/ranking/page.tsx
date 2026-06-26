'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from 'lucide-react';

interface RankingPlayer {
  rank: number;
  previousRank?: number;
  name: string;
  city?: string;
  points: number;
  userId?: string;
  avatar?: string;
}

const samplePlayers: RankingPlayer[] = [
  { rank: 1, previousRank: 2, name: 'علی محمدی', city: 'تهران', points: 12500 },
  { rank: 2, previousRank: 1, name: 'رضا احمدی', city: 'مشهد', points: 11800 },
  { rank: 3, previousRank: 3, name: 'محمد حسینی', city: 'اصفهان', points: 10900 },
  { rank: 4, previousRank: 6, name: 'امیر کریمی', city: 'تهران', points: 10200 },
  { rank: 5, previousRank: 4, name: 'سعید رضایی', city: 'شیراز', points: 9800 },
  { rank: 6, previousRank: 5, name: 'حسین علوی', city: 'تبریز', points: 9400 },
  { rank: 7, previousRank: 9, name: 'مجید صادقی', city: 'کرج', points: 8900 },
  { rank: 8, previousRank: 7, name: 'داود نظری', city: 'تهران', points: 8500 },
  { rank: 9, previousRank: 8, name: 'کاوه موسوی', city: 'اهواز', points: 8100 },
  { rank: 10, previousRank: 12, name: 'بهروز طاهری', city: 'قم', points: 7800 },
  { rank: 11, previousRank: 10, name: 'فرهاد جعفری', city: 'مشهد', points: 7400 },
  { rank: 12, previousRank: 11, name: 'نادر قاسمی', city: 'تهران', points: 7100 },
  { rank: 13, previousRank: 15, name: 'وحید ابراهیمی', city: 'اصفهان', points: 6800 },
  { rank: 14, previousRank: 13, name: 'مهدی شریفی', city: 'رشت', points: 6500 },
  { rank: 15, previousRank: 14, name: 'پیمان کمالی', city: 'تهران', points: 6200 },
  { rank: 16, previousRank: 16, name: 'آرش ولی‌زاده', city: 'کرمانشاه', points: 5900 },
  { rank: 17, previousRank: 18, name: 'سینا حیدری', city: 'تهران', points: 5600 },
  { rank: 18, previousRank: 17, name: 'امین رستمی', city: 'تبریز', points: 5300 },
  { rank: 19, previousRank: 20, name: 'شاهین نوری', city: 'شیراز', points: 5000 },
  { rank: 20, previousRank: 19, name: 'کیان صفوی', city: 'مشهد', points: 4700 },
];

const sports = [
  { value: 'snooker', label: 'اسنوکر', icon: '🎱' },
  { value: 'pocket', label: 'پاکت بیلیارد', icon: '🎯' },
  { value: 'highball', label: 'هی‌بال', icon: '⚡', soon: true },
];

const genders = ['آقایان', 'بانوان'];

const categories: Record<string, Record<string, string[]>> = {
  snooker: {
    آقایان: ['دسته برتر', 'دسته یک', 'زیر ۲۱ سال', 'پیشکسوتان'],
    بانوان: ['دسته برتر', 'زیر ۲۱ سال', 'پیشکسوتان'],
  },
  pocket: {
    آقایان: ['دسته برتر', 'دسته یک', 'زیر ۲۱ سال', 'پیشکسوتان'],
    بانوان: ['دسته برتر', 'زیر ۲۱ سال', 'پیشکسوتان'],
  },
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown size={14} style={{ color: '#f59e0b' }} />;
  if (rank === 2) return <Medal size={14} style={{ color: 'rgba(0,0,0,0.50)' }} />;
  if (rank === 3) return <Award size={14} style={{ color: '#b45309' }} />;
  return null;
};

const getRankColor = (rank: number) => {
  if (rank === 1) return { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b' };
  if (rank === 2) return { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)', text: '#94a3b8' };
  if (rank === 3) return { bg: 'rgba(180,83,9,0.15)', border: 'rgba(180,83,9,0.4)', text: '#b45309' };
  return { bg: 'rgba(199,166,106,0.06)', border: 'rgba(199,166,106,0.18)', text: 'rgba(0,0,0,0.45)' };
};

export default function RankingsPage() {
  const [sport, setSport] = useState('snooker');
  const [gender, setGender] = useState('آقایان');
  const [category, setCategory] = useState('دسته برتر');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const currentCategories = categories[sport]?.[gender] ?? [];
  const players = sport !== 'highball' ? samplePlayers : [];

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        .rank-row { transition: all 0.2s ease; cursor: pointer; }
        .rank-row:hover { background: rgba(199,166,106,0.06) !important; }
        .sport-tab { transition: all 0.3s ease; }
        .sport-tab:hover { background: rgba(199,166,106,0.08) !important; }
        .cat-btn { transition: all 0.2s ease; }
        .cat-btn:hover { background: rgba(199,166,106,0.08) !important; color: #A07840 !important; }

        /* ── Mobile-first overrides ── */
        .ranking-layout { display: flex; gap: 20px; }
        .ranking-sidebar { width: 200px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
        .ranking-table-wrap { flex: 1; min-width: 0; }
        .col-grid {
          display: grid;
          grid-template-columns: 60px 40px 44px 1fr 90px 90px;
          align-items: center;
          padding: 12px 20px;
        }
        .col-header {
          display: grid;
          grid-template-columns: 60px 40px 44px 1fr 90px 90px;
          padding: 10px 20px;
        }
        .hide-mobile { display: block; }
        .sport-tabs { display: flex; gap: 8px; flex-wrap: wrap; }

        @media (max-width: 768px) {
          .ranking-layout { flex-direction: column; gap: 12px; }
          .ranking-sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; gap: 8px; }
          .ranking-sidebar > * { flex: 1 1 140px; }
          .sidebar-legend { display: none; }
          .col-grid {
            grid-template-columns: 48px 32px 38px 1fr 70px;
            padding: 10px 12px;
          }
          .col-header {
            grid-template-columns: 48px 32px 38px 1fr 70px;
            padding: 8px 12px;
          }
          .hide-mobile { display: none; }
          .sport-tabs { gap: 6px; }
          .sport-tab { padding: 8px 12px !important; font-size: 12px !important; }
        }

        @media (max-width: 480px) {
          .col-grid {
            grid-template-columns: 42px 28px 36px 1fr 64px;
            padding: 9px 10px;
          }
          .col-header {
            grid-template-columns: 42px 28px 36px 1fr 64px;
            padding: 7px 10px;
          }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#F7F7F5',
        padding: 'clamp(16px,3vw,48px) clamp(12px,3vw,32px)',
        direction: 'rtl',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px', animation: 'fadeUp 0.6s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                flexShrink: 0,
              }}>
                <Trophy size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{
                  fontSize: 'clamp(22px, 3.3vw, 35px)', fontWeight: 900,
                  color: '#111111', margin: 0, letterSpacing: '-0.025em',
                }}>
                  رنکینگ ایران
                </h1>
                <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: '14px', margin: '2px 0 0' }}>
                  جدول امتیازات رسمی فدراسیون بیلیارد ایران
                </p>
              </div>
            </div>
          </div>

          {/* Sport Tabs */}
          <div className="sport-tabs" style={{ marginBottom: '24px', animation: 'fadeUp 0.6s 0.1s ease both' }}>
            {sports.map(s => (
              <button
                key={s.value}
                className="sport-tab"
                disabled={!!s.soon}
                onClick={() => { if (!s.soon) { setSport(s.value); setCategory('دسته برتر'); } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 18px', borderRadius: '12px',
                  border: sport === s.value
                    ? '1px solid rgba(199,166,106,0.45)'
                    : '1px solid rgba(0,0,0,0.09)',
                  background: sport === s.value
                    ? 'rgba(199,166,106,0.12)'
                    : '#FFFFFF',
                  color: sport === s.value ? '#A07840' : s.soon ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.55)',
                  fontSize: '14px', fontWeight: 600,
                  cursor: s.soon ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: s.soon ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                }}>
                <span>{s.icon}</span>
                <span>{s.label}</span>
                {s.soon && (
                  <span style={{
                    fontSize: '10px', background: 'rgba(245,158,11,0.15)',
                    color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: '20px', padding: '2px 6px', fontWeight: 700,
                  }}>به زودی</span>
                )}
              </button>
            ))}
          </div>

          {sport !== 'highball' && (
            <div className="ranking-layout" style={{ animation: 'fadeUp 0.6s 0.2s ease both' }}>

              {/* Sidebar */}
              <div className="ranking-sidebar">

                {/* Gender */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: '16px', overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  {genders.map(g => (
                    <button
                      key={g}
                      onClick={() => { setGender(g); setCategory('دسته برتر'); }}
                      style={{
                        width: '100%', textAlign: 'right',
                        padding: '11px 14px',
                        background: gender === g ? 'rgba(199,166,106,0.10)' : 'transparent',
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                        color: gender === g ? '#A07840' : 'rgba(0,0,0,0.50)',
                        fontSize: '14px', fontWeight: gender === g ? 700 : 500,
                        cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                        borderRight: gender === g ? '2px solid #C7A66A' : '2px solid transparent',
                        transition: 'all 0.2s', display: 'block',
                      }}>
                      {g === 'آقایان' ? '👨 آقایان' : '👩 بانوان'}
                    </button>
                  ))}
                </div>

                {/* Categories */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: '16px', padding: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <div style={{
                    fontSize: '10px', color: 'rgba(199,166,106,0.70)',
                    fontWeight: 700,
                    padding: '6px 8px 10px', textTransform: 'uppercase',
                  }}>
                    دسته‌بندی
                  </div>
                  {currentCategories.map(cat => (
                    <button
                      key={cat}
                      className="cat-btn"
                      onClick={() => setCategory(cat)}
                      style={{
                        width: '100%', textAlign: 'right',
                        padding: '9px 12px', borderRadius: '10px',
                        background: category === cat ? 'rgba(199,166,106,0.10)' : 'transparent',
                        color: category === cat ? '#A07840' : 'rgba(0,0,0,0.48)',
                        fontSize: '14px', fontWeight: category === cat ? 600 : 400,
                        cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                        display: 'block',
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Legend — hidden on mobile via CSS */}
                <div className="sidebar-legend" style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: '14px', padding: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ fontSize: '11px', color: 'rgba(199,166,106,0.65)', fontWeight: 700, marginBottom: '10px' }}>
                    راهنما
                  </div>
                  {[
                    { color: '#f59e0b', label: 'رتبه اول' },
                    { color: 'rgba(0,0,0,0.50)', label: 'رتبه دوم' },
                    { color: '#b45309', label: 'رتبه سوم' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>{item.label}</span>
                    </div>
                  ))}
                  <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <TrendingUp size={11} color="#16a34a" />
                    <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.40)' }}>صعود رتبه</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingDown size={11} color="#ef4444" />
                    <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.40)' }}>نزول رتبه</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="ranking-table-wrap">
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: '20px', overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                }}>
                  {/* Table Header */}
                  <div style={{
                    padding: '14px 20px',
                    background: 'rgba(199,166,106,0.06)',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Trophy size={15} color="#C7A66A" />
                      <span style={{ color: '#111111', fontWeight: 700, fontSize: '15px' }}>
                        {gender} — {category}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '12px', color: '#A07840',
                      background: 'rgba(199,166,106,0.10)',
                      border: '1px solid rgba(199,166,106,0.28)',
                      borderRadius: '20px', padding: '3px 10px',
                    }}>
                      {players.length} نفر
                    </span>
                  </div>

                  {/* Column Headers */}
                  <div className="col-header" style={{
                    background: '#F3F2EF',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                  }}>
                    {['رتبه', '±', '', 'نام بازیکن', 'شهر', 'امتیاز'].map((h, i) => (
                      <div key={i} className={i === 4 ? 'hide-mobile' : ''} style={{
                        fontSize: '11px', color: 'rgba(0,0,0,0.35)',
                        fontWeight: 700,
                        textAlign: i === 0 || i >= 4 ? 'center' : 'right',
                      }}>
                        {h}
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  {players.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(0,0,0,0.28)' }}>
                      <Trophy size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                      <p style={{ fontSize: '15px' }}>رنکینگ این دسته هنوز اعلام نشده</p>
                    </div>
                  ) : players.map((player, index) => {
                    const diff = player.previousRank ? player.previousRank - player.rank : 0;
                    const rankStyle = getRankColor(player.rank);
                    const isTop3 = player.rank <= 3;

                    return (
                      <Link
                        key={player.rank}
                        href={player.userId ? `/players/${player.userId}` : '#'}
                        style={{ textDecoration: 'none', display: 'block' }}
                      >
                        <div
                          className="rank-row col-grid"
                          onMouseEnter={() => setHoveredRow(index)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            borderBottom: '1px solid rgba(0,0,0,0.05)',
                            background: isTop3
                              ? `rgba(${player.rank === 1 ? '245,158,11' : player.rank === 2 ? '148,163,184' : '180,83,9'},0.04)`
                              : 'transparent',
                          }}>

                          {/* Rank */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '32px', height: '32px', borderRadius: '10px',
                              background: rankStyle.bg,
                              border: `1px solid ${rankStyle.border}`,
                              gap: '3px',
                            }}>
                              {getRankIcon(player.rank)
                                ? <>
                                    {getRankIcon(player.rank)}
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: rankStyle.text }}>
                                      {player.rank}
                                    </span>
                                  </>
                                : <span style={{ fontSize: '13px', fontWeight: 700, color: rankStyle.text }}>
                                    {player.rank}
                                  </span>
                              }
                            </div>
                          </div>

                          {/* Change */}
                          <div style={{ textAlign: 'center' }}>
                            {diff > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <TrendingUp size={11} color="#16a34a" />
                                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>{diff}</span>
                              </div>
                            ) : diff < 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <TrendingDown size={11} color="#ef4444" />
                                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>{Math.abs(diff)}</span>
                              </div>
                            ) : (
                              <Minus size={11} color="rgba(0,0,0,0.18)" style={{ margin: '0 auto', display: 'block' }} />
                            )}
                          </div>

                          {/* Avatar */}
                          <div>
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '10px',
                              background: isTop3
                                ? `linear-gradient(135deg,${rankStyle.text},${rankStyle.text}88)`
                                : 'linear-gradient(135deg,rgba(199,166,106,0.20),rgba(199,166,106,0.10))',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: 900, fontSize: '14px',
                              border: `1px solid ${isTop3 ? rankStyle.border : 'rgba(199,166,106,0.15)'}`,
                              overflow: 'hidden',
                            }}>
                              {player.avatar
                                ? <img src={player.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : player.name?.[0]}
                            </div>
                          </div>

                          {/* Name */}
                          <div style={{
                            fontSize: '15px',
                            fontWeight: isTop3 ? 700 : 500,
                            color: isTop3 ? '#111111' : 'rgba(0,0,0,0.65)',
                            paddingRight: '8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {player.name}
                          </div>

                          {/* City — hidden on mobile */}
                          <div className="hide-mobile" style={{
                            textAlign: 'center',
                            fontSize: '13px',
                            color: 'rgba(0,0,0,0.38)',
                          }}>
                            {player.city || '—'}
                          </div>

                          {/* Points */}
                          <div style={{ textAlign: 'center' }}>
                            <span style={{
                              fontSize: '14px', fontWeight: 700,
                              color: isTop3 ? rankStyle.text : '#A07840',
                              background: isTop3 ? rankStyle.bg : 'rgba(199,166,106,0.08)',
                              border: `1px solid ${isTop3 ? rankStyle.border : 'rgba(199,166,106,0.22)'}`,
                              borderRadius: '8px', padding: '3px 8px',
                              whiteSpace: 'nowrap',
                            }}>
                              {player.points.toLocaleString('fa-IR')}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Footer note */}
                <div style={{
                  marginTop: '16px', padding: '12px 16px',
                  background: 'rgba(199,166,106,0.06)',
                  border: '1px solid rgba(199,166,106,0.18)',
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C7A66A', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.45)' }}>
                    رنکینگ رسمی فدراسیون بیلیارد و اسنوکر جمهوری اسلامی ایران — به‌روزرسانی هر هفته
                  </span>
                </div>
              </div>
            </div>
          )}

          {sport === 'highball' && (
            <div style={{
              textAlign: 'center', padding: '80px 20px',
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: '24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: '53px', marginBottom: '16px' }}>⚡</div>
              <h2 style={{ color: '#111111', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                رنکینگ هی‌بال
              </h2>
              <p style={{ color: 'rgba(0,0,0,0.40)', fontSize: '15px' }}>
                به زودی راه‌اندازی می‌شود
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
