'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Copy as CopyIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import { validateTemplateConfiguration, type TemplateConfiguration } from '@sparelab/contracts';
import { BlockLibrary } from '@/components/editor/BlockLibrary';
import { DocumentCanvas } from '@/components/editor/DocumentCanvas';
import { PropertiesEditor } from '@/components/editor/PropertiesEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { LivePreview } from '@/components/renderer/LivePreview';
import { cn } from '@/lib/utils';

interface EditorBlock {
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

interface EditorSection {
  id: string;
  name: string;
  blocks: EditorBlock[];
  style?: Record<string, string | number | boolean>;
  visible?: boolean;
}

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

const NEW_BLOCK_ID_PREFIX = 'block-';
const NEW_SECTION_ID_PREFIX = 'section-';

/**
 * Representative document data used when generating a PDF from the editor so
 * the downloaded PDF is meaningful without needing real document data.
 */
const SAMPLE_DOCUMENT_DATA: Record<string, unknown> = {
  documentNumber: 'INV-2026-001',
  documentDate: '26 Nov 2026',
  title: 'Tax Invoice',
  customer: { name: 'Acme Traders' },
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  showHeader: true,
  showLogo: true,
};

function generateId(prefix: string): string {
  return `${prefix}${crypto.randomUUID()}`;
}

function createBlock(type: EditorBlock['type']): EditorBlock {
  const base = {
    id: generateId(NEW_BLOCK_ID_PREFIX),
    type,
    visible: true,
    style: {} as Record<string, string | number | boolean>,
  };

  switch (type) {
    case 'text':
      return { ...base, content: '', binding: undefined };
    case 'image':
      return { ...base, src: undefined, alt: undefined, width: undefined, height: undefined };
    case 'table':
      return {
        ...base,
        columns: [],
        rows: [],
        repeat: undefined,
      };
    case 'divider':
    case 'spacer':
      return base;
  }
}

function createSection(): EditorSection {
  return {
    id: generateId(NEW_SECTION_ID_PREFIX),
    name: 'Section',
    blocks: [],
    style: {},
    visible: true,
  };
}

function cloneConfiguration(config: TemplateConfiguration): TemplateConfiguration {
  return JSON.parse(JSON.stringify(config));
}

function findBlock(
  sections: EditorSection[],
  blockId: string,
): { section: EditorSection; block: EditorBlock; sectionIndex: number; blockIndex: number } | null {
  for (let s = 0; s < sections.length; s++) {
    const section = sections[s];
    const bi = section.blocks.findIndex((b) => b.id === blockId);
    if (bi >= 0) {
      return { section, block: section.blocks[bi], sectionIndex: s, blockIndex: bi };
    }
  }
  return null;
}

export default async function TemplateEditorPage({ params }: EditorPageProps) {
  const { id: templateId } = await params;
  const router = useRouter();

  const [configuration, setConfiguration] = useState<TemplateConfiguration | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<TemplateConfiguration[]>([]);
  const [redoStack, setRedoStack] = useState<TemplateConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const sections = useMemo(
    () => (configuration?.sections ?? []).map((s) => ({
      id: s.id,
      name: s.name ?? 'Section',
      blocks: s.blocks as EditorBlock[],
      style: s.style,
      visible: s.visible,
    })) as EditorSection[],
    [configuration],
  );

  const blocksById = useMemo(() => {
    const map: Record<string, EditorBlock> = {};
    for (const section of sections) {
      for (const block of section.blocks) {
        map[block.id] = block;
      }
    }
    return map;
  }, [sections]);

  const sectionMap = useMemo(() => {
    const map: Record<string, EditorSection> = {};
    for (const section of sections) {
      map[section.id] = section;
    }
    return map;
  }, [sections]);

  const page = useMemo(
    () => ({
      size: configuration?.page?.size ?? 'A4',
      orientation: configuration?.page?.orientation ?? 'portrait',
      margins: configuration?.page?.margins ?? { top: 20, right: 20, bottom: 20, left: 20 },
    }),
    [configuration],
  );

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const pushSnapshot = useCallback((config: TemplateConfiguration) => {
    setUndoStack((prev) => [...prev.slice(-49), config]);
    setRedoStack([]);
  }, []);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getTemplate(templateId);
      const template = response.data;
      const latest = template.currentVersion;
      let config: TemplateConfiguration;

      if (latest?.configuration) {
        config = validateTemplateConfiguration(latest.configuration as unknown);
      } else {
        config = validateTemplateConfiguration({
          schemaVersion: '1.0.0',
          page: { size: 'A4', orientation: 'portrait', margins: { top: 20, right: 20, bottom: 20, left: 20 } },
          sections: [{ id: generateId(NEW_SECTION_ID_PREFIX), name: 'Section', blocks: [], style: {}, visible: true }],
        });
      }

      setConfiguration(config);
      pushSnapshot(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template.');
    } finally {
      setLoading(false);
    }
  }, [templateId, generateId, pushSnapshot]);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId, loadTemplate]);

  // ---- Configuration mutations ----

  const setConfigurationWithSnapshot = useCallback(
    (next: TemplateConfiguration | ((prev: TemplateConfiguration) => TemplateConfiguration)) => {
      setConfiguration((prev) => {
        const current = prev as TemplateConfiguration;
        const resolved =
          typeof next === 'function'
            ? (next as (prev: TemplateConfiguration) => TemplateConfiguration)(current)
            : next;
        pushSnapshot(resolved);
        return resolved;
      });
    },
    [pushSnapshot],
  );

  const addBlockToSection = useCallback(
    (sectionId: string, blockType: EditorBlock['type']) => {
      const block = createBlock(blockType);
      setConfigurationWithSnapshot((prev) => {
        const next = cloneConfiguration(prev);
        const section = next.sections.find((s) => s.id === sectionId);
        if (section) {
          section.blocks.push(block as any);
        }
        return next;
      });
      setSelectedBlockId(block.id);
      setSelectedSectionId(null);
    },
    [setConfigurationWithSnapshot],
  );

  const deleteBlockFromSection = useCallback(
    (sectionId: string, blockId: string) => {
      setConfigurationWithSnapshot((prev) => {
        const next = cloneConfiguration(prev);
        const section = next.sections.find((s) => s.id === sectionId);
        if (section) {
          section.blocks = section.blocks.filter((b) => b.id !== blockId);
        }
        return next;
      });
      setSelectedBlockId(null);
    },
    [setConfigurationWithSnapshot],
  );

  const duplicateBlockInSection = useCallback(
    (sectionId: string, blockId: string) => {
      const found = findBlock(sections, blockId);
      if (!found) return;
      const copy = { ...found.block, id: generateId(NEW_BLOCK_ID_PREFIX) };
      setConfigurationWithSnapshot((prev) => {
        const next = cloneConfiguration(prev);
        const section = next.sections.find((s) => s.id === sectionId);
        if (section) {
          const idx = section.blocks.findIndex((b) => b.id === blockId);
          if (idx >= 0) {
            section.blocks.splice(idx + 1, 0, copy as any);
          }
        }
        return next;
      });
      setSelectedBlockId(copy.id);
    },
    [sections, findBlock, setConfigurationWithSnapshot, generateId],
  );

  const updateBlockProperties = useCallback(
    (blockId: string, updates: Partial<EditorBlock>) => {
      setConfigurationWithSnapshot((prev) => {
        const next = cloneConfiguration(prev);
        const found = findBlock(
          next.sections as unknown as EditorSection[],
          blockId,
        );
        if (found) {
          Object.assign(found.block, updates);
        }
        return next;
      });
    },
    [setConfigurationWithSnapshot],
  );

  const addSection = useCallback(() => {
    const section = createSection();
    setConfigurationWithSnapshot((prev) => {
      const next = cloneConfiguration(prev);
      next.sections.push(section as any);
      return next;
    });
    setSelectedBlockId(null);
    setSelectedSectionId(section.id);
  }, [setConfigurationWithSnapshot]);

  const deleteSectionFromConfig = useCallback((sectionId: string) => {
    setConfigurationWithSnapshot((prev) => {
      const next = cloneConfiguration(prev);
      next.sections = next.sections.filter((s) => s.id !== sectionId);
      if (next.sections.length === 0) {
        next.sections.push({
          id: generateId(NEW_SECTION_ID_PREFIX),
          name: 'Section',
          blocks: [],
          style: {},
          visible: true,
        } as any);
      }
      return next;
    });
    setSelectedBlockId(null);
    setSelectedSectionId(null);
  }, [setConfigurationWithSnapshot, generateId]);

  const updateSectionProperties = useCallback(
    (sectionId: string, updates: Partial<EditorSection>) => {
      setConfigurationWithSnapshot((prev) => {
        const next = cloneConfiguration(prev);
        const section = next.sections.find((s) => s.id === sectionId);
        if (section) {
          Object.assign(section, updates);
        }
        return next;
      });
    },
    [setConfigurationWithSnapshot],
  );

  const updatePageSettings = useCallback((updates: Partial<{ size: string; orientation: string; margins: Record<string, number> }>) => {
    setConfigurationWithSnapshot((prev) => {
      const next = cloneConfiguration(prev);
      const page = {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        ...next.page,
        ...(updates.size ? { size: updates.size } : {}),
        ...(updates.orientation ? { orientation: updates.orientation } : {}),
      } as any;
      if (updates.margins) {
        page.margins = { ...next.page?.margins, ...updates.margins };
      }
      next.page = page;
      return next;
    });
  }, [setConfigurationWithSnapshot]);

  const reorderSections = useCallback((activeId: string, overId: string | null) => {
    setConfigurationWithSnapshot((prev) => {
      const next = cloneConfiguration(prev);
      const activeIndex = next.sections.findIndex((s) => s.id === activeId);
      const overIndex = overId ? next.sections.findIndex((s) => s.id === overId) : next.sections.length - 1;
      if (activeIndex < 0 || overIndex < 0) return next;
      const [moved] = next.sections.splice(activeIndex, 1);
      next.sections.splice(overIndex, 0, moved);
      return next;
    });
  }, [setConfigurationWithSnapshot]);

  const reorderBlocks = useCallback((sectionId: string, activeId: string, overId: string | null) => {
    setConfigurationWithSnapshot((prev) => {
      const next = cloneConfiguration(prev);
      const section = next.sections.find((s) => s.id === sectionId);
      if (!section) return next;
      const activeIndex = section.blocks.findIndex((b) => b.id === activeId);
      const overIndex = overId ? section.blocks.findIndex((b) => b.id === overId) : section.blocks.length - 1;
      if (activeIndex < 0 || overIndex < 0) return next;
      const [moved] = section.blocks.splice(activeIndex, 1);
      section.blocks.splice(overIndex, 0, moved);
      return next;
    });
  }, [setConfigurationWithSnapshot]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const current = cloneConfiguration(configuration!);
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, current]);
    setUndoStack((prev) => prev.slice(0, -1));
    setConfiguration(previous);
  }, [configuration, undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const current = cloneConfiguration(configuration!);
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev.slice(-49), current]);
    setRedoStack((prev) => prev.slice(0, -1));
    setConfiguration(nextState);
  }, [configuration, redoStack]);

  // ---- Save / publish ----

  const handleSave = useCallback(async () => {
    if (!configuration) return;
    try {
      validateTemplateConfiguration(configuration);
      setSaving(true);
      setSaveError(null);
      setSaveStatus('saving');

      await apiService.createVersion(templateId, {
        configuration,
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save template configuration.',
      );
    } finally {
      setSaving(false);
    }
  }, [configuration, templateId]);

  const handlePublish = useCallback(async () => {
    const templateData = configuration;
    // Publishing uses the latest draft version ID; we re-fetch to get it.
    // In this simplified flow, the user publishes via the detail page's
    // PublishDialog after creating a version. Here we just save.
    await handleSave();
  }, [handleSave]);

  const handleDownloadPdf = useCallback(async () => {
    if (!configuration) return;
    setDownloadingPdf(true);
    try {
      const blob = await apiService.downloadPdf(templateId, {
        data: SAMPLE_DOCUMENT_DATA,
        configuration,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${configuration?.schemaVersion ?? 'document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate PDF.',
      );
    } finally {
      setDownloadingPdf(false);
    }
  }, [configuration, templateId]);

  if (loading) {
    return (
      <main className="space-y-6 p-4">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Template Editor</h1>
            <p className="text-muted-foreground">Loading template configuration…</p>
          </div>
        </div>
        <div className="animate-pulse rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">Loading editor…</p>
        </div>
      </main>
    );
  }

  if (error || !configuration) {
    return (
      <main className="space-y-6 p-4">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Template Editor</h1>
          </div>
          <Button onClick={() => router.back()}>
            Back
          </Button>
        </div>
        <Card className="p-6">
          <CardContent>
            <p className="text-destructive">{error ?? 'Template configuration not available.'}</p>
            <Button variant="outline" onClick={loadTemplate} className="mt-4">
              Try again
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen bg-gray-50">
      <EditorToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onPageSettings={() => setSelectedBlockId(null)}
        onTogglePreview={() => setPreviewEnabled((prev) => !prev)}
        previewEnabled={previewEnabled}
        saving={saving}
        saveStatus={saveStatus}
        saveError={saveError}
        onRetrySave={handleSave}
        onDownloadPdf={handleDownloadPdf}
        downloadingPdf={downloadingPdf}
      />

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full overflow-hidden">
          {previewEnabled ? (
            <LivePreview config={configuration} />
          ) : (
            <>
              {/* Left panel: Block library */}
              <BlockLibrary onAddBlock={(blockType) => {
                // Default to first section, or create one
                const targetSectionId = configuration.sections[0]?.id;
                if (targetSectionId) {
                  addBlockToSection(targetSectionId, blockType as EditorBlock['type']);
                } else {
                  addSection();
                  const newSectionId = configuration.sections[configuration.sections.length - 1]?.id;
                  if (newSectionId) {
                    addBlockToSection(newSectionId, blockType as EditorBlock['type']);
                  }
                }
              }} />

              {/* Center panel: Document canvas */}
              <div className="flex-1 overflow-hidden">
                <DocumentCanvas
                  sections={sections}
                  selectedBlockId={selectedBlockId}
                  selectedSectionId={selectedSectionId}
                  onBlockSelect={setSelectedBlockId}
                  onAddBlock={addBlockToSection}
                  onDeleteBlock={deleteBlockFromSection}
                  onDuplicateBlock={duplicateBlockInSection}
                  onAddSection={addSection}
                  onDeleteSection={deleteSectionFromConfig}
                  onSectionReorder={reorderSections}
                  onBlockReorder={reorderBlocks}
                  onLibraryDrop={addBlockToSection}
                />
              </div>

              {/* Right panel: Properties editor */}
              <PropertiesEditor
                selectedBlockId={selectedBlockId}
                selectedSectionId={selectedSectionId}
                blocks={blocksById}
                sections={sectionMap}
                page={page}
                onBlockUpdate={updateBlockProperties}
                onSectionUpdate={updateSectionProperties}
                onPageUpdate={updatePageSettings}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
