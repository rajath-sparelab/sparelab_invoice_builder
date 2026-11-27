'use client';

import { TEMPLATE_STATUS } from '@/lib/template-config';
import type { TemplateStatus } from '@sparelab/contracts';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: TemplateStatus;
  className?: string;
}

const VARIANT_CLASSES: Record<string, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/80',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border text-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/20',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, variant } = TEMPLATE_STATUS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-4xl border border-transparent text-xs font-medium whitespace-nowrap transition-all',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
