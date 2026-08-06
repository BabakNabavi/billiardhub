/* نشانِ اعتمادِ الکترونیکی (اینماد) — فوترِ سایت.
   ─────────────────────────────────────────────────────────────

   کدِ زیر عیناً همان چیزی است که پنلِ اینماد داد و **نباید دست بخورد**.
   با `dangerouslySetInnerHTML` رندر می‌شود، نه به‌صورت JSX، و دلیلش
   دقیق است: اگر این را JSX بنویسیم، React خصیصه‌ها را بازنویسی می‌کند
   — `referrerpolicy` تبدیل به `referrerPolicy` می‌شود، خصیصه‌ی سفارشیِ
   `code` روی تصویر ممکن است حذف شود، و ترتیب و نقل‌قول‌ها عوض می‌شوند.
   اینماد کدِ تغییرکرده را رد می‌کند.

   ── قواعدی که اینماد صریحاً گفته ──
   ۱) `rel="noopener noreferrer"` روی این لینک **ممنوع** است. (برای هر
      لینکِ `target="_blank"` دیگری در سایت لازم و درست است، ولی این‌جا
      باعثِ ردشدنِ نشان می‌شود — اینماد برای احراز به هدرِ Referer
      نیاز دارد و آن خصلت جلویش را می‌گیرد.)
   ۲) لوگو باید **رنگی** باشد — هیچ `filter: grayscale` یا کم‌کردنِ
      opacity رویش گذاشته نشود.
   ۳) باید بدونِ ورود به حساب دیده شود، پس در فوترِ عمومی است.
   ۴) نباید داخلِ لینکِ دیگری آشیانه شود.

   ⚠️ برداشتنِ این نشان یا خرابکردنِ لینکش، نشان را باطل می‌کند —
   اینماد دوره‌ای دوباره بررسی می‌کند. */

const ENAMAD_HTML =
  "<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=768727&Code=5crG9JSDOYOIGVvPWos74lWOCDWf5ggC'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=768727&Code=5crG9JSDOYOIGVvPWos74lWOCDWf5ggC' alt='' style='cursor:pointer' code='5crG9JSDOYOIGVvPWos74lWOCDWf5ggC'></a>"

export default function EnamadSeal() {
  return (
    <div className="bh-enamad" aria-label="نماد اعتماد الکترونیکی">
      {/* اندازه فقط روی *ظرف* مهار می‌شود، نه روی خودِ تصویر — تا کدِ
          اینماد دست‌نخورده بماند. `max-width` تنها چیزی است که لازم
          است تا روی صفحه‌ی ۳۲۰ پیکسلی سرریز نکند. */}
      {/* ۲۰٪ کوچک‌تر. مقیاسِ متناسب است، نه دستکاریِ رنگ — قاعده‌ی
          اینماد نبودِ grayscale و کم‌کردنِ opacity است، نه اندازه. */}
      <style>{`
        .bh-enamad img { max-width: 100%; height: auto; display: block;
                         transform: scale(0.8); transform-origin: bottom left; }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: ENAMAD_HTML }} />
    </div>
  )
}
