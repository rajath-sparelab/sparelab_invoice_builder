'use client';

import React from 'react';
import type { Block, DocumentData } from '@sparelab/contracts';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { TableBlock } from './TableBlock';
import { DividerBlock } from './DividerBlock';
import { SpacerBlock } from './SpacerBlock';

interface RenderBlockElementProps {
  block: Block;
  data: DocumentData;
}

/**
 * Dispatches a validated block to the correct renderer. Unknown block types
 * render nothing (safe fallback). This keeps the renderer separate from
 * editor-specific UI components.
 */
export function RenderBlockElement({ block, data }: RenderBlockElementProps) {
  switch (block.type) {
    case 'text':
      return <TextBlock key={block.id} block={block} data={data} />;
    case 'image':
      return <ImageBlock key={block.id} block={block} data={data} />;
    case 'table':
      return <TableBlock key={block.id} block={block} data={data} />;
    case 'divider':
      return <DividerBlock key={block.id} block={block} />;
    case 'spacer':
      return <SpacerBlock key={block.id} block={block} />;
    default:
      return null;
  }
}
