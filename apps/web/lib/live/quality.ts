/* ─────────────────────────────────────────────────────────────
   کیفیتِ پخش — رزولوشن، نرخ بیت، و کدک.

   ── چرا این فایل لازم است ──
   گرفتنِ تصویرِ ۱۰۸۰p از دوربین به‌تنهایی یعنی هیچ. WebRTC به‌صورت
   پیش‌فرض نرخ بیتِ ویدیو را حوالیِ ۱ تا ۲ مگابیت نگه می‌دارد، هرقدر هم
   که تصویرِ ورودی بزرگ باشد. نتیجه‌اش تصویری است که «HD» خوانده می‌شود
   ولی روی میزِ بیلیارد، لبه‌ی توپ‌ها و نمدِ سبز را له می‌کند.

   پس دو کار جدا لازم است:
     ۱) قیدِ رزولوشن روی getUserMedia
     ۲) سقفِ نرخ بیت روی فرستنده‌ی هر اتصال (setParameters)

   بدونِ مرحله‌ی دوم، مرحله‌ی اول فقط باتری مصرف می‌کند.
   ───────────────────────────────────────────────────────────── */

export type QualityId = '720p30' | '1080p30' | '1080p60' | '1440p30' | '2160p30';

export interface QualityPreset {
  id: QualityId;
  label: string;
  /** توضیحِ کوتاه برای انتخاب‌کننده */
  hint: string;
  width: number;
  height: number;
  fps: number;
  /** بیت بر ثانیه. برای بیلیارد سخاوتمندانه‌تر از نرخِ معمولِ ویدیوکنفرانس
   *  گرفته شده: صحنه ریزبافت است (نمد، خطوطِ چوب، توپِ سفید روی سفید) و
   *  همان چیزی که بیننده می‌خواهد ببیند دقیقا در جزئیات است. */
  bitrate: number;
}

export const QUALITY_PRESETS: QualityPreset[] = [
  { id: '720p30',  label: 'HD ۷۲۰p',        hint: 'کم‌مصرف — مناسب اینترنت موبایل',      width: 1280, height: 720,  fps: 30, bitrate: 2_500_000 },
  { id: '1080p30', label: 'Full HD ۱۰۸۰p',  hint: 'پیشنهادی برای پخش مسابقه',            width: 1920, height: 1080, fps: 30, bitrate: 4_500_000 },
  { id: '1080p60', label: 'Full HD ۶۰ فریم', hint: 'حرکتِ نرم‌تر — اینترنت پرسرعت لازم',  width: 1920, height: 1080, fps: 60, bitrate: 6_000_000 },
  { id: '1440p30', label: '2K ۱۴۴۰p',       hint: 'دوربین حرفه‌ای با کارت کپچر',          width: 2560, height: 1440, fps: 30, bitrate: 8_500_000 },
  { id: '2160p30', label: '4K ۲۱۶۰p',       hint: 'بالاترین کیفیت — پهنای باند زیاد',     width: 3840, height: 2160, fps: 30, bitrate: 14_000_000 },
];

export const DEFAULT_QUALITY: QualityId = '1080p30';

export function presetOf(id: string | undefined | null): QualityPreset {
  /* پیش‌فرض ۱۰۸۰p است، ولی ایندکسِ ثابت زیرِ noUncheckedIndexedAccess
     تایپِ مطمئن نمی‌دهد — پس از خودِ ثابت استفاده می‌شود. */
  const hit = QUALITY_PRESETS.find(p => p.id === id);
  if (hit) return hit;
  const fallback = QUALITY_PRESETS.find(p => p.id === DEFAULT_QUALITY);
  if (!fallback) throw new Error('QUALITY_PRESETS is empty');
  return fallback;
}

/* ── قیدهای دوربین ──
   `ideal` عمدی است، نه `exact`. با `exact` اگر دوربین آن رزولوشن را
   نداشته باشد getUserMedia کلا خطا می‌دهد و باشگاه‌دار پیامِ «دوربین
   در دسترس نیست» می‌گیرد — در حالی که دوربینش سالم است و فقط ۴K
   نمی‌دهد. با `ideal` نزدیک‌ترین حالتِ ممکن گرفته می‌شود. */
