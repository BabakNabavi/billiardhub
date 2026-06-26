'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Trophy, Calendar, Users, Plus, Search, ChevronLeft,
  Clock, MapPin, Zap, Filter,
} from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, GAME_TYPE_LABELS, GAME_TYPE_COLORS,
  STATUS_LABELS, STATUS_COLORS, formatFee, toFa,
  type Tournament, type TournamentStatus,
} from '../../lib/mock-tournaments';

const TABS: { key: TournamentStatus | 'all'; label: string }[] = [
  { key: 'all',               label: 'همه' },
  { key: 'registration_open', label: 'ثبت‌نام باز' },
  { key: 'live',              label: 'زنده' },
  { key: 'upcoming',          label: 'به زودی' },
  { key: 'finished',          label: 'پایان یافته' },
];

function TournamentCard({ t }: { t: Tournament }) {
  const [hov, setHov] = useState(false);
  const pct = Math.round((t.registeredCount / t.maxPlayers) * 100);
  const statusColor = STATUS_COLORS[t.status];
  const gameColor   = GAME_TYPE_COLORS[t.gameType];
  const full        = t.registeredCount >= t.maxPlayers;

  return (
    <Link href={`/tournaments/${t.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          background: '#fff',
          border: `1px solid ${hov ? 'rgba(199,166,106,0.30)' : 'rgba(0,0,0,0.06)'}`,
          borderRadius: 20, overflow: 'hidden',
          boxShadow: hov ? '0 12px 32px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
          transform: hov ? 'translateY(-3px)' : 'none',
        }}
      >
        {/* Banner */}
        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
          <img src={t.banner} alt={t.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover',
              filter: 'brightness(0.65)', transform: hov ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)' }} />

          {/* Game type badge */}
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: `rgba(${gameColor === '#C7A66A' ? '199,166,106' : gameColor === '#3b82f6' ? '59,130,246' : gameColor === '#30C55A' ? '48,197,90' : '139,92,246'},0.18)`,
            border: `1px solid ${gameColor}44`, borderRadius: 20,
            padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#fff',
            backdropFilter: 'blur(8px)',
          }}>
            {GAME_TYPE_LABELS[t.gameType]}
          </div>

          {/* Status badge */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '4px 12px',
          }}>
            {t.status === 'live' && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
                animation: 'pulse 1.8s infinite', display: 'inline-block' }} />
            )}
            <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>
              {STATUS_LABELS[t.status]}
            </span>
          </div>

          {/* Club name */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
            padding: '24px 16px 12px', color: 'rgba(255,255,255,0.75)',
            fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <MapPin size={11} />
            {t.clubName}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px 18px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: '0 0 12px',
            lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {t.name}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#555' }}>
              <Calendar size={13} color="#C7A66A" />
              <span>{t.date} — ساعت {toFa(t.startTime)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#555' }}>
              <Trophy size={13} color="#C7A66A" />
              <span style={{ fontSize: 12, color: '#777', lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {t.prizeInfo}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {t.status !== 'finished' && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#888' }}>ظرفیت</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: full ? '#ef4444' : '#111' }}>
                  {toFa(t.registeredCount)} / {toFa(t.maxPlayers)} نفر
                </span>
              </div>
              <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${pct}%`,
                  background: full ? '#ef4444' : pct > 75 ? '#f59e0b' : '#30C55A',
                  transition: 'width 0.6s',
                }} />
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: '#C7A66A',
            }}>
              {formatFee(t.entryFee)}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 13, fontWeight: 700,
              color: t.status === 'registration_open' ? '#30C55A' : '#888',
            }}>
              {t.status === 'registration_open' && !full ? 'ثبت‌نام' : t.status === 'live' ? 'مشاهده زنده' : 'جزئیات'}
              <ChevronLeft size={14} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TournamentsPage() {
  const [tab, setTab]    = useState<TournamentStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = SAMPLE_TOURNAMENTS.filter(t => {
    const matchTab    = tab === 'all' || t.status === tab;
    const matchSearch = !search || t.name.includes(search) || t.clubName.includes(search);
    return matchTab && matchSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 60 }}>

      {/* ── Hero bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '28px clamp(16px,4vw,48px) 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Trophy size={20} color="#C7A66A" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#C7A66A', letterSpacing: '0.12em',
                  textTransform: 'uppercase' }}>BILLIARD HUB</span>
              </div>
              <h1 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, color: '#111',
                margin: 0, letterSpacing: '-0.02em' }}>مسابقات بیلیارد</h1>
              <p style={{ fontSize: 14, color: '#777', margin: '6px 0 0' }}>
                {toFa(SAMPLE_TOURNAMENTS.length)} رویداد در بیلیارد هاب
              </p>
            </div>

            <Link href="/tournaments/new" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg,#C7A66A,#A07840)',
                color: '#fff', border: 'none', borderRadius: 14,
                padding: '12px 22px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(199,166,106,0.28)',
              }}>
                <Plus size={16} />
                ایجاد مسابقه
              </button>
            </Link>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 0 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  padding: '10px 18px', borderRadius: '10px 10px 0 0',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                  background: tab === t.key ? '#F7F7F5' : 'transparent',
                  color: tab === t.key ? '#111' : '#888',
                  borderBottom: tab === t.key ? '2px solid #C7A66A' : '2px solid transparent',
                  transition: 'all 0.18s',
                }}>
                {t.label}
                {t.key !== 'all' && (
                  <span style={{ marginRight: 6, fontSize: 11,
                    color: tab === t.key ? '#C7A66A' : '#aaa' }}>
                    {toFa(SAMPLE_TOURNAMENTS.filter(x => x.status === t.key).length)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px clamp(16px,4vw,48px)' }}>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 28, maxWidth: 480 }}>
          <Search size={16} style={{ position: 'absolute', right: 14, top: '50%',
            transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="جستجو در مسابقات..."
            style={{
              width: '100%', padding: '12px 44px 12px 16px', borderRadius: 14,
              border: '1px solid rgba(0,0,0,0.09)', background: '#fff',
              fontSize: 14, fontFamily: 'inherit', color: '#111', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
            <Trophy size={40} style={{ opacity: 0.25, marginBottom: 16 }} />
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>مسابقه‌ای یافت نشد</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {filtered.map(t => <TournamentCard key={t.id} t={t} />)}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(1.4); }
        }
      `}</style>
    </div>
  );
}
