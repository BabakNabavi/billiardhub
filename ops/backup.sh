#!/bin/bash
# پشتیبانِ شبانه — دیتابیس و فایل‌های خودِ سرور.
#
# ── چه چیزی عوض شد و چرا ──
# نسخه‌ی قبلی هر شب `tar -czf` از **کلِ** درختِ فایل‌ها می‌گرفت. با ۲۴
# مگابایت بی‌ضرر بود، ولی خودِ همان اسکریپت هشدار داده بود که با آمدنِ
# ویدیو باید عوض شود. حساب ساده است: با ۱۰۰ گیگ ویدیو، هر شب ۱۰۰ گیگ
# خوانده و فشرده می‌شود و آرشیوِ چهارده‌روزه ۱.۴ ترابایت می‌خواهد —
# روی دیسکی که ۴۰ گیگ دارد.
#
# حالا:
#   media/current/   یک آینه‌ی rsync — فقط تفاوت‌ها نوشته می‌شوند
#   media/<stamp>/   عکسِ لحظه‌ای با هارد‌لینک؛ فایلِ تغییرنکرده صفر بایت
#                    جا می‌گیرد ولی حذفِ تصادفی همچنان قابلِ بازیابی است
#   media/index      فهرستِ path|size|mtime|sha256
#
# ── چرا checksum ──
# بدونِ آن، فایلِ خرابِ بی‌صدا (bit rot، نوشتنِ نیمه‌کاره) تا روزی که
# کاربر بخواهد پخشش کند پیدا نمی‌شود — و تا آن روز همان خرابی در
# همه‌ی نسخه‌های پشتیبان هم تکثیر شده.
#
# ── چرا هر شب همه‌چیز هش نمی‌شود ──
# هشِ کاملِ ۱۰۰ گیگ یعنی ده دقیقه خواندنِ پیوسته‌ی دیسک، هر شب، روی
# همان دیسکی که Postgres رویش است. پس هشِ فایلی که اندازه و زمانش
# عوض نشده از فهرستِ قبلی برداشته می‌شود، و در عوض هر شب یک نمونه‌ی
# تصادفی واقعاً دوباره هش می‌شود تا خرابیِ خاموش دیر یا زود رو بیاید.
set -u

# ── چرا umask ──
# `config.tgz` رمزِ Postgres و کلیدِ service-role را دارد. با umaskِ
# پیش‌فرض ۰۶۴۴ می‌شود، یعنی هر حسابِ محلیِ سرور می‌تواند بخواندش — و
# همان فایل بعداً رمزنشده روی لپ‌تاپ هم می‌رود.
umask 077

OUT=/var/backups/billiardhub
SRC=/opt/supabase/docker/volumes/storage
MEDIA="$OUT/media"
KEEP=14                    # دو هفته دامپ
KEEP_SNAP=14               # دو هفته عکسِ لحظه‌ای (هاردلینک، تقریباً رایگان)
# ── بودجه‌ی بازبینی ──
# نمونه‌ی «۲۵ فایل در شب» با ۴۴۴ فایل یعنی پوششِ کامل در سه هفته، ولی
# با صد هزار فایل یعنی یازده سال — عملاً هیچ. پس معیار حجم است نه
# تعداد: هر شب تا این مقدار بایت واقعاً دوباره خوانده و هش می‌شود.
# ۲ گیگ روی دیسکِ این سرور حدودِ چند ثانیه است و سرِ ساعتِ ۳ بامداد
# مزاحمِ کسی نیست.
VERIFY_BYTES=$((2 * 1024 * 1024 * 1024))
# ── چرا قفل ──
# با درختِ چندصدگیگی، یک اجرا می‌تواند از ۲۴ ساعت رد شود و با اجرای
# شبِ بعد روی همان آینه و همان فهرست بیفتد.
exec 9>/var/lock/bh-backup.lock
flock -n 9 || { echo "$(date '+%F %T')  ⏭ اجرای قبلی هنوز تمام نشده" >> /var/backups/billiardhub/history.log; exit 0; }

STAMP=$(date +%F-%H%M)
D="$OUT/$STAMP"
LOG="$OUT/history.log"
mkdir -p "$D" "$MEDIA/current"

note() { echo "$(date '+%F %T')  $*" >> "$LOG"; }

PG=$(grep '^POSTGRES_PASSWORD=' /opt/supabase/docker/.env | cut -d= -f2-)

