'use client';

/* ─────────────────────────────────────────────────────────────
   پخش‌کننده‌ی زنده.

   ── چه چیزی از پخش‌کننده‌های بزرگ برداشته شده ──
   • یوتیوب: پرده‌ی تیره پشتِ کنترل‌ها، پنهان‌شدنِ خودکارِ کنترل‌ها،
     لغزنده‌ی صدا که با نزدیک‌شدنِ موس باز می‌شود، «آمار فنی»،
     میان‌برهای صفحه‌کلید.
   • توییچ: نشانِ قرمزِ LIVE با نقطه‌ی تپنده، دکمه‌ی صریحِ «صدا را
     روشن کن» (چون مرورگر همیشه بی‌صدا شروع می‌کند).
   • پخش‌کننده‌های ورزشی (F1 TV و مشابه): انتخابِ دوربین از سمتِ
     بیننده، چون در یک مسابقه چند زاویه هم‌زمان معنا دارد.
   • همه: دوبار-زدن روی موبایل = تمام‌صفحه، و چرخشِ خودکار به افقی.

   ── چرا تمام‌صفحه قبلا کار نمی‌کرد ──
   کدِ قبلی `video.requestFullscreen?.()` را صدا می‌زد. روی آیفون این
   متد روی المانِ ویدیو **وجود ندارد**، پس `?.()` بی‌صدا رد می‌شد.
   منطقِ چهارمرحله‌ایِ جایگزین در `lib/live/fullscreen.ts` است.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  Settings, PictureInPicture2, Users, Video,
} from 'lucide-react';
import { joinBroadcast, type Viewer, type ViewerState } from '../../lib/live/webrtc';
import { MAIN_ANGLE, activeAngles, switchableAngles, type LiveAngle } from '../../lib/live/angles';
import { emptyStats, type LiveStats } from '../../lib/live/quality';
import {
  enterFullscreen, exitFullscreen, isFullscreenNow, pipSupported, togglePip,
} from '../../lib/live/fullscreen';
import { PLAYER_CSS } from '../../lib/live/player-styles';
import {
  ConnectingOverlay, EndedOverlay, ErrorOverlay, SettingsPanel, StatsPanel, elapsedLabel,
} from './PlayerPanels';

const fa = (n: number) => Number(n || 0).toLocaleString('fa-IR');
const IDLE_MS = 3200;

export interface LivePlayerProps {
  sessionId: string;
  /** همه‌ی دوربین‌های زنده. اگر یکی باشد، انتخابگر نشان داده نمی‌شود. */
  angles?: LiveAngle[];
  title?: string;
  viewers?: number;
  startedAt?: number;
  /** جلسه از سمتِ سرور تمام‌شده اعلام شده. */
  ended?: boolean;
  onBack?: () => void;
}

