'use client'

/* ─────────────────────────────────────────────────────────────
   صحنه‌ی استودیویی — نور، دوربین، زمین.

   ── چرا نورپردازی دستی است ──
   ⚠️ `<Environment preset="studio">`ِ drei فایلِ HDRI را از CDN
   می‌گیرد. مخاطبِ این سایت روی شبکه‌ی ایران است: یا کند می‌آید یا
   اصلاً نمی‌آید و آن‌وقت فلز و لاک هیچ بازتابی ندارند و کلِ صحنه
   پلاستیکی می‌شود. این‌جا محیط از چند `Lightformer` *داخلِ خودِ
   صحنه* ساخته می‌شود — صفر بایت شبکه، و بازتاب واقعی است.

   ── چرا قابِ نزدیک و مورب ──
   چوبِ ۱۴۷ سانتی از پهلو ذاتاً یک خطِ مو است؛ همین اشتباه بود که
   نسخه‌ی برداری را «نقاشیِ ساده» نشان می‌داد. عکسِ محصولِ واقعی
   (Rolex، Leica) شیء را نزدیک و بریده می‌گیرد تا قاب را پر کند.
   ───────────────────────────────────────────────────────────── */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { CueMesh } from './CueMesh'

export interface CueView {
  /** نقطه‌ای از محورِ چوب که دوربین هدف می‌گیرد (واحدِ نیم‌رخ) */
  target: number
  /** فاصله‌ی دوربین — کوچک‌تر یعنی ماکروتر */
  dist: number
  /** چرخشِ چوب حولِ محورِ خودش (رادیان) */
  spin: number
  /** شیبِ چوب در قاب (رادیان) */
  tilt: number
}

function Rig({ view }: { view: CueView }) {
  /* چوب حولِ Y ساخته شده و از نوکِ تیپ شروع می‌شود. برای اینکه
     نقطه‌ی هدف وسطِ قاب بیفتد، کلِ گروه جابه‌جا و بعد خوابانده
     می‌شود. */
  return (
    <group rotation={[0, 0, Math.PI / 2 + view.tilt]}>
      <group position={[0, -view.target, 0]} rotation={[0, view.spin, 0]}>
        <CueMesh />
      </group>
    </group>
  )
}

export function CueScene({
  view,
  ground = '#0B0B0C',
  className,
}: {
  view: CueView
  /** رنگِ زمینِ صحنه — با زمینه‌ی صفحه یکی باشد وگرنه قاب می‌پرد */
  ground?: string
  className?: string
}) {
  return (
    <Canvas
      className={className}
      shadows
      /* ⚠️ پیش‌فرضِ R3F ‏`always` است: صحنه‌ای کاملاً ایستا و
         بدونِ تعامل را ۶۰ بار در ثانیه، با نقشه‌ی سایه و clearcoat،
         تا ابد دوباره می‌کشید. `demand` فقط وقتی تغییری هست. */
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ position: [0, 0, view.dist], fov: 32, near: 0.05, far: 80 }}
    >
      <Suspense fallback={null}>
        <Rig view={view} />

        <StudioLights />
        {/* ⚠️ سایه‌ی تماس هنگامِ بیرون‌کشیدنِ نور از این صحنه بی‌صدا
            حذف شده بود؛ بدونش شیء روی زمینِ روشن شناور می‌ماند و
            همان چیزی می‌شود که «چسبانده‌شده» دیده می‌شود. */}
        <ContactShadows
          position={[0, -0.42, 0]} opacity={0.75} scale={14}
          blur={2.6} far={2.2} resolution={512} color="#000000"
        />
        {/* — پایانِ نور — */}
      </Suspense>

      <color attach="background" args={[ground]} />
    </Canvas>
  )
}

/* ─────────────────────────────────────────────────────────────
   نورِ مشترکِ استودیو.
   ⚠️ چوب و میز باید *زیرِ یک نور* رندر شوند، وگرنه دو تصویر کنارِ
   هم مثلِ دو عکس از دو استودیوی متفاوت دیده می‌شوند.
   ───────────────────────────────────────────────────────────── */
export function StudioLights() {
  return (
    <>
      {/* نورِ کلیدی از بالا-جلو، مثلِ سافت‌باکسِ استودیو */}
        <directionalLight
          position={[3.2, 4.5, 4]} intensity={2.1} castShadow
          shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004}
        />
        {/* پرکننده‌ی سرد از روبه‌رو تا سایه‌ها سیاهِ مرده نشوند */}
        <directionalLight position={[-3, -1.5, 2.5]} intensity={0.45} color="#cfe0f0" />
        {/* ⚠️ روی زمینِ مشکی، محیط تقریباً هیچ نورِ برگشتی نمی‌دهد و
            شیء در سایه گم می‌شود. این نورِ لبه‌ایِ پشتی همان چیزی
            است که در عکسِ محصول لبه‌ی درخشان می‌سازد. */}
        <directionalLight position={[-2.4, 1.6, -3.4]} intensity={2.6} color="#fff6e2" />
        <ambientLight intensity={0.22} />

        {/* محیطِ ساخته‌شده در صحنه — منبعِ بازتابِ فلز و لاک */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={4} color="#ffffff"
            position={[0, 3.4, 2.2]} scale={[8, 2.2, 1]} rotation={[-Math.PI / 3.2, 0, 0]} />
          <Lightformer form="rect" intensity={1.6} color="#ffe9c8"
            position={[3.6, 0.4, -1.6]} scale={[4, 3, 1]} rotation={[0, -Math.PI / 2.4, 0]} />
          <Lightformer form="rect" intensity={1.1} color="#cddcf0"
            position={[-3.8, -0.6, -1.2]} scale={[4, 3, 1]} rotation={[0, Math.PI / 2.4, 0]} />
          {/* حلقه‌ی نازکِ نورِ پشتی — لبه‌ی درخشانی که شیء را از زمینه جدا می‌کند */}
          <Lightformer form="ring" intensity={2.4} color="#ffffff"
            position={[0, 0.6, -3.2]} scale={[3, 3, 1]} />
        </Environment>

    </>
  )
}
