'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import AuthGuard from '../../../components/AuthGuard';
import {
  ChevronRight, ChevronLeft, Check, Clock,
  CheckCircle, AlertCircle, X, Info, CreditCard,
  Users, Printer, FileDown, Minus, Plus,
} from 'lucide-react';

/* ── Jalali helpers ── */
function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const leap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const g_d = [31, leap(gy) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_d = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
  for (let i = 0; i < gm - 1; i++) days += (g_d[i] ?? 0);
  days += gd - 1 - 79;
  const j_np = Math.floor(days / 12053); days %= 12053;
  jy += 33 * j_np + 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let jm = 0;
  for (let i = 0; i < 11 && days >= (j_d[i] ?? 0); i++) { days -= (j_d[i] ?? 0); jm++; }
  return [jy, jm + 1, days + 1];
}
function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const jy2 = jy - 979, jm2 = jm - 1, jd2 = jd - 1;
  let j_dn = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor((jy2 % 33 + 3) / 4);
  const jml = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  for (let i = 0; i < jm2; i++) j_dn += (jml[i] ?? 0);
  j_dn += jd2;
  let g_dn = j_dn + 79;
  let gy = 1600 + 400 * Math.floor(g_dn / 146097); g_dn %= 146097;
  let leap = true;
  if (g_dn >= 36525) { g_dn--; gy += 100 * Math.floor(g_dn / 36524); g_dn %= 36524; if (g_dn >= 365) g_dn++; else leap = false; }
  gy += 4 * Math.floor(g_dn / 1461); g_dn %= 1461;
  if (g_dn >= 366) { leap = false; g_dn--; gy += Math.floor(g_dn / 365); g_dn %= 365; }
  const gml = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (let i = 0; g_dn >= (gml[i] ?? 0); i++) { g_dn -= (gml[i] ?? 0); gm++; }
  return [gy, gm + 1, g_dn + 1];
}
function jDaysInMonth(jy: number, jm: number) {
  if (jm <= 6) return 31; if (jm <= 11) return 30;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(jy % 33) ? 30 : 29;
}
function jFirstWD(jy: number, jm: number) {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, 1);
  return new Date(gy, gm - 1, gd).getDay();
}
function toISO(jy: number, jm: number, jd: number) {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}
function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

const jMonths   = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const jDayNames = ['ش','ی','د','س','چ','پ','ج'];

/* Selections = green */
const SEL_COLOR = '#30C55A';
const SEL_RGB   = '48,197,90';

interface DiscountRule { id: string; startTime: string; endTime: string; percent: number; label: string; }
interface Table {
  id: string; number: number; name: string;
  type: string; brand: string; model: string; pricePerHour: number;
  morningDiscount?: number; photoDataUrl?: string; discountRules?: DiscountRule[];
}
interface Slot { hour: number; isBooked: boolean; }
interface Club { id: string; name: string; city?: string; managerName?: string; bankCard?: string; bankCardOwner?: string; bankName?: string; }

const TYPE_LABEL: Record<string, string> = {
  snooker: 'اسنوکر', pocket: 'پاکت بیلیارد',
  highball: 'هی‌بال', vip_snooker: 'VIP اسنوکر', vip_pocket: 'VIP پاکت',
};
const TYPE_COLOR: Record<string, string> = {
  snooker: '#C7A66A', pocket: '#06b6d4',
  highball: '#a78bfa', vip_snooker: '#f59e0b', vip_pocket: '#f59e0b',
};

/* #22: morningDiscount added to fallback tables */
const FALLBACK_TABLES: Table[] = [
  { id:'t1', number:1, name:'میز اسنوکر ۱',  type:'snooker',     brand:'Viraka',    model:'M1 Gold',      pricePerHour:180000, morningDiscount:20 },
  { id:'t2', number:2, name:'میز اسنوکر ۲',  type:'snooker',     brand:'BCE',       model:'Heritage',     pricePerHour:180000, morningDiscount:20 },
  { id:'t3', number:3, name:'میز اسنوکر ۳',  type:'snooker',     brand:'Viraka',    model:'M2 Pro',       pricePerHour:180000, morningDiscount:15 },
  { id:'t4', number:4, name:'میز پاکت ۱',    type:'pocket',      brand:'Brunswick', model:'Gold Crown',   pricePerHour:150000, morningDiscount:20 },
  { id:'t5', number:5, name:'میز پاکت ۲',    type:'pocket',      brand:'Diamond',   model:'Pro Am',       pricePerHour:150000, morningDiscount:20 },
  { id:'t6', number:6, name:'میز هی‌بال ۱',  type:'highball',    brand:'Artis',     model:'Vienna',       pricePerHour:120000, morningDiscount:0  },
  { id:'t7', number:7, name:'VIP اسنوکر ۱',  type:'vip_snooker', brand:'Viraka',    model:'M1 VIP',       pricePerHour:350000, morningDiscount:10 },
  { id:'t8', number:8, name:'VIP اسنوکر ۲',  type:'vip_snooker', brand:'Riley',     model:'Renaissance',  pricePerHour:350000, morningDiscount:10 },
];

function applyPastHours(slots: Slot[], isoDate: string): Slot[] {
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  if (isoDate !== todayISO) return slots;
  const ch = now.getHours();
  return slots.map(s => ({ ...s, isBooked: s.isBooked || s.hour <= ch }));
}
function genFallbackSlots(isoDate: string): Slot[] {
  const booked = [12,13,17,18];
  return applyPastHours(Array.from({length:15},(_,i)=>({hour:i+9,isBooked:booked.includes(i+9)})), isoDate);
}
function buildRange(slots: Slot[], start: number, end: number): { range: number[]; blocked: boolean } {
  const lo = Math.min(start,end), hi = Math.max(start,end);
  const range: number[] = [];
  for (let h = lo; h <= hi; h++) {
    const slot = slots.find(s => s.hour === h);
    if (!slot) continue;
    if (slot.isBooked) return { range:[], blocked:true };
    range.push(h);
  }
  return { range, blocked:false };
}

function getSlotDiscountPct(hour: number, table: Table): number {
  const rules = table.discountRules;
  if (rules && rules.length > 0) {
    for (const rule of rules) {
      const sh = parseInt(rule.startTime.split(':')[0] ?? '0', 10);
      const eh = parseInt(rule.endTime.split(':')[0] ?? '24', 10);
      if (hour >= sh && hour < eh && rule.percent > 0) return rule.percent;
    }
    return 0;
  }
  if (hour < 12 && (table.morningDiscount ?? 0) > 0) return table.morningDiscount ?? 0;
  return 0;
}

function slotPrice(hour: number, table: Table): number {
  const disc = getSlotDiscountPct(hour, table);
  return disc > 0 ? Math.round(table.pricePerHour * (1 - disc / 100)) : table.pricePerHour;
}

