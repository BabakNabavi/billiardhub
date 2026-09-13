/* ─────────────────────────────────────────────────────────────
   رنگِ دسته‌های خدمت — منبعِ واحد.

   ⚠️ این‌جاست نه در `lib/tech-categories`: آن فایل منبعِ واحدِ
   *داده*ی دسته‌هاست و رنگ یک تصمیمِ نمایشی است.

   ⚠️ چرا مشترک شد: دو جا همین رنگ‌ها را لازم دارند — کارت‌های دسته
   در `/services` و کاشیِ ردیف‌های خدمت در صفحه‌ی متخصص. وقتی هر
   کدام نسخه‌ی خودش را داشت، دو شبکه با هم نمی‌خواندند و حتی
   وارونه شدند (طلایی در یکی «رگلاژ میز» بود و در دیگری «تعمیرات
   چوب»). یک منبع یعنی چنین چیزی دیگر ممکن نیست.
   ───────────────────────────────────────────────────────────── */

import { TECH_CATEGORIES, type TechCategoryIcon } from '@/lib/tech-categories'

export interface Tint {
  /** رنگِ اشباع — برای خطِ آیکون روی زمینِ روشن */
  color: string
  /** همان رنگ به شکل «r,g,b» تا در `rgba(var(--rgb), …)` بنشیند */
  rgb: string
}

export const TINTS: Record<TechCategoryIcon, Tint> = {
  wrench:       { color: '#4A9EFF', rgb: '74,158,255'  },
  'circle-dot': { color: '#F472B6', rgb: '244,114,182' },
  link:         { color: '#B97BFF', rgb: '185,123,255' },
  scale:        { color: '#30C55A', rgb: '48,197,90'   },
  ruler:        { color: '#C7A66A', rgb: '199,166,106' },
  layers:       { color: '#06b6d4', rgb: '6,182,212'   },
  truck:        { color: '#fb923c', rgb: '251,146,60'  },
  grip:         { color: '#ef4444', rgb: '239,68,68'   },
}

/* شناسه‌ی خدمت ⟵ رنگِ دسته‌ای که زیرش می‌آید.
   ⚠️ نگاشت یک‌بار ساخته می‌شود، نه در هر رندر: فهرست ثابت است. */
const BY_SERVICE: ReadonlyMap<string, Tint> = new Map(
  TECH_CATEGORIES.flatMap(c => c.serviceIds.map(id => [id, TINTS[c.icon]] as const)),
)

/** رنگِ خدمت. خدماتی که در هیچ دسته‌ای نیستند خنثی می‌مانند. */
export const tintForService = (serviceId: string): Tint | undefined =>
  BY_SERVICE.get(serviceId)
