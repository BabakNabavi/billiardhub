#!/bin/bash
# دیپلوی روی سرورِ ایران.
#     bash deploy.sh
#
# گیت‌هاب از سرور در دسترس نیست، پس کد از همین‌جا فرستاده می‌شود.
# `.env.local` عمداً فرستاده نمی‌شود — نسخه‌ی سرور مقدارهای خودش را دارد.
set -e
SRV=root@130.185.72.87
KEY=~/.ssh/billiardhub_parspack
cd "$(dirname "$0")"

# ── چرا `public` جدا می‌رود ──
# بیست مگابایت از بیست‌ودو مگابایتِ بسته، عکس‌های ثابتِ
# `apps/web/public` است که ماه‌ها دست‌نخورده می‌مانند. لینکِ VPN چند
# بار پشتِ‌سرِ هم وسطِ همان آپلود قطع شد («Connection reset by peer»)
# و هیچ دیپلویی تمام نشد.
#
# حالا اثرِ انگشتِ محتوای پوشه با نسخه‌ی سرور مقایسه می‌شود و فقط
# وقتی چیزی عوض شده باشد فرستاده می‌شود. بسته‌ی معمولی حدودِ دو
# مگابایت می‌ماند — ده برابر کوچک‌تر، و در همین لینکِ لرزان تمام
# می‌شود.
#
# امن است چون `tar -xzf` روی پوشه‌ی موجود می‌ریزد و چیزی پاک نمی‌کند:
# نبودنِ `public` در بسته یعنی نسخه‌ی سرور دست‌نخورده می‌ماند.
#
# ── تله‌ی خروجیِ `sha1sum` ──
# نسخه‌ی Git Bash روی ویندوز فایل را باینری می‌بیند و می‌نویسد
# `hash *./path`، ولی لینوکس `hash  ./path` (دو فاصله). بدونِ
# یکسان‌سازی، دو اثرِ انگشت **هرگز** برابر نمی‌شوند و این بهینه‌سازی
# بی‌صدا بی‌اثر می‌ماند — بسته هر بار کامل می‌رود و کسی نمی‌فهمد چرا.
# `LC_ALL=C` هم برای ترتیبِ یکسانِ مرتب‌سازی لازم است.
PUB_FP="find . -type f -exec sha1sum {} + | sed 's/^\([0-9a-f]*\) \*/\1  /' | LC_ALL=C sort -k2 | sha1sum | cut -d' ' -f1"

echo "── بررسیِ public ──"
PUB_SHA=$(cd apps/web/public && eval "$PUB_FP")
REMOTE_PUB=$(ssh -n -i "$KEY" -o ServerAliveInterval=15 "$SRV" 'cat /opt/billiardhub/.public-sha 2>/dev/null || true')
if [ "$PUB_SHA" = "$REMOTE_PUB" ]; then
  PUB_EXCLUDE="--exclude=apps/web/public"
  echo "   بدون تغییر — فرستاده نمی‌شود"
else
  PUB_EXCLUDE=""
  echo "   عوض شده — همراهِ بسته می‌رود"
fi

echo "── بسته‌بندی ──"
tar --exclude-vcs --exclude='node_modules' --exclude='.next' --exclude='backups' \
    --exclude='.turbo' --exclude='*.log' --exclude='.env*' $PUB_EXCLUDE \
    -czf /tmp/bh-deploy.tgz apps packages package.json package-lock.json turbo.json
echo "   $(du -h /tmp/bh-deploy.tgz | cut -f1)"

