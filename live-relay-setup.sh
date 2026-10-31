#!/usr/bin/env bash
# ═════════════════════════════════════════════════════════════════════
# راه‌اندازیِ رله‌ی پخش زنده (apps/live-relay) — یک بار، روی سرور، با تأییدِ مالک.
#
#   scp -i ~/.ssh/billiardhub_parspack live-relay-setup.sh root@130.185.72.87:/tmp/
#   ssh -i ~/.ssh/billiardhub_parspack root@130.185.72.87 "bash /tmp/live-relay-setup.sh"
#
# چه می‌کند (بارِ دوم اجرا بی‌خطر است — هر مرحله اگر انجام شده، رد می‌شود):
#   ۱) ffmpeg (اگر نیست) نصب می‌کند.
#   ۲) یک رازِ مشترک (LIVE_RELAY_SECRET) و LIVE_RELAY_URL را به انتهای
#      apps/web/.env.local **اضافه** می‌کند — چیزی پاک یا عوض نمی‌شود و پیش از
#      آن پشتیبان گرفته می‌شود. اگر از قبل باشند، دست نمی‌خورند.
#   ۳) سرویسِ systemdِ «billiardhub-relay» (فقط روی 127.0.0.1:4100، کاربرِ
#      محدودِ پویا، سقفِ CPU و حافظه).
#   ۴) در nginx فقط مسیرِ /live-relay را به رله می‌دهد (پشتیبان + nginx -t،
#      و در صورتِ خطا برگرداندن). health فقط از خودِ سرور.
#   ۵) سایت را فقط اگر .env.local عوض شد یک بار ری‌استارت می‌کند (چند ثانیه).
#
# بار: فقط تصویرِ ورودیِ باشگاه‌ها از این‌جا رد می‌شود؛ بیننده‌ها از CDNِ آروان
# می‌بینند. هر پخشِ هم‌زمان از مرورگر حدودِ یک هسته‌ی CPU (ffmpeg) — سقف خودکار
# نصفِ هسته‌ها. دوربین‌های ثابتِ سالن (OBS/IP) مستقیم به آروان می‌روند و از رله رد نمی‌شوند.
# ═════════════════════════════════════════════════════════════════════
set -eu
# ⚠️ pipefail عمداً نه: `ffmpeg … | grep -q` با بسته‌شدنِ زودِ grep شکست می‌خورد

APP=/opt/billiardhub
ENVF=$APP/apps/web/.env.local
RENV=/etc/billiardhub-relay.env
UNIT=/etc/systemd/system/billiardhub-relay.service
NGX=/etc/nginx/sites-enabled/billiardhub
STAMP=$(date +%Y%m%d-%H%M%S)
CHANGED=""

# افزودنِ یک خط به .env.local — با پشتیبان، و با سطرِ تازه اگر فایل بی‌آن تمام
# شده (وگرنه متغیرِ آخرِ فایل خراب می‌شد)
append_env() {
  [ -f "$ENVF.bak.$STAMP" ] || cp "$ENVF" "$ENVF.bak.$STAMP"
  if [ -n "$(tail -c1 "$ENVF")" ]; then echo >> "$ENVF"; fi
  printf '%s\n' "$1" >> "$ENVF"
  CHANGED=1
}

echo "── ۰) پیش‌نیازها ──"
[ -f "$APP/apps/live-relay/server.mjs" ] || { echo "✗ کدِ رله روی سرور نیست — اول دیپلوی"; exit 1; }
[ -f "$ENVF" ] || { echo "✗ $ENVF نیست"; exit 1; }
if [ ! -d "$APP/apps/live-relay/node_modules/ws" ] && [ ! -d "$APP/node_modules/ws" ]; then
  (cd "$APP" && npm install --no-audit --no-fund --silent)
fi
NODE=$(readlink -f "$(command -v node)")
echo "node: $NODE ($($NODE -v))"

echo "── ۱) ffmpeg ──"
if ! command -v ffmpeg >/dev/null; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg
fi
if ! ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libx264; then echo "✗ ffmpeg بی libx264"; exit 1; fi
echo "ffmpeg: $(ffmpeg -version | head -1 | cut -c1-60)"

echo "── ۲) رازِ مشترک ──"
if grep -q '^LIVE_RELAY_SECRET=' "$ENVF"; then
  SECRET=$(grep '^LIVE_RELAY_SECRET=' "$ENVF" | tail -1 | cut -d= -f2-)
  echo "از قبل بود — دست نخورد"
else
  SECRET=$(openssl rand -hex 32)
  append_env "LIVE_RELAY_SECRET=$SECRET"
  echo "اضافه شد (پشتیبان: $ENVF.bak.$STAMP)"
