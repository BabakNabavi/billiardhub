import { TwaManifest, TwaGenerator, ConsoleLog } from "@bubblewrap/core";

const out = process.argv[2];
if (!out) throw new Error("usage: node generate.mjs <outDir>");

const m = await TwaManifest.fromWebManifest(
  "https://billiardhub.net/manifest.json",
);
m.packageId = "net.billiardhub.app";
m.name = "بیلیارد هاب";
m.launcherName = "بیلیارد هاب";
m.enableNotifications = true;
m.enableSiteSettingsShortcut = false;
m.fallbackType = "customtabs";
m.minSdkVersion = 24; // androidbrowserhelper 2.7.4 کمینه‌ی ۲۴ می‌خواهد
m.appVersionCode = 1;
m.appVersionName = "1.0.0";
m.signingKey = {
  path: "../../../../Billiardhub/android-signing/billiardhub-release.jks",
  alias: "billiardhub",
};
m.generatorApp = "bubblewrap-core-1.27.0";
for (const k of ["themeColorDark", "navigationColor", "navigationColorDark"]) m[k] = m.themeColor;
for (const k of ["navigationDividerColor", "navigationDividerColorDark"]) m[k] = m.backgroundColor;
// اثرِ انگشتِ کلیدِ انتشار — باید با apps/web/public/.well-known/assetlinks.json یکی بماند
m.fingerprints = [
  {
    name: "release (I:/Billiardhub/android-signing)",
    value: "A4:1D:A9:8A:79:78:B7:55:64:2E:84:3B:26:E5:03:D6:E9:09:BF:18:93:C1:5A:2F:B1:99:44:6D:F2:8D:01:3A",
  },
];

console.log(JSON.stringify(m.toJson(), null, 2));
await new TwaGenerator().createTwaProject(out, m, new ConsoleLog("gen"));
await m.saveToFile(`${out}/twa-manifest.json`);
console.log("done", out);
