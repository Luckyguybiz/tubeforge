import type { CanvasElement } from '@/lib/types';

/**
 * Parse a CSS gradient string and return SVG gradient definition + a fill reference.
 * Supports linear-gradient and radial-gradient with simple color stops.
 */
function parseGradient(
  gradientStr: string,
  id: string,
): { def: string; fill: string } | null {
  const linearMatch = gradientStr.match(
    /linear-gradient\(\s*(\d+)deg\s*,\s*(.+)\)/,
  );
  if (linearMatch) {
    const angle = parseFloat(linearMatch[1]);
    const stops = linearMatch[2].split(',').map((s) => s.trim());
    const rad = ((angle - 90) * Math.PI) / 180;
    const x1 = 50 + 50 * Math.cos(rad + Math.PI);
    const y1 = 50 + 50 * Math.sin(rad + Math.PI);
    const x2 = 50 + 50 * Math.cos(rad);
    const y2 = 50 + 50 * Math.sin(rad);

    const stopEls = stops
      .map((stop, i) => {
        const parts = stop.split(/\s+/);
        const color = parts[0];
        const offset =
          parts[1] || `${Math.round((i / Math.max(stops.length - 1, 1)) * 100)}%`;
        return `<stop offset="${offset}" stop-color="${escapeXml(color)}" />`;
      })
      .join('');

    return {
      def: `<linearGradient id="${id}" x1="${x1.toFixed(1)}%" y1="${y1.toFixed(1)}%" x2="${x2.toFixed(1)}%" y2="${y2.toFixed(1)}%">${stopEls}</linearGradient>`,
      fill: `url(#${id})`,
    };
  }

  const radialMatch = gradientStr.match(
    /radial-gradient\(\s*(?:circle|ellipse)?\s*,?\s*(.+)\)/,
  );
  if (radialMatch) {
    const stops = radialMatch[1].split(',').map((s) => s.trim());
    const stopEls = stops
      .map((stop, i) => {
        const parts = stop.split(/\s+/);
        const color = parts[0];
        const offset =
          parts[1] || `${Math.round((i / Math.max(stops.length - 1, 1)) * 100)}%`;
        return `<stop offset="${offset}" stop-color="${escapeXml(color)}" />`;
      })
      .join('');

    return {
      def: `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">${stopEls}</radialGradient>`,
      fill: `url(#${id})`,
    };
  }

  return null;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getDashArray(style?: 'solid' | 'dashed' | 'dotted'): string {
  switch (style) {
    case 'dashed':
      return ' stroke-dasharray="8,4"';
    case 'dotted':
      return ' stroke-dasharray="2,4"';
    default:
      return '';
  }
}

function getTextAnchor(align?: 'left' | 'center' | 'right'): string {
  switch (align) {
    case 'center':
      return 'middle';
    case 'right':
      return 'end';
    default:
      return 'start';
  }
}

function getTextX(el: CanvasElement): number {
  switch (el.textAlign) {
    case 'center':
      return el.x + el.w / 2;
    case 'right':
      return el.x + el.w;
    default:
      return el.x;
  }
}

/**
 * Generate a 5-pointed star polygon points string.
 */
function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return points.join(' ');
}

/**
 * Generate triangle polygon points string.
 */
function trianglePoints(x: number, y: number, w: number, h: number): string {
  const top = `${(x + w / 2).toFixed(2)},${y.toFixed(2)}`;
  const bottomLeft = `${x.toFixed(2)},${(y + h).toFixed(2)}`;
  const bottomRight = `${(x + w).toFixed(2)},${(y + h).toFixed(2)}`;
  return `${top} ${bottomLeft} ${bottomRight}`;
}

function rotationAttr(el: CanvasElement): string {
  if (!el.rot) return '';
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  return ` transform="rotate(${el.rot}, ${cx.toFixed(2)}, ${cy.toFixed(2)})"`;
}

function opacityAttr(el: CanvasElement): string {
  if (el.opacity !== undefined && el.opacity !== 1) {
    return ` opacity="${el.opacity}"`;
  }
  return '';
}

