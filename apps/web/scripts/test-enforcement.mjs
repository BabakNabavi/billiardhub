/* آزمونِ اعمالِ وضعیتِ حساب — بی‌دیتابیس، بی‌شبکه (امن برای CI).
       node scripts/test-enforcement.mjs

   دو بخش:
     ۱) منطقِ خالصِ lib/enforcement/policy.ts — هر وضعیت × هر مسیر × هر متد،
        و ترفندهای مسیر (پیشوندِ شبیه، حروفِ بزرگ، متدِ کوچک).
     ۲) گاردهای ایستا — هر نقطه‌ی ورود واقعاً به این سیستم وصل است: اگر
        کسی روزی بررسی را از login/refresh/adopt/proxy یا محافظِ مالک
        بردارد، این آزمون می‌شکند. */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..')
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const js = ts.transpileModule(read('lib/enforcement/policy.ts'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
const P = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

let pass = 0, fail = 0
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n      انتظار: ${JSON.stringify(want)}   دریافت: ${JSON.stringify(got)}`}`)
}
const head = s => console.log(`\n■ ${s}`)
const S = (status, extra = {}) => ({ status, expiresAt: null, restrictions: [], isOwner: false, ...extra })
const allow = (st, m, p) => P.decide(st, m, p).allow
const NOW = Date.parse('2026-11-01T12:00:00Z')
const past = '2026-10-01T00:00:00Z', future = '2026-12-01T00:00:00Z'

head('حسابِ فعال — همه‌چیز آزاد')
t('GET', allow(S('active'), 'GET', '/api/clubs'), true)
t('POST', allow(S('active'), 'POST', '/api/market/listings'), true)

head('مسدود/تعلیق/غیرفعال/حذف — هیچ API جز خروج و وضعیتِ خودش')
for (const st of ['suspended', 'banned', 'deactivated', 'deleted']) {
  t(`${st}: GET عمومی هم رد`, allow(S(st), 'GET', '/api/clubs'), false)
  t(`${st}: POST رد`, allow(S(st), 'POST', '/api/bookings'), false)
  t(`${st}: خروج آزاد`, allow(S(st), 'POST', '/api/auth/logout'), true)
  t(`${st}: وضعیتِ خودش آزاد`, allow(S(st), 'GET', '/api/account/status'), true)
  t(`${st}: تمدیدِ نشست رد`, allow(S(st), 'POST', '/api/auth/refresh'), false)
  t(`${st}: ورود ممنوع`, P.canSignIn(S(st)), false)
  t(`${st}: کد ACCOUNT_BLOCKED`, P.decide(S(st), 'GET', '/api/x').code, 'ACCOUNT_BLOCKED')
}

head('یکدست‌سازیِ مسیر — رمزگذاری، اسلشِ تکراری، حروفِ بزرگ')
{
  const st = S('limited', { restrictions: ['market'] })
  t('/api/m%61rket رد (همان بازار)', allow(st, 'POST', '/api/m%61rket'), false)
  t('/api//market/x رد', allow(st, 'POST', '/api//market/x'), false)
  t('/API/Market رد', allow(st, 'POST', '/API/Market'), false)
  t('/api/market/ (اسلشِ پایانی) رد', allow(st, 'POST', '/api/market/'), false)
  t('درصدِ نامعتبر خطا نمی‌دهد', P.normalizePath('/api/%E0%A4%A'), '/api/%e0%a4%a')
  t('مسدود: /api/contact برای اعتراض آزاد', allow(S('banned'), 'POST', '/api/contact'), true)
  t('مسدود: /api/contact%2F..%2Fbookings (رمزگذاری‌شده) رد', allow(S('banned'), 'POST', '/api/contact%2F..%2Fbookings'), false)
  t('مسدود: /API/contact (حروفِ بزرگ) رد — فهرستِ مجاز فقط خام', allow(S('banned'), 'POST', '/API/contact'), false)
  t('restricted: /api/support%2F..%2Fbookings رد', allow(S('restricted'), 'POST', '/api/support%2F..%2Fbookings'), false)
  t('limited (اجتماعی): نظرِ ویدیو رد', allow(S('limited', { restrictions: ['social'] }), 'POST', '/api/media/social/like'), false)
  t('limited (مدیا): پخشِ زنده رد', allow(S('limited', { restrictions: ['media'] }), 'POST', '/api/live/start'), false)
}

