/* بازسازیِ «قیمت قبل از تخفیف» برای آگهی‌های قدیمی.

       node scripts/fix-ad-discounts.mjs            # فقط گزارش
       node scripts/fix-ad-discounts.mjs --apply    # واقعاً بنویس

   ── چرا ──
   تا امروز مسیرِ ثبتِ آگهی `price` را قیمتِ **تخفیف‌خورده** می‌نوشت و
   `discountPrice` را هم کپیِ همان. یعنی قیمتِ قبل از تخفیف که
   فروشنده تایپ کرده بود هیچ‌جا ذخیره نمی‌شد و صفحه‌ها عددِ خط‌خورده
   را از روی درصدِ **گردشده** بازمی‌ساختند:

       ۷۵۰٬۰۰۰٬۰۰۰ با ٪۹  ⇒  ۸۲۴٬۱۷۵٬۸۲۴   (هیچ‌کس این را تایپ نکرده)

   قراردادِ درست — که بقیه‌ی پروژه از قبل دارد — این است: `price`
   قیمتِ خط‌خورده و `discountPrice` قیمتِ پرداختی. کد اصلاح شد؛ این
   اسکریپت ردیف‌های قدیمی را به همان شکل می‌آورد.

   ── صداقت درباره‌ی دقت ──
   عددِ اصلی **واقعاً از دست رفته** است؛ یک درصدِ صحیح نمی‌تواند نگهش
   دارد. این اسکریپت بازسازی می‌کند و بعد به نزدیک‌ترین عددِ گردِ
   منطقی می‌بردش (۸۲۴٬۱۷۵٬۸۲۴ ⇒ ۸۲۵٬۰۰۰٬۰۰۰). این یک **حدس** است، نه
   داده‌ی بازیابی‌شده. برای همین پیش‌فرض فقط گزارش می‌دهد: اول عددها
   را ببین، و اگر جایی حدس درست نبود، فروشنده با یک‌بار ویرایشِ آگهی
   عددِ دقیق را می‌گذارد.
*/

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');

const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }),
);
const URL_BASE = (env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_KEY ?? '';
if (!URL_BASE || !KEY) { console.error('✗ کلیدهای Supabase در .env.local نیست'); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const fmt = n => n.toLocaleString('en-US');

/* نزدیک‌ترین عددِ گرد، متناسب با بزرگیِ خودِ عدد:
   ۸۲۴٬۱۷۵٬۸۲۴ ⇒ گامِ ۵٬۰۰۰٬۰۰۰ ⇒ ۸۲۵٬۰۰۰٬۰۰۰
   ۵٬۴۸۷٬۸۰۵   ⇒ گامِ ۵۰٬۰۰۰    ⇒ ۵٬۵۰۰٬۰۰۰ */
const roundNice = v => {
  if (v <= 0) return v;
  const step = Math.max(1, 5 * 10 ** (Math.floor(Math.log10(v)) - 2));
  return Math.round(v / step) * step;
};

const r = await fetch(
  `${URL_BASE}/rest/v1/products?select=id,title,price,"discountPrice","discountPercent"&order=id&limit=500`,
  { headers: H },
);
if (!r.ok) { console.error('✗ خواندنِ ردیف‌ها:', r.status, (await r.text()).slice(0, 200)); process.exit(1); }
const rows = await r.json();

let need = 0, done = 0, failed = 0;

for (const row of rows) {
  const price = Number(row.price) || 0;
  const paid = Number(row.discountPrice) || 0;
  const pct = Number(row.discountPercent) || 0;

  /* ردیفِ سالم: قیمتِ پرداختی واقعاً کمتر از قیمتِ فهرست است */
  if (paid > 0 && paid < price) continue;
  /* بدونِ تخفیف — کاری ندارد */
  if (pct <= 0 || pct >= 100) continue;

  /* الگویِ خرابِ قدیمی: price همان پرداختی است (یا discountPrice
     کپیِ آن) ولی درصدِ تخفیف ثبت شده. */
  need++;
  const rebuilt = roundNice(Math.round(price / (1 - pct / 100)));
  /* درصد از روی دو عددِ تازه بازحساب می‌شود تا نشانِ کارت با
     اختلافِ واقعی بخواند. */
  const newPct = Math.round(((rebuilt - price) / rebuilt) * 100);

  console.log(`  ${row.title ?? row.id}`);
  console.log(`      پرداختی: ${fmt(price)}   ٪${pct}`);
  console.log(`      قیمتِ قبل از تخفیف (حدسی): ${fmt(rebuilt)}   ⇒ ٪${newPct}`);

  if (!APPLY) continue;

  const u = await fetch(`${URL_BASE}/rest/v1/products?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ price: rebuilt, discountPrice: price, discountPercent: newPct }),
  });
  if (u.ok) done++;
  else { failed++; console.log(`      ! نوشتن نشد — ${u.status} ${(await u.text()).slice(0, 90)}`); }
}

console.log('\n── خلاصه ──');
console.log(`ردیف‌های بررسی‌شده: ${rows.length}`);
console.log(`نیازمندِ اصلاح: ${need}` + (APPLY ? `   اصلاح‌شده: ${done}   ناموفق: ${failed}` : ''));
console.log(APPLY
  ? '\n✅ انجام شد. عددهای «قبل از تخفیف» حدسی‌اند — با یک‌بار ویرایشِ آگهی دقیق می‌شوند.'
  : '\nℹ️  فقط گزارش بود. برای نوشتن: node scripts/fix-ad-discounts.mjs --apply');
