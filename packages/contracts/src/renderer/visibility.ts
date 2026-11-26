import type { DocumentData } from '../schemas/document-data';
import type { VisibilityCondition } from '../schemas/template-config';

const OPERATORS: Record<
  VisibilityCondition['operator'],
  (actual: unknown, expected: unknown) => boolean
> = {
  eq: (actual, expected) => actual === expected,
  ne: (actual, expected) => actual !== expected,
  gt: (actual, expected) => Number(actual) > Number(expected),
  gte: (actual, expected) => Number(actual) >= Number(expected),
  lt: (actual, expected) => Number(actual) < Number(expected),
  lte: (actual, expected) => Number(actual) <= Number(expected),
  in: (actual, expected) =>
    Array.isArray(expected) && expected.includes(actual as unknown),
  notIn: (actual, expected) =>
    !Array.isArray(expected) || !expected.includes(actual as unknown),
  exists: (actual) => actual !== undefined && actual !== null,
  notExists: (actual) => actual === undefined || actual === null,
};

/**
 * Get the value at a dotted path within document data, or undefined when missing.
 * Never reads prototype properties and never executes code.
 */
function getPathValue(data: DocumentData, field: string): unknown {
  let current: unknown = data;
  for (const segment of field.split('.')) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
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
  return current;
}

/**
 * Evaluate a visibility condition against document data. Returns true when the block
 * or section should be shown. A missing field with a comparison operator evaluates
 * to undefined as the actual value (so `exists`/`notExists` are meaningful).
 * Throws nothing — invalid conditions evaluate to hidden (false).
 */
export function evaluateVisibility(
  data: DocumentData,
  condition: VisibilityCondition,
): boolean {
  try {
    const actual = getPathValue(data, condition.field);
    const fn = OPERATORS[condition.operator];
    if (!fn) return false;
    return fn(actual, condition.value);
  } catch {
    return false;
  }
}
