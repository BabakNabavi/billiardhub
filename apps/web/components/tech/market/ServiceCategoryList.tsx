'use client'

/* ─────────────────────────────────────────────────────────────
   هشت دسته‌ی خدمت.

   ⚠️ شمار کنار هر دسته **واقعی** است: تعداد متخصصانی که دست‌کم
   یکی از خدمات آن دسته را ثبت کرده‌اند. اگر صفر بود، عدد اصلا
   نوشته نمی‌شود — «۰ متخصص» چهارده بار پشت هم، کاتالوگ را خراب
   نشان می‌دهد نه خالی.

   ⚠️ آیکون‌ها خطی lucide‌اند، نه تصویر تزئینی. `aria-hidden` چون
   نام دسته کنارشان نوشته است.
   ───────────────────────────────────────────────────────────── */

import {
  Wrench, CircleDot, Link as LinkIcon, Scale,
  Ruler, Layers, Truck, Grip,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { TECH_CATEGORIES, type TechCategoryIcon } from '@/lib/tech-categories'
import { toFaDigits } from '@/lib/jalali'
import { TINTS } from './category-tints'

const ICONS: Record<TechCategoryIcon, typeof Wrench> = {
  wrench: Wrench,
  'circle-dot': CircleDot,
  link: LinkIcon,
  scale: Scale,
  ruler: Ruler,
  layers: Layers,
  truck: Truck,
  grip: Grip,
}

export interface ServiceCategoryListProps {
  /** دسته‌ی انتخاب‌شده، یا `null` */
  active: string | null
  onPick: (id: string | null) => void
  /** شمار متخصص هر دسته — کلید: `TechCategory.id` */
  counts: ReadonlyMap<string, number>
}

/* ⚠️ باید داخلِ `<div className="tm">` سوار شود: تمامِ ظاهرِ کارت
   (گپ، پدینگ، گردی، هر دو اندازه‌ی قلم) در ios.css پشتِ `.tm …`
   است و market.css فقط اسکلتِ بی‌استایل را دارد. */
export function ServiceCategoryList({ active, onPick, counts }: ServiceCategoryListProps) {
  return (
    <ul className="tm-cats">
      {TECH_CATEGORIES.map(cat => {
        const Icon = ICONS[cat.icon]
        const tint = TINTS[cat.icon]
        const n = counts.get(cat.id) ?? 0
        const on = active === cat.id
        return (
          <li key={cat.id}>
            <button
              type="button"
              className="tm-cat"
              aria-pressed={on}
              onClick={() => onPick(on ? null : cat.id)}
              style={{ '--rgb': tint.rgb } as CSSProperties}
            >
              {/* درخشش بالای کارت — همان جزئیاتی که نوار «کاوش کن» دارد */}
              <span aria-hidden className="tm-cat-sheen" />
              <span aria-hidden className="tm-cat-ic">
                <Icon size={18} strokeWidth={1.8} color={tint.color} />
              </span>
              <span className="tm-cat-t">{cat.title}</span>
              {n > 0 && <span className="tm-cat-n">{toFaDigits(String(n))} متخصص</span>}
              {/* فلشِ پایینِ کارت — همان چیزی که در طرحِ مرجع هست.
                  دکمه نیست: خودِ کارت دکمه است و دکمه در دکمه نامعتبر
                  است. فقط نشانه‌ی بصریِ «برو». */}
              <span aria-hidden className="tm-cat-go">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
