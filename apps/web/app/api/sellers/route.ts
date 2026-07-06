export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const { data, error } = await getSupabaseServer()
    .from('users')
    .select('id, firstName, lastName, avatar, sellerProfile')
    .eq('primaryRole', 'seller')
    .eq('isActive', true);

  if (error) return NextResponse.json([], { headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}
