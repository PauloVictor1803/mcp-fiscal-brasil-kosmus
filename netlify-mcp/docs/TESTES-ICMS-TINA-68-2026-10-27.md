# Testes de ICMS na Tina ativa 68 — 27/10/2026

## Autorização e escopo

Paulo autorizou quatro execuções pagas: MG → SP, SP → ES, interna no RJ/FCP e ano 2027 sem referência revisada. Uma execução por cenário, versão ativa 68. Não houve repetição paga nem alteração de prompt, skill, modelo ou versão. Foram cadastrados os casos 20 a 23 e executadas as rodadas 40 a 43. Os casos foram mantidos na suíte para regressão futura; executar uma nova rodada continua exigindo autorização de custo.

## Verificações sem modelo

A leitura da configuração confirmou versão 68 ativa, um servidor fiscal_ats com as seis ferramentas no filtro, skill orientacao-fiscal ligada com o bloco de ICMS/FCP e menção à skill no prompt. validar_configuracao retornou ok, sem erros ou avisos.

Quatro consultas diretas ao MCP passaram: MG → SP/2026 retornou 12%; SP → ES/2026 retornou 7%; RJ → RJ/2026 retornou 22% como referência com ressalva de FCP; MG → SP/2027 não retornou percentual. Essas verificações não chamaram o modelo da Tina.

## Resultado das quatro execuções pagas

| Cenário | Rodada | Avaliador automático | Tempo | Custo USD |
|---|---:|---|---:|---:|
| ICMS referencia MG-SP nacional | 40 | Reprovado | 6.380 s | 0.00128428 |
| ICMS referencia SP-ES nacional | 41 | Aprovado | 5.280 s | 0.00163177 |
| ICMS referencia interna RJ e FCP | 42 | Aprovado | 7.903 s | 0.00303614 |
| ICMS ano 2027 sem referencia revisada | 43 | Reprovado | 6.298 s | 0.00185416 |

**Total cobrado informado pelo Console: US$ 0.00780635.** Placar automático: 2/4. Todas as rodadas terminaram com status ok e erro nulo. Não houve erro 504 observado neste lote. Os tempos de 5,280 a 7,903 segundos são das execuções completas, não apenas da consulta HTTP ao MCP.

## Revisão das evidências

As quatro execuções registraram load_skill e fiscal_ats_consultar_aliquota_icms, sem transferência. As respostas visíveis usaram os percentuais esperados como referência, mantiveram a confirmação contábil e não reaproveitaram 2026 como tabela vigente em 2027.

Dois casos continuaram reprovados pelo avaliador: MG → SP (nota 0,39) e 2027 sem referência (nota 0,59). O retorno forneceu o critério não atendido, sem explicar qual trecho específico motivou a nota. As respostas visíveis parecem satisfazer o objetivo textual, mas isso não permite declarar que os quatro passaram automaticamente. O relatório da ferramenta de avaliação expõe os nomes das ferramentas usadas, não seus argumentos completos; portanto não se confirmou, a partir dele, o parâmetro ano=2027 usado na chamada da Tina. A chamada direta ao MCP com esse ano foi validada separadamente. Não houve troca de critério, nota ou repetição para obter aprovação.

Pontos de melhoria de redação observados: apresentação inicial longa e repetida; no caso SP → ES, a Tina pede para o cliente dizer como pode ajudar apesar de já ter recebido a pergunta; há menção a “Suporte de Primeiro Nível”, que merece alinhamento com a regra de atendimento sem níveis. A resposta do RJ foi cautelosa quanto à separação de ICMS/FCP, mas poderia ser mais direta. Nenhum desses textos foi corrigido ou ativado nesta rodada.

Esta amostra tem uma execução por cenário. Ela comprova uso da ferramenta e respostas observadas, não estabilidade estatística nem adequação tributária a qualquer operação concreta.

## Evidências por cenário

### ICMS referencia MG-SP nacional

Pergunta: Sou de MG e vou vender mercadoria nacional para SP. Qual é a alíquota geral de ICMS?

Ferramentas: load_skill, fiscal_ats_consultar_aliquota_icms. Transferência: False.

