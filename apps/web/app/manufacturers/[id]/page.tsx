'use client';

import { useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface ManufacturedProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  specs: string[];
  image: string;
  badge?: string;
}

interface Project {
  id: string;
  title: string;
  client: string;
  city: string;
  year: string;
  quantity: number;
  type: string;
  image: string;
}

interface Certificate {
  title: string;
  issuer: string;
  year: string;
  icon: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_MANUFACTURERS: Record<string, any> = {
  '1': {
    id: '1',
    name: 'کارخانه بیلیارد سازان ایران',
    tagline: 'تولیدکننده رسمی میزهای حرفه‌ای بیلیارد — استاندارد WPBSA',
    since: '۱۳۷۸',
    city: 'تهران',
    employees: '۸۵',
    exportCountries: '۶',
    totalProduced: '۴,۲۰۰',
    verified: true,
    about: 'کارخانه بیلیارد سازان ایران با بیش از ۲۵ سال تجربه، پیشرو در تولید تجهیزات حرفه‌ای بیلیارد در خاورمیانه است. محصولات این کارخانه در بیش از ۶ کشور عرضه می‌شود و در مسابقات رسمی ایران استفاده می‌گردد.',
    productionCapability: 'ماهانه ۱۲۰ میز | سالانه ۵۰۰ چوب سفارشی',
    phone: '۰۲۱-۶۶۳۴۵۶۷۸',
    email: 'factory@billiardiran.ir',
    address: 'تهران، شهرک صنعتی شمس‌آباد، بلوار صنعت ۴',
    website: 'www.billiardiran.ir',
    specialties: ['میز اسنوکر', 'میز بیلیارد آمریکایی', 'میز کارامبول', 'چوب سفارشی', 'پارچه میز', 'کوسن لاستیکی'],
    certificates: [
      { title: 'استاندارد WPBSA', issuer: 'World Professional Billiards & Snooker Association', year: '۱۳۹۵', icon: '🏆' },
      { title: 'ایزو ۹۰۰۱', issuer: 'سازمان استاندارد ایران', year: '۱۳۹۸', icon: '📋' },
      { title: 'نشان ملی کیفیت', issuer: 'وزارت صمت', year: '۱۴۰۱', icon: '🥇' },
      { title: 'تأیید فدراسیون بیلیارد ایران', issuer: 'فدراسیون بیلیارد و اسنوکر', year: '۱۳۸۵', icon: '✅' },
    ],
    products: [
      { id: 'p1', name: 'میز اسنوکر حرفه‌ای BS-Tournament', category: 'میز اسنوکر', description: 'میز ۱۲ فوتی با تخته اسلیت ۴۵ میلی‌متری ایتالیایی، پارچه Strachan 6811', specs: ['ابعاد: ۳۶۵×۱۸۳ سانتی‌متر', 'تخته: اسلیت ۴۵mm ایتالیا', 'پارچه: Strachan 6811', 'کوسن: Super Pro', 'وزن: ۹۵۰ کیلوگرم'], image: '', badge: 'پرفروش' },
      { id: 'p2', name: 'میز آمریکایی BS-Pro 9ft', category: 'میز آمریکایی', description: 'میز ۹ فوتی مناسب برای باشگاه‌ها، با چوب بلوط جامد', specs: ['ابعاد: ۲۵۴×۱۲۷ سانتی‌متر', 'تخته: اسلیت ۲۵mm', 'پارچه: Simonis 860', 'کوسن: K-66 Profile'], image: '', badge: '' },
      { id: 'p3', name: 'میز اسنوکر خانگی BS-Home 10ft', category: 'میز اسنوکر', description: 'نسخه خانگی میز اسنوکر با کیفیت بالا و قیمت مناسب', specs: ['ابعاد: ۳۰۵×۱۵۳ سانتی‌متر', 'تخته: MDF بالاکیفیت', 'پارچه: Hainsworth Elite Pro'], image: '', badge: 'جدید' },
      { id: 'p4', name: 'پارچه میز اسنوکر Sovereign', category: 'پارچه', description: 'پارچه استاندارد مسابقاتی تولید داخل با کیفیت بین‌المللی', specs: ['جنس: ۷۰% پشم ۳۰% نایلون', 'رنگ: سبز / آبی', 'عرض: ۱۹۵ سانتی‌متر'], image: '', badge: '' },
    ],
    projects: [
      { id: 'pr1', title: 'باشگاه بین‌المللی آزادی', client: 'مجموعه ورزشی آزادی', city: 'تهران', year: '۱۴۰۳', quantity: 8, type: 'اسنوکر مسابقاتی', image: '' },
      { id: 'pr2', title: 'هتل اسپیناس پالاس', client: 'هتل اسپیناس', city: 'تهران', year: '۱۴۰۳', quantity: 4, type: 'آمریکایی لاکچری', image: '' },
      { id: 'pr3', title: 'مجموعه ورزشی شیراز', client: 'شهرداری شیراز', city: 'شیراز', year: '۱۴۰۲', quantity: 12, type: 'ترکیبی', image: '' },
      { id: 'pr4', title: 'باشگاه VIP تبریز', client: 'کلوب امیر', city: 'تبریز', year: '۱۴۰۲', quantity: 6, type: 'اسنوکر', image: '' },
    ],
  },
  '2': {
    id: '2', name: 'صنایع چوب بیلیارد پارسه', tagline: 'سازنده چوب‌های سفارشی حرفه‌ای', since: '۱۳۸۸', city: 'اصفهان',
    employees: '۳۰', exportCountries: '۲', totalProduced: '۱۵,۰۰۰', verified: true,
    about: 'پارسه متخصص ساخت چوب‌های سفارشی بیلیارد با چوب‌های نادر جهان است.',
    productionCapability: 'ماهانه ۲۰۰ چوب سفارشی',
    phone: '۰۳۱-۳۶۵۴۳۲۱۰', email: 'info@parsecue.ir', address: 'اصفهان، خیابان صنعتی', website: 'www.parsecue.ir',
    specialties: ['چوب سفارشی', 'تعمیر چوب', 'گریپ چوب'],
    certificates: [{ title: 'تأیید فدراسیون', issuer: 'فدراسیون بیلیارد', year: '۱۳۹۵', icon: '✅' }],
    products: [
      { id: 'p1', name: 'چوب سفارشی Parsé Master', category: 'چوب', description: 'ساخته شده با چوب افرا کانادایی', specs: ['وزن: ۵۴۰ گرم', 'طول: ۱۴۷ سانتی‌متر', 'نوک: چرم آبگینه'], image: '', badge: 'انحصاری' },
    ],
    projects: [
      { id: 'pr1', title: 'تیم ملی بیلیارد', client: 'فدراسیون بیلیارد', city: 'تهران', year: '۱۴۰۳', quantity: 20, type: 'چوب مسابقاتی', image: '' },
    ],
  },
  '3': {
    id: '3', name: 'کارگاه پارچه بیلیارد رویال', tagline: 'تولید پارچه تخصصی میزهای بیلیارد', since: '۱۳۹۰', city: 'یزد',
    employees: '۱۸', exportCountries: '۱', totalProduced: '۸,۵۰۰', verified: false,
    about: 'رویال تنها تولیدکننده تخصصی پارچه میز بیلیارد در ایران است.',
    productionCapability: 'ماهانه ۵۰۰ متر پارچه',
    phone: '۰۳۵-۳۸۲۴۵۶۷۸', email: 'royal@fabric.ir', address: 'یزد، شهرک صنعتی', website: '',
    specialties: ['پارچه اسنوکر', 'پارچه آمریکایی', 'پارچه کارامبول'],
    certificates: [{ title: 'استاندارد ملی', issuer: 'سازمان استاندارد', year: '۱۳۹۸', icon: '📋' }],
    products: [
      { id: 'p1', name: 'پارچه Premium Green', category: 'پارچه', description: 'پارچه سبز استاندارد مسابقات', specs: ['ترکیب: ۸۰% پشم', 'ضخامت: ۳.۵mm'], image: '', badge: '' },
    ],
    projects: [],
  },
  '4': {
    id: '4', name: 'فناوری بیلیارد نوین', tagline: 'تولید تجهیزات هوشمند بیلیارد', since: '۱۴۰۰', city: 'مشهد',
    employees: '۲۵', exportCountries: '۳', totalProduced: '۲,۱۰۰', verified: true,
    about: 'شرکت نوین اولین تولیدکننده سیستم‌های دیجیتال و هوشمند تجهیزات بیلیارد در ایران.',
    productionCapability: 'ماهانه ۵۰ سیستم هوشمند',
    phone: '۰۵۱-۳۵۶۷۸۹۰۱', email: 'info@novintechbilliard.ir', address: 'مشهد، پارک علم و فناوری', website: 'www.novintechbilliard.ir',
    specialties: ['سیستم بیلیارد هوشمند', 'نمایشگر دیجیتال', 'میز با LED'],
    certificates: [{ title: 'ایزو ۹۰۰۱', issuer: 'سازمان استاندارد', year: '۱۴۰۲', icon: '📋' }],
    products: [
      { id: 'p1', name: 'میز اسنوکر LED Pro', category: 'میز هوشمند', description: 'میز اسنوکر با نورپردازی LED هوشمند و تایمر دیجیتال', specs: ['LED Edge Lighting', 'تایمر دیجیتال', 'کنترل از موبایل'], image: '', badge: 'نوآورانه' },
    ],
    projects: [
      { id: 'pr1', title: 'باشگاه لاکچری کیش', client: 'ریزورت کیش', city: 'کیش', year: '۱۴۰۳', quantity: 3, type: 'میز LED هوشمند', image: '' },
    ],
  },
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ManufacturerDetailPage({ params }: { params: { id: string } }) {
  const mfr = MOCK_MANUFACTURERS[params?.id] ?? MOCK_MANUFACTURERS['1'];
  const [activeTab, setActiveTab] = useState<'products' | 'projects' | 'about' | 'certs'>('products');
  const [activeProduct, setActiveProduct] = useState<string | null>(null);

  return (
    <div style={{ background: '#F7F7F5', minHeight: '100vh', color: '#111111', fontFamily: 'Vazirmatn, system-ui', direction: 'rtl' }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 'clamp(200px, 32vw, 380px)', overflow: 'hidden' }}>
        {/* Background factory visual */}
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #05101a 0%, #081420 50%, #050c18 100%)', position: 'relative' }}>
          {/* Grid pattern */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(167,139,250,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          {/* Glow effects */}
          <div style={{ position: 'absolute', top: '30%', right: '20%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.12), transparent 70%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '20%', left: '10%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)', filter: 'blur(40px)' }} />
          {/* Center decorative */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: 'clamp(80px, 15vw, 150px)', opacity: 0.04 }}>🏭</div>
        </div>
        {/* Bottom gradient */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(to top, #010604, transparent)' }} />

        {/* Hero text overlay */}
        <div style={{ position: 'absolute', bottom: 40, right: 0, left: 0, padding: '0 clamp(16px, 4vw, 32px)', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
              🏭 تولیدکننده
            </span>
            {mfr.verified && (
              <span style={{ background: 'rgba(199,166,106,0.15)', border: '1px solid rgba(199,166,106,0.3)', color: '#C7A66A', fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
                ✓ تأیید شده
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 900, margin: '0 0 6px', color: '#111111', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
            {mfr.name}
          </h1>
          <div style={{ color: '#a78bfa', fontSize: 'clamp(12px, 2vw, 15px)', opacity: 0.9 }}>{mfr.tagline}</div>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>

        {/* ── Key Stats ────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12, marginTop: 24, marginBottom: 28 }}>
          {[
            { label: 'سال تأسیس', value: mfr.since, icon: '📅', color: '#a78bfa' },
            { label: 'پرسنل', value: mfr.employees + ' نفر', icon: '👷', color: '#06b6d4' },
            { label: 'تولید شده', value: mfr.totalProduced + ' عدد', icon: '🏭', color: '#C7A66A' },
            { label: 'صادرات', value: mfr.exportCountries + ' کشور', icon: '🌍', color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'linear-gradient(135deg, #0f0e1a, #0a0d18)',
              border: `1px solid ${stat.color}20`,
              borderRadius: 14, padding: '16px 14px', textAlign: 'center',
              borderTop: `2px solid ${stat.color}`,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 'clamp(15px, 3vw, 20px)', fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Production capabilities strip ──────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(167,139,250,0.08), rgba(6,182,212,0.08))',
          border: '1px solid rgba(167,139,250,0.15)',
          borderRadius: 12, padding: '12px 20px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ color: '#a78bfa', fontSize: 14 }}>⚙️</span>
          <span style={{ color: 'rgba(0,0,0,0.50)', fontSize: 13 }}><strong style={{ color: '#a78bfa' }}>ظرفیت تولید:</strong> {mfr.productionCapability}</span>
        </div>

        {/* ── Specialties ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 10 }}>تخصص‌های تولیدی</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {mfr.specialties.map((spec: string) => (
              <span key={spec} style={{
                background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
                color: '#a78bfa', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              }}>{spec}</span>
            ))}
          </div>
        </div>

        {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: 'rgba(0,0,0,0.03)', borderRadius: 14, padding: 4,
          border: '1px solid rgba(0,0,0,0.05)', overflowX: 'auto',
        }}>
          {([
            ['products', `محصولات (${mfr.products.length})`],
            ['projects', `پروژه‌ها (${mfr.projects.length})`],
            ['certs', `گواهینامه‌ها (${mfr.certificates.length})`],
            ['about', 'درباره ما'],
          ] as [string, string][]).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} style={{
              flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
              background: activeTab === tab ? '#a78bfa' : 'transparent',
              color: activeTab === tab ? '#010604' : '#94a3b8',
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: 'clamp(11px, 2vw, 13px)', cursor: 'pointer', transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>

        {/* ── Products Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mfr.products.map((product: ManufacturedProduct) => (
                <div key={product.id} style={{
                  background: 'linear-gradient(135deg, #0f0e1a, #0a0d18)',
                  border: `1px solid ${activeProduct === product.id ? 'rgba(167,139,250,0.4)' : 'rgba(167,139,250,0.1)'}`,
                  borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }} onClick={() => setActiveProduct(activeProduct === product.id ? null : product.id)}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                    {/* Image */}
                    <div style={{
                      width: 'clamp(100px, 20%, 180px)', minHeight: 140,
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(6,182,212,0.05))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 48, opacity: 0.5, flexShrink: 0,
                    }}>🎱</div>
                    {/* Content */}
                    <div style={{ flex: 1, padding: 20, minWidth: 200 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ color: '#a78bfa', fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{product.category}</div>
                          <h3 style={{ color: '#111111', fontSize: 'clamp(14px, 2.5vw, 17px)', fontWeight: 700, margin: '0 0 8px' }}>{product.name}</h3>
                        </div>
                        {product.badge && (
                          <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, flexShrink: 0 }}>{product.badge}</span>
                        )}
                      </div>
                      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>{product.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a78bfa', fontSize: 12 }}>
                        <span>▼ مشخصات فنی</span>
                      </div>
                    </div>
                  </div>
                  {/* Expanded specs */}
                  {activeProduct === product.id && (
                    <div style={{
                      borderTop: '1px solid rgba(167,139,250,0.15)', padding: 20,
                      background: 'rgba(167,139,250,0.04)',
                    }}>
                      <div style={{ color: '#a78bfa', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>مشخصات فنی</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                        {product.specs.map((spec: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(0,0,0,0.50)', fontSize: 13 }}>
                            <span style={{ color: '#a78bfa', flexShrink: 0 }}>✓</span> {spec}
                          </div>
                        ))}
                      </div>
                      <button style={{
                        marginTop: 16, background: '#a78bfa', color: '#010604',
                        border: 'none', padding: '10px 24px', borderRadius: 10,
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      }}>درخواست قیمت / سفارش</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Projects Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'projects' && (
          <div style={{ marginBottom: 48 }}>
            {mfr.projects.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>هنوز پروژه‌ای ثبت نشده</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
                {mfr.projects.map((project: Project) => (
                  <div key={project.id} style={{
                    background: 'linear-gradient(135deg, #0f0e1a, #0a0d18)',
                    border: '1px solid rgba(167,139,250,0.12)', borderRadius: 16, overflow: 'hidden',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(167,139,250,0.35)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(167,139,250,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                  >
                    {/* Project image placeholder */}
                    <div style={{ height: 140, background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(6,182,212,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.3, position: 'relative' }}>
                      🏆
                      <div style={{ position: 'absolute', bottom: 10, left: 12, background: 'rgba(0,0,0,0.7)', color: '#a78bfa', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>{project.year}</div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <h4 style={{ color: '#111111', fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>{project.title}</h4>
                      <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 12 }}>{project.client} — {project.city}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>{project.type}</span>
                        <span style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>{project.quantity} دستگاه</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Certificates Tab ─────────────────────────────────────────────── */}
        {activeTab === 'certs' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16, marginBottom: 48 }}>
            {mfr.certificates.map((cert: Certificate, i: number) => (
              <div key={i} style={{
                background: 'linear-gradient(135deg, #0f0e1a, #0a0d18)',
                border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: 24,
                borderTop: '2px solid #f59e0b',
                display: 'flex', gap: 16, alignItems: 'flex-start',
              }}>
                <div style={{ fontSize: 36, flexShrink: 0 }}>{cert.icon}</div>
                <div>
                  <h4 style={{ color: '#111111', fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>{cert.title}</h4>
                  <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 8 }}>{cert.issuer}</div>
                  <span style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>صادر: {cert.year}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── About Tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'about' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20, marginBottom: 48 }}>
            <div style={{ background: 'linear-gradient(135deg, #0f0e1a, #0a0d18)', border: '1px solid rgba(167,139,250,0.1)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: '#a78bfa', fontSize: 16, fontWeight: 700, marginBottom: 14, marginTop: 0 }}>معرفی کارخانه</h3>
              <p style={{ color: 'rgba(0,0,0,0.50)', fontSize: 14, lineHeight: 2, margin: 0 }}>{mfr.about}</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #0f0e1a, #0a0d18)', border: '1px solid rgba(167,139,250,0.1)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: '#a78bfa', fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>اطلاعات تماس</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['📞', mfr.phone], ['📧', mfr.email],
                  ['📍', mfr.address],
                  ...(mfr.website ? [['🌐', mfr.website]] : []),
                ].map(([icon, val], i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, color: 'rgba(0,0,0,0.50)', fontSize: 13 }}>
                    <span style={{ flexShrink: 0 }}>{icon}</span>
                    <span style={{ lineHeight: 1.5 }}>{val}</span>
                  </div>
                ))}
              </div>
              <button style={{ marginTop: 20, width: '100%', background: '#a78bfa', color: '#010604', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                📩 ارسال استعلام قیمت
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
