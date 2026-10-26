// Transporte inspirado no MCP Fiscal Brasil (MIT). Dados reconstruídos em fontes oficiais.
import bundledData from '../data/tabelas.json' with { type: 'json' };
let data = bundledData;
let nextCheck = 0;
let etag;
let updating;
const remoteURL = 'https://raw.githubusercontent.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/main/netlify-mcp/data/tabelas.json';

export async function refreshTables() {
  if (process.env.TABLES_AUTO_UPDATE !== 'true' || Date.now() < nextCheck) return;
  if (updating) return updating;
  updating = (async () => {
    try {
      const response = await fetch(remoteURL, { headers: etag ? { 'If-None-Match': etag } : {}, signal: AbortSignal.timeout(5000) });
      if (response.status === 304) { nextCheck = Date.now() + 3600000; return; }
      if (!response.ok || Number(response.headers.get('content-length')) > 2000000) throw new Error('Referência remota indisponível.');
      const raw = await response.text();
      if (Buffer.byteLength(raw) > 2000000) throw new Error('Referência remota excede limite.');
      const candidate = JSON.parse(raw);
      if (candidate.metadata?.validacao !== 'aprovada' || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.metadata?.data_referencia || '')
        || !candidate.CFOP_TABLE?.['1403']?.[0]?.includes('substituição tributária')
        || !candidate.CEST?.['0100700']?.descricao?.includes('gaxetas')
        || !candidate.CST_ICMS?.['02'] || !candidate.CSOSN_TABLE?.['101']
        || Object.keys(candidate.CFOP_TABLE).length < 600 || Object.keys(candidate.CEST).length < 1000
        || !candidate.CST_IPI?.['50'] || !candidate.CST_PIS?.['50'] || !candidate.CST_COFINS?.['50']
        || !candidate.ORIGENS?.['0'] || candidate.metadata.data_referencia < data.metadata.data_referencia) throw new Error('Referência remota não passou na validação.');
      data = candidate;
      etag = response.headers.get('etag');
      nextCheck = Date.now() + 3600000;
    } catch {
      nextCheck = Date.now() + 300000;
      console.warn('Atualização fiscal indisponível; preservada a última referência validada.');
    } finally { updating = undefined; }
  })();
  return updating;
}
const own = (obj, key) => Object.hasOwn(obj, key);
const schema = (properties, required) => ({ type: 'object', properties, required, additionalProperties: false });
const code = (description, pattern) => ({ type: 'string', description, pattern, maxLength: 80 });
const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