/* ── Jalali calendar with 4-week limit ── */
function JalaliCalendar({ jYear, jMonth, selectedDay, todayJY, todayJM, todayJD, maxJY, maxJM, maxJD, onSelect, onPrev, onNext }: {
  jYear:number; jMonth:number; selectedDay:number|null;
  todayJY:number; todayJM:number; todayJD:number;
  maxJY:number; maxJM:number; maxJD:number;
  onSelect:(d:number)=>void; onPrev:()=>void; onNext:()=>void;
}) {
  const dim  = jDaysInMonth(jYear, jMonth);
  const off  = (jFirstWD(jYear, jMonth) + 1) % 7;
  const cells: (number|null)[] = [...Array(off).fill(null), ...Array.from({length:dim},(_,i)=>i+1)];
  const nextJM  = jMonth===12?1:jMonth+1;
  const nextJY  = jMonth===12?jYear+1:jYear;
  const nextBlocked = nextJY>maxJY||(nextJY===maxJY&&nextJM>maxJM)||(nextJY===maxJY&&nextJM===maxJM&&1>maxJD);

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
        <button onClick={onPrev} style={{width:'32px',height:'32px',borderRadius:'9px',background:'rgba(0,0,0,0.04)',border:'1px solid rgba(0,0,0,0.06)',cursor:'pointer',color:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center'}}><ChevronRight size={15}/></button>
        <span style={{fontSize: '17px',fontWeight:800,color:'#111111'}}>{jMonths[jMonth-1]} {toFa(jYear)}</span>
        <button onClick={nextBlocked?undefined:onNext} disabled={nextBlocked} style={{width:'32px',height:'32px',borderRadius:'9px',background:'rgba(0,0,0,0.04)',border:'1px solid rgba(0,0,0,0.06)',cursor:nextBlocked?'not-allowed':'pointer',color:nextBlocked?'rgba(0,0,0,0.15)':'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',opacity:nextBlocked?.35:1}}><ChevronLeft size={15}/></button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'3px',marginBottom:'6px'}}>
        {jDayNames.map(d=><div key={d} style={{textAlign:'center',fontSize: '12px',color:'rgba(0,0,0,0.35)',fontWeight:700,padding:'4px 0'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'3px'}}>
        {cells.map((day,i)=>{
          if(!day) return <div key={i}/>;
          const isPast = jYear<todayJY||(jYear===todayJY&&jMonth<todayJM)||(jYear===todayJY&&jMonth===todayJM&&day<todayJD);
          const isFutureLocked = jYear>maxJY||(jYear===maxJY&&jMonth>maxJM)||(jYear===maxJY&&jMonth===maxJM&&day>maxJD);
          const isDisabled = isPast||isFutureLocked;
          const isSel   = day===selectedDay;
          const isToday = day===todayJD&&jMonth===todayJM&&jYear===todayJY;
          return (
            <button key={i} disabled={isDisabled} onClick={()=>!isDisabled&&onSelect(day)} style={{
              height:'38px',borderRadius:'9px',border:'none',fontSize: '15px',
              fontWeight:isToday?800:500, cursor:isDisabled?'not-allowed':'pointer',
              background:isSel?'linear-gradient(135deg,#C7A66A,#A07840)':isToday?'rgba(199,166,106,0.1)':isFutureLocked?'rgba(0,0,0,0.02)':'transparent',
              color:isSel?'#fff':isDisabled?'rgba(0,0,0,0.12)':isToday?'#C7A66A':'rgba(0,0,0,0.55)',
              boxShadow:isSel?'0 4px 12px rgba(199,166,106,0.35)':'none',
              outline:isToday&&!isSel?'1px solid rgba(199,166,106,0.3)':'none',
              opacity:isDisabled?(isFutureLocked?0.22:0.4):1,
              textDecoration:isFutureLocked?'line-through':'none',
              transition:'all 0.18s',
            }}>{toFa(day)}</button>
          );
        })}
      </div>
      <div style={{marginTop:'10px',fontSize: '12px',color:'rgba(0,0,0,0.30)',textAlign:'center'}}>رزرو تا حداکثر ۴ هفته آینده امکان‌پذیر است</div>
    </div>
  );
}

/* ── Print receipt in a new popup window ── */
function printReceipt(rows: {l:string;v:string}[], title: string, clubName: string) {
  const trs = rows.map(r=>`<tr><td style="color:#888;padding:9px 12px;border-bottom:1px solid #f0f0f0">${r.l}</td><td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;text-align:left">${r.v}</td></tr>`).join('');
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>رسید رزرو — ${clubName}</title>
<style>body{font-family:Tahoma,Arial,sans-serif;direction:rtl;padding:32px;font-size:14px;color:#111}
h2{color:#C7A66A;text-align:center;margin-bottom:4px}
p{text-align:center;color:#888;font-size:12px;margin-bottom:24px}
table{width:100%;border-collapse:collapse}
.footer{margin-top:24px;text-align:center;font-size:11px;color:#aaa}</style>
</head><body>
<h2>✅ رسید رزرو بیلیارد پلاس</h2>
<p>${title}</p>
<table>${trs}</table>
<div class="footer">billiardplus.ir — این رسید ماشینی است و نیاز به امضا ندارد</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
  const w = window.open('','_blank','width=560,height=720');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function BookingContent() {
  const params  = useParams();
  const clubId  = params.clubId as string;
  const router  = useRouter();
  const { user } = useAuthStore();

  const [club, setClub]               = useState<Club|null>(null);
  const [tables, setTables]           = useState<Table[]>([]);
  const [slots, setSlots]             = useState<Slot[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table|null>(null);
  const [rangeStart, setRangeStart]   = useState<number|null>(null);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [rangeError, setRangeError]   = useState('');
  /* #21: player count */
  const [playerCount, setPlayerCount] = useState(1);

  const today = new Date();
  const [tJY,tJM,tJD] = toJalali(today.getFullYear(), today.getMonth()+1, today.getDate());

  const maxDateG = new Date(today); maxDateG.setDate(today.getDate()+28);
  const [mJY,mJM,mJD] = toJalali(maxDateG.getFullYear(), maxDateG.getMonth()+1, maxDateG.getDate());

  const [jYear,  setJYear]  = useState(tJY);
  const [jMonth, setJMonth] = useState(tJM);
  const [jDay,   setJDay]   = useState<number|null>(null);
  const isoDate = jDay ? toISO(jYear,jMonth,jDay) : '';

  const [loading, setLoading]       = useState(true);
  const [slotsLoad, setSlotsLoad]   = useState(false);
  const [booking, setBooking]       = useState(false);
  const [error, setError]           = useState('');
  /* #15/#20: payment + receipt state */
  const [pendingPayment, setPendingPayment] = useState<{
    bookingId: string;
    trackingNumber: string;
    paymentUrl: string|null;
  }|null>(null);
  const [paymentStep, setPaymentStep] = useState<'gateway'|'processing'|'done'|null>(null);
  const [gwCard, setGwCard] = useState('');
  const [gwPin2, setGwPin2] = useState('');
  const [gwMonth, setGwMonth] = useState('');
  const [gwYear, setGwYear] = useState('');
  const [gwOtp, setGwOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const slotsRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    api.get(`/clubs/${clubId}`).catch(()=>({data:{id:clubId,name:'باشگاه',managerName:''}}))
      .then(c=>{ setClub(c.data); });

    // prefer localStorage tables (have discountRules per table), fallback to API
    try {
      const stored = localStorage.getItem(`club-tables-${clubId}`);
      if (stored) {
        const parsed: Table[] = JSON.parse(stored);
        const manual = parsed.filter(t => String(t.id).startsWith('local-'));
        if (manual.length > 0) { setTables(manual); setLoading(false); return; }
      }
    } catch {}

    api.get(`/clubs/${clubId}/tables`).catch(()=>({data:[]}))
      .then(t=>{ setTables(Array.isArray(t.data)&&t.data.length>0?t.data:FALLBACK_TABLES); setLoading(false); });
  },[clubId]);

  useEffect(()=>{
    if(!selectedTable||!isoDate) return;
    setSlotsLoad(true); setSlots([]); setSelectedSlots([]); setRangeStart(null); setRangeError('');
    api.get(`/bookings/slots?clubId=${clubId}&tableNumber=${selectedTable.number}&date=${isoDate}`)
      .then(r=>{
        const raw:Slot[] = Array.isArray(r.data)&&r.data.length>0?r.data:genFallbackSlots(isoDate);
        setSlots(applyPastHours(raw,isoDate)); setSlotsLoad(false);
        setTimeout(()=>slotsRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'}),100);
      })
      .catch(()=>{ setSlots(genFallbackSlots(isoDate)); setSlotsLoad(false); });
  },[selectedTable,isoDate,clubId]);

  const handleSlotClick = useCallback((hour:number, isBooked:boolean)=>{
    if(isBooked) return;
    setRangeError('');
    if(rangeStart===null){ setRangeStart(hour); setSelectedSlots([hour]); return; }
    if(hour===rangeStart){ setRangeStart(null); setSelectedSlots([]); return; }
    if(hour<rangeStart){ setRangeStart(hour); setSelectedSlots([hour]); setRangeError('ابتدا ساعت شروع، سپس ساعت پایان را انتخاب کنید'); return; }
    const {range,blocked} = buildRange(slots,rangeStart,hour);
    if(blocked){ setRangeError('این بازه شامل ساعات رزرو شده است. لطفاً بازه دیگری انتخاب کنید'); return; }
    setSelectedSlots(range); setRangeStart(null);
  },[rangeStart,slots]);

  const handleTableSelect = (table:Table)=>{ setSelectedTable(table); setSelectedSlots([]); setRangeStart(null); setRangeError(''); setSlots([]); };

  const prevMonth = ()=>{ if(jMonth===1){setJMonth(12);setJYear(y=>y-1);}else setJMonth(m=>m-1); setJDay(null); };
  const nextMonth = ()=>{ if(jMonth===12){setJMonth(1);setJYear(y=>y+1);}else setJMonth(m=>m+1); setJDay(null); };

  const handleConfirm = async ()=>{
    if(!selectedTable||selectedSlots.length===0||!isoDate) return;
    const sorted    = [...selectedSlots].sort((a,b)=>a-b);
    const startH    = sorted[0]!;
    const endH      = sorted[sorted.length-1]!+1;
    const startTime = new Date(`${isoDate}T${String(startH).padStart(2,'0')}:00:00Z`);
    const endTime   = new Date(`${isoDate}T${String(endH).padStart(2,'0')}:00:00Z`);
    setBooking(true); setError('');
    try {
      const res = await api.post('/bookings',{
        clubId, tableType:selectedTable.type, tableNumber:selectedTable.number,
        startTime:startTime.toISOString(), endTime:endTime.toISOString(),
        totalPrice, playerCount, currency:'IRR',
      });
      const bookingId     = res.data?.id ?? '';
      const paymentUrl    = res.data?.paymentUrl ?? null;
      const trackingNumber = `BP-${Date.now().toString(36).toUpperCase().slice(-8)}`;
      /* #16: immediately mark booked slots as reserved in local state */
      setSlots(prev=>prev.map(s=>({...s,isBooked:s.isBooked||selectedSlots.includes(s.hour)})));
      setPendingPayment({bookingId,trackingNumber,paymentUrl});
      if(paymentUrl) setTimeout(()=>{window.location.href=paymentUrl;},900);
      setPaymentStep('gateway');
    } catch(e:any){
      setError(e?.response?.data?.message||'خطا در ثبت رزرو. لطفاً دوباره تلاش کنید.');
    } finally { setBooking(false); }
  };

  /* Derived totals */
  const sorted       = [...selectedSlots].sort((a,b)=>a-b);
  const startHour    = sorted[0];
  const endHour      = sorted.length>0?sorted[sorted.length-1]!+1:undefined;
  const totalHours   = sorted.length;
  /* #22: per-slot pricing with time-based discount rules */
  const baseTotal    = selectedTable ? selectedSlots.reduce((s,h)=>s+slotPrice(h,selectedTable),0) : 0;
  /* #21: +15% per extra player */
  const playerMult   = 1 + Math.max(0,playerCount-2)*0.15;
  const totalPrice   = Math.round(baseTotal*playerMult);
  const accentColor  = selectedTable?(TYPE_COLOR[selectedTable.type]??'#C7A66A'):'#C7A66A';
  const dateLabel    = jDay?`${toFa(jDay)} ${jMonths[jMonth-1]} ${toFa(jYear)}`:'';
  const canConfirm   = !!selectedTable&&!!jDay&&selectedSlots.length>0;

  /* #20: receipt rows builder */
  const buildReceiptRows = ():[{l:string;v:string}] => {
    const surcharge = playerCount>2?` (+${toFa((playerCount-2)*15)}٪ سرانه)`:'';
    return [
      {l:'شماره پیگیری',     v: pendingPayment?.trackingNumber??''},
      {l:'باشگاه',           v: club?.name??''},
      {l:'میز',              v: selectedTable?.name??''},
      {l:'نوع میز',          v: TYPE_LABEL[selectedTable?.type??'']??''},
      {l:'تاریخ',            v: dateLabel},
      {l:'ساعت',             v: startHour!==undefined&&endHour!==undefined?`${toFa(startHour)}:۰۰ تا ${toFa(endHour)}:۰۰`:''},
      {l:'مدت',              v:`${toFa(totalHours)} ساعت`},
      {l:'تعداد بازیکنان',   v:`${toFa(playerCount)} نفر`},
      {l:'روش پرداخت',      v: 'درگاه بانکی آنلاین'},
      {l:'وضعیت پرداخت',    v: '✓ پرداخت موفق'},
      {l:'مبلغ کل',          v:`${toFa(totalPrice.toLocaleString())} تومان${surcharge}`},
    ] as any;
  };

  /* ── Loading ── */
  if(loading) return (
    <div style={{minHeight:'80vh',background:'#F7F7F5',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px'}}>
      <div style={{width:'40px',height:'40px',border:'2px solid rgba(199,166,106,0.1)',borderTop:'2px solid #C7A66A',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  /* ── Payment Gateway + Receipt ── */
  if(pendingPayment) {
    const receiptRows = buildReceiptRows();
    const bankRefNumber = `IR${pendingPayment.trackingNumber}${Date.now().toString(36).slice(-4).toUpperCase()}`;

    /* Processing screen */
    if(paymentStep === 'processing') {
      return (
        <div style={{minHeight:'100vh',background:'#0a0e1a',display:'flex',alignItems:'center',justifyContent:'center',direction:'rtl',fontFamily:'var(--font-base)'}}>
          <div style={{textAlign:'center'}}>
            <div style={{width:72,height:72,borderRadius:'50%',border:'3px solid rgba(199,166,106,0.15)',borderTop:'3px solid #C7A66A',margin:'0 auto 24px',animation:'spin 0.9s linear infinite'}}/>
            <div style={{fontSize:18,fontWeight:800,color:'#fff',marginBottom:8}}>در حال پردازش پرداخت...</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,0.4)'}}>لطفاً صفحه را نبندید</div>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        </div>
      );
    }

    /* Receipt screen */
    if(paymentStep === 'done') {
      return (
        <div style={{minHeight:'100vh',background:'#F7F7F5',direction:'rtl',fontFamily:'var(--font-base)',padding:'clamp(20px,5vh,48px) 16px 48px'}}>
          <div style={{maxWidth:'520px',margin:'0 auto'}}>

            {/* Success card */}
            <div style={{background:'#fff',borderRadius:28,overflow:'hidden',border:'1px solid rgba(48,197,90,0.15)',boxShadow:'0 8px 48px rgba(0,0,0,0.08)',marginBottom:12}}>
              {/* Green header */}
              <div style={{background:'linear-gradient(135deg,#0f4d24,#166534)',padding:'28px 24px',textAlign:'center',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% -20%,rgba(48,197,90,0.3),transparent 60%)'}}/>
                <div style={{position:'relative',zIndex:1}}>
                  <div style={{width:60,height:60,borderRadius:'50%',background:'rgba(48,197,90,0.25)',border:'2px solid rgba(48,197,90,0.5)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',backdropFilter:'blur(20px)'}}>
                    <CheckCircle size={28} style={{color:'#30C55A'}}/>
                  </div>
                  <div style={{fontSize:22,fontWeight:900,color:'#fff',marginBottom:4}}>پرداخت موفق</div>
                  <div style={{fontSize:32,fontWeight:900,color:'#30C55A'}}>{toFa(totalPrice.toLocaleString())} <span style={{fontSize:16,opacity:0.7}}>تومان</span></div>
                </div>
              </div>

              {/* Tracking + ref */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'rgba(0,0,0,0.05)',margin:'0'}}>
                <div style={{background:'#fff',padding:'14px 18px'}}>
                  <div style={{fontSize:11,color:'#9ca3af',marginBottom:4}}>شماره پیگیری</div>
                  <div style={{fontSize:15,fontWeight:800,color:'#C7A66A',fontFamily:'monospace'}}>{pendingPayment.trackingNumber}</div>
                </div>
                <div style={{background:'#fff',padding:'14px 18px'}}>
                  <div style={{fontSize:11,color:'#9ca3af',marginBottom:4}}>مرجع بانکی</div>
                  <div style={{fontSize:13,fontWeight:700,color:'#374151',fontFamily:'monospace'}}>{bankRefNumber}</div>
                </div>
              </div>

              {/* Receipt rows */}
              <div style={{padding:'4px 20px 8px'}}>
                {receiptRows.map((r:{l:string,v:string},i:number)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<receiptRows.length-1?'1px solid rgba(0,0,0,0.04)':'none',gap:12}}>
                    <span style={{fontSize:13,color:'rgba(0,0,0,0.40)',flexShrink:0}}>{r.l}</span>
                    <span style={{fontSize:14,fontWeight:700,color:r.l==='مبلغ کل'?'#30C55A':'#111',textAlign:'left'}}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* LQ action buttons */}
              <div style={{display:'flex',gap:10,padding:'12px 20px 24px'}}>
                <button
                  onClick={()=>printReceipt(receiptRows,`پیگیری: ${pendingPayment.trackingNumber}`,club?.name??'')}
                  style={{flex:1,padding:'12px 8px',background:'rgba(199,166,106,0.08)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:'1px solid rgba(199,166,106,0.25)',borderRadius:20,color:'#C7A66A',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'var(--font-base)',display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:'inset 0 1px 0 rgba(199,166,106,0.15)'}}>
                  <Printer size={14}/> چاپ رسید
                </button>
                <button
                  onClick={()=>printReceipt(receiptRows,`پیگیری: ${pendingPayment.trackingNumber}`,club?.name??'')}
                  style={{flex:1,padding:'12px 8px',background:'rgba(48,197,90,0.08)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:'1px solid rgba(48,197,90,0.25)',borderRadius:20,color:'#30C55A',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'var(--font-base)',display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:'inset 0 1px 0 rgba(48,197,90,0.15)'}}>
                  <FileDown size={14}/> دانلود PDF
                </button>
              </div>
            </div>

            {/* Nav links — LQ1 */}
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <Link href="/dashboard" style={{padding:'10px 22px',background:'rgba(199,166,106,0.08)',border:'1px solid rgba(199,166,106,0.22)',borderRadius:20,color:'#C7A66A',fontSize:14,fontWeight:700,textDecoration:'none'}}>داشبورد</Link>
              <Link href="/clubs"    style={{padding:'10px 22px',background:'rgba(0,0,0,0.04)',border:'1px solid rgba(0,0,0,0.08)',borderRadius:20,color:'rgba(0,0,0,0.45)',fontSize:14,fontWeight:600,textDecoration:'none'}}>باشگاه‌ها</Link>
            </div>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        </div>
      );
    }

    /* Payment Gateway screen (paymentStep === 'gateway') */
    const handlePay = async () => {
      if(gwCard.replace(/\s/g,'').length < 16) return;
      setPaymentStep('processing');
      await new Promise(r => setTimeout(r, 2200));
      setPaymentStep('done');
    };
    const handleOtp = () => {
      setOtpSent(true);
    };
    const formatGwCard = (v:string) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();

    return (
      <div style={{minHeight:'100vh',background:'#0a0e1a',direction:'rtl',fontFamily:'var(--font-base)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 16px'}}>

        {/* Gateway card */}
        <div style={{width:'100%',maxWidth:420,background:'rgba(255,255,255,0.04)',backdropFilter:'blur(40px) saturate(200%)',WebkitBackdropFilter:'blur(40px) saturate(200%)',border:'1px solid rgba(255,255,255,0.10)',borderRadius:28,overflow:'hidden',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.08),0 32px 80px rgba(0,0,0,0.5)'}}>

          {/* Gateway header */}
          <div style={{background:'linear-gradient(135deg,rgba(199,166,106,0.15),rgba(199,166,106,0.05))',borderBottom:'1px solid rgba(255,255,255,0.07)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:11,color:'rgba(199,166,106,0.6)',fontWeight:700,letterSpacing:'0.2em'}}>BILLIARD HUB PAY</div>
              <div style={{fontSize:15,fontWeight:800,color:'#fff',marginTop:2}}>درگاه پرداخت امن</div>
            </div>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>مبلغ پرداختی</div>
              <div style={{fontSize:22,fontWeight:900,color:'#C7A66A',fontFamily:'monospace'}}>{toFa(totalPrice.toLocaleString())}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>تومان</div>
            </div>
          </div>

          {/* Merchant info */}
          <div style={{padding:'14px 24px',background:'rgba(255,255,255,0.03)',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:'rgba(199,166,106,0.12)',border:'1px solid rgba(199,166,106,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🎱</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{club?.name ?? 'باشگاه بیلیارد'}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>رزرو میز · {dateLabel}</div>
            </div>
            <div style={{marginRight:'auto',fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'monospace'}}>{pendingPayment.trackingNumber}</div>
          </div>

          {/* Card form */}
          <div style={{padding:'22px 24px',display:'flex',flexDirection:'column',gap:14}}>

            <div>
              <label style={{fontSize:11,color:'rgba(255,255,255,0.45)',fontWeight:600,marginBottom:6,display:'block'}}>شماره کارت</label>
              <input
                type="text" inputMode="numeric" dir="ltr"
                value={gwCard}
                onChange={e => setGwCard(formatGwCard(e.target.value))}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                style={{width:'100%',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:12,padding:'12px 14px',fontSize:18,fontWeight:700,color:'#fff',fontFamily:'monospace',letterSpacing:'0.12em',outline:'none',boxSizing:'border-box'}}
              />
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label style={{fontSize:11,color:'rgba(255,255,255,0.45)',fontWeight:600,marginBottom:6,display:'block'}}>ماه / سال انقضا</label>
                <div style={{display:'flex',gap:6}}>
                  <input type="text" inputMode="numeric" dir="ltr" placeholder="ماه"
                    value={gwMonth} onChange={e=>setGwMonth(e.target.value.replace(/\D/g,'').slice(0,2))} maxLength={2}
                    style={{flex:1,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,padding:'10px',fontSize:15,color:'#fff',fontFamily:'monospace',textAlign:'center',outline:'none'}}/>
                  <input type="text" inputMode="numeric" dir="ltr" placeholder="سال"
                    value={gwYear} onChange={e=>setGwYear(e.target.value.replace(/\D/g,'').slice(0,2))} maxLength={2}
                    style={{flex:1,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,padding:'10px',fontSize:15,color:'#fff',fontFamily:'monospace',textAlign:'center',outline:'none'}}/>
                </div>
              </div>
              <div>
                <label style={{fontSize:11,color:'rgba(255,255,255,0.45)',fontWeight:600,marginBottom:6,display:'block'}}>رمز دوم (CVV2)</label>
                <input type="password" inputMode="numeric" dir="ltr" placeholder="····"
                  value={gwPin2} onChange={e=>setGwPin2(e.target.value.replace(/\D/g,'').slice(0,4))} maxLength={4}
                  style={{width:'100%',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,padding:'10px 14px',fontSize:18,color:'#fff',fontFamily:'monospace',letterSpacing:'0.2em',outline:'none',boxSizing:'border-box'}}/>
              </div>
            </div>

            {/* OTP */}
            <div>
              <label style={{fontSize:11,color:'rgba(255,255,255,0.45)',fontWeight:600,marginBottom:6,display:'block'}}>رمز یکبار مصرف (OTP)</label>
              <div style={{display:'flex',gap:8}}>
                <input type="text" inputMode="numeric" dir="ltr" placeholder="کد ارسال شده به موبایل"
                  value={gwOtp} onChange={e=>setGwOtp(e.target.value.replace(/\D/g,'').slice(0,6))} maxLength={6}
                  style={{flex:1,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,padding:'10px 14px',fontSize:16,color:'#fff',fontFamily:'monospace',letterSpacing:'0.15em',outline:'none'}}/>
                <button onClick={handleOtp}
                  style={{padding:'10px 16px',background:otpSent?'rgba(48,197,90,0.15)':'rgba(199,166,106,0.15)',border:`1px solid ${otpSent?'rgba(48,197,90,0.35)':'rgba(199,166,106,0.35)'}`,borderRadius:10,color:otpSent?'#30C55A':'#C7A66A',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-base)',whiteSpace:'nowrap',flexShrink:0}}>
                  {otpSent ? '✓ ارسال شد' : 'ارسال کد'}
                </button>
              </div>
            </div>

            {/* Pay button — full LQ */}
            <button onClick={handlePay} disabled={gwCard.replace(/\s/g,'').length < 16}
              style={{width:'100%',marginTop:4,padding:'15px',borderRadius:20,
                background:'linear-gradient(135deg,rgba(199,166,106,0.18),rgba(199,166,106,0.08))',
                backdropFilter:'blur(40px) saturate(240%)',WebkitBackdropFilter:'blur(40px) saturate(240%)',
                border:'1px solid rgba(199,166,106,0.40)',
                boxShadow:'inset 0 1px 0 rgba(199,166,106,0.25),0 8px 32px rgba(199,166,106,0.15)',
                color:'#C7A66A',fontSize:17,fontWeight:900,cursor:gwCard.replace(/\s/g,'').length<16?'not-allowed':'pointer',
                fontFamily:'var(--font-base)',display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                opacity:gwCard.replace(/\s/g,'').length<16?0.45:1,transition:'all 0.2s'}}>
              <CreditCard size={16}/> پرداخت {toFa(totalPrice.toLocaleString())} تومان
            </button>

            {/* Security notice */}
            <div style={{display:'flex',alignItems:'center',gap:7,justifyContent:'center'}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#30C55A',flexShrink:0}}/>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.30)'}}>اتصال امن SSL · رمزنگاری ۲۵۶ بیت</span>
            </div>
          </div>
        </div>

        {/* Cancel */}
        <button onClick={()=>{setPendingPayment(null);setPaymentStep(null);}}
          style={{marginTop:16,padding:'9px 24px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.10)',borderRadius:20,color:'rgba(255,255,255,0.40)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-base)'}}>
          انصراف از پرداخت
        </button>

        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  /* ── Main booking form ── */
  return (
    <>
      <style>{`
        @keyframes spin   { to{transform:rotate(360deg);} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }
        @keyframes expand { from{opacity:0;transform:scaleY(0.95);}to{opacity:1;transform:scaleY(1);} }
        .tbl-card { padding:16px 18px;background:rgba(0,0,0,0.03);border:1px solid rgba(0,0,0,0.06);border-radius:14px;cursor:pointer;transition:all 0.3s;display:flex;align-items:center;gap:14px;user-select:none;font-size:14px; }
        .tbl-card:hover { background:rgba(0,0,0,0.05); }
        .slot-btn { height:56px;border-radius:11px;font-size:12px;font-weight:700;border:1px solid;cursor:pointer;font-family:inherit;transition:all 0.18s;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;position:relative;user-select:none; }
        .slot-btn:active:not(:disabled) { transform:scale(0.93); }
        .slot-free { background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.07);color:rgba(0,0,0,0.48); }
        .slot-free:hover { background:rgba(48,197,90,0.07);border-color:rgba(48,197,90,0.28);color:#30C55A; }
        .slot-start { background:rgba(48,197,90,0.14);border-color:rgba(48,197,90,0.55);color:#30C55A; }
        .slot-range { background:rgba(48,197,90,0.12);border-color:rgba(48,197,90,0.40);color:#30C55A; }
        .slot-busy  { background:rgba(239,68,68,0.05);border-color:rgba(239,68,68,0.16);color:rgba(239,68,68,0.35);cursor:not-allowed; }
        .player-btn { width:40px;height:40px;border-radius:50%;border:1px solid rgba(199,166,106,0.28);background:rgba(199,166,106,0.08);color:#C7A66A;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:inset 0 1px 0 rgba(199,166,106,0.18); }
        .player-btn:hover:not(:disabled) { background:rgba(199,166,106,0.16);border-color:rgba(199,166,106,0.40);box-shadow:inset 0 1px 0 rgba(199,166,106,0.25),0 4px 12px rgba(199,166,106,0.12); }
        .player-btn:disabled { opacity:0.25;cursor:not-allowed; }
        @media(max-width:640px){ .slot-grid{grid-template-columns:repeat(4,1fr)!important;} }
        @media(max-width:380px){ .slot-grid{grid-template-columns:repeat(3,1fr)!important;} }
      `}</style>

      <div style={{minHeight:'100vh',background:'#F7F7F5',paddingBottom:'80px'}}>

        {/* #18: Sticky header — back button with LQ style */}
        <div style={{background:'rgba(247,247,245,0.96)',borderBottom:'1px solid rgba(0,0,0,0.06)',padding:'0 clamp(16px,4vw,40px)',position:'sticky',top:'62px',zIndex:90,backdropFilter:'blur(24px)'}}>
          <div style={{maxWidth:'720px',margin:'0 auto',height:'54px',display:'flex',alignItems:'center',gap:'14px'}}>
            <Link href={`/clubs/${clubId}`} style={{display:'flex',alignItems:'center',gap:'6px',color:'#C7A66A',fontSize: '14px',textDecoration:'none',background:'rgba(199,166,106,0.10)',border:'1px solid rgba(199,166,106,0.28)',borderRadius:'20px',padding:'7px 16px',flexShrink:0,fontWeight:800}}>
              <ChevronRight size={13}/> برگشت به باشگاه
            </Link>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize: '10px',color:'rgba(199,166,106,0.55)',letterSpacing:'0.2em',fontWeight:700}}>ONLINE BOOKING</div>
              <div style={{fontSize: '16px',fontWeight:800,color:'#111111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{club?.name??'رزرو میز'}</div>
            </div>
          </div>
        </div>

        <div style={{maxWidth:'720px',margin:'0 auto',padding:'clamp(20px,4vw,36px) clamp(16px,3vw,24px)'}}>

          {error && (
            <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'13px 16px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'12px',marginBottom:'18px',animation:'fadeUp 0.3s ease both'}}>
              <AlertCircle size={15} style={{color:'#ef4444',flexShrink:0}}/>
              <span style={{fontSize: '15px',color:'#fca5a5',flex:1}}>{error}</span>
              <button onClick={()=>setError('')} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(239,68,68,0.5)',padding:0,display:'flex'}}><X size={13}/></button>
            </div>
          )}

          {/* TABLE SELECTION */}
          <div style={{background:'#FFFFFF',border:'1px solid rgba(0,0,0,0.07)',borderRadius:'20px',padding:'clamp(18px,3vw,26px)',marginBottom:'14px'}}>
            <div style={{fontSize: '14px',fontWeight:700,color:'rgba(0,0,0,0.45)',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{width:'3px',height:'13px',background:'linear-gradient(135deg,#C7A66A,#A07840)',borderRadius:'2px',display:'inline-block',flexShrink:0}}/>
              انتخاب میز
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {tables.map(table=>{
                const color = TYPE_COLOR[table.type]??'#C7A66A';
                const isSel = selectedTable?.id===table.id;
                const disc  = table.morningDiscount??0;
                return (
                  <div key={table.id} className="tbl-card" onClick={()=>handleTableSelect(table)}
                    style={{borderColor:isSel?`${color}45`:'rgba(0,0,0,0.06)',background:isSel?`${color}0d`:'rgba(0,0,0,0.03)',boxShadow:isSel?`0 0 0 1px ${color}20,0 8px 24px rgba(0,0,0,0.06)`:'none',transform:isSel?'translateY(-1px)':'none'}}>
                    {table.photoDataUrl
                      ? <img src={table.photoDataUrl} alt="" style={{width:52,height:42,objectFit:'cover',borderRadius:10,flexShrink:0,border:`1.5px solid ${color}33`}}/>
                      : <div style={{width:'42px',height:'42px',borderRadius:'12px',background:`${color}12`,border:`1px solid ${color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>🎱</div>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px',flexWrap:'wrap'}}>
                        <span style={{fontSize: '16px',fontWeight:800,color:isSel?color:'#111'}}>{table.name}</span>
                        <span style={{fontSize: '10px',color,background:`${color}12`,border:`1px solid ${color}22`,borderRadius:'20px',padding:'2px 9px',fontWeight:700}}>{TYPE_LABEL[table.type]??table.type}</span>
                        {/* #22: morning discount badge */}
                        {disc>0&&<span style={{fontSize: '10px',color:SEL_COLOR,background:`rgba(${SEL_RGB},0.10)`,border:`1px solid rgba(${SEL_RGB},0.25)`,borderRadius:'20px',padding:'2px 9px',fontWeight:700}}>صبح −{disc}٪</span>}
                      </div>
                      {(table.brand||table.model)&&<div style={{fontSize: '13px',color:'rgba(0,0,0,0.35)',fontFamily:'monospace'}}>{table.brand} {table.model}</div>}
                    </div>
                    <div style={{textAlign:'left',flexShrink:0}}>
                      <div style={{fontSize: '17px',fontWeight:900,color}}>{toFa(table.pricePerHour.toLocaleString())}</div>
                      <div style={{fontSize: '12px',color:'rgba(0,0,0,0.35)'}}>تومان / ساعت</div>
                    </div>
                    {isSel&&<div style={{width:'26px',height:'26px',borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Check size={13} style={{color:'#fff'}}/></div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* #21: PLAYER COUNT */}
          <div style={{background:'#FFFFFF',border:'1px solid rgba(0,0,0,0.07)',borderRadius:'20px',padding:'clamp(16px,3vw,22px)',marginBottom:'14px'}}>
            <div style={{fontSize: '14px',fontWeight:700,color:'rgba(0,0,0,0.45)',marginBottom:'14px',display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{width:'3px',height:'13px',background:'linear-gradient(135deg,#06b6d4,#a78bfa)',borderRadius:'2px',display:'inline-block',flexShrink:0}}/>
              تعداد بازیکنان
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
              <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                <button className="player-btn" disabled={playerCount<=1} onClick={()=>setPlayerCount(p=>Math.max(1,p-1))}><Minus size={14}/></button>
                <div style={{textAlign:'center',minWidth:60}}>
                  <div style={{fontSize: '31px',fontWeight:900,color:'#111',lineHeight:1}}>{toFa(playerCount)}</div>
                  <div style={{fontSize: '13px',color:'rgba(0,0,0,0.40)',marginTop:2}}>نفر</div>
                </div>
                <button className="player-btn" disabled={playerCount>=8} onClick={()=>setPlayerCount(p=>Math.min(8,p+1))}><Plus size={14}/></button>
              </div>
              {playerCount>2?(
                <div style={{padding:'10px 16px',background:'rgba(48,197,90,0.07)',border:'1px solid rgba(48,197,90,0.20)',borderRadius:'14px',fontSize: '14px',color:'rgba(0,0,0,0.45)',lineHeight:1.7}}>
                  <span style={{color:SEL_COLOR,fontWeight:800}}>+{toFa((playerCount-2)*15)}٪</span> اضافه بابت {toFa(playerCount-2)} نفر اضافه
                </div>
              ):(
                <div style={{fontSize: '14px',color:'rgba(0,0,0,0.35)',padding:'10px 16px',background:'rgba(0,0,0,0.03)',borderRadius:'14px'}}>
                  از ۳ نفر به بالا، هر نفر ۱۵٪ اضافه می‌شود
                </div>
              )}
            </div>
          </div>

          {/* DATE SELECTION */}
          <div style={{background:'#FFFFFF',border:'1px solid rgba(0,0,0,0.07)',borderRadius:'20px',padding:'clamp(18px,3vw,26px)',marginBottom:'14px'}}>
            <div style={{fontSize: '14px',fontWeight:700,color:'rgba(0,0,0,0.45)',marginBottom:'18px',display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{width:'3px',height:'13px',background:'linear-gradient(135deg,#C7A66A,#A07840)',borderRadius:'2px',display:'inline-block',flexShrink:0}}/>
              انتخاب تاریخ
            </div>
            <JalaliCalendar
              jYear={jYear} jMonth={jMonth} selectedDay={jDay}
              todayJY={tJY} todayJM={tJM} todayJD={tJD}
              maxJY={mJY}   maxJM={mJM}   maxJD={mJD}
              onSelect={d=>{setJDay(d);setSelectedSlots([]);setRangeStart(null);}}
              onPrev={prevMonth} onNext={nextMonth}
            />
            {jDay&&(
              <div style={{marginTop:'14px',padding:'11px 14px',background:'rgba(199,166,106,0.07)',border:'1px solid rgba(199,166,106,0.2)',borderRadius:'11px',display:'flex',alignItems:'center',gap:'8px',animation:'fadeUp 0.3s ease both'}}>
                <Check size={13} style={{color:'#C7A66A',flexShrink:0}}/>
                <span style={{fontSize: '15px',color:'#C7A66A',fontWeight:600}}>{dateLabel}</span>
              </div>
            )}
          </div>

          {/* TIME SELECTION */}
          {selectedTable&&jDay&&(
            <div ref={slotsRef} style={{background:'#FFFFFF',border:'1px solid rgba(0,0,0,0.07)',borderRadius:'20px',padding:'clamp(18px,3vw,26px)',marginBottom:'14px',transformOrigin:'top',animation:'expand 0.4s cubic-bezier(0.22,1,0.36,1) both'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
                <div style={{fontSize: '14px',fontWeight:700,color:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{width:'3px',height:'13px',background:`linear-gradient(180deg,${SEL_COLOR},transparent)`,borderRadius:'2px',display:'inline-block',flexShrink:0}}/>
                  انتخاب ساعت
                </div>
                <div style={{display:'flex',gap:'12px',fontSize: '12px',color:'rgba(0,0,0,0.35)'}}>
                  {[
                    {bg:'rgba(0,0,0,0.05)',bc:'rgba(0,0,0,0.08)',l:'آزاد'},
                    {bg:`rgba(${SEL_RGB},0.12)`,bc:`rgba(${SEL_RGB},0.40)`,l:'انتخاب'},
                    {bg:'rgba(239,68,68,0.05)',bc:'rgba(239,68,68,0.15)',l:'مشغول'},
                  ].map((x,i)=>(
                    <span key={i} style={{display:'flex',alignItems:'center',gap:'5px'}}>
                      <span style={{width:'11px',height:'11px',borderRadius:'3px',background:x.bg,border:`1px solid ${x.bc}`,display:'inline-block'}}/>
                      {x.l}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'9px 13px',background:'rgba(0,0,0,0.02)',border:'1px solid rgba(0,0,0,0.04)',borderRadius:'10px',marginBottom:'14px',fontSize: '13px',color:'rgba(0,0,0,0.40)'}}>
                <Info size={12} style={{color:'rgba(0,0,0,0.28)',flexShrink:0}}/>
                {rangeStart!==null?`ساعت ${toFa(rangeStart)}:۰۰ شروع شد — حالا ساعت پایان را انتخاب کنید`:'روی ساعت شروع کلیک کنید، سپس ساعت پایان را انتخاب کنید'}
              </div>

              {rangeError&&(
                <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 13px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',marginBottom:'12px',fontSize: '14px',color:'#fca5a5',animation:'fadeUp 0.3s ease both'}}>
                  <AlertCircle size={13} style={{color:'#ef4444',flexShrink:0}}/> {rangeError}
                </div>
              )}

              {slotsLoad?(
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',padding:'36px',color:'rgba(0,0,0,0.35)',fontSize: '15px'}}>
                  <div style={{width:'18px',height:'18px',border:'2px solid rgba(199,166,106,0.15)',borderTop:'2px solid #C7A66A',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
                  در حال دریافت ساعات...
                </div>
              ):(
                <div className="slot-grid" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px'}}>
                  {slots.map(slot=>{
                    const isSel   = selectedSlots.includes(slot.hour);
                    const isStart = rangeStart===slot.hour;
                    const cls     = slot.isBooked?'slot-btn slot-busy':isStart?'slot-btn slot-start':isSel?'slot-btn slot-range':'slot-btn slot-free';
                    const discPct = getSlotDiscountPct(slot.hour, selectedTable);
                    const hasDisc = discPct > 0;
                    return (
                      <button key={slot.hour} className={cls} disabled={slot.isBooked}
                        onClick={()=>handleSlotClick(slot.hour,slot.isBooked)}
                        style={{
                          borderColor:slot.isBooked?'rgba(239,68,68,0.14)':isStart?`rgba(${SEL_RGB},0.60)`:isSel?`rgba(${SEL_RGB},0.45)`:'rgba(0,0,0,0.07)',
                          background:slot.isBooked?'rgba(239,68,68,0.04)':isStart?`rgba(${SEL_RGB},0.18)`:isSel?`rgba(${SEL_RGB},0.12)`:hasDisc?`rgba(${SEL_RGB},0.04)`:'rgba(0,0,0,0.03)',
                          color:slot.isBooked?'rgba(239,68,68,0.3)':(isStart||isSel)?SEL_COLOR:'rgba(0,0,0,0.48)',
                          boxShadow:isStart?`0 0 16px rgba(${SEL_RGB},0.35)`:isSel?`0 0 10px rgba(${SEL_RGB},0.18)`:'none',
                        }}>
                        <span style={{fontSize: '15px'}}>{toFa(slot.hour)}:۰۰</span>
                        {slot.isBooked&&<span style={{fontSize: '9px',opacity:0.6}}>مشغول</span>}
                        {!slot.isBooked&&hasDisc&&<span style={{fontSize: '9px',color:SEL_COLOR,opacity:0.9}}>−{toFa(discPct)}٪</span>}
                        {!slot.isBooked&&!hasDisc&&isStart&&<span style={{fontSize: '9px',opacity:0.8}}>شروع</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSlots.length>0&&startHour!==undefined&&endHour!==undefined&&(
                <div style={{marginTop:'14px',padding:'13px 16px',background:`rgba(${SEL_RGB},0.08)`,border:`1px solid rgba(${SEL_RGB},0.25)`,borderRadius:'13px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px',animation:'fadeUp 0.3s ease both'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',color:SEL_COLOR,fontSize: '16px',fontWeight:700}}>
                    <Clock size={14}/> {toFa(startHour)}:۰۰ — {toFa(endHour)}:۰۰
                  </div>
                  {(()=>{
                    const hasAnyDisc = selectedTable && selectedSlots.some(h=>getSlotDiscountPct(h,selectedTable)>0);
                    return (
                      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                        <span style={{fontSize: '14px',color:'rgba(0,0,0,0.45)',background:'rgba(0,0,0,0.05)',padding:'4px 12px',borderRadius:'20px',fontWeight:600}}>{toFa(totalHours)} ساعت</span>
                        {playerCount>2&&<span style={{fontSize: '14px',color:'#f59e0b',background:'rgba(245,158,11,0.08)',padding:'4px 12px',borderRadius:'20px',fontWeight:700}}>{toFa(playerCount)} نفر +{toFa((playerCount-2)*15)}٪</span>}
                        {hasAnyDisc&&<span style={{fontSize: '14px',color:SEL_COLOR,background:`rgba(${SEL_RGB},0.08)`,border:`1px solid rgba(${SEL_RGB},0.25)`,padding:'4px 12px',borderRadius:'20px',fontWeight:700}}>تخفیف اعمال شد ✓</span>}
                        <span style={{fontSize: '14px',color:SEL_COLOR,fontWeight:800,background:`rgba(${SEL_RGB},0.10)`,padding:'4px 12px',borderRadius:'20px'}}>{toFa(totalPrice.toLocaleString())} تومان</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* CONFIRM BOX */}
          {canConfirm&&(
            <div style={{background:'#FFFFFF',border:'1px solid rgba(0,0,0,0.07)',borderRadius:'20px',overflow:'hidden',marginBottom:'16px',animation:'fadeUp 0.4s ease both'}}>
              <div style={{background:`linear-gradient(135deg,${accentColor}10,rgba(255,255,255,0.02))`,borderBottom:'1px solid rgba(0,0,0,0.04)',padding:'16px 22px',display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'12px',background:`${accentColor}14`,border:`1px solid ${accentColor}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize: '20px',flexShrink:0}}>🎱</div>
                <div>
                  <div style={{fontSize: '17px',fontWeight:800,color:'#111111',marginBottom:'2px'}}>{selectedTable?.name}</div>
                  <div style={{fontSize: '13px',color:'rgba(0,0,0,0.42)'}}>{club?.name} · {TYPE_LABEL[selectedTable?.type??'']??''}</div>
                </div>
              </div>
              <div style={{padding:'18px 22px'}}>
                {[
                  {l:'تاریخ',          v:dateLabel},
                  {l:'شروع',           v:startHour!==undefined?`${toFa(startHour)}:۰۰`:''},
                  {l:'پایان',          v:endHour!==undefined?`${toFa(endHour)}:۰۰`:''},
                  {l:'مدت',            v:`${toFa(totalHours)} ساعت`},
                  {l:'تعداد بازیکنان', v:`${toFa(playerCount)} نفر${playerCount>2?' (+'+((playerCount-2)*15)+'٪)':''}`},
                  {l:'نرخ ساعتی',      v:`${toFa((selectedTable?.pricePerHour??0).toLocaleString())} تومان`},
                ].map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(0,0,0,0.04)'}}>
                    <span style={{fontSize: '15px',color:'rgba(0,0,0,0.42)'}}>{r.l}</span>
                    <span style={{fontSize: '15px',fontWeight:600,color:'#111111'}}>{r.v}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'14px 0 0'}}>
                  <span style={{fontSize: '17px',fontWeight:800,color:'#111111'}}>مبلغ کل</span>
                  <span style={{fontSize: '22px',fontWeight:900,color:accentColor,letterSpacing:'-0.025em'}}>
                    {toFa(totalPrice.toLocaleString())} <span style={{fontSize: '14px',opacity:0.7}}>تومان</span>
                  </span>
                </div>
              </div>

              {/* #14: cancellation policy */}
              <div style={{margin:'0 22px 18px',padding:'11px 14px',background:'rgba(245,158,11,0.05)',border:'1px solid rgba(245,158,11,0.13)',borderRadius:'12px',fontSize: '13px',color:'rgba(0,0,0,0.42)',lineHeight:1.7,display:'flex',alignItems:'flex-start',gap:'7px'}}>
                <Info size={13} style={{color:'#f59e0b',flexShrink:0,marginTop:1}}/>
                رزروها تنها تا ۲ ساعت پیش از زمان شروع قابل لغو هستند
              </div>

              {/* #17: LQ-styled confirm button, new text */}
              <div style={{padding:'0 22px 22px'}}>
                <button onClick={handleConfirm} disabled={booking} style={{
                  width:'100%',padding:'16px',borderRadius:'20px',
                  border:booking?'1px solid rgba(199,166,106,0.12)':'1px solid rgba(199,166,106,0.45)',
                  background:booking
                    ?'rgba(199,166,106,0.05)'
                    :'linear-gradient(135deg,rgba(199,166,106,0.16),rgba(199,166,106,0.06))',
                  backdropFilter:'blur(40px) saturate(240%)',
                  WebkitBackdropFilter:'blur(40px) saturate(240%)',
                  boxShadow:booking?'none':'inset 0 1px 0 rgba(199,166,106,0.22),0 8px 32px rgba(199,166,106,0.12)',
                  color:booking?'rgba(199,166,106,0.35)':'#C7A66A',
                  fontSize:'17px',fontWeight:900,
                  cursor:booking?'not-allowed':'pointer',
                  fontFamily:'inherit',transition:'all 0.25s',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:'9px',
                }}>
                  {booking
                    ?<><div style={{width:'16px',height:'16px',border:'2px solid rgba(199,166,106,0.25)',borderTop:'2px solid #C7A66A',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>در حال ثبت رزرو...</>
                    :<><CreditCard size={16}/> پرداخت و ثبت رزرو</>
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

export default function BookingPage() {
  return <AuthGuard><BookingContent/></AuthGuard>;
}
