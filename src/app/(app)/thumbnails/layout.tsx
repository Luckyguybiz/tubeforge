import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Обложки',
  description: 'Редактор обложек для YouTube с ИИ-генерацией и шаблонами.',
};

export default function ThumbnailsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
