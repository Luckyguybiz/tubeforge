/**
 * Email templates for TubeForge transactional emails.
 *
 * All templates use inline CSS for maximum email client compatibility,
 * include dark-mode support via @media (prefers-color-scheme: dark),
 * and support Russian (default) and English locales.
 */

interface TemplateResult {
  subject: string;
  html: string;
}

type TemplateData = Record<string, string | number>;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tubeforge.co';

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

function layout(body: string, locale: string): string {
  const unsubscribeText = locale === 'en'
    ? 'Unsubscribe'
    : 'Отписаться от рассылки';
  const legalText = locale === 'en'
    ? 'You are receiving this email because you have a TubeForge account. If you did not create an account, please ignore this email.'
    : 'Вы получили это письмо, потому что у вас есть аккаунт TubeForge. Если вы не создавали аккаунт, просто проигнорируйте это письмо.';

  return `<!DOCTYPE html>
<html lang="${locale === 'en' ? 'en' : 'ru'}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light dark"/>
<meta name="supported-color-schemes" content="light dark"/>
<title>TubeForge</title>
<style>
  @media (prefers-color-scheme: dark) {
    body, .email-body { background-color: #1a1a2e !important; }
    .email-container { background-color: #16213e !important; }
    .email-header { background-color: #0f3460 !important; }
    .text-primary { color: #e0e0e0 !important; }
    .text-secondary { color: #b0b0b0 !important; }
    .email-footer { background-color: #0f0f23 !important; color: #888 !important; }
  }
</style>
</head>
<body class="email-body" style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
<tr><td align="center" style="padding:24px 16px;">

<!-- Container -->
<table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">

<!-- Header -->
<tr>
  <td class="email-header" style="background-color:#6c5ce7;padding:28px 32px;text-align:center;">
    <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:1px;">TUBEFORGE</span>
  </td>
</tr>

<!-- Body -->
<tr>
  <td style="padding:32px 32px 24px;">
    ${body}
  </td>
</tr>

<!-- Footer -->
<tr>
  <td class="email-footer" style="background-color:#fafafa;padding:20px 32px;text-align:center;font-size:12px;color:#888;line-height:1.6;">
    <p style="margin:0 0 8px;">${legalText}</p>
    <a href="${APP_URL}/settings/notifications" style="color:#6c5ce7;text-decoration:underline;">${unsubscribeText}</a>
    <p style="margin:8px 0 0;color:#aaa;">&copy; ${new Date().getFullYear()} TubeForge. All rights reserved.</p>
  </td>
</tr>

</table>
</td></tr></table>
</body>
</html>`;
}

function ctaButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
<tr><td style="background-color:#6c5ce7;border-radius:8px;">
  <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">${text}</a>
</td></tr></table>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function welcomeTemplate(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const name = String(data.name || '');

  if (locale === 'en') {
    const greeting = name ? `Hi ${name}!` : 'Welcome!';
    return {
      subject: 'Welcome to TubeForge!',
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          Thanks for joining TubeForge. Here is how to get started:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
          <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
            <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">1</span>
            <span class="text-primary" style="color:#333;font-size:15px;">Analyze YouTube videos with SEO scores and metrics</span>
          </td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
            <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">2</span>
            <span class="text-primary" style="color:#333;font-size:15px;">Explore AI-powered analytics and tools</span>
          </td></tr>
          <tr><td style="padding:12px 0;">
            <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">3</span>
            <span class="text-primary" style="color:#333;font-size:15px;">Upgrade your plan to unlock all features</span>
          </td></tr>
        </table>
        ${ctaButton('Go to Dashboard', `${APP_URL}/dashboard`)}
      `, locale),
    };
  }

  // Russian (default)
  const greeting = name ? `Привет, ${name}!` : 'Добро пожаловать!';
  return {
    subject: 'Добро пожаловать в TubeForge!',
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        Спасибо, что присоединились к TubeForge. Вот как начать:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
          <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">1</span>
          <span class="text-primary" style="color:#333;font-size:15px;">Анализируйте YouTube видео с SEO-оценками и метриками</span>
        </td></tr>
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
          <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">2</span>
          <span class="text-primary" style="color:#333;font-size:15px;">Используйте AI-аналитику и инструменты</span>
        </td></tr>
        <tr><td style="padding:12px 0;">
          <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">3</span>
          <span class="text-primary" style="color:#333;font-size:15px;">Обновите план, чтобы разблокировать все возможности</span>
        </td></tr>
      </table>
      ${ctaButton('Перейти в панель', `${APP_URL}/dashboard`)}
    `, locale),
  };
}

