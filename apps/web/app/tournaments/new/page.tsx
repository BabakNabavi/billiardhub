'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy, ChevronRight, ChevronLeft, Check, CreditCard,
  Calendar, Clock, Users, FileText, Image, ChevronDown, Loader2, CheckCircle2,
} from 'lucide-react';

type GameType = '8ball' | '9ball' | 'snooker' | 'other';

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

function jFirstWeekday(jy: number, jm: number): number {
  const [gy, gm, gd] = j2g(jy, jm, 1);
  return (new Date(gy, gm - 1, gd).getDay() + 1) % 7; // 0=Sat … 6=Fri
}

const J_DAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

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


function numToWords(n: number): string {
  if (!n || n === 0) return 'صفر';
  const ones = ['','یک','دو','سه','چهار','پنج','شش','هفت','هشت','نه',
                 'ده','یازده','دوازده','سیزده','چهارده','پانزده','شانزده','هفده','هجده','نوزده'];
  const tens  = ['','','بیست','سی','چهل','پنجاه','شصت','هفتاد','هشتاد','نود'];
  const h3    = ['','صد','دویست','سیصد','چهارصد','پانصد','ششصد','هفتصد','هشتصد','نهصد'];
  function c3(x: number): string {
    if (x === 0) return '';
    if (x < 20)  return ones[x]!;
    if (x < 100) { const t = Math.floor(x/10), o = x%10; return o ? tens[t]!+' و '+ones[o]! : tens[t]!; }
    const hh = Math.floor(x/100), r = x%100;
    return r ? h3[hh]!+' و '+c3(r) : h3[hh]!;
  }
  const parts: string[] = [];
  let rem = n;
  if (rem >= 1_000_000_000) { parts.push(c3(Math.floor(rem/1_000_000_000))+' میلیارد'); rem %= 1_000_000_000; }
  if (rem >= 1_000_000)     { parts.push(c3(Math.floor(rem/1_000_000))+' میلیون');    rem %= 1_000_000; }
  if (rem >= 1_000)         { parts.push(c3(Math.floor(rem/1_000))+' هزار');          rem %= 1_000; }
  if (rem > 0)              parts.push(c3(rem));
  return parts.join(' و ');
}

// ── Time options ──────────────────────────────────────────────────────────────

const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 24; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 24) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

// ── Components ────────────────────────────────────────────────────────────────

