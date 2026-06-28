'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { Eye, EyeOff, Phone, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

const GOLD = '#B8933A';

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
    <div style={{ minHeight:'100vh', background:'#F7F7F5', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'36px', height:'36px', border:`2px solid rgba(199,166,106,0.15)`, borderTop:`2px solid ${GOLD}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  /* اگه لاگین هست صبر کن redirect بشه */
  if (user) return null;

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes ambient { 0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-15px);} }

        .field-wrap {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.78);
          border-radius: 14px;
          transition: all 0.3s;
          backdrop-filter: blur(20px) saturate(1.5);
        }
        .field-wrap.focused {
          background: rgba(255,255,255,0.90);
          box-shadow: 0 0 0 2px rgba(199,166,106,0.30);
        }
        .field-wrap.error-field {
          box-shadow: 0 0 0 2px rgba(239,68,68,0.25);
        }
        .field-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 15px 16px;
          font-size: 15px;
          color: #1C1C1A;
          font-family: inherit;
          direction: ltr;
          text-align: right;
        }
        .field-input::placeholder { color: rgba(28,28,26,0.30); direction: rtl; }
        .field-icon {
          padding: 0 14px 0 0;
          color: rgba(28,28,26,0.30);
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: color 0.3s;
        }
        .field-wrap.focused .field-icon { color: ${GOLD}; }

        .login-btn {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          background: rgba(199,166,106,0.06);
          backdrop-filter: blur(40px) saturate(240%);
          -webkit-backdrop-filter: blur(40px) saturate(240%);
          border: 1px solid rgba(199,166,106,0.22);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 32px rgba(199,166,106,0.16);
          color: ${GOLD};
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.02em;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .login-btn::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          pointer-events: none;
        }
        .login-btn:not(:disabled):hover {
          transform: translateY(-2px);
          background: rgba(199,166,106,0.10);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 40px rgba(199,166,106,0.24);
        }
        .login-btn:not(:disabled):active { transform: scale(0.98); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div style={{ minHeight:'100vh', backgroundColor:'#F7F7F5', background:'linear-gradient(180deg,#F0EDE4 0%,#F7F7F5 100%)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'clamp(16px,4vh,40px) 24px', position:'relative', overflow:'hidden' }}>

        {/* Ambient orbs */}
        <div style={{ position:'fixed', top:'-10%', left:'-10%', width:'55vw', height:'55vw', maxWidth:'600px', maxHeight:'600px', borderRadius:'50%', background:`radial-gradient(ellipse,rgba(199,166,106,0.08) 0%,transparent 65%)`, filter:'blur(40px)', pointerEvents:'none', animation:'ambient 14s ease-in-out infinite' }} />
        <div style={{ position:'fixed', bottom:'-10%', right:'-10%', width:'45vw', height:'45vw', maxWidth:'500px', maxHeight:'500px', borderRadius:'50%', background:`radial-gradient(ellipse,rgba(140,106,34,0.05) 0%,transparent 65%)`, filter:'blur(40px)', pointerEvents:'none', animation:'ambient 18s ease-in-out infinite reverse' }} />

        {/* Card */}
        <div style={{ width:'100%', maxWidth:'420px', animation:'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both' }}>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:'10px', textDecoration:'none', marginBottom:'8px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'14px', overflow:'hidden', boxShadow:`0 8px 24px rgba(199,166,106,0.35)`, flexShrink:0 }}>
                <img src="/images/Logo/logo1.jpeg?v=3" alt="بیلیارد هاب" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <span style={{ fontSize: '24px', fontWeight:900, color:'#1C1C1A', letterSpacing:'-0.025em' }}>
                بیلیارد <span style={{ background:`linear-gradient(135deg,${GOLD},#A07840)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>هاب</span>
              </span>
            </Link>
            <div style={{ fontSize: '15px', color:'rgba(28,28,26,0.45)', marginTop:'4px' }}>
              به پلتفرم تخصصی بیلیارد ایران خوش آمدید
            </div>
          </div>

          {/* Form card */}
          <div style={{ background:'rgba(255,255,255,0.78)', border:'1px solid rgba(28,28,26,0.08)', borderRadius:'24px', padding:'clamp(24px,5vw,36px)', backdropFilter:'blur(20px) saturate(1.5)', boxShadow:'0 24px 80px rgba(28,28,26,0.10)', position:'relative', overflow:'hidden' }}>

            {/* Top gold line */}
            <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'140px', height:'1px', background:`linear-gradient(90deg,transparent,rgba(199,166,106,0.7),transparent)`, boxShadow:`0 0 16px rgba(199,166,106,0.4)` }} />

            <h1 style={{ fontSize: '24px', fontWeight:900, color:'#1C1C1A', margin:'0 0 6px', letterSpacing:'-0.025em', textAlign:'center' }}>
              ورود به حساب
            </h1>
            <p style={{ fontSize: '15px', color:'rgba(28,28,26,0.45)', textAlign:'center', margin:'0 0 28px' }}>
              با شماره موبایل خود وارد شوید
            </p>

            {/* Error */}
            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'13px 16px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'12px', marginBottom:'20px' }}>
                <AlertCircle size={15} style={{ color:'#ef4444', flexShrink:0 }} />
                <span style={{ fontSize: '15px', color:'#dc2626', flex:1 }}>{error}</span>
              </div>
            )}

            {/* Phone */}
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize: '14px', fontWeight:600, color:'rgba(28,28,26,0.48)', marginBottom:'8px', letterSpacing:'0.03em' }}>
                شماره موبایل
              </label>
              <div className={`field-wrap ${phoneFocus ? 'focused' : ''} ${error && !phone ? 'error-field' : ''}`}
                style={{ border:`1px solid ${phoneFocus ? `rgba(199,166,106,0.5)` : 'rgba(28,28,26,0.10)'}` }}>
                <span className="field-icon"><Phone size={16} /></span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                  onFocus={() => setPhoneFocus(true)}
                  onBlur={() => setPhoneFocus(false)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="field-input"
                  placeholder="09121234567"
                  maxLength={11}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize: '14px', fontWeight:600, color:'rgba(28,28,26,0.48)', marginBottom:'8px', letterSpacing:'0.03em' }}>
                رمز عبور
              </label>
              <div className={`field-wrap ${passFocus ? 'focused' : ''} ${error && !password ? 'error-field' : ''}`}
                style={{ border:`1px solid ${passFocus ? `rgba(199,166,106,0.5)` : 'rgba(28,28,26,0.10)'}` }}>
                <span className="field-icon"><Lock size={16} /></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="field-input"
                  placeholder="رمز عبور"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ padding:'0 14px 0 16px', background:'none', border:'none', cursor:'pointer', color:'rgba(28,28,26,0.30)', display:'flex', alignItems:'center', transition:'color 0.2s', flexShrink:0 }}
                  onMouseEnter={e => { (e.currentTarget).style.color = 'rgba(28,28,26,0.65)'; }}
                  onMouseLeave={e => { (e.currentTarget).style.color = 'rgba(28,28,26,0.30)'; }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button className="login-btn" onClick={handleLogin} disabled={loading}>
              {loading ? (
                <>
                  <div style={{ width:'18px', height:'18px', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                  در حال ورود...
                </>
              ) : 'ورود به حساب'}
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'20px 0' }}>
              <div style={{ flex:1, height:'1px', background:'rgba(28,28,26,0.08)' }} />
              <span style={{ fontSize: '13px', color:'rgba(28,28,26,0.30)' }}>یا</span>
              <div style={{ flex:1, height:'1px', background:'rgba(28,28,26,0.08)' }} />
            </div>

            {/* Register link */}
            <p style={{ textAlign:'center', fontSize: '15px', color:'rgba(28,28,26,0.48)', margin:0 }}>
              حساب ندارید؟{' '}
              <Link href="/register" style={{ color:GOLD, fontWeight:700, textDecoration:'none', transition:'opacity 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
                ثبت نام کنید
              </Link>
            </p>
          </div>

          {/* Back link */}
          <div style={{ textAlign:'center', marginTop:'20px' }}>
            <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize: '14px', color:'rgba(28,28,26,0.38)', textDecoration:'none', transition:'color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(28,28,26,0.65)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(28,28,26,0.38)'; }}>
              <ArrowLeft size={12} /> بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
