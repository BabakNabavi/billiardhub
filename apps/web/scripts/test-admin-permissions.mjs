/* مرزِ دسترسیِ ادمین‌ها — ممیزیِ پنلِ سوپرادمین (آبان ۱۴۰۵).
       node scripts/test-admin-permissions.mjs

   هر ادمین فهرستی از کلیدها دارد (lib/admin/permissions) و صفحه‌ی «دسترسی
   ادمین» همین را تیک می‌زند. ممیزی نشان داد بیشترِ مسیرهای قدیمی‌تر فقط
   «ادمین بودن» را می‌پرسیدند و `ownsClub`/`ownsSeller` هر ادمینی را مالک
   حساب می‌کردند: ادمینی با کلیدِ «اخبار» می‌توانست تنظیماتِ پلتفرم را عوض
   کند، رزرو با بازپرداخت لغو کند یا مسابقه‌ی هر باشگاهی را حذف کند.

   این آزمون ایستاست (کد را می‌خواند، به شبکه و دیتابیس وصل نمی‌شود) و
   شکلِ سرورسایدِ همان مرز را قفل می‌کند. */

import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const read = p => readFileSync(join(here, '..', p), 'utf8')
const code = p => read(p)
  .replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1')

let pass = 0, fail = 0
const t = (name, ok, extra = '') => {
  ok ? pass++ : fail++
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : '\n      ← ' + extra}`)
}
const head = s => console.log(`\n■ ${s}`)

const walk = (dir, out = []) => {
  for (const d of readdirSync(join(here, '..', dir), { withFileTypes: true })) {
    const rel = dir + '/' + d.name
    if (d.isDirectory()) walk(rel, out)
    else if (d.name === 'route.ts') out.push(rel)
  }
  return out
}

const perms = code('lib/admin/permissions.ts')
const KEYS = [...perms.matchAll(/\{ key: '([^']+)', label: '[^']*'(?:, hint: '[^']*')? \}/g)].map(m => m[1])
const valid = k => KEYS.includes(k) || k === 'access'

{
  head('کلیدهای پویا همه در فهرستِ دسترسی‌اند')
  t('فهرستِ کلیدها خوانده شد', KEYS.length >= 25, `${KEYS.length}`)

  const pk = perms.match(/PROFILE_KIND_KEY[^=]*=\s*\{([^}]+)\}/)?.[1] ?? ''
  const pkVals = [...pk.matchAll(/:\s*'([^']+)'/g)].map(m => m[1])
  t('هر شش نوعِ پروفایل کلید دارد', pkVals.length === 6, pk)
  t('کلیدِ هر نوعِ پروفایل معتبر است', pkVals.every(valid), pkVals.filter(k => !valid(k)).join(','))

  const own = code('lib/auth/ownership.ts')
  const ak = (own.match(/type AdminKey\s*=\s*([^\n]+)/)?.[1] ?? '').match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) ?? []
  t('AdminKey تعریف شده', ak.length >= 4, ak.join(','))
  t('هر AdminKey در فهرست هست', ak.every(valid), ak.filter(k => !valid(k)).join(','))

  const content = code('lib/admin/content.ts')
  const kinds = (content.match(/type ContentKind\s*=\s*([^\n]+)/)?.[1] ?? '').match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) ?? []
  t('نوع‌های محتوا خوانده شد', kinds.length === 4, kinds.join(','))
  t('نامِ هر نوعِ محتوا خودش کلیدِ دسترسی است', kinds.every(valid), kinds.filter(k => !valid(k)).join(','))
}

{
  head('تنظیماتِ پلتفرم: هر کلید مالِ صفحه‌ی خودش')
  const s = code('app/api/admin/settings/route.ts')
  const writable = [...(s.match(/const WRITABLE[^{]*\{([\s\S]*?)\n\};/)?.[1] ?? '').matchAll(/^\s*(\w+):\s*'(bool|json|phone)'/gm)].map(m => m[1])
  const owner = s.match(/const OWNER_KEY[^{]*\{([\s\S]*?)\n\};/)?.[1] ?? ''
  const ownerMap = Object.fromEntries([...owner.matchAll(/(\w+):\s*'([^']+)'/g)].map(m => [m[1], m[2]]))
  t('کلیدهای قابلِ نوشتن خوانده شد', writable.length >= 10, writable.join(','))
  t('هر کلیدِ قابلِ نوشتن صاحب دارد', writable.every(k => ownerMap[k]), writable.filter(k => !ownerMap[k]).join(','))
  t('صاحبِ هر کلید کلیدِ دسترسیِ معتبر است', Object.values(ownerMap).every(valid),
    Object.entries(ownerMap).filter(([, v]) => !valid(v)).map(([k, v]) => `${k}⟵${v}`).join(','))
  t('نوشتن کلیدِ صاحب را می‌پرسد', /can\(g\.actor!\.id, OWNER_KEY\[key\] \?\? 'access'\)/.test(s))
  t('اجازه پیش از اولین نوشتن سنجیده می‌شود (همه یا هیچ)',
    s.indexOf("OWNER_KEY[key] ?? 'access'") > 0 && s.indexOf("OWNER_KEY[key] ?? 'access'") < s.indexOf('.upsert('))
  /* شماره‌ی هشدارِ تخلف رشته است؛ نوعِ 'json' آن را بی‌صدا رد می‌کرد */
  t('شماره‌ی هشدارِ تخلف نوعِ phone دارد', /report_alert_phone:\s*'phone'/.test(s))
  t('شماره پیش از ذخیره سنجیده و یکدست می‌شود', /toPhone\(b\[key\]\) === null/.test(s) && /kind === 'phone' \? toPhone/.test(s))
}

{
  head('هیچ مسیری فقط «ادمین بودن» را نمی‌پرسد')
  /* این چهار عمداً «هر ادمین»اند: صفحه‌شان در فهرستِ دسترسی کلیدی ندارد
     (ژورنال خطا، ژورنال رویداد، آمار داشبورد) یا فقط خواندن است (تنظیمات). */
  const ALLOWED = new Set([
    'app/api/admin/errors/route.ts', 'app/api/admin/logs/route.ts',
    'app/api/admin/stats/route.ts', 'app/api/admin/settings/route.ts',
  ])
  const offenders = walk('app/api').filter(p => !ALLOWED.has(p) && /\bisAdmin\(/.test(code(p)))
  t('isAdmin فقط در مسیرهای بی‌کلید', offenders.length === 0, offenders.join(' · '))
  t('خواندنِ تنظیمات هنوز فقط برای ادمین است', /isAdmin\(actor\.id\)/.test(code('app/api/admin/settings/route.ts')))

  const admin = walk('app/api/admin').concat(walk('app/api/owner'))
  const unguarded = admin.filter(p => !/\b(can|canAny|isSuperAdmin|requireOwner|isAdmin|permissionsOf)\(/.test(code(p)))
  t('هر مسیرِ /api/admin و /api/owner نگهبانِ دیتابیسی دارد', unguarded.length === 0, unguarded.join(' · '))
}

{
  head('مالکِ باشگاه/فروشگاه: ادمین فقط با کلیدِ همان بخش')
  const own = code('lib/auth/ownership.ts')
  t('دیگر «ادمین همیشه مجاز» نیست', !/if \(actor\.isAdmin\) return true/.test(own))
  t('ownsClub کلیدِ بخش را اجباری می‌گیرد', /ownsClub\(actor: Actor, clubId: string, adminKey: AdminKey\)/.test(own))
  t('استثنای ادمین از can() می‌گذرد', /actor\.isAdmin && can\(actor\.id, key\)/.test(own))

  /* هر فراخوانیِ ownsClubِ این ماژول سه آرگومان دارد */
  const users = walk('app/api').filter(p => /from '@\/lib\/auth\/ownership'/.test(read(p)) && /\bownsClub\(/.test(code(p)))
  const twoArg = users.filter(p => [...code(p).matchAll(/\bownsClub\(((?:[^()]|\([^()]*\))*)\)/g)].some(m => m[1].split(',').length < 3))
  t('هیچ فراخوانیِ ownsClub بی‌کلید نیست', users.length >= 10 && twoArg.length === 0, `${users.length} فایل · ${twoArg.join(' · ')}`)
  t('دیدنِ پیش‌نویسِ مسابقه هم کلید می‌خواهد',
    !/actor\.role === 'admin' \|\|/.test(code('app/api/tournaments/[id]/route.ts')))
}

{
  head('مسیرهای حساس کلیدِ درست را می‌پرسند')
  const has = (p, re) => re.test(code(p))
  t('لغوِ رزرو (با بازپرداخت) ⟵ bookings', has('app/api/bookings/[id]/cancel/route.ts', /can\(actor\.id, 'bookings'\)/))
  t('پیش‌نمایشِ بازپرداخت نشست می‌خواهد',
    /export async function GET\(req[\s\S]{0,300}actorFromRequest\(req\)[\s\S]{0,200}status: 401/.test(code('app/api/bookings/[id]/cancel/route.ts')))
  t('آگهی‌ها ⟵ products', has('app/api/products/[id]/route.ts', /can\(actor\.id, 'products'\)/)
    && has('app/api/market/ads/[id]/route.ts', /can\(actor\.id, 'products'\)/))
  t('برندها ⟵ brands', has('app/api/market/brands/route.ts', /can\(actor\.id, 'brands'\)/))
  t('پیامکِ آزمایشی ⟵ sms', has('app/api/admin/sms/test/route.ts', /can\(actor\.id, 'sms'\)/))
  t('حسابِ بانکی و مالیِ باشگاه ⟵ finance', has('app/api/clubs/[id]/bank-account/route.ts', /can\(actor\.id, 'finance'\)/)
    && has('app/api/clubs/[id]/finance/route.ts', /can\(actor\.id, 'finance'\)/))
  t('محتوا ⟵ نامِ نوع', has('app/api/admin/content/[kind]/route.ts', /can\(actor\.id, kind\)/)
    && (code('app/api/admin/content/[kind]/route.ts').match(/guard\(req, kind\)/g) ?? []).length === 4)
  const prof = code('app/api/admin/profiles/route.ts')
  t('تأیید/ردِ پروفایل کلیدِ نوعِ واقعی (از دیتابیس) را می‌خواهد',
    /from\('profiles'\)\.select\('kind'\)/.test(prof) && /canAny\(actor\.id, \[kindKey, 'roles'\]\)/.test(prof))
  t('تیکِ آبی همچنان verified می‌خواهد', /can\(actor\.id, 'verified'\)/.test(prof))
}

{
  head('پیامِ موفقیت فقط پس از پاسخِ موفق')
  const roles = code('app/admin/roles/page.tsx')
  const fn = roles.slice(roles.indexOf('const handleAction'), roles.indexOf('const handleAction') + 1200)
  t('نقش‌ها: پاسخ خوانده می‌شود', /if \(r\.ok\)/.test(fn), fn.slice(0, 200))
  t('نقش‌ها: «تأیید شد» فقط در شاخه‌ی موفق', fn.indexOf("'نقش تأیید شد'") > fn.indexOf('if (r.ok)') && fn.indexOf('if (r.ok)') > 0)
  t('نقش‌ها: پیامِ خطای سرور نشان داده می‌شود', /j\?\.message/.test(fn))
}

{
  /* بازبینِ کد این‌ها را پس از دورِ اول پیدا کرد: الگوی `actor.isAdmin` (از actorOf)
     و `isAdmin()` در lib از دیدِ جست‌وجوی `isAdmin(` در route.tsها پنهان بود. */
  head('هیچ «actor.isAdmin» بی‌کلید در مسیرها و lib نمانده')
  const all = (dir, out = []) => {
    for (const d of readdirSync(join(here, '..', dir), { withFileTypes: true })) {
      const rel = dir + '/' + d.name
      if (d.isDirectory()) all(rel, out)
      else if (/\.ts$/.test(d.name)) out.push(rel)
    }
    return out
  }
  const files = [...all('app/api'), ...all('lib')]
  const bare = []
  for (const p of files) {
    const src = code(p)
    /* ⚠️ بی‌await، `actor.isAdmin && can(…)` درونِ یک if همیشه درست است (Promise
       truthy است) — یعنی دورزدن. تنها استثنا adminMay در ownership است که نتیجه را
       برمی‌گرداند و فراخواننده await می‌کند. */
    const re = p === 'lib/auth/ownership.ts'
      ? /\bactor\.isAdmin\b(?!\s*&&\s*(?:await\s+)?can\()/g
      : /\bactor\.isAdmin\b(?!\s*&&\s*await\s+can\()/g
    for (const m of src.matchAll(re)) bare.push(`${p}@${src.slice(0, m.index).split('\n').length}`)
  }
  t('هر actor.isAdmin کنارِ await can(…) است', bare.length === 0, bare.join(' · '))
  t('آپلود دیگر isAdmin نمی‌پرسد', !/\bisAdmin(?:User)?\(/.test(code('lib/upload/policy.ts')))
  t('آپلودِ رنکینگ ⟵ rankings، آپلود در باشگاهِ دیگران ⟵ clubs',
    /can\(actorId, 'rankings'\)/.test(code('lib/upload/policy.ts')) && /can\(actorId, 'clubs'\)/.test(code('lib/upload/policy.ts')))
  t('مدیا و کانال ⟵ media', (code('app/api/media/route.ts').match(/can\(actor\.id, 'media'\)/g) ?? []).length === 3
    && /can\(actor\.id, 'media'\)/.test(code('app/api/media/channel/route.ts')))
  t('تپش و پایانِ پخشِ دیگران ⟵ live', /actor\.isAdmin && await can\(actor\.id, 'live'\)/.test(code('app/api/live/route.ts')))

  /* canAny([...]) هم کلیدِ نوشتاری دارد و از دیدِ گاردِ can() بیرون بود */
  const badAny = []
  for (const p of files) {
    for (const m of code(p).matchAll(/\bcanAny\([^,]+,\s*\[([^\]]*)\]/g)) {
      for (const k of [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1])) if (!valid(k)) badAny.push(`${p} ⟵ ${k}`)
    }
  }
  t('هر کلیدِ نوشتاریِ canAny معتبر است', badAny.length === 0, badAny.join(' · '))

  const lc = code('app/api/admin/license-check/route.ts')
  t('استعلامِ جواز (نوشتنِ «تأییدشده») کلیدِ نوعِ هدف را می‌خواهد',
    /canAny\(actor\.id, \['clubs', 'roles'\]\)/.test(lc) && /canAny\(actor\.id, \[kindKey, 'roles'\]\)/.test(lc))
  t('فهرستِ همه‌ی باشگاه‌ها برای «تیک آبی» هم باز است، دادهٔ خصوصی فقط clubs',
    /canAny\(actor\.id, \['clubs', 'verified'\]\)/.test(code('app/api/clubs/route.ts'))
    && /canSeePrivate = await can\(actor!\.id, 'clubs'\)/.test(code('app/api/clubs/route.ts')))
  const rv = code('app/api/admin/review/route.ts')
  t('دیدنِ مدرک: پس از خواندنِ ردیف کلیدِ همان نوع سنجیده می‌شود',
    /canAny\(actor\.id, \[kindKey, 'roles'\]\)/.test(rv) && /canAny\(actor\.id, \['clubs', 'roles'\]\)/.test(rv)
    && /can\(actor\.id, 'roles'\)/.test(rv))
  t('فهرستِ پروفایل‌ها به نوع‌های دارای کلید محدود می‌شود',
    /canAny\(actor\.id, VIEW_EXTRA\)/.test(code('app/api/admin/profiles/route.ts'))
    && /kinds\.length === 0/.test(code('app/api/admin/profiles/route.ts')))
  const rep = code('app/admin/reports/page.tsx')
  t('گزارش‌ها: پیامِ سرور و شماره‌ی یکدست‌شده نشان داده می‌شود',
    /setErr\(j\?\.message \|\|/.test(rep) && /settings\?\.report_alert_phone/.test(rep))
  const dash = code('app/dashboard/club/page.tsx')
  t('داشبوردِ باشگاه: ادمین اول باشگاه‌های خودش', /api\.get\('\/clubs\/my-clubs'\)/.test(dash)
    && /isAdmin && list\.length === 0/.test(dash))
  t('داشبوردِ باشگاه: خطای خواندن با «باشگاهی نداری» یکی نیست',
    /setClubsError\(true\)/.test(dash) && /if \(clubsError && clubs\.length === 0\)/.test(dash))
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
