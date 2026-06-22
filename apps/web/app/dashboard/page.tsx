'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';
import {
  Calendar, Trophy, TrendingUp, Bell, Settings, ChevronRight,
  Target, Activity, Award, Clock, MapPin, Zap, Star,
  CheckCircle, Circle, ArrowLeft, BarChart2, Users,
  ShoppingBag, Play, Plus, Shield, ChevronUp, ChevronDown,
} from 'lucide-react';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import AuthGuard from '../../components/AuthGuard';

/* ══ types ══ */
interface Booking { id: string; club: string; table: string; date: string; time: string; status: 'confirmed' | 'pending' | 'completed'; price: number; }
interface Notif { id: string; type: 'booking' | 'tournament' | 'achievement' | 'system'; msg: string; time: string; read: boolean; }
interface QuickStat { label: string; value: string; sub: string; color: string; icon: React.ReactNode; trend?: number; }

/* ══ sample data ══ */
const bookings: Booking[] = [
  { id: 'b1', club: 'باشگاه سنچوری تهران', table: 'میز VIP ۱', date: '۱۴۰۴/۰۳/۲۰', time: '۱۸:۰۰–۲۰:۰۰', status: 'confirmed', price: 700000 },
  { id: 'b2', club: 'باشگاه المپیک مشهد', table: 'میز اسنوکر ۳', date: '۱۴۰۴/۰۳/۲۲', time: '۱۴:۰۰–۱۶:۰۰', status: 'pending', price: 360000 },
  { id: 'b3', club: 'باشگاه پیروزی اصفهان', table: 'میز پاکت ۲', date: '۱۴۰۴/۰۳/۱۰', time: '۱۰:۰۰–۱۲:۰۰', status: 'completed', price: 300000 },
];

const notifications: Notif[] = [
  { id: 'n1', type: 'booking', msg: 'رزرو شما در باشگاه سنچوری تأیید شد', time: '۲ دقیقه پیش', read: false },
  { id: 'n2', type: 'tournament', msg: 'ثبت‌نام مسابقات لیگ برتر تا فردا باز است', time: '۱ ساعت پیش', read: false },
  { id: 'n3', type: 'achievement', msg: 'مدال ۵۰ مسابقه را دریافت کردید!', time: '۳ ساعت پیش', read: true },
  { id: 'n4', type: 'system', msg: 'پروفایل شما توسط فدراسیون تأیید شد', time: 'دیروز', read: true },
];

const achievements = [
  { icon: '🏆', title: 'قهرمان منطقه', desc: 'اولین قهرمانی', color: '#f59e0b', earned: true },
  { icon: '🎯', title: '۵۰ مسابقه', desc: 'پنجاهمین مسابقه', color: '#10b981', earned: true },
  { icon: '⭐', title: 'بازیکن ماه', desc: 'بهترین ماه', color: '#a78bfa', earned: true },
  { icon: '🔥', title: '۱۰ پیروزی پشت‌سرهم', desc: 'ده پیروزی متوالی', color: '#ef4444', earned: false },
  { icon: '💎', title: 'نخبه', desc: 'رنک زیر ۱۰', color: '#06b6d4', earned: false },
  { icon: '🚀', title: 'صعود سریع', desc: '۱۰ رنک در یک ماه', color: '#f59e0b', earned: false },
];

const recentMatches = [
  { opp: 'رضا کریمی', result: 'W', score: '6-2', date: '۱۴۰۴/۰۳/۱۵', tournament: 'لیگ برتر' },
  { opp: 'نیما موسوی', result: 'W', score: '6-4', date: '۱۴۰۴/۰۳/۱۲', tournament: 'لیگ برتر' },
  { opp: 'علی احمدی', result: 'L', score: '3-6', date: '۱۴۰۴/۰۳/۰۸', tournament: 'جام تهران' },
  { opp: 'کاوه رستمی', result: 'W', score: '6-3', date: '۱۴۰۴/۰۳/۰۵', tournament: 'لیگ برتر' },
];