const declaredTools = [
  { name: 'consultar_cfop', description: 'Consulta a descrição de um CFOP informado; não escolhe o enquadramento.',
    inputSchema: schema({ cfop: code('Código de 4 dígitos; aceita 5.102.', '^\\s*[123567]\\.?[0-9]{3}\\s*$') }, ['cfop']), annotations },
  { name: 'validar_chave_nfe', description: 'Confere formato e dígito da chave NF-e/NFC-e; não consulta autorização.',
    inputSchema: schema({ chave: code('44 dígitos; aceita espaços entre grupos.', '^[0-9\\s]{44,80}$') }, ['chave']), annotations },
  { name: 'validar_cst', description: 'Consulta CST/CSOSN na tabela do tributo informado; não valida sua aplicação à operação.',
    inputSchema: schema({ cst: code('ICMS: CST com 2 ou origem+CST com 3 dígitos. CSOSN: 3. Demais: 2.', '^[0-9]{2,3}$'),
      tributo: { type: 'string', enum: ['ICMS', 'CSOSN', 'IPI', 'PIS', 'COFINS'] } }, ['cst', 'tributo']), annotations },
  { name: 'consultar_cest', description: 'Busca CEST por descrição (aceita aproximação), NCM ou código CEST. Retorna candidatos e condições a confirmar; não determina ST.',
    inputSchema: schema({ cest: code('CEST conhecido; use sozinho.', '^\\s*[0-9]{2}\\.?[0-9]{3}\\.?[0-9]{2}\\s*$'),
      descricao: { type: 'string', description: 'Produto, por exemplo xampu. Pode combinar com NCM.', maxLength: 120 },
      ncm: code('NCM de 8 dígitos confirmado na consulta Siscomex.', '^\\s*(?:[0-9]{8}|[0-9]{4}\\.[0-9]{2}\\.[0-9]{2})\\s*$'),
      modalidade_venda: { type: 'string', enum: ['porta_a_porta', 'outras'], description: 'Preencher somente após confirmar o sistema de venda.' } }, []), annotations },
  { name: 'correlacionar_dados_fiscais', description: 'Reúne candidatos de CEST por produto/NCM e confere códigos CFOP, CST/CSOSN, IPI, PIS e COFINS já levantados na base ATS. Mostra fontes e pendências; não escolhe tributação, ST, alíquota ou base de cálculo.',
    inputSchema: schema({
      descricao_produto: { type: 'string', description: 'Descrição do produto informada pelo cliente; não equivale à classificação NCM.', maxLength: 120 },
      ncm: code('NCM de 8 dígitos obtido ou confirmado separadamente no Siscomex; este MCP não consulta o Siscomex.', '^\\s*(?:[0-9]{8}|[0-9]{4}\\.[0-9]{2}\\.[0-9]{2})\\s*$'),
      modalidade_venda: { type: 'string', enum: ['porta_a_porta', 'outras'], description: 'Somente se a modalidade foi confirmada.' },
      cfop: code('CFOP candidato obtido da base ATS ou do documento da operação.', '^\\s*[123567]\\.?[0-9]{3}\\s*$'),
      cst_icms: code('CST ICMS candidato, com 2 ou 3 dígitos.', '^[0-9]{2,3}$'),
      csosn: code('CSOSN candidato de 3 dígitos.', '^[0-9]{3}$'),
      cst_ipi: code('CST IPI candidato de 2 dígitos.', '^[0-9]{2}$'),
      cst_pis: code('CST PIS candidato de 2 dígitos.', '^[0-9]{2}$'),
      cst_cofins: code('CST COFINS candidato de 2 dígitos.', '^[0-9]{2}$'),
      regime: { type: 'string', enum: ['simples_nacional', 'regime_normal', 'nao_confirmado'], description: 'Regime confirmado em consulta externa ou informado; não é inferido de IE/CNPJ.' },
    }, []), annotations },
];

// Falha fechada: revisão técnica do transporte não aprova conteúdo fiscal.
// Não anuncia tabelas reprovadas ao agente, para evitar chamadas inúteis.
export const tools = declaredTools.filter(tool => tool.name === 'validar_chave_nfe'
  || data.metadata.validacao === 'aprovada');

export function validateArguments(tool, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Informe os parâmetros da ferramenta.');
  const { properties, required } = tool.inputSchema;
  for (const key of Object.keys(args)) if (!own(properties, key)) throw new Error(`Parâmetro desconhecido: ${key}.`);
  for (const key of required) if (!own(args, key)) throw new Error(`Parâmetro obrigatório: ${key}.`);
  for (const [key, value] of Object.entries(args)) {
    const rule = properties[key];
    if (typeof value !== 'string' || value.length > (rule.maxLength ?? 20)
      || (rule.pattern && !new RegExp(rule.pattern).test(value))
      || (rule.enum && !rule.enum.includes(value))) throw new Error(`Formato inválido para ${key}.`);
  }
}

function lookupResult(tabela, codigo, registro, extra = {}) {
  const result = { codigo, encontrado: Boolean(registro), ...registro, ...extra,
    referencia: data.metadata.data_referencia };
  if ((Date.now() - Date.parse(data.metadata.data_referencia)) / 86400000 > 2) result.atualizacao_atrasada = true;
  if (!registro) result.motivo = 'Não localizado na referência consultada; não comprova código inválido.';
  return result;
}

function validateKey(raw) {
  const chave = raw.replace(/\s/g, '');
  if (!/^[0-9]{44}$/.test(chave)) return { formato_valido: false, digito_valido: false, motivo: 'Informe 44 dígitos.' };
  if (/^(.)\1+$/.test(chave)) return { formato_valido: false, digito_valido: false, motivo: 'Sequência repetida inválida.' };
  let soma = 0;
  for (let i = 42, peso = 2; i >= 0; i--, peso = peso === 9 ? 2 : peso + 1) soma += Number(chave[i]) * peso;
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  const result = { formato_valido: true, digito_valido: Number(chave[43]) === dv, autorizacao_consultada: false };
  if (!result.digito_valido) result.motivo = 'Dígito verificador divergente.';
  return result;
}