function paymentReceiptTemplate(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const plan = String(data.plan || 'PRO');
  const amount = String(data.amount || '0');
  const date = String(data.date || new Date().toLocaleDateString());
  const nextBilling = String(data.nextBilling || '');

  if (locale === 'en') {
    return {
      subject: `Payment received - TubeForge ${plan}`,
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">Payment Received</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          Your payment has been processed successfully.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;border:1px solid #eee;border-radius:8px;overflow:hidden;">
          <tr style="background:#fafafa;">
            <td style="padding:12px 16px;font-weight:600;color:#555;width:40%;">Plan</td>
            <td class="text-primary" style="padding:12px 16px;color:#333;">${plan}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">Amount</td>
            <td class="text-primary" style="padding:12px 16px;color:#333;border-top:1px solid #eee;">${amount}</td>
          </tr>
          <tr style="background:#fafafa;">
            <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">Date</td>
            <td class="text-primary" style="padding:12px 16px;color:#333;border-top:1px solid #eee;">${date}</td>
          </tr>
          ${nextBilling ? `<tr>
            <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">Next billing</td>
            <td class="text-primary" style="padding:12px 16px;color:#333;border-top:1px solid #eee;">${nextBilling}</td>
          </tr>` : ''}
        </table>
        ${ctaButton('View Billing', `${APP_URL}/settings/billing`)}
      `, locale),
    };
  }

  return {
    subject: `Оплата получена \u2014 TubeForge ${plan}`,
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">Оплата получена</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        Ваш платёж успешно обработан.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <tr style="background:#fafafa;">
          <td style="padding:12px 16px;font-weight:600;color:#555;width:40%;">План</td>
          <td class="text-primary" style="padding:12px 16px;color:#333;">${plan}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">Сумма</td>
          <td class="text-primary" style="padding:12px 16px;color:#333;border-top:1px solid #eee;">${amount}</td>
        </tr>
        <tr style="background:#fafafa;">
          <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">Дата</td>
          <td class="text-primary" style="padding:12px 16px;color:#333;border-top:1px solid #eee;">${date}</td>
        </tr>
        ${nextBilling ? `<tr>
          <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">Следующее списание</td>
          <td class="text-primary" style="padding:12px 16px;color:#333;border-top:1px solid #eee;">${nextBilling}</td>
        </tr>` : ''}
      </table>
      ${ctaButton('Управление подпиской', `${APP_URL}/settings/billing`)}
    `, locale),
  };
}

function planChangeTemplate(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const oldPlan = String(data.oldPlan || 'FREE');
  const newPlan = String(data.newPlan || 'PRO');

  const featuresByPlan: Record<string, string[]> = {
    en: {
      PRO: ['Unlimited video analyses', 'All AI tools', 'Priority support'],
      STUDIO: ['Everything in PRO', '4K quality', 'API access', 'Team collaboration'],
    } as unknown as string[],
    ru: {
      PRO: ['Безлимитный анализ видео', 'Все AI-инструменты', 'Приоритетная поддержка'],
      STUDIO: ['Все из PRO', 'Качество 4K', 'Доступ к API', 'Командная работа'],
    } as unknown as string[],
  };

  const features = ((featuresByPlan[locale] ?? featuresByPlan.ru) as unknown as Record<string, string[]>)[newPlan] ?? [];

  if (locale === 'en') {
    return {
      subject: `Your plan has been updated - ${newPlan}`,
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">Plan Updated</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 8px;">
          Your plan has been changed:
        </p>
        <p style="text-align:center;margin:20px 0;">
          <span style="display:inline-block;padding:8px 16px;background:#eee;border-radius:6px;color:#888;font-weight:600;">${oldPlan}</span>
          <span style="display:inline-block;padding:0 12px;color:#6c5ce7;font-size:20px;font-weight:700;">&rarr;</span>
          <span style="display:inline-block;padding:8px 16px;background:#6c5ce7;border-radius:6px;color:#fff;font-weight:600;">${newPlan}</span>
        </p>
        ${features.length > 0 ? `
        <p class="text-primary" style="color:#555;font-size:15px;margin:20px 0 12px;font-weight:600;">New features unlocked:</p>
        <ul style="margin:0 0 20px;padding-left:20px;">
          ${features.map((f: string) => `<li class="text-primary" style="color:#555;padding:4px 0;font-size:15px;">${f}</li>`).join('')}
        </ul>` : ''}
        ${ctaButton('Explore Features', `${APP_URL}/dashboard`)}
      `, locale),
    };
  }

  return {
    subject: `Ваш план обновлён \u2014 ${newPlan}`,
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">План обновлён</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 8px;">
        Ваш план был изменён:
      </p>
      <p style="text-align:center;margin:20px 0;">
        <span style="display:inline-block;padding:8px 16px;background:#eee;border-radius:6px;color:#888;font-weight:600;">${oldPlan}</span>
        <span style="display:inline-block;padding:0 12px;color:#6c5ce7;font-size:20px;font-weight:700;">&rarr;</span>
        <span style="display:inline-block;padding:8px 16px;background:#6c5ce7;border-radius:6px;color:#fff;font-weight:600;">${newPlan}</span>
      </p>
      ${features.length > 0 ? `
      <p class="text-primary" style="color:#555;font-size:15px;margin:20px 0 12px;font-weight:600;">Новые возможности:</p>
      <ul style="margin:0 0 20px;padding-left:20px;">
        ${features.map((f: string) => `<li class="text-primary" style="color:#555;padding:4px 0;font-size:15px;">${f}</li>`).join('')}
      </ul>` : ''}
      ${ctaButton('Открыть панель', `${APP_URL}/dashboard`)}
    `, locale),
  };
}

