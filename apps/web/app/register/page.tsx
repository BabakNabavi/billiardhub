'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/auth.store';

type Step = 1 | 2;

interface FormData {
  phone: string;
  otp: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role: 'player' | 'club_owner' | 'coach' | '';
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [form, setForm] = useState<FormData>({
    phone: '',
    otp: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    role: '',
  });

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setError('');
  };

  // ── Step 1: send OTP ──────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!/^09[0-9]{9}$/.test(form.phone)) {
      setError('شماره موبایل معتبر نیست');
      return;
    }
    setLoading(true);
    try {
      // TODO: connect to real SMS endpoint
      // await fetch('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone: form.phone }) });
      await new Promise((r) => setTimeout(r, 800)); // mock delay
      setOtpSent(true);
    } catch {
      setError('ارسال کد با خطا مواجه شد، دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (form.otp.length !== 6) {
      setError('کد تأیید باید ۶ رقم باشد');
      return;
    }
    setLoading(true);
    try {
      // TODO: verify OTP endpoint
      await new Promise((r) => setTimeout(r, 600));
      setStep(2);
    } catch {
      setError('کد وارد شده اشتباه است');
    } finally {
      setLoading(false);
    }
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
    if (!form.role) {
      setError('لطفاً نقش خود را انتخاب کنید');
      return;
    }

    setLoading(true);
    try {
      // TODO: replace with real register endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
          role: form.role,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'خطا در ثبت‌نام');
      }

      const data = await res.json();
      login(data.user, data.access_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت‌نام، دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <main className="register-root" dir="rtl">
      {/* ambient glow */}
      <div className="glow glow-1" />
      <div className="glow glow-2" />

      <div className="register-card">
        {/* logo */}
        <div className="logo-wrap">
          <div className="logo-icon">🎱</div>
          <span className="logo-text">بیلیارد پلاس</span>
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

            {!otpSent ? (
              <button className="btn-primary" onClick={handleSendOtp} disabled={loading}>
                {loading ? <span className="spinner" /> : 'ارسال کد تأیید'}
              </button>
            ) : (
              <>
                <p className="otp-note">
                  کد ۶ رقمی به <strong>{form.phone}</strong> ارسال شد
                </p>
                <div className="field">
                  <label>کد تأیید</label>
                  <input
                    type="text"
                    placeholder="_ _ _ _ _ _"
                    value={form.otp}
                    onChange={set('otp')}
                    maxLength={6}
                    className="inp otp-inp"
                    inputMode="numeric"
                  />
                </div>
                <button className="btn-primary" onClick={handleVerifyOtp} disabled={loading}>
                  {loading ? <span className="spinner" /> : 'تأیید و ادامه'}
                </button>
                <button className="btn-ghost" onClick={handleSendOtp} disabled={loading}>
                  ارسال مجدد کد
                </button>
              </>
            )}
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

            <div className="field">
              <label>نقش شما</label>
              <div className="role-group">
                {(
                  [
                    { value: 'player', label: 'بازیکن', icon: '🎯' },
                    { value: 'club_owner', label: 'مالک باشگاه', icon: '🏛️' },
                    { value: 'coach', label: 'مربی', icon: '🏆' },
                  ] as const
                ).map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    className={`role-btn ${form.role === value ? 'selected' : ''}`}
                    onClick={() => setForm((p) => ({ ...p, role: value }))}
                  >
                    <span className="role-icon">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={handleRegister} disabled={loading}>
              {loading ? <span className="spinner" /> : 'ثبت‌نام'}
            </button>
          </div>
        )}

        {/* error */}
        {error && <p className="error-msg">{error}</p>}

        {/* footer */}
        <p className="footer-note">
          حساب کاربری دارید؟{' '}
          <Link href="/login" className="link-green">
            وارد شوید
          </Link>
        </p>
      </div>

      {/* ── Scoped styles ─────────────────────────────────────────── */}
      <style jsx>{`
        .register-root {
          min-height: 100vh;
          background: #010604;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
          font-family: 'Vazirmatn', sans-serif;
        }

        /* ambient glows */
        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }
        .glow-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
          top: -100px;
          right: -100px;
        }
        .glow-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%);
          bottom: -80px;
          left: -80px;
        }

        /* card */
        .register-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: linear-gradient(145deg, rgba(16, 185, 129, 0.06), rgba(5, 12, 8, 0.95));
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 0 60px rgba(16, 185, 129, 0.05), 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        /* logo */
        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          justify-content: center;
          margin-bottom: 1.8rem;
        }
        .logo-icon {
          font-size: 1.8rem;
        }
        .logo-text {
          font-size: 1.3rem;
          font-weight: 700;
          color: #10b981;
          letter-spacing: -0.01em;
        }

        /* steps */
        .steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 1.5rem;
          position: relative;
        }
        .step-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid rgba(16, 185, 129, 0.3);
          color: rgba(240, 250, 245, 0.4);
          font-size: 0.85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          position: relative;
          z-index: 1;
          background: #010604;
        }
        .step-dot.active {
          border-color: #10b981;
          color: #10b981;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
        }
        .step-dot.done {
          border-color: #10b981;
          background: #10b981;
          color: #010604;
        }
        .step-dot + .step-dot {
          margin-right: 48px;
        }
        .step-line {
          position: absolute;
          height: 2px;
          background: #10b981;
          top: 50%;
          right: calc(50% + 16px);
          width: 0;
          max-width: 48px;
          transform: translateY(-50%);
          transition: width 0.4s ease;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
        }

        /* titles */
        .card-title {
          text-align: center;
          font-size: 1.3rem;
          font-weight: 700;
          color: #f0faf5;
          margin: 0 0 0.4rem;
        }
        .card-sub {
          text-align: center;
          font-size: 0.85rem;
          color: rgba(240, 250, 245, 0.5);
          margin: 0 0 1.8rem;
        }

        /* form */
        .form-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .field label {
          font-size: 0.82rem;
          color: rgba(240, 250, 245, 0.6);
          font-weight: 500;
        }
        .inp {
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          color: #f0faf5;
          font-family: inherit;
          font-size: 0.95rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          text-align: right;
        }
        .inp::placeholder {
          color: rgba(240, 250, 245, 0.25);
        }
        .inp:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
        }
        .otp-inp {
          text-align: center;
          letter-spacing: 0.4em;
          font-size: 1.3rem;
          font-weight: 700;
        }
        .otp-note {
          font-size: 0.83rem;
          color: rgba(240, 250, 245, 0.55);
          text-align: center;
          margin: 0;
        }
        .otp-note strong {
          color: #10b981;
        }

        /* role buttons */
        .role-group {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.6rem;
        }
        .role-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          padding: 0.75rem 0.5rem;
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          background: rgba(16, 185, 129, 0.04);
          color: rgba(240, 250, 245, 0.6);
          font-size: 0.78rem;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }
        .role-btn:hover {
          border-color: rgba(16, 185, 129, 0.4);
          color: #f0faf5;
        }
        .role-btn.selected {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
        }
        .role-icon {
          font-size: 1.3rem;
        }

        /* buttons */
        .btn-primary {
          width: 100%;
          padding: 0.85rem;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 10px;
          color: #010604;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25);
          margin-top: 0.25rem;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
          box-shadow: 0 4px 28px rgba(16, 185, 129, 0.4);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-ghost {
          width: 100%;
          padding: 0.6rem;
          background: transparent;
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 10px;
          color: rgba(240, 250, 245, 0.5);
          font-family: inherit;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover:not(:disabled) {
          border-color: rgba(16, 185, 129, 0.4);
          color: #f0faf5;
        }
        .btn-ghost:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* spinner */
        .spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(1, 6, 4, 0.3);
          border-top-color: #010604;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* error */
        .error-msg {
          margin: 0.75rem 0 0;
          padding: 0.6rem 0.9rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 8px;
          color: #fca5a5;
          font-size: 0.83rem;
          text-align: center;
        }

        /* footer */
        .footer-note {
          text-align: center;
          font-size: 0.83rem;
          color: rgba(240, 250, 245, 0.4);
          margin: 1.2rem 0 0;
        }
        .link-green {
          color: #10b981;
          text-decoration: none;
          font-weight: 600;
        }
        .link-green:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .register-card {
            padding: 2rem 1.25rem;
          }
          .row-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
