import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/mcp.js';
import { callTool, tools, tableMetadata } from '../src/fiscal.js';

const key = '35240112345678000195550010000001231000000011';
const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
const request = (body, extra = {}) => new Request('http://127.0.0.1:8787/mcp', {
  method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body),
});
const rpc = (method, params = {}, id = 1) => handler(request({ jsonrpc: '2.0', id, method, params }));

test('catálogo anuncia só o validador; tabelas reprovadas não entram no contexto', async () => {
  const response = await rpc('tools/list');
  const body = await response.json();
  assert.deepEqual(body.result.tools.map(t => t.name), ['validar_chave_nfe']);
  assert.ok(Buffer.byteLength(JSON.stringify(body.result)) < 3000);
  assert.ok(body.result.tools.every(t => t.description.length < 150 && t.annotations.readOnlyHint));
});

test('chave: vetor do upstream, espaços, DV alterado e entrada repetida', () => {
  assert.equal(callTool('validar_chave_nfe', { chave: key }).digito_valido, true);
  assert.equal(callTool('validar_chave_nfe', { chave: key.match(/.{4}/g).join(' ') }).digito_valido, true);
  assert.equal(callTool('validar_chave_nfe', { chave: key.slice(0, -1) + '2' }).digito_valido, false);
  assert.equal(callTool('validar_chave_nfe', { chave: '0'.repeat(44) }).formato_valido, false);
  assert.equal(callTool('validar_chave_nfe', { chave: key }).autorizacao_consultada, false);
  assert.throws(() => callTool('validar_chave_nfe', { chave: 'A' + key.slice(1) }));
});

test('CFOP e CEST com divergências confirmadas não retornam conteúdo ao agente', () => {
  assert.equal(tableMetadata.validacao, 'reprovada');
  assert.throws(() => callTool('consultar_cfop', { cfop: '1403' }));
  assert.throws(() => callTool('consultar_cest', { cest: '0100700' }));
  assert.throws(() => callTool('consultar_cfop', { cfop: '5102' }));
});

test('CST não pode certificar tabela incompleta; entradas erradas não são normalizadas silenciosamente', () => {
  assert.throws(() => callTool('validar_cst', { cst: '002', tributo: 'ICMS' }));
  assert.throws(() => callTool('validar_cst', { cst: '50', tributo: 'IPI' }));
  assert.throws(() => callTool('validar_chave_nfe', { chave: Number(key) }));
  assert.throws(() => callTool('validar_chave_nfe', { chave: '__proto__' }));
  assert.throws(() => callTool('validar_chave_nfe', { chave: key, extra: true }));
});

test('orçamento de resposta: um registro, sem repetir chave ou metadados de auditoria', () => {
  const samples = [['validar_chave_nfe', { chave: key }], ['validar_chave_nfe', { chave: key.slice(0, -1) + '2' }]];
  for (const [name, args] of samples) {
    const text = JSON.stringify(callTool(name, args));
    assert.ok(Buffer.byteLength(text) < 1200);
    assert.ok(!text.includes(key));
    assert.ok(!text.includes(tableMetadata.commit_origem));
  }
});

test('MCP: negociação, notificação 202, ping e erro de ferramenta', async () => {
  const init = await (await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } })).json();
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.equal(init.result.instructions, undefined);
  const notification = await handler(request({ jsonrpc: '2.0', method: 'notifications/initialized' }));
  assert.equal(notification.status, 202);
  assert.equal(await notification.text(), '');
  assert.deepEqual((await (await rpc('ping')).json()).result, {});
  const valid = await (await rpc('tools/call', { name: 'validar_chave_nfe', arguments: { chave: key } })).json();
  assert.equal(valid.result.content.length, 1);
  assert.equal(valid.result.structuredContent, undefined);
  const invalid = await (await rpc('tools/call', { name: 'validar_chave_nfe', arguments: { chave: 5102 } })).json();
  assert.equal(invalid.result.isError, true);
  assert.equal((await (await rpc('tools/call', { name: 'outra' })).json()).error.code, -32602);
  const blocked = await (await rpc('tools/call', { name: 'consultar_cest', arguments: { cest: '0100700' } })).json();
  assert.equal(blocked.error.code, -32602);
  assert.equal(blocked.result, undefined);
});

test('HTTP rejeita JSON inválido, lote, corpo grande e versão desconhecida', async () => {
  const invalid = new Request('http://localhost/mcp', { method: 'POST', headers, body: '{' });
  assert.equal((await handler(invalid)).status, 400);
  assert.equal((await handler(request([{ jsonrpc: '2.0', id: 1, method: 'ping' }]))).status, 400);
  assert.equal((await handler(request({ x: 'x'.repeat(9000) }))).status, 413);
  assert.equal((await handler(request({ jsonrpc: '2.0', id: 1, method: 'ping' }, { 'mcp-protocol-version': '2099-01-01' }))).status, 400);
  assert.equal((await handler(new Request('http://localhost/mcp'))).status, 405);
  assert.equal((await handler(request({ jsonrpc: '2.0', id: 1, method: 'ping' }, { accept: 'text/html' }))).status, 406);
});

test('autenticação fecha endpoint público sem segredo e rejeita origem externa', async () => {
  const previous = process.env.AUTH_TOKEN;
  try {
    delete process.env.AUTH_TOKEN;
    assert.equal((await handler(new Request('https://example.netlify.app/mcp'))).status, 503);
    process.env.AUTH_TOKEN = 'test-only-token';
    assert.equal((await rpc('ping')).status, 401);
    const body = { jsonrpc: '2.0', id: 1, method: 'ping' };
    assert.equal((await handler(request(body, { authorization: 'Bearer test-only-token' }))).status, 200);
    assert.equal((await handler(request(body, { authorization: 'Bearer wrong' }))).status, 401);
    assert.equal((await handler(request(body, { authorization: 'Bearer test-only-token', origin: 'https://evil.example' }))).status, 403);
  } finally { if (previous === undefined) delete process.env.AUTH_TOKEN; else process.env.AUTH_TOKEN = previous; }
});
