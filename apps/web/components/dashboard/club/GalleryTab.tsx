'use client';

/* ─────────────────────────────────────────────────────────────
   تبِ «گالری» پنلِ مدیریتِ باشگاه — لوگو، استوری، عکس‌های باشگاه و
   آلبوم‌ها.

   چرا کاملاً جدا شد و prop-drill نشد: این تب حدود بیست `useState` و
   ده هندلرِ خودش را دارد که هیچ‌جای دیگرِ داشبورد استفاده نمی‌شوند.
   فرستادنشان به‌صورت prop یعنی بیست‌وپنج prop — بدتر از وضعِ قبلی.
   پس خودِ state هم به این‌جا آمد و صفحه‌ی مادر فقط سه چیز می‌دهد:
   باشگاهِ انتخاب‌شده، و راهی برای خبردادنِ تغییرِ لوگو.

   عکس‌های این‌جا پس‌زمینه‌ی صفحه‌ی عمومیِ باشگاه را می‌سازند
   (ستونِ `clubs.images`)، پس ذخیره‌شان روی سرور است نه localStorage.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from 'react';
import { ask } from '../../../lib/ui/dialogs'
import { Camera, Loader2, Trash2, Plus, X, Image as ImageIcon, Upload, FolderPlus, AlertCircle, Pencil, Check } from 'lucide-react';
import api from '../../../lib/api';
import { apiFetch } from '../../../lib/http';
import { uploadFile } from '../../../lib/supabase';
import { toFa as faDigit } from '../../ui/FaNumberInput';
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
export interface ClubPhoto { id: string; dataUrl: string; name: string }
export interface ClubAlbumItem { id: string; dataUrl: string; name: string; caption: string }
export interface ClubAlbum { id: string; name: string; createdAt: string; items: ClubAlbumItem[] }

interface ClubLike { id: string; name?: string; logo?: string; images?: unknown; albums?: unknown }

const uid = (): string => Math.random().toString(36).slice(2, 10);

/* `compressImage` حذف شد: عکسِ آلبوم دیگر data-URL نمی‌شود و مثلِ بقیه‌ی
   عکس‌های باشگاه به Storage می‌رود. */

/* سقفِ عکس‌های باشگاه. این‌ها پس‌زمینه‌ی صفحه‌ی عمومی می‌شوند و
   بی‌سقف‌بودن هم ردیفِ دیتابیس را سنگین می‌کرد و هم صفحه را. */
const MAX_CLUB_PHOTOS = 10;

