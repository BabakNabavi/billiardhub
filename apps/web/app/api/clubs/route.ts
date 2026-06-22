export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSupabaseServer } from '@/lib/supabase-server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const { data: clubs, error } = await getSupabaseServer()
      .from('clubs')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: false });

    if (error) {
      return NextResponse.json(
        { message: 'خطا در دریافت باشگاه‌ها: ' + error.message },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(clubs ?? [], { status: 200, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'احراز هویت الزامی است' },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const token = authHeader.slice(7);
    let payload: { sub: string; phone: string; role: string };
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as typeof payload;
    } catch {
      return NextResponse.json(
        { message: 'توکن نامعتبر است' },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const body = await req.json();
    const { name, address, city } = body;

    if (!name || !address || !city) {
      return NextResponse.json(
        { message: 'نام، آدرس و شهر الزامی هستند' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const { data: club, error } = await getSupabaseServer()
      .from('clubs')
      .insert({
        ...body,
        ownerId: payload.sub,
        isActive: true,
      })
      .select()
      .single();

    if (error || !club) {
      return NextResponse.json(
        { message: 'خطا در ثبت باشگاه: ' + (error?.message ?? 'unknown') },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(club, { status: 201, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
