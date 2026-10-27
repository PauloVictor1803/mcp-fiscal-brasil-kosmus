# Reforço do guia fiscal e reteste do rascunho 70 — 27/10/2026

## O que mudou

Paulo autorizou melhorar o comportamento após o rascunho 70 passar Regime Normal e devolver fallback no Simples. A investigação confirmou que as regras fixas exigem que orientações do sistema venham do conteúdo retornado pelas ferramentas da base. A skill, sozinha, não substitui esse fundamento. Isso é uma constatação sobre as instruções, não prova de que o Jev foi a causa do fallback anterior.

Foi reforçado o guia de recomendações fiscais já existente, no caminho `procedimentos/guia-de-recomendacoes-e-emissao-de-nf-e-vendas-devolucoes-e-cfops-mais-utilizado.md`. Incluída seção específica antes das tabelas de CFOP, com orientações separadas para CST obrigatório no Simples e CSOSN obrigatório no Regime Normal, formato 090, não esvaziar ou substituir campo só pelo regime e distinguir campos de tela de XML. A orientação dispensa novo pedido genérico de tela apenas para explicar a particularidade, mas permite pedir o dado necessário ao próximo passo.

As tabelas fiscais existentes foram preservadas. Foi adicionada uma observação de que suas colunas por regime não proíbem campos exigidos pelo Resulth no outro regime. Não se validou um código universal nem a aplicação fiscal de 090/0900.

Commit da base Tina: `e812d2ca891f61f0e4759307bb8d20216c7b3049`. Indexador: processed=1, indexed=1, error=0. Leitura posterior confirmou o conteúdo ativo sem pendência; a busca textual localizou a seção nova. Não foi feita mudança de prompt, guardrail, skill ou Jev nesta etapa. O rascunho continuou sendo o 70 e a ativa continuou sendo a 69.

## Texto acrescentado ao guia

## Particularidade do Resulth: CST obrigatório no Simples e CSOSN obrigatório no Regime Normal

Na Digitação/Emissão de NF-e do Resulth, o regime tributário da empresa não é motivo suficiente para mandar trocar o conteúdo de um campo pelo de outro. Algumas rotinas exigem CST mesmo no Simples Nacional ou CSOSN mesmo no Regime Normal. É uma particularidade dos campos do sistema, distinta da informação transmitida na NF-e.

### Empresa do Simples Nacional e campo CST obrigatório

Se a rotina exige CST, não oriente deixar o campo vazio nem substituí-lo por CSOSN apenas por a empresa ser do Simples. Explique primeiro: “Essa exigência pode acontecer por uma particularidade do Resulth. Preencher o campo CST não está errado só por sua empresa ser do Simples Nacional.”

Se o cliente informou CST `090`, preserve esse formato; `090` não é `09`. Isso não confirma que `090` seja o código aplicável à operação. Confira a finalidade do campo na rotina e a orientação contábil antes da emissão. Não é necessário pedir novamente a tela apenas para explicar a particularidade; pergunte somente se faltar uma informação necessária ao próximo passo.

### Empresa do Regime Normal e campo CSOSN obrigatório

Se a rotina exige CSOSN, não oriente preencher esse campo com um CST nem deixá-lo vazio apenas porque a empresa é do Regime Normal. Explique: “Essa exigência pode acontecer por uma particularidade do Resulth; não troque o campo CSOSN por CST só por causa do regime.” Um código informado, como `0900`, não é um padrão universal: seu uso na operação precisa ser confirmado com a contabilidade.

### Campo da tela, XML e rejeição efetiva

A existência de um campo obrigatório não comprova que seu valor será enviado ou ignorado no XML. Não conclua incompatibilidade ou rejeição da SEFAZ somente pela combinação entre campo e regime. Se houver uma mensagem real de rejeição ou um XML a conferir, analise esse documento e a documentação específica; a particularidade da tela não dispensa a validação fiscal do documento emitido.

Essas situações, por si sós, não exigem recusar ajuda ou transferir o atendimento. A explicação da particularidade não valida códigos, imposto, base ou alíquota; confirme o enquadramento com a contabilidade antes da emissão ou alteração fiscal.

## 2. CFOPs Mais Utilizados e Associações Tributárias (CST / CSOSN)

As colunas por regime abaixo são referências fiscais, não uma proibição de preencher campos exigidos pelo Resulth no outro regime. Para exigências de CST no Simples ou CSOSN no Regime Normal, siga a particularidade explicada na seção anterior.

## Autorização e resultado dos testes

