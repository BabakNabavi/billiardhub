/* تستِ لایه‌ی پخش زنده.

   منطقِ تصویری داخلِ مرورگر است و این‌جا قابلِ اجرا نیست، پس دو چیز
   بررسی می‌شود: توابعِ خالص (زاویه‌ها، کیفیت) با اجرای واقعی، و
   قیدهایی که اگر روزی برداشته شوند باگِ گزارش‌شده برمی‌گردد. */

import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
/* مسیرهای مطلق تا تست از هر پوشه‌ای اجرا شود */
const abs = p => new URL(p, root).href;
const webDir = fileURLToPath(root);
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`) } else { fail++; console.log(`  ✗ ${name}`) } };
const eq = (name, a, b) => ok(`${name} (${JSON.stringify(a)})`, JSON.stringify(a) === JSON.stringify(b));

/* ── توابعِ خالص واقعا اجرا می‌شوند، نه اینکه فقط متنشان خوانده شود ──
   TypeScript است، پس با tsx اجرا می‌شود (وابستگیِ پروژه نیست؛ با npx). */
const probe = `
import { activeAngles, switchableAngles, angleTopic, MAIN_ANGLE, defaultAngleLabel, MAX_ANGLES } from '${abs('lib/live/angles.ts')}';
import { presetOf, QUALITY_PRESETS, DEFAULT_QUALITY, videoConstraints, audioConstraints, healthOf, emptyStats } from '${abs('lib/live/quality.ts')}';
const now = 1000000;
const A = (id, beatAgo, addedAt = 0) => ({ id, label: id, addedAt, lastBeat: now - beatAgo });
const out = {
  topicMain:   angleTopic('lv-1', MAIN_ANGLE),
  topicOther:  angleTopic('lv-1', 'a-2'),
  activeFresh: activeAngles([A(MAIN_ANGLE, 1000), A('a-2', 2000, 5)], now).map(a => a.id),
  activeStale: activeAngles([A(MAIN_ANGLE, 1000), A('a-2', 60000, 5)], now).map(a => a.id),
  mainFirst:   activeAngles([A('a-2', 100, 5), A(MAIN_ANGLE, 100)], now).map(a => a.id),
  switchOne:   switchableAngles([A(MAIN_ANGLE, 100)], now).length,
  switchTwo:   switchableAngles([A(MAIN_ANGLE, 100), A('a-2', 100, 5)], now).length,
  activeJunk:  activeAngles(undefined, now).length,
  label0:      defaultAngleLabel(0),
  maxAngles:   MAX_ANGLES,
  presetKnown: presetOf('720p30').id,
  presetJunk:  presetOf('nope').id,
  presetNull:  presetOf(null).id,
  bitrates:    QUALITY_PRESETS.map(p => p.bitrate),
  heights:     QUALITY_PRESETS.map(p => p.height),
  defaultId:   DEFAULT_QUALITY,
  cDevice:     JSON.stringify(videoConstraints(presetOf('1080p30'), { deviceId: 'cap-1', facing: 'user' })),
  cFacing:     JSON.stringify(videoConstraints(presetOf('1080p30'), { facing: 'user' })),
  audioRaw:    audioConstraints().noiseSuppression,
  healthGood:  healthOf({ ...emptyStats(), packetLoss: 0.2, rtt: 40 }),
  healthFair:  healthOf({ ...emptyStats(), packetLoss: 2, rtt: 40 }),
  healthPoor:  healthOf({ ...emptyStats(), packetLoss: 9, rtt: 40 }),
  healthRtt:   healthOf({ ...emptyStats(), packetLoss: 0, rtt: 900 }),
};
console.log('@@' + JSON.stringify(out));
`;

/* ⚠️ پروب در فایل نوشته می‌شود، نه با --eval.
   روی ویندوز، عبورِ یک برنامه‌ی چندخطی از شل، دنباله‌های \n را خراب
   می‌کند و esbuild با «Syntax error» می‌افتد. فایل این مسئله را
   کاملا حذف می‌کند. مسیرِ importها مطلق است، پس جای فایل مهم نیست. */
let R;
const probeFile = join(tmpdir(), `bh-live-probe-${process.pid}.mts`);
try {
  writeFileSync(probeFile, probe, 'utf8');
  /* شل لازم است: روی ویندوز npx یک فایلِ .cmd است و execFile مستقیم
     اجرایش نمی‌کند (EINVAL). tsx وابستگیِ پروژه نیست، پس --yes. */
  const raw = execSync(`npx --yes tsx ${JSON.stringify(probeFile)}`, {
    cwd: webDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  const line = raw.split('\n').find(l => l.startsWith('@@'));
  if (!line) throw new Error('no probe output:\n' + raw);
  R = JSON.parse(line.slice(2));
} catch (e) {
  console.error('اجرای پروب شکست خورد:', e.message);
  process.exit(1);
} finally {
  try { rmSync(probeFile, { force: true }) } catch { /* فایل موقت */ }
}

console.log('\n■ ۱) زاویه‌ها (دوربین‌ها)');
eq('کانالِ دوربینِ اصلی نامِ تاریخی‌اش را نگه می‌دارد', R.topicMain, 'live-lv-1');
eq('هر دوربینِ دیگر کانالِ جدا دارد', R.topicOther, 'live-lv-1-a-2');
eq('دوربینِ زنده می‌ماند', R.activeFresh, ['main', 'a-2']);
eq('دوربینِ بی‌تپش حذف می‌شود', R.activeStale, ['main']);
eq('اصلی همیشه اول', R.mainFirst, ['main', 'a-2']);
eq('با یک دوربین انتخابگر نشان داده نمی‌شود', R.switchOne, 0);
eq('با دو دوربین انتخابگر می‌آید', R.switchTwo, 2);
eq('ورودیِ خراب برنامه را نمی‌شکند', R.activeJunk, 0);
ok('نامِ پیش‌فرض گویاست، نه «دوربین ۱»', typeof R.label0 === 'string' && R.label0.length > 3);
ok('سقفِ دوربین‌ها معقول است', R.maxAngles >= 2 && R.maxAngles <= 6);

console.log('\n■ ۲) کیفیت');
eq('پریستِ شناخته‌شده', R.presetKnown, '720p30');
eq('ورودیِ نامعتبر به پیش‌فرض می‌افتد', R.presetJunk, R.defaultId);
eq('null هم به پیش‌فرض می‌افتد', R.presetNull, R.defaultId);
ok('نرخِ بیت صعودی است', R.bitrates.every((b, i) => i === 0 || b > R.bitrates[i - 1]));
ok('نرخِ بیتِ ۱۰۸۰p از سقفِ پیش‌فرضِ WebRTC بیشتر است', R.bitrates[1] >= 3_000_000);
ok('تا ۴K پوشش دارد', Math.max(...R.heights) >= 2160);
ok('شناسه‌ی دستگاه بر facingMode مقدم است', R.cDevice.includes('cap-1') && !R.cDevice.includes('facingMode'));
ok('بدونِ شناسه، facingMode می‌آید', R.cFacing.includes('facingMode'));
eq('پردازشِ گفتار روی صدای سالن خاموش است', R.audioRaw, false);
eq('اتصالِ سالم', R.healthGood, 'good');
eq('اتلافِ متوسط', R.healthFair, 'fair');
eq('اتلافِ زیاد', R.healthPoor, 'poor');
eq('تأخیرِ زیاد هم ضعیف است', R.healthRtt, 'poor');

/* ── قیدهای متنی ──
   این‌ها دقیقا همان چیزهایی‌اند که باگِ گزارش‌شده را ساختند. */
const fsLib  = read('lib/live/fullscreen.ts');
const player = read('components/live/LivePlayer.tsx');
const golive = read('components/club/GoLive.tsx');
const rtc    = read('lib/live/webrtc.ts');
const api    = read('app/api/live/route.ts');
const css    = read('lib/live/player-styles.ts');
const store  = read('lib/live/broadcast-store.ts');
const strip  = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

console.log('\n■ ۳) تمام‌صفحه — باگی که گزارش شد');
ok('تمام‌صفحه روی «قاب» گرفته می‌شود نه روی المانِ ویدیو',
  /el\.requestFullscreen\(\)/.test(strip(fsLib)));
ok('مسیرِ آیفون (webkitEnterFullscreen) هست', /webkitEnterFullscreen/.test(strip(fsLib)));
ok('مسیرِ وبکیتِ قاب هست', /webkitRequestFullscreen/.test(strip(fsLib)));
ok('مسیرِ جایگزینِ CSS هست', /return 'css'/.test(strip(fsLib)));
ok('fullscreenEnabled بررسی می‌شود (دکمه‌ی بی‌اثر روی iOSِ قدیمی)',
  /fullscreenEnabled/.test(strip(fsLib)));
ok('پخش‌کننده دیگر requestFullscreen را مستقیم روی video صدا نمی‌زند',
  !/videoRef\.current\?\.requestFullscreen/.test(strip(player)));
ok('خروج با Esc همگام می‌شود', /fullscreenchange/.test(strip(player)));
ok('چرخش به افقی در موبایل', /lock\('landscape'\)/.test(strip(fsLib)));
ok('حالتِ CSS در استایل تعریف شده', /data-cssfs="1"/.test(css));

console.log('\n■ ۴) پخش‌کننده — چیزهایی که «حرفه‌ای» بودن را می‌سازند');
ok('کنترل‌ها خودکار پنهان می‌شوند', /IDLE_MS/.test(strip(player)));
ok('پرده‌ی تیره پشتِ کنترل‌ها', /bpv-scrim/.test(css));
ok('میان‌برهای صفحه‌کلید', /onKeyDown/.test(strip(player)) && /'f'/.test(strip(player)));
ok('تصویر در تصویر', /togglePip/.test(strip(player)));
ok('آمار فنی', /StatsPanel/.test(strip(player)));
ok('دوبار-زدن روی موبایل', /tapRef/.test(strip(player)));
ok('دعوت به روشن‌کردن صدا (پخشِ خودکار همیشه بی‌صداست)', /bpv-unmute/.test(css));
ok('هدفِ لمسی ۴۴ پیکسل', /width: 44px; height: 44px/.test(css));
ok('حاشیه‌ی امنِ آیفون رعایت شده', /env\(safe-area-inset/.test(css));
ok('احترام به prefers-reduced-motion', /prefers-reduced-motion/.test(css));
ok('انتخابگرِ دوربین برای بیننده', /bpv-angle/.test(css) && /switchableAngles/.test(strip(player)));

console.log('\n■ ۵) چند دوربین و کیفیتِ بالا');
ok('هر زاویه کانالِ خودش را دارد', /angleTopic\(sessionId, angleId\)/.test(strip(rtc)));
ok('سقفِ نرخِ بیت واقعا اعمال می‌شود', /applyQuality\(pc, presetOf\(quality\)\)/.test(strip(rtc)));
{
  const s = strip(rtc);
  ok('ترجیحِ کدک پیش از createOffer ست می‌شود',
    s.indexOf('preferVideoCodec(pc)') > 0 && s.indexOf('preferVideoCodec(pc)') < s.indexOf('createOffer'));
}
ok('تعویضِ دوربین بیننده‌ها را قطع نمی‌کند', /replaceTrack/.test(strip(rtc)));
ok('کیفیت وسطِ پخش قابلِ تغییر است', /setQuality/.test(strip(rtc)));
ok('انتخابِ دستگاه برای دوربینِ حرفه‌ای', /listCameras/.test(strip(golive)));
ok('اشتراکِ صفحه برای تابلوی امتیاز', /openScreen/.test(strip(golive)));
ok('دوربینِ دوم از دستگاهِ دیگر هم ممکن است', /joinable/.test(strip(golive)));
ok('هر دوربین تپشِ خودش را می‌فرستد',
  strip(store).includes('f.angleId, f.label'));

console.log('\n■ ۶) سرور');
ok('زاویه‌ها فایلِ جدا دارند (ضدِ کلوبر)', /aPath\(id, angle/.test(strip(api)));
{
  /* شاخه‌ی «فهرستِ همه‌ی جلسات» نباید زاویه‌ها را بخواند: برای هر جلسه
     یک list به‌علاوه‌ی چند download، روی صفحه‌ای که هر ۱۵ ثانیه تازه
     می‌شود. (بررسی باید روی خودِ شاخه باشد، نه کلِ فایل — تعریفِ
     تابع بالای فایل است و همیشه پیدا می‌شود.) */
  const src = strip(api);
  const from = src.indexOf('list(DIR');
  const to = src.indexOf('} catch {', from);
  ok('فهرست عمدا زاویه‌ها را نمی‌خواند',
    from > 0 && to > from && !src.slice(from, to).includes('readAngles'));
}
ok('افزودنِ دوربین سقف دارد', /MAX_ANGLES/.test(strip(api)));
ok('فقط مالکِ جلسه دوربین اضافه می‌کند', /FORBIDDEN/.test(strip(api)));
ok('دوربینِ غیراصلی فایلِ جلسه را نمی‌نویسد', /angleId !== MAIN_ANGLE && action === 'beat'/.test(strip(api)));

console.log('\n■ ۷) نشتی و حالت‌های لبه‌ای که بازبینی پیدا کرد');
const client = read('lib/live/client.ts');
const watch  = read('app/live/[id]/page.tsx');
const panels = read('components/live/PlayerPanels.tsx');
ok('استریمِ پیش‌نمایش آینه می‌شود، نه المانِ ویدیو (دوربین روشن نماند)',
  /previewStreamRef/.test(strip(golive)) && /stopStream\(previewStreamRef\.current\)/.test(strip(golive)));
ok('getUserMediaی دیررس پس از ترکِ صفحه بسته می‌شود',
  /!aliveRef\.current/.test(strip(golive)) && /stopStream\(r\.stream\); return null/.test(strip(golive)));
ok('دوربینِ مرده بیننده را در «در حال اتصال» حبس نمی‌کند',
  /activeAngles\(angles\)\.some/.test(strip(player)));
ok('سقفِ فهرستِ زاویه‌ها دوربینِ اصلی را حذف نمی‌کند',
  /limit: 100/.test(strip(api)) && !/limit: MAX_ANGLES/.test(strip(api)));
ok('تپش نمی‌تواند زاویه‌ی ثبت‌نشده بسازد',
  /angleId !== MAIN_ANGLE && !prev/.test(strip(api)));
ok('شناسه‌ی واقعیِ دستگاه ثبت می‌شود', /trackDeviceId/.test(strip(golive)));
ok('اشتراکِ صفحه پس از mount خوانده می‌شود (ناهماهنگیِ هیدریشن)',
  /setCanShare\(screenShareSupported\(\)\)/.test(strip(golive)));
ok('به‌روزرسانیِ state خالص است (اثرِ جانبی بیرون از updater)',
  !/setFeeds\(prev => \{[\s\S]{0,220}?(bc\?\.stop|stopStream|t\.enabled)/.test(strip(golive)));
ok('صفحه‌ی تماشا «تمام شد» را از «نتوانستم بپرسم» جدا می‌کند',
  /s !== undefined/.test(strip(watch)) && /return undefined/.test(strip(client)));
ok('میان‌برها کلیدِ دکمه‌ی فوکوس‌شده را نمی‌دزدند',
  /closest\('button,input,select,a'\)/.test(strip(player)));
ok('پنلِ تنظیمات با Esc و کلیکِ بیرون بسته می‌شود',
  /pointerdown/.test(strip(player)) && /settingsBtnRef/.test(strip(player)));
ok('نقشِ ARIA درست است (group، نه tablist/dialog)',
  !/role="tablist"/.test(strip(player)) && !/role="tab"/.test(strip(player)) && !/role="dialog"/.test(strip(panels)));
ok('فریمِ یخ‌زده هنگامِ سوییچ پاک می‌شود', /el\.srcObject = null/.test(strip(player)));
ok('دوربینِ مهمان پس از پایانِ پخش بسته می‌شود', /missesRef/.test(strip(golive)));
ok('تپش دیگر افکتِ ری‌اکت نیست (با هر رندر از نو ساخته نمی‌شود)',
  strip(store).includes('beatTimer = window.setInterval'));
ok('کیفیت وسطِ پخش، قیدِ خودِ دوربین را هم عوض می‌کند',
  strip(store).includes('retuneTrack(f.stream, p)'));
ok('شکستِ ICE «پایان» نیست و قابلِ تلاشِ دوباره است',
  strip(rtc).includes("pc.connectionState === 'failed') onState('error')")
  && !strip(rtc).includes("'closed'].includes(pc.connectionState)) onState('ended')"));
ok('فهرستِ جلسات هم «نتوانستم بپرسم» را جدا می‌کند',
  strip(client).includes('Promise<LiveSession[] | undefined>'));
ok('خاموش‌کردنِ دوربینِ مهمان روی خطای شبکه رخ نمی‌دهد',
  strip(golive).includes('all === undefined) return'));
ok('استریم پیش از تحویل به استور، زنده‌بودنِ صفحه را بررسی می‌کند',
  strip(golive).split('if (!aliveRef.current) { stopStream(r.stream)').length - 1 >= 3);
ok('makePeer دیگر promiseی سرگردان نیست',
  strip(rtc).includes('makePeer(String(v)).catch'));
ok('main.json صریح خوانده می‌شود، نه با اعتماد به ترتیبِ فهرست',
  strip(api).includes('names.includes(main)'));
ok('دوربینِ واقعی با فایلِ گم‌شده خودش را ترمیم می‌کند',
  strip(api).includes('liveNow.length >= MAX_ANGLES'));
ok('انتخابگرِ دوربین با دوربینِ واقعا باز هم‌گام می‌ماند',
  strip(golive).includes('if (real) setDeviceId(real)'));
ok('تا نیامدنِ اولین پاسخ، شروعِ پخش غیرفعال است',
  strip(golive).includes('!polled'));

console.log('\n■ ۸) باگ‌های گزارش‌شده‌ی تستِ واقعی');
const addp  = read('components/club/live/AddCameraPanel.tsx');

/* «یهو از پخش خارج شدم و تماشاکننده شدم» — چون GoLive با
   {activeTab === 'live' && …} رندر می‌شود و unmountش پخش را می‌کشت. */
ok('حالتِ پخش بیرون از کامپوننت است', /useSyncExternalStore/.test(strip(golive)));
ok('پاک‌سازیِ کامپوننت دیگر stopLive صدا نمی‌زند',
  !/stopLive/.test(strip(golive)));
ok('پاک‌سازیِ کامپوننت فقط پیش‌نمایش را می‌بندد',
  /aliveRef\.current = false[\s\S]{0,140}stopStream\(previewStreamRef\.current\)/.test(strip(golive))
  && !/feeds[\s\S]{0,40}forEach[\s\S]{0,60}stop\(\)/.test(strip(golive)));
ok('تپش داخلِ استور است، نه افکتِ کامپوننت',
  /beatTimer/.test(strip(store)) && !/beatLive/.test(strip(golive)));
ok('هشدارِ بستنِ صفحه هنگام پخش', /beforeunload/.test(strip(store)));
ok('لینکِ «مشاهده» تبِ تازه و noopener دارد',
  /rel="noopener noreferrer"/.test(strip(golive)));
ok('راهِ امنِ اشتراک لینک هست (کپی)', /clipboard\.writeText/.test(strip(golive)));

/* «دوربین جدید زدم، دوربین جلو روشن شد» */
ok('دوربینِ افزوده خودکار انتخاب نمی‌شود',
  !/cams\.find\(c => c\.deviceId && !used\.has/.test(strip(golive))
  && /AddCameraPanel/.test(strip(golive)));
ok('پنلِ افزودن، انتخابِ دستگاه و نام دارد',
  strip(addp).includes('onAdd(selected, label') && addp.includes('کدام دوربین'));
ok('دوربینِ در حالِ استفاده در فهرست نمی‌آید',
  /!usedIds\.includes\(c\.deviceId\)/.test(strip(addp)));
ok('نامِ پیش‌فرض بر اساسِ میز است', /میز /.test(read('lib/live/angles.ts')));
ok('باشگاه‌دار نامِ دوربینِ اصلی را هم می‌دهد', /mainLabel/.test(strip(golive)));

/* چند دستگاه با یک حساب */
ok('دستگاهِ مهمان پخشِ جاری را می‌پذیرد', /adoptSession/.test(strip(golive)));
ok('مهمان فقط دوربینِ خودش را قطع می‌کند',
  /st\.owned \? 'پایان پخش' : 'قطع دوربین این دستگاه'/.test(strip(golive)));
ok('راهنمای چند دستگاه در رابط هست', /روی گوشی یا لپ‌تاپ دیگری/.test(golive));

/* فیلدِ رشته حذف شد */
ok('فیلدِ رشته حذف شده', !/DISCIPLINES/.test(strip(golive)));
ok('هیچ صفحه‌ای رشته را نشان نمی‌دهد',
  !strip(read('app/live/[id]/page.tsx')).includes('discipline')
  && !strip(read('app/live/page.tsx')).includes('discipline'));

/* تعویضِ دوربینِ اصلی وسطِ پخش */
ok('دوربینِ اصلی وسطِ پخش قابلِ تعویض است',
  /replaceMain/.test(strip(golive)) && /pickMainCamera/.test(strip(golive)));

console.log('\n■ ۹) موارد بازبینیِ دورِ دوم');
const indi = read('components/live/LiveIndicator.tsx');
const addp2 = read('components/club/live/AddCameraPanel.tsx');
const sel = read('components/ui/SelectField.tsx');
const layout = read('app/layout.tsx');

ok('پخش هیچ‌وقت بدونِ کنترلِ دیده‌شدنی اجرا نمی‌شود',
  strip(layout).includes('<LiveIndicator />') && strip(indi).includes('endLocal'));
ok('نشان وقتی پخشی نیست چیزی رندر نمی‌کند',
  strip(indi).includes('if (st.feeds.length === 0) return null'));
ok('تعویضِ دوربین وضعیتِ میکروفون را حفظ می‌کند',
  strip(store).includes('t.enabled = main.micOn'));
ok('تعویضِ هم‌زمانِ دوربین استریمِ برنده را نمی‌بندد',
  strip(store).includes('now.stream !== main.stream'));
ok('جلسه‌ی بی‌تصویر روی سرور رها نمی‌شود',
  strip(store).includes('await stopLive(r.session.id, opts.ownerKey)'));
ok('شکستِ «پایان پخش» پنهان نمی‌ماند',
  strip(store).includes('پایان پخش روی سرور ثبت نشد'));
ok('تعویضِ دوربین گاردِ in-flight دارد', strip(golive).includes('swapping'));
ok('پخشِ باشگاهِ دیگر با این باشگاه قاطی نمی‌شود',
  strip(golive).includes('st.session.clubId !== clubId'));
ok('انتخابِ کهنه‌ی دوربین به دکمه نشت نمی‌کند',
  strip(addp2).includes('free.some(c => c.deviceId === deviceId)'));
ok('پنلِ افزودن حلقه‌ی فوکوس دارد', /acp-btn:focus-visible/.test(addp2));
ok('SelectField قابلِ غیرفعال‌شدن و برچسب‌دار است',
  strip(sel).includes('disabled?: boolean') && strip(sel).includes('aria-haspopup="listbox"'));
ok('تپش روی سرور اجرا نمی‌شود', strip(store).includes("typeof window === 'undefined'"));

console.log('\n' + '─'.repeat(52));
console.log(`  ${fail === 0 ? '✓' : '✗'} ${pass} پاس، ${fail} ناموفق\n`);
process.exit(fail === 0 ? 0 : 1);
