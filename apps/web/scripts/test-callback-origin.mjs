/* بازرسیِ ایستا: نشانیِ بازگشتِ درگاه هرگز از درخواست ساخته نشود.
       node scripts/test-callback-origin.mjs

   ── باگی که این را ساخت ──
   هفت مسیرِ پرداخت `req.nextUrl.origin` را می‌ساختند. روی Vercel درست
   بود چون خودش هدرها را بازنویسی می‌کرد. پشتِ nginx، Next فقط نشانیِ
   داخلی را می‌بیند: `http://localhost:3000`.

   کاربر پول را داد، درگاه او را به `localhost` برگرداند، مرورگر
   ERR_CONNECTION_REFUSED داد، و **رزرو هیچ‌وقت قطعی نشد** — در حالی
   که پول کم شده بود. بدترین نوعِ باگ در یک مسیرِ مالی.

   دو نکته که این را نامرئی کرده بود:
     • تا وقتی روی Vercel بودیم هرگز بروز نمی‌کرد
     • تایپ‌چک و بیلد هیچ‌کدام نمی‌گیرندش
*/

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '  ← ' + extra}`);
};

/* هر فایلی زیرِ app/api که نشانیِ بازگشت می‌سازد */
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e === 'route.ts') out.push(p);
  }
  return out;
}

const routes = walk(join(ROOT, 'app', 'api'));
console.log(`\n■ ${routes.length} مسیرِ API بررسی شد\n`);

/* ── قاعده ──
   هر جا `callbackUrl` یا `returnUrl` ساخته می‌شود، مبدأش نباید از
   درخواست بیاید. دو دلیل: پشتِ پروکسی غلط است، و قابلِ جعل هم هست —
   مهاجم می‌تواند کاربر را پس از پرداخت به دامنه‌ی خودش بفرستد. */
const fromRequest = src =>
  /nextUrl\.origin/.test(src)
  || /\burl\.origin\b/.test(src)
  || /headers\.get\(['"]origin['"]\)/.test(src)
  || /headers\.get\(['"]x-forwarded-host['"]\)/i.test(src);

const offenders = [];
for (const p of routes) {
  const src = readFileSync(p, 'utf8');
  const buildsCallback = /(callbackUrl|returnUrl|callback_url)\s*[:=]/.test(src);
  if (!buildsCallback) continue;
  if (fromRequest(src)) offenders.push(relative(ROOT, p).replace(/\\/g, '/'));
}

t('هیچ مسیرِ پرداختی مبدأ را از درخواست نمی‌سازد',
  offenders.length === 0,
  offenders.join(' · '));

/* ── لایه‌ی دوم ──
   نسخه‌ی اول فقط نشانیِ *رفت* را می‌گرفت. ولی خودِ مسیرِ کالبک هم پس از
   تأییدِ پرداخت کاربر را با ۳۰۳ به صفحه‌ی نتیجه می‌فرستد — و آن هم از
   `url.origin` ساخته می‌شد.

   نتیجه‌اش موذی‌تر بود: پرداخت **واقعاً تأیید می‌شد** و در دیتابیس
   `PAID` می‌نشست، ولی کاربر روی `localhost` می‌افتاد و فکر می‌کرد
   پرداختش شکست خورده. */
const redirectors = [];
for (const p of routes) {
  if (!/[\\/]callback[\\/]/.test(p)) continue;
  const src = readFileSync(p, 'utf8');
  if (/NextResponse\.redirect/.test(src) && fromRequest(src)) {
    redirectors.push(relative(ROOT, p).replace(/\\/g, '/'));
  }
}
t('هیچ کالبکی کاربر را به مبدأِ درخواست برنمی‌گرداند',
  redirectors.length === 0,
  redirectors.join(' · '));

const siteUrl = readFileSync(join(ROOT, 'lib', 'site-url.ts'), 'utf8');
t('`callbackOrigin()` وجود دارد', /export function callbackOrigin/.test(siteUrl));
t('از SITE_URL می‌خواند، نه از درخواست',
  /callbackOrigin[\s\S]{0,120}return SITE_URL/.test(siteUrl));

/* مسیرهایی که واقعاً پرداخت می‌سازند باید از همان تابع استفاده کنند */
const PAY = [
  'app/api/payments/create/route.ts',
  'app/api/ads/campaigns/buy/route.ts',
  'app/api/ads/plans/buy/route.ts',
  'app/api/stories/plans/buy/route.ts',
  'app/api/tournaments/[id]/register/route.ts',
  'app/api/clubs/[id]/sms/route.ts',
];
for (const rel of PAY) {
  try {
    const s = readFileSync(join(ROOT, rel), 'utf8');
    t(`${rel.split('/').slice(2).join('/')} از callbackOrigin استفاده می‌کند`,
      /callbackOrigin\(\)/.test(s));
  } catch { t(rel, false, 'فایل پیدا نشد'); }
}

console.log(`\n${fail === 0 ? '✅' : '❌'}  ${pass} قبول · ${fail} رد\n`);
process.exit(fail === 0 ? 0 : 1);
