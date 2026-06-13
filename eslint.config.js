// @ts-check
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Ignore build output and generated files
  { ignores: ['dist/', 'node_modules/', '**/*.d.ts'] },

  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React hooks correctness
      ...reactHooks.configs.recommended.rules,
      // React Fast Refresh — warn if non-component is exported from a component file
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // TypeScript strictness — no `any` in the codebase (use `unknown` + type narrowing)
      '@typescript-eslint/no-explicit-any': 'error',
      // Allow intentionally unused params prefixed with `_`
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
)
