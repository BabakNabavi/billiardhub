export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { rpc, audit } from '@/lib/finance/db';

/* ═══════════════════════════════════════════════════════════════
   ممیزیِ نقش‌های رهاشده.
   ───────────────────────────────────────────────────────────────
   کاربر نقشی را انتخاب می‌کند و می‌تواند بی‌درنگ شروع کند. ولی اگر
   ۷۲ ساعت بگذرد و پروفایلش را تکمیل نکند، نقش پس گرفته می‌شود.

   ── چرا لازم است ──
   بدونِ آن، فهرستِ نقش‌های هر کاربر پر می‌شود از نقش‌هایی که هرگز
   استفاده نکرده: کسی که یک‌بار روی «تولیدکننده» زده و رها کرده، تا
   ابد تولیدکننده می‌ماند. آمار، فیلترها و سهمیه‌ی آگهی همه بر پایه‌ی
   همین نقش‌ها کار می‌کنند.

   ── چرا برگشت‌پذیر است ──
   ردیف پاک می‌شود نه علامت‌گذاری، پس کاربر می‌تواند همان نقش را
   دوباره انتخاب کند و از نو ۷۲ ساعت وقت داشته باشد. پس‌گرفتنِ نقش
   مجازات نیست، تمیزکاری است.

   امنیت: اگر CRON_SECRET تنظیم شده باشد، فقط با همان هدر اجرا می‌شود
   (Vercel هنگام اجرای cron خودش هدر را می‌فرستد).
   ═══════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 401 });
    }
  }

  const { data, error } = await rpc<{ removed_user: string; removed_role: string }[]>(
    'bh_sweep_stale_roles', { p_hours: 72 },
  );

  if (error) {
    console.error('[cron/sweep-roles]', error.message);
    return NextResponse.json({ ok: false, message: 'ممیزی انجام نشد' }, { status: 500 });
  }

  const removed = Array.isArray(data) ? data : [];
  if (removed.length > 0) {
    /* در گزارشِ ممیزی می‌ماند: نقشی که خودکار پس گرفته شده باید ردی
       داشته باشد، وگرنه کاربری که شکایت می‌کند جوابی ندارد. */
    void audit({
      action: 'ROLES_SWEPT', entityType: 'role_request', entityId: 'cron',
      newValue: { count: removed.length, roles: removed.map(r => r.removed_role) },
    });
  }

  return NextResponse.json({ ok: true, removed: removed.length });
}
