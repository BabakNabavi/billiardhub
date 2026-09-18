'use client';

/* ─────────────────────────────────────────────────────────────
   تمام‌صفحه — چهار مسیر، چون یکی هرگز کافی نیست.

   ── باگی که این فایل برای آن نوشته شد ──
   کدِ قبلی این بود:

       videoRef.current?.requestFullscreen?.()

   روی آیفون `requestFullscreen` روی المانِ ویدیو **تعریف نشده** است.
   پس `?.()` بی‌صدا هیچ کاری نمی‌کرد: دکمه بود، فشرده می‌شد، و اتفاقی
   نمی‌افتاد. دقیقا همان چیزی که گزارش شد.

   ── چهار مسیر، به ترتیبِ کیفیت ──
   ۱) `container.requestFullscreen()` — استاندارد. دسکتاپ، اندروید، و
      آیفون از Safari 17.2 به بعد. کنترل‌های خودمان سرِ جایشان می‌مانند.
   ۲) `container.webkitRequestFullscreen()` — سافاریِ قدیمیِ مک.
   ۳) `video.webkitEnterFullscreen()` — آیفونِ قدیمی. پخش‌کننده‌ی
      بومیِ اپل باز می‌شود؛ کنترل‌های ما را از دست می‌دهیم ولی بیننده
      واقعا تمام‌صفحه می‌بیند. بهتر از دکمه‌ای که کار نمی‌کند.
   ۴) حالتِ «تمام‌صفحه‌ی درون‌صفحه‌ای» — همان کاری که خودِ توییچ و
      یوتیوب روی iOSهای قدیمی می‌کنند: با CSS تمامِ ویوپورت را
      می‌گیریم. مرورگر نوارِ خودش را نگه می‌دارد ولی تجربه نزدیک است.
   ───────────────────────────────────────────────────────────── */

type FsDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FsEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FsVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitSupportsFullscreen?: boolean;
  webkitDisplayingFullscreen?: boolean;
};

export type FullscreenMode = 'native' | 'ios-video' | 'css' | 'none';

export function isFullscreenNow(): boolean {
  if (typeof document === 'undefined') return false;
  const d = document as FsDoc;
  return Boolean(d.fullscreenElement ?? d.webkitFullscreenElement);
}

/** آیا API استانداردِ تمام‌صفحه روی یک المانِ دلخواه در دسترس است؟ */
function canNativeContainer(el: HTMLElement): boolean {
  const e = el as FsEl;
  if (typeof e.requestFullscreen === 'function') {
    /* روی آیفونِ قدیمی خودِ متد هست ولی `document.fullscreenEnabled`
       false است — همان تله‌ای که «دکمه‌ی بی‌اثر» می‌سازد. */
    return document.fullscreenEnabled !== false;
  }
  return typeof e.webkitRequestFullscreen === 'function';
}

/**
 * ورود به تمام‌صفحه. حالتی را که واقعا استفاده شد برمی‌گرداند تا
 * فراخوان بداند باید حالتِ CSS را هم روشن کند یا نه.
 */
export async function enterFullscreen(
  container: HTMLElement | null, video: HTMLVideoElement | null,
): Promise<FullscreenMode> {
  if (!container) return 'none';
  const el = container as FsEl;

  if (canNativeContainer(container)) {
    try {
      if (typeof el.requestFullscreen === 'function') await el.requestFullscreen();
      else await el.webkitRequestFullscreen!();
      await lockLandscape();
      return 'native';
    } catch { /* رد شد — مسیرِ بعدی */ }
  }

  const v = video as FsVideo | null;
  if (v && typeof v.webkitEnterFullscreen === 'function' && v.webkitSupportsFullscreen !== false) {
    try { v.webkitEnterFullscreen(); return 'ios-video' } catch { /* مسیرِ بعدی */ }
  }

  return 'css';
}

export async function exitFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;
  const d = document as FsDoc;
  try {
    if (d.fullscreenElement && typeof d.exitFullscreen === 'function') await d.exitFullscreen();
    else if (d.webkitFullscreenElement && typeof d.webkitExitFullscreen === 'function') await d.webkitExitFullscreen();
  } catch { /* بیننده خودش با Esc خارج شده */ }
  unlockOrientation();
}

/* ── چرخشِ صفحه ──
   در تمام‌صفحه‌ی موبایل، افقی حالتِ درست است: تصویرِ ۱۶:۹ عمودی یعنی
   دو نوارِ سیاهِ بزرگ و تصویرِ کوچک. اگر مرورگر پشتیبانی نکند یا کاربر
   قفلِ چرخشِ سیستم را روشن کرده باشد، بی‌صدا رد می‌شود. */
type OrientationLock = ScreenOrientation & {
  lock?: (o: 'landscape' | 'portrait' | 'any') => Promise<void>;
  unlock?: () => void;
};

async function lockLandscape(): Promise<void> {
  if (typeof screen === 'undefined') return;
  const o = screen.orientation as OrientationLock | undefined;
  if (!o?.lock) return;
  /* فقط روی صفحه‌ی کوچک. قفل‌کردنِ چرخشِ یک لپ‌تاپ بی‌معنا و آزاردهنده است. */
  if (typeof window !== 'undefined' && window.innerWidth > 900) return;
  try { await o.lock('landscape') } catch { /* قفلِ چرخشِ سیستم روشن است */ }
}

function unlockOrientation(): void {
  if (typeof screen === 'undefined') return;
  const o = screen.orientation as OrientationLock | undefined;
  try { o?.unlock?.() } catch { /* */ }
}

/* ── تصویر در تصویر ──
   روی آیفون فقط از iOS 14 به بعد و نه در همه‌ی حالت‌ها. دکمه‌اش باید
   وقتی در دسترس نیست اصلا نمایش داده نشود، نه اینکه کار نکند. */
type PipVideo = HTMLVideoElement & {
  requestPictureInPicture?: () => Promise<PictureInPictureWindow>;
  webkitSetPresentationMode?: (m: 'picture-in-picture' | 'inline') => void;
  webkitSupportsPresentationMode?: (m: string) => boolean;
};
type PipDoc = Document & {
  pictureInPictureEnabled?: boolean;
  pictureInPictureElement?: Element | null;
  exitPictureInPicture?: () => Promise<void>;
};

export function pipSupported(video: HTMLVideoElement | null): boolean {
  if (!video || typeof document === 'undefined') return false;
  const v = video as PipVideo;
  if ((document as PipDoc).pictureInPictureEnabled && typeof v.requestPictureInPicture === 'function') return true;
  return typeof v.webkitSupportsPresentationMode === 'function'
    && v.webkitSupportsPresentationMode('picture-in-picture');
}

export async function togglePip(video: HTMLVideoElement | null): Promise<void> {
  if (!video) return;
  const v = video as PipVideo;
  const d = document as PipDoc;
  try {
    if (d.pictureInPictureElement) { await d.exitPictureInPicture?.(); return }
    if (typeof v.requestPictureInPicture === 'function') { await v.requestPictureInPicture(); return }
    v.webkitSetPresentationMode?.('picture-in-picture');
  } catch { /* مرورگر اجازه نداد */ }
}
