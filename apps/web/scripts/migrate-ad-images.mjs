/* انتقالِ عکس‌های آگهی از دیتابیس به Storage.

       node scripts/migrate-ad-images.mjs            # فقط گزارش
       node scripts/migrate-ad-images.mjs --apply    # واقعاً منتقل کن

   ── چرا ──
   فرمِ ثبتِ آگهی عکس را با FileReader به base64 تبدیل می‌کرد و همان
   رشته در ستونِ `images` ذخیره می‌شد. یعنی عکسِ دومگابایتی حدودِ ۲٫۷
   مگابایت **متن** داخلِ خودِ ردیف.

   سه‌جا هزینه داشت: `/api/market/ads` در هر بارگذاریِ بازار همه‌ی آن
   متن‌ها را برمی‌گرداند، مرورگر نمی‌تواند data URI را کش کند، و
   پشتیبانِ شبانه هم همان حجم را می‌برد.

   مسیرِ نوشتن از این پس نشانی ذخیره می‌کند (lib/market/images.ts).
   این اسکریپت همان کار را برای آگهی‌های موجود انجام می‌دهد.

   ── قاعده‌ی ایمنی ──
   عکسی که آپلودش نشد، **همان‌طور که بود می‌ماند**. هیچ آگهی‌ای در این
   انتقال عکسش را از دست نمی‌دهد؛ بدترین حالت این است که ردیفی
   دست‌نخورده بماند و دفعه‌ی بعد دوباره تلاش شود.
*/

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');

/* ── env ── */
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
const URL_BASE = (env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_KEY ?? '';
if (!URL_BASE || !KEY) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL یا کلیدِ سرویس در .env.local نیست');
  process.exit(1);
}
const BUCKET = 'club-media';
const PUBLIC_PREFIX = `${URL_BASE}/storage/v1/object/public/`;

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const fa = n => n.toLocaleString('fa-IR');
const mb = b => `${(b / 1048576).toFixed(2)} مگابایت`;

/* ── نوعِ فایل از خودِ بایت‌ها، نه از برچسبِ data URI ──
   همان قاعده‌ی `lib/upload/policy.ts`. SVG عمداً نیست: می‌تواند
   اسکریپت داشته باشد. */
const sniff = b => {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { mime: 'image/png', ext: 'png' };
  if (b.subarray(0, 3).toString('latin1') === 'GIF') return { mime: 'image/gif', ext: 'gif' };
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP')
    return { mime: 'image/webp', ext: 'webp' };
  return null;
};

const isData = s => typeof s === 'string' && s.startsWith('data:');

async function uploadOne(dataUri, adId, seq) {
  const m = /^data:[^;,]+;base64,([\s\S]+)$/.exec(dataUri.trim());
  if (!m) return { ok: false, why: 'data URI ناخوانا' };

  let bytes;
  try { bytes = Buffer.from(m[1].replace(/\s/g, ''), 'base64'); }
  catch { return { ok: false, why: 'base64 معتبر نیست' }; }

  const kind = sniff(bytes);
  if (!kind) return { ok: false, why: 'نوعِ تصویر شناسایی نشد' };
  if (bytes.byteLength > 8 * 1024 * 1024) return { ok: false, why: 'بزرگ‌تر از ۸ مگابایت' };

  const path = `products/legacy-${adId}-${seq}.${kind.ext}`;
  if (!APPLY) return { ok: true, url: PUBLIC_PREFIX + BUCKET + '/' + path, bytes: bytes.byteLength, dry: true };

  const r = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': kind.mime, 'cache-control': '31536000', 'x-upsert': 'true' },
    body: bytes,
  });
  if (!r.ok) return { ok: false, why: `Storage ${r.status}: ${(await r.text()).slice(0, 120)}` };

  return { ok: true, url: PUBLIC_PREFIX + BUCKET + '/' + path, bytes: bytes.byteLength };
}

/* ── ردیف‌ها صفحه‌صفحه خوانده می‌شوند ──
   خودِ همین ستون چند مگابایت در هر ردیف است؛ خواندنِ هزار ردیف با
   هم، همان مشکلی است که داریم رفعش می‌کنیم. */
const PAGE = 10;

let scanned = 0, touched = 0, moved = 0, failed = 0, before = 0, after = 0;
const problems = [];

for (let offset = 0; ; offset += PAGE) {
  const r = await fetch(
    `${URL_BASE}/rest/v1/products?select=id,title,images&order=id&limit=${PAGE}&offset=${offset}`,
    { headers: H },
  );
  if (!r.ok) { console.error('✗ خواندنِ ردیف‌ها:', r.status, (await r.text()).slice(0, 200)); process.exit(1); }
  const rows = await r.json();
  if (!Array.isArray(rows) || rows.length === 0) break;

  for (const row of rows) {
    scanned++;
    const imgs = Array.isArray(row.images) ? row.images : [];
    if (!imgs.some(isData)) continue;

    touched++;
    const out = [];
    let rowBefore = 0, rowAfter = 0, allOk = true;

    for (let i = 0; i < imgs.length; i++) {
      const s = imgs[i];
      if (typeof s !== 'string' || !s) continue;
      if (!isData(s)) { out.push(s); rowBefore += s.length; rowAfter += s.length; continue; }

      rowBefore += s.length;
      const res = await uploadOne(s, row.id, i);
      if (res.ok) {
        out.push(res.url);
        rowAfter += res.url.length;
        moved++;
      } else {
        /* عکس سرِ جایش می‌ماند — بهتر از گم‌شدنش */
        out.push(s);
        rowAfter += s.length;
        failed++;
        allOk = false;
        problems.push(`${row.title ?? row.id} · عکس ${i + 1}: ${res.why}`);
      }
    }

    before += rowBefore;
    after += rowAfter;

    if (APPLY && allOk) {
      const u = await fetch(`${URL_BASE}/rest/v1/products?id=eq.${row.id}`, {
        method: 'PATCH',
        headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ images: out }),
      });
      if (!u.ok) {
        problems.push(`${row.title ?? row.id}: نوشتنِ ردیف نشد — ${u.status}`);
        failed++;
      }
    }

    console.log(`  ${APPLY && allOk ? '✓' : '·'} ${String(row.title ?? row.id).slice(0, 40)}`
      + `  ${mb(rowBefore)} → ${mb(rowAfter)}`);
  }
}

console.log('\n── خلاصه ──');
console.log(`ردیف‌های بررسی‌شده: ${fa(scanned)}`);
console.log(`آگهی‌های دارای base64: ${fa(touched)}`);
console.log(`عکس‌های منتقل‌شده: ${fa(moved)}   ناموفق: ${fa(failed)}`);
console.log(`حجمِ ستونِ images: ${mb(before)} → ${mb(after)}`);
if (problems.length) {
  console.log('\n── موارد باقی‌مانده (عکس دست‌نخورده مانده) ──');
  for (const p of problems.slice(0, 20)) console.log('  ! ' + p);
  if (problems.length > 20) console.log(`  … و ${fa(problems.length - 20)} مورد دیگر`);
}
console.log(APPLY
  ? '\n✅ انتقال انجام شد.'
  : '\nℹ️  این فقط گزارش بود. برای انتقالِ واقعی: node scripts/migrate-ad-images.mjs --apply');
