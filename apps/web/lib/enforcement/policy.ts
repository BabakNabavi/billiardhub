/* ─────────────────────────────────────────────────────────────
   اعمالِ وضعیتِ حساب — منطقِ خالص (بی‌دیتابیس، بی‌React).

   تنها جایی که «این درخواست از این حساب مجاز است یا نه» تصمیم گرفته
   می‌شود. proxy.ts همه‌ی /apiها و صفحه‌های محافظت‌شده را از این‌جا
   می‌گذراند، و login/refresh هم همین را می‌پرسند. چون خالص است،
   scripts/test-enforcement.mjs بی‌سرور می‌سنجدش.

   ⚠️ این فایل نباید هیچ import داشته باشد (آزمون آن را مستقیم ترجمه و
   اجرا می‌کند).
   ───────────────────────────────────────────────────────────── */

export const ACCOUNT_STATUSES = [
  'active', 'restricted', 'limited', 'suspended', 'banned', 'deactivated', 'deleted',
] as const
export type AccountStatus = typeof ACCOUNT_STATUSES[number]

/** وضعیت‌هایی که هیچ دسترسی‌ای ندارند: ورود نه، API نه، نشست باطل */
export const BLOCKING: ReadonlySet<AccountStatus> = new Set(['suspended', 'banned', 'deactivated', 'deleted'])

/** وضعیت‌هایی که اقدامِ موقت می‌پذیرند (انقضا ⟵ خودبه‌خود active) */
export const TEMPORARY_OK: ReadonlySet<AccountStatus> = new Set(['restricted', 'limited', 'suspended'])

export const STATUS_LABEL: Record<AccountStatus, string> = {
  active: 'فعال',
  restricted: 'محدود (فقط خواندن)',
  limited: 'محدودیت بخشی',
  suspended: 'تعلیق',
  banned: 'مسدود دائم',
  deactivated: 'غیرفعال',
  deleted: 'حذف‌شده',
}

/* ── قابلیت‌ها (برای «محدودیتِ بخشی») ──────────────────────────
   هر قابلیت = چند پیشوندِ API. در وضعیتِ limited، درخواستِ
   تغییردهنده (POST/PUT/PATCH/DELETE) به این پیشوندها رد می‌شود؛
   خواندن آزاد است. */
export const FEATURES = {
  market:      { label: 'بیلیارد بازار (آگهی و ارتقا)', prefixes: ['/api/market', '/api/products'] },
  social:      { label: 'پیام، استوری، نظر و تعامل اجتماعی', prefixes: ['/api/social', '/api/stories', '/api/favorites', '/api/media/social'] },
  media:       { label: 'بیلیارد مدیا و پخش زنده', prefixes: ['/api/media', '/api/live'] },
  bookings:    { label: 'رزرو میز', prefixes: ['/api/bookings'] },
  tournaments: { label: 'ثبت‌نام مسابقه', prefixes: ['/api/tournaments'] },
  business:    { label: 'باشگاه، فروشگاه و پروفایل تخصصی', prefixes: ['/api/clubs', '/api/sellers', '/api/profiles', '/api/coach', '/api/roles', '/api/catalog', '/api/specs'] },
  ads:         { label: 'تبلیغات', prefixes: ['/api/ads'] },
  uploads:     { label: 'بارگذاری فایل', prefixes: ['/api/upload'] },
  reports:     { label: 'گزارش و پشتیبانی', prefixes: ['/api/reports', '/api/support', '/api/contact'] },
} as const
export type FeatureKey = keyof typeof FEATURES
export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[]

/* ── مسیرهایی که حسابِ مسدود هم می‌تواند صدا بزند ──
   خروج (تا کوکی پاک شود)، خواندنِ وضعیتِ خودش (تا پیامِ درست ببیند)، و
   فرمِ تماس برای اعتراض (بی‌آن، صفحه‌ی وضعیت کاربر را به /contact می‌فرستاد و
   آن‌جا دوباره ۴۰۳ می‌گرفت — حلقه). فرمِ تماس برای مهمان هم باز و محدودِ
   نرخ است، پس چیزی بیش از یک مهمان نمی‌دهد.
   ⚠️ هر مسیرِ تازه‌ای این‌جا = سوراخ؛ فقط چیزی که خودش هیچ دسترسی‌ای
   نمی‌دهد. */
