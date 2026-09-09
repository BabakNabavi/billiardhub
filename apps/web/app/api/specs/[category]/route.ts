/* تعریف مشخصات یک دسته — استاتیک، مثل مسیر کاتالوگ.
   فرم فیلدهای همان دسته‌ای را می‌گیرد که کاربر انتخاب کرده. */

import { NextResponse } from 'next/server'
import { SPEC_CATEGORIES, getSpecFields, CONDITION_OPTIONS } from '../../../../lib/market/spec-catalog'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return SPEC_CATEGORIES.map(category => ({ category }))
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ category: string }> },
) {
  const { category } = await params
  const fields = getSpecFields(category)
  if (!fields.length) {
    return NextResponse.json({ error: 'دسته‌ی نامعتبر' }, { status: 404 })
  }
  return NextResponse.json(
    { category, fields, conditions: CONDITION_OPTIONS },
 /* ── چرا کش یک‌ساله نه ──
          دلیل گذاشتن `min`/`max` در JSON این بود که اصلاحشان دیپلوی
          نخواهد. با کش immutable، سرور بازه‌ی تازه را اعمال می‌کند و
          مرورگر کاربر تا یک سال بازه‌ی قدیمی را می‌سنجد — نتیجه‌اش یک
          ۴۰۰ی بی‌توضیح. یک ساعت کش با بازاعتبارسنجی پس‌زمینه، هم
          هزینه‌ی شبکه را صفر نگه می‌دارد هم این تله را می‌بندد. */
       { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } },
  )
}
