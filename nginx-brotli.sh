#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# فشرده‌سازیِ Brotli برای پاسخ‌های متنی (HTML، JS، CSS، JSON) — آذرِ ۱۴۰۵.
# با تأییدِ مالک. اجرا روی سرور:
#   ssh root@130.185.72.87 'bash -s' < nginx-brotli.sh
#
# Brotli برای متن حدودِ ۱۵–۲۰٪ کوچک‌تر از gzip است؛ مرورگری که پشتیبانی
# نکند همان gzip را می‌گیرد (gzip-proxied.conf دست نمی‌خورد).
#
# ⚠️ چرا Accept-Encoding خالی به Next: Next خودش gzip می‌کند و nginx
# پاسخِ از قبل فشرده را دوباره فشرده نمی‌کند — بی این خط Brotli هیچ‌وقت
# روی صفحه‌ها و چانک‌ها اعمال نمی‌شد. حالا Next خام می‌دهد و nginx (هم br
# هم gzip) فشرده می‌کند.
#
# ایمن: از پیکربندی نسخه‌ی پشتیبان گرفته می‌شود و اگر `nginx -t` رد کند،
# همه‌چیز برمی‌گردد و nginx بارگذاری نمی‌شود. اجرای دوباره بی‌اثر است.
# برگرداندن: rm /etc/nginx/conf.d/brotli.conf و حذفِ خطِ
# «proxy_set_header Accept-Encoding» از sites-enabled/billiardhub، بعد reload.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SITE=$(readlink -f /etc/nginx/sites-enabled/billiardhub)
GZIP=/etc/nginx/conf.d/gzip-proxied.conf
CONF=/etc/nginx/conf.d/brotli.conf
STAMP=$(date +%Y%m%d-%H%M%S)
BAK=/root/billiardhub.nginx.bak.$STAMP

echo "── پیش‌شرط‌ها ──"
# nginxِ رسمیِ اوبونتو (ماژول به همان ABI بسته است)
dpkg -s nginx >/dev/null 2>&1 || { echo "✗ nginx از بسته‌ی اوبونتو نیست — دستی بررسی شود"; exit 1; }
# مرورگرِ بی‌br همان gzip را می‌گیرد؛ gzip برای پاسخِ پراکسی باید روشن باشد
[ -f "$GZIP" ] || { echo "✗ $GZIP نیست — اول nginx-gzip-json.sh"; exit 1; }
# proxy_set_header در location فقط وقتی ارث نمی‌برد که location خودش داشته باشد؛
# location / همین حالا Host و IP را خودش می‌گذارد — اگر نه، خطِ تازه آن‌ها را می‌انداخت
sed -n '/location \/ {/,/}/p' "$SITE" | grep -q 'proxy_set_header Host' \
  || { echo "✗ location / سرآیندهای خودش را ندارد — دستی ویرایش شود"; exit 1; }

echo "── نصبِ ماژول ──"
if ! dpkg -s libnginx-mod-http-brotli-filter >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y -q --no-remove libnginx-mod-http-brotli-filter >/dev/null
fi
dpkg -s libnginx-mod-http-brotli-filter | grep -E '^(Status|Version)'

echo "── پشتیبان: $BAK ──"
cp -aL "$SITE" "$BAK"
cp -a "$GZIP" "$BAK.gzip-proxied.conf"
[ -f "$CONF" ] && cp -a "$CONF" "$BAK.brotli.conf" || true

cat > "$CONF" <<'EOF'
# Brotli — همان نوع‌های gzip-proxied.conf (html پیش‌فرض است). nginx-brotli.sh
brotli            on;
brotli_comp_level 5;
brotli_min_length 512;
brotli_types
    application/json
    application/manifest+json
    application/javascript
    application/xml
    application/rss+xml
    text/plain
    text/css
    text/xml
    text/javascript
    text/x-component
    image/svg+xml
    font/ttf
    font/otf;
EOF

# بارِ RSCِ ناوبریِ نرم (text/x-component) را Next خودش gzip می‌کرد؛ حالا که
# خام می‌دهد، gzip هم باید آن را بشناسد — وگرنه برای مرورگرِ بی‌br بی‌فشرده می‌رفت
if ! grep -q 'text/x-component' "$GZIP"; then
  sed -i 's#^\(\s*\)image/svg+xml;#\1text/x-component\n\1image/svg+xml;#' "$GZIP"
  grep -q 'text/x-component' "$GZIP" || { echo "✗ افزودن به gzip_types نشد"; exit 1; }
fi

# فقط در location / (پراکسی به Next روی ۳۰۰۰)، یک بار
if ! grep -q 'proxy_set_header Accept-Encoding ""' "$SITE"; then
  sed -i '/proxy_pass http:\/\/127\.0\.0\.1:3000;/a\        proxy_set_header Accept-Encoding "";  # nginx-brotli.sh: فشرده‌سازی با nginx' "$SITE"
fi
grep -q 'proxy_set_header Accept-Encoding ""' "$SITE" \
  || { echo "✗ خطِ Accept-Encoding ننشست — برگرداندن"; cp -a "$BAK" "$SITE"; cp -a "$BAK.gzip-proxied.conf" "$GZIP"; exit 1; }

echo "── آزمونِ پیکربندی ──"
if nginx -t 2>&1; then
  systemctl reload nginx
  echo "── تأیید ──"
  sleep 2
  # ⚠️ حتما GET، نه HEAD: HEAD بدنه ندارد و Content-Encoding لزوما نمی‌آید
  # (نسخه‌ی اولِ همین اسکریپت به همین دلیل به نتیجه‌ی غلط رسیده بود).
  CHUNK=$(curl -s https://billiardhub.net/clubs | grep -oE '/_next/static/[^"]+\.js' | head -1)
  for U in / "$CHUNK"; do
    echo "$U → br: $(curl -s -D - -o /dev/null -H 'Accept-Encoding: br' "https://billiardhub.net$U" | grep -i '^content-encoding' | tr -d '\r') | gzip: $(curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip' "https://billiardhub.net$U" | grep -i '^content-encoding' | tr -d '\r')"
  done
  echo "✅ Brotli روشن شد"
else
  echo "✗ nginx -t رد کرد — برگرداندن"
  cp -a "$BAK" "$SITE"
  cp -a "$BAK.gzip-proxied.conf" "$GZIP"
  if [ -f "$BAK.brotli.conf" ]; then cp -a "$BAK.brotli.conf" "$CONF"; else rm -f "$CONF"; fi
  nginx -t && echo "پیکربندیِ قبلی سالم است (reload نشد)"
  exit 1
fi
