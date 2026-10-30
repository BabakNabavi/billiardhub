export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sb, clientIp } from '@/lib/finance/db';
import { requireOwner } from '@/lib/enforcement/owner-auth';
import { applyAction } from '@/lib/enforcement/server';
import { ACCOUNT_STATUSES, ACTION_KEYS, FEATURE_KEYS, REASON_KEYS, type ActionKey, type ReasonCode } from '@/lib/enforcement/policy';

/* ─────────────────────────────────────────────────────────────
   پنلِ اعمالِ وضعیتِ حساب — فقط مالکِ پلتفرم.
     GET  ?q=   جست‌وجوی کاربر (شماره، نام یا شناسه)
     POST       اجرای یک اقدام (منطق و اثرهای جانبی: lib/enforcement/server)
   ───────────────────────────────────────────────────────────── */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIST_COLUMNS = 'id,phone,"firstName","lastName","primaryRole",account_status,status_expires_at,is_platform_owner,"createdAt"';

export async function GET(req: NextRequest) {
  const g = await requireOwner(req);
  if ('res' in g) return g.res;

  /* فقط حروف، رقم، فاصله و خط تیره — هیچ نویسه‌ای که در فیلترِ or() معنا داشته باشد */
  const q = (req.nextUrl.searchParams.get('q') ?? '')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[^\p{L}\p{N}\s-]/gu, '').trim().slice(0, 60);
  const status = z.enum(['all', ...ACCOUNT_STATUSES]).catch('all').parse(req.nextUrl.searchParams.get('status') ?? 'all');

  let query = sb().from('users').select(LIST_COLUMNS).order('createdAt', { ascending: false }).limit(30);
  if (UUID.test(q)) query = query.eq('id', q);
  else if (/^\d{4,11}$/.test(q)) query = query.ilike('phone', `%${q}%`);
  else if (q) query = query.or(`firstName.ilike.%${q}%,lastName.ilike.%${q}%`);
  if (status !== 'all') query = query.eq('account_status', status);

  const { data, error } = await query;
  if (error) {
    const pending = /account_status|column/i.test(error.message);
    return NextResponse.json(
      { message: pending ? 'مهاجرتِ ۱۱۳ هنوز روی دیتابیس اجرا نشده است' : 'جست‌وجو انجام نشد' },
      { status: pending ? 503 : 500 },
    );
  }
  return NextResponse.json({ users: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

const ActionZ = z.object({
  userId: z.string().regex(UUID),
  action: z.enum(ACTION_KEYS as [ActionKey, ...ActionKey[]]),
  reason: z.enum(REASON_KEYS as [ReasonCode, ...ReasonCode[]]),
  note: z.string().max(2000).optional().nullable(),
  evidence: z.string().max(1000).optional().nullable(),
  /* ISO با منطقه‌ی زمانی — کلاینت از تاریخِ محلی می‌سازد */
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  restrictions: z.array(z.enum(FEATURE_KEYS as [string, ...string[]])).max(FEATURE_KEYS.length).optional(),
  content: z.object({ type: z.enum(['listing', 'video']), id: z.string().regex(UUID) }).optional().nullable(),
  alsoListings: z.boolean().optional(),
  alsoBusiness: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const g = await requireOwner(req);
  if ('res' in g) return g.res;

  const parsed = ActionZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'درخواست نامعتبر است', issues: parsed.error.issues.map(i => i.path.join('.')) }, { status: 400 });
  }
  const b = parsed.data;
  const r = await applyAction(g.actor.id, {
    targetId: b.userId, action: b.action, reason: b.reason,
    note: b.note ?? null, evidence: b.evidence ?? null, expiresAt: b.expiresAt ?? null,
    restrictions: b.restrictions ?? [], content: b.content ?? null,
    alsoListings: b.alsoListings, alsoBusiness: b.alsoBusiness,
  }, clientIp(req));
  if (!r.ok) return NextResponse.json({ message: r.message }, { status: r.status });
  return NextResponse.json({ ok: true, id: r.id, status: r.status, details: r.details });
}
