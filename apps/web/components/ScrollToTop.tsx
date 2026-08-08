'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/* هر ناوبری از بالای صفحه شروع شود.

   ── چرا بارِ اول نه ──
   این افکت بعد از hydration اجرا می‌شد، و در صفحه‌ی اصلی — که سنگین
   است — آن لحظه چند صد میلی‌ثانیه بعد از دیدنِ صفحه می‌آمد. اگر
   کاربر در همان فاصله شروع به اسکرول کرده بود، `scrollTo(0, 0)`
   او را برمی‌گرداند بالای هیرو.

   موقعِ بازکردنِ یک نشانی، مرورگر خودش جای درست را می‌داند (چه بالا
   چه جایی که با bfcache برگشته). فقط ناوبریِ داخلی است که تنظیم
   لازم دارد. */
export default function ScrollToTop() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
