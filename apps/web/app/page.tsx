'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Trophy, Users, Calendar, Star,
  ChevronDown, Play, Zap, Shield, TrendingUp,
  MapPin, Clock, Activity,
} from 'lucide-react';

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

/* ── Floating Crystal Panel ── */
function CrystalPanel({
  children, style, className = '',
  depth = 1,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  depth?: 1 | 2 | 3;
}) {
  const fills  = ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.38)'];
  const specs  = ['rgba(255,255,255,0.96)', 'rgba(255,255,255,0.88)', 'rgba(255,255,255,0.75)'];
  const blurs  = ['blur(28px)', 'blur(20px)', 'blur(14px)'];
  const shadows = [
    '0 2px 1px rgba(255,255,255,0.92) inset, 0 -1px 1px rgba(0,40,12,0.08) inset, 0 12px 40px rgba(0,40,12,0.12), 0 4px 12px rgba(0,40,12,0.08)',
    '0 1px 1px rgba(255,255,255,0.85) inset, 0 -1px 1px rgba(0,40,12,0.06) inset, 0 8px 28px rgba(0,40,12,0.10), 0 2px 8px rgba(0,40,12,0.07)',
    '0 1px 1px rgba(255,255,255,0.75) inset, 0 5px 18px rgba(0,40,12,0.08), 0 1px 4px rgba(0,40,12,0.05)',
  ];
  const i = depth - 1;

  return (
    <div className={className} style={{
      background: fills[i],
      border: `1px solid rgba(255,255,255,${depth===1?0.75:depth===2?0.60:0.48})`,
      borderTopColor: specs[i],
      borderBottomColor: `rgba(180,215,185,${depth===1?0.22:0.15})`,
      backdropFilter: blurs[i],
      WebkitBackdropFilter: blurs[i],
      boxShadow: shadows[i],
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      {/* Specular top edge */}
      <div style={{
        position: 'absolute', top: 0, left: '8%', right: '8%',
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${specs[i]} 35%, rgba(255,255,255,1.0) 50%, ${specs[i]} 65%, transparent)`,
        pointerEvents: 'none', zIndex: 2,
      }}/>
      {/* Inner diagonal sheen */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(145deg, rgba(255,255,255,${depth===1?0.38:depth===2?0.26:0.16}) 0%, rgba(255,255,255,0.05) 40%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 1,
        borderRadius: 'inherit',
      }}/>
      <div style={{ position: 'relative', zIndex: 3 }}>{children}</div>
    </div>
  );
}

/* ── Stat Crystal ── */
function StatCrystal({ value, label, icon, color, delay = 0 }: {
  value: string; label: string; icon: React.ReactNode; color: string; delay?: number;
}) {
  return (
    <CrystalPanel depth={2} style={{
      borderRadius: '20px',
      padding: '18px 20px',
      display: 'flex', alignItems: 'center', gap: '14px',
      animation: `floatIn 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
      transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
      cursor: 'default',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '13px',
        background: `linear-gradient(145deg, ${color}20, ${color}10)`,
        border: `1px solid ${color}30`,
        borderTopColor: `${color}45`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
        boxShadow: `0 1px 1px rgba(255,255,255,0.70) inset, 0 4px 12px ${color}20`,
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: '22px', fontWeight: 900, color: '#0a1a0f',
          letterSpacing: '-0.03em', lineHeight: 1,
          marginBottom: '3px',
        }}>{value}</div>
        <div style={{ fontSize: '11px', color: 'rgba(10,26,15,0.50)', fontWeight: 500 }}>{label}</div>
      </div>
    </CrystalPanel>
  );
}

