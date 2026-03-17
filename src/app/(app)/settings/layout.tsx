import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Настройки',
  description: 'Управление профилем, подпиской и интеграциями.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