fi
grep -q '^LIVE_RELAY_URL=' "$ENVF" || append_env 'LIVE_RELAY_URL=wss://billiardhub.net/live-relay'

CORES=$(nproc)
MAX=$(( CORES / 2 )); [ "$MAX" -lt 1 ] && MAX=1
( umask 077; printf 'LIVE_RELAY_SECRET=%s\nRELAY_PORT=4100\nRELAY_MAX=%s\nNODE_ENV=production\n' "$SECRET" "$MAX" > "$RENV" )
echo "هسته‌ها: $CORES ⟵ سقفِ پخشِ هم‌زمان از مرورگر: $MAX"

echo "── ۳) سرویسِ رله ──"
# کاربرِ پویا و محدود: ffmpeg رسانه‌ی آمده از اینترنت را باز می‌کند؛ نباید root باشد.
# EnvironmentFile را خودِ systemd (root) می‌خواند، پس 0600 می‌ماند.
QUOTA=$(( MAX * 100 + 50 ))
cat > "$UNIT" <<UNITEOF
[Unit]
Description=BilliardHub live relay (browser -> RTMP)
After=network.target

[Service]
WorkingDirectory=$APP/apps/live-relay
ExecStart=$NODE server.mjs
EnvironmentFile=$RENV
Restart=always
RestartSec=3
DynamicUser=yes
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
MemoryMax=1500M
CPUQuota=${QUOTA}%
LimitNOFILE=4096
# سایت اولویت دارد؛ ffmpeg پس از آن
Nice=5

[Install]
WantedBy=multi-user.target
UNITEOF
systemctl daemon-reload
systemctl enable billiardhub-relay
systemctl restart billiardhub-relay
sleep 3
systemctl is-enabled billiardhub-relay >/dev/null || { echo "✗ رله پس از ری‌بوت بالا نمی‌آید (enable نشد)"; exit 1; }
systemctl is-active billiardhub-relay >/dev/null || { journalctl -u billiardhub-relay -n 20 --no-pager; echo "✗ رله بالا نیامد"; exit 1; }
curl -fsS http://127.0.0.1:4100/live-relay/health || echo "(health هنوز آماده نیست)"
echo

echo "── ۴) nginx ──"
if grep -q 'BH-LIVE-RELAY' "$NGX"; then
  echo "از قبل بود"
else
  cp "$NGX" "/root/billiardhub.nginx.bak.$STAMP"
  python3 - "$NGX" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
block = '''
    # ── BH-LIVE-RELAY ──
    # پخش زنده از مرورگر: WebSocket به رله (apps/live-relay، 127.0.0.1:4100).
    # ^~ تا locationهای regex جلویش را نگیرند؛ بافر خاموش، زمانِ باز طولانی.
    location = /live-relay/health {
        allow 127.0.0.1;
        deny all;
        proxy_pass http://127.0.0.1:4100;
    }
    location ^~ /live-relay {
        proxy_pass http://127.0.0.1:4100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
        proxy_request_buffering off;
        client_max_body_size 0;
    }
'''
anchor = '    # ── سوپابیس ──'
if anchor not in s:
    sys.exit('لنگرِ «سوپابیس» پیدا نشد — دستی اضافه کن')
s = s.replace(anchor, block + '\n' + anchor, 1)
open(p, 'w', encoding='utf-8').write(s)
PY
  if ! nginx -t; then
    echo "✗ پیکربندی نامعتبر — برگرداندنِ پشتیبان"
    cp "/root/billiardhub.nginx.bak.$STAMP" "$NGX"
    exit 1
  fi
  systemctl reload nginx
  echo "اضافه شد (پشتیبان: /root/billiardhub.nginx.bak.$STAMP)"
fi

echo "── ۵) سایت (خواندنِ رازِ تازه) ──"
if [ -n "$CHANGED" ]; then
  systemctl restart billiardhub
  sleep 4
  echo "سایت ری‌استارت شد: $(systemctl is-active billiardhub)"
else
  echo "تنظیمات عوض نشد — سایت ری‌استارت نشد"
fi
# از بیرون: health باید ۴۰۳ باشد (فقط از خودِ سرور)، و ارتقای WebSocket بی‌توکن ۴۰۱
echo "health از بیرون (انتظار 403): $(curl -s -o /dev/null -w '%{http_code}' https://billiardhub.net/live-relay/health || true)"
echo "WebSocket بی‌توکن (انتظار 401): $(curl -s -o /dev/null -w '%{http_code}' -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGVzdHRlc3R0ZXN0dGVzdA==' -H 'Origin: https://billiardhub.net' https://billiardhub.net/live-relay || true)"
echo "✅ انجام شد. برگرداندن: systemctl disable --now billiardhub-relay و حذفِ بلوکِ BH-LIVE-RELAY از $NGX"
