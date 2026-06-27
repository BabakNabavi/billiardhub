'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy, Users, Calendar, MapPin, ChevronRight,
  Clock, Play, Zap, Award, TrendingUp, Shield,
  CheckCircle, Circle, ChevronLeft, Share2,
  Activity, Target, Star,
} from 'lucide-react';
import ScrollReveal from '../../../components/ScrollReveal/ScrollReveal';

/* ══ types ══ */
type TournamentStatus = 'upcoming' | 'live' | 'completed';
type MatchStatus      = 'upcoming' | 'live' | 'completed';

interface Player  { id: string; name: string; rank: number; city: string; avatar: string; points: number; }
interface Match   { id: string; player1: Player; player2: Player; score1: number; score2: number; status: MatchStatus; time: string; table: string; round: string; }
interface Group   { name: string; players: { player: Player; w: number; l: number; pts: number; }[]; }

/* ══ sample data ══ */
const mkPlayer = (id: string, name: string, rank: number, city: string, pts: number): Player =>
  ({ id, name, rank, city, avatar: name[0] ?? 'A', points: pts });

const sampleTournament = {
  id: '1',
  title: 'مسابقات سراسری اسنوکر ایران',
  subtitle: 'National Snooker Championship',
  edition: '۱۴۰۴',
  status: 'live' as TournamentStatus,
  type: 'اسنوکر',
  format: 'حذفی + گروهی',
  venue: 'سالن المپیک تهران',
  city: 'تهران',
  startDate: '۱۴۰۴/۰۳/۱۵',
  endDate: '۱۴۰۴/۰۳/۲۲',
  prize: '۵۰,۰۰۰,۰۰۰',
  prizes: [
    { place: '🥇 اول',   amount: '۲۵,۰۰۰,۰۰۰', color: '#f59e0b' },
    { place: '🥈 دوم',   amount: '۱۲,۰۰۰,۰۰۰', color: 'rgba(0,0,0,0.50)' },
    { place: '🥉 سوم',   amount: '۷,۰۰۰,۰۰۰',  color: '#cd7c4a' },
    { place: '4 نفر بعدی', amount: '۱,۵۰۰,۰۰۰', color: '#06b6d4' },
  ],
  participants: 48,
  maxParticipants: 64,
  registrationOpen: false,
  sponsor: 'ویراکا',
  description: 'بزرگترین رویداد اسنوکر ایران در سال ۱۴۰۴ با حضور ۶۴ بازیکن برتر از سراسر کشور. این مسابقه به عنوان رویداد رسمی فدراسیون بیلیارد ایران برگزار می‌شود و امتیازات آن در رنکینگ ملی محاسبه می‌گردد.',
  image: '/images/billiadr-club-1.jpg',
  stats: { totalMatches: 96, completedMatches: 38, remainingMatches: 58, avgBreak: 74, highestBreak: 143 },
};

const players = [
  mkPlayer('p1', 'امیرحسین رضایی', 3,  'تهران',   8420),
  mkPlayer('p2', 'سعید موسوی',     1,  'مشهد',    9840),
  mkPlayer('p3', 'محمد حسینی',     2,  'اصفهان',  9120),
  mkPlayer('p4', 'رضا کریمی',      4,  'تهران',   7980),
  mkPlayer('p5', 'نیما نوری',      5,  'شیراز',   7540),
  mkPlayer('p6', 'کاوه رستمی',     6,  'تبریز',   7200),
  mkPlayer('p7', 'علی صادقی',      7,  'کرج',     6980),
  mkPlayer('p8', 'حسین فتحی',      8,  'اهواز',   6720),
];

