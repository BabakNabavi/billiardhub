/* ─────────────────────────────────────────────────────────────
   لایه‌ی مشترک پنل ادمین — استایل یکدست کنترل‌ها.
   همه‌ی <select>های ساده‌ی بخش ادمین این‌جا یک‌جا پریمیوم
   می‌شوند: بدون ظاهر بومی، شورون طلایی، رینگ فوکس برند.
   ───────────────────────────────────────────────────────────── */

import type { Metadata } from 'next';
import AdminBack from '../../components/admin/AdminBack';

/* پنل مدیریت هرگز نباید ایندکس شود */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-scope">
      <style>{`
        /* ── حاشیه‌ی افقیِ مشترک ──
           تا امروز این لایه هیچ padding افقی نداشت و هر صفحه خودش باید
           فکرش را می‌کرد. صفحه‌هایی مثل «مسابقات باشگاه‌ها» فقط
           \`maxWidth\` داشتند، پس روی موبایل کارت‌ها کاملاً به لبه‌ی چپ و
           راست می‌چسبیدند. یک‌بار این‌جا حل می‌شود تا صفحه‌های آینده هم
           خودبه‌خود درست باشند.

           \`box-sizing\` لازم است وگرنه صفحه‌هایی که \`width:100%\` دارند
           با اضافه‌شدنِ padding از عرضِ صفحه بیرون می‌زنند. */
        .admin-scope { padding-inline: clamp(14px, 4vw, 28px); box-sizing: border-box; }
        .admin-scope * { box-sizing: border-box; }
        /* صفحه‌های ادمین خودشان \`margin: 0 auto\` دارند؛ این فقط فضای
           تنفس کنارِ آن است و وسط‌چینی را خراب نمی‌کند. */
        @media (max-width: 480px) {
          .admin-scope { padding-inline: 14px; }
          /* جدول‌ها و نوارهای عریض داخلِ خودشان اسکرول شوند، نه کلِ صفحه */
          .admin-scope table { display: block; overflow-x: auto; max-width: 100%; }
        }

        /* ══ هدفِ لمس روی موبایل ══
           اندازه‌گیری نشان داد در هر صفحه ده‌ها دکمه‌ی زیرِ ۳۶ پیکسل
           هست و کوچک‌ترینشان ۱۱ پیکسل — یعنی آیکن‌های عملیاتِ جدول‌ها.
           راهنمای دسترس‌پذیری ۴۴ می‌گوید؛ ۴۰ سازشِ معقولی است که
           چیدمانِ فعلی را هم به‌هم نمی‌ریزد.

           عمداً از has() استفاده نمی‌شود تا روی مرورگرهای قدیمی‌تر هم
           کار کند؛ min-height و min-width ذاتاً امن‌اند.
           (این بلوک داخلِ template literal است — بک‌تیک ممنوع.) */
        @media (max-width: 700px) {
          .admin-scope button,
          .admin-scope a[role="button"] {
            min-height: 40px;
            min-width: 40px;
          }
          /* دکمه‌ی آیکنیِ داخلِ ردیف‌ها معمولاً padding کمی دارد */
          .admin-scope button > svg:only-child { display: block; margin: auto; }

          /* ══ ریتمِ عمودی ══
             کارت‌ها و ردیف‌ها بدونِ فاصله روی هم می‌نشستند. این قاعده
             فقط به فرزندانِ *مستقیمِ* ریشه‌ی صفحه فاصله می‌دهد، نه به
             هر عنصری — پس چیدمان‌های داخلی دست‌نخورده می‌مانند. */
          .admin-scope > div > * + * { margin-top: 12px; }

          /* جدولِ عریض داخلِ خودش بلغزد، نه کلِ صفحه */
          .admin-scope table { display: block; overflow-x: auto; max-width: 100%; }
        }

        /* حاشیه‌ی امن روی همه‌ی اندازه‌ها — کمینه‌ی مطلق ۱۴ پیکسل */
        .admin-scope select,
        .admin-scope input,
        .admin-scope textarea { max-width: 100%; }

        .admin-back-btn:hover { border-color: rgba(199,166,106,0.55) !important; color: #9A6E38 !important; }

        .admin-scope select {
          appearance: none; -webkit-appearance: none; -moz-appearance: none;
          background-color: #fff;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239A6E38' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: left 12px center;
          background-size: 14px;
          border: 1px solid #E7E2D6 !important;
          border-radius: 11px !important;
          padding: 9px 14px !important;
          padding-left: 36px !important;
          font-family: inherit; font-size: 13px; font-weight: 600; color: #1C1B17;
          cursor: pointer;
          transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
        }
        .admin-scope select:hover { border-color: rgba(199,166,106,0.5) !important; }
        .admin-scope select:focus {
          outline: none;
          border-color: rgba(199,166,106,0.65) !important;
          box-shadow: 0 0 0 3px rgba(199,166,106,0.14);
        }
        .admin-scope select:disabled { opacity: .55; cursor: not-allowed; }
      `}</style>
      {/* یک‌بار این‌جا، پس هر صفحه‌ی ادمین — از جمله صفحه‌های آینده — دارد */}
      <AdminBack />
      {children}
    </div>
  );
}
