'use client';

/* یک دوربینِ در حالِ پخش — پیش‌نمایش و کنترل‌های خودش.
   جدا شده تا GoLive فقط هماهنگ‌کننده بماند. */

import { useEffect, useRef } from 'react';
import { Users, X, Mic, MicOff, MonitorUp, Video } from 'lucide-react';
import { actualSize } from '../../../lib/live/devices';

const RED = '#ef4444';

export interface Feed {
  angleId: string;
  label: string;
  kind: 'camera' | 'screen';
  deviceId: string;
  stream: MediaStream;
  viewers: number;
  micOn: boolean;
}

export default function FeedTile({
  feed, main, elapsed, onRemove, onToggleMic,
}: {
  feed: Feed;
  /** دوربینِ اصلی بزرگ‌تر نمایش داده می‌شود و حذف نمی‌شود. */
  main: boolean;
  elapsed?: string;
  onRemove?: () => void;
  onToggleMic?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = feed.stream; }, [feed.stream]);

  const { w, h } = actualSize(feed.stream);

  return (
    <div style={{
      position: 'relative', borderRadius: main ? 18 : 14, overflow: 'hidden',
      background: '#111', aspectRatio: '16/9',
    }}>
      {/* پیش‌نمایشِ خودِ باشگاه‌دار همیشه بی‌صداست، وگرنه صدای سالن از
          بلندگوی همان گوشی برمی‌گردد و سوت می‌کشد. */}
      <video ref={ref} autoPlay muted playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

      <div style={{
        position: 'absolute', top: 8, insetInlineStart: 8,
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      }}>
        <span style={chip(RED)}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'glPulse 1.4s infinite' }} />
          {main ? 'زنده' : feed.label}
        </span>
        {main && elapsed && <span style={chip()}>{elapsed}</span>}
        {feed.viewers > 0 && (
          <span style={chip()}><Users size={11} aria-hidden /> {feed.viewers.toLocaleString('fa-IR')}</span>
        )}
      </div>

      {/* ابعادِ واقعی — نه چیزی که خواسته بودیم.
          این تنها راهی است که باشگاه‌دار بفهمد دوربینش واقعا آن کیفیت
          را داد یا مرورگر پایین‌تر گرفت. */}
      {w > 0 && (
        <span style={{ ...chip(), position: 'absolute', bottom: 8, insetInlineStart: 8, direction: 'ltr' }}>
          {feed.kind === 'screen' ? <MonitorUp size={11} aria-hidden /> : <Video size={11} aria-hidden />}
          {w}x{h}
        </span>
      )}

      <div style={{ position: 'absolute', top: 8, insetInlineEnd: 8, display: 'flex', gap: 6 }}>
        {onToggleMic && (
          <button type="button" onClick={onToggleMic}
            aria-label={feed.micOn ? 'بی‌صدا کردن میکروفون' : 'روشن کردن میکروفون'}
            aria-pressed={!feed.micOn}
            style={{ ...ctrl, color: feed.micOn ? '#fff' : RED }}>
            {feed.micOn ? <Mic size={15} /> : <MicOff size={15} />}
          </button>
        )}
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={`قطع ${feed.label}`} style={ctrl}>
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

const chip = (bg?: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  background: bg ?? 'rgba(0,0,0,0.6)', color: '#fff',
  borderRadius: 999, padding: '3px 9px',
  fontSize: 10.5, fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
  backdropFilter: bg ? undefined : 'blur(8px)',
});

const ctrl: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
  background: 'rgba(0,0,0,0.55)', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)',
};
