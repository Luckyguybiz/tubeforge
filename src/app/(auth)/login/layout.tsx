import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Войдите в TubeForge через Google-аккаунт.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
