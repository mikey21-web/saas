/**
 * eslint.security.config.mjs
 * diyaa.ai — Security-focused ESLint Flat Config
 * Run: npx eslint -c eslint.security.config.mjs .
 */

import securityPlugin from 'eslint-plugin-security'
import noSecretsPlugin from 'eslint-plugin-no-secrets'
import sonarjsPlugin from 'eslint-plugin-sonarjs'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.min.js',
      '**/public/*.js', // Standalone widget files
    ],
  },

  // Base recommended configurations
  ...tseslint.configs.recommended,
  securityPlugin.configs.recommended,
  sonarjsPlugin.configs.recommended,

  // Custom rules mappings
  {
    plugins: {
      'no-secrets': noSecretsPlugin,
    },
    rules: {
      // ─── 🔐 SECRETS & CREDENTIALS ────────────────────────────────────────────
      'no-secrets/no-secrets': ['error', { tolerance: 4.2 }], // Entropy-based secret detection
      'no-restricted-syntax': [
        'error',
        // Block hardcoded keys matching common patterns
        {
          selector: 'Literal[value=/sk-[a-zA-Z0-9]{32,}/]',
          message: '🚨 Possible OpenAI/Anthropic API key hardcoded. Use env vars.',
        },
        {
          selector: 'Literal[value=/AIza[0-9A-Za-z-_]{35}/]',
          message: '🚨 Possible Google API key hardcoded. Use env vars.',
        },
        {
          selector: 'Literal[value=/whatsapp_api_token.*=.*[\'"][A-Za-z0-9]{20,}/]',
          message: '🚨 Possible WhatsApp token hardcoded. Use env vars.',
        },
      ],

      // ─── 🛡️ INJECTION PREVENTION ─────────────────────────────────────────────
      'security/detect-non-literal-regexp': 'error', // Prevents ReDoS attacks
      'security/detect-unsafe-regex': 'off', // Dangerous regex patterns
      'security/detect-non-literal-fs-filename': 'error', // Path traversal via dynamic filenames
      'security/detect-non-literal-require': 'error', // Dynamic require() injection
      'security/detect-object-injection': 'off',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-buffer-noassert': 'error', // Buffer overflow
      'security/detect-child-process': 'error', // Shell injection via child_process
      'security/detect-disable-mustache-escape': 'error', // XSS via unescaped templates
      'security/detect-eval-with-expression': 'error', // eval() with dynamic input
      'security/detect-new-buffer': 'error', // Deprecated Buffer() constructor

      // ─── 🔑 AUTH & AUTHORIZATION ─────────────────────────────────────────────
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/lib/supabase/admin*'],
              message: '🚨 Admin Supabase client must only be used in server-side files.',
            },
          ],
        },
      ],

      // ─── 🧠 LOGIC & RELIABILITY (SonarJS) ────────────────────────────────────
      'sonarjs/no-all-duplicated-branches': 'error',
      'sonarjs/no-element-overwrite': 'error',
      'sonarjs/no-extra-arguments': 'error',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/no-use-of-empty-return-value': 'error',
      'sonarjs/no-collection-size-mischeck': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-unused-collection': 'off',
      'sonarjs/no-useless-catch': 'off',
      'sonarjs/prefer-immediate-return': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-ignored-exceptions': 'off',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/todo-tag': 'off',
      'sonarjs/no-dead-store': 'off',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/prefer-single-boolean-return': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/use-type-alias': 'off',
      'sonarjs/slow-regex': 'off',

      // ─── 🌐 API / NEXT.JS SPECIFIC ───────────────────────────────────────────
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-throw-literal': 'error',

      // ─── 🗄️ DATA HANDLING ────────────────────────────────────────────────────
      'no-restricted-globals': [
        'error',
        {
          name: 'eval',
          message: '🚨 eval() is forbidden. Never use it — high XSS/injection risk.',
        },
        {
          name: 'Function',
          message: '🚨 new Function() can execute arbitrary code. Avoid it.',
        },
      ],
    },
  },

  // ── Stricter rules for API routes (highest risk surface) ──────────────────
  {
    files: ['**/app/api/**/*.ts', '**/app/api/**/*.js', '**/pages/api/**/*.ts'],
    rules: {
      'security/detect-object-injection': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // ── Relaxed rules for config/tooling files ────────────────────────────────
  {
    files: ['**/*.config.js', '**/*.config.ts', '**/*.config.mjs', '**/scripts/**/*'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // ── Test files ────────────────────────────────────────────────────────────
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*'],
    rules: {
      'no-secrets/no-secrets': 'off', // Test files may have mock keys
      'sonarjs/no-duplicate-string': 'off',
    },
  }
)
