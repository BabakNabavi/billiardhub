'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import AuthGuard from '../../../components/AuthGuard';

const ROLES = [
  {
    value: 'user',
    label: 'کاربر عادی',
    desc: 'مشاهده محتوا، رزرو میز و دسترسی پایه به سایت',
    icon: 'ti-user',
    color: '#94a3b8',
    rgb: '148,163,184',
  },
  {
    value: 'player',
    label: 'بازیکن رنکینگی',
    desc: 'شرکت در مسابقات رسمی، رنکینگ ملی و آمار کامل بازی',
    icon: 'ti-chart-bar',
    color: '#10b981',
    rgb: '16,185,129',
  },
  {
    value: 'coach',
    label: 'مربی',
    desc: 'آموزش بازیکنان، مدیریت تمرین‌ها و پروفایل مربیگری',
    icon: 'ti-school',
    color: '#a78bfa',
    rgb: '167,139,250',
  },
  {
    value: 'referee',
    label: 'داور',
    desc: 'قضاوت در مسابقات رسمی، ثبت نتایج و گزارش بازی‌ها',
    icon: 'ti-scale',
    color: '#f59e0b',
    rgb: '245,158,11',
  },
  {
    value: 'technician',
    label: 'خدمات فنی',
    desc: 'تعمیر، نگهداری و آماده‌سازی حرفه‌ای تجهیزات بیلیارد',
    icon: 'ti-tool',
    color: '#06b6d4',
    rgb: '6,182,212',
  },
  {
    value: 'seller',
    label: 'فروشنده تجهیزات',
    desc: 'فروش لوازم، اکسسوری و تجهیزات بیلیارد در فروشگاه',
    icon: 'ti-shopping-bag',
    color: '#f97316',
    rgb: '249,115,22',
  },
  {
    value: 'manufacturer',
    label: 'تولیدکننده',
    desc: 'تولید و عرضه مستقیم تجهیزات بیلیارد به بازار',
    icon: 'ti-building-factory',
    color: '#ef4444',
    rgb: '239,68,68',
  },
  {
    value: 'club_owner',
    label: 'باشگاه‌دار',
    desc: 'مدیریت باشگاه، ثبت میزها، پذیرش رزرو و رویدادها',
    icon: 'ti-building-store',
    color: '#3b82f6',
    rgb: '59,130,246',
  },
] as const;

type RoleValue = typeof ROLES[number]['value'];

