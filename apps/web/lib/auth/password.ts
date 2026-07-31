/* ─────────────────────────────────────────────────────────────
   سیاست رمز عبور — یک منبع واحد برای ثبت‌نام، بازیابی و تغییر رمز.

   قواعد از همان چیزی می‌آید که رابط ثبت‌نام امروز به کاربر می‌گوید،
   تا پیام و واقعیت یکی باشد: حداقل ۸ نویسه با حرف بزرگ، حرف کوچک،
   عدد و نویسه‌ی ویژه. به‌علاوه رمزهای بسیار رایج رد می‌شوند.
   ───────────────────────────────────────────────────────────── */

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72          // سقف ذاتی bcrypt (بایت)

/* فهرست کوتاه ولی پرمصرف‌ترین‌ها. هدف گرفتن حدس‌های اول هر مهاجم
   است، نه جایگزینی یک دیکشنری کامل. */
const COMMON = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwerty123', 'qwertyui', 'iloveyou', 'admin123', 'welcome1', 'abcd1234',
  'passw0rd', 'p@ssw0rd', 'billiard', 'billiard1', 'billiard123',
  '11111111', '00000000', 'aaaaaaaa', 'asdfghjk', 'zxcvbnm1',
])

export interface PasswordCheck { ok: boolean; message?: string }

/** اعتبارسنجی سرورساید رمز — هرگز فقط به رابط اعتماد نکن */
export function checkPassword(pw: unknown): PasswordCheck {
  const s = typeof pw === 'string' ? pw : ''
  if (s.length < PASSWORD_MIN) return { ok: false, message: `رمز عبور باید حداقل ${PASSWORD_MIN} نویسه باشد` }
  if (Buffer.byteLength(s, 'utf8') > PASSWORD_MAX) return { ok: false, message: 'رمز عبور بیش از حد بلند است' }
  if (!/[a-z]/.test(s)) return { ok: false, message: 'رمز عبور باید حرف کوچک انگلیسی داشته باشد' }
  if (!/[A-Z]/.test(s)) return { ok: false, message: 'رمز عبور باید حرف بزرگ انگلیسی داشته باشد' }
  if (!/[0-9]/.test(s)) return { ok: false, message: 'رمز عبور باید عدد داشته باشد' }
  if (!/[^A-Za-z0-9]/.test(s)) return { ok: false, message: 'رمز عبور باید نویسه‌ی ویژه (مثلاً ! یا @) داشته باشد' }

  /* رمزهای رایج — بدون حساسیت به بزرگ/کوچکی و بدون پسوندهای ساده */
  const norm = s.toLowerCase().replace(/[!@#$%^&*._-]+$/, '')
  if (COMMON.has(norm)) return { ok: false, message: 'این رمز عبور بسیار رایج است؛ رمز دیگری انتخاب کنید' }
  if (/^(.)\1+$/.test(s)) return { ok: false, message: 'رمز عبور نباید تکرار یک نویسه باشد' }

  return { ok: true }
}
