
export default function SlaPage() {


  const planCardStyle = (gradient: string): React.CSSProperties => ({
    padding: '24px',
    borderRadius: 16,
    border: `1px solid ${'var(--color-border)'}`,
    background: 'var(--color-background)',
    position: 'relative',
    overflow: 'hidden',
  });

  const planStripStyle = (gradient: string): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: gradient,
    opacity: 0.8,
  });

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-2">
        Service Level Agreement (SLA)
      </h1>
      <p className="text-xs text-muted-foreground mb-4">
        Last updated: March 20, 2026
      </p>
      <p className="text-base leading-relaxed text-muted-foreground mb-10">
        This Service Level Agreement (SLA) defines the availability guarantees for the
        TubeForge service and compensation in the event of their violation.
      </p>

      {/* 1. Availability Guarantees by Plan */}
      <div className="mb-9">
        <h2 id="uptime" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">
          1. Availability Guarantees
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          TubeForge guarantees the following availability levels depending on your subscription plan:
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
          gap: 16,
          marginBottom: 16,
        }}>
          {/* Pro */}
          <div style={planCardStyle('linear-gradient(135deg, #6366f1, #818cf8)')}>
            <div style={planStripStyle('linear-gradient(135deg, #6366f1, #818cf8)')} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
              Pro
            </div>
            <div className="text-4xl font-extrabold tracking-tighter text-foreground mb-2">
              99.9%
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              Uptime guarantee
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted-foreground)', marginTop: 8 }}>
              ~8.76 hours downtime / year
            </div>
          </div>

          {/* Studio */}
          <div style={planCardStyle('linear-gradient(135deg, #8b5cf6, #a78bfa)')}>
            <div style={planStripStyle('linear-gradient(135deg, #8b5cf6, #a78bfa)')} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
              Studio
            </div>
            <div className="text-4xl font-extrabold tracking-tighter text-foreground mb-2">
              99.95%
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              Uptime guarantee
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted-foreground)', marginTop: 8 }}>
              ~4.38 hours downtime / year
            </div>
          </div>

          {/* Enterprise */}
          <div style={planCardStyle('linear-gradient(135deg, #f59e0b, #fbbf24)')}>
            <div style={planStripStyle('linear-gradient(135deg, #f59e0b, #fbbf24)')} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
              Enterprise
            </div>
            <div className="text-4xl font-extrabold tracking-tighter text-foreground mb-2">
              99.99%
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              Uptime guarantee + dedicated support
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted-foreground)', marginTop: 8 }}>
              ~52.6 minutes downtime / year
            </div>
          </div>
        </div>
      </div>

      {/* 2. Definitions */}
      <div className="mb-9">
        <h2 id="definitions" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">
          2. Definitions
        </h2>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>
            <strong className="text-foreground font-semibold">Uptime</strong>
            {' — the percentage of time during a calendar month when the TubeForge service is available and functioning correctly.'}
          </li>
          <li>
            <strong className="text-foreground font-semibold">Downtime</strong>
            {' — a period when the core service functions are unavailable. Does not include scheduled maintenance.'}
          </li>
          <li>
            <strong className="text-foreground font-semibold">Scheduled Maintenance</strong>
            {' — pre-announced periods of technical maintenance (minimum 48 hours prior notice).'}
          </li>
        </ul>
      </div>

      {/* 3. Credit System */}
      <div className="mb-9">
        <h2 id="credits" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">
          3. Compensation (SLA Credits)
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          If service availability drops below the guaranteed level, you will receive an automatic credit to your account:
        </p>

        <div style={{
          borderRadius: 12,
          border: `1px solid ${'var(--color-border)'}`,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: '12px 16px',
            background: 'var(--color-background)',
            borderBottom: `1px solid ${'var(--color-border)'}`,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}>
            <div>Monthly Availability</div>
            <div>Credit</div>
          </div>
          {[
            { uptime: '99.0% \u2013 99.9%', credit: '10% of monthly payment' },
            { uptime: '95.0% \u2013 99.0%', credit: '25% of monthly payment' },
            { uptime: 'Below 95.0%', credit: '50% of monthly payment' },
          ].map((row, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              padding: '12px 16px',
              borderBottom: idx < 2 ? `1px solid ${'var(--color-border)'}` : 'none',
              fontSize: 14,
              color: 'var(--color-muted-foreground)',
            }}>
              <div className="font-semibold text-foreground">{row.uptime}</div>
              <div>{row.credit}</div>
            </div>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Credits are applied automatically within 5 business days after the end of the calendar month and are applied to the next payment. The maximum credit cannot exceed 50% of the monthly subscription cost.
        </p>
      </div>

      {/* 4. Incident Communication */}
      <div className="mb-9">
        <h2 id="incidents" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">
          4. Incident Communication
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          In the event of an incident affecting service availability, we commit to:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>
            <strong className="text-foreground font-semibold">Notification:</strong>
            {' email notification within 30 minutes of incident detection'}
          </li>
          <li>
            <strong className="text-foreground font-semibold">Status page:</strong>
            {' updates on the status page every 30 minutes until resolution'}
          </li>
          <li>
            <strong className="text-foreground font-semibold">Post-mortem:</strong>
            {' detailed report on causes and preventive measures within 5 business days'}
          </li>
        </ul>
      </div>

      {/* 5. Support Response Time */}
      <div className="mb-9">
        <h2 id="response" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">
          5. Support Response Time
        </h2>

        <div style={{
          borderRadius: 12,
          border: `1px solid ${'var(--color-border)'}`,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            padding: '12px 16px',
            background: 'var(--color-background)',
            borderBottom: `1px solid ${'var(--color-border)'}`,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}>
            <div>Priority</div>
            <div>Pro / Studio</div>
            <div>Enterprise</div>
          </div>
          {[
            { priority: 'Critical (P1)', proStudio: '< 1 hour', enterprise: '< 15 minutes' },
            { priority: 'High (P2)', proStudio: '< 4 hours', enterprise: '< 1 hour' },
            { priority: 'Medium (P3)', proStudio: '< 24 hours', enterprise: '< 4 hours' },
            { priority: 'Low (P4)', proStudio: '< 72 hours', enterprise: '< 24 hours' },
          ].map((row, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              padding: '12px 16px',
              borderBottom: idx < 3 ? `1px solid ${'var(--color-border)'}` : 'none',
              fontSize: 14,
              color: 'var(--color-muted-foreground)',
            }}>
              <div className="font-semibold text-foreground">{row.priority}</div>
              <div>{row.proStudio}</div>
              <div>{row.enterprise}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Exclusions */}
      <div className="mb-9">
        <h2 id="exclusions" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">
          6. Exclusions
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          The SLA does not apply to the following cases:
        </p>
        <ul className="text-sm leading-loose text-muted-foreground pl-6 my-3 list-disc">
          <li>Scheduled technical maintenance (with 48h prior notice)</li>
          <li>Force majeure circumstances</li>
          <li>Client-side issues (network, browser, device)</li>
          <li>Third-party service unavailability (YouTube API, Stripe, etc.)</li>
          <li>Service abuse or violation of terms of use</li>
        </ul>
      </div>

      {/* 7. Contact */}
      <div className="mb-9">
        <h2 id="contact" className="text-xl font-bold mb-3 tracking-tight scroll-mt-24">
          7. Contact
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          For SLA-related questions, please contact:
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Email:{' '}
          <a href="mailto:sla@tubeforge.co" style={{ color: 'var(--color-brand-500)', fontWeight: 600 }}>
            sla@tubeforge.co
          </a>
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground italic mt-6 mb-3">
          This agreement is part of the General Terms of Service and applies to users with paid subscriptions (Pro, Studio, Enterprise).
        </p>
      </div>
    </div>
  );
}
