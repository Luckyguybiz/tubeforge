
export default function DpaPage() {



  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-2">
        Data Processing Agreement (DPA)
      </h1>
      <p className="text-xs text-muted-foreground mb-4">
        Effective Date: March 20, 2026
      </p>

      {/* 1. Purposes of Processing */}
      <div className="mb-9">
        <h2 id="purposes" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">1. Purposes of Data Processing</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge (hereinafter the &quot;Data Processor&quot;) processes personal data on behalf of
          users (hereinafter the &quot;Data Controller&quot;) for the following purposes:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Providing a SaaS platform for YouTube content creation</li>
          <li>User authentication and account management</li>
          <li>AI content generation (thumbnails, text, metadata)</li>
          <li>Payment processing and subscription management</li>
          <li>YouTube channel analytics and data visualization</li>
          <li>Sending transactional email notifications</li>
          <li>Improving service quality and resolving technical issues</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Data processing is carried out solely in accordance with the Data Controller&apos;s instructions
          and in compliance with this Agreement, the Terms of Service, and TubeForge&apos;s Privacy Policy.
        </p>
      </div>

      {/* 2. Types of Personal Data */}
      <div className="mb-9">
        <h2 id="data-types" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">2. Types of Personal Data</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Processor processes the following categories of personal data:
        </p>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--color-muted-foreground)',
            marginBottom: 16,
          }}
        >
          <thead>
            <tr style={{ borderBottom: `2px solid ${'var(--color-border)'}`, textAlign: 'left' }}>
              <th className="px-3 py-2 text-sm font-semibold text-foreground border border-border">Category</th>
              <th className="px-3 py-2 text-sm font-semibold text-foreground border border-border">Data</th>
              <th className="px-3 py-2 text-sm font-semibold text-foreground border border-border">Legal Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">Identification</td>
              <td className="px-3 py-2 border-b border-border text-sm">Name, email, profile photo, Google ID</td>
              <td className="px-3 py-2 border-b border-border text-sm">Contract performance</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">Payment</td>
              <td className="px-3 py-2 border-b border-border text-sm">Stripe Customer ID, transaction history, subscription plan</td>
              <td className="px-3 py-2 border-b border-border text-sm">Contract performance</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">Content</td>
              <td className="px-3 py-2 border-b border-border text-sm">Projects, thumbnails, metadata, text</td>
              <td className="px-3 py-2 border-b border-border text-sm">Contract performance</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">Technical</td>
              <td className="px-3 py-2 border-b border-border text-sm">IP address, User-Agent, session data</td>
              <td className="px-3 py-2 border-b border-border text-sm">Legitimate interest</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">Analytics</td>
              <td className="px-3 py-2 border-b border-border text-sm">Platform activity, page views</td>
              <td className="px-3 py-2 border-b border-border text-sm">Consent</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">YouTube</td>
              <td className="px-3 py-2 border-b border-border text-sm">Channel statistics, video metrics</td>
              <td className="px-3 py-2 border-b border-border text-sm">Consent</td>
            </tr>
          </tbody>
        </table>

        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Processor does not process special categories of personal data (race,
          health, biometrics, etc.).
        </p>
      </div>

      {/* 3. Sub-processors */}
      <div className="mb-9">
        <h2 id="sub-processors" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">3. Sub-processors</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Processor engages the following sub-processors for personal data processing:
        </p>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--color-muted-foreground)',
            marginBottom: 16,
          }}
        >
          <thead>
            <tr style={{ borderBottom: `2px solid ${'var(--color-border)'}`, textAlign: 'left' }}>
              <th className="px-3 py-2 text-sm font-semibold text-foreground border border-border">Sub-processor</th>
              <th className="px-3 py-2 text-sm font-semibold text-foreground border border-border">Purpose</th>
              <th className="px-3 py-2 text-sm font-semibold text-foreground border border-border">Location</th>
              <th className="px-3 py-2 text-sm font-semibold text-foreground border border-border">Data</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm"><strong className="text-foreground font-semibold">Stripe, Inc.</strong></td>
              <td className="px-3 py-2 border-b border-border text-sm">Payment processing</td>
              <td className="px-3 py-2 border-b border-border text-sm">US / EU</td>
              <td className="px-3 py-2 border-b border-border text-sm">Payment data, email</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm"><strong className="text-foreground font-semibold">Google LLC</strong></td>
              <td className="px-3 py-2 border-b border-border text-sm">OAuth authentication, YouTube API</td>
              <td className="px-3 py-2 border-b border-border text-sm">US / EU</td>
              <td className="px-3 py-2 border-b border-border text-sm">Name, email, YouTube data</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm"><strong className="text-foreground font-semibold">OpenAI, Inc.</strong></td>
              <td className="px-3 py-2 border-b border-border text-sm">AI content generation</td>
              <td className="px-3 py-2 border-b border-border text-sm">US</td>
              <td className="px-3 py-2 border-b border-border text-sm">Project content (no personal data)</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm"><strong className="text-foreground font-semibold">Resend, Inc.</strong></td>
              <td className="px-3 py-2 border-b border-border text-sm">Email notification delivery</td>
              <td className="px-3 py-2 border-b border-border text-sm">US</td>
              <td className="px-3 py-2 border-b border-border text-sm">Email address, message content</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm"><strong className="text-foreground font-semibold">OVHcloud</strong></td>
              <td className="px-3 py-2 border-b border-border text-sm">Server and database hosting</td>
              <td className="px-3 py-2 border-b border-border text-sm">EU (France)</td>
              <td className="px-3 py-2 border-b border-border text-sm">All platform data</td>
            </tr>
          </tbody>
        </table>

        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Each sub-processor is bound by contractual obligations ensuring a level of data
          protection no less than that provided by this Agreement. We will notify you of
          any changes to the sub-processor list at least 30 days in advance.
        </p>
      </div>

      {/* 4. Data Retention */}
      <div className="mb-9">
        <h2 id="data-retention" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">4. Data Retention Periods</h2>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--color-muted-foreground)',
            marginBottom: 16,
          }}
        >
          <thead>
            <tr style={{ borderBottom: `2px solid ${'var(--color-border)'}`, textAlign: 'left' }}>
              <th className="px-3 py-2 text-sm font-semibold text-foreground border border-border">Data Category</th>
              <th className="px-3 py-2 text-sm font-semibold text-foreground border border-border">Retention Period</th>
              <th className="px-3 py-2 text-sm font-semibold text-foreground border border-border">Legal Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">Account data</td>
              <td className="px-3 py-2 border-b border-border text-sm">Duration of use + 30 days after deletion</td>
              <td className="px-3 py-2 border-b border-border text-sm">Contract performance</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">Content and projects</td>
              <td className="px-3 py-2 border-b border-border text-sm">Duration of use + 30 days after deletion</td>
              <td className="px-3 py-2 border-b border-border text-sm">Contract performance</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">Payment records</td>
              <td className="px-3 py-2 border-b border-border text-sm">Up to 7 years after transaction</td>
              <td className="px-3 py-2 border-b border-border text-sm">Legal requirement</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">Analytics data</td>
              <td className="px-3 py-2 border-b border-border text-sm">Up to 26 months</td>
              <td className="px-3 py-2 border-b border-border text-sm">Consent</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">Security logs</td>
              <td className="px-3 py-2 border-b border-border text-sm">Up to 12 months</td>
              <td className="px-3 py-2 border-b border-border text-sm">Legitimate interest</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border-b border-border text-sm">Backups</td>
              <td className="px-3 py-2 border-b border-border text-sm">Up to 90 days</td>
              <td className="px-3 py-2 border-b border-border text-sm">Legitimate interest</td>
            </tr>
          </tbody>
        </table>

        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Upon expiration of these retention periods, data is automatically deleted or anonymized.
        </p>
      </div>

      {/* 5. Security Measures */}
      <div className="mb-9">
        <h2 id="security-measures" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">5. Technical and Organizational Security Measures</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Processor implements the following measures to ensure the security of personal data:
        </p>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Technical measures:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Data encryption in transit (TLS 1.3) and at rest (AES-256)</li>
          <li>OAuth 2.0 authentication (no passwords stored)</li>
          <li>Protection against CSRF, XSS, and SQL injection attacks</li>
          <li>Firewall and IP-based access restrictions</li>
          <li>Automated backups</li>
          <li>API rate limiting</li>
          <li>VPN for internal communications (WireGuard)</li>
        </ul>

        <p className="text-sm leading-relaxed text-foreground font-semibold mb-3">Organizational measures:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Principle of least privilege</li>
          <li>Regular security and dependency audits</li>
          <li>24/7 infrastructure monitoring</li>
          <li>Security incident response procedures</li>
          <li>Staff training on data protection</li>
        </ul>
      </div>

      {/* 6. Data Subject Rights */}
      <div className="mb-9">
        <h2 id="data-subject-rights" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">6. Data Subject Rights</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Processor assists the Controller in ensuring the following data subject rights
          in accordance with GDPR:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li><strong className="text-foreground font-semibold">Right of access (Art. 15 GDPR)</strong> — provision of a copy of personal data</li>
          <li><strong className="text-foreground font-semibold">Right to rectification (Art. 16 GDPR)</strong> — correction of inaccurate data</li>
          <li><strong className="text-foreground font-semibold">Right to erasure (Art. 17 GDPR)</strong> — deletion of personal data</li>
          <li><strong className="text-foreground font-semibold">Right to restriction (Art. 18 GDPR)</strong> — restriction of processing</li>
          <li><strong className="text-foreground font-semibold">Right to data portability (Art. 20 GDPR)</strong> — export of data in a machine-readable format</li>
          <li><strong className="text-foreground font-semibold">Right to object (Art. 21 GDPR)</strong> — objection to processing</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Processor commits to responding to data subject requests within 30 days
          and assisting the Controller in fulfilling its obligations.
        </p>
      </div>

      {/* 7. Incident Notification */}
      <div className="mb-9">
        <h2 id="incidents" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">7. Incident Notification</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          In the event of a security incident affecting personal data, the Processor commits to:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Notify the Controller within 72 hours of discovering the incident</li>
          <li>Provide a description of the incident, affected data categories, and approximate number of data subjects</li>
          <li>Describe potential consequences and measures taken to mitigate them</li>
          <li>Cooperate with the Controller in notifying the supervisory authority</li>
        </ul>
      </div>

      {/* 8. Audit */}
      <div className="mb-9">
        <h2 id="audit" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">8. Right to Audit</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The Controller has the right to audit compliance with this Agreement. The Processor
          commits to providing the necessary information and access for conducting an audit,
          subject to at least 30 days prior notice.
        </p>
      </div>

      {/* 9. Contact */}
      <div className="mb-9">
        <h2 id="contact" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">9. Contact Information</h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          For all questions related to data processing and this Agreement:
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Email:{' '}
          <a href="mailto:dpa@tubeforge.co" className="text-brand-500">
            dpa@tubeforge.co
          </a>
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Data Protection Officer:{' '}
          <a href="mailto:privacy@tubeforge.co" className="text-brand-500">
            privacy@tubeforge.co
          </a>
        </p>
      </div>
    </div>
  );
}
