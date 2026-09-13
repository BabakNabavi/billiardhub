'use client'

/* ─────────────────────────────────────────────────────────────
   رسانه‌ی تازه‌ی سرور، پیش از ذخیره‌ی پنل.

   ── چرا لازم شد ──
   `POST /api/profiles/[kind]` کلِ `data` را جایگزین می‌کند و هیچ
   مسیرِ «patch جزئی» وجود ندارد. پنل‌های داشبورد فرمشان را در
   لحظه‌ی mount پر می‌کنند، پس اگر کاربر پنل را باز بگذارد و
   هم‌زمان در صفحه‌ی عمومیِ خودش عکس اضافه کند، «ثبت اطلاعات»
   نسخه‌ی کهنه را می‌نویسد و آن عکس‌ها بی‌صدا پاک می‌شوند — و
   فایل‌هایشان در Storage یتیم می‌مانند.

   ⚠️ این خطر همیشه بود، ولی تا وقتی کارتِ گالری در پنل بود دست‌کم
   کاربر فهرستِ کهنه را می‌دید. حالا که گالری فقط در صفحه‌ی عمومی
   است، هیچ نشانه‌ای نمی‌ماند.

   ── قرارداد ──
   `null` یعنی «نتوانستم بخوانم». فراخواننده **نباید** در آن حالت
   ذخیره کند: نوشتنِ کورکورانه دقیقا همان چیزی است که این ماژول
   برای نبودنش هست.
   ───────────────────────────────────────────────────────────── */

import { fetchMyProfileResult, type ProfileKind } from './client'
import { withMediaArrays } from './albums'

export interface FreshMedia {
  gallery: unknown[]
  videos: unknown[]
  albums: string[]
}

/* ⚠️ سه حالت، نه دو تا. `none` یعنی «هنوز ردیفی روی سرور نیست» —
   پروفایلِ پیش‌نویسی که فقط در localStorage است. اگر آن را با
   آرایه‌های خالی یکی بگیریم، اولین ذخیره رسانه‌ی همان پیش‌نویس را
   پاک می‌کند؛ فراخواننده باید در این حالت خودِ فرم را بفرستد. */
export type FreshMediaResult =
  | { state: 'ok'; media: FreshMedia }
  | { state: 'none' }
  | { state: 'error' }

/** رسانه‌ی ذخیره‌شده‌ی همین کاربر روی سرور. */
export async function fetchFreshMedia(kind: ProfileKind): Promise<FreshMediaResult> {
  const res = await fetchMyProfileResult<Record<string, unknown>>(kind).catch(() => null)
  if (!res || res.state === 'error') return { state: 'error' }
  if (res.state === 'none') return { state: 'none' }
  const d = withMediaArrays(res.profile.data)
  return {
    state: 'ok',
    media: {
      gallery: d.gallery as unknown[],
      videos: d.videos as unknown[],
      albums: d.albums as string[],
    },
  }
}

/** پیامِ یکسانِ هر دو پنل وقتی خواندن نشد. */
export const FRESH_MEDIA_FAIL = {
  title: 'ذخیره نشد',
  lines: [
    'رسانه‌ی فعلیِ پروفایل از سرور خوانده نشد.',
    'برای اینکه عکس‌ها و ویدیوهای موجود پاک نشوند، ذخیره انجام نشد — اتصال را بررسی کنید و دوباره تلاش کنید.',
  ],
}
