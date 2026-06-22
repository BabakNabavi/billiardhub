export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
