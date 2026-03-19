'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { toast } from '@/stores/useNotificationStore';

/* ── Constants ─────────────────────────────────────────────── */

const GRADIENT: [string, string] = ['#8b5cf6', '#a78bfa'];

const TABS = ['Ideas', 'Titles', 'Hashtags', 'Scripts', 'Thumbnails'] as const;
type Tab = (typeof TABS)[number];

const STORAGE_KEY = 'brainstormer_history';
const MAX_HISTORY = 50;

/* ── Data templates for idea generation engine ─────────────── */

const FORMATS = [
  'Tutorial', 'Top 10 List', 'Challenge', 'Day in the Life',
  'Comparison', 'Review', 'Behind the Scenes', 'Q&A',
  'Reaction', 'Documentary', 'How-To Guide', 'Myth Busting',
  'Case Study', 'Experiment', 'Speedrun', 'Story Time',
  'Debate', 'Unboxing', 'Tier List', 'Deep Dive',
];

const HOOKS = [
  'that nobody talks about', 'in under 10 minutes',
  'that changed my life', 'you need to try',
  'before it\'s too late', 'that actually work',
  'the hard way', 'without spending a dime',
  'most people get wrong', 'I wish I knew sooner',
  'that went viral', 'from scratch',
  'on a budget', 'in 2024',
  'that blew my mind', 'step by step',
  'vs what actually happened', 'and here\'s proof',
  'even beginners can do', 'that experts won\'t tell you',
];

const NUMBERS = ['3', '5', '7', '10', '12', '15', '20', '50', '100'];

const ADJECTIVES = [
  'Essential', 'Proven', 'Surprising', 'Hidden', 'Powerful',
  'Game-Changing', 'Mind-Blowing', 'Underrated', 'Must-Know',
  'Incredible', 'Simple', 'Advanced', 'Free', 'Secret',
  'Ultimate', 'Brutally Honest', 'Controversial', 'Lazy',
];

const PROMISES = [
  'That Will Change Everything', 'You Need Right Now',
  'Nobody Told You About', 'That Actually Work',
  'To Level Up Fast', 'For Beginners & Pros',
  'You\'re Doing Wrong', 'To Save Hours Every Week',
  'That Make Money', 'To Master in 2024',
  'Ranked from Worst to Best', 'I Can\'t Live Without',
  'To Boost Your Productivity', 'That Are Worth Your Time',
];

const HASHTAG_PREFIXES = [
  'trending', 'viral', 'tips', 'hacks', 'tutorial',
  'howto', 'learn', 'guide', 'pro', 'best',
  'top', 'daily', 'life', 'motivation', 'growth',
];

const THUMBNAIL_COMPOSITIONS = [
  'Close-up face with shocked/excited expression + bold text overlay',
  'Before/after split screen with arrow pointing between',
  'Bright solid color background + subject in center + large number',
  'Subject pointing at or looking at floating text/object',
  'Dark background with glowing highlight on subject + minimal text',
  'Zoomed-out lifestyle shot with subject in action + overlay badges',
  'Red/yellow circle or arrow highlighting a detail in the scene',
  'Subject vs. object or other subject side-by-side comparison',
  'Clean minimalist layout with product/tool in center + brand colors',
  'Subject holding or presenting something toward the camera',
];

const THUMBNAIL_COLORS = [
  'High-contrast red/yellow/white', 'Blue and white clean tones',
  'Dark mode with neon accents', 'Warm sunset palette',
  'Monochrome with single pop color', 'Bold primary color blocks',
  'Gradient background (purple to blue)', 'Green money/success aesthetic',
];

const THUMBNAIL_TEXT_STYLES = [
  'Bold sans-serif, 3-4 words max', 'Impact font with black outline',
  'Handwritten style annotation', 'Minimal single keyword',
  'Numbers only (large)', 'Mixed size emphasis on key word',
  'Emoji + text combination', 'Question in speech bubble',
];

