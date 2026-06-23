'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Target, GraduationCap, Scale, Wrench,
  ShoppingBag, Package, Building2, CheckCircle, ArrowLeft, ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import AuthGuard from '../../../components/AuthGuard';

const ROLES = [
  {
    value: 'user',
    label: 'کاربر عادی',
    desc: 'دسترسی پایه به سایت، مشاهده محتوا و رزرو میز',
    icon: User,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.2)',
  },
  {
    value: 'player',
    label: 'بازیکن حرفه‌ای',
    desc: 'شرکت در مسابقات رسمی، رنکینگ ملی و آمار کامل بازی',
    icon: Target,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
  },
  {
    value: 'coach',
    label: 'مربی',
    desc: 'آموزش بازیکنان، مدیریت تمرین‌ها و پروفایل مربیگری',
    icon: GraduationCap,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
  },
  {
    value: 'referee',
    label: 'داور',
    desc: 'قضاوت در مسابقات رسمی، ثبت نتایج و گزارش بازی',
    icon: Scale,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    value: 'technician',
    label: 'خدمات فنی بیلیارد',
    desc: 'تعمیر، نگهداری و آماده‌سازی حرفه‌ای تجهیزات بیلیارد',
    icon: Wrench,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.08)',
    border: 'rgba(6,182,212,0.2)',
  },
  {
    value: 'seller',
    label: 'فروشنده تجهیزات',
    desc: 'فروش لوازم، اکسسوری و تجهیزات بیلیارد در فروشگاه',
    icon: ShoppingBag,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.2)',
  },
  {
    value: 'manufacturer',
    label: 'تولیدکننده',
    desc: 'تولید و عرضه مستقیم تجهیزات بیلیارد به بازار',
    icon: Package,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
  {
    value: 'club_owner',
    label: 'باشگاه‌دار',
    desc: 'مدیریت باشگاه، ثبت میزها، پذیرش رزرو و رویدادها',
    icon: Building2,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
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
  const [error, setError] = useState('');

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
      router.push('/dashboard');
    } catch {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === selected);

  return (
    <AuthGuard>
      <div dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#020806 0%,#060d0a 60%,#050c08 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,40px) 80px', position: 'relative', overflow: 'hidden', fontFamily: "'Vazirmatn', sans-serif" }}>

        {/* Background glows */}
        <div style={{ position: 'fixed', top: '-200px', right: '-200px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', bottom: '-200px', left: '-200px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(32px,5vw,52px)', maxWidth: '520px', animation: 'fadeUp 0.5s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '20px', boxShadow: '0 0 40px rgba(245,158,11,0.1)' }}>
            <ShieldCheck size={36} color="#f59e0b" />
          </div>
          <h1 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, color: '#f0faf5', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            سطح کاربری خود را تعیین کنید
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(240,250,245,0.45)', lineHeight: 1.8, margin: 0 }}>
            با انتخاب نقش مناسب، به امکانات تخصصی دسترسی پیدا می‌کنید.<br />
            این انتخاب را بعداً می‌توانید تغییر دهید.
          </p>
        </div>

        {/* Role Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px', width: '100%', maxWidth: '960px', marginBottom: '36px' }}>
          {ROLES.map((role, i) => {
            const Icon = role.icon;
            const isActive = selected === role.value;
            return (
              <button
                key={role.value}
                onClick={() => { setSelected(role.value); setError(''); }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '22px 20px',
                  background: isActive ? role.bg : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? role.color : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '18px',
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: isActive ? `0 0 0 1px ${role.color}40, 0 8px 32px ${role.color}15` : 'none',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                  animation: `fadeUp 0.4s ease ${i * 0.05}s both`,
                  outline: 'none',
                  fontFamily: "'Vazirmatn', sans-serif",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = role.bg;
                    (e.currentTarget as HTMLElement).style.borderColor = role.border;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }
                }}
              >
                {/* Check badge */}
                {isActive && (
                  <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                    <CheckCircle size={18} color={role.color} fill={role.color} strokeWidth={0} />
                  </div>
                )}

                {/* Icon */}
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isActive ? `${role.color}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${isActive ? role.color + '30' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s', boxShadow: isActive ? `0 0 16px ${role.color}25` : 'none', flexShrink: 0 }}>
                  <Icon size={22} color={isActive ? role.color : 'rgba(240,250,245,0.35)'} />
                </div>

                {/* Text */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: isActive ? role.color : '#f0faf5', marginBottom: '5px', transition: 'color 0.2s' }}>
                    {role.label}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(240,250,245,0.38)', lineHeight: 1.65 }}>
                    {role.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: '16px', padding: '10px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px', maxWidth: '480px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Save Button */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '13px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(240,250,245,0.45)', fontSize: '14px', cursor: 'pointer', fontFamily: "'Vazirmatn', sans-serif", transition: 'all 0.2s' }}
          >
            <ArrowLeft size={15} /> بعداً تعیین می‌کنم
          </button>

          <button
            onClick={handleSave}
            disabled={!selected || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '13px 36px',
              background: selectedRole
                ? `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}bb)`
                : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '12px',
              color: selected ? '#010604' : 'rgba(240,250,245,0.3)',
              fontSize: '15px', fontWeight: 700,
              cursor: selected && !loading ? 'pointer' : 'not-allowed',
              fontFamily: "'Vazirmatn', sans-serif",
              transition: 'all 0.3s',
              boxShadow: selectedRole ? `0 8px 28px ${selectedRole.color}35` : 'none',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid rgba(1,6,4,0.3)', borderTop: '2px solid #010604', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <CheckCircle size={17} />
            )}
            {loading ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
          </button>
        </div>

        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
          @keyframes spin   { to{transform:rotate(360deg);} }
        `}</style>
      </div>
    </AuthGuard>
  );
}
