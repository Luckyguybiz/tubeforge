import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Контакты — TubeForge',
  description:
    'Свяжитесь с командой TubeForge. Техническая поддержка, вопросы по оплате, партнёрство.',
  openGraph: {
    title: 'Контакты — TubeForge',
    description:
      'Свяжитесь с командой TubeForge. Поддержка 24/7 для Pro и Studio подписчиков.',
    type: 'website',
    locale: 'ru_RU',
  },
  alternates: {
    canonical: 'https://tubeforge.co/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