const CTA_TEMPLATES = [
  'Drop a comment below if you agree!',
  'Subscribe and hit the bell for part 2!',
  'Like this video if you found it helpful!',
  'Share this with someone who needs to hear it!',
  'Check the link in the description for more!',
  'Tell me your experience in the comments!',
  'Follow for more content like this!',
  'Save this for later \u2014 you\'ll need it!',
];

/* ── Utility helpers ──────────────────────────────────────── */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20);
}

function topicWords(topic: string): string[] {
  return topic
    .toLowerCase()
    .split(/[\s,;/&+]+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[^a-z0-9]/g, ''));
}

/* ── Generation engine ────────────────────────────────────── */

interface GeneratedCard {
  id: string;
  title: string;
  body: string;
  tags?: string[];
}

function generateIdeas(topic: string, count = 8): GeneratedCard[] {
  const results: GeneratedCard[] = [];
  const usedFormats = new Set<string>();

  for (let i = 0; i < count; i++) {
    let format: string;
    do { format = pick(FORMATS); } while (usedFormats.has(format) && usedFormats.size < FORMATS.length);
    usedFormats.add(format);

    const hook = pick(HOOKS);
    const title = `${capitalize(topic)} ${format}: ${hook}`;
    const description = buildIdeaDescription(topic, format, hook);

    results.push({
      id: `idea-${Date.now()}-${i}`,
      title,
      body: description,
      tags: [format, capitalize(topic.split(' ')[0]), pick(['Trending', 'Evergreen', 'Viral Potential', 'Niche', 'Broad Appeal'])],
    });
  }
  return results;
}

function buildIdeaDescription(topic: string, format: string, hook: string): string {
  const descriptions: Record<string, (t: string, h: string) => string> = {
    Tutorial: (t, h) => `Walk viewers through ${t} ${h}. Break it into clear steps with visuals, then show the final result. Good for SEO and watch time.`,
    'Top 10 List': (t, h) => `Rank the best aspects of ${t} ${h}. Use a countdown format to build anticipation. Each item gets a mini-review with pros/cons.`,
    Challenge: (t, h) => `Set a concrete ${t} challenge ${h}. Document the journey day by day, share struggles and wins. End with honest results and takeaways.`,
    'Day in the Life': (t, h) => `Show a realistic day centered around ${t} ${h}. Mix routine footage with genuine moments. Great for building personal connection.`,
    Comparison: (t, h) => `Compare the top options in ${t} ${h}. Use side-by-side tests with clear criteria. Give a definitive recommendation at the end.`,
    Review: (t, h) => `Give an honest, detailed review of ${t} ${h}. Cover features, pricing, pros and cons. Include real usage footage and alternatives.`,
    'Behind the Scenes': (t, h) => `Pull back the curtain on ${t} ${h}. Show the process, tools, and effort involved. Viewers love seeing the real work behind results.`,
    'Q&A': (t, h) => `Answer the most common questions about ${t} ${h}. Source questions from comments and social media. Add surprising facts for engagement.`,
    Reaction: (t, h) => `React to the latest developments in ${t} ${h}. Share genuine reactions with expert analysis. Break down what it means for the audience.`,
    Documentary: (t, h) => `Create a mini-documentary about ${t} ${h}. Research deeply, include interviews or clips, and tell a compelling narrative arc.`,
    'How-To Guide': (t, h) => `Create a definitive how-to for ${t} ${h}. Start from zero assumptions, cover every step, and troubleshoot common mistakes.`,
    'Myth Busting': (t, h) => `Debunk popular myths about ${t} ${h}. Test each myth with evidence, show surprising results. High shareability.`,
    'Case Study': (t, h) => `Analyze a real-world example of ${t} ${h}. Break down what worked, what didn't, and actionable lessons viewers can apply.`,
    Experiment: (t, h) => `Run a controlled experiment with ${t} ${h}. Document setup, process, and results. Present data clearly with before/after comparisons.`,
    Speedrun: (t, h) => `Speed through ${t} ${h}. Show how fast results are possible with the right approach. Time-lapse the process for maximum impact.`,
    'Story Time': (t, h) => `Share a personal story about ${t} ${h}. Build tension, include the turning point, and end with the lesson learned.`,
    Debate: (t, h) => `Present both sides of a ${t} debate ${h}. Use facts and real examples. Ask viewers to weigh in for engagement.`,
    Unboxing: (t, h) => `Unbox and first-look at ${t} products/tools ${h}. Share genuine first impressions and immediate tests.`,
    'Tier List': (t, h) => `Rank everything in ${t} into tiers ${h}. Use S/A/B/C/F rankings with clear criteria. Controversial picks drive comments.`,
    'Deep Dive': (t, h) => `Go deep into ${t} ${h}. Cover history, current state, and future predictions. Long-form authority content that builds trust.`,
  };

  const builder = descriptions[format];
  if (builder) return builder(topic, hook);
  return `Explore ${topic} through a ${format.toLowerCase()} format ${hook}. Bring your unique perspective and engage viewers with clear value upfront.`;
}

