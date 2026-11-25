/* آزمونِ تیترِ هیرو و پهنای اندازه‌گرفته‌اش با دانا — بی‌شبکه (امن برای CI).
       node scripts/test-hero-title.mjs

   HoldTitleLine با HERO_TITLE_DANA_EM پیش‌بینی می‌کند تیتر با فونتِ دانا یک خط است یا
   دو، تا تا رسیدنِ فونت همان را نگه دارد (پرشِ ۰٫۱ِ صفحه‌ی اصلی). عدد فقط برای همین
   متن درست است؛ این آزمون تغییرِ متن را بی اندازه‌گیریِ دوباره نمی‌گذارد.

   ⚠️ متن را عوض کردی؟ پهنای یک‌خطیِ تیتر با دانا را در چند عرض اندازه بگیر (عرضِ
   بی‌شکستن ÷ اندازه‌ی فونت)، HERO_TITLE_DANA_EM را به‌روز کن، بعد این‌جا هر دو را. */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const js = ts.transpileModule(read('components/home/hero/hero-title.ts'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
const T = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

let count = 0
function check(name, test) { test(); count++; console.log(`  ✓ ${name}`) }

check('متنِ تیتر همان است که پهنایش اندازه گرفته شد', () => {
  assert.equal(`${T.HERO_TITLE_LEAD} ${T.HERO_TITLE_ACCENT}`, 'پلتفرم جامع و تخصصی بیلیارد',
    'متن عوض شده — HERO_TITLE_DANA_EM را دوباره اندازه بگیر')
  assert.equal(T.HERO_TITLE_DANA_EM, 12.3)
})
check('هیرو تیتر را از همین ثابت‌ها می‌سازد و همان عدد را به HoldTitleLine می‌دهد', () => {
  const hero = read('components/home/hero/HomeHero.tsx')
  assert.ok(hero.includes('{HERO_TITLE_LEAD}') && hero.includes('{HERO_TITLE_ACCENT}'), 'متنِ تیتر باید از hero-title بیاید')
  assert.ok(hero.includes('danaEm={HERO_TITLE_DANA_EM}'), 'عددِ اندازه‌گیری باید از hero-title بیاید')
  assert.ok(/<h1 id="hh-title"/.test(hero) && hero.includes('targetId="hh-title"'), 'شناسه‌ی تیتر و هدفِ اسکریپت یکی باشند')
})

console.log(`\n  نتیجه: ${count} موفق، 0 ناموفق — بی‌شبکه و بی‌نوشتن در دیتابیس`)
