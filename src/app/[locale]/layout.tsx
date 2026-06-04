import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Fraunces, Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { Env } from '@/libs/Env';
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

// Display serif for headlines (editorial voice). Body stays Inter for clinical
// legibility. opsz drives optical sizing; SOFT warms the terminals.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  style: ['normal', 'italic'],
  axes: ['opsz', 'SOFT'],
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: `${AppConfig.name} — ${AppConfig.tagline}`,
    template: `%s · ${AppConfig.name}`,
  },
  description,
  applicationName: AppConfig.name,
  authors: [{ name: AppConfig.name, url: getBaseUrl() }],
  creator: AppConfig.name,
  publisher: AppConfig.name,
  category: 'health',
  keywords: [
    'prontuário eletrônico',
    'terapia ocupacional',
    'terapeuta ocupacional',
    'prontuário para T.O.',
    'anamnese terapia ocupacional',
    'evolução por áudio',
    'relatório CREFITO',
    'prontuário com IA',
    'software para terapeuta ocupacional',
  ],
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: Env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: Env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
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
    <html lang={locale} className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-surface text-ink-700">
        <NextIntlClientProvider>{props.children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
