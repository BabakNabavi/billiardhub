/* تایپ‌های جست‌وجوی سراسری — جدا از `server.ts` (که `server-only` است) تا
   کامپوننت‌ها و `profile-hit` بی‌وابستگیِ چرخشی از آن‌ها استفاده کنند. */

export interface SearchHit {
  href: string
  title: string
  sub?: string
  image?: string | null
  verified?: boolean
  /** رتبه‌ی رنکینگ — جای تصویر، عدد در مربعِ رنگیِ همان رتبه */
  rank?: number
}

export type GroupKey = 'clubs' | 'people' | 'rankings' | 'tournaments' | 'market' | 'news' | 'videos'

export interface SearchGroup {
  key: GroupKey
  hits: SearchHit[]
  /** همه‌ی تطبیق‌ها، نه فقط آن‌هایی که نشان داده می‌شوند */
  total: number
  /** سقفِ واکشی پر شد — شاید بیش از `total` باشد («۶۰+») */
  capped?: boolean
  /** این بخش جواب نداد */
  failed?: boolean
}

/** پیشنهادِ زنده‌ی کادرِ نوار — فقط از منابعِ کش‌شده، بی‌پرس‌وجو در هر کلید */
export interface SuggestHit extends SearchHit {
  key: GroupKey
}
