import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules', '.dist_snapshot', 'scripts/'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[_A-Z]' }],
      // react-hooks/purity is too aggressive: it flags Math.random / performance.now
      // inside event handlers and timers as "calls during render" even when they're
      // legitimately used for RT capture and trial generation. We rely on these in
      // the cognitive test components.
      'react-hooks/purity': 'off',
      // react-hooks/set-state-in-effect fires on the standard "hydrate form from
      // incoming props" pattern (BiomarkerPanel reading latestPanel). Acceptable
      // here; revisit if cascading-render perf becomes a real issue.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
