import { useState, useMemo } from "react";

const D = {"cue":[{"id":"length_cm","l":"طول (سانتی‌متر)","t":"number","h":"اسنوکر: ۱۴۵ تا ۱۴۸ (۵۷ تا ۵۸ اینچ) — پول: ۱۴۷ (۵۸ اینچ)","p":"147","c":[140,145,147,148,150]},{"id":"weight_oz","l":"وزن (اونس)","t":"number","h":"اسنوکر: ۱۶ تا ۱۹ — پول آمریکایی: ۱۸ تا ۲۱ — هی‌بال: ۱۸ تا ۲۰","p":"19"},{"id":"tip_diameter","l":"قطر تیپ (میلی‌متر)","t":"number","h":"اسنوکر: ۸.۵ تا ۱۰ — پول انگلیسی: ۸ تا ۹ — پول آمریکایی: ۱۱.۸ تا ۱۳ — هی‌بال: ۱۰.۵ تا ۱۱.۵","p":"9.5"},{"id":"butt_diameter","l":"قطر بات (میلی‌متر)","t":"number","p":"30"},{"id":"balance_point","l":"نقطه تعادل (اینچ از بات)","t":"number","h":"معمولاً ۱۶ تا ۱۸ اینچ. عدد بالاتر یعنی چوب جلوسنگین‌تر.","p":"17"},{"id":"shaft_material","l":"جنس شفت","t":"select","h":"زبان‌گنجشک انعطاف و رگه‌های دیدنی — افرا سفت‌تر و صاف‌تر — کربن کمترین انحراف.","ao":true,"o":[{"id":"ash","l":"زبان‌گنجشک (Ash)","n":"سنتی و رایج‌ترین در اسنوکر"},{"id":"maple","l":"افرا (Maple)","n":"استاندارد پول آمریکایی، سفت‌تر"},{"id":"hard-rock-maple","l":"افرا سخت آمریکای شمالی"},{"id":"carbon","l":"کربن فایبر","n":"کم‌انحراف، مدرن"},{"id":"fiberglass","l":"فایبرگلاس"},{"id":"laminated","l":"لمینت (چندلایه)","n":"مثل G-Core مک‌درموت"}]},{"id":"shaft_grade","l":"گرید شفت","t":"select","h":"مهم‌ترین عامل قیمت در چوب‌های دست‌ساز. سه فاکتور: استحکام، چگالی، فلکس.","ao":true,"o":[{"id":"standard","l":"استاندارد / کلاسیک"},{"id":"premium","l":"پریمیوم"},{"id":"ultimate","l":"اولتیمیت"},{"id":"pro","l":"پرو شفت"},{"id":"full-shaft","l":"شفت یکسره (FS)","n":"بدون اتصال و امتداد"}]},{"id":"butt_material","l":"جنس بات","t":"select","ao":true,"o":[{"id":"ebony","l":"آبنوس (Ebony)","n":"رایج‌ترین، مشکی"},{"id":"rosewood","l":"رزوود"},{"id":"cocobolo","l":"کوکوبولو"},{"id":"snakewood","l":"اسنیک‌وود"},{"id":"thuya-burr","l":"توئیا بور"},{"id":"olivewood","l":"زیتون"},{"id":"kingwood","l":"کینگ‌وود"},{"id":"tulipwood","l":"تولیپ‌وود"},{"id":"amboyna","l":"آمبوینا"},{"id":"ebonised","l":"چوب مشکی‌شده","n":"در Riley/BCE"},{"id":"exotic-mixed","l":"ترکیب چوب‌های اگزوتیک"},{"id":"linen-wrap","l":"با روکش کتان"},{"id":"leather-wrap","l":"با روکش چرم"}]},{"id":"splice_type","l":"نوع اسپلایس","t":"select","h":"دست‌اسپلایس نوک‌های گرد دارد، ماشین‌اسپلایس نوک تیز.","ao":true,"o":[{"id":"hand-spliced","l":"دست‌اسپلایس","n":"نشانه چوب باکیفیت"},{"id":"machine-spliced","l":"ماشین‌اسپلایس"},{"id":"plain","l":"بدون اسپلایس (ساده)"},{"id":"4-splice","l":"۴ اسپلایس"},{"id":"8-splice","l":"۸ اسپلایس"},{"id":"12-splice","l":"۱۲ اسپلایس"},{"id":"16-splice","l":"۱۶ اسپلایس"}]},{"id":"ferrule","l":"جنس فرول","t":"select","h":"برنجی سنتی و سنگین‌تر — تیتانیوم سبک‌تر و سخت‌تر.","ao":true,"o":[{"id":"brass","l":"برنج","n":"سنتی و رایج"},{"id":"titanium","l":"تیتانیوم","n":"سبک‌تر، انحراف کمتر"},{"id":"stainless","l":"استیل ضدزنگ"},{"id":"phenolic","l":"فنولیک"},{"id":"juma","l":"JUMA"},{"id":"carbon-ferrule","l":"کربن"},{"id":"plastic","l":"پلاستیک"}]},{"id":"tip_brand","l":"برند تیپ","t":"select","ao":true,"o":[{"id":"elkmaster","l":"Elkmaster","n":"نرم، رایج‌ترین در اسنوکر"},{"id":"kamui","l":"Kamui","n":"ژاپنی، لایه‌لایه، حرفه‌ای"},{"id":"blue-diamond","l":"Blue Diamond"},{"id":"tiger","l":"Tiger (Everest / Onyx / Sniper / Emerald)"},{"id":"talisman","l":"Talisman"},{"id":"moori","l":"Moori"},{"id":"zan","l":"Zan"},{"id":"predator-victory","l":"Predator Victory","n":"استاندارد شفت REVO"},{"id":"navigator","l":"Navigator"},{"id":"g2","l":"G2"},{"id":"taom","l":"Taom"},{"id":"prospin","l":"ProSpin"},{"id":"le-pro","l":"Le Pro"},{"id":"triangle","l":"Triangle"},{"id":"aramith-tip","l":"Aramith"}]},{"id":"tip_hardness","l":"سختی تیپ","t":"select","o":[{"id":"super-soft","l":"خیلی نرم"},{"id":"soft","l":"نرم","n":"چسبندگی بیشتر، اسپین بالاتر"},{"id":"medium","l":"متوسط","n":"انتخاب اکثر حرفه‌ای‌ها"},{"id":"hard","l":"سخت","n":"دوام بیشتر، مناسب بریک"}]},{"id":"tip_construction","l":"ساختار تیپ","t":"select","o":[{"id":"single-layer","l":"تک‌لایه"},{"id":"layered","l":"لایه‌لایه (لمینت)"},{"id":"phenolic-tip","l":"فنولیک","n":"مخصوص بریک و جامپ"}]},{"id":"pieces","l":"تعداد تکه","t":"select","ao":true,"o":[{"id":"1pc","l":"یک‌تکه","n":"بدون اتصال، انتقال حس بهتر"},{"id":"2pc","l":"دوتکه (اتصال وسط)"},{"id":"3-4","l":"سه‌چهارم (۳/۴)","n":"رایج‌ترین در اسنوکر حرفه‌ای"},{"id":"3pc","l":"سه‌تکه"},{"id":"4-5","l":"چهارپنجم"}]},{"id":"joint_position","l":"محل اتصال","t":"select","ao":true,"o":[{"id":"12in","l":"۱۲ اینچ از بات"},{"id":"16in","l":"۱۶ اینچ از بات","n":"رایج‌ترین در ۳/۴"},{"id":"18in","l":"۱۸ اینچ از بات"},{"id":"centre","l":"وسط چوب"}]},{"id":"joint_material","l":"جنس اتصال","t":"select","ao":true,"o":[{"id":"brass-joint","l":"برنج"},{"id":"stainless-joint","l":"استیل ضدزنگ"},{"id":"titanium-joint","l":"تیتانیوم"},{"id":"uni-loc","l":"Uni-Loc","n":"سیستم پردیتور"},{"id":"radial","l":"Radial Pin"},{"id":"3-8-10","l":"3/8-10 Pin"},{"id":"wood-joint","l":"چوب به چوب","n":"در کارامبول"},{"id":"sd-joint","l":"SD Joint","n":"استاندارد Ton Praram"},{"id":"quick-release","l":"اتصال سریع"}]},{"id":"has_extension","l":"همراه با اکستنشن","t":"boolean"},{"id":"has_mini_butt","l":"همراه با مینی‌بات","t":"boolean"},{"id":"has_case","l":"همراه با کیف","t":"boolean"},{"id":"has_butt_joint","l":"دارای اتصال انتهای بات","t":"boolean","h":"برای نصب اکستنشن"},{"id":"finish","l":"نوع فینیش","t":"select","ao":true,"o":[{"id":"oiled","l":"روغن‌خورده","n":"حس طبیعی چوب، رایج در دست‌سازها"},{"id":"waxed","l":"واکس‌خورده"},{"id":"lacquered","l":"لاک‌خورده"},{"id":"matte","l":"مات"},{"id":"gloss","l":"براق"}]},{"id":"serial_number","l":"شماره سریال / پلاک","t":"text","h":"در چوب‌های دست‌ساز نخبه (مثل John Parris Ultimate) شماره روی پلاک حک شده و برای اصالت مهم است."}],"table":[{"id":"size","l":"اندازه","t":"select","ao":true,"src":"types[].sizes"},{"id":"frame_material","l":"جنس بدنه","t":"select","h":"چوب بدنه و پایه‌ها. بدنه سنگین چوب سخت، لرزش را کم می‌کند.","ao":true,"o":[{"id":"mahogany","l":"ماهگونی (چوب ماهون)","n":"رایج‌ترین چوب میزهای کلاسیک انگلیسی"},{"id":"oak","l":"بلوط"},{"id":"walnut","l":"گردو"},{"id":"ash-frame","l":"زبان‌گنجشک"},{"id":"beech","l":"راش"},{"id":"teak","l":"ساج"},{"id":"african-hardwood","l":"چوب سخت آفریقایی","n":"در مدل‌های Rasson"},{"id":"solid-hardwood","l":"چوب سخت (نامشخص)"},{"id":"hpl-wood","l":"چوب + روکش HPL"},{"id":"aluminium","l":"آلومینیوم / آلیاژ","n":"در میزهای مدرن مثل Rasson و Diamond"},{"id":"steel","l":"فلز / فولاد"},{"id":"mdf","l":"ام‌دی‌اف","n":"میزهای اقتصادی و خانگی"},{"id":"chipboard","l":"نئوپان"}]},{"id":"bed_material","l":"جنس سطح بازی","t":"select","h":"مهم‌ترین عامل کیفیت میز. سنگ اسلیت استاندارد حرفه‌ای است.","ao":true,"o":[{"id":"slate-italian","l":"سنگ اسلیت ایتالیایی","n":"تیره‌تر، ریزدانه، رایج در میزهای حرفه‌ای"},{"id":"slate-brazilian","l":"سنگ اسلیت برزیلی","n":"چگال و مقاوم"},{"id":"slate-welsh","l":"سنگ اسلیت ولزی","n":"میزهای آنتیک انگلیسی، بسیار سنگین"},{"id":"slate-chinese","l":"سنگ اسلیت چینی","n":"روشن‌تر، نرم‌تر، معمولاً ۵۰ میلی‌متر"},{"id":"slate-unknown","l":"سنگ اسلیت (مبدأ نامشخص)"},{"id":"slatron","l":"اسلاترون / سنگ مصنوعی"},{"id":"mdf-bed","l":"ام‌دی‌اف","n":"میزهای خانگی و اقتصادی"}]},{"id":"slate_thickness","l":"ضخامت سنگ (میلی‌متر)","t":"number","h":"حرفه‌ای: ۴۵ تا ۵۰ میلی‌متر — میز پول: ۲۵ تا ۳۰ — خانگی: زیر ۲۰","p":"45","c":[19,25,30,38,45,50,60]},{"id":"slate_pieces","l":"تعداد تکه سنگ","t":"select","h":"میز اسنوکر ۱۲ فوت معمولاً ۵ تکه، میز پول ۳ تکه، میز کوچک یک‌تکه.","ao":true,"o":[{"id":"1","l":"یک‌تکه"},{"id":"3","l":"سه‌تکه"},{"id":"5","l":"پنج‌تکه"}]},{"id":"cloth_brand","l":"برند پارچه","t":"select","ao":true,"o":[{"id":"strachan","l":"Strachan (استراکان)","n":"انگلیسی، رایج در اسنوکر: 6811، 777، No.10"},{"id":"hainsworth","l":"Hainsworth (هینزورث)","n":"انگلیسی: Elite Pro، Match، Smart"},{"id":"simonis","l":"Iwan Simonis (سیمونیس)","n":"بلژیکی، استاندارد پول: 860، 760، 920"},{"id":"championship","l":"Championship (چمپیون‌شیپ)","n":"آمریکایی: Tour Edition، Saturn"},{"id":"gorina","l":"Gorina (گورینا)"},{"id":"aramith-cloth","l":"Aramith"},{"id":"milliken","l":"Milliken"},{"id":"chinese-cloth","l":"چینی / بدون برند"}]},{"id":"cloth_type","l":"نوع پارچه","t":"select","h":"پرزدار (napped) بازی کندتر و کنترل بیشتر — بدون‌پرز (worsted) سریع‌تر و صاف‌تر.","ao":true,"o":[{"id":"napped","l":"پرزدار / جهت‌دار","n":"استاندارد اسنوکر و پول انگلیسی"},{"id":"worsted","l":"بدون پرز / فاستونی","n":"استاندارد پول آمریکایی و کارامبول"},{"id":"wool-nylon","l":"پشم + نایلون"},{"id":"pure-wool","l":"۱۰۰٪ پشم"},{"id":"synthetic","l":"مصنوعی"}]},{"id":"cloth_weight","l":"وزن پارچه (اونس)","t":"select","ao":true,"o":[{"id":"29","l":"۲۹ اونس"},{"id":"30","l":"۳۰ اونس"},{"id":"32","l":"۳۲ اونس"},{"id":"12","l":"۱۲ اونس (پول)"}]},{"id":"cloth_color","l":"رنگ پارچه","t":"select","ao":true,"o":[{"id":"english-green","l":"سبز انگلیسی"},{"id":"tournament-green","l":"سبز تورنمنت"},{"id":"blue","l":"آبی"},{"id":"tournament-blue","l":"آبی تورنمنت"},{"id":"powder-blue","l":"آبی روشن"},{"id":"red","l":"قرمز"},{"id":"burgundy","l":"زرشکی"},{"id":"black","l":"مشکی"},{"id":"grey","l":"خاکستری"},{"id":"gold","l":"طلایی / کرم"},{"id":"purple","l":"بنفش"},{"id":"orange","l":"نارنجی"}]},{"id":"cushion_type","l":"نوع باند","t":"select","h":"باند استیل‌بلاک صفحه فولادی بین لاستیک و چوب دارد؛ برگشت توپ سریع‌تر و یکنواخت‌تر.","ao":true,"o":[{"id":"steel-block-l","l":"استیل بلاک نوع L","n":"مشخصات رسمی World Snooker Tour"},{"id":"steel-block-i","l":"استیل بلاک نوع I"},{"id":"steel-block","l":"استیل بلاک (نوع نامشخص)"},{"id":"wooden","l":"باند چوبی سنتی","n":"لاستیک مستقیم روی چوب سخت"},{"id":"laminate","l":"باند لمینت رزینی"},{"id":"slate-block","l":"بلوک سنگی (آدامانت)","n":"سیستم قدیمی Thurston"}]},{"id":"cushion_rubber","l":"لاستیک باند","t":"select","h":"پروفیل L برای اسنوکر، K66 استاندارد پول، K55 برای برانزویک و کارامبول.","ao":true,"o":[{"id":"l-shape","l":"پروفیل L (اسنوکر)"},{"id":"k66","l":"پروفیل K66","n":"استاندارد اکثر میزهای پول"},{"id":"k55","l":"پروفیل K55","n":"برانزویک و میزهای کارامبول"},{"id":"u23","l":"پروفیل U23"},{"id":"northern","l":"Northern Rubber","n":"انگلیسی، رایج در اسنوکر"},{"id":"artemis","l":"Artemis"},{"id":"klematch","l":"Klematch P59","n":"در Rasson Victory"},{"id":"k55-max","l":"Rasson MAX (K55)"},{"id":"accu-fast","l":"Accu-Fast (Olhausen)"}]},{"id":"pocket_type","l":"نوع پاکت","t":"select","ao":true,"o":[{"id":"leather-net","l":"چرمی با تور","n":"استاندارد اسنوکر"},{"id":"tpr","l":"TPR (پلاستیک ترموپلاستیک)","n":"در Rasson؛ بی‌صدا و ضدخش"},{"id":"drop-pocket","l":"پاکت افتادنی"},{"id":"ball-return","l":"سیستم برگشت توپ","n":"میزهای باشگاهی و سکه‌ای"},{"id":"gully","l":"گالی"}]},{"id":"has_heating","l":"سیستم گرمکن زیر میز","t":"boolean","h":"در میزهای تورنمنتی اسنوکر برای ثابت نگه‌داشتن رطوبت پارچه"},{"id":"leveling_system","l":"سیستم تراز","t":"select","ao":true,"o":[{"id":"micro-adjust","l":"پیچ تراز میکرو"},{"id":"sls-lls","l":"SLS / LLS (Rasson)"},{"id":"standard","l":"پایه تراز معمولی"},{"id":"none","l":"بدون سیستم تراز"}]},{"id":"has_coin","l":"سکه‌ای / کوین‌آپ","t":"boolean"},{"id":"is_dining","l":"قابلیت تبدیل به میز غذاخوری","t":"boolean"},{"id":"has_lighting","l":"همراه با چراغ بالای میز","t":"boolean"},{"id":"accessories_included","l":"لوازم همراه","t":"multi_select","o":[{"id":"balls","l":"توپ"},{"id":"cues","l":"چوب"},{"id":"rest","l":"رست / اسپایدر"},{"id":"triangle","l":"مثلث"},{"id":"scoreboard","l":"تابلو امتیاز"},{"id":"cover","l":"روکش میز"},{"id":"brush","l":"برس و لوازم نگهداری"},{"id":"light","l":"چراغ"},{"id":"iron","l":"اتوی میز"}]}],"cond":[{"id":"new","l":"نو / آکبند"},{"id":"like-new","l":"در حد نو"},{"id":"used-excellent","l":"کارکرده - عالی"},{"id":"used-good","l":"کارکرده - خوب"},{"id":"used-fair","l":"کارکرده - متوسط"},{"id":"needs-repair","l":"نیازمند تعمیر"},{"id":"refurbished","l":"بازسازی‌شده"}],"sizes":{"pocket_billiard":[{"id":"9ft","l":"۹ فوت (استاندارد حرفه‌ای)","a":"254×127"},{"id":"8ft-pro","l":"۸ فوت پرو","a":"233×116"},{"id":"8ft","l":"۸ فوت","a":"223×111"},{"id":"7ft","l":"۷ فوت","a":"198×99"},{"id":"6ft","l":"۶ فوت","a":"177×88"},{"id":"5ft","l":"۵ فوت","a":"152×76"}],"snooker":[{"id":"12ft","l":"۱۲ فوت (تمام‌سایز)","a":"356×178"},{"id":"10ft","l":"۱۰ فوت","a":"305×152"},{"id":"9ft","l":"۹ فوت (سه‌چهارم)","a":"274×137"},{"id":"8ft","l":"۸ فوت","a":"233×115"},{"id":"7ft","l":"۷ فوت","a":"206×99"},{"id":"6ft","l":"۶ فوت","a":"175×84"}],"heyball":[{"id":"9ft","l":"۹ فوت (استاندارد)","a":"254×127"},{"id":"8ft","l":"۸ فوت","a":"223×111"}],"carom":[{"id":"284","l":"۲.۸۴ × ۱.۴۲ متر (مچ)","a":"284×142"},{"id":"230","l":"۲.۳۰ × ۱.۱۵ متر","a":"230×115"},{"id":"210","l":"۲.۱۰ × ۱.۰۵ متر","a":"210×105"}],"home_table":[{"id":"9ft","l":"۹ فوت","a":"254×127"},{"id":"8ft","l":"۸ فوت","a":"223×111"},{"id":"7ft","l":"۷ فوت","a":"198×99"},{"id":"6ft","l":"۶ فوت","a":"177×88"},{"id":"5ft","l":"۵ فوت","a":"152×76"},{"id":"4ft","l":"۴ فوت و کوچک‌تر","a":"122×61"}]},"types":[{"id":"pocket_billiard","l":"پاکت بیلیارد"},{"id":"snooker","l":"اسنوکر"},{"id":"heyball","l":"هی‌بال"},{"id":"carom","l":"کارامبول"},{"id":"home_table","l":"میز خانگی"}]};

