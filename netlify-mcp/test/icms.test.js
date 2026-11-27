import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseMatrix } from '../../scripts/gerar_icms_manual.mjs';
import { consultarAliquotaICMS } from '../src/icms.js';
import { callTool, tools } from '../src/fiscal.js';
import handler from '../netlify/functions/mcp.js';

const csv = fs.readFileSync(new URL('../data/icms-referencia-manual.csv',import.meta.url),'utf8');
const matrix = parseMatrix(csv);
test('729 pares do CSV preservados, sem enviar matriz ao modelo',()=>{
 for(const [origem,row] of Object.entries(matrix)) for(const [destino,rate] of Object.entries(row)) {
  const result=callTool('consultar_aliquota_icms',{uf_origem:origem,uf_destino:destino,ano:'2026'});
  assert.equal(result.percentual_referencia,rate);
  assert.equal(result.aplicacao_a_operacao_validada,false);
  assert.ok(Buffer.byteLength(JSON.stringify(result))<1500);
  assert.ok(!Object.hasOwn(result,'matriz'));
 }
 assert.equal(callTool('consultar_aliquota_icms',{uf_origem:'SP',uf_destino:'ES',ano:'2026'}).percentual_referencia,7);
 assert.equal(callTool('consultar_aliquota_icms',{uf_origem:'ES',uf_destino:'SP',ano:'2026'}).percentual_referencia,12);
});
test('ano e importados não recebem enquadramento automático',()=>{
 const args={uf_origem:'MG',uf_destino:'SP'};
 for(const ano of ['2025','2027']){
  const result=callTool('consultar_aliquota_icms',{...args,ano});
  assert.equal(result.encontrado,false); assert.equal(result.percentual_referencia,undefined);
 }
 assert.equal(consultarAliquotaICMS(args,new Date('2027-06-01T12:00:00Z')).encontrado,false);
 const imported=callTool('consultar_aliquota_icms',{...args,ano:'2026',origem_mercadoria:'importada'});
 assert.ok(imported.avisos.some(s=>s.includes('não determina a alíquota')));
 assert.equal(imported.aplicacao_a_operacao_validada,false);
});
test('interna distingue percentual de referência e eventual FCP',()=>{
 const result=callTool('consultar_aliquota_icms',{uf_origem:'RJ',uf_destino:'RJ',ano:'2026'});
 assert.equal(result.percentual_referencia,22); assert.equal(result.tipo,'interna');
 assert.ok(result.avisos.some(s=>s.includes('FCP')&&s.includes('não estão separados')));
 assert.equal(result.aliquota_icms,undefined);
});
test('entradas e edição de matriz inválidas são rejeitadas',()=>{
 for(const args of [{uf_origem:'XX',uf_destino:'SP'},{uf_origem:'MG'},{uf_origem:'mg',uf_destino:'SP'},{uf_origem:'MG',uf_destino:'SP',ano:'26'}]) assert.throws(()=>callTool('consultar_aliquota_icms',args));
 for(const invalid of [csv.replace(';AL;',';AC;'),csv.replace('19;12',';12'),csv.replace('21,5','0,215'),csv.replace('21,5','-2'),csv.replace('21,5','=1+2'),csv.split('\n').slice(0,20).join('\n')]) assert.throws(()=>parseMatrix(invalid));
});
test('consulta ICMS funciona via MCP e dispensa atualização CONFAZ',async()=>{
 assert.ok(tools.some(t=>t.name==='consultar_aliquota_icms'));
 const old=process.env.TABLES_AUTO_UPDATE, original=globalThis.fetch;
 try {
  process.env.TABLES_AUTO_UPDATE='true';globalThis.fetch=async()=>{throw new Error('A consulta manual não deveria acessar CONFAZ');};
  const r=await handler(new Request('http://localhost/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'consultar_aliquota_icms',arguments:{uf_origem:'MG',uf_destino:'SP',ano:'2026'}}})}));
  const body=await r.json();assert.equal(r.status,200);assert.equal(body.result.isError,undefined);
  assert.equal(JSON.parse(body.result.content[0].text).percentual_referencia,12);
 } finally {globalThis.fetch=original;if(old===undefined)delete process.env.TABLES_AUTO_UPDATE;else process.env.TABLES_AUTO_UPDATE=old;}
});