/* ── Match Preview Crystal ── */
function MatchCrystal({ delay = 0 }: { delay?: number }) {
  const [score1, setScore1] = useState(4);
  const [score2, setScore2] = useState(3);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <CrystalPanel depth={1} style={{
      borderRadius: '24px',
      padding: '20px 22px',
      animation: `floatIn 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
    }}>
      {/* Live indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(220,38,38,0.10)',
          border: '1px solid rgba(252,165,165,0.40)',
          borderTopColor: 'rgba(255,255,255,0.70)',
          borderRadius: '99px',
          padding: '4px 11px',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#dc2626',
            boxShadow: '0 0 0 2px rgba(220,38,38,0.20), 0 0 8px rgba(220,38,38,0.45)',
            display: 'inline-block',
            animation: 'livePulse 1.8s ease-in-out infinite',
          }}/>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#b91c1c', letterSpacing: '0.10em' }}>LIVE</span>
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(10,26,15,0.45)', fontWeight: 500 }}>نیمه‌نهایی · میز ۱</span>
      </div>

      {/* Players + Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0a1a0f', marginBottom: '2px' }}>رضایی</div>
          <div style={{ fontSize: '10px', color: 'rgba(10,26,15,0.42)' }}>رنک #۳</div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.55)',
          border: '1px solid rgba(255,255,255,0.75)',
          borderTopColor: 'rgba(255,255,255,0.95)',
          borderRadius: '14px',
          boxShadow: '0 1px 1px rgba(255,255,255,0.85) inset, 0 3px 10px rgba(0,40,12,0.07)',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: '26px', fontWeight: 900, color: '#16a34a',
            letterSpacing: '-0.03em',
            textShadow: '0 0 16px rgba(22,163,74,0.30)',
            transition: 'all 0.3s',
          }}>{toFa(score1)}</span>
          <span style={{ fontSize: '14px', color: 'rgba(10,26,15,0.25)', fontWeight: 700 }}>:</span>
          <span style={{
            fontSize: '26px', fontWeight: 900, color: '#0a1a0f',
            letterSpacing: '-0.03em',
          }}>{toFa(score2)}</span>
        </div>

        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0a1a0f', marginBottom: '2px' }}>موسوی</div>
          <div style={{ fontSize: '10px', color: 'rgba(10,26,15,0.42)' }}>رنک #۱</div>
        </div>
      </div>

      {/* Frame progress */}
      <div style={{ marginTop: '14px' }}>
        <div style={{ display: 'flex', gap: '3px' }}>
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: i < score1 ? '#16a34a'
                : i >= 11 - score2 ? '#0ea5e9'
                : 'rgba(0,40,12,0.08)',
              boxShadow: i < score1 ? '0 0 6px rgba(22,163,74,0.45)'
                : i >= 11 - score2 ? '0 0 6px rgba(14,165,233,0.35)' : 'none',
              transition: 'all 0.4s',
            }}/>
          ))}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: '7px', fontSize: '10px', color: 'rgba(10,26,15,0.38)',
        }}>
          <span>فریم {toFa(score1 + score2)} از ۱۱</span>
          <span>لیگ برتر ۱۴۰۴</span>
        </div>
      </div>
    </CrystalPanel>
  );
}

/* ── Booking Crystal ── */
function BookingCrystal({ delay = 0 }: { delay?: number }) {
  return (
    <CrystalPanel depth={2} style={{
      borderRadius: '20px',
      padding: '16px 18px',
      animation: `floatIn 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
    }}>
      <div style={{
        fontSize: '10px', fontWeight: 700, color: 'rgba(10,26,15,0.40)',
        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '10px',
      }}>رزرو آنلاین</div>
      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0a1a0f', marginBottom: '4px' }}>باشگاه سنچوری</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <span style={{
          fontSize: '11px', color: '#15803d',
          background: 'rgba(22,163,74,0.10)',
          border: '1px solid rgba(22,163,74,0.22)',
          borderTopColor: 'rgba(255,255,255,0.60)',
          borderRadius: '99px', padding: '3px 9px', fontWeight: 600,
          backdropFilter: 'blur(6px)',
        }}>۳ میز خالی</span>
        <span style={{ fontSize: '11px', color: 'rgba(10,26,15,0.45)' }}>امروز · ۱۸:۰۰</span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px',
        background: 'rgba(22,163,74,0.08)',
        border: '1px solid rgba(22,163,74,0.20)',
        borderTopColor: 'rgba(255,255,255,0.65)',
        borderRadius: '12px',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>۱۸۰,۰۰۰ تومان/ساعت</span>
        <div style={{
          width: '28px', height: '28px', borderRadius: '9px',
          background: 'linear-gradient(180deg,#22c55e,#16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 0 rgba(255,255,255,0.20) inset, 0 3px 8px rgba(22,163,74,0.30)',
        }}>
          <ArrowLeft size={14} style={{ color: '#fff' }}/>
        </div>
      </div>
    </CrystalPanel>
  );
}

