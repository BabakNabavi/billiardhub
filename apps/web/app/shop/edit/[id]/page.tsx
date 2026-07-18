'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../store/auth.store';
import { uploadFile } from '../../../../lib/supabase';
import { Package, X, Upload, Info, Plus, ChevronDown, Check } from 'lucide-react';
import api from '../../../../lib/api';
import ProvinceCitySelect from '../../../../components/ProvinceCitySelect';
import { provinceOfCity } from '../../../../lib/iran-geo';

function CustomSelect({ options, value, onChange, placeholder = 'انتخاب کنید' }: {
  options: { value: string; label: string; icon?: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-sm bg-white transition-all ${open ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200 hover:border-green-400'}`}>
        <span className={selected ? 'text-gray-800 flex items-center gap-2' : 'text-gray-400'}>
          {selected ? <>{selected.icon && <span>{selected.icon}</span>}{selected.label}</> : placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map(o => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-green-50 transition-colors ${value === o.value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
                <span className="flex items-center gap-2">{o.icon && <span>{o.icon}</span>}{o.label}</span>
                {value === o.value && <Check size={16} className="text-green-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const categories = [
  { value: 'table', label: 'میز بیلیارد', icon: '🎱' },
  { value: 'cue', label: 'چوب بیلیارد', icon: '🪄' },
  { value: 'ball', label: 'توپ', icon: '⚪' },
  { value: 'accessory', label: 'لوازم جانبی', icon: '🔧' },
  { value: 'clothing', label: 'پوشاک', icon: '👕' },
  { value: 'educational', label: 'آموزشی', icon: '📚' },
  { value: 'other', label: 'سایر', icon: '📦' },
];

const conditions = [
  { value: 'new', label: 'نو', icon: '✨' },
  { value: 'like_new', label: 'در حد نو', icon: '👍' },
  { value: 'used', label: 'کارکرده', icon: '🔄' },
];

// شهر/استان از ProvinceCitySelect می‌آید — لیست هاردکد حذف شد (single source of truth)

function numberToFarsiWords(num: number): string {
  if (!num || num === 0) return '';
  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه',
    'ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const convert = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n] ?? '';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' و ' + ones[n % 10] : '');
    return hundreds[Math.floor(n / 100)] + (n % 100 ? ' و ' + convert(n % 100) : '');
  };
  if (num >= 1000000000) return convert(Math.floor(num / 1000000000)) + ' میلیارد' + (num % 1000000000 ? ' و ' + numberToFarsiWords(num % 1000000000) : '');
  if (num >= 1000000) return convert(Math.floor(num / 1000000)) + ' میلیون' + (num % 1000000 ? ' و ' + numberToFarsiWords(num % 1000000) : '');
  if (num >= 1000) return convert(Math.floor(num / 1000)) + ' هزار' + (num % 1000 ? ' و ' + numberToFarsiWords(num % 1000) : '');
  return convert(num);
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '', description: '', brand: '', model: '',
    price: '', discountPrice: '', category: 'table', condition: 'new',
    province: '', city: '', stock: '1', color: '', keywords: '',
    specs: [{ label: '', value: '' }],
  });

  const toFa = (v: string) => v.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)] ?? d);
  const toEn = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

  const formatNumber = (v: string) => {
    if (!v) return '';
    return toFa(parseInt(v).toLocaleString('en-US'));
  };

  const handleNumInput = (name: string, v: string) => {
    const english = toEn(v).replace(/[^0-9]/g, '');
    setForm(f => ({ ...f, [name]: english }));
  };

  useEffect(() => {
    if (!user) return;
    api.get(`/products/${id}`).then(res => {
      const p = res.data;
      setForm({
        title: p.title || '',
        description: p.description || '',
        brand: p.brand || '',
        model: p.model || '',
        price: String(p.price || ''),
        discountPrice: String(p.discountPrice || ''),
        category: p.category || 'table',
        condition: p.condition || 'new',
        province: p.province || provinceOfCity(p.city || ''),   // بک‌فیلِ استان از روی شهر برای محصولات قدیمی
        city: p.city || '',
        stock: String(p.stock || '1'),
        color: p.color || '',
        keywords: p.keywords || '',
        specs: p.specs?.length > 0 ? p.specs : [{ label: '', value: '' }],
      });
      setExistingImages(p.images || []);
      setPageLoading(false);
    }).catch(() => { setError('محصول پیدا نشد'); setPageLoading(false); });
  }, [id, user]);

  const set = (name: string, value: any) => setForm(f => ({ ...f, [name]: value }));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = existingImages.length + newImageFiles.length + files.length;
    if (total > 8) { setError('حداکثر ۸ عکس مجاز است'); return; }
    setNewImageFiles(p => [...p, ...files]);
    setNewImagePreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeExistingImage = (i: number) => setExistingImages(p => p.filter((_, j) => j !== i));
  const removeNewImage = (i: number) => {
    setNewImageFiles(p => p.filter((_, j) => j !== i));
    setNewImagePreviews(p => p.filter((_, j) => j !== i));
  };

  const updateSpec = (i: number, f: 'label' | 'value', v: string) => {
    const s = [...form.specs];
    if (s[i]) s[i]![f] = v;
    set('specs', s);
  };

  const calcDiscount = () => {
    if (!form.price || !form.discountPrice) return 0;
    const p = parseInt(form.price), d = parseInt(form.discountPrice);
    if (p <= 0 || d >= p) return 0;
    return Math.round((1 - d / p) * 100);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.price || !form.city) { setError('لطفاً فیلدهای اجباری را پر کنید'); return; }
    setLoading(true); setError('');
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i];
        if (!file) continue;
        const url = await uploadFile('club-media', file, `products/${Date.now()}-${i}-${file.name}`);
        if (url) newUrls.push(url);
      }
      await api.put(`/products/${id}`, {
        ...form,
        price: parseInt(form.price),
        discountPrice: form.discountPrice ? parseInt(form.discountPrice) : null,
        discountPercent: calcDiscount(),
        stock: parseInt(form.stock),
        images: [...existingImages, ...newUrls],
        specs: form.specs.filter(s => s.label && s.value),
      });
      router.push('/dashboard/shop');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ویرایش محصول');
    } finally { setLoading(false); }
  };

  if (pageLoading) return <div className="text-center py-20 text-gray-400">در حال بارگذاری...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">ویرایش محصول</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>}

      <div className="space-y-5">
        {/* اطلاعات اصلی */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-600 rounded-full"></span>اطلاعات اصلی
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان محصول *</label>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
              <CustomSelect options={categories} value={form.category} onChange={v => set('category', v)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت کالا</label>
              <CustomSelect options={conditions} value={form.condition} onChange={v => set('condition', v)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">برند</label>
              <input type="text" value={form.brand} onChange={e => set('brand', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مدل</label>
              <input type="text" value={form.model} onChange={e => set('model', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رنگ</label>
              <input type="text" value={form.color} onChange={e => set('color', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <ProvinceCitySelect
                value={{ province: form.province, city: form.city }}
                onChange={v => setForm(f => ({ ...f, province: v.province, city: v.city }))}
                required
              />
            </div>
          </div>
        </div>

        {/* قیمت */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-600 rounded-full"></span>قیمت‌گذاری
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">قیمت اصلی (تومان) *</label>
              <input type="text" inputMode="numeric" value={formatNumber(form.price)}
                onChange={e => handleNumInput('price', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="۵،۰۰۰،۰۰۰" />
              {form.price && parseInt(form.price) > 0 && (
                <div className="text-xs text-green-700 mt-1 px-1">{numberToFarsiWords(parseInt(form.price))} تومان</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">قیمت با تخفیف</label>
              <input type="text" inputMode="numeric" value={formatNumber(form.discountPrice)}
                onChange={e => handleNumInput('discountPrice', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="۴،۵۰۰،۰۰۰" />
              {form.discountPrice && parseInt(form.discountPrice) > 0 && (
                <div className="text-xs text-red-600 mt-1 px-1">{numberToFarsiWords(parseInt(form.discountPrice))} تومان</div>
              )}
            </div>
          </div>
          {calcDiscount() > 0 && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl flex items-center gap-2">
              <Info size={14} /> تخفیف: {calcDiscount().toLocaleString('fa-IR')}٪
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تعداد موجودی</label>
            <input type="text" inputMode="numeric" value={toFa(form.stock)}
              onChange={e => handleNumInput('stock', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        {/* مشخصات فنی */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1 h-5 bg-green-600 rounded-full"></span>مشخصات فنی
            </h2>
            <button onClick={() => set('specs', [...form.specs, { label: '', value: '' }])}
              className="text-green-700 text-sm border border-green-300 px-3 py-1 rounded-lg hover:bg-green-50 flex items-center gap-1">
              <Plus size={13} /> افزودن
            </button>
          </div>
          <div className="space-y-2">
            {form.specs.map((spec, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={spec.label} onChange={e => updateSpec(i, 'label', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="مثال: ابعاد" />
                <input type="text" value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="مثال: ۳۶۵ × ۱۸۵" />
                {form.specs.length > 1 && (
                  <button onClick={() => set('specs', form.specs.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* عکس‌ها */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-600 rounded-full"></span>عکس‌های محصول
          </h2>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {existingImages.map((src, i) => (
              <div key={`ex-${i}`} className="relative aspect-square">
                <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                {i === 0 && <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">اصلی</div>}
                <button onClick={() => removeExistingImage(i)} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  <X size={12} />
                </button>
              </div>
            ))}
            {newImagePreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative aspect-square">
                <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">جدید</div>
                <button onClick={() => removeNewImage(i)} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  <X size={12} />
                </button>
              </div>
            ))}
            {(existingImages.length + newImagePreviews.length) < 8 && (
              <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition-colors">
                <Upload size={24} className="text-gray-300 mb-1" />
                <span className="text-xs text-gray-400">افزودن عکس</span>
                <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* دکمه ذخیره */}
        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-green-700 text-white py-4 rounded-2xl text-lg font-bold hover:bg-green-800 disabled:opacity-50 transition-colors">
          {loading ? 'در حال ذخیره...' : '✅ ذخیره تغییرات'}
        </button>
      </div>
    </div>
  );
}