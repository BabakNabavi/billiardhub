/* آزمونِ قاعده‌ی فیلدهای خصوصیِ پروفایل — بی‌دیتابیس، بی‌شبکه (امن برای CI).
       node scripts/test-private-fields.mjs

   lib/profiles/private-fields.ts تعیین می‌کند چه چیزی از پروفایل به کسی جز صاحبش
   (پاسخِ عمومیِ API و HTMLِ رندرِ سرور) نمی‌رسد. این آزمون هر دو سو را می‌پاید: آنچه
   باید برود (شماره‌ی شخصی، پروانه، مدرک) و آنچه باید بماند (شماره‌ی تماسِ عمومی،
   گواهینامه‌های تولیدکننده، کد پستی، پرچمِ ملی‌پوش) — حذفِ اشتباهِ دومی صفحه را خالی
   می‌کرد. */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const js = ts.transpileModule(readFileSync(join(ROOT, 'lib/profiles/private-fields.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
const { withoutPrivateFields } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

const row = {
  id: 'p1', slug: 'x', ownerId: 'u1', status: 'approved', verified: true,
  licenseNumber: '123', licenseUrl: 'https://x/l.pdf', licenseVerified: true, licenseNote: 'n',
  data: {
    name: 'نام', phone: '09120000000', whatsapp: '09120000001', contactPhone: '02100000000', mobile: '0912',
    phones: ['021'], postalCode: '1234567890', latitude: '35.7', certificates: [{ title: 'ISO' }],
    national: true, ownerId: 'u1',
    ownerPhone: '09129999999', ownerName: 'حقوقی', certificate: { url: 'https://x/c.jpg' },
    licenseFile: { url: 'https://x/f.pdf' }, licenseNumber: '9', nationalId: '0012345678', nationalCode: '1',
    birthDate: '1370', iban: 'IR00', sheba: 'IR11', cardNumber: '6037',
  },
}

let count = 0
function check(name, test) { test(); count++; console.log(`  ✓ ${name}`) }

const kept = withoutPrivateFields(row, { keepOwnerId: true })
check('شماره‌ی شخصی، نامِ حقوقی، مدرک و پروانه نمی‌روند', () => {
  for (const k of ['ownerPhone', 'ownerName', 'certificate', 'licenseFile', 'licenseNumber', 'nationalId', 'nationalCode', 'birthDate', 'iban', 'sheba', 'cardNumber']) {
    assert.equal(k in kept.data, false, k)
  }
  for (const k of ['licenseNumber', 'licenseUrl', 'licenseVerified', 'licenseNote']) assert.equal(k in kept, false, k)
})
check('راه‌های تماسِ عمومی و داده‌ی نمایشی می‌مانند', () => {
  for (const k of ['name', 'phone', 'whatsapp', 'contactPhone', 'mobile', 'phones', 'postalCode', 'latitude', 'certificates', 'national']) {
    assert.equal(k in kept.data, true, k)
  }
  for (const k of ['id', 'slug', 'status', 'verified']) assert.equal(k in kept, true, k)
})
check('ownerId فقط با keepOwnerId می‌ماند', () => {
  assert.equal(kept.ownerId, 'u1')
  assert.equal(kept.data.ownerId, 'u1')
  const html = withoutPrivateFields(row, { keepOwnerId: false })
  assert.equal('ownerId' in html, false)
  assert.equal('ownerId' in html.data, false)
})
check('ورودی دست نمی‌خورد (کپی برمی‌گردد)', () => {
  assert.equal(row.data.ownerPhone, '09129999999')
  assert.equal(row.licenseNumber, '123')
})
check('ردیفِ بی data هم امن است', () => {
  assert.deepEqual(withoutPrivateFields({ slug: 's', ownerPhone: '0912' }, { keepOwnerId: true }), { slug: 's' })
})

console.log(`\n  نتیجه: ${count} موفق، 0 ناموفق — بی‌شبکه و بی‌نوشتن در دیتابیس`)
