import { useState, useMemo } from "react";

const D = {"t":[{"id":"snooker","l":"اسنوکر","n":"گچ اسنوکر معمولاً سبز است و برای تیپ نازک و ضربات ظریف طراحی شده.","b":[{"id":"csnk__kamui","en":"Kamui","fa":"کامویی","c":"JP","n":"ژاپن. یکی از سه گچ برتر از نظر عدم چسبیدن به توپ سفید","tier":"tournament","m":[{"id":"kamui-098","en":"Kamui 0.98","fa":"کامویی ۰.۹۸","n":"نسل اول؛ چسبندگی بسیار بالا","col":"آبی"},{"id":"kamui-roku","en":"Kamui Roku","fa":"کامویی روکو","n":"نسل جدید؛ اثر کمتری روی توپ سفید می‌گذارد","col":"آبی / قرمز / سبز"},{"id":"kamui-beta","en":"Kamui Beta","fa":"کامویی بتا","col":"آبی"}]},{"id":"csnk__taom","en":"Taom","fa":"تائوم","c":"FI","n":"فنلاند، ساخت دست. تنها گچی که تقریباً هیچ اثری روی توپ سفید نمی‌گذارد؛ کیک و میس‌کیو را کم می‌کند","tier":"tournament","m":[{"id":"v10-green","en":"V10 Green","fa":"V10 سبز","n":"پرچم‌دار رده اسنوکر؛ تمیزترین گچ بازار","col":"سبز"},{"id":"v10-blue","en":"V10 Blue","fa":"V10 آبی","n":"برای میزهای پارچه آبی","col":"آبی"},{"id":"pyro","en":"Pyro","fa":"پایرو","n":"چسبندگی تهاجمی‌تر؛ اسنوکر و پاکت بیلیارد","col":"آبی"},{"id":"v2-soft","en":"2.0 Soft","fa":"۲.۰ نرم","n":"حس نرم‌تر روی تیپ","col":"سبز / آبی"},{"id":"v2-hard","en":"2.0 Hard","fa":"۲.۰ سخت","n":"بلوک سفت‌تر و بادوام‌تر","col":"سبز / آبی"},{"id":"gold","en":"Gold","fa":"گلد","n":"رده ویژه و لوکس","col":"طلایی"},{"id":"original","en":"Original / V1","fa":"اورجینال","n":"نسل اول"}]},{"id":"csnk__adr147","en":"ADR147","fa":"ای‌دی‌آر ۱۴۷","c":"GB","n":null,"tier":"premium","m":[{"id":"adr-chalk","en":"ADR147 Chalk","fa":"گچ ADR147","col":"سبز"}]},{"id":"csnk__blue-diamond","en":"Blue Diamond","fa":"بلو دایموند","c":"GB","n":"استاندارد بین‌المللی؛ فشردگی خوب و گرد کم","tier":"premium","m":[{"id":"bd-std","en":"Blue Diamond","fa":"بلو دایموند","n":"چسبندگی بالا و گرد کم","col":"آبی"}]},{"id":"csnk__g2","en":"G2","fa":"جی‌۲","c":"JP","n":"ژاپن. هر بسته QR کد و شماره سریال اصالت دارد","tier":"premium","m":[{"id":"g2-s","en":"G2-S","fa":"G2-S","n":"تمیز و یکنواخت روی تیپ","col":"آبی / سبز"},{"id":"g2-f","en":"G2-F","fa":"G2-F","n":"چسبندگی بیشتر با اثر کمتر","col":"آبی / سبز"}]},{"id":"csnk__green-diamond","en":"Green Diamond","fa":"گرین دایموند","c":"GB","n":"نسخه اسنوکری Blue Diamond","tier":"premium","m":[{"id":"gd-std","en":"Green Diamond","fa":"گرین دایموند","n":"نسخه سبز مخصوص اسنوکر","col":"سبز"}]},{"id":"csnk__nir","en":"NIR","fa":"ان‌آی‌آر","c":"GB","n":null,"tier":"premium","m":[{"id":"nir-chalk","en":"NIR Chalk","fa":"گچ NIR","col":"سبز / آبی"}]},{"id":"csnk__pro-spin","en":"ProSpin","fa":"پرو اسپین","c":"TH","n":null,"tier":"premium","m":[{"id":"ps-chalk","en":"ProSpin Chalk","fa":"گچ پرو اسپین","col":"سبز"}]},{"id":"csnk__triangle","en":"Triangle","fa":"تریانگل","c":"US","n":"ساخت Tweeten Fibre آمریکا (سازنده Master هم هست). دهه‌هاست استاندارد اسنوکر بریتانیاست","tier":"premium","m":[{"id":"triangle-std","en":"Triangle Chalk","fa":"تریانگل استاندارد","n":"کلاسیک و ارزان؛ بسته‌بندی زرد","col":"سبز / آبی / قرمز / مشکی"},{"id":"triangle-pro","en":"Triangle Pro Chalk","fa":"تریانگل پرو","n":"جان هیگینز در قهرمانی جهان ۲۰۱۸ استفاده کرد","col":"سبز / آبی"}]},{"id":"csnk__master","en":"Master","fa":"مستر","c":"US","n":"ساخت Tweeten Fibre. سال‌هاست پرمصرف‌ترین گچ دنیاست","tier":"mid","m":[{"id":"master-std","en":"Master Chalk","fa":"مستر استاندارد","n":"ارزان‌ترین گزینه قابل‌اعتماد؛ رایج‌ترین در باشگاه‌ها","col":"سبز / آبی / قرمز / مشکی / سفید"}]},{"id":"csnk__wiraka-chalk","en":"Wiraka","fa":"ویراکا","c":"SG","n":null,"tier":"mid","m":[{"id":"wk-premium-green","en":"Premium Green","fa":"پریمیوم سبز","n":"همراه میزهای Wiraka عرضه می‌شود","col":"سبز"}]},{"id":"csnk__chinese-chalk-s","en":"Chinese Unbranded","fa":"چینی بدون برند","c":"CN","n":null,"tier":"budget","m":[{"id":"cn-copy","en":"Copy / Generic","fa":"کپی / معمولی","n":"کپی‌های Taom و Triangle در بازار زیاد است"}]},{"id":"csnk__unknown-chalk-s","en":"Unknown / Unbranded","fa":"نامشخص / بدون برند","c":null,"n":null,"tier":"budget","m":[{"id":"uk-s","en":"Unknown","fa":"نامشخص"}]}]},{"id":"pocket_billiard","l":"پاکت بیلیارد","n":"گچ پاکت بیلیارد معمولاً آبی است و برای تیپ پهن‌تر و ضربات قدرتی و پیچ زیاد ساخته می‌شود.","b":[{"id":"cpkt__kamui","en":"Kamui","fa":"کامویی","c":"JP","n":null,"tier":"tournament","m":[{"id":"roku","en":"Kamui Roku","fa":"کامویی روکو","n":"انتخاب حرفه‌ای‌هایی مثل میکا ایمونن","col":"آبی / قرمز / سبز"},{"id":"098","en":"Kamui 0.98","fa":"کامویی ۰.۹۸","n":"چسبندگی بسیار بالا؛ نیاز به تکنیک زدن متفاوت","col":"آبی"},{"id":"beta","en":"Kamui Beta","fa":"کامویی بتا","col":"آبی"}]},{"id":"cpkt__predator","en":"Predator","fa":"پردیتور","c":"US","n":null,"tier":"tournament","m":[{"id":"pure","en":"Predator Pure","fa":"پردیتور پیور","n":"جزو سه گچ برتر از نظر عدم چسبیدن به توپ سفید","col":"آبی"},{"id":"1080","en":"Predator 1080","fa":"پردیتور ۱۰۸۰","col":"آبی / سبز / قرمز"},{"id":"arcos-chalk","en":"Arcos Chalk","fa":"گچ آرکوس","col":"آبی"}]},{"id":"cpkt__taom","en":"Taom","fa":"تائوم","c":"FI","n":"در پاکت بیلیارد که پیچ و ضربه‌های قدرتی بیشتر است، چسبندگی و یکنواختی اهمیت بیشتری دارد","tier":"tournament","m":[{"id":"pyro","en":"Pyro","fa":"پایرو","n":"بهترین گزینه Taom برای پاکت بیلیارد","col":"آبی"},{"id":"v10-blue","en":"V10 Blue","fa":"V10 آبی","col":"آبی"},{"id":"v10-green","en":"V10 Green","fa":"V10 سبز","col":"سبز"},{"id":"v2-soft","en":"2.0 Soft","fa":"۲.۰ نرم","col":"آبی / سبز"},{"id":"v2-hard","en":"2.0 Hard","fa":"۲.۰ سخت","col":"آبی / سبز"}]},{"id":"cpkt__balabushka-chalk","en":"Balabushka","fa":"بالابوشکا","c":"US","n":null,"tier":"premium","m":[{"id":"bal-std","en":"Balabushka Chalk","fa":"گچ بالابوشکا","col":"آبی"}]},{"id":"cpkt__blue-diamond","en":"Blue Diamond","fa":"بلو دایموند","c":"GB","n":null,"tier":"premium","m":[{"id":"bd-std","en":"Blue Diamond","fa":"بلو دایموند","n":"استاندارد بین‌المللی؛ فشردگی خوب و گرد کم","col":"آبی"}]},{"id":"cpkt__g2","en":"G2","fa":"جی‌۲","c":"JP","n":null,"tier":"premium","m":[{"id":"g2-s","en":"G2-S","fa":"G2-S","n":"تمیزی و یکنواختی","col":"آبی / سبز"},{"id":"g2-f","en":"G2-F","fa":"G2-F","n":"چسبندگی بیشتر","col":"آبی / سبز"}]},{"id":"cpkt__great-white","en":"Great White","fa":"گریت وایت","c":"US","n":null,"tier":"premium","m":[{"id":"gw-mako","en":"Great White (Mako Blue)","fa":"گریت وایت","col":"آبی"}]},{"id":"cpkt__magic","en":"Magic Chalk","fa":"مجیک","c":"US","n":null,"tier":"premium","m":[{"id":"magic-std","en":"Magic Chalk","fa":"گچ مجیک","n":"چسبندگی بسیار بالا","col":"آبی"}]},{"id":"cpkt__mezz-chalk","en":"Mezz","fa":"مِز","c":"JP","n":null,"tier":"premium","m":[{"id":"smart","en":"Mezz Smart Chalk","fa":"اسمارت چاک","col":"آبی"}]},{"id":"cpkt__navigator","en":"Navigator","fa":"ناویگیتور","c":"JP","n":null,"tier":"premium","m":[{"id":"nav-std","en":"Navigator Chalk","fa":"گچ ناویگیتور","col":"آبی"}]},{"id":"cpkt__ob","en":"OB Chalk","fa":"او‌بی","c":"US","n":null,"tier":"premium","m":[{"id":"ob-std","en":"OB Chalk","fa":"گچ OB","col":"آبی"}]},{"id":"cpkt__turning-point","en":"Turning Point (TP)","fa":"ترنینگ پوینت","c":"US","n":null,"tier":"premium","m":[{"id":"tp-std","en":"TP Chalk","fa":"گچ TP","col":"آبی"}]},{"id":"cpkt__cpba-chalk","en":"CPBA","fa":"سی‌پی‌بی‌ای","c":"CN","n":null,"tier":"mid","m":[{"id":"cpba-std","en":"CPBA Chalk","fa":"گچ CPBA","n":"رایج در چاینیز ۸-بال"}]},{"id":"cpkt__championship-chalk","en":"Championship","fa":"چمپیون‌شیپ","c":"US","n":null,"tier":"mid","m":[{"id":"ch-std","en":"Championship Chalk","fa":"گچ چمپیون‌شیپ","col":"آبی / سبز"}]},{"id":"cpkt__lava","en":"Lava","fa":"لاوا","c":"US","n":null,"tier":"mid","m":[{"id":"lava-std","en":"Lava Chalk","fa":"گچ لاوا","n":"ساخت Tweeten؛ رده بالاتر از Master","col":"آبی / سبز"}]},{"id":"cpkt__master","en":"Master","fa":"مستر","c":"US","n":null,"tier":"mid","m":[{"id":"master-std","en":"Master Chalk","fa":"مستر استاندارد","n":"ارزان‌ترین و رایج‌ترین؛ حدود ۶۰ ساعت دوام","col":"آبی / سبز / قرمز / مشکی / سفید / بنفش"}]},{"id":"cpkt__silver-cup","en":"Silver Cup","fa":"سیلور کاپ","c":"US","n":null,"tier":"mid","m":[{"id":"sc-std","en":"Silver Cup Chalk","fa":"سیلور کاپ","n":"تنوع رنگ بالا برای تطبیق با پارچه","col":"۱۵ رنگ"}]},{"id":"cpkt__triangle","en":"Triangle","fa":"تریانگل","c":"US","n":null,"tier":"mid","m":[{"id":"triangle-std","en":"Triangle Chalk","fa":"تریانگل","n":"کلاسیک و ارزان","col":"آبی / سبز / قرمز"},{"id":"triangle-pro","en":"Triangle Pro","fa":"تریانگل پرو","col":"آبی / سبز"}]},{"id":"cpkt__chinese-chalk-p","en":"Chinese Unbranded","fa":"چینی بدون برند","c":"CN","n":null,"tier":"budget","m":[{"id":"cn-copy","en":"Copy / Generic","fa":"کپی / معمولی"}]},{"id":"cpkt__unknown-chalk-p","en":"Unknown / Unbranded","fa":"نامشخص / بدون برند","c":null,"n":null,"tier":"budget","m":[{"id":"uk-p","en":"Unknown","fa":"نامشخص"}]}]},{"id":"carom","l":"کارامبول","n":"در کارامبول به‌خاطر برخورد مکرر با باند، چسبندگی و دوام گچ اهمیت ویژه دارد.","b":[{"id":"ccar__taom","en":"Taom","fa":"تائوم","c":"FI","n":null,"tier":"tournament","m":[{"id":"pyro","en":"Pyro","fa":"پایرو","n":"انتخاب اول بازیکنان سه‌بانده","col":"آبی"},{"id":"v10-green","en":"V10 Green","fa":"V10 سبز","col":"سبز"}]},{"id":"ccar__kamui","en":"Kamui","fa":"کامویی","c":"JP","n":null,"tier":"premium","m":[{"id":"roku","en":"Kamui Roku","fa":"کامویی روکو","col":"آبی"}]},{"id":"ccar__longoni-chalk","en":"Longoni","fa":"لونگونی","c":"IT","n":null,"tier":"premium","m":[{"id":"lg-chalk","en":"Longoni Chalk","fa":"گچ لونگونی","col":"آبی"}]},{"id":"ccar__molinari-chalk","en":"Molinari","fa":"مولیناری","c":"NL","n":null,"tier":"premium","m":[{"id":"ml-chalk","en":"Molinari Chalk","fa":"گچ مولیناری","col":"آبی"}]},{"id":"ccar__master-c","en":"Master","fa":"مستر","c":"US","n":null,"tier":"mid","m":[{"id":"master-std","en":"Master Chalk","fa":"مستر","col":"آبی / سبز"}]},{"id":"ccar__unknown-chalk-c","en":"Unknown / Unbranded","fa":"نامشخص / بدون برند","c":null,"n":null,"tier":"budget","m":[{"id":"uk-c","en":"Unknown","fa":"نامشخص"}]}]}],"co":{"FI":"🇫🇮","US":"🇺🇸","JP":"🇯🇵","GB":"🇬🇧","CN":"🇨🇳","IT":"🇮🇹","NL":"🇳🇱","TH":"🇹🇭","SG":"🇸🇬"},"cof":{"FI":"فنلاند","US":"آمریکا","JP":"ژاپن","GB":"انگلستان","CN":"چین","IT":"ایتالیا","NL":"هلند","TH":"تایلند","SG":"سنگاپور"},"sp":[{"id":"color","l":"رنگ گچ","t":"select","h":"رنگ باید با پارچه میز بخواند تا اثر گچ روی پارچه کمتر دیده شود.","ao":true,"o":[{"id":"green","l":"سبز","n":"استاندارد اسنوکر"},{"id":"blue","l":"آبی","n":"استاندارد پاکت بیلیارد و کارامبول"},{"id":"red","l":"قرمز"},{"id":"black","l":"مشکی"},{"id":"white","l":"سفید"},{"id":"gold","l":"طلایی"},{"id":"purple","l":"بنفش"},{"id":"grey","l":"خاکستری"},{"id":"brown","l":"قهوه‌ای"}]},{"id":"hardness","l":"سختی","t":"select","h":"نرم چسبندگی بیشتر و مصرف سریع‌تر — سخت دوام بیشتر و گرد کمتر.","o":[{"id":"soft-ch","l":"نرم","n":"چسبندگی بالا؛ مناسب پیچ زیاد"},{"id":"medium-ch","l":"متوسط"},{"id":"hard-ch","l":"سخت","n":"دوام بیشتر و گرد کمتر"}]},{"id":"quantity","l":"تعداد","t":"number","h":"تکی یا بسته‌ای. جعبه‌های استاندارد معمولاً ۱۲ یا ۱۴۴ عددی‌اند.","p":"1","c":[1,2,3,6,12,24,144]},{"id":"packaging","l":"نوع بسته‌بندی","t":"select","ao":true,"o":[{"id":"single","l":"تکی"},{"id":"pack-2","l":"بسته ۲ تایی"},{"id":"pack-3","l":"بسته ۳ تایی"},{"id":"box-12","l":"جعبه ۱۲ عددی"},{"id":"box-144","l":"کارتن ۱۴۴ عددی (گروس)"},{"id":"with-holder","l":"همراه با نگهدارنده"}]},{"id":"has_holder","l":"همراه با نگهدارنده گچ","t":"boolean","h":"نگهدارنده مغناطیسی یا کیسه‌ای که به شلوار یا میز وصل می‌شود"},{"id":"holder_type","l":"نوع نگهدارنده","t":"select","ao":true,"dep":"has_holder","o":[{"id":"magnetic","l":"مغناطیسی"},{"id":"pouch","l":"کیسه چرمی"},{"id":"clip","l":"گیره‌ای"},{"id":"cup","l":"کاسه‌ای رومیزی"},{"id":"cone-holder","l":"نگهدارنده گچ مخروطی"}]},{"id":"chalk_form","l":"شکل گچ","t":"select","ao":true,"o":[{"id":"cube","l":"مکعبی (استاندارد)"},{"id":"cone","l":"مخروطی (گچ دست)","n":"برای دست، نه تیپ"},{"id":"powder","l":"پودری","n":"پودر دست برای روان شدن چوب"}]},{"id":"is_sealed","l":"پلمب / استفاده‌نشده","t":"boolean"},{"id":"authenticity","l":"اصالت","t":"select","h":"کپی Taom و Kamui در بازار زیاد است. برخی برندها QR کد یا شماره سریال دارند.","ao":true,"o":[{"id":"original","l":"اصل / اورجینال"},{"id":"with-qr","l":"دارای QR کد یا شماره سریال"},{"id":"unknown-auth","l":"نامشخص"}]}],"cond":[{"id":"new","l":"نو / آکبند"},{"id":"like-new","l":"در حد نو"},{"id":"used-excellent","l":"کارکرده - عالی"},{"id":"used-good","l":"کارکرده - خوب"},{"id":"used-fair","l":"کارکرده - متوسط"},{"id":"needs-repair","l":"نیازمند تعمیر"},{"id":"refurbished","l":"بازسازی‌شده"}]};

