'use client';

import { apiFetch } from '../../../lib/http'
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { LifeBuoy, Unlock, Check, X, MapPin, CreditCard, Send } from 'lucide-react';
import TabStrip from '../../../components/ui/TabStrip';
import ScrollList from '../../../components/ui/ScrollList';
import { Button } from '../../../components/ui/Button';
import { AdminHeader } from '../../../components/admin/AdminHeader';

/* تیکت‌های پشتیبانی.

   دلیل وجود این صفحه: کد پستی و اطلاعات بانکی پس از یک استعلام
   موفق قفل می‌شوند (هر استعلام برای ما هزینه دارد). تنها راه تغییر،
   تیکت کاربر و بازکردن آگاهانه‌ی ادمین است — و بدون این صفحه، آن
   راه بن‌بست بود.

   ادمین مقدار تازه را خودش وارد نمی‌کند: قفل را باز می‌کند و کاربر
   یک بار دیگر استعلام می‌گیرد. اگر ادمین شماره کارت را دستی می‌نوشت،
   یک حساب استعلام‌نشده زیر عنوان «تأییدشده» می‌نشست. */

interface Ticket {
  id: string; user_id: string | null; club_id: string | null;
  name: string; email: string | null; phone: string | null;
  subject: string; message: string; status: string;
  admin_note: string | null; created_at: string;
}
interface LockUser { id: string; bank_card: string | null; bank_card_verified: boolean }
interface LockClub { id: string; name: string; postalCode: string | null; postalCodeVerified: boolean; ibanVerified: boolean }