function generateTitles(topic: string, count = 10): GeneratedCard[] {
  const results: GeneratedCard[] = [];
  const patterns: Array<() => string> = [
    () => `${pick(NUMBERS)} ${pick(ADJECTIVES)} ${capitalize(topic)} ${pick(PROMISES)}`,
    () => `How I Mastered ${capitalize(topic)} ${pick(HOOKS)}`,
    () => `Why ${capitalize(topic)} Is ${pick(['Overrated', 'Underrated', 'Changing Everything', 'Not What You Think', 'The Future'])}`,
    () => `${capitalize(topic)}: ${pick(ADJECTIVES)} Guide ${pick(HOOKS)}`,
    () => `I Tried ${capitalize(topic)} for 30 Days \u2014 Here's What Happened`,
    () => `The Truth About ${capitalize(topic)} ${pick(HOOKS)}`,
    () => `${capitalize(topic)} vs. ${capitalize(topic)} 2.0 \u2014 Which Is Better?`,
    () => `Stop Doing ${capitalize(topic)} Wrong (Do This Instead)`,
    () => `${pick(NUMBERS)} ${capitalize(topic)} Mistakes ${pick(['Beginners Make', 'That Cost You Money', 'You Don\'t Know About', 'Pros Never Make'])}`,
    () => `The ${pick(ADJECTIVES)} ${capitalize(topic)} ${pick(['Strategy', 'Method', 'Framework', 'System', 'Blueprint'])} ${pick(HOOKS)}`,
    () => `Everything Wrong With ${capitalize(topic)} (And How to Fix It)`,
    () => `${capitalize(topic)} ${pick(['Tier List', 'Ranked', 'Starter Pack', 'Iceberg Explained', 'Alignment Chart'])}`,
    () => `What ${pick(['$100', '1 Hour', '7 Days', '1 Month'])} of ${capitalize(topic)} Looks Like`,
    () => `${capitalize(topic)}: ${pick(['Beginner', 'Intermediate', 'Advanced', 'Expert'])} to ${pick(['Pro', 'Master', 'Expert', 'God-Tier'])} Roadmap`,
    () => `If You're Into ${capitalize(topic)}, Watch This`,
  ];

  for (let i = 0; i < count; i++) {
    const patternFn = patterns[i % patterns.length];
    const title = patternFn();
    results.push({
      id: `title-${Date.now()}-${i}`,
      title,
      body: `${title.length} characters \u2022 ${title.split(' ').length} words`,
    });
  }
  return results;
}

