'use client'

/* ─────────────────────────────────────────────────────────────
   مشِ سه‌بعدیِ چوب — هفت قطعه‌ی دورانی، هر کدام با جنسِ خودش.

   ⚠️ یک هندسه‌ی یکپارچه با چند گروه ساخته *نشد*: مرزِ دو جنس در
   نمای ماکرو باید تیز باشد و مرزِ گروه‌ها روی یک نوارِ مثلثیِ
   مشترک محو می‌شود. قطعه‌های جدا مرزِ دقیق می‌دهند.

   ⚠️ همه‌ی هندسه‌ها و جنس‌ها `useMemo` شده‌اند: بدونِ آن هر رندرِ
   React هفت `LatheGeometry` و هفت متریالِ تازه می‌سازد و قبلی‌ها
   روی GPU نشت می‌کنند.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { CUE_SECTIONS } from './cue-profile'
import { woodTexture, threadTexture, leatherTexture } from './cue-materials'

const SEGMENTS = 96

export function CueMesh() {
  const parts = useMemo(() => {
    /* ⚠️ افرا چوبِ روشن و تقریباً یکدست است: کنتراستِ کم و
       خطوطِ زیاد. با کنتراستِ بالا «گردو» می‌شود نه شفتِ بیلیارد. */
    const maple = woodTexture('maple', '#c0955e', '#f4e8d2', 0.66)
    const rose = woodTexture('rose', '#1c0d07', '#8a4d2c', 1)
    const thread = threadTexture()
    const leather = leatherTexture()

    /* ⚠️ تکرارِ بافت در محورِ V با طولِ قطعه تنظیم می‌شود، وگرنه
       رگه‌ی شفتِ ۷ واحدی کش می‌آید و پلاستیکی می‌شود. */
    /* کلون‌ها نگه داشته می‌شوند تا در پاک‌سازی آزاد شوند */
    const clones: THREE.Texture[] = []
    const shaped = (t: THREE.Texture, len: number, rep: number) => {
      const c = t.clone()
      c.needsUpdate = true
      c.repeat.set(1, len * rep)
      clones.push(c)
      return c
    }

    const list = CUE_SECTIONS.map(sec => {
      const pts = sec.points.map(([r, y]) => new THREE.Vector2(r, y))
      const geo = new THREE.LatheGeometry(pts, SEGMENTS)
      const ys = sec.points.map(p => p[1])
      const len = Math.max(...ys) - Math.min(...ys)

      let mat: THREE.Material
      switch (sec.id) {
        case 'tip':
          mat = new THREE.MeshPhysicalMaterial({
            color: '#2f4a68', roughness: 0.92, metalness: 0,
            bumpMap: leather, bumpScale: 0.5, clearcoat: 0,
          })
          break
        case 'ferrule':
          /* عاجِ فرول: تقریباً سفید، کمی نیمه‌شفاف */
          mat = new THREE.MeshPhysicalMaterial({
            color: '#f4efe2', roughness: 0.28, metalness: 0,
            clearcoat: 0.7, clearcoatRoughness: 0.2,
            sheen: 0.4, sheenColor: new THREE.Color('#fffaf0'),
          })
          break
        case 'joint':
          /* برنجِ تراش‌خورده — رزوه با نقشه‌ی برجستگی، نه هندسه */
          mat = new THREE.MeshPhysicalMaterial({
            /* ⚠️ زردِ اشباع «طلای پلاستیکی» می‌دهد؛ برنجِ تراش‌خورده
               خاکستری‌تر و آرام‌تر است. */
            color: '#b09a63', roughness: 0.3, metalness: 1,
            bumpMap: shaped(thread, len, 1), bumpScale: 1.6,
          })
          break
        case 'wrap':
          /* رَپِ کنفِ ایرلندی — مات و بافت‌دار */
          mat = new THREE.MeshPhysicalMaterial({
            color: '#d9cdb4', roughness: 0.95, metalness: 0,
            bumpMap: shaped(leather, len, 3), bumpScale: 0.8,
          })
          break
        case 'shaft':
          mat = new THREE.MeshPhysicalMaterial({
            map: shaped(maple, len, 0.14),
            roughness: 0.22, metalness: 0,
            /* لاکِ روی چوب: بازتابِ نازکِ سطحی که چوب را «پرداخت‌شده»
               نشان می‌دهد. بدونش چوب گچی دیده می‌شود. */
            clearcoat: 0.9, clearcoatRoughness: 0.09,
          })
          break
        default:
          mat = new THREE.MeshPhysicalMaterial({
            map: shaped(rose, len, 0.16),
            roughness: 0.26, metalness: 0,
            clearcoat: 0.85, clearcoatRoughness: 0.12,
          })
      }
      return { id: sec.id, geo, mat }
    })
    return { list, clones }
  }, [])

  /* ⚠️ R3F فقط چیزهایی را که *خودش* ساخته آزاد می‌کند؛ هندسه و
     متریالی که از راهِ پراپ داده می‌شود روی GPU می‌ماند. با دو
     صحنه در سایت (خدمات و پروفایل) و رفت‌وبرگشتِ مسیرها، این
     نشتِ واقعی است. */
  useEffect(() => () => {
    parts.list.forEach(p => { p.geo.dispose(); p.mat.dispose() })
    parts.clones.forEach(t => t.dispose())
  }, [parts])

  return (
    <group>
      {parts.list.map(p => <mesh key={p.id} geometry={p.geo} material={p.mat} castShadow receiveShadow />)}
      {/* حلقه‌های نقره‌ای دو سرِ رَپ و کنارِ جوینت — جزئیاتی که
          «ساخته‌شده» بودن را می‌رساند */}
      {/* ⚠️ شعاعِ هر حلقه از شعاعِ *همان نقطه* می‌آید. با یک شعاعِ
          ثابت، حلقه‌ی کنارِ جوینت (شعاعِ ۰٫۱۰) به اندازه‌ی رَپ
          (۰٫۱۳۸) بیرون می‌زد و مثلِ مهره روی چوب می‌نشست. */}
      {([[7.29, 0.1008], [7.77, 0.1015], [11.29, 0.1305], [13.36, 0.138]] as const).map(([y, r]) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[r + 0.0012, r + 0.0012, 0.03, SEGMENTS]} />
          <meshPhysicalMaterial color="#e8e4d8" roughness={0.18} metalness={0.9} />
        </mesh>
      ))}
    </group>
  )
}
