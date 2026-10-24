import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';

test('ponte aceita apenas GET e quatro fontes fixas', async () => {
  assert.equal((await worker.fetch(new Request('https://teste/?fonte=https://example.org'))).status,404);
  assert.equal((await worker.fetch(new Request('https://teste/',{method:'POST'}))).status,405);
  assert.equal((await (await worker.fetch(new Request('https://teste/'))).json()).fontes.length,4);
});
test('arquivo preserva bytes, origem e hash e reutiliza cache', async () => {
  const previousFetch=globalThis.fetch, previousCaches=globalThis.caches;
  const payload='<html>'+ 'documento oficial '.repeat(1500) +'</html>';
  const pending=[], entries=new Map();let downloads=0;
  try {
    globalThis.fetch=async (url,opts)=>{downloads++;assert.equal(url,'https://www.confaz.fazenda.gov.br/legislacao/convenios/2018/CV142_18');assert.equal(opts.headers,undefined);assert.equal(opts.redirect,'manual');return new Response(payload);};
    globalThis.caches={default:{match:async k=>entries.has(k.url)?entries.get(k.url).clone():undefined,put:async(k,r)=>entries.set(k.url,r)}};
    const request=new Request('https://teste/?fonte=cest&formato=arquivo');
    const result=await worker.fetch(request,{}, {waitUntil:p=>pending.push(p)});
    assert.equal(result.status,200);assert.equal(await result.text(),payload);
    assert.equal(result.headers.get('X-Official-Source'),'https://www.confaz.fazenda.gov.br/legislacao/convenios/2018/CV142_18');
    assert.match(result.headers.get('X-Source-SHA256'),/^[a-f0-9]{64}$/);
    await Promise.all(pending);
    assert.equal(await (await worker.fetch(request,{}, {waitUntil:p=>pending.push(p)})).text(),payload);
    assert.equal(downloads,1);
  } finally {globalThis.fetch=previousFetch;globalThis.caches=previousCaches;}
});
test('falha da origem nao vira documento valido nem cache', async()=>{
  const previousFetch=globalThis.fetch,previousCaches=globalThis.caches;
  try {
    globalThis.fetch=async()=>new Response('Indisponivel',{status:503});
    globalThis.caches={default:{match:async()=>undefined,put:async()=>assert.fail('Não pode armazenar erro')}};
    const r=await worker.fetch(new Request('https://teste/?fonte=moc&formato=arquivo'),{}, {waitUntil:()=>assert.fail('Não pode armazenar erro')});
    assert.equal(r.status,502);
  } finally {globalThis.fetch=previousFetch;globalThis.caches=previousCaches;}
});
