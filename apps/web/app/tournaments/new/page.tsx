'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy, ChevronRight, Check, AlertCircle, CreditCard,
  Calendar, Clock, Users, FileText, Image,
} from 'lucide-react';

type GameType = '8ball' | '9ball' | 'snooker' | 'other';
type PayMethod = 'online' | 'card_transfer';

// ── Jalali utilities ──────────────────────────────────────────────────────────

const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

function j2g(jy: number, jm: number, jd: number): [number, number, number] {
  const jy2 = jy - 979, jm2 = jm - 1, jd2 = jd - 1;
  let j_dn = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor((jy2 % 33 + 3) / 4);
  for (let i = 0; i < jm2; ++i) j_dn += i < 6 ? 31 : 30;
  j_dn += jd2;
  let g_dn = j_dn + 79;
  let gy = 1600 + 400 * Math.floor(g_dn / 146097); g_dn %= 146097;
  let leap = true;
  if (g_dn >= 36525) {
    g_dn--; gy += 100 * Math.floor(g_dn / 36524); g_dn %= 36524;
    if (g_dn >= 365) g_dn++; else leap = false;
  }
  gy += 4 * Math.floor(g_dn / 1461); g_dn %= 1461;
  if (g_dn >= 366) { leap = false; g_dn--; gy += Math.floor(g_dn / 365); g_dn %= 365; }
  const gdim = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 12 && g_dn >= gdim[gm]!) { g_dn -= gdim[gm]!; gm++; }
  return [gy, gm + 1, g_dn + 1];
}

function jalaliWeekday(jy: number, jm: number, jd: number): string {
  const [gy, gm, gd] = j2g(jy, jm, jd);
  const dow = new Date(gy, gm - 1, gd).getDay();
  return ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'][dow]!;
}

function maxDays(jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return 29;
}

function toFa(v: string | number): string {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!);
}

function fmtMoney(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const withSep = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return withSep.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!)
                .replace(/,/g, '٬');
}

function fmtCard(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

// ── Time options ──────────────────────────────────────────────────────────────

const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 24; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 24) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

// ── Components ────────────────────────────────────────────────────────────────

const GAME_TYPES = [
  { key: '8ball'   as GameType, label: '۸ بال',  color: '#3b82f6', rgb: '59,130,246'  },
  { key: '9ball'   as GameType, label: '۹ بال',  color: '#30C55A', rgb: '48,197,90'   },
  { key: 'snooker' as GameType, label: 'اسنوکر', color: '#C7A66A', rgb: '199,166,106' },
  { key: 'other'   as GameType, label: 'سایر',   color: '#8b5cf6', rgb: '139,92,246'  },
];
const MAX_PLAYERS = [8, 16, 32, 64];
const STEPS = ['اطلاعات پایه', 'تنظیمات', 'جوایز و قوانین', 'پرداخت'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 800, fontSize: 14, transition: 'all 0.2s',
              background: i < current ? '#30C55A' : i === current ? 'linear-gradient(135deg,#C7A66A,#A07840)' : 'rgba(0,0,0,0.06)',
              color: i <= current ? '#fff' : '#aaa',
              border: i > current ? '1.5px solid rgba(0,0,0,0.10)' : 'none',
            }}>
              {i < current ? <Check size={16} /> : toFa(i + 1)}
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
        {label}{required && <span style={{ color: '#ef4444', marginRight: 4 }}>*</span>}
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
const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', paddingLeft: 10,
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 100,
};

// LQ button helper
function lqBtn(active: boolean, rgb = '199,166,106', color = '#C7A66A'): React.CSSProperties {
  return {
    padding: '12px 26px', borderRadius: 20,
    border: `1px solid rgba(${rgb},${active ? '0.30' : '0.12'})`,
    background: `rgba(${rgb},${active ? '0.12' : '0.05'})`,
    color: active ? color : 'rgba(0,0,0,0.25)',
    fontSize: 14, fontWeight: 800, cursor: active ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit', transition: 'all 0.18s', display: 'flex',
    alignItems: 'center', gap: 8,
  };
}

// ── Jalali Date Picker ────────────────────────────────────────────────────────

