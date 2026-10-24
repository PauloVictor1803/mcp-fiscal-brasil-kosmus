// Diagnóstico isolado de acesso a documentos públicos oficiais. Sem dados de clientes.
const sources = {
  cest: 'https://www.confaz.fazenda.gov.br/legislacao/convenios/2018/CV142_18',
  cfop: 'https://www.confaz.fazenda.gov.br/legislacao/ajustes/sinief/cfop_cvsn_1-6.24/',
  icms: 'https://www.confaz.fazenda.gov.br/legislacao/ajustes/sinief/cvsn_70',
  moc: 'https://www.confaz.fazenda.gov.br/legislacao/arquivo-manuais/moc7-anexo-i-leiaute-e-rv.pdf',
};
export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET') return new Response('Use GET', {status:405});
    const name = new URL(request.url).searchParams.get('fonte');
    if (!name) return Response.json({servico:'Teste de conectividade CONFAZ',fontes:Object.keys(sources)});
    if (!Object.hasOwn(sources,name)) return new Response('Fonte desconhecida',{status:404});
    const arquivo = new URL(request.url).searchParams.get('formato') === 'arquivo';
    const nocache = new URL(request.url).searchParams.get('nocache') === '1';
    const cacheKey = new Request(new URL('/fontes/' + name, request.url));
    if (arquivo && !nocache) {
      const cached = await caches.default.match(cacheKey);
      if (cached) {
        const headers = new Headers(cached.headers);
        let anterior = {};
        try { anterior = JSON.parse(headers.get('X-Source-Diagnostics') || '{}'); } catch {}
        headers.set('X-Worker-Cache','HIT');
        headers.set('X-Source-Diagnostics',JSON.stringify({
          colo_entrada:request.cf?.colo ?? null,
          worker_cache:'HIT', sem_cache:false, fetch_executado_nesta_chamada:false,
          origem_http:null,origem_bytes:null,tempo_cabecalhos_ms:null,tempo_corpo_ms:null,
          origem_cf_cache:null, coleta_anterior:anterior,
        }));
        return new Response(cached.body,{status:cached.status,headers});
      }
    }
    const start = Date.now();
    const workerCache = nocache ? 'BYPASS' : arquivo ? 'MISS' : 'NAO_APLICAVEL';
    const diagnostico = {colo_entrada:request.cf?.colo ?? null, worker_cache:workerCache,
      fetch_executado_nesta_chamada:true, origem_cf_cache:null,
      origem_http:null, origem_bytes:null, tempo_cabecalhos_ms:null, tempo_corpo_ms:null, sem_cache:nocache};
    try {
      const upstream = await fetch(sources[name], {signal:AbortSignal.timeout(45000),redirect:'manual', ...(nocache ? {cache:'no-store'} : {})});
      diagnostico.tempo_cabecalhos_ms=Date.now()-start;
      diagnostico.origem_http=upstream.status;
      diagnostico.origem_cf_cache=upstream.headers.get('CF-Cache-Status');
      const bodyStart=Date.now();
      const body = await upstream.arrayBuffer();
      diagnostico.tempo_corpo_ms=Date.now()-bodyStart;
      diagnostico.origem_bytes=body.byteLength;
      const digest = await crypto.subtle.digest('SHA-256',body);
      const sha256 = Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      const sample = new TextDecoder().decode(body.slice(0,100));
      if (arquivo) {
        if (upstream.status !== 200 || body.byteLength < 20000 || body.byteLength > 6000000 || (name === 'moc' && !sample.startsWith('%PDF'))) throw new Error('Documento oficial indisponivel ou invalido (HTTP '+upstream.status+', '+body.byteLength+' bytes)');
        const result = new Response(body,{headers:{'Content-Type':name==='moc'?'application/pdf':'text/html; charset=utf-8','Cache-Control':nocache?'no-store':'public, max-age=3600','X-Official-Source':sources[name],'X-Source-SHA256':sha256,'X-Fetched-At':new Date().toISOString(),'X-Worker-Cache':workerCache,'X-Content-Type-Options':'nosniff','X-Source-Diagnostics':JSON.stringify({...diagnostico,duracao_ms:Date.now()-start})}});
        if (!nocache) ctx.waitUntil(caches.default.put(cacheKey,result.clone()));
        return result;
      }
      return Response.json({fonte:name,url:sources[name],http:upstream.status,bytes:body.byteLength,sha256,
        formato:name==='moc' ? (sample.startsWith('%PDF')?'PDF':'outro') : (/html|doctype/i.test(sample)?'HTML':'outro'),
        ...diagnostico,duracao_ms:Date.now()-start}, {headers:{'Cache-Control':'no-store','X-Worker-Cache':workerCache}});
    } catch (error) {
      return Response.json({fonte:name,http:null,erro:error.name,mensagem:error.message,...diagnostico,duracao_ms:Date.now()-start},{status:502,headers:{'Cache-Control':'no-store','X-Worker-Cache':workerCache}});
    }
  },
};
