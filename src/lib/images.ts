import images from '../data/image-assets.json';
import { pathFor } from './paths';

export function imageAttributes(source: string) {
  const marker = source.indexOf('/images/');
  const key = marker >= 0 ? source.slice(marker) : source;
  const asset = (
    images as Record<
      string,
      {
        width: number;
        height: number;
        variants: { width: number; path: string }[];
      }
    >
  )[key];
  if (!asset)
    return {
      src: source,
      width: undefined,
      height: undefined,
      srcSet: undefined,
    };
  return {
    src: pathFor(asset.variants.at(-1)!.path),
    width: asset.width,
    height: asset.height,
    srcSet: asset.variants
      .map((variant) => `${pathFor(variant.path)} ${variant.width}w`)
      .join(', '),
  };
}
