/* بازرسیِ ایستا: آنچه باشگاه‌دار وارد می‌کند، آیا بازدیدکننده هم می‌بیند؟
       node scripts/test-club-public-content.mjs

   ── چرا این تست وجود دارد ──
   دو خانواده باگ در همین یک پنل پیدا شد که هر دو یک شکل داشتند: پنل
   درست کار می‌کرد، سرور هم خطا نمی‌داد، ولی خروجی به بازدیدکننده
   نمی‌رسید.

     ۱) `hasActiveStory` — کلِ نمایشِ استوریِ باشگاه پشتِ پرچمی بود که
        هیچ ستونی پشتش نبود. `undefined` هیچ‌وقت خطا نمی‌دهد، فقط
        بی‌صدا `false` می‌شود.
     ۲) مربیان/آمار/آلبوم — پنل در `localStorage` می‌نوشت و صفحه‌ی عمومی
        از `localStorage`ِ *بازدیدکننده* می‌خواند.

   هیچ‌کدام با تایپ‌چک یا بیلد پیدا نمی‌شوند و هر دو فقط با «باز کن و
   ببین» کشف شدند. این تست همان دو الگو را در متنِ کد می‌گیرد. */

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

const clubsApi     = read('app/api/clubs/route.ts');
const clubApi      = read('app/api/clubs/[id]/route.ts');
const storiesApi   = read('app/api/clubs/[id]/stories/route.ts');
const publicPage   = read('app/clubs/[id]/page.tsx');
const listPage     = read('app/clubs/page.tsx');
const storiesBar   = read('components/Stories.tsx');
const gallery      = read('components/dashboard/club/GalleryTab.tsx');
const panel        = read('app/dashboard/club/page.tsx');
const migrations   = ['064_club_story_columns.sql', '065_club_public_content.sql']
  .map(f => read(join('..', '..', 'supabase', 'migrations', f))).join('\n');

// ───────────────────────────────────────────────────────────────────────────
head('۱) استوریِ باشگاه — پرچمی که مصرف می‌شود باید تولید هم بشود');

t('نوارِ استوری روی `hasActiveStory` فیلتر می‌کند',
  /hasActiveStory/.test(storiesBar));
t('`GET /api/clubs` همان پرچم را می‌سازد',
  /hasActiveStory\s*:/.test(clubsApi), 'مصرف‌کننده هست، تولیدکننده نیست');
t('`GET /api/clubs/[id]` هم می‌سازدش (صفحه‌ی باشگاه)',
  /hasActiveStory\s*:/.test(clubApi));
t('پرچم مشتق است، نه ستونِ ذخیره‌شده',
  /storyExpiresAt/.test(clubsApi) && !/ADD COLUMN[^;]*hasActiveStory/i.test(migrations),
  'پرچمِ ذخیره‌شده موقعِ انقضا کهنه می‌ماند');
t('ستون‌های استوری در مهاجرت ساخته شده‌اند',
  ['storyMediaUrl', 'storyType', 'storyText', 'storyExpiresAt']
    .every(c => migrations.includes(c)));
t('انتشار/حذفِ استوری رکوردِ باشگاه را هم می‌نویسد',
  /syncClubRow/.test(storiesApi));
t('رینگِ کارت به `storyMediaUrl` گره خورده و آن هم ستون دارد',
  /storyMediaUrl/.test(listPage) && migrations.includes('storyMediaUrl'));

// ───────────────────────────────────────────────────────────────────────────
head('۲) محتوای پنل باید به سرور برود، نه فقط به مرورگرِ باشگاه‌دار');

/* الگوی مرگبار: صفحه‌ی عمومی از `localStorage` بخواند. کلیدِ `club-*`
   را فقط خودِ باشگاه‌دار در مرورگرِ خودش دارد. */
