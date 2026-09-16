'use client';

/* ─────────────────────────────────────────────────────────────
   تب «گالری» پنل مدیریت باشگاه — لوگو و استوریِ باشگاه.

   «عکس‌های باشگاه» و «آلبوم‌ها» از این تب برداشته شدند: همان کار از
   دکمه‌ی + در گالریِ صفحه‌ی خودِ باشگاه انجام می‌شود و دو مسیر برای
   یک کار فقط باشگاه‌دار را سردرگم می‌کرد. استوری اما این‌جا ماند —
   استوریِ *باشگاه* است (حلقه‌ی طلایی روی کارت) و جای دیگری ندارد.

   چرا کاملا جدا شد و prop-drill نشد: این تب حدود بیست `useState` و
   ده هندلر خودش را دارد که هیچ‌جای دیگر داشبورد استفاده نمی‌شوند.
   فرستادنشان به‌صورت prop یعنی بیست‌وپنج prop — بدتر از وضع قبلی.
   پس خود state هم به این‌جا آمد و صفحه‌ی مادر فقط سه چیز می‌دهد:
   باشگاه انتخاب‌شده، و راهی برای خبردادن تغییر لوگو.

   لوگو و استوری هر دو روی سرور ذخیره می‌شوند، نه localStorage.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect } from 'react';
import { ask } from '../../../lib/ui/dialogs'
import { Camera, Loader2, Trash2, Upload, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';
import { apiFetch } from '../../../lib/http';
import { uploadFile } from '../../../lib/supabase';
import ClubLogo from '../../club/ClubLogo';
import { Card, SectionTitle } from './fields';

const GOLD = '#C7A66A';
const DARK = '#1A1A18';

export interface ClubStory {
  id: string; mediaUrl: string; mediaType: string; text: string;
  textColor: string; textSize: number; textBold: boolean;
  textAlign: 'right' | 'center' | 'left';
  textPos: 'top' | 'center' | 'bottom';
  createdAt: string; expiresAt: string;
}

interface ClubLike { id: string; name?: string; logo?: string }




export default function GalleryTab({ club, onLogoChange }: {
  club: ClubLike | null;
  onLogoChange: (url: string) => void;
}) {
  const [storyDraft, setStoryDraft] = useState<{ file: File; previewUrl: string; text: string } | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [storyUploading, setStoryUploading] = useState(false);
  const [storyList, setStoryList] = useState<ClubStory[]>([]);
  /* خطای انتشار/حذف استوری و لوگو — تا امروز بی‌صدا بلعیده می‌شد */
  const [storyError, setStoryError] = useState('');
  const [storyTextColor, setStoryTextColor] = useState('#ffffff');
  const [storyTextSize, setStoryTextSize] = useState(15);
  const [storyTextBold, setStoryTextBold] = useState(false);
  const [storyTextAlign, setStoryTextAlign] = useState<'right'|'center'|'left'>('center');
  const [storyTextPos, setStoryTextPos] = useState<'top'|'center'|'bottom'>('bottom');



  /* با عوض‌شدن باشگاه، همه‌چیز این تب دوباره خوانده می‌شود.

     وابستگی به **شناسه** است نه به خودِ شیء: والد با هر ذخیره یک شیءِ
     تازه می‌سازد و با وابستگیِ شیئی، این افکت دوباره اجرا می‌شد و
     setStoryDraft(null) پیش‌نویسِ نیمه‌کاره‌ی استوری (فایل، متن و
     تنظیمِ رنگ) را بی‌صدا دور می‌ریخت. */
  const clubId = club?.id;
  useEffect(() => {
    if (!clubId) { setStoryList([]); return; }
    let alive = true;

    setStoryError('');
    setStoryDraft(null);

    /* `sync=1` رکورد باشگاه را از روی فایل استوری‌ها تعمیر می‌کند —
       برای استوری‌هایی که پیش از مهاجرت ۰۶۴ ثبت شده‌اند و رکوردشان
       ستون‌های استوری را ندارد. */
    fetch(`/api/clubs/${clubId}/stories?sync=1`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (alive && Array.isArray(d)) setStoryList(d); })
      .catch(() => { if (alive) setStoryList([]); });

    return () => { alive = false; };
  }, [clubId]);




  /* تصویر به Storage می‌رود و فقط نشانی‌اش ذخیره می‌شود.
     پیش‌تر base64 فشرده مستقیم داخل داده می‌نشست — که در
     `localStorage` هم سنگین بود و در یک ستون jsonb فاجعه می‌شد: هر
     `select('*')` روی جدول باشگاه‌ها چند مگابایت می‌آورد و صفحه‌ی اول
     سایت همان را می‌زند. */




  const uploadLogo = async (file: File) => {
    if (!club) return;
    setLogoUploading(true);
    setStoryError('');
    try {
      const url = await uploadFile('club-media', file, `clubs/${club.id}/logo/${file.name}`);
      if (!url) throw new Error('آپلود انجام نشد');
      await api.put(`/clubs/${club.id}`, { logo: url });
      onLogoChange(url);
    } catch {
      setStoryError('ذخیره‌ی لوگو انجام نشد؛ دوباره تلاش کنید.');
    }
    setLogoUploading(false);
  };

  /* ── چرا نتیجه‌ی سرور این‌جا مهم است ──
     تا امروز POST داخل یک `try {} catch {}` خالی بود و کد وضعیت هم
     خوانده نمی‌شد. یعنی اگر سرور ۴۰۳ می‌داد (استوری فقط دست مالک همان
     باشگاه است) استوری در فهرست محلی نشان داده می‌شد و باشگاه‌دار خیال
     می‌کرد منتشر شده — در حالی که هیچ‌جا ثبت نشده بود. */
  const uploadStory = async (file: File, text: string) => {
    if (!club) return;
    if (storyList.length >= 10) { setStoryError('حداکثر ۱۰ استوری مجاز است'); return; }
    setStoryUploading(true);
    setStoryError('');
    try {
      const url = await uploadFile('club-media', file, `clubs/${club.id}/stories/${Date.now()}-${file.name}`);
      if (!url) throw new Error('آپلود فایل انجام نشد');

      const newStory: ClubStory = {
        id: `s_${Date.now()}`,
        mediaUrl: url,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        text,
        textColor: storyTextColor,
        textSize: storyTextSize,
        textBold: storyTextBold,
        textAlign: storyTextAlign,
        textPos: storyTextPos,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      const r = await apiFetch(`/api/clubs/${club.id}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStory),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({} as { message?: string }));
        throw new Error(j?.message || 'ثبت استوری روی سرور انجام نشد');
      }

      /* رکوردی که *سرور* نوشت را نگه می‌داریم، نه پیش‌نویس محلی را:
         شناسه و انقضا آن‌جا ساخته می‌شوند و حذف بعدی با همان شناسه
         انجام می‌شود. */
      const saved = (await r.json().catch(() => null)) as ClubStory | null;
      if (!saved?.id) throw new Error("پاسخ سرور خوانده نشد");
      setStoryList(prev => [...prev, saved]);
      setStoryDraft(null);
      setStoryTextColor('#ffffff');
      setStoryTextSize(15);
      setStoryTextBold(false);
      setStoryTextAlign('center');
      setStoryTextPos('bottom');
    } catch (e) {
      setStoryError(e instanceof Error && e.message ? e.message : 'انتشار استوری انجام نشد؛ دوباره تلاش کنید.');
    }
    setStoryUploading(false);
  };

  const deleteStory = async (storyId: string) => {
    if (!club) return;
    const before = storyList;
    setStoryList(prev => prev.filter(s => s.id !== storyId));
    setStoryError('');
    try {
      const r = await apiFetch(`/api/clubs/${club.id}/stories?storyId=${storyId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
    } catch {
      /* حذف روی سرور نشد ⇒ فهرست را برگردان، وگرنه استوری در پنل نیست
         ولی روی سایت هست. */
      setStoryList(before);
      setStoryError('حذف استوری انجام نشد؛ دوباره تلاش کنید.');
    }
  };

  if (!club) return null;

  return (
    <>
      <div>
         {/* ── Logo / Avatar ── */}
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>لوگو / آواتار باشگاه</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
                background: `${GOLD}18`, border: `2px solid ${GOLD}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 900, color: GOLD,
              }}>
                {/* همان نشانی که بازدیدکننده می‌بیند — تا صاحب باشگاه
                    پیش‌نمایش واقعی داشته باشد، نه حرف اول نام. */}
                <ClubLogo src={club?.logo} name={club?.name} size={88} />
              </div>
              <label style={{
                position: 'absolute', bottom: 0, left: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: GOLD, border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <Camera size={12} color="#fff" />
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ''; }} />
              </label>

              {/* ── حذف لوگو ──
                  تا امروز فقط جایگزینی ممکن بود. باشگاهی که لوگوی
                  اشتباهی گذاشته بود هیچ راهی برای برگشتن به حالت
                  بی‌لوگو نداشت. فقط وقتی دیده می‌شود که لوگویی باشد. */}
              {club?.logo ? (
                <button type="button" title="حذف لوگو"
                  onClick={async () => {
                    if (!(await ask('لوگوی باشگاه حذف شود؟'))) return;
                    setLogoUploading(true);
                    try {
                      await api.put(`/clubs/${club.id}`, { logo: '' });
                      onLogoChange?.('');
                    } finally { setLogoUploading(false); }
                  }}
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: '50%',
                    background: '#DC2626', border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0,
                  }}>
                  <Trash2 size={12} color="#fff" />
                </button>
              ) : null}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 4 }}>{club?.name}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
                روی آیکون دوربین کلیک کنید تا لوگو یا تصویر پروفایل باشگاه را آپلود کنید
              </div>
              {logoUploading && <div style={{ fontSize: 12, color: GOLD, display: 'flex', alignItems: 'center', gap: 5 }}><Loader2 size={12} /> در حال آپلود...</div>}
            </div>
          </div>
        </Card>
         {/* ── Story ── */}
        <Card style={{ marginBottom: 16, border: `1px solid ${GOLD}33`, background: `${GOLD}04` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <SectionTitle style={{ margin: 0 }}>استوری‌های باشگاه ({storyList.length}/10)</SectionTitle>
            {storyList.length < 10 && !storyDraft && (
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                padding: '7px 16px', borderRadius: 20,
                background: `${GOLD}12`, border: `1px solid ${GOLD}44`,
                fontSize: 13, fontWeight: 700, color: '#A07840',
                opacity: storyUploading ? 0.5 : 1,
              }}>
                {storyUploading ? <><Loader2 size={13} /> آپلود...</> : <><Upload size={13} /> استوری جدید</>}
                <input type="file" accept="image/*,video/*" style={{ display: 'none' }} disabled={storyUploading}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setStoryDraft({ file: f, previewUrl: URL.createObjectURL(f), text: '' });
                    e.target.value = '';
                  }} />
              </label>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>
            فرمت ۹:۱۶ — عکس یا ویدیو — هر استوری پس از ۲۴ ساعت حذف می‌شود — حداکثر ۱۰ استوری
          </div>
          {storyError && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 14,
              padding: '10px 12px', borderRadius: 10, lineHeight: 1.9,
              background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.28)',
              fontSize: 12.5, fontWeight: 700, color: '#B91C1C',
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{storyError}</span>
            </div>
          )}
           {/* Draft preview */}
          {storyDraft && (
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', direction: 'ltr', marginBottom: 16 }}>
              <div style={{ position: 'relative', width: 130, flexShrink: 0, aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden', border: `2px solid ${GOLD}55`, background: '#111', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <img loading="lazy" decoding="async" src={storyDraft.previewUrl} alt="پیش‌نمایش" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {storyDraft.text && (
                  <div style={{
                    position: 'absolute',
                    ...(storyTextPos === 'top' ? { top: 12 } : storyTextPos === 'center' ? { top: '50%', transform: 'translateY(-50%)' } : { bottom: 12 }),
                    left: 6, right: 6,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                    borderRadius: 8, padding: '5px 7px',
                    color: storyTextColor, fontSize: Math.round(storyTextSize * 0.68),
                    fontWeight: storyTextBold ? 700 : 400,
                    textAlign: storyTextAlign, direction: 'rtl', lineHeight: 1.5,
                  }}>{storyDraft.text}</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 200, direction: 'rtl' }}>
                <div style={{ padding: '12px', borderRadius: 12, border: `1px solid ${GOLD}33`, background: `${GOLD}04`, marginBottom: 10 }}>
                  <textarea value={storyDraft.text} onChange={e => setStoryDraft(prev => prev ? { ...prev, text: e.target.value } : null)}
                    placeholder="متن روی استوری (اختیاری)..." rows={2}
                    style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, borderRadius: 8, border: `1px solid ${GOLD}44`, background: `${GOLD}06`, padding: '8px 10px', fontSize: 12, color: DARK, fontFamily: 'var(--font-base)', resize: 'none', direction: 'rtl', outline: 'none' }} />
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 5 }}>رنگ متن</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                    {['#ffffff','#000000','#FFD700','#ef4444','#3b82f6','#22c55e','#f97316','#ec4899','#a855f7','#06b6d4'].map(c => (
                      <button key={c} onClick={() => setStoryTextColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', flexShrink: 0, border: storyTextColor === c ? `2.5px solid ${GOLD}` : '1.5px solid #D1D5DB', boxShadow: storyTextColor === c ? `0 0 0 1px #fff inset` : 'none' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>اندازه:</span>
                    {([['S',11],['M',15],['L',20],['XL',28]] as [string,number][]).map(([lbl,sz]) => (
                      <button key={lbl} onClick={() => setStoryTextSize(sz)} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${storyTextSize === sz ? GOLD : '#E5E7EB'}`, background: storyTextSize === sz ? `${GOLD}20` : '#fff', color: storyTextSize === sz ? '#A07840' : '#6B7280' }}>{lbl}</button>
                    ))}
                    <button onClick={() => setStoryTextBold(v => !v)} style={{ padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 900, cursor: 'pointer', border: `1px solid ${storyTextBold ? GOLD : '#E5E7EB'}`, background: storyTextBold ? `${GOLD}20` : '#fff', color: storyTextBold ? '#A07840' : '#6B7280' }}>B</button>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>چینش:</span>
                    {([['راست','right'],['وسط','center'],['چپ','left']] as [string,'right'|'center'|'left'][]).map(([lbl,al]) => (
                      <button key={al} onClick={() => setStoryTextAlign(al)} style={{ padding: '2px 7px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: `1px solid ${storyTextAlign === al ? GOLD : '#E5E7EB'}`, background: storyTextAlign === al ? `${GOLD}20` : '#fff', color: storyTextAlign === al ? '#A07840' : '#6B7280' }}>{lbl}</button>
                    ))}
                    <span style={{ fontSize: 11, color: '#6B7280' }}>جایگاه:</span>
                    {([['↑','top'],['↕','center'],['↓','bottom']] as [string,'top'|'center'|'bottom'][]).map(([lbl,pos]) => (
                      <button key={pos} onClick={() => setStoryTextPos(pos)} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 13, cursor: 'pointer', border: `1px solid ${storyTextPos === pos ? GOLD : '#E5E7EB'}`, background: storyTextPos === pos ? `${GOLD}20` : '#fff', color: storyTextPos === pos ? '#A07840' : '#6B7280' }}>{lbl}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => uploadStory(storyDraft.file, storyDraft.text)} disabled={storyUploading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 20, border: '1px solid rgba(199,166,106,0.50)', background: 'rgba(199,166,106,0.16)', color: '#A07840', fontSize: 13, fontWeight: 700, cursor: storyUploading ? 'not-allowed' : 'pointer', opacity: storyUploading ? 0.6 : 1, fontFamily: 'var(--font-base)' }}>{storyUploading ? <><Loader2 size={13} /> آپلود...</> : <><Upload size={13} /> اشتراک‌گذاری</>}</button>
                  <button onClick={() => { URL.revokeObjectURL(storyDraft.previewUrl); setStoryDraft(null); }} disabled={storyUploading} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.11)', background: 'rgba(0,0,0,0.04)', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-base)' }}>انصراف</button>
                </div>
              </div>
            </div>
          )}
           {/* Story grid */}
          {storyList.length > 0 ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {storyList.map((s, idx) => (
                <div key={s.id} style={{ position: 'relative', width: 88, flexShrink: 0, aspectRatio: '9/16', borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${GOLD}55`, background: '#111', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  {s.mediaType === 'video'
                    ? <video src={s.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                    : <img loading="lazy" decoding="async" src={s.mediaUrl} alt={`story-${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {s.text && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '4px 5px', fontSize: 8, color: s.textColor || '#fff', textAlign: 'center', lineHeight: 1.3 }}>{s.text}</div>
                  )}
                  <button onClick={() => deleteStory(s.id)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                  <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '1px 4px', fontSize: 8, color: '#fff' }}>#{idx+1}</div>
                </div>
              ))}
            </div>
          ) : !storyDraft ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>
              هنوز استوری‌ای آپلود نشده — از دکمه بالا استوری اضافه کنید
            </div>
          ) : null}
        </Card>
        {/* ── «عکس‌های باشگاه» و «آلبوم‌ها» از این‌جا برداشته شدند ──
            هر دو همان کاری را می‌کردند که دکمه‌ی + در گالریِ صفحه‌ی
            خودِ باشگاه (`/clubs/[id]` ⟵ ProfileGallery با
            `canEdit={isClubOwner}`) انجام می‌دهد: افزودن عکس، ویدیو و
            آلبوم تازه. دو مسیر برای یک کار یعنی باشگاه‌دار نمی‌داند
            کدام «واقعی» است.

            ⚠️ بخشِ استوری عمدا مانده و تکراری **نیست**: نوارِ استوریِ
            صفحه‌ی اول (`components/Stories.tsx`) استوریِ *کاربر* را در
            جدولِ اجتماعی ثبت می‌کند، ولی این‌جا `/api/clubs/:id/stories`
            صدا زده می‌شود — استوریِ *باشگاه*، همان که حلقه‌ی طلایی را
            روی کارتِ باشگاه می‌کشد. برداشتنش یعنی حذفِ آن قابلیت. */}
      </div>
    </>
  );
}
