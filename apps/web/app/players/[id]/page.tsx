'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy, Star, Target, Activity, Award, Users,
  ChevronRight, Play, Share2, UserPlus, MessageCircle,
  TrendingUp, Calendar, MapPin, Shield, Zap, Check,
  BarChart2, Clock, ChevronUp, ChevronDown,
} from 'lucide-react';
import ScrollReveal from '../../../components/ScrollReveal/ScrollReveal';

/* ── types ── */
interface Player {
  id: string; firstName: string; lastName: string;
  username: string; city: string; province: string;
  primaryRole: string; bio: string;
  rank: number; rankChange: number;
  points: number; winRate: number; totalMatches: number;
  wins: number; losses: number;
  speciality: string; playingSince: number;
  coach: string; club: string;
  avatar?: string; coverImg?: string;
}

/* ── sample data ── */
const samplePlayer: Player = {
  id: '1', firstName: 'امیرحسین', lastName: 'رضایی',
  username: 'amir_rezaei', city: 'تهران', province: 'تهران',
  primaryRole: 'player',
  bio: 'بازیکن حرفه‌ای اسنوکر با ۱۲ سال سابقه رقابتی. قهرمان لیگ برتر اسنوکر ایران ۱۴۰۲ و ۱۴۰۳. نماینده ایران در مسابقات آسیایی ۲۰۲۳.',
  rank: 3, rankChange: 2,
  points: 8420, winRate: 74,
  totalMatches: 284, wins: 210, losses: 74,
  speciality: 'اسنوکر', playingSince: 1390,
  coach: 'استاد کاوه نوری', club: 'باشگاه سنچوری تهران',
};

const achievements = [
  { title: 'قهرمان لیگ برتر',     year: '۱۴۰۳', color: '#f59e0b', icon: '🏆', tier: 'gold'    },
  { title: 'قهرمان لیگ برتر',     year: '۱۴۰۲', color: '#f59e0b', icon: '🏆', tier: 'gold'    },
  { title: 'نایب‌قهرمان آسیا',    year: '۱۴۰۲', color: '#94a3b8', icon: '🥈', tier: 'silver'  },
  { title: 'بهترین بازیکن جوان',  year: '۱۴۰۱', color: '#10b981', icon: '⭐', tier: 'special' },
  { title: 'رکورد بالاترین بریک', year: '۱۴۰۰', color: '#a78bfa', icon: '🎯', tier: 'record'  },
  { title: '۱۰۰ پیروزی متوالی',  year: '۱۴۰۰', color: '#06b6d4', icon: '🔥', tier: 'special' },
];

const tournamentHistory = [
  { name: 'لیگ برتر اسنوکر ایران',  date: '۱۴۰۳/۰۳', result: '🥇 قهرمان',    points: '+450', color: '#f59e0b' },
  { name: 'مسابقات آسیایی ۲۰۲۴',   date: '۱۴۰۳/۰۱', result: 'نیمه‌نهایی',   points: '+180', color: '#10b981' },
  { name: 'جام تهران',               date: '۱۴۰۲/۱۱', result: '🥇 قهرمان',    points: '+320', color: '#f59e0b' },
  { name: 'لیگ برتر اسنوکر ایران',  date: '۱۴۰۲/۰۳', result: '🥇 قهرمان',    points: '+450', color: '#f59e0b' },
  { name: 'مسابقات بین‌المللی دبی', date: '۱۴۰۱/۱۲', result: '🥈 نایب‌قهرمان', points: '+280', color: '#94a3b8' },
  { name: 'جام استعدادهای جوان',    date: '۱۴۰۱/۰۶', result: '🥇 قهرمان',    points: '+200', color: '#f59e0b' },
];

