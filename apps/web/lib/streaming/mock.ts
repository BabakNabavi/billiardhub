import { randomBytes, randomUUID } from 'node:crypto'
import type { ProvisionedChannel, Recording, StreamProvider } from './provider'

/* ─────────────────────────────────────────────────────────────
   سرویسِ ساختگی — فقط برای توسعه و تست (STREAM_PROVIDER=mock).

   نشانیِ ارسال روی دامنه‌ی رزروشده‌ی `.invalid` است تا هرگز به جایی
   وصل نشود. تصویرِ بیننده از STREAM_MOCK_HLS_URL می‌آید (اگر باشد) —
   وگرنه پخش‌کننده صادقانه «تصویر هنوز نرسیده» نشان می‌دهد.

   ⚠️ در پروداکشن خودکار جایگزینِ سرویسِ واقعی **نمی‌شود** (برخلافِ
   پرداخت): کلیدِ ساختگی به باشگاه‌دار یعنی پخشی که هرگز دیده نمی‌شود.
   ───────────────────────────────────────────────────────────── */

const key = () => `bh_${randomBytes(12).toString('hex')}`

export class MockStreamProvider implements StreamProvider {
  readonly name = 'mock'
  isConfigured() { return true }

  async createChannel(): Promise<ProvisionedChannel> {
    return {
      providerChannelId: `mock-${randomUUID()}`,
      ingestUrl: 'rtmp://ingest.mock.invalid/live',
      streamKey: key(),
      playbackUrl: process.env.STREAM_MOCK_HLS_URL || null,
    }
  }

  async rotateKey() { return { streamKey: key() } }
  async setEnabled() { /* ساختگی */ }
  async deleteChannel() { /* ساختگی */ }
  async isIngesting() { return null }
  async playbackUrl(ch: { playbackUrl: string | null }) { return ch.playbackUrl }
  async recordings(): Promise<Recording[]> { return [] }
}
