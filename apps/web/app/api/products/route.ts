// apps/web/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'billiard-plus-super-secret-key-2026'

function getUserFromRequest(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.slice(7)
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string }
  } catch {
    return null
  }
}

// GET /api/products
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { searchParams } = new URL(req.url)

    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'active')

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'popular':
        query = query.order('views', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('createdAt', { ascending: false })
        break
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      products: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (err: any) {
    console.error('GET /api/products error:', err)
    return NextResponse.json({ error: err.message || 'خطای سرور' }, { status: 500 })
  }
}

// POST /api/products — ثبت محصول جدید (نیاز به لاگین)
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 })
    }

    const supabase = getSupabaseServer()
    const body = await req.json()

    const {
      title,
      description,
      price,
      discountPrice,
      discountPercent,
      category,
      condition,
      city,
      stock,
      images,
      video,
      isOfficialStore,
    } = body

    if (!title || !price || !category) {
      return NextResponse.json(
        { error: 'عنوان، قیمت و دسته‌بندی الزامی است' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        title,
        description,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        discountPercent: discountPercent ? Number(discountPercent) : 0,
        category,
        condition: condition || 'new',
        status: 'active',
        city: city || '',
        stock: stock ? Number(stock) : 1,
        images: images || [],
        video: video || null,
        isDailyDeal: false,
        isSpecialSale: false,
        isVerified: false,
        requestedVerification: false,
        isOfficialStore: isOfficialStore || false,
        sellerId: user.id,
        views: 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/products error:', err)
    return NextResponse.json({ error: err.message || 'خطای سرور' }, { status: 500 })
  }
}
