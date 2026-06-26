'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronRight, Upload, Check, X, Clock, AlertCircle, User, Phone,
} from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, formatFee, toFa, GAME_TYPE_LABELS,
} from '../../../../lib/mock-tournaments';

type RegistrationState = 'form' | 'pending' | 'approved' | 'rejected';

export default function RegisterPage() {
  const { id }  = useParams() as { id: string };
  const router  = useRouter();
  const t       = SAMPLE_TOURNAMENTS.find(x => x.id === id) ?? SAMPLE_TOURNAMENTS[0]!;

  const [state, setState]         = useState<RegistrationState>('form');
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [info, setInfo]           = useState('');
  const [receiptNote, setNote]    = useState('');
  const [receiptFile, setFile]    = useState<string | null>(null);
  const [dragging, setDragging]   = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 14,
    border: '1.5px solid rgba(0,0,0,0.10)', background: '#fff',
    fontSize: 14, fontFamily: 'Vazirmatn, sans-serif', color: '#111',
    outline: 'none', boxSizing: 'border-box',
  };

  const handleSubmit = () => {
    if (!name || !phone) return;
    setState('pending');
  };

  /* ── State: Pending ── */
  if (state === 'pending') return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px', paddingTop: 88 }}>
      <div style={{ background: '#fff', borderRadius: 28, padding: '48px 36px',
        maxWidth: 460, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 48px rgba(0,0,0,0.10)', border: '1px solid rgba(0,0,0,0.06)' }}>

        <div style={{ width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(245,158,11,0.10)', border: '2px solid rgba(245,158,11,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', animation: 'softp 2.5s ease-in-out infinite' }}>
          <Clock size={34} color="#f59e0b" />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 10px' }}>
          ثبت‌نام در انتظار تایید
        </h2>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.8, margin: '0 0 10px' }}>
          درخواست ثبت‌نام <strong style={{ color: '#111' }}>{name}</strong> دریافت شد.
        </p>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.8, margin: '0 0 28px' }}>
          مدیر باشگاه رسید پرداخت شما را بررسی کرده و در اسرع وقت تایید خواهد کرد.
        </p>

        <div style={{
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 12, textAlign: 'right',
        }}>
          <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 3 }}>
              لطفا صبر کنید
            </div>
            <div style={{ fontSize: 12, color: '#777' }}>
              پس از تایید، اطلاعات بیشتری دریافت خواهید کرد
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push(`/tournaments/${t.id}`)} style={{
            flex: 1, padding: '13px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.10)',
            background: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            color: '#555', fontFamily: 'inherit',
          }}>
            بازگشت به مسابقه
          </button>
          <button onClick={() => setState('approved')} style={{
            flex: 1, padding: '13px', borderRadius: 14, border: 'none',
            background: 'rgba(245,158,11,0.10)', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', color: '#f59e0b', fontFamily: 'inherit',
          }}>
            دمو: تایید شد ✓
          </button>
        </div>
      </div>
      <style>{`@keyframes softp{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
    </div>
  );

  /* ── State: Approved ── */
  if (state === 'approved') return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px', paddingTop: 88 }}>
      <div style={{ background: '#fff', borderRadius: 28, padding: '48px 36px',
        maxWidth: 460, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 48px rgba(0,0,0,0.10)' }}>

        <div style={{ width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(48,197,90,0.10)', border: '2px solid rgba(48,197,90,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px' }}>
          <Check size={36} color="#30C55A" />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 10px' }}>
          ثبت‌نام تایید شد! 🎉
        </h2>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.8, margin: '0 0 24px' }}>
          تبریک! ثبت‌نام شما در مسابقه <strong style={{ color: '#111' }}>{t.name}</strong> تایید شد.
        </p>

        <div style={{ background: '#F7F7F5', borderRadius: 16, padding: '18px 20px',
          marginBottom: 28, textAlign: 'right' }}>
          {[
            { label: 'نام بازیکن', value: name },
            { label: 'مسابقه', value: t.name },
            { label: 'تاریخ', value: t.date },
            { label: 'ساعت شروع', value: toFa(t.startTime) },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)',
              fontSize: 13,
            }}>
              <span style={{ color: '#aaa' }}>{row.label}</span>
              <span style={{ fontWeight: 700, color: '#111' }}>{row.value}</span>
            </div>
          ))}
        </div>

        <button onClick={() => router.push(`/tournaments/${t.id}/live`)} style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg,#C7A66A,#A07840)',
          color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
          fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(199,166,106,0.28)',
        }}>
          مشاهده براکت مسابقه
        </button>
      </div>
    </div>
  );

  /* ── State: Rejected ── */
  if (state === 'rejected') return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px', paddingTop: 88 }}>
      <div style={{ background: '#fff', borderRadius: 28, padding: '48px 36px',
        maxWidth: 460, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 48px rgba(0,0,0,0.10)' }}>

        <div style={{ width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(239,68,68,0.10)', border: '2px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px' }}>
          <X size={36} color="#ef4444" />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 10px' }}>
          ثبت‌نام رد شد
        </h2>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.8, margin: '0 0 24px' }}>
          متاسفانه ثبت‌نام شما تایید نشد. لطفا با باشگاه تماس بگیرید.
        </p>

        <button onClick={() => setState('form')} style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          background: 'rgba(239,68,68,0.10)', color: '#ef4444',
          fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ثبت‌نام مجدد
        </button>
      </div>
    </div>
  );

  /* ── State: Form ── */
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '20px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push(`/tournaments/${t.id}`)} style={{
            display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 14, color: '#777', fontFamily: 'inherit',
          }}>
            <ChevronRight size={16} /> بازگشت
          </button>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111', flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ثبت‌نام در {t.name}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px clamp(16px,4vw,48px)' }}>

        {/* Tournament summary */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 20,
          border: '1px solid rgba(199,166,106,0.20)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <img src={t.banner} alt="" style={{ width: 60, height: 60, objectFit: 'cover',
            borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111', lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.name}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              {t.date} • {GAME_TYPE_LABELS[t.gameType]}
            </div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#C7A66A', flexShrink: 0 }}>
            {formatFee(t.entryFee)}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: 'clamp(20px,4vw,36px)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: '0 0 24px' }}>
            اطلاعات ثبت‌نام
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#444',
                display: 'block', marginBottom: 8 }}>
                نام و نام خانوادگی <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }} />
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="نام کامل خود را وارد کنید"
                  style={{ ...inputStyle, paddingRight: 42 }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#444',
                display: 'block', marginBottom: 8 }}>
                شماره موبایل <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }} />
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="09xx-xxx-xxxx" dir="ltr"
                  style={{ ...inputStyle, paddingRight: 42 }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#444',
                display: 'block', marginBottom: 8 }}>
                اطلاعات بازیکن (اختیاری)
              </label>
              <textarea value={info} onChange={e => setInfo(e.target.value)}
                placeholder="سابقه بازی، سطح مهارت، باشگاه قبلی..."
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
            </div>
          </div>

          {/* Payment section */}
          {t.paymentMethod === 'card_transfer' && (
            <div style={{ marginTop: 28 }}>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 0 28px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 16px' }}>
                پرداخت حق ثبت‌نام
              </h3>

              <div style={{
                background: 'rgba(199,166,106,0.06)', borderRadius: 16, padding: '16px 18px',
                marginBottom: 20, border: '1px solid rgba(199,166,106,0.18)',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#C7A66A', marginBottom: 4 }}>
                  مبلغ را به کارت زیر انتقال دهید:
                </div>
                {[
                  { label: 'مبلغ', value: formatFee(t.entryFee) },
                  { label: 'شماره کارت', value: t.cardNumber ?? '', ltr: true },
                  { label: 'صاحب حساب', value: t.cardHolder ?? '' },
                  { label: 'بانک', value: t.bankName ?? '' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: '#888' }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: '#111',
                      direction: row.ltr ? 'ltr' : 'inherit' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Receipt upload */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#444',
                  display: 'block', marginBottom: 10 }}>
                  آپلود تصویر رسید
                </label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); setFile('receipt.jpg'); }}
                  onClick={() => setFile('receipt.jpg')}
                  style={{
                    border: `2px dashed ${dragging ? '#C7A66A' : receiptFile ? '#30C55A' : 'rgba(0,0,0,0.12)'}`,
                    borderRadius: 16, padding: '28px 20px', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: receiptFile ? 'rgba(48,197,90,0.04)' : dragging ? 'rgba(199,166,106,0.04)' : '#fafafa',
                  }}
                >
                  {receiptFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10,
                        background: 'rgba(48,197,90,0.12)', border: '1px solid rgba(48,197,90,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={18} color="#30C55A" />
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>رسید آپلود شد</div>
                        <div style={{ fontSize: 12, color: '#30C55A' }}>{receiptFile}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={28} color="#C7A66A" style={{ opacity: 0.6, marginBottom: 10 }} />
                      <p style={{ fontSize: 14, color: '#777', margin: '0 0 4px', fontWeight: 600 }}>
                        کلیک کنید یا بکشید
                      </p>
                      <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>PNG, JPG, PDF</p>
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#444',
                  display: 'block', marginBottom: 8 }}>
                  توضیحات (اختیاری)
                </label>
                <textarea value={receiptNote} onChange={e => setNote(e.target.value)}
                  placeholder="در صورت نیاز توضیحات اضافه کنید..."
                  style={{ ...inputStyle, resize: 'none', minHeight: 60 }} />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!name || !phone}
            style={{
              width: '100%', marginTop: 28, padding: '15px', borderRadius: 16,
              border: 'none', fontSize: 16, fontWeight: 800, cursor: name && phone ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'all 0.2s',
              background: name && phone
                ? 'linear-gradient(135deg,#C7A66A,#A07840)' : 'rgba(0,0,0,0.07)',
              color: name && phone ? '#fff' : '#bbb',
              boxShadow: name && phone ? '0 4px 16px rgba(199,166,106,0.28)' : 'none',
            }}>
            ثبت‌نام در مسابقه
          </button>

          <p style={{ fontSize: 12, color: '#bbb', textAlign: 'center',
            margin: '12px 0 0', lineHeight: 1.6 }}>
            با ثبت‌نام، قوانین مسابقه را پذیرفته‌اید
          </p>
        </div>
      </div>
    </div>
  );
}
