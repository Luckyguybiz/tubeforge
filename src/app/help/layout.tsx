import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Центр помощи — TubeForge',
  description:
    'Ответы на частые вопросы о TubeForge: начало работы, оплата, редактор, AI-генерация и решение проблем.',
  openGraph: {
    title: 'Центр помощи — TubeForge',
    description:
      'Найдите ответы на вопросы о платформе TubeForge: подписки, редактор, AI-инструменты, устранение неполадок.',
    type: 'website',
    locale: 'ru_RU',
  },
  alternates: {
    canonical: 'https://tubeforge.co/help',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
