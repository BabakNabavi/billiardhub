export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sb, rpc, actorFromRequest, isAdmin } from '@/lib/finance/db';

/* ژورنالِ رویدادها — فقط ادمین.
 *
 *   GET ?tab=audit    رویدادهای `audit_logs` (پیش‌فرض)
 *   GET ?tab=sessions نشست‌ها — یعنی تاریخچه‌ی ورود/خروجِ موفق
 *   GET ?detail=<id>  مقدارِ قبل/بعدِ یک ردیفِ ممیزی
 *
 * ── چرا دو تب و نه یک جدولِ یکپارچه ──
 * ورودِ موفق از قبل در `sessions` ثبت می‌شود (ip/user_agent/origin و
 * `revoked_at` برای خروج). نوشتنِ دوباره‌اش در `audit_logs` فقط حجم
 * اضافه می‌کرد بی‌آنکه چیزِ تازه‌ای بگوید. پس هر جدول همان چیزی را
 * نشان می‌دهد که خودش مرجعش است.
 *
 * ⚠️ کلیدِ دسترسیِ جدا ساخته نشد — تا وقتی در `lib/admin/permissions`
 * ثبت نشده `can()` برای همه false می‌دهد و صفحه برای ادمینِ غیرسوپر
 * هم بسته می‌ماند. معیار همان `isAdmin` است، مثلِ `/api/admin/errors`.
 */

/** سقفِ ردیف در هر درخواست. مخاطب موبایلِ ایرانی است. */
const PAGE = 150;

/* ⚠️ دو شکلِ ستون: پیش از مهاجرتِ ۱۰۴ `user_agent` وجود ندارد.
   بدونِ پس‌افت، صفحه تا اجرای دستیِ مهاجرت کاملا خالی می‌ماند در
   حالی که ردیف‌ها سرِ جایشان هستند. */
const COLS = 'id,actor_id,actor_role,action,entity_type,entity_id,ip,created_at';
const COLS_UA = `${COLS},user_agent`;

/** مهاجرتِ ۱۰۴ هنوز اجرا نشده ⇒ «چیزی نیست»، نه ۵۰۰. */
const isMissing = (m: string) => /does not exist|schema cache|column/i.test(m);

/* ⚠️ Zod روی مرز — قاعده‌ی پروژه. بدونِ این، `actor=xyz` مستقیم به
   ستونِ uuid می‌رفت، PostgREST ۴۰۰ می‌داد و این مسیر آن را به ۵۰۰
   ترجمه می‌کرد؛ یعنی خطای کاربر به شکلِ خطای سرور گزارش می‌شد. */
const Query = z.object({
  tab: z.enum(['audit', 'sessions']).optional(),
  detail: z.string().uuid().optional(),
  actor: z.string().uuid().optional(),
  user: z.string().uuid().optional(),
  ip: z.string().max(64).optional(),
  /* ⚠️ `a-z` هم لازم است. ۱۲۵ کنش از ۱۲۷تا بزرگ‌حروف‌اند، ولی
     `unlock_postal_code` و `unlock_bank_info` (در
     `api/admin/support`) کوچک‌اند. با رجکسِ فقط-بزرگ، انتخابِ همان دو
     از دراپ‌داون ۴۰۰ می‌گرفت و صفحه «فیلترِ نامعتبر» نشان می‌داد —
     باگی که فیلدِ متنیِ قبلی با `.toUpperCase()` می‌پوشاند و
     دراپ‌داون آشکارش کرد. */
  action: z.string().max(64).regex(/^[A-Za-z0-9_]*$/).optional(),
  entity: z.string().max(64).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  live: z.enum(['0', '1']).optional(),
  actions: z.enum(['1']).optional(),
});