/**
 * Converts an array of CanvasElement objects to valid SVG 1.1 markup.
 */
export function exportToSVG(
  els: CanvasElement[],
  canvasBg: string,
  canvasW: number,
  canvasH: number,
): string {
  const defs: string[] = [];
  const elements: string[] = [];
  let gradientCounter = 0;

  // Canvas background
  elements.push(
    `<rect x="0" y="0" width="${canvasW}" height="${canvasH}" fill="${escapeXml(canvasBg)}" />`,
  );

  for (const el of els) {
    // Skip invisible elements
    if (el.visible === false) continue;

    const opacity = opacityAttr(el);
    const rotation = rotationAttr(el);

    // Resolve fill color, checking for gradient in bg
    let fill = escapeXml(el.bg || el.color || '#000000');
    if (el.bg && (el.bg.includes('linear-gradient') || el.bg.includes('radial-gradient'))) {
      const gradId = `grad_${gradientCounter++}`;
      const parsed = parseGradient(el.bg, gradId);
      if (parsed) {
        defs.push(parsed.def);
        fill = parsed.fill;
      }
    }

    switch (el.type) {
      case 'text': {
        const fontFamily = el.font ? escapeXml(el.font) : 'sans-serif';
        const fontSize = el.size || 16;
        const fontWeight = el.bold ? 'bold' : 'normal';
        const fontStyle = el.italic ? 'italic' : 'normal';
        const anchor = getTextAnchor(el.textAlign);
        const tx = getTextX(el);
        const ty = el.y + fontSize; // baseline offset
        const textColor = escapeXml(el.color || '#000000');
        const textContent = escapeXml(el.text || '');

        // If element has a background, render it behind the text
        if (el.bg && !el.bg.includes('gradient')) {
          elements.push(
            `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" fill="${fill}" rx="${el.borderR || 0}"${rotation}${opacity} />`,
          );
        }

        const shadowAttr = el.shadow
          ? ` filter="drop-shadow(${escapeXml(el.shadow)})"`
          : '';

        elements.push(
          `<text x="${tx}" y="${ty}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" fill="${textColor}" text-anchor="${anchor}"${opacity}${rotation}${shadowAttr}>${textContent}</text>`,
        );
        break;
      }

      case 'rect':
      case 'stickyNote': {
        const rectFill =
          el.type === 'stickyNote'
            ? escapeXml(el.noteColor || el.bg || '#FFEB3B')
            : fill;
        const borderRadius = el.borderR || 0;
        let borderAttr = '';
        if (el.border) {
          borderAttr = ` stroke="${escapeXml(el.border)}" stroke-width="1"`;
        }
        elements.push(
          `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="${borderRadius}" fill="${rectFill}"${borderAttr}${opacity}${rotation} />`,
        );
        // Render sticky note text if present
        if (el.type === 'stickyNote' && el.noteText) {
          const textColor = escapeXml(el.color || '#000000');
          elements.push(
            `<text x="${el.x + 8}" y="${el.y + 20}" font-family="sans-serif" font-size="14" fill="${textColor}"${opacity}${rotation}>${escapeXml(el.noteText)}</text>`,
          );
        }
        break;
      }

      case 'circle': {
        const cx = el.x + el.w / 2;
        const cy = el.y + el.h / 2;
        const rx = el.w / 2;
        const ry = el.h / 2;
        elements.push(
          `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${opacity}${rotation} />`,
        );
        break;
      }

      case 'image': {
        if (el.src) {
          elements.push(
            `<image href="${escapeXml(el.src)}" x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}"${opacity}${rotation} />`,
          );
        }
        break;
      }

      case 'line':
      case 'arrow': {
        const x1 = el.x;
        const y1 = el.y;
        const x2 = el.x2 ?? el.x + el.w;
        const y2 = el.y2 ?? el.y + el.h;
        const stroke = escapeXml(el.strokeColor || el.color || '#000000');
        const strokeWidth = el.lineWidth || el.strokeW || 2;
        const dash = getDashArray(el.dashStyle);

        elements.push(
          `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}"${dash}${opacity} />`,
        );

        // Arrowhead
        if (el.type === 'arrow' || (el.arrowHead && el.arrowHead !== 'none')) {
          const headSize = strokeWidth * 4;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const cos = Math.cos;
          const sin = Math.sin;

          // End arrowhead
          if (el.arrowHead !== 'none' || el.type === 'arrow') {
            const p1x = x2 - headSize * cos(angle - Math.PI / 6);
            const p1y = y2 - headSize * sin(angle - Math.PI / 6);
            const p2x = x2 - headSize * cos(angle + Math.PI / 6);
            const p2y = y2 - headSize * sin(angle + Math.PI / 6);
            elements.push(
              `<polygon points="${x2.toFixed(2)},${y2.toFixed(2)} ${p1x.toFixed(2)},${p1y.toFixed(2)} ${p2x.toFixed(2)},${p2y.toFixed(2)}" fill="${stroke}"${opacity} />`,
            );
          }

          // Start arrowhead (for 'both')
          if (el.arrowHead === 'both') {
            const reverseAngle = angle + Math.PI;
            const p1x = x1 - headSize * cos(reverseAngle - Math.PI / 6);
            const p1y = y1 - headSize * sin(reverseAngle - Math.PI / 6);
            const p2x = x1 - headSize * cos(reverseAngle + Math.PI / 6);
            const p2y = y1 - headSize * sin(reverseAngle + Math.PI / 6);
            elements.push(
              `<polygon points="${x1.toFixed(2)},${y1.toFixed(2)} ${p1x.toFixed(2)},${p1y.toFixed(2)} ${p2x.toFixed(2)},${p2y.toFixed(2)}" fill="${stroke}"${opacity} />`,
            );
          }
        }
        break;
      }

      case 'path': {
        if (el.path) {
          const stroke = escapeXml(el.strokeColor || el.color || '#000000');
          const strokeWidth = el.strokeW || 2;
          elements.push(
            `<path d="${escapeXml(el.path)}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"${opacity}${rotation} />`,
          );
        }
        break;
      }

      case 'triangle': {
        const pts = trianglePoints(el.x, el.y, el.w, el.h);
        elements.push(
          `<polygon points="${pts}" fill="${fill}"${opacity}${rotation} />`,
        );
        break;
      }

      case 'star': {
        const cx = el.x + el.w / 2;
        const cy = el.y + el.h / 2;
        const outerR = Math.min(el.w, el.h) / 2;
        const innerR = outerR * 0.382; // golden ratio inner radius
        const pts = starPoints(cx, cy, outerR, innerR);
        elements.push(
          `<polygon points="${pts}" fill="${fill}"${opacity}${rotation} />`,
        );
        break;
      }

      case 'table': {
        // Render table as a grid of rects with text
        const rows = el.rows || 1;
        const cols = el.cols || 1;
        const cellH = el.cellHeight || el.h / rows;
        const defaultCellW = el.w / cols;

        // Table border
        elements.push(
          `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${rows * cellH}" fill="${fill}" stroke="#666" stroke-width="1"${opacity}${rotation} />`,
        );

        for (let r = 0; r < rows; r++) {
          let cellX = el.x;
          for (let c = 0; c < cols; c++) {
            const cellW = el.cellWidths?.[c] || defaultCellW;
            const cellY = el.y + r * cellH;

            // Cell border
            elements.push(
              `<rect x="${cellX}" y="${cellY}" width="${cellW}" height="${cellH}" fill="none" stroke="#666" stroke-width="0.5"${opacity} />`,
            );

            // Cell text
            const cellText = el.cellData?.[r]?.[c];
            if (cellText) {
              elements.push(
                `<text x="${cellX + 4}" y="${cellY + cellH / 2 + 4}" font-family="sans-serif" font-size="12" fill="${escapeXml(el.color || '#000')}"${opacity}>${escapeXml(cellText)}</text>`,
              );
            }

            cellX += cellW;
          }
        }
        break;
      }
    }
  }

  const defsBlock = defs.length > 0 ? `<defs>${defs.join('')}</defs>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">${defsBlock}${elements.join('')}</svg>`;
}
