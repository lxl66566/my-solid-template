// Flat ESLint config.
//
// Layers (last wins):
//   1. eslint recommended + import-x             — generic bugs, import hygiene
//   2. typescript-eslint strict/stylistic (type-aware) — needs type info, catches
//      floating promises, unsafe `any` leakage, etc.
//   3. unicorn + perfectionist + regexp          — opinionated consistency
//   4. eslint-plugin-solid (flat/typescript)     — SolidJS reactivity pitfalls
//   5. eslint-config-prettier                    — disable formatting conflicts
//
// Fast rule-only feedback also runs via oxlint (see .oxlintrc.json); ESLint is
// kept for the type-aware and Solid-specific rules oxlint can't do yet.
import js from "@eslint/js";
import vitest from "@vitest/eslint-plugin";
import prettier from "eslint-config-prettier";
import { importX } from "eslint-plugin-import-x";
import { configs as perfectionist } from "eslint-plugin-perfectionist";
import { configs as regexpConfigs } from "eslint-plugin-regexp";
import solidPlugin from "eslint-plugin-solid";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

// The package ships a CJS default export; normalise it.
const solid = solidPlugin.default ?? solidPlugin;

export default tseslint.config(
  {
    ignores: ["dist/**", "src-tauri/**", "node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  importX.flatConfigs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  unicorn.configs["flat/recommended"],
  perfectionist["recommended-natural"],
  regexpConfigs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { solid },
    rules: {
      // SolidJS reactivity & pattern rules — the main reason we lint.
      ...solid.configs["flat/typescript"].rules,
    },
  },
  {
    files: ["src/**/*.{test,spec}.{ts,tsx}"],
    ...vitest.configs.recommended,
    rules: {
      ...vitest.configs.recommended.rules,
      // Tests legitimately read signals outside tracked scopes.
      "solid/reactivity": "off",
    },
  },
  // Plain JS files (like this config) have no project type info.
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    rules: {
      // AGENTS.md: no `any` / `as unknown`.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // TS's own import resolution is authoritative; this rule needs a
      // resolver to understand tsconfig paths/bundler resolution.
      "import-x/no-unresolved": "off",
      // Solid assigns `let` refs at runtime via its JSX transform
      // (`<div ref={el}>`), so the linter sees no assignment — disable to
      // avoid false positives on this idiomatic pattern.
      "no-unassigned-vars": "off",
      // TS already enforces undefined-variable checks; the core rule
      // produces false positives for types/globals.
      "no-undef": "off",
      "prefer-const": "error",
      // Components are PascalCase (App.tsx), the rest kebab-case.
      "unicorn/filename-case": [
        "error",
        { cases: { kebabCase: true, pascalCase: true } },
      ],
      "unicorn/name-replacements": [
        "error",
        {
          allowList: {
            args: true,
            Args: true,
            env: true,
            Env: true,
            props: true,
            Props: true,
            ref: true,
            Ref: true,
          },
        },
      ],
    },
  },
  prettier,
);
