'use client';

import { apiFetch } from '../../../lib/http'
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { LifeBuoy, Unlock, Check, X, Loader2, MapPin, CreditCard } from 'lucide-react';

/* تیکت‌های پشتیبانی.

   دلیلِ وجودِ این صفحه: کد پستی و اطلاعات بانکی پس از یک استعلامِ
   موفق قفل می‌شوند (هر استعلام برای ما هزینه دارد). تنها راهِ تغییر،
   تیکتِ کاربر و بازکردنِ آگاهانه‌ی ادمین است — و بدونِ این صفحه، آن
   راه بن‌بست بود.

   ادمین مقدارِ تازه را خودش وارد نمی‌کند: قفل را باز می‌کند و کاربر
   یک بارِ دیگر استعلام می‌گیرد. اگر ادمین شماره کارت را دستی می‌نوشت،
   یک حسابِ استعلام‌نشده زیر عنوانِ «تأییدشده» می‌نشست. */

const GOLD = '#C7A66A';
const DARK = '#141210';

interface Ticket {
  id: string; user_id: string | null; club_id: string | null;
  name: string; email: string | null; phone: string | null;
  subject: string; message: string; status: string;
  admin_note: string | null; created_at: string;
}
interface LockUser { id: string; bank_card: string | null; bank_card_verified: boolean }
interface LockClub { id: string; name: string; postalCode: string | null; postalCodeVerified: boolean; ibanVerified: boolean }

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  open:        { label: 'باز',        bg: 'rgba(199,166,106,0.14)', fg: '#A07840' },
  in_progress: { label: 'در حال بررسی', bg: 'rgba(29,78,216,0.10)',  fg: '#1D4ED8' },
  resolved:    { label: 'رسیدگی شد',   bg: 'rgba(48,197,90,0.12)',  fg: '#166534' },
  rejected:    { label: 'رد شد',       bg: 'rgba(239,68,68,0.10)',  fg: '#B23B2E' },
};

const POSTAL_SUBJECT = 'درخواست تغییر کد پستی';
const BANK_SUBJECT = 'درخواست ویرایش اطلاعات بانکی';

const faDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
};

