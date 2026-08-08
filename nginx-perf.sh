#!/bin/bash
# دو اصلاحِ کاراییِ لایه‌ی سرور — روی خودِ سرور اجرا شود:
#
#     scp -i ~/.ssh/billiardhub_parspack nginx-perf.sh root@130.185.72.87:/tmp/
#     ssh -i ~/.ssh/billiardhub_parspack root@130.185.72.87 'bash /tmp/nginx-perf.sh'
#
# ── چرا ──
# اندازه‌گیریِ صفحه‌ی اصلیِ Production دو چیز نشان داد که هیچ‌کدام در
# کد نیستند:
#
#   ۱) HTTP/2 خاموش است. سرور در ALPN آن را رد می‌کند
#      (ERR_SSL_TLSV1_ALERT_NO_APPLICATION_PROTOCOL). با HTTP/1.1
#      مرورگر بیش از شش اتصالِ هم‌زمان به یک میزبان نمی‌زند، و صفحه‌ی
#      اصلی ۳۵+ دارایی دارد: ۱۴ chunkِ جاوااسکریپت، ۱۸ تصویر، ۳ فونت.
#      یعنی همه‌چیز در موج‌های شش‌تایی صف می‌کشد. روی Vercel این مشکل
#      نبود چون h2 پیش‌فرض بود؛ با مهاجرت به nginx برگشت.
#
#   ۲) تصویرهای Storage سرآیندِ `Cache-Control: no-cache` می‌گیرند.
#      نتیجه‌اش این بود که یک عکسِ باشگاه در یک بارگذاریِ صفحه
#      **هشت بار** دانلود می‌شد، و در هر بازدیدِ بعدی از نو. نامِ
#      فایل‌ها یکتاست (زمان‌دار)، پس کشِ بلند امن است.
#
# پشتیبان گرفته می‌شود و پیکربندی پیش از reload تست می‌شود؛ اگر
# `nginx -t` رد کند، هیچ‌چیز اعمال نمی‌شود.
set -e

F=/etc/nginx/sites-enabled/billiardhub
BAK=/root/billiardhub.nginx.bak.$(date +%Y%m%d-%H%M%S)
cp "$F" "$BAK"
echo "پشتیبان: $BAK"

# ── ۱) HTTP/2 ──
# nginx 1.24 هنوز شکلِ `listen … http2` را می‌خواهد (دستورِ جدای
# `http2 on;` از 1.25 آمد).
if grep -q 'listen 443 ssl http2' "$F"; then
  echo "HTTP/2: از قبل فعال بود"
else
  sed -i 's|listen 443 ssl;|listen 443 ssl http2;|' "$F"
  echo "HTTP/2: فعال شد"
fi

# ── ۲) کشِ تصویرهای عمومیِ Storage ──
# این بلوک باید **پیش از** location عمومیِ /(rest|storage|…)/ بیاید،
# چون nginx در regexها اولین تطبیق را برمی‌دارد.
if grep -q 'BH-IMG-CACHE' "$F"; then
  echo "کشِ تصویر: از قبل بود"
else
  python3 - "$F" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
block = '''
    # ── BH-IMG-CACHE ──
    # تصویرهای عمومیِ Storage. نامشان یکتاست ولی Storage
    # `no-cache` می‌داد؛ یعنی همان عکس در یک صفحه چند بار و در هر
    # بازدید از نو دانلود می‌شد.
    location ~ ^/storage/v1/(render/image|object)/public/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_hide_header Cache-Control;
        add_header Cache-Control "public, max-age=2592000, stale-while-revalidate=604800" always;
    }
'''
anchor = '    # ── سوپابیس ──'
if anchor not in s:
    sys.exit('لنگرِ «سوپابیس» پیدا نشد — دستی اضافه کن')
s = s.replace(anchor, block + '\n' + anchor, 1)
open(p, 'w', encoding='utf-8').write(s)
PY
  echo "کشِ تصویر: اضافه شد"
fi

echo "── تستِ پیکربندی ──"
if ! nginx -t; then
  echo "✗ پیکربندی نامعتبر — برگرداندنِ پشتیبان"
  cp "$BAK" "$F"
  exit 1
fi

systemctl reload nginx
sleep 2
echo "── بررسی ──"
curl -sI --http2 https://billiardhub.net/ 2>/dev/null | head -1 || true
curl -sI "https://billiardhub.net/storage/v1/render/image/public/club-media/x.png?width=64" 2>/dev/null | grep -i cache-control || true
echo "✅ انجام شد. برای برگرداندن:  cp $BAK $F && nginx -t && systemctl reload nginx"
