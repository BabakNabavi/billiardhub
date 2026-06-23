// apps/web/app/api/bookings/my/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'billiard-plus-super-secret-key-2026'

// GET /api/bookings/my — رزروهای کاربر لاگین‌شده
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    let user: { id: string; role: string }
    try {
      user = jwt.verify(token, JWT_SECRET) as { id: string; role: string }
    } catch {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 })
    }

    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        clubs (
          id,
          name,
          address,
          phone
        )
      `)
      .eq('userId', user.id)
      .order('date', { ascending: false })

    if (error) throw error

    return NextResponse.json({ bookings: data || [] })
  } catch (err: any) {
    console.error('GET /api/bookings/my error:', err)
    return NextResponse.json({ error: err.message || 'خطای سرور' }, { status: 500 })
  }
}
