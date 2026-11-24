'use client';

import { TEMPLATE_STATUS } from '@/lib/template-config';
import type { TemplateStatus } from '@sparelab/contracts';

interface StatusBadgeProps {
  status: TemplateStatus;
  className?: string;
}

const VARIANT_CLASSES: Record<string, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border text-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, variant } = TEMPLATE_STATUS[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${VARIANT_CLASSES[variant]} ${className ?? ''}`}
    >
      {label}
    </span>
  );
}
