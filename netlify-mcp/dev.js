import http from 'node:http';
import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import handler from './netlify/functions/mcp.js';

const port = Number(process.env.PORT || 8787);
http.createServer(async (req, res) => {
  try {
    const url = `http://127.0.0.1:${port}${req.url}`;
    const path = new URL(url).pathname;
    if (req.method === 'GET' && ['/', '/app.js', '/styles.css', '/INSTRUCOES_AGENTE.md', '/fiscal-icon.png'].includes(path)) {
      const file = path === '/' ? 'index.html' : path.slice(1);
      const content = await readFile(new URL(`./public/${file}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': file.endsWith('.png') ? 'image/png' : file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.css') ? 'text/css; charset=utf-8' : file.endsWith('.md') ? 'text/markdown; charset=utf-8' : 'text/javascript; charset=utf-8' }).end(content);
      return;
    }
    if (path !== '/mcp') { res.writeHead(404).end(); return; }
    const request = new Request(url, { method: req.method, headers: req.headers,
      ...(!['GET', 'HEAD'].includes(req.method) ? { body: Readable.toWeb(req), duplex: 'half' } : {}) });
    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch { res.writeHead(500).end('Erro interno.'); }
}).listen(port, '127.0.0.1', () => console.log(`MCP local: http://127.0.0.1:${port}/mcp`));
