import type { CSSProperties } from 'react';

/** PNG’deki siyah zemini kesmek için (beyaz arayüzde koyu kutu olmadan) */
export function logoLuminanceMaskStyle(assetPath: string): CSSProperties {
  return {
    WebkitMaskImage: `url(${assetPath})`,
    maskImage: `url(${assetPath})`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskMode: 'luminance',
    maskMode: 'luminance',
  };
}
