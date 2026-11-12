#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# فشرده‌سازیِ پاسخ‌های API (JSON) و بقیه‌ی متن‌ها روی nginx.
#
# ⚠️ این اسکریپت **اجرا نشده** است. مثل بقیه‌ی nginx-*.sh فقط با
# تأییدِ صریح و دستِ خودِ مالک اجرا می‌شود.
#
# ── چه چیزی درست می‌کند (اندازه‌گیری‌شده، آبانِ ۱۴۰۵) ──
# در /etc/nginx/nginx.conf فقط `gzip on` روشن است؛ `gzip_types` و
# `gzip_proxied` کامنت‌اند. یعنی nginx فقط text/html را فشرده می‌کند
# و چون پاسخ از پراکسی (Next روی ۳۰۰۰) می‌آید، همان هم نه. HTML و JS
# فشرده می‌رسند چون خودِ Next فشرده‌شان می‌کند، ولی **پاسخ‌های API نه**:
#   /api/rankings      ۱۰۱ کیلوبایت خام  (JSON معمولاً ۵ تا ۱۰ برابر جمع می‌شود)
#   /api/market/ads     ۱۳ کیلوبایت خام
#   /api/stories/feed، /api/social/stories، /api/clubs، … همه خام
# روی اینترنتِ موبایل این مستقیماً زمانِ رسیدنِ داده‌ی صفحه است.
#
# ── چرا بی‌خطر است ──
# - پاسخی که از قبل فشرده است (Content-Encoding دارد) دوباره فشرده نمی‌شود.
# - در فایلِ جدای conf.d؛ برگرداندن = حذفِ همان یک فایل.
# - `nginx -t` پیش از reload؛ اگر رد شد فایل برداشته می‌شود و سایت دست‌نخورده.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

MODCONF=/etc/nginx/conf.d/gzip-proxied.conf

echo "── پیکربندی ──"
cat > "$MODCONF" <<'CONF'
# gzip برای پاسخ‌های پراکسی‌شده (Next) و همه‌ی نوع‌های متنی.
# `gzip on` در nginx.conf هست؛ این فقط نوع‌ها و پراکسی را اضافه می‌کند.
gzip_proxied    any;
gzip_vary       on;
# ۵ تعادلِ متعارف است — همین سرور رندرِ Next را هم انجام می‌دهد.
gzip_comp_level 5;
gzip_min_length 512;
gzip_types
    application/json
    application/manifest+json
    application/javascript
    application/xml
    application/rss+xml
    text/plain
    text/css
    text/xml
    text/javascript
    image/svg+xml;
CONF

echo "── بررسیِ پیکربندی ──"
if ! nginx -t; then
  echo "✗ پیکربندی معتبر نیست — فایل برداشته شد و nginx ری‌لود نشد."
  rm -f "$MODCONF"
  exit 1
fi

systemctl reload nginx
echo "── تأیید ──"
sleep 2
# ⚠️ GET نه HEAD: HEAD بدنه ندارد و Content-Encoding لزوماً نمی‌آید.
curl -s -o /dev/null -H 'Accept-Encoding: gzip' \
  -w 'api/rankings  enc=%header{content-encoding}  bytes=%{size_download}\n' \
  https://billiardhub.net/api/rankings

echo "✅ تمام. برای برگرداندن: rm $MODCONF && systemctl reload nginx"
