import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/mcp.js';
import { callTool, tools } from '../src/fiscal.js';

test('formatos Resulth preservam código e identificam tabela de consulta', () => {
  for (const [tributo, cst, codigoTabela] of [
    ['ICMS', '060', '60'], ['ICMS', '090', '90'],
    ['CSOSN', '0500', '500'], ['CSOSN', '0900', '900'],
  ]) {
    const result = callTool('validar_cst', { tributo, cst });
    assert.equal(result.encontrado, true);
    assert.equal(result.codigo, cst);
    assert.equal(result.codigo_informado, cst);
    assert.equal(result.codigo_tabela, codigoTabela);
    assert.equal(result.codigo_resulth, cst);
    assert.equal(result.descricao, callTool('validar_cst', { tributo, cst: codigoTabela }).descricao);
    const property = tools.find(t => t.name === 'validar_cst').inputSchema.properties.cst;
    assert.match(cst, new RegExp(property.pattern));
  }
});

test('aceita CSOSN oficial sem inventar origem ou remover prefixo significativo', () => {
  for (const cst of ['500', '900']) {
    const result = callTool('validar_cst', { tributo: 'CSOSN', cst });
    assert.equal(result.codigo, cst);
    assert.equal(result.codigo_tabela, cst);
    assert.equal(result.codigo_resulth, '0' + cst);
  }
  const bare = callTool('validar_cst', { tributo: 'ICMS', cst: '60' });
  assert.equal(bare.codigo_resulth, undefined);
  assert.equal(bare.origem, undefined);
  const imported = callTool('validar_cst', { tributo: 'ICMS', cst: '160' });
  assert.equal(imported.codigo_resulth, '160');
  assert.equal(imported.codigo_tabela, '60');
  assert.ok(imported.origem);
  for (const [tributo, cst] of [['ICMS', '0900'], ['CSOSN', '1900'], ['CSOSN', '90'], ['PIS', '0099'], ['COFINS', '099'], ['CSOSN', '00900']]) {
    assert.throws(() => callTool('validar_cst', { tributo, cst }));
  }
  assert.equal(callTool('validar_cst', { tributo: 'CSOSN', cst: '0999' }).encontrado, false);
});

test('correlação aceita zeros sem aprovar o enquadramento', () => {
  for (const [cst_icms, csosn] of [['060', '0500'], ['090', '0900']]) {
    const result = callTool('correlacionar_dados_fiscais', { cst_icms, csosn, regime: 'regime_normal' });
    assert.equal(result.consultas.cst_icms.codigo_resulth, cst_icms);
    assert.equal(result.consultas.csosn.codigo, csosn);
    assert.equal(result.consultas.csosn.codigo_tabela, csosn.slice(1));
    assert.ok(result.confirmar.some(p => p.includes('campos distintos')));
    assert.equal(result.aplicacao_validada, undefined);
  }
});

test('transporte MCP consulta CSOSN 0900 preservando o contrato anterior', async () => {
  const response = await handler(new Request('http://localhost/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 101, method: 'tools/call', params: { name: 'validar_cst', arguments: { tributo: 'CSOSN', cst: '0900' } } }),
  }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.result.isError, undefined);
  const result = JSON.parse(body.result.content[0].text);
  assert.equal(result.codigo, '0900');
  assert.equal(result.codigo_tabela, '900');
  assert.equal(result.codigo_resulth, '0900');
});
