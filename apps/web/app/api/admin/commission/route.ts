export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';

/* مدیریتِ نرخِ کمیسیون — فقط ادمین.

   نرخ در جدولِ `commission_rules` است و هیچ‌جای کد hard-code نشده.
   دو زمینه دارد (رزرو و مسابقه) و برای هر باشگاه هم می‌شود نرخِ
   اختصاصی گذاشت؛ نرخِ باشگاه بر نرخِ سراسری اولویت دارد.

   ── چرا ویرایشِ درجا انجام نمی‌شود ──
   تغییرِ نرخ یک رویدادِ مالی است، نه یک تنظیمِ ساده. اگر ردیف را
   به‌روز کنیم، دیگر نمی‌شود ثابت کرد سه ماه پیش نرخ چند بوده. پس
   ردیفِ قبلی `is_active=false` می‌شود و ردیفِ تازه درج — تاریخچه
   می‌ماند و هر تغییر در audit_logs هم ثبت می‌شود.

   تراکنش‌های گذشته به‌هیچ‌وجه تغییر نمی‌کنند: مبلغِ کمیسیون لحظه‌ی
   رزرو روی خودِ رزرو snapshot می‌شود (`platform_commission` و
   `commission_value`)، پس نرخِ امروز روی دیروز اثر ندارد. */

const CONTEXTS = new Set(['RESERVATION', 'TOURNAMENT']);
const TYPES = new Set(['PERCENTAGE', 'FIXED_AMOUNT']);

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'finance'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const [rules, clubs] = await Promise.all([
    sb().from('commission_rules').select('*').order('created_at', { ascending: false }),
    sb().from('clubs').select('id,name'),
  ]);

  const clubName = new Map(((clubs.data ?? []) as Record<string, unknown>[])
    .map(c => [String(c.id), String(c.name)]));
  /* بدونِ نوعِ صریح، TypeScript خروجیِ map را فقط `{clubName}` می‌بیند */
  const all: Record<string, unknown>[] = ((rules.data ?? []) as Record<string, unknown>[])
    .map(r => ({ ...r, clubName: r.club_id ? clubName.get(String(r.club_id)) ?? '—' : null }));

  return NextResponse.json({
    active: all.filter(r => r.is_active),
    history: all.filter(r => !r.is_active),
    clubs: clubs.data ?? [],
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/* تنظیمِ نرخ. بدنه: { context, scope, clubId?, type, value } */
export async function PUT(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'finance'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const context = String(b.context ?? '');
  const scope = String(b.scope ?? 'GLOBAL');
  const type = String(b.type ?? 'PERCENTAGE');
  const clubId = b.clubId ? String(b.clubId) : null;
  const value = Number(b.value);

  if (!CONTEXTS.has(context)) return NextResponse.json({ message: 'زمینه نامعتبر است' }, { status: 400 });
  if (!TYPES.has(type)) return NextResponse.json({ message: 'نوع نامعتبر است' }, { status: 400 });
  if (scope !== 'GLOBAL' && scope !== 'CLUB') {
    return NextResponse.json({ message: 'دامنه نامعتبر است' }, { status: 400 });
  }
  if (scope === 'CLUB' && !clubId) {
    return NextResponse.json({ message: 'برای نرخِ اختصاصی، باشگاه را انتخاب کنید' }, { status: 400 });
  }
  if (!Number.isFinite(value) || value < 0) {
    return NextResponse.json({ message: 'مقدار باید عددی مثبت باشد' }, { status: 400 });
  }
  /* درصدِ بالای صد یعنی کمیسیون از کلِ مبلغ بیشتر است — سهمِ باشگاه
     منفی می‌شد و ناوردای `final = commission + club` می‌شکست. */
  if (type === 'PERCENTAGE' && value > 100) {
    return NextResponse.json({ message: 'درصد نمی‌تواند بیش از ۱۰۰ باشد' }, { status: 400 });
  }
  if (type === 'FIXED_AMOUNT' && value > 500_000_000) {
    return NextResponse.json({ message: 'مبلغ ثابت بیش از حد بزرگ است' }, { status: 400 });
  }

  /* نرخِ فعلی برای ثبت در ممیزی و برای غیرفعال‌کردن */
  let cur = sb().from('commission_rules').select('*')
    .eq('is_active', true).eq('context', context).eq('scope', scope);
  cur = clubId ? cur.eq('club_id', clubId) : cur.is('club_id', null);
  const { data: existing } = await cur.maybeSingle();

  const old = existing as Record<string, unknown> | null;
  if (old && Number(old.value) === value && String(old.type) === type) {
    return NextResponse.json({ ok: true, unchanged: true, rule: old });
  }

  /* تاریخچه می‌ماند: قدیمی بایگانی، تازه درج */
  if (old) {
    await sb().from('commission_rules')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', String(old.id));
  }

  const { data: created, error } = await sb().from('commission_rules')
    .insert({ scope, context, club_id: clubId, type, value, is_active: true })
    .select().single();

  if (error) {
    /* اگر درج نشد، قانونِ قبلی برگردانده می‌شود تا سیستم بی‌نرخ نماند */
    if (old) {
      await sb().from('commission_rules').update({ is_active: true }).eq('id', String(old.id));
    }
    console.error('[admin/commission]', error.message);
    return NextResponse.json({ message: 'ثبت نرخ انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: 'admin', action: 'COMMISSION_RATE_CHANGED',
    entityType: 'commission_rule', entityId: String((created as { id: string }).id),
    oldValue: old ? { type: old.type, value: old.value } : null,
    newValue: { context, scope, clubId, type, value },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, rule: created });
}

/* حذفِ نرخِ اختصاصیِ یک باشگاه ⇒ برگشت به نرخِ سراسری.
   نرخِ سراسری حذف نمی‌شود؛ بدونِ آن کمیسیون صفر می‌شد. */
export async function DELETE(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'finance'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get('id') ?? '';
  if (!id) return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 });

  const { data: rule } = await sb().from('commission_rules').select('*').eq('id', id).maybeSingle();
  if (!rule) return NextResponse.json({ message: 'قانون پیدا نشد' }, { status: 404 });
  if (String((rule as { scope: string }).scope) === 'GLOBAL') {
    return NextResponse.json({
      message: 'نرخ سراسری حذف نمی‌شود — فقط می‌توانید مقدارش را عوض کنید',
    }, { status: 409 });
  }

  await sb().from('commission_rules')
    .update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);

  void audit({
    actorId: actor.id, actorRole: 'admin', action: 'COMMISSION_RULE_REMOVED',
    entityType: 'commission_rule', entityId: id, oldValue: rule,
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
