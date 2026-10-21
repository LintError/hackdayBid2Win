import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

// The lint script runs plain `eslint`, so without explicit ignores the flat
// config also lints build output (`.next`) and generated type files, which
// produces thousands of false-positive problems.
const ignores = [
  "**/node_modules/**",
  "**/.next/**",
  "**/out/**",
  "**/build/**",
  "**/dist/**",
  "**/coverage/**",
  "**/.tmp/**",
  "next-env.d.ts",
  "**/*.d.ts",
];

const config = [
  { ignores },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // `const { secret, ...rest } = row` is the idiomatic way to strip a
      // field before returning a row to a client, so those rest siblings are
      // intentionally unused.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { args: "none", ignoreRestSiblings: true },
      ],
    },
  },
];

export default config;
