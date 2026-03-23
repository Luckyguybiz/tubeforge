import type { CanvasElement } from '@/lib/types';

const DPI_STANDARD = 72;
const DPI_PRINT = 300;

/**
 * Convert pixel value to PDF points at the given DPI.
 */
function pxToPoints(px: number, dpi: number): number {
  return (px / dpi) * 72;
}

/**
 * Parse a hex or named color to RGB components.
 * Returns [r, g, b] in 0-255 range.
 */
function parseColor(color: string): [number, number, number] {
  // Handle hex colors
  const hex = color.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
    ];
  }
  // Handle rgb() / rgba()
  const rgbMatch = color.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/,
  );
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  }
  // Default to black
  return [0, 0, 0];
}

/**
 * Get dash pattern for jsPDF line style.
 */
function applyDashStyle(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  style?: 'solid' | 'dashed' | 'dotted',
): void {
  switch (style) {
    case 'dashed':
      doc.setLineDashPattern([8, 4], 0);
      break;
    case 'dotted':
      doc.setLineDashPattern([2, 4], 0);
      break;
    default:
      doc.setLineDashPattern([], 0);
      break;
  }
}

/**
 * Generate 5-pointed star polygon coordinates.
 */
function getStarPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  return points;
}

/**
 * Render complex elements (gradients, rotated shapes, etc.) via an offscreen
 * canvas 2D context and add as an image to the PDF.
 */
