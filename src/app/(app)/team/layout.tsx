import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Команда',
  description: 'Управление командой и совместная работа над проектами.',
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
