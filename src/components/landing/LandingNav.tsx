'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // On non-landing pages, anchor links must point to /#section
  const [pathname, setPathname] = useState('/');
  useEffect(() => { setPathname(window.location.pathname); }, []);
  const anchor = (hash: string) => pathname === '/' ? hash : `/${hash}`;

  const navLinks = [
    { label: 'Features', href: anchor('#features') },
    { label: 'Tools', href: anchor('#tools') },
    { label: 'Pricing', href: anchor('#pricing') },
    { label: 'Blog', href: '/blog' },
  ];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 48,
        background: scrolled ? 'rgba(10,10,10,0.85)' : 'rgba(10,10,10,0.6)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 24px',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: -0.3,
            }}
          >
            TF
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', letterSpacing: '-0.01em' }}>TubeForge</span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="desktop-nav">
          {navLinks.map((link) => {
            const isPage = link.href.startsWith('/');
            const Tag = isPage ? Link : 'a';
            return (
              <Tag
                key={link.href}
                href={link.href}
                style={{
                  textDecoration: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  fontWeight: 400,
                  transition: 'color 0.3s ease',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
              >
                {link.label}
              </Tag>
            );
          })}
        </nav>

        {/* Desktop auth */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            href="/login"
            style={{
              textDecoration: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: 400,
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="tf-cta-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#6366f1',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: 980,
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              border: 'none',
              boxShadow: '0 0 20px rgba(99,102,241,0.3)',
            }}
          >
            Start Free
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="mobile-menu-dropdown"
          style={{
            background: 'rgba(10,10,10,0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '16px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {navLinks.map((link) => {
            const isPage = link.href.startsWith('/');
            const Tag = isPage ? Link : 'a';
            return (
              <Tag
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 17, fontWeight: 400, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                {link.label}
              </Tag>
            );
          })}
          <div style={{ paddingTop: 12, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/login" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 17, fontWeight: 400, padding: '10px 0' }}>Log In</Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: '#6366f1',
                color: '#fff',
                fontSize: 17,
                fontWeight: 500,
                padding: '14px 24px',
                borderRadius: 12,
                textDecoration: 'none',
                border: 'none',
                boxShadow: '0 0 20px rgba(99,102,241,0.3)',
              }}
            >
              Start Free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
