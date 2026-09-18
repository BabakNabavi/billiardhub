'use client';

import { videoConstraints, audioConstraints, type QualityPreset } from './quality';

/* ─────────────────────────────────────────────────────────────
   دوربین‌های در دسترس.

   ── چرا انتخابِ دستگاه، همان «پخش با دوربینِ حرفه‌ای» است ──
   یک دوربینِ فیلم‌برداری با کارتِ کپچرِ HDMI به USB، برای مرورگر
   دقیقا یک «وب‌کم» است. پس هیچ کدِ خاصی برای دوربینِ حرفه‌ای لازم
   نیست — فقط باید بشود آن ورودی را انتخاب کرد و رزولوشنِ بالا از آن
   خواست. تا وقتی facingMode تنها راهِ انتخاب باشد، مرورگر همیشه
   دوربینِ خودِ دستگاه را می‌دهد و کارتِ کپچر عملا دیده نمی‌شود.
   ───────────────────────────────────────────────────────────── */

export interface CamDevice {
  deviceId: string;
  /** نامِ خوانا برای نمایش. */
  label: string;
  /** اگر از روی برچسب قابلِ تشخیص بود. */
  facing: 'front' | 'back' | 'unknown';
  /** دوربینِ داخلیِ خودِ دستگاه، در برابرِ ورودیِ بیرونی مثل کارتِ کپچر. */
  builtIn: boolean;
}

/* ── نامِ خوانا ──
   کروم روی اندروید چیزهایی مثل «camera2 0, facing back» برمی‌گرداند و
   گاهی چند ورودیِ مجازی (واید، تله، عمق) هم کنارش می‌گذارد. همین باعث
   شد باشگاه‌دار بپرسد «این چند نوع دوربین چی هستند؟». پس هرجا بتوانیم
   نامِ فارسیِ روشن می‌گذاریم و نامِ خام را کنار می‌گذاریم. */
const BACK  = /\b(back|rear|environment|world)\b/i;
const FRONT = /\b(front|user|selfie)\b/i;
/* دوربینِ عمق و مادون‌قرمز تصویرِ معمولی نمی‌دهند و فقط فهرست را شلوغ
   می‌کنند. ورودیِ بیرونی (کارتِ کپچر) هرگز این‌جا نمی‌افتد. */
const NOT_A_CAMERA = /\b(depth|infrared|ir camera|tof)\b/i;

function describeCamera(raw: string): CamDevice['facing'] {
  if (BACK.test(raw)) return 'back';
  if (FRONT.test(raw)) return 'front';
  return 'unknown';
}

const faNum = (n: number) => n.toLocaleString('fa-IR');

/* صفتِ لنز را از نامِ خام بیرون می‌کشد: روی آیفون سه ورودی به نام
   «Back Camera»، «Back Dual Wide Camera» و «Back Ultra Wide Camera»
   هست و اگر همه به «دوربین پشت» تبدیل شوند، دقیقا همان اطلاعاتی گم
   می‌شود که برای کادرکردنِ میز به درد می‌خورد. */
function lensHint(raw: string): string {
  const cleaned = raw
    .replace(/\b(back|rear|front|user|environment|world|selfie)\b/gi, ' ')
    .replace(/\bcamera\d*\b/gi, ' ')
    .replace(/[,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  /* «camera2 0» و مشابهش اطلاعاتی ندارند */
  return /^[\d\s]*$/.test(cleaned) ? '' : cleaned;
}

function friendlyLabel(raw: string, facing: CamDevice['facing'], nth: number): string {
  if (facing === 'back' || facing === 'front') {
    const base = facing === 'back' ? 'دوربین پشت' : 'دوربین جلو';
    const hint = lensHint(raw);
    if (hint) return `${base} (${hint})`;
    return nth > 1 ? `${base} ${faNum(nth)}` : base;
  }
  /* نامِ خام برای ورودی‌های بیرونی مفید است — «USB Video» یا نامِ
     کارتِ کپچر دقیقا همان چیزی است که باشگاه‌دار دنبالش می‌گردد. */
  return raw;
}

/** برچسبِ خالی یعنی هنوز اجازه‌ی دوربین داده نشده — مرورگر تا آن
 *  لحظه نامِ دستگاه‌ها را مخفی می‌کند. */
export function needsPermissionForLabels(list: CamDevice[]): boolean {
  return list.length > 0 && list.every(d => !d.label);
}

export async function listCameras(): Promise<CamDevice[]> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return [];
  try {
    const all = await navigator.mediaDevices.enumerateDevices();
    const vids = all.filter(d => d.kind === 'videoinput');
    /* اگر فیلتر همه را برداشت (تبلتی که تنها ورودی‌اش «IR Camera» نام
       دارد) هیچ‌چیز نشان ندادن بدتر از نشان‌دادنِ همان است. */
    const shown = vids.filter(d => !NOT_A_CAMERA.test(d.label));
    const seen = { back: 0, front: 0, unknown: 0 };
    return (shown.length > 0 ? shown : vids)
      .map((d, i) => {
        const raw = d.label || '';
        const facing = describeCamera(raw);
        seen[facing] += 1;
        return {
          deviceId: d.deviceId,
          label: raw ? friendlyLabel(raw, facing, seen[facing]) : `دوربین ${faNum(i + 1)}`,
          facing,
          /* برچسبِ خالی یعنی هنوز اجازه داده نشده؛ در آن حالت فرضِ
             «داخلی» امن‌تر است چون اکثریت همین‌اند. */
          builtIn: facing !== 'unknown' || raw === '',
        };
      });
  } catch { return [] }
}

export interface OpenResult {
  stream: MediaStream | null;
  /** پیامِ فارسیِ آماده برای نمایش. خالی یعنی مشکلی نبود. */
  error: string;
}

/* پیام‌های خطا عمدا تفکیک شده‌اند: «اجازه ندادی» و «دوربین را برنامه‌ی
   دیگری گرفته» دو مشکلِ کاملا متفاوت‌اند و راهِ حلشان هم یکی نیست. */
function describe(e: unknown): string {
  const name = (e as { name?: string } | null)?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'اجازه‌ی دوربین یا میکروفون داده نشد. از تنظیمات مرورگر اجازه را بدهید.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'دوربینی با این مشخصات پیدا نشد. دوربین یا کیفیت دیگری را انتخاب کنید.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'دوربین در اختیار برنامه‌ی دیگری است. آن برنامه را ببندید و دوباره تلاش کنید.';
  }
  return 'دسترسی به دوربین ممکن نشد.';
}

