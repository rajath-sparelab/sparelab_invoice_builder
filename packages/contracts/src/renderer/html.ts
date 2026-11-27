import type { DocumentData, JsonValue } from '../schemas/document-data';
import type { Block, TemplateConfiguration } from '../schemas/template-config';
import { contentBox, DEFAULT_MARGINS } from './layout';
import { evaluateVisibility } from './visibility';
import { getBindingPath, resolveBindingText } from './binding';
import { blockToStyle } from './block-styles';

type StyleMap = Record<string, JsonValue>;

/**
 * CSS class names shared between the React DocumentRenderer and the Puppeteer
 * HTML renderer so both produce visually identical output.
 *
 * Keep these in sync with the Tailwind classes used in
 * apps/web/src/components/renderer/DocumentRenderer.tsx and blocks/*.tsx.
 */
const CSS = {
  page: 'document-page',
  content: 'document-content',
  header: 'document-header',
  footer: 'document-footer',
  text: 'document-text',
  image: 'document-image',
  imagePlaceholder: 'document-image-placeholder',
  divider: 'document-divider',
  spacer: 'document-spacer',
  table: 'document-table',
  tableCell: 'document-table-cell',
  tableHeaderCell: 'document-table-header-cell',
  emptyTable: 'document-empty-table',
};

/**
 * Render a single validated block into HTML. Mirrors the React block
 * renderers in apps/web/src/components/renderer/blocks/. All values are
 * text-only; no HTML or JavaScript is ever emitted from block data.
 */
