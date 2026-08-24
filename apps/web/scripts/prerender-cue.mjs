/* ─────────────────────────────────────────────────────────────
   رندرِ ازپیشِ صحنه‌ی سه‌بعدیِ چوب به تصویرِ ثابت.

   ── چرا ──
   چانکِ three.js اندازه‌گیری شد: **۲۵۶ کیلوبایتِ gzip**. مخاطبِ
   اصلیِ این سایت گوشیِ ایرانی با شبکه‌ی کند است؛ فرستادنِ آن حجم
   به موبایل فقط برای یک تصویرِ ثابت، هزینه‌ی بی‌دلیل است.

   پس همان صحنه یک‌بار این‌جا رندر می‌شود و خروجی‌اش WebP است:
   موبایل دقیقاً همان تصویر را می‌بیند، با صفر بایت جاوااسکریپتِ
   سه‌بعدی و صفر بارِ GPU. دسکتاپ نسخه‌ی زنده و تعاملی را می‌گیرد.

   ── اجرا ──
   سرورِ توسعه باید بالا باشد:
     npm run dev
     node scripts/prerender-cue.mjs
   خروجی: public/images/cue/*.webp
   ⚠️ این اسکریپت بخشی از بیلد نیست — دستی اجرا می‌شود و خروجی‌اش
   کامیت می‌شود. وگرنه هر بیلد به یک مرورگرِ headless وابسته می‌شد.
   ───────────────────────────────────────────────────────────── */

import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const puppeteer = require('puppeteer-core')
const sharp = require('sharp')

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'public', 'images', 'cue')
const BASE = process.env.BASE ?? 'http://localhost:3000'

/* ⚠️ نماها با نماهای دسکتاپ یکی‌اند تا گذر از موبایل به دسکتاپ
   پرشِ بصری ندهد. هر تغییری این‌جا باید در CUE_VIEWS هم بیفتد. */
const SHOTS = [
  { id: 'hero',    w: 1400, h: 900, view: { target: 7.55, dist: 1.15, spin: 0.5, tilt: -0.2 } },
  { id: 'tip',     w: 1200, h: 760, view: { target: 0.33, dist: 0.72, spin: 0.2, tilt: -0.28 } },
  { id: 'ferrule', w: 1200, h: 760, view: { target: 0.62, dist: 0.85, spin: 0.35, tilt: -0.24 } },
  { id: 'shaft',   w: 1200, h: 760, view: { target: 4.2,  dist: 1.05, spin: 0.6, tilt: -0.26 } },
  { id: 'joint',   w: 1200, h: 760, view: { target: 7.53, dist: 0.95, spin: 0.5, tilt: -0.22 } },
  { id: 'butt',    w: 1200, h: 760, view: { target: 13.6, dist: 1.5,  spin: 0.9, tilt: -0.18 } },
]

mkdirSync(OUT, { recursive: true })

const b = await puppeteer.launch({
  channel: 'chrome',
  headless: 'new',
  args: ['--no-proxy-server', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

for (const s of SHOTS) {
  const p = await b.newPage()
  await p.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 2 })
  const q = new URLSearchParams({
    target: String(s.view.target), dist: String(s.view.dist),
    spin: String(s.view.spin), tilt: String(s.view.tilt), bare: '1',
  })
  await p.goto(`${BASE}/cue3d?${q}`, { waitUntil: 'networkidle0', timeout: 180000 })
  /* ⚠️ رندرِ نرم‌افزاری کند است؛ بدونِ این مکث تصویر نیمه‌کاره ذخیره
     می‌شود (سایه و بازتاب هنوز نیامده‌اند). */
  await new Promise(r => setTimeout(r, 14000))

  /* ⚠️ عکس از *خودِ canvas* گرفته می‌شود، نه از ویوپورت. ناوبرِ
     سایت `z-index: 200` دارد و نشانگرِ «Compiling»ِ سرورِ توسعه هم
     روی صفحه است؛ عکسِ تمام‌صفحه هر دو را داخلِ تصویر می‌آورد. */
  /* ⚠️ نشانگرِ حالتِ توسعه‌ی Next روی گوشه‌ی صفحه شناور است و چون
     عکسِ عنصری هرچه در آن ناحیه رسم شده را برمی‌دارد، داخلِ تصویر
     می‌افتاد. اینجا پنهانش می‌کنیم تا خروجی فقط خودِ رندر باشد. */
  await p.addStyleTag({
    content: "nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none!important}",
  })
  const cv = await p.waitForSelector("canvas", { timeout: 60000 })
  if (!cv) throw new Error("canvas نیامد: " + s.id)
  const tmp = join(OUT, `${s.id}.png`)
  await cv.screenshot({ path: tmp })
  const buf = await sharp(tmp).webp({ quality: 88, effort: 6 }).toBuffer()
  writeFileSync(join(OUT, `${s.id}.webp`), buf)
  unlinkSync(tmp)
  console.log(`✓ ${s.id}.webp  ${(buf.length / 1024).toFixed(0)} KB`)
  await p.close()
}

await b.close()
console.log('رندرِ ازپیش تمام شد →', OUT)
