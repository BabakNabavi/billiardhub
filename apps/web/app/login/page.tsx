'use client';

/* ─────────────────────────────────────────────────────────────
   ورود — فرم تمیز وسط‌چین (بدون پنل تصویری، طبق درخواست).
   نوبار سر جای خودش است؛ فوتر در این صفحه نیست.
   منطق (api/store/redirect) عینا حفظ شده.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { Eye, EyeOff, Phone, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { toAuthError } from '../../lib/auth/error-message';
import { passwordHint, capsFrom } from '../../lib/auth/password-hints';
import { AuthBackdrop, AuthBrand, AuthTabs } from '../../components/auth/AuthChrome';

/* نمایش فارسی ارقام — مقدار ارسالی به سرور همچنان لاتین می‌ماند */
const toFa = (v: string) => v.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d);

const GOLD   = 'var(--brand)';

export default function LoginPage() {
  const router          = useRouter();
  const { setAuth, user, _hydrated, authChecked } = useAuthStore();
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [caps, setCaps]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);
  /* آیا خطا مربوط به ورودی کاربر بود؟ خطای شبکه نباید فیلدها را قرمز کند */
  const [errIsCred, setErrIsCred] = useState(true);
  const [passFocus,  setPassFocus]  = useState(false);

  /* مقصد بازگشت. وقتی middleware کاربر بدون نشست را از یک صفحه‌ی
     محافظت‌شده به این‌جا می‌فرستد، آدرس همان صفحه در next می‌آید تا
     پس از ورود دقیقا به جای اولش برگردد — نه به داشبورد. */
  const nextPath = (() => {
    if (typeof window === 'undefined') return '/dashboard';
    const n = new URLSearchParams(window.location.search).get('next');
    /* فقط مسیر داخلی؛ //evil.com یا آدرس کامل پذیرفته نمی‌شود.
       ⚠️ بک‌اسلش هم نه: مرورگر `/\evil.com` را `//evil.com` می‌خواند و
       الگوی قبلی همان را رد نمی‌کرد (ریدایرکتِ باز) */
    return n && /^\/(?![/\\])[^\\\s]*$/.test(n) ? n : '/dashboard';
  })();

  /* ── اگه کاربر لاگین هست مستقیم برود سر کارش ──
     ⚠️ اینجا حلقه‌ی ریدایرکت می‌ساخت و همان «صفحه‌ی سفید» بود:

       ۱) کوکی نشست منقضی می‌شد، ولی شیء کاربر در localStorage
          می‌ماند (آن‌جا تاریخ انقضا ندارد).
       ۲) کاربر /dashboard/club را باز می‌کرد؛ میدل‌ور کوکی معتبر
          نمی‌دید و ۳۰۷ می‌داد به /login?next=/dashboard/club
       ۳) همین افکت `user` را در localStorage می‌دید و دوباره به
          /dashboard/club می‌فرستاد
       ۴) برگرد به مرحله‌ی ۲ — بی‌پایان

     مرورگر وسط این رفت‌وبرگشت هیچ‌وقت چیزی رندر نمی‌کرد: صفحه‌ی
     سفید با نوار بالا. و چون فقط وقتی رخ می‌داد که نشست منقضی شده
     باشد، «گاهی» اتفاق می‌افتاد.

     `authChecked` یعنی سرور هویت را تأیید کرده. با آن، کاربری که
     فقط در localStorage «وارد» است این‌جا نگه داشته می‌شود تا
     دوباره وارد شود. */
  useEffect(() => {
    if (_hydrated && authChecked && user) router.replace(nextPath);
  }, [_hydrated, authChecked, user, router, nextPath]);

  /* پیام خطا دیگر خودش بسته نمی‌شود.

     پیش‌تر بعد از ۶٫۵ ثانیه ناپدید می‌شد؛ کاربری که سرش را بالا می‌آورد
     یا متن را کامل نخوانده بود، پیام را از دست می‌داد و نمی‌فهمید چه
     شده. حالا تا زدن «متوجه شدم» یا تغییر ورودی می‌ماند. */

  /* هشدار کیبورد از خود مقدار فیلد ساخته می‌شود، نه از حدس */
  const hint = passwordHint(password, caps);

  const handleLogin = async () => {
    if (!phone.trim())    { setError('لطفا شماره موبایل را وارد کنید'); return; }
    if (!password.trim()) { setError('لطفا رمز عبور را وارد کنید'); return; }
    /* جلوی درخواست محکوم‌به‌شکست را می‌گیریم — وگرنه یکی از پنج تلاش
       مجاز برای چیزی می‌سوزد که همین‌جا معلوم است اشتباه است. */
    if (hint.persian) { setError('کیبورد روی فارسی است — رمز را با حروف انگلیسی بنویسید'); return; }

    setLoading(true); setError(''); setErrIsCred(true);
    try {
      const res = await api.post('/auth/login', { phone: phone.trim(), password });
      /* توکن فقط در کوکیِ httpOnly است — body دیگر آن را ندارد */
      setAuth(res.data.user, '');
      /* نشست کوکی‌محور تازه ساخته شد ⇒ نشانه‌ی مهاجرت هم دیگر لازم نیست */
      try { localStorage.setItem('bh_session_migrated', String(Date.now())); } catch { /* ignore */ }
      router.replace(nextPath);
    } catch (err) {
      /* پیشتر هر خطایی «رمز اشتباه» گزارش می‌شد — حتی وقتی درخواست
         اصلا به سرور نرسیده بود. حالا از هم جدا می‌شوند. */
      const e = toAuthError(err, 'شماره یا رمز عبور اشتباه است');
      setError(e.message);
      setErrIsCred(e.isCredentialError);
      /* ── رمز اشتباه پاک می‌شود ──
         نگه‌داشتنش کمکی نمی‌کند: چون با نقطه نمایش داده می‌شود، کاربر
         نمی‌تواند اشتباه را ببیند و اصلاحش کند — عملا باید کل فیلد را
         پاک کند تا از نو بنویسد. اگر خطا از شبکه بوده نه از رمز، دست
         نمی‌زنیم؛ آن‌جا رمز درست بوده و پاک‌کردنش فقط آزاردهنده است. */
      if (e.isCredentialError) { setPassword(''); setCaps(false); }
    } finally {
      setLoading(false);
    }
  };

  if (!_hydrated) return (
    <div style={{ minHeight:'100vh', background:'#F7F5F0', display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* keyframes spin از components/auth/auth.css */}
      <div style={{ width:36, height:36, border:'2px solid rgb(var(--c-gold) / 0.15)', borderTop:`2px solid ${GOLD}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  );

  /* ── چرا اینجا هم `authChecked` لازم است ──
     `if (user) return null` یعنی صفحه هیچ‌چیز رندر نمی‌کند و منتظر
     می‌ماند تا افکت بالا کاربر را ببرد. ولی اگر آن افکت (به‌درستی)
     نبرد — چون سرور هنوز تأیید نکرده — این خط صفحه را برای همیشه
     خالی نگه می‌داشت.

     یعنی حتی بعد از بستن حلقه‌ی ریدایرکت، همین یک خط به‌تنهایی
     صفحه‌ی سفید می‌ساخت. */
  if (user && authChecked) return null;

  return (
    <div dir="rtl" className="au-root">
      <AuthBackdrop />

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

      {/* فرمِ واقعی: Enter و مدیرِ رمزِ مرورگر بی‌هندلرِ دستی کار می‌کنند */}
      <form className="au-card" noValidate onSubmit={e => { e.preventDefault(); void handleLogin(); }}>
        <AuthBrand />
        <AuthTabs active="login" />
        <h1 className="au-title">ورود به بیلیارد هاب</h1>
        <p className="au-sub">با شماره موبایل و رمز عبور وارد شوید</p>

        <div style={{ marginBottom: 14 }}>
          <label htmlFor="au-phone" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>شماره موبایل</label>
          <div className={`au-wrap${phoneFocus ? ' on' : ''}${error && errIsCred && !phone ? ' err' : ''}`}>
            <span className="au-ic"><Phone size={16} aria-hidden /></span>
            <input
              id="au-phone"
              type="tel"
              inputMode="numeric"
              value={toFa(phone)}
              onChange={e => {
                /* فقط عدد، ۱۱ رقم، حتما ۰۹ (۹ اول ⇒ ۰ اضافه می‌شود) */
                let d = e.target.value.replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))).replace(/[^0-9]/g, '');
                if (d && d[0] !== '0') d = d[0] === '9' ? '0' + d : '';
                if (d.length >= 2 && d[1] !== '9') d = d.slice(0, 1);
                setPhone(d.slice(0, 11)); setError('');
              }}
              onFocus={() => setPhoneFocus(true)}
              onBlur={() => setPhoneFocus(false)}
              className="au-inp"
              placeholder="شماره موبایل (۱۱ رقمی)"
              maxLength={11}
              autoComplete="tel"
            />
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
            <label htmlFor="au-pass" style={{ fontSize: 12.5, fontWeight: 700 }}>رمز عبور</label>
            <Link href="/forgot-password" className="au-forgot">فراموشی رمز عبور؟</Link>
          </div>
          <div className={`au-wrap${passFocus ? ' on' : ''}${error && !password ? ' err' : ''}`}>
            <span className="au-ic"><Lock size={16} aria-hidden /></span>
            <input
              id="au-pass"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onFocus={() => setPassFocus(true)}
              onBlur={() => setPassFocus(false)}
              onKeyDown={e => setCaps(capsFrom(e))}
              onKeyUp={e => setCaps(capsFrom(e))}
              className="au-inp"
              placeholder="رمز عبور"
              autoComplete="current-password"
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

          {/* ── هشدار چیدمان کیبورد ──
              رمز با نقطه نشان داده می‌شود، پس کاربر نمی‌بیند چه تایپ
              کرده. با کیبورد فارسی، به‌جای رمز یک رشته‌ی فارسی می‌رود و
              تنها بازخوردش «اطلاعات ورود صحیح نیست» است — بی‌هیچ سرنخی،
              و چند بار تکرارش حساب را قفل می‌کند. */}
          {hint.message && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 9,
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
        </div>

        <button type="submit" className="au-btn" disabled={loading} aria-busy={loading}>
          {loading ? (
            <>
              <span aria-hidden style={{ width: 17, height: 17, border: '2px solid rgba(255,255,255,0.32)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
              در حال ورود…
            </>
          ) : 'ورود به حساب'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" className="au-home">
            <ArrowLeft size={12} aria-hidden /> بازگشت به صفحه اصلی
          </Link>
        </div>
      </form>
    </div>
  );
}
