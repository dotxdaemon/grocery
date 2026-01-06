// ABOUTME: Configures ESLint rules for the grocery PWA codebase.
// ABOUTME: Enables linting for React, TypeScript, Tailwind, and Vitest environments.
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tailwind from 'eslint-plugin-tailwindcss'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const tailwindRecommended = tailwind.configs['flat/recommended'] ?? tailwind.configs.recommended ?? []

export default defineConfig([
  globalIgnores([
    'dist',
    'dev-dist',
    'pnpm-lock.yaml',
    'tailwind.config.js',
    'postcss.config.js',
    'prettier.config.mjs',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['tailwind.config.js', 'postcss.config.js', 'prettier.config.mjs'],
    plugins: {
      tailwindcss: tailwind,
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      ...(Array.isArray(tailwindRecommended) ? tailwindRecommended : [tailwindRecommended]),
    ],
    settings: {
      tailwindcss: {
        callees: ['cn'],
      },
    },
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest,
      },
    },
  },
])
