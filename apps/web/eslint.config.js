import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    /* ⚠️ react-three-fiber عناصرِ خودِ three.js را به‌عنوان تگِ JSX
       معرفی می‌کند (`<mesh>`، `<directionalLight>`، …) و پراپ‌هایشان
       (`intensity`، `castShadow`، `shadow-mapSize`، …) در فهرستِ
       صفاتِ DOM نیستند. قاعده‌ی `no-unknown-property` این‌ها را
       اشتباهی خطا می‌گیرد؛ ۲۶ هشدارِ کاذب فقط در همین پوشه.
       محدوده عمداً تنگ است تا صفاتِ واقعاً غلطِ DOM در بقیه‌ی
       پروژه همچنان گرفته شوند. */
    files: ["components/tech/cue3d/**/*.tsx"],
    rules: { "react/no-unknown-property": "off" },
  },
];
