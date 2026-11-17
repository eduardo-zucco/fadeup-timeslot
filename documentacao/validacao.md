# Validação da entrega

Data: 11/11/2026.

- 20 testes aprovados com Node 24: API, transações SQLite, autorização, Worker e servidor HTTP público.
- `npm run check` e `npm run build` aprovados.
- PRs #1 a #4 integrados com CI aprovado e revisão técnica registrada nos PRs e no Jira.
- Fluxo de reserva executado no navegador: serviço, horário, dados e confirmação. Reserva de teste visível no painel.
- Capturas reais em `documentacao/evidencias/`; exports do Jira sem reconstituição de telas da ferramenta.
- PDF completo com texto pesquisável, seções 3.1 a 3.9, histórias do backlog e revisão visual das páginas sem sobreposição ou corte de tabelas.

## Evolução e publicação

A falha de concorrência inicialmente identificada entre cancelamento e reagendamento simultâneos foi corrigida e coberta por regressões automatizadas nos PRs seguintes (SCRUM-22 a SCRUM-32), seguida pela migração para Python (FastAPI + Clean Architecture + MySQL + Alembic + JWT em 2 camadas) e frontend React/TypeScript (SCRUM-2, SCRUM-33 e SCRUM-3).

- Aplicação publicada em produção em `https://www.manage-control-dev.com.br/` com VPS, Docker Compose, Nginx e HTTPS (Let's Encrypt).
- Repositório GitHub público em `https://github.com/eduardo-zucco/fadeup-timeslot` e quadro Jira ativo no projeto `SCRUM`.
- Para atualizar o relatório PDF após novas entregas, atualize `documentacao/evidencias/deploy.json` e `documentacao/evidencias/jira-final.json` e execute `ferramentas/gerar-relatorio.py` com Python e ReportLab.
