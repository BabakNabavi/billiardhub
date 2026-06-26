'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy, ChevronRight, Check, AlertCircle, CreditCard,
  Calendar, Clock, Users, DollarSign, FileText, Image,
} from 'lucide-react';

type GameType = '8ball' | '9ball' | 'snooker' | 'other';
type PayMethod = 'online' | 'card_transfer';

const GAME_TYPES: { key: GameType; label: string; color: string }[] = [
  { key: '8ball',   label: '۸ بال',   color: '#3b82f6' },
  { key: '9ball',   label: '۹ بال',   color: '#30C55A' },
  { key: 'snooker', label: 'اسنوکر',  color: '#C7A66A' },
  { key: 'other',   label: 'سایر',    color: '#8b5cf6' },
];
const MAX_PLAYERS = [8, 16, 32, 64];

const STEPS = ['اطلاعات پایه', 'تنظیمات', 'جوایز و قوانین', 'پرداخت'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, transition: 'all 0.2s',
              background: i < current ? '#30C55A' : i === current
                ? 'linear-gradient(135deg,#C7A66A,#A07840)' : 'rgba(0,0,0,0.06)',
              color: i <= current ? '#fff' : '#aaa',
              border: i === current ? 'none' : i < current ? 'none' : '1.5px solid rgba(0,0,0,0.10)',
            }}>
              {i < current ? <Check size={16} /> : i + 1}
            </div>
            <span style={{ fontSize: 11, color: i === current ? '#111' : '#aaa',
              fontWeight: i === current ? 700 : 500, whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, margin: '0 8px', marginBottom: 20,
              background: i < current ? '#30C55A' : 'rgba(0,0,0,0.08)', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function FormField({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 12, color: '#999', margin: 0 }}>{hint}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  border: '1.5px solid rgba(0,0,0,0.10)', background: '#fff',
  fontSize: 14, fontFamily: 'Vazirmatn, sans-serif', color: '#111',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 100,
};

export default function NewTournamentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [name, setName]             = useState('');
  const [description, setDesc]      = useState('');
  const [gameType, setGameType]     = useState<GameType>('snooker');
  const [date, setDate]             = useState('');
  const [startTime, setStart]       = useState('');
  const [deadline, setDeadline]     = useState('');
  const [maxPlayers, setMax]        = useState(16);
  const [entryFee, setFee]          = useState('');
  const [prizeInfo, setPrize]       = useState('');
  const [rules, setRules]           = useState('');
  const [payMethod, setPayMethod]   = useState<PayMethod>('card_transfer');
  const [cardNumber, setCard]       = useState('');
  const [cardHolder, setHolder]     = useState('');
  const [bankName, setBank]         = useState('');

  const canNext = [
    step === 0 && name.trim().length > 2,
    step === 1 && date && startTime && deadline,
    step === 2 && prizeInfo.trim().length > 2,
    step === 3,
  ][step];

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
        fontFamily: 'Vazirmatn, sans-serif', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px', paddingTop: 100 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: '48px 40px',
          maxWidth: 440, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(48,197,90,0.12)', border: '2px solid rgba(48,197,90,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px' }}>
            <Check size={32} color="#30C55A" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 10px' }}>
            مسابقه با موفقیت ایجاد شد!
          </h2>
          <p style={{ fontSize: 14, color: '#777', margin: '0 0 28px', lineHeight: 1.7 }}>
            مسابقه «{name}» ایجاد شد و برای ثبت‌نام بازیکنان آماده است.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => router.push('/tournaments/t1/admin')} style={{
              background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff',
              border: 'none', borderRadius: 12, padding: '12px 24px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              مدیریت مسابقه
            </button>
            <button onClick={() => router.push('/tournaments')} style={{
              background: 'rgba(0,0,0,0.05)', color: '#555', border: 'none',
              borderRadius: 12, padding: '12px 24px', fontSize: 14,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingTop: 88, paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '20px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.push('/tournaments')} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
            border: 'none', cursor: 'pointer', fontSize: 14, color: '#777', fontFamily: 'inherit',
          }}>
            <ChevronRight size={16} />
            مسابقات
          </button>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>ایجاد مسابقه جدید</span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px clamp(16px,4vw,48px)' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 'clamp(24px,4vw,44px)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14,
              background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={22} color="#C7A66A" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: 0 }}>ایجاد مسابقه</h1>
              <p style={{ fontSize: 13, color: '#888', margin: '2px 0 0' }}>اطلاعات مسابقه را وارد کنید</p>
            </div>
          </div>

          <StepIndicator current={step} />

          {/* Step 0 — اطلاعات پایه */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <FormField label="نام مسابقه" required>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="مثال: جام اسنوکر سنچوری — تابستان ۱۴۰۵"
                  style={inputStyle} />
              </FormField>

              <FormField label="بنر / تصویر مسابقه">
                <div style={{
                  border: '2px dashed rgba(199,166,106,0.30)', borderRadius: 14,
                  padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
                  background: 'rgba(199,166,106,0.03)',
                  transition: 'border-color 0.2s',
                }}>
                  <Image size={28} color="#C7A66A" style={{ opacity: 0.6, marginBottom: 10 }} />
                  <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                    کلیک کنید یا تصویر را اینجا بکشید
                  </p>
                  <p style={{ fontSize: 11, color: '#bbb', margin: '4px 0 0' }}>PNG, JPG حداکثر ۵ مگابایت</p>
                </div>
              </FormField>

              <FormField label="توضیحات مسابقه">
                <textarea value={description} onChange={e => setDesc(e.target.value)}
                  placeholder="معرفی کوتاه مسابقه، سطح بازیکنان، شرایط شرکت..."
                  style={textareaStyle} />
              </FormField>

              <FormField label="نوع بازی" required>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {GAME_TYPES.map(g => (
                    <button key={g.key} onClick={() => setGameType(g.key)} style={{
                      padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                      border: gameType === g.key
                        ? `2px solid ${g.color}`
                        : '2px solid rgba(0,0,0,0.08)',
                      background: gameType === g.key
                        ? `rgba(${g.color === '#C7A66A' ? '199,166,106' : g.color === '#3b82f6' ? '59,130,246' : g.color === '#30C55A' ? '48,197,90' : '139,92,246'},0.10)`
                        : '#fff',
                      fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                      color: gameType === g.key ? g.color : '#777',
                      transition: 'all 0.18s',
                    }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          )}

          {/* Step 1 — تنظیمات */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="تاریخ مسابقه" required>
                  <input value={date} onChange={e => setDate(e.target.value)}
                    placeholder="مثال: ۱۵ مرداد ۱۴۰۵" style={inputStyle} />
                </FormField>
                <FormField label="ساعت شروع" required>
                  <input value={startTime} onChange={e => setStart(e.target.value)}
                    placeholder="مثال: ۱۴:۰۰" style={inputStyle} />
                </FormField>
              </div>

              <FormField label="مهلت ثبت‌نام" required>
                <input value={deadline} onChange={e => setDeadline(e.target.value)}
                  placeholder="مثال: ۱۰ مرداد ۱۴۰۵" style={inputStyle} />
              </FormField>

              <FormField label="حداکثر تعداد بازیکن" required>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {MAX_PLAYERS.map(n => (
                    <button key={n} onClick={() => setMax(n)} style={{
                      padding: '14px 8px', borderRadius: 12, cursor: 'pointer',
                      border: maxPlayers === n ? '2px solid #C7A66A' : '2px solid rgba(0,0,0,0.08)',
                      background: maxPlayers === n ? 'rgba(199,166,106,0.10)' : '#fff',
                      fontFamily: 'inherit', fontSize: 16, fontWeight: 800,
                      color: maxPlayers === n ? '#C7A66A' : '#777',
                      transition: 'all 0.18s',
                    }}>
                      {n}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#999', margin: 0 }}>نفر</p>
              </FormField>

              <FormField label="حق ثبت‌نام (تومان)" required>
                <input value={entryFee} onChange={e => setFee(e.target.value)}
                  type="number" placeholder="مثال: 500000"
                  style={inputStyle} />
              </FormField>
            </div>
          )}

          {/* Step 2 — جوایز و قوانین */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <FormField label="اطلاعات جوایز" required
                hint="مثال: 🏆 اول: ۵٬۰۰۰٬۰۰۰ ت | 🥈 دوم: ۲٬۵۰۰٬۰۰۰ ت | 🥉 سوم: ۱٬۰۰۰٬۰۰۰ ت">
                <textarea value={prizeInfo} onChange={e => setPrize(e.target.value)}
                  placeholder="جوایز نقدی، تندیس و سایر جوایز..."
                  style={{ ...textareaStyle, minHeight: 80 }} />
              </FormField>

              <FormField label="قوانین مسابقه"
                hint="هر قانون را در یک خط وارد کنید">
                <textarea value={rules} onChange={e => setRules(e.target.value)}
                  placeholder="• فرمت حذفی یک‌طرفه&#10;• توپ‌های Aramith Pro&#10;• تاخیر بیش از ۱۵ دقیقه = باخت"
                  style={{ ...textareaStyle, minHeight: 140 }} />
              </FormField>
            </div>
          )}

          {/* Step 3 — پرداخت */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(['online', 'card_transfer'] as PayMethod[]).map(m => (
                  <button key={m} onClick={() => setPayMethod(m)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
                    border: payMethod === m ? '2px solid #C7A66A' : '2px solid rgba(0,0,0,0.08)',
                    background: payMethod === m ? 'rgba(199,166,106,0.07)' : '#fff',
                    fontFamily: 'inherit', textAlign: 'right', transition: 'all 0.18s',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: payMethod === m ? '6px solid #C7A66A' : '2px solid rgba(0,0,0,0.20)',
                      transition: 'all 0.18s', flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                        {m === 'online' ? 'درگاه پرداخت آنلاین' : 'کارت به کارت'}
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                        {m === 'online'
                          ? 'بازیکن از طریق درگاه بانکی پرداخت می‌کند'
                          : 'بازیکن رسید کارت‌به‌کارت آپلود می‌کند'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {payMethod === 'card_transfer' && (
                <div style={{
                  background: 'rgba(199,166,106,0.05)', border: '1px solid rgba(199,166,106,0.18)',
                  borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <CreditCard size={16} color="#C7A66A" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#C7A66A' }}>اطلاعات حساب</span>
                  </div>
                  <FormField label="شماره کارت" required>
                    <input value={cardNumber} onChange={e => setCard(e.target.value)}
                      placeholder="0000-0000-0000-0000" style={inputStyle} />
                  </FormField>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <FormField label="نام صاحب حساب" required>
                      <input value={cardHolder} onChange={e => setHolder(e.target.value)}
                        placeholder="نام و نام خانوادگی" style={inputStyle} />
                    </FormField>
                    <FormField label="نام بانک" required>
                      <input value={bankName} onChange={e => setBank(e.target.value)}
                        placeholder="مثال: ملت، ملی..." style={inputStyle} />
                    </FormField>
                  </div>
                </div>
              )}

              {payMethod === 'online' && (
                <div style={{
                  background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.14)',
                  borderRadius: 14, padding: '14px 18px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <AlertCircle size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.6 }}>
                    در فاز اول، درگاه پرداخت آنلاین در حال توسعه است. می‌توانید از کارت‌به‌کارت استفاده کنید.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 36, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <button
              onClick={() => step > 0 && setStep(s => s - 1)}
              disabled={step === 0}
              style={{
                padding: '12px 24px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.10)',
                background: '#fff', fontSize: 14, fontWeight: 700, color: step === 0 ? '#ccc' : '#555',
                cursor: step === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
              مرحله قبل
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => canNext && setStep(s => s + 1)}
                style={{
                  padding: '12px 28px', borderRadius: 12, border: 'none',
                  background: canNext
                    ? 'linear-gradient(135deg,#C7A66A,#A07840)'
                    : 'rgba(0,0,0,0.08)',
                  color: canNext ? '#fff' : '#bbb',
                  fontSize: 14, fontWeight: 700,
                  cursor: canNext ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                }}>
                مرحله بعد
              </button>
            ) : (
              <button onClick={handleSubmit} style={{
                padding: '12px 28px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#C7A66A,#A07840)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(199,166,106,0.28)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Trophy size={16} />
                ایجاد مسابقه
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
