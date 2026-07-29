import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/* شناسه‌ی محصول در دیتابیس uuid است. اگر چیزِ دیگری بیاید، PostgREST
   خطای 22P02 می‌دهد و قبلاً همان متنِ خام («invalid input syntax for
   type uuid…») با کدِ ۵۰۰ به کاربر برمی‌گشت — هم نشتِ اطلاعاتِ داخلی
   بود، هم از نظرِ معنایی غلط: شناسه‌ی بی‌شکل یعنی «پیدا نشد»، نه
   «خطای سرور». حالا پیش از رفتن به دیتابیس بررسی می‌شود. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!UUID.test(String(id ?? ''))) {
      return NextResponse.json({ error: 'محصول پیدا نشد' }, { status: 404 })
    }

    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)

    /* پیامِ خطای دیتابیس هرگز به کاربر نمی‌رسد؛ فقط در لاگِ سرور می‌ماند */
    if (error) {
      console.error('[products/:id] db error:', error.message)
      return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'محصول پیدا نشد' }, { status: 404 })
    }

    const product = data[0]

    await supabase
      .from('products')
      .update({ views: (product.views || 0) + 1 })
      .eq('id', id)

    return NextResponse.json({ product })
  } catch (err) {
    console.error('[products/:id] unexpected:', err)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
