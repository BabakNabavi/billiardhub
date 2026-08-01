'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import AuthGuard from '../../../components/AuthGuard';
import CancellationPolicy from '../../../components/booking/CancellationPolicy';
import { surchargeOf, extraPlayers, playerMultiplier } from '../../../lib/finance/pricing';
import { sortTables, tableTypeRank } from '../../../lib/tables/order';
import { closureState, isDateClosed, closedHours, closureLabel, type ClosureState } from '../../../lib/booking/closure';
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
interface Club {
  id: string; name: string; city?: string; managerName?: string; phone?: string;
  bankCard?: string; bankCardOwner?: string; bankName?: string;
  /* تنظیم هزینه‌ی بازیکن اضافه — از پنل باشگاه‌دار */
  playerSurchargeEnabled?: boolean; playerSurchargePercent?: number; playerSurchargeFrom?: number;
}

const TYPE_LABEL: Record<string, string> = {
  snooker: 'اسنوکر', pocket: 'پاکت بیلیارد',
  highball: 'هی‌بال', vip_snooker: 'VIP اسنوکر', vip_pocket: 'VIP پاکت',
};
const TYPE_COLOR: Record<string, string> = {
  snooker: '#C7A66A', pocket: '#06b6d4',
  highball: '#a78bfa', vip_snooker: '#f59e0b', vip_pocket: '#f59e0b',
};

function applyPastHours(slots: Slot[], isoDate: string): Slot[] {
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  if (isoDate !== todayISO) return slots;
  const ch = now.getHours();
  return slots.map(s => ({ ...s, isBooked: s.isBooked || s.hour <= ch }));
}
/* ساعت‌های کاری پیش‌فرض وقتی سرور فهرست را برنگرداند — همه آزاد فرض
   نمی‌شوند تا هیچ ساعتی الکی «رزروشده» یا «آزاد» نمایش داده نشود. */
