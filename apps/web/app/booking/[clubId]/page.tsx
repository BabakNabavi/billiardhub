'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import {
  ChevronRight, ChevronLeft, Check, X,
  Clock, Calendar, CheckCircle, AlertCircle,
  ChevronUp,
} from 'lucide-react';

/* ══════════════════════════════════════════
   JALALI UTILS
══════════════════════════════════════════ */
function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_no = [31, ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_d_no = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
  for (let i = 0; i < gm - 1; i++) days += (g_d_no[i] ?? 0);
  days += gd - 1 - 79;
  const j_np = Math.floor(days / 12053); days %= 12053;
  jy += 33 * j_np + 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let jm = 0;
  for (let i = 0; i < 11 && days >= (j_d_no[i] ?? 0); i++) { days -= (j_d_no[i] ?? 0); jm++; }
  return [jy, jm + 1, days + 1];
}

function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let jy2 = jy - 979, jm2 = jm - 1, jd2 = jd - 1;
  let j_day_no = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor((jy2 % 33 + 3) / 4);
  for (let i = 0; i < jm2; i++) j_day_no += ([31,31,31,31,31,31,30,30,30,30,30,29][i] ?? 0);
  j_day_no += jd2;
  let g_day_no = j_day_no + 79;
  let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no %= 146097;
  let leap = true;
  if (g_day_no >= 36525) { g_day_no--; gy += 100 * Math.floor(g_day_no / 36524); g_day_no %= 36524; if (g_day_no >= 365) g_day_no++; else leap = false; }
  gy += 4 * Math.floor(g_day_no / 1461); g_day_no %= 1461;
  if (g_day_no >= 366) { leap = false; g_day_no--; gy += Math.floor(g_day_no / 365); g_day_no %= 365; }
  const g_days_in_month = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (let i = 0; g_day_no >= (g_days_in_month[i] ?? 0); i++) { g_day_no -= (g_days_in_month[i] ?? 0); gm++; }
  return [gy, gm + 1, g_day_no + 1];
}

function jDaysInMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const leap = [1,5,9,13,17,22,26,30];
  return leap.includes(jy % 33) ? 30 : 29;
}

function jFirstWeekday(jy: number, jm: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, 1);
  return new Date(gy, gm - 1, gd).getDay();
}

