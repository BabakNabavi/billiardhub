/* ─────────────────────────────────────────────────────────────
   پیدا کردنِ لینک در متنِ آزادِ کاربر (کپشنِ استوری) — منطقِ خالص.

   سه شکل لینک حساب می‌شود، مثلِ اینستاگرام:
     · با پروتکل:      https://example.com/x
     · با www:          www.example.com
     · دامنه‌ی خالی:    instagram.com/babaknabavi
   فقط http/https ساخته می‌شود — `javascript:` و `data:` هرگز لینک نمی‌شوند،
   چون الگو اصلاً آن‌ها را نمی‌گیرد.

   نشانه‌گذاریِ ته‌ِ جمله («ببینید: site.com.» یا «(site.com)») جزوِ لینک نیست.
   لینکِ خودِ سایت (billiardhub.net) «داخلی» است و مسیرِ نسبی برمی‌گرداند تا
   در همان زبانه باز شود.
   ───────────────────────────────────────────────────────────── */

export type CaptionPart =
  | { kind: 'text'; text: string }
  | { kind: 'link'; href: string; label: string; internal: boolean }

const SITE_HOSTS = new Set(['billiardhub.net', 'www.billiardhub.net'])
const LABEL_MAX = 34

/* دامنه: برچسب‌های لاتین با نقطه، و پسوندِ دست‌کم دو حرفی. پیش از آن آغازِ
   متن یا نویسه‌ای که بخشی از واژه‌ی لاتین نیست — «a.b.com» وسطِ ایمیل یا
   شماره‌ی نسخه لینک نشود.
   ⚠️ بی‌lookbehind (`(?<!…)`): سافاریِ پیش از ۱۶٫۴ — آیفون‌های قدیمی — آن را
   نمی‌شناسد و *کلِ* چانکِ استوری با SyntaxError از کار می‌افتاد. نویسه‌ی پیشین
   در گروهِ ۱ گرفته می‌شود.
   مسیر جلوی نویسه‌ی فارسی می‌ایستد: «instagram.com/x،سلام» ⟵ فقط «…/x». */
const URL_RE = /(^|[^\w@./-])((?:https?:\/\/)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?::\d{2,5})?(?:[/?#][^\s؀-ۿ]*)?)/gi
const TRAIL = /[.,،؛;:!?؟)\]}»"'”’]+$/
/* نویسه‌های کنترلِ جهت — «evil.com/a‮gnp.exe» مسیر را وارونه نشان می‌داد */
const BIDI = /[‎‏‪-‮⁦-⁩]/g
/* دامنه‌ی بی‌پروتکل و بی‌www فقط با پسوندهای رایج — وگرنه «Mr.Smith» هم لینک می‌شد */
const BARE_TLDS = new Set(['com', 'net', 'org', 'ir', 'io', 'co', 'me', 'app', 'dev', 'info', 'shop', 'store', 'online',
  'site', 'link', 'tv', 'ai', 'xyz', 'biz', 'gg', 'ly', 'to', 'eu', 'uk', 'de', 'tr', 'ae', 'us', 'ca', 'fm', 'pro', 'blog', 'news'])

/** متن را به تکه‌های متن و لینک می‌شکند */
export function splitLinks(text: string): CaptionPart[] {
  const out: CaptionPart[] = []
  let last = 0
  for (const m of text.matchAll(URL_RE)) {
    let raw = m[2]!
    const start = m.index! + m[1]!.length
    /* بخشِ نامِ کاربریِ ایمیل («name.ir@gmail.com») لینک نیست */
    if (text[start + raw.length] === '@') continue
    /* نشانه‌گذاریِ ته حذف؛ پرانتزِ بسته فقط به تعدادِ بازهای درونِ لینک می‌ماند (ویکی‌پدیا) */
    const trail = raw.match(TRAIL)?.[0] ?? ''
    if (trail) {
      raw = raw.slice(0, -trail.length)
      let open = (raw.match(/\(/g) ?? []).length - (raw.match(/\)/g) ?? []).length
      for (const ch of trail) { if (ch !== ')' || open <= 0) break; raw += ch; open-- }
    }
    const link = toLink(raw)
    if (!link) continue
    if (start > last) out.push({ kind: 'text', text: text.slice(last, start) })
    out.push(link)
    last = start + raw.length
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out
}

function toLink(raw: string): Extract<CaptionPart, { kind: 'link' }> | null {
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  let u: URL
  try { u = new URL(withProto) } catch { return null }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  const host = u.hostname.toLowerCase()
  if (!/^(https?:\/\/|www\.)/i.test(raw) &&!BARE_TLDS.has(host.split('.').pop() ?? '')) return null
  if (SITE_HOSTS.has(host)) {
    /* ⚠️ اسلش‌های آغازین یکی می‌شوند: «billiardhub.net//evil.com» مسیرِ «//evil.com»
       می‌داد که مرورگر آن را نشانیِ *بیرونی* (بی‌پروتکل) می‌خواند — ریدایرکتِ باز */
    const path = `${u.pathname.replace(/^\/+/, '/')}${u.search}${u.hash}` || '/'
    return { kind: 'link', href: path, label: shorten(`billiardhub.net${path === '/' ? '' : path}`), internal: true }
  }
  const tail = `${u.pathname === '/' ? '' : u.pathname}${u.search}`
  return { kind: 'link', href: u.toString(), label: shorten(`${host.replace(/^www\./, '')}${safeDecode(tail).replace(BIDI, '')}`), internal: false }
}

function safeDecode(s: string): string {
  try { return decodeURIComponent(s) } catch { return s }
}

function shorten(s: string): string {
  return s.length > LABEL_MAX ? `${s.slice(0, LABEL_MAX - 1)}…` : s
}
