# ATS Fiscal — Manual para agentes de IA

## Finalidade

Ferramentas de consulta e conferência de referências fiscais. Um resultado encontrado não valida a tributação da operação. A orientação não substitui nem dispensa a confirmação com a contabilidade antes da emissão ou alteração fiscal.

Use o servidor que fornece este manual; o endpoint é `/mcp`, no mesmo domínio. Os nomes abaixo são os nomes originais do MCP. Se a plataforma acrescentar um prefixo, utilize os nomes expostos pelo catálogo de ferramentas.

## Conexão

- Transporte: Streamable HTTP, requisições POST JSON-RPC 2.0.
- Cabeçalhos: `Content-Type: application/json`, `Accept: application/json, text/event-stream`.
- Autenticação quando configurada: `Authorization: Bearer <TOKEN>`. Obtenha o token pelo mecanismo de segredos da plataforma. Nunca o inclua no prompt, na URL ou na resposta ao usuário.
- Versões aceitas: `2025-11-25`, `2025-06-18`, `2025-03-26`. Envie `MCP-Protocol-Version` com a versão negociada.
- Inicie com `initialize`, envie `notifications/initialized` e consulte `tools/list` para confirmar os parâmetros disponíveis. Use `tools/call` para executar a ferramenta.

Exemplo de chamada após inicializar:

```json
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"consultar_aliquota_icms","arguments":{"uf_origem":"MG","uf_destino":"SP","ano":"2026","origem_mercadoria":"nacional"}}}
```

## Ferramentas

### consultar_aliquota_icms

Parâmetros: `uf_origem` e `uf_destino` obrigatórios; `ano` com quatro dígitos; `origem_mercadoria`: `nacional`, `importada` ou `nao_informada`.

Retorna uma referência geral da matriz manual de 2026. Aproveite a UF do emitente já disponível e confirme o destino que faltar. A tabela não atualiza automaticamente e não cobre a regra específica de importados. Não use outro ano por suposição. Alguns percentuais internos incluem ICMS e eventual FCP sem separação: não lance o total como ICMS nem some FCP novamente. A alíquota não determina a base, ST, DIFAL ou benefícios.

### consultar_cfop

Parâmetro obrigatório: `cfop`, quatro dígitos, com ou sem ponto. Exemplo: `{"cfop":"5.102"}`.

Explica o código informado. Para recomendar, consulte também a documentação da operação e confirme sentido da nota, origem/destino e condições relevantes. Não escolha o enquadramento apenas pelo nome do código.

### validar_cst

Parâmetros obrigatórios: `cst` e `tributo` (`ICMS`, `CSOSN`, `IPI`, `PIS`, `COFINS`). ICMS aceita dois dígitos ou três com origem (060, 090); CSOSN aceita três dígitos da tabela oficial ou quatro no formato Resulth (0500, 0900); os demais aceitam dois. Preserve os zeros. Exemplo: `{"cst":"000","tributo":"ICMS"}`.

Confere existência e descrição na tabela, não a aplicação à operação. Não crie conversão automática CFOP → CST → CSOSN → PIS/COFINS. Regime Normal não distingue Lucro Real de Presumido. Particularidades dos campos do ERP dependem de sua documentação; um campo obrigatório não comprova qual informação vai para o XML. Por particularidade do Resulth, o campo de CST ICMS usa três dígitos e o de CSOSN quatro, com zero à esquerda nos exemplos informados. Envie o código completo à ferramenta, sem retirar o zero da tela. O retorno preserva `codigo` e `codigo_informado`, identifica `codigo_tabela` e apresenta `codigo_resulth`. Exemplo: CSOSN `0900` consulta internamente `900` e mantém `0900` como formato do sistema. Isso não valida o código para a operação nem define o XML. Para CST ICMS com apenas dois dígitos, a origem não é presumida e `codigo_resulth` não é gerado.

### consultar_cest

