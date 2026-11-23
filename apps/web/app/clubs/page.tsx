'use client';

import { PIN_GREEN } from '@/lib/profile-cards'
import { thumbUrl } from '@/lib/media/thumb'
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import ClubStoryModal from '../../components/ClubStoryModal';
import FavoriteButton from '../../components/FavoriteButton';
import ClubLogo from '../../components/club/ClubLogo';
import VerifiedBadge from '../../components/VerifiedBadge';
import {
  MapPin, Star, Wifi, Car, Coffee, Trophy,
  X, SlidersHorizontal, Users, Navigation,
  ChevronDown, Grid3X3, AlignJustify, Gamepad2,
} from 'lucide-react';
import { type Club } from '../../lib/clubs-data';
import { fetchTournaments } from '../../lib/tournaments/client';
import type { Tournament } from '../../lib/mock-tournaments';
import { tableSummary, TABLE_KINDS } from '../../lib/clubs/tables';
import { faDistance } from '../../lib/clubs/distance';
import { makeMatcher } from '@/lib/search/filter'
import { ListSearch } from '@/components/ui/ListSearch'

const TABLE_TYPES = [
  { key:'snookerTables',    label:'اسنوکر',     color:'#30C55A' },
  { key:'pocketTables',     label:'پاکت',        color:'#3b82f6' },
  { key:'highballTables',   label:'هی‌بال',      color:'#8b5cf6' },
  { key:'vipSnookerTables', label:'VIP',         color:'#f59e0b' },
];
/* رنگِ چیپِ هر نوع — از خودِ TABLE_TYPES، تا دو فهرستِ رنگ از هم جدا نشوند */
const kindColor = (kind: string): string =>
  TABLE_TYPES.find(t => t.key === `${kind}Tables`)?.color ?? '#999';
/* خواندنِ ستونِ عددی/بولیِ باشگاه با نامِ رشته‌ای — جای `(club as any)[key]` */
const num = (c: Club, key: string): number =>
  Number((c as unknown as Record<string, unknown>)[key]) || 0;

const AMENITIES = [
  { key:'hasCafe',              label:'کافه',           icon: <Coffee size={13}/> },
  { key:'hasParking',           label:'پارکینگ',        icon: <Car size={13}/> },
  { key:'hasWifi',              label:'WiFi',           icon: <Wifi size={13}/> },
  { key:'hasProfessionalCoach', label:'مربی',           icon: <Trophy size={13}/> },
  { key:'playstations',         label:'پلی استیشن',     icon: <Gamepad2 size={13}/> },
];
const SORT_OPTIONS = [
  { value:'rating',   label:'بهترین امتیاز' },
  { value:'distance', label:'نزدیک‌ترین' },
  { value:'members',  label:'بیشترین عضو' },
  { value:'tables',   label:'بیشترین میز' },
];

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}
function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const CLUB_IMG_POOL = [
  '/images/clubs/club6.webp',
  '/images/clubs/club7.webp',
  '/images/clubs/club8.webp',
  '/images/clubs/club9.webp',
  '/images/clubs/club4.webp',
  '/images/clubs/club1.webp',
  '/images/clubs/club2.webp',
  '/images/clubs/club3.webp',
];

