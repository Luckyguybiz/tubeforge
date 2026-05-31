/**
 * TubeForge Design System — Apple-like premium primitives.
 *
 * SINGLE SOURCE OF TRUTH for layout width, spacing rhythm, and typography.
 * Every public page composes these instead of inline styles → unified visual
 * story (kills the "each page looks like a different site" problem).
 *
 * Principles (Apple-like / restrained premium):
 *  - One container width system (narrow 720 / default 980 / wide 1200)
 *  - Generous vertical rhythm (section padding clamp 72→128px)
 *  - Large, light, tightly-tracked headlines; airy body line-height
 *  - Color restraint: neutral-heavy, brand accent only on CTAs/eyebrows
 *  - All theme-aware via CSS vars (works light + dark)
 */
import React from 'react';
import Link from 'next/link';

type Div = React.HTMLAttributes<HTMLDivElement>;

const WIDTHS = { narrow: 720, default: 980, wide: 1200 } as const;

/** Container — the ONLY source of content width. */
export function Container({
  children,
  width = 'default',
  style,
  ...rest
}: Div & { width?: keyof typeof WIDTHS }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: WIDTHS[width],
        marginInline: 'auto',
        paddingInline: 'clamp(20px, 5vw, 24px)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Section — consistent vertical rhythm. `alt` = subtle elevated bg. */
export function Section({
  children,
  alt = false,
  tight = false,
  style,
  ...rest
}: Div & { alt?: boolean; tight?: boolean }) {
  return (
    <section
      style={{
        paddingBlock: tight ? 'clamp(48px, 8vw, 80px)' : 'clamp(72px, 12vw, 128px)',
        background: alt ? 'var(--bg-secondary)' : 'transparent',
        ...style,
      }}
      {...rest}
    >
      {children}
    </section>
  );
}

/** Eyebrow — small uppercase label above a headline. */
export function Eyebrow({ children, style, ...rest }: Div) {
  return (
    <p
      style={{
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--color-brand-500, #6366f1)',
        margin: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </p>
  );
}

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h1' | 'h2' | 'h3';
};

/** Display — hero-scale headline. */
export function Display({ children, as = 'h1', style, ...rest }: HeadingProps) {
  const Tag = as;
  return (
    <Tag
      style={{
        fontSize: 'clamp(40px, 6vw, 72px)',
        fontWeight: 600,
        letterSpacing: '-0.03em',
        lineHeight: 1.05,
        color: 'var(--fg-primary)',
        margin: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Headline — section-scale heading. */
export function Headline({ children, as = 'h2', style, ...rest }: HeadingProps) {
  const Tag = as;
  return (
    <Tag
      style={{
        fontSize: 'clamp(28px, 4vw, 44px)',
        fontWeight: 600,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        color: 'var(--fg-primary)',
        margin: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Lead — large intro paragraph under a headline. */
export function Lead({ children, style, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      style={{
        fontSize: 'clamp(18px, 2vw, 21px)',
        fontWeight: 400,
        lineHeight: 1.5,
        color: 'var(--fg-secondary)',
        margin: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </p>
  );
}

/** Body — standard paragraph. */
export function Body({ children, style, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      style={{
        fontSize: 17,
        fontWeight: 400,
        lineHeight: 1.6,
        color: 'var(--fg-secondary)',
        margin: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </p>
  );
}

/** Caption — small muted text. */
export function Caption({ children, style, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      style={{
        fontSize: 14,
        color: 'var(--fg-tertiary)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

/** CenteredHeader — eyebrow + headline + lead, centered, consistent spacing. */
export function CenteredHeader({
  eyebrow,
  headline,
  lead,
  as = 'h2',
}: {
  eyebrow?: React.ReactNode;
  headline: React.ReactNode;
  lead?: React.ReactNode;
  as?: 'h1' | 'h2';
}) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 720, marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {as === 'h1' ? <Display as="h1">{headline}</Display> : <Headline>{headline}</Headline>}
      {lead ? <Lead>{lead}</Lead> : null}
    </div>
  );
}

type CTAProps = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  style?: React.CSSProperties;
};

/** CTA — primary (filled) or secondary (ghost) button-link. Apple-pill shape. */
export function CTA({ href, children, variant = 'primary', style }: CTAProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    paddingInline: 28,
    borderRadius: 980,
    fontSize: 16,
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'transform .2s ease, opacity .2s ease, background .2s ease',
    whiteSpace: 'nowrap',
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--color-brand-500, #6366f1)',
      color: '#fff',
      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--fg-primary)',
      border: '1px solid var(--border-strong, rgba(128,128,128,0.25))',
    },
  };
  return (
    <Link href={href} className="tf-ds-cta" style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </Link>
  );
}

/** Card — restrained surface for grouped content (subtle border, generous padding). */
export function Card({ children, style, ...rest }: Div) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle, rgba(128,128,128,0.12))',
        borderRadius: 18,
        padding: 28,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
