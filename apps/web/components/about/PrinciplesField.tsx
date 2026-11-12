import { IMG, type Img } from './imagery'
import { Photo } from './Photo'

/* ─────────────────────────────────────────────────────────────
   سه اصل — روی میدانِ سبزِ پارچه‌ی میز، تنها جایی که رنگ کلِ میدان را می‌گیرد.

   هر اصل یک ردیفِ تمام‌عرض با ترکیبِ خودش: واژه‌ی بزرگ به رنگِ فلزیِ آرام،
   یک جمله، و چهار تعهدِ مشخص که امروز روی پلتفرم واقعاً هست (نه شعار)؛ و
   تصویرِ خودش — دست دادن، برس کشیدنِ پارچه، لحظه‌ی بریک. ردیفِ میانی
   آینه‌ی دو ردیفِ دیگر است تا سه ردیف یکسان نباشند
   ───────────────────────────────────────────────────────────── */

type P = { word: string; line: string; items: string[]; img: Img }

const PRINCIPLES: P[] = [
  {
    word: 'پیوند', line: 'جامعه بیلیارد را کنار هم می‌آوریم', img: IMG.handshake,
    items: ['باشگاه، مربی، داور، فروشگاه و سازنده در یک جا', 'رزرو میز و ثبت‌نام مسابقه به‌صورت آنلاین', 'تماس مستقیم با هر پروفایل', 'پیام مستقیم میان اعضای جامعه'],
  },
  {
    word: 'حرفه‌ای‌گری', line: 'محیطی قابل اعتماد و ساختارمند می‌سازیم', img: IMG.brush,
    items: ['نشان تأیید باشگاه، مربی و داور فقط بعد از بررسی مدرک', 'داور بدون مدرک داوری ثبت نمی‌شود', 'هیچ آمار، نظر یا کاربر ساختگی', 'پرداخت از درگاه رسمی'],
  },
  {
    word: 'توسعه', line: 'از رشد و آینده این صنعت پشتیبانی می‌کنیم', img: IMG.break,
    items: ['ابزار مدیریت برای باشگاه و فروشگاه', 'رنکینگ و سابقه مسابقات بازیکنان', 'بیلیارد مدیا و پخش زنده', 'ساخته شده برای موبایل و اینترنت واقعی ایران'],
  },
]

export function PrinciplesField() {
  return (
    <section className="ab-field" aria-labelledby="ab-principles-h">
      <div className="ab-grid">
        <h2 id="ab-principles-h" className="ab-display ab-field-h ab-rise">سه اصل که کنار نمی‌گذاریم</h2>
      </div>
      <ol className="ab-prin-list">
        {PRINCIPLES.map((p, i) => (
          <li key={p.word} className={`ab-grid ab-prin ab-prin-${i + 1}`}>
            <h3 className="ab-prin-word ab-rise">{p.word}</h3>
            <div className="ab-prin-text ab-rise">
              <p className="ab-prin-line">{p.line}</p>
              <ul className="ab-prin-items">{p.items.map(t => <li key={t}>{t}</li>)}</ul>
            </div>
            <figure className="ab-prin-pic ab-curtain">
              <Photo img={p.img} sizes="(min-width: 1024px) 28vw, 90vw" />
            </figure>
          </li>
        ))}
      </ol>
    </section>
  )
}
