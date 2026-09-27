export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { rpc, audit } from '@/lib/finance/db';
import { cronForbidden } from '@/lib/cron-guard';
import { logHandled } from '@/lib/log-handled';

/* ═══════════════════════════════════════════════════════════════
   ممیزی نقش‌های رهاشده.
   ───────────────────────────────────────────────────────────────
   کاربر نقشی را انتخاب می‌کند و می‌تواند بی‌درنگ شروع کند. ولی اگر
   ۷۲ ساعت بگذرد و پروفایلش را تکمیل نکند، نقش پس گرفته می‌شود.

   ── چرا لازم است ──
   بدون آن، فهرست نقش‌های هر کاربر پر می‌شود از نقش‌هایی که هرگز
   استفاده نکرده: کسی که یک‌بار روی «تولیدکننده» زده و رها کرده، تا
   ابد تولیدکننده می‌ماند. آمار، فیلترها و سهمیه‌ی آگهی همه بر پایه‌ی
   همین نقش‌ها کار می‌کنند.

   ── چرا برگشت‌پذیر است ──
   ردیف پاک می‌شود نه علامت‌گذاری، پس کاربر می‌تواند همان نقش را
   دوباره انتخاب کند و از نو ۷۲ ساعت وقت داشته باشد. پس‌گرفتن نقش
   مجازات نیست، تمیزکاری است.

   امنیت: راز درست (`CRON_SECRET`) یا درخواستِ لوکال — `lib/cron-guard`.
   زمان‌بند: `/opt/billiardhub/cron-tick.sh` در crontab سرور، نه
   `vercel.json` که از زمان مهاجرت به VPS مرده است.
   ═══════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  /* راز درست، یا درخواستِ واقعا لوکال. نسخه‌ی قبلی بدونِ راز کاملا
     باز بود — و این مسیرها وضعیتِ مالی را عوض می‌کنند. */
  const bad = cronForbidden(req);
  if (bad) return NextResponse.json({ message: bad.message }, { status: bad.status });

  const { data, error } = await rpc<{ removed_user: string; removed_role: string }[]>(
    'bh_sweep_stale_roles', { p_hours: 72 },
  );

  if (error) {
    console.error('[cron/sweep-roles]', error.message);
    void logHandled('cron/sweep-roles', error).catch(() => {});
    return NextResponse.json({ ok: false, message: 'ممیزی انجام نشد' }, { status: 500 });
  }

  const removed = Array.isArray(data) ? data : [];
  if (removed.length > 0) {
    /* در گزارش ممیزی می‌ماند: نقشی که خودکار پس گرفته شده باید ردی
       داشته باشد، وگرنه کاربری که شکایت می‌کند جوابی ندارد. */
    void audit({
      action: 'ROLES_SWEPT', entityType: 'role_request', entityId: 'cron',
      newValue: { count: removed.length, roles: removed.map(r => r.removed_role) },
    });
  }

  return NextResponse.json({ ok: true, removed: removed.length });
}