export const BLOCKED_ALLOW = ['/api/auth/logout', '/api/account/status', '/api/contact']

/* در restricted (فقط‌خواندن) این تغییردهنده‌ها هم مجازند: خروج، تمدیدِ
   نشست، تغییرِ رمز (امنیتِ خودِ حساب)، و تماس با پشتیبانی برای اعتراض. */
export const RESTRICTED_WRITE_ALLOW = [
  '/api/auth/logout', '/api/auth/refresh', '/api/auth/change-password',
  '/api/account/status', '/api/support', '/api/contact',
]

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])

/** مسیرِ یکدست برای تصمیم: رمزگشایی (%61 ⟵ a)، اسلشِ تکراری، اسلشِ پایانی و
 *  حروفِ بزرگ. ⚠️ بی‌این، اگر مسیریاب /api/m%61rket یا /api//market را به همان
 *  گرداننده برساند، حسابِ limited از قابلیتِ بسته رد می‌شد. برای وضعیت‌های
 *  مسدود و فقط‌خواندنی مسیرِ عجیب فقط بیشتر می‌بندد. */
export function normalizePath(p: string): string {
  let out = p
  try { out = decodeURIComponent(out) } catch { /* درصدِ نامعتبر: همان رشته‌ی خام */ }
  out = out.replace(/\\/g, '/').replace(/\/{2,}/g, '/').toLowerCase()
  return out.length > 1 ? out.replace(/\/+$/, '') : out
}

const under = (path: string, prefixes: readonly string[]) =>
  prefixes.some(p => path === p || path.startsWith(p + '/'))

export interface AccountState {
  status: AccountStatus
  expiresAt: string | null
  restrictions: string[]
  isOwner: boolean
}

/** وضعیتِ مؤثر: اقدامِ موقتِ منقضی‌شده یعنی active (بی‌آنکه کسی دستی برگرداند). */
export function effectiveStatus(s: Pick<AccountState, 'status' | 'expiresAt' | 'isOwner'>, now = Date.now()): AccountStatus {
  if (s.isOwner) return 'active'
  if (!ACCOUNT_STATUSES.includes(s.status)) return 'active'
  if (s.expiresAt && TEMPORARY_OK.has(s.status)) {
    const t = Date.parse(s.expiresAt)
    if (Number.isFinite(t) && t <= now) return 'active'
  }
  return s.status
}

export type Decision =
  | { allow: true }
  | { allow: false; code: 'ACCOUNT_BLOCKED' | 'ACCOUNT_RESTRICTED' | 'FEATURE_RESTRICTED'; status: AccountStatus; feature?: FeatureKey }

/** آیا این حساب این درخواست را می‌تواند بفرستد؟ */
export function decide(state: AccountState, method: string, path: string, now = Date.now()): Decision {
  const st = effectiveStatus(state, now)
  if (st === 'active') return { allow: true }
  const m = method.toUpperCase()
  /* ⚠️ دو شکل، دو کار: فهرست‌های «مجاز» فقط با مسیرِ خام سنجیده می‌شوند
     (بی‌این، /api/contact%2F..%2Fbookings پس از رمزگشایی زیرِ /api/contact
     می‌افتاد و برای حسابِ مسدود باز می‌شد)؛ بستنِ قابلیت با هر دو شکل —
     پس مسیرِ عجیب فقط بیشتر می‌بندد، هرگز بیشتر باز نمی‌کند. */
  const raw = path
  const norm = normalizePath(path)

  if (BLOCKING.has(st)) {
    return under(raw, BLOCKED_ALLOW) ? { allow: true } : { allow: false, code: 'ACCOUNT_BLOCKED', status: st }
  }
  if (SAFE.has(m)) return { allow: true }

  if (st === 'restricted') {
    return under(raw, RESTRICTED_WRITE_ALLOW) ? { allow: true } : { allow: false, code: 'ACCOUNT_RESTRICTED', status: st }
  }
  /* limited: فقط قابلیت‌های بسته‌شده */
  for (const k of state.restrictions) {
    const f = FEATURES[k as FeatureKey]
    if (f && (under(raw, f.prefixes) || under(norm, f.prefixes))) {
      return { allow: false, code: 'FEATURE_RESTRICTED', status: st, feature: k as FeatureKey }
    }
  }
  return { allow: true }
}

