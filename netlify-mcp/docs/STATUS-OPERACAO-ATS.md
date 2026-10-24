# MCP Fiscal ATS — estado, operação e validação

Atualizado em 24/10/2026. Este documento distingue resultados comprovados de etapas ainda em teste.

## Estado comprovado

- [PR 5](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/pull/5) integrado no commit `0bc64313c49f710924f601903e417a19d08150da`: monitor, dependências corrigidas e documentação.
- [Monitor em produção](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/actions/runs/40100613767): execução concluída com sucesso após a integração.
- [PR 4](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/pull/4) integrado no commit `7b9b2b6627dbedaee101fc80ffcefdc5e092dc60`.
- [Atualização após a integração](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/actions/runs/40099628869): quatro fontes coletadas e validadas, 15 testes Node aprovados. Nesta execução os documentos vieram do cache do Worker; isso não é prova de uma nova conexão à origem.
- [Execução agendada anterior à integração](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/actions/runs/40097967448): sucesso. Confirma o agendamento existente, mas ainda não uma execução agendada com todas as alterações posteriores.
- [Reconstrução estrita sem cache](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/actions/runs/40097169681): quatro fontes aprovadas; MOC recuperado na segunda tentativa após erro de origem 522. Uma medição adicional do MOC falhou; não houve disponibilidade contínua em todos os probes.
- Teste HTTP de produção após o merge: CFOP 5102, CEST xampu/NCM 33051000/venda comum e CSOSN 102 responderam com referência 2026-10-24. Chave NF-e retornou formato e dígito válidos, sem alegar autorização.
- Dados publicados: CFOP 619; CEST 1052; CST ICMS 20; CSOSN 10; origens 9; IPI 14; PIS 33; COFINS 33.

## Arquitetura e limites

