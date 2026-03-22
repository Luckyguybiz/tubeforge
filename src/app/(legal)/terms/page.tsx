'use client';

export default function TermsPage() {
  const sectionStyle: React.CSSProperties = { marginBottom: 40 };
  const headingStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 14,
    color: '#ffffff',
    letterSpacing: '-0.01em',
  };
  const paraStyle: React.CSSProperties = {
    fontSize: 17,
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 14,
  };
  const listStyle: React.CSSProperties = {
    fontSize: 17,
    lineHeight: 1.9,
    color: 'rgba(255,255,255,0.7)',
    paddingLeft: 28,
    margin: '10px 0 14px',
  };
  const accentColor = '#6366f1';

  return (
    <div>
      <h1
        style={{
          fontSize: 40,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          marginBottom: 8,
          color: '#ffffff',
          lineHeight: 1.15,
        }}
      >
        Terms of Service
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
        Effective date: March 20, 2026
      </p>

      {/* Table of contents */}
      <nav
        style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 48,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Table of Contents
        </div>
        <ol
          style={{
            margin: 0,
            paddingLeft: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {[
            ['opisanie-servisa', 'Service Description'],
            ['registratsiya', 'Registration & Account'],
            ['podpiski', 'Subscriptions & Payments'],
            ['youtube-tos', 'YouTube Terms of Service'],
            ['dopustimoe-ispolzovanie', 'Acceptable Use'],
            ['intellektualnaya-sobstvennost', 'Intellectual Property'],
            ['ogranichenie-otvetstvennosti', 'Limitation of Liability'],
            ['izmenenie-usloviy', 'Changes to Terms'],
            ['prekrashchenie', 'Termination'],
            ['primenimoe-pravo', 'Governing Law'],
            ['kontakty', 'Contact'],
          ].map(([id, label]) => (
            <li key={id} style={{ fontSize: 14, lineHeight: 1.6 }}>
              <a
                href={`#${id}`}
                style={{
                  color: accentColor,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 1 */}
      <div style={sectionStyle}>
        <h2 id="opisanie-servisa" style={headingStyle}>1. Service Description</h2>
        <p style={paraStyle}>
          TubeForge (hereinafter &mdash; &ldquo;Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is an AI-powered platform for YouTube creators,
          providing tools for content creation, thumbnail generation, metadata optimization,
          video editing, and channel analytics. The Service is available at{' '}
          <a href="https://tubeforge.co" style={{ color: accentColor, textDecoration: 'none' }}>tubeforge.co</a>.
        </p>
        <p style={paraStyle}>
          By using the Service, you confirm that you have read these Terms of Service
          (hereinafter &mdash; &ldquo;Terms&rdquo;) and accept them in full. If you disagree with any
          part of the Terms, please stop using the Service.
        </p>
      </div>

      {/* 2 */}
      <div style={sectionStyle}>
        <h2 id="registratsiya" style={headingStyle}>2. Registration & Account</h2>
        <p style={paraStyle}>
          Registration with TubeForge is done via Google OAuth. During registration,
          we receive your name, email, and profile photo from your Google account. We do not store
          passwords &mdash; authentication is handled via the OAuth 2.0 protocol.
        </p>
        <p style={paraStyle}>
          You must be at least 13 years old to use TubeForge. In jurisdictions where parental consent
          is required, the minimum age is 16.
        </p>
        <p style={paraStyle}>
          When creating an account, you agree to:
        </p>
        <ul style={listStyle}>
          <li>Provide accurate information</li>
          <li>Ensure the security of your Google account used for sign-in</li>
          <li>Immediately notify us of any unauthorized access to your account</li>
          <li>Not share account access with third parties</li>
          <li>Be responsible for all actions performed through your account</li>
        </ul>
        <p style={paraStyle}>
          TubeForge is not liable for losses arising from unauthorized use of your account
          if you failed to protect it adequately.
        </p>
      </div>

      {/* 3 */}
      <div style={sectionStyle}>
        <h2 id="podpiski" style={headingStyle}>3. Subscriptions & Payments</h2>
        <p style={paraStyle}>
          TubeForge offers the following plans:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: '#ffffff' }}>Free:</strong> limited functionality at no cost
          </li>
          <li>
            <strong style={{ color: '#ffffff' }}>Pro ($12/mo):</strong> extended features for individual creators
          </li>
          <li>
            <strong style={{ color: '#ffffff' }}>Studio ($30/mo):</strong> team plan with full access to all tools
          </li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Auto-renewal:</p>
        <p style={paraStyle}>
          Paid subscriptions are billed monthly via Stripe. Payment is charged automatically
          at the beginning of each billing period. Subscriptions renew automatically until canceled.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Cancellation:</p>
        <p style={paraStyle}>
          You can cancel your subscription at any time through the &ldquo;Billing&rdquo; section in your account settings.
          After cancellation, access to paid features is retained until the end of the paid period.
          No refunds are issued for the current billing period, except as required by law.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Refunds:</p>
        <p style={paraStyle}>
          If you are not satisfied with the service, contact support within 14 days of payment
          for a full refund.
        </p>
      </div>

      {/* 3a */}
      <div style={sectionStyle}>
        <h2 id="youtube-tos" style={headingStyle}>3a. YouTube Terms of Service</h2>
        <p style={paraStyle}>
          By using TubeForge&apos;s YouTube features (analytics, channel management, video tools), you agree
          to the{' '}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none' }}>
            YouTube Terms of Service
          </a>.
          Your use of YouTube data is also subject to the{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none' }}>
            Google Privacy Policy
          </a>.
        </p>
      </div>

      {/* 4 */}
      <div style={sectionStyle}>
        <h2 id="dopustimoe-ispolzovanie" style={headingStyle}>4. Acceptable Use</h2>
        <p style={paraStyle}>
          When using TubeForge, the following is prohibited:
        </p>
        <ul style={listStyle}>
          <li>Creating and distributing spam or misleading content</li>
          <li>Creating content that incites hatred (hate speech), discrimination, or violence</li>
          <li>Uploading content that infringes third-party copyrights</li>
          <li>Creating or distributing illegal content</li>
          <li>Attempting to circumvent plan limits or security systems</li>
          <li>Using automated means for mass access to the Service</li>
          <li>Reverse engineering, decompiling, or disassembling the software</li>
          <li>Reselling or sublicensing access to the Service</li>
          <li>Violating YouTube Terms of Service, Google policies, or applicable law</li>
        </ul>
        <p style={paraStyle}>
          Violation of these rules may result in immediate suspension or deletion of your account
          without prior notice or refund.
        </p>
      </div>

      {/* 5 */}
      <div style={sectionStyle}>
        <h2 id="intellektualnaya-sobstvennost" style={headingStyle}>5. Intellectual Property</h2>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Your content:</p>
        <p style={paraStyle}>
          Content created by you using TubeForge&apos;s AI tools (thumbnails, texts,
          metadata, scripts) belongs to you. TubeForge does not claim intellectual property rights
          over user content.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Our platform:</p>
        <p style={paraStyle}>
          The TubeForge platform, including design, code, logos, trademarks, and documentation,
          is the intellectual property of TubeForge and is protected by copyright law. Copying, modification, or distribution
          of any part of the platform without our written consent is prohibited.
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>License:</p>
        <p style={paraStyle}>
          You grant TubeForge a limited, non-exclusive license to store
          and process your content solely for the purpose of providing Service functionality.
          This license terminates when your account is deleted.
        </p>
      </div>

      {/* 6 */}
      <div style={sectionStyle}>
        <h2 id="ogranichenie-otvetstvennosti" style={headingStyle}>6. Limitation of Liability</h2>
        <p style={paraStyle}>
          The Service is provided &ldquo;as is&rdquo; without any warranties, express or
          implied. TubeForge does not guarantee:
        </p>
        <ul style={listStyle}>
          <li>Uninterrupted and error-free operation of the Service</li>
          <li>Specific results from using AI tools</li>
          <li>Growth in metrics or monetization of your YouTube channel</li>
          <li>Data safety in case of force majeure</li>
        </ul>
        <p style={paraStyle}>
          The maximum aggregate liability of TubeForge to a user is limited to the amount
          paid by the user in the last 12 months. TubeForge is not liable for
          indirect, incidental, special, or punitive damages, including lost profits,
          data loss, or business interruption.
        </p>
      </div>

      {/* 7 */}
      <div style={sectionStyle}>
        <h2 id="izmenenie-usloviy" style={headingStyle}>7. Changes to Terms</h2>
        <p style={paraStyle}>
          TubeForge reserves the right to modify these Terms. We will notify you of significant changes
          <strong style={{ color: '#ffffff' }}> at least 30 days</strong> before they take effect via one of the following methods:
        </p>
        <ul style={listStyle}>
          <li>By email to the address associated with your account</li>
          <li>Via a notification on the platform</li>
          <li>By updating the date on this page</li>
        </ul>
        <p style={paraStyle}>
          By continuing to use the Service after changes take effect, you agree
          to the updated Terms. If you disagree with changes, you may delete
          your account before the new Terms take effect.
        </p>
      </div>

      {/* 8 */}
      <div style={sectionStyle}>
        <h2 id="prekrashchenie" style={headingStyle}>8. Termination</h2>
        <p style={paraStyle}>
          TubeForge may suspend or terminate access to your account in the following cases:
        </p>
        <ul style={listStyle}>
          <li>Violation of these Terms of Service</li>
          <li>Violation of acceptable use policies</li>
          <li>Non-payment of subscription</li>
          <li>At your request to delete your account</li>
          <li>As required by law</li>
        </ul>
        <p style={paraStyle}>
          Upon account termination, you will lose access to data and content.
          We recommend exporting important data before deleting your account.
        </p>
      </div>

      {/* 9 */}
      <div style={sectionStyle}>
        <h2 id="primenimoe-pravo" style={headingStyle}>9. Governing Law</h2>
        <p style={paraStyle}>
          These Terms are governed by and construed in accordance with the applicable legislation
          of the European Union, including the General Data Protection Regulation (GDPR).
        </p>
        <p style={paraStyle}>
          All disputes arising from these Terms shall be resolved through negotiation.
          If a dispute cannot be resolved through negotiation, it shall be referred
          to the competent court in accordance with applicable law.
        </p>
      </div>

      {/* 10 */}
      <div style={sectionStyle}>
        <h2 id="kontakty" style={headingStyle}>10. Contact</h2>
        <p style={paraStyle}>
          For all questions regarding these Terms of Service, please contact:
        </p>
        <p style={paraStyle}>
          Email:{' '}
          <a href="mailto:legal@tubeforge.co" style={{ color: accentColor, textDecoration: 'none' }}>
            legal@tubeforge.co
          </a>
        </p>
        <p style={paraStyle}>
          General support:{' '}
          <a href="mailto:support@tubeforge.co" style={{ color: accentColor, textDecoration: 'none' }}>
            support@tubeforge.co
          </a>
        </p>
      </div>
    </div>
  );
}