const publicReadsLocal = [...publicPage.matchAll(/localStorage\.getItem\(`(club-[a-z]+)-/g)]
  .map(m => m[1]);
t('صفحه‌ی عمومیِ باشگاه هیچ محتوایی را از localStorage نمی‌خواند',
  publicReadsLocal.length === 0, publicReadsLocal.join(', '));

for (const [label, key, writer, src] of [
  ['مربیان',   'coaches',   /api\.put\([^)]*\{\s*coaches:/s,   panel],
  ['آمار',     'clubStats', /api\.put\([^)]*\{\s*clubStats/s,  panel],
  ['آلبوم‌ها', 'albums',    /api\.put\([^)]*\{\s*albums:/s,    gallery],
]) {
  t(`${label} روی سرور ذخیره می‌شود`, writer.test(src));
  t(`ستون \`${key}\` در مهاجرت هست`, migrations.includes(key));
  t(`صفحه‌ی عمومی ${label} را از رکوردِ باشگاه می‌خواند`,
    new RegExp(`club\\.${key}`).test(publicPage));
}

// ───────────────────────────────────────────────────────────────────────────
head('۳) عکس هیچ‌وقت base64 داخلِ ستون نمی‌رود');

/* دنبالِ *فراخوانی* می‌گردیم نه هر نامی — ذکرِ نامِ تابعِ حذف‌شده در
   کامنت نباید تست را قرمز کند. */
t('آلبوم از `/api/upload` استفاده می‌کند نه data-URL',
  /\/api\/upload/.test(gallery)
  && !/(await\s+)?compressImage\s*\(/.test(gallery)
  && !/toDataURL/.test(gallery),
  'base64 در jsonb یعنی چند مگابایت در هر select(*)');

// ───────────────────────────────────────────────────────────────────────────
head('۴) آدرس اختصاصی سایت');

t('یک کامپوننتِ مشترک، نه نسخه‌ی جدا در هر فرم',
  ['app/dashboard/club/page.tsx', 'app/clubs/new/page.tsx',
   'app/dashboard/coach/page.tsx', 'app/referees/dashboard/page.tsx']
    .every(p => /SiteAddressField/.test(read(p))));
t('پیش‌نمایش نشانیِ کامل با `.net` را نشان می‌دهد',
  /billiardhub\.net/.test(read('components/SiteAddressField.tsx')));
t('پیش‌نمایش شرطی نیست — از اولین حرف دیده می‌شود',
  !/\{\s*value\s*&&\s*\(?\s*<div[^>]*billiardhub/.test(read('components/SiteAddressField.tsx')));
t('سرور هم قالبِ نشانی را بررسی می‌کند',
  /isValidSlug/.test(clubApi), 'بررسیِ فقط‌مرورگری با درخواستِ دستی دور زده می‌شود');
t('یکتاییِ نشانی قیدِ دیتابیس دارد',
  /clubs_slug_uniq/.test(read(join('..', '..', 'supabase', 'migrations', '066_clubs_slug_unique.sql'))),
  'دو نفر هم‌زمان می‌توانند یک نشانی بگیرند');

// ───────────────────────────────────────────────────────────────────────────
head('۵) شکستِ ذخیره باید دیده شود');

t('انتشارِ استوری کدِ وضعیتِ سرور را می‌خواند',
  /if \(!r\.ok\)[\s\S]{0,220}throw/.test(gallery),
  'catch خالی ⇒ باشگاه‌دار خیال می‌کند منتشر شده');
t('ذخیره‌ی اطلاعاتِ باشگاه پیامِ نتیجه دارد',
  /setInfoMsg/.test(panel));
t('ذخیره‌ی مربیان در شکست، فهرست را برمی‌گرداند',
  /setCoachesError/.test(panel));

// ───────────────────────────────────────────────────────────────────────────
console.log(`\n${fail === 0 ? '✅' : '❌'}  ${pass} قبول · ${fail} رد\n`);
process.exit(fail === 0 ? 0 : 1);
