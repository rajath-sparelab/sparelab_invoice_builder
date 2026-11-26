'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { toStyle } from '../utils';

interface RenderBlockProps {
  block: {
    id: string;
    style?: Record<string, string | number | boolean>;
    visible?: boolean;
  };
  children: React.ReactNode;
}

/**
 * Wraps a rendered block, applying visibility, style and a stable key.
 * Blocks that are not visible (or fail a visibility condition) render nothing.
 */
export function RenderBlock({
  block,
  children,
}: RenderBlockProps): React.ReactNode {
  if (block.visible === false) return null;
  if (!children) return null;

  return (
    <div
      className={cn(
        'break-inside-avoid',
        block.style?.pageBreakBefore === 'always' && 'break-before-page',
        block.style?.pageBreakAfter === 'always' && 'break-after-page',
      )}
      style={toStyle(block.style)}
    >
      {children}
    </div>
  );
}
