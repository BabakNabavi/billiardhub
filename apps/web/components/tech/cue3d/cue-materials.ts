/* ─────────────────────────────────────────────────────────────
   جنس‌های چوب — بافت‌ها روی canvas ساخته می‌شوند، نه دانلود.

   ⚠️ **هیچ فایلِ بافت و هیچ HDRIِ راه‌دور.** مخاطبِ این سایت روی
   شبکه‌ی ایران است و `Environment preset` در drei فایلِ HDRI را از
   CDN می‌گیرد — یعنی یا کند است یا اصلاً نمی‌آید و صحنه بی‌نور
   می‌ماند. همه‌چیز این‌جا محاسبه‌ای است: صفر بایت شبکه.

   ⚠️ بافت‌ها یک‌بار ساخته و کش می‌شوند. بدونِ کش، هر بار که React
   دوباره رندر کند یک canvasِ ۱۰۲۴ پیکسلی از نو کشیده می‌شود.
   ───────────────────────────────────────────────────────────── */

import * as THREE from 'three'

/** نویزِ یک‌بعدیِ چندلایه در محورِ محیط — پایه‌ی رگه */
function grainCurve(w: number, seed: number): Float32Array {
  let s = seed
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
  const out = new Float32Array(w)
  /* ⚠️ چند لایه با بسامدِ دوبرابر. تک‌لایه — یا بدتر، `sin`ِ ساده —
     خطوطِ کاملاً یکنواخت می‌دهد که مثلِ فلزِ خط‌خورده دیده می‌شود،
     نه چوب. چوب فاصله‌ی رگه‌هایش نامنظم است. */
  for (const [freq, amp] of [[7, 0.5], [17, 0.26], [41, 0.15], [97, 0.09]] as const) {
    const ctrl = new Float32Array(freq)
    for (let k = 0; k < freq; k++) ctrl[k] = rnd()
    for (let x = 0; x < w; x++) {
      const t = (x / w) * freq
      const a = Math.floor(t) % freq, b = (a + 1) % freq
      const fr = t - Math.floor(t)
      const sm = fr * fr * (3 - 2 * fr)
      /* ⚠️ خواندنِ ایندکس‌دار زیرِ noUncheckedIndexedAccess «شاید
         undefined» است. `!` اینجا لازم نیست: مقدارِ فعلی را در یک
         متغیر می‌گیریم که تایپش قطعی است. */
      const cur = out[x] ?? 0
      const va = ctrl[a] ?? 0, vb = ctrl[b] ?? 0
      out[x] = cur + (va * (1 - sm) + vb * sm) * amp
    }
  }
  let lo = Infinity, hi = -Infinity
  for (const v of out) { if (v < lo) lo = v; if (v > hi) hi = v }
  for (let x = 0; x < w; x++) out[x] = ((out[x] ?? 0) - lo) / (hi - lo || 1)
  return out
}

const cache = new Map<string, THREE.CanvasTexture>()

/**
 * بافتِ چوب.
 * ⚠️ نگاشتِ UV در `LatheGeometry`: X بافت ⟵ دورِ محیط، Y بافت ⟵ طول.
 * پس رگه باید در X تغییر کند و در Y تقریباً ثابت بماند تا خطوطش
 * *در امتدادِ* چوب بیفتد — همان چیزی که روی چوبِ تراش‌خورده از یک
 * تخته‌ی راست‌رگه دیده می‌شود.
 * @param contrast چقدر رگه تیره شود (افرا کم، رزوود زیاد)
 */
export function woodTexture(
  key: string, dark: string, light: string, contrast = 0.6,
): THREE.CanvasTexture {
  const hit = cache.get(key)
  if (hit) return hit

  const W = 1024, H = 512
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  const curve = grainCurve(W, key.length * 977 + 13)
  const img = ctx.createImageData(W, H)
  const d = img.data
  const lc = new THREE.Color(light), dc = new THREE.Color(dark)

  for (let y = 0; y < H; y++) {
    /* رگه در طولِ چوب کمی می‌لغزد — تخته کاملاً موازیِ محور بریده
       نمی‌شود و همین «کج‌شدنِ» آرام است که طبیعی نشانش می‌دهد. */
    const drift = Math.round(Math.sin((y / H) * Math.PI * 2) * 18 + Math.sin((y / H) * Math.PI * 6.4) * 7)
    for (let x = 0; x < W; x++) {
      const g = curve[(x + drift + W * 2) % W] ?? 0
      const k = Math.min(1, Math.pow(g, 1.55) * contrast)
      const col = lc.clone().lerp(dc, k)
      const o = (y * W + x) * 4
      d[o] = col.r * 255; d[o + 1] = col.g * 255; d[o + 2] = col.b * 255; d[o + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  cache.set(key, tex)
  return tex
}

/** رزوه‌ی جوینت — نوارِ متناوبِ روشن/تیره به‌عنوان نقشه‌ی برجستگی */
export function threadTexture(): THREE.CanvasTexture {
  const hit = cache.get('thread')
  if (hit) return hit
  const W = 8, H = 256
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  for (let y = 0; y < H; y++) {
    const v = Math.round(128 + 127 * Math.sin((y / H) * Math.PI * 2 * 26))
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(0, y, W, 1)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  cache.set('thread', tex)
  return tex
}

/** بافتِ ریزِ چرمِ تیپ */
export function leatherTexture(): THREE.CanvasTexture {
  const hit = cache.get('leather')
  if (hit) return hit
  const S = 256
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#8e8e8e'
  ctx.fillRect(0, 0, S, S)
  let s = 99
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
  for (let i = 0; i < 9000; i++) {
    const v = 110 + rnd() * 90
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.beginPath()
    ctx.arc(rnd() * S, rnd() * S, rnd() * 2.1, 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  cache.set('leather', tex)
  return tex
}
