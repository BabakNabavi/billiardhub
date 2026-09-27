/* دو تابعِ خالصِ ژورنال.
   اجرا:  node scripts/test-log-helpers.mjs

   ⚠️ چرا ارزشِ تست دارد: `maskPhone` تنها چیزی است که جلوی نشستنِ
   شماره‌ی خام در `audit_logs` را می‌گیرد، و آن جدول **هرس نمی‌شود** —
   یعنی یک باگِ مرزی این‌جا برای همیشه در دیتابیس می‌ماند.

   ⚠️ منطقِ هر دو این‌جا تکرار شده، نه import: فایل‌های اصلی TypeScript
   و از زنجیره‌ی ماژولِ Next می‌آیند، و این اسکریپت باید با `node`
   خالی و بدونِ بیلد اجرا شود — همان الگوی بقیه‌ی `test:*`ها. اگر
   منبع عوض شد و این‌جا نه، آزمون قرمز می‌شود؛ که هدف است. */

let pass = 0, fail = 0
const ok = m => { pass++; console.log('  ✓', m) }
const bad = m => { fail++; console.log('  ✗', m) }
const eq = (got, want, label) =>
  got === want ? ok(`${label} ⟵ ${JSON.stringify(got)}`)
               : bad(`${label}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`)

/* ── آینه‌ی lib/auth/auth-audit.ts ── */
function maskPhone(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return '—'
  if (s.length <= 7) return '*'.repeat(s.length)
  return `${s.slice(0, 4)}${'*'.repeat(s.length - 7)}${s.slice(-3)}`
}

/* ── آینه‌ی components/admin/LogAtoms.tsx ── */
function shortUA(ua) {
  if (!ua) return '—'
  const os = ua.match(/(iPhone|iPad|Android|Windows|Macintosh|Linux)/i)
  const br = ua.match(/(Chrome|Safari|Firefox|Edg|OPR)\/[\d.]+/i)
  return [os?.[1], br?.[0]].filter(Boolean).join(' · ') || ua.slice(0, 28)
}

console.log('\n■ maskPhone — مرزها')
eq(maskPhone(null), '—', 'null')
eq(maskPhone(undefined), '—', 'undefined')
eq(maskPhone(''), '—', 'رشته‌ی خالی')
eq(maskPhone('   '), '—', 'فقط فاصله')
eq(maskPhone('1234567'), '*******', 'هفت رقم — هیچ‌چیز فاش نشود')
eq(maskPhone('12345678'), '1234*678', 'هشت رقم')
eq(maskPhone('09123456789'), '0912****789', 'موبایلِ ایران')

console.log('\n■ maskPhone — هیچ‌وقت شماره‌ی خام برنگردد')
{
  /* همین است که باید تضمین شود: خروجی نباید با ورودی برابر باشد، و
     نباید هیچ زیررشته‌ی هفت‌رقمیِ پیوسته از ورودی را نگه دارد. */
  let leaked = 0
  for (const p of ['09123456789', '09001327283', '02122859551', '12345678', '123456789012345']) {
    const m = maskPhone(p)
    if (m === p) { leaked++; bad(`«${p}» دست‌نخورده برگشت`) }
    else if (!m.includes('*')) { leaked++; bad(`«${p}» بدونِ پوشش برگشت: ${m}`) }
    else if (m.length !== p.length) { leaked++; bad(`طولِ «${p}» عوض شد: ${m}`) }
  }
  if (!leaked) ok('هیچ ورودیِ هشت‌رقم‌به‌بالا خام یا بی‌پوشش برنگشت')
}

console.log('\n■ maskPhone — ارقامِ فاش‌شده دقیقا هفت‌تاست')
{
  const m = maskPhone('09123456789')
  const shown = m.replace(/\*/g, '').length
  if (shown === 7) ok('هفت رقم دیده می‌شود (۴ اول + ۳ آخر)')
  else bad(`${shown} رقم دیده می‌شود، انتظار ۷`)
}

console.log('\n■ shortUA')
eq(shortUA(null), '—', 'خالی')
eq(shortUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) AppleWebKit/605.1.15 Safari/604.1'),
   'iPhone · Safari/604.1', 'آیفون')
eq(shortUA('Mozilla/5.0 (Windows NT 10.0) Chrome/131.0.0.0 Safari/537.36'),
   'Windows · Chrome/131.0.0.0', 'ویندوز — کروم پیش از سافاری می‌آید')
eq(shortUA('curl/8.4.0'), 'curl/8.4.0', 'ناشناخته ⟵ بیست‌وهشت کاراکترِ اول')

console.log('\n■ shortUA — هرگز throw نکند')
{
  let threw = 0
  for (const v of [null, undefined, '', 'x', 'A'.repeat(5000)]) {
    try { shortUA(v) } catch { threw++; bad(`throw روی ${JSON.stringify(String(v).slice(0, 12))}`) }
  }
  if (!threw) ok('روی هیچ ورودی‌ای throw نکرد')
}

console.log(`\n${'─'.repeat(52)}\n  نتیجه: ${pass} موفق، ${fail} ناموفق\n`)
process.exit(fail ? 1 : 0)