export async function openCamera(
  preset: QualityPreset,
  opts: { deviceId?: string; facing?: 'user' | 'environment'; audio?: boolean } = {},
): Promise<OpenResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { stream: null, error: 'مرورگر شما از پخش زنده پشتیبانی نمی‌کند.' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints(preset, opts),
      audio: opts.audio === false ? false : audioConstraints(),
    });
    return { stream, error: '' };
  } catch (e) {
    /* ── تلاشِ دوم بدونِ قیدِ کیفیت ──
       بعضی کارت‌های کپچر با قیدِ frameRate یا رزولوشنِ دلخواه
       OverconstrainedError می‌دهند، در حالی که بدونِ قید سالم باز
       می‌شوند. شکست‌دادنِ باشگاه‌دار به‌خاطرِ یک قیدِ اختیاری اشتباه
       است. */
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: opts.deviceId ? { deviceId: { exact: opts.deviceId } } : { facingMode: opts.facing ?? 'environment' },
        audio: opts.audio === false ? false : true,
      });
      return { stream, error: '' };
    } catch { return { stream: null, error: describe(e) } }
  }
}

/* ── اشتراکِ صفحه ──
   برای نمایشِ تابلوی امتیاز، جدولِ مسابقات، یا پخشِ مجددِ یک ضربه از
   نرم‌افزارِ دیگر. روی موبایل در دسترس نیست و دکمه‌اش نباید نمایش
   داده شود. */
export function screenShareSupported(): boolean {
  return typeof navigator !== 'undefined'
    && typeof navigator.mediaDevices?.getDisplayMedia === 'function';
}

export async function openScreen(preset: QualityPreset): Promise<OpenResult> {
  if (!screenShareSupported()) {
    return { stream: null, error: 'اشتراک صفحه روی این دستگاه پشتیبانی نمی‌شود.' };
  }
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { width: { ideal: preset.width }, height: { ideal: preset.height }, frameRate: { ideal: preset.fps } },
      audio: true,
    });
    return { stream, error: '' };
  } catch (e) {
    const name = (e as { name?: string } | null)?.name ?? '';
    /* کاربر پنجره‌ی انتخاب را بست — این خطا نیست و نباید پیامِ قرمز بدهد. */
    if (name === 'NotAllowedError' || name === 'AbortError') return { stream: null, error: '' };
    return { stream: null, error: 'اشتراک صفحه ممکن نشد.' };
  }
}

export function stopStream(s: MediaStream | null | undefined): void {
  s?.getTracks().forEach(t => { try { t.stop() } catch { /* */ } });
}

/** ابعادِ واقعیِ چیزی که دوربین داد — نه چیزی که خواسته بودیم.
 *  همین عدد به باشگاه‌دار می‌گوید ۴K واقعا گرفته شد یا نه. */
export function actualSize(s: MediaStream | null): { w: number; h: number } {
  const t = s?.getVideoTracks()[0];
  if (!t) return { w: 0, h: 0 };
  const st = t.getSettings();
  return { w: Number(st.width ?? 0), h: Number(st.height ?? 0) };
}
