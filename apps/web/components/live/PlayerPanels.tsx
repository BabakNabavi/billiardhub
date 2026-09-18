'use client';

/* پنل‌ها و لایه‌های میانیِ پخش‌کننده — همه بدونِ state.
   جدا نگه داشته شده‌اند تا خودِ LivePlayer فقط منطقِ اتصال و
   کنترل بماند. */

import { Loader2, VideoOff, RefreshCw, Video, Check, BarChart3 } from 'lucide-react';
import type { LiveAngle } from '../../lib/live/angles';
import { healthOf, type LiveStats } from '../../lib/live/quality';

const fa = (n: number | string) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));

/* ── حالت‌های میانی ── */

export function ConnectingOverlay() {
  return (
    <div className="bpv-center">
      <Loader2 size={32} className="bpv-spin" aria-hidden />
      <p className="bpv-msg">در حال اتصال به پخش…</p>
    </div>
  );
}

export function EndedOverlay({ onBack }: { onBack?: () => void }) {
  return (
    <div className="bpv-center bpv-center--solid">
      <VideoOff size={32} aria-hidden />
      <p className="bpv-msg bpv-msg--lg">پخش پایان یافته است</p>
      {onBack && (
        <button type="button" className="bpv-unmute" onClick={onBack}>پخش‌های دیگر</button>
      )}
    </div>
  );
}

export function ErrorOverlay({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bpv-center bpv-center--solid">
      <VideoOff size={30} aria-hidden />
      <p className="bpv-msg">اتصال برقرار نشد</p>
      <button type="button" className="bpv-unmute" onClick={onRetry}>
        <RefreshCw size={15} aria-hidden /> تلاش دوباره
      </button>
    </div>
  );
}

/* ── انتخابِ دوربین + آمار ── */

export function SettingsPanel({
  angles, angleId, onAngle, statsOn, onToggleStats, id,
}: {
  angles: LiveAngle[];
  angleId: string;
  onAngle: (id: string) => void;
  statsOn: boolean;
  onToggleStats: () => void;
  id: string;
}) {
  return (
    /* گروه، نه dialog: این یک پاپ‌اوور است، نه پنجره‌ی مودال. با
       نقشِ dialog اسکرین‌ریدر انتظارِ تله‌ی فوکوس و aria-modal دارد که
       هیچ‌کدام این‌جا معنا ندارند. بستن با Esc و کلیکِ بیرون در خودِ
       LivePlayer است. */
    <div className="bpv-panel" id={id} role="group" aria-label="تنظیمات پخش">
      {angles.length > 1 && (
        <>
          <h4>دوربین</h4>
          {angles.map(a => {
            const on = a.id === angleId;
            return (
              <button key={a.id} type="button"
                className={`bpv-row${on ? ' bpv-row--on' : ''}`}
                aria-pressed={on}
                onClick={() => onAngle(a.id)}>
                <Video size={15} aria-hidden />
                <span style={{ flex: 1 }}>{a.label}</span>
                {on && <Check size={15} aria-hidden />}
              </button>
            );
          })}
        </>
      )}
      <h4>اطلاعات</h4>
      <button type="button"
        className={`bpv-row${statsOn ? ' bpv-row--on' : ''}`}
        aria-pressed={statsOn}
        onClick={onToggleStats}>
        <BarChart3 size={15} aria-hidden />
        <span style={{ flex: 1 }}>آمار فنی</span>
        {statsOn && <Check size={15} aria-hidden />}
      </button>
    </div>
  );
}

/* ── آمارِ زنده ──
   وقتی باشگاه‌دار می‌گوید «تصویر بد است»، تنها راهِ فهمیدنِ اینکه
   مشکل از پهنای باند است یا از دوربین، همین اعداد است. */
export function StatsPanel({ s }: { s: LiveStats }) {
  const h = healthOf(s);
  const label = h === 'good' ? 'خوب' : h === 'fair' ? 'متوسط' : 'ضعیف';
  return (
    <div className="bpv-stats" role="status" aria-live="off">
      <div><b>کیفیت </b><span className={`bpv-dot bpv-dot--${h}`} aria-hidden /> {label}</div>
      <div><b>رزولوشن </b>{s.width > 0 ? `${s.width}x${s.height}` : '—'}</div>
      <div><b>فریم </b>{s.fps > 0 ? `${s.fps} fps` : '—'}</div>
      <div><b>نرخ بیت </b>{s.kbps > 0 ? `${s.kbps} kbps` : '—'}</div>
      <div><b>اتلاف </b>{s.packetLoss}%</div>
      <div><b>تأخیر </b>{s.rtt > 0 ? `${s.rtt} ms` : '—'}</div>
      <div><b>کدک </b>{s.codec || '—'}</div>
    </div>
  );
}

/* شمارنده‌ی زمانِ پخش */
export function elapsedLabel(startedAt: number, now: number): string {
  const total = Math.max(0, Math.floor((now - startedAt) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return fa(h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`);
}
