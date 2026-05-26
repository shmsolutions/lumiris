import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // Files to exclude from Knip analysis
  ignore: [
    'checkly.config.ts',
    'src/libs/I18n.ts',
    'src/types/I18n.ts',
    'src/components/LocaleSwitcher.tsx', // Kept for future locale switching UI
  ],
  // Dependencies to ignore during analysis
  ignoreDependencies: [
    '@clerk/shared',
    '@swc/helpers', // Avoid error in CI: "`npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync."
    '@faker-js/faker', // Used by Storybook/test fixtures
    'vitest-browser-react', // Used by the Storybook vitest config
  ],
  // Include custom Playwright test file suffixes
  playwright: {
    entry: ['tests/**/*.@(integ|e2e).ts'],
  },
  // Binaries to ignore during analysis
  ignoreBinaries: [
    'production', // False positive raised with dotenv-cli
  ],
  // Exported module API + zod input types are kept even before they're imported
  // elsewhere; don't fail the build on those for the MVP.
  rules: {
    exports: 'off',
    types: 'off',
    nsExports: 'off',
    nsTypes: 'off',
    enumMembers: 'off',
  },
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/gu)].join('\n'),
  },
  treatConfigHintsAsErrors: true,
};

export default config;
