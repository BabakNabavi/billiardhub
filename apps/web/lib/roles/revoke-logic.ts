/* ─────────────────────────────────────────────────────────────
   منطقِ خالصِ «برداشتنِ نقش» — بی هیچ import، تا آزمون مستقیم بخواندش
   (scripts/test-role-revoke.mjs) و کلاینت هم بتواند برچسب‌ها را بسازد.

   ── نقش کجا زندگی می‌کند ──
   «داشتنِ نقش» یعنی بودنِ آن در `users.primaryRole`/`secondaryRoles`.
   تاریخچه‌اش در `role_requests` است (draft ⟵ pending ⟵ approved/rejected)
   و ردپای عمومی‌اش در `profiles` (هر نوع یک ردیف) و برای باشگاه‌دار در `clubs`.
   برداشتن باید هر سه را هم‌زمان سازگار کند؛ پیش‌تر فقط ستونِ نقش عوض
   می‌شد و صفحه‌ی عمومیِ مربی سرِ جایش می‌ماند.

   ── ردِ تصمیم بی مهاجرت ──
   CHECKِ `role_requests.status` فقط draft/pending/approved/rejected
   است (مهاجرتِ ۰۶۲). پس برداشتن به‌صورتِ `rejected` با یادداشتی ثبت
   می‌شود که با یکی از دو پیشوندِ زیر شروع می‌شود. ردِ مدیریت همان
   «قفل» است: تا بازگردانده نشود، کاربر خودش نمی‌تواند نقش را دوباره
   بگیرد. ردِ معمولیِ یک درخواست (بی پیشوند) قفل نمی‌کند — کاربر باید
   بتواند اصلاح کند و دوباره بفرستد.
   ───────────────────────────────────────────────────────────── */

/** نقش‌هایی که برداشتنی‌اند. `user` حالتِ بی‌نقشی است و `admin` فقط از /admin/access */
export const REVOCABLE_ROLES = [
  'player', 'coach', 'referee', 'technician', 'seller', 'manufacturer', 'club_owner',
] as const
export type RevocableRole = (typeof REVOCABLE_ROLES)[number]

export const isRevocable = (r: unknown): r is RevocableRole =>
  typeof r === 'string' && (REVOCABLE_ROLES as readonly string[]).includes(r)

/** نقش‌هایی که پروفایلِ عمومی در جدولِ `profiles` دارند (باشگاه‌دار باشگاه دارد، نه پروفایل) */
export const PROFILE_ROLES: readonly string[] = ['player', 'coach', 'referee', 'technician', 'seller', 'manufacturer']

/* ⚠️ این رشته‌ها کلیدِ تشخیص‌اند؛ عوض‌کردنشان قفل‌های ثبت‌شده را بی‌اثر می‌کند */
export const ADMIN_REVOKE_PREFIX = 'نقش توسط مدیریت برداشته شد'
export const SELF_REVOKE_PREFIX = 'نقش با درخواست خود کاربر برداشته شد'
/* ردیفِ قفل پس از بازگرداندن همین یادداشت را می‌گیرد — بی پیشوندِ قفل، پس دیگر قفل نیست */
export const ADMIN_RESTORED_NOTE = 'نقش توسط مدیریت بازگردانده شد'

/* ── کدام پروفایل را برداشتن پنهان کرد ──
   فقط پروفایلی که *خودِ* برداشتن پنهانش کرده با برگشتنِ نقش به صفِ بررسی برمی‌گردد؛
   پروفایلی که ادمین پیش‌تر برای محتوایش رد کرده بود باید ردشده بماند. این برچسب در
   یادداشتِ همان ردیف می‌نشیند و پس از برگشت به PROFILE_REQUEUED_TAG عوض می‌شود تا
   یک‌بار مصرف شود. (بی ستونِ تازه — مهاجرت تأییدِ جدا می‌خواهد) */
export const PROFILE_HIDDEN_TAG = '(پروفایل پنهان شد)'
export const PROFILE_REQUEUED_TAG = '(پروفایل به صف بررسی برگشت)'

export const LOCKED_MESSAGE =
  'این نقش را مدیریت سایت از حساب شما برداشته است؛ برای بررسی دوباره از بخش پشتیبانی پیگیری کنید'

export const adminRevokeNote = (reason: string, profileHidden = false): string =>
  `${ADMIN_REVOKE_PREFIX}${profileHidden ? ' ' + PROFILE_HIDDEN_TAG : ''}: ${reason.trim()}`.slice(0, 500)

export const selfRevokeNote = (profileHidden = false): string =>
  `${SELF_REVOKE_PREFIX}${profileHidden ? ' ' + PROFILE_HIDDEN_TAG : ''}`

export const noteHidProfile = (note: unknown): boolean =>
  typeof note === 'string' && note.includes(PROFILE_HIDDEN_TAG)

/** برچسبِ «پنهان شد» ⟵ «به صف برگشت» (مصرفِ یک‌باره) */
export const markProfileRequeued = (note: string): string =>
  note.replace(PROFILE_HIDDEN_TAG, PROFILE_REQUEUED_TAG)

export type RevocationKind = 'admin' | 'self' | null

