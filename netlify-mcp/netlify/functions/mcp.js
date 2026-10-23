import { createHash, timingSafeEqual } from 'node:crypto';
import { tools, callTool, refreshTables } from '../../src/fiscal.js';

const versions = ['2025-11-25', '2025-06-18', '2025-03-26'];
const MAX_BYTES = 8192;
const digest = s => createHash('sha256').update(s).digest();
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
});
const error = (id, code, message, status = 200) => json({ jsonrpc: '2.0', id, error: { code, message } }, status);

async function boundedBody(request) {
  if (Number(request.headers.get('content-length')) > MAX_BYTES) throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BYTES) { await reader.cancel(); throw new RangeError(); }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const allowed = [url.origin, ...(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)];
  if (origin && !allowed.includes(origin)) return json({ erro: 'Origem não permitida.' }, 403);
  const cors = origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version' } });
  const token = process.env.AUTH_TOKEN;
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (!token && !local) return json({ erro: 'Configure AUTH_TOKEN antes de expor o MCP.' }, 503);
  if (token) {
    const received = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1] || '';
    if (!timingSafeEqual(digest(token), digest(received))) return json({ erro: 'Não autorizado.' }, 401);
  }
  if (request.method !== 'POST') return json({ erro: 'Use POST JSON-RPC em /mcp.' }, 405, { Allow: 'POST, OPTIONS' });
  const version = request.headers.get('mcp-protocol-version');
  if (version && !versions.includes(version)) return error(null, -32600, 'Versão MCP não suportada.', 400);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return error(null, -32600, 'Use Content-Type application/json.', 415);
  const accept = request.headers.get('accept') || '';
  if (!accept.includes('application/json') || !accept.includes('text/event-stream')) return error(null, -32600, 'Accept deve incluir application/json e text/event-stream.', 406);
  let body;
  try { body = JSON.parse(await boundedBody(request)); }
  catch (err) { return error(null, err instanceof RangeError ? -32600 : -32700,
    err instanceof RangeError ? 'Corpo excede 8 KB.' : 'JSON inválido.', err instanceof RangeError ? 413 : 400); }
  if (!body || Array.isArray(body) || body.jsonrpc !== '2.0' || typeof body.method !== 'string'
    || (Object.hasOwn(body, 'id') && !(typeof body.id === 'string' || Number.isSafeInteger(body.id)))) return error(null, -32600, 'Requisição JSON-RPC inválida.', 400);
  const { id, method, params = {} } = body;
  if (!Object.hasOwn(body, 'id')) {
    if (method.startsWith('notifications/')) return new Response(null, { status: 202, headers: cors });
    return error(null, -32600, 'Método requer id.', 400);
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) return error(id, -32602, 'Parâmetros inválidos.');
  let result;
  if (method === 'initialize') {
    if (typeof params.protocolVersion !== 'string' || !params.clientInfo || !params.capabilities) return error(id, -32602, 'Inicialização incompleta.');
    result = { protocolVersion: versions.includes(params.protocolVersion) ? params.protocolVersion : versions[0],
      capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'ats-fiscal-mcp', version: '0.1.0' } };
  } else if (method === 'ping') result = {};
  else if (method === 'tools/list') result = { tools };
  else if (method === 'tools/call') {
    if (!tools.some(t => t.name === params.name)) return error(id, -32602, 'Ferramenta desconhecida.');
    if (params.name !== 'validar_chave_nfe') await refreshTables();
    try { result = { content: [{ type: 'text', text: JSON.stringify(callTool(params.name, params.arguments)) }] }; }
    catch (err) { result = { isError: true, content: [{ type: 'text', text: err.message }] }; }
  } else return error(id, -32601, 'Método não implementado.');
  return json({ jsonrpc: '2.0', id, result }, 200, cors);
}

export const config = { path: '/mcp' };
