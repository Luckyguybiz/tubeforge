import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Регистрация',
  description: 'Создайте бесплатный аккаунт в TubeForge для работы с YouTube-контентом.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
