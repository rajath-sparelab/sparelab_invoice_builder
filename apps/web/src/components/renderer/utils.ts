import type { BlockStyle } from '@sparelab/contracts';

/**
 * Convert a validated `BlockStyle` record into React inline CSS properties.
 * Only whitelisted, scalar-safe values can appear in a style, so this mapping is
 * safe — no arbitrary CSS functions or URLs are possible.
 */
export function toStyle(style: BlockStyle | undefined): React.CSSProperties {
  if (!style) return {};

  const css: React.CSSProperties = {};

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    switch (key) {
      // Numeric-ish values that may arrive as number or string.
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
        css[key as keyof React.CSSProperties] =
          typeof value === 'number' ? `${value}px` : (value as any);
        break;
      // Opacity is a unitless number.
      case 'opacity':
        css.opacity = typeof value === 'number' ? value : Number(value) || undefined;
        break;
      // fontWeight may be a number or a string keyword.
      case 'fontWeight':
        css.fontWeight = (value as any);
        break;
      // Boolean-ish toggles.
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
        css[key as keyof React.CSSProperties] = value as any;
        break;
      // Colors, backgroundColor, color, fontFamily, borderColor accept strings.
      default:
        css[key as keyof React.CSSProperties] = value as any;
        break;
    }
  }

  return css;
}
