import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { routing } from '@/libs/I18nRouting';
import { AppConfig } from '@/utils/AppConfig';
import { getBaseUrl } from '@/utils/Helpers';
import '@/styles/global.css';

const description =
  'O prontuário inteligente para terapeutas ocupacionais. Anamnese estruturada, evolução por áudio com IA e relatório trimestral em minutos.';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: `${AppConfig.name} — ${AppConfig.tagline}`,
    template: `%s · ${AppConfig.name}`,
  },
  description,
  applicationName: AppConfig.name,
  openGraph: {
    type: 'website',
    siteName: AppConfig.name,
    title: `${AppConfig.name} — ${AppConfig.tagline}`,
    description,
    locale: 'pt_BR',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: AppConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${AppConfig.name} — ${AppConfig.tagline}`,
    description,
    images: ['/og.png'],
  },
  icons: [
    { rel: 'icon', type: 'image/png', sizes: '96x96', url: '/favicon-96x96.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FDFCF8',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} className={inter.variable}>
      <body className="bg-surface text-ink-700">
        <NextIntlClientProvider>{props.children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
