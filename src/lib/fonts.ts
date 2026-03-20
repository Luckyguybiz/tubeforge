export interface FontEntry {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  weights: number[];
  popular: boolean;
}

export const FONT_LIBRARY: FontEntry[] = [
  { family: 'Inter', category: 'sans-serif', weights: [400, 600, 700, 800], popular: true },
  { family: 'Roboto', category: 'sans-serif', weights: [400, 500, 700], popular: true },
  { family: 'Montserrat', category: 'sans-serif', weights: [400, 600, 700, 800], popular: true },
  { family: 'Open Sans', category: 'sans-serif', weights: [400, 600, 700], popular: false },
  { family: 'Oswald', category: 'sans-serif', weights: [400, 500, 600, 700], popular: true },
  { family: 'Playfair Display', category: 'serif', weights: [400, 600, 700], popular: true },
  { family: 'Merriweather', category: 'serif', weights: [400, 700], popular: false },
  { family: 'Lora', category: 'serif', weights: [400, 600, 700], popular: false },
  { family: 'Bebas Neue', category: 'display', weights: [400], popular: true },
  { family: 'Permanent Marker', category: 'handwriting', weights: [400], popular: true },
  { family: 'Pacifico', category: 'handwriting', weights: [400], popular: false },
  { family: 'Anton', category: 'display', weights: [400], popular: true },
  { family: 'Rubik', category: 'sans-serif', weights: [400, 500, 700], popular: false },
  { family: 'Nunito', category: 'sans-serif', weights: [400, 600, 700, 800], popular: false },
  { family: 'Poppins', category: 'sans-serif', weights: [400, 500, 600, 700], popular: true },
  { family: 'Raleway', category: 'sans-serif', weights: [400, 600, 700], popular: false },
  { family: 'Ubuntu', category: 'sans-serif', weights: [400, 500, 700], popular: false },
  { family: 'Fira Code', category: 'monospace', weights: [400, 500, 700], popular: false },
  { family: 'Caveat', category: 'handwriting', weights: [400, 600, 700], popular: false },
  { family: 'Comfortaa', category: 'display', weights: [400, 600, 700], popular: false },
];

/** All unique categories in display order */
export const FONT_CATEGORIES = ['sans-serif', 'serif', 'display', 'handwriting', 'monospace'] as const;

/** Group fonts by category */
export function getFontsByCategory(): Record<string, FontEntry[]> {
  const grouped: Record<string, FontEntry[]> = {};
  for (const cat of FONT_CATEGORIES) {
    grouped[cat] = FONT_LIBRARY.filter((f) => f.category === cat);
  }
  return grouped;
}

const loadedFonts = new Set<string>();

/** Dynamically load a Google Font via a <link> tag (idempotent) */
export function loadGoogleFont(family: string, weights: number[] = [400, 700]): void {
  if (typeof document === 'undefined') return;
  if (loadedFonts.has(family)) return;
  loadedFonts.add(family);

  const weightStr = weights.join(';');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weightStr}&display=swap`;
  document.head.appendChild(link);
}

/** Preload all popular fonts (call once on mount) */
export function preloadPopularFonts(): void {
  FONT_LIBRARY.filter((f) => f.popular).forEach((f) => loadGoogleFont(f.family, f.weights));
}
