/**
 * YouTubeMark — the official YouTube brand icon, rendered unmodified.
 *
 * YouTube API Services Developer Policies III.F.2.a and the YouTube
 * Branding Guidelines require the icon to keep its official shape and
 * colours and to never render below 20dp in height. Every YouTube mark
 * in the product goes through this component so both rules are enforced
 * in one place instead of being re-derived at each call site.
 *
 *   - Artboard locked to the official 28x20 ratio, so the mark can never
 *     be stretched or squashed by a caller passing a width.
 *   - `height` is clamped up to MIN_HEIGHT_DP — a smaller request is
 *     raised rather than silently honoured.
 *   - Fills are literals (#FF0000 / #FFFFFF), never `currentColor`, so a
 *     parent `text-*` utility cannot recolour the logo.
 *
 * @see https://developers.google.com/youtube/terms/branding-guidelines
 */

/** YouTube Branding Guidelines: the icon is never smaller than 20dp high. */
const MIN_HEIGHT_DP = 20;
const ASPECT = 28 / 20;

export function YouTubeMark({
  height = 24,
  className,
}: {
  height?: number;
  className?: string;
}) {
  const h = Math.max(height, MIN_HEIGHT_DP);
  const w = Math.round(h * ASPECT);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 28 20"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="YouTube"
      focusable="false"
      className={className}
    >
      <path
        d="M27.42 3.13a3.51 3.51 0 0 0-2.47-2.5C22.8 0 14 0 14 0S5.2 0 3.05.63A3.51 3.51 0 0 0 .58 3.13 36.83 36.83 0 0 0 0 10a36.83 36.83 0 0 0 .58 6.87 3.51 3.51 0 0 0 2.47 2.5C5.2 20 14 20 14 20s8.8 0 10.95-.63a3.51 3.51 0 0 0 2.47-2.5A36.83 36.83 0 0 0 28 10a36.83 36.83 0 0 0-.58-6.87Z"
        fill="#FF0000"
      />
      <path d="M11.2 14.29 18.5 10 11.2 5.71v8.58Z" fill="#FFFFFF" />
    </svg>
  );
}
