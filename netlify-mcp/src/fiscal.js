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
  { name: 'consultar_cest', description: 'Consulta descrição e NCM/SH do CEST no CONFAZ; não determina aplicação de ST.',
    inputSchema: schema({ cest: code('7 dígitos; aceita 01.007.00.', '^\\s*[0-9]{2}\\.?[0-9]{3}\\.?[0-9]{2}\\s*$') }, ['cest']), annotations },
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

export function callTool(name, args) {
  const tool = tools.find(t => t.name === name);
  if (!tool) throw new Error('Ferramenta desconhecida.');
  validateArguments(tool, args);
  if (name === 'validar_chave_nfe') return validateKey(args.chave);
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
