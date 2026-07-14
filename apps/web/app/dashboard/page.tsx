'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';
import { getCoachProfiles } from '../../lib/coach-store';
import {
  Calendar, Trophy, Bell, Settings,
  Award, Clock, MapPin,
  CheckCircle, Circle, ArrowLeft, BarChart2, Users,
  ShoppingBag, Play, Plus, Shield, ShieldCheck,
  ClipboardList,
} from 'lucide-react';
import { SAMPLE_TOURNAMENTS } from '../../lib/mock-tournaments';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import AuthGuard from '../../components/AuthGuard';

/* ══ types ══ */
interface Booking { id: string; club: string; table: string; date: string; time: string; status: 'confirmed' | 'pending' | 'completed'; price: number; }
interface Notif { id: string; type: 'booking' | 'tournament' | 'achievement' | 'system'; msg: string; time: string; read: boolean; }
interface MyReg { id: string; tournamentId: string; tournamentName: string; status: 'pending' | 'approved' | 'rejected'; registeredAt: string; }

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


function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

/* ── radial progress ── */
function Ring({ value, size = 64, stroke = 5, color = '#C7A66A', label }: { value: number; size?: number; stroke?: number; color?: string; label?: boolean; }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${color}80)`, transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      {label && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color, lineHeight: 1 }}>{toFa(value)}٪</div>
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
  const [myRegs, setMyRegs] = useState<MyReg[]>([]);
  const [myClub, setMyClub] = useState<{ id: string; name: string; city: string } | null>(null);
  const [clubLoading, setClubLoading] = useState(false);
  const [hasCoachProfile, setHasCoachProfile] = useState(false);
  const rafRef = useRef<number>(0);
  const unread = notifications.filter(n => !n.read).length;

  const upcomingTournament = SAMPLE_TOURNAMENTS.find(
    t => t.status === 'registration_open' || t.status === 'upcoming'
  ) ?? SAMPLE_TOURNAMENTS[0]!;

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'صبح بخیر' : h < 18 ? 'عصر بخیر' : 'شب بخیر');
  }, []);

  useEffect(() => {
    if (!user?.phone) return;
    const collected: MyReg[] = [];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('tournament-regs-')) keys.push(k);
    }
    for (const key of keys) {
      const tId = key.replace('tournament-regs-', '');
      try {
        const list = JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{ id: string; status: string; registeredAt: string; phone?: string; }>;
        // deduplicate: keep only one entry per phone (the last one saved)
        const seen = new Map<string, typeof list[0]>();
        for (const reg of list) {
          seen.set(reg.phone ?? '', reg);
        }
        const deduped = Array.from(seen.values());
        if (deduped.length !== list.length) {
          localStorage.setItem(key, JSON.stringify(deduped));
        }
        const t = SAMPLE_TOURNAMENTS.find(x => x.id === tId);
        for (const reg of deduped) {
          if (reg.phone !== user.phone) continue;
          collected.push({ id: reg.id, tournamentId: tId, tournamentName: t?.name ?? tId, status: reg.status as MyReg['status'], registeredAt: reg.registeredAt });
        }
      } catch {}
    }
    setMyRegs(collected);
  }, [user?.phone]);

  useEffect(() => {
    if (user?.primaryRole === 'admin') { router.replace('/admin'); }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    const roles = [user.primaryRole, ...(user.secondaryRoles ?? [])];
    if (!roles.includes('club_owner')) return;
    setClubLoading(true);
    api.get('/clubs/my-clubs')
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setMyClub(list.length > 0 ? list[0] : null);
      })
      .catch(() => setMyClub(null))
      .finally(() => setClubLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user?.phone) { setHasCoachProfile(false); return; }
    setHasCoachProfile(Object.values(getCoachProfiles()).some(p => p.ownerPhone === user.phone));
  }, [user?.phone]);

  useEffect(() => {
    const fn = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  if (!user) return null;
  if (user.primaryRole === 'admin') return null;
  const isBasicUser = user.primaryRole === 'user' && (user.secondaryRoles ?? []).length === 0;
  const userRoles = [user.primaryRole, ...(user.secondaryRoles ?? [])];
  const isClubOwner = userRoles.includes('club_owner');
  const isPlayer    = userRoles.includes('player');
  const isCoach     = userRoles.includes('coach');
  const isReferee   = userRoles.includes('referee');

  return (
    <AuthGuard>
    
    <>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pulse    { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(12px);}to{opacity:1;transform:translateX(0);} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 8px rgba(199,166,106,0.25);}50%{box-shadow:0 0 20px rgba(199,166,106,0.45);} }

        .dash-card {
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 20px;
          padding: 22px;
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .dash-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.10);
          border-color: rgba(0,0,0,0.10);
        }
        .card-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(0,0,0,0.35); margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .card-label span { width:3px; height:12px; border-radius:2px; display:inline-block; flex-shrink:0; }

        .quick-action {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 18px 12px;
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.22,1,0.36,1);
          text-decoration: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .quick-action:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.10);
          border-color: rgba(199,166,106,0.30);
        }

        .booking-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px;
          background: #F7F7F5;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 14px;
          transition: all 0.25s;
        }
        .booking-row:hover { background: #F3F2EF; border-color: rgba(0,0,0,0.09); }

        .match-pill {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: #F7F7F5;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 12px;
          transition: all 0.2s;
        }
        .match-pill:hover { background: #F3F2EF; }

        .notif-panel {
          position: fixed; top: 70px; left: clamp(12px,4vw,40px);
          width: min(360px, calc(100vw - 24px));
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.10);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08);
          backdrop-filter: blur(20px);
          z-index: 500;
          animation: slideIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
          overflow: hidden;
        }

        .stat-card {
          padding: 20px;
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 18px;
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
          position: relative; overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.10);
          border-color: rgba(0,0,0,0.10);
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

      <div style={{ minHeight: '100vh', background: '#F7F7F5', paddingBottom: '80px' }}>

        {/* ══════════ DASHBOARD HEADER ══════════ */}
        <div style={{ background: 'rgba(247,247,245,0.97)', borderBottom: '1px solid rgba(0,0,0,0.07)', padding: '0 clamp(16px,4vw,40px)', position: 'sticky', top: '62px', zIndex: 90, backdropFilter: 'blur(24px)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

            {/* Left — greeting */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(199,166,106,0.30)' }}>
                {user.firstName?.[0] ?? 'U'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.40)', marginBottom: '1px' }}>{greeting}،</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#111111', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.firstName} {user.lastName}</div>
              </div>
            </div>

            {/* Right — actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setNotifOpen(p => !p)} style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '10px', background: notifOpen ? 'rgba(199,166,106,0.10)' : 'rgba(0,0,0,0.04)', border: `1px solid ${notifOpen ? 'rgba(199,166,106,0.30)' : 'rgba(0,0,0,0.08)'}`, cursor: 'pointer', color: notifOpen ? '#C7A66A' : 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  <Bell size={16} />
                  {unread > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', border: '1.5px solid #F7F7F5', boxShadow: '0 0 6px #ef4444', animation: 'pulse 2s infinite' }} />}
                </button>

                {/* Notification panel */}
                {notifOpen && (
                  <div className="notif-panel">
                    <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#111111' }}>اعلان‌ها</div>
                      {unread > 0 && <span style={{ fontSize: '12px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', padding: '2px 9px', fontWeight: 700 }}>{toFa(unread)} جدید</span>}
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px' }}>
                      {notifications.map((n, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', background: n.read ? 'transparent' : 'rgba(199,166,106,0.06)', marginBottom: '4px', cursor: 'pointer', transition: 'background 0.2s' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: { booking: 'rgba(199,166,106,0.10)', tournament: 'rgba(245,158,11,0.1)', achievement: 'rgba(167,139,250,0.1)', system: 'rgba(0,0,0,0.04)' }[n.type], border: `1px solid ${{ 'booking': 'rgba(199,166,106,0.20)', 'tournament': 'rgba(245,158,11,0.2)', 'achievement': 'rgba(167,139,250,0.2)', 'system': 'rgba(0,0,0,0.07)' }[n.type]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {{ 'booking': <Calendar size={14} style={{ color: '#C7A66A' }} />, 'tournament': <Trophy size={14} style={{ color: '#f59e0b' }} />, 'achievement': <Award size={14} style={{ color: '#a78bfa' }} />, 'system': <Shield size={14} style={{ color: 'rgba(0,0,0,0.42)' }} /> }[n.type]}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', color: n.read ? 'rgba(0,0,0,0.45)' : '#111111', fontWeight: n.read ? 400 : 600, lineHeight: 1.5, marginBottom: '3px' }}>{n.msg}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.30)' }}>{n.time}</div>
                          </div>
                          {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C7A66A', flexShrink: 0, marginTop: '6px', boxShadow: '0 0 6px rgba(199,166,106,0.60)' }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/profile" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', textDecoration: 'none' }}>
                <Settings size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════ MAIN CONTENT ══════════ */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* ── هشدار انتخاب نقش ── */}
          {isBasicUser && (
            <div style={{ marginBottom: '28px', padding: '28px 24px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center', animation: 'fadeUp 0.5s ease both' }}>
              <ShieldCheck size={32} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#111111', marginBottom: '8px' }}>
                  برای دسترسی کامل به تمام امکانات سایت، نقش خود را تعیین کنید
                </div>
                <div style={{ fontSize: '15px', color: 'rgba(0,0,0,0.42)', lineHeight: 1.7 }}>
                  باشگاه‌دار، بازیکن، مربی یا سایر نقش‌ها را انتخاب کنید
                </div>
              </div>
              <Link href="/profile/role" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 28px', background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.08))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', color: '#f59e0b', fontSize: '16px', fontWeight: 700, textDecoration: 'none' }}>
                انتخاب نقش ←
              </Link>
            </div>
          )}

          {/* ── Role Action Cards ── */}
          {!isBasicUser && (
            <div style={{ marginBottom: '28px', animation: 'fadeUp 0.5s ease both 0.1s', animationFillMode: 'both' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.18em', marginBottom: '12px' }}>
                نقش‌های شما
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>

                {/* Club Owner Card */}
                {isClubOwner && !clubLoading && (
                  myClub ? (
                    <Link href="/dashboard/club" style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: '20px', borderRadius: '18px', cursor: 'pointer',
                        background: 'linear-gradient(135deg, rgba(199,166,106,0.12), rgba(199,166,106,0.04))',
                        border: '1.5px solid rgba(199,166,106,0.35)',
                        transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)',
                        boxShadow: '0 2px 12px rgba(199,166,106,0.10)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(199,166,106,0.15)', border: '1px solid rgba(199,166,106,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🏢</div>
                          <span style={{ fontSize: '10px', background: 'rgba(48,197,90,0.12)', color: '#166534', border: '1px solid rgba(48,197,90,0.25)', borderRadius: '20px', padding: '3px 9px', fontWeight: 700 }}>فعال</span>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A18', marginBottom: '4px' }}>مدیریت باشگاه</div>
                        <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)', marginBottom: '16px' }}>{myClub.name} — {myClub.city}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#C7A66A', fontWeight: 700 }}>
                          ورود به پنل <span style={{ fontSize: '16px' }}>←</span>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Link href="/clubs/new" style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: '20px', borderRadius: '18px', cursor: 'pointer',
                        background: 'linear-gradient(135deg, rgba(199,166,106,0.08), rgba(199,166,106,0.02))',
                        border: '1.5px dashed rgba(199,166,106,0.40)',
                        transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(199,166,106,0.10)', border: '1px dashed rgba(199,166,106,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🏢</div>
                          <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.10)', color: '#92600A', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', padding: '3px 9px', fontWeight: 700 }}>ثبت نشده</span>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A18', marginBottom: '4px' }}>ایجاد باشگاه</div>
                        <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)', marginBottom: '16px', lineHeight: 1.6 }}>
                          باشگاه خود را ثبت کنید و پنل مدیریت را فعال کنید
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#C7A66A', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                          + ایجاد باشگاه
                        </div>
                      </div>
                    </Link>
                  )
                )}

                {/* Player Card */}
                {isPlayer && (
                  <Link href="/profile/setup?role=player" style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '20px', borderRadius: '18px', cursor: 'pointer',
                      background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(6,182,212,0.02))',
                      border: '1.5px solid rgba(6,182,212,0.25)',
                      transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)',
                    }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(6,182,212,0.10)', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '14px' }}>🎱</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A18', marginBottom: '4px' }}>پروفایل بازیکن</div>
                      <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)', marginBottom: '16px', lineHeight: 1.6 }}>
                        اطلاعات بازیکنی خود را تکمیل کنید و در رنکینگ ملی قرار بگیرید
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#0891b2', fontWeight: 700 }}>
                        تکمیل پروفایل <span style={{ fontSize: '16px' }}>←</span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Coach Card */}
                {isCoach && (
                  <Link href="/dashboard/coach" style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '20px', borderRadius: '18px', cursor: 'pointer',
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(167,139,250,0.02))',
                      border: '1.5px solid rgba(167,139,250,0.25)',
                      transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)',
                    }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '14px' }}>👨‍🏫</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A18', marginBottom: '4px' }}>پروفایل مربی</div>
                      <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)', marginBottom: '16px', lineHeight: 1.6 }}>
                        {hasCoachProfile ? 'پروفایل مربیگری شما ساخته شده است — می‌توانید ویرایش کنید' : 'پروفایل مربیگری خود را بسازید و شاگردان را به خود جذب کنید'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#7c3aed', fontWeight: 700 }}>
                        {hasCoachProfile ? 'ویرایش پروفایل' : 'ساخت پروفایل'} <span style={{ fontSize: '16px' }}>←</span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Referee Card */}
                {isReferee && (
                  <Link href="/referees/dashboard" style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '20px', borderRadius: '18px', cursor: 'pointer',
                      background: 'linear-gradient(135deg, rgba(8,145,178,0.08), rgba(8,145,178,0.02))',
                      border: '1.5px solid rgba(8,145,178,0.25)',
                      transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)',
                    }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(8,145,178,0.10)', border: '1px solid rgba(8,145,178,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '14px' }}>🧑‍⚖️</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A18', marginBottom: '4px' }}>پنل داور رسمی</div>
                      <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)', marginBottom: '16px', lineHeight: 1.6 }}>
                        مدیریت مسابقات و برنامه داوری، و انتشار استوری در صفحه‌ی اول
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#0891b2', fontWeight: 700 }}>
                        ورود به پنل <span style={{ fontSize: '16px' }}>←</span>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Add / manage roles */}
                <Link href="/profile/role" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '20px', borderRadius: '18px', cursor: 'pointer', background: 'rgba(0,0,0,0.015)', border: '1.5px dashed rgba(0,0,0,0.14)', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.28s cubic-bezier(0.22,1,0.36,1)' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(0,0,0,0.04)', border: '1px dashed rgba(0,0,0,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '14px' }}>➕</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A18', marginBottom: '4px' }}>افزودن نقش جدید</div>
                    <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)', marginBottom: '16px', lineHeight: 1.6 }}>نقش دیگری (مثلاً تولیدکننده، فروشنده، داور) به حساب خود اضافه کنید</div>
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#111111', fontWeight: 700 }}>مدیریت نقش‌ها <span style={{ fontSize: '16px' }}>←</span></div>
                  </div>
                </Link>

              </div>
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
                    <span style={{ background: 'linear-gradient(135deg,#C7A66A,#A07840)' }} />
                    دسترسی سریع
                  </div>
                  <div className="actions-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px' }}>
                    {[
                      { href: '/clubs', icon: <MapPin size={20} />, label: 'رزرو میز', color: '#C7A66A' },
                      { href: '/tournaments', icon: <Trophy size={20} />, label: 'مسابقات', color: '#f59e0b' },
                      { href: '/shop', icon: <ShoppingBag size={20} />, label: 'فروشگاه', color: '#a78bfa' },
                      { href: '/players', icon: <Users size={20} />, label: 'بازیکنان', color: '#06b6d4' },
                      { href: '/rankings', icon: <BarChart2 size={20} />, label: 'رنکینگ', color: '#ef4444' },
                    ].map((a, i) => (
                      <Link key={i} href={a.href} className="quick-action">
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `${a.color}12`, border: `1px solid ${a.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>
                          {a.icon}
                        </div>
                        <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.50)', fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>{a.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Registration Status */}
              {myRegs.length > 0 && (
                <ScrollReveal>
                  <div className="dash-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                      <div className="card-label" style={{ margin: 0 }}>
                        <span style={{ width: '3px', height: '12px', background: 'linear-gradient(135deg,#f59e0b,#C7A66A)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                        وضعیت ثبت‌نام مسابقات
                      </div>
                      <ClipboardList size={14} style={{ color: '#f59e0b', opacity: 0.7 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {myRegs.map(reg => {
                        const statusCfg = {
                          pending:  { label: 'در انتظار تأیید', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
                          approved: { label: 'تأیید شده',      color: '#30C55A', bg: 'rgba(48,197,90,0.08)',  border: 'rgba(48,197,90,0.22)'  },
                          rejected: { label: 'رد شده',         color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.22)'  },
                        }[reg.status];
                        return (
                          <div key={reg.id} className="booking-row">
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🏆</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.tournamentName}</div>
                              <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.38)' }}>{reg.registeredAt}</div>
                            </div>
                            <div style={{ fontSize: '12px', color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, borderRadius: '20px', padding: '4px 12px', fontWeight: 700, flexShrink: 0 }}>
                              {statusCfg.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollReveal>
              )}

              {/* Upcoming Bookings */}
              <ScrollReveal>
                <div className="dash-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div className="card-label" style={{ margin: 0 }}>
                      <span style={{ width: '3px', height: '12px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                      رزروهای شما
                    </div>
                    <Link href="/booking" style={{ fontSize: '14px', color: '#C7A66A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7, transition: 'opacity 0.2s' }}>
                      همه <ArrowLeft size={12} />
                    </Link>
                  </div>

                  {bookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(0,0,0,0.35)', fontSize: '16px' }}>
                      <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                      رزروی ندارید
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {bookings.map((b, i) => {
                        const statusConfig = {
                          confirmed: { color: '#C7A66A', label: 'تأیید شده', bg: 'rgba(199,166,106,0.10)', border: 'rgba(199,166,106,0.20)' },
                          pending: { color: '#f59e0b', label: 'در انتظار', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
                          completed: { color: 'rgba(0,0,0,0.40)', label: 'انجام شده', bg: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.06)' },
                        }[b.status];
                        return (
                          <div key={i} className="booking-row">
                            {/* Icon */}
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🎱</div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111111', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.club}</div>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '13px', color: 'rgba(0,0,0,0.42)', flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={9} /> {b.time}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={9} /> {b.date}</span>
                                <span>{b.table}</span>
                              </div>
                            </div>

                            {/* Status + price */}
                            <div style={{ textAlign: 'left', flexShrink: 0 }}>
                              <div style={{ fontSize: '10px', color: statusConfig.color, background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, borderRadius: '20px', padding: '3px 10px', fontWeight: 700, marginBottom: '4px', textAlign: 'center', letterSpacing: '0.04em' }}>
                                {statusConfig.label}
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(0,0,0,0.45)', textAlign: 'left' }}>
                                {toFa(b.price.toLocaleString())} ت
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add booking CTA */}
                  <Link href="/clubs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '14px', padding: '12px', background: 'rgba(199,166,106,0.06)', border: '1px dashed rgba(199,166,106,0.20)', borderRadius: '12px', color: '#A07840', fontSize: '15px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(199,166,106,0.12)'; (e.currentTarget as HTMLElement).style.color = '#A07840'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(199,166,106,0.06)'; (e.currentTarget as HTMLElement).style.color = '#A07840'; }}>
                    <Plus size={14} /> رزرو جدید
                  </Link>
                </div>
              </ScrollReveal>

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '130px' }}>

              {/* Upcoming tournament — synced with SAMPLE_TOURNAMENTS */}
              <ScrollReveal>
                <div className="dash-card" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <div className="card-label">
                    <span style={{ background: 'linear-gradient(180deg,#f59e0b,#ef4444)' }} />
                    مسابقه پیش رو
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🏆</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{upcomingTournament.name}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)' }}>{upcomingTournament.date} · {upcomingTournament.clubName}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                    <span style={{ color: 'rgba(0,0,0,0.42)' }}>جایزه</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '13px', maxWidth: '60%', textAlign: 'left' }}>{(upcomingTournament.prizeInfo.split('|')[0] ?? '').trim()}</span>
                  </div>
                  <Link href={`/tournaments/${upcomingTournament.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', color: '#f59e0b', fontSize: '15px', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
                    <Play size={13} /> مشاهده مسابقه
                  </Link>
                </div>
              </ScrollReveal>

              {/* Profile completion */}
              <ScrollReveal>
                <div className="dash-card">
                  <div className="card-label">
                    <span style={{ background: 'linear-gradient(135deg,#C7A66A,#A07840)' }} />
                    تکمیل پروفایل
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <Ring value={72} size={52} stroke={5} color="#06b6d4" label />
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: '#111111', marginBottom: '4px' }}>۷۲٪ تکمیل شده</div>
                      <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.42)', lineHeight: 1.5 }}>پروفایل کامل‌تر = رتبه بهتر</div>
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
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: r.done ? '#111111' : 'rgba(0,0,0,0.40)' }}>
                        {r.done
                          ? <CheckCircle size={14} style={{ color: '#C7A66A', flexShrink: 0 }} />
                          : <Circle size={14} style={{ color: 'rgba(0,0,0,0.25)', flexShrink: 0 }} />
                        }
                        {r.label}
                      </div>
                    ))}
                  </div>
                  <Link href="/profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '14px', padding: '10px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', color: '#06b6d4', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
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