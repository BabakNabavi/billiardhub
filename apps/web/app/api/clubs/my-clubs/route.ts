export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';

const CORS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const payload = sessionFromRequest(req);
  if (!payload) {
    return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401, headers: CORS });
  }

  const { data, error } = await getSupabaseServer()
    .from('clubs')
    .select('*')
    .eq('ownerId', payload.id)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[clubs/my-clubs] db error:', error.message);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500, headers: CORS });
  }
  return NextResponse.json(data ?? [], { headers: CORS });
}
