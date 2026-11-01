import { StreamProviderError, type ProvisionedChannel, type Recording, type StreamProvider } from './provider'

/* ─────────────────────────────────────────────────────────────
   کانالِ «دستی» — کانالی که در پنلِ خودِ سرویس (آروان) ساخته شده و
   مدیرِ سایت نشانی‌ها و کلیدش را در /admin/live به یک باشگاه وصل کرده.

   تا وقتی کلیدِ API نداریم، همین راهِ اتصال است: شروع/پایان فقط نمایش در
   سایت را روشن و خاموش می‌کند (روشن/خاموش‌کردنِ ورودیِ خودِ سرویس با API
   است). عوض‌کردنِ کلید هم در پنلِ سرویس انجام می‌شود، نه این‌جا.
   ───────────────────────────────────────────────────────────── */

export class ManualStreamProvider implements StreamProvider {
  readonly name = 'manual'
  isConfigured() { return true }

  async createChannel(): Promise<ProvisionedChannel> {
    throw new StreamProviderError('کانال دستی فقط از پنل مدیریت وصل می‌شود', 409)
  }
  async rotateKey(): Promise<{ streamKey: string }> {
    throw new StreamProviderError('کلید این کانال از پنل سرویس پخش (آروان) عوض می‌شود', 409)
  }
  async setEnabled() { /* بی API: فقط نمایش در سایت */ }
  async deleteChannel() { /* کانال در پنلِ سرویس می‌ماند */ }
  async isIngesting() { return null }
  async playbackUrl(ch: { playbackUrl: string | null }) { return ch.playbackUrl }
  async recordings(): Promise<Recording[]> { return [] }
}
