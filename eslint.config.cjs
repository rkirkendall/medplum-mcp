const js = require('@eslint/js');
const globals = require('globals');
// const tsParser = require('@typescript-eslint/parser'); // Not needed if using tseslint.config
const tseslint = require('typescript-eslint');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier'); // This is eslint-config-prettier

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = tseslint.config(
  // Global ignores
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      '.vscode/',
      '.DS_Store',
      'eslint.config.js', // To be deleted
      'eslint.config.cjs', // Ignore the config file itself
    ],
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript specific configurations using tseslint.config helper
  // This applies typescript-eslint's recommended type-checked rules.
  // It will automatically configure the parser and plugin.
  ...tseslint.configs.recommendedTypeChecked,

  // Customizations specifically for TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      // parserOptions here should be minimal or removed if recommendedTypeChecked handles it all.
      // Let's remove `parserOptions` entirely from this custom block first.
      // `sourceType: 'module'` and `ecmaVersion` are typically set by `recommendedTypeChecked` too.
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      // Project-specific TypeScript rule overrides or additions
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }],
    },
  },
  
  // Prettier configuration - should be last to override other styling rules
  // prettierConfig effectively turns off conflicting ESLint rules.
  prettierConfig, // This is the config object from eslint-config-prettier
  {
    // This applies eslint-plugin-prettier
    files: ['**/*.ts', '**/*.js'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn', // Runs Prettier as an ESLint rule
    },
  },

  // General project-specific rules (applicable to all files or JS files)
  {
    rules: {
      'no-console': 'warn',
      // Add any other general project rules here
    },
  }
); 