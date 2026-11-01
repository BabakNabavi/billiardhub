/* شکلِ سبکِ داده‌ای که کارت‌های چرخانِ هیرو (کلاینت) می‌گیرند — روی سرور
   آماده می‌شود تا فقط همین چند فیلد به مرورگر برود */

export interface HeroClubItem {
  id: string
  name: string
  /** «تهران، ۶ میز» — آماده روی سرور */
  meta: string
  /** نشانیِ کوچک‌شده (thumbUrl) */
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
