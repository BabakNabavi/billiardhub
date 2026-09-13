/* ─────────────────────────────────────────────────────────────
   تستِ `applyImagePatch` — ویرایشِ کپشن و آلبومِ تصویرِ گالری.
   اجرا:  node scripts/test-edit-image.mjs

   ⚠️ منطقِ *واقعی* سنجیده می‌شود، نه کپیِ آن. نسخه‌ی اولِ همین فایل
   تابع را بازنویسی کرده بود؛ چنین تستی فقط کپیِ خودش را می‌سنجد و
   با جدا افتادن از کد بی‌صدا بی‌فایده می‌شود. (و همان بازنویسی
   باعث شد باگِ واقعی — نوشته‌نشدنِ کپشن — یک بار از تست رد شود.)

   همان الگوی `test-wa-link.mjs`: فایل‌ها به هم چسبانده و ایمپورت‌ها
   حذف می‌شوند، چون Node مسیرِ بی‌پسوندِ TS را حل نمی‌کند.
   ───────────────────────────────────────────────────────────── */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const here = dirname(fileURLToPath(import.meta.url))
const strip = f => readFileSync(join(here, f), 'utf8').replace(/^\s*import[^\n]*\n/gm, '')

const src = strip('../lib/profiles/albums.ts') + '\n' + strip('../lib/profiles/edit-image.ts')
const js = ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
const { applyImagePatch } =
  await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

let pass = 0, total = 0
const eq = (name, got, want) => {
  total++
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) pass++
  console.log(`  ${ok ? '✓' : '✗'} ${name}`)
  if (!ok) console.log(`      انتظار: ${JSON.stringify(want)}   دریافت: ${JSON.stringify(got)}`)
}

console.log('\nویرایشِ کپشن و آلبومِ تصویر')

eq('کپشن ثبت می‌شود',
  applyImagePatch({ gallery: [{ id: 'a', caption: '' }], albums: [] }, 'a', { caption: 'ضربه', album: '' }),
  { gallery: [{ id: 'a', caption: 'ضربه' }], albums: [] })

eq('کپشن پاک می‌شود',
  applyImagePatch({ gallery: [{ id: 'a', caption: 'قدیمی' }], albums: [] }, 'a', { caption: '', album: '' }),
  { gallery: [{ id: 'a', caption: '' }], albums: [] })

eq('آلبومِ تازه به فهرست هم اضافه می‌شود',
  applyImagePatch({ gallery: [{ id: 'a', caption: '' }], albums: [] }, 'a', { caption: '', album: 'تمرین' }),
  { gallery: [{ id: 'a', caption: '', album: 'تمرین' }], albums: ['تمرین'] })

eq('آلبومِ تکراری دوباره اضافه نمی‌شود',
  applyImagePatch({ gallery: [{ id: 'a', caption: '' }], albums: ['تمرین'] }, 'a', { caption: '', album: 'تمرین' }),
  { gallery: [{ id: 'a', caption: '', album: 'تمرین' }], albums: ['تمرین'] })

eq('آلبومِ خالی فیلد را حذف می‌کند، نه رشته‌ی خالی بگذارد',
  applyImagePatch({ gallery: [{ id: 'a', caption: 'x', album: 'تمرین' }], albums: ['تمرین'] }, 'a', { caption: 'x', album: '' }),
  { gallery: [{ id: 'a', caption: 'x' }], albums: ['تمرین'] })

eq('نامِ بلندِ آلبوم به سقف بریده می‌شود',
  applyImagePatch({ gallery: [{ id: 'a', caption: '' }], albums: [] }, 'a', { caption: '', album: 'ط'.repeat(80) }).albums[0].length,
  60)

eq('فاصله‌ی اضافه‌ی نامِ آلبوم گرفته می‌شود',
  applyImagePatch({ gallery: [{ id: 'a', caption: '' }], albums: [] }, 'a', { caption: '', album: '  تمرین  ' }).albums,
  ['تمرین'])

eq('تصویرِ دیگر دست‌نخورده می‌ماند',
  applyImagePatch({ gallery: [{ id: 'a', caption: 'A' }, { id: 'b', caption: 'B', album: 'X' }], albums: ['X'] },
    'a', { caption: 'A2', album: '' }).gallery[1],
  { id: 'b', caption: 'B', album: 'X' })

eq('شناسه‌ی ناموجود چیزی را عوض نمی‌کند',
  applyImagePatch({ gallery: [{ id: 'a', caption: 'A' }], albums: [] }, 'zzz', { caption: 'نه', album: '' }),
  { gallery: [{ id: 'a', caption: 'A' }], albums: [] })

eq('گالریِ نداشته خطا نمی‌دهد',
  applyImagePatch({ albums: [] }, 'a', { caption: 'x', album: '' }),
  { albums: [], gallery: [] })

console.log(`\nنتیجه: ${pass} موفق، ${total - pass} ناموفق`)
process.exit(pass === total ? 0 : 1)