Paulo autorizou especificamente duas novas execuções no rascunho 70, uma por cenário, com a base reforçada. Estimativa apresentada: US$ 0,005–0,03, variável e sem limite técnico. Não houve repetição automática. Foram reutilizados os casos 24 e 25, sem mudar os critérios.

| Cenário | Rodada | Resultado automático | Tempo | Custo USD |
|---|---:|---|---:|---:|
| Regime Normal / CSOSN obrigatório 0900 | 48 | Aprovado | 8.146 s | 0.00208272 |
| Simples Nacional / CST obrigatório 090 | 49 | Aprovado | 10.972 s | 0.00138161 |

**Placar: 2/2. Custo total informado: US$ 0.00346433.** Status ok, erro nulo e sem transferência nos dois casos. Nenhum erro 504 foi observado.

A revisão humana das respostas confirmou que ambas reconheceram a particularidade, não mandaram esvaziar ou trocar o campo apenas pelo regime e mantiveram a confirmação contábil dos códigos. Ambas acionaram load_skill e consultar_base_conhecimento. O caso Simples preservou 090 e o distinguiu de 09.

Limites: foi uma execução por cenário, não uma bateria de estabilidade nem validação tributária geral. Na resposta do Simples ainda houve explicação adicional sobre rejeição XML e exemplos de CSOSN sem que uma rejeição tivesse sido informada; isso pode ser simplificado futuramente, mas a resposta não presumiu que o campo seria transmitido e distinguiu a dúvida de preenchimento de uma rejeição real. Os argumentos e documentos completos retornados pela busca não são expostos em ver_rodada_eval. Não se atribui causalidade isolada ou garantia de ausência de regressões a este resultado.

O limiar do Jev permaneceu em 0,3, herdado da versão ativa 69. Os testes anteriores na 68 usavam limiar 0,5; não comparar essas versões como se diferissem somente pela skill. A rodada anterior do próprio rascunho 70 ficou em 1/2; após esta edição de base, a amostra ficou em 2/2, com a variabilidade normal de respostas de modelo.

## Respostas observadas

### Regime Normal / CSOSN obrigatório 0900

> Não troque, não. Essa exigência de CSOSN numa empresa do Regime Normal pode acontecer por uma particularidade do Resulth, e o campo não deve ser deixado em branco nem substituído por CST só por causa do regime.
>
> Só um ponto importante: o código que você colocou (0900) não é um padrão universal. Quem confirma se ele é o certo para essa venda é a sua contabilidade, então não emita em definitivo sem essa conferência.
>
> Me diz qual é o produto e o tipo de operação dessa venda que eu te ajudo a conferir o restante do preenchimento.

### Simples Nacional / CST obrigatório 090

> Entendi. Não, não está errado só porque você é do Simples. Algumas rotinas do Resulth exigem o CST mesmo para empresa do Simples Nacional. É uma particularidade do campo na tela, então não deixe vazio.
>
> Só fica um ponto de atenção: na transmissão, emitente do Simples (CRT=1) não pode enviar CST, a SEFAZ rejeita com o 590 (Informado CST para emissor do Simples Nacional). Se aparecer essa rejeição, o caminho é revisar o cadastro fiscal dos produtos e o tipo de operação e usar o CSOSN adequado (102, 103, 300, 400, 500).
>
> Sobre o 090: o formato é esse mesmo, com o zero na frente (não é 09). Mas qual código se aplica à sua operação quem confirma é a contabilidade, antes de emitir em definitivo.
>
> Me conta uma coisa: já apareceu alguma rejeição quando você tentou transmitir, ou a dúvida é só no preenchimento da tela?

## Estado final e manutenção

O reforço do guia está publicado na base compartilhada. O rascunho 70 foi testado, mas não ativado. A versão 69 continua ativa com a skill antiga; ela também pode recuperar o guia atualizado, mas não foi executada nova avaliação paga nela nesta rodada. Não declarar que o ajuste da skill 70 já está no ar.

A comparação automática identificou 23 casos ativos, mas não encontrou rodada completa comparável para a candidata ou a ativa (versao=null e ativa=null). O retorno piorou=false não comprova ausência de regressão nesse cenário. Os dois cenários desta correção foram validados, sem bateria completa dos outros 21 casos.

Ativação do rascunho e rodadas adicionais dependem de autorização específica. Auditoria, metadados e backlog foram atualizados. A sincronização das sete abas do Google Sheets e do Excel local foi concluída com sucesso. Nenhuma credencial ou dado de cliente consta deste documento.
