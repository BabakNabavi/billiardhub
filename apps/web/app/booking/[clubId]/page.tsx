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

interface Table {
  id: string; number: number; name: string;
  type: string; brand: string; model: string; pricePerHour: number;
  morningDiscount?: number; /* #22: % off for hours before 12:00 */
}
interface Slot { hour: number; isBooked: boolean; }
/* #20: added managerName for receipt */
interface Club { id: string; name: string; city?: string; managerName?: string; }

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

/* #22: price per slot — applies morning discount if hour < 12 */
function slotPrice(hour: number, table: Table): number {
  const disc = table.morningDiscount ?? 0;
  return hour < 12 && disc > 0 ? Math.round(table.pricePerHour * (1 - disc/100)) : table.pricePerHour;
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
        {jDayNames.map(d=><div key={d} style={{textAlign:'center',fontSize: '11px',color:'rgba(0,0,0,0.35)',fontWeight:700,padding:'4px 0'}}>{d}</div>)}
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
              height:'38px',borderRadius:'9px',border:'none',fontSize: '14px',
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
      <div style={{marginTop:'10px',fontSize: '11px',color:'rgba(0,0,0,0.30)',textAlign:'center'}}>رزرو تا حداکثر ۴ هفته آینده امکان‌پذیر است</div>
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

  const slotsRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    Promise.all([
      api.get(`/clubs/${clubId}`).catch(()=>({data:{id:clubId,name:'باشگاه',managerName:''}})),
      api.get(`/clubs/${clubId}/tables`).catch(()=>({data:[]})),
    ]).then(([c,t])=>{
      setClub(c.data);
      setTables(Array.isArray(t.data)&&t.data.length>0?t.data:FALLBACK_TABLES);
      setLoading(false);
    });
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
    } catch(e:any){
      setError(e?.response?.data?.message||'خطا در ثبت رزرو. لطفاً دوباره تلاش کنید.');
    } finally { setBooking(false); }
  };

  /* Derived totals */
  const sorted       = [...selectedSlots].sort((a,b)=>a-b);
  const startHour    = sorted[0];
  const endHour      = sorted.length>0?sorted[sorted.length-1]!+1:undefined;
  const totalHours   = sorted.length;
  /* #22: per-slot pricing with morning discount */
  const baseTotal    = selectedTable ? selectedSlots.reduce((s,h)=>s+slotPrice(h,selectedTable),0) : 0;
  /* #21: +15% per extra player */
  const playerMult   = 1 + Math.max(0,playerCount-1)*0.15;
  const totalPrice   = Math.round(baseTotal*playerMult);
  const accentColor  = selectedTable?(TYPE_COLOR[selectedTable.type]??'#C7A66A'):'#C7A66A';
  const dateLabel    = jDay?`${toFa(jDay)} ${jMonths[jMonth-1]} ${toFa(jYear)}`:'';
  const canConfirm   = !!selectedTable&&!!jDay&&selectedSlots.length>0;

  /* #20: receipt rows builder */
  const buildReceiptRows = ():[{l:string;v:string}] => {
    const surcharge = playerCount>1?` (+${toFa((playerCount-1)*15)}٪ سرانه)`:'';
    return [
      {l:'شماره پیگیری',     v: pendingPayment?.trackingNumber??''},
      {l:'باشگاه',           v: club?.name??''},
      {l:'میز',              v: selectedTable?.name??''},
      {l:'نوع میز',          v: TYPE_LABEL[selectedTable?.type??'']??''},
      {l:'تاریخ',            v: dateLabel},
      {l:'ساعت',             v: startHour!==undefined&&endHour!==undefined?`${toFa(startHour)}:۰۰ تا ${toFa(endHour)}:۰۰`:''},
      {l:'مدت',              v:`${toFa(totalHours)} ساعت`},
      {l:'تعداد بازیکنان',   v:`${toFa(playerCount)} نفر`},
      {l:'واریز به',         v: club?.managerName?`${club.managerName} — ${club?.name??''}` : club?.name??''},
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

  /* ── #15/#19/#20: Payment / Receipt screen ── */
  if(pendingPayment) {
    const receiptRows = buildReceiptRows();
    return (
      <div style={{minHeight:'100vh',background:'#F7F7F5',direction:'rtl',fontFamily:'Vazirmatn,sans-serif',paddingTop:'clamp(24px,5vh,48px)',paddingBottom:'48px',padding:'clamp(24px,5vh,48px) 16px 48px'}}>
        <div style={{maxWidth:'520px',margin:'0 auto',background:'#FFFFFF',border:'1px solid rgba(48,197,90,0.18)',borderRadius:'28px',overflow:'hidden',position:'relative'}}>
          <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'160px',height:'2px',background:'linear-gradient(90deg,transparent,rgba(48,197,90,0.5),transparent)'}}/>

          {pendingPayment.paymentUrl ? (
            /* Payment active: redirect screen */
            <div style={{padding:'clamp(28px,5vw,44px)',textAlign:'center'}}>
              <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'linear-gradient(135deg,#30C55A,#22a34a)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',boxShadow:'0 12px 36px rgba(48,197,90,0.28)'}}>
                <div style={{width:'26px',height:'26px',border:'3px solid rgba(255,255,255,0.3)',borderTop:'3px solid #fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
              </div>
              <h2 style={{fontSize: '21px',fontWeight:900,color:'#111',margin:'0 0 10px'}}>در حال اتصال به درگاه پرداخت...</h2>
              <p style={{fontSize: '14px',color:'rgba(0,0,0,0.45)',lineHeight:1.7,margin:'0 0 20px'}}>رزرو ثبت شد. لطفاً منتظر بمانید.</p>
              <a href={pendingPayment.paymentUrl} style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'12px 26px',background:'linear-gradient(135deg,#30C55A,#22a34a)',borderRadius:'13px',color:'#fff',fontSize: '15px',fontWeight:700,textDecoration:'none'}}>
                <CreditCard size={14}/> انتقال دستی به درگاه
              </a>
            </div>
          ) : (
            /* Payment inactive: full receipt */
            <>
              {/* Header */}
              <div style={{background:'linear-gradient(135deg,rgba(48,197,90,0.08),rgba(48,197,90,0.03))',borderBottom:'1px solid rgba(48,197,90,0.12)',padding:'28px 24px',textAlign:'center'}}>
                <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'linear-gradient(135deg,#30C55A,#22a34a)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 8px 24px rgba(48,197,90,0.28)'}}>
                  <CheckCircle size={26} style={{color:'#fff'}}/>
                </div>
                <h2 style={{fontSize: '22px',fontWeight:900,color:'#111',margin:'0 0 6px'}}>رزرو تأیید شد!</h2>
                <p style={{fontSize: '14px',color:'rgba(0,0,0,0.42)',margin:0,lineHeight:1.6}}>
                  برای تکمیل رزرو، پرداخت آنلاین لازم است
                </p>
              </div>

              {/* Tracking number — prominent */}
              <div style={{margin:'18px 20px 0',padding:'14px 18px',background:'rgba(199,166,106,0.06)',border:'1px solid rgba(199,166,106,0.22)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                <span style={{fontSize: '12px',color:'rgba(0,0,0,0.42)',fontWeight:600}}>شماره پیگیری</span>
                <span style={{fontSize: '18px',fontWeight:900,color:'#C7A66A',fontFamily:'monospace',letterSpacing:'0.08em'}}>{pendingPayment.trackingNumber}</span>
              </div>

              {/* Receipt rows */}
              <div style={{margin:'12px 20px'}}>
                {receiptRows.map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<receiptRows.length-1?'1px solid rgba(0,0,0,0.05)':'none',gap:12}}>
                    <span style={{fontSize: '13px',color:'rgba(0,0,0,0.40)',flexShrink:0}}>{r.l}</span>
                    <span style={{fontSize: '14px',fontWeight:700,color:r.l==='مبلغ کل'?SEL_COLOR:'#111',textAlign:'left'}}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Payment inactive notice */}
              <div style={{margin:'0 20px 20px',padding:'12px 14px',background:'rgba(245,158,11,0.05)',border:'1px solid rgba(245,158,11,0.16)',borderRadius:'12px',display:'flex',alignItems:'flex-start',gap:8}}>
                <CreditCard size={13} style={{color:'#f59e0b',flexShrink:0,marginTop:2}}/>
                <span style={{fontSize: '12px',color:'rgba(0,0,0,0.42)',lineHeight:1.7}}>
                  درگاه پرداخت به زودی فعال می‌شود. رزرو شما ثبت و نگه‌داشته شده است.
                </span>
              </div>

              {/* #20: Print / PDF buttons (LQ style), replace old dashboard/clubs links */}
              <div style={{display:'flex',gap:10,padding:'0 20px 24px'}}>
                <button onClick={()=>printReceipt(receiptRows,`پیگیری: ${pendingPayment.trackingNumber}`,club?.name??'')} style={{flex:1,padding:'12px 8px',background:'rgba(199,166,106,0.10)',border:'1px solid rgba(199,166,106,0.30)',borderRadius:'20px',color:'#C7A66A',fontSize: '14px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
                  <Printer size={14}/> چاپ رسید
                </button>
                <button onClick={()=>printReceipt(receiptRows,`پیگیری: ${pendingPayment.trackingNumber}`,club?.name??'')} style={{flex:1,padding:'12px 8px',background:'rgba(48,197,90,0.10)',border:'1px solid rgba(48,197,90,0.30)',borderRadius:'20px',color:SEL_COLOR,fontSize: '14px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
                  <FileDown size={14}/> دریافت PDF
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick nav links below the card */}
        <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:16}}>
          <Link href="/dashboard" style={{padding:'9px 20px',background:'rgba(199,166,106,0.08)',border:'1px solid rgba(199,166,106,0.22)',borderRadius:'20px',color:'#C7A66A',fontSize: '13px',fontWeight:700,textDecoration:'none'}}>داشبورد</Link>
          <Link href="/clubs"    style={{padding:'9px 20px',background:'rgba(0,0,0,0.04)',border:'1px solid rgba(0,0,0,0.08)',borderRadius:'20px',color:'rgba(0,0,0,0.45)',fontSize: '13px',fontWeight:600,textDecoration:'none'}}>باشگاه‌ها</Link>
        </div>

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
        .player-btn { width:36px;height:36px;border-radius:50%;border:1px solid rgba(199,166,106,0.30);background:rgba(199,166,106,0.08);color:#C7A66A;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit;transition:all 0.2s; }
        .player-btn:hover { background:rgba(199,166,106,0.18); }
        .player-btn:disabled { opacity:0.3;cursor:not-allowed; }
        @media(max-width:640px){ .slot-grid{grid-template-columns:repeat(4,1fr)!important;} }
        @media(max-width:380px){ .slot-grid{grid-template-columns:repeat(3,1fr)!important;} }
      `}</style>

      <div style={{minHeight:'100vh',background:'#F7F7F5',paddingBottom:'80px'}}>

        {/* #18: Sticky header — back button with LQ style */}
        <div style={{background:'rgba(247,247,245,0.96)',borderBottom:'1px solid rgba(0,0,0,0.06)',padding:'0 clamp(16px,4vw,40px)',position:'sticky',top:'62px',zIndex:90,backdropFilter:'blur(24px)'}}>
          <div style={{maxWidth:'720px',margin:'0 auto',height:'54px',display:'flex',alignItems:'center',gap:'14px'}}>
            <Link href={`/clubs/${clubId}`} style={{display:'flex',alignItems:'center',gap:'6px',color:'#C7A66A',fontSize: '13px',textDecoration:'none',background:'rgba(199,166,106,0.10)',border:'1px solid rgba(199,166,106,0.28)',borderRadius:'20px',padding:'7px 16px',flexShrink:0,fontWeight:800}}>
              <ChevronRight size={13}/> برگشت به باشگاه
            </Link>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize: '10px',color:'rgba(199,166,106,0.55)',letterSpacing:'0.2em',fontWeight:700}}>ONLINE BOOKING</div>
              <div style={{fontSize: '15px',fontWeight:800,color:'#111111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{club?.name??'رزرو میز'}</div>
            </div>
          </div>
        </div>

        <div style={{maxWidth:'720px',margin:'0 auto',padding:'clamp(20px,4vw,36px) clamp(16px,3vw,24px)'}}>

          {error && (
            <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'13px 16px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'12px',marginBottom:'18px',animation:'fadeUp 0.3s ease both'}}>
              <AlertCircle size={15} style={{color:'#ef4444',flexShrink:0}}/>
              <span style={{fontSize: '14px',color:'#fca5a5',flex:1}}>{error}</span>
              <button onClick={()=>setError('')} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(239,68,68,0.5)',padding:0,display:'flex'}}><X size={13}/></button>
            </div>
          )}

          {/* TABLE SELECTION */}
          <div style={{background:'#FFFFFF',border:'1px solid rgba(0,0,0,0.07)',borderRadius:'20px',padding:'clamp(18px,3vw,26px)',marginBottom:'14px'}}>
            <div style={{fontSize: '13px',fontWeight:700,color:'rgba(0,0,0,0.45)',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
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
                    <div style={{width:'42px',height:'42px',borderRadius:'12px',background:`${color}12`,border:`1px solid ${color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize: '22px',flexShrink:0}}>🎱</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px',flexWrap:'wrap'}}>
                        <span style={{fontSize: '15px',fontWeight:800,color:isSel?color:'#111'}}>{table.name}</span>
                        <span style={{fontSize: '10px',color,background:`${color}12`,border:`1px solid ${color}22`,borderRadius:'20px',padding:'2px 9px',fontWeight:700}}>{TYPE_LABEL[table.type]??table.type}</span>
                        {/* #22: morning discount badge */}
                        {disc>0&&<span style={{fontSize: '10px',color:SEL_COLOR,background:`rgba(${SEL_RGB},0.10)`,border:`1px solid rgba(${SEL_RGB},0.25)`,borderRadius:'20px',padding:'2px 9px',fontWeight:700}}>صبح −{disc}٪</span>}
                      </div>
                      {(table.brand||table.model)&&<div style={{fontSize: '12px',color:'rgba(0,0,0,0.35)',fontFamily:'monospace'}}>{table.brand} {table.model}</div>}
                    </div>
                    <div style={{textAlign:'left',flexShrink:0}}>
                      <div style={{fontSize: '17px',fontWeight:900,color}}>{toFa(table.pricePerHour.toLocaleString())}</div>
                      <div style={{fontSize: '11px',color:'rgba(0,0,0,0.35)'}}>تومان / ساعت</div>
                    </div>
                    {isSel&&<div style={{width:'26px',height:'26px',borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Check size={13} style={{color:'#fff'}}/></div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* #21: PLAYER COUNT */}
          <div style={{background:'#FFFFFF',border:'1px solid rgba(0,0,0,0.07)',borderRadius:'20px',padding:'clamp(16px,3vw,22px)',marginBottom:'14px'}}>
            <div style={{fontSize: '13px',fontWeight:700,color:'rgba(0,0,0,0.45)',marginBottom:'14px',display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{width:'3px',height:'13px',background:'linear-gradient(135deg,#06b6d4,#a78bfa)',borderRadius:'2px',display:'inline-block',flexShrink:0}}/>
              تعداد بازیکنان
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
              <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                <button className="player-btn" disabled={playerCount<=1} onClick={()=>setPlayerCount(p=>Math.max(1,p-1))}><Minus size={14}/></button>
                <div style={{textAlign:'center',minWidth:60}}>
                  <div style={{fontSize: '31px',fontWeight:900,color:'#111',lineHeight:1}}>{toFa(playerCount)}</div>
                  <div style={{fontSize: '12px',color:'rgba(0,0,0,0.40)',marginTop:2}}>نفر</div>
                </div>
                <button className="player-btn" disabled={playerCount>=8} onClick={()=>setPlayerCount(p=>Math.min(8,p+1))}><Plus size={14}/></button>
              </div>
              {playerCount>1?(
                <div style={{padding:'10px 16px',background:'rgba(48,197,90,0.07)',border:'1px solid rgba(48,197,90,0.20)',borderRadius:'14px',fontSize: '13px',color:'rgba(0,0,0,0.45)',lineHeight:1.7}}>
                  <span style={{color:SEL_COLOR,fontWeight:800}}>+{toFa((playerCount-1)*15)}٪</span> اضافه بابت {toFa(playerCount-1)} نفر اضافه
                </div>
              ):(
                <div style={{fontSize: '13px',color:'rgba(0,0,0,0.35)',padding:'10px 16px',background:'rgba(0,0,0,0.03)',borderRadius:'14px'}}>
                  از ۲ نفر به بالا، هر نفر ۱۵٪ اضافه می‌شود
                </div>
              )}
            </div>
          </div>

          {/* DATE SELECTION */}
          <div style={{background:'#FFFFFF',border:'1px solid rgba(0,0,0,0.07)',borderRadius:'20px',padding:'clamp(18px,3vw,26px)',marginBottom:'14px'}}>
            <div style={{fontSize: '13px',fontWeight:700,color:'rgba(0,0,0,0.45)',marginBottom:'18px',display:'flex',alignItems:'center',gap:'8px'}}>
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
                <span style={{fontSize: '14px',color:'#C7A66A',fontWeight:600}}>{dateLabel}</span>
              </div>
            )}
          </div>

          {/* TIME SELECTION */}
          {selectedTable&&jDay&&(
            <div ref={slotsRef} style={{background:'#FFFFFF',border:'1px solid rgba(0,0,0,0.07)',borderRadius:'20px',padding:'clamp(18px,3vw,26px)',marginBottom:'14px',transformOrigin:'top',animation:'expand 0.4s cubic-bezier(0.22,1,0.36,1) both'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
                <div style={{fontSize: '13px',fontWeight:700,color:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{width:'3px',height:'13px',background:`linear-gradient(180deg,${SEL_COLOR},transparent)`,borderRadius:'2px',display:'inline-block',flexShrink:0}}/>
                  انتخاب ساعت
                </div>
                <div style={{display:'flex',gap:'12px',fontSize: '11px',color:'rgba(0,0,0,0.35)'}}>
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

              <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'9px 13px',background:'rgba(0,0,0,0.02)',border:'1px solid rgba(0,0,0,0.04)',borderRadius:'10px',marginBottom:'14px',fontSize: '12px',color:'rgba(0,0,0,0.40)'}}>
                <Info size={12} style={{color:'rgba(0,0,0,0.28)',flexShrink:0}}/>
                {rangeStart!==null?`ساعت ${toFa(rangeStart)}:۰۰ شروع شد — حالا ساعت پایان را انتخاب کنید`:'روی ساعت شروع کلیک کنید، سپس ساعت پایان را انتخاب کنید'}
              </div>

              {rangeError&&(
                <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 13px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',marginBottom:'12px',fontSize: '13px',color:'#fca5a5',animation:'fadeUp 0.3s ease both'}}>
                  <AlertCircle size={13} style={{color:'#ef4444',flexShrink:0}}/> {rangeError}
                </div>
              )}

              {slotsLoad?(
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',padding:'36px',color:'rgba(0,0,0,0.35)',fontSize: '14px'}}>
                  <div style={{width:'18px',height:'18px',border:'2px solid rgba(199,166,106,0.15)',borderTop:'2px solid #C7A66A',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
                  در حال دریافت ساعات...
                </div>
              ):(
                <div className="slot-grid" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px'}}>
                  {slots.map(slot=>{
                    const isSel   = selectedSlots.includes(slot.hour);
                    const isStart = rangeStart===slot.hour;
                    const cls     = slot.isBooked?'slot-btn slot-busy':isStart?'slot-btn slot-start':isSel?'slot-btn slot-range':'slot-btn slot-free';
                    /* #22: morning discount on slot */
                    const disc    = selectedTable.morningDiscount??0;
                    const isMorn  = slot.hour<12&&disc>0;
                    const sPrice  = slotPrice(slot.hour,selectedTable);
                    return (
                      <button key={slot.hour} className={cls} disabled={slot.isBooked}
                        onClick={()=>handleSlotClick(slot.hour,slot.isBooked)}
                        style={{
                          borderColor:slot.isBooked?'rgba(239,68,68,0.14)':isStart?`rgba(${SEL_RGB},0.60)`:isSel?`rgba(${SEL_RGB},0.45)`:'rgba(0,0,0,0.07)',
                          background:slot.isBooked?'rgba(239,68,68,0.04)':isStart?`rgba(${SEL_RGB},0.18)`:isSel?`rgba(${SEL_RGB},0.12)`:isMorn?`rgba(${SEL_RGB},0.04)`:'rgba(0,0,0,0.03)',
                          color:slot.isBooked?'rgba(239,68,68,0.3)':(isStart||isSel)?SEL_COLOR:'rgba(0,0,0,0.48)',
                          boxShadow:isStart?`0 0 16px rgba(${SEL_RGB},0.35)`:isSel?`0 0 10px rgba(${SEL_RGB},0.18)`:'none',
                        }}>
                        <span style={{fontSize: '14px'}}>{toFa(slot.hour)}:۰۰</span>
                        {/* #22: discount or busy label */}
                        {slot.isBooked&&<span style={{fontSize: '9px',opacity:0.6}}>مشغول</span>}
                        {!slot.isBooked&&isMorn&&<span style={{fontSize: '9px',color:SEL_COLOR,opacity:0.9}}>−{disc}٪</span>}
                        {!slot.isBooked&&!isMorn&&isStart&&<span style={{fontSize: '9px',opacity:0.8}}>شروع</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSlots.length>0&&startHour!==undefined&&endHour!==undefined&&(
                <div style={{marginTop:'14px',padding:'13px 16px',background:`rgba(${SEL_RGB},0.08)`,border:`1px solid rgba(${SEL_RGB},0.25)`,borderRadius:'13px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px',animation:'fadeUp 0.3s ease both'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',color:SEL_COLOR,fontSize: '15px',fontWeight:700}}>
                    <Clock size={14}/> {toFa(startHour)}:۰۰ — {toFa(endHour)}:۰۰
                  </div>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <span style={{fontSize: '13px',color:'rgba(0,0,0,0.45)',background:'rgba(0,0,0,0.05)',padding:'4px 12px',borderRadius:'20px',fontWeight:600}}>{toFa(totalHours)} ساعت</span>
                    {playerCount>1&&<span style={{fontSize: '13px',color:'#f59e0b',background:'rgba(245,158,11,0.08)',padding:'4px 12px',borderRadius:'20px',fontWeight:700}}>{toFa(playerCount)} نفر +{toFa((playerCount-1)*15)}٪</span>}
                    <span style={{fontSize: '13px',color:SEL_COLOR,fontWeight:800,background:`rgba(${SEL_RGB},0.10)`,padding:'4px 12px',borderRadius:'20px'}}>{toFa(totalPrice.toLocaleString())} تومان</span>
                  </div>
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
                  <div style={{fontSize: '12px',color:'rgba(0,0,0,0.42)'}}>{club?.name} · {TYPE_LABEL[selectedTable?.type??'']??''}</div>
                </div>
              </div>
              <div style={{padding:'18px 22px'}}>
                {[
                  {l:'تاریخ',          v:dateLabel},
                  {l:'شروع',           v:startHour!==undefined?`${toFa(startHour)}:۰۰`:''},
                  {l:'پایان',          v:endHour!==undefined?`${toFa(endHour)}:۰۰`:''},
                  {l:'مدت',            v:`${toFa(totalHours)} ساعت`},
                  {l:'تعداد بازیکنان', v:`${toFa(playerCount)} نفر${playerCount>1?' (+'+((playerCount-1)*15)+'٪)':''}`},
                  {l:'نرخ ساعتی',      v:`${toFa((selectedTable?.pricePerHour??0).toLocaleString())} تومان`},
                ].map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(0,0,0,0.04)'}}>
                    <span style={{fontSize: '14px',color:'rgba(0,0,0,0.42)'}}>{r.l}</span>
                    <span style={{fontSize: '14px',fontWeight:600,color:'#111111'}}>{r.v}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'14px 0 0'}}>
                  <span style={{fontSize: '17px',fontWeight:800,color:'#111111'}}>مبلغ کل</span>
                  <span style={{fontSize: '22px',fontWeight:900,color:accentColor,letterSpacing:'-0.025em'}}>
                    {toFa(totalPrice.toLocaleString())} <span style={{fontSize: '13px',opacity:0.7}}>تومان</span>
                  </span>
                </div>
              </div>

              {/* #14: cancellation policy */}
              <div style={{margin:'0 22px 18px',padding:'11px 14px',background:'rgba(245,158,11,0.05)',border:'1px solid rgba(245,158,11,0.13)',borderRadius:'12px',fontSize: '12px',color:'rgba(0,0,0,0.42)',lineHeight:1.7,display:'flex',alignItems:'flex-start',gap:'7px'}}>
                <Info size={13} style={{color:'#f59e0b',flexShrink:0,marginTop:1}}/>
                رزروها تنها تا ۲ ساعت پیش از زمان شروع قابل لغو هستند
              </div>

              {/* #17: LQ-styled confirm button, new text */}
              <div style={{padding:'0 22px 22px'}}>
                <button onClick={handleConfirm} disabled={booking} style={{
                  width:'100%',padding:'15px',borderRadius:'20px',
                  border:booking?'1px solid rgba(199,166,106,0.15)':'1px solid rgba(199,166,106,0.42)',
                  background:booking?'rgba(199,166,106,0.06)':'rgba(199,166,106,0.12)',
                  color:booking?'rgba(199,166,106,0.40)':'#C7A66A',
                  fontSize: '17px',fontWeight:800,
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
