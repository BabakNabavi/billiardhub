export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest, isAdmin, audit } from '@/lib/finance/db';
import {
  listStoryPlans, createStoryPlan, updateStoryPlan, deactivateStoryPlan, type StoryPlanInput,
} from '@/lib/stories/plans';
import type { Period } from '@/lib/ads/quota';

/* ساخت و ویرایشِ بسته‌های استوری — فقط ادمین.
   بسته هرگز حذفِ فیزیکی نمی‌شود؛ سفارش‌های قبلی به آن ارجاع دارند. */

const PERIODS: Period[] = ['day', 'week', 'month'];

const num = (v: unknown, d = 0) => {
  const n = Number(String(v ?? '').replace(/[۰-۹]/g, x => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : d;
};
const str = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);

async function guard(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return { err: NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) };
  if (!(await isAdmin(actor.id))) return { err: NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 }) };
  return { actor };
}

export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;
  try {
    return NextResponse.json({ plans: await listStoryPlans(false) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ plans: [] });
  }
}

function parse(b: Record<string, unknown>, partial: boolean): Partial<StoryPlanInput> | { error: string } {
  const out: Partial<StoryPlanInput> = {};

  if (b.name !== undefined || !partial) {
    const name = str(b.name, 80);
    if (!name) return { error: 'نامِ بسته لازم است' };
    out.name = name;
  }
  if (b.description !== undefined) out.description = str(b.description, 400);
  if (b.quota !== undefined || !partial) out.quota = Math.max(0, Math.round(num(b.quota)));
  if (b.period !== undefined || !partial) {
    const p = str(b.period, 10) as Period;
    if (!PERIODS.includes(p)) return { error: 'بازه باید روز، هفته یا ماه باشد' };
    out.period = p;
  }
  if (b.durationDays !== undefined || !partial) {
    const d = Math.round(num(b.durationDays, 30));
    if (d < 1) return { error: 'مدتِ اعتبار باید حداقل یک روز باشد' };
    out.durationDays = d;
  }
  if (b.price !== undefined || !partial) {
    const p = Math.round(num(b.price));
    if (p < 0) return { error: 'قیمت نمی‌تواند منفی باشد' };
    out.price = p;
  }
  if (b.isActive !== undefined) out.isActive = !!b.isActive;
  if (b.sortOrder !== undefined) out.sortOrder = Math.round(num(b.sortOrder));
  if (b.badge !== undefined) out.badge = str(b.badge, 40);

  return out;
}

export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const p = parse(b, false);
  if ('error' in p) return NextResponse.json({ message: p.error }, { status: 400 });

  try {
    const plan = await createStoryPlan(p as StoryPlanInput);
    void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'STORY_PLAN_CREATED', entityType: 'story_plan', entityId: plan.id, newValue: p });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (e) {
    const m = e instanceof Error ? e.message : '';
    if (/does not exist|schema cache/i.test(m)) {
      return NextResponse.json({ message: 'جدولِ بسته‌های استوری هنوز ساخته نشده (مایگریشن ۰۱۳ اجرا نشده)' }, { status: 503 });
    }
    return NextResponse.json({ message: 'ساختِ بسته انجام نشد' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const id = str(b.id, 60);
  if (!id) return NextResponse.json({ message: 'شناسه‌ی بسته لازم است' }, { status: 400 });

  const p = parse(b, true);
  if ('error' in p) return NextResponse.json({ message: p.error }, { status: 400 });

  const plan = await updateStoryPlan(id, p);
  if (!plan) return NextResponse.json({ message: 'ویرایشِ بسته انجام نشد' }, { status: 500 });

  void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'STORY_PLAN_UPDATED', entityType: 'story_plan', entityId: id, newValue: p });
  return NextResponse.json({ plan });
}

export async function DELETE(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!id) return NextResponse.json({ message: 'شناسه‌ی بسته لازم است' }, { status: 400 });

  const ok = await deactivateStoryPlan(id);
  if (!ok) return NextResponse.json({ message: 'غیرفعال‌سازی انجام نشد' }, { status: 500 });

  void audit({ actorId: g.actor!.id, actorRole: g.actor!.role, action: 'STORY_PLAN_DEACTIVATED', entityType: 'story_plan', entityId: id });
  return NextResponse.json({ ok: true });
}
