import { writeFile } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
process.env.VITE_PAGES_DELIVERY = 'true';
await build({ root, build: { outDir: 'docs', emptyOutDir: true } });

const docs = new URL('../docs/', import.meta.url);
const model = new URL('models/roadster.glb', docs);
const compressed = new URL('models/roadster.glb.gz', docs);
await pipeline(createReadStream(model), createGzip({ level: 9 }), createWriteStream(compressed));
await writeFile(new URL('.nojekyll', docs), '');
