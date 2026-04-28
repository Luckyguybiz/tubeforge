/**
 * /dev/components — internal showcase of design system primitives.
 *
 * Exists only in dev / staging — gated by `process.env.NODE_ENV` so a
 * 404 ships in production. Used as the "visual spec" for primitives
 * during the WC-redesign phase: every variant + state visible in one
 * page, both themes, both viewports.
 */
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

export default function ComponentsShowcasePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-16">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Design System Showcase
          </h1>
          <p className="text-muted-foreground">
            Visual spec for primitives. Toggle theme via{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              data-theme
            </code>{' '}
            attr on{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              &lt;html&gt;
            </code>
            .
          </p>
        </header>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Button</h2>

          <div className="space-y-3">
            <Subtitle>Variants</Subtitle>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          <div className="space-y-3">
            <Subtitle>Sizes</Subtitle>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="icon-only">
                <PlayIcon />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Subtitle>States</Subtitle>
            <div className="flex flex-wrap gap-3">
              <Button>Idle</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button>
                <PlayIcon /> With icon
              </Button>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Input</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Default">
              <Input placeholder="you@example.com" />
            </Field>
            <Field label="With left icon">
              <Input placeholder="Search…" leftIcon={<SearchIcon />} />
            </Field>
            <Field label="Disabled">
              <Input placeholder="Disabled" disabled />
            </Field>
            <Field label="Invalid (aria-invalid)">
              <Input placeholder="Error" aria-invalid="true" defaultValue="bad@" />
            </Field>
            <Field label="Password">
              <Input type="password" placeholder="••••••••" />
            </Field>
            <Field label="With right icon">
              <Input
                placeholder="0.00"
                rightIcon={<span className="text-xs">USD</span>}
              />
            </Field>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Card</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>
                  A subtitle that explains what this card is about.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Body content of the card. Anything goes here.
              </CardContent>
              <CardFooter>
                <Button size="sm">Primary action</Button>
                <Button size="sm" variant="ghost">
                  Cancel
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Header-only card</CardTitle>
                <CardDescription>
                  Useful for small CTAs or summary tiles.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Tokens preview */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Tokens</h2>

          <div className="space-y-3">
            <Subtitle>Brand</Subtitle>
            <div className="flex gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                <Swatch
                  key={shade}
                  className={`bg-brand-${shade}`}
                  label={`brand-${shade}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Subtitle>Surface (theme-aware)</Subtitle>
            <div className="flex gap-2">
              <Swatch className="bg-background border" label="background" />
              <Swatch className="bg-card border" label="card" />
              <Swatch className="bg-muted border" label="muted" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* — Helpers — */

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-12 w-12 rounded-md ${className}`} />
      <code className="text-[10px] text-muted-foreground">{label}</code>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 3l8 5-8 5V3z" fill="currentColor" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
