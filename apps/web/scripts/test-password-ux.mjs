/* بازرسیِ ایستا: قواعدِ فیلدِ رمز و کدِ تأیید.
       node scripts/test-password-ux.mjs

   هر کدام از این‌ها یک‌بار به‌صورت گزارشِ کاربر رسید، نه از تست: رمزی که
   با کیبوردِ فارسی تایپ می‌شد و فقط «اطلاعات ورود صحیح نیست» می‌گرفت،
   خط‌تیره‌های کجِ فیلدِ کد، و رمزِ اشتباهی که در فیلد می‌ماند. */

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

const login   = read('app/login/page.tsx');
const forgot  = read('app/forgot-password/page.tsx');
const change  = read('components/auth/ChangePassword.tsx');
const register = read('app/register/page.tsx');
const identity = read('components/IdentityVerify.tsx');
const guard   = read('lib/auth/login-guard.ts');

// ───────────────────────────────────────────────────────────────────────────
head('۱) هشدارِ کیبوردِ فارسی روی هر فیلدِ رمز');

for (const [label, src] of [
  ['ورود', login], ['بازیابی رمز', forgot], ['تغییر رمز', change], ['ثبت‌نام', register],
]) {
  t(`${label} از تشخیصِ مشترک استفاده می‌کند`, /passwordHint/.test(src),
    'نسخه‌ی جدا یعنی یکی از فرم‌ها روزی عقب می‌ماند');
}
t('ورود جلوی ارسالِ رمزِ فارسی را می‌گیرد',
  /hint\.persian[\s\S]{0,160}return/.test(login),
  'وگرنه یکی از پنج تلاشِ مجاز بی‌دلیل می‌سوزد');
t('ساختِ رمزِ فارسی هم مسدود است',
  /hint\.persian/.test(forgot) && /hint\.persian/.test(change),
  'رمزِ فارسی یعنی کاربر خودش را از حساب بیرون می‌کند');

// ───────────────────────────────────────────────────────────────────────────
head('۲) وسط‌چینِ فیلدِ کدِ تأیید');

/* letter-spacing پس از آخرین نویسه هم فاصله می‌گذارد، پس جبرانِ درست
   **نصفِ** آن است. مقدارِ کامل به همان اندازه به سمتِ دیگر کج می‌کند. */
t('بازیابی رمز: تورفتگی نصفِ letter-spacing است',
  /letter-spacing: 8px; text-indent: 4px/.test(forgot),
  'مقدارِ کامل ⇒ کجیِ برابر به سمتِ مخالف');
t('جای‌نگهدارِ کد قاعده‌ی خودش را دارد',
  /\.au-inp\.otp::placeholder/.test(forgot),
  'قاعده‌ی عمومی letter-spacing را خنثی می‌کند و جبران بی‌اثر می‌ماند');

for (const [label, src] of [['ثبت‌نام', register], ['احراز هویت', identity]]) {
  t(`${label}: تورفتگی 0.25em برای letter-spacing 0.5em`,
    /letterSpacing: '0\.5em', textIndent: '0\.25em'/.test(src));
}
t('جای‌نگهدارها فاصله‌ی دستی ندارند',
  ![login, forgot, register, identity].some(s => s.includes('"- - - - -"')),
  'پنج خط‌تیره با فاصله می‌شود نُه نویسه و با پنج رقم هم‌تراز نمی‌ماند');

// ───────────────────────────────────────────────────────────────────────────
head('۳) رمزِ اشتباه در فیلد نمی‌ماند');

t('ورود پس از رمزِ غلط فیلد را پاک می‌کند',
  /isCredentialError[\s\S]{0,200}setPassword\(''\)/.test(login),
  'کاربر نقطه‌ها را نمی‌بیند، پس نمی‌تواند اصلاحش کند');
t('تغییرِ رمز هم رمزِ فعلیِ غلط را پاک می‌کند',
  /setCurrent\(''\)/.test(change));

// ───────────────────────────────────────────────────────────────────────────
head('۴) واژه‌ی «تازه» جای خود را به «جدید» داد');

for (const [label, src] of [
  ['بازیابی رمز', forgot], ['تغییر رمز', change],
  ['API تغییر رمز', read('app/api/auth/change-password/route.ts')],
]) {
  t(`${label}: «رمز تازه» نمانده`, !src.includes('رمز تازه'));
}

// ───────────────────────────────────────────────────────────────────────────
head('۵) سقفِ تلاشِ ناموفق');

const m = guard.match(/LOGIN_FAIL_THRESHOLD,\s*(\d+)/);
t(`آستانه ۵ است (${m?.[1] ?? '؟'})`, m?.[1] === '5');

// ───────────────────────────────────────────────────────────────────────────
console.log(`\n${fail === 0 ? '✅' : '❌'}  ${pass} قبول · ${fail} رد\n`);
process.exit(fail === 0 ? 0 : 1);
