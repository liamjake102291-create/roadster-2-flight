import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, process.argv[2] ?? 'docs');
const assets = join(output,'assets');
const models = join(output,'models');
await mkdir(assets,{recursive:true});
await mkdir(models,{recursive:true});
if (!process.argv.includes('--bundled')) {
  await import('./prepare-performance-model.mjs');
  const { build } = await import('esbuild');
  await build({
    absWorkingDir: root, entryPoints: ['src/main.tsx'], outfile: join(assets,'roadster.js'),
    bundle: true, minify: true, format: 'esm', target:'es2022', jsx:'automatic',
    define: {
      'import.meta.env.BASE_URL': JSON.stringify('./'),
      'import.meta.env.VITE_PAGES_DELIVERY': JSON.stringify('true'),
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  });
}
const hash = (data) => createHash('sha256').update(data).digest('hex').slice(0, 10);
const js = await readFile(join(assets,'roadster.js'));
const css = await readFile(join(assets,'roadster.css'));
const scriptPath = './assets/roadster-' + hash(js) + '.js';
const cssPath = './assets/roadster-' + hash(css) + '.css';
const compressedScript = gzipSync(js, {level:9});
await writeFile(join(output,scriptPath),js);
await writeFile(join(output,scriptPath+'.gz'),compressedScript);
await writeFile(join(output,cssPath),css);

for (const name of ['roadster.glb','roadster-performance.glb']) {
  const bytes = await readFile(join(root,'public','models',name));
  const compressed = gzipSync(bytes,{level:9});
  if (!gunzipSync(compressed).equals(bytes)) throw Error('Could not verify '+name);
  await writeFile(join(models,name),bytes);
  await writeFile(join(models,name+'.gz'),compressed);
}
for (const name of ['favicon.svg','roadster-poster.jpg']) await copyFile(join(root,'public',name),join(output,name));
await writeFile(join(output,'.nojekyll'),'');
const poster = await readFile(join(root,'public','roadster-opening.webp'));
const initial = '<div id="flight-opening-placeholder" style="position:fixed;inset:0;z-index:1;color:#fff;background:#0a0c10;font:16px system-ui;display:grid;place-items:center;margin:0"><img alt="" style="width:100%;height:100%;position:absolute;inset:0;object-fit:cover;opacity:.72" width="736" height="414" src="data:image/webp;base64,'+
  poster.toString('base64')+'"><section style="position:relative;text-align:center;text-shadow:0 2px 10px #000"><h1 style="font-size:clamp(36px,8vw,94px);letter-spacing:-.05em;margin:0">ROADSTER 2</h1><p role="status">正在载入实时 3D 演示…</p></section></div>';
const loader = `<script type="module">
const scriptUrl = new URL(${JSON.stringify(scriptPath)}, document.baseURI).href;
let entry = scriptUrl;
if (typeof DecompressionStream !== 'undefined') {
  try {
    const response = await fetch(scriptUrl + '.gz');
    if (response.ok && response.body) {
      const content = await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).blob();
      entry = URL.createObjectURL(new Blob([content], {type:'text/javascript'}));
    }
  } catch {}
}
try {
  if (entry === scriptUrl) await import(scriptUrl);
  else {
    try { await import(entry); } catch { await import(scriptUrl); }
  }
}
catch (error) {
  const status = document.querySelector('#flight-opening-placeholder [role=status]');
  if (status) status.textContent = '演示加载失败。请刷新页面后重试。';
  console.error(error);
} finally {
  if (entry !== scriptUrl) URL.revokeObjectURL(entry);
}
</script>`;
const base = await readFile(join(root,'index.html'),'utf8');
const html = base.replace('href="/favicon.svg"','href="./favicon.svg"')
  .replace('</head>',`<link rel="stylesheet" href="${cssPath}">
<script>
if (typeof DecompressionStream !== 'undefined') {
  const preload = document.createElement('link');
  preload.rel='preload'; preload.as='fetch'; preload.crossOrigin='anonymous';
  preload.href='./models/roadster-performance.glb.gz'; document.head.append(preload);
}
</script>
</head>`)
  .replace('<div id="root"></div>',initial+'<div id="root"></div>')
  .replace('<script type="module" src="/src/main.tsx"></script>',loader);
await writeFile(join(output,'index.html'),html);
console.log('Pages entry:',scriptPath,'HTML',Buffer.byteLength(html),'JS gzip',compressedScript.length,'poster',poster.length);
