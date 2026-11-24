/*
 * Copyright 2026 The a2ui-svelte Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import prettierConfig from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import gts from 'gts';
import tseslint from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

/** Core internals that views must not use; they read `ComponentNode.props` instead. */
const VIEW_BOUNDARY = {
  name: '@a2ui/web_core',
  importNames: ['ComponentContext', 'DataContext', 'GenericBinder'],
  message:
    'Adapter views must read ComponentNode.props instead of importing ComponentContext, GenericBinder, or DataContext.',
};

/** The package must work in plain Vite projects, without SvelteKit's modules. */
const SVELTEKIT_ONLY = {
  group: ['$app/*', '$env/*', '$service-worker'],
  message: 'The package must not depend on SvelteKit; it runs in plain Svelte and Vite projects.',
};

const SELF_IMPORT = {
  group: ['@conalog/a2ui-svelte', '@conalog/a2ui-svelte/*'],
  message: 'Use relative imports within the package instead of self-importing it.',
};

export default tseslint.config(
  // Google TypeScript style guide plugin, as in the official A2UI packages.
  // See: https://github.com/google/gts
  ...gts,
  ...svelte.configs['flat/recommended'],

  {
    languageOptions: {
      globals: {...globals.browser, ...globals.node},
    },
    rules: {
      'prettier/prettier': 'off',
      eqeqeq: ['error', 'always', {null: 'ignore'}],
      'no-undef': 'off',
      'no-console': ['warn', {allow: ['warn', 'error']}],
      // Agent messages are untrusted: never evaluate strings as code.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },

  {
    files: ['**/*.svelte'],
    plugins: {'@typescript-eslint': tseslint.plugin},
  },

  {
    files: ['**/*.ts', '**/*.svelte'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_'},
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {prefer: 'type-imports', fixStyle: 'inline-type-imports'},
      ],
    },
  },

  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: tseslint.parser,
        svelteConfig,
      },
    },
    rules: {
      // Agent data must never become HTML.
      'svelte/no-at-html-tags': 'error',
      // `let {...} = $props()` is the Svelte idiom; the Svelte rule knows the runes.
      'prefer-const': 'off',
      'svelte/prefer-const': ['error', {destructuring: 'all', excludedRunes: ['$props', '$state']}],
      // Parameter names in type annotations are not variables.
      'no-unused-vars': 'off',
    },
  },

  {
    // Rune modules: svelte-eslint-parser with the TypeScript parser inside.
    files: ['**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {parser: tseslint.parser, svelteConfig},
    },
  },

  {
    files: ['src/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {paths: [VIEW_BOUNDARY], patterns: [SELF_IMPORT, SVELTEKIT_ONLY]},
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration[exported=null]',
          message:
            'Avoid wildcard barrel exports (`export *`). Use explicit named exports (`export { ... }`) or namespace exports (`export * as ...`).',
        },
      ],
    },
  },

  {
    files: ['tests/**/*.{ts,svelte}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Prettier config (must be last to override conflicting rules)
  prettierConfig,
  ...svelte.configs['flat/prettier'],

  {
    ignores: ['dist/**', 'node_modules/**', '.svelte-kit/**', 'a2ui_explorer/**', '**/*.d.ts'],
  },
);
