/**
 * Test render helper that wraps components with common providers / mocks.
 * Uses @testing-library/react render under the hood.
 */
import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';

interface ProviderProps {
  children: React.ReactNode;
}

function AllProviders({ children }: ProviderProps) {
  return <>{children}</>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