export default function AdminSupportPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<LockUser[]>([]);
  const [clubs, setClubs] = useState<LockClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('open');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await fetch('/api/admin/support', { credentials: 'include', cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j?.message || 'خواندن تیکت‌ها انجام نشد'); return; }
      setTickets(j.tickets ?? []);
      setUsers(j.users ?? []);
      setClubs(j.clubs ?? []);
    } catch {
      setErr('خطا در ارتباط با سرور');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.primaryRole !== 'admin') { router.push('/'); return; }
    load();
  }, [user, router, load]);

  const act = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    try {
      const r = await apiFetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, ...body }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j?.message || 'عملیات انجام نشد'); return; }
      /* از سرور دوباره خوانده می‌شود، نه از حالتِ محلی: بازکردنِ قفل
         روی جدولِ دیگری اثر می‌گذارد و نشان‌دادنِ حدسِ محلی یعنی
         ادمین چیزی ببیند که در دیتابیس نیست. */
      await load();
    } catch {
      setErr('خطا در ارتباط با سرور');
    } finally { setBusy(''); }
  };

  const shown = tickets.filter(t => t.status === tab);
  const count = (s: string) => tickets.filter(t => t.status === s).length;

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16,
    padding: 18, marginBottom: 12,
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif', padding: '24px 16px', maxWidth: 980, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <LifeBuoy size={22} color={GOLD} />
        <h1 style={{ fontSize: 20, fontWeight: 900, color: DARK, margin: 0 }}>تیکت‌های پشتیبانی</h1>
      </div>
      <p style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 2, marginTop: 0, marginBottom: 18 }}>
        کد پستی و اطلاعات بانکی پس از استعلامِ موفق قفل می‌شوند. با «باز کردن قفل»،
        کاربر می‌تواند یک بارِ دیگر استعلام بگیرد — مقدار را خودتان وارد نکنید تا
        استعلام واقعاً انجام شود.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(STATUS).map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '7px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
            background: tab === k ? v.bg : '#fff',
            border: `1px solid ${tab === k ? v.fg + '55' : 'rgba(0,0,0,0.12)'}`,
            color: tab === k ? v.fg : '#6B7280',
          }}>
            {v.label} ({count(k).toLocaleString('fa-IR')})
          </button>
        ))}
      </div>

      {err && (
        <div style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(178,59,46,0.07)', border: '1px solid rgba(178,59,46,0.22)', color: '#B23B2E', fontSize: 12.5, fontWeight: 700, marginBottom: 14, lineHeight: 1.9 }}>
          {err}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 13 }}>
          <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> در حال بارگذاری…
        </div>
      ) : shown.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
          تیکتی در این وضعیت نیست.
        </div>
      ) : shown.map(t => {
        const club = clubs.find(c => c.id === t.club_id);
        const owner = users.find(u => u.id === t.user_id);
        const isPostal = t.subject === POSTAL_SUBJECT;
        const isBank = t.subject === BANK_SUBJECT;
        /* دکمه‌ی بازکردن فقط وقتی معنی دارد که چیزی قفل باشد */
        const postalLocked = !!club?.postalCodeVerified;
        const bankLocked = !!owner?.bank_card_verified || !!club?.ibanVerified;

        return (
          <div key={t.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 800,
                background: STATUS[t.status]?.bg, color: STATUS[t.status]?.fg,
              }}>{STATUS[t.status]?.label ?? t.status}</span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: DARK }}>{t.subject}</span>
              <span style={{ marginRight: 'auto', fontSize: 11.5, color: '#9CA3AF' }}>{faDate(t.created_at)}</span>
            </div>

            <div style={{ fontSize: 12.5, color: '#4B5563', lineHeight: 2, marginBottom: 10 }}>
              <div><b>{t.name}</b>{t.phone ? ` — ${t.phone}` : ''}{t.email ? ` — ${t.email}` : ''}</div>
              {club && <div>باشگاه: <b>{club.name}</b>{club.postalCode ? ` — کد پستی ${club.postalCode}` : ''}</div>}
            </div>

            <div style={{ fontSize: 13, color: DARK, lineHeight: 2, background: '#F9FAFB', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 10, padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 12 }}>
              {t.message}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {isPostal && (
                <button disabled={busy === t.id || !postalLocked || !t.club_id}
                  onClick={() => act(t.id, { unlock: 'postal' })}
                  title={!t.club_id ? 'این تیکت به باشگاهی وصل نیست' : postalLocked ? '' : 'کد پستی الان قفل نیست'}
                  style={btn(postalLocked && !!t.club_id && busy !== t.id)}>
                  <MapPin size={13} /> باز کردن قفل کد پستی
                </button>
              )}
              {isBank && (
                <button disabled={busy === t.id || !bankLocked || !t.user_id}
                  onClick={() => act(t.id, { unlock: 'bank' })}
                  title={!t.user_id ? 'این تیکت به کاربری وصل نیست' : bankLocked ? '' : 'اطلاعات بانکی الان قفل نیست'}
                  style={btn(bankLocked && !!t.user_id && busy !== t.id)}>
                  <CreditCard size={13} /> باز کردن قفل اطلاعات بانکی
                </button>
              )}
              {t.status !== 'resolved' && (
                <button disabled={busy === t.id} onClick={() => act(t.id, { status: 'resolved' })} style={btn(busy !== t.id)}>
                  <Check size={13} /> رسیدگی شد
                </button>
              )}
              {t.status !== 'in_progress' && t.status !== 'resolved' && (
                <button disabled={busy === t.id} onClick={() => act(t.id, { status: 'in_progress' })} style={btn(busy !== t.id)}>
                  <Unlock size={13} /> در حال بررسی
                </button>
              )}
              {t.status !== 'rejected' && (
                <button disabled={busy === t.id} onClick={() => act(t.id, { status: 'rejected' })} style={btn(busy !== t.id, true)}>
                  <X size={13} /> رد
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function btn(enabled: boolean, danger = false): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 13px', borderRadius: 9, fontSize: 12, fontWeight: 700,
    fontFamily: 'inherit', cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.45,
    background: danger ? 'rgba(239,68,68,0.08)' : '#fff',
    border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.14)'}`,
    color: danger ? '#dc2626' : '#4B5563',
  };
}
