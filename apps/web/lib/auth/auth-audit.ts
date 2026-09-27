/* ─────────────────────────────────────────────────────────────
   رویدادهای امنیتیِ احراز هویت ⟵ `audit_logs`.

   ── چرا فقط شکست، و نه ورودِ موفق ──
   ورودِ موفق از قبل ثبت می‌شود: `issueSession` یک ردیف در `sessions`
   می‌سازد با `ip`، `user_agent`، `origin` و زمان. خروج هم پاک
   نمی‌شود بلکه `revoked_at`/`revoked_reason` می‌گیرد. پس تاریخچه‌ی
   ورود/خروج هست و نوشتنِ دوباره‌اش این‌جا فقط حجم اضافه می‌کرد.

   چیزی که **هیچ‌جا** نبود، تلاشِ ناموفق است: `login_attempts` یک
   شمارنده است نه ژورنال — یک ردیف به ازای هر (scope, subject) که
   مدام به‌روز می‌شود و تاریخچه‌اش را می‌بلعد. یعنی «دیشب این حساب
   چند بار و از کدام IPها حمله شد؟» اصلا قابلِ پرسیدن نبود.

   ⚠️ هیچ‌کدام از این توابع throw نمی‌کند. ثبتِ ممیزی نباید مسیرِ
   ورود را بشکند؛ اگر ژورنال از کار بیفتد، ورود باید کار کند.
   ───────────────────────────────────────────────────────────── */

import { audit } from '../finance/db'

/* ⚠️ رشته‌ی آزاد ننویس. صفحه‌ی `/admin/logs` از همین فهرست دکمه‌ی
   فیلتر می‌سازد، و یک غلطِ تایپی یعنی رویدادی که ثبت می‌شود ولی
   هیچ‌وقت در فیلتر دیده نمی‌شود — بدترین حالتِ ممکن برای یک ژورنال. */
export const AUTH_ACTIONS = {
  /** رمز یا شماره‌ی نادرست */
  LOGIN_FAILED: 'LOGIN_FAILED',
  /** آستانه رد شد و حساب/IP قفل شد */
  LOGIN_LOCKED: 'LOGIN_LOCKED',
} as const

/**
 * پوشاندنِ شماره برای ثبت در ژورنال.
 *
 * ⚠️ شماره‌ی خام هرگز در `audit_logs` نمی‌نشیند. آن جدول هرس نمی‌شود،
 * پس هر PIIی که واردش شود برای همیشه می‌ماند — همان درسی که مهاجرتِ
 * ۰۹۹ برای جدولِ OTP گرفت و مجبور شد هرسش کند.
 *
 * چهار رقمِ اول (پیش‌شماره‌ی اپراتور) و سه رقمِ آخر می‌ماند.
 *
 * ⚠️ این **گمنام‌سازی نیست** و نباید این‌طور حساب شود: چهار رقمِ
 * پوشانده یعنی ۱۰٬۰۰۰ حالت، که با دانستنِ پیش‌شماره و سه رقمِ آخر
 * قابلِ جست‌وجوست. هدفش فقط این است که شماره‌ی خام در جدولی که هرگز
 * هرس نمی‌شود ننشیند، و بتوان فهمید «همان شماره دوباره». اگر روزی
 * گمنام‌سازیِ واقعی لازم شد، هشِ کلیددار جایش است نه این.
 * IP عمدا پوشانده **نمی‌شود** — بدونِ آن این ژورنال برای بررسیِ
 * نفوذ بی‌فایده است.
 */
export function maskPhone(raw: string | null | undefined): string {
  const s = String(raw ?? '').trim()
  if (!s) return '—'
  if (s.length <= 7) return '*'.repeat(s.length)
  return `${s.slice(0, 4)}${'*'.repeat(s.length - 7)}${s.slice(-3)}`
}

/**
 * ثبتِ یک تلاشِ ناموفقِ ورود.
 *
 * `userId` وقتی داده می‌شود که شماره واقعا حساب دارد. آن‌وقت شماره
 * اصلا ذخیره نمی‌شود چون `actor_id` گویاتر و کم‌خطرتر است؛ فقط برای
 * شماره‌ی ناموجود نسخه‌ی پوشانده می‌نشیند.
 */
export async function recordLoginFailure(opts: {
  account: string
  ip?: string | null
  userAgent?: string | null
  userId?: string | null
  /** همین حالا قفل بسته شد؟ */
  locked?: boolean
}): Promise<void> {
  const known = !!opts.userId
  const base = {
    ip: opts.ip ?? null,
    userAgent: opts.userAgent ?? null,
    actorId: opts.userId ?? undefined,
    entityType: known ? 'user' : 'phone',
    entityId: known ? opts.userId! : maskPhone(opts.account),
  }

  await audit({
    ...base,
    action: AUTH_ACTIONS.LOGIN_FAILED,
    /* ⚠️ `accountExists` خودش داده‌ی بررسی است: انبوهی از
       LOGIN_FAILEDِ «شماره‌ی ناموجود» یعنی کسی دارد فهرستِ شماره
       می‌آزماید، نه اینکه یک کاربر رمزش را فراموش کرده. */
    newValue: { accountExists: known },
  })

  if (opts.locked) {
    await audit({
      ...base,
      action: AUTH_ACTIONS.LOGIN_LOCKED,
      newValue: { accountExists: known },
    })
  }
}