const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function terms(text) {
  return normalize(text).match(/[a-z0-9]+/g)?.filter(t => !['de','da','do','das','dos','para','por','e','o','a','os','as','produto','produtos','mercadoria','mercadorias','item','itens'].includes(t))
    .flatMap(t => {
      if (/^(shampoos?|xampus?|champus?)$/.test(t)) return 'xampu';
      const singular = t.endsWith('ores') ? t.slice(0, -2) : t.endsWith('oes') ? t.slice(0, -3) + 'ao'
        : t.endsWith('ais') ? t.slice(0, -3) + 'al' : t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t;
      return singular === 'sabonete' ? ['sabao', 'toucador'] : singular;
    }) || [];
}
// Distância de edição com transposição adjacente; aplicada só a palavras, nunca a códigos.
function editDistance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let before = null, previous = Array.from({length:b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (before && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) current[j] = Math.min(current[j], before[j - 2] + 1);
    }
    before = previous; previous = current;
  }
  return previous[b.length];
}
function matchTerms(query, words) {
  let penalty = 0;
  for (const term of query) {
    if (words.includes(term)) continue;
    if (term.length < 5 || term.length > 32 || /\d/.test(term)) return null;
    const limit = term.length >= 7 ? 2 : 1;
    let best = limit + 1;
    for (const word of words) {
      if (word.length < 5 || /\d/.test(word)) continue;
      best = Math.min(best, editDistance(term, word, limit));
    }
    if (best > limit) return null;
    penalty += best;
  }
  return penalty;
}
const segmentCondition = codigo => codigo.startsWith('28') ? 'Venda pelo sistema porta a porta (Anexo XXVI)' : 'Conferir segmento e descrição do anexo';
function searchCest(args) {
  if (args.cest) {
    if (Object.keys(args).length !== 1) throw new Error('Consulte pelo CEST sozinho ou busque por descrição/NCM.');
    return null;
  }
  const query = terms(args.descricao || '');
  if ((!args.ncm && !query.length) || (args.descricao !== undefined && !query.length)) throw new Error('Informe a descrição do produto ou o NCM.');
  const ncm = args.ncm?.trim().replaceAll('.', '');
  const today = new Date().toISOString().slice(0, 10);
  let matches = [];
  for (const [codigo, row] of Object.entries(data.CEST)) {
    if (row.status !== 'ativo' || row.ncm_sh_requer_conferencia || (row.fim && today > row.fim) || (row.inicio && today < row.inicio)) continue;
    if (args.modalidade_venda && (codigo.startsWith('28') !== (args.modalidade_venda === 'porta_a_porta'))) continue;
    const words = terms(row.descricao || '');
    const penalty = matchTerms(query, words);
    if (penalty === null) continue;
    // Posições parciais são prefixos candidatos, não uma classificação definitiva.
    const codes = (row.ncm_sh || []).map(c => c.replaceAll('.', '')).filter(c => /^\d{2,8}$/.test(c));
    if (ncm && !codes.some(c => ncm.startsWith(c))) continue;
    matches.push({ cest: codigo.replace(/^(\d{2})(\d{3})(\d{2})$/, '$1.$2.$3'), descricao: row.descricao,
      ncm_sh: row.ncm_sh_texto_fonte, segmento: codigo.slice(0, 2),
      correspondencia: penalty ? 'aproximada' : 'termos', _penalty: penalty,
      ...(codigo.startsWith('20') ? { segmento_nome: 'Produtos de perfumaria e de higiene pessoal e cosméticos' } : {}),
      ...(codigo.startsWith('28') ? { condicao: segmentCondition(codigo) } : {}) });
  }
  const bestPenalty = Math.min(...matches.map(m => m._penalty));
  matches = matches.filter(m => m._penalty === bestPenalty);
  matches.sort((a, b) => a._penalty - b._penalty || a.cest.localeCompare(b.cest));
  const candidatos = [];
  for (const match of matches.slice(0, 6)) {
    const { _penalty, ...candidate } = match;
    if (Buffer.byteLength(JSON.stringify([...candidatos, candidate])) > 2400) break;
    candidatos.push(candidate);
  }
  const perguntas = [];
  if (candidatos.length && !ncm) perguntas.push('Qual é o NCM confirmado do produto?');
  if (matches.some(m => m.cest.startsWith('28.')) && matches.some(m => !m.cest.startsWith('28.'))) perguntas.push('A operação é venda pelo sistema porta a porta?');
  if (matches.length > 1) perguntas.push('Qual a apresentação/embalagem e quais as características do produto?');
  if (candidatos.length) perguntas.push('A descrição oficial corresponde às características e ao uso do produto?');
  const result = { encontrado: matches.length > 0, candidatos, total: matches.length, mais_resultados: candidatos.length < matches.length,
    ...(perguntas.length ? { confirmar: perguntas } : {}),
    orientacao: matches.length ? 'Candidatos da tabela oficial; confirmar descrição, segmento e NCM antes de indicar. CEST não determina aplicação de ST.'
      : 'Nenhum candidato nesta referência. Refine a descrição ou confira o NCM no Siscomex; isso não comprova ausência de CEST.',
    referencia: data.metadata.data_referencia, fonte: 'https://www.confaz.fazenda.gov.br/legislacao/convenios/2018/CV142_18' };
  if ((Date.now() - Date.parse(data.metadata.data_referencia)) / 86400000 > 2) result.atualizacao_atrasada = true;
  return result;
}

