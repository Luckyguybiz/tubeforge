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
        Дата вступления в силу: 20 марта 2026
      </p>

      {/* 1. Введение */}
      <div style={sectionStyle}>
        <h2 id="vvedenie" style={headingStyle}>1. Введение</h2>
        <p style={paraStyle}>
          Настоящая Политика конфиденциальности описывает, как TubeForge (далее — «мы», «нас», «Сервис»)
          собирает, использует, хранит и защищает ваши персональные данные при использовании платформы
          TubeForge, доступной по адресу{' '}
          <a href="https://tubeforge.co" style={{ color: C.accent }}>tubeforge.co</a>.
        </p>
        <p style={paraStyle}>
          Используя наш Сервис, вы соглашаетесь с условиями настоящей Политики. Если вы не согласны
          с какой-либо частью, пожалуйста, прекратите использование Сервиса.
        </p>
      </div>

      {/* 2. Какие данные мы собираем */}
      <div style={sectionStyle}>
        <h2 id="sbor-dannyh" style={headingStyle}>2. Какие данные мы собираем</h2>
        <p style={paraStyle}>
          TubeForge собирает следующие категории персональных данных:
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Данные аккаунта (через Google OAuth):</p>
        <ul style={listStyle}>
          <li>Имя и фамилия</li>
          <li>Адрес электронной почты</li>
          <li>Фото профиля</li>
          <li>Идентификатор Google-аккаунта</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Данные проектов и контента:</p>
        <ul style={listStyle}>
          <li>Созданные проекты, обложки, тексты метаданных</li>
          <li>Настройки и параметры ИИ-генерации</li>
          <li>Статистика YouTube-канала (при подключении)</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Платёжные данные (через Stripe):</p>
        <ul style={listStyle}>
          <li>Информация о подписке и тарифном плане</li>
          <li>История платежей и ID клиента Stripe</li>
          <li>Номера банковских карт хранятся исключительно на серверах Stripe и не проходят через наши системы</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Данные об использовании (аналитика):</p>
        <ul style={listStyle}>
          <li>IP-адрес, тип браузера, информация об устройстве</li>
          <li>Действия в платформе, частота использования функций</li>
          <li>Просмотры страниц и продолжительность сессий</li>
        </ul>
      </div>

      {/* 2a. YouTube API Services */}
      <div style={sectionStyle}>
        <h2 id="youtube-api" style={headingStyle}>2a. YouTube API Services</h2>
        <p style={paraStyle}>
          TubeForge uses YouTube API Services. By using TubeForge, you agree to the{' '}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
            YouTube Terms of Service
          </a>.
        </p>
        <p style={paraStyle}>
          Your use of YouTube data through TubeForge is also subject to the{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
            Google Privacy Policy
          </a>.
        </p>
        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>YouTube data we collect and process:</p>
        <ul style={listStyle}>
          <li>Channel name and profile information</li>
          <li>Subscriber count</li>
          <li>Video statistics (views, likes, comments)</li>
          <li>Upload capabilities and channel status</li>
        </ul>
        <p style={paraStyle}>
          You may revoke TubeForge&apos;s access to your YouTube data at any time via the{' '}
          <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
            Google security settings page
          </a>.
        </p>
      </div>

      {/* 3. Как мы используем данные */}
      <div style={sectionStyle}>
        <h2 id="ispolzovanie-dannyh" style={headingStyle}>3. Как мы используем данные</h2>
        <p style={paraStyle}>
          Мы используем собранные данные для следующих целей:
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Предоставление сервиса:</p>
        <ul style={listStyle}>
          <li>Аутентификация и управление аккаунтом</li>
          <li>Генерация ИИ-контента (обложки, тексты, рекомендации по SEO)</li>
          <li>Обработка платежей и управление подписками</li>
          <li>Аналитика и визуализация статистики YouTube-канала</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Улучшение продукта:</p>
        <ul style={listStyle}>
          <li>Анализ использования для улучшения UX и функциональности</li>
          <li>Диагностика и исправление технических проблем</li>
          <li>Разработка новых функций на основе паттернов использования</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Коммуникация:</p>
        <ul style={listStyle}>
          <li>Отправка уведомлений о сервисе и обновлениях</li>
          <li>Транзакционные email (подтверждение оплаты, изменение подписки)</li>
          <li>Ответы на запросы в службу поддержки</li>
        </ul>
      </div>

      {/* 4. Третьи стороны */}
      <div style={sectionStyle}>
        <h2 id="tretji-storony" style={headingStyle}>4. Третьи стороны</h2>
        <p style={paraStyle}>
          TubeForge интегрируется со следующими сторонними сервисами для предоставления
          функциональности платформы:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>Stripe</strong> — обработка платежей. Платёжные данные (номера карт)
            обрабатываются исключительно Stripe (PCI-DSS Level 1) и не хранятся на наших серверах.
            См.{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
              Политику конфиденциальности Stripe
            </a>.
          </li>
          <li>
            <strong style={{ color: C.text }}>Google</strong> — аутентификация через OAuth 2.0, доступ
            к аналитике YouTube-канала. Использование данных регулируется{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
              Политикой конфиденциальности Google
            </a>.
          </li>
          <li>
            <strong style={{ color: C.text }}>OpenAI</strong> — генерация ИИ-контента (обложки, тексты, рекомендации).
            Ваш контент может обрабатываться через API OpenAI. Мы не передаём персональные данные в OpenAI,
            только контент проектов для генерации.
          </li>
          <li>
            <strong style={{ color: C.text }}>Resend</strong> — отправка транзакционных email-сообщений
            (уведомления, подтверждения оплаты, восстановление доступа). Передаётся только email-адрес
            и содержимое письма.
          </li>
          <li>
            <strong style={{ color: C.text }}>PostHog</strong> — продуктовая аналитика (только с вашего явного
            согласия через баннер cookie-consent). См.{' '}
            <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
              Политику конфиденциальности PostHog
            </a>.
          </li>
        </ul>
        <p style={paraStyle}>
          Мы не продаём ваши персональные данные третьим лицам. Данные передаются только
          перечисленным сервисам в объёме, необходимом для предоставления функциональности.
        </p>
      </div>

      {/* 5. Хранение данных */}
      <div style={sectionStyle}>
        <h2 id="hranenie-dannyh" style={headingStyle}>5. Хранение данных</h2>
        <p style={paraStyle}>
          Ваши данные хранятся на серверах, расположенных в Европейском Союзе (EU).
          Мы используем надёжных хостинг-провайдеров с сертификацией ISO 27001 для обеспечения
          безопасности и доступности данных.
        </p>
        <p style={paraStyle}>
          Данные хранятся в течение всего срока использования вашего аккаунта. При удалении аккаунта
          персональные данные удаляются в течение 30 дней, за исключением данных, которые мы обязаны
          хранить в соответствии с требованиями законодательства (например, записи о транзакциях — до 7 лет).
        </p>
      </div>

      {/* 6. Файлы cookie */}
      <div style={sectionStyle}>
        <h2 id="faily-cookie" style={headingStyle}>6. Файлы cookie</h2>
        <p style={paraStyle}>
          TubeForge использует следующие типы файлов cookie:
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Необходимые (всегда активны):</p>
        <ul style={listStyle}>
          <li>Аутентификация и поддержание сессии (Auth.js)</li>
          <li>Защита от CSRF-атак</li>
          <li>Сохранение согласия на cookie</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Аналитические (только с вашего согласия):</p>
        <ul style={listStyle}>
          <li>PostHog — идентификатор сессии и устройства</li>
          <li>Google Analytics — идентификатор пользователя</li>
        </ul>

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
              <td style={{ padding: '6px 8px' }}>до 30 дней</td>
              <td style={{ padding: '6px 8px' }}>Аутентификация пользователя</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>next-auth.csrf-token</td>
              <td style={{ padding: '6px 8px' }}>Необходимый</td>
              <td style={{ padding: '6px 8px' }}>Сессия</td>
              <td style={{ padding: '6px 8px' }}>Защита от CSRF-атак</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>tf-cookie-consent</td>
              <td style={{ padding: '6px 8px' }}>Необходимый</td>
              <td style={{ padding: '6px 8px' }}>Бессрочный</td>
              <td style={{ padding: '6px 8px' }}>Хранение выбора согласия на cookie</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>ph_*</td>
              <td style={{ padding: '6px 8px' }}>Аналитический</td>
              <td style={{ padding: '6px 8px' }}>1 год</td>
              <td style={{ padding: '6px 8px' }}>PostHog: аналитика использования</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '6px 8px' }}>_ga, _ga_*</td>
              <td style={{ padding: '6px 8px' }}>Аналитический</td>
              <td style={{ padding: '6px 8px' }}>2 года</td>
              <td style={{ padding: '6px 8px' }}>Google Analytics: идентификатор</td>
            </tr>
          </tbody>
        </table>

        <p style={paraStyle}>
          Аналитические cookie устанавливаются <strong style={{ color: C.text }}>только после вашего
          явного согласия</strong> через баннер cookie-consent. Вы можете изменить свой выбор в любое время,
          очистив localStorage браузера или нажав «Настроить» в баннере cookie.
        </p>
      </div>

      {/* 7. Права пользователей (GDPR) */}
      <div style={sectionStyle}>
        <h2 id="prava-polzovateley" style={headingStyle}>7. Ваши права (GDPR)</h2>
        <p style={paraStyle}>
          В соответствии с Общим регламентом по защите данных (GDPR) и другим применимым
          законодательством, вы имеете следующие права:
        </p>
        <ul style={listStyle}>
          <li><strong style={{ color: C.text }}>Право на доступ</strong> — получить копию ваших персональных данных, которые мы обрабатываем</li>
          <li><strong style={{ color: C.text }}>Право на исправление</strong> — запросить исправление неточных или неполных данных</li>
          <li><strong style={{ color: C.text }}>Право на удаление</strong> — запросить удаление ваших персональных данных (право быть забытым)</li>
          <li><strong style={{ color: C.text }}>Право на ограничение обработки</strong> — ограничить обработку ваших данных в определённых случаях</li>
          <li><strong style={{ color: C.text }}>Право на переносимость данных</strong> — получить ваши данные в машиночитаемом формате (JSON/CSV)</li>
          <li><strong style={{ color: C.text }}>Право на возражение</strong> — возразить против обработки данных в маркетинговых целях</li>
          <li><strong style={{ color: C.text }}>Право на отзыв согласия</strong> — отозвать ранее данное согласие в любое время</li>
        </ul>
        <p style={paraStyle}>
          Для реализации любого из указанных прав свяжитесь с нами по адресу{' '}
          <a href="mailto:privacy@tubeforge.co" style={{ color: C.accent }}>privacy@tubeforge.co</a>.
          Мы обязуемся ответить на ваш запрос в течение 30 дней.
        </p>
        <p style={paraStyle}>
          Вы также можете экспортировать свои данные через настройки аккаунта в разделе
          «Настройки» → «Данные и конфиденциальность».
        </p>
      </div>

      {/* 7a. Your California Privacy Rights (CCPA/CPRA) */}
      <div style={sectionStyle}>
        <h2 id="ccpa" style={headingStyle}>7a. Your California Privacy Rights (CCPA/CPRA)</h2>
        <p style={paraStyle}>
          If you are a California resident, you have additional rights under the California Consumer
          Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Categories of personal information we collect:</p>
        <ul style={listStyle}>
          <li>Identifiers (name, email address, account ID)</li>
          <li>Commercial information (subscription plan, payment history)</li>
          <li>Internet or electronic network activity (usage data, IP address, browser type)</li>
          <li>Professional information (YouTube channel data when connected)</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Your rights:</p>
        <ul style={listStyle}>
          <li><strong style={{ color: C.text }}>Right to Know</strong> — request what personal information we have collected about you</li>
          <li><strong style={{ color: C.text }}>Right to Delete</strong> — request deletion of your personal information</li>
          <li><strong style={{ color: C.text }}>Right to Opt-Out</strong> — opt out of the sale or sharing of your personal information</li>
          <li><strong style={{ color: C.text }}>Right to Non-Discrimination</strong> — exercise your rights without receiving discriminatory treatment</li>
        </ul>

        <p style={paraStyle}>
          <strong style={{ color: C.text }}>We do not sell your personal information.</strong> We do not share your
          personal information for cross-context behavioral advertising.
        </p>
        <p style={paraStyle}>
          To exercise your California privacy rights, contact us at{' '}
          <a href="mailto:privacy@tubeforge.co" style={{ color: C.accent }}>privacy@tubeforge.co</a>.
          We will respond to verifiable consumer requests within 45 days.
        </p>
      </div>

      {/* 8. Удаление данных */}
      <div style={sectionStyle}>
        <h2 id="udalenie-dannyh" style={headingStyle}>8. Удаление данных</h2>
        <p style={paraStyle}>
          Вы можете запросить полное удаление ваших данных через настройки аккаунта или по email.
          При удалении аккаунта мы:
        </p>
        <ul style={listStyle}>
          <li>Удалим все персональные данные в течение 30 дней</li>
          <li>Удалим загруженный контент (видео, обложки) с наших серверов</li>
          <li>Отзовём доступ к YouTube API</li>
          <li>Отменим активные подписки через Stripe</li>
        </ul>
        <p style={paraStyle}>
          Некоторые данные могут быть сохранены в анонимизированном виде для статистических целей
          или в соответствии с требованиями законодательства (записи о транзакциях — до 7 лет).
        </p>
      </div>

      {/* 9. Безопасность данных */}
      <div style={sectionStyle}>
        <h2 id="bezopasnost" style={headingStyle}>9. Безопасность данных</h2>
        <p style={paraStyle}>
          Мы принимаем организационные и технические меры для защиты ваших данных:
        </p>
        <ul style={listStyle}>
          <li>Шифрование данных при передаче (TLS/HTTPS) и хранении</li>
          <li>Аутентификация через OAuth 2.0 — мы не храним пароли</li>
          <li>Обработка платежей через Stripe (PCI-DSS Level 1)</li>
          <li>Регулярное резервное копирование базы данных</li>
          <li>Ограничение доступа к персональным данным</li>
        </ul>
      </div>

      {/* 10. Изменение политики */}
      <div style={sectionStyle}>
        <h2 id="izmenenie-politiki" style={headingStyle}>10. Изменение политики</h2>
        <p style={paraStyle}>
          Мы можем обновлять настоящую Политику конфиденциальности. О существенных изменениях
          мы уведомим вас по электронной почте и/или через уведомление в платформе не менее чем
          за 30 дней до вступления изменений в силу.
        </p>
        <p style={paraStyle}>
          Продолжая использовать Сервис после вступления изменений в силу, вы соглашаетесь
          с обновлённой Политикой.
        </p>
      </div>

      {/* 11. Контактная информация */}
      <div style={sectionStyle}>
        <h2 id="kontakty" style={headingStyle}>11. Контактная информация</h2>
        <p style={paraStyle}>
          По всем вопросам, связанным с конфиденциальностью и обработкой персональных данных,
          обращайтесь:
        </p>
        <p style={paraStyle}>
          Email:{' '}
          <a href="mailto:privacy@tubeforge.co" style={{ color: C.accent }}>
            privacy@tubeforge.co
          </a>
        </p>
        <p style={paraStyle}>
          Если вы считаете, что ваши права были нарушены, вы имеете право подать жалобу
          в надзорный орган по защите данных.
        </p>
      </div>
    </div>
  );
}
