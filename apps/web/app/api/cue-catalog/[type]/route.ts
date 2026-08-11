/* برندها و مدل‌های **یک نوع** چوب.

   ── چرا مسیرِ جدا و نه import در کامپوننت ──
   `data/cue-catalog.json` نود و هشت کیلوبایت است. اگر کامپوننتِ
   کلاینت واردش کند، همان حجم به باندلِ هر بازدیدکننده‌ی فرم اضافه
   می‌شود — در حالی که کلِ جاوااسکریپتِ صفحه‌ی اصلی امروز ۲۱۵
   کیلوبایت است. هر بار فقط برندهای همان نوعی که کاربر انتخاب کرده
   لازم است، نه هر چهار نوع.

   ── چرا استاتیک ──
   داده ثابت است و با دیپلوی عوض می‌شود. `force-static` یعنی در
   زمانِ بیلد ساخته می‌شود و هیچ رندری روی سرور نمی‌خورد. کش هم
   یک‌ساله و immutable است؛ عوض‌شدنِ داده با دیپلویِ تازه می‌آید و
   چون فایلِ HTML و چانک‌ها هش می‌شوند، کهنه نمی‌ماند. */

import { NextResponse } from 'next/server'
import {
  CUE_TYPE_IDS, getCueType, CUE_COUNTRIES, type CueTypeId,
} from '@/lib/market/cue-catalog'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return CUE_TYPE_IDS.map(type => ({ type }))
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ type: string }> },
) {
  const { type } = await ctx.params
  const found = getCueType(type)
  if (!found) {
    return NextResponse.json({ message: 'نوع چوب پیدا نشد' }, { status: 404 })
  }

  /* کشورها همراهِ همین پاسخ می‌آیند تا کلاینت درخواستِ دوم نزند —
     سیزده ردیف است و در برابرِ یک رفت‌وبرگشتِ شبکه‌ی دیگر ناچیز. */
  return NextResponse.json(
    {
      type: found.id as CueTypeId,
      label_fa: found.label_fa,
      brands: found.brands,
      countries: CUE_COUNTRIES,
    },
    { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  )
}
