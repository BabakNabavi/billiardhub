'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import {
  MapPin, Phone, Globe, Clock, Star, Navigation,
  ChevronLeft, ChevronRight, Calendar, Wifi, Car,
  Coffee, Trophy, X, Check, Play, Pause, Volume2, VolumeX
} from 'lucide-react';

interface Club {
  id: string; name: string; managerName: string; description: string;
  address: string; city: string; country: string;
  latitude: number; longitude: number; phone: string; website: string;
  snookerTables: number; pocketTables: number; highballTables: number;
  vipSnookerTables: number; vipPocketTables: number; airHockeyTables: number;
  dartBoards: number; playstations: number;
  hasCafe: boolean; hasParking: boolean; hasWifi: boolean; hasProfessionalCoach: boolean;
  specialFeatures: string; workingHours: any; images: string[]; videos: string[];
  hasStory?: boolean;
}

// تبدیل میلادی به شمسی
function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_no = [31, 28 + (gy % 4 == 0 && gy % 100 != 0 || gy % 400 == 0 ? 1 : 0), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_d_no = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
  for (let i = 0; i < gm - 1; i++) days += g_d_no[i];
  days += gd - 1 - 79;
  const j_np = Math.floor(days / 12053);
  days %= 12053;
  jy += 33 * j_np + 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let jm = 0;
  for (let i = 0; i < 11 && days >= j_d_no[i]; i++) { days -= j_d_no[i]; jm++; }
  return [jy, jm + 1, days + 1];
}

function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const leapYears = [1, 5, 9, 13, 17, 22, 26, 30];
  return leapYears.includes(jy % 33) ? 30 : 29;
}