const GOLD = "#B08D57", GOLD_SOFT = "#D9C4A3", PAGE = "#F1EFEB";
const INK = "#2C2A27", MUTE = "#8C877F", LINE = "#E8E4DE", FIELD = "#FAF9F7";

const SWATCH = {
  green: "#2E6B4A", blue: "#2B5C8A", red: "#9E3B34", black: "#2B2B2B",
  white: "#EDEAE4", gold: "#B08D57", purple: "#6B4A7E", grey: "#8A8A8A", brown: "#6B4F35",
};

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
      style={{ width: 21, textAlign: "center", flexShrink: 0, fontSize: 14, lineHeight: "21px",
        fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>
      {code ? D.co[code] : "—"}
    </span>
  );
}

function Label({ children, req, help }) {
  return (
    <>
      <label style={{ display: "block", fontSize: 13.5, color: INK, marginBottom: 6, fontWeight: 600 }}>
        {children}{req && <span style={{ color: "#D9534F", marginInlineStart: 4 }}>*</span>}
      </label>
      {help && <div style={{ fontSize: 11.5, color: MUTE, marginBottom: 7, lineHeight: 1.7 }}>{help}</div>}
    </>
  );
}

const inp = (foc, white) => ({
  width: "100%", padding: "12px 15px", borderRadius: 13,
  background: white ? "#fff" : FIELD, border: `1.5px solid ${foc ? GOLD : LINE}`,
  fontSize: 15, color: INK, outline: "none", textAlign: "right", boxSizing: "border-box",
});

