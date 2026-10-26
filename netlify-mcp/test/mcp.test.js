import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/mcp.js';
import {callTool,tools,refreshTables} from '../src/fiscal.js';
import data from '../data/tabelas.json' with {type:'json'};
const chave='35240112345678000195550010000001231000000011';
const headers={'content-type':'application/json',accept:'application/json, text/event-stream'};
const req=(body,extra={})=>new Request('http://localhost/mcp',{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)});
test('catalogo MCP e transporte',async()=>{
 assert.equal(tools.length,4);assert.ok(Buffer.byteLength(JSON.stringify({tools}))<3000);
 const response=await handler(req({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'consultar_cfop',arguments:{cfop:'1403'}}}));
 const body=await response.json();assert.equal(body.result.content.length,1);assert.equal(body.result.structuredContent,undefined);
 assert.match(JSON.parse(body.result.content[0].text).descricao,/Compra para comercializa/);
 assert.equal((await handler(req({jsonrpc:'2.0',method:'notifications/initialized'}))).status,202);
});
test('chave conhecida, mascara, DV errado e entradas invalidas',()=>{
 assert.equal(callTool('validar_chave_nfe',{chave}).digito_valido,true);
 assert.equal(callTool('validar_chave_nfe',{chave:chave.match(/.{4}/g).join(' ')}).digito_valido,true);
 assert.equal(callTool('validar_chave_nfe',{chave:chave.slice(0,-1)+'2'}).digito_valido,false);
 assert.equal(callTool('validar_chave_nfe',{chave:'0'.repeat(44)}).formato_valido,false);
 assert.equal(callTool('validar_chave_nfe',{chave}).autorizacao_consultada,false);
 assert.throws(()=>callTool('validar_chave_nfe',{chave:Number(chave)}));
});
test('regressoes fiscais confirmadas nas fontes oficiais',()=>{
 assert.match(callTool('consultar_cfop',{cfop:'1.403'}).descricao,/substitui/);
 assert.equal(callTool('consultar_cfop',{cfop:'1650'}).encontrado,false);
 const cest=callTool('consultar_cest',{cest:'01.007.00'});assert.match(cest.descricao,/gaxetas/);assert.match(cest.ncm_sh,/4823\.90\.9/);
 assert.equal(callTool('consultar_cest',{cest:'0111000'}).status,'revogado');
 assert.equal(callTool('consultar_cest',{cest:'9999999'}).encontrado,false);
 for(const cst of ['02','15','53','61'])assert.equal(callTool('validar_cst',{cst,tributo:'ICMS'}).status,'ativo');
 assert.equal(callTool('validar_cst',{cst:'12',tributo:'ICMS'}).status,'revogado');
 assert.ok(callTool('validar_cst',{cst:'000',tributo:'ICMS'}).origem);
 assert.notEqual(callTool('validar_cst',{cst:'50',tributo:'PIS'}).descricao,callTool('validar_cst',{cst:'50',tributo:'IPI'}).descricao);
 assert.throws(()=>callTool('validar_cst',{cst:'50'}));
});
test('limite de contexto em todos os registros',()=>{
 const cases=[...Object.keys(data.CFOP_TABLE).map(cfop=>['consultar_cfop',{cfop}]),...Object.keys(data.CEST).map(cest=>['consultar_cest',{cest}]),
 ...[['ICMS',data.CST_ICMS],['CSOSN',data.CSOSN_TABLE],['IPI',data.CST_IPI],['PIS',data.CST_PIS],['COFINS',data.CST_COFINS]].flatMap(([tributo,table])=>Object.keys(table).map(cst=>['validar_cst',{cst,tributo}]))];
 for(const [name,args]of cases){const text=JSON.stringify(callTool(name,args));assert.ok(Buffer.byteLength(text)<3000,JSON.stringify(args));assert.ok(!text.includes('sha256'));}
});
test('busca CEST por produto, NCM e modalidade distingue os xampus',()=>{
 for(const descricao of ['xampu','XAMPUS','shampoo','shampoos']){
  const result=callTool('consultar_cest',{descricao});
  assert.deepEqual(result.candidatos.map(r=>r.cest),['20.017.00','28.011.00']);
  assert.match(result.candidatos[1].condicao,/porta a porta/);
  assert.ok(result.confirmar.some(p=>p.includes('porta a porta')));
 }
 const exact=callTool('consultar_cest',{ncm:'3305.10.00'});
 assert.equal(exact.total,2);
 assert.equal(callTool('consultar_cest',{descricao:'xampu',ncm:'33051000',modalidade_venda:'outras'}).candidatos[0].cest,'20.017.00');
 const direct=callTool('consultar_cest',{ncm:'33051000',modalidade_venda:'porta_a_porta'});
 assert.equal(direct.total,1);assert.equal(direct.candidatos[0].cest,'28.011.00');
 // Posição SH parcial 3917 também pode gerar candidato, sem fabricar um NCM.
 assert.ok(callTool('consultar_cest',{ncm:'39171010'}).candidatos.some(r=>r.ncm_sh.includes('3917')));
 assert.equal(callTool('consultar_cest',{descricao:'xampu',ncm:'87032100'}).encontrado,false);
 assert.equal(callTool('consultar_cest',{descricao:'zzzzinexistente'}).total,0);
 assert.ok(callTool('consultar_cest',{descricao:'condicionador'}).candidatos.some(r=>r.cest==='20.021.00'));
 assert.ok(callTool('consultar_cest',{descricao:'sabonete'}).total>0);
});
test('busca CEST rejeita entradas ambiguas e limita candidatos e contexto',()=>{
 const amplo=callTool('consultar_cest',{descricao:'óleo'});
 assert.equal(amplo.candidatos.length,6);
 assert.equal(amplo.mais_resultados,true);
 for(const args of [{},{descricao:' '},{descricao:'produto'},{descricao:'de para'},{ncm:'33'},{cest:'2001700',descricao:'xampu'},{descricao:'a'.repeat(121)},{modalidade_venda:'outras'}])assert.throws(()=>callTool('consultar_cest',args));
 for(const descricao of ['sabão','preparações','óleo','cabelo','xampu','polietileno']){
  const r=callTool('consultar_cest',{descricao});assert.ok(r.candidatos.length<=6);
  assert.ok(Buffer.byteLength(JSON.stringify(r))<3000);
  assert.equal(r.mais_resultados,r.total>r.candidatos.length);
  assert.ok(r.candidatos.every(c=>data.CEST[c.cest.replaceAll('.','')].status==='ativo'));
 }
});
test('aproximacao tolera erros sem converter codigos ou ignorar qualificadores',()=>{
 for(const descricao of ['xampuu','xmapu','condiconador']){
  const r=callTool('consultar_cest',{descricao});assert.ok(r.total>0,descricao);
  assert.equal(r.candidatos[0].correspondencia,'aproximada');assert.ok(Buffer.byteLength(JSON.stringify(r))<3000);
 }
 assert.equal(callTool('consultar_cest',{descricao:'ouro'}).total,0); // Não confundir ouro com couro.
 assert.equal(callTool('consultar_cest',{descricao:'xampu veterinario'}).total,0);
 assert.ok(callTool('consultar_cest',{descricao:'cerveja sem alcool'}).candidatos.every(r=>/sem álcool/i.test(r.descricao)));
 assert.equal(callTool('consultar_cest',{ncm:'33051001'}).total,0); // NCM não recebe aproximação.
});
test('HTTP e autenticacao',async()=>{
 assert.equal((await handler(new Request('http://localhost/mcp',{method:'POST',headers,body:'{'}))).status,400);
 assert.equal((await handler(req({x:'x'.repeat(9000)}))).status,413);
 const previous=process.env.AUTH_TOKEN;
 try{delete process.env.AUTH_TOKEN;assert.equal((await handler(new Request('https://example.netlify.app/mcp'))).status,503);
 process.env.AUTH_TOKEN='test-only';const body={jsonrpc:'2.0',id:1,method:'ping'};
 assert.equal((await handler(req(body))).status,401);assert.equal((await handler(req(body,{authorization:'Bearer test-only'}))).status,200);
 assert.equal((await handler(req(body,{authorization:'Bearer test-only',origin:'https://evil.example'}))).status,403);
 }finally{if(previous===undefined)delete process.env.AUTH_TOKEN;else process.env.AUTH_TOKEN=previous;}
});
test('falha de atualizacao conserva a ultima referencia validada',async()=>{
 const previous=process.env.TABLES_AUTO_UPDATE,original=globalThis.fetch;
 try{process.env.TABLES_AUTO_UPDATE='true';globalThis.fetch=async()=>new Response(JSON.stringify({metadata:{validacao:'reprovada'}}));await refreshTables();
 assert.match(callTool('consultar_cfop',{cfop:'1403'}).descricao,/Compra para comercializa/);
 }finally{globalThis.fetch=original;if(previous===undefined)delete process.env.TABLES_AUTO_UPDATE;else process.env.TABLES_AUTO_UPDATE=previous;}
});
