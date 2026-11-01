/* شکلِ سبکِ داده‌ای که کارت‌های چرخانِ هیرو (کلاینت) می‌گیرند — روی سرور
   آماده می‌شود تا فقط همین چند فیلد به مرورگر برود */

export interface HeroSpotItem {
  id: string
  name: string
  /** «تهران، ۶ میز» یا «تهران، چوب و لوازم» — آماده روی سرور */
  meta: string
  /** meta با شهر شروع می‌شود ⟵ نشانِ مکان کنارش؛ وگرنه متنِ ساده */
  pin: boolean
  /** نشانیِ کوچک‌شده (thumbUrl)؛ خالی ⟵ آیکونِ خنثی */
  img: string
}

export interface HeroAdItem {
  id: string
  name: string
  /** «توافقی، تهران» یا «۱٬۴۵۰٬۰۰۰ تومان، تهران» */
  meta: string
  /** null ⟵ آگهیِ بی‌عکس: آیکونِ خنثی */
  img: string | null
}

export interface HeroRankingBoard {
  /** کلیدهای پیوندِ مستقیم: /ranking?sport=&gender=&cat= */
  sport: string
  gender: string
  category: string
  label: string
  players: { rank: number; name: string; points: number }[]
}