const weeklyActivity = [
  { day: 'ش', sessions: 2, wins: 2, losses: 0 },
  { day: 'ی', sessions: 0, wins: 0, losses: 0 },
  { day: 'د', sessions: 3, wins: 2, losses: 1 },
  { day: 'س', sessions: 1, wins: 1, losses: 0 },
  { day: 'چ', sessions: 2, wins: 1, losses: 1 },
  { day: 'پ', sessions: 4, wins: 3, losses: 1 },
  { day: 'ج', sessions: 1, wins: 1, losses: 0 },
];

const quickStats: QuickStat[] = [
  { label: 'رنک ملی', value: '#۳', sub: '↑۲ این ماه', color: '#f59e0b', icon: <TrendingUp size={16} />, trend: 2 },
  { label: 'نرخ پیروزی', value: '۷۴٪', sub: 'از ۲۸۴ مسابقه', color: '#10b981', icon: <Target size={16} />, trend: 3 },
  { label: 'امتیاز کل', value: '۸,۴۲۰', sub: '+۴۵۰ این ماه', color: '#a78bfa', icon: <Zap size={16} />, trend: 12 },
  { label: 'رزروهای فعال', value: '۲', sub: 'هفته جاری', color: '#06b6d4', icon: <Calendar size={16} />, trend: 0 },
];

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

/* ── mini heatmap bar ── */
function ActivityBar({ sessions, max }: { sessions: number; max: number }) {
  const h = max > 0 ? Math.max(4, (sessions / max) * 44) : 4;
  return (
    <div style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', height: `${h}px`, borderRadius: '3px', background: sessions > 0 ? `rgba(16,185,129,${0.3 + (sessions / max) * 0.7})` : 'rgba(255,255,255,0.05)', boxShadow: sessions > 0 ? `0 0 8px rgba(16,185,129,${(sessions / max) * 0.5})` : 'none', transition: 'height 0.6s ease' }} />
    </div>
  );
}

