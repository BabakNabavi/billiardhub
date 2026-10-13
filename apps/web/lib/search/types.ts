/* تایپ‌های جست‌وجوی سراسری — جدا از `server.ts` (که `server-only` است) تا
   کامپوننت‌ها و `profile-hit` بی‌وابستگیِ چرخشی از آن‌ها استفاده کنند. */

export interface SearchHit {
  href: string
  title: string
  sub?: string
  image?: string | null
  verified?: boolean
}

export type GroupKey = 'clubs' | 'people' | 'tournaments' | 'market' | 'news' | 'videos'

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
