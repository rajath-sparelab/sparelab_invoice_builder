'use client';

import { useState } from 'react';
import { TextCursor, Image as ImageIcon, Table as TableIcon, Layout, AlignLeft, AlignCenter, AlignRight, Palette, Eye, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BindingDropdown } from './BindingDropdown';
import { cn } from '@/lib/utils';

const BINDING_REGEX = /^{{/;

interface BlockStyleProps {
  style: Record<string, string | number | boolean>;
  onStyleChange: (key: string, value: string | number | boolean | undefined) => void;
}

interface BlockStyleRowProps {
  label: string;
  key: string;
  style: Record<string, string | number | boolean>;
  onStyleChange: (key: string, value: string | number | boolean | undefined) => void;
  type?: 'text' | 'select' | 'number' | 'color';
  options?: Array<{ label: string; value: string }>;
}

function BlockStyleRow({
  label,
  key,
  style,
  onStyleChange,
  type = 'text',
  options,
}: BlockStyleRowProps) {
  const currentValue = style[key];

  if (type === 'select' && options) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">{label}</label>
        <select
          value={String(currentValue ?? '')}
          onChange={(e) => onStyleChange(key, e.target.value === '' ? undefined : e.target.value)}
          className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Default</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'color') {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={typeof currentValue === 'string' ? currentValue : '#000000'}
            onChange={(e) => onStyleChange(key, e.target.value)}
            className="h-8 w-8 rounded-md border-0 bg-transparent p-0 cursor-pointer"
          />
          <input
            type="text"
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(e) => onStyleChange(key, e.target.value || undefined)}
            className="flex-1 h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="hex"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <input
        type={type === 'number' ? 'number' : 'text'}
        value={typeof currentValue === 'number' ? String(currentValue) : String(currentValue ?? '')}
        onChange={(e) => {
          const val = e.target.value;
          if (type === 'number') {
            onStyleChange(key, val === '' ? undefined : Number(val));
          } else {
            onStyleChange(key, val === '' ? undefined : val);
          }
        }}
        className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </div>
  );
}

interface BlockStyleSectionProps {
  style: Record<string, string | number | boolean>;
  onStyleChange: (key: string, value: string | number | boolean | undefined) => void;
}

export function BlockStyleSection({ style, onStyleChange }: BlockStyleSectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Style</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <BlockStyleRow
          label="Font size"
          key="fontSize"
          style={style}
          onStyleChange={onStyleChange}
          type="text"
        />
        <BlockStyleRow
          label="Text align"
          key="textAlign"
          style={style}
          onStyleChange={onStyleChange}
          type="select"
          options={[
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ]}
        />
        <BlockStyleRow
          label="Color"
          key="color"
          style={style}
          onStyleChange={onStyleChange}
          type="color"
        />
        <BlockStyleRow
          label="Font weight"
          key="fontWeight"
          style={style}
          onStyleChange={onStyleChange}
          type="select"
          options={[
            { label: 'Normal', value: '400' },
            { label: 'Bold', value: '700' },
            { label: 'Light', value: '300' },
          ]}
        />
        <BlockStyleRow
          label="Padding"
          key="padding"
          style={style}
          onStyleChange={onStyleChange}
          type="text"
        />
        <BlockStyleRow
          label="Margin"
          key="margin"
          style={style}
          onStyleChange={onStyleChange}
          type="text"
        />
      </div>
    </div>
  );
}

interface TextBlockPropsProps {
  block: { content?: string; binding?: string; visible?: boolean };
  onUpdate: (updates: Partial<{ content: string; binding: string | undefined; visible: boolean }>) => void;
}

