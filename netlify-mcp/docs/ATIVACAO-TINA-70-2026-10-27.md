# Ativação da Tina 70 — 27/10/2026

## Autorização e resultado

Paulo autorizou explicitamente ativar a versão 70, preservando o Jev e os demais componentes da 69, ciente de que os dois cenários específicos passaram e os outros 21 casos ativos não foram retestados. A autorização não incluiu novos testes pagos nem forçar bloqueios do Console.

A ativação foi executada com `ativar_versao(agente="tina", versao_id=70, forcar=false)`. A leitura posterior confirmou versão 70 ativa e igualdade do conteúdo com a candidata que foi testada.

- Versão anterior: 69.
- Versão ativa confirmada: 70.
- Ativada em UTC: 2026-10-27T15:14:41.388960Z.
- Somente `skills` mudou em relação à 69; a alteração interna foi o trecho aprovado de `orientacao-fiscal` sobre CST/CSOSN obrigatórios no Resulth.
- Jev preservado: ativo, limiar 0,3 e timeout de 3 segundos, conforme configuração da 69. O agente não ajustou o limiar nesta ativação.
- Prompt, demais skills, guardrails, modelo, ferramentas, fluxos e dados do cliente preservados.
- Novas avaliações pagas nesta etapa: zero.

## Fundamento e limites da validação

Antes da ativação, a validação estática retornou ok, sem erros. A comparação de evals retornou `piorou=false`, mas sem rodada completa comparável da candidata e da ativa; isso não foi interpretado como prova de ausência de regressão. O Console permitiu a ativação sem força.

Os casos Regime Normal/CSOSN obrigatório e Simples Nacional/CST obrigatório passaram em uma execução cada nas rodadas 48 e 49, após reforço do guia fiscal. O custo daquela rodada, já autorizada e anterior à ativação, foi US$ 0,00346433. A amostra não é uma bateria completa nem garante todas as respostas futuras.

O guia está publicado no commit da base Tina `e812d2ca891f61f0e4759307bb8d20216c7b3049`; as duas páginas que continham a regra absoluta já haviam sido corrigidas no commit `5a1a0b0fa7343be0ee718365a86f73a7c10c03e4`.

## Orientação em vigor

Reconhecer que algumas rotinas do Resulth exigem CST no Simples Nacional ou CSOSN no Regime Normal. Não mandar trocar ou esvaziar um campo obrigatório apenas pelo regime. Distinguir o campo na tela da informação transmitida no XML, preservar formatos e não tratar 090, 0900 ou qualquer código como padrão universal. Consultar a rotina e confirmar a aplicação fiscal com a contabilidade.

## Rastreabilidade

- [Relatório do reforço do guia e dos dois testes aprovados](REFORCO-GUIA-CST-CSOSN-RETESTE-70-2026-10-27.md).
- [Histórico do rascunho e do resultado parcial anterior](AJUSTE-SKILL-CST-CSOSN-RASCUNHO-70-2026-10-27.md).
- Registro de ativação na auditoria local e melhoria de comportamento marcada como concluída, mantendo a ressalva de amostra limitada.
- A sincronização das sete abas do Google Sheets e do Excel local Relatorio_ATS_v3.xlsx foi concluída com sucesso após a ativação.

Nenhum token, dado de cliente ou conversa privada consta deste documento. Esta etapa não criou nova publicação do MCP na Netlify nem alterou a matriz manual de ICMS.
