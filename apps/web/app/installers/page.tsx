'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Settings, MapPin, CheckCircle, X } from 'lucide-react';
import api from '../../lib/api';

interface Installer {
  id: string;
  firstName: string;
  lastName: string;
  verificationStatus: string;
  bio: string;
  city: string;
  avatar: string;
  installerProfile: {
    specialization: string;
    serviceArea: string;
    experience: string;
  };
}

const mockData: Installer[] = [
  { id: '1', firstName: 'کاوه', lastName: 'صادقی', verificationStatus: 'verified', bio: 'متخصص نصب و راه‌اندازی انواع میز بیلیارد با بیش از ۸ سال سابقه', city: 'تهران', avatar: '', installerProfile: { specialization: 'نصب میز اسنوکر', serviceArea: 'تهران و البرز', experience: '۸ سال' } },
  { id: '2', firstName: 'نادر', lastName: 'حسینی', verificationStatus: 'verified', bio: 'نصب، تراز و تعمیر انواع میز بیلیارد', city: 'مشهد', avatar: '', installerProfile: { specialization: 'نصب و تعمیر', serviceArea: 'خراسان رضوی', experience: '۵ سال' } },
];

export default function InstallersPage() {
  const [items, setItems] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);

  useEffect(() => {
    api.get('/user/by-role/installer')
      .then(res => { setItems(res.data); setLoading(false); })
      .catch(() => { setItems(mockData); setLoading(false); });
  }, []);

  const filtered = items.filter(s =>
    `${s.firstName} ${s.lastName} ${s.city} ${s.installerProfile?.specialization ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        .ins-card { transition: all 0.3s ease; }
        .ins-card:hover { transform: translateY(-4px); border-color: rgba(245,158,11,0.3) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important; }
      `}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#010604 0%,#050c08 100%)', padding: 'clamp(24px,4vw,48px) clamp(16px,3vw,32px)', direction: 'rtl' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          <div style={{ marginBottom: '36px', animation: 'fadeUp 0.6s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}>
                <Settings size={20} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: '#f0faf5', margin: 0, letterSpacing: '-0.025em' }}>متخصصان نصب</h1>
                <p style={{ color: 'rgba(240,250,245,0.35)', fontSize: '13px', margin: '2px 0 0' }}>نصب و راه‌اندازی تخصصی تجهیزات بیلیارد</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${searchFocus ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '14px', padding: '12px 16px', transition: 'all 0.3s' }}>
              <Search size={15} color="rgba(240,250,245,0.25)" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
                placeholder="جستجو بر اساس نام یا شهر..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f0faf5', fontSize: '14px', fontFamily: 'inherit' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,250,245,0.3)', padding: 0, display: 'flex' }}><X size={14} /></button>}
            </div>
          </div>

          <div style={{ marginBottom: '20px', color: 'rgba(240,250,245,0.3)', fontSize: '13px' }}>{filtered.length} متخصص یافت شد</div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>
              {[1,2,3].map(i => <div key={i} style={{ height: '180px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(240,250,245,0.2)' }}>
              <Settings size={40} style={{ opacity: 0.2, marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px' }}>متخصصی پیدا نشد</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>
              {filtered.map((item, i) => (
                <Link key={item.id} href={`/users/${item.id}`} style={{ textDecoration: 'none' }}>
                  <div className="ins-card" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px', cursor: 'pointer', animation: `fadeUp 0.5s ${i * 0.05}s ease both` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(217,119,6,0.2))', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontWeight: 900, fontSize: '18px', flexShrink: 0, overflow: 'hidden' }}>
                        {item.avatar ? <img src={item.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.firstName?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ color: '#f0faf5', fontWeight: 700, fontSize: '15px' }}>{item.firstName} {item.lastName}</span>
                          {item.verificationStatus === 'verified' && <CheckCircle size={14} color="#f59e0b" />}
                        </div>
                        {item.city && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(240,250,245,0.35)', fontSize: '12px' }}><MapPin size={11} /><span>{item.city}</span></div>}
                      </div>
                    </div>
                    {item.installerProfile?.specialization && (
                      <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: '10px', padding: '8px 12px', marginBottom: '10px' }}>
                        <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>🔧 {item.installerProfile.specialization}</div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                          {item.installerProfile.serviceArea && <span style={{ color: 'rgba(240,250,245,0.3)', fontSize: '11px' }}>📍 {item.installerProfile.serviceArea}</span>}
                          {item.installerProfile.experience && <span style={{ color: 'rgba(240,250,245,0.3)', fontSize: '11px' }}>⏱ {item.installerProfile.experience}</span>}
                        </div>
                      </div>
                    )}
                    {item.bio && <p style={{ color: 'rgba(240,250,245,0.4)', fontSize: '12px', lineHeight: 1.6, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.bio}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
