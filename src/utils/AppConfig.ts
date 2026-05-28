import { enUS, ptBR } from '@clerk/localizations';
import type { LocalizationResource } from '@clerk/shared/types';
import type { LocalePrefixMode } from 'next-intl/routing';

const localePrefix: LocalePrefixMode = 'as-needed';

/** Centralized application configuration. */
export const AppConfig = {
  name: 'Lumiris',
  tagline: 'O prontuário que evolui com você',
  i18n: {
    locales: ['pt-BR', 'en'],
    defaultLocale: 'pt-BR',
    localePrefix,
  },
};

const supportedLocales: Record<string, LocalizationResource> = {
  'pt-BR': ptBR,
  en: enUS,
};

export const ClerkLocalizations = {
  defaultLocale: ptBR,
  supportedLocales,
};
