# Changelog

## Unreleased

Correções originadas do fork de Italo9 (github.com/Italo9/mcp-fiscal-brasil),
portadas seletivamente para o repositório canônico.

### BREAKING CHANGES

* `consultar_status_sefaz` agora consulta o webservice real da SEFAZ
  (NfeStatusServico4, mTLS) em vez do proxy da BrasilAPI, e por isso passa a
  exigir certificado digital A1 configurado (`NFE_CERTIFICADO_PATH` /
  `NFE_CERTIFICADO_SENHA`). Sem certificado, a tool levanta
  `FiscalConfigurationError`; o endpoint REST `GET /v1/nfe/status-sefaz`
  responde 503 em vez de fingir sucesso com lista vazia.

### Novas funcionalidades

* consulta real de status da SEFAZ via NfeStatusServico4 (mTLS), substituindo
  o antigo proxy da BrasilAPI que retornava 404 para toda UF
* endpoint `GET /v1/fiscal/certificado/status` informa apenas
  configurado/válido/validade_fim - sem titular nem CNPJ, para não permitir
  reconhecimento de identidade em um endpoint sem autenticação - sem nunca
  expor o arquivo ou a senha do certificado
* endpoint `GET /v1/nfe/status-sefaz` consolidado, consultando as 27 UFs em
  paralelo quando nenhuma UF específica é informada, com cache em memória de
  60 segundos por UF para conter o fan-out de chamadas mTLS reais ao
  certificado do operador; falha pontual de rede em uma UF é omitida da
  resposta (sem derrubar a chamada inteira), mas certificado ausente responde
  503 e não mais lista vazia
* `POST /v1/nfe/validate` aceita conteúdo XML inline (campo `xml`), além do
  `xml_path` (caminho de arquivo) já existente
* configuração de certificado digital A1 via `NFE_CERTIFICADO_PATH`,
  `NFE_CERTIFICADO_SENHA`, `NFE_EMITENTE_CNPJ` e `NFE_AMBIENTE`; quando
  `NFE_EMITENTE_CNPJ` está definido, todo certificado carregado é conferido
  contra esse CNPJ
* nova exceção `FiscalConfigurationError` para integrações fiscais que
  exigem configuração ausente no deploy (distinta de erro de validação de
  input ou de falha do serviço externo)

### Correções

* healthcheck do Dockerfile passa a detectar automaticamente o modo do
  container (stdio vs. REST API vs. MCP HTTP/SSE), evitando falso "unhealthy"
  permanente; o servidor MCP passa a expor `GET /health` nos transportes
  http/sse (antes só existia `/mcp`, então o healthcheck sempre falhava
  nesses modos)
* `GET /v1/nfe/status-sefaz` não engole mais `FiscalConfigurationError` como
  sucesso vazio (200); certificado ausente agora responde 503 com detail
  claro. Degradação silenciosa (log + omissão da UF) fica restrita a falha
  pontual de rede (`FiscalHTTPError`)
* `GET /v1/fiscal/certificado/status` deixa de expor titular e CNPJ do
  certificado configurado (recon desnecessário em endpoint sem autenticação)

### Refatoração

* helpers de carregamento de certificado A1 e envio SOAP com mTLS
  (`carregar_pkcs12`, `criar_ssl_context_em_memoria`, `enviar_soap`)
  extraídos para `nfe/_soap_mtls.py` e compartilhados entre distribuição,
  manifestação e consulta de status
* `_endpoint_para_uf` (status_sefaz.py) passa a levantar
  `FiscalValidationError` para UF sem endpoint mapeado, em vez de
  `FiscalConfigurationError` (reservada a certificado A1 ausente)

### Notas

* Follow-up conhecido (pré-existente ao port, fora de escopo desta entrega):
  as rotas REST deste serviço não possuem autenticação nem rate limit por
  cliente. Avaliar API key e/ou rate limit por cliente em versão futura.

### Correções (CLI e Simples Nacional, 2026-09-03)

* CLI `simples` não vaza mais traceback: CNPJ válido sem opção pelo Simples/MEI (BrasilAPI responde 404) agora retorna status negativo em vez de erro; CNPJ com dígito verificador inválido de fato continua sendo rejeitado antes de qualquer chamada de rede
* nenhum subcomando do CLI (`cnpj`, `cpf`, `cep`, `simples`, `municipio`, `compliance`, `supplier`, `regimes`) vaza mais traceback: erro de negócio vira JSON estruturado no stdout com código de saída 1, erro inesperado com código 2
* corpo de resposta HTTP não-JSON de serviços externos agora vira `FiscalHTTPError` em vez de `json.JSONDecodeError` não tratado

## [0.6.0](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/compare/v0.5.1...v0.6.0) (2026-10-26)


