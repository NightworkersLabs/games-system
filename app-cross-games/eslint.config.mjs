import noRelativeImport from "eslint-plugin-no-relative-import-paths";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
    {
    plugins: { "no-relative-import-paths": noRelativeImport },
    rules: {
      "no-relative-import-paths/no-relative-import-paths": [
        "warn",
        { prefix: "#" },
      ],
    },
  },
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Asset imports
            ["^#/assets/"],
            // Side effect imports.
            ["^\\u0000"],
            // Packages.
            // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
            ["^\\w"],
            // Packages.
            // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
            ["^@\\w"],
            // Absolute imports and other imports such as Vue-style `@/foo`.
            // Anything not matched in another group.
            ["^"],
            // Relative imports.
            // Anything that starts with a dot.
            ["^\\."],
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "func-style": [2, "expression"],
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn", // or "error"
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