function renderViaCanvas(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  el: CanvasElement,
  dpi: number,
): boolean {
  if (typeof document === 'undefined') return false;

  try {
    const scale = dpi / 72;
    const padding = 4;
    const cw = (el.w + padding * 2) * scale;
    const ch = (el.h + padding * 2) * scale;

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(cw);
    canvas.height = Math.ceil(ch);
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.scale(scale, scale);
    ctx.translate(padding, padding);

    // Apply rotation around element center
    if (el.rot) {
      ctx.translate(el.w / 2, el.h / 2);
      ctx.rotate((el.rot * Math.PI) / 180);
      ctx.translate(-el.w / 2, -el.h / 2);
    }

    // Apply opacity
    if (el.opacity !== undefined) {
      ctx.globalAlpha = el.opacity;
    }

    const fill = el.bg || el.color || '#000000';

    switch (el.type) {
      case 'rect':
      case 'stickyNote': {
        ctx.fillStyle =
          el.type === 'stickyNote'
            ? el.noteColor || el.bg || '#FFEB3B'
            : fill;
        const r = el.borderR || 0;
        ctx.beginPath();
        ctx.roundRect(0, 0, el.w, el.h, r);
        ctx.fill();
        if (el.border) {
          ctx.strokeStyle = el.border;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        break;
      }
      case 'triangle': {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(el.w / 2, 0);
        ctx.lineTo(0, el.h);
        ctx.lineTo(el.w, el.h);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'star': {
        const cx = el.w / 2;
        const cy = el.h / 2;
        const outerR = Math.min(el.w, el.h) / 2;
        const innerR = outerR * 0.382;
        const pts = getStarPoints(cx, cy, outerR, innerR);
        ctx.fillStyle = fill;
        ctx.beginPath();
        pts.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        break;
      }
      default:
        return false;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const ptX = pxToPoints(el.x - padding, dpi);
    const ptY = pxToPoints(el.y - padding, dpi);
    const ptW = pxToPoints(el.w + padding * 2, dpi);
    const ptH = pxToPoints(el.h + padding * 2, dpi);
    doc.addImage(dataUrl, 'PNG', ptX, ptY, ptW, ptH);
    return true;
  } catch {
    return false;
  }
}

/**
 * Export canvas elements to a PDF file and trigger a browser download.
 *
 * @param els - Array of canvas elements in z-order
 * @param canvasBg - Background color of the canvas
 * @param canvasW - Canvas width in pixels
 * @param canvasH - Canvas height in pixels
 * @param quality - 'standard' (72 DPI) or 'print' (300 DPI)
 */
export async function exportToPDF(
  els: CanvasElement[],
  canvasBg: string,
  canvasW: number,
  canvasH: number,
  quality: 'standard' | 'print' = 'standard',
): Promise<void> {
  try {
    const { jsPDF } = await import('jspdf');

    const dpi = quality === 'print' ? DPI_PRINT : DPI_STANDARD;
    const pageW = pxToPoints(canvasW, dpi);
    const pageH = pxToPoints(canvasH, dpi);

    const doc = new jsPDF({
      orientation: pageW > pageH ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [pageW, pageH],
      compress: true,
    });

    // Render background
    const [bgR, bgG, bgB] = parseColor(canvasBg);
    doc.setFillColor(bgR, bgG, bgB);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Render elements in z-order (array order)
    for (const el of els) {
      if (el.visible === false) continue;

      const hasRotation = !!el.rot;
      const hasGradient =
        el.bg?.includes('linear-gradient') ||
        el.bg?.includes('radial-gradient');

      // For rotated or gradient-filled shapes, use canvas fallback
      if (
        (hasRotation || hasGradient) &&
        ['rect', 'stickyNote', 'triangle', 'star'].includes(el.type)
      ) {
        if (renderViaCanvas(doc, el, dpi)) continue;
      }

      switch (el.type) {
        case 'text': {
          const fontSize = el.size || 16;
          const ptSize = pxToPoints(fontSize, dpi) * dpi / 72; // keep font size consistent
          const textColor = parseColor(el.color || '#000000');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.setFontSize(ptSize);

          // Set font style
          const style =
            el.bold && el.italic
              ? 'bolditalic'
              : el.bold
                ? 'bold'
                : el.italic
                  ? 'italic'
                  : 'normal';
          try {
            doc.setFont('helvetica', style);
          } catch {
            doc.setFont('helvetica', 'normal');
          }

          const textX = pxToPoints(
            el.textAlign === 'center'
              ? el.x + el.w / 2
              : el.textAlign === 'right'
                ? el.x + el.w
                : el.x,
            dpi,
          );
          const textY = pxToPoints(el.y + fontSize, dpi);
          const align =
            el.textAlign === 'center'
              ? 'center'
              : el.textAlign === 'right'
                ? 'right'
                : 'left';

          // Render text background if present
          if (el.bg && !hasGradient) {
            const [r, g, b] = parseColor(el.bg);
            doc.setFillColor(r, g, b);
            doc.roundedRect(
              pxToPoints(el.x, dpi),
              pxToPoints(el.y, dpi),
              pxToPoints(el.w, dpi),
              pxToPoints(el.h, dpi),
              pxToPoints(el.borderR || 0, dpi),
              pxToPoints(el.borderR || 0, dpi),
              'F',
            );
          }

          doc.text(el.text || '', textX, textY, { align });
          break;
        }

        case 'rect':
        case 'stickyNote': {
          const fillColor =
            el.type === 'stickyNote'
              ? el.noteColor || el.bg || '#FFEB3B'
              : el.bg || '#cccccc';
          const [r, g, b] = parseColor(fillColor);
          doc.setFillColor(r, g, b);

          const rx = pxToPoints(el.x, dpi);
          const ry = pxToPoints(el.y, dpi);
          const rw = pxToPoints(el.w, dpi);
          const rh = pxToPoints(el.h, dpi);
          const br = pxToPoints(el.borderR || 0, dpi);

          let drawStyle: 'F' | 'FD' = 'F';
          if (el.border) {
            const [br2, bg2, bb2] = parseColor(el.border);
            doc.setDrawColor(br2, bg2, bb2);
            doc.setLineWidth(1);
            drawStyle = 'FD';
          }

          if (br > 0) {
            doc.roundedRect(rx, ry, rw, rh, br, br, drawStyle);
          } else {
            doc.rect(rx, ry, rw, rh, drawStyle);
          }

          // Sticky note text
          if (el.type === 'stickyNote' && el.noteText) {
            const tc = parseColor(el.color || '#000000');
            doc.setTextColor(tc[0], tc[1], tc[2]);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text(el.noteText, rx + 6, ry + 16);
          }
          break;
        }

        case 'circle': {
          const fillColor = el.bg || el.color || '#cccccc';
          const [r, g, b] = parseColor(fillColor);
          doc.setFillColor(r, g, b);

          const cx = pxToPoints(el.x + el.w / 2, dpi);
          const cy = pxToPoints(el.y + el.h / 2, dpi);
          const rx = pxToPoints(el.w / 2, dpi);
          const ry = pxToPoints(el.h / 2, dpi);

          doc.ellipse(cx, cy, rx, ry, 'F');
          break;
        }

        case 'image': {
          if (el.src) {
            try {
              const ix = pxToPoints(el.x, dpi);
              const iy = pxToPoints(el.y, dpi);
              const iw = pxToPoints(el.w, dpi);
              const ih = pxToPoints(el.h, dpi);

              // Determine format from data URL or default to PNG
              let format = 'PNG';
              if (el.src.includes('image/jpeg') || el.src.includes('image/jpg')) {
                format = 'JPEG';
              }

              doc.addImage(el.src, format, ix, iy, iw, ih);
            } catch {
              // Skip images that fail to render
            }
          }
          break;
        }

        case 'line':
        case 'arrow': {
          const strokeColor = parseColor(el.strokeColor || el.color || '#000000');
          doc.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
          doc.setLineWidth(pxToPoints(el.lineWidth || el.strokeW || 2, dpi));
          applyDashStyle(doc, el.dashStyle);

          const x1 = pxToPoints(el.x, dpi);
          const y1 = pxToPoints(el.y, dpi);
          const x2 = pxToPoints(el.x2 ?? el.x + el.w, dpi);
          const y2 = pxToPoints(el.y2 ?? el.y + el.h, dpi);

          doc.line(x1, y1, x2, y2);

          // Reset dash
          doc.setLineDashPattern([], 0);

          // Arrowhead
          if (el.type === 'arrow' || (el.arrowHead && el.arrowHead !== 'none')) {
            const headSize = pxToPoints((el.lineWidth || el.strokeW || 2) * 4, dpi);
            const angle = Math.atan2(y2 - y1, x2 - x1);

            doc.setFillColor(strokeColor[0], strokeColor[1], strokeColor[2]);

            // End arrowhead
            const p1x = x2 - headSize * Math.cos(angle - Math.PI / 6);
            const p1y = y2 - headSize * Math.sin(angle - Math.PI / 6);
            const p2x = x2 - headSize * Math.cos(angle + Math.PI / 6);
            const p2y = y2 - headSize * Math.sin(angle + Math.PI / 6);
            doc.triangle(x2, y2, p1x, p1y, p2x, p2y, 'F');

            // Start arrowhead (for 'both')
            if (el.arrowHead === 'both') {
              const ra = angle + Math.PI;
              const s1x = x1 - headSize * Math.cos(ra - Math.PI / 6);
              const s1y = y1 - headSize * Math.sin(ra - Math.PI / 6);
              const s2x = x1 - headSize * Math.cos(ra + Math.PI / 6);
              const s2y = y1 - headSize * Math.sin(ra + Math.PI / 6);
              doc.triangle(x1, y1, s1x, s1y, s2x, s2y, 'F');
            }
          }
          break;
        }

        case 'path': {
          // Paths are complex; render via canvas fallback if available
          if (el.path && typeof document !== 'undefined') {
            try {
              const strokeColor = el.strokeColor || el.color || '#000000';
              const strokeWidth = el.strokeW || 2;
              const padding = strokeWidth * 2;

              const canvas = document.createElement('canvas');
              const scale = dpi / 72;
              canvas.width = Math.ceil((el.w + padding * 2) * scale);
              canvas.height = Math.ceil((el.h + padding * 2) * scale);
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.scale(scale, scale);
                ctx.translate(padding - el.x, padding - el.y);
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.stroke(new Path2D(el.path));

                const dataUrl = canvas.toDataURL('image/png');
                doc.addImage(
                  dataUrl,
                  'PNG',
                  pxToPoints(el.x - padding, dpi),
                  pxToPoints(el.y - padding, dpi),
                  pxToPoints(el.w + padding * 2, dpi),
                  pxToPoints(el.h + padding * 2, dpi),
                );
              }
            } catch {
              // Skip paths that fail
            }
          }
          break;
        }

        case 'triangle': {
          const fillColor = el.bg || el.color || '#cccccc';
          const [r, g, b] = parseColor(fillColor);
          doc.setFillColor(r, g, b);

          const tx1 = pxToPoints(el.x + el.w / 2, dpi);
          const ty1 = pxToPoints(el.y, dpi);
          const tx2 = pxToPoints(el.x, dpi);
          const ty2 = pxToPoints(el.y + el.h, dpi);
          const tx3 = pxToPoints(el.x + el.w, dpi);
          const ty3 = pxToPoints(el.y + el.h, dpi);

          doc.triangle(tx1, ty1, tx2, ty2, tx3, ty3, 'F');
          break;
        }

        case 'star': {
          // Stars use canvas fallback for accurate rendering
          if (!renderViaCanvas(doc, el, dpi)) {
            // Minimal fallback: render as a filled circle
            const fillColor = el.bg || el.color || '#cccccc';
            const [r, g, b] = parseColor(fillColor);
            doc.setFillColor(r, g, b);
            const cx = pxToPoints(el.x + el.w / 2, dpi);
            const cy = pxToPoints(el.y + el.h / 2, dpi);
            const radius = pxToPoints(Math.min(el.w, el.h) / 2, dpi);
            doc.circle(cx, cy, radius, 'F');
          }
          break;
        }

        case 'table': {
          const rows = el.rows || 1;
          const cols = el.cols || 1;
          const cellH = el.cellHeight || el.h / rows;
          const defaultCellW = el.w / cols;

          // Table background
          const tableFill = el.bg || '#ffffff';
          const [tr, tg, tb] = parseColor(tableFill);
          doc.setFillColor(tr, tg, tb);
          doc.rect(
            pxToPoints(el.x, dpi),
            pxToPoints(el.y, dpi),
            pxToPoints(el.w, dpi),
            pxToPoints(rows * cellH, dpi),
            'F',
          );

          // Grid lines and cell text
          doc.setDrawColor(102, 102, 102);
          doc.setLineWidth(0.5);
          const tc = parseColor(el.color || '#000000');
          doc.setTextColor(tc[0], tc[1], tc[2]);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');

          for (let r = 0; r < rows; r++) {
            let cellX = el.x;
            for (let c = 0; c < cols; c++) {
              const cellW = el.cellWidths?.[c] || defaultCellW;
              const cellY = el.y + r * cellH;

              // Cell border
              doc.rect(
                pxToPoints(cellX, dpi),
                pxToPoints(cellY, dpi),
                pxToPoints(cellW, dpi),
                pxToPoints(cellH, dpi),
                'S',
              );

              // Cell text
              const cellText = el.cellData?.[r]?.[c];
              if (cellText) {
                doc.text(
                  cellText,
                  pxToPoints(cellX + 4, dpi),
                  pxToPoints(cellY + cellH / 2 + 4, dpi),
                );
              }

              cellX += cellW;
            }
          }
          break;
        }
      }
    }

    // Trigger download
    doc.save('canvas-export.pdf');
  } catch (error) {
    console.error('[exportToPDF] Failed to generate PDF:', error);
    throw error;
  }
}
