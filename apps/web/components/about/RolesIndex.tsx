'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { isClosedSection } from '@/lib/nav-gates'
import { IMG, type Img } from './imagery'
import { Photo } from './Photo'

/* ─────────────────────────────────────────────────────────────
   اکوسیستم — «فهرستِ هشت دنیا با یک صحنه‌ی تصویر».

   نام‌ها با حروفِ بزرگ زیرِ هم؛ صحنه‌ی تصویر کنارشان ثابت می‌ماند و با هر نامی
   که به مرکزِ صفحه می‌رسد (یا نشانگر/فوکوس رویش می‌رود) تصویرِ همان دنیا با پرده‌ای
   از پایین جای قبلی را می‌گیرد. در موبایل صحنه بالای فهرست می‌چسبد.
   هر نام لینکِ واقعیِ همان بخش است؛ «بازیکنان» بسته است (lib/nav-gates) پس به
   رنکینگ می‌رود. صحنه تزئینی است (aria-hidden): نام و توضیح در خودِ لینک‌اند.
   زیرِ ۱۰۲۴ صحنه‌ی ثابت نیست؛ هر نقش تصویرِ تمام‌عرضِ خودش را دارد (ab-idx-thumb)
   ───────────────────────────────────────────────────────────── */

type Role = { k: string; img: Img; name: string; href: string; line: string }

const ROLES: Role[] = [
  { k: 'clubs', img: IMG.clubs, name: 'باشگاه‌ها', href: '/clubs', line: 'ساعت کاری، میزها و رزرو آنلاین میز' },
  { k: 'players', img: IMG.players, name: 'بازیکنان', href: '/players', line: 'پروفایل، سابقه مسابقات و جایگاه در رنکینگ' },
  { k: 'coaches', img: IMG.coaches, name: 'مربیان', href: '/coaches', line: 'مربیان با سطح و سابقه برای آموزش حرفه‌ای' },
  { k: 'referees', img: IMG.referees, name: 'داوران', href: '/referees', line: 'داوری که مدرکش بررسی شده، نه فقط ادعا' },
  { k: 'sellers', img: IMG.sellers, name: 'فروشگاه‌ها', href: '/sellers', line: 'فروشگاه‌های تخصصی با محصولات و تماس مستقیم' },
  { k: 'manufacturers', img: IMG.manufacturers, name: 'تولیدکنندگان', href: '/manufacturers', line: 'سازندگان میز و تجهیزات با محصولات و گواهینامه' },
  { k: 'services', img: IMG.services, name: 'خدمات فنی', href: '/services', line: 'نصب، تعمیر و نگهداری میز و تجهیزات' },
  { k: 'tournaments', img: IMG.tournaments, name: 'مسابقات', href: '/tournaments', line: 'ثبت‌نام آنلاین، جدول و نتایج' },
]

export function RolesIndex() {
  const [on, setOn] = useState(0)
  const [was, setWas] = useState(-1)
  const items = useRef<(HTMLLIElement | null)[]>([])
  const onRef = useRef(0)

  const activate = (i: number) => {
    if (i === onRef.current) return
    setWas(onRef.current); setOn(i); onRef.current = i
  }

  useEffect(() => {
    /* نامی که از نوارِ میانیِ صفحه می‌گذرد فعال می‌شود — فقط دسکتاپ، جایی که صحنه هست */
    if (!window.matchMedia('(min-width: 1024px)').matches) return
    const io = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (en.isIntersecting) activate(Number((en.target as HTMLElement).dataset.i))
      }
    }, { rootMargin: '-46% 0px -46% 0px' })
    items.current.forEach(el => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section className="ab-idx" aria-labelledby="ab-idx-h">
      <div className="ab-grid ab-idx-head">
        <h2 id="ab-idx-h" className="ab-display">یک جامعه، هشت دنیا</h2>
        <p className="ab-lead">هر نقش صفحه خودش را دارد و همه در یک جا همدیگر را پیدا می‌کنند</p>
      </div>
      <div className="ab-grid ab-idx-body">
        <div className="ab-idx-stage" aria-hidden>
          {ROLES.map((r, i) => (
            <div key={r.k} className={`ab-idx-shot ab-shot-${r.k}${i === on ? ' is-on' : i === was ? ' was-on' : ''}`}>
              <Photo img={r.img} sizes="(min-width: 1024px) 46vw, 100vw" alt="" />
            </div>
          ))}
        </div>
        <ol className="ab-idx-list">
          {ROLES.map((r, i) => {
            const closed = isClosedSection(r.href)
            return (
              <li key={r.k} data-i={i} ref={el => { items.current[i] = el }} className={i === on ? 'is-on' : ''}>
                <Link href={closed ? '/ranking' : r.href} prefetch={false} className="ab-idx-link"
                  onMouseEnter={() => activate(i)} onFocus={() => activate(i)}>
                  {/* موبایل و تبلت: هر نقش تصویرِ خودش را تمام‌عرض دارد (صحنه‌ی ثابت آن‌جا روی آیتم می‌افتاد) */}
                  <span className={`ab-idx-thumb ab-shot-${r.k}`} aria-hidden><Photo img={r.img} sizes="100vw" alt="" /></span>
                  <h3 className="ab-idx-name">{r.name}</h3>
                  <span className="ab-idx-line">{closed ? 'جایگاه بازیکنان در رنکینگ' : r.line}</span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
