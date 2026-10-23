# ATS Fiscal MCP — piloto Netlify, sem Docker

Node.js 22+, sem dependências de produção. O servidor Python original permanece
no repositório. Nenhuma conexão foi configurada na Tina e nenhum deploy foi feito.

## Estado atual após auditoria de dados

**Só `validar_chave_nfe` está disponível.** A implementação das outras três
ferramentas existe, mas CFOP, CST/CSOSN e CEST foram retiradas de `tools/list` e
chamadas diretas são recusadas. A auditoria encontrou descrições incorretas e
cobertura incompleta no snapshot herdado do fork.

Veja [a auditoria e os exemplos oficiais](docs/AUDITORIA-TABELAS.md).
A validação do protocolo não certifica a correção fiscal dos dados.
A consulta NCM do Siscomex existente está fora deste projeto e deve ser preservada.

## Executar e testar

Na pasta `netlify-mcp`:

```sh
npm test
npm start
```

Abra http://127.0.0.1:8787 para o painel de teste ou conecte
http://127.0.0.1:8787/mcp com um cliente MCP Streamable HTTP.
O painel só habilita o validador de chave. O token digitado não é persistido.

## Publicar o piloto na Netlify

Importe a branch do fork e use o `netlify.toml` da raiz. A base é `netlify-mcp`;
somente `public/` é publicada. Configure `AUTH_TOKEN` no painel da Netlify com
valor longo e aleatório; o endpoint público falha fechado se não houver segredo.
Não versione o token. URL esperada: `https://<nome-do-site>.netlify.app/mcp`.
Nenhum Docker, certificado digital ou API paga é exigido pelo validador.
O plano gratuito continua sujeito aos limites da Netlify.

## Validador disponível

Parâmetro `chave`: string com 44 dígitos, aceitando espaços entre grupos.
Confere formato numérico e dígito verificador; não consulta autorização, situação
fiscal, validade de CNPJ, assinatura ou existência de nota na SEFAZ.
Não retorna a chave, CNPJ ou demais dados extraídos ao modelo.

```json
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"validar_chave_nfe","arguments":{"chave":"35240112345678000195550010000001231000000011"}}}
```

A chave acima é um vetor de teste do upstream, não evidência de nota autorizada.

## Economia de contexto

- Catálogo anuncia somente ferramentas cujos dados podem ser usados.
- Descrições curtas e nenhuma instrução global extensa.
- Um bloco de resultado por chamada, sem duplicação entre texto e JSON.
- Tabelas, auditoria, hashes e documentação não são enviados ao modelo.
- Os testes mantêm limites de 3 KB para catálogo e 1,2 KB para respostas.
  Bytes não são tokens; consumo real depende do modelo e da plataforma.

Antes da auditoria, o catálogo com quatro ferramentas tinha 1.931 bytes e as
respostas de dados até 291 bytes. Essas medidas comprovavam tamanho, não correção
fiscal, e não devem ser usadas como aprovação das tabelas.

## Retomar as consultas de tabelas

As tabelas em `data/tabelas.json` são evidência do snapshot reprovado, não dados
aprovados para consulta. O CEST possui 51 registros de amostra. A auditoria também
identificou divergências de CFOP e lacunas em CST ICMS. CSOSN, IPI e PIS/COFINS não
foram certificados por contagem de códigos ou por testes do transporte.

É necessário substituir/revisar os dados em fontes oficiais, verificar vigências
e registrar essa conclusão antes de `metadata.validacao` receber `aprovada`.
Não basta mudar o marcador. Reexportar o fork com o script abaixo gera estado
`pendente`, que mantém o bloqueio.

```sh
python scripts/export_netlify_tables.py
```

A implementação planejada exige `tributo` em consultas CST e não tenta adivinhar
entre ICMS, CSOSN, IPI, PIS ou COFINS. Também não escolhe enquadramento tributário.

## Transporte e autenticação

Streamable HTTP sem sessões, respostas JSON, versões 2025-03-26, 2025-06-18 e
2025-11-25. GET/SSE e DELETE retornam 405; notificações aceitas retornam 202 vazio.
POST exige `Content-Type: application/json` e
`Accept: application/json, text/event-stream`. Corpo limitado a 8 KB.
Autenticação via `Authorization: Bearer <AUTH_TOKEN>`.
Origin só pode ser o próprio domínio ou constar em `ALLOWED_ORIGINS`, separadas
por vírgulas. Chamadas servidor-a-servidor podem omitir Origin.

## Licença

Lógica e tabelas adaptadas do MCP Fiscal Brasil, Copyright (c) 2026 Nikolas DeHor.
Licença MIT preservada em `../LICENSE`; a licença do código não certifica os dados.