/* ── radial progress ── */
function Ring({ value, size = 64, stroke = 5, color = '#10b981', label }: { value: number; size?: number; stroke?: number; color?: string; label?: boolean; }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${color}80)`, transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      {label && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 900, color, lineHeight: 1 }}>{toFa(value)}٪</div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [greeting, setGreeting] = useState('');
  const rafRef = useRef<number>(0);
  const unread = notifications.filter(n => !n.read).length;
  const maxAct = Math.max(...weeklyActivity.map(d => d.sessions));

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'صبح بخیر' : h < 18 ? 'عصر بخیر' : 'شب بخیر');
  }, []);

  useEffect(() => {
    const fn = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  if (!user) return null;
  const isBasicUser = user.primaryRole === 'user';

  return (
    <AuthGuard>
    
    <>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pulse    { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(12px);}to{opacity:1;transform:translateX(0);} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 8px rgba(16,185,129,0.3);}50%{box-shadow:0 0 20px rgba(16,185,129,0.6);} }

        .dash-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 22px;
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .dash-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.12);
        }
        .card-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(240,250,245,0.3); margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .card-label span { width:3px; height:12px; border-radius:2px; display:inline-block; flex-shrink:0; }

        .quick-action {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 18px 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        .quick-action:hover {
          background: rgba(255,255,255,0.06);
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.4);
        }

        .booking-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          transition: all 0.25s;
        }
        .booking-row:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.09); }

        .match-pill {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          transition: all 0.2s;
        }
        .match-pill:hover { background: rgba(255,255,255,0.04); }

        .notif-panel {
          position: fixed; top: 70px; left: clamp(12px,4vw,40px);
          width: min(360px, calc(100vw - 24px));
          background: rgba(6,13,10,0.98);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.05);
          backdrop-filter: blur(32px);
          z-index: 500;
          animation: slideIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
          overflow: hidden;
        }

        .stat-card {
          padding: 20px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
          position: relative; overflow: hidden;
        }
        .stat-card:hover {
          background: rgba(255,255,255,0.045);
          transform: translateY(-5px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        @media(max-width:900px) {
          .dash-grid    { grid-template-columns: 1fr !important; }
          .stats-row    { grid-template-columns: repeat(2,1fr) !important; }
          .actions-row  { grid-template-columns: repeat(3,1fr) !important; }
        }
        @media(max-width:480px) {
          .stats-row    { grid-template-columns: repeat(2,1fr) !important; }
          .actions-row  { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      {/* ══ Role activation banner ══ */}
      {user.primaryRole === 'user' && (
        <div style={{ background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)', padding: '10px clamp(16px,4vw,40px)', direction: 'rtl' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
            <span style={{ fontSize: '13px', color: 'rgba(245,158,11,0.9)', flex: 1, minWidth: '200px' }}>
              سطح کاربری شما تعیین نشده است. برای استفاده کامل از امکانات، نقش حرفه‌ای خود را فعال کنید.
            </span>
            <a href="/profile/role" style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '6px 14px', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
              فعال‌سازی نقش
            </a>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#020806 0%,#060d0a 60%,#050c08 100%)', paddingBottom: '80px' }}>

        {/* ══════════ DASHBOARD HEADER ══════════ */}
        <div style={{ background: 'rgba(2,8,6,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 clamp(16px,4vw,40px)', position: 'sticky', top: '62px', zIndex: 90, backdropFilter: 'blur(24px)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

            {/* Left — greeting */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                {user.firstName?.[0] ?? 'U'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.35)', marginBottom: '1px' }}>{greeting}،</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.firstName} {user.lastName}</div>
              </div>
            </div>

            {/* Right — actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setNotifOpen(p => !p)} style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '10px', background: notifOpen ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${notifOpen ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', color: notifOpen ? '#10b981' : 'rgba(240,250,245,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  <Bell size={16} />
                  {unread > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', border: '1.5px solid rgba(2,8,6,0.98)', boxShadow: '0 0 6px #ef4444', animation: 'pulse 2s infinite' }} />}
                </button>

                {/* Notification panel */}
                {notifOpen && (
                  <div className="notif-panel">
                    <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#f0faf5' }}>اعلان‌ها</div>
                      {unread > 0 && <span style={{ fontSize: '10px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', padding: '2px 9px', fontWeight: 700 }}>{toFa(unread)} جدید</span>}
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px' }}>
                      {notifications.map((n, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', background: n.read ? 'transparent' : 'rgba(16,185,129,0.04)', marginBottom: '4px', cursor: 'pointer', transition: 'background 0.2s' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: { booking: 'rgba(16,185,129,0.1)', tournament: 'rgba(245,158,11,0.1)', achievement: 'rgba(167,139,250,0.1)', system: 'rgba(255,255,255,0.05)' }[n.type], border: `1px solid ${{ 'booking': 'rgba(16,185,129,0.2)', 'tournament': 'rgba(245,158,11,0.2)', 'achievement': 'rgba(167,139,250,0.2)', 'system': 'rgba(255,255,255,0.07)' }[n.type]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {{ 'booking': <Calendar size={14} style={{ color: '#10b981' }} />, 'tournament': <Trophy size={14} style={{ color: '#f59e0b' }} />, 'achievement': <Award size={14} style={{ color: '#a78bfa' }} />, 'system': <Shield size={14} style={{ color: 'rgba(240,250,245,0.4)' }} /> }[n.type]}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', color: n.read ? 'rgba(240,250,245,0.55)' : '#f0faf5', fontWeight: n.read ? 400 : 600, lineHeight: 1.5, marginBottom: '3px' }}>{n.msg}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.25)' }}>{n.time}</div>
                          </div>
                          {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', flexShrink: 0, marginTop: '6px', boxShadow: '0 0 6px #10b981' }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/profile" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', color: 'rgba(240,250,245,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', textDecoration: 'none' }}>
                <Settings size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════ MAIN CONTENT ══════════ */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* ── Quick Stats ── */}
          {isBasicUser ? (
            <div style={{ marginBottom: '28px', padding: '28px 24px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center', animation: 'fadeUp 0.5s ease both' }}>
              <div style={{ fontSize: '36px' }}>📊</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f0faf5', marginBottom: '8px' }}>
                  برای مشاهده آمار و رنکینگ، ابتدا نقش حرفه‌ای خود را فعال کنید
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(240,250,245,0.4)', lineHeight: 1.7 }}>
                  با فعال‌سازی نقش به آمار کامل، رنکینگ ملی و تاریخچه مسابقات دسترسی خواهید داشت
                </div>
              </div>
              <Link href="/profile/role" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 28px', background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.08))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', color: '#10b981', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
                فعال‌سازی نقش ←
              </Link>
            </div>
          ) : (
            <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '28px' }}>
              {quickStats.map((s, i) => (
                <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.08}s`, animation: 'fadeUp 0.5s ease both' }}>
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60px', height: '1px', background: `linear-gradient(90deg,transparent,${s.color}50,transparent)` }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}12`, border: `1px solid ${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                      {s.icon}
                    </div>
                    {s.trend !== undefined && s.trend !== 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: s.trend > 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                        {s.trend > 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {toFa(Math.abs(s.trend))}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: '#f0faf5', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '6px', textShadow: `0 0 24px ${s.color}30` }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(240,250,245,0.5)', fontWeight: 600, marginBottom: '3px' }}>{s.label}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.25)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Main Grid ── */}
          <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

            {/* ── LEFT COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Quick Actions */}
              <ScrollReveal>
                <div className="dash-card">
                  <div className="card-label">
                    <span style={{ background: 'linear-gradient(180deg,#10b981,#06b6d4)' }} />
                    دسترسی سریع
                  </div>
                  <div className="actions-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px' }}>
                    {[
                      { href: '/clubs', icon: <MapPin size={20} />, label: 'رزرو میز', color: '#10b981' },
                      { href: '/events', icon: <Trophy size={20} />, label: 'مسابقات', color: '#f59e0b' },
                      { href: '/shop', icon: <ShoppingBag size={20} />, label: 'فروشگاه', color: '#a78bfa' },
                      { href: '/players', icon: <Users size={20} />, label: 'بازیکنان', color: '#06b6d4' },
                      { href: '/rankings', icon: <BarChart2 size={20} />, label: 'رنکینگ', color: '#ef4444' },
                    ].map((a, i) => (
                      <Link key={i} href={a.href} className="quick-action">
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `${a.color}12`, border: `1px solid ${a.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>
                          {a.icon}
                        </div>
                        <span style={{ fontSize: '11px', color: 'rgba(240,250,245,0.55)', fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>{a.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Upcoming Bookings */}
              <ScrollReveal>
                <div className="dash-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div className="card-label" style={{ margin: 0 }}>
                      <span style={{ width: '3px', height: '12px', background: 'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                      رزروهای شما
                    </div>
                    <Link href="/booking" style={{ fontSize: '12px', color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7, transition: 'opacity 0.2s' }}>
                      همه <ArrowLeft size={12} />
                    </Link>
                  </div>

                  {bookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(240,250,245,0.3)', fontSize: '14px' }}>
                      <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                      رزروی ندارید
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {bookings.map((b, i) => {
                        const statusConfig = {
                          confirmed: { color: '#10b981', label: 'تأیید شده', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
                          pending: { color: '#f59e0b', label: 'در انتظار', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
                          completed: { color: '#94a3b8', label: 'انجام شده', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)' },
                        }[b.status];
                        return (
                          <div key={i} className="booking-row">
                            {/* Icon */}
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🎱</div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0faf5', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.club}</div>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'rgba(240,250,245,0.4)', flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={9} /> {b.time}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={9} /> {b.date}</span>
                                <span>{b.table}</span>
                              </div>
                            </div>

                            {/* Status + price */}
                            <div style={{ textAlign: 'left', flexShrink: 0 }}>
                              <div style={{ fontSize: '9px', color: statusConfig.color, background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, borderRadius: '20px', padding: '3px 10px', fontWeight: 700, marginBottom: '4px', textAlign: 'center', letterSpacing: '0.04em' }}>
                                {statusConfig.label}
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(240,250,245,0.5)', textAlign: 'left' }}>
                                {toFa(b.price.toLocaleString())} ت
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add booking CTA */}
                  <Link href="/clubs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '14px', padding: '12px', background: 'rgba(16,185,129,0.06)', border: '1px dashed rgba(16,185,129,0.2)', borderRadius: '12px', color: 'rgba(16,185,129,0.6)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)'; (e.currentTarget as HTMLElement).style.color = '#10b981'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(16,185,129,0.6)'; }}>
                    <Plus size={14} /> رزرو جدید
                  </Link>
                </div>
              </ScrollReveal>

              {/* Weekly Activity */}
              {!isBasicUser && <ScrollReveal>
                <div className="dash-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div className="card-label" style={{ margin: 0 }}>
                      <span style={{ width: '3px', height: '12px', background: 'linear-gradient(180deg,#a78bfa,#06b6d4)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                      فعالیت هفتگی
                    </div>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'rgba(240,250,245,0.3)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(16,185,129,0.6)', display: 'inline-block' }} />جلسات</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    {weeklyActivity.map((d, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <ActivityBar sessions={d.sessions} max={maxAct} />
                        <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.3)', letterSpacing: '0.03em' }}>{d.day}</div>
                      </div>
                    ))}
                  </div>

                  {/* Weekly summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {[
                      { v: toFa(weeklyActivity.reduce((a, d) => a + d.sessions, 0)), l: 'جلسه', c: '#06b6d4' },
                      { v: toFa(weeklyActivity.reduce((a, d) => a + d.wins, 0)), l: 'پیروزی', c: '#10b981' },
                      { v: toFa(weeklyActivity.reduce((a, d) => a + d.losses, 0)), l: 'شکست', c: '#ef4444' },
                    ].map((s, i) => (
                      <div key={i} style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: s.c, letterSpacing: '-0.02em' }}>{s.v}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.3)', marginTop: '3px' }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>}

              {/* Recent Matches */}
              {!isBasicUser && <ScrollReveal>
                <div className="dash-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div className="card-label" style={{ margin: 0 }}>
                      <span style={{ width: '3px', height: '12px', background: 'linear-gradient(180deg,#f59e0b,#ef4444)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                      آخرین مسابقات
                    </div>
                    <Link href="/players/1" style={{ fontSize: '12px', color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
                      پروفایل <ArrowLeft size={12} />
                    </Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recentMatches.map((m, i) => (
                      <div key={i} className="match-pill">
                        {/* W/L */}
                        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: m.result === 'W' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', border: `1px solid ${m.result === 'W' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: m.result === 'W' ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                          {m.result}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0faf5', marginBottom: '2px' }}>{m.opp}</div>
                          <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.3)' }}>{m.tournament} · {m.date}</div>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: m.result === 'W' ? '#10b981' : 'rgba(240,250,245,0.4)', letterSpacing: '-0.01em', flexShrink: 0, textShadow: m.result === 'W' ? '0 0 12px rgba(16,185,129,0.4)' : 'none' }}>
                          {m.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>}
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '130px' }}>

              {/* Player rank card */}
              {!isBasicUser && <ScrollReveal>
                <div className="dash-card" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)', boxShadow: '0 0 14px rgba(245,158,11,0.3)' }} />

                  <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(245,158,11,0.6)', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '10px' }}>NATIONAL RANK</div>
                    <div style={{ fontSize: '52px', fontWeight: 900, color: '#f59e0b', lineHeight: 1, letterSpacing: '-0.04em', textShadow: '0 0 40px rgba(245,158,11,0.4)', marginBottom: '4px' }}>
                      #۳
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: '#10b981', fontSize: '12px', fontWeight: 700 }}>
                      <ChevronUp size={14} /> ۲ رتبه این ماه
                    </div>
                  </div>

                  {/* Rings */}
                  <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {[
                      { v: 74, color: '#10b981', label: 'Win Rate' },
                      { v: 88, color: '#06b6d4', label: 'Consistency' },
                      { v: 92, color: '#a78bfa', label: 'Technique' },
                    ].map((r, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <Ring value={r.v} size={56} stroke={5} color={r.color} label />
                        <div style={{ fontSize: '9px', color: 'rgba(240,250,245,0.3)', letterSpacing: '0.06em' }}>{r.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>}

              {/* Achievements */}
              {!isBasicUser && <ScrollReveal>
                <div className="dash-card">
                  <div className="card-label">
                    <span style={{ background: 'linear-gradient(180deg,#a78bfa,#f59e0b)' }} />
                    افتخارات
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                    {achievements.map((a, i) => (
                      <div key={i} style={{ textAlign: 'center', padding: '12px 6px', background: a.earned ? `${a.color}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${a.earned ? `${a.color}20` : 'rgba(255,255,255,0.04)'}`, borderRadius: '14px', opacity: a.earned ? 1 : 0.4, transition: 'all 0.3s', cursor: 'default', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ fontSize: '24px', marginBottom: '6px', filter: a.earned ? `drop-shadow(0 0 8px ${a.color}60)` : 'grayscale(1)', transition: 'filter 0.3s' }}>{a.icon}</div>
                        <div style={{ fontSize: '9px', color: a.earned ? a.color : 'rgba(240,250,245,0.3)', fontWeight: 700, lineHeight: 1.3 }}>{a.title}</div>
                        {!a.earned && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,8,6,0.4)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: '14px', opacity: 0.4 }}>🔒</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>}

              {/* Upcoming tournament */}
              <ScrollReveal>
                <div className="dash-card" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <div className="card-label">
                    <span style={{ background: 'linear-gradient(180deg,#f59e0b,#ef4444)' }} />
                    مسابقه پیش رو
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🏆</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0faf5', marginBottom: '3px' }}>لیگ برتر اسنوکر</div>
                      <div style={{ fontSize: '11px', color: 'rgba(240,250,245,0.4)' }}>۱۵ خرداد ۱۴۰۴</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
                    <span style={{ color: 'rgba(240,250,245,0.4)' }}>جایزه</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>۵۰ میلیون تومان</span>
                  </div>
                  <Link href="/events/1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', color: '#f59e0b', fontSize: '13px', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
                    <Play size={13} /> مشاهده مسابقه
                  </Link>
                </div>
              </ScrollReveal>

              {/* Profile completion */}
              <ScrollReveal>
                <div className="dash-card">
                  <div className="card-label">
                    <span style={{ background: 'linear-gradient(180deg,#06b6d4,#10b981)' }} />
                    تکمیل پروفایل
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <Ring value={72} size={52} stroke={5} color="#06b6d4" label />
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', marginBottom: '4px' }}>۷۲٪ تکمیل شده</div>
                      <div style={{ fontSize: '12px', color: 'rgba(240,250,245,0.4)', lineHeight: 1.5 }}>پروفایل کامل‌تر = رتبه بهتر</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { label: 'اطلاعات پایه', done: true },
                      { label: 'تصویر پروفایل', done: true },
                      { label: 'سابقه مسابقات', done: true },
                      { label: 'ویدیوی هایلایت', done: false },
                      { label: 'تأیید فدراسیون', done: false },
                    ].map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: r.done ? 'rgba(240,250,245,0.55)' : 'rgba(240,250,245,0.25)' }}>
                        {r.done
                          ? <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                          : <Circle size={14} style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                        }
                        {r.label}
                      </div>
                    ))}
                  </div>
                  <Link href="/profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '14px', padding: '10px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', color: '#06b6d4', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                    تکمیل پروفایل ←
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </>

    </AuthGuard>
  );
}