export default function RoleSelectionPage() {
  const { user, token, updateUser } = useAuthStore();
  const router = useRouter();
  const [selected, setSelected] = useState<RoleValue | null>(
    (user?.primaryRole as RoleValue) ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const selectedRole = ROLES.find(r => r.value === selected);

  const handleSave = async () => {
    if (!selected) { setError('لطفاً یک نقش انتخاب کنید'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ primaryRole: selected }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'خطا در ذخیره‌سازی'); return; }
      updateUser({ primaryRole: selected, isProfileComplete: selected !== 'user' });
      setSaved(true);
      setTimeout(() => router.push('/dashboard'), 900);
    } catch {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      {/* Tabler Icons */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
      />

      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          background: '#060e0a',
          fontFamily: "'Vazirmatn', sans-serif",
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,40px) 80px',
        }}
      >
        {/* ── Background Orbs ── */}
        <div style={{
          position: 'fixed', top: '-180px', right: '-140px',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 65%)',
          pointerEvents: 'none', filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'fixed', bottom: '-160px', left: '-120px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)',
          pointerEvents: 'none', filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'fixed', top: '35%', left: '38%',
          width: '380px', height: '380px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 65%)',
          pointerEvents: 'none', filter: 'blur(60px)',
        }} />

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,56px)', maxWidth: '540px', position: 'relative', zIndex: 2 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.22)',
            borderRadius: '100px', padding: '7px 20px',
            marginBottom: '24px',
          }}>
            <i className="ti ti-shield-check" style={{ fontSize: '15px', color: '#f59e0b' }} />
            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 500, letterSpacing: '0.06em' }}>
              تعیین سطح کاربری
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(24px,4vw,34px)', fontWeight: 900,
            color: '#f0fdf4', marginBottom: '14px',
            letterSpacing: '-0.03em', lineHeight: 1.25,
          }}>
            در بیلیارد پلاس<br />
            <span style={{
              background: 'linear-gradient(135deg,#10b981,#34d399)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              چه نقشی دارید؟
            </span>
          </h1>

          <p style={{ fontSize: '13.5px', color: 'rgba(240,253,244,0.4)', lineHeight: 1.9, margin: 0 }}>
            نقش خود را انتخاب کنید تا به امکانات تخصصی دسترسی پیدا کنید
          </p>
        </div>

        {/* ── Role Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))',
          gap: '10px',
          width: '100%', maxWidth: '920px',
          marginBottom: '28px',
          position: 'relative', zIndex: 2,
        }}>
          {ROLES.map((role, i) => {
            const isActive = selected === role.value;
            return (
              <button
                key={role.value}
                onClick={() => { setSelected(role.value); setError(''); }}
                style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '10px', padding: '26px 14px 22px',
                  background: isActive
                    ? `rgba(${role.rgb},0.08)`
                    : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isActive ? role.color : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '20px',
                  cursor: 'pointer', textAlign: 'center',
                  outline: 'none', overflow: 'hidden',
                  minHeight: '162px',
                  fontFamily: "'Vazirmatn', sans-serif",
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  transform: isActive ? 'translateY(-4px)' : 'none',
                  boxShadow: isActive
                    ? `0 0 0 1px rgba(${role.rgb},0.25), 0 16px 40px rgba(${role.rgb},0.18)`
                    : 'none',
                  animation: `fadeUp 0.4s ease ${i * 0.045}s both`,
                }}
              >
                {/* Top shimmer line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                  background: `linear-gradient(90deg, transparent, ${role.color}, transparent)`,
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.3s',
                }} />

                {/* Inner glow */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '20px',
                  background: `linear-gradient(135deg, rgba(${role.rgb},0.1) 0%, transparent 55%)`,
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.3s',
                  pointerEvents: 'none',
                }} />

                {/* Check badge */}
                <div style={{
                  position: 'absolute', top: '10px', left: '10px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: role.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'scale(1)' : 'scale(0.4)',
                  transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  <i className="ti ti-check" style={{ fontSize: '11px', color: '#060e0a' }} />
                </div>

                {/* Icon */}
                <div style={{
                  width: '52px', height: '52px', borderRadius: '15px',
                  background: isActive ? `rgba(${role.rgb},0.15)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? `rgba(${role.rgb},0.4)` : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                  boxShadow: isActive ? `0 0 24px rgba(${role.rgb},0.3)` : 'none',
                  position: 'relative', zIndex: 1,
                }}>
                  <i
                    className={`ti ${role.icon}`}
                    style={{
                      fontSize: '24px',
                      color: isActive ? role.color : 'rgba(240,253,244,0.28)',
                      transition: 'color 0.3s',
                    }}
                  />
                </div>

                {/* Label */}
                <div style={{
                  fontSize: '13px', fontWeight: 700,
                  color: isActive ? role.color : 'rgba(240,253,244,0.78)',
                  transition: 'color 0.3s',
                  position: 'relative', zIndex: 1,
                  lineHeight: 1.3,
                }}>
                  {role.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Selected Banner ── */}
        <div style={{
          width: '100%', maxWidth: '920px',
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '14px 22px',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${selectedRole ? `rgba(${selectedRole.rgb},0.18)` : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '14px',
          marginBottom: '28px',
          position: 'relative', zIndex: 2,
          opacity: selected ? 1 : 0,
          transform: selected ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.35s ease',
          overflow: 'hidden',
        }}>
          {/* Banner shimmer line */}
          {selectedRole && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: `linear-gradient(90deg, transparent, ${selectedRole.color}, transparent)`,
              opacity: 0.5,
            }} />
          )}
          <div style={{
            width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
            background: selectedRole ? `rgba(${selectedRole.rgb},0.12)` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${selectedRole ? `rgba(${selectedRole.rgb},0.3)` : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s',
          }}>
            {selectedRole && (
              <i className={`ti ${selectedRole.icon}`} style={{ fontSize: '18px', color: selectedRole.color }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: selectedRole?.color ?? '#f0fdf4', marginBottom: '3px' }}>
              {selectedRole ? `✓ ${selectedRole.label} انتخاب شد` : '—'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(240,253,244,0.38)', lineHeight: 1.6 }}>
              {selectedRole?.desc ?? ''}
            </div>
          </div>
          {selectedRole && (
            <i className="ti ti-circle-check" style={{ fontSize: '22px', color: selectedRole.color, flexShrink: 0 }} />
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            marginBottom: '16px', padding: '10px 20px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.22)',
            borderRadius: '10px', color: '#fca5a5',
            fontSize: '13px', maxWidth: '920px', width: '100%',
            textAlign: 'center', position: 'relative', zIndex: 2,
          }}>
            {error}
          </div>
        )}

        {/* ── Footer Buttons ── */}
        <div style={{
          display: 'flex', gap: '14px', alignItems: 'center',
          flexWrap: 'wrap', justifyContent: 'center',
          width: '100%', maxWidth: '920px',
          position: 'relative', zIndex: 2,
        }}>

          {/* Skip button — glass */}
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              position: 'relative',
              padding: '14px 28px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              color: 'rgba(240,253,244,0.42)',
              fontSize: '14px', fontWeight: 500,
              cursor: 'pointer', fontFamily: "'Vazirmatn', sans-serif",
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.25s ease',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(255,255,255,0.07)';
              el.style.borderColor = 'rgba(255,255,255,0.18)';
              el.style.color = 'rgba(240,253,244,0.65)';
              el.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(255,255,255,0.04)';
              el.style.borderColor = 'rgba(255,255,255,0.1)';
              el.style.color = 'rgba(240,253,244,0.42)';
              el.style.transform = 'translateY(0)';
            }}
          >
            {/* glass top shimmer */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)',
            }} />
            <i className="ti ti-clock" style={{ fontSize: '16px' }} />
            بعداً تعیین می‌کنم
          </button>

          {/* Save button — liquid */}
          <button
            onClick={handleSave}
            disabled={!selected || loading}
            style={{
              position: 'relative',
              padding: '14px 52px',
              background: selectedRole
                ? `linear-gradient(135deg, ${selectedRole.color} 0%, ${selectedRole.color}cc 100%)`
                : 'rgba(255,255,255,0.05)',
              border: selectedRole ? 'none' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              color: selected ? '#060e0a' : 'rgba(240,253,244,0.2)',
              fontSize: '15px', fontWeight: 700,
              cursor: selected && !loading ? 'pointer' : 'not-allowed',
              fontFamily: "'Vazirmatn', sans-serif",
              display: 'flex', alignItems: 'center', gap: '10px',
              transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
              overflow: 'hidden',
              flex: 1, maxWidth: '380px', justifyContent: 'center',
              boxShadow: selectedRole
                ? `0 4px 24px rgba(${selectedRole.rgb},0.35), inset 0 1px 0 rgba(255,255,255,0.18)`
                : 'none',
              opacity: loading ? 0.85 : 1,
            }}
            onMouseEnter={e => {
              if (!selected || loading) return;
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(-3px)';
              el.style.filter = 'brightness(1.1)';
              if (selectedRole)
                el.style.boxShadow = `0 10px 36px rgba(${selectedRole.rgb},0.45), inset 0 1px 0 rgba(255,255,255,0.22)`;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = 'translateY(0)';
              el.style.filter = 'brightness(1)';
              if (selectedRole)
                el.style.boxShadow = `0 4px 24px rgba(${selectedRole.rgb},0.35), inset 0 1px 0 rgba(255,255,255,0.18)`;
            }}
          >
            {/* liquid shine overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg,rgba(255,255,255,0.14) 0%,transparent 55%)',
              opacity: selected ? 1 : 0,
              transition: 'opacity 0.3s',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)',
              opacity: selected ? 1 : 0,
            }} />

            {loading ? (
              <span style={{
                width: '18px', height: '18px',
                border: '2px solid rgba(6,14,10,0.3)',
                borderTop: '2px solid #060e0a',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }} />
            ) : saved ? (
              <i className="ti ti-circle-check" style={{ fontSize: '18px' }} />
            ) : (
              <i className="ti ti-device-floppy" style={{ fontSize: '18px' }} />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>
              {loading ? 'در حال ذخیره...' : saved ? 'ذخیره شد!' : 'ذخیره و ادامه'}
            </span>
            {!loading && !saved && (
              <i className="ti ti-arrow-left" style={{ fontSize: '15px', opacity: 0.65, position: 'relative', zIndex: 1 }} />
            )}
          </button>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;900&display=swap');
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
          @keyframes spin   { to{transform:rotate(360deg)} }
        `}</style>
      </div>
    </AuthGuard>
  );
}