function correlate(args) {
  const lookups = ['descricao_produto', 'ncm', 'cfop', 'cst_icms', 'csosn', 'cst_ipi', 'cst_pis', 'cst_cofins'];
  if (!lookups.some(key => args[key])) throw new Error('Informe um produto, NCM ou código fiscal para conferir.');
  if (args.modalidade_venda && !args.descricao_produto && !args.ncm) throw new Error('Modalidade de venda exige produto ou NCM.');
  const result = { referencia: data.metadata.data_referencia, consultas: {}, confirmar: [],
    limites: 'Descrições e correlações são referências. Conferir a operação na base ATS e o enquadramento com a contabilidade; o MCP não determina ST, alíquota nem base de cálculo.' };
  if (args.descricao_produto || args.ncm) {
    const cest = searchCest({ ...(args.descricao_produto ? { descricao: args.descricao_produto } : {}),
      ...(args.ncm ? { ncm: args.ncm } : {}), ...(args.modalidade_venda ? { modalidade_venda: args.modalidade_venda } : {}) });
    result.confirmar.push(...(cest.confirmar || []));
    const { confirmar, referencia, fonte, atualizacao_atrasada, ...compact } = cest;
    result.consultas.cest = compact;
    if (args.ncm) result.ncm = { codigo: args.ncm.replaceAll('.', '').trim(), situacao: 'informado; classificação não verificada por este MCP' };
  }
  const entries = [
    ['cfop', 'consultar_cfop', { cfop: args.cfop }],
    ['cst_icms', 'validar_cst', { cst: args.cst_icms, tributo: 'ICMS' }],
    ['csosn', 'validar_cst', { cst: args.csosn, tributo: 'CSOSN' }],
    ['cst_ipi', 'validar_cst', { cst: args.cst_ipi, tributo: 'IPI' }],
    ['cst_pis', 'validar_cst', { cst: args.cst_pis, tributo: 'PIS' }],
    ['cst_cofins', 'validar_cst', { cst: args.cst_cofins, tributo: 'COFINS' }],
  ];
  for (const [key, tool, parameters] of entries) {
    if (parameters.cfop || parameters.cst) {
      const lookup = callTool(tool, parameters);
      if (!lookup.encontrado || (lookup.status && lookup.status !== 'ativo'))
        result.confirmar.push(`O código ${key} não está ativo nesta referência; confira a situação oficial antes de orientar.`);
      const { referencia, atualizacao_atrasada, ...compact } = lookup;
      result.consultas[key] = compact;
    }
  }
  if ((args.cfop || args.cst_icms || args.csosn || args.cst_ipi || args.cst_pis || args.cst_cofins) && !args.regime)
    result.confirmar.push('Qual é o regime tributário confirmado para o emitente desta operação?');
  if (args.cfop) result.confirmar.push('A descrição do CFOP corresponde à operação, ao sentido da nota e à UF envolvidos?');
  if (args.cst_icms && args.csosn) result.confirmar.push('CST e CSOSN foram informados em campos distintos do Resulth? Confira qual código compõe a NF-e conforme o regime e a operação.');
  result.fontes = {
    ...(result.consultas.cest ? { cest: 'https://www.confaz.fazenda.gov.br/legislacao/convenios/2018/CV142_18' } : {}),
    ...(result.consultas.cfop ? { cfop: 'https://www.confaz.fazenda.gov.br/legislacao/ajustes/sinief/cvsn_70' } : {}),
    ...(entries.slice(1).some(([key]) => result.consultas[key]) ? { cst_csosn: 'https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=ndIjl+iEFdE=' } : {}),
  };
  if ((Date.now() - Date.parse(data.metadata.data_referencia)) / 86400000 > 2) result.atualizacao_atrasada = true;
  return result;
}

