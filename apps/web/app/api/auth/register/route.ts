import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabaseServer } from '@/lib/supabase-server';

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
    const { firstName, lastName, phone, password } = body;

    if (!firstName || !lastName || !phone || !password) {
      return NextResponse.json(
        { message: 'همه فیلدها الزامی هستند' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const { data: existing } = await supabaseServer
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: 'این شماره موبایل قبلاً ثبت شده است' },
        { status: 409, headers: CORS_HEADERS },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabaseServer
      .from('users')
      .insert({
        firstName,
        lastName,
        phone,
        password: hashedPassword,
        primaryRole: 'user',
        secondaryRoles: [],
        verificationStatus: 'unverified',
        isProfileComplete: false,
        isActive: true,
        language: 'fa',
        documents: [],
      })
      .select()
      .single();

    if (error || !user) {
      return NextResponse.json(
        { message: 'خطا در ثبت‌نام: ' + (error?.message ?? 'unknown') },
        { status: 500, headers: CORS_HEADERS },
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
      { status: 201, headers: CORS_HEADERS },
    );
  } catch {
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
