'use client';

/* ─────────────────────────────────────────────────────────────
   پنل سوپرادمین — هابِ مدیریتِ کلِ پلتفرم (بازسازی ۱۴۰۵).
   گروه‌بندی بر اساسِ دامنه‌های واقعیِ سایت، بدونِ آیتم‌های
   تکراری (پنلِ باشگاه‌دار حذف شد — آن پنلِ مالک است نه ادمین)
   و با جای‌گذاریِ بخش‌های آینده به‌صورت «به‌زودی».
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import {
  Users, ShoppingBag, Trophy, Newspaper, Crown, UserCheck,
  CheckCircle, TrendingUp, Building2, Star, Megaphone, Scale, Store,
  Clapperboard, Factory, Wrench, ShieldCheck, KeyRound,
} from 'lucide-react';

const GOLD   = '#C7A66A';
const GOLD_D = '#9A6E38';
const TEXT   = '#1C1B17';
const SEC    = '#5B564B';
const MUT    = '#8A8474';
const LINE   = '#E7E2D6';

interface AdminItem {
  title: string;
  desc: string;
  icon: React.ReactNode;
  link?: string;          // بدونِ لینک ⇒ به‌زودی
}

interface AdminSection {
  title: string;
  en: string;
  dot: string;
  items: AdminItem[];
}

const SECTIONS: AdminSection[] = [
  {
    title: 'کاربران و دسترسی', en: 'USERS & ACCESS', dot: '#1D4ED8',
    items: [
      { title: 'مدیریت کاربران', desc: 'مشاهده، ویرایش و مسدودسازی کاربران', icon: <Users size={20} />, link: '/admin/users' },
      { title: 'مدیریت نقش‌ها', desc: 'اعطا و لغو نقش‌ها (مربی، داور، فروشنده…)', icon: <KeyRound size={20} />, link: '/admin/roles' },
      { title: 'احراز هویت', desc: 'بررسی درخواست‌های تأیید هویت کاربران', icon: <ShieldCheck size={20} />, link: '/admin/verifications' },
    ],
  },
  {
    title: 'جامعه‌ی حرفه‌ای', en: 'COMMUNITY', dot: '#14532D',
    items: [
      { title: 'تأیید مربیان', desc: 'بررسی پروفایل مربیان و صدور تیک تأیید', icon: <Star size={20} />, link: '/admin/coaches' },
      { title: 'تأیید داوران', desc: 'بررسی پروفایل و مدرک داوران', icon: <Scale size={20} />, link: '/admin/referees' },
      { title: 'رنکینگ بازیکنان', desc: 'ورود و ویرایش رنکینگ رسمی', icon: <TrendingUp size={20} />, link: '/admin/rankings' },
      { title: 'بازیکنان شاخص', desc: 'مدیریت پروفایل بازیکنان بخش «ستارگان»', icon: <UserCheck size={20} /> },
    ],
  },
  {
    title: 'کسب‌وکارها', en: 'BUSINESSES', dot: '#A07840',
    items: [
      { title: 'تأیید باشگاه‌ها', desc: 'بررسی جواز کسب و صدور تأیید رسمی', icon: <Building2 size={20} />, link: '/admin/clubs' },
      { title: 'تأیید فروشگاه‌ها', desc: 'بررسی و انتشار فروشگاه‌های ثبت‌شده', icon: <Store size={20} />, link: '/admin/sellers' },
      { title: 'تأیید محصولات', desc: 'بررسی محصولات بیلیارد بازار', icon: <ShoppingBag size={20} />, link: '/admin/products' },
      { title: 'تولیدکنندگان', desc: 'مدیریت پروفایل تولیدکنندگان', icon: <Factory size={20} /> },
      { title: 'متخصصان فنی', desc: 'تأیید متخصصان خدمات فنی', icon: <Wrench size={20} /> },
    ],
  },
  {
    title: 'محتوا و رویدادها', en: 'CONTENT & EVENTS', dot: '#B23B2E',
    items: [
      { title: 'اخبار', desc: 'نوشتن و مدیریت اخبار بیلیارد', icon: <Newspaper size={20} />, link: '/admin/news' },
      { title: 'مسابقات و رویدادها', desc: 'ایجاد و مدیریت رویدادهای رسمی', icon: <Trophy size={20} />, link: '/admin/events' },
      { title: 'تبلیغات', desc: 'بنرها و کمپین‌های تبلیغاتی سایت', icon: <Megaphone size={20} />, link: '/admin/ads' },
      { title: 'بیلیارد مدیا', desc: 'مدیریت ویدیوها و کانال‌ها', icon: <Clapperboard size={20} /> },
    ],
  },
];

const STATS = [
  { label: 'کاربران', value: 124, link: '/admin/users' },
  { label: 'محصولات', value: 87, link: '/admin/products' },
  { label: 'باشگاه‌ها', value: 43, link: '/admin/clubs' },
  { label: 'مسابقات', value: 12, link: '/admin/events' },
  { label: 'اخبار', value: 36, link: '/admin/news' },
  { label: 'در انتظار تأیید', value: 8, link: '/admin/verifications' },
];

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setChecked(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!user) { router.push('/login'); return; }
    if (user.primaryRole !== 'admin') { router.push('/'); return; }
  }, [checked, user, router]);

  if (!checked) return <div style={{ textAlign: 'center', padding: '80px 0', color: MUT, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>در حال بارگذاری…</div>;
  if (!user || user.primaryRole !== 'admin') return null;

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F7F5F0', color: TEXT, fontFamily: 'Vazirmatn,Tahoma,sans-serif', paddingBottom: 72 }}>
      <style>{`
        @keyframes adUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .ad-wrap { max-width: 1120px; margin: 0 auto; padding: 0 clamp(16px,3vw,28px); }
        .ad-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
        .ad-stat { display: block; text-decoration: none; background: #fff; border: 1px solid ${LINE};
          border-radius: 14px; padding: 14px 10px; text-align: center;
          transition: transform .25s cubic-bezier(.22,1,.36,1), border-color .25s, box-shadow .25s; }
        .ad-stat:hover { transform: translateY(-2px); border-color: rgba(199,166,106,0.45); box-shadow: 0 10px 24px rgba(28,27,23,0.08); }
        .ad-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .ad-card { position: relative; display: flex; gap: 12px; align-items: flex-start; text-decoration: none;
          background: #fff; border: 1px solid ${LINE}; border-radius: 16px; padding: 15px 16px;
          transition: transform .25s cubic-bezier(.22,1,.36,1), border-color .25s, box-shadow .25s;
          animation: adUp .45s ease both; }
        .ad-card:not(.soon):hover { transform: translateY(-3px); border-color: rgba(199,166,106,0.45); box-shadow: 0 14px 30px rgba(28,27,23,0.09); }
        .ad-card.soon { opacity: .62; cursor: default; }
        .ad-ic { width: 42px; height: 42px; border-radius: 13px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(199,166,106,0.12); border: 1px solid rgba(199,166,106,0.3); color: ${GOLD_D}; }
        @media (max-width: 900px) { .ad-stats { grid-template-columns: repeat(3, 1fr); } .ad-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .ad-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="ad-wrap" style={{ paddingTop: 24 }}>

        {/* سربرگ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.24em', color: GOLD_D, border: '1px solid rgba(199,166,106,0.35)', borderRadius: 999, padding: '4px 12px', marginBottom: 10 }}>
              <Crown size={11} /> SUPER ADMIN
            </span>
            <h1 style={{ fontSize: 'clamp(19px,2.6vw,24px)', fontWeight: 900, margin: 0 }}>پنل مدیریت بیلیارد هاب</h1>
            <p style={{ fontSize: 12.5, color: MUT, margin: '6px 0 0' }}>مدیریت کاربران، کسب‌وکارها، محتوا و رویدادهای کل پلتفرم</p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 800, color: '#B23B2E', background: 'rgba(178,59,46,0.08)', border: '1px solid rgba(178,59,46,0.25)', borderRadius: 12, padding: '8px 14px' }}>
            <ShieldCheck size={15} /> {user.firstName} {user.lastName}
          </span>
        </div>

        {/* آمار سریع */}
        <div className="ad-stats" style={{ marginBottom: 28 }}>
          {STATS.map((s, i) => (
            <Link key={i} href={s.link} className="ad-stat" style={{ animation: `adUp .4s ${i * 40}ms ease both` }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: GOLD_D, fontVariantNumeric: 'tabular-nums' }}>{s.value.toLocaleString('fa-IR')}</div>
              <div style={{ fontSize: 11, color: SEC, marginTop: 3, fontWeight: 700 }}>{s.label}</div>
            </Link>
          ))}
        </div>

        {/* بخش‌ها */}
        {SECTIONS.map((sec, si) => (
          <section key={sec.en} style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 3, height: 16, borderRadius: 2, background: `linear-gradient(180deg,${GOLD},#8A6020)` }} />
              <h2 style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>{sec.title}</h2>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: sec.dot }} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', color: MUT }}>{sec.en}</span>
              <span style={{ flex: 1, height: 1, background: LINE }} />
            </div>
            <div className="ad-grid">
              {sec.items.map((item, i) => {
                const inner = (
                  <>
                    <span className="ad-ic">{item.icon}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 900, color: TEXT }}>
                        {item.title}
                        {!item.link && (
                          <span style={{ fontSize: 9.5, fontWeight: 800, color: GOLD_D, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.3)', borderRadius: 999, padding: '2px 8px' }}>به‌زودی</span>
                        )}
                      </span>
                      <span style={{ display: 'block', fontSize: 11.5, color: MUT, lineHeight: 1.8, marginTop: 3 }}>{item.desc}</span>
                    </span>
                  </>
                );
                const delay = { animationDelay: `${si * 60 + i * 40}ms` } as React.CSSProperties;
                return item.link ? (
                  <Link key={item.title} href={item.link} className="ad-card" style={delay}>{inner}</Link>
                ) : (
                  <div key={item.title} className="ad-card soon" style={delay} title="در نسخه‌های بعدی">{inner}</div>
                );
              })}
            </div>
          </section>
        ))}

        {/* یادداشت */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '12px 16px' }}>
          <CheckCircle size={15} style={{ color: '#0E7A38', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: SEC }}>
            مدیریتِ روزانه‌ی هر باشگاه (میزها، رزروها) در پنلِ خودِ باشگاه‌دار انجام می‌شود؛ این پنل مخصوص نظارت و تأییدهای سراسری است.
          </span>
        </div>
      </div>
    </div>
  );
}
