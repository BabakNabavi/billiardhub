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

echo "── ارسال ──"
scp -i "$KEY" -q /tmp/bh-deploy.tgz "$SRV:/tmp/"
rm -f /tmp/bh-deploy.tgz

echo "── نصب و بیلد (چند دقیقه) ──"
ssh -i "$KEY" -o ServerAliveInterval=15 "$SRV" 'bash -s' <<'REMOTE'
set -e
cd /opt/billiardhub
cp apps/web/.env.local /tmp/.env.keep          # env سرور نباید گم شود
tar -xzf /tmp/bh-deploy.tgz && rm /tmp/bh-deploy.tgz
mv /tmp/.env.keep apps/web/.env.local && chmod 600 apps/web/.env.local
npm install --no-audit --no-fund --silent
cd apps/web && npm run build 2>&1 | tail -3
systemctl restart billiardhub
sleep 12
echo "سرویس: $(systemctl is-active billiardhub)"
curl -s -o /dev/null -w "پاسخ محلی: HTTP %{http_code}\n" --max-time 60 http://127.0.0.1:3000/
REMOTE
echo "✅ دیپلوی تمام شد — https://billiardhub.net"
