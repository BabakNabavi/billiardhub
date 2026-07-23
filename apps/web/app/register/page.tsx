'use client';

/* ─────────────────────────────────────────────────────────────
   ثبت‌نام — بازطراحی پریمیوم (۱۴۰۵). منطقِ دو مرحله‌ای
   (شماره → اطلاعات) و api عیناً حفظ شده؛ پوسته هم‌خانواده‌ی
   صفحه‌ی ورود: اسپلیتِ سینمایی + استپرِ سگمنتی + فیلدهای لوکس.
   بهبود UX: بازگشت به مرحله‌ی قبل.
   ───────────────────────────────────────────────────────────── */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Phone, Lock, User, AlertCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';

type Step = 1 | 2;

interface FormData {
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

const GOLD   = '#C7A66A';
const GOLD_D = '#9A6E38';
const TEXT   = '#1C1B17';
const SEC    = '#5B564B';
const MUT    = '#8A8474';
const LINE   = '#E7E2D6';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusKey, setFocusKey] = useState('');

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

  /* فیلدِ استاندارد — تابعِ رندر (نه کامپوننت) تا با هر تایپ remount نشود و فوکِس نپرد */
  const field = (
    k: keyof FormData, label: string, icon: React.ReactNode,
    opts: { type?: string; placeholder: string; inputMode?: 'numeric'; maxLength?: number; ltr?: boolean },
  ) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: SEC, marginBottom: 8 }}>{label}</label>
      <div className={`au-wrap${focusKey === k ? ' on' : ''}`}>
        <span className="au-ic">{icon}</span>
        <input
          className="au-inp"
          style={opts.ltr ? undefined : { direction: 'rtl', textAlign: 'right' }}
          type={opts.type ?? 'text'}
          placeholder={opts.placeholder}
          value={form[k]}
          onChange={set(k)}
          onFocus={() => setFocusKey(k)}
          onBlur={() => setFocusKey('')}
          inputMode={opts.inputMode}
          maxLength={opts.maxLength}
        />
      </div>
    </div>
  );

  const STEPS = [
    { n: 1 as Step, label: 'شماره موبایل' },
    { n: 2 as Step, label: 'اطلاعات حساب' },
  ];

  return (
    <div dir="rtl" className="au-root">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes auUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes auX  { from { opacity: 0; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }

        .au-root { min-height: 100vh; display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.1fr);
          background: #F7F5F0; font-family: Vazirmatn, Tahoma, sans-serif; }

        .au-brand { position: relative; overflow: hidden; color: #fff; background: #0B0A08; }
        .au-brand-img { position: absolute; inset: 0; background: url('/images/hero/1.png') center/cover;
          filter: grayscale(0.3) brightness(0.5) contrast(1.08); transform: scale(1.03); }
        .au-brand-grade { position: absolute; inset: 0; background:
          radial-gradient(ellipse 60% 80% at 70% 10%, rgba(255,238,204,0.14), transparent 55%),
          linear-gradient(200deg, rgba(11,10,8,0.55) 0%, rgba(11,10,8,0.88) 78%); }
        .au-word { position: absolute; bottom: -8px; left: -4px; font-weight: 900;
          font-size: clamp(46px, 6.5vw, 92px); line-height: 1; letter-spacing: .04em;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.09); user-select: none; direction: ltr; }
        .au-hair { position: absolute; top: -25%; bottom: -25%; left: 32%; width: 1px;
          background: linear-gradient(180deg,transparent,rgba(199,166,106,0.5),transparent); transform: rotate(14deg); }
        .au-chip { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 700;
          color: rgba(255,255,255,0.78); border: 1px solid rgba(255,255,255,0.2); border-radius: 999px;
          padding: 6px 13px; backdrop-filter: blur(6px); }
        .au-chip i { width: 6px; height: 6px; border-radius: 50%; background: ${GOLD}; }
        .au-bar { position: absolute; bottom: 0; inset-inline: 0; height: 3px; display: flex; }
        .au-bar i:nth-child(1) { flex: 2.6; background: linear-gradient(90deg,#8A6020,${GOLD}); }
        .au-bar i:nth-child(2) { flex: 1; background: #B23B2E; }
        .au-bar i:nth-child(3) { flex: 1.6; background: #14532D; }

        .au-form-col { display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: clamp(28px,5vh,56px) clamp(20px,4vw,48px); }
        .au-card { width: 100%; max-width: 440px; animation: auUp .55s cubic-bezier(.22,1,.36,1) both; }

        .au-wrap { display: flex; align-items: center; background: #fff; border: 1px solid ${LINE};
          border-radius: 13px; transition: border-color .25s, box-shadow .25s; }
        .au-wrap.on { border-color: rgba(199,166,106,0.65); box-shadow: 0 0 0 3px rgba(199,166,106,0.14); }
        .au-ic { padding: 0 14px 0 0; color: ${MUT}; display: flex; align-items: center; flex-shrink: 0; transition: color .25s; }
        .au-wrap.on .au-ic { color: ${GOLD_D}; }
        .au-inp { flex: 1; min-width: 0; background: transparent; border: none; outline: none;
          padding: 14px 14px; font-size: 14.5px; color: ${TEXT}; font-family: inherit; direction: ltr; text-align: right; }
        .au-inp::placeholder { color: #B7B0A0; direction: rtl; font-size: 12.5px; }

        .au-btn { width: 100%; padding: 15px; border: none; border-radius: 13px; cursor: pointer;
          font-family: inherit; font-size: 15px; font-weight: 800; color: #241B08;
          background: linear-gradient(135deg, #E8CE96, ${GOLD} 55%, #A8853F);
          box-shadow: 0 12px 30px rgba(199,166,106,0.32);
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s, opacity .2s; }
        .au-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(199,166,106,0.42); }
        .au-btn:not(:disabled):active { transform: scale(0.985); }
        .au-btn:disabled { opacity: .65; cursor: not-allowed; }

        /* استپرِ سگمنتی */
        .au-steps { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
        .au-step { flex: 1; }
        .au-step .t { display: flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 800; margin-bottom: 7px; }
        .au-step .n { width: 21px; height: 21px; border-radius: 50%; display: inline-flex; align-items: center;
          justify-content: center; font-size: 11px; font-weight: 900; transition: all .3s; }
        .au-step .b { height: 3px; border-radius: 2px; background: ${LINE}; overflow: hidden; }
        .au-step .b i { display: block; height: 100%; background: linear-gradient(90deg,#8A6020,${GOLD});
          transition: width .45s cubic-bezier(.22,1,.36,1); }

        .au-mob-brand { display: none; }
        .au-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 900px) {
          .au-root { grid-template-columns: 1fr; }
          .au-brand { display: none; }
          .au-desk-logo { display: none; }
          .au-mob-brand { display: block; position: relative; overflow: hidden; color: #fff;
            background: radial-gradient(circle at 80% 0%, rgba(199,166,106,0.16), transparent 50%), linear-gradient(120deg,#0B0A08,#171208 60%,#0B0A08); padding: 22px 20px 20px; }
          .au-form-col { justify-content: flex-start; }
        }
        @media (max-width: 420px) { .au-row2 { grid-template-columns: 1fr; } }
      `}</style>

      {/* ═══ نوارِ برندِ موبایل ═══ */}
      <div className="au-mob-brand">
        <div style={{ position: 'absolute', top: '-30%', bottom: '-30%', left: '30%', width: 1, background: 'linear-gradient(180deg,transparent,rgba(199,166,106,0.45),transparent)', transform: 'rotate(14deg)' }} />
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/images/Logo/logo-256x256.png" alt="بیلیارد هاب" style={{ width: 38, height: 38, borderRadius: 11 }} />
          <span style={{ fontSize: 19, fontWeight: 900, color: '#fff' }}>
            بیلیارد <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>هاب</span>
          </span>
        </Link>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>به جامعه‌ی بیلیارد ایران بپیوندید</div>
      </div>

      {/* ═══ ستون فرم ═══ */}
      <div className="au-form-col">
        <div className="au-card">

          <div className="au-desk-logo" style={{ textAlign: 'center', marginBottom: 26 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img src="/images/Logo/logo-256x256.png" alt="بیلیارد هاب" style={{ width: 44, height: 44, borderRadius: 13, boxShadow: '0 8px 24px rgba(199,166,106,0.3)' }} />
              <span style={{ fontSize: 23, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em' }}>
                بیلیارد <span style={{ background: `linear-gradient(135deg,#7A4F10,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>هاب</span>
              </span>
            </Link>
          </div>

          {/* استپر */}
          <div className="au-steps">
            {STEPS.map(s => {
              const done = step > s.n;
              const active = step === s.n;
              return (
                <div key={s.n} className="au-step">
                  <div className="t" style={{ color: active || done ? GOLD_D : MUT }}>
                    <span className="n" style={{
                      background: done ? `linear-gradient(135deg,#E8CE96,${GOLD})` : active ? 'rgba(199,166,106,0.14)' : '#EFEBE1',
                      color: done ? '#241B08' : active ? GOLD_D : MUT,
                      border: active ? '1px solid rgba(199,166,106,0.5)' : '1px solid transparent',
                    }}>
                      {done ? <Check size={11} /> : s.n}
                    </span>
                    {s.label}
                  </div>
                  <div className="b"><i style={{ width: done ? '100%' : active ? '50%' : '0%' }} /></div>
                </div>
              );
            })}
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 900, color: TEXT, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {step === 1 ? 'ساخت حساب جدید' : 'تکمیل اطلاعات حساب'}
          </h1>
          <div style={{ width: 46, height: 3, borderRadius: 2, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'auX .5s .2s ease both', marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: MUT, margin: '0 0 22px', lineHeight: 1.8 }}>
            {step === 1 ? 'ابتدا شماره موبایل خود را وارد کنید' : `شماره ${form.phone} — حالا اطلاعات حساب را کامل کنید`}
          </p>

          {/* خطا */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 15px', background: 'rgba(178,59,46,0.07)', border: '1px solid rgba(178,59,46,0.25)', borderRadius: 12, marginBottom: 18, animation: 'auUp .3s ease both' }}>
              <AlertCircle size={15} style={{ color: '#B23B2E', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#A03428', flex: 1 }}>{error}</span>
            </div>
          )}

          {/* ── مرحله ۱ ── */}
          {step === 1 && (
            <div key="s1" style={{ animation: 'auUp .4s ease both' }}>
              {field('phone', 'شماره موبایل', <Phone size={16} />, { type: 'tel', placeholder: 'مثال: 09121234567', inputMode: 'numeric', maxLength: 11, ltr: true })}
              <p style={{ fontSize: 11.5, color: MUT, margin: '2px 0 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                تأیید پیامکی (OTP) در نسخه‌ی بعدی فعال می‌شود
              </p>
              <button className="au-btn" onClick={handleContinue}>
                ادامه <ArrowLeft size={15} />
              </button>
            </div>
          )}

          {/* ── مرحله ۲ ── */}
          {step === 2 && (
            <div key="s2" style={{ animation: 'auUp .4s ease both' }}>
              <div className="au-row2">
                {field('firstName', 'نام', <User size={16} />, { placeholder: 'علی' })}
                {field('lastName', 'نام خانوادگی', <User size={16} />, { placeholder: 'احمدی' })}
              </div>
              {field('password', 'رمز عبور', <Lock size={16} />, { type: 'password', placeholder: 'حداقل ۸ کاراکتر' })}
              {field('confirmPassword', 'تکرار رمز عبور', <Lock size={16} />, { type: 'password', placeholder: 'رمز عبور را تکرار کنید' })}

              <button className="au-btn" onClick={handleRegister} disabled={loading} style={{ marginTop: 6 }}>
                {loading ? (
                  <>
                    <span style={{ width: 17, height: 17, border: '2px solid rgba(36,27,8,0.25)', borderTop: '2px solid #241B08', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                    در حال ساخت حساب…
                  </>
                ) : 'ثبت نام'}
              </button>

              <button onClick={() => { setStep(1); setError(''); }} disabled={loading}
                style={{ width: '100%', marginTop: 10, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'transparent', border: `1px solid ${LINE}`, color: SEC, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <ArrowRight size={13} /> ویرایش شماره موبایل
              </button>
            </div>
          )}

          {/* ورود */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: LINE }} />
            <span style={{ fontSize: 12, color: MUT }}>حساب دارید؟</span>
            <div style={{ flex: 1, height: 1, background: LINE }} />
          </div>
          <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', boxSizing: 'border-box', padding: '13px', borderRadius: 13, textDecoration: 'none', fontSize: 14, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.32)' }}>
            ورود به حساب
          </Link>

          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: MUT, textDecoration: 'none' }}>
              <ArrowLeft size={12} /> بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ پنل برند — دسکتاپ ═══ */}
      <aside className="au-brand">
        <div className="au-brand-img" />
        <div className="au-brand-grade" />
        <div className="au-hair" />
        <div className="au-word">JOIN THE HUB</div>
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(28px,4vw,56px)', gap: 16 }}>
          <span style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 8, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.26em', color: GOLD, border: '1px solid rgba(199,166,106,0.4)', background: 'rgba(199,166,106,0.10)', borderRadius: 999, padding: '5px 14px' }}>
            BILLIARD HUB · IRAN
          </span>
          <h2 style={{ fontSize: 'clamp(22px,2.4vw,34px)', fontWeight: 900, margin: 0, lineHeight: 1.5, maxWidth: 420 }}>
            به <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>جامعه‌ی بیلیارد</span> ایران بپیوندید
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 2, maxWidth: 400 }}>
            بعد از ساخت حساب، نقش خود را انتخاب کنید — بازیکن، مربی، داور، فروشنده، باشگاه‌دار یا متخصص فنی — و پروفایل حرفه‌ای‌تان را بسازید.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className="au-chip"><i /> بازیکن</span>
            <span className="au-chip"><i /> مربی</span>
            <span className="au-chip"><i /> باشگاه‌دار</span>
            <span className="au-chip"><i /> فروشنده</span>
          </div>
        </div>
        <div className="au-bar"><i /><i /><i /></div>
      </aside>
    </div>
  );
}