function DatePicker({ value, onChange, label, required }: {
  value: string; onChange: (v: string, weekday: string) => void;
  label: string; required?: boolean;
}) {
  const [y, setY] = useState(1405);
  const [m, setM] = useState(5);
  const [d, setD] = useState(1);
  const [touched, setTouched] = useState(false);

  const handleChange = (ny: number, nm: number, nd: number) => {
    setY(ny); setM(nm);
    const safe = Math.min(nd, maxDays(nm));
    setD(safe); setTouched(true);
    const monthName = MONTHS[nm - 1]!;
    const wd = jalaliWeekday(ny, nm, safe);
    onChange(`${toFa(safe)} ${monthName} ${toFa(ny)}`, wd);
  };

  const weekday = touched ? jalaliWeekday(y, m, d) : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>
        {label}{required && <span style={{ color: '#ef4444', marginRight: 4 }}>*</span>}
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={d} onChange={e => handleChange(y, m, +e.target.value)}
          style={{ ...selectStyle, flex: 1 }}>
          {Array.from({ length: maxDays(m) }, (_, i) => i + 1).map(day => (
            <option key={day} value={day}>{toFa(day)}</option>
          ))}
        </select>
        <select value={m} onChange={e => handleChange(y, +e.target.value, d)}
          style={{ ...selectStyle, flex: 2 }}>
          {MONTHS.map((mn, i) => (
            <option key={i + 1} value={i + 1}>{mn}</option>
          ))}
        </select>
        <select value={y} onChange={e => handleChange(+e.target.value, m, d)}
          style={{ ...selectStyle, flex: 1.5 }}>
          {[1403, 1404, 1405, 1406, 1407, 1408].map(yr => (
            <option key={yr} value={yr}>{toFa(yr)}</option>
          ))}
        </select>
      </div>
      {weekday && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.20)',
          borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: '#A07840',
          alignSelf: 'flex-start' }}>
          <Calendar size={11} color="#C7A66A" />
          {value} — {weekday}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function NewTournamentPage() {
  const router = useRouter();
  const [step, setStep]         = useState(0);
  const [submitted, setSubmit]  = useState(false);

  const [name, setName]           = useState('');
  const [description, setDesc]    = useState('');
  const [gameType, setGameType]   = useState<GameType>('snooker');
  const [date, setDate]           = useState('');
  const [dateWd, setDateWd]       = useState('');
  const [startTime, setStart]     = useState('');
  const [deadline, setDead]       = useState('');
  const [deadWd, setDeadWd]       = useState('');
  const [maxPlayers, setMax]      = useState(16);
  const [entryFeeRaw, setFeeRaw]  = useState('');
  const [prizeInfo, setPrize]     = useState('');
  const [rules, setRules]         = useState('');
  const [payMethod, setPay]       = useState<PayMethod>('card_transfer');
  const [cardNumber, setCard]     = useState('');
  const [cardHolder, setHolder]   = useState('');
  const [bankName, setBank]       = useState('');

  const entryFeeDisplay = fmtMoney(entryFeeRaw);

  const canNext = [
    name.trim().length > 2,
    !!date && !!startTime && !!deadline,
    prizeInfo.trim().length > 2,
    true,
  ][step];

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px', paddingTop: 100 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '48px 40px',
        maxWidth: 440, width: '100%', textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(48,197,90,0.10)', border: '2px solid rgba(48,197,90,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={32} color="#30C55A" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 10px' }}>
          مسابقه با موفقیت ایجاد شد!
        </h2>
        <p style={{ fontSize: 14, color: '#777', margin: '0 0 28px', lineHeight: 1.7 }}>
          مسابقه «{name}» ثبت شد و بازیکنان می‌توانند ثبت‌نام کنند.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/tournaments/t1/admin')} style={lqBtn(true)}>
            <Trophy size={16} /> مدیریت مسابقه
          </button>
          <button onClick={() => router.push('/tournaments')} style={lqBtn(true, '0,0,0', '#555')}>
            بازگشت به لیست
          </button>
        </div>
      </div>
    </div>
  );

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
            <ChevronRight size={16} /> مسابقات
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

          {/* ── Step 0: اطلاعات پایه ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <FormField label="نام مسابقه" required>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="مثال: جام اسنوکر سنچوری — تابستان ۱۴۰۵"
                  style={inputStyle} />
              </FormField>

              <FormField label="بنر / تصویر مسابقه">
                <div style={{ border: '2px dashed rgba(199,166,106,0.28)', borderRadius: 14,
                  padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
                  background: 'rgba(199,166,106,0.03)' }}>
                  <Image size={28} color="#C7A66A" style={{ opacity: 0.55, marginBottom: 10 }} />
                  <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                    کلیک کنید یا تصویر را اینجا بکشید
                  </p>
                  <p style={{ fontSize: 11, color: '#bbb', margin: '4px 0 0' }}>
                    PNG, JPG — حداکثر ۵ مگابایت
                  </p>
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
                      padding: '12px 8px', borderRadius: 20, cursor: 'pointer',
                      border: `1px solid rgba(${g.rgb},${gameType === g.key ? '0.35' : '0.12'})`,
                      background: `rgba(${g.rgb},${gameType === g.key ? '0.12' : '0.04'})`,
                      fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
                      color: gameType === g.key ? g.color : '#999',
                      transition: 'all 0.18s',
                    }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          )}

          {/* ── Step 1: تنظیمات ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <DatePicker label="تاریخ مسابقه" required value={date}
                  onChange={(v, wd) => { setDate(v); setDateWd(wd); }} />
                <FormField label="ساعت شروع" required>
                  <select value={startTime} onChange={e => setStart(e.target.value)} style={selectStyle}>
                    <option value="">انتخاب ساعت</option>
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{toFa(t)}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <DatePicker label="مهلت ثبت‌نام" required value={deadline}
                onChange={(v, wd) => { setDead(v); setDeadWd(wd); }} />

              <FormField label="حداکثر تعداد بازیکن" required>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {MAX_PLAYERS.map(n => (
                    <button key={n} onClick={() => setMax(n)} style={{
                      padding: '14px 8px', borderRadius: 20, cursor: 'pointer',
                      border: `1px solid rgba(199,166,106,${maxPlayers === n ? '0.35' : '0.12'})`,
                      background: `rgba(199,166,106,${maxPlayers === n ? '0.12' : '0.03'})`,
                      fontFamily: 'inherit', fontSize: 16, fontWeight: 900,
                      color: maxPlayers === n ? '#C7A66A' : '#bbb',
                      transition: 'all 0.18s',
                    }}>
                      {toFa(n)}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#aaa', margin: '6px 0 0' }}>نفر</p>
              </FormField>

              <FormField label="مبلغ ورودی (تومان)" required>
                <div style={{ position: 'relative' }}>
                  <input
                    value={entryFeeDisplay}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setFeeRaw(raw);
                    }}
                    placeholder="مثال: ۵۰۰٬۰۰۰"
                    style={{ ...inputStyle, paddingLeft: 60 }}
                  />
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 12, color: '#bbb', fontWeight: 600 }}>تومان</span>
                </div>
                {entryFeeRaw && (
                  <p style={{ fontSize: 12, color: '#A07840', margin: 0, fontWeight: 700 }}>
                    {entryFeeDisplay} تومان
                  </p>
                )}
              </FormField>
            </div>
          )}

          {/* ── Step 2: جوایز و قوانین ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <FormField label="اطلاعات جوایز" required
                hint="مثال: 🏆 اول: ۵٬۰۰۰٬۰۰۰ ت | 🥈 دوم: ۲٬۵۰۰٬۰۰۰ ت | 🥉 سوم: ۱٬۰۰۰٬۰۰۰ ت">
                <textarea value={prizeInfo} onChange={e => setPrize(e.target.value)}
                  placeholder="جوایز نقدی، تندیس و سایر جوایز..."
                  style={{ ...textareaStyle, minHeight: 80 }} />
              </FormField>
              <FormField label="قوانین مسابقه" hint="هر قانون را در یک خط وارد کنید">
                <textarea value={rules} onChange={e => setRules(e.target.value)}
                  placeholder="• فرمت حذفی یک‌طرفه&#10;• توپ‌های Aramith Pro&#10;• تاخیر بیش از ۱۵ دقیقه = باخت"
                  style={{ ...textareaStyle, minHeight: 140 }} />
              </FormField>
            </div>
          )}

          {/* ── Step 3: پرداخت ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(['online', 'card_transfer'] as PayMethod[]).map(m => (
                  <button key={m} onClick={() => setPay(m)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '18px 20px', borderRadius: 20, cursor: 'pointer',
                    border: `1px solid rgba(199,166,106,${payMethod === m ? '0.35' : '0.12'})`,
                    background: payMethod === m ? 'rgba(199,166,106,0.08)' : 'rgba(0,0,0,0.01)',
                    fontFamily: 'inherit', textAlign: 'right', transition: 'all 0.18s',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: payMethod === m ? '6px solid #C7A66A' : '2px solid rgba(0,0,0,0.18)',
                      transition: 'all 0.18s',
                    }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>
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
                <div style={{ background: 'rgba(199,166,106,0.05)',
                  border: '1px solid rgba(199,166,106,0.18)',
                  borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={16} color="#C7A66A" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#C7A66A' }}>اطلاعات حساب</span>
                  </div>

                  <FormField label="شماره کارت" required>
                    <input
                      value={cardNumber}
                      onChange={e => setCard(fmtCard(e.target.value))}
                      placeholder="۰۰۰۰-۰۰۰۰-۰۰۰۰-۰۰۰۰"
                      maxLength={19}
                      style={{ ...inputStyle, letterSpacing: '0.10em', fontFamily: 'monospace' }}
                    />
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
                <div style={{ background: 'rgba(59,130,246,0.05)',
                  border: '1px solid rgba(59,130,246,0.14)',
                  borderRadius: 14, padding: '14px 18px',
                  display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <AlertCircle size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.6 }}>
                    در فاز اول، درگاه پرداخت آنلاین در حال توسعه است.
                    برای اطلاعات بیشتر به <strong>billiardhub.net</strong> مراجعه کنید.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 36, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <button
              onClick={() => step > 0 && setStep(s => s - 1)}
              disabled={step === 0}
              style={lqBtn(step > 0, '0,0,0', '#555')}>
              مرحله قبل
            </button>

            {step < STEPS.length - 1 ? (
              <button onClick={() => canNext && setStep(s => s + 1)}
                style={lqBtn(!!canNext)}>
                مرحله بعد
              </button>
            ) : (
              <button onClick={() => setSubmit(true)} style={lqBtn(true)}>
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
