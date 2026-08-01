'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Select from '../../../components/ui/Select'
import VerificationBadges from '../../../components/VerificationBadges'
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronDown, Check,
  LayoutDashboard, FileText, Grid3X3, Clock, CalendarDays, Trophy,
  Camera, GraduationCap, AlertTriangle, Trash2, Building2, Phone,
  Plus, Pencil, Eye, Upload, CheckCircle, XCircle, ImageIcon, Settings,
  Loader2, Wallet, Radio, MapPin,
} from 'lucide-react';
import ClubFinance from '../../../components/club/ClubFinance';
import GoLive from '../../../components/club/GoLive';
import api from '../../../lib/api';
import { uploadFile } from '../../../lib/supabase';
import ProvinceCitySelect from '../../../components/ProvinceCitySelect';
import { provinceOfCity } from '../../../lib/iran-geo';
import { useAuthStore } from '../../../store/auth.store';
import { formatCard, isValidCard, bankOfCard, formatIban, isValidIban, bankOfIban, prettyIban } from '../../../lib/bank';
import { apiFetch } from '../../../lib/http';
import { sortTables } from '../../../lib/tables/order';
import FaTimeSelect from '../../../components/ui/FaTimeSelect';
import JalaliDatePicker from '../../../components/ui/JalaliDatePicker';
import { toJalali, jalaliToGregorian, faDate, faTimeRange } from '../../../lib/jalali';
import FaNumberInput, { toFa as faDigit, groupFa, amountInWords } from '../../../components/ui/FaNumberInput';
import {
  GAME_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, formatFee,
  type Tournament, type GameType,
} from '../../../lib/mock-tournaments';

const GOLD = '#C7A66A';
const DARK = '#1A1A18';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Club {
  id: string; name: string; city: string; isActive: boolean;
  verificationStatus?: string; rejectionReason?: string | null;
  bankCard?: string; bankCardOwner?: string; bankName?: string; iban?: string; licenseNumber?: string;
  logo?: string;
}

interface ClubStory {
  id: string;
  mediaUrl: string;
  mediaType: string;
  text: string;
  textColor: string;
  textSize: number;
  textBold: boolean;
  textAlign: 'right' | 'center' | 'left';
  textPos: 'top' | 'center' | 'bottom';
  createdAt: string;
  expiresAt: string;
}

/* شکلِ واقعیِ رکوردِ رزرو. `startTime`/`endTime` هیچ‌وقت وجود نداشتند —
   تاریخ در `bookingDate` و ساعت‌ها در `timeSlots` («۱۸,۱۹,۲۰») ذخیره
   می‌شوند و مبلغ در `final_amount`. */
interface Booking {
  id: string; tableType: string; tableNumber: number | null;
  tableTypeKey?: string | null;
  bookingDate: string; timeSlots: string | null;
  status: string; totalPrice: number; final_amount?: number;
  booking_reference?: string | null;
  user: { firstName: string; lastName: string; phone: string; } | null;
}

interface DiscountRule { id: string; startTime: string; endTime: string; percent: number; label: string; }

interface Table {
  id: string; number: number; name: string; type: string;
  brand: string; model: string; pricePerHour: number; isActive: boolean;
  photoDataUrl?: string;
  discountRules?: DiscountRule[];
  /* هزینه‌ی بازیکن اضافه در سطح میز — undefined یعنی از باشگاه ارث می‌برد */
  playerSurchargeEnabled?: boolean;
  playerSurchargePercent?: number;
  playerSurchargeFrom?: number;
  /* رزروِ همین میز بسته است — میز می‌ماند، ولی در صفحه‌ی رزرو نیست */
  reservationClosed?: boolean;
}

interface WorkingDay { isOpen: boolean; open: string; close: string; }
type WorkingHours = Record<string, WorkingDay>;

interface ClubAlbumItem {
  id: string; dataUrl: string; name: string; caption: string;
}
interface ClubAlbum {
  id: string; name: string; createdAt: string; items: ClubAlbumItem[];
}

interface CoachEntry {
  id: string; name: string; title: string; exp: string; rating: string; bio: string;
}
interface ApiCoach {
  id: string; firstName: string; lastName: string;
  city?: string; bio?: string; verificationStatus?: string;
  coachProfile?: { specialty?: string; experience?: string; sessionPrice?: number; };
}

interface ClubStats {
  members: string; tournaments: string; yearsActive: string; dailyCapacity: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = [
  { key: 'saturday',  label: 'شنبه'     },
  { key: 'sunday',    label: 'یکشنبه'   },
  { key: 'monday',    label: 'دوشنبه'   },
  { key: 'tuesday',   label: 'سه‌شنبه'  },
  { key: 'wednesday', label: 'چهارشنبه' },
  { key: 'thursday',  label: 'پنجشنبه'  },
  { key: 'friday',    label: 'جمعه'     },
];

const DEFAULT_HOURS: WorkingHours = Object.fromEntries(
  DAYS.map(d => [d.key, { isOpen: true, open: '09:00', close: '23:00' }])
);

const DEFAULT_STATS: ClubStats = {
  members: '', tournaments: '', yearsActive: '', dailyCapacity: '',
};

const BOOKING_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'در انتظار تأیید', color: '#92600A', bg: '#FEF3C7' },
  confirmed: { label: 'تأیید شده',       color: '#1D4ED8', bg: '#DBEAFE' },
  active:    { label: 'در حال استفاده',  color: '#166534', bg: '#DCFCE7' },
  completed: { label: 'تکمیل شده',       color: '#4B5563', bg: '#F3F4F6' },
  cancelled: { label: 'لغو شده',         color: '#991B1B', bg: '#FEE2E2' },
};

const TABLE_TYPE_LABELS: Record<string, string> = {
  snooker:     'اسنوکر',
  pocket:      'پاکت بیلیارد',
  highball:    'هی‌بال',
  vip_snooker: 'VIP اسنوکر',
  vip_pocket:  'VIP پاکت',
  air_hockey:  'ایرهاکی',
  playstation: 'پلی‌استیشن',
};

const TYPE_CHIP_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  snooker:     { bg: 'rgba(199,166,106,0.12)', border: 'rgba(199,166,106,0.45)', color: '#7A5C20' },
  pocket:      { bg: 'rgba(6,182,212,0.10)',   border: 'rgba(6,182,212,0.40)',   color: '#0e7490' },
  highball:    { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.45)', color: '#6d28d9' },
  vip_snooker: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.45)',  color: '#92600A' },
  vip_pocket:  { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.45)',  color: '#9a3412' },
  air_hockey:  { bg: 'rgba(48,197,90,0.10)',   border: 'rgba(48,197,90,0.40)',   color: '#166534' },
  playstation: { bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.35)',  color: '#6366f1' },
};

function numberToFarsi(n: number): string {
  if (!n || n <= 0) return '';
  const ones = ['','یک','دو','سه','چهار','پنج','شش','هفت','هشت','نه','ده','یازده','دوازده','سیزده','چهارده','پانزده','شانزده','هفده','هجده','نوزده'];
  const tens_ = ['','','بیست','سی','چهل','پنجاه','شصت','هفتاد','هشتاد','نود'];
  const hunds = ['','صد','دویست','سیصد','چهارصد','پانصد','ششصد','هفتصد','هشتصد','نهصد'];
  const j = (a: string[]) => a.filter(Boolean).join(' و ');
  function lt1k(x: number): string {
    if (x < 20) return ones[x] ?? '';
    if (x < 100) return j([tens_[Math.floor(x/10)] ?? '', x%10 ? ones[x%10]??'' : '']);
    return j([hunds[Math.floor(x/100)] ?? '', x%100 ? lt1k(x%100) : '']);
  }
  if (n < 1000) return lt1k(n);
  if (n < 1_000_000) { const k=Math.floor(n/1000),r=n%1000; return j([k===1?'هزار':`${lt1k(k)} هزار`,r?lt1k(r):'']); }
  const m=Math.floor(n/1_000_000),r=n%1_000_000;
  return j([m===1?'یک میلیون':`${lt1k(m)} میلیون`,r?numberToFarsi(r):'']);
}

const TYPE_TO_CLUB_FIELD: Record<string, string> = {
  snooker:     'snookerTables',
  pocket:      'pocketTables',
  highball:    'highballTables',
  vip_snooker: 'vipSnookerTables',
  vip_pocket:  'vipPocketTables',
  air_hockey:  'airHockeyTables',
  playstation: 'playstations',
};

function toPersianDate(s: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(s));
  } catch { return s; }
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 900;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = url;
  });
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 20,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0EDE8', ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, color: GOLD,
      borderRight: `3px solid ${GOLD}`, paddingRight: 10, marginBottom: 16, marginTop: 8,
      ...style,
    }}>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', ltr = false, grouped = false,
  readOnly = false, hint, maxWidth }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; ltr?: boolean;
  /** جداکننده‌ی سه‌رقمی — برای مبلغ */
  grouped?: boolean;
  /** فیلدِ مشتق که کاربر حق تغییرش را ندارد (مثل نام مدیر) */
  readOnly?: boolean;
  /** توضیح کوتاه زیر فیلد — برای گفتنِ «چرا نمی‌توانم این را عوض کنم» */
  hint?: string;
  /** سقفِ عرض؛ برای فیلدهای کوتاه مثل شماره‌ی میز که کلِ ستون را لازم ندارند */
  maxWidth?: number;
}) {
  const box: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 12px',
    fontSize: 14, background: '#FAFAFA', color: DARK, outline: 'none',
    fontFamily: 'var(--font-base)',
  };

  /* فیلد عددی با ورودی فارسی جایگزین می‌شود: کاربر فارسی می‌بیند و
     فارسی هم می‌تواند تایپ کند، ولی آنچه بالا می‌رود همیشه لاتین است.
     `type="number"` بومی هیچ‌وقت ارقام فارسی نشان نمی‌داد. */
  if (type === 'number') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, maxWidth }}>
        <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</label>
        <FaNumberInput
          value={value} onChange={onChange} placeholder={placeholder}
          grouped={grouped} ariaLabel={label}
          style={{ ...box, textAlign: 'center' }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, maxWidth }}>
      <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder}
        dir={ltr ? 'ltr' : undefined} lang={ltr ? 'en' : undefined}
        readOnly={readOnly} aria-readonly={readOnly || undefined} tabIndex={readOnly ? -1 : undefined}
        onChange={e => { if (!readOnly) onChange(e.target.value); }}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 12px',
          fontSize: 14, color: readOnly ? '#6B7280' : DARK, outline: 'none',
          /* `readOnly` به‌جای `disabled`: مقدار همچنان خوانا و قابل کپی
             است و برخلاف disabled در فرم هم شرکت می‌کند؛ فقط قفل است. */
          background: readOnly ? '#F3F4F6' : '#FAFAFA',
          cursor: readOnly ? 'default' : undefined,
          fontFamily: ltr ? '"Courier New", Courier, monospace' : 'var(--font-base)',
          textAlign: ltr ? 'left' : undefined,
        }}
      />
      {hint && <span style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>{hint}</span>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</label>
      <Select
        value={value} ariaLabel={label}
        options={options.filter(o => !o.disabled).map(o => ({ value: o.value, label: o.label }))}
        onChange={onChange} />
    </div>
  );
}

/* تیکِ «بستن رزرو این میز».

   با `isActive` فرق دارد و همین تفاوت مهم است: `isActive=false` یعنی
   میز اصلاً وجود ندارد و از همه‌جای سیستم — از جمله گزارش‌ها و تعدادِ
   میزها — بیرون می‌رود. این‌جا میز سرِ جایش می‌ماند و فقط از صفحه‌ی
   رزروِ آنلاین برداشته می‌شود؛ برای میزی که در تعمیر است یا موقتاً
   حضوری اجاره داده شده. */
function ClosedToggle({ checked, onChange, compact = false }: {
  checked: boolean; onChange: (v: boolean) => void; compact?: boolean;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
      marginBottom: compact ? 14 : 16, padding: compact ? '10px 12px' : '12px 14px',
      borderRadius: 12, userSelect: 'none',
      background: checked ? 'rgba(220,38,38,0.06)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${checked ? 'rgba(220,38,38,0.28)' : 'rgba(0,0,0,0.08)'}`,
      transition: 'background .2s, border-color .2s',
    }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 17, height: 17, accentColor: '#DC2626', cursor: 'pointer', flexShrink: 0, marginTop: 1 }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: checked ? '#B91C1C' : DARK }}>
          بستن رزرو این میز
        </span>
        <span style={{ display: 'block', fontSize: 11.5, color: '#9CA3AF', lineHeight: 1.85, marginTop: 2 }}>
          {checked
            ? 'این میز در صفحه‌ی رزرو آنلاین نمایش داده نمی‌شود. رزروهای ثبت‌شده‌ی قبلی سر جای خود می‌مانند.'
            : 'اگر میز در تعمیر است یا موقتاً حضوری واگذار شده، این را تیک بزنید.'}
        </span>
      </span>
    </label>
  );
}

