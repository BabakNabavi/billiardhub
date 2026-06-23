export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSupabaseServer } from '@/lib/supabase-server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const VALID_ROLES = [
  'user', 'player', 'coach', 'referee',
  'technician', 'seller', 'manufacturer', 'club_owner',
];

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'احراز هویت الزامی است' },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    let userId: string;
    try {
      const decoded = jwt.verify(
        authHeader.slice(7),
        process.env.JWT_SECRET!,
      ) as { sub: string };
      userId = decoded.sub;
    } catch {
      return NextResponse.json(
        { message: 'توکن نامعتبر است' },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const body = await req.json();
    const { primaryRole } = body;

    if (!primaryRole || !VALID_ROLES.includes(primaryRole)) {
      return NextResponse.json(
        { message: 'نقش انتخابی معتبر نیست' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const { data: user, error } = await getSupabaseServer()
      .from('users')
      .update({
        primaryRole,
        isProfileComplete: primaryRole !== 'user',
      })
      .eq('id', userId)
      .select()
      .single();

    if (error || !user) {
      return NextResponse.json(
        { message: 'خطا در به‌روزرسانی: ' + (error?.message ?? 'unknown') },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    const { password: _pwd, ...userWithoutPassword } = user;
    return NextResponse.json(
      { user: userWithoutPassword },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