function generateHashtags(topic: string, count = 6): GeneratedCard[] {
  const words = topicWords(topic);
  const results: GeneratedCard[] = [];

  // Primary topic hashtags
  const primaryTags = words.map((w) => `#${w}`);

  // Combined hashtags
  const combinedTags = words.flatMap((w) =>
    HASHTAG_PREFIXES.map((p) => `#${p}${capitalize(w)}`),
  );

  // Niche hashtags
  const nicheTags = words.flatMap((w) => [
    `#${w}community`, `#${w}life`, `#${w}tips`,
    `#${w}hacks`, `#${w}daily`, `#${w}goals`,
    `#${w}motivation`, `#${w}tutorial`, `#${w}content`,
  ]);

  // Generic viral hashtags
  const genericTags = [
    '#fyp', '#viral', '#trending', '#explore',
    '#mustwatch', '#mindblown', '#gamechanger',
    '#protip', '#lifehack', '#learnontiktok',
    '#youtube', '#creator', '#contentcreator',
  ];

  const setVariants = [
    { name: 'High Reach (Broad)', tags: [...pickN(genericTags, 8), ...pickN(primaryTags, 4), ...pickN(combinedTags, 3)] },
    { name: 'Niche Targeting', tags: [...pickN(nicheTags, 8), ...pickN(primaryTags, 3), ...pickN(combinedTags, 4)] },
    { name: 'Balanced Mix', tags: [...pickN(genericTags, 5), ...pickN(nicheTags, 5), ...pickN(primaryTags, 2), ...pickN(combinedTags, 3)] },
    { name: 'Community Growth', tags: [...pickN(nicheTags, 6), ...pickN(primaryTags, 4), `#${slugify(topic)}gang`, `#${slugify(topic)}fam`, ...pickN(genericTags, 3)] },
    { name: 'SEO Optimized', tags: [...primaryTags, ...pickN(combinedTags, 8), ...pickN(nicheTags, 4)] },
    { name: 'Shorts / Reels', tags: ['#shorts', '#reels', '#tiktokviral', ...pickN(genericTags, 5), ...pickN(primaryTags, 3), ...pickN(combinedTags, 3)] },
  ];

  for (let i = 0; i < Math.min(count, setVariants.length); i++) {
    const variant = setVariants[i];
    const uniqueTags = [...new Set(variant.tags)].slice(0, 15);
    results.push({
      id: `hash-${Date.now()}-${i}`,
      title: variant.name,
      body: uniqueTags.join(' '),
      tags: [`${uniqueTags.length} tags`],
    });
  }
  return results;
}

