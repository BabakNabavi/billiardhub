import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { buttonClasses } from '@/components/ui/button-classes'
import { CoachRequestForm } from '@/components/coach/CoachRequestForm'
import { loadPublicProfile } from '@/lib/profiles/public-detail'
import { DISCIPLINES, disciplineLabel, type CoachProfile } from '@/lib/coach-store'
import { thumbUrl } from '@/lib/media/thumb'
import { faNum } from '@/lib/jalali'

/* ─────────────────────────────────────────────────────────────
   درخواستِ کلاس یا مشاوره از مربی — آذرِ ۱۴۰۵.

   جای فرمِ قدیمیِ «درخواست جلسه» (تاریخ و ساعت از شاگرد) را گرفت: شاگرد
   درخواست می‌فرستد و مربی با پیامک خبردار می‌شود و تماس می‌گیرد
   (api/coach/requests). همان خواندنِ کش‌شده‌ی صفحه‌ی پروفایل — فقط
   پروفایلِ تأییدشده؛ به فرمِ کلاینت فقط نام و رشته‌ها می‌رود، نه ردیف.

   noindex: صفحه‌ی فرم است و محتوای تازه‌ای برای جست‌وجو ندارد.
   ───────────────────────────────────────────────────────────── */

type Params = { params: Promise<{ id: string }> }

const nameOf = (d: CoachProfile, slug: string) => `${d.firstNameFa ?? ''} ${d.lastNameFa ?? ''}`.trim() || slug

/* پروفایلِ نمایشی صاحبی ندارد که درخواست بگیرد — مثلِ «پیدا نشد» */
async function loadCoach(id: string) {
  const p = await loadPublicProfile<CoachProfile>('coach', id)
  return p && !p.isDemo ? p : null
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const p = await loadCoach(id)
  /* `absolute`، همان قالبِ layoutِ پروفایل (lib/seo/profile-seo) — عنوانِ سادهِ صفحه‌ی
     فرزند پسوندِ سایت را از دست می‌داد. canonical از نامکِ خودِ ردیف: پارامترِ مسیر
     برای نامکِ فارسی ممکن است دوبار کدگذاری شده باشد */
  return {
    title: { absolute: `درخواست کلاس از ${p ? nameOf(p.data, p.slug) : 'مربی'} | بیلیارد هاب` },
    robots: { index: false, follow: true },
    alternates: { canonical: `/coaches/${encodeURIComponent(p?.slug ?? id)}/request` },
  }
}

/* عکسِ پروفایل گاهی data URL است (پروفایل‌های قدیمی) و در HTML و پراپ دو بار
   می‌نشست؛ نسخه‌ی کوچک از سرویسِ عکس، و data URLِ بزرگ ⟵ آدمک */
function avatarSrc(src: string | undefined): string {
  const s = String(src ?? '')
  if (/^https?:/.test(s)) return thumbUrl(s, 128, 70)
  return s.startsWith('data:') && s.length < 40_000 ? s : ''
}

export default async function CoachRequestPage({ params }: Params) {
  const { id } = await params
  const p = await loadCoach(id)

  if (!p) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-12">
        <h1 className="text-3xl font-semibold text-ink">درخواست کلاس از مربی</h1>
        <p className="mt-4 text-sm text-ink-2">این مربی پیدا نشد یا پروفایلش هنوز تأیید نشده است</p>
        <Link href="/coaches" className={buttonClasses({ variant: 'secondary', className: 'mt-6' })}>فهرست مربیان</Link>
      </div>
    )
  }

  const d = p.data
  const name = nameOf(d, p.slug)
  const back = `/coaches/${encodeURIComponent(p.slug)}`
  const disciplines = (d.disciplines ?? [])
    .filter(k => DISCIPLINES.some(x => x.key === k))
    .map(k => ({ key: k, label: disciplineLabel(k) }))
  const price = Number(p.sessionPrice ?? 0)

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-6">
      <Link href={back}
        className="inline-flex min-h-11 items-center gap-2 rounded-field text-sm font-semibold text-ink-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
        {/* فلشِ «بازگشت» در راست‌به‌چپ به راست است */}
        <ArrowRight size={16} aria-hidden />بازگشت به پروفایل
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <Avatar src={avatarSrc(d.photo)} alt={`عکس ${name}`} size={48} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="text-xs text-ink-3">مربی{d.city ? ` · ${d.city}` : ''}</p>
        </div>
      </div>

      <h1 className="mt-6 text-3xl font-semibold text-ink">درخواست کلاس یا مشاوره</h1>
      <p className="mt-2 text-sm text-ink-2">
        درخواستتان را بفرستید، {name} برای هماهنگی روز، ساعت و محل کلاس با شما تماس می‌گیرد
      </p>

      <CoachRequestForm coachSlug={p.slug} coachName={name} disciplines={disciplines} />

      <section aria-labelledby="cr-how" className="mt-8 rounded-card border border-line/10 bg-surface p-4">
        <h2 id="cr-how" className="text-sm font-semibold text-ink">بعد از ارسال چه می‌شود</h2>
        <ol className="mt-3 list-inside space-y-2 text-sm text-ink-2 [list-style-type:persian]">
          <li>درخواست شما همراه با شماره موبایلتان با پیامک برای مربی فرستاده می‌شود</li>
          <li>مربی برای هماهنگی روز، ساعت و محل کلاس با شما تماس می‌گیرد</li>
          <li>
            {price > 0 ? `هزینه هر جلسه ${faNum(price)} تومان است و ` : 'هزینه کلاس را با مربی توافق می‌کنید و '}
            پرداخت حضوری است، نه از طریق سایت
          </li>
        </ol>
      </section>
    </div>
  )
}
