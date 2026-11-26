'use client';

import React from 'react';
import { RenderBlock } from './RenderBlock';

interface SpacerBlockProps {
  block: {
    id: string;
    height?: number;
    style?: Record<string, string | number | boolean>;
    visible?: boolean;
  };
}

/**
 * Renders a vertical spacer of configurable height.
 */
export function SpacerBlock({ block }: SpacerBlockProps) {
  return (
    <RenderBlock block={block}>
      <div
        className="w-full"
        style={{
          height: typeof block.height === 'number' ? `${block.height}px` : '16px',
        }}
      />
    </RenderBlock>
  );
}
