'use client';

import { useThemeStore } from '@/stores/useThemeStore';

export default function TermsPage() {
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
        Условия использования
      </h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 40 }}>
        Дата вступления в силу: 20 марта 2026
      </p>

      {/* 1. Описание сервиса */}
      <div style={sectionStyle}>
        <h2 id="opisanie-servisa" style={headingStyle}>1. Описание сервиса</h2>
        <p style={paraStyle}>
          TubeForge (далее — «Сервис», «мы», «нас») — это ИИ-платформа для YouTube-креаторов,
          предоставляющая инструменты для создания контента, генерации обложек, оптимизации метаданных,
          видеомонтажа и аналитики каналов. Сервис доступен по адресу{' '}
          <a href="https://tubeforge.co" style={{ color: C.accent }}>tubeforge.co</a>.
        </p>
        <p style={paraStyle}>
          Используя Сервис, вы подтверждаете, что ознакомились с настоящими Условиями использования
          (далее — «Условия») и принимаете их в полном объёме. Если вы не согласны с какой-либо
          частью Условий, прекратите использование Сервиса.
        </p>
      </div>

      {/* 2. Регистрация и аккаунт */}
      <div style={sectionStyle}>
        <h2 id="registratsiya" style={headingStyle}>2. Регистрация и аккаунт</h2>
        <p style={paraStyle}>
          Регистрация в TubeForge осуществляется через Google OAuth. При регистрации
          мы получаем ваше имя, email и фото профиля из Google-аккаунта. Мы не храним
          паролей — аутентификация происходит через протокол OAuth 2.0.
        </p>
        <p style={paraStyle}>
          При создании аккаунта вы обязуетесь:
        </p>
        <ul style={listStyle}>
          <li>Предоставлять достоверную информацию</li>
          <li>Обеспечивать безопасность своего Google-аккаунта, используемого для входа</li>
          <li>Незамедлительно уведомлять нас о несанкционированном доступе к аккаунту</li>
          <li>Не передавать доступ к аккаунту третьим лицам</li>
          <li>Нести ответственность за все действия, совершённые через ваш аккаунт</li>
        </ul>
        <p style={paraStyle}>
          TubeForge не несёт ответственности за убытки, возникшие в результате несанкционированного
          использования вашего аккаунта, если вы не обеспечили его надлежащую защиту.
        </p>
      </div>

      {/* 3. Подписки и оплата */}
      <div style={sectionStyle}>
        <h2 id="podpiski" style={headingStyle}>3. Подписки и оплата</h2>
        <p style={paraStyle}>
          TubeForge предлагает следующие тарифные планы:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>Free:</strong> бесплатный тариф с ограниченным
            функционалом
          </li>
          <li>
            <strong style={{ color: C.text }}>Pro (990 &#8381;/мес):</strong> расширенный функционал для
            индивидуальных авторов
          </li>
          <li>
            <strong style={{ color: C.text }}>Studio (2490 &#8381;/мес):</strong> командный тариф с полным
            доступом ко всем инструментам
          </li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Автопродление:</p>
        <p style={paraStyle}>
          Платные подписки оплачиваются ежемесячно через Stripe. Оплата списывается автоматически
          в начале каждого расчётного периода. Подписка продлевается автоматически до момента отмены.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Отмена подписки:</p>
        <p style={paraStyle}>
          Вы можете отменить подписку в любое время через раздел «Биллинг» в настройках аккаунта.
          После отмены доступ к платным функциям сохраняется до конца оплаченного периода.
          Возврат средств за текущий расчётный период не производится, за исключением случаев,
          предусмотренных законодательством.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Возврат средств:</p>
        <p style={paraStyle}>
          Если вы не удовлетворены сервисом, обратитесь в поддержку в течение 14 дней после оплаты
          для получения полного возврата.
        </p>
      </div>

      {/* 4. Допустимое использование */}
      <div style={sectionStyle}>
        <h2 id="dopustimoe-ispolzovanie" style={headingStyle}>4. Допустимое использование</h2>
        <p style={paraStyle}>
          При использовании TubeForge запрещается:
        </p>
        <ul style={listStyle}>
          <li>Создание и распространение спама, вводящего в заблуждение контента</li>
          <li>Создание контента, разжигающего ненависть (hate speech), дискриминацию или насилие</li>
          <li>Загрузка контента, нарушающего авторские права третьих лиц (copyright violation)</li>
          <li>Создание или распространение нелегального контента (illegal content)</li>
          <li>Попытки обойти ограничения тарифного плана или системы безопасности</li>
          <li>Использование автоматизированных средств для массового доступа к Сервису</li>
          <li>Реверс-инжиниринг, декомпиляция или дизассемблирование программного обеспечения</li>
          <li>Перепродажа или сублицензирование доступа к Сервису</li>
          <li>Нарушение Условий использования YouTube, политик Google или законодательства</li>
        </ul>
        <p style={paraStyle}>
          Нарушение данных правил может привести к немедленной приостановке или удалению аккаунта
          без предварительного уведомления и возврата средств.
        </p>
      </div>


      {/* 5. Сторонние сервисы и API */}
      <div style={sectionStyle}>
        <h2 id="storonnie-servisy" style={headingStyle}>5. Сторонние сервисы и API</h2>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>YouTube API:</p>
        <p style={paraStyle}>
          TubeForge использует YouTube API Services для предоставления функциональности,
          связанной с анализом и управлением YouTube-контентом. Используя эти функции,
          вы также соглашаетесь с{' '}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
            Условиями использования YouTube
          </a>{' '}
          и{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
            Политикой конфиденциальности Google
          </a>.
          Подробнее о YouTube API Services:{' '}
          <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
            YouTube API Services Terms of Service
          </a>.
        </p>
        <p style={paraStyle}>
          Вы можете отозвать доступ TubeForge к вашим данным YouTube в любое время через{' '}
          <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
            настройки безопасности Google
          </a>.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Перевод и озвучивание видео (ElevenLabs):</p>
        <p style={paraStyle}>
          Функции перевода и озвучивания видео реализованы с использованием сторонних
          ИИ-сервисов, включая ElevenLabs. При использовании этих функций аудиоданные
          вашего видео передаются в ElevenLabs для обработки. TubeForge не несёт
          ответственности за качество, точность перевода или озвучивания, выполненного
          сторонними сервисами.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Генерация ИИ-контента (OpenAI):</p>
        <p style={paraStyle}>
          Генерация обложек, текстов и рекомендаций осуществляется с использованием
          API OpenAI. Контент, созданный с помощью ИИ, может содержать неточности
          и требует проверки пользователем перед публикацией.
        </p>
      </div>

      {/* 6. Интеллектуальная собственность */}
      <div style={sectionStyle}>
        <h2 id="intellektualnaya-sobstvennost" style={headingStyle}>6. Интеллектуальная собственность</h2>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Ваш контент:</p>
        <p style={paraStyle}>
          Контент, созданный вами с помощью ИИ-инструментов TubeForge (обложки, тексты,
          метаданные, скрипты), принадлежит вам. TubeForge не претендует на права
          интеллектуальной собственности на пользовательский контент.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Наша платформа:</p>
        <p style={paraStyle}>
          Платформа TubeForge, включая дизайн, код, логотипы, торговые марки и документацию,
          является интеллектуальной собственностью TubeForge и защищена законодательством
          об авторском праве. Запрещается копирование, модификация или распространение
          любой части платформы без нашего письменного согласия.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Лицензия:</p>
        <p style={paraStyle}>
          Вы предоставляете TubeForge ограниченную, неисключительную лицензию на хранение
          и обработку вашего контента исключительно для предоставления функциональности Сервиса.
          Эта лицензия прекращается при удалении вашего аккаунта.
        </p>
      </div>

      {/* 6. Ограничение ответственности */}
      <div style={sectionStyle}>
        <h2 id="ogranichenie-otvetstvennosti" style={headingStyle}>7. Ограничение ответственности</h2>
        <p style={paraStyle}>
          Сервис предоставляется «как есть» (as is) без каких-либо гарантий, явных или
          подразумеваемых. TubeForge не гарантирует:
        </p>
        <ul style={listStyle}>
          <li>Бесперебойную и безошибочную работу Сервиса</li>
          <li>Конкретные результаты от использования ИИ-инструментов</li>
          <li>Рост показателей или монетизацию YouTube-канала</li>
          <li>Сохранность данных в случае форс-мажорных обстоятельств</li>
        </ul>
        <p style={paraStyle}>
          Максимальная совокупная ответственность TubeForge перед пользователем ограничена суммой,
          уплаченной пользователем за последние 12 месяцев. TubeForge не несёт ответственности за
          косвенные, случайные, особые или штрафные убытки, включая упущенную выгоду,
          потерю данных или прерывание деятельности.
        </p>
      </div>

      {/* 7. Изменение условий */}
      <div style={sectionStyle}>
        <h2 id="izmenenie-usloviy" style={headingStyle}>8. Изменение условий</h2>
        <p style={paraStyle}>
          TubeForge оставляет за собой право изменять настоящие Условия. О существенных изменениях
          мы уведомим вас <strong style={{ color: C.text }}>не менее чем за 30 дней</strong> до вступления
          изменений в силу одним из следующих способов:
        </p>
        <ul style={listStyle}>
          <li>По электронной почте, указанной в вашем аккаунте</li>
          <li>Через уведомление в платформе</li>
          <li>Через обновление даты на данной странице</li>
        </ul>
        <p style={paraStyle}>
          Продолжая использовать Сервис после вступления изменений в силу, вы соглашаетесь
          с обновлёнными Условиями. Если вы не согласны с изменениями, вы можете удалить
          аккаунт до вступления новых Условий в силу.
        </p>
      </div>

      {/* 8. Прекращение действия */}
      <div style={sectionStyle}>
        <h2 id="prekrashchenie" style={headingStyle}>9. Прекращение действия</h2>
        <p style={paraStyle}>
          TubeForge может приостановить или прекратить доступ к вашему аккаунту в случаях:
        </p>
        <ul style={listStyle}>
          <li>Нарушения настоящих Условий использования</li>
          <li>Нарушения правил допустимого использования</li>
          <li>Неоплаты подписки</li>
          <li>По вашему запросу на удаление аккаунта</li>
          <li>По требованию законодательства</li>
        </ul>
        <p style={paraStyle}>
          При прекращении действия аккаунта вы потеряете доступ к данным и контенту.
          Рекомендуем экспортировать важные данные до удаления аккаунта.
        </p>
      </div>

      {/* 9. Применимое право */}
      <div style={sectionStyle}>
        <h2 id="primenimoe-pravo" style={headingStyle}>10. Применимое право</h2>
        <p style={paraStyle}>
          Настоящие Условия регулируются и толкуются в соответствии с действующим законодательством
          Европейского Союза, включая Общий регламент по защите данных (GDPR).
        </p>
        <p style={paraStyle}>
          Все споры, возникающие из настоящих Условий, подлежат разрешению путём переговоров.
          В случае невозможности разрешения спора путём переговоров он передаётся на рассмотрение
          в компетентный суд в соответствии с применимым законодательством.
        </p>
      </div>

      {/* 10. Контакты */}
      <div style={sectionStyle}>
        <h2 id="kontakty" style={headingStyle}>11. Контакты</h2>
        <p style={paraStyle}>
          По всем вопросам, связанным с настоящими Условиями использования, обращайтесь:
        </p>
        <p style={paraStyle}>
          Email:{' '}
          <a href="mailto:legal@tubeforge.co" style={{ color: C.accent }}>
            legal@tubeforge.co
          </a>
        </p>
        <p style={paraStyle}>
          Общая поддержка:{' '}
          <a href="mailto:support@tubeforge.co" style={{ color: C.accent }}>
            support@tubeforge.co
          </a>
        </p>
      </div>
    </div>
  );
}