const matchHistory = [
  { opponent: 'رضا کریمی',    result: 'W', score: '6-2', tournament: 'لیگ برتر', date: '۱۴۰۳/۰۳/۱۵' },
  { opponent: 'نیما موسوی',   result: 'W', score: '6-4', tournament: 'لیگ برتر', date: '۱۴۰۳/۰۳/۱۲' },
  { opponent: 'علی احمدی',    result: 'L', score: '3-6', tournament: 'جام آسیا', date: '۱۴۰۳/۰۱/۲۰' },
  { opponent: 'حسین صادقی',   result: 'W', score: '6-1', tournament: 'لیگ برتر', date: '۱۴۰۲/۱۲/۰۵' },
  { opponent: 'کاوه رستمی',   result: 'W', score: '6-3', tournament: 'جام تهران', date: '۱۴۰۲/۱۱/۱۸' },
];

const monthlyStats = [
  { month: 'فروردین', wins: 8,  losses: 2 },
  { month: 'اردیبهشت', wins: 10, losses: 3 },
  { month: 'خرداد',  wins: 12, losses: 1 },
  { month: 'تیر',    wins: 7,  losses: 4 },
  { month: 'مرداد',  wins: 9,  losses: 2 },
  { month: 'شهریور', wins: 11, losses: 2 },
];

const topPlayers = [
  { rank: 1, name: 'سعید موسوی',    points: 9840, change: 0   },
  { rank: 2, name: 'محمد حسینی',    points: 9120, change: 1   },
  { rank: 3, name: 'امیرحسین رضایی', points: 8420, change: 2, isMe: true },
  { rank: 4, name: 'رضا کریمی',     points: 7980, change: -1  },
  { rank: 5, name: 'نیما نوری',     points: 7540, change: 0   },
];

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

/* ── radial progress ── */
function RadialProgress({ value, size = 80, stroke = 6, color = '#10b981' }: { value: number; size?: number; stroke?: number; color?: string; }) {
  const r  = (size - stroke) / 2;
  const c  = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
    </svg>
  );
}

/* ── bar chart ── */
function MiniBar({ wins, losses, max, month }: { wins: number; losses: number; max: number; month: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
      <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '60px' }}>
        <div style={{ width: '10px', background: 'linear-gradient(180deg,#10b981,#059669)', borderRadius: '3px 3px 0 0', height: `${(wins/max)*60}px`, boxShadow: '0 0 8px rgba(16,185,129,0.4)', transition: 'height 0.8s ease' }} />
        <div style={{ width: '10px', background: 'rgba(239,68,68,0.5)', borderRadius: '3px 3px 0 0', height: `${(losses/max)*60}px`, transition: 'height 0.8s ease' }} />
      </div>
      <div style={{ fontSize: '9px', color: 'rgba(240,250,245,0.3)', letterSpacing: '0.03em' }}>{month.slice(0,3)}</div>
    </div>
  );
}

