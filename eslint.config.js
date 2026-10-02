import { fileURLToPath } from 'node:url'
import { includeIgnoreFile } from 'eslint/config'
import config from '@tpluscode/eslint-config'
import globals from 'globals'

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url))

export default [
  includeIgnoreFile(gitignorePath),
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: [
      '**/*.test.js',
      '**/*.spec.js',
      '**/*.test.mjs',
      '**/*.spec.mjs',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/test/**',
    ],
    rules: {
      '@stylistic/max-statements-per-line': 'off',
    },
  },
  {
    files: ['packages/shape-to-query/test/**'],
    rules: {
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: [
      'packages/demo/vite.config.ts',
      'packages/demo/build-examples.ts',
      '.mocharc.cjs',
    ],
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'n/no-unpublished-require': 'off',
      'n/no-unpublished-import': 'off',
    },
  },
  {
    files: ['packages/demo/public/how-tos/**'],
    rules: {
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  {
    files: ['packages/demo/public/lib/**'],
    rules: {
      'import-x/no-unresolved': 'off',
      'import-x/no-extraneous-dependencies': 'off',
    },
  },
]
