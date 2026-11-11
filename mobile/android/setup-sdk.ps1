# نصبِ بسته‌های Android SDK از آینه‌ی Tencent (گوگل برای ایران ۴۰۴ می‌دهد).
# یک بار، در یک پنجره‌ی PowerShell معمولی و از ریشه‌ی مخزن اجرا کن:
#   powershell -ExecutionPolicy Bypass -File mobile\android\setup-sdk.ps1
# در مرحله‌ی اول متنِ لایسنس‌های گوگل نشان داده می‌شود و برای هرکدام باید y بزنی.

$ErrorActionPreference = 'Stop'
$env:JAVA_HOME = "$env:USERPROFILE\.bubblewrap-sdk\jdk-17"
$env:SDK_TEST_BASE_URL = 'https://mirrors.cloud.tencent.com/AndroidSDK/'
$sdk = "$env:USERPROFILE\.bubblewrap-sdk\android-sdk"
$mgr = "$sdk\cmdline-tools\latest\bin\sdkmanager.bat"

& $mgr "--sdk_root=$sdk" --licenses
& $mgr "--sdk_root=$sdk" "platforms;android-36" "build-tools;35.0.0"

Write-Host ''
Write-Host 'تمام شد. حالا به Claude بگو «لایسنس را قبول کردم».' -ForegroundColor Green
