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
import Link from 'next/link'
import { Building2, ShoppingBag, Star, Trophy, type LucideIcon } from 'lucide-react'
import { ExploreCards } from './ExploreCards'
import { CountUp } from './CountUp'
import { loadHomeStats, MIN_STATS, type HomeStat } from '@/lib/home-stats'

/* آمار زیرِ هشت کارت، با همان پوسته (xp-card از ExploreCards) — رنگِ هر عدد همان
   رنگِ بخشِ مقصدش در کارت‌های بالا */
const STAT_LOOK: Record<string, { Icon: LucideIcon; rgb: string }> = {
  players: { Icon: Star, rgb: '185,123,255' },
  ads: { Icon: ShoppingBag, rgb: '199,166,106' },
  clubs: { Icon: Building2, rgb: '48,197,90' },
  tournaments: { Icon: Trophy, rgb: '74,158,255' },
}

const TEXT = '#1A1917'

const STATS_CSS = `
  .hm-stats { list-style: none; margin: clamp(12px,1.4vw,18px) auto 0; padding: 0;
    display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; }
  .hm-stats > li { flex: 0 1 260px; min-width: 0; }
  .hm-stat { height: 100%; }
  .hm-stat-n { font-size: clamp(24px,2.4vw,32px); font-weight: 900; line-height: 1.1; color: rgb(var(--rgb)); }
  @media (max-width: 600px) { .hm-stats > li { flex: 1 1 0; } }
`

/* آمارِ واقعی فقط وقتی دست‌کم دو شاخص قوی‌اند (lib/home-stats) */
export default async function ExploreStrip() {
  const stats = await loadHomeStats().catch((e: unknown) => { console.error('[explore] stats', e); return [] as HomeStat[] })
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

      <style>{STATS_CSS}</style>
      <div style={{ maxWidth: 1340, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(20px,2.4vw,32px)' }}>
          {/* خواستِ مالک (آبانِ ۱۴۰۵): برچسبِ «بیشتر ببینید» و «… کاوش کن» رفتند */}
          <h3 style={{ fontSize: 'clamp(17px,1.9vw,24px)', fontWeight: 800, color: TEXT, letterSpacing: '-0.03em', margin: 0 }}>
            بیلیارد هاب در یک نگاه
          </h3>
        </div>

        <ExploreCards className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 12 }} />

        {stats.length >= MIN_STATS && (
          <ul className="hm-stats">
            {stats.map(st => {
              const look = STAT_LOOK[st.key] ?? { Icon: Star, rgb: '199,166,106' }
              return (
                <li key={st.key}>
                  <Link prefetch={false} href={st.href} className="xp-card hm-stat" style={{ ['--rgb' as never]: look.rgb }}>
                    <span aria-hidden className="xp-sheen" />
                    <span className="xp-ic"><look.Icon size={20} aria-hidden /></span>
                    <span className="hm-stat-n"><CountUp value={st.value} /></span>
                    <span className="xp-t">{st.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
