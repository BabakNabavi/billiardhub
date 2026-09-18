/* ─────────────────────────────────────────────────────────────
   دوربین‌های یک پخش («زاویه»).

   ── چرا اصلا لازم است ──
   یک مسابقه با دو یا سه دوربین پوشش داده می‌شود: نمای کلیِ میز، نمای
   نزدیکِ ضربه، و گاهی نمای بازیکن. یک گوشی نمی‌تواند هم‌زمان هر سه را
   بگیرد؛ حتی دو دوربینِ جلو و عقبِ یک گوشی هم در اغلبِ مرورگرها
   هم‌زمان باز نمی‌شوند.

   پس هر زاویه یک فرستنده‌ی مستقل است:
     • یا دستگاهِ جداگانه (گوشیِ دوم، لپ‌تاپ)
     • یا دوربینِ دیگری روی همان دستگاه (کارتِ کپچرِ دوربینِ حرفه‌ای)

   هر زاویه کانالِ سیگنالینگِ خودش را دارد، پس بیننده با عوض‌کردنِ
   زاویه فقط یک اتصال را می‌بندد و یکی دیگر باز می‌کند — بقیه‌ی
   بیننده‌ها و بقیه‌ی دوربین‌ها دست‌نخورده می‌مانند.

   ── چرا ضربانِ جدا برای هر زاویه ──
   اگر دوربینِ دوم وسطِ مسابقه قطع شود (باتری، اینترنت) نباید تا پایانِ
   پخش به‌عنوان یک گزینه‌ی مرده در فهرست بماند. بیننده‌ای که رویش بزند
   صفحه‌ی سیاه می‌بیند و فکر می‌کند سایت خراب است.
   ───────────────────────────────────────────────────────────── */

export interface LiveAngle {
  id: string;
  label: string;
  addedAt: number;
  lastBeat: number;
}

/** زاویه‌ی اصلی همیشه همین شناسه را دارد. کانالِ سیگنالینگش هم عمدا
 *  همان نامِ قدیمی است تا پخش‌های در جریان با دیپلوی قطع نشوند. */
export const MAIN_ANGLE = 'main';

/** پنجره‌ی کهنگی — هم‌اندازه‌ی جلسه. */
export const ANGLE_STALE_MS = 45_000;

/* نام‌های پیشنهادی. باشگاه‌دار می‌تواند تایپ کند، ولی اغلب نمی‌کند و
   «دوربین ۲» چیزی به بیننده نمی‌گوید. */
export const ANGLE_LABEL_SUGGESTIONS = [
  'نمای کلی میز',
  'نمای نزدیک',
  'نمای بازیکن',
  'میز کناری',
  'تابلوی امتیاز',
];

export function defaultAngleLabel(index: number): string {
  return ANGLE_LABEL_SUGGESTIONS[index] ?? `دوربین ${index + 1}`;
}

/** کانالِ سیگنالینگِ یک زاویه. زاویه‌ی اصلی نامِ تاریخی‌اش را نگه
 *  می‌دارد، وگرنه بیننده‌های وصل‌شده با نسخه‌ی قبلی قطع می‌شدند. */
export function angleTopic(sessionId: string, angleId: string): string {
  return angleId === MAIN_ANGLE ? `live-${sessionId}` : `live-${sessionId}-${angleId}`;
}

export function newAngleId(): string {
  return `a-${Date.now().toString(36)}-${Math.floor(Math.random() * 1296).toString(36)}`;
}

/** فقط زاویه‌هایی که واقعا دارند می‌فرستند. */
export function activeAngles(angles: LiveAngle[] | undefined, now = Date.now()): LiveAngle[] {
  if (!Array.isArray(angles)) return [];
  return angles
    .filter(a => a && typeof a.id === 'string' && now - Number(a.lastBeat || 0) <= ANGLE_STALE_MS)
    .sort((a, b) => {
      /* اصلی همیشه اول؛ بقیه به ترتیبِ اضافه‌شدن. */
      if (a.id === MAIN_ANGLE) return -1;
      if (b.id === MAIN_ANGLE) return 1;
      return Number(a.addedAt || 0) - Number(b.addedAt || 0);
    });
}

/** فهرستی که به بیننده نشان داده می‌شود. اگر فقط یک زاویه زنده باشد
 *  آرایه‌ی خالی برمی‌گردد: نمایشِ یک «انتخابگر» با یک گزینه، شلوغی
 *  بی‌فایده است. */
export function switchableAngles(angles: LiveAngle[] | undefined, now = Date.now()): LiveAngle[] {
  const live = activeAngles(angles, now);
  return live.length > 1 ? live : [];
}

/** بیشترین تعدادِ دوربینِ هم‌زمان. سقف دارد چون هر زاویه یک اتصالِ
 *  نظیربه‌نظیرِ جدا به ازای هر بیننده است؛ بدونِ سقف، سه بیننده و
 *  شش دوربین یعنی هجده اتصال از یک گوشی. */
export const MAX_ANGLES = 4;