/** آیا ورود (ساختِ نشستِ تازه) مجاز است؟ */
export function canSignIn(state: AccountState, now = Date.now()): boolean {
  return !BLOCKING.has(effectiveStatus(state, now))
}

/* ── اقدام‌ها ───────────────────────────────────────────────── */

export const ACTIONS = {
  restrict:          { label: 'محدودسازی (فقط خواندن)', to: 'restricted' },
  limit:             { label: 'بستن قابلیت‌های مشخص', to: 'limited' },
  suspend:           { label: 'تعلیق موقت', to: 'suspended' },
  ban:               { label: 'مسدود دائم', to: 'banned' },
  deactivate:        { label: 'غیرفعال‌کردن', to: 'deactivated' },
  delete:            { label: 'حذف حساب (برگشت‌پذیر)', to: 'deleted' },
  restore:           { label: 'بازگرداندن به فعال', to: 'active' },
  reactivate:        { label: 'فعال‌سازی دوباره', to: 'active' },
  remove_listings:   { label: 'حذف همه‌ی آگهی‌های بازار', to: null },
  remove_content:    { label: 'حذف یک محتوای مشخص', to: null },
  disable_business:  { label: 'غیرفعال‌کردن باشگاه/فروشگاه/پروفایل‌ها', to: null },
  restore_business:  { label: 'بازگرداندن باشگاه/فروشگاه/پروفایل‌ها', to: null },
  restore_listings:  { label: 'بازگرداندن آگهی‌های حذف‌شده', to: null },
} as const satisfies Record<string, { label: string; to: AccountStatus | null }>
export type ActionKey = keyof typeof ACTIONS
export const ACTION_KEYS = Object.keys(ACTIONS) as ActionKey[]

export const REASONS = {
  spam:            'اسپم یا تبلیغ ناخواسته',
  fraud:           'کلاهبرداری یا معامله‌ی جعلی',
  harassment:      'آزار، تهدید یا توهین',
  impersonation:   'جعل هویت',
  fake_identity:   'اطلاعات هویتی نادرست',
  prohibited:      'محتوا یا کالای ممنوع',
  payment_abuse:   'سوءاستفاده از پرداخت یا بازپرداخت',
  ban_evasion:     'دورزدن محدودیت با حساب دیگر',
  offplatform:     'رفتار خارج از سایت (طبق قوانین)',
  legal:           'درخواست قانونی',
  security:        'حساب نفوذشده / امنیتی',
  user_request:    'درخواست خود کاربر',
  other:           'دیگر',
  appeal_accepted: 'پذیرش اعتراض',
  mistake:         'اصلاح اقدام اشتباه',
} as const
export type ReasonCode = keyof typeof REASONS
export const REASON_KEYS = Object.keys(REASONS) as ReasonCode[]

/** پیامِ کاربر — بی‌جزئیاتِ داخلی (یادداشت و مدرک هرگز به کاربر نمی‌رسد) */
export function userMessage(status: AccountStatus, expiresAt: string | null): string {
  switch (status) {
    case 'suspended': return expiresAt
      ? 'حساب شما موقتا تعلیق شده است و پس از پایان مدت خودبه‌خود باز می‌شود'
      : 'حساب شما تعلیق شده است'
    case 'banned': return 'حساب شما به‌دلیل نقض قوانین بیلیارد هاب مسدود شده است'
    case 'deactivated': return 'حساب شما غیرفعال شده است'
    case 'deleted': return 'این حساب حذف شده است'
    case 'restricted': return 'حساب شما محدود شده است و فعلا فقط می‌توانید محتوا را ببینید'
    case 'limited': return 'دسترسی حساب شما به این بخش محدود شده است'
    default: return ''
  }
}
