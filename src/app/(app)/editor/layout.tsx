import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Видеоредактор',
  description: 'Редактирование сцен, таймлайн и генерация видео с ИИ.',
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
