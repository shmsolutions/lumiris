import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lumiris — O prontuário que evolui com você',
    short_name: 'Lumiris',
    description:
      'Prontuário inteligente para terapeutas ocupacionais: anamnese, evolução por áudio com IA e relatórios em minutos.',
    start_url: '/dashboard',
    display: 'standalone',
    lang: 'pt-BR',
    background_color: '#fdfcf8',
    theme_color: '#fdfcf8',
    icons: [
      { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