Use `descricao`, `ncm` ou `cest`. Descrição e NCM podem ser combinados; código CEST deve ser consultado sozinho. NCM: oito dígitos, com ou sem pontos. `modalidade_venda`, quando confirmada: `porta_a_porta` ou `outras`.

Exemplos: `{"descricao":"xampu"}`, `{"descricao":"xampu","ncm":"33051000","modalidade_venda":"outras"}`, `{"cest":"20.017.00"}`.

Aproveite NCM e características já informados ou legíveis em imagem. Para conferir NCM, use a integração Siscomex separada; este servidor não pesquisa NCM. Compare os candidatos, a descrição oficial, NCM/SH e condições como venda porta a porta. Se faltar uma característica determinante, pergunte somente essa informação. Não escolha o primeiro resultado automaticamente. Resultado vazio não comprova ausência de CEST. CEST encontrado não determina aplicação de ST.

### validar_chave_nfe

Parâmetro obrigatório: `chave`, 44 dígitos; aceita espaços. Confere formato e dígito verificador. Não consulta autorização, situação da nota ou autenticidade na SEFAZ. Uma chave que passa na matemática não comprova que a nota existe ou foi autorizada.

### correlacionar_dados_fiscais

Aceita `descricao_produto`, `ncm`, `modalidade_venda`, `cfop`, `cst_icms`, `csosn`, `cst_ipi`, `cst_pis`, `cst_cofins` e `regime`. Informe ao menos um produto, NCM ou código. Regime: `simples_nacional`, `regime_normal` ou `nao_confirmado`.

Reúne candidatos de CEST e confere códigos já levantados na documentação ou na operação. Não seleciona sozinho CFOP, CST, CSOSN, PIS/COFINS, base ou alíquota. Não infere regime por CNPJ/IE; essa consulta pertence a outra integração. Use somente informações confirmadas e reutilize as já obtidas no atendimento.

## Como interpretar o retorno

- O conteúdo fiscal é JSON no bloco de texto de `result.content`. Confira também `result.isError` e erros JSON-RPC.
- Respeite `encontrado`, `status`, `inicio`, `referencia`, `ano_referencia`, `avisos`, `confirmar` e `atualizacao_atrasada` quando presentes. Não apresente código revogado ou de vigência futura como ativo hoje.
- As tabelas oficiais têm processo de atualização próprio; a matriz de ICMS é manual. Não prometa atualização automática de tudo.
- Em devoluções, confira base, eventual redução e impostos do item original e os valores correspondentes à quantidade devolvida. Não recomende base 100% apenas porque há uma alíquota ou porque a empresa é do Simples.
- Responda com o resultado pertinente e as condições necessárias, em linguagem simples. Indique a confirmação contábil sem esconder um candidato fundamentado. Não exponha JSON bruto, credenciais ou nomes internos de ferramentas ao cliente sem necessidade.


## Precisão e respostas objetivas (28/10/2026)

Responda ao código solicitado. Pergunta sobre CFOP não autoriza sugerir CST, CSOSN ou alíquota. Na devolução, use a descrição do CFOP e o contexto da operação, sem regra de troca de dígito.

Nos resultados de CEST, `segmento_nome` contextualiza o segmento de mercadorias do Anexo I do Convênio ICMS 142/18. Segmento não é o ramo cadastral do cliente nem prova aplicação de ST. A busca de ar-condicionado prioriza aparelhos completos sobre peças nas consultas gerais, sem escolher automaticamente um código. Buscas explícitas de filtro/tubo continuam incluindo esses itens. Pergunte o uso determinante (veículo ou ambiente) antes de listar códigos quando faltar contexto.

Nas consultas PIS/COFINS, leia o aviso: a descrição de CST, inclusive 99 (Outras Operações), não determina incidência, alíquota ou base. Não recomende zero só pelo CFOP ou regime. A contabilidade confirma o tratamento específico.
