import type { ReactNode } from 'react'

/* ─────────────────────────────────────────────────────────────
   سربرگِ یکدستِ صفحه‌های پنلِ ادمین.

   پیش‌تر سه شکلِ متفاوت داشتیم (برچسبِ لاتین + عنوان، آیکن + عنوان + توضیحِ
   کنارِ هم، و فقط عنوان) و هر صفحه اندازه‌ی فونتِ خودش را. حالا:
     عنوان  ← text-3xl font-semibold (آیکنِ اختیاری کنارش)
     توضیح  ← text-sm زیرِ عنوان، با عرضِ خواندنی (adm-prose)
     دکمه‌ها ← سمتِ پایانِ خط؛ روی موبایل زیرِ عنوان می‌شکند (.adm-header)
   دکمه‌ی «بازگشت» این‌جا نیست: AdminBack در layout است و یکی بس است.
   ───────────────────────────────────────────────────────────── */

export function AdminHeader({ title, icon, description, actions }: {
  title: ReactNode
  icon?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="adm-header">
      <div>
        <h1 className="m-0 flex items-center gap-2 text-3xl font-semibold text-ink">
          {icon}
          {title}
        </h1>
        {description && <p className="adm-prose m-0 mt-2 text-sm leading-loose text-ink-2">{description}</p>}
      </div>
      {actions && <div className="adm-actions">{actions}</div>}
    </header>
  )
}
