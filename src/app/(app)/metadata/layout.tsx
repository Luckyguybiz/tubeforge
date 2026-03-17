import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Метаданные',
  description: 'Оптимизация заголовков, описаний и тегов для YouTube с помощью ИИ.',
};

export default function MetadataLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
