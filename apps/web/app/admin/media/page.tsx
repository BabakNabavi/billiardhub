'use client';

/* ─────────────────────────────────────────────────────────────
   مدیریتِ بیلیارد مدیا.

   ── چه چیزی عوض شد ──
   نسخه‌ی قبلی «مخفی» و «ویژه» را در `localStorage` و بعد در
   `app_settings` نگه می‌داشت. یعنی وضعیتِ انتشار جایی بیرون از خودِ
   ویدیو زندگی می‌کرد: فهرستِ عمومی از آن خبر نداشت، نقشه‌ی سایت هم نه،
   و «مخفی‌کردن» فقط یعنی کارت در پنل کم‌رنگ شود.

   حالا `status` و `featured` ستونِ خودِ ردیف‌اند، پس همان لحظه روی
   صفحه‌ی عمومی، فهرست و نقشه‌ی سایت اثر می‌گذارند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState, useCallback } from 'react';
import { ask } from '../../../lib/ui/dialogs'
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/auth.store';
import { MEDIA_CATEGORIES, compactViews, faDigits } from '../../../lib/media-data';
import { apiFetch } from '../../../lib/http';
import {
  ArrowLeft, Eye, EyeOff, Star, Clapperboard, Trash2, Loader2,
  CheckCircle2, XCircle, ExternalLink,
} from 'lucide-react';

const GOLD_D = '#9A6E38';
const TEXT = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#E7E2D6';
const RED = '#B23B2E', FELT = '#0E7A38';

type Status = 'draft' | 'pending' | 'published' | 'rejected' | 'hidden';

interface AdminVideo {
  id: string; slug: string; title: string; category: string
  creator_name: string; creator_handle: string
  thumb: string; duration_sec: number | null; views: number
  status: Status; visibility: string; featured: boolean
  created_at: string; published_at: string | null
}

const STATUS_FA: Record<Status, { label: string; color: string }> = {
  draft:     { label: 'پیش‌نویس',      color: MUT },
  pending:   { label: 'در انتظار',     color: '#B45309' },
  published: { label: 'منتشرشده',      color: FELT },
  rejected:  { label: 'ردشده',         color: RED },
  hidden:    { label: 'مخفی',          color: SEC },
};

const FILTERS: { key: '' | Status; fa: string }[] = [
  { key: '',          fa: 'همه' },
  { key: 'published', fa: 'منتشرشده' },
  { key: 'pending',   fa: 'در انتظار' },
  { key: 'hidden',    fa: 'مخفی' },
  { key: 'rejected',  fa: 'ردشده' },
];

const dur = (s: number | null) => {
  if (!s || s <= 0) return '';
  return faDigits(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`);
};

export default function AdminMediaPage() {
  const router = useRouter();
  const { user, _hydrated, authChecked } = useAuthStore();

  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [filter, setFilter] = useState<'' | Status>('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams();
      if (filter) qs.set('status', filter);
      if (q.trim()) qs.set('q', q.trim());
      const r = await apiFetch('/api/admin/videos?' + qs, { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j?.message ?? 'خواندن فهرست انجام نشد'); return; }
      setVideos(j.videos ?? []);
    } catch { setErr('خطا در ارتباط با سرور'); } finally { setLoading(false); }
  }, [filter, q]);

  useEffect(() => {
    if (!_hydrated || !authChecked) return;
    if (!user || user.primaryRole !== 'admin') { router.push('/'); return; }
    void load();
  }, [_hydrated, authChecked, user, router, load]);

  /* هر تغییر بی‌درنگ روی همان ردیف نشان داده می‌شود و بعد از سرور
     تأیید می‌گیرد — وگرنه پنل تا آمدنِ پاسخ بی‌جان به نظر می‌رسد. */
  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(id); setErr('');
    try {
      const r = await apiFetch('/api/admin/videos', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j?.message ?? 'تغییر انجام نشد'); return; }
      await load();
    } catch { setErr('خطا در ارتباط با سرور'); } finally { setBusy(null); }
  };

  const remove = async (v: AdminVideo) => {
    if (!(await ask(`«${v.title}» حذف شود؟`, { body: 'ویدیو و همه‌ی فایل‌هایش برای همیشه پاک می‌شوند.' }))) return;
    setBusy(v.id);
    try {
      const r = await apiFetch(`/api/admin/videos?id=${encodeURIComponent(v.id)}`, { method: 'DELETE' });
      if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j?.message ?? 'حذف انجام نشد'); return; }
      setVideos(vs => vs.filter(x => x.id !== v.id));
    } catch { setErr('خطا در ارتباط با سرور'); } finally { setBusy(null); }
  };

  if (!_hydrated) return null;
  if (!user || user.primaryRole !== 'admin') return null;

  const btn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4, height: 30, padding: '0 10px',
    borderRadius: 8, cursor: 'pointer', fontSize: 11.5, fontWeight: 800, fontFamily: 'inherit',
    background: '#FAFAF7', border: `1px solid ${LINE}`, color: SEC,
  };

  return (
    <div dir="rtl" style={{ maxWidth: 1080, margin: '0 auto', padding: '22px 16px 60px', fontFamily: 'var(--font-base)' }}>
      <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: GOLD_D, textDecoration: 'none', marginBottom: 12 }}>
        <ArrowLeft size={14} /> بازگشت به پنل مدیریت
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
        <Clapperboard size={19} style={{ color: GOLD_D }} />
        <h1 style={{ fontSize: 19, fontWeight: 900, color: TEXT, margin: 0 }}>مدیریت بیلیارد مدیا</h1>
      </div>
      <p style={{ fontSize: 12.5, color: SEC, lineHeight: 2, margin: '0 0 16px' }}>
        هر تغییری همین‌جا روی صفحه‌ی عمومی، فهرست و نقشه‌ی سایت اثر می‌گذارد.
        ویدیوی «مخفی» یا «ردشده» برای بازدیدکننده باز نمی‌شود و در نقشه‌ی سایت نمی‌آید.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            ...btn, height: 32,
            background: filter === f.key ? 'rgba(199,166,106,0.14)' : '#FAFAF7',
            borderColor: filter === f.key ? 'rgba(199,166,106,0.40)' : LINE,
            color: filter === f.key ? GOLD_D : SEC,
          }}>{f.fa}</button>
        ))}
        <input value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') void load() }}
          placeholder="جستجوی عنوان یا سازنده…"
          style={{ flex: 1, minWidth: 180, height: 32, borderRadius: 8, border: `1px solid ${LINE}`,
            padding: '0 11px', fontSize: 12.5, fontFamily: 'inherit', color: TEXT }} />
      </div>

      {err && (
        <div style={{ color: RED, fontSize: 12.5, fontWeight: 700, padding: '10px 12px', marginBottom: 12,
          border: '1px solid rgba(178,59,46,0.28)', borderRadius: 10, background: 'rgba(178,59,46,0.05)' }}>{err}</div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: SEC, fontSize: 13, padding: 20 }}>
          <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> در حال بارگذاری…
        </div>
      ) : videos.length === 0 ? (
        <div style={{ fontSize: 12.5, color: MUT, padding: '22px 0', lineHeight: 2 }}>
          {q || filter ? 'ویدیویی با این شرط پیدا نشد.' : 'هنوز ویدیویی منتشر نشده است.'}
        </div>
      ) : (
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
          {videos.map((v, i) => {
            const st = STATUS_FA[v.status] ?? STATUS_FA.draft;
            const isBusy = busy === v.id;
            return (
              <div key={v.id} style={{
                display: 'flex', gap: 12, padding: '11px 13px', background: '#fff',
                borderTop: i ? `1px solid ${LINE}` : 'none', opacity: isBusy ? 0.55 : 1,
                alignItems: 'flex-start', flexWrap: 'wrap',
              }}>
                <div style={{ position: 'relative', width: 104, aspectRatio: '16/9', flexShrink: 0,
                  borderRadius: 8, overflow: 'hidden', background: '#EDE9E1' }}>
                  {v.thumb && <img src={v.thumb} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {dur(v.duration_sec) && (
                    <span style={{ position: 'absolute', bottom: 4, insetInlineStart: 4, fontSize: 9.5, fontWeight: 800,
                      color: '#fff', background: 'rgba(20,18,14,0.72)', borderRadius: 5, padding: '1px 5px' }}>{dur(v.duration_sec)}</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 170 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{v.title}</span>
                    {v.featured && <Star size={13} style={{ color: GOLD_D, fill: GOLD_D }} />}
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: st.color,
                      background: st.color + '18', borderRadius: 20, padding: '2px 8px' }}>{st.label}</span>
                    {v.visibility !== 'public' && (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: MUT, background: '#F3F0E9', borderRadius: 20, padding: '2px 8px' }}>
                        {v.visibility === 'private' ? 'خصوصی' : 'فقط با لینک'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: MUT, marginTop: 3 }}>
                    {v.creator_name || '—'} · {compactViews(v.views)} بازدید ·{' '}
                    {MEDIA_CATEGORIES.find(c => c.key === v.category)?.label ?? v.category}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {v.status !== 'published' ? (
                    <button onClick={() => void patch(v.id, { status: 'published' })} disabled={isBusy}
                      style={{ ...btn, color: FELT }} title="انتشار">
                      <CheckCircle2 size={13} /> انتشار
                    </button>
                  ) : (
                    <button onClick={() => void patch(v.id, { status: 'hidden' })} disabled={isBusy}
                      style={btn} title="مخفی‌کردن">
                      <EyeOff size={13} /> مخفی
                    </button>
                  )}

                  {v.status !== 'rejected' && (
                    <button onClick={() => void patch(v.id, { status: 'rejected' })} disabled={isBusy}
                      style={{ ...btn, color: RED }} title="رد">
                      <XCircle size={13} /> رد
                    </button>
                  )}

                  <button onClick={() => void patch(v.id, { featured: !v.featured })} disabled={isBusy}
                    style={{ ...btn, color: v.featured ? GOLD_D : SEC,
                      background: v.featured ? 'rgba(199,166,106,0.14)' : '#FAFAF7' }}
                    title={v.featured ? 'برداشتن از ویژه' : 'ویژه‌کردن'}>
                    <Star size={13} /> ویژه
                  </button>

                  <a href={`/media/${encodeURIComponent(v.slug)}`} target="_blank" rel="noopener noreferrer"
                    style={{ ...btn, textDecoration: 'none' }} title="دیدن صفحه">
                    <Eye size={13} /> <ExternalLink size={10} />
                  </a>

                  <button onClick={() => void remove(v)} disabled={isBusy}
                    style={{ ...btn, color: RED, width: 30, padding: 0, justifyContent: 'center' }} title="حذف">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
