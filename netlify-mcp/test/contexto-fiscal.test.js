import test from 'node:test';
import assert from 'node:assert/strict';
import { callTool } from '../src/fiscal.js';
import segments from '../data/segmentos-cest.json' with { type: 'json' };
import tables from '../data/tabelas.json' with { type: 'json' };

test('segmentos CEST identificam contexto nas buscas e códigos diretos', () => {
  assert.equal(Object.keys(segments).length, 25);
  for (const code of Object.keys(tables.CEST)) assert.ok(segments[code.slice(0, 2)], code);
  const auto = callTool('consultar_cest', { cest: '01.036.00' });
  assert.equal(auto.segmento_nome, 'Autopeças');
  const result = callTool('consultar_cest', { descricao: 'ar condicionado' });
  assert.ok(result.candidatos.every(c => c.segmento_nome));
  assert.ok(result.candidatos.find(c => c.cest === '01.036.00').segmento_nome === 'Autopeças');
  assert.ok(result.confirmar.some(p => p.includes('veículo') && p.includes('ambiente')));
  assert.ok(!result.confirmar.some(p => p.includes('embalagem')));
});

test('busca de aparelho prioriza aparelhos sem perder a busca explícita de peças', () => {
  const result = callTool('consultar_cest', { descricao: 'ar condicionado' });
  assert.ok(result.candidatos.length <= 6);
  assert.ok(result.candidatos.some(c => c.cest === '21.093.00'));
  assert.ok(result.candidatos.every(c => !/^(Filtros|Tubos)/i.test(c.descricao)));
  assert.ok(Buffer.byteLength(JSON.stringify(result)) < 4000);
  const part = callTool('consultar_cest', { descricao: 'filtro ar condicionado' });
  assert.ok(part.candidatos.some(c => c.cest === '01.095.00'));
  const split = callTool('consultar_cest', { descricao: 'ar condicionado', ncm: '84151011' });
  assert.ok(!split.candidatos.some(c => c.cest === '01.036.00'));
});

test('PIS e COFINS explicam limites sem selecionar alíquota ou base', () => {
  for (const tributo of ['PIS', 'COFINS']) {
    const r = callTool('validar_cst', { tributo, cst: '99' });
    assert.equal(r.descricao, 'Outras Operações');
    assert.match(r.aviso, /não determina incidência, alíquota ou base/);
    assert.equal(r.aliquota, undefined);
    const correlated = callTool('correlacionar_dados_fiscais', { cfop: '6102', [tributo === 'PIS' ? 'cst_pis' : 'cst_cofins']: '99' });
    assert.ok(Object.values(correlated.consultas).some(c => c.aviso?.includes('CFOP e regime isolados')));
  }
});
