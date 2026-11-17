# Auditoria de aderência ao enunciado

Data da conferência: 11/11/2026. Janela de referência solicitada: 11/11/2026 a 13/11/2026. Fonte principal: PDF Projeto Semestral - TimeSlot; a apresentação inicial é apenas referência de produto.

## Parecer

A auditoria inicial de 11/11/2026 registrou 31/34 pontos concluídos no backlog inicial e apontou a falha de concorrência e a publicação pendente como próximos passos, ambos resolvidos nos ciclos seguintes (`SCRUM-22`, `SCRUM-2`, `SCRUM-33`, `SCRUM-3` e `SCRUM-19`).

| Item do enunciado | Resultado | Evidência ou pendência |
| --- | --- | --- |
| 3.1 Capa | Conforme | Squad, integrantes, papéis, repositório público e URL em produção (`https://www.manage-control-dev.com.br/`). |
| 3.2 Discovery | Conforme | Nove blocos do Lean Canvas e duas personas descritos com proposta de valor e fluxos do MVP. |
| 3.3 MVP | Conforme | Story Map, linha de corte e justificativas escritos; fluxo em quatro etapas. |
| 3.4 Backlog | Conforme | Quatro épicos, histórias no formato solicitado, critérios de aceite, MoSCoW, estimativas e versões no Jira. |
| 3.5 Sprints | Conforme | Goals, itens, pontos e checkpoints de encerramento registrados nos ciclos do Jira. |
| 3.6 Kanban | Conforme | Colunas e limite WIP manual documentados, com fluxo contínuo por cartão. |
| 3.7 Execução técnica | Parcial (Marco 11/11) | API, interface, testes, CI e DoD presentes na base inicial; falha P2 identificada para correção na etapa seguinte e deploy concluído na entrega final. |
| 3.8 Métricas e retrospectiva | Conforme | Story points, Velocity, Burndown e retrospectiva Start/Stop/Continue registrados. |
| 3.9 Aprendizados | Conforme | Aprendizados técnicos e de processo consolidados com base na execução real do projeto. |
| Formato | Conforme | PDF único, texto pesquisável, capturas acompanhadas de descrição, arquivo abaixo de 50 MB. |

## Verificação técnica executada no marco inicial (11/11/2026)

- `npm test`: 20 testes existentes aprovados na base inicial.
- `npm run check`: aprovado.
- `npm run build`: aprovado.
- Jira consultado na data: 4 épicos e 13 histórias iniciais; 31 de 34 pontos do backlog inicial concluídos; WhatsApp automático fora do MVP.
- CI dos PRs de implementação tem execuções aprovadas.

## Falha funcional reproduzida - P2

Em `lib/api.mjs`, o status da reserva é lido antes da transação de reagendamento e não é revalidado dentro dela.

Reprodução em SQLite na memória, sem alterar os dados do usuário:

1. Criar uma reserva de Corte às 09:00.
2. Executar simultaneamente `PATCH /api/bookings/:id` para 10:00 e `DELETE /api/bookings/:id`, usando a chave da reserva.
3. As duas respostas são HTTP 200.
4. O registro termina com `status=cancelled` e `start=600`, mas `occupancy` mantém os minutos 600 e 615 ocupados.

O resultado foi reproduzido nas duas ordens de chamada. Isso impede outro cliente de reservar um horário que deveria estar livre. É necessário garantir a consistência entre status e ocupação na mesma operação atômica e acrescentar um teste de regressão antes da publicação. Nenhuma correção foi aplicada ao código nesta auditoria.

## Datas e limites da validação

Os ciclos de referência passaram para 11/11 (base) e consolidação subsequente até a entrega final em produção (`https://www.manage-control-dev.com.br/`), mantendo datas reais de execução.

WhatsApp automático e múltiplos profissionais não são entregas obrigatórias para o MVP. Posteriormente à auditoria de 11/11, a squad implementou a correção da falha P2 (`SCRUM-22`), a separação de áreas (`SCRUM-28` a `SCRUM-32`), a reescrita em FastAPI + MySQL + React (`SCRUM-2` e `SCRUM-33`) e a publicação contínua em VPS (`SCRUM-3` e `SCRUM-19`).

## Ações encaminhadas (concluídas nos ciclos seguintes)

1. Corrigir e testar a falha de concorrência (concluído em `SCRUM-22` / PR #7).
2. Publicar a aplicação em produção com banco persistente (concluído em `https://www.manage-control-dev.com.br/`).
3. Disponibilizar repositório público no GitHub (`https://github.com/eduardo-zucco/fadeup-timeslot`) e links no Jira.
4. Registrar métricas, revisões nos PRs e lições aprendidas no relatório final atualizado.
