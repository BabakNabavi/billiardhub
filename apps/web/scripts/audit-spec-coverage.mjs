/* ═══════════════════════════════════════════════════════════════
   ممیزیِ پوششِ مشخصات فنی — «هرچه فروشنده وارد می‌کند، خریدار
   می‌بیند؟»
   ───────────────────────────────────────────────────────────────
   سه فهرست را برای هر دسته کنار هم می‌گذارد:

     تعریف‌شده  ← `specs_catalog.json` / `accessories_catalog.json`
     ذخیره‌شونده ← همان سریال‌سازی‌ای که فرم انجام می‌دهد
     نمایش‌شونده ← همان `specDisplayRows` که صفحه‌ی آگهی صدا می‌زند

   ── چرا منطق را بازنویسی نمی‌کند ──
   تستی که قاعده را دوباره پیاده کند، فقط بازنویسیِ خودش را می‌سنجد.
   پس ماژول‌های واقعی (`spec-rules`, `spec-catalog`, `catalog`) با
   tsc به CommonJS کامپایل می‌شوند و همان‌ها اجرا می‌گردند. اگر
   قاعده‌ای در کد عوض شود، این‌جا هم عوض می‌شود.

   اجرا:  node scripts/audit-spec-coverage.mjs
          node scripts/audit-spec-coverage.mjs --json
   ═══════════════════════════════════════════════════════════════ */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const JSON_OUT = process.argv.includes('--json')

// ── کامپایلِ ماژول‌های واقعی ───────────────────────────────────
const TSC = join(ROOT, '../../node_modules/.bin/tsc')
const out = mkdtempSync(join(tmpdir(), 'spec-audit-'))
try {
  execFileSync(process.platform === 'win32' ? '"' + TSC + '.cmd"' : TSC, [
    'lib/market/spec-catalog.ts', '--outDir', out,
    '--module', 'commonjs', '--target', 'es2020',
    '--skipLibCheck', '--moduleResolution', 'node',
    '--resolveJsonModule', '--esModuleInterop',
  ], { cwd: ROOT, stdio: 'pipe', shell: process.platform === 'win32' })
} catch (e) {
  /* tsc با خطای تایپ هم فایل می‌نویسد؛ فقط وقتی می‌ایستیم که ننوشته باشد */
  if (!existsSync(join(out, 'lib/market/spec-catalog.js'))) {
    console.error('کامپایل نشد:\n' + String(e.stdout ?? e))
    process.exit(2)
  }
}
const req = createRequire(pathToFileURL(join(out, 'x.cjs')))
const SR = req(join(out, 'lib/market/spec-rules.js'))
const SC = req(join(out, 'lib/market/spec-catalog.js'))
const CAT = req(join(out, 'lib/market/catalog.js'))

const j = f => JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8'))
const ACC = j('accessories_catalog.json')

/* دسته‌های سایت که مشخصات دارند، و نوعِ کاتالوگیِ هرکدام */
const CATS = [
  ['cue', 'چوب', 'snooker'],
  ['table', 'میز', 'snooker'],
  ['ball', 'توپ', 'snooker'],
  /* ── چرا توپ دو بار ──
     «رنگ توپ» فقط در نوعِ «تکی» دیده می‌شود، و گاردِ «فیلدِ پنهان
     مقدار نمی‌گیرد» بدونِ یک آگهی که واقعاً آن فیلد را پر کرده
     باشد، هرگز آزموده نمی‌شود. */
  ['ball', 'توپ (تکی)', 'single'],
  ['chalk', 'گچ', 'snooker'],
  ['tip', 'تیپ', 'snooker'],
  ['cloth', 'پارچه', 'snooker'],
  ...ACC.categories.map(c => [
    Object.entries(CAT.ACCESSORY_TYPE_OF).find(([, v]) => v === c.id)?.[0] ?? c.id,
    c.label_fa, c.id,
  ]),
]

// ── ساختنِ یک آگهیِ «همه‌فیلد‌پر» ──────────────────────────────
/* مقدارِ نمونه از خودِ تعریفِ فیلد می‌آید تا آگهی واقعی باشد:
   گزینه‌ی اول برای فهرست‌ها، وسطِ بازه برای عددها. */
function sampleValue(f, payload) {
  if (f.type === 'boolean') return true
  if (f.type === 'multi_select') return (f.options ?? []).slice(0, 2).map(o => o.id)
  if (f.type === 'number') {
    const lo = f.min ?? 1, hi = f.max ?? lo + 10
    const mid = (lo + hi) / 2
    return f.step && f.step < 1 ? Math.round(mid * 10) / 10 : Math.round(mid)
  }
  if (f.source === 'types[].sizes') return payload?.sizes?.[0]?.id ?? ''
  if (f.source === 'types[].set_types') return payload?.set_types?.[0]?.id ?? ''
  if (f.source?.startsWith('cloth_catalog')) return null   // جدا هندل می‌شود
  if (f.options?.length) return f.options[0].id
  return f.type === 'text' ? 'متنِ آزمایشی' : ''
}

const results = []