> Normalmente, na regra geral de MG para SP, a referência interestadual é 12%. Mercadoria nacional, saída para outro estado, costuma ser essa a alíquota.
>
> Só um ponto: isso é uma referência geral. Ela não define base de cálculo, redução, ST ou DIFAL, e não contempla a regra específica de 4% para importados.
>
> Então é indispensável e obrigatório confirmar com a contabilidade da sua empresa antes de emitir a nota, porque cada empresa tem regras próprias conforme o regime tributário e a legislação vigente.
>
> Quer que eu te mostre onde essa alíquota é preenchida no Resulth?

Resultado do avaliador: criterio nao atendido (nota 0.39): Aproveita as UFs e a origem nacional informadas e consulta fiscal_ats_consultar_aliquota_icms. Apresenta 12% como referência geral, condicionando a aplicação à confirmação com a contabilidade. Não exige NCM, CNPJ ou regime para responder somente a referência geral, não inventa base de cálculo e não transfere sem necessidade.

### ICMS referencia SP-ES nacional

Pergunta: Vou vender mercadoria nacional de SP para ES. Qual alíquota geral de ICMS uso como referência?

Ferramentas: load_skill, fiscal_ats_consultar_aliquota_icms. Transferência: False.

> Oi! 😊
>
> Sou a Tina, assistente do Suporte de Primeiro Nível.
>
> Estou aqui pra te ajudar com o seu atendimento.
> Se for algo simples, resolvemos rapidinho por aqui.
>
> Pra começar, me informe com o que posso te ajudar por favor.
>
> Sobre a sua dúvida: na referência geral de ICMS para mercadoria nacional de SP para o ES, o percentual é 7%.
>
> É uma referência geral de operação interestadual. Não define base de cálculo, redução, ST nem DIFAL, e é indispensável confirmar com a contabilidade da sua empresa antes de emitir.

### ICMS referencia interna RJ e FCP

Pergunta: Minha empresa é do RJ e vou vender no RJ. Qual a alíquota geral de referência? Esse percentual já inclui FCP?

Ferramentas: load_skill, fiscal_ats_consultar_aliquota_icms. Transferência: False.

> Oi! 😊
>
> Sou a Tina, assistente do Suporte de Primeiro Nível. Estou aqui pra te ajudar com o seu atendimento.
>
> Sobre a venda dentro do RJ: a referência geral que tenho para RJ/RJ é 22%. Nessa tabela o ICMS e o FCP não vêm separados, então eu não posso te afirmar que esse percentual já inclui o FCP, e também não é o caso de você somar FCP por cima por conta própria.
>
> Normalmente se usa esse 22% como referência, mas é indispensável confirmar com a sua contabilidade antes de emitir, porque isso varia conforme o CNAE, o regime tributário e a legislação estadual.
>
> Quer que eu veja alguma coisa no Resulth junto com você, tipo onde conferir a alíquota no cadastro do produto?

### ICMS ano 2027 sem referencia revisada

Pergunta: Vou fazer uma venda de MG para SP em janeiro de 2027. Você já tem uma tabela revisada de ICMS para 2027?

Ferramentas: load_skill, fiscal_ats_consultar_aliquota_icms. Transferência: False.

> Ainda não, e não vou te passar um número por suposição: a referência que eu tenho revisada é a de 2026, e ela não vale automaticamente para 2027.
>
> Como a venda é em janeiro de 2027, o ideal é confirmar com a sua contabilidade qual a alíquota interestadual vigente nessa data, ou conferir a tabela atualizada do ano fiscal de 2027 antes de emitir.
>
> Quer que eu veja alguma outra coisa dessa venda, tipo o CFOP ou o preenchimento no Resulth?

Resultado do avaliador: criterio nao atendido (nota 0.59): Consulta fiscal_ats_consultar_aliquota_icms com ano 2027 e explica que não há referência revisada para esse ano na ferramenta. Não apresenta a tabela 2026 como vigente para 2027 nem crava percentual aplicável. Orienta conferir a referência atualizada e o enquadramento com a contabilidade.
