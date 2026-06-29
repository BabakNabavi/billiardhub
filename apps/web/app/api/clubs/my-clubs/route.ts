export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSupabaseServer } from '@/lib/supabase-server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401, headers: CORS });
  }

  let payload: { sub: string };
  try {
    payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as typeof payload;
  } catch {
    return NextResponse.json({ message: 'توکن نامعتبر است' }, { status: 401, headers: CORS });
  }

  const { data, error } = await getSupabaseServer()
    .from('clubs')
    .select('*')
    .eq('ownerId', payload.sub)
    .order('createdAt', { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}
