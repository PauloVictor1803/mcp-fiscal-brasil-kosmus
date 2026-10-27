# Entrega fiscal ATS de 26/10/2026

Documentação consolidada em 27/10/2026. Os testes e tempos abaixo foram obtidos em 26/10; não representam nova execução em 27/10.

## Atualização de 27/10/2026: teste real da Tina 68

A configuração 68 ativa foi lida e validada sem erros: servidor fiscal_ats com as seis ferramentas e skill fiscal com o bloco ICMS. Após autorização específica do Paulo, foram executados quatro cenários, uma vez cada. Todos usaram a ferramenta; o avaliador aprovou 2/4. O custo total informado foi US$ 0,00780635, sem 504. As respostas visíveis dos dois casos reprovados parecem atender ao objetivo, mas a causa das notas não foi determinada. Não houve repetição paga nem mudança de configuração. Leia as [evidências e ressalvas dos testes](TESTES-ICMS-TINA-68-2026-10-27.md).

As seções seguintes descrevem a entrega inicial de 26/10; suas pendências de confirmação e ausência de teste pago eram o estado daquela entrega e foram parcialmente superadas pela verificação acima.

## O que foi entregue

| Item | Estado comprovado nesta entrega |
|---|---|
| `correlacionar_dados_fiscais` | Publicada no MCP. Reúne candidatos de CEST e confere códigos já obtidos no atendimento ou na base ATS. |
| `consultar_aliquota_icms` | Publicada e testada por HTTP, com matriz manual TaxGroup/ATS 2026. |
| Tabela editável | Excel e CSV com 27 origens, 27 destinos e 729 percentuais da imagem enviada pelo Paulo. |
| Manutenção de ICMS | Manual. Não há raspagem ou sincronização automática com a TaxGroup. |
| Prompt e skill da Tina | Textos entregues ao Paulo para aplicação manual. Sua gravação e ativação finais não foram confirmadas pelo agente. |
| Testes de atendimento pagos | Não executados nesta entrega. Os testes comprovados são de código e do endpoint MCP. |

Endpoint: `https://ats-fiscal-mcp-kosmus.netlify.app/mcp`.

Painel de testes: `https://ats-fiscal-mcp-kosmus.netlify.app/`.

