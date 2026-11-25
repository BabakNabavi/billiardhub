'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import ScrollList from '../../../components/ui/ScrollList';
import { apiFetch } from '../../../lib/http';
import { CheckCircle, XCircle, Eye, Star } from 'lucide-react';
import TabStrip from '../../../components/ui/TabStrip';
import { AdminHeader } from '../../../components/admin/AdminHeader';

interface VerificationRequest {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  primaryRole: string;
  city: string;
  verificationStatus: string;
  bio?: string;
  createdAt: string;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  player: { label: 'بازیکن', color: 'text-orange-600' },
  coach: { label: 'مربی', color: 'text-blue-600' },
  referee: { label: 'داور', color: 'text-indigo-600' },
  club_owner: { label: 'مالک باشگاه', color: 'text-green-600' },
  seller: { label: 'فروشگاه', color: 'text-purple-600' },
  manufacturer: { label: 'تولیدکننده', color: 'text-red-600' },
  installer: { label: 'متخصص نصب', color: 'text-teal-600' },
};

export default function AdminVerificationsPage() {
  const router = useRouter();
  /* `_hydrated` لازم است: استور از localStorage خوانده می‌شود و در
     نخستین رندر `user` تهی است. بدون این محافظ، هر رفرش یا هر ورود
     از بوکمارک ادمین را به صفحه‌ی اصلی پرت می‌کرد — صفحه اصلا باز
     نمی‌شد. (ابزار سنجش UI این را لو داد: به‌جای عناصر پنل،
     `section.clubs-section` صفحه‌ی اصلی را اندازه می‌گرفت.) */
  const { user, _hydrated } = useAuthStore();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!_hydrated) return;
    if (!user || user.primaryRole !== 'admin') { router.push('/'); return; }
    /* منبع: `/api/admin/users`. پیش‌تر `/user/all` بود — مسیر
       بک‌اند حذف‌شده‌ی NestJS که ۴۰۴ می‌داد و `.catch` بی‌صدا
       می‌بلعیدش، پس صف احراز هویت همیشه خالی به نظر می‌رسید. */
    void (async () => {
      try {
        const r = await apiFetch('/api/admin/users', { cache: 'no-store' });
        const j = await r.json().catch(() => ({})) as { users?: VerificationRequest[]; message?: string };
        if (!r.ok) { setErr(j.message ?? 'خواندن کاربران انجام نشد'); return; }
        setRequests((j.users ?? []).filter(u =>
          ['pending', 'verified', 'rejected'].includes(u.verificationStatus)));
        setErr('');
      } catch { setErr('خطا در ارتباط با سرور'); }
      finally { setLoading(false); }
    })();
  }, [_hydrated, user]);

  const handleVerify = async (userId: string, status: string) => {
    setErr('');
    try {
      const r = await apiFetch('/api/admin/users', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, verificationStatus: status }),
      });
      const j = await r.json().catch(() => ({})) as { message?: string };
      if (!r.ok) { setErr(j.message ?? 'تغییر وضعیت انجام نشد'); return; }
      setRequests(rs => rs.map(x => x.id === userId ? { ...x, verificationStatus: status } : x));
    } catch { setErr('خطا در ارتباط با سرور'); }
  };

  const filtered = requests.filter(r => r.verificationStatus === activeTab);

  const counts = {
    pending: requests.filter(r => r.verificationStatus === 'pending').length,
    verified: requests.filter(r => r.verificationStatus === 'verified').length,
    rejected: requests.filter(r => r.verificationStatus === 'rejected').length,
  };

  if (!_hydrated) return null;
  if (!user || user.primaryRole !== 'admin') return null;

  return (
    <main className="adm-page">
      <AdminHeader
        icon={<Star size={26} className="text-gold-text" aria-hidden />}
        title="تأیید کاربران"
        description={counts.pending > 0 ? `${counts.pending.toLocaleString("fa-IR")} درخواست در انتظار` : undefined} />

      {err && (
        <div role="alert" className="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger-ink">
          {err}
        </div>
      )}

      <TabStrip value={activeTab} onChange={setActiveTab} style={{ marginBottom: 0 }}
        tabs={[
          { key: 'pending', label: 'در انتظار', count: counts.pending, fg: '#92600A', bg: 'rgba(245,158,11,0.12)' },
          { key: 'verified', label: 'تأیید شده', count: counts.verified, fg: '#0E7A38', bg: 'rgba(14,122,56,0.10)' },
          { key: 'rejected', label: 'رد شده', count: counts.rejected, fg: '#B23B2E', bg: 'rgba(178,59,46,0.08)' },
        ]} />

      {/* لیست */}
      {loading ? (
        <ul aria-busy="true" aria-label="در حال بارگذاری" className="m-0 grid list-none gap-3 p-0">
          {[0, 1, 2].map(i => (
            <li key={i} className="h-24 rounded-card border border-line/10 bg-surface motion-safe:animate-pulse" />
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <div className="adm-card py-12 text-center">
          <Star size={32} className="mx-auto mb-3 text-ink-3" aria-hidden />
          <p className="m-0 text-sm text-ink-2">درخواستی در این بخش وجود ندارد</p>
        </div>
      ) : (
        <ScrollList count={filtered.length} min={5} gap={12}>
          {filtered.map(req => (
            <article key={req.id} className="adm-card flex flex-wrap items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-lg font-semibold text-gold-text" aria-hidden>
                {req.firstName?.[0]}
              </div>
              <div className="min-w-0 basis-48 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h2 className="adm-break m-0 text-sm font-semibold text-ink">{req.firstName} {req.lastName}</h2>
                  <span className={`text-xs font-medium ${roleLabels[req.primaryRole]?.color || 'text-gray-600'}`}>
                    {roleLabels[req.primaryRole]?.label || req.primaryRole}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2">
                  <span>📱 {req.phone}</span>
                  {req.city && <span>📍 {req.city}</span>}
                  <span>📅 {req.createdAt ? new Date(req.createdAt).toLocaleDateString('fa-IR') : '—'}</span>
                </div>
                {req.bio && (
                  <p className="adm-break m-0 mt-2 rounded-field bg-paper p-3 text-sm leading-loose text-ink-2">{req.bio}</p>
                )}
              </div>

              <div className="adm-actions basis-full justify-end md:basis-auto">
                <button type="button" onClick={() => router.push(`/users/${req.id}`)}
                  className="inline-flex size-11 items-center justify-center rounded-field text-ink-3 transition-colors hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
                  title="مشاهده پروفایل" aria-label={`مشاهده پروفایل ${req.firstName} ${req.lastName}`}>
                  <Eye size={18} aria-hidden />
                </button>
                {activeTab !== 'verified' && (
                  <button type="button" onClick={() => handleVerify(req.id, 'verified')}
                    className="inline-flex h-11 items-center gap-1 rounded-field bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
                    <CheckCircle size={15} aria-hidden />
                    تأیید
                  </button>
                )}
                {activeTab !== 'rejected' && (
                  <button type="button" onClick={() => handleVerify(req.id, 'rejected')}
                    className="inline-flex h-11 items-center gap-1 rounded-field bg-red-500 px-4 text-sm font-medium text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
                    <XCircle size={15} aria-hidden />
                    رد
                  </button>
                )}
              </div>
            </article>
          ))}
        </ScrollList>
      )}
    </main>
  );
}
