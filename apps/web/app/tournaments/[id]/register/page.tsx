'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronRight, CheckCircle2, AlertCircle, User, CreditCard, Loader2, Download,
} from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, formatFee, toFa,
} from '../../../../lib/mock-tournaments';
import { useAuthStore } from '../../../../store/auth.store';
import Link from 'next/link';

type Step = 'confirm' | 'pay-loading' | 'receipt';

function nowFa(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return toFa(
    `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} — ${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export default function RegisterPage() {
  const { id }  = useParams() as { id: string };
  const router  = useRouter();
  const t       = SAMPLE_TOURNAMENTS.find(x => x.id === id) ?? SAMPLE_TOURNAMENTS[0]!;

  const { user, _hydrated } = useAuthStore();
  const isLoggedIn = !!user;
  const userName   = user ? `${user.firstName} ${user.lastName}` : '';

  const [step, setStep]           = useState<Step>('confirm');
  const [showAlert, setAlert]     = useState(false);
  const [alreadyReg, setAlreadyReg] = useState(false);
  const [receiptDate]             = useState(nowFa);

  const [trackingCode] = useState(
    () => toFa(14031) + '-' + toFa(Math.floor(10000 + Math.random() * 90000))
  );

  const registeredRef = useRef(false);

  /* Check for duplicate registration on mount */
  useEffect(() => {
    if (!user?.phone) return;
    try {
      const existing = JSON.parse(localStorage.getItem(`tournament-regs-${id}`) ?? '[]') as Array<{ phone?: string }>;
      if (existing.some(r => r.phone === user.phone)) setAlreadyReg(true);
    } catch {}
  }, [id, user?.phone]);

  /* Save new registration to localStorage when receipt step is entered */
  useEffect(() => {
    if (step !== 'receipt' || registeredRef.current) return;
    registeredRef.current = true;
    const newReg = {
      id: `reg-${Date.now()}`,
      tournamentId: id,
      playerName: userName || 'بازیکن مهمان',
      phone: user?.phone ?? '',
      playerInfo: '',
      receiptNote: `کد پیگیری: ${trackingCode}`,
      status: 'pending' as const,
      registeredAt: receiptDate,
    };
    try {
      const existing = JSON.parse(localStorage.getItem(`tournament-regs-${id}`) ?? '[]') as Array<{ phone?: string }>;
      if (existing.some(r => r.phone === user?.phone)) return;
      localStorage.setItem(`tournament-regs-${id}`, JSON.stringify([...existing, newReg]));
    } catch {}
  }, [step, id, userName, trackingCode, receiptDate, user?.phone]);

  const handlePay = () => {
    if (!isLoggedIn) { setAlert(true); return; }
    try {
      const existing = JSON.parse(localStorage.getItem(`tournament-regs-${id}`) ?? '[]') as Array<{ phone?: string }>;
      if (existing.some(r => r.phone === user?.phone)) { setAlreadyReg(true); return; }
    } catch {}
    setAlert(false);
    setStep('pay-loading');
    setTimeout(() => setStep('receipt'), 2400);
  };

  const downloadReceipt = () => {
    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>فیش واریزی — بیلیارد هاب</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Vazirmatn',Tahoma,Arial,sans-serif;background:#F7F7F5;min-height:100vh;
         display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border-radius:20px;overflow:hidden;max-width:400px;width:100%;
          box-shadow:0 8px 40px rgba(0,0,0,0.12)}
    .hd{background:linear-gradient(135deg,#1a1a1a,#2a2a2a);padding:24px;text-align:center}
    .logo{font-size:16px;font-weight:900;color:#C7A66A;letter-spacing:.12em;margin-bottom:4px}
    .sub{font-size:12px;color:rgba(255,255,255,.45)}
    .amt{text-align:center;padding:28px 24px 20px;border-bottom:1px solid #f0f0f0}
    .ic{width:56px;height:56px;border-radius:50%;background:rgba(48,197,90,.10);
        border:2px solid rgba(48,197,90,.25);display:flex;align-items:center;
        justify-content:center;margin:0 auto 14px;font-size:26px;color:#30C55A}
    .ok{font-size:20px;font-weight:900;color:#111;margin-bottom:6px}
    .price{font-size:34px;font-weight:900;color:#C7A66A}
    .rows{padding:16px 24px}
    .row{display:flex;justify-content:space-between;padding:11px 0;
         border-bottom:1px solid #f5f5f5;font-size:14px}
    .row:last-child{border-bottom:none}
    .lbl{color:#aaa}
    .val{font-weight:700;color:#111}
    .val.g{color:#30C55A}
    .ft{text-align:center;padding:14px;background:#fafafa;font-size:12px;
        color:#bbb;border-top:1px solid #f0f0f0}
    @media print{body{background:#fff}.card{box-shadow:none}}
  </style>
</head>
<body>
  <div class="card">
    <div class="hd">
      <div class="logo">BILLIARD HUB</div>
      <div class="sub">فیش پرداخت آنلاین</div>
    </div>
    <div class="amt">
      <div class="ic">✓</div>
      <div class="ok">پرداخت موفق</div>
      <div class="price">${formatFee(t.entryFee)}</div>
    </div>
    <div class="rows">
      <div class="row"><span class="lbl">نام بازیکن</span><span class="val">${userName}</span></div>
      <div class="row"><span class="lbl">مسابقه</span><span class="val">${t.name}</span></div>
      <div class="row"><span class="lbl">باشگاه</span><span class="val">${t.clubName}</span></div>
      <div class="row"><span class="lbl">کد پیگیری</span><span class="val">${trackingCode}</span></div>
      <div class="row"><span class="lbl">تاریخ پرداخت</span><span class="val">${receiptDate}</span></div>
      <div class="row"><span class="lbl">وضعیت</span><span class="val g">ثبت‌نام تأیید شد ✓</span></div>
    </div>
    <div class="ft">billiardhub.net</div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'فیش_واریزی_بیلیارد_هاب.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ─── Loading ─────────────────────────────────────────────────── */
  if (!_hydrated) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%',
        border: '2px solid rgba(199,166,106,0.15)',
        borderTop: '2px solid #C7A66A', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ─── Shared header ───────────────────────────────────────────── */
  const Header = () => (
    <div style={{
      background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
      padding: '18px clamp(16px,4vw,48px)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => router.push(`/tournaments/${t.id}`)} style={{
          display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 15, color: '#777', fontFamily: 'inherit', padding: 0,
        }}>
          <ChevronRight size={16} /> بازگشت
        </button>
        <span style={{ color: 'rgba(0,0,0,0.15)' }}>›</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>ثبت‌نام</span>
      </div>
    </div>
  );

  /* ─── Already registered ─────────────────────────────────────── */
  if (alreadyReg) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif' }}>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 62px)', padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 4px 30px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(199,166,106,0.12)', border: '2px solid rgba(199,166,106,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 size={30} color="#C7A66A" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 10 }}>قبلاً ثبت‌نام کرده‌اید</div>
          <div style={{ fontSize: 14, color: '#888', lineHeight: 1.8, marginBottom: 28 }}>
            شماره موبایل شما قبلاً در این مسابقه ثبت‌نام شده است.<br />
            وضعیت ثبت‌نام را در پنل کاربری دنبال کنید.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/dashboard')} style={{ background: '#C7A66A', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              پنل کاربری
            </button>
            <button onClick={() => router.push(`/tournaments/${t.id}`)} style={{ background: 'rgba(0,0,0,0.06)', color: '#555', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              بازگشت به مسابقه
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── Shared tournament mini-card ──────────────────────────────── */
  const TCard = () => (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '14px 16px',
      border: '1px solid rgba(199,166,106,0.22)',
      display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
    }}>
      <img src={t.banner} alt="" style={{
        width: 54, height: 54, objectFit: 'cover', borderRadius: 12, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t.name}
        </div>
        <div style={{ fontSize: 13, color: '#999', marginTop: 3 }}>
          {t.date} • {t.clubName}
        </div>
      </div>
      <div style={{ fontSize: 19, fontWeight: 900, color: '#C7A66A', flexShrink: 0 }}>
        {formatFee(t.entryFee)}
      </div>
    </div>
  );

  /* ─── Gateway loading / success ────────────────────────────────── */
  if (step === 'pay-loading') return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif' }}>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 62px)', padding: '20px' }}>
        <div style={{
          background: 'linear-gradient(145deg,#0f172a,#1e293b)',
          borderRadius: 28, padding: '44px 36px', maxWidth: 400, width: '100%',
          textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
        }}>
          {/* Bank name chips */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
            {['ملت', 'صادرات', 'پاسارگاد', 'ملی'].map(b => (
              <div key={b} style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.40)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}>{b}</div>
            ))}
          </div>
          <Loader2 size={52} color="#C7A66A"
            style={{ animation: 'spin 1s linear infinite', marginBottom: 20 }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
            در حال اتصال به درگاه…
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>لطفاً صبر کنید</div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ─── Receipt ───────────────────────────────────────────────────── */
  if (step === 'receipt') return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 60 }}>
      <Header />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px clamp(16px,4vw,32px)' }}>

        {/* Receipt card */}
        <div style={{
          background: '#fff', borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)', marginBottom: 14,
        }}>
          {/* Dark header */}
          <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)',
            padding: '22px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#C7A66A',
              letterSpacing: '0.12em', marginBottom: 4 }}>BILLIARD HUB</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)' }}>فیش پرداخت آنلاین</div>
          </div>

          {/* Amount + success */}
          <div style={{ textAlign: 'center', padding: '28px 24px 20px',
            borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(48,197,90,0.10)', border: '2px solid rgba(48,197,90,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle2 size={32} color="#30C55A" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 8 }}>
              پرداخت موفق
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#C7A66A' }}>
              {formatFee(t.entryFee)}
            </div>
          </div>

          {/* Details rows */}
          <div style={{ padding: '16px 28px' }}>
            {[
              { label: 'نام بازیکن', value: userName, mono: false },
              { label: 'مسابقه', value: t.name, mono: false },
              { label: 'باشگاه', value: t.clubName, mono: false },
              { label: 'کد پیگیری', value: trackingCode, mono: true },
              { label: 'تاریخ پرداخت', value: receiptDate, mono: true },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: 14,
              }}>
                <span style={{ color: '#aaa' }}>{row.label}</span>
                <span style={{
                  fontWeight: 700, color: '#111',
                  fontFamily: row.mono ? 'system-ui,-apple-system,sans-serif' : 'inherit',
                  maxWidth: '60%', textAlign: 'left', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{row.value}</span>
              </div>
            ))}
            {/* Status row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', fontSize: 14,
            }}>
              <span style={{ color: '#aaa' }}>وضعیت ثبت‌نام</span>
              <span style={{
                fontWeight: 700, color: '#f59e0b',
                background: 'rgba(245,158,11,0.08)',
                padding: '4px 10px', borderRadius: 20,
                border: '1px solid rgba(245,158,11,0.25)',
                fontSize: 13,
              }}>
                ⏳ در انتظار تأیید
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 28px', background: '#fafafa',
            textAlign: 'center', fontSize: 12, color: '#bbb',
            borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            billiardhub.net
          </div>
        </div>

        {/* Download button */}
        <button onClick={downloadReceipt} style={{
          width: '100%', padding: '15px', borderRadius: 16, border: 'none',
          background: 'linear-gradient(135deg,#C7A66A,#A07840)',
          color: '#fff', fontSize: 16, fontWeight: 800,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 16px rgba(199,166,106,0.28)', marginBottom: 10,
        }}>
          <Download size={18} />
          دانلود فیش واریزی
        </button>

        <button onClick={() => router.push(`/tournaments/${t.id}`)} style={{
          width: '100%', padding: '14px', borderRadius: 16,
          border: '1.5px solid rgba(0,0,0,0.10)', background: '#fff',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          color: '#555', fontFamily: 'inherit',
        }}>
          بازگشت به مسابقه
        </button>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#555', marginTop: 14, lineHeight: 1.8 }}>
          جهت مشاهده وضعیت ثبت‌نام به{' '}
          <Link href="/dashboard" style={{ color: '#C7A66A', fontWeight: 700 }}>
            پنل کاربری
          </Link>
          {' '}خود مراجعه کنید
        </p>
      </div>
    </div>
  );

  /* ─── Confirm (default) ─────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 60 }}>
      <Header />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px clamp(16px,4vw,32px)' }}>
        <TCard />

        {/* Not-logged-in alert */}
        {showAlert && (
          <div style={{
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)',
            borderRadius: 16, padding: '18px 18px', marginBottom: 16,
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 4 }}>
                ابتدا وارد سایت شوید
              </div>
              <div style={{ fontSize: 14, color: '#777', lineHeight: 1.7, marginBottom: 14 }}>
                برای ثبت‌نام در مسابقه باید عضو بیلیارد هاب باشید.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <button style={{
                    padding: '9px 20px', borderRadius: 10, border: 'none',
                    background: '#111', color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>ورود به سایت</button>
                </Link>
                <Link href="/register" style={{ textDecoration: 'none' }}>
                  <button style={{
                    padding: '9px 20px', borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.12)', background: '#fff',
                    color: '#333', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>ثبت‌نام در سایت</button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 24, padding: '28px 24px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

          {/* Logged-in user card */}
          {isLoggedIn && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24,
              padding: '14px 16px', background: '#F7F7F5', borderRadius: 16,
              border: '1px solid rgba(0,0,0,0.06)',
            }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%',
                background: 'rgba(199,166,106,0.12)', border: '2px solid rgba(199,166,106,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={20} color="#C7A66A" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{userName}</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>ثبت‌نام‌کننده</div>
              </div>
              <div style={{ fontSize: 12, color: '#30C55A', fontWeight: 700,
                background: 'rgba(48,197,90,0.08)', padding: '4px 10px',
                borderRadius: 20, border: '1px solid rgba(48,197,90,0.18)' }}>
                احراز هویت شده ✓
              </div>
            </div>
          )}

          {/* Amount */}
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 14, color: '#aaa', marginBottom: 4 }}>مبلغ ورودی</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#C7A66A' }}>
                {formatFee(t.entryFee)}
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 3 }}>
                {toFa(t.registeredCount)} / {toFa(t.maxPlayers)} ثبت‌نام
              </div>
              <div style={{ fontSize: 13, color: '#aaa' }}>مهلت: {t.registrationDeadline}</div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', marginBottom: 24 }} />

          {/* Info box */}
          <div style={{
            background: 'rgba(48,197,90,0.04)', border: '1px solid rgba(48,197,90,0.16)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 22,
            fontSize: 13, color: '#555', lineHeight: 1.7,
          }}>
            ✓ پس از پرداخت آنلاین، فیش واریزی قابل دانلود خواهد بود. جهت مشاهده وضعیت ثبت‌نام به پنل کاربری خود مراجعه کنید.
          </div>

          {/* CTA */}
          <button onClick={handlePay} style={{
            width: '100%', padding: '16px', borderRadius: 20,
            background: 'rgba(199,166,106,0.10)',
            border: '1px solid rgba(199,166,106,0.35)',
            color: '#C7A66A', fontSize: 16, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <CreditCard size={18} />
            واریز مبلغ ورودی
          </button>

          <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center',
            margin: '12px 0 0', lineHeight: 1.6 }}>
            پرداخت از طریق درگاه آنلاین — بدون نیاز به آپلود فیش
          </p>
        </div>
      </div>
    </div>
  );
}
