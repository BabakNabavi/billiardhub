'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { uploadFile } from '../../../lib/supabase';
import ProvinceCitySelect from '../../../components/ProvinceCitySelect';
import { useAuthStore } from '../../../store/auth.store';
import { persianToSlug, isValidSlug } from '../../../lib/slug';

// استان/شهر از ProvinceCitySelect می‌آید — لیست هاردکد حذف شد (single source of truth)

export default function NewClubPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Slug state
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Media
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // License document
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    managerName: '',
    description: '',
    province: '',
    city: '',
    address: '',
    country: 'Iran',
    bankCard: '',
    bankCardOwner: '',
    bankName: '',
    latitude: '',
    longitude: '',
    phone: '',
    website: '',
    timezone: 'Asia/Tehran',
    snookerTables: 0,
    pocketTables: 0,
    highballTables: 0,
    vipSnookerTables: 0,
    vipPocketTables: 0,
    airHockeyTables: 0,
    dartBoards: 0,
    playstations: 0,
    hasCafe: false,
    hasParking: false,
    hasWifi: false,
    hasProfessionalCoach: false,
    specialFeatures: '',
    workingHours: {
      saturday:  { open: '09:00', close: '23:00', isOpen: true },
      sunday:    { open: '09:00', close: '23:00', isOpen: true },
      monday:    { open: '09:00', close: '23:00', isOpen: true },
      tuesday:   { open: '09:00', close: '23:00', isOpen: true },
      wednesday: { open: '09:00', close: '23:00', isOpen: true },
      thursday:  { open: '09:00', close: '23:00', isOpen: true },
      friday:    { open: '09:00', close: '23:00', isOpen: true },
    },
  });

  const days = [
    { key: 'saturday',  label: 'شنبه'    },
    { key: 'sunday',    label: 'یکشنبه'  },
    { key: 'monday',    label: 'دوشنبه'  },
    { key: 'tuesday',   label: 'سه‌شنبه' },
    { key: 'wednesday', label: 'چهارشنبه'},
    { key: 'thursday',  label: 'پنجشنبه' },
    { key: 'friday',    label: 'جمعه'    },
  ];

  const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  // Auto-generate slug from name (only when user hasn't manually edited)
  useEffect(() => {
    if (!slugEdited && form.name) {
      setSlug(persianToSlug(form.name));
    }
  }, [form.name, slugEdited]);

  // Debounced slug availability check
  useEffect(() => {
    if (!slug) { setSlugStatus('idle'); return; }
    if (!isValidSlug(slug)) { setSlugStatus('invalid'); return; }
    setSlugStatus('checking');
    if (slugTimer.current) clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/clubs/slug-check?slug=${encodeURIComponent(slug)}`);
        const d = await r.json();
        setSlugStatus(d.available ? 'ok' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 500);
    return () => { if (slugTimer.current) clearTimeout(slugTimer.current); };
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      set(name, (e.target as HTMLInputElement).checked);
    } else {
      set(name, value);
    }
  };

  const handleWorkingHours = (day: string, field: string, value: any) => {
    setForm(f => ({
      ...f,
      workingHours: {
        ...f.workingHours,
        [day]: { ...(f.workingHours as any)[day], [field]: value },
      },
    }));
  };

  const getLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        set('latitude', pos.coords.latitude.toString());
        set('longitude', pos.coords.longitude.toString());
        setLocationLoading(false);
      },
      () => { setError('دسترسی به موقعیت مکانی رد شد'); setLocationLoading(false); }
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 10) { setError('حداکثر ۱۰ عکس مجاز است'); return; }
    setImageFiles(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleLicenseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('حجم مدرک نباید بیشتر از ۱۰ مگابایت باشد'); return; }
    setLicenseFile(file);
    if (file.type.startsWith('image/')) {
      setLicensePreview(URL.createObjectURL(file));
    } else {
      setLicensePreview(null);
    }
  };

  const removeImage = (i: number) => {
    setImageFiles(f => f.filter((_, idx) => idx !== i));
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!user) { router.push('/login'); return; }
    if (!form.name.trim()) { setError('نام باشگاه الزامی است'); return; }
    if (!form.province) { setError('لطفاً استان را انتخاب کنید'); return; }
    if (!form.city.trim()) { setError('شهر الزامی است'); return; }
    if (!form.address.trim()) { setError('آدرس الزامی است'); return; }
    // موقعیت مکانی اختیاری است
    setLoading(true);
    setError('');

    try {
      const clubId = `${Date.now()}`;
      const imageUrls: string[] = [];
      let videoUrl = '';
      let licenseDocumentUrl = '';

      if (imageFiles.length > 0) {
        setUploadProgress('در حال آپلود عکس‌ها...');
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          if (!file) continue;
          const url = await uploadFile('club-media', file, `clubs/${clubId}/images/${i}-${file.name}`);
          if (url) imageUrls.push(url);
        }
      }

      if (videoFile) {
        setUploadProgress('در حال آپلود ویدیو...');
        const url = await uploadFile('club-media', videoFile, `clubs/${clubId}/videos/${videoFile.name}`);
        if (url) videoUrl = url;
      }

      if (licenseFile) {
        setUploadProgress('در حال آپلود مدرک جواز کسب...');
        const url = await uploadFile('club-media', licenseFile, `clubs/${clubId}/license/${licenseFile.name}`);
        if (url) licenseDocumentUrl = url;
      }

      setUploadProgress('در حال ثبت اطلاعات...');

      await api.post('/clubs', {
        ...form,
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        images: imageUrls,
        videos: videoUrl ? [videoUrl] : [],
        licenseDocumentUrl: licenseDocumentUrl || undefined,
        slug: (slug && slugStatus === 'ok') ? slug : undefined,
      });

      router.push('/dashboard/club');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت باشگاه');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors';
  const inputStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: '#111111' };
  const sectionStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '24px', marginBottom: '20px' };
  const labelCls = 'block text-xs font-medium mb-1 text-emerald-400/70';
  const headingStyle: React.CSSProperties = { fontSize: '17px', fontWeight: 800, color: '#C7A66A', marginBottom: '16px' };

  return (
    <>
      <style>{`
        .dark-input::placeholder { color: rgba(0,0,0,0.30); }
        .dark-input:focus { border-color: rgba(199,166,106,0.45) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.08); }
        .dark-file::file-selector-button {
          background: rgba(199,166,106,0.12); border: 1px solid rgba(199,166,106,0.25);
          color: #C7A66A; border-radius: 8px; padding: 4px 12px; font-size: 12px;
          cursor: pointer; margin-left: 8px; font-family: inherit;
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px clamp(16px,4vw,32px) 0' }}>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(199,166,106,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '6px' }}>REGISTER CLUB</div>
            <h1 style={{ fontSize: 'clamp(24px,4.4vw,35px)', fontWeight: 900, color: '#111111', margin: 0, letterSpacing: '-0.02em' }}>ثبت باشگاه جدید</h1>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* اطلاعات پایه */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>📋 اطلاعات پایه</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>نام باشگاه *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  className={`${inputCls} dark-input`} style={inputStyle} placeholder="نام باشگاه" />
              </div>
              <div>
                <label className={labelCls}>نام مدیر باشگاه</label>
                <input type="text" name="managerName" value={form.managerName} onChange={handleChange}
                  className={`${inputCls} dark-input`} style={inputStyle} placeholder="نام و نام خانوادگی" />
              </div>
            </div>
            <div className="mb-4">
              <label className={labelCls}>توضیحات</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                className={`${inputCls} dark-input`} style={inputStyle}
                rows={3} placeholder="معرفی باشگاه..." />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>تلفن</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                  className={`${inputCls} dark-input`} style={inputStyle} placeholder="02112345678" />
              </div>
              <div>
                <label className={labelCls}>وبسایت</label>
                <input type="url" name="website" value={form.website} onChange={handleChange}
                  className={`${inputCls} dark-input`} style={inputStyle} placeholder="https://..." />
              </div>
            </div>

            {/* Slug — آدرس اختصاصی */}
            <div>
              <label className={labelCls}>آدرس اختصاصی باشگاه (slug)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', whiteSpace: 'nowrap', flexShrink: 0, direction: 'ltr' }}>billiardhub.net/clubs/</span>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => {
                      setSlugEdited(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    }}
                    className={`${inputCls} dark-input`}
                    style={{
                      ...inputStyle, direction: 'ltr',
                      borderColor: slugStatus === 'ok' ? 'rgba(48,197,90,0.45)'
                        : slugStatus === 'taken' || slugStatus === 'invalid' ? 'rgba(239,68,68,0.45)'
                        : undefined,
                    }}
                    placeholder="hafez-shiraz"
                  />
                </div>
                {slug && slugEdited && (
                  <button type="button" onClick={() => { setSlug(persianToSlug(form.name)); setSlugEdited(false); }}
                    style={{ fontSize: 12, color: '#A07840', background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.28)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>
                    بازنشانی
                  </button>
                )}
              </div>
              <div style={{ marginTop: 5, fontSize: 12, height: 16 }}>
                {slugStatus === 'checking' && <span style={{ color: 'rgba(0,0,0,0.40)' }}>در حال بررسی...</span>}
                {slugStatus === 'ok'       && <span style={{ color: '#30C55A' }}>✓ این آدرس در دسترس است</span>}
                {slugStatus === 'taken'    && <span style={{ color: '#ef4444' }}>✗ این آدرس قبلاً رزرو شده</span>}
                {slugStatus === 'invalid'  && <span style={{ color: '#ef4444' }}>فقط حروف انگلیسی کوچک، اعداد و خط تیره مجاز است</span>}
                {slugStatus === 'idle' && slug && <span style={{ color: 'rgba(0,0,0,0.35)' }}>حروف انگلیسی، اعداد و خط تیره — مثلاً: hafez-shiraz</span>}
              </div>
            </div>
          </div>

          {/* آدرس - Province → City → Address */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>📍 آدرس باشگاه</h2>

            {/* استان + شهر */}
            <div className="mb-4">
              <ProvinceCitySelect
                theme="dark"
                value={{ province: form.province, city: form.city }}
                onChange={v => setForm(prev => ({ ...prev, province: v.province, city: v.city }))}
                required
              />
            </div>

            {/* ردیف ۳: آدرس کامل */}
            <div className="mb-4">
              <label className={labelCls}>آدرس کامل *</label>
              <textarea name="address" value={form.address} onChange={handleChange}
                className={`${inputCls} dark-input`} style={{ ...inputStyle, resize: 'none' }}
                rows={2} placeholder="خیابان، کوچه، پلاک..." />
            </div>

            {/* موقعیت مکانی */}
            <div>
              <label className={labelCls} style={{ display: 'block', marginBottom: '8px' }}>موقعیت مکانی *</label>
              <button type="button" onClick={getLocation} disabled={locationLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(59,130,246,0.10)',
                  border: '1px solid rgba(59,130,246,0.30)',
                  color: '#2563eb', padding: '9px 18px', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 600,
                  cursor: locationLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: locationLoading ? 0.5 : 1,
                  boxShadow: 'inset 0 1px 0 rgba(59,130,246,0.12)',
                  transition: 'all 0.2s',
                }}>
                {locationLoading ? 'در حال دریافت...' : '📍 دریافت موقعیت فعلی'}
              </button>
              {form.latitude && form.longitude && (
                <p style={{ fontSize: '13px', color: '#16a34a', marginTop: '8px' }}>
                  ✅ موقعیت ثبت شد: {parseFloat(form.latitude).toFixed(4)}، {parseFloat(form.longitude).toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* جواز کسب — مدرک رسمی */}
          <div style={{ ...sectionStyle, border: '1px solid rgba(199,166,106,0.35)', background: 'rgba(199,166,106,0.04)' }}>
            <h2 style={headingStyle}>📄 جواز کسب / مدرک رسمی</h2>
            <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#1e40af', lineHeight: 1.7 }}>
              برای دریافت <strong>تیک تأیید رسمی</strong> در پروفایل باشگاه، یک تصویر یا فایل از جواز کسب، کارت شناسایی صاحب امتیاز یا سایر مدارک رسمی آپلود کنید.
              پس از بررسی توسط ادمین سیستم، تیک آبی تأیید شده به باشگاه شما اعطا خواهد شد.
            </div>

            <label className={labelCls}>آپلود مدرک (JPG، PNG، PDF — حداکثر ۱۰ مگابایت)</label>
            <input type="file" accept="image/*,.pdf" onChange={handleLicenseSelect}
              className="dark-file w-full text-sm mb-3" style={{ color: 'rgba(0,0,0,0.45)' }} />

            {licenseFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '10px 14px' }}>
                {licensePreview ? (
                  <img src={licensePreview} alt="preview" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(199,166,106,0.12)', borderRadius: 8, fontSize: 28, flexShrink: 0 }}>📄</div>
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{licenseFile.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{(licenseFile.size / 1024).toFixed(0)} KB</div>
                </div>
                <button onClick={() => { setLicenseFile(null); setLicensePreview(null); }}
                  style={{
                    marginRight: 'auto',
                    background: 'rgba(239,68,68,0.09)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#dc2626', borderRadius: 8, padding: '5px 14px',
                    fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: 'inset 0 1px 0 rgba(239,68,68,0.10)',
                    transition: 'all 0.2s',
                  }}>
                  حذف
                </button>
              </div>
            )}

            {!licenseFile && (
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                بدون آپلود مدرک، باشگاه شما تیک تأیید رسمی دریافت نخواهد کرد.
              </p>
            )}
          </div>

          {/* تعداد میزها */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>🎱 تعداد میزها</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'snookerTables',    label: 'میز اسنوکر'       },
                { key: 'pocketTables',     label: 'میز پاکت بیلیارد' },
                { key: 'highballTables',   label: 'میز هی‌بال'       },
                { key: 'vipSnookerTables', label: 'VIP اسنوکر'       },
                { key: 'vipPocketTables',  label: 'VIP پاکت'         },
                { key: 'airHockeyTables',  label: 'ایرهاکی'          },
                { key: 'dartBoards',       label: 'دارت'             },
                { key: 'playstations',     label: 'پلی‌استیشن'       },
              ].map(item => (
                <div key={item.key}>
                  <label className={labelCls}>{item.label}</label>
                  <input type="number" min="0"
                    value={(form as any)[item.key]}
                    onChange={e => set(item.key, parseInt(e.target.value) || 0)}
                    className={`${inputCls} dark-input`} style={inputStyle} />
                </div>
              ))}
            </div>
          </div>

          {/* امکانات رفاهی */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>✨ امکانات رفاهی</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'hasCafe',             label: 'کافه'          },
                { key: 'hasParking',          label: 'پارکینگ'       },
                { key: 'hasWifi',             label: 'WiFi'          },
                { key: 'hasProfessionalCoach',label: 'مربی حرفه‌ای'  },
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" name={item.key}
                    checked={(form as any)[item.key]}
                    onChange={handleChange}
                    style={{ width: '16px', height: '16px', accentColor: '#C7A66A' }} />
                  <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.55)' }}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* امکانات ویژه */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>⭐ امکانات ویژه</h2>
            <textarea name="specialFeatures" value={form.specialFeatures} onChange={handleChange}
              className={`${inputCls} dark-input`} style={inputStyle}
              rows={3} placeholder="هر امکانات ویژه‌ای که باشگاه دارد را اینجا بنویسید..." />
          </div>

          {/* ساعات کاری */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>🕐 ساعات کاری</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {days.map(day => (
                <div key={day.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '64px', fontSize: '14px', color: 'rgba(0,0,0,0.45)', fontWeight: 600, flexShrink: 0 }}>{day.label}</div>
                  <input type="checkbox"
                    checked={(form.workingHours as any)[day.key].isOpen}
                    onChange={e => handleWorkingHours(day.key, 'isOpen', e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#C7A66A', flexShrink: 0 }} />
                  {(form.workingHours as any)[day.key].isOpen ? (
                    <>
                      <input type="time"
                        value={(form.workingHours as any)[day.key].open}
                        onChange={e => handleWorkingHours(day.key, 'open', e.target.value)}
                        className="dark-input"
                        style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: '#111111', borderRadius: '8px', padding: '4px 8px', fontSize: '14px' }} />
                      <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.35)' }}>تا</span>
                      <input type="time"
                        value={(form.workingHours as any)[day.key].close}
                        onChange={e => handleWorkingHours(day.key, 'close', e.target.value)}
                        className="dark-input"
                        style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: '#111111', borderRadius: '8px', padding: '4px 8px', fontSize: '14px' }} />
                    </>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#ef4444' }}>تعطیل</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* آپلود عکس */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>📸 عکس‌های باشگاه</h2>
            <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.40)', marginBottom: '12px' }}>حداکثر ۱۰ عکس — فرمت JPG، PNG</p>
            <input type="file" accept="image/*" multiple onChange={handleImageSelect}
              className="dark-file w-full text-sm" style={{ color: 'rgba(0,0,0,0.45)' }} />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }} />
                    <button onClick={() => removeImage(i)}
                      style={{
                        position: 'absolute', top: 4, left: 4,
                        background: 'rgba(239,68,68,0.82)',
                        border: '1px solid rgba(239,68,68,0.40)',
                        color: '#fff', borderRadius: '50%',
                        width: 22, height: 22, padding: 0,
                        fontSize: 15, lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20)',
                      }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* آپلود ویدیو */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>🎬 ویدیوی باشگاه</h2>
            <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.40)', marginBottom: '12px' }}>یک ویدیوی معرفی — حداکثر ۱۰۰ مگابایت</p>
            <input type="file" accept="video/mp4,video/*" onChange={e => setVideoFile(e.target.files?.[0] ?? null)}
              className="dark-file w-full text-sm" style={{ color: 'rgba(0,0,0,0.45)' }} />
            {videoFile && (
              <p style={{ fontSize: '13px', color: '#16a34a', marginTop: '8px' }}>✅ {videoFile.name} انتخاب شد</p>
            )}
          </div>

          {/* اطلاعات بانکی — تسویه حساب */}
          <div style={{ ...sectionStyle, border: '1px solid rgba(59,130,246,0.28)', background: 'rgba(59,130,246,0.03)' }}>
            <h2 style={headingStyle}>💳 اطلاعات بانکی — تسویه حساب</h2>
            <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', fontSize: '13px', color: '#1e40af', lineHeight: 1.7 }}>
              کاربران از طریق <strong>درگاه بانکی امن</strong> پرداخت می‌کنند. درآمد رزروها پس از کسر کارمزد سیستم، در دوره‌های تسویه به حساب بانکی شما واریز می‌شود. شماره کارت یا شبای خود را وارد کنید.
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelCls}>شماره کارت</label>
                <input
                  type="text"
                  name="bankCard"
                  value={form.bankCard}
                  maxLength={19}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                    const formatted = digits.replace(/(.{4})/g, '$1-').replace(/-$/, '');
                    set('bankCard', formatted);
                  }}
                  className={`${inputCls} dark-input`}
                  style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.08em', fontSize: 16 }}
                  placeholder="1234-5678-9012-3456"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>نام صاحب حساب *</label>
                  <input type="text" name="bankCardOwner" value={form.bankCardOwner} onChange={handleChange}
                    className={`${inputCls} dark-input`} style={inputStyle} placeholder="نام و نام خانوادگی" />
                </div>
                <div>
                  <label className={labelCls}>نام بانک</label>
                  <input type="text" name="bankName" value={form.bankName} onChange={handleChange}
                    className={`${inputCls} dark-input`} style={inputStyle} placeholder="مثلاً ملی، صادرات..." />
                </div>
              </div>
            </div>
            {!form.bankCard && (
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>
                می‌توانید اطلاعات بانکی را بعداً از داشبورد باشگاه تکمیل کنید.
              </p>
            )}
          </div>

          {uploadProgress && (
            <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.20)', color: '#1d4ed8', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
              {uploadProgress}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px',
              fontSize: '17px', fontWeight: 800,
              border: '1px solid rgba(199,166,106,0.55)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.25s',
              backdropFilter: 'blur(40px) saturate(240%)',
              WebkitBackdropFilter: 'blur(40px) saturate(240%)',
              background: loading
                ? 'rgba(199,166,106,0.12)'
                : 'linear-gradient(135deg, rgba(199,166,106,0.90) 0%, rgba(151,111,51,0.96) 100%)',
              color: loading ? 'rgba(199,166,106,0.50)' : '#fff',
              boxShadow: loading
                ? 'none'
                : 'inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 32px rgba(199,166,106,0.32)',
            }}>
            {loading ? (uploadProgress || 'در حال ثبت...') : '✅ ثبت باشگاه'}
          </button>
        </div>
      </div>
    </>
  );
}
