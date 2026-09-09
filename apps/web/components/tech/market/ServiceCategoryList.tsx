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

/* ⚠️ رنگ این‌جاست نه در `lib/tech-categories`: آن فایل منبعِ واحدِ
   *داده*ی دسته‌هاست و رنگ یک تصمیم نمایشی است. همان پالتِ نوار
   «کاوش کن» صفحه‌ی اصلی، تا این دو شبکه یکی دیده شوند. */
const TINTS: Record<TechCategoryIcon, { color: string; rgb: string }> = {
  wrench:        { color: '#4A9EFF', rgb: '74,158,255'  },
  'circle-dot':  { color: '#F472B6', rgb: '244,114,182' },
  link:          { color: '#B97BFF', rgb: '185,123,255' },
  scale:         { color: '#30C55A', rgb: '48,197,90'   },
  ruler:         { color: '#C7A66A', rgb: '199,166,106' },
  layers:        { color: '#06b6d4', rgb: '6,182,212'   },
  truck:         { color: '#fb923c', rgb: '251,146,60'  },
  grip:          { color: '#ef4444', rgb: '239,68,68'   },
}

export interface ServiceCategoryListProps {
  /** دسته‌ی انتخاب‌شده، یا `null` */
  active: string | null
  onPick: (id: string | null) => void
  /** شمار متخصص هر دسته — کلید: `TechCategory.id` */
  counts: ReadonlyMap<string, number>
}

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
                <Icon size={21} strokeWidth={1.8} color={tint.color} />
              </span>
              <span className="tm-cat-t">{cat.title}</span>
              {n > 0 && <span className="tm-cat-n">{toFaDigits(String(n))} متخصص</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
