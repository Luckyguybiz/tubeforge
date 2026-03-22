/**
 * Project Template Library
 *
 * Pre-made templates that let users start projects with scenes already configured.
 * Each template has bilingual names/descriptions (English primary, Russian secondary)
 * and scene prompts in English for AI image/video generation.
 */

export type TemplateCategory = 'youtube' | 'shorts' | 'social' | 'business' | 'education';

export interface ProjectTemplate {
  id: string;
  name: string;         // English name (primary)
  nameEn: string;       // English name (alias)
  description: string;  // English description (primary)
  descriptionEn: string;
  category: TemplateCategory;
  icon: string;         // Emoji icon
  sceneCount: number;
  scenes: { label: string; prompt: string; style: string; duration: number }[];
  tags: string[];
}

export const TEMPLATES: ProjectTemplate[] = [
  /* ── 1. YouTube Intro ─────────────────────────────────── */
  {
    id: 'youtube-intro',
    name: 'YouTube Intro',
    nameEn: 'YouTube Intro',
    description: 'Dynamic intro with logo animation — 3 scenes',
    descriptionEn: 'Dynamic intro with logo reveal animation — 3 scenes',
    category: 'youtube',
    icon: '\uD83C\uDFAC',
    sceneCount: 3,
    scenes: [
      {
        label: 'Opening',
        prompt: 'Bright dynamic 3D animation: camera flies through a neon tunnel of glowing particles, fast motion, cinematic light, dark background with electric highlights',
        style: 'cinematic',
        duration: 3,
      },
      {
        label: 'Logo',
        prompt: 'Epic logo reveal: metallic letters assemble from scattering particles, light flashes, volumetric shadows, deep dark blue background with gradient',
        style: 'cinematic',
        duration: 4,
      },
      {
        label: 'Transition',
        prompt: 'Smooth transition: logo shrinks and flies upward, behind it the blurred background of main content opens up, soft light, gentle depth of field',
        style: 'cinematic',
        duration: 3,
      },
    ],
    tags: ['intro', 'youtube', 'branding'],
  },

  /* ── 2. YouTube Outro ─────────────────────────────────── */
  {
    id: 'youtube-outro',
    name: 'YouTube Outro',
    nameEn: 'YouTube Outro',
    description: 'Subscribe screen and social links — 2 scenes',
    descriptionEn: 'Subscribe CTA + social links — 2 scenes',
    category: 'youtube',
    icon: '\uD83D\uDC4B',
    sceneCount: 2,
    scenes: [
      {
        label: 'Subscribe',
        prompt: 'Stylish end-screen: animated subscribe button in the center, like and bell icons appear around it, warm gradient background, pleasant typography',
        style: 'motion-graphics',
        duration: 8,
      },
      {
        label: 'Social',
        prompt: 'Minimalist social media screen: Instagram, Telegram, TikTok icons appear smoothly in a row, username text below, clean light background with soft shadows',
        style: 'motion-graphics',
        duration: 7,
      },
    ],
    tags: ['outro', 'youtube', 'subscribe'],
  },

  /* ── 3. Tutorial ──────────────────────────────────────── */
  {
    id: 'tutorial',
    name: 'Tutorial',
    nameEn: 'Tutorial',
    description: 'Step-by-step educational content — 5 scenes',
    descriptionEn: 'Step-by-step educational content — 5 scenes',
    category: 'education',
    icon: '\uD83D\uDCDA',
    sceneCount: 5,
    scenes: [
      {
        label: 'Introduction',
        prompt: 'Teacher stands in front of an interactive board in a modern classroom, pointing at the screen with lesson topic, friendly atmosphere, soft daylight from window',
        style: 'realistic',
        duration: 10,
      },
      {
        label: 'Step 1',
        prompt: 'Close-up of workspace: hands demonstrate the first step — opening the program, monitor screen shows interface elements, soft side lighting',
        style: 'realistic',
        duration: 15,
      },
      {
        label: 'Step 2',
        prompt: 'Animated infographic: diagram shows the second step of the process, arrows and icons appear sequentially, minimalist design on white background',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'Step 3',
        prompt: 'Split screen: left — correct result with green checkmark, right — common mistake with red cross, clear visual hint',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'Summary',
        prompt: 'Final slide with brief summary: three key lesson points on stylish background, call to ask questions in comments below, soft gradient',
        style: 'motion-graphics',
        duration: 10,
      },
    ],
    tags: ['tutorial', 'education', 'howto'],
  },

  /* ── 4. Product Review ────────────────────────────────── */
  {
    id: 'product-review',
    name: 'Product Review',
    nameEn: 'Product Review',
    description: 'Unboxing, feature overview and verdict — 4 scenes',
    descriptionEn: 'Unboxing + features + verdict — 4 scenes',
    category: 'youtube',
    icon: '\u2B50',
    sceneCount: 4,
    scenes: [
      {
        label: 'Unboxing',
        prompt: 'Stylish unboxing on clean white desk: hands carefully open a beautiful box, camera from above, soft studio light, slight bokeh in background',
        style: 'realistic',
        duration: 12,
      },
      {
        label: 'Overview',
        prompt: 'Close-ups of product from different angles: slow rotation on turntable, camera captures details, textures and design elements, neutral gray background',
        style: 'realistic',
        duration: 20,
      },
      {
        label: 'Pros & Cons',
        prompt: 'Split screen: left green column with plus icons, right red with minus icons, each point appears with animation, modern minimalist design',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'Verdict',
        prompt: 'Final rating: large rating number in center of screen with animated stars, brief verdict text below, dark elegant background with accent color',
        style: 'motion-graphics',
        duration: 10,
      },
    ],
    tags: ['review', 'product', 'unboxing'],
  },

  /* ── 5. Vlog ──────────────────────────────────────────── */
  {
    id: 'vlog',
    name: 'Vlog',
    nameEn: 'Vlog',
    description: 'A day in life: morning, activity, evening, recap — 4 scenes',
    descriptionEn: 'Day-in-the-life format — 4 scenes',
    category: 'youtube',
    icon: '\uD83C\uDFA5',
    sceneCount: 4,
    scenes: [
      {
        label: 'Morning',
        prompt: 'Warm morning: person sits by window with coffee cup, soft golden light from window, cozy atmosphere, slightly blurred kitchen background, natural colors',
        style: 'realistic',
        duration: 10,
      },
      {
        label: 'Activity',
        prompt: 'Dynamic shot: walking through the city, cafes and streets out of focus, bright daylight, city life around, camera follows person, street photography',
        style: 'realistic',
        duration: 15,
      },
      {
        label: 'Evening',
        prompt: 'Evening mood: golden hour footage on rooftop or in park, warm orange tones, silhouettes against sunset, atmospheric cinematic picture',
        style: 'cinematic',
        duration: 12,
      },
      {
        label: 'Day recap',
        prompt: 'Cozy evening setting: talking to camera in room with soft warm light, bookshelf in background, slight bokeh of fairy lights',
        style: 'realistic',
        duration: 10,
      },
    ],
    tags: ['vlog', 'lifestyle', 'daily'],
  },

  /* ── 6. YouTube Shorts ────────────────────────────────── */
  {
    id: 'shorts-hook',
    name: 'YouTube Shorts',
    nameEn: 'YouTube Shorts',
    description: 'Vertical video: hook, content, CTA — 3 scenes',
    descriptionEn: 'Hook + content + CTA for vertical video — 3 scenes',
    category: 'shorts',
    icon: '\u26A1',
    sceneCount: 3,
    scenes: [
      {
        label: 'Hook',
        prompt: 'Bright captivating shot: large text with provocative question on dynamic graphics background, vertical 9:16 format, contrasting colors, instant attention',
        style: 'motion-graphics',
        duration: 3,
      },
      {
        label: 'Content',
        prompt: 'Quick scene changes: main content with large titles, each fact backed by visuals, energetic delivery, bright accent colors, vertical format',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'CTA',
        prompt: 'Final screen: animated arrow points to subscribe button, text "Subscribe to not miss out!", pulsing accent color, vertical format',
        style: 'motion-graphics',
        duration: 5,
      },
    ],
    tags: ['shorts', 'vertical', 'hook'],
  },

  /* ── 7. TikTok Trend ──────────────────────────────────── */
  {
    id: 'tiktok-trend',
    name: 'TikTok Trend',
    nameEn: 'TikTok Trend',
    description: 'Trend video: setup, build-up, finale — 3 scenes',
    descriptionEn: 'Trending video format — 3 scenes',
    category: 'social',
    icon: '\uD83C\uDFB5',
    sceneCount: 3,
    scenes: [
      {
        label: 'Setup',
        prompt: 'Trend opening: person stands before camera in stylish outfit, challenge or question text appears on screen, bright neon background, vertical format',
        style: 'realistic',
        duration: 5,
      },
      {
        label: 'Build-up',
        prompt: 'Quick transformation: series of short transitions — changing looks, locations, actions, each frame lasts a second, dynamic musical montage',
        style: 'cinematic',
        duration: 12,
      },
      {
        label: 'Finale',
        prompt: 'Dramatic ending: unexpected result or funny twist, close-up reaction, freeze frame with text and hashtags, bright colors',
        style: 'realistic',
        duration: 5,
      },
    ],
    tags: ['tiktok', 'trend', 'social'],
  },

  /* ── 8. Ad / Promo ────────────────────────────────────── */
  {
    id: 'ad-promo',
    name: 'Commercial',
    nameEn: 'Ad / Promo',
    description: 'Problem, solution, offer and CTA — 4 scenes',
    descriptionEn: 'Problem + solution + offer + CTA — 4 scenes',
    category: 'business',
    icon: '\uD83D\uDCE2',
    sceneCount: 4,
    scenes: [
      {
        label: 'Problem',
        prompt: 'Person in trouble: frowning look, chaos of papers or notifications on screen around, muted gray tones, slight vignette, emotional shot',
        style: 'realistic',
        duration: 8,
      },
      {
        label: 'Solution',
        prompt: 'Eureka moment: bright light appears on screen, person smiles, clean space around, colors become saturated, product in hands close-up',
        style: 'realistic',
        duration: 10,
      },
      {
        label: 'Offer',
        prompt: 'Elegant product presentation: object floats in center of frame, advantage icons rotate around it, minimalist dark background with accent lighting',
        style: 'cinematic',
        duration: 10,
      },
      {
        label: 'CTA',
        prompt: 'Final CTA: large "Try for Free" button with pulsing glow, brief offer text below, limited-time offer timer, brand colors',
        style: 'motion-graphics',
        duration: 7,
      },
    ],
    tags: ['ad', 'promo', 'marketing'],
  },

  /* ── 9. Explainer ─────────────────────────────────────── */
  {
    id: 'explainer',
    name: 'Explainer',
    nameEn: 'Explainer',
    description: 'Animated explanation: problem, how it works, examples — 5 scenes',
    descriptionEn: 'Animated explainer format — 5 scenes',
    category: 'education',
    icon: '\uD83D\uDCA1',
    sceneCount: 5,
    scenes: [
      {
        label: 'Question',
        prompt: 'Large question mark in center of screen, small related concept icons appear around it, flat design, pastel colors, animated lines',
        style: 'motion-graphics',
        duration: 8,
      },
      {
        label: 'Context',
        prompt: 'Timeline infographic: key dates and events appear on timeline, icons and arrows connect facts, clean white background, accent colors',
        style: 'motion-graphics',
        duration: 12,
      },
      {
        label: 'Mechanism',
        prompt: 'Animated diagram: gears and blocks show how the process works, arrows indicate data or action flow, isometric 3D style, bright colors',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'Example',
        prompt: 'Real example: before/after split screen, numbers and charts show results, green growth arrows, convincing data visualization',
        style: 'motion-graphics',
        duration: 12,
      },
      {
        label: 'Conclusion',
        prompt: 'Summary slide: three key takeaways with checkmarks, link or QR code below, minimalist design with gradient background, professional typography',
        style: 'motion-graphics',
        duration: 8,
      },
    ],
    tags: ['explainer', 'animated', 'education'],
  },

  /* ── 10. Gaming ───────────────────────────────────────── */
  {
    id: 'gaming',
    name: 'Gaming Content',
    nameEn: 'Gaming Content',
    description: 'Gameplay highlights: best moments — 3 scenes',
    descriptionEn: 'Gameplay highlights — 3 scenes',
    category: 'youtube',
    icon: '\uD83C\uDFAE',
    sceneCount: 3,
    scenes: [
      {
        label: 'Epic moment',
        prompt: 'Game screen with epic moment: explosion of effects, bright flashes, combo counter, dynamic HUD interface, dark background with neon accents, gaming montage format',
        style: 'cinematic',
        duration: 10,
      },
      {
        label: 'Fail/Win',
        prompt: 'Funny or impressive moment: freeze frame with zoom, red "FAIL" or gold "WIN" frame, slow-motion key action in background, gaming aesthetics',
        style: 'cinematic',
        duration: 8,
      },
      {
        label: 'Outro',
        prompt: 'Gaming outro: neon "GG" text with match rating, stats in center, particles and effects around, dark purple background with cyber aesthetics',
        style: 'cinematic',
        duration: 7,
      },
    ],
    tags: ['gaming', 'highlights', 'gameplay'],
  },

  /* ── 11. News ─────────────────────────────────────────── */
  {
    id: 'news',
    name: 'News Report',
    nameEn: 'News Segment',
    description: 'Headline, details, analysis, summary — 4 scenes',
    descriptionEn: 'Headline + details + analysis + summary — 4 scenes',
    category: 'business',
    icon: '\uD83D\uDCF0',
    sceneCount: 4,
    scenes: [
      {
        label: 'Headline',
        prompt: 'Breaking news: red "BREAKING NEWS" banner animates at top of screen, large headline appears in center, professional news design, blue background',
        style: 'motion-graphics',
        duration: 5,
      },
      {
        label: 'Details',
        prompt: 'News details: map or photo in background, info bar at bottom with scrolling text, side panel with key facts, news aesthetics',
        style: 'motion-graphics',
        duration: 15,
      },
      {
        label: 'Analysis',
        prompt: 'Analytical graphics: charts and graphs show trends, arrows point to key data, split screen with numbers and percentages, business style',
        style: 'motion-graphics',
        duration: 12,
      },
      {
        label: 'Summary',
        prompt: 'Closing: three main takeaways in columns, date and source below, channel branding, subscribe call, strict professional design',
        style: 'motion-graphics',
        duration: 8,
      },
    ],
    tags: ['news', 'breaking', 'analysis'],
  },

  /* ── 12. Recipe ───────────────────────────────────────── */
  {
    id: 'recipe',
    name: 'Recipe',
    nameEn: 'Recipe',
    description: 'Cooking recipe: ingredients, steps, result, plating — 4 scenes',
    descriptionEn: 'Recipe: ingredients + steps + result + serve — 4 scenes',
    category: 'education',
    icon: '\uD83C\uDF73',
    sceneCount: 4,
    scenes: [
      {
        label: 'Ingredients',
        prompt: 'Beautiful ingredient layout on marble countertop: vegetables, spices, oils arranged in neat bowls, top view, soft daylight, food photography',
        style: 'realistic',
        duration: 8,
      },
      {
        label: 'Cooking',
        prompt: 'Cooking process: chef hands chopping ingredients on wooden board, something sizzling in the pan, steam rising, warm light, cozy kitchen, detailed close-ups',
        style: 'realistic',
        duration: 20,
      },
      {
        label: 'Result',
        prompt: 'Finished dish: beautiful plating on plate, garnish, sauce, herbs, perfect food styling, soft side light, slight steam from hot dish, appetizing colors',
        style: 'realistic',
        duration: 8,
      },
      {
        label: 'Plating',
        prompt: 'Table setting and enjoyment: table is set, hands pick up utensils, first bite on fork, pleased expression, warm home atmosphere, soft focus in background',
        style: 'realistic',
        duration: 8,
      },
    ],
    tags: ['recipe', 'cooking', 'food'],
  },
];

/* ── Helper functions ───────────────────────────────────── */

export function getTemplatesByCategory(category: TemplateCategory): ProjectTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** All unique categories present in the templates list */
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'youtube',
  'shorts',
  'social',
  'business',
  'education',
];

/** Category display info (bilingual) */
export const CATEGORY_INFO: Record<TemplateCategory, { name: string; nameEn: string; color: string }> = {
  youtube:   { name: 'YouTube',      nameEn: 'YouTube',    color: '#ff0000' },
  shorts:    { name: 'Shorts',       nameEn: 'Shorts',     color: '#ff6b35' },
  social:    { name: 'Social',      nameEn: 'Social',     color: '#e91e8c' },
  business:  { name: 'Business',       nameEn: 'Business',   color: '#2563eb' },
  education: { name: 'Education',     nameEn: 'Education',  color: '#16a34a' },
};