const GAME_TYPES = [
  { key: '8ball'   as GameType, label: 'ایت بال',  color: '#3b82f6', rgb: '59,130,246'  },
  { key: '9ball'   as GameType, label: 'ناین بال', color: '#30C55A', rgb: '48,197,90'   },
  { key: 'snooker' as GameType, label: 'اسنوکر', color: '#C7A66A', rgb: '199,166,106' },
  { key: 'other'   as GameType, label: 'سایر',   color: '#8b5cf6', rgb: '139,92,246'  },
];
const MAX_PLAYERS = [8, 16, 32, 64];
const FORMATS = [
  { key: 'bo3',  label: 'Best of 3',  wins: 2 },
  { key: 'bo5',  label: 'Best of 5',  wins: 3 },
  { key: 'bo7',  label: 'Best of 7',  wins: 4 },
  { key: 'bo9',  label: 'Best of 9',  wins: 5 },
  { key: 'bo11', label: 'Best of 11', wins: 6 },
];
const STEPS = ['اطلاعات پایه', 'تنظیمات', 'جوایز و قوانین', 'پرداخت'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 800, fontSize: 15, transition: 'all 0.2s',
              background: i < current ? '#30C55A' : i === current ? 'linear-gradient(135deg,#C7A66A,#A07840)' : 'rgba(0,0,0,0.06)',
              color: i <= current ? '#fff' : '#aaa',
              border: i > current ? '1.5px solid rgba(0,0,0,0.10)' : 'none',
            }}>
              {i < current ? <Check size={16} /> : toFa(i + 1)}
            </div>
            <span style={{ fontSize: 12, color: i === current ? '#111' : '#aaa',
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
      <label style={{ fontSize: 14, fontWeight: 700, color: '#444' }}>
        {label}{required && <span style={{ color: '#ef4444', marginRight: 4 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 13, color: '#999', margin: 0 }}>{hint}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  border: '1.5px solid rgba(0,0,0,0.10)', background: '#fff',
  fontSize: 15, fontFamily: 'Vazirmatn, sans-serif', color: '#111',
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
    fontSize: 15, fontWeight: 800, cursor: active ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit', transition: 'all 0.18s', display: 'flex',
    alignItems: 'center', gap: 8,
  };
}

// ── Jalali Calendar Date Picker ───────────────────────────────────────────────

function DatePicker({ value, onChange, label, required }: {
  value: string; onChange: (v: string, weekday: string) => void;
  label: string; required?: boolean;
}) {
  const [open, setOpen]   = useState(false);
  const [viewY, setViewY] = useState(1405);
  const [viewM, setViewM] = useState(4);
  const [selY, setSelY]   = useState<number | null>(null);
  const [selM, setSelM]   = useState<number | null>(null);
  const [selD, setSelD]   = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const prevM = () => {
    if (viewM === 1) { setViewM(12); setViewY(y => y - 1); }
    else setViewM(m => m - 1);
  };
  const nextM = () => {
    if (viewM === 12) { setViewM(1); setViewY(y => y + 1); }
    else setViewM(m => m + 1);
  };

  const handleSelect = (d: number) => {
    setSelD(d); setSelY(viewY); setSelM(viewM); setOpen(false);
    const wd    = jalaliWeekday(viewY, viewM, d);
    const mName = MONTHS[viewM - 1]!;
    onChange(`${toFa(d)} ${mName} ${toFa(viewY)}`, wd);
  };

  const dim   = maxDays(viewM);
  const off   = jFirstWeekday(viewY, viewM);
  const cells = [...Array(off).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];

  const displayVal = selD ? `${toFa(selD)} ${MONTHS[selM! - 1]} ${toFa(selY!)}` : '';
  const weekday    = selD ? jalaliWeekday(selY!, selM!, selD) : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 14, fontWeight: 700, color: '#444' }}>
        {label}{required && <span style={{ color: '#ef4444', marginRight: 4 }}>*</span>}
      </label>

      <div ref={ref} style={{ position: 'relative' }}>
        {/* Trigger */}
        <div onClick={() => setOpen(v => !v)} style={{
          ...inputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
          borderColor: open ? 'rgba(199,166,106,0.55)' : 'rgba(0,0,0,0.10)',
          userSelect: 'none',
        } as React.CSSProperties}>
          <Calendar size={15} color="#C7A66A" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, color: selD ? '#111' : '#bbb', fontSize: 15 }}>
            {displayVal || 'انتخاب تاریخ'}
          </span>
          <span style={{ fontSize: 10, color: '#ccc' }}>{open ? '▲' : '▼'}</span>
        </div>

        {/* Calendar popup */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 300,
            background: '#fff', borderRadius: 18, padding: '18px 16px',
            border: '1px solid rgba(0,0,0,0.10)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.14)', minWidth: 296,
          }}>
            {/* Month navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button onClick={prevM} style={{
                width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(0,0,0,0.03)', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.45)',
              }}>
                <ChevronRight size={15} />
              </button>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>
                {MONTHS[viewM - 1]} {toFa(viewY)}
              </span>
              <button onClick={nextM} style={{
                width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(0,0,0,0.03)', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.45)',
              }}>
                <ChevronLeft size={15} />
              </button>
            </div>

            {/* Day name headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 6 }}>
              {J_DAY_NAMES.map(d => (
                <div key={d} style={{
                  textAlign: 'center', fontSize: 12, color: 'rgba(0,0,0,0.35)',
                  fontWeight: 700, padding: '4px 0',
                }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const isSel = selY === viewY && selM === viewM && selD === day;
                return (
                  <button key={i} onClick={() => handleSelect(day as number)} style={{
                    height: 37, borderRadius: 9, border: 'none', fontSize: 14,
                    fontWeight: isSel ? 800 : 500, cursor: 'pointer', fontFamily: 'inherit',
                    background: isSel ? 'linear-gradient(135deg,#C7A66A,#A07840)' : 'transparent',
                    color: isSel ? '#fff' : 'rgba(0,0,0,0.60)',
                    boxShadow: isSel ? '0 3px 10px rgba(199,166,106,0.35)' : 'none',
                    transition: 'all 0.14s',
                  }}>
                    {toFa(day as number)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected date badge */}
      {weekday && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.20)',
          borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700, color: '#A07840',
          alignSelf: 'flex-start' }}>
          <Calendar size={11} color="#C7A66A" />
          {displayVal} — {weekday}
        </div>
      )}
    </div>
  );
}

