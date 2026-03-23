import { useMemo } from 'react';
import type { CanvasElement } from '@/lib/types';

/**
 * Analyzes the current canvas elements and returns contextual design hints
 * to help users create better thumbnails.
 */
export function useDesignHints(
  elements: CanvasElement[],
  canvasW: number,
  canvasH: number,
): string[] {
  return useMemo(() => {
    const hints: string[] = [];

    // Check if canvas is empty
    if (elements.length === 0) {
      hints.push('Start by adding a background, text, or image element');
      return hints;
    }

    // Check text readability — small text may not render well on mobile
    const visibleEls = elements.filter((el) => el.visible !== false);
    const textEls = visibleEls.filter((el) => el.type === 'text');
    for (const el of textEls) {
      if (el.size !== undefined && el.size < 24) {
        hints.push('Some text may be too small to read on mobile devices');
        break;
      }
    }

    // Check for low-contrast text (white text on light bg or vice-versa)
    // We only check for obviously problematic cases
    for (const el of textEls) {
      if (el.opacity !== undefined && el.opacity < 0.3) {
        hints.push('Some text has very low opacity and may be hard to read');
        break;
      }
    }

    // Too many elements — cluttered thumbnails
    if (visibleEls.length > 15) {
      hints.push('Consider simplifying — fewer elements often make better thumbnails');
    }

    // Check for elements outside canvas bounds
    const outOfBounds = visibleEls.filter(
      (el) =>
        el.type !== 'line' &&
        el.type !== 'arrow' &&
        el.type !== 'path' &&
        (el.x + el.w < 0 || el.y + el.h < 0 || el.x > canvasW || el.y > canvasH),
    );
    if (outOfBounds.length > 0) {
      hints.push(`${outOfBounds.length} element${outOfBounds.length > 1 ? 's are' : ' is'} outside the visible canvas area`);
    }

    // No text — thumbnails usually benefit from text
    if (textEls.length === 0 && visibleEls.length > 0) {
      hints.push('Adding text can help your thumbnail stand out in search results');
    }

    return hints;
  }, [elements, canvasW, canvasH]);
}
