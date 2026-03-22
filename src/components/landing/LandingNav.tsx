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

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Free Tools', href: '/free-tools' },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '#faq' },
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
        background: scrolled ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: scrolled ? '1px solid #e5e5ea' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          maxWidth: 980,
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
              background: '#1d1d1f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: -0.3,
            }}
          >
            TF
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.01em' }}>TubeForge</span>
        </Link>

        {/* Desktop nav — centered */}
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
                  color: '#1d1d1f',
                  fontSize: 12,
                  fontWeight: 400,
                  transition: 'color 0.3s ease',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0071e3'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#1d1d1f'; }}
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
              color: '#0071e3',
              fontSize: 12,
              fontWeight: 400,
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.72'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="tf-cta-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#0071e3',
              color: '#fff',
              fontSize: 12,
              fontWeight: 400,
              padding: '8px 16px',
              borderRadius: 980,
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              border: 'none',
            }}
          >
            Start Free
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round">
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
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid #e5e5ea',
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
                style={{ textDecoration: 'none', color: '#1d1d1f', fontSize: 17, fontWeight: 400, padding: '12px 0', borderBottom: '1px solid #e5e5ea' }}
              >
                {link.label}
              </Tag>
            );
          })}
          <div style={{ paddingTop: 12, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/login" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none', color: '#0071e3', fontSize: 17, fontWeight: 400, padding: '10px 0' }}>Log In</Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0071e3',
                color: '#fff',
                fontSize: 17,
                fontWeight: 400,
                padding: '14px 24px',
                borderRadius: 12,
                textDecoration: 'none',
                border: 'none',
              }}
            >
              Start Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
