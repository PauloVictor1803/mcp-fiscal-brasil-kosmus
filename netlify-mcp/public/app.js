const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = String(text); return node; };
const paths = {
  route: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h9"/>',
  cfop: '<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3M8 9l-3 3 3 3m8-6 3 3-3 3m-3-8-2 10"/>',
  cest: '<path d="M20 13l-7 7a2 2 0 0 1-3 0L3 13V4h9l8 6a2 2 0 0 1 0 3Z"/><circle cx="7.5" cy="8" r="1"/>',
  taxes: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2m4 0h2m-8 4h2m4 0h2M8 18h2m4 0h2"/>',
  key: '<path d="M14 3h4l3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3m6 0v5h5M7 13l3 3 6-6"/>',
  cross: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M15 3h6v6M3 15v6h6M9 6h3a6 6 0 0 1 6 6v3M6 9v3a6 6 0 0 0 6 6h3"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M8 10h5m-5 3h3"/>',
};
function icon(name) { const wrap = el('span'); wrap.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.search}</svg>`; return wrap.firstElementChild; }
const ufs = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const choice = (value, label = value) => [value, label];
const select = (name, label, options, extra = {}) => ({ name, label, options, ...extra });
const input = (name, label, extra = {}) => ({ name, label, ...extra });
const modality = select('modalidade_venda', 'Modalidade de venda', [choice('', 'Não informada'), choice('outras', 'Outras modalidades'), choice('porta_a_porta', 'Porta a porta')], { optional: true });
const tools = {
  consultar_aliquota_icms: {
    label: 'Alíquota de ICMS', icon: 'route', title: 'De onde para onde?',
    description: 'Encontre a referência geral de ICMS para a origem e o destino da operação.',
    footnote: 'Matriz manual de 2026. O resultado não define o enquadramento da operação.', button: 'Consultar referência',
    fields: [select('uf_origem', 'Estado de origem', ufs.map(x => choice(x)), { value: 'MG', required: true }), select('uf_destino', 'Estado de destino', ufs.map(x => choice(x)), { value: 'SP', required: true }), input('ano', 'Ano da operação', { value: '2026', maxLength: 4, pattern: '[0-9]{4}', inputMode: 'numeric', required: true }), select('origem_mercadoria', 'Origem da mercadoria', [choice('nao_informada', 'Não informada'), choice('nacional', 'Nacional'), choice('importada', 'Importada')])],
    example: { uf_origem: 'MG', uf_destino: 'SP', ano: '2026', origem_mercadoria: 'nacional' },
  },
  consultar_cfop: {
    label: 'CFOP', icon: 'cfop', title: 'Confira um CFOP', description: 'Veja a descrição do código, o tipo e o âmbito da operação.',
    footnote: 'A descrição de um CFOP não comprova sua aplicação à operação.', button: 'Consultar CFOP',
    fields: [input('cfop', 'Código CFOP', { placeholder: 'Ex.: 5.102', required: true, full: true, maxLength: 5, pattern: '[123567]\\.?[0-9]{3}', inputMode: 'decimal', help: 'Informe 4 dígitos, com ou sem ponto.' })], example: { cfop: '5.102' },
  },
  consultar_cest: {
    label: 'CEST', icon: 'cest', title: 'Encontre candidatos de CEST', description: 'Pesquise por produto, NCM confirmado ou um código CEST conhecido.',
    footnote: 'Um CEST encontrado não determina a aplicação de substituição tributária.', button: 'Pesquisar CEST',
    fields: [select('_modo', 'Pesquisar por', [choice('descricao', 'Descrição do produto'), choice('ncm', 'NCM confirmado'), choice('cest', 'Código CEST')], { full: true })],
    example: { _modo: 'descricao', descricao: 'xampu', ncm: '', modalidade_venda: '' },
  },
  validar_cst: {
    label: 'CST e CSOSN', icon: 'taxes', title: 'Confira o código tributário', description: 'Consulte a descrição do CST ou CSOSN na tabela do tributo informado.',
    footnote: 'O código é conferido na tabela. Sua aplicação depende da operação e da orientação contábil.', button: 'Consultar código',
    fields: [select('tributo', 'Tributo', ['ICMS','CSOSN','IPI','PIS','COFINS'].map(x => choice(x))), input('cst', 'Código CST / CSOSN', { placeholder: 'Ex.: 000', required: true, pattern: '[0-9]{2,3}', maxLength: 3, inputMode: 'numeric', help: 'Preserve os zeros à esquerda.' })], example: { tributo: 'ICMS', cst: '000' },
  },
  validar_chave_nfe: {
    label: 'Chave NF-e / NFC-e', icon: 'key', title: 'Confira a chave da nota', description: 'Verifique o formato e o dígito de uma chave de acesso, sem consultar a autorização da nota.',
    footnote: 'Uma chave com dígito correto não comprova que a nota foi autorizada pela SEFAZ.', button: 'Verificar chave',
    fields: [input('chave', 'Chave de acesso', { placeholder: 'Informe os 44 dígitos', required: true, maxLength: 80, pattern: '[0-9\\s]{44,80}', inputMode: 'numeric', full: true, help: 'Pode colar a chave com espaços entre os grupos.' })],
    example: { chave: '35260112345678000190550010000000011000000013' },
  },
  correlacionar_dados_fiscais: {
    label: 'Conferência conjunta', icon: 'cross', title: 'Reúna os dados fiscais', description: 'Compare os códigos e os candidatos de um produto em uma consulta. Preencha somente o que já sabe.',
    footnote: 'A conferência não escolhe a tributação nem converte CST em CSOSN.', button: 'Conferir informações',
    fields: [input('descricao_produto', 'Descrição do produto', { optional: true, full: true, maxLength: 120, placeholder: 'Ex.: xampu de uso pessoal' }), input('ncm', 'NCM confirmado', { optional: true, inputMode: 'numeric', maxLength: 10, placeholder: 'Ex.: 33051000' }), select('regime', 'Regime do emitente', [choice('', 'Não informado'), choice('simples_nacional', 'Simples Nacional'), choice('regime_normal', 'Regime normal'), choice('nao_confirmado', 'Ainda não confirmado')], { optional: true }), input('cfop', 'CFOP candidato', { optional: true, maxLength: 5, placeholder: 'Ex.: 5.102' }), input('cst_icms', 'CST ICMS', { optional: true, maxLength: 3, placeholder: 'Ex.: 000' }), input('csosn', 'CSOSN', { optional: true, maxLength: 3, placeholder: 'Ex.: 102' }), modality],
    advanced: ['IPI','PIS','COFINS'].map(x => input(`cst_${x.toLowerCase()}`, `CST ${x}`, { optional: true, maxLength: 2, inputMode: 'numeric' })),
    example: { descricao_produto: 'xampu', ncm: '33051000', cfop: '5.102', regime: '', cst_icms: '', csosn: '', modalidade_venda: '' },
  },
};
let active = 'consultar_aliquota_icms';
let controller, requestNumber = 0, lastResult;
const savedFields = new Map();
function values() { return Object.fromEntries(new FormData($('query-form')).entries()); }
function makeField(field, current) {
  const wrap = el('div', `field${field.full ? ' full' : ''}`), label = el('label', '', field.label);
  const id = `field-${field.name}`; label.htmlFor = id;
  if (field.optional) label.append(el('span', 'optional', 'opcional'));
  const control = el(field.options ? 'select' : 'input'); control.id = id; control.name = field.name;
  if (field.options) for (const [value, title] of field.options) { const option = el('option', '', title); option.value = value; control.append(option); }
  else { control.type = 'text'; control.autocomplete = 'off'; if (field.maxLength) control.maxLength = field.maxLength; if (field.pattern) control.pattern = field.pattern; if (field.inputMode) control.inputMode = field.inputMode; if (field.placeholder) control.placeholder = field.placeholder; }
  control.required = Boolean(field.required); control.value = current[field.name] ?? field.value ?? (field.options ? field.options[0][0] : '');
  wrap.append(label, control);
  if (field.help) { const help = el('p', 'field-help', field.help); help.id = `${id}-help`; control.setAttribute('aria-describedby', help.id); wrap.append(help); }
  return wrap;
}
function drawFields(current = {}) {
  const config = tools[active], grid = el('div', 'fields-grid');
  for (const f of config.fields) grid.append(makeField(f, current));
  if (active === 'consultar_cest') {
    const mode = current._modo || 'descricao';
    if (mode === 'cest') grid.append(makeField(input('cest', 'Código CEST', { full: true, required: true, placeholder: 'Ex.: 20.017.00', maxLength: 9 }), current));
    else {
      if (mode === 'descricao') grid.append(makeField(input('descricao', 'Descrição do produto', { full: true, required: true, placeholder: 'Ex.: xampu', maxLength: 120 }), current));
      grid.append(makeField(input('ncm', 'NCM confirmado', { full: true, required: mode === 'ncm', optional: mode !== 'ncm', placeholder: 'Ex.: 33051000', maxLength: 10, inputMode: 'numeric', help: 'A classificação NCM deve ser conferida na consulta Siscomex.' }), current), makeField({ ...modality, full: true }, current));
    }
  }
  if (config.advanced) { const details = el('details', 'advanced-fields'); details.append(el('summary', '', 'IPI, PIS e COFINS')); const more = el('div', 'fields-grid'); for (const f of config.advanced) more.append(makeField(f, current)); details.append(more); grid.append(details); }
  $('tool-fields').replaceChildren(grid);
  $('field-_modo')?.addEventListener('change', () => { const current = values(); drawFields(current); $('field-_modo').focus(); });
}
function emptyState() {
  const wrap = el('div', 'empty-state'), illustration = el('div', 'empty-icon'); illustration.append(icon('search'));
  wrap.append(illustration, el('h3', '', 'Sua próxima resposta começa aqui.'), el('p', '', 'Preencha os campos ao lado e faça uma consulta. O resultado aparece neste espaço.'));
  const tag = el('div', 'empty-tag'); tag.append(el('span'), document.createTextNode('SOMENTE O QUE VOCÊ PRECISA CONFERIR')); wrap.append(tag); $('result').replaceChildren(wrap);
}
function setTool(name) {
  if (!Object.hasOwn(tools, name)) return;
  if ($('query-form').elements.length) savedFields.set(active, values());
  controller?.abort(); requestNumber++; active = name; lastResult = undefined; $('copy-result').hidden = true;
  const config = tools[name]; $('tool-title').textContent = config.title; $('tool-description').textContent = config.description; $('tool-footnote').textContent = config.footnote; $('tool-icon').replaceChildren(icon(config.icon));
  for (const button of $('tool-nav').children) button.setAttribute('aria-pressed', String(button.dataset.tool === name));
  drawFields(savedFields.get(name)); setBusy(false); emptyState();
}
for (const [name, config] of Object.entries(tools)) {
  const button = el('button', 'nav-item'); button.type = 'button'; button.dataset.tool = name; button.title = config.label; button.setAttribute('aria-label', config.label); button.setAttribute('aria-pressed', 'false'); button.append(icon(config.icon), el('span', '', config.label), el('span', 'nav-arrow', '↗')); button.addEventListener('click', () => setTool(name)); $('tool-nav').append(button);
}
function setBusy(busy) { $('submit-button').disabled = busy; $('example-button').disabled = busy; $('result-panel').setAttribute('aria-busy', String(busy)); $('submit-label').textContent = busy ? 'Consultando…' : tools[active].button; $('submit-arrow').hidden = busy; }
function loadingState() { const wrap = el('div', 'empty-state'); wrap.append(el('div', 'spinner'), el('h3', '', 'Conferindo a referência…'), el('p', '', 'Aguarde enquanto consultamos a ferramenta selecionada.')); $('result').replaceChildren(wrap); }
function notice(parent, messages) { const list = Array.isArray(messages) ? messages.filter(Boolean) : [messages].filter(Boolean); if (!list.length) return; const wrap = el('div', 'notice'), text = el('ul'); for (const item of list) text.append(el('li', '', item)); wrap.append(el('span', '', 'ⓘ'), text); parent.append(wrap); }
function badge(parent, text, style = '') { parent.append(el('span', `badge ${style}`, text)); }
function metadata(parent, entries) { const grid = el('div', 'result-meta'); for (const [label, value] of entries) if (value !== undefined && value !== null && value !== '') { const item = el('div'); item.append(el('div', 'meta-label', label), el('div', 'meta-value', value)); grid.append(item); } if (grid.children.length) parent.append(grid); }
function source(parent, label, url) { const line = el('div', 'result-source'); line.append(document.createTextNode(`${label} `)); if (url) { try { const u = new URL(url); if (!['http:', 'https:'].includes(u.protocol)) return; const link = el('a', '', 'Ver referência ↗'); link.href = u.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; line.append(link); } catch { /* Unusable URLs are never rendered as links. */ } } parent.append(line); }
function candidates(parent, data) {
  const candidates = data.candidatos || [];
  parent.append(el('div', 'result-kicker', `${candidates.length} candidato(s) exibido(s)${data.total !== undefined ? ` · ${data.total} encontrado(s)` : ''}`));
  for (const row of candidates) { const card = el('div', 'candidate'), top = el('div', 'candidate-top'); top.append(el('span', 'candidate-code', row.cest)); badge(top, row.correspondencia === 'aproximada' ? 'Aproximação' : 'Candidato', 'neutral'); card.append(top, el('p', '', row.descricao)); if (row.ncm_sh) card.append(el('small', '', `NCM/SH: ${row.ncm_sh}`)); if (row.segmento_nome) card.append(el('small', '', row.segmento_nome)); if (row.condicao) card.append(el('small', '', row.condicao)); parent.append(card); }
  if (!candidates.length) parent.append(el('p', 'result-description', data.orientacao || data.motivo || 'Nenhum candidato encontrado na referência consultada.'));
  if (data.mais_resultados) notice(parent, 'Existem mais resultados. Refine a descrição, o NCM ou a modalidade de venda.');
  if (data.confirmar?.length) notice(parent, data.confirmar);
}
function lookup(parent, data) {
  const status = { ativo: 'Registro ativo', revogado: 'Revogado', vigencia_futura: 'Vigência futura', referencia_expirada: 'Referência expirada', aguardando_atualizacao: 'Aguardando atualização' };
  const badges = el('div', 'result-badges'); badge(badges, data.encontrado === false ? 'Não localizado' : (status[data.status] || 'Código localizado'), data.encontrado === false || (data.status && data.status !== 'ativo') ? 'warning' : ''); parent.append(badges);
  if (data.codigo) { const displayCode = String(data.codigo).length === 7 ? String(data.codigo).replace(/^(\d{2})(\d{3})(\d{2})$/, '$1.$2.$3') : data.codigo; parent.append(el('div', 'result-value code', displayCode)); }
  if (data.descricao || data.motivo) parent.append(el('p', 'result-description', data.descricao || data.motivo));
  metadata(parent, [['Tributo', data.tributo], ['Operação', data.tipo], ['Âmbito', data.ambito], ['Origem', data.origem], ['NCM/SH', data.ncm_sh], ['Início da vigência', data.inicio]]);
  if (data.aviso) notice(parent, data.aviso);
}
function renderResult(data, name) {
  const parent = el('div', 'result-content'); lastResult = data; $('copy-result').textContent = 'Copiar JSON ⧉';
  if (name === 'consultar_aliquota_icms') {
    const badges = el('div', 'result-badges'); badge(badges, data.encontrado ? 'Referência encontrada' : 'Sem referência para o ano', data.encontrado ? '' : 'warning'); badge(badges, `Tabela manual · ${data.ano_referencia}`, 'neutral'); parent.append(badges, el('div', 'result-kicker', `${data.uf_origem} → ${data.uf_destino} · ${data.tipo === 'interna' ? 'Operação interna' : 'Origem e destino'}`));
    if (data.encontrado && Number.isFinite(data.percentual_referencia)) parent.append(el('div', 'result-value', `${data.percentual_referencia.toLocaleString('pt-BR')}%`), el('p', 'result-description', 'Referência geral. A aplicação à operação não foi validada.'));
    else parent.append(el('p', 'result-description', data.motivo));
    metadata(parent, [['Ano da operação', data.ano_consultado], ['Atualização da tabela', data.atualizacao === 'manual' ? 'Manual' : data.atualizacao]]); notice(parent, data.avisos); source(parent, data.fonte, data.url_fonte);
  } else if (name === 'validar_chave_nfe') {
    const ok = data.formato_valido && data.digito_valido; const badges = el('div', 'result-badges'); badge(badges, ok ? 'Formato e dígito conferem' : 'Chave com inconsistência', ok ? '' : 'warning'); parent.append(badges, el('div', 'result-value code', ok ? 'Dígito confere' : 'Confira a chave'), el('p', 'result-description', data.motivo || 'A chave passou na verificação matemática.')); metadata(parent, [['Formato', data.formato_valido ? '44 dígitos' : 'Inválido'], ['Dígito verificador', data.digito_valido ? 'Correto' : 'Não confere']]); notice(parent, 'Esta verificação não consulta a autorização ou a situação da nota na SEFAZ.');
  } else if (name === 'consultar_cest' && Array.isArray(data.candidatos)) {
    candidates(parent, data); notice(parent, data.orientacao); source(parent, 'Tabela de CEST · CONFAZ', data.fonte);
  } else if (name === 'correlacionar_dados_fiscais') {
    parent.append(el('p', 'result-description', 'Conferência dos dados informados. Os códigos não foram selecionados automaticamente para a operação.'));
    const names = { cest: 'Candidatos de CEST', cfop: 'CFOP', cst_icms: 'CST ICMS', csosn: 'CSOSN', cst_ipi: 'CST IPI', cst_pis: 'CST PIS', cst_cofins: 'CST COFINS' };
    for (const [key, value] of Object.entries(data.consultas || {})) { const group = el('section', 'correlation-section'); group.append(el('h3', '', names[key] || key)); if (Array.isArray(value.candidatos)) candidates(group, value); else lookup(group, value); parent.append(group); }
    if (data.ncm) metadata(parent, [['NCM informado', data.ncm.codigo], ['Conferência NCM', data.ncm.situacao]]); notice(parent, data.confirmar); notice(parent, data.limites); for (const [key, url] of Object.entries(data.fontes || {})) source(parent, `Referência ${key.toUpperCase()}`, url);
  } else { lookup(parent, data); notice(parent, 'A descrição do código não valida seu enquadramento. Confirme a aplicação com a contabilidade.'); }
  if (data.referencia) source(parent, `Data da referência: ${data.referencia}`);
  if (data.atualizacao_atrasada) notice(parent, 'A referência está marcada como desatualizada. Confira a fonte e sua vigência antes de usar o resultado.');
  const details = el('details', 'json-details'); details.append(el('summary', '', 'Ver resposta completa (JSON)'), el('pre', '', JSON.stringify(data, null, 2))); parent.append(details); $('result').replaceChildren(parent); $('copy-result').hidden = false;
}
function renderError(error) {
  const wrap = el('div', 'empty-state error-state'), image = el('div', 'empty-icon'); image.append(icon('search'));
  wrap.append(image, el('h3', '', error.status === 401 ? 'Precisamos conferir seu acesso.' : 'Não foi possível concluir a consulta.'), el('p', '', error.message));
  if (error.status === 401) { const button = el('button', 'text-button error-action', 'Configurar token de acesso ↗'); button.type = 'button'; button.addEventListener('click', () => $('access-dialog').showModal()); wrap.append(button); }
  $('result').replaceChildren(wrap); $('copy-result').hidden = true; lastResult = undefined;
}
function connection(ok) { $('connection-dot').classList.toggle('connected', ok); $('connection-text').textContent = ok ? 'Conexão verificada' : 'Configurar acesso'; }
async function rpcClient(signal) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-11-25' };
  const token = $('token').value.trim().replace(/^Bearer\s+/i, ''); if (token) headers.Authorization = `Bearer ${token}`;
  async function send(method, params, id) {
    const response = await fetch('/mcp', { method: 'POST', headers, signal, body: JSON.stringify({ jsonrpc: '2.0', ...(id === undefined ? {} : { id }), method, params }) });
    if (response.status === 202 && id === undefined) return;
    let body; try { body = await response.json(); } catch { const error = new Error(`O servidor retornou uma resposta inesperada (HTTP ${response.status}). Tente novamente.`); error.status = response.status; throw error; }
    if (!response.ok || body.error) { const error = new Error(response.status === 401 ? 'Token ausente ou inválido. Informe o token configurado no servidor.' : body.erro || body.error?.message || `Não foi possível consultar o servidor (HTTP ${response.status}).`); error.status = response.status; throw error; }
    if (!body.result) throw new Error('O servidor retornou uma resposta MCP incompleta.');
    return body.result;
  }
  const init = await send('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'ats-fiscal-painel', version: '1.0.0' } }, 1);
  if (init.protocolVersion) headers['MCP-Protocol-Version'] = init.protocolVersion;
  await send('notifications/initialized', {}); return send;
}
$('query-form').addEventListener('submit', async event => {
  event.preventDefault(); controller?.abort(); controller = new AbortController(); const current = ++requestNumber, name = active;
  const args = values(); delete args._modo;
  for (const key of Object.keys(args)) { args[key] = args[key].trim(); if (!args[key]) delete args[key]; }
  if (name === 'correlacionar_dados_fiscais' && !['descricao_produto','ncm','cfop','cst_icms','csosn','cst_ipi','cst_pis','cst_cofins'].some(key => args[key])) { renderError(new Error('Informe ao menos um produto, NCM ou código fiscal para conferir.')); return; }
  setBusy(true); loadingState(); $('copy-result').hidden = true;
  let timedOut = false; const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 25000);
  try {
    const send = await rpcClient(controller.signal); const result = await send('tools/call', { name, arguments: args }, 2);
    const text = (result.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n');
    if (result.isError) throw new Error(text || 'Não foi possível consultar essa informação.');
    let data; try { data = JSON.parse(text); } catch { throw new Error('A ferramenta retornou dados em um formato inesperado.'); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('A ferramenta retornou um resultado incompleto.');
    if (current === requestNumber) { connection(true); renderResult(data, name); }
  } catch (error) {
    if (current !== requestNumber) return;
    if (error.name === 'AbortError' && !timedOut) return;
    if (error.status === 401 || error instanceof TypeError) connection(false);
    renderError(timedOut ? new Error('A consulta levou mais de 25 segundos. Tente novamente em instantes.') : error instanceof TypeError ? new Error('Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.') : error);
  } finally { clearTimeout(timer); if (current === requestNumber) setBusy(false); }
});
$('example-button').addEventListener('click', () => { drawFields({ ...values(), ...tools[active].example }); $('tool-fields').querySelector('input, select')?.focus(); });
$('access-button').addEventListener('click', () => $('access-dialog').showModal());
$('about-button').addEventListener('click', () => $('about-dialog').showModal());
for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => $(button.dataset.close).close());
$('access-dialog').addEventListener('close', () => { $('token').type = 'password'; $('toggle-token').textContent = 'Mostrar'; $('toggle-token').setAttribute('aria-pressed', 'false'); $('toggle-token').setAttribute('aria-label', 'Mostrar token'); });
$('token').addEventListener('input', () => { connection(false); $('connection-feedback').textContent = ''; });
$('toggle-token').addEventListener('click', () => { const show = $('token').type === 'password'; $('token').type = show ? 'text' : 'password'; $('toggle-token').textContent = show ? 'Ocultar' : 'Mostrar'; $('toggle-token').setAttribute('aria-pressed', String(show)); $('toggle-token').setAttribute('aria-label', show ? 'Ocultar token' : 'Mostrar token'); });
$('test-connection').addEventListener('click', async () => {
  $('test-connection').disabled = true; $('connection-feedback').textContent = 'Verificando conexão…';
  try { const send = await rpcClient(AbortSignal.timeout(25000)); const list = await send('tools/list', {}, 3); if (!Array.isArray(list.tools)) throw new Error('O servidor não retornou a lista de ferramentas.'); connection(true); $('connection-feedback').textContent = `Conexão verificada. ${list.tools.length} ferramenta(s) disponível(is).`; }
  catch (error) { connection(false); $('connection-feedback').textContent = error.name === 'TimeoutError' ? 'O servidor não respondeu em 25 segundos. Tente novamente.' : error instanceof TypeError ? 'Não foi possível conectar ao servidor.' : error.message; }
  finally { $('test-connection').disabled = false; }
});
$('copy-result').addEventListener('click', async () => { if (!lastResult) return; try { await navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2)); $('copy-result').textContent = 'JSON copiado ✓'; } catch { $('copy-result').textContent = 'Abra o JSON abaixo para copiar'; } });
setTool(active);

let fiscalManual, fiscalManualPending;
async function fetchFiscalManual() {
  if (fiscalManual) return fiscalManual;
  if (fiscalManualPending) return fiscalManualPending;
  fiscalManualPending = (async () => {
    try { const response = await fetch('/INSTRUCOES_AGENTE.md', {signal: AbortSignal.timeout(12000)}); if (!response.ok) throw new Error('Não foi possível carregar o manual.'); fiscalManual = await response.text(); $('manual-content').textContent = fiscalManual; return fiscalManual; }
    catch (error) { $('manual-content').textContent = 'Não foi possível carregar o manual. Feche e abra novamente para tentar.'; throw error; }
    finally { fiscalManualPending = undefined; }
  })();
  return fiscalManualPending;
}
$('manual-button').addEventListener('click', () => { $('manual-dialog').showModal(); fetchFiscalManual().catch(() => {}); });
$('copy-manual').addEventListener('click', async () => { try { const text = await fetchFiscalManual(); await navigator.clipboard.writeText(text); $('manual-feedback').textContent = 'Manual copiado.'; } catch { $('manual-feedback').textContent = 'Não foi possível copiar. Use Baixar .MD ou selecione o texto do manual.'; } });
