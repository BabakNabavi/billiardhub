export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sessionFromRequest } from '@/lib/auth/session';
import { z } from 'zod';
import { sanitizeDiscountRules } from '@/lib/finance/pricing';

/* ⚠️ Zod روی مرز — قاعده‌ی پروژه، و این‌جا اثرِ مالیِ مستقیم دارد:
   `pricePerHour` پیش‌تر `body.pricePerHour || 0` بود، یعنی رشته،
   اعشار یا عددِ منفی هم می‌نشست. عددِ اعشاری دو سمتِ محاسبه را از هم
   جدا می‌کرد (سرور گِرد می‌کند، نمایشِ کلاینت نه) و رشته تا
   `NaN` در مبلغِ نهایی پیش می‌رفت. */
/* ⚠️ رشته‌ی خالی = «پر نشده»، نه «نامعتبر». فرم برای فیلدِ دست‌نخورده
   `''` می‌فرستد؛ بدونِ این نگاشت `z.coerce.number()` آن را صفر
   می‌کرد و `min(1)` کلِ درخواست را ۴۰۰ می‌کرد — یعنی اعتبارسنجی
   چیزی را می‌شکست که پیش‌تر با `|| null` مقدارِ پیش‌فرض می‌گرفت. */
const blankToUndef = (v: unknown) => (v === '' || v === null ? undefined : v);

const TableInput = z.object({
  number: z.preprocess(blankToUndef, z.coerce.number().int().min(1).max(999).optional()),
  type: z.preprocess(blankToUndef, z.string().max(40).optional()),
  brand: z.preprocess(blankToUndef, z.string().max(80).optional()),
  model: z.preprocess(blankToUndef, z.string().max(80).optional()),
  /* تومان، بدونِ اعشار. سقف فقط برای جلوگیری از عددِ بی‌معنا. */
  pricePerHour: z.preprocess(blankToUndef, z.coerce.number().int().min(0).max(100_000_000).optional()),
});

/* فقط میزهایی که باشگاه واقعا ثبت کرده قابل رزرو هستند.
   پیش‌تر اگر جدول tables خالی بود، از روی تعداد اعلام‌شده در پروفایل باشگاه
   میزهای ساختگی با قیمت هاردکد ساخته می‌شد و همان‌ها رزرو می‌شدند. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sb = getSupabaseServer();
  /* داشبورد باید میزهای بسته را هم ببیند تا بتواند بازشان کند؛
     صفحه‌ی رزرو نباید. پیش‌فرض «فقط قابل رزرو» است، چون مصرف‌کننده‌ی
     اصلی این مسیر همان صفحه‌ی رزرو است و یک فراموشی آن‌جا یعنی
     نمایش میزی که باشگاه‌دار بسته است. */
  const includeClosed = new URL(_req.url).searchParams.get('all') === '1';

  const { data: rows, error } = await sb
    .from('tables')
    .select('*')
    .eq('clubId', id)
    .eq('isActive', true)
    .order('number', { ascending: true });

  if (error) return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });

  /* فیلتر در جاوااسکریپت و نه در کوئری: تا وقتی مهاجرت ۰۳۶ اجرا نشده،
     ستون وجود ندارد و یک `.eq('reservationClosed', false)` کل فهرست را
     خطا می‌کرد — یعنی صفحه‌ی رزرو هیچ میزی نشان نمی‌داد. */
  const list = (rows ?? []) as { reservationClosed?: boolean; discountRules?: unknown }[];
  /* ⚠️ قواعدِ تخفیف با همان تابعی پاک می‌شوند که سرورِ رزرو قیمت را
     با آن حساب می‌کند. صفحه‌ی رزرو قیمت را از همین پاسخ نشان می‌دهد؛
     اگر این‌جا خام برود و آن‌جا پاک‌شده، مبلغِ نمایش و مبلغِ درگاه
     دوتا می‌شوند. `id` و `label` می‌مانند چون پنلِ باشگاه (`?all=1`)
     هم همین را می‌خواند. */
  const clean = list.map(t => ({ ...t, discountRules: sanitizeDiscountRules(t.discountRules) }));
  const out = includeClosed ? clean : clean.filter(t => t.reservationClosed !== true);

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = sessionFromRequest(req);
  if (!payload) return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });

  const sb = getSupabaseServer();

  // verify ownership or admin
  const { data: club } = await sb.from('clubs').select('ownerId').eq('id', id).single();
  if (!club || (club.ownerId !== payload.id && payload.role !== 'admin')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const parsed = TableInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: 'اطلاعات میز معتبر نیست' }, { status: 400 });
  }
  const body = parsed.data;

  const { data, error } = await sb.from('tables').insert({
    clubId: id,
    number: body.number ?? null,
    type: body.type || 'snooker',
    brand: body.brand ?? null,
    model: body.model ?? null,
    /* صفر یعنی «هنوز قیمت‌گذاری نشده» — میز ثبت می‌شود ولی مسیرِ رزرو
       `pricePerHour <= 0` را رد می‌کند، پس تا قیمت نگیرد رزرو نمی‌شود. */
    pricePerHour: body.pricePerHour ?? 0,
    isActive: true,
  }).select().single();

  if (error) {
    console.error('[clubs/:id/tables] insert error:', error.message);
    return NextResponse.json({ message: 'ثبت میز انجام نشد' }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
