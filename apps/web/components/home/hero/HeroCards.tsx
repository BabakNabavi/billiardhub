import Link from 'next/link'
import { Eye, Play, Trophy } from 'lucide-react'
import { faNum } from '@/lib/jalali'
import { thumbUrl } from '@/lib/media/thumb'
import type { HeroData } from '@/lib/home-hero'
import type { RealClub, RealProduct, RealStore } from '@/lib/home-types'
import { PRODUCT_IMG } from '@/lib/home-featured'
import { HeroTilt } from './HeroTilt'
import { HeroAdsCard } from './HeroAdsCard'
import { HeroSpotCard } from './HeroSpotCard'
import { HeroRankingCard } from './HeroRankingCard'
import { CARD, LABEL } from './hero-classes'
import type { HeroAdItem, HeroSpotItem } from './hero-types'

/* ─────────────────────────────────────────────────────────────
   سه کارتِ شیشه‌ای کنارِ تیتر — داده‌ی واقعیِ همین لحظه.
   چرخان‌ها (کلاینت): HeroSpotCard (باشگاه، فروشگاه) · HeroAdsCard · HeroRankingCard
   کارتی که داده ندارد اصلاً ساخته نمی‌شود؛ جایش عددِ ساختگی نمی‌نشیند.
   ───────────────────────────────────────────────────────────── */

function LiveCard({ live, pos }: { live: NonNullable<HeroData['live']>; pos: string }) {
  return (
    <Link prefetch={false} href={`/live/c/${live.id}`} className={`${CARD} ${pos}`}>
      <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-card hh-live-thumb">
        <span aria-hidden className="absolute inset-0 bg-black/45" />
        <span aria-hidden className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 transition-transform duration-base group-hover:scale-105">
          <Play size={18} fill="currentColor" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-chip bg-danger px-2 text-meta font-extrabold">
          <span aria-hidden className="h-2 w-2 rounded-full bg-white motion-safe:animate-pulse" />
          زنده
        </span>
        <span className="truncate text-sub font-bold">{live.title}</span>
      </div>
      <p className={`${LABEL} mt-1 flex items-center gap-2`}>
        <span className="truncate">{live.clubName}</span>
        {live.viewers > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1"><Eye size={12} aria-hidden />{faNum(live.viewers)} بیننده</span>
        )}
      </p>
    </Link>
  )
}

/* داده‌ی سبکِ کارت‌های چرخان — این‌جا روی سرور، تا فقط همین به مرورگر برود */
const CLUBS = 5
const ADS = 10
const STORES = 6

function clubItems(clubs: RealClub[]): HeroSpotItem[] {
  return clubs.slice(0, CLUBS).map(c => ({
    id: c.id, name: c.name, img: thumbUrl(c.img, 600),
    meta: [c.city, c.tables > 0 ? `${faNum(c.tables)} میز` : ''].filter(Boolean).join('، '),
    pin: !!c.city,
  }))
}

/* فروشگاه‌ها به ترتیبِ تصادفی (خواستِ مالک) — در هر بازسازیِ ISR (هر
   دقیقه) ترتیبِ تازه؛ هیدریشن مشکلی ندارد چون کلاینت همان فهرستِ سرور را می‌گیرد */
function storeItems(stores: RealStore[]): HeroSpotItem[] {
  const s = [...stores]
  for (let k = s.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [s[k], s[j]] = [s[j]!, s[k]!]
  }
  return s.slice(0, STORES).map(x => ({
    /* بی‌لوگو ⟵ عکسِ پهن (بنر/استوری) به‌شکلِ کاور، با عرضِ کافی برای همان کادر */
    id: x.id, name: x.name, img: x.img ? thumbUrl(x.img, x.isLogo === false ? 600 : 128) : '',
    cover: x.isLogo === false,
    /* شهر اول تا نشانِ مکان فقط کنارِ شهر بنشیند، نه کنارِ تخصص */
    meta: [x.city, x.specialty].filter(Boolean).join('، '),
    pin: !!x.city,
  }))
}

function adItems(products: RealProduct[]): HeroAdItem[] {
  return products.slice(0, ADS).map(p => {
    const v = p.sale > 0 ? p.sale : p.price
    const price = p.negotiable ? 'توافقی' : v > 0 ? `${faNum(v)} تومان` : ''
    return {
      id: p.id, name: p.name,
      /* عکسِ جانشینِ «چوب» برای آگهیِ بی‌عکس ⟵ null: کارت آیکونِ خنثی می‌گذارد */
      img: p.img === PRODUCT_IMG ? null : thumbUrl(p.img, 96),
      meta: [price, p.city].filter(Boolean).join('، '),
    }
  })
}

