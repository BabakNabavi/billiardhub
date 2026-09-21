export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { isAdmin } from '@/lib/finance/db';

/* ژورنالِ خطا — فقط ادمین.
   GET   ?open=1        فهرست (پیش‌فرض: حل‌نشده‌ها)
   PATCH { id, resolved } علامت‌زدنِ رسیدگی‌شده

   ⚠️ کلیدِ دسترسیِ جدا برای این بخش ساخته نشد: تا وقتی در
   `lib/admin/permissions` ثبت نشده، `can()` برای همه false می‌دهد و
   صفحه برای ادمینِ غیرسوپر هم بسته می‌ماند. پس معیار همان
   `isAdmin` است — همان چیزی که بقیه‌ی مسیرهای بی‌کلید دارند. */

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
  if (!(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const sp = new URL(req.url).searchParams;
  const open = sp.get('open') !== '0';

  /* ── پشته‌ی یک ردیف ──
     فهرست عمدا `stack` را برنمی‌گرداند (تا ۸ کیلوبایت در هر ردیف).
     وقتی ادمین ردیفی را باز می‌کند، فقط همان یکی خوانده می‌شود. */
  const stackId = Number(sp.get('stack'));
  if (Number.isInteger(stackId) && stackId > 0) {
    const { data, error } = await sb().from('app_errors')
      .select('stack').eq('id', stackId).maybeSingle();
    if (error) return NextResponse.json({ message: 'خطا در خواندن پشته' }, { status: 500 });
    return NextResponse.json({ stack: (data as { stack?: string } | null)?.stack ?? '' });
  }

  let q = sb().from('app_errors')
    /* ⚠️ `stack` عمدا در فهرست نیست: تا ۸ کیلوبایت در هر ردیف و
       ۲۰۰ ردیف یعنی پاسخی تا ۱٫۶ مگابایت، برای فیلدی که فقط موقعِ
       بازکردنِ ردیف دیده می‌شود. مخاطب موبایلِ ایرانی است. */
    .select('id,fingerprint,source,message,url,release,hits,first_seen,last_seen,resolved')
    .order('last_seen', { ascending: false }).limit(200);
  if (open) q = q.eq('resolved', false);

  const { data, error } = await q;
  if (error) {
    /* مهاجرتِ ۰۹۸ هنوز اجرا نشده ⇒ «چیزی نیست»، نه خطا. بدونِ این
       گارد، صفحه‌ی ادمین پیش از اجرای مهاجرت ۵۰۰ می‌داد. */
    if (/does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({ rows: [], pending: true });
    }
    return NextResponse.json({ message: 'خطا در خواندن ژورنال' }, { status: 500 });
  }
  return NextResponse.json({ rows: data ?? [], pending: false });
}

/* ⚠️ Zod روی مرز — قاعده‌ی پروژه. `Number(x)` مقدارِ `1.5` و
   `1e30` را هم می‌پذیرفت و `!== false` هر چیزِ truthy را
   «رسیدگی‌شده» می‌کرد. */
const Patch = z.object({
  id: z.number().int().positive(),
  resolved: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
  if (!(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: 'ورودی نامعتبر است' }, { status: 400 });
  const { id, resolved } = parsed.data;

  /* `resolved_at` لازم است: تابعِ ثبت بر اساس آن تصمیم می‌گیرد که
     بازگشتِ خطا واقعی است یا تکرارِ همان سیل. */
  const { error } = await sb().from('app_errors')
    .update({ resolved, resolved_at: resolved ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) return NextResponse.json({ message: 'ثبت نشد' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
