const test=require('node:test');
const assert=require('node:assert/strict');
const {avaliar}=require('./monitorar_coleta.cjs');
const now=Date.parse('2026-10-24T14:00:00Z');
const run=(conclusion,updated_at='2026-10-24T13:00:00Z')=>({status:'completed',conclusion,updated_at});
test('sucesso recente sem mudança no JSON não gera alerta',()=>assert.deepEqual(avaliar([run('success')],'2026-10-24',now).reasons,[]));
test('duas falhas transitórias aguardam limiar, três alertam',()=>{
 assert.equal(avaliar([run('failure'),run('failure'),run('success')],'2026-10-24',now).reasons.length,0);
 assert.match(avaliar([run('failure'),run('timed_out'),run('cancelled'),run('success')],'2026-10-24',now).reasons.join(' '),/3 execuções/);
});
test('agendamento parado alerta mesmo sem três falhas',()=>assert.match(avaliar([run('success','2026-10-20T10:00:00Z')],'2026-10-24',now).reasons.join(' '),/72 horas/));
test('referência antiga, inválida ou futura alerta',()=>{
 for(const date of ['2026-10-20','ausente','2026-11-20'])assert.ok(avaliar([run('success')],date,now).reasons.length);
});
test('rodada em execução não é contada como falha',()=>assert.equal(avaliar([{status:'in_progress'},run('success')],'2026-10-24',now).reasons.length,0));

function harness(runs, issues=[]) {
 const calls=[];
 const github={rest:{actions:{listWorkflowRuns:async()=>({data:{workflow_runs:runs}})},repos:{getContent:async()=>({data:{content:Buffer.from(JSON.stringify({metadata:{data_referencia:new Date().toISOString().slice(0,10)}})).toString('base64')}})},issues:{listForRepo:()=>{},create:async a=>calls.push(['create',a]),update:async a=>calls.push(['update',a])}},paginate:async()=>issues};
 const summary={addHeading(){return this},addRaw(){return this},async write(){}};
 return {calls,args:{github,context:{repo:{owner:'teste',repo:'fiscal'}},core:{warning:()=>{},summary}}};
}
test('falha cria issue única sem enviar mensagem externa',async()=>{
 const t=harness([run('failure'),run('failure'),run('failure')]);
 await require('./monitorar_coleta.cjs')(t.args);
 assert.equal(t.calls.length,1);assert.equal(t.calls[0][0],'create');assert.match(t.calls[0][1].body,/ats-monitor-confaz-v1/);
});
test('falha persistente reaproveita issue e não repete atualização idêntica',async()=>{
 const runs=[run('failure'),run('failure'),run('failure')];const t=harness(runs);
 await require('./monitorar_coleta.cjs')(t.args);
 const issue={...t.calls[0][1],number:15};
 const repeated=harness(runs,[issue]);await require('./monitorar_coleta.cjs')(repeated.args);assert.equal(repeated.calls.length,0);
});
test('recuperação fecha apenas issue reconhecida do monitor',async()=>{
 const issue={title:'[Automação CONFAZ] Atualização precisa de atenção',body:'<!-- ats-monitor-confaz-v1 -->',number:15};
 const t=harness([run('success',new Date().toISOString())],[issue]);await require('./monitorar_coleta.cjs')(t.args);
 assert.equal(t.calls.length,1);assert.equal(t.calls[0][1].state,'closed');assert.equal(t.calls[0][1].issue_number,15);
 const other=harness([run('success',new Date().toISOString())],[{...issue,body:'Outra issue sem marcador'}]);await require('./monitorar_coleta.cjs')(other.args);assert.equal(other.calls.length,0);
});

