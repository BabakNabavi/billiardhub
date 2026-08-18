'use client'

/* ─────────────────────────────────────────────────────────────
   ویرایشِ درجا روی صفحه‌ی عمومیِ پروفایل.

   ── چرا ──
   تا امروز افزودنِ عکس یا ویدیو یعنی: رفتن به داشبوردِ آن نقش،
   آپلود، ذخیره، برگشتن به صفحه‌ی عمومی برای دیدنِ نتیجه. برای یک
   عکس هم همین چرخه. حالا صاحبِ پروفایل همان‌جا که نگاه می‌کند
   اضافه و حذف می‌کند.

   ── چه کسی می‌بیند ──
   فقط صاحبِ پروفایل. `ownerId` ستونِ خودِ ردیف است و از سرور می‌آید،
   پس با دستکاریِ مرورگر جعل نمی‌شود؛ و مسیرِ ذخیره هم روی سرور
   دوباره مالکیت را می‌سنجد (`saveProfile` «یکی به‌ازای هر مالک» است).
   این تشخیص فقط برای *نشان‌دادن* دکمه است، نه برای اجازه‌دادن.

   ── چرا کلِ پروفایل ذخیره می‌شود ──
   `POST /api/profiles/[kind]` کلِ `data` را جایگزین می‌کند. پس
   نسخه‌ی تازه‌ی همان چیزی که صفحه دارد فرستاده می‌شود، با یک فیلد
   عوض‌شده. هیچ مسیرِ «patch جزئی» برای پروفایل وجود ندارد و ساختنش
   برای این کار، سطحِ حمله‌ی تازه‌ای باز می‌کرد.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useState } from 'react'
import { saveProfileRemote, type ProfileKind } from './client'
import { useAuthStore } from '../../store/auth.store'

export interface OwnerEdit<T> {
  /** دکمه‌های ویرایش فقط وقتی دیده می‌شوند که این درست باشد */
  isOwner: boolean
  /** در حالِ ذخیره — دکمه‌ها باید غیرفعال شوند */
  saving: boolean
  /** پیامِ خطا؛ خالی یعنی مشکلی نبود */
  error: string
  /** یک تغییر روی پروفایل و ذخیره‌ی آن روی سرور */
  apply: (mutate: (draft: T) => T) => Promise<boolean>
}

/* قیدِ `Record<string, unknown>` برداشته شد: تایپ‌های پروفایل
   اینترفیس‌اند و ایندکس‌سیگنچر ندارند. تبدیل در همان یک نقطه‌ی
   ارسال انجام می‌شود. */
export function useOwnerEdit<T>(
  kind: ProfileKind,
  slug: string,
  profile: T | null,
  ownerId: string | null,
  onSaved: (next: T) => void,
  /* پرچمِ سرور. `undefined` یعنی هنوز نیامده و به مقایسه‌ی مرورگر
     تکیه می‌شود؛ `true`/`false` قطعی است. */
  serverSaysMine?: boolean,
): OwnerEdit<T> {
  const { user } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  /* ── دو نشانه، با «یا» نه «??» ──
     ⚠️ نسخه‌ی قبلی `serverSaysMine ?? clientCheck` بود و این خودش یک
     باگ ساخت: توکنِ دسترسی ۱۵ دقیقه عمر دارد و این مسیرِ GET عمومی
     است، پس با توکنِ منقضی ۴۰۱ نمی‌دهد — فقط بی‌صدا «مهمان» حساب
     می‌شود و `isMine:false` برمی‌گرداند. آن `false` با `??` قطعی
     می‌شد و مقایسه‌ی محلی را هم خفه می‌کرد.

     حالا هر کدام کافی است. اجازه‌ی واقعی همچنان روی سرور سنجیده
     می‌شود، پس نشان‌دادنِ خوش‌بینانه‌ی دکمه چیزی را باز نمی‌کند. */
  const isOwner = serverSaysMine === true || (!!user?.id && !!ownerId && user.id === ownerId)

  const apply = useCallback(async (mutate: (draft: T) => T) => {
    if (!profile || !isOwner || saving) return false
    setSaving(true); setError('')
    const next = mutate(profile)
    try {
      const res = await saveProfileRemote(kind, slug, next as unknown as Record<string, unknown>)
      if (!res.ok) { setError(res.message ?? 'ذخیره روی سرور انجام نشد'); return false }

      /* ── ردیفِ برگشتی باید همین پروفایل باشد ──
         نشانه‌ی مرورگر خوش‌بینانه است: اگر کوکیِ نشست و کاربرِ ذخیره‌شده
         یکی نباشند، دکمه دیده می‌شود ولی سرور ردیفِ *مالکِ کوکی* را
         برمی‌دارد (`saveProfile` یکی‌به‌ازای‌هر‌مالک است). آن‌وقت نوشتنِ
         پاسخ روی این صفحه یعنی نمایشِ پروفایلِ یک حسابِ دیگر. */
      if (res.profile && ownerId && res.profile.ownerId !== ownerId) {
        setError('نشست شما با این حساب یکی نیست؛ یک‌بار خارج و دوباره وارد شوید')
        return false
      }

      /* پاسخِ سرور نشانیِ Storage را جای data:URL گذاشته — همان را
         می‌نشانیم، وگرنه صفحه تا بازخوانیِ بعدی base64 نگه می‌دارد. */
      onSaved((res.profile?.data as T) ?? next)
      return true
    } catch {
      setError('ارتباط با سرور برقرار نشد')
      return false
    } finally {
      setSaving(false)
    }
  }, [profile, isOwner, saving, kind, slug, onSaved, ownerId])

  return { isOwner, saving, error, apply }
}
