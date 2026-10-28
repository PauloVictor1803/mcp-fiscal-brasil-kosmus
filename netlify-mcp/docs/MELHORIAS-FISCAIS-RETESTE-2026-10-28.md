# Correções fiscais e reteste — 28/10/2026

## Alterações preparadas
- MCP: distinção CST/CSOSN informado, código na tabela e formato no Resulth, preservando zeros, inclusive na correlação e no painel.
- CEST: nomes dos 25 segmentos de mercadorias do Anexo I; busca geral de ar-condicionado prioriza aparelhos completos sobre filtros/tubos sem excluir consultas explícitas de peças. Perguntas por uso/objeto substituem a pergunta genérica sobre embalagem.
- Importador: obtém os segmentos na coluna de código do Anexo I em cada reconstrução. Não confunde número do item com código do segmento. A consulta usa o catálogo embarcado como compatibilidade para versões anteriores das tabelas.
- PIS/COFINS: retorno explica que descrição de CST não determina incidência, base ou alíquota.
- Tina: rascunho 74 altera apenas as skills orientacao-fiscal e tratamento-erros-sistema. Restringe sugestões ao solicitado, proíbe dedução de tributos por CFOP/regime, retira regra de troca de dígito em devoluções, reforça contexto CEST, formato Resulth e cautela com XML. Remove a seção ICMS duplicada da skill de erros, preservando-a na fiscal.

Nomes dos segmentos conferidos no [Convênio ICMS 142/18, Anexo I](https://www.confaz.fazenda.gov.br/legislacao/convenios/2018/CV142_18), em 28/10/2026. Isso contextualiza a descrição e não decide enquadramento/ST.

## Verificações locais
24 testes Node passaram, incluindo catálogo/transporte, limites de resposta, ICMS, CEST, formato de códigos e correlação. Dois testes Python do parser de segmentos e quatro da coleta também passaram. Nenhum download de tabela, atualização de vigência, deploy ou execução de modelo é realizado por esses testes locais.

## Rodada paga autorizada
Paulo autorizou seis cenários, uma execução por cenário no novo rascunho, estimativa variável US$ 0,01–0,06. Foram realizadas exatamente seis execuções na versão 74. Os casos foram cadastrados inativos, preservando a suíte global. Custo total reportado: US$ 0.01147539.

| Cenário | Avaliador | Revisão da resposta |
|---|---|---|
| PIS/COFINS | Aprovado | Não deduziu alíquota zero ou CST pelo CFOP/Lucro Presumido; pediu produto/NCM. |
| CFOP de venda | Aprovado | Não acrescentou CST/CSOSN ou alíquota. Ainda consultou CFOP três vezes; os argumentos não são expostos, então não se pode concluir que foram chamadas idênticas. |
| CFOP de devolução | Aprovado | Explicou o código pela finalidade da operação; não ensinou trocar dígito. |
| CEST de ar-condicionado | Aprovado | Perguntou veículo ou ambiente antes de listar códigos. |
| Simples/CST 090 | Aprovado | Reconheceu a particularidade, preservou 090 e não afirmou tratamento do XML. |
| Regime Normal/CSOSN 0900 | Aprovado | Preservou 0900 e explicou a correspondência de formato com 900, sem afirmar tratamento do XML. |

Seis respostas concluídas sem timeout, resposta vazia ou transferência. Leitura final confirmou a configuração ativa idêntica à inicial, versão 72. Rascunho 74 validado sem erro/aviso, não ativado. Prompt, guardrails, modelo, Jev e integrações preservados.

## Ressalvas e pendências
- A concisão não ficou resolvida: PIS/COFINS, venda e devolução ainda trouxeram uma apresentação inicial longa e pediram como ajudar após a pergunta completa. A skill contém orientação contrária, e as regras fixas lidas não exigem essa apresentação. A causa exata (por exemplo, influência dos trechos da base) não foi comprovada.
- Na resposta de CST 090, a expressão genérica “normalmente usa-se esse tipo de código” continua podendo soar como aprovação, apesar da ressalva explícita de que o código aplicável não foi confirmado. Preservar formato deve ser separado da autorização de uso.
- No CEST, “com essa resposta já te passo o código certo” promete mais do que a informação faltante garante; ainda pode ser necessário confirmar NCM/características.
- Uma execução por caso não comprova estabilidade, e os critérios foram refinados para as falhas específicas; não comparar taxas agregadas como se fossem a mesma bateria anterior.
- Os seis testes da Tina usaram o endpoint MCP publicado anterior. O backend novo foi verificado localmente, não ponta a ponta em produção.
- Nenhuma repetição paga adicional foi iniciada. Não houve deploy, ativação ou alteração de segredo. Implantação deve ser coordenada; pendências de concisão permanecem registradas.

## Continuidade
Preparar publicação conjunta do backend/painel e posterior revisão do rascunho. Não consumir novos créditos de deploy ou chamadas pagas sem autorização correspondente.
