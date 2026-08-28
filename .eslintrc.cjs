/* ESLint config for Cyril (ESLint 8.x, legacy .eslintrc format).
 * Matches the toolchain already declared in package.json:
 * TypeScript + React Hooks + React Refresh (Vite).
 */
module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-refresh'],
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: [
    'dist',
    'coverage',
    'node_modules',
    'playwright-report',
    '*.config.js',
    '*.config.cjs',
    '*.config.ts',
    'scripts/**',
  ],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Pragmatic defaults for a codebase mid-stabilization: surface real problems
    // without drowning the signal. Tighten these as the code is cleaned up.
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-empty': ['warn', { allowEmptyCatch: true }],
  },
  overrides: [
    {
      files: ['tests/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
