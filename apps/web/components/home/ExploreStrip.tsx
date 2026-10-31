/* ─────────────────────────────────────────────────────────────
   نوار «کاوش بیشتر» — Server Component.

   هشت لینک ثابت بود که هیچ حالتی نداشت؛ تنها چیزی که کلاینتی‌اش
   می‌کرد `onMouseEnter/onMouseLeave` برای افکت هاور بود. همان افکت
   با CSS خالص بازسازی شد، پس این سکشن دیگر هیچ جاوااسکریپتی به
   مرورگر نمی‌فرستد.

   خودِ کارت‌ها، رنگِ هر بخش و CSSشان در `ExploreCards` است — همان که
   صفحه‌ی ۴۰۴ هم نشان می‌دهد. این‌جا فقط پس‌زمینه، لکه‌ها و تیترِ نوار.
   ───────────────────────────────────────────────────────────── */

/* کارت‌ها و رنگ‌های بخش‌ها در ExploreCards‌اند — صفحه‌ی ۴۰۴ هم همان‌ها را نشان می‌دهد */
import { ExploreCards } from './ExploreCards'

const TEXT = '#1A1917'

export default function ExploreStrip() {
  return (
    <section className="hm-defer" style={{
      position: 'relative',
      background: 'linear-gradient(140deg,#EDE9E2 0%,#F4F1EC 45%,#E8E4DD 100%)',
      padding: 'clamp(36px,3.8vw,56px) clamp(16px,5%,80px)', overflow: 'hidden',
    }}>

      {/* لکه‌های محیطی — پالت کنترل‌شده: فقط طلایی و سبز نمدی */}
      <div aria-hidden style={{ position: 'absolute', top: '-80px', right: '8%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(199,166,106,0.28) 0%,transparent 65%)', filter: 'blur(48px)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: '-60px', left: '12%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(20,83,45,0.14) 0%,transparent 65%)', filter: 'blur(44px)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', top: '30%', left: '38%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle,rgba(199,166,106,0.12) 0%,transparent 65%)', filter: 'blur(42px)', pointerEvents: 'none' }} />
      <div aria-hidden className="sec-word" style={{ ['--wc' as never]: 'rgba(154,110,56,0.08)', top: 'auto', bottom: '-8px' }}>EXPLORE</div>

      <div style={{ maxWidth: 1340, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(20px,2.4vw,32px)' }}>
          {/* خواستِ مالک (آبانِ ۱۴۰۵): برچسبِ «بیشتر ببینید» و «… کاوش کن» رفتند */}
          <h3 style={{ fontSize: 'clamp(17px,1.9vw,24px)', fontWeight: 800, color: TEXT, letterSpacing: '-0.03em', margin: 0 }}>
            بیلیارد هاب در یک نگاه
          </h3>
        </div>

        <ExploreCards className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 12 }} />
      </div>
    </section>
  )
}
