'use client';

/* ─────────────────────────────────────────────────────────────
   ورود — بازطراحی پریمیوم (۱۴۰۵). منطق (api/store/redirect) عیناً
   حفظ شده؛ پوسته: اسپلیتِ سینمایی — پنلِ برندِ تیره + فرمِ روشنِ
   مینیمال با فیلدهای لوکس و CTA طلایی.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { Eye, EyeOff, Phone, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

const GOLD   = '#C7A66A';
const GOLD_D = '#9A6E38';
const TEXT   = '#1C1B17';
const SEC    = '#5B564B';
const MUT    = '#8A8474';
const LINE   = '#E7E2D6';

export default function LoginPage() {
  const router          = useRouter();
  const { setAuth, user, _hydrated } = useAuthStore();
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);
  const [passFocus,  setPassFocus]  = useState(false);

  /* اگه کاربر لاگین هست مستقیم بره dashboard */
  useEffect(() => {
    if (_hydrated && user) router.replace('/dashboard');
  }, [_hydrated, user, router]);

  const handleLogin = async () => {
    if (!phone.trim())    { setError('لطفاً شماره موبایل را وارد کنید'); return; }
    if (!password.trim()) { setError('لطفاً رمز عبور را وارد کنید'); return; }

    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', { phone: phone.trim(), password });
      setAuth(res.data.user, res.data.token);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'شماره یا رمز عبور اشتباه است');
    } finally {
      setLoading(false);
    }
  };

  /* هنوز hydrate نشده */
  if (!_hydrated) return (
    <div style={{ minHeight:'100vh', background:'#F7F5F0', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'2px solid rgba(199,166,106,0.15)', borderTop:`2px solid ${GOLD}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  /* اگه لاگین هست صبر کن redirect بشه */
  if (user) return null;

  return (
    <div dir="rtl" className="au-root">
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes auUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes auX    { from { opacity: 0; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }

        .au-root { min-height: 100vh; display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.1fr);
          background: #F7F5F0; font-family: Vazirmatn, Tahoma, sans-serif; }

        /* ═══ پنل برند (تیره‌ی سینمایی) ═══ */
        .au-brand { position: relative; overflow: hidden; color: #fff; background: #0B0A08; }
        .au-brand-img { position: absolute; inset: 0; background: url('/images/hero/hero-lounge.jpg') center/cover;
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

        /* ═══ ستون فرم ═══ */
        .au-form-col { display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: clamp(28px,5vh,56px) clamp(20px,4vw,48px); position: relative; }
        .au-card { width: 100%; max-width: 420px; animation: auUp .55s cubic-bezier(.22,1,.36,1) both; }

        .au-field label { display: block; font-size: 12.5px; font-weight: 700; color: ${SEC}; margin-bottom: 8px; }
        .au-wrap { display: flex; align-items: center; background: #fff; border: 1px solid ${LINE};
          border-radius: 13px; transition: border-color .25s, box-shadow .25s; }
        .au-wrap.on { border-color: rgba(199,166,106,0.65); box-shadow: 0 0 0 3px rgba(199,166,106,0.14); }
        .au-wrap.err { border-color: rgba(178,59,46,0.55); box-shadow: 0 0 0 3px rgba(178,59,46,0.10); }
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

        .au-mob-brand { display: none; }
        @media (max-width: 900px) {
          .au-root { grid-template-columns: 1fr; }
          .au-brand { display: none; }
          .au-mob-brand { display: block; position: relative; overflow: hidden; color: #fff;
            background: radial-gradient(circle at 80% 0%, rgba(199,166,106,0.16), transparent 50%), linear-gradient(120deg,#0B0A08,#171208 60%,#0B0A08); padding: 22px 20px 20px; }
          .au-form-col { justify-content: flex-start; }
          .au-desk-logo { display: none; }
        }
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
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>پلتفرم جامع و هوشمند بیلیارد ایران</div>
      </div>

      {/* ═══ ستون فرم ═══ */}
      <div className="au-form-col">
        <div className="au-card">

          {/* لوگو — دسکتاپ */}
          <div className="au-desk-logo" style={{ textAlign: 'center', marginBottom: 26 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img src="/images/Logo/logo-256x256.png" alt="بیلیارد هاب" style={{ width: 44, height: 44, borderRadius: 13, boxShadow: '0 8px 24px rgba(199,166,106,0.3)' }} />
              <span style={{ fontSize: 23, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em' }}>
                بیلیارد <span style={{ background: `linear-gradient(135deg,#7A4F10,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>هاب</span>
              </span>
            </Link>
          </div>

          <h1 style={{ fontSize: 23, fontWeight: 900, color: TEXT, margin: '0 0 6px', letterSpacing: '-0.02em' }}>ورود به حساب</h1>
          <div style={{ width: 46, height: 3, borderRadius: 2, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'auX .5s .2s ease both', marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: MUT, margin: '0 0 24px', lineHeight: 1.8 }}>با شماره موبایل خود وارد شوید</p>

          {/* خطا */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 15px', background: 'rgba(178,59,46,0.07)', border: '1px solid rgba(178,59,46,0.25)', borderRadius: 12, marginBottom: 18, animation: 'auUp .3s ease both' }}>
              <AlertCircle size={15} style={{ color: '#B23B2E', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#A03428', flex: 1 }}>{error}</span>
            </div>
          )}

          {/* شماره موبایل */}
          <div className="au-field" style={{ marginBottom: 14 }}>
            <label>شماره موبایل</label>
            <div className={`au-wrap${phoneFocus ? ' on' : ''}${error && !phone ? ' err' : ''}`}>
              <span className="au-ic"><Phone size={16} /></span>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError(''); }}
                onFocus={() => setPhoneFocus(true)}
                onBlur={() => setPhoneFocus(false)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="au-inp"
                placeholder="09121234567"
                maxLength={11}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* رمز عبور */}
          <div className="au-field" style={{ marginBottom: 22 }}>
            <label>رمز عبور</label>
            <div className={`au-wrap${passFocus ? ' on' : ''}${error && !password ? ' err' : ''}`}>
              <span className="au-ic"><Lock size={16} /></span>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onFocus={() => setPassFocus(true)}
                onBlur={() => setPassFocus(false)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="au-inp"
                placeholder="رمز عبور"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{ padding: '0 12px 0 14px', background: 'none', border: 'none', cursor: 'pointer', color: MUT, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* ورود */}
          <button className="au-btn" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <>
                <span style={{ width: 17, height: 17, border: '2px solid rgba(36,27,8,0.25)', borderTop: '2px solid #241B08', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                در حال ورود…
              </>
            ) : 'ورود به حساب'}
          </button>

          {/* جداکننده */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: LINE }} />
            <span style={{ fontSize: 12, color: MUT }}>حساب ندارید؟</span>
            <div style={{ flex: 1, height: 1, background: LINE }} />
          </div>

          {/* ثبت‌نام */}
          <Link href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', boxSizing: 'border-box', padding: '13px', borderRadius: 13, textDecoration: 'none', fontSize: 14, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.32)', transition: 'background .2s' }}>
            ساخت حساب جدید
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
        <div className="au-word">BILLIARD HUB</div>
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(28px,4vw,56px)', gap: 16 }}>
          <span style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 8, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.26em', color: GOLD, border: '1px solid rgba(199,166,106,0.4)', background: 'rgba(199,166,106,0.10)', borderRadius: 999, padding: '5px 14px' }}>
            BILLIARD HUB · IRAN
          </span>
          <h2 style={{ fontSize: 'clamp(22px,2.4vw,34px)', fontWeight: 900, margin: 0, lineHeight: 1.5, maxWidth: 420 }}>
            خانه‌ی دیجیتالِ <span style={{ background: `linear-gradient(135deg,#E8CE96,${GOLD} 55%,#8A6020)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>جامعه‌ی بیلیارد</span> ایران
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 2, maxWidth: 400 }}>
            رزرو میز، مسابقات، بازار تجهیزات، مربیان و باشگاه‌ها — همه در یک حساب.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className="au-chip"><i /> رزرو آنلاین میز</span>
            <span className="au-chip"><i /> مسابقات رسمی</span>
            <span className="au-chip"><i /> بیلیارد بازار</span>
          </div>
        </div>
        <div className="au-bar"><i /><i /><i /></div>
      </aside>
    </div>
  );
}
