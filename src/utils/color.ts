/**
 * Convert a HEX color code to an RGBA string.
 * @param hex - Color in #RRGGBB or RRGGBB format.
 * @param alpha - Alpha channel (0.0 to 1.0).
 */
export const hexToRgba = (hex: string, alpha = 1): string => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) {
    return `rgba(0,0,0,${alpha})`; // Fallback: transparent black
  }
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
