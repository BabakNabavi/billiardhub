import Link from 'next/link'
import { isClosedSection } from '@/lib/nav-gates'
import { IMG, type Img } from './imagery'
import { Photo } from './Photo'

/* ─────────────────────────────────────────────────────────────
   اکوسیستم — هشت نقش مثلِ چاپ‌هایی روی دیوارِ گالری.

   هر نقش اندازه، نسبت و جای خودش را دارد (۱۶:۱۰، ۴:۵، ۱:۱ با جابه‌جاییِ
   عمودی) — همه در about.css با کلاسِ .ab-role-<کلید> — نه هشت کاشیِ یکسان.
   هیچ تصویری روی زیرنویسِ دیگری نمی‌افتد (فاصله با padding، نه margin منفی).
   فهرستِ نقش‌ها role=list با display: contents است تا هر نقش مستقیم در گریدِ
   دیوار بنشیند. هر تصویر لینکِ واقعیِ همان
   بخش است و alt خالی دارد، چون نامِ لینک را h3 می‌گوید. «بازیکنان» بسته است
   (lib/nav-gates) پس به رنکینگ می‌رود
   ───────────────────────────────────────────────────────────── */

type Role = { k: string; img: Img; name: string; href: string; line: string; sizes: string }

const WIDE = '(min-width: 1024px) 52vw, 92vw'
const TALL = '(min-width: 1024px) 30vw, 70vw'
const SMALL = '(min-width: 1024px) 24vw, 62vw'

const ROLES: Role[] = [
  { k: 'clubs', img: IMG.clubs, name: 'باشگاه‌ها', href: '/clubs', line: 'ساعت کاری، میزها و رزرو آنلاین میز', sizes: WIDE },
  { k: 'players', img: IMG.players, name: 'بازیکنان', href: '/players', line: 'پروفایل، سابقه مسابقات و جایگاه در رنکینگ', sizes: TALL },
  { k: 'coaches', img: IMG.coaches, name: 'مربیان', href: '/coaches', line: 'مربیان با سطح و سابقه برای آموزش حرفه‌ای', sizes: TALL },
  { k: 'referees', img: IMG.referees, name: 'داوران', href: '/referees', line: 'داوری که مدرکش بررسی شده، نه فقط ادعا', sizes: SMALL },
  { k: 'sellers', img: IMG.sellers, name: 'فروشگاه‌ها', href: '/sellers', line: 'فروشگاه‌های تخصصی با محصولات و تماس مستقیم', sizes: SMALL },
  { k: 'manufacturers', img: IMG.manufacturers, name: 'تولیدکنندگان', href: '/manufacturers', line: 'سازندگان میز و تجهیزات با محصولات و گواهینامه', sizes: TALL },
  { k: 'tournaments', img: IMG.tournaments, name: 'مسابقات', href: '/tournaments', line: 'ثبت‌نام آنلاین، جدول و نتایج', sizes: WIDE },
  { k: 'services', img: IMG.services, name: 'خدمات فنی', href: '/services', line: 'نصب، تعمیر و نگهداری میز و تجهیزات', sizes: WIDE },
]

export function RolesPass() {
  return (
    <section className="ab-roles" aria-labelledby="ab-roles-h">
      <div className="ab-grid">
        <h2 id="ab-roles-h" className="ab-display ab-roles-h ab-rise">یک جامعه، هشت نقش</h2>
        <div className="ab-wall">
          <div role="list" className="contents">
            {ROLES.map(r => {
              const closed = isClosedSection(r.href)
              return (
                <div role="listitem" key={r.k} className={`ab-role ab-role-${r.k}`}>
                  <Link href={closed ? '/ranking' : r.href} prefetch={false} className="ab-role-link">
                    <div className="ab-role-pic ab-curtain">
                      <Photo img={r.img} sizes={r.sizes} className="ab-zoom" alt="" />
                    </div>
                    <h3 className="ab-role-name">{r.name}</h3>
                    <p className="ab-role-line">{closed ? 'جایگاه بازیکنان در رنکینگ' : r.line}</p>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
