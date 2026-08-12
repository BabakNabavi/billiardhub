/* تعریفِ مشخصاتِ یک دسته — استاتیک، مثل مسیرِ کاتالوگ.
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
    { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  )
}
