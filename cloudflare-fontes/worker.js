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
    const cacheKey = new Request(new URL('/fontes/' + name, request.url));
    if (arquivo) {
      const cached = await caches.default.match(cacheKey);
      if (cached) return cached;
    }
    const start = Date.now();
    try {
      const upstream = await fetch(sources[name], {signal:AbortSignal.timeout(20000),redirect:'manual'});
      const body = await upstream.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256',body);
      const sha256 = Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      const sample = new TextDecoder().decode(body.slice(0,100));
      if (arquivo) {
        if (upstream.status !== 200 || body.byteLength < 20000 || body.byteLength > 6000000 || (name === 'moc' && !sample.startsWith('%PDF'))) throw new Error('Documento oficial indisponivel ou invalido');
        const result = new Response(body,{headers:{'Content-Type':name==='moc'?'application/pdf':'text/html; charset=utf-8','Cache-Control':'public, max-age=3600','X-Official-Source':sources[name],'X-Source-SHA256':sha256,'X-Fetched-At':new Date().toISOString(),'X-Content-Type-Options':'nosniff'}});
        ctx.waitUntil(caches.default.put(cacheKey,result.clone()));
        return result;
      }
      return Response.json({fonte:name,url:sources[name],http:upstream.status,bytes:body.byteLength,sha256,
        formato:name==='moc' ? (sample.startsWith('%PDF')?'PDF':'outro') : (/html|doctype/i.test(sample)?'HTML':'outro'),
        duracao_ms:Date.now()-start}, {headers:{'Cache-Control':'no-store'}});
    } catch (error) {
      return Response.json({fonte:name,http:null,erro:error.name,mensagem:error.message,duracao_ms:Date.now()-start},{status:502,headers:{'Cache-Control':'no-store'}});
    }
  },
};
