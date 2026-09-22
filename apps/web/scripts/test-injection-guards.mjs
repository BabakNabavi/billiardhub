/* نگهبانِ ایستا — بازگشتِ دو باگی که ممیزیِ امنیتی پیدا کرد.
   اجرا:  node scripts/test-injection-guards.mjs

   ⚠️ چرا تستِ ایستا و نه واحد: هر دو باگ «یک جا یادمان رفت» بودند،
   نه منطقِ غلط. الگو در بقیه‌ی فایل‌ها درست بود و فقط در یکی جا
   مانده بود — پس چیزی که لازم است، سنجشِ *همه‌ی* موارد است نه
   سنجشِ رفتارِ یکی.

   ── باگِ یک: XSSِ ذخیره‌شده در JSON-LD ──
   `app/media/[id]/page.tsx` عنوان و توضیحِ ویدیوی کاربر را داخل
   <script type="application/ld+json"> می‌ریخت بدونِ فرار دادنِ «<».
   یک «</script>» در عنوان از تگ بیرون می‌زد و هرچه بعدش بود روی
   صفحه‌ی عمومی اجرا می‌شد. صفحه‌ی خبر و پلی‌لیست از قبل فرار
   می‌دادند؛ فقط این یکی جا مانده بود.

   ── باگِ دو: REVOKEِ بی‌اثر ──
   مهاجرتِ ۰۴۱ نوشته بود `REVOKE … FROM anon, authenticated` بدونِ
   `PUBLIC`. پستگرس EXECUTE را پیش‌فرض به PUBLIC می‌دهد و anon از
   آن ارث می‌برد، پس آن خط هیچ اثری نداشت و بیست تابع — از جمله
   توابعِ مالی — شش هفته از اینترنت باز ماندند. */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..', '..')

let pass = 0, fail = 0
const ok = m => { pass++; console.log('  ✓', m) }
const bad = m => { fail++; console.log('  ✗', m) }

/* ── خطِ پایه ──
   ⚠️ مهاجرت‌های اجراشده ویرایش نمی‌شوند؛ تاریخ‌اند. وضعیتِ *واقعیِ*
   دیتابیس با مهاجرتِ ۱۰۱ بسته شد (بیست تابع) و تریگرِ رویدادیِ ۱۰۲
   جلوی تازه‌ها را می‌گیرد. کارِ این تست گرفتنِ الگوی غلط پیش از
   دیپلویِ بعدی است، نه بازنویسیِ گذشته.

   پس فقط مهاجرت‌های ۱۰۳ به بعد سنجیده می‌شوند. اگر روزی گذشته هم
   پاک شد، این عدد را پایین بیاورید. */
const BASELINE = 103
const newMigrations = fs => fs.filter(f => {
  const n = Number(f.match(/migrations[\\/]+(\d+)_/)?.[1] ?? 0)
  return n >= BASELINE
})

/* ⚠️ از فایل‌سیستم خوانده می‌شود، نه `git ls-files`.
   نسخه‌ی اول با git می‌خواند و همان‌جا یک سبزِ کاذبِ واقعی داد:
   مهاجرتِ تازه‌ای که هنوز کامیت نشده **ردیابی‌نشده** است و git
   نشانش نمی‌دهد — یعنی دقیقا لحظه‌ای که نویسنده تست می‌گیرد،
   نگهبان کور است. این را با شکستنِ عمدیِ تست پیدا کردم. */
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git') continue
    const full = join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else out.push(relative(repo, full).split('\\').join('/'))
  }
  return out
}

const tsxFiles = () =>
  [...walk(join(repo, 'apps/web/app')), ...walk(join(repo, 'apps/web/components'))]
    .filter(f => f.endsWith('.tsx'))

const sqlFiles = () =>
  walk(join(repo, 'supabase/migrations')).filter(f => f.endsWith('.sql'))