const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const persianDayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function toFa(n: number | string): string {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)} متر` : `${d.toFixed(1)} کیلومتر`;
}

const sampleClub: Club = {
  id: '1', name: 'باشگاه ستاره تهران', managerName: 'محمد احمدی',
  description: 'یکی از مجهزترین باشگاه‌های بیلیارد تهران با بیش از ۱۵ سال سابقه. دارای میزهای حرفه‌ای اسنوکر و پاکت بیلیارد با استانداردهای بین‌المللی.',
  address: 'خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۰', city: 'تهران', country: 'ایران',
  latitude: 35.7219, longitude: 51.3347, phone: '021-88001234', website: 'https://stareclub.ir',
  snookerTables: 4, pocketTables: 3, highballTables: 2, vipSnookerTables: 2,
  vipPocketTables: 1, airHockeyTables: 1, dartBoards: 3, playstations: 4,
  hasCafe: true, hasParking: true, hasWifi: true, hasProfessionalCoach: true,
  specialFeatures: 'سالن VIP اختصاصی، امکان برگزاری مسابقات خصوصی، آموزش توسط مربیان فدراسیون',
  workingHours: {
    saturday: { isOpen: true, open: '10:00', close: '24:00' },
    sunday: { isOpen: true, open: '10:00', close: '24:00' },
    monday: { isOpen: true, open: '10:00', close: '24:00' },
    tuesday: { isOpen: true, open: '10:00', close: '24:00' },
    wednesday: { isOpen: true, open: '10:00', close: '24:00' },
    thursday: { isOpen: true, open: '10:00', close: '24:00' },
    friday: { isOpen: true, open: '14:00', close: '24:00' },
  },
  images: ['/images/billiadr-club-1.jpg', '/images/billiadr-club-2.jpg', '/images/billiadr-club-3.jpg'],
  videos: [],
  hasStory: true,
};

const clubTables = [
  { id: 'sn-1', name: 'میز ۱', brand: 'Viraka M1 Gold', type: 'اسنوکر', color: '#10b981', busy: false, bookedSlots: ['11:00', '14:00'] },
  { id: 'sn-2', name: 'میز ۲', brand: 'Star 110 Professional', type: 'اسنوکر', color: '#10b981', busy: true, bookedSlots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'] },
  { id: 'sn-3', name: 'میز ۳', brand: 'BCE Heritage 9ft', type: 'اسنوکر', color: '#10b981', busy: false, bookedSlots: ['16:00', '17:00'] },
  { id: 'sn-4', name: 'میز ۴', brand: 'Viraka M2 Pro', type: 'اسنوکر', color: '#10b981', busy: false, bookedSlots: [] },
  { id: 'pk-1', name: 'میز ۱', brand: 'Brunswick Gold Crown VI', type: 'پاکت', color: '#06b6d4', busy: true, bookedSlots: ['10:00', '11:00', '12:00', '13:00'] },
  { id: 'pk-2', name: 'میز ۲', brand: 'Diamond Pro Am 9ft', type: 'پاکت', color: '#06b6d4', busy: false, bookedSlots: ['15:00'] },
  { id: 'pk-3', name: 'میز ۳', brand: 'Olhausen Americana', type: 'پاکت', color: '#06b6d4', busy: false, bookedSlots: [] },
  { id: 'hb-1', name: 'میز ۱', brand: 'Artis Vienna', type: 'هی‌بال', color: '#a78bfa', busy: false, bookedSlots: [] },
  { id: 'hb-2', name: 'میز ۲', brand: 'Artis Vienna Pro', type: 'هی‌بال', color: '#a78bfa', busy: false, bookedSlots: ['20:00', '21:00'] },
  { id: 'vip-1', name: 'VIP ۱', brand: 'Viraka M1 Gold VIP', type: 'VIP اسنوکر', color: '#f59e0b', busy: false, bookedSlots: ['20:00'] },
  { id: 'vip-2', name: 'VIP ۲', brand: 'Riley Renaissance', type: 'VIP اسنوکر', color: '#f59e0b', busy: false, bookedSlots: [] },
];

function generateTimeSlots(open: string = '10:00', close: string = '24:00'): string[] {
  const slots: string[] = [];
  const startH = parseInt(open.split(':')[0]);
  const endH = close === '24:00' ? 24 : parseInt(close.split(':')[0]);
  for (let h = startH; h < endH; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
  }
  return slots;
}

const tableTypesList = [
  { key: 'snookerTables', label: 'اسنوکر', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
  { key: 'pocketTables', label: 'پاکت', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.15)' },
  { key: 'highballTables', label: 'هی‌بال', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
  { key: 'vipSnookerTables', label: 'VIP اسنوکر', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
  { key: 'vipPocketTables', label: 'VIP پاکت', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
  { key: 'airHockeyTables', label: 'ایرهاکی', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' },
  { key: 'dartBoards', label: 'دارت', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)' },
  { key: 'playstations', label: 'پلی‌استیشن', color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.15)' },
];

const dayNames: Record<string, string> = {
  saturday: 'شنبه', sunday: 'یکشنبه', monday: 'دوشنبه',
  tuesday: 'سه‌شنبه', wednesday: 'چهارشنبه', thursday: 'پنجشنبه', friday: 'جمعه',
};

// ===== RESERVATION MODAL =====
function ReservationModal({ club, onClose }: { club: Club; onClose: () => void }) {
  const today = new Date();
  const [jTodayY, jTodayM, jTodayD] = toJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [jYear, setJYear] = useState(jTodayY);
  const [jMonth, setJMonth] = useState(jTodayM); // 1-based
  const [selectedJDay, setSelectedJDay] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<typeof clubTables[0] | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [confirmed, setConfirmed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [filterType, setFilterType] = useState('همه');
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);

  const todayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
  const openTime = club.workingHours?.[todayKey]?.open || '10:00';
  const closeTime = club.workingHours?.[todayKey]?.close || '24:00';
  const timeSlots = generateTimeSlots(openTime, closeTime);

  const daysInMonth = getJalaliMonthDays(jYear, jMonth);

  // محاسبه روز اول ماه شمسی
  const getFirstDayOfJalaliMonth = (jy: number, jm: number): number => {
    const [gy, gm, gd] = jalaliToGregorian(jy, jm, 1);
    const [startSlot, setStartSlot] = useState<string | null>(null);
    return new Date(gy, gm - 1, gd).getDay();
  };

  const firstDay = getFirstDayOfJalaliMonth(jYear, jMonth);
  const offset = (firstDay + 1) % 7;
  const calDays: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const prevMonth = () => {
    if (jMonth === 1) { setJMonth(12); setJYear(y => y - 1); }
    else setJMonth(m => m - 1);
    setSelectedJDay(null);
  };

  const nextMonth = () => {
    if (jMonth === 12) { setJMonth(1); setJYear(y => y + 1); }
    else setJMonth(m => m + 1);
    setSelectedJDay(null);
  };

  const types = ['همه', 'اسنوکر', 'پاکت', 'هی‌بال', 'VIP اسنوکر'];
  const filtered = filterType === 'همه' ? clubTables : clubTables.filter(t => t.type === filterType);

  const [startSlot, setStartSlot] = useState<string | null>(null);

  const toggleSlot = (slot: string) => {
    if (!selectedTable || selectedTable.bookedSlots.includes(slot)) return;

    if (!startSlot) {
      setStartSlot(slot);
      setSelectedSlots([slot]);
      return;
    }

    if (startSlot === slot) {
      setStartSlot(null);
      setSelectedSlots([]);
      return;
    }

    const startH = parseInt(startSlot.split(':')[0]);
    const endH = parseInt(slot.split(':')[0]);
    const minH = Math.min(startH, endH);
    const maxH = Math.max(startH, endH);

    const range: string[] = [];
    for (let h = minH; h <= maxH; h++) {
      const s = `${String(h).padStart(2, '0')}:00`;
      if (selectedTable.bookedSlots.includes(s)) break;
      range.push(s);
    }
    setSelectedSlots(range);
  };


  const canNext =
    (step === 1 && selectedJDay !== null) ||
    (step === 2 && selectedTable !== null) ||
    (step === 3 && selectedSlots.length > 0) ||
    (step === 4 && selectedGateway !== null);

  const handleNext = () => {
    if (step === 1 && selectedJDay) setStep(2);
    else if (step === 2 && selectedTable) setStep(3);
    else if (step === 3 && selectedSlots.length > 0) setStep(4);
    else if (step === 4 && selectedGateway) {
      setPaying(true);
      setTimeout(() => { setPaying(false); setConfirmed(true); }, 2500);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: 'min(640px, 96vw)', maxHeight: '92vh',
        background: 'rgba(255,255,255,0.98)', borderRadius: '28px', overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* هدر */}
        <div style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '4px' }}>ONLINE RESERVATION</div>
            <h3 style={{ color: '#fff', fontWeight: 900, fontSize: '16px', margin: 0 }}>{club.name}</h3>
          </div>
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={17} />
          </button>
        </div>

        {/* steps */}
        <div style={{ display: 'flex', padding: '14px 24px 0', gap: '6px', flexShrink: 0 }}>
          {[{ n: 1, label: 'تاریخ' }, { n: 2, label: 'میز' }, { n: 3, label: 'ساعت' }, { n: 4, label: 'پرداخت' }].map(s => (
            <div key={s.n} style={{ flex: 1 }}>
              <div style={{ height: '3px', borderRadius: '2px', background: step >= s.n ? 'linear-gradient(90deg, #10b981, #06b6d4)' : 'rgba(16,185,129,0.1)', marginBottom: '6px', transition: 'all 0.4s' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: step > s.n ? '#10b981' : step === s.n ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: step >= s.n ? '#fff' : 'rgba(26,46,36,0.3)', fontWeight: 700, flexShrink: 0, transition: 'all 0.3s' }}>
                  {step > s.n ? <Check size={10} /> : toFa(s.n)}
                </div>
                <span style={{ fontSize: '11px', color: step >= s.n ? '#059669' : 'rgba(26,46,36,0.3)', fontWeight: step === s.n ? 700 : 400 }}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* محتوا */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {confirmed ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 12px 40px rgba(16,185,129,0.35)' }}>
                <Check size={36} style={{ color: '#fff' }} />
              </div>
              <h3 style={{ fontWeight: 900, color: '#0f2318', fontSize: '22px', marginBottom: '16px' }}>رزرو تأیید شد!</h3>
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '16px', padding: '20px', textAlign: 'right', marginBottom: '24px' }}>
                {[
                  { label: 'باشگاه', value: club.name },
                  { label: 'میز', value: `${selectedTable?.brand} — ${selectedTable?.type}` },
                  { label: 'تاریخ', value: `${toFa(selectedJDay || 0)} ${persianMonths[jMonth - 1]} ${toFa(jYear)}` },
                  { label: 'ساعات', value: selectedSlots.map(toFa).join(' · ') },
                  { label: 'مبلغ پرداختی', value: `${toFa(selectedSlots.length * 150000)} تومان` },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 4 ? '1px solid rgba(16,185,129,0.08)' : 'none' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(26,46,36,0.4)' }}>{r.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f2318' }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(26,46,36,0.4)', marginBottom: '20px' }}>پیامک تأیید ارسال شد. صاحب باشگاه از رزرو شما مطلع شد.</p>
              <button onClick={onClose} style={{ padding: '13px 40px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                بستن
              </button>
            </div>
          ) : (
            <>
              {/* مرحله ۱ — تاریخ شمسی */}
              {step === 1 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <button onClick={prevMonth} style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                      <ChevronRight size={16} />
                    </button>
                    <h4 style={{ fontWeight: 800, color: '#0f2318', margin: 0, fontSize: '16px' }}>
                      {persianMonths[jMonth - 1]} {toFa(jYear)}
                    </h4>
                    <button onClick={nextMonth} style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '8px' }}>
                    {persianDayNames.map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(26,46,36,0.3)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
                    {calDays.map((day, i) => {
                      const isPast = day !== null && (
                        jYear < jTodayY ||
                        (jYear === jTodayY && jMonth < jTodayM) ||
                        (jYear === jTodayY && jMonth === jTodayM && day < jTodayD)
                      );
                      const isSelected = day === selectedJDay;
                      const isToday = day === jTodayD && jMonth === jTodayM && jYear === jTodayY;
                      return (
                        <button key={i} onClick={() => day && !isPast && setSelectedJDay(day)}
                          style={{
                            height: '40px', borderRadius: '10px', border: 'none',
                            fontSize: '13px', fontWeight: isToday ? 800 : 500,
                            cursor: day && !isPast ? 'pointer' : 'default',
                            background: isSelected ? 'linear-gradient(135deg,#10b981,#059669)' : isToday ? 'rgba(16,185,129,0.08)' : 'transparent',
                            color: isSelected ? '#fff' : isPast ? 'rgba(26,46,36,0.15)' : isToday ? '#059669' : '#0f2318',
                            outline: isToday && !isSelected ? '2px solid rgba(16,185,129,0.25)' : 'none',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
                            textDecoration: isPast ? 'line-through' : 'none',
                          }}>
                          {day ? toFa(day) : ''}
                        </button>
                      );
                    })}
                  </div>
                  {selectedJDay && (
                    <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check size={16} style={{ color: '#10b981' }} />
                      <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
                        {toFa(selectedJDay)} {persianMonths[jMonth - 1]} {toFa(jYear)} انتخاب شد
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* مرحله ۲ — میز */}
              {step === 2 && (
                <div>
                  <h4 style={{ fontWeight: 800, color: '#0f2318', margin: '0 0 14px', fontSize: '15px' }}>انتخاب میز</h4>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
                    {types.map(t => (
                      <button key={t} onClick={() => setFilterType(t)} style={{
                        padding: '6px 14px', borderRadius: '20px', whiteSpace: 'nowrap',
                        border: `1px solid ${filterType === t ? 'rgba(16,185,129,0.35)' : 'rgba(26,46,36,0.1)'}`,
                        background: filterType === t ? 'rgba(16,185,129,0.1)' : 'transparent',
                        color: filterType === t ? '#059669' : 'rgba(26,46,36,0.45)',
                        fontSize: '12px', fontWeight: filterType === t ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s',
                      }}>{t}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filtered.map(table => (
                      <button key={table.id} onClick={() => setSelectedTable(table)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '14px 16px', borderRadius: '16px',
                          border: `1px solid ${selectedTable?.id === table.id ? table.color : 'rgba(26,46,36,0.08)'}`,
                          background: selectedTable?.id === table.id ? `${table.color}10` : 'rgba(255,255,255,0.8)',
                          cursor: 'pointer', transition: 'all 0.25s', textAlign: 'right',
                          boxShadow: selectedTable?.id === table.id ? `0 4px 16px ${table.color}20` : '0 2px 8px rgba(0,0,0,0.04)',
                        }}>
                        {/* وضعیت */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0, width: '40px' }}>
                          <div style={{ position: 'relative', width: '12px', height: '12px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: table.busy ? '#ef4444' : '#10b981', boxShadow: `0 0 8px ${table.busy ? '#ef4444' : '#10b981'}` }} />
                            {!table.busy && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981', animation: 'ping 1.5s infinite', opacity: 0.5 }} />}
                          </div>
                          <span style={{ fontSize: '9px', color: table.busy ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                            {table.busy ? 'مشغول' : 'آزاد'}
                          </span>
                        </div>
                        {/* آیکون */}
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${table.color}12`, border: `1px solid ${table.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                          🎱
                        </div>
                        {/* اطلاعات */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: selectedTable?.id === table.id ? table.color : '#0f2318' }}>{table.name}</span>
                            <span style={{ fontSize: '10px', color: table.color, background: `${table.color}12`, border: `1px solid ${table.color}25`, borderRadius: '20px', padding: '2px 8px', fontWeight: 600 }}>{table.type}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'rgba(26,46,36,0.45)', marginBottom: '2px' }}>{table.brand}</div>
                          {table.bookedSlots.length > 0 && (
                            <div style={{ fontSize: '11px', color: 'rgba(239,68,68,0.6)' }}>رزرو: {table.bookedSlots.join(' · ')}</div>
                          )}
                        </div>
                        {selectedTable?.id === table.id && (
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: table.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Check size={14} style={{ color: '#fff' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* مرحله ۳ — ساعت */}
              {step === 3 && selectedTable && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '14px 16px', background: `${selectedTable.color}08`, border: `1px solid ${selectedTable.color}20`, borderRadius: '14px' }}>
                    <div style={{ fontSize: '24px' }}>🎱</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: selectedTable.color }}>{selectedTable.brand}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(26,46,36,0.45)' }}>{selectedTable.type} · {selectedTable.name}</div>
                    </div>
                    <div style={{ marginRight: 'auto', textAlign: 'left' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(26,46,36,0.3)' }}>تاریخ</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f2318' }}>{toFa(selectedJDay || 0)} {persianMonths[jMonth - 1]}</div>
                    </div>
                  </div>


                  <div style={{ marginBottom: '14px' }}>
                    <h4 style={{ fontWeight: 800, color: '#0f2318', margin: '0 0 10px', fontSize: '15px' }}>انتخاب ساعت</h4>
                    {selectedSlots.length > 0 && (
                      <div style={{
                        padding: '12px 16px',
                        background: `${selectedTable?.color}10`,
                        border: `1px solid ${selectedTable?.color}30`,
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={15} style={{ color: selectedTable?.color }} />
                          <span style={{ fontSize: '14px', fontWeight: 800, color: selectedTable?.color }}>
                            از {toFa(selectedSlots[0])} تا {toFa(`${String(parseInt(selectedSlots[selectedSlots.length - 1].split(':')[0]) + 1).padStart(2, '0')}:00`)}
                          </span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(26,46,36,0.5)', background: 'rgba(255,255,255,0.7)', padding: '4px 12px', borderRadius: '20px' }}>
                          {toFa(selectedSlots.length)} ساعت
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                    {timeSlots.map(time => {
                      const isBooked = selectedTable.bookedSlots.includes(time);
                      const isSelected = selectedSlots.includes(time);
                      return (
                        <button key={time} onClick={() => toggleSlot(time)}
                          style={{
                            padding: '13px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                            border: `1px solid ${isSelected ? selectedTable.color : isBooked ? 'rgba(239,68,68,0.15)' : 'rgba(26,46,36,0.08)'}`,
                            background: isSelected ? `${selectedTable.color}15` : isBooked ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.9)',
                            color: isSelected ? selectedTable.color : isBooked ? 'rgba(239,68,68,0.3)' : '#0f2318',
                            cursor: isBooked ? 'not-allowed' : 'pointer',
                            textDecoration: isBooked ? 'line-through' : 'none',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? `0 0 0 2px ${selectedTable.color}40` : 'none',
                            position: 'relative',
                          }}>
                          {isBooked && <div style={{ position: 'absolute', top: '4px', right: '5px', width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 4px #ef4444' }} />}
                          {toFa(time)}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(26,46,36,0.35)', marginTop: '10px', textAlign: 'center' }}>
                    ابتدا ساعت شروع، سپس ساعت پایان را انتخاب کنید
                  </div>

                  <div style={{ display: 'flex', gap: '20px', marginTop: '14px' }}>
                    {[{ c: '#10b981', label: 'آزاد' }, { c: selectedTable.color, label: 'انتخاب شده' }, { c: '#ef4444', label: 'رزرو شده' }].map(x => (
                      <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(26,46,36,0.4)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: x.c, boxShadow: `0 0 5px ${x.c}` }} />{x.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* مرحله ۴ — پرداخت */}
              {step === 4 && selectedTable && (
                <div>
                  <h4 style={{ fontWeight: 800, color: '#0f2318', margin: '0 0 20px', fontSize: '15px' }}>خلاصه رزرو و پرداخت</h4>
                  <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                    {[
                      { label: 'باشگاه', value: club.name },
                      { label: 'میز', value: `${selectedTable.brand} — ${selectedTable.type}` },
                      { label: 'تاریخ', value: `${toFa(selectedJDay || 0)} ${persianMonths[jMonth - 1]} ${toFa(jYear)}` },
                      { label: 'ساعات', value: selectedSlots.map(toFa).join(' · ') },
                      { label: 'مدت', value: `${toFa(selectedSlots.length)} ساعت` },
                    ].map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 4 ? '1px solid rgba(16,185,129,0.08)' : 'none' }}>
                        <span style={{ fontSize: '13px', color: 'rgba(26,46,36,0.4)' }}>{r.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f2318' }}>{r.value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', marginTop: '8px', borderTop: '2px solid rgba(16,185,129,0.12)' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f2318' }}>مبلغ قابل پرداخت</span>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: '#059669' }}>{toFa(selectedSlots.length * 150000)} تومان</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f2318', marginBottom: '10px' }}>انتخاب درگاه پرداخت</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                      {[
                        { name: 'زرین‌پال', icon: '💳', color: '#7c3aed' },
                        { name: 'ملت', icon: '🏦', color: '#dc2626' },
                        { name: 'پارسیان', icon: '🏦', color: '#d97706' },
                      ].map(g => (
                        <div key={g.name} onClick={() => setSelectedGateway(g.name)}
                          style={{
                            padding: '16px 8px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                            border: `2px solid ${selectedGateway === g.name ? g.color : 'rgba(26,46,36,0.08)'}`,
                            background: selectedGateway === g.name ? `${g.color}08` : 'rgba(255,255,255,0.8)',
                            boxShadow: selectedGateway === g.name ? `0 4px 16px ${g.color}20` : 'none',
                          }}>
                          <div style={{ fontSize: '28px', marginBottom: '8px' }}>{g.icon}</div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: selectedGateway === g.name ? g.color : '#0f2318' }}>{g.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', fontSize: '12px', color: 'rgba(26,46,36,0.5)', lineHeight: 1.7 }}>
                    ⚠️ پس از پرداخت موفق، رزرو تأیید و پیامک ارسال می‌شود. صاحب باشگاه نیز از رزرو مطلع می‌شود.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* footer */}
        {!confirmed && (
          <div style={{ padding: '14px 24px 20px', borderTop: '1px solid rgba(16,185,129,0.08)', display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.95)', flexShrink: 0 }}>
            {step > 1 && (
              <button onClick={() => setStep(s => (s - 1) as 1 | 2 | 3 | 4)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', color: '#059669', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                ← قبلی
              </button>
            )}
            <button onClick={handleNext} disabled={!canNext || paying}
              style={{
                flex: 2, padding: '13px', borderRadius: '12px',
                background: canNext && !paying ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(16,185,129,0.2)',
                border: 'none', color: '#fff', fontWeight: 800, fontSize: '14px',
                cursor: canNext && !paying ? 'pointer' : 'not-allowed',
                boxShadow: canNext ? '0 4px 20px rgba(16,185,129,0.25)' : 'none',
                transition: 'all 0.3s',
              }}>
              {paying ? '⏳ در حال اتصال به درگاه...' : step < 4 ? 'مرحله بعد ←' : '💳 پرداخت و تأیید رزرو'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// تبدیل شمسی به میلادی برای محاسبه روز اول ماه
function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let jy2 = jy - 979;
  let jm2 = jm - 1;
  let jd2 = jd - 1;
  let j_day_no = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor((jy2 % 33 + 3) / 4);
  for (let i = 0; i < jm2; i++) j_day_no += [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29][i];
  j_day_no += jd2;
  let g_day_no = j_day_no + 79;
  let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no = g_day_no % 146097;
  let leap = true;
  if (g_day_no >= 36525) { g_day_no--; gy += 100 * Math.floor(g_day_no / 36524); g_day_no = g_day_no % 36524; if (g_day_no >= 365) g_day_no++; else leap = false; }
  gy += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;
  if (g_day_no >= 366) { leap = false; g_day_no--; gy += Math.floor(g_day_no / 365); g_day_no = g_day_no % 365; }
  const g_days_in_month = [31, 29 * +leap, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (let i = 0; g_day_no >= g_days_in_month[i]; i++) { g_day_no -= g_days_in_month[i]; gm++; }
  return [gy, gm + 1, g_day_no + 1];
}

// ===== صفحه اصلی =====
export default function ClubProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const [club, setClub] = useState<Club>(sampleClub);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showReservation, setShowReservation] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    api.get(`/clubs/${id}`).then(res => { if (res.data) setClub(res.data); }).catch(() => { });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setDistance(calcDistance(pos.coords.latitude, pos.coords.longitude, sampleClub.latitude, sampleClub.longitude));
      });
    }
    setTimeout(() => setLoading(false), 400);
  }, [id]);

  const images = club.images?.length > 0 ? club.images : ['/images/billiadr-club-1.jpg', '/images/billiadr-club-2.jpg', '/images/billiadr-club-3.jpg'];
  const activeTables = tableTypesList.filter(t => (club as any)[t.key] > 0);
  const todayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  const todayHours = club.workingHours?.[todayKey];
  const mapsUrl = `https://www.google.com/maps?q=${club.latitude},${club.longitude}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${club.latitude},${club.longitude}&z=15&output=embed`;

  const isOpen = (() => {
    if (!todayHours?.isOpen) return false;
    const now = new Date();
    const [oh] = todayHours.open.split(':').map(Number);
    const [ch] = todayHours.close.split(':').map(Number);
    const nowH = now.getHours();
    const closeH = ch === 0 ? 24 : ch;
    return nowH >= oh && nowH < closeH;
  })();

  const prevImage = () => setActiveImage(p => (p - 1 + images.length) % images.length);
  const nextImage = () => setActiveImage(p => (p + 1) % images.length);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (videoPlaying) { videoRef.current.pause(); setVideoPlaying(false); }
      else { videoRef.current.play(); setVideoPlaying(true); }
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f0faf5,#e8f5ef)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#10b981' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎱</div>
        <p style={{ fontSize: '14px', opacity: 0.5 }}>در حال بارگذاری...</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0;} }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.5;} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        .ppg { min-height:100vh; background:linear-gradient(160deg,#f0faf5 0%,#e8f5ef 30%,#f4faf7 100%); }
        .gc { background:rgba(255,255,255,0.78); border:1px solid rgba(16,185,129,0.1); border-radius:20px; backdrop-filter:blur(20px); box-shadow:0 4px 20px rgba(16,185,129,0.06),inset 0 1px 0 rgba(255,255,255,0.9); padding:24px; margin-bottom:20px; animation:fadeIn 0.5s ease; }
        .ct { font-size:15px;font-weight:800;color:#0f2318;margin:0 0 18px;display:flex;align-items:center;gap:8px; }
        .ctb { width:4px;height:18px;background:linear-gradient(180deg,#10b981,#06b6d4);border-radius:2px;display:inline-block;flex-shrink:0; }
        .arr { position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,0.92);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.15);transition:all 0.3s;z-index:5;color:#0f2318;backdrop-filter:blur(10px); }
        .arr:hover { background:#fff;transform:translateY(-50%) scale(1.1);box-shadow:0 8px 28px rgba(0,0,0,0.2); }
        .rbtn { width:100%;padding:16px;border:none;border-radius:16px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 8px 30px rgba(16,185,129,0.3);transition:all 0.3s; }
        .rbtn:hover { transform:translateY(-2px);box-shadow:0 14px 40px rgba(16,185,129,0.4); }
        .dr { display:flex;justify-content:space-between;align-items:center;padding:9px 12px;border-radius:10px;font-size:13px;transition:background 0.2s; }
        .dr:hover { background:rgba(16,185,129,0.04); }
        @media(max-width:900px){ .pgrid{grid-template-columns:1fr !important;} .tgrid{grid-template-columns:repeat(3,1fr) !important;} }
        @media(max-width:480px){ .tgrid{grid-template-columns:repeat(2,1fr) !important;} }
      `}</style>

      <div className="ppg" style={{ padding: '32px 24px 0' }}>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 20% 20%,rgba(16,185,129,0.06) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(6,182,212,0.04) 0%,transparent 50%)' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(26,46,36,0.4)', marginBottom: '24px' }}>
            <Link href="/clubs" style={{ color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ChevronRight size={14} /> باشگاه‌ها
            </Link>
            <span>›</span>
            <span style={{ color: '#0f2318', fontWeight: 600 }}>{club.name}</span>
          </div>

          {/* هدر با عکس بکگراند */}
          <div style={{ borderRadius: '28px', marginBottom: '20px', position: 'relative', overflow: 'hidden', minHeight: '280px' }}>
            <img src={images[0]} alt={club.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65) saturate(0.85)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(6,78,59,0.75) 0%,rgba(6,95,70,0.6) 60%,rgba(4,120,87,0.5) 100%)' }} />
            <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(rgba(255,255,255,0.06),transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', padding: 'clamp(24px,4vw,40px)', display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>

              {/* آواتار استوری */}
              {club.hasStory && (
                <div style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }} onClick={() => alert('استوری‌های باشگاه')}>
                  <div style={{ padding: '3px', borderRadius: '50%', background: 'linear-gradient(135deg,#ef4444,#f97316)', boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(6,78,59,0.85)', background: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <img src={images[0]} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: '3px', right: '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', border: '2px solid rgba(6,78,59,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(239,68,68,0.6)' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
                  </div>
                </div>
              )}

              {/* اطلاعات */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', fontWeight: 600 }}>BILLIARD CLUB</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: isOpen ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)', borderRadius: '20px', padding: '3px 10px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOpen ? '#10b981' : '#ef4444', animation: isOpen ? 'pulse 2s infinite' : 'none' }} />
                    <span style={{ fontSize: '11px', color: isOpen ? '#6ee7b7' : '#fca5a5', fontWeight: 700 }}>
                      {isOpen ? `باز — تا ${toFa(todayHours?.close || '')}` : 'بسته است'}
                    </span>
                  </div>
                </div>
                <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>{club.name}</h1>
                {club.managerName && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 14px' }}>مدیر: {club.managerName}</p>}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.12)', borderRadius: '20px', padding: '5px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
                    <MapPin size={11} /> {club.city}
                  </div>
                  {distance && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16,185,129,0.25)', borderRadius: '20px', padding: '5px 12px', fontSize: '12px', color: '#6ee7b7', backdropFilter: 'blur(10px)' }}>
                      <Navigation size={11} /> {distance}
                    </div>
                  )}
                  {todayHours?.isOpen && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.12)', borderRadius: '20px', padding: '5px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
                      <Clock size={11} /> {toFa(todayHours.open)} تا {toFa(todayHours.close)}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.12)', borderRadius: '20px', padding: '5px 12px', backdropFilter: 'blur(10px)' }}>
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} style={{ color: s <= 4 ? '#f59e0b' : 'rgba(255,255,255,0.25)', fill: s <= 4 ? '#f59e0b' : 'transparent' }} />)}
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginRight: '4px' }}>۴.۸</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', alignItems: 'start' }}>

            {/* ستون اصلی */}
            <div>

              {/* گالری */}
              <div className="gc" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: '320px', background: '#064e3b' }}>
                  <img src={images[activeImage]} alt={club.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in', transition: 'opacity 0.4s' }}
                    onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-1.jpg'; }}
                    onClick={() => setLightboxOpen(true)} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.35) 100%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: '14px', left: '14px', background: 'rgba(0,0,0,0.5)', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: '#fff', backdropFilter: 'blur(10px)' }}>
                    {toFa(activeImage + 1)} / {toFa(images.length)}
                  </div>
                  {images.length > 1 && (
                    <>
                      <button className="arr" onClick={prevImage} style={{ right: '12px' }}><ChevronRight size={18} /></button>
                      <button className="arr" onClick={nextImage} style={{ left: '12px' }}><ChevronLeft size={18} /></button>
                    </>
                  )}
                  <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setActiveImage(i)}
                        style={{ height: '6px', width: i === activeImage ? '20px' : '6px', borderRadius: '3px', background: i === activeImage ? '#fff' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
                    ))}
                  </div>
                </div>
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto', background: 'rgba(255,255,255,0.8)' }}>
                    {images.map((img, i) => (
                      <div key={i} onClick={() => setActiveImage(i)}
                        style={{ flexShrink: 0, width: '80px', height: '58px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === activeImage ? '#10b981' : 'transparent'}`, boxShadow: i === activeImage ? '0 0 12px rgba(16,185,129,0.3)' : 'none', transition: 'all 0.3s' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-1.jpg'; }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ویدیو */}
              <div className="gc">
                <h2 className="ct"><span className="ctb" /> ویدیوی معرفی باشگاه</h2>
                <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#064e3b', aspectRatio: '16/9' }}>
                  {club.videos && club.videos.length > 0 ? (
                    <>
                      <video ref={videoRef} src={club.videos[0]} muted={videoMuted}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onEnded={() => setVideoPlaying(false)} />
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={toggleVideo} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                          {videoPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button onClick={() => setVideoMuted(m => !m)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                          {videoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                      </div>
                      {!videoPlaying && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', cursor: 'pointer' }} onClick={toggleVideo}>
                          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(16,185,129,0.4)' }}>
                            <Play size={28} style={{ color: '#fff', marginRight: '-3px' }} />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ width: '100%', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={24} style={{ color: 'rgba(16,185,129,0.4)' }} />
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>ویدیویی توسط باشگاه آپلود نشده</p>
                    </div>
                  )}
                </div>
              </div>

              {/* توضیحات */}
              <div className="gc">
                <h2 className="ct"><span className="ctb" /> درباره باشگاه</h2>
                <p style={{ fontSize: '14px', color: 'rgba(26,46,36,0.6)', lineHeight: 1.9, margin: 0 }}>{club.description}</p>
                {club.specialFeatures && (
                  <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '14px' }}>
                    <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 700, marginBottom: '6px' }}>⭐ امکانات ویژه</div>
                    <p style={{ fontSize: '13px', color: 'rgba(26,46,36,0.55)', margin: 0, lineHeight: 1.7 }}>{club.specialFeatures}</p>
                  </div>
                )}
              </div>

              {/* میزها */}
              <div className="gc">
                <h2 className="ct"><span className="ctb" /> میزها و تجهیزات</h2>
                <div className="tgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
                  {activeTables.map(t => (
                    <div key={t.key} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: '14px', padding: '14px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '26px', fontWeight: 900, color: t.color, marginBottom: '4px' }}>{toFa((club as any)[t.key])}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(26,46,36,0.45)', fontWeight: 500 }}>{t.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {club.hasCafe && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#d97706', fontWeight: 500 }}><Coffee size={12} /> کافه</span>}
                  {club.hasParking && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#0891b2', fontWeight: 500 }}><Car size={12} /> پارکینگ</span>}
                  {club.hasWifi && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#7c3aed', fontWeight: 500 }}><Wifi size={12} /> اینترنت رایگان</span>}
                  {club.hasProfessionalCoach && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669', fontWeight: 500 }}><Trophy size={12} /> مربی حرفه‌ای</span>}
                </div>
              </div>

              {/* ساعات کاری */}
              {club.workingHours && (
                <div className="gc">
                  <h2 className="ct"><span className="ctb" /> ساعات کاری</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {Object.entries(club.workingHours).map(([day, hours]: any) => (
                      <div key={day} className="dr" style={{ background: day === todayKey ? 'rgba(16,185,129,0.06)' : 'transparent', border: day === todayKey ? '1px solid rgba(16,185,129,0.12)' : '1px solid transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: day === todayKey ? 800 : 500, color: day === todayKey ? '#059669' : 'rgba(26,46,36,0.6)', fontSize: '13px', width: '75px' }}>{dayNames[day]}</span>
                          {day === todayKey && <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>امروز</span>}
                        </div>
                        {hours.isOpen ? (
                          <span style={{ fontSize: '13px', color: 'rgba(26,46,36,0.5)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} style={{ color: '#10b981' }} /> {toFa(hours.open)} — {toFa(hours.close)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#dc2626', background: 'rgba(239,68,68,0.06)', padding: '3px 12px', borderRadius: '20px', fontWeight: 600 }}>تعطیل</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* نقشه */}
              <div className="gc" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 20px 0' }}>
                  <h2 className="ct" style={{ marginBottom: '14px' }}><span className="ctb" /> موقعیت و مسیریابی</h2>
                </div>
                <div style={{ height: '240px', position: 'relative', overflow: 'hidden' }}>
                  <iframe src={mapEmbedUrl} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', color: 'rgba(26,46,36,0.5)' }}>
                    <MapPin size={13} style={{ color: '#10b981', marginLeft: '4px', verticalAlign: 'middle' }} />
                    {club.address}، {club.city}
                  </div>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '10px', color: '#0891b2', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                    <Navigation size={13} /> مسیریابی
                  </a>
                </div>
              </div>
            </div>

            {/* ستون کنار */}
            <div style={{ position: 'sticky', top: '90px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* رزرو */}
              <div className="gc">
                <h2 className="ct"><span className="ctb" /> رزرو آنلاین</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { v: clubTables.filter(t => !t.busy).length, label: 'آزاد', c: '#10b981', bg: 'rgba(16,185,129,0.07)', b: 'rgba(16,185,129,0.15)' },
                    { v: clubTables.filter(t => t.busy).length, label: 'مشغول', c: '#ef4444', bg: 'rgba(239,68,68,0.06)', b: 'rgba(239,68,68,0.12)' },
                    { v: clubTables.length, label: 'کل', c: '#0f2318', bg: 'rgba(16,185,129,0.04)', b: 'rgba(16,185,129,0.1)' },
                  ].map((x, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '10px 6px', background: x.bg, borderRadius: '12px', border: `1px solid ${x.b}` }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: x.c }}>{toFa(x.v)}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(26,46,36,0.4)', marginTop: '2px' }}>{x.label}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(26,46,36,0.4)', marginBottom: '16px', lineHeight: 1.6 }}>
                  میز مورد نظر را انتخاب کرده و آنلاین رزرو کنید.
                </p>
                <button className="rbtn" onClick={() => user ? setShowReservation(true) : router.push('/login')}>
                  <Calendar size={18} /> رزرو میز آنلاین
                </button>
              </div>

              {/* تماس */}
              <div className="gc">
                <h2 className="ct"><span className="ctb" /> اطلاعات تماس</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'rgba(26,46,36,0.55)' }}>
                    <MapPin size={14} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.6 }}>{club.address}، {club.city}</span>
                  </div>
                  {club.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      <Phone size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <a href={`tel:${club.phone}`} style={{ color: 'rgba(26,46,36,0.55)', textDecoration: 'none' }}>{club.phone}</a>
                    </div>
                  )}
                  {club.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      <Globe size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <a href={club.website} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', textDecoration: 'none' }}>{club.website.replace('https://', '')}</a>
                    </div>
                  )}
                </div>
              </div>

              {/* امتیاز */}
              <div className="gc" style={{ textAlign: 'center' }}>
                <h2 className="ct" style={{ justifyContent: 'center' }}><span className="ctb" /> امتیاز کاربران</h2>
                <div style={{ fontSize: '52px', fontWeight: 900, color: '#0f2318', lineHeight: 1, marginBottom: '8px' }}>۴.۸</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '6px' }}>
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={18} style={{ color: '#f59e0b', fill: s <= 4 ? '#f59e0b' : 'transparent' }} />)}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(26,46,36,0.35)' }}>بر اساس ۱۲۴ نظر</div>
              </div>
            </div>
          </div>
          <div style={{ paddingBottom: '60px' }} />
        </div>
      </div>

      {showReservation && <ReservationModal club={club} onClose={() => setShowReservation(false)} />}

      {lightboxOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightboxOpen(false)}>
          <button style={{ position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightboxOpen(false)}>
            <X size={20} />
          </button>
          <button onClick={e => { e.stopPropagation(); prevImage(); }} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={22} />
          </button>
          <img src={images[activeImage]} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px' }} onClick={e => e.stopPropagation()} />
          <button onClick={e => { e.stopPropagation(); nextImage(); }} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={22} />
          </button>
        </div>
      )}
    </>
  );
}