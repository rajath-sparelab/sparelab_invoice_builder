import type { DocumentData, JsonValue } from '../schemas/document-data';
import type { Binding } from '../schemas/template-config';

const BINDING_REGEX = /^{{\s*([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*}}$/;

/**
 * Extract the dotted data path from a `{{path}}` binding, e.g. "{{customer.name}}" -> "customer.name".
 * Returns null when the value is not a valid binding.
 */
export function getBindingPath(binding: string): string | null {
  const match = BINDING_REGEX.exec(binding);
  if (!match) return null;
  return match[1];
}

/**
 * Resolve a dotted path against a document data object, returning the value at that path
 * or undefined when any segment is missing. Only plain property access is performed — no
 * property is looked up on Object.prototype, and no code is ever executed.
 *
 * Supported top-level field groups (documented conventions):
 *   - document: documentNumber, documentDate, title, ...
 *   - party: sellerName, sellerAddress, customerName, customerAddress (nested under seller / customer)
 *   - lineItem: quantity, unitPrice, taxableAmount, totalAmount (used inside a repeating collection)
 * The resolver itself is agnostic to field names; it just walks the dotted path.
 */
export function resolveBinding(
  data: DocumentData,
  binding: string,
): JsonValue | undefined {
  const path = getBindingPath(binding);
  if (path === null) return undefined;

  let current: unknown = data;
  for (const segment of path.split('.')) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    // Guard against prototype-pollution keys and non-own properties.
    if (
      segment === '__proto__' ||
      segment === 'constructor' ||
      segment === 'prototype'
    ) {
      return undefined;
    }
    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current as JsonValue | undefined;
}

/**
 * Resolve a binding against document data, returning a display string. Missing or invalid
 * bindings resolve to an empty string so rendering never throws on incomplete data.
 */
export function resolveBindingText(
  data: DocumentData,
  binding: string | undefined,
): string {
  if (!binding) return '';
  const value = resolveBinding(data, binding);
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

/**
 * Resolve a table cell string against a row item. Cell strings may be:
 *   - a binding like "{{quantity}}" resolved against the item,
 *   - any other string treated as a literal value.
 * Returns undefined when the binding resolves to nothing.
 */
export function resolveCellText(
  data: DocumentData,
  cell: string,
  item: unknown,
): string | undefined {
  const bindingPath = getBindingPath(cell);
  if (bindingPath !== null) {
    const value = resolveBinding(item as DocumentData, `{{${bindingPath}}}`);
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return undefined;
  }
  return cell;
}
