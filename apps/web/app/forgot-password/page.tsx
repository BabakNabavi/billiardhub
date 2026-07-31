'use client';

/* ─────────────────────────────────────────────────────────────
   بازیابی رمز عبور — سه گام در یک صفحه، با همان ظاهرِ صفحه‌ی ورود.
   ارقام فارسی نمایش داده می‌شوند ولی همیشه لاتین به سرور می‌روند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Lock, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Check } from 'lucide-react';
import { apiFetch } from '../../lib/http';

const toFa    = (v: string) => v.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d);
const toLatin = (v: string) => v.replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))).replace(/[^0-9]/g, '');

const GOLD   = '#C7A66A';
const GOLD_D = '#9A6E38';
const TEXT   = '#1C1B17';
const SEC    = '#5B564B';
const MUT    = '#8A8474';
const LINE   = '#E7E2D6';
const FELT   = '#0E7A38';

/* همان قواعدی که سرور اعمال می‌کند — تا کاربر پیش از ارسال بداند چه لازم است */
const RULES: { label: string; ok: (p: string) => boolean }[] = [
  { label: 'حداقل ۸ نویسه',        ok: p => p.length >= 8 },
  { label: 'حرف کوچک انگلیسی',     ok: p => /[a-z]/.test(p) },
  { label: 'حرف بزرگ انگلیسی',     ok: p => /[A-Z]/.test(p) },
  { label: 'عدد',                  ok: p => /[0-9]/.test(p) },
  { label: 'نویسه ویژه مثل ! یا @', ok: p => /[^A-Za-z0-9]/.test(p) },
];