function referralCommissionTemplate(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const amount = String(data.amount || '0');
  const totalBalance = String(data.totalBalance || '0');
  const referredUser = String(data.referredUser || '');

  if (locale === 'en') {
    return {
      subject: `You earned ${amount} from a referral!`,
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">Referral Commission Earned!</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          Great news! Someone you referred just made a payment.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;border:1px solid #eee;border-radius:8px;overflow:hidden;">
          ${referredUser ? `<tr style="background:#fafafa;">
            <td style="padding:12px 16px;font-weight:600;color:#555;width:40%;">Referred user</td>
            <td class="text-primary" style="padding:12px 16px;color:#333;">${referredUser}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">Commission</td>
            <td style="padding:12px 16px;color:#6c5ce7;font-weight:700;border-top:1px solid #eee;">${amount}</td>
          </tr>
          <tr style="background:#fafafa;">
            <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">Total balance</td>
            <td class="text-primary" style="padding:12px 16px;color:#333;border-top:1px solid #eee;">${totalBalance}</td>
          </tr>
        </table>
        ${ctaButton('View Referrals', `${APP_URL}/referral`)}
      `, locale),
    };
  }

  return {
    subject: `Вы заработали ${amount} по реферальной программе!`,
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">Реферальная комиссия!</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        Отличные новости! Приглашённый вами пользователь совершил оплату.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        ${referredUser ? `<tr style="background:#fafafa;">
          <td style="padding:12px 16px;font-weight:600;color:#555;width:40%;">Пользователь</td>
          <td class="text-primary" style="padding:12px 16px;color:#333;">${referredUser}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">Комиссия</td>
          <td style="padding:12px 16px;color:#6c5ce7;font-weight:700;border-top:1px solid #eee;">${amount}</td>
        </tr>
        <tr style="background:#fafafa;">
          <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">Общий баланс</td>
          <td class="text-primary" style="padding:12px 16px;color:#333;border-top:1px solid #eee;">${totalBalance}</td>
        </tr>
      </table>
      ${ctaButton('Реферальная программа', `${APP_URL}/referral`)}
    `, locale),
  };
}

// ---------------------------------------------------------------------------
// Drip campaign templates
// ---------------------------------------------------------------------------

function dayThreeTemplate(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const name = String(data.name || '');
  const projectCount = Number(data.projectCount || 0);

  if (locale === 'en') {
    const greeting = name ? `Hi ${name}!` : 'Hi there!';
    return {
      subject: `You created ${projectCount} project${projectCount !== 1 ? 's' : ''} — here's what else you can do`,
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          You've already created <strong>${projectCount}</strong> project${projectCount !== 1 ? 's' : ''}! Here's what else you can do with TubeForge:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
          <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
            <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">1</span>
            <span class="text-primary" style="color:#333;font-size:15px;">Generate AI thumbnails for your videos</span>
          </td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
            <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">2</span>
            <span class="text-primary" style="color:#333;font-size:15px;">Use AI to optimize your video metadata for SEO</span>
          </td></tr>
          <tr><td style="padding:12px 0;">
            <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">3</span>
            <span class="text-primary" style="color:#333;font-size:15px;">Publish directly to YouTube from TubeForge</span>
          </td></tr>
        </table>
        ${ctaButton('Explore Tools', `${APP_URL}/tools`)}
      `, locale),
    };
  }

  const greeting = name ? `Привет, ${name}!` : 'Привет!';
  return {
    subject: `Вы создали ${projectCount} проект${projectCount === 1 ? '' : projectCount < 5 ? 'а' : 'ов'} — вот что ещё можно сделать`,
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        Вы уже создали <strong>${projectCount}</strong> проект${projectCount === 1 ? '' : projectCount < 5 ? 'а' : 'ов'}! Вот что ещё можно сделать в TubeForge:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
          <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">1</span>
          <span class="text-primary" style="color:#333;font-size:15px;">Генерируйте AI-обложки для видео</span>
        </td></tr>
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
          <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">2</span>
          <span class="text-primary" style="color:#333;font-size:15px;">Используйте ИИ для оптимизации метаданных и SEO</span>
        </td></tr>
        <tr><td style="padding:12px 0;">
          <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">3</span>
          <span class="text-primary" style="color:#333;font-size:15px;">Публикуйте видео на YouTube прямо из TubeForge</span>
        </td></tr>
      </table>
      ${ctaButton('Открыть инструменты', `${APP_URL}/tools`)}
    `, locale),
  };
}

