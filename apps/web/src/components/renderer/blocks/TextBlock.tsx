'use client';

import React from 'react';
import type { DocumentData } from '@sparelab/contracts';
import { resolveBindingText } from '@sparelab/contracts';
import { RenderBlock } from './RenderBlock';

interface TextBlockProps {
  block: {
    id: string;
    content: string;
    binding?: string;
    style?: Record<string, string | number | boolean>;
    visible?: boolean;
  };
  data: DocumentData;
}

/**
 * Renders a text block. Content is text-only (never HTML) and bindings are
 * resolved against the supplied document data. Escaped for safe display.
 */
export function TextBlock({ block, data }: TextBlockProps) {
  const text = block.binding
    ? resolveBindingText(data, block.binding)
    : block.content;

  return (
    <RenderBlock block={block}>
      <div className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    </RenderBlock>
  );
}
