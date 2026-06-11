# Melhorias do Radar DF

Este documento organiza melhorias recomendadas para evoluir o produto com foco em impacto para o usuário, gestão e confiabilidade técnica.

## Prioridade Alta (impacto imediato)

- **Onboarding guiado:** incluir tour rápido no primeiro acesso (Painel, Demandas, Importação, Relatórios).
- **Geração de dados demo no sistema:** botão para popular ambiente com dados de demonstração sem execução manual.
- **Busca global:** campo único para encontrar demanda, cidade, tema, solicitante e ID.
- **Filtros salvos:** permitir salvar e reaplicar combinações de filtros frequentes.
- **Indicadores acionáveis:** destacar demandas críticas e atrasadas com orientação de ação.

## Prioridade Média (produtividade e gestão)

- **Fluxo de status padronizado:** reforçar trilha de ciclo de vida da demanda.
- **Notificações por prazo:** alertas de vencimento (ex.: D-2) e atraso.
- **Linha do tempo da demanda:** histórico cronológico de alterações e responsáveis.
- **Importação assistida:** validação com sugestões de correção para cidade/tema.
- **Relatórios executivos:** exportação consolidada com KPIs, ranking e recomendações.

## Prioridade Técnica (estabilidade e segurança)

- **CI completa:** lint, testes e build em todo push/PR.
- **Observabilidade:** logs estruturados, rastreamento de erros e monitoramento.
- **Proteções de segurança:** rate limit, endurecimento de autenticação e revisão de permissões.
- **Backup e restauração:** rotina automatizada com teste recorrente de restore.
- **Ambientes separados:** dev, staging e produção para reduzir risco operacional.

## UX e Acessibilidade (ganhos rápidos)

- **Feedback visual melhorado:** skeletons e estados de carregamento mais claros.
- **Empty states orientativos:** instruções objetivas quando não houver dados.
- **Padronização de idioma:** manter 100% PT-BR em textos, erros e exemplos.
- **Acessibilidade:** contraste adequado, foco visível, labels e navegação por teclado.

## Próximos passos sugeridos

1. Executar os 3 quick wins de maior impacto:
   - onboarding guiado;
   - busca global;
   - filtros salvos.
2. Definir responsáveis e prazos por bloco (Alta, Média, Técnica, UX).
3. Revisar este backlog semanalmente e reordenar por valor entregue.
