/* بازرسیِ ایستا: تعویضِ حساب نباید تبِ دورگه بسازد.
       node scripts/test-session-identity.mjs

   ── گزارشی که این را ساخت ──
   دو تب باز بود، یکی باشگاه‌دار و یکی ادمین. با چند بار «بازگشت»،
   تبِ باشگاه‌دار تبدیل به ادمین شد.

   علتش نشتِ نشست نبود — یک مرورگر یک ظرفِ کوکی دارد، پس ورودِ دوم
   کوکیِ اول را عوض می‌کند و از آن لحظه نشستِ هر دو تب یکی است. ولی
   `SessionBridge` این را بی‌صدا می‌پذیرفت: استور را عوض می‌کرد و
   صفحه‌ای که با دادهٔ حسابِ قبلی رندر شده بود دست‌نخورده می‌ماند.

   خطرِ واقعی جهتِ عکس است: روی رایانه‌ی مشترک، صفحهٔ رندرشده‌ی نفرِ
   قبلی پس از ورودِ نفرِ بعدی روی صفحه می‌ماند. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');

let pass = 0, fail = 0;
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`);
};
const head = s => console.log(`\n■ ${s}`);

const bridge = read('components/auth/SessionBridge.tsx');
const store = read('store/auth.store.ts');

head('۱) تغییرِ هویت باید صفحه را از نو بسازد');

t('تفاوتِ شناسه تشخیص داده می‌شود',
  /cur\.id !== me\.id/.test(bridge),
  'بدونِ مقایسه‌ی شناسه، تعویضِ حساب بی‌صدا رد می‌شود');
t('واکنشش بارگذاریِ کامل است، نه فقط به‌روزرسانیِ استور',
  /cur\.id !== me\.id\s*\)\s*\{\s*reloadForIdentityChange/.test(bridge),
  'به‌روزرسانیِ استور یعنی هویتِ تازه با محتوای کهنه — تبِ دورگه');
t('مقدارِ کاربر از getState خوانده می‌شود نه از closure',
  /useAuthStore\.getState\(\)/.test(bridge),
  'closure کهنه یعنی مقایسه با مقدارِ قدیمی و تشخیصِ نادرست');

head('۲) تبِ دیگر و حافظه‌ی پشت/جلو');

t('به رویدادِ storage گوش می‌دهد',
  /addEventListener\('storage'/.test(bridge),
  'وگرنه تبِ اول تا اولین ناوبری چیزی نمی‌فهمد');
t('به pageshow گوش می‌دهد',
  /addEventListener\('pageshow'/.test(bridge),
  'bfcache صفحه را عیناً برمی‌گرداند و هیچ کدی دوباره اجرا نمی‌شود');
t('فقط بازگشتِ کش‌شده را دوباره می‌سنجد',
  /e\.persisted/.test(bridge));

head('۳) پایانِ نشست هم باید دیده شود');

t('۴۰۱ با کاربرِ موجود ⇒ بارگذاری',
  /status === 401[\s\S]{0,160}reloadForIdentityChange/.test(bridge),
  'وگرنه محتوای حسابِ خارج‌شده روی صفحه می‌ماند');

head('۴) محافظ‌ها');

t('نگهبانِ حلقه دارد', /sessionStorage[\s\S]{0,80}RELOAD_GUARD/.test(bridge),
  'تشخیصِ اشتباه نباید صفحه را بی‌نهایت بار بارگذاری کند');
t('نگهبان پس از تأیید آزاد می‌شود',
  /removeItem\(RELOAD_GUARD\)/.test(bridge),
  'وگرنه هر تب فقط یک‌بار در طولِ عمرش می‌فهمد حساب عوض شده');
t('توکن در localStorage ذخیره نمی‌شود',
  /partialize:[^\n]*\{\s*user:\s*state\.user\s*\}/.test(store),
  'نشست باید روی کوکیِ httpOnly بماند');

console.log(`\n${fail === 0 ? '✅' : '❌'}  ${pass} قبول · ${fail} رد\n`);
process.exit(fail === 0 ? 0 : 1);