function toISODate(jy: number, jm: number, jd: number): string {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2,'0')}-${String(gd).padStart(2,'0')}`;
}

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

const jMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const jDays   = ['ش','ی','د','س','چ','پ','ج'];

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
interface Table { id: string; number: number; name: string; type: string; brand: string; model: string; pricePerHour: number; }
interface Slot  { hour: number; isBooked: boolean; }
interface Club  { id: string; name: string; city?: string; }

const typeLabel: Record<string,string> = {
  snooker:'اسنوکر', pocket:'پاکت بیلیارد',
  highball:'هی‌بال', vip_snooker:'VIP اسنوکر', vip_pocket:'VIP پاکت',
};
const typeColor: Record<string,string> = {
  snooker:'#10b981', pocket:'#06b6d4',
  highball:'#a78bfa', vip_snooker:'#f59e0b', vip_pocket:'#f59e0b',
};

/* sample fallback tables */
const sampleTables: Table[] = [
  { id:'t1', number:1, name:'میز اسنوکر ۱',   type:'snooker',    brand:'Viraka',    model:'M1 Gold',   pricePerHour:180000 },
  { id:'t2', number:2, name:'میز اسنوکر ۲',   type:'snooker',    brand:'BCE',       model:'Heritage',  pricePerHour:180000 },
  { id:'t3', number:3, name:'میز پاکت ۱',     type:'pocket',     brand:'Brunswick', model:'Gold Crown', pricePerHour:150000 },
  { id:'t4', number:4, name:'میز هی‌بال ۱',   type:'highball',   brand:'Artis',     model:'Vienna',    pricePerHour:120000 },
  { id:'t5', number:5, name:'میز VIP اسنوکر', type:'vip_snooker',brand:'Viraka',    model:'M1 VIP',    pricePerHour:350000 },
];

const sampleSlots: Slot[] = Array.from({length:14},(_,i) => ({
  hour: i + 10,
  isBooked: [11,14,15,19].includes(i + 10),
}));

/* ══════════════════════════════════════════
   JALALI CALENDAR COMPONENT
══════════════════════════════════════════ */
function JalaliCalendar({
  jYear, jMonth, selectedDay, todayJY, todayJM, todayJD,
  onSelect, onPrevMonth, onNextMonth,
}: {
  jYear: number; jMonth: number;
  selectedDay: number | null;
  todayJY: number; todayJM: number; todayJD: number;
  onSelect: (d: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const daysInMonth = jDaysInMonth(jYear, jMonth);
  const firstWd     = jFirstWeekday(jYear, jMonth);
  const offset      = (firstWd + 1) % 7; // sat = 0
  const cells: (number|null)[] = [...Array(offset).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];

  return (
    <div>
      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
        <button onClick={onPrevMonth} style={{ width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', color:'rgba(240,250,245,0.6)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
          <ChevronRight size={16} />
        </button>
        <div style={{ fontSize:'16px', fontWeight:800, color:'#f0faf5', letterSpacing:'-0.01em' }}>
          {jMonths[jMonth-1]} {toFa(jYear)}
        </div>
        <button onClick={onNextMonth} style={{ width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', color:'rgba(240,250,245,0.6)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', marginBottom:'8px' }}>
        {jDays.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:'11px', color:'rgba(240,250,245,0.3)', fontWeight:700, padding:'4px 0', letterSpacing:'0.04em' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isPast = (
            jYear < todayJY ||
            (jYear === todayJY && jMonth < todayJM) ||
            (jYear === todayJY && jMonth === todayJM && day < todayJD)
          );
          const isSelected = day === selectedDay;
          const isToday    = day === todayJD && jMonth === todayJM && jYear === todayJY;

          return (
            <button key={i}
              disabled={isPast}
              onClick={() => !isPast && onSelect(day)}
              style={{
                height:'40px', borderRadius:'10px', border:'none',
                fontSize:'13px', fontWeight: isToday ? 800 : 500,
                cursor: isPast ? 'not-allowed' : 'pointer',
                background: isSelected
                  ? 'linear-gradient(135deg,#10b981,#059669)'
                  : isToday ? 'rgba(16,185,129,0.1)' : 'transparent',
                color: isSelected ? '#fff' : isPast ? 'rgba(240,250,245,0.15)' : isToday ? '#10b981' : '#f0faf5',
                boxShadow: isSelected ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
                outline: isToday && !isSelected ? '1px solid rgba(16,185,129,0.3)' : 'none',
                transition:'all 0.2s',
                textDecoration: isPast ? 'line-through' : 'none',
                opacity: isPast ? 0.4 : 1,
              }}>
              {toFa(day)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function BookingPage() {
  const params  = useParams();
  const clubId  = params.clubId as string;
  const router  = useRouter();
  const { user } = useAuthStore();

  /* data */
  const [club, setClub]     = useState<Club|null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [slots, setSlots]   = useState<Slot[]>([]);

  /* selection */
  const [selectedTable, setSelectedTable] = useState<Table|null>(null);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);

  /* jalali date state */
  const today      = new Date();
  const [todayJY, todayJM, todayJD] = toJalali(today.getFullYear(), today.getMonth()+1, today.getDate());
  const [jYear, setJYear]   = useState(todayJY);
  const [jMonth, setJMonth] = useState(todayJM);
  const [jDay, setJDay]     = useState<number|null>(null);
  const isoDate = jDay ? toISODate(jYear, jMonth, jDay) : '';

  /* ui */
  const [step, setStep]           = useState<1|2|3>(1);
  const [loading, setLoading]     = useState(true);
  const [slotsLoading, setSlotsLoad] = useState(false);
  const [booking, setBooking]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');

  /* init */
  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    Promise.all([
      api.get(`/clubs/${clubId}`).catch(() => ({ data: { id: clubId, name: 'باشگاه' } })),
      api.get(`/clubs/${clubId}/tables`).catch(() => ({ data: [] })),
    ]).then(([c, t]) => {
      setClub(c.data);
      const tbls = Array.isArray(t.data) && t.data.length > 0 ? t.data : sampleTables;
      setTables(tbls);
      setLoading(false);
    });
  }, [clubId, user, router]);

  /* fetch slots */
  useEffect(() => {
    if (!selectedTable || !isoDate) return;
    setSlotsLoad(true);
    api.get(`/bookings/slots?clubId=${clubId}&tableNumber=${selectedTable.number}&date=${isoDate}`)
      .then(r => { setSlots(Array.isArray(r.data) && r.data.length > 0 ? r.data : sampleSlots); setSlotsLoad(false); })
      .catch(() => { setSlots(sampleSlots); setSlotsLoad(false); });
    setSelectedSlots([]);
  }, [selectedTable, isoDate, clubId]);

  /* slot toggle */
  const toggleSlot = useCallback((hour: number, isBooked: boolean) => {
    if (isBooked) return;
    setSelectedSlots(prev =>
      prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour].sort((a,b)=>a-b)
    );
  }, []);

  /* calendar nav */
  const prevMonth = () => {
    if (jMonth === 1) { setJMonth(12); setJYear(y=>y-1); }
    else setJMonth(m=>m-1);
    setJDay(null);
  };
  const nextMonth = () => {
    if (jMonth === 12) { setJMonth(1); setJYear(y=>y+1); }
    else setJMonth(m=>m+1);
    setJDay(null);
  };

  /* confirm */
  const handleConfirm = async () => {
    if (!selectedTable || selectedSlots.length === 0 || !isoDate) return;
    const sorted    = [...selectedSlots].sort((a,b)=>a-b);
    const startHour = sorted[0] ?? 0;
    const endHour   = (sorted[sorted.length-1] ?? 0) + 1;
    const startTime = new Date(`${isoDate}T${String(startHour).padStart(2,'0')}:00:00Z`);
    const endTime   = new Date(`${isoDate}T${String(endHour).padStart(2,'0')}:00:00Z`);
    setBooking(true); setError('');
    try {
      await api.post('/bookings', {
        clubId, tableType: selectedTable.type, tableNumber: selectedTable.number,
        startTime: startTime.toISOString(), endTime: endTime.toISOString(),
        totalPrice: selectedSlots.length * selectedTable.pricePerHour, currency:'IRR',
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'خطا در ثبت رزرو. لطفاً دوباره تلاش کنید.');
    } finally {
      setBooking(false);
    }
  };

  const totalPrice    = selectedTable ? selectedSlots.length * selectedTable.pricePerHour : 0;
  const accentColor   = selectedTable ? (typeColor[selectedTable.type] ?? '#10b981') : '#10b981';
  const dateLabel     = jDay ? `${toFa(jDay)} ${jMonths[jMonth-1]} ${toFa(jYear)}` : '';
  const canGoStep2    = !!selectedTable && !!jDay;
  const canGoStep3    = canGoStep2 && selectedSlots.length > 0;

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight:'80vh', background:'#020806', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
      <div style={{ width:'40px', height:'40px', border:'2px solid rgba(16,185,129,0.1)', borderTop:'2px solid #10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <div style={{ fontSize:'13px', color:'rgba(240,250,245,0.3)' }}>در حال بارگذاری...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  /* ── Success ── */
  if (success) return (
    <div style={{ minHeight:'80vh', background:'#020806', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ maxWidth:'480px', width:'100%', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'28px', padding:'clamp(32px,6vw,56px)', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'160px', height:'1px', background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.6),transparent)', boxShadow:'0 0 20px rgba(16,185,129,0.4)' }} />
        <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'0 12px 40px rgba(16,185,129,0.35)' }}>
          <CheckCircle size={32} style={{ color:'#fff' }} />
        </div>
        <h2 style={{ fontSize:'24px', fontWeight:900, color:'#f0faf5', margin:'0 0 12px', letterSpacing:'-0.02em' }}>رزرو ثبت شد!</h2>
        <p style={{ fontSize:'14px', color:'rgba(240,250,245,0.45)', margin:'0 0 28px', lineHeight:1.7 }}>
          رزرو شما با موفقیت ثبت شد. پس از تأیید باشگاه، پیامک دریافت خواهید کرد.
        </p>

        {/* Summary */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'18px', marginBottom:'28px', textAlign:'right' }}>
          {[
            { l:'میز',    v: selectedTable?.name ?? '' },
            { l:'تاریخ',  v: dateLabel },
            { l:'ساعت',   v: `${toFa(selectedSlots[0]??0)}:۰۰ تا ${toFa((selectedSlots[selectedSlots.length-1]??0)+1)}:۰۰` },
            { l:'مبلغ',   v: `${toFa(totalPrice.toLocaleString())} تومان` },
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ fontSize:'12px', color:'rgba(240,250,245,0.35)' }}>{r.l}</span>
              <span style={{ fontSize:'13px', fontWeight:600, color:'#f0faf5' }}>{r.v}</span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/clubs" style={{ padding:'12px 28px', background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:700, textDecoration:'none', boxShadow:'0 8px 24px rgba(16,185,129,0.3)' }}>
            بازگشت به باشگاه‌ها
          </Link>
          <Link href="/dashboard" style={{ padding:'12px 28px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'rgba(240,250,245,0.7)', fontSize:'14px', fontWeight:600, textDecoration:'none' }}>
            داشبورد
          </Link>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin    { to{transform:rotate(360deg);} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }

        .slot-btn {
          height: 52px; border-radius: 12px; font-size: 14px; font-weight: 600;
          border: 1px solid; cursor: pointer; font-family: inherit;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 2px; position: relative; overflow: hidden;
        }
        .slot-btn:active { transform: scale(0.95); }
        .slot-free  { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.09); color:rgba(240,250,245,0.65); }
        .slot-free:hover { background:rgba(16,185,129,0.08); border-color:rgba(16,185,129,0.3); color:#10b981; }
        .slot-sel   { background:rgba(16,185,129,0.14); border-color:rgba(16,185,129,0.5); color:#10b981; box-shadow:0 0 14px rgba(16,185,129,0.2); }
        .slot-busy  { background:rgba(239,68,68,0.04); border-color:rgba(239,68,68,0.12); color:rgba(239,68,68,0.3); cursor:not-allowed; }

        .table-item {
          padding: 16px 18px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          display: flex; align-items: center; gap: 14px;
        }
        .table-item:hover { background:rgba(255,255,255,0.055); }
        .table-item.active { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }

        @media(max-width:640px) {
          .slot-grid { grid-template-columns: repeat(4,1fr) !important; }
          .booking-inner { padding: 20px 16px !important; }
        }
        @media(max-width:390px) {
          .slot-grid { grid-template-columns: repeat(3,1fr) !important; }
        }
      `}</style>

      <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#020806 0%,#060d0a 100%)', paddingBottom:'80px' }}>

        {/* ── Header ── */}
        <div style={{ background:'rgba(2,8,6,0.98)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'0 clamp(16px,4vw,40px)', position:'sticky', top:'62px', zIndex:90, backdropFilter:'blur(24px)' }}>
          <div style={{ maxWidth:'760px', margin:'0 auto', height:'54px', display:'flex', alignItems:'center', gap:'14px' }}>
            <Link href={`/clubs/${clubId}`} style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(240,250,245,0.45)', fontSize:'12px', textDecoration:'none', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'9px', padding:'7px 13px', transition:'all 0.2s', flexShrink:0 }}>
              <ChevronRight size={13} /> بازگشت
            </Link>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'10px', color:'rgba(16,185,129,0.55)', letterSpacing:'0.18em', fontWeight:700 }}>ONLINE BOOKING</div>
              <div style={{ fontSize:'15px', fontWeight:800, color:'#f0faf5', letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {club?.name ?? 'رزرو میز'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth:'760px', margin:'0 auto', padding:'clamp(20px,4vw,40px) clamp(16px,3vw,24px)' }}>

          {/* Step indicator */}
          <div style={{ display:'flex', gap:'6px', marginBottom:'32px' }}>
            {[{n:1,l:'میز و تاریخ'},{n:2,l:'ساعت'},{n:3,l:'تأیید'}].map((s,i) => (
              <div key={s.n} style={{ flex:1 }}>
                <div style={{ height:'2px', borderRadius:'1px', marginBottom:'8px', transition:'all 0.4s', background: step >= s.n ? 'linear-gradient(90deg,#10b981,#06b6d4)' : 'rgba(255,255,255,0.06)', boxShadow: step >= s.n ? '0 0 8px rgba(16,185,129,0.4)' : 'none' }} />
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div style={{ width:'20px', height:'20px', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:800, transition:'all 0.3s', background: step > s.n ? '#10b981' : step === s.n ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.06)', color: step >= s.n ? '#fff' : 'rgba(240,250,245,0.25)', boxShadow: step === s.n ? '0 4px 12px rgba(16,185,129,0.4)' : 'none' }}>
                    {step > s.n ? <Check size={11} /> : toFa(s.n)}
                  </div>
                  <span style={{ fontSize:'11px', fontWeight: step === s.n ? 700 : 400, color: step >= s.n ? '#10b981' : 'rgba(240,250,245,0.25)', transition:'color 0.3s', letterSpacing:'0.02em' }}>{s.l}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px 18px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'12px', marginBottom:'20px' }}>
              <AlertCircle size={16} style={{ color:'#ef4444', flexShrink:0 }} />
              <span style={{ fontSize:'13px', color:'#fca5a5', flex:1 }}>{error}</span>
              <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(239,68,68,0.5)', padding:0 }}><X size={14} /></button>
            </div>
          )}

          {/* ════ STEP 1 — Table + Calendar ════ */}
          {step === 1 && (
            <div style={{ animation:'fadeUp 0.4s ease both' }}>

              {/* Tables */}
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'clamp(18px,3vw,26px)', marginBottom:'16px' }} className="booking-inner">
                <div style={{ fontSize:'13px', fontWeight:700, color:'rgba(240,250,245,0.55)', marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px', letterSpacing:'0.02em' }}>
                  <span style={{ width:'3px', height:'14px', background:'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius:'2px', display:'inline-block' }} />
                  انتخاب میز
                </div>

                {tables.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px', color:'rgba(240,250,245,0.3)', fontSize:'14px' }}>
                    <div style={{ fontSize:'36px', marginBottom:'12px', opacity:0.15 }}>🎱</div>
                    میزی یافت نشد
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {tables.map(table => {
                      const color      = typeColor[table.type] ?? '#10b981';
                      const isSelected = selectedTable?.id === table.id;
                      return (
                        <div key={table.id} className={`table-item ${isSelected ? 'active' : ''}`}
                          onClick={() => { setSelectedTable(table); setSelectedSlots([]); }}
                          style={{ borderColor: isSelected ? `${color}45` : 'rgba(255,255,255,0.08)', background: isSelected ? `${color}0e` : 'rgba(255,255,255,0.03)', boxShadow: isSelected ? `0 0 0 1px ${color}20, 0 10px 30px rgba(0,0,0,0.4)` : 'none' }}>

                          {/* emoji */}
                          <div style={{ width:'44px', height:'44px', borderRadius:'13px', background:`${color}12`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>🎱</div>

                          {/* info */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                              <span style={{ fontSize:'15px', fontWeight:800, color: isSelected ? color : '#f0faf5', letterSpacing:'-0.01em' }}>{table.name}</span>
                              <span style={{ fontSize:'9px', color, background:`${color}12`, border:`1px solid ${color}22`, borderRadius:'20px', padding:'2px 9px', fontWeight:700, letterSpacing:'0.06em' }}>
                                {typeLabel[table.type] ?? table.type}
                              </span>
                            </div>
                            {(table.brand || table.model) && (
                              <div style={{ fontSize:'11px', color:'rgba(240,250,245,0.35)' }}>{table.brand} {table.model}</div>
                            )}
                          </div>

                          {/* price */}
                          <div style={{ textAlign:'left', flexShrink:0 }}>
                            <div style={{ fontSize:'16px', fontWeight:900, color, letterSpacing:'-0.02em', textShadow: isSelected ? `0 0 16px ${color}60` : 'none' }}>
                              {table.pricePerHour > 0 ? toFa(table.pricePerHour.toLocaleString()) : 'رایگان'}
                            </div>
                            {table.pricePerHour > 0 && <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)', marginTop:'2px' }}>تومان / ساعت</div>}
                          </div>

                          {isSelected && (
                            <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 4px 12px ${color}50` }}>
                              <Check size={14} style={{ color:'#fff' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Calendar */}
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'clamp(18px,3vw,26px)', marginBottom:'20px' }} className="booking-inner">
                <div style={{ fontSize:'13px', fontWeight:700, color:'rgba(240,250,245,0.55)', marginBottom:'20px', display:'flex', alignItems:'center', gap:'8px', letterSpacing:'0.02em' }}>
                  <span style={{ width:'3px', height:'14px', background:'linear-gradient(180deg,#f59e0b,#10b981)', borderRadius:'2px', display:'inline-block' }} />
                  انتخاب تاریخ
                </div>

                <JalaliCalendar
                  jYear={jYear} jMonth={jMonth}
                  selectedDay={jDay}
                  todayJY={todayJY} todayJM={todayJM} todayJD={todayJD}
                  onSelect={setJDay}
                  onPrevMonth={prevMonth}
                  onNextMonth={nextMonth}
                />

                {jDay && (
                  <div style={{ marginTop:'16px', padding:'12px 16px', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <Check size={14} style={{ color:'#10b981', flexShrink:0 }} />
                    <span style={{ fontSize:'13px', color:'#10b981', fontWeight:600 }}>{dateLabel} انتخاب شد</span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => {
                  if (!selectedTable) { setError('لطفاً یک میز انتخاب کنید'); return; }
                  if (!jDay) { setError('لطفاً تاریخ را انتخاب کنید'); return; }
                  setError(''); setStep(2);
                }}
                disabled={!canGoStep2}
                style={{ width:'100%', padding:'16px', borderRadius:'14px', border:'none', background: canGoStep2 ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.05)', color: canGoStep2 ? '#fff' : 'rgba(240,250,245,0.2)', fontSize:'15px', fontWeight:800, cursor: canGoStep2 ? 'pointer' : 'not-allowed', fontFamily:'inherit', transition:'all 0.3s', boxShadow: canGoStep2 ? '0 8px 28px rgba(16,185,129,0.3)' : 'none' }}>
                انتخاب ساعت ←
              </button>
            </div>
          )}

          {/* ════ STEP 2 — Time Slots ════ */}
          {step === 2 && selectedTable && (
            <div style={{ animation:'fadeUp 0.4s ease both' }}>

              {/* Selection summary */}
              <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'8px 16px', background:`${accentColor}0e`, border:`1px solid ${accentColor}28`, borderRadius:'100px', fontSize:'12px', color:accentColor, fontWeight:600 }}>
                  🎱 {selectedTable.name}
                  <button onClick={() => setStep(1)} style={{ background:'none', border:'none', cursor:'pointer', color:accentColor, padding:0, opacity:0.6, fontSize:'16px', lineHeight:1, display:'flex' }}>×</button>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'100px', fontSize:'12px', color:'rgba(240,250,245,0.6)', fontWeight:600 }}>
                  <Calendar size={12} style={{ color:'#10b981' }} /> {dateLabel}
                </div>
              </div>

              {/* Slots */}
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'clamp(18px,3vw,26px)', marginBottom:'16px' }} className="booking-inner">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px', flexWrap:'wrap', gap:'10px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'rgba(240,250,245,0.55)', display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ width:'3px', height:'14px', background:'linear-gradient(180deg,#06b6d4,#a78bfa)', borderRadius:'2px', display:'inline-block' }} />
                    انتخاب ساعت
                  </div>
                  {/* Legend */}
                  <div style={{ display:'flex', gap:'12px', fontSize:'10px', color:'rgba(240,250,245,0.3)' }}>
                    {[{bg:'rgba(255,255,255,0.08)',bc:'rgba(255,255,255,0.1)',l:'آزاد'},{bg:`${accentColor}14`,bc:`${accentColor}40`,l:'انتخاب'},{bg:'rgba(239,68,68,0.05)',bc:'rgba(239,68,68,0.15)',l:'مشغول'}].map((x,i) => (
                      <span key={i} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                        <span style={{ width:'12px', height:'12px', borderRadius:'4px', background:x.bg, border:`1px solid ${x.bc}`, display:'inline-block' }} />
                        {x.l}
                      </span>
                    ))}
                  </div>
                </div>

                {slotsLoading ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'40px', color:'rgba(240,250,245,0.3)', fontSize:'13px' }}>
                    <div style={{ width:'18px', height:'18px', border:'2px solid rgba(16,185,129,0.15)', borderTop:`2px solid #10b981`, borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                    در حال دریافت ساعات خالی...
                  </div>
                ) : (
                  <div className="slot-grid" style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'8px' }}>
                    {slots.map(slot => {
                      const isSel = selectedSlots.includes(slot.hour);
                      return (
                        <button key={slot.hour}
                          className={`slot-btn ${slot.isBooked ? 'slot-busy' : isSel ? 'slot-sel' : 'slot-free'}`}
                          onClick={() => toggleSlot(slot.hour, slot.isBooked)}
                          disabled={slot.isBooked}
                          style={{ borderColor: slot.isBooked ? 'rgba(239,68,68,0.14)' : isSel ? `${accentColor}50` : 'rgba(255,255,255,0.09)', background: isSel ? `${accentColor}14` : slot.isBooked ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.03)', color: isSel ? accentColor : slot.isBooked ? 'rgba(239,68,68,0.3)' : 'rgba(240,250,245,0.65)', boxShadow: isSel ? `0 0 14px ${accentColor}25` : 'none' }}>
                          <span>{toFa(slot.hour)}:۰۰</span>
                          {slot.isBooked && <span style={{ fontSize:'9px', opacity:0.7 }}>مشغول</span>}
                          {isSel && <Check size={10} style={{ position:'absolute', top:'5px', left:'5px', opacity:0.8 }} />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected range */}
                {selectedSlots.length > 0 && (
                  <div style={{ marginTop:'16px', padding:'13px 16px', background:`${accentColor}0e`, border:`1px solid ${accentColor}28`, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', color:accentColor, fontSize:'14px', fontWeight:700 }}>
                      <Clock size={14} />
                      {toFa(selectedSlots[0]??0)}:۰۰ تا {toFa((selectedSlots[selectedSlots.length-1]??0)+1)}:۰۰
                    </div>
                    <div style={{ display:'flex', gap:'10px', fontSize:'12px' }}>
                      <span style={{ color:'rgba(240,250,245,0.5)', background:'rgba(255,255,255,0.06)', padding:'4px 12px', borderRadius:'20px' }}>{toFa(selectedSlots.length)} ساعت</span>
                      <span style={{ color:accentColor, fontWeight:700, background:`${accentColor}10`, padding:'4px 12px', borderRadius:'20px' }}>{toFa(totalPrice.toLocaleString())} ت</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => { setStep(1); setError(''); }}
                  style={{ flex:1, padding:'14px', borderRadius:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(240,250,245,0.6)', fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                  ← قبلی
                </button>
                <button onClick={() => {
                  if (selectedSlots.length === 0) { setError('لطفاً حداقل یک ساعت انتخاب کنید'); return; }
                  setError(''); setStep(3);
                }} disabled={!canGoStep3}
                  style={{ flex:2, padding:'14px', borderRadius:'12px', border:'none', background: canGoStep3 ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.05)', color: canGoStep3 ? '#fff' : 'rgba(240,250,245,0.2)', fontSize:'14px', fontWeight:800, cursor: canGoStep3 ? 'pointer' : 'not-allowed', fontFamily:'inherit', transition:'all 0.3s', boxShadow: canGoStep3 ? '0 8px 24px rgba(16,185,129,0.28)' : 'none' }}>
                  تأیید نهایی →
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 3 — Confirm ════ */}
          {step === 3 && selectedTable && (
            <div style={{ animation:'fadeUp 0.4s ease both' }}>

              {/* Summary card */}
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden', marginBottom:'16px' }}>
                {/* Header */}
                <div style={{ background:`linear-gradient(135deg, ${accentColor}12, rgba(255,255,255,0.02))`, borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'18px 22px', display:'flex', alignItems:'center', gap:'14px' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'13px', background:`${accentColor}15`, border:`1px solid ${accentColor}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>🎱</div>
                  <div>
                    <div style={{ fontSize:'16px', fontWeight:800, color:'#f0faf5', letterSpacing:'-0.01em', marginBottom:'3px' }}>{selectedTable.name}</div>
                    <div style={{ fontSize:'12px', color:'rgba(240,250,245,0.4)' }}>{typeLabel[selectedTable.type] ?? selectedTable.type} · {club?.name}</div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding:'20px 22px' }}>
                  {[
                    { l:'تاریخ',     v: dateLabel,     c:'#f0faf5' },
                    { l:'ساعت',      v: `${toFa(selectedSlots[0]??0)}:۰۰ تا ${toFa((selectedSlots[selectedSlots.length-1]??0)+1)}:۰۰`, c:'#f0faf5' },
                    { l:'مدت',       v: `${toFa(selectedSlots.length)} ساعت`, c:'rgba(240,250,245,0.7)' },
                    { l:'نرخ ساعتی', v: `${toFa(selectedTable.pricePerHour.toLocaleString())} تومان`, c:'rgba(240,250,245,0.7)' },
                  ].map((r,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize:'13px', color:'rgba(240,250,245,0.4)' }}>{r.l}</span>
                      <span style={{ fontSize:'13px', fontWeight:600, color:r.c }}>{r.v}</span>
                    </div>
                  ))}
                  {totalPrice > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 0 0', marginTop:'4px' }}>
                      <span style={{ fontSize:'15px', fontWeight:800, color:'#f0faf5' }}>مبلغ کل</span>
                      <span style={{ fontSize:'22px', fontWeight:900, color:accentColor, letterSpacing:'-0.03em', textShadow:`0 0 24px ${accentColor}40` }}>
                        {toFa(totalPrice.toLocaleString())} <span style={{ fontSize:'13px', fontWeight:600, opacity:0.7 }}>تومان</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice */}
              <div style={{ padding:'13px 18px', background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.14)', borderRadius:'13px', marginBottom:'20px', fontSize:'12px', color:'rgba(240,250,245,0.45)', lineHeight:1.7 }}>
                ⚠️ پس از تأیید، پیامک اطلاع‌رسانی ارسال می‌شود. باشگاه از رزرو شما مطلع خواهد شد.
              </div>

              {/* Buttons */}
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => { setStep(2); setError(''); }}
                  style={{ flex:1, padding:'15px', borderRadius:'13px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(240,250,245,0.6)', fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
                  ← قبلی
                </button>
                <button onClick={handleConfirm} disabled={booking}
                  style={{ flex:2, padding:'15px', borderRadius:'13px', border:'none', background: booking ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:'15px', fontWeight:800, cursor: booking ? 'not-allowed' : 'pointer', fontFamily:'inherit', transition:'all 0.3s', boxShadow: booking ? 'none' : '0 8px 28px rgba(16,185,129,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  {booking
                    ? <><div style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />در حال ثبت...</>
                    : <><Check size={16} /> ثبت رزرو</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}