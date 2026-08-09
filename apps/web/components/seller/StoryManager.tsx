'use client';

/* ═══════════════════════════════════════════════════════════════
   استوری‌های ۲۴ ساعته‌ی فروشگاه.
   ───────────────────────────────────────────────────────────────
   این جعبه تا امروز داخلِ «فروشگاه من» (`/dashboard/shop`) بود —
   صفحه‌ای که کارش فهرست و مدیریتِ آگهی‌هاست. استوری نه آگهی است نه
   ربطی به فهرستِ آگهی‌ها دارد؛ جایش پنلِ فروشگاه است، همان‌جا که
   نام و لوگو و گالری تنظیم می‌شوند و کارتِ داشبورد هم از قبل
   می‌گفت «... استوری و گالری فروشگاه خود را تنظیم کنید».

   کامپوننت شد تا اگر روزی جای دیگری هم لازم شد، دوباره نوشته نشود.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Camera, X, Share2, Loader2, Plus } from 'lucide-react';
import { apiFetch } from '../../lib/http';
import { uploadFile } from '../../lib/supabase';
import { notify } from '../../lib/ui/dialogs';

const LQ = 'bg-[rgba(199,166,106,0.12)] border border-[rgba(199,166,106,0.34)] text-[#9A6E38] rounded-[10px] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgba(199,166,106,0.18)]';
const LQ_NEUTRAL = 'bg-[rgba(28,28,26,0.04)] border border-[rgba(28,28,26,0.1)] text-[#5B564B] rounded-[10px] transition-all duration-200 hover:-translate-y-0.5';

export interface SellerStory {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  text: string;
  textColor: string;
  textSize: number;
  createdAt: string;
  expiresAt: string;
}

const STORY_TEXT_COLORS = ['#ffffff', '#f59e0b', '#10b981', '#ef4444', '#a78bfa'];
const STORY_TEXT_SIZES = [{ label: 'S', value: 13 }, { label: 'M', value: 17 }, { label: 'L', value: 22 }];

export default function StoryManager({ ownerId }: { ownerId: string }) {
  const [stories, setStories] = useState<SellerStory[]>([]);
  const [storyDraft, setStoryDraft] = useState<{
    file: File; previewUrl: string; text: string; textColor: string; textSize: number;
  } | null>(null);
  const [uploadingStory, setUploadingStory] = useState(false);
  const storyFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ownerId) return;
    fetch(`/api/sellers/${ownerId}/stories`)
      .then(r => r.json())
      .then(data => setStories(Array.isArray(data) ? data : []))
      .catch(() => { });
  }, [ownerId]);

  const handleStoryFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setStoryDraft({ file, previewUrl, text: '', textColor: '#ffffff', textSize: 17 });
    e.target.value = '';
  }, []);

  const uploadStory = async () => {
    if (!storyDraft || !ownerId) return;
    setUploadingStory(true);
    try {
      const path = `sellers/${ownerId}/stories/${Date.now()}-${storyDraft.file.name}`;
      const mediaUrl = await uploadFile('seller-media', storyDraft.file, path);
      if (!mediaUrl) throw new Error('upload failed');
      const story: SellerStory = {
        id: `s_${Date.now()}`,
        mediaUrl,
        mediaType: storyDraft.file.type.startsWith('video') ? 'video' : 'image',
        text: storyDraft.text,
        textColor: storyDraft.textColor,
        textSize: storyDraft.textSize,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      await apiFetch(`/api/sellers/${ownerId}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story),
      });
      setStories(prev => [...prev, story]);
      URL.revokeObjectURL(storyDraft.previewUrl);
      setStoryDraft(null);
    } catch {
      notify('آپلود استوری انجام نشد — دوباره تلاش کنید.');
    } finally {
      setUploadingStory(false);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!ownerId) return;
    await apiFetch(`/api/sellers/${ownerId}/stories?storyId=${storyId}`, { method: 'DELETE' });
    setStories(prev => prev.filter(s => s.id !== storyId));
  };

  const storyTimeLeft = (expiresAt: string) => {
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'منقضی';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h} ساعت دیگر` : `${m} دقیقه دیگر`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
            <Camera size={16} className="text-amber-500" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-sm">استوری‌های من</h2>
            <p className="text-xs text-gray-400">تا ۲۴ ساعت در صفحه اصلی نمایش داده می‌شود</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => storyFileRef.current?.click()}
          className={`${LQ} flex items-center gap-1.5 text-xs font-bold px-3 py-2`}>
          <Plus size={14} />
          استوری جدید
        </button>
        <input ref={storyFileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleStoryFile} />
      </div>

      {/* پیش‌نمایش آپلود */}
      {storyDraft && (
        <div className="p-5 border-b border-amber-50 bg-amber-50/40">
          <div className="flex gap-5 flex-wrap">
            {/* کارت پیش‌نمایش 9:16 */}
            <div className="relative rounded-2xl overflow-hidden flex-shrink-0 shadow-lg"
              style={{ width: 120, height: 213, background: '#1a1a1a' }}>
              {storyDraft.file.type.startsWith('video')
                ? <video src={storyDraft.previewUrl} muted autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <img loading="lazy" decoding="async" src={storyDraft.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              {storyDraft.text && (
                <div style={{
                  position: 'absolute', bottom: 16, left: 8, right: 8, textAlign: 'center',
                  color: storyDraft.textColor, fontSize: storyDraft.textSize,
                  fontWeight: 700, textShadow: '0 1px 8px rgba(0,0,0,0.7)', lineHeight: 1.4,
                }}>
                  {storyDraft.text}
                </div>
              )}
            </div>

            {/* کنترل‌های متن */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">متن روی استوری</label>
                <input
                  value={storyDraft.text}
                  onChange={e => setStoryDraft(d => d ? { ...d, text: e.target.value } : d)}
                  placeholder="مثال: تخفیف ویژه این هفته 🔥"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-right outline-none focus:border-amber-400 transition-colors"
                  dir="rtl"
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">رنگ متن</label>
                  <div className="flex gap-2">
                    {STORY_TEXT_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setStoryDraft(d => d ? { ...d, textColor: c } : d)}
                        style={{
                          background: c, width: 24, height: 24, borderRadius: '50%',
                          border: storyDraft.textColor === c ? '2px solid #f59e0b' : '2px solid #d1d5db',
                          boxShadow: storyDraft.textColor === c ? '0 0 0 2px #f59e0b40' : 'none',
                        }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">اندازه</label>
                  <div className="flex gap-1.5">
                    {STORY_TEXT_SIZES.map(s => (
                      <button key={s.value} type="button" onClick={() => setStoryDraft(d => d ? { ...d, textSize: s.value } : d)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          storyDraft.textSize === s.value
                            ? 'bg-[rgba(199,166,106,0.18)] border border-[rgba(199,166,106,0.44)] text-[#9A6E38]'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={uploadStory} disabled={uploadingStory}
                  className={`${LQ} flex items-center gap-1.5 disabled:opacity-60 text-sm font-bold px-4 py-2`}>
                  {uploadingStory ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
                  {uploadingStory ? 'در حال آپلود...' : 'اشتراک‌گذاری'}
                </button>
                <button type="button" onClick={() => { URL.revokeObjectURL(storyDraft.previewUrl); setStoryDraft(null); }}
                  className={`${LQ_NEUTRAL} flex items-center gap-1.5 text-sm font-bold px-4 py-2`}>
                  <X size={15} />
                  لغو
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* لیست استوری‌های فعال */}
      <div className="p-5">
        {stories.length === 0 && !storyDraft ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
              <Camera size={24} className="text-amber-300" />
            </div>
            <p className="text-gray-400 text-sm">هنوز استوری‌ای ندارید</p>
            <p className="text-gray-300 text-xs mt-1">استوری‌ها ۲۴ ساعت نمایش داده می‌شوند</p>
          </div>
        ) : stories.length > 0 ? (
          <div className="flex gap-3 flex-wrap">
            {stories.map(story => (
              <div key={story.id} className="relative flex-shrink-0 group" style={{ width: 72 }}>
                <div className="rounded-xl overflow-hidden relative shadow-sm" style={{ width: 72, height: 128, background: '#1a1a1a' }}>
                  {story.mediaType === 'video'
                    ? <video src={story.mediaUrl} muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <img loading="lazy" decoding="async" src={story.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {/* Amber ring (active) */}
                  <div className="absolute inset-0 rounded-xl" style={{ border: '2px solid #f59e0b' }} />
                  <button
                    type="button"
                    onClick={() => deleteStory(story.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} className="text-white" />
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-1 leading-tight" style={{ fontSize: 10 }}>
                  {storyTimeLeft(story.expiresAt)}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
