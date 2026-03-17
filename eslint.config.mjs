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

  // General rule overrides
  {
    rules: {
      '@next/next/no-img-element': 'off',
      // Disable React Compiler rules (experimental, causes false positives)
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
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
    ],
  },
];

export default eslintConfig;
