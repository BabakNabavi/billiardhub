export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await getSupabaseServer()
    .from('clubs')
    .select('clubStories')
    .eq('id', params.id)
    .single();
  if (error) return NextResponse.json([], { headers: CORS });
  const now = new Date();
  const stories = (data?.clubStories ?? []).filter((s: any) => new Date(s.expiresAt) > now);
  return NextResponse.json(stories, { headers: CORS });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const story = await req.json();
  const { data: club } = await getSupabaseServer()
    .from('clubs').select('clubStories').eq('id', params.id).single();
  const current = Array.isArray(club?.clubStories) ? club.clubStories : [];
  if (current.length >= 10)
    return NextResponse.json({ message: 'حداکثر ۱۰ استوری مجاز است' }, { status: 400, headers: CORS });
  const updated = [...current, story];
  const { error } = await getSupabaseServer()
    .from('clubs').update({ clubStories: updated }).eq('id', params.id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(story, { status: 201, headers: CORS });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const storyId = req.nextUrl.searchParams.get('storyId');
  const { data: club } = await getSupabaseServer()
    .from('clubs').select('clubStories').eq('id', params.id).single();
  const current = Array.isArray(club?.clubStories) ? club.clubStories : [];
  const updated = current.filter((s: any) => s.id !== storyId);
  await getSupabaseServer().from('clubs').update({ clubStories: updated }).eq('id', params.id);
  return NextResponse.json({ ok: true }, { headers: CORS });
}
