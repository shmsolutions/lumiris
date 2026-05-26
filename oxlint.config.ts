import { defineConfig } from 'oxlint';
import core from 'ultracite/oxlint/core';
import next from 'ultracite/oxlint/next';
import react from 'ultracite/oxlint/react';
import vitest from 'ultracite/oxlint/vitest';

export default defineConfig({
  extends: [core, react, next, vitest],
  rules: {
    'no-warning-comments': 'off', // Allow TODO and FIXME comments
    'no-inline-comments': 'off', // Allow nearby comments

    'sort-keys': 'off',
    'func-style': 'off',

    'typescript/no-unsafe-assignment': 'off', // Allow implicit `any` assignments
    'typescript/no-unsafe-call': 'off', // Allow implicit `any` calls
    'typescript/no-unsafe-member-access': 'off', // Allow member access on implicit `any` values
    'typescript/strict-boolean-expressions': 'off', // Allow non-boolean conditional checks
    'typescript/consistent-type-definitions': ['error', 'type'], // Use `type` instead of `interface`
    'typescript/no-misused-promises': 'off', // React Hook Form's handleSubmit returns a Promise-typed handler
    'typescript/strict-void-return': 'off', // Allow functions returning Promise<void> where void functions are expected
    'typescript/prefer-regexp-exec': 'off', // Allow use of String#match
    'typescript/no-unsafe-type-assertion': 'off', // next-intl typed keys: t(`x` as 'literal'); @react-pdf BodyInit cast
    'typescript/non-nullable-type-assertion-style': 'off', // Pairs with the assertion convention above
    'typescript/no-non-null-assertion': 'off', // Allow `!` where narrowing is impractical
    'typescript/prefer-nullish-coalescing': 'off', // `||` is intentional for empty-string fallbacks (name || email || '')
    'typescript/consistent-return': 'off', // useEffect cleanup mixes void and cleanup-fn returns

    'unicorn/filename-case': 'off', // Impossible to enforce consistent filename case due to multiple conventions
    'unicorn/no-array-for-each': 'off', // Allow forEach
    'unicorn/prefer-array-find': 'off', // Allow filter()[0] style
    'unicorn/no-negated-condition': 'off', // Allow negated conditions where they read better
    'unicorn/prefer-native-coercion-functions': 'off',
    'unicorn/consistent-function-scoping': 'off',
    'unicorn/no-useless-undefined': 'off', // Explicit `undefined` is needed in zod transforms for clean types

    'eslint/require-unicode-regexp': 'off', // Don't require the /u flag on every regex
    'eslint/no-nested-ternary': 'off', // Allow nested ternaries in JSX
    'eslint/no-empty-function': 'off', // Allow empty handlers/placeholders
    'eslint/no-alert': 'off', // Allow window.confirm for destructive actions
    'eslint/no-use-before-define': 'off', // Allow hoisted function references
    'eslint/no-negated-condition': 'off',
    'eslint/complexity': 'off', // Don't gate on cyclomatic complexity
    'eslint/require-await': 'off', // Allow async wrappers that only return a query builder

    'import/no-named-as-default-member': 'off', // Allow OpenAI.APIError style access
    'import/consistent-type-specifier-style': 'off', // Allow inline `type` specifiers in imports

    // --- JSDoc Rules ---
    // Only enforce completeness of description; full @param/@returns coverage is
    // relaxed for the MVP to avoid noise on inline helpers.
    'jsdoc/require-param': 'off',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/require-returns-description': 'off',
  },
  options: {
    reportUnusedDisableDirectives: 'error',
  },
});