/* ═══ ۱) هر JSON-LD باید «<» را فرار بدهد ═══ */
console.log('\n■ JSON-LD — فرارِ «<»')
{
  /* `JSON.stringify(x)` داخلِ dangerouslySetInnerHTML، بدونِ
     `.replace(/</g, …)` بلافاصله پس از آن. */
  const RISKY = /dangerouslySetInnerHTML=\{\{\s*__html:\s*JSON\.stringify\([^)]*\)\s*\}\}/g
  let found = 0
  for (const f of tsxFiles()) {
    const src = readFileSync(join(repo, f), 'utf8')
    const hits = [...src.matchAll(RISKY)].length
    for (let i = 0; i < hits; i++) {
      found++
      bad(`${f} — JSON.stringify بدونِ فرارِ «<» داخلِ __html`)
    }
  }
  if (!found) ok('هیچ JSON.stringifyِ فرارنداده‌ای در __html نیست')
}

/* ═══ ۲) خودِ منطقِ فرار واقعا جلوی شکستنِ تگ را می‌گیرد ═══ */
console.log('\n■ منطقِ فرار')
{
  const escape = s => JSON.stringify(s).replace(/</g, '\\u003c')
  const evil = { name: '</scr' + 'ipt><img src=x onerror=alert(1)>' }
  const out = escape(evil)

  if (!/<\/script/i.test(out)) ok('خروجی دیگر «</script» ندارد')
  else bad('خروجی هنوز می‌تواند از تگ بیرون بزند')

  /* ⚠️ فرار نباید داده را خراب کند، وگرنه دادهٔ ساختاریافتهٔ گوگل
     می‌شکند و کسی متوجه نمی‌شود. */
  if (JSON.parse(out).name === evil.name) ok('JSON.parse همان مقدارِ اصلی را برمی‌گرداند')
  else bad('فرار، داده را خراب می‌کند')
}

/* ═══ ۳) هر تابعِ bh_* باید از PUBLIC هم REVOKE شود ═══ */
console.log('\n■ مهاجرت‌ها — REVOKE از PUBLIC')
{
  /* تریگرِ رویدادیِ ۱۰۲ این را روی دیتابیس تضمین می‌کند، ولی این
     تست همان را پیش از دیپلوی می‌گیرد — و مهم‌تر، جلوی نوشتنِ
     دوبارهٔ الگوی غلط را می‌گیرد. */
  const BAD_REVOKE = /REVOKE\s+[\s\S]{0,80}?\s+FROM\s+(?!PUBLIC)[^;\n]*\b(anon|authenticated)\b/gi
  let found = 0
  for (const f of newMigrations(sqlFiles())) {
    const src = readFileSync(join(repo, f), 'utf8')
    for (const m of src.matchAll(BAD_REVOKE)) {
      /* فقط REVOKEِ تابع مهم است؛ جدول با RLS هم پوشیده می‌شود. */
      if (!/ON\s+FUNCTION/i.test(m[0])) continue
      found++
      bad(`${f} — REVOKE بدونِ PUBLIC: ${m[0].replace(/\s+/g, ' ').slice(0, 70)}…`)
    }
  }
  if (!found) ok(`هر REVOKEِ تابع شاملِ PUBLIC است (از مهاجرتِ ${BASELINE})`)
}

/* ═══ ۴) تابعِ تازه بدونِ هیچ REVOKEی ═══ */
console.log('\n■ مهاجرت‌ها — تابعِ بدونِ REVOKE')
{
  let found = 0
  for (const f of newMigrations(sqlFiles())) {
    const src = readFileSync(join(repo, f), 'utf8')
    const made = [...src.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(bh_\w+)/gi)]
      .map(m => m[1].toLowerCase())
    if (!made.length) continue
    for (const fn of [...new Set(made)]) {
      /* تابعِ تریگر از راهِ RPC در دسترس نیست */
      const body = src.slice(src.toLowerCase().indexOf(fn))
      if (/RETURNS\s+trigger/i.test(body.slice(0, 400))) continue
      if (/RETURNS\s+event_trigger/i.test(body.slice(0, 400))) continue
      const re = new RegExp(`REVOKE[\\s\\S]{0,120}?${fn}\\s*\\(`, 'i')
      if (!re.test(src)) { found++; bad(`${f} — ${fn} هیچ REVOKEی ندارد`) }
    }
  }
  if (!found) ok(`هر تابعِ bh_*ِ تازه REVOKE دارد (از مهاجرتِ ${BASELINE})`)
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