/** نامِ کاربر برای شناسه‌ها — ژورنالی که فقط UUID نشان بدهد خوانده نمی‌شود. */
async function namesFor(ids: (string | null | undefined)[]) {
  const uniq = [...new Set(ids.filter((v): v is string => !!v))];
  if (!uniq.length) return {} as Record<string, string>;
  /* ⚠️ `actor_id` کلیدِ خارجی ندارد (مهاجرتِ ۰۰۱: فقط `uuid`)، پس
     PostgREST نمی‌تواند embed کند و این پرس‌وجوی دوم لازم است. */
  const { data } = await sb().from('users').select('id,name,phone').in('id', uniq);
  const map: Record<string, string> = {};
  for (const u of (data ?? []) as { id: string; name?: string; phone?: string }[]) {
    map[u.id] = u.name || u.phone || u.id.slice(0, 8);
  }
  return map;
}

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
  if (!(await isAdmin(actor.id))) return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });

  const parsed = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ message: 'پارامترِ نامعتبر' }, { status: 400 });
  const q = parsed.data;

  /* ── فهرستِ کنش‌ها برای دراپ‌داونِ فیلتر ──
     ⚠️ هاردکد نمی‌شود: ۱۲۷ کنش داریم و در حالِ زیادشدن. مهاجرتِ ۱۰۶
     همان چیزی را می‌دهد که *واقعا در جدول هست*. اگر اجرا نشده باشد
     فهرستِ خالی برمی‌گردد و کلاینت از ردیف‌های بارگذاری‌شده می‌سازدش. */
  if (q.actions === '1') {
    const { data, error } = await rpc<{ action: string }[]>('bh_audit_actions', {});
    if (error) return NextResponse.json({ actions: [] });
    return NextResponse.json({ actions: (data ?? []).map(r => r.action).filter(Boolean) });
  }

  /* ── مقدارِ قبل/بعدِ یک ردیف ──
     ⚠️ `old_value`/`new_value` از فهرست بیرون‌اند: jsonbِ آزادند و یک
     ردیفِ «ویرایشِ پروفایل» می‌تواند ده‌ها کیلوبایت باشد. ۱۵۰ ردیف
     در هر صفحه یعنی پاسخی که روی شبکه‌ی کند نمی‌رسد. */
  if (q.detail) {
    const read = (cols: string) =>
      sb().from('audit_logs').select(cols).eq('id', q.detail!).maybeSingle();
    /* ⚠️ همان پس‌افتِ فهرست. بدونِ آن، پیش از مهاجرتِ ۱۰۴ مقدارِ
       قبل/بعدِ **هر ۱۳۶ نقطه‌ی ثبت** نامرئی می‌شد، با اینکه در جدول
       نشسته‌اند — یعنی دقیقا همان چیزی که این پس‌افت برایش هست. */
    let { data, error } = await read('old_value,new_value,user_agent');
    if (error && isMissing(error.message)) ({ data, error } = await read('old_value,new_value'));
    if (error) return NextResponse.json({ message: 'خطا در خواندن جزئیات' }, { status: 500 });
    return NextResponse.json({ detail: data ?? null });
  }

  if (q.tab === 'sessions') {
    let b = sb().from('sessions')
      .select('id,user_id,created_at,last_used_at,revoked_at,revoked_reason,user_agent,ip,origin')
      .order('created_at', { ascending: false }).limit(PAGE);
    if (q.user) b = b.eq('user_id', q.user);
    if (q.ip) b = b.eq('ip', q.ip);
    /* «فقط نشست‌های زنده» — خروج‌کرده‌ها `revoked_at` دارند */
    if (q.live === '1') b = b.is('revoked_at', null);
    if (q.from) b = b.gte('created_at', q.from);
    if (q.to) b = b.lte('created_at', q.to);

    const { data, error } = await b;
    if (error) {
      /* ⚠️ `pendingTable` و نه `pendingUA`: پیامِ «مهاجرت ۱۰۴ اجرا
         نشده» برای این تب بی‌ربط است — ۱۰۴ به `sessions` کاری ندارد. */
      if (isMissing(error.message)) return NextResponse.json({ rows: [], names: {}, pendingTable: true });
      return NextResponse.json({ message: 'خطا در خواندن نشست‌ها' }, { status: 500 });
    }
    const rows = (data ?? []) as { user_id?: string }[];
    return NextResponse.json({ rows, names: await namesFor(rows.map(r => r.user_id)) });
  }

  /* ⚠️ `eq` و نه `ilike 'X%'`. نسخه‌ی اول پیشوندی بود با این توجیه که
     از `audit_action_idx` استفاده می‌کند — که **غلط بود**: پستگرس
     `ILIKE` را هرگز به اسکنِ بازه‌ی ایندکس تبدیل نمی‌کند، و حتی
     `LIKE 'X%'`ِ حساس‌به‌حروف هم بدونِ `text_pattern_ops` از ایندکس
     استفاده نمی‌کند مگر collation برابرِ C باشد. همه‌ی کنش‌ها ثابتِ
     بزرگ‌حروف‌اند و ورودی هم بزرگ می‌شود، پس تساوی هم درست است هم
     واقعا از ایندکسِ (action, created_at DESC) استفاده می‌کند. */
  const build = (cols: string) => {
    let b = sb().from('audit_logs').select(cols)
      .order('created_at', { ascending: false }).limit(PAGE);
    if (q.action) b = b.eq('action', q.action);
    if (q.actor) b = b.eq('actor_id', q.actor);
    if (q.ip) b = b.eq('ip', q.ip);
    if (q.entity) b = b.eq('entity_id', q.entity);
    if (q.from) b = b.gte('created_at', q.from);
    if (q.to) b = b.lte('created_at', q.to);
    return b;
  };

  let { data, error } = await build(COLS_UA);
  let pendingUA = false;
  if (error && isMissing(error.message)) {
    ({ data, error } = await build(COLS));
    pendingUA = true;
  }
  if (error) {
    if (isMissing(error.message)) return NextResponse.json({ rows: [], names: {}, pendingTable: true });
    return NextResponse.json({ message: 'خطا در خواندن ژورنال' }, { status: 500 });
  }
  const rows = (data ?? []) as unknown as { actor_id?: string }[];
  return NextResponse.json({ rows, names: await namesFor(rows.map(r => r.actor_id)), pendingUA });
}