function openSlots(isoDate: string): Slot[] {
  return applyPastHours(Array.from({length:16},(_,i)=>({hour:i+8,isBooked:false})), isoDate);
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
function JalaliCalendar({ jYear, jMonth, selectedDay, todayJY, todayJM, todayJD, maxJY, maxJM, maxJD, onSelect, onPrev, onNext, isClosedDay }: {
  jYear:number; jMonth:number; selectedDay:number|null;
  todayJY:number; todayJM:number; todayJD:number;
  maxJY:number; maxJM:number; maxJD:number;
  onSelect:(d:number)=>void; onPrev:()=>void; onNext:()=>void;
  /** روزهایی که باشگاه رزروشان را بسته — غیرقابل انتخاب، با رنگِ خودشان */
  isClosedDay?:(d:number)=>boolean;
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
          /* روزِ بسته هم غیرقابل انتخاب است، ولی رنگش با «گذشته» فرق
             می‌کند تا کاربر بفهمد بسته است نه تمام‌شده. */
          const isClosed = !isPast && !isFutureLocked && !!isClosedDay?.(day);
          const isDisabled = isPast||isFutureLocked||isClosed;
          const isSel   = day===selectedDay;
          const isToday = day===todayJD&&jMonth===todayJM&&jYear===todayJY;
          return (
            <button key={i} disabled={isDisabled} onClick={()=>!isDisabled&&onSelect(day)}
              title={isClosed?'باشگاه رزرو این روز را بسته است':undefined} style={{
              height:'38px',borderRadius:'9px',border:'none',fontSize: '15px',
              fontWeight:isToday?800:500, cursor:isDisabled?'not-allowed':'pointer',
              background:isSel?'linear-gradient(135deg,#C7A66A,#A07840)':isClosed?'rgba(239,68,68,0.07)':isToday?'rgba(199,166,106,0.1)':isFutureLocked?'rgba(0,0,0,0.02)':'transparent',
              color:isSel?'#fff':isClosed?'rgba(220,38,38,0.55)':isDisabled?'rgba(0,0,0,0.12)':isToday?'#C7A66A':'rgba(0,0,0,0.55)',
              boxShadow:isSel?'0 4px 12px rgba(199,166,106,0.35)':'none',
              outline:isClosed?'1px solid rgba(239,68,68,0.20)':isToday&&!isSel?'1px solid rgba(199,166,106,0.3)':'none',
              opacity:isDisabled?(isClosed?0.85:isFutureLocked?0.22:0.4):1,
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
  /* وضعیتِ بستنِ رزرو — از سرور، نه از localStorage.
     پیش‌تر کلیدِ مرورگر خوانده می‌شد؛ آن کلید فقط در مرورگرِ خودِ
     باشگاه‌دار وجود داشت، پس بازدیدکننده قفل را نمی‌دید و باشگاه‌دار
     کلِ صفحه را بسته می‌دید — حتی برای روزهایی که باز بودند. */
  const [closure, setClosure] = useState<ClosureState>({ always: false, untilMs: null, closeToday: false });
  const [slotsLoad, setSlotsLoad]   = useState(false);
  const [booking, setBooking]       = useState(false);
  const [error, setError]           = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);   /* پذیرش قوانین رزرو */
  /* انتقال به درگاه — تنها حالت میانی؛ رسید نهایی را /booking/result
     پس از تأیید سروری پرداخت نشان می‌دهد. */
  const [redirecting, setRedirecting] = useState(false);

  const slotsRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    /* وضعیت بستن رزرو از سرور. شکستش صفحه را نمی‌بندد — بدترین حالت
       این است که قفل در UI دیده نشود، و سرورِ ثبتِ رزرو همچنان جلوی
       رزروِ نادرست را می‌گیرد. */
    fetch(`/api/clubs/${clubId}/booking-status`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j) setClosure(closureState({ closeToday: j.closeToday, closedUntil: j.always ? 'always' : j.closedUntil })); })
      .catch(() => { /* بی‌صدا */ });

    api.get(`/clubs/${clubId}`).catch(()=>({data:{id:clubId,name:'باشگاه',managerName:''}}))
      .then(c=>{ setClub(c.data); });

    /* فقط میزهایی که باشگاه در سیستم ثبت کرده — هیچ میز ساختگی‌ای ساخته نمی‌شود */
    api.get(`/clubs/${clubId}/tables`).catch(()=>({data:[]}))
      .then(t=>{ setTables(Array.isArray(t.data)?t.data:[]); setLoading(false); });
  },[clubId]);

  useEffect(()=>{
    if(!selectedTable||!isoDate) return;
    setSlotsLoad(true); setSlots([]); setSelectedSlots([]); setRangeStart(null); setRangeError('');
    api.get(`/bookings/slots?clubId=${clubId}&tableId=${selectedTable.id}&date=${isoDate}`)
      .then(r=>{
        const raw:Slot[] = Array.isArray(r.data)&&r.data.length>0?r.data:openSlots(isoDate);
        setSlots(applyPastHours(raw,isoDate)); setSlotsLoad(false);
        setTimeout(()=>slotsRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'}),100);
      })
      .catch(()=>{ setSlots(openSlots(isoDate)); setSlotsLoad(false); });
  },[selectedTable,isoDate,clubId]);

  const handleSlotClick = useCallback((hour:number, isBooked:boolean)=>{
    if(isBooked) return;
    setRangeError('');
    /* کلیک سوم روی همان ساعت نهایی‌شده ⇒ لغو انتخاب */
    if(rangeStart===null && selectedSlots.length===1 && selectedSlots[0]===hour){ setSelectedSlots([]); return; }
    if(rangeStart===null){ setRangeStart(hour); setSelectedSlots([hour]); return; }
    /* کلیک دوم روی همان ساعت ⇒ یعنی فقط همین یک ساعت رزرو شود */
    if(hour===rangeStart){ setRangeStart(null); setSelectedSlots([hour]); return; }
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
    if(!acceptTerms){ setError('برای ادامه، قوانین رزرو و شرایط لغو را بپذیرید.'); return; }
    const sorted    = [...selectedSlots].sort((a,b)=>a-b);
    const startH    = sorted[0]!;
    const endH      = sorted[sorted.length-1]!+1;
    const startTime = new Date(`${isoDate}T${String(startH).padStart(2,'0')}:00:00Z`);
    const endTime   = new Date(`${isoDate}T${String(endH).padStart(2,'0')}:00:00Z`);
    setBooking(true); setError('');
    try {
      /* مبلغ روی سرور بازمحاسبه می‌شود؛ pricePerHour فقط پشتیبان میزهای محلی است */
      const res = await api.post('/bookings',{
        clubId, tableType:selectedTable.type, tableId:selectedTable.id,
        startTime:startTime.toISOString(), endTime:endTime.toISOString(),
        pricePerHour:selectedTable.pricePerHour, playerCount, currency:'IRT',
      });
      const bookingId = res.data?.id ?? '';
      /* ایجاد پرداخت و هدایت مستقیم به درگاه — هیچ صفحه‌ی میانی دیگری نیست */
      let paymentUrl: string | null = null;
      try {
        const pay = await api.post('/payments/create', { bookingId });
        paymentUrl = pay.data?.redirectUrl ?? null;
      } catch (pe: any) {
        setError(pe?.response?.data?.message || 'اتصال به درگاه پرداخت ممکن نشد');
      }
      if(!paymentUrl){
        setError(prev=>prev||'اتصال به درگاه پرداخت ممکن نشد؛ رزرو شما تا ۱۰ دقیقه نگه داشته می‌شود.');
        return;
      }
      /* #16: immediately mark booked slots as reserved in local state */
      setSlots(prev=>prev.map(s=>({...s,isBooked:s.isBooked||selectedSlots.includes(s.hour)})));
      setRedirecting(true);
      window.location.href = paymentUrl;
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
  /* هزینه‌ی بازیکن اضافه — تنظیم خود میز، و اگر نداشت از باشگاه.
     همان فرمول سمت سرور، تا عدد روی صفحه با مبلغ پرداختی یکی باشد. */
  const surcharge    = surchargeOf(selectedTable as unknown as Record<string,unknown>, club as unknown as Record<string,unknown>);
  const extraPlayerN = extraPlayers(playerCount, surcharge);

  /* میزها بر اساس نوع — ترتیب از lib/tables/order می‌آید تا داشبورد و
     این صفحه یک چیدمان داشته باشند. درونِ هر گروه هم به ترتیبِ شماره. */
  const groupedTables = (() => {
    const by = new Map<string, typeof tables>();
    for (const t of sortTables(tables)) {
      const k = t.type ?? 'other';
      if (!by.has(k)) by.set(k, [] as unknown as typeof tables);
      (by.get(k) as unknown as typeof tables[number][]).push(t);
    }
    return [...by.entries()].sort((a, b) => tableTypeRank(a[0]) - tableTypeRank(b[0]));
  })();
  /* ساعت‌های بسته‌ی همین تاریخ — هم برای رنگِ قرمزِ شبکه، هم برای
     نگذاشتنِ کاربر در دامِ انتخابی که سرور بعداً رد می‌کند. */
  const blockedHours = isoDate ? closedHours(isoDate, closure) : [];

  const totalPrice   = Math.round(baseTotal*playerMultiplier(playerCount,surcharge));
  const accentColor  = selectedTable?(TYPE_COLOR[selectedTable.type]??'#C7A66A'):'#C7A66A';
  const dateLabel    = jDay?`${toFa(jDay)} ${jMonths[jMonth-1]} ${toFa(jYear)}`:'';
  const canConfirm   = !!selectedTable&&!!jDay&&selectedSlots.length>0;

  /* ── Loading ── */
  if(loading) return (
    <div style={{minHeight:'80vh',background:'#F7F7F5',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px'}}>
      <div style={{width:'40px',height:'40px',border:'2px solid rgba(199,166,106,0.1)',borderTop:'2px solid #C7A66A',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  /* ── انتقال به درگاه پرداخت ── */
  if(redirecting) return (
    <div style={{minHeight:'100vh',background:'#F7F7F5',direction:'rtl',fontFamily:'var(--font-base)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:52,height:52,border:'2px solid rgba(199,166,106,0.16)',borderTop:'2px solid #C7A66A',borderRadius:'50%',margin:'0 auto 18px',animation:'spin 0.85s linear infinite'}}/>
        <div style={{fontSize:16,fontWeight:800,color:'#111111',marginBottom:6}}>در حال انتقال به درگاه پرداخت…</div>
        <div style={{fontSize:13,color:'rgba(0,0,0,0.42)'}}>لطفاً صفحه را نبندید</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );


  /* ── رزرو آنلاین *همیشه* بسته است ──
     تنها حالتی که کلِ صفحه معنا ندارد. بستنِ امروز یا بستنِ چند ساعت
     این‌جا نمی‌آید: آن‌ها فقط همان روز یا همان ساعت‌ها را می‌بندند و
     کاربر باید بتواند تاریخِ دیگری انتخاب کند. تا امروز هر سه حالت
     به همین صفحه می‌رسیدند و کاربر اصلاً نمی‌توانست رزرو کند. */
  if (closure.always) return (
    <div style={{minHeight:'100vh',background:'#F7F7F5',direction:'rtl',fontFamily:'Vazirmatn,Tahoma,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{maxWidth:420,textAlign:'center',background:'#fff',borderRadius:22,border:'1px solid rgba(0,0,0,0.07)',boxShadow:'0 12px 40px rgba(0,0,0,0.06)',padding:'36px 28px'}}>
        <div style={{width:66,height:66,borderRadius:'50%',background:'rgba(220,38,38,0.10)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h1 style={{fontSize:19,fontWeight:900,color:'#111',margin:'0 0 10px'}}>رزرو آنلاین موقتاً بسته است</h1>
        <p style={{fontSize:14,color:'rgba(0,0,0,0.55)',lineHeight:1.8,margin:'0 0 22px'}}>
          {club?.name ?? 'این باشگاه'} فعلاً رزرو اینترنتی را غیرفعال کرده است. لطفاً بعداً دوباره تلاش کنید یا مستقیم با باشگاه تماس بگیرید.
        </p>
        <Link href={`/clubs/${clubId}`} style={{display:'inline-flex',alignItems:'center',gap:6,color:'#9A6E38',fontSize:14,fontWeight:800,textDecoration:'none',background:'rgba(199,166,106,0.12)',border:'1px solid rgba(199,166,106,0.34)',borderRadius:12,padding:'11px 20px'}}>
          بازگشت به صفحه‌ی باشگاه
        </Link>
      </div>
    </div>
  );

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

          {/* ── قفلِ جزئی ──
              رزرو باز است ولی بعضی روزها یا ساعت‌ها بسته‌اند. بدونِ این
              نوار، کاربر فقط خانه‌های قرمز را می‌دید و علتش را نمی‌فهمید. */}
          {(closure.closeToday || closure.untilMs !== null) && (
            <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 15px',marginBottom:'14px',
              background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.28)',borderRadius:14}}>
              <AlertCircle size={15} style={{color:'#B45309',flexShrink:0,marginTop:2}}/>
              <span style={{fontSize:13.5,color:'#92600A',lineHeight:1.9}}>
                {closureLabel(closure)} — روزها و ساعت‌های قرمز قابل انتخاب نیستند؛ بقیه باز است.
              </span>
            </div>
          )}

          {/* TABLE SELECTION */}
          <div style={{background:'#FFFFFF',border:'1px solid rgba(0,0,0,0.07)',borderRadius:'20px',padding:'clamp(18px,3vw,26px)',marginBottom:'14px'}}>
            <div style={{fontSize: '14px',fontWeight:700,color:'rgba(0,0,0,0.45)',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{width:'3px',height:'13px',background:'linear-gradient(135deg,#C7A66A,#A07840)',borderRadius:'2px',display:'inline-block',flexShrink:0}}/>
              انتخاب میز
            </div>
            {tables.length===0 && (
              <div style={{textAlign:'center',padding:'34px 18px',background:'rgba(0,0,0,0.02)',border:'1px dashed rgba(0,0,0,0.10)',borderRadius:16}}>
                <div style={{fontSize:30,marginBottom:10,opacity:0.35}}>🎱</div>
                <div style={{fontSize:15,fontWeight:800,color:'#111',marginBottom:6}}>هنوز میزی برای رزرو ثبت نشده است</div>
                <div style={{fontSize:13,color:'rgba(0,0,0,0.42)',lineHeight:2}}>
                  این باشگاه میزهایش را در سیستم ثبت نکرده است. برای هماهنگی، مستقیم با باشگاه تماس بگیرید.
                </div>
                {club?.phone && (
                  <a href={`tel:${club.phone}`} style={{display:'inline-flex',marginTop:14,padding:'10px 22px',borderRadius:12,textDecoration:'none',fontSize:13.5,fontWeight:800,background:'rgba(199,166,106,0.14)',border:'1px solid rgba(199,166,106,0.4)',color:'#9A6E38'}}>
                    تماس با باشگاه
                  </a>
                )}
              </div>
            )}
            {/* میزها بر اساس نوع دسته می‌شوند — اسنوکرها زیر هم، پاکت‌ها
                زیر هم و… . قبلاً به همان ترتیبی که از دیتابیس می‌آمدند
                پشت سر هم می‌نشستند و انتخابشان گیج‌کننده بود. */}
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {groupedTables.map(([type, group])=>(
                <div key={type} style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  <div style={{
                    display:'flex',alignItems:'center',gap:8,margin:'6px 2px 0',
                    fontSize:12.5,fontWeight:800,color:TYPE_COLOR[type]??'#9A6E38',
                  }}>
                    <span style={{width:6,height:6,borderRadius:3,background:TYPE_COLOR[type]??'#C7A66A',flexShrink:0}}/>
                    {TYPE_LABEL[type]??type}
                    <span style={{fontSize:11,fontWeight:700,color:'rgba(0,0,0,0.35)'}}>
                      ({toFa(group.length)} میز)
                    </span>
                  </div>
                  {group.map(table=>{
                const color = TYPE_COLOR[table.type]??'#C7A66A';
                const isSel = selectedTable?.id===table.id;
                const disc  = table.morningDiscount??0;
                return (
                  <div key={table.id} className="tbl-card" onClick={()=>handleTableSelect(table)}
                    style={{borderColor:isSel?`${color}45`:'rgba(0,0,0,0.06)',background:isSel?`${color}0d`:'rgba(0,0,0,0.03)',boxShadow:isSel?`0 0 0 1px ${color}20,0 8px 24px rgba(0,0,0,0.06)`:'none',transform:isSel?'translateY(-1px)':'none'}}>
                    {table.photoDataUrl
                      ? <img loading="lazy" decoding="async" src={table.photoDataUrl} alt="" style={{width:52,height:42,objectFit:'cover',borderRadius:10,flexShrink:0,border:`1.5px solid ${color}33`}}/>
                      : <div style={{width:'42px',height:'42px',borderRadius:'12px',background:`${color}12`,border:`1px solid ${color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>🎱</div>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px',flexWrap:'wrap'}}>
                        {/* «میز ۱ | اسنوکر» — رشته داخلِ خودِ عنوان است، پس
                            نشانِ دکمه‌مانندِ کنارش حذف شد: دو بار یک چیز را
                            می‌گفتند و کارت را شلوغ می‌کرد. */}
                        <span style={{fontSize: '16px',fontWeight:800,color:isSel?color:'#111'}}>
                          {table.number ? `میز ${toFa(table.number)} ` : ''}
                          <span style={{color:'rgba(0,0,0,0.25)',fontWeight:600,padding:'0 2px'}}>|</span>
                          {` ${TYPE_LABEL[table.type]??table.type}`}
                        </span>
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
              ))}
            </div>
          </div>

          {/* #21: PLAYER COUNT */}
          <div style={{background:'#FFFFFF',border:'1px solid rgba(0,0,0,0.07)',borderRadius:'20px',padding:'clamp(16px,3vw,22px)',marginBottom:'14px'}}>
            <div style={{fontSize: '14px',fontWeight:700,color:'rgba(0,0,0,0.45)',marginBottom:'14px',display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{width:'3px',height:'13px',background:'linear-gradient(135deg,#06b6d4,#a78bfa)',borderRadius:'2px',display:'inline-block',flexShrink:0}}/>
              تعداد بازیکنان
            </div>
            {/* شمارنده وسطِ باکس، و هر توضیح یا محاسبه‌ای زیرِ آن.
                پیش‌تر شمارنده چپ‌چین بود و توضیح کنارش می‌نشست؛ در عرضِ
                کم، آن دو از هم دور می‌افتادند و ربطشان گم می‌شد. */}
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
              <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                <button className="player-btn" disabled={playerCount<=1} onClick={()=>setPlayerCount(p=>Math.max(1,p-1))}><Minus size={14}/></button>
                <div style={{textAlign:'center',minWidth:60}}>
                  <div style={{fontSize: '31px',fontWeight:900,color:'#111',lineHeight:1}}>{toFa(playerCount)}</div>
                  <div style={{fontSize: '13px',color:'rgba(0,0,0,0.40)',marginTop:2}}>نفر</div>
                </div>
                <button className="player-btn" disabled={playerCount>=8} onClick={()=>setPlayerCount(p=>Math.min(8,p+1))}><Plus size={14}/></button>
              </div>
              {extraPlayerN>0?(
                <div style={{padding:'10px 16px',background:'rgba(48,197,90,0.07)',border:'1px solid rgba(48,197,90,0.20)',borderRadius:'14px',fontSize: '14px',color:'rgba(0,0,0,0.45)',lineHeight:1.7,textAlign:'center'}}>
                  <span style={{color:SEL_COLOR,fontWeight:800}}>+{toFa(extraPlayerN*surcharge.percent)}٪</span> اضافه بابت {toFa(extraPlayerN)} نفر
                </div>
              ):surcharge.enabled&&surcharge.percent>0?(
                /* «رایگان» گمراه‌کننده بود — میز رایگان نیست، فقط افزایشی
                   ندارد. متن هم با همان چیزی که در داشبورد نوشته می‌شود
                   یکی شد. */
                <div style={{fontSize: '13.5px',color:'rgba(0,0,0,0.38)',padding:'10px 16px',background:'rgba(0,0,0,0.03)',borderRadius:'14px',textAlign:'center',lineHeight:1.9}}>
                  تا {toFa(surcharge.from)} نفر بدون افزایش، از نفر بعد، هر نفر {toFa(surcharge.percent)} درصد اضافه می‌شود
                </div>
              ):null}
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
              isClosedDay={d => isDateClosed(toISO(jYear, jMonth, d), closure)}
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
                    /* ساعتی که در بازه‌ی «بستن برای N ساعت» می‌افتد قرمز و
                       غیرفعال می‌شود — جدا از «مشغول»، چون علتش فرق دارد
                       و کاربر باید بفهمد باشگاه بسته، نه اینکه پر شده. */
                    const isShut  = blockedHours.includes(slot.hour);
                    const isSel   = selectedSlots.includes(slot.hour);
                    const isStart = rangeStart===slot.hour;
                    const off     = slot.isBooked || isShut;
                    const cls     = off?'slot-btn slot-busy':isStart?'slot-btn slot-start':isSel?'slot-btn slot-range':'slot-btn slot-free';
                    const discPct = getSlotDiscountPct(slot.hour, selectedTable);
                    const hasDisc = discPct > 0 && !off;
                    return (
                      <button key={slot.hour} className={cls} disabled={off}
                        title={isShut?'باشگاه رزرو این ساعت را بسته است':undefined}
                        onClick={()=>{ if(!isShut) handleSlotClick(slot.hour,slot.isBooked); }}
                        style={{
                          borderColor:isShut?'rgba(220,38,38,0.30)':slot.isBooked?'rgba(239,68,68,0.14)':isStart?`rgba(${SEL_RGB},0.60)`:isSel?`rgba(${SEL_RGB},0.45)`:'rgba(0,0,0,0.07)',
                          background:isShut?'rgba(220,38,38,0.09)':slot.isBooked?'rgba(239,68,68,0.04)':isStart?`rgba(${SEL_RGB},0.18)`:isSel?`rgba(${SEL_RGB},0.12)`:hasDisc?`rgba(${SEL_RGB},0.04)`:'rgba(0,0,0,0.03)',
                          color:isShut?'rgba(185,28,28,0.85)':slot.isBooked?'rgba(239,68,68,0.3)':(isStart||isSel)?SEL_COLOR:'rgba(0,0,0,0.48)',
                          boxShadow:isStart?`0 0 16px rgba(${SEL_RGB},0.35)`:isSel?`0 0 10px rgba(${SEL_RGB},0.18)`:'none',
                        }}>
                        <span style={{fontSize: '15px'}}>{toFa(slot.hour)}:۰۰</span>
                        {isShut&&<span style={{fontSize: '9px',fontWeight:800,opacity:0.85}}>بسته</span>}
                        {!isShut&&slot.isBooked&&<span style={{fontSize: '9px',opacity:0.6}}>مشغول</span>}
                        {!off&&hasDisc&&<span style={{fontSize: '9px',color:SEL_COLOR,opacity:0.9}}>−{toFa(discPct)}٪</span>}
                        {!off&&!hasDisc&&isStart&&<span style={{fontSize: '9px',opacity:0.8}}>شروع</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSlots.length>0&&startHour!==undefined&&endHour!==undefined&&(
                <div style={{marginTop:'14px',padding:'13px 16px',background:`rgba(${SEL_RGB},0.08)`,border:`1px solid rgba(${SEL_RGB},0.25)`,borderRadius:'13px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px',animation:'fadeUp 0.3s ease both'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',color:SEL_COLOR,fontSize: '16px',fontWeight:700}}>
                    <Clock size={14}/> ساعت {toFa(startHour)}:۰۰ تا {toFa(endHour)}:۰۰
                  </div>
                  {(()=>{
                    const hasAnyDisc = selectedTable && selectedSlots.some(h=>getSlotDiscountPct(h,selectedTable)>0);
                    return (
                      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                        <span style={{fontSize: '14px',color:'rgba(0,0,0,0.45)',background:'rgba(0,0,0,0.05)',padding:'4px 12px',borderRadius:'20px',fontWeight:600}}>{toFa(totalHours)} ساعت</span>
                        {/* درصد از همان محاسبه‌ای می‌آید که مبلغ را می‌سازد.
                            قبلاً این‌جا «>۲» و «۱۵٪» هاردکد بود و با نرخ
                            واقعی باشگاه نمی‌خواند: کاربر نفر دوم را اضافه
                            می‌کرد، برچسبی نمی‌دید ولی مبلغ بالا می‌رفت. */}
                        {extraPlayerN>0&&<span style={{fontSize: '14px',color:'#f59e0b',background:'rgba(245,158,11,0.08)',padding:'4px 12px',borderRadius:'20px',fontWeight:700}}>{toFa(playerCount)} نفر +{toFa(extraPlayerN*surcharge.percent)}٪</span>}
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
                  {l:'تعداد بازیکنان', v:`${toFa(playerCount)} نفر${extraPlayerN>0?' (+'+toFa(extraPlayerN*surcharge.percent)+'٪)':''}`},
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

              {/* #14: قوانین کامل لغو — پیش از پرداخت، نه بعد از آن */}
              <div style={{margin:'0 22px 18px'}}>
                <CancellationPolicy />
              </div>

              {/* پذیرش قوانین — پیش‌شرط ثبت رزرو */}
              <div style={{padding:'0 22px 12px'}}>
                <label style={{display:'flex',alignItems:'flex-start',gap:9,cursor:'pointer'}}>
                  <input type="checkbox" checked={acceptTerms} onChange={e=>{setAcceptTerms(e.target.checked); setError('');}}
                    style={{width:17,height:17,marginTop:2,accentColor:'#C7A66A',cursor:'pointer',flexShrink:0}}/>
                  <span style={{fontSize:12.5,lineHeight:2,color:'rgba(0,0,0,0.62)'}}>
                    با ثبت رزرو،{' '}
                    <Link href="/terms#cancellation" target="_blank" style={{color:'#9A6E38',fontWeight:800,textDecoration:'none'}}>
                      قوانین رزرو و شرایط لغو و بازگشت وجه
                    </Link>
                    {' '}را مطالعه و می‌پذیرم.
                  </span>
                </label>
                {/* لینک دوم «مشاهده قوانین رزرو و لغو رزرو» حذف شد —
                    درست بالایش خود قوانین کامل نوشته شده و متن چک‌باکس
                    هم لینک همان صفحه را دارد. */}
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
