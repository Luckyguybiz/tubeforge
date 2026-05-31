export default function TermsPage() {

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-2">
        Terms of Service
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
            ['opisanie-servisa', 'Service Description'],
            ['registratsiya', 'Registration & Account'],
            ['podpiski', 'Subscriptions & Payments'],
            ['youtube-tos', 'YouTube API Services'],
            ['dopustimoe-ispolzovanie', 'Acceptable Use'],
            ['intellektualnaya-sobstvennost', 'Intellectual Property'],
            ['ogranichenie-otvetstvennosti', 'Limitation of Liability'],
            ['izmenenie-usloviy', 'Changes to Terms'],
            ['prekrashchenie', 'Termination'],
            ['primenimoe-pravo', 'Governing Law'],
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
        <h2 id="opisanie-servisa" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">1. Service Description</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge (hereinafter &mdash; &ldquo;Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is an AI-powered platform for YouTube creators,
          providing tools for content creation, thumbnail generation, metadata optimization,
          video editing, and publishing automation. The Service is available at{' '}
          <a href="https://tubeforge.co" className="text-brand-500">tubeforge.co</a>.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          By using the Service, you confirm that you have read these Terms of Service
          (hereinafter &mdash; &ldquo;Terms&rdquo;) and accept them in full. If you disagree with any
          part of the Terms, please stop using the Service.
        </p>
      </div>

      {/* 2 */}
      <div className="mb-9">
        <h2 id="registratsiya" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">2. Registration & Account</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Registration with TubeForge is done via Google OAuth. During registration,
          we receive your name, email, and profile photo from your Google account. We do not store
          passwords &mdash; authentication is handled via the OAuth 2.0 protocol.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          You must be at least 13 years old to use TubeForge. In jurisdictions where parental consent
          is required, the minimum age is 16.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          When creating an account, you agree to:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Provide accurate information</li>
          <li>Ensure the security of your Google account used for sign-in</li>
          <li>Immediately notify us of any unauthorized access to your account</li>
          <li>Not share account access with third parties</li>
          <li>Be responsible for all actions performed through your account</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge is not liable for losses arising from unauthorized use of your account
          if you failed to protect it adequately.
        </p>
      </div>

      {/* 3 */}
      <div className="mb-9">
        <h2 id="podpiski" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">3. Subscriptions & Payments</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge offers the following plans:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>
            <strong className="text-foreground font-semibold">Free:</strong> limited functionality at no cost
          </li>
          <li>
            <strong className="text-foreground font-semibold">Pro ($12/mo):</strong> extended features for individual creators
          </li>
          <li>
            <strong className="text-foreground font-semibold">Studio ($30/mo):</strong> team plan with full access to all tools
          </li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Auto-renewal:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Paid subscriptions are billed monthly via Stripe. Payment is charged automatically
          at the beginning of each billing period. Subscriptions renew automatically until canceled.
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Cancellation:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          You can cancel your subscription at any time through the &ldquo;Billing&rdquo; section in your account settings.
          After cancellation, access to paid features is retained until the end of the paid period.
          No refunds are issued for the current billing period, except as required by law.
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Refunds:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          If you are not satisfied with the service, contact support within 14 days of payment
          for a full refund.
        </p>
      </div>

      {/* 3a */}
      <div className="mb-9">
        <h2 id="youtube-tos" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">3a. YouTube API Services</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge is an API Client of YouTube API Services. By using TubeForge&apos;s
          YouTube features (channel connections, analytics, publishing, video tools), you
          acknowledge and agree to be bound by the{' '}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-brand-500">
            YouTube Terms of Service
          </a>{' '}
          and the{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-500">
            Google Privacy Policy
          </a>, in addition to these Terms.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          You may revoke TubeForge&apos;s access to your YouTube data at any time via the{' '}
          <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" className="text-brand-500">
            Google security settings page
          </a>{' '}
          or at{' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-brand-500">
            myaccount.google.com/permissions
          </a>.
          For details on how we store, process, and delete YouTube data, see our{' '}
          <a href="/privacy#youtube-api" className="text-brand-500">Privacy Policy &mdash; YouTube API Services section</a>.
        </p>
      </div>

      {/* 4 */}
      <div className="mb-9">
        <h2 id="dopustimoe-ispolzovanie" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">4. Acceptable Use</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          When using TubeForge, the following is prohibited:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
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
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Violation of these rules may result in immediate suspension or deletion of your account
          without prior notice or refund.
        </p>
      </div>

      {/* 5 */}
      <div className="mb-9">
        <h2 id="intellektualnaya-sobstvennost" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">5. Intellectual Property</h2>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Your content:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Content created by you using TubeForge&apos;s AI tools (thumbnails, texts,
          metadata, scripts) belongs to you. TubeForge does not claim intellectual property rights
          over user content.
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Our platform:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The TubeForge platform, including design, code, logos, trademarks, and documentation,
          is the intellectual property of TubeForge and is protected by copyright law. Copying, modification, or distribution
          of any part of the platform without our written consent is prohibited.
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">License:</p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          You grant TubeForge a limited, non-exclusive license to store
          and process your content solely for the purpose of providing Service functionality.
          This license terminates when your account is deleted.
        </p>
      </div>

      {/* 6 */}
      <div className="mb-9">
        <h2 id="ogranichenie-otvetstvennosti" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">6. Limitation of Liability</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Service is provided &ldquo;as is&rdquo; without any warranties, express or
          implied. TubeForge does not guarantee:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Uninterrupted and error-free operation of the Service</li>
          <li>Specific results from using AI tools</li>
          <li>Growth in audience reach or revenue of your YouTube channel</li>
          <li>Data safety in case of force majeure</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The maximum aggregate liability of TubeForge to a user is limited to the amount
          paid by the user in the last 12 months. TubeForge is not liable for
          indirect, incidental, special, or punitive damages, including lost profits,
          data loss, or business interruption.
        </p>
      </div>

      {/* 7 */}
      <div className="mb-9">
        <h2 id="izmenenie-usloviy" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">7. Changes to Terms</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge reserves the right to modify these Terms. We will notify you of significant changes
          <strong className="text-foreground font-semibold"> at least 30 days</strong> before they take effect via one of the following methods:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>By email to the address associated with your account</li>
          <li>Via a notification on the platform</li>
          <li>By updating the date on this page</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          By continuing to use the Service after changes take effect, you agree
          to the updated Terms. If you disagree with changes, you may delete
          your account before the new Terms take effect.
        </p>
      </div>

      {/* 8 */}
      <div className="mb-9">
        <h2 id="prekrashchenie" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">8. Termination</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge may suspend or terminate access to your account in the following cases:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Violation of these Terms of Service</li>
          <li>Violation of acceptable use policies</li>
          <li>Non-payment of subscription</li>
          <li>At your request to delete your account</li>
          <li>As required by law</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Upon account termination, you will lose access to data and content.
          We recommend exporting important data before deleting your account.
        </p>
      </div>

      {/* 9 */}
      <div className="mb-9">
        <h2 id="primenimoe-pravo" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">9. Governing Law</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          These Terms are governed by and construed in accordance with the applicable legislation
          of the European Union, including the General Data Protection Regulation (GDPR).
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          All disputes arising from these Terms shall be resolved through negotiation.
          If a dispute cannot be resolved through negotiation, it shall be referred
          to the competent court in accordance with applicable law.
        </p>
      </div>

      {/* 10 */}
      <div className="mb-9">
        <h2 id="kontakty" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">10. Contact</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          For all questions regarding these Terms of Service, please contact:
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Email:{' '}
          <a href="mailto:legal@tubeforge.co" className="text-brand-500">
            legal@tubeforge.co
          </a>
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          General support:{' '}
          <a href="mailto:support@tubeforge.co" className="text-brand-500">
            support@tubeforge.co
          </a>
        </p>
      </div>
    </div>
  );
}
