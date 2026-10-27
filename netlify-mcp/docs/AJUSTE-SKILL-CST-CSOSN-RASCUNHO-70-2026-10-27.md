# Ajuste da skill fiscal: rascunho 70 e reteste — 27/10/2026

## Autorização e estado

Paulo autorizou aplicar o trecho aprovado na skill e testar novamente os mesmos dois cenários. Foram informados o escopo de duas execuções, uma por cenário, estimativa US$ 0,005–0,03 e ausência de ativação automática. Não houve repetição paga.

A conferência anterior à gravação encontrou a versão 69 ativa, não a 68 dos testes anteriores. A única diferença entre 68 e 69 era o limiar do Jev: de 0,5 para 0,3, mantendo o verificador ativo. Essa alteração preexistente foi preservada. O agente não a realizou nesta entrega.

Foi gravado o rascunho 70 a partir da ativa 69, alterando somente a skill orientacao-fiscal. A leitura de ver_versao confirmou a igualdade integral dos demais componentes; validar_configuracao retornou ok, sem erros ou avisos. A leitura após os testes confirmou que a versão ativa continua sendo a 69. O rascunho 70 não foi ativado.

## Trecho aprovado e aplicado no rascunho

Substituídos os três parágrafos anteriores sobre particularidade, conferência do XML e formato dos códigos. As demais partes da skill, incluindo a orientação geral de preservar formatos e não recomendar alíquota/base sem fundamento, permanecem. O bloco aprovado ficou assim:

```text
PARTICULARIDADE DO RESULTH: CST E CSOSN OBRIGATÓRIOS

No Resulth, algumas rotinas exigem CST mesmo no Simples Nacional e CSOSN mesmo no Regime Normal. Se o cliente relatar essa exigência, reconheça primeiro essa particularidade.

Não mande trocar o conteúdo de um campo CST por CSOSN, ou de CSOSN por CST, apenas pelo regime da empresa. Não mande deixar um campo obrigatório vazio por esse motivo.

Diferencie o preenchimento exigido na tela da informação transmitida no XML. Não afirme que o código será enviado ou ignorado sem fundamento na documentação da rotina.

Consulte a base sobre a tela e a finalidade do campo. Se faltar informação, peça somente o esclarecimento necessário. Não trate 090, 0900 ou outro código como padrão universal; a contabilidade confirma sua aplicação à operação.
```

## Resultado dos testes

Foram reutilizados os casos 24 e 25, com as mesmas mensagens e critérios anteriores, em uma execução cada no rascunho 70. Não foi rodada uma nova linha de base paga na versão 69. Como 68 e 70 também diferem pelo limiar do Jev, esta comparação não isola o efeito da edição da skill.

| Caso | Rodada | Avaliação automática | Tempo | Custo USD |
|---|---:|---|---:|---:|
| Regime Normal / CSOSN obrigatório 0900 | 46 | Aprovado | 11.667 s | 0.00312683 |
| Simples Nacional / CST obrigatório 090 | 47 | Reprovado | 30.637 s | 0.00179389 |

**Placar: 1/2. Custo informado pelo Console: US$ 0.00492072.** As duas rodadas terminaram com status ok e erro nulo, sem transferência. Não houve 504 observado.

No cenário Regime Normal, a resposta reconheceu a particularidade e orientou não substituir ou esvaziar o campo apenas pelo regime. Não confirmou 0900 como código universal e manteve a validação contábil. Há ainda apresentação longa, redundância e exemplos de CST que podem distrair do campo solicitado.

No cenário Simples Nacional, a resposta final foi genérica: pediu o que aparece na tela ou ofereceu analista, sem reconhecer a particularidade relatada. A avaliação reprovou, nota 0,08. load_skill, consultar_base_conhecimento e fiscal_ats_validar_cst foram acionadas, mas isso não garantiu uma resposta útil.

O verificador estava ativo no rascunho, com limiar 0,3. O texto genérico é compatível com uma resposta de prudência, mas o resultado de ver_rodada_eval não fornece a resposta anterior ao verificador nem seus eventos completos. Não foi comprovado se o Jev substituiu a resposta original nesse teste; não atribuir a causa a ele como fato.

## Respostas observadas

### Regime Normal / CSOSN obrigatório 0900

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
> Sobre a sua dúvida: no Resulth é normal a rotina pedir CSOSN mesmo em empresa do Regime Normal, e a tela pode até mostrar os dois campos. Isso é uma particularidade do sistema, então não troque o conteúdo do campo só por causa do regime, nem deixe ele em branco.
>
> Para Regime Normal o habitual é o CST de 3 dígitos (000 para tributada integralmente, 060 quando o ICMS já foi cobrado por ST). O 0900 que você citou, como CSOSN, está cadastrado como Outros.
>
> Só que quem define o código certo da sua operação é a contabilidade. Confirme com ela antes de emitir, tá? Me fala o CFOP que está nessa nota que a gente segue daqui.

### Simples Nacional / CST obrigatório 090

Ferramentas: load_skill, consultar_base_conhecimento, fiscal_ats_validar_cst.

> Nao quero te passar uma informacao errada. Me conta o que aparece na sua tela agora, ou, se preferir, eu te passo para um dos nossos analistas.

## Pendências

Manter o rascunho 70 sem ativação. O resultado demonstra melhora em um cenário e falha no outro, com apenas uma execução de cada; não declarar estabilidade ou correção completa. Investigar a origem do fallback e as fontes retornadas no caso Simples. Mudanças adicionais de skill, guardrail, prompt, verificador ou ativação exigem a autorização aplicável. Nova rodada paga não está incluída neste lote. Nenhuma dessas mudanças adicionais foi feita.
