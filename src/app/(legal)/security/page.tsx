'use client';

import { useThemeStore } from '@/stores/useThemeStore';

export default function SecurityPage() {
  const C = useThemeStore((s) => s.theme);

  const sectionStyle: React.CSSProperties = { marginBottom: 36 };
  const headingStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginBottom: 12, color: C.text };
  const paraStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.8, color: C.sub, marginBottom: 12 };
  const listStyle: React.CSSProperties = { fontSize: 14, lineHeight: 2, color: C.sub, paddingLeft: 24, margin: '8px 0 12px' };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 8,
    marginRight: 8,
    fontSize: 14,
    color: C.text,
    fontWeight: 500,
  };

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
        Безопасность
      </h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 16 }}>
        Последнее обновление: 20 марта 2026
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: C.sub, marginBottom: 40 }}>
        Защита ваших данных — наш приоритет. Мы применяем многоуровневый подход к безопасности,
        используя лучшие отраслевые практики и стандарты.
      </p>

      {/* Security badges */}
      <div style={{ marginBottom: 40, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <div style={badgeStyle}>
          <span style={{ fontSize: 20 }}>&#128274;</span> HTTPS Everywhere
        </div>
        <div style={badgeStyle}>
          <span style={{ fontSize: 20 }}>&#128272;</span> OAuth 2.0
        </div>
        <div style={badgeStyle}>
          <span style={{ fontSize: 20 }}>&#127919;</span> PCI-DSS Level 1
        </div>
        <div style={badgeStyle}>
          <span style={{ fontSize: 20 }}>&#127466;&#127482;</span> EU Data Residency
        </div>
      </div>

      {/* 1. Шифрование */}
      <div style={sectionStyle}>
        <h2 id="shifrovanie" style={headingStyle}>1. Шифрование данных</h2>
        <p style={paraStyle}>
          Все данные защищены шифрованием на каждом уровне:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>При передаче (in transit):</strong> весь трафик между вашим
            браузером и серверами TubeForge шифруется с использованием TLS 1.3. Мы применяем HTTPS
            на всех страницах и API без исключения.
          </li>
          <li>
            <strong style={{ color: C.text }}>При хранении (at rest):</strong> все данные в базе данных
            и файловом хранилище зашифрованы с использованием AES-256. Резервные копии также
            хранятся в зашифрованном виде.
          </li>
        </ul>
      </div>

      {/* 2. Аутентификация */}
      <div style={sectionStyle}>
        <h2 id="autentifikatsiya" style={headingStyle}>2. Аутентификация</h2>
        <p style={paraStyle}>
          TubeForge использует Google OAuth 2.0 для аутентификации пользователей. Это означает:
        </p>
        <ul style={listStyle}>
          <li>Мы <strong style={{ color: C.text }}>не храним паролей</strong> — аутентификация делегирована Google</li>
          <li>Используется стандартный протокол OAuth 2.0 с PKCE</li>
          <li>Сессионные токены хранятся в httpOnly cookies с флагами Secure и SameSite</li>
          <li>Защита от CSRF-атак через токены csrf</li>
          <li>Автоматический выход из неактивных сессий</li>
        </ul>
      </div>

      {/* 3. Платежи */}
      <div style={sectionStyle}>
        <h2 id="platezhi" style={headingStyle}>3. Безопасность платежей</h2>
        <p style={paraStyle}>
          Обработка платежей полностью делегирована <strong style={{ color: C.text }}>Stripe</strong> —
          ведущей мировой платёжной платформе с сертификацией{' '}
          <strong style={{ color: C.text }}>PCI-DSS Level 1</strong> (наивысший уровень безопасности
          в индустрии платежей).
        </p>
        <ul style={listStyle}>
          <li>Номера банковских карт никогда не проходят через наши серверы</li>
          <li>Платёжные формы отображаются через защищённые iframe Stripe</li>
          <li>Мы храним только ID клиента и ID подписки Stripe для управления аккаунтом</li>
          <li>Stripe обеспечивает защиту от мошенничества через Stripe Radar</li>
        </ul>
      </div>

      {/* 4. Размещение данных */}
      <div style={sectionStyle}>
        <h2 id="razmeshchenie" style={headingStyle}>4. Размещение данных (EU)</h2>
        <p style={paraStyle}>
          Все данные TubeForge хранятся на серверах, физически расположенных в Европейском Союзе:
        </p>
        <ul style={listStyle}>
          <li>Основные серверы приложений — EU (OVH, Франция)</li>
          <li>База данных — EU</li>
          <li>Резервные копии — EU</li>
          <li>Файловое хранилище — EU</li>
        </ul>
        <p style={paraStyle}>
          Размещение данных в EU обеспечивает соответствие требованиям GDPR и других
          европейских регуляций по защите данных.
        </p>
      </div>

      {/* 5. Аудиты безопасности */}
      <div style={sectionStyle}>
        <h2 id="audity" style={headingStyle}>5. Аудиты безопасности</h2>
        <p style={paraStyle}>
          Мы проводим регулярные проверки безопасности:
        </p>
        <ul style={listStyle}>
          <li>Регулярное сканирование уязвимостей (автоматическое и ручное)</li>
          <li>Аудит зависимостей и библиотек на предмет известных уязвимостей</li>
          <li>Мониторинг безопасности инфраструктуры 24/7</li>
          <li>Автоматическое обновление security patches</li>
        </ul>
      </div>

      {/* 6. SOC 2 */}
      <div style={sectionStyle}>
        <h2 id="soc2" style={headingStyle}>6. SOC 2 Type II</h2>
        <p style={paraStyle}>
          TubeForge находится в процессе подготовки к сертификации SOC 2 Type II, которая
          подтверждает соответствие следующим принципам:
        </p>
        <ul style={listStyle}>
          <li><strong style={{ color: C.text }}>Security</strong> — защита от несанкционированного доступа</li>
          <li><strong style={{ color: C.text }}>Availability</strong> — доступность сервиса</li>
          <li><strong style={{ color: C.text }}>Confidentiality</strong> — конфиденциальность данных</li>
          <li><strong style={{ color: C.text }}>Processing Integrity</strong> — целостность обработки</li>
          <li><strong style={{ color: C.text }}>Privacy</strong> — защита персональных данных</li>
        </ul>
        <p style={{ ...paraStyle, fontStyle: 'italic' }}>
          Статус: подготовка к сертификации (в процессе).
        </p>
      </div>

      {/* 7. Инфраструктура */}
      <div style={sectionStyle}>
        <h2 id="infrastruktura" style={headingStyle}>7. Инфраструктурная безопасность</h2>
        <ul style={listStyle}>
          <li>Файрвол и ограничение доступа по IP</li>
          <li>SSH-аутентификация только по ключам (пароли отключены)</li>
          <li>VPN для внутренних коммуникаций между сервисами (WireGuard)</li>
          <li>Автоматическое резервное копирование базы данных</li>
          <li>Rate limiting на API для защиты от DDoS</li>
          <li>HTTP security headers (HSTS, CSP, X-Frame-Options)</li>
        </ul>
      </div>

      {/* 8. Responsible Disclosure */}
      <div style={sectionStyle}>
        <h2 id="disclosure" style={headingStyle}>8. Ответственное раскрытие уязвимостей</h2>
        <p style={paraStyle}>
          Мы ценим помощь сообщества в обеспечении безопасности TubeForge. Если вы обнаружили
          уязвимость в безопасности, сообщите нам:
        </p>
        <p style={paraStyle}>
          Email:{' '}
          <a href="mailto:security@tubeforge.co" style={{ color: C.accent }}>
            security@tubeforge.co
          </a>
        </p>
        <p style={paraStyle}>
          Мы просим:
        </p>
        <ul style={listStyle}>
          <li>Не разглашать уязвимость публично до устранения</li>
          <li>Не использовать уязвимость для доступа к чужим данным</li>
          <li>Предоставить достаточно информации для воспроизведения проблемы</li>
        </ul>
        <p style={paraStyle}>
          Мы обязуемся подтвердить получение вашего отчёта в течение 48 часов и предоставить
          обновление о статусе в течение 7 рабочих дней.
        </p>
      </div>
    </div>
  );
}
