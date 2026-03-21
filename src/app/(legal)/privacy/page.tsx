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


      {/* 10. Pravovoe osnovanie */}
      <div style={sectionStyle}>
        <h2 id="pravovoe-osnovanie" style={headingStyle}>10. Правовое основание обработки</h2>
        <p style={paraStyle}>
          Мы обрабатываем ваши персональные данные на следующих правовых основаниях:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>Согласие пользователя</strong> (ст. 6(1)(a) GDPR, ст. 6 ФЗ-152) —
            аналитические cookie, маркетинговые коммуникации, продуктовая аналитика (PostHog).
            Вы можете отозвать своё согласие в любое время.
          </li>
          <li>
            <strong style={{ color: C.text }}>Исполнение договора</strong> (ст. 6(1)(b) GDPR) —
            предоставление Сервиса, управление аккаунтом, обработка платежей, генерация ИИ-контента.
          </li>
          <li>
            <strong style={{ color: C.text }}>Законный интерес</strong> (ст. 6(1)(f) GDPR) —
            обеспечение безопасности Сервиса, предотвращение мошенничества, улучшение продукта,
            техническая диагностика.
          </li>
        </ul>
      </div>

      {/* 11. Mezhdunarodnaya peredacha */}
      <div style={sectionStyle}>
        <h2 id="mezhdunarodnaya-peredacha" style={headingStyle}>11. Международная передача данных</h2>
        <p style={paraStyle}>
          Для предоставления функциональности Сервиса ваши данные могут передаваться
          за пределы Европейского Союза и Российской Федерации следующим получателям:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>OpenAI (США)</strong> — обработка AI-запросов
            (генерация обложек, текстов, рекомендаций). Передаётся только контент проектов,
            без персональных данных.
          </li>
          <li>
            <strong style={{ color: C.text }}>Stripe (США)</strong> — обработка платежей и управление
            подписками. Stripe сертифицирован по PCI-DSS Level 1.
          </li>
          <li>
            <strong style={{ color: C.text }}>ElevenLabs (США/ЕС)</strong> — обработка голоса
            для функций перевода и озвучивания видео.
          </li>
        </ul>
        <p style={paraStyle}>
          Для обеспечения надлежащего уровня защиты данных при международной передаче
          используются стандартные договорные оговорки (Standard Contractual Clauses, SCC),
          утверждённые Европейской комиссией, а также дополнительные технические и организационные меры.
        </p>
      </div>

      {/* 12. Avtomatizirovannoe prinyatie resheniy */}
      <div style={sectionStyle}>
        <h2 id="avtomatizirovannoe-prinyatie" style={headingStyle}>12. Автоматизированное принятие решений</h2>
        <p style={paraStyle}>
          TubeForge использует автоматизированную обработку данных, включая профилирование,
          для предоставления следующих функций:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>AI-анализ видео</strong> — автоматическая оценка
            качества обложек, заголовков и метаданных с помощью алгоритмов машинного обучения.
          </li>
          <li>
            <strong style={{ color: C.text }}>AI-генерация изображений</strong> — создание обложек
            и визуального контента на основе ваших параметров с использованием нейросетей.
          </li>
          <li>
            <strong style={{ color: C.text }}>AI-рекомендации по SEO</strong> — автоматические
            предложения по оптимизации метаданных видео.
          </li>
        </ul>
        <p style={paraStyle}>
          Автоматизированное принятие решений не имеет юридических последствий и не оказывает
          существенного влияния на вас. Все оценки и рекомендации носят вспомогательный характер.
        </p>
        <p style={paraStyle}>
          В соответствии со ст. 22 GDPR, вы имеете право запросить ручную проверку любого
          автоматизированного решения. Для этого свяжитесь с нами по адресу{" "}
          <a href="mailto:privacy@tubeforge.co" style={{ color: C.accent }}>privacy@tubeforge.co</a>.
        </p>
      </div>

      {/* 13. Prava sub"ektov dannykh po FZ-152 */}
      <div style={sectionStyle}>
        <h2 id="prava-fz152" style={headingStyle}>13. Права субъектов данных по ФЗ-152</h2>
        <p style={paraStyle}>
          В дополнение к правам, предусмотренным GDPR (раздел 7), в соответствии с Федеральным
          законом от 27.07.2006 N 152-ФЗ «О персональных данных» вы имеете следующие права:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>Право на получение информации</strong> (ст. 14 ФЗ-152) —
            получить сведения об обработке ваших персональных данных, включая правовые основания,
            цели обработки, состав данных и сроки хранения.
          </li>
          <li>
            <strong style={{ color: C.text }}>Право на уточнение данных</strong> (ст. 14 ФЗ-152) —
            потребовать уточнения, блокирования или уничтожения неполных, устаревших,
            неточных или незаконно полученных данных.
          </li>
          <li>
            <strong style={{ color: C.text }}>Право на отзыв согласия</strong> (ст. 9 ФЗ-152) —
            отозвать ранее данное согласие на обработку персональных данных в любое время.
            Отзыв не влияет на законность обработки до момента отзыва.
          </li>
          <li>
            <strong style={{ color: C.text }}>Право требовать прекращения обработки</strong> (ст. 17 ФЗ-152) —
            потребовать прекращения обработки персональных данных в целях продвижения товаров
            и услуг.
          </li>
          <li>
            <strong style={{ color: C.text }}>Право на обжалование</strong> (ст. 17 ФЗ-152) —
            обжаловать действия или бездействие оператора в уполномоченный орган по защите
            прав субъектов персональных данных (Роскомнадзор) или в судебном порядке.
          </li>
          <li>
            <strong style={{ color: C.text }}>Право на возмещение убытков</strong> (ст. 17 ФЗ-152) —
            требовать возмещения убытков и компенсации морального вреда в судебном порядке.
          </li>
        </ul>
        <p style={paraStyle}>
          Для реализации прав по ФЗ-152 направьте запрос на{" "}
          <a href="mailto:privacy@tubeforge.co" style={{ color: C.accent }}>privacy@tubeforge.co</a>.
          Ответ предоставляется в течение 10 рабочих дней с момента получения запроса.
        </p>
      </div>

      {/* 14. Изменение политики */}
      <div style={sectionStyle}>
        <h2 id="izmenenie-politiki" style={headingStyle}>14. Изменение политики</h2>
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

      {/* 15. Контактная информация */}
      <div style={sectionStyle}>
        <h2 id="kontakty" style={headingStyle}>15. Контактная информация</h2>
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
