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
    assert.equal(result.headers.get('X-Worker-Cache'),'MISS');
    const originalFetchedAt=result.headers.get('X-Fetched-At');
    assert.equal(result.headers.get('X-Official-Source'),'https://www.confaz.fazenda.gov.br/legislacao/convenios/2018/CV142_18');
    assert.match(result.headers.get('X-Source-SHA256'),/^[a-f0-9]{64}$/);
    await Promise.all(pending);
    const hit=await worker.fetch(request,{}, {waitUntil:p=>pending.push(p)});
    assert.equal(hit.headers.get('X-Worker-Cache'),'HIT');
    assert.equal(hit.headers.get('X-Fetched-At'),originalFetchedAt);
    const detail=JSON.parse(hit.headers.get('X-Source-Diagnostics'));
    assert.equal(detail.worker_cache,'HIT');assert.equal(detail.fetch_executado_nesta_chamada,false);
    assert.equal(detail.origem_http,null);assert.equal(detail.tempo_corpo_ms,null);
    assert.equal(detail.coleta_anterior.worker_cache,'MISS');
    assert.equal(await hit.text(),payload);
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
    const detail=await r.json();
    assert.equal(detail.origem_http,503);
    assert.equal(detail.origem_bytes,12);
  } finally {globalThis.fetch=previousFetch;globalThis.caches=previousCaches;}
});

test('diagnostico sem cache busca origem e registra placement', async()=>{
  const previousFetch=globalThis.fetch,previousCaches=globalThis.caches;
  try {
    globalThis.caches={default:{match:async()=>assert.fail('Nao deve ler cache'),put:async()=>assert.fail('Nao deve gravar cache')}};
    globalThis.fetch=async(url,opts)=>{assert.equal(opts.cache,'no-store');return new Response('<html>'+'a'.repeat(21000)+'</html>');};
    const request=new Request('https://teste/?fonte=cest&formato=arquivo&nocache=1',{headers:{'cf-placement':'remote-GRU'}});
    const r=await worker.fetch(request,{}, {waitUntil:()=>assert.fail('Nao deve gravar cache')});
    assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');
    const d=JSON.parse(r.headers.get('X-Source-Diagnostics'));assert.equal(d.worker_cache,'BYPASS');assert.equal(d.origem_cf_cache,null);assert.equal(d.sem_cache,true);assert.equal(d.origem_http,200);
  } finally {globalThis.fetch=previousFetch;globalThis.caches=previousCaches;}
});

test('MISS no Worker pode ser HIT na CDN sem alegar nova origem', async()=>{
  const previousFetch=globalThis.fetch,previousCaches=globalThis.caches;
  try{
    globalThis.caches={default:{match:async()=>undefined,put:async()=>{}}};
    globalThis.fetch=async()=>new Response('<html>'+'a'.repeat(21000),{headers:{'CF-Cache-Status':'HIT'}});
    const r=await worker.fetch(new Request('https://teste/?fonte=cest&formato=arquivo'),{}, {waitUntil:()=>{}});
    const d=JSON.parse(r.headers.get('X-Source-Diagnostics'));
    assert.equal(d.worker_cache,'MISS');assert.equal(d.origem_cf_cache,'HIT');
  }finally{globalThis.fetch=previousFetch;globalThis.caches=previousCaches;}
});

test('falha durante leitura do corpo preserva status e nao grava cache',async()=>{
  const previousFetch=globalThis.fetch,previousCaches=globalThis.caches;
  try{
    globalThis.caches={default:{match:async()=>undefined,put:async()=>assert.fail('nao cachear')}};
    globalThis.fetch=async(url,options)=>{
      assert.ok(options.signal instanceof AbortSignal);
      return {status:200,headers:new Headers(),arrayBuffer:async()=>{throw new DOMException('leitura abortada','TimeoutError');}};
    };
    const r=await worker.fetch(new Request('https://teste/?fonte=moc&formato=arquivo'),{}, {waitUntil:()=>assert.fail('nao cachear')});
    assert.equal(r.status,502);const d=await r.json();
    assert.equal(d.erro,'TimeoutError');assert.equal(d.origem_http,200);assert.equal(d.origem_bytes,null);
  }finally{globalThis.fetch=previousFetch;globalThis.caches=previousCaches;}
});