function generateScripts(topic: string, count = 4): GeneratedCard[] {
  const results: GeneratedCard[] = [];
  const introStyles = [
    `What if I told you everything you know about ${topic} is wrong?`,
    `${capitalize(topic)} completely changed my life \u2014 here's the story.`,
    `Most people fail at ${topic} because they skip THIS.`,
    `I spent 100 hours researching ${topic} so you don't have to.`,
    `Stop scrolling. If you care about ${topic}, you need to see this.`,
    `The ${topic} industry doesn't want you to know this.`,
  ];

  const outroStyles = [
    `If this helped you with ${topic}, smash that like button and subscribe for more.`,
    `Drop your biggest ${topic} question in the comments \u2014 I'll answer every one.`,
    `Part 2 goes even deeper. Subscribe so you don't miss it.`,
    `Now it's your turn. Try this ${topic} strategy and tell me your results.`,
  ];

  const formats = [
    {
      name: 'Hook-Value-CTA (Short Form)',
      build: () => {
        const intro = pick(introStyles);
        return [
          `HOOK (0:00-0:05):\n"${intro}"`,
          `SETUP (0:05-0:15):\nQuickly establish credibility. Why should they listen to you about ${topic}?`,
          `VALUE POINT 1 (0:15-0:30):\nShare the most impactful insight about ${topic}. Use a visual or example.`,
          `VALUE POINT 2 (0:30-0:45):\nBuild on the first point with a specific technique or strategy.`,
          `PAYOFF (0:45-0:55):\nReveal the result or transformation. Show proof if possible.`,
          `CTA (0:55-1:00):\n"${pick(CTA_TEMPLATES)}"`,
        ].join('\n\n');
      },
    },
    {
      name: 'Problem-Solution (Mid Form)',
      build: () => {
        return [
          `COLD OPEN (0:00-0:30):\n"${pick(introStyles)}"\nShow the problem in action. Make viewers feel the pain.`,
          `CONTEXT (0:30-1:30):\nExplain why ${topic} matters right now. Share a quick stat or story.`,
          `SOLUTION STEP 1 (1:30-3:00):\nPresent the first part of your ${topic} solution. Screen share or demonstrate.`,
          `SOLUTION STEP 2 (3:00-4:30):\nGo deeper. Address the common objection: "But what about...?"`,
          `SOLUTION STEP 3 (4:30-6:00):\nThe advanced move. This separates beginners from pros in ${topic}.`,
          `RESULTS (6:00-7:00):\nShow real results. Numbers, screenshots, before/after.`,
          `OUTRO (7:00-7:30):\n"${pick(outroStyles)}"`,
        ].join('\n\n');
      },
    },
    {
      name: 'Listicle Walkthrough (Long Form)',
      build: () => {
        const num = pick(['5', '7', '10']);
        return [
          `INTRO (0:00-1:00):\n"Today I'm breaking down ${num} ${topic} strategies ${pick(HOOKS)}. Number ${num} literally changed everything for me."`,
          `#1 (1:00-2:30):\n[${capitalize(topic)} Strategy 1] \u2014 The foundation. Explain the concept, show an example, give an actionable tip.`,
          `#2 (2:30-4:00):\n[${capitalize(topic)} Strategy 2] \u2014 Building on #1. Add a real-world case study or personal anecdote.`,
          `#3 (4:00-5:30):\n[${capitalize(topic)} Strategy 3] \u2014 The unexpected one. Something counterintuitive about ${topic}.`,
          `... continue pattern for remaining items ...`,
          `#${num} - THE BIG ONE (near end):\n[${capitalize(topic)} Top Strategy] \u2014 Save the best for last. This is why people watch to the end.`,
          `RECAP + CTA:\nQuick summary of all ${num} points. "${pick(outroStyles)}"`,
        ].join('\n\n');
      },
    },
    {
      name: 'Story Arc (Narrative)',
      build: () => {
        return [
          `ACT 1 \u2014 THE SETUP:\n"${pick(introStyles)}"\nIntroduce the situation. What was life like BEFORE ${topic}? Set the scene.`,
          `THE INCITING INCIDENT:\nWhat moment made you dive into ${topic}? Make it specific and relatable.`,
          `ACT 2 \u2014 THE STRUGGLE:\nDetail the challenges. What went wrong? What mistakes did you make with ${topic}? Be honest and vulnerable.`,
          `THE TURNING POINT:\nWhat was the breakthrough moment? The one thing that made ${topic} click?`,
          `ACT 3 \u2014 THE TRANSFORMATION:\nShow the results. How did mastering ${topic} change things? Use concrete examples.`,
          `THE LESSON:\nDistill everything into one clear takeaway about ${topic} that viewers can apply today.`,
          `CLOSE:\n"${pick(outroStyles)}"`,
        ].join('\n\n');
      },
    },
  ];

  for (let i = 0; i < Math.min(count, formats.length); i++) {
    const fmt = formats[i];
    results.push({
      id: `script-${Date.now()}-${i}`,
      title: fmt.name,
      body: fmt.build(),
    });
  }
  return results;
}

function generateThumbnails(topic: string, count = 6): GeneratedCard[] {
  const results: GeneratedCard[] = [];

  for (let i = 0; i < count; i++) {
    const composition = pick(THUMBNAIL_COMPOSITIONS);
    const colorScheme = pick(THUMBNAIL_COLORS);
    const textStyle = pick(THUMBNAIL_TEXT_STYLES);

    results.push({
      id: `thumb-${Date.now()}-${i}`,
      title: `Thumbnail Concept ${i + 1}`,
      body: [
        `Layout: ${composition}`,
        `Color Scheme: ${colorScheme}`,
        `Text Style: ${textStyle}`,
        `Suggested Text: "${generateThumbText(topic)}"`,
        `Pro Tip: ${pick([
          'Faces with strong emotions get 38% more clicks',
          'Use 3 or fewer words for maximum impact',
          'Yellow and red borders increase CTR on mobile',
          'Contrast your thumbnail against YouTube\'s white background',
          'Test with the thumbnail at small size \u2014 it must be readable',
          'Numbers in thumbnails boost clicks by 20-30%',
          'Use negative space to draw the eye to your subject',
          'Avoid clutter \u2014 one clear focal point performs best',
        ])}`,
      ].join('\n'),
    });
  }
  return results;
}

