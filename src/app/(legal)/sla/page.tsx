'use client';

import { useThemeStore } from '@/stores/useThemeStore';

export default function SlaPage() {
  const C = useThemeStore((s) => s.theme);

  const sectionStyle: React.CSSProperties = { marginBottom: 36 };
  const headingStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginBottom: 12, color: C.text };
  const paraStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.8, color: C.sub, marginBottom: 12 };
  const listStyle: React.CSSProperties = { fontSize: 14, lineHeight: 2, color: C.sub, paddingLeft: 24, margin: '8px 0 12px' };

  const planCardStyle = (gradient: string): React.CSSProperties => ({
    padding: '24px',
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    background: C.bg,
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
      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-.02em',
          marginBottom: 8,
        }}
      >
        {'\u0421\u043E\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u043E\u0431 \u0443\u0440\u043E\u0432\u043D\u0435 \u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043D\u0438\u044F (SLA)'}
      </h1>
      <p style={{ fontSize: 13, color: C.dim, marginBottom: 16 }}>
        {'\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435: 20 \u043C\u0430\u0440\u0442\u0430 2026'}
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: C.sub, marginBottom: 40 }}>
        {'\u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u0435 \u0421\u043E\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u043E\u0431 \u0443\u0440\u043E\u0432\u043D\u0435 \u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043D\u0438\u044F (Service Level Agreement, SLA) \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0435\u0442 \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u0438 \u0441\u0435\u0440\u0432\u0438\u0441\u0430 TubeForge \u0438 \u043A\u043E\u043C\u043F\u0435\u043D\u0441\u0430\u0446\u0438\u0438 \u0432 \u0441\u043B\u0443\u0447\u0430\u0435 \u0438\u0445 \u043D\u0430\u0440\u0443\u0448\u0435\u043D\u0438\u044F.'}
      </p>

      {/* 1. Гарантии доступности по планам */}
      <div style={sectionStyle}>
        <h2 id="uptime" style={headingStyle}>
          {'1. \u0413\u0430\u0440\u0430\u043D\u0442\u0438\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u0438'}
        </h2>
        <p style={paraStyle}>
          {'TubeForge \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0440\u0443\u0435\u0442 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0443\u0440\u043E\u0432\u043D\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u0438 \u0432 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0438 \u043E\u0442 \u0432\u0430\u0448\u0435\u0433\u043E \u043F\u043B\u0430\u043D\u0430 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0438:'}
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
            <div style={{ fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: '-.03em', marginBottom: 8 }}>
              99.9%
            </div>
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
              {'Uptime \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u044F'}
            </div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>
              {'\u2248 8.76 \u0447\u0430\u0441\u043E\u0432 \u043F\u0440\u043E\u0441\u0442\u043E\u044F / \u0433\u043E\u0434'}
            </div>
          </div>

          {/* Studio */}
          <div style={planCardStyle('linear-gradient(135deg, #8b5cf6, #a78bfa)')}>
            <div style={planStripStyle('linear-gradient(135deg, #8b5cf6, #a78bfa)')} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
              Studio
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: '-.03em', marginBottom: 8 }}>
              99.95%
            </div>
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
              {'Uptime \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u044F'}
            </div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>
              {'\u2248 4.38 \u0447\u0430\u0441\u043E\u0432 \u043F\u0440\u043E\u0441\u0442\u043E\u044F / \u0433\u043E\u0434'}
            </div>
          </div>

          {/* Enterprise */}
          <div style={planCardStyle('linear-gradient(135deg, #f59e0b, #fbbf24)')}>
            <div style={planStripStyle('linear-gradient(135deg, #f59e0b, #fbbf24)')} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
              Enterprise
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: '-.03em', marginBottom: 8 }}>
              99.99%
            </div>
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
              {'Uptime \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u044F + \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u0430\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430'}
            </div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 8 }}>
              {'\u2248 52.6 \u043C\u0438\u043D\u0443\u0442 \u043F\u0440\u043E\u0441\u0442\u043E\u044F / \u0433\u043E\u0434'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Определения */}
      <div style={sectionStyle}>
        <h2 id="definitions" style={headingStyle}>
          {'2. \u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u044F'}
        </h2>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>{'\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C (Uptime)'}</strong>
            {' \u2014 \u043F\u0440\u043E\u0446\u0435\u043D\u0442 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u043D\u043E\u0433\u043E \u043C\u0435\u0441\u044F\u0446\u0430, \u043A\u043E\u0433\u0434\u0430 \u0441\u0435\u0440\u0432\u0438\u0441 TubeForge \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0438 \u0444\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0438\u0440\u0443\u0435\u0442 \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u043E.'}
          </li>
          <li>
            <strong style={{ color: C.text }}>{'\u041F\u0440\u043E\u0441\u0442\u043E\u0439 (Downtime)'}</strong>
            {' \u2014 \u043F\u0435\u0440\u0438\u043E\u0434, \u043A\u043E\u0433\u0434\u0430 \u043E\u0441\u043D\u043E\u0432\u043D\u044B\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u0438 \u0441\u0435\u0440\u0432\u0438\u0441\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B. \u041D\u0435 \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u043F\u043B\u0430\u043D\u043E\u0432\u043E\u0435 \u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043D\u0438\u0435.'}
          </li>
          <li>
            <strong style={{ color: C.text }}>{'\u041F\u043B\u0430\u043D\u043E\u0432\u043E\u0435 \u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043D\u0438\u0435'}</strong>
            {' \u2014 \u0437\u0430\u0440\u0430\u043D\u0435\u0435 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u043D\u044B\u0435 \u043F\u0435\u0440\u0438\u043E\u0434\u044B \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043D\u0438\u044F (\u043C\u0438\u043D\u0438\u043C\u0443\u043C 48 \u0447\u0430\u0441\u043E\u0432 \u0434\u043E \u043D\u0430\u0447\u0430\u043B\u0430).'}
          </li>
        </ul>
      </div>

      {/* 3. Кредитная система */}
      <div style={sectionStyle}>
        <h2 id="credits" style={headingStyle}>
          {'3. \u041A\u043E\u043C\u043F\u0435\u043D\u0441\u0430\u0446\u0438\u044F (SLA \u043A\u0440\u0435\u0434\u0438\u0442\u044B)'}
        </h2>
        <p style={paraStyle}>
          {'\u0415\u0441\u043B\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C \u0441\u0435\u0440\u0432\u0438\u0441\u0430 \u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F \u043D\u0438\u0436\u0435 \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0433\u043E \u0443\u0440\u043E\u0432\u043D\u044F, \u0432\u044B \u043F\u043E\u043B\u0443\u0447\u0430\u0435\u0442\u0435 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043A\u0440\u0435\u0434\u0438\u0442 \u043D\u0430 \u0441\u0447\u0451\u0442:'}
        </p>

        <div style={{
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: '12px 16px',
            background: C.bg,
            borderBottom: `1px solid ${C.border}`,
            fontSize: 12,
            fontWeight: 700,
            color: C.dim,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}>
            <div>{'\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C \u0437\u0430 \u043C\u0435\u0441\u044F\u0446'}</div>
            <div>{'\u041A\u0440\u0435\u0434\u0438\u0442'}</div>
          </div>
          {[
            { uptime: '99.0% \u2013 99.9%', credit: '10% \u043E\u0442 \u043C\u0435\u0441\u044F\u0447\u043D\u043E\u0439 \u043E\u043F\u043B\u0430\u0442\u044B' },
            { uptime: '95.0% \u2013 99.0%', credit: '25% \u043E\u0442 \u043C\u0435\u0441\u044F\u0447\u043D\u043E\u0439 \u043E\u043F\u043B\u0430\u0442\u044B' },
            { uptime: '\u041D\u0438\u0436\u0435 95.0%', credit: '50% \u043E\u0442 \u043C\u0435\u0441\u044F\u0447\u043D\u043E\u0439 \u043E\u043F\u043B\u0430\u0442\u044B' },
          ].map((row, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              padding: '12px 16px',
              borderBottom: idx < 2 ? `1px solid ${C.border}` : 'none',
              fontSize: 14,
              color: C.sub,
            }}>
              <div style={{ fontWeight: 600, color: C.text }}>{row.uptime}</div>
              <div>{row.credit}</div>
            </div>
          ))}
        </div>

        <p style={paraStyle}>
          {'\u041A\u0440\u0435\u0434\u0438\u0442\u044B \u043D\u0430\u0447\u0438\u0441\u043B\u044F\u044E\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 5 \u0440\u0430\u0431\u043E\u0447\u0438\u0445 \u0434\u043D\u0435\u0439 \u043F\u043E\u0441\u043B\u0435 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u043D\u043E\u0433\u043E \u043C\u0435\u0441\u044F\u0446\u0430 \u0438 \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F \u043A \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u043C\u0443 \u043F\u043B\u0430\u0442\u0435\u0436\u0443. \u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u0440\u0435\u0434\u0438\u0442 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0442\u044C 50% \u043C\u0435\u0441\u044F\u0447\u043D\u043E\u0439 \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u0438 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0438.'}
        </p>
      </div>

      {/* 4. Коммуникация об инцидентах */}
      <div style={sectionStyle}>
        <h2 id="incidents" style={headingStyle}>
          {'4. \u041A\u043E\u043C\u043C\u0443\u043D\u0438\u043A\u0430\u0446\u0438\u044F \u043E\u0431 \u0438\u043D\u0446\u0438\u0434\u0435\u043D\u0442\u0430\u0445'}
        </h2>
        <p style={paraStyle}>
          {'\u0412 \u0441\u043B\u0443\u0447\u0430\u0435 \u0438\u043D\u0446\u0438\u0434\u0435\u043D\u0442\u0430, \u0432\u043B\u0438\u044F\u044E\u0449\u0435\u0433\u043E \u043D\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C \u0441\u0435\u0440\u0432\u0438\u0441\u0430, \u043C\u044B \u043E\u0431\u044F\u0437\u0443\u0435\u043C\u0441\u044F:'}
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={{ color: C.text }}>{'\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435:'}</strong>
            {' \u043E\u043F\u043E\u0432\u0435\u0449\u0435\u043D\u0438\u0435 \u043F\u043E email \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 30 \u043C\u0438\u043D\u0443\u0442 \u043F\u043E\u0441\u043B\u0435 \u043E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u0438\u044F \u0438\u043D\u0446\u0438\u0434\u0435\u043D\u0442\u0430'}
          </li>
          <li>
            <strong style={{ color: C.text }}>{'\u0421\u0442\u0430\u0442\u0443\u0441-\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430:'}</strong>
            {' \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u043A\u0430\u0436\u0434\u044B\u0435 30 \u043C\u0438\u043D\u0443\u0442 \u0434\u043E \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F'}
          </li>
          <li>
            <strong style={{ color: C.text }}>{'Post-mortem:'}</strong>
            {' \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u044B\u0439 \u043E\u0442\u0447\u0451\u0442 \u043E \u043F\u0440\u0438\u0447\u0438\u043D\u0430\u0445 \u0438 \u043C\u0435\u0440\u0430\u0445 \u043F\u0440\u0435\u0434\u043E\u0442\u0432\u0440\u0430\u0449\u0435\u043D\u0438\u044F \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 5 \u0440\u0430\u0431\u043E\u0447\u0438\u0445 \u0434\u043D\u0435\u0439'}
          </li>
        </ul>
      </div>

      {/* 5. Время реакции на поддержку */}
      <div style={sectionStyle}>
        <h2 id="response" style={headingStyle}>
          {'5. \u0412\u0440\u0435\u043C\u044F \u0440\u0435\u0430\u043A\u0446\u0438\u0438 \u043D\u0430 \u043E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u044F'}
        </h2>

        <div style={{
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            padding: '12px 16px',
            background: C.bg,
            borderBottom: `1px solid ${C.border}`,
            fontSize: 12,
            fontWeight: 700,
            color: C.dim,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}>
            <div>{'\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442'}</div>
            <div>Pro / Studio</div>
            <div>Enterprise</div>
          </div>
          {[
            { priority: '\u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 (P1)', proStudio: '< 1 \u0447\u0430\u0441\u0430', enterprise: '< 15 \u043C\u0438\u043D\u0443\u0442' },
            { priority: '\u0412\u044B\u0441\u043E\u043A\u0438\u0439 (P2)', proStudio: '< 4 \u0447\u0430\u0441\u043E\u0432', enterprise: '< 1 \u0447\u0430\u0441\u0430' },
            { priority: '\u0421\u0440\u0435\u0434\u043D\u0438\u0439 (P3)', proStudio: '< 24 \u0447\u0430\u0441\u043E\u0432', enterprise: '< 4 \u0447\u0430\u0441\u043E\u0432' },
            { priority: '\u041D\u0438\u0437\u043A\u0438\u0439 (P4)', proStudio: '< 72 \u0447\u0430\u0441\u043E\u0432', enterprise: '< 24 \u0447\u0430\u0441\u043E\u0432' },
          ].map((row, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              padding: '12px 16px',
              borderBottom: idx < 3 ? `1px solid ${C.border}` : 'none',
              fontSize: 14,
              color: C.sub,
            }}>
              <div style={{ fontWeight: 600, color: C.text }}>{row.priority}</div>
              <div>{row.proStudio}</div>
              <div>{row.enterprise}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Исключения */}
      <div style={sectionStyle}>
        <h2 id="exclusions" style={headingStyle}>
          {'6. \u0418\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F'}
        </h2>
        <p style={paraStyle}>
          {'SLA \u043D\u0435 \u0440\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F \u043D\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0441\u043B\u0443\u0447\u0430\u0438:'}
        </p>
        <ul style={listStyle}>
          <li>{'\u041F\u043B\u0430\u043D\u043E\u0432\u043E\u0435 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043D\u0438\u0435 (\u0441 \u043F\u0440\u0435\u0434\u0432\u0430\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u043C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435\u043C \u0437\u0430 48\u0447)'}</li>
          <li>{'\u041E\u0431\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u0430 \u043D\u0435\u043F\u0440\u0435\u043E\u0434\u043E\u043B\u0438\u043C\u043E\u0439 \u0441\u0438\u043B\u044B (force majeure)'}</li>
          <li>{'\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u044B \u043D\u0430 \u0441\u0442\u043E\u0440\u043E\u043D\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0430 (\u0441\u0435\u0442\u044C, \u0431\u0440\u0430\u0443\u0437\u0435\u0440, \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E)'}</li>
          <li>{'\u041D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C \u0441\u0442\u043E\u0440\u043E\u043D\u043D\u0438\u0445 \u0441\u0435\u0440\u0432\u0438\u0441\u043E\u0432 (YouTube API, Stripe \u0438 \u0434\u0440.)'}</li>
          <li>{'\u0417\u043B\u043E\u0443\u043F\u043E\u0442\u0440\u0435\u0431\u043B\u0435\u043D\u0438\u0435 \u0441\u0435\u0440\u0432\u0438\u0441\u043E\u043C \u0438\u043B\u0438 \u043D\u0430\u0440\u0443\u0448\u0435\u043D\u0438\u0435 \u0443\u0441\u043B\u043E\u0432\u0438\u0439 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F'}</li>
        </ul>
      </div>

      {/* 7. Контакты */}
      <div style={sectionStyle}>
        <h2 id="contact" style={headingStyle}>
          {'7. \u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B'}
        </h2>
        <p style={paraStyle}>
          {'\u041F\u043E \u0432\u043E\u043F\u0440\u043E\u0441\u0430\u043C, \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u043C \u0441 SLA, \u043E\u0431\u0440\u0430\u0449\u0430\u0439\u0442\u0435\u0441\u044C:'}
        </p>
        <p style={paraStyle}>
          Email:{' '}
          <a href="mailto:sla@tubeforge.co" style={{ color: C.accent, fontWeight: 600 }}>
            sla@tubeforge.co
          </a>
        </p>
        <p style={{ ...paraStyle, fontStyle: 'italic', marginTop: 24 }}>
          {'\u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u0435 \u0441\u043E\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0447\u0430\u0441\u0442\u044C\u044E \u041E\u0431\u0449\u0438\u0445 \u0443\u0441\u043B\u043E\u0432\u0438\u0439 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F \u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u043B\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439 \u0441 \u043F\u043B\u0430\u0442\u043D\u044B\u043C\u0438 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0430\u043C\u0438 (Pro, Studio, Enterprise).'}
        </p>
      </div>
    </div>
  );
}
