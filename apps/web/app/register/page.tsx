'use client';

/* ─────────────────────────────────────────────────────────────
   ثبت‌نام — بازطراحی پریمیوم (۱۴۰۵). منطقِ دو مرحله‌ای
   (شماره → اطلاعات) و api عیناً حفظ شده؛ پوسته هم‌خانواده‌ی
   صفحه‌ی ورود: اسپلیتِ سینمایی + استپرِ سگمنتی + فیلدهای لوکس.
   بهبود UX: بازگشت به مرحله‌ی قبل.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Phone, Lock, User, AlertCircle, ArrowLeft, ArrowRight, Check, Fingerprint, Eye, EyeOff } from 'lucide-react';

type Step = 1 | 2;

interface FormData {
  phone: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  password: string;
  confirmPassword: string;
}

/* اعتبارسنجی کد ملی ایران (چک‌سام استاندارد) */
function isValidNationalId(v: string): boolean {
  if (!/^\d{10}$/.test(v)) return false;
  if (/^(\d)\1{9}$/.test(v)) return false;
  const check = +v[9]!;
  const sum = v.slice(0, 9).split('').reduce((acc, d, i) => acc + +d * (10 - i), 0) % 11;
  return sum < 2 ? check === sum : check === 11 - sum;
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
  const [showPw, setShowPw]   = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [pwWarn, setPwWarn]   = useState(false);

  const [form, setForm] = useState<FormData>({
    phone: '',
    firstName: '',
    lastName: '',
    nationalId: '',
    password: '',
    confirmPassword: '',
  });

  /* سانیتایزِ ورودی‌ها: نام‌ها فقط حروف فارسی (بدون عدد و حروف انگلیسی)؛ کد ملی فقط ۱۰ رقم؛
     موبایل فقط عدد، ۱۱ رقم و حتماً با ۰۹ (اگر با ۹ شروع شد، ۰ اضافه می‌شود) */
  const sanitize = (key: keyof FormData, v: string): string => {
    const latin = v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    if (key === 'firstName' || key === 'lastName') return v.replace(/[0-9۰-۹A-Za-z]/g, '');
    if (key === 'nationalId') return latin.replace(/[^0-9]/g, '').slice(0, 10);
    if (key === 'phone') {
      let d = latin.replace(/[^0-9]/g, '');
      if (d && d[0] !== '0') d = d[0] === '9' ? '0' + d : '';
      if (d.length >= 2 && d[1] !== '9') d = d.slice(0, 1);
      return d.slice(0, 11);
    }
    if (key === 'password' || key === 'confirmPassword') return v.replace(/[؀-ۿ]/g, '');
    return v;
  };

  /* خطا بعد از چند ثانیه خودش بسته می‌شود */
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 6500);
    return () => clearTimeout(t);
  }, [error]);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (key === 'password' || key === 'confirmPassword') {
      setPwWarn(/[؀-ۿ]/.test(raw));
    }
    const v = sanitize(key, raw);
    setForm((prev) => ({ ...prev, [key]: v }));
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
    if (!isValidNationalId(form.nationalId.trim())) {
      setError('کد ملی معتبر نیست');
      return;
    }
    const pw = form.password;
    if (pw.length < 8 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
      setError('رمز عبور باید حداقل ۸ کاراکتر و شامل حروف بزرگ و کوچک انگلیسی، عدد و کاراکتر ویژه (مثل ! یا @) باشد');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }

    setLoading(true);
    try {
      /* nationalId هم ارسال می‌شود — بعداً با وب‌سرویسِ احراز هویت
         (تطبیقِ موبایل + نام + کد ملی) در بک‌اند بررسی خواهد شد */
      const { data } = await api.post('/auth/register', {
        phone: form.phone,
        firstName: form.firstName,
        lastName: form.lastName,
        nationalId: form.nationalId.trim(),
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
    opts: { type?: string; placeholder: string; inputMode?: 'numeric'; maxLength?: number; ltr?: boolean;
      reveal?: { shown: boolean; toggle: () => void } },
  ) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: SEC, marginBottom: 8 }}>{label}</label>
      <div className={`au-wrap${focusKey === k ? ' on' : ''}`}>
        <span className="au-ic">{icon}</span>
        <input
          className="au-inp"
          style={opts.ltr ? undefined : { direction: 'rtl', textAlign: 'right' }}
          type={opts.reveal ? (opts.reveal.shown ? 'text' : 'password') : (opts.type ?? 'text')}
          placeholder={opts.placeholder}
          value={form[k]}
          onChange={set(k)}
          onFocus={() => setFocusKey(k)}
          onBlur={() => setFocusKey('')}
          inputMode={opts.inputMode}
          maxLength={opts.maxLength}
        />
        {opts.reveal && (
          <button type="button" onClick={opts.reveal.toggle} tabIndex={-1}
            style={{ padding: '0 12px 0 14px', background: 'none', border: 'none', cursor: 'pointer', color: MUT, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {opts.reveal.shown ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
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

        .au-root { min-height: calc(100vh - 72px); background: #F7F5F0;
          display: flex; align-items: flex-start; justify-content: center;
          padding: clamp(24px,5vh,56px) 20px 48px; font-family: Vazirmatn, Tahoma, sans-serif; }
        .au-card { width: 100%; max-width: 460px; background: #fff; border: 1px solid ${LINE};
          border-radius: 22px; padding: clamp(24px,4vw,34px);
          box-shadow: 0 18px 60px rgba(28,27,23,0.08);
          animation: auUp .55s cubic-bezier(.22,1,.36,1) both; position: relative; overflow: hidden; }
        .au-card::before { content: ''; position: absolute; top: 0; inset-inline: 0; height: 3px;
          background: linear-gradient(90deg, #8A6020, ${GOLD}, #8A6020); }

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

        .au-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        /* آیتم‌های گرید باید بتوانند از عرضِ ذاتیِ input کوچک‌تر شوند */
        .au-row2 > div { min-width: 0; }
        .au-wrap { min-width: 0; }
        @media (max-width: 420px) { .au-row2 { grid-template-columns: 1fr; } }

        /* ── خطای مرکزی: وسطِ صفحه، جلوی چشمِ کاربر ── */
        @keyframes auFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes auPop  { from { opacity: 0; transform: scale(.9) translateY(12px); } to { opacity: 1; transform: none; } }
        .au-erlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
          padding: 24px; background: rgba(15,14,11,0.42); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
          animation: auFade .22s ease both; }
        .au-erbox { position: relative; width: 100%; max-width: 350px; background: #fff; border: 1px solid rgba(178,59,46,0.28);
          border-radius: 18px; padding: 26px 22px 20px; text-align: center; overflow: hidden;
          box-shadow: 0 26px 80px rgba(15,14,11,0.4); animation: auPop .3s cubic-bezier(.22,1,.36,1) both; }
        .au-erbox::before { content: ''; position: absolute; top: 0; inset-inline: 0; height: 3px;
          background: linear-gradient(90deg, #7E241A, #B23B2E, #7E241A); }
        .au-erbox .eric { width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 4px;
          display: flex; align-items: center; justify-content: center; color: #B23B2E;
          background: rgba(178,59,46,0.08); border: 1px solid rgba(178,59,46,0.22); }
        .au-erbox p { font-size: 13.5px; font-weight: 700; color: ${TEXT}; line-height: 2; margin: 12px 0 16px; }
        .au-erbox button { width: 100%; padding: 11px; border-radius: 11px; cursor: pointer; font-family: inherit;
          font-size: 13px; font-weight: 800; color: #B23B2E; background: rgba(178,59,46,0.06);
          border: 1px solid rgba(178,59,46,0.3); transition: background .2s; }
        .au-erbox button:hover { background: rgba(178,59,46,0.11); }
      `}</style>

      {/* خطا — وسطِ صفحه */}
      {error && (
        <div className="au-erlay" onClick={() => setError('')} role="alert">
          <div className="au-erbox" onClick={e => e.stopPropagation()}>
            <span className="eric"><AlertCircle size={22} /></span>
            <p>{error}</p>
            <button type="button" onClick={() => setError('')}>متوجه شدم</button>
          </div>
        </div>
      )}

      <div className="au-card">

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
              {field('nationalId', 'کد ملی', <Fingerprint size={16} />, { type: 'tel', placeholder: 'مثال: 0012345678', inputMode: 'numeric', maxLength: 10, ltr: true })}
              <p style={{ fontSize: 11.5, color: MUT, margin: '-6px 0 14px', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0, marginTop: 7 }} />
                کد ملی برای احراز هویت استفاده می‌شود و باید با نام و شماره موبایل شما مطابقت داشته باشد.
              </p>
              {field('password', 'رمز عبور', <Lock size={16} />, { placeholder: 'حداقل ۸ کاراکتر', reveal: { shown: showPw, toggle: () => setShowPw(p => !p) } })}
              {pwWarn && (
                <p style={{ fontSize: 11.5, fontWeight: 700, color: '#B23B2E', margin: '-6px 0 12px', display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.8 }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  کیبورد شما فارسی است — لطفاً زبان کیبورد را انگلیسی کنید.
                </p>
              )}
              <p style={{ fontSize: 11.5, color: MUT, margin: '-6px 0 14px', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0, marginTop: 7 }} />
                باید شامل حروف بزرگ و کوچک انگلیسی، عدد و کاراکتر ویژه باشد.
              </p>
              {field('confirmPassword', 'تکرار رمز عبور', <Lock size={16} />, { placeholder: 'رمز عبور را تکرار کنید', reveal: { shown: showPw2, toggle: () => setShowPw2(p => !p) } })}

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
  );
}
