export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { can } from '@/lib/admin/permissions';

/* ─────────────────────────────────────────────────────────────
   «الان چقدر، به چه کسی، به کدام شبا؟»

   ── چرا این مسیر لازم شد ──
   داده‌اش از قبل بود، ولی در چهار تبِ جدا پخش شده بود و هیچ‌کدام به
   تنهایی به این سؤال جواب نمی‌داد:

     • «موجودی باشگاه‌ها» مبلغ را می‌گفت ولی **شبا نداشت**
     • «تسویه‌ها» شبا داشت ولی فقط بعد از ساختنِ تسویه
     • «بازپرداخت‌ها» مبلغ و وضعیت داشت ولی **مقصدِ پرداخت نداشت**

   یعنی برای یک واریز باید بین سه جدول رفت‌وبرگشت می‌شد. این‌جا همان
   سه تا در یک فهرستِ کارِ اجرایی جمع می‌شوند، با همه‌چیزی که برای
   نشستنِ پشتِ بانک لازم است.

   ── «آماده» در برابر «مسدود» ──
   ردیفی که مقصدِ تأییدشده ندارد حذف نمی‌شود؛ با علتش نشان داده
   می‌شود. حذفش یعنی بدهی از چشم پنهان بماند، و همان چیزی است که
   باعث می‌شود ماه‌ها بعد کسی بپرسد «پس پولِ من کجاست؟»
   ───────────────────────────────────────────────────────────── */

const n = (v: unknown) => Number(v ?? 0) || 0;

