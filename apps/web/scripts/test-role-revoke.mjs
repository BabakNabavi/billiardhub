/* آزمونِ برداشتن و بازگرداندنِ نقش — بی‌دیتابیس، بی‌شبکه (امن برای CI).
       node scripts/test-role-revoke.mjs

   دو بخش:
     ۱) منطقِ خالصِ lib/roles/revoke-logic.ts — ستون‌ها پس از برداشتن/افزودن،
        ردِ تصمیم در یادداشت، و متنِ پیامدها
     ۲) گاردهای ایستا — قفلِ «برداشته‌شده توسط مدیریت» در هر سه راهی که نقش را
        خودکار برمی‌گرداند، مجوزِ مسیرِ ادمین، و بسته‌ماندنِ PATCH /api/users/me */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ts = createRequire(import.meta.url)('typescript')
const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..')
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const js = ts.transpileModule(read('lib/roles/revoke-logic.ts'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText
const L = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

let pass = 0, fail = 0
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n      انتظار: ${JSON.stringify(want)}   دریافت: ${JSON.stringify(got)}`}`)
}
const head = s => console.log(`\n■ ${s}`)

head('نقش‌های برداشتنی')
t('مربی برداشتنی است', L.isRevocable('coach'), true)
t('باشگاه‌دار برداشتنی است', L.isRevocable('club_owner'), true)
t('ادمین برداشتنی نیست', L.isRevocable('admin'), false)
t('کاربر عادی برداشتنی نیست', L.isRevocable('user'), false)
t('مقدارِ غیرمتن', L.isRevocable(undefined), false)

head('برداشتن — ستون‌ها')
t('نقشِ فرعی: اصلی دست نمی‌خورد',
  L.removeRoleFrom({ primaryRole: 'seller', secondaryRoles: ['seller', 'coach'] }, 'coach'),
  { primaryRole: 'seller', secondaryRoles: ['seller'] })
t('نقشِ اصلی: نقشِ بعدی جایش می‌نشیند',
  L.removeRoleFrom({ primaryRole: 'coach', secondaryRoles: ['coach', 'referee'] }, 'coach'),
  { primaryRole: 'referee', secondaryRoles: ['referee'] })
t('نقشِ اصلیِ تنها: «کاربر عادی»',
  L.removeRoleFrom({ primaryRole: 'coach', secondaryRoles: ['coach'] }, 'coach'),
  { primaryRole: 'user', secondaryRoles: [] })
t('نقشِ غیرادمین بر ادمینِ فرعی مقدم است',
  L.removeRoleFrom({ primaryRole: 'coach', secondaryRoles: ['admin', 'seller'] }, 'coach'),
  { primaryRole: 'seller', secondaryRoles: ['admin', 'seller'] })
t('فقط ادمینِ فرعی ماند ⟵ اصلی ادمین (proxy درِ /admin را با نقشِ اصلی باز می‌کند)',
  L.removeRoleFrom({ primaryRole: 'coach', secondaryRoles: ['admin', 'coach'] }, 'coach'),
  { primaryRole: 'admin', secondaryRoles: ['admin'] })
t('ادمینِ اصلی با برداشتنِ نقشِ دیگر ادمین می‌ماند',
  L.removeRoleFrom({ primaryRole: 'admin', secondaryRoles: ['club_owner'] }, 'club_owner'),
  { primaryRole: 'admin', secondaryRoles: [] })
t('تکرار و خالی پاک می‌شود',
  L.removeRoleFrom({ primaryRole: 'seller', secondaryRoles: ['coach', 'coach', '', 'seller'] }, 'seller'),
  { primaryRole: 'coach', secondaryRoles: ['coach'] })
t('ستونِ تهی', L.removeRoleFrom({ primaryRole: null, secondaryRoles: null }, 'coach'), { primaryRole: 'user', secondaryRoles: [] })

head('بازگرداندن — ستون‌ها')
t('کاربرِ بی‌نقش: همان نقش اصلی می‌شود',
  L.addRoleTo({ primaryRole: 'user', secondaryRoles: [] }, 'coach'), { primaryRole: 'coach', secondaryRoles: ['coach'] })
t('نقشِ اصلیِ معنادار جابه‌جا نمی‌شود',
  L.addRoleTo({ primaryRole: 'club_owner', secondaryRoles: ['club_owner'] }, 'coach'),
  { primaryRole: 'club_owner', secondaryRoles: ['club_owner', 'coach'] })
t('نقشِ موجود تکرار نمی‌شود',
  L.addRoleTo({ primaryRole: 'coach', secondaryRoles: ['coach'] }, 'coach'), { primaryRole: 'coach', secondaryRoles: ['coach'] })

