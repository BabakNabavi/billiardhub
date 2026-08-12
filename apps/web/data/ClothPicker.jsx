import { useState, useMemo } from "react";

const D = {"t":[{"id":"snooker","l":"اسنوکر","n":"استاندارد: پارچه پشمی پرزدار (napped). جهت پرز از سر میز به سمت انتهای میز است و روی مسیر توپ اثر می‌گذارد.","b":[{"id":"snooker__strachan","en":"Strachan","fa":"استراکان","c":"GB","n":"انگلیسی، از پشم مرینوس. رایج‌ترین پارچه اسنوکر جهان","m":[{"id":"st-6811-t30","en":"6811 Tournament 30oz","fa":"۶۸۱۱ تورنمنت ۳۰ اونس","t":"napped","n":"پرفروش‌ترین پارچه اسنوکر دنیا","w":"30"},{"id":"st-6811-t32","en":"6811 Tournament 32oz","fa":"۶۸۱۱ تورنمنت ۳۲ اونس","t":"napped","n":"نسخه سنگین‌تر، دوام بیشتر","w":"32"},{"id":"st-6811-t29","en":"6811 Tournament 29oz","fa":"۶۸۱۱ تورنمنت ۲۹ اونس","t":"napped","w":"29"},{"id":"st-6811-club","en":"6811 Club","fa":"۶۸۱۱ کلاب","t":"napped","n":"رده باشگاهی، اقتصادی‌تر"},{"id":"st-6811-newclub","en":"6811 New Club","fa":"۶۸۱۱ نیوکلاب","t":"napped"},{"id":"st-777","en":"777 West of England","fa":"۷۷۷ وست آو انگلند","t":"napped","n":"سبک‌تر و سریع‌تر از ۶۸۱۱، پرز ظریف‌تر","w":"28"},{"id":"st-no10","en":"No.10 Championship","fa":"نامبر ۱۰ چمپیون‌شیپ","t":"napped","n":"رده حرفه‌ای، بسیار سریع"},{"id":"st-superfine","en":"Superfine","fa":"سوپرفاین","t":"napped","n":"با فناوری Antikick، پارچه رسمی IBSF"}]},{"id":"snooker__hainsworth","en":"Hainsworth","fa":"هینزورث","c":"GB","n":"انگلیسی، از ۱۷۸۳","m":[{"id":"hw-precision","en":"Precision","fa":"پرسیژن","t":"napped","n":"سریع‌ترین پارچه پرزدار دنیا؛ نیازی به گرمکن زیر میز ندارد"},{"id":"hw-match","en":"Match","fa":"مچ","t":"napped","n":"رده تورنمنتی"},{"id":"hw-smart","en":"Smart","fa":"اسمارت","t":"napped","n":"۲۳ رنگ، بیشترین تنوع رنگ بازار"},{"id":"hw-cushion","en":"Cushion Cloth","fa":"پارچه باند","t":"napped"}]},{"id":"snooker__pns","en":"PNS","fa":"پی‌ان‌اس","c":"CN","n":"چینی، تأسیس ۱۹۹۵. جایگزین اقتصادی محبوب استراکان در بازار آسیا","m":[{"id":"pns-s147","en":"S147","fa":"اس ۱۴۷","t":"napped","n":"پارچه رسمی بازی‌های مشترک‌المنافع ۲۰۲۵"},{"id":"pns-990","en":"990","fa":"۹۹۰","t":"napped","n":"بالاترین رده"},{"id":"pns-720","en":"720","fa":"۷۲۰","t":"napped"},{"id":"pns-6688","en":"6688","fa":"۶۶۸۸","t":"napped","n":"رایج در میزهای ۹ فوت و هی‌بال"},{"id":"pns-888","en":"888","fa":"۸۸۸","t":"napped","n":"رده اقتصادی پرفروش"}]},{"id":"snooker__liberwin","en":"Liberwin","fa":"لیبروین","c":"CN","n":"چینی. سفیران برند: رونی اوسالیوان، دینگ جون‌هوی، جاد ترامپ","m":[{"id":"lw-68566","en":"68566","fa":"۶۸۵۶۶","t":"napped"},{"id":"lw-68522","en":"68522","fa":"۶۸۵۲۲","t":"napped"},{"id":"lw-68577","en":"68577","fa":"۶۸۵۷۷","t":"napped"},{"id":"lw-drl","en":"DRL / Pingwen","fa":"دی‌آر‌ال","t":"napped"},{"id":"lw-zhengfeng","en":"Zhengfeng (6811 style)","fa":"ژنگ‌فنگ","t":"napped","n":"شبیه‌سازی ۶۸۱۱"}]},{"id":"snooker__wiraka","en":"Wiraka","fa":"ویراکا","c":"SG","n":"سنگاپور/مالزی، از ۱۹۸۰. رایج در آسیا","m":[{"id":"wk-777","en":"777","fa":"۷۷۷","t":"napped"},{"id":"wk-6811","en":"6811","fa":"۶۸۱۱","t":"napped"},{"id":"wk-6565","en":"6565","fa":"۶۵۶۵","t":"napped"},{"id":"wk-m1","en":"M1 Tournament","fa":"ام‌۱ تورنمنت","t":"napped"}]},{"id":"snooker__konllen-cloth","en":"Konllen","fa":"کانلن","c":"CN","n":null,"m":[{"id":"kn-wool","en":"Wool Felt Pre-cut","fa":"نمد پشمی پیش‌بریده","t":"napped"}]},{"id":"snooker__iranian-cloth","en":"Iranian / Local","fa":"ایرانی / داخلی","c":"IR","n":"در بازار ایران بسیار رایج است","m":[{"id":"ir-standard","en":"Local Standard","fa":"استاندارد داخلی"},{"id":"ir-unknown","en":"Unknown Local","fa":"داخلی نامشخص"}]},{"id":"snooker__chinese-generic","en":"Chinese Unbranded","fa":"چینی بدون برند","c":"CN","n":null,"m":[{"id":"cn-6811-copy","en":"6811 Copy","fa":"کپی ۶۸۱۱","n":"کپی‌های ۶۸۱۱ در بازار زیاد است؛ املای STRCAHAN به‌جای STRACHAN نشانه تقلبی بودن است"},{"id":"cn-777-copy","en":"777 Copy","fa":"کپی ۷۷۷"},{"id":"cn-generic","en":"Generic Wool/Nylon","fa":"پشم-نایلون معمولی"}]},{"id":"snooker__unknown-cloth","en":"Unknown / Unbranded","fa":"نامشخص / بدون برند","c":null,"n":null,"m":[{"id":"uk-unknown","en":"Unknown","fa":"نامشخص"}]}]},{"id":"pocket_billiard","l":"پاکت بیلیارد","n":"دو حالت دارد: میز آمریکایی معمولاً پارچه بدون پرز (worsted) و سریع — میز انگلیسی معمولاً پرزدار و کندتر.","b":[{"id":"pocket_billiard__strachan","en":"Strachan","fa":"استراکان","c":"GB","n":"انگلیسی، از پشم مرینوس. رایج‌ترین پارچه اسنوکر جهان","m":[{"id":"st-6811-t29","en":"6811 Tournament 29oz","fa":"۶۸۱۱ تورنمنت ۲۹ اونس","t":"napped","w":"29"},{"id":"st-6811-pool","en":"6811 Pool","fa":"۶۸۱۱ پاکت بیلیارد","t":"napped","n":"مقاوم‌تر از ۷۷۷، مناسب باشگاه"},{"id":"st-777","en":"777 West of England","fa":"۷۷۷ وست آو انگلند","t":"napped","n":"سبک‌تر و سریع‌تر از ۶۸۱۱، پرز ظریف‌تر","w":"28"},{"id":"st-superfine","en":"Superfine","fa":"سوپرفاین","t":"napped","n":"با فناوری Antikick، پارچه رسمی IBSF"},{"id":"st-861","en":"861","fa":"۸۶۱","t":"worsted","n":"بدون پرز، پارچه رسمی IPA؛ همان Simonis 861"},{"id":"st-superpro","en":"SuperPro","fa":"سوپرپرو","t":"worsted","n":"با SpillGuard، ۱۰ رنگ"}]},{"id":"pocket_billiard__hainsworth","en":"Hainsworth","fa":"هینزورث","c":"GB","n":"انگلیسی، از ۱۷۸۳","m":[{"id":"hw-precision","en":"Precision","fa":"پرسیژن","t":"napped","n":"سریع‌ترین پارچه پرزدار دنیا؛ نیازی به گرمکن زیر میز ندارد"},{"id":"hw-match","en":"Match","fa":"مچ","t":"napped","n":"رده تورنمنتی"},{"id":"hw-smart","en":"Smart","fa":"اسمارت","t":"napped","n":"۲۳ رنگ، بیشترین تنوع رنگ بازار"},{"id":"hw-club","en":"Club","fa":"کلاب","t":"napped","n":"رده اقتصادی همه‌کاره"},{"id":"hw-elite-pro","en":"Elite Pro","fa":"الیت پرو","t":"worsted","n":"بدون پرز، انتخاب اول پاکت بیلیارد آمریکایی، +۲۰ رنگ"},{"id":"hw-cushion","en":"Cushion Cloth","fa":"پارچه باند","t":"napped"}]},{"id":"pocket_billiard__simonis","en":"Iwan Simonis","fa":"سیمونیس","c":"BE","n":"بلژیکی، از ۱۶۸۰. تنها کارخانه‌ای که فقط پارچه بیلیارد می‌بافد","m":[{"id":"si-860","en":"860","fa":"۸۶۰","t":"worsted","n":"استاندارد جهانی پول، ۹۰٪ پشم / ۱۰٪ نایلون","w":"12"},{"id":"si-760","en":"760","fa":"۷۶۰","t":"worsted","n":"۱۰ تا ۱۵٪ سریع‌تر از ۸۶۰"},{"id":"si-920","en":"920","fa":"۹۲۰","t":"worsted"},{"id":"si-861","en":"861","fa":"۸۶۱","t":"worsted","n":"همان Strachan 861"}]},{"id":"pocket_billiard__pns","en":"PNS","fa":"پی‌ان‌اس","c":"CN","n":"چینی، تأسیس ۱۹۹۵. جایگزین اقتصادی محبوب استراکان در بازار آسیا","m":[{"id":"pns-760","en":"760","fa":"۷۶۰","t":"worsted"},{"id":"pns-900","en":"900","fa":"۹۰۰","t":"worsted"},{"id":"pns-988","en":"988","fa":"۹۸۸","t":"worsted"}]},{"id":"pocket_billiard__liberwin","en":"Liberwin","fa":"لیبروین","c":"CN","n":"چینی. سفیران برند: رونی اوسالیوان، دینگ جون‌هوی، جاد ترامپ","m":[{"id":"lw-68522","en":"68522","fa":"۶۸۵۲۲","t":"napped"},{"id":"lw-900","en":"900","fa":"۹۰۰","t":"worsted"}]},{"id":"pocket_billiard__andy","en":"Andy Cloth","fa":"اندی","c":"TW","n":"تایوانی، رایج در بازار آسیا","m":[{"id":"an-988","en":"Andy 988","fa":"اندی ۹۸۸","t":"worsted"},{"id":"an-standard","en":"Andy Standard","fa":"اندی استاندارد","t":"worsted"}]},{"id":"pocket_billiard__championship","en":"Championship Billiard Fabrics","fa":"چمپیون‌شیپ","c":"US","n":"آمریکایی","m":[{"id":"ch-tour","en":"Tour Edition","fa":"تور ادیشن","t":"worsted","n":"رقیب سیمونیس با قیمت کمتر"},{"id":"ch-saturn","en":"Saturn II","fa":"ساترن II","t":"napped","n":"پرفروش‌ترین پارچه پرزدار آمریکا"},{"id":"ch-invitational","en":"Invitational","fa":"اینویتیشنال","t":"napped"},{"id":"ch-mercury","en":"Mercury Ultra","fa":"مرکوری اولترا","t":"worsted"}]},{"id":"pocket_billiard__gorina","en":"Gorina","fa":"گورینا","c":"ES","n":"اسپانیایی، رایج در کارامبول","m":[{"id":"go-granito","en":"Granito","fa":"گرانیتو","t":"worsted"},{"id":"go-basalt","en":"Basalt","fa":"بازالت","t":"worsted"}]},{"id":"pocket_billiard__aramith-cloth","en":"Aramith","fa":"آرامیت","c":"BE","n":null,"m":[{"id":"ar-tournament","en":"Tournament Cloth","fa":"پارچه تورنمنت","t":"worsted"}]},{"id":"pocket_billiard__cpba","en":"CPBA","fa":"سی‌پی‌بی‌ای","c":"CN","n":"چینی، رایج در چاینیز ۸-بال","m":[{"id":"cp-mg700","en":"MG-700 Series","fa":"سری MG-700","t":"worsted"}]},{"id":"pocket_billiard__mangorun","en":"MangoRun","fa":"منگورون","c":"CN","n":null,"m":[{"id":"mr-standard","en":"Standard","fa":"استاندارد","t":"worsted"}]},{"id":"pocket_billiard__iranian-cloth","en":"Iranian / Local","fa":"ایرانی / داخلی","c":"IR","n":"در بازار ایران بسیار رایج است","m":[{"id":"ir-standard","en":"Local Standard","fa":"استاندارد داخلی"},{"id":"ir-unknown","en":"Unknown Local","fa":"داخلی نامشخص"}]},{"id":"pocket_billiard__chinese-generic","en":"Chinese Unbranded","fa":"چینی بدون برند","c":"CN","n":null,"m":[{"id":"cn-6811-copy","en":"6811 Copy","fa":"کپی ۶۸۱۱","n":"کپی‌های ۶۸۱۱ در بازار زیاد است؛ املای STRCAHAN به‌جای STRACHAN نشانه تقلبی بودن است"},{"id":"cn-777-copy","en":"777 Copy","fa":"کپی ۷۷۷"},{"id":"cn-generic","en":"Generic Wool/Nylon","fa":"پشم-نایلون معمولی"}]},{"id":"pocket_billiard__unknown-cloth","en":"Unknown / Unbranded","fa":"نامشخص / بدون برند","c":null,"n":null,"m":[{"id":"uk-unknown","en":"Unknown","fa":"نامشخص"}]}]},{"id":"heyball","l":"هی‌بال","n":"پارچه از خانواده‌ی اسنوکر است، نه پاکت بیلیارد آمریکایی. هم پرزدار و هم بدون‌پرز استفاده می‌شود؛ بستگی به تورنمنت دارد.","b":[{"id":"heyball__hainsworth","en":"Hainsworth","fa":"هینزورث","c":"GB","n":"انگلیسی، از ۱۷۸۳","m":[{"id":"hw-chinese","en":"Chinese Pool Cloth","fa":"پارچه چاینیز پاکت بیلیارد","t":"worsted","n":"مخصوص هی‌بال"},{"id":"hw-cushion","en":"Cushion Cloth","fa":"پارچه باند","t":"napped"},{"id":"hw-chinese-pro","en":"Chinese Pool Pro","fa":"چاینیز پول پرو","t":"worsted","n":"نسخه سریع مخصوص هی‌بال"}]},{"id":"heyball__pns","en":"PNS","fa":"پی‌ان‌اس","c":"CN","n":"چینی، تأسیس ۱۹۹۵. جایگزین اقتصادی محبوب استراکان در بازار آسیا","m":[{"id":"pns-6688","en":"6688","fa":"۶۶۸۸","t":"napped","n":"رایج در میزهای ۹ فوت و هی‌بال"}]},{"id":"heyball__liberwin","en":"Liberwin","fa":"لیبروین","c":"CN","n":"چینی. سفیران برند: رونی اوسالیوان، دینگ جون‌هوی، جاد ترامپ","m":[{"id":"lw-heyball","en":"Heyball Series","fa":"سری هی‌بال","t":"napped"}]},{"id":"heyball__cpba","en":"CPBA","fa":"سی‌پی‌بی‌ای","c":"CN","n":"چینی، رایج در چاینیز ۸-بال","m":[{"id":"cp-mg700","en":"MG-700 Series","fa":"سری MG-700","t":"worsted"},{"id":"cp-competition","en":"Competition Series","fa":"سری کامپتیشن","t":"worsted"},{"id":"cp-heyball","en":"Heyball Tournament","fa":"تورنمنت هی‌بال","t":"worsted"}]},{"id":"heyball__konllen-cloth","en":"Konllen","fa":"کانلن","c":"CN","n":null,"m":[{"id":"kn-wool","en":"Wool Felt Pre-cut","fa":"نمد پشمی پیش‌بریده","t":"napped"}]},{"id":"heyball__iranian-cloth","en":"Iranian / Local","fa":"ایرانی / داخلی","c":"IR","n":"در بازار ایران بسیار رایج است","m":[{"id":"ir-standard","en":"Local Standard","fa":"استاندارد داخلی"},{"id":"ir-unknown","en":"Unknown Local","fa":"داخلی نامشخص"}]},{"id":"heyball__chinese-generic","en":"Chinese Unbranded","fa":"چینی بدون برند","c":"CN","n":null,"m":[{"id":"cn-6811-copy","en":"6811 Copy","fa":"کپی ۶۸۱۱","n":"کپی‌های ۶۸۱۱ در بازار زیاد است؛ املای STRCAHAN به‌جای STRACHAN نشانه تقلبی بودن است"},{"id":"cn-777-copy","en":"777 Copy","fa":"کپی ۷۷۷"},{"id":"cn-generic","en":"Generic Wool/Nylon","fa":"پشم-نایلون معمولی"}]},{"id":"heyball__unknown-cloth","en":"Unknown / Unbranded","fa":"نامشخص / بدون برند","c":null,"n":null,"m":[{"id":"uk-unknown","en":"Unknown","fa":"نامشخص"}]}]},{"id":"carom","l":"کارامبول","n":"پارچه بدون پرز و بسیار سریع، مخصوص برخوردهای مکرر با باند.","b":[{"id":"carom__hainsworth","en":"Hainsworth","fa":"هینزورث","c":"GB","n":"انگلیسی، از ۱۷۸۳","m":[{"id":"hw-cushion","en":"Cushion Cloth","fa":"پارچه باند","t":"napped"}]},{"id":"carom__simonis","en":"Iwan Simonis","fa":"سیمونیس","c":"BE","n":"بلژیکی، از ۱۶۸۰. تنها کارخانه‌ای که فقط پارچه بیلیارد می‌بافد","m":[{"id":"si-300","en":"300 Rapide","fa":"۳۰۰ راپید","t":"worsted","n":"مخصوص کارامبول"},{"id":"si-30","en":"30 / Carom","fa":"۳۰ کارامبول","t":"worsted"}]},{"id":"carom__gorina","en":"Gorina","fa":"گورینا","c":"ES","n":"اسپانیایی، رایج در کارامبول","m":[{"id":"go-granito","en":"Granito","fa":"گرانیتو","t":"worsted"},{"id":"go-tournament","en":"Tournament 2000","fa":"تورنمنت ۲۰۰۰","t":"worsted"}]},{"id":"carom__iranian-cloth","en":"Iranian / Local","fa":"ایرانی / داخلی","c":"IR","n":"در بازار ایران بسیار رایج است","m":[{"id":"ir-standard","en":"Local Standard","fa":"استاندارد داخلی"},{"id":"ir-unknown","en":"Unknown Local","fa":"داخلی نامشخص"}]},{"id":"carom__chinese-generic","en":"Chinese Unbranded","fa":"چینی بدون برند","c":"CN","n":null,"m":[{"id":"cn-6811-copy","en":"6811 Copy","fa":"کپی ۶۸۱۱","n":"کپی‌های ۶۸۱۱ در بازار زیاد است؛ املای STRCAHAN به‌جای STRACHAN نشانه تقلبی بودن است"},{"id":"cn-777-copy","en":"777 Copy","fa":"کپی ۷۷۷"},{"id":"cn-generic","en":"Generic Wool/Nylon","fa":"پشم-نایلون معمولی"}]},{"id":"carom__unknown-cloth","en":"Unknown / Unbranded","fa":"نامشخص / بدون برند","c":null,"n":null,"m":[{"id":"uk-unknown","en":"Unknown","fa":"نامشخص"}]}]}],"co":{"GB":"🇬🇧","BE":"🇧🇪","CN":"🇨🇳","US":"🇺🇸","ES":"🇪🇸","SG":"🇸🇬","TW":"🇹🇼","IR":"🇮🇷"},"cof":{"GB":"انگلستان","BE":"بلژیک","CN":"چین","US":"آمریکا","ES":"اسپانیا","SG":"سنگاپور","TW":"تایوان","IR":"ایران"},"ct":{"napped":{"l":"پرزدار / جهت‌دار","n":"سطح کرک‌دار، اصطکاک بیشتر، توپ کندتر. استاندارد اسنوکر و پاکت بیلیارد انگلیسی. جهت پرز به سمت انتهای میز است."},"worsted":{"l":"بدون پرز / فاستونی","n":"سطح صاف و بدون جهت، توپ سریع‌تر و یکنواخت. استاندارد پاکت بیلیارد آمریکایی و کارامبول."}}};