export default function GalleryTab({ club, onLogoChange }: {
  club: ClubLike | null;
  onLogoChange: (url: string) => void;
}) {
  const [albums, setAlbums] = useState<ClubAlbum[]>([]);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  /* آلبومی که نامش در حالِ ویرایش است */
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editingAlbumName, setEditingAlbumName] = useState('');
  const [uploadingAlbum, setUploadingAlbum] = useState<string | null>(null);
  const [singlePhotos, setSinglePhotos] = useState<ClubPhoto[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [uploadingSingle, setUploadingSingle] = useState(false);
  const [storyDraft, setStoryDraft] = useState<{ file: File; previewUrl: string; text: string } | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [storyUploading, setStoryUploading] = useState(false);
  const [storyList, setStoryList] = useState<ClubStory[]>([]);
  /* خطای انتشار/حذفِ استوری و لوگو — تا امروز بی‌صدا بلعیده می‌شد */
  const [storyError, setStoryError] = useState('');
  const [albumError, setAlbumError] = useState('');
  const [storyTextColor, setStoryTextColor] = useState('#ffffff');
  const [storyTextSize, setStoryTextSize] = useState(15);
  const [storyTextBold, setStoryTextBold] = useState(false);
  const [storyTextAlign, setStoryTextAlign] = useState<'right'|'center'|'left'>('center');
  const [storyTextPos, setStoryTextPos] = useState<'top'|'center'|'bottom'>('bottom');

  const lsKey = useCallback((type: string) => `club-${type}-${club?.id ?? 'none'}`, [club]);

  /* ── آلبوم‌ها روی سرور ذخیره می‌شوند ──
     تا امروز فقط در `localStorage`ِ خودِ باشگاه‌دار بودند و صفحه‌ی عمومیِ
     باشگاه هم همان کلید را از `localStorage`ِ بازدیدکننده می‌خواند — که
     همیشه خالی است. یعنی آلبوم‌ها را هیچ‌کس جز خودِ باشگاه‌دار نمی‌دید.

     ستون `albums` فقط **نشانی** نگه می‌دارد؛ تصویرها مثلِ عکس‌های باشگاه
     به Storage می‌روند. */
  const saveAlbums = useCallback(async (next: ClubAlbum[]) => {
    if (!club) return;
    const before = albums;
    setAlbums(next);
    setAlbumError('');
    try {
      await api.put(`/clubs/${club.id}`, { albums: next });
      try { localStorage.removeItem(lsKey('albums')); } catch { /* ignore */ }
    } catch {
      setAlbums(before);
      setAlbumError('ذخیره‌ی آلبوم روی سرور انجام نشد؛ دوباره تلاش کنید.');
    }
  }, [lsKey, club, albums]);

  const savePhotos = useCallback(async (next: ClubPhoto[]) => {
    if (!club) return;
    setSinglePhotos(next);
    setPhotoError('');
    try {
      await api.put(`/clubs/${club.id}`, { images: next.map(p => p.dataUrl) });
      try { localStorage.removeItem(lsKey('photos')); } catch { /* ignore */ }
    } catch {
      setPhotoError('ذخیره‌ی عکس‌ها روی سرور انجام نشد؛ دوباره تلاش کنید.');
    }
  }, [lsKey, club]);

  /* با عوض‌شدنِ باشگاه، همه‌چیزِ این تب دوباره خوانده می‌شود */
  useEffect(() => {
    if (!club) { setAlbums([]); setSinglePhotos([]); setStoryList([]); return; }
    const clubId = club.id;
    let alive = true;

    setPhotoError('');
    setAlbumError('');
    setStoryError('');
    setStoryDraft(null);
    setOpenAlbumId(null);

    /* ── چرا دوباره از سرور می‌خوانیم و از prop استفاده نمی‌کنیم ──
       `club` یک عکسِ لحظه‌ایِ فهرستی است که موقعِ بازشدنِ داشبورد گرفته
       شده. پس از ذخیره‌ی یک آلبوم یا عکس، آن فهرست به‌روز نمی‌شود؛
       کافی بود کاربر باشگاه را عوض کند و برگردد تا نسخه‌ی پیش از ذخیره
       را ببیند و خیال کند کارش گم شده. */
    const applyRow = (c: Record<string, unknown> | null) => {
      if (!alive) return;

      /* منبعِ حقیقتِ عکس‌ها سرور است. نسخه‌ی مرورگری فقط برای باشگاهی
         می‌ماند که هنوز چیزی روی سرور ندارد (داده‌ی پیش از انتقال). */
      const imgs = Array.isArray(c?.images) ? c!.images as string[] : (club.images as string[] | undefined) ?? [];
      const fromServer = imgs.filter(Boolean).slice(0, MAX_CLUB_PHOTOS)
        .map((u, i) => ({ id: `srv-${i}`, dataUrl: u, name: '' }));
      if (fromServer.length) setSinglePhotos(fromServer);
      else {
        try {
          const p = localStorage.getItem(`club-photos-${clubId}`);
          setSinglePhotos(p ? JSON.parse(p) : []);
        } catch { setSinglePhotos([]); }
      }

      /* آلبومِ پیش از مهاجرتِ ۰۶۵ فقط در مرورگر بود؛ تا وقتی سرور خالی
         است همان نشان داده می‌شود و اولین ذخیره منتقلش می‌کند. */
      const srvAlbums = Array.isArray(c?.albums) ? c!.albums as ClubAlbum[] : [];
      if (srvAlbums.length) setAlbums(srvAlbums);
      else {
        try {
          const a = localStorage.getItem(`club-albums-${clubId}`);
          setAlbums(a ? JSON.parse(a) : []);
        } catch { setAlbums([]); }
      }
    };

    apiFetch(`/api/clubs/${clubId}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(applyRow)
      .catch(() => applyRow(null));

    /* `sync=1` رکوردِ باشگاه را از روی فایلِ استوری‌ها تعمیر می‌کند —
       برای استوری‌هایی که پیش از مهاجرتِ ۰۶۴ ثبت شده‌اند و رکوردشان
       ستون‌های استوری را ندارد. */
    fetch(`/api/clubs/${clubId}/stories?sync=1`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (alive && Array.isArray(d)) setStoryList(d); })
      .catch(() => { if (alive) setStoryList([]); });

    return () => { alive = false; };
  }, [club]);

  const createAlbum = () => {
    if (!newAlbumName.trim()) return;
    const album: ClubAlbum = { id: uid(), name: newAlbumName.trim(), createdAt: new Date().toISOString(), items: [] };
    void saveAlbums([album, ...albums]);
    setNewAlbumName('');
    setOpenAlbumId(album.id);
  };

  const deleteAlbum = (id: string) => {
    void saveAlbums(albums.filter(a => a.id !== id));
    if (openAlbumId === id) setOpenAlbumId(null);
  };

  const commitAlbumName = (id: string) => {
    const name = editingAlbumName.trim();
    setEditingAlbumId(null);
    if (!name || name === albums.find(a => a.id === id)?.name) return;
    void saveAlbums(albums.map(a => (a.id === id ? { ...a, name } : a)));
  };

  /* تصویر به Storage می‌رود و فقط نشانی‌اش ذخیره می‌شود.
     پیش‌تر base64ِ فشرده مستقیم داخلِ داده می‌نشست — که در
     `localStorage` هم سنگین بود و در یک ستونِ jsonb فاجعه می‌شد: هر
     `select('*')` روی جدولِ باشگاه‌ها چند مگابایت می‌آورد و صفحه‌ی اولِ
     سایت همان را می‌زند. */
  const uploadToAlbum = async (albumId: string, files: FileList) => {
    if (!club) return;
    setUploadingAlbum(albumId);
    setAlbumError('');
    const newItems: ClubAlbumItem[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('path', `clubs/${club.id}/albums/${albumId}/${Date.now()}-${newItems.length}`);
        const r = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const j = await r.json().catch(() => ({} as { url?: string; message?: string }));
        if (!r.ok || !j?.url) throw new Error(j?.message);
        newItems.push({ id: uid(), dataUrl: j.url, name: file.name, caption: '' });
      }
      if (newItems.length) {
        await saveAlbums(albums.map(a => a.id === albumId ? { ...a, items: [...a.items, ...newItems] } : a));
      }
    } catch {
      setAlbumError('آپلود عکسِ آلبوم انجام نشد؛ دوباره تلاش کنید.');
    } finally {
      setUploadingAlbum(null);
    }
  };

  const deletePhotoFromAlbum = (albumId: string, itemId: string) => {
    void saveAlbums(albums.map(a =>
      a.id === albumId ? { ...a, items: a.items.filter(i => i.id !== itemId) } : a
    ));
  };

  const uploadSinglePhotos = async (files: FileList) => {
    if (!club) return;
    setPhotoError('');
    const room = MAX_CLUB_PHOTOS - singlePhotos.length;
    if (room <= 0) {
      setPhotoError(`حداکثر ${MAX_CLUB_PHOTOS} عکس — برای افزودن عکس تازه، یکی را حذف کنید.`);
      return;
    }

    setUploadingSingle(true);
    const picked = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, room);
    const added: ClubPhoto[] = [];
    try {
      for (const file of picked) {
        /* روی Storage آپلود می‌شود نه به‌صورت data-URL: ده عکسِ base64
           داخل یک ستون، هم ردیف را چند مگابایتی می‌کند و هم هر بار
           خواندنِ باشگاه را کند. */
        const fd = new FormData();
        fd.append('file', file);
        fd.append('path', `clubs/${club.id}/photos/${Date.now()}-${added.length}`);
        const r = await apiFetch('/api/upload', { method: 'POST', body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.url) throw new Error(j?.message);
        added.push({ id: uid(), dataUrl: j.url, name: file.name });
      }
      if (picked.length < Array.from(files).filter(f => f.type.startsWith('image/')).length) {
        setPhotoError(`فقط ${picked.length} عکس اضافه شد — سقف ${MAX_CLUB_PHOTOS} عکس است.`);
      }
      await savePhotos([...singlePhotos, ...added]);
    } catch {
      setPhotoError('آپلود عکس انجام نشد؛ دوباره تلاش کنید.');
    } finally {
      setUploadingSingle(false);
    }
  };

  const deleteSinglePhoto = (id: string) => {
    void savePhotos(singlePhotos.filter(p => p.id !== id));
  };

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
     تا امروز POST داخل یک `try {} catch {}`ِ خالی بود و کدِ وضعیت هم
     خوانده نمی‌شد. یعنی اگر سرور ۴۰۳ می‌داد (استوری فقط دستِ مالکِ همان
     باشگاه است) استوری در فهرستِ محلی نشان داده می‌شد و باشگاه‌دار خیال
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

      setStoryList(prev => [...prev, newStory]);
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
                {/* همان نشانی که بازدیدکننده می‌بیند — تا صاحبِ باشگاه
                    پیش‌نمایشِ واقعی داشته باشد، نه حرفِ اولِ نام. */}
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

              {/* ── حذفِ لوگو ──
                  تا امروز فقط جایگزینی ممکن بود. باشگاهی که لوگوی
                  اشتباهی گذاشته بود هیچ راهی برای برگشتن به حالتِ
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
         {/* ── Single photos ── */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <SectionTitle style={{ margin: 0 }}>
              عکس‌های باشگاه
              <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginInlineStart: 8 }}>
                {faDigit(String(singlePhotos.length))} از {faDigit(String(MAX_CLUB_PHOTOS))}
              </span>
            </SectionTitle>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              cursor: (uploadingSingle || singlePhotos.length >= MAX_CLUB_PHOTOS) ? 'not-allowed' : 'pointer',
              opacity: (uploadingSingle || singlePhotos.length >= MAX_CLUB_PHOTOS) ? 0.5 : 1,
              padding: '8px 16px', borderRadius: 20,
              background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.38)',
              fontSize: 13, fontWeight: 700, color: '#A07840',
            }}>
              {uploadingSingle ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> آپلود...</> : <><Camera size={13} /> آپلود عکس</>}
              <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                disabled={uploadingSingle || singlePhotos.length >= MAX_CLUB_PHOTOS}
                onChange={e => { if (e.target.files?.length) void uploadSinglePhotos(e.target.files); e.target.value = ''; }} />
            </label>
          </div>
          <p style={{ fontSize: 11.5, color: '#9CA3AF', margin: '0 0 14px', lineHeight: 1.95 }}>
            این عکس‌ها پس‌زمینه‌ی صفحه‌ی عمومی باشگاه شما می‌شوند. عکسِ اول بیشتر از بقیه دیده می‌شود.
          </p>
          {photoError && (
            <div style={{ marginBottom: 12, padding: '9px 13px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', color: '#991B1B' }}>
              {photoError}
            </div>
          )}
          {singlePhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#9CA3AF', fontSize: 13 }}>
              هنوز عکسی آپلود نشده — از دکمه بالا عکس اضافه کنید
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
              {singlePhotos.map(photo => (
                <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                  <img loading="lazy" decoding="async" src={photo.dataUrl} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => deleteSinglePhoto(photo.id)} style={{
                    position: 'absolute', top: 4, left: 4,
                    background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none',
                    borderRadius: '50%', width: 22, height: 22, fontSize: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>×</button>
                </div>
              ))}
            </div>
          )}
        </Card>
         {/* Create album */}
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>ایجاد آلبوم جدید</SectionTitle>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={newAlbumName}
              onChange={e => setNewAlbumName(e.target.value)}
              placeholder="نام آلبوم مثلاً: مسابقات کشوری ۱۴۰۵"
              onKeyDown={e => { if (e.key === 'Enter') createAlbum(); }}
              style={{
                flex: 1, border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px',
                fontSize: 14, fontFamily: 'var(--font-base)', color: DARK, outline: 'none',
                background: '#FAFAFA',
              }}
            />
            <button onClick={createAlbum} disabled={!newAlbumName.trim()} style={{
              background: GOLD, color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-base)', opacity: newAlbumName.trim() ? 1 : 0.5,
            }}>+ ایجاد</button>
          </div>
          {albumError && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 12,
              padding: '10px 12px', borderRadius: 10, lineHeight: 1.9,
              background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.28)',
              fontSize: 12.5, fontWeight: 700, color: '#B91C1C',
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{albumError}</span>
            </div>
          )}
        </Card>
         {/* Albums list */}
        {albums.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><ImageIcon size={44} color="#D1D5DB" strokeWidth={1.2} /></div>
            <p style={{ color: '#6B7280', fontSize: 14 }}>هنوز آلبومی ایجاد نشده</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {albums.map(album => {
              const isOpen = openAlbumId === album.id;
              const cover = album.items[0]?.dataUrl;
              return (
                <Card key={album.id} style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Album header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}
                    onClick={() => setOpenAlbumId(isOpen ? null : album.id)}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                      background: `${GOLD}15`, border: `1px solid ${GOLD}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}>
                      {cover
                        ? <img loading="lazy" decoding="async" src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '🖼'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* ── تغییرِ نام ──
                          آلبوم فقط دکمه‌ی حذف داشت، یعنی یک غلطِ املایی در
                          نام یعنی ساختنِ آلبومِ تازه و آپلودِ دوباره‌ی همه‌ی
                          عکس‌ها. */}
                      {editingAlbumId === album.id ? (
                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={editingAlbumName}
                            onChange={e => setEditingAlbumName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitAlbumName(album.id);
                              if (e.key === 'Escape') setEditingAlbumId(null);
                            }}
                            style={{
                              flex: 1, minWidth: 0, boxSizing: 'border-box',
                              border: `1px solid ${GOLD}66`, borderRadius: 8, padding: '7px 10px',
                              fontSize: 14, fontFamily: 'var(--font-base)', color: DARK,
                              background: '#fff', outline: 'none',
                            }}
                          />
                          <button onClick={() => commitAlbumName(album.id)} title="ذخیره"
                            style={{ background: `${GOLD}1F`, color: '#A07840', border: `1px solid ${GOLD}55`, borderRadius: 8, padding: '0 11px', cursor: 'pointer' }}>
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingAlbumId(null)} title="انصراف"
                            style={{ background: 'rgba(0,0,0,0.04)', color: '#6B7280', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '0 11px', cursor: 'pointer' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 700, fontSize: 15, color: DARK }}>{album.name}</div>
                          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                            {album.items.length} تصویر · {new Date(album.createdAt).toLocaleDateString('fa-IR')}
                          </div>
                        </>
                      )}
                    </div>
                    {editingAlbumId !== album.id && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          title="تغییر نام آلبوم"
                          onClick={e => { e.stopPropagation(); setEditingAlbumId(album.id); setEditingAlbumName(album.name); }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: `${GOLD}14`, color: '#A07840', border: `1px solid ${GOLD}44`, borderRadius: 8,
                            padding: '5px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-base)',
                          }}><Pencil size={12} /> ویرایش</button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteAlbum(album.id); }}
                          style={{
                            background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8,
                            padding: '5px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-base)',
                          }}>حذف</button>
                        <span style={{ fontSize: 18, color: '#ccc', transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
                      </div>
                    )}
                  </div>
                   {/* Expanded */}
                  {isOpen && (
                    <div style={{ padding: '0 18px 18px', borderTop: '1px solid #F0EDE8' }}>
                      {/* Upload */}
                      <div style={{ paddingTop: 14, marginBottom: 14 }}>
                        <label style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                          padding: '9px 18px', borderRadius: 20,
                          background: `${GOLD}12`, border: `1px solid ${GOLD}44`,
                          fontSize: 13, fontWeight: 700, color: '#A07840',
                        }}>
                          {uploadingAlbum === album.id ? <><Loader2 size={12} /> آپلود...</> : <><Camera size={12} /> افزودن تصویر</>}
                          <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                            onChange={e => { if (e.target.files?.length) uploadToAlbum(album.id, e.target.files); e.target.value = ''; }} />
                        </label>
                      </div>
                       {/* Image grid */}
                      {album.items.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                          {album.items.map(item => (
                            <div key={item.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                              <img loading="lazy" decoding="async" src={item.dataUrl} alt={item.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button
                                onClick={() => deletePhotoFromAlbum(album.id, item.id)}
                                style={{
                                  position: 'absolute', top: 4, left: 4,
                                  background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none',
                                  borderRadius: '50%', width: 22, height: 22, fontSize: 12,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>×</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                          هنوز تصویری اضافه نشده
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
