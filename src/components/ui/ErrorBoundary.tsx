'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type FallbackRender = (props: { error: Error; reset: () => void }) => ReactNode;

interface Props {
  children: ReactNode;
  /**
   * Custom fallback UI rendered on error.
   * Can be a static ReactNode or a render function receiving the error and a reset callback.
   */
  fallback?: ReactNode | FallbackRender;
  /** Optional label shown in the default fallback. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * React error boundary.
 * Wrap any subtree to catch render errors without crashing the whole page.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * <ErrorBoundary fallback={({ error, reset }) => <div onClick={reset}>{error.message}</div>}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    } else {
      console.error('[ErrorBoundary]', error.message);
    }
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (error) {
      const { fallback, label } = this.props;

      // Render-prop fallback
      if (typeof fallback === 'function') {
        return (fallback as FallbackRender)({ error, reset: this.handleReset });
      }

      // Static fallback
      if (fallback) return fallback;

      // Default fallback UI
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            gap: 14,
            minHeight: 120,
          }}
        >
          {/* Warning icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(239, 68, 68, 0.7)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <span
            style={{
              color: '#7c7c96',
              fontSize: 14,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {label || '\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043E\u0431\u0440\u0430\u0437\u0438\u0442\u044C \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442'}
          </span>

          {/* Show condensed error message in dev */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <span
              style={{
                color: '#6b6b80',
                fontSize: 11,
                maxWidth: 400,
                textAlign: 'center',
                wordBreak: 'break-word',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                padding: '6px 10px',
                background: 'rgba(124, 124, 150, 0.06)',
                borderRadius: 6,
              }}
            >
              {error.message}
            </span>
          )}

          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid #3a3a52',
              background: 'transparent',
              color: '#7c7c96',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}
          >
            {'\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
