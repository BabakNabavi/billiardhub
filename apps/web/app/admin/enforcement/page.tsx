'use client'

/* اعمالِ وضعیتِ حساب — فقط مالکِ پلتفرم.
   این صفحه خودش هیچ امنیتی نمی‌دهد: هر داده و هر اقدام از /api/owner/*
   می‌گذرد که مالک‌بودن را از دیتابیس می‌سنجد. غیرِمالک فقط پیامِ ۴۰۳ را
   می‌بیند. */

import { useState } from 'react'
import { Gavel } from 'lucide-react'
import { UserSearch, type UserRow } from '@/components/admin/enforcement/UserSearch'
import { UserCase } from '@/components/admin/enforcement/UserCase'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function EnforcementPage() {
  const [sel, setSel] = useState<UserRow | null>(null)
  const [tick, setTick] = useState(0)

  return (
    <main className="adm-page">
      <AdminHeader
        icon={<Gavel size={26} className="text-gold-text" aria-hidden />}
        title="اعمال وضعیت حساب"
        description="تعلیق، مسدودسازی، محدودسازی، حذف و بازگرداندن حساب‌ها، هر اقدام با دلیل و اقدام‌کننده در تاریخچه می‌ماند و پاک‌شدنی نیست" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <UserSearch selected={sel?.id ?? null} onSelect={setSel} refreshKey={tick} />
        <section aria-label="پرونده‌ی کاربر" className="min-w-0">
          {sel
            ? <UserCase key={sel.id} userId={sel.id} onChanged={() => setTick(t => t + 1)} />
            : <p className="m-0 rounded-card border border-dashed border-line/20 p-8 text-center text-sm text-ink-2">یک کاربر را از فهرست انتخاب کنید</p>}
        </section>
      </div>
    </main>
  )
}