export default function PlayerProfilePage() {
  const params = useParams();
  const [player] = useState<Player>(samplePlayer);
  const [tab, setTab]       = useState<'overview'|'matches'|'stats'|'achievements'>('overview');
  const [followed, setFollowed] = useState(false);
  const [scrollY, setScrollY]   = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const fn = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY / 500);
  const maxBar = Math.max(...monthlyStats.map(m => m.wins + m.losses));

  return (
    <>
      <style>{`
        :root { --accent:#10b981; }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes shimmer { 0%{background-position:-200% center;}100%{background-position:200% center;} }
        @keyframes countUp { from{opacity:0;transform:scale(0.8);}to{opacity:1;transform:scale(1);} }

        .tab-btn {
          padding:10px 20px; border-radius:10px; font-size:13px; font-weight:600;
          border:1px solid transparent; cursor:pointer; font-family:inherit;
          transition:all 0.3s ease; white-space:nowrap; letter-spacing:0.01em;
        }
        .tab-btn.active { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3); color:#10b981; }
        .tab-btn:not(.active) { background:rgba(255,255,255,0.03); color:rgba(240,250,245,0.4); }
        .tab-btn:not(.active):hover { background:rgba(255,255,255,0.06); color:rgba(240,250,245,0.7); }

        .stat-tile { padding:20px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; text-align:center; transition:all 0.35s; }
        .stat-tile:hover { background:rgba(255,255,255,0.055); border-color:rgba(16,185,129,0.2); transform:translateY(-4px); }

        .match-row { display:flex; align-items:center; gap:14px; padding:14px 18px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:14px; transition:all 0.3s; }
        .match-row:hover { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.1); }

        .achievement-card { padding:18px; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07); border-radius:16px; transition:all 0.35s; cursor:default; }
        .achievement-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,0.4); }

        .rank-row { display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:12px; transition:background 0.2s; }
        .rank-row.me { background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); }
        .rank-row:not(.me):hover { background:rgba(255,255,255,0.03); }

        @media(max-width:900px) { .profile-grid{grid-template-columns:1fr !important;} }
        @media(max-width:640px) { .stats-grid{grid-template-columns:repeat(2,1fr)!important;} .achiev-grid{grid-template-columns:repeat(2,1fr)!important;} }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#020806 0%,#060d0a 100%)' }}>

        {/* ══════════════ CINEMATIC HERO ══════════════ */}
        <div style={{ position: 'relative', height: 'clamp(520px,70vh,760px)', overflow: 'hidden' }}>

          {/* Background */}
          <img src="/images/billiadr-club-1.jpg" alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.15) saturate(0.4) contrast(1.2)' }} />

          {/* Overlays */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(2,8,6,0.5) 0%, transparent 25%, transparent 45%, rgba(2,8,6,0.97) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(2,8,6,0.7) 0%, transparent 55%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 60% at 20% 65%, rgba(16,185,129,0.1) 0%, transparent 100%)' }} />

          {/* Ambient orb */}
          <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '50vw', height: '50vw', maxWidth: '600px', maxHeight: '600px', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(16,185,129,0.06) 0%,transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none', animation: 'pulse 6s ease-in-out infinite' }} />

          {/* Rank badge — top right */}
          <div style={{ position: 'absolute', top: '80px', right: '40px', zIndex: 10, textAlign: 'center', opacity: heroOpacity }}>
            <div style={{ padding: '16px 24px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(245,158,11,0.15)' }}>
              <div style={{ fontSize: '10px', color: 'rgba(245,158,11,0.7)', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '6px' }}>NATIONAL RANK</div>
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#f59e0b', lineHeight: 1, letterSpacing: '-0.04em', textShadow: '0 0 40px rgba(245,158,11,0.5)' }}>
                #{toFa(player.rank)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '6px' }}>
                {player.rankChange > 0
                  ? <><ChevronUp size={13} style={{ color: '#10b981' }} /><span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{toFa(player.rankChange)}</span></>
                  : player.rankChange < 0
                  ? <><ChevronDown size={13} style={{ color: '#ef4444' }} /><span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>{toFa(Math.abs(player.rankChange))}</span></>
                  : <span style={{ fontSize: '11px', color: 'rgba(240,250,245,0.3)' }}>—</span>
                }
              </div>
            </div>
          </div>

          {/* Breadcrumb */}
          <div style={{ position: 'absolute', top: '24px', left: '40px', zIndex: 10 }}>
            <Link href="/players" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textDecoration: 'none', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '7px 14px' }}>
              <ChevronRight size={13} /> بازیکنان
            </Link>
          </div>

          {/* Player info — bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: 'clamp(24px,4vw,52px)', opacity: heroOpacity }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '28px', flexWrap: 'wrap' }}>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 'clamp(80px,12vw,120px)', height: 'clamp(80px,12vw,120px)', borderRadius: '24px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(32px,6vw,52px)', fontWeight: 900, color: '#fff', border: '3px solid rgba(16,185,129,0.4)', boxShadow: '0 0 40px rgba(16,185,129,0.3), 0 20px 60px rgba(0,0,0,0.5)' }}>
                  {player.firstName[0]}
                </div>
                {/* Online dot */}
                <div style={{ position: 'absolute', bottom: '6px', right: '6px', width: '14px', height: '14px', borderRadius: '50%', background: '#10b981', border: '2px solid rgba(2,8,6,0.9)', boxShadow: '0 0 10px #10b981' }} />
              </div>

              {/* Identity */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                {/* Speciality tag */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px', padding: '5px 16px', marginBottom: '12px', backdropFilter: 'blur(16px)' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, letterSpacing: '0.15em' }}>{player.speciality} · PRO PLAYER</span>
                </div>

                <h1 style={{ fontSize: 'clamp(26px,5vw,52px)', fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.0, textShadow: '0 0 60px rgba(16,185,129,0.2)' }}>
                  {player.firstName} {player.lastName}
                </h1>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>@{player.username}</span>
                  <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    <MapPin size={11} style={{ color: '#10b981' }} /> {player.city}
                  </div>
                  <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>از {toFa(player.playingSince)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
                <button onClick={() => setFollowed(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 22px', borderRadius: '12px', border: 'none', background: followed ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,#10b981,#059669)', color: followed ? '#10b981' : '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s', boxShadow: followed ? 'none' : '0 8px 24px rgba(16,185,129,0.3)', ...(followed ? { border: '1px solid rgba(16,185,129,0.3)' } : {}) }}>
                  {followed ? <><Check size={14} /> دنبال می‌کنید</> : <><UserPlus size={14} /> دنبال کردن</>}
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s', backdropFilter: 'blur(12px)' }}>
                  <MessageCircle size={14} />
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s', backdropFilter: 'blur(12px)' }}>
                  <Share2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom line */}
          <div style={{ position: 'absolute', bottom: 0, left: '7%', right: '7%', height: '1px', background: 'linear-gradient(to right,transparent,rgba(16,185,129,0.2),transparent)' }} />
        </div>

        {/* ══════════════ QUICK STATS BAR ══════════════ */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 clamp(16px,4vw,40px)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
            {[
              { v: toFa(player.points.toLocaleString()), l: 'امتیاز', color: '#f59e0b', icon: <Zap size={14} /> },
              { v: `${toFa(player.winRate)}٪`,           l: 'نرخ پیروزی', color: '#10b981', icon: <TrendingUp size={14} /> },
              { v: toFa(player.totalMatches),             l: 'مسابقه',    color: '#06b6d4', icon: <Target size={14} /> },
              { v: toFa(achievements.length),             l: 'افتخار',    color: '#a78bfa', icon: <Award size={14} /> },
            ].map((s, i) => (
              <div key={i} style={{ padding: '20px 16px', textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: s.color, marginBottom: '6px', opacity: 0.7 }}>{s.icon}</div>
                <div style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: '#f0faf5', letterSpacing: '-0.03em', textShadow: `0 0 24px ${s.color}30`, animation: 'countUp 0.6s ease both' }}>
                  {s.v}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.35)', marginTop: '4px', letterSpacing: '0.04em' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════ MAIN CONTENT ══════════════ */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,3vw,32px)' }}>
          <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '28px', alignItems: 'start' }}>

            {/* ── LEFT ── */}
            <div>

              {/* Tab bar */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', padding: '2px' }}>
                {[
                  { key: 'overview',      label: 'خلاصه' },
                  { key: 'matches',       label: 'تاریخچه مسابقات' },
                  { key: 'stats',         label: 'آمار پیشرفته' },
                  { key: 'achievements',  label: `افتخارات (${achievements.length})` },
                ].map(t => (
                  <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as any)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── TAB: OVERVIEW ── */}
              {tab === 'overview' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>

                  {/* Bio */}
                  <ScrollReveal>
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.01em' }}>
                        <span style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius: '2px', display: 'inline-block' }} />
                        درباره بازیکن
                      </h3>
                      <p style={{ fontSize: '14px', color: 'rgba(240,250,245,0.55)', lineHeight: 1.9, margin: '0 0 20px' }}>{player.bio}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                        {[
                          { label: 'باشگاه',    value: player.club,    icon: <Shield size={13} style={{ color: '#10b981' }} /> },
                          { label: 'مربی',      value: player.coach,   icon: <Star size={13} style={{ color: '#f59e0b' }} /> },
                          { label: 'تخصص',     value: player.speciality, icon: <Target size={13} style={{ color: '#06b6d4' }} /> },
                          { label: 'شروع فعالیت', value: toFa(player.playingSince), icon: <Calendar size={13} style={{ color: '#a78bfa' }} /> },
                        ].map((r, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                            <span style={{ flexShrink: 0 }}>{r.icon}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.3)', marginBottom: '2px' }}>{r.label}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0faf5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Win/Loss breakdown */}
                  <ScrollReveal>
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', margin: '0 0 22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg,#f59e0b,#ef4444)', borderRadius: '2px', display: 'inline-block' }} />
                        نتایج کلی
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        {/* Radial */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <RadialProgress value={player.winRate} size={100} stroke={7} color="#10b981" />
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>{toFa(player.winRate)}٪</div>
                            <div style={{ fontSize: '9px', color: 'rgba(240,250,245,0.3)', marginTop: '2px' }}>W/R</div>
                          </div>
                        </div>
                        {/* Stats */}
                        <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {[
                            { label: 'پیروزی',   v: player.wins,   color: '#10b981', pct: (player.wins/player.totalMatches)*100 },
                            { label: 'شکست',     v: player.losses, color: '#ef4444', pct: (player.losses/player.totalMatches)*100 },
                          ].map(r => (
                            <div key={r.label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{ fontSize: '12px', color: 'rgba(240,250,245,0.45)' }}>{r.label}</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: r.color }}>{toFa(r.v)}</span>
                              </div>
                              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${r.pct}%`, background: r.color, borderRadius: '2px', boxShadow: `0 0 8px ${r.color}60`, transition: 'width 1s ease' }} />
                              </div>
                            </div>
                          ))}
                          <div style={{ fontSize: '12px', color: 'rgba(240,250,245,0.3)', marginTop: '4px' }}>
                            مجموع: {toFa(player.totalMatches)} مسابقه
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Recent tournaments */}
                  <ScrollReveal>
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg,#a78bfa,#06b6d4)', borderRadius: '2px', display: 'inline-block' }} />
                        مسابقات اخیر
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {tournamentHistory.slice(0,4).map((t, i) => (
                          <div key={i} className="match-row">
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${t.color}12`, border: `1px solid ${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                              {t.result.includes('🥇') ? '🥇' : t.result.includes('🥈') ? '🥈' : '🎯'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0faf5', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                              <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.35)' }}>{t.date}</div>
                            </div>
                            <div style={{ textAlign: 'left', flexShrink: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: t.color, marginBottom: '2px' }}>{t.result.replace(/🥇|🥈/g, '').trim() || 'قهرمان'}</div>
                              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>{t.points}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Highlights video placeholder */}
                  <ScrollReveal>
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px' }}>
                      <div style={{ padding: '22px 26px 0' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg,#ef4444,#f59e0b)', borderRadius: '2px', display: 'inline-block' }} />
                          ویدیوهای برتر
                        </h3>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', padding: '0 22px 22px' }}>
                        {['بریک ۱۴۷', 'نیمه‌نهایی آسیا', 'فینال لیگ'].map((title, i) => (
                          <div key={i} style={{ position: 'relative', aspectRatio: '16/9', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}>
                            <img src="/images/billiadr-club-3.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }} />
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16,185,129,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Play size={14} style={{ color: '#fff', marginRight: '-1px' }} />
                              </div>
                            </div>
                            <div style={{ position: 'absolute', bottom: '8px', left: 0, right: 0, textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              )}

              {/* ── TAB: MATCHES ── */}
              {tab === 'matches' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius: '2px', display: 'inline-block' }} />
                      آخرین مسابقات
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {matchHistory.map((m, i) => (
                        <div key={i} className="match-row">
                          {/* W/L badge */}
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: m.result === 'W' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', border: `1px solid ${m.result === 'W' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: m.result === 'W' ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                            {m.result === 'W' ? 'W' : 'L'}
                          </div>
                          {/* Opponent */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0faf5', marginBottom: '3px' }}>{m.opponent}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.35)' }}>{m.tournament} · {m.date}</div>
                          </div>
                          {/* Score */}
                          <div style={{ fontSize: '18px', fontWeight: 900, color: m.result === 'W' ? '#10b981' : '#ef4444', letterSpacing: '-0.02em', flexShrink: 0, textShadow: m.result === 'W' ? '0 0 16px rgba(16,185,129,0.4)' : '0 0 16px rgba(239,68,68,0.3)' }}>
                            {m.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tournament history full */}
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '26px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg,#f59e0b,#a78bfa)', borderRadius: '2px', display: 'inline-block' }} />
                      تاریخچه مسابقات
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {tournamentHistory.map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', transition: 'all 0.2s' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color, boxShadow: `0 0 10px ${t.color}`, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0faf5', marginBottom: '3px' }}>{t.name}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.3)' }}>{t.date}</div>
                          </div>
                          <div style={{ textAlign: 'left', flexShrink: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: t.color, marginBottom: '3px' }}>{t.result.replace(/🥇|🥈/g,'').trim() || 'قهرمان'}</div>
                            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>{t.points}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: STATS ── */}
              {tab === 'stats' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>

                  {/* Stat tiles */}
                  <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
                    {[
                      { v: toFa(player.wins),            l: 'پیروزی',          c: '#10b981' },
                      { v: toFa(player.losses),           l: 'شکست',            c: '#ef4444' },
                      { v: `${toFa(player.winRate)}٪`,   l: 'نرخ پیروزی',      c: '#10b981' },
                      { v: toFa(player.points.toLocaleString()), l: 'امتیاز کل', c: '#f59e0b' },
                      { v: `#${toFa(player.rank)}`,      l: 'رنک ملی',          c: '#f59e0b' },
                      { v: toFa(12),                      l: 'سال تجربه',        c: '#a78bfa' },
                    ].map((s, i) => (
                      <div key={i} className="stat-tile">
                        <div style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, color: s.c, letterSpacing: '-0.03em', textShadow: `0 0 24px ${s.c}40`, marginBottom: '6px', animation: 'countUp 0.6s ease both' }}>{s.v}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.35)', letterSpacing: '0.04em' }}>{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Monthly bar chart */}
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg,#06b6d4,#10b981)', borderRadius: '2px', display: 'inline-block' }} />
                      عملکرد ماهانه
                    </h3>
                    <div style={{ fontSize: '12px', color: 'rgba(240,250,245,0.3)', marginBottom: '20px' }}>۶ ماه اخیر</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', padding: '0 4px' }}>
                      {monthlyStats.map((m, i) => (
                        <MiniBar key={i} wins={m.wins} losses={m.losses} max={maxBar} month={m.month} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', color: 'rgba(240,250,245,0.4)' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }} />پیروزی
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', color: 'rgba(240,250,245,0.4)' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(239,68,68,0.5)', display: 'inline-block' }} />شکست
                      </div>
                    </div>
                  </div>

                  {/* Performance metrics */}
                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '26px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg,#a78bfa,#f59e0b)', borderRadius: '2px', display: 'inline-block' }} />
                      شاخص‌های عملکردی
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {[
                        { label: 'نرخ پیروزی',        value: 74,  color: '#10b981' },
                        { label: 'ثبات عملکرد',       value: 88,  color: '#06b6d4' },
                        { label: 'قدرت ضربه',         value: 92,  color: '#f59e0b' },
                        { label: 'مدیریت مسابقه',     value: 81,  color: '#a78bfa' },
                        { label: 'عملکرد تحت فشار',   value: 69,  color: '#ef4444' },
                      ].map((m, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '13px', color: 'rgba(240,250,245,0.55)' }}>{m.label}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: m.color }}>{toFa(m.value)}٪</span>
                          </div>
                          <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${m.value}%`, background: `linear-gradient(90deg,${m.color},${m.color}80)`, borderRadius: '3px', boxShadow: `0 0 10px ${m.color}50`, transition: 'width 1s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: ACHIEVEMENTS ── */}
              {tab === 'achievements' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                  <div className="achiev-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                    {achievements.map((a, i) => (
                      <ScrollReveal key={i} delay={i * 0.07}>
                        <div className="achievement-card" style={{ borderColor: `${a.color}20` }}>
                          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60px', height: '1px', background: `linear-gradient(90deg,transparent,${a.color}50,transparent)` }} />
                          <div style={{ fontSize: '36px', marginBottom: '12px', textAlign: 'center', filter: `drop-shadow(0 0 12px ${a.color}60)` }}>{a.icon}</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0faf5', marginBottom: '6px', textAlign: 'center', lineHeight: 1.4 }}>{a.title}</div>
                          <div style={{ fontSize: '10px', color: a.color, fontWeight: 700, textAlign: 'center', letterSpacing: '0.08em', background: `${a.color}12`, border: `1px solid ${a.color}25`, borderRadius: '20px', padding: '3px 12px', width: 'fit-content', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>{a.year}</div>
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Points card */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '22px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)', boxShadow: '0 0 16px rgba(245,158,11,0.3)' }} />
                <div style={{ position: 'absolute', bottom: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(rgba(245,158,11,0.08),transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ fontSize: '10px', color: 'rgba(245,158,11,0.6)', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '12px', textAlign: 'center' }}>RANKING POINTS</div>
                <div style={{ fontSize: '44px', fontWeight: 900, color: '#f59e0b', textAlign: 'center', lineHeight: 1, letterSpacing: '-0.04em', textShadow: '0 0 40px rgba(245,158,11,0.4)', marginBottom: '6px' }}>
                  {toFa(player.points.toLocaleString())}
                </div>
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(240,250,245,0.35)', marginBottom: '16px' }}>امتیاز ملی</div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', padding: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px' }}>
                  <TrendingUp size={13} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                    {player.rankChange > 0 ? `+${toFa(player.rankChange)} رتبه در ماه جاری` : 'رتبه ثابت'}
                  </span>
                </div>
              </div>

              {/* Ranking leaderboard */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0faf5', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '3px', height: '14px', background: 'linear-gradient(180deg,#f59e0b,transparent)', borderRadius: '2px', display: 'inline-block' }} />
                  جدول رنکینگ
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {topPlayers.map((p, i) => (
                    <div key={i} className={`rank-row ${(p as any).isMe ? 'me' : ''}`}>
                      {/* Rank number */}
                      <div style={{ width: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c4a' : 'rgba(240,250,245,0.3)', flexShrink: 0 }}>
                        {i < 3 ? ['🥇','🥈','🥉'][i] : toFa(p.rank)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: (p as any).isMe ? 800 : 600, color: (p as any).isMe ? '#10b981' : '#f0faf5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.3)', marginTop: '1px' }}>{toFa(p.points.toLocaleString())} pt</div>
                      </div>
                      {/* Change */}
                      <div style={{ flexShrink: 0 }}>
                        {p.change > 0
                          ? <span style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center' }}><ChevronUp size={12} />{p.change}</span>
                          : p.change < 0
                          ? <span style={{ fontSize: '10px', color: '#ef4444', display: 'flex', alignItems: 'center' }}><ChevronDown size={12} />{Math.abs(p.change)}</span>
                          : <span style={{ fontSize: '10px', color: 'rgba(240,250,245,0.2)' }}>—</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/rankings" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: 'rgba(240,250,245,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#10b981'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(240,250,245,0.35)'; }}>
                  جدول کامل <ChevronRight size={12} />
                </Link>
              </div>

              {/* Coach card */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(167,139,250,0.6)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: '12px' }}>COACH</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                    {player.coach[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0faf5', marginBottom: '3px' }}>{player.coach}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.35)' }}>مربی ارشد · ۱۵ سال سابقه</div>
                  </div>
                </div>
              </div>

              {/* Club card */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(16,185,129,0.6)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: '12px' }}>CLUB</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🏆</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0faf5', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.club}</div>
                    <Link href={`/clubs/1`} style={{ fontSize: '11px', color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>مشاهده باشگاه ←</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}