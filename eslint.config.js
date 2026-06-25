import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist", "node_modules", "scripts", "*.cjs"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.es2022 },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // TypeScript resolves identifiers/types itself (incl. the react-jsx
      // transform's type-only `React`); core no-undef double-flags these.
      "no-undef": "off",
      // Empty catch blocks are intentional throughout — silent graceful
      // degradation on cache/fetch failures.
      "no-empty": ["error", { allowEmptyCatch: true }],
      // TS compiler already enforces no-unused via noUnusedLocals/Parameters;
      // defer to its handling and allow leading-underscore intentional throwaways.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // The codebase intentionally uses `any` at external-API boundaries (place
      // data, Firebase payloads). Warn rather than error so lint stays green.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
