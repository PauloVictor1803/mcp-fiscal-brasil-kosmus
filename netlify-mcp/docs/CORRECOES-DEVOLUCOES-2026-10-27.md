# Correções de devolução na base Tina — 27/10/2026

## Publicação

Cinco páginas corrigidas e indexadas sem erros. Configuração da versão ativa 71 preservada: sem alteração de prompt, skill, guardrails ou Jev. A correção é na base de conhecimento consultada durante o atendimento.

- Commit da primeira publicação, quatro páginas: `59397a031cd5a49bd63c1203e655ad011b35613f`.
- Commit do alinhamento do procedimento legado de cupom: `67f6dd4b1f3ab97b97b257db12d4978f95935fb1`.

## O que mudou

1. Duas cópias do procedimento de devolução de compra: removido o preenchimento padrão de base de ICMS em 100%. Conferir a eventual redução do item original e os valores correspondentes à quantidade efetivamente devolvida; não inferir a base pela alíquota. Dados faltantes devem ser conferidos no espelho com confirmação contábil.
2. Dois few-shots da mesma jornada harmonizados. A referência a CST 090 e CSOSN 0900 foi condicionada à confirmação contábil, sem tratá-los como códigos universais.
3. Saldo retido: confirmar nota, item, devoluções anteriores e rascunho relacionado antes de excluir apenas o documento não faturado que não será usado. Removidos detalhes internos de intervenção em banco e denominações de níveis de suporte; encaminhamento ao Suporte Técnico com backup quando houver intervenção técnica.
4. Procedimento legado de devolução de cupom: identificado conflito entre a sequência antiga Novo/Importar/Venda-NFC-e e o guia ilustrado do Resulth Windows. O resumo agora usa NF-e » Digitação/Emissão de NF-e, Inclusão, Seleção de Documentos de Origem e Nº da NFC-e, conforme o guia e a imagem local conferida. Geração de crédito condicionada à configuração da operação. O guia completo com mídias foi vinculado.

## Validação e limites

- YAML, IDs, mídias e relações dos quatro arquivos iniciais conferidos; releitura remota confirmou os conteúdos publicados. A página legada de cupom também foi relida, com equivalência do texto e do YAML; seu cabeçalho antigo usa quebras de linha diferentes.
- Quatro cópias locais canônicas atualizadas com backup. Cinco arquivos Markdown exportados separadamente para consulta.
- Não houve consulta técnica bem-sucedida ao NotebookLM nesta etapa. A tentativa revelou falha do helper de armazenamento de credenciais; o diagnóstico anterior de espera também mostrou bloqueio de perfil. Não atribuir uma causa única sem verificação. As correções reutilizaram a orientação já documentada e as telas existentes, sem criar regras fiscais ou menus novos.

## Dois retestes autorizados

Uma execução por cenário na ativa 71, mesmas mensagens e critérios dos casos anteriores. Custo informado: **US$ 0.00446092**.

| Cenário | Resultado automático | Revisão |
|---|---|---|
| Devolução parcial com redução de base | Passou | Não substituiu a redução por 100%, considerou as 3 unidades devolvidas e manteve confirmação contábil. |
| Devolução de venda de cupom | Reprovou | Houve resposta, portanto o vazio anterior não se repetiu nessa execução. A resposta reproduziu a sequência presente na página legada, identificada depois como conflitante com o guia ilustrado. A nota baixa não prova que houve invenção pelo modelo. |

**Ordem relevante:** os dois retestes ocorreram após a publicação das quatro páginas de compra e antes do alinhamento da quinta página, de cupom. O último alinhamento não teve reteste pago. Não declarar o caso de cupom aprovado nem a resposta vazia corrigida definitivamente. A ausência de resposta vazia em uma execução não explica sua causa anterior.

## Pendências

- Retestar a devolução de cupom após o alinhamento, mediante nova autorização de custo.
- Investigar a resposta vazia se persistir. A API de avaliação disponível não fornece o rastro interno suficiente; não atribuir o episódio ao Jev, a 504 ou a timeout sem evidência.
- Acompanhar novas conversas e a coerência entre páginas duplicadas. Uma execução aprovada não comprova estabilidade de todo o atendimento fiscal.

Os atendimentos privados e os identificadores de clientes permanecem somente nas evidências internas. Não foram incluídos neste documento.
