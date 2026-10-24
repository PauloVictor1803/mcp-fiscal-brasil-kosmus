# MCP Fiscal ATS — estado, operação e validação

Atualizado em 24/10/2026. Este documento distingue resultados comprovados de etapas ainda em teste.

## Estado comprovado

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

A busca NCM é uma ferramenta HTTP separada. O erro observado era a barra final: `/api/ncm/v1/?search=xampu` respondia com redirecionamento. O rascunho v52 usa servidor `https://brasilapi.com.br/api/ncm` e caminhos `/v1` e `/v1/{codigo}`. Teste direto sem seguir redirecionamento: nome xampu, nome computador e código 33051000 retornaram HTTP 200. A BrasilAPI é o intermediário consultado; não deve ser descrita como conexão direta da Tina ao Siscomex.

O rascunho também acrescenta orientação para consultar a base ATS antes de recomendar enquadramento, conferir os códigos e pedir somente o contexto determinante. Descrição de código não valida aplicação; IE isenta não define CST/CSOSN; consulta de CNPJ não distingue automaticamente Lucro Real de Presumido; CEST não determina ST; dígito da chave não confirma autorização.

Casos de regressão: NCM por nome, CEST com modalidade de venda, Simples com IE isenta e devolução de compra. Comparação da versão ativa v51 e do rascunho v52 com três repetições por caso, incluindo a regressão preexistente de IE. **Na redação inicial deste documento, os testes da Tina ainda estão em andamento e a v52 não está ativa.** Não publicar conversas, CNPJ de clientes, tickets ou configurações completas neste repositório.

## Dependências Python herdadas

A auditoria detectou versões vulneráveis no `uv.lock` do projeto Python original. O serviço MCP Node publicado não depende desse ambiente Python completo. O coletor usa dependências próprias instaladas pelo workflow.

A atualização proposta mantém FastMCP 3 e MCP 1, atualiza o lockfile e exige Python 3.11 ou superior: versões corrigidas de Pillow, Filelock e Virtualenv eliminam os fallbacks antigos de Python 3.10. A matriz de CI passa a 3.11/3.12/3.13. Isso é uma alteração de compatibilidade do pacote Python herdado, não uma mudança de hospedagem.

A aprovação depende do scanner e da CI da alteração; resolver o lockfile localmente não basta. O scanner não foi desativado e nenhuma exceção nova foi criada.

## Pendências de comprovação

- Validar o monitor executando no GitHub após integrar.
- Conferir scanner de dependências e regressões Python antes de integrar a atualização correspondente.
- Concluir comparação das evals da Tina e ativar somente se não houver regressão, sem forçar o bloqueio.
- Confirmar a próxima execução agendada com o código atualizado.
- Acompanhar a intermitência do CONFAZ em dias e horários distintos.

## Autenticação e recuperação

O MCP fiscal exige `Authorization: Bearer <valor de AUTH_TOKEN>`. Na Tina use uma referência a segredo cadastrado, nunca o token no código, issue, documentação ou prompt. Os testes desta manutenção usaram credencial local sem a publicar.

Para reverter a Tina, use a versão anterior v51 no console, respeitando a validação de ativação. Para problemas no atualizador, preserve o JSON válido, investigue os logs e reverta o commit de código pertinente; não remova validações para obter um resultado verde.
