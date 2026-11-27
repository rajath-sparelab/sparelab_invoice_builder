'use client';

import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import { closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { Plus, Move, Trash2, Copy as CopyIcon, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BlockRenderer } from './BlockRenderer';

interface BlockItem {
  id: string;
  type: 'text' | 'image' | 'table' | 'divider' | 'spacer';
  content?: string;
  binding?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  columns?: Array<{ id: string; header: string; key: string }>;
  rows?: string[][];
  repeat?: string;
  style?: Record<string, string | number | boolean>;
  visible?: boolean;
}

interface SectionItem {
  id: string;
  name: string;
  blocks: BlockItem[];
  style?: Record<string, string | number | boolean>;
}

interface DocumentCanvasProps {
  sections: SectionItem[];
  selectedBlockId: string | null;
  selectedSectionId: string | null;
  onBlockSelect: (blockId: string | null, sectionId: string | null) => void;
  onAddBlock: (sectionId: string, blockType: BlockItem['type']) => void;
  onDeleteBlock: (sectionId: string, blockId: string) => void;
  onDuplicateBlock: (sectionId: string, blockId: string) => void;
  onAddSection: () => void;
  onDeleteSection: (sectionId: string) => void;
  onSectionReorder: (activeId: string, overId: string | null) => void;
  onBlockReorder: (sectionId: string, activeId: string, overId: string | null) => void;
  onLibraryDrop: (sectionId: string, blockType: BlockItem['type']) => void;
}

interface SortableBlockProps {
  block: BlockItem;
  index: number;
  sectionId: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: (sectionId: string, blockId: string) => void;
  onDuplicate: (sectionId: string, blockId: string) => void;
}

interface SortableSectionProps {
  section: SectionItem;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: (sectionId: string) => void;
  onAddBlock: (blockType: BlockItem['type']) => void;
  onDeleteBlock: (sectionId: string, blockId: string) => void;
  onDuplicateBlock: (sectionId: string, blockId: string) => void;
}

const SENSOR_OPTIONS = {
  collisionDetection: closestCorners,
};

function SortableBlock({ block, index, sectionId, selected, onSelect, onDelete, onDuplicate }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: block.id,
    data: { sectionId, blockType: block.type },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2 rounded-lg border p-2 mb-2 transition-all duration-200',
        selected
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-transparent hover:border-muted',
        block.type === 'divider' && 'h-px flex-none border-t border-muted',
      )}
    >
      <Move className="h-3 w-3 text-muted-foreground cursor-grab active:cursor-grabbing" />
      <BlockRenderer block={block} selected={selected} onSelect={onSelect} />
      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" onClick={() => onDuplicate(sectionId, block.id)} aria-label="Duplicate block">
          <CopyIcon className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(sectionId, block.id)} aria-label="Delete block">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function SortableSection({ section, index, selected, onSelect, onDelete, onAddBlock, onDeleteBlock, onDuplicateBlock }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
    data: { type: 'section' },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-lg border mb-4 overflow-hidden transition-all duration-200',
        selected ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-muted',
      )}
    >
      <CardHeader className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onSelect}>
          <Layout className="h-4 w-4 text-muted-foreground" />
          <span className={cn('text-xs font-medium truncate', selected ? 'text-primary' : 'text-foreground')}>
            {section.name}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" onClick={() => onDelete(section.id)} aria-label="Delete section">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Plus className="h-3 w-3" />
          <span className="cursor-pointer hover:text-primary" onClick={onSelect}>
            Add block to section
          </span>
        </div>
        <SortableContext items={section.blocks.map((b) => b.id)}>
          {section.blocks.map((block, i) => (
            <SortableBlock
              key={block.id}
              block={block}
              index={i}
              sectionId={section.id}
              selected={selected && false}
              onSelect={() => onSelect()}
              onDelete={() => onDeleteBlock(section.id, block.id)}
              onDuplicate={() => onDuplicateBlock(section.id, block.id)}
            />
          ))}
        </SortableContext>
        <div className="h-8 border-2 border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground" role="button" onClick={() => onSelect()}>
          Drop block here
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Document canvas (center panel). Displays sections as vertical containers with
 * draggable blocks inside. Supports dropping library blocks onto sections,
 * reordering blocks within/across sections, and selecting blocks.
 */
export function DocumentCanvas({
  sections,
  selectedBlockId,
  selectedSectionId,
  onBlockSelect,
  onAddBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onAddSection,
  onDeleteSection,
  onSectionReorder,
  onBlockReorder,
  onLibraryDrop,
}: DocumentCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const [draggedItem, setDraggedItem] = React.useState<{
    id: string;
    type: 'block' | 'section' | 'library';
    blockType?: BlockItem['type'];
    sectionId?: string;
  } | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over) {
      setDraggedItem(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string | null;

    // Library item dropped onto canvas
    if (draggedItem?.type === 'library' && draggedItem.blockType && draggedItem.sectionId) {
      onLibraryDrop(draggedItem.sectionId, draggedItem.blockType);
      setDraggedItem(null);
      return;
    }

    // Section reorder
    if (draggedItem?.type === 'section') {
      onSectionReorder(activeId, overId);
      setDraggedItem(null);
      return;
    }

    // Block reorder within a section
    if (draggedItem?.type === 'block' && draggedItem.sectionId) {
      onBlockReorder(draggedItem.sectionId, activeId, overId);
      setDraggedItem(null);
      return;
    }

    setDraggedItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-auto bg-[#f8fafc] p-8 relative">
        {/* A4 page visual */}
        <div className="mx-auto max-w-[210mm] min-h-[297mm] bg-white shadow-lg border border-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-0 left-0 right-0 h-4 bg-gray-100 border-b" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-100 border-t" />
            <div className="absolute top-0 bottom-0 left-0 w-4 bg-gray-100 border-r" />
            <div className="absolute top-0 bottom-0 right-0 w-4 bg-gray-100 border-l" />
          </div>

          <div className="p-[20px] min-h-full">
            <SortableContext
              items={sections.map((s) => s.id)}
            >
              {sections.map((section, sectionIndex) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  index={sectionIndex}
                  selected={selectedSectionId === section.id}
                  onSelect={() => onBlockSelect(null, section.id)}
                  onDelete={() => onDeleteSection(section.id)}
                  onAddBlock={(blockType) => onAddBlock(section.id, blockType)}
                  onDeleteBlock={(blockId) => onDeleteBlock(section.id, blockId)}
                  onDuplicateBlock={(blockId) => onDuplicateBlock(section.id, blockId)}
                />
              ))}
            </SortableContext>

            <div className="mt-8 flex items-center justify-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onAddSection}
                className="text-xs"
              >
                <Plus className="mr-1 h-3 w-3" /> Add section
              </Button>
            </div>
          </div>
        </div>

        {/* Drag overlay for library items */}
        {draggedItem && draggedItem.type === 'library' && (
          <DragOverlay>
            <div className="flex items-center gap-2 p-2 border border-dashed rounded-md bg-white shadow-lg">
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">{draggedItem.blockType} block</span>
            </div>
          </DragOverlay>
        )}
      </div>
    </DndContext>
  );
}
