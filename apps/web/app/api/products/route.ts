// apps/web/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { sessionFromRequest } from '@/lib/auth/session';
import { consumeAdQuota, releaseConsumption, attachConsumptionRef } from '@/lib/ads/quota';

export const dynamic = 'force-dynamic'

/* کوکیِ نشست یا هدرِ Authorization — از منبعِ واحد */
function getUserFromRequest(req: NextRequest) {
  const s = sessionFromRequest(req)
  return s ? { id: s.id, role: s.role } : null
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

    /* `?mine=true` ⇒ محصولاتِ خودِ کاربر، با هر وضعیتی.

       داشبوردِ فروشنده باید آگهیِ غیرفعال، منقضی و در انتظارِ تأیید را
       هم ببیند — چیزی که فهرستِ عمومی عمداً نشان نمی‌دهد. مالکیت از
       نشست خوانده می‌شود، نه از پارامتر، پس کسی نمی‌تواند فهرستِ
       محصولاتِ دیگری را بخواهد. */
    const mine = searchParams.get('mine') === 'true'
    let ownerId: string | null = null
    if (mine) {
      const user = getUserFromRequest(req)
      if (!user) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 })
      ownerId = user.id
    }

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })

    if (ownerId) query = query.eq('sellerId', ownerId)
    else query = query.eq('status', 'active')

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
  } catch (err) {
    console.error('GET /api/products error:', err)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
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

    /* سهمیه (فاز ۳) — این مسیر هم مثل /api/market/ads ردیفِ products
       می‌سازد؛ بدونِ این دروازه، سقفِ شخص‌محور کاملاً دور زده می‌شد. */
    const gate = await consumeAdQuota(user.id)
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.body.message, ...gate.body },
        { status: gate.status }
      )
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        title,
        /* ستونِ description در دیتابیس NOT NULL است؛ نبودنش ۵۰۰ می‌داد */
        description: description ?? '',
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

    if (error) {
      /* درج نشد ⇒ مصرفِ همین درخواست آزاد می‌شود (خطای فنی، نه حذفِ آگهی) */
      if (gate.consumptionId) await releaseConsumption(gate.consumptionId)
      throw error
    }

    if (gate.consumptionId && data?.id) await attachConsumptionRef(gate.consumptionId, String(data.id))

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (err) {
    console.error('POST /api/products error:', err)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