head('ردِ تصمیم در یادداشتِ role_requests')
const note = L.adminRevokeNote('  مدرک مربیگری جعلی بود  ')
const noteHid = L.adminRevokeNote('مدرک مربیگری جعلی بود', true)
t('یادداشتِ ادمین ⟵ admin', L.revocationKindOf(note), 'admin')
t('یادداشتِ ادمینِ با پنهان‌کردن هم admin', L.revocationKindOf(noteHid), 'admin')
t('دلیل بی پیشوند و بی فاصله', L.revokeReasonOf(note), 'مدرک مربیگری جعلی بود')
t('دلیل بی برچسبِ «پروفایل پنهان شد»', L.revokeReasonOf(noteHid), 'مدرک مربیگری جعلی بود')
t('یادداشتِ خودِ کاربر ⟵ self', L.revocationKindOf(L.selfRevokeNote(true)), 'self')
t('ردِ معمولیِ درخواست قفل نیست', L.revocationKindOf('مدرک خوانا نیست'), null)
t('یادداشتِ بازگرداندن قفل نیست', L.revocationKindOf(L.ADMIN_RESTORED_NOTE), null)
t('یادداشتِ تهی', L.revocationKindOf(null), null)
t('دلیلِ غیرادمین خالی', L.revokeReasonOf('مدرک خوانا نیست'), '')
t('سقفِ ۵۰۰ نویسه (ستونِ متنی)', L.adminRevokeNote('ا'.repeat(900)).length, 500)

head('کدام پروفایل به صف برمی‌گردد — فقط پنهان‌شده با همین برداشتن')
t('بی پنهان‌کردن برچسب ندارد', L.noteHidProfile(L.selfRevokeNote(false)), false)
t('با پنهان‌کردن برچسب دارد', L.noteHidProfile(L.selfRevokeNote(true)), true)
t('برچسب یک‌بار مصرف است', L.noteHidProfile(L.markProfileRequeued(L.selfRevokeNote(true))), false)
t('مصرف‌شده هنوز «حذف» خوانده می‌شود', L.revocationKindOf(L.markProfileRequeued(L.selfRevokeNote(true))), 'self')

head('برچسبِ تاریخچه برای کاربر')
t('حذفِ خودش «رد شده» نیست', L.requestStatusLabel('rejected', L.selfRevokeNote(true)), 'حذف‌شده')
t('برداشتنِ مدیریت', L.requestStatusLabel('rejected', noteHid), 'برداشته‌شده توسط مدیریت')
t('ردِ معمولی', L.requestStatusLabel('rejected', 'مدرک خوانا نیست'), 'رد شده')
t('پیش‌نویس', L.requestStatusLabel('draft', null), 'پروفایل تکمیل نشده')
t('پیامِ قفل بی نقطه‌ی پایانی و بی نقطه وسطِ جمله', /[.]/.test(L.LOCKED_MESSAGE), false)

head('متنِ پیامدها — قاعده‌ی متنِ سایت')
const all = ['coach', 'seller', 'club_owner', 'player'].flatMap(r => [...L.revokeConsequences(r, 'self'), ...L.revokeConsequences(r, 'admin')])
t('هیچ سطری با نقطه تمام نمی‌شود', all.filter(s => /[.。]\s*$/.test(s)), [])
t('بی فتحه/کسره/ضمه/تشدید', all.filter(s => /[ً-ْ]/.test(s)), [])
t('ادمین: قفل گفته می‌شود', L.revokeConsequences('coach', 'admin').some(s => s.includes('بازنگردانید')), true)
t('کاربر: برگشت گفته می‌شود', L.revokeConsequences('coach', 'self').some(s => s.includes('دوباره')), true)
t('فروشنده‌ی ادمین: نشانِ فروشگاه', L.revokeConsequences('seller', 'admin').some(s => s.includes('نشان فروشگاه')), true)
t('فروشنده‌ی خودِ کاربر: آگهی دست نمی‌خورد', L.revokeConsequences('seller', 'self').some(s => s.includes('نشان فروشگاه')), false)
t('باشگاه‌دار: باشگاهِ تأییدشده مانع است', L.revokeConsequences('club_owner', 'self').some(s => s.includes('باشگاه تأییدشده')), true)
t('ادمین: تیک آبی هم می‌رود', L.revokeConsequences('coach', 'admin').some(s => s.includes('تیک آبی')), true)
t('باشگاه‌دار پروفایلِ عمومی ندارد', L.revokeConsequences('club_owner', 'admin').some(s => s.includes('پروفایل')), false)

