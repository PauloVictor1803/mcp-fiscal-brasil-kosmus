# Tina — investigação e seis testes autorizados em 24/10/2026

## Escopo e custo

Versão ativa testada: 53. Seis cenários, uma execução de cada, sem modificar prompt, ferramentas IE, cadastro ou parâmetros de cliente. O lote foi autorizado expressamente pelo Paulo, com estimativa de US$ 0,10 a US$ 0,25, informada como estimativa sem teto técnico. Custo informado pelo console: **US$ 0.02325466**. Nenhuma execução adicional foi iniciada.

A proposta inicial de reutilizar CNPJ de um atendimento foi bloqueada pela revisão automática por falta de autorização específica do dado/destino. Ela não foi executada. O lote efetivamente executado usou somente exemplos simulados sem CNPJ real, com o resultado esperado da consulta descrito nas mensagens quando pertinente.

## Resultados

O avaliador aprovou os seis cenários. Isso representa seis amostras desta configuração e destes critérios, sem repetição. Não é taxa geral de qualidade da Tina, nem comparação direta com os lotes anteriores, que tinham outros casos, critérios e repetições.

| Cenário | Resultado automático | Comportamento observado |
|---|---|---|
| Fornecedor MG, zeros já presentes no retorno informado da consulta | Aprovado | Confirmou salvar com 13 dígitos e zeros à esquerda; ofereceu consultar CNPJ como conferência adicional. |
| Cliente MG e fornecedor ES, retorno informado da consulta | Aprovado | Orientou manter os 9 dígitos do fornecedor ES, sem aplicar 13 por causa da UF do cliente. Persistindo o bloqueio, orientou o parâmetro IE Fornecedor inválida de Bloqueia para Avisa. |
| Cadastro do cliente em MG, UF do fornecedor desconhecida | Aprovado | Pediu UF ou CNPJ do fornecedor antes de indicar zeros. Uma frase da resposta ficou truncada: ver ressalva abaixo. |
| Consulta de CNPJ sem IE no retorno | Aprovado | Não concluiu isenção nem mandou apagar a IE da nota; pediu UF/CNPJ para conferir. |
| Início de devolução parcial de compra, contexto completo | Aprovado | Buscou a base e indicou cliente espelho, nota de entrada confirmada e início da emissão. Um comentário adicional sobre preço permanece sem fonte identificada nas páginas conferidas. |
| Devolução parcial com vínculo e documento de origem já preparados | Aprovado | Orientou Qtd. a devolver, seleção da origem e alternativa de abrir o item para ajustar a quantidade, com recálculo proporcional. |

## Conferência humana e documental

### IE: correção do diagnóstico anterior

Completar zeros à esquerda não é erro por si só. Paulo confirmou que a validação do Resulth exige o formato conforme a UF e que a ferramenta de IE já retorna esse preenchimento. A base local de entrada de notas, seção 11.2, documenta tanto zeros conforme UF quanto o parâmetro IE Fornecedor inválida de Bloqueia para Avisa após conferir os dados e persistir o bloqueio.

Portanto, reprovações antigas não demonstram por si só erro de IE ou invenção de parâmetro. Deve-se distinguir retorno da consulta, UF correta, critérios do teste e condução do atendimento. O caso antigo não foi alterado retroativamente para esconder resultados.

### Devolução de compra

A base local de emissão de devolução de compra contém as colunas Sel. e Qtd. a devolver, além dos botões Selecionar e OK. A leitura da página publicada `procedimentos/devolucao-de-compra-fornecedor-amarracao-e-origem.md` confirmou abrir o item com dois cliques, informar Qtd. a Devolver e recálculo proporcional de valores, bases e impostos.

No cenário inicial, a Tina também comentou uma escolha entre preço de venda e preço da nota de entrada. Esse comentário não foi localizado nas páginas conferidas. Sua origem ou aplicação requer verificação antes de tratá-lo como orientação validada. O resumo da avaliação mostra nomes de ferramentas, mas não o conteúdo integral de todas as chamadas.

### Frase incompleta apesar de aprovação

No cenário de UF desconhecida, a resposta continha: “se o fornecedor for isento ou não contribuinte, o campo Insc. Est.”, sem completar o que fazer com o campo. A aprovação semântica do cenário não detectou essa quebra de redação.

As regras fixas da plataforma informam que o verificador de fundamento está sempre ligado. Isso confirma a existência dessa etapa, mas não prova que ela cortou a frase ou gerou a resposta genérica observada no lote anterior. Faltam rastros detalhados dessas simulações para atribuir a causa.

## Contexto cadastral: o que foi e não foi validado

Os esquemas atuais de salvar_eval e rodar_evals não expõem idATS nem um objeto de dados do cliente. O campo conversa é descrito como referência de origem; não foi presumido que injeta o cadastro. O contexto deste lote foi informado nas mensagens simuladas.

Esses resultados avaliam a distinção entre dados do cliente e fornecedor dentro do diálogo. Não comprovam a integração completa Blip -> idATS -> API de clientes ATS -> contexto da Tina. Também não validam a coleta real de IE para os fornecedores fictícios apresentados nas mensagens. Uma chamada de ferramenta observada sem argumento bruto disponível não comprova retorno cadastral correto.

## Conclusão e pendências

O lote teve 6/6 aprovações automáticas e apresentou respostas concretas nas duas etapas da devolução, diferentemente da resposta genérica de uma execução anterior. Como o texto variou entre amostras da mesma versão e não houve alteração de configuração neste lote, não se deve afirmar que uma falha intermitente foi definitivamente corrigida.

Pendências: comprovar a injeção real do cadastro em um caminho de teste compatível; investigar a frase truncada e respostas genéricas; conferir o comentário sobre preço; obter rastros que relacionem a resposta às fontes e ao verificador. Não desativar validadores para melhorar o placar. Novos testes pagos exigem autorização específica.

