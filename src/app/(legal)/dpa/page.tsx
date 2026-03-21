'use client';

import { useThemeStore } from '@/stores/useThemeStore';

export default function DpaPage() {
  const C = useThemeStore((s) => s.theme);

  const sectionStyle: React.CSSProperties = { marginBottom: 36 };
  const headingStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginBottom: 12, color: C.text };
  const paraStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.8, color: C.sub, marginBottom: 12 };
  const listStyle: React.CSSProperties = { fontSize: 14, lineHeight: 2, color: C.sub, paddingLeft: 24, margin: '8px 0 12px' };

  const cellStyle: React.CSSProperties = { padding: '8px 12px', borderBottom: `1px solid ${C.border}` };

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
        Соглашение об обработке данных (DPA)
      </h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 16 }}>
        Data Processing Agreement
      </p>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 40 }}>
        Дата вступления в силу: 20 марта 2026
      </p>

      {/* 1. Цели обработки */}
      <div style={sectionStyle}>
        <h2 id="tseli-obrabotki" style={headingStyle}>1. Цели обработки данных</h2>
        <p style={paraStyle}>
          TubeForge (далее — «Обработчик данных») обрабатывает персональные данные от имени
          пользователей (далее — «Контролёр данных») в следующих целях:
        </p>
        <ul style={listStyle}>
          <li>Предоставление SaaS-платформы для создания YouTube-контента</li>
          <li>Аутентификация и управление аккаунтами пользователей</li>
          <li>Генерация ИИ-контента (обложки, тексты, метаданные)</li>
          <li>Обработка платежей и управление подписками</li>
          <li>Аналитика YouTube-канала и визуализация данных</li>
          <li>Отправка транзакционных email-уведомлений</li>
          <li>Улучшение качества сервиса и устранение технических проблем</li>
        </ul>
        <p style={paraStyle}>
          Обработка данных осуществляется исключительно по инструкциям Контролёра данных
          и в соответствии с настоящим Соглашением, Условиями использования и Политикой
          конфиденциальности TubeForge.
        </p>
      </div>

      {/* 2. Типы персональных данных */}
      <div style={sectionStyle}>
        <h2 id="tipy-dannyh" style={headingStyle}>2. Типы персональных данных</h2>
        <p style={paraStyle}>
          Обработчик обрабатывает следующие категории персональных данных:
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
            <tr style={{ borderBottom: `2px solid ${C.border}`, textAlign: 'left' }}>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Категория</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Данные</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Основание</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellStyle}>Идентификационные</td>
              <td style={cellStyle}>Имя, email, фото профиля, Google ID</td>
              <td style={cellStyle}>Исполнение договора</td>
            </tr>
            <tr>
              <td style={cellStyle}>Платёжные</td>
              <td style={cellStyle}>Stripe Customer ID, история транзакций, тарифный план</td>
              <td style={cellStyle}>Исполнение договора</td>
            </tr>
            <tr>
              <td style={cellStyle}>Контент</td>
              <td style={cellStyle}>Проекты, обложки, метаданные, тексты</td>
              <td style={cellStyle}>Исполнение договора</td>
            </tr>
            <tr>
              <td style={cellStyle}>Технические</td>
              <td style={cellStyle}>IP-адрес, User-Agent, данные сессии</td>
              <td style={cellStyle}>Законный интерес</td>
            </tr>
            <tr>
              <td style={cellStyle}>Аналитические</td>
              <td style={cellStyle}>Действия в платформе, просмотры страниц</td>
              <td style={cellStyle}>Согласие</td>
            </tr>
            <tr>
              <td style={cellStyle}>YouTube</td>
              <td style={cellStyle}>Статистика канала, метрики видео</td>
              <td style={cellStyle}>Согласие</td>
            </tr>
          </tbody>
        </table>

        <p style={paraStyle}>
          Обработчик не обрабатывает специальные категории персональных данных (расовая
          принадлежность, здоровье, биометрия и т.д.).
        </p>
      </div>

      {/* 3. Суб-процессоры */}
      <div style={sectionStyle}>
        <h2 id="sub-processory" style={headingStyle}>3. Суб-процессоры</h2>
        <p style={paraStyle}>
          Обработчик привлекает следующих суб-процессоров для обработки персональных данных:
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
            <tr style={{ borderBottom: `2px solid ${C.border}`, textAlign: 'left' }}>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Суб-процессор</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Назначение</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Расположение</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Данные</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellStyle}><strong style={{ color: C.text }}>Stripe, Inc.</strong></td>
              <td style={cellStyle}>Обработка платежей</td>
              <td style={cellStyle}>US / EU</td>
              <td style={cellStyle}>Платёжные данные, email</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong style={{ color: C.text }}>Google LLC</strong></td>
              <td style={cellStyle}>OAuth аутентификация, YouTube API</td>
              <td style={cellStyle}>US / EU</td>
              <td style={cellStyle}>Имя, email, данные YouTube</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong style={{ color: C.text }}>OpenAI, Inc.</strong></td>
              <td style={cellStyle}>ИИ-генерация контента</td>
              <td style={cellStyle}>US</td>
              <td style={cellStyle}>Контент проектов (без персональных данных)</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong style={{ color: C.text }}>Resend, Inc.</strong></td>
              <td style={cellStyle}>Отправка email-уведомлений</td>
              <td style={cellStyle}>US</td>
              <td style={cellStyle}>Email-адрес, содержимое письма</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong style={{ color: C.text }}>OVHcloud</strong></td>
              <td style={cellStyle}>Хостинг серверов и баз данных</td>
              <td style={cellStyle}>EU (Франция)</td>
              <td style={cellStyle}>Все данные платформы</td>
            </tr>
          </tbody>
        </table>

        <p style={paraStyle}>
          Каждый суб-процессор связан договорными обязательствами, обеспечивающими уровень
          защиты данных не ниже предусмотренного настоящим Соглашением. Об изменении
          списка суб-процессоров мы уведомляем за 30 дней.
        </p>
      </div>

      {/* 4. Сроки хранения */}
      <div style={sectionStyle}>
        <h2 id="sroki-hraneniya" style={headingStyle}>4. Сроки хранения данных</h2>

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
            <tr style={{ borderBottom: `2px solid ${C.border}`, textAlign: 'left' }}>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Категория данных</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Срок хранения</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Основание</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellStyle}>Данные аккаунта</td>
              <td style={cellStyle}>Весь период использования + 30 дней после удаления</td>
              <td style={cellStyle}>Исполнение договора</td>
            </tr>
            <tr>
              <td style={cellStyle}>Контент и проекты</td>
              <td style={cellStyle}>Весь период использования + 30 дней после удаления</td>
              <td style={cellStyle}>Исполнение договора</td>
            </tr>
            <tr>
              <td style={cellStyle}>Платёжные записи</td>
              <td style={cellStyle}>До 7 лет после транзакции</td>
              <td style={cellStyle}>Законодательное требование</td>
            </tr>
            <tr>
              <td style={cellStyle}>Аналитические данные</td>
              <td style={cellStyle}>До 26 месяцев</td>
              <td style={cellStyle}>Согласие</td>
            </tr>
            <tr>
              <td style={cellStyle}>Логи безопасности</td>
              <td style={cellStyle}>До 12 месяцев</td>
              <td style={cellStyle}>Законный интерес</td>
            </tr>
            <tr>
              <td style={cellStyle}>Резервные копии</td>
              <td style={cellStyle}>До 90 дней</td>
              <td style={cellStyle}>Законный интерес</td>
            </tr>
          </tbody>
        </table>

        <p style={paraStyle}>
          По истечении указанных сроков данные автоматически удаляются или анонимизируются.
        </p>
      </div>

      {/* 5. Меры безопасности */}
      <div style={sectionStyle}>
        <h2 id="mery-bezopasnosti" style={headingStyle}>5. Технические и организационные меры безопасности</h2>
        <p style={paraStyle}>
          Обработчик применяет следующие меры для обеспечения безопасности персональных данных:
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Технические меры:</p>
        <ul style={listStyle}>
          <li>Шифрование данных при передаче (TLS 1.3) и хранении (AES-256)</li>
          <li>OAuth 2.0 аутентификация (пароли не хранятся)</li>
          <li>Защита от CSRF, XSS и SQL-инъекций</li>
          <li>Файрвол и ограничение доступа по IP</li>
          <li>Автоматическое резервное копирование</li>
          <li>Rate limiting на API</li>
          <li>VPN для внутренних коммуникаций (WireGuard)</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Организационные меры:</p>
        <ul style={listStyle}>
          <li>Принцип минимальных привилегий (least privilege)</li>
          <li>Регулярный аудит безопасности и зависимостей</li>
          <li>Мониторинг инфраструктуры 24/7</li>
          <li>Процедура реагирования на инциденты безопасности</li>
          <li>Обучение персонала по вопросам защиты данных</li>
        </ul>
      </div>

      {/* 6. Права субъектов данных */}
      <div style={sectionStyle}>
        <h2 id="prava-subektov" style={headingStyle}>6. Права субъектов данных</h2>
        <p style={paraStyle}>
          Обработчик содействует Контролёру в обеспечении следующих прав субъектов данных
          в соответствии с GDPR:
        </p>
        <ul style={listStyle}>
          <li><strong style={{ color: C.text }}>Право на доступ (ст. 15 GDPR)</strong> — предоставление копии персональных данных</li>
          <li><strong style={{ color: C.text }}>Право на исправление (ст. 16 GDPR)</strong> — исправление неточных данных</li>
          <li><strong style={{ color: C.text }}>Право на удаление (ст. 17 GDPR)</strong> — удаление персональных данных</li>
          <li><strong style={{ color: C.text }}>Право на ограничение (ст. 18 GDPR)</strong> — ограничение обработки</li>
          <li><strong style={{ color: C.text }}>Право на переносимость (ст. 20 GDPR)</strong> — экспорт данных в машиночитаемом формате</li>
          <li><strong style={{ color: C.text }}>Право на возражение (ст. 21 GDPR)</strong> — возражение против обработки</li>
        </ul>
        <p style={paraStyle}>
          Обработчик обязуется ответить на запросы субъектов данных в течение 30 дней
          и содействовать Контролёру в выполнении его обязательств.
        </p>
      </div>

      {/* 7. Уведомление об инцидентах */}
      <div style={sectionStyle}>
        <h2 id="intsidenty" style={headingStyle}>7. Уведомление об инцидентах</h2>
        <p style={paraStyle}>
          В случае инцидента безопасности, затрагивающего персональные данные, Обработчик обязуется:
        </p>
        <ul style={listStyle}>
          <li>Уведомить Контролёра в течение 72 часов с момента обнаружения инцидента</li>
          <li>Предоставить описание инцидента, затронутые категории данных и примерное количество субъектов</li>
          <li>Описать возможные последствия и принятые меры по устранению</li>
          <li>Сотрудничать с Контролёром при уведомлении надзорного органа</li>
        </ul>
      </div>

      {/* 8. Аудит */}
      <div style={sectionStyle}>
        <h2 id="audit" style={headingStyle}>8. Право на аудит</h2>
        <p style={paraStyle}>
          Контролёр имеет право проводить аудит соблюдения настоящего Соглашения. Обработчик
          обязуется предоставить необходимую информацию и доступ для проведения аудита,
          при условии предварительного уведомления не менее чем за 30 дней.
        </p>
      </div>

      {/* 9. Контакты */}
      <div style={sectionStyle}>
        <h2 id="kontakty" style={headingStyle}>9. Контактная информация</h2>
        <p style={paraStyle}>
          По всем вопросам, связанным с обработкой данных и настоящим Соглашением:
        </p>
        <p style={paraStyle}>
          Email:{' '}
          <a href="mailto:dpa@tubeforge.co" style={{ color: C.accent }}>
            dpa@tubeforge.co
          </a>
        </p>
        <p style={paraStyle}>
          Ответственный за защиту данных:{' '}
          <a href="mailto:privacy@tubeforge.co" style={{ color: C.accent }}>
            privacy@tubeforge.co
          </a>
        </p>
      </div>
    </div>
  );
}
