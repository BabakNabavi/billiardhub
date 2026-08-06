'use client';

/* ─────────────────────────────────────────────────────────────
   «تیکت‌های من» — سمتِ کاربر.

   تا امروز تیکت یک صندوقِ یک‌طرفه بود: کاربر از فرمِ «تماس با ما»
   می‌نوشت و هیچ‌وقت نه وضعیتش را می‌دید نه پاسخی می‌گرفت. ادمین هم
   کادرِ پاسخ نداشت، پس ستونِ `admin_note` سال‌ها خالی مانده بود.

   پاسخ چرا این‌جا و نه پیامک یا ایمیل: خطِ پیامکِ سایت خدماتی است و
   متنِ آزاد نمی‌پذیرد (هر متن باید از قبل ثبت و تأیید شود)، و ایمیل
   هم در پروژه تنظیم نشده. تنها کانالِ واقعی، خودِ سایت است.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LifeBuoy, Loader2, MessageSquare, Plus } from 'lucide-react';
import { apiFetch } from '../../lib/http';

const GOLD = '#C7A66A', GOLD_D = '#9A6E38';
const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474';

interface Ticket {
  id: string; subject: string; message: string; status: string;
  admin_note: string | null; created_at: string; handled_at: string | null;
}

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  open:        { label: 'در انتظار بررسی', bg: 'rgba(199,166,106,0.14)', fg: GOLD_D },
  in_progress: { label: 'در حال بررسی',    bg: 'rgba(29,78,216,0.10)',   fg: '#1D4ED8' },
  resolved:    { label: 'رسیدگی شد',       bg: 'rgba(48,197,90,0.12)',   fg: '#166534' },
  rejected:    { label: 'پذیرفته نشد',     bg: 'rgba(239,68,68,0.10)',   fg: '#B23B2E' },
};

const faDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    void apiFetch('/api/support/mine', { cache: 'no-store' })
      .then(async r => {
        if (r.status === 401) { setNeedsLogin(true); setTickets([]); return; }
        const j = await r.json().catch(() => ({ tickets: [] }));
        setTickets(Array.isArray(j?.tickets) ? j.tickets : []);
      })
      .catch(() => setTickets([]));
  }, []);

  const wrap: React.CSSProperties = {
    direction: 'rtl', fontFamily: 'var(--font-base)', minHeight: '100vh',
    background: '#FAF8F4', color: INK,
  };

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px clamp(16px,4vw,32px) 80px' }}>

        <div style={{ marginBottom: 22 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 10,
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.30)',
            color: GOLD_D, fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '4px 12px',
          }}>
            <LifeBuoy size={13} /> پشتیبانی
          </div>
          <h1 style={{ fontSize: 'clamp(21px,3vw,27px)', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            تیکت‌های من
          </h1>
          <p style={{ fontSize: 13.5, color: SEC, marginTop: 6, lineHeight: 2 }}>
            پیام‌هایی که به پشتیبانی فرستاده‌اید و پاسخشان.
          </p>
          <Link href="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
            padding: '8px 16px', borderRadius: 20, textDecoration: 'none',
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)',
            color: GOLD_D, fontSize: 13, fontWeight: 700,
          }}>
            <Plus size={14} /> پیام تازه
          </Link>
        </div>

        {tickets === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: MUT }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : needsLogin ? (
          <Empty text="برای دیدن تیکت‌هایتان وارد شوید." href="/login" cta="ورود" />
        ) : tickets.length === 0 ? (
          <Empty text="هنوز پیامی به پشتیبانی نفرستاده‌اید." href="/contact" cta="ارسال پیام" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tickets.map(t => {
              const s = STATUS[t.status] ?? { label: t.status, bg: 'rgba(0,0,0,0.05)', fg: SEC };
              return (
                <div key={t.id} style={{
                  background: '#fff', borderRadius: 16, padding: 18,
                  border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 800,
                      background: s.bg, color: s.fg,
                    }}>{s.label}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 800 }}>{t.subject}</span>
                    <span style={{ marginRight: 'auto', fontSize: 11.5, color: MUT }}>{faDate(t.created_at)}</span>
                  </div>

                  <div style={{
                    fontSize: 13, lineHeight: 2, background: '#F9FAFB',
                    border: '1px solid rgba(0,0,0,0.05)', borderRadius: 10, padding: '10px 12px',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {t.message}
                  </div>

                  {t.admin_note ? (
                    <div style={{
                      marginTop: 10, fontSize: 13, lineHeight: 2,
                      background: 'rgba(199,166,106,0.07)', border: '1px solid rgba(199,166,106,0.26)',
                      borderRadius: 10, padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 11.5, fontWeight: 800, color: GOLD_D, marginBottom: 4,
                      }}>
                        <MessageSquare size={12} /> پاسخ پشتیبانی
                        {t.handled_at && <span style={{ fontWeight: 600, color: MUT }}>— {faDate(t.handled_at)}</span>}
                      </div>
                      {t.admin_note}
                    </div>
                  ) : (
                    <div style={{ marginTop: 10, fontSize: 12, color: MUT, lineHeight: 2 }}>
                      هنوز پاسخی ثبت نشده است.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center',
      border: '1px solid rgba(0,0,0,0.07)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#D1D5DB' }}>
        <LifeBuoy size={40} strokeWidth={1.2} />
      </div>
      <p style={{ fontSize: 14, color: SEC, margin: '0 0 16px' }}>{text}</p>
      <Link href={href} style={{
        display: 'inline-block', padding: '9px 22px', borderRadius: 20, textDecoration: 'none',
        background: 'rgba(199,166,106,0.12)', border: `1px solid ${GOLD}55`,
        color: GOLD_D, fontSize: 13, fontWeight: 700,
      }}>{cta}</Link>
    </div>
  );
}
