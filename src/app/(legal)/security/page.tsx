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
        Security
      </h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 16 }}>
        Last updated: March 20, 2026
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: C.sub, marginBottom: 40 }}>
        Protecting your data is our priority. We apply a multi-layered approach to security,
        using industry best practices and standards.
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

      {/* 1. Encryption */}
      <div style={sectionStyle}>
        <h2 id="encryption" style={headingStyle}>1. Data Encryption</h2>
        <p style={paraStyle}>
          All data is protected by encryption at every level:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>In transit:</strong> all traffic between your
            browser and TubeForge servers is encrypted using TLS 1.3. We enforce HTTPS
            on all pages and APIs without exception.
          </li>
          <li>
            <strong style={{ color: C.text }}>At rest:</strong> all data in the database
            and file storage is encrypted using AES-256. Backups are also
            stored in encrypted form.
          </li>
        </ul>
      </div>

      {/* 2. Authentication */}
      <div style={sectionStyle}>
        <h2 id="authentication" style={headingStyle}>2. Authentication</h2>
        <p style={paraStyle}>
          TubeForge uses Google OAuth 2.0 for user authentication. This means:
        </p>
        <ul style={listStyle}>
          <li>We <strong style={{ color: C.text }}>do not store passwords</strong> — authentication is delegated to Google</li>
          <li>Standard OAuth 2.0 protocol with PKCE is used</li>
          <li>Session tokens are stored in httpOnly cookies with Secure and SameSite flags</li>
          <li>CSRF protection via csrf tokens</li>
          <li>Automatic logout for inactive sessions</li>
        </ul>
      </div>

      {/* 3. Payments */}
      <div style={sectionStyle}>
        <h2 id="payments" style={headingStyle}>3. Payment Security</h2>
        <p style={paraStyle}>
          Payment processing is fully delegated to <strong style={{ color: C.text }}>Stripe</strong> —
          a world-leading payment platform with{' '}
          <strong style={{ color: C.text }}>PCI-DSS Level 1</strong> certification (the highest level of security
          in the payments industry).
        </p>
        <ul style={listStyle}>
          <li>Credit card numbers never pass through our servers</li>
          <li>Payment forms are rendered via secure Stripe iframes</li>
          <li>We only store the Stripe Customer ID and Subscription ID for account management</li>
          <li>Stripe provides fraud protection through Stripe Radar</li>
        </ul>
      </div>

      {/* 4. Data Residency */}
      <div style={sectionStyle}>
        <h2 id="data-residency" style={headingStyle}>4. Data Residency (EU)</h2>
        <p style={paraStyle}>
          All TubeForge data is stored on servers physically located in the European Union:
        </p>
        <ul style={listStyle}>
          <li>Primary application servers — EU (OVH, France)</li>
          <li>Database — EU</li>
          <li>Backups — EU</li>
          <li>File storage — EU</li>
        </ul>
        <p style={paraStyle}>
          EU data residency ensures compliance with GDPR and other
          European data protection regulations.
        </p>
      </div>

      {/* 5. Security Audits */}
      <div style={sectionStyle}>
        <h2 id="audits" style={headingStyle}>5. Security Audits</h2>
        <p style={paraStyle}>
          We conduct regular security assessments:
        </p>
        <ul style={listStyle}>
          <li>Regular vulnerability scanning (automated and manual)</li>
          <li>Dependency and library audits for known vulnerabilities</li>
          <li>24/7 infrastructure security monitoring</li>
          <li>Automated security patch updates</li>
        </ul>
      </div>

      {/* 6. SOC 2 */}
      <div style={sectionStyle}>
        <h2 id="soc2" style={headingStyle}>6. SOC 2 Type II</h2>
        <p style={paraStyle}>
          TubeForge is in the process of preparing for SOC 2 Type II certification, which
          verifies compliance with the following principles:
        </p>
        <ul style={listStyle}>
          <li><strong style={{ color: C.text }}>Security</strong> — protection against unauthorized access</li>
          <li><strong style={{ color: C.text }}>Availability</strong> — service availability</li>
          <li><strong style={{ color: C.text }}>Confidentiality</strong> — data confidentiality</li>
          <li><strong style={{ color: C.text }}>Processing Integrity</strong> — processing integrity</li>
          <li><strong style={{ color: C.text }}>Privacy</strong> — personal data protection</li>
        </ul>
        <p style={{ ...paraStyle, fontStyle: 'italic' }}>
          Status: certification preparation (in progress).
        </p>
      </div>

      {/* 7. Infrastructure */}
      <div style={sectionStyle}>
        <h2 id="infrastructure" style={headingStyle}>7. Infrastructure Security</h2>
        <ul style={listStyle}>
          <li>Firewall and IP-based access restrictions</li>
          <li>SSH authentication by keys only (passwords disabled)</li>
          <li>VPN for internal service communications (WireGuard)</li>
          <li>Automated database backups</li>
          <li>API rate limiting for DDoS protection</li>
          <li>HTTP security headers (HSTS, CSP, X-Frame-Options)</li>
        </ul>
      </div>

      {/* 8. Responsible Disclosure */}
      <div style={sectionStyle}>
        <h2 id="disclosure" style={headingStyle}>8. Responsible Vulnerability Disclosure</h2>
        <p style={paraStyle}>
          We value the community&apos;s help in ensuring TubeForge&apos;s security. If you discover
          a security vulnerability, please report it to us:
        </p>
        <p style={paraStyle}>
          Email:{' '}
          <a href="mailto:security@tubeforge.co" style={{ color: C.accent }}>
            security@tubeforge.co
          </a>
        </p>
        <p style={paraStyle}>
          We ask that you:
        </p>
        <ul style={listStyle}>
          <li>Do not publicly disclose the vulnerability until it is resolved</li>
          <li>Do not exploit the vulnerability to access other users&apos; data</li>
          <li>Provide sufficient information to reproduce the issue</li>
        </ul>
        <p style={paraStyle}>
          We commit to acknowledging receipt of your report within 48 hours and providing
          a status update within 7 business days.
        </p>
      </div>
    </div>
  );
}
