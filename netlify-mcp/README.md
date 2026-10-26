# MCP Fiscal ATS na Netlify

Cinco ferramentas: `consultar_cfop`, `validar_chave_nfe`, `validar_cst`,
`consultar_cest` e `correlacionar_dados_fiscais`.
Dados reconstruidos nos documentos oficiais CONFAZ/SINIEF e MOC NF-e, com referencia,
codigos revogados e vigencias futuras. NCM permanece na consulta Siscomex existente.

- Painel: https://ats-fiscal-mcp-kosmus.netlify.app
- MCP: https://ats-fiscal-mcp-kosmus.netlify.app/mcp
- [Documentacao de arquitetura, fontes, atualizacao e operacao](docs/OPERACAO-MCP-FISCAL.md)
- [Historico da auditoria do snapshot reprovado](docs/AUDITORIA-TABELAS.md)
- [Correlacao fiscal: entradas, evidencias e limites](docs/CORRELACAO-FISCAL.md)

## Executar

Node.js 22+, sem dependencias de producao e sem Docker:

```sh
npm test
npm start
```

## Acesso

O painel pede o valor de `AUTH_TOKEN`, configurado nas variaveis da Netlify.
Esse token e uma chave de acesso ao servidor, nao uma medida de consumo de IA.
Nao incluir a chave em commits, documentacao, URLs ou codigo publico.
O endpoint recebe `Authorization: Bearer <AUTH_TOKEN>`.

## Atualizacao

O workflow `atualizar-tabelas.yml` consulta as fontes diariamente, valida e grava
somente a referencia aprovada no GitHub. A funcao Netlify le esse JSON com cache
de ate uma hora quando `TABLES_AUTO_UPDATE=true`. Falhas preservam a ultima
referencia validada. Nao ha necessidade de um deploy Netlify por dia.
A rotina deve estar presente e habilitada na branch padrao do repositorio.

## Limites

Consulta de referencia documental nao define tributacao. A validacao da chave
confere formato numerico e digito, sem consultar autorizacao da nota na SEFAZ.
A nova ferramenta ainda nao foi adicionada ao filtro de ferramentas da Tina.
# Referência manual de ICMS

A ferramenta `consultar_aliquota_icms` consulta um par origem/destino na tabela manual TaxGroup/ATS 2026, com respostas compactas. Consulte [como usar, atualizar pelo Excel e os resultados dos testes](docs/ICMS-REFERENCIA-MANUAL.md). O cadastro da ferramenta no MCP não modifica automaticamente os filtros da Tina.

