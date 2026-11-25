'use client';

import { z } from 'zod';
import { BindingSchema } from '@sparelab/contracts/src/schemas/template-config';

/**
 * Predefined dynamic data bindings available for template blocks.
 * Each binding is stored as a {{fieldName}} reference (validated by BindingSchema)
 * rather than a hardcoded value, keeping configurations free of executable content.
 */
export const PREDEFINED_BINDINGS: Array<{
  label: string;
  value: string;
  category: 'document' | 'party' | 'lineItem';
}> = [
  // Document-level fields
  { label: 'Document number', value: '{{documentNumber}}', category: 'document' },
  { label: 'Document date', value: '{{documentDate}}', category: 'document' },
  // Seller / customer parties
  { label: 'Seller name', value: '{{sellerName}}', category: 'party' },
  { label: 'Seller address', value: '{{sellerAddress}}', category: 'party' },
  { label: 'Customer name', value: '{{customerName}}', category: 'party' },
  { label: 'Customer address', value: '{{customerAddress}}', category: 'party' },
  // Line-item fields (used in repeating tables)
  { label: 'Items', value: '{{items}}', category: 'lineItem' },
  { label: 'Quantity', value: '{{quantity}}', category: 'lineItem' },
  { label: 'Unit price', value: '{{unitPrice}}', category: 'lineItem' },
  { label: 'Taxable amount', value: '{{taxableAmount}}', category: 'lineItem' },
  { label: 'Total amount', value: '{{totalAmount}}', category: 'lineItem' },
];

/**
 * Validates that a binding value conforms to the BindingSchema format.
 */
export function isValidBinding(value: string): boolean {
  return BindingSchema.safeParse(value).success;
}

interface BindingDropdownProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

/**
 * Dropdown of predefined dynamic data bindings for text content and table
 * repeat bindings. Emits a {{fieldName}} string or undefined when cleared.
 */
export function BindingDropdown({
  value,
  onChange,
  disabled = false,
}: BindingDropdownProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    onChange(selected === '' ? undefined : selected);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-foreground">
        Dynamic binding
      </label>
      <select
        disabled={disabled}
        value={value ?? ''}
        onChange={handleChange}
        className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
      >
        <option value="">None</option>
        {PREDEFINED_BINDINGS.map((binding) => (
          <option key={binding.value} value={binding.value}>
            {binding.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export type { Binding } from '@sparelab/contracts/src/schemas/template-config';