function Trigger({ open, onClick, disabled, value, flag, placeholder, dot }) {
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
        {dot && <span style={{ width: 14, height: 14, borderRadius: 99, background: dot, border: "1px solid rgba(0,0,0,.15)", flexShrink: 0 }} />}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value || placeholder}
        </span>
      </span>
      <Chevron open={open} />
    </button>
  );
}

function Panel({ children, max }) {
  return (
    <div style={{ marginTop: 6, background: "#fff", borderRadius: 13, border: `1px solid ${LINE}`,
      boxShadow: "0 12px 28px rgba(60,50,35,.10)", overflow: "hidden", maxHeight: max || 300, overflowY: "auto" }}>
      {children}
    </div>
  );
}

function OtherRow({ active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ width: "100%", padding: "12px 15px", textAlign: "right", cursor: "pointer",
        background: active ? "#FBF7F0" : "transparent", border: "none", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: GOLD, fontSize: 16, width: 21, textAlign: "center" }}>+</span>
      <span style={{ fontSize: 14.5, color: GOLD, fontWeight: 500 }}>سایر</span>
    </button>
  );
}

export default function ChalkForm() {
  const [type, setType] = useState("snooker");
  const [brand, setBrand] = useState(null);
  const [model, setModel] = useState(null);
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState("");
  const [cb, setCb] = useState("");
  const [cm, setCm] = useState("");
  const [v, setV] = useState({});
  const [cust, setCust] = useState({});

  const set = (k, x) => setV(p => ({ ...p, [k]: x }));
  const tObj = D.t.find(t => t.id === type);
  const otherBrand = brand === "__other";
  const otherModel = model === "__other";
  const bObj = otherBrand ? null : (tObj.b.find(b => b.id === brand) || null);
  const mObj = bObj && !otherModel ? bObj.m.find(m => m.id === model) : null;

  const brandList = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tObj.b;
    return tObj.b.filter(b => b.en.toLowerCase().includes(s) || b.fa.includes(s) ||
      (b.c && D.cof[b.c].includes(s)));
  }, [q, tObj]);

  const resetAll = () => { setBrand(null); setModel(null); setCb(""); setCm(""); setOpen(null); setQ(""); };

  const specs = D.sp.filter(f => f.t !== "boolean" && !(f.dep === "has_holder" && !v.has_holder));
  const toggles = D.sp.filter(f => f.t === "boolean");
  const filled = Object.values(v).filter(x => x !== "" && x != null).length;

  const renderSpec = f => {
    if (f.t === "number") return (
      <div key={f.id} style={{ marginBottom: 20 }}>
        <Label help={f.h}>{f.l}</Label>
        <input type="number" inputMode="numeric" value={v[f.id] || ""} placeholder={f.p}
          onChange={e => set(f.id, e.target.value)} style={inp(false)} />
        {f.c && (
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {f.c.map(n => (
              <button key={n} type="button" onClick={() => set(f.id, String(n))}
                style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12.5, cursor: "pointer", border: "none",
                  background: String(v[f.id]) === String(n) ? GOLD : "#F4F2EF",
                  color: String(v[f.id]) === String(n) ? "#fff" : MUTE }}>{n}</button>
            ))}
          </div>
        )}
      </div>
    );
    const isOther = v[f.id] === "__other";
    const sel = (f.o || []).find(o => o.id === v[f.id]);
    const dot = f.id === "color" && v[f.id] && SWATCH[v[f.id]];
    return (
      <div key={f.id} style={{ marginBottom: 20 }}>
        <Label help={f.h}>{f.l}</Label>
        <Trigger open={open === f.id} onClick={() => setOpen(open === f.id ? null : f.id)}
          value={isOther ? "سایر" : sel && sel.l} dot={dot} placeholder="انتخاب..." />
        {open === f.id && (
          <Panel>
            {(f.o || []).map(o => (
              <button key={o.id} type="button" onClick={() => { set(f.id, o.id); setOpen(null); }}
                style={{ width: "100%", padding: "11px 15px", textAlign: "right", cursor: "pointer", display: "block",
                  background: v[f.id] === o.id ? "#FBF7F0" : "transparent", border: "none", borderBottom: `1px solid ${LINE}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  {f.id === "color" && (
                    <span style={{ width: 15, height: 15, borderRadius: 99, background: SWATCH[o.id] || "#ccc",
                      border: "1px solid rgba(0,0,0,.15)", flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 14.5, color: INK }}>{o.l}</span>
                </div>
                {o.n && <div style={{ fontSize: 11, color: MUTE, marginTop: 3, lineHeight: 1.6,
                  paddingInlineStart: f.id === "color" ? 24 : 0 }}>{o.n}</div>}
              </button>
            ))}
            {f.ao && <OtherRow active={isOther} onClick={() => { set(f.id, "__other"); setOpen(null); }} />}
          </Panel>
        )}
        {isOther && (
          <input autoFocus maxLength={60} value={cust[f.id] || ""}
            onChange={e => setCust(p => ({ ...p, [f.id]: e.target.value }))}
            placeholder="وارد کنید" style={{ ...inp(true, true), marginTop: 8 }} />
        )}
      </div>
    );
  };

  return (
    <div dir="rtl" style={{ background: PAGE, minHeight: "100vh", padding: "14px 12px 40px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexDirection: "row-reverse", justifyContent: "flex-end" }}>
          {[["۱", "اطلاعات محصول", 1], ["۲", "اطلاعات فروشنده", 0], ["۳", "ثبت نهایی", 0]].map(([n, t, on]) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999,
              background: on ? "#FDFBF7" : "#EAE7E2", border: `1px solid ${on ? GOLD_SOFT : "transparent"}`,
              fontSize: 12, color: on ? INK : "#A9A49C", whiteSpace: "nowrap" }}>
              <span style={{ width: 19, height: 19, borderRadius: 999, display: "grid", placeItems: "center",
                background: on ? GOLD : "#CFCAC2", color: "#fff", fontSize: 11 }}>{n}</span>
              {t}
            </div>
          ))}
        </div>

        {/* کارت اطلاعات محصول */}
        <div style={{ background: "#fff", borderRadius: 22, padding: "20px 17px", marginBottom: 14, boxShadow: "0 2px 14px rgba(70,60,45,.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20, flexDirection: "row-reverse", justifyContent: "flex-end" }}>
            <span style={{ width: 3, height: 19, background: GOLD, borderRadius: 2 }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: INK, margin: 0 }}>اطلاعات محصول</h2>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Label req>دسته‌بندی</Label>
            <div style={{ padding: "12px 15px", borderRadius: 13, background: "#F4F2EF", border: `1.5px solid ${LINE}`, fontSize: 15, color: INK }}>گچ</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Label req>نوع</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {D.t.map(t => (
                <button key={t.id} type="button" onClick={() => { setType(t.id); resetAll(); }}
                  style={{ padding: "9px 14px", borderRadius: 10, fontSize: 13.5, cursor: "pointer", border: "none",
                    background: type === t.id ? GOLD : "#F4F2EF", color: type === t.id ? "#fff" : MUTE,
                    fontWeight: type === t.id ? 700 : 500 }}>{t.l}</button>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: MUTE, marginTop: 10, lineHeight: 1.85 }}>{tObj.n}</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Label req help="برند را انتخاب کنید تا مدل‌های همان برند نمایش داده شود.">برند</Label>
            <Trigger open={open === "b"} onClick={() => setOpen(open === "b" ? null : "b")}
              value={otherBrand ? "سایر" : bObj && bObj.en} flag={otherBrand ? null : bObj && bObj.c}
              placeholder="انتخاب برند..." />
            {open === "b" && (
              <Panel max={330}>
                <div style={{ padding: 10, borderBottom: `1px solid ${LINE}`, position: "sticky", top: 0, background: "#fff" }}>
                  <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                    placeholder="جستجوی برند یا کشور..." style={{ ...inp(false), padding: "10px 13px", fontSize: 14 }} />
                </div>
                {brandList.map(b => (
                  <button key={b.id} type="button" onClick={() => { setBrand(b.id); setModel(null); setCm(""); setOpen(null); setQ(""); }}
                    style={{ width: "100%", padding: "11px 15px", textAlign: "right", cursor: "pointer", display: "block",
                      background: brand === b.id ? "#FBF7F0" : "transparent", border: "none", borderBottom: `1px solid ${LINE}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Flag code={b.c} />
                      <span style={{ fontSize: 14.5, color: INK, fontWeight: 500 }}>{b.en}</span>
                      <span style={{ fontSize: 12, color: MUTE }}>{b.fa}</span>
                      {b.tier === "tournament" && (
                        <span style={{ fontSize: 9.5, color: GOLD, border: `1px solid ${GOLD_SOFT}`, borderRadius: 5, padding: "1px 5px" }}>حرفه‌ای</span>
                      )}
                      <span style={{ marginInlineStart: "auto", fontSize: 11, color: "#B5B0A8" }}>{b.m.length}</span>
                    </div>
                    {b.n && <div style={{ fontSize: 11, color: MUTE, marginTop: 3, lineHeight: 1.6, paddingInlineStart: 29 }}>{b.n}</div>}
                  </button>
                ))}
                <OtherRow active={otherBrand} onClick={() => { setBrand("__other"); setModel(null); setOpen(null); }} />
              </Panel>
            )}
            {otherBrand && (
              <input autoFocus value={cb} onChange={e => setCb(e.target.value)} maxLength={60}
                placeholder="نام برند" style={{ ...inp(true, true), marginTop: 8 }} />
            )}
          </div>

          <div>
            <Label help="مثال: Taom V10 Green">مدل</Label>
            {otherBrand ? (
              <input value={cm} onChange={e => setCm(e.target.value)} maxLength={60}
                placeholder="نام مدل (اختیاری)" style={inp(false)} />
            ) : (
              <>
                <Trigger open={open === "m"} disabled={!brand} onClick={() => setOpen(open === "m" ? null : "m")}
                  value={otherModel ? "سایر" : mObj && mObj.en}
                  placeholder={brand ? "انتخاب مدل..." : "ابتدا برند را انتخاب کنید"} />
                {open === "m" && (
                  <Panel max={330}>
                    {bObj.m.map(m => (
                      <button key={m.id} type="button" onClick={() => { setModel(m.id); setOpen(null); }}
                        style={{ width: "100%", padding: "11px 15px", textAlign: "right", cursor: "pointer", display: "block",
                          background: model === m.id ? "#FBF7F0" : "transparent", border: "none", borderBottom: `1px solid ${LINE}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14.5, color: INK, fontWeight: 500 }}>{m.en}</span>
                          <span style={{ fontSize: 12, color: MUTE }}>{m.fa}</span>
                          {m.col && (
                            <span style={{ marginInlineStart: "auto", fontSize: 10.5, color: MUTE,
                              background: "#F4F2EF", padding: "2px 8px", borderRadius: 6 }}>{m.col}</span>
                          )}
                        </div>
                        {m.n && <div style={{ fontSize: 11, color: MUTE, marginTop: 4, lineHeight: 1.65 }}>{m.n}</div>}
                      </button>
                    ))}
                    <OtherRow active={otherModel} onClick={() => { setModel("__other"); setOpen(null); }} />
                  </Panel>
                )}
                {otherModel && (
                  <input autoFocus value={cm} onChange={e => setCm(e.target.value)} maxLength={60}
                    placeholder="نام مدل" style={{ ...inp(true, true), marginTop: 8 }} />
                )}
              </>
            )}
          </div>
        </div>

        {/* کارت مشخصات فنی */}
        <div style={{ background: "#fff", borderRadius: 22, padding: "20px 17px", boxShadow: "0 2px 14px rgba(70,60,45,.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18, flexDirection: "row-reverse", justifyContent: "flex-end" }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: GOLD, display: "grid", placeItems: "center" }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3.2" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
              </svg>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: GOLD_SOFT, fontWeight: 700 }}>SPECIFICATIONS</div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: INK, margin: "2px 0 0" }}>مشخصات فنی — گچ</h2>
            </div>
          </div>

          {specs.map(renderSpec)}

          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 18, marginTop: 4 }}>
            {toggles.map(f => (
              <div key={f.id} style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ textAlign: "right", flex: 1 }}>
                  <div style={{ fontSize: 13.5, color: INK, fontWeight: 600 }}>{f.l}</div>
                  {f.h && <div style={{ fontSize: 11.5, color: MUTE, marginTop: 3, lineHeight: 1.6 }}>{f.h}</div>}
                </div>
                <button type="button" onClick={() => set(f.id, !v[f.id])}
                  style={{ width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", flexShrink: 0,
                    background: v[f.id] ? GOLD : "#DDD8D1", position: "relative", transition: "background .2s" }}>
                  <span style={{ position: "absolute", top: 3, right: v[f.id] ? 22 : 3, width: 21, height: 21,
                    borderRadius: 999, background: "#fff", transition: "right .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 18, marginTop: 4 }}>
            <Label req>وضعیت کالا</Label>
            <Trigger open={open === "cond"} onClick={() => setOpen(open === "cond" ? null : "cond")}
              value={(D.cond.find(c => c.id === v.cond) || {}).l} placeholder="انتخاب..." />
            {open === "cond" && (
              <Panel>
                {D.cond.map(c => (
                  <button key={c.id} type="button" onClick={() => { set("cond", c.id); setOpen(null); }}
                    style={{ width: "100%", padding: "11px 15px", textAlign: "right", cursor: "pointer", display: "block",
                      background: v.cond === c.id ? "#FBF7F0" : "transparent", border: "none", borderBottom: `1px solid ${LINE}`,
                      fontSize: 14.5, color: INK }}>{c.l}</button>
                ))}
              </Panel>
            )}
          </div>
        </div>

        {(bObj || (otherBrand && cb)) && (
          <div style={{ marginTop: 14, padding: "13px 16px", borderRadius: 14, background: "#FBF7F0", border: `1px solid ${GOLD_SOFT}` }}>
            <div style={{ fontSize: 11, color: MUTE, marginBottom: 5 }}>ثبت می‌شود</div>
            <div style={{ fontSize: 14.5, color: INK, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
              {bObj && <Flag code={bObj.c} />}
              <span>
                {tObj.l} · {otherBrand ? cb : bObj.en}
                {(otherModel ? cm : mObj && mObj.en) ? ` · ${otherModel ? cm : mObj.en}` : ""}
              </span>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#B5B0A8", marginTop: 16, lineHeight: 1.8 }}>
          {`${tObj.b.length} برند و ${tObj.b.reduce((s, b) => s + b.m.length, 0)} مدل برای ${tObj.l} — ${filled} فیلد تکمیل شد`}
        </p>

      </div>
    </div>
  );
}