head('ترفندهای مسیر — پیشوندِ شبیه دری باز نمی‌کند')
t('/api/auth/logout-x برای مسدود رد', allow(S('banned'), 'POST', '/api/auth/logout-x'), false)
t('/api/account/statusX رد', allow(S('banned'), 'GET', '/api/account/statusX'), false)
t('/api/account/status/x (زیرمسیر) آزاد — مسیرِ واقعی ندارد', allow(S('banned'), 'GET', '/api/account/status/x'), true)
t('متدِ حروفِ کوچک post هم تغییردهنده است', allow(S('restricted'), 'post', '/api/bookings'), false)

head('restricted — فقط خواندن')
t('GET آزاد', allow(S('restricted'), 'GET', '/api/market'), true)
t('HEAD آزاد', allow(S('restricted'), 'HEAD', '/api/market'), true)
for (const m of ['POST', 'PUT', 'PATCH', 'DELETE']) t(`${m} رد`, allow(S('restricted'), m, '/api/clubs/1'), false)
t('تغییرِ رمز آزاد (امنیتِ خودِ حساب)', allow(S('restricted'), 'POST', '/api/auth/change-password'), true)
t('تماس با پشتیبانی آزاد (اعتراض)', allow(S('restricted'), 'POST', '/api/support'), true)
t('ورود مجاز', P.canSignIn(S('restricted')), true)

head('limited — فقط قابلیت‌های بسته')
{
  const st = S('limited', { restrictions: ['market', 'social'] })
  t('POST بازار رد', allow(st, 'POST', '/api/market/listings'), false)
  t('POST /api/products (هم بازار) رد', allow(st, 'POST', '/api/products'), false)
  t('POST استوری رد', allow(st, 'POST', '/api/stories'), false)
  t('GET بازار آزاد', allow(st, 'GET', '/api/market'), true)
  t('POST رزرو (بسته نشده) آزاد', allow(st, 'POST', '/api/bookings'), true)
  t('/api/marketplace (پیشوندِ شبیه) بسته نیست', allow(st, 'POST', '/api/marketplace'), true)
  t('کدِ FEATURE_RESTRICTED + نامِ قابلیت', [P.decide(st, 'POST', '/api/market').code, P.decide(st, 'POST', '/api/market').feature], ['FEATURE_RESTRICTED', 'market'])
  t('قابلیتِ ناشناخته بی‌اثر', allow(S('limited', { restrictions: ['nope'] }), 'POST', '/api/market'), true)
}

head('انقضا و مالک')
t('تعلیقِ منقضی ⟵ فعال', P.effectiveStatus(S('suspended', { expiresAt: past }), NOW), 'active')
t('تعلیقِ جاری ⟵ تعلیق', P.effectiveStatus(S('suspended', { expiresAt: future }), NOW), 'suspended')
t('مسدودِ دائم با تاریخ هم منقضی نمی‌شود', P.effectiveStatus(S('banned', { expiresAt: past }), NOW), 'banned')
t('حذف‌شده منقضی نمی‌شود', P.effectiveStatus(S('deleted', { expiresAt: past }), NOW), 'deleted')
t('مالک همیشه فعال (حتی اگر ردیف چیزِ دیگری بگوید)', P.effectiveStatus(S('banned', { isOwner: true }), NOW), 'active')
t('وضعیتِ ناشناخته ⟵ فعال', P.effectiveStatus(S('weird'), NOW), 'active')

head('پیامِ کاربر — بی‌جزئیاتِ داخلی')
for (const st of ['suspended', 'banned', 'deactivated', 'deleted', 'restricted', 'limited']) {
  t(`${st}: پیام دارد`, P.userMessage(st, null).length > 0, true)
}

/* ── ۲) گاردهای ایستا ── */
const has = (rel, re) => re.test(read(rel))

