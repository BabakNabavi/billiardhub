#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# فعال‌کردن brotli روی nginx.
#
# ⚠️ این اسکریپت **اجرا نشده** است. مثل بقیه‌ی nginx-*.sh فقط با
# تأییدِ صریح و دستِ خودِ مالک اجرا می‌شود.
#
# ── چه چیزی درست می‌کند و چقدر ──
# gzip از قبل کار می‌کند (اندازه‌گیری شد: چانکِ ۲۲۲ کیلوبایتی روی
# سیم ۷۱ کیلوبایت می‌آید). brotli حدود ۱۵ تا ۲۰ درصدِ دیگر می‌گیرد،
# یعنی وزنِ هر صفحه از ~۳۳۰ کیلوبایت به ~۲۸۰ می‌رسد.
#
# پس این کم‌ارزش‌ترین کارِ فهرستِ کارایی است. اگر وقت محدود است،
# اول سراغِ کشِ صفحه‌ها بروید نه این.
#
# ── چرا ممکن است کار نکند ──
# nginx اوبونتو brotli را داخلِ خودش ندارد؛ ماژولش جدا نصب می‌شود.
# اگر بسته در مخزن نبود، اسکریپت بی‌آنکه چیزی را خراب کند خارج
# می‌شود.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

CONF=/etc/nginx/sites-available/billiardhub
MODCONF=/etc/nginx/conf.d/brotli.conf
STAMP=$(date +%Y%m%d-%H%M%S)

echo "── نصبِ ماژول ──"
if ! apt-get install -y libnginx-mod-brotli 2>/dev/null; then
  echo "✗ بسته‌ی libnginx-mod-brotli در مخزن نیست — هیچ تغییری داده نشد."
  echo "  gzip همچنان کار می‌کند؛ این فقط یک بهبودِ ۱۵ درصدی بود."
  exit 0
fi

echo "── پیکربندی ──"
# ⚠️ در فایلِ جدا، نه داخلِ فایلِ سایت: ارتقای nginx فایلِ سایت را
# دست نمی‌زند ولی conf.d جداست و اگر روزی ماژول نبود، فقط همین یک
# فایل را باید برداشت.
cat > "$MODCONF" <<'CONF'
# brotli — کنارِ gzip، نه به‌جایش.
# مرورگری که br را نمی‌فهمد (یا پشتِ پراکسیِ قدیمی است) همچنان
# gzip می‌گیرد؛ nginx خودش بر اساسِ Accept-Encoding انتخاب می‌کند.
brotli              on;
# ۵ تعادلِ متعارف است. ۱۱ برای محتوای داینامیک گران است و CPUِ همین
# سرور را می‌گیرد که همان سرورِ رندرِ Next هم هست.
brotli_comp_level   5;
brotli_min_length   256;
brotli_types
    text/plain
    text/css
    text/xml
    application/javascript
    application/x-javascript
    application/json
    application/xml
    application/xml+rss
    application/rss+xml
    image/svg+xml
    font/ttf
    font/otf;
CONF

echo "── بررسیِ پیکربندی ──"
# ⚠️ پیش از reload. اگر ماژول درست بارگذاری نشده باشد، nginx همین‌جا
# اعتراض می‌کند و سایت دست‌نخورده می‌ماند.
if ! nginx -t; then
  echo "✗ پیکربندی معتبر نیست — فایل برداشته شد و nginx ری‌لود نشد."
  rm -f "$MODCONF"
  exit 1
fi

cp -a "$CONF" "$CONF.bak-$STAMP" 2>/dev/null || true
systemctl reload nginx
echo "── تأیید ──"
sleep 2
# ⚠️ حتما GET، نه HEAD: در بررسیِ اول همین ممیزی، HEAD پاسخِ
# فشرده‌نشده داد و مرا به نتیجه‌ی غلط «هیچ فشرده‌سازی‌ای نیست»
# رساند. HEAD بدنه ندارد، پس Content-Encoding هم لزوما نمی‌آید.
CHUNK=$(curl -s https://billiardhub.net/clubs | grep -oE '/_next/static/[^"]+\.js' | head -1)
echo "chunk: $CHUNK"
curl -s -D - -o /dev/null -H 'Accept-Encoding: br' "https://billiardhub.net$CHUNK" \
  | grep -i 'content-encoding' || echo '(بدونِ content-encoding — brotli فعال نشد)'

echo "✅ تمام. برای برگرداندن: rm $MODCONF && systemctl reload nginx"
