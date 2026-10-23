// Adaptado do MCP Fiscal Brasil, MIT, Copyright (c) 2026 Nikolas DeHor.
import data from '../data/tabelas.json' with { type: 'json' };
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
    inputSchema: schema({ cst: code('ICMS: origem+CST, 3 dígitos. CSOSN: 3. IPI/PIS/COFINS: 2.', '^[0-9]{2,3}$'),
      tributo: { type: 'string', enum: ['ICMS', 'CSOSN', 'IPI', 'PIS', 'COFINS'] } }, ['cst', 'tributo']), annotations },
  { name: 'consultar_cest', description: 'Consulta um CEST na amostra local; ausência não comprova código inválido.',
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
    cobertura: data.metadata.cobertura[tabela], vigencia_validada: false };
  if (!registro) result.motivo = 'Não localizado nesta base; não comprova código inválido.';
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
    const size = ['ICMS', 'CSOSN'].includes(tributo) ? 3 : 2;
    if (cst.length !== size) throw new Error(`${tributo} exige ${size} dígitos neste serviço.`);
    const table = tributo === 'ICMS' ? data.CST_ICMS_NORMAL : tributo === 'CSOSN' ? data.CSOSN_TABLE
      : tributo === 'IPI' ? { ...data.CST_IPI_ENTRADA, ...data.CST_IPI_SAIDA } : data.CST_PIS_COFINS;
    const descricao = own(table, cst) ? table[cst] : null;
    return lookupResult('CST', cst, descricao && { descricao }, { tributo });
  }
  const codigo = args.cest.trim().replaceAll('.', '');
  const row = own(data.CEST, codigo) ? data.CEST[codigo] : null;
  // Limite explícito para o contexto do agente, mesmo se a base crescer.
  return lookupResult('CEST', codigo, row && { descricao: row.descricao,
    ncm_relacionados: row.ncm_relacionados.slice(0, 12),
    ...(row.ncm_relacionados.length > 12 ? { ncms_omitidos: row.ncm_relacionados.length - 12 } : {}) });
}

export const tableMetadata = data.metadata;