head('هر نقطه‌ی ورود به سیستم وصل است')
t('proxy: decide + accountStateOf روی /api', has('proxy.ts', /accountStateOf\(who\.id\)[\s\S]*decide\(state/), true)
t('proxy: صفحه‌ی محافظت‌شده ⟵ /account-status', has('proxy.ts', /canSignIn\(await accountStateOf\(session\.id\)\)/), true)
t('proxy: هدرِ Authorization هم سنجیده می‌شود', has('proxy.ts', /authorization[\s\S]*verifyEdge\(fromHeader\)/), true)
t('login: canSignIn پیش از issueSession', has('app/api/auth/login/route.ts', /canSignIn\(state\)[\s\S]*issueSession/), true)
t('refresh: canSignIn + revokeSession', has('app/api/auth/refresh/route.ts', /canSignIn\(state\)[\s\S]*revokeSession/), true)
t('adopt: فقط توکنِ قدیمی + canSignIn', has('app/api/auth/adopt/route.ts', /verifyLegacyToken\(token\)[\s\S]*canSignIn\(state\)/), true)
t('register: کد ملیِ مسدود', has('app/api/auth/register/route.ts', /nationalIdBlocked\(nid\)/), true)
t('verify/national-id: کد ملیِ مسدود', has('app/api/auth/verify/national-id/route.ts', /nationalIdBlocked\(nationalId\)/), true)
t('sessionFromRequest توکنِ تازه‌سازی را نمی‌پذیرد', has('lib/auth/session.ts', /verifyToken\(t, 'at'\)/), true)
t('actorOf: لایه‌ی دوم', has('lib/auth/ownership.ts', /canSignIn\(await accountStateOf\(row\.id\)\)/), true)

head('مسیرهای مالک')
{
  const dir = join(ROOT, 'app/api/owner')
  const files = []
  const walk = d => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : n === 'route.ts' && files.push(p) } }
  walk(dir)
  t('دست‌کم دو مسیر', files.length >= 2, true)
  for (const f of files) {
    const src = readFileSync(f, 'utf8')
    const methods = [...src.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)/g)].length
    const guards = [...src.matchAll(/await requireOwner\(req\)/g)].length
    t(`${f.slice(ROOT.length + 1)}: هر متد requireOwner دارد`, guards >= methods && methods > 0, true)
  }
  t('requireOwner از دیتابیس می‌پرسد (isPlatformOwner)', has('lib/enforcement/owner-auth.ts', /isPlatformOwner\(actor\.id\)/), true)
  t('مالک‌بودن هیچ‌جا از توکن/کوکی/تلفن خوانده نمی‌شود',
    /09121327283/.test(read('lib/enforcement/server.ts') + read('lib/enforcement/owner-auth.ts') + read('proxy.ts')), false)
}

head('محافظِ مالک در مسیرهای ادمین')
for (const f of ['app/api/admin/grant-admin/route.ts', 'app/api/admin/users/route.ts', 'app/api/admin/roles/route.ts', 'app/api/admin/support/route.ts']) {
  t(f, has(f, /ownerTargetGuard\(/), true)
}
t('مالک همه‌ی مجوزها را دارد', has('lib/admin/permissions.ts', /accountStateOf\(userId\)\)\.isOwner\) return \[ALL\]/), true)
t('ادمین کد ملیِ حسابِ محدود را عوض نمی‌کند', has('app/api/admin/users/route.ts', /nidLocked[\s\S]{0,700}effectiveStatus[\s\S]{0,300}isPlatformOwner\(actor\.id\)/), true)
t('مالک نقشِ اصلیِ ادمین را از دست نمی‌دهد (roles/my)', has('app/api/roles/my/route.ts', /primaryRole === 'admin' && await isPlatformOwner\(actor\.id\)/), true)
/* آذرِ ۱۴۰۵: مسیر بازنشسته شد (۴۱۰، هیچ نوشتنی) — محافظِ مالک آن‌جا دیگر لازم نیست */
t('مالک نقشِ اصلیِ ادمین را از دست نمی‌دهد (users/me)', has('app/api/users/me/route.ts', /await isPlatformOwner\(userId\)|status: 410/), true)
t('proxy: بازگشتِ درگاه از دروازه‌ی وضعیت معاف', has('proxy.ts', /fromGateway \? null : await claimsOf\(req\)/), true)
t('تریگر با session_user (نه current_user)', /session_user = 'postgres'/.test(readFileSync(join(ROOT, '../../supabase/migrations/113_account_enforcement.sql'), 'utf8')), true)
t('ادمین از دیتابیس، نه توکن (میزهای باشگاه)', /payload\.role !== 'admin'/.test(read('app/api/clubs/[id]/tables/route.ts') + read('app/api/clubs/[id]/tables/sync/route.ts')), false)

head('مهاجرتِ ۱۱۳')
{
  const sql = readFileSync(join(ROOT, '../../supabase/migrations/113_account_enforcement.sql'), 'utf8')
  t('تاریخچه فقط افزودنی (تریگر)', /BEFORE UPDATE OR DELETE ON public\.account_enforcement_actions/.test(sql), true)
  t('محافظتِ مالک (تریگر روی users)', /CREATE TRIGGER protect_platform_owner/.test(sql), true)
  t('حداکثر یک مالک (ایندکسِ یکتا)', /users_single_platform_owner/.test(sql), true)
  t('وضعیت‌ها با policy یکی‌اند', P.ACCOUNT_STATUSES.every(s => sql.includes(`'${s}'`)), true)
  t('کلیدِ عمومی به تاریخچه دسترسی ندارد', /REVOKE ALL ON public\.account_enforcement_actions FROM anon, authenticated/.test(sql), true)
}

console.log(`\n${'─'.repeat(50)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