const PHASE_LABEL: Record<NonNullable<HeroData['tournament']>['phase'], string> = {
  open: 'مسابقه‌ی پیش رو', upcoming: 'مسابقه‌ی پیش رو', ongoing: 'مسابقه‌ی در جریان',
}

function TournamentCard({ t, pos }: { t: NonNullable<HeroData['tournament']>; pos: string }) {
  const ahead = t.phase === 'open' || t.phase === 'upcoming'
  const pct = t.taken !== null && t.max > 0 ? Math.min(100, Math.round((t.taken / t.max) * 100)) : null
  return (
    <Link prefetch={false} href={`/tournaments/${t.id}`} className={`${CARD} ${pos}`}>
      <p className={`${LABEL} flex items-center gap-1`}>
        <Trophy size={12} aria-hidden className="text-gold-light" />
        {PHASE_LABEL[t.phase]}
        {t.phase === 'open' && <span className="ms-auto rounded-chip border border-gold/40 bg-gold/15 px-2 font-bold text-gold-light">ثبت‌نام باز</span>}
      </p>
      <p className="mt-1 truncate text-sub font-bold">{t.title}</p>
      <p className={LABEL}>
        {ahead
          ? `${t.daysLeft === 0 ? 'امروز' : `${faNum(t.daysLeft)} روز مانده`}${t.taken !== null ? `، ${faNum(t.taken)} از ${faNum(t.max)} جا پر` : ''}`
          : `در حال برگزاری${t.taken !== null ? `، ${faNum(t.taken)} بازیکن` : ''}`}
      </p>
      {ahead && pct !== null && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
        </div>
      )}
    </Link>
  )
}

export function HeroCards({ data, newestClubs, newestProducts, stores: allStores }: {
  data: HeroData; newestClubs: RealClub[]; newestProducts: RealProduct[]; stores: RealStore[]
}) {
  const clubs = clubItems(newestClubs)
  const ads = adItems(newestProducts)
  const stores = storeItems(allStores)
  const cards: ((pos: string) => React.ReactNode)[] = []
  if (data.live) { const l = data.live; cards.push(pos => <LiveCard key="live" live={l} pos={pos} />) }
  else if (clubs.length) cards.push(pos => (
    <HeroSpotCard key="club" items={clubs} pos={pos} hrefBase="/clubs" fit="cover" everyMs={5000}
      label={['تازه‌ترین باشگاه', 'تازه‌ترین باشگاه‌ها']} />
  ))
  /* مسابقه‌ی پیشِ رو/در جریان اولویت دارد؛ نبود ⟵ آگهی‌های تازه‌ی بازار */
  if (data.tournament) { const t = data.tournament; cards.push(pos => <TournamentCard key="t" t={t} pos={pos} />) }
  else if (ads.length) cards.push(pos => <HeroAdsCard key="ads" ads={ads} pos={pos} />)
  if (data.ranking.length) { const r = data.ranking; cards.push(pos => <HeroRankingCard key="r" boards={r} pos={pos} />) }
  /* فروشگاه‌ها فقط در گوشی (خواستِ مالک): ردیفِ سوایپی جای کارتِ چهارم دارد؛
     دسته‌ی سه‌کارتیِ دسکتاپ و ردیفِ سه‌تاییِ تبلت نه */
  if (stores.length) cards.push(pos => (
    <HeroSpotCard key="stores" items={stores} pos={pos} hrefBase="/sellers" fit="logo" everyMs={6000}
      label={['فروشگاه تجهیزات', 'فروشگاه‌های تجهیزات']} className="min-[601px]:hidden" />
  ))
  if (cards.length === 0) return null
  /* فقط فروشگاه مانده (در تبلت/دسکتاپ پنهان) ⟵ صحنه هم در آن اندازه‌ها پنهان،
     وگرنه .hh-stack{height:400px} بلوکِ خالی زیرِ تیتر می‌گذاشت */
  const onlyMobile = cards.length === 1 && stores.length > 0

  return (
    <div className={`hh-stage relative min-w-0${onlyMobile ? ' min-[601px]:hidden' : ''}`}>
      <HeroTilt className="hh-stack relative">
        {cards.map((c, i) => c(`hh-p${i + 1}`))}
      </HeroTilt>
    </div>
  )
}
