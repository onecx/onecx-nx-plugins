const nx = require('@nx/eslint-plugin')

module.exports = [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      'dist',
      'helm',
      'nginx',
      'reports',
      'node_modules',
      '.nx',
      '.eslintcache',
      '.husky',
      '.docusaurus',
      '.github',
      '.scannerwork',
      '.dockerignore',
      '.prettierignore',
      '.browserslistrc',
      '.eslintcache',
      'LICENSE',
      'CHANGELOG.md',
      'README.md',
      'Dockerfile',
      '*.log',
      '*.sh',
      'src/app/shared/generated/**',
      'src/**/*.ico',
      'src/**/*.svg'
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {}
  },
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "vars": "all", "args": "none" }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-require-imports': [
        'off',
        {
          allowAsImport: true
        }
      ]
    }
  }
]
