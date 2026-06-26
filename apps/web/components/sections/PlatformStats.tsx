'use client';

import { Trophy, Building2, Users, Calendar, ShoppingBag, Star } from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

const stats = [
  { value: '۵۴۸',   label: 'باشگاه فعال',      sub: 'در ۳۱ استان',       color: '#C7A66A', icon: <Building2 size={20} /> },
  { value: '۱۲,۴۰۰', label: 'بازیکن ثبت‌شده',   sub: 'از سراسر ایران',    color: '#06b6d4', icon: <Users size={20} />    },
  { value: '۲۱۸',   label: 'مسابقه برگزارشده',  sub: 'در سال جاری',       color: '#a78bfa', icon: <Trophy size={20} />   },
  { value: '۳,۲۰۰+', label: 'رزرو آنلاین',       sub: 'هر ماه',           color: '#f59e0b', icon: <Calendar size={20} /> },
  { value: '۱,۸۵۰', label: 'محصول فروشگاه',     sub: 'از ۱۲۰ برند',       color: '#ef4444', icon: <ShoppingBag size={20} /> },
  { value: '۴.۸',   label: 'امتیاز میانگین',     sub: 'از ۵ — ۸,۴۰۰ نظر', color: '#f59e0b', icon: <Star size={20} />     },
];

export function PlatformStats() {
  return (
    <ScrollReveal>
      <section style={{ marginBottom: '110px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(199,166,106,0.6)', letterSpacing: '0.28em', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>
            PLATFORM SCALE
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.9vw, 37px)', fontWeight: 900, color: '#111111', margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            اکوسیستم بیلیارد ایران
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(0,0,0,0.40)', margin: '0 auto', maxWidth: '380px', lineHeight: 1.7 }}>
            بزرگ‌ترین پلتفرم تخصصی بیلیارد با حضور فعال در تمام استان‌های کشور
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}
          className="stats-g">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} delay={i * 0.08} />
          ))}
        </div>

        <style>{`
          @media(max-width:900px) { .stats-g { grid-template-columns: repeat(2,1fr) !important; } }
          @media(max-width:480px) { .stats-g { grid-template-columns: 1fr !important; } }
        `}</style>
      </section>
    </ScrollReveal>
  );
}