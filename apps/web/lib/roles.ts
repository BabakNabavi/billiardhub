// apps/web/lib/roles.ts
// ─── single source of truth برای همه صفحات فرانت ──────────

export type RoleValue =
  | 'user' | 'player' | 'coach' | 'referee'
  | 'technician' | 'seller' | 'manufacturer' | 'club_owner'

export type RoleStatus = 'pending' | 'approved' | 'rejected'

export interface RoleRequest {
  id: string
  role: RoleValue
  status: RoleStatus
  docUrl?: string
  rejectionNote?: string
  requestedAt: string
  reviewedAt?: string
}

export interface RoleMeta {
  value: RoleValue
  label: string
  icon: string
  color: string
  description: string
  requiresDoc: boolean
  docHint: string
  profileFields: ProfileField[]
}

export interface ProfileField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'url'
  placeholder: string
  options?: string[]
  required: boolean
}

export const ROLES: RoleMeta[] = [
  {
    value: 'user', label: 'کاربر عادی', icon: 'ti-user', color: '#94a3b8',
    description: 'مشاهده و رزرو میز', requiresDoc: false, docHint: '',
    profileFields: [
      { key: 'displayName', label: 'نام نمایشی', type: 'text', placeholder: 'نام و نام‌خانوادگی', required: true },
      { key: 'bio', label: 'معرفی کوتاه', type: 'textarea', placeholder: 'چند جمله درباره خودت...', required: false },
    ],
  },
  {
    value: 'player', label: 'بازیکن رنکینگی', icon: 'ti-chart-bar', color: '#10b981',
    description: 'رنکینگ ملی بیلیارد', requiresDoc: true,
    docHint: 'کارت عضویت فدراسیون یا گواهی رتبه‌بندی ملی',
    profileFields: [
      { key: 'displayName', label: 'نام کامل', type: 'text', placeholder: 'نام و نام‌خانوادگی', required: true },
      { key: 'specialty', label: 'تخصص', type: 'select', placeholder: '', options: ['اسنوکر', 'پول', 'کارامبول', 'هندیکپ'], required: true },
      { key: 'nationalRank', label: 'رتبه ملی', type: 'number', placeholder: 'مثلاً ۱۲', required: false },
      { key: 'yearsActive', label: 'سال‌های فعالیت', type: 'number', placeholder: 'مثلاً ۸', required: false },
      { key: 'club', label: 'باشگاه فعلی', type: 'text', placeholder: 'نام باشگاه', required: false },
      { key: 'bio', label: 'بیوگرافی ورزشی', type: 'textarea', placeholder: 'افتخارات، سابقه بازی...', required: false },
      { key: 'instagram', label: 'اینستاگرام', type: 'url', placeholder: 'https://instagram.com/...', required: false },
    ],
  },
  {
    value: 'coach', label: 'مربی', icon: 'ti-school', color: '#a78bfa',
    description: 'تدریس و آموزش بیلیارد', requiresDoc: true,
    docHint: 'مدرک مربیگری فدراسیون یا سابقه تدریس معتبر',
    profileFields: [
      { key: 'displayName', label: 'نام کامل', type: 'text', placeholder: 'نام و نام‌خانوادگی', required: true },
      { key: 'specialty', label: 'رشته تدریس', type: 'select', placeholder: '', options: ['اسنوکر', 'پول', 'کارامبول', 'همه رشته‌ها'], required: true },
      { key: 'licenseLevel', label: 'درجه مربیگری', type: 'select', placeholder: '', options: ['درجه ۳', 'درجه ۲', 'درجه ۱', 'ملی'], required: false },
      { key: 'experience', label: 'سابقه تدریس (سال)', type: 'number', placeholder: 'مثلاً ۵', required: true },
      { key: 'location', label: 'شهر فعالیت', type: 'text', placeholder: 'تهران، اصفهان...', required: true },
      { key: 'sessionPrice', label: 'هزینه هر جلسه (تومان)', type: 'number', placeholder: 'مثلاً ۵۰۰۰۰۰', required: false },
      { key: 'bio', label: 'درباره من', type: 'textarea', placeholder: 'روش تدریس، سوابق، دستاوردها...', required: false },
    ],
  },
  {
    value: 'referee', label: 'داور', icon: 'ti-scale', color: '#f59e0b',
    description: 'داوری مسابقات رسمی', requiresDoc: true,
    docHint: 'کارت داوری فدراسیون بیلیارد و اسنوکر',
    profileFields: [
      { key: 'displayName', label: 'نام کامل', type: 'text', placeholder: 'نام و نام‌خانوادگی', required: true },
      { key: 'licenseLevel', label: 'درجه داوری', type: 'select', placeholder: '', options: ['درجه ۳', 'درجه ۲', 'درجه ۱', 'بین‌المللی'], required: true },
      { key: 'specialty', label: 'رشته داوری', type: 'select', placeholder: '', options: ['اسنوکر', 'پول', 'کارامبول', 'همه رشته‌ها'], required: true },
      { key: 'location', label: 'شهر', type: 'text', placeholder: 'محل اقامت', required: true },
      { key: 'matchCount', label: 'تعداد مسابقات داوری‌شده', type: 'number', placeholder: 'مثلاً ۴۰', required: false },
      { key: 'bio', label: 'سوابق داوری', type: 'textarea', placeholder: 'مسابقات مهم، لیگ‌ها...', required: false },
    ],
  },
  {
    value: 'technician', label: 'خدمات فنی', icon: 'ti-tool', color: '#06b6d4',
    description: 'تعمیر و نگهداری تجهیزات', requiresDoc: false, docHint: '',
    profileFields: [
      { key: 'displayName', label: 'نام کامل', type: 'text', placeholder: 'نام و نام‌خانوادگی', required: true },
      { key: 'services', label: 'خدمات', type: 'select', placeholder: '', options: ['تعمیر میز', 'تعویض روکش', 'تراز کردن', 'لاک‌زنی', 'همه موارد'], required: true },
      { key: 'location', label: 'محدوده سرویس', type: 'text', placeholder: 'تهران — کرج', required: true },
      { key: 'phone', label: 'شماره تماس', type: 'text', placeholder: '۰۹۱۲...', required: true },
      { key: 'bio', label: 'معرفی', type: 'textarea', placeholder: 'خدمات، تجربه، نمونه کارها...', required: false },
    ],
  },
  {
    value: 'seller', label: 'فروشنده', icon: 'ti-shopping-bag', color: '#f97316',
    description: 'فروش تجهیزات بیلیارد', requiresDoc: true,
    docHint: 'جواز کسب یا صفحه فروشگاه رسمی',
    profileFields: [
      { key: 'displayName', label: 'نام فروشگاه', type: 'text', placeholder: 'نام برند یا فروشگاه', required: true },
      { key: 'location', label: 'آدرس / شهر', type: 'text', placeholder: 'تهران، بازار بزرگ...', required: true },
      { key: 'phone', label: 'شماره تماس', type: 'text', placeholder: '۰۲۱...', required: true },
      { key: 'website', label: 'وب‌سایت / اینستاگرام', type: 'url', placeholder: 'https://...', required: false },
      { key: 'bio', label: 'معرفی فروشگاه', type: 'textarea', placeholder: 'محصولات، برندها، خدمات...', required: false },
    ],
  },
  {
    value: 'manufacturer', label: 'تولیدکننده', icon: 'ti-building-factory', color: '#ef4444',
    description: 'تولید تجهیزات بیلیارد', requiresDoc: true,
    docHint: 'جواز تولید یا گواهی ثبت برند',
    profileFields: [
      { key: 'displayName', label: 'نام برند / کارخانه', type: 'text', placeholder: 'نام رسمی', required: true },
      { key: 'founded', label: 'سال تأسیس', type: 'number', placeholder: 'مثلاً ۱۳۸۵', required: false },
      { key: 'location', label: 'محل تولید', type: 'text', placeholder: 'استان / شهر', required: true },
      { key: 'website', label: 'وب‌سایت', type: 'url', placeholder: 'https://...', required: false },
      { key: 'bio', label: 'درباره برند', type: 'textarea', placeholder: 'تاریخچه، ظرفیت تولید، افتخارات...', required: false },
    ],
  },
  {
    value: 'club_owner', label: 'باشگاه‌دار', icon: 'ti-building-store', color: '#3b82f6',
    description: 'مدیریت باشگاه بیلیارد', requiresDoc: true,
    docHint: 'جواز کسب باشگاه یا مجوز فعالیت از اماکن ورزشی',
    profileFields: [
      { key: 'displayName', label: 'نام باشگاه', type: 'text', placeholder: 'نام رسمی باشگاه', required: true },
      { key: 'location', label: 'آدرس', type: 'text', placeholder: 'شهر — محله', required: true },
      { key: 'tableCount', label: 'تعداد میزها', type: 'number', placeholder: 'مثلاً ۶', required: true },
      { key: 'phone', label: 'شماره باشگاه', type: 'text', placeholder: '۰۲۱...', required: true },
      { key: 'instagram', label: 'اینستاگرام', type: 'url', placeholder: 'https://instagram.com/...', required: false },
      { key: 'bio', label: 'معرفی باشگاه', type: 'textarea', placeholder: 'امکانات، ساعت‌کاری، خدمات...', required: false },
    ],
  },
]

export const ROLE_MAP = Object.fromEntries(
  ROLES.map(r => [r.value, r])
) as Record<RoleValue, RoleMeta>

// ─── Helpers ──────────────────────────────────────────────────
export function toFarsiDigits(n: number | string): string {
  const fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹']
return String(n).replace(/\d/g, d => fa[+d] ?? d)
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export const STATUS_LABEL: Record<RoleStatus, string> = {
  pending:  'در انتظار تأیید',
  approved: 'تأیید شده',
  rejected: 'رد شده',
}

export const STATUS_COLOR: Record<RoleStatus, string> = {
  pending:  '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
}

// ─── API base URL — از env می‌خونه ───────────────────────────
export const API_BASE =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')

export function apiHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token')
    : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function apiHeadersNoJson(): Record<string, string> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token')
    : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}