export default function LivePlayer({
  sessionId, angles = [], title, viewers = 0, startedAt, ended = false, onBack,
}: LivePlayerProps) {
  const [angleId, setAngleId] = useState(MAIN_ANGLE);
  const [state, setState] = useState<ViewerState>('connecting');
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [ui, setUi] = useState(true);
  const [fs, setFs] = useState(false);
  const [cssFs, setCssFs] = useState(false);
  const [settings, setSettings] = useState(false);
  const [statsOn, setStatsOn] = useState(false);
  const [stats, setStats] = useState<LiveStats>(emptyStats());
  const [canPip, setCanPip] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [attempt, setAttempt] = useState(0);

  const boxRef = useRef<HTMLDivElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const idleRef = useRef<number | null>(null);
  const tapRef = useRef(0);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const choices = switchableAngles(angles);
  const dead = ended || state === 'ended';

  /* ── اتصال ──
     با عوض‌شدنِ دوربین، اتصالِ قبلی بسته و یکی تازه باز می‌شود. هر
     زاویه کانالِ سیگنالینگِ خودش را دارد، پس این کار روی بقیه‌ی
     بیننده‌ها اثری ندارد. */
  useEffect(() => {
    if (!sessionId) return;
    setState('connecting');
    const v = joinBroadcast(
      sessionId,
      s => { if (vidRef.current) vidRef.current.srcObject = s; },
      setState,
      { angleId },
    );
    viewerRef.current = v;
    if (!v) setState('error');
    /* المان داخلِ افکت گرفته می‌شود، نه در cleanup: ری‌اکت refها را
       پیش از اجرای cleanup جدا می‌کند و آن‌جا ممکن است null باشد. */
    const el = vidRef.current;
    return () => {
      viewerRef.current?.leave(); viewerRef.current = null;
      /* بدونِ این، آخرین فریمِ دوربینِ قبلی هنگام سوییچ روی صفحه
         یخ می‌زند و شبیهِ هنگ‌کردن دیده می‌شود. */
      if (el) el.srcObject = null;
    };
  }, [sessionId, angleId, attempt]);

  /* ── دوربینی که مرد ──
     اگر زاویه‌ی انتخاب‌شده تپش نفرستد از فهرست بیرون می‌رود، انتخابگر
     پنهان می‌شود و افکتِ اتصال تا ابد به یک کانالِ مرده وصل می‌شود:
     «در حال اتصال» برای همیشه، بدونِ هیچ راهی جز ریلود. پس به
     دوربینِ اصلی برمی‌گردیم. */
  useEffect(() => {
    if (angleId === MAIN_ANGLE) return;
    if (!activeAngles(angles).some(a => a.id === angleId)) setAngleId(MAIN_ANGLE);
  }, [angles, angleId]);

  /* شمارنده‌ی زمان — یک تایمر برای کلِ کامپوننت */
  useEffect(() => {
    if (!startedAt || dead) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [startedAt, dead]);

  /* آمار — فقط وقتی پنل باز است، وگرنه getStats بی‌دلیل هر ثانیه
     روی گوشی اجرا می‌شود. */
  useEffect(() => {
    if (!statsOn || state !== 'live') return;
    let alive = true;
    const t = window.setInterval(async () => {
      const s = await viewerRef.current?.stats();
      if (alive && s) setStats(s);
    }, 1000);
    return () => { alive = false; window.clearInterval(t); };
  }, [statsOn, state]);

  useEffect(() => { setCanPip(pipSupported(vidRef.current)); }, [state]);

  /* ── پنهان‌شدنِ خودکارِ کنترل‌ها ──
     هر حرکتِ موس/لمس/کلید آن را برمی‌گرداند. وقتی پنلی باز است یا
     پخش متوقف است، پنهان نمی‌شود. */
  const wake = useCallback(() => {
    setUi(true);
    if (idleRef.current) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => setUi(false), IDLE_MS);
  }, []);

  useEffect(() => {
    if (settings || statsOn || !playing || state !== 'live') {
      if (idleRef.current) window.clearTimeout(idleRef.current);
      setUi(true);
      return;
    }
    wake();
    return () => { if (idleRef.current) window.clearTimeout(idleRef.current); };
  }, [settings, statsOn, playing, state, wake]);

  /* ── همگام‌ماندن با تمام‌صفحه‌ای که کاربر با Esc بسته ── */
  useEffect(() => {
    const sync = () => setFs(isFullscreenNow());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  /* حالتِ جایگزینِ CSS باید با Esc هم بسته شود؛ آن‌جا رویدادِ
     fullscreenchange وجود ندارد. */
  useEffect(() => {
    if (!cssFs) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCssFs(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [cssFs]);

  /* ── بستنِ پنلِ تنظیمات ──
     بدونِ این، تنها راهِ بستن زدنِ دوباره‌ی همان دکمه بود — نه Esc کار
     می‌کرد نه کلیکِ بیرون. */
  useEffect(() => {
    if (!settings) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setSettings(false);
      settingsBtnRef.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('.bpv-panel') || t === settingsBtnRef.current || t?.closest('[aria-controls="bpv-settings"]')) return;
      setSettings(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [settings]);

  /* ── کنترل‌ها ── */
  const togglePlay = useCallback(() => {
    const v = vidRef.current; if (!v) return;
    if (v.paused) { v.play().catch(() => { }); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
    wake();
  }, [wake]);

  const toggleMute = useCallback(() => {
    const v = vidRef.current; if (!v) return;
    const next = !v.muted;
    v.muted = next; setMuted(next);
    /* روشن‌کردنِ صدا روی موبایل گاهی ویدیوی متوقف‌شده را می‌خواهد */
    if (!next) v.play().catch(() => { });
    wake();
  }, [wake]);

  const changeVolume = useCallback((val: number) => {
    const v = vidRef.current; if (!v) return;
    v.volume = val; setVolume(val);
    if (val > 0 && v.muted) { v.muted = false; setMuted(false); }
    wake();
  }, [wake]);

  const toggleFs = useCallback(async () => {
    wake();
    if (fs || cssFs) {
      setCssFs(false);
      if (fs) await exitFullscreen();
      return;
    }
    const mode = await enterFullscreen(boxRef.current, vidRef.current);
    /* حالتِ `ios-video` پخش‌کننده‌ی بومیِ اپل را باز می‌کند و کنترل‌های
       ما دیگر دیده نمی‌شوند — پس نه fs و نه cssFs را روشن نمی‌کنیم. */
    if (mode === 'css') setCssFs(true);
    else if (mode === 'native') setFs(true);
  }, [fs, cssFs, wake]);

  /* ── میان‌برهای صفحه‌کلید ──
     همان حروفی که یوتیوب و توییچ استفاده می‌کنند، تا کسی لازم نباشد
     چیز تازه‌ای یاد بگیرد. */
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    /* رویداد از دکمه‌های داخلی هم بالا می‌آید. بدونِ این گارد، فشردنِ
       Space روی دکمه‌ی تنظیمات به‌جای بازکردنِ آن، پخش را متوقف
       می‌کرد — یعنی کنترل‌ها با صفحه‌کلید عملا از کار می‌افتادند. */
    const t = e.target as HTMLElement | null;
    if (t && t !== e.currentTarget && t.closest('button,input,select,a')) return;
    const k = e.key.toLowerCase();
    const hit = () => { e.preventDefault(); e.stopPropagation(); };
    if (k === ' ' || k === 'k') { hit(); togglePlay(); }
    else if (k === 'm') { hit(); toggleMute(); }
    else if (k === 'f') { hit(); void toggleFs(); }
    else if (k === 'i') { hit(); setStatsOn(s => !s); }
    else if (k === 'arrowup') { hit(); changeVolume(Math.min(1, volume + 0.1)); }
    else if (k === 'arrowdown') { hit(); changeVolume(Math.max(0, volume - 0.1)); }
    else if (/^[1-9]$/.test(k)) {
      const pick = choices[Number(k) - 1];
      if (pick) { hit(); setAngleId(pick.id); } else wake();
    }
    else wake();
  }, [togglePlay, toggleMute, toggleFs, changeVolume, volume, choices, wake]);

  /* دوبار-زدن روی موبایل = تمام‌صفحه (الگوی آشنای همه‌ی اپ‌های ویدیو) */
  const onTouch = useCallback(() => {
    const t = Date.now();
    if (t - tapRef.current < 300) { void toggleFs(); tapRef.current = 0; }
    else { tapRef.current = t; wake(); }
  }, [toggleFs, wake]);

  const angleLabel = choices.find(a => a.id === angleId)?.label ?? '';
  const showUi = ui && !dead;

  return (
    <div
      ref={boxRef}
      className="bpv"
      data-ui={showUi ? '1' : '0'}
      data-cssfs={cssFs ? '1' : '0'}
      tabIndex={0}
      role="region"
      aria-label={title ? `پخش زنده: ${title}` : 'پخش زنده'}
      onMouseMove={wake}
      onTouchStart={onTouch}
      onKeyDown={onKeyDown}
    >
      <style>{PLAYER_CSS}</style>

      <video
        ref={vidRef}
        autoPlay
        playsInline
        muted={muted}
        aria-label="تصویر پخش زنده"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        style={{ display: dead ? 'none' : 'block' }}
      />

      <div className="bpv-scrim bpv-scrim--top" aria-hidden />
      <div className="bpv-scrim" aria-hidden />

      {/* حالت‌های میانی */}
      {dead && <EndedOverlay onBack={onBack} />}
      {!dead && state === 'connecting' && <ConnectingOverlay />}
      {!dead && state === 'error' && <ErrorOverlay onRetry={() => setAttempt(a => a + 1)} />}

      {/* دعوتِ صریح به روشن‌کردنِ صدا — مرورگر همیشه بی‌صدا شروع می‌کند */}
      {!dead && state === 'live' && muted && (
        <div className="bpv-center">
          <button type="button" className="bpv-unmute" onClick={toggleMute}>
            <VolumeX size={16} aria-hidden /> برای شنیدن صدا بزنید
          </button>
        </div>
      )}

      {/* نوارِ بالا */}
      <div className="bpv-bar bpv-bar--top">
        {!dead && state === 'live' && (
          <span className="bpv-live"><i aria-hidden /> زنده</span>
        )}
        {startedAt && !dead && (
          <span className="bpv-chip">{elapsedLabel(startedAt, now)}</span>
        )}
        {viewers > 0 && (
          <span className="bpv-chip"><Users size={12} aria-hidden /> {fa(viewers)}</span>
        )}
        {angleLabel && (
          <span className="bpv-chip"><Video size={12} aria-hidden /> {angleLabel}</span>
        )}
        <span className="bpv-spacer" />
        {title && <span className="bpv-title">{title}</span>}
      </div>

      {/* نوارِ پایین */}
      <div className="bpv-bar bpv-bar--bottom">
        <button type="button" className="bpv-btn" onClick={togglePlay}
          aria-label={playing ? 'توقف' : 'پخش'} disabled={dead}>
          {playing ? <Pause size={19} /> : <Play size={19} />}
        </button>

        <div className="bpv-vol">
          <button type="button" className="bpv-btn" onClick={toggleMute}
            aria-label={muted ? 'روشن کردن صدا' : 'بی‌صدا'} aria-pressed={muted} disabled={dead}>
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <input type="range" min={0} max={1} step={0.05}
            value={muted ? 0 : volume}
            onChange={e => changeVolume(Number(e.target.value))}
            aria-label="میزان صدا" disabled={dead} />
        </div>

        <span className="bpv-spacer" />

        {/* انتخابِ دوربین — فقط وقتی واقعا بیش از یکی زنده است.
            گروهِ ساده، نه tablist: بدونِ tabpanel و بدونِ پیمایش با
            کلیدهای جهت، نقشِ tab فقط رابطی را به اسکرین‌ریدر اعلام
            می‌کند که وجود ندارد. */}
        {choices.length > 1 && (
          <div className="bpv-angles" role="group" aria-label="انتخاب دوربین">
            {choices.map(a => (
              <button key={a.id} type="button"
                className="bpv-angle"
                aria-pressed={a.id === angleId}
                onClick={() => { setAngleId(a.id); wake(); }}>
                {a.label}
              </button>
            ))}
          </div>
        )}

        <button type="button" className="bpv-btn" ref={settingsBtnRef}
          onClick={() => { setSettings(s => !s); wake(); }}
          aria-label="تنظیمات" aria-expanded={settings} aria-controls="bpv-settings" disabled={dead}>
          <Settings size={19} />
        </button>

        {canPip && (
          <button type="button" className="bpv-btn" onClick={() => void togglePip(vidRef.current)}
            aria-label="تصویر در تصویر" disabled={dead}>
            <PictureInPicture2 size={19} />
          </button>
        )}

        <button type="button" className="bpv-btn" onClick={() => void toggleFs()}
          aria-label={fs || cssFs ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'} disabled={dead}>
          {fs || cssFs ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
        </button>
      </div>

      {settings && !dead && (
        <SettingsPanel
          id="bpv-settings"
          angles={choices}
          angleId={angleId}
          onAngle={id => { setAngleId(id); setSettings(false); }}
          statsOn={statsOn}
          onToggleStats={() => setStatsOn(s => !s)}
        />
      )}

      {statsOn && !dead && <StatsPanel s={stats} />}
    </div>
  );
}
