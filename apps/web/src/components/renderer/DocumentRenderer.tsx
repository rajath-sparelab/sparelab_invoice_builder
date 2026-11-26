'use client';

import React from 'react';
import type { DocumentData, TemplateConfiguration } from '@sparelab/contracts';
import {
  contentBox,
  DEFAULT_MARGINS,
  evaluateVisibility,
} from '@sparelab/contracts';
import { RenderBlockElement } from './blocks';

interface DocumentRendererProps {
  config: TemplateConfiguration;
  data: DocumentData;
}

/**
 * Renders a full document from a template configuration and document data.
 *
 * Layout:
 *   - One page per section (pages break between them), sized per config (A4
 *     default) with margins.
 *   - Header and footer blocks render on every page.
 *   - Sections render in order; `visible`/`visibleWhen` are honoured.
 *   - Block ordering and configured styling are preserved.
 *
 * This is a presentational, React-renderer-only component. It contains no
 * editor-specific UI (no selection, dragging, or property controls) and shares
 * its page layout constants with the server-side renderer via
 * @sparelab/contracts.
 */
export function DocumentRenderer({
  config,
  data,
}: DocumentRendererProps): React.ReactNode {
  const page = config.page ?? {
    size: 'A4',
    orientation: 'portrait',
    margins: DEFAULT_MARGINS,
  };
  const { width, height, pageWidth, pageHeight } = contentBox(
    page.size,
    page.orientation,
    page.margins,
  );

  const pageStyle: React.CSSProperties = {
    width: `${pageWidth}px`,
    height: `${pageHeight}px`,
    margin: '0 auto 24px',
    background: '#fff',
    position: 'relative',
    overflow: 'hidden',
    pageBreakAfter: 'always',
  };

  const contentStyle: React.CSSProperties = {
    padding: `${page.margins.top}px ${page.margins.right}px ${page.margins.bottom}px ${page.margins.left}px`,
    width: `${width}px`,
    minHeight: `${height}px`,
    boxSizing: 'border-box',
  };

  const headerBlocks = config.header?.blocks ?? [];
  const footerBlocks = config.footer?.blocks ?? [];

  const renderHeader = () => (
    <div style={contentStyle} className="mb-6">
      {headerBlocks.map((block) => (
        <React.Fragment key={block.id}>
          <RenderBlockElement block={block} data={data} />
        </React.Fragment>
      ))}
    </div>
  );

  const renderFooter = () => (
    <div style={contentStyle} className="mt-6 pt-4 border-t border-muted/30">
      {footerBlocks.map((block) => (
        <React.Fragment key={block.id}>
          <RenderBlockElement block={block} data={data} />
        </React.Fragment>
      ))}
    </div>
  );

  const renderSection = (section: TemplateConfiguration['sections'][number]) => {
    const visible =
      section.visible !== false &&
      (!section.visibleWhen ||
        evaluateVisibility(data, section.visibleWhen));
    if (!visible) return null;
    return (
      <React.Fragment key={section.id}>
        {section.blocks.map((block) => {
          if (
            block.visible === false ||
            (block.visibleWhen &&
              !evaluateVisibility(data, block.visibleWhen))
          ) {
            return null;
          }
          return (
            <React.Fragment key={block.id}>
              <RenderBlockElement block={block} data={data} />
            </React.Fragment>
          );
        })}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 text-muted-foreground">
      {config.sections.map((section, pageIndex) => (
        <div key={`page-${pageIndex}`} style={pageStyle}>
          {config.header && headerBlocks.length > 0 && renderHeader()}
          <div className="relative" style={contentStyle}>
            {renderSection(section)}
          </div>
          {config.footer && footerBlocks.length > 0 && renderFooter()}
        </div>
      ))}
    </div>
  );
}