/* ── Coach Crystal ── */
function CoachCrystal({ delay = 0 }: { delay?: number }) {
  return (
    <CrystalPanel depth={2} style={{
      borderRadius: '20px', padding: '16px 18px',
      animation: `floatIn 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '13px',
          background: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 900, color: '#fff', flexShrink: 0,
          boxShadow: '0 1px 0 rgba(255,255,255,0.20) inset, 0 4px 14px rgba(124,58,237,0.30)',
        }}>ک</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0a1a0f' }}>کاوه نوری</div>
          <div style={{ fontSize: '10px', color: 'rgba(10,26,15,0.45)', marginTop: '1px' }}>مربی ارشد اسنوکر</div>
        </div>
        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }}/>
          ))}
        </div>
      </div>
    </CrystalPanel>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fn = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(rafRef.current); };
  }, []);

  const parallaxSlow = mounted ? scrollY * 0.25 : 0;
  const parallaxMed  = mounted ? scrollY * 0.45 : 0;
  const fadeHero     = mounted ? Math.max(0, 1 - scrollY / 500) : 1;

  return (
    <>
      <style>{`
        @keyframes floatIn {
          from { opacity:0; transform:translateY(24px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes breathe {
          0%,100% { transform:translateY(0) scale(1); }
          50%     { transform:translateY(-8px) scale(1.012); }
        }
        @keyframes breatheSlow {
          0%,100% { transform:translateY(0) rotate(0deg); }
          50%     { transform:translateY(-12px) rotate(1.5deg); }
        }
        @keyframes orbDrift {
          0%,100% { transform:translate(0,0) scale(1); }
          33%     { transform:translate(32px,-24px) scale(1.08); }
          66%     { transform:translate(-20px,16px) scale(0.95); }
        }
        @keyframes shimmerPanel {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }
        @keyframes livePulse {
          0%,100% { opacity:1; box-shadow:0 0 0 2px rgba(220,38,38,0.22),0 0 6px rgba(220,38,38,0.35); }
          50%     { opacity:0.55; box-shadow:0 0 0 5px rgba(220,38,38,0.08),0 0 14px rgba(220,38,38,0.25); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes countUp {
          from { opacity:0; transform:scale(0.85) translateY(6px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        .hero-cta-primary {
          display:inline-flex; align-items:center; gap:10px;
          padding:15px 32px; border-radius:16px; border:none;
          background:linear-gradient(180deg,#22c55e 0%,#16a34a 55%,#15803d 100%);
          color:#fff; font-size:15px; font-weight:800;
          font-family:inherit; cursor:pointer; text-decoration:none;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.22) inset,
            0 -1px 0 rgba(0,80,24,0.18) inset,
            0 6px 20px rgba(22,163,74,0.38),
            0 2px 6px rgba(22,163,74,0.22);
          transition:all 0.28s cubic-bezier(0.22,1,0.36,1);
          letter-spacing:-0.01em;
        }
        .hero-cta-primary:hover {
          transform:translateY(-2px);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.28) inset,
            0 10px 28px rgba(22,163,74,0.45),
            0 4px 10px rgba(22,163,74,0.28);
        }
        .hero-cta-glass {
          display:inline-flex; align-items:center; gap:9px;
          padding:14px 26px; border-radius:16px;
          background:rgba(255,255,255,0.58);
          border:1px solid rgba(255,255,255,0.78);
          border-top-color:rgba(255,255,255,0.95);
          border-bottom-color:rgba(180,215,185,0.22);
          color:rgba(10,26,15,0.80); font-size:15px; font-weight:700;
          font-family:inherit; cursor:pointer; text-decoration:none;
          backdropFilter:blur(16px);
          box-shadow:
            0 1px 1px rgba(255,255,255,0.88) inset,
            0 -1px 1px rgba(0,40,12,0.05) inset,
            0 4px 16px rgba(0,40,12,0.08);
          transition:all 0.28s cubic-bezier(0.22,1,0.36,1);
          letter-spacing:-0.01em;
        }
        .hero-cta-glass:hover {
          background:rgba(255,255,255,0.75);
          transform:translateY(-2px);
          box-shadow:
            0 1px 1px rgba(255,255,255,0.92) inset,
            0 8px 24px rgba(0,40,12,0.10);
        }
        .section-card {
          background:
            linear-gradient(145deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 45%, rgba(200,230,205,0.05) 100%),
            rgba(255,255,255,0.58);
          border:1px solid rgba(255,255,255,0.72);
          border-top-color:rgba(255,255,255,0.95);
          border-bottom-color:rgba(180,210,185,0.22);
          backdrop-filter:blur(24px);
          -webkit-backdrop-filter:blur(24px);
          border-radius:24px;
          box-shadow:
            0 2px 1px rgba(255,255,255,0.88) inset,
            0 -1px 1px rgba(0,40,12,0.06) inset,
            0 8px 32px rgba(0,40,12,0.10),
            0 2px 6px rgba(0,40,12,0.07);
          position:relative; overflow:hidden;
          transition:all 0.38s cubic-bezier(0.22,1,0.36,1);
        }
        .section-card::after {
          content:'';
          position:absolute; top:0; left:8%; right:8%; height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.98) 40%,rgba(255,255,255,1) 50%,rgba(255,255,255,0.98) 60%,transparent);
          pointer-events:none;
        }
        .section-card:hover {
          transform:translateY(-5px) scale(1.005);
          box-shadow:
            0 2px 1px rgba(255,255,255,0.92) inset,
            0 20px 56px rgba(0,40,12,0.13),
            0 6px 18px rgba(0,40,12,0.09);
        }
        @media(max-width:900px) {
          .hero-panels { display:none !important; }
          .hero-content { max-width:100% !important; }
        }
        @media(max-width:640px) {
          .stats-row { grid-template-columns:repeat(2,1fr) !important; }
          .features-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh' }}>

        {/* ══════════════════════════════════════════
            HERO — SPATIAL LIQUID GLASS COMPOSITION
        ══════════════════════════════════════════ */}
        <section style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          paddingTop: '62px',
        }}>

          {/* ── Layer 0: Atmospheric background ── */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: `
              radial-gradient(ellipse 120% 70% at 50% -5%,
                rgba(210,240,215,0.95) 0%,
                rgba(185,225,195,0.75) 30%,
                rgba(160,210,175,0.50) 55%,
                transparent 75%),
              radial-gradient(ellipse 70% 90% at -5% 50%,
                rgba(200,235,210,0.60) 0%,
                transparent 55%),
              radial-gradient(ellipse 60% 70% at 105% 60%,
                rgba(185,228,218,0.45) 0%,
                transparent 50%),
              radial-gradient(ellipse 80% 50% at 50% 110%,
                rgba(160,210,180,0.55) 0%,
                transparent 55%)
            `,
          }}/>

          {/* ── Layer 1: Ambient light orbs ── */}
          <div style={{
            position: 'absolute', zIndex: 1,
            width: '55vw', height: '55vw', maxWidth: '700px', maxHeight: '700px',
            top: '-15%', left: '-8%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(22,163,74,0.14) 0%, transparent 65%)',
            filter: 'blur(48px)',
            animation: 'orbDrift 18s ease-in-out infinite',
            pointerEvents: 'none',
          }}/>
          <div style={{
            position: 'absolute', zIndex: 1,
            width: '45vw', height: '45vw', maxWidth: '580px', maxHeight: '580px',
            bottom: '-10%', right: '-5%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(6,182,212,0.10) 0%, transparent 65%)',
            filter: 'blur(56px)',
            animation: 'orbDrift 24s ease-in-out infinite reverse',
            pointerEvents: 'none',
          }}/>
          <div style={{
            position: 'absolute', zIndex: 1,
            width: '35vw', height: '35vw', maxWidth: '420px', maxHeight: '420px',
            top: '30%', right: '15%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(167,139,250,0.08) 0%, transparent 65%)',
            filter: 'blur(40px)',
            animation: 'orbDrift 20s ease-in-out 4s infinite',
            pointerEvents: 'none',
          }}/>

          {/* ── Layer 2: Background hero image (blurred/tinted) ── */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            backgroundImage: 'url(/images/billiadr-club-1.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.06,
            filter: 'blur(8px) saturate(0.3)',
            transform: `translateY(${parallaxSlow}px)`,
          }}/>

          {/* ── Layer 3: Main layout ── */}
          <div style={{
            position: 'relative', zIndex: 10,
            maxWidth: '1320px', margin: '0 auto',
            padding: '60px clamp(16px,4vw,48px) 80px',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 480px',
            gap: '60px',
            alignItems: 'center',
          }}>

            {/* ── LEFT: Main content ── */}
            <div className="hero-content">

              {/* Label pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                marginBottom: '24px',
                background: 'rgba(255,255,255,0.60)',
                border: '1px solid rgba(255,255,255,0.78)',
                borderTopColor: 'rgba(255,255,255,0.95)',
                borderRadius: '99px',
                padding: '7px 16px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 1px 1px rgba(255,255,255,0.85) inset, 0 2px 12px rgba(0,40,12,0.07)',
                animation: 'floatIn 0.6s cubic-bezier(0.22,1,0.36,1) both',
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#16a34a',
                  boxShadow: '0 0 0 2px rgba(22,163,74,0.22), 0 0 8px rgba(22,163,74,0.40)',
                  display: 'inline-block',
                  animation: 'livePulse 2.5s ease-in-out infinite',
                }}/>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#15803d',
                  letterSpacing: '0.14em',
                }}>BILLIARD PLUS PLATFORM</span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontSize: 'clamp(38px,6.5vw,76px)',
                fontWeight: 900,
                color: '#0a1a0f',
                letterSpacing: '-0.045em',
                lineHeight: 1.0,
                marginBottom: '20px',
                animation: 'floatIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both',
              }}>
                اکوسیستم<br/>
                <span style={{
                  background: 'linear-gradient(135deg, #16a34a 0%, #0d9488 55%, #0891b2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 20px rgba(22,163,74,0.20))',
                }}>تخصصی بیلیارد</span><br/>
                ایران
              </h1>

              {/* Subtitle */}
              <p style={{
                fontSize: 'clamp(15px,2vw,18px)',
                color: 'rgba(10,26,15,0.58)',
                lineHeight: 1.75,
                marginBottom: '36px',
                maxWidth: '480px',
                animation: 'floatIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.18s both',
              }}>
                رزرو میز، مسابقات حرفه‌ای، مربیان برتر، و فروشگاه تخصصی —
                همه در یک پلتفرم جامع.
              </p>

              {/* CTAs */}
              <div style={{
                display: 'flex', gap: '12px', flexWrap: 'wrap',
                marginBottom: '48px',
                animation: 'floatIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both',
              }}>
                <Link href="/clubs" className="hero-cta-primary">
                  رزرو میز <ArrowLeft size={16}/>
                </Link>
                <Link href="/events" className="hero-cta-glass">
                  <Trophy size={16} style={{ color: '#f59e0b' }}/> مسابقات
                </Link>
                <Link href="/live" className="hero-cta-glass">
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: '#dc2626',
                    boxShadow: '0 0 0 2px rgba(220,38,38,0.22)',
                    display: 'inline-block',
                    animation: 'livePulse 1.8s infinite',
                  }}/>
                  زنده
                </Link>
              </div>

              {/* Stats row */}
              <div className="stats-row" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4,1fr)',
                gap: '10px',
                animation: 'floatIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.32s both',
              }}>
                {[
                  { v:'۱,۲۰۰+', l:'بازیکن',     c:'#16a34a' },
                  { v:'۸۵+',    l:'باشگاه',      c:'#0891b2' },
                  { v:'۴۸',     l:'تورنومنت',    c:'#7c3aed' },
                  { v:'۹۲٪',   l:'رضایت',       c:'#f59e0b' },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '14px 12px',
                    background: 'rgba(255,255,255,0.52)',
                    border: '1px solid rgba(255,255,255,0.70)',
                    borderTopColor: 'rgba(255,255,255,0.92)',
                    borderRadius: '16px',
                    textAlign: 'center',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 1px 1px rgba(255,255,255,0.85) inset, 0 3px 12px rgba(0,40,12,0.07)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: '15%', right: '15%',
                      height: '1px',
                      background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)',
                    }}/>
                    <div style={{
                      fontSize: '22px', fontWeight: 900, color: s.c,
                      letterSpacing: '-0.025em', marginBottom: '3px',
                      filter: `drop-shadow(0 0 8px ${s.c}30)`,
                    }}>{s.v}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(10,26,15,0.45)', fontWeight: 500 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Floating Crystal Panels ── */}
            <div className="hero-panels" style={{
              position: 'relative',
              height: '580px',
              opacity: fadeHero,
              transform: `translateY(${-parallaxMed * 0.3}px)`,
            }}>

              {/* Panel 1 — Live Match (dominant, slightly left) */}
              <div style={{
                position: 'absolute',
                top: '0', right: '20px',
                width: '300px',
                animation: 'breathe 7s ease-in-out infinite',
              }}>
                <MatchCrystal delay={0.3}/>
              </div>

              {/* Panel 2 — Stats cluster (top-left, overlapping) */}
              <div style={{
                position: 'absolute',
                top: '40px', left: '0',
                width: '200px',
                animation: 'breatheSlow 9s ease-in-out 1s infinite',
              }}>
                <StatCrystal value="۸,۴۲۰" label="امتیاز ملی" icon={<Zap size={18}/>} color="#f59e0b" delay={0.4}/>
              </div>

              {/* Panel 3 — Booking (mid, offset right) */}
              <div style={{
                position: 'absolute',
                top: '185px', right: '0',
                width: '270px',
                animation: 'breathe 8s ease-in-out 2s infinite',
              }}>
                <BookingCrystal delay={0.5}/>
              </div>

              {/* Panel 4 — Ranking badge (mid-left) */}
              <div style={{
                position: 'absolute',
                top: '220px', left: '10px',
                animation: 'breatheSlow 10s ease-in-out 0.5s infinite',
              }}>
                <CrystalPanel depth={2} style={{
                  borderRadius: '18px',
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  animation: 'floatIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.55s both',
                  width: '190px',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: 900, color: '#fff', flexShrink: 0,
                    boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 12px rgba(245,158,11,0.35)',
                  }}>🏆</div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(10,26,15,0.40)', marginBottom: '2px' }}>رنک ملی</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      #<span style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.40))' }}>۳</span>
                    </div>
                  </div>
                </CrystalPanel>
              </div>

              {/* Panel 5 — Coach (bottom-right) */}
              <div style={{
                position: 'absolute',
                bottom: '90px', right: '10px',
                width: '260px',
                animation: 'breathe 11s ease-in-out 3s infinite',
              }}>
                <CoachCrystal delay={0.6}/>
              </div>

              {/* Panel 6 — Win rate ring (bottom-left) */}
              <div style={{
                position: 'absolute',
                bottom: '80px', left: '20px',
                animation: 'breatheSlow 8.5s ease-in-out 1.5s infinite',
              }}>
                <CrystalPanel depth={3} style={{
                  borderRadius: '18px',
                  padding: '14px 16px',
                  animation: 'floatIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.65s both',
                  width: '175px',
                }}>
                  <div style={{ fontSize: '10px', color: 'rgba(10,26,15,0.38)', fontWeight: 600, marginBottom: '8px' }}>نرخ پیروزی</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: '#16a34a', letterSpacing: '-0.04em', filter: 'drop-shadow(0 0 10px rgba(22,163,74,0.28))' }}>۷۴</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(22,163,74,0.70)' }}>٪</span>
                  </div>
                  <div style={{ marginTop: '8px', height: '4px', borderRadius: '99px', background: 'rgba(0,40,12,0.07)', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,40,12,0.06) inset' }}>
                    <div style={{ height: '100%', width: '74%', background: 'linear-gradient(90deg,#22c55e,#16a34a)', borderRadius: '99px', boxShadow: '0 0 8px rgba(22,163,74,0.40), 0 1px 0 rgba(255,255,255,0.30) inset' }}/>
                  </div>
                </CrystalPanel>
              </div>

              {/* Panel 7 — Activity indicator (bottom-center) */}
              <div style={{
                position: 'absolute',
                bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                animation: 'breathe 7.5s ease-in-out 2.5s infinite',
              }}>
                <CrystalPanel depth={2} style={{
                  borderRadius: '99px',
                  padding: '10px 18px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  animation: 'floatIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.7s both',
                  whiteSpace: 'nowrap',
                }}>
                  <Activity size={14} style={{ color: '#16a34a' }}/>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0a1a0f' }}>۱۲ مسابقه زنده</span>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#dc2626',
                    boxShadow: '0 0 0 2px rgba(220,38,38,0.20)',
                    animation: 'livePulse 1.8s infinite',
                    display: 'inline-block',
                  }}/>
                </CrystalPanel>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{
            position: 'absolute', bottom: '24px', left: '50%',
            transform: 'translateX(-50%)', zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            opacity: Math.max(0, 1 - scrollY / 120),
            transition: 'opacity 0.3s',
          }}>
            <div style={{
              padding: '7px 16px',
              background: 'rgba(255,255,255,0.52)',
              border: '1px solid rgba(255,255,255,0.70)',
              borderTopColor: 'rgba(255,255,255,0.90)',
              borderRadius: '99px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 1px 1px rgba(255,255,255,0.80) inset, 0 3px 10px rgba(0,40,12,0.07)',
              fontSize: '11px', color: 'rgba(10,26,15,0.45)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <ChevronDown size={13} style={{ animation: 'breathe 2s ease-in-out infinite' }}/>
              اسکرول کنید
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FEATURES SECTION
        ══════════════════════════════════════════ */}
        <section style={{
          padding: 'clamp(64px,8vw,96px) clamp(16px,4vw,48px)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid rgba(255,255,255,0.60)',
            borderBottom: '1px solid rgba(255,255,255,0.45)',
          }}/>

          <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

            {/* Section header */}
            <div style={{ textAlign: 'center', marginBottom: '52px', animation: 'fadeUp 0.6s ease both' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.75)',
                borderTopColor: 'rgba(255,255,255,0.94)', borderRadius: '99px',
                padding: '6px 16px', marginBottom: '18px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 1px 1px rgba(255,255,255,0.82) inset, 0 2px 10px rgba(0,40,12,0.07)',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803d', letterSpacing: '0.20em' }}>ECOSYSTEM</span>
              </div>
              <h2 style={{
                fontSize: 'clamp(28px,4.5vw,46px)', fontWeight: 900,
                color: '#0a1a0f', letterSpacing: '-0.035em', lineHeight: 1.1,
              }}>
                همه چیز در یک پلتفرم
              </h2>
            </div>

            {/* Feature cards */}
            <div className="features-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              gap: '18px',
            }}>
              {[
                { icon:'🎱', title:'رزرو آنلاین میز', desc:'رزرو لحظه‌ای میزهای اسنوکر، پاکت، و VIP از بهترین باشگاه‌های ایران با تقویم جلالی.', color:'#16a34a', href:'/clubs' },
                { icon:'🏆', title:'مسابقات رسمی', desc:'ثبت‌نام آنلاین در تورنومنت‌های فدراسیون، پیگیری نتایج زنده، و جدول حذفی.', color:'#f59e0b', href:'/events' },
                { icon:'⭐', title:'مربیان تأیید‌شده', desc:'اتصال با مربیان دارای گواهی فدراسیون برای جلسات خصوصی و آنلاین.', color:'#a78bfa', href:'/coaches' },
                { icon:'📊', title:'رنکینگ ملی', desc:'سیستم امتیازدهی حرفه‌ای مبتنی بر مسابقات، با جدول زنده و تاریخچه کامل.', color:'#0891b2', href:'/rankings' },
                { icon:'🛒', title:'فروشگاه تخصصی', desc:'جدیدترین تجهیزات از برندهای PREDATOR، ARAMITH، RILEY، و ویراکا.', color:'#dc2626', href:'/shop' },
                { icon:'🔧', title:'خدمات فنی', desc:'متخصصان نصب و کلاث‌کشی تأیید‌شده در سراسر ایران.', color:'#059669', href:'/services' },
              ].map((f, i) => (
                <Link key={i} href={f.href} style={{ textDecoration: 'none' }}>
                  <div className="section-card" style={{
                    padding: '26px 24px',
                    cursor: 'pointer',
                    animation: `floatIn 0.6s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.07}s both`,
                  }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '15px',
                      background: `rgba(255,255,255,0.65)`,
                      border: `1px solid ${f.color}25`,
                      borderTopColor: 'rgba(255,255,255,0.92)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '24px', marginBottom: '16px',
                      boxShadow: `0 1px 1px rgba(255,255,255,0.85) inset, 0 4px 14px ${f.color}18`,
                    }}>{f.icon}</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0a1a0f', marginBottom: '8px', letterSpacing: '-0.015em' }}>
                      {f.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'rgba(10,26,15,0.52)', lineHeight: 1.7, margin: 0 }}>
                      {f.desc}
                    </p>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      marginTop: '16px', fontSize: '12px', fontWeight: 700, color: f.color,
                    }}>
                      بیشتر <ArrowLeft size={12}/>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            LIVE SECTION (dark specialty)
        ══════════════════════════════════════════ */}
        <section style={{
          padding: 'clamp(64px,8vw,96px) clamp(16px,4vw,48px)',
          background: '#060f09',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Dark atmospheric orbs */}
          <div style={{ position:'absolute', top:'-20%', right:'-5%', width:'50vw', height:'50vw', maxWidth:'500px', borderRadius:'50%', background:'radial-gradient(rgba(22,163,74,0.09),transparent 65%)', filter:'blur(48px)', animation:'orbDrift 18s ease-in-out infinite', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:'-15%', left:'-5%', width:'40vw', height:'40vw', maxWidth:'400px', borderRadius:'50%', background:'radial-gradient(rgba(6,182,212,0.07),transparent 65%)', filter:'blur(40px)', animation:'orbDrift 22s ease-in-out reverse infinite', pointerEvents:'none' }}/>

          <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'36px', flexWrap:'wrap', gap:'16px' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                  <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#dc2626', boxShadow:'0 0 0 2px rgba(220,38,38,0.22), 0 0 10px rgba(220,38,38,0.45)', display:'inline-block', animation:'livePulse 1.8s infinite' }}/>
                  <span style={{ fontSize:'10px', fontWeight:700, color:'#dc2626', letterSpacing:'0.18em' }}>LIVE NOW</span>
                </div>
                <h2 style={{ fontSize:'clamp(24px,4vw,38px)', fontWeight:900, color:'#f0faf5', letterSpacing:'-0.03em', margin:0 }}>مسابقات زنده</h2>
              </div>
              <Link href="/live" style={{
                display:'flex', alignItems:'center', gap:'8px',
                padding:'10px 20px', borderRadius:'12px',
                background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(255,255,255,0.10)',
                borderTopColor:'rgba(255,255,255,0.14)',
                color:'rgba(240,250,244,0.75)',
                fontSize:'13px', fontWeight:700, textDecoration:'none',
                backdropFilter:'blur(12px)',
                transition:'all 0.22s',
              }}>
                مشاهده همه <ArrowLeft size={13}/>
              </Link>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'14px' }}>
              {[
                { p1:'رضایی', p2:'موسوی', s1:4, s2:3, round:'نیمه‌نهایی', table:'میز ۱', c1:'#16a34a', c2:'#0891b2' },
                { p1:'حسینی', p2:'کریمی', s1:2, s2:2, round:'نیمه‌نهایی', table:'میز ۲', c1:'#a78bfa', c2:'#f59e0b' },
                { p1:'نوری',  p2:'رستمی', s1:0, s2:0, round:'ربع‌نهایی', table:'میز ۳', c1:'#06b6d4', c2:'#ef4444' },
              ].map((m, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.045)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderTopColor: 'rgba(255,255,255,0.13)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  padding: '18px 20px',
                  position: 'relative', overflow: 'hidden',
                  animation: `floatIn 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s both`,
                }}>
                  {/* Live bar */}
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent,#dc2626 30%,#dc2626 70%,transparent)', boxShadow:'0 0 12px rgba(220,38,38,0.55)', animation:'livePulse 2.5s ease-in-out infinite' }}/>
                  {/* Inner sheen */}
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)', marginTop:'2px' }}/>

                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#dc2626', animation:'livePulse 1.8s infinite', display:'inline-block' }}/>
                    <span style={{ fontSize:'10px', color:'rgba(240,250,244,0.45)', fontWeight:600 }}>{m.round} · {m.table}</span>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'15px', fontWeight:800, color:'rgba(240,250,244,0.90)' }}>{m.p1}</div>
                    </div>
                    <div style={{
                      display:'flex', alignItems:'center', gap:'7px',
                      padding:'8px 14px',
                      background:'rgba(255,255,255,0.07)',
                      border:'1px solid rgba(255,255,255,0.10)',
                      borderTopColor:'rgba(255,255,255,0.15)',
                      borderRadius:'12px',
                      backdropFilter:'blur(8px)',
                      flexShrink:0,
                    }}>
                      <span style={{ fontSize:'22px', fontWeight:900, color:m.c1, letterSpacing:'-0.03em', filter:`drop-shadow(0 0 10px ${m.c1}50)` }}>{toFa(m.s1)}</span>
                      <span style={{ fontSize:'12px', color:'rgba(240,250,244,0.25)', fontWeight:700 }}>:</span>
                      <span style={{ fontSize:'22px', fontWeight:900, color:m.c2, letterSpacing:'-0.03em', filter:`drop-shadow(0 0 10px ${m.c2}50)` }}>{toFa(m.s2)}</span>
                    </div>
                    <div style={{ flex:1, textAlign:'right' }}>
                      <div style={{ fontSize:'15px', fontWeight:800, color:'rgba(240,250,244,0.90)' }}>{m.p2}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            CTA SECTION
        ══════════════════════════════════════════ */}
        <section style={{ padding:'clamp(64px,8vw,96px) clamp(16px,4vw,48px)', position:'relative' }}>
          <div style={{ maxWidth:'720px', margin:'0 auto', textAlign:'center' }}>
            <CrystalPanel depth={1} style={{ borderRadius:'32px', padding:'clamp(40px,6vw,64px)' }}>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:'8px',
                background:'rgba(22,163,74,0.10)', border:'1px solid rgba(22,163,74,0.22)',
                borderTopColor:'rgba(255,255,255,0.75)', borderRadius:'99px',
                padding:'6px 16px', marginBottom:'22px',
                backdropFilter:'blur(8px)',
                boxShadow:'0 1px 1px rgba(255,255,255,0.80) inset',
              }}>
                <span style={{ fontSize:'10px', fontWeight:700, color:'#15803d', letterSpacing:'0.16em' }}>JOIN NOW</span>
              </div>

              <h2 style={{ fontSize:'clamp(26px,4.5vw,44px)', fontWeight:900, color:'#0a1a0f', letterSpacing:'-0.035em', lineHeight:1.1, marginBottom:'14px' }}>
                به اکوسیستم بیلیارد<br/>
                <span style={{ background:'linear-gradient(135deg,#16a34a,#0891b2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>ایران بپیوندید</span>
              </h2>

              <p style={{ fontSize:'16px', color:'rgba(10,26,15,0.55)', lineHeight:1.75, marginBottom:'32px' }}>
                ثبت‌نام رایگان. بیش از ۱,۲۰۰ بازیکن حرفه‌ای منتظر شما هستند.
              </p>

              <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
                <Link href="/register" className="hero-cta-primary" style={{ fontSize:'15px', padding:'14px 32px' }}>
                  ثبت‌نام رایگان <ArrowLeft size={16}/>
                </Link>
                <Link href="/clubs" className="hero-cta-glass" style={{ fontSize:'15px', padding:'13px 26px' }}>
                  رزرو میز
                </Link>
              </div>
            </CrystalPanel>
          </div>
        </section>
      </div>
    </>
  );
}