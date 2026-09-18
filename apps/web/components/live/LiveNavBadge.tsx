'use client';

/* ─────────────────────────────────────────────────────────────
   نشانِ «پخش زنده» در نوارِ بالای سایت.

   وقتی هر باشگاهی در حال پخش باشد دیده می‌شود و کاربر را مستقیم به
   صفحه‌ی پخش‌های زنده می‌برد. وقتی هیچ پخشی نیست هیچ‌چیز رندر
   نمی‌کند — نشانِ خاموش فقط جا می‌گیرد و بی‌معناست.

   شمارش از یک سینگلتون می‌آید (lib/live/live-count)، نه از تایمرِ
   خودِ کامپوننت: این نشان دو بار mount می‌شود و دو تایمر یعنی دو
   برابر درخواست.

   استایلش عمدا این‌جا نیست؛ در بلوکِ استایلِ خودِ Navbar است تا با
   دو بار mount شدن دو بار تزریق نشود.
   ───────────────────────────────────────────────────────────── */

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { subscribeLiveCount, getLiveCount, getServerLiveCount } from '../../lib/live/live-count';
import { faNum } from '../../lib/jalali';

export default function LiveNavBadge({ variant }: { variant: 'desktop' | 'mobile' }) {
  const count = useSyncExternalStore(subscribeLiveCount, getLiveCount, getServerLiveCount);

  if (count === 0) return null;

  const label = count > 1 ? `پخش زنده (${faNum(count)})` : 'پخش زنده';

  return (
    <Link
      prefetch={false}
      href="/live"
      aria-label={`${label} — هم‌اکنون در حال پخش`}
      className={variant === 'mobile' ? 'lnb lnb--mob mob' : 'lnb desk'}
    >
      <span className="lnb-dot" aria-hidden />
      {/* متن روی صفحه‌های باریک پنهان می‌شود ولی aria-label کامل
          می‌ماند، پس برای اسکرین‌ریدر چیزی کم نمی‌شود. */}
      <span className="lnb-txt">{label}</span>
    </Link>
  );
}
