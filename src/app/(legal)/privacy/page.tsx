'use client';

export default function PrivacyPage() {
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
        Privacy Policy
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
            ['vvedenie', 'Introduction'],
            ['sbor-dannyh', 'Data We Collect'],
            ['youtube-api', 'YouTube API Services'],
            ['ispolzovanie-dannyh', 'How We Use Data'],
            ['tretji-storony', 'Third Parties'],
            ['hranenie-dannyh', 'Data Storage'],
            ['faily-cookie', 'Cookies'],
            ['prava-polzovateley', 'Your Rights (GDPR)'],
            ['ccpa', 'California Privacy Rights (CCPA/CPRA)'],
            ['udalenie-dannyh', 'Data Deletion'],
            ['bezopasnost', 'Data Security'],
            ['izmenenie-politiki', 'Policy Changes'],
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
        <h2 id="vvedenie" style={headingStyle}>1. Introduction</h2>
        <p style={paraStyle}>
          This Privacy Policy describes how TubeForge (hereinafter &mdash; &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;Service&rdquo;)
          collects, uses, stores, and protects your personal data when using the TubeForge platform,
          available at{' '}
          <a href="https://tubeforge.co" style={{ color: accentColor, textDecoration: 'none' }}>tubeforge.co</a>.
        </p>
        <p style={paraStyle}>
          By using our Service, you agree to the terms of this Policy. If you disagree
          with any part, please stop using the Service.
        </p>
      </div>

      {/* 2 */}
      <div style={sectionStyle}>
        <h2 id="sbor-dannyh" style={headingStyle}>2. Data We Collect</h2>
        <p style={paraStyle}>
          TubeForge collects the following categories of personal data:
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Account data (via Google OAuth):</p>
        <ul style={listStyle}>
          <li>Full name</li>
          <li>Email address</li>
          <li>Profile photo</li>
          <li>Google account identifier</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Project and content data:</p>
        <ul style={listStyle}>
          <li>Created projects, thumbnails, metadata texts</li>
          <li>AI generation settings and parameters</li>
          <li>YouTube channel statistics (when connected)</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Payment data (via Stripe):</p>
        <ul style={listStyle}>
          <li>Subscription and plan information</li>
          <li>Payment history and Stripe customer ID</li>
          <li>Card numbers are stored exclusively on Stripe servers and do not pass through our systems</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Usage data (analytics):</p>
        <ul style={listStyle}>
          <li>IP address, browser type, device information</li>
          <li>Platform actions, feature usage frequency</li>
          <li>Page views and session duration</li>
        </ul>
      </div>

      {/* 2a */}
      <div style={sectionStyle}>
        <h2 id="youtube-api" style={headingStyle}>2a. YouTube API Services</h2>
        <p style={paraStyle}>
          TubeForge uses YouTube API Services. By using TubeForge, you agree to the{' '}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none' }}>
            YouTube Terms of Service
          </a>.
        </p>
        <p style={paraStyle}>
          Your use of YouTube data through TubeForge is also subject to the{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none' }}>
            Google Privacy Policy
          </a>.
        </p>
        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>YouTube data we collect and process:</p>
        <ul style={listStyle}>
          <li>Channel name and profile information</li>
          <li>Subscriber count</li>
          <li>Video statistics (views, likes, comments)</li>
          <li>Upload capabilities and channel status</li>
        </ul>
        <p style={paraStyle}>
          You may revoke TubeForge&apos;s access to your YouTube data at any time via the{' '}
          <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none' }}>
            Google security settings page
          </a>.
        </p>
      </div>

      {/* 3 */}
      <div style={sectionStyle}>
        <h2 id="ispolzovanie-dannyh" style={headingStyle}>3. How We Use Data</h2>
        <p style={paraStyle}>
          We use collected data for the following purposes:
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Service delivery:</p>
        <ul style={listStyle}>
          <li>Authentication and account management</li>
          <li>AI content generation (thumbnails, texts, SEO recommendations)</li>
          <li>Payment processing and subscription management</li>
          <li>YouTube channel analytics and statistics visualization</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Product improvement:</p>
        <ul style={listStyle}>
          <li>Usage analysis to improve UX and functionality</li>
          <li>Diagnosis and resolution of technical issues</li>
          <li>Development of new features based on usage patterns</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Communication:</p>
        <ul style={listStyle}>
          <li>Service notifications and updates</li>
          <li>Transactional emails (payment confirmation, subscription changes)</li>
          <li>Responding to support requests</li>
        </ul>
      </div>

      {/* 4 */}
      <div style={sectionStyle}>
        <h2 id="tretji-storony" style={headingStyle}>4. Third Parties</h2>
        <p style={paraStyle}>
          TubeForge integrates with the following third-party services to provide
          platform functionality:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: '#ffffff' }}>Stripe</strong> &mdash; payment processing. Payment data (card numbers)
            is processed exclusively by Stripe (PCI-DSS Level 1) and is not stored on our servers.
            See{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none' }}>
              Stripe Privacy Policy
            </a>.
          </li>
          <li>
            <strong style={{ color: '#ffffff' }}>Google</strong> &mdash; OAuth 2.0 authentication, access
            to YouTube channel analytics. Data usage is governed by the{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none' }}>
              Google Privacy Policy
            </a>.
          </li>
          <li>
            <strong style={{ color: '#ffffff' }}>OpenAI</strong> &mdash; AI content generation (thumbnails, texts, recommendations).
            Your content may be processed through OpenAI&apos;s API. We do not send personal data to OpenAI,
            only project content for generation.
          </li>
          <li>
            <strong style={{ color: '#ffffff' }}>Resend</strong> &mdash; sending transactional emails
            (notifications, payment confirmations, access recovery). Only email address
            and message content are shared.
          </li>
          <li>
            <strong style={{ color: '#ffffff' }}>PostHog</strong> &mdash; product analytics (only with your explicit
            consent via the cookie consent banner). See{' '}
            <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none' }}>
              PostHog Privacy Policy
            </a>.
          </li>
        </ul>
        <p style={paraStyle}>
          We do not sell your personal data to third parties. Data is shared only
          with the listed services to the extent necessary for providing functionality.
        </p>
      </div>

      {/* 5 */}
      <div style={sectionStyle}>
        <h2 id="hranenie-dannyh" style={headingStyle}>5. Data Storage</h2>
        <p style={paraStyle}>
          Your data is stored on servers located in the European Union (EU).
          We use reliable hosting providers with ISO 27001 certification to ensure
          data security and availability.
        </p>
        <p style={paraStyle}>
          Data is stored for the entire duration of your account usage. Upon account deletion,
          personal data is removed within 30 days, except for data we are required to retain
          under applicable law (e.g., transaction records &mdash; up to 7 years).
        </p>
      </div>

      {/* 6 */}
      <div style={sectionStyle}>
        <h2 id="faily-cookie" style={headingStyle}>6. Cookies</h2>
        <p style={paraStyle}>
          TubeForge uses the following types of cookies:
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Essential (always active):</p>
        <ul style={listStyle}>
          <li>Authentication and session management (Auth.js)</li>
          <li>CSRF protection</li>
          <li>Cookie consent storage</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Analytics (consent required):</p>
        <ul style={listStyle}>
          <li>PostHog &mdash; session and device identifier</li>
          <li>Google Analytics &mdash; user identifier</li>
        </ul>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 20,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', color: '#ffffff', fontWeight: 600 }}>Cookie</th>
              <th style={{ padding: '8px 10px', color: '#ffffff', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '8px 10px', color: '#ffffff', fontWeight: 600 }}>Duration</th>
              <th style={{ padding: '8px 10px', color: '#ffffff', fontWeight: 600 }}>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '8px 10px' }}>next-auth.session-token</td>
              <td style={{ padding: '8px 10px' }}>Essential</td>
              <td style={{ padding: '8px 10px' }}>up to 30 days</td>
              <td style={{ padding: '8px 10px' }}>User authentication</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '8px 10px' }}>next-auth.csrf-token</td>
              <td style={{ padding: '8px 10px' }}>Essential</td>
              <td style={{ padding: '8px 10px' }}>Session</td>
              <td style={{ padding: '8px 10px' }}>CSRF protection</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '8px 10px' }}>tf-cookie-consent</td>
              <td style={{ padding: '8px 10px' }}>Essential</td>
              <td style={{ padding: '8px 10px' }}>Permanent</td>
              <td style={{ padding: '8px 10px' }}>Cookie consent choice storage</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '8px 10px' }}>ph_*</td>
              <td style={{ padding: '8px 10px' }}>Analytics</td>
              <td style={{ padding: '8px 10px' }}>1 year</td>
              <td style={{ padding: '8px 10px' }}>PostHog: usage analytics</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '8px 10px' }}>_ga, _ga_*</td>
              <td style={{ padding: '8px 10px' }}>Analytics</td>
              <td style={{ padding: '8px 10px' }}>2 years</td>
              <td style={{ padding: '8px 10px' }}>Google Analytics: identifier</td>
            </tr>
          </tbody>
        </table>

        <p style={paraStyle}>
          Analytics cookies are set <strong style={{ color: '#ffffff' }}>only after your
          explicit consent</strong> via the cookie consent banner. You can change your choice at any time
          by clearing your browser localStorage or clicking &ldquo;Settings&rdquo; in the cookie banner.
        </p>
      </div>

      {/* 7 */}
      <div style={sectionStyle}>
        <h2 id="prava-polzovateley" style={headingStyle}>7. Your Rights (GDPR)</h2>
        <p style={paraStyle}>
          In accordance with the General Data Protection Regulation (GDPR) and other applicable
          legislation, you have the following rights:
        </p>
        <ul style={listStyle}>
          <li><strong style={{ color: '#ffffff' }}>Right of access</strong> &mdash; obtain a copy of your personal data that we process</li>
          <li><strong style={{ color: '#ffffff' }}>Right to rectification</strong> &mdash; request correction of inaccurate or incomplete data</li>
          <li><strong style={{ color: '#ffffff' }}>Right to erasure</strong> &mdash; request deletion of your personal data (right to be forgotten)</li>
          <li><strong style={{ color: '#ffffff' }}>Right to restriction</strong> &mdash; restrict processing of your data in certain cases</li>
          <li><strong style={{ color: '#ffffff' }}>Right to portability</strong> &mdash; receive your data in a machine-readable format (JSON/CSV)</li>
          <li><strong style={{ color: '#ffffff' }}>Right to object</strong> &mdash; object to processing for marketing purposes</li>
          <li><strong style={{ color: '#ffffff' }}>Right to withdraw consent</strong> &mdash; withdraw previously given consent at any time</li>
        </ul>
        <p style={paraStyle}>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:privacy@tubeforge.co" style={{ color: accentColor, textDecoration: 'none' }}>privacy@tubeforge.co</a>.
          We commit to responding to your request within 30 days.
        </p>
        <p style={paraStyle}>
          You can also export your data through account settings under
          &ldquo;Settings&rdquo; &rarr; &ldquo;Data &amp; Privacy&rdquo;.
        </p>
      </div>

      {/* 7a */}
      <div style={sectionStyle}>
        <h2 id="ccpa" style={headingStyle}>7a. Your California Privacy Rights (CCPA/CPRA)</h2>
        <p style={paraStyle}>
          If you are a California resident, you have additional rights under the California Consumer
          Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Categories of personal information we collect:</p>
        <ul style={listStyle}>
          <li>Identifiers (name, email address, account ID)</li>
          <li>Commercial information (subscription plan, payment history)</li>
          <li>Internet or electronic network activity (usage data, IP address, browser type)</li>
          <li>Professional information (YouTube channel data when connected)</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: '#ffffff' }}>Your rights:</p>
        <ul style={listStyle}>
          <li><strong style={{ color: '#ffffff' }}>Right to Know</strong> &mdash; request what personal information we have collected about you</li>
          <li><strong style={{ color: '#ffffff' }}>Right to Delete</strong> &mdash; request deletion of your personal information</li>
          <li><strong style={{ color: '#ffffff' }}>Right to Opt-Out</strong> &mdash; opt out of the sale or sharing of your personal information</li>
          <li><strong style={{ color: '#ffffff' }}>Right to Non-Discrimination</strong> &mdash; exercise your rights without receiving discriminatory treatment</li>
        </ul>

        <p style={paraStyle}>
          <strong style={{ color: '#ffffff' }}>We do not sell your personal information.</strong> We do not share your
          personal information for cross-context behavioral advertising.
        </p>
        <p style={paraStyle}>
          To exercise your California privacy rights, contact us at{' '}
          <a href="mailto:privacy@tubeforge.co" style={{ color: accentColor, textDecoration: 'none' }}>privacy@tubeforge.co</a>.
          We will respond to verifiable consumer requests within 45 days.
        </p>
      </div>

      {/* 8 */}
      <div style={sectionStyle}>
        <h2 id="udalenie-dannyh" style={headingStyle}>8. Data Deletion</h2>
        <p style={paraStyle}>
          You can request complete deletion of your data through account settings or by email.
          Upon account deletion, we will:
        </p>
        <ul style={listStyle}>
          <li>Delete all personal data within 30 days</li>
          <li>Remove uploaded content (videos, thumbnails) from our servers</li>
          <li>Revoke YouTube API access</li>
          <li>Cancel active subscriptions via Stripe</li>
        </ul>
        <p style={paraStyle}>
          Some data may be retained in anonymized form for statistical purposes
          or in accordance with legal requirements (transaction records &mdash; up to 7 years).
        </p>
      </div>

      {/* 9 */}
      <div style={sectionStyle}>
        <h2 id="bezopasnost" style={headingStyle}>9. Data Security</h2>
        <p style={paraStyle}>
          We implement organizational and technical measures to protect your data:
        </p>
        <ul style={listStyle}>
          <li>Data encryption in transit (TLS/HTTPS) and at rest</li>
          <li>Authentication via OAuth 2.0 &mdash; we do not store passwords</li>
          <li>Payment processing via Stripe (PCI-DSS Level 1)</li>
          <li>Regular database backups</li>
          <li>Restricted access to personal data</li>
        </ul>
      </div>

      {/* 10 */}
      <div style={sectionStyle}>
        <h2 id="izmenenie-politiki" style={headingStyle}>10. Policy Changes</h2>
        <p style={paraStyle}>
          We may update this Privacy Policy. We will notify you of significant changes
          by email and/or via a notification on the platform at least
          30 days before changes take effect.
        </p>
        <p style={paraStyle}>
          By continuing to use the Service after changes take effect, you agree
          to the updated Policy.
        </p>
      </div>

      {/* 11 */}
      <div style={sectionStyle}>
        <h2 id="kontakty" style={headingStyle}>11. Contact</h2>
        <p style={paraStyle}>
          For all privacy and personal data processing questions,
          please contact:
        </p>
        <p style={paraStyle}>
          Email:{' '}
          <a href="mailto:privacy@tubeforge.co" style={{ color: accentColor, textDecoration: 'none' }}>
            privacy@tubeforge.co
          </a>
        </p>
        <p style={paraStyle}>
          If you believe your rights have been violated, you have the right to file a complaint
          with the relevant data protection supervisory authority.
        </p>
      </div>
    </div>
  );
}
