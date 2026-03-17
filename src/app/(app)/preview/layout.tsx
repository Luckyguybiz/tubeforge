import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Предпросмотр',
  description: 'Финальный просмотр и экспорт проекта.',
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
