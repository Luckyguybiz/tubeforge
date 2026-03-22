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
        Data Processing Agreement (DPA)
      </h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 40 }}>
        Effective Date: March 20, 2026
      </p>

      {/* 1. Purposes of Processing */}
      <div style={sectionStyle}>
        <h2 id="purposes" style={headingStyle}>1. Purposes of Data Processing</h2>
        <p style={paraStyle}>
          TubeForge (hereinafter the &quot;Data Processor&quot;) processes personal data on behalf of
          users (hereinafter the &quot;Data Controller&quot;) for the following purposes:
        </p>
        <ul style={listStyle}>
          <li>Providing a SaaS platform for YouTube content creation</li>
          <li>User authentication and account management</li>
          <li>AI content generation (thumbnails, text, metadata)</li>
          <li>Payment processing and subscription management</li>
          <li>YouTube channel analytics and data visualization</li>
          <li>Sending transactional email notifications</li>
          <li>Improving service quality and resolving technical issues</li>
        </ul>
        <p style={paraStyle}>
          Data processing is carried out solely in accordance with the Data Controller&apos;s instructions
          and in compliance with this Agreement, the Terms of Service, and TubeForge&apos;s Privacy Policy.
        </p>
      </div>

      {/* 2. Types of Personal Data */}
      <div style={sectionStyle}>
        <h2 id="data-types" style={headingStyle}>2. Types of Personal Data</h2>
        <p style={paraStyle}>
          The Processor processes the following categories of personal data:
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
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Category</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Data</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Legal Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellStyle}>Identification</td>
              <td style={cellStyle}>Name, email, profile photo, Google ID</td>
              <td style={cellStyle}>Contract performance</td>
            </tr>
            <tr>
              <td style={cellStyle}>Payment</td>
              <td style={cellStyle}>Stripe Customer ID, transaction history, subscription plan</td>
              <td style={cellStyle}>Contract performance</td>
            </tr>
            <tr>
              <td style={cellStyle}>Content</td>
              <td style={cellStyle}>Projects, thumbnails, metadata, text</td>
              <td style={cellStyle}>Contract performance</td>
            </tr>
            <tr>
              <td style={cellStyle}>Technical</td>
              <td style={cellStyle}>IP address, User-Agent, session data</td>
              <td style={cellStyle}>Legitimate interest</td>
            </tr>
            <tr>
              <td style={cellStyle}>Analytics</td>
              <td style={cellStyle}>Platform activity, page views</td>
              <td style={cellStyle}>Consent</td>
            </tr>
            <tr>
              <td style={cellStyle}>YouTube</td>
              <td style={cellStyle}>Channel statistics, video metrics</td>
              <td style={cellStyle}>Consent</td>
            </tr>
          </tbody>
        </table>

        <p style={paraStyle}>
          The Processor does not process special categories of personal data (race,
          health, biometrics, etc.).
        </p>
      </div>

      {/* 3. Sub-processors */}
      <div style={sectionStyle}>
        <h2 id="sub-processors" style={headingStyle}>3. Sub-processors</h2>
        <p style={paraStyle}>
          The Processor engages the following sub-processors for personal data processing:
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
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Sub-processor</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Purpose</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Location</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Data</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellStyle}><strong style={{ color: C.text }}>Stripe, Inc.</strong></td>
              <td style={cellStyle}>Payment processing</td>
              <td style={cellStyle}>US / EU</td>
              <td style={cellStyle}>Payment data, email</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong style={{ color: C.text }}>Google LLC</strong></td>
              <td style={cellStyle}>OAuth authentication, YouTube API</td>
              <td style={cellStyle}>US / EU</td>
              <td style={cellStyle}>Name, email, YouTube data</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong style={{ color: C.text }}>OpenAI, Inc.</strong></td>
              <td style={cellStyle}>AI content generation</td>
              <td style={cellStyle}>US</td>
              <td style={cellStyle}>Project content (no personal data)</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong style={{ color: C.text }}>Resend, Inc.</strong></td>
              <td style={cellStyle}>Email notification delivery</td>
              <td style={cellStyle}>US</td>
              <td style={cellStyle}>Email address, message content</td>
            </tr>
            <tr>
              <td style={cellStyle}><strong style={{ color: C.text }}>OVHcloud</strong></td>
              <td style={cellStyle}>Server and database hosting</td>
              <td style={cellStyle}>EU (France)</td>
              <td style={cellStyle}>All platform data</td>
            </tr>
          </tbody>
        </table>

        <p style={paraStyle}>
          Each sub-processor is bound by contractual obligations ensuring a level of data
          protection no less than that provided by this Agreement. We will notify you of
          any changes to the sub-processor list at least 30 days in advance.
        </p>
      </div>

      {/* 4. Data Retention */}
      <div style={sectionStyle}>
        <h2 id="data-retention" style={headingStyle}>4. Data Retention Periods</h2>

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
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Data Category</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Retention Period</th>
              <th style={{ ...cellStyle, color: C.text, fontWeight: 600 }}>Legal Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellStyle}>Account data</td>
              <td style={cellStyle}>Duration of use + 30 days after deletion</td>
              <td style={cellStyle}>Contract performance</td>
            </tr>
            <tr>
              <td style={cellStyle}>Content and projects</td>
              <td style={cellStyle}>Duration of use + 30 days after deletion</td>
              <td style={cellStyle}>Contract performance</td>
            </tr>
            <tr>
              <td style={cellStyle}>Payment records</td>
              <td style={cellStyle}>Up to 7 years after transaction</td>
              <td style={cellStyle}>Legal requirement</td>
            </tr>
            <tr>
              <td style={cellStyle}>Analytics data</td>
              <td style={cellStyle}>Up to 26 months</td>
              <td style={cellStyle}>Consent</td>
            </tr>
            <tr>
              <td style={cellStyle}>Security logs</td>
              <td style={cellStyle}>Up to 12 months</td>
              <td style={cellStyle}>Legitimate interest</td>
            </tr>
            <tr>
              <td style={cellStyle}>Backups</td>
              <td style={cellStyle}>Up to 90 days</td>
              <td style={cellStyle}>Legitimate interest</td>
            </tr>
          </tbody>
        </table>

        <p style={paraStyle}>
          Upon expiration of these retention periods, data is automatically deleted or anonymized.
        </p>
      </div>

      {/* 5. Security Measures */}
      <div style={sectionStyle}>
        <h2 id="security-measures" style={headingStyle}>5. Technical and Organizational Security Measures</h2>
        <p style={paraStyle}>
          The Processor implements the following measures to ensure the security of personal data:
        </p>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Technical measures:</p>
        <ul style={listStyle}>
          <li>Data encryption in transit (TLS 1.3) and at rest (AES-256)</li>
          <li>OAuth 2.0 authentication (no passwords stored)</li>
          <li>Protection against CSRF, XSS, and SQL injection attacks</li>
          <li>Firewall and IP-based access restrictions</li>
          <li>Automated backups</li>
          <li>API rate limiting</li>
          <li>VPN for internal communications (WireGuard)</li>
        </ul>

        <p style={{ ...paraStyle, fontWeight: 600, color: C.text }}>Organizational measures:</p>
        <ul style={listStyle}>
          <li>Principle of least privilege</li>
          <li>Regular security and dependency audits</li>
          <li>24/7 infrastructure monitoring</li>
          <li>Security incident response procedures</li>
          <li>Staff training on data protection</li>
        </ul>
      </div>

      {/* 6. Data Subject Rights */}
      <div style={sectionStyle}>
        <h2 id="data-subject-rights" style={headingStyle}>6. Data Subject Rights</h2>
        <p style={paraStyle}>
          The Processor assists the Controller in ensuring the following data subject rights
          in accordance with GDPR:
        </p>
        <ul style={listStyle}>
          <li><strong style={{ color: C.text }}>Right of access (Art. 15 GDPR)</strong> — provision of a copy of personal data</li>
          <li><strong style={{ color: C.text }}>Right to rectification (Art. 16 GDPR)</strong> — correction of inaccurate data</li>
          <li><strong style={{ color: C.text }}>Right to erasure (Art. 17 GDPR)</strong> — deletion of personal data</li>
          <li><strong style={{ color: C.text }}>Right to restriction (Art. 18 GDPR)</strong> — restriction of processing</li>
          <li><strong style={{ color: C.text }}>Right to data portability (Art. 20 GDPR)</strong> — export of data in a machine-readable format</li>
          <li><strong style={{ color: C.text }}>Right to object (Art. 21 GDPR)</strong> — objection to processing</li>
        </ul>
        <p style={paraStyle}>
          The Processor commits to responding to data subject requests within 30 days
          and assisting the Controller in fulfilling its obligations.
        </p>
      </div>

      {/* 7. Incident Notification */}
      <div style={sectionStyle}>
        <h2 id="incidents" style={headingStyle}>7. Incident Notification</h2>
        <p style={paraStyle}>
          In the event of a security incident affecting personal data, the Processor commits to:
        </p>
        <ul style={listStyle}>
          <li>Notify the Controller within 72 hours of discovering the incident</li>
          <li>Provide a description of the incident, affected data categories, and approximate number of data subjects</li>
          <li>Describe potential consequences and measures taken to mitigate them</li>
          <li>Cooperate with the Controller in notifying the supervisory authority</li>
        </ul>
      </div>

      {/* 8. Audit */}
      <div style={sectionStyle}>
        <h2 id="audit" style={headingStyle}>8. Right to Audit</h2>
        <p style={paraStyle}>
          The Controller has the right to audit compliance with this Agreement. The Processor
          commits to providing the necessary information and access for conducting an audit,
          subject to at least 30 days prior notice.
        </p>
      </div>

      {/* 9. Contact */}
      <div style={sectionStyle}>
        <h2 id="contact" style={headingStyle}>9. Contact Information</h2>
        <p style={paraStyle}>
          For all questions related to data processing and this Agreement:
        </p>
        <p style={paraStyle}>
          Email:{' '}
          <a href="mailto:dpa@tubeforge.co" style={{ color: C.accent }}>
            dpa@tubeforge.co
          </a>
        </p>
        <p style={paraStyle}>
          Data Protection Officer:{' '}
          <a href="mailto:privacy@tubeforge.co" style={{ color: C.accent }}>
            privacy@tubeforge.co
          </a>
        </p>
      </div>
    </div>
  );
}
