import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطای سرور' }, { status: 500 })
  }
}