'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, Upload, Check, Clock, AlertCircle,
  User, CreditCard, Loader2, CheckCircle2,
} from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, formatFee, toFa,
} from '../../../../lib/mock-tournaments';
import { useAuthStore } from '../../../../store/auth.store';

type Step = 'confirm' | 'pay-loading' | 'pay-success' | 'upload' | 'pending';

export default function RegisterPage() {
  const { id }  = useParams() as { id: string };
  const router  = useRouter();
  const t       = SAMPLE_TOURNAMENTS.find(x => x.id === id) ?? SAMPLE_TOURNAMENTS[0]!;

  const { user, _hydrated } = useAuthStore();
  const isLoggedIn = !!user;
  const userName   = user ? `${user.firstName} ${user.lastName}` : '';

  const [step, setStep]           = useState<Step>('confirm');
  const [showAlert, setShowAlert] = useState(false);
  const [receiptFile, setReceipt] = useState<string | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [trackingCode]            = useState(
    () => toFa(14031) + '-' + toFa(Math.floor(10000 + Math.random() * 90000))
  );

  const handlePay = () => {
    if (!isLoggedIn) { setShowAlert(true); return; }
    setShowAlert(false);
    setStep('pay-loading');
    setTimeout(() => setStep('pay-success'), 2400);
  };

  /* ─── Loading (store not hydrated yet) ─────────────────────── */
  if (!_hydrated) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%',
        border: '2px solid rgba(199,166,106,0.15)',
        borderTop: '2px solid #C7A66A', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ─── Shared: sticky header ─────────────────────────────────── */
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
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>ثبت‌نام آنلاین</span>
      </div>
    </div>
  );

  /* ─── Shared: tournament mini-card ─────────────────────────── */
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

  /* ─── State: pending ─────────────────────────────────────────── */
  if (step === 'pending') return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif' }}>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', minHeight: 'calc(100vh - 62px)' }}>
        <div style={{ background: '#fff', borderRadius: 28, padding: '48px 32px',
          maxWidth: 440, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 48px rgba(0,0,0,0.10)' }}>

          <div style={{ width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(245,158,11,0.10)', border: '2px solid rgba(245,158,11,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', animation: 'softp 2.5s ease-in-out infinite' }}>
            <Clock size={34} color="#f59e0b" />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 12px' }}>
            در انتظار تایید مدیر
          </h2>
          <p style={{ fontSize: 15, color: '#777', lineHeight: 1.85, margin: '0 0 28px' }}>
            فیش پرداخت شما دریافت شد.<br />
            <strong style={{ color: '#111' }}>{userName}</strong> عزیز،
            مدیر باشگاه در اسرع وقت بررسی و تایید خواهد کرد.
          </p>

          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
            borderRadius: 14, padding: '14px 18px', marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'right' }}>
            <AlertCircle size={17} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: '#777', lineHeight: 1.6 }}>
              پس از تایید، اطلاع‌رسانی خواهید شد
            </div>
          </div>

          <button onClick={() => router.push(`/tournaments/${t.id}`)} style={{
            width: '100%', padding: '14px', borderRadius: 14,
            border: '1.5px solid rgba(0,0,0,0.10)', background: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            color: '#555', fontFamily: 'inherit',
          }}>
            بازگشت به مسابقه
          </button>
        </div>
      </div>
      <style>{`@keyframes softp{0%,100%{opacity:1}50%{opacity:0.55}}`}</style>
    </div>
  );

  /* ─── State: upload receipt ──────────────────────────────────── */
  if (step === 'upload') return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 60 }}>
      <Header />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px clamp(16px,4vw,32px)' }}>
        <TCard />

        <div style={{ background: '#fff', borderRadius: 24, padding: '28px 24px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

          {/* Payment confirmed row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
            padding: '14px 16px', background: 'rgba(48,197,90,0.05)',
            borderRadius: 14, border: '1px solid rgba(48,197,90,0.18)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10,
              background: 'rgba(48,197,90,0.12)', border: '1px solid rgba(48,197,90,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={18} color="#30C55A" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>پرداخت موفق — {formatFee(t.entryFee)}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>کد پیگیری: {trackingCode}</div>
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>
            آپلود فیش پرداخت
          </h3>
          <p style={{ fontSize: 14, color: '#888', margin: '0 0 20px', lineHeight: 1.7 }}>
            تصویر رسید یا اسکرین‌شات پرداخت را برای باشگاه ارسال کنید.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); setReceipt('receipt.jpg'); }}
            onClick={() => setReceipt('receipt.jpg')}
            style={{
              border: `2px dashed ${dragging ? '#C7A66A' : receiptFile ? '#30C55A' : 'rgba(0,0,0,0.12)'}`,
              borderRadius: 16, padding: '36px 20px', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s', marginBottom: 20,
              background: receiptFile
                ? 'rgba(48,197,90,0.04)'
                : dragging ? 'rgba(199,166,106,0.04)' : '#fafafa',
            }}
          >
            {receiptFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12,
                  background: 'rgba(48,197,90,0.12)', border: '1px solid rgba(48,197,90,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={22} color="#30C55A" />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>فیش آپلود شد ✓</div>
                  <div style={{ fontSize: 13, color: '#30C55A', marginTop: 2 }}>{receiptFile}</div>
                </div>
              </div>
            ) : (
              <>
                <Upload size={32} color="#C7A66A" style={{ opacity: 0.55, marginBottom: 12 }} />
                <p style={{ fontSize: 15, color: '#777', margin: '0 0 4px', fontWeight: 600 }}>
                  کلیک کنید یا فایل را بکشید
                </p>
                <p style={{ fontSize: 13, color: '#bbb', margin: 0 }}>PNG · JPG · PDF</p>
              </>
            )}
          </div>

          <button
            onClick={() => receiptFile && setStep('pending')}
            disabled={!receiptFile}
            style={{
              width: '100%', padding: '15px', borderRadius: 16, border: 'none',
              fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
              cursor: receiptFile ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
              background: receiptFile
                ? 'linear-gradient(135deg,#C7A66A,#A07840)' : 'rgba(0,0,0,0.07)',
              color: receiptFile ? '#fff' : '#bbb',
              boxShadow: receiptFile ? '0 4px 16px rgba(199,166,106,0.28)' : 'none',
            }}>
            ارسال فیش و تکمیل ثبت‌نام
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── State: gateway (loading / success) ────────────────────── */
  if (step === 'pay-loading' || step === 'pay-success') return (
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
          {/* Bank logos */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
            {['ملت', 'صادرات', 'پاسارگاد', 'ملی'].map(b => (
              <div key={b} style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.40)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}>{b}</div>
            ))}
          </div>

          {step === 'pay-loading' ? (
            <>
              <Loader2 size={52} color="#C7A66A"
                style={{ animation: 'spin 1s linear infinite', marginBottom: 20 }} />
              <div style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
                در حال اتصال به درگاه…
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>لطفاً صبر کنید</div>
            </>
          ) : (
            <>
              <div style={{ width: 76, height: 76, borderRadius: '50%',
                background: 'rgba(48,197,90,0.12)', border: '2px solid rgba(48,197,90,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px' }}>
                <CheckCircle2 size={38} color="#30C55A" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
                پرداخت موفق
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#C7A66A', marginBottom: 6 }}>
                {formatFee(t.entryFee)}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', marginBottom: 32 }}>
                کد پیگیری: {trackingCode}
              </div>
              <button onClick={() => setStep('upload')} style={{
                width: '100%', padding: '14px', borderRadius: 14,
                background: 'rgba(199,166,106,0.14)',
                border: '1px solid rgba(199,166,106,0.35)',
                color: '#C7A66A', fontSize: 15, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                آپلود فیش پرداخت ←
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ─── State: confirm (default) ───────────────────────────────── */
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

          {/* Fee */}
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

          {/* CTA */}
          <button onClick={handlePay} style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: 'linear-gradient(135deg,#C7A66A,#A07840)',
            color: '#fff', fontSize: 16, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(199,166,106,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <CreditCard size={18} />
            پرداخت مبلغ ورودی و ثبت‌نام
          </button>

          <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center',
            margin: '12px 0 0', lineHeight: 1.6 }}>
            پس از پرداخت، فیش را آپلود می‌کنید — مدیر باشگاه تایید خواهد کرد
          </p>
        </div>

      </div>
    </div>
  );
}
