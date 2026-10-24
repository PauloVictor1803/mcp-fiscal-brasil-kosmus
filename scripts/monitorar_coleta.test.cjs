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
