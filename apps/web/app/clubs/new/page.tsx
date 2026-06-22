'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { uploadFile } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/auth.store';

export default function NewClubPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '',
    managerName: '',
    description: '',
    address: '',
    city: '',
    country: 'Iran',
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
      saturday: { open: '09:00', close: '23:00', isOpen: true },
      sunday: { open: '09:00', close: '23:00', isOpen: true },
      monday: { open: '09:00', close: '23:00', isOpen: true },
      tuesday: { open: '09:00', close: '23:00', isOpen: true },
      wednesday: { open: '09:00', close: '23:00', isOpen: true },
      thursday: { open: '09:00', close: '23:00', isOpen: true },
      friday: { open: '09:00', close: '23:00', isOpen: true },
    },
  });

  const days = [
    { key: 'saturday', label: 'شنبه' },
    { key: 'sunday', label: 'یکشنبه' },
    { key: 'monday', label: 'دوشنبه' },
    { key: 'tuesday', label: 'سه‌شنبه' },
    { key: 'wednesday', label: 'چهارشنبه' },
    { key: 'thursday', label: 'پنجشنبه' },
    { key: 'friday', label: 'جمعه' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleNumberChange = (name: string, value: number) => {
    setForm({ ...form, [name]: value });
  };

  const handleWorkingHours = (day: string, field: string, value: any) => {
    setForm({
      ...form,
      workingHours: {
        ...form.workingHours,
        [day]: { ...(form.workingHours as any)[day], [field]: value },
      },
    });
  };

  const getLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          ...form,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        });
        setLocationLoading(false);
      },
      () => {
        setError('دسترسی به موقعیت مکانی رد شد');
        setLocationLoading(false);
      }
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 10) {
      setError('حداکثر ۱۰ عکس مجاز است');
      return;
    }
    setImageFiles(files);
    const previews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setError('حجم ویدیو نباید بیشتر از ۱۰۰ مگابایت باشد');
      return;
    }
    setVideoFile(file);
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) { router.push('/login'); return; }
    if (!form.latitude || !form.longitude) {
      setError('لطفاً موقعیت مکانی باشگاه را دریافت کنید');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const clubId = `${Date.now()}`;
      const imageUrls: string[] = [];
      let videoUrl = '';

      if (imageFiles.length > 0) {
        setUploadProgress('در حال آپلود عکس‌ها...');
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          if (!file) continue;
          const url = await uploadFile(
            'club-media',
            file,
            `clubs/${clubId}/images/${i}-${file.name}`
          );
          if (url) imageUrls.push(url);
        }
      }

      if (videoFile) {
        setUploadProgress('در حال آپلود ویدیو...');
        const url = await uploadFile(
          'club-media',
          videoFile,
          `clubs/${clubId}/videos/${videoFile.name}`
        );
        if (url) videoUrl = url;
      }

      setUploadProgress('در حال ثبت اطلاعات...');

      await api.post('/clubs', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        images: imageUrls,
        videos: videoUrl ? [videoUrl] : [],
      });

      router.push('/clubs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت باشگاه');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const inputCls =
    'w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors';
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f0faf5',
  };
  const sectionStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  };
  const labelCls = 'block text-xs font-medium mb-1 text-emerald-400/70';
  const headingStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 800,
    color: '#10b981',
    marginBottom: '16px',
  };

  return (
    <>
      <style>{`
        .dark-input::placeholder { color: rgba(240,250,245,0.25); }
        .dark-input:focus { border-color: rgba(16,185,129,0.45) !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.08); }
        .dark-input { color-scheme: dark; }
        .dark-file::file-selector-button {
          background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25);
          color: #10b981; border-radius: 8px; padding: 4px 12px; font-size: 12px;
          cursor: pointer; margin-left: 8px; font-family: inherit;
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#020806 0%,#060d0a 100%)', direction: 'rtl', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px clamp(16px,4vw,32px) 0' }}>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(16,185,129,0.6)', letterSpacing: '0.25em', fontWeight: 700, marginBottom: '6px' }}>REGISTER CLUB</div>
            <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, color: '#f0faf5', margin: 0, letterSpacing: '-0.02em' }}>ثبت باشگاه جدید</h1>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px' }}>
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
            <div className="mb-4">
              <label className={labelCls}>آدرس *</label>
              <input type="text" name="address" value={form.address} onChange={handleChange}
                className={`${inputCls} dark-input`} style={inputStyle} placeholder="آدرس کامل" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>شهر *</label>
                <input type="text" name="city" value={form.city} onChange={handleChange}
                  className={`${inputCls} dark-input`} style={inputStyle} placeholder="تهران" />
              </div>
              <div>
                <label className={labelCls}>کشور</label>
                <input type="text" name="country" value={form.country} onChange={handleChange}
                  className={`${inputCls} dark-input`} style={inputStyle} />
              </div>
            </div>
            <div className="mb-4">
              <label className={labelCls} style={{ display: 'block', marginBottom: '8px' }}>موقعیت مکانی *</label>
              <button type="button" onClick={getLocation} disabled={locationLoading}
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: locationLoading ? 0.5 : 1 }}>
                {locationLoading ? 'در حال دریافت...' : '📍 دریافت موقعیت فعلی'}
              </button>
              {form.latitude && form.longitude && (
                <p style={{ fontSize: '12px', color: '#6ee7b7', marginTop: '8px' }}>
                  ✅ موقعیت دریافت شد: {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* تعداد میزها */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>🎱 تعداد میزها</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'snookerTables', label: 'میز اسنوکر' },
                { key: 'pocketTables', label: 'میز پاکت بیلیارد' },
                { key: 'highballTables', label: 'میز هی‌بال' },
                { key: 'vipSnookerTables', label: 'میز VIP اسنوکر' },
                { key: 'vipPocketTables', label: 'میز VIP پاکت' },
                { key: 'airHockeyTables', label: 'ایرهاکی' },
                { key: 'dartBoards', label: 'دارت' },
                { key: 'playstations', label: 'پلی‌استیشن' },
              ].map((item) => (
                <div key={item.key}>
                  <label className={labelCls}>{item.label}</label>
                  <input type="number" min="0"
                    value={(form as any)[item.key]}
                    onChange={(e) => handleNumberChange(item.key, parseInt(e.target.value) || 0)}
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
                { key: 'hasCafe', label: 'کافه' },
                { key: 'hasParking', label: 'پارکینگ' },
                { key: 'hasWifi', label: 'WiFi' },
                { key: 'hasProfessionalCoach', label: 'مربی حرفه‌ای' },
              ].map((item) => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" name={item.key}
                    checked={(form as any)[item.key]}
                    onChange={handleChange}
                    style={{ width: '16px', height: '16px', accentColor: '#10b981' }} />
                  <span style={{ fontSize: '13px', color: 'rgba(240,250,245,0.7)' }}>{item.label}</span>
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
              {days.map((day) => (
                <div key={day.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '64px', fontSize: '13px', color: 'rgba(240,250,245,0.6)', fontWeight: 600, flexShrink: 0 }}>{day.label}</div>
                  <input type="checkbox"
                    checked={(form.workingHours as any)[day.key].isOpen}
                    onChange={(e) => handleWorkingHours(day.key, 'isOpen', e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#10b981', flexShrink: 0 }} />
                  {(form.workingHours as any)[day.key].isOpen ? (
                    <>
                      <input type="time"
                        value={(form.workingHours as any)[day.key].open}
                        onChange={(e) => handleWorkingHours(day.key, 'open', e.target.value)}
                        className="dark-input"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0faf5', borderRadius: '8px', padding: '4px 8px', fontSize: '13px' }} />
                      <span style={{ fontSize: '12px', color: 'rgba(240,250,245,0.35)' }}>تا</span>
                      <input type="time"
                        value={(form.workingHours as any)[day.key].close}
                        onChange={(e) => handleWorkingHours(day.key, 'close', e.target.value)}
                        className="dark-input"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0faf5', borderRadius: '8px', padding: '4px 8px', fontSize: '13px' }} />
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#fca5a5' }}>تعطیل</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* آپلود عکس */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>📸 عکس‌های باشگاه</h2>
            <p style={{ fontSize: '12px', color: 'rgba(240,250,245,0.35)', marginBottom: '12px' }}>حداکثر ۱۰ عکس — فرمت JPG، PNG</p>
            <input type="file" accept="image/*" multiple onChange={handleImageSelect}
              className="dark-file w-full text-sm" style={{ color: 'rgba(240,250,245,0.5)' }} />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} />
                    <button onClick={() => removeImage(i)}
                      style={{ position: 'absolute', top: '4px', left: '4px', background: 'rgba(239,68,68,0.8)', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
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
            <p style={{ fontSize: '12px', color: 'rgba(240,250,245,0.35)', marginBottom: '12px' }}>یک ویدیوی معرفی — حداکثر ۱۰۰ مگابایت — فرمت MP4</p>
            <input type="file" accept="video/mp4,video/*" onChange={handleVideoSelect}
              className="dark-file w-full text-sm" style={{ color: 'rgba(240,250,245,0.5)' }} />
            {videoFile && (
              <p style={{ fontSize: '12px', color: '#6ee7b7', marginTop: '8px' }}>✅ {videoFile.name} انتخاب شد</p>
            )}
          </div>

          {uploadProgress && (
            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }}>
              {uploadProgress}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', background: loading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', padding: '16px', borderRadius: '14px', fontSize: '16px', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 8px 24px rgba(16,185,129,0.25)' }}>
            {loading ? uploadProgress || 'در حال ثبت...' : '✅ ثبت باشگاه'}
          </button>
        </div>
      </div>
    </>
  );
}
