'use client';

/* ─────────────────────────────────────────────────────────────
   ثبت‌نام — بازطراحی پریمیوم (۱۴۰۵). منطق دو مرحله‌ای
   (شماره → اطلاعات) و api عیناً حفظ شده؛ پوسته هم‌خانواده‌ی
   صفحه‌ی ورود: اسپلیت سینمایی + استپر سگمنتی + فیلدهای لوکس.
   بهبود UX: بازگشت به مرحله‌ی قبل.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import JalaliDatePicker from '@/components/ui/JalaliDatePicker';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { sendOtp as apiSendOtp, verifyOtp as apiVerifyOtp, verifyIdentity as apiVerifyIdentity } from '@/lib/otp-client';
import { Phone, Lock, User, AlertCircle, ArrowLeft, ArrowRight, Check, Fingerprint, Eye, EyeOff, MessageSquare, ShieldCheck, CalendarDays } from 'lucide-react';
import { toAuthError } from '../../lib/auth/error-message';

type Step = 1 | 2;

interface FormData {
  phone: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
}

/* نمایش فارسی ارقام. مقدار داخل فرم همیشه لاتین می‌ماند — استعلام
   ثبت‌احوال و شاهکار ارقام فارسی را نمی‌پذیرند. */
const toFa = (v: string) => v.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d);

/* قواعد رمز عبور — همان‌ها که هنگام ثبت هم بررسی می‌شوند.
   حین تایپ نشان داده می‌شوند تا کاربر بعد از زدن دکمه غافلگیر نشود. */
const PW_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: 'حداقل ۸ کاراکتر',            test: v => v.length >= 8 },
  { label: 'حرف بزرگ انگلیسی (A-Z)',     test: v => /[A-Z]/.test(v) },
  { label: 'حرف کوچک انگلیسی (a-z)',     test: v => /[a-z]/.test(v) },
  { label: 'عدد',                        test: v => /\d/.test(v) },
  { label: 'کاراکتر ویژه (مثل @ یا !)',  test: v => /[^A-Za-z0-9]/.test(v) },
];
const pwOk = (v: string) => PW_RULES.every(r => r.test(v));

