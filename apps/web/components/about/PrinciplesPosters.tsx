/* ─────────────────────────────────────────────────────────────
   سه اصل — سه پوستر روی صحنه‌ی زغالی.

   هر اصل یک واژه‌ی بسیار بزرگ است که با عکسِ خودش پر شده (background-clip: text):
   «پیوند» با دو دستی که به هم داده شده‌اند، «حرفه‌ای‌گری» با پارچه‌ای که برس می‌خورد،
   «توسعه» با لحظه‌ی بریک. هر پوستر ترکیبِ خودش را دارد (واژه در شروع، در پایان،
   در مرکز). مرورگری که background-clip: text ندارد واژه را به رنگِ فلزی نشان
   می‌دهد. متن‌ها تعهدهای مشخصی‌اند که امروز روی پلتفرم هست، نه شعار
   ───────────────────────────────────────────────────────────── */

const PRINCIPLES = [
  {
    word: 'پیوند', line: 'جامعه بیلیارد را کنار هم می‌آوریم',
    items: ['باشگاه، مربی، داور، فروشگاه و سازنده در یک جا', 'رزرو میز و ثبت‌نام مسابقه به‌صورت آنلاین', 'تماس و پیام مستقیم میان اعضای جامعه'],
  },
  {
    word: 'حرفه‌ای‌گری', line: 'محیطی قابل اعتماد و ساختارمند می‌سازیم',
    items: ['نشان تأیید باشگاه، مربی و داور فقط بعد از بررسی مدرک', 'هیچ آمار، نظر یا کاربر ساختگی', 'پرداخت از درگاه رسمی'],
  },
  {
    word: 'توسعه', line: 'از رشد و آینده این صنعت پشتیبانی می‌کنیم',
    items: ['ابزار مدیریت برای باشگاه و فروشگاه', 'رنکینگ، بیلیارد مدیا و پخش زنده', 'ساخته شده برای موبایل و اینترنت واقعی ایران'],
  },
]

export function PrinciplesPosters() {
  return (
    <section className="ab-posters" aria-labelledby="ab-principles-h">
      <div className="ab-grid">
        <h2 id="ab-principles-h" className="ab-display ab-posters-h ab-rise">سه اصل که کنار نمی‌گذاریم</h2>
      </div>
      <ol className="ab-poster-list">
        {PRINCIPLES.map((p, i) => (
          <li key={p.word} className={`ab-grid ab-poster ab-poster-${i + 1}`}>
            <h3 className="ab-poster-word">{p.word}</h3>
            <div className="ab-poster-text ab-rise">
              <p className="ab-poster-line">{p.line}</p>
              <ul className="ab-poster-items">{p.items.map(t => <li key={t}>{t}</li>)}</ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
