/* ─────────────────────────────────────────────────────────────
   ساخت payload زنده‌ی جایگاه‌ها — یک پیاده‌سازی، دو مصرف‌کننده.

   تا امروز این منطق فقط داخل مسیر /api/ads/placements بود، پس تنها
   راه رسیدن به آن یک درخواست HTTP از مرورگر بود. نتیجه‌اش این بود که
   سه سکشن اصلی صفحه‌ی اول در HTML اولیه خالی می‌ماندند.

   حالا همین‌جا نشسته تا صفحه‌ی سرور هم بتواند مستقیم صدایش بزند و
   محتوا در همان رندر اول بیاید — بدون آنکه دو نسخه‌ی جداگانه از
   منطق داشته باشیم که با هم واگرا شوند.
   ───────────────────────────────────────────────────────────── */

import { livePlacements, expireCampaigns, type EntityType } from './core'
import { resolveEntities, type EntitySnapshot } from './resolve'
import { freeContent } from './free'

export interface LiveCampaignOut {
  id: string
  title: string
  advertiser: string
  weight: number
  banner?: { imageUrl: string; linkUrl: string }
  entity?: EntitySnapshot
}

export interface LivePlacementOut {
  contentKind: 'banner' | 'entity'
  rotationMode?: string
  displayCount?: number
  mode?: string
  campaigns: LiveCampaignOut[]
}

/** جایگاه‌های زنده، آماده‌ی مصرف در سرور یا پاسخ API */
export async function buildLivePlacements(key?: string): Promise<Record<string, LivePlacementOut>> {
  /* انقضای lazy: کمپین تمام‌شده حتی اگر cron عقب باشد نمایش داده
     نمی‌شود. await عمدی است — روی سرورلس، کار رهاشده ممکن است هرگز
     اجرا نشود. */
  await expireCampaigns()

  const live = await livePlacements(key)
  const out: Record<string, LivePlacementOut> = {}

  for (const [k, v] of Object.entries(live)) {
    const item: LivePlacementOut = {
      contentKind: v.placement.contentKind,
      rotationMode: v.placement.rotationMode,
      displayCount: v.placement.displayCount,
      mode: v.placement.mode,
      campaigns: [],
    }

    /* حالت رایگان: محتوا از داده‌ی واقعی سایت، نه کمپین. فقط برای
       جایگاه موجودیتی معنا دارد؛ بنر فروخته‌شده نباید بی‌صدا خالی شود. */
    if (v.placement.mode === 'free' && v.placement.contentKind === 'entity') {
      const snaps = await freeContent(
        (v.placement.entityType ?? 'product') as EntityType,
        v.placement.displayCount,
      )
      item.campaigns = snaps.map(e => ({
        id: `free:${e.ref}`, title: e.title, advertiser: '', weight: 1, entity: e,
      }))
      out[k] = item
      continue
    }

    if (v.placement.contentKind === 'banner') {
      for (const c of v.campaigns) {
        item.campaigns.push({
          id: c.id, title: c.title, advertiser: c.advertiser, weight: c.weight,
          banner: {
            imageUrl: String((c.content as Record<string, unknown>).image_url ?? ''),
            linkUrl: String((c.content as Record<string, unknown>).link_url ?? ''),
          },
        })
      }
    } else {
      const entityType = (v.placement.entityType ?? 'product') as EntityType
      const refs = v.campaigns
        .map(c => String((c.content as Record<string, unknown>).ref ?? ''))
        .filter(Boolean)
      const snaps = await resolveEntities(entityType, refs)
      const byRef = new Map(snaps.map(s => [s.ref, s]))
      for (const c of v.campaigns) {
        const snap = byRef.get(String((c.content as Record<string, unknown>).ref ?? ''))
        if (!snap) continue   // موجودیت حذف‌شده — کمپین یتیم نمایش داده نمی‌شود
        item.campaigns.push({
          id: c.id, title: c.title, advertiser: c.advertiser, weight: c.weight, entity: snap,
        })
      }
    }

    out[k] = item
  }

  return out
}
