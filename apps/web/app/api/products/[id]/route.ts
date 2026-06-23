// apps/web/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/products/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'محصول پیدا نشد' }, { status: 404 })
    }

    // افزایش تعداد بازدید
    await supabase
      .from('products')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', params.id)

    return NextResponse.json({ product: data })
  } catch (err: any) {
    console.error('GET /api/products/[id] error:', err)
    return NextResponse.json({ error: err.message || 'خطای سرور' }, { status: 500 })
  }
}
