# Auditoria de aderência ao enunciado

Data da conferência: 11/11/2026. Janela de referência solicitada: 11/11/2026 a 13/11/2026. Fonte principal: PDF Projeto Semestral - TimeSlot; a apresentação inicial é apenas referência de produto.

## Parecer

A entrega é parcialmente conforme. A estrutura textual do PDF está presente, mas o projeto ainda não atende integralmente às exigências de execução, publicação e evidências da squad. Os 31/34 pontos concluídos no Jira representam avanço do backlog, não uma nota de conformidade.

| Item do enunciado | Resultado | Evidência ou pendência |
| --- | --- | --- |
| 3.1 Capa | Parcial | Squad, integrantes, papéis e links presentes. Sem URL publicada; acesso do professor ao Jira não comprovado. |
| 3.2 Discovery | Presente no documento | Nove blocos do Lean Canvas e duas personas descritos. São hipóteses; validação com negócio real não foi comprovada. O enunciado não exige explicitamente entrevistas. |
| 3.3 MVP | Presente | Story Map, linha de corte e justificativas escritos; fluxo em quatro etapas. |
| 3.4 Backlog | Presente | Quatro épicos, 13 histórias no formato solicitado, critérios de aceite, MoSCoW, estimativas e duas versões no Jira. |
| 3.5 Sprints | Parcial | Goals, itens, pontos e resultados presentes. Capacidade é hipótese e não há Planning Poker coletivo comprovado. |
| 3.6 Kanban | Parcial | Colunas e WIP manual documentados. Não há Dailies da squad nem histórico diário de cumprimento do fluxo. WIP automático não é exigência do enunciado. |
| 3.7 Execução técnica | Parcial | API, interface, SQLite, testes, CI e DoD presentes. Revisões são assistidas e feitas pela mesma conta autora; sem revisão cruzada comprovada. Deploy adiado e falha funcional reproduzida. |
| 3.8 Métricas e retrospectiva | Parcial | Pontos e checkpoints reais presentes. Não há histórico de dois ciclos completos da squad nem ata de retrospectiva coletiva. |
| 3.9 Aprendizados | Presente | Um aprendizado técnico e um de processo escritos. |
| Formato | Conforme | PDF único, texto pesquisável, capturas acompanhadas de descrição, arquivo abaixo de 50 MB. |

## Verificação técnica executada

- `npm test`: 20 testes existentes aprovados.
- `npm run check`: aprovado.
- `npm run build`: aprovado.
- Jira consultado ao vivo: 4 épicos e 13 histórias; 31 de 34 pontos do MVP concluídos. Publicação pendente; WhatsApp automático fora do MVP.
- CI dos PRs de implementação tem execuções aprovadas. A execução documental 43095197337 permanecia na fila na consulta desta auditoria.

## Falha funcional reproduzida - P2

Em `lib/api.mjs`, o status da reserva é lido antes da transação de reagendamento e não é revalidado dentro dela.

Reprodução em SQLite na memória, sem alterar os dados do usuário:

1. Criar uma reserva de Corte às 09:00.
2. Executar simultaneamente `PATCH /api/bookings/:id` para 10:00 e `DELETE /api/bookings/:id`, usando a chave da reserva.
3. As duas respostas são HTTP 200.
4. O registro termina com `status=cancelled` e `start=600`, mas `occupancy` mantém os minutos 600 e 615 ocupados.

O resultado foi reproduzido nas duas ordens de chamada. Isso impede outro cliente de reservar um horário que deveria estar livre. É necessário garantir a consistência entre status e ocupação na mesma operação atômica e acrescentar um teste de regressão antes da publicação. Nenhuma correção foi aplicada ao código nesta auditoria.

## Datas e limites da validação

Os ciclos de referência passam a ser 11/11 (base) e 11 a 13/11 (consolidação). Essa alteração não cria reuniões, commits ou medições passadas: os registros comprovados continuam com suas datas reais. Os marcos de referência são 11/11 (API) e 13/11 (MVP), sem declarar publicação realizada.

WhatsApp automático, React e múltiplos profissionais não são entregas obrigatórias especificadas no PDF. Não foram tratados como falhas por estarem no exemplo inicial ou por preferência de tecnologia.

## Pendências para aprovação integral

1. Corrigir e testar a falha de concorrência.
2. Publicar uma funcionalidade em produção ou staging quando o responsável autorizar retomar essa etapa.
3. Confirmar o acesso do professor ao Jira e aos demais links necessários.
4. A squad validar capacidade e estimativas, realizar revisão cruzada e registrar suas cerimônias e retrospectiva reais.