# ── دیتابیس ──
docker exec -e PGPASSWORD="$PG" supabase-db \
  pg_dump -U postgres -d postgres --schema=public --no-owner -Fc \
  > "$D/public.dump" 2>"$D/db.err"
docker exec -e PGPASSWORD="$PG" supabase-db \
  pg_dump -U postgres -d postgres --data-only --no-owner \
    --table=storage.buckets --table=storage.objects -Fc \
  > "$D/storage-meta.dump" 2>>"$D/db.err"

# ── فایل‌ها: آینه‌ی افزایشی ──
# `--delete` یعنی آینه واقعاً آینه است. حذفِ تصادفی از دست نمی‌رود چون
# عکسِ دیشب هنوز آن فایل را دارد.
# ── گاردِ منبعِ خالی ──
# `--delete` آینه را با منبع یکی می‌کند. اگر منبع خالی باشد — ولیوم
# داکر بعد از ری‌استارت سوار نشده، مسیر با ارتقای Supabase عوض شده —
# آینه پاک می‌شود و چند خط پایین‌تر فهرستِ خالی روی فهرستِ سالم
# نوشته می‌شود. آن‌وقت فقط عکس‌های لحظه‌ای مانده‌اند.
SRC_N=$(find "$SRC" -type f 2>/dev/null | wc -l)
OLD_N=$(wc -l < "$MEDIA/index" 2>/dev/null || echo 0)
if [ "$SRC_N" -eq 0 ] && [ "$OLD_N" -gt 0 ]; then
  note "⛔ منبعِ رسانه خالی است ($SRC) — آینه دست‌نخورده ماند"
  exit 1
fi
# افتِ ناگهانیِ بیش از ۲۰٪ هم مشکوک است: یا حذفِ دسته‌جمعی بوده یا
# منبع نیمه‌سوار شده. آدم باید ببیندش، نه اینکه صبح خبردار شود.
if [ "$OLD_N" -gt 50 ] && [ "$SRC_N" -lt $((OLD_N * 80 / 100)) ]; then
  note "⛔ تعدادِ فایل از $OLD_N به $SRC_N افتاد — آینه دست‌نخورده ماند"
  exit 1
fi

# `--info=DEL` لازم است وگرنه شمارشِ حذف همیشه صفر می‌ماند
RSYNC_OUT=$(rsync -a --delete --info=DEL --stats "$SRC/" "$MEDIA/current/" 2>&1)
RS=$?
XFER=$(echo "$RSYNC_OUT" | grep -m1 'Number of regular files transferred' | tr -dc '0-9')
DEL=$(echo "$RSYNC_OUT" | grep -c '^deleting ')

# ── فهرستِ checksum ──
# ورودی: فهرستِ دیشب. خروجی: فهرستِ امشب. هشِ فایلی که اندازه و زمانش
# یکی مانده، کپی می‌شود؛ بقیه واقعاً هش می‌شوند.
OLD="$MEDIA/index"
NEW="$MEDIA/index.new"
: > "$NEW"
NEWHASH=0
cd "$MEDIA/current" || exit 1

# فهرستِ دیشب یک‌بار در حافظه می‌آید. نسخه‌ی اولِ این اسکریپت برای هر
# فایل یک `grep` روی کلِ فهرست می‌زد — با صد هزار فایل یعنی ده میلیارد
# مقایسه، هر شب. کلید «مسیر|اندازه|زمان» است، پس هر تغییری در فایل
# خودبه‌خود کلید را از دست می‌دهد و دوباره هش می‌شود.
declare -A SEEN
if [ -f "$OLD" ]; then
  while IFS='|' read -r p sz mt h; do
    [ -n "$p" ] && SEEN["$p|$sz|$mt"]="$h"
  done < "$OLD"
fi

# ترتیب «اندازه|زمان|مسیر» است نه برعکس: مسیر تنها فیلدی است که
# می‌تواند `|` داشته باشد، پس باید آخر باشد تا بقیه سالم بمانند.
while IFS='|' read -r sz mt p; do
  [ -z "$p" ] && continue
  h="${SEEN["$p|$sz|$mt"]:-}"
  if [ -z "$h" ]; then
    h=$(sha256sum -- "$p" 2>/dev/null | cut -d' ' -f1)
    [ -z "$h" ] && continue
    NEWHASH=$((NEWHASH+1))
  fi
  echo "$p|$sz|$mt|$h" >> "$NEW"
done < <(find . -type f -printf '%s|%T@|%p\n' 2>/dev/null)

