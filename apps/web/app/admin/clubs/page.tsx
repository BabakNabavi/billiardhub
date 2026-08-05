'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { Check, X, ExternalLink, FileText, Clock, Eye } from 'lucide-react';
import { apiFetch } from '../../../lib/http';
import { REJECT_REASONS } from '../../../lib/moderation/reasons';
import ReviewDetails from '../../../components/admin/ReviewDetails';

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

async function updateStatus(id: string, status: string, rejectionReason?: string) {
  const r = await apiFetch(`/api/clubs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verificationStatus: status, ...(rejectionReason ? { rejectionReason } : {}) }),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({})) as { message?: string };
    throw new Error(j.message ?? 'عملیات انجام نشد');
  }
}

/* مدرکِ جواز در باکتِ خصوصی است و لینکِ مستقیم ندارد؛ سرور پس از بررسی
   دسترسی یک لینکِ امضاشده‌ی دو دقیقه‌ای می‌دهد. باز کردنِ پنجره پیش از
   await انجام می‌شود، وگرنه مرورگر آن را pop-up ناخواسته می‌شمارد و
   می‌بندد. */
async function openLicenseDoc(id: string) {
  const w = window.open('', '_blank', 'noopener,noreferrer');
  try {
    const r = await apiFetch(`/api/clubs/${id}/license-doc`);
    const j = await r.json().catch(() => ({})) as { url?: string; message?: string };
    if (!r.ok || !j.url) { w?.close(); alert(j.message ?? 'مدرک در دسترس نیست'); return; }
    if (w) w.location.href = j.url; else window.open(j.url, '_blank', 'noopener,noreferrer');
  } catch {
    w?.close();
    alert('خطا در ارتباط با سرور');
  }
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: 'در انتظار بررسی', color: '#92600A', bg: '#FEF3C7', icon: <Clock size={13} /> },
  verified:   { label: 'تأیید + تیک آبی', color: '#166534', bg: '#DCFCE7', icon: <Check size={13} /> },
  /* منتشرشده ولی بی‌تیک — عمداً رنگش با «تأیید + تیک» یکی نیست تا در
     فهرست بی‌نگاه‌کردن به متن هم از هم جدا شوند. */
  approved:   { label: 'منتشر بدون تیک',  color: '#1D4ED8', bg: '#DBEAFE', icon: <Eye size={13} /> },
  rejected:   { label: 'رد شده',          color: '#991B1B', bg: '#FEE2E2', icon: <X size={13} /> },
  unverified: { label: 'بدون مدرک',       color: '#4B5563', bg: '#F3F4F6', icon: <FileText size={13} /> },
};

export default function AdminClubsPage() {
  const router = useRouter();
  /* بدونِ `_hydrated`، نخستین رندر `user` را تهی می‌بیند (استور از
     localStorage خوانده می‌شود) و ادمین را به صفحه‌ی ورود پرت می‌کند —
     یعنی رفرش یا ورود از بوکمارک هرگز به این صفحه نمی‌رسید. */
  const { user, _hydrated } = useAuthStore();
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'approved' | 'rejected' | 'unverified'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!_hydrated) return;
    if (!user) { router.push('/login'); return; }
    if (user.primaryRole !== 'admin') { router.push('/'); return; }
    fetchClubs().then(data => { setClubs(data); setLoading(false); });
  }, [_hydrated, user]);

  const [err, setErr] = useState('');
  /* باشگاهی که در حالِ رد کردنش هستیم، و کدِ علتِ انتخاب‌شده */
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectCode, setRejectCode] = useState('');
  const [openClub, setOpenClub] = useState<string | null>(null);

  const setStatus = async (id: string, status: string) => {
    /* رد کردن بدون علت پذیرفته نمی‌شود — مالک باید بداند چه را اصلاح کند.
       سرور هم همین را اجبار می‌کند؛ این‌جا فقط زودتر پرسیده می‌شود. */
    /* رد کردن از پنجره‌ی جدا می‌گذرد، چون علت باید از فهرستِ بسته
       انتخاب شود: این متن داخلِ پیامکِ مالک می‌رود و سرویسِ پیامک
       مقدارهای ممکنِ آن را از قبل می‌خواهد. `window.prompt` متنِ آزاد
       می‌داد و چنین چیزی قابلِ اعلام نیست. */
    if (status === 'rejected') { setRejectFor(id); setRejectCode(''); return; }

    await applyStatus(id, status);
  };

  const applyStatus = async (id: string, status: string, reason?: string) => {
    setActionLoading(id + status); setErr('');
    try {
      await updateStatus(id, status, reason);
      setClubs(cs => cs.map(c => c.id === id
        ? { ...c, verificationStatus: status, rejectionReason: reason ?? null }
        : c));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'عملیات انجام نشد');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === 'all' ? clubs : clubs.filter(c => c.verificationStatus === filter);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontFamily: 'var(--font-base)' }}>در حال بارگذاری...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px', fontFamily: 'var(--font-base)', direction: 'rtl' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: GOLD, fontWeight: 700, letterSpacing: '0.2em', marginBottom: 6 }}>ADMIN</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: 0 }}>تأیید باشگاه‌ها</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          هر دو «تأیید» باشگاه را در سایت منتشر می‌کنند؛ تفاوتشان فقط تیکِ آبی است. رد یعنی برداشتن از فهرست.
        </p>
      </div>

      {err && (
        <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700,
          background: '#FEE2E2', border: '1px solid rgba(220,38,38,0.28)', color: '#991B1B' }}>
          {err}
        </div>
      )}

      {/* فیلتر */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'pending', 'verified', 'approved', 'rejected', 'unverified'] as const).map(f => (
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
            const st = STATUS_LABEL[club.verificationStatus] ?? STATUS_LABEL['unverified'] ?? { label: club.verificationStatus, color: '#6b7280', bg: 'rgba(156,163,175,0.1)', icon: null };
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

                  {/* مدرک — مدارکِ تازه در باکتِ خصوصی‌اند و لینکِ مستقیم
                      ندارند، پس از مسیرِ مجوزدار یک لینکِ امضاشده گرفته
                      می‌شود. رکوردهای قدیمی که URL کامل دارند هم از همان
                      مسیر برمی‌گردند، پس این‌جا یک رفتار بیشتر نیست. */}
                  {club.licenseDocumentUrl ? (
                    <button type="button" onClick={() => void openLicenseDoc(club.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.30)', color: GOLD, borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-base)', flexShrink: 0 }}>
                      <ExternalLink size={12} /> مشاهده مدرک
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileText size={12} /> بدون مدرک
                    </span>
                  )}

                  {/* ── جزئیات ──
                      تا امروز این کارت فقط نام و شهر و مدرک را نشان
                      می‌داد. برای تصمیم‌گرفتن باید دید باشگاه چند میز
                      دارد، مالکش کیست، و هویتش تأیید شده یا نه. */}
                  <button type="button"
                    onClick={() => setOpenClub(openClub === club.id ? null : club.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, borderRadius: 10,
                      padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-base)', flexShrink: 0,
                      border: `1px solid ${openClub === club.id ? 'rgba(199,166,106,0.30)' : '#e5e7eb'}`,
                      background: openClub === club.id ? 'rgba(199,166,106,0.10)' : '#fff',
                      color: openClub === club.id ? GOLD : '#6b7280',
                    }}>
                    <FileText size={12} /> {openClub === club.id ? 'بستن' : 'جزئیات'}
                  </button>
                </div>

                {openClub === club.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0ede8' }}>
                    <ReviewDetails type="club" id={club.id} />
                  </div>
                )}

                {/* دکمه‌های اقدام */}
                {club.verificationStatus !== 'verified' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
                    <button
                      disabled={!!actionLoading}
                      onClick={() => setStatus(club.id, 'verified')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-base)', opacity: actionLoading === club.id + 'verified' ? 0.6 : 1 }}>
                      <Check size={14} /> تأیید و اعطای تیک
                    </button>
                    {/* انتشار بدونِ تیک — برای باشگاهی که مدرکی آپلود نکرده
                        یا مدارکش هنوز بررسی نشده. کارتش در فهرست دیده
                        می‌شود ولی نشانِ تأیید نمی‌گیرد. */}
                    {club.verificationStatus !== 'approved' && (
                      <button
                        disabled={!!actionLoading}
                        onClick={() => setStatus(club.id, 'approved')}
                        title="باشگاه در فهرست منتشر می‌شود ولی تیک آبی نمی‌گیرد"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-base)', opacity: actionLoading === club.id + 'approved' ? 0.6 : 1 }}>
                        <Eye size={14} /> تأیید بدون تیک آبی
                      </button>
                    )}
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
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
                    {/* برداشتنِ فقط تیک، بدونِ برداشتنِ باشگاه از سایت —
                        وگرنه تنها راهِ پس‌گرفتنِ تیکِ اشتباه، «رد» بود که
                        باشگاه را هم از فهرست حذف می‌کرد. */}
                    <button
                      disabled={!!actionLoading}
                      onClick={() => setStatus(club.id, 'approved')}
                      title="باشگاه در سایت می‌ماند، فقط تیک آبی برداشته می‌شود"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(29,78,216,0.08)', color: '#1D4ED8', border: '1px solid rgba(29,78,216,0.2)', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-base)' }}>
                      <Eye size={12} /> برداشتن تیک آبی
                    </button>
                    <button
                      disabled={!!actionLoading}
                      onClick={() => setStatus(club.id, 'rejected')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-base)' }}>
                      <X size={12} /> لغو تأیید و حذف از فهرست
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── علتِ رد ──
          فهرستِ بسته، نه متنِ آزاد: این متن داخلِ پیامکِ مالک می‌رود و
          سرویسِ پیامک مقدارهای ممکنِ آن را از قبل می‌خواهد. */}
      {rejectFor && (
        <div
          onClick={() => setRejectFor(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(28,27,23,0.44)',
            display: 'grid', placeItems: 'center', padding: 18,
          }}>
          <div onClick={e => e.stopPropagation()} dir="rtl" style={{
            width: '100%', maxWidth: 380, background: '#fff', borderRadius: 18,
            padding: '20px 20px 18px', fontFamily: 'var(--font-base)',
            boxShadow: '0 10px 44px rgba(28,27,23,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <X size={16} style={{ color: '#dc2626' }} />
              <span style={{ fontSize: 15, fontWeight: 900, color: '#1C1B17' }}>رد ثبت باشگاه</span>
            </div>
            <p style={{ fontSize: 12, color: '#8A8474', lineHeight: 1.95, margin: '0 0 14px' }}>
              علت برای مالک باشگاه پیامک می‌شود تا بداند چه را اصلاح کند.
            </p>

            <select
              value={rejectCode} onChange={e => setRejectCode(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', background: '#F7F7F5',
                border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '10px 12px',
                fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 16,
                color: rejectCode ? '#111' : 'rgba(0,0,0,0.4)', cursor: 'pointer',
              }}>
              <option value="">علت رد را انتخاب کنید…</option>
              {REJECT_REASONS.map(r => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 9 }}>
              <button
                disabled={!rejectCode || !!actionLoading}
                onClick={async () => {
                  const id = rejectFor; const code = rejectCode;
                  setRejectFor(null);
                  await applyStatus(id, 'rejected', code);
                }}
                style={{
                  flex: 1, border: 'none', borderRadius: 10, padding: '10px 16px',
                  background: rejectCode ? '#dc2626' : 'rgba(0,0,0,0.12)',
                  color: rejectCode ? '#fff' : 'rgba(0,0,0,0.35)',
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                  cursor: rejectCode ? 'pointer' : 'not-allowed',
                }}>
                رد کن و پیامک بفرست
              </button>
              <button onClick={() => setRejectFor(null)} style={{
                border: '1px solid rgba(0,0,0,0.08)', background: 'transparent',
                color: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '10px 16px',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              }}>انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
