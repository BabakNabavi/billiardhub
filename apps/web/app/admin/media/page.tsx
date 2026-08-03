'use client';

/* ─────────────────────────────────────────────────────────────
   پنل ادمین — بیلیارد مدیا: انتخاب ویدیوی ویژه (NOW SHOWING)،
   مخفی/نمایش ویدیوها و مرور کانال‌ها با آمار.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/auth.store';
import { MEDIA_VIDEOS, MEDIA_CATEGORIES, listChannels, mediaCategoryOf, compactViews, faDigits } from '../../../lib/media-data';

/* ── ویدیو و کانالِ کاربران ──
   این صفحه فقط از `MEDIA_VIDEOS` می‌خواند — آرایه‌ی ثابتِ محتوای
   دستی، که حالا خالی است. یعنی هر کانال و ویدیویی که کاربران
   می‌ساختند اصلاً به پنل نمی‌رسید و ادمین صفحه‌ای خالی می‌دید.

   محتوای کاربران جای دیگری است: `/api/media` و `/api/media/channel`.
   این‌جا هر دو منبع خوانده و یکی می‌شوند. */
interface ApiVideo {
  id: string; title: string; category: string; creatorName: string; creatorHandle: string
  views: number; thumb: string; ts: number
}
interface ApiChannel { name: string; handle: string; avatar: string }
import { getHiddenVideoIds, toggleHiddenVideo, getFeaturedOverride, setFeaturedOverride } from '../../../lib/media-admin-store';
import { apiFetch } from '../../../lib/http';
import { ArrowLeft, Eye, EyeOff, Star, Clapperboard } from 'lucide-react';

const GOLD_D = '#9A6E38';
const TEXT   = '#1C1B17';
const SEC    = '#5B564B';
const MUT    = '#8A8474';
const LINE   = '#E7E2D6';

