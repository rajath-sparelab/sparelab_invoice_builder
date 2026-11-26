/**
 * Page layout constants and helpers shared by the renderer and (later) the
 * server-side PDF renderer. Units are pixels at 96 DPI (1in = 96px).
 *
 * A4 portrait at 96 DPI: 210mm x 297mm ≈ 794px x 1123px.
 */

export type PageSizeName = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal';

export interface PageSize {
  width: number;
  height: number;
}

export const PAGE_SIZES: Record<PageSizeName, PageSize> = {
  A4: { width: 794, height: 1123 },
  A3: { width: 1123, height: 1591 },
  A5: { width: 559, height: 794 },
  Letter: { width: 816, height: 1056 },
  Legal: { width: 816, height: 1344 },
};

export const DEFAULT_MARGINS = { top: 20, right: 20, bottom: 20, left: 20 };

/**
 * Content box dimensions (page minus margins) in pixels.
 */
export function contentBox(
  pageSize: PageSizeName,
  orientation: 'portrait' | 'landscape',
  margins: { top: number; right: number; bottom: number; left: number },
): { width: number; height: number; pageWidth: number; pageHeight: number } {
  const base = PAGE_SIZES[pageSize];
  const pageWidth = orientation === 'landscape' ? base.height : base.width;
  const pageHeight = orientation === 'landscape' ? base.width : base.height;
  return {
    width: pageWidth - margins.left - margins.right,
    height: pageHeight - margins.top - margins.bottom,
    pageWidth,
    pageHeight,
  };
}
