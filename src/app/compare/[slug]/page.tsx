import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

/* ── Comparison data ─────────────────────────────────────── */

interface Feature {
  name: string;
  tubeforge: string;
  competitor: string;
}

interface ComparisonData {
  name: string;
  description: string;
  features: Feature[];
  pricing: {
    tubeforge: string;
    competitor: string;
  };
  advantages: string[];
}

const COMPARISONS: Record<string, ComparisonData> = {
  'tubeforge-vs-invideo': {
    name: 'InVideo',
    description: '\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 TubeForge \u0438 InVideo \u2014 \u0434\u0432\u0443\u0445 \u043F\u043E\u043F\u0443\u043B\u044F\u0440\u043D\u044B\u0445 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0432\u0438\u0434\u0435\u043E \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0418\u0418.',
    features: [
      { name: 'AI-\u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u0441\u0446\u0435\u043D', tubeforge: '\u2705 \u0414\u0430', competitor: '\u2705 \u0414\u0430' },
      { name: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439 \u044F\u0437\u044B\u043A', tubeforge: '\u2705 \u041F\u043E\u043B\u043D\u0430\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430', competitor: '\u26A0\uFE0F \u0427\u0430\u0441\u0442\u0438\u0447\u043D\u043E' },
      { name: 'YouTube \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F', tubeforge: '\u2705 \u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F + \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430', competitor: '\u26A0\uFE0F \u0422\u043E\u043B\u044C\u043A\u043E \u044D\u043A\u0441\u043F\u043E\u0440\u0442' },
      { name: 'SEO-\u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F', tubeforge: '\u2705 AI SEO \u0432\u0441\u0442\u0440\u043E\u0435\u043D', competitor: '\u274C \u041D\u0435\u0442' },
      { name: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B', tubeforge: '\u2705 6+ \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u043E\u0432', competitor: '\u274C \u041D\u0435\u0442' },
      { name: '\u041A\u043E\u043C\u0430\u043D\u0434\u043D\u0430\u044F \u0440\u0430\u0431\u043E\u0442\u0430', tubeforge: '\u2705 Studio \u043F\u043B\u0430\u043D', competitor: '\u2705 Business \u043F\u043B\u0430\u043D' },
      { name: 'API \u0434\u043E\u0441\u0442\u0443\u043F', tubeforge: '\u2705 Studio', competitor: '\u274C \u041D\u0435\u0442' },
    ],
    pricing: { tubeforge: '\u043E\u0442 $0/\u043C\u0435\u0441 (Free)', competitor: '\u043E\u0442 $25/\u043C\u0435\u0441' },
    advantages: [
      '\u041F\u043E\u043B\u043D\u0430\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u0433\u043E \u044F\u0437\u044B\u043A\u0430 \u0432 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0435 \u0438 AI',
      '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B: \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u0432\u0438\u0434\u0435\u043E, \u043A\u043E\u043D\u0432\u0435\u0440\u0442\u0435\u0440, \u0441\u0436\u0430\u0442\u0438\u0435',
      '\u0412\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0439 AI SEO \u0434\u043B\u044F \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u0438 \u043C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0445',
      '\u0411\u043E\u043B\u0435\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0446\u0435\u043D\u044B \u0441 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u043C \u043F\u043B\u0430\u043D\u043E\u043C',
    ],
  },
  'tubeforge-vs-capcut': {
    name: 'CapCut',
    description: '\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 TubeForge \u0438 CapCut \u2014 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0432\u0438\u0434\u0435\u043E\u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430.',
    features: [
      { name: 'AI-\u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u0441\u0446\u0435\u043D', tubeforge: '\u2705 \u0414\u0430', competitor: '\u26A0\uFE0F \u041E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u043D\u043E' },
      { name: 'YouTube \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F', tubeforge: '\u2705 SEO + \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430', competitor: '\u274C \u041D\u0435\u0442' },
      { name: '\u041E\u0431\u043B\u0430\u0447\u043D\u044B\u0439 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440', tubeforge: '\u2705 \u0412\u0435\u0431-\u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435', competitor: '\u2705 \u0412\u0435\u0431 + \u043C\u043E\u0431\u0438\u043B\u044C\u043D\u043E\u0435' },
      { name: '\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u0432\u0438\u0434\u0435\u043E', tubeforge: '\u2705 YouTube, TikTok \u0438 \u0434\u0440.', competitor: '\u274C \u041D\u0435\u0442' },
      { name: 'AI \u043E\u0431\u043B\u043E\u0436\u043A\u0438', tubeforge: '\u2705 \u0414\u0430', competitor: '\u26A0\uFE0F \u041E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u043D\u043E' },
      { name: '\u0420\u0435\u0444\u0435\u0440\u0430\u043B\u044C\u043D\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430', tubeforge: '\u2705 30% \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u044F', competitor: '\u274C \u041D\u0435\u0442' },
    ],
    pricing: { tubeforge: '\u043E\u0442 $0/\u043C\u0435\u0441 (Free)', competitor: '\u043E\u0442 $0/\u043C\u0435\u0441 (Free)' },
    advantages: [
      '\u0421\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0430 YouTube \u2014 SEO, \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430, \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F',
      'AI-\u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u043F\u043E\u043B\u043D\u044B\u0445 \u0432\u0438\u0434\u0435\u043E \u043F\u043E \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044E',
      '\u0412\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0439 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0442\u0435\u043B\u044C \u0432\u0438\u0434\u0435\u043E',
      '\u0420\u0435\u0444\u0435\u0440\u0430\u043B\u044C\u043D\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u0441 30% \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u0435\u0439',
    ],
  },
  'tubeforge-vs-pictory': {
    name: 'Pictory',
    description: '\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 TubeForge \u0438 Pictory \u2014 AI-\u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B \u0434\u043B\u044F \u0432\u0438\u0434\u0435\u043E\u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0441\u0442\u0432\u0430.',
    features: [
      { name: 'AI-\u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u0441\u0446\u0435\u043D', tubeforge: '\u2705 \u0414\u0430', competitor: '\u2705 \u0414\u0430' },
      { name: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439 \u044F\u0437\u044B\u043A', tubeforge: '\u2705 \u041F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E', competitor: '\u274C \u0422\u043E\u043B\u044C\u043A\u043E \u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439' },
      { name: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043F\u043B\u0430\u043D', tubeforge: '\u2705 \u0414\u0430', competitor: '\u274C \u041D\u0435\u0442' },
      { name: 'YouTube SEO', tubeforge: '\u2705 \u0412\u0441\u0442\u0440\u043E\u0435\u043D', competitor: '\u274C \u041D\u0435\u0442' },
      { name: '\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u0432\u0438\u0434\u0435\u043E', tubeforge: '\u2705 \u0414\u0430', competitor: '\u274C \u041D\u0435\u0442' },
      { name: '\u041A\u043E\u043C\u0430\u043D\u0434\u043D\u0430\u044F \u0440\u0430\u0431\u043E\u0442\u0430', tubeforge: '\u2705 Studio', competitor: '\u2705 Teams' },
    ],
    pricing: { tubeforge: '\u043E\u0442 $0/\u043C\u0435\u0441 (Free)', competitor: '\u043E\u0442 $23/\u043C\u0435\u0441' },
    advantages: [
      '\u041F\u043E\u043B\u043D\u0430\u044F \u043B\u043E\u043A\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u0438\u0439 \u044F\u0437\u044B\u043A',
      '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043F\u043B\u0430\u043D \u0434\u043B\u044F \u043D\u0430\u0447\u0430\u043B\u0430 \u0440\u0430\u0431\u043E\u0442\u044B',
      '\u0411\u043E\u043B\u044C\u0448\u0435 \u0432\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0445 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u0434\u043B\u044F YouTube',
      '\u041D\u0438\u0436\u0435 \u0446\u0435\u043D\u044B \u043D\u0430 \u043F\u043B\u0430\u0442\u043D\u044B\u0435 \u043F\u043B\u0430\u043D\u044B',
    ],
  },
  'tubeforge-vs-synthesia': {
    name: 'Synthesia',
    description: '\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 TubeForge \u0438 Synthesia \u2014 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B \u0434\u043B\u044F AI-\u0432\u0438\u0434\u0435\u043E.',
    features: [
      { name: 'AI-\u0430\u0432\u0430\u0442\u0430\u0440\u044B', tubeforge: '\u274C \u041D\u0435\u0442', competitor: '\u2705 \u0414\u0430' },
      { name: 'AI-\u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u0441\u0446\u0435\u043D', tubeforge: '\u2705 \u0414\u0430', competitor: '\u26A0\uFE0F \u0427\u0430\u0441\u0442\u0438\u0447\u043D\u043E' },
      { name: 'YouTube-\u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B', tubeforge: '\u2705 \u041F\u043E\u043B\u043D\u044B\u0439 \u043D\u0430\u0431\u043E\u0440', competitor: '\u274C \u041D\u0435\u0442' },
      { name: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043F\u043B\u0430\u043D', tubeforge: '\u2705 \u0414\u0430', competitor: '\u274C \u041D\u0435\u0442' },
      { name: '\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u0432\u0438\u0434\u0435\u043E', tubeforge: '\u2705 \u0414\u0430', competitor: '\u274C \u041D\u0435\u0442' },
      { name: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441', tubeforge: '\u2705 \u0414\u0430', competitor: '\u274C \u0422\u043E\u043B\u044C\u043A\u043E EN' },
    ],
    pricing: { tubeforge: '\u043E\u0442 $0/\u043C\u0435\u0441 (Free)', competitor: '\u043E\u0442 $22/\u043C\u0435\u0441' },
    advantages: [
      '\u0424\u043E\u043A\u0443\u0441 \u043D\u0430 YouTube-\u043A\u0440\u0435\u0430\u0442\u043E\u0440\u0430\u0445, \u0430 \u043D\u0435 \u043A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0445 \u0432\u0438\u0434\u0435\u043E',
      '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043F\u043B\u0430\u043D \u0434\u043B\u044F \u0441\u0442\u0430\u0440\u0442\u0430',
      '\u0412\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0435 SEO \u0438 \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430',
      '\u0417\u043D\u0430\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0434\u0435\u0448\u0435\u0432\u043B\u0435 \u0434\u043B\u044F \u0438\u043D\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043B\u044C\u043D\u044B\u0445 \u043A\u0440\u0435\u0430\u0442\u043E\u0440\u043E\u0432',
    ],
  },
  'tubeforge-vs-fliki': {
    name: 'Fliki',
    description: '\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 TubeForge \u0438 Fliki \u2014 AI-\u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0432\u0438\u0434\u0435\u043E.',
    features: [
      { name: 'AI-\u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u0441\u0446\u0435\u043D', tubeforge: '\u2705 \u0414\u0430', competitor: '\u2705 \u0414\u0430' },
      { name: '\u041E\u0437\u0432\u0443\u0447\u043A\u0430 (TTS)', tubeforge: '\u26A0\uFE0F \u0412 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0435', competitor: '\u2705 \u0414\u0430' },
      { name: 'YouTube SEO', tubeforge: '\u2705 \u0412\u0441\u0442\u0440\u043E\u0435\u043D', competitor: '\u274C \u041D\u0435\u0442' },
      { name: '\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u0432\u0438\u0434\u0435\u043E', tubeforge: '\u2705 \u0414\u0430', competitor: '\u274C \u041D\u0435\u0442' },
      { name: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441', tubeforge: '\u2705 \u041F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E', competitor: '\u274C \u0422\u043E\u043B\u044C\u043A\u043E EN' },
      { name: '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B', tubeforge: '\u2705 6+ \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u043E\u0432', competitor: '\u274C \u041D\u0435\u0442' },
    ],
    pricing: { tubeforge: '\u043E\u0442 $0/\u043C\u0435\u0441 (Free)', competitor: '\u043E\u0442 $28/\u043C\u0435\u0441' },
    advantages: [
      '\u041F\u043E\u043B\u043D\u044B\u0439 \u043D\u0430\u0431\u043E\u0440 YouTube-\u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u043E\u0432',
      '\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0435 \u0443\u0442\u0438\u043B\u0438\u0442\u044B \u0434\u043B\u044F \u043A\u0440\u0435\u0430\u0442\u043E\u0440\u043E\u0432',
      '\u041F\u043E\u043B\u043D\u0430\u044F \u0440\u0443\u0441\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F',
      '\u0411\u043E\u043B\u0435\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0446\u0435\u043D\u044B',
    ],
  },
};

const VALID_SLUGS = Object.keys(COMPARISONS);

/* ── generateStaticParams ─────────────────────────────── */

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
}

/* ── generateMetadata ─────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = COMPARISONS[slug];
  if (!data) return { title: 'Not Found' };

  const title = `TubeForge vs ${data.name} \u2014 \u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 2026`;
  const description = data.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://tubeforge.co/compare/${slug}`,
    },
    alternates: {
      canonical: `https://tubeforge.co/compare/${slug}`,
    },
  };
}

/* ── Styles ───────────────────────────────────────────── */

const accentColor = '#6c5ce7';

const tableCell: React.CSSProperties = {
  padding: '14px 18px',
  fontSize: 14,
  borderBottom: '1px solid #e4e4e7',
  verticalAlign: 'middle',
};

/* ── Page component ───────────────────────────────────── */

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = COMPARISONS[slug];
  if (!data) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `TubeForge vs ${data.name} \u2014 \u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435`,
    description: data.description,
    url: `https://tubeforge.co/compare/${slug}`,
    mainEntity: {
      '@type': 'Table',
      about: `\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u0439 TubeForge \u0438 ${data.name}`,
    },
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#fff',
        color: '#18181b',
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Back link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#71717a',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 18 }}>{'\u2190'}</span>
          {'\u041D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E'}
        </Link>

        {/* Hero */}
        <div style={{
          background: '#fafafa',
          border: '1px solid #e4e4e7',
          borderRadius: 20,
          padding: '48px 40px',
          marginBottom: 32,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: 28,
              fontWeight: 800,
              color: accentColor,
              letterSpacing: '-.02em',
            }}>
              TubeForge
            </span>
            <span style={{ fontSize: 20, color: '#a1a1aa', fontWeight: 600 }}>vs</span>
            <span style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#18181b',
              letterSpacing: '-.02em',
            }}>
              {data.name}
            </span>
          </div>
          <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.6, margin: 0, maxWidth: 640 }}>
            {data.description}
          </p>
        </div>

        {/* Feature comparison table */}
        <div style={{
          background: '#fff',
          border: '1px solid #e4e4e7',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 32,
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e4e4e7',
            background: '#fafafa',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>
              {'\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u0439'}
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ ...tableCell, fontWeight: 600, textAlign: 'left', width: '40%' }}>
                  {'\u0424\u0443\u043D\u043A\u0446\u0438\u044F'}
                </th>
                <th style={{ ...tableCell, fontWeight: 700, textAlign: 'center', color: accentColor }}>
                  TubeForge
                </th>
                <th style={{ ...tableCell, fontWeight: 600, textAlign: 'center', color: '#71717a' }}>
                  {data.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.features.map((f, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ ...tableCell, fontWeight: 500 }}>{f.name}</td>
                  <td style={{ ...tableCell, textAlign: 'center' }}>{f.tubeforge}</td>
                  <td style={{ ...tableCell, textAlign: 'center' }}>{f.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing comparison */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 32,
        }}>
          <div style={{
            background: `${accentColor}08`,
            border: `2px solid ${accentColor}30`,
            borderRadius: 16,
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#71717a', marginBottom: 8 }}>TubeForge</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: accentColor, letterSpacing: '-.02em' }}>
              {data.pricing.tubeforge}
            </div>
          </div>
          <div style={{
            background: '#fafafa',
            border: '1px solid #e4e4e7',
            borderRadius: 16,
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#71717a', marginBottom: 8 }}>{data.name}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#18181b', letterSpacing: '-.02em' }}>
              {data.pricing.competitor}
            </div>
          </div>
        </div>

        {/* Why TubeForge is better */}
        <div style={{
          background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}04)`,
          border: `1px solid ${accentColor}20`,
          borderRadius: 16,
          padding: '32px',
          marginBottom: 32,
        }}>
          <h2 style={{
            fontSize: 22,
            fontWeight: 800,
            margin: '0 0 20px',
            letterSpacing: '-.02em',
            color: '#18181b',
          }}>
            {'\u041F\u043E\u0447\u0435\u043C\u0443 TubeForge \u043B\u0443\u0447\u0448\u0435'}
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.advantages.map((adv, i) => (
              <li key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 15,
                lineHeight: 1.6,
                color: '#3f3f46',
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: accentColor,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  {'\u2713'}
                </span>
                {adv}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 16,
            letterSpacing: '-.02em',
          }}>
            {'\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 TubeForge \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E'}
          </h2>
          <p style={{ color: '#71717a', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
            {'\u0421\u043E\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u0432\u0438\u0434\u0435\u043E \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0418\u0418 \u0443\u0436\u0435 \u0441\u0435\u0433\u043E\u0434\u043D\u044F. \u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E, \u0431\u0435\u0437 \u043A\u0440\u0435\u0434\u0438\u0442\u043D\u043E\u0439 \u043A\u0430\u0440\u0442\u044B.'}
          </p>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 36px',
              borderRadius: 12,
              background: accentColor,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 700,
              boxShadow: `0 4px 16px ${accentColor}44`,
              transition: 'all .2s',
            }}
          >
            {'\u041D\u0430\u0447\u0430\u0442\u044C \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E'}
          </Link>
        </div>

        {/* Other comparisons */}
        <div style={{
          borderTop: '1px solid #e4e4e7',
          paddingTop: 32,
          marginTop: 16,
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 16,
            color: '#71717a',
          }}>
            {'\u0414\u0440\u0443\u0433\u0438\u0435 \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F'}
          </h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {VALID_SLUGS.filter((s) => s !== slug).map((s) => (
              <Link
                key={s}
                href={`/compare/${s}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #e4e4e7',
                  background: '#fafafa',
                  color: '#3f3f46',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'border-color .15s',
                }}
              >
                TubeForge vs {COMPARISONS[s].name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
