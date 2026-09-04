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
  {
    // اسکریپت‌های تست انتها‌به‌انتها در Node اجرا می‌شوند، نه در مرورگر:
    // `process` و `console` آنجا کاملاً طبیعی‌اند.
    files: ['tests/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        Buffer: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  prettier,
);