const matches: Match[] = [
  { id: 'm1', player1: players[0]!, player2: players[1]!, score1: 4, score2: 3, status: 'live',      time: 'در حال بازی', table: 'میز ۱', round: 'نیمه‌نهایی' },
  { id: 'm2', player1: players[2]!, player2: players[3]!, score1: 0, score2: 0, status: 'live',      time: 'در حال بازی', table: 'میز ۲', round: 'نیمه‌نهایی' },
  { id: 'm3', player1: players[4]!, player2: players[5]!, score1: 6, score2: 4, status: 'completed', time: '۱۴:۳۰',       table: 'میز ۱', round: 'ربع‌نهایی' },
  { id: 'm4', player1: players[6]!, player2: players[7]!, score1: 6, score2: 2, status: 'completed', time: '۱۲:۰۰',       table: 'میز ۳', round: 'ربع‌نهایی' },
  { id: 'm5', player1: players[0]!, player2: players[4]!, score1: 0, score2: 0, status: 'upcoming',  time: 'فردا ۱۰:۰۰',  table: 'میز ۱', round: 'فینال' },
];

const groups: Group[] = [
  {
    name: 'گروه A',
    players: [
      { player: players[0]!, w: 3, l: 0, pts: 9 },
      { player: players[1]!, w: 2, l: 1, pts: 6 },
      { player: players[2]!, w: 1, l: 2, pts: 3 },
      { player: players[3]!, w: 0, l: 3, pts: 0 },
    ],
  },
  {
    name: 'گروه B',
    players: [
      { player: players[4]!, w: 3, l: 0, pts: 9 },
      { player: players[5]!, w: 2, l: 1, pts: 6 },
      { player: players[6]!, w: 1, l: 2, pts: 3 },
      { player: players[7]!, w: 0, l: 3, pts: 0 },
    ],
  },
];

/* bracket data */
const bracket = {
  rounds: [
    {
      name: 'ربع‌نهایی',
      matches: [
        { p1: 'امیرحسین رضایی', p2: 'کاوه رستمی',   s1: 6, s2: 2, done: true  },
        { p1: 'سعید موسوی',     p2: 'علی صادقی',     s1: 6, s2: 3, done: true  },
        { p1: 'محمد حسینی',     p2: 'حسین فتحی',     s1: 6, s2: 1, done: true  },
        { p1: 'رضا کریمی',      p2: 'نیما نوری',     s1: 4, s2: 6, done: true  },
      ],
    },
    {
      name: 'نیمه‌نهایی',
      matches: [
        { p1: 'امیرحسین رضایی', p2: 'سعید موسوی',   s1: 4, s2: 3, done: false, live: true  },
        { p1: 'محمد حسینی',     p2: 'نیما نوری',    s1: 0, s2: 0, done: false, live: true  },
      ],
    },
    {
      name: 'فینال',
      matches: [
        { p1: '؟', p2: '؟', s1: 0, s2: 0, done: false, live: false },
      ],
    },
  ],
};

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