export function videoConstraints(
  preset: QualityPreset,
  opts: { deviceId?: string; facing?: 'user' | 'environment' } = {},
): MediaTrackConstraints {
  const c: MediaTrackConstraints = {
    width:     { ideal: preset.width },
    height:    { ideal: preset.height },
    frameRate: { ideal: preset.fps },
  };
  /* شناسه‌ی دستگاه مقدم است: وقتی باشگاه‌دار صریحا کارت کپچرِ دوربینِ
     حرفه‌ای را انتخاب کرده، facingMode نباید انتخابش را عوض کند. */
  if (opts.deviceId) c.deviceId = { exact: opts.deviceId };
  else if (opts.facing) c.facingMode = opts.facing;
  return c;
}

export function audioConstraints(): MediaTrackConstraints {
  /* برای صدای محیطِ سالن، پردازشِ گفتار ضرر دارد: حذفِ نویز صدای برخوردِ
     توپ‌ها را هم می‌خورد و AGC صدای سالن را بالا و پایین می‌کند. */
  return {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 2,
  };
}

/* ── سقفِ نرخ بیت روی فرستنده ──
   بدونِ این، همه‌ی پریست‌ها عملا یک کیفیت می‌دهند. */
export async function applyQuality(pc: RTCPeerConnection, preset: QualityPreset): Promise<void> {
  for (const sender of pc.getSenders()) {
    if (sender.track?.kind !== 'video') continue;
    try {
      const p = sender.getParameters();
      /* روی بعضی مرورگرها `encodings` خالی می‌آید و نوشتن روی آرایه‌ی
         خالی بی‌اثر است — باید اول یک ورودی ساخت. */
      if (!p.encodings || p.encodings.length === 0) p.encodings = [{}];
      const enc = p.encodings[0];
      if (!enc) continue;
      enc.maxBitrate = preset.bitrate;
      enc.maxFramerate = preset.fps;
      /* بیلیارد: دیدنِ جای توپ مهم‌تر از نرمیِ حرکت است. با
         maintain-framerate، مرورگر زیر فشار رزولوشن را می‌اندازد و
         دقیقا همان چیزی را خراب می‌کند که بیننده آمده ببیند. */
      p.degradationPreference = 'maintain-resolution';
      await sender.setParameters(p);
    } catch { /* مرورگرِ قدیمی — پخش با نرخِ پیش‌فرض ادامه می‌یابد */ }
  }
}

/* ── تغییرِ کیفیت روی دوربینِ در حالِ کار ──
   بالا بردنِ سقفِ نرخ بیت به‌تنهایی کافی نیست: اگر دوربین همچنان
   ۷۲۰p بگیرد، پهنای باندِ بیشتر فقط همان تصویرِ کوچک را تمیزتر
   می‌کند. خودِ ترک هم باید قیدِ تازه را بگیرد.

   شکست عمدا بلعیده می‌شود — بعضی دوربین‌ها وسطِ کار قیدِ تازه را
   نمی‌پذیرند و در آن حالت ادامه دادن با کیفیتِ قبلی بهتر از قطعِ
   پخش است. */
export async function retuneTrack(stream: MediaStream, preset: QualityPreset): Promise<void> {
  const t = stream.getVideoTracks()[0];
  if (!t) return;
  try {
    await t.applyConstraints({
      width:     { ideal: preset.width },
      height:    { ideal: preset.height },
      frameRate: { ideal: preset.fps },
    });
  } catch { /* دوربین قیدِ تازه را نپذیرفت */ }
}

/* ── ترجیحِ کدک ──
   H264 اول: روی گوشی‌های ایرانی که CPU ضعیفی دارند، دیکدِ سخت‌افزاری
   دارد. VP9 در همان نرخ بیت تصویرِ بهتری می‌دهد ولی دیکدش نرم‌افزاری
   است و روی گوشیِ متوسط، هم داغ می‌کند هم فریم می‌اندازد. */
const CODEC_ORDER = ['video/H264', 'video/VP9', 'video/VP8'];

