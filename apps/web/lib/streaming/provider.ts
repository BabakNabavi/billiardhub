/* ─────────────────────────────────────────────────────────────
   قراردادِ سرویسِ پخش زنده — مثلِ درگاهِ پرداخت (lib/payments).

   هیچ جای سایت به آروان یا میزبان کلاد وابسته نیست. افزودنِ سرویس =
   یک فایل که این اینترفیس را پیاده کند + ثبت در lib/streaming/index.ts.

   ── روزِ وصل‌کردنِ سرویسِ واقعی ──
   ۱) آداپتور از روی مستنداتِ **واقعیِ** همان سرویس نوشته شود (نه از حدس).
   ۲) دامنه‌ی پخشِ HLSِ آن سرویس به `connect-src` و `media-src`ِ CSP در
      next.config.js اضافه شود — وگرنه مرورگر تصویر را می‌بندد.
   ۳) STREAM_PROVIDER و کلیدِ API در .env.localِ سرور (با تأییدِ مالک).
   ───────────────────────────────────────────────────────────── */

export interface ChannelSpec {
  /** نامِ کانال در پنلِ سرویس — برای پیداکردنش، نه نمایش به بیننده */
  title: string
  record: boolean
}

export interface ProvisionedChannel {
  providerChannelId: string
  /** نشانیِ ارسال (RTMP/SRT) که در OBS یا Larix وارد می‌شود */
  ingestUrl: string
  streamKey: string
  /** نشانیِ HLSِ بیننده؛ اگر سرویس لینکِ امضاشده می‌دهد، در playbackUrl() ساخته می‌شود */
  playbackUrl: string | null
}

export interface Recording { url: string; startedAt?: string }

export interface StreamProvider {
  readonly name: string
  isConfigured(): boolean
  createChannel(spec: ChannelSpec): Promise<ProvisionedChannel>
  /** کلیدِ تازه — کلیدِ قبلی دیگر کار نمی‌کند */
  rotateKey(providerChannelId: string): Promise<{ streamKey: string; ingestUrl?: string }>
  /** خاموش = سرویس ورودیِ این کانال را نمی‌پذیرد (مسدودی و پایانِ پخش) */
  setEnabled(providerChannelId: string, enabled: boolean): Promise<void>
  deleteChannel(providerChannelId: string): Promise<void>
  /** آیا تصویر به سرویس می‌رسد؟ null = این سرویس نمی‌گوید */
  isIngesting(providerChannelId: string): Promise<boolean | null>
  /** نشانیِ پخش برای یک بیننده (امضاشده/زمان‌دار اگر سرویس پشتیبانی کند) */
  playbackUrl(ch: { providerChannelId: string; playbackUrl: string | null }, viewer: { ip?: string }): Promise<string | null>
  /** ضبط‌های این کانال پس از یک زمان — برای آرشیو */
  recordings(providerChannelId: string, since: Date): Promise<Recording[]>
}

/** خطای سرویس — پیامش فارسی و قابلِ نمایش به باشگاه‌دار است */
export class StreamProviderError extends Error {
  constructor(message: string, readonly status = 502) { super(message) }
}
