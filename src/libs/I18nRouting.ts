import { defineRouting } from 'next-intl/routing';
import { AppConfig } from '@/utils/AppConfig';

export const routing = defineRouting({
  locales: AppConfig.i18n.locales,
  localePrefix: AppConfig.i18n.localePrefix,
  defaultLocale: AppConfig.i18n.defaultLocale,
  // Sempre serve pt-BR na raiz. Sem isso, o next-intl detecta o Accept-Language
  // do navegador e poderia mandar um visitante para /en por engano — inglês só
  // quando a pessoa acessa /en explicitamente.
  localeDetection: false,
});
