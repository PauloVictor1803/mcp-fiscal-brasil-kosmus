const byId = id => document.getElementById(id);
const forms = {
  consultar_cfop: ['cfop', 'CFOP', '5102'],
  validar_chave_nfe: ['chave', 'Chave com 44 dígitos', ''],
  validar_cst: ['cst', 'CST/CSOSN (preserve os zeros)', '000'],
  consultar_cest: ['descricao', 'Produto para buscar CEST', 'xampu'],
  correlacionar_dados_fiscais: ['descricao_produto', 'Descrição do produto (opcional se informar códigos)', 'xampu'],
  consultar_aliquota_icms: ['', '', ''],
};
for (const id of ['icms-origem', 'icms-destino']) {
  for (const uf of 'AC AL AM AP BA CE DF ES GO MA MT MS MG PA PB PR PE PI RN RS RJ RO RR SC SP SE TO'.split(' ')) {
    const option = document.createElement('option'); option.value = uf; option.textContent = uf; byId(id).append(option);
  }
}
byId('icms-origem').value = 'MG'; byId('icms-destino').value = 'SP';
byId('tool').addEventListener('change', () => {
  const [, label, example] = forms[byId('tool').value];
  byId('campo').textContent = label;
  byId('codigo').value = example;
  byId('tributo-label').hidden = byId('tool').value !== 'validar_cst';
  byId('cest-modo-label').hidden = byId('tool').value !== 'consultar_cest';
  byId('correlacao-campos').hidden = byId('tool').value !== 'correlacionar_dados_fiscais';
  const icms = byId('tool').value === 'consultar_aliquota_icms';
  byId('icms-campos').hidden = !icms;
  byId('codigo').parentElement.hidden = icms;
  byId('codigo').required = !icms && byId('tool').value !== 'correlacionar_dados_fiscais';
  byId('cest-modo').value = 'descricao';
});
byId('cest-modo').addEventListener('change', () => {
  const mode = byId('cest-modo').value;
  byId('campo').textContent = {descricao:'Descrição do produto',ncm:'NCM com 8 dígitos',cest:'Código CEST'}[mode];
  byId('codigo').value = {descricao:'xampu',ncm:'33051000',cest:'20.017.00'}[mode];
});
byId('teste').addEventListener('submit', async event => {
  event.preventDefault();
  byId('executar').disabled = true;
  byId('resultado').textContent = 'Consultando…';
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
    'MCP-Protocol-Version': '2025-11-25' };
  if (byId('token').value) headers.Authorization = `Bearer ${byId('token').value}`;
  const send = async (method, params, id) => {
    const response = await fetch('/mcp', { method: 'POST', headers,
      body: JSON.stringify({ jsonrpc: '2.0', ...(id === undefined ? {} : { id }), method, params }) });
    if (response.status === 202) return;
    const body = await response.json();
    if (!response.ok || body.error) throw new Error(body.erro || body.error?.message || `HTTP ${response.status}`);
    return body.result;
  };
  try {
    await send('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'painel-piloto', version: '0.1.0' } }, 1);
    await send('notifications/initialized', {});
    const name = byId('tool').value;
    const field = name === 'consultar_cest' ? byId('cest-modo').value : forms[name][0];
    const args = ['correlacionar_dados_fiscais','consultar_aliquota_icms'].includes(name) ? {} : { [field]: byId('codigo').value };
    if (name === 'consultar_aliquota_icms') {
      Object.assign(args, {uf_origem: byId('icms-origem').value, uf_destino: byId('icms-destino').value,
        ano: byId('icms-ano').value, origem_mercadoria: byId('icms-mercadoria').value});
    }
    if (name === 'correlacionar_dados_fiscais') {
      if (byId('codigo').value.trim()) args.descricao_produto = byId('codigo').value.trim();
      for (const key of ['ncm','modalidade_venda','cfop','cst_icms','csosn','regime','cst_ipi','cst_pis','cst_cofins']) {
        if (byId(key).value.trim()) args[key] = byId(key).value.trim();
      }
    }
    if (name === 'validar_cst') args.tributo = byId('tributo').value;
    const result = await send('tools/call', { name, arguments: args }, 2);
    const text = result.content[0].text;
    if (result.isError) throw new Error(text);
    byId('resultado').textContent = JSON.stringify(JSON.parse(text), null, 2);
  } catch (error) { byId('resultado').textContent = `Erro: ${error.message}`; }
  finally { byId('executar').disabled = false; }
});
