# Correlação fiscal no MCP ATS

## Objetivo e estado

A ferramenta `correlacionar_dados_fiscais` foi implementada, testada e publicada
na Netlify em 26/10/2026 (deploy `6adfb305e4146e392fb7c1ca`).
Ela reúne, numa chamada, a busca de candidatos de CEST por descrição/NCM e a
conferência de códigos CFOP, CST ICMS, CSOSN, CST IPI, CST PIS e CST COFINS já
levantados no atendimento ou na base ATS. Cada retorno mantém o código, a
descrição, a situação na tabela e a data da referência. Não escolhe códigos
tributários por conta própria.

Esta alteração no repositório **não altera o prompt, a skill, a configuração ou
a versão ativa da Tina**. Conectar a nova ferramenta e testar a resposta do
agente são etapas separadas.

## Uso esperado pela Tina

1. Consultar a base de conhecimento ATS sobre a operação e o produto, conforme
   as regras atuais do agente. Reutilizar o contexto do cadastro do cliente.
2. Para classificação de produto, consultar o NCM no serviço Siscomex já
   disponível. Quando o cliente só fornecer o nome ou uma foto, tratar o NCM
   encontrado como candidato até confirmar as características do item.
3. Passar à nova ferramenta somente os dados relevantes e códigos candidatos.
   A ferramenta **não recebe CNPJ, IE, nome do cliente nem chave de NF-e**.
4. Usar as descrições e pendências devolvidas para responder em linguagem
   simples. Dizer "normalmente" somente quando a base ATS sustentar o cenário.
   Confirmar o enquadramento com a contabilidade; a orientação não substitui
   essa conferência.

Exemplo de chamada para um produto, sem presumir o NCM:

```json
{"descricao_produto":"xampu"}
```

O retorno traz candidatos `20.017.00` e `28.011.00` na referência atual e
pergunta pelo NCM e pela modalidade da venda, pois o segundo é do segmento
porta a porta. Após o NCM ser conferido na ferramenta Siscomex e a modalidade
confirmada, a chamada pode ser refinada:

```json
{"descricao_produto":"xampu","ncm":"33051000","modalidade_venda":"outras"}
```

O NCM continua marcado como **informado, não verificado por este MCP**. A
existência de um CEST na tabela não determina a aplicação de substituição
tributária à operação.

Exemplo para conferir códigos candidatos de uma devolução, depois de consultar
a base ATS e a nota original:

```json
{"cfop":"5.202","cst_icms":"090","csosn":"900","regime":"simples_nacional"}
```

As descrições são devolvidas separadamente. A ferramenta não afirma que essa
combinação é correta. No Resulth, CST e CSOSN podem aparecer em campos distintos
mesmo quando um deles não compõe a NF-e; a resposta pede conferência da
configuração e do documento emitido. Para devoluções, o documento de origem e
os dados efetivos da operação continuam indispensáveis.

## Limites de inferência

- CFOP depende da natureza, direção, finalidade e abrangência da operação. O
  nome do produto, o regime ou o NCM, isoladamente, não determinam o CFOP.
- CST/CSOSN exige regime e tratamento tributário da operação. Não se deriva um
  código do outro por regra fixa. A presença de ambos em campos do Resulth
  não prova que ambos sejam transmitidos na NF-e.
- PIS, COFINS, IPI, alíquotas e bases de cálculo não são inferidos do CFOP nem
  do regime. Os campos respectivos aceitam **códigos candidatos**, cuja
  descrição pode ser conferida, mas não são preenchidos automaticamente.
- A ferramenta não consulta o cadastro do cliente, o serviço de IE, o Siscomex
  ou a base ATS. A coordenação dessas fontes permanece com a Tina.
- Código não encontrado, revogado ou referência atrasada exige nova conferência;
  ausência no snapshot não comprova inexistência oficial.

## Validação e publicação

`npm test` verifica o transporte MCP, as tabelas e dois cenários novos:
xampu com/sem NCM e modalidade, e conferência de CFOP/CST/CSOSN numa devolução.
Os testes não executam a Tina nem geram cobrança de modelo. Após o deploy,
`tools/list` no endpoint hospedado retornou as cinco ferramentas, e uma chamada
autenticada com `descricao_produto: "xampu"` retornou os candidatos `20.017.00`
e `28.011.00` usando a referência de 26/10/2026. O painel público também
passou a oferecer a opção **Cruzar dados fiscais**. O token usado na verificação
permaneceu fora do GitHub e desta documentação.

A Tina ainda tem filtro com as quatro ferramentas anteriores. Adicionar a nova
ferramenta ao agente e rodar um atendimento controlado são etapas futuras,
dependentes da autorização exigida para alterações do agente e testes pagos.

