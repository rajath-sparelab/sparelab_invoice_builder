'use client';

import React from 'react';
import { Image as ImageIcon, Table as TableIcon, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockRendererProps {
  block: {
    id: string;
    type: 'text' | 'image' | 'table' | 'divider' | 'spacer';
    content?: string;
    binding?: string;
    src?: string;
    alt?: string;
    width?: number;
    height?: number;
    style?: Record<string, string | number | boolean>;
    visible?: boolean;
  };
  selected: boolean;
  onSelect: () => void;
}

/**
 * Renders an individual block on the document canvas as a visual preview.
 * This is a visual representation only — the source of truth is the structured
 * JSON configuration, not rendered HTML.
 */
export function BlockRenderer({
  block,
  selected,
  onSelect,
}: BlockRendererProps) {
  const style: React.CSSProperties = {
    ...(typeof block.style?.color === 'string' && { color: block.style.color }),
    ...(typeof block.style?.fontSize === 'string' || typeof block.style?.fontSize === 'number'
      ? { fontSize: block.style.fontSize }
      : {}),
    ...(typeof block.style?.fontWeight === 'string' || typeof block.style?.fontWeight === 'number'
      ? { fontWeight: block.style.fontWeight }
      : {}),
    ...(typeof block.style?.textAlign === 'string' && { textAlign: block.style.textAlign as React.CSSProperties['textAlign'] }),
    ...(typeof block.style?.padding === 'string' || typeof block.style?.padding === 'number'
      ? { padding: block.style.padding }
      : {}),
    ...(typeof block.style?.margin === 'string' || typeof block.style?.margin === 'number'
      ? { margin: block.style.margin }
      : {}),
    ...(typeof block.style?.backgroundColor === 'string' && {
      backgroundColor: block.style.backgroundColor,
    }),
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'rounded-md border p-2 cursor-pointer transition-all duration-200',
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-transparent hover:border-muted/50',
      )}
      style={style}
    >
      {block.type === 'text' && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            {block.content || block.binding || 'Text block'}
          </span>
          {block.binding && (
            <span className="text-[10px] text-primary-foreground bg-primary/10 px-1.5 rounded">
              {'{{binding}}'}
            </span>
          )}
        </div>
      )}
      {block.type === 'image' && (
        <div className="flex flex-col items-center gap-2 h-24 w-24 border border-dashed rounded-md">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {block.src || 'Image'}
          </span>
        </div>
      )}
      {block.type === 'table' && (
        <div className="flex flex-col items-center gap-2 p-3 border border-dashed rounded-md bg-gray-50">
          <TableIcon className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Table ({block.width ?? 3} cols × {block.height ?? 3} rows)
          </span>
        </div>
      )}
      {block.type === 'divider' && (
        <div className="h-px w-full border-t border-muted" />
      )}
      {block.type === 'spacer' && (
        <div className="h-4 w-full bg-transparent" />
      )}
    </div>
  );
}
