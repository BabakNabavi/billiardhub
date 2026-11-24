/* آزمونِ وضعیتِ باز/بسته‌ی باشگاه — بی‌دیتابیس، بی‌شبکه (امن برای CI).
       node scripts/test-club-open-status.mjs

   lib/clubs/open-status.ts روی lib/booking/working-hours.ts (منبعِ واحدِ ساعتِ کاری)
   ساخته شده؛ هر دو با transpileModule بار می‌شوند (همان الگوی test-working-hours) تا
   روی Nodeِ ۲۲ِ CI هم بی‌پرچم اجرا شود. وارداتِ '@/lib/…' با نشانیِ دادهٔ ماژولِ اول
   جایگزین می‌شود. */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const toUrl = src => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText).toString('base64')
const whUrl = toUrl(readFileSync(join(ROOT, 'lib/booking/working-hours.ts'), 'utf8'))
const osSrc = readFileSync(join(ROOT, 'lib/clubs/open-status.ts'), 'utf8')
  .replace(/(['"])@\/lib\/booking\/working-hours\1/, JSON.stringify(whUrl))
const { clubOpenStatus } = await import(toUrl(osSrc))

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const schedule = () => Object.fromEntries(days.map(day => [day, { isOpen: true, open: '09:30', close: '22:45' }]))
/* ۲۰۲۶-۱۱-۱۶ دوشنبه است؛ وقتِ تهران +۰۳:۳۰ */
const at = (hours, time, date = '2026-11-16') => clubOpenStatus(hours, new Date(`${date}T${time}+03:30`))
let count = 0
function check(name, test) { test(); count++; console.log(`  ✓ ${name}`) }

check('پیش از دقیقه‌ی بازشدن', () => assert.equal(at(schedule(), '09:29:59').isOpen, false))
check('دقیقه‌ی بازشدن جزوِ باز است', () => assert.equal(at(schedule(), '09:30:00').isOpen, true))
check('پیش از دقیقه‌ی بستن', () => assert.equal(at(schedule(), '22:44:59').isOpen, true))
check('دقیقه‌ی بستن جزوِ بسته است', () => assert.equal(at(schedule(), '22:45:00').isOpen, false))
check('ساعتِ بستنِ شیفتِ عادی', () => assert.equal(at(schedule(), '12:00:00').closeTime, '22:45'))
check('روزِ تعطیل', () => {
  const hours = schedule(); hours.monday.isOpen = false
  assert.equal(at(hours, '12:00:00').isOpen, false)
})
check('برنامه‌ی نامعلوم «نامعلوم» است، نه باز و نه بسته', () => {
  for (const hours of [null, undefined, {}, 'invalid']) assert.equal(at(hours, '12:00:00').isOpen, null)
})
check('ساعتِ نادرست نامعلوم است', () => {
  for (const open of ['nope', '24:00', '25:00', '09:60']) {
    const hours = schedule(); hours.monday.open = open
    assert.equal(at(hours, '12:00:00').isOpen, null)
  }
})
check('بستن در نیمه‌شب (۲۴:۰۰)', () => {
  const hours = schedule(); hours.monday.close = '24:00'
  assert.equal(at(hours, '23:59:59').isOpen, true)
  assert.equal(at(hours, '23:00:00').closeTime, '24:00')
  assert.equal(at(hours, '00:00:00', '2026-11-17').isOpen, false)
})
check('«00:00»ِ قدیمی یعنی تا نیمه‌شب، بی ادامه در فردا', () => {
  const hours = schedule(); hours.monday = { isOpen: true, open: '18:00', close: '00:00' }
  assert.equal(at(hours, '23:00:00').isOpen, true)
  assert.equal(at(hours, '23:00:00').closeTime, '24:00')
  assert.equal(at(hours, '00:30:00', '2026-11-17').isOpen, false)
})
check('شیفتِ شبانه: ساعتِ بستن پایانِ واقعیِ بازه است، نه ستونِ close امروز', () => {
  const hours = schedule()
  hours.monday = { isOpen: true, open: '20:30', close: '02:15' }
  hours.tuesday.isOpen = false
  assert.equal(at(hours, '20:29:59').isOpen, false)
  assert.equal(at(hours, '21:00:00').closeTime, '02:15')
  assert.equal(at(hours, '02:14:59', '2026-11-17').isOpen, true)
  assert.equal(at(hours, '02:15:00', '2026-11-17').isOpen, false)
  assert.equal(at(hours, '01:00:00', '2026-11-17').closeTime, '02:15')
})
check('روزِ قبلِ تعطیل ادامه‌ی شبانه نمی‌دهد', () => {
  const hours = schedule()
  hours.sunday = { isOpen: false, open: '20:00', close: '02:00' }
  assert.equal(at(hours, '01:00:00').isOpen, false)
})
check('ادامه‌ی دیروز و شیفتِ امروز به هم می‌چسبند', () => {
  const hours = schedule()
  hours.sunday = { isOpen: true, open: '18:00', close: '03:30' }
  hours.monday = { isOpen: true, open: '03:15', close: '23:00' }
  assert.equal(at(hours, '03:20:00').closeTime, '23:00')
})
check('ساعتِ برابر یعنی ۲۴ ساعت از همان ساعت (فردا تعطیل)', () => {
  const hours = schedule()
  hours.monday = { isOpen: true, open: '09:30', close: '09:30' }
  hours.tuesday.isOpen = false
  assert.equal(at(hours, '23:00:00').isOpen, true)
  assert.equal(at(hours, '23:00:00').closeTime, '09:30')
  assert.equal(at(hours, '09:29:59', '2026-11-17').isOpen, true)
  assert.equal(at(hours, '09:30:00', '2026-11-17').isOpen, false)
})
check('پیوسته در همه‌ی روزها ⟵ شبانه‌روزی، بی «باز تا ۰۰:۰۰»', () => {
  for (const day of [{ isOpen: true, open: '00:00', close: '24:00' }, { isOpen: true, open: '09:30', close: '09:30' }]) {
    const hours = Object.fromEntries(days.map(k => [k, { ...day }]))
    const s = at(hours, '23:00:00')
    assert.equal(s.isOpen, true)
    assert.equal(s.allDay, true)
    assert.equal(s.closeTime, null)
  }
})
check('تاریخِ UTC به روز و ساعتِ تهران', () => {
  const hours = schedule(); hours.monday.isOpen = false
  assert.equal(clubOpenStatus(hours, new Date('2026-11-16T08:30:00Z')).isOpen, false)
  assert.equal(clubOpenStatus(hours, new Date('2026-11-15T21:00:00Z')).todayKey, 'monday')
})
console.log(`\n  نتیجه: ${count} موفق، 0 ناموفق — بی‌شبکه و بی‌نوشتن در دیتابیس`)
