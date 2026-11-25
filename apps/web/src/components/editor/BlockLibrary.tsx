'use client';

import { useSensor, useSensors } from '@dnd-kit/core';
import { PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import {
  Plus,
  Image,
  Table,
  Minus,
  Layout,
  FileText,
  Scissors,
  Copy,
  AlignLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BlockLibraryItem {
  id: string;
  type: 'text' | 'image' | 'table' | 'section' | 'divider' | 'spacer';
  label: string;
  category: string;
  icon: React.ReactNode;
  description: string;
}

interface BlockLibraryProps {
  onAddBlock: (blockType: BlockLibraryItem['type']) => void;
}

const BLOCKS: BlockLibraryItem[] = [
  {
    id: 'block-text',
    type: 'text',
    label: 'Text',
    category: 'Content',
    icon: <FileText className="h-4 w-4" />,
    description: 'Rich text with optional dynamic binding',
  },
  {
    id: 'block-image',
    type: 'image',
    label: 'Image',
    category: 'Content',
    icon: <Image className="h-4 w-4" />,
    description: 'Image from URL or dynamic binding',
  },
  {
    id: 'block-table',
    type: 'table',
    label: 'Table',
    category: 'Content',
    icon: <Table className="h-4 w-4" />,
    description: 'Data table with column definitions',
  },
  {
    id: 'block-repeating-table',
    type: 'table',
    label: 'Repeating Table',
    category: 'Content',
    icon: <Table className="h-4 w-4" />,
    description: 'Table bound to a collection (e.g. items)',
  },
  {
    id: 'block-divider',
    type: 'divider',
    label: 'Divider',
    category: 'Content',
    icon: <Minus className="h-4 w-4" />,
    description: 'Horizontal rule between sections',
  },
  {
    id: 'block-spacer',
    type: 'spacer',
    label: 'Spacer',
    category: 'Content',
    icon: <Minus className="h-4 w-4" />,
    description: 'Adjustable vertical spacing',
  },
  {
    id: 'block-section',
    type: 'section',
    label: 'Section',
    category: 'Structure',
    icon: <Layout className="h-4 w-4" />,
    description: 'Container block group',
  },
  {
    id: 'block-header',
    type: 'section',
    label: 'Header',
    category: 'Structure',
    icon: <Copy className="h-4 w-4" />,
    description: 'Page header block group',
  },
  {
    id: 'block-footer',
    type: 'section',
    label: 'Footer',
    category: 'Structure',
    icon: <FileText className="h-4 w-4" />,
    description: 'Page footer block group',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Content: 'border-blue-500/20 bg-blue-50/50 text-blue-700',
  Structure: 'border-purple-500/20 bg-purple-50/50 text-purple-700',
};

/**
 * Left panel block library. Each block is a draggable item that can be
 * dragged onto the document canvas to create a new block instance.
 */
export function BlockLibrary({ onAddBlock }: BlockLibraryProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const categories = [...new Set(BLOCKS.map((b) => b.category))];

  return (
    <aside className="flex flex-col h-full border-r bg-muted/50">
      <div className="p-4 border-b">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Block library
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {categories.map((category) => {
          const categoryBlocks = BLOCKS.filter((b) => b.category === category);
          return (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 px-2">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryBlocks.map((block) => (
                  <BlockLibraryItem
                    key={block.id}
                    block={block}
                    onAddBlock={onAddBlock}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

interface BlockLibraryItemProps {
  block: BlockLibraryItem;
  onAddBlock: (type: BlockLibraryItem['type']) => void;
}

function BlockLibraryItem({ block, onAddBlock }: BlockLibraryItemProps) {
  return (
    <Button
      onClick={() => onAddBlock(block.type)}
      variant="ghost"
      size="sm"
      className={cn(
        'w-full flex items-center justify-between gap-2 text-left border rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors',
        CATEGORY_COLORS[block.category],
      )}
    >
      <div className="flex items-center gap-2">
        {block.icon}
        <span>{block.label}</span>
      </div>
      <Plus className="h-3 w-3 opacity-50" />
    </Button>
  );
}
