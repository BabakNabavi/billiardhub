import { cache } from 'react'
import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Building2 } from 'lucide-react'
import { ChannelWatch } from '@/components/live/ChannelWatch'
import { ArchiveList } from '@/components/live/ArchiveList'
import { sessionFromRequest } from '@/lib/auth/session'
import { tablesReady } from '@/lib/streaming/repo'
import { publicChannel } from '@/lib/streaming/public'
import { KIND_LABEL } from '@/lib/streaming/policy'

/* صفحه‌ی تماشای یک کانالِ پخش زنده (سرویسِ پخش، HLS).
   داده‌ی اولیه همین‌جا روی سرور خوانده می‌شود؛ فقط پخش‌کننده و تپشِ
   بیننده کلاینت‌اند. بدونِ ثبت‌نام قابلِ دیدن است، مگر کانالِ «اعضا». */

export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* `cache`: متادیتا و صفحه یک بار می‌خوانند، نه دو بار */
const load = cache(async (id: string) => {
  if (!UUID.test(id) || !(await tablesReady())) return null
  const [h, c] = await Promise.all([headers(), cookies()])
  return publicChannel(id, { loggedIn: !!sessionFromRequest({ headers: h, cookies: c }) })
})

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const d = await load(id).catch(() => null)
  if (!d) return { title: { absolute: 'پخش زنده | بیلیارد هاب' }, robots: { index: false } }
  const title = `${d.channel.title} — ${d.channel.club.name} | پخش زنده بیلیارد هاب`
  return {
    title: { absolute: title },
    description: `پخش زنده و آرشیو ${d.channel.title} از ${d.channel.club.name} در بیلیارد هاب`,
    alternates: { canonical: `/live/c/${id}` },
  }
}

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await load(id)
  if (!d) notFound()
  const { channel: ch, archive, archiveLock } = d
  const clubHref = `/clubs/${ch.club.slug || ch.club.id}`

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-24 pt-6">
      <Link href="/live" className="inline-flex min-h-11 items-center gap-1 self-start text-sub text-ink-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
        <ArrowRight className="h-4 w-4" aria-hidden /> همه‌ی پخش‌های زنده
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-title text-ink">{ch.title}</h1>
        <p className="flex flex-wrap items-center gap-2 text-meta text-ink-3">
          <Building2 className="h-4 w-4" aria-hidden />
          <Link href={clubHref} className="rounded font-bold text-gold-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">{ch.club.name}</Link>
          <span aria-hidden>·</span> {KIND_LABEL[ch.kind]}{ch.tableLabel ? ` — ${ch.tableLabel}` : ''}
        </p>
      </header>

      <ChannelWatch channelId={ch.id} title={ch.title} initialLive={ch.isLive} />

      <section className="flex flex-col gap-3" aria-labelledby="archive-h">
        <h2 id="archive-h" className="text-section text-ink">آرشیو پخش‌ها</h2>
        {archiveLock === 'login' ? (
          <p className="rounded-card bg-ink/[.03] px-4 py-6 text-sub text-ink-3">
            ضبط‌های این کانال فقط برای کاربران عضو است{' '}
            <Link href={`/login?next=/live/c/${ch.id}`} className="rounded font-bold text-gold-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">ورود</Link>
          </p>
        ) : archiveLock === 'blocked'
          ? <p className="rounded-card bg-ink/[.03] px-4 py-6 text-sub text-ink-3">آرشیو این کانال در دسترس نیست</p>
          : <ArchiveList items={archive} />}
      </section>
    </main>
  )
}
