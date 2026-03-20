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
        Последнее обновление: 20 марта 2026
      </p>

      <div style={sectionStyle}>
        <h2 id="sbor-dannyh" style={headingStyle}>1. Сбор данных</h2>
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
        <h2 id="ispolzovanie-dannyh" style={headingStyle}>2. Использование данных</h2>
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
        <h2 id="faily-cookie" style={headingStyle}>3. Файлы cookie</h2>
        <p style={paraStyle}>
          TubeForge использует следующие типы файлов cookie:
        </p>
        <ul style={listStyle}>
          <li>Необходимые cookie: для аутентификации и поддержания сессии (NextAuth.js)</li>
          <li>Функциональные cookie: для сохранения пользовательских настроек (тема, язык)</li>
          <li>Аналитические cookie: для понимания использования платформы и улучшения UX (PostHog, Google Analytics)</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>
          Перечень используемых cookie:
        </p>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            lineHeight: 1.7,
            color: C.sub,
            marginBottom: 16,
          }}
        >
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, textAlign: 'left' }}>
              <th style={{ padding: '6px 8px', color: C.text }}>Cookie</th>
              <th style={{ padding: '6px 8px', color: C.text }}>Тип</th>
              <th style={{ padding: '6px 8px', color: C.text }}>Срок</th>
              <th style={{ padding: '6px 8px', color: C.text }}>Назначение</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>next-auth.session-token</td>
              <td style={{ padding: '6px 8px' }}>Необходимый</td>
              <td style={{ padding: '6px 8px' }}>Сессия (до 30 дней)</td>
              <td style={{ padding: '6px 8px' }}>Аутентификация пользователя (NextAuth.js)</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>next-auth.csrf-token</td>
              <td style={{ padding: '6px 8px' }}>Необходимый</td>
              <td style={{ padding: '6px 8px' }}>Сессия</td>
              <td style={{ padding: '6px 8px' }}>Защита от CSRF-атак</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>next-auth.callback-url</td>
              <td style={{ padding: '6px 8px' }}>Необходимый</td>
              <td style={{ padding: '6px 8px' }}>Сессия</td>
              <td style={{ padding: '6px 8px' }}>URL перенаправления после входа</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>tf-locale</td>
              <td style={{ padding: '6px 8px' }}>Функциональный</td>
              <td style={{ padding: '6px 8px' }}>Бессрочный (localStorage)</td>
              <td style={{ padding: '6px 8px' }}>Сохранение выбранного языка интерфейса</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>tf-theme</td>
              <td style={{ padding: '6px 8px' }}>Функциональный</td>
              <td style={{ padding: '6px 8px' }}>Бессрочный (localStorage)</td>
              <td style={{ padding: '6px 8px' }}>Сохранение выбранной темы оформления</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>tf-cookie-consent</td>
              <td style={{ padding: '6px 8px' }}>Необходимый</td>
              <td style={{ padding: '6px 8px' }}>Бессрочный (localStorage)</td>
              <td style={{ padding: '6px 8px' }}>Хранение вашего выбора о согласии на cookie</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>ph_*</td>
              <td style={{ padding: '6px 8px' }}>Аналитический</td>
              <td style={{ padding: '6px 8px' }}>1 год</td>
              <td style={{ padding: '6px 8px' }}>PostHog: идентификатор сессии и устройства</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>_ga, _ga_*</td>
              <td style={{ padding: '6px 8px' }}>Аналитический</td>
              <td style={{ padding: '6px 8px' }}>2 года</td>
              <td style={{ padding: '6px 8px' }}>Google Analytics: идентификатор пользователя</td>
            </tr>
          </tbody>
        </table>

        <p style={paraStyle}>
          Аналитические cookie (PostHog, Google Analytics) устанавливаются <strong style={{ color: C.text }}>только после вашего
          явного согласия</strong> через баннер cookie-consent. Вы можете отключить cookie в настройках
          браузера, однако это может ограничить функциональность платформы.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 id="storonnie-servisy" style={headingStyle}>4. Сторонние сервисы</h2>
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
          <li>
            <strong style={{ color: C.text }}>PostHog:</strong> для продуктовой аналитики. PostHog
            собирает данные о просмотрах страниц, кликах, продолжительности сессий и взаимодействии
            с интерфейсом. Данные обрабатываются на серверах PostHog (US). PostHog получает доступ
            к данным <strong style={{ color: C.text }}>только после вашего явного согласия</strong>{' '}
            через баннер cookie-consent. См.{' '}
            <a
              href="https://posthog.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.accent }}
            >
              Политику конфиденциальности PostHog
            </a>
            .
          </li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2 id="prava-polzovateley" style={headingStyle}>5. Права пользователей</h2>
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
        <h2 id="otziv-soglasiya" style={headingStyle}>6. Отзыв согласия и управление cookie</h2>
        <p style={paraStyle}>
          Вы можете отозвать согласие на использование аналитических cookie в любое время
          следующими способами:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>Баннер cookie-consent:</strong> удалите значение{' '}
            <code style={{ fontSize: 13, background: C.surface, padding: '2px 6px', borderRadius: 4 }}>
              tf-cookie-consent
            </code>{' '}
            из localStorage вашего браузера (Инструменты разработчика &rarr; Application &rarr;
            Local Storage) — при следующем визите баннер появится снова, и вы сможете нажать
            &laquo;Отклонить&raquo;.
          </li>
          <li>
            <strong style={{ color: C.text }}>Настройки браузера:</strong> очистите cookie сайта
            tubeforge.co в настройках вашего браузера. Это удалит все аналитические cookie
            (PostHog, Google Analytics).
          </li>
          <li>
            <strong style={{ color: C.text }}>Opt-out PostHog:</strong> PostHog поддерживает
            функцию opt-out. После отзыва согласия PostHog прекращает сбор данных и удаляет
            cookie-файлы <code style={{ fontSize: 13, background: C.surface, padding: '2px 6px', borderRadius: 4 }}>ph_*</code>.
          </li>
        </ul>
        <p style={paraStyle}>
          После отзыва согласия аналитические скрипты (PostHog, Google Analytics) не загружаются
          и не собирают данные. Необходимые и функциональные cookie продолжают работать для
          обеспечения базовой функциональности сервиса.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 id="udalenie-dannyh" style={headingStyle}>7. Удаление данных</h2>
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
        <h2 id="kontaktnaya-informatsiya" style={headingStyle}>8. Контактная информация</h2>
        <p style={paraStyle}>
          По всем вопросам, связанным с конфиденциальностью и обработкой персональных данных,
          обращайтесь:
        </p>
        <p style={paraStyle}>
          Email:{' '}
          <a href="mailto:support@tubeforge.co" style={{ color: C.accent }}>
            support@tubeforge.co
          </a>
        </p>
        <p style={paraStyle}>
          Мы обязуемся ответить на ваш запрос в течение 30 дней с момента получения.
        </p>
      </div>
    </div>
  );
}
