'use client'

/* بسته‌های آگهی بیلیارد بازار.

   بدنه‌ی این صفحه به `components/advertise/AdPackages` منتقل شد تا
   «مرکز تبلیغات» (/advertise) هم بتواند همان را نشان دهد بدونِ اینکه
   دو نسخه‌ی موازی از همان کارت‌ها ساخته شود.

   خودِ مسیر عمداً حذف نشد: لینکش در چند جای سایت و احتمالاً در
   نشانی‌های ذخیره‌شده‌ی کاربران هست. */

import Link from 'next/link'
import { Package, Megaphone, ArrowLeft } from 'lucide-react'
import AdPackages from '../../components/advertise/AdPackages'

const INK = '#1C1B17', SEC = '#5B564B', MUT = '#8A8474', LINE = '#E7E2D6'
const GOLD_D = '#9A6E38'

export default function PlansPage() {
  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F7F5F0', color: INK, fontFamily: 'Vazirmatn,Tahoma,sans-serif' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '34px clamp(16px,3vw,28px) 80px' }}>

        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800,
            color: GOLD_D, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.28)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 14,
          }}>
            <Package size={15} /> بسته‌های آگهی
          </span>
          <h1 style={{ fontSize: 'clamp(22px,3.4vw,30px)', fontWeight: 900, margin: '0 0 10px' }}>
            بیشتر آگهی بگذارید، بیشتر دیده شوید
          </h1>
          <p style={{ fontSize: 14, color: SEC, lineHeight: 2, margin: 0, maxWidth: 560, marginInline: 'auto' }}>
            هر بسته یک سهمیه‌ی مشخص برای ثبت آگهی در بیلیارد بازار می‌دهد.
            بسته را انتخاب کنید، از درگاه پرداخت کنید، و بلافاصله فعال می‌شود.
          </p>
        </div>

        <AdPackages backTo="/plans" />

        {/* بنر تبلیغاتی چیز دیگری است — کاربر نباید بسته بخرد به امیدِ بنر */}
        <div style={{
          marginTop: 28, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '20px 22px',
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <Megaphone size={20} style={{ color: GOLD_D }} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 14.5, fontWeight: 900, marginBottom: 5 }}>تبلیغ در بیلیارد هاب</div>
            <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 2 }}>
              اگر به‌جای آگهی، دنبال بنر تبلیغاتی در صفحه‌ی اصلی یا بیلیارد بازار هستید،
              جایگاه‌ها را در مرکز تبلیغات ببینید و مستقیم بخرید.
            </p>
          </div>
          <Link href="/advertise" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D,
            borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 800,
          }}>
            مرکز تبلیغات <ArrowLeft size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
