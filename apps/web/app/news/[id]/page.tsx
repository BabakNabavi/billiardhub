/* ─────────────────────────────────────────────────────────────
   صفحه‌ی خبر.

   ── چه چیزی عوض شد ──
   ⚠️ نسخه‌ی قبل کلاینتی بود و برای نشان‌دادنِ *یک* خبر، **کلِ فهرستِ
   اخبار** را از `/api/news` می‌گرفت و بینشان می‌گشت. یعنی متنِ خبر
   در HTML نبود (بد برای گوگل و برای اولین نمایش) و هر بازدید تا
   ۲۰۰ ردیف داده جابه‌جا می‌کرد. حالا یک پرس‌وجوی نقطه‌ای روی سرور.

   ⚠️ عرضِ متن مهار شده است. خطِ خیلی بلند چشم را در بازگشت به سرِ
   خط گم می‌کند؛ برای فارسی هم همان قاعده‌ی ۶۰–۷۵ نویسه برقرار است.
   ───────────────────────────────────────────────────────────── */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArticle, listPublished, related } from '@/lib/news/server'
import { sectionLabel, sectionOf } from '@/lib/news/sections'
import { dateOf, iso, readTime, rank } from '@/lib/news/format'
import { absoluteUrl } from '@/lib/site-url'
import ArticleTools from '@/components/news/ArticleTools'
import NavOffset from '@/components/news/NavOffset'
import { Cover, Meta, Kicker } from '@/components/news/bits'
import '../newsroom.css'

