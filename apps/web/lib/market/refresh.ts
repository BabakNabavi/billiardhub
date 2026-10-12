/* ─────────────────────────────────────────────────────────────
   خریدِ جایگاهِ پولی = آگهیِ تازه‌ثبت‌شده.

   تصمیمِ مالک (۲۰ مهر ۱۴۰۵): کسی که برای آگهی‌اش جایگاهِ ویژه می‌خرد،
   مثلِ این است که همین حالا آگهی را ثبت کرده. فقط هنگامِ *تأییدِ ادمین*
   اجرا می‌شود — نه لحظه‌ی پرداخت: پیش از بازبینی، کمپینِ ردشده/بازپرداخت‌شده
   یک ارتقای مجانی (و حتی تازه‌کردنِ آگهیِ کسِ دیگر) می‌داد. و فقط برای کمپینِ
   *خریداری‌شده* (سفارشِ PAID)؛ انتخابِ دستیِ ادمین برای جایگاهِ رایگان نه. پس:
     · عمرِ آگهی از همین لحظه کامل (`AD_LIFETIME_DAYS`) — و هرگز پیش از
       پایانِ خودِ کمپین تمام نمی‌شود
     · `bumped_at` = اکنون ⟵ در فهرستِ بازار هم بالا می‌آید (`listed_at`)
     · آگهیِ منقضی‌شده دوباره فعال می‌شود

   پیش‌تر مسیرِ خرید انقضا را نه می‌سنجید نه تمدید می‌کرد، و کمپینِ پولی
   می‌توانست وسطِ دوره روی آگهیِ منقضی بماند.

   دست نمی‌زند به: آگهیِ ردشده/در انتظار/فروخته/حذف‌شده، و آگهی‌ای که
   ادمین نگهش داشته (`moderation_hold`) — خرید نباید تصمیمِ بازبینی را دور
   بزند. شکستش خریدی را خراب نمی‌کند؛ فقط لاگ می‌شود.
   ───────────────────────────────────────────────────────────── */

import { sb } from '@/lib/finance/db'
import { AD_LIFETIME_MS } from './live'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function refreshAdForCampaign(campaignId: string): Promise<void> {
  try {
    const { data: c, error } = await sb().from('campaigns')
      .select('placement_key,content,ends_at').eq('id', campaignId).maybeSingle()
    if (error) { console.error('[market/refresh] campaign read:', error.message); return }
    const camp = c as { placement_key?: string; content?: Record<string, unknown> | null; ends_at?: string | null } | null
    const ref = String(camp?.content?.ref ?? '')
    if (!camp?.placement_key || !UUID.test(ref)) return

    /* فقط کمپینِ خریداری‌شده */
    const { data: paid, error: paidErr } = await sb().from('campaign_orders')
      .select('id').eq('campaign_id', campaignId).eq('status', 'PAID').limit(1)
    if (paidErr) { console.error('[market/refresh] order read:', paidErr.message); return }
    if (!paid?.length) return

    /* فقط جایگاهِ «محصول» — باشگاه و فروشگاه آگهی نیستند */
    const { data: pl, error: plErr } = await sb().from('placements')
      .select('entity_type').eq('key', camp.placement_key).maybeSingle()
    if (plErr) { console.error('[market/refresh] placement read:', plErr.message); return }
    if ((pl as { entity_type?: string } | null)?.entity_type !== 'product') return

    const { data: ad, error: adErr } = await sb().from('products')
      .select('status,"expiresAt",moderation_hold').eq('id', ref).maybeSingle()
    if (adErr) { console.error('[market/refresh] ad read:', adErr.message); return }
    const row = ad as { status?: string; expiresAt?: string | null; moderation_hold?: boolean | null } | null
    if (!row || row.moderation_hold === true || !['active', 'expired'].includes(String(row.status))) return

    const now = Date.now()
    const until = Math.max(
      now + AD_LIFETIME_MS,
      Date.parse(String(camp.ends_at ?? '')) || 0,
      Date.parse(String(row.expiresAt ?? '')) || 0,   // تمدیدِ بلندترِ موجود کوتاه نمی‌شود
    )
    const nowIso = new Date(now).toISOString()
    const { error: upErr } = await sb().from('products')
      .update({ status: 'active', expiresAt: new Date(until).toISOString(), renewedAt: nowIso, bumped_at: nowIso })
      .eq('id', ref).in('status', ['active', 'expired'])
      /* همان شرط‌های خواندن، در خودِ UPDATE — اگر ادمین همین وسط نگهش داشت */
      .or('moderation_hold.is.null,moderation_hold.eq.false')
    if (upErr) console.error('[market/refresh] update:', upErr.message)
  } catch (e) {
    console.error('[market/refresh]', (e as Error).message)
  }
}