export function callTool(name, args) {
  const tool = tools.find(t => t.name === name);
  if (!tool) throw new Error('Ferramenta desconhecida.');
  validateArguments(tool, args);
  if (name === 'validar_chave_nfe') return validateKey(args.chave);
  if (name === 'correlacionar_dados_fiscais') return correlate(args);
  if (name === 'consultar_cest') {
    const result = searchCest(args);
    if (result) return result;
  }
  if (name === 'consultar_cfop') {
    const codigo = args.cfop.trim().replace('.', '');
    const row = own(data.CFOP_TABLE, codigo) ? data.CFOP_TABLE[codigo] : null;
    return lookupResult('CFOP', codigo, row && { descricao: row[0], tipo: row[1], ambito: row[2] });
  }
  if (name === 'validar_cst') {
    const { cst, tributo } = args;
    if ((tributo === 'CSOSN' && cst.length !== 3) || (!['ICMS','CSOSN'].includes(tributo) && cst.length !== 2)) throw new Error('Quantidade de dígitos incompatível com o tributo.');
    const table = tributo === 'ICMS' ? data.CST_ICMS : tributo === 'CSOSN' ? data.CSOSN_TABLE
      : tributo === 'IPI' ? data.CST_IPI : tributo === 'PIS' ? data.CST_PIS : data.CST_COFINS;
    const codigo = tributo === 'ICMS' ? cst.slice(-2) : cst;
    const row = own(table, codigo) ? table[codigo] : null;
    const record = typeof row === 'string' ? { descricao: row, status: 'ativo' } : row;
    const extra = { tributo };
    if (tributo === 'ICMS' && cst.length === 3) {
      if (!own(data.ORIGENS, cst[0])) throw new Error('Origem da mercadoria não localizada.');
      extra.origem = data.ORIGENS[cst[0]];
    }
    return lookupResult('CST', cst, record, extra);
  }
  const codigo = args.cest.trim().replaceAll('.', '');
  const row = own(data.CEST, codigo) ? data.CEST[codigo] : null;
  const today = new Date().toISOString().slice(0, 10);
  if (row?.fim && today > row.fim) return lookupResult('CEST', codigo, { status: 'referencia_expirada', motivo: 'Aguardar atualização da redação oficial.' });
  if (row?.status === 'vigencia_futura' && today >= row.inicio) return lookupResult('CEST', codigo, { status: 'aguardando_atualizacao', inicio: row.inicio });
  return lookupResult('CEST', codigo, row && { status: row.status,
    ...(row.descricao ? { descricao: row.descricao, ncm_sh: row.ncm_sh_texto_fonte } : {}),
    ...(row.inicio && row.status === 'vigencia_futura' ? { inicio: row.inicio } : {}),
    ...(row.ncm_sh_requer_conferencia ? { aviso: 'NCM/SH do texto oficial requer conferência no Siscomex.' } : {}) });
}

export const tableMetadata = data.metadata;

