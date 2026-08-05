import fs from 'fs'
import path from 'path'

/* قواعدِ ملی‌پیامک را روی هر متنِ `docs/sms-patterns.md` می‌سنجد.
   از ریشه‌ی پروژه:  node apps/web/scripts/check-sms-patterns.mjs

   چرا هست: چهار متن در پنل رد شدند و علتش یک قاعده‌ی ریز بود —
   «متغیر نباید آخرِ خط بیفتد». چشمی پیدا کردنش سخت است چون متغیر
   وسطِ پیامک به نظر می‌رسد. پیش از فرستادنِ هر متنِ تازه به پنل،
   این را اجرا کنید.

   ⚠️ چهار الگو عمداً ❌ می‌مانند: تأیید شده‌اند و کار می‌کنند، و
   «اصلاح»شان یعنی ابطالِ کد و یک دورِ تأییدِ دیگر. جزئیات در سند. */
const doc = fs.readFileSync(path.join(process.cwd(), 'docs/sms-patterns.md'), 'utf8')

/* فقط بلوک‌هایی که یک الگوی واقعی‌اند: زیرشان خطِ `key` — args دارد */
const re = /```\n([\s\S]*?)```\n`([a-z_]+)` — args/g
let m, bad = 0, total = 0

while ((m = re.exec(doc))) {
  const [, body, key] = m
  total++
  const lines = body.trimEnd().split('\n')
  const problems = []

  for (const l of lines) {
    if (/\{\d+\}\s*$/.test(l)) problems.push(`متغیر آخرِ خط: «${l.trim()}»`)
  }

  /* شماره‌گذاری باید از ۰ و پشتِ سرِ هم باشد */
  const nums = [...body.matchAll(/\{(\d+)\}/g)].map(x => Number(x[1]))
  const uniq = [...new Set(nums)].sort((a, b) => a - b)
  if (uniq.length && (uniq[0] !== 0 || uniq.some((n, i) => n !== i))) {
    problems.push(`شماره‌گذاری: ${uniq.join(',')}`)
  }

  /* نشانیِ سایت باید آخر باشد */
  if (!/www\.billiardhub\.net\s*$/.test(body.trimEnd())) {
    problems.push('نشانی سایت در انتها نیست')
  }

  if (problems.length) { bad++; console.log('❌', key); problems.forEach(p => console.log('     ', p)) }
  else console.log('✅', key)
}

console.log(`\n${total} الگو بررسی شد — ${bad} مشکل‌دار`)
