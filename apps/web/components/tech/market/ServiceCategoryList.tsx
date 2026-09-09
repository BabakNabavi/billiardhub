'use client'

/* ─────────────────────────────────────────────────────────────
   هشت دسته‌ی خدمت.

   ⚠️ شمارِ کنارِ هر دسته **واقعی** است: تعدادِ متخصصانی که دستِ‌کم
   یکی از خدماتِ آن دسته را ثبت کرده‌اند. اگر صفر بود، عدد اصلاً
   نوشته نمی‌شود — «۰ متخصص» چهارده بار پشتِ هم، کاتالوگ را خراب
   نشان می‌دهد نه خالی.

   ⚠️ آیکون‌ها خطیِ lucide‌اند، نه تصویرِ تزئینی. `aria-hidden` چون
   نامِ دسته کنارشان نوشته است.
   ───────────────────────────────────────────────────────────── */

import {
  Wrench, CircleDot, Link as LinkIcon, Scale,
  Ruler, Layers, Truck, Grip,
} from 'lucide-react'
import { TECH_CATEGORIES, type TechCategoryIcon } from '@/lib/tech-categories'
import { toFaDigits } from '@/lib/jalali'

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
  /** شمارِ متخصصِ هر دسته — کلید: `TechCategory.id` */
  counts: ReadonlyMap<string, number>
}

export function ServiceCategoryList({ active, onPick, counts }: ServiceCategoryListProps) {
  return (
    <ul className="tm-cats">
      {TECH_CATEGORIES.map(cat => {
        const Icon = ICONS[cat.icon]
        const n = counts.get(cat.id) ?? 0
        const on = active === cat.id
        return (
          <li key={cat.id}>
            <button
              type="button"
              className="tm-cat"
              aria-pressed={on}
              onClick={() => onPick(on ? null : cat.id)}
            >
              <Icon size={22} strokeWidth={1.6} aria-hidden />
              <span>{cat.title}</span>
              {n > 0 && <span className="tm-cat-n">{toFaDigits(String(n))} متخصص</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
