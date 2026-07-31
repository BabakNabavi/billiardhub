export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest } from '@/lib/finance/db';
import { eligibleFor, PLACEMENT_ROLES } from '@/lib/ads/booking';

/* جایگاه‌هایی که کاربر واردشده مجاز به خریدشان است.
   کاربر هرگز جایگاه نامرتبط را نمی‌بیند — مبنا نقش‌های تأییدشده‌ی
   فاز ۳ است، نه نقش خوداظهاری که خود کاربر می‌تواند عوضش کند. */
export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  try {
    const e = await eligibleFor(actor.id);
    return NextResponse.json({
      roles: e.roles,
      identityRequired: e.identityRequired,
      placements: e.placements.map(p => ({
        key: p.key, title: p.title, description: p.description,
        contentKind: p.contentKind, entityType: p.entityType,
        requiredRoles: PLACEMENT_ROLES[p.key] ?? [],
        plans: p.plans.map(pl => ({
          id: pl.id, name: pl.name, description: pl.description,
          price: pl.price, durationDays: pl.durationDays, badge: pl.badge,
        })),
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ roles: [], identityRequired: false, placements: [] });
  }
}
