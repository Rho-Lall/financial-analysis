import type { CSSProperties } from 'react';

/** Style helper for timed fade/ink animations. */
export function timing(delay: number, duration: number, targetOpacity?: number): CSSProperties {
  const style: CSSProperties & Record<string, string> = {
    animationDelay: `${Math.round(delay)}ms`,
    animationDuration: `${Math.round(duration)}ms`,
  };
  if (targetOpacity !== undefined) style['--eg-opacity'] = String(targetOpacity);
  return style;
}
