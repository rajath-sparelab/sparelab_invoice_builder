'use client';

import { useState } from 'react';
import { Save, Undo, Redo, MoreHorizontal, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPageSettings: () => void;
  saving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveError: string | null;
  onRetrySave: () => void;
}

export function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onPageSettings,
  saving,
  saveStatus,
  saveError,
  onRetrySave,
}: EditorToolbarProps) {
  const [statusMessage, setStatusMessage] = useState('');

  const statusIcon =
    saveStatus === 'saved' ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : saveStatus === 'error' ? (
      <AlertCircle className="h-4 w-4 text-destructive" />
    ) : (
      <FileText className="h-4 w-4 text-muted-foreground" />
    );

  const statusText =
    saveStatus === 'saved'
      ? 'Saved'
      : saveStatus === 'error'
        ? 'Save failed'
        : saving
          ? 'Saving…'
          : 'All changes saved';

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={canUndo ? onUndo : undefined}
            aria-label="Undo"
          >
            <Undo className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={canRedo ? onRedo : undefined}
            aria-label="Redo"
          >
            <Redo className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onPageSettings}
            aria-label="Page settings"
          >
            <SlidersHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-transparent">
          {statusIcon}
          <span className="text-xs font-medium text-foreground">
            {saveStatus === 'saving' ? 'Saving…' : statusText}
          </span>
        </div>
        <Button
          size="sm"
          onClick={saving ? undefined : onSave}
          className="flex items-center gap-1.5"
        >
          <Save className="h-3 w-3" />
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5">
          <AlertCircle className="h-3 w-3 text-destructive" />
          <span className="text-xs text-destructive">{saveError}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetrySave}
            className="px-2 text-destructive hover:bg-destructive/10"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

function SlidersHorizontal(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="11" x2="11" y1="2" y2="22"></line>
      <line x1="4" x2="4" y1="7" y2="7"></line>
      <line x1="8" x2="8" y1="7" y2="7"></line>
      <line x1="16" x2="16" y1="7" y2="7"></line>
      <line x1="20" x2="20" y1="7" y2="7"></line>
      <line x1="9" x2="9" y1="14" y2="14"></line>
      <line x1="5" x2="5" y1="14" y2="14"></line>
      <line x1="14" x2="14" y1="14" y2="14"></line>
      <line x1="1" x2="1" y1="14" y2="14"></line>
      <line x1="23" x2="23" y1="14" y2="14"></line>
    </svg>
  );
}