/* ── CARD ── */
function ClubCard({ club, view, idx = 0, tournaments = [] }: { club: Club; view: 'grid' | 'list'; idx?: number; tournaments?: Tournament[] }) {
  const [hov, setHov] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const poolImg = CLUB_IMG_POOL[idx % CLUB_IMG_POOL.length]!;
  const apiImg  = club.images?.[0];
  /* بندانگشتیِ ۹۶۰: کارتِ شبکه در موبایل تمام‌عرض (~۳۴۰–۵۳۰px) است. عکسِ خامِ
     باشگاه تا ۲٫۳ مگابایت بود؛ این ~۶۰ کیلوبایت. */
  const apiOk   = !!apiImg && apiImg.trim() !== '' && !apiImg.includes('billiadr-club-1') && !apiImg.includes('default');
  const img     = apiOk ? thumbUrl(apiImg, 960) : poolImg;
  /* خطا: اول خودِ عکسِ اصلی (شاید فقط سرویسِ بندانگشتی جواب نداد)، بعد عکسِ پیش‌فرض */
  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    if (apiOk && apiImg && el.src !== apiImg) { el.src = apiImg; return; }
    el.onerror = null; el.src = poolImg;
  };
  /* شمارش از همان منبعِ صفحه‌ی اصلی (lib/clubs/tables): میزِ VIP داخلِ نوعِ
     خودش. پیش‌تر این‌جا ستونِ خام می‌آمد — «۲ اسنوکر»، در حالی که صفحه‌ی اصلی
     همان باشگاه را «۳ اسنوکر» می‌گفت. */
  const sum = tableSummary(club);
  const activeTables = TABLE_KINDS
    .map(k => ({ key: k.key, label: k.label, n: sum[k.key], color: kindColor(k.key) }))
    .filter(t => t.n > 0);

  /* نشان مسابقه از مسابقات واقعی همین باشگاه می‌آید — نه از آرایه‌ی
     نمونه که با نام باشگاه تطبیق داده می‌شد. */
  const activeTournament = tournaments.find(
    t => t.status === 'registration_open' || t.status === 'live' || t.status === 'upcoming'
  );
  const tournBadge = activeTournament ? ({
    registration_open: { label: '● در حال ثبت‌نام مسابقه', color: '#C7A66A', bg: 'rgba(199,166,106,0.10)', border: 'rgba(199,166,106,0.30)', pulse: true  },
    live:              { label: '● مسابقه زنده',         color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.30)',   pulse: true  },
    upcoming:          { label: 'مسابقه به زودی',        color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.28)', pulse: false },
    bracket_ready:     { label: 'براکت آماده',           color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)', pulse: false },
    finished:          { label: 'پایان یافته',           color: '#999',    bg: 'rgba(0,0,0,0.04)',      border: 'rgba(0,0,0,0.10)',      pulse: false },
  } as const)[activeTournament.status] : null;

  if (view === 'list') return (
    <Link href={`/clubs/${club.slug || club.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        /* همان سطح کارت گرید — دو ماده‌ی متفاوت در دو نمای یک فهرست
           یعنی سوییچ نما ظاهر صفحه را عوض می‌کند. */
        className="lq-pcard lc-list"
        style={{
          display: 'flex', alignItems: 'stretch', overflow: 'hidden',
          borderColor: hov ? 'rgba(199,166,106,0.50)' : undefined,
        }}
      >
        {/* thumbnail */}
        <div className="lc-list-img" style={{ flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          <img loading={idx < 2 ? 'eager' : 'lazy'} fetchPriority={idx === 0 ? 'high' : undefined} decoding="async" src={img} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75)' }}
            onError={onImgError} />
          {/* تیک تأیید این‌جا نیست — کنار نام است. روی گوشه‌ی عکس،
              معلوم نبود به چه چیزی تعلق دارد. */}
          {/* open badge روی تصویر — same pill style as table type badges.
              ⚠️ فقط وقتی وضعیت معلوم است: API فهرست ساعتِ کاری نمی‌فرستد،
              پس `isOpen` خالی بود و هر کارت «بسته» می‌گفت. */}
          {typeof club.isOpen === 'boolean' && <div style={{ position: 'absolute', bottom: 8, insetInlineEnd: 8, fontSize: 10, fontWeight: 700, color: club.isOpen ? '#30C55A' : '#ef4444', background: club.isOpen ? 'rgba(48,197,90,0.10)' : 'rgba(239,68,68,0.10)', border: `1px solid ${club.isOpen ? 'rgba(48,197,90,0.22)' : 'rgba(239,68,68,0.22)'}`, borderRadius: 20, padding: '2px 7px' }}>
            {club.isOpen ? 'باز' : 'بسته'}
          </div>}
          {/* story ring */}
          {club.hasActiveStory && club.storyMediaUrl && (
            <button aria-label={`استوری ${club.name}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStoryOpen(true); }} style={{ position: 'absolute', bottom: 8, right: 8, padding: 0, border: 'none', background: 'none', cursor: 'pointer', zIndex: 5 }}>
              <div style={{ width: 47, height: 47, borderRadius: '50%', background: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', padding: 2.5, boxShadow: '0 0 12px rgba(188,24,136,0.5)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid rgba(0,0,0,0.7)', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxSizing: 'border-box' }}>
                  {/* نشان پیش‌فرض به‌جای حرف اول نام */}
                  <ClubLogo src={club.logo} name={club.name} size={40} tone="dark" />
                </div>
              </div>
            </button>
          )}
        </div>

        {/* content */}
        <div className="lc-list-body" style={{ flex: 1, padding: '16px 18px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', maxWidth: '100%' }}>
            {/* تیک بیرون h3 است: نام بلند با ellipsis بریده می‌شود و
                تیک داخل h3 هم با آن حذف می‌شد. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <h3 className="lc-title" style={{ fontSize: 16, fontWeight: 800, color: '#111111', margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</h3>
              {club.isVerified && <VerifiedBadge title="باشگاه تأیید شده" style={{ marginInlineStart: 0 }} />}
            </div>
            {club.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '3px 8px' }}>
                <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b' }}>{toFa(club.rating)}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
            <MapPin size={10} color={PIN_GREEN} />{club.city}
            {club.distance !== undefined && <span style={{ color: '#A07840' }}>· {faDistance(club.distance)}</span>}
          </div>
          {/* توضیح مثلِ ردیفِ فروشگاه و تولیدکننده — فقط دسکتاپ */}
          {club.description && (
            <p className="lc-hide-sm" style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.48)', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{club.description}</p>
          )}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            {activeTables.slice(0, 3).map(t => (
              <span key={t.key} style={{ fontSize: 12, color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}22`, borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>
                {toFa(t.n)} {t.label}
              </span>
            ))}
            {/* دکمه رزرو — same pill style as table type badges */}
            <span className="lc-hide-sm" style={{ fontSize: 12, color: '#C7A66A', background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.22)', borderRadius: 20, padding: '2px 8px', fontWeight: 700, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              رزرو <span style={{ lineHeight: 1 }}>←</span>
            </span>
          </div>
          {tournBadge && (
            <div style={{ display: 'flex' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: tournBadge.color, background: tournBadge.bg, border: `1px solid ${tournBadge.border}`, borderRadius: 20, padding: '3px 10px', animation: tournBadge.pulse ? 'gentlePulse 1.8s ease-in-out infinite' : 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Trophy size={9} /> {tournBadge.label}
              </span>
            </div>
          )}
        </div>
      </div>
      {storyOpen && club.hasActiveStory && club.storyMediaUrl && (
        <ClubStoryModal club={{ name: club.name, logo: club.logo, storyMediaUrl: club.storyMediaUrl, storyType: club.storyType, storyText: club.storyText }} onClose={() => setStoryOpen(false)} />
      )}
    </Link>
  );

  /* GRID CARD */
  return (
    <Link href={`/clubs/${club.slug || club.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        /* سطح از lq-pcard؛ فقط حلقه‌ی طلایی hover این‌جا می‌ماند */
        className="lq-pcard"
        style={{
          overflow: 'hidden',
          borderColor: hov ? 'rgba(199,166,106,0.50)' : undefined,
          /* درخشش لبه‌ی شیشه باید بماند، وگرنه کارت دقیقا موقع hover
             جنسش را از دست می‌دهد. */
          boxShadow: hov ? 'inset 0 1px 0 rgba(255,255,255,0.95), 0 0 0 3px rgba(199,166,106,0.10), 0 20px 44px -18px rgba(199,166,106,0.30)' : undefined,
          height: '100%', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* image */}
        <div className="lc-media" style={{ position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          {/* دو کارتِ اول بالای خطِ اول‌اند و عکسِ اولی بزرگ‌ترین تصویرِ صفحه (LCP) —
              تنبل نباشند (Lighthouse: ۲٫۷ ثانیه تأخیرِ شروعِ بارگذاری) */}
          <img loading={idx < 2 ? 'eager' : 'lazy'} fetchPriority={idx === 0 ? 'high' : undefined} decoding="async" src={img} alt={club.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.80)', transition: 'transform 400ms cubic-bezier(0.25,0.46,0.45,0.94)', transform: hov ? 'scale(1.06)' : 'scale(1.00)', willChange: 'transform' }}
            onError={onImgError} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(6,13,10,0.88) 100%)' }} />

          {/* تیک تأیید کنار نام است، نه روی عکس. */}
          {/* علاقه‌مندی — خودش کلیک را متوقف می‌کند وگرنه کارت باز
              می‌شود. */}
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <FavoriteButton type="club" id={club.id} size={15} />
          </div>
          {/* open/close — same pill style as table type badges.
              ⚠️ گوشه‌ی مقابلِ دکمه‌ی علاقه‌مندی: هر دو `top/left: 10` بودند و
              «بسته» دقیقاً روی قلب می‌نشست — نه برچسب خوانا بود نه دکمه.
              ⚠️ فقط وقتی وضعیت معلوم است (همان دلیلِ نمای فهرست). */}
          {typeof club.isOpen === 'boolean' && <div style={{
            position: 'absolute', top: 10, insetInlineStart: 10,
            fontSize: 12, fontWeight: 700,
            color: club.isOpen ? '#30C55A' : '#ef4444',
            background: club.isOpen ? 'rgba(48,197,90,0.10)' : 'rgba(239,68,68,0.10)',
            border: `1px solid ${club.isOpen ? 'rgba(48,197,90,0.22)' : 'rgba(239,68,68,0.22)'}`,
            borderRadius: 20, padding: '2px 8px',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: club.isOpen ? '#30C55A' : '#ef4444', display: 'inline-block', animation: club.isOpen ? 'gentlePulse 2.8s ease-in-out infinite' : 'none' }} />
            {club.isOpen ? `تا ${club.closeTime}` : 'بسته'}
          </div>}

          {/* رزرو badge — same pill style as table type badges (gold) */}
          <div className="lc-hide-sm" style={{
            position: 'absolute', bottom: 10, insetInlineEnd: 10,
            fontSize: 12, fontWeight: 700,
            color: '#C7A66A',
            background: 'rgba(199,166,106,0.10)',
            border: '1px solid rgba(199,166,106,0.22)',
            borderRadius: 20, padding: '2px 8px',
          }}>
            رزرو آنلاین
          </div>

          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.50)', borderRadius: 20, padding: '3px 9px', fontSize: 13, color: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={9} color={PIN_GREEN} />{club.city}
          </div>
          {/* story ring */}
          {club.hasActiveStory && club.storyMediaUrl && (
            <button aria-label={`استوری ${club.name}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStoryOpen(true); }} style={{ position: 'absolute', bottom: 44, right: 12, padding: 0, border: 'none', background: 'none', cursor: 'pointer', zIndex: 5 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', padding: 3, boxShadow: '0 0 18px rgba(188,24,136,0.6)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid rgba(0,0,0,0.75)', background: 'rgba(0,0,0,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxSizing: 'border-box' }}>
                  {/* نشان پیش‌فرض به‌جای حرف اول نام */}
                  <ClubLogo src={club.logo} name={club.name} size={48} tone="dark" />
                </div>
              </div>
            </button>
          )}
        </div>

        {/* body */}
        <div className="lc-body" style={{ padding: '16px 18px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* این عنوان می‌پیچد، پس تیک داخل h3 می‌آید تا دنبال
                آخرین کلمه بماند و تنها به خط بعد نیفتد. */}
            <h3 className="lc-title" style={{ fontSize: 16, fontWeight: 800, color: '#111111', margin: 0, lineHeight: 1.35 }}>
              {club.name}{club.isVerified && <VerifiedBadge title="باشگاه تأیید شده" />}
            </h3>
            {club.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b' }}>{toFa(club.rating)}</span>
              </div>
            )}
          </div>

          <div className="lc-hide-sm" style={{ fontSize: 13, color: 'rgba(0,0,0,0.48)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {club.description}
          </div>

          {/* table type pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {activeTables.slice(0, 3).map(t => (
              <span key={t.key} style={{ fontSize: 12, color: t.color, background: `${t.color}10`, border: `1px solid ${t.color}22`, borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>
                {toFa(t.n)} {t.label}
              </span>
            ))}
          </div>

          {/* amenity icons */}
          <div className="lc-hide-sm" style={{ display: 'flex', gap: 5 }}>
            {AMENITIES.map(a => (
              <div key={a.key} title={a.label} style={{ width: 28, height: 28, borderRadius: 8, background: (num(club, a.key) > 0) ? 'rgba(199,166,106,0.10)' : 'rgba(0,0,0,0.03)', border: `1px solid ${(num(club, a.key) > 0) ? 'rgba(199,166,106,0.28)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (num(club, a.key) > 0) ? '#A07840' : 'rgba(0,0,0,0.18)' }}>
                {a.icon}
              </div>
            ))}
          </div>

          {/* tournament badge */}
          {tournBadge && (
            <div style={{ paddingTop: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: tournBadge.color, background: tournBadge.bg, border: `1px solid ${tournBadge.border}`, borderRadius: 20, padding: '4px 12px', animation: tournBadge.pulse ? 'gentlePulse 1.8s ease-in-out infinite' : 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Trophy size={9} /> {tournBadge.label}
              </span>
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ padding: '10px 18px 16px', marginTop: 'auto' }}>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Users size={10} />{toFa(club.memberCount ?? 0)} عضو
            </span>
            {club.distance !== undefined && (
              <span style={{ fontSize: 13, color: '#A07840', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{faDistance(club.distance)}</span>
            )}
          </div>
        </div>
      </div>
      {storyOpen && club.hasActiveStory && club.storyMediaUrl && (
        <ClubStoryModal club={{ name: club.name, logo: club.logo, storyMediaUrl: club.storyMediaUrl, storyType: club.storyType, storyText: club.storyText }} onClose={() => setStoryOpen(false)} />
      )}
    </Link>
  );
}

/* ══════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════ */
/* هدرِ اسلایدیِ باشگاه‌ها برداشته شد (خواستِ مالک، ۱۰ آبانِ ۱۴۰۵): صفحه مستقیم
   با جست‌وجو و فهرست شروع می‌شود. h1 به‌صورتِ sr-only ماند — تنها تیترِ
   صفحه بود و خزنده و صفحه‌خوان هنوز لازمش دارند. */

export default function ClubsPage() {
  const [clubs, setClubs]           = useState<Club[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState(false);
  const [reloadKey, setReloadKey]   = useState(0);
  const [view, setView]             = useState<'grid' | 'list'>('grid');
  const [search, setSearch]         = useState('');
  const [city, setCity]             = useState('همه شهرها');
  const [sortBy, setSortBy]         = useState('rating');
  const [sortOpen, setSortOpen]     = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTypes, setTypes]   = useState<string[]>([]);
  const [selectedAmens, setAmens]   = useState<string[]>([]);
  const [onlyOpen, setOnlyOpen]         = useState(false);
  const [onlyVerified, setOnlyVer]      = useState(false);
  const [onlyTournament, setOnlyTourn]  = useState(false);
  const [userLoc, setUserLoc]       = useState<{ lat: number; lon: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError]     = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef   = useRef<HTMLDivElement>(null);

  /* فقط باشگاه‌های واقعی.

     پیش‌تر شش باشگاه نمونه همیشه اول فهرست بودند و باشگاه‌های واقعی
     هم‌نام با آن‌ها **حذف** می‌شدند. یعنی صاحب «باشگاه المپیک مشهد»
     که واقعا ثبت‌نام کرده بود، نسخه‌ی ساختگی به‌جای باشگاهش نمایش
     داده می‌شد و صفحه‌ی خودش اصلا دیده نمی‌شد. */
  /* فیلترها به سرور می‌روند، نه اینکه کل جدول دانلود و در مرورگر فیلتر
     شود. جستجو با تأخیر کوتاه فرستاده می‌شود تا هر حرف تایپ‌شده یک
     درخواست نسازد. */
  useEffect(() => {
    const p = new URLSearchParams();
    if (city !== 'همه شهرها') p.set('city', city);
    /* جست‌وجو عمداً به سرور نمی‌رود: ilikeِ خام «امل» را با «آمل» یکی نمی‌داند.
       فهرست (سقفِ ۵۰۰) یک‌بار می‌آید و makeMatcher پایین‌تر با تا‌کردنِ آ/ا،
       ی/ک و اعراب روی نام، شهر و نشانی می‌گردد. */
    for (const t of selectedTypes) p.set(t, '1');
    for (const a of selectedAmens) p.set(a, '1');

    /* ⚠️ خطای شبکه پیش‌تر به `setClubs([])` می‌رسید و صفحه می‌گفت «هنوز
       باشگاهی ثبت نشده» — قطعیِ اینترنتِ بازدیدکننده به‌شکلِ واقعیتی درباره‌ی
       سایت. حالا خطا حالتِ خودش را دارد. درخواستِ کهنه هم لغو می‌شود. */
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      void (async () => {
        try {
          const r = await api.get(`/clubs${p.toString() ? `?${p}` : ''}`, { signal: ctrl.signal });
          if (ctrl.signal.aborted) return;
          setClubs(Array.isArray(r.data) ? r.data : []);
          setLoadError(false);
        } catch (e) {
          if (ctrl.signal.aborted) return;
          console.warn('[clubs] list fetch failed', e);
          setLoadError(true);
        }
        setLoading(false);
      })();
    }, 0);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [city, selectedTypes, selectedAmens, reloadKey]);

  /* مسابقات عمومی، یک‌بار برای کل فهرست — تا هر کارت جداگانه
     درخواست نفرستد. کلید `club_id` است، نه نام باشگاه. */
  const [tournByClub, setTournByClub] = useState<Map<string, Tournament[]>>(new Map());
  useEffect(() => {
    void (async () => {
      const all = await fetchTournaments();
      const m = new Map<string, Tournament[]>();
      for (const t of all) {
        const list = m.get(t.clubId) ?? [];
        list.push(t);
        m.set(t.clubId, list);
      }
      setTournByClub(m);
    })();
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (sortRef.current   && !sortRef.current.contains(e.target as Node))   setSortOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) { setLocError(true); return; }
    setLocLoading(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setSortBy('distance'); setLocLoading(false); },
      () => { setLocLoading(false); setLocError(true); },
      { timeout: 8000, enableHighAccuracy: false },
    );
  };

  const toggleType = (k: string) => setTypes(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const toggleAmen = (k: string) => setAmens(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const activeFilters = selectedTypes.length + selectedAmens.length + (onlyOpen ? 1 : 0) + (onlyVerified ? 1 : 0) + (onlyTournament ? 1 : 0);
  const clearFilters  = () => { setTypes([]); setAmens([]); setOnlyOpen(false); setOnlyVer(false); setOnlyTourn(false); setCity('همه شهرها'); setSearch(''); };

  const withDist = clubs.map(c => userLoc && c.latitude && c.longitude
    ? { ...c, distance: calcDistance(userLoc.lat, userLoc.lon, c.latitude, c.longitude) }
    : c,
  );

  const hit = makeMatcher(search);
  const filtered = withDist.filter(c => {
    if (search && !hit(c.name, c.city, c.address)) return false;
    if (city !== 'همه شهرها' && c.city !== city) return false;
    if (onlyOpen && !c.isOpen) return false;
    if (onlyVerified && !c.isVerified) return false;
    if (onlyTournament && !(tournByClub.get(c.id) ?? []).some(t => t.status === 'registration_open')) return false;
    if (selectedTypes.length > 0 && !selectedTypes.every(t => num(c, t) > 0)) return false;
    if (selectedAmens.length > 0 && !selectedAmens.every(a => num(c, a) > 0)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'distance' && a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
    if (sortBy === 'rating')  return (b.rating ?? 0)      - (a.rating ?? 0);
    if (sortBy === 'members') return (b.memberCount ?? 0) - (a.memberCount ?? 0);
    /* `totalTables` در پاسخِ فهرست نیست؛ این ترتیب هیچ‌وقت چیزی را جابه‌جا نمی‌کرد */
    if (sortBy === 'tables')  return tableSummary(b).total - tableSummary(a).total;
    return 0;
  });

  const currentSort  = SORT_OPTIONS.find(o => o.value === sortBy) ?? SORT_OPTIONS[0]!;
  const availSorts   = SORT_OPTIONS.filter(o => o.value !== 'distance' || userLoc);

  return (
    <>
      <style>{`
        @keyframes fadeUp      { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes gentlePulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        .srch-inp { background:transparent;border:none;outline:none;color:#111111;font-size:14px;font-family:inherit;width:100% }
        .srch-inp::placeholder { color:rgba(0,0,0,0.28) }
        .city-scroll::-webkit-scrollbar { height:0 }
        .dd-item:hover { background:rgba(199,166,106,0.08)!important;color:#A07840!important }

        /* شبکه و ابعادِ کارت: استانداردِ مشترکِ lc-* در globals.css (با فروشگاه‌ها و تولیدکنندگان یکی) */
        @media(max-width:560px)  {
          .toolbar-row { flex-wrap:wrap; gap:6px }
          .toolbar-search { min-width:100%!important; order:-1 }
          .tb-count { display:none!important }
          .tb-ctl { height:40px!important; padding:0 11px!important; font-size:13px!important }
        }
      `}</style>

      {/* رنگ پایه داخل lq-stage است */}
      <div className="lq-stage" style={{ minHeight: '100vh', paddingBottom: 80, direction: 'rtl' }}>

        <h1 className="sr-only">باشگاه‌های بیلیارد</h1>

        {/* ══ STICKY TOOLBAR ══ */}
        {/* نوار چسبان نیمه‌شفاف می‌ماند تا لکه‌های پشت شیشه از زیرش
            دیده شوند؛ نسخه‌ی قبلی تقریبا مات بود و یک نوار سفید وسط
            صفحه می‌کشید. */}
        <div style={{ background: 'rgba(250,249,246,0.62)', borderBottom: '1px solid rgba(28,28,26,0.07)', padding: '10px clamp(16px,4vw,40px)', position: 'sticky', top: 'var(--nav-offset)', zIndex: 90, backdropFilter: 'blur(24px) saturate(1.6)', WebkitBackdropFilter: 'blur(24px) saturate(1.6)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="toolbar-row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* جست‌وجوی نام یا شهر — موبایل ردیفِ خودش (‎.toolbar-search) */}
              <div className="toolbar-search" style={{ order: 0, flex: '1 1 240px', minWidth: 0 }}>
                <ListSearch value={search} onChange={setSearch} placeholder="جست‌وجوی باشگاه یا شهر" />
              </div>

              {/* Near me — order 3, no arrow icon */}
              <button className="tb-ctl" onClick={getLocation} title="نزدیک‌ترین باشگاه‌ها" style={{ order: 3, height: 44, borderRadius: 12, padding: '0 16px', border: `1px solid ${sortBy === 'distance' ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.09)'}`, background: sortBy === 'distance' ? 'rgba(199,166,106,0.10)' : '#FFFFFF', color: sortBy === 'distance' ? '#A07840' : 'rgba(0,0,0,0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {locLoading
                  ? <div style={{ width: 14, height: 14, border: '2px solid rgba(199,166,106,0.3)', borderTop: '2px solid #C7A66A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <Navigation size={15} />}
                نزدیک من
              </button>

              {/* Filter — order 1 */}
              <div ref={filterRef} style={{ position: 'relative', flexShrink: 0, order: 1 }}>
                <button className="tb-ctl" onClick={() => { setFilterOpen(p => !p); setSortOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRadius: 12, border: `1px solid ${filterOpen || activeFilters > 0 ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.09)'}`, background: filterOpen || activeFilters > 0 ? 'rgba(199,166,106,0.10)' : '#FFFFFF', color: filterOpen || activeFilters > 0 ? '#A07840' : 'rgba(0,0,0,0.55)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  <SlidersHorizontal size={13} /> فیلتر
                  {activeFilters > 0 && <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#C7A66A', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{toFa(activeFilters)}</span>}
                </button>

                {filterOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 300, background: 'rgba(255,255,255,0.985)', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 18, padding: 18, zIndex: 9999, boxShadow: '0 24px 70px rgba(0,0,0,0.22)', backdropFilter: 'blur(28px) saturate(1.4)', WebkitBackdropFilter: 'blur(28px) saturate(1.4)', animation: 'fadeUp 0.2s ease both' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#111111' }}>فیلترها</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {activeFilters > 0 && <button onClick={clearFilters} style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>پاک</button>}
                        <button aria-label="بستن فیلترها" onClick={() => setFilterOpen(false)} style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, cursor: 'pointer', color: 'rgba(0,0,0,0.45)', padding: 4, display: 'flex' }}><X size={12} /></button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.62)', fontWeight: 700, marginBottom: 8 }}>نوع میز</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {TABLE_TYPES.map(t => (
                          <button key={t.key} onClick={() => toggleType(t.key)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1px solid ${selectedTypes.includes(t.key) ? `${t.color}40` : 'rgba(0,0,0,0.09)'}`, background: selectedTypes.includes(t.key) ? `${t.color}14` : 'transparent', color: selectedTypes.includes(t.key) ? t.color : 'rgba(0,0,0,0.66)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.62)', fontWeight: 700, marginBottom: 8 }}>امکانات</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {AMENITIES.map(a => (
                          <button key={a.key} onClick={() => toggleAmen(a.key)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1px solid ${selectedAmens.includes(a.key) ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.09)'}`, background: selectedAmens.includes(a.key) ? 'rgba(199,166,106,0.10)' : 'transparent', color: selectedAmens.includes(a.key) ? '#A07840' : 'rgba(0,0,0,0.66)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                            {a.icon}{a.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      {[
                        /* ⚠️ «باز» فقط وقتی وضعیتِ باز/بسته واقعاً معلوم است: API فهرست
                           ساعتِ کاری نمی‌فرستد و این کلید همه‌ی باشگاه‌ها را حذف می‌کرد. */
                        ...(clubs.some(c => typeof c.isOpen === 'boolean')
                          ? [{ label: 'باشگاه‌های باز', val: onlyOpen, set: setOnlyOpen }] : []),
                        { label: 'تأیید شده‌ها',                     val: onlyVerified,   set: setOnlyVer     },
                        { label: 'در حال ثبت‌نام مسابقه',            val: onlyTournament, set: setOnlyTourn   },
                      ].map((tog, i) => (
                        <button type="button" role="switch" aria-checked={tog.val} key={i} onClick={() => tog.set((p: boolean) => !p)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '6px 0', width: '100%', background: 'none', border: 'none', fontFamily: 'inherit', textAlign: 'start' }}>
                          <span style={{ fontSize: 15, color: 'rgba(0,0,0,0.70)', fontWeight: 500 }}>{tog.label}</span>
                          <span style={{ display: 'block', width: 36, height: 20, borderRadius: 10, background: tog.val ? '#C7A66A' : 'rgba(0,0,0,0.12)', position: 'relative', transition: 'all 0.3s', flexShrink: 0 }}>
                            <span style={{ display: 'block', position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'all 0.3s', left: tog.val ? 19 : 3, boxShadow: '0 2px 4px rgba(0,0,0,0.20)' }} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort — order 2 */}
              <div ref={sortRef} style={{ position: 'relative', flexShrink: 0, order: 2 }}>
                <button className="tb-ctl" onClick={() => { setSortOpen(p => !p); setFilterOpen(false); }} style={{ height: 44, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderRadius: 12, border: `1px solid ${sortOpen ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.09)'}`, background: sortOpen ? 'rgba(199,166,106,0.08)' : '#FFFFFF', color: 'rgba(0,0,0,0.65)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  {currentSort.label}
                  <ChevronDown size={11} style={{ transition: 'transform 0.3s', transform: sortOpen ? 'rotate(180deg)' : 'none', color: 'rgba(0,0,0,0.35)' }} />
                </button>
                {sortOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, minWidth: 170, background: 'rgba(255,255,255,0.985)', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 14, padding: 6, zIndex: 9999, boxShadow: '0 24px 70px rgba(0,0,0,0.20)', backdropFilter: 'blur(28px) saturate(1.4)', WebkitBackdropFilter: 'blur(28px) saturate(1.4)', animation: 'fadeUp 0.2s ease both' }}>
                    {availSorts.map(opt => (
                      <button key={opt.value} className="dd-item" onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: 'none', background: sortBy === opt.value ? 'rgba(199,166,106,0.10)' : 'transparent', color: sortBy === opt.value ? '#A07840' : 'rgba(0,0,0,0.65)', fontSize: 15, fontWeight: sortBy === opt.value ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'right' }}>
                        {opt.label}
                        {sortBy === opt.value && <span style={{ marginRight: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#C7A66A' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View toggle — order 4, beside نزدیک من */}
              <div style={{ display: 'flex', gap: 4, order: 4, flexShrink: 0 }}>
                {([['grid', <Grid3X3 size={14} />], ['list', <AlignJustify size={14} />]] as const).map(([v, icon]) => (
                  <button key={v} type="button" aria-label={v === 'grid' ? 'نمایش شبکه‌ای' : 'نمایش فهرستی'} aria-pressed={view === v} onClick={() => setView(v)} style={{ width: 36, height: 36, borderRadius: 9, border: `1px solid ${view === v ? 'rgba(199,166,106,0.35)' : 'rgba(0,0,0,0.09)'}`, background: view === v ? 'rgba(199,166,106,0.10)' : '#FFFFFF', color: view === v ? '#A07840' : 'rgba(0,0,0,0.40)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {icon}
                  </button>
                ))}
              </div>

              <div className="tb-count" style={{ order: 5, marginRight: 'auto', fontSize: 14, color: 'rgba(0,0,0,0.40)', whiteSpace: 'nowrap' }}>باشگاه‌ها</div>
            </div>

            {/* location hint */}
            {!userLoc && (
              locError ? (
                <div role="status" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10 }}>
                  <Navigation size={12} color="#ef4444" />
                  <span style={{ fontSize: 13, color: '#ef4444' }}>دسترسی به موقعیت مکانی رد شد — تنظیمات مرورگر را بررسی کنید</span>
                </div>
              ) : (
                <button type="button" onClick={getLocation}
                  style={{ width: '100%', fontFamily: 'inherit', fontWeight: 400, textAlign: 'start', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'rgba(199,166,106,0.06)', border: '1px solid rgba(199,166,106,0.18)', borderRadius: 10, cursor: 'pointer' }}>
                  <Navigation size={12} color="#C7A66A" />
                  <span style={{ fontSize: 13, color: '#A07840' }}>برای نمایش نزدیک‌ترین باشگاه‌ها، مکان‌یابی را فعال کنید</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* ══ CONTENT ══ */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px', color: 'rgba(0,0,0,0.40)', fontSize: 16 }}>
              <div style={{ width: 22, height: 22, border: '2px solid rgba(199,166,106,0.20)', borderTop: '2px solid #C7A66A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              در حال بارگذاری...
            </div>
          ) : loadError ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#111111', margin: '0 0 8px' }}>فهرست باشگاه‌ها بارگذاری نشد</h3>
              <div style={{ fontSize: 15, color: 'rgba(0,0,0,0.55)', margin: '0 0 20px' }}>اتصال اینترنت را بررسی کنید و دوباره امتحان کنید</div>
              <button type="button" onClick={() => { setLoading(true); setReloadKey(n => n + 1); }} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>تلاش دوباره</button>
            </div>
          ) : filtered.length === 0 ? (
            /* «هیچ باشگاهی ثبت نشده» با «فیلتر چیزی پیدا نکرد» فرق دارد؛
               پیشنهاد «فیلترها را پاک کنید» وقتی فیلتری فعال نیست بی‌معنی است. */
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: 44, opacity: 0.15, marginBottom: 14 }}>🎱</div>
              {clubs.length === 0 ? (
                <>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: '#111111', margin: '0 0 8px' }}>هنوز باشگاهی ثبت نشده</h3>
                  <div style={{ fontSize: 15, color: 'rgba(0,0,0,0.40)', margin: '0 0 20px', lineHeight: 2 }}>
                    اگر باشگاه دارید، می‌توانید همین حالا ثبتش کنید
                  </div>
                  <Link href="/dashboard/club" style={{ display: 'inline-block', padding: '10px 24px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                    ثبت باشگاه
                  </Link>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: '#111111', margin: '0 0 8px' }}>باشگاهی یافت نشد</h3>
                  <div style={{ fontSize: 15, color: 'rgba(0,0,0,0.40)', margin: '0 0 20px' }}>فیلترها یا جستجو را تغییر دهید</div>
                  <button onClick={clearFilters} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>پاک کردن فیلترها</button>
                </>
              )}
            </div>
          ) : view === 'grid' ? (
            <div className="lc-grid">
              {filtered.map((club, i) => (
                <div key={club.id} style={{ animation: `fadeUp 0.5s ease ${i * 0.05}s both` }}>
                  <ClubCard club={club} view="grid" idx={i} tournaments={tournByClub.get(club.id) ?? []} />
                </div>
              ))}
            </div>
          ) : (
            <div className="list-2col">
              {filtered.map((club, i) => (
                <div key={club.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.04}s both` }}>
                  <ClubCard club={club} view="list" idx={i} tournaments={tournByClub.get(club.id) ?? []} />
                </div>
              ))}
            </div>
          )}

          {/* کارتِ تبلیغیِ «باشگاه خود را ثبت کنید» برداشته شد (خواستِ مالک، ۱۰ آبانِ ۱۴۰۵) */}
        </div>
      </div>
    </>
  );
}
