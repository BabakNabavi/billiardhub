/* ─────────────────────────────────────────────────────────────
   سه اصلِ بیلیارد هاب — روی «ریلِ» میز، نه سه کارتِ شماره‌دار.

   نشانه‌ی هر اصل همان خالِ لوزیِ لبه‌ی میز است (diamond sight)، که بازیکن
   با آن مسیرِ ضربه را اندازه می‌گیرد: نشانگرِ اندازه‌گیری، نه تزئین.
   هر ردیف با یک خطِ ریل باز می‌شود که هنگامِ دیده‌شدن کشیده می‌شود
   ───────────────────────────────────────────────────────────── */

const PRINCIPLES = [
  {
    title: 'پیوند',
    lead: 'جامعه بیلیارد را کنار هم می‌آوریم',
    text: 'بازیکن، باشگاه، مربی، داور، فروشگاه و متخصص فنی در یک جا همدیگر را پیدا می‌کنند و مستقیم با هم در تماس‌اند',
  },
  {
    title: 'حرفه‌ای‌گری',
    lead: 'محیطی قابل اعتماد و ساختارمند می‌سازیم',
    text: 'نشان تأیید باشگاه، مربی و داور فقط بعد از بررسی مدرک داده می‌شود و هیچ آمار، نظر یا کاربر ساختگی روی پلتفرم نمی‌آید',
  },
  {
    title: 'توسعه',
    lead: 'از رشد و آینده این صنعت پشتیبانی می‌کنیم',
    text: 'ابزار دیجیتال برای کسب‌وکارهای بیلیارد، ساخته شده برای موبایل و اینترنت واقعی کاربران ایرانی، تا این ورزش حرفه‌ای‌تر دیده و اداره شود',
  },
]

export function Principles() {
  return (
    <ol className="flex flex-col">
      {PRINCIPLES.map(p => (
        <li key={p.title} className="ab-rail-row grid gap-4 py-8 lg:grid-cols-12 lg:gap-12 lg:py-12">
          <span aria-hidden className="ab-rail" />
          <span aria-hidden className="ab-rail-sight" />
          <h3 className="ab-principle text-display lg:col-span-4">{p.title}</h3>
          <div className="flex flex-col gap-2 lg:col-span-8">
            <p className="text-body font-bold text-ink">{p.lead}</p>
            <p className="max-w-prose text-body text-ink-2">{p.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
