import nextConfig from 'eslint-config-next';

const eslintConfig = [
  // Spread Next.js base config (includes React, Next, TypeScript plugins)
  ...nextConfig,

  // Custom rule overrides — scoped to TS files where the plugin is available
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // General rule overrides — scoped to the same files as eslint-config-next's
  // plugin block, otherwise ESLint 9 fails on *.cjs files where the
  // react-hooks plugin is not registered.
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      '@next/next/no-img-element': 'off',
      // Marketing copy uses plain apostrophes/quotes in JSX text; escaping them
      // adds noise without fixing anything real.
      'react/no-unescaped-entities': 'off',
      // Disable React Compiler rules (experimental, causes false positives)
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  // Do not report stale eslint-disable comments as warnings (they inflate
  // the warning count without pointing at code problems).
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'coverage/**',
      'prisma/generated/**',
            'public/ffmpeg/**',
    ],
  },
];

export default eslintConfig;