function daySevenTemplate(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const name = String(data.name || '');
  const projectCount = Number(data.projectCount || 0);
  const aiUsed = Number(data.aiUsed || 0);

  if (locale === 'en') {
    const greeting = name ? `Hi ${name}!` : 'Hi there!';
    return {
      subject: 'Your free plan usage — ready to scale up?',
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          It's been a week! Here's your usage so far:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;border:1px solid #eee;border-radius:8px;overflow:hidden;">
          <tr style="background:#fafafa;">
            <td style="padding:12px 16px;font-weight:600;color:#555;width:50%;">Projects created</td>
            <td class="text-primary" style="padding:12px 16px;color:#333;font-weight:700;">${projectCount} / 3</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">AI generations used</td>
            <td class="text-primary" style="padding:12px 16px;color:#333;font-weight:700;border-top:1px solid #eee;">${aiUsed} / 5</td>
          </tr>
        </table>
        <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Upgrade to <strong>Pro</strong> for 25 projects, 100 AI generations per month, 1080p export, and no watermark.
        </p>
        ${ctaButton('Upgrade to Pro', `${APP_URL}/billing`)}
      `, locale),
    };
  }

  const greeting = name ? `Привет, ${name}!` : 'Привет!';
  return {
    subject: 'Ваш бесплатный план — готовы масштабироваться?',
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        Прошла неделя! Вот ваша статистика:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <tr style="background:#fafafa;">
          <td style="padding:12px 16px;font-weight:600;color:#555;width:50%;">Создано проектов</td>
          <td class="text-primary" style="padding:12px 16px;color:#333;font-weight:700;">${projectCount} / 3</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-weight:600;color:#555;border-top:1px solid #eee;">AI генераций использовано</td>
          <td class="text-primary" style="padding:12px 16px;color:#333;font-weight:700;border-top:1px solid #eee;">${aiUsed} / 5</td>
        </tr>
      </table>
      <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Обновитесь до <strong>Pro</strong>: 25 проектов, 100 AI генераций в месяц, экспорт в 1080p и без водяного знака.
      </p>
      ${ctaButton('Обновить до Pro', `${APP_URL}/billing`)}
    `, locale),
  };
}

// ---------------------------------------------------------------------------
// Team & notification templates
// ---------------------------------------------------------------------------

function teamInviteTemplate(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const inviterName = String(data.inviterName || '');
  const teamName = String(data.teamName || '');
  const acceptUrl = String(data.acceptUrl || `${APP_URL}/teams`);

  if (locale === 'en') {
    return {
      subject: `${inviterName} invited you to team "${teamName}"`,
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">Team Invitation</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          <strong>${inviterName}</strong> has invited you to join the team <strong>${teamName}</strong> on TubeForge.
        </p>
        <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Accept the invitation to start collaborating on projects together.
        </p>
        ${ctaButton('Accept Invitation', acceptUrl)}
        <p style="color:#999;font-size:12px;text-align:center;margin-top:16px;">If you did not expect this invitation, you can safely ignore this email.</p>
      `, locale),
    };
  }

  return {
    subject: `${inviterName} пригласил вас в команду "${teamName}"`,
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">Приглашение в команду</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        <strong>${inviterName}</strong> приглашает вас присоединиться к команде <strong>${teamName}</strong> на TubeForge.
      </p>
      <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Примите приглашение, чтобы начать совместную работу над проектами.
      </p>
      ${ctaButton('Принять приглашение', acceptUrl)}
      <p style="color:#999;font-size:12px;text-align:center;margin-top:16px;">Если вы не ожидали это приглашение, просто проигнорируйте это письмо.</p>
    `, locale),
  };
}

function planChangeConfirmationTemplate(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const userName = String(data.userName || '');
  const oldPlan = String(data.oldPlan || 'FREE');
  const newPlan = String(data.newPlan || 'PRO');

  if (locale === 'en') {
    const greeting = userName ? `Hi ${userName}!` : 'Hi there!';
    return {
      subject: `Your plan was changed from ${oldPlan} to ${newPlan}`,
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          Your TubeForge plan has been updated.
        </p>
        <p style="text-align:center;margin:20px 0;">
          <span style="display:inline-block;padding:8px 16px;background:#eee;border-radius:6px;color:#888;font-weight:600;">${oldPlan}</span>
          <span style="display:inline-block;padding:0 12px;color:#6c5ce7;font-size:20px;font-weight:700;">&rarr;</span>
          <span style="display:inline-block;padding:8px 16px;background:#6c5ce7;border-radius:6px;color:#fff;font-weight:600;">${newPlan}</span>
        </p>
        <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
          If you did not make this change, please contact support immediately.
        </p>
        ${ctaButton('View Account Settings', `${APP_URL}/settings/billing`)}
      `, locale),
    };
  }

  const greeting = userName ? `Привет, ${userName}!` : 'Привет!';
  return {
    subject: `Ваш план изменён с ${oldPlan} на ${newPlan}`,
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        Ваш план TubeForge был обновлён.
      </p>
      <p style="text-align:center;margin:20px 0;">
        <span style="display:inline-block;padding:8px 16px;background:#eee;border-radius:6px;color:#888;font-weight:600;">${oldPlan}</span>
        <span style="display:inline-block;padding:0 12px;color:#6c5ce7;font-size:20px;font-weight:700;">&rarr;</span>
        <span style="display:inline-block;padding:8px 16px;background:#6c5ce7;border-radius:6px;color:#fff;font-weight:600;">${newPlan}</span>
      </p>
      <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Если вы не вносили это изменение, пожалуйста, свяжитесь с поддержкой.
      </p>
      ${ctaButton('Настройки аккаунта', `${APP_URL}/settings/billing`)}
    `, locale),
  };
}

