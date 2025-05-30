module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Add any project-specific rules here
  },
  env: {
    node: true,
    es2021: true,
    jest: true, // For Jest global variables
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules/', 'dist/', '.eslintrc.js', 'prettier.config.js'],
}; 