function SaveBtn({ onClick, loading, label = 'ذخیره تغییرات' }: {
  onClick: () => void; loading: boolean; label?: string;
}) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: 'rgba(199,166,106,0.14)', color: '#A07840',
      border: '1px solid rgba(199,166,106,0.42)', borderRadius: 20,
      padding: '10px 26px', fontSize: 14, fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.65 : 1,
      fontFamily: 'var(--font-base)', transition: 'all 0.15s',
    }}>
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
      {loading ? 'در حال ذخیره...' : label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type TabKey = 'dashboard' | 'info' | 'tables' | 'hours' | 'bookings' | 'finance' | 'live' | 'tournaments' | 'gallery' | 'coaches';

/* ردیف مسابقه در دیتابیس (snake_case) — جدول tournaments، مهاجرت ۰۲۶ */
interface DbTournament {
  id: string; club_id: string; title: string; description?: string | null;
  discipline?: string; max_players: number; entry_fee: number;
  prize?: string | null; venue?: string | null; city?: string | null;
  starts_at?: string | null; registration_ends_at?: string | null;
  status: string; seatsLeft?: number; match_format?: string | null;
}

/* برچسب فرمت مسابقه — همان فهرستی که دراپ‌داون ساخت نشان می‌دهد،
   تا کارت فهرست و فرم یک زبان داشته باشند. */
const FORMAT_LABELS: Record<string, string> = {
  bo3: 'Best Of ۳', bo5: 'Best Of ۵', bo7: 'Best Of ۷',
  bo9: 'Best Of ۹', bo11: 'Best Of ۱۱',
};

/* نگاشت وضعیت‌های سرور به همان چیزی که این صفحه از قبل می‌شناسد */
const T_STATUS: Record<string, Tournament['status']> = {
  draft: 'upcoming', published: 'upcoming',
  registration_open: 'registration_open',
  registration_closed: 'bracket_ready',
  ongoing: 'live',
  completed: 'finished', cancelled: 'finished',
};

/* `starts_at` یک timestamptz است. برای فرم باید دوباره به همان قالبی
   برگردد که `JalaliDatePicker` می‌فهمد («۱۴۰۵/۵/۱۵»)، وگرنه ویرایش یک
   مسابقه‌ی موجود تاریخش را خالی نشان می‌دهد.

   تفکیک اجزا در وقت تهران انجام می‌شود، نه UTC: مسابقه‌ی ساعت ۱ بامداد
   با `toISOString()` روز قبل خوانده می‌شد. */
function isoToTehranParts(iso: string): { jy: number; jm: number; jd: number; hh: string; mm: string } | null {
  try {
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tehran', calendar: 'gregory',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(iso)).reduce<Record<string, string>>((a, x) => (a[x.type] = x.value, a), {});
    const [jy, jm, jd] = toJalali(Number(p.year), Number(p.month), Number(p.day));
    return { jy, jm, jd, hh: (p.hour === '24' ? '00' : p.hour!), mm: p.minute! };
  } catch { return null; }
}

function fromDbTournament(r: DbTournament): Tournament {
  const parts = r.starts_at ? isoToTehranParts(r.starts_at) : null;
  const deadline = r.registration_ends_at ? isoToTehranParts(r.registration_ends_at) : null;
  return {
    id: r.id,
    clubId: r.club_id, clubName: r.venue ?? '',
    banner: '/images/clubs/club1.png',
    name: r.title, description: r.description ?? '',
    gameType: (r.discipline ?? 'snooker') as Tournament['gameType'],
    date: parts ? `${parts.jy}/${parts.jm}/${parts.jd}` : '',
    startTime: parts ? `${parts.hh}:${parts.mm}` : '',
    registrationDeadline: deadline ? `${deadline.jy}/${deadline.jm}/${deadline.jd}` : '',
    maxPlayers: (r.max_players as Tournament['maxPlayers']),
    entryFee: r.entry_fee,
    prizeInfo: r.prize ?? '', rules: '', matchFormat: r.match_format ?? '',
    paymentMethod: 'online',
    cardNumber: '', cardHolder: '', bankName: '',
    status: T_STATUS[r.status] ?? 'upcoming',
    /* ظرفیت پرشده از سرور می‌آید — شمارش محلی قابل اتکا نیست */
    registeredCount: Math.max(0, r.max_players - (r.seatsLeft ?? r.max_players)),
  } as Tournament;
}

export default function ClubDashboardPage() {
  const router = useRouter();
  const { user, _hydrated } = useAuthStore();

  /* نام مدیرِ باشگاه = نام و نام خانوادگیِ همان شخصی که موقع ثبت‌نام
     احراز هویت شده. این فیلد ویرایش‌پذیر نیست؛ اگر باشد، باشگاه می‌تواند
     زیر نام کسی معرفی شود که استعلام‌ها به نامش گرفته نشده. سرور هم
     مستقلاً همین مقدار را می‌نویسد (app/api/clubs/[id]/route.ts)، پس
     این‌جا فقط بازتابِ همان است، نه تنها خط دفاع. */
  const verifiedManagerName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  /* بدون این گارد، کاربر لاگین‌نشده برای همیشه در «در حال بارگذاری» می‌ماند */
  useEffect(() => {
    if (_hydrated && !user) router.push('/login');
  }, [_hydrated, user, router]);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsError, setBookingsError] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  /* بستن رزرو آنلاین: '' = باز | 'always' = همیشه بسته | عدد = بسته تا آن timestamp */
  const [reserveClosedUntil, setReserveClosedUntil] = useState<string>('');
  const [closureBusy, setClosureBusy] = useState(false);
  /* «رزرو امروز بسته» — برخلاف بالایی روی سرور ذخیره می‌شود */
  const [closeToday, setCloseToday] = useState(false);
  const [closeTodayBusy, setCloseTodayBusy] = useState(false);
  const [closeTodayMsg, setCloseTodayMsg] = useState<{ ok: boolean; text: string } | null>(null);
  /* شماره‌ی دریافت پیامک — می‌تواند با شماره‌ی مالک فرق کند */
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Tables
  const [tables, setTables] = useState<Table[]>([]);
  const [showTableForm, setShowTableForm] = useState(false);
  /* surchargeFrom/Percent خالی ⇒ «از باشگاه ارث ببر» */
  const [tableForm, setTableForm] = useState({ number: '', type: 'snooker', brand: '', model: '', pricePerHour: '', surchargeFrom: '', surchargePercent: '', reservationClosed: false });
  const [tableLoading, setTableLoading] = useState(false);
  const [tableFormError, setTableFormError] = useState('');
  const [tablesSaving, setTablesSaving] = useState(false);
  const [tablesError, setTablesError] = useState('');
  /* هزینه‌ی بازیکن اضافه — تنظیم باشگاه */
  const [surcharge, setSurcharge] = useState({ enabled: true, percent: '15', from: '2' });
  const [surchargeSaving, setSurchargeSaving] = useState(false);
  const [surchargeSaved, setSurchargeSaved] = useState(false);
  const [surchargeError, setSurchargeError] = useState('');
  /* استعلام شبا از شماره کارت */
  const [ibanBusy, setIbanBusy] = useState(false);
  const [ibanMsg, setIbanMsg] = useState<{ ok: boolean; text: string } | null>(null);
  /* حسابِ تأییدشده قفل است: دکمه‌های استعلام خاموش و فیلدها فقط‌خواندنی.
     تا امروز دکمه بعد از استعلامِ موفق هم روشن می‌ماند و کاربر می‌توانست
     بی‌نهایت بار استعلام بگیرد — هر بار یک واحد از اعتبارِ سرویس. */
  const [ibanVerified, setIbanVerified] = useState(false);
  /* راهِ خروج از قفل. بدون این، کسی که حسابش عوض شده گیر می‌افتاد. */
  const [bankEditing, setBankEditing] = useState(false);
  const bankLocked = ibanVerified && !bankEditing;

  /* استعلام کد پستی */
  const [postalBusy, setPostalBusy] = useState(false);
  const [postalMsg, setPostalMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /* موقعیت مکانی — مبنای «نزدیک‌ترین باشگاه» در فهرست باشگاه‌ها.
     تا امروز فقط در فرمِ ثبتِ اولیه قابل تعیین بود؛ باشگاهی که آن‌جا
     رد می‌کرد، برای همیشه مختصاتِ ۰٬۰ می‌ماند و در مرتب‌سازی بر اساس
     فاصله اصلاً دیده نمی‌شد. */
  const [geo, setGeo] = useState<{ lat: number; lon: number } | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoMsg, setGeoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /* آپلود مدرک جواز کسب */
  const [licUploading, setLicUploading] = useState(false);
  const [licDocName, setLicDocName] = useState('');
  const [licDocMsg, setLicDocMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [needsIdentity, setNeedsIdentity] = useState(false);
  /* استعلام جواز کسب */
  const [licBusy, setLicBusy] = useState(false);
  const [licMsg, setLicMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tablePhotoDataUrl, setTablePhotoDataUrl] = useState('');
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    number: '', type: 'snooker', brand: '', model: '', pricePerHour: '', photoDataUrl: '',
    /* هزینه‌ی بازیکن اضافه در فرمِ *افزودن* بود ولی در فرمِ *ویرایش* نبود،
       یعنی باشگاه‌دار پس از ثبتِ میز راهی برای اصلاحش نداشت. */
    surchargeFrom: '', surchargePercent: '',
    reservationClosed: false,
  });
  const [editDiscounts, setEditDiscounts] = useState<DiscountRule[]>([]);
  const [editDiscountForm, setEditDiscountForm] = useState({ startTime: '08:00', endTime: '12:00', percent: '20', label: '' });

  // Club info
  const [clubInfo, setClubInfo] = useState({
    name: '', managerName: '', description: '', address: '', province: '', city: '',
    /* «کشور» از فرم برداشته شد — همه ایران‌اند. جایش کد پستی آمد که
       آدرس و مختصات را از استعلام می‌آورد. */
    postalCode: '', addressNote: '', phone: '', website: '', timezone: 'Asia/Tehran',
    snookerTables: '0', pocketTables: '0', highballTables: '0',
    vipSnookerTables: '0', vipPocketTables: '0', airHockeyTables: '0',
    dartBoards: '0', playstations: '0',
    hasCafe: false, hasParking: false, hasWifi: false, hasProfessionalCoach: false,
    specialFeatures: '',
    bankCard: '', bankCardOwner: '', bankName: '', iban: '', licenseNumber: '',
  });
  const [infoSaving, setInfoSaving] = useState(false);

  // Stats
  const [clubStats, setClubStats] = useState<ClubStats>(DEFAULT_STATS);
  const [statsSaving, setStatsSaving] = useState(false);
  /* اعضا و مسابقات شمرده می‌شوند، نه تایپ — از /api/clubs/:id/stats.
     `null` یعنی هنوز نیامده، که با صفر فرق دارد: نباید لحظه‌ای «۰ عضو»
     نشان بدهیم و بعد عدد واقعی بپرد. */
  const [liveStats, setLiveStats] = useState<{ members: number; tournaments: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Working hours
  const [hoursForm, setHoursForm] = useState<WorkingHours>(DEFAULT_HOURS);
  const [hoursSaving, setHoursSaving] = useState(false);

  // Tournaments
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [tournamentTab, setTournamentTab] = useState<'list' | 'create'>('list');
  const [tForm, setTForm] = useState({
    name: '', description: '', gameType: 'snooker' as GameType,
    date: '', startTime: '', registrationDeadline: '',
    maxPlayers: '16', entryFee: '', prizeInfo: '', rules: '', matchFormat: 'bo5',
    paymentMethod: 'card_transfer' as 'online' | 'card_transfer',
    cardNumber: '', cardHolder: '', bankName: '',
  });
  const [tLoading, setTLoading] = useState(false);

  // Gallery
  const [albums, setAlbums] = useState<ClubAlbum[]>([]);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const [uploadingAlbum, setUploadingAlbum] = useState<string | null>(null);
  const [singlePhotos, setSinglePhotos] = useState<{ id: string; dataUrl: string; name: string }[]>([]);
  const [uploadingSingle, setUploadingSingle] = useState(false);

  // Time discounts
  // DiscountRule defined at top level — see below component
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [discountForm, setDiscountForm] = useState({ startTime: '08:00', endTime: '12:00', percent: '20', label: '' });

  // Logo & Story
  const [storyDraft, setStoryDraft] = useState<{ file: File; previewUrl: string; text: string } | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [storyUploading, setStoryUploading] = useState(false);
  const [storyList, setStoryList] = useState<ClubStory[]>([]);
  const [storyTextColor, setStoryTextColor] = useState('#ffffff');
  const [storyTextSize, setStoryTextSize] = useState(15);
  const [storyTextBold, setStoryTextBold] = useState(false);
  const [storyTextAlign, setStoryTextAlign] = useState<'right'|'center'|'left'>('center');
  const [storyTextPos, setStoryTextPos] = useState<'top'|'center'|'bottom'>('bottom');

  // Coaches
  const [coaches, setCoaches] = useState<CoachEntry[]>([]);
  const [showCoachPicker, setShowCoachPicker] = useState(false);
  const [availableCoaches, setAvailableCoaches] = useState<ApiCoach[]>([]);
  const [coachSearch, setCoachSearch] = useState('');
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  // ── LocalStorage helpers ───────────────────────────────────────────────────

  const lsKey = useCallback((type: string) =>
    `club-${type}-${selectedClub?.id ?? 'none'}`, [selectedClub]);

  const saveAlbums = useCallback((next: ClubAlbum[]) => {
    setAlbums(next);
    try { localStorage.setItem(lsKey('albums'), JSON.stringify(next)); } catch {}
  }, [lsKey]);

  const saveCoaches = useCallback((next: CoachEntry[]) => {
    setCoaches(next);
    try { localStorage.setItem(lsKey('coaches'), JSON.stringify(next)); } catch {}
  }, [lsKey]);

  const savePhotos = useCallback((next: { id: string; dataUrl: string; name: string }[]) => {
    setSinglePhotos(next);
    try { localStorage.setItem(lsKey('photos'), JSON.stringify(next)); } catch {}
  }, [lsKey]);

  /* میزها روی سرور ذخیره می‌شوند (نه فقط در مرورگر) تا صفحه‌ی رزرو
     دقیقاً همین‌ها را ببیند. state خوش‌بینانه به‌روز می‌شود و بعد با
     ردیف‌های واقعی سرور (که شناسه‌ی دائمی دارند) جایگزین می‌گردد. */
  const saveTables = useCallback(async (next: Table[]) => {
    setTables(next);
    if (!selectedClub) return;
    setTablesSaving(true);
    try {
      const r = await api.post(`/clubs/${selectedClub.id}/tables/sync`, { tables: next });
      if (Array.isArray(r.data?.tables)) setTables(r.data.tables as Table[]);
      setTablesError('');
      try { localStorage.removeItem(lsKey('tables')); } catch {}
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setTablesError(msg || 'ذخیره‌ی میزها روی سرور انجام نشد؛ دوباره تلاش کنید.');
      try { localStorage.setItem(lsKey('tables'), JSON.stringify(next)); } catch {}
    } finally { setTablesSaving(false); }
  }, [lsKey, selectedClub]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    const isAdmin = user.primaryRole === 'admin';
    const endpoint = isAdmin ? '/clubs' : '/clubs/my-clubs';
    api.get(endpoint).then(res => {
      const list: Club[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setClubs(list);
      if (list.length > 0) setSelectedClub(list[0] as Club);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selectedClub) return;

    // Fetch full club data to populate all info fields
    api.get(`/clubs/${selectedClub.id}`).then(r => {
      const c = r.data;
      setClubInfo({
        name: c.name ?? '',
        /* نامِ احرازشده بر مقدار ذخیره‌شده اولویت دارد تا state با آنچه
           نشان می‌دهیم و آنچه سرور می‌نویسد یکی بماند — وگرنه رکوردهای
           قدیمی که نامِ دستی داشتند تا اولین ذخیره ناهمخوان می‌مانند. */
        managerName: verifiedManagerName || (c.managerName ?? ''),
        description: c.description ?? '',
        address: c.address ?? '',
        province: c.province ?? provinceOfCity(c.city ?? ''),   // بک‌فیل استان از شهر برای باشگاه‌های قدیمی
        city: c.city ?? '',
        postalCode: c.postalCode ?? '',
        addressNote: c.addressNote ?? '',
        phone: c.phone ?? '',
        website: c.website ?? '',
        timezone: c.timezone ?? 'Asia/Tehran',
        snookerTables: String(c.snookerTables ?? 0),
        pocketTables: String(c.pocketTables ?? 0),
        highballTables: String(c.highballTables ?? 0),
        vipSnookerTables: String(c.vipSnookerTables ?? 0),
        vipPocketTables: String(c.vipPocketTables ?? 0),
        airHockeyTables: String(c.airHockeyTables ?? 0),
        dartBoards: String(c.dartBoards ?? 0),
        playstations: String(c.playstations ?? 0),
        hasCafe: c.hasCafe ?? false,
        hasParking: c.hasParking ?? false,
        hasWifi: c.hasWifi ?? false,
        hasProfessionalCoach: c.hasProfessionalCoach ?? false,
        specialFeatures: c.specialFeatures ?? '',
        bankCard: c.bankCard ?? '',
        bankCardOwner: c.bankCardOwner ?? '',
        bankName: c.bankName ?? '',
        iban: c.iban ?? '',
        licenseNumber: c.licenseNumber ?? '',
      });
      setIbanVerified(!!c.ibanVerified);
      /* مختصات؛ صفر یعنی ثبت‌نشده، نه «جزیره‌ی صفر درجه» */
      setGeo(Number(c.latitude) && Number(c.longitude) ? { lat: Number(c.latitude), lon: Number(c.longitude) } : null);
      setGeoMsg(null);
      setBankEditing(false);
      setLicDocName(c.licenseDocumentUrl ? 'مدرک بارگذاری‌شده' : '');
      setLicDocMsg(null);
      setPostalMsg(null);
      if (c.workingHours) setHoursForm(c.workingHours);
      setSurcharge({
        enabled: c.playerSurchargeEnabled === undefined ? true : !!c.playerSurchargeEnabled,
        percent: String(c.playerSurchargePercent ?? 15),
        from: String(c.playerSurchargeFrom ?? 2),
      });
    }).catch(() => {});

    // Load localStorage data
    try {
      const s = localStorage.getItem(`club-stats-${selectedClub.id}`);
      if (s) setClubStats(JSON.parse(s));
      else setClubStats(DEFAULT_STATS);
    } catch { setClubStats(DEFAULT_STATS); }

    /* آمار شمردنی از سرور. شکستش کارت را خالی نمی‌کند — `null` می‌ماند
       و به‌جای عدد، خط تیره نشان داده می‌شود. */
    setLiveStats(null);
    void apiFetch(`/api/clubs/${selectedClub.id}/stats`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j) setLiveStats({ members: Number(j.members) || 0, tournaments: Number(j.tournaments) || 0 }); })
      .catch(() => { /* بی‌صدا */ });

    try {
      const a = localStorage.getItem(`club-albums-${selectedClub.id}`);
      if (a) setAlbums(JSON.parse(a));
      else setAlbums([]);
    } catch { setAlbums([]); }

    try {
      const c = localStorage.getItem(`club-coaches-${selectedClub.id}`);
      if (c) setCoaches(JSON.parse(c));
      else setCoaches([]);
    } catch { setCoaches([]); }

    try {
      const p = localStorage.getItem(`club-photos-${selectedClub.id}`);
      if (p) setSinglePhotos(JSON.parse(p));
      else setSinglePhotos([]);
    } catch { setSinglePhotos([]); }

    // Load stories list
    fetch(`/api/clubs/${selectedClub.id}/stories`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setStoryList(data); })
      .catch(() => setStoryList([]));

    /* میزها از دیتابیس می‌آیند — همان منبعی که صفحه‌ی رزرو می‌خواند.
       میزهای قدیمی داخل مرورگر (id با local-) یک‌بار به سرور منتقل می‌شوند
       تا میزی که کاربر می‌بیند دقیقاً همان چیزی باشد که قابل رزرو است. */
    (async () => {
      let legacy: Table[] = [];
      try {
        const t = localStorage.getItem(`club-tables-${selectedClub.id}`);
        if (t) legacy = (JSON.parse(t) as Table[]).filter(r => String(r.id).startsWith('local-'));
      } catch { /* ignore */ }

      try {
        /* `all=1` — داشبورد باید میزهای بسته را هم ببیند تا بتواند
           بازشان کند؛ صفحه‌ی رزرو همان مسیر را بدونِ این پرچم می‌خواند
           و فقط میزهای قابلِ رزرو می‌گیرد. */
        const r = await api.get(`/clubs/${selectedClub.id}/tables?all=1`);
        const rows: Table[] = Array.isArray(r.data) ? r.data : [];
        if (rows.length > 0) { setTables(rows); localStorage.removeItem(`club-tables-${selectedClub.id}`); return; }
        if (legacy.length > 0) {
          const s = await api.post(`/clubs/${selectedClub.id}/tables/sync`, { tables: legacy });
          const synced: Table[] = Array.isArray(s.data?.tables) ? s.data.tables : [];
          setTables(synced);
          localStorage.removeItem(`club-tables-${selectedClub.id}`);
          return;
        }
        setTables([]);
      } catch { setTables(legacy); }
    })();

    /* وضعیت بستن رزرو آنلاین — منبعِ حقیقت سرور است (پایین‌تر، همراهِ
       بقیه‌ی تنظیمات خوانده می‌شود). این‌جا فقط تا رسیدنِ پاسخ خالی
       می‌شود تا مقدارِ باشگاهِ قبلی روی این یکی نماند. */
    setReserveClosedUntil('');

    // «رزرو امروز بسته» از سرور می‌آید، نه از این مرورگر
    void apiFetch(`/api/clubs/${selectedClub.id}/settings`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j) return;
        setCloseToday(!!j.closeTodayReservations);
        setNotifyPhone(String(j.notifyPhone ?? ''));
      })
      .catch(() => { /* بی‌صدا */ });

    /* مسابقات از سرور می‌آیند. کش محلی به‌عنوان نمایش اولیه می‌ماند
       تا صفحه لحظه‌ی اول خالی نباشد، ولی بلافاصله با دادهٔ سرور
       جایگزین می‌شود — پیش‌تر تنها منبع همین localStorage بود، یعنی
       مسابقه‌ای که روی یک دستگاه ساخته می‌شد جای دیگر وجود نداشت. */
    try {
      const t = localStorage.getItem(`club-tournaments-${selectedClub.id}`);
      setMyTournaments(t ? JSON.parse(t) : []);
    } catch { setMyTournaments([]); }
    void loadTournaments(selectedClub.id);

    /* `catch` خالی بود و همین باعث شد یک ۴۰۴ ماه‌ها پنهان بماند: مسیر
       اصلاً وجود نداشت، تب همیشه خالی می‌ماند و هیچ نشانه‌ای از خطا
       دیده نمی‌شد. حالا دست‌کم در کنسول ثبت می‌شود. */
    setBookingsError('');
    api.get(`/bookings/club/${selectedClub.id}`)
      .then(r => setBookings(Array.isArray(r.data) ? r.data : []))
      .catch((e: unknown) => {
        console.error('[dashboard/club] دریافت رزروها ناموفق:', e);
        setBookings([]);
        setBookingsError('دریافت رزروها انجام نشد؛ صفحه را تازه کنید.');
      });
  }, [selectedClub, verifiedManagerName]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
    } catch {}
  };

  const addTable = () => {
    if (!selectedClub) return;
    setTableFormError('');

    if (tableForm.type === 'playstation') {
      setTableFormError('رزرو پلی‌استیشن هنوز فعال نشده است');
      return;
    }

    const fieldKey = TYPE_TO_CLUB_FIELD[tableForm.type];
    const capacity = fieldKey ? parseInt((clubInfo as any)[fieldKey] ?? '0', 10) : 0;
    const existing = tables.filter(t => t.type === tableForm.type).length;
    const typeLabel = TABLE_TYPE_LABELS[tableForm.type] || tableForm.type;

    if (capacity === 0) {
      setTableFormError(`شما هیچ میز ${typeLabel} در اطلاعات باشگاه تعریف نکرده‌اید. ابتدا در تب «اطلاعات» تعداد میزها را وارد کنید`);
      return;
    }
    if (existing >= capacity) {
      setTableFormError(`ظرفیت میزهای ${typeLabel} پر شده است (${existing} از ${capacity} میز)`);
      return;
    }

    const newTable: Table = {
      id: `local-${Date.now()}`,
      number: parseInt(tableForm.number) || existing + 1,
      name: '',
      type: tableForm.type,
      brand: tableForm.brand,
      model: tableForm.model,
      pricePerHour: parseFloat(tableForm.pricePerHour.replace(/,/g, '')) || 0,
      isActive: true,
      photoDataUrl: tablePhotoDataUrl || undefined,
      discountRules: discounts.length > 0 ? discounts : undefined,
      /* خالی ⇒ undefined ⇒ در دیتابیس NULL ⇒ «از باشگاه ارث ببر» */
      playerSurchargeFrom: tableForm.surchargeFrom ? parseInt(tableForm.surchargeFrom, 10) : undefined,
      playerSurchargePercent: tableForm.surchargePercent ? parseInt(tableForm.surchargePercent, 10) : undefined,
      playerSurchargeEnabled: (tableForm.surchargeFrom || tableForm.surchargePercent) ? true : undefined,
      reservationClosed: tableForm.reservationClosed,
    };
    saveTables([...tables, newTable]);
    setShowTableForm(false);
    setTableFormError('');
    setTablePhotoDataUrl('');
    setDiscounts([]);
    setDiscountForm({ startTime: '08:00', endTime: '12:00', percent: '20', label: '' });
    setTableForm({ number: '', type: 'snooker', brand: '', model: '', pricePerHour: '', surchargeFrom: '', surchargePercent: '', reservationClosed: false });
  };

  const deleteTable = (id: string) => {
    saveTables(tables.filter(t => t.id !== id));
  };

  const startEditTable = (t: Table) => {
    setEditingTableId(t.id);
    setEditForm({
      number: String(t.number),
      type: t.type,
      brand: t.brand,
      model: t.model,
      pricePerHour: String(t.pricePerHour),
      photoDataUrl: t.photoDataUrl || '',
      /* undefined یعنی «از تنظیم باشگاه پیروی کن» و باید خالی بماند،
         نه اینکه به صفر تبدیل شود — صفر یعنی «رایگان برای همه». */
      surchargeFrom: t.playerSurchargeFrom == null ? '' : String(t.playerSurchargeFrom),
      surchargePercent: t.playerSurchargePercent == null ? '' : String(t.playerSurchargePercent),
      reservationClosed: !!t.reservationClosed,
    });
    setEditDiscounts(t.discountRules ? [...t.discountRules] : []);
    setEditDiscountForm({ startTime: '08:00', endTime: '12:00', percent: '20', label: '' });
  };

  const addEditDiscount = () => {
    const pct = parseInt(editDiscountForm.percent);
    if (!editDiscountForm.startTime || !editDiscountForm.endTime || !pct) return;
    const rule: DiscountRule = {
      id: `d-${Date.now()}`,
      startTime: editDiscountForm.startTime,
      endTime: editDiscountForm.endTime,
      percent: pct,
      label: editDiscountForm.label || `${editDiscountForm.startTime}–${editDiscountForm.endTime}`,
    };
    setEditDiscounts(prev => [...prev, rule]);
    setEditDiscountForm({ startTime: '08:00', endTime: '12:00', percent: '20', label: '' });
  };

  const removeEditDiscount = (id: string) => setEditDiscounts(prev => prev.filter(d => d.id !== id));

  const saveEditTable = () => {
    if (!editingTableId) return;
    saveTables(tables.map(t => t.id === editingTableId ? {
      ...t,
      number: parseInt(editForm.number) || t.number,
      type: editForm.type,
      brand: editForm.brand,
      model: editForm.model,
      pricePerHour: parseFloat(editForm.pricePerHour.replace(/,/g, '')) || 0,
      photoDataUrl: editForm.photoDataUrl || undefined,
      discountRules: editDiscounts.length > 0 ? editDiscounts : undefined,
      /* خالی ⇒ undefined، تا میز دوباره از تنظیم باشگاه ارث ببرد.
         این‌طور باشگاه‌دار می‌تواند یک استثنا را هم پس بگیرد. */
      playerSurchargeFrom: editForm.surchargeFrom ? parseInt(editForm.surchargeFrom, 10) : undefined,
      playerSurchargePercent: editForm.surchargePercent ? parseInt(editForm.surchargePercent, 10) : undefined,
      playerSurchargeEnabled: (editForm.surchargeFrom || editForm.surchargePercent) ? true : undefined,
      reservationClosed: editForm.reservationClosed,
    } : t));
    setEditingTableId(null);
  };

  const saveInfo = async () => {
    if (!selectedClub) return;
    setInfoSaving(true);
    try {
      /* نام بانک مشتق است و در state نمی‌نشیند؛ موقع ذخیره از روی شبا
         حساب و فرستاده می‌شود تا صفحه‌ی عمومی هم آن را داشته باشد.
         آدرس عمداً فرستاده نمی‌شود وقتی از استعلام آمده — سرور خودش
         آن را نوشته و بازفرستادنش فقط راه را برای دست‌کاری باز می‌کند. */
      await api.put(`/clubs/${selectedClub.id}`, {
        ...clubInfo,
        bankName: derivedBankName || clubInfo.bankName,
      });
    } catch { /* پیام در UI با وضعیت دکمه دیده می‌شود */ }
    finally { setInfoSaving(false); }
  };

  /* شماره کارت ⇒ شبا. نام دارنده‌ی حساب سمت سرور با هویت احرازشده‌ی
     صاحب باشگاه مقایسه می‌شود؛ فقط در صورت تطابق، شبا «تأییدشده» می‌شود. */
  const fetchIban = async () => {
    if (!selectedClub || !isValidCard(clubInfo.bankCard)) return;
    setIbanBusy(true); setIbanMsg(null);
    try {
      const r = await apiFetch('/api/bank/card-to-iban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: clubInfo.bankCard, clubId: selectedClub.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (j?.needsIdentity) { setNeedsIdentity(true); setIbanMsg({ ok: false, text: j.message }); return; }
      if (!r.ok || !j?.iban) { setIbanMsg({ ok: false, text: j?.message || 'استعلام انجام نشد' }); return; }
      setClubInfo(p => ({
        ...p, iban: j.iban,
        bankName: j.bankName || p.bankName,
        bankCardOwner: j.ownerName || p.bankCardOwner,
      }));
      setIbanMsg({ ok: true, text: `تأیید شد — حساب به نام «${j.ownerName ?? '—'}» و متعلق به کد ملی شماست` });
      /* از این لحظه فیلدها و دکمه‌ها قفل می‌شوند */
      setIbanVerified(true); setBankEditing(false);
    } catch {
      setIbanMsg({ ok: false, text: 'خطا در ارتباط با سرور' });
    } finally { setIbanBusy(false); }
  };

  /* ثبت مستقیم شبا — برای کسی که شماره کارت نمی‌دهد */
  const verifyIban = async () => {
    if (!selectedClub || !isValidIban(clubInfo.iban)) return;
    setIbanBusy(true); setIbanMsg(null);
    try {
      const r = await apiFetch('/api/bank/verify-iban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iban: clubInfo.iban, clubId: selectedClub.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (j?.needsIdentity) { setNeedsIdentity(true); setIbanMsg({ ok: false, text: j.message }); return; }
      if (!r.ok) { setIbanMsg({ ok: false, text: j?.message || 'استعلام انجام نشد' }); return; }
      if (j.bankName) setClubInfo(p => ({ ...p, bankName: j.bankName }));
      setIbanMsg({ ok: true, text: 'شبا تأیید شد و متعلق به کد ملی شماست' });
      setIbanVerified(true); setBankEditing(false);
    } catch {
      setIbanMsg({ ok: false, text: 'خطا در ارتباط با سرور' });
    } finally { setIbanBusy(false); }
  };

  /* بازکردنِ قفلِ حساب برای تغییر. تأیید همین‌جا هم برداشته می‌شود تا
     تیکِ سبز روی حسابی که دیگر همان حساب نیست نماند؛ سرور هم مستقل
     همین کار را موقع ذخیره انجام می‌دهد. */
  const unlockBank = () => {
    if (!window.confirm('برای تغییر حساب، تأیید فعلی باطل می‌شود و باید دوباره استعلام بگیرید. ادامه می‌دهید؟')) return;
    setBankEditing(true);
    setIbanMsg({ ok: false, text: 'تأیید باطل شد — پس از تغییر، دوباره استعلام بگیرید.' });
  };

  /* استعلام کد پستی ⇒ آدرس. آدرس و مختصات را خودِ سرور روی باشگاه
     می‌نویسد؛ این‌جا فقط بازتابش می‌دهیم تا کاربر ببیند چه ثبت شد. */
  const fetchAddress = async () => {
    if (!selectedClub || !/^\d{10}$/.test(clubInfo.postalCode)) return;
    setPostalBusy(true); setPostalMsg(null);
    try {
      const r = await apiFetch('/api/address/postal-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode: clubInfo.postalCode, clubId: selectedClub.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setPostalMsg({ ok: false, text: j?.message || 'استعلام انجام نشد' }); return; }
      setClubInfo(p => ({
        ...p,
        address: j.address || p.address,
        /* `geo` نسخه‌ی تطبیق‌داده‌شده با فهرست رسمی است، نه خروجی خام
           سرویس — وگرنه ProvinceCitySelect نام را پیدا نمی‌کرد. */
        province: j.geo?.province || p.province,
        city: j.geo?.city || p.city,
      }));
      setPostalMsg({
        ok: true,
        text: j.postalCodeStored === false
          ? 'آدرس یافت شد و ثبت شد (کد پستی پس از اجرای مهاجرت ذخیره می‌شود)'
          : 'آدرس از کد پستی خوانده و ثبت شد',
      });
    } catch {
      setPostalMsg({ ok: false, text: 'خطا در ارتباط با سرور' });
    } finally { setPostalBusy(false); }
  };

  /* ثبتِ موقعیتِ مکانی از دستگاهِ خودِ باشگاه‌دار.

     دو راه برای پرکردنِ مختصات هست و هر دو لازم‌اند: استعلامِ کد پستی
     (دقیق ولی به مرکزِ پلاکِ پستی) و همین دکمه (وقتی باشگاه‌دار داخلِ
     باشگاه ایستاده). بدونِ مختصات، باشگاه در مرتب‌سازی «نزدیک‌ترین»
     اصلاً دیده نمی‌شود. */
  const saveLocation = async () => {
    if (!selectedClub) return;
    if (!navigator.geolocation) {
      setGeoMsg({ ok: false, text: 'مرورگر شما موقعیت مکانی را پشتیبانی نمی‌کند' });
      return;
    }
    setGeoBusy(true); setGeoMsg(null);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy ?? 0);

        /* «هرکدام دقیق‌تر بود» — و دقت را خودِ مرورگر گزارش می‌کند.
           GPS داخلِ باشگاه چند ده متر خطا دارد و از مرکزِ بلوکِ پستی
           بهتر است؛ ولی روی دسکتاپِ وای‌فای همان GPS می‌تواند چند
           کیلومتر خطا داشته باشد و آن‌وقت *بدتر* از کد پستی است.
           پس مقدارِ بی‌دقت اصلاً ذخیره نمی‌شود. */
        if (acc > 150) {
          setGeoBusy(false);
          setGeoMsg({
            ok: false,
            text: `دقت موقعیت پایین است (±${faDigit(String(acc))} متر) و ذخیره نشد. از تلفن همراه و داخل باشگاه دوباره تلاش کنید — یا از استعلام کد پستی استفاده کنید.`,
          });
          return;
        }

        try {
          await api.put(`/clubs/${selectedClub.id}`, { latitude: lat, longitude: lon });
          setGeo({ lat, lon });
          setGeoMsg({
            ok: true,
            text: `موقعیت باشگاه با دقت ±${faDigit(String(acc))} متر ثبت شد — حالا در «نزدیک‌ترین باشگاه‌ها» دیده می‌شوید`,
          });
        } catch {
          setGeoMsg({ ok: false, text: 'ذخیره‌ی موقعیت انجام نشد' });
        } finally { setGeoBusy(false); }
      },
      err => {
        setGeoBusy(false);
        setGeoMsg({
          ok: false,
          text: err.code === err.PERMISSION_DENIED
            ? 'دسترسی به موقعیت مکانی رد شد — از تنظیمات مرورگر اجازه بدهید'
            : 'دریافت موقعیت ممکن نشد؛ دوباره تلاش کنید',
        });
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  /* آپلود مدرک جواز کسب. مدرک به باکتِ خصوصی می‌رود و مسیرش — نه یک
     لینک عمومی — روی باشگاه ذخیره می‌شود. */
  const uploadLicenseDoc = async (file: File) => {
    if (!selectedClub) return;
    setLicUploading(true); setLicDocMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('path', `documents/clubs/${selectedClub.id}/license-${Date.now()}`);
      const r = await apiFetch('/api/upload', { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !(j?.path || j?.url)) {
        setLicDocMsg({ ok: false, text: j?.message || 'آپلود انجام نشد' });
        return;
      }
      await api.put(`/clubs/${selectedClub.id}`, { licenseDocumentUrl: j.path || j.url });
      setLicDocName(file.name);
      setLicDocMsg({ ok: true, text: 'مدرک بارگذاری شد و برای بررسی ادمین ثبت گردید' });
    } catch {
      setLicDocMsg({ ok: false, text: 'خطا در ارتباط با سرور' });
    } finally { setLicUploading(false); }
  };

  /* دیدنِ مدرکِ بارگذاری‌شده — لینکِ امضاشده‌ی کوتاه‌عمر از سرور */
  const openLicenseDoc = async () => {
    if (!selectedClub) return;
    try {
      const r = await apiFetch(`/api/clubs/${selectedClub.id}/license-doc`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.url) { setLicDocMsg({ ok: false, text: j?.message || 'مدرک در دسترس نیست' }); return; }
      window.open(j.url, '_blank', 'noopener,noreferrer');
    } catch {
      setLicDocMsg({ ok: false, text: 'خطا در ارتباط با سرور' });
    }
  };

  /* استعلام جواز کسب. کد ملی داخل جواز باید با کد ملی احرازشده‌ی
     مالک یکی باشد، وگرنه تیک تأیید صادر نمی‌شود. */
  const verifyLicense = async () => {
    if (!selectedClub || !clubInfo.licenseNumber.trim()) return;
    setLicBusy(true); setLicMsg(null);
    try {
      const r = await apiFetch(`/api/clubs/${selectedClub.id}/verify-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCode: clubInfo.licenseNumber.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (j?.needsIdentity) { setNeedsIdentity(true); setLicMsg({ ok: false, text: j.message }); return; }
      if (!r.ok) { setLicMsg({ ok: false, text: j?.message || 'استعلام انجام نشد' }); return; }
      setLicMsg({
        ok: true,
        text: `تأیید شد — «${j.data?.title ?? 'جواز کسب'}» تا ${j.data?.expireDate ?? '—'} معتبر است`,
      });
    } catch {
      setLicMsg({ ok: false, text: 'خطا در ارتباط با سرور' });
    } finally { setLicBusy(false); }
  };

  /* ذخیره‌ی تنظیم هزینه‌ی بازیکن اضافه — همین مقدار ملاک محاسبه‌ی سروری است */
  const saveSurcharge = async () => {
    if (!selectedClub) return;
    setSurchargeSaving(true); setSurchargeSaved(false);
    try {
      await api.put(`/clubs/${selectedClub.id}`, {
        playerSurchargeEnabled: surcharge.enabled,
        playerSurchargePercent: Math.max(0, Math.min(100, parseInt(surcharge.percent, 10) || 0)),
        playerSurchargeFrom:    Math.max(1, Math.min(12,  parseInt(surcharge.from, 10) || 2)),
      });
      setSurchargeSaved(true); setSurchargeError('');
      setTimeout(() => setSurchargeSaved(false), 2500);
    } catch (e: unknown) {
      const raw = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      setSurchargeError(/column|does not exist|schema cache/i.test(raw)
        ? 'این تنظیم هنوز در دیتابیس ساخته نشده است (مایگریشن ۰۰۳ اجرا نشده).'
        : raw || 'ذخیره‌ی تنظیمات انجام نشد؛ دوباره تلاش کنید.');
    }
    finally { setSurchargeSaving(false); }
  };

  const saveStats = () => {
    if (!selectedClub) return;
    setStatsSaving(true);
    try {
      localStorage.setItem(`club-stats-${selectedClub.id}`, JSON.stringify(clubStats));
    } catch {}
    setTimeout(() => setStatsSaving(false), 500);
  };

  const deleteClub = async () => {
    if (!selectedClub) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/clubs/${selectedClub.id}`);
      ['stats', 'albums', 'coaches'].forEach(t => {
        try { localStorage.removeItem(`club-${t}-${selectedClub.id}`); } catch {}
      });
      const remaining = clubs.filter(c => c.id !== selectedClub.id);
      setClubs(remaining);
      setSelectedClub(remaining.length > 0 ? (remaining[0] as Club) : null);
      setDeleteConfirm(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'خطا در حذف باشگاه';
      alert(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const saveHours = async () => {
    if (!selectedClub) return;
    setHoursSaving(true);
    try { await api.put(`/clubs/${selectedClub.id}/hours`, hoursForm); } catch {}
    finally { setHoursSaving(false); }
  };

  /* بارگذاری مسابقات از سرور — منبع حقیقت دیگر localStorage نیست.
     مسابقه‌های محلی قدیمی (شناسه‌ی `t_…`) تا وقتی هستند نمایش داده
     می‌شوند ولی چیز تازه‌ای آن‌جا نوشته نمی‌شود. */
  const loadTournaments = useCallback(async (clubId: string) => {
    try {
      const r = await apiFetch(`/api/tournaments?mine=1&clubId=${clubId}`, { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json().catch(() => null) as { tournaments?: DbTournament[] } | null;
      const rows = j?.tournaments ?? [];
      setMyTournaments(rows.map(fromDbTournament));
    } catch { /* کش محلی می‌ماند */ }
  }, []);

  const deleteTournament = async (id: string) => {
    /* مسابقه‌ی سرور فقط لغو می‌شود، نه حذف — سابقه‌ی مالی و ثبت‌نام‌ها
       باید بماند. رکورد محلی قدیمی همان‌جا پاک می‌شود. */
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      try {
        await apiFetch(`/api/tournaments/${id}/status`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        });
      } catch { /* بی‌صدا */ }
      if (selectedClub) await loadTournaments(selectedClub.id);
      return;
    }
    setMyTournaments(ts => {
      const next = ts.filter(t => t.id !== id);
      try { localStorage.setItem(lsKey('tournaments'), JSON.stringify(next)); } catch {}
      return next;
    });
  };

  /* `JalaliDatePicker` مقدارش را «۱۴۰۵/۵/۱۵» می‌دهد، ولی ستون
     `starts_at` در دیتابیس timestamptz است. بدون این تبدیل، همان رشته‌ی
     شمسی مستقیم به Postgres می‌رفت و یا خطا می‌داد یا تاریخ بی‌معنی
     میلادی می‌ساخت. */
  const jalaliToIso = (jalali: string, time: string): string | null => {
    const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(String(jalali || '').trim());
    if (!m) return null;
    const [gy, gm, gd] = jalaliToGregorian(Number(m[1]), Number(m[2]), Number(m[3]));
    const [hh = '00', mm = '00'] = String(time || '00:00').split(':');
    const p = (n: number | string) => String(n).padStart(2, '0');
    /* +03:30 ثابت است: ایران از ۱۴۰۱ ساعت تابستانی ندارد */
    return `${gy}-${p(gm)}-${p(gd)}T${p(hh)}:${p(mm)}:00+03:30`;
  };

  const createTournament = async () => {
    if (!selectedClub) return;
    if (!tForm.name.trim()) { alert('نام مسابقه الزامی است'); return; }
    if (!tForm.date) { alert('تاریخ مسابقه الزامی است'); return; }
    if (!tForm.startTime) { alert('ساعت شروع الزامی است'); return; }
    setTLoading(true);
    try {
      /* روی سرور ساخته می‌شود؛ مالکیت باشگاه آن‌جا از دیتابیس اثبات
         می‌شود، نه از clubId که این‌جا می‌فرستیم.

         شماره‌ی کارت عمداً فرستاده نمی‌شود: حساب تسویه از پروفایل
         تأییدشده‌ی باشگاه می‌آید، نه از فرم هر مسابقه. */
      const r = await apiFetch('/api/tournaments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId: selectedClub.id,
          title: tForm.name,
          description: tForm.description,
          discipline: tForm.gameType,
          maxPlayers: parseInt(tForm.maxPlayers) || 16,
          entryFee: parseFloat(tForm.entryFee) || 0,
          prize: tForm.prizeInfo,
          venue: selectedClub.name,
          city: (selectedClub as { city?: string }).city ?? '',
          startsAt: jalaliToIso(tForm.date, tForm.startTime || '00:00'),
          /* مهلت ثبت‌نام پیش‌تر اصلاً فرستاده نمی‌شد و همیشه NULL می‌ماند */
          registrationEndsAt: jalaliToIso(tForm.registrationDeadline, '23:59'),
          matchFormat: tForm.matchFormat,
          /* پیش‌نویس ساخته می‌شود؛ باز کردن ثبت‌نام یک اقدام جداست */
          status: 'draft',
        }),
      });
      const j = await r.json().catch(() => ({} as Record<string, unknown>));
      if (!r.ok) { alert(String(j.message ?? 'ثبت مسابقه انجام نشد')); return; }

      await loadTournaments(selectedClub.id);
      setTournamentTab('list');
      setTForm({
        name: '', description: '', gameType: 'snooker', date: '', startTime: '',
        registrationDeadline: '', maxPlayers: '16', entryFee: '', prizeInfo: '',
        rules: '', matchFormat: '', paymentMethod: 'card_transfer',
        cardNumber: '', cardHolder: '', bankName: '',
      });
    } catch {} finally { setTLoading(false); }
  };

  // Gallery actions
  const createAlbum = () => {
    if (!newAlbumName.trim()) return;
    const album: ClubAlbum = { id: uid(), name: newAlbumName.trim(), createdAt: new Date().toISOString(), items: [] };
    saveAlbums([album, ...albums]);
    setNewAlbumName('');
    setOpenAlbumId(album.id);
  };

  const deleteAlbum = (id: string) => {
    saveAlbums(albums.filter(a => a.id !== id));
    if (openAlbumId === id) setOpenAlbumId(null);
  };

  const uploadToAlbum = async (albumId: string, files: FileList) => {
    setUploadingAlbum(albumId);
    const newItems: ClubAlbumItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await compressImage(file);
      newItems.push({ id: uid(), dataUrl, name: file.name, caption: '' });
    }
    saveAlbums(albums.map(a => a.id === albumId ? { ...a, items: [...a.items, ...newItems] } : a));
    setUploadingAlbum(null);
  };

  const deletePhotoFromAlbum = (albumId: string, itemId: string) => {
    saveAlbums(albums.map(a =>
      a.id === albumId ? { ...a, items: a.items.filter(i => i.id !== itemId) } : a
    ));
  };

  const uploadSinglePhotos = async (files: FileList) => {
    setUploadingSingle(true);
    const newPhotos: { id: string; dataUrl: string; name: string }[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await compressImage(file);
      newPhotos.push({ id: uid(), dataUrl, name: file.name });
    }
    savePhotos([...newPhotos, ...singlePhotos]);
    setUploadingSingle(false);
  };

  const deleteSinglePhoto = (id: string) => {
    savePhotos(singlePhotos.filter(p => p.id !== id));
  };

  const addDiscount = () => {
    const pct = parseInt(discountForm.percent);
    if (!discountForm.startTime || !discountForm.endTime || !pct) return;
    const rule: DiscountRule = {
      id: `d-${Date.now()}`,
      startTime: discountForm.startTime,
      endTime: discountForm.endTime,
      percent: pct,
      label: discountForm.label || `${discountForm.startTime}–${discountForm.endTime}`,
    };
    setDiscounts(prev => [...prev, rule]);
    setDiscountForm({ startTime: '08:00', endTime: '12:00', percent: '20', label: '' });
  };

  const removeDiscount = (id: string) => setDiscounts(prev => prev.filter(d => d.id !== id));

  const uploadLogo = async (file: File) => {
    if (!selectedClub) return;
    setLogoUploading(true);
    try {
      const url = await uploadFile('club-media', file, `clubs/${selectedClub.id}/logo/${file.name}`);
      if (url) {
        await api.put(`/clubs/${selectedClub.id}`, { logo: url });
        setSelectedClub(prev => prev ? { ...prev, logo: url } : prev);
      }
    } catch {}
    setLogoUploading(false);
  };

  const uploadStory = async (file: File, text: string) => {
    if (!selectedClub) return;
    if (storyList.length >= 10) { alert('حداکثر ۱۰ استوری مجاز است'); return; }
    setStoryUploading(true);
    try {
      const url = await uploadFile('club-media', file, `clubs/${selectedClub.id}/stories/${Date.now()}-${file.name}`);
      if (url) {
        const newStory: ClubStory = {
          id: `s_${Date.now()}`,
          mediaUrl: url,
          mediaType: file.type.startsWith('video/') ? 'video' : 'image',
          text,
          textColor: storyTextColor,
          textSize: storyTextSize,
          textBold: storyTextBold,
          textAlign: storyTextAlign,
          textPos: storyTextPos,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        try {
          await fetch(`/api/clubs/${selectedClub.id}/stories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStory),
          });
        } catch {}
        setStoryList(prev => [...prev, newStory]);
        setStoryDraft(null);
        setStoryTextColor('#ffffff');
        setStoryTextSize(15);
        setStoryTextBold(false);
        setStoryTextAlign('center');
        setStoryTextPos('bottom');
      }
    } catch {}
    setStoryUploading(false);
  };

  const deleteStory = async (storyId: string) => {
    if (!selectedClub) return;
    setStoryList(prev => prev.filter(s => s.id !== storyId));
    try {
      await fetch(`/api/clubs/${selectedClub.id}/stories?storyId=${storyId}`, { method: 'DELETE' });
    } catch {}
  };

  // Coach actions
  const openCoachPicker = () => {
    setShowCoachPicker(true);
    setCoachSearch('');
    setLoadingCoaches(true);
    const MOCK_COACHES: ApiCoach[] = [
      { id: '1', firstName: 'استاد احمد', lastName: 'رضایی', verificationStatus: 'verified', city: 'تهران', bio: 'مربی ملی‌پوش با ۱۵ سال سابقه', coachProfile: { specialty: 'snooker', experience: '۱۵' } },
      { id: '2', firstName: 'حسین', lastName: 'نوری', verificationStatus: 'verified', city: 'مشهد', bio: 'قهرمان آسیا و مربی دسته برتر', coachProfile: { specialty: 'snooker', experience: '۱۲' } },
      { id: '3', firstName: 'مریم', lastName: 'کاظمی', verificationStatus: 'verified', city: 'اصفهان', bio: 'مربی بانوان و متخصص پاکت بیلیارد', coachProfile: { specialty: 'pocket', experience: '۸' } },
      { id: '4', firstName: 'سینا', lastName: 'محمدی', verificationStatus: 'pending', city: 'شیراز', bio: 'مربی جوان و قهرمان لیگ برتر', coachProfile: { specialty: 'pocket', experience: '۵' } },
    ];
    setAvailableCoaches(MOCK_COACHES);
    setLoadingCoaches(false);
  };

  const selectCoach = (c: ApiCoach) => {
    if (coaches.find(e => e.id === c.id)) return;
    const specialtyMap: Record<string, string> = { snooker: 'اسنوکر', pocket: 'پاکت بیلیارد', highball: 'هی‌بال' };
    const entry: CoachEntry = {
      id: c.id,
      name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'بدون نام',
      title: specialtyMap[c.coachProfile?.specialty ?? ''] ?? 'مربی بیلیارد',
      exp: c.coachProfile?.experience ? `${c.coachProfile.experience} سال` : '',
      rating: '',
      bio: c.bio ?? '',
    };
    saveCoaches([...coaches, entry]);
    setShowCoachPicker(false);
  };

  const deleteCoach = (id: string) => saveCoaches(coaches.filter(c => c.id !== id));

  // ── Early returns ──────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6B7280', fontFamily: 'var(--font-base)' }}>
      در حال بارگذاری...
    </div>
  );

  if (clubs.length === 0) return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: '0 16px', textAlign: 'center', fontFamily: 'var(--font-base)' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Building2 size={52} color="#D1D5DB" strokeWidth={1.1} /></div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, margin: '0 0 8px' }}>هنوز باشگاهی ثبت نکردی</h2>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>برای مدیریت باشگاه، ابتدا یک باشگاه ثبت کن.</p>
        <Link href="/clubs/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(199,166,106,0.14)', color: '#A07840',
          border: '1px solid rgba(199,166,106,0.42)',
          padding: '12px 32px', borderRadius: 20, fontWeight: 700, textDecoration: 'none', fontSize: 15,
        }}>
          <Plus size={15} /> ثبت باشگاه جدید
        </Link>
      </Card>
    </div>
  );

  // ── Derived ───────────────────────────────────────────────────────────────

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const filteredBookings = bookingFilter === 'all' ? bookings : bookings.filter(b => b.status === bookingFilter);

  /* رزرو آنلاین بسته است؟ (همیشه یا تا زمان آینده) */
  /* اعتبارسنجی محلی کارت و شبا — پیش از هر استعلام بیرونی */
  const cardBad   = clubInfo.bankCard.replace(/\D/g, '').length === 16 && !isValidCard(clubInfo.bankCard);
  const cardBank  = isValidCard(clubInfo.bankCard) ? bankOfCard(clubInfo.bankCard) : null;
  const ibanBad   = clubInfo.iban.length > 2 && clubInfo.iban.length === 26 && !isValidIban(clubInfo.iban);
  const ibanBank  = isValidIban(clubInfo.iban) ? bankOfIban(clubInfo.iban) : null;
  /* نام بانک از خودِ شبا/کارت درمی‌آید — شبا مقدم است چون مقصدِ واقعیِ
     پول همان است. سرویسِ استعلام گاهی نامِ بانک را برنمی‌گرداند و
     آن‌وقت این فیلد خالی می‌ماند؛ پیشوندِ شبا همیشه هست. */
  const derivedBankName = ibanBank || cardBank || '';
  const hasGeo = geo !== null;

  /* دو سازوکار بستن رزرو وجود دارد و باید یک وضعیت واحد نشان دهند،
     وگرنه کاربر «رزرو امروز بسته» را تیک می‌زند و همان بالا می‌خواند
     «رزرو آنلاین باز است» — که هر دو درست‌اند ولی با هم متناقض به‌نظر
     می‌رسند:

       • closeToday          → همیشه، فقط روز جاری
       • reserveClosedUntil  → موقت، همه‌ی روزها تا یک زمان مشخص

     پس متن هر دو را با هم می‌گوید. */
  const tempClosed = reserveClosedUntil === 'always' || (reserveClosedUntil !== '' && Number(reserveClosedUntil) > Date.now());
  const isReserveClosed = tempClosed || closeToday;

  const reserveClosedLabel = (() => {
    if (reserveClosedUntil === 'always') return 'رزرو آنلاین همیشه بسته است';
    if (tempClosed) {
      const until = new Date(Number(reserveClosedUntil)).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
      return closeToday
        ? `رزرو آنلاین تا ${until} بسته است — و امروز همیشه بسته می‌ماند`
        : `رزرو آنلاین تا ${until} بسته است`;
    }
    if (closeToday) return 'رزرو امروز بسته است — روزهای آینده باز';
    return 'رزرو آنلاین باز است';
  })();
  /* ذخیره‌ی «بستن رزرو امروز» روی سرور */
  const saveCloseToday = async (next: boolean) => {
    if (!selectedClub) return;
    const prev = closeToday;
    setCloseToday(next);          // خوش‌بینانه، تا تیک بلافاصله جواب بدهد
    setCloseTodayBusy(true);
    try {
      const r = await apiFetch(`/api/clubs/${selectedClub.id}/settings`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closeTodayReservations: next }),
      });
      if (!r.ok) throw new Error();
      setCloseTodayMsg({ ok: true, text: next ? 'رزرو امروز بسته شد' : 'رزرو امروز باز شد' });
    } catch {
      setCloseToday(prev);        // برگرداندن به حالت قبل
      setCloseTodayMsg({ ok: false, text: 'ذخیره‌ی تنظیمات انجام نشد' });
    } finally { setCloseTodayBusy(false); }
  };

  /* ذخیره‌ی شماره‌ی دریافت پیامک */
  const saveNotifyPhone = async () => {
    if (!selectedClub) return;
    if (notifyPhone && !/^09\d{9}$/.test(notifyPhone)) {
      setNotifyMsg({ ok: false, text: 'شماره موبایل معتبر نیست' });
      return;
    }
    setNotifyBusy(true);
    try {
      const r = await apiFetch(`/api/clubs/${selectedClub.id}/settings`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyPhone }),
      });
      if (!r.ok) throw new Error();
      setNotifyMsg({ ok: true, text: notifyPhone ? 'ذخیره شد' : 'برداشته شد — پیامک به شماره‌ی خودتان می‌رود' });
    } catch {
      setNotifyMsg({ ok: false, text: 'ذخیره انجام نشد' });
    } finally { setNotifyBusy(false); }
  };

  /* بستنِ موقت روی سرور ذخیره می‌شود، نه در localStorage.

     پیش‌تر فقط در مرورگرِ خودِ باشگاه‌دار می‌نشست، یعنی سرور هیچ‌وقت
     رزرو را نمی‌بست و هر بازدیدکننده‌ی دیگری می‌توانست رزرو کند —
     در حالی که خودِ باشگاه‌دار صفحه‌ی رزرو را کاملاً بسته می‌دید.
     لحظه‌ی پایان را هم سرور حساب می‌کند تا ساعتِ اشتباهِ دستگاه قفل را
     زودتر یا دیرتر باز نکند. */
  const setReservationClosure = async (opt: number | 'always' | 'open') => {
    if (!selectedClub) return;
    setClosureBusy(true);
    const prev = reserveClosedUntil;
    try {
      const r = await apiFetch(`/api/clubs/${selectedClub.id}/settings`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closeForHours: opt === 'open' ? null : opt }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.message);
      setReserveClosedUntil(j.reserveClosedUntil ?? '');
      /* کلیدِ قدیمی پاک می‌شود تا نسخه‌ی مرورگری دیگر روی سرور اثر
         نگذارد و دو منبعِ حقیقت باقی نماند. */
      try { localStorage.removeItem(`club-reserveClosedUntil-${selectedClub.id}`); } catch { /* ignore */ }
    } catch {
      setReserveClosedUntil(prev);
      setCloseTodayMsg({ ok: false, text: 'ذخیره‌ی وضعیت رزرو انجام نشد' });
    } finally { setClosureBusy(false); }
  };

  const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{size?: number; strokeWidth?: number}>; badge?: number }[] = [
    { key: 'dashboard',   label: 'داشبورد',    Icon: LayoutDashboard },
    { key: 'info',        label: 'اطلاعات',    Icon: FileText },
    { key: 'tables',      label: 'میزها',      Icon: Grid3X3 },
    { key: 'hours',       label: 'ساعات کاری', Icon: Clock },
    { key: 'bookings',    label: 'رزروها',     Icon: CalendarDays, badge: pendingBookings.length || undefined },
    { key: 'finance',     label: 'مالی',       Icon: Wallet },
    { key: 'live',        label: 'پخش زنده',   Icon: Radio },
    { key: 'tournaments', label: 'مسابقات',    Icon: Trophy },
    { key: 'gallery',     label: 'گالری',      Icon: ImageIcon },
    { key: 'coaches',     label: 'مربیان',     Icon: GraduationCap },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 12px',
    fontSize: 14, fontFamily: 'var(--font-base)', background: '#FAFAFA',
    color: DARK, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginTop: 4,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 80px', fontFamily: 'var(--font-base)', direction: 'rtl' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DARK }}>پنل مدیریت باشگاه</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
            {selectedClub?.name} — {selectedClub?.city}
          </p>
        </div>
        <Link href="/clubs/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(199,166,106,0.14)', color: '#A07840',
          border: '1px solid rgba(199,166,106,0.42)',
          padding: '9px 18px', borderRadius: 20,
          fontWeight: 700, textDecoration: 'none', fontSize: 13,
        }}>
          <Plus size={14} />
          باشگاه جدید
        </Link>
      </div>

      {/* وضعیت تأیید — هویت، مدارک و ایمیل */}
      <div style={{ marginBottom: 16 }}><VerificationBadges /></div>

      {/* Club selector dropdown */}
      {clubs.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <button
            onClick={() => setClubDropdownOpen(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
              border: `1.5px solid ${clubDropdownOpen ? GOLD : '#E5E7EB'}`,
              background: '#fff', fontFamily: 'var(--font-base)',
              boxShadow: clubDropdownOpen ? `0 0 0 3px ${GOLD}22, 0 1px 4px rgba(0,0,0,0.06)` : '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.18s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: `${GOLD}18`,
                border: `1.5px solid ${GOLD}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}><Building2 size={19} color={GOLD} /></div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 1 }}>باشگاه انتخابی</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: DARK }}>{selectedClub?.name ?? 'انتخاب باشگاه'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11, background: `${GOLD}1A`, color: GOLD,
                borderRadius: 20, padding: '3px 9px', fontWeight: 700,
              }}>
                {clubs.length} باشگاه
              </span>
              <ChevronDown
                size={16} color="#6B7280"
                style={{ transform: clubDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}
              />
            </div>
          </button>

          {clubDropdownOpen && (
            <>
              <div
                onClick={() => setClubDropdownOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 998 }}
              />
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, left: 0, zIndex: 999,
                background: '#fff', borderRadius: 14,
                border: '1px solid #F0EDE8',
                boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden', maxHeight: 320, overflowY: 'auto',
              }}>
                {clubs.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClub(c); setClubDropdownOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 16px', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-base)',
                      borderBottom: i < clubs.length - 1 ? '1px solid #F9F7F4' : 'none',
                      background: selectedClub?.id === c.id ? `${GOLD}0F` : '#fff',
                      transition: 'background 0.12s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: selectedClub?.id === c.id ? GOLD : '#F3F4F6',
                        fontSize: 13, fontWeight: 800,
                        color: selectedClub?.id === c.id ? '#fff' : '#6B7280',
                      }}>
                        {c.name.charAt(0)}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: selectedClub?.id === c.id ? GOLD : DARK }}>
                          {c.name}
                        </div>
                        {c.city && (
                          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{c.city}</div>
                        )}
                      </div>
                    </div>
                    {selectedClub?.id === c.id && <Check size={16} color={GOLD} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── وضعیت بررسی باشگاه ──
          مالک باید بداند باشگاهش منتشر شده یا نه، و اگر رد شده چرا.
          پیش‌تر هیچ‌کدام نمایش داده نمی‌شد: باشگاه ثبت می‌شد، در سایت
          دیده نمی‌شد، و مالک دلیلش را نمی‌دانست. */}
      {selectedClub && selectedClub.verificationStatus !== 'verified' && (
        <div style={{
          marginBottom: 16, padding: '13px 16px', borderRadius: 14, lineHeight: 2,
          fontSize: 12.5, fontWeight: 600,
          background: selectedClub.verificationStatus === 'rejected' ? 'rgba(178,59,46,0.06)' : 'rgba(199,166,106,0.09)',
          border: `1px solid ${selectedClub.verificationStatus === 'rejected' ? 'rgba(178,59,46,0.26)' : 'rgba(199,166,106,0.32)'}`,
          color: selectedClub.verificationStatus === 'rejected' ? '#B23B2E' : '#9A6E38',
        }}>
          {selectedClub.verificationStatus === 'rejected' ? (
            <>
              <b>ثبت این باشگاه تأیید نشد.</b>
              {selectedClub.rejectionReason && (
                <div style={{ marginTop: 4, color: '#1C1B17', fontWeight: 500 }}>
                  علت: {selectedClub.rejectionReason}
                </div>
              )}
              <div style={{ marginTop: 6, color: 'rgba(0,0,0,0.55)', fontWeight: 500 }}>
                پس از اصلاح، همین‌جا ذخیره کنید — باشگاه خودکار دوباره به صف بررسی می‌رود.
              </div>
            </>
          ) : (
            <>
              <b>باشگاه در انتظار بررسی کارشناسان است.</b>
              <div style={{ marginTop: 4, color: 'rgba(0,0,0,0.55)', fontWeight: 500 }}>
                تا تأیید، در فهرست عمومی سایت نمایش داده نمی‌شود. اطلاعات و مدارک را کامل کنید تا بررسی سریع‌تر انجام شود.
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 20,
        background: '#fff', borderRadius: 14, padding: 6,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0EDE8',
        scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              border: active ? `1px solid rgba(199,166,106,0.50)` : '1px solid transparent',
              background: active ? 'rgba(199,166,106,0.14)' : 'transparent',
              color: active ? '#A07840' : '#6B7280',
              fontFamily: 'var(--font-base)',
            }}>
              <tab.Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800,
                  width: 17, height: 17, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ════ Tab: Dashboard ════ */}
      {activeTab === 'dashboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'در انتظار تأیید', value: pendingBookings.length, color: '#D97706' },
              { label: 'کل رزروها',       value: bookings.length,        color: '#059669' },
              { label: 'میزها',           value: tables.length,          color: '#2563EB' },
              { label: 'مسابقات',         value: myTournaments.length,   color: GOLD      },
            ].map(s => (
              <Card key={s.label} style={{ textAlign: 'center', padding: '20px 16px' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{s.label}</div>
              </Card>
            ))}
          </div>

          <Card style={{ marginBottom: 16 }}>
            <SectionTitle>دسترسی سریع</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {[
                { label: 'ثبت مسابقه',    Icon: Trophy,       action: () => { setActiveTab('tournaments'); setTournamentTab('create'); } },
                { label: 'افزودن میز',    Icon: Grid3X3,      action: () => { setActiveTab('tables'); setShowTableForm(true); } },
                { label: 'رزروهای جدید',  Icon: CalendarDays, action: () => { setActiveTab('bookings'); setBookingFilter('pending'); } },
                { label: 'ویرایش اطلاعات', Icon: FileText,    action: () => setActiveTab('info') },
                { label: 'گالری',          Icon: ImageIcon,   action: () => setActiveTab('gallery') },
                { label: 'مربیان',         Icon: GraduationCap, action: () => setActiveTab('coaches') },
                { label: 'پروفایل باشگاه', Icon: Eye,         action: () => router.push(`/clubs/${selectedClub?.id}`) },
              ].map(({ label, Icon, action }) => (
                <button key={label} onClick={action} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.22)',
                  borderRadius: 14, padding: '14px 10px', cursor: 'pointer',
                  fontFamily: 'var(--font-base)', transition: 'all 0.15s',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.28)' }}>
                    <Icon size={18} strokeWidth={1.8} style={{ color: '#A07840' }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{label}</div>
                </button>
              ))}
            </div>
          </Card>

          {pendingBookings.length > 0 && (
            <Card>
              <SectionTitle>رزروهای در انتظار ({pendingBookings.length})</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingBookings.slice(0, 3).map(b => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: '#FFFBF0', borderRadius: 10, border: '1px solid #FEF3C7',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{b.user?.firstName} {b.user?.lastName}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>
                        {TABLE_TYPE_LABELS[b.tableType] || b.tableType} — میز {b.tableNumber}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => updateBookingStatus(b.id, 'confirmed')} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'rgba(48,197,90,0.10)', color: '#16a34a',
                        border: '1px solid rgba(48,197,90,0.28)', borderRadius: 20,
                        padding: '6px 13px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-base)', fontWeight: 700,
                      }}><CheckCircle size={12} /> تأیید</button>
                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'rgba(239,68,68,0.09)', color: '#dc2626',
                        border: '1px solid rgba(239,68,68,0.28)', borderRadius: 20,
                        padding: '6px 13px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-base)', fontWeight: 700,
                      }}><XCircle size={12} /> رد</button>
                    </div>
                  </div>
                ))}
                {pendingBookings.length > 3 && (
                  <button onClick={() => setActiveTab('bookings')} style={{
                    background: 'none', border: 'none', color: GOLD, fontSize: 13,
                    cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font-base)',
                  }}>
                    مشاهده همه ({pendingBookings.length} مورد) ←
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Danger zone */}
          <Card style={{ border: '1px solid rgba(239,68,68,0.30)', background: 'rgba(239,68,68,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={16} color="#dc2626" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>منطقه خطرناک</span>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
              حذف باشگاه <strong style={{ color: DARK }}>{selectedClub?.name}</strong> غیرقابل بازگشت است.
              تمام اطلاعات، میزها و رزروها پاک می‌شوند.
            </p>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(239,68,68,0.08)', color: '#dc2626',
                border: '1px solid rgba(239,68,68,0.30)', borderRadius: 20,
                padding: '10px 20px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-base)',
              }}>
                <Trash2 size={14} /> حذف این باشگاه
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.06)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
                  آیا مطمئن هستید؟ این عمل قابل بازگشت نیست.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={deleteClub} disabled={deleteLoading} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(239,68,68,0.12)', color: '#dc2626',
                    border: '1px solid rgba(239,68,68,0.35)', borderRadius: 20,
                    padding: '10px 20px', fontSize: 13, fontWeight: 700,
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    opacity: deleteLoading ? 0.65 : 1, fontFamily: 'var(--font-base)',
                  }}>
                    {deleteLoading ? <Loader2 size={13} /> : <Trash2 size={13} />}
                    {deleteLoading ? 'در حال حذف...' : 'بله، حذف کن'}
                  </button>
                  <button onClick={() => setDeleteConfirm(false)} style={{
                    background: 'rgba(0,0,0,0.04)', color: '#6B7280',
                    border: '1px solid rgba(0,0,0,0.12)', borderRadius: 20,
                    padding: '10px 20px', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-base)',
                  }}>انصراف</button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ════ Tab: Info ════ */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionTitle>اطلاعات پایه</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 14, marginBottom: 20 }}>
              <InputField label="نام باشگاه"   value={clubInfo.name}        onChange={v => setClubInfo(p => ({...p, name: v}))} />
              <InputField label="نام مدیر" readOnly
                hint="از اطلاعات احراز هویت شما — قابل تغییر نیست"
                value={verifiedManagerName || clubInfo.managerName}
                onChange={() => { /* قفل */ }} />
              <div style={{ gridColumn: '1 / -1' }}>
                <ProvinceCitySelect
                  value={{ province: clubInfo.province, city: clubInfo.city }}
                  onChange={v => setClubInfo(p => ({ ...p, province: v.province, city: v.city }))}
                />
              </div>
              {/* «کشور» برداشته شد — همه‌ی باشگاه‌ها ایران‌اند و آن فیلد
                  فقط داده‌ی ناهمگون می‌ساخت. جایش کد پستی، که آدرس را
                  خودش می‌آورد. */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>کد پستی</label>
                {/* در موبایل هر دو تمام‌عرض و هم‌ارتفاع می‌شوند؛ پیش‌تر با
                    flex-wrap دکمه به اندازه‌ی متنش کوچک می‌ماند و زیرِ
                    فیلدِ تمام‌عرض ناهم‌تراز می‌نشست. */}
                <div className="bh-postal-row">
                  <FaNumberInput
                    value={clubInfo.postalCode} ariaLabel="کد پستی" placeholder="۱۰ رقم"
                    onChange={v => { setClubInfo(p => ({ ...p, postalCode: v.slice(0, 10) })); setPostalMsg(null); }}
                    style={{ ...inputStyle, width: '100%', height: 40, boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.08em' }}
                  />
                  <button type="button" onClick={fetchAddress}
                    disabled={postalBusy || !/^\d{10}$/.test(clubInfo.postalCode) || !selectedClub}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      height: 40, padding: '0 16px', borderRadius: 10, boxSizing: 'border-box',
                      fontFamily: 'var(--font-base)', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
                      cursor: (postalBusy || !/^\d{10}$/.test(clubInfo.postalCode)) ? 'not-allowed' : 'pointer',
                      background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.42)', color: '#A07840',
                      opacity: (postalBusy || !/^\d{10}$/.test(clubInfo.postalCode)) ? 0.5 : 1,
                    }}>
                    {postalBusy ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={14} />}
                    {postalBusy ? 'در حال استعلام…' : 'استعلام آدرس'}
                  </button>
                </div>
                {postalMsg && (
                  <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 6, lineHeight: 1.9, color: postalMsg.ok ? '#0E7A38' : '#B23B2E' }}>
                    {postalMsg.text}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5, lineHeight: 1.9 }}>
                  با استعلام کد پستی، آدرس و موقعیت باشگاه خودکار پر می‌شود.
                </div>
              </div>
              {/* ── آدرس ──
                  خروجیِ استعلامِ کد پستی است، پس ورودیِ کاربر نیست. با
                  `<input>` تک‌خطی هم در موبایل فقط اولش دیده می‌شد و
                  بقیه‌اش بیرونِ کادر می‌ماند؛ حالا چندخطی است و کاملاً
                  خوانده می‌شود. */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>آدرس</label>
                {/* بلوکِ خودرشد به‌جای textarea: هر ارتفاعِ ثابتی در عرضِ
                    باریک آدرس را می‌برید، و `rows` هم چون به عرض بستگی
                    ندارد جواب نمی‌داد. این‌جا ارتفاع از خودِ متن می‌آید،
                    پس در هیچ عرضی چیزی پنهان نمی‌ماند. */}
                <div data-field="address" style={{
                  ...inputStyle, marginTop: 4, lineHeight: 1.95, minHeight: 42,
                  height: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  background: '#F3F4F6', color: clubInfo.address ? '#4B5563' : '#9CA3AF', cursor: 'default',
                }}>
                  {clubInfo.address || 'با استعلام کد پستی پر می‌شود'}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, lineHeight: 1.9 }}>
                  از استعلام کد پستی — قابل تغییر نیست. توضیح‌های تکمیلی را در فیلد زیر بنویسید.
                </div>
              </div>

              {/* جای «طبقه‌ی سوم»، «ورودی از کوچه‌ی پشتی» و مانند این —
                  تا آدرسِ رسمی دست‌نخورده بماند. */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>توضیحات آدرس</label>
                <textarea value={clubInfo.addressNote} rows={2}
                  onChange={e => setClubInfo(p => ({ ...p, addressNote: e.target.value.slice(0, 300) }))}
                  placeholder="مثلاً: طبقه‌ی دوم، واحد ۵ — ورودی از کوچه‌ی روبه‌رو"
                  style={{ ...inputStyle, marginTop: 4, resize: 'vertical', lineHeight: 1.95, minHeight: 58 }} />
              </div>

              {/* ── موقعیت مکانی ──
                  کاربران می‌توانند باشگاه‌ها را بر اساس فاصله مرتب کنند؛
                  باشگاهی که مختصات ندارد در آن فهرست اصلاً نمی‌آید. تا
                  امروز فقط موقع ثبتِ اولیه قابل تعیین بود. */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>موقعیت مکانی</label>
                <div style={{
                  marginTop: 5, padding: '12px 14px', borderRadius: 12,
                  background: hasGeo ? 'rgba(48,197,90,0.06)' : 'rgba(245,158,11,0.07)',
                  border: `1px solid ${hasGeo ? 'rgba(48,197,90,0.24)' : 'rgba(245,158,11,0.28)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 9 }}>
                    <MapPin size={14} style={{ color: hasGeo ? '#166534' : '#B45309', flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: hasGeo ? '#166534' : '#92600A' }}>
                      {hasGeo ? 'موقعیت ثبت شده است' : 'موقعیت هنوز ثبت نشده'}
                    </span>
                    {hasGeo && (
                      <span style={{ fontSize: 11, color: '#6B7280', direction: 'ltr', fontFamily: 'monospace' }}>
                        {geo!.lat.toFixed(5)}, {geo!.lon.toFixed(5)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                    <button type="button" onClick={saveLocation} disabled={geoBusy || !selectedClub}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        height: 38, padding: '0 15px', borderRadius: 10, boxSizing: 'border-box',
                        fontFamily: 'var(--font-base)', fontSize: 12.5, fontWeight: 700,
                        cursor: geoBusy ? 'not-allowed' : 'pointer', opacity: geoBusy ? 0.5 : 1,
                        background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.42)', color: '#A07840',
                      }}>
                      {geoBusy ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={14} />}
                      {geoBusy ? 'در حال دریافت…' : hasGeo ? 'به‌روزرسانی موقعیت' : 'ثبت موقعیت فعلی'}
                    </button>
                    {hasGeo && (
                      <a href={`https://maps.google.com/?q=${geo!.lat},${geo!.lon}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, fontWeight: 700, color: '#9A6E38', textDecoration: 'none' }}>
                        دیدن روی نقشه ↗
                      </a>
                    )}
                  </div>
                  {geoMsg && (
                    <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 8, lineHeight: 1.9, color: geoMsg.ok ? '#0E7A38' : '#B23B2E' }}>
                      {geoMsg.text}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 7, lineHeight: 1.95 }}>
                    کاربران می‌توانند باشگاه‌ها را بر اساس نزدیکی مرتب کنند؛ بدون موقعیت، باشگاه شما در آن فهرست نمی‌آید.
                    استعلام کد پستی هم موقعیت را ثبت می‌کند، ولی اگر داخل باشگاه هستید این دکمه دقیق‌تر است.
                  </div>
                </div>
              </div>
              <InputField label="تلفن"         value={clubInfo.phone}       onChange={v => setClubInfo(p => ({...p, phone: v}))} placeholder="021-..." />
              <InputField label="وبسایت"       value={clubInfo.website}     onChange={v => setClubInfo(p => ({...p, website: v}))} placeholder="https://..." />
              <div style={{ gridColumn: '1 / -1' }}>
                <InputField label="کد پیگیری جواز کسب" value={clubInfo.licenseNumber}
                  onChange={v => { setClubInfo(p => ({ ...p, licenseNumber: v.trim() })); setLicMsg(null); }}
                  placeholder="کد پیگیری روی جواز — برای استعلام و تیک تأیید" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={verifyLicense}
                    disabled={licBusy || !clubInfo.licenseNumber.trim() || !selectedClub}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10,
                      fontFamily: 'var(--font-base)', fontSize: 12.5, fontWeight: 700,
                      cursor: (licBusy || !clubInfo.licenseNumber.trim()) ? 'not-allowed' : 'pointer',
                      background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.42)', color: '#A07840',
                      opacity: (licBusy || !clubInfo.licenseNumber.trim()) ? 0.5 : 1,
                    }}>
                    {licBusy ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
                    {licBusy ? 'در حال استعلام…' : 'استعلام اعتبار جواز'}
                  </button>
                  {licMsg && (
                    <span style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.9, color: licMsg.ok ? '#0E7A38' : '#B23B2E' }}>
                      {licMsg.text}
                    </span>
                  )}
                </div>

                {/* ── تصویر/فایل جواز کسب ──
                    کدِ پیگیری فقط اعتبار را ثابت می‌کند؛ خودِ مدرک برای
                    بررسیِ ادمین لازم است. تا امروز فقط در فرمِ ثبتِ اولیه
                    قابل بارگذاری بود و بعد از آن هیچ راهی برای افزودن یا
                    عوض‌کردنش نبود. */}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #EFEBE4' }}>
                  <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>
                    تصویر یا فایل جواز کسب
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <label style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10,
                      fontSize: 12.5, fontWeight: 700, cursor: licUploading ? 'not-allowed' : 'pointer',
                      background: '#fff', border: '1px dashed rgba(0,0,0,0.18)', color: '#6B7280',
                      opacity: licUploading ? 0.5 : 1,
                    }}>
                      <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                        disabled={licUploading || !selectedClub}
                        onChange={e => { const f = e.target.files?.[0]; if (f) void uploadLicenseDoc(f); e.target.value = ''; }} />
                      {licUploading
                        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Upload size={14} />}
                      {licUploading ? 'در حال بارگذاری…' : licDocName ? 'جایگزینی مدرک' : 'بارگذاری جواز کسب'}
                    </label>
                    {licDocName && (
                      <button type="button" onClick={openLicenseDoc} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-base)',
                        background: 'rgba(48,197,90,0.08)', border: '1px solid rgba(48,197,90,0.28)', color: '#166534',
                      }}>
                        <FileText size={13} /> مشاهده‌ی مدرک
                      </button>
                    )}
                  </div>
                  {licDocMsg && (
                    <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 7, lineHeight: 1.9, color: licDocMsg.ok ? '#0E7A38' : '#B23B2E' }}>
                      {licDocMsg.text}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, lineHeight: 1.9 }}>
                    عکس یا PDF، تا ۸ مگابایت. این مدرک خصوصی است و فقط شما و بررسی‌کننده‌ی سایت می‌بینیدش.
                  </div>
                </div>
              </div>
              <SelectField label="منطقه زمانی" value={clubInfo.timezone}    onChange={v => setClubInfo(p => ({...p, timezone: v}))}
                options={[{ value: 'Asia/Tehran', label: 'تهران (UTC+3:30)' }]} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>توضیحات باشگاه</label>
              <textarea value={clubInfo.description} rows={4}
                onChange={e => setClubInfo(p => ({...p, description: e.target.value}))}
                style={inputStyle} />
            </div>

            <SectionTitle>تعداد میزها</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { key: 'snookerTables',    label: 'اسنوکر'       },
                { key: 'pocketTables',     label: 'پاکت بیلیارد' },
                { key: 'highballTables',   label: 'هی‌بال'        },
                { key: 'vipSnookerTables', label: 'VIP اسنوکر'   },
                { key: 'vipPocketTables',  label: 'VIP پاکت'     },
                { key: 'airHockeyTables',  label: 'ایرهاکی'     },
                { key: 'dartBoards',       label: 'دارت'          },
                { key: 'playstations',     label: 'پلی‌استیشن'   },
              ].map(f => (
                <InputField key={f.key} type="number" label={f.label}
                  value={(clubInfo as unknown as Record<string, string>)[f.key] ?? '0'}
                  onChange={v => setClubInfo(p => ({...p, [f.key]: v}))} />
              ))}
            </div>

            <SectionTitle>امکانات</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 10, marginBottom: 20 }}>
              {[
                { key: 'hasCafe',              label: 'کافه'          },
                { key: 'hasParking',           label: 'پارکینگ'       },
                { key: 'hasWifi',              label: 'WiFi'           },
                { key: 'hasProfessionalCoach', label: 'مربی' },
              ].map(f => {
                const checked = (clubInfo as unknown as Record<string, boolean>)[f.key];
                return (
                  <label key={f.key} style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    background: checked ? '#FFFBF0' : '#FAFAFA',
                    border: `1px solid ${checked ? GOLD : '#E5E7EB'}`,
                    borderRadius: 10, padding: '10px 14px',
                  }}>
                    <input type="checkbox" checked={checked}
                      onChange={e => setClubInfo(p => ({...p, [f.key]: e.target.checked}))}
                      style={{ width: 16, height: 16, accentColor: GOLD }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{f.label}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>ویژگی‌های خاص</label>
              <textarea value={clubInfo.specialFeatures} rows={3}
                placeholder="هر ویژگی خاص باشگاه را بنویسید..."
                onChange={e => setClubInfo(p => ({...p, specialFeatures: e.target.value}))}
                style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <SaveBtn onClick={saveInfo} loading={infoSaving} />
              <button onClick={() => router.push(`/clubs/${selectedClub?.id}`)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.12)',
                background: 'rgba(0,0,0,0.04)', fontSize: 14, cursor: 'pointer',
                fontFamily: 'var(--font-base)', color: '#6B7280',
              }}><Eye size={14} /> مشاهده پروفایل</button>
            </div>
          </Card>

          {/* Bank card card */}
          <Card style={{ border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.02)' }}>
            <SectionTitle>💳 اطلاعات بانکی — دریافت وجه رزرو</SectionTitle>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.7 }}>
              کاربران از طریق <strong>درگاه بانکی امن</strong> پرداخت می‌کنند. درآمد رزروها پس از کسر کارمزد سیستم، در دوره‌های تسویه به حساب بانکی شما واریز می‌شود.
            </p>

            {needsIdentity && (
              <div style={{ marginBottom: 16, padding: '13px 15px', borderRadius: 13, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.34)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#A07840', marginBottom: 6 }}>ابتدا هویت خود را تأیید کنید</div>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 11px', lineHeight: 1.95 }}>
                  حساب بانکی باید به نام خود صاحب باشگاه باشد. برای این بررسی، کد ملی و تاریخ تولد تأییدشده لازم است.
                </p>
                <Link href="/profile/verify"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, textDecoration: 'none', fontSize: 12.5, fontWeight: 800, background: 'rgba(199,166,106,0.16)', border: '1px solid rgba(199,166,106,0.45)', color: '#A07840' }}>
                  تأیید کد ملی
                </Link>
              </div>
            )}
            {/* ── نوارِ «تأیید شده» ──
                وقتی حساب تأیید است، همه‌ی فیلدها و هر دو دکمه‌ی استعلام
                قفل‌اند. تنها راهِ بازکردن، دکمه‌ی زیر است که تأیید را هم
                باطل می‌کند. */}
            {ibanVerified && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                marginBottom: 16, padding: '11px 15px', borderRadius: 12,
                background: 'rgba(48,197,90,0.07)', border: '1px solid rgba(48,197,90,0.24)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 800, color: '#166534' }}>
                  <CheckCircle size={15} />
                  {bankEditing ? 'در حال تغییر حساب — پس از ذخیره باید دوباره استعلام بگیرید' : 'حساب تأیید شده و قفل است'}
                </div>
                {!bankEditing && (
                  <button type="button" onClick={unlockBank} style={{
                    padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font-base)', background: '#fff',
                    border: '1px solid rgba(0,0,0,0.14)', color: '#6B7280',
                  }}>تغییر حساب</button>
                )}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 14, marginBottom: 20 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>شماره کارت</label>
                <input
                  type="text"
                  value={clubInfo.bankCard}
                  maxLength={19}
                  dir="ltr"
                  inputMode="numeric"
                  readOnly={bankLocked}
                  onChange={e => { if (!bankLocked) setClubInfo(p => ({ ...p, bankCard: formatCard(e.target.value) })); }}
                  placeholder="6037 9911 1234 5678"
                  style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.1em', fontSize: 16, width: '100%', boxSizing: 'border-box', borderRadius: 8, padding: '9px 12px', outline: 'none',
                    background: bankLocked ? '#F3F4F6' : inputStyle.background,
                    color: bankLocked ? '#6B7280' : inputStyle.color,
                    border: cardBad ? '1px solid rgba(178,59,46,0.5)' : inputStyle.border }}
                />
                {cardBad && <div style={{ fontSize: 11.5, color: '#B23B2E', fontWeight: 700, marginTop: 5 }}>شماره کارت معتبر نیست — ۱۶ رقم را دوباره بررسی کنید.</div>}
                {cardBank && <div style={{ fontSize: 11.5, color: '#0E7A38', fontWeight: 700, marginTop: 5 }}>بانک {cardBank}</div>}

                {/* استعلام شبا از شماره کارت — پس از تأیید خاموش */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  <button type="button" onClick={fetchIban}
                    disabled={bankLocked || ibanBusy || !isValidCard(clubInfo.bankCard) || !selectedClub}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10,
                      fontFamily: 'var(--font-base)', fontSize: 12.5, fontWeight: 700,
                      cursor: (bankLocked || ibanBusy || !isValidCard(clubInfo.bankCard)) ? 'not-allowed' : 'pointer',
                      background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.42)', color: '#A07840',
                      opacity: (bankLocked || ibanBusy || !isValidCard(clubInfo.bankCard)) ? 0.5 : 1,
                    }}>
                    {ibanBusy ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Wallet size={14} />}
                    {ibanBusy ? 'در حال استعلام…' : 'دریافت شبا از شماره کارت'}
                  </button>
                  {ibanMsg && (
                    <span style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.9, color: ibanMsg.ok ? '#0E7A38' : '#B23B2E' }}>
                      {ibanMsg.text}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>شماره شبا</label>
                <input
                  type="text"
                  value={clubInfo.iban}
                  maxLength={26}
                  dir="ltr"
                  readOnly={bankLocked}
                  onChange={e => { if (!bankLocked) setClubInfo(p => ({ ...p, iban: formatIban(e.target.value) })); }}
                  placeholder="IR820540102680020817909002"
                  style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.06em', fontSize: 15, width: '100%', boxSizing: 'border-box', borderRadius: 8, padding: '9px 12px', outline: 'none',
                    background: bankLocked ? '#F3F4F6' : inputStyle.background,
                    color: bankLocked ? '#6B7280' : inputStyle.color,
                    border: ibanBad ? '1px solid rgba(178,59,46,0.5)' : inputStyle.border }}
                />
                {ibanBad && <div style={{ fontSize: 11.5, color: '#B23B2E', fontWeight: 700, marginTop: 5 }}>شماره شبا معتبر نیست — «IR» به‌همراه ۲۴ رقم.</div>}
                {ibanBank && <div style={{ fontSize: 11.5, color: '#0E7A38', fontWeight: 700, marginTop: 5 }}>بانک {ibanBank} — {prettyIban(clubInfo.iban)}</div>}
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5, lineHeight: 1.9 }}>
                  تسویه‌ی درآمد رزروها به همین شبا انجام می‌شود و باید به نام صاحب باشگاه باشد.
                </div>
                {isValidIban(clubInfo.iban) && !bankLocked && (
                  <button type="button" onClick={verifyIban} disabled={ibanBusy || !selectedClub}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 9, padding: '8px 15px', borderRadius: 10,
                      fontFamily: 'var(--font-base)', fontSize: 12, fontWeight: 700, cursor: ibanBusy ? 'not-allowed' : 'pointer',
                      background: '#fff', border: '1px solid rgba(0,0,0,0.12)', color: '#6B7280', opacity: ibanBusy ? 0.5 : 1,
                    }}>
                    {ibanBusy ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={13} />}
                    تأیید شبا بدون شماره کارت
                  </button>
                )}
              </div>

              {/* نام دارنده و نام بانک خروجیِ استعلام‌اند، نه ورودیِ کاربر —
                  پس از تأیید قفل می‌شوند تا تیکِ سبز روی نامی که دستی
                  عوض شده ننشیند. */}
              <InputField label="نام صاحب حساب" value={clubInfo.bankCardOwner} readOnly={bankLocked}
                hint={bankLocked ? 'از استعلام بانکی — قابل تغییر نیست' : undefined}
                onChange={v => setClubInfo(p => ({ ...p, bankCardOwner: v }))} placeholder="نام و نام خانوادگی" />
              {/* نام بانک هیچ‌وقت ورودی نبوده و نباید باشد: از پیشوندِ خودِ
                  شبا/کارت مشتق می‌شود و همیشه درست است. تا امروز فیلدی
                  آزاد بود که اگر استعلام نامِ بانک را برنمی‌گرداند خالی
                  می‌ماند — دقیقاً همان حالتی که فقط راهنما دیده می‌شد. */}
              <InputField label="نام بانک" readOnly
                value={derivedBankName || clubInfo.bankName}
                hint={derivedBankName ? 'از شماره شبا — قابل تغییر نیست' : 'پس از ثبت شبا یا کارت پر می‌شود'}
                onChange={() => { /* مشتق است */ }} placeholder="—" />
            </div>
            {clubInfo.bankCard && (
              <div style={{ marginBottom: 16, background: 'linear-gradient(135deg,#1e3a5f,#0f2340)', borderRadius: 14, padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 10 }}>پیش‌نمایش کارت</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.15em', fontFamily: 'monospace', direction: 'ltr', marginBottom: 10 }}>{clubInfo.bankCard}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{clubInfo.bankCardOwner || '—'}{clubInfo.bankName ? ` — ${clubInfo.bankName}` : ''}</div>
              </div>
            )}
            <SaveBtn onClick={saveInfo} loading={infoSaving} label="ذخیره اطلاعات بانکی" />
          </Card>

          {/* Stats card */}
          <Card>
            <SectionTitle>آمار باشگاه</SectionTitle>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 16px' }}>
              این اعداد روی صفحه عمومی باشگاه نمایش داده می‌شوند. دو مورد اول
              خودکار شمرده می‌شوند و قابل تغییر نیستند.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 14, marginBottom: 20 }}>
              {/* اعضا و مسابقات شمرده می‌شوند: هر کاربری که این باشگاه را
                  به‌عنوان باشگاهِ خودش انتخاب کند یکی به اولی اضافه می‌شود،
                  و هر مسابقه‌ای که ثبت شود یکی به دومی. از صفر شروع می‌کنند. */}
              <InputField label="اعضای فعال" readOnly
                hint="کاربرانی که این باشگاه را انتخاب کرده‌اند"
                value={liveStats ? liveStats.members.toLocaleString('fa-IR') : '—'}
                onChange={() => { /* شمرده می‌شود */ }} />
              <InputField label="مسابقات" readOnly
                hint="مسابقاتی که برای این باشگاه ثبت شده"
                value={liveStats ? liveStats.tournaments.toLocaleString('fa-IR') : '—'}
                onChange={() => { /* شمرده می‌شود */ }} />
              <InputField label="سال‌ها سابقه"  value={clubStats.yearsActive}   onChange={v => setClubStats(p => ({...p, yearsActive: v}))}   placeholder="مثال: ۱۵" />
              <InputField label="ظرفیت روزانه"  value={clubStats.dailyCapacity} onChange={v => setClubStats(p => ({...p, dailyCapacity: v}))} placeholder="مثال: ۸۰ نفر" />
            </div>
            <SaveBtn onClick={saveStats} loading={statsSaving} label="ذخیره آمار" />
          </Card>
        </div>
      )}

      {/* ════ Tab: Tables ════ */}
      {activeTab === 'tables' && (
        <>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: DARK }}>میزهای باشگاه</h2>
            <button onClick={() => setShowTableForm(v => !v)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(199,166,106,0.14)', color: '#A07840',
              border: '1px solid rgba(199,166,106,0.42)', borderRadius: 20,
              padding: '9px 18px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-base)',
            }}><Plus size={14} /> میز جدید</button>
          </div>

          {(tablesSaving || tablesError) && (
            <div style={{
              marginBottom: 14, padding: '11px 14px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.9,
              background: tablesError ? 'rgba(178,59,46,0.07)' : 'rgba(199,166,106,0.10)',
              border: `1px solid ${tablesError ? 'rgba(178,59,46,0.24)' : 'rgba(199,166,106,0.30)'}`,
              color: tablesError ? '#B23B2E' : '#A07840', fontWeight: 700,
            }}>
              {tablesError || 'در حال ذخیره‌ی میزها روی سرور…'}
            </div>
          )}

          <div style={{ marginBottom: 14, padding: '11px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.03)', fontSize: 12.5, lineHeight: 2, color: '#6B7280' }}>
            فقط میزهایی که در این بخش ثبت می‌کنید در صفحه‌ی رزرو نمایش داده می‌شوند و قابل رزرو هستند.
          </div>

          {showTableForm && (
            <Card style={{ marginBottom: 16, border: `1px solid ${GOLD}44` }}>
              <SectionTitle>افزودن میز جدید</SectionTitle>

              {/* ── Type selector (chips) ── */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>نوع میز</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(TABLE_TYPE_LABELS).map(([k, l]) => {
                    const isSel = tableForm.type === k;
                    const cs = TYPE_CHIP_STYLE[k] ?? { bg: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.15)', color: '#374151' };
                    const isPS = k === 'playstation';
                    return (
                      <button key={k} disabled={isPS}
                        onClick={() => { setTableForm(p => ({...p, type: k})); setTableFormError(''); }}
                        style={{
                          padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: isSel ? 700 : 500,
                          fontFamily: 'var(--font-base)', cursor: isPS ? 'not-allowed' : 'pointer',
                          border: `1.5px solid ${isSel ? cs.border : 'rgba(0,0,0,0.09)'}`,
                          background: isSel ? cs.bg : 'rgba(0,0,0,0.02)',
                          color: isSel ? cs.color : isPS ? '#C4C4C4' : '#374151',
                          backdropFilter: isSel ? 'blur(8px)' : 'none',
                          boxShadow: isSel ? `inset 0 1px 0 ${cs.bg}, 0 2px 8px ${cs.bg}` : 'none',
                          opacity: isPS ? 0.5 : 1,
                          transition: 'all 0.18s',
                        }}>
                        {l}{isPS ? ' (به زودی)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* capacity badge */}
              {(()=>{
                const fieldKey = TYPE_TO_CLUB_FIELD[tableForm.type];
                const capacity = fieldKey ? parseInt((clubInfo as any)[fieldKey] ?? '0', 10) : 0;
                const existing = tables.filter(t => t.type === tableForm.type).length;
                const typeLabel = TABLE_TYPE_LABELS[tableForm.type] || tableForm.type;
                if (tableForm.type === 'playstation') return null;
                return (
                  <div style={{
                    marginBottom: 16, padding: '9px 14px', borderRadius: 10,
                    background: capacity === 0 ? 'rgba(239,68,68,0.06)' : existing >= capacity ? 'rgba(245,158,11,0.07)' : 'rgba(48,197,90,0.06)',
                    border: `1px solid ${capacity === 0 ? 'rgba(239,68,68,0.2)' : existing >= capacity ? 'rgba(245,158,11,0.22)' : 'rgba(48,197,90,0.18)'}`,
                    fontSize: 13, color: capacity === 0 ? '#991B1B' : existing >= capacity ? '#92600A' : '#166534',
                  }}>
                    {capacity === 0
                      ? `شما هیچ میز ${typeLabel} در اطلاعات باشگاه تعریف نکرده‌اید`
                      : `${existing} از ${capacity} میز ${typeLabel} ثبت شده`}
                  </div>
                );
              })()}

              {/* ── مشخصات میز ──
                  چیدمانِ قبلی یک شبکه‌ی `auto-fit minmax(145px)` بود که
                  هر چهار فیلد را هم‌عرض می‌کرد: شماره‌ی دو رقمی همان‌قدر
                  جا می‌گرفت که قیمتِ شش رقمی، و در موبایل ستون‌ها توی هم
                  می‌رفتند. حالا هر فیلد به اندازه‌ی محتوایش عرض دارد و
                  عکس هم کنارشان می‌نشیند نه زیرشان. */}
              <div className="bh-table-form" style={{ marginBottom: 16 }}>
                <div className="bh-tf-fields">
                  <div className="bh-tf-num">
                    <InputField label="شماره میز" type="number" value={tableForm.number}
                      onChange={v => setTableForm(p => ({...p, number: v}))} placeholder="1" />
                  </div>

                  <div className="bh-tf-price" style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>قیمت هر ساعت (تومان)</label>
                    {/* `toLocaleString('en-US')` جداکننده می‌گذاشت ولی ارقام
                        لاتین می‌ماندند — همان چیزی که در فرم دیده می‌شد. */}
                    <FaNumberInput
                      value={tableForm.pricePerHour}
                      onChange={v => setTableForm(p => ({ ...p, pricePerHour: v }))}
                      placeholder="۵۰٬۰۰۰" grouped ariaLabel="قیمت هر ساعت"
                      style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 10px', fontSize: 14, background: '#FAFAFA', color: DARK, outline: 'none', fontFamily: 'var(--font-base)', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                    />
                    {tableForm.pricePerHour && parseInt(tableForm.pricePerHour) > 0 && (
                      <div style={{ fontSize: 11, color: GOLD, lineHeight: 1.7 }}>
                        {numberToFarsi(parseInt(tableForm.pricePerHour))} تومان
                      </div>
                    )}
                  </div>

                  <div className="bh-tf-txt">
                    <InputField label="برند" value={tableForm.brand} ltr
                      onChange={v => setTableForm(p => ({...p, brand: v}))} placeholder="Viraka" />
                  </div>
                  <div className="bh-tf-txt">
                    <InputField label="مدل" value={tableForm.model} ltr
                      onChange={v => setTableForm(p => ({...p, model: v}))} placeholder="M1 Gold" />
                  </div>
                </div>

                {/* عکس میز — کنارِ فیلدها، هم‌ارتفاعِ آن‌ها */}
                <label className="bh-tf-photo" title="عکس میز (اختیاری)" data-photo="add">
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={async e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      const d = await compressImage(f); setTablePhotoDataUrl(d);
                    }} />
                  {tablePhotoDataUrl ? (
                    <>
                      <img loading="lazy" decoding="async" src={tablePhotoDataUrl} alt="" />
                      <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setTablePhotoDataUrl(''); }}
                        aria-label="حذف عکس" className="bh-tf-photo-x">✕</button>
                    </>
                  ) : (
                    <span className="bh-tf-photo-empty">
                      <Camera size={19} color="#9CA3AF" />
                      <span>عکس میز</span>
                    </span>
                  )}
                </label>
              </div>

              <ClosedToggle
                checked={tableForm.reservationClosed}
                onChange={v => setTableForm(p => ({ ...p, reservationClosed: v }))} />

              {tableFormError && (
                <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, fontSize: 13, color: '#991B1B' }}>
                  {tableFormError}
                </div>
              )}

              {/* ── Discount Rules ── */}
              <div style={{ borderTop: '1px solid #F0EDE8', marginTop: 4, paddingTop: 18 }}>
                <SectionTitle>تخفیف‌های زمانی میزها</SectionTitle>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14, lineHeight: 1.7 }}>
                  تخفیف زمانی فقط روی قیمت همین میز اعمال می‌شود (مثلاً صبح‌ها تا ساعت ۱۲، ۲۰٪ تخفیف).
                </p>
                {/* چیدمانِ قبلی flex-wrap با `flex: 1 1 110px` بود؛ کشوهای
                    ساعت پهن‌ترند و در موبایل روی هم می‌افتادند. حالا شبکه‌ای
                    است که در هر عرض ستون‌هایش مشخص است. */}
                <div className="bh-disc-row" style={{ marginBottom: 14 }}>
                  <div className="bh-disc-time">
                    <div className="bh-disc-lb">از ساعت</div>
                    <FaTimeSelect value={discountForm.startTime} onChange={v => setDiscountForm(p => ({ ...p, startTime: v }))} ariaLabel="شروع تخفیف" compact />
                  </div>
                  <div className="bh-disc-time">
                    <div className="bh-disc-lb">تا ساعت</div>
                    <FaTimeSelect value={discountForm.endTime} onChange={v => setDiscountForm(p => ({ ...p, endTime: v }))} ariaLabel="پایان تخفیف" compact />
                  </div>
                  {/* `type="number"` بومی هیچ‌وقت ارقام فارسی نشان نمی‌داد؛
                      FaNumberInput فارسی نمایش می‌دهد و لاتین بیرون می‌دهد.
                      عرضش هم اندازه‌ی یک عددِ دو رقمی است، نه بیشتر. */}
                  <div className="bh-disc-pct">
                    <div className="bh-disc-lb" style={{ textAlign: 'center' }}>٪</div>
                    <FaNumberInput value={discountForm.percent} ariaLabel="درصد تخفیف"
                      onChange={v => setDiscountForm(p => ({ ...p, percent: v.slice(0, 2) }))}
                      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 4px', fontSize: 14, fontFamily: 'var(--font-base)', color: DARK, textAlign: 'center' }} />
                  </div>
                  <div className="bh-disc-label">
                    <div className="bh-disc-lb">برچسب (اختیاری)</div>
                    <input type="text" value={discountForm.label} placeholder="تخفیف صبحگاهی"
                      onChange={e => setDiscountForm(p => ({ ...p, label: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: 'var(--font-base)', color: DARK }} />
                  </div>
                  <button onClick={addDiscount} className="bh-disc-add" style={{
                    padding: '9px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    border: '1px solid rgba(48,197,90,0.35)', background: 'rgba(48,197,90,0.08)',
                    color: '#166534', cursor: 'pointer', fontFamily: 'var(--font-base)', whiteSpace: 'nowrap',
                    boxShadow: 'inset 0 1px 0 rgba(48,197,90,0.12)',
                  }}>+ افزودن</button>
                </div>
                {discounts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '12px 0', color: '#9CA3AF', fontSize: 13 }}>هیچ تخفیف زمانی تعریف نشده</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
                    {discounts.map(d => (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(48,197,90,0.06)', border: '1px solid rgba(48,197,90,0.18)', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span style={{ fontSize: 20, fontWeight: 900, color: '#16a34a' }}>٪{d.percent}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{d.label}</div>
                            <div style={{ fontSize: 12, color: '#6B7280' }}>ساعت {d.startTime} تا {d.endTime}</div>
                          </div>
                        </div>
                        <button onClick={() => removeDiscount(d.id)} style={{
                          padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)',
                          color: '#991B1B', cursor: 'pointer', fontFamily: 'var(--font-base)',
                        }}>حذف</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── هزینه‌ی بازیکن اضافه — برای همین میز ──
                  پیش‌تر یک تنظیم واحد برای کل باشگاه بود، ولی میز VIP
                  اسنوکر و ایرهاکی یک قاعده ندارند. خالی‌گذاشتن یعنی
                  «از تنظیم باشگاه پیروی کن». */}
              <div style={{ borderTop: '1px solid #F0EDE8', marginTop: 4, paddingTop: 18 }}>
                <SectionTitle>هزینه‌ی بازیکن اضافه — برای این میز</SectionTitle>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14, lineHeight: 1.7 }}>
                  اگر خالی بماند، تنظیم عمومی باشگاه روی این میز اعمال می‌شود.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 120px', minWidth: 110 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>از این تعداد</div>
                    <input value={tableForm.surchargeFrom} inputMode="numeric" placeholder="پیش‌فرض باشگاه"
                      onChange={e => setTableForm(p => ({ ...p, surchargeFrom: e.target.value.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))).slice(0, 2) }))}
                      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: 'var(--font-base)', color: DARK, textAlign: 'center' }} />
                  </div>
                  <div style={{ flex: '1 1 120px', minWidth: 110 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>درصد به ازای هر نفر</div>
                    <input value={tableForm.surchargePercent} inputMode="numeric" placeholder="پیش‌فرض باشگاه"
                      onChange={e => setTableForm(p => ({ ...p, surchargePercent: e.target.value.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))).slice(0, 3) }))}
                      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: 'var(--font-base)', color: DARK, textAlign: 'center' }} />
                  </div>
                </div>
                {/* «از X نفر به بالا» با منطق واقعی نمی‌خواند: خودِ عددِ
                    واردشده رایگان است و افزایش از نفرِ بعدی شروع می‌شود
                    (lib/finance/pricing.ts → extraPlayers). */}
                {(tableForm.surchargeFrom || tableForm.surchargePercent) && (
                  <p style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 2, marginTop: 10, marginBottom: 0 }}>
                    تا <b style={{ color: DARK }}>{faDigit(tableForm.surchargeFrom || '2')}</b> نفر بدون افزایش؛
                    از نفر بعد، هر نفر <b style={{ color: DARK }}>{faDigit(tableForm.surchargePercent || '0')}٪</b> به مبلغ رزرو همین میز اضافه می‌شود.
                  </p>
                )}
              </div>

              {/* Action buttons — after discounts, LQ style */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 18, borderTop: '1px solid #F0EDE8' }}>
                <button onClick={addTable} style={{
                  flex: 1, padding: '13px 0', borderRadius: 16, fontSize: 15, fontWeight: 800,
                  border: '1px solid rgba(199,166,106,0.45)',
                  background: 'linear-gradient(135deg,rgba(199,166,106,0.18),rgba(199,166,106,0.08))',
                  backdropFilter: 'blur(40px) saturate(220%)', WebkitBackdropFilter: 'blur(40px) saturate(220%)',
                  color: GOLD, cursor: 'pointer', fontFamily: 'var(--font-base)',
                  boxShadow: 'inset 0 1px 0 rgba(199,166,106,0.22), 0 4px 16px rgba(199,166,106,0.10)',
                  transition: 'all 0.2s',
                }}>+ افزودن میز</button>
                <button onClick={() => { setShowTableForm(false); setTableFormError(''); setTablePhotoDataUrl(''); setDiscounts([]); setDiscountForm({ startTime: '08:00', endTime: '12:00', percent: '20', label: '' }); }} style={{
                  padding: '13px 22px', borderRadius: 16, fontSize: 14, fontWeight: 600,
                  border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.03)',
                  backdropFilter: 'blur(20px)', color: '#6B7280',
                  cursor: 'pointer', fontFamily: 'var(--font-base)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
                }}>انصراف</button>
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tables.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><Grid3X3 size={40} color="#D1D5DB" strokeWidth={1.2} /></div>
                <p style={{ color: '#6B7280', fontSize: 14 }}>هنوز میزی ثبت نشده</p>
              </Card>
            ) : sortTables(tables).map(t => {
              const cs = TYPE_CHIP_STYLE[t.type] ?? { bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.10)', color: '#374151' };
              return (
                <Card key={t.id} style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {t.photoDataUrl ? (
                      <img loading="lazy" decoding="async" src={t.photoDataUrl} alt="" style={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 10, flexShrink: 0, border: `1.5px solid ${cs.border}` }} />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: 12, background: cs.bg, border: `1.5px solid ${cs.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Grid3X3 size={22} color={cs.color} strokeWidth={1.5} /></div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* «میز ۳ — اسنوکر» و نه برعکس: شماره‌ی میز چیزی است
                          که باشگاه‌دار با آن میز را می‌شناسد، پس اول بیاید. */}
                      <div style={{ fontWeight: 700, fontSize: 15, color: DARK, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span>
                          {t.number ? `میز ${t.number} | ` : ''}
                          {TABLE_TYPE_LABELS[t.type] || t.type}
                        </span>
                        {/* بدون این نشان، باشگاه‌دار از فهرست نمی‌فهمید کدام
                            میز بسته است و باید تک‌تک ویرایش را باز می‌کرد. */}
                        {t.reservationClosed && (
                          <span style={{
                            fontSize: 10.5, fontWeight: 800, color: '#B91C1C',
                            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.26)',
                            borderRadius: 20, padding: '2px 9px',
                          }}>رزرو بسته</span>
                        )}
                      </div>
                      {(t.brand || t.model) && (
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{t.brand} {t.model}</div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginTop: 4 }}>
                        {t.pricePerHour > 0 ? `${t.pricePerHour.toLocaleString('fa-IR')} تومان/ساعت` : 'رایگان'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => editingTableId === t.id ? setEditingTableId(null) : startEditTable(t)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        border: `1px solid rgba(199,166,106,${editingTableId === t.id ? '0.55' : '0.32'})`,
                        background: editingTableId === t.id ? 'rgba(199,166,106,0.22)' : 'rgba(199,166,106,0.08)',
                        color: '#A07840', cursor: 'pointer', fontFamily: 'var(--font-base)',
                      }}><Pencil size={12} /> ویرایش</button>
                      <button onClick={() => deleteTable(t.id)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        border: '1px solid rgba(239,68,68,0.28)', background: 'rgba(239,68,68,0.07)',
                        color: '#dc2626', cursor: 'pointer', fontFamily: 'var(--font-base)',
                      }}><Trash2 size={12} /> حذف</button>
                    </div>
                  </div>

                  {editingTableId === t.id && (
                    <div style={{ marginTop: 16, borderTop: '1px solid #F0EDE8', paddingTop: 16 }}>
                      {/* همان چیدمانِ فرمِ افزودن — یک تجربه در هر دو */}
                      <div className="bh-table-form" style={{ marginBottom: 14 }}>
                        <div className="bh-tf-fields">
                          <div className="bh-tf-num">
                            <InputField label="شماره میز" type="number" value={editForm.number}
                              onChange={v => setEditForm(p => ({...p, number: v}))} placeholder="1" />
                          </div>
                          <div className="bh-tf-price" style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>قیمت هر ساعت (تومان)</label>
                            <FaNumberInput
                              value={editForm.pricePerHour}
                              onChange={v => setEditForm(p => ({ ...p, pricePerHour: v }))}
                              placeholder="۵۰٬۰۰۰" grouped ariaLabel="قیمت هر ساعت"
                              style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 10px', fontSize: 14, background: '#FAFAFA', color: DARK, outline: 'none', fontFamily: 'var(--font-base)', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
                            />
                            {editForm.pricePerHour && parseInt(editForm.pricePerHour) > 0 && (
                              <div style={{ fontSize: 11, color: GOLD, lineHeight: 1.7 }}>
                                {numberToFarsi(parseInt(editForm.pricePerHour))} تومان
                              </div>
                            )}
                          </div>
                          <div className="bh-tf-txt">
                            <InputField label="برند" value={editForm.brand} ltr
                              onChange={v => setEditForm(p => ({...p, brand: v}))} placeholder="Viraka" />
                          </div>
                          <div className="bh-tf-txt">
                            <InputField label="مدل" value={editForm.model} ltr
                              onChange={v => setEditForm(p => ({...p, model: v}))} placeholder="M1 Gold" />
                          </div>
                        </div>
                        <label className="bh-tf-photo" title="عکس میز">
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={async e => {
                              const f = e.target.files?.[0]; if (!f) return;
                              const d = await compressImage(f);
                              setEditForm(p => ({...p, photoDataUrl: d}));
                            }} />
                          {editForm.photoDataUrl ? (
                            <>
                              <img loading="lazy" decoding="async" src={editForm.photoDataUrl} alt="" />
                              <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setEditForm(p => ({...p, photoDataUrl: ''})); }}
                                aria-label="حذف عکس" className="bh-tf-photo-x">✕</button>
                            </>
                          ) : (
                            <span className="bh-tf-photo-empty">
                              <Camera size={19} color="#9CA3AF" />
                              <span>عکس میز</span>
                            </span>
                          )}
                        </label>
                      </div>

                      <ClosedToggle compact
                        checked={editForm.reservationClosed}
                        onChange={v => setEditForm(p => ({ ...p, reservationClosed: v }))} />

                      {/* Discount rules in edit form */}
                      <div style={{ borderTop: '1px solid #F0EDE8', marginTop: 4, paddingTop: 14, marginBottom: 14 }}>
                        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700, marginBottom: 10 }}>تخفیف‌های زمانی</div>
                        <div className="bh-disc-row" style={{ marginBottom: 10 }}>
                          <div className="bh-disc-time">
                            <div className="bh-disc-lb">از ساعت</div>
                            <FaTimeSelect value={editDiscountForm.startTime} onChange={v => setEditDiscountForm(p => ({ ...p, startTime: v }))} ariaLabel="شروع تخفیف" compact />
                          </div>
                          <div className="bh-disc-time">
                            <div className="bh-disc-lb">تا ساعت</div>
                            <FaTimeSelect value={editDiscountForm.endTime} onChange={v => setEditDiscountForm(p => ({ ...p, endTime: v }))} ariaLabel="پایان تخفیف" compact />
                          </div>
                          <div className="bh-disc-pct">
                            <div className="bh-disc-lb" style={{ textAlign: 'center' }}>٪</div>
                            <FaNumberInput value={editDiscountForm.percent} ariaLabel="درصد تخفیف"
                              onChange={v => setEditDiscountForm(p => ({ ...p, percent: v.slice(0, 2) }))}
                              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 4px', fontSize: 13, fontFamily: 'var(--font-base)', color: DARK, textAlign: 'center' }} />
                          </div>
                          <div className="bh-disc-label">
                            <div className="bh-disc-lb">برچسب</div>
                            <input type="text" value={editDiscountForm.label} placeholder="تخفیف صبحگاهی"
                              onChange={e => setEditDiscountForm(p => ({ ...p, label: e.target.value }))}
                              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'var(--font-base)', color: DARK }} />
                          </div>
                          <button onClick={addEditDiscount} className="bh-disc-add" style={{
                            padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                            border: '1px solid rgba(48,197,90,0.35)', background: 'rgba(48,197,90,0.08)',
                            color: '#166534', cursor: 'pointer', fontFamily: 'var(--font-base)', whiteSpace: 'nowrap',
                          }}>+ افزودن</button>
                        </div>
                        {editDiscounts.length === 0 ? (
                          <div style={{ fontSize: 12, color: '#9CA3AF', padding: '6px 0' }}>بدون تخفیف زمانی</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {editDiscounts.map(d => (
                              <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(48,197,90,0.06)', border: '1px solid rgba(48,197,90,0.18)', borderRadius: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontSize: 16, fontWeight: 900, color: '#16a34a' }}>٪{d.percent}</span>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{d.label}</div>
                                    <div style={{ fontSize: 11, color: '#6B7280' }}>{d.startTime} تا {d.endTime}</div>
                                  </div>
                                </div>
                                <button onClick={() => removeEditDiscount(d.id)} style={{
                                  padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                  border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)',
                                  color: '#991B1B', cursor: 'pointer', fontFamily: 'var(--font-base)',
                                }}>حذف</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ── هزینه‌ی بازیکن اضافه ──
                          همان بلوکِ فرمِ افزودن. نبودنش یعنی این تنظیم فقط
                          یک‌بار موقع ثبتِ میز قابل تعیین بود و بعد قفل. */}
                      <div style={{ borderTop: '1px solid #F0EDE8', marginTop: 4, paddingTop: 14, marginBottom: 14 }}>
                        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700, marginBottom: 4 }}>هزینه‌ی بازیکن اضافه</div>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 10px', lineHeight: 1.7 }}>
                          خالی بماند یعنی تنظیم عمومی باشگاه روی این میز اعمال می‌شود.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                          <div style={{ flex: '1 1 120px', minWidth: 110 }}>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>از این تعداد</div>
                            <FaNumberInput value={editForm.surchargeFrom} ariaLabel="از این تعداد"
                              placeholder="پیش‌فرض باشگاه"
                              onChange={v => setEditForm(p => ({ ...p, surchargeFrom: v.slice(0, 2) }))}
                              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 8px', fontSize: 13, fontFamily: 'var(--font-base)', color: DARK, textAlign: 'center' }} />
                          </div>
                          <div style={{ flex: '1 1 120px', minWidth: 110 }}>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>درصد به ازای هر نفر</div>
                            <FaNumberInput value={editForm.surchargePercent} ariaLabel="درصد به ازای هر نفر"
                              placeholder="پیش‌فرض باشگاه"
                              onChange={v => setEditForm(p => ({ ...p, surchargePercent: v.slice(0, 3) }))}
                              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 8px', fontSize: 13, fontFamily: 'var(--font-base)', color: DARK, textAlign: 'center' }} />
                          </div>
                        </div>
                        {(editForm.surchargeFrom || editForm.surchargePercent) && (
                          <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.9, marginTop: 8, marginBottom: 0 }}>
                            تا <b style={{ color: DARK }}>{faDigit(editForm.surchargeFrom || '2')}</b> نفر بدون افزایش؛
                            از نفر بعد، هر نفر <b style={{ color: DARK }}>{faDigit(editForm.surchargePercent || '0')}٪</b> به مبلغ رزرو همین میز اضافه می‌شود.
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={saveEditTable} style={{
                          flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '10px 0', borderRadius: 20, fontSize: 14, fontWeight: 700,
                          border: 'rgba(199,166,106,0.42)', background: 'rgba(199,166,106,0.14)',
                          color: '#A07840', cursor: 'pointer', fontFamily: 'var(--font-base)',
                        }}><Check size={14} /> ذخیره تغییرات</button>
                        <button onClick={() => setEditingTableId(null)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '10px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                          border: '1px solid rgba(0,0,0,0.11)', background: 'rgba(0,0,0,0.04)',
                          color: '#6B7280', cursor: 'pointer', fontFamily: 'var(--font-base)',
                        }}>انصراف</button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        </>
      )}

      {/* ════ Tab: Hours ════ */}
      {activeTab === 'hours' && (
        <Card>
          <SectionTitle>ساعات کاری باشگاه</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {DAYS.map(day => {
              const dh: WorkingDay = hoursForm[day.key] ?? { isOpen: true, open: '09:00', close: '23:00' };
              const setDay = (patch: Partial<WorkingDay>) =>
                setHoursForm(p => ({ ...p, [day.key]: { ...dh, ...patch } as WorkingDay }));
              return (
                <div key={day.key} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: dh.isOpen ? '#FFFBF0' : '#F9FAFB',
                  border: `1px solid ${dh.isOpen ? '#FEF3C7' : '#E5E7EB'}`,
                  borderRadius: 12, flexWrap: 'wrap',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 90, cursor: 'pointer' }}>
                    <input type="checkbox" checked={dh.isOpen}
                      onChange={e => setDay({ isOpen: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: GOLD }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{day.label}</span>
                  </label>
                  {dh.isOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>از</span>
                      <FaTimeSelect value={dh.open} onChange={v => setDay({ open: v })} ariaLabel="شروع" />
                      <span style={{ fontSize: 12, color: '#6B7280' }}>تا</span>
                      <FaTimeSelect value={dh.close} onChange={v => setDay({ close: v })} ariaLabel="پایان" />
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: '#9CA3AF' }}>تعطیل</span>
                  )}
                </div>
              );
            })}
          </div>
          <SaveBtn onClick={saveHours} loading={hoursSaving} />
        </Card>
      )}

      {/* ════ Tab: Bookings ════ */}
      {activeTab === 'bookings' && (
        <div>
          {/* ── بستن رزرو روز جاری ──
              این با «بستن موقت» پایین فرق دارد: آن یک بازه‌ی ساعتی است،
              این یک قاعده‌ی ماندگار که هر روز خودش را تکرار می‌کند و
              سر نیمه‌شب تهران روز بعد آزاد می‌شود. در دیتابیس ذخیره
              می‌شود و خود API جلوی رزرو را می‌گیرد — نسخه‌ی قبلی فقط
              در localStorage بود، یعنی روی مرورگر مشتری اثری نداشت. */}
          <Card style={{ marginBottom: 16, padding: 16 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={closeToday} disabled={closeTodayBusy}
                onChange={e => void saveCloseToday(e.target.checked)}
                style={{ width: 17, height: 17, accentColor: '#C7A66A', flexShrink: 0, marginTop: 2 }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#1C1C1A' }}>
                  بستن رزرو امروز
                </span>
                <span style={{ display: 'block', fontSize: 12, color: '#6B7280', lineHeight: 1.95, marginTop: 4 }}>
                  با فعال کردن این گزینه، به‌صورت دایمی امکان رزرو میز برای روز جاری غیرفعال
                  می‌شود ولی رزرو برای روزهای آینده همچنان فعال خواهد بود.
                </span>
              </span>
            </label>
            {closeTodayMsg && (
              <p style={{ margin: '10px 0 0', fontSize: 12, fontWeight: 700, color: closeTodayMsg.ok ? '#0E7A38' : '#B23B2E' }}>
                {closeTodayMsg.text}
              </p>
            )}

            {/* شماره‌ی اطلاع‌رسانی — بسیاری از باشگاه‌ها به نام یک نفرند
                ولی کس دیگری اداره‌شان می‌کند؛ پیامک رزرو باید به دست
                همان کسی برسد که واقعاً میز را آماده می‌کند. */}
            <div style={{ borderTop: '1px solid #F0EDE8', marginTop: 16, paddingTop: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1C1C1A', marginBottom: 4 }}>
                شماره‌ی دریافت پیامک‌ها
              </div>
              <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.95, margin: '0 0 10px' }}>
                پیامک رزروها و اطلاع‌رسانی‌ها به این شماره فرستاده می‌شود.
                اگر خالی بماند، به شماره‌ی خود شما می‌رود.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  value={notifyPhone}
                  onChange={e => setNotifyPhone(
                    e.target.value.replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch))).replace(/[^0-9]/g, '').slice(0, 11),
                  )}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹" inputMode="numeric" dir="ltr"
                  style={{ ...inputStyle, width: 200, marginTop: 0, textAlign: 'right' }}
                />
                <button type="button" onClick={() => void saveNotifyPhone()} disabled={notifyBusy}
                  style={{
                    padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'var(--font-base)',
                    border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)',
                    color: '#9A6E38', opacity: notifyBusy ? 0.6 : 1,
                  }}>ذخیره</button>
                {notifyMsg && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: notifyMsg.ok ? '#0E7A38' : '#B23B2E' }}>
                    {notifyMsg.text}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* ── بستن/بازکردن موقت رزرو آنلاین ── */}
          <Card style={{ marginBottom: 16, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: isReserveClosed ? '#DC2626' : '#16A34A', flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: '#1C1C1A' }}>{reserveClosedLabel}</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>— وقتی بسته باشد، کسی نمی‌تواند از سایت رزرو کند.</span>
            </div>
            {/* «یک روز» حذف شد چون همان کاری را می‌کرد که تیکِ «بستن رزرو
                امروز» — دو راه برای یک نتیجه، با دو ذخیره‌گاهِ متفاوت.
                ساعتی‌ها وقتی امروز بسته است خاموش می‌شوند: بستنِ چند
                ساعت از روزی که تمامش بسته است بی‌معنی است. «همیشه»
                همیشه فعال می‌ماند — تنها گزینه‌ای که ورای امروز می‌رود. */}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {([
                ['۳ ساعت', 3], ['۶ ساعت', 6], ['۱۲ ساعت', 12], ['همیشه', 'always'],
              ] as [string, number | 'always'][]).map(([lbl, opt]) => {
                const off = opt !== 'always' && closeToday;
                return (
                  <button key={lbl} disabled={off || closureBusy}
                    title={off ? 'رزرو امروز از قبل بسته است' : undefined}
                    onClick={() => setReservationClosure(opt)} style={{
                    padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                    cursor: (off || closureBusy) ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-base)',
                    border: '1px solid rgba(199,166,106,0.34)', background: 'rgba(199,166,106,0.12)', color: '#9A6E38',
                    opacity: (off || closureBusy) ? 0.42 : 1,
                  }}>بستن برای {lbl}</button>
                );
              })}
              {isReserveClosed && (
                <button onClick={() => setReservationClosure('open')} style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-base)',
                  border: '1px solid rgba(22,163,74,0.34)', background: 'rgba(22,163,74,0.12)', color: '#0E7A38',
                }}>باز کردن رزرو</button>
              )}
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { key: 'all',       label: 'همه'       },
              { key: 'pending',   label: 'در انتظار' },
              { key: 'confirmed', label: 'تأیید شده' },
              { key: 'active',    label: 'فعال'      },
              { key: 'completed', label: 'تکمیل شده' },
              { key: 'cancelled', label: 'لغو شده'   },
            ].map(f => (
              <button key={f.key} onClick={() => setBookingFilter(f.key)} style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${bookingFilter === f.key ? 'rgba(199,166,106,0.50)' : 'rgba(0,0,0,0.12)'}`,
                background: bookingFilter === f.key ? 'rgba(199,166,106,0.14)' : 'rgba(0,0,0,0.04)',
                color: bookingFilter === f.key ? '#A07840' : '#6B7280',
                fontFamily: 'var(--font-base)',
              }}>{f.label}</button>
            ))}
          </div>
          {bookingsError && (
            <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', color: '#991B1B' }}>
              {bookingsError}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredBookings.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: '#6B7280', fontSize: 14 }}>رزروی در این دسته وجود ندارد</p>
              </Card>
            ) : filteredBookings.map(b => {
              const st = BOOKING_STATUS[b.status] || { label: b.status, color: '#4B5563', bg: '#F3F4F6' };
              return (
                <Card key={b.id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: b.status === 'pending' ? 12 : 0 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: DARK }}>{b.user?.firstName} {b.user?.lastName}</div>
                      {/* همان قالبِ بقیه‌ی سایت: «میز ۱ | اسنوکر» */}
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                        {b.tableNumber ? `میز ${faDigit(String(b.tableNumber))} | ` : ''}
                        {TABLE_TYPE_LABELS[String(b.tableTypeKey ?? b.tableType)] || b.tableType}
                      </div>
                      {/* `startTime`/`endTime` روی رکوردِ رزرو وجود ندارند —
                          تاریخ در `bookingDate` و ساعت‌ها در `timeSlots`
                          ذخیره می‌شوند. به همین دلیل این‌جا فقط «تا» چاپ
                          می‌شد، بدون هیچ زمانی. */}
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                        {faDate(b.bookingDate)}
                        {b.timeSlots ? ` — ${faTimeRange(b.timeSlots)}` : ''}
                      </div>
                      {b.user?.phone && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {b.user.phone}</div>}
                      {/* `final_amount` مبلغِ واقعیِ فاز مالی است؛
                          `totalPrice` ستونِ قدیمی و گاهی خالی است. */}
                      {Number(b.final_amount ?? b.totalPrice) > 0 && (
                        <div style={{ fontSize: 13, color: '#059669', fontWeight: 700, marginTop: 4 }}>
                          {Number(b.final_amount ?? b.totalPrice).toLocaleString('fa-IR')} تومان
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 700, whiteSpace: 'nowrap',
                      background: st.bg, color: st.color,
                    }}>{st.label}</span>
                  </div>
                  {b.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateBookingStatus(b.id, 'confirmed')} style={{
                        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: 'rgba(48,197,90,0.10)', color: '#16a34a',
                        border: '1px solid rgba(48,197,90,0.28)', borderRadius: 20,
                        padding: '9px 0', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-base)', fontWeight: 700,
                      }}><CheckCircle size={14} /> تأیید</button>
                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} style={{
                        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: 'rgba(239,68,68,0.09)', color: '#dc2626',
                        border: '1px solid rgba(239,68,68,0.28)', borderRadius: 20,
                        padding: '9px 0', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-base)', fontWeight: 700,
                      }}><XCircle size={14} /> رد</button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ════ Tab: Tournaments ════ */}
      {activeTab === 'tournaments' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {([['list', 'مسابقات من', false], ['create', 'ثبت مسابقه جدید', true]] as const).map(([k, l, isCreate]) => (
              <button key={k} onClick={() => setTournamentTab(k)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${tournamentTab === k ? 'rgba(199,166,106,0.50)' : 'rgba(0,0,0,0.12)'}`,
                background: tournamentTab === k ? 'rgba(199,166,106,0.14)' : 'rgba(0,0,0,0.04)',
                color: tournamentTab === k ? '#A07840' : '#6B7280',
                fontFamily: 'var(--font-base)',
              }}>
                {isCreate && <Plus size={13} />}{l}
              </button>
            ))}
          </div>

          {tournamentTab === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myTournaments.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><Trophy size={40} color="#D1D5DB" strokeWidth={1.2} /></div>
                  <p style={{ color: '#6B7280', fontSize: 14 }}>هنوز مسابقه‌ای ثبت نشده</p>
                  <button onClick={() => setTournamentTab('create')} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(199,166,106,0.14)', color: '#A07840',
                    border: '1px solid rgba(199,166,106,0.42)', borderRadius: 20,
                    padding: '10px 24px', fontSize: 14, cursor: 'pointer',
                    fontFamily: 'var(--font-base)', fontWeight: 700, marginTop: 12,
                  }}><Plus size={14} /> ثبت اولین مسابقه</button>
                </Card>
              ) : myTournaments.map(t => (
                <Card key={t.id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: DARK }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                        {GAME_TYPE_LABELS[t.gameType]} | {t.date} ساعت {t.startTime}
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                        {t.registeredCount}/{t.maxPlayers} بازیکن | {formatFee(t.entryFee)}
                        {t.matchFormat && ` | ${FORMAT_LABELS[t.matchFormat] ?? t.matchFormat}`}
                      </div>
                      {t.registrationDeadline && (
                        <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>
                          مهلت ثبت‌نام تا {t.registrationDeadline}
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 700, whiteSpace: 'nowrap',
                      background: `${STATUS_COLORS[t.status]}22`, color: STATUS_COLORS[t.status],
                    }}>{STATUS_LABELS[t.status]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    <Link href={`/tournaments/${t.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.11)', color: '#374151' }}><Eye size={12} /> مشاهده</Link>
                    <Link href={`/tournaments/${t.id}/bracket`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.28)', color: '#A07840' }}>براکت</Link>
                    {t.status === 'live' && (
                      <Link href={`/tournaments/${t.id}/live`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.28)', color: '#dc2626' }}>● لایو</Link>
                    )}
                    {/* پنل برگزاری — قرعه‌کشی و ثبت نتیجه. بدون این لینک،
                        هیچ راهی برای رسیدن به صفحه‌ی مدیریت مسابقه نبود.
                        جای دکمه‌ی «ویرایش» را گرفت که هیچ‌وقت onClick نداشت. */}
                    <Link href={`/tournaments/${t.id}/admin`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      textDecoration: 'none',
                      border: '1px solid rgba(199,166,106,0.32)', background: 'rgba(199,166,106,0.08)', color: '#A07840',
                    }}><Settings size={12} /> مدیریت و قرعه‌کشی</Link>
                    <button onClick={() => { if (confirm(`مسابقه «${t.name}» حذف شود؟`)) deleteTournament(t.id); }} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: '1px solid rgba(239,68,68,0.28)', background: 'rgba(239,68,68,0.08)', color: '#dc2626', cursor: 'pointer', fontFamily: 'var(--font-base)',
                    }}><Trash2 size={12} /> حذف</button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tournamentTab === 'create' && (
            <Card>
              <SectionTitle>ثبت مسابقه جدید</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <InputField label="نام مسابقه" value={tForm.name} onChange={v => setTForm(p => ({...p, name: v}))} placeholder="جام اسنوکر تابستان ۱۴۰۵" />
                </div>
                <SelectField label="نوع بازی" value={tForm.gameType} onChange={v => setTForm(p => ({...p, gameType: v as GameType}))}
                  options={[{ value:'snooker',label:'اسنوکر' },{ value:'8ball',label:'ایت بال' },{ value:'9ball',label:'ناین بال' },{ value:'other',label:'سایر' }]} />
                <SelectField label="ظرفیت (نفر)" value={tForm.maxPlayers} onChange={v => setTForm(p => ({...p, maxPlayers: v}))}
                  options={['8','16','32','64'].map(v => ({ value: v, label: v + ' نفر' }))} />
                {/* تاریخ‌ها با همان تقویم شمسی تاریخ تولد انتخاب می‌شوند،
                    نه تایپ آزاد — تایپ آزاد یعنی هر کسی هر قالبی بنویسد
                    و بعد قابل مرتب‌سازی و مقایسه نباشد.
                    maxYear جلو گذاشته شده چون مسابقه در آینده است. */}
                <JalaliDatePicker label="تاریخ برگزاری" value={tForm.date}
                  onChange={v => setTForm(p => ({ ...p, date: v }))}
                  minYear={1404} maxYear={1410} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>ساعت شروع</label>
                  <FaTimeSelect value={tForm.startTime || '14:00'}
                    onChange={v => setTForm(p => ({ ...p, startTime: v }))} ariaLabel="شروع مسابقه" />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <JalaliDatePicker label="مهلت ثبت‌نام" value={tForm.registrationDeadline}
                    onChange={v => setTForm(p => ({ ...p, registrationDeadline: v }))}
                    minYear={1404} maxYear={1410} />
                </div>

                {/* مبلغ: سه‌رقم‌جدا، فارسی، و به حروف زیرش */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>حق ثبت‌نام (تومان)</label>
                  <FaNumberInput value={tForm.entryFee} grouped ariaLabel="حق ثبت‌نام"
                    onChange={v => setTForm(p => ({ ...p, entryFee: v }))}
                    placeholder="۵۰۰٬۰۰۰"
                    style={{ ...inputStyle, marginTop: 0, textAlign: 'center' }} />
                  {tForm.entryFee && parseInt(tForm.entryFee) > 0 && (
                    <div style={{ fontSize: 11, color: GOLD, paddingRight: 2 }}>
                      {numberToFarsi(parseInt(tForm.entryFee))} تومان
                    </div>
                  )}
                </div>

                <SelectField label="فرمت مسابقه" value={tForm.matchFormat}
                  onChange={v => setTForm(p => ({ ...p, matchFormat: v }))}
                  options={[
                    { value: 'bo3',  label: 'Best Of ۳'  },
                    { value: 'bo5',  label: 'Best Of ۵'  },
                    { value: 'bo7',  label: 'Best Of ۷'  },
                    { value: 'bo9',  label: 'Best Of ۹'  },
                    { value: 'bo11', label: 'Best Of ۱۱' },
                  ]} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'توضیحات', key: 'description', rows: 3, ph: '' },
                  { label: 'جوایز', key: 'prizeInfo', rows: 2, ph: '🏆 اول: ... | 🥈 دوم: ...' },
                  { label: 'قوانین', key: 'rules', rows: 4, ph: '• قانون اول\n• قانون دوم' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{f.label}</label>
                    <textarea value={(tForm as Record<string,string>)[f.key]} rows={f.rows} placeholder={f.ph}
                      onChange={e => setTForm(p => ({...p, [f.key]: e.target.value}))}
                      style={inputStyle} />
                  </div>
                ))}
              </div>
              <SectionTitle>روش پرداخت</SectionTitle>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {[{ value:'card_transfer',label:'واریز مستقیم' },{ value:'online',label:'درگاه بانکی' }].map(o => (
                  <label key={o.value} style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    padding: '10px 16px', borderRadius: 10,
                    background: tForm.paymentMethod === o.value ? '#FFFBF0' : '#FAFAFA',
                    border: `1px solid ${tForm.paymentMethod === o.value ? GOLD : '#E5E7EB'}`,
                  }}>
                    <input type="radio" name="paymentMethod" value={o.value}
                      checked={tForm.paymentMethod === o.value}
                      onChange={() => setTForm(p => ({...p, paymentMethod: o.value as 'online'|'card_transfer'}))}
                      style={{ accentColor: GOLD }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{o.label}</span>
                  </label>
                ))}
              </div>
              {tForm.paymentMethod === 'card_transfer' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <InputField label="شماره کارت" value={tForm.cardNumber} onChange={v => setTForm(p => ({...p, cardNumber: v}))} placeholder="6037-XXXX-XXXX-XXXX" />
                  <InputField label="نام صاحب کارت" value={tForm.cardHolder} onChange={v => setTForm(p => ({...p, cardHolder: v}))} />
                  <InputField label="نام بانک" value={tForm.bankName} onChange={v => setTForm(p => ({...p, bankName: v}))} placeholder="ملت" />
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <SaveBtn onClick={createTournament} loading={tLoading} label="ثبت مسابقه" />
                <button onClick={() => setTournamentTab('list')} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 20px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.12)',
                  background: 'rgba(0,0,0,0.04)', fontSize: 14, cursor: 'pointer',
                  fontFamily: 'var(--font-base)', color: '#6B7280',
                }}>انصراف</button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ════ Tab: Finance ════ */}
      {activeTab === 'finance' && selectedClub && (
        <ClubFinance clubId={selectedClub.id} onEditBank={() => setActiveTab('info')} />
      )}

      {/* ════ Tab: Live ════ */}
      {activeTab === 'live' && selectedClub && (
        <GoLive clubId={selectedClub.id} clubName={selectedClub.name} ownerKey={user?.phone || user?.id || 'owner'} />
      )}

      {/* ════ Tab: Gallery ════ */}
      {activeTab === 'gallery' && (
        <div>

          {/* ── Logo / Avatar ── */}
          <Card style={{ marginBottom: 16 }}>
            <SectionTitle>لوگو / آواتار باشگاه</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
                  background: `${GOLD}18`, border: `2px solid ${GOLD}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 900, color: GOLD,
                }}>
                  {selectedClub?.logo
                    ? <img loading="lazy" decoding="async" src={selectedClub.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (selectedClub?.name?.[0] ?? '🎱')}
                </div>
                <label style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: 26, height: 26, borderRadius: '50%',
                  background: GOLD, border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <Camera size={12} color="#fff" />
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ''; }} />
                </label>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 4 }}>{selectedClub?.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
                  روی آیکون دوربین کلیک کنید تا لوگو یا تصویر پروفایل باشگاه را آپلود کنید
                </div>
                {logoUploading && <div style={{ fontSize: 12, color: GOLD, display: 'flex', alignItems: 'center', gap: 5 }}><Loader2 size={12} /> در حال آپلود...</div>}
              </div>
            </div>
          </Card>

          {/* ── Story ── */}
          <Card style={{ marginBottom: 16, border: `1px solid ${GOLD}33`, background: `${GOLD}04` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <SectionTitle style={{ margin: 0 }}>استوری‌های باشگاه ({storyList.length}/10)</SectionTitle>
              {storyList.length < 10 && !storyDraft && (
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '7px 16px', borderRadius: 20,
                  background: `${GOLD}12`, border: `1px solid ${GOLD}44`,
                  fontSize: 13, fontWeight: 700, color: '#A07840',
                  opacity: storyUploading ? 0.5 : 1,
                }}>
                  {storyUploading ? <><Loader2 size={13} /> آپلود...</> : <><Upload size={13} /> استوری جدید</>}
                  <input type="file" accept="image/*,video/*" style={{ display: 'none' }} disabled={storyUploading}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) setStoryDraft({ file: f, previewUrl: URL.createObjectURL(f), text: '' });
                      e.target.value = '';
                    }} />
                </label>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>
              فرمت ۹:۱۶ — عکس یا ویدیو — هر استوری پس از ۲۴ ساعت حذف می‌شود — حداکثر ۱۰ استوری
            </div>

            {/* Draft preview */}
            {storyDraft && (
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', direction: 'ltr', marginBottom: 16 }}>
                <div style={{ position: 'relative', width: 130, flexShrink: 0, aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden', border: `2px solid ${GOLD}55`, background: '#111', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  <img loading="lazy" decoding="async" src={storyDraft.previewUrl} alt="پیش‌نمایش" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {storyDraft.text && (
                    <div style={{
                      position: 'absolute',
                      ...(storyTextPos === 'top' ? { top: 12 } : storyTextPos === 'center' ? { top: '50%', transform: 'translateY(-50%)' } : { bottom: 12 }),
                      left: 6, right: 6,
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                      borderRadius: 8, padding: '5px 7px',
                      color: storyTextColor, fontSize: Math.round(storyTextSize * 0.68),
                      fontWeight: storyTextBold ? 700 : 400,
                      textAlign: storyTextAlign, direction: 'rtl', lineHeight: 1.5,
                    }}>{storyDraft.text}</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 200, direction: 'rtl' }}>
                  <div style={{ padding: '12px', borderRadius: 12, border: `1px solid ${GOLD}33`, background: `${GOLD}04`, marginBottom: 10 }}>
                    <textarea value={storyDraft.text} onChange={e => setStoryDraft(prev => prev ? { ...prev, text: e.target.value } : null)}
                      placeholder="متن روی استوری (اختیاری)..." rows={2}
                      style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, borderRadius: 8, border: `1px solid ${GOLD}44`, background: `${GOLD}06`, padding: '8px 10px', fontSize: 12, color: DARK, fontFamily: 'var(--font-base)', resize: 'none', direction: 'rtl', outline: 'none' }} />
                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 5 }}>رنگ متن</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                      {['#ffffff','#000000','#FFD700','#ef4444','#3b82f6','#22c55e','#f97316','#ec4899','#a855f7','#06b6d4'].map(c => (
                        <button key={c} onClick={() => setStoryTextColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', flexShrink: 0, border: storyTextColor === c ? `2.5px solid ${GOLD}` : '1.5px solid #D1D5DB', boxShadow: storyTextColor === c ? `0 0 0 1px #fff inset` : 'none' }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>اندازه:</span>
                      {([['S',11],['M',15],['L',20],['XL',28]] as [string,number][]).map(([lbl,sz]) => (
                        <button key={lbl} onClick={() => setStoryTextSize(sz)} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${storyTextSize === sz ? GOLD : '#E5E7EB'}`, background: storyTextSize === sz ? `${GOLD}20` : '#fff', color: storyTextSize === sz ? '#A07840' : '#6B7280' }}>{lbl}</button>
                      ))}
                      <button onClick={() => setStoryTextBold(v => !v)} style={{ padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 900, cursor: 'pointer', border: `1px solid ${storyTextBold ? GOLD : '#E5E7EB'}`, background: storyTextBold ? `${GOLD}20` : '#fff', color: storyTextBold ? '#A07840' : '#6B7280' }}>B</button>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>چینش:</span>
                      {([['راست','right'],['وسط','center'],['چپ','left']] as [string,'right'|'center'|'left'][]).map(([lbl,al]) => (
                        <button key={al} onClick={() => setStoryTextAlign(al)} style={{ padding: '2px 7px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: `1px solid ${storyTextAlign === al ? GOLD : '#E5E7EB'}`, background: storyTextAlign === al ? `${GOLD}20` : '#fff', color: storyTextAlign === al ? '#A07840' : '#6B7280' }}>{lbl}</button>
                      ))}
                      <span style={{ fontSize: 11, color: '#6B7280' }}>جایگاه:</span>
                      {([['↑','top'],['↕','center'],['↓','bottom']] as [string,'top'|'center'|'bottom'][]).map(([lbl,pos]) => (
                        <button key={pos} onClick={() => setStoryTextPos(pos)} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 13, cursor: 'pointer', border: `1px solid ${storyTextPos === pos ? GOLD : '#E5E7EB'}`, background: storyTextPos === pos ? `${GOLD}20` : '#fff', color: storyTextPos === pos ? '#A07840' : '#6B7280' }}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => uploadStory(storyDraft.file, storyDraft.text)} disabled={storyUploading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 20, border: '1px solid rgba(199,166,106,0.50)', background: 'rgba(199,166,106,0.16)', color: '#A07840', fontSize: 13, fontWeight: 700, cursor: storyUploading ? 'not-allowed' : 'pointer', opacity: storyUploading ? 0.6 : 1, fontFamily: 'var(--font-base)' }}>{storyUploading ? <><Loader2 size={13} /> آپلود...</> : <><Upload size={13} /> اشتراک‌گذاری</>}</button>
                    <button onClick={() => { URL.revokeObjectURL(storyDraft.previewUrl); setStoryDraft(null); }} disabled={storyUploading} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.11)', background: 'rgba(0,0,0,0.04)', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-base)' }}>انصراف</button>
                  </div>
                </div>
              </div>
            )}

            {/* Story grid */}
            {storyList.length > 0 ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {storyList.map((s, idx) => (
                  <div key={s.id} style={{ position: 'relative', width: 88, flexShrink: 0, aspectRatio: '9/16', borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${GOLD}55`, background: '#111', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    {s.mediaType === 'video'
                      ? <video src={s.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                      : <img loading="lazy" decoding="async" src={s.mediaUrl} alt={`story-${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    {s.text && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '4px 5px', fontSize: 8, color: s.textColor || '#fff', textAlign: 'center', lineHeight: 1.3 }}>{s.text}</div>
                    )}
                    <button onClick={() => deleteStory(s.id)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                    <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '1px 4px', fontSize: 8, color: '#fff' }}>#{idx+1}</div>
                  </div>
                ))}
              </div>
            ) : !storyDraft ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>
                هنوز استوری‌ای آپلود نشده — از دکمه بالا استوری اضافه کنید
              </div>
            ) : null}
          </Card>

          {/* ── Single photos ── */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <SectionTitle style={{ margin: 0 }}>عکس‌های باشگاه</SectionTitle>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                padding: '8px 16px', borderRadius: 20,
                background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.38)',
                fontSize: 13, fontWeight: 700, color: '#A07840',
              }}>
                {uploadingSingle ? <><Loader2 size={13} /> آپلود...</> : <><Camera size={13} /> آپلود عکس</>}
                <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.length) uploadSinglePhotos(e.target.files); e.target.value = ''; }} />
              </label>
            </div>
            {singlePhotos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#9CA3AF', fontSize: 13 }}>
                هنوز عکسی آپلود نشده — از دکمه بالا عکس اضافه کنید
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                {singlePhotos.map(photo => (
                  <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                    <img loading="lazy" decoding="async" src={photo.dataUrl} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => deleteSinglePhoto(photo.id)} style={{
                      position: 'absolute', top: 4, left: 4,
                      background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none',
                      borderRadius: '50%', width: 22, height: 22, fontSize: 12,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Create album */}
          <Card style={{ marginBottom: 16 }}>
            <SectionTitle>ایجاد آلبوم جدید</SectionTitle>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={newAlbumName}
                onChange={e => setNewAlbumName(e.target.value)}
                placeholder="نام آلبوم مثلاً: مسابقات کشوری ۱۴۰۵"
                onKeyDown={e => { if (e.key === 'Enter') createAlbum(); }}
                style={{
                  flex: 1, border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px',
                  fontSize: 14, fontFamily: 'var(--font-base)', color: DARK, outline: 'none',
                  background: '#FAFAFA',
                }}
              />
              <button onClick={createAlbum} disabled={!newAlbumName.trim()} style={{
                background: GOLD, color: '#fff', border: 'none', borderRadius: 10,
                padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font-base)', opacity: newAlbumName.trim() ? 1 : 0.5,
              }}>+ ایجاد</button>
            </div>
          </Card>

          {/* Albums list */}
          {albums.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><ImageIcon size={44} color="#D1D5DB" strokeWidth={1.2} /></div>
              <p style={{ color: '#6B7280', fontSize: 14 }}>هنوز آلبومی ایجاد نشده</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {albums.map(album => {
                const isOpen = openAlbumId === album.id;
                const cover = album.items[0]?.dataUrl;
                return (
                  <Card key={album.id} style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Album header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}
                      onClick={() => setOpenAlbumId(isOpen ? null : album.id)}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                        background: `${GOLD}15`, border: `1px solid ${GOLD}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      }}>
                        {cover
                          ? <img loading="lazy" decoding="async" src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : '🖼'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: DARK }}>{album.name}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                          {album.items.length} تصویر · {new Date(album.createdAt).toLocaleDateString('fa-IR')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={e => { e.stopPropagation(); deleteAlbum(album.id); }}
                          style={{
                            background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8,
                            padding: '5px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-base)',
                          }}>حذف</button>
                        <span style={{ fontSize: 18, color: '#ccc', transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
                      </div>
                    </div>

                    {/* Expanded */}
                    {isOpen && (
                      <div style={{ padding: '0 18px 18px', borderTop: '1px solid #F0EDE8' }}>
                        {/* Upload */}
                        <div style={{ paddingTop: 14, marginBottom: 14 }}>
                          <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                            padding: '9px 18px', borderRadius: 20,
                            background: `${GOLD}12`, border: `1px solid ${GOLD}44`,
                            fontSize: 13, fontWeight: 700, color: '#A07840',
                          }}>
                            {uploadingAlbum === album.id ? <><Loader2 size={12} /> آپلود...</> : <><Camera size={12} /> افزودن تصویر</>}
                            <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                              onChange={e => { if (e.target.files?.length) uploadToAlbum(album.id, e.target.files); e.target.value = ''; }} />
                          </label>
                        </div>

                        {/* Image grid */}
                        {album.items.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                            {album.items.map(item => (
                              <div key={item.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                                <img loading="lazy" decoding="async" src={item.dataUrl} alt={item.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                  onClick={() => deletePhotoFromAlbum(album.id, item.id)}
                                  style={{
                                    position: 'absolute', top: 4, left: 4,
                                    background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none',
                                    borderRadius: '50%', width: 22, height: 22, fontSize: 12,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>×</button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '24px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                            هنوز تصویری اضافه نشده
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════ Tab: Coaches ════ */}
      {activeTab === 'coaches' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: DARK }}>مربیان باشگاه</h2>
            <button onClick={openCoachPicker} style={{
              background: GOLD, color: '#fff', border: 'none', borderRadius: 10,
              padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-base)',
            }}>+ مربی جدید</button>
          </div>

          {/* Coach Picker — inline dropdown */}
          {showCoachPicker && (
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                autoFocus
                type="text" value={coachSearch}
                onChange={e => setCoachSearch(e.target.value)}
                placeholder="نام مربی را تایپ کنید..."
                style={{
                  ...inputStyle, width: '100%', boxSizing: 'border-box',
                  border: `1.5px solid ${GOLD}66`, borderRadius: 10,
                  paddingLeft: 36,
                }}
              />
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 16 }}>🔍</span>
              {/* Dropdown list */}
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                background: '#fff', border: `1px solid ${GOLD}44`,
                borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}>
                {loadingCoaches ? (
                  <div style={{ padding: '14px 16px', color: '#6B7280', fontSize: 13, textAlign: 'center' }}>در حال بارگذاری...</div>
                ) : (() => {
                  const filtered = availableCoaches
                    .filter(c => {
                      const fullName = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
                      return !coachSearch || fullName.toLowerCase().includes(coachSearch.toLowerCase());
                    })
                    .slice(0, 5);
                  if (filtered.length === 0) return (
                    <div style={{ padding: '14px 16px', color: '#6B7280', fontSize: 13, textAlign: 'center' }}>مربی‌ای یافت نشد</div>
                  );
                  return filtered.map(c => {
                    const fullName = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'بدون نام';
                    const alreadyAdded = !!coaches.find(e => e.id === c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => !alreadyAdded && selectCoach(c)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                          cursor: alreadyAdded ? 'default' : 'pointer',
                          opacity: alreadyAdded ? 0.5 : 1,
                          borderBottom: `1px solid #F3F4F6`,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!alreadyAdded) (e.currentTarget as HTMLDivElement).style.background = `${GOLD}0A`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${GOLD},#A07840)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 15, flexShrink: 0 }}>
                          {(c.firstName?.[0] ?? '?')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{fullName}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                            {c.coachProfile?.specialty === 'snooker' ? 'اسنوکر' : c.coachProfile?.specialty === 'pocket' ? 'پاکت بیلیارد' : 'مربی بیلیارد'}
                            {c.city ? ` · ${c.city}` : ''}
                          </div>
                        </div>
                        {c.verificationStatus === 'verified' && (
                          <span style={{ fontSize: 10, color: '#1d9bf0', background: 'rgba(29,155,240,0.08)', border: '1px solid rgba(29,155,240,0.20)', borderRadius: 20, padding: '2px 7px', flexShrink: 0 }}>✓ تأیید</span>
                        )}
                        {alreadyAdded && <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>افزوده شده</span>}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {coaches.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><GraduationCap size={44} color="#D1D5DB" strokeWidth={1.2} /></div>
              <p style={{ color: '#6B7280', fontSize: 14 }}>هنوز مربی‌ای اضافه نشده</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {coaches.map(c => (
                <Card key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: `linear-gradient(135deg,${GOLD},#A07840)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 900, color: '#fff',
                  }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: DARK }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                      {c.title}{c.exp ? ` · ${c.exp}` : ''}
                    </div>
                    {c.bio && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{c.bio}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {c.rating && (
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b' }}>★ {c.rating}</span>
                    )}
                    <button onClick={() => deleteCoach(c.id)} style={{
                      background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8,
                      padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-base)', fontWeight: 600,
                    }}>حذف</button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
