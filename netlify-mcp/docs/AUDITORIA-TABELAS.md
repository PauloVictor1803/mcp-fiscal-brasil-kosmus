# Auditoria dos dados do piloto — 23/10/2026

**Resultado: snapshot reprovado para respostas fiscais em produção.**

A validação anterior confirmou transporte MCP, empacotamento e limites de tamanho.
Ela não confirmou a correção das tabelas herdadas. A contagem de registros e o
marcador de cobertura parcial eram insuficientes para atestar sua qualidade.

## Achados confirmados

| Item | Snapshot do fork | Documento oficial |
| --- | --- | --- |
| CEST 01.007.00 | Eixos com diferencial para veículos automotores | Juntas, gaxetas e outros elementos com função semelhante de vedação |
| CFOP 1.403 | Aquisição de serviço de transporte por estabelecimento industrial | Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária |
| CST ICMS | Não contém sufixos 02, 15, 53 e 61 | A documentação de tributação monofásica inclui esses CSTs |

Fontes oficiais consultadas:

- [CONFAZ — Convênio ICMS 142/18, anexos CEST](https://www.confaz.fazenda.gov.br/legislacao/convenios/2018/CV142_18)
- [CONFAZ — Ajuste SINIEF 03/24, CFOP](https://www.confaz.fazenda.gov.br/legislacao/ajustes/2024/AJ003_24)
- [CONFAZ — NT 2023.01, perguntas e respostas](https://www.confaz.fazenda.gov.br/tributacao-monofasica/nt-2023-01-perguntas-e-respostas.pdf)

## Cobertura documental

O snapshot contém 51 CEST. A extração do documento oficial identificou 1.046 códigos
CEST distintos, incluindo textos históricos: esse total **não é uma contagem de
códigos vigentes**. As 51 descrições locais diferem textualmente de todas as versões
localizadas para seus códigos. Divergência textual não significa, por si só, erro
semântico; os exemplos acima foram conferidos diretamente.

No CFOP, 194 das 404 descrições do snapshot diferem do texto consultado. A extração
encontrou 695 identificadores no documento, incluindo grupos e referências
históricas; não se declara que sejam 695 CFOP operacionais vigentes.
O Ajuste 03/24 é uma referência de 2024 e não substitui a conferência das alterações
posteriores. O catálogo do Portal NF-e anuncia atualização de CFOP em 04/09/2026;
o acesso automatizado ao arquivo completo encontrou redirecionamentos repetidos.

CSOSN, IPI e PIS/COFINS não receberam certificação de vigência nesta auditoria.
Não são considerados aprovados só porque a quantidade de códigos parece plausível.

## Medida aplicada

As três consultas de tabelas deixam de ser anunciadas em `tools/list` e suas
chamadas diretas são recusadas enquanto os metadados não indicarem aprovação.
O snapshot é conservado como evidência, marcado `validacao: reprovada`.
Reexportar o fork restaura estado `pendente`, que também mantém o bloqueio.
Só o validador matemático de chave NF-e/NFC-e permanece disponível.

Não houve deploy na Netlify nem alteração na Tina. O NCM não integra este piloto;
preservar a consulta Siscomex já existente. Os NCMs associados ao CEST no snapshot
não são uma fonte alternativa de cadastro NCM e não devem ser usados como tal.

## Para liberar as consultas

1. Substituir os dados herdados por fonte oficial com documento e data de referência.
2. Resolver redações históricas, códigos revogados e início/fim dos efeitos.
3. Conferir códigos, descrições e vínculos CEST/NCM, preservando posições NCM
   parciais quando a fonte as utilizar; não expandir por inferência.
4. Conferir separadamente ICMS, CSOSN, IPI, PIS e COFINS.
5. Registrar revisão e repetir testes de conteúdo antes de marcar aprovação.

Não basta alterar o marcador para `aprovada`: ele representa a conclusão dessa revisão.
