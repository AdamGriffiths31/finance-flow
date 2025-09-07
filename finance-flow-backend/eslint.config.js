const typescriptParser = require('@typescript-eslint/parser');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const jsdocPlugin = require('eslint-plugin-jsdoc');

module.exports = [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'jsdoc': jsdocPlugin,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        caughtErrors: 'none'
      }],
      '@typescript-eslint/no-unused-imports': 'off',
      
      // JSDoc Rules - Focus on public APIs and exported functions
      'jsdoc/require-jsdoc': ['error', {
        require: {
          FunctionDeclaration: false,
          MethodDefinition: false,
          ClassDeclaration: true,
          ArrowFunctionExpression: false,
          FunctionExpression: false
        },
        contexts: [
          'ExportNamedDeclaration > FunctionDeclaration',
          'ExportDefaultDeclaration > FunctionDeclaration',
          'TSMethodSignature',
          'TSPropertySignature:has(TSFunctionType)',
          'MethodDefinition[accessibility!="private"]',
          'MethodDefinition[key.name!=/^_/]', // Methods not starting with underscore
        ],
        exemptEmptyConstructors: true,
        exemptEmptyFunctions: false,
        publicOnly: true
      }],
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-types': 'error',
      'jsdoc/no-undefined-types': 'error',
      'jsdoc/check-indentation': 'warn',
      'jsdoc/check-alignment': 'warn',
    },
  },
];