# ── نمونه‌ی تصادفی: خرابیِ خاموش ──
# فایلی که اندازه و زمانش عوض نشده، هشش از فهرست آمده — یعنی اگر روی
# دیسک خراب شده باشد کسی نمی‌فهمد. پس هر شب چند تا واقعاً سنجیده
# می‌شوند.
mv -f "$NEW" "$OLD"

BAD=0; BADLIST=""; SEENB=0; CHECKED=0
if [ -s "$OLD" ]; then
  while IFS='|' read -r p sz mt h; do
    [ "$SEENB" -ge "$VERIFY_BYTES" ] && break
    # اندازه‌ی غیرعددی، `$((…))` را به خطای کشنده تبدیل می‌کند و
    # اسکریپت وسطِ کار می‌میرد — بدونِ اسنپ‌شات و بدونِ حتی یک خطِ لاگ.
    case $sz in "" | *[!0-9]*) continue ;; esac
    [ -f "$p" ] || continue
    now=$(sha256sum -- "$p" 2>/dev/null | cut -d' ' -f1)
    SEENB=$((SEENB + sz)); CHECKED=$((CHECKED+1))
    if [ "$now" != "$h" ]; then
      BAD=$((BAD+1)); BADLIST="$BADLIST $p"
    fi
  done < <(shuf "$OLD" 2>/dev/null)
fi


cp -f "$OLD" "$D/media.sha256"

# ── عکسِ لحظه‌ای با هاردلینک ──
# فایلِ تغییرنکرده فقط یک ورودیِ دایرکتوری است، نه یک کپی. چهارده
# عکسِ ۱۰۰ گیگی روی هم چند مگابایت بیشتر از یکی جا می‌گیرند.
rsync -a --delete --link-dest="$MEDIA/current" "$MEDIA/current/" "$MEDIA/$STAMP/" 2>/dev/null
SNAP_RC=$?

# ── تنظیمات ──
tar -czf "$D/config.tgz" \
  /opt/supabase/docker/.env \
  /opt/billiardhub/apps/web/.env.local \
  /etc/nginx/sites-available/billiardhub 2>/dev/null

# ── پاک‌کردنِ قدیمی‌ها ──
find "$OUT" -maxdepth 1 -type d -name '20*' | sort | head -n -"$KEEP" | xargs -r rm -rf
find "$MEDIA" -maxdepth 1 -type d -name '20*' | sort | head -n -"$KEEP_SNAP" | xargs -r rm -rf

FILES=$(wc -l < "$OLD" 2>/dev/null || echo 0)
MSIZE=$(du -sh "$MEDIA/current" 2>/dev/null | cut -f1)
DSIZE=$(du -sh "$D" | cut -f1)
ROWS=$(docker exec -e PGPASSWORD="$PG" supabase-db psql -U postgres -d postgres -tAc \
  "select count(*) from users" 2>/dev/null)
note "✓ $STAMP  دامپ $DSIZE · رسانه $MSIZE ($FILES فایل، ${XFER:-0} تازه، $DEL حذف، $NEWHASH هشِ نو، $CHECKED بازبینی)  (کاربران: $ROWS)"

# ── هر چیزی که باید داد بزند ──
[ -s "$D/public.dump" ] || note "✗ دامپِ دیتابیس خالی است!"
[ "$RS" -eq 0 ] || note "✗ rsync با کدِ $RS تمام شد — آینه ممکن است ناقص باشد"
[ "$BAD" -eq 0 ] || note "✗ $BAD فایلِ خراب:$BADLIST"
# اسنپ‌شاتِ ناموفق احتمالاً یعنی دیسک پر شده — همان لحظه‌ای که
# بیشتر از همیشه به بکاپ نیاز است.
[ "$SNAP_RC" -eq 0 ] || note "✗ عکسِ لحظه‌ای ساخته نشد (کدِ $SNAP_RC)"

# ── فضای دیسک ──
# پر شدنِ دیسک فقط رسانه را نمی‌خواباند؛ Postgres هم با آن می‌ایستد.
USE=$(df --output=pcent / | tail -1 | tr -dc '0-9')
# `df` که شکست بخورد، `USE` خالی می‌ماند و مقایسه‌ی عددی خطا می‌دهد
case $USE in "" | *[!0-9]*) USE=0 ;; esac
[ "$USE" -lt 70 ] || note "⚠ دیسک ${USE}٪ پر است"
