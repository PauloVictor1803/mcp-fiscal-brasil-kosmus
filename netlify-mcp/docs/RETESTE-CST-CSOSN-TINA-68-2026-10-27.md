# Reteste de CST/CSOSN após correção da base — 27/10/2026

## Escopo autorizado

Paulo autorizou duas execuções pagas na versão ativa 68, uma para Regime Normal com CSOSN obrigatório/0900 e uma para Simples Nacional com CST obrigatório/090. Nenhuma repetição automática foi feita. Antes do lote, foram conferidas a versão ativa e as duas páginas corrigidas, sem edição pendente. A publicação de conteúdo anterior foi o commit 5a1a0b0fa7343be0ee718365a86f73a7c10c03e4.

## Resultado

As duas execuções terminaram com status ok, erro nulo e sem transferência, mas reprovaram o critério. A revisão do texto também encontrou falhas concretas na distinção entre campo do Resulth e tratamento fiscal/XML. Não se trata somente de uma divergência de nota automática.

| Caso | Rodada | Nota automática | Tempo | Custo USD |
|---|---:|---:|---:|---:|
| Resulth Regime Normal com campo CSOSN obrigatorio 0900 | 44 | 0,03 | 16.897 s | 0.00666988 |
| Resulth Simples Nacional com campo CST obrigatorio 090 | 45 | 0,37 | 27.980 s | 0.00267232 |

Placar: 0/2. Custo total informado pelo Console: US$ 0.00934220. Não houve erro 504 observado. Os casos 24 e 25 foram cadastrados na suíte; novas execuções exigem autorização de custo.

## Falhas visíveis

- Regime Normal: a Tina afirmou que o campo deveria receber CST e não 0900. Isso contraria a orientação de não substituir um campo pelo outro apenas pelo regime quando a rotina exige o preenchimento.
- Simples Nacional: respondeu que o item não leva CST, leva CSOSN, e discutiu rejeição XML e uma exceção para devolução sem primeiro reconhecer a particularidade do campo obrigatório relatado pelo usuário. Não declarou que 090 deve ser rejeitado em qualquer situação, mas também não cumpriu a distinção solicitada entre campo interno e XML.
- Ambas carregaram orientacao-fiscal e consultaram a base; portanto, o problema não foi simplesmente a ausência de load_skill.
- A configuração 68 lida após o teste já continha a particularidade na skill. Os guardrails ativos lidos não tinham uma regra específica para essa particularidade.
- O retorno ver_rodada_eval mostra nomes das ferramentas, mas não as páginas, argumentos ou textos completos retornados pela busca. Não foi comprovado qual trecho recuperado conduziu cada resposta. A correção literal de duas páginas não garante que todas as fontes ou respostas fiquem alinhadas.

## Evidências de resposta

### Resulth Regime Normal com campo CSOSN obrigatorio 0900

Pergunta: Minha empresa é do Regime Normal e estou emitindo uma NF-e de venda no Resulth Windows. A tela está exigindo CSOSN. Consegui colocar aqui e deixei 0900. Preciso trocar esse campo por CST?

Ferramentas: load_skill, consultar_base_conhecimento, fiscal_ats_validar_cst.

> Oi! 😊
>
> Sou a Tina, assistente do Suporte de Primeiro Nível.
>
> Estou aqui pra te ajudar com o seu atendimento.
> Se for algo simples, resolvemos rapidinho por aqui.
>
> Pra começar, me informe com o que posso te ajudar por favor.
>
> Sobre sua dúvida: o CSOSN é o código usado por empresa do Simples Nacional. Como a sua é Regime Normal, o que se usa é CST de 3 dígitos, por exemplo 000 para tributada integralmente ou 060 quando o ICMS já foi cobrado por substituição tributária. Então sim, esse campo deve ficar com CST, e não com o 0900.
>
> Normalmente utiliza-se 000 ou 060 no sistema para esse tipo de venda, mas é indispensável confirmar com a contabilidade da sua empresa qual CST se aplica à sua operação antes de emitir.
>
> Esse dado fica no cadastro do produto, na sub-aba ICMS (alíquota interna e CST Estado). Quer que eu te acompanhe nesse cadastro passo a passo?

### Resulth Simples Nacional com campo CST obrigatorio 090

Pergunta: Sou do Simples Nacional e, na Digitação/Emissão de NF-e do Resulth Windows, o sistema está me obrigando a preencher CST. Informei 090. Está errado só porque sou do Simples? Devo deixar o campo vazio?

Ferramentas: load_skill, consultar_base_conhecimento, fiscal_ats_validar_cst, fiscal_ats_validar_cst, abrir_documento.

> Não é por deixar vazio, não. No Simples Nacional o item não leva CST, leva CSOSN. Se o CST 090 for junto no XML, a SEFAZ rejeita a nota com o erro 590 (Informado CST para emissor do Simples Nacional).
>
> Normalmente utiliza-se um CSOSN para esse tipo de operação (102, 103, 300, 400 ou 500), mas é indispensável confirmar com a contabilidade da sua empresa qual vale antes de emitir.
>
> Tem uma exceção: em nota de devolução, normalmente se destaca o imposto com CST 090 junto com o CSOSN 900, também confirmado com a contabilidade.
>
> Sua nota é venda normal ou devolução? Assim eu te digo o que ajustar na tela.

## Estado e próximos passos

A remoção da regra absoluta nas duas páginas foi publicada e permanece conferida. O comportamento do agente ainda não foi corrigido de forma comprovada. Não houve alteração de prompt, skill, guardrail, modelo ou versão neste lote. É necessário avaliar instrução mais direta para o preenchimento dos campos do Resulth e revisar as fontes pertinentes antes de novo reteste; mudanças no agente e nova rodada paga dependem das autorizações aplicáveis. Não validar 090, 0900 ou qualquer código como padrão universal para contornar a exigência de tela.
