import Link from 'next/link'
import '../newsroom.css'

/* خبرِ حذف‌شده یا نشانیِ اشتباه — همان زبانِ بصریِ تحریریه، نه یک
   صفحه‌ی خطای عمومیِ بیگانه. */
export default function ArticleNotFound() {
  return (
    <div className="nr">
      <div className="nr-shell">
        <div className="nr-empty">
          {/* تنها تیترِ صفحه — باید h1 باشد */}
          <h1>این خبر پیدا نشد</h1>
          <p>ممکن است حذف شده باشد، هنوز منتشر نشده باشد، یا نشانی‌اش تغییر کرده باشد.</p>
          <div className="nr-empty-act">
            <Link className="nr-btn" href="/news">بازگشت به اخبار</Link>
            <Link className="nr-btn nr-btn--ghost" href="/">صفحه‌ی اصلی</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
