export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { actorFromRequest } from '@/lib/finance/db';

/* استعلام نشانی از کد پستی — برای پرکردن خودکار آدرس تحویل.

   باز هم همان قرارداد: «پیدا نشد» با success=true برمی‌گردد و فقط
   فیلدهای data خالی‌اند؛ آن حالت یعنی «کد پستی وجود ندارد»، نه خطا. */

const URL_ = 'https://s.api.ir/api/sw1/PostalCodeInfo';

interface Addr {
  province?: string | null; city?: string | null; town?: string | null; district?: string | null
  street?: string | null; street2?: string | null; number?: string | null; floor?: string | null
  sideFloor?: string | null; buildingName?: string | null; description?: string | null; address?: string | null
}
interface Envelope { success?: boolean; code?: number; message?: string | null; data?: Addr | null }

export async function POST(req: NextRequest) {
  /* فقط کاربر واردشده — تا اعتبار سرویس با درخواست ناشناس هدر نرود */
  if (!actorFromRequest(req)) {
    return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const postalCode = String(body?.postalCode ?? '')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[^0-9]/g, '');

  if (postalCode.length !== 10) {
    return NextResponse.json({ message: 'کد پستی باید ۱۰ رقم باشد' }, { status: 400 });
  }

  const key = process.env.SMS_API_KEY;
  if (!key) return NextResponse.json({ message: 'سرویس استعلام پیکربندی نشده است' }, { status: 503 });

  let r: Response;
  try {
    r = await fetch(URL_, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ postalCode }),
    });
  } catch {
    return NextResponse.json({ message: 'خطا در اتصال به سرویس استعلام' }, { status: 503 });
  }

  const j = await r.json().catch(() => null) as Envelope | null;

  const denied = r.status === 401 || r.status === 403 || j?.code === 401 || j?.code === 403
    || /trust level|سطح دسترسی|اعتبار|credit|unauthorized/i.test(j?.message || '');
  if (denied) {
    console.error('PostalCodeInfo unavailable:', j?.message || r.status);
    return NextResponse.json({ message: 'سرویس استعلام در دسترس نیست' }, { status: 503 });
  }
  if (!j) return NextResponse.json({ message: 'پاسخ سرویس خوانده نشد' }, { status: 503 });

  if (j.success === false) {
    return NextResponse.json({ message: 'کد پستی معتبر نیست' }, { status: 400 });
  }

  /* success=true ولی بدون استان/شهر ⇒ چنین کد پستی‌ای ثبت نشده است */
  const d = j.data;
  if (!d || (!d.province && !d.city && !d.address)) {
    return NextResponse.json({ found: false, message: 'نشانی‌ای برای این کد پستی یافت نشد' }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    province: d.province ?? null,
    city: d.city ?? null,
    address: d.address ?? null,
    details: {
      town: d.town ?? null, district: d.district ?? null,
      street: d.street ?? null, number: d.number ?? null,
      floor: d.floor ?? null, buildingName: d.buildingName ?? null,
    },
  });
}
