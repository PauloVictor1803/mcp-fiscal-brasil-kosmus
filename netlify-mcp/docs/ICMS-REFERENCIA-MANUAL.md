# Tabela manual de referência de ICMS

Criada em 26/10/2026 a pedido do Paulo, usando a matriz TaxGroup enviada na conversa.

## Arquivos e leitura

- `data/icms-referencia-manual.csv`: matriz editável com 27 origens e 27 destinos. UTF-8 com BOM, separador ponto e vírgula e decimal com vírgula, para abertura no Excel em português.
- `data/icms-referencia-manual.metadata.json`: ano, fonte, data do registro e limites da tabela.
- `data/icms-referencia-manual.json`: arquivo de consulta gerado a partir do CSV; não editar diretamente.
- A primeira linha contém as UFs de destino e a primeira coluna contém as UFs de origem. A diagonal repete as referências internas da imagem.
- Os números estão em pontos percentuais: `19,5` significa 19,5%. Não substituir por `0,195` no CSV.

## Atualização manual

1. Preserve uma cópia da referência anterior antes de substituir os dados.
2. Edite os percentuais necessários no CSV, mantendo as 27 UFs nas linhas e colunas. Salve como CSV UTF-8, separado por ponto e vírgula.
3. Atualize o ano de referência, a data do registro e a fonte no arquivo de metadados. Trocar somente o ano não comprova a validade das taxas.
4. Confira as 729 células, especialmente a diagonal e os casos MG → SP, SP → ES e ES → SP. Uma UF repetida, valor vazio ou texto no lugar de percentual deve impedir o uso da tabela.
5. Execute `node scripts/gerar_icms_manual.mjs` na raiz do repositório, rode `node --test netlify-mcp/test/*.test.js` e publique a função na Netlify. O teste de CI confere que o JSON corresponde ao CSV.

### Caminho do Paulo pelo Excel

Abra a planilha entregue na conversa, na aba `ICMS 2026`. Os dados ficam em `B9:AB35`, com a origem na coluna A e o destino na linha 8. Edite como percentual: para 19,5%, digite `19,5%`. Atualize a referência do ano em B2 e a fonte quando necessário.

Salve e envie a planilha atualizada ao responsável pela manutenção do MCP. Ele precisa converter os percentuais do Excel (19,5% é armazenado como 0,195) para pontos percentuais no CSV (19,5), conferir as UFs e as 729 células, atualizar os metadados, gerar o JSON, testar e publicar. Paulo não precisa operar Netlify ou GitHub.

Salvar o Excel não altera o site. Não existe sincronização automática entre Excel, CSV e serviço. A planilha permanece como cópia de trabalho e revisão. Não é necessário esperar a virada do ano se uma mudança conhecida ocorrer antes.

## Publicação e testes de 26/10/2026

A ferramenta `consultar_aliquota_icms` está publicada no MCP em `https://ats-fiscal-mcp-kosmus.netlify.app/mcp`, deploy `6adfbee638138a4fa9219ca3`. O painel público oferece a consulta por origem, destino, ano e origem da mercadoria.

Recebe `uf_origem`, `uf_destino`, `ano` opcional (padrão: ano corrente em Brasília) e `origem_mercadoria` opcional. Retorna apenas o par consultado, percentual de referência, fonte, ano e avisos. Recusa ano diferente do snapshot sem devolver percentual. Não faz coleta do CONFAZ nesta consulta manual.

- 17 testes locais passaram, incluindo as 729 combinações, edição inválida, importados, ano sem referência e regressões das ferramentas anteriores.
- 11 consultas em produção passaram: seis cenários ICMS e uma consulta para cada uma das cinco ferramentas anteriores.
- Produção: requisição sem token retornou 401 e UF inválida foi rejeitada.
- Nas seis chamadas ICMS medidas, ida e volta HTTP entre 169 e 186 ms; JSON-RPC entre 571 e 908 bytes. Medição pontual, sem promessa de latência nem estimativa de tokens da Tina.
- Não houve teste pago de modelo nem mudança de filtro, prompt, skill ou versão ativa da Tina. Sua configuração precisa expor a nova ferramenta antes de utilizá-la.

## Limites

Esta tabela preserva a imagem, sem certificar a vigência jurídica dos percentuais. Valores como os exibidos para AL, RJ e SE podem incluir adicionais de fundos estaduais. A imagem não os separa; não usar automaticamente o valor integral como `pICMS` nem duplicar um adicional de FCP.

Ela não cobre a regra de 4% para importados, regimes especiais, alíquotas por produto, benefícios, redução de base, DIFAL nem associação de CST/CSOSN. Serve como referência geral, com confirmação contábil do enquadramento antes da emissão.

Não há raspagem ou atualização automática desta tabela. A atualização automática das outras tabelas oficiais permanece independente. A publicação no MCP não altera a configuração da Tina.
