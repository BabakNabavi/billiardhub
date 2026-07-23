'use client';

/* ─────────────────────────────────────────────────────────────
   ورود — فرمِ تمیزِ وسط‌چین (بدون پنل تصویری، طبق درخواست).
   نوبار سر جای خودش است؛ فوتر در این صفحه نیست.
   منطق (api/store/redirect) عیناً حفظ شده.
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

  /* خطا بعد از چند ثانیه خودش بسته می‌شود */
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 6500);
    return () => clearTimeout(t);
  }, [error]);

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

  if (!_hydrated) return (
    <div style={{ minHeight:'100vh', background:'#F7F5F0', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:36, height:36, border:'2px solid rgba(199,166,106,0.15)', borderTop:`2px solid ${GOLD}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (user) return null;

  return (
    <div dir="rtl" className="au-root">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes auUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes auX  { from { opacity: 0; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }

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
        <h1 style={{ fontSize: 23, fontWeight: 900, color: TEXT, margin: '0 0 6px', letterSpacing: '-0.02em' }}>ورود به حساب</h1>
        <div style={{ width: 46, height: 3, borderRadius: 2, background: `linear-gradient(90deg,${GOLD},#8A6020)`, transformOrigin: 'right', animation: 'auX .5s .2s ease both', marginBottom: 10 }} />
        <p style={{ fontSize: 13, color: MUT, margin: '0 0 24px', lineHeight: 1.8 }}>با شماره موبایل خود وارد شوید</p>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: SEC, marginBottom: 8 }}>شماره موبایل</label>
          <div className={`au-wrap${phoneFocus ? ' on' : ''}${error && !phone ? ' err' : ''}`}>
            <span className="au-ic"><Phone size={16} /></span>
            <input
              type="tel"
              value={phone}
              onChange={e => {
                /* فقط عدد، ۱۱ رقم، حتماً ۰۹ (۹ اول ⇒ ۰ اضافه می‌شود) */
                let d = e.target.value.replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))).replace(/[^0-9]/g, '');
                if (d && d[0] !== '0') d = d[0] === '9' ? '0' + d : '';
                if (d.length >= 2 && d[1] !== '9') d = d.slice(0, 1);
                setPhone(d.slice(0, 11)); setError('');
              }}
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

        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: SEC, marginBottom: 8 }}>رمز عبور</label>
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

        <button className="au-btn" onClick={handleLogin} disabled={loading}>
          {loading ? (
            <>
              <span style={{ width: 17, height: 17, border: '2px solid rgba(36,27,8,0.25)', borderTop: '2px solid #241B08', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
              در حال ورود…
            </>
          ) : 'ورود به حساب'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: LINE }} />
          <span style={{ fontSize: 12, color: MUT }}>حساب ندارید؟</span>
          <div style={{ flex: 1, height: 1, background: LINE }} />
        </div>

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
  );
}
