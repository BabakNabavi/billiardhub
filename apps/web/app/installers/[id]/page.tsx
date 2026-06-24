'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceItem {
  title: string;
  description: string;
  icon: string;
  price: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  location: string;
  year: string;
  type: string;
  duration: string;
  description: string;
  tags: string[];
}

interface Review {
  id: string;
  author: string;
  business: string;
  rating: number;
  date: string;
  text: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_INSTALLERS: Record<string, any> = {
  '1': {
    id: '1',
    name: 'محمد رضایی — متخصص نصب و تعمیر بیلیارد',
    shortName: 'محمد رضایی',
    tagline: 'نصب حرفه‌ای میزهای اسنوکر و بیلیارد | تضمین ۲ ساله',
    since: '۱۳۸۸',
    city: 'تهران',
    verified: true,
    elite: true,
    jobsDone: 480,
    rating: 4.9,
    reviewCount: 186,
    responseTime: '۱ ساعت',
    regions: ['تهران', 'کرج', 'البرز', 'شمال تهران'],
    avatar: '',
    certifications: ['گواهی فنی فدراسیون بیلیارد', 'دوره تخصصی Riley Academy', 'دوره مکانیک میزهای اسنوکر'],
    bio: 'با بیش از ۱۵ سال تجربه در نصب، تنظیم و تعمیر میزهای حرفه‌ای بیلیارد و اسنوکر، خدمات خود را به باشگاه‌ها، هتل‌ها و منازل شخصی در تهران و حومه ارائه می‌دهم. تخصص اصلی من نصب دقیق میزهای اسنوکر و تنظیم لِوِل (سطح‌بندی) بر اساس استانداردهای بین‌المللی WPBSA است.',
    phone: '۰۹۱۲-۳۴۵-۶۷۸۹',
    email: 'rezaei.install@gmail.com',
    workHours: 'شنبه تا چهارشنبه ۸-۱۸ | پنجشنبه ۸-۱۴',
    services: [
      { title: 'نصب میز اسنوکر', description: 'نصب کامل از صفر تا سطح‌بندی دقیق، شامل اسمبل چارچوب، اسلیت، کوسن و پارچه', icon: '⚙️', price: 'از ۳,۵۰۰,۰۰۰ تومان' },
      { title: 'نصب میز بیلیارد آمریکایی', description: 'نصب حرفه‌ای میزهای ۷، ۸ و ۹ فوتی با تضمین سطح‌بندی', icon: '🔧', price: 'از ۲,۰۰۰,۰۰۰ تومان' },
      { title: 'تعویض پارچه میز', description: 'تعویض پارچه اسنوکر و بیلیارد با برندهای Strachan، Simonis، Hainsworth', icon: '🪡', price: 'از ۱,۲۰۰,۰۰۰ تومان' },
      { title: 'تعویض کوسن', description: 'تعویض و تنظیم کوسن‌های لاستیکی با کوسن‌های Super Pro و K-66', icon: '🔨', price: 'از ۸۰۰,۰۰۰ تومان' },
      { title: 'سطح‌بندی و تنظیم', description: 'تنظیم دقیق سطح میز با ابزار لیزری، ضروری پس از جابجایی', icon: '📐', price: 'از ۴۵۰,۰۰۰ تومان' },
      { title: 'تعمیر و نگهداری', description: 'سرویس دوره‌ای شامل تمیزکاری اسلیت، گریس‌کاری و بازرسی کلی', icon: '🛠️', price: 'از ۳۵۰,۰۰۰ تومان' },
    ],
    portfolio: [
      { id: 'pf1', title: 'باشگاه اسنوکر آزادی تهران', location: 'تهران، جنت‌آباد', year: '۱۴۰۳', type: 'نصب میز اسنوکر', duration: '۳ روز', description: 'نصب ۴ میز اسنوکر ۱۲ فوتی حرفه‌ای با اسلیت ایتالیایی و پارچه Strachan 6811', tags: ['اسنوکر', 'باشگاه', 'تهران'] },
      { id: 'pf2', title: 'هتل اسپیناس بوتیک', location: 'تهران، ولنجک', year: '۱۴۰۳', type: 'تعویض پارچه', duration: '۱ روز', description: 'تعویض پارچه ۳ میز بیلیارد لاکچری با پارچه Simonis 860', tags: ['هتل', 'پارچه', 'لاکچری'] },
      { id: 'pf3', title: 'کلوپ VIP اوین', location: 'تهران، اوین', year: '۱۴۰۲', type: 'نصب کامل + تجهیز', duration: '۵ روز', description: 'نصب ۶ میز ترکیبی اسنوکر و آمریکایی با روشنایی حرفه‌ای', tags: ['باشگاه', 'نصب کامل', 'VIP'] },
      { id: 'pf4', title: 'منزل شخصی — پاسداران', location: 'تهران، پاسداران', year: '۱۴۰۳', type: 'نصب میز خانگی', duration: '۱ روز', description: 'نصب میز اسنوکر ۱۰ فوتی در زیرزمین خانه با تنظیم دقیق', tags: ['خانگی', 'اسنوکر'] },
      { id: 'pf5', title: 'مجموعه ورزشی کرج', location: 'کرج، مهرشهر', year: '۱۴۰۲', type: 'تعمیر اساسی', duration: '۲ روز', description: 'تعویض کامل کوسن و پارچه ۸ میز قدیمی، سطح‌بندی و بازسازی', tags: ['تعمیر', 'کرج', 'بازسازی'] },
    ],
    reviews: [
      { id: 'rv1', author: 'حسین کریمی', business: 'باشگاه اسنوکر ستاره', rating: 5, date: '۱۰ خرداد ۱۴۰۴', text: 'کار فوق‌العاده دقیق. سطح‌بندی میزها بی‌نقص انجام شد. قطعاً برای نصب بعدی‌مان هم دعوتشون می‌کنیم.' },
      { id: 'rv2', author: 'مریم احمدی', business: 'هتل پارسیان', rating: 5, date: '۲ خرداد ۱۴۰۴', text: 'سریع، دقیق و تمیز. پارچه‌ها عالی کشیده شده. مهمانان از کیفیت میزها تعریف می‌کنند.' },
      { id: 'rv3', author: 'آرش نصیری', business: 'منزل شخصی', rating: 5, date: '۲۵ اردیبهشت ۱۴۰۴', text: 'نصب میز خانگی خیلی حرفه‌ای انجام شد. راهنمایی‌های نگهداری هم خیلی مفید بود.' },
      { id: 'rv4', author: 'بابک موسوی', business: 'باشگاه دیاموند', rating: 4, date: '۱۸ اردیبهشت ۱۴۰۴', text: 'کیفیت کار عالی. فقط یه روز تأخیر داشت که از قبل اطلاع داد.' },
    ],
  },
  '2': {
    id: '2', name: 'تیم نصب تهران بیلیارد', shortName: 'تهران بیلیارد', tagline: 'تیم متخصص نصب تجهیزات بیلیارد در تهران', since: '۱۳۹۵', city: 'تهران', verified: true, elite: false,
    jobsDone: 220, rating: 4.5, reviewCount: 78, responseTime: '۳ ساعت',
    regions: ['تهران', 'کرج'],
    avatar: '', certifications: ['گواهی فنی فدراسیون'],
    bio: 'تیم نصب تهران بیلیارد با تخصص در نصب و تعمیر میزهای آمریکایی خدمت می‌دهد.',
    phone: '۰۹۱۱-۲۲۳-۴۴۵۵', email: 'tehran.install@gmail.com', workHours: 'شنبه تا پنجشنبه ۹-۱۸',
    services: [
      { title: 'نصب میز بیلیارد', description: 'نصب میزهای آمریکایی', icon: '⚙️', price: 'از ۱,۸۰۰,۰۰۰ تومان' },
      { title: 'تعویض پارچه', description: 'تعویض پارچه با انواع برند', icon: '🪡', price: 'از ۹۰۰,۰۰۰ تومان' },
    ],
    portfolio: [
      { id: 'pf1', title: 'باشگاه نشاط', location: 'تهران، یافت‌آباد', year: '۱۴۰۳', type: 'نصب میز', duration: '۲ روز', description: 'نصب ۵ میز آمریکایی', tags: ['آمریکایی', 'باشگاه'] },
    ],
    reviews: [
      { id: 'rv1', author: 'کامران علوی', business: 'باشگاه نشاط', rating: 4, date: '۵ خرداد ۱۴۰۴', text: 'کار خوب با قیمت مناسب.' },
    ],
  },
  '3': {
    id: '3', name: 'علی اصغر حیدری — مکانیک بیلیارد', shortName: 'علی حیدری', tagline: 'تعمیرکار قدیمی و با تجربه بیلیارد', since: '۱۳۷۸', city: 'اصفهان', verified: false, elite: false,
    jobsDone: 650, rating: 4.3, reviewCount: 45, responseTime: '۶ ساعت',
    regions: ['اصفهان', 'کاشان', 'یزد'],
    avatar: '', certifications: [],
    bio: 'بیش از ۲۵ سال تجربه در تعمیر انواع میزهای بیلیارد.',
    phone: '۰۹۱۳-۴۵۶-۷۸۹۰', email: '', workHours: 'شنبه تا چهارشنبه ۸-۱۷',
    services: [
      { title: 'تعمیر میز', description: 'تعمیر انواع خرابی', icon: '🔧', price: 'توافقی' },
    ],
    portfolio: [],
    reviews: [],
  },
  '4': {
    id: '4', name: 'سرویس پیشرفته بیلیارد مشهد', shortName: 'سرویس مشهد', tagline: 'نصب و تعمیر تخصصی در خراسان رضوی', since: '۱۳۹۶', city: 'مشهد', verified: true, elite: false,
    jobsDone: 310, rating: 4.7, reviewCount: 92, responseTime: '۲ ساعت',
    regions: ['مشهد', 'نیشابور', 'سبزوار'],
    avatar: '', certifications: ['گواهی فنی فدراسیون', 'دوره تخصصی کوسن'],
    bio: 'تخصص در نصب میزهای اسنوکر در مشهد و شهرهای اطراف.',
    phone: '۰۹۱۵-۱۲۳-۴۵۶۷', email: 'mashhad.service@gmail.com', workHours: 'شنبه تا پنجشنبه ۸-۱۸',
    services: [
      { title: 'نصب میز اسنوکر', description: 'نصب کامل با تضمین', icon: '⚙️', price: 'از ۳,۰۰۰,۰۰۰ تومان' },
      { title: 'تعمیر و سرویس', description: 'سرویس دوره‌ای', icon: '🛠️', price: 'از ۴۰۰,۰۰۰ تومان' },
    ],
    portfolio: [
      { id: 'pf1', title: 'باشگاه شیدا مشهد', location: 'مشهد، احمدآباد', year: '۱۴۰۳', type: 'نصب کامل', duration: '۴ روز', description: 'نصب ۵ میز اسنوکر حرفه‌ای', tags: ['اسنوکر', 'مشهد'] },
    ],
    reviews: [
      { id: 'rv1', author: 'رضا کاظمی', business: 'باشگاه شیدا', rating: 5, date: '۱ خرداد ۱۴۰۴', text: 'نصب دقیق و در زمان مقرر. ممنون.' },
    ],
  },
};

// ─── Star Rating ────────────────────────────────────────────────────────────
function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#06b6d4' : 'none'}
          stroke="#06b6d4" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function InstallerDetailPage({ params }: { params: { id: string } }) {
  const installer = MOCK_INSTALLERS[params?.id] ?? MOCK_INSTALLERS['1'];
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'reviews' | 'contact'>('services');

  return (
    <div style={{ background: '#F7F7F5', minHeight: '100vh', color: '#111111', fontFamily: 'Vazirmatn, system-ui', direction: 'rtl' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 'clamp(180px, 28vw, 320px)', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #030d18 0%, #041420 50%, #03101a 100%)', position: 'relative' }}>
          {/* Tool pattern */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(6,182,212,0.03) 0px, rgba(6,182,212,0.03) 2px, transparent 2px, transparent 16px)', backgroundSize: '22px 22px' }} />
          {/* Glows */}
          <div style={{ position: 'absolute', top: '20%', right: '30%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199,166,106,0.08), transparent 70%)', filter: 'blur(40px)' }} />
          {/* Large icon */}
          <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: 'clamp(60px, 14vw, 130px)', opacity: 0.05 }}>🔧</div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, #010604, transparent)' }} />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>

        {/* ── Profile Card ──────────────────────────────────────────────── */}
        <div style={{ marginTop: -50, position: 'relative', zIndex: 10, marginBottom: 28 }}>
          <div style={{
            background: 'linear-gradient(135deg, #030d18, #041420)',
            border: '1px solid rgba(6,182,212,0.2)', borderRadius: 20, padding: 'clamp(16px, 3vw, 28px)',
            display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start',
          }}>
            {/* Avatar */}
            <div style={{
              width: 'clamp(70px, 12vw, 90px)', height: 'clamp(70px, 12vw, 90px)', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(199,166,106,0.1))',
              border: '3px solid rgba(6,182,212,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(24px, 5vw, 36px)', flexShrink: 0,
            }}>👨‍🔧</div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <h1 style={{ fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 800, margin: 0 }}>{installer.shortName}</h1>
                {installer.verified && (
                  <span style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)', color: '#06b6d4', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>✓ تأیید شده</span>
                )}
                {installer.elite && (
                  <span style={{ background: 'rgba(199,166,106,0.15)', border: '1px solid rgba(199,166,106,0.35)', color: '#C7A66A', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>🏆 متخصص برتر</span>
                )}
              </div>
              <div style={{ color: '#06b6d4', fontSize: 'clamp(11px, 2vw, 13px)', marginBottom: 10, opacity: 0.9 }}>{installer.tagline}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                <span style={{ color: '#6b7280', fontSize: 12 }}>📍 {installer.city}</span>
                <span style={{ color: '#6b7280', fontSize: 12 }}>📅 از {installer.since}</span>
                <span style={{ color: '#06b6d4', fontSize: 12, fontWeight: 600 }}>⚡ پاسخ در {installer.responseTime}</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800, color: '#06b6d4' }}>{installer.jobsDone}</div>
                <div style={{ color: '#6b7280', fontSize: 11 }}>کار انجام شده</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800, color: '#C7A66A' }}>{installer.rating}</div>
                <div style={{ color: '#6b7280', fontSize: 11 }}>{installer.reviewCount} نظر</div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%', marginTop: 4 }}>
              <button style={{ background: '#06b6d4', color: '#010604', border: 'none', padding: '11px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', flex: 1 }}>
                📞 تماس برای دریافت مشاوره
              </button>
              <button style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4', padding: '11px 18px', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>
                💬 پیام
              </button>
            </div>
          </div>
        </div>

        {/* ── Coverage regions ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ color: '#6b7280', fontSize: 13 }}>📍 منطقه خدمات‌دهی:</span>
          {installer.regions.map((r: string) => (
            <span key={r} style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4', fontSize: 12, padding: '4px 12px', borderRadius: 20 }}>{r}</span>
          ))}
        </div>

        {/* ── Tab Nav ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: 'rgba(0,0,0,0.03)', borderRadius: 14, padding: 4,
          border: '1px solid rgba(0,0,0,0.05)', overflowX: 'auto',
        }}>
          {([
            ['services', `خدمات (${installer.services.length})`],
            ['portfolio', `نمونه کارها (${installer.portfolio.length})`],
            ['reviews', `نظرات (${installer.reviewCount})`],
            ['contact', 'تماس'],
          ] as [string, string][]).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} style={{
              flex: 1, padding: '10px 6px', borderRadius: 10, border: 'none',
              background: activeTab === tab ? '#06b6d4' : 'transparent',
              color: activeTab === tab ? '#010604' : '#94a3b8',
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: 'clamp(11px, 2vw, 13px)', cursor: 'pointer', transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>

        {/* ── Services Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'services' && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 14 }}>
              {installer.services.map((service: ServiceItem, i: number) => (
                <div key={i} style={{
                  background: 'linear-gradient(135deg, #030d18, #041420)',
                  border: '1px solid rgba(6,182,212,0.12)', borderRadius: 16, padding: 22,
                  transition: 'all 0.3s', cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(6,182,212,0.35)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(6,182,212,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{service.icon}</div>
                  <h3 style={{ color: '#111111', fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{service.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 14px', lineHeight: 1.7 }}>{service.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#06b6d4', fontWeight: 700, fontSize: 14 }}>{service.price}</span>
                    <button style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                      استعلام
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Certifications */}
            {installer.certifications.length > 0 && (
              <div style={{ marginTop: 28, background: 'linear-gradient(135deg, #030d18, #041420)', border: '1px solid rgba(6,182,212,0.12)', borderRadius: 16, padding: 22 }}>
                <h3 style={{ color: '#06b6d4', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>گواهینامه‌ها و تخصص‌ها</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {installer.certifications.map((cert: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(0,0,0,0.50)', fontSize: 13 }}>
                      <span style={{ color: '#06b6d4' }}>✓</span> {cert}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Portfolio Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'portfolio' && (
          <div style={{ marginBottom: 48 }}>
            {installer.portfolio.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>هنوز نمونه کاری ثبت نشده</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {installer.portfolio.map((item: PortfolioItem) => (
                  <div key={item.id} style={{
                    background: 'linear-gradient(135deg, #030d18, #041420)',
                    border: '1px solid rgba(6,182,212,0.12)', borderRadius: 16, overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {/* Before/After placeholder */}
                      <div style={{
                        width: 'clamp(80px, 18%, 160px)', minHeight: 130, flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(199,166,106,0.05))',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                        fontSize: 36, opacity: 0.4,
                      }}>
                        🔧
                        <div style={{ fontSize: 10, color: '#06b6d4', opacity: 1 }}>تصویر کار</div>
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, padding: 20, minWidth: 200 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                          <h4 style={{ color: '#111111', fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 700, margin: 0 }}>{item.title}</h4>
                          <span style={{ color: '#6b7280', fontSize: 12 }}>{item.year}</span>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 10 }}>📍 {item.location} | ⏱ {item.duration}</div>
                        <p style={{ color: 'rgba(0,0,0,0.50)', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>{item.description}</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>{item.type}</span>
                          {item.tags.map((tag: string) => (
                            <span key={tag} style={{ background: 'rgba(0,0,0,0.04)', color: '#6b7280', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Reviews Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'reviews' && (
          <div style={{ marginBottom: 48 }}>
            {/* Summary */}
            <div style={{
              background: 'linear-gradient(135deg, #030d18, #041420)',
              border: '1px solid rgba(6,182,212,0.12)', borderRadius: 16,
              padding: 24, marginBottom: 20,
              display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: '#06b6d4', lineHeight: 1 }}>{installer.rating}</div>
                <StarRating rating={installer.rating} size={16} />
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>{installer.reviewCount} نظر</div>
              </div>
              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[5,4,3,2,1].map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#06b6d4', fontSize: 12, width: 8 }}>{s}</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 3 }}>
                      <div style={{ height: '100%', borderRadius: 3, background: '#06b6d4', width: s === 5 ? '75%' : s === 4 ? '18%' : '4%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Review list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {installer.reviews.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '30px 0' }}>هنوز نظری ثبت نشده</div>
              ) : installer.reviews.map((review: Review) => (
                <div key={review.id} style={{
                  background: 'linear-gradient(135deg, #030d18, #041420)',
                  border: '1px solid rgba(6,182,212,0.1)', borderRadius: 14, padding: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#06b6d4' }}>
                        {review.author.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#111111', fontSize: 14 }}>{review.author}</div>
                        <div style={{ color: '#4b5563', fontSize: 11 }}>{review.business} — {review.date}</div>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size={13} />
                  </div>
                  <p style={{ color: 'rgba(0,0,0,0.50)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Contact Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'contact' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20, marginBottom: 48 }}>
            <div style={{ background: 'linear-gradient(135deg, #030d18, #041420)', border: '1px solid rgba(6,182,212,0.12)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: '#06b6d4', fontSize: 16, fontWeight: 700, margin: '0 0 18px' }}>اطلاعات تماس</h3>
              {[
                ['📞', installer.phone, 'تلفن'],
                ...(installer.email ? [['📧', installer.email, 'ایمیل']] : []),
                ['📍', installer.city, 'شهر'],
                ['🕐', installer.workHours, 'ساعات کاری'],
              ].map(([icon, val, label], i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ color: '#4b5563', fontSize: 11, marginBottom: 2 }}>{label}</div>
                    <div style={{ color: 'rgba(0,0,0,0.50)', fontSize: 14 }}>{val}</div>
                  </div>
                </div>
              ))}
              <button style={{ width: '100%', background: '#06b6d4', color: '#010604', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
                📞 تماس مستقیم
              </button>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #030d18, #041420)', border: '1px solid rgba(6,182,212,0.12)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: '#06b6d4', fontSize: 16, fontWeight: 700, margin: '0 0 18px' }}>درخواست بازدید</h3>
              <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
                برای دریافت مشاوره رایگان و بازدید از محل نصب، پیام بگذارید. معمولاً در کمتر از {installer.responseTime} پاسخ می‌دهم.
              </p>
              <div style={{ background: 'rgba(6,182,212,0.06)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ color: '#06b6d4', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>⚡ پاسخ سریع: {installer.responseTime}</div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>تضمین پاسخگویی در ساعات کاری</div>
              </div>
              <button style={{ width: '100%', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                💬 ارسال پیام
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
