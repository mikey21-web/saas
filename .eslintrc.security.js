/**
 * .eslintrc.security.js
 * diyaa.ai — Security-focused ESLint config
 * Run: npx eslint --config .eslintrc.security.js . --ext .ts,.tsx,.js
 *
 * Install deps:
 *   npm install --save-dev eslint eslint-plugin-security eslint-plugin-no-secrets
 *   eslint-plugin-node eslint-plugin-sonarjs @typescript-eslint/eslint-plugin
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },

  plugins: [
    'security', // OWASP Top 10 patterns
    'no-secrets', // Detects hardcoded secrets/API keys
    'sonarjs', // Detects code smells + bugs
    '@typescript-eslint',
  ],

  extends: [
    'plugin:security/recommended',
    'plugin:sonarjs/recommended',
    'plugin:@typescript-eslint/recommended',
  ],

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
    'security/detect-unsafe-regex': 'error', // Dangerous regex patterns
    'security/detect-non-literal-fs-filename': 'error', // Path traversal via dynamic filenames
    'security/detect-non-literal-require': 'error', // Dynamic require() injection
    'security/detect-object-injection': 'warn', // Prototype pollution via obj[userInput]
    'security/detect-possible-timing-attacks': 'error', // Timing-based token comparisons
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
    'sonarjs/no-unused-collection': 'warn',
    'sonarjs/no-useless-catch': 'warn',
    'sonarjs/prefer-immediate-return': 'warn',
    'sonarjs/cognitive-complexity': ['warn', 15], // Flag overly complex functions

    // ─── 🌐 API / NEXT.JS SPECIFIC ───────────────────────────────────────────
    'no-console': ['warn', { allow: ['warn', 'error'] }], // No console.log in production
    '@typescript-eslint/no-explicit-any': 'warn', // Forces type safety
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-non-null-assertion': 'warn', // Prevents runtime null crashes
    'no-throw-literal': 'error', // Always throw Error objects

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

  overrides: [
    // ── Stricter rules for API routes (highest risk surface) ──────────────────
    {
      files: ['app/api/**/*.ts', 'app/api/**/*.js'],
      rules: {
        'security/detect-object-injection': 'error', // Upgrade to error in API routes
        'no-console': 'error', // Zero console.log in API routes
        '@typescript-eslint/no-explicit-any': 'error', // Full type safety required in API
      },
    },

    // ── Relaxed rules for config/tooling files ────────────────────────────────
    {
      files: ['*.config.js', '*.config.ts', 'scripts/**/*'],
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
    },
  ],

  // Files/dirs to ignore
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    'public/*.js', // Standalone widget files (minified embeds)
  ],
}
