# Publicação do Fiscal e ativação da Tina 76 — 28/10/2026

## Resultado confirmado
- Fiscal publicado em https://ats-fiscal-mcp-kosmus.netlify.app/.
- Deploy de produção: 6ae242a42f2a3c8c50312aba.
- Publicação: 28/10/2026 às 15:44:59 (Brasília).
- Tina 76 ativada com forcar=false; leitura posterior confirmou o conteúdo da candidata.
- A versão anterior da Tina era 72; o deploy anterior do Fiscal foi preservado no registro interno para reversão.
- Implantação/rotação das novas chaves permanece pendente. AUTH_TOKEN existente foi preservado e conferido. Monitor SEFAZ e Consulta IE não foram publicados nesta etapa.

## Escopo autorizado
Paulo confirmou seguir com a publicação, mantendo pendente apenas a implantação das novas chaves. O escopo apresentado foi um deploy do Fiscal (15 créditos segundo a regra do plano), seguido de ativação da Tina 76 se o Console permitisse, sem novas avaliações pagas e sem forçar bloqueios. Não houve três deploys nem mudança de segredo. O consumo faturado não foi consultado no painel; foi executado um deploy bem-sucedido de produção.

## Conteúdo entregue
Painel visual, ícone e manual Markdown; formatos CST/CSOSN do Resulth; distinção entre código informado e tabela; contexto dos segmentos CEST e ordenação de aparelhos/peças; aviso de limites PIS/COFINS; consulta de ICMS já existente. Dados oficiais embarcados obtidos do main e validados com referência 28/10/2026, sem substituir a tabela manual de ICMS de 2026.

A Tina recebeu apenas mudanças nas skills orientacao-fiscal e tratamento-erros-sistema. Prompt, guardrails, modelo, Jev, integrações e dados do cliente foram preservados. Inclui a redação CEST aprovada, os zeros do Resulth e a obrigação de conferir CST/CSOSN específico no MCP.

## Verificações da publicação
Pacote isolado sem chave embutida: 24 testes Node passaram, usando os dados efetivamente embarcados.

No endpoint público foram confirmados:
- 401 sem chave e com chave incorreta; chave existente permite acesso.
- Catálogo com seis ferramentas.
- ICMS 060/090 e CSOSN 0500/0900, preservando código e formato.
- CFOP, contexto CEST, aviso PIS, referência ICMS MG-SP 2026, recusa de referência 2027 e correlação com 0900.
- HTML, CSS, JavaScript, manual e PNG disponíveis.

A nova interface foi aberta e conferida no navegador. A autenticação real da publicação não foi desabilitada para permitir essa conferência.

## Testes de comportamento e limites
Nas etapas anteriores autorizadas: seis cenários fiscais passaram na versão 74; a redação CEST passou em uma execução na 75. A última adição da versão 76 (gatilho obrigatório de consulta CST/CSOSN) passou na validação de configuração, sem uma nova simulação paga. Não foi paga nova rodada nesta publicação.

O comparador não apresentou rodada global completa para candidata/ativa; piorou=false não representa aprovação de toda a suíte. O Console aceitou a ativação sem forçar. A apresentação longa de algumas respostas continua como pendência conhecida, registrada no relatório de melhorias; a ativação não é alegação de que isso foi resolvido.

## Operação e continuidade
Endpoint da Tina permanece /mcp no mesmo domínio. O segredo já configurado continua sendo usado. Manter pendente a [issue de novas chaves](https://github.com/PauloVictor1803/sefaz-monitor-mcp/issues/1). Não repetir publicação/ativação sem conferir o estado, para evitar crédito ou mutação duplicados.

Configuração de empacotamento usada no diretório isolado: publish=public, functions=netlify/functions, node_bundler=esbuild, NODE_VERSION=22. O site utiliza deploy manual; esta entrega não vincula publicação automática a GitHub nem migra hospedagem.