export default function AdminMediaPage() {
  const router = useRouter();
  const { user, _hydrated } = useAuthStore();
  const [hidden, setHidden] = useState<string[]>([]);
  const [featured, setFeatured] = useState<string>('');
  const [ready, setReady] = useState(false);
  const [userVideos, setUserVideos] = useState<ApiVideo[]>([]);
  const [userChannels, setUserChannels] = useState<ApiChannel[]>([]);

  /* منبع: `app_settings` روی سرور. تا امروز این دو تنظیم در
     localStorage بود، پس انتخاب ادمین فقط روی مرورگر خودش اثر
     داشت و کاربران هیچ‌وقت آن را نمی‌دیدند. کش محلی به‌عنوان
     نسخه‌ی اولیه می‌ماند تا صفحه لحظه‌ی اول خالی نباشد. */
  useEffect(() => {
    setHidden(getHiddenVideoIds());
    setFeatured(getFeaturedOverride() ?? '');
    setReady(true);

    void (async () => {
      try {
        const r = await apiFetch('/api/admin/settings', { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json().catch(() => null) as { settings?: Record<string, unknown> } | null;
        const s = j?.settings ?? {};
        if (Array.isArray(s.media_hidden_ids)) setHidden(s.media_hidden_ids.map(String));
        if (typeof s.media_featured_id === 'string') setFeatured(s.media_featured_id);
      } catch { /* کش محلی می‌ماند */ }
    })();

    /* ویدیو و کانالِ کاربران — این دو مسیر عمومی‌اند و `apiFetch`
       لازم ندارند، ولی از همان استفاده می‌شود تا اگر روزی محدود
       شدند این‌جا نشکند. */
    void (async () => {
      try {
        const [v, c] = await Promise.all([
          apiFetch('/api/media', { cache: 'no-store' }),
          apiFetch('/api/media/channel', { cache: 'no-store' }),
        ]);
        if (v.ok) setUserVideos((await v.json().catch(() => [])) as ApiVideo[]);
        if (c.ok) setUserChannels((await c.json().catch(() => [])) as ApiChannel[]);
      } catch { /* بی‌صدا — بخشِ محتوای دستی همچنان کار می‌کند */ }
    })();
  }, []);

  /* نوشتن تنظیم روی سرور + هم‌گام نگه‌داشتن کش محلی */
  const persist = async (patch: Record<string, unknown>) => {
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch { /* بی‌صدا */ }
  };

  useEffect(() => {
    if (_hydrated && (!user || user.primaryRole !== 'admin')) router.push('/');
  }, [_hydrated, user, router]);

  if (!_hydrated || !ready) return null;
  if (!user || user.primaryRole !== 'admin') return null;

  /* فهرستِ محتوای دستی حالا خالی است؛ `[0]!` یعنی undefined و
     `defaultFeatured.title` صفحه‌ی ادمین را می‌شکند. */
  const defaultFeatured = MEDIA_VIDEOS.find(v => v.featured) ?? MEDIA_VIDEOS[0] ?? null;

  /* یک فهرستِ واحد از هر دو منبع — محتوای دستی و آپلودِ کاربران.
     شکلشان یکی نیست، پس این‌جا به یک شکلِ ساده درمی‌آیند. */
  const allVideos = [
    ...MEDIA_VIDEOS.map(v => ({
      id: v.id, title: v.title, thumb: v.thumb, views: v.views,
      by: v.creator.name, cat: mediaCategoryOf(v.category).label, mine: true,
    })),
    /* دسته‌ی ویدیوی کاربر رشته‌ی آزاد است و ممکن است با هیچ‌کدام از
       دسته‌های شناخته‌شده جور نباشد — پس اگر ناشناخته بود، خودِ
       رشته نشان داده می‌شود، نه اینکه صفحه بشکند. */
    ...userVideos.map(v => {
      const known = MEDIA_CATEGORIES.find(c => c.key === v.category)
      return {
        id: v.id, title: v.title, thumb: v.thumb, views: v.views,
        by: v.creatorName || '—', cat: known ? known.label : (v.category || '—'), mine: false,
      }
    }),
  ];

  return (
    <div dir="rtl" style={{ minHeight: '70vh', background: '#F7F5F0', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT, paddingBottom: 64 }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px clamp(16px,3vw,28px) 0' }}>

        {/* سربرگ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.24em', color: MUT }}>BILLIARD MEDIA · SUPER ADMIN</span>
            <h1 style={{ fontSize: 'clamp(18px,2.4vw,22px)', fontWeight: 900, margin: '4px 0 0' }}>مدیریت بیلیارد مدیا</h1>
            <p style={{ fontSize: 12.5, color: MUT, margin: '6px 0 0', lineHeight: 1.8 }}>انتخاب ویدیوی ویژه، مخفی/نمایش ویدیوها و مرور کانال‌ها.</p>
          </div>
          <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, textDecoration: 'none', fontSize: 12.5, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
            <ArrowLeft size={13} /> پنل ادمین
          </Link>
        </div>

        {/* ویدیوی ویژه */}
        <section style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: '16px 18px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Star size={15} style={{ color: GOLD_D }} />
            <h2 style={{ fontSize: 14.5, fontWeight: 900, margin: 0 }}>ویدیوی ویژه (NOW SHOWING)</h2>
          </div>
          <p style={{ fontSize: 12, color: MUT, margin: '0 0 12px', lineHeight: 1.9 }}>
            در بیلبورد صفحه‌ی مدیا و باند مدیای صفحه‌ی اصلی نمایش داده می‌شود.
            {defaultFeatured ? ` پیش‌فرض: «${defaultFeatured.title}»` : ' فعلاً محتوای دستی‌ای وجود ندارد.'}
          </p>
          <select
            value={featured}
            onChange={e => {
              const v = e.target.value;
              setFeatured(v);
              setFeaturedOverride(v || null);          // کش محلی
              void persist({ media_featured_id: v || null });
            }}
            style={{ width: '100%', maxWidth: 460 }}>
            <option value="">{defaultFeatured ? `پیش‌فرض (${defaultFeatured.title})` : 'پیش‌فرض'}</option>
            {allVideos.map(v => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
        </section>

        {/* ویدیوها */}
        <section style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Clapperboard size={15} style={{ color: GOLD_D }} />
            <h2 style={{ fontSize: 14.5, fontWeight: 900, margin: 0 }}>ویدیوها</h2>
            <span style={{ fontSize: 11.5, color: MUT }}>
              {faDigits(allVideos.length)} ویدیو
              {userVideos.length > 0 && <> · {faDigits(userVideos.length)} از کاربران</>}
              {' '}· {faDigits(hidden.length)} مخفی
            </span>
          </div>
          {allVideos.length === 0 && (
            <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 13, padding: '18px 16px', fontSize: 12.5, color: MUT, lineHeight: 2 }}>
              هنوز هیچ ویدیویی نیست — نه محتوای دستی و نه آپلودِ کاربران.
              به‌محضِ اینکه کاربری کانال بسازد و ویدیو بگذارد، همین‌جا دیده می‌شود.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allVideos.map(v => {
              const isHidden = hidden.includes(v.id);
              return (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 13, padding: '9px 12px', opacity: isHidden ? 0.55 : 1 }}>
                  <img loading="lazy" decoding="async" src={v.thumb} alt="" style={{ width: 74, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: `1px solid ${LINE}` }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                    <div style={{ fontSize: 10.5, color: MUT, marginTop: 3 }}>
                      {v.by} · {v.cat} · {compactViews(v.views)} بازدید
                      {!v.mine && <span style={{ color: GOLD_D, fontWeight: 800 }}> · آپلودِ کاربر</span>}
                    </div>
                  </div>
                  <Link href={`/media/${v.id}`} title="مشاهده" style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${LINE}`, background: '#FAFAF7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SEC, flexShrink: 0 }}>
                    <Eye size={14} />
                  </Link>
                  <button
                    onClick={() => {
                      toggleHiddenVideo(v.id);                 // کش محلی
                      const next = getHiddenVideoIds();
                      setHidden(next);
                      void persist({ media_hidden_ids: next });
                    }}
                    title={isHidden ? 'نمایش' : 'مخفی کردن'}
                    style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: `1px solid ${isHidden ? 'rgba(14,122,56,0.3)' : 'rgba(178,59,46,0.3)'}`, background: isHidden ? 'rgba(14,122,56,0.06)' : 'rgba(178,59,46,0.05)', color: isHidden ? '#0E7A38' : '#B23B2E', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800 }}>
                    {isHidden ? <><Eye size={13} /> نمایش</> : <><EyeOff size={13} /> مخفی</>}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* کانال‌ها */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Clapperboard size={15} style={{ color: GOLD_D }} />
            <h2 style={{ fontSize: 14.5, fontWeight: 900, margin: 0 }}>کانال‌ها</h2>
            <span style={{ fontSize: 11.5, color: MUT }}>
              {faDigits(listChannels().length + userChannels.length)} کانال
              {userChannels.length > 0 && <> · {faDigits(userChannels.length)} از کاربران</>}
            </span>
          </div>
          {listChannels().length + userChannels.length === 0 && (
            <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 13, padding: '18px 16px', fontSize: 12.5, color: MUT, lineHeight: 2 }}>
              هنوز کسی کانال نساخته است.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {/* کانال‌های کاربران — پیش‌تر اصلاً خوانده نمی‌شدند */}
            {userChannels.map(ch => {
              const n = userVideos.filter(v => v.creatorHandle === ch.handle).length
              const views = userVideos.filter(v => v.creatorHandle === ch.handle).reduce((s, v) => s + (v.views ?? 0), 0)
              return (
                <Link key={ch.handle} href={`/media/channel/${ch.handle}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 13, padding: '10px 12px', textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#241B08', background: 'linear-gradient(135deg,#C7A66A,#8A6020)', overflow: 'hidden' }}>
                    {ch.avatar
                      ? <img loading="lazy" decoding="async" src={ch.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (ch.name || '؟').slice(0, 1)}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
                    <span style={{ fontSize: 10.5, color: MUT }}>{faDigits(n)} ویدیو · {compactViews(views)} بازدید</span>
                  </span>
                </Link>
              )
            })}
            {listChannels().map(ch => (
              <Link key={ch.creator.id} href={`/media/channel/${ch.creator.handle}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 13, padding: '10px 12px', textDecoration: 'none', color: 'inherit' }}>
                <span style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#241B08', background: 'linear-gradient(135deg,#C7A66A,#8A6020)' }}>
                  {ch.creator.name.slice(0, 1)}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.creator.name}</span>
                  <span style={{ fontSize: 10.5, color: MUT }}>{faDigits(ch.videoCount)} ویدیو · {compactViews(ch.totalViews)} بازدید</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