for (const [cat, faName, typeId] of CATS) {
  const fields = SC.getSpecFields(cat)
  if (!fields.length) continue

  const catalogId = CAT.isProductCatalog(cat) ? cat
    : CAT.isAccessoryCategory(cat) ? 'accessories' : null
  const catType = catalogId === 'accessories'
    ? CAT.ACCESSORY_TYPE_OF[cat]
    : catalogId ? typeId : ''
  const payload = catalogId ? CAT.getType(catalogId, catType) : undefined

  /* پارچه‌ی میز از کاتالوگِ پارچه می‌آید، نه از تعریفِ مشخصات */
  const clothT = CAT.getType('cloth', typeId)
  const clothBrand = clothT?.brands?.[0]
  const clothModel = clothBrand?.models?.[0]

  const values = {}
  for (const f of fields) {
    if (f.id === 'cloth_brand') { if (clothBrand) values[SR.specKey(f.id)] = clothBrand.id; continue }
    if (f.id === 'cloth_model') { if (clothModel) values[SR.specKey(f.id)] = clothModel.id; continue }
    const v = sampleValue(f, payload)
    if (v !== null && v !== '') values[SR.specKey(f.id)] = v
  }

  /* فیلدی که در فرم دیده نمی‌شود، پر هم نمی‌شود */
  const visible = fields.filter(f => !SR.isFieldHidden(f, values, fields, catType))
  const hidden = fields.filter(f => SR.isFieldHidden(f, values, fields, catType))
  for (const f of hidden) delete values[SR.specKey(f.id)]

  /* ── ذخیره: همان کاری که فرم می‌کند ── */
  const stored = {}
  for (const f of fields) {
    if (SR.isFieldHidden(f, values, fields, catType)) continue
    const k = SR.specKey(f.id)
    const v = values[k]
    if (v === undefined || v === null || v === '') continue
    if (f.type === 'boolean') { if (v === true) stored[k] = true; continue }
    if (f.type === 'multi_select') { if (v.length) stored[k] = v; continue }
    stored[k] = v
  }

  const serverCheck = SC.validateSpecsOnServer(cat, stored, catType || undefined)

  /* ── نمایش: همان کاری که صفحه‌ی آگهی می‌کند ── */
  const resolve = (fid, v) => {
    const src = fields.find(f => f.id === fid)?.source
    if (src === 'types[].sizes') return payload?.sizes?.find(s => s.id === v)?.label_fa
    if (src === 'types[].set_types') return payload?.set_types?.find(s => s.id === v)?.label_fa
    if (fid === 'cloth_brand') return clothBrand?.name_en
    if (fid === 'cloth_model') return clothModel?.name_en
    return undefined
  }
  const rows = SR.specDisplayRows(fields, stored, resolve)

  const shownKeys = new Set(rows.map(r => r.key))
  const missing = Object.keys(stored).filter(k => !shownKeys.has(k))
    .map(k => ({ key: k, label: fields.find(f => SR.specKey(f.id) === k)?.label_fa ?? k, value: stored[k] }))

  /* ── کیفیتِ نمایش ── */
  const LATIN_ID = /^[a-z0-9][a-z0-9._-]*$/i
  const flaws = []
  for (const r of rows) {
    const f = fields.find(x => SR.specKey(x.id) === r.key)
    if (!f) { flaws.push({ kind: 'کلیدِ ناشناس', row: r.key, value: r.value }); continue }
    if (r.label === r.key) flaws.push({ kind: 'برچسبِ انگلیسی', row: r.key, value: r.label })
    if (typeof r.value !== 'string') flaws.push({ kind: 'مقدارِ غیرمتنی', row: r.key, value: String(r.value) })
    if (r.value === 'true' || r.value === 'false') flaws.push({ kind: 'بولینِ خام', row: r.key, value: r.value })
    if (r.value.startsWith('[') || r.value.includes('","')) flaws.push({ kind: 'آرایه‌ی خام', row: r.key, value: r.value })
    /* شناسه‌ی لاتین به‌جای برچسبِ فارسی — عدد و واحدِ لاتین استثناست.

       ── برچسبِ لاتین همیشه باگ نیست ──
       «Strachan» و «Elkmaster» و «XS» خودشان برچسبِ نوشته‌شده‌اند، نه
       شناسه‌ای که ترجمه نشده. تشخیص از خودِ داده می‌آید: اگر مقدار با
       `label_fa`ِ یکی از گزینه‌ها یکی باشد یا از `resolve` آمده باشد،
       همان چیزی است که قرار بود دیده شود. */
    const optish = f.type === 'select' || f.type === 'multi_select'
    const authored = (f.options ?? []).some((o) => o.label_fa === r.value)
      || !!resolve(f.id, String(stored[r.key] ?? ''))
    if (optish && !authored && LATIN_ID.test(r.value) && !/^[\d.]+$/.test(r.value)) {
      flaws.push({ kind: 'شناسه‌ی لاتین به‌جای برچسب', row: r.key, value: r.value })
    }
    /* واحد باید یا در برچسب باشد یا در مقدار */
    const num = f.type === 'number'
    const hasUnit = /[)؀-ۿ]/.test(r.label.replace(f.label_fa ?? '', '')) || /\(/.test(r.label)
    if (num && !hasUnit && !/[؀-ۿ]/.test(r.value)) {
      flaws.push({ kind: 'واحدِ گم‌شده', row: r.key, value: `${r.label}: ${r.value}` })
    }
  }

  /* ── مسیرهایی که ممیزیِ ساده نمی‌بیند ──
     آگهیِ سالم را می‌سنجیم، ولی گاردها فقط وقتی معنا دارند که
     ورودیِ ناسالم هم آزموده شود: کلیدِ ناشناخته در مسیرِ ثبت،
     نوعِ گم‌شده در مسیرِ ویرایش، و کلیدهایی که فقط نمایش‌اند. */
  const strictLegacy = SC.validateSpecsOnServer(cat, { ...stored, hackKey: 'x' }, catType || undefined, true)
  const noType = SC.validateSpecsOnServer(cat, stored, undefined, false)
  const titleRows = SR.specDisplayRows(fields, { ...stored, 'نوع': 'x', 'مدل': 'y' }, resolve)
  const guards = []
  if (strictLegacy.ok) guards.push('کلیدِ ناشناخته در مسیرِ ثبت رد نشد')
  if (!noType.ok) guards.push('بدونِ نوع رد شد — ویرایشِ آگهی می‌شکند: ' + JSON.stringify(noType.errors))
  if (titleRows.length !== rows.length) guards.push('«نوع»/«مدل» در جدول تکرار شدند')
  if (SR.groupedRows(rows).flatMap(g => g.rows).length !== rows.length) guards.push('گروه‌بندی ردیف گم یا تکرار کرد')

  results.push({
    cat, faName,
    defined: fields.length,
    visible: visible.length,
    hiddenByRule: hidden.map(f => f.label_fa),
    stored: Object.keys(stored).length,
    shown: rows.length,
    missing, flaws, guards,
    serverOk: serverCheck.ok,
    serverErrors: serverCheck.errors,
    rows,
  })
}

