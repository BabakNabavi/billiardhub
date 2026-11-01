export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';
import { requireOwner } from '@/lib/enforcement/owner-auth';
import { enforcementHistory } from '@/lib/enforcement/server';

/* پرونده‌ی یک کاربر برای مالک: وضعیت، دارایی‌های عمومی (آگهی، باشگاه،
   پروفایل، ویدیو) و تاریخچه‌ی کاملِ اقدام‌ها با نامِ اقدام‌کننده. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const g = await requireOwner(req);
  if ('res' in g) return g.res;
  const { userId } = await ctx.params;
  if (!UUID.test(userId)) return NextResponse.json({ message: 'شناسه نامعتبر است' }, { status: 400 });

  const { data: user, error } = await sb().from('users').select(
    'id,phone,"firstName","lastName","primaryRole","secondaryRoles","createdAt",national_id_verified,' +
    'account_status,status_expires_at,feature_restrictions,status_changed_at,is_platform_owner',
  ).eq('id', userId).maybeSingle();
  if (error) return NextResponse.json({ message: 'خواندن کاربر انجام نشد' }, { status: 500 });
  if (!user) return NextResponse.json({ message: 'کاربر پیدا نشد' }, { status: 404 });

  const [products, clubs, profiles, videos, history] = await Promise.all([
    sb().from('products').select('id,title,status').eq('sellerId', userId).order('createdAt', { ascending: false }).limit(50),
    sb().from('clubs').select('id,name,"isActive"').eq('ownerId', userId).limit(20),
    sb().from('profiles').select('id,kind,slug,status').eq('owner_id', userId).limit(20),
    sb().from('videos').select('id,title,status').eq('owner_id', userId).order('created_at', { ascending: false }).limit(30),
    enforcementHistory(userId),
  ]);

  /* نامِ اقدام‌کننده‌ها برای نمایشِ تاریخچه */
  const actorIds = [...new Set((history as { actor_id: string }[]).map(h => h.actor_id))];
  const { data: actors } = actorIds.length
    ? await sb().from('users').select('id,"firstName","lastName",phone').in('id', actorIds)
    : { data: [] };

  return NextResponse.json({
    user,
    assets: {
      products: products.data ?? [], clubs: clubs.data ?? [],
      profiles: profiles.data ?? [], videos: videos.data ?? [],
    },
    history,
    actors: actors ?? [],
  }, { headers: { 'Cache-Control': 'no-store' } });
}
