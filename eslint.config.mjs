import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // آرگومان‌های بی‌استفاده با پیشوند _ مجازند (الگوی رایج در امضای
      // متدهای اینترفیس که همهٔ پارامترها لازم نیستند).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // در NestJS دکوراتورها اغلب نیازمند این الگو هستند.
      '@typescript-eslint/no-extraneous-class': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  prettier,
);
