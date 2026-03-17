import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Администрирование',
  description: 'Панель администратора: статистика платформы и управление пользователями.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
