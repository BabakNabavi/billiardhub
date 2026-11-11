# اپ اندروید بیلیارد هاب (TWA)

این پوشه اپِ اندرویدیِ سایت است: یک **Trusted Web Activity** که خودِ
`https://billiardhub.net` را داخلِ کروم و تمام‌صفحه (بی نوارِ آدرس) باز می‌کند.

- هر دیپلویِ سایت = آپدیتِ اپ. فقط وقتی باید نسخه‌ی تازه به فروشگاه داد که
  آیکون، نام، رنگ‌ها یا تنظیماتِ همین پوشه عوض شود.
- اعلان‌ها (Web Push)، کوکیِ ورود، آپلودِ عکس، دوربینِ پخشِ زنده و برگشت از
  درگاهِ پی‌پینگ همان رفتارِ کروم را دارند — چیزی دوباره ساخته نشده.
- اگر روی گوشی کرومِ سازگار نباشد، اپ به Custom Tab برمی‌گردد (`fallbackType: customtabs`).
- این پوشه بیرون از `apps/` است، پس `deploy.sh` آن را به سرور نمی‌فرستد.

| | |
|---|---|
| شناسه‌ی بسته (همیشگی، هرگز عوض نشود) | `net.billiardhub.app` |
| نام زیرِ آیکون | بیلیارد هاب |
| کمینه‌ی اندروید | 7.0 (API 24؛ خواسته‌ی androidbrowserhelper 2.7.4) · هدف: API 36 |
| سازنده | `@bubblewrap/core` 1.27.0 با `generate.mjs` |

## کلیدِ امضا — مهم‌ترین فایلِ این پروژه

- خودِ کلید: `I:\Billiardhub\android-signing\billiardhub-release.jks`
- رمز و مشخصات: `I:\Billiardhub\android-signing\keystore.properties`
  (یک کپی هم کنارِ همین README هست، و gitignore است).
- ⚠️ **اگر این کلید گم شود، هیچ‌وقت نمی‌شود اپ را در کافه‌بازار/مایکت آپدیت کرد**؛
  باید اپِ تازه با شناسه‌ی تازه ساخت و کاربرانِ فعلی از دست می‌روند.
  دو کپیِ جدا (مثلاً فلش + فضای ابری شخصی) نگه دار.
- هرگز در گیت، چت یا هیچ سرویسی نرود. مخزن عمومی است.
- اثرِ انگشتِ SHA-256 این کلید در `apps/web/public/.well-known/assetlinks.json`
  آمده است. اگر کلید عوض شود، آن فایل هم باید عوض و دیپلوی شود.

## Digital Asset Links

`https://billiardhub.net/.well-known/assetlinks.json` به اندروید ثابت می‌کند اپ
و سایت مالِ یک نفرند. تا این فایل روی سایتِ زنده نباشد، اپ کار می‌کند ولی
**نوارِ آدرس بالای صفحه دیده می‌شود**. فایل در `apps/web/public` است و با
دیپلوی بالا می‌آید. وارسی:

```
curl -s https://billiardhub.net/.well-known/assetlinks.json
```

⚠️ **کافه‌بازار** یک عبارتِ دوم هم در همین فایل می‌خواهد (namespace `cafebazaar_twa`، relation
`check_validation`، بی اثرِ انگشت) — بدونِ آن آپلودِ APK با «فضای نام اجباری cafebazaar_twa …
تعریف نشده است» رد می‌شود. منبع: developers.cafebazaar.ir → Publishing Trusted Web Application on Bazaar.

## ساخت (Windows)

ابزارها بیرون از مخزن‌اند، در `%USERPROFILE%\.bubblewrap-sdk`:
JDK 17 (Temurin) و Android SDK (platform 36، build-tools 35).

⚠️ گوگل دانلودِ SDK و مخزنِ Maven خودش را برای ایران بسته (۴۰۴):
- کتابخانه‌ها از آینه‌ی مایکت می‌آیند (`maven.myket.ir`، در `build.gradle`).
- بسته‌های SDK با `sdkmanager` و متغیرِ `SDK_TEST_BASE_URL` از آینه‌ی Tencent
  (`https://mirrors.cloud.tencent.com/AndroidSDK/`) نصب می‌شوند: `setup-sdk.ps1`
  (یک بار؛ پذیرشِ لایسنس‌های گوگل در آن با خودِ مالک است).
- JDK از آینه‌ی Tsinghua (`mirrors.tuna.tsinghua.edu.cn/Adoptium`) آمد؛ چکسامش
  با API رسمیِ Adoptium یکی بود.

در Git Bash:

```bash
export JAVA_HOME=~/.bubblewrap-sdk/jdk-17
export ANDROID_HOME=~/.bubblewrap-sdk/android-sdk
cd mobile/android
./gradlew assembleRelease bundleRelease
```

خروجی‌ها:
- `app/build/outputs/apk/release/app-release.apk` — برای نصبِ مستقیم و مایکت
- `app/build/outputs/bundle/release/app-release.aab` — اگر فروشگاهی AAB خواست

اگر `keystore.properties` کنارِ این پوشه نباشد، ساختِ release عمداً با خطا
می‌ایستد تا بسته‌ی بی‌امضا اشتباهی آپلود نشود.

## انتشارِ نسخه‌ی تازه

1. در `app/build.gradle` عددِ `versionCode` را یکی بالا ببر (اجباری) و
   `versionName` را عوض کن. همین دو را در `twa-manifest.json` هم بنویس.
2. بساز (بالا) و APK را روی گوشیِ واقعی نصب و امتحان کن.
3. در پنلِ توسعه‌دهنده‌ی کافه‌بازار و مایکت آپلود کن.

## فروشگاه‌ها

- **کافه‌بازار** (`pishkhan.cafebazaar.ir`) و **مایکت** (`myket.ir/developer`):
  حسابِ توسعه‌دهنده با کد ملی. بسته‌ی APK امضاشده آپلود می‌شود و فروشگاه
  دوباره امضا نمی‌کند — پس اثرِ انگشتِ همین کلید در assetlinks درست می‌ماند.
- ⚠️ کافه‌بازار برای فروشِ «محتوای دیجیتال» داخلِ اپ پرداختِ درون‌برنامه‌ای
  خودش را می‌خواهد. کالای فیزیکی و رزرو قاعدتاً مشمول نیست؛ ثبت‌نامِ مسابقه
  و تبلیغات را باید با قوانینِ روزِ بازار چک کرد.
- **گوگل‌پلی** برای توسعه‌دهنده‌ی ایرانی عملاً بسته است. اگر روزی رفت، Play
  کلید را دوباره امضا می‌کند و اثرِ انگشتِ Play هم باید به assetlinks اضافه شود.

## ساختِ دوباره از صفر

`generate.mjs` همین پروژه را از مانیفستِ زنده‌ی سایت می‌سازد
(`npm i @bubblewrap/core@1.27.0` در یک پوشه‌ی موقت، بعد
`node generate.mjs <out>`). بعدش این تغییرهای دستیِ همین پوشه را دوباره بزن:
آینه‌ی مایکت در `build.gradle`، و بلوکِ `signingConfigs` و گاردِ `taskGraph`
در `app/build.gradle`.
