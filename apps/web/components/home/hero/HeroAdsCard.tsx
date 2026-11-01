import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { faNum } from '@/lib/jalali'
import { thumbUrl } from '@/lib/media/thumb'
import type { RealProduct } from '@/lib/home-types'
import { PRODUCT_IMG } from '@/lib/home-featured'
import { CARD, LABEL, ROW_LINK } from './hero-classes'

/* ─────────────────────────────────────────────────────────────
   تازه‌ترین آگهی‌های بازار — جای «آخرین مسابقه» (خواستِ مالک).
   بازار هر روز آگهیِ تازه دارد، پس این کارت هیچ‌وقت کهنه یا خالی نیست.

   خودِ کارت لینک نیست (لینکِ تودرتو مجاز نیست)؛ هر ردیف لینکِ آگهیِ
   خودش است و سرِ کارت به /shop می‌رود.
   ───────────────────────────────────────────────────────────── */

function priceOf(p: RealProduct): string {
  if (p.negotiable) return 'توافقی'
  const v = p.sale > 0 ? p.sale : p.price
  return v > 0 ? `${faNum(v)} تومان` : ''
}

export function HeroAdsCard({ products, pos }: { products: RealProduct[]; pos: string }) {
  return (
    <div className={`${CARD} ${pos}`}>
      <Link prefetch={false} href="/shop" className={`${LABEL} ${ROW_LINK} -mx-1 flex items-center gap-1 px-1`}>
        <ShoppingBag size={12} aria-hidden className="hh-c-violet" />
        تازه‌ترین آگهی‌های بازار
        <span className="ms-auto font-bold text-gold-light">همه</span>
      </Link>
      <ul className="mt-1">
        {products.map(p => (
          <li key={p.id}>
            <Link prefetch={false} href={`/shop/${p.id}`} className={`${ROW_LINK} -mx-1 flex items-center gap-2 px-1 py-1`}>
              {/* آگهیِ بی‌عکس عکسِ جانشینِ «چوب» می‌گیرد — این‌جا آیکونِ خنثی، تا
                  جاسوییچ با عکسِ چوب کنارِ هم ننشینند */}
              {p.img === PRODUCT_IMG
                ? <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-white/10 text-white/50"><ShoppingBag size={18} /></span>
                /* eslint-disable-next-line @next/next/no-img-element -- بهینه‌ساز تصویرِ Next خاموش است؛ thumbUrl اندازه را از Storage می‌گیرد */
                : <img src={thumbUrl(p.img, 96)} alt="" width={48} height={48} loading="lazy" decoding="async"
                    className="h-12 w-12 shrink-0 rounded-card bg-white/10 object-cover" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sub font-bold">{p.name}</span>
                <span className={`${LABEL} block truncate`}>
                  {[priceOf(p), p.city].filter(Boolean).join('، ')}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
