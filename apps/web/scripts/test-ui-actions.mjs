/* دکمه‌ها و فرم‌ها — از راهی که کاربر می‌رود، نه از راهی که API دارد.
       node scripts/test-ui-actions.mjs

   ── چرا این تست لازم شد ──
   سه باگ را کاربر با چند دقیقه کلیک پیدا کرد که هیچ‌کدام از تست‌های
   قبلی نگرفتند، چون همه‌ی آن‌ها API را مستقیم صدا می‌زدند:

   · دکمه‌ی «دسترسی» در فهرستِ کاربران هیچ `onClick` نداشت.
   · فرمِ تماس با ما `fetch` خام می‌زد، پس هدرِ CSRF نداشت و کاربرِ
     واردشده همیشه ۴۰۳ می‌گرفت.
   · دکمه‌ی «حذف نقش» فقط استورِ مرورگر را عوض می‌کرد و به سرور
     نمی‌گفت.

   هر سه یک لایه بالاتر از جایی بودند که تست می‌رسید. این تست همان
   لایه را می‌سنجد: هر دکمه‌ی کنشی باید `onClick` داشته باشد، هر
   نوشتنی باید از `apiFetch` بگذرد، و اثرش باید در دیتابیس بنشیند. */
import fs from 'node:fs'
import jwt from 'jsonwebtoken'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY, S = env.JWT_SECRET
const B = process.env.BH_BASE ?? 'http://localhost:3000'

const rest = async (p, i) => {
  const r = await fetch(U + '/rest/v1/' + p, {
    ...(i ?? {}),
    headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(i?.headers ?? {}) },
  })
  const t = await r.text()
  return { s: r.status, b: t ? JSON.parse(t) : null }
}

let pass = 0, fail = 0
const t = (n, ok, x = '') => { ok ? pass++ : fail++; console.log('  ' + (ok ? '✓' : '✗') + ' ' + n + (ok ? '' : '  ← ' + x)) }
const head = x => console.log('\n■ ' + x)
const note = x => console.log('  ⓘ ' + x)

/* ── ۱) هیچ دکمه‌ی کنشی بدونِ onClick ──────────────────────────────
   دکمه‌ای که `title` یا متن دارد ولی هیچ handler ندارد، از دید کاربر
   خراب است. دکمه‌های نوعِ submit داخل فرم مستثنا هستند. */
head('دکمه‌های مرده — بدونِ onClick')
const PAGES = [
  'app/admin/users/page.tsx', 'app/admin/clubs/page.tsx', 'app/admin/products/page.tsx',
  'app/admin/verifications/page.tsx', 'app/admin/roles/page.tsx', 'app/admin/tournaments/page.tsx',
  'app/admin/access/page.tsx', 'app/admin/bookings/page.tsx',
]
for (const f of PAGES) {
  if (!fs.existsSync(f)) continue
  const src = fs.readFileSync(f, 'utf8')
  /* هر <button …> تا اولین > را بردار */
  const dead = []
  for (const m of src.matchAll(/<button\b([^>]*)>/g)) {
    const attrs = m[1]
    if (/onClick|type=["']submit["']|disabled=\{true\}/.test(attrs)) continue
    /* دکمه‌ای که چند خطی است ممکن است onClick در خطوط بعد داشته باشد؛
       بازه‌ی ۳۰۰ نویسه‌ی بعدی هم بررسی می‌شود. */
    const after = src.slice(m.index, m.index + 300)
    if (/onClick/.test(after)) continue
    dead.push((attrs.match(/title=["']([^"']+)["']/) ?? [, '?'])[1])
  }
  t(('بدونِ دکمه‌ی مرده: ' + f.split('/').slice(-2).join('/')).padEnd(48),
    dead.length === 0, dead.join(' · '))
}

/* ── ۲) هر نوشتنی باید از apiFetch بگذرد ────────────────────────────
   `fetch` خام برای POST/PATCH/DELETE یعنی نبودِ هدرِ CSRF، و کاربرِ
   واردشده ۴۰۳ می‌گیرد. */
head('نوشتن با fetch خام — نبودِ هدرِ CSRF')
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name
    if (e.isDirectory()) { if (e.name !== 'api') walk(p, out) }
    else if (e.name.endsWith('.tsx')) out.push(p)
  }
  return out
}
/* این مسیرها عمداً از بررسیِ CSRF معاف‌اند (proxy.ts): خودشان نشست
   می‌سازند و در اولین ورود هنوز کوکیِ CSRF وجود ندارد. */
