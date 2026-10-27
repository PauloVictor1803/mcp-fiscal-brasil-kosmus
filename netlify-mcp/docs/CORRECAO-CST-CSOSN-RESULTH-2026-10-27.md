# Correção de conhecimento: CST/CSOSN no Resulth

Publicada em 27/10/2026 na base Tina, por solicitação do Paulo.

## Problema corrigido

Duas páginas de entrada de NF via XML continham uma regra absoluta de exclusividade entre CST e CSOSN, sem distinguir os campos do Resulth da tributação transmitida no documento. Isso contrariava a particularidade informada pelo Paulo e já descrita na skill fiscal: algumas rotinas podem exigir CST no Simples Nacional e CSOSN no Regime Normal.

## Escopo publicado

- procedimentos/entrada-de-nf-via-xml-windows.md
- procedimentos/proc-entrada-de-nf-via-xml-windows.md

Foi substituída apenas a subseção B sobre CST/CSOSN e atualizada a data dos documentos. As demais seções, mídias e diferenças próprias de cada página foram preservadas. Nenhum prompt, skill, modelo ou versão de agente foi alterado. As duas páginas foram mantidas; não houve exclusão de documentos.

## Texto inserido

### B) CST e CSOSN: particularidade dos campos no Resulth

No Resulth, algumas rotinas podem exigir o preenchimento de CST para uma empresa do Simples Nacional e de CSOSN para uma empresa do Regime Normal. A tela também pode apresentar os dois campos. Essa é uma particularidade do sistema: a existência ou obrigatoriedade do campo, sozinha, não determina o enquadramento tributário nem qual informação será transmitida na NF-e.

* Identifique a rotina, a tela, o tributo e a finalidade do campo. Siga a documentação específica do Resulth para o preenchimento e preserve o formato e os zeros exigidos pelo campo.
* Não recuse a orientação nem transfira o atendimento apenas porque a rotina pede CST no Simples Nacional ou CSOSN no Regime Normal. Não substitua um campo pelo outro apenas por causa do regime da empresa.
* Não afirme que o valor informado irá diretamente para o XML ou será ignorado sem confirmar o comportamento documentado da rotina e conferir o documento gerado.
* Na entrada de XML, diferencie o regime do fornecedor e os dados do documento recebido do regime e dos campos de cadastro da própria empresa.
* Nenhum código é padrão universal para destravar a tela. A consulta da descrição de um código não valida sua aplicação; confirme o enquadramento com a contabilidade antes da emissão ou alteração fiscal.

---


## Verificação e controles

- Commit de publicação da base Tina: `5a1a0b0fa7343be0ee718365a86f73a7c10c03e4`.
- Resultado do indexador: processed=2, indexed=2, unchanged=0, error=0.
- Leitura posterior confirmou os dois conteúdos ativos e ausência de edições pendentes nesses caminhos.
- Busca textual pela antiga frase absoluta de exclusividade: nenhum resultado após publicação. Isso não equivale a teste semântico de todas as perguntas possíveis.
- Duas cópias locais atualizadas, com backups internos. Auditoria e metadados registrados, melhoria MELH-037 concluída.
- Google Sheets: sincronização das sete abas concluída, incluindo Auditoria e Melhorias e Backlog. Excel local Relatorio_ATS_v3.xlsx atualizado.
- Nenhum novo teste pago de modelo foi executado para esta correção. As quatro execuções autorizadas anteriormente já haviam sido consumidas e estão documentadas no relatório de testes da Tina 68.

## Próxima validação de comportamento

Conferir uma conversa nova na qual uma empresa do Regime Normal informa que a tela exige CSOSN e uma empresa do Simples informa que a tela exige CST. Verificar que a Tina consulta a rotina, reconhece a particularidade e não afirma transmissão ou descarte no XML sem fundamento. Um atendimento antigo pode reutilizar texto anterior já presente no histórico. Nova rodada automatizada com modelo precisa de autorização de escopo e custo.

Esta correção remove o conflito localizado na base; não comprova que todas as respostas futuras respeitarão a orientação. Não torna nenhum código um padrão universal de preenchimento.
