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

echo "── بسته‌بندی ──"
tar --exclude-vcs --exclude='node_modules' --exclude='.next' --exclude='backups' \
    --exclude='.turbo' --exclude='*.log' --exclude='.env*' \
    -czf /tmp/bh-deploy.tgz apps packages package.json package-lock.json turbo.json
echo "   $(du -h /tmp/bh-deploy.tgz | cut -f1)"

# ── چرا ssh و نه scp ──
# ترافیکِ این لپ‌تاپ از VPN رد می‌شود و سرورِ ایرانی از آن مسیر در دسترس
# نیست. در تنظیماتِ Happ فقط `ssh.exe` مستقیم شده؛ `scp.exe` فایلِ
# اجراییِ جداگانه‌ای است و همچنان داخلِ تونل می‌ماند — پس اتصالش برقرار
# می‌شود ولی وسطِ دست‌دادن می‌خوابد. با لوله‌کردن روی ssh، همان یک
# باینریِ مستثناشده کارِ انتقال را هم می‌کند.
echo "── ارسال ──"
ssh -i "$KEY" -o ServerAliveInterval=15 "$SRV" 'cat > /tmp/bh-deploy.tgz' < /tmp/bh-deploy.tgz
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
echo "✅ دیپلوی تمام شد — https://billiardhub.net"
