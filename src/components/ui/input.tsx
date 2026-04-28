import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Input — text/email/password/number primitive.
 *
 * 44px min height honors mobile-tap target guidance (WCAG 2.5.5
 * Level AAA). The `aria-invalid` styling is reactive — set
 * `aria-invalid={!!error}` on the host to flip the border red
 * without remembering a separate prop.
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Optional icon rendered inside the left edge (16px slot). */
  leftIcon?: React.ReactNode;
  /** Optional icon rendered inside the right edge. */
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, ...props }, ref) => {
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;
    return (
      <div className="relative w-full">
        {hasLeftIcon && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground [&_svg]:size-4"
          >
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            // Layout
            'flex h-11 w-full rounded-lg bg-input px-3 py-2 text-sm',
            // Typography
            'text-foreground placeholder:text-muted-foreground',
            // Border
            'border border-border',
            // Focus
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            // States
            'disabled:cursor-not-allowed disabled:opacity-50',
            // File input — match shadcn behaviour
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            // Icon padding
            hasLeftIcon && 'pl-10',
            hasRightIcon && 'pr-10',
            // Invalid state — reacts to aria-invalid
            'aria-invalid:border-error aria-invalid:focus-visible:ring-error',
            className,
          )}
          {...props}
        />
        {hasRightIcon && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground [&_svg]:size-4"
          >
            {rightIcon}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
