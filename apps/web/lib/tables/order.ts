/* ترتیب نمایش میزها — منبعِ واحد.

   میزها تا امروز به ترتیبِ ثبت نشان داده می‌شدند، یعنی هر باشگاه یک
   چیدمانِ تصادفی داشت. ترتیبِ درست، ترتیبِ آشنای خودِ ورزش است:
   اسنوکر، بعد پاکت بیلیارد، بعد هی‌بال؛ و بقیه پس از آن‌ها.

   نسخه‌های VIP بعد از هر سه رشته‌ی اصلی می‌آیند، نه چسبیده به رشته‌ی
   خودشان: وگرنه یک میز VIP اسنوکر بین اسنوکر و پاکت می‌نشست و ترتیبِ
   خواسته‌شده به هم می‌خورد. همین ترتیب از قبل در صفحه‌ی رزرو هم بود،
   پس داشبورد و رزرو حالا یکی‌اند. */

export const TABLE_TYPE_ORDER: Record<string, number> = {
  snooker: 0,
  pocket: 1,
  highball: 2,
  vip_snooker: 3,
  vip_pocket: 4,
  air_hockey: 5,
  playstation: 6,
}

/* نوعِ ناشناخته به ته فهرست می‌رود، نه اول: اگر روزی نوع تازه‌ای اضافه
   شد، بی‌سروصدا جلوی اسنوکر نمی‌نشیند. */
const RANK_UNKNOWN = 99

export const tableTypeRank = (type: string | undefined | null): number =>
  TABLE_TYPE_ORDER[String(type ?? '')] ?? RANK_UNKNOWN

/** مرتب‌سازی: اول بر اساس رشته، بعد شماره‌ی میز. آرایه‌ی تازه برمی‌گرداند. */
export function sortTables<T extends { type?: string | null; number?: number | null }>(tables: readonly T[]): T[] {
  return [...tables].sort((a, b) => {
    const d = tableTypeRank(a.type) - tableTypeRank(b.type)
    if (d !== 0) return d
    /* میزِ بی‌شماره بعد از شماره‌دارها — نه اولِ فهرست با شماره‌ی صفر */
    const an = Number(a.number), bn = Number(b.number)
    const av = Number.isFinite(an) && an > 0 ? an : Number.MAX_SAFE_INTEGER
    const bv = Number.isFinite(bn) && bn > 0 ? bn : Number.MAX_SAFE_INTEGER
    return av - bv
  })
}