export function preferVideoCodec(pc: RTCPeerConnection): void {
  const caps = typeof RTCRtpSender !== 'undefined' && RTCRtpSender.getCapabilities
    ? RTCRtpSender.getCapabilities('video')
    : null;
  if (!caps?.codecs?.length) return;

  const rank = (m: string) => {
    const i = CODEC_ORDER.indexOf(m);
    return i === -1 ? CODEC_ORDER.length : i;
  };
  const ordered = [...caps.codecs].sort((a, b) => rank(a.mimeType) - rank(b.mimeType));

  for (const t of pc.getTransceivers()) {
    if (t.sender.track?.kind !== 'video') continue;
    try { t.setCodecPreferences?.(ordered) } catch { /* پشتیبانی نمی‌شود */ }
  }
}

/* ── آمارِ زنده ──
   همان چیزی که یوتیوب «Stats for nerds» می‌نامد. این‌جا فقط تزئین
   نیست: وقتی باشگاه‌دار می‌گوید «تصویر بد است»، تنها راهِ فهمیدنِ
   اینکه مشکل از پهنای باند است یا از دوربین، همین اعداد است. */
export interface LiveStats {
  width: number;
  height: number;
  fps: number;
  /** کیلوبیت بر ثانیه */
  kbps: number;
  /** درصد */
  packetLoss: number;
  /** میلی‌ثانیه */
  rtt: number;
  codec: string;
}

export function emptyStats(): LiveStats {
  return { width: 0, height: 0, fps: 0, kbps: 0, packetLoss: 0, rtt: 0, codec: '' };
}

/** وضعیتِ قبلی لازم است چون بایت‌ها تجمعی‌اند و نرخ باید از تفاضل
 *  دو نمونه حساب شود. */
export interface StatsCursor { bytes: number; at: number; lost: number; total: number }

export function newCursor(): StatsCursor { return { bytes: 0, at: 0, lost: 0, total: 0 } }

export async function readStats(
  pc: RTCPeerConnection, cur: StatsCursor, dir: 'inbound-rtp' | 'outbound-rtp',
): Promise<LiveStats> {
  const out = emptyStats();
  let report: RTCStatsReport;
  try { report = await pc.getStats() } catch { return out }

  const codecs = new Map<string, string>();
  report.forEach(s => {
    if (s.type === 'codec' && s.mimeType) codecs.set(s.id, String(s.mimeType).replace(/^video\//i, ''));
  });

  report.forEach(s => {
    if (s.type === dir && s.kind === 'video') {
      out.width  = Number(s.frameWidth  ?? 0);
      out.height = Number(s.frameHeight ?? 0);
      out.fps    = Math.round(Number(s.framesPerSecond ?? 0));
      if (s.codecId && codecs.has(s.codecId)) out.codec = codecs.get(s.codecId)!;

      const bytes = Number(s.bytesReceived ?? s.bytesSent ?? 0);
      const at = Number(s.timestamp ?? Date.now());
      if (cur.at > 0 && at > cur.at) {
        out.kbps = Math.max(0, Math.round(((bytes - cur.bytes) * 8) / (at - cur.at)));
      }
      cur.bytes = bytes; cur.at = at;

      const lost = Number(s.packetsLost ?? 0);
      const total = lost + Number(s.packetsReceived ?? s.packetsSent ?? 0);
      const dLost = lost - cur.lost, dTotal = total - cur.total;
      if (dTotal > 0) out.packetLoss = Math.max(0, Math.round((dLost / dTotal) * 1000) / 10);
      cur.lost = lost; cur.total = total;
    }
    if (s.type === 'candidate-pair' && s.state === 'succeeded' && s.currentRoundTripTime != null) {
      out.rtt = Math.round(Number(s.currentRoundTripTime) * 1000);
    }
  });

  return out;
}

/* ── کیفیتِ درک‌شده از روی آمار ──
   برای نشانِ رنگیِ کنارِ دکمه‌ی تنظیمات. */
export type LinkHealth = 'good' | 'fair' | 'poor';

export function healthOf(s: LiveStats): LinkHealth {
  if (s.packetLoss >= 5 || s.rtt >= 400) return 'poor';
  if (s.packetLoss >= 1.5 || s.rtt >= 200) return 'fair';
  return 'good';
}