function renderBlock(block: Block, data: DocumentData): string {
  if (block.visible === false) return '';

  const styleAttr = blockToStyle(block.style as StyleMap | undefined);

  switch (block.type) {
    case 'text': {
      const text = block.binding
        ? resolveBindingText(data, block.binding as string)
        : block.content ?? '';
      return `
        <div class="${CSS.text}" style="${styleAttr}">${escapeHtml(text)}</div>
      `;
    }
    case 'image': {
      const isBinding = /^{{\s*[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*\s*}}$/.test(
        block.src,
      );
      const src = isBinding ? resolveBindingText(data, block.src) : block.src;
      const isValidUrl =
        typeof src === 'string' && /^https?:\/\/[^\s<>]+$/.test(src);
      const width =
        typeof block.width === 'number' ? `width:${block.width}px;` : '';
      const height =
        typeof block.height === 'number' ? `height:${block.height}px;` : '';
      const textAlign = block.style?.textAlign ?? 'center';
      if (!isValidUrl) {
        return `
          <div class="${CSS.imagePlaceholder}" style="${styleAttr};text-align:${textAlign}">
            <div style="display:inline-flex;flex-direction:column;align-items:center;gap:8px;width:96px;height:96px;border:1px dashed #cbd5e1;border-radius:6px;color:#64748b;font-size:12px">
              ${escapeHtml(block.alt ?? 'Image')}
            </div>
          </div>
        `;
      }
      return `
        <div class="${CSS.image}" style="${styleAttr};text-align:${textAlign}">
          <img
            src="${escapeHtml(src)}"
            alt="${escapeHtml(block.alt ?? '')}"
            style="max-width:100%;height:auto;${width}${height}"
          />
        </div>
      `;
    }
    case 'divider':
      return `<div class="${CSS.divider}" style="${styleAttr}"></div>`;
    case 'spacer': {
      const height = typeof block.height === 'number' ? block.height : 16;
      return `<div class="${CSS.spacer}" style="${styleAttr};height:${height}px"></div>`;
    }
    case 'table': {
      const isRepeating =
        typeof block.repeat === 'string' && block.repeat.length > 0;
      const rows: string[][] = [];
      if (isRepeating) {
        const collectionPath = getBindingPath(block.repeat as string);
        if (collectionPath !== null) {
          const firstSegment = collectionPath.split('.')[0];
          const collection = data[firstSegment];
          const items = Array.isArray(collection) ? collection : [];
          for (const item of items) {
            rows.push(
              block.columns.map((col) => {
                const cell = `{{${col.key}}}`;
                const bindingPath = getBindingPath(cell);
                if (bindingPath === null) return cell;
                return resolveBindingText(
                  item as Record<string, JsonValue>,
                  `{{${bindingPath}}}`,
                );
              }),
            );
          }
        }
      } else {
        for (const row of block.rows) {
          rows.push(row);
        }
      }

      const headerHtml = block.columns
        .map(
          (col) =>
            `<th class="${CSS.tableHeaderCell}" key="${col.id}">${escapeHtml(col.header)}</th>`,
        )
        .join('');

      const bodyHtml = rows
        .map(
          (row) =>
            `<tr>${row
              .map(
                (cell) =>
                  `<td class="${CSS.tableCell}">${escapeHtml(cell)}</td>`,
              )
              .join('')}</tr>`,
        )
        .join('');

      const emptyHtml =
        rows.length === 0
          ? `<tr><td class="${CSS.emptyTable}" colspan="${block.columns.length}">No items</td></tr>`
          : '';

      return `
        <table class="${CSS.table}" style="${styleAttr}">
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${bodyHtml}${emptyHtml}</tbody>
        </table>
      `;
    }
    default:
      return '';
  }
}

/**
 * Escape HTML so block text is rendered as text, never as HTML or script.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render a full template configuration into a printable HTML document.
 *
 * Layout mirrors the React DocumentRenderer:
 *   - One page per section (pages break between them), sized per config with
 *     margins.
 *   - Header and footer blocks render on every page.
 *   - Sections render in order; `visible`/`visibleWhen` are honoured.
 *   - Block ordering and configured styling are preserved.
 *
 * This is a server-side, presentational HTML renderer. It shares all layout
 * constants and binding/visibility logic with the frontend React renderer via
 * @sparelab/contracts, so the PDF visually matches the LivePreview.
 */
export function renderDocumentHtml(
  config: TemplateConfiguration,
  data: DocumentData,
): string {
  const page = config.page ?? {
    size: 'A4' as const,
    orientation: 'portrait' as const,
    margins: DEFAULT_MARGINS,
  };
  const { width, height, pageWidth, pageHeight } = contentBox(
    page.size,
    page.orientation,
    page.margins,
  );

  const pageStyle = `
    width:${pageWidth}px;
    height:${pageHeight}px;
    margin:0 auto 24px;
    background:#fff;
    position:relative;
    overflow:hidden;
    page-break-after:always;
  `;

  const contentStyle = `
    padding:${page.margins.top}px ${page.margins.right}px ${page.margins.bottom}px ${page.margins.left}px;
    width:${width}px;
    min-height:${height}px;
    box-sizing:border-box;
  `;

  const headerBlocks = config.header?.blocks ?? [];
  const footerBlocks = config.footer?.blocks ?? [];

  const renderHeader = () => {
    if (!config.header || headerBlocks.length === 0) return '';
    const blocksHtml = headerBlocks.map((b) => renderBlock(b, data)).join('');
    return `<div class="${CSS.header}" style="${contentStyle}">${blocksHtml}</div>`;
  };

  const renderFooter = () => {
    if (!config.footer || footerBlocks.length === 0) return '';
    const blocksHtml = footerBlocks.map((b) => renderBlock(b, data)).join('');
    return `<div class="${CSS.footer}" style="${contentStyle};margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0">${blocksHtml}</div>`;
  };

  const renderSection = (section: TemplateConfiguration['sections'][number]) => {
    const visible =
      section.visible !== false &&
      (!section.visibleWhen ||
        evaluateVisibility(data, section.visibleWhen));
    if (!visible) return '';
    const blocksHtml = section.blocks
      .map((b) => renderBlock(b, data))
      .join('');
    return blocksHtml;
  };

  const pagesHtml = config.sections
    .map(
      (section) => `
      <div class="${CSS.page}" style="${pageStyle}">
        ${renderHeader()}
        <div class="${CSS.content}" style="${contentStyle}">${renderSection(section)}</div>
        ${renderFooter()}
      </div>
    `,
    )
    .join('');

  const styleBlock = `
    .${CSS.page} { page-break-after: always; }
    .${CSS.page}:last-child { page-break-after: auto; }
    .${CSS.content} { overflow: hidden; }
    .${CSS.text} { white-space: pre-wrap; }
    .${CSS.table} { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; }
    .${CSS.tableHeaderCell} { border: 1px solid #cbd5e1; padding: 4px 8px; font-size: 12px; font-weight: 600; text-align: left; background-color: #f1f5f9; }
    .${CSS.tableCell} { border: 1px solid #cbd5e1; padding: 4px 8px; font-size: 14px; }
    .${CSS.emptyTable} { border: 1px solid #cbd5e1; padding: 4px 8px; font-size: 12px; color: #64748b; text-align: center; }
    .${CSS.divider} { height: 1px; width: 100%; background-color: #cbd5e1; border: 0; }
    .${CSS.spacer} { width: 100%; }
    .${CSS.image} img { max-width: 100%; height: auto; }
    .${CSS.imagePlaceholder} { display: inline-flex; flex-direction: column; align-items: center; gap: 8px; width: 96px; height: 96px; border: 1px dashed #cbd5e1; border-radius: 6px; color: #64748b; font-size: 12px; }
    .${CSS.header} { margin-bottom: 24px; }
    .${CSS.footer} { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; color: #334155; }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Document</title>
  <style>${styleBlock}</style>
</head>
<body>${pagesHtml}</body>
</html>`;
}