function commentMentionTemplate(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const authorName = String(data.authorName || '');
  const projectName = String(data.projectName || '');
  const commentText = String(data.commentText || '');

  // Truncate comment text to 200 chars for the email preview
  const truncatedComment = commentText.length > 200
    ? commentText.slice(0, 200) + '...'
    : commentText;

  if (locale === 'en') {
    return {
      subject: `${authorName} mentioned you in "${projectName}"`,
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">You were mentioned in a comment</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          <strong>${authorName}</strong> mentioned you in a comment on the project <strong>${projectName}</strong>.
        </p>
        <div style="margin:20px 0;padding:16px 20px;background:#f8f8fc;border-left:4px solid #6c5ce7;border-radius:0 8px 8px 0;">
          <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0;font-style:italic;">&ldquo;${truncatedComment}&rdquo;</p>
        </div>
        ${ctaButton('View Comment', `${APP_URL}/dashboard`)}
      `, locale),
    };
  }

  return {
    subject: `${authorName} упомянул вас в "${projectName}"`,
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">Вас упомянули в комментарии</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        <strong>${authorName}</strong> упомянул вас в комментарии к проекту <strong>${projectName}</strong>.
      </p>
      <div style="margin:20px 0;padding:16px 20px;background:#f8f8fc;border-left:4px solid #6c5ce7;border-radius:0 8px 8px 0;">
        <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0;font-style:italic;">&laquo;${truncatedComment}&raquo;</p>
      </div>
      ${ctaButton('Посмотреть комментарий', `${APP_URL}/dashboard`)}
    `, locale),
  };
}

// ---------------------------------------------------------------------------
// Re-engagement templates
// ---------------------------------------------------------------------------

function reengagementDay3Template(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const name = String(data.name || '');

  if (locale === 'en') {
    const greeting = name ? `Hi ${name}!` : 'Hi there!';
    return {
      subject: 'Your project is waiting for you',
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          We noticed you haven't been back in a few days. Your project is still here, ready for you to continue.
        </p>
        <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Pick up right where you left off &mdash; your AI-generated scenes, edits, and settings are all saved.
        </p>
        ${ctaButton('Continue Your Project', `${APP_URL}/dashboard`)}
      `, locale),
    };
  }

  const greeting = name ? `\u041F\u0440\u0438\u0432\u0435\u0442, ${name}!` : '\u041F\u0440\u0438\u0432\u0435\u0442!';
  return {
    subject: '\u0412\u0430\u0448 \u043F\u0440\u043E\u0435\u043A\u0442 \u0436\u0434\u0451\u0442 \u0432\u0430\u0441',
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        \u041C\u044B \u0437\u0430\u043C\u0435\u0442\u0438\u043B\u0438, \u0447\u0442\u043E \u0432\u044B \u043D\u0435 \u0437\u0430\u0445\u043E\u0434\u0438\u043B\u0438 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0434\u043D\u0435\u0439. \u0412\u0430\u0448 \u043F\u0440\u043E\u0435\u043A\u0442 \u0432\u0441\u0451 \u0435\u0449\u0451 \u0437\u0434\u0435\u0441\u044C, \u0433\u043E\u0442\u043E\u0432 \u043A \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0435\u043D\u0438\u044E.
      </p>
      <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
        \u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u0435 \u0441 \u0442\u043E\u0433\u043E \u043C\u0435\u0441\u0442\u0430, \u0433\u0434\u0435 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0438\u0441\u044C &mdash; \u0432\u0441\u0435 \u0441\u0446\u0435\u043D\u044B, \u043F\u0440\u0430\u0432\u043A\u0438 \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B.
      </p>
      ${ctaButton('\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u0443', `${APP_URL}/dashboard`)}
    `, locale),
  };
}