const GOLD = "#B08D57", GOLD_SOFT = "#D9C4A3", PAGE = "#F1EFEB";
const INK = "#2C2A27", MUTE = "#8C877F", LINE = "#E8E4DE", FIELD = "#FAF9F7";

const TABLE_TYPES = D.t;

function Chevron({ open }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Flag({ code }) {
  return (
    <span title={code ? D.cof[code] : "نامشخص"} aria-label={code ? D.cof[code] : "نامشخص"}
      style={{
        width: 21, textAlign: "center", flexShrink: 0, fontSize: 14, lineHeight: "21px",
        fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
      }}>
      {code ? D.co[code] : "—"}
    </span>
  );
}

function Label({ children, help }) {
  return (
    <>
      <label style={{ display: "block", fontSize: 13.5, color: INK, marginBottom: 6, fontWeight: 600 }}>{children}</label>
      {help && <div style={{ fontSize: 11.5, color: MUTE, marginBottom: 7, lineHeight: 1.7 }}>{help}</div>}
    </>
  );
}

const inp = (foc, white) => ({
  width: "100%", padding: "12px 15px", borderRadius: 13,
  background: white ? "#fff" : FIELD, border: `1.5px solid ${foc ? GOLD : LINE}`,
  fontSize: 15, color: INK, outline: "none", textAlign: "right", boxSizing: "border-box",
});

function Trigger({ open, onClick, disabled, value, flag, placeholder }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 15px", borderRadius: 13, textAlign: "right",
        background: disabled ? "#F4F2EF" : FIELD,
        border: `1.5px solid ${open ? GOLD : LINE}`,
        boxShadow: open ? `0 0 0 3px ${GOLD}22` : "none",
        color: disabled ? "#BBB6AE" : value ? INK : MUTE,
        fontSize: 15, cursor: disabled ? "not-allowed" : "pointer",
      }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {value && flag !== undefined && <Flag code={flag} />}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || placeholder}
        </span>
      </span>
      <Chevron open={open} />
    </button>
  );
}

