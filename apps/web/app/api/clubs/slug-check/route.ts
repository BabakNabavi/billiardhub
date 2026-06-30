export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { isValidSlug } from '@/lib/slug';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')?.toLowerCase().trim();
  const excludeId = req.nextUrl.searchParams.get('excludeId');

  if (!slug) return NextResponse.json({ available: false, error: 'slug الزامی است' }, { status: 400, headers: CORS });
  if (!isValidSlug(slug)) return NextResponse.json({ available: false, error: 'slug نامعتبر است — فقط a-z، 0-9 و خط تیره مجاز است' }, { status: 400, headers: CORS });

  let query = getSupabaseServer().from('clubs').select('id').eq('slug', slug);
  if (excludeId) query = query.neq('id', excludeId);

  const { data } = await query.single();
  return NextResponse.json({ available: !data }, { headers: CORS });
}
