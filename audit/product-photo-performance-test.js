import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = path.join(root, 'src/utils/productImages.js');
const publicPhotos = path.join(root, 'public/product-photos');
const originals = path.join(root, 'src/assets/product-photo-originals');
const map = await readFile(mapPath, 'utf8');
const referencedFiles = [...map.matchAll(/'\/product-photos\/([^']+\.jpg)'/g)].map((match) => match[1]);

assert.equal(referencedFiles.length, 13, 'all 13 catalogue image mappings should use optimized JPEGs');
assert.equal(map.includes('.png'), false, 'catalogue image mappings must not load the source PNGs');

let totalBytes = 0;
for (const filename of referencedFiles) {
  const imagePath = path.join(publicPhotos, filename);
  const imageStat = await stat(imagePath);
  assert.ok(imageStat.size < 350_000, `${filename} should stay under 350 KB`);
  totalBytes += imageStat.size;
}

assert.ok(totalBytes < 4 * 1024 * 1024, 'optimized public catalogue photos should stay under 4 MB total');
const sourceFiles = await readdir(originals);
assert.equal(sourceFiles.filter((filename) => filename.endsWith('.png')).length, 13, 'retain all original PNG sources outside the public asset directory');

console.log(`Product photos: ${referencedFiles.length} optimized JPEGs, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total.`);
