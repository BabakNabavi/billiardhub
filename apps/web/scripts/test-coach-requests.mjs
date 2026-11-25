/* آزمونِ درخواستِ کلاس یا مشاوره از مربی — بی‌دیتابیس، بی‌شبکه (امن برای CI).
       node scripts/test-coach-requests.mjs

   سه جا باید با هم بخوانند و هیچ‌کدام خطای کامپایل نمی‌دهد اگر نخوانند:
     · کلیدهای lib/coach/request-options با CHECKهای مهاجرتِ ۱۱۸ — وگرنه درج ۵۰۰ می‌دهد؛
     · عنوانِ درخواست (متغیرِ {1}ِ پیامک) با فهرستِ مقدارهایی که برای ملی‌پیامک نوشته شده؛
     · متنِ الگو با قاعده‌ی پنل (متغیرِ آخرِ خط رد می‌شود) و با ترتیبِ آرگومان‌های ارسال. */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const js = ts.transpileModule(read('lib/coach/request-options.ts'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
const O = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

let count = 0
function check(name, test) { test(); count++; console.log(`  ✓ ${name}`) }

const mig = read('../../supabase/migrations/118_coach_requests.sql')
const listIn = (re) => { const m = mig.match(re); assert.ok(m, `CHECK پیدا نشد: ${re}`); return [...m[1].matchAll(/'([a-z]+)'/g)].map(x => x[1]) }

check('کلیدهای فرم همان CHECKهای مهاجرت‌اند', () => {
  assert.deepEqual(O.REQUEST_KIND_KEYS, listIn(/kind IN \(([^)]+)\)/))
  assert.deepEqual(O.REQUEST_LEVEL_KEYS, listIn(/level IN \(([^)]+)\)/))
  assert.deepEqual(O.REQUEST_TIME_KEYS, listIn(/availability <@ ARRAY\[([^\]]+)\]/))
  assert.ok(mig.includes(`length(message) <= ${O.REQUEST_MESSAGE_MAX}`), 'سقفِ پیام در فرم و مهاجرت یکی باشد')
})

check('رشته‌های مهاجرت همان DISCIPLINESِ پروفایلِ مربی‌اند', () => {
  const store = read('lib/coach-store.ts')
  const keys = [...store.slice(store.indexOf('export const DISCIPLINES')).matchAll(/key: '([a-z]+)'/g)].slice(0, 3).map(x => x[1])
  assert.deepEqual(listIn(/discipline IN \(([^)]+)\)/), keys)
})

check('عنوانِ درخواست (متغیرِ {1}) فقط از هشت مقدارِ اعلام‌شده به ملی‌پیامک است', () => {
  const doc = read('../../docs/sms-patterns.md')
  const labels = ['', 'اسنوکر', 'پاکت بیلیارد', 'هی‌بال']
  for (const k of O.REQUEST_KIND_KEYS) for (const d of labels) {
    const t = O.requestTitle(k, d)
    assert.ok(doc.includes(t), `«${t}» در فهرستِ مقدارهای docs/sms-patterns.md نیست`)
  }
  assert.equal(O.requestTitle('class', 'اسنوکر'), 'کلاس خصوصی اسنوکر')
  assert.equal(O.requestTitle('consult', ''), 'مشاوره')
})

check('الگوی coach_request ثبت شده، برچسب و نمونه‌ی چهارتایی دارد', () => {
  assert.ok(/'coach_request'/.test(read('lib/sms-server.ts')))
  assert.ok(/coach_request:\s+\{ fa:/.test(read('app/admin/sms/page.tsx')))
  const m = read('app/api/admin/sms/test/route.ts').match(/coach_request:\s+\[([^\]]+)\]/)
  assert.ok(m && m[1].split(',').length === 4, 'نمونه‌ی آزمایشی باید چهار آرگومان داشته باشد')
})

check('متنِ الگو: متغیرِ آخرِ خط ندارد، شماره‌ها پشتِ‌سرِ‌هم، نشانیِ سایت آخر', () => {
  const doc = read('../../docs/sms-patterns.md')
  const sec = doc.slice(doc.indexOf('## ۲۲) درخواست کلاس'))
  const body = sec.slice(sec.indexOf('```') + 3, sec.indexOf('```', sec.indexOf('```') + 3)).trim().split('\n')
  for (const line of body) assert.ok(!/\{\d\}\s*$/.test(line), `متغیر آخرِ خط: «${line}»`)
  assert.deepEqual([...body.join('\n').matchAll(/\{(\d)\}/g)].map(x => +x[1]), [0, 1, 2, 3])
  assert.equal(body.at(-1), 'www.billiardhub.net')
})

