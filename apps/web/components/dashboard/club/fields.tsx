/* ─────────────────────────────────────────────────────────────
   عنصرهای فرمِ پنلِ مدیریتِ باشگاه.

   این‌ها از `app/dashboard/club/page.tsx` بیرون کشیده شدند. آن فایل
   ۳۸۸۱ خط بود و یازده تب را در یک کامپوننت جا داده — این شش تا تنها
   بخشی بودند که هیچ وابستگی‌ای به آن ۸۶ `useState` نداشتند و فقط از
   props می‌خوانند، پس جداکردنشان هیچ رفتاری را عوض نمی‌کند.
   ───────────────────────────────────────────────────────────── */

import { Loader2, Check } from 'lucide-react';
import Select from '../../ui/Select';
import FaNumberInput from '../../ui/FaNumberInput';

const GOLD = '#C7A66A';
const DARK = '#1A1A18';

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 20,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0EDE8', ...style,
    }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, color: GOLD,
      borderRight: `3px solid ${GOLD}`, paddingRight: 10, marginBottom: 16, marginTop: 8,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function InputField({ label, value, onChange, type = 'text', placeholder = '', ltr = false, grouped = false,
  readOnly = false, hint, maxWidth }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; ltr?: boolean;
  /** جداکننده‌ی سه‌رقمی — برای مبلغ */
  grouped?: boolean;
  /** فیلدِ مشتق که کاربر حق تغییرش را ندارد (مثل نام مدیر) */
  readOnly?: boolean;
  /** توضیح کوتاه زیر فیلد — برای گفتنِ «چرا نمی‌توانم این را عوض کنم» */
  hint?: string;
  /** سقفِ عرض؛ برای فیلدهای کوتاه مثل شماره‌ی میز که کلِ ستون را لازم ندارند */
  maxWidth?: number;
}) {
  const box: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 12px',
    fontSize: 14, background: '#FAFAFA', color: DARK, outline: 'none',
    fontFamily: 'var(--font-base)',
  };

  /* فیلد عددی با ورودی فارسی جایگزین می‌شود: کاربر فارسی می‌بیند و
     فارسی هم می‌تواند تایپ کند، ولی آنچه بالا می‌رود همیشه لاتین است.
     `type="number"` بومی هیچ‌وقت ارقام فارسی نشان نمی‌داد. */
  if (type === 'number') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, maxWidth }}>
        <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</label>
        <FaNumberInput
          value={value} onChange={onChange} placeholder={placeholder}
          grouped={grouped} ariaLabel={label}
          style={{ ...box, textAlign: 'center' }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, maxWidth }}>
      <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder}
        dir={ltr ? 'ltr' : undefined} lang={ltr ? 'en' : undefined}
        readOnly={readOnly} aria-readonly={readOnly || undefined} tabIndex={readOnly ? -1 : undefined}
        onChange={e => { if (!readOnly) onChange(e.target.value); }}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 12px',
          fontSize: 14, color: readOnly ? '#6B7280' : DARK, outline: 'none',
          /* `readOnly` به‌جای `disabled`: مقدار همچنان خوانا و قابل کپی
             است و برخلاف disabled در فرم هم شرکت می‌کند؛ فقط قفل است. */
          background: readOnly ? '#F3F4F6' : '#FAFAFA',
          cursor: readOnly ? 'default' : undefined,
          fontFamily: ltr ? '"Courier New", Courier, monospace' : 'var(--font-base)',
          textAlign: ltr ? 'left' : undefined,
        }}
      />
      {hint && <span style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>{hint}</span>}
    </div>
  );
}

export function SelectField({ label, value, onChange, options, latin }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  /** ارقامِ گزینه‌ها لاتین بمانند — مثلِ «Best of 5» */
  latin?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</label>
      <Select
        value={value} ariaLabel={label} latin={latin}
        options={options.filter(o => !o.disabled).map(o => ({ value: o.value, label: o.label }))}
        onChange={onChange} />
    </div>
  );
}

/* تیکِ «بستن رزرو این میز».

   با `isActive` فرق دارد و همین تفاوت مهم است: `isActive=false` یعنی
   میز اصلاً وجود ندارد و از همه‌جای سیستم — از جمله گزارش‌ها و تعدادِ
   میزها — بیرون می‌رود. این‌جا میز سرِ جایش می‌ماند و فقط از صفحه‌ی
   رزروِ آنلاین برداشته می‌شود؛ برای میزی که در تعمیر است یا موقتاً
   حضوری اجاره داده شده. */
export function ClosedToggle({ checked, onChange, compact = false }: {
  checked: boolean; onChange: (v: boolean) => void; compact?: boolean;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
      marginBottom: compact ? 14 : 16, padding: compact ? '10px 12px' : '12px 14px',
      borderRadius: 12, userSelect: 'none',
      background: checked ? 'rgba(220,38,38,0.06)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${checked ? 'rgba(220,38,38,0.28)' : 'rgba(0,0,0,0.08)'}`,
      transition: 'background .2s, border-color .2s',
    }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 17, height: 17, accentColor: '#DC2626', cursor: 'pointer', flexShrink: 0, marginTop: 1 }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: checked ? '#B91C1C' : DARK }}>
          بستن رزرو این میز
        </span>
        <span style={{ display: 'block', fontSize: 11.5, color: '#9CA3AF', lineHeight: 1.85, marginTop: 2 }}>
          {checked
            ? 'قابلیت رزرو برای این میز غیرفعال می‌شود — در صفحه‌ی رزرو آنلاین دیده نمی‌شود. رزروهای ثبت‌شده‌ی قبلی سر جای خود می‌مانند.'
            : 'اگر میز در تعمیر است یا موقتاً حضوری واگذار شده، این را تیک بزنید.'}
        </span>
      </span>
    </label>
  );
}

export function SaveBtn({ onClick, loading, label = 'ذخیره تغییرات' }: {
  onClick: () => void; loading: boolean; label?: string;
}) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: 'rgba(199,166,106,0.14)', color: '#A07840',
      border: '1px solid rgba(199,166,106,0.42)', borderRadius: 20,
      padding: '10px 26px', fontSize: 14, fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.65 : 1,
      fontFamily: 'var(--font-base)', transition: 'all 0.15s',
    }}>
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
      {loading ? 'در حال ذخیره...' : label}
    </button>
  );
}

