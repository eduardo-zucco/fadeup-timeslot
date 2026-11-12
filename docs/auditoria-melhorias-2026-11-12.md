# Auditoria complementar do MVP — 12/11/2026

Esta revisão melhora o aplicativo existente, com Node.js 24, SQLite e HTML/CSS/JavaScript, sem novas dependências de execução. A linha de corte continua sendo uma unidade e um profissional, com catálogo, disponibilidade, reserva, reagendamento, cancelamento e operação da agenda. O enunciado TimeSlot é a referência de entrega; a apresentação inicial é somente exemplo de produto.

## Resultado técnico

| Achado | Correção e verificação | Jira / PR |
| --- | --- | --- |
| Cancelamento e reagendamento simultâneos podiam deixar ocupação fantasma | Gatilhos no banco mantêm consistência; migração incremental para D1; regressões nas duas ordens e teste de migração/reabertura | [SCRUM-22](https://eduardobarreto879.atlassian.net/browse/SCRUM-22) / [PR 7](https://github.com/eduardo-zucco/fadeup-timeslot/pull/7) |
| API não distinguia bem falha interna, dados inválidos e disponibilidade da reserva | Erros de campo, HTTP 500 para falhas internas, rotas validadas; agenda histórica até 31 dias; reagendamento autenticado usa duração original | [SCRUM-23](https://eduardobarreto879.atlassian.net/browse/SCRUM-23) / [PR 8](https://github.com/eduardo-zucco/fadeup-timeslot/pull/8) |
| Formulário perdia dados ao voltar e a reserva tinha pouco contexto | Quatro etapas, resumo, horários por período, rascunho em memória, confirmação e tratamento de conflito | [SCRUM-24](https://eduardobarreto879.atlassian.net/browse/SCRUM-24) / [PR 9](https://github.com/eduardo-zucco/fadeup-timeslot/pull/9) |
| Histórico misturava situações e dependia do catálogo atual | Próximos/passados/cancelados, ações só no futuro, link recuperável e reagendamento com dados originais | [SCRUM-25](https://eduardobarreto879.atlassian.net/browse/SCRUM-25) / [PR 10](https://github.com/eduardo-zucco/fadeup-timeslot/pull/10) |
| Operador tinha pouca navegação e digitava bloqueios sem consultar disponibilidade | Dia/semana, anterior/próximo/hoje, agrupamento e filtro; bloqueios livres; encaixe retorna à agenda; catálogo pode adicionar/remover serviços | [SCRUM-26](https://eduardobarreto879.atlassian.net/browse/SCRUM-26) / [PR 11](https://github.com/eduardo-zucco/fadeup-timeslot/pull/11) |
| Pipeline sem relatório e limite de execução | CI em push/PR, Node 24, instalação, 30 testes, sintaxe, build, JUnit e artefatos por 14 dias; timeout de 10 minutos e cancelamento de execuções obsoletas | [SCRUM-27](https://eduardobarreto879.atlassian.net/browse/SCRUM-27) / [PR 12](https://github.com/eduardo-zucco/fadeup-timeslot/pull/12) |

O envio de formulário impede cliques repetidos e troca de navegação enquanto a gravação está pendente. Estados de carregamento, vazio, erro e tentativa novamente aparecem nos fluxos de consulta. Dados dinâmicos são escapados no HTML; datas e horários usam o fuso de São Paulo. Ações possuem foco visível, rótulos e estados acessíveis; a confirmação de cancelamento é um diálogo com opção inicial de manter a reserva.

## Validação executada

- `npm run test:ci`: 30 testes aprovados, nenhum ignorado; [JUnit local](../evidence/melhorias-2026-11-12/testes-junit.xml).
- `npm run check`, `npm run build` e `git diff --check`: aprovados.
- Requisições HTTP reais: autorização administrativa, descarte de identidade forjada, assets do módulo, criar → reagendar → consultar → cancelar → reutilizar horário.
- SQLite: rollback de transação, duas ordens de cancelar/reagendar concorrentes e migração do esquema anterior preservando dados após reabertura.
- Worker: interface, módulo auxiliar e API exercitados no artefato gerado; isso não declara publicação nem valida um D1 remoto.
- Navegador local: serviço → amanhã às 09h → formulário; voltar/avançar preservou nome, telefone e consentimento; reserva confirmada.
- Navegador local: reagendamento de 09h para 10h, cancelamento pelo diálogo e retorno ao histórico.
- Navegador local: bloqueio de 12h às 13h, encaixe às 14h, retorno à agenda e visão semanal; adicionar/remover serviço e salvar configurações.
- Conflito real: outra requisição reservou 09h depois da seleção no navegador. O envio recebeu HTTP 409, atualizou os horários e manteve os dados. Foi possível escolher 10h e confirmar sem redigitar.
- Responsividade: 1280×900 e 390×844; largura de rolagem não excedeu a janela nas telas verificadas. O tamanho original do navegador foi restaurado ao final.

Os testes de falha interna emitem intencionalmente `request_failed test database failure`. Isso verifica o retorno HTTP 500 e não representa falha da suíte.

## Capturas reais

Banco isolado `.sites-runtime/qa-2026-11-12.sqlite`, com nomes e telefone fictícios. Nenhum dado da agenda principal foi alterado nos testes de navegador.

| Captura | O que demonstra |
| --- | --- |
| [Agendamento desktop](../evidence/melhorias-2026-11-12/01-agendamento-desktop.jpg) | Hierarquia visual, serviço selecionado e resumo lateral |
| [Agendamento mobile](../evidence/melhorias-2026-11-12/02-agendamento-mobile.jpg) | Layout em uma coluna com navegação e botões legíveis |
| [Painel semanal](../evidence/melhorias-2026-11-12/03-painel-semanal.jpg) | Bloqueio, encaixe, métricas e agrupamento por data |
| [Painel mobile](../evidence/melhorias-2026-11-12/04-painel-mobile.jpg) | Controles e métricas reorganizados para tela pequena |
| [Horários após conflito](../evidence/melhorias-2026-11-12/05-conflito-mobile.jpg) | Disponibilidade atualizada retirou o horário de 09h |
| [Histórico](../evidence/melhorias-2026-11-12/06-historico.jpg) | Próximos/cancelados e aviso de falha parcial sem apagar chave |

O aviso de uma reserva não consultada no histórico corresponde a uma chave antiga do navegador que não pertence ao novo banco isolado. A reserva válida continua acessível. A aplicação mantém a chave e mostra tentativa novamente, em vez de apagar dados silenciosamente.

## Jira, revisão e rastreabilidade

Foram acrescentados seis itens, SCRUM-22 a SCRUM-27, com critérios de aceite, épico, pontos e versão `fadeUp v1.0 - MVP`, na sprint ativa 4. Total: 15 pontos de refinamento; são estimativas técnicas propostas, não uma sessão de Planning Poker da squad. Os itens foram atribuídos à conta Jira conectada, cujo nome exibido é Eduardo Barreto. Os papéis acadêmicos informados da squad permanecem os mesmos.

O [snapshot de revisão](../evidence/melhorias-2026-11-12/jira-revisao.json) foi capturado antes do fechamento da última tarefa: cinco concluídas e SCRUM-27 em análise. Os comentários de conclusão no Jira registram PR, CI e verificação por fase. O estado final deve ser consultado nos links ao vivo. O quadro continua com To Do, In Progress, In Review e Done; a política WIP é manual, não um limite imposto pelo Jira. O trabalho de refinamento foi sequencial, com no máximo uma implementação e uma revisão pendentes.

As revisões nos PRs são identificadas como **revisão técnica assistida por Codex**, pela mesma conta autora. Não houve aprovação independente de Lucas, Felipe ou Fausto e isso não é declarado. Datas são reais; esta revisão não cria duas semanas de histórico nem cerimônias passadas.

## Limites preservados

A auditoria funcional não substitui teste de carga, teste com leitores de tela ou validação da squad com usuários reais. O teste administrativo no navegador usou o modo local; o modo de chave fora da máquina foi verificado por HTTP automatizado. Nenhum deploy foi realizado. Publicação, acesso do professor e revisão cruzada da squad continuam pendências anteriores para conformidade integral com o enunciado.

O [relatório anterior](auditoria-escopo.md) e o PDF são um registro congelado de 11/11; a falha técnica descrita lá foi corrigida nesta revisão. Nenhum pagamento, WhatsApp automático, múltiplos profissionais, autenticação de clientes ou hospedagem foram adicionados.

SHA-256 do PDF preservado, verificado em 12/11/2026:

`CE06AA450B26ED9F970C06069DB19A0661827F6501AEA8CBF1CDE578B8EE2CF0`