function TimePicker({ value, onChange, label, required }: {
  value: string; onChange: (v: string) => void;
  label?: string; required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <label style={{ fontSize: 14, fontWeight: 700, color: '#444' }}>
          {label}{required && <span style={{ color: '#ef4444', marginRight: 4 }}>*</span>}
        </label>
      )}
      <div ref={ref} style={{ position: 'relative' }}>
        <div onClick={() => setOpen(v => !v)} style={{
          ...inputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
          borderColor: open ? 'rgba(199,166,106,0.55)' : 'rgba(0,0,0,0.10)',
          userSelect: 'none',
        } as React.CSSProperties}>
          <Clock size={15} color="#C7A66A" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, color: value ? '#111' : '#bbb', fontSize: 15,
            direction: 'ltr', textAlign: 'right' }}>
            {value ? toFa(value) : 'انتخاب ساعت'}
          </span>
          <span style={{ fontSize: 10, color: '#ccc' }}>{open ? '▲' : '▼'}</span>
        </div>
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 300,
            background: '#fff', borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.10)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)', minWidth: 160,
            maxHeight: 280, overflowY: 'auto',
          }}>
            {TIME_OPTIONS.map(t => (
              <div key={t} onClick={() => { onChange(t); setOpen(false); }} style={{
                padding: '10px 16px', cursor: 'pointer', fontSize: 15,
                fontWeight: value === t ? 800 : 500,
                color: value === t ? '#C7A66A' : '#333',
                background: value === t ? 'rgba(199,166,106,0.08)' : 'transparent',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
                transition: 'background 0.1s', direction: 'ltr', textAlign: 'center',
              }}>
                {toFa(t)}
              </div>
            ))}
          </div>
        )}
      </div>
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
  const [deadlineTime, setDeadlineTime] = useState('');
  const [maxPlayers, setMax]      = useState(16);
  const [elimType, setElimType]   = useState<'single' | 'double' | 'league'>('single');
  const [entryFeeRaw, setFeeRaw]  = useState('');
  const [prizeInfo, setPrize]     = useState('');
  const [rules, setRules]         = useState('');
  const [matchFormat, setFormat]  = useState('bo3');
  const [formatOpen, setFormatOpen] = useState(false);
  const [paySim, setPaySim]       = useState<null | 'loading' | 'success'>(null);

  const entryFeeDisplay = fmtMoney(entryFeeRaw);

  const J_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  function dateToNum(s: string): number {
    if (!s) return 0;
    const p = s.split(' ');
    if (p.length !== 3) return 0;
    const toEn = (str: string) => str.replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
    const d = parseInt(toEn(p[0]!)), m = J_MONTHS.indexOf(p[1]!) + 1, y = parseInt(toEn(p[2]!));
    return y * 10000 + m * 100 + d;
  }
  function getTodayJalali(): number {
    const now = new Date();
    const gy = now.getFullYear(), gm = now.getMonth() + 1, gd = now.getDate();
    const g_y = gy - 1600, g_m = gm - 1, g_d = gd - 1;
    let g_day_no = 365*g_y + Math.floor((g_y+3)/4) - Math.floor((g_y+99)/100) + Math.floor((g_y+399)/400);
    const gmd = [31, 28 + ((gy%4===0 && (gy%100!==0 || gy%400===0)) ? 1 : 0), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (let i=0;i<g_m;i++) g_day_no += gmd[i]!;
    g_day_no += g_d;
    let j_day_no = g_day_no - 79;
    const j_np = Math.floor(j_day_no/12053); j_day_no %= 12053;
    let jy = 979 + 33*j_np + 4*Math.floor(j_day_no/1461); j_day_no %= 1461;
    if (j_day_no >= 366) { jy += Math.floor((j_day_no-1)/365); j_day_no = (j_day_no-1)%365; }
    const jmd = [31,31,31,31,31,31,30,30,30,30,30,29]; let jm=0, jd=0;
    for (let i=0;i<12;i++) { if (j_day_no < jmd[i]!) { jm=i+1; jd=j_day_no+1; break; } j_day_no -= jmd[i]!; }
    return jy*10000 + jm*100 + jd;
  }

  const deadlineAfterDate = !!(date && deadline && dateToNum(deadline) > dateToNum(date));
  const dateBeforeToday   = !!(date && dateToNum(date) < getTodayJalali());

  const canNext = [
    name.trim().length > 2,
    !!date && !!startTime && !!deadline && !!deadlineTime && !deadlineAfterDate && !dateBeforeToday,
    prizeInfo.trim().length > 2,
    true,
  ][step];

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px', paddingTop: 88 }}>
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
        <p style={{ fontSize: 15, color: '#777', margin: '0 0 28px', lineHeight: 1.7 }}>
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
      fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '20px clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.push('/tournaments')} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
            border: 'none', cursor: 'pointer', fontSize: 15, color: '#777', fontFamily: 'inherit',
          }}>
            <ChevronRight size={16} /> مسابقات
          </button>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>›</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>ایجاد مسابقه جدید</span>
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
              <p style={{ fontSize: 14, color: '#888', margin: '2px 0 0' }}>اطلاعات مسابقه را وارد کنید</p>
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
                  <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
                    کلیک کنید یا تصویر را اینجا بکشید
                  </p>
                  <p style={{ fontSize: 12, color: '#bbb', margin: '4px 0 0' }}>
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
                      fontFamily: 'inherit', fontSize: 14, fontWeight: 800,
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
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <DatePicker label="تاریخ مسابقه" required value={date}
                    onChange={(v, wd) => { setDate(v); setDateWd(wd); }} />
                  <TimePicker label="ساعت شروع" required value={startTime} onChange={setStart} />
                </div>
                {dateBeforeToday && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                    ⚠ تاریخ مسابقه نمی‌تواند از امروز عقب‌تر باشد
                  </p>
                )}
              </div>

              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <DatePicker label="مهلت ثبت‌نام" required value={deadline}
                    onChange={(v, wd) => { setDead(v); setDeadWd(wd); }} />
                  <TimePicker label="ساعت مهلت" required value={deadlineTime} onChange={setDeadlineTime} />
                </div>
                {deadlineAfterDate && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                    ⚠ مهلت ثبت‌نام نمی‌تواند بعد از تاریخ مسابقه باشد
                  </p>
                )}
              </div>

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
              </FormField>

              <FormField label="نوع مسابقه" required>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {(['single','double','league'] as const).map(key => (
                    <button key={key} onClick={() => setElimType(key)} style={{
                      padding: '16px 8px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
                      textAlign: 'center', transition: 'all 0.18s',
                      border: `1px solid rgba(199,166,106,${elimType === key ? '0.35' : '0.12'})`,
                      background: `rgba(199,166,106,${elimType === key ? '0.12' : '0.03'})`,
                      fontSize: 15, fontWeight: 900,
                      color: elimType === key ? '#C7A66A' : '#888',
                    }}>
                      {key === 'single' ? 'تک حذفی' : key === 'double' ? 'دو حذفی' : 'لیگ'}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="فرمت مسابقه" required>
                <div style={{ position: 'relative' }}>
                  {/* Backdrop to close on outside click */}
                  {formatOpen && (
                    <div onClick={() => setFormatOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                  )}
                  <button onClick={() => setFormatOpen(v => !v)} style={{
                    width: '100%', padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
                    border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', textAlign: 'right',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>
                      {FORMATS.find(f => f.key === matchFormat)?.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#C7A66A', fontWeight: 700 }}>
                        اولین نفر با {FORMATS.find(f => f.key === matchFormat)?.wins} برد
                      </span>
                      <ChevronDown size={16} color="#aaa"
                        style={{ transition: 'transform 0.2s',
                          transform: formatOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </div>
                  </button>

                  {formatOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                      background: '#fff', borderRadius: 16, zIndex: 99,
                      border: '1.5px solid rgba(0,0,0,0.09)',
                      boxShadow: '0 12px 48px rgba(0,0,0,0.14)', overflow: 'hidden',
                    }}>
                      {FORMATS.map((f, i) => (
                        <button key={f.key} onClick={() => { setFormat(f.key); setFormatOpen(false); }} style={{
                          width: '100%', padding: '13px 18px',
                          borderBottom: i < FORMATS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          background: matchFormat === f.key ? 'rgba(199,166,106,0.07)' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'background 0.12s',
                        }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 15, fontWeight: 800,
                              color: matchFormat === f.key ? '#C7A66A' : '#111' }}>
                              {f.label}
                            </div>
                            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                              اولین بازیکن با {f.wins} برد پیروز می‌شود
                            </div>
                          </div>
                          {matchFormat === f.key && <Check size={15} color="#C7A66A" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </FormField>

              <FormField label="مبلغ ورودی (تومان)" required>
                <div style={{ position: 'relative' }}>
                  <input
                    value={entryFeeDisplay}
                    onChange={e => {
                      const raw = e.target.value
                        .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                        .replace(/[^0-9]/g, '');
                      setFeeRaw(raw);
                    }}
                    placeholder="مثال: ۵۰۰٬۰۰۰"
                    style={{ ...inputStyle, paddingLeft: 60 }}
                  />
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 13, color: '#bbb', fontWeight: 600 }}>تومان</span>
                </div>
                {entryFeeRaw && (
                  <p style={{ fontSize: 13, color: '#A07840', margin: 0, fontWeight: 700 }}>
                    {numToWords(parseInt(entryFeeRaw, 10))} تومان
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

          {/* ── Step 3: درگاه پرداخت ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Gateway card */}
              <div style={{ background: 'linear-gradient(145deg,#0f172a 0%,#1e293b 100%)',
                borderRadius: 24, padding: 28, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                {/* Glow */}
                <div style={{ position: 'absolute', top: -40, left: -40, width: 200, height: 200,
                  borderRadius: '50%', background: 'rgba(199,166,106,0.06)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                      background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={24} color="#C7A66A" />
                    </div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.01em' }}>
                        درگاه پرداخت آنلاین
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                        Billiard Hub · Secure Payment Gateway
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14,
                    padding: '16px 20px', marginBottom: 20,
                    border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', marginBottom: 8,
                      letterSpacing: '0.08em' }}>حق ورودی مسابقه</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: '#C7A66A' }}>
                      {entryFeeRaw && parseInt(entryFeeRaw) > 0
                        ? `${fmtMoney(entryFeeRaw)} تومان`
                        : <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }}>رایگان</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['🏦 ملت','🏦 ملی','🏦 سامان','🏦 پارسیان'] as const).map(b => (
                      <div key={b} style={{ padding: '6px 12px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{b}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Simulate button */}
              <button onClick={() => {
                setPaySim('loading');
                setTimeout(() => setPaySim('success'), 2200);
              }} style={{
                padding: '14px 20px', borderRadius: 16, cursor: 'pointer',
                background: 'rgba(199,166,106,0.10)', color: '#A07840',
                border: '1.5px solid rgba(199,166,106,0.25)',
                fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <CreditCard size={15} /> پیش‌نمایش تجربه پرداخت بازیکن
              </button>

              {/* Info */}
              <div style={{ background: 'rgba(48,197,90,0.05)', border: '1px solid rgba(48,197,90,0.16)',
                borderRadius: 14, padding: '14px 18px',
                display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircle2 size={15} color="#30C55A" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 14, color: '#555', margin: 0, lineHeight: 1.7 }}>
                  بازیکنان هنگام ثبت‌نام مستقیماً از طریق درگاه امن بانکی هزینه را پرداخت می‌کنند.
                  مبلغ پس از کسر کارمزد به حساب شما واریز می‌شود.
                </p>
              </div>

              {/* Simulated gateway modal */}
              {paySim && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                  zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 20, direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif' }}>
                  <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 360,
                    overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}>

                    {/* Bank header */}
                    <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#0f2240)',
                      padding: '20px 24px', color: '#fff' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)',
                        letterSpacing: '0.1em', marginBottom: 4 }}>درگاه پرداخت امن</div>
                      <div style={{ fontSize: 18, fontWeight: 900 }}>بیلیارد هاب</div>
                    </div>

                    <div style={{ padding: '28px 24px' }}>
                      {paySim === 'loading' ? (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block',
                            marginBottom: 16 }}>
                            <Loader2 size={40} color="#C7A66A" />
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 6 }}>
                            در حال اتصال به بانک...
                          </div>
                          <div style={{ fontSize: 13, color: '#aaa' }}>لطفاً صبر کنید</div>
                          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ width: 64, height: 64, borderRadius: '50%',
                            background: 'rgba(48,197,90,0.10)', border: '2px solid rgba(48,197,90,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px' }}>
                            <CheckCircle2 size={32} color="#30C55A" />
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#111', marginBottom: 6 }}>
                            پرداخت موفق
                          </div>
                          <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
                            {entryFeeRaw && parseInt(entryFeeRaw) > 0
                              ? `${fmtMoney(entryFeeRaw)} تومان`
                              : 'رایگان'}
                          </div>
                          <div style={{ fontSize: 12, color: '#bbb', marginBottom: 24 }}>
                            کد پیگیری: {Math.floor(Math.random() * 9000000 + 1000000)}
                          </div>
                          <button onClick={() => setPaySim(null)} style={{
                            width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                            background: 'linear-gradient(135deg,#30C55A,#26a249)',
                            color: '#fff', fontSize: 15, fontWeight: 800,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}>
                            بازگشت به ایجاد مسابقه
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
              <button onClick={() => {
                try { localStorage.setItem('bracketMaxPlayers_t1', String(maxPlayers)); } catch {}
                setSubmit(true);
              }} style={lqBtn(true)}>
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
