'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Compact fallback rendered on error. Defaults to a small inline message. */
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Lightweight React error boundary.
 * Wrap any subtree to catch render errors without crashing the whole page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            gap: 12,
            color: '#7c7c96',
            fontSize: 13,
          }}
        >
          <span>Не удалось отобразить компонент</span>
          <button
            onClick={this.handleReset}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid #3a3a52',
              background: 'transparent',
              color: '#7c7c96',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Повторить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