/* لینک‌های حقوقی درون متن پذیرش */
const legalLink: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 800,
  color: '#1D4ED8', textDecoration: 'underline', textUnderlineOffset: 3,
};

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
  /* چه کاری در حال انجام است — استعلام چند ثانیه طول می‌کشد */
  const [busyStep, setBusyStep] = useState('');
  /* مرحله‌ی OTP (بین شماره و اطلاعات حساب) */
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp]         = useState('');
  const [otpMsg, setOtpMsg]   = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  /* پذیرش قوانین — پیش‌شرط ساخت حساب */
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  /* شماره از قبل حساب دارد ⇒ به‌جای پیامک، راهنمایی ورود */
  const [phoneTaken, setPhoneTaken] = useState(false);

  const [form, setForm] = useState<FormData>({
    phone: '',
    firstName: '',
    lastName: '',
    nationalId: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });

  /* رفتن به صفحه‌ی قوانین و برگشت: اطلاعات پرشده گم نشود.
     رمز عبور عمداً ذخیره نمی‌شود و کاربر دوباره واردش می‌کند. */
  useEffect(() => {
    try {
      if (localStorage.getItem('bh_terms_accepted')) setAcceptedTerms(true);
      const draft = sessionStorage.getItem('bh_register_draft');
      if (draft) {
        const d = JSON.parse(draft) as Partial<FormData> & { step?: Step };
        setForm(f => ({ ...f, ...d, password: '', confirmPassword: '' }));
        if (d.step === 2) setStep(2);
        sessionStorage.removeItem('bh_register_draft');
      }
    } catch { /* ignore */ }
  }, []);

  /* رفتن به صفحه‌ی حقوقی و برگشت، بدون گم‌شدن اطلاعات پرشده */
  const goToLegal = (path: '/terms' | '/privacy') => {
    try {
      const { password: _p, confirmPassword: _c, ...rest } = form;
      sessionStorage.setItem('bh_register_draft', JSON.stringify({ ...rest, step }));
    } catch { /* ignore */ }
    router.push(`${path}?from=register`);
  };

  /* سانیتایز ورودی‌ها: نام‌ها فقط حروف فارسی (بدون عدد و حروف انگلیسی)؛ کد ملی فقط ۱۰ رقم؛
     موبایل فقط عدد، ۱۱ رقم و حتماً با ۰۹ (اگر با ۹ شروع شد، ۰ اضافه می‌شود) */
  const sanitize = (key: keyof FormData, v: string): string => {
    const latin = v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    if (key === 'firstName' || key === 'lastName') return v.replace(/[0-9۰-۹A-Za-z]/g, '');
    if (key === 'nationalId') return latin.replace(/[^0-9]/g, '').slice(0, 10);
    /* تاریخ تولد شمسی. اگر کاربر خودش «/» بزند، همان را مرز ماه و روز
       می‌گیریم تا «۱۳۶۳/۶/۲» هم درست وارد شود؛ اگر فقط عدد بزند یا پیست
       کند، «/» خودکار گذاشته می‌شود ⇒ 1363/06/02 */
    if (key === 'birthDate') {
      /* «-» و «.» هم جداکننده‌ی رایج‌اند */
      const seg = latin.replace(/[-.]/g, '/').replace(/[^0-9/]/g, '').split('/');
      let y = seg[0] ?? '', m = seg[1] ?? '', d = seg.slice(2).join('');
      /* سرریز هر بخش به بخش بعدی: تایپ پیوسته‌ی ۱۳۶۳۰۶۰۲ هم درست جا می‌افتد */
      if (y.length > 4) { m = y.slice(4) + m; y = y.slice(0, 4); }
      if (m.length > 2) { d = m.slice(2) + d; m = m.slice(0, 2); }
      d = d.slice(0, 2);
      if (y.length < 4) return y;
      if (seg.length === 1 && !m) return y;
      if (!m) return `${y}/`;
      if (seg.length <= 2 && !d) return `${y}/${m}`;
      return d ? `${y}/${m}/${d}` : `${y}/${m}/`;
    }
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

  /* شمارش معکوس ارسال مجدد */
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // ── Step 1: validate phone → ارسال کد پیامکی ────────────────────
  const handleContinue = async () => {
    if (!/^09[0-9]{9}$/.test(form.phone)) { setError('شماره موبایل معتبر نیست'); return; }
    setLoading(true); setError(''); setPhoneTaken(false);
    /* سرور اول تکراری بودن شماره را چک می‌کند؛ اگر حساب داشته باشد
       اصلاً پیامکی فرستاده نمی‌شود تا هزینه‌ی اضافه ایجاد نشود. */
    const r = await apiSendOtp(form.phone, 'register');
    setLoading(false);
    if (r.ok) { setOtpOpen(true); setOtp(''); setOtpMsg(''); setResendIn(60); return; }
    if (r.exists) { setPhoneTaken(true); setError(r.message || 'این شماره قبلاً ثبت‌نام کرده است'); return; }
    setError(r.message || 'ارسال کد پیامکی ناموفق بود');
  };

  const handleResend = async () => {
    if (resendIn > 0 || otpBusy) return;
    setOtpBusy(true); setOtpMsg('');
    const r = await apiSendOtp(form.phone);
    setOtpBusy(false);
    if (r.ok) { setResendIn(60); setOtpMsg('کد جدید ارسال شد'); }
    else { setOtpMsg(r.message || 'ارسال مجدد ناموفق بود'); if (r.wait) setResendIn(r.wait); }
  };

  const handleVerify = async () => {
    if (otpBusy) return;
    if (!/^\d{4,6}$/.test(otp.trim())) { setOtpMsg('کد را کامل وارد کنید'); return; }
    setOtpBusy(true); setOtpMsg('');
    const r = await apiVerifyOtp(form.phone, otp.trim());
    setOtpBusy(false);
    if (r.ok) { setOtpOpen(false); setStep(2); }
    else setOtpMsg(r.message || 'کد نادرست است');
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
    if (!/^1[23]\d{2}\/\d{1,2}\/\d{1,2}$/.test(form.birthDate.trim())) {
      setError('تاریخ تولد را کامل و به‌صورت ۱۳۷۰/۰۵/۱۲ وارد کنید');
      return;
    }
    if (!pwOk(form.password)) {
      setError('رمز عبور باید حداقل ۸ کاراکتر و شامل حروف بزرگ و کوچک انگلیسی، عدد و کاراکتر ویژه (مثل ! یا @) باشد');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }
    if (!acceptedTerms) {
      setError('برای ساخت حساب، قوانین و مقررات را مطالعه و تأیید کنید');
      return;
    }

    setLoading(true);
    /* استعلام از شاهکار و ثبت‌احوال چند ثانیه طول می‌کشد و بیرون از دست
       ماست. به‌جای اسپینر خاموش، بگو الان کجای کار است. */
    setBusyStep('در حال بررسی…');
    try {
      /* احراز هویت: شاهکار (کد ملی ↔ موبایل تأییدشده) + تطبیق نام با ثبت‌احوال */
      const idv = await apiVerifyIdentity(form.phone, form.nationalId.trim(), {
        birthDate: form.birthDate.trim(), firstName: form.firstName.trim(), lastName: form.lastName.trim(),
      });
      if (!idv.ok) { setLoading(false); setBusyStep(''); setError(idv.message || 'استعلام احراز هویت ناموفق بود؛ دوباره تلاش کنید'); return; }
      if (!idv.match) { setLoading(false); setBusyStep(''); setError(idv.message || 'اطلاعات هویتی با کد ملی مطابقت ندارد'); return; }

      setBusyStep('ساخت حساب…');
      const { data } = await api.post('/auth/register', {
        phone: form.phone,
        firstName: form.firstName,
        lastName: form.lastName,
        nationalId: form.nationalId.trim(),
        birthDate: form.birthDate.trim(),
        password: form.password,
      });

      /* شماره در مرحله‌ی OTP تأیید شده ⇒ کاربر verified است */
      setAuth({ ...data.user, verified: true }, data.token);
      router.push('/dashboard');
    } catch (err: any) {
      /* خطای شبکه دیگر «خطا در ثبت‌نام» گزارش نمی‌شود؛ کاربر می‌فهمد
         مشکل از اتصال بوده نه از اطلاعاتی که وارد کرده. */
      setError(toAuthError(err, 'خطا در ثبت‌نام، دوباره تلاش کنید').message);
    } finally {
      setLoading(false);
      setBusyStep('');
    }
  };

  /* فیلد استاندارد — تابع رندر (نه کامپوننت) تا با هر تایپ remount نشود و فوکس نپرد */
  const field = (
    k: keyof FormData, label: string, icon: React.ReactNode,
    opts: { type?: string; placeholder: string; inputMode?: 'numeric'; maxLength?: number; ltr?: boolean;
      /* ارقام را فارسی نشان بده — مقدار ذخیره‌شده همچنان لاتین می‌ماند */
      faDigits?: boolean;
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
          value={opts.faDigits ? toFa(form[k]) : form[k]}
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

        /* استپر سگمنتی */
        .au-steps { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
        .au-step { flex: 1; }
        .au-step .t { display: flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 800; margin-bottom: 7px; }
        .au-step .n { width: 21px; height: 21px; border-radius: 50%; display: inline-flex; align-items: center;
          justify-content: center; font-size: 11px; font-weight: 900; transition: all .3s; }
        .au-step .b { height: 3px; border-radius: 2px; background: ${LINE}; overflow: hidden; }
        .au-step .b i { display: block; height: 100%; background: linear-gradient(90deg,#8A6020,${GOLD});
          transition: width .45s cubic-bezier(.22,1,.36,1); }

        .au-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        /* آیتم‌های گرید باید بتوانند از عرض ذاتی input کوچک‌تر شوند */
        .au-row2 > div { min-width: 0; }
        .au-wrap { min-width: 0; }
        @media (max-width: 420px) { .au-row2 { grid-template-columns: 1fr; } }

        /* ── خطای مرکزی: وسط صفحه، جلوی چشم کاربر ── */
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

      {/* خطا — وسط صفحه */}
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
            {otpOpen ? 'تأیید شماره موبایل' : step === 1 ? 'ساخت حساب جدید' : 'تکمیل اطلاعات حساب'}
          </h1>
          <div style={{ width: 46, height: 3, borderRadius: 2, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'auX .5s .2s ease both', marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: MUT, margin: '0 0 22px', lineHeight: 1.8 }}>
            {otpOpen ? `کد ۵ رقمی به شماره ${toFa(form.phone)} پیامک شد` : step === 1 ? 'ابتدا شماره موبایل خود را وارد کنید' : `کاربر گرامی ${toFa(form.phone)} اکنون اطلاعات حساب را کامل کنید`}
          </p>

          {/* ── مرحله ۱: شماره ── */}
          {step === 1 && !otpOpen && (
            <div key="s1" style={{ animation: 'auUp .4s ease both' }}>
              {field('phone', 'شماره موبایل', <Phone size={16} />, { type: 'tel', placeholder: 'مثال: ۰۹۱۲۱۲۳۴۵۶۷', inputMode: 'numeric', maxLength: 11, ltr: true, faDigits: true })}
              <p style={{ fontSize: 11.5, color: MUT, margin: '2px 0 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                یک کد تأیید با پیامک به این شماره فرستاده می‌شود
              </p>
              {/* شماره از قبل حساب دارد ⇒ به‌جای ارسال پیامک، مسیر ورود */}
              {phoneTaken && (
                <div style={{ background: 'rgba(199,166,106,0.09)', border: '1px solid rgba(199,166,106,0.34)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT, marginBottom: 6 }}>این شماره قبلاً ثبت‌نام کرده است</div>
                  <p style={{ fontSize: 12.5, color: MUT, margin: '0 0 12px', lineHeight: 2 }}>
                    برای ادامه وارد حساب خود شوید. اگر رمز عبورتان را فراموش کرده‌اید، از گزینه‌ی بازیابی استفاده کنید.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 11, textDecoration: 'none', fontSize: 12.5, fontWeight: 800, background: 'rgba(199,166,106,0.16)', border: '1px solid rgba(199,166,106,0.45)', color: GOLD_D }}>
                      ورود به حساب <ArrowLeft size={13} />
                    </Link>
                    <button type="button" onClick={() => { setPhoneTaken(false); setError(''); setForm(f => ({ ...f, phone: '' })); }}
                      style={{ padding: '9px 16px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, background: 'transparent', border: `1px solid ${LINE}`, color: SEC }}>
                      شماره‌ی دیگری وارد می‌کنم
                    </button>
                  </div>
                </div>
              )}

              <button className="au-btn" onClick={handleContinue} disabled={loading || phoneTaken}>
                {loading ? (<><span style={{ width: 17, height: 17, border: '2px solid rgba(36,27,8,0.25)', borderTop: '2px solid #241B08', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> در حال ارسال کد…</>) : (<>ادامه <ArrowLeft size={15} /></>)}
              </button>
            </div>
          )}

          {/* ── مرحله‌ی OTP ── */}
          {step === 1 && otpOpen && (
            <div key="otp" style={{ animation: 'auUp .4s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <span style={{ display: 'inline-flex', width: 52, height: 52, borderRadius: 16, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.32)', color: GOLD_D, alignItems: 'center', justifyContent: 'center' }}><MessageSquare size={24} /></span>
              </div>
              <input
                className="au-inp" value={otp} inputMode="numeric" maxLength={6} autoFocus
                onChange={e => { setOtp(e.target.value.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '').slice(0, 6)); setOtpMsg(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleVerify(); }}
                placeholder="- - - - -"
                style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.5em', textIndent: '0.5em', fontSize: 26, fontWeight: 800, direction: 'ltr', padding: '14px', borderRadius: 14, border: `1px solid ${LINE}`, background: '#fff', color: TEXT, outline: 'none', fontFamily: 'inherit' }}
              />
              {otpMsg && <p style={{ fontSize: 12, fontWeight: 700, color: otpMsg.includes('ارسال شد') ? '#0E7A38' : '#B23B2E', margin: '10px 0 0', textAlign: 'center' }}>{otpMsg}</p>}
              <button className="au-btn" onClick={handleVerify} disabled={otpBusy} style={{ marginTop: 16 }}>
                {otpBusy ? (<><span style={{ width: 17, height: 17, border: '2px solid rgba(36,27,8,0.25)', borderTop: '2px solid #241B08', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> بررسی…</>) : (<><ShieldCheck size={16} /> تأیید و ادامه</>)}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <button onClick={handleResend} disabled={resendIn > 0 || otpBusy}
                  style={{ background: 'none', border: 'none', cursor: resendIn > 0 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: resendIn > 0 ? MUT : GOLD_D, padding: 0 }}>
                  {resendIn > 0 ? `ارسال مجدد تا ${resendIn.toLocaleString('fa-IR')} ثانیه` : 'ارسال مجدد کد'}
                </button>
                <button onClick={() => { setOtpOpen(false); setError(''); }} disabled={otpBusy}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: SEC, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <ArrowRight size={13} /> ویرایش شماره
                </button>
              </div>

              {/* سرویس پیامک برای هر شماره‌ای «موفق» می‌گوید و گزارش تحویل
                  نمی‌دهد، پس نرسیدن کد از سمت ما قابل تشخیص نیست. تنها
                  کاری که می‌شود کرد این است که کاربر بی‌خبر نماند. */}
              <div style={{ marginTop: 14, padding: '11px 13px', borderRadius: 12, background: 'rgba(199,166,106,0.07)', border: '1px solid rgba(199,166,106,0.22)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#6B5225', marginBottom: 6 }}>کد به دستتان نرسید؟</div>
                <ul style={{ margin: 0, paddingInlineStart: 16, fontSize: 12, lineHeight: 2, color: '#6B5225' }}>
                  <li>چند دقیقه صبر کنید و «ارسال مجدد» را بزنید.</li>
                  <li>پوشه‌ی پیام‌های مسدودشده یا فیلترشده‌ی گوشی را ببینید.</li>
                  <li>اگر باز هم نرسید، شماره‌ی دیگری امتحان کنید یا با پشتیبانی تماس بگیرید.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── مرحله ۲ ── */}
          {step === 2 && (
            <div key="s2" style={{ animation: 'auUp .4s ease both' }}>
              <div className="au-row2">
                {field('firstName', 'نام', <User size={16} />, { placeholder: 'نام' })}
                {field('lastName', 'نام خانوادگی', <User size={16} />, { placeholder: 'نام خانوادگی' })}
              </div>
              <div className="au-row2">
                {field('nationalId', 'کد ملی', <Fingerprint size={16} />, { type: 'tel', placeholder: 'کد ملی (۱۰ رقمی)', inputMode: 'numeric', maxLength: 10, ltr: true, faDigits: true })}
                {/* تاریخ تولد فقط از تقویم انتخاب می‌شود — تایپ دستی منبع
                    اشتباه بود (ماه و روز جابه‌جا، سال غلط) و استعلام
                    ثبت‌احوال را بی‌دلیل رد می‌کرد. */}
                <div style={{ marginBottom: 14 }}>
                  <JalaliDatePicker
                    id="birthDate"
                    label="تاریخ تولد"
                    value={form.birthDate}
                    onChange={v => { setForm(f => ({ ...f, birthDate: v })); setError(''); }}
                    placeholder="انتخاب از تقویم"
                  />
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: MUT, margin: '-6px 0 14px', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0, marginTop: 7 }} />
                نام، نام خانوادگی، کد ملی، تاریخ تولد و شماره موبایل باید متعلق به یک نفر باشد.
              </p>
              {field('password', 'رمز عبور', <Lock size={16} />, { placeholder: 'حداقل ۸ کاراکتر', reveal: { shown: showPw, toggle: () => setShowPw(p => !p) } })}
              {pwWarn && (
                <p style={{ fontSize: 11.5, fontWeight: 700, color: '#B23B2E', margin: '-6px 0 12px', display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.8 }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  کیبورد شما فارسی است — لطفاً زبان کیبورد را انگلیسی کنید.
                </p>
              )}
              {/* شرط‌های رمز — حین تایپ سبز می‌شوند تا کاربر بعد از زدن دکمه غافلگیر نشود */}
              <div style={{
                display: 'grid', gap: 7, margin: '-6px 0 14px',
                gridTemplateColumns: 'repeat(auto-fit,minmax(148px,1fr))',
              }}>
                {PW_RULES.map(r => {
                  const ok = r.test(form.password)
                  const idle = form.password.length === 0
                  return (
                    <span key={r.label} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, lineHeight: 1.7,
                      fontWeight: ok ? 800 : 600,
                      color: idle ? MUT : ok ? '#0E7A38' : '#B23B2E',
                      transition: 'color .2s',
                    }}>
                      <span style={{
                        width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: idle ? 'rgba(0,0,0,0.05)' : ok ? 'rgba(14,122,56,0.13)' : 'rgba(178,59,46,0.10)',
                        transition: 'background .2s',
                      }}>
                        {ok ? <Check size={10} strokeWidth={3.4} /> : <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: idle ? 0.5 : 0.8 }} />}
                      </span>
                      {r.label}
                    </span>
                  )
                })}
              </div>

              {field('confirmPassword', 'تکرار رمز عبور', <Lock size={16} />, { placeholder: 'رمز عبور را تکرار کنید', reveal: { shown: showPw2, toggle: () => setShowPw2(p => !p) } })}
              {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                <p style={{ fontSize: 11.5, fontWeight: 700, color: '#B23B2E', margin: '-6px 0 12px', display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.8 }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  رمز عبور و تکرار آن یکسان نیستند.
                </p>
              )}
              {form.confirmPassword.length > 0 && form.password === form.confirmPassword && pwOk(form.password) && (
                <p style={{ fontSize: 11.5, fontWeight: 800, color: '#0E7A38', margin: '-6px 0 12px', display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.8 }}>
                  <Check size={13} strokeWidth={3} style={{ flexShrink: 0 }} />
                  رمز عبور تأیید شد.
                </p>
              )}

              {/* پذیرش قوانین — بدون تیک آن، ثبت‌نام انجام نمی‌شود */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', margin: '2px 0 14px' }}>
                <input type="checkbox" checked={acceptedTerms}
                  onChange={e => {
                    setAcceptedTerms(e.target.checked); setError('');
                    try { e.target.checked ? localStorage.setItem('bh_terms_accepted', String(Date.now())) : localStorage.removeItem('bh_terms_accepted') } catch { /* ignore */ }
                  }}
                  style={{ width: 17, height: 17, marginTop: 2, accentColor: GOLD, cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, lineHeight: 2, color: SEC }}>
                  با ورود به بیلیارد هاب،{' '}
                  <button type="button" onClick={() => goToLegal('/terms')} style={legalLink}>
                    شرایط و قوانین استفاده
                  </button>
                  {' '}و{' '}
                  <button type="button" onClick={() => goToLegal('/privacy')} style={legalLink}>
                    سیاست‌نامهٔ حریم خصوصی
                  </button>
                  {' '}را می‌پذیرم.
                </span>
              </label>

              <button className="au-btn" onClick={handleRegister} disabled={loading} style={{ marginTop: 6 }}>
                {loading ? (
                  <>
                    <span style={{ width: 17, height: 17, border: '2px solid rgba(36,27,8,0.25)', borderTop: '2px solid #241B08', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                    {busyStep || 'در حال ساخت حساب…'}
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
