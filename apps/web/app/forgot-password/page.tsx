'use client';

/* ─────────────────────────────────────────────────────────────
   بازیابی رمز عبور — سه گام در یک صفحه، با همان ظاهر صفحه‌ی ورود.
   ارقام فارسی نمایش داده می‌شوند ولی همیشه لاتین به سرور می‌روند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Lock, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Check } from 'lucide-react';
import { apiFetch } from '../../lib/http';
import { passwordHint, capsFrom } from '../../lib/auth/password-hints';
import { AuthBackdrop, AuthBrand } from '../../components/auth/AuthChrome';

const toFa    = (v: string) => v.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d);
const toLatin = (v: string) => v.replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))).replace(/[^0-9]/g, '');

const GOLD_D = 'var(--brand)';
const SEC    = '#5B564B';
const MUT    = '#6F6A5C';
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
  const [caps, setCaps]         = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  /* هشدار چیدمان کیبورد — از خود مقدار فیلد، نه از حدس */
  const hint = passwordHint(pass, caps);

  /* شمارش معکوس ارسال دوباره */
  useEffect(() => {
    if (wait <= 0) return;
    tick.current = setInterval(() => setWait(w => Math.max(0, w - 1)), 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [wait]);

  /* پیام خطا خودش بسته نمی‌شود — کاربر باید بخواندش و تأیید کند */

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
         می‌رفت — حتی وقتی سرویس پیامک شکست خورده بود و کدی نرفته بود. */
      if (j.ok === false) { setError(j.message || 'ارسال پیامک انجام نشد'); return; }
      setNote(j.message || '');
      setWait(j.wait ?? 60);
      setStep('code');
    } catch {
      setError('ارتباط با سرور برقرار نشد، اتصالتان را بررسی کنید و دوباره تلاش کنید');
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
      setError('ارتباط با سرور برقرار نشد، اتصالتان را بررسی کنید و دوباره تلاش کنید');
    } finally { setLoading(false); }
  };

  const resetPass = async () => {
    /* رمزی که با کیبورد فارسی ساخته شود، بعدا هم فقط با همان چیدمان
       تایپ می‌شود — یعنی کاربر خودش را از حسابش بیرون می‌کند. */
    if (hint.persian) { setError('کیبورد روی فارسی است — رمز را با حروف انگلیسی بنویسید'); return; }
    if (!RULES.every(r => r.ok(pass))) { setError('رمز عبور همه‌ی شرط‌های زیر را ندارد'); return; }
    if (pass !== pass2) { setError('رمز جدید و تکرارش یکی نیستند'); return; }
    setLoading(true); setError('');
    try {
      const j = await call({ step: 'reset', password: pass });
      if (!j.ok) {
        /* ۴۰۳ = اثباتِ کدِ پیامکی منقضی شده ⟵ از گامِ اول */
        if (j.status === 403) setStep('phone');
        setError(j.message || 'تغییر رمز انجام نشد');
        return;
      }
      setStep('done');
    } catch {
      setError('ارتباط با سرور برقرار نشد، اتصالتان را بررسی کنید و دوباره تلاش کنید');
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
    step === 'code'     ? (note || 'کد تأیید پیامک‌شده را وارد کنید') :
    step === 'password' ? 'رمز جدیدی برای حسابتان انتخاب کنید' :
                          'همه‌ی دستگاه‌های دیگر از حساب خارج شدند، با رمز جدید وارد شوید';

  const btnLabel =
    step === 'phone'    ? 'ارسال کد تأیید' :
    step === 'code'     ? 'تأیید کد' :
    step === 'password' ? 'ثبت رمز جدید' :
                          'ورود با رمز جدید';

  return (
    <div dir="rtl" className="au-root">
      <AuthBackdrop />
      <style>{`
        /* ── وسط‌چین واقعی ──
           CSS بعد از *هر* نویسه — از جمله آخری — فاصله می‌گذارد، پس
           جعبه‌ی متن به اندازه‌ی یک letter-spacing از خود نوشته
           پهن‌تر است و وسط‌چین‌کردن جعبه، نوشته را نصف آن فاصله به چپ
           می‌اندازد

           جبرانش **نصف** letter-spacing است، نه تمامش، مقدار قبلی
           تمام ۸px بود، یعنی ۴px به سمت دیگر کج می‌کرد — همان کجی که
           دیده می‌شد. */
        .au-inp.otp { text-align: center; letter-spacing: 8px; text-indent: 4px; font-size: 19px; font-weight: 800; padding-inline: 8px; }
        /* جای‌نگهدار همان قاعده را می‌خواهد، وگرنه قاعده‌ی عمومی بالا
           letter-spacing را normal می‌کند و خط‌تیره‌ها با تورفتگی
           جبران‌نشده کج می‌نشینند. */
        .au-inp.otp::placeholder { letter-spacing: inherit; font-size: inherit; direction: ltr; }

        .au-ghost { width: 100%; margin-top: 10px; padding: 12px; border-radius: 12px; cursor: pointer;
          font-family: inherit; font-size: 13px; font-weight: 700; color: ${SEC};
          background: transparent; border: 1px solid ${LINE}; transition: background .2s, color .2s; }
        .au-ghost:not(:disabled):hover { background: #FAFAF7; color: ${GOLD_D}; }
        .au-ghost:disabled { color: ${MUT}; cursor: not-allowed; }

        /* پله‌های سه‌گانه */
        .au-steps { display: flex; align-items: center; gap: 6px; margin: 0 0 20px; }
        .au-steps i { flex: 1; height: 3px; border-radius: 2px; background: ${LINE}; transition: background .35s; }
        .au-steps i.on { background: var(--brand); }

        /* شرط‌های رمز */
        .au-rules { list-style: none; padding: 0; margin: 10px 0 20px; display: grid; gap: 6px; }
        .au-rules li { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: ${MUT}; transition: color .2s; }
        .au-rules li.ok { color: ${FELT}; }
        .au-rules span { width: 15px; height: 15px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid ${LINE}; background: #FAFAF7; transition: background .2s, border-color .2s; }
        .au-rules li.ok span { background: rgba(14,122,56,0.09); border-color: rgba(14,122,56,0.35); }
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
        <AuthBrand />
        <h1 className="au-title">{title}</h1>
        <p className="au-sub">{lead}</p>

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
            <label htmlFor="fp-phone" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>شماره موبایل</label>
            <div className={`au-wrap${focus === 'phone' ? ' on' : ''}`}>
              <span className="au-ic"><Phone size={16} /></span>
              <input id="fp-phone"
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
            <label htmlFor="fp-code" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>کد تأیید</label>
            <div className={`au-wrap${focus === 'code' ? ' on' : ''}`}>
              <span className="au-ic"><ShieldCheck size={16} /></span>
              <input id="fp-code"
                type="text"
                inputMode="numeric"
                className="au-inp otp"
                value={toFa(code)}
                onChange={e => setCode(toLatin(e.target.value).slice(0, 6))}
                onFocus={() => setFocus('code')}
                onBlur={() => setFocus('')}
                onKeyDown={e => e.key === 'Enter' && submit()}
                /* بدون فاصله: خود letter-spacing فاصله‌ها را می‌سازد و
                   جای‌نگهدار دقیقا مثل پنج رقم واقعی می‌نشیند. با
                   فاصله‌های دستی، پنج خط‌تیره می‌شد نه نویسه و کج. */
                placeholder="-----"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
            <button type="button" className="au-ghost" onClick={sendCode} disabled={loading || wait > 0}>
              {wait > 0 ? `ارسال دوباره تا ${toFa(String(wait))} ثانیه` : 'ارسال دوباره‌ی کد'}
            </button>

            {/* ── راه خروج وقتی کد نمی‌رسد ──

                سرویس پیامک برای هر شماره‌ای «موفق» گزارش می‌دهد — حتی
                شماره‌ای که وجود ندارد — و هیچ گزارش تحویلی نمی‌دهد. پس
                نرسیدن پیامک از سمت ما اصلا قابل تشخیص نیست و کاربر
                بی‌آنکه بداند منتظر می‌ماند.

                این کادر تنها کاری است که از دست ما برمی‌آید: گفتن اینکه
                چه چیزی ممکن است اشتباه باشد و راه تماس. */}
            <div style={{
              marginTop: 14, padding: '11px 13px', borderRadius: 12,
              background: 'rgb(var(--c-gold) / 0.07)', border: '1px solid rgb(var(--c-gold) / 0.22)',
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--brand)', marginBottom: 6 }}>
                کد به دستتان نرسید؟
              </div>
              <ul style={{ margin: 0, paddingInlineStart: 16, fontSize: 12, lineHeight: 2, color: 'var(--brand)' }}>
                <li>چند دقیقه صبر کنید و «ارسال دوباره» را بزنید</li>
                <li>پوشه‌ی پیام‌های مسدودشده یا فیلترشده‌ی گوشی را ببینید</li>
                <li>اگر باز هم نرسید، ممکن است اپراتور آن شماره پیامک ما را تحویل ندهد</li>
              </ul>
              <Link href="/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 9,
                fontSize: 12.5, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none',
              }}>
                تماس با پشتیبانی ←
              </Link>
            </div>
          </div>
        )}

        {/* ── گام ۳: رمز جدید ── */}
        {step === 'password' && (
          <div style={{ marginBottom: 6 }}>
            <label htmlFor="fp-p1" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>رمز جدید</label>
            <div className={`au-wrap${focus === 'p1' ? ' on' : ''}`}>
              <span className="au-ic"><Lock size={16} /></span>
              <input id="fp-p1"
                type={showPass ? 'text' : 'password'}
                className="au-inp"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onFocus={() => setFocus('p1')}
                onBlur={() => setFocus('')}
                onKeyDown={e => setCaps(capsFrom(e))}
                onKeyUp={e => setCaps(capsFrom(e))}
                placeholder="رمز جدید"
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className="au-reveal"
                onClick={() => setShowPass(p => !p)}
                aria-label={showPass ? 'پنهان کردن رمز' : 'نمایش رمز'}
                aria-pressed={showPass}>
                {showPass ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              </button>
            </div>

            <label htmlFor="fp-p2" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, margin: '14px 0 8px' }}>تکرار رمز جدید</label>
            <div className={`au-wrap${focus === 'p2' ? ' on' : ''}`}>
              <span className="au-ic"><Lock size={16} /></span>
              <input id="fp-p2"
                type={showPass ? 'text' : 'password'}
                className="au-inp"
                value={pass2}
                onChange={e => setPass2(e.target.value)}
                onFocus={() => setFocus('p2')}
                onBlur={() => setFocus('')}
                onKeyDown={e => { setCaps(capsFrom(e)); if (e.key === 'Enter') submit(); }}
                onKeyUp={e => setCaps(capsFrom(e))}
                placeholder="دوباره همان رمز"
                autoComplete="new-password"
              />
            </div>

            {/* ── هشدار چیدمان کیبورد ──
                این‌جا از صفحه‌ی ورود هم مهم‌تر است: رمزی که با کیبورد
                فارسی ساخته شود، بعدا هم فقط با همان چیدمان قابل
                تایپ است — یعنی کاربر خودش را از حسابش بیرون می‌کند. */}
            {hint.message && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 10,
                padding: '9px 11px', borderRadius: 10, lineHeight: 1.9,
                background: hint.persian ? 'rgba(178,59,46,0.07)' : 'rgb(var(--c-gold) / 0.10)',
                border: `1px solid ${hint.persian ? 'rgba(178,59,46,0.28)' : 'rgb(var(--c-gold) / 0.32)'}`,
                fontSize: 12, fontWeight: 700,
                color: hint.persian ? '#B23B2E' : 'var(--brand)',
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{hint.message}</span>
              </div>
            )}

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
              <span style={{ width: 17, height: 17, border: '2px solid rgba(255,255,255,0.32)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
              کمی صبر کنید…
            </>
          ) : btnLabel}
        </button>

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <Link href="/login" className="au-home">
            <ArrowLeft size={12} aria-hidden /> بازگشت به صفحه ورود
          </Link>
        </div>
      </div>
    </div>
  );
}