export function TextBlockProps({
  block,
  onUpdate,
}: TextBlockPropsProps) {
  const [content, setContent] = useState(block.content ?? '');

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Text</h4>
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground" htmlFor="block-content">
          Content
        </label>
        <textarea
          id="block-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onUpdate({ content: e.target.value });
          }}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <BindingDropdown
        value={block.binding}
        onChange={(v) => onUpdate({ binding: v })}
      />
      <div className="flex items-center gap-2">
        <input
          id="block-visible"
          type="checkbox"
          checked={block.visible ?? true}
          onChange={(e) => onUpdate({ visible: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="block-visible" className="text-sm text-foreground">
          Visible
        </label>
      </div>
    </div>
  );
}

interface ImageBlockPropsProps {
  block: { src?: string; alt?: string; width?: number; height?: number; visible?: boolean };
  onUpdate: (updates: Partial<{ src: string; alt: string | undefined; width: number | undefined; height: number | undefined; visible: boolean }>) => void;
}

export function ImageBlockProps({
  block,
  onUpdate,
}: ImageBlockPropsProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Image</h4>
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">
          Image source (URL or {'{{binding}}'})
        </label>
        <input
          value={block.src ?? ''}
          onChange={(e) => onUpdate({ src: e.target.value || undefined })}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <BindingDropdown
        value={
          block.src && BINDING_REGEX.test(block.src) ? block.src : undefined
        }
        onChange={(v) => onUpdate({ src: v })}
      />
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Alt text</label>
        <input
          value={block.alt ?? ''}
          onChange={(e) => onUpdate({ alt: e.target.value || undefined })}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <BlockStyleRow
          label="Width"
          key="width"
          style={{ width: block.width as any }}
          onStyleChange={(k, v) => onUpdate({ width: typeof v === 'number' ? v : undefined })}
          type="number"
        />
        <BlockStyleRow
          label="Height"
          key="height"
          style={{ height: block.height as any }}
          onStyleChange={(k, v) => onUpdate({ height: typeof v === 'number' ? v : undefined })}
          type="number"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="image-visible"
          type="checkbox"
          checked={block.visible ?? true}
          onChange={(e) => onUpdate({ visible: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="image-visible" className="text-sm text-foreground">
          Visible
        </label>
      </div>
    </div>
  );
}

interface TableBlockPropsProps {
  block: { repeat?: string; columns?: Array<{ id: string; header: string; key: string }>; visible?: boolean };
  onUpdate: (updates: Partial<{ repeat: string | undefined; visible: boolean }>) => void;
}

export function TableBlockProps({
  block,
  onUpdate,
}: TableBlockPropsProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Table</h4>
      <BindingDropdown
        value={block.repeat}
        onChange={(v) => onUpdate({ repeat: v })}
      />
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Columns ({block.columns?.length ?? 0})</label>
        <p className="text-xs text-muted-foreground">
          Edit column definitions in the table block settings.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="table-visible"
          type="checkbox"
          checked={block.visible ?? true}
          onChange={(e) => onUpdate({ visible: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="table-visible" className="text-sm text-foreground">
          Visible
        </label>
      </div>
    </div>
  );
}

interface SectionBlockPropsProps {
  style: Record<string, string | number | boolean>;
  onStyleChange: (key: string, value: string | number | boolean | undefined) => void;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}

export function SectionBlockProps({
  style,
  onStyleChange,
  visible,
  onVisibleChange,
}: SectionBlockPropsProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section</h4>
      <BlockStyleSection style={style} onStyleChange={onStyleChange} />
      <div className="flex items-center gap-2">
        <input
          id="section-visible"
          type="checkbox"
          checked={visible ?? true}
          onChange={(e) => onVisibleChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="section-visible" className="text-sm text-foreground">
          Visible
        </label>
      </div>
    </div>
  );
}

interface PageSettingsPropsProps {
  page: { size: string; orientation: string; margins: Record<string, number> };
  onPageChange: (updates: Partial<{ size: string; orientation: string; margins: Record<string, number> }>) => void;
}

export function PageSettingsSection({
  page,
  onPageChange,
}: PageSettingsPropsProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Page settings</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Page size</label>
          <select
            value={page.size}
            onChange={(e) => onPageChange({ size: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="A4">A4</option>
            <option value="A3">A3</option>
            <option value="A5">A5</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Orientation</label>
          <select
            value={page.orientation}
            onChange={(e) => onPageChange({ orientation: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {['top', 'right', 'bottom', 'left'].map((side) => (
          <div key={side} className="space-y-1">
            <label className="text-xs font-medium text-foreground">{side} margin</label>
            <input
              type="number"
              value={page.margins[side] ?? 20}
              onChange={(e) => {
                const val = e.target.value === '' ? undefined : Number(e.target.value);
                onPageChange({ margins: { ...page.margins, [side]: val ?? 20 } });
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface PropertiesEditorProps {
  selectedBlockId: string | null;
  selectedSectionId: string | null;
  blocks: Record<string, { type: string; content?: string; binding?: string; src?: string; alt?: string; width?: number; height?: number; columns?: any[]; repeat?: string; style?: Record<string, string | number | boolean>; visible?: boolean }>;
  sections: Record<string, { style?: Record<string, string | number | boolean>; visible?: boolean }>;
  page: { size: string; orientation: string; margins: Record<string, number> };
  onBlockUpdate: (blockId: string, updates: any) => void;
  onSectionUpdate: (sectionId: string, updates: any) => void;
  onPageUpdate: (updates: any) => void;
}

/**
 * Right panel properties editor. Shows editable properties for the selected
 * block or section, plus page-level settings.
 */
export function PropertiesEditor({
  selectedBlockId,
  selectedSectionId,
  blocks,
  sections,
  page,
  onBlockUpdate,
  onSectionUpdate,
  onPageUpdate,
}: PropertiesEditorProps) {
  const [mode, setMode] = useState<'block' | 'section' | 'page'>('block');

  if (selectedBlockId && blocks[selectedBlockId]) {
    const block = blocks[selectedBlockId];
    return (
      <aside className="flex flex-col h-full border-l bg-muted/50">
        <div className="p-4 border-b">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Block properties
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground">
              {block.type.charAt(0).toUpperCase() + block.type.slice(1)} block
            </span>
            <Button size="sm" variant="outline" onClick={() => setMode('block')}>
              Properties
            </Button>
          </div>
          {block.type === 'text' && (
            <TextBlockProps
              block={{ content: block.content, binding: block.binding, visible: block.visible }}
              onUpdate={(updates) => onBlockUpdate(selectedBlockId, updates)}
            />
          )}
          {block.type === 'image' && (
            <ImageBlockProps
              block={{ src: block.src, alt: block.alt, width: block.width, height: block.height, visible: block.visible }}
              onUpdate={(updates) => onBlockUpdate(selectedBlockId, updates)}
            />
          )}
          {block.type === 'table' && (
            <TableBlockProps
              block={{ repeat: block.repeat, columns: block.columns, visible: block.visible }}
              onUpdate={(updates) => onBlockUpdate(selectedBlockId, updates)}
            />
          )}
          <BlockStyleSection
            style={block.style ?? {}}
            onStyleChange={(key, value) =>
              onBlockUpdate(selectedBlockId, { style: { ...block.style, [key]: value } })
            }
          />
        </div>
      </aside>
    );
  }

  if (selectedSectionId && sections[selectedSectionId]) {
    const section = sections[selectedSectionId];
    return (
      <aside className="flex flex-col h-full border-l bg-muted/50">
        <div className="p-4 border-b">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Section properties
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <SectionBlockProps
            style={section.style ?? {}}
            visible={section.visible ?? true}
            onStyleChange={(key, value) =>
              onSectionUpdate(selectedSectionId, { style: { ...section.style, [key]: value } })
            }
            onVisibleChange={(visible) =>
              onSectionUpdate(selectedSectionId, { visible })
            }
          />
          <PageSettingsSection
            page={page}
            onPageChange={onPageUpdate}
          />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col h-full border-l bg-muted/50">
      <div className="p-4 border-b">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <SlidersHorizontal className="h-8 w-8 opacity-40" />
        <p className="mt-2 text-sm">Select a block or section to edit properties</p>
      </div>
    </aside>
  );
}