head('گاردهای ایستا — قفل در هر راهِ برگشتِ خودکار')
const req = read('app/api/roles/request/route.ts')
const sub = read('app/api/roles/submit/route.ts')
const prof = read('app/api/profiles/[kind]/route.ts')
const clubs = read('app/api/clubs/route.ts')
const clubPut = read('app/api/clubs/[id]/route.ts')
const adminProf = read('app/api/admin/profiles/route.ts')
const adminRoles = read('app/api/admin/roles/route.ts')
const count = (s, re) => (s.match(re) ?? []).length
t('انتخابِ نقش قفل را می‌پرسد و «نامعلوم» را می‌بندد', /lockState\(actor\.id, role\)/.test(req) && /lock === 'unknown'/.test(req), true)
t('انتخابِ نقش: دوباره پیش از دادنِ نقش', count(req, /lockState\(actor\.id, role\)/g) >= 2, true)
t('ساخت/ویرایشِ پروفایل قفل را می‌پرسد', /lockState\(actor\.id, kind\)/.test(prof), true)
t('قفلِ پروفایل پیش از ذخیره است', prof.indexOf('lockState(actor.id, kind)') < prof.indexOf('saveProfile({'), true)
t('پروفایل: دوباره پیش از دادنِ نقش', count(prof, /lockState\(actor\.id, kind\)/g) >= 2, true)
t('ساختِ باشگاه قفلِ باشگاه‌دار را می‌پرسد (دو بار)', count(clubs, /lockState\(payload\.id, 'club_owner'\)/g) >= 2, true)
t('ساختِ باشگاه is_demo را از بدنه نمی‌پذیرد', /delete \(rest as Record<string, unknown>\)\.is_demo/.test(clubs), true)
t('ارسالِ دوباره‌ی باشگاهِ ردشده قفل را می‌پرسد', /lockState\(userId, 'club_owner'\)/.test(clubPut), true)
t('انتشارِ باشگاه از سوی ادمین قفلِ مالک را می‌پرسد', /lockState\(String\(club\.ownerId\), 'club_owner'\)/.test(clubPut), true)
t('انتشارِ پروفایل از سوی ادمین قفلِ صاحب را می‌پرسد', /lockState\(r\.owner_id, String\(r\.kind\)\)/.test(adminProf), true)
t('تأییدِ درخواستِ نقشِ قفل‌شده بسته است', /lockState\(rr\.user_id, rr\.role\)/.test(adminRoles), true)
t('ردِ درخواست با پیشوندِ برداشتن قفل نمی‌سازد', /revocationKindOf\(note\)/.test(adminRoles), true)
t('پروفایلِ پنهان با «ثبت نهایی» به صف برمی‌گردد، نه با انتخاب', /requeueAfterRegrant\(actor\.id, role\)/.test(sub) && !/requeue/i.test(req.replace(/\/\*[\s\S]*?\*\//g, '')), true)

head('گاردهای ایستا — مسیرها')
const admin = read('app/api/admin/users/[id]/roles/route.ts')
const my = read('app/api/roles/my/route.ts')
const me = read('app/api/users/me/route.ts')
const core = read('lib/roles/revoke.ts')
t('تغییرِ نقشِ دیگران فقط با «مدیریت نقش‌ها»', /export async function POST[\s\S]*?can\(actor\.id, 'roles'\)/.test(admin), true)
t('حسابِ مالکِ پلتفرم محافظت می‌شود', /ownerTargetGuard\(actor\.id, id/.test(admin), true)
t('ورودی با Zod سنجیده می‌شود', /safeParse\(/.test(admin), true)
t('حذفِ خودِ کاربر از هسته می‌گذرد', /revokeRole\(\{ userId: actor\.id, role, mode: 'self'/.test(my), true)
t('PATCH /api/users/me بازنشسته است (هیچ نوشتنی)', /status: 410/.test(me) && !/\.update\(/.test(me), true)
t('هسته: ادمین هرگز برداشته نمی‌شود', /role === 'admin'\) return fail\(403/.test(core), true)
t('هسته: هر باشگاهِ تأییدشده مانع است', /approvedClubsOf\(userId\)/.test(core) && /in\('verificationStatus', \['verified', 'approved'\]\)/.test(core), true)
t('هسته: پروفایل پنهان می‌شود نه حذف', /status: 'rejected', updated_at/.test(core) && !/from\('profiles'\)\s*\.delete\(/.test(core), true)
const iRow = core.indexOf("from('role_requests').insert({\n    user_id: userId, role, status: 'rejected'")
const iProf = core.indexOf("from('profiles').update(patch)")
const iUsers = core.indexOf("from('users').update({\n      primaryRole: next.primaryRole")
t('هسته: ترتیب — ردیفِ قفل ⟵ پروفایل ⟵ ستون‌ها', iRow > 0 && iRow < iProf && iProf < iUsers, true)
t('هسته: شکستِ ردیفِ قفل در ردِ مدیریت یعنی هیچ تغییری', /if \(mode === 'admin'\) return fail\(500, 'ثبت برداشتن نقش انجام نشد/.test(core), true)
t('هسته: نامکِ فروشگاه پاک نمی‌شود (برگشت‌پذیر)', !/storeSlug: null/.test(core), true)

console.log(`\n  نتیجه: ${pass} موفق، ${fail} ناموفق`)
process.exit(fail ? 1 : 0)
