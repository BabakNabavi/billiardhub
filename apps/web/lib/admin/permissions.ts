import { sb } from '../finance/db'

/* ─────────────────────────────────────────────────────────────
   دسترسی‌های تفکیک‌شده‌ی پنل ادمین
   ─────────────────────────────────────────────────────────────

   تا امروز «ادمین» یک بله/خیر بود: هرکس ادمین می‌شد به همه‌چیز
   دسترسی داشت — مالی، تسویه، کاربران، و از همه خطرناک‌تر صفحه‌ی
   «دسترسی ادمین». یعنی هر ادمینِ تازه می‌توانست ادمینِ دیگری بسازد
   یا مالکِ سایت را از ادمینی بردارد.

   حالا هر ادمین فهرستی از کلیدها دارد و هر صفحه/مسیر کلیدِ خودش را
   می‌خواهد.

   ── سوپرادمین ──
   کسی که فهرستش `['*']` است. سه ویژگی دارد:
   ۱) به همه‌چیز دسترسی دارد
   ۲) تنها کسی است که می‌تواند دسترسیِ دیگران را عوض کند
   ۳) هیچ‌کس جز سوپرادمینِ دیگر نمی‌تواند دستش بزند — پس ادمینِ
      معمولی نمی‌تواند مالک را حذف کند یا خودش را ارتقا دهد

   ── چرا جدولِ جدا و نه ستون روی users ──
   تغییرِ دسترسی یک رویدادِ امنیتی است و باید بدانیم چه کسی و کِی
   عوضش کرده. جدولِ جدا این را نگه می‌دارد و ستون نگه نمی‌داشت.

   ── رفتار پیش از اجرای مهاجرت ──
   اگر جدول هنوز ساخته نشده باشد، همه‌ی ادمین‌ها مثل قبل دسترسیِ کامل
   دارند. این عمدی است: بینِ لحظه‌ی دیپلوی و لحظه‌ی اجرای مهاجرت،
   پنل نباید قفل شود. به‌محضِ ساخته‌شدنِ جدول، قاعده‌ی سخت‌گیرانه
   فعال می‌شود.                                                     */

export const ALL = '*'

export interface PermissionItem { key: string; label: string; hint?: string }
export interface PermissionGroup { key: string; label: string; items: PermissionItem[] }

/* هر کلید دقیقاً یک صفحه‌ی پنل است — همان تفکیکی که کاربر می‌بیند،
   نه یک دسته‌بندیِ انتزاعی که بعداً باید حدس بزند کدام صفحه را
   می‌گیرد. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'people', label: 'کاربران و دسترسی',
    items: [
      { key: 'users', label: 'مدیریت کاربران' },
      { key: 'roles', label: 'مدیریت نقش‌ها' },
      { key: 'verifications', label: 'احراز هویت' },
      { key: 'support', label: 'تیکت‌های پشتیبانی' },
    ],
  },
  {
    key: 'community', label: 'جامعه‌ی حرفه‌ای',
    items: [
      { key: 'coaches', label: 'تأیید مربیان' },
      { key: 'referees', label: 'تأیید داوران' },
      { key: 'rankings', label: 'رنکینگ بازیکنان' },
      { key: 'players', label: 'بازیکنان شاخص' },
    ],
  },
  {
    key: 'money', label: 'رزرو و مالی',
    items: [
      { key: 'bookings', label: 'مدیریت رزروها' },
      { key: 'finance', label: 'داشبورد مالی و تسویه', hint: 'شاملِ ثبتِ واریز به باشگاه‌ها و تغییرِ نرخِ کمیسیون' },
    ],
  },
  {
    key: 'business', label: 'کسب‌وکارها',
    items: [
      { key: 'clubs', label: 'تأیید باشگاه‌ها' },
      { key: 'sellers', label: 'تأیید فروشگاه‌ها' },
      { key: 'products', label: 'تأیید محصولات' },
      { key: 'manufacturers', label: 'تولیدکنندگان' },
      { key: 'technicians', label: 'متخصصان فنی' },
    ],
  },
  {
    key: 'content', label: 'محتوا، رویداد و تبلیغات',
    items: [
      { key: 'news', label: 'اخبار' },
      { key: 'tournaments', label: 'مسابقات باشگاه‌ها' },
      { key: 'events', label: 'رویدادهای رسمی' },
      { key: 'media', label: 'بیلیارد مدیا' },
      { key: 'advertising', label: 'سیستم تبلیغات' },
      { key: 'ad-plans', label: 'بسته‌های آگهی' },
      { key: 'story-plans', label: 'بسته‌های استوری' },
      { key: 'reports', label: 'گزارش‌های تخلف' },
      { key: 'features', label: 'قابلیت‌های پلتفرم' },
    ],
  },
]

export const ALL_KEYS: string[] = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key))

/* `access` عمداً در فهرستِ بالا نیست: دادنِ دسترسی به دیگران کارِ
   سوپرادمین است و نباید بشود آن را تیک زد. اگر می‌شد، اولین ادمینی
   که آن تیک را می‌گرفت می‌توانست خودش را سوپر کند. */
export const SUPER_ONLY = 'access'

const isSuper = (p: string[]) => p.includes(ALL)

/* آیا جدول ساخته شده؟ یک‌بار در هر فرایند بررسی می‌شود. */
let tableReady: boolean | null = null
async function ensureTable(): Promise<boolean> {
  if (tableReady !== null) return tableReady
  const { error } = await sb().from('admin_permissions').select('user_id').limit(1)
  tableReady = !error
  if (error) console.warn('[permissions] جدول admin_permissions هنوز نیست — همه‌ی ادمین‌ها دسترسیِ کامل دارند')
  return tableReady
}

/* دسترسی‌های یک کاربر.
   خروجی `['*']` یعنی سوپرادمین، `[]` یعنی هیچ. */
export async function permissionsOf(userId: string): Promise<string[]> {
  const { data: u } = await sb().from('users')
    .select('primaryRole,secondaryRoles').eq('id', userId).maybeSingle()
  const uu = u as { primaryRole?: string; secondaryRoles?: string[] } | null
  const admin = uu?.primaryRole === 'admin' || (uu?.secondaryRoles ?? []).includes('admin')
  if (!admin) return []

  if (!(await ensureTable())) return [ALL]   // پیش از مهاجرت: رفتار قبلی

  const { data } = await sb().from('admin_permissions')
    .select('permissions').eq('user_id', userId).maybeSingle()
  const list = (data as { permissions?: string[] } | null)?.permissions
  /* ادمینی که ردیف ندارد هنوز دسترسی‌اش تعیین نشده — هیچ می‌گیرد،
     نه همه‌چیز. پیش‌فرضِ امن مهم‌تر از راحتی است. */
  return Array.isArray(list) ? list : []
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  return isSuper(await permissionsOf(userId))
}

/* آیا این کاربر اجازه‌ی این بخش را دارد؟ */
export async function can(userId: string, key: string): Promise<boolean> {
  const p = await permissionsOf(userId)
  if (isSuper(p)) return true
  if (key === SUPER_ONLY) return false
  return p.includes(key)
}

/* نوشتنِ دسترسی — فقط از مسیرِ ادمین و پس از بررسیِ سوپربودنِ کننده. */
export async function setPermissions(userId: string, keys: string[], byUserId: string) {
  const clean = [...new Set(keys.filter(k => ALL_KEYS.includes(k)))]
  const { error } = await sb().from('admin_permissions')
    .upsert({ user_id: userId, permissions: clean, updated_at: new Date().toISOString(), updated_by: byUserId },
            { onConflict: 'user_id' })
  return { ok: !error, message: error?.message }
}
