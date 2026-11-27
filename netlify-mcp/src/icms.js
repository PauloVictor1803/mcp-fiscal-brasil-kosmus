import reference from '../data/icms-referencia-manual.json' with { type: 'json' };

export const icmsUFs = Object.keys(reference.matriz);
export function consultarAliquotaICMS(args, now = new Date()) {
  const ano = args.ano ? Number(args.ano) : Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(now));
  const { uf_origem, uf_destino } = args;
  const metadata = reference.metadata;
  const result = { uf_origem, uf_destino, ano_consultado: ano, ano_referencia: metadata.ano_referencia,
    fonte: 'TaxGroup, matriz transcrita e mantida manualmente pela ATS', url_fonte: metadata.url_fonte,
    registrado_em: metadata.registrado_em, atualizacao: 'manual' };
  if (ano !== metadata.ano_referencia) return { ...result, encontrado: false,
    motivo: 'Não há referência revisada para o ano solicitado. Não reutilize automaticamente a tabela de outro ano.' };
  const value = reference.matriz[uf_origem]?.[uf_destino];
  if (!Number.isFinite(value)) throw new Error('Combinação de UFs não encontrada.');
  const interna = uf_origem === uf_destino;
  const avisos = [interna ? 'Referência interna da imagem; ICMS e eventual FCP não estão separados. Não preencha pICMS ou FCP automaticamente.'
    : 'Referência interestadual geral; a regra específica de 4% para importados não está contemplada.'];
  if (args.origem_mercadoria === 'importada') avisos.push('Mercadoria importada: esta consulta não determina a alíquota aplicável. Confirme a regra e suas exceções.');
  avisos.push('Não define base de cálculo, redução, ST, DIFAL ou enquadramento. Confirme a aplicação com a contabilidade antes de emitir.');
  return { ...result, encontrado: true, tipo: interna ? 'interna' : 'interestadual', percentual_referencia: value,
    aplicacao_a_operacao_validada: false, avisos };
}