GitHub Actions coleta e reconstrói o JSON. Cloudflare Workers é uma ponte para quatro URLs oficiais fixas; o placement configurado é AWS sa-east-1 e o cabeçalho observado foi remote-GRU. O MCP continua hospedado na [Netlify](https://ats-fiscal-mcp-kosmus.netlify.app/mcp), sem Docker. Não houve migração do MCP nem novo deploy Netlify nesta manutenção.

O atualizador tenta cada fonte até três vezes e registra HTTP, bytes, hash, duração, cache e diagnóstico de origem. Todas as fontes são relatadas antes de abortar. Só substitui o JSON após coleta e validação completas; erro não publica tabela parcial. O runtime verifica a referência remota a cada hora e preserva a última válida se a atualização falhar.

A causa exata dos erros intermitentes do CONFAZ permanece desconhecida. Houve erro de conexão 522 em MOC e CEST. Não está comprovado bloqueio geográfico nem bloqueio geral de datacenters. A aplicação contorna algumas falhas com retentativas; não corrige a infraestrutura do CONFAZ.

## Fontes e cache

| Fonte | URL |
|---|---|
| CEST | https://www.confaz.fazenda.gov.br/legislacao/convenios/2018/CV142_18 |
| CFOP | https://www.confaz.fazenda.gov.br/legislacao/ajustes/sinief/cfop_cvsn_1-6.24/ |
| ICMS/CSOSN/origens | https://www.confaz.fazenda.gov.br/legislacao/ajustes/sinief/cvsn_70 |
| IPI/PIS/COFINS no MOC | https://www.confaz.fazenda.gov.br/legislacao/arquivo-manuais/moc7-anexo-i-leiaute-e-rv.pdf |

Cache API do Worker: uma hora. HIT preserva a data original da coleta e distingue os dados históricos dos dados da chamada atual. MISS do Worker não prova nova transferência da origem: consulte também o status CDN. Ausência do cabeçalho CDN significa informação desconhecida.

Use `--sem-cache` apenas no diagnóstico estrito: exige BYPASS do Worker e status CDN compatível. Não compare hashes como única regra de validade: uma alteração legítima do governo pode mudar o hash; os parsers e testes precisam continuar passando.

## Rotina e monitoramento

Atualização diária: cron UTC `23 9 * * *` (06h23 de Brasília). GitHub pode atrasar horários agendados.

O monitor roda após a atualização, por disparo manual, após alteração de seu código e diariamente às 12h47 de Brasília. Abre uma única issue automática após:
- três execuções concluídas consecutivas sem sucesso;
- mais de 72 horas sem execução bem-sucedida;
- referência documental inválida, futura ou com mais de três dias.

Atualiza a mesma issue sem comentários repetitivos e a fecha após recuperação. Não envia mensagens externas por Slack ou e-mail. As notificações dependem das preferências de acompanhamento do GitHub. Se o próprio GitHub suspender todos os workflows, o monitor também pode parar; não é um watchdog independente.

Uma execução bem-sucedida sem mudança de conteúdo pode não criar commit: isso é normal. O monitor verifica tanto o último sucesso do workflow quanto a referência do JSON. Alterar apenas o monitor não dispara reconstrução nem deploy na Netlify.

## Como testar e investigar

```sh
python scripts/test_coleta_oficial.py
node --test netlify-mcp/test/mcp.test.js cloudflare-fontes/worker.test.js scripts/monitorar_coleta.test.cjs
python scripts/diagnosticar_fontes.py
python scripts/atualizar_tabelas_oficiais.py --fontes-dir /tmp/fontes-oficiais --download --via-cloudflare --sem-cache
```

O diagnóstico consulta individualmente as quatro fontes e faz probes adicionais do MOC. O status do workflow distingue falha da rodada inicial e falha observacional adicional. Leia também o artefato `diagnostico-fontes`.

Em falha persistente, confira fonte, status de origem, bytes, remote-GRU, cache e horário. Não substitua dados por amostras nem atualize a data de referência sem coleta e validação.

## Tina: NCM e fundamento fiscal

A conexão do MCP fiscal à Tina já existe. O prefixo é `fiscal_ats`; os nomes originais das quatro ferramentas permanecem compatíveis.

A busca NCM é uma ferramenta HTTP separada. O erro observado era a barra final: `/api/ncm/v1/?search=xampu` respondia com redirecionamento. A versão ativa v53 usa servidor `https://brasilapi.com.br/api/ncm` e caminhos `/v1` e `/v1/{codigo}`. Teste direto sem seguir redirecionamento: nome xampu, nome computador e código 33051000 retornaram HTTP 200. A BrasilAPI é o intermediário consultado; não deve ser descrita como conexão direta da Tina ao Siscomex.

A versão ativa também acrescenta orientação para consultar a base ATS antes de recomendar enquadramento, conferir os códigos e pedir somente o contexto determinante. Descrição de código não valida aplicação; IE isenta não define CST/CSOSN; consulta de CNPJ não distingue automaticamente Lucro Real de Presumido; CEST não determina ST; dígito da chave não confirma autorização.

Casos de regressão: NCM por nome, CEST com modalidade de venda, Simples com IE isenta e devolução de compra. Comparação da antiga v51 com a v53 em três repetições por caso, incluindo a regressão preexistente de IE: v51 aprovou 2/5; v53 aprovou 3/5, com `piorou=false` no console. NCM, CEST e Simples/IE isenta passaram nas três repetições. A v53 foi ativada em 24/10/2026 às 14h04 UTC, sem forçar bloqueio, e a leitura posterior confirmou a versão ativa. A avaliação de IE de fornecedor e a de devolução de compra continuam reprovadas; não são consideradas resolvidas. Os exemplos de devolução consultaram a base, mas a avaliação continuou reprovando, portanto é necessário revisar tanto as evidências operacionais quanto o critério do avaliador. O exemplo de IE ainda antecipou preenchimento de zeros: exige correção específica na base/orientação. Não publicar conversas, CNPJ de clientes, tickets ou configurações completas neste repositório.

## Dependências Python herdadas

A auditoria detectou versões vulneráveis no `uv.lock` do projeto Python original. O serviço MCP Node publicado não depende desse ambiente Python completo. O coletor usa dependências próprias instaladas pelo workflow.

A atualização proposta mantém FastMCP 3 e MCP 1, atualiza o lockfile e exige Python 3.11 ou superior: versões corrigidas de Pillow, Filelock e Virtualenv eliminam os fallbacks antigos de Python 3.10. A matriz de CI passa a 3.11/3.12/3.13. Isso é uma alteração de compatibilidade do pacote Python herdado, não uma mudança de hospedagem.

Validação no GitHub: [CI](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/actions/runs/40100439933) passou em Python 3.11/3.12/3.13, com 688 testes por execução, lint, formatação e tipos. O job fiscal ATS passou em quatro testes Python e 20 Node. [Auditoria OSV](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/actions/runs/40100439945) passou: 151 pacotes examinados, quatro vulnerabilidades filtradas pelas exceções herdadas, sem novos alertas não excepcionados. Isso não significa ausência absoluta de vulnerabilidades. CodeQL e Netlify MCP também passaram. A CI e auditoria da main passaram novamente após integrar. O scanner não foi desativado e nenhuma exceção nova foi criada.

## Pendências de comprovação

- Corrigir a orientação preexistente de IE de fornecedor; não completar zeros por suposição.
- Investigar a reprovação da avaliação de devolução de compra, conferindo a aderência da resposta às páginas recuperadas e a qualidade do critério.
- Confirmar a próxima execução agendada com o código atualizado.
- Acompanhar a intermitência do CONFAZ em dias e horários distintos.

## Instrução contábil solicitada

A instrução completa aplicada está em [INSTRUCAO-FISCAL-TINA.md](INSTRUCAO-FISCAL-TINA.md). O trecho final foi solicitado expressamente pelo Paulo:

> Responda de forma breve e reafirme que a orientação fornecida não substitui nem dispensa a confirmação com a contabilidade da empresa antes da emissão ou alteração fiscal.

## Workflow auxiliar herdado

`Release Please` permanece falhando porque a configuração do GitHub não permite que Actions crie ou aprove pull requests. É uma automação de releases do pacote Python original, separada da coleta e do MCP. A permissão da conta não foi alterada e nenhum pacote foi publicado como parte desta manutenção. Mensagens de commits fora de Conventional Commits também aparecem nos logs, mas o erro fatal observado é a permissão de criação de PR.

## Autenticação e recuperação

O MCP fiscal exige `Authorization: Bearer <valor de AUTH_TOKEN>`. Na Tina use uma referência a segredo cadastrado, nunca o token no código, issue, documentação ou prompt. Os testes desta manutenção usaram credencial local sem a publicar.

Para reverter a Tina, use a versão anterior v51 no console, respeitando a validação de ativação. Para problemas no atualizador, preserve o JSON válido, investigue os logs e reverta o commit de código pertinente; não remova validações para obter um resultado verde.