type Step = 'phone' | 'code' | 'password' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep]         = useState<Step>('phone');
  const [phone, setPhone]       = useState('');
  const [code, setCode]         = useState('');
  const [pass, setPass]         = useState('');
  const [pass2, setPass2]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [note, setNote]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [wait, setWait]         = useState(0);
  const [focus, setFocus]       = useState('');
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  /* شمارشِ معکوسِ ارسالِ دوباره */
  useEffect(() => {
    if (wait <= 0) return;
    tick.current = setInterval(() => setWait(w => Math.max(0, w - 1)), 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [wait]);

  /* پیامِ خطا خودش بسته نمی‌شود — کاربر باید بخواندش و تأیید کند */

  const call = async (body: Record<string, unknown>) => {
    const r = await apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, ...body }),
    });
    const j = await r.json().catch(() => ({} as Record<string, unknown>));
    return { httpOk: r.ok, status: r.status, ...(j as { ok?: boolean; message?: string; wait?: number }) };
  };

  const sendCode = async () => {
    if (phone.length !== 11) { setError('شماره موبایل باید ۱۱ رقم باشد'); return; }
    setLoading(true); setError('');
    try {
      const j = await call({ step: 'send' });
      if (j.status === 429) { setError(j.message || 'تلاش بیش از حد؛ کمی بعد دوباره امتحان کنید'); return; }
      /* پیش‌تر هر پاسخی «ارسال شد» فرض می‌شد و کاربر به مرحله‌ی کد
         می‌رفت — حتی وقتی سرویسِ پیامک شکست خورده بود و کدی نرفته بود. */
      if (j.ok === false) { setError(j.message || 'ارسالِ پیامک انجام نشد'); return; }
      setNote(j.message || '');
      setWait(j.wait ?? 60);
      setStep('code');
    } catch {
      setError('ارتباط با سرور برقرار نشد. اتصالتان را بررسی کنید و دوباره تلاش کنید.');
    } finally { setLoading(false); }
  };

  const verifyCode = async () => {
    if (code.length < 4) { setError('کد تأیید را کامل وارد کنید'); return; }
    setLoading(true); setError('');
    try {
      const j = await call({ step: 'verify', code });
      if (!j.ok) { setError(j.message || 'کد وارد‌شده درست نیست'); return; }
      setStep('password');
    } catch {
      setError('ارتباط با سرور برقرار نشد. اتصالتان را بررسی کنید و دوباره تلاش کنید.');
    } finally { setLoading(false); }
  };

  const resetPass = async () => {
    if (!RULES.every(r => r.ok(pass))) { setError('رمز عبور همه‌ی شرط‌های زیر را ندارد'); return; }
    if (pass !== pass2) { setError('رمز تازه و تکرارش یکی نیستند'); return; }
    setLoading(true); setError('');
    try {
      const j = await call({ step: 'reset', password: pass });
      if (!j.ok) { setError(j.message || 'تغییر رمز انجام نشد'); return; }
      setStep('done');
    } catch {
      setError('ارتباط با سرور برقرار نشد. اتصالتان را بررسی کنید و دوباره تلاش کنید.');
    } finally { setLoading(false); }
  };

  const submit = () => {
    if (loading) return;
    if (step === 'phone')    return sendCode();
    if (step === 'code')     return verifyCode();
    if (step === 'password') return resetPass();
    router.replace('/login');
  };

  const title = step === 'done' ? 'رمز عبور عوض شد' : 'بازیابی رمز عبور';
  const lead =
    step === 'phone'    ? 'شماره موبایل حسابتان را وارد کنید تا کد تأیید بفرستیم' :
    step === 'code'     ? (note || 'کد تأییدِ پیامک‌شده را وارد کنید') :
    step === 'password' ? 'رمز تازه‌ای برای حسابتان انتخاب کنید' :
                          'همه‌ی دستگاه‌های دیگر از حساب خارج شدند. با رمز تازه وارد شوید.';

  const btnLabel =
    step === 'phone'    ? 'ارسال کد تأیید' :
    step === 'code'     ? 'تأیید کد' :
    step === 'password' ? 'ثبت رمز تازه' :
                          'ورود با رمز تازه';

  return (
    <div dir="rtl" className="au-root">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes auUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes auX  { from { opacity: 0; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
        @keyframes auFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes auPop  { from { opacity: 0; transform: scale(.9) translateY(12px); } to { opacity: 1; transform: none; } }

        .au-root { min-height: calc(100vh - 72px); background: #F7F5F0;
          display: flex; align-items: flex-start; justify-content: center;
          padding: clamp(24px,6vh,64px) 20px 48px; font-family: Vazirmatn, Tahoma, sans-serif; }
        .au-card { width: 100%; max-width: 420px; background: #fff; border: 1px solid ${LINE};
          border-radius: 22px; padding: clamp(24px,4vw,34px);
          box-shadow: 0 18px 60px rgba(28,27,23,0.08);
          animation: auUp .55s cubic-bezier(.22,1,.36,1) both; position: relative; overflow: hidden; }
        .au-card::before { content: ''; position: absolute; top: 0; inset-inline: 0; height: 3px;
          background: linear-gradient(90deg, #8A6020, ${GOLD}, #8A6020); }

        .au-wrap { display: flex; align-items: center; background: #FAFAF7; border: 1px solid ${LINE};
          border-radius: 13px; transition: border-color .25s, box-shadow .25s; min-width: 0; }
        .au-wrap.on { border-color: rgba(199,166,106,0.65); box-shadow: 0 0 0 3px rgba(199,166,106,0.14); background: #fff; }
        .au-ic { padding: 0 14px 0 0; color: ${MUT}; display: flex; align-items: center; flex-shrink: 0; transition: color .25s; }
        .au-wrap.on .au-ic { color: ${GOLD_D}; }
        .au-inp { flex: 1; min-width: 0; background: transparent; border: none; outline: none;
          padding: 14px 14px; font-size: 14.5px; color: ${TEXT}; font-family: inherit; direction: ltr; text-align: right; }
        .au-inp::placeholder { color: #B7B0A0; direction: rtl; font-size: 12.5px; letter-spacing: normal; }
        .au-inp.otp { text-align: center; letter-spacing: 8px; font-size: 19px; font-weight: 800; padding-inline: 8px; }

        .au-btn { width: 100%; padding: 15px; border: none; border-radius: 13px; cursor: pointer;
          font-family: inherit; font-size: 15px; font-weight: 800; color: #241B08;
          background: linear-gradient(135deg, #E8CE96, ${GOLD} 55%, #A8853F);
          box-shadow: 0 12px 30px rgba(199,166,106,0.32);
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s, opacity .2s; }
        .au-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(199,166,106,0.42); }
        .au-btn:not(:disabled):active { transform: scale(0.985); }
        .au-btn:disabled { opacity: .65; cursor: not-allowed; }

        .au-ghost { width: 100%; margin-top: 10px; padding: 12px; border-radius: 12px; cursor: pointer;
          font-family: inherit; font-size: 13px; font-weight: 700; color: ${SEC};
          background: transparent; border: 1px solid ${LINE}; transition: background .2s, color .2s; }
        .au-ghost:not(:disabled):hover { background: #FAFAF7; color: ${GOLD_D}; }
        .au-ghost:disabled { color: ${MUT}; cursor: not-allowed; }

        /* پله‌های سه‌گانه */
        .au-steps { display: flex; align-items: center; gap: 6px; margin: 0 0 20px; }
        .au-steps i { flex: 1; height: 3px; border-radius: 2px; background: ${LINE}; transition: background .35s; }
        .au-steps i.on { background: linear-gradient(90deg, ${GOLD}, #8A6020); }

        /* شرط‌های رمز */
        .au-rules { list-style: none; padding: 0; margin: 10px 0 20px; display: grid; gap: 6px; }
        .au-rules li { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: ${MUT}; transition: color .2s; }
        .au-rules li.ok { color: ${FELT}; }
        .au-rules span { width: 15px; height: 15px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid ${LINE}; background: #FAFAF7; transition: background .2s, border-color .2s; }
        .au-rules li.ok span { background: rgba(14,122,56,0.09); border-color: rgba(14,122,56,0.35); }

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
        <h1 style={{ fontSize: 23, fontWeight: 900, color: TEXT, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{title}</h1>
        <div style={{ width: 46, height: 3, borderRadius: 2, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'auX .5s .2s ease both', marginBottom: 10 }} />
        <p style={{ fontSize: 13, color: MUT, margin: '0 0 22px', lineHeight: 1.95 }}>{lead}</p>

        {step !== 'done' && (
          <div className="au-steps" aria-hidden="true">
            <i className="on" />
            <i className={step === 'code' || step === 'password' ? 'on' : ''} />
            <i className={step === 'password' ? 'on' : ''} />
          </div>
        )}

        {/* ── گام ۱: شماره موبایل ── */}
        {step === 'phone' && (
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: SEC, marginBottom: 8 }}>شماره موبایل</label>
            <div className={`au-wrap${focus === 'phone' ? ' on' : ''}`}>
              <span className="au-ic"><Phone size={16} /></span>
              <input
                type="tel"
                inputMode="numeric"
                className="au-inp"
                value={toFa(phone)}
                onChange={e => {
                  let d = toLatin(e.target.value);
                  if (d && d[0] !== '0') d = d[0] === '9' ? '0' + d : '';
                  if (d.length >= 2 && d[1] !== '9') d = d.slice(0, 1);
                  setPhone(d.slice(0, 11));
                }}
                onFocus={() => setFocus('phone')}
                onBlur={() => setFocus('')}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="شماره موبایل (۱۱ رقمی)"
                maxLength={11}
                autoComplete="tel"
              />
            </div>
          </div>
        )}

        {/* ── گام ۲: کد تأیید ── */}
        {step === 'code' && (
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: SEC, marginBottom: 8 }}>کد تأیید</label>
            <div className={`au-wrap${focus === 'code' ? ' on' : ''}`}>
              <span className="au-ic"><ShieldCheck size={16} /></span>
              <input
                type="text"
                inputMode="numeric"
                className="au-inp otp"
                value={toFa(code)}
                onChange={e => setCode(toLatin(e.target.value).slice(0, 6))}
                onFocus={() => setFocus('code')}
                onBlur={() => setFocus('')}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="- - - - -"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
            <button type="button" className="au-ghost" onClick={sendCode} disabled={loading || wait > 0}>
              {wait > 0 ? `ارسال دوباره تا ${toFa(String(wait))} ثانیه` : 'ارسال دوباره‌ی کد'}
            </button>
          </div>
        )}

        {/* ── گام ۳: رمز تازه ── */}
        {step === 'password' && (
          <div style={{ marginBottom: 6 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: SEC, marginBottom: 8 }}>رمز تازه</label>
            <div className={`au-wrap${focus === 'p1' ? ' on' : ''}`}>
              <span className="au-ic"><Lock size={16} /></span>
              <input
                type={showPass ? 'text' : 'password'}
                className="au-inp"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onFocus={() => setFocus('p1')}
                onBlur={() => setFocus('')}
                placeholder="رمز تازه"
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                aria-label={showPass ? 'پنهان کردن رمز' : 'نمایش رمز'}
                style={{ padding: '0 12px 0 14px', background: 'none', border: 'none', cursor: 'pointer', color: MUT, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: SEC, margin: '14px 0 8px' }}>تکرار رمز تازه</label>
            <div className={`au-wrap${focus === 'p2' ? ' on' : ''}`}>
              <span className="au-ic"><Lock size={16} /></span>
              <input
                type={showPass ? 'text' : 'password'}
                className="au-inp"
                value={pass2}
                onChange={e => setPass2(e.target.value)}
                onFocus={() => setFocus('p2')}
                onBlur={() => setFocus('')}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="دوباره همان رمز"
                autoComplete="new-password"
              />
            </div>

            <ul className="au-rules">
              {RULES.map(r => {
                const good = r.ok(pass);
                return (
                  <li key={r.label} className={good ? 'ok' : ''}>
                    <span>{good && <Check size={10} strokeWidth={3} />}</span>
                    {r.label}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ── پایان ── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '4px 0 22px' }}>
            <span style={{ width: 60, height: 60, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: FELT, background: 'rgba(14,122,56,0.08)', border: '1px solid rgba(14,122,56,0.24)' }}>
              <CheckCircle2 size={26} />
            </span>
          </div>
        )}

        <button className="au-btn" onClick={submit} disabled={loading}>
          {loading ? (
            <>
              <span style={{ width: 17, height: 17, border: '2px solid rgba(36,27,8,0.25)', borderTop: '2px solid #241B08', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
              کمی صبر کنید…
            </>
          ) : btnLabel}
        </button>

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: MUT, textDecoration: 'none' }}>
            <ArrowLeft size={12} /> بازگشت به صفحه ورود
          </Link>
        </div>
      </div>
    </div>
  );
}
