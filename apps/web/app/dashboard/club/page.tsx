'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Check } from 'lucide-react';
import api from '../../../lib/api';
import { uploadFile } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/auth.store';
import {
  GAME_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, formatFee,
  type Tournament, type GameType,
} from '../../../lib/mock-tournaments';

const GOLD = '#C7A66A';
const DARK = '#1A1A18';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Club {
  id: string; name: string; city: string; isActive: boolean;
  bankCard?: string; bankCardOwner?: string; bankName?: string;
  logo?: string;
  storyMediaUrl?: string; storyType?: string; storyExpiresAt?: string; hasActiveStory?: boolean;
}

interface Booking {
  id: string; tableType: string; tableNumber: number;
  startTime: string; endTime: string; status: string; totalPrice: number;
  user: { firstName: string; lastName: string; phone: string; };
}

interface DiscountRule { id: string; startTime: string; endTime: string; percent: number; label: string; }

interface Table {
  id: string; number: number; name: string; type: string;
  brand: string; model: string; pricePerHour: number; isActive: boolean;
  photoDataUrl?: string;
  discountRules?: DiscountRule[];
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

function InputField({ label, value, onChange, type = 'text', placeholder = '', ltr = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; ltr?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder}
        dir={ltr ? 'ltr' : undefined} lang={ltr ? 'en' : undefined}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 12px',
          fontSize: 14, background: '#FAFAFA', color: DARK, outline: 'none',
          fontFamily: ltr ? '"Courier New", Courier, monospace' : 'var(--font-base)',
          textAlign: ltr ? 'left' : undefined,
        }}
      />
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
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 12px',
          fontSize: 14, background: '#FAFAFA', color: DARK, outline: 'none',
          fontFamily: 'var(--font-base)',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SaveBtn({ onClick, loading, label = 'ذخیره تغییرات' }: {
  onClick: () => void; loading: boolean; label?: string;
}) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      background: GOLD, color: '#fff', border: 'none', borderRadius: 10,
      padding: '11px 28px', fontSize: 14, fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
      fontFamily: 'var(--font-base)',
    }}>
      {loading ? 'در حال ذخیره...' : label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type TabKey = 'dashboard' | 'info' | 'tables' | 'hours' | 'bookings' | 'tournaments' | 'gallery' | 'coaches';

export default function ClubDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingFilter, setBookingFilter] = useState('all');

  // Tables
  const [tables, setTables] = useState<Table[]>([]);
  const [showTableForm, setShowTableForm] = useState(false);
  const [tableForm, setTableForm] = useState({ number: '', type: 'snooker', brand: '', model: '', pricePerHour: '' });
  const [tableLoading, setTableLoading] = useState(false);
  const [tableFormError, setTableFormError] = useState('');
  const [tablePhotoDataUrl, setTablePhotoDataUrl] = useState('');
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ number: '', type: 'snooker', brand: '', model: '', pricePerHour: '', photoDataUrl: '' });
  const [editDiscounts, setEditDiscounts] = useState<DiscountRule[]>([]);
  const [editDiscountForm, setEditDiscountForm] = useState({ startTime: '08:00', endTime: '12:00', percent: '20', label: '' });

  // Club info
  const [clubInfo, setClubInfo] = useState({
    name: '', managerName: '', description: '', address: '', city: '',
    country: 'ایران', phone: '', website: '', timezone: 'Asia/Tehran',
    snookerTables: '0', pocketTables: '0', highballTables: '0',
    vipSnookerTables: '0', vipPocketTables: '0', airHockeyTables: '0',
    dartBoards: '0', playstations: '0',
    hasCafe: false, hasParking: false, hasWifi: false, hasProfessionalCoach: false,
    specialFeatures: '',
    bankCard: '', bankCardOwner: '', bankName: '',
  });
  const [infoSaving, setInfoSaving] = useState(false);

  // Stats
  const [clubStats, setClubStats] = useState<ClubStats>(DEFAULT_STATS);
  const [statsSaving, setStatsSaving] = useState(false);
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
    maxPlayers: '16', entryFee: '', prizeInfo: '', rules: '', matchFormat: '',
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
  const [activeStory, setActiveStory] = useState<{ url: string; type: string; expiresAt: string; text?: string } | null>(null);
  const [previousStory, setPreviousStory] = useState<{ url: string; type: string; expiresAt: string; text?: string } | null>(null);
  const [storyText, setStoryText] = useState('');
  const [savingStoryText, setSavingStoryText] = useState(false);
  const [showStoryTextEditor, setShowStoryTextEditor] = useState(false);
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

  const saveTables = useCallback((next: Table[]) => {
    setTables(next);
    try { localStorage.setItem(lsKey('tables'), JSON.stringify(next)); } catch {}
  }, [lsKey]);

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
        managerName: c.managerName ?? '',
        description: c.description ?? '',
        address: c.address ?? '',
        city: c.city ?? '',
        country: c.country ?? 'ایران',
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
      });
      if (c.workingHours) setHoursForm(c.workingHours);
    }).catch(() => {});

    // Load localStorage data
    try {
      const s = localStorage.getItem(`club-stats-${selectedClub.id}`);
      if (s) setClubStats(JSON.parse(s));
      else setClubStats(DEFAULT_STATS);
    } catch { setClubStats(DEFAULT_STATS); }

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

    // Load active story from club data
    if (selectedClub.storyMediaUrl && selectedClub.storyExpiresAt) {
      const expires = new Date(selectedClub.storyExpiresAt);
      if (expires > new Date()) {
        const txt = (selectedClub as any).storyText || '';
        setActiveStory({ url: selectedClub.storyMediaUrl, type: selectedClub.storyType || 'image', expiresAt: selectedClub.storyExpiresAt, text: txt });
        setStoryText(txt);
      } else {
        setActiveStory(null);
        setStoryText('');
      }
    } else {
      setActiveStory(null);
      setStoryText('');
    }

    // Load tables from localStorage — only manually added ones (id starts with 'local-')
    try {
      const t = localStorage.getItem(`club-tables-${selectedClub.id}`);
      if (t) {
        const parsed: Table[] = JSON.parse(t);
        const manual = parsed.filter(row => String(row.id).startsWith('local-'));
        setTables(manual);
        if (manual.length !== parsed.length)
          localStorage.setItem(`club-tables-${selectedClub.id}`, JSON.stringify(manual));
      } else {
        setTables([]);
      }
    } catch { setTables([]); }

    api.get(`/bookings/club/${selectedClub.id}`)
      .then(r => setBookings(r.data))
      .catch(() => {});
  }, [selectedClub]);

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
    };
    saveTables([...tables, newTable]);
    setShowTableForm(false);
    setTableFormError('');
    setTablePhotoDataUrl('');
    setDiscounts([]);
    setDiscountForm({ startTime: '08:00', endTime: '12:00', percent: '20', label: '' });
    setTableForm({ number: '', type: 'snooker', brand: '', model: '', pricePerHour: '' });
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
    } : t));
    setEditingTableId(null);
  };

  const saveInfo = async () => {
    if (!selectedClub) return;
    setInfoSaving(true);
    try { await api.put(`/clubs/${selectedClub.id}`, clubInfo); } catch {}
    finally { setInfoSaving(false); }
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

  const createTournament = async () => {
    if (!selectedClub) return;
    setTLoading(true);
    try {
      const newT: Tournament = {
        id: `t_${uid()}`,
        clubId: selectedClub.id, clubName: selectedClub.name,
        banner: '/images/clubs/club1.png',
        name: tForm.name, description: tForm.description,
        gameType: tForm.gameType, date: tForm.date, startTime: tForm.startTime,
        registrationDeadline: tForm.registrationDeadline,
        maxPlayers: parseInt(tForm.maxPlayers) as 8 | 16 | 32 | 64,
        entryFee: parseFloat(tForm.entryFee) || 0,
        prizeInfo: tForm.prizeInfo, rules: tForm.rules, matchFormat: tForm.matchFormat,
        paymentMethod: tForm.paymentMethod,
        cardNumber: tForm.cardNumber, cardHolder: tForm.cardHolder, bankName: tForm.bankName,
        status: 'upcoming', registeredCount: 0,
      };
      setMyTournaments(ts => [newT, ...ts]);
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
    setStoryUploading(true);
    try {
      const url = await uploadFile('club-media', file, `clubs/${selectedClub.id}/stories/${Date.now()}-${file.name}`);
      if (url) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        await api.put(`/clubs/${selectedClub.id}`, { storyMediaUrl: url, storyType: type, storyExpiresAt: expiresAt, hasActiveStory: true, storyText: text });
        if (activeStory) setPreviousStory(activeStory);
        setActiveStory({ url, type, expiresAt, text });
        setStoryText(text);
        setStoryDraft(null);
        setShowStoryTextEditor(false);
        setStoryTextColor('#ffffff');
        setStoryTextSize(15);
        setStoryTextBold(false);
        setStoryTextAlign('center');
        setStoryTextPos('bottom');
        setSelectedClub(prev => prev ? { ...prev, storyMediaUrl: url, storyType: type, storyExpiresAt: expiresAt, hasActiveStory: true } : prev);
      }
    } catch {}
    setStoryUploading(false);
  };

  const saveStoryText = async () => {
    if (!selectedClub) return;
    setSavingStoryText(true);
    try {
      await api.put(`/clubs/${selectedClub.id}`, { storyText });
      setActiveStory(prev => prev ? { ...prev, text: storyText } : prev);
    } catch {}
    setSavingStoryText(false);
  };

  const removeStory = async () => {
    if (!selectedClub) return;
    setActiveStory(null);
    setPreviousStory(null);
    setShowStoryTextEditor(false);
    setStoryText('');
    setSelectedClub(prev => prev ? { ...prev, storyMediaUrl: undefined, storyExpiresAt: undefined, hasActiveStory: false } : prev);
    try {
      await api.put(`/clubs/${selectedClub.id}`, { storyMediaUrl: null, storyExpiresAt: null, hasActiveStory: false, storyText: null });
    } catch {}
  };

  // Coach actions
  const openCoachPicker = () => {
    setShowCoachPicker(true);
    setCoachSearch('');
    setLoadingCoaches(true);
    api.get('/user/by-role/coach')
      .then(res => { setAvailableCoaches(Array.isArray(res.data) ? res.data : []); })
      .catch(() => setAvailableCoaches([]))
      .finally(() => setLoadingCoaches(false));
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
        <div style={{ fontSize: 56, marginBottom: 12 }}>🏢</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: DARK, margin: '0 0 8px' }}>هنوز باشگاهی ثبت نکردی</h2>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>برای مدیریت باشگاه، ابتدا یک باشگاه ثبت کن.</p>
        <Link href="/clubs/new" style={{
          display: 'inline-block', background: GOLD, color: '#fff',
          padding: '12px 32px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 15,
        }}>
          ثبت باشگاه جدید
        </Link>
      </Card>
    </div>
  );

  // ── Derived ───────────────────────────────────────────────────────────────

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const filteredBookings = bookingFilter === 'all' ? bookings : bookings.filter(b => b.status === bookingFilter);

  const TABS: { key: TabKey; label: string; icon: string; badge?: number }[] = [
    { key: 'dashboard',   label: 'داشبورد',       icon: '📊' },
    { key: 'info',        label: 'اطلاعات',        icon: '📋' },
    { key: 'tables',      label: 'میزها',          icon: '🎱' },
    { key: 'hours',       label: 'ساعات کاری',     icon: '🕐' },
    { key: 'bookings',    label: 'رزروها',          icon: '📅', badge: pendingBookings.length || undefined },
    { key: 'tournaments', label: 'مسابقات',         icon: '🏆' },
    { key: 'gallery',     label: 'گالری',           icon: '📸' },
    { key: 'coaches',     label: 'مربیان',          icon: '👨‍🏫' },
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
          background: GOLD, color: '#fff', padding: '9px 18px', borderRadius: 10,
          fontWeight: 700, textDecoration: 'none', fontSize: 13,
        }}>
          + باشگاه جدید
        </Link>
      </div>

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
                fontSize: 18, flexShrink: 0,
              }}>🏢</div>
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

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 20,
        background: '#fff', borderRadius: 14, padding: 6,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0EDE8',
        scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 5,
            padding: '8px 13px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
            background: activeTab === tab.key ? GOLD : 'transparent',
            color: activeTab === tab.key ? '#fff' : '#6B7280',
            fontFamily: 'var(--font-base)',
          }}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && (
              <span style={{
                background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800,
                width: 18, height: 18, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {[
                { label: 'ثبت مسابقه',    icon: '🏆', action: () => { setActiveTab('tournaments'); setTournamentTab('create'); } },
                { label: 'افزودن میز',    icon: '🎱', action: () => { setActiveTab('tables'); setShowTableForm(true); } },
                { label: 'رزروهای جدید',  icon: '📅', action: () => { setActiveTab('bookings'); setBookingFilter('pending'); } },
                { label: 'ویرایش اطلاعات', icon: '📋', action: () => setActiveTab('info') },
                { label: 'گالری',          icon: '📸', action: () => setActiveTab('gallery') },
                { label: 'مربیان',         icon: '👨‍🏫', action: () => setActiveTab('coaches') },
                { label: 'پروفایل باشگاه', icon: '👁', action: () => router.push(`/clubs/${selectedClub?.id}`) },
              ].map(a => (
                <button key={a.label} onClick={a.action} style={{
                  background: '#F9F7F4', border: '1px solid #EDE8DF', borderRadius: 12,
                  padding: '14px 10px', cursor: 'pointer', textAlign: 'center',
                  fontFamily: 'var(--font-base)',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{a.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{a.label}</div>
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
                        background: '#059669', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-base)',
                      }}>تأیید</button>
                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} style={{
                        background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-base)',
                      }}>رد</button>
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
          <Card style={{ border: '1px solid #FCA5A5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>منطقه خطرناک</span>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>
              حذف باشگاه <strong style={{ color: DARK }}>{selectedClub?.name}</strong> غیرقابل بازگشت است.
              تمام اطلاعات، میزها و رزروها پاک می‌شوند.
            </p>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)} style={{
                background: '#fff', color: '#DC2626', border: '1px solid #FCA5A5',
                borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-base)',
              }}>
                🗑 حذف این باشگاه
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '12px 16px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FCA5A5', fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
                  آیا مطمئن هستید؟ این عمل قابل بازگشت نیست.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={deleteClub} disabled={deleteLoading} style={{
                    background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10,
                    padding: '10px 20px', fontSize: 13, fontWeight: 700,
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    opacity: deleteLoading ? 0.7 : 1, fontFamily: 'var(--font-base)',
                  }}>
                    {deleteLoading ? 'در حال حذف...' : 'بله، حذف کن'}
                  </button>
                  <button onClick={() => setDeleteConfirm(false)} style={{
                    background: '#fff', color: DARK, border: '1px solid #E5E7EB',
                    borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600,
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
              <InputField label="نام مدیر"     value={clubInfo.managerName} onChange={v => setClubInfo(p => ({...p, managerName: v}))} />
              <InputField label="شهر"          value={clubInfo.city}        onChange={v => setClubInfo(p => ({...p, city: v}))} />
              <InputField label="کشور"         value={clubInfo.country}     onChange={v => setClubInfo(p => ({...p, country: v}))} />
              <InputField label="آدرس"         value={clubInfo.address}     onChange={v => setClubInfo(p => ({...p, address: v}))} placeholder="آدرس کامل" />
              <InputField label="تلفن"         value={clubInfo.phone}       onChange={v => setClubInfo(p => ({...p, phone: v}))} placeholder="021-..." />
              <InputField label="وبسایت"       value={clubInfo.website}     onChange={v => setClubInfo(p => ({...p, website: v}))} placeholder="https://..." />
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
                { key: 'hasProfessionalCoach', label: 'مربی حرفه‌ای' },
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
                padding: '11px 20px', borderRadius: 10, border: '1px solid #E5E7EB',
                background: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-base)', color: DARK,
              }}>مشاهده پروفایل</button>
            </div>
          </Card>

          {/* Bank card card */}
          <Card style={{ border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.02)' }}>
            <SectionTitle>💳 اطلاعات بانکی — دریافت وجه رزرو</SectionTitle>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.7 }}>
              کاربران از طریق <strong>درگاه بانکی امن</strong> پرداخت می‌کنند. درآمد رزروها پس از کسر کارمزد سیستم، در دوره‌های تسویه به حساب بانکی شما واریز می‌شود.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 14, marginBottom: 20 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>شماره کارت</label>
                <input
                  type="text"
                  value={clubInfo.bankCard}
                  maxLength={19}
                  dir="ltr"
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                    const formatted = digits.replace(/(.{4})/g, '$1-').replace(/-$/, '');
                    setClubInfo(p => ({ ...p, bankCard: formatted }));
                  }}
                  placeholder="1234-5678-9012-3456"
                  style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.1em', fontSize: 16, width: '100%', boxSizing: 'border-box', borderRadius: 8, padding: '9px 12px', outline: 'none' }}
                />
              </div>
              <InputField label="نام صاحب حساب" value={clubInfo.bankCardOwner}
                onChange={v => setClubInfo(p => ({ ...p, bankCardOwner: v }))} placeholder="نام و نام خانوادگی" />
              <InputField label="نام بانک" value={clubInfo.bankName}
                onChange={v => setClubInfo(p => ({ ...p, bankName: v }))} placeholder="مثلاً ملی، صادرات..." />
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
              این اعداد روی صفحه عمومی باشگاه نمایش داده می‌شوند.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 14, marginBottom: 20 }}>
              <InputField label="اعضای فعال"   value={clubStats.members}       onChange={v => setClubStats(p => ({...p, members: v}))}       placeholder="مثال: ۱,۲۰۰+" />
              <InputField label="مسابقات"       value={clubStats.tournaments}   onChange={v => setClubStats(p => ({...p, tournaments: v}))}   placeholder="مثال: ۴۸" />
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
              background: GOLD, color: '#fff', border: 'none', borderRadius: 10,
              padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-base)',
            }}>+ میز جدید</button>
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

              {/* fields grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 16 }}>
                <InputField label="شماره میز" type="number" value={tableForm.number}
                  onChange={v => setTableForm(p => ({...p, number: v}))} placeholder="1" />

                {/* price with thousands + words */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>قیمت هر ساعت (تومان)</label>
                  <input
                    type="text" inputMode="numeric"
                    value={tableForm.pricePerHour ? Number(tableForm.pricePerHour).toLocaleString('en-US') : ''}
                    placeholder="50,000"
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setTableForm(p => ({...p, pricePerHour: raw}));
                    }}
                    style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 12px', fontSize: 14, background: '#FAFAFA', color: DARK, outline: 'none', fontFamily: 'var(--font-base)' }}
                  />
                  {tableForm.pricePerHour && parseInt(tableForm.pricePerHour) > 0 && (
                    <div style={{ fontSize: 11, color: GOLD, marginTop: 1, paddingRight: 2 }}>
                      {numberToFarsi(parseInt(tableForm.pricePerHour))} تومان
                    </div>
                  )}
                </div>

                <InputField label="برند" value={tableForm.brand} ltr
                  onChange={v => setTableForm(p => ({...p, brand: v}))} placeholder="Viraka" />
                <InputField label="مدل" value={tableForm.model} ltr
                  onChange={v => setTableForm(p => ({...p, model: v}))} placeholder="M1 Gold" />
              </div>

              {/* photo upload */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>عکس میز (اختیاری)</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={async e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      const d = await compressImage(f); setTablePhotoDataUrl(d);
                    }} />
                  {tablePhotoDataUrl ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={tablePhotoDataUrl} alt="" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 10, border: `1.5px solid ${GOLD}55` }} />
                      <button onClick={e => { e.preventDefault(); setTablePhotoDataUrl(''); }}
                        style={{ position: 'absolute', top: -6, left: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ width: 120, height: 80, borderRadius: 10, border: '1.5px dashed #D1D5DB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'rgba(0,0,0,0.02)' }}>
                      <span style={{ fontSize: 20 }}>📷</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>انتخاب عکس</span>
                    </div>
                  )}
                </label>
              </div>

              {tableFormError && (
                <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, fontSize: 13, color: '#991B1B' }}>
                  {tableFormError}
                </div>
              )}

              {/* ── Discount Rules ── */}
              <div style={{ borderTop: '1px solid #F0EDE8', marginTop: 4, paddingTop: 18 }}>
                <SectionTitle>تخفیف‌های زمانی میزها</SectionTitle>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14, lineHeight: 1.7 }}>
                  تخفیف زمانی روی قیمت همه میزها اعمال می‌شود (مثلاً صبح‌ها تا ساعت ۱۲، ۲۰٪ تخفیف).
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14, alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 110px', minWidth: 100 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>از ساعت</div>
                    <input type="time" value={discountForm.startTime}
                      onChange={e => setDiscountForm(p => ({ ...p, startTime: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: 'var(--font-base)', color: DARK }} />
                  </div>
                  <div style={{ flex: '1 1 110px', minWidth: 100 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>تا ساعت</div>
                    <input type="time" value={discountForm.endTime}
                      onChange={e => setDiscountForm(p => ({ ...p, endTime: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: 'var(--font-base)', color: DARK }} />
                  </div>
                  <div style={{ flex: '0 0 70px', minWidth: 60 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>٪</div>
                    <input type="number" min="1" max="99" value={discountForm.percent}
                      onChange={e => setDiscountForm(p => ({ ...p, percent: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: 'var(--font-base)', color: DARK }} />
                  </div>
                  <div style={{ flex: '1 1 110px', minWidth: 100 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>برچسب (اختیاری)</div>
                    <input type="text" value={discountForm.label} placeholder="تخفیف صبحگاهی"
                      onChange={e => setDiscountForm(p => ({ ...p, label: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: 'var(--font-base)', color: DARK }} />
                  </div>
                  <button onClick={addDiscount} style={{
                    padding: '9px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    border: '1px solid rgba(48,197,90,0.35)', background: 'rgba(48,197,90,0.08)',
                    backdropFilter: 'blur(20px)', color: '#166534',
                    cursor: 'pointer', fontFamily: 'var(--font-base)', whiteSpace: 'nowrap',
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
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎱</div>
                <p style={{ color: '#6B7280', fontSize: 14 }}>هنوز میزی ثبت نشده</p>
              </Card>
            ) : tables.map(t => {
              const cs = TYPE_CHIP_STYLE[t.type] ?? { bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.10)', color: '#374151' };
              return (
                <Card key={t.id} style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {t.photoDataUrl ? (
                      <img src={t.photoDataUrl} alt="" style={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 10, flexShrink: 0, border: `1.5px solid ${cs.border}` }} />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: 12, background: cs.bg, border: `1.5px solid ${cs.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🎱</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: DARK, marginBottom: 2 }}>
                        {TABLE_TYPE_LABELS[t.type] || t.type}
                        {t.number ? ` — میز ${t.number}` : ''}
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
                        padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${editingTableId === t.id ? GOLD : GOLD + '55'}`,
                        background: editingTableId === t.id ? GOLD : `${GOLD}11`,
                        color: editingTableId === t.id ? '#fff' : GOLD,
                        cursor: 'pointer', fontFamily: 'var(--font-base)',
                      }}>ویرایش</button>
                      <button onClick={() => deleteTable(t.id)} style={{
                        padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)',
                        color: '#991B1B', cursor: 'pointer', fontFamily: 'var(--font-base)',
                        boxShadow: 'inset 0 1px 0 rgba(239,68,68,0.08)',
                      }}>حذف</button>
                    </div>
                  </div>

                  {editingTableId === t.id && (
                    <div style={{ marginTop: 16, borderTop: '1px solid #F0EDE8', paddingTop: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 14 }}>
                        <InputField label="شماره میز" type="number" value={editForm.number}
                          onChange={v => setEditForm(p => ({...p, number: v}))} placeholder="1" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>قیمت هر ساعت (تومان)</label>
                          <input
                            type="text" inputMode="numeric"
                            value={editForm.pricePerHour ? Number(editForm.pricePerHour).toLocaleString('en-US') : ''}
                            placeholder="50,000"
                            onChange={e => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              setEditForm(p => ({...p, pricePerHour: raw}));
                            }}
                            style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 12px', fontSize: 14, background: '#FAFAFA', color: DARK, outline: 'none', fontFamily: 'var(--font-base)' }}
                          />
                        </div>
                        <InputField label="برند" value={editForm.brand} ltr
                          onChange={v => setEditForm(p => ({...p, brand: v}))} placeholder="Viraka" />
                        <InputField label="مدل" value={editForm.model} ltr
                          onChange={v => setEditForm(p => ({...p, model: v}))} placeholder="M1 Gold" />
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>عکس میز</div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={async e => {
                              const f = e.target.files?.[0]; if (!f) return;
                              const d = await compressImage(f);
                              setEditForm(p => ({...p, photoDataUrl: d}));
                            }} />
                          {editForm.photoDataUrl ? (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img src={editForm.photoDataUrl} alt="" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 10, border: `1.5px solid ${GOLD}55` }} />
                              <button onClick={e => { e.preventDefault(); setEditForm(p => ({...p, photoDataUrl: ''})); }}
                                style={{ position: 'absolute', top: -6, left: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            </div>
                          ) : (
                            <div style={{ width: 120, height: 80, borderRadius: 10, border: '1.5px dashed #D1D5DB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'rgba(0,0,0,0.02)' }}>
                              <span style={{ fontSize: 20 }}>📷</span>
                              <span style={{ fontSize: 11, color: '#9CA3AF' }}>عوض کردن عکس</span>
                            </div>
                          )}
                        </label>
                      </div>
                      {/* Discount rules in edit form */}
                      <div style={{ borderTop: '1px solid #F0EDE8', marginTop: 4, paddingTop: 14, marginBottom: 14 }}>
                        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 700, marginBottom: 10 }}>تخفیف‌های زمانی</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
                          <div style={{ flex: '1 1 100px', minWidth: 90 }}>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>از ساعت</div>
                            <input type="time" value={editDiscountForm.startTime}
                              onChange={e => setEditDiscountForm(p => ({ ...p, startTime: e.target.value }))}
                              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 8px', fontSize: 13, fontFamily: 'var(--font-base)', color: DARK }} />
                          </div>
                          <div style={{ flex: '1 1 100px', minWidth: 90 }}>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>تا ساعت</div>
                            <input type="time" value={editDiscountForm.endTime}
                              onChange={e => setEditDiscountForm(p => ({ ...p, endTime: e.target.value }))}
                              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 8px', fontSize: 13, fontFamily: 'var(--font-base)', color: DARK }} />
                          </div>
                          <div style={{ flex: '0 0 60px', minWidth: 55 }}>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>٪</div>
                            <input type="number" min="1" max="99" value={editDiscountForm.percent}
                              onChange={e => setEditDiscountForm(p => ({ ...p, percent: e.target.value }))}
                              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 8px', fontSize: 13, fontFamily: 'var(--font-base)', color: DARK }} />
                          </div>
                          <div style={{ flex: '1 1 100px', minWidth: 90 }}>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>برچسب</div>
                            <input type="text" value={editDiscountForm.label} placeholder="تخفیف صبحگاهی"
                              onChange={e => setEditDiscountForm(p => ({ ...p, label: e.target.value }))}
                              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 8px', fontSize: 13, fontFamily: 'var(--font-base)', color: DARK }} />
                          </div>
                          <button onClick={addEditDiscount} style={{
                            padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
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

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={saveEditTable} style={{
                          flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
                          border: `1px solid ${GOLD}55`, background: `${GOLD}18`,
                          color: GOLD, cursor: 'pointer', fontFamily: 'var(--font-base)',
                        }}>ذخیره تغییرات</button>
                        <button onClick={() => setEditingTableId(null)} style={{
                          padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                          border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.03)',
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
                      <input type="time" value={dh.open} onChange={e => setDay({ open: e.target.value })}
                        style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', fontSize: 14, fontFamily: 'var(--font-base)', color: DARK, background: '#fff' }} />
                      <span style={{ fontSize: 12, color: '#6B7280' }}>تا</span>
                      <input type="time" value={dh.close} onChange={e => setDay({ close: e.target.value })}
                        style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', fontSize: 14, fontFamily: 'var(--font-base)', color: DARK, background: '#fff' }} />
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
                border: `1px solid ${bookingFilter === f.key ? GOLD : '#E5E7EB'}`,
                background: bookingFilter === f.key ? GOLD : '#fff',
                color: bookingFilter === f.key ? '#fff' : '#6B7280',
                fontFamily: 'var(--font-base)',
              }}>{f.label}</button>
            ))}
          </div>
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
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                        {TABLE_TYPE_LABELS[b.tableType] || b.tableType} — میز {b.tableNumber}
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                        {toPersianDate(b.startTime)} تا {toPersianDate(b.endTime)}
                      </div>
                      {b.user?.phone && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>📞 {b.user.phone}</div>}
                      {b.totalPrice > 0 && (
                        <div style={{ fontSize: 13, color: '#059669', fontWeight: 700, marginTop: 4 }}>
                          {b.totalPrice.toLocaleString('fa-IR')} تومان
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
                        flex: 1, background: '#059669', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '9px 0', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-base)', fontWeight: 600,
                      }}>✅ تأیید</button>
                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} style={{
                        flex: 1, background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '9px 0', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-base)', fontWeight: 600,
                      }}>❌ رد</button>
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
            {([['list', 'مسابقات من'], ['create', '+ ثبت مسابقه جدید']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTournamentTab(k)} style={{
                padding: '9px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${tournamentTab === k ? GOLD : '#E5E7EB'}`,
                background: tournamentTab === k ? GOLD : '#fff',
                color: tournamentTab === k ? '#fff' : '#6B7280',
                fontFamily: 'var(--font-base)',
              }}>{l}</button>
            ))}
          </div>

          {tournamentTab === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myTournaments.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
                  <p style={{ color: '#6B7280', fontSize: 14 }}>هنوز مسابقه‌ای ثبت نشده</p>
                  <button onClick={() => setTournamentTab('create')} style={{
                    background: GOLD, color: '#fff', border: 'none', borderRadius: 10,
                    padding: '10px 24px', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-base)', fontWeight: 700, marginTop: 12,
                  }}>ثبت اولین مسابقه</button>
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
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 700, whiteSpace: 'nowrap',
                      background: `${STATUS_COLORS[t.status]}22`, color: STATUS_COLORS[t.status],
                    }}>{STATUS_LABELS[t.status]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link href={`/tournaments/${t.id}`} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: '#F3F4F6', color: DARK }}>مشاهده</Link>
                    <Link href={`/tournaments/${t.id}/bracket`} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: '#EDE8DF', color: DARK }}>براکت</Link>
                    {t.status === 'live' && (
                      <Link href={`/tournaments/${t.id}/live`} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: '#FEE2E2', color: '#991B1B' }}>🔴 لایو</Link>
                    )}
                    <button style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: 'none', background: `${GOLD}22`, color: GOLD, cursor: 'pointer', fontFamily: 'var(--font-base)',
                    }}>ویرایش</button>
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
                <InputField label="تاریخ برگزاری" value={tForm.date} onChange={v => setTForm(p => ({...p, date: v}))} placeholder="۱۵ مرداد ۱۴۰۵" />
                <InputField label="ساعت شروع" value={tForm.startTime} onChange={v => setTForm(p => ({...p, startTime: v}))} placeholder="۱۴:۰۰" />
                <div style={{ gridColumn: '1 / -1' }}>
                  <InputField label="مهلت ثبت‌نام" value={tForm.registrationDeadline} onChange={v => setTForm(p => ({...p, registrationDeadline: v}))} placeholder="۱۰ مرداد ۱۴۰۵" />
                </div>
                <InputField label="حق ثبت‌نام (تومان)" type="number" value={tForm.entryFee} onChange={v => setTForm(p => ({...p, entryFee: v}))} placeholder="500000" />
                <InputField label="فرمت مسابقه" value={tForm.matchFormat} onChange={v => setTForm(p => ({...p, matchFormat: v}))} placeholder="bo3 / bo5 / حذفی" />
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
                  padding: '11px 20px', borderRadius: 10, border: '1px solid #E5E7EB',
                  background: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-base)', color: DARK,
                }}>انصراف</button>
              </div>
            </Card>
          )}
        </div>
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
                    ? <img src={selectedClub.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (selectedClub?.name?.[0] ?? '🎱')}
                </div>
                <label style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: 26, height: 26, borderRadius: '50%',
                  background: GOLD, border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 13,
                }}>
                  📷
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ''; }} />
                </label>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 4 }}>{selectedClub?.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
                  روی آیکون دوربین کلیک کنید تا لوگو یا تصویر پروفایل باشگاه را آپلود کنید
                </div>
                {logoUploading && <div style={{ fontSize: 12, color: GOLD }}>⏳ در حال آپلود...</div>}
              </div>
            </div>
          </Card>

          {/* ── Story ── */}
          <Card style={{ marginBottom: 16, border: `1px solid ${GOLD}33`, background: `${GOLD}04` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <SectionTitle style={{ margin: 0 }}>استوری باشگاه</SectionTitle>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                padding: '8px 16px', borderRadius: 20,
                background: `${GOLD}12`, border: `1px solid ${GOLD}44`,
                fontSize: 13, fontWeight: 700, color: '#A07840',
                boxShadow: `inset 0 1px 0 rgba(199,166,106,0.15)`,
                opacity: storyUploading ? 0.5 : 1,
              }}>
                {storyUploading ? '⏳ در حال آپلود...' : '📲 انتخاب تصویر'}
                <input type="file" accept="image/*,video/*" style={{ display: 'none' }} disabled={storyUploading}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const previewUrl = URL.createObjectURL(f);
                      setStoryDraft({ file: f, previewUrl, text: '' });
                    }
                    e.target.value = '';
                  }} />
              </label>
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14, lineHeight: 1.6 }}>
              فرمت استاندارد ۹:۱۶ (مثل اینستاگرام) — عکس یا ویدیو — پس از ۲۴ ساعت به‌صورت خودکار حذف می‌شود
            </div>
            {activeStory ? (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap', direction: 'ltr' }}>
                {/* Previous story — dimmed, shifted to the left */}
                {previousStory && (
                  <div style={{ position: 'relative', width: 88, flexShrink: 0, aspectRatio: '9/16', borderRadius: 10, overflow: 'hidden', border: `1px solid ${GOLD}33`, background: '#111', opacity: 0.45, filter: 'grayscale(20%)' }}>
                    {previousStory.type === 'video'
                      ? <video src={previousStory.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                      : <img src={previousStory.url} alt="استوری قبلی" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', padding: '4px 6px', textAlign: 'center' }}>
                      <span style={{ color: '#fff', fontSize: 9, fontWeight: 600 }}>استوری قبلی</span>
                    </div>
                  </div>
                )}
                {/* Active story preview */}
                <div style={{ position: 'relative', width: 140, flexShrink: 0, aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden', border: `2px solid ${GOLD}55`, background: '#111', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  {activeStory.type === 'video'
                    ? <video src={activeStory.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                    : <img src={activeStory.url} alt="story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {storyText && (
                    <div style={{
                      position: 'absolute',
                      ...(storyTextPos === 'top' ? { top: 14 } : storyTextPos === 'center' ? { top: '50%', transform: 'translateY(-50%)' } : { bottom: 14 }),
                      left: 8, right: 8,
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                      borderRadius: 8, padding: '6px 8px',
                      color: storyTextColor, fontSize: Math.round(storyTextSize * 0.72),
                      fontWeight: storyTextBold ? 700 : 400,
                      textAlign: storyTextAlign, direction: 'rtl', lineHeight: 1.5,
                    }}>{storyText}</div>
                  )}
                </div>
                {/* Controls */}
                <div style={{ flex: 1, minWidth: 200, direction: 'rtl' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#30C55A', display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>استوری فعال</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
                    انقضا: {new Date(activeStory.expiresAt).toLocaleString('fa-IR')}
                  </div>
                  {/* Text editor panel */}
                  {showStoryTextEditor && (
                    <div style={{ marginBottom: 14, padding: '12px', borderRadius: 12, border: `1px solid ${GOLD}33`, background: `${GOLD}04` }}>
                      <textarea
                        value={storyText}
                        onChange={e => setStoryText(e.target.value)}
                        placeholder="متن دلخواه را اینجا بنویسید..."
                        rows={2}
                        style={{
                          width: '100%', boxSizing: 'border-box', marginBottom: 10,
                          padding: '8px 10px', borderRadius: 8,
                          border: `1px solid ${GOLD}44`, background: `${GOLD}06`,
                          fontSize: 13, fontFamily: 'var(--font-base)',
                          color: DARK, resize: 'none', outline: 'none',
                          lineHeight: 1.6, direction: 'rtl',
                        }}
                      />
                      {/* Color palette */}
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 5 }}>رنگ متن</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                        {['#ffffff','#000000','#FFD700','#ef4444','#3b82f6','#22c55e','#f97316','#ec4899','#a855f7','#06b6d4'].map(c => (
                          <button key={c} onClick={() => setStoryTextColor(c)} style={{
                            width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', flexShrink: 0,
                            border: storyTextColor === c ? `2.5px solid ${GOLD}` : '1.5px solid #D1D5DB',
                            boxShadow: storyTextColor === c ? `0 0 0 1px #fff inset` : 'none',
                          }} />
                        ))}
                      </div>
                      {/* Size + Bold + Align */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>اندازه:</span>
                        {([['S',11],['M',15],['L',20],['XL',28]] as [string,number][]).map(([lbl,sz]) => (
                          <button key={lbl} onClick={() => setStoryTextSize(sz)} style={{
                            padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            border: `1px solid ${storyTextSize === sz ? GOLD : '#E5E7EB'}`,
                            background: storyTextSize === sz ? `${GOLD}20` : '#fff',
                            color: storyTextSize === sz ? '#A07840' : '#6B7280',
                          }}>{lbl}</button>
                        ))}
                        <button onClick={() => setStoryTextBold(v => !v)} style={{
                          padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 900, cursor: 'pointer',
                          border: `1px solid ${storyTextBold ? GOLD : '#E5E7EB'}`,
                          background: storyTextBold ? `${GOLD}20` : '#fff',
                          color: storyTextBold ? '#A07840' : '#6B7280',
                        }}>B</button>
                      </div>
                      {/* Align + Position */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>چینش:</span>
                        {([['راست','right'],['وسط','center'],['چپ','left']] as [string,'right'|'center'|'left'][]).map(([lbl,al]) => (
                          <button key={al} onClick={() => setStoryTextAlign(al)} style={{
                            padding: '2px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                            border: `1px solid ${storyTextAlign === al ? GOLD : '#E5E7EB'}`,
                            background: storyTextAlign === al ? `${GOLD}20` : '#fff',
                            color: storyTextAlign === al ? '#A07840' : '#6B7280',
                          }}>{lbl}</button>
                        ))}
                        <span style={{ fontSize: 11, color: '#6B7280', marginRight: 4 }}>جایگاه:</span>
                        {([['↑ بالا','top'],['↕ وسط','center'],['↓ پایین','bottom']] as [string,'top'|'center'|'bottom'][]).map(([lbl,pos]) => (
                          <button key={pos} onClick={() => setStoryTextPos(pos)} style={{
                            padding: '2px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                            border: `1px solid ${storyTextPos === pos ? GOLD : '#E5E7EB'}`,
                            background: storyTextPos === pos ? `${GOLD}20` : '#fff',
                            color: storyTextPos === pos ? '#A07840' : '#6B7280',
                          }}>{lbl}</button>
                        ))}
                      </div>
                      <button onClick={async () => { await saveStoryText(); setShowStoryTextEditor(false); }} disabled={savingStoryText} style={{
                        padding: '6px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        cursor: savingStoryText ? 'wait' : 'pointer', border: 'none',
                        background: `linear-gradient(135deg, ${GOLD}, #D4A855)`,
                        color: '#fff', fontFamily: 'var(--font-base)',
                      }}>
                        {savingStoryText ? '⏳ در حال ذخیره...' : '✓ ذخیره'}
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setShowStoryTextEditor(v => !v)} style={{
                      padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', border: `1px solid ${GOLD}55`,
                      background: showStoryTextEditor ? `${GOLD}18` : '#fff',
                      color: '#A07840', fontFamily: 'var(--font-base)',
                    }}>✏️ ادیت متن</button>
                    <label style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                      padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534',
                      fontFamily: 'var(--font-base)',
                    }}>
                      📲 استوری جدید
                      <input type="file" accept="image/*,video/*" style={{ display: 'none' }}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) setStoryDraft({ file: f, previewUrl: URL.createObjectURL(f), text: '' });
                          e.target.value = '';
                        }} />
                    </label>
                    <button onClick={removeStory} style={{
                      background: '#FEE2E2', color: '#991B1B',
                      border: '1px solid #FECACA', borderRadius: 20,
                      padding: '7px 14px', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'var(--font-base)',
                    }}>حذف</button>
                  </div>
                </div>
              </div>
            ) : storyDraft ? (
              /* Draft preview — image selected but not yet uploaded */
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', direction: 'ltr' }}>
                {/* 9:16 preview */}
                <div style={{ position: 'relative', width: 140, flexShrink: 0, aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden', border: `2px solid ${GOLD}55`, background: '#111', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  <img src={storyDraft.previewUrl} alt="پیش‌نمایش استوری" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {storyDraft.text && (
                    <div style={{
                      position: 'absolute',
                      ...(storyTextPos === 'top' ? { top: 14 } : storyTextPos === 'center' ? { top: '50%', transform: 'translateY(-50%)' } : { bottom: 14 }),
                      left: 8, right: 8,
                      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                      borderRadius: 8, padding: '6px 8px',
                      color: storyTextColor, fontSize: Math.round(storyTextSize * 0.72),
                      fontWeight: storyTextBold ? 700 : 400,
                      textAlign: storyTextAlign, direction: 'rtl', lineHeight: 1.5,
                    }}>{storyDraft.text}</div>
                  )}
                </div>
                {/* Controls — RIGHT side */}
                <div style={{ flex: 1, minWidth: 200, direction: 'rtl' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#A07840' }}>پیش‌نمایش استوری</span>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 12, border: `1px solid ${GOLD}33`, background: `${GOLD}04`, marginBottom: 12 }}>
                    <textarea
                      value={storyDraft.text}
                      onChange={e => setStoryDraft(prev => prev ? { ...prev, text: e.target.value } : null)}
                      placeholder="متن روی استوری (اختیاری)..."
                      rows={2}
                      style={{
                        width: '100%', boxSizing: 'border-box', marginBottom: 10,
                        borderRadius: 8, border: `1px solid ${GOLD}44`,
                        background: `${GOLD}06`, padding: '8px 10px',
                        fontSize: 12, color: DARK, fontFamily: 'var(--font-base)',
                        resize: 'none', direction: 'rtl', outline: 'none',
                      }}
                    />
                    {/* Color palette */}
                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 5 }}>رنگ متن</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                      {['#ffffff','#000000','#FFD700','#ef4444','#3b82f6','#22c55e','#f97316','#ec4899','#a855f7','#06b6d4'].map(c => (
                        <button key={c} onClick={() => setStoryTextColor(c)} style={{
                          width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', flexShrink: 0,
                          border: storyTextColor === c ? `2.5px solid ${GOLD}` : '1.5px solid #D1D5DB',
                          boxShadow: storyTextColor === c ? `0 0 0 1px #fff inset` : 'none',
                        }} />
                      ))}
                    </div>
                    {/* Size + Bold */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>اندازه:</span>
                      {([['S',11],['M',15],['L',20],['XL',28]] as [string,number][]).map(([lbl,sz]) => (
                        <button key={lbl} onClick={() => setStoryTextSize(sz)} style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${storyTextSize === sz ? GOLD : '#E5E7EB'}`,
                          background: storyTextSize === sz ? `${GOLD}20` : '#fff',
                          color: storyTextSize === sz ? '#A07840' : '#6B7280',
                        }}>{lbl}</button>
                      ))}
                      <button onClick={() => setStoryTextBold(v => !v)} style={{
                        padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 900, cursor: 'pointer',
                        border: `1px solid ${storyTextBold ? GOLD : '#E5E7EB'}`,
                        background: storyTextBold ? `${GOLD}20` : '#fff',
                        color: storyTextBold ? '#A07840' : '#6B7280',
                      }}>B</button>
                    </div>
                    {/* Align + Position */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>چینش:</span>
                      {([['راست','right'],['وسط','center'],['چپ','left']] as [string,'right'|'center'|'left'][]).map(([lbl,al]) => (
                        <button key={al} onClick={() => setStoryTextAlign(al)} style={{
                          padding: '2px 7px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                          border: `1px solid ${storyTextAlign === al ? GOLD : '#E5E7EB'}`,
                          background: storyTextAlign === al ? `${GOLD}20` : '#fff',
                          color: storyTextAlign === al ? '#A07840' : '#6B7280',
                        }}>{lbl}</button>
                      ))}
                      <span style={{ fontSize: 11, color: '#6B7280' }}>جایگاه:</span>
                      {([['↑','top'],['↕','center'],['↓','bottom']] as [string,'top'|'center'|'bottom'][]).map(([lbl,pos]) => (
                        <button key={pos} onClick={() => setStoryTextPos(pos)} style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                          border: `1px solid ${storyTextPos === pos ? GOLD : '#E5E7EB'}`,
                          background: storyTextPos === pos ? `${GOLD}20` : '#fff',
                          color: storyTextPos === pos ? '#A07840' : '#6B7280',
                        }}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => uploadStory(storyDraft.file, storyDraft.text)} disabled={storyUploading} style={{
                      padding: '8px 20px', borderRadius: 20, border: 'none',
                      background: `linear-gradient(135deg,${GOLD},#8B6914)`,
                      color: '#fff', fontSize: 13, fontWeight: 700,
                      cursor: storyUploading ? 'not-allowed' : 'pointer',
                      opacity: storyUploading ? 0.6 : 1, fontFamily: 'var(--font-base)',
                    }}>{storyUploading ? '⏳ در حال آپلود...' : '🚀 اشتراک‌گذاری'}</button>
                    <button onClick={() => { URL.revokeObjectURL(storyDraft.previewUrl); setStoryDraft(null); }} disabled={storyUploading} style={{
                      padding: '8px 16px', borderRadius: 20, border: `1px solid #E5E7EB`,
                      background: '#F9FAFB', color: '#6B7280', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'var(--font-base)',
                    }}>انصراف</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 13 }}>
                استوری فعالی وجود ندارد — از دکمه بالا استوری جدید اضافه کنید
              </div>
            )}
          </Card>

          {/* ── Single photos ── */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <SectionTitle style={{ margin: 0 }}>عکس‌های باشگاه</SectionTitle>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                padding: '8px 16px', borderRadius: 20,
                background: `${GOLD}12`, border: `1px solid ${GOLD}44`,
                fontSize: 13, fontWeight: 700, color: '#A07840',
                boxShadow: `inset 0 1px 0 rgba(199,166,106,0.15)`,
              }}>
                {uploadingSingle ? '⏳ در حال آپلود...' : '📷 آپلود عکس'}
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
                    <img src={photo.dataUrl} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              <div style={{ fontSize: 44, marginBottom: 10 }}>📸</div>
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
                          ? <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                            {uploadingAlbum === album.id ? '⏳ در حال آپلود...' : '📷 افزودن تصویر'}
                            <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                              onChange={e => { if (e.target.files?.length) uploadToAlbum(album.id, e.target.files); e.target.value = ''; }} />
                          </label>
                        </div>

                        {/* Image grid */}
                        {album.items.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                            {album.items.map(item => (
                              <div key={item.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                                <img src={item.dataUrl} alt={item.name}
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
              <div style={{ fontSize: 44, marginBottom: 10 }}>👨‍🏫</div>
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