/* رنگِ نشانِ وضعیت داده‌ی داینامیک است (از همین جدول، هم برای تب و هم نشان) */
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
  /* متن در حال تایپ پاسخ، به ازای هر تیکت */
  const [reply, setReply] = useState<Record<string, string>>({});

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
      /* از سرور دوباره خوانده می‌شود، نه از حالت محلی: بازکردن قفل
         روی جدول دیگری اثر می‌گذارد و نشان‌دادن حدس محلی یعنی
         ادمین چیزی ببیند که در دیتابیس نیست. */
      await load();
    } catch {
      setErr('خطا در ارتباط با سرور');
    } finally { setBusy(''); }
  };

  const shown = tickets.filter(t => t.status === tab);
  const count = (s: string) => tickets.filter(t => t.status === s).length;

  return (
    <main className="adm-page">
      <AdminHeader
        icon={<LifeBuoy size={26} className="text-gold-text" aria-hidden />}
        title="تیکت‌های پشتیبانی"
        description="کد پستی و اطلاعات بانکی پس از استعلام موفق قفل می‌شوند، با «باز کردن قفل»، کاربر می‌تواند یک بار دیگر استعلام بگیرد — مقدار را خودتان وارد نکنید تا استعلام واقعا انجام شود" />

      <TabStrip value={tab} onChange={setTab} style={{ marginBottom: 0 }}
        tabs={Object.entries(STATUS).map(([k, v]) => ({
          key: k, label: v.label, count: count(k), fg: v.fg, bg: v.bg,
        }))} />

      {err && (
        <div role="alert" className="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-semibold leading-loose text-danger-ink">
          {err}
        </div>
      )}

      {loading ? (
        <ul aria-busy="true" aria-label="در حال بارگذاری" className="m-0 grid list-none gap-3 p-0">
          {[0, 1, 2].map(i => (
            <li key={i} className="h-32 rounded-card border border-line/10 bg-surface motion-safe:animate-pulse" />
          ))}
        </ul>
      ) : shown.length === 0 ? (
        <div className="adm-card py-12 text-center text-sm text-ink-2">
          تیکتی در این وضعیت نیست
        </div>
      ) : (
        <ScrollList count={shown.length} min={4} gap={12}>
          {shown.map(t => {
            const club = clubs.find(c => c.id === t.club_id);
            const owner = users.find(u => u.id === t.user_id);
            const isPostal = t.subject === POSTAL_SUBJECT;
            const isBank = t.subject === BANK_SUBJECT;
            /* دکمه‌ی بازکردن فقط وقتی معنی دارد که چیزی قفل باشد */
            const postalLocked = !!club?.postalCodeVerified;
            const bankLocked = !!owner?.bank_card_verified || !!club?.ibanVerified;
            const draft = (reply[t.id] ?? '').trim();
            const canReply = busy !== t.id && !!draft && (reply[t.id] ?? '') !== (t.admin_note ?? '');

            return (
              <article key={t.id} className="adm-card grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: STATUS[t.status]?.bg, color: STATUS[t.status]?.fg }}>
                    {STATUS[t.status]?.label ?? t.status}
                  </span>
                  <h2 className="adm-break m-0 min-w-0 flex-1 basis-40 text-sm font-semibold text-ink">{t.subject}</h2>
                  <span className="text-xs text-ink-2">{faDate(t.created_at)}</span>
                </div>

                <div className="adm-break text-sm leading-loose text-ink-2">
                  <div><b>{t.name}</b>{t.phone ? ` — ${t.phone}` : ''}{t.email ? ` — ${t.email}` : ''}</div>
                  {club && <div>باشگاه: <b>{club.name}</b>{club.postalCode ? ` — کد پستی ${club.postalCode}` : ''}</div>}
                </div>

                <div className="adm-break whitespace-pre-wrap rounded-field border border-line/10 bg-paper p-3 text-sm leading-loose text-ink">
                  {t.message}
                </div>

                {/* ── پاسخ به کاربر ──
                    ستون `admin_note` از روز اول در جدول بود و مسیر PATCH هم
                    می‌پذیرفتش، ولی هیچ کادری برای نوشتنش وجود نداشت — یعنی
                    تیکت یک صندوق یک‌طرفه بود: کاربر می‌نوشت و هیچ‌وقت جوابی
                    نمی‌گرفت.

                    پاسخ در «تیکت‌های من» به کاربر نشان داده می‌شود. پیامک
                    ممکن نیست (خط خدماتی متن آزاد نمی‌پذیرد) و ایمیل هم در
                    پروژه تنظیم نشده. */}
                <div className="adm-field">
                  <label htmlFor={`reply-${t.id}`}>
                    پاسخ به کاربر {t.admin_note ? '— قبلا پاسخ داده شده' : ''}
                  </label>
                  <textarea id={`reply-${t.id}`}
                    value={reply[t.id] ?? t.admin_note ?? ''}
                    onChange={e => setReply(p => ({ ...p, [t.id]: e.target.value }))}
                    rows={2}
                    placeholder="پاسخی که کاربر در «تیکت‌های من» می‌بیند…"
                    className="w-full resize-y rounded-field border border-line/20 bg-surface p-3 text-sm leading-loose text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep" />
                  <div className="adm-actions">
                    <Button size="sm" variant="primary" icon={<Send size={13} aria-hidden />}
                      disabled={!canReply}
                      onClick={() => act(t.id, { adminNote: draft })}>
                      ثبت پاسخ
                    </Button>
                    {/* پاسخ‌دادن معمولا یعنی کار تمام شده — یک کلیک به‌جای دو تا */}
                    <Button size="sm" variant="secondary" icon={<Check size={13} aria-hidden />}
                      disabled={busy === t.id || !draft}
                      onClick={() => act(t.id, { adminNote: draft, status: 'resolved' })}>
                      پاسخ و بستن تیکت
                    </Button>
                  </div>
                </div>

                <div className="adm-actions">
                  {isPostal && (
                    <Button size="sm" variant="secondary" icon={<MapPin size={13} aria-hidden />}
                      disabled={busy === t.id || !postalLocked || !t.club_id}
                      onClick={() => act(t.id, { unlock: 'postal' })}
                      title={!t.club_id ? 'این تیکت به باشگاهی وصل نیست' : postalLocked ? '' : 'کد پستی الان قفل نیست'}>
                      باز کردن قفل کد پستی
                    </Button>
                  )}
                  {isBank && (
                    <Button size="sm" variant="secondary" icon={<CreditCard size={13} aria-hidden />}
                      disabled={busy === t.id || !bankLocked || !t.user_id}
                      onClick={() => act(t.id, { unlock: 'bank' })}
                      title={!t.user_id ? 'این تیکت به کاربری وصل نیست' : bankLocked ? '' : 'اطلاعات بانکی الان قفل نیست'}>
                      باز کردن قفل اطلاعات بانکی
                    </Button>
                  )}
                  {t.status !== 'resolved' && (
                    <Button size="sm" variant="secondary" icon={<Check size={13} aria-hidden />}
                      disabled={busy === t.id} onClick={() => act(t.id, { status: 'resolved' })}>
                      رسیدگی شد
                    </Button>
                  )}
                  {t.status !== 'in_progress' && t.status !== 'resolved' && (
                    <Button size="sm" variant="secondary" icon={<Unlock size={13} aria-hidden />}
                      disabled={busy === t.id} onClick={() => act(t.id, { status: 'in_progress' })}>
                      در حال بررسی
                    </Button>
                  )}
                  {t.status !== 'rejected' && (
                    <Button size="sm" variant="danger-ghost" icon={<X size={13} aria-hidden />}
                      disabled={busy === t.id} onClick={() => act(t.id, { status: 'rejected' })}>
                      رد
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </ScrollList>
      )}
    </main>
  );
}
