import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.argv[2] ?? 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
};

const server = createServer(async (request, response) => {
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const pathWithinRoot = relative(root, file);
    if (!pathWithinRoot || pathWithinRoot === '..' || pathWithinRoot.startsWith('..' + sep) || resolve(root, pathWithinRoot) !== file) {
      response.writeHead(404).end();
      return;
    }
    const info = await stat(file);
    const contentType = types[extname(file)];
    if (!info.isFile() || !contentType) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': contentType, 'Content-Length': info.size });
    if (method === 'HEAD') response.end();
    else createReadStream(file).on('error', () => response.destroy()).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});

server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  const address = 'http://127.0.0.1:' + port + '/';
  console.log('Roadster 2: ' + address);
  if (process.platform === 'win32' && process.argv.includes('--open')) {
    const browser = spawn('explorer.exe', [address], { detached: true, stdio: 'ignore' });
    browser.on('error', () => console.log('Open the address above in a browser.'));
    browser.unref();
  }
});