function generateThumbText(topic: string): string {
  const templates = [
    `${topic.toUpperCase()}?!`,
    `${pick(NUMBERS)} ${topic.split(' ')[0].toUpperCase()} TIPS`,
    `THIS ${topic.split(' ')[0].toUpperCase()}...`,
    `WHY??`,
    `${pick(['GAME', 'LIFE', 'MIND'])} = CHANGED`,
    `${topic.toUpperCase()} HACK`,
    `DON'T DO THIS`,
    `${pick(['$0', '$1', '$100', '0', '100%'])}`,
  ];
  return pick(templates);
}

function generateForTab(tab: Tab, topic: string): GeneratedCard[] {
  switch (tab) {
    case 'Ideas': return generateIdeas(topic);
    case 'Titles': return generateTitles(topic);
    case 'Hashtags': return generateHashtags(topic);
    case 'Scripts': return generateScripts(topic);
    case 'Thumbnails': return generateThumbnails(topic);
  }
}

/* ── History types ────────────────────────────────────────── */

interface HistoryEntry {
  id: string;
  topic: string;
  tab: Tab;
  cards: GeneratedCard[];
  createdAt: number;
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    // storage full — silently fail
  }
}

/* ── Tab icon SVGs ────────────────────────────────────────── */

function TabIcon({ tab, color }: { tab: Tab; color: string }) {
  const props = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (tab) {
    case 'Ideas':
      return <svg {...props}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 014 12.7V17H8v-2.3A7 7 0 0112 2z" /></svg>;
    case 'Titles':
      return <svg {...props}><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg>;
    case 'Hashtags':
      return <svg {...props}><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></svg>;
    case 'Scripts':
      return <svg {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
    case 'Thumbnails':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
  }
}

/* ── Main Component ───────────────────────────────────────── */

export function Brainstormer() {
  const C = useThemeStore((s) => s.theme);
  const [topic, setTopic] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Ideas');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleGenerate = useCallback(() => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setCopiedId(null);

    // Small delay for visual feedback
    setTimeout(() => {
      const generated = generateForTab(activeTab, topic.trim());
      setCards(generated);
      setLoading(false);

      // Save to history
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        topic: topic.trim(),
        tab: activeTab,
        cards: generated,
        createdAt: Date.now(),
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });
    }, 400);
  }, [topic, activeTab, loading]);

  const handleCopy = useCallback((card: GeneratedCard) => {
    const text = `${card.title}\n\n${card.body}${card.tags ? '\n\nTags: ' + card.tags.join(', ') : ''}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success('Copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy');
      });
    }
    setCopiedId(card.id);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCopyAll = useCallback(() => {
    const text = cards.map((card, i) => {
      let entry = `${i + 1}. ${card.title}\n${card.body}`;
      if (card.tags) entry += `\nTags: ${card.tags.join(', ')}`;
      return entry;
    }).join('\n\n---\n\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success('All ideas copied!');
      }).catch(() => {
        toast.error('Failed to copy');
      });
    }
  }, [cards]);

  const handleExport = useCallback(() => {
    const header = `Brainstormer Export \u2014 ${activeTab}\nTopic: ${topic}\nGenerated: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;
    const body = cards.map((card, i) => {
      let entry = `${i + 1}. ${card.title}\n${'—'.repeat(30)}\n${card.body}`;
      if (card.tags) entry += `\nTags: ${card.tags.join(', ')}`;
      return entry;
    }).join('\n\n');

    const blob = new Blob([header + body], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainstormer-${slugify(topic)}-${activeTab.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported to file!');
  }, [cards, topic, activeTab]);

  const handleLoadHistory = useCallback((entry: HistoryEntry) => {
    setTopic(entry.topic);
    setActiveTab(entry.tab);
    setCards(entry.cards);
    setShowHistory(false);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
    toast.info('History cleared');
  }, []);

  return (
    <ToolPageShell
      title="AI Brainstormer"
      subtitle="Generate creative content ideas tailored to your niche and audience"
      gradient={GRADIENT}
    >
      {/* Topic input + controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {/* Topic input row */}
        <div style={{
          padding: 20, borderRadius: 16,
          border: `1px solid ${C.border}`, background: C.card,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Topic / Niche</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
              placeholder="e.g. AI productivity, fitness, personal finance, cooking..."
              aria-label="Topic or niche"
              style={{
                flex: 1, minWidth: 200, padding: '12px 16px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
            <ActionButton
              label={loading ? 'Generating...' : 'Generate'}
              gradient={GRADIENT}
              onClick={handleGenerate}
              loading={loading}
              disabled={!topic.trim()}
            />
          </div>
        </div>

        {/* Tabs + action bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap',
        }}>
          {/* Content type tabs */}
          <div style={{
            display: 'flex', gap: 4, padding: 4, borderRadius: 12,
            background: C.surface, border: `1px solid ${C.border}`,
            flexWrap: 'wrap',
          }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  border: 'none',
                  background: activeTab === tab ? `${GRADIENT[0]}22` : 'transparent',
                  color: activeTab === tab ? GRADIENT[0] : C.sub,
                  fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  fontFamily: 'inherit', outline: 'none',
                }}
              >
                <TabIcon tab={tab} color={activeTab === tab ? GRADIENT[0] : C.dim} />
                {tab}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {cards.length > 0 && (
              <>
                <button
                  onClick={handleCopyAll}
                  style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${C.border}`, background: C.surface,
                    color: C.sub, cursor: 'pointer', transition: 'all 0.15s ease',
                    fontFamily: 'inherit', outline: 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; e.currentTarget.style.color = GRADIENT[0]; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copy All
                </button>
                <button
                  onClick={handleExport}
                  style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${C.border}`, background: C.surface,
                    color: C.sub, cursor: 'pointer', transition: 'all 0.15s ease',
                    fontFamily: 'inherit', outline: 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; e.currentTarget.style.color = GRADIENT[0]; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export
                </button>
              </>
            )}
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${showHistory ? GRADIENT[0] : C.border}`,
                background: showHistory ? `${GRADIENT[0]}15` : C.surface,
                color: showHistory ? GRADIENT[0] : C.sub,
                cursor: 'pointer', transition: 'all 0.15s ease',
                fontFamily: 'inherit', outline: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={(e) => { if (!showHistory) { e.currentTarget.style.borderColor = GRADIENT[0]; e.currentTarget.style.color = GRADIENT[0]; } }}
              onMouseLeave={(e) => { if (!showHistory) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub; } }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              History{history.length > 0 ? ` (${history.length})` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div style={{
          marginBottom: 20, padding: 16, borderRadius: 14,
          border: `1px solid ${C.border}`, background: C.card,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Generation History</span>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.sub, cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.sub; e.currentTarget.style.borderColor = C.border; }}
              >
                Clear All
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p style={{ fontSize: 13, color: C.dim, textAlign: 'center', padding: 16 }}>
              No history yet. Generate some ideas to get started!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleLoadHistory(entry)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.surface,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    fontFamily: 'inherit', outline: 'none', textAlign: 'left',
                    width: '100%', gap: 12,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; e.currentTarget.style.background = `${GRADIENT[0]}08`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: `${GRADIENT[0]}18`, color: GRADIENT[0],
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {entry.tab}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: C.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {entry.topic}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: C.dim }}>
                      {entry.cards.length} items
                    </span>
                    <span style={{ fontSize: 11, color: C.dim }}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          padding: 48, textAlign: 'center', borderRadius: 16,
          border: `1px solid ${C.border}`, background: C.card,
        }}>
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'spin 1.2s linear infinite' }}>
            <circle cx="20" cy="20" r="16" stroke={`${GRADIENT[0]}33`} strokeWidth="3" fill="none" />
            <path d="M20 4a16 16 0 0111.31 4.69" stroke={GRADIENT[0]} strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
          <p style={{ fontSize: 14, color: C.sub, marginTop: 16, fontWeight: 600 }}>
            Generating {activeTab.toLowerCase()}...
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && cards.length === 0 && (
        <div style={{
          padding: 48, textAlign: 'center', borderRadius: 16,
          border: `1px solid ${C.border}`, background: C.card,
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.4}>
            <path d="M9 18h6" /><path d="M10 22h4" />
            <path d="M12 2a7 7 0 014 12.7V17H8v-2.3A7 7 0 0112 2z" />
          </svg>
          <p style={{ fontSize: 15, color: C.dim, marginTop: 16, fontWeight: 600 }}>
            Enter a topic and click &ldquo;Generate&rdquo;
          </p>
          <p style={{ fontSize: 13, color: C.dim, marginTop: 6, maxWidth: 400, margin: '6px auto 0' }}>
            Try topics like &ldquo;AI productivity&rdquo;, &ldquo;home cooking&rdquo;, &ldquo;personal finance&rdquo;, or &ldquo;gaming setups&rdquo;
          </p>
        </div>
      )}

      {/* Results */}
      {cards.length > 0 && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
              {cards.length} {activeTab} Generated
            </span>
            <span style={{ fontSize: 12, color: C.dim }}>
              For &ldquo;{topic}&rdquo; &middot; {activeTab}
            </span>
          </div>

          {cards.map((card, i) => (
            <div
              key={card.id}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                padding: 20, borderRadius: 14,
                border: `1px solid ${hoveredCard === card.id ? GRADIENT[0] + '55' : C.border}`,
                background: hoveredCard === card.id ? `${GRADIENT[0]}08` : C.card,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: 8,
                      background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{card.title}</span>
                  </div>

                  {/* Card body */}
                  <div style={{
                    fontSize: 13, color: C.sub, marginLeft: 36, lineHeight: 1.65,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {card.body}
                  </div>

                  {/* Tags */}
                  {card.tags && card.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, marginLeft: 36, flexWrap: 'wrap' }}>
                      {card.tags.map((tag) => (
                        <span key={tag} style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                          background: `${GRADIENT[0]}12`, color: GRADIENT[0],
                          border: `1px solid ${GRADIENT[0]}25`,
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Copy button */}
                <button
                  onClick={() => handleCopy(card)}
                  aria-label={`Copy ${card.title}`}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${copiedId === card.id ? '#10b981' : GRADIENT[0]}`,
                    background: copiedId === card.id ? '#10b98122' : `${GRADIENT[0]}11`,
                    color: copiedId === card.id ? '#10b981' : GRADIENT[0],
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    fontFamily: 'inherit', outline: 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                    flexShrink: 0, marginTop: 2,
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { if (copiedId !== card.id) e.currentTarget.style.background = `${GRADIENT[0]}22`; }}
                  onMouseLeave={(e) => { if (copiedId !== card.id) e.currentTarget.style.background = `${GRADIENT[0]}11`; }}
                >
                  {copiedId === card.id ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Regenerate prompt */}
          <div style={{
            padding: 16, borderRadius: 12, textAlign: 'center',
            border: `1px dashed ${C.border}`, background: C.surface,
            marginTop: 4,
          }}>
            <span style={{ fontSize: 13, color: C.dim }}>
              Not what you were looking for?
            </span>
            <button
              onClick={handleGenerate}
              style={{
                marginLeft: 8, padding: '6px 14px', borderRadius: 8,
                border: `1px solid ${GRADIENT[0]}`, background: `${GRADIENT[0]}11`,
                color: GRADIENT[0], fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${GRADIENT[0]}22`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${GRADIENT[0]}11`; }}
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
