const TITLE = '[Automação CONFAZ] Atualização precisa de atenção';
const MARKER = '<!-- ats-monitor-confaz-v1 -->';
const DAY = 86400000;

function avaliar(runs, reference, now = Date.now()) {
  const completed = runs.filter(r => r.status === 'completed' && ['success','failure','timed_out','cancelled','action_required','startup_failure'].includes(r.conclusion));
  const success = completed.find(r => r.conclusion === 'success');
  let consecutive = 0;
  for (const r of completed) { if (r.conclusion === 'success') break; consecutive++; }
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(reference || '') ? Date.parse(reference + 'T00:00:00Z') : NaN;
  const reasons = [];
  if (consecutive >= 3) reasons.push(`${consecutive} execuções consecutivas sem sucesso.`);
  if (!success || !Number.isFinite(Date.parse(success.updated_at)) || now - Date.parse(success.updated_at) > 3 * DAY) reasons.push('Nenhuma execução bem-sucedida nas últimas 72 horas.');
  if (!Number.isFinite(parsed) || now - parsed > 3 * DAY || parsed > now + DAY) reasons.push(`Referência documental ausente, inválida ou fora do limite de 3 dias: ${reference || 'ausente'}.`);
  return { reasons, consecutive, success };
}

module.exports = async ({github, context, core}) => {
  const repo = context.repo;
  const {data} = await github.rest.actions.listWorkflowRuns({...repo, workflow_id:'atualizar-tabelas.yml', branch:'main', per_page:100});
  // Sempre lê main; o evento workflow_run pode referir-se a execução antiga.
  const file = await github.rest.repos.getContent({...repo,path:'netlify-mcp/data/tabelas.json',ref:'main'});
  const table = JSON.parse(Buffer.from(file.data.content,'base64').toString('utf8'));
  const result = avaliar(data.workflow_runs, table.metadata?.data_referencia);
  const issues = await github.paginate(github.rest.issues.listForRepo, {...repo,state:'open',creator:'github-actions[bot]',per_page:100});
  const issue = issues.find(i => !i.pull_request && i.title === TITLE && i.body?.includes(MARKER));
  const body = `${MARKER}\n\n${result.reasons.join('\n\n')}\n\nÚltima referência: ${table.metadata?.data_referencia || 'ausente'}.\n\nÚltimo sucesso: ${result.success?.html_url || 'não encontrado nas últimas 100 execuções'}.\n\n[Ver atualizações](https://github.com/${repo.owner}/${repo.repo}/actions/workflows/atualizar-tabelas.yml).\n\nA última tabela válida é preservada em caso de falha. Verifique os logs por fonte, HTTP de origem, cache e retentativas antes de executar novamente. Não publique JSON parcial.`;
  if (result.reasons.length) {
    if (!issue) await github.rest.issues.create({...repo,title:TITLE,body});
    else if (issue.body !== body) await github.rest.issues.update({...repo,issue_number:issue.number,body});
    core.warning(result.reasons.join(' '));
  } else if (issue) {
    await github.rest.issues.update({...repo,issue_number:issue.number,state:'closed',state_reason:'completed',body:issue.body+'\n\nRecuperação confirmada pelo monitor: execução recente bem-sucedida e referência dentro do limite.'});
  }
  await core.summary.addHeading('Monitor CONFAZ').addRaw(result.reasons.length ? result.reasons.join('\n') : 'Sem alerta: execução recente bem-sucedida e referência dentro do limite.').write();
};
module.exports.avaliar = avaliar;
