import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button — primary interactive primitive.
 *
 * Variants follow shadcn convention (primary/secondary/ghost/outline/
 * destructive/link); sizes scale to mobile-friendly hit targets
 * (min 44px height for `default`, 36px for `sm`, never below).
 *
 * Use `asChild` to render as a different element while inheriting
 * styles — common for `<Link>` wrapping (sets the link element to
 * receive button styles via Radix Slot).
 */
const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-lg text-sm font-medium tracking-tight',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        primary:
          'bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:bg-brand-700',
        secondary:
          'bg-card text-foreground border border-border hover:bg-muted',
        ghost:
          'text-foreground hover:bg-muted',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-muted',
        destructive:
          'bg-error text-white hover:opacity-90 active:opacity-80',
        link:
          'text-brand-500 underline-offset-4 hover:underline px-0 h-auto',
      },
      size: {
        sm:    'h-9 px-3 text-xs',
        default: 'h-11 px-4 text-sm',
        lg:    'h-12 px-6 text-base',
        icon:  'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        data-loading={loading || undefined}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

/** Tiny inline spinner — fits the [&_svg]:size-4 sibling rule. */
function Spinner() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path
        d="M8 2a6 6 0 014.47 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { Button, buttonVariants };
