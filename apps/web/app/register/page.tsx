'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

type Step = 1 | 2;

interface FormData {
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    phone: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setError('');
  };

  // ── Step 1: validate phone and continue ──────────────────────────
  const handleContinue = () => {
    if (!/^09[0-9]{9}$/.test(form.phone)) {
      setError('شماره موبایل معتبر نیست');
      return;
    }
    setStep(2);
  };

  // ── Step 2: complete registration ─────────────────────────────────
  const handleRegister = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('نام و نام خانوادگی الزامی است');
      return;
    }
    if (form.password.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        phone: form.phone,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      });

      setAuth(data.user, data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'خطا در ثبت‌نام، دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <main className="register-root" dir="rtl">
      <div className="glow glow-1" />
      <div className="glow glow-2" />

      <div className="register-card">
        {/* logo */}
        <div className="logo-wrap">
          <div className="logo-icon">🎱</div>
          <span className="logo-text">
            <span style={{ color: '#000000' }}>بیلیارد</span>
            {' '}
            <span style={{ color: '#C7A66A' }}>هاب</span>
          </span>
        </div>

        {/* step indicator */}
        <div className="steps">
          {[1, 2].map((s) => (
            <div key={s} className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`}>
              {step > s ? '✓' : s}
            </div>
          ))}
          <div className="step-line" style={{ width: step === 2 ? '100%' : '0%' }} />
        </div>

        <h1 className="card-title">
          {step === 1 ? 'تأیید شماره موبایل' : 'تکمیل پروفایل'}
        </h1>
        <p className="card-sub">
          {step === 1 ? 'ابتدا شماره خود را وارد کنید' : 'اطلاعات حساب کاربری را تکمیل کنید'}
        </p>

        {/* ── STEP 1 ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="form-body">
            <div className="field">
              <label>شماره موبایل</label>
              <input
                type="tel"
                placeholder="مثال: 09121234567"
                value={form.phone}
                onChange={set('phone')}
                maxLength={11}
                className="inp"
                inputMode="numeric"
              />
            </div>

            <p className="otp-note">
              OTP در نسخه‌ی بعدی فعال می‌شود
            </p>

            <button onClick={handleContinue} style={{
              position: 'relative', overflow: 'hidden',
              width: '100%', padding: '14px', borderRadius: 10,
              background: 'rgba(199,166,106,0.06)',
              backdropFilter: 'blur(40px) saturate(240%)',
              WebkitBackdropFilter: 'blur(40px) saturate(240%)',
              border: '1px solid rgba(199,166,106,0.22)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 32px rgba(199,166,106,0.16)',
              color: '#C7A66A', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: '0.25rem',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)',
                pointerEvents: 'none',
              }} />
              ادامه
            </button>
          </div>
        )}

        {/* ── STEP 2 ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="form-body">
            <div className="row-2">
              <div className="field">
                <label>نام</label>
                <input className="inp" placeholder="علی" value={form.firstName} onChange={set('firstName')} />
              </div>
              <div className="field">
                <label>نام خانوادگی</label>
                <input className="inp" placeholder="احمدی" value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>

            <div className="field">
              <label>رمز عبور</label>
              <input
                className="inp"
                type="password"
                placeholder="حداقل ۸ کاراکتر"
                value={form.password}
                onChange={set('password')}
              />
            </div>

            <div className="field">
              <label>تکرار رمز عبور</label>
              <input
                className="inp"
                type="password"
                placeholder="رمز عبور را تکرار کنید"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
              />
            </div>

            <button onClick={handleRegister} disabled={loading} style={{
              position: 'relative', overflow: 'hidden',
              width: '100%', padding: '14px', borderRadius: 10,
              background: 'rgba(199,166,106,0.06)',
              backdropFilter: 'blur(40px) saturate(240%)',
              WebkitBackdropFilter: 'blur(40px) saturate(240%)',
              border: '1px solid rgba(199,166,106,0.22)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 32px rgba(199,166,106,0.16)',
              color: loading ? 'rgba(199,166,106,0.5)' : '#C7A66A',
              fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: '0.25rem', opacity: loading ? 0.6 : 1,
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)',
                pointerEvents: 'none',
              }} />
              {loading ? <span className="spinner" /> : 'ثبت نام'}
            </button>
          </div>
        )}

        {/* error */}
        {error && <p className="error-msg">{error}</p>}

        {/* footer */}
        <p className="footer-note">
          حساب کاربری دارید؟{' '}
          <Link href="/login" style={{ color: '#F5C518', textDecoration: 'none', fontWeight: 700 }}>
            وارد شوید
          </Link>
        </p>
      </div>

      <style jsx>{`
        .register-root {
          min-height: 100vh;
          background: linear-gradient(180deg,#111111 0%,#1a1a1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
          font-family: 'Vazirmatn', sans-serif;
        }
        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }
        .glow-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(199,166,106,0.10) 0%, transparent 70%);
          top: -100px; right: -100px;
        }
        .glow-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(199,166,106,0.06) 0%, transparent 70%);
          bottom: -80px; left: -80px;
        }
        .register-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 440px;
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          box-shadow: 0 8px 40px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.10);
        }
        .logo-wrap {
          display: flex; align-items: center; gap: 0.6rem;
          justify-content: center; margin-bottom: 1.8rem;
        }
        .logo-icon { font-size: 1.8rem; }
        .logo-text { font-size: 1.3rem; font-weight: 700; color: #A07840; letter-spacing: -0.01em; }
        .steps {
          display: flex; align-items: center; justify-content: center;
          gap: 0; margin-bottom: 1.5rem; position: relative;
        }
        .step-dot {
          width: 32px; height: 32px; border-radius: 50%;
          border: 2px solid rgba(199,166,106,0.30);
          color: rgba(0,0,0,0.35);
          font-size: 0.85rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s; position: relative; z-index: 1; background: #FFFFFF;
        }
        .step-dot.active { border-color: #C7A66A; color: #A07840; box-shadow: 0 0 12px rgba(199,166,106,0.25); }
        .step-dot.done   { border-color: #C7A66A; background: #C7A66A; color: #FFFFFF; }
        .step-dot + .step-dot { margin-right: 48px; }
        .step-line {
          position: absolute; height: 2px; background: #C7A66A;
          top: 50%; right: calc(50% + 16px); width: 0; max-width: 48px;
          transform: translateY(-50%); transition: width 0.4s ease;
          box-shadow: 0 0 6px rgba(199,166,106,0.40);
        }
        .card-title { text-align: center; font-size: 1.3rem; font-weight: 800; color: #111111; margin: 0 0 0.4rem; }
        .card-sub   { text-align: center; font-size: 0.85rem; color: rgba(0,0,0,0.45); margin: 0 0 1.8rem; }
        .form-body  { display: flex; flex-direction: column; gap: 1rem; }
        .row-2      { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
        .field      { display: flex; flex-direction: column; gap: 0.4rem; }
        .field label { font-size: 0.82rem; color: rgba(0,0,0,0.55); font-weight: 600; }
        .inp {
          background: #F7F7F5;
          border: 1px solid rgba(0,0,0,0.10);
          border-radius: 10px; padding: 0.7rem 0.9rem;
          color: #111111; font-family: inherit; font-size: 0.95rem;
          transition: border-color 0.2s, box-shadow 0.2s; outline: none; text-align: right;
        }
        .inp::placeholder { color: rgba(0,0,0,0.28); }
        .inp:focus { border-color: rgba(199,166,106,0.50); box-shadow: 0 0 0 3px rgba(199,166,106,0.10); }
        .otp-note {
          font-size: 0.78rem; color: rgba(0,0,0,0.40);
          text-align: center; margin: 0;
          padding: 0.5rem 0.75rem;
          background: rgba(199,166,106,0.06);
          border: 1px solid rgba(199,166,106,0.15);
          border-radius: 8px;
        }
        .btn-primary {
          width: 100%; padding: 0.85rem;
          background: linear-gradient(135deg, #C7A66A, #A07840);
          border: none; border-radius: 10px;
          color: #FFFFFF; font-family: inherit; font-size: 1rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.2s, box-shadow 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          box-shadow: 0 4px 20px rgba(199,166,106,0.30); margin-top: 0.25rem;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; box-shadow: 0 4px 28px rgba(199,166,106,0.45); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner {
          display: inline-block; width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #FFFFFF;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-msg {
          margin: 0.75rem 0 0; padding: 0.6rem 0.9rem;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.22);
          border-radius: 8px; color: #dc2626; font-size: 0.83rem; text-align: center;
        }
        .footer-note { text-align: center; font-size: 0.83rem; color: rgba(0,0,0,0.40); margin: 1.2rem 0 0; }
        .link-green  { color: #F5C518; text-decoration: none; font-weight: 700; }
        .link-green:hover { text-decoration: underline; }
        @media (max-width: 480px) {
          .register-card { padding: 2rem 1.25rem; }
          .row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