export async function GET(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await can(actor.id, 'finance'))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const [accounts, settlements, refunds] = await Promise.all([
    sb().from('club_accounts').select('club_id,available_balance,pending_balance'),
    /* تسویه‌های باز = دستورِ پرداختی که ساخته شده ولی هنوز واریز نشده */
    sb().from('settlements').select('*').in('status', ['PENDING', 'PROCESSING'])
      .order('requested_at', { ascending: true }),
    sb().from('refunds').select('id,booking_id,club_id,user_id,amount,reason,status,created_at')
      .in('status', ['REQUESTED', 'PROCESSING'])
      .order('created_at', { ascending: true }),
  ]);

  type Club = { id: string; name: string; iban?: string; ibanOwnerName?: string; bankName?: string; ibanVerified?: boolean };
  type User = {
    id: string; firstName?: string; lastName?: string; phone?: string
    bank_card?: string; bank_card_owner?: string; bank_iban?: string; bank_card_verified?: boolean
  };

  /* ── فقط همان ردیف‌هایی که لازم است ──
     نسخه‌ی اول کلِ `users` و `clubs` را می‌گرفت. PostgREST سقفِ
     پیش‌فرضِ سطر دارد، پس با رشدِ جدولِ کاربران، کاربرِ یک بازپرداخت
     می‌توانست بیرونِ صفحه‌ی برگشتی بماند و بی‌دلیل «حساب ثبت نشده»
     بگیرد — بدترین نوعِ باگ در صفحه‌ی پرداخت. */
  const clubIds = [...new Set([
    ...((settlements.data ?? []) as Record<string, unknown>[]).map(s => String(s.club_id)),
    ...((accounts.data ?? []) as Record<string, unknown>[]).map(a => String(a.club_id)),
    ...((refunds.data ?? []) as Record<string, unknown>[]).map(r => String(r.club_id)),
  ])].filter(Boolean);
  const userIds = [...new Set(
    ((refunds.data ?? []) as Record<string, unknown>[]).map(r => String(r.user_id)),
  )].filter(id => id && id !== 'null');

  const [clubs, users] = await Promise.all([
    clubIds.length
      ? sb().from('clubs').select('id,name,iban,"ibanOwnerName","bankName","ibanVerified"').in('id', clubIds)
      : Promise.resolve({ data: [] as unknown[] }),
    /* ── چرا `bank_iban` هم لازم است ──
       بازپرداخت در نهایت به **شبا** می‌رود نه به کارت — همان‌طور که
       `api/users/bank-card` موقعِ ثبت می‌نویسد و در توضیحش هم آمده.
       نسخه‌ی اول این مسیر فقط `bank_card` را می‌خواند، یعنی مقصدی
       نشان می‌داد که پول از آن راه نمی‌رود. */
    userIds.length
      ? sb().from('users')
        .select('id,"firstName","lastName",phone,bank_card,bank_card_owner,bank_iban,bank_card_verified')
        .in('id', userIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const clubBy = new Map((clubs.data ?? []).map((c) => [String((c as Club).id), c as Club]));
  const userBy = new Map((users.data ?? []).map((u) => [String((u as User).id), u as User]));

  /* مقصدِ واریزِ باشگاه. عکسِ لحظه‌ی ساختِ تسویه بر رکوردِ امروز اولویت
     دارد: اگر باشگاه بعد از ثبتِ تسویه حسابش را عوض کرده باشد، پول
     باید به همان حسابی برود که تسویه رویش بسته شده. */
  const clubDest = (clubId: string, snap?: Record<string, unknown> | null) => {
    const c = clubBy.get(clubId);
    const iban = String(snap?.iban ?? c?.iban ?? '').trim();
    return {
      iban,
      holder: String(snap?.holder ?? c?.ibanOwnerName ?? '').trim(),
      bankName: String(snap?.bank ?? c?.bankName ?? '').trim(),
      verified: !!c?.ibanVerified || !!snap?.verified_at,
    };
  };

  const blockedReason = (iban: string, verified: boolean) =>
    !iban ? 'شبا ثبت نشده — از باشگاه بخواهید اطلاعات بانکی را کامل کند'
      : !verified ? 'شبا هنوز استعلام نشده — پیش از واریز تأییدش کنید'
        : null;

  /* ── ۱) تسویه‌های ساخته‌شده و پرداخت‌نشده ── */
  const openSettlements = ((settlements.data ?? []) as Record<string, unknown>[]).map(s => {
    const clubId = String(s.club_id);
    const snap = (s.bank_account_snapshot ?? null) as Record<string, unknown> | null;
    const d = clubDest(clubId, snap);
    return {
      kind: 'settlement' as const,
      id: String(s.id),
      clubId,
      clubName: clubBy.get(clubId)?.name ?? '—',
      amount: n(s.amount),
      ...d,
      status: String(s.status),
      requestedAt: String(s.requested_at ?? s.created_at ?? ''),
      blocked: blockedReason(d.iban, d.verified),
    };
  });

  /* ── ۲) باشگاهی که طلبکار است ولی هنوز تسویه‌ای برایش ساخته نشده ──
     این‌ها هنوز «دستورِ پرداخت» نیستند؛ یک گام مانده. ولی باید دیده
     شوند، وگرنه بدهی سکوت می‌کند. */
  const ordered = new Set(openSettlements.map(s => s.clubId));
  const unordered = ((accounts.data ?? []) as Record<string, unknown>[])
    .filter(a => n(a.available_balance) > 0 && !ordered.has(String(a.club_id)))
    .map(a => {
      const clubId = String(a.club_id);
      const d = clubDest(clubId);
      return {
        kind: 'unordered' as const,
        id: clubId,
        clubId,
        clubName: clubBy.get(clubId)?.name ?? '—',
        amount: n(a.available_balance),
        ...d,
        status: 'NOT_ORDERED',
        requestedAt: '',
        blocked: blockedReason(d.iban, d.verified),
      };
    });

  /* ── ۳) بازپرداختِ کاربر ──
     مقصد شبا است؛ کارت فقط وقتی می‌ماند که شبایی ثبت نشده باشد.

     ── چرا «استعلام‌نشده» دیگر مسدود نمی‌کند ──
     نسخه‌ی اول اگر `bank_card_verified` روشن نبود پرداخت را می‌بست.
     ولی کارت **فقط** پس از تطابقِ موفقِ شاهکار ذخیره می‌شود؛ یعنی
     کارتِ ثبت‌شده ذاتاً استعلام‌شده است و آن شرط عملاً چیزی جز
     داده‌ی قدیمی یا حسابِ بازشده‌ی ادمین را نمی‌گرفت — و در هر دو
     حالت پول باید پرداخت شود.

     پرچمِ خاموش حالا فقط هشدار است، نه سد: یعنی کاربر درخواستِ تغییرِ
     حساب داده و ادمین قفلش را باز کرده، پس بهتر است پیش از واریز
     مطمئن شود مقصد همان است که کاربر می‌خواهد. */
  const toUsers = ((refunds.data ?? []) as Record<string, unknown>[]).map(r => {
    const u = userBy.get(String(r.user_id));
    const iban = String(u?.bank_iban ?? '').replace(/\s/g, '').toUpperCase();
    const card = String(u?.bank_card ?? '').replace(/\D/g, '');
    const hasDest = !!(iban || card);
    return {
      id: String(r.id),
      bookingId: String(r.booking_id ?? ''),
      clubName: clubBy.get(String(r.club_id))?.name ?? '—',
      userName: `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || '—',
      holder: String(u?.bank_card_owner ?? '').trim(),
      phone: String(u?.phone ?? ''),
      amount: n(r.amount),
      /* شبا اولویت دارد؛ اگر نبود، کارت */
      dest: iban || card,
      destKind: iban ? ('iban' as const) : ('card' as const),
      verified: !!u?.bank_card_verified,
      reason: String(r.reason ?? ''),
      status: String(r.status),
      createdAt: String(r.created_at ?? ''),
      blocked: hasDest ? null
        : 'حساب بانکی کاربر ثبت نشده — از او بخواهید در پروفایلش کارت بانکی‌اش را وارد کند',
      /* هشدار، نه سد */
      warn: hasDest && !u?.bank_card_verified
        ? 'حساب این کاربر توسط ادمین باز شده (در حال تغییر) — پیش از واریز مقصد را تأیید کنید'
        : null,
    };
  });

  const toClubs = [...openSettlements, ...unordered]
    .sort((a, b) => b.amount - a.amount);

  const sum = (rows: { amount: number }[]) => rows.reduce((s, r) => s + r.amount, 0);
  const ready = [...toClubs, ...toUsers].filter(r => !r.blocked);
  const blocked = [...toClubs, ...toUsers].filter(r => !!r.blocked);

  return NextResponse.json({
    toClubs,
    toUsers,
    totals: {
      clubs: sum(toClubs),
      users: sum(toUsers),
      all: sum(toClubs) + sum(toUsers),
      ready: sum(ready),
      blocked: sum(blocked),
      readyCount: ready.length,
      blockedCount: blocked.length,
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