const GOLD = "#B08D57", GOLD_SOFT = "#D9C4A3", PAGE = "#F1EFEB";
const INK = "#2C2A27", MUTE = "#8C877F", LINE = "#E8E4DE", FIELD = "#FAF9F7";

function Chevron({ open }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Card({ title, kicker, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 22, padding: "20px 17px", marginBottom: 14, boxShadow: "0 2px 14px rgba(70,60,45,.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18, flexDirection: "row-reverse", justifyContent: "flex-end" }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: GOLD, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3.2" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
          </svg>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: GOLD_SOFT, fontWeight: 700 }}>{kicker}</div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: INK, margin: "2px 0 0" }}>{title}</h2>
        </div>
      </div>
      {children}
    </div>
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

const inputStyle = focused => ({
  width: "100%", padding: "12px 15px", borderRadius: 13, background: FIELD,
  border: `1.5px solid ${focused ? GOLD : LINE}`, fontSize: 15, color: INK,
  outline: "none", textAlign: "right", boxSizing: "border-box",
});

function NumField({ f, value, onChange }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <Label help={f.h}>{f.l}</Label>
      <input type="number" value={value || ""} placeholder={f.p} inputMode="decimal"
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        onChange={e => onChange(e.target.value)} style={inputStyle(foc)} />
      {f.c && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {f.c.map(n => (
            <button key={n} type="button" onClick={() => onChange(String(n))}
              style={{
                padding: "5px 12px", borderRadius: 8, fontSize: 12.5, cursor: "pointer",
                background: String(value) === String(n) ? GOLD : "#F4F2EF",
                color: String(value) === String(n) ? "#fff" : MUTE,
                border: "none",
              }}>{n}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function TextField({ f, value, onChange }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <Label help={f.h}>{f.l}</Label>
      <input value={value || ""} maxLength={f.max_length || 60}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        onChange={e => onChange(e.target.value)} style={inputStyle(foc)} />
    </div>
  );
}

function Toggle({ f, value, onChange }) {
  return (
    <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ textAlign: "right", flex: 1 }}>
        <div style={{ fontSize: 13.5, color: INK, fontWeight: 600 }}>{f.l}</div>
        {f.h && <div style={{ fontSize: 11.5, color: MUTE, marginTop: 3, lineHeight: 1.6 }}>{f.h}</div>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        style={{
          width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", flexShrink: 0,
          background: value ? GOLD : "#DDD8D1", position: "relative", transition: "background .2s",
        }}>
        <span style={{
          position: "absolute", top: 3, right: value ? 22 : 3, width: 21, height: 21,
          borderRadius: 999, background: "#fff", transition: "right .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }} />
      </button>
    </div>
  );
}

function SelectField({ f, value, custom, onChange, onCustom, options }) {
  const [open, setOpen] = useState(false);
  const opts = options || f.o || [];
  const isOther = value === "__other";
  const sel = opts.find(o => o.id === value);
  return (
    <div style={{ marginBottom: 20 }}>
      <Label help={f.h}>{f.l}</Label>
      <button type="button" onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 15px", borderRadius: 13, textAlign: "right", cursor: "pointer",
          background: FIELD, border: `1.5px solid ${open ? GOLD : LINE}`,
          boxShadow: open ? `0 0 0 3px ${GOLD}22` : "none", fontSize: 15,
          color: sel || isOther ? INK : MUTE,
        }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {isOther ? "سایر" : sel ? sel.l : "انتخاب..."}
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div style={{
          marginTop: 6, background: "#fff", borderRadius: 13, border: `1px solid ${LINE}`,
          boxShadow: "0 12px 28px rgba(60,50,35,.10)", overflow: "hidden", maxHeight: 300, overflowY: "auto",
        }}>
          {opts.map(o => (
            <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); }}
              style={{
                width: "100%", padding: "11px 15px", textAlign: "right", cursor: "pointer",
                background: value === o.id ? "#FBF7F0" : "transparent",
                border: "none", borderBottom: `1px solid ${LINE}`, display: "block",
              }}>
              <div style={{ fontSize: 14.5, color: INK }}>
                {o.l}
                {o.a && <span style={{ fontSize: 11.5, color: MUTE, marginInlineStart: 8 }}>{o.a} سانتی‌متر</span>}
              </div>
              {o.n && <div style={{ fontSize: 11, color: MUTE, marginTop: 3, lineHeight: 1.6 }}>{o.n}</div>}
            </button>
          ))}
          {f.ao !== false && (
            <button type="button" onClick={() => { onChange("__other"); setOpen(false); }}
              style={{
                width: "100%", padding: "11px 15px", textAlign: "right", cursor: "pointer",
                background: isOther ? "#FBF7F0" : "transparent", border: "none", display: "flex",
                alignItems: "center", gap: 8,
              }}>
              <span style={{ color: GOLD, fontSize: 16 }}>+</span>
              <span style={{ fontSize: 14.5, color: GOLD, fontWeight: 500 }}>سایر</span>
            </button>
          )}
        </div>
      )}
      {isOther && (
        <input autoFocus value={custom || ""} maxLength={60} onChange={e => onCustom(e.target.value)}
          placeholder="وارد کنید"
          style={{ ...inputStyle(true), marginTop: 8, background: "#fff" }} />
      )}
    </div>
  );
}

