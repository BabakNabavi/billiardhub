'use client';

/* ─────────────────────────────────────────────────────────────
   ProfileAdmin — قالب مشترک صفحات مدیریت پروفایل‌ها در پنل
   سوپرادمین (بازیکنان/تولیدکنندگان/متخصصان فنی). گارد hydration-safe،
   لیست ریسپانسیو، تأیید/تعلیق، مشاهده و حذف.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import { ArrowLeft, Eye, Trash2, ShieldCheck, ShieldOff, Inbox, FileSearch } from 'lucide-react';
import ReviewDetails from '../../components/admin/ReviewDetails';
import VerifiedBadge from '../../components/VerifiedBadge';

const GOLD_D = '#8F6531';
const TEXT   = '#1C1B17';
const SEC    = '#5B564B';
const MUT    = '#6F6A5C';
const LINE   = '#E7E2D6';

export interface AdminRow {
  slug: string;
  title: string;
  subtitle: string;
  status: 'approved' | 'rejected';
  href: string;
  /* شناسه‌ی ردیفِ `profiles` — برای نشان‌دادنِ جزئیات پیش از تصمیم.
     اختیاری است تا صفحه‌هایی که هنوز آن را نمی‌دهند نشکنند؛ بدونش
     فقط دکمه‌ی «جزئیات» دیده نمی‌شود. */
  profileId?: string;
  /* تیکِ آبی. جدا از `status` است: «منتشر شده» یعنی در سایت دیده
     می‌شود، «تیک‌دار» یعنی مدرکش تأیید شده. */
  verified?: boolean;
}

/* هر سه کنش می‌توانند هیچ برنگردانند (رفتارِ قدیمی) یا نتیجه بدهند */
type ActionResult = void | { ok: boolean; message?: string };

