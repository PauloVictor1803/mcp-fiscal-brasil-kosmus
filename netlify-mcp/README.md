# ATS Fiscal MCP — piloto Netlify, sem Docker

Quatro ferramentas locais, respostas curtas e nenhuma conexão configurada na Tina.
Node.js 22+; sem dependências de produção. O servidor Python original permanece disponível.

## Executar e testar

Na pasta `netlify-mcp`:

```sh
npm test
npm start
```

Abra http://127.0.0.1:8787 para usar o painel de teste, ou conecte
http://127.0.0.1:8787/mcp a um cliente MCP Streamable HTTP.
O endpoint aceita POST com `Content-Type: application/json` e
`Accept: application/json, text/event-stream`. A página de teste é servida pela
Netlify e pelo script local em `/`. O token digitado no painel não é persistido.

## Publicar na Netlify

Importe esta branch do fork e use o `netlify.toml` da raiz. Ele seleciona a base
`netlify-mcp`, publica somente `public/` e empacota os dados com a função.
Configure `AUTH_TOKEN` no painel da Netlify, com um valor longo e aleatório.
O endpoint público falha fechado sem essa variável. Não versione o segredo.
URL após implantação: `https://<nome-do-site>.netlify.app/mcp`.
Não há exigência de Docker, certificado digital ou API paga para estas funções.
O plano gratuito permanece sujeito aos limites da Netlify.

## Ferramentas

| Nome | Parâmetros | Retorno |
| --- | --- | --- |
| `consultar_cfop` | `cfop` string, ex. `5.102` | Um registro: descrição, tipo e âmbito |
| `validar_chave_nfe` | `chave` string, 44 dígitos | Formato numérico e DV; não consulta SEFAZ |
| `validar_cst` | `cst` string e `tributo` | Um código na tabela especificada |
| `consultar_cest` | `cest` string, ex. `01.007.00` | Um registro da amostra e até 12 NCMs |

Tributos: `ICMS`, `CSOSN`, `IPI`, `PIS`, `COFINS`. Em ICMS informar os três
dígitos combinados de origem+CST, preservando zeros; CSOSN tem três dígitos;
IPI/PIS/COFINS têm dois. A consulta não tenta adivinhar o tributo.

```json
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"consultar_cfop","arguments":{"cfop":"5102"}}}
```

## Economia de contexto

- Catálogo com apenas quatro ferramentas, descrições curtas, sem `instructions` globais.
- Um bloco `content` por resposta; não duplica o mesmo resultado em texto e JSON.
- Não envia tabelas, histórico, hashes ou documentação ao modelo.
- Validação de chave não devolve a chave, CNPJ ou outros dados extraídos.
- Testes limitam o catálogo a 3 KB e respostas representativas a 1,2 KB.
  Bytes não são tokens: o consumo real depende do modelo e da plataforma.
- Restrições de cobertura acompanham os resultados fiscais para não perder contexto.

Na verificação local desta versão, o catálogo ocupou **1.931 bytes**. A maior
resposta encontrada ao consultar os **644 registros/combinações** disponíveis
ocupou **291 bytes** (somente o resultado da ferramenta, sem envelope JSON-RPC).
Também passaram os oito testes automatizados, o empacotamento esbuild e uma
conexão real por HTTP usando o cliente oficial `@modelcontextprotocol/sdk`.
Isso não representa teste de deploy real na Netlify nem de conexão com a Tina.

## Dados e limites do piloto

`data/tabelas.json` é um snapshot do commit original documentado nos metadados.
Foi exportado por AST/SQLite em modo de leitura, sem executar o módulo do fork.
Contém 404 registros CFOP, 99 CST ICMS, 10 CSOSN, 33 PIS/COFINS,
14 IPI e **51 registros de amostra CEST**. A cobertura e a vigência ainda
não foram auditadas contra as fontes oficiais. Não tratar o snapshot como
tabela completa ou atualizada. `encontrado: false` não significa código inválido.
Mesmo `encontrado: true` não comprova adequação à operação ou vigência.

Antes de conectar à Tina, revisar as tabelas e substituir a amostra CEST por
fonte completa com data de referência e vigências. Não inferir códigos ausentes.
O escopo não inclui escolher tributação, calcular impostos ou emitir documentos.

Para reexportar, a partir da raiz do fork:

```sh
python scripts/export_netlify_tables.py
```

## Transporte

Streamable HTTP sem sessões, negociação das versões 2025-03-26, 2025-06-18 e
2025-11-25, respostas JSON. GET/SSE e DELETE retornam 405; notificações aceitas
retornam 202 vazio. Não anuncia SSE legado. Não mantém estado entre invocações.
Só permite Origin do próprio domínio ou da lista `ALLOWED_ORIGINS` (separada por
vírgulas). Chamadas servidor-a-servidor podem omitir Origin.
Corpo limitado a 8 KB. Usa a API moderna de Netlify Functions com Web Request.

## Licença

Lógica e tabelas adaptadas de MCP Fiscal Brasil, Copyright (c) 2026 Nikolas DeHor,
licença MIT preservada em `../LICENSE`. A licença do código não certifica os dados.