const CSRF_EXEMPT = ['/api/auth/login', '/api/auth/register', '/api/auth/adopt',
  '/api/auth/refresh', '/api/auth/logout', '/api/otp', '/api/payments/callback']
const offenders = []
for (const f of [...walk('app'), ...walk('components')]) {
  const src = fs.readFileSync(f, 'utf8')
  for (const m of src.matchAll(/(?<!api)fetch\(\s*['"`]\/api\/[^)]*?method:\s*['"](POST|PATCH|PUT|DELETE)['"]/gs)) {
    const url = (m[0].match(/['"`](\/api\/[^'"`?]*)/) ?? [, ''])[1]
    if (CSRF_EXEMPT.some(p => url.startsWith(p))) continue
    offenders.push(f.replace(/\\/g, '/') + ' → ' + m[1] + ' ' + url)
  }
}
t('هیچ نوشتنی با fetch خام نیست', offenders.length === 0, offenders.slice(0, 4).join(' | '))

/* ── ۳) حذفِ نقش واقعاً سمتِ سرور انجام می‌شود ──────────────────── */
head('حذف نقش — سمتِ سرور و با محافظ')
const owner = (await rest('users?select=id,phone,"primaryRole","secondaryRoles"&primaryRole=eq.club_owner&limit=1')).b?.[0]
if (!owner) { note('باشگاه‌داری در دیتابیس نیست — این بخش رد شد') }
else {
  const ORIG = { primaryRole: owner.primaryRole, secondaryRoles: owner.secondaryRoles }
  const clubs = ((await rest('clubs?select=id&ownerId=eq.' + owner.id)).b ?? []).length
  note('باشگاه‌دارِ آزمایش: ' + clubs + ' باشگاه')
  const tok = jwt.sign({ sub: owner.id, role: 'club_owner', phone: owner.phone }, S, { expiresIn: '10m' })
  const del = async role => {
    const r = await fetch(B + '/api/roles/my?role=' + encodeURIComponent(role), {
      method: 'DELETE', headers: { Authorization: 'Bearer ' + tok },
    })
    let b = null; try { b = await r.json() } catch { /* */ }
    return { s: r.status, b }
  }
  t('مهمان نمی‌تواند نقش حذف کند',
    (await (await fetch(B + '/api/roles/my?role=coach', { method: 'DELETE' })).status) === 401, '')

  if (clubs > 0) {
    const r = await del('club_owner')
    t('باشگاه‌دارِ دارای باشگاه نمی‌تواند نقشش را حذف کند', r.s === 409,
      'HTTP ' + r.s + ' ' + JSON.stringify(r.b).slice(0, 90))
    const now = (await rest('users?select="primaryRole","secondaryRoles"&id=eq.' + owner.id)).b[0]
    t('نقشش دست‌نخورده ماند', now.primaryRole === ORIG.primaryRole, now.primaryRole)
    t('و در secondaryRoles هم مانده',
      JSON.stringify(now.secondaryRoles) === JSON.stringify(ORIG.secondaryRoles), JSON.stringify(now.secondaryRoles))
  } else note('این باشگاه‌دار باشگاهی ندارد — محافظ آزموده نشد')

  t('حذفِ نقشِ admin از این مسیر ممکن نیست', (await del('admin')).s === 403, '')
  t('نقشِ بی‌نام رد می‌شود', (await del('')).s === 400, '')

  const back = (await rest('users?select="primaryRole","secondaryRoles"&id=eq.' + owner.id)).b[0]
  t('نقشِ باشگاه‌دار در پایان دست‌نخورده است',
    back.primaryRole === ORIG.primaryRole &&
    JSON.stringify(back.secondaryRoles) === JSON.stringify(ORIG.secondaryRoles), back.primaryRole)
}

console.log('\n  موفق: ' + pass + '   ناموفق: ' + fail + '\n')
process.exit(fail ? 1 : 0)