/** برچسبِ یک ردیفِ تاریخچه برای کاربر — حذفِ خودش «ردشده» خوانده نشود */
export function requestStatusLabel(status: string, note: unknown): string {
  const kind = revocationKindOf(note)
  if (kind === 'admin') return 'برداشته‌شده توسط مدیریت'
  if (kind === 'self') return 'حذف‌شده'
  return ({ draft: 'پروفایل تکمیل نشده', pending: 'در انتظار تأیید', approved: 'تأیید شده', rejected: 'رد شده' } as Record<string, string>)[status] ?? status
}

/** یادداشتِ یک ردیفِ `role_requests` ⟵ آیا برداشتنِ نقش بوده و به دستِ چه کسی */
export function revocationKindOf(note: unknown): RevocationKind {
  const s = typeof note === 'string' ? note.trim() : ''
  if (s.startsWith(ADMIN_REVOKE_PREFIX)) return 'admin'
  if (s.startsWith(SELF_REVOKE_PREFIX)) return 'self'
  return null
}

/** دلیلِ ادمین بی پیشوند و بی برچسب — برای نمایش به کاربر */
export function revokeReasonOf(note: unknown): string {
  const s = typeof note === 'string' ? note.trim() : ''
  if (!s.startsWith(ADMIN_REVOKE_PREFIX)) return ''
  return s.slice(ADMIN_REVOKE_PREFIX.length)
    .replace(/^\s*\([^)]*\)/, '')
    .replace(/^\s*[:：]\s*/, '').trim()
}

export interface RoleColumns { primaryRole: string; secondaryRoles: string[] }

/** نقش‌های فعلی (اصلی + فرعی) بی تکرار و بی «کاربر عادی» */
export function ownedRoles(cur: { primaryRole?: string | null; secondaryRoles?: string[] | null }): string[] {
  return [...new Set([cur.primaryRole, ...(cur.secondaryRoles ?? [])]
    .filter((r): r is string => !!r && r !== 'user'))]
}

/* ستون‌ها پس از برداشتنِ یک نقش.
   اگر همان نقش اصلی بود، نخستین نقشِ باقی‌مانده‌ی غیرادمین جایش می‌نشیند؛ اگر
   فقط ادمینِ فرعی ماند، `admin` — چون proxy درِ /admin را با نقشِ اصلیِ توکن
   باز می‌کند و `user` ادمین را از پنلش بیرون می‌انداخت — وگرنه `user`.
   ⚠️ ادمینِ اصلی هرگز جابه‌جا نمی‌شود: نقشِ برداشتنی هیچ‌وقت `admin` نیست. */
export function removeRoleFrom(
  cur: { primaryRole?: string | null; secondaryRoles?: string[] | null },
  role: string,
): RoleColumns {
  const secondaryRoles = [...new Set((cur.secondaryRoles ?? []).filter(r => !!r && r !== role))]
  const primary = cur.primaryRole || 'user'
  const primaryRole = primary === role
    ? (secondaryRoles.find(r => r !== 'admin' && r !== 'user') ?? (secondaryRoles.includes('admin') ? 'admin' : 'user'))
    : primary
  return { primaryRole, secondaryRoles }
}

/* پیامدهای برداشتن — یک متن برای پنجره‌ی تأییدِ کاربر و ادمین، هم‌خوان با lib/roles/revoke.
   بی نقطه‌ی پایانی و بی اعراب (قاعده‌ی متنِ سایت) */
export function revokeConsequences(role: string, mode: 'self' | 'admin'): string[] {
  const out: string[] = []
  if (PROFILE_ROLES.includes(role)) out.push('پروفایل عمومی این نقش از سایت برداشته می‌شود، ولی پاک نمی‌شود')
  if (PROFILE_ROLES.includes(role) && mode === 'admin') out.push('تیک آبی و تأیید جواز پروفایل هم برداشته می‌شود')
  if (role === 'club_owner') {
    out.push('تا وقتی باشگاه تأییدشده‌ای به نام این حساب هست، این نقش برداشته نمی‌شود')
    out.push('باشگاه‌هایی که هنوز در انتظار تأیید هستند رد می‌شوند')
  }
  if (role === 'seller' && mode === 'admin') out.push('نشان فروشگاه رسمی از آگهی‌های این کاربر برداشته می‌شود')
  out.push(mode === 'admin'
    ? 'کاربر تا وقتی نقش را بازنگردانید نمی‌تواند خودش دوباره این نقش را بگیرد'
    : 'هر وقت بخواهید می‌توانید دوباره این نقش را انتخاب کنید و پروفایلتان دوباره بررسی می‌شود')
  return out
}

/* ستون‌ها پس از دادنِ دوباره‌ی نقش — همان قاعده‌ی مسیرهای تأیید:
   نقشِ اصلی فقط وقتی جابه‌جا می‌شود که هنوز نقشِ معناداری ندارد */
export function addRoleTo(
  cur: { primaryRole?: string | null; secondaryRoles?: string[] | null },
  role: string,
): RoleColumns {
  const secondaryRoles = [...new Set([...(cur.secondaryRoles ?? []), role].filter(Boolean))]
  const promote = !cur.primaryRole || cur.primaryRole === 'user'
  return { primaryRole: promote ? role : (cur.primaryRole as string), secondaryRoles }
}