### Novas funcionalidades

* adiciona modulo NF-e (parse, DANFE, assinatura, distribuicao, manifestacao) ([#65](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/65)) ([f7ff884](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/f7ff8842acc07ee7a376a52b8beb436a1bccbbac))
* adiciona simulador da transicao tributaria IBS/CBS (2026-2033) ([#64](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/64)) ([8d30af6](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/8d30af6cb3325ae577c48ceb607d95e206f6bf68))
* **agentic:** tools de alto nivel para agentes de IA ([#10](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/10)) ([c22e08e](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/c22e08e8506dc5c93a81fb4c23f70cf73a39aaef))
* cálculo de impostos de importação por NCM (MVP) ([#70](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/70)) ([85916e2](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/85916e23f41149d8f02d8bca3d8dead3a4df2fc2))
* circuit breaker para a NFS-e Nacional ADN ([#49](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/49)) ([#68](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/68)) ([2fa2f52](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/2fa2f52a4783eb79d12a076efb1b46f75a8fd3fc))
* **cnpj,nfe:** provedor premium opcional cpfcnpj.com.br (opt-in) ([#142](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/142)) ([10a3890](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/10a38904e157718e3fcd37afc166de132817487b))
* **core:** infraestrutura comum - HTTP client, logging, config, erros ([#8](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/8)) ([7628b07](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/7628b07cb788c0e7d562dace5d84c08a92ca226f))
* **datasources:** 8 novas fontes de dados ([#9](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/9)) ([43351ef](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/43351ef909d7b0a9320844dd39032508be8dfd94))
* **deploy:** blueprints Render.com e Fly.io + pagina de hospedagem ([#15](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/15)) ([d8cb9c5](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/d8cb9c59f1cd3aca3e9a09c6e9b2790bef8493af))
* examples, tests, robustness fixes e marketing pack ([#6](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/6)) ([24c88b5](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/24c88b5ea2aa44142a8f6fae3f230601d136ab4d))
* **interfaces:** CLI, REST API, Web UI demo e npm wrapper ([#11](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/11)) ([3710d58](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/3710d58f46f0489869b9ae26e6e3a726fb958102))
* MCP Fiscal Brasil v0.1.0 - primeiro servidor MCP para o sistema fiscal brasileiro ([8744f25](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/8744f25a041b0819fdab478daee423cc9cf69fb7))
* Onda 1 - tabelas fiscais, indexadores BCB, modulos internos expostos ([#50](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/50)) ([51e0b8f](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/51e0b8f4858c3b45309659b0a7cd39a2966c9f7a))
* Reforma Tributaria 2026 - IBS/CBS/IS, CNPJ alfanumerico, NFS-e Nacional ([#48](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/48)) ([40bdb7f](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/40bdb7f3614727b8786d0b7bb7e556d34ec2de6e))
* SDK Python - FiscalBrasil class para integracao direta em apps ([cd93596](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/cd9359617537568edd092d196ca9c1a82d326ad3))
* strengthen fiscal agent workflows ([#36](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/36)) ([2ff3be6](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/2ff3be6fe4c904f11a5047fe6dcc2ec8da901d33))
* suporte HTTP/SSE transport + smithery.yaml para publicacao ([7e06dd1](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/7e06dd143fa41377335d410857576c15470a4f0a))
* v0.1.1 - qualidade e cobertura completa ([9f1592a](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/9f1592ad70be1f389df8f3ab83e78c2ebca3066c))


### Correções

* CLI sem traceback e status do Simples sem falso erro para CNPJ não optante ([#139](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/139)) ([46ae8f2](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/46ae8f2b4a87a0cd52243e061c36f439d818be18))
* corrige case do namespace no server.json ([#58](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/58)) ([e2124de](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/e2124de09678c1373b2cc1b3daa2a486c587ce93))
* corrige ferramentas que liam endpoints de objeto como lista ([#107](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/107)) ([d055004](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/d055004f89bb0bea2505b212d39e156d624a83d1))
* corrige inversão das alíquotas de ICMS interestadual (Res. Senado 22/1989) ([#54](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/54)) ([3ca412a](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/3ca412a5a4f5970d5ececee0b18f1a4f368d25f5))
* corrige vulnerabilidades de dependências (auditoria supply chain) ([#130](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/130)) ([6bccf21](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/6bccf2123a734392953928cffb8fd05fdc877a98))
* corrigir esteira CI - lint, testes e types ([56a58ff](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/56a58ff6dc234afffe49784e85f99288dbe2811d))
* **deps:** corrige 11 vulnerabilidades do Dependabot (1 critica) ([#30](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/30)) ([40ef070](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/40ef07056500907cbd0d1e0a029298bfd5168bd2))
* encurta description do server.json para o limite de 100 chars do MCP Registry ([#31](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/31)) ([aa897a3](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/aa897a33a944a5fa087e56a1a0216d4e66cffd84))
* esteira de qualidade - security, bugs, lint, testes ([7d8cb46](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/7d8cb46dd6939970fa4f4d8e9b636a5385359be1))
* harden fiscal validation and release metadata ([#99](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/99)) ([93ec232](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/93ec2327404f04991cee035845f9d176264d8e4b))
* **i18n:** corrigir acentuação pt-BR em docs e docstrings ([#17](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/17)) ([20a2477](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/20a247746f05abfa7b217c70e120cf049ff09f6d))
* **i18n:** corrigir acentuação restante em docs pt-BR (round 3) ([#18](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/18)) ([e640926](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/e64092684f04685d64958fe1b0cbae5a256ab03b))
* parser SPED extrai valores de PIS/COFINS/ICMS ([#61](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/61)) ([#67](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/67)) ([6078b7b](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/6078b7b66c79879cda24bf8ffe9e3cde89ea315c))
* Portuguese accents in README ([cdac1a0](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/cdac1a08023b791c8bfc421c6863542490012310))
* reduz description do server.json para &lt;= 100 chars ([#57](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/57)) ([ee34f7c](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/ee34f7cc6f6df576a69682b3575b442124bb9c25))
* reimplementa consulta de status SEFAZ e porta correcoes do fork Italo9 ([#116](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/116)) ([34b648a](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/34b648ac2da35fdda288c1bda94438da3a767615))
* remove manual CodeQL workflow, use GitHub default setup instead ([b5755e0](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/b5755e01ac91d92fa790d11dab5063c6f5fd43c2))
* render do README no PyPI (imagem com URL absoluta + numero de tools) ([#80](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/80)) ([db2fd31](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/db2fd310e841076a85c5d9ac4e9a8763adce87c1))
* revisao completa de portugues em todos os textos ([3e8540f](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/3e8540f06b778ca62cc704015a63310147462945))
* sincroniza versão 0.3.1 e aguarda PyPI antes de publicar no registry ([#60](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/60)) ([792c337](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/792c337e427cd89012111d74788360ad7cdeafa3))
* valida caminhos de arquivo contra path injection (CodeQL High) ([#81](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/81)) ([be6f39e](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/be6f39e25aaa9680f7d88f32cfc67138d5988a11))
* welcome bot em pt-BR e sem comentar em bots ([#82](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/82)) ([8a47c4d](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/8a47c4de6293def59b17070c7d4f0914771e2cc3))


### Documentação

* acentuar negativas no comparativo ([#123](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/123)) ([e78917a](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/e78917a7f6845b9f1b6701a61d20856ecf5fb5c8))
* add CHANGELOG.md with release history ([7cc852a](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/7cc852a747d53d3f2649564e04e9983185df2d39))
* adiciona badge de cobertura de testes (85%) ao README ([#108](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/108)) ([fc2a086](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/fc2a086475de3f8059104594b61d79e3d31ec9ea))
* adiciona link da LinkedIn Newsletter no README ([#105](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/105)) ([ce614b6](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/ce614b652171f73c62b5acb711795a2e6c5814d0))
* alinha comandos de contribuição com CI ([#111](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/111)) ([21b46a4](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/21b46a4d737de96f05512b05808984aa56e01c2e))
* atualiza roadmap para o estado real (v0.5.x) e Star History responsivo a tema ([#106](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/106)) ([b0d3a74](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/b0d3a74e0255e2f8a145815ff533ac27fd95b9c7))
* corrige acentos no README do wrapper npm ([#112](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/112)) ([9fbb1eb](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/9fbb1ebea47a45c7cf7966a67a972d3745e7670c))
* corrige ancora de workflows no README ([#110](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/110)) ([6fbae4e](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/6fbae4e90b02b47f575719ce049627f2f2dd4d71))
* fix SPED docstring indentation ([#100](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/100)) ([42734bb](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/42734bb16e4b578c5ee8670837d4ad63eb59f8b4))
* limpa cabeçalho do README (oculta mcp-name + corrige badge de downloads) ([#103](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/103)) ([7f2981f](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/7f2981f5354cb0fe1ed315cdf0bc03a25e1c46e9))
* **marketing:** blog post de lancamento v0.2.0 (PT-BR, ~1700 palavras) ([#14](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/14)) ([abab87c](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/abab87cac8ecd2835d182f9cd3e48acbf2442d9a))
* polish pt-BR release notes ([#101](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/101)) ([c26e4d9](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/c26e4d95a779dcb19ebb0938ac10ae6b89e6ad45))
* publica checklist verificável do MCP Fiscal ([#138](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/138)) ([c0ec426](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/c0ec42609e9bb477c3f6f1fdae844d5f2ee9a2ce))
* README com uvx e snippets de instalacao para clientes MCP ([#47](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/47)) ([d01ba30](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/d01ba30057ec78d7c843c035406a1246df90221c))
* registra ativação da Tina 53, testes e pendências reais ([8fa59aa](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/8fa59aa7c89bc7c18de1d67e8cd17365344507b0))
* registra seis testes da Tina e revisa diagnóstico de IE ([8226bff](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/8226bffa6bdec968d67055baa40d8277ef1cbd3f))
* roadmap detalhado v0.2.0 (discovery fase 0) ([#7](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/7)) ([a36c089](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/a36c08983bd2b82c2fdc2c5285e146d6be7a658c))
* secao Como acompanhar (Discussions, releases, newsletter) ([#75](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/75)) ([18366f7](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/18366f7acd82f25fa4b2bceb401dfe8e24fd9104))
* site mkdocs-material com deploy automatico em GitHub Pages ([#13](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/13)) ([2068fd6](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/2068fd6ef44eef20e44c00f33e82fdc6a9916710))
* **site:** auto-geracao de referencia de API e timestamps via git ([#16](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/16)) ([121aea4](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/121aea40f82019fd86cf6277e647631a8c1b9e31))


### Integração contínua

* add CodeQL security scanning ([656cf13](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/656cf13fdcbbcbd36b7847f7135804eed3cd478a))
* add Dependabot auto-merge for minor and patch updates ([fa5a600](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/fa5a60097dfaa3cb463bfa893d79bf65c7442d84))
* add dependabot, security policy, enable delete-branch-on-merge ([b27cbf1](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/b27cbf16d343014de183b4ecee22e293f5a11695))
* add welcome bot for first-time contributors ([98f88d5](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/98f88d569d1af555e7f9c26b8d644acd809b18c1))
* adiciona auditoria permanente de supply chain (osv-scanner + dependabot) ([df13676](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/df136768d8936fb7522f70fae38894d7234abd6a))
* adiciona workflow CodeQL com workflow_dispatch para re-scan manual ([bc96ed5](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/bc96ed5bc2701079127737fcdf5c5398c916ba81))
* auto-aprovar e auto-mergear Dependabot patch/minor (vulns inclusas) ([#83](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/83)) ([c852707](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/c852707d3cd14157924600a058da2670d4f6cc7d))
* bots de triagem de issues (on-open + re-triagem semanal) ([#69](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/69)) ([51263b5](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/51263b5266b2846df3f74d725ea10d1f55e8f510))
* CodeQL focado em seguranca (security-extended) ([#85](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/85)) ([72ebaf6](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/72ebaf60f800d0cbc3bc39abbf72efc5f61f506a))
* pina actions por SHA (supply chain, CodeQL) ([#86](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/86)) ([fce7066](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/fce70663c90976d1b15d2c50027cfc537118e847))
* publica no registry oficial MCP via OIDC ([#56](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/56)) ([5322400](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/5322400c5852d3c9387a9b2b8f5c4b6f6c542b45))
* publish no PyPI via API token ([#53](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/53)) ([eb26df7](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/eb26df7971e7a529981271be302c06aef6bb0f76))
* release automatizado com release-please (Release PR + publish encadeado) ([#87](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/87)) ([1875227](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/18752278f4bd153743ff0ee32e733cf28acfbb63))
* release notes automaticas com release-drafter (motor de newsletter via GitHub) ([#79](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/issues/79)) ([26a3dda](https://github.com/PauloVictor1803/mcp-fiscal-brasil-kosmus/commit/26a3dda93578c888d76a6fd6f70fdef3c015ec4c))

## [0.5.1](https://github.com/DeHor-Labs/mcp-fiscal-brasil/compare/v0.5.0...v0.5.1) (2026-06-21)


### Documentação

* polimento das notas de release em pt-BR ([#101](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/101)) ([c26e4d9](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/c26e4d95a779dcb19ebb0938ac10ae6b89e6ad45))


### Integração contínua

* sincroniza metadados JSON no Release Please

## [0.5.0](https://github.com/DeHor-Labs/mcp-fiscal-brasil/compare/v0.4.0...v0.5.0) (2026-06-21)


### Novas funcionalidades

* cálculo de impostos de importação por NCM (MVP) ([#70](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/70)) ([85916e2](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/85916e23f41149d8f02d8bca3d8dead3a4df2fc2))
* circuit breaker para a NFS-e Nacional ADN ([#49](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/49)) ([#68](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/68)) ([2fa2f52](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/2fa2f52a4783eb79d12a076efb1b46f75a8fd3fc))


### Correções

* endurece a validação fiscal e os metadados de release ([#99](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/99)) ([93ec232](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/93ec2327404f04991cee035845f9d176264d8e4b))
* parser SPED extrai valores de PIS/COFINS/ICMS ([#61](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/61)) ([#67](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/67)) ([6078b7b](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/6078b7b66c79879cda24bf8ffe9e3cde89ea315c))
* render do README no PyPI (imagem com URL absoluta + número de tools) ([#80](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/80)) ([db2fd31](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/db2fd310e841076a85c5d9ac4e9a8763adce87c1))
* valida caminhos de arquivo contra path injection (CodeQL High) ([#81](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/81)) ([be6f39e](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/be6f39e25aaa9680f7d88f32cfc67138d5988a11))
* welcome bot em pt-BR e sem comentar em bots ([#82](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/82)) ([8a47c4d](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/8a47c4de6293def59b17070c7d4f0914771e2cc3))


### Documentação

* corrige indentação da docstring de SPED ([#100](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/100)) ([42734bb](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/42734bb16e4b578c5ee8670837d4ad63eb59f8b4))
* seção Como acompanhar (Discussions, releases, newsletter) ([#75](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/75)) ([18366f7](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/18366f7acd82f25fa4b2bceb401dfe8e24fd9104))


### Integração contínua

* adiciona workflow CodeQL com `workflow_dispatch` para reverificação manual ([bc96ed5](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/bc96ed5bc2701079127737fcdf5c5398c916ba81))
* auto-aprovar e auto-mergear Dependabot patch/minor (vulnerabilidades inclusas) ([#83](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/83)) ([c852707](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/c852707d3cd14157924600a058da2670d4f6cc7d))
* bots de triagem de issues (on-open + re-triagem semanal) ([#69](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/69)) ([51263b5](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/51263b5266b2846df3f74d725ea10d1f55e8f510))
* CodeQL focado em segurança (security-extended) ([#85](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/85)) ([72ebaf6](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/72ebaf60f800d0cbc3bc39abbf72efc5f61f506a))
* fixa actions por SHA (cadeia de suprimentos, CodeQL) ([#86](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/86)) ([fce7066](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/fce70663c90976d1b15d2c50027cfc537118e847))
* release automatizado com release-please (Release PR + publish encadeado) ([#87](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/87)) ([1875227](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/18752278f4bd153743ff0ee32e733cf28acfbb63))
* release notes automáticas com release-drafter (motor de newsletter via GitHub) ([#79](https://github.com/DeHor-Labs/mcp-fiscal-brasil/issues/79)) ([26a3dda](https://github.com/DeHor-Labs/mcp-fiscal-brasil/commit/26a3dda93578c888d76a6fd6f70fdef3c015ec4c))

## [Unreleased]

### Added

#### Cálculo de tributos de importação por NCM (módulo `importacao`)

- `calcular_tributos_importacao` - calcula a cascata completa de tributos de importação
  (II, IPI, PIS/COFINS-importação, ICMS grossed-up, AFRMM e taxa Siscomex) a partir do
  valor aduaneiro, alíquota II (TEC) informada pelo usuário, UF importadora e modal.
  Offline para IPI (banco NCM/TIPI), ICMS (tabela interna de alíquotas estaduais),
  AFRMM e Siscomex. Retorna breakdown por tributo com base, alíquota, valor, fundamento
  legal, avisos e disclaimers obrigatórios. Sem API key. Escopo MVP: fora de antidumping,
  regimes especiais, acordos bilaterais e alíquotas diferenciadas de PIS/COFINS.
- `consultar_aliquotas_importacao` - retorna a alíquota IPI do banco NCM/TIPI bundled,
  os defaults de PIS/COFINS-importação (2,1% e 9,65%, Lei 10.865/2004) e aviso sobre
  a alíquota II (TEC), que não está disponível offline e deve ser informada pelo usuário.
  Útil para conferir a alíquota IPI antes de usar calcular_tributos_importacao.

- Circuit breaker para o client da NFS-e Nacional (ADN): apos 5 falhas consecutivas,
  novas chamadas sao bloqueadas por 60 s sem tocar a API, evitando sobrecarga em
  instabilidades do servico. O estado e reset automaticamente apos o periodo de
  cooldown ou em caso de sucesso (#49).

### Fixed

- Parser SPED agora extrai corretamente os valores de PIS (M210 `VL_CONT_PER`),
  COFINS (M610 `VL_CONT_PER`) e ICMS (E110 `VL_ICMS_RECOLHER`) como valores a
  recolher do período, garantindo comparabilidade entre os três tributos (#61).

### Changed

- **BREAKING:** `summarize_sped` renomeia a chave `icms_total` de `metricas_chave`
  para duas chaves distintas, eliminando a inconsistência semântica entre bruto e
  líquido:
  - `icms_a_recolher` - `VL_ICMS_RECOLHER` (campo 13 do E110): valor líquido a
    recolher após créditos e deduções; comparável com `pis_total` e `cofins_total`.
  - `icms_total_debitos` - `VL_TOT_DEBITOS` (campo 02 do E110): total bruto de
    débitos por saídas/prestações; informativo, não deve ser somado aos demais para
    calcular carga fiscal total.

  Fonte: Guia Prático EFD ICMS/IPI, Ato COTEPE/ICMS 44/2018 (versão 018).

- **BREAKING:** `listar_registros_sped` retorna `campos` como `list[str]` (indexável
  por posição) em vez da string bruta com separadores `|`. Código que fazia
  `registro["campos"].split("|")` deve passar a usar `registro["campos"]` diretamente.

## [0.4.0] - 2026-06-20

Onda 2: modulo NF-e completo (parse, DANFE, assinatura, distribuicao, manifestacao) e
simulador da transicao tributaria IBS/CBS (Reforma Tributaria 2026-2033). Total de tools
sobe de 36 para 42.

### Added

#### Simulador da Reforma Tributaria IBS/CBS (modulo `agentic.reforma`)

- `simular_transicao_reforma_tributaria` - simula o impacto financeiro da transicao
  tributaria entre 2026 e 2033 para um produto dado. Recebe valor bruto, aliquota atual
  de PIS/COFINS/ISS/ICMS e CNAE, retorna tabela anual com aliquotas IBS/CBS por fase,
  carga tributaria comparada (atual vs. nova) e economia/custo estimado por ano.
  Sem API key, offline. Fonte: LC 214/2025 e Resolucao Comite Gestor CG-IBS n. 1/2025.

#### Normalizacao auxiliar (modulo `agentic.reforma`)

- Helpers internos `normalizar_aliquota_atual` e `normalizar_regime` para canonicalizacao
  de inputs antes do calculo - garantem que entradas em percentual (ex: 12 vs 0.12) e
  strings de regime (simples, lucro_presumido, lucro_real) sejam tratadas uniformemente.

#### Parse e DANFE offline (modulo `nfe`)

- `parse_nfe_xml` - parseia XML bruto de NF-e ou NFC-e e retorna dados estruturados
  (emitente, destinatario, itens, totais, protocolo). Sem API key, offline.
- `gerar_danfe` - gera DANFE PDF (A4, modelo 55) a partir do XML. Retorna base64.
  Sem API key, offline. Requer namespace `http://www.portalfiscal.inf.br/nfe`.
  Modelo 65 (NFC-e) nao suportado na v1.0.0 da lib brazilfiscalreport.
- `validar_assinatura_nfe` - valida assinatura XMLDSig e extrai dados do certificado
  assinante (titular, CNPJ/CPF, validade, AC emissora). Sem API key, offline.
  Suporte opcional a CA bundle PEM para validar cadeia ICP-Brasil.

#### Distribuicao e manifestacao com certificado A1 (opt-in)

- `baixar_nfe_distribuicao` - baixa documentos via NFeDistribuicaoDFe (SEFAZ) usando
  certificado A1 local (.pfx/.p12). Suporta distNSU, consNSU e consChNFe.
  O certificado nunca e enviado a servidores externos - autenticacao mTLS local.
- `manifestar_nfe` - registra manifestacao do destinatario via NFeRecepcaoEvento.
  Eventos: 210200 (Ciencia), 210210 (Confirmacao), 210220 (Desconhecimento),
  210240 (Operacao nao Realizada). Assinatura XMLDSig feita localmente.

#### Novas dependencias

- `brazilfiscalreport==1.0.0` - geracao de DANFE PDF
- `signxml>=4.5.1` - validacao e assinatura XMLDSig
- `cryptography>=48.0.1` - manipulacao de certificados X.509 e PKCS12

### Security

- Toda entrada XML externa e validada via `parse_xml()` (lxml com
  `resolve_entities=False`, `no_network=True`) antes de ser entregue a
  brazilfiscalreport, que usa `xml.etree` sem protecao XXE propria.
- Senhas de certificados A1 nunca aparecem em logs, excecoes ou disco persistente.
- Arquivos PEM temporarios criados com permissao 0600 e removidos no bloco `finally`.

## [0.3.1] - 2026-06-18

### Fixed

- Corrige `mcp-name` no README para `io.github.DeHor-Labs/mcp-fiscal-brasil` (case correto da org no GitHub), necessario para validacao de ownership no registry oficial MCP.
- Corrige namespace no `server.json` para `io.github.DeHor-Labs/mcp-fiscal-brasil`.

## [0.3.0] - 2026-06-17

Onda 1: expansao de tabelas fiscais offline, indexadores do Banco Central e exposicao
de seis novos modulos no servidor MCP. Total de tools sobe de 20 para 36.

### Added

#### Tabelas fiscais offline (modulo `tabelas`)
- `consultar_ncm` - lookup de codigo NCM na TIPI (banco SQLite bundled, offline)
- `consultar_cfop` - descricao e natureza de operacao por codigo CFOP
- `validar_cst` - validacao de Codigo de Situacao Tributaria (CST/CSOSN)
- `consultar_cest` - consulta de codigo CEST por produto
- `consultar_aliquota_icms` - aliquota interestadual ICMS/DIFAL por par de UFs
- Script `scripts/build_tabelas_db.py` para popular o banco com a TIPI completa oficial

#### Indexadores BCB (modulo `bcb`)
- `taxa_selic` - taxa Selic vigente via SGS Banco Central
- `ipca_periodo` - acumulado IPCA em intervalo de datas via SGS
- `ptax_data` - cotacao PTAX de compra/venda em data especifica via OData BCB
- `calcular_correcao_monetaria` - correcao monetaria de valor entre duas datas pelo IPCA

#### Novos modulos expostos no servidor MCP
- `cep` - `consultar_cep` via BrasilAPI (ja existia no SDK, agora exposto como tool MCP)
- `cnae` - `consultar_cnae` e `buscar_cnae` via BrasilAPI/IBGE
- `ibge` - `consultar_municipios_ibge` e `consultar_estado_ibge` via IBGE Localidades
- `mei` - `consultar_status_mei` via BrasilAPI
- `empresa` - `consultar_empresa_completa` com dados CNPJ + Simples em paralelo

#### Descriptions Glama aplicadas em todas as 16 tools novas
- Padrao: Purpose, quando usar vs nao usar, comportamento offline/online, Parameter Semantics
- Tools existentes melhoradas: `listar_cnpjs_por_nome`, `analyze_cnpj_compliance`,
  `risk_score_supplier`, `consultar_empresas_lote`

#### Metadata para registries MCP (PR #51)
- `server.json` atualizado com description rica, tags completas e campo `_meta` no
  formato do registry oficial (io.modelcontextprotocol.registry/publisher-provided)
- `pyproject.toml` com keywords expandidos para melhor discoverability no PyPI:
  `brazil`, `icms`, `simples-nacional`, `ncm`, `cfop`, `tax`, `finance`, `government`
- `smithery.yaml` com cabecalho de pitch e descriptions mais claras
- README atualizado com tagline destacando 36 ferramentas e suporte a Reforma Tributaria 2026

#### Empacotamento
- Arquivos `*.db` das tabelas fiscais incluidos no wheel via `hatch.build.targets.wheel`

### Changed

- Total de tools MCP: **36** (era 20 antes da Onda 1)
- Cobertura de testes: **327 testes** passando (era ~117 na v0.2.2)

### Fixed

- Corrige inversão das alíquotas de ICMS interestadual (Resolução do Senado Federal
  n. 22/1989): operações com origem em Sul/Sudeste exceto ES (SP, RJ, MG, PR, RS, SC)
  para destinos N/NE/CO/ES retornam 7%, e as demais retornam 12%, conforme a norma.
  O bug afetava `consultar_aliquota_icms` e o cálculo de DIFAL. (#54)
- Workflow `welcome.yml`: inputs da `actions/first-interaction@v3` corrigidos de hifens
  (`repo-token`, `issue-message`, `pr-message`) para underscores (`repo_token`,
  `issue_message`, `pr_message`), que e o padrao exigido pela v3 da action

## [0.2.2] - 2026-06-08

Release de consolidação dos fluxos agenticos fiscais e da publicação do pacote.

### Added
- `consultar_empresas_lote` para triagem em lote de fornecedores com compliance, score e erros por CNPJ.
- Documentação de posicionamento, casos de uso e catálogo agentico v0.2.x.
- Cobertura de testes para validação de NFSe, sandbox de arquivos da API e path traversal relativo.

### Changed
- Repositório, docs e metadados migrados para `DeHor-Labs/mcp-fiscal-brasil`.
- Workflows do GitHub Actions atualizados para versões mais novas de `checkout`, `setup-python`, `cache`, `first-interaction` e `dependabot/fetch-metadata`.
- Exemplos de Docker e instalação atualizados para a versão `0.2.2`.

### Fixed
- Validação de CNPJ nos endpoints REST antes de chamar serviços externos.
- Restrição de caminhos de NFe/SPED a um diretório base configurável com permissão restritiva.
- Validação de entradas NFSe e padronização do campo `numero`.
- Processamento em lote com concorrência controlada, limite de lote e logs estruturados de falha.

## [0.2.1] - 2026-05-29

### Changed

- Ajuste de consistência de release metadata entre `pyproject.toml`, `server.json` e `npm-wrapper/package.json` (todos com versão `0.2.1`).
- Corrigida a documentação de histórico de releases para incluir uma entrada de `0.2.1` com foco em alinhamento de versionamento e integridade de artefatos.

## [0.2.0] - 2026-05-20

Release focada em produzir o MCP fiscal brasileiro mais completo do mercado.

### Added

#### Fase 1 - Infraestrutura comum (`_core/`)
- HTTP client unificado (`httpx` + `tenacity` retry exponencial + `cachetools` cache pluggable + `aiolimiter` rate-limit per-host)
- Logging estruturado JSON via `structlog`
- Configuracao via `pydantic-settings` com env vars `MCP_FISCAL_*`
- Hierarquia de exceptions tipadas

#### Fase 2 - 8 novas fontes de dados
- `cnae/` - tabela CNAE da Receita
- `cpf/` - validação algoritmica offline
- `simples/` - regime Simples Nacional
- `mei/` - status MEI
- `ibge/` - municipios, UFs, códigos IBGE
- `cep/` - lookup de endereço por CEP
- `empresa/` - dados consolidados de empresa
- `certidoes/` - geracao de URLs de certidoes (CND, FGTS, CNDT)

#### Fase 3 - Tools agenticas (`agentic/`)
- `analyze_cnpj_compliance` - relatório consolidado (CNPJ + Simples + MEI + CNAE) com score 0-100 e risco classificado
- `compare_tax_regimes` - comparativo MEI/Simples/Lucro Presumido/Lucro Real com alíquota efetiva e imposto estimado
- `risk_score_supplier` - due diligence de fornecedor com recomendação (aprovar/aprovar_com_ressalvas/investigar/recusar)
- `validate_nfe_full` - validação consolidada de NFe (parse XML + chave + situação do emissor)
- `summarize_sped` - sumário executivo de arquivo SPED

#### Fase 4 - Multiplas interfaces
- **CLI** (`mcp-fiscal`) - typer com comandos cnpj, cpf, cep, simples, municipio, compliance, supplier, regimes. Flag `--json`.
- **REST API** (`mcp-fiscal-api`) - FastAPI com endpoints `/v1/*` e OpenAPI docs em `/docs`
- **Web UI demo** - rota `/` da API com pagina htmx 2.0 (CNPJ lookup, compliance, comparativo de regimes)
- **npm wrapper** (`mcp-fiscal-brasil` no npm) - TypeScript que spawna o CLI Python para uso em apps Node.js

#### Fase 5 - Docker e release
- Dockerfile multi-stage com healthcheck e usuário não-root
- docker-compose com profiles para API e MCP HTTP
- Bump v0.1.1 -> v0.2.0

### Changed
- Author corrigido para "Nikolas de Hor" (era "Nikolas DeHor")
- Modulos legados (cnpj, nfe, sped) refatorados para usar `_core`
- Suite de testes expandida para **117 testes** (era ~70)

### Quality gates
- `mypy --strict`: limpo no código novo
- `ruff check` + `ruff format`: limpos
- Cobertura: 80%+ no código novo



### Added
- 8 modules: CNPJ, CPF, NFe, NFSe, Simples Nacional, SPED, eSocial, Certidoes
- 14 MCP tools for fiscal queries via natural language
- SDK mode: FiscalBrasil class for direct Python integration
- 5 integration examples: basic, FastAPI, Django, batch validation, ERP
- NFe fallback chain: BrasilAPI -> Portal Nacional -> partial key data
- eSocial catalog expanded to 45+ events (S-1.0 complete)
- NFSe coverage expanded to 50+ municipalities (all state capitals + major cities)
- CI/CD: GitHub Actions (lint, test, publish PyPI), Docker, pré-commit
- Published on PyPI: pip install mcp-fiscal-brasil

### Fixed
- XXE vulnerability in xml_utils.py (safe parser with resolve_entities=False)
- Chave NFe validator: weights and direction corrected (SEFAZ spec right-to-left)
- HTTP client: leading slash in paths breaking httpx URLs
- FastMCP: description -> instructions (breaking change v3.1.1)
- datetime.utcnow() deprecated -> datetime.now(timezone.utc)
- 28 ruff lint errors, 5 mypy errors corrected
- Portuguese text review across all 17 source files (~530 corrections)

## [0.1.0] - 2026-03-27

### Added
- Initial release
- Project structure with 41 Python files
- Shared module: HTTP client, rate limiter, validators, XML utils
- Basic tools for all 8 fiscal modules
