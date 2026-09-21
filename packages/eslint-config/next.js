import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import pluginNext from "@next/eslint-plugin-next";
import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nextJsConfig = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  /* ⚠️ اسکریپت‌های Node (پشتیبان، مهاجرت، تست) در محیط Node اجرا
     می‌شوند نه مرورگر. بدونِ این بلوک، هر `process` و `console`
     یک `no-undef` می‌گرفت — ۵۱۵ اخطار که هیچ‌کدام باگ نبودند و
     دروازه‌ی کیفیت را از روز اول قرمز نگه می‌داشتند. */
  {
    files: ["**/scripts/**/*.{js,mjs,cjs}", "*.config.{js,mjs,cjs}", "instrumentation.ts"],
    /* ⚠️ گلوبالِ مرورگر هم لازم است: اسکریپت‌های تستِ UI قطعه‌کدِ
       مرورگر را داخل page.evaluate می‌برند، پس document و window در
       همان فایلِ Node ظاهر می‌شوند. */
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // ⚠️ پیش‌فرضِ این قاعده "warn" است و دقیقا به همین دلیل یک باگِ
      // ترتیبِ هوک تا سایتِ زنده رفت و صفحه‌ی مربی و داور را کامل
      // می‌انداخت: لینت دیده بودش ولی کسی بینِ هشدارها ندیدش.
      "react-hooks/rules-of-hooks": "error",
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
    },
  },
];
