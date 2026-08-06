'use client';

/* ─────────────────────────────────────────────────────────────
   نوارِ افقیِ کشیدنی.

   ── چرا لازم شد ──
   نوارِ تبِ پنلِ باشگاه‌دار `overflow-x: auto` دارد با
   `scrollbar-width: none`. روی موبایل درست کار می‌کند (انگشت
   می‌کشد) ولی روی دسکتاپ **هیچ راهی برای اسکرول نمی‌ماند**:
   نه اسکرول‌بار دیده می‌شود، نه کشیدن با موس کار می‌کند —
   چون ظرفِ اسکرولِ بومی با موس درگ نمی‌شود. نتیجه این بود که
   تب‌های آخر (پیامک، مربیان، …) روی دسکتاپ اصلاً در دسترس
   نبودند و کاربر فکر می‌کرد نوار قفل است.

   سه راه باز می‌شود: کشیدن با موس، چرخِ عمودیِ موس، و کلیدهای
   جهت. محوکنندهٔ لبه هم می‌گوید هنوز چیزی آن‌طرف هست.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react';

export default function DragScroll({ children, style, className }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  /* در RTL مقدارِ `scrollLeft` منفی یا معکوس است بسته به مرورگر؛
     برای همین با `Math.abs` و فاصله‌ی تا انتها حساب می‌شود. */
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 1) { setEdges({ start: false, end: false }); return; }
    const pos = Math.abs(el.scrollLeft);
    setEdges({ start: pos > 4, end: pos < max - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  /* ── کشیدن با موس ──
     فقط برای اشاره‌گرِ موس. روی لمس، اسکرولِ بومی خودش بهتر است
     (اینرسی دارد) و دست‌کاری‌اش تجربه را بدتر می‌کند. */
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: 0 };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!drag.current.active || !el) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    /* از آستانه که رد شد، اشاره‌گر را می‌گیریم تا بیرون‌رفتنِ موس
       از نوار وسطِ کشیدن، حرکت را قطع نکند. */
    if (drag.current.moved > 4 && el.hasPointerCapture?.(e.pointerId) === false) {
      el.setPointerCapture?.(e.pointerId);
    }
    el.scrollLeft = drag.current.startScroll - dx;
    measure();
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (el?.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    /* اگر واقعاً کشیده شده، کلیکِ بعدی نباید تب را عوض کند —
       وگرنه هر کشیدن یک انتخابِ ناخواسته هم هست. */
    if (drag.current.moved > 4) {
      const swallow = (ev: Event) => { ev.preventDefault(); ev.stopPropagation(); };
      el?.addEventListener('click', swallow, { capture: true, once: true });
      /* اگر کلیکی نیامد، شنونده نباید تا کلیکِ بعدی بماند */
      setTimeout(() => el?.removeEventListener('click', swallow, { capture: true }), 0);
    }
    drag.current.active = false;
  };

  /* چرخِ عمودیِ موس ⇒ حرکتِ افقی. بیشترِ موس‌ها چرخِ افقی ندارند. */
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    el.scrollLeft += e.deltaY;
    measure();
  };

  return (
    <div style={{ position: 'relative' }} className={className}>
      <div
        ref={ref}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        style={{
          ...style,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          cursor: (edges.start || edges.end) ? 'grab' : undefined,
        }}
      >
        {children}
      </div>

      {/* محوکنندهٔ لبه — نشانه‌ی «هنوز ادامه دارد».
          `pointer-events: none` لازم است وگرنه روی تبِ زیرش می‌افتد. */}
      {(['start', 'end'] as const).map(side => edges[side] && (
        <div key={side} aria-hidden style={{
          position: 'absolute', top: 6, bottom: 6, width: 26, pointerEvents: 'none',
          ...(side === 'start' ? { right: 6 } : { left: 6 }),
          background: `linear-gradient(to ${side === 'start' ? 'left' : 'right'}, #fff, rgba(255,255,255,0))`,
          borderRadius: side === 'start' ? '10px 0 0 10px' : '0 10px 10px 0',
        }} />
      ))}
    </div>
  );
}