function reengagementDay7Template(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const name = String(data.name || '');

  if (locale === 'en') {
    const greeting = name ? `Hi ${name}!` : 'Hi there!';
    return {
      subject: 'We added new features — check them out',
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          While you were away, we've been busy improving TubeForge:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
          <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
            <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">\u2728</span>
            <span class="text-primary" style="color:#333;font-size:15px;">Improved AI generation quality</span>
          </td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
            <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">\uD83C\uDFA8</span>
            <span class="text-primary" style="color:#333;font-size:15px;">New templates and styles</span>
          </td></tr>
          <tr><td style="padding:12px 0;">
            <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">\u26A1</span>
            <span class="text-primary" style="color:#333;font-size:15px;">Faster export and rendering</span>
          </td></tr>
        </table>
        ${ctaButton('Explore Updates', `${APP_URL}/dashboard`)}
      `, locale),
    };
  }

  const greeting = name ? `\u041F\u0440\u0438\u0432\u0435\u0442, ${name}!` : '\u041F\u0440\u0438\u0432\u0435\u0442!';
  return {
    subject: '\u041C\u044B \u0434\u043E\u0431\u0430\u0432\u0438\u043B\u0438 \u043D\u043E\u0432\u044B\u0435 \u0444\u0438\u0447\u0438',
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        \u041F\u043E\u043A\u0430 \u0432\u0430\u0441 \u043D\u0435 \u0431\u044B\u043B\u043E, \u043C\u044B \u0443\u043B\u0443\u0447\u0448\u0438\u043B\u0438 TubeForge:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
          <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">\u2728</span>
          <span class="text-primary" style="color:#333;font-size:15px;">\u0423\u043B\u0443\u0447\u0448\u0435\u043D\u043D\u043E\u0435 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u043E AI \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438</span>
        </td></tr>
        <tr><td style="padding:12px 0;border-bottom:1px solid #eee;">
          <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">\uD83C\uDFA8</span>
          <span class="text-primary" style="color:#333;font-size:15px;">\u041D\u043E\u0432\u044B\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u044B \u0438 \u0441\u0442\u0438\u043B\u0438</span>
        </td></tr>
        <tr><td style="padding:12px 0;">
          <span style="display:inline-block;width:28px;height:28px;background:#6c5ce7;color:#fff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;margin-right:12px;">\u26A1</span>
          <span class="text-primary" style="color:#333;font-size:15px;">\u0411\u044B\u0441\u0442\u0440\u0435\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442 \u0438 \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u043D\u0433</span>
        </td></tr>
      </table>
      ${ctaButton('\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F', `${APP_URL}/dashboard`)}
    `, locale),
  };
}

function reengagementDay14Template(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const name = String(data.name || '');

  if (locale === 'en') {
    const greeting = name ? `Hi ${name}!` : 'Hi there!';
    return {
      subject: 'Special 20% discount on Pro — just for you',
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          We miss you! As a special offer, here's an exclusive <strong>20% discount</strong> on TubeForge Pro.
        </p>
        <div style="text-align:center;margin:24px 0;padding:20px;background:#6c5ce710;border-radius:12px;border:1px solid #6c5ce720;">
          <span style="font-size:32px;font-weight:800;color:#6c5ce7;letter-spacing:-.02em;">20% OFF</span>
          <p style="color:#555;font-size:14px;margin:8px 0 0;">Use code <strong style="color:#6c5ce7;">COMEBACK20</strong> at checkout</p>
        </div>
        <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Unlock unlimited projects, 1080p export, no watermark, and AI-powered tools.
        </p>
        ${ctaButton('Claim Your Discount', `${APP_URL}/billing?promo=COMEBACK20`)}
        <p style="color:#999;font-size:12px;text-align:center;margin-top:16px;">Offer valid for 48 hours</p>
      `, locale),
    };
  }

  const greeting = name ? `\u041F\u0440\u0438\u0432\u0435\u0442, ${name}!` : '\u041F\u0440\u0438\u0432\u0435\u0442!';
  return {
    subject: '\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u0441\u043A\u0438\u0434\u043A\u0430 20% \u043D\u0430 Pro \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u0432\u0430\u0441',
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">${greeting}</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        \u041C\u044B \u0441\u043A\u0443\u0447\u0430\u0435\u043C! \u0421\u043F\u0435\u0446\u0438\u0430\u043B\u044C\u043D\u043E \u0434\u043B\u044F \u0432\u0430\u0441 &mdash; \u044D\u043A\u0441\u043A\u043B\u044E\u0437\u0438\u0432\u043D\u0430\u044F <strong>\u0441\u043A\u0438\u0434\u043A\u0430 20%</strong> \u043D\u0430 TubeForge Pro.
      </p>
      <div style="text-align:center;margin:24px 0;padding:20px;background:#6c5ce710;border-radius:12px;border:1px solid #6c5ce720;">
        <span style="font-size:32px;font-weight:800;color:#6c5ce7;letter-spacing:-.02em;">20% \u0421\u041A\u0418\u0414\u041A\u0410</span>
        <p style="color:#555;font-size:14px;margin:8px 0 0;">\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043A\u043E\u0434 <strong style="color:#6c5ce7;">COMEBACK20</strong> \u043F\u0440\u0438 \u043E\u043F\u043B\u0430\u0442\u0435</p>
      </div>
      <p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
        \u0420\u0430\u0437\u0431\u043B\u043E\u043A\u0438\u0440\u0443\u0439\u0442\u0435 \u0431\u0435\u0437\u043B\u0438\u043C\u0438\u0442\u043D\u044B\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u044B, \u044D\u043A\u0441\u043F\u043E\u0440\u0442 \u0432 1080p, \u0431\u0435\u0437 \u0432\u043E\u0434\u044F\u043D\u043E\u0433\u043E \u0437\u043D\u0430\u043A\u0430 \u0438 AI-\u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B.
      </p>
      ${ctaButton('\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0441\u043A\u0438\u0434\u043A\u0443', `${APP_URL}/billing?promo=COMEBACK20`)}
      <p style="color:#999;font-size:12px;text-align:center;margin-top:16px;">\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u043E 48 \u0447\u0430\u0441\u043E\u0432</p>
    `, locale),
  };
}

