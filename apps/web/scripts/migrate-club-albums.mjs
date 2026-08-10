/* انتقالِ عکس‌های آلبومِ باشگاه از دیتابیس به Storage.

       node scripts/migrate-club-albums.mjs            # فقط گزارش
       node scripts/migrate-club-albums.mjs --apply    # واقعاً منتقل کن

   ── چرا ──
   ستونِ `albums` روی جدولِ `clubs` یک JSON است به شکلِ
   `[{ id, name, items: [{ id, name, caption, dataUrl }] }]`.
   بخشی از آیتم‌ها `dataUrl` را به‌صورت نشانیِ Storage دارند (۱۳۸
   بایت)، ولی آیتم‌های قدیمی‌تر کلِ عکس را به‌صورت base64 **داخلِ
   همان ستون** نگه داشته‌اند.

   اندازه‌گیری روی پروداکشن: پاسخِ `/api/clubs` ششصد و پانزده
   کیلوبایت بود و پانصد و نود و هشت کیلوبایتش فقط همین ستون برای یک
   باشگاه — چهار عکس با حجم‌های ۱۵۸ و ۱۸۵ و ۱۶۲ و ۹۳ کیلوبایت.

   آن مسیر با انتخابِ ستون در `app/api/clubs/route.ts` بسته شد، ولی
   خودِ داده هنوز سنگین است: صفحه‌ی باشگاه و پنلِ باشگاه‌دار همان
   ستون را می‌خوانند، پشتیبانِ شبانه هم همان حجم را می‌برد، و مرورگر
   نمی‌تواند data URI را کش کند.

   ── قاعده‌ی ایمنی ──
   همان قاعده‌ی `migrate-ad-images.mjs`: عکسی که آپلودش نشد
   **همان‌طور که بود می‌ماند**. هیچ باشگاهی در این انتقال عکسش را از
   دست نمی‌دهد؛ بدترین حالت این است که ردیفی دست‌نخورده بماند و
   دفعه‌ی بعد دوباره تلاش شود.

   پیش از هر نوشتنی، مقدارِ فعلیِ ستون در یک فایلِ پشتیبانِ محلی
   ذخیره می‌شود.
*/

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
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
const kb = b => `${Math.round(b / 1024)} کیلوبایت`;

/* نوعِ فایل از خودِ بایت‌ها، نه از برچسبِ data URI — همان قاعده‌ی
   `lib/upload/policy.ts`. SVG عمداً نیست: می‌تواند اسکریپت داشته باشد. */
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
const safe = s => String(s ?? '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24) || 'x';

async function uploadOne(dataUri, clubId, albumId, itemId) {
  const m = /^data:[^;,]+;base64,([\s\S]+)$/.exec(dataUri.trim());
  if (!m) return { ok: false, why: 'data URI ناخوانا' };

  let bytes;
  try { bytes = Buffer.from(m[1].replace(/\s/g, ''), 'base64'); }
  catch { return { ok: false, why: 'base64 معتبر نیست' }; }

  const kind = sniff(bytes);
  if (!kind) return { ok: false, why: 'نوعِ تصویر شناسایی نشد' };
  if (bytes.byteLength > 8 * 1024 * 1024) return { ok: false, why: 'بزرگ‌تر از ۸ مگابایت' };

  const path = `clubs/${safe(clubId)}/album-${safe(albumId)}-${safe(itemId)}.${kind.ext}`;
  if (!APPLY) return { ok: true, url: PUBLIC_PREFIX + BUCKET + '/' + path, bytes: bytes.byteLength, dry: true };

  const r = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': kind.mime, 'cache-control': '31536000', 'x-upsert': 'true' },
    body: bytes,
  });
  if (!r.ok) return { ok: false, why: `Storage ${r.status}: ${(await r.text()).slice(0, 120)}` };

  return { ok: true, url: PUBLIC_PREFIX + BUCKET + '/' + path, bytes: bytes.byteLength };
}

/* ردیف‌ها صفحه‌صفحه — خودِ همین ستون صدها کیلوبایت در هر ردیف است */
const PAGE = 3;
const BACKUP_DIR = join(ROOT, 'backups', 'club-albums');

let scanned = 0, touched = 0, moved = 0, failed = 0, before = 0, after = 0;
const problems = [];

for (let offset = 0; ; offset += PAGE) {
  const r = await fetch(
    `${URL_BASE}/rest/v1/clubs?select=id,name,albums&order=id&limit=${PAGE}&offset=${offset}`,
    { headers: H },
  );
  if (!r.ok) { console.error('✗ خواندنِ ردیف‌ها:', r.status, (await r.text()).slice(0, 200)); process.exit(1); }
  const rows = await r.json();
  if (!Array.isArray(rows) || rows.length === 0) break;

  for (const row of rows) {
    scanned++;
    const albums = Array.isArray(row.albums) ? row.albums : [];
    const hasData = albums.some(a => Array.isArray(a?.items) && a.items.some(it => isData(it?.dataUrl)));
    if (!hasData) continue;

    touched++;
    const rowBefore = JSON.stringify(albums).length;
    let allOk = true;

    /* پشتیبانِ محلی پیش از هر نوشتنی */
    if (APPLY) {
      if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
      writeFileSync(join(BACKUP_DIR, `${safe(row.id)}.json`), JSON.stringify(albums, null, 1), 'utf8');
    }

    const next = albums.map(al => ({
      ...al,
      items: Array.isArray(al?.items) ? al.items.slice() : [],
    }));

    for (const al of next) {
      for (let i = 0; i < al.items.length; i++) {
        const it = al.items[i];
        if (!it || !isData(it.dataUrl)) continue;
        const res = await uploadOne(it.dataUrl, row.id, al.id, it.id ?? String(i));
        if (res.ok) {
          al.items[i] = { ...it, dataUrl: res.url };
          moved++;
          console.log(`   ✓ ${it.name ?? '(بی‌نام)'}  ${kb(res.bytes)} → ${res.url.split('/').slice(-1)[0]}${res.dry ? '  (آزمایشی)' : ''}`);
        } else {
          allOk = false; failed++;
          problems.push(`${row.name ?? row.id} / ${it.name ?? i}: ${res.why}`);
          console.log(`   ✗ ${it.name ?? '(بی‌نام)'}  ${res.why}`);
        }
      }
    }

    const rowAfter = JSON.stringify(next).length;
    before += rowBefore; after += rowAfter;
    console.log(`${row.name ?? row.id}: ${kb(rowBefore)} → ${kb(rowAfter)}${allOk ? '' : '  (ناقص — دفعه‌ی بعد دوباره)'}`);

    if (APPLY) {
      const up = await fetch(`${URL_BASE}/rest/v1/clubs?id=eq.${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ albums: next }),
      });
      if (!up.ok) {
        console.error(`   ✗ نوشتنِ ردیف: ${up.status} ${(await up.text()).slice(0, 160)}`);
        problems.push(`${row.name ?? row.id}: نوشتنِ ردیف ناموفق`);
      }
    }
  }
}

console.log(`\n${APPLY ? '── انجام شد ──' : '── فقط گزارش (برای انجام: --apply) ──'}`);
console.log(`باشگاه‌های بررسی‌شده: ${fa(scanned)}   دارای base64: ${fa(touched)}`);
console.log(`عکس‌های منتقل‌شده: ${fa(moved)}   ناموفق: ${fa(failed)}`);
console.log(`حجمِ ستون: ${kb(before)} → ${kb(after)}`);
if (problems.length) { console.log('\nمشکل‌ها:'); for (const p of problems) console.log(' ·', p); }
process.exit(failed > 0 ? 1 : 0);