Deploy ICMS: `6adfbee638138a4fa9219ca3`. Código e documentação registrados no [PR #8](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/pull/8). Publicar pela CLI da Netlify não integra automaticamente esse PR na main.

## Ferramentas disponíveis no MCP

1. `consultar_cfop`: descrição de um código informado.
2. `validar_chave_nfe`: formato e dígito; não consulta autorização.
3. `validar_cst`: consulta a tabela de ICMS, CSOSN, IPI, PIS ou COFINS.
4. `consultar_cest`: pesquisa por código, NCM ou descrição, inclusive aproximação.
5. `correlacionar_dados_fiscais`: reúne consultas de candidatos e códigos.
6. `consultar_aliquota_icms`: referência geral de um par origem/destino.

O prefixo visto pela Tina depende do nome do servidor. No servidor `fiscal_ats`, a última ferramenta aparece como `fiscal_ats_consultar_aliquota_icms`.

## Correlação fiscal: objetivo e limite atual

Paulo esclareceu que a correlação pretendida tem como foco CFOP, CST, CSOSN e CST de PIS/COFINS, considerando a operação, o regime e os dados documentados. NCM e CEST são complementares.

A implementação publicada confere códigos já levantados e reúne seus resultados. Ainda não escolhe automaticamente as combinações habituais para uma operação. Essa evolução contextual ficou para validação futura. Não criar uma sequência fixa CFOP → CST → CSOSN → PIS/COFINS.

Por particularidade do Resulth, algumas rotinas podem solicitar CST para empresas do Simples Nacional ou CSOSN para Regime Normal. Consultar a documentação da tela para identificar a finalidade do campo; a presença de ambos não comprova que ambos componham o XML. Preservar os zeros e o formato documentado, como `090`, não `09`.

Detalhes: [CORRELACAO-FISCAL.md](CORRELACAO-FISCAL.md).

## Referência manual de ICMS

A matriz inicial preserva os percentuais da imagem TaxGroup fornecida pelo Paulo, associada à [página de ICMS 2026 da TaxGroup](https://www.taxgroup.com.br/intelligence/tabela-icms-2026-fique-por-dentro-das-aliquotas-estaduais-atualizadas/). Não se certificou a vigência jurídica de cada valor nas 27 legislações estaduais.

A ferramenta recebe `uf_origem`, `uf_destino`, `ano` opcional e `origem_mercadoria` opcional. O ano padrão é o corrente em Brasília. Retorna somente o par solicitado, percentual, ano de referência, fonte, data do registro e avisos.

- Ano diferente da referência disponível: não devolve percentual de outro ano.
- Mercadoria importada: alerta que a regra específica não está contemplada; não aplica 4% automaticamente.
- Consulta interna: avisa que o percentual pode incluir fundo estadual, sem separar ICMS e FCP. Não usar o total como `pICMS` automaticamente nem adicionar FCP em duplicidade.
- Não define base, redução, ST, DIFAL, benefício fiscal ou enquadramento. A alíquota retornada não comprova base de 100%.
- A consulta manual não chama o CONFAZ. A rotina de atualização das demais tabelas oficiais permanece independente; não houve nova coleta completa dessas fontes nesta entrega.

### Como o Paulo atualiza no Excel

1. Abra o arquivo `tabela-icms-2026.xlsx` entregue na conversa.
2. Na aba `ICMS 2026`, a origem fica na coluna A, o destino na linha 8 e os dados em `B9:AB35`. MG → SP fica em `Z21`.
3. Edite as células como percentuais: por exemplo, digite `19,5%`.
4. Atualize o ano em `B2` e a fonte quando houver nova referência. Alterar somente o ano não valida os valores.
5. Salve e envie a planilha para manutenção do MCP. Não precisa operar Netlify ou GitHub.

Salvar o Excel não altera o site. O responsável converte os percentuais do Excel em pontos percentuais no CSV, confere as 729 células, atualiza os metadados, gera o JSON, testa e publica. No Excel, 19,5% é armazenado como 0,195; no CSV do repositório, o valor é 19,5. Não há sincronização automática entre esses arquivos e a hospedagem.

Não é necessário esperar a virada do ano se uma alteração conhecida ocorrer antes. Leia o fluxo técnico em [ICMS-REFERENCIA-MANUAL.md](ICMS-REFERENCIA-MANUAL.md).

## Configuração na Tina e erros identificados

Manter apenas um servidor com o nome `fiscal_ats`. Para adicionar as novas ferramentas, ampliar o filtro do cadastro existente:

```text
Nome: fiscal_ats
URL: https://ats-fiscal-mcp-kosmus.netlify.app/mcp
Cabeçalho: Authorization
Valor: Bearer {{segredo:MCP_FISCAL_TOKEN}}
Filtro: consultar_cfop, validar_chave_nfe, validar_cst, consultar_cest, correlacionar_dados_fiscais, consultar_aliquota_icms
```

`MCP_FISCAL_TOKEN` deve existir em Segredos no Console, com o mesmo valor do `AUTH_TOKEN` da Netlify. Nunca gravar o valor real em documentação, prompt ou GitHub.

Erros observados nas capturas e orientações fornecidas:

- Cadastro novo sem cabeçalho e com `fiscal_ats` no filtro: configurar autenticação; o filtro recebe nomes de ferramentas sem prefixo, não o nome do servidor.
- `Value error, mcp: nome repetido ['fiscal_ats']`: remover o cadastro duplicado e usar somente o original com o filtro ampliado.
- Após ajustar, testar a conexão e salvar/ativar a configuração no Console. O teste de conexão listar ferramentas não comprova que elas foram usadas em atendimento.

Os textos a seguir foram entregues para aplicação manual pelo Paulo. O agente não os gravou no Console nem confirmou a configuração final. A tentativa de leitura autenticada da Tina nessa rodada retornou HTTP 401; não foi confirmada versão ativa. O endpoint fiscal é outro serviço e sua autenticação passou nos testes descritos abaixo.

## Texto entregue para o prompt

Substituir apenas o parágrafo fiscal em “Ferramentas disponíveis”. Preservar as instruções existentes para CNPJ/IE, status SEFAZ e consulta NCM.

```text
Para dúvidas sobre NCM, CEST, CFOP, CST/CSOSN, IPI, PIS, COFINS, alíquotas ou base de cálculo, carregue a skill orientacao-fiscal com load_skill antes de orientar. Combine a base de conhecimento com as ferramentas fiscais e reutilize os dados e consultas já disponíveis no atendimento.
```

## Texto entregue para a skill orientacao-fiscal

Acrescentar antes de “CHAVE NF-e/NFC-e”, preservando as demais seções:

```text
ALÍQUOTA GERAL DE ICMS POR ORIGEM E DESTINO

Para consultar uma referência geral de ICMS, use fiscal_ats_consultar_aliquota_icms, informando uf_origem e uf_destino. Aproveite a UF do emitente no cadastro e confirme somente o destino que faltar. Não confunda a UF da própria empresa com a do fornecedor ou destinatário.

Para uma pergunta apenas sobre a alíquota geral entre UFs, não exija NCM, regime ou outros dados sem necessidade. Se a dúvida envolver o tratamento específico do produto ou da operação, consulte também a base técnica pertinente.

A ferramenta usa uma tabela manual de referência de 2026. Ela não acompanha automaticamente mudanças na legislação. Respeite o ano informado no retorno. Se não houver referência para o ano da operação, explique a limitação e não reutilize outro ano por suposição.

Apresente o percentual como referência geral, sem afirmar que seu uso está validado para aquela operação. Exemplo: “Normalmente, na regra geral de MG para SP, a referência interestadual é 12%. Confirme com a contabilidade se ela se aplica ao seu produto e à sua operação antes de emitir.”

Nas consultas internas, alguns percentuais podem incluir adicional de fundo estadual. Se o retorno indicar que ICMS e FCP não estão separados, não oriente a lançar o total como alíquota de ICMS nem a somar novamente o FCP.

A tabela não contempla a regra específica de importados nem determina redução de base, ST, DIFAL ou benefícios fiscais. Não deduza que a base é 100% a partir da alíquota retornada. Nas devoluções, siga a documentação da operação e confira os dados do item na nota original, considerando a proporcionalidade quando parcial.

A orientação fornecida não substitui nem dispensa a confirmação com a contabilidade antes da emissão ou alteração fiscal.
```

A [skill completa sugerida](ORIENTACAO-FISCAL-SUGERIDA-2026-10-26.md) preserva as demais seções fornecidas pelo Paulo e inclui este acréscimo.

Esse bloco continua válido depois de remover o servidor duplicado, desde que o único servidor mantido se chame `fiscal_ats` e exponha `consultar_aliquota_icms`.

## Publicação, testes e eficiência observada

O deploy Netlify `6adfbee638138a4fa9219ca3` foi validado em 26/10/2026. Commit inicial do PR #8: `915ca177f476816c3920a9d7f32d7633ac862723`.

- 17 testes do MCP aprovados, incluindo as 729 combinações, ano sem referência, importados, FCP, dados inválidos e regressões das ferramentas anteriores.
- 31 testes locais aprovados na verificação ampliada, incluindo a ponte Cloudflare e o monitor de coleta. Esses testes locais não comprovam uma nova coleta real nas fontes oficiais.
- 11 consultas no endpoint publicado aprovadas: seis cenários ICMS e cinco regressões, uma por ferramenta anterior. Adicionalmente, HTTP 401 sem token e rejeição de UF inválida foram conferidos.
- ICMS: ida e volta HTTP de 169–186 ms, JSON-RPC de 571–908 bytes. Medição pontual, sem garantia de latência e sem estimativa de tokens da Tina. A matriz inteira não entra na resposta.
- Não houve teste pago de modelo nem comprovação do comportamento da Tina com essa nova configuração. Hospedagem e requisições continuam consumindo os recursos do plano; não confundir ausência de chamadas de modelo com hospedagem sem consumo.

## Decisões e pendências

- Não implementar raspagem automática da TaxGroup: a página pode mudar e a atualização dependeria da revisão editorial da fonte. Preferiu-se uma referência manual de fácil edição.
- IBPT não foi adicionado. A estimativa de tributos para transparência ao consumidor não resolve, por si só, a alíquota operacional e o percentual de base numa venda.
- Deixar a correlação contextual CFOP/CST/CSOSN/PIS/COFINS para validação futura.
- Confirmar no Console o filtro, os textos e a versão ativa após as edições do Paulo.
- Em testes de atendimento, inspecionar o histórico para comprovar o uso da ferramenta; uma resposta plausível não comprova consulta ao MCP.
- Uma rodada automatizada que chame modelos exige autorização de escopo e custo conforme a skill de manutenção da Tina. Nenhum novo lote pago foi iniciado.
- Não incluir tokens, credenciais, CNPJ de clientes ou conversas de terceiros nas evidências públicas.
