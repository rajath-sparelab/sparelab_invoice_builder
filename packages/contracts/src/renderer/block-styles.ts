import type { JsonValue } from '../schemas/document-data';

/**
 * Convert a validated BlockStyle record into a CSS attribute string.
 * Only whitelisted, scalar-safe values are emitted — no arbitrary CSS functions
 * or URLs, so this is safe against CSS-based exfiltration.
 */
export function blockToStyle(
  style: Record<string, JsonValue> | undefined,
): string {
  if (!style) return '';

  const parts: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    switch (key) {
      case 'fontSize':
      case 'lineHeight':
      case 'letterSpacing':
      case 'padding':
      case 'paddingTop':
      case 'paddingRight':
      case 'paddingBottom':
      case 'paddingLeft':
      case 'margin':
      case 'marginTop':
      case 'marginRight':
      case 'marginBottom':
      case 'marginLeft':
      case 'borderWidth':
      case 'borderRadius':
      case 'width':
      case 'height':
      case 'maxWidth':
      case 'minWidth':
      case 'gap':
        parts.push(
          `${kebabCase(key)}:${typeof value === 'number' ? value + 'px' : value};`,
        );
        break;
      case 'opacity':
        parts.push(
          `opacity:${typeof value === 'number' ? value : Number(value) || ''};`,
        );
        break;
      case 'fontWeight':
        parts.push(`font-weight:${value};`);
        break;
      case 'display':
      case 'flexDirection':
      case 'justifyContent':
      case 'alignItems':
      case 'textAlign':
      case 'textDecoration':
      case 'fontStyle':
      case 'borderStyle':
      case 'border':
      case 'pageBreakBefore':
      case 'pageBreakAfter':
        parts.push(`${kebabCase(key)}:${value};`);
        break;
      default:
        parts.push(`${kebabCase(key)}:${value};`);
        break;
    }
  }
  return parts.join('');
}

function kebabCase(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
