export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/auth/session';
import { accountStateOf } from '@/lib/enforcement/server';
import { FEATURES, STATUS_LABEL, effectiveStatus, userMessage, type FeatureKey } from '@/lib/enforcement/policy';

/* وضعیتِ حسابِ خودِ کاربر — برای صفحه‌ی /account-status و پیامِ بخش‌های بسته.
   حتی حسابِ مسدود می‌تواند این را صدا بزند (BLOCKED_ALLOW در policy).
   ⚠️ فقط پیامِ عمومی: دلیلِ داخلی، یادداشت و مدرکِ مالک هرگز این‌جا نمی‌آید. */
export async function GET(req: NextRequest) {
  const s = sessionFromRequest(req);
  if (!s) return NextResponse.json({ signedIn: false }, { headers: { 'Cache-Control': 'no-store' } });
  const state = await accountStateOf(s.id);
  const status = effectiveStatus(state);
  return NextResponse.json({
    signedIn: true,
    status,
    label: STATUS_LABEL[status],
    message: userMessage(status, state.expiresAt),
    until: status === 'active' ? null : state.expiresAt,
    restrictions: status === 'limited'
      ? state.restrictions.filter(k => k in FEATURES).map(k => FEATURES[k as FeatureKey].label)
      : [],
    isOwner: state.isOwner,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
