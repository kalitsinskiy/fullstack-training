// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['eslint.config.mjs', 'dist'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // Skeleton handlers ship unimplemented, so unused *parameters* are expected.
      // Unused imports and local variables are still reported.
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
    },
  },
);