check('API: همان ترتیبِ آرگومان‌های الگو، سقف‌ها و حریمِ شماره', () => {
  const api = read('app/api/coach/requests/route.ts')
  assert.ok(api.includes(`notifyPattern(coachUser?.phone, 'coach_request', [coachName, title, studentName, studentPhone])`))
  assert.ok(api.includes('برای خودتان نمی‌توانید درخواست بفرستید'), 'درخواست به خود ممنوع')
  assert.ok(api.includes('c.is_demo'), 'پروفایلِ نمایشی صاحبی ندارد')
  assert.ok(/DAILY_LIMIT = 5/.test(api) && api.includes("gte('created_at', since)"), 'سقفِ روزانه')
  assert.ok(api.includes(`r.status === 'new' || r.status === 'contacted' ? `), 'شماره فقط برای درخواستِ باز')
  assert.ok(api.includes(".in('status', from)"), 'شرطِ وضعیت داخلِ خودِ UPDATE')
  assert.ok(!/status: 'new'/.test(api), 'هیچ کنشی درخواست را به «تازه» برنمی‌گرداند')
  assert.ok(mig.includes("WHERE status = 'new'"), 'یک درخواستِ بی‌پاسخ نزدِ هر مربی')
})

check('سقف‌ها داخلِ دیتابیس‌اند، با قفل — نه فقط «بخوان، بعد بنویس»', () => {
  assert.ok(mig.includes('pg_advisory_xact_lock') && mig.includes('BEFORE INSERT ON public.coach_requests'))
  assert.ok(mig.includes("ERRCODE = 'BH429'") && mig.includes("ERRCODE = 'BH430'"), 'سقفِ روزانه و یک درخواست به هر مربی در ۲۴ ساعت')
  const api = read('app/api/coach/requests/route.ts')
  assert.ok(api.includes("error.code === 'BH429'") && api.includes("error.code === 'BH430'"), 'خطای تریگر به ۴۲۹ِ فارسی برسد، نه ۵۰۰')
  assert.ok(mig.includes("CHECK (status <> 'contacted' OR contacted_at IS NOT NULL)"))
})

check('مربیِ مسدود پیامک نمی‌گیرد و محدودیتِ اجتماعی هم این مسیر را می‌بندد', () => {
  const api = read('app/api/coach/requests/route.ts')
  assert.ok(api.includes('canSignIn(await accountStateOf(c.owner_id))'), 'نام و شماره‌ی شاگرد به حسابِ مسدود نرود')
  const social = read('lib/enforcement/policy.ts').split('\n').find(l => l.trim().startsWith('social:')) ?? ''
  assert.ok(social.includes("'/api/coach/requests'"), 'پیشوند در قابلیتِ «تعامل اجتماعی»')
})

check('نظر دادن: تماسِ ثبت‌شده‌ی مربی پس از یک روز', () => {
  const rev = read('app/api/profiles/[kind]/[slug]/reviews/route.ts')
  assert.ok(rev.includes("from('coach_requests')") && rev.includes("not('contacted_at', 'is', null)"))
  assert.ok(rev.includes("lt('contacted_at'"), 'گذرِ زمان، نه لحظه‌ی تماس')
})

check('صفحه‌ی مربی فرمِ زمان‌دار ندارد و به صفحه‌ی درخواست می‌رود', () => {
  const page = read('app/coaches/[id]/CoachProfileClient.tsx')
  assert.ok(!page.includes('SessionRequest'))
  assert.equal((page.match(/\/request`/g) ?? []).length, 2, 'دکمه‌ی هیرو و نوارِ درخواست')
  assert.ok(read('app/coaches/[id]/request/page.tsx').includes('index: false'), 'صفحه‌ی فرم noindex')
})

console.log(`\n  نتیجه: ${count} موفق، 0 ناموفق — بی‌شبکه و بی‌نوشتن در دیتابیس`)
