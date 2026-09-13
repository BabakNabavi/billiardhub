/* ─────────────────────────────────────────────────────────────
   ویرایشِ کپشن و آلبومِ یک تصویرِ گالری — ماژولِ خالص.

   چهار صفحه (مربی، داور، بازیکن، متخصص) و دو صفحه‌ی دیگر
   (فروشگاه، تولیدکننده) همین کار را می‌کنند. یک نسخه می‌ماند.

   ⚠️ نامِ آلبومِ تازه باید به `albums` هم اضافه شود، وگرنه آلبوم
   فقط تا وقتی زنده است که دست‌کم یک عکس به آن اشاره کند و با
   بیرون‌آمدنِ آخرین عکس ناپدید می‌شود — برخلافِ آلبومی که از
   دکمه‌ی «آلبوم تازه» ساخته می‌شود.
   ───────────────────────────────────────────────────────────── */

import { ALBUM_NAME_MAX } from './albums'

export interface EditableImage { id: string; caption?: string; album?: string }

export interface ImagePatch { caption: string; album: string }

/** شکلِ کمینه‌ای که این تابع از پروفایل می‌خواهد. */
export interface MediaDraft {
  gallery?: EditableImage[]
  albums?: string[]
}

/**
 * کپشن و آلبومِ یک تصویر را روی پیش‌نویسِ پروفایل می‌نشاند.
 *
 * ⚠️ `album`ِ خالی یعنی «بدون آلبوم»، پس فیلد **حذف** می‌شود نه
 * اینکه رشته‌ی خالی بگیرد: تبِ آلبوم روی مقدارِ خالی یک آلبومِ
 * بی‌نام می‌ساخت.
 */
export function applyImagePatch<T extends MediaDraft>(draft: T, id: string, patch: ImagePatch): T {
  const album = patch.album.trim().slice(0, ALBUM_NAME_MAX)
  const gallery = (draft.gallery ?? []).map(g => {
    if (g.id !== id) return g
    /* ⚠️ `caption` باید صریح نوشته شود: `...rest` مقدارِ قدیمی را
       نگه می‌دارد و بدونِ این خط، ویرایشِ کپشن هیچ اثری نداشت.
       (تستِ واحد همین را گرفت.) */
    const { album: _drop, ...rest } = g
    const next = { ...rest, caption: patch.caption }
    return album ? { ...next, album } : next
  })
  /* نامِ تازه به فهرستِ آلبوم‌ها هم می‌رود — بدونِ تکرار. */
  const albums = draft.albums ?? []
  const known = albums.some(x => x.trim() === album)
  return {
    ...draft,
    gallery,
    albums: album && !known ? [...albums, album] : albums,
  } as T
}
