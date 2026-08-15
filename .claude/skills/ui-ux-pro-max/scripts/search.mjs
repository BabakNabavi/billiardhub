/* جست‌وجوی داده‌های این اسکیل — بدونِ پایتون.
 *
 * ⚠️ چرا این فایل هست: اسکیل اصلی با `scripts/search.py` می‌آید و
 * پایتون روی این دستگاه نصب نیست. داده‌ها ولی CSV سـاده‌اند، پس یک
 * خواننده‌ی کوچک با Node همان کار را می‌کند و وابستگیِ تازه‌ای هم
 * نمی‌خواهد. اگر روزی پایتون نصب شد، `search.py` دقیق‌تر است
 * (امتیازدهی و حالتِ --design-system دارد) و این فقط جایگزین است.
 *
 * استفاده:
 *   node .claude/skills/ui-ux-pro-max/scripts/search.mjs "safe area notch" --domain ux
 *   node .claude/skills/ui-ux-pro-max/scripts/search.mjs "rtl" --stack nextjs
 *   node .claude/skills/ui-ux-pro-max/scripts/search.mjs --list
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')

const DOMAINS = {
  ux: 'ux-guidelines.csv',
  app: 'app-interface.csv',
  style: 'styles.csv',
  color: 'colors.csv',
  typography: 'typography.csv',
  product: 'products.csv',
  reasoning: 'ui-reasoning.csv',
  motion: 'motion.csv',
  gsap: 'motion.csv',
  icons: 'icons.csv',
  chart: 'charts.csv',
  landing: 'landing.csv',
  perf: 'react-performance.csv',
}

/** CSV با فیلدهای گیومه‌دار و کاماهای داخلِ متن */
function parseCsv(text) {
  const rows = []
  let row = [], field = '', qt = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (qt) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else qt = false }
      else field += c
    } else if (c === '"') qt = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const head = rows.shift() ?? []
  return rows.filter(r => r.some(Boolean)).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

const args = process.argv.slice(2)
if (args.includes('--list')) {
  console.log('domain:', Object.keys(DOMAINS).join(', '))
  console.log('stack: ', readdirSync(join(DATA, 'stacks')).map(f => f.replace('.csv', '')).join(', '))
  process.exit(0)
}

const flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null }
const domain = flag('--domain')
const stack = flag('--stack')
const limit = Number(flag('--limit') ?? 6)
const query = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--domain' && args[i - 1] !== '--stack' && args[i - 1] !== '--limit').join(' ')

const files = stack
  ? [join(DATA, 'stacks', `${stack}.csv`)]
  : domain
    ? [join(DATA, DOMAINS[domain] ?? `${domain}.csv`)]
    : Object.values(DOMAINS).map(f => join(DATA, f))

const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
const scored = []
for (const f of files) {
  if (!existsSync(f)) { console.error(`فایل نیست: ${f}`); continue }
  for (const r of parseCsv(readFileSync(f, 'utf8'))) {
    const hay = Object.values(r).join(' ').toLowerCase()
    const score = terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0)
    if (score) scored.push({ score, file: f.split(/[\\/]/).pop(), r })
  }
}

scored.sort((a, b) => b.score - a.score)
if (!scored.length) { console.log('نتیجه‌ای نبود — با واژه‌های دیگر یا --domain مشخص دوباره بزن.'); process.exit(0) }

for (const { score, file, r } of scored.slice(0, limit)) {
  console.log(`\n── ${file}  (${score}/${terms.length})`)
  for (const [k, v] of Object.entries(r)) if (v) console.log(`   ${k}: ${v}`)
}
