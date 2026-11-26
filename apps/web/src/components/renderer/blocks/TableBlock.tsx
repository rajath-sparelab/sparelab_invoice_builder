'use client';

import React from 'react';
import type { DocumentData } from '@sparelab/contracts';
import { getBindingPath, resolveBindingText } from '@sparelab/contracts';
import { RenderBlock } from './RenderBlock';

interface TableBlockProps {
  block: {
    id: string;
    columns: Array<{ id: string; header: string; key: string }>;
    rows: string[][];
    repeat?: string;
    style?: Record<string, string | number | boolean>;
    visible?: boolean;
  };
  data: DocumentData;
}

/**
 * Resolve a single cell string against a row item. Cell strings may be:
 *   - a binding like "{{quantity}}" resolved against the item,
 *   - any other string treated as a literal value.
 * Missing bindings render as an empty string.
 */
function resolveCell(cell: string, item: Record<string, unknown>): string {
  const bindingPath = getBindingPath(cell);
  if (bindingPath === null) return cell;
  return resolveBindingText(item as DocumentData, `{{${bindingPath}}}`);
}

/**
 * Renders a table. When `repeat` is set, the collection bound by `repeat` is
 * iterated and each item produces one row (cells are bindings resolved against
 * the item). Otherwise the static `rows` are rendered as-is.
 * All cell values are text — no HTML is rendered.
 */
export function TableBlock({ block, data }: TableBlockProps) {
  const isRepeating = typeof block.repeat === 'string' && block.repeat.length > 0;

  const rows: string[][] = [];
  if (isRepeating) {
    const collectionPath = getBindingPath(block.repeat as string);
    if (collectionPath !== null) {
      const firstSegment = collectionPath.split('.')[0];
      const collection = data[firstSegment];
      const items = Array.isArray(collection)
        ? (collection as Array<Record<string, unknown>>)
        : [];
      for (const item of items) {
        rows.push(
          block.columns.map((col) =>
            resolveCell(`{{${col.key}}}`, item as DocumentData),
          ),
        );
      }
    }
  } else {
    for (const row of block.rows) {
      rows.push(row);
    }
  }

  return (
    <RenderBlock block={block}>
      <table className="w-full text-sm border-collapse border border-muted">
        <thead>
          <tr>
            {block.columns.map((col) => (
              <th
                key={col.id}
                className="border border-muted px-2 py-1 text-left text-xs font-semibold bg-muted/50"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-muted/30">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border border-muted/30 px-2 py-1">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={block.columns.length}
                className="border border-muted px-2 py-1 text-xs text-muted-foreground text-center"
              >
                No items
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </RenderBlock>
  );
}
