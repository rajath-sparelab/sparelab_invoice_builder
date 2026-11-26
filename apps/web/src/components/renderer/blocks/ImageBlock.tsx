'use client';

import React from 'react';
import type { DocumentData } from '@sparelab/contracts';
import { resolveBindingText } from '@sparelab/contracts';
import { RenderBlock } from './RenderBlock';

interface ImageBlockProps {
  block: {
    id: string;
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    style?: Record<string, string | number | boolean>;
    visible?: boolean;
  };
  data: DocumentData;
}

/**
 * Renders an image block. The `src` is either an absolute URL or a
 * `{{binding}}` resolved against document data. Only `http(s)` URLs or resolved
 * binding values are rendered; anything else falls back to the alt text.
 * No arbitrary HTML or `javascript:` URLs can be rendered.
 */
export function ImageBlock({ block, data }: ImageBlockProps) {
  const isBinding = /^{{\s*[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*\s*}}$/.test(block.src);
  const src = isBinding ? resolveBindingText(data, block.src) : block.src;

  const isValidUrl =
    typeof src === 'string' && /^https?:\/\/[^\s<>]+$/.test(src);

  return (
    <RenderBlock block={block}>
      <div
        style={{
          textAlign: (block.style?.textAlign ?? 'center') as
            | React.CSSProperties['textAlign']
            | undefined,
        }}
      >
        {isValidUrl ? (
          <img
            src={src}
            alt={block.alt ?? ''}
            style={{
              maxWidth: '100%',
              height: 'auto',
              ...(typeof block.width === 'number' ? { width: block.width } : {}),
              ...(typeof block.height === 'number' ? { height: block.height } : {}),
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 h-24 w-24 border border-dashed rounded-md text-muted-foreground text-xs">
            {block.alt ?? 'Image'}
          </div>
        )}
      </div>
    </RenderBlock>
  );
}