# ── چرا ssh و نه scp ──
# ترافیکِ این لپ‌تاپ از VPN رد می‌شود و سرورِ ایرانی از آن مسیر در دسترس
# نیست. در تنظیماتِ Happ فقط `ssh.exe` مستقیم شده؛ `scp.exe` فایلِ
# اجراییِ جداگانه‌ای است و همچنان داخلِ تونل می‌ماند — پس اتصالش برقرار
# می‌شود ولی وسطِ دست‌دادن می‌خوابد. با لوله‌کردن روی ssh، همان یک
# باینریِ مستثناشده کارِ انتقال را هم می‌کند.
#
# ── چرا سه بار تلاش ──
# قطعِ وسطِ آپلود عیبِ گذرای همین مسیر است، نه عیبِ بسته. بدونِ تلاشِ
# دوباره، یک ریستِ اتفاقی کلِ دیپلوی را باطل می‌کرد و باید دستی از نو
# شروع می‌شد. اندازه‌ی فایل روی سرور با اندازه‌ی محلی سنجیده می‌شود،
# چون `cat` نصفه هم با موفقیت تمام می‌شود.
echo "── ارسال ──"
LOCAL_SZ=$(stat -c%s /tmp/bh-deploy.tgz)
SENT=0
for try in 1 2 3; do
  if ssh -i "$KEY" -o ServerAliveInterval=15 "$SRV" 'cat > /tmp/bh-deploy.tgz' < /tmp/bh-deploy.tgz; then
    REMOTE_SZ=$(ssh -n -i "$KEY" -o ServerAliveInterval=15 "$SRV" 'stat -c%s /tmp/bh-deploy.tgz 2>/dev/null || echo 0')
    if [ "$REMOTE_SZ" = "$LOCAL_SZ" ]; then SENT=1; break; fi
    echo "   ناقص رسید ($REMOTE_SZ از $LOCAL_SZ) — تلاشِ $((try+1))"
  else
    echo "   قطع شد — تلاشِ $((try+1))"
  fi
  sleep 3
done
if [ "$SENT" != "1" ]; then
  echo "✗ ارسال بعد از سه تلاش انجام نشد — دوباره اجرا کن"
  rm -f /tmp/bh-deploy.tgz
  exit 1
fi
rm -f /tmp/bh-deploy.tgz

echo "── نصب و بیلد (چند دقیقه) ──"
ssh -i "$KEY" -o ServerAliveInterval=15 "$SRV" 'bash -s' <<'REMOTE'
set -e
cd /opt/billiardhub
cp apps/web/.env.local /tmp/.env.keep          # env سرور نباید گم شود
tar -xzf /tmp/bh-deploy.tgz && rm /tmp/bh-deploy.tgz
mv /tmp/.env.keep apps/web/.env.local && chmod 600 apps/web/.env.local
npm install --no-audit --no-fund --silent
cd apps/web

# ── چرا build در پوشه‌ی جدا ──
# تا امروز build در همان `.next`ی اجرا می‌شد که سرورِ در حالِ اجرا از
# آن می‌خواند. در آن دو دقیقه، فایل‌های manifest و chunk نصفه‌کاره
# بودند و هر بازدیدکننده‌ای که همان لحظه صفحه‌ای باز می‌کرد
# «Internal Server Error» می‌گرفت — از جمله کسی که تازه از درگاهِ
# پرداخت برمی‌گشت. حالا سرورِ قدیمی تا آخرین لحظه پوشه‌ی سالمِ خودش
# را دارد و جابه‌جایی یک `mv` است.
# ── شناسه‌ی این build ──
# `NEXT_PUBLIC_BUILD_SHA` و `/api/version` هر دو همین فایل را می‌خوانند.
# تا امروز از `VERCEL_GIT_COMMIT_SHA` می‌آمد که روی این سرور وجود
# ندارد، پس هر دو 'dev' بودند و بازبارگذاریِ خودکارِ مرورگرِ کهنه —
# که دقیقاً برای رفعِ صفحه‌ی سفید ساخته شده بود — هیچ‌وقت اجرا نشد.
date +%Y%m%d-%H%M%S > .build-sha

rm -rf .next-build .next-old
NEXT_DIST_DIR=.next-build npm run build 2>&1 | tail -3
[ -d .next ] && mv .next .next-old
mv .next-build .next
systemctl restart billiardhub
rm -rf .next-old
sleep 12
echo "سرویس: $(systemctl is-active billiardhub)"
curl -s -o /dev/null -w "پاسخ محلی: HTTP %{http_code}\n" --max-time 60 http://127.0.0.1:3000/
REMOTE

# اثرِ انگشتِ `public` **بعد از** موفقیتِ بیلد ثبت می‌شود. اگر دیپلوی
# وسطِ کار بشکند، دفعه‌ی بعد دوباره کاملش را می‌فرستد.
ssh -n -i "$KEY" -o ServerAliveInterval=15 "$SRV" "echo '$PUB_SHA' > /opt/billiardhub/.public-sha"
echo "✅ دیپلوی تمام شد — https://billiardhub.net"
