'use client';

import { useThemeStore } from '@/stores/useThemeStore';

export default function PrivacyPage() {
  const C = useThemeStore((s) => s.theme);

  const sectionStyle: React.CSSProperties = { marginBottom: 36 };
  const headingStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginBottom: 12, color: C.text };
  const paraStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.8, color: C.sub, marginBottom: 12 };
  const listStyle: React.CSSProperties = { fontSize: 14, lineHeight: 2, color: C.sub, paddingLeft: 24, margin: '8px 0 12px' };
  return (
    <div>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-.02em',
          marginBottom: 8,
        }}
      >
        Политика конфиденциальности
      </h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 40 }}>
        Последнее обновление: 1 марта 2026
      </p>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>1. Сбор данных</h2>
        <p style={paraStyle}>
          TubeForge собирает следующие категории данных при использовании платформы:
        </p>
        <ul style={listStyle}>
          <li>Данные аккаунта: имя, адрес электронной почты, фото профиля (из Google OAuth)</li>
          <li>Данные YouTube-канала: статистика канала, метрики видео, метаданные (через YouTube Data API)</li>
          <li>Контент: загруженные видео, созданные обложки, тексты метаданных</li>
          <li>Технические данные: IP-адрес, тип браузера, информация об устройстве</li>
          <li>Данные об использовании: действия в платформе, частота использования функций</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>2. Использование данных</h2>
        <p style={paraStyle}>
          Мы используем собранные данные для следующих целей:
        </p>
        <ul style={listStyle}>
          <li>Предоставление и поддержка функциональности платформы</li>
          <li>Генерация ИИ-контента (обложки, метаданные, рекомендации по SEO)</li>
          <li>Аналитика и визуализация статистики YouTube-канала</li>
          <li>Публикация видео на YouTube от вашего имени (с вашего согласия)</li>
          <li>Улучшение качества сервиса и разработка новых функций</li>
          <li>Обработка платежей и управление подписками</li>
          <li>Отправка уведомлений о сервисе и обновлениях</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>3. Файлы cookie</h2>
        <p style={paraStyle}>
          TubeForge использует следующие типы файлов cookie:
        </p>
        <ul style={listStyle}>
          <li>Необходимые cookie: для аутентификации и поддержания сессии (NextAuth.js)</li>
          <li>Функциональные cookie: для сохранения пользовательских настроек (тема, язык)</li>
          <li>Аналитические cookie: для понимания использования платформы и улучшения UX</li>
        </ul>
        <p style={paraStyle}>
          Вы можете отключить cookie в настройках браузера, однако это может ограничить
          функциональность платформы.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>4. Сторонние сервисы</h2>
        <p style={paraStyle}>
          TubeForge интегрируется со следующими сторонними сервисами:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>Google / YouTube API:</strong> для аутентификации через
            Google OAuth, доступа к аналитике канала и публикации видео. Использование данных
            YouTube API регулируется{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.accent }}
            >
              Политикой конфиденциальности Google
            </a>
            .
          </li>
          <li>
            <strong style={{ color: C.text }}>Stripe:</strong> для обработки платежей. Платежные
            данные (номера карт) обрабатываются исключительно Stripe и не хранятся на наших
            серверах. См.{' '}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.accent }}
            >
              Политику конфиденциальности Stripe
            </a>
            .
          </li>
          <li>
            <strong style={{ color: C.text }}>OpenAI:</strong> для генерации ИИ-контента (обложки,
            тексты, рекомендации). Ваш контент может обрабатываться через API OpenAI. Мы не
            передаём персональные данные в OpenAI.
          </li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>5. Права пользователей</h2>
        <p style={paraStyle}>
          В соответствии с применимым законодательством, вы имеете следующие права:
        </p>
        <ul style={listStyle}>
          <li>Право на доступ к своим персональным данным</li>
          <li>Право на исправление неточных данных</li>
          <li>Право на удаление данных (право быть забытым)</li>
          <li>Право на ограничение обработки</li>
          <li>Право на переносимость данных</li>
          <li>Право на отзыв согласия в любое время</li>
          <li>Право отозвать доступ к YouTube API через настройки Google-аккаунта</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>6. Удаление данных</h2>
        <p style={paraStyle}>
          Вы можете запросить полное удаление ваших данных, связавшись с нами по электронной почте
          или через настройки аккаунта. При удалении аккаунта мы:
        </p>
        <ul style={listStyle}>
          <li>Удалим все персональные данные в течение 30 дней</li>
          <li>Удалим загруженный контент (видео, обложки) с наших серверов</li>
          <li>Отзовём доступ к YouTube API</li>
          <li>Отменим активные подписки</li>
        </ul>
        <p style={paraStyle}>
          Некоторые данные могут быть сохранены в анонимизированном виде для статистических целей
          или в соответствии с требованиями законодательства.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={headingStyle}>7. Контактная информация</h2>
        <p style={paraStyle}>
          По всем вопросам, связанным с конфиденциальностью и обработкой персональных данных,
          обращайтесь:
        </p>
        <p style={paraStyle}>
          Email:{' '}
          <a href="mailto:support@tubeforge.app" style={{ color: C.accent }}>
            support@tubeforge.app
          </a>
        </p>
        <p style={paraStyle}>
          Мы обязуемся ответить на ваш запрос в течение 30 дней с момента получения.
        </p>
      </div>
    </div>
  );
}