// ---------------------------------------------------------------------------
// Payment failed template
// ---------------------------------------------------------------------------

function paymentFailedTemplate(data: TemplateData): TemplateResult {
  const locale = String(data.locale || 'ru');
  const plan = String(data.plan || 'PRO');
  const attempt = Number(data.attempt || 1);

  if (locale === 'en') {
    return {
      subject: `Payment failed - TubeForge ${plan}`,
      html: layout(`
        <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">Payment Failed</h1>
        <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
          We were unable to process your payment for TubeForge <strong>${plan}</strong> (attempt ${attempt}).
          Please update your payment method to keep your subscription active.
        </p>
        ${attempt >= 3
          ? `<p style="color:#e74c3c;font-size:15px;line-height:1.6;margin:0 0 20px;font-weight:600;">
              This was the final retry. Your account has been downgraded to the Free plan.
              Update your payment method and resubscribe to restore access.
            </p>`
          : `<p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
              We will retry automatically, but we recommend updating your payment details now.
            </p>`
        }
        ${ctaButton('Update Payment Method', `${APP_URL}/settings/billing`)}
      `, locale),
    };
  }

  return {
    subject: `\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u043F\u043B\u0430\u0442\u044B \u2014 TubeForge ${plan}`,
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u043F\u043B\u0430\u0442\u044B</h1>
      <p class="text-primary" style="color:#555;font-size:16px;line-height:1.6;margin:0 0 20px;">
        \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u043F\u043B\u0430\u0442\u0451\u0436 \u0437\u0430 TubeForge <strong>${plan}</strong> (\u043F\u043E\u043F\u044B\u0442\u043A\u0430 ${attempt}).
        \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0441\u043F\u043E\u0441\u043E\u0431 \u043E\u043F\u043B\u0430\u0442\u044B, \u0447\u0442\u043E\u0431\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0443.
      </p>
      ${attempt >= 3
        ? `<p style="color:#e74c3c;font-size:15px;line-height:1.6;margin:0 0 20px;font-weight:600;">
            \u042D\u0442\u043E \u0431\u044B\u043B\u0430 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u043F\u043E\u043F\u044B\u0442\u043A\u0430. \u0412\u0430\u0448 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u043F\u0435\u0440\u0435\u0432\u0435\u0434\u0451\u043D \u043D\u0430 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043F\u043B\u0430\u043D.
            \u041E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0441\u043F\u043E\u0441\u043E\u0431 \u043E\u043F\u043B\u0430\u0442\u044B \u0438 \u043E\u0444\u043E\u0440\u043C\u0438\u0442\u0435 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0443 \u0437\u0430\u043D\u043E\u0432\u043E.
          </p>`
        : `<p class="text-primary" style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
            \u041C\u044B \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u043C \u043F\u043E\u043F\u044B\u0442\u043A\u0443 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438, \u043D\u043E \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u043C \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435 \u043E\u043F\u043B\u0430\u0442\u044B \u0441\u0435\u0439\u0447\u0430\u0441.
          </p>`
      }
      ${ctaButton('\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u043F\u043E\u0441\u043E\u0431 \u043E\u043F\u043B\u0430\u0442\u044B', `${APP_URL}/settings/billing`)}
    `, locale),
  };
}

// ---------------------------------------------------------------------------
// Contact form submission — notification to support
// ---------------------------------------------------------------------------

function contactFormTemplate(data: TemplateData): TemplateResult {
  const senderName = String(data.name || 'Unknown');
  const senderEmail = String(data.email || 'Unknown');
  const subjectLine = String(data.subject || 'General');
  const msg = String(data.message || '');
  const senderIp = String(data.ip || 'Unknown');
  const submittedAt = String(data.submittedAt || new Date().toISOString());

  return {
    subject: `[Contact Form] ${subjectLine} — from ${senderName}`,
    html: layout(`
      <h1 class="text-primary" style="margin:0 0 16px;font-size:24px;color:#333;">New Contact Form Submission</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            <strong style="color:#555;font-size:14px;display:inline-block;width:100px;">Name:</strong>
            <span class="text-primary" style="color:#333;font-size:15px;">${senderName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            <strong style="color:#555;font-size:14px;display:inline-block;width:100px;">Email:</strong>
            <a href="mailto:${senderEmail}" style="color:#6c5ce7;font-size:15px;text-decoration:none;">${senderEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            <strong style="color:#555;font-size:14px;display:inline-block;width:100px;">Subject:</strong>
            <span class="text-primary" style="color:#333;font-size:15px;">${subjectLine}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            <strong style="color:#555;font-size:14px;display:inline-block;width:100px;">IP Address:</strong>
            <span class="text-secondary" style="color:#888;font-size:13px;">${senderIp}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            <strong style="color:#555;font-size:14px;display:inline-block;width:100px;">Submitted:</strong>
            <span class="text-secondary" style="color:#888;font-size:13px;">${submittedAt}</span>
          </td>
        </tr>
      </table>
      <div style="background:#f8f9fa;border-radius:8px;padding:16px 20px;margin:16px 0;">
        <strong style="color:#555;font-size:14px;display:block;margin-bottom:8px;">Message:</strong>
        <p class="text-primary" style="color:#333;font-size:15px;line-height:1.6;margin:0;white-space:pre-wrap;">${msg}</p>
      </div>
      <p class="text-secondary" style="color:#888;font-size:13px;margin:20px 0 0;">Reply directly to the sender at <a href="mailto:${senderEmail}" style="color:#6c5ce7;">${senderEmail}</a></p>
    `, 'en'),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type EmailTemplate = 'welcome' | 'payment-receipt' | 'plan-change' | 'referral-commission' | 'day-three' | 'day-seven' | 'reengagement-day3' | 'reengagement-day7' | 'reengagement-day14' | 'team-invite' | 'plan-change-confirmation' | 'comment-mention' | 'payment-failed' | 'contact-form';

const templates: Record<EmailTemplate, (data: TemplateData) => TemplateResult> = {
  'welcome': welcomeTemplate,
  'payment-receipt': paymentReceiptTemplate,
  'plan-change': planChangeTemplate,
  'referral-commission': referralCommissionTemplate,
  'day-three': dayThreeTemplate,
  'day-seven': daySevenTemplate,
  'reengagement-day3': reengagementDay3Template,
  'reengagement-day7': reengagementDay7Template,
  'reengagement-day14': reengagementDay14Template,
  'team-invite': teamInviteTemplate,
  'plan-change-confirmation': planChangeConfirmationTemplate,
  'comment-mention': commentMentionTemplate,
  'payment-failed': paymentFailedTemplate,
  'contact-form': contactFormTemplate,
};

export function getTemplate(template: EmailTemplate, data: TemplateData): TemplateResult {
  const fn = templates[template];
  if (!fn) {
    throw new Error(`[email] Unknown template: ${template}`);
  }
  return fn(data);
}

/**
 * Convenience function for day-3 drip email.
 */
export function getDayThreeEmail(userName: string, projectCount: number, locale = 'ru'): TemplateResult {
  return getTemplate('day-three', { name: userName, projectCount, locale });
}

/**
 * Convenience function for day-7 drip email.
 */
export function getDaySevenEmail(userName: string, usage: { projectCount: number; aiUsed: number }, locale = 'ru'): TemplateResult {
  return getTemplate('day-seven', { name: userName, projectCount: usage.projectCount, aiUsed: usage.aiUsed, locale });
}

/**
 * Re-engagement email: Day 3 — "Ваш проект ждёт вас"
 */
export function getReengagementDay3(userName: string, locale = 'ru'): TemplateResult {
  return getTemplate('reengagement-day3', { name: userName, locale });
}

/**
 * Re-engagement email: Day 7 — "Мы добавили новые фичи"
 */
export function getReengagementDay7(userName: string, locale = 'ru'): TemplateResult {
  return getTemplate('reengagement-day7', { name: userName, locale });
}

/**
 * Re-engagement email: Day 14 — "Специальная скидка 20% на Pro"
 */
export function getReengagementDay14(userName: string, locale = 'ru'): TemplateResult {
  return getTemplate('reengagement-day14', { name: userName, locale });
}

/**
 * Team invite email — "{inviterName} invited you to team {teamName}"
 */
export function getTeamInviteEmail(inviterName: string, teamName: string, acceptUrl: string, locale = 'ru'): TemplateResult {
  return getTemplate('team-invite', { inviterName, teamName, acceptUrl, locale });
}

/**
 * Plan change confirmation — "Your plan was changed from {oldPlan} to {newPlan}"
 */
export function getPlanChangeEmail(userName: string, oldPlan: string, newPlan: string, locale = 'ru'): TemplateResult {
  return getTemplate('plan-change-confirmation', { userName, oldPlan, newPlan, locale });
}

/**
 * Comment mention email — "You were mentioned in a comment on {projectName}"
 */
export function getCommentMentionEmail(authorName: string, projectName: string, commentText: string, locale = 'ru'): TemplateResult {
  return getTemplate('comment-mention', { authorName, projectName, commentText, locale });
}