export default function ProfileAdmin({
  title, en, desc, panelHint, load, toggle, remove, setVerified,
}: {
  title: string;
  en: string;
  desc: string;
  panelHint: string;         // توضیح حالت خالی — پروفایل‌ها از کدام پنل ساخته می‌شوند
  /* از فاز ۹ این سه می‌توانند Promise برگردانند: منبع داده از
     localStorage به دیتابیس منتقل شد و خواندن/نوشتن شبکه‌ای است. */
  load: () => AdminRow[] | Promise<AdminRow[]>;
  /* نتیجه اختیاری است تا صفحه‌های قدیمی نشکنند؛ اگر برگردد و
     ok:false باشد، پیامِ سرور به‌جای «انجام شد» نشان داده می‌شود. */
  toggle: (slug: string) => ActionResult | Promise<ActionResult>;
  remove: (slug: string) => ActionResult | Promise<ActionResult>;
  /* نبودنش یعنی این صفحه کارِ تیک را انجام نمی‌دهد و دکمه‌اش هم
     نباید دیده شود. */
  setVerified?: (slug: string, next: boolean) => ActionResult | Promise<ActionResult>;
}) {
  /* ── چرا دکمه‌ها متن دارند ──
     ⚠️ هر چهار دکمه فقط آیکون بودند: سپر، سپرِ خط‌خورده، چشم، سطلِ
     زباله. حتی ادمینِ همین سایت نمی‌دانست کدام «انتشار» است و کدام
     «تیک آبی» — و اشتباهش برگشت‌پذیر نبود. متن کنارِ آیکون می‌آید. */
  const actBtn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    minHeight: 34, padding: '0 10px', borderRadius: 10,
    border: `1px solid ${LINE}`, background: '#FAFAF7', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
    textDecoration: 'none', ...extra,
  });
  const router = useRouter();
  const { user, _hydrated, authChecked } = useAuthStore();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const refresh = async () => {
    try { setRows(await load()); } catch { setRows([]); }
  };

  useEffect(() => { void refresh().finally(() => setReady(true)); }, []);

  useEffect(() => {
    if (_hydrated && authChecked && (!user || user.primaryRole !== 'admin')) router.push('/');
  }, [_hydrated, authChecked, user, router]);

  if (!_hydrated || !ready) return null;
  if (!user || user.primaryRole !== 'admin') return null;

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  /* ── چرا نتیجه سنجیده می‌شود ──
     ⚠️ پیش‌تر هر کنش بی‌قیدوشرط «انجام شد» می‌گفت. اگر سرور ۴۰۳
     می‌داد (مثلاً ادمین کلیدِ «تیک آبی» را نداشت) پیامِ موفقیت
     می‌آمد و هیچ‌چیز عوض نشده بود. «می‌زنم ولی کار نمی‌کند» همین بود. */
  const run = async (action: () => ActionResult | Promise<ActionResult>, okMsg: string) => {
    const res = await action();
    await refresh();
    if (res && res.ok === false) flash(res.message ?? 'انجام نشد'); else flash(okMsg);
  };

  return (
    <div dir="rtl" style={{ minHeight: '70vh', background: '#F7F5F0', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT, paddingBottom: 64 }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px clamp(16px,3vw,28px) 0' }}>

        {/* سربرگ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.24em', color: MUT }}>{en}</span>
            <h1 style={{ fontSize: 'clamp(18px,2.4vw,22px)', fontWeight: 900, margin: '4px 0 0' }}>{title}</h1>
            <p style={{ fontSize: 12.5, color: MUT, margin: '6px 0 0', lineHeight: 1.8 }}>{desc}</p>
          </div>
          <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, textDecoration: 'none', fontSize: 12.5, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
            <ArrowLeft size={13} /> پنل ادمین
          </Link>
        </div>

        {toast && (
          <div style={{ marginBottom: 12, background: 'rgba(14,122,56,0.08)', border: '1px solid rgba(14,122,56,0.25)', color: '#0E7A38', borderRadius: 12, padding: '10px 14px', fontSize: 12.5, fontWeight: 700 }}>
            {toast}
          </div>
        )}

        {/* لیست */}
        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18 }}>
            <Inbox size={34} style={{ color: MUT, opacity: 0.5, marginBottom: 10 }} />
            <p style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 6px' }}>هنوز پروفایلی ثبت نشده</p>
            <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 1.9 }}>{panelHint}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(r => (
              <div key={r.slug} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px' }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', background: 'linear-gradient(135deg,#C7A66A,#8A6020)' }}>
                  {r.title.slice(0, 1)}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.title}{r.verified && <VerifiedBadge size={14} title="تیک آبی دارد" />}
                  </div>
                  <div style={{ fontSize: 11.5, color: MUT, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subtitle}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '4px 12px', flexShrink: 0,
                  color: r.status === 'approved' ? '#0E7A38' : '#B23B2E',
                  background: r.status === 'approved' ? 'rgba(14,122,56,0.08)' : 'rgba(178,59,46,0.08)',
                  border: `1px solid ${r.status === 'approved' ? 'rgba(14,122,56,0.25)' : 'rgba(178,59,46,0.25)'}` }}>
                  {r.status === 'approved' ? 'منتشر شده' : 'معلق'}
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {/* ── جزئیات ──
                      تا امروز این فهرست فقط یک نام و سه دکمه بود.
                      تصمیم‌گرفتن درباره‌ی چیزی که دیده نمی‌شود تأیید
                      نیست. */}
                  {r.profileId ? (
                    <button onClick={() => setOpen(open === r.slug ? null : r.slug)}
                      title="جزئیات کامل"
                      style={{
                        height: 34, padding: '0 12px', borderRadius: 10,
                        border: `1px solid ${open === r.slug ? 'rgba(199,166,106,0.4)' : LINE}`,
                        background: open === r.slug ? 'rgba(199,166,106,0.12)' : '#FAFAF7',
                        color: open === r.slug ? GOLD_D : SEC, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 800, fontFamily: 'inherit',
                      }}>
                      <FileSearch size={14} />{open === r.slug ? 'بستن' : 'جزئیات'}
                    </button>
                  ) : null}
                  {/* ── تیکِ آبی ──
                      تا امروز این سه صفحه (بازیکن، متخصص، تولیدکننده)
                      هیچ راهی برای دادنِ تیک نداشتند؛ API از قبل
                      `verified` را می‌پذیرفت ولی هیچ دکمه‌ای صدایش
                      نمی‌زد. صفِ کاملِ هر هفت نقش در /admin/verified است. */}
                  {setVerified && (
                    <button onClick={() => {
                      const next = !r.verified;
                      void run(() => setVerified(r.slug, next), next ? 'تیک آبی داده شد' : 'تیک آبی برداشته شد');
                    }}
                      title={r.verified ? 'برداشتن تیک آبی' : 'اعطای تیک آبی'}
                      aria-label={`${r.verified ? 'برداشتن تیک آبی از' : 'اعطای تیک آبی به'} ${r.title}`}
                      style={actBtn({
                        border: `1px solid ${r.verified ? 'rgba(178,59,46,0.24)' : 'rgba(0,149,246,0.30)'}`,
                        background: r.verified ? 'rgba(178,59,46,0.06)' : 'rgba(0,149,246,0.10)',
                        color: r.verified ? '#B23B2E' : '#0095F6',
                      })}>
                      {r.verified
                        ? <ShieldOff size={14} />
                        : <VerifiedBadge size={14} title="" style={{ marginInlineStart: 0 }} />}
                      {r.verified ? 'برداشتن تیک آبی' : 'اعطای تیک آبی'}
                    </button>
                  )}
                  <button onClick={() => void run(() => toggle(r.slug), r.status === 'approved' ? 'پروفایل معلق شد' : 'پروفایل منتشر شد')}
                    style={actBtn({ color: r.status === 'approved' ? '#B23B2E' : '#0E7A38' })}>
                    {r.status === 'approved' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                    {r.status === 'approved' ? 'تعلیق انتشار' : 'تأیید و انتشار'}
                  </button>
                  <Link href={r.href} style={actBtn({ color: SEC })}>
                    <Eye size={14} />مشاهده صفحه
                  </Link>
                  <button onClick={() => void run(() => remove(r.slug), 'پروفایل معلق شد')}
                    style={actBtn({ color: '#B23B2E' })}>
                    <Trash2 size={14} />تعلیق
                  </button>
                </div>
              </div>

              {open === r.slug && r.profileId ? (
                <div style={{ borderTop: `1px solid ${LINE}`, padding: '14px 16px', background: '#FAFAF7' }}>
                  <ReviewDetails type="profile" id={r.profileId} />
                </div>
              ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
