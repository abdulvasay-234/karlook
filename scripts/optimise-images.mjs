import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import console from 'node:console';
import sharp from 'sharp';

const directory = 'public/images';
const output = path.join(directory, 'optimised');
await mkdir(output, { recursive: true });
const manifest = {};
for (const name of (await readdir(directory))
  .filter((file) => /\.jpe?g$/i.test(file))
  .sort()) {
  const source = path.join(directory, name);
  const { width, height } = await sharp(source).metadata();
  if (!width || !height) throw new Error(`Missing image dimensions: ${name}`);
  const sizes = [
    ...new Set([
      Math.min(width, 640),
      Math.min(width, 1280),
      ...(name === 'chauffeur-hero.jpg' ? [Math.min(width, 2000)] : []),
    ]),
  ].sort((first, second) => first - second);
  const stem = name.replace(/\.jpe?g$/i, '');
  for (const size of sizes)
    await sharp(source)
      .resize({ width: size, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(output, `${stem}-${size}.webp`));
  manifest[`/images/${name}`] = {
    width,
    height,
    variants: sizes.map((size) => ({
      width: size,
      path: `/images/optimised/${stem}-${size}.webp`,
    })),
  };
}
await writeFile(
  'src/data/image-assets.json',
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`Optimised ${Object.keys(manifest).length} source images.`);
