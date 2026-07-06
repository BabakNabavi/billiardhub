'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import { uploadFile } from '../../../lib/supabase';
import { Package, Edit, Trash2, Eye, CheckCircle, Clock, XCircle, Plus, ShoppingBag, Camera, X, Share2, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  discountPercent?: number;
  category: string;
  condition: string;
  city: string;
  images: string[];
  isVerified: boolean;
  isOfficialStore: boolean;
  status: string;
  stock: number;
  views: number;
  requestedVerification: boolean;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  table: 'میز بیلیارد',
  cue: 'چوب بیلیارد',
  ball: 'توپ',
  accessory: 'لوازم جانبی',
  clothing: 'پوشاک',
  educational: 'آموزشی',
  other: 'سایر',
};

const conditionLabels: Record<string, string> = {
  new: 'نو',
  like_new: 'در حد نو',
  used: 'کارکرده',
};

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'فعال', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
  sold: { label: 'فروخته شده', color: 'bg-gray-100 text-gray-600', icon: <CheckCircle size={12} /> },
  inactive: { label: 'غیرفعال', color: 'bg-red-100 text-red-600', icon: <XCircle size={12} /> },
};

interface SellerStory {
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
const STORY_TEXT_SIZES  = [{ label: 'S', value: 13 }, { label: 'M', value: 17 }, { label: 'L', value: 22 }];

export default function MyShopPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  // ── Story state ──
  const [stories, setStories] = useState<SellerStory[]>([]);
  const [storyDraft, setStoryDraft] = useState<{
    file: File; previewUrl: string; text: string; textColor: string; textSize: number;
  } | null>(null);
  const [uploadingStory, setUploadingStory] = useState(false);
  const storyFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    api.get('/products/my-products').then(res => {
      setProducts(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/sellers/${user.id}/stories`)
      .then(r => r.json())
      .then(data => setStories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئنی؟')) return;
    setDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleStoryFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setStoryDraft({ file, previewUrl, text: '', textColor: '#ffffff', textSize: 17 });
    e.target.value = '';
  }, []);

  const uploadStory = async () => {
    if (!storyDraft || !user) return;
    setUploadingStory(true);
    try {
      const path = `sellers/${user.id}/stories/${Date.now()}-${storyDraft.file.name}`;
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
      await fetch(`/api/sellers/${user.id}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story),
      });
      setStories(prev => [...prev, story]);
      URL.revokeObjectURL(storyDraft.previewUrl);
      setStoryDraft(null);
    } catch {
      alert('خطا در آپلود استوری. لطفاً دوباره تلاش کنید.');
    } finally {
      setUploadingStory(false);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!user) return;
    await fetch(`/api/sellers/${user.id}/stories?storyId=${storyId}`, { method: 'DELETE' });
    setStories(prev => prev.filter(s => s.id !== storyId));
  };

  const storyTimeLeft = (expiresAt: string) => {
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'منقضی';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h} ساعت دیگر` : `${m} دقیقه دیگر`;
  };

  const filtered = activeTab === 'all' ? products :
    activeTab === 'pending' ? products.filter(p => p.requestedVerification && !p.isVerified) :
    products.filter(p => p.status === activeTab);

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    sold: products.filter(p => p.status === 'sold').length,
    pending: products.filter(p => p.requestedVerification && !p.isVerified).length,
    totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0),
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">فروشگاه من</h1>
        <Link href="/shop/new"
          className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-green-800 flex items-center gap-2 font-medium">
          <Plus size={16} />
          محصول جدید
        </Link>
      </div>

      {/* ── بخش استوری‌ها ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
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
            onClick={() => storyFileRef.current?.click()}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors">
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
                  ? <video src={storyDraft.previewUrl} muted autoPlay loop playsInline style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                  : <img src={storyDraft.previewUrl} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />}
                {storyDraft.text && (
                  <div style={{
                    position:'absolute', bottom:16, left:8, right:8, textAlign:'center',
                    color: storyDraft.textColor, fontSize: storyDraft.textSize,
                    fontWeight:700, textShadow:'0 1px 8px rgba(0,0,0,0.7)', lineHeight:1.4,
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
                        <button key={c} onClick={() => setStoryDraft(d => d ? { ...d, textColor: c } : d)}
                          style={{ background: c, width:24, height:24, borderRadius:'50%',
                            border: storyDraft.textColor === c ? '2px solid #f59e0b' : '2px solid #d1d5db',
                            boxShadow: storyDraft.textColor === c ? '0 0 0 2px #f59e0b40' : 'none' }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">اندازه</label>
                    <div className="flex gap-1.5">
                      {STORY_TEXT_SIZES.map(s => (
                        <button key={s.value} onClick={() => setStoryDraft(d => d ? { ...d, textSize: s.value } : d)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                            storyDraft.textSize === s.value ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={uploadStory} disabled={uploadingStory}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                    {uploadingStory ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
                    {uploadingStory ? 'در حال آپلود...' : 'اشتراک‌گذاری'}
                  </button>
                  <button onClick={() => { URL.revokeObjectURL(storyDraft.previewUrl); setStoryDraft(null); }}
                    className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl transition-colors">
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
                      ? <video src={story.mediaUrl} muted loop playsInline style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                      : <img src={story.mediaUrl} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />}
                    {/* Amber ring (active) */}
                    <div className="absolute inset-0 rounded-xl" style={{ border:'2px solid #f59e0b' }} />
                    <button
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

      {/* آمار */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'کل محصولات', value: stats.total, color: 'text-gray-800', bg: 'bg-white' },
          { label: 'محصولات فعال', value: stats.active, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'فروخته شده', value: stats.sold, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'کل بازدید', value: stats.totalViews, color: 'text-purple-700', bg: 'bg-purple-50' },
        ].map((item, i) => (
          <div key={i} className={`${item.bg} rounded-2xl p-4 shadow-sm text-center border border-gray-100`}>
            <div className={`text-3xl font-black ${item.color}`}>
              {item.value.toLocaleString('fa-IR')}
            </div>
            <div className="text-sm text-gray-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* تب‌ها */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {[
            { id: 'all', label: 'همه', count: stats.total },
            { id: 'active', label: 'فعال', count: stats.active },
            { id: 'sold', label: 'فروخته شده', count: stats.sold },
            { id: 'pending', label: 'در انتظار تأیید', count: stats.pending },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium flex-shrink-0 border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {tab.count.toLocaleString('fa-IR')}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-center py-16 text-gray-400">در حال بارگذاری...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">
                {activeTab === 'all' ? 'هنوز محصولی ثبت نکردی' : 'محصولی در این دسته نیست'}
              </p>
              {activeTab === 'all' && (
                <Link href="/shop/new" className="bg-green-700 text-white px-6 py-2.5 rounded-xl hover:bg-green-800 text-sm">
                  ثبت اولین محصول
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(product => (
                <div key={product.id} className="flex items-center gap-4 border border-gray-100 rounded-2xl p-4 hover:border-green-200 transition-colors">
                  {/* عکس */}
                  <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.images?.length > 0 ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={28} className="text-gray-300" />
                    )}
                  </div>

                  {/* اطلاعات */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800 text-sm truncate">{product.title}</h3>
                      {product.isVerified && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                          <CheckCircle size={10} />
                          تأیید شده
                        </span>
                      )}
                      {product.requestedVerification && !product.isVerified && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                          <Clock size={10} />
                          در انتظار تأیید
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                      <span>{categoryLabels[product.category]}</span>
                      <span>•</span>
                      <span>{conditionLabels[product.condition]}</span>
                      <span>•</span>
                      <span>{product.city}</span>
                      <span>•</span>
                      <span>{(product.views || 0).toLocaleString('fa-IR')} بازدید</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {product.discountPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 line-through">{product.price.toLocaleString('fa-IR')}</span>
                          <span className="font-bold text-green-700 text-sm">{product.discountPrice.toLocaleString('fa-IR')} تومان</span>
                          <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded">{product.discountPercent}٪</span>
                        </div>
                      ) : (
                        <span className="font-bold text-green-700 text-sm">{product.price.toLocaleString('fa-IR')} تومان</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${statusLabels[product.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[product.status]?.icon}
                        {statusLabels[product.status]?.label || product.status}
                      </span>
                    </div>
                  </div>

                  {/* دکمه‌ها */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/shop/${product.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="مشاهده">
                      <Eye size={18} />
                    </Link>
                    <Link href={`/shop/edit/${product.id}`}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors" title="ویرایش">
                      <Edit size={18} />
                    </Link>
                    <button onClick={() => handleDelete(product.id)} disabled={deleting === product.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50" title="حذف">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}