/* ── match card ── */
function MatchCard({ match }: { match: Match }) {
  const isLive      = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const winner      = isCompleted ? (match.score1 > match.score2 ? 1 : 2) : 0;

  return (
    <div style={{ background: isLive ? 'rgba(239,68,68,0.05)' : '#FFFFFF', border: `1px solid ${isLive ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.07)'}`, borderRadius: '16px', padding: '16px 18px', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}>

      {/* live glow */}
      {isLive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.6),transparent)', boxShadow: '0 0 12px rgba(239,68,68,0.3)' }} />}

      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isLive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '20px', padding: '3px 10px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700, letterSpacing: '0.1em' }}>LIVE</span>
            </div>
          )}
          {isCompleted && <span style={{ fontSize: '12px', color: '#C7A66A', fontWeight: 700, letterSpacing: '0.1em' }}>FINAL</span>}
          {match.status === 'upcoming' && <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.40)', letterSpacing: '0.08em' }}>UPCOMING</span>}
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'rgba(0,0,0,0.35)' }}>
          <span>{match.round}</span>
          <span>·</span>
          <span>{match.table}</span>
          <span>·</span>
          <span>{match.time}</span>
        </div>
      </div>

      {/* players + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Player 1 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', opacity: isCompleted && winner === 2 ? 0.45 : 1 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: isCompleted && winner === 1 ? '0 0 14px rgba(199,166,106,0.4)' : 'none' }}>
            {match.player1.avatar}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: isCompleted && winner === 1 ? 800 : 600, color: isCompleted && winner === 1 ? '#f0faf5' : 'rgba(0,0,0,0.48)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {match.player1.name.split(' ').slice(-1)[0]}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.35)' }}>#{toFa(match.player1.rank)}</div>
          </div>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: isCompleted && winner === 1 ? '#C7A66A' : isLive ? '#f0faf5' : 'rgba(0,0,0,0.42)', letterSpacing: '-0.02em', minWidth: '24px', textAlign: 'center', textShadow: isCompleted && winner === 1 ? '0 0 16px rgba(199,166,106,0.5)' : 'none' }}>
            {match.status === 'upcoming' ? '-' : toFa(match.score1)}
          </div>
          <div style={{ fontSize: '15px', color: 'rgba(0,0,0,0.30)', fontWeight: 700 }}>:</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: isCompleted && winner === 2 ? '#C7A66A' : isLive ? '#f0faf5' : 'rgba(0,0,0,0.42)', letterSpacing: '-0.02em', minWidth: '24px', textAlign: 'center', textShadow: isCompleted && winner === 2 ? '0 0 16px rgba(199,166,106,0.5)' : 'none' }}>
            {match.status === 'upcoming' ? '-' : toFa(match.score2)}
          </div>
        </div>

        {/* Player 2 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', opacity: isCompleted && winner === 1 ? 0.45 : 1 }}>
          <div style={{ minWidth: 0, textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: isCompleted && winner === 2 ? 800 : 600, color: isCompleted && winner === 2 ? '#f0faf5' : 'rgba(0,0,0,0.48)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {match.player2.name.split(' ').slice(-1)[0]}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.35)' }}>#{toFa(match.player2.rank)}</div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: isCompleted && winner === 2 ? '0 0 14px rgba(6,182,212,0.4)' : 'none' }}>
            {match.player2.avatar}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── bracket match ── */
function BracketMatch({ p1, p2, s1, s2, done, live }: any) {
  const winner = done ? (s1 > s2 ? 1 : 2) : 0;
  return (
    <div style={{ background: live ? 'rgba(239,68,68,0.06)' : '#FFFFFF', border: `1px solid ${live ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.07)'}`, borderRadius: '12px', overflow: 'hidden', width: '200px', position: 'relative' }}>
      {live && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.5),transparent)' }} />}
      {[{ name: p1, score: s1, w: winner === 1 }, { name: p2, score: s2, w: winner === 2 }].map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: i === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderTop: i === 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
          <span style={{ fontSize: '14px', fontWeight: p.w ? 800 : 500, color: p.w ? '#f0faf5' : 'rgba(0,0,0,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>
            {p.name.split(' ').slice(-1)[0]}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 900, color: p.w ? '#C7A66A' : done ? 'rgba(0,0,0,0.30)' : 'rgba(0,0,0,0.42)', flexShrink: 0, marginRight: '8px', textShadow: p.w ? '0 0 12px rgba(199,166,106,0.5)' : 'none' }}>
            {done || live ? toFa(p.score) : '-'}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ══ main component ══ */
export default function TournamentPage() {
  const params = useParams();
  const t      = sampleTournament;
  const [tab, setTab]     = useState<'overview'|'matches'|'bracket'|'groups'|'players'>('overview');
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const fn = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY / 600);
  const liveMatches = matches.filter(m => m.status === 'live');
  const progress    = Math.round((t.stats.completedMatches / t.stats.totalMatches) * 100);

  return (
    <>
      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes liveGlow { 0%,100%{box-shadow:0 0 8px rgba(239,68,68,0.4);}50%{box-shadow:0 0 20px rgba(239,68,68,0.7);} }

        .tab-btn { padding:10px 20px; border-radius:10px; font-size:13px; font-weight:600; border:1px solid transparent; cursor:pointer; font-family:inherit; transition:all 0.3s; white-space:nowrap; }
        .tab-btn.active { background:rgba(199,166,106,0.1); border-color:rgba(199,166,106,0.3); color:#C7A66A; }
        .tab-btn:not(.active) { background:rgba(0,0,0,0.03); color:rgba(0,0,0,0.42); }
        .tab-btn:not(.active):hover { background:rgba(0,0,0,0.05); color:rgba(0,0,0,0.48); }

        .player-row { display:flex; align-items:center; gap:14px; padding:13px 16px; border-radius:13px; transition:all 0.25s; cursor:default; }
        .player-row:hover { background:rgba(0,0,0,0.03); }

        .prize-card { padding:18px 20px; background:#FFFFFF; border:1px solid rgba(0,0,0,0.07); border-radius:16px; display:flex; align-items:center; gap:16px; transition:all 0.35s; }
        .prize-card:hover { background:rgba(0,0,0,0.04); transform:translateX(-4px); }

        @media(max-width:900px) { .t-grid{grid-template-columns:1fr !important;} }
        @media(max-width:640px) { .stat-bar{grid-template-columns:repeat(2,1fr)!important;} }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5' }}>

        {/* ══════════ CINEMATIC HERO ══════════ */}
        <div style={{ position: 'relative', height: 'clamp(500px,68vh,740px)', overflow: 'hidden' }}>

          {/* BG */}
          <img src={t.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.14) saturate(0.4) contrast(1.2)' }} />

          {/* Overlays */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(2,8,6,0.6) 0%, transparent 25%, transparent 40%, rgba(2,8,6,0.97) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(2,8,6,0.6) 0%, transparent 55%)' }} />
          {/* Red live glow */}
          {t.status === 'live' && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 55% at 20% 65%, rgba(239,68,68,0.08) 0%, transparent 100%)' }} />}
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 55% 55% at 20% 65%, rgba(199,166,106,0.07) 0%, transparent 100%)` }} />

          {/* Ambient orb */}
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '55vw', height: '55vw', maxWidth: '700px', maxHeight: '700px', borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(245,158,11,0.05) 0%,transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          {/* Top nav */}
          <div style={{ position: 'absolute', top: '24px', left: 0, right: 0, zIndex: 10, padding: '0 clamp(16px,4vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/events" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '10px', padding: '7px 14px' }}>
              <ChevronRight size={13} /> مسابقات
            </Link>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '10px', padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Share2 size={12} /> اشتراک‌گذاری
            </button>
          </div>

          {/* Bottom content */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: 'clamp(24px,4vw,52px)', opacity: heroOpacity }}>

            {/* Status badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: t.status === 'live' ? 'rgba(239,68,68,0.12)' : t.status === 'completed' ? 'rgba(0,0,0,0.05)' : 'rgba(199,166,106,0.1)', border: `1px solid ${t.status === 'live' ? 'rgba(239,68,68,0.3)' : t.status === 'completed' ? 'rgba(0,0,0,0.08)' : 'rgba(199,166,106,0.25)'}`, borderRadius: '100px', padding: '6px 18px', marginBottom: '18px', backdropFilter: 'blur(16px)', animation: t.status === 'live' ? 'liveGlow 3s infinite' : 'none' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.status === 'live' ? '#ef4444' : t.status === 'completed' ? '#94a3b8' : '#C7A66A', boxShadow: `0 0 8px ${t.status === 'live' ? '#ef4444' : t.status === 'completed' ? '#94a3b8' : '#C7A66A'}`, display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '12px', color: t.status === 'live' ? '#fca5a5' : t.status === 'completed' ? '#94a3b8' : '#6ee7b7', fontWeight: 700, letterSpacing: '0.15em' }}>
                {t.status === 'live' ? '● LIVE NOW' : t.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'rgba(245,158,11,0.7)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '12px' }}>
              {t.subtitle} · {t.edition}
            </div>

            <h1 style={{ fontSize: 'clamp(31px, 6.1vw, 66px)', fontWeight: 900, color: '#fff', margin: '0 0 18px', letterSpacing: '-0.035em', lineHeight: 1.0, textShadow: '0 0 60px rgba(245,158,11,0.15)' }}>
              {t.title}
            </h1>

            {/* Meta badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '6px 14px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                <MapPin size={11} style={{ color: '#C7A66A' }} /> {t.venue}، {t.city}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '6px 14px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                <Calendar size={11} style={{ color: '#C7A66A' }} /> {t.startDate} — {t.endDate}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(245,158,11,0.15)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '6px 14px', fontSize: '14px', color: '#fcd34d' }}>
                <Trophy size={11} /> {t.prize} تومان
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '6px 14px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                <Users size={11} style={{ color: '#06b6d4' }} /> {toFa(t.participants)}/{toFa(t.maxParticipants)}
              </div>
            </div>
          </div>

          {/* Vertical neon line */}
          <div style={{ position: 'absolute', right: '52px', top: '25%', bottom: '25%', width: '1px', zIndex: 5, pointerEvents: 'none', background: 'linear-gradient(to bottom,transparent,rgba(245,158,11,0.4),transparent)', boxShadow: '0 0 16px rgba(245,158,11,0.25)', opacity: heroOpacity }} />
        </div>

        {/* ══════════ LIVE BAR ══════════ */}
        {t.status === 'live' && liveMatches.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.15)', padding: '12px clamp(16px,4vw,40px)', display: 'flex', alignItems: 'center', gap: '20px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 700, letterSpacing: '0.12em' }}>LIVE</span>
            </div>
            {liveMatches.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '100px', flexShrink: 0 }}>
                <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.48)', fontWeight: 600 }}>{m.player1.name.split(' ').slice(-1)[0]}</span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#ef4444' }}>{toFa(m.score1)}:{toFa(m.score2)}</span>
                <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.48)', fontWeight: 600 }}>{m.player2.name.split(' ').slice(-1)[0]}</span>
                <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.35)' }}>{m.round}</span>
              </div>
            ))}
          </div>
        )}

        {/* ══════════ PROGRESS BAR ══════════ */}
        <div style={{ background: 'rgba(2,8,6,0.98)', borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '0 clamp(16px,4vw,40px)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: 'none' }}>
              {[
                { v: toFa(t.stats.totalMatches),     l: 'کل مسابقات',     c: '#f0faf5'  },
                { v: toFa(t.stats.completedMatches), l: 'برگزارشده',      c: '#C7A66A'  },
                { v: toFa(t.stats.remainingMatches), l: 'باقی‌مانده',     c: '#06b6d4'  },
                { v: toFa(t.stats.highestBreak),     l: 'بالاترین بریک',  c: '#f59e0b'  },
              ].map((s, i) => (
                <div key={i} style={{ padding: '18px 16px', textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                  <div style={{ fontSize: 'clamp(22px, 3.3vw, 31px)', fontWeight: 900, color: s.c, letterSpacing: '-0.03em', textShadow: `0 0 20px ${s.c}30` }}>{s.v}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.35)', marginTop: '4px' }}>{s.l}</div>
                </div>
              ))}
            </div>
            {/* Progress */}
            <div style={{ padding: '12px 0 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.40)' }}>پیشرفت مسابقات</span>
                <span style={{ fontSize: '13px', color: '#C7A66A', fontWeight: 700 }}>{toFa(progress)}٪</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#C7A66A,#A07840)', borderRadius: '2px', boxShadow: '0 0 10px rgba(199,166,106,0.5)', transition: 'width 1s ease' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ MAIN CONTENT ══════════ */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,3vw,32px)' }}>
          <div className="t-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>

            {/* ── LEFT ── */}
            <div>
              {/* Tab bar */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', padding: '2px' }}>
                {[
                  { key: 'overview', label: 'خلاصه' },
                  { key: 'matches',  label: `مسابقات (${matches.length})` },
                  { key: 'bracket',  label: 'جدول حذفی' },
                  { key: 'groups',   label: 'مرحله گروهی' },
                  { key: 'players',  label: 'بازیکنان' },
                ].map(tb => (
                  <button key={tb.key} className={`tab-btn ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key as any)}>
                    {tb.label}
                  </button>
                ))}
              </div>

              {/* ── TAB: OVERVIEW ── */}
              {tab === 'overview' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>

                  {/* Live matches */}
                  {liveMatches.length > 0 && (
                    <ScrollReveal>
                      <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '20px', padding: '24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '140px', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.6),transparent)', boxShadow: '0 0 12px rgba(239,68,68,0.3)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                            <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 700, letterSpacing: '0.1em' }}>در حال بازی</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {liveMatches.map(m => <MatchCard key={m.id} match={m} />)}
                        </div>
                      </div>
                    </ScrollReveal>
                  )}

                  {/* About */}
                  <ScrollReveal>
                    <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111111', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '3px', height: '16px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: '2px', display: 'inline-block' }} />
                        درباره مسابقه
                      </h3>
                      <p style={{ fontSize: '16px', color: 'rgba(0,0,0,0.45)', lineHeight: 1.9, margin: '0 0 20px' }}>{t.description}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                        {[
                          { label: 'فرمت',      value: t.format,  icon: <Activity size={13} style={{ color: '#C7A66A' }} /> },
                          { label: 'نوع',       value: t.type,    icon: <Target size={13} style={{ color: '#06b6d4' }} /> },
                          { label: 'حامی مالی', value: t.sponsor, icon: <Shield size={13} style={{ color: '#f59e0b' }} /> },
                          { label: 'مکان',      value: t.venue,   icon: <MapPin size={13} style={{ color: '#a78bfa' }} /> },
                        ].map((r, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: '12px' }}>
                            <span style={{ flexShrink: 0 }}>{r.icon}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.35)', marginBottom: '2px' }}>{r.label}</div>
                              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Featured players */}
                  <ScrollReveal>
                    <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111111', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg,#f59e0b,#a78bfa)', borderRadius: '2px', display: 'inline-block' }} />
                        بازیکنان برتر
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {players.slice(0, 5).map((p, i) => (
                          <div key={i} className="player-row">
                            <div style={{ width: '28px', textAlign: 'center', fontSize: '16px', fontWeight: 800, color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c4a' : 'rgba(0,0,0,0.30)', flexShrink: 0 }}>
                              {i < 3 ? ['🥇','🥈','🥉'][i] : toFa(i + 1)}
                            </div>
                            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: `linear-gradient(135deg, ${['#C7A66A','#06b6d4','#a78bfa','#f59e0b','#ef4444'][i % 5]}, ${['#059669','#0891b2','#7c3aed','#d97706','#dc2626'][i % 5]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                              {p.avatar}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', marginBottom: '3px' }}>{p.name}</div>
                              <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.40)' }}>{p.city} · رنک #{toFa(p.rank)}</div>
                            </div>
                            <div style={{ textAlign: 'left', flexShrink: 0 }}>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b' }}>{toFa(p.points.toLocaleString())}</div>
                              <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.35)' }}>امتیاز</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Recent completed */}
                  <ScrollReveal>
                    <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '26px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111111', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '3px', height: '16px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: '2px', display: 'inline-block' }} />
                        آخرین نتایج
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {matches.filter(m => m.status === 'completed').map(m => <MatchCard key={m.id} match={m} />)}
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              )}

              {/* ── TAB: MATCHES ── */}
              {tab === 'matches' && (
                <div style={{ animation: 'fadeUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['live','upcoming','completed'].map(status => {
                    const filtered = matches.filter(m => m.status === status);
                    if (filtered.length === 0) return null;
                    return (
                      <div key={status}>
                        <div style={{ fontSize: '13px', color: status === 'live' ? '#ef4444' : status === 'upcoming' ? '#06b6d4' : '#C7A66A', fontWeight: 700, marginBottom: '10px', paddingRight: '4px' }}>
                          {status === 'live' ? '● در حال بازی' : status === 'upcoming' ? 'پیش رو' : 'پایان‌یافته'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                          {filtered.map(m => <MatchCard key={m.id} match={m} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── TAB: BRACKET ── */}
              {tab === 'bracket' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '28px', overflowX: 'auto' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111111', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg,#f59e0b,#ef4444)', borderRadius: '2px', display: 'inline-block' }} />
                      جدول حذفی
                    </h3>
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center', minWidth: 'max-content', paddingBottom: '8px' }}>
                      {bracket.rounds.map((round, ri) => (
                        <div key={ri} style={{ display: 'flex', flexDirection: 'column', gap: `${Math.pow(2, ri + 1) * 8}px`, justifyContent: 'center' }}>
                          <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.40)', fontWeight: 700, letterSpacing: '0.15em', textAlign: 'center', marginBottom: '12px', padding: '5px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
                            {round.name}
                          </div>
                          {round.matches.map((m, mi) => (
                            <BracketMatch key={mi} {...m} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: GROUPS ── */}
              {tab === 'groups' && (
                <div style={{ animation: 'fadeUp 0.4s ease both', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px' }} className="groups-grid">
                  <style>{`@media(max-width:640px){.groups-grid{grid-template-columns:1fr!important;}}`}</style>
                  {groups.map((g, gi) => (
                    <ScrollReveal key={gi} delay={gi * 0.1}>
                      <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#111111', letterSpacing: '-0.01em' }}>{g.name}</span>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'rgba(0,0,0,0.35)', fontWeight: 700, letterSpacing: '0.08em' }}>
                            <span>W</span><span>L</span><span>PTS</span>
                          </div>
                        </div>
                        {/* Rows */}
                        <div>
                          {g.players.map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 20px', borderBottom: i < g.players.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', background: i < 2 ? 'rgba(199,166,106,0.02)' : 'transparent' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: i < 2 ? '#C7A66A' : 'rgba(0,0,0,0.35)', width: '16px', flexShrink: 0 }}>{toFa(i + 1)}</span>
                              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `linear-gradient(135deg, ${['#C7A66A','#06b6d4','#a78bfa','#f59e0b'][i]},${['#059669','#0891b2','#7c3aed','#d97706'][i]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                                {r.player.avatar}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.player.name.split(' ').slice(-1)[0]}</div>
                                {i < 2 && <div style={{ fontSize: '10px', color: '#C7A66A', fontWeight: 700 }}>صعود کرد</div>}
                              </div>
                              <div style={{ display: 'flex', gap: '16px', fontSize: '15px', flexShrink: 0 }}>
                                <span style={{ color: '#C7A66A', fontWeight: 700 }}>{toFa(r.w)}</span>
                                <span style={{ color: '#ef4444', fontWeight: 700 }}>{toFa(r.l)}</span>
                                <span style={{ color: '#111111', fontWeight: 800, minWidth: '18px', textAlign: 'left' }}>{toFa(r.pts)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              )}

              {/* ── TAB: PLAYERS ── */}
              {tab === 'players' && (
                <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
                    {/* Table header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '12px', color: 'rgba(0,0,0,0.40)', fontWeight: 700 }}>
                      <span style={{ width: '28px' }}>#</span>
                      <span style={{ flex: 1 }}>بازیکن</span>
                      <span style={{ width: '60px', textAlign: 'left' }}>شهر</span>
                      <span style={{ width: '50px', textAlign: 'left' }}>رنک</span>
                      <span style={{ width: '70px', textAlign: 'left' }}>امتیاز</span>
                    </div>
                    {players.map((p, i) => (
                      <div key={i} className="player-row" style={{ borderBottom: i < players.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', borderRadius: 0 }}>
                        <span style={{ width: '28px', fontSize: '15px', fontWeight: 800, color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c4a' : 'rgba(0,0,0,0.30)', flexShrink: 0 }}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : toFa(i + 1)}
                        </span>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${['#C7A66A','#06b6d4','#a78bfa','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'][i % 8]}, ${['#059669','#0891b2','#7c3aed','#d97706','#dc2626','#7c3aed','#db2777','#0d9488'][i % 8]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                          {p.avatar}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        </div>
                        <span style={{ width: '60px', fontSize: '14px', color: 'rgba(0,0,0,0.42)', flexShrink: 0 }}>{p.city}</span>
                        <span style={{ width: '50px', fontSize: '14px', color: 'rgba(0,0,0,0.42)', flexShrink: 0 }}>#{toFa(p.rank)}</span>
                        <span style={{ width: '70px', fontSize: '15px', fontWeight: 700, color: '#f59e0b', flexShrink: 0 }}>{toFa(p.points.toLocaleString())}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Prize pool */}
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '22px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)', boxShadow: '0 0 16px rgba(245,158,11,0.3)' }} />
                <div style={{ padding: '22px 22px 14px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(245,158,11,0.6)', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>PRIZE POOL</div>
                  <div style={{ fontSize: '40px', fontWeight: 900, color: '#f59e0b', textAlign: 'center', lineHeight: 1, letterSpacing: '-0.04em', textShadow: '0 0 40px rgba(245,158,11,0.4)', marginBottom: '4px' }}>{t.prize}</div>
                  <div style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(0,0,0,0.35)', marginBottom: '18px' }}>تومان</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {t.prizes.map((p, i) => (
                    <div key={i} className="prize-card" style={{ borderRadius: 0, border: 'none', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: '20px', flexShrink: 0 }}>{['🥇','🥈','🥉','🎯'][i] ?? '🎯'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: p.color, fontWeight: 700 }}>{p.place}</div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: p.color, letterSpacing: '-0.01em' }}>{p.amount}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tournament info */}
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '3px', height: '14px', background: 'linear-gradient(180deg,#06b6d4,transparent)', borderRadius: '2px', display: 'inline-block' }} />
                  اطلاعات مسابقه
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { icon: <Calendar size={13} style={{ color: '#C7A66A' }} />, label: 'شروع',    v: t.startDate    },
                    { icon: <Calendar size={13} style={{ color: '#C7A66A' }} />, label: 'پایان',   v: t.endDate      },
                    { icon: <MapPin size={13} style={{ color: '#06b6d4' }} />,   label: 'مکان',    v: t.venue        },
                    { icon: <Users size={13} style={{ color: '#a78bfa' }} />,    label: 'بازیکنان', v: `${toFa(t.participants)}/${toFa(t.maxParticipants)}` },
                    { icon: <Award size={13} style={{ color: '#f59e0b' }} />,    label: 'حامی',    v: t.sponsor      },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', transition: 'background 0.2s' }}>
                      <span style={{ flexShrink: 0 }}>{r.icon}</span>
                      <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.42)', flex: 1 }}>{r.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111111' }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Participation */}
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '3px', height: '14px', background: 'linear-gradient(180deg,#a78bfa,transparent)', borderRadius: '2px', display: 'inline-block' }} />
                  ظرفیت
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.42)' }}>ثبت‌نام‌شدگان</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#111111' }}>{toFa(t.participants)}/{toFa(t.maxParticipants)}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ height: '100%', width: `${(t.participants / t.maxParticipants) * 100}%`, background: 'linear-gradient(90deg,#C7A66A,#A07840)', borderRadius: '3px', boxShadow: '0 0 8px rgba(199,166,106,0.4)' }} />
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: t.registrationOpen ? 'rgba(199,166,106,0.06)' : 'rgba(0,0,0,0.03)', border: `1px solid ${t.registrationOpen ? 'rgba(199,166,106,0.2)' : 'rgba(0,0,0,0.05)'}`, borderRadius: '12px', fontSize: '14px', color: t.registrationOpen ? '#C7A66A' : 'rgba(0,0,0,0.35)', fontWeight: 600 }}>
                  {t.registrationOpen ? '✅ ثبت‌نام باز است' : '🔒 ثبت‌نام بسته است'}
                </div>
              </div>

              {/* Stats */}
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '3px', height: '14px', background: 'linear-gradient(180deg,#ef4444,transparent)', borderRadius: '2px', display: 'inline-block' }} />
                  آمار مسابقه
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'بالاترین بریک',  v: toFa(t.stats.highestBreak),  c: '#f59e0b' },
                    { label: 'میانگین بریک',   v: toFa(t.stats.avgBreak),      c: '#06b6d4' },
                    { label: 'مسابقات انجام‌شده', v: toFa(t.stats.completedMatches), c: '#C7A66A' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.42)' }}>{s.label}</span>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: s.c, letterSpacing: '-0.01em' }}>{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}