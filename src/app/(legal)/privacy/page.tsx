export default function PrivacyPage() {

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-2">
        Privacy Policy
      </h1>
      <p className="text-xs text-muted-foreground mb-4">
        Effective date: March 20, 2026
      </p>

      {/* Table of contents */}
      <nav className="mb-12 rounded-xl bg-card border border-border p-5">
        <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Table of Contents
        </div>
        <ol className="flex flex-col gap-1.5 pl-5">
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
            <li key={id} className="text-sm leading-relaxed">
              <a href={`#${id}`} className="text-brand-500 font-medium underline-offset-4 hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 1 */}
      <div className="mb-9">
        <h2 id="vvedenie" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">1. Introduction</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          This Privacy Policy describes how TubeForge (hereinafter &mdash; &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;Service&rdquo;)
          collects, uses, stores, and protects your personal data when using the TubeForge platform,
          available at{' '}
          <a href="https://tubeforge.co" className="text-brand-500">tubeforge.co</a>.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          By using our Service, you agree to the terms of this Policy. If you disagree
          with any part, please stop using the Service.
        </p>
      </div>

      {/* 2 */}
      <div className="mb-9">
        <h2 id="sbor-dannyh" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">2. Data We Collect</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge collects the following categories of personal data:
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Account data (via Google OAuth):</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Full name</li>
          <li>Email address</li>
          <li>Profile photo</li>
          <li>Google account identifier</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Project and content data:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Created projects, thumbnails, metadata texts</li>
          <li>AI generation settings and parameters</li>
          <li>YouTube channel statistics (when connected)</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Payment data (via Stripe):</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Subscription and plan information</li>
          <li>Payment history and Stripe customer ID</li>
          <li>Card numbers are stored exclusively on Stripe servers and do not pass through our systems</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Usage data (analytics):</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>IP address, browser type, device information</li>
          <li>Platform actions, feature usage frequency</li>
          <li>Page views and session duration</li>
        </ul>
      </div>

      {/* 2a */}
      <div className="mb-9">
        <h2 id="youtube-api" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">2a. YouTube API Services</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge uses YouTube API Services. By using TubeForge, you agree to the{' '}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-brand-500">
            YouTube Terms of Service
          </a>.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Your use of YouTube data through TubeForge is also subject to the{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-500">
            Google Privacy Policy
          </a>.
        </p>
        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">YouTube data we collect and process:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Channel name and profile information</li>
          <li>Subscriber count</li>
          <li>Video statistics (views, likes, comments)</li>
          <li>Upload capabilities and channel status</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          You may revoke TubeForge&apos;s access to your YouTube data at any time via the{' '}
          <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" className="text-brand-500">
            Google security settings page
          </a>.
        </p>
      </div>

      {/* 3 */}
      <div className="mb-9">
        <h2 id="ispolzovanie-dannyh" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">3. How We Use Data</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          We use collected data for the following purposes:
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Service delivery:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Authentication and account management</li>
          <li>AI content generation (thumbnails, texts, SEO recommendations)</li>
          <li>Payment processing and subscription management</li>
          <li>YouTube channel analytics and statistics visualization</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Product improvement:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Usage analysis to improve UX and functionality</li>
          <li>Diagnosis and resolution of technical issues</li>
          <li>Development of new features based on usage patterns</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Communication:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Service notifications and updates</li>
          <li>Transactional emails (payment confirmation, subscription changes)</li>
          <li>Responding to support requests</li>
        </ul>
      </div>

      {/* 4 */}
      <div className="mb-9">
        <h2 id="tretji-storony" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">4. Third Parties</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge integrates with the following third-party services to provide
          platform functionality:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>
            <strong className="text-foreground font-semibold">Stripe</strong> &mdash; payment processing. Payment data (card numbers)
            is processed exclusively by Stripe (PCI-DSS Level 1) and is not stored on our servers.
            See{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-500">
              Stripe Privacy Policy
            </a>.
          </li>
          <li>
            <strong className="text-foreground font-semibold">Google</strong> &mdash; OAuth 2.0 authentication, access
            to YouTube channel analytics. Data usage is governed by the{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-500">
              Google Privacy Policy
            </a>.
          </li>
          <li>
            <strong className="text-foreground font-semibold">OpenAI</strong> &mdash; AI content generation (thumbnails, texts, recommendations).
            Your content may be processed through OpenAI&apos;s API. We do not send personal data to OpenAI,
            only project content for generation.
          </li>
          <li>
            <strong className="text-foreground font-semibold">Resend</strong> &mdash; sending transactional emails
            (notifications, payment confirmations, access recovery). Only email address
            and message content are shared.
          </li>
          <li>
            <strong className="text-foreground font-semibold">PostHog</strong> &mdash; product analytics (only with your explicit
            consent via the cookie consent banner). See{' '}
            <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-500">
              PostHog Privacy Policy
            </a>.
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          We do not sell your personal data to third parties. Data is shared only
          with the listed services to the extent necessary for providing functionality.
        </p>
      </div>

      {/* 5 */}
      <div className="mb-9">
        <h2 id="hranenie-dannyh" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">5. Data Storage</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Your data is stored on servers located in the European Union (EU).
          We use reliable hosting providers with ISO 27001 certification to ensure
          data security and availability.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Data is stored for the entire duration of your account usage. Upon account deletion,
          personal data is removed within 30 days, except for data we are required to retain
          under applicable law (e.g., transaction records &mdash; up to 7 years).
        </p>
      </div>

      {/* 6 */}
      <div className="mb-9">
        <h2 id="faily-cookie" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">6. Cookies</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge uses the following types of cookies:
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Essential (always active):</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Authentication and session management (Auth.js)</li>
          <li>CSRF protection</li>
          <li>Cookie consent storage</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Analytics (consent required):</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>PostHog &mdash; session and device identifier</li>
          <li>Google Analytics &mdash; user identifier</li>
        </ul>

        <table
          className="w-full border-collapse text-sm leading-relaxed text-muted-foreground mb-5"
        >
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-3 py-2 text-foreground font-semibold">Cookie</th>
              <th className="px-3 py-2 text-foreground font-semibold">Type</th>
              <th className="px-3 py-2 text-foreground font-semibold">Duration</th>
              <th className="px-3 py-2 text-foreground font-semibold">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-3 py-2">next-auth.session-token</td>
              <td className="px-3 py-2">Essential</td>
              <td className="px-3 py-2">up to 30 days</td>
              <td className="px-3 py-2">User authentication</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-3 py-2">next-auth.csrf-token</td>
              <td className="px-3 py-2">Essential</td>
              <td className="px-3 py-2">Session</td>
              <td className="px-3 py-2">CSRF protection</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-3 py-2">tf-cookie-consent</td>
              <td className="px-3 py-2">Essential</td>
              <td className="px-3 py-2">Permanent</td>
              <td className="px-3 py-2">Cookie consent choice storage</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-3 py-2">ph_*</td>
              <td className="px-3 py-2">Analytics</td>
              <td className="px-3 py-2">1 year</td>
              <td className="px-3 py-2">PostHog: usage analytics</td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-3 py-2">_ga, _ga_*</td>
              <td className="px-3 py-2">Analytics</td>
              <td className="px-3 py-2">2 years</td>
              <td className="px-3 py-2">Google Analytics: identifier</td>
            </tr>
          </tbody>
        </table>

        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Analytics cookies are set <strong className="text-foreground font-semibold">only after your
          explicit consent</strong> via the cookie consent banner. You can change your choice at any time
          by clearing your browser localStorage or clicking &ldquo;Settings&rdquo; in the cookie banner.
        </p>
      </div>

      {/* 7 */}
      <div className="mb-9">
        <h2 id="prava-polzovateley" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">7. Your Rights (GDPR)</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          In accordance with the General Data Protection Regulation (GDPR) and other applicable
          legislation, you have the following rights:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li><strong className="text-foreground font-semibold">Right of access</strong> &mdash; obtain a copy of your personal data that we process</li>
          <li><strong className="text-foreground font-semibold">Right to rectification</strong> &mdash; request correction of inaccurate or incomplete data</li>
          <li><strong className="text-foreground font-semibold">Right to erasure</strong> &mdash; request deletion of your personal data (right to be forgotten)</li>
          <li><strong className="text-foreground font-semibold">Right to restriction</strong> &mdash; restrict processing of your data in certain cases</li>
          <li><strong className="text-foreground font-semibold">Right to portability</strong> &mdash; receive your data in a machine-readable format (JSON/CSV)</li>
          <li><strong className="text-foreground font-semibold">Right to object</strong> &mdash; object to processing for marketing purposes</li>
          <li><strong className="text-foreground font-semibold">Right to withdraw consent</strong> &mdash; withdraw previously given consent at any time</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:privacy@tubeforge.co" className="text-brand-500">privacy@tubeforge.co</a>.
          We commit to responding to your request within 30 days.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          You can also export your data through account settings under
          &ldquo;Settings&rdquo; &rarr; &ldquo;Data &amp; Privacy&rdquo;.
        </p>
      </div>

      {/* 7a */}
      <div className="mb-9">
        <h2 id="ccpa" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">7a. Your California Privacy Rights (CCPA/CPRA)</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          If you are a California resident, you have additional rights under the California Consumer
          Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Categories of personal information we collect:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Identifiers (name, email address, account ID)</li>
          <li>Commercial information (subscription plan, payment history)</li>
          <li>Internet or electronic network activity (usage data, IP address, browser type)</li>
          <li>Professional information (YouTube channel data when connected)</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Your rights:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li><strong className="text-foreground font-semibold">Right to Know</strong> &mdash; request what personal information we have collected about you</li>
          <li><strong className="text-foreground font-semibold">Right to Delete</strong> &mdash; request deletion of your personal information</li>
          <li><strong className="text-foreground font-semibold">Right to Opt-Out</strong> &mdash; opt out of the sale or sharing of your personal information</li>
          <li><strong className="text-foreground font-semibold">Right to Non-Discrimination</strong> &mdash; exercise your rights without receiving discriminatory treatment</li>
        </ul>

        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          <strong className="text-foreground font-semibold">We do not sell your personal information.</strong> We do not share your
          personal information for cross-context behavioral advertising.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          To exercise your California privacy rights, contact us at{' '}
          <a href="mailto:privacy@tubeforge.co" className="text-brand-500">privacy@tubeforge.co</a>.
          We will respond to verifiable consumer requests within 45 days.
        </p>
      </div>

      {/* 8 */}
      <div className="mb-9">
        <h2 id="udalenie-dannyh" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">8. Data Deletion</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          You can request complete deletion of your data through account settings or by email.
          Upon account deletion, we will:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Delete all personal data within 30 days</li>
          <li>Remove uploaded content (videos, thumbnails) from our servers</li>
          <li>Revoke YouTube API access</li>
          <li>Cancel active subscriptions via Stripe</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Some data may be retained in anonymized form for statistical purposes
          or in accordance with legal requirements (transaction records &mdash; up to 7 years).
        </p>
      </div>

      {/* 9 */}
      <div className="mb-9">
        <h2 id="bezopasnost" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">9. Data Security</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          We implement organizational and technical measures to protect your data:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Data encryption in transit (TLS/HTTPS) and at rest</li>
          <li>Authentication via OAuth 2.0 &mdash; we do not store passwords</li>
          <li>Payment processing via Stripe (PCI-DSS Level 1)</li>
          <li>Regular database backups</li>
          <li>Restricted access to personal data</li>
        </ul>
      </div>

      {/* 10 */}
      <div className="mb-9">
        <h2 id="izmenenie-politiki" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">10. Policy Changes</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          We may update this Privacy Policy. We will notify you of significant changes
          by email and/or via a notification on the platform at least
          30 days before changes take effect.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          By continuing to use the Service after changes take effect, you agree
          to the updated Policy.
        </p>
      </div>

      {/* 11 */}
      <div className="mb-9">
        <h2 id="kontakty" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">11. Contact</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          For all privacy and personal data processing questions,
          please contact:
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Email:{' '}
          <a href="mailto:privacy@tubeforge.co" className="text-brand-500">
            privacy@tubeforge.co
          </a>
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          If you believe your rights have been violated, you have the right to file a complaint
          with the relevant data protection supervisory authority.
        </p>
      </div>
    </div>
  );
}