export default function ClothPicker() {
  const [tType, setTType] = useState("snooker");
  const [brand, setBrand] = useState(null);
  const [model, setModel] = useState(null);
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState("");
  const [cb, setCb] = useState("");
  const [cm, setCm] = useState("");
  const [typeOverride, setTypeOverride] = useState(null);

  const otherBrand = brand === "__other";
  const otherModel = model === "__other";
  const bObj = otherBrand ? null : (D.t.find(t => t.id === tType).b.find(b => b.id === brand) || null);
  const mObj = bObj && !otherModel ? bObj.m.find(m => m.id === model) : null;

  const tObj = D.t.find(t => t.id === tType);
  const brandList = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tObj.b;
    return tObj.b.filter(b => b.en.toLowerCase().includes(s) || b.fa.includes(s) ||
      (b.c && D.cof[b.c].includes(s)));
  }, [q, tObj]);

  // مدل‌های مرتبط اول، بقیه ته لیست
  const modelList = bObj ? bObj.m : [];

  const effType = typeOverride || (mObj && mObj.t) || null;

  const pickBrand = id => {
    setBrand(id); setModel(null); setCm(""); setTypeOverride(null); setOpen(null); setQ("");
  };
  const pickModel = id => {
    setModel(id); setTypeOverride(null); setOpen(null);
  };

  return (
    <div dir="rtl" style={{ background: PAGE, minHeight: "100vh", padding: "14px 12px 40px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>

        <div style={{ background: "#fff", borderRadius: 18, padding: "14px 15px", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: MUTE, marginBottom: 9 }}>نوع میز</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TABLE_TYPES.map(t => (
              <button key={t.id} type="button" onClick={() => { setTType(t.id); setBrand(null); setModel(null); setCb(""); setCm(""); setTypeOverride(null); setOpen(null); }}
                style={{
                  padding: "7px 13px", borderRadius: 9, fontSize: 13, cursor: "pointer", border: "none",
                  background: tType === t.id ? GOLD : "#F4F2EF",
                  color: tType === t.id ? "#fff" : MUTE,
                }}>{t.l}</button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: MUTE, marginTop: 11, lineHeight: 1.85, paddingTop: 10, borderTop: `1px solid ${LINE}` }}>
            {tObj.n}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 22, padding: "20px 17px", boxShadow: "0 2px 14px rgba(70,60,45,.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 20, flexDirection: "row-reverse", justifyContent: "flex-end" }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: GOLD, display: "grid", placeItems: "center" }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round">
                <path d="M4 7h16v12H4zM4 7l2-3h12l2 3M8 19v-8M16 19v-8" />
              </svg>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: GOLD_SOFT, fontWeight: 700 }}>CLOTH</div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: INK, margin: "2px 0 0" }}>پارچه میز</h2>
            </div>
          </div>

          {/* برند */}
          <div style={{ marginBottom: 20 }}>
            <Label help="برند را انتخاب کنید تا مدل‌های همان برند نمایش داده شود.">برند پارچه</Label>
            <Trigger open={open === "b"} onClick={() => setOpen(open === "b" ? null : "b")}
              value={otherBrand ? "سایر" : bObj && bObj.en} flag={otherBrand ? null : bObj && bObj.c}
              placeholder="انتخاب برند..." />
            {open === "b" && (
              <div style={{ marginTop: 6, background: "#fff", borderRadius: 13, border: `1px solid ${LINE}`, boxShadow: "0 12px 28px rgba(60,50,35,.10)", overflow: "hidden" }}>
                <div style={{ padding: 10, borderBottom: `1px solid ${LINE}` }}>
                  <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                    placeholder="جستجوی برند یا کشور..." style={{ ...inp(false), padding: "10px 13px", fontSize: 14 }} />
                </div>
                <div style={{ maxHeight: 270, overflowY: "auto" }}>
                  {brandList.map(b => (
                    <button key={b.id} type="button" onClick={() => pickBrand(b.id)}
                      style={{
                        width: "100%", padding: "11px 15px", textAlign: "right", cursor: "pointer", display: "block",
                        background: brand === b.id ? "#FBF7F0" : "transparent", border: "none", borderBottom: `1px solid ${LINE}`,
                      }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Flag code={b.c} />
                        <span style={{ fontSize: 14.5, color: INK, fontWeight: 500 }}>{b.en}</span>
                        <span style={{ fontSize: 12, color: MUTE }}>{b.fa}</span>
                        <span style={{ marginInlineStart: "auto", fontSize: 11, color: "#B5B0A8" }}>{b.m.length}</span>
                      </div>
                      {b.n && <div style={{ fontSize: 11, color: MUTE, marginTop: 3, lineHeight: 1.6, paddingInlineStart: 29 }}>{b.n}</div>}
                    </button>
                  ))}
                  <button type="button" onClick={() => pickBrand("__other")}
                    style={{ width: "100%", padding: "12px 15px", textAlign: "right", cursor: "pointer", background: otherBrand ? "#FBF7F0" : "transparent", border: "none", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: GOLD, fontSize: 16, width: 21, textAlign: "center" }}>+</span>
                    <span style={{ fontSize: 14.5, color: GOLD, fontWeight: 500 }}>سایر</span>
                  </button>
                </div>
              </div>
            )}
            {otherBrand && (
              <input autoFocus value={cb} onChange={e => setCb(e.target.value)} maxLength={60}
                placeholder="نام برند پارچه" style={{ ...inp(true, true), marginTop: 8 }} />
            )}
          </div>

          {/* مدل */}
          <div style={{ marginBottom: 20 }}>
            <Label help="مثال: استراکان ۶۸۱۱ تورنمنت ۳۰ اونس">مدل پارچه</Label>
            {otherBrand ? (
              <input value={cm} onChange={e => setCm(e.target.value)} maxLength={60}
                placeholder="نام مدل (اختیاری)" style={inp(false)} />
            ) : (
              <>
                <Trigger open={open === "m"} disabled={!brand}
                  onClick={() => setOpen(open === "m" ? null : "m")}
                  value={otherModel ? "سایر" : mObj && mObj.en}
                  placeholder={brand ? "انتخاب مدل..." : "ابتدا برند را انتخاب کنید"} />
                {open === "m" && (
                  <div style={{ marginTop: 6, background: "#fff", borderRadius: 13, border: `1px solid ${LINE}`, boxShadow: "0 12px 28px rgba(60,50,35,.10)", overflow: "hidden", maxHeight: 320, overflowY: "auto" }}>
                    {modelList.map(m => (
                        <button key={m.id} type="button" onClick={() => pickModel(m.id)}
                          style={{
                            width: "100%", padding: "11px 15px", textAlign: "right", cursor: "pointer", display: "block",
                            background: model === m.id ? "#FBF7F0" : "transparent", border: "none", borderBottom: `1px solid ${LINE}`,
                          }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14.5, color: INK, fontWeight: 500 }}>{m.en}</span>
                            {m.t && (
                              <span style={{
                                fontSize: 10, padding: "2px 7px", borderRadius: 6,
                                background: m.t === "napped" ? "#EFEAE0" : "#E5EDF0",
                                color: m.t === "napped" ? "#8A7551" : "#5B7A88",
                              }}>{m.t === "napped" ? "پرزدار" : "بدون پرز"}</span>
                            )}
                            {m.w && <span style={{ fontSize: 10.5, color: MUTE }}>{m.w} اونس</span>}
                          </div>
                          {m.n && <div style={{ fontSize: 11, color: MUTE, marginTop: 4, lineHeight: 1.65 }}>{m.n}</div>}
                        </button>
                    ))}
                    <button type="button" onClick={() => pickModel("__other")}
                      style={{ width: "100%", padding: "12px 15px", textAlign: "right", cursor: "pointer", background: otherModel ? "#FBF7F0" : "transparent", border: "none", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: GOLD, fontSize: 16 }}>+</span>
                      <span style={{ fontSize: 14.5, color: GOLD, fontWeight: 500 }}>سایر</span>
                    </button>
                  </div>
                )}
                {otherModel && (
                  <input autoFocus value={cm} onChange={e => setCm(e.target.value)} maxLength={60}
                    placeholder="نام مدل" style={{ ...inp(true, true), marginTop: 8 }} />
                )}
              </>
            )}
          </div>

          {/* نوع پارچه — خودکار */}
          <div style={{ marginBottom: 6 }}>
            <Label help={mObj && mObj.t && !typeOverride ? "از روی مدل انتخابی پر شد — می‌توانید تغییر دهید." : undefined}>
              نوع پارچه
            </Label>
            <div style={{ display: "flex", gap: 7 }}>
              {["napped", "worsted"].map(t => {
                const on = effType === t;
                return (
                  <button key={t} type="button" onClick={() => setTypeOverride(on ? null : t)}
                    style={{
                      flex: 1, padding: "11px 12px", borderRadius: 12, cursor: "pointer", textAlign: "right",
                      background: on ? "#FBF7F0" : FIELD,
                      border: `1.5px solid ${on ? GOLD : LINE}`,
                    }}>
                    <div style={{ fontSize: 13.5, color: on ? INK : MUTE, fontWeight: on ? 700 : 500 }}>
                      {on && "✓ "}{D.ct[t].l}
                    </div>
                  </button>
                );
              })}
            </div>
            {effType && (
              <div style={{ fontSize: 11.5, color: MUTE, marginTop: 8, lineHeight: 1.8 }}>
                {D.ct[effType].n}
              </div>
            )}
          </div>

          {(bObj || (otherBrand && cb)) && (
            <div style={{ marginTop: 18, padding: "13px 16px", borderRadius: 14, background: "#FBF7F0", border: `1px solid ${GOLD_SOFT}` }}>
              <div style={{ fontSize: 11, color: MUTE, marginBottom: 5 }}>ثبت می‌شود</div>
              <div style={{ fontSize: 14.5, color: INK, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                {bObj && <Flag code={bObj.c} />}
                <span>
                  {otherBrand ? cb : bObj.en}
                  {(otherModel ? cm : mObj && mObj.en) ? ` — ${otherModel ? cm : mObj.en}` : ""}
                  {effType ? ` · ${D.ct[effType].l}` : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#B5B0A8", marginTop: 16, lineHeight: 1.8 }}>
          {`${tObj.b.length} برند و ${tObj.b.reduce((s, b) => s + b.m.length, 0)} مدل برای ${tObj.l}`}
        </p>
      </div>
    </div>
  );
}
