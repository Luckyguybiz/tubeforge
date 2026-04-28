import { Card } from "@/components/ui/card";

export default function SecurityPage() {
  const badges = [
    { icon: "🔒", label: "HTTPS Everywhere" },
    { icon: "🔐", label: "OAuth 2.0" },
    { icon: "🎯", label: "PCI-DSS Level 1" },
    { icon: "🇪🇺", label: "EU Data Residency" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-2">Security</h1>
      <p className="text-xs text-muted-foreground mb-4">Last updated: March 20, 2026</p>
      <p className="text-base leading-relaxed text-muted-foreground mb-10">
        Protecting your data is our priority. We apply a multi-layered approach to security,
        using industry best practices and standards.
      </p>

      <div className="mb-10 flex flex-wrap gap-2">
        {badges.map((b) => (
          <Card
            key={b.label}
            className="inline-flex flex-row items-center gap-2 px-4 py-3 text-sm font-medium"
          >
            <span aria-hidden className="text-xl leading-none">
              {b.icon}
            </span>
            {b.label}
          </Card>
        ))}
      </div>

      <Section id="encryption" title="1. Data Encryption">
        <p>All data is protected by encryption at every level:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>
            <strong className="text-foreground font-semibold">In transit:</strong> all traffic between your
            browser and TubeForge servers is encrypted using TLS 1.3. We enforce HTTPS
            on all pages and APIs without exception.
          </li>
          <li>
            <strong className="text-foreground font-semibold">At rest:</strong> all data in the database
            and file storage is encrypted using AES-256. Backups are also stored in encrypted form.
          </li>
        </ul>
      </Section>

      <Section id="authentication" title="2. Authentication">
        <p>TubeForge uses Google OAuth 2.0 for user authentication. This means:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>
            We <strong className="text-foreground font-semibold">do not store passwords</strong> —
            authentication is delegated to Google
          </li>
          <li>Standard OAuth 2.0 protocol with PKCE is used</li>
          <li>Session tokens are stored in httpOnly cookies with Secure and SameSite flags</li>
          <li>CSRF protection via csrf tokens</li>
          <li>Automatic logout for inactive sessions</li>
        </ul>
      </Section>

      <Section id="payments" title="3. Payment Security">
        <p>
          Payment processing is fully delegated to{" "}
          <strong className="text-foreground font-semibold">Stripe</strong> — a world-leading payment
          platform with{" "}
          <strong className="text-foreground font-semibold">PCI-DSS Level 1</strong> certification
          (the highest level of security in the payments industry).
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Credit card numbers never pass through our servers</li>
          <li>Payment forms are rendered via secure Stripe iframes</li>
          <li>We only store the Stripe Customer ID and Subscription ID for account management</li>
          <li>Stripe provides fraud protection through Stripe Radar</li>
        </ul>
      </Section>

      <Section id="data-residency" title="4. Data Residency (EU)">
        <p>All TubeForge data is stored on servers physically located in the European Union:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Primary application servers — EU (OVH, France)</li>
          <li>Database — EU</li>
          <li>Backups — EU</li>
          <li>File storage — EU</li>
        </ul>
        <p>
          EU data residency ensures compliance with GDPR and other European data protection
          regulations.
        </p>
      </Section>

      <Section id="audits" title="5. Security Audits">
        <p>We conduct regular security assessments:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Regular vulnerability scanning (automated and manual)</li>
          <li>Dependency and library audits for known vulnerabilities</li>
          <li>24/7 infrastructure security monitoring</li>
          <li>Automated security patch updates</li>
        </ul>
      </Section>

      <Section id="soc2" title="6. SOC 2 Type II">
        <p>
          TubeForge is in the process of preparing for SOC 2 Type II certification, which
          verifies compliance with the following principles:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>
            <strong className="text-foreground font-semibold">Security</strong> — protection against
            unauthorized access
          </li>
          <li>
            <strong className="text-foreground font-semibold">Availability</strong> — service availability
          </li>
          <li>
            <strong className="text-foreground font-semibold">Confidentiality</strong> — data confidentiality
          </li>
          <li>
            <strong className="text-foreground font-semibold">Processing Integrity</strong> — processing integrity
          </li>
          <li>
            <strong className="text-foreground font-semibold">Privacy</strong> — personal data protection
          </li>
        </ul>
        <p className="italic">Status: certification preparation (in progress).</p>
      </Section>

      <Section id="infrastructure" title="7. Infrastructure Security">
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Firewall and IP-based access restrictions</li>
          <li>SSH authentication by keys only (passwords disabled)</li>
          <li>VPN for internal service communications (WireGuard)</li>
          <li>Automated database backups</li>
          <li>API rate limiting for DDoS protection</li>
          <li>HTTP security headers (HSTS, CSP, X-Frame-Options)</li>
        </ul>
      </Section>

      <Section id="disclosure" title="8. Responsible Vulnerability Disclosure">
        <p>
          We value the community&apos;s help in ensuring TubeForge&apos;s security. If you discover
          a security vulnerability, please report it to us:
        </p>
        <p>
          Email:{" "}
          <a
            href="mailto:security@tubeforge.co"
            className="text-brand-500 underline-offset-4 hover:underline"
          >
            security@tubeforge.co
          </a>
        </p>
        <p>We ask that you:</p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Do not publicly disclose the vulnerability until it is resolved</li>
          <li>Do not exploit the vulnerability to access other users&apos; data</li>
          <li>Provide sufficient information to reproduce the issue</li>
        </ul>
        <p>
          We commit to acknowledging receipt of your report within 48 hours and providing
          a status update within 7 business days.
        </p>
      </Section>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-9 [&>p]:text-sm [&>p]:leading-relaxed [&>p]:text-muted-foreground [&>p]:mb-3 last:[&>p]:mb-0">
      <h2 className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">{title}</h2>
      {children}
    </section>
  );
}
