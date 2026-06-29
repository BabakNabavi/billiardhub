'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { Check, X, ExternalLink, FileText, Clock } from 'lucide-react';

const GOLD = '#C7A66A';

interface ClubRow {
  id: string;
  name: string;
  city: string;
  province?: string;
  ownerId: string;
  verificationStatus: string;
  licenseDocumentUrl?: string;
  createdAt: string;
}

async function fetchClubs(): Promise<ClubRow[]> {
  const res = await fetch('/api/clubs?all=true');
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function updateStatus(id: string, status: string) {
  await fetch(`/api/clubs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ verificationStatus: status }),
  });
}

function getToken(): string {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return '';
    return JSON.parse(raw)?.state?.token ?? '';
  } catch { return ''; }
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: 'در انتظار بررسی', color: '#92600A', bg: '#FEF3C7', icon: <Clock size={13} /> },
  verified:   { label: 'تأیید شده',       color: '#166534', bg: '#DCFCE7', icon: <Check size={13} /> },
  rejected:   { label: 'رد شده',          color: '#991B1B', bg: '#FEE2E2', icon: <X size={13} /> },
  unverified: { label: 'بدون مدرک',       color: '#4B5563', bg: '#F3F4F6', icon: <FileText size={13} /> },
};

export default function AdminClubsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected' | 'unverified'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.primaryRole !== 'admin') { router.push('/'); return; }
    fetchClubs().then(data => { setClubs(data); setLoading(false); });
  }, [user]);

  const setStatus = async (id: string, status: string) => {
    setActionLoading(id + status);
    await updateStatus(id, status);
    setClubs(cs => cs.map(c => c.id === id ? { ...c, verificationStatus: status } : c));
    setActionLoading(null);
  };

  const filtered = filter === 'all' ? clubs : clubs.filter(c => c.verificationStatus === filter);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontFamily: 'var(--font-base)' }}>در حال بارگذاری...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px', fontFamily: 'var(--font-base)', direction: 'rtl' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: GOLD, fontWeight: 700, letterSpacing: '0.2em', marginBottom: 6 }}>ADMIN</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: 0 }}>تأیید باشگاه‌ها</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>بررسی مدارک و صدور تیک تأیید</p>
      </div>

      {/* فیلتر */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'pending', 'verified', 'rejected', 'unverified'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-base)', cursor: 'pointer',
              background: filter === f ? GOLD : '#fff',
              color: filter === f ? '#fff' : '#374151',
              borderColor: filter === f ? GOLD : '#e5e7eb',
            }}>
            {f === 'all' ? 'همه' : STATUS_LABEL[f]?.label ?? f}
            {f !== 'all' && (
              <span style={{ marginRight: 6, background: filter === f ? 'rgba(255,255,255,0.25)' : '#f3f4f6', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                {clubs.filter(c => c.verificationStatus === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* لیست */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}>موردی یافت نشد</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(club => {
            const st = STATUS_LABEL[club.verificationStatus] ?? STATUS_LABEL.unverified;
            return (
              <div key={club.id} style={{ background: '#fff', border: '1px solid #f0ede8', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  {/* اطلاعات */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{club.name}</span>
                      {club.verificationStatus === 'verified' && (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1d9bf0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={12} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {club.province && `${club.province} / `}{club.city}
                    </div>
                  </div>

                  {/* وضعیت */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: st.bg, color: st.color, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    {st.icon} {st.label}
                  </div>

                  {/* مدرک */}
                  {club.licenseDocumentUrl ? (
                    <a href={club.licenseDocumentUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.30)', color: GOLD, borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                      <ExternalLink size={12} /> مشاهده مدرک
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileText size={12} /> بدون مدرک
                    </span>
                  )}
                </div>

                {/* دکمه‌های اقدام */}
                {club.licenseDocumentUrl && club.verificationStatus !== 'verified' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                    <button
                      disabled={!!actionLoading}
                      onClick={() => setStatus(club.id, 'verified')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-base)', opacity: actionLoading === club.id + 'verified' ? 0.6 : 1 }}>
                      <Check size={14} /> تأیید و اعطای تیک
                    </button>
                    {club.verificationStatus !== 'rejected' && (
                      <button
                        disabled={!!actionLoading}
                        onClick={() => setStatus(club.id, 'rejected')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-base)', opacity: actionLoading === club.id + 'rejected' ? 0.6 : 1 }}>
                        <X size={14} /> رد
                      </button>
                    )}
                  </div>
                )}
                {club.verificationStatus === 'verified' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                    <button
                      disabled={!!actionLoading}
                      onClick={() => setStatus(club.id, 'rejected')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-base)' }}>
                      <X size={12} /> لغو تأیید
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
