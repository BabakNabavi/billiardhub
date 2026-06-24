'use client';

import { useEffect, useState } from 'react';
import { Calendar, Trophy, ShoppingBag, MapPin } from 'lucide-react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

const activities = [
  { type: 'booking',  user: 'علی م.',    action: 'میز اسنوکر رزرو کرد',     club: 'باشگاه ستاره تهران', time: '۲ دقیقه پیش',  color: '#C7A66A', icon: <Calendar size={13} /> },
  { type: 'event',    user: 'رضا ک.',    action: 'در مسابقه ثبت‌نام کرد',    club: 'جام پاکت تهران',    time: '۵ دقیقه پیش',  color: '#a78bfa', icon: <Trophy size={13} />   },
  { type: 'purchase', user: 'سارا ه.',   action: 'چوب Predator خرید',        club: 'فروشگاه بیلیارد پلاس', time: '۱۱ دقیقه پیش', color: '#f59e0b', icon: <ShoppingBag size={13} /> },
  { type: 'booking',  user: 'محمد ع.',   action: 'میز VIP رزرو کرد',         club: 'باشگاه المپیک مشهد', time: '۱۸ دقیقه پیش', color: '#C7A66A', icon: <Calendar size={13} /> },
  { type: 'event',    user: 'نیما ف.',   action: 'قهرمان هفته شد',           club: 'لیگ هی‌بال اصفهان',  time: '۲۵ دقیقه پیش', color: '#f59e0b', icon: <Trophy size={13} />   },
  { type: 'club',     user: 'کاوه م.',   action: 'باشگاه جدید ثبت کرد',      club: 'شیراز',              time: '۳۲ دقیقه پیش', color: '#06b6d4', icon: <MapPin size={13} />   },
];

export function RecentActivity() {
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(v => v < activities.length ? v + 1 : 3);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <ScrollReveal>
      <section style={{ marginBottom: '110px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '9px', color: 'rgba(199,166,106,0.6)', letterSpacing: '0.28em', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>LIVE ACTIVITY</div>
            <h2 style={{ fontSize: 'clamp(20px,2.5vw,26px)', fontWeight: 900, color: '#111111', margin: 0, letterSpacing: '-0.025em' }}>
              فعالیت‌های اخیر
            </h2>
          </div>
          {/* Live dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', padding: '4px 12px', marginTop: '18px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700, letterSpacing: '0.06em' }}>زنده</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activities.slice(0, visible).map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 18px',
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: '14px',
              opacity: i < visible ? 1 : 0,
              transform: i < visible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
            }}>
              {/* Icon */}
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${a.color}12`, border: `1px solid ${a.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, flexShrink: 0 }}>
                {a.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: '#111111', fontWeight: 600, marginBottom: '3px' }}>
                  <span style={{ color: a.color }}>{a.user}</span>
                  {' '}{a.action}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.35)' }}>{a.club}</div>
              </div>

              {/* Time */}
              <div style={{ fontSize: '10px', color: 'rgba(0,0,0,0.30)', letterSpacing: '0.04em', flexShrink: 0 }}>
                {a.time}
              </div>
            </div>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}