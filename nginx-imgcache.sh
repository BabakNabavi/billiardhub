#!/bin/bash
# کشِ سمتِ سرورِ بندانگشتی‌های Storage — روی خودِ سرور اجرا شود:
#
#     scp -i ~/.ssh/billiardhub_parspack nginx-imgcache.sh root@130.185.72.87:/tmp/
#     ssh -i ~/.ssh/billiardhub_parspack root@130.185.72.87 'bash /tmp/nginx-imgcache.sh'
#
# ── چرا (اندازه‌گیری، آبانِ ۱۴۰۵) ──
# `/storage/v1/render/image/…` هر بار عکسِ اصلی را می‌خواند و از نو
# کوچک می‌کند: بارِ اولِ هر عکس ۱٫۳ تا ۱٫۶ ثانیه، بعد ۰٫۲. nginx هیچ
# proxy_cache نداشت — سرآیندِ ۳۰ روزه فقط مرورگرِ *همان* کاربر را کش
# می‌کرد، پس هر بازدیدکننده‌ی تازه‌ی هر صفحه همان ثانیه‌ها را می‌داد.
#
# ── چرا اعتبارِ یک‌روزه و نه سی‌روزه ──
# لوگو و عکسِ باشگاه با نامِ اصلیِ فایل بارگذاری می‌شوند
# (`clubs/<id>/logo/<file.name>`)؛ گوشی‌ها اغلب «image.jpg» می‌دهند،
# پس عکسِ جایگزین ممکن است همان نشانی را بگیرد. با یک روز اعتبار و
# `background_update`، نسخه‌ی کش‌شده فوراً سرو می‌شود و پشتِ صحنه تازه
# می‌شود — جایگزین حداکثر یک روزه دیده می‌شود و کسی منتظرِ ساختن نمی‌ماند.
#
# فقط render/image (بندانگشتی) — فایلِ اصلی خودش سریع است و دست نمی‌خورد.
# کلید بر حسبِ قالبی که مرورگر می‌پذیرد (avif/webp/اصلی) جدا می‌شود،
# چون Storage بر اساسِ Accept قالب را عوض می‌کند.
#
# پشتیبان گرفته می‌شود و پیکربندی پیش از reload تست می‌شود؛ اگر
# `nginx -t` رد کند، همه‌چیز برمی‌گردد.
set -e

F=/etc/nginx/sites-enabled/billiardhub
C=/etc/nginx/conf.d/bh-imgcache.conf
DIR=/var/cache/nginx/bh-img
STAMP=$(date +%Y%m%d-%H%M%S)
BAK=/root/billiardhub.nginx.bak.$STAMP
cp "$F" "$BAK"
echo "پشتیبان: $BAK"

if ! grep -qE '^\s*include\s+/etc/nginx/conf.d/\*\.conf;' /etc/nginx/nginx.conf; then
  echo "✗ nginx.conf پوشه‌ی conf.d را include نمی‌کند — دستی بررسی کن"; exit 1
fi

mkdir -p "$DIR"
chown www-data:www-data "$DIR"

# ── ۱) ناحیه‌ی کش و نگاشتِ قالب (سطحِ http) ──
NEW_C=0
if [ -f "$C" ]; then
  echo "ناحیه‌ی کش: از قبل بود"
else
  cat > "$C" <<'EOF'
# BH-IMG-RENDER-CACHE — بندانگشتی‌های Storage (nginx-imgcache.sh)
proxy_cache_path /var/cache/nginx/bh-img levels=1:2 keys_zone=bh_img:20m max_size=2g inactive=30d use_temp_path=off;
map $http_accept $bh_img_fmt {
    default     orig;
    ~*image/avif avif;
    ~*image/webp webp;
}
EOF
  NEW_C=1
  echo "ناحیه‌ی کش: ساخته شد"
fi

# ── ۲) location ِ بندانگشتی — پیش از BH-IMG-CACHE (اولین regexِ منطبق برنده است) ──
if grep -q 'BH-IMG-RENDER-CACHE' "$F"; then
  echo "location: از قبل بود"
else
  python3 - "$F" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
block = '''    # ── BH-IMG-RENDER-CACHE ──
    # بندانگشتی‌ها روی سرور کش می‌شوند (nginx-imgcache.sh). بارِ اولِ هر
    # عکس ۱٫۳–۱٫۶ ثانیه بود و برای هر بازدیدکننده‌ی تازه تکرار می‌شد.
    location ~ ^/storage/v1/render/image/public/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache bh_img;
        proxy_cache_key "$uri?$args|$bh_img_fmt";
        proxy_cache_valid 200 1d;
        proxy_cache_valid 404 1m;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 10s;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;
        proxy_ignore_headers Cache-Control Expires Set-Cookie Vary;
        proxy_hide_header Cache-Control;
        proxy_hide_header Set-Cookie;
        proxy_hide_header Vary;

        add_header Vary Accept always;
        add_header Cache-Control "public, max-age=2592000, stale-while-revalidate=604800" always;
        add_header X-Cache $upstream_cache_status always;
    }

'''
anchor = '    # ── BH-IMG-CACHE ──'
if anchor not in s:
    sys.exit('لنگرِ BH-IMG-CACHE پیدا نشد — اول nginx-perf.sh')
s = s.replace(anchor, block + anchor, 1)
open(p, 'w', encoding='utf-8').write(s)
PY
  echo "location: اضافه شد"
fi

echo "── تستِ پیکربندی ──"
if ! nginx -t; then
  echo "✗ پیکربندی نامعتبر — برگرداندن"
  cp "$BAK" "$F"
  [ "$NEW_C" = 1 ] && rm -f "$C"
  exit 1
fi

systemctl reload nginx
sleep 2
echo "── بررسی (دو درخواست: MISS سپس HIT) ──"
U=$(curl -s https://billiardhub.net/ | grep -oE '/storage/v1/render/image/public/[^"\\]+' | head -1 | sed 's/&amp;/\&/g')
if [ -n "$U" ]; then
  for i in 1 2; do
    curl -s -o /dev/null -D - -H 'Accept: image/avif,image/webp,*/*' "https://billiardhub.net$U" -w 'time=%{time_total}\n' | grep -iE '^x-cache|^time='
  done
fi
echo "✅ انجام شد. برگرداندن:  cp $BAK $F && rm -f $C && nginx -t && systemctl reload nginx"
