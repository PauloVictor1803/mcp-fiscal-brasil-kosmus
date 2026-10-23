const byId = id => document.getElementById(id);
const forms = {
  consultar_cfop: ['cfop', 'CFOP', '5102'],
  validar_chave_nfe: ['chave', 'Chave com 44 dígitos', ''],
  validar_cst: ['cst', 'CST/CSOSN (preserve os zeros)', '000'],
  consultar_cest: ['descricao', 'Produto para buscar CEST', 'xampu'],
};
byId('tool').addEventListener('change', () => {
  const [, label, example] = forms[byId('tool').value];
  byId('campo').textContent = label;
  byId('codigo').value = example;
  byId('tributo-label').hidden = byId('tool').value !== 'validar_cst';
  byId('cest-modo-label').hidden = byId('tool').value !== 'consultar_cest';
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
    const args = { [field]: byId('codigo').value };
    if (name === 'validar_cst') args.tributo = byId('tributo').value;
    const result = await send('tools/call', { name, arguments: args }, 2);
    const text = result.content[0].text;
    if (result.isError) throw new Error(text);
    byId('resultado').textContent = JSON.stringify(JSON.parse(text), null, 2);
  } catch (error) { byId('resultado').textContent = `Erro: ${error.message}`; }
  finally { byId('executar').disabled = false; }
});
