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
  label: string;
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
    return all
      .filter(d => d.kind === 'videoinput')
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `دوربین ${i + 1}`,
      }));
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
