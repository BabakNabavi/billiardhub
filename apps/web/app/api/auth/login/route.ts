export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getSupabaseServer } from '@/lib/supabase-server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { message: 'شماره موبایل و رمز عبور الزامی است' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const { data: user, error } = await getSupabaseServer()
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { message: 'کاربر با این شماره موبایل یافت نشد' },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'رمز عبور اشتباه است' },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const token = jwt.sign(
      { sub: user.id, phone: user.phone, role: user.primaryRole },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    const { password: _pwd, ...userWithoutPassword } = user;

    return NextResponse.json(
      { token, user: userWithoutPassword },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
