'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import { Calendar, Clock, Check, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';

interface Table {
  id: string; number: number; name: string;
  type: string; brand: string; model: string; pricePerHour: number;
}
interface Slot  { hour: number; isBooked: boolean; }
interface Club  { id: string; name: string; }

const typeLabels: Record<string, string> = {
  snooker: 'اسنوکر', pocket: 'پاکت بیلیارد',
  highball: 'هی‌بال', vip_snooker: 'VIP اسنوکر', vip_pocket: 'VIP پاکت',
};

const typeColors: Record<string, string> = {
  snooker: '#10b981', pocket: '#06b6d4',
  highball: '#a78bfa', vip_snooker: '#f59e0b', vip_pocket: '#f59e0b',
};

function toPersian(date: Date) {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

export default function BookingPage() {
  const params  = useParams();
  const clubId  = params.clubId as string;
  const router  = useRouter();
  const { user } = useAuthStore();

  const [club, setClub]               = useState<Club | null>(null);
  const [tables, setTables]           = useState<Table[]>([]);
  const [selectedTable, setTable]     = useState<Table | null>(null);
  const [selectedDate, setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots]             = useState<Slot[]>([]);
  const [selectedSlots, setSlots2]    = useState<number[]>([]);
  const [loading, setLoading]         = useState(true);
  const [slotsLoading, setSlotsLoad]  = useState(false);
  const [booking, setBooking]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState('');
  const [step, setStep]               = useState<1|2|3>(1);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    Promise.all([
      api.get(`/clubs/${clubId}`),
      api.get(`/clubs/${clubId}/tables`),
    ]).then(([c, t]) => {
      setClub(c.data); setTables(t.data); setLoading(false);
    }).catch(() => setLoading(false));
  }, [clubId]);

  useEffect(() => {
    if (!selectedTable || !selectedDate) return;
    setSlotsLoad(true);
    api.get(`/bookings/slots?clubId=${clubId}&tableNumber=${selectedTable.number}&date=${selectedDate}`)
      .then(r => { setSlots(r.data); setSlots2([]); setSlotsLoad(false); })
      .catch(() => setSlotsLoad(false));
  }, [selectedTable, selectedDate]);

  const toggleSlot = (hour: number, isBooked: boolean) => {
    if (isBooked) return;
    setSlots2(prev => prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour].sort((a, b) => a - b));
  };

  const totalPrice = selectedTable ? selectedSlots.length * selectedTable.pricePerHour : 0;

  const handleBooking = async () => {
    if (!selectedTable || selectedSlots.length === 0) { setError('لطفاً میز و ساعت را انتخاب کنید'); return; }
    const sorted   = [...selectedSlots].sort((a, b) => a - b);
    const startHour = sorted[0] ?? 0;
    const endHour   = (sorted[sorted.length - 1] ?? 0) + 1;
    const startTime = new Date(`${selectedDate}T${String(startHour).padStart(2,'0')}:00:00Z`);
    const endTime   = new Date(`${selectedDate}T${String(endHour).padStart(2,'0')}:00:00Z`);
    setBooking(true); setError('');
    try {
      await api.post('/bookings', {
        clubId, tableType: selectedTable.type, tableNumber: selectedTable.number,
        startTime: startTime.toISOString(), endTime: endTime.toISOString(),
        totalPrice, currency: 'IRR',
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در رزرو');
    } finally {
      setBooking(false);
    }
  };

  const accentColor = selectedTable ? (typeColors[selectedTable.type] ?? '#10b981') : '#10b981';

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '80vh', background: '#020806', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '2px solid rgba(16,185,129,0.1)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: '13px', color: 'rgba(240,250,245,0.3)' }}>در حال بارگذاری...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  /* ── Success ── */
  if (success) return (
    <div style={{ minHeight: '80vh', background: '#020806', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '28px', padding: 'clamp(32px,5vw,52px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '160px', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.6),transparent)', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }} />
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 12px 40px rgba(16,185,129,0.35)' }}>
          <CheckCircle size={32} style={{ color: '#fff' }} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#f0faf5', margin: '0 0 12px', letterSpacing: '-0.02em' }}>رزرو موفق!</h2>
        <p style={{ fontSize: '14px', color: 'rgba(240,250,245,0.45)', margin: '0 0 32px', lineHeight: 1.7 }}>
          میز شما رزرو شد. پس از تأیید باشگاه پیامک دریافت خواهید کرد.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/clubs" style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
            بازگشت به باشگاه‌ها
          </Link>
          <Link href="/dashboard" style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(240,250,245,0.7)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            رزروهای من
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }

        .slot-btn {
          padding: 12px 6px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          text-align: center;
          line-height: 1.3;
        }
        .slot-btn:active { transform: scale(0.96); }
        .slot-free  { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.1); color:rgba(240,250,245,0.6); }
        .slot-free:hover { background:rgba(16,185,129,0.08); border-color:rgba(16,185,129,0.3); color:#10b981; }
        .slot-sel   { background:rgba(16,185,129,0.15); border-color:rgba(16,185,129,0.5); color:#10b981; box-shadow:0 0 12px rgba(16,185,129,0.2); }
        .slot-busy  { background:rgba(239,68,68,0.05); border-color:rgba(239,68,68,0.15); color:rgba(239,68,68,0.35); cursor:not-allowed; text-decoration:line-through; }

        .table-card { padding:18px 20px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; cursor:pointer; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); display:flex; align-items:center; gap:16px; }
        .table-card:hover { background:rgba(255,255,255,0.055); transform:translateY(-2px); }
        .table-card.selected { border-color:var(--tc); background:rgba(var(--tc-rgb),0.08); }

        .step-section { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }

        @media(max-width:640px) {
          .booking-grid { grid-template-columns:repeat(4,1fr) !important; }
          .booking-pad  { padding:20px 16px !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#020806 0%,#060d0a 100%)', padding: '0 0 80px' }}>

        {/* ── Header ── */}
        <div style={{ background: 'rgba(2,8,6,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px clamp(16px,4vw,40px)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href={`/clubs/${clubId}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(240,250,245,0.4)', fontSize: '13px', textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '8px 14px', transition: 'all 0.2s', flexShrink: 0 }}>
            <ChevronRight size={14} /> بازگشت
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: 'rgba(16,185,129,0.6)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: '3px' }}>ONLINE BOOKING</div>
            <h1 style={{ fontSize: 'clamp(16px,3vw,22px)', fontWeight: 900, color: '#f0faf5', margin: 0, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {club?.name ?? 'رزرو میز'}
            </h1>
          </div>
        </div>

        {/* ── Step indicator ── */}
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '28px clamp(16px,4vw,32px) 0' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
            {[{n:1,l:'میز'},{n:2,l:'تاریخ و ساعت'},{n:3,l:'تأیید'}].map((s, i) => (
              <div key={s.n} style={{ flex: 1 }}>
                <div style={{ height: '2px', borderRadius: '1px', background: step >= s.n ? `linear-gradient(90deg,#10b981,#06b6d4)` : 'rgba(255,255,255,0.06)', marginBottom: '8px', transition: 'background 0.4s', boxShadow: step >= s.n ? '0 0 8px rgba(16,185,129,0.4)' : 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: step > s.n ? '#10b981' : step === s.n ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: step >= s.n ? '#fff' : 'rgba(240,250,245,0.3)', fontWeight: 800, flexShrink: 0, transition: 'all 0.3s', boxShadow: step === s.n ? '0 4px 12px rgba(16,185,129,0.35)' : 'none' }}>
                    {step > s.n ? <Check size={11} /> : toFa(s.n)}
                  </div>
                  <span style={{ fontSize: '11px', color: step >= s.n ? '#10b981' : 'rgba(240,250,245,0.25)', fontWeight: step === s.n ? 700 : 400, transition: 'color 0.3s' }}>{s.l}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', marginBottom: '20px' }}>
              <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#fca5a5' }}>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Table selection ── */}
          {step === 1 && (
            <div className="step-section">
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '9px', color: 'rgba(240,250,245,0.3)', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '8px' }}>مرحله ۱</div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f0faf5', margin: 0, letterSpacing: '-0.02em' }}>انتخاب میز</h2>
              </div>

              {tables.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px' }}>
                  <div style={{ fontSize: '40px', opacity: 0.2, marginBottom: '14px' }}>🎱</div>
                  <p style={{ color: 'rgba(240,250,245,0.35)', fontSize: '14px', margin: 0 }}>این باشگاه هنوز میز ثبت نکرده</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tables.map(table => {
                    const color = typeColors[table.type] ?? '#10b981';
                    const isSelected = selectedTable?.id === table.id;
                    return (
                      <div key={table.id} onClick={() => setTable(table)}
                        style={{ padding: '18px 20px', background: isSelected ? `${color}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? `${color}45` : 'rgba(255,255,255,0.08)'}`, borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: isSelected ? `0 8px 28px ${color}15` : 'none', transform: isSelected ? 'translateY(-2px)' : 'none' }}>
                        {/* Icon */}
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🎱</div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: isSelected ? color : '#f0faf5', letterSpacing: '-0.01em' }}>{table.name}</span>
                            <span style={{ fontSize: '9px', color, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: '20px', padding: '3px 10px', fontWeight: 700 }}>{typeLabels[table.type] ?? table.type}</span>
                          </div>
                          {(table.brand || table.model) && (
                            <div style={{ fontSize: '12px', color: 'rgba(240,250,245,0.35)' }}>{table.brand} {table.model}</div>
                          )}
                        </div>

                        {/* Price */}
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ fontSize: '16px', fontWeight: 900, color, letterSpacing: '-0.02em', textShadow: isSelected ? `0 0 16px ${color}60` : 'none' }}>
                            {table.pricePerHour > 0 ? toFa(table.pricePerHour.toLocaleString()) : 'رایگان'}
                          </div>
                          {table.pricePerHour > 0 && <div style={{ fontSize: '10px', color: 'rgba(240,250,245,0.3)', marginTop: '2px' }}>تومان / ساعت</div>}
                        </div>

                        {isSelected && (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${color}50` }}>
                            <Check size={14} style={{ color: '#fff' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button onClick={() => { if (!selectedTable) { setError('لطفاً یک میز انتخاب کنید'); return; } setError(''); setStep(2); }}
                disabled={!selectedTable}
                style={{ width: '100%', marginTop: '24px', padding: '15px', borderRadius: '14px', border: 'none', background: selectedTable ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.05)', color: selectedTable ? '#fff' : 'rgba(240,250,245,0.2)', fontSize: '15px', fontWeight: 800, cursor: selectedTable ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.3s', boxShadow: selectedTable ? '0 8px 28px rgba(16,185,129,0.3)' : 'none' }}>
                مرحله بعد — انتخاب تاریخ و ساعت
              </button>
            </div>
          )}

          {/* ── STEP 2: Date + Slots ── */}
          {step === 2 && (
            <div className="step-section">
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '9px', color: 'rgba(240,250,245,0.3)', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '8px' }}>مرحله ۲</div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f0faf5', margin: 0, letterSpacing: '-0.02em' }}>انتخاب تاریخ و ساعت</h2>
              </div>

              {/* Selected table chip */}
              {selectedTable && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: `${accentColor}10`, border: `1px solid ${accentColor}25`, borderRadius: '100px', marginBottom: '20px', fontSize: '12px', color: accentColor, fontWeight: 600 }}>
                  🎱 {selectedTable.name} — {typeLabels[selectedTable.type] ?? selectedTable.type}
                  <button onClick={() => { setStep(1); setTable(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, padding: 0, fontSize: '14px', lineHeight: 1, opacity: 0.6 }}>×</button>
                </div>
              )}

              {/* Date picker */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '22px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(240,250,245,0.6)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} style={{ color: '#10b981' }} /> انتخاب تاریخ
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <input type="date" value={selectedDate} min={new Date().toISOString().slice(0,10)}
                    onChange={e => setDate(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: '#f0faf5', fontSize: '14px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s', minWidth: '160px' }} />
                  <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 600 }}>
                    {toPersian(new Date(selectedDate))}
                  </div>
                </div>
              </div>

              {/* Slots */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '22px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(240,250,245,0.6)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} style={{ color: '#10b981' }} /> انتخاب ساعت
                  </div>
                  {/* Legend */}
                  <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'rgba(240,250,245,0.35)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-block' }} />آزاد</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', display: 'inline-block' }} />انتخاب</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'inline-block' }} />مشغول</span>
                  </div>
                </div>

                {slotsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '32px 0', color: 'rgba(240,250,245,0.3)', fontSize: '13px' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid rgba(16,185,129,0.15)', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    در حال بارگذاری ساعات...
                  </div>
                ) : slots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(240,250,245,0.3)', fontSize: '13px' }}>
                    لطفاً تاریخ را انتخاب کنید
                  </div>
                ) : (
                  <div className="booking-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '8px' }}>
                    {slots.map(slot => (
                      <button key={slot.hour}
                        className={`slot-btn ${slot.isBooked ? 'slot-busy' : selectedSlots.includes(slot.hour) ? 'slot-sel' : 'slot-free'}`}
                        onClick={() => toggleSlot(slot.hour, slot.isBooked)}
                        disabled={slot.isBooked}>
                        {toFa(slot.hour)}:۰۰
                        {slot.isBooked && <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px' }}>مشغول</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected slots summary */}
              {selectedSlots.length > 0 && (
                <div style={{ padding: '14px 18px', background: `${accentColor}10`, border: `1px solid ${accentColor}25`, borderRadius: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: accentColor, fontSize: '14px', fontWeight: 700 }}>
                    <Clock size={14} />
                    از {toFa(selectedSlots[0] ?? 0)}:۰۰ تا {toFa((selectedSlots[selectedSlots.length-1] ?? 0) + 1)}:۰۰
                  </div>
                  <span style={{ fontSize: '13px', color: 'rgba(240,250,245,0.5)', background: 'rgba(255,255,255,0.06)', padding: '4px 14px', borderRadius: '20px', fontWeight: 600 }}>
                    {toFa(selectedSlots.length)} ساعت
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(240,250,245,0.6)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  ← قبلی
                </button>
                <button onClick={() => { if (selectedSlots.length === 0) { setError('لطفاً حداقل یک ساعت انتخاب کنید'); return; } setError(''); setStep(3); }}
                  disabled={selectedSlots.length === 0}
                  style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: selectedSlots.length > 0 ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.05)', color: selectedSlots.length > 0 ? '#fff' : 'rgba(240,250,245,0.2)', fontSize: '14px', fontWeight: 800, cursor: selectedSlots.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.3s', boxShadow: selectedSlots.length > 0 ? '0 8px 24px rgba(16,185,129,0.28)' : 'none' }}>
                  مرحله بعد — تأیید →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 3 && selectedTable && (
            <div className="step-section">
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '9px', color: 'rgba(240,250,245,0.3)', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '8px' }}>مرحله ۳</div>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#f0faf5', margin: 0, letterSpacing: '-0.02em' }}>تأیید و پرداخت</h2>
              </div>

              {/* Summary card */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden', marginBottom: '16px' }}>
                {/* Header */}
                <div style={{ background: `linear-gradient(135deg, ${accentColor}15, rgba(255,255,255,0.02))`, borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${accentColor}15`, border: `1px solid ${accentColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🎱</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', letterSpacing: '-0.01em' }}>{selectedTable.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(240,250,245,0.4)' }}>{typeLabels[selectedTable.type] ?? selectedTable.type} · {club?.name}</div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {[
                    { label: 'تاریخ',  value: toPersian(new Date(selectedDate)) },
                    { label: 'ساعت',   value: `${toFa(selectedSlots[0] ?? 0)}:۰۰ تا ${toFa((selectedSlots[selectedSlots.length-1] ?? 0) + 1)}:۰۰` },
                    { label: 'مدت',    value: `${toFa(selectedSlots.length)} ساعت` },
                    { label: 'قیمت هر ساعت', value: `${toFa(selectedTable.pricePerHour.toLocaleString())} تومان` },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(240,250,245,0.4)' }}>{r.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#f0faf5' }}>{r.value}</span>
                    </div>
                  ))}
                  {totalPrice > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 0' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5' }}>مبلغ کل</span>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: accentColor, letterSpacing: '-0.02em', textShadow: `0 0 20px ${accentColor}40` }}>
                        {toFa(totalPrice.toLocaleString())} <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.7 }}>تومان</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice */}
              <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '14px', marginBottom: '20px', fontSize: '12px', color: 'rgba(240,250,245,0.45)', lineHeight: 1.7 }}>
                ⚠️ پس از تأیید رزرو، پیامک اطلاع‌رسانی ارسال می‌شود. صاحب باشگاه از رزرو مطلع خواهد شد.
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(2)}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(240,250,245,0.6)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  ← قبلی
                </button>
                <button onClick={handleBooking} disabled={booking}
                  style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: booking ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: booking ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.3s', boxShadow: booking ? 'none' : '0 8px 28px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {booking ? (
                    <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />در حال رزرو...</>
                  ) : (
                    <><Check size={16} /> تأیید و ثبت رزرو</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}