function MultiField({ f, value = [], onChange }) {
  const toggle = id => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  return (
    <div style={{ marginBottom: 20 }}>
      <Label help={f.h}>{f.l}</Label>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {f.o.map(o => {
          const on = value.includes(o.id);
          return (
            <button key={o.id} type="button" onClick={() => toggle(o.id)}
              style={{
                padding: "8px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                background: on ? "#FBF7F0" : FIELD,
                border: `1.5px solid ${on ? GOLD : LINE}`,
                color: on ? INK : MUTE, fontWeight: on ? 600 : 400,
              }}>
              {on && "✓ "}{o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SpecsForm() {
  const [cat, setCat] = useState("table");
  const [tType, setTType] = useState("snooker");
  const [v, setV] = useState({});
  const [cust, setCust] = useState({});

  const set = (k, val) => setV(p => ({ ...p, [k]: val }));
  const setC = (k, val) => setCust(p => ({ ...p, [k]: val }));

  const fields = D[cat];
  const filled = Object.values(v).filter(x => x !== "" && x != null && (!Array.isArray(x) || x.length)).length;

  const render = f => {
    const opts = f.src === "types[].sizes" ? D.sizes[tType] : null;
    const common = { f, value: v[f.id], custom: cust[f.id], onChange: x => set(f.id, x), onCustom: x => setC(f.id, x) };
    if (f.t === "number") return <NumField key={f.id} {...common} />;
    if (f.t === "text") return <TextField key={f.id} {...common} />;
    if (f.t === "boolean") return <Toggle key={f.id} {...common} />;
    if (f.t === "multi_select") return <MultiField key={f.id} {...common} />;
    return <SelectField key={f.id} {...common} options={opts} />;
  };

  const toggles = fields.filter(f => f.t === "boolean");
  const rest = fields.filter(f => f.t !== "boolean");

  return (
    <div dir="rtl" style={{ background: PAGE, minHeight: "100vh", padding: "14px 12px 40px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 440, margin: "0 auto" }}>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["table", "میز"], ["cue", "چوب"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => { setCat(k); setV({}); setCust({}); }}
              style={{
                flex: 1, padding: "11px", borderRadius: 13, fontSize: 14.5, cursor: "pointer",
                background: cat === k ? "#fff" : "transparent",
                border: `1.5px solid ${cat === k ? GOLD : "transparent"}`,
                color: cat === k ? INK : MUTE, fontWeight: cat === k ? 700 : 500,
              }}>{l}</button>
          ))}
        </div>

        {cat === "table" && (
          <div style={{ background: "#fff", borderRadius: 18, padding: "14px 15px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: MUTE, marginBottom: 9 }}>نوع میز (تعیین‌کننده‌ی لیست اندازه)</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {D.types.map(t => (
                <button key={t.id} type="button" onClick={() => { setTType(t.id); set("size", null); }}
                  style={{
                    padding: "7px 13px", borderRadius: 9, fontSize: 13, cursor: "pointer",
                    background: tType === t.id ? GOLD : "#F4F2EF",
                    color: tType === t.id ? "#fff" : MUTE, border: "none",
                  }}>{t.l}</button>
              ))}
            </div>
          </div>
        )}

        <Card kicker="SPECIFICATIONS" title={`مشخصات فنی — ${cat === "table" ? "میز" : "چوب"}`}>
          {rest.map(render)}
          {toggles.length > 0 && (
            <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 18, marginTop: 4 }}>
              {toggles.map(render)}
            </div>
          )}
          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 18, marginTop: 4 }}>
            <SelectField f={{ id: "cond", l: "وضعیت کالا", ao: false }} value={v.cond}
              onChange={x => set("cond", x)} options={D.cond} />
          </div>
        </Card>

        <div style={{
          padding: "13px 16px", borderRadius: 14, background: "#FBF7F0",
          border: `1px solid ${GOLD_SOFT}`, fontSize: 13, color: INK, textAlign: "center",
        }}>
          {filled} فیلد از {fields.length + 1} تکمیل شد
          <div style={{ fontSize: 11, color: MUTE, marginTop: 4 }}>
            جز وضعیت کالا، همه اختیاری‌اند
          </div>
        </div>

      </div>
    </div>
  );
}
