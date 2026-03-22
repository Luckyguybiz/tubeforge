'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

const WHITE = '#ffffff';

const primaryBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  textDecoration: 'none',
  color: WHITE,
  fontSize: 17,
  fontWeight: 500,
  padding: '14px 36px',
  borderRadius: 50,
  background: '#6366f1',
  boxShadow: '0 0 24px rgba(99,102,241,0.35)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const primaryHoverIn = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.boxShadow = '0 0 32px rgba(99,102,241,0.5)';
};
const primaryHoverOut = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.boxShadow = '0 0 24px rgba(99,102,241,0.35)';
};

interface NavLink {
  label: string;
  href: string;
}

interface LandingHeaderProps {
  navLinks: NavLink[];
  lightningIcon: ReactNode;
}

export function LandingHeader({ navLinks, lightningIcon }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(10,10,10,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0a0a0a',
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: -0.5,
            }}
          >
            TF
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: WHITE, letterSpacing: -0.5 }}>TubeForge</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = WHITE; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/login" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: 500, padding: '8px 16px', transition: 'color 0.2s' }}>
            Log In
          </Link>
          <Link
            href="/register"
            style={{ ...primaryBtnStyle, fontSize: 15, padding: '10px 24px' }}
            onMouseEnter={primaryHoverIn}
            onMouseLeave={primaryHoverOut}
          >
            {lightningIcon} Start Free
          </Link>
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Open menu"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round">
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu-dropdown" style={{ background: 'rgba(10,10,10,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 500, padding: '8px 0' }}>
              {link.label}
            </a>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/login" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 500, padding: '8px 0' }}>Log In</Link>
            <Link href="/register" style={{ ...primaryBtnStyle, fontSize: 16, padding: '12px 24px', justifyContent: 'center' }}>
              {lightningIcon} Start Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
