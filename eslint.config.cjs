const reactHooks = require('eslint-plugin-react-hooks');
const tseslint = require('typescript-eslint');
const { defineConfig } = require('eslint/config');

const hooksRecommended = reactHooks.configs.flat.recommended;

module.exports = defineConfig([
  {
    ignores: ['.expo/**', 'coverage/**', 'node_modules/**', 'test-results/**'],
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'test/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: hooksRecommended.plugins,
    rules: {
      ...hooksRecommended.rules,
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]);
