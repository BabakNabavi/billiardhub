'use client'

/* ─────────────────────────────────────────────────────────────
   هشدارهای فیلدِ رمز — کیبوردِ فارسی و Caps Lock.

   ── چرا لازم است ──
   رمز با نقطه نمایش داده می‌شود، پس کاربر **نمی‌بیند** چه تایپ کرده.
   اگر چیدمانِ کیبورد روی فارسی مانده باشد، به‌جای `mypass` رشته‌ی
   `ئغحشسس` می‌رود و پیام برگشتی فقط «اطلاعات ورود صحیح نیست» است —
   بی‌هیچ سرنخی. چند بار تکرارِ همین، حساب را هم موقتاً قفل می‌کند.

   ── چطور تشخیص داده می‌شود ──
   چیدمانِ کیبورد از جاوااسکریپت خواندنی نیست. ولی خودِ *مقدارِ* فیلد
   خواندنی است: اگر حتی یک نویسه‌ی فارسی/عربی داخلش باشد، یعنی
   چیدمان فارسی بوده. این تشخیص قطعی است، نه حدس — چون رمزِ این سایت
   فقط لاتین و رقم و نشانه می‌پذیرد.

   `event.getModifierState('CapsLock')` هم مستقیم از مرورگر می‌آید.
   ───────────────────────────────────────────────────────────── */

/** بازه‌های عربی/فارسی — همان‌هایی که کیبوردِ فارسی تولید می‌کند */
const PERSIAN = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/

export interface PasswordHint {
  /** چیدمانِ کیبورد فارسی است */
  persian: boolean
  /** Caps Lock روشن است */
  caps: boolean
  /** پیامِ آماده برای نمایش — `null` یعنی چیزی برای گفتن نیست */
  message: string | null
}

export function passwordHint(value: string, caps = false): PasswordHint {
  const persian = PERSIAN.test(value)
  return {
    persian, caps,
    message: persian
      ? 'کیبورد روی فارسی است — رمز باید با حروف انگلیسی نوشته شود.'
      : caps
        ? 'کلید Caps Lock روشن است — حروف بزرگ و کوچک در رمز فرق دارند.'
        : null,
  }
}

/** آیا این رویداد Caps Lock را روشن گزارش می‌کند؟
 *
 *  ورودی عمداً `unknown` است: هم `KeyboardEvent`ِ بومی و هم
 *  `React.KeyboardEvent` پذیرفته می‌شوند، و امضای `getModifierState`
 *  در تعریفِ ری‌اکت `ModifierKey` می‌خواهد نه `string` — پس تایپِ
 *  ساختاری این دو را ناسازگار می‌بیند. */
export function capsFrom(e: unknown): boolean {
  try {
    const fn = (e as { getModifierState?: (k: string) => boolean } | null)?.getModifierState
    return typeof fn === 'function' ? fn.call(e, 'CapsLock') : false
  } catch { return false }
}
