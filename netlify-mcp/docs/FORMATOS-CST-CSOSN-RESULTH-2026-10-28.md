# Formatos CST/CSOSN do Resulth — 28/10/2026

## Objetivo
Aceitar a formatação utilizada pelo Resulth sem confundir o campo da tela com a chave da tabela fiscal. Autorização: Paulo aprovou aplicar a proposta de compatibilidade do MCP, ajuste da skill fiscal e testes locais. Não houve autorização de novo lote pago nem de deploy nesta etapa.

## Contrato
| Tributo | Informado | Código na tabela | Formato Resulth |
|---|---|---|---|
| ICMS | 060 | 60 | 060 |
| ICMS | 090 | 90 | 090 |
| CSOSN | 0500 | 500 | 0500 |
| CSOSN | 0900 | 900 | 0900 |

O campo legado `codigo` continua igual ao informado, preservando compatibilidade. Os retornos ICMS/CSOSN acrescentam `codigo_informado`, `codigo_tabela` e, quando conhecido, `codigo_resulth`. Nenhum número é convertido para tipo numérico.

CST ICMS de três dígitos mantém o primeiro dígito de origem, inclusive quando diferente de zero. Se recebido só o CST de dois dígitos, a ferramenta não inventa a origem nem gera o formato de três dígitos. CSOSN aceita três dígitos oficiais ou quatro começando por zero; não remove prefixos arbitrários. IPI, PIS e COFINS continuam limitados a dois dígitos.

A consulta de correlação e os formulários do painel aceitam o mesmo formato. A UI distingue código da tabela e formato no Resulth. Descrição encontrada não confirma enquadramento da operação e não determina qual campo será transmitido ou ignorado no XML.

## Arquivos
- src/fiscal.js: schemas, validação e consulta interna.
- public/app.js: campos de quatro dígitos para CSOSN e apresentação dos dois formatos.
- public/INSTRUCOES_AGENTE.md: documentação pública da compatibilidade.
- test/resulth-codes.test.js: regressões de formato, origem, entrada inválida, correlação e transporte MCP.

## Tina
Versão ativa conferida: 72. Gravado rascunho 73, alterando somente o trecho de formato da skill orientacao-fiscal. Validação de configuração passou, sem erros ou avisos. Configuração ativa 72, prompt, guardrails, Jev e demais parâmetros preservados.

O rascunho 73 não foi ativado: o MCP publicado ainda usa o contrato anterior. A ativação deve acompanhar o deploy do backend compatível, depois da revisão e dos testes de integração autorizados.

## Verificação
- npm test: 21 testes passaram, incluindo os quatro novos grupos de regressão.
- node --check public/app.js: passou.
- Chave informada, descrição e zero à esquerda preservados.
- Nenhuma execução paga da Tina, deploy ou troca de segredo realizada.

## Pendência
Publicar o MCP e revisar/ativar o rascunho de forma coordenada. Atualizar o código apenas no workspace não altera a ferramenta remota que a Tina ativa utiliza.
Verificação adicional no navegador: consultas locais 0500, 060, 090 e 0900 concluídas, preservando o código exibido e distinguindo código de tabela/formato Resulth. Captura em outputs/painel-fiscal/formatos-resulth.png no workspace.

## Reteste posterior autorizado
Em rodada separada, Paulo autorizou dois testes pagos do rascunho 73, uma execução por cenário (Simples/CST 090 e Normal/CSOSN 0900). Ambos foram aprovados pelo avaliador; custo total US$ 0.00339834. Mantida a versão ativa 72. A frase sobre campo do sistema versus informação da nota ainda merece precisão para não sugerir tratamento do XML sem documento da rotina. O MCP novo não foi publicado; os testes pagos avaliam a orientação com a integração publicada anterior. Relatório detalhado nas evidências locais work/ajuste-zeros-resulth-2026-10-28/RESULTADO-DOIS-TESTES.md.
