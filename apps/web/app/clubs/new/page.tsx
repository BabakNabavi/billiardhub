'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import api from '../../../lib/api';
import { uploadFile } from '../../../lib/supabase';
import ProvinceCitySelect from '../../../components/ProvinceCitySelect';
import { useAuthStore } from '../../../store/auth.store';
import { persianToSlug, isValidSlug } from '../../../lib/slug';
import WorkingHours, { DAYS, type Hours } from '../../../components/club/WorkingHours';
import BankCardVerify, { type BankResult } from '../../../components/club/BankCardVerify';

// استان/شهر از ProvinceCitySelect می‌آید — لیست هاردکد حذف شد (single source of truth)

/* شمارنده‌ی تعداد میز.

   پیش‌تر `type="number"` با مقدار عددی ۰ بود، پس هر فیلد یک «۰» توی
   خودش داشت که کاربر باید پاکش می‌کرد و اگر پاک می‌کرد NaN می‌شد.
   حالا خالی یعنی صفر و چیزی در فیلد نوشته نیست. */
function CountField({ label, value, onChange }: {
  label: string; value: number; onChange: (n: number) => void;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8A8474', marginBottom: 5 }}>{label}</label>
      <input
        type="text" inputMode="numeric"
        value={value ? String(value).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]!) : ''}
        onChange={e => {
          const d = e.target.value
            .replace(/[۰-۹]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)))
            .replace(/[^0-9]/g, '');
          onChange(d ? Math.min(999, parseInt(d, 10)) : 0);
        }}
        placeholder="۰"
        style={{
          width: '100%', boxSizing: 'border-box', border: '1px solid #E7E2D6', borderRadius: 10,
          padding: '10px 12px', fontSize: 15, fontWeight: 700, textAlign: 'center',
          background: '#FAFAF7', color: '#1C1B17', outline: 'none', fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

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

  // اطلاعات بانکی — فقط از راه استعلام پر می‌شود
  const [bank, setBank] = useState<BankResult | null>(null);

  /* نام مدیر از هویت ثبت‌شده‌ی کاربر می‌آید و دستی نیست: باشگاه باید
     به نام همان کسی ثبت شود که حسابش احراز شده. */
  const managerName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const [form, setForm] = useState({
    name: '',
    description: '',
    province: '',
    city: '',
    address: '',
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
    workingHours: Object.fromEntries(
      DAYS.map(d => [d.key, { open: '09:00', close: '23:00', isOpen: true }]),
    ) as Hours,
  });

  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }));

  // Auto-generate slug from name (only when user hasn't manually edited)
  useEffect(() => {
    if (!slugEdited && form.name) setSlug(persianToSlug(form.name));
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
      } catch { setSlugStatus('idle'); }
    }, 500);
    return () => { if (slugTimer.current) clearTimeout(slugTimer.current); };
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') set(name, (e.target as HTMLInputElement).checked);
    else set(name, value);
  };

  const getLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        set('latitude', pos.coords.latitude.toString());
        set('longitude', pos.coords.longitude.toString());
        setLocationLoading(false);
      },
      () => { setError('دسترسی به موقعیت مکانی رد شد'); setLocationLoading(false); },
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
    setLicensePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const removeImage = (i: number) => {
    setImageFiles(f => f.filter((_, idx) => idx !== i));
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!user) { router.push('/login'); return; }
    if (!form.name.trim())    { setError('نام باشگاه را وارد کنید'); return; }
    if (!form.province)       { setError('استان باشگاه را انتخاب کنید'); return; }
    if (!form.city.trim())    { setError('شهر باشگاه را انتخاب کنید'); return; }
    if (!form.address.trim()) { setError('آدرس کامل باشگاه را وارد کنید'); return; }
    if (slug && slugStatus === 'taken')   { setError('نام سایت انتخابی قبلاً رزرو شده؛ نام دیگری بگذارید'); return; }
    if (slug && slugStatus === 'invalid') { setError('نام سایت فقط می‌تواند حروف انگلیسی کوچک، عدد و خط تیره داشته باشد'); return; }
    /* اگر کارت استعلام شده، تأییدش هم باید گرفته شده باشد — پول به همان شبا می‌رود */
    if (bank && !bank.confirmed) { setError('لطفاً درستی اطلاعات بانکی را تأیید کنید'); return; }

    setLoading(true);
    setError('');

    try {
      const clubId = `${Date.now()}`;
      const imageUrls: string[] = [];
      let videoUrl = '';
      let licenseDocumentUrl = '';

      if (imageFiles.length > 0) {
        setUploadProgress('در حال آپلود عکس‌ها…');
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          if (!file) continue;
          const url = await uploadFile('club-media', file, `clubs/${clubId}/images/${i}-${file.name}`);
          if (url) imageUrls.push(url);
        }
      }

      if (videoFile) {
        setUploadProgress('در حال آپلود ویدیو…');
        const url = await uploadFile('club-media', videoFile, `clubs/${clubId}/videos/${videoFile.name}`);
        if (url) videoUrl = url;
      }

      if (licenseFile) {
        setUploadProgress('در حال آپلود مدرک جواز کسب…');
        const url = await uploadFile('club-media', licenseFile, `clubs/${clubId}/license/${licenseFile.name}`);
        if (url) licenseDocumentUrl = url;
      }

      setUploadProgress('در حال ثبت اطلاعات…');

      await api.post('/clubs', {
        ...form,
        managerName,
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        images: imageUrls,
        videos: videoUrl ? [videoUrl] : [],
        licenseDocumentUrl: licenseDocumentUrl || undefined,
        slug: (slug && slugStatus === 'ok') ? slug : undefined,
        /* اطلاعات بانکی فقط اگر استعلام و تأیید شده باشد */
        ...(bank?.confirmed ? {
          bankCard: bank.card,
          bankCardOwner: bank.ownerName,
          bankName: bank.bankName,
          iban: bank.iban,
          ibanOwnerName: bank.ownerName,
          ibanVerified: true,
          bankCardVerified: true,
          bankConfirmedByOwner: true,
        } : {}),
      });

      router.push('/dashboard/club');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'خطا در ثبت باشگاه');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors';
  const inputStyle: React.CSSProperties = { background: '#FAFAF7', border: '1px solid #E7E2D6', color: '#1C1B17' };
  const lockedStyle: React.CSSProperties = { ...inputStyle, background: '#F1EFE9', color: '#5B564B', cursor: 'not-allowed' };
  const sectionStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E7E2D6', borderRadius: '16px', padding: '24px', marginBottom: '20px' };
  const labelCls = 'block text-xs font-medium mb-1';
  const labelStyle: React.CSSProperties = { color: '#8A8474', fontWeight: 700 };
  const headingStyle: React.CSSProperties = { fontSize: '17px', fontWeight: 800, color: '#9A6E38', marginBottom: '16px' };

  return (
    <>
      <style>{`
        .dark-input::placeholder { color: rgba(0,0,0,0.28); }
        .dark-input:focus { border-color: rgba(199,166,106,0.55) !important; box-shadow: 0 0 0 3px rgba(199,166,106,0.10); }
        .dark-file::file-selector-button {
          background: rgba(199,166,106,0.12); border: 1px solid rgba(199,166,106,0.25);
          color: #9A6E38; border-radius: 8px; padding: 4px 12px; font-size: 12px;
          cursor: pointer; margin-left: 8px; font-family: inherit;
        }
        @keyframes ncFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ncPop  { from { opacity: 0; transform: scale(.9) translateY(12px) } to { opacity: 1; transform: none } }
      `}</style>

      {/* خطا — وسط صفحه.
          قبلاً خطا بالای فرم می‌نشست و در فرمی به این بلندی کاربر باید
          کل صفحه را بالا می‌رفت تا بفهمد چه شده. */}
      {error && (
        <div onClick={() => setError('')} role="alert"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 24,
            background: 'rgba(15,14,11,0.42)', backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)', animation: 'ncFade .22s ease both',
          }}>
          <div onClick={e => e.stopPropagation()} dir="rtl"
            style={{
              position: 'relative', width: '100%', maxWidth: 350, background: '#fff',
              border: '1px solid rgba(178,59,46,0.28)', borderRadius: 18,
              padding: '26px 22px 20px', textAlign: 'center', overflow: 'hidden',
              boxShadow: '0 26px 80px rgba(15,14,11,0.4)',
              animation: 'ncPop .3s cubic-bezier(.22,1,.36,1) both',
              fontFamily: 'var(--font-base)',
            }}>
            <span style={{
              position: 'absolute', top: 0, insetInline: 0, height: 3,
              background: 'linear-gradient(90deg,#7E241A,#B23B2E,#7E241A)',
            }} />
            <span style={{
              width: 50, height: 50, borderRadius: '50%', margin: '0 auto 4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B23B2E',
              background: 'rgba(178,59,46,0.08)', border: '1px solid rgba(178,59,46,0.22)',
            }}>
              <AlertCircle size={22} />
            </span>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: '#1C1B17', lineHeight: 2, margin: '12px 0 16px' }}>{error}</p>
            <button type="button" onClick={() => setError('')}
              style={{
                width: '100%', padding: 11, borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 800, color: '#B23B2E',
                background: 'rgba(178,59,46,0.06)', border: '1px solid rgba(178,59,46,0.3)',
              }}>
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: '#F7F5F0', direction: 'rtl', paddingBottom: '60px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px clamp(16px,4vw,32px) 0' }}>

          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: 'clamp(24px,4.4vw,35px)', fontWeight: 900, color: '#1C1B17', margin: 0, letterSpacing: '-0.02em' }}>ثبت باشگاه جدید</h1>
          </div>

          {/* اطلاعات پایه */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>اطلاعات پایه</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls} style={labelStyle}>نام باشگاه *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  className={`${inputCls} dark-input`} style={inputStyle} placeholder="نام باشگاه" />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>نام مدیر باشگاه</label>
                {/* از هویت احرازشده می‌آید و قابل تغییر نیست */}
                <div style={{ position: 'relative' }}>
                  <input type="text" value={managerName || '—'} disabled
                    className={inputCls} style={{ ...lockedStyle, paddingInlineEnd: 34 }} />
                  <Lock size={13} style={{ position: 'absolute', insetInlineEnd: 11, top: '50%', transform: 'translateY(-50%)', color: '#B7B0A0' }} />
                </div>
                <p style={{ fontSize: 11, color: '#8A8474', marginTop: 4 }}>از اطلاعات هویتی حساب شما خوانده می‌شود</p>
              </div>
            </div>
            <div className="mb-4">
              <label className={labelCls} style={labelStyle}>توضیحات</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                className={`${inputCls} dark-input`} style={inputStyle} rows={3} placeholder="معرفی باشگاه…" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls} style={labelStyle}>تلفن</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                  className={`${inputCls} dark-input`} style={inputStyle} placeholder="۰۲۱۱۲۳۴۵۶۷۸" />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>وبسایت</label>
                <input type="url" name="website" value={form.website} onChange={handleChange}
                  className={`${inputCls} dark-input bh-latin`} style={inputStyle} placeholder="https://…" dir="ltr" />
              </div>
            </div>

            {/* نام سایت باشگاه */}
            <div>
              <label className={labelCls} style={labelStyle}>نام سایت باشگاه شما</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="bh-latin" style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', whiteSpace: 'nowrap', flexShrink: 0, direction: 'ltr' }}>billiardhub.net/clubs/</span>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text" value={slug}
                    onChange={e => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
                    className={`${inputCls} dark-input bh-latin`}
                    style={{
                      ...inputStyle, direction: 'ltr',
                      borderColor: slugStatus === 'ok' ? 'rgba(14,122,56,0.45)'
                        : slugStatus === 'taken' || slugStatus === 'invalid' ? 'rgba(178,59,46,0.45)'
                        : undefined,
                    }}
                    placeholder="hafez-shiraz"
                  />
                </div>
                {slug && slugEdited && (
                  <button type="button" onClick={() => { setSlug(persianToSlug(form.name)); setSlugEdited(false); }}
                    style={{ fontSize: 12, color: '#9A6E38', background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.28)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>
                    بازنشانی
                  </button>
                )}
              </div>
              <div style={{ marginTop: 5, fontSize: 12, minHeight: 16 }}>
                {slugStatus === 'checking' && <span style={{ color: 'rgba(0,0,0,0.40)' }}>در حال بررسی…</span>}
                {slugStatus === 'ok'       && <span style={{ color: '#0E7A38' }}>✓ این نشانی در دسترس است</span>}
                {slugStatus === 'taken'    && <span style={{ color: '#B23B2E' }}>✗ این نشانی قبلاً رزرو شده</span>}
                {slugStatus === 'invalid'  && <span style={{ color: '#B23B2E' }}>فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است</span>}
                {slugStatus === 'idle' && slug && <span style={{ color: 'rgba(0,0,0,0.35)' }}>نشانی اختصاصی صفحه‌ی باشگاه شما — مثلاً hafez-shiraz</span>}
              </div>
            </div>
          </div>

          {/* آدرس */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>آدرس باشگاه</h2>
            <div className="mb-4">
              {/* تم روشن — پس‌زمینه‌ی این صفحه روشن است و تم تیره متن را نامرئی می‌کرد */}
              <ProvinceCitySelect
                theme="light"
                value={{ province: form.province, city: form.city }}
                onChange={v => setForm(prev => ({ ...prev, province: v.province, city: v.city }))}
                required
              />
            </div>

            <div className="mb-4">
              <label className={labelCls} style={labelStyle}>آدرس کامل *</label>
              <textarea name="address" value={form.address} onChange={handleChange}
                className={`${inputCls} dark-input`} style={{ ...inputStyle, resize: 'none' }}
                rows={2} placeholder="خیابان، کوچه، پلاک…" />
            </div>

            <div>
              <label className={labelCls} style={{ ...labelStyle, display: 'block', marginBottom: '8px' }}>موقعیت مکانی</label>
              <button type="button" onClick={getLocation} disabled={locationLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(199,166,106,0.10)', border: '1px solid rgba(199,166,106,0.32)',
                  color: '#9A6E38', padding: '9px 18px', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 700,
                  cursor: locationLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: locationLoading ? 0.5 : 1,
                }}>
                {locationLoading ? 'در حال دریافت…' : 'دریافت موقعیت فعلی'}
              </button>
              {form.latitude && form.longitude && (
                <p style={{ fontSize: '13px', color: '#0E7A38', marginTop: '8px' }}>
                  موقعیت ثبت شد: {parseFloat(form.latitude).toFixed(4)}، {parseFloat(form.longitude).toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* جواز کسب */}
          <div style={{ ...sectionStyle, border: '1px solid rgba(199,166,106,0.35)', background: 'rgba(199,166,106,0.04)' }}>
            <h2 style={headingStyle}>جواز کسب / مدرک رسمی</h2>

            <label className={labelCls} style={labelStyle}>آپلود مدرک (JPG، PNG، PDF — حداکثر ۱۰ مگابایت)</label>
            <input type="file" accept="image/*,.pdf" onChange={handleLicenseSelect}
              className="dark-file w-full text-sm mb-3" style={{ color: 'rgba(0,0,0,0.45)' }} />

            {licenseFile && (
              /* انتخاب فایل یعنی «آماده‌ی ارسال»، نه «تأییدشده».
                 تیک سبز فقط پس از بررسی کارشناس داده می‌شود. */
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.3)', borderRadius: '10px', padding: '10px 14px' }}>
                {licensePreview ? (
                  <img loading="lazy" decoding="async" src={licensePreview} alt="پیش‌نمایش مدرک" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(199,166,106,0.14)', borderRadius: 8, fontSize: 24, flexShrink: 0 }}>📄</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1B17', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{licenseFile.name}</div>
                  <div style={{ fontSize: 12, color: '#8A8474' }}>پس از ثبت، مدرک بررسی می‌شود و نتیجه اعلام خواهد شد</div>
                </div>
                <button type="button" onClick={() => { setLicenseFile(null); setLicensePreview(null); }}
                  style={{
                    marginRight: 'auto', background: 'rgba(178,59,46,0.08)', border: '1px solid rgba(178,59,46,0.25)',
                    color: '#B23B2E', borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                  }}>
                  حذف
                </button>
              </div>
            )}
          </div>

          {/* تعداد میزها */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>تعداد میزها</h2>
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
                <CountField key={item.key} label={item.label}
                  value={(form as unknown as Record<string, number>)[item.key] ?? 0}
                  onChange={n => set(item.key, n)} />
              ))}
            </div>
          </div>

          {/* امکانات رفاهی */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>امکانات رفاهی</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'hasCafe',              label: 'کافه'         },
                { key: 'hasParking',           label: 'پارکینگ'      },
                { key: 'hasWifi',              label: 'اینترنت بی‌سیم' },
                { key: 'hasProfessionalCoach', label: 'مربی حرفه‌ای' },
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" name={item.key}
                    checked={(form as unknown as Record<string, boolean>)[item.key]}
                    onChange={handleChange}
                    style={{ width: '16px', height: '16px', accentColor: '#C7A66A' }} />
                  <span style={{ fontSize: '14px', color: '#5B564B' }}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* امکانات ویژه */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>امکانات ویژه</h2>
            <textarea name="specialFeatures" value={form.specialFeatures} onChange={handleChange}
              className={`${inputCls} dark-input`} style={inputStyle}
              rows={3} placeholder="هر امکانات ویژه‌ای که باشگاه دارد را این‌جا بنویسید…" />
          </div>

          {/* ساعات کاری */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>ساعات کاری</h2>
            <WorkingHours value={form.workingHours} onChange={h => set('workingHours', h)} />
          </div>

          {/* عکس‌ها */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>عکس‌های باشگاه</h2>
            <p style={{ fontSize: '13px', color: '#8A8474', marginBottom: '12px' }}>حداکثر ۱۰ عکس — فرمت JPG یا PNG</p>
            <input type="file" accept="image/*" multiple onChange={handleImageSelect}
              className="dark-file w-full text-sm" style={{ color: 'rgba(0,0,0,0.45)' }} />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img loading="lazy" decoding="async" src={src} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }} />
                    <button type="button" onClick={() => removeImage(i)} aria-label="حذف عکس"
                      style={{
                        position: 'absolute', top: 4, left: 4, background: 'rgba(178,59,46,0.85)',
                        border: 'none', color: '#fff', borderRadius: '50%', width: 22, height: 22,
                        padding: 0, fontSize: 15, lineHeight: 1, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ویدیو */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>ویدیوی باشگاه</h2>
            <p style={{ fontSize: '13px', color: '#8A8474', marginBottom: '12px' }}>یک ویدیوی معرفی — حداکثر ۱۰۰ مگابایت</p>
            <input type="file" accept="video/mp4,video/*" onChange={e => setVideoFile(e.target.files?.[0] ?? null)}
              className="dark-file w-full text-sm" style={{ color: 'rgba(0,0,0,0.45)' }} />
            {videoFile && <p style={{ fontSize: '13px', color: '#0E7A38', marginTop: '8px' }}>{videoFile.name} انتخاب شد</p>}
          </div>

          {/* اطلاعات بانکی */}
          <div style={sectionStyle}>
            <h2 style={headingStyle}>اطلاعات بانکی — تسویه حساب</h2>
            <p style={{ fontSize: '13px', color: '#5B564B', lineHeight: 1.9, marginBottom: 16 }}>
              کاربران از راه درگاه بانکی امن پرداخت می‌کنند. درآمد رزروها پس از کسر کارمزد،
              در دوره‌های تسویه به همین حساب واریز می‌شود.
            </p>
            <BankCardVerify value={bank} onChange={setBank} />
            {!bank && (
              <p style={{ fontSize: 12, color: '#8A8474', marginTop: 10 }}>
                می‌توانید اطلاعات بانکی را بعداً از داشبورد باشگاه تکمیل کنید.
              </p>
            )}
          </div>

          {uploadProgress && (
            <div style={{ background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.25)', color: '#9A6E38', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
              {uploadProgress}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px',
              fontSize: '17px', fontWeight: 800, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              background: loading ? 'rgba(199,166,106,0.25)' : 'linear-gradient(135deg,#E8CE96,#C7A66A 55%,#A8853F)',
              color: loading ? '#8A8474' : '#241B08',
              boxShadow: loading ? 'none' : '0 12px 30px rgba(199,166,106,0.32)',
            }}>
            {loading && <Loader2 size={17} className="animate-spin" />}
            {loading ? (uploadProgress || 'در حال ثبت…') : 'ثبت باشگاه'}
          </button>
        </div>
      </div>
    </>
  );
}
