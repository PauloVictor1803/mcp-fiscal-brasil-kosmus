# Painel de consultas ATS Fiscal — 28/10/2026

## Entrega

Nova interface local para as seis ferramentas já existentes. HTML, CSS e JavaScript nativos, sem dependências de interface, fontes externas ou serviços de IA. O transporte continua usando o endpoint relativo `/mcp` e a autenticação Bearer existente.

- Navegação entre ICMS, CFOP, CEST, CST/CSOSN, chave NF-e/NFC-e e conferência conjunta.
- Campos específicos para cada consulta; CEST por descrição com NCM opcional, NCM ou código.
- Cartões de resultado, códigos, candidatos, fonte, referência e avisos. O JSON completo continua disponível e pode ser copiado.
- Estados de carregamento, retorno vazio de busca, referência anual indisponível, erro de entrada e falha de acesso/conexão.
- Diálogo de token com mostrar/ocultar e teste de conexão. O token não é gravado em storage, cookies, URL ou arquivos; fica somente na página aberta e no cabeçalho da requisição.
- Layout de desktop e celular, foco de teclado e suporte à preferência de movimento reduzido.

## Arquivos

- `public/index.html`: estrutura e diálogos.
- `public/styles.css`: apresentação e responsividade.
- `public/app.js`: formulários, chamadas MCP e apresentação dos resultados.
- `dev.js`: servidor de desenvolvimento, ajustado para servir o CSS.

Nenhuma regra tributária ou resposta do backend foi alterada. O ICMS continua usando a matriz manual de 2026. Os avisos de referência desatualizada são exibidos conforme o retorno real da ferramenta; não são ocultados pela interface. Não foi realizada publicação em produção nem migração de hospedagem nesta entrega.

## Como visualizar

Na pasta `netlify-mcp`, execute `npm start` com Node.js 22 ou superior. A URL padrão é `http://127.0.0.1:8787`. Na sessão de revisão foi usada a porta 8791.

O servidor local aceita testes sem token quando AUTH_TOKEN não estiver configurado e estiver acessível apenas por loopback, conforme a regra já existente. Isso não deve ser usado como configuração de produção. A migração para servidor ATS depende da configuração do serviço Node, domínio, TLS, autenticação e proxy reverso; não está concluída por esta alteração visual.

Para manter a interface em outro servidor, sirva os três arquivos de `public/` e encaminhe `/mcp` ao backend existente, no mesmo domínio. Nenhum endereço da Netlify foi inserido no frontend. O backend mantém suas configurações próprias e deve ser revisado separadamente na migração.

## Validação executada

- `node --check public/app.js`: passou.
- Suíte existente `npm test`: 17 testes passaram, zero falhas.
- Conferência no navegador com backend local real: seis ferramentas; MG → SP com referência 12%; recusa de tabela de 2027; CFOP 5.102; CEST por descrição e por código; CST 000; validação de chave com DV divergente e exemplo fictício com DV correto; conferência conjunta de produto/NCM/CFOP; teste de conexão com seis ferramentas disponíveis.
- Layout de celular em 390 × 844: largura do documento conferida sem transbordamento horizontal; navegação horizontal própria da lista de ferramentas.
- Capturas de revisão em `outputs/painel-fiscal/painel-desktop.png` e `painel-mobile.png` no workspace.

Os testes da interface foram consultas locais, sem chamadas pagas aos modelos da Tina.

## Ícone do painel fiscal
Adicionado public/fiscal-icon.png no cabeçalho e favicon. Imagem com transparência gerada usando image_gen. Prompt: documento geométrico com símbolo de porcentagem, verde #127565, detalhe #d5ecab, sem fundo, sem emoji, sem sombras. A prévia local serve o PNG com image/png. Sem alteração nas consultas ou autenticação.

## Manual para IA
Disponível em public/INSTRUCOES_AGENTE.md, com visualização, cópia e download no painel. Ao migrar, servir todos os arquivos de public/, incluindo CSS, JavaScript, PNG e Markdown.