if (JSON_OUT) {
  console.log(JSON.stringify(results, null, 2))
  process.exit(0)
}

const pad = (s, n) => String(s).padEnd(n)
console.log('\n══ پوششِ مشخصات فنی ══\n')
console.log(pad('دسته', 16) + pad('تعریف', 7) + pad('در فرم', 8) + pad('ذخیره', 7) + pad('نمایش', 7) + pad('گم‌شده', 8) + 'سرور')
console.log('─'.repeat(62))
let bugs = 0, flawN = 0
for (const r of results) {
  bugs += r.missing.length; flawN += r.flaws.length
  console.log(
    pad(r.faName, 16) + pad(r.defined, 7) + pad(r.visible, 8) + pad(r.stored, 7)
    + pad(r.shown, 7) + pad(r.missing.length || '—', 8) + (r.serverOk ? 'قبول' : 'رد ✗'),
  )
}
console.log('─'.repeat(62))
console.log(pad('مجموع', 16) + pad(results.reduce((n, r) => n + r.defined, 0), 7)
  + pad(results.reduce((n, r) => n + r.visible, 0), 8)
  + pad(results.reduce((n, r) => n + r.stored, 0), 7)
  + pad(results.reduce((n, r) => n + r.shown, 0), 7) + pad(bugs || '—', 8))

let guardN = 0
for (const r of results) guardN += r.guards.length
if (guardN) {
  console.log('\n══ گاردهای شکسته ══')
  for (const r of results) for (const g of r.guards) console.log(`  ${r.faName} · ${g}`)
}
if (bugs) {
  console.log('\n══ ذخیره می‌شود ولی نمایش داده نمی‌شود ══')
  for (const r of results) for (const m of r.missing) {
    console.log(`  ${r.faName} · ${m.label} (${m.key}) = ${JSON.stringify(m.value)}`)
  }
}
if (flawN) {
  console.log('\n══ کیفیتِ نمایش ══')
  for (const r of results) for (const f of r.flaws) {
    console.log(`  ${pad(r.faName, 14)} ${pad(f.kind, 26)} ${f.row} → ${f.value}`)
  }
}
for (const r of results) if (!r.serverOk) {
  console.log(`\n✗ ${r.faName}: سرور آگهیِ پرشده را رد کرد — ${JSON.stringify(r.serverErrors)}`)
}
const fieldsHidden = results.filter(r => r.hiddenByRule.length)
if (fieldsHidden.length) {
  console.log('\n══ فیلدهایی که قاعده پنهانشان می‌کند (باگ نیست) ══')
  for (const r of fieldsHidden) console.log(`  ${r.faName}: ${r.hiddenByRule.join('، ')}`)
}
console.log(`\n${bugs + flawN + guardN === 0 ? '✅' : '❌'}  ${bugs} فیلدِ گم‌شده · ${flawN} ایرادِ نمایش · ${guardN} گاردِ شکسته\n`)
process.exit(bugs || flawN || guardN ? 1 : 0)
