import { FRAG, VERT, NB, ballLayout } from './hero-shader'

/* ─────────────────────────────────────────────────────────────
   رندرکننده‌ی صحنه‌ی هیروی درباره ما — منطقِ خالصِ WebGL، بی React.

   - رندر بر اساسِ نیاز: فقط وقتی چیزی عوض شود (ورود، نشانگر، اسکرول) فریم کشیده
     می‌شود؛ وقتی دوربین آرام گرفت یا بوم بیرون از دید است، هیچ حلقه‌ای نیست.
   - دوربین با فنرِ میرا از مقدارِ فعلی به هدف می‌رود (بدونِ جهش).
   - failIfMajorPerformanceCaveat: رندرِ نرم‌افزاری را نمی‌پذیرد.
   - GPUِ کند: اگر اولین فریم بیش از ۹۰ms شد وضوح کم می‌شود؛ اگر بیش از ۲۶۰ms،
     همه چیز برچیده می‌شود و عکس می‌ماند (onReady هرگز صدا زده نمی‌شود).
   - webglcontextlost (موبایل در پس‌زمینه، کمبودِ حافظه): onLost و توقف، تا عکس برگردد.
   خروجی: تابعِ dispose که همه‌ی شنونده‌ها، حلقه و context را آزاد می‌کند
   ───────────────────────────────────────────────────────────── */

const REST = { x: 0, y: 0.13, z: 1.62 }
const INTRO = 2400

export function createHeroRenderer(host: HTMLElement, cb: { onReady: () => void; onLost: () => void }): () => void {
  const canvas = document.createElement('canvas')
  canvas.className = 'ab-scene-canvas'
  const gl = canvas.getContext('webgl', {
    antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: true,
  })
  if (!gl) return () => {}

  const shaders: WebGLShader[] = []
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)
    if (!s) return null
    shaders.push(s)
    gl.shaderSource(s, src); gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error('[about/hero] shader', gl.getShaderInfoLog(s)); return null }
    return s
  }
  const prog = gl.createProgram()
  const vs = compile(gl.VERTEX_SHADER, VERT)
  const fs = compile(gl.FRAGMENT_SHADER, FRAG)
  const release = () => {
    shaders.forEach(s => gl.deleteShader(s))
    if (prog) gl.deleteProgram(prog)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
  if (!vs || !fs || !prog) { release(); return () => {} }
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error('[about/hero] link', gl.getProgramInfoLog(prog)); release(); return () => {} }
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = (n: string) => gl.getUniformLocation(prog, n)
  const uRes = u('uRes'), uCam = u('uCam'), uTarget = u('uTarget'), uLamp = u('uLamp')
  const { pos, col } = ballLayout()
  if (pos.length !== NB * 3) console.error('[about/hero] ball count mismatch')
  gl.uniform3fv(u('uBallP'), new Float32Array(pos))
  gl.uniform3fv(u('uBallC'), new Float32Array(col))

  host.appendChild(canvas)
  const mobile = window.matchMedia('(max-width: 767px)').matches
  let scale = Math.min(window.devicePixelRatio || 1, 1.5) * (mobile ? 0.55 : 0.7)
  const resize = () => {
    const r = canvas.getBoundingClientRect()
    const w = Math.max(2, Math.round(r.width * scale)), h = Math.max(2, Math.round(r.height * scale))
    /* فقط اگر واقعاً عوض شده — نوارِ ابزارِ iOS با هر نمایش/پنهان resize می‌فرستد */
    if (w === canvas.width && h === canvas.height) return false
    canvas.width = w; canvas.height = h
    gl.viewport(0, 0, w, h)
    return true
  }
  resize()

  const target = { px: 0, py: 0, s: 0 }
  const cur = { px: 0, py: 0, s: 0 }
  let t0 = 0, raf = 0, visible = true, first = true, dead = false

  const draw = (now: number) => {
    if (!t0) t0 = now
    const k = Math.min(1, (now - t0) / INTRO)
    const e = 1 - Math.pow(1 - k, 3)
    const lamp = Math.min(1, (now - t0) / 1200)
    gl.uniform2f(uRes, canvas.width, canvas.height)
    gl.uniform3f(uCam, REST.x + cur.px * 0.07, REST.y + (1 - e) * 0.22 + cur.py * 0.025 + cur.s * 0.32, REST.z + (1 - e) * 0.55 - cur.s * 0.75)
    gl.uniform3f(uTarget, cur.px * 0.03, -0.015 - cur.s * 0.06, -0.5 - cur.s * 0.35)
    gl.uniform1f(uLamp, 0.35 + 0.65 * lamp * lamp)
    const s0 = performance.now()
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    if (first) {
      first = false
      gl.finish()
      const ms = performance.now() - s0
      if (ms > 260) { dispose(); return false }
      if (ms > 90) { scale *= 0.6; resize() }
      cb.onReady()
    }
    return k < 1 || lamp < 1
  }

  const tick = (now: number) => {
    raf = 0
    if (!visible || dead) return
    const a = 1 - Math.exp(-1 / 7)
    cur.px += (target.px - cur.px) * a
    cur.py += (target.py - cur.py) * a
    cur.s += (target.s - cur.s) * (a * 1.6)
    const intro = draw(now)
    if (dead) return
    const moving = Math.abs(target.px - cur.px) + Math.abs(target.py - cur.py) + Math.abs(target.s - cur.s) > 0.0008
    if (intro || moving) raf = requestAnimationFrame(tick)
  }
  const kick = () => { if (!raf && visible && !dead) raf = requestAnimationFrame(tick) }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const r = canvas.getBoundingClientRect()
    target.px = ((e.clientX - r.left) / r.width) * 2 - 1
    target.py = ((e.clientY - r.top) / r.height) * 2 - 1
    kick()
  }
  const onScroll = () => {
    const r = canvas.getBoundingClientRect()
    target.s = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)))
    kick()
  }
  const onResize = () => { if (resize()) kick() }
  const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); raf = 0; dead = true; cb.onLost() }
  const io = new IntersectionObserver(entries => {
    const en = entries[entries.length - 1]
    visible = !!en?.isIntersecting
    if (visible) kick()
  })
  io.observe(canvas)
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  canvas.addEventListener('webglcontextlost', onLost)
  kick()

  /* const نه function: narrowingِ gl داخلِ تابعِ hoisted از دست می‌رفت */
  const dispose = () => {
    if (dead && !canvas.isConnected) return
    dead = true
    cancelAnimationFrame(raf)
    io.disconnect()
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    canvas.removeEventListener('webglcontextlost', onLost)
    if (buf) gl.deleteBuffer(buf)
    release()
    canvas.remove()
  }
  return dispose
}
