import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Дашборд',
  description: 'Обзор проектов и быстрый доступ к ИИ-инструментам TubeForge.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
