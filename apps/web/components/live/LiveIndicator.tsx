'use client';

/* ─────────────────────────────────────────────────────────────
   نشانِ «در حال پخش» — روی کلِ سایت.

   ── چرا لازم است ──
   حالتِ پخش عمدا بیرون از کامپوننتِ پنل است تا عوض‌کردنِ تب یا رفتن
   به صفحه‌ی دیگر پخش را نکشد. ولی همین یعنی اگر باشگاه‌دار از پنل
   بیرون برود، دوربین و میکروفونش باز می‌ماند بدونِ هیچ نشانه یا
   دکمه‌ای — و تا لحظه‌ی بستنِ تب هم خبردار نمی‌شود.

   پس هر جای سایت که باشد، تا وقتی پخش در جریان است این نوار دیده
   می‌شود و همان‌جا می‌تواند تمامش کند.
   ───────────────────────────────────────────────────────────── */

import { useState, useSyncExternalStore } from 'react';
import { Radio, VideoOff, Loader2 } from 'lucide-react';
import {
  subscribe, getSnapshot, getServerSnapshot, endLocal,
} from '../../lib/live/broadcast-store';

const INK = '#1C1B17', FELT = '#0E7A38';
const fa = (n: number) => Number(n || 0).toLocaleString('fa-IR');

export default function LiveIndicator() {
  const st = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [busy, setBusy] = useState(false);

  if (st.feeds.length === 0) return null;

  const stop = async () => {
    if (busy) return;
    setBusy(true);
    await endLocal();
    setBusy(false);
  };

  const viewers = st.feeds.reduce((n, f) => n + f.viewers, 0);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        insetInlineStart: 'max(12px, env(safe-area-inset-left))',
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        zIndex: 2147482000,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(16,16,18,0.94)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 999,
        padding: '8px 8px 8px 14px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        fontFamily: 'Vazirmatn, sans-serif',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: FELT, flexShrink: 0, animation: 'liPulse 1.4s infinite' }} />
      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
        <Radio size={12} style={{ verticalAlign: '-1px', marginInlineEnd: 4 }} aria-hidden />
        در حال پخش
        {st.feeds.length > 1 && ` · ${fa(st.feeds.length)} دوربین`}
        {viewers > 0 && ` · ${fa(viewers)} بیننده`}
      </span>
      <button type="button" onClick={() => void stop()} disabled={busy} className="li-stop">
        {busy ? <Loader2 size={13} className="li-spin" aria-hidden /> : <VideoOff size={13} aria-hidden />}
        {st.owned ? 'پایان' : 'قطع'}
      </button>

      <style>{`
        @keyframes liPulse { 0%,100% { opacity:1 } 50% { opacity:.35 } }
        @keyframes liSpin { to { transform: rotate(360deg) } }
        .li-spin { animation: liSpin 1s linear infinite }
        .li-stop {
          display: inline-flex; align-items: center; gap: 5px;
          border: none; border-radius: 999px; cursor: pointer;
          background: #fff; color: ${INK};
          font-family: inherit; font-size: 12px; font-weight: 800;
          padding: 8px 14px; min-height: 34px;
          transition: background 0.16s ease;
        }
        .li-stop:hover { background: rgba(255,255,255,0.86) }
        .li-stop:focus-visible { outline: 2px solid #C7A66A; outline-offset: 2px }
        .li-stop:disabled { opacity: .6; cursor: default }
        @media (prefers-reduced-motion: reduce) {
          .li-spin { animation-duration: 2.4s }
        }
      `}</style>
    </div>
  );
}
