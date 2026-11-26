'use client';

import React from 'react';
import { RenderBlock } from './RenderBlock';

interface DividerBlockProps {
  block: {
    id: string;
    style?: Record<string, string | number | boolean>;
    visible?: boolean;
  };
}

/**
 * Renders a horizontal divider rule.
 */
export function DividerBlock({ block }: DividerBlockProps) {
  return (
    <RenderBlock block={block}>
      <div className="h-[1px] w-full bg-muted border-0" />
    </RenderBlock>
  );
}
