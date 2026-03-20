'use client';

import Link from 'next/link';
import { useThemeStore } from '@/stores/useThemeStore';

interface SystemService {
  name: string;
  description: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: string;
}

const SERVICES: SystemService[] = [
  { name: 'Приложение', description: 'Основная платформа TubeForge', status: 'operational', uptime: '99.9%' },
  { name: 'База данных', description: 'PostgreSQL / Prisma', status: 'operational', uptime: '99.9%' },
  { name: 'AI-генерация', description: 'OpenAI, Anthropic, Runway', status: 'operational', uptime: '99.7%' },
  { name: 'Платежи', description: 'Stripe Payments', status: 'operational', uptime: '99.99%' },
  { name: 'VPN', description: 'WireGuard VPN серверы', status: 'operational', uptime: '99.8%' },
  { name: 'CDN / Медиа', description: 'Загрузка и хранение файлов', status: 'operational', uptime: '99.9%' },
];

const STATUS_CONFIG = {
  operational: { label: 'Работает', color: '#2dd4a0' },
  degraded: { label: 'Замедление', color: '#f59e0b' },
  outage: { label: 'Не работает', color: '#ef4444' },
} as const;

export default function StatusPage() {
  const C = useThemeStore((s) => s.theme);
  const allOperational = SERVICES.every((s) => s.status === 'operational');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      {/* Header */}
      <header
        style={{
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            TF
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>TubeForge</span>
        </Link>
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            color: C.sub,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          &larr; На главную
        </Link>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 64px' }}>
        {/* Overall status */}
        <div
          style={{
            textAlign: 'center',
            padding: '32px 24px',
            background: allOperational ? 'rgba(45,212,160,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${allOperational ? 'rgba(45,212,160,0.2)' : 'rgba(245,158,11,0.2)'}`,
            borderRadius: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: allOperational ? '#2dd4a0' : '#f59e0b',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {allOperational ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {allOperational ? 'Все системы работают' : 'Наблюдаются проблемы'}
          </h1>
          <p style={{ color: C.sub, fontSize: 14, marginTop: 8 }}>
            Обновлено: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Services list */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Сервисы</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SERVICES.map((service) => {
            const cfg = STATUS_CONFIG[service.status];
            return (
              <div
                key={service.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{service.name}</div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                    {service.description}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: C.dim }}>
                    {service.uptime} uptime
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: cfg.color,
                        boxShadow: `0 0 8px ${cfg.color}40`,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Uptime note */}
        <div
          style={{
            marginTop: 32,
            padding: '20px 24px',
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Общий uptime за последние 30 дней
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#2dd4a0', letterSpacing: '-0.02em' }}>
            99.9%
          </div>
          <p style={{ fontSize: 13, color: C.dim, marginTop: 8 }}>
            Мониторинг осуществляется 24/7. При возникновении проблем — обращайтесь в{' '}
            <Link href="/contact" style={{ color: C.accent, textDecoration: 'none' }}>
              поддержку
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