export const revalidate = 60

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  /* ⚠️ Next خودش پارامترِ مسیر را رمزگشایی کرده. رمزگشاییِ دوم روی
     هر نشانیِ حاویِ «%»ِ تنها (مثلاً /news/50%-off یا کاوشِ یک
     خزنده) URIError پرتاب می‌کند — و چون پیش از notFound اتفاق
     می‌افتد، بازدیدکننده ۵۰۰ می‌گیرد نه صفحه‌ی «پیدا نشد». */
  const a = await getArticle(id)
  if (!a) notFound()

  const all = await listPublished()
  const sameSection = all
    .filter(x => x.id !== a.id && x.section && x.section === a.section)
    .slice(0, 5)
  /* ⚠️ «بیشتر از این بخش» در ستونِ کناری همان خبرهای هم‌بخش را
     نشان می‌دهد؛ بدونِ این کنارگذاری، «خبرهای مرتبط» دقیقاً همان
     چهار تیتر را دوباره تکرار می‌کرد. */
  const shown = new Set(sameSection.map(x => x.id))
  const rel = related(a, all.filter(x => !shown.has(x.id)))
  const mostRead = all.filter(x => x.views > 0 && x.id !== a.id)
    .sort((x, y) => y.views - x.views).slice(0, 5)
  const url = absoluteUrl(`/news/${encodeURIComponent(a.id)}`)
  const sec = sectionOf(a.section)

  /* ⚠️ اسکیما فقط فیلدهایی را می‌گیرد که واقعاً داریم. `author` را
     وقتی نمی‌دانیم چه کسی نوشته، جعل نمی‌کنیم — گوگل نبودِ فیلد را
     می‌بخشد، دادهٔ ساختگی را نه. */
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    ...(a.excerpt ? { description: a.excerpt } : {}),
    ...(a.cover ? { image: [a.cover] } : {}),
    ...(a.ts ? { datePublished: iso(a.ts) } : {}),
    ...(a.updatedTs ? { dateModified: iso(a.updatedTs) } : {}),
    ...(a.author ? { author: [{ '@type': 'Person', name: a.author }] } : {}),
    ...(sec ? { articleSection: sec.label } : {}),
    publisher: { '@type': 'Organization', name: 'بیلیارد هاب' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: 'fa-IR',
  }

  return (
    <div className="nr">
      <NavOffset />
      <script type="application/ld+json"
        /* ⚠️ «<» فرار داده می‌شود: یک «</script>» داخلِ عنوان یا
           نشانیِ عکس از تگ بیرون می‌زد. */
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />

      <article className="nr-shell nr-article">
        <nav className="nr-crumb" aria-label="مسیر">
          <ol>
            <li><Link href="/">خانه</Link></li>
            <li><Link href="/news">اخبار</Link></li>
            {sec && <li><Link href={`/news?s=${sec.key}`}>{sec.label}</Link></li>}
          </ol>
        </nav>

        <header className="nr-art-head">
          <Kicker a={a} urgent={a.breaking} />
          <h1>{a.title}</h1>
          {a.excerpt && <p className="nr-standfirst">{a.excerpt}</p>}

          <div className="nr-byline">
            {/* ⚠️ اگر نویسنده به کاربری وصل نباشد، خطِ نویسنده اصلاً
                نمی‌آید. نامِ جای‌گیر همان داده‌ی جعلی است. */}
            {a.author && <span className="nr-author">{a.author}</span>}
            <div className="nr-meta">
              {a.ts > 0 && <span><time dateTime={iso(a.ts)}>{dateOf(a.ts)}</time></span>}
              {a.updatedTs && (
                <span>
                  به‌روزرسانی <time dateTime={iso(a.updatedTs)}>{dateOf(a.updatedTs)}</time>
                </span>
              )}
              {a.readMinutes > 0 && <span>{readTime(a.readMinutes)}</span>}
              {a.exclusive && <span className="nr-flag nr-flag--gold">اختصاصی</span>}
            </div>
          </div>
        </header>

        {a.cover && (
          <figure className="nr-art-fig">
            <Cover a={a} ratio="16x9" priority sizes="(min-width: 1100px) 760px, 100vw" />
          </figure>
        )}

        <div className="nr-art-grid">
          <div>
            <ArticleTools id={a.id} title={a.title} url={url} />

            {a.body.length > 0 ? (
              <div className="nr-body" id="nr-body">
                {a.body.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            ) : (
              /* ⚠️ خبری که فقط تیتر و چکیده دارد واقعاً همین است؛
                 متنِ ساختگی جایش نمی‌گذاریم. */
              <p className="nr-nobody">متن کامل این خبر هنوز منتشر نشده است.</p>
            )}

            {a.tags.length > 0 && (
              <div className="nr-tags">
                {a.tags.map(t => (
                  <Link key={t} href={`/news?q=${encodeURIComponent(t)}`} className="nr-tag">{t}</Link>
                ))}
              </div>
            )}
          </div>

          <aside className="nr-aside">
            {mostRead.length > 0 && (
              <section aria-labelledby="nr-a-mr">
                <div className="nr-blockhd"><h2 id="nr-a-mr">پربازدیدترین‌ها</h2></div>
                <ol className="nr-ranked">
                  {mostRead.map((x, i) => (
                    <li key={x.id}>
                      <Link href={`/news/${encodeURIComponent(x.id)}`}>
                        <span className="nr-rank" aria-hidden>{rank(i)}</span>
                        {/* ⚠️ div نه span: تیتر و بلوکِ متادیتا محتوای جریانی‌اند و داخلِ span معتبر نیستند */}
                        <div><h3>{x.title}</h3><Meta a={x} /></div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {sameSection.length > 0 && sec && (
              <section aria-labelledby="nr-a-sec">
                <div className="nr-blockhd nr-blockhd--thin">
                  <h2 id="nr-a-sec">بیشتر از {sec.label}</h2>
                  <Link className="nr-more" href={`/news?s=${sec.key}`}>مشاهده همه</Link>
                </div>
                <ul className="nr-stream">
                  {sameSection.map(x => (
                    <li key={x.id}>
                      <Link href={`/news/${encodeURIComponent(x.id)}`}>
                        <time dateTime={iso(x.ts)}>{dateOf(x.ts)}</time>
                        <span className="nr-stream-t">{x.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </article>

      {rel.length > 0 && (
        <section className="nr-band nr-band--tint" aria-labelledby="nr-rel">
          <div className="nr-shell">
            <div className="nr-blockhd"><h2 id="nr-rel">خبرهای مرتبط</h2></div>
            <ul className="nr-results">
              {rel.map(x => (
                <li key={x.id}>
                  <Link href={`/news/${encodeURIComponent(x.id)}`} className={x.cover ? undefined : 'nr-noimg'}>
                    <div>
                      <span className="nr-kicker">{sectionLabel(x.section)}</span>
                      <h3>{x.title}</h3>
                      <Meta a={x} />
                    </div>
                    <Cover a={x} ratio="3x2" sizes="(min-width: 760px) 220px, 